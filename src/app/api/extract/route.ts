import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import pdfParse from "pdf-parse";
import { deductCredit } from "@/lib/credits";
import type { ExtractedRow, LineItem } from "@/types";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

const EXTRACT_SYSTEM = `You are the VeloDoc Architect. Extract all data from this document into a clean JSON format.

Reply with ONLY a valid JSON object (no markdown, no code block). Use exactly these top-level keys:
- documentType (string): one of "Invoice", "BOL", or "Contract"
- vendorName (string)
- totalAmount (string, e.g. "1,234.56" or "€ 99.00")
- date (string, e.g. "2024-01-15" or "Jan 15, 2024")
- lineItems (array of objects)

Each item in lineItems must have:
- sku (string): part number, SKU, item code, or catalog number
- partDescription (string): full description of the part or service
- unitCost (string): price per unit
- quantity (string, optional)
- lineTotal (string, optional): extended line total if present

Identify if the document is an Invoice, BOL, or Contract. Extract every line item, SKU, and total. If a value cannot be determined, use empty string "". For lineItems, if there are no line items, return an empty array.`;

export async function POST(request: NextRequest) {
  let userId: string | null;
  try {
    const authResult = await auth();
    userId = authResult.userId;
  } catch (authErr) {
    const msg = authErr instanceof Error ? authErr.message : String(authErr);
    return NextResponse.json(
      { error: `Auth failed: ${msg}. Check Clerk keys.` },
      { status: 500 }
    );
  }
  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to use the Architect." },
      { status: 401 }
    );
  }

  const openai = getOpenAI();
  if (!openai) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured. Add it in Netlify → Environment variables." },
      { status: 500 }
    );
  }

  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (formErr) {
      const msg = formErr instanceof Error ? formErr.message : "Invalid request body";
      return NextResponse.json(
        { error: `Could not read upload: ${msg}. Try a smaller PDF.` },
        { status: 400 }
      );
    }
    const file = formData.get("file") as File | null;
    if (!file || file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Please upload a PDF file." },
        { status: 400 }
      );
    }
    console.log("[extract] File received:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    let result: { ok: boolean; remaining: number };
    try {
      result = await deductCredit(userId);
    } catch (creditsErr) {
      const msg = creditsErr instanceof Error ? creditsErr.message : String(creditsErr);
      return NextResponse.json(
        { error: `Credits check failed: ${msg}. Check DATABASE_URL and Prisma.` },
        { status: 500 }
      );
    }
    if (!result.ok) {
      return NextResponse.json(
        { error: "No credits left. Buy more credits to extract." },
        { status: 402 }
      );
    }

    let text: string;
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const pdfData = await pdfParse(buffer);
      text = pdfData.text?.trim() || "";
    } catch (pdfErr) {
      const msg = pdfErr instanceof Error ? pdfErr.message : String(pdfErr);
      return NextResponse.json(
        { error: `PDF parse failed: ${msg}. Try a different PDF.` },
        { status: 400 }
      );
    }
    console.log("[extract] PDF parsed:", {
      textLength: text.length,
      preview: text.slice(0, 200) + (text.length > 200 ? "..." : ""),
    });
    if (!text) {
      const { addCredits } = await import("@/lib/credits");
      await addCredits(userId, 1);
      return NextResponse.json(
        { error: "No text could be extracted from this PDF." },
        { status: 400 }
      );
    }

    let completion: Awaited<ReturnType<typeof openai.chat.completions.create>>;
    try {
      completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: EXTRACT_SYSTEM },
        {
          role: "user",
          content: `You are the VeloDoc Architect. Extract all data from this document into a clean JSON format. Identify if it is an Invoice, BOL, or Contract. Extract every line item, SKU, and total.\n\nDocument text:\n\n${text.slice(0, 12000)}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });
    } catch (openaiErr) {
      const msg = openaiErr instanceof Error ? openaiErr.message : String(openaiErr);
      const isQuota = /429|quota|exceeded/i.test(msg);
      if (isQuota) {
        const { addCredits } = await import("@/lib/credits");
        await addCredits(userId, 1); // refund: extraction didn't complete
        return NextResponse.json(
          {
            error:
              "AI extraction is temporarily unavailable (provider quota exceeded). Check your OpenAI account billing at platform.openai.com and try again later. Your credit was not used.",
          },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: `OpenAI API failed: ${msg}. Check OPENAI_API_KEY and rate limits.` },
        { status: 500 }
      );
    }

    const raw = completion.choices[0]?.message?.content?.trim();
    console.log("[extract] AI response:", {
      hasContent: !!raw,
      length: raw?.length ?? 0,
      preview: raw ? raw.slice(0, 300) + (raw.length > 300 ? "..." : "") : null,
    });
    if (!raw) {
      const { addCredits } = await import("@/lib/credits");
      await addCredits(userId, 1);
      return NextResponse.json(
        { error: "AI did not return extraction data." },
        { status: 500 }
      );
    }

    let parsed: {
      documentType?: string;
      vendorName?: string;
      totalAmount?: string;
      date?: string;
      lineItems?: Array<{
        sku?: string;
        partDescription?: string;
        unitCost?: string;
        quantity?: string;
        lineTotal?: string;
      }>;
    };
    try {
      parsed = JSON.parse(raw);
    } catch (parseErr) {
      const { addCredits } = await import("@/lib/credits");
      await addCredits(userId, 1);
      const msg = parseErr instanceof Error ? parseErr.message : "Invalid JSON";
      return NextResponse.json(
        {
          error: `AI returned invalid JSON: ${msg}`,
          supabaseErrorCode: null,
          supabaseErrorMessage: null,
        },
        { status: 500 }
      );
    }

    const docType = parsed.documentType?.trim();
    const documentType =
      docType === "Invoice" || docType === "BOL" || docType === "Contract"
        ? docType
        : undefined;

    const lineItems: LineItem[] = Array.isArray(parsed.lineItems)
      ? parsed.lineItems.map((li) => ({
          sku: String(li.sku ?? "").trim(),
          partDescription: String(li.partDescription ?? "").trim(),
          unitCost: String(li.unitCost ?? "").trim(),
          quantity: li.quantity != null ? String(li.quantity).trim() : undefined,
          lineTotal: li.lineTotal != null ? String(li.lineTotal).trim() : undefined,
        }))
      : [];

    const row: ExtractedRow = {
      vendorName: String(parsed.vendorName ?? "").trim(),
      totalAmount: String(parsed.totalAmount ?? "").trim(),
      date: String(parsed.date ?? "").trim(),
      documentType,
      lineItems: lineItems.length > 0 ? lineItems : undefined,
    };

    const supabase = getSupabase();
    if (supabase) {
      const payload = {
        user_id: userId,
        file_name: file.name,
        extracted_data: row as unknown as Record<string, unknown>,
      };
      const { data: saved, error: insertError } = await supabase
        .from("documents")
        .insert(payload)
        .select("extracted_data")
        .single();

      console.log("[extract] Supabase insert result:", {
        success: !insertError && !!saved?.extracted_data,
        error: insertError
          ? {
              code: insertError.code,
              message: insertError.message,
              details: insertError.details,
            }
          : null,
        hasSavedData: !!saved?.extracted_data,
      });

      if (insertError || !saved?.extracted_data) {
        const code = insertError?.code ?? "UNKNOWN";
        const message = insertError?.message ?? "No data returned.";
        const isTableMissing = code === "PGRST205" || /table.*not found|schema cache/i.test(message);
        console.error("Supabase documents insert failed:", {
          code,
          message,
          details: insertError?.details,
        });
        return NextResponse.json({
          extracted: row,
          remaining: result.remaining,
          saveFailed: true,
          saveError: isTableMissing
            ? "Cloud save is optional. The 'documents' table was not found in Supabase."
            : "Failed to save to database.",
          supabaseErrorCode: code,
          supabaseErrorMessage: message,
        });
      }
      const extracted = saved.extracted_data as ExtractedRow;
      return NextResponse.json({
        extracted,
        remaining: result.remaining,
      });
    }

    // Supabase not configured: still return extracted data so extraction works
    return NextResponse.json({
      extracted: row,
      remaining: result.remaining,
    });
  } catch (err) {
    console.error("Extract error:", err);
    const message =
      err instanceof Error
        ? `${err.name}: ${err.message}`
        : `Error: ${String(err)}`;
    return NextResponse.json(
      {
        error: `Extract failed: ${message}. Check OPENAI_API_KEY, DATABASE_URL, and Netlify function logs.`,
        supabaseErrorCode: null,
        supabaseErrorMessage: null,
      },
      { status: 500 }
    );
  }
}
