const CUSTOMER_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 320;

export function normalizeCustomerEmail(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

export function isValidCustomerEmail(value: string | null | undefined): boolean {
  const email = normalizeCustomerEmail(value);
  return email.length > 0 && email.length <= MAX_EMAIL_LENGTH && CUSTOMER_EMAIL_PATTERN.test(email);
}
