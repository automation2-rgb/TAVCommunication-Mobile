import { useState } from 'react';

import { AuthButton } from '@/components/auth/auth-button';
import { GoogleSignInError, signInWithGoogle } from '@/lib/auth/google-sign-in';

type GoogleSignInButtonProps = {
  onError: (code: 'domain' | 'auth' | 'timeout') => void;
};

export function GoogleSignInButton({ onError }: GoogleSignInButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePress = async () => {
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      if (error instanceof GoogleSignInError) {
        if (error.code === 'cancelled') {
          return;
        }

        onError(error.code === 'domain' ? 'domain' : 'auth');
        return;
      }

      onError('auth');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthButton
      disabled={isSubmitting}
      label={isSubmitting ? 'Signing in…' : 'Sign in with Google'}
      onPress={() => {
        void handlePress();
      }}
      variant="secondary"
      style={{ width: '100%' }}
    />
  );
}
