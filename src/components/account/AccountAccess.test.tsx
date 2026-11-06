import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountAccess } from './AccountAccess';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(), updateUser: vi.fn(), signIn: vi.fn(), reset: vi.fn(), signOut: vi.fn(),
  getUser: vi.fn(), invalidateQueries: vi.fn(), cancelQueries: vi.fn(), clear: vi.fn(),
}));
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mocks.navigate,
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => mocks }));
vi.mock('@/components/site/SiteChrome', () => ({ SiteLayout: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/lib/supabase', () => ({ supabase: { auth: {
  getUser: mocks.getUser, updateUser: mocks.updateUser, signInWithPassword: mocks.signIn,
  resetPasswordForEmail: mocks.reset, signOut: mocks.signOut,
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
} } }));

beforeEach(() => {
  vi.clearAllMocks(); sessionStorage.clear();
  window.history.replaceState(null, '', '/');
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'account' } }, error: null });
  mocks.updateUser.mockResolvedValue({ error: null });
  mocks.signIn.mockResolvedValue({ error: null });
  mocks.reset.mockResolvedValue({ error: null });
  mocks.signOut.mockResolvedValue({ error: null });
});
afterEach(cleanup);

describe('Account actions', () => {
  it('signs in and returns to the originally requested page', async () => {
    render(<AccountAccess mode="login" next="/student-portal" />);
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'learner@example.com' } });
    fireEvent.change(screen.getByLabelText('Password', { exact: true }), { target: { value: 'ExamplePassword9' } });
    fireEvent.click(screen.getByRole('button', { name: /^Sign in$/ }));
    await waitFor(() => expect(mocks.signIn).toHaveBeenCalledWith({ email: 'learner@example.com', password: 'ExamplePassword9' }));
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith({ href: '/student-portal', replace: true }));
  });
  it('requests a reset link using the dedicated reset page', async () => {
    render(<AccountAccess mode="forgot" />);
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'learner@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
    await waitFor(() => expect(mocks.reset).toHaveBeenCalledWith('learner@example.com', { redirectTo: new URL('/reset-password', window.location.origin).href }));
  });
  it('requires the current password on ordinary account updates', async () => {
    render(<AccountAccess mode="update" />);
    await screen.findByLabelText('Current password');
    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'OldPassword9' } });
    fireEvent.change(screen.getByLabelText('New password', { exact: true }), { target: { value: 'NewPassword9' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'NewPassword9' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save new password' }));
    await waitFor(() => expect(mocks.updateUser).toHaveBeenCalledWith({ password: 'NewPassword9', current_password: 'OldPassword9' }));
  });
  it('updates recovery passwords without requiring the forgotten password', async () => {
    window.history.replaceState(null, '', '/reset-password#type=recovery');
    render(<AccountAccess mode="reset" />);
    await screen.findByLabelText('New password', { exact: true });
    fireEvent.change(screen.getByLabelText('New password', { exact: true }), { target: { value: 'NewPassword9' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'NewPassword9' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save new password' }));
    await waitFor(() => expect(mocks.updateUser).toHaveBeenCalledWith({ password: 'NewPassword9' }));
    await waitFor(() => expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'local' }));
    expect(sessionStorage.getItem('bridgelib-password-recovery')).toBeNull();
  });
  it('never enables password recovery from an ordinary signed-in session', async () => {
    render(<AccountAccess mode="reset" />);
    await waitFor(() => expect(mocks.getUser).toHaveBeenCalled());
    await screen.findByRole('alert');
    expect(screen.queryByRole('button', { name: 'Save new password' })).toBeNull();
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });
});