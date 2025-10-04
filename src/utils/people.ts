export function computeAge(isoBirthdate?: string): string | null {
  if (!isoBirthdate) return null;
  const d = new Date(isoBirthdate);
  if (Number.isNaN(d.getTime())) return null;
  const diff = new Date(Date.now() - d.getTime());
  return String(Math.abs(diff.getUTCFullYear() - 1970));
}