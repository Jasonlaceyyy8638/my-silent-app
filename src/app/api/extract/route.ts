import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import pdfParse from "pdf-parse";
import { deductCredit } from "@/lib/credits";
import type { ExtractedRow, LineItem } from "@/types";

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
