/** Display formatters. */

export function formatVND(n: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(Math.round(n))}₫`;
}

export function formatMinutes(min: number): string {
  if (min <= 0) return "0 min";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
