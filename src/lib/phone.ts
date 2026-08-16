/**
 * Phone number helpers for the WhatsApp contact feature.
 *
 * Privacy model (BRIEF Kontak WhatsApp, 12 Ags 2026):
 * - Only the NORMALIZED form is ever stored (column `profiles.whatsapp`).
 * - The number only ever leaves the database through the SECURITY DEFINER
 *   function get_member_whatsapp(), which gates by role.
 * - The UI only ever receives a number that already passed that gate, so a
 *   "member" role client never sees the field at all — see
 *   PROFILE_COLUMNS in src/lib/data.ts for the other half of that promise.
 */

export const FAKE_NUMBER_PREFIX = "6280000";

/**
 * Normalize a raw phone number to Indonesian E.164-ish form (62...).
 *
 * Rules from the brief:
 * - strip every non-digit
 * - a leading 0 becomes 62
 * - a leading 62 is kept
 * - a leading +62 becomes 62 (the + is stripped with the other non-digits)
 * - obviously-not-a-number input (too short, no digits) -> null
 */
export function normalizePhoneNumber(
  raw: string | null | undefined
): string | null {
  if (raw === null || raw === undefined) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return null;
  let n = digits;
  if (n.startsWith("0")) n = n.slice(1);
  if (!n.startsWith("62")) n = "62" + n;
  if (n.length < 10 || n.length > 15) return null;
  return n;
}

/** wa.me link for a number, or null when the number is empty/invalid. */
export function buildWhatsAppLink(
  number: string | null | undefined
): string | null {
  const normalized = normalizePhoneNumber(number);
  if (!normalized) return null;
  return `https://wa.me/${normalized}`;
}

/**
 * Everything a WhatsApp button needs to render — or null, which the
 * component treats as "render nothing". Kept a pure function so the
 * "button does not appear when the number is missing" rule is testable
 * without a DOM.
 */
export function getWhatsAppAction(
  number: string | null | undefined,
  name: string
): { href: string; label: string } | null {
  const href = buildWhatsAppLink(number);
  if (!href) return null;
  return { href, label: `Chat via WhatsApp dengan ${name}` };
}

/** Roles allowed to see/use member contacts (pengurus + tim ibadah). */
const CONTACT_ROLES = new Set(["admin", "treasurer", "leader", "ministry"]);

export function canViewContacts(
  role: string | null | undefined
): boolean {
  return role !== null && role !== undefined && CONTACT_ROLES.has(role);
}
