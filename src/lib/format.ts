export function formatInr(amount: number | string | null | undefined): string {
  const value = Number(amount ?? 0);
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: value % 1 === 0 ? 0 : 2 })}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function discountPercent(price: number, compareAt: number | null): number {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export function initials(name: string | null | undefined): string {
  if (!name) return "S";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
