import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';

import { isOrgEmail } from '@/lib/auth/org-policy';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export type GoogleSignInErrorCode = 'domain' | 'auth' | 'timeout' | 'cancelled';

export class GoogleSignInError extends Error {
  code: GoogleSignInErrorCode;

  constructor(code: GoogleSignInErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

export function getOAuthRedirectUri() {
  return makeRedirectUri({
    scheme: 'tavcommunication',
    path: 'auth/callback',
  });
}

export async function createSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) {
    throw new GoogleSignInError('auth', errorCode);
  }

  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) {
      throw new GoogleSignInError('auth', error.message);
    }
    return data.session;
  }

  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;

  if (!accessToken || !refreshToken) {
    throw new GoogleSignInError('auth', 'Missing OAuth tokens in callback URL');
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    throw new GoogleSignInError('auth', error.message);
  }

  return data.session;
}

async function enforceOrgDomain() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    await supabase.auth.signOut();
    throw new GoogleSignInError('auth', error.message);
  }

  if (!isOrgEmail(data.user.email)) {
    await supabase.auth.signOut();
    throw new GoogleSignInError('domain');
  }
}

export async function signInWithGoogle() {
  const redirectTo = getOAuthRedirectUri();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    throw new GoogleSignInError('auth', error.message);
  }

  if (!data.url) {
    throw new GoogleSignInError('auth', 'Missing Google OAuth URL');
  }

  const authResult = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (authResult.type === 'cancel' || authResult.type === 'dismiss') {
    throw new GoogleSignInError('cancelled');
  }

  if (authResult.type !== 'success') {
    throw new GoogleSignInError('auth', 'Google sign-in did not complete');
  }

  await createSessionFromUrl(authResult.url);
  await enforceOrgDomain();
}

export async function handleAuthCallbackUrl(url: string) {
  await createSessionFromUrl(url);
  await enforceOrgDomain();
}
