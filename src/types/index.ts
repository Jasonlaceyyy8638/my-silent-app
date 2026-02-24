export type LineItem = {
  sku: string;
  partDescription: string;
  unitCost: string;
  quantity?: string;
  lineTotal?: string;
};

/** Industry category derived from AI documentType or set by identifyDocumentType. */
export type DocumentCategory = "Financial" | "Logistics" | "Legal" | "General";

export type ExtractedRow = {
  vendorName: string;
  totalAmount: string;
  date: string;
  documentType?: "Invoice" | "BOL" | "Contract";
  /** Industry folder: Financial, Logistics, Legal, General. Set by AI/extract. */
  category?: DocumentCategory;
  /** For Logistics (BOLs): pro number, reference #, or load ID. */
  referenceNumber?: string;
  lineItems?: LineItem[];
};
