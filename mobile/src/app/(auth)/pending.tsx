import { AccountShell } from '@/components/auth/account-shell';
import { SignOutButton } from '@/components/auth/sign-out-button';

export default function PendingScreen() {
  return (
    <AccountShell
      title="Application received"
      subtitle="Your access request is waiting for administrator review. You will be able to use the inbox once an operator approves your account."
      footer={<SignOutButton variant="secondary" />}
    />
  );
}
