import { AccountShell } from '@/components/auth/account-shell';
import { SignOutButton } from '@/components/auth/sign-out-button';

export default function RejectedScreen() {
  return (
    <AccountShell
      title="Access not granted"
      subtitle="Your account request was not approved. Contact your administrator if you believe this is a mistake."
      footer={<SignOutButton variant="secondary" />}
    />
  );
}
