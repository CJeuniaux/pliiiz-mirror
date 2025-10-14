// Utilitaires pour calculer le prochain anniversaire et J-...
export type DOB = { day: number; month: number; year?: number } | string; // "YYYY-MM-DD" ou "MM-DD"

export function parseDOB(dob: DOB): { day: number; month: number } | null {
  if (!dob) return null;
  if (typeof dob === "string") {
    const s = dob.trim();
    // formats tolérés: YYYY-MM-DD, MM-DD, DD/MM, DD/MM/YYYY
    let m: RegExpMatchArray | null;
    if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/))) return { month: +m[2], day: +m[3] };
    if ((m = s.match(/^(\d{2})-(\d{2})$/)))        return { month: +m[1], day: +m[2] };
    if ((m = s.match(/^(\d{2})\/(\d{2})(?:\/\d{4})?$/))) return { day: +m[1], month: +m[2] };
    return null;
  }
  return { day: dob.day, month: dob.month };
}

export function nextBirthdayFrom(day: number, month: number, from = new Date()): Date {
  const y = from.getFullYear();
  // gérer 29/02 → bascule au 28/02 les années non bissextiles
  const isFeb29 = day === 29 && month === 2;
  const candidateThisYear = new Date(y, month - 1, isFeb29 && !isLeap(y) ? 28 : day);
  if (stripTime(candidateThisYear) >= stripTime(from)) return candidateThisYear;
  const nextY = y + 1;
  return new Date(nextY, month - 1, isFeb29 && !isLeap(nextY) ? 28 : day);
}

export function daysBetweenUTC(a: Date, b: Date): number {
  const ms = stripTime(b).getTime() - stripTime(a).getTime();
  return Math.round(ms / 86400000);
}

const stripTime = (d: Date) => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

export function daysUntilNextBirthday(dob: DOB, now = new Date()) {
  const dm = parseDOB(dob);
  if (!dm) return null;
  const next = nextBirthdayFrom(dm.day, dm.month, now);
  return { days: daysBetweenUTC(now, next), date: next };
}