import type { DocumentCategory } from "@/types";

/**
 * Maps AI documentType (from extract) to the Universal Dashboard category.
 * Used to tag uploads as Financial, Logistics, Legal, or General for the industry sidebar.
 */
export function identifyDocumentType(documentType?: string | null): DocumentCategory {
  const t = typeof documentType === "string" ? documentType.trim() : "";
  if (t === "Invoice") return "Financial";
  if (t === "BOL") return "Logistics";
  if (t === "Contract") return "Legal";
  return "General";
}

export const BUILTIN_CATEGORIES: DocumentCategory[] = ["Financial", "Logistics", "Legal", "General"];
