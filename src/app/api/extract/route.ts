import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import pdfParse from "pdf-parse";
import { Resend } from "resend";
import { getSupabase } from "@/lib/supabase";
import {
  getCreditsForAuth,
  ensureWelcomeCredits,
  deductCreditsForAuth,
  addCreditsForAuth,
} from "@/lib/credits-auth";
import { insertApiLog } from "@/lib/api-log";
import { identifyDocumentType } from "@/lib/identify-document-type";
import type { ExtractedRow, LineItem } from "@/types";

const EXTRACT_ENDPOINT = "/api/extract";
const FREE_MONTHLY_EXTRACT_LIMIT = 5;

function startOfCurrentMonthISO(): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

async function countFreeExtractionsThisMonth(
  supabase: ReturnType<typeof getSupabase>,
  userId: string
): Promise<number> {
  if (!supabase) return 0;
  try {
    const { count, error } = await supabase
      .from("api_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("endpoint", EXTRACT_ENDPOINT)
      .eq("status_code", 200)
      .gte("created_at", startOfCurrentMonthISO());
    if (error) return 0;
    return typeof count === "number" ? count : 0;
  } catch {
    return 0;
  }
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
- referenceNumber (string, optional): for BOLs/shipping docs—pro number, load ID, or reference #
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
  let orgId: string | null | undefined;
  try {
    const authResult = await auth();
    userId = authResult.userId;
    orgId = authResult.orgId ?? null;
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

  const supabase = getSupabase();
  await ensureWelcomeCredits(userId, orgId);

  let planType: string | null = null;
  if (supabase) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan_type")
        .eq("user_id", userId)
        .maybeSingle();
      planType = (profile as { plan_type?: string } | null)?.plan_type ?? null;
    } catch {
      // ignore
    }
  }

  if (planType === "free") {
    const count = await countFreeExtractionsThisMonth(supabase, userId);
    if (count >= FREE_MONTHLY_EXTRACT_LIMIT) {
      await insertApiLog(supabase, {
        user_id: userId,
        org_id: orgId ?? null,
        endpoint: EXTRACT_ENDPOINT,
        status_code: 402,
        credits_consumed: 0,
      });
      return NextResponse.json(
        {
          error: "Monthly limit reached. Upgrade to Starter for 20 extractions and professional exports.",
          code: "FREE_MONTHLY_LIMIT",
        },
        { status: 402 }
      );
    }
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

    let text: string;
    let numPages: number;
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const pdfData = await pdfParse(buffer);
      text = pdfData.text?.trim() || "";
      numPages = typeof pdfData.numpages === "number" ? pdfData.numpages : 1;
    } catch (pdfErr) {
      const msg = pdfErr instanceof Error ? pdfErr.message : String(pdfErr);
      return NextResponse.json(
        { error: `PDF parse failed: ${msg}. Try a different PDF.` },
        { status: 400 }
      );
    }
    console.log("[extract] PDF parsed:", {
      numPages,
      textLength: text.length,
      preview: text.slice(0, 200) + (text.length > 200 ? "..." : ""),
    });

    const creditsNeeded =
      numPages <= 5 ? 1 : 1 + Math.ceil((numPages - 5) / 5);

    const balance = await getCreditsForAuth(userId, orgId);
    if (balance < creditsNeeded) {
      const paidPlans = ["starter", "pro", "enterprise"];
      if (planType && paidPlans.includes(planType)) {
        const resendKey = process.env.RESEND_API_KEY;
        const billingNotify = process.env.BILLING_NOTIFY_EMAIL ?? process.env.REPLY_TO ?? "billing@velodoc.app";
        const billingFrom = process.env.BILLING_FROM_EMAIL ?? "Alissa Wilson <billing@velodoc.app>";
        if (resendKey) {
          try {
            const resend = new Resend(resendKey);
            await resend.emails.send({
              from: billingFrom,
              to: billingNotify,
              subject: "VeloDoc — Paid plan user attempted extraction with $0 credit balance",
              text: `User ${userId} (plan: ${planType}) attempted to process a file with insufficient credit balance. They may need to buy credits.`,
              html: `<p>User <strong>${userId}</strong> (plan: <strong>${planType}</strong>) attempted to process a file with insufficient credit balance.</p><p>They may need to buy credits.</p>`,
            });
          } catch (err) {
            console.error("[extract] Alissa notification (0 credits) failed:", err);
          }
        }
      }
      await insertApiLog(supabase, {
        user_id: userId,
        org_id: orgId ?? null,
        endpoint: EXTRACT_ENDPOINT,
        status_code: 402,
        credits_consumed: 0,
      });
      return NextResponse.json(
        { error: "Insufficient credits for this document size." },
        { status: 402 }
      );
    }

    let result: { ok: boolean; remaining: number };
    try {
      result = await deductCreditsForAuth(userId, creditsNeeded, orgId);
    } catch (creditsErr) {
      const msg = creditsErr instanceof Error ? creditsErr.message : String(creditsErr);
      await insertApiLog(supabase, {
        user_id: userId,
        org_id: orgId ?? null,
        endpoint: EXTRACT_ENDPOINT,
        status_code: 500,
        credits_consumed: 0,
      });
      return NextResponse.json(
        { error: `Credits check failed: ${msg}. Check DATABASE_URL and Prisma.` },
        { status: 500 }
      );
    }
    if (!result.ok) {
      await insertApiLog(supabase, {
        user_id: userId,
        org_id: orgId ?? null,
        endpoint: EXTRACT_ENDPOINT,
        status_code: 402,
        credits_consumed: 0,
      });
      return NextResponse.json(
        { error: "Insufficient credits for this document size." },
        { status: 402 }
      );
    }

    // Low Credit alert for Enterprise: notify Alissa so she can offer bulk credit packages.
    if (result.remaining <= 5 && supabase) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("plan_type")
          .eq("user_id", userId)
          .maybeSingle();
        const planType = (profile as { plan_type?: string } | null)?.plan_type ?? null;
        if (planType === "enterprise") {
          const resendKey = process.env.RESEND_API_KEY;
          const billingNotify = process.env.BILLING_NOTIFY_EMAIL ?? process.env.REPLY_TO ?? "billing@velodoc.app";
          const billingFrom = process.env.BILLING_FROM_EMAIL ?? "Alissa Wilson <billing@velodoc.app>";
          if (resendKey) {
            const resend = new Resend(resendKey);
            await resend.emails.send({
              from: billingFrom,
              to: billingNotify,
              subject: "VeloDoc — Low Credit alert (Enterprise user)",
              text: `Enterprise user ${userId} has ${result.remaining} credits remaining. Consider reaching out to offer bulk credit packages.`,
              html: `<p>Enterprise user <strong>${userId}</strong> has <strong>${result.remaining}</strong> credits remaining.</p><p>Consider reaching out to offer bulk credit packages.</p>`,
            });
          }
        }
      } catch (err) {
        console.error("[extract] Low Credit (Enterprise) notification failed:", err);
      }
    }

    if (!text) {
      await addCreditsForAuth(userId, creditsNeeded, orgId);
      await insertApiLog(supabase, {
        user_id: userId,
        org_id: orgId ?? null,
        endpoint: EXTRACT_ENDPOINT,
        status_code: 400,
        credits_consumed: 0,
      });
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
        await addCreditsForAuth(userId, creditsNeeded, orgId); // refund
        await insertApiLog(supabase, {
          user_id: userId,
          org_id: orgId ?? null,
          endpoint: EXTRACT_ENDPOINT,
          status_code: 503,
          credits_consumed: 0,
        });
        return NextResponse.json(
          {
            error:
              "AI extraction is temporarily unavailable (provider quota exceeded). Check your OpenAI account billing at platform.openai.com and try again later. Your credit was not used.",
          },
          { status: 503 }
        );
      }
      await insertApiLog(supabase, {
        user_id: userId,
        org_id: orgId ?? null,
        endpoint: EXTRACT_ENDPOINT,
        status_code: 500,
        credits_consumed: 0,
      });
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
      await addCreditsForAuth(userId, creditsNeeded, orgId);
      await insertApiLog(supabase, {
        user_id: userId,
        org_id: orgId ?? null,
        endpoint: EXTRACT_ENDPOINT,
        status_code: 500,
        credits_consumed: 0,
      });
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
      referenceNumber?: string;
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
      await addCreditsForAuth(userId, creditsNeeded, orgId);
      const msg = parseErr instanceof Error ? parseErr.message : "Invalid JSON";
      await insertApiLog(supabase, {
        user_id: userId,
        org_id: orgId ?? null,
        endpoint: EXTRACT_ENDPOINT,
        status_code: 500,
        credits_consumed: 0,
      });
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

    const category = identifyDocumentType(documentType);
    const referenceNumber =
      typeof parsed.referenceNumber === "string" ? parsed.referenceNumber.trim() : undefined;

    const row: ExtractedRow = {
      vendorName: String(parsed.vendorName ?? "").trim(),
      totalAmount: String(parsed.totalAmount ?? "").trim(),
      date: String(parsed.date ?? "").trim(),
      documentType,
      category,
      ...(referenceNumber ? { referenceNumber } : {}),
      lineItems: lineItems.length > 0 ? lineItems : undefined,
    };

    if (supabase) {
      const payload: Record<string, unknown> = {
        user_id: userId,
        file_name: file.name,
        extracted_data: row as unknown as Record<string, unknown>,
        page_count: numPages,
        credit_cost: creditsNeeded,
      };
      if (orgId != null && String(orgId).trim()) payload.org_id = orgId;
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
        await insertApiLog(supabase, {
          user_id: userId,
          org_id: orgId ?? null,
          endpoint: EXTRACT_ENDPOINT,
          status_code: 200,
          credits_consumed: creditsNeeded,
        });
        const freeLimitReachedSaveFail =
          planType === "free" &&
          (await countFreeExtractionsThisMonth(supabase, userId)) >= FREE_MONTHLY_EXTRACT_LIMIT;
        return NextResponse.json({
          extracted: row,
          remaining: result.remaining,
          creditsUsed: creditsNeeded,
          saveFailed: true,
          ...(freeLimitReachedSaveFail ? { monthlyLimitReached: true } : {}),
          saveError: isTableMissing
            ? "Cloud save is optional. The 'documents' table was not found in Supabase."
            : "Failed to save to database.",
          supabaseErrorCode: code,
          supabaseErrorMessage: message,
        });
      }
      const extracted = saved.extracted_data as ExtractedRow;
      await insertApiLog(supabase, {
        user_id: userId,
        org_id: orgId ?? null,
        endpoint: EXTRACT_ENDPOINT,
        status_code: 200,
        credits_consumed: creditsNeeded,
      });
      const freeLimitReached =
        planType === "free" &&
        (await countFreeExtractionsThisMonth(supabase, userId)) >= FREE_MONTHLY_EXTRACT_LIMIT;
      return NextResponse.json({
        extracted,
        remaining: result.remaining,
        creditsUsed: creditsNeeded,
        ...(freeLimitReached ? { monthlyLimitReached: true } : {}),
      });
    }

    // Supabase not configured: still return extracted data so extraction works
    await insertApiLog(supabase, {
      user_id: userId,
      org_id: orgId ?? null,
      endpoint: EXTRACT_ENDPOINT,
      status_code: 200,
      credits_consumed: creditsNeeded,
    });
    const freeLimitReached =
      planType === "free" &&
      (await countFreeExtractionsThisMonth(supabase, userId)) >= FREE_MONTHLY_EXTRACT_LIMIT;
    return NextResponse.json({
      extracted: row,
      remaining: result.remaining,
      creditsUsed: creditsNeeded,
      ...(freeLimitReached ? { monthlyLimitReached: true } : {}),
    });
  } catch (err) {
    console.error("Extract error:", err);
    const message =
      err instanceof Error
        ? `${err.name}: ${err.message}`
        : `Error: ${String(err)}`;
    const supabaseForLog = getSupabase();
    await insertApiLog(supabaseForLog, {
      user_id: userId ?? "unknown",
      org_id: orgId ?? null,
      endpoint: EXTRACT_ENDPOINT,
      status_code: 500,
      credits_consumed: 0,
    });
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
