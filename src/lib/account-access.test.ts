import { describe, expect, it } from 'vitest';
import { passwordResetDestination, recoveryLinkState, signInDestination, validateNewPassword } from './account-access';

describe('Account access', () => {
  it('preserves the requested student portal after sign-in', () => {
    expect(signInDestination('/student-portal')).toBe('/student-portal');
  });
  it('rejects external and authentication-loop destinations', () => {
    expect(signInDestination('//example.com')).toBe('/dashboard');
    expect(signInDestination('/login?next=/login')).toBe('/dashboard');
  });
  it('sends reset links to the public reset-password page', () => {
    expect(passwordResetDestination('https://bridgelib.lovable.app')).toBe('https://bridgelib.lovable.app/reset-password');
  });
  it('recognizes recovery links but not ordinary sign-in links', () => {
    expect(recoveryLinkState('#type=recovery', '').recovery).toBe(true);
    expect(recoveryLinkState('#type=signup', '').recovery).toBe(false);
    expect(recoveryLinkState('#error=access_denied&error_code=otp_expired', '').error).toBe(true);
  });
  it('requires matching new passwords', () => {
    expect(() => validateNewPassword('EightChars9', 'Different9')).toThrow('do not match');
    expect(validateNewPassword('EightChars9', 'EightChars9')).toBe('EightChars9');
  });
  it('rejects new passwords shorter than eight characters', () => {
    expect(() => validateNewPassword('short', 'short')).toThrow('at least 8');
  });
});