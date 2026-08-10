const US_COUNTRY_CODE = '1';
const US_NATIONAL_DIGIT_COUNT = 10;

/** Strip to digits only. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/** Keep at most 10 national US digits (ignores leading country code 1 if present). */
export function normalizeUsNationalDigits(value: string): string {
  let digits = digitsOnly(value);
  if (digits.length > US_NATIONAL_DIGIT_COUNT && digits.startsWith(US_COUNTRY_CODE)) {
    digits = digits.slice(US_COUNTRY_CODE.length);
  }
  return digits.slice(0, US_NATIONAL_DIGIT_COUNT);
}

/** `(555) 123-4567` display for up to 10 national digits. */
export function formatUsNationalDisplay(nationalDigits: string): string {
  const digits = normalizeUsNationalDigits(nationalDigits);
  if (digits.length === 0) {
    return '';
  }

  if (digits.length <= 3) {
    return `(${digits}`;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function isCompleteUsNationalNumber(nationalDigits: string): boolean {
  return normalizeUsNationalDigits(nationalDigits).length === US_NATIONAL_DIGIT_COUNT;
}

/** Build E.164 for a completed US national number: `+1` + 10 digits. */
export function toUsE164(nationalDigits: string): string {
  const digits = normalizeUsNationalDigits(nationalDigits);
  if (digits.length !== US_NATIONAL_DIGIT_COUNT) {
    throw new Error('Enter a complete 10-digit US phone number.');
  }
  return `+${US_COUNTRY_CODE}${digits}`;
}

/** Format E.164 as US display when possible, else return raw value. */
export function formatE164AsUsDisplay(e164: string): string {
  const trimmed = e164.trim();
  if (!trimmed.startsWith('+')) {
    return trimmed;
  }

  const digits = digitsOnly(trimmed);
  if (digits.length === 11 && digits.startsWith(US_COUNTRY_CODE)) {
    return formatUsNationalDisplay(digits.slice(US_COUNTRY_CODE.length));
  }

  if (digits.length === US_NATIONAL_DIGIT_COUNT) {
    return formatUsNationalDisplay(digits);
  }

  return trimmed;
}
