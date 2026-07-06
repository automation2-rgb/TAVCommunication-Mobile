export const ORG_EMAIL_DOMAIN = '@texasautovalue.com';

export function isOrgEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }

  return email.trim().toLowerCase().endsWith(ORG_EMAIL_DOMAIN);
}
