import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import pdfParse from "pdf-parse";
import { deductCredit } from "@/lib/credits";
import type { ExtractedRow, LineItem } from "@/types";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

const EXTRACT_SYSTEM = `You extract structured data from PDF document text. The documents are from garage door, service, and logistics industries (invoices, bills of lading, material quotes, work orders).

Reply with ONLY a JSON object (no markdown, no code block). Use exactly these top-level keys:
- vendorName (string)
- totalAmount (string, e.g. "1,234.56" or "€ 99.00")
- date (string, e.g. "2024-01-15" or "Jan 15, 2024")
- lineItems (array of objects)

Each item in lineItems must have:
- sku (string): part number, SKU, item code, or catalog number
- partDescription (string): full description of the part or service (e.g. "Torsion Spring 1.75x24", "Freight")
- unitCost (string): price per unit (e.g. "12.50", "0.00")
- quantity (string, optional): quantity (e.g. "2", "1")
- lineTotal (string, optional): extended line total if present

Extract every line item you can find—every part, screw, spring, labor line, and freight. If a value cannot be determined, use empty string "". For lineItems, if there are no clear line items, return an empty array.`;

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to use the Architect." },
      { status: 401 }
    );
  }

  const openai = getOpenAI();
  if (!openai) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
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

    const result = await deductCredit(userId);
    if (!result.ok) {
      return NextResponse.json(
        { error: "No credits left. Buy more credits to extract." },
        { status: 402 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text?.trim() || "";
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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: EXTRACT_SYSTEM },
        {
          role: "user",
          content: `Extract vendor, total, date, and all line items (SKUs, part descriptions, unit costs, quantities) from this document. Focus on garage door and logistics terminology.\n\n${text.slice(0, 12000)}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

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

    const parsed = JSON.parse(raw) as {
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
      lineItems: lineItems.length > 0 ? lineItems : undefined,
    };

    const supabase = getSupabase();
    if (supabase) {
      const { data: saved, error: insertError } = await supabase
        .from("documents")
        .insert({
          user_id: userId,
          file_name: file.name,
          extracted_data: row as unknown as Record<string, unknown>,
        })
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
        console.error("Supabase documents insert failed:", {
          code,
          message,
          details: insertError?.details,
        });
        return NextResponse.json(
          {
            error: "Failed to save extraction to database.",
            supabaseErrorCode: code,
            supabaseErrorMessage: message,
          },
          { status: 500 }
        );
      }
      const extracted = saved.extracted_data as ExtractedRow;
      return NextResponse.json({
        extracted,
        remaining: result.remaining,
      });
    }

    return NextResponse.json({
      extracted: row,
      remaining: result.remaining,
    });
  } catch (err) {
    console.error("Extract error:", err);
    const message =
      err instanceof Error ? err.message : "Extraction failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
