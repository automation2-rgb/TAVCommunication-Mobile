/** E.164: + followed by 10–15 digits (ITU-T recommendation). */
export function isValidE164Phone(value: string) {
  return /^\+\d{10,15}$/.test(value.trim());
}
