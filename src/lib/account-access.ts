import { oauthReturnPath } from './oauth-return-path';

export function signInDestination(value: unknown) {
  const path = oauthReturnPath(value);
  return path === '/' || /^\/(login|forgot-password|reset-password)(?:[?#]|$)/.test(path) ? '/dashboard' : path;
}

export function validateNewPassword(password: string, confirmation: string) {
  if (password.length < 8) throw new Error('Use a password with at least 8 characters.');
  if (password !== confirmation) throw new Error('The passwords do not match.');
  return password;
}

export function passwordResetDestination(origin: string) {
  return new URL('/reset-password', origin).href;
}

export function recoveryLinkState(hash: string, search: string) {
  const fragment = new URLSearchParams(hash.replace(/^#/, ''));
  const query = new URLSearchParams(search);
  return {
    recovery: fragment.get('type') === 'recovery' || query.get('type') === 'recovery',
    error: fragment.has('error') || query.has('error'),
  };
}