export type LineItem = {
  sku: string;
  partDescription: string;
  unitCost: string;
  quantity?: string;
  lineTotal?: string;
};

export type ExtractedRow = {
  vendorName: string;
  totalAmount: string;
  date: string;
  documentType?: "Invoice" | "BOL" | "Contract";
  lineItems?: LineItem[];
};
