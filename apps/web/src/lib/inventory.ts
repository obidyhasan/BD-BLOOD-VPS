export type InventoryStockStatus = "Available" | "Low" | "Critical" | "Out";

export function inventoryStockStatus(units: number): InventoryStockStatus {
  if (units === 0) return "Out";
  if (units <= 2) return "Critical";
  if (units <= 5) return "Low";
  return "Available";
}

export function formatInventoryUpdated(dateIso: string): string {
  const date = new Date(dateIso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 60_000) return "Just Now";
  if (diffMs < 86_400_000) return "Today";
  return date.toLocaleDateString();
}
