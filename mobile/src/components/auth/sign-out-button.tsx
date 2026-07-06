import { useState } from 'react';

import { AuthButton } from '@/components/auth/auth-button';
import { signOut } from '@/lib/auth/sign-out';

type SignOutButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function SignOutButton({ variant = 'ghost' }: SignOutButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <AuthButton
      disabled={isSubmitting}
      label={isSubmitting ? 'Signing out…' : 'Sign out'}
      variant={variant}
      onPress={() => {
        setIsSubmitting(true);
        void signOut().finally(() => {
          setIsSubmitting(false);
        });
      }}
    />
  );
}
