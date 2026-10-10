/**
 * Consumer / free mailbox domains — not accepted for company signup.
 * Custom Google Workspace domains (e.g. acme.com) are fine; @gmail.com is not.
 */
const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.il",
  "yahoo.co.uk",
  "hotmail.com",
  "hotmail.co.il",
  "outlook.com",
  "outlook.co.il",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "pm.me",
  "mail.com",
  "gmx.com",
  "gmx.net",
  "yandex.com",
  "yandex.ru",
  "zoho.com",
  "qq.com",
  "163.com",
  "126.com",
  "walla.co.il",
  "walla.com",
  "nana10.co.il",
  "tutanota.com",
  "tuta.com",
  "fastmail.com",
  "hey.com",
]);

export function emailDomain(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at < 1 || at === trimmed.length - 1) return null;
  return trimmed.slice(at + 1);
}

/** True when the address looks like a personal / free mailbox. */
export function isPersonalEmail(email: string): boolean {
  const domain = emailDomain(email);
  if (!domain) return true;
  return PERSONAL_EMAIL_DOMAINS.has(domain);
}

/** True when company signup may use this email (work / org domain). */
export function isWorkEmail(email: string): boolean {
  return !isPersonalEmail(email);
}

export const COMPANY_WORK_EMAIL_MESSAGE =
  "Company accounts need a work email (not Gmail, Outlook, Yahoo, iCloud, etc.). Use your company domain, or sign up as Talent.";
