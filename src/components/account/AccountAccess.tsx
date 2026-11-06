import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Eye, EyeOff, KeyRound, LockKeyhole, Mail } from 'lucide-react';
import { SiteLayout } from '@/components/site/SiteChrome';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { passwordResetDestination, recoveryLinkState, signInDestination, validateNewPassword } from '@/lib/account-access';
import shield from '@/assets/bridgelib-shield.png';

type Mode = 'login' | 'forgot' | 'reset' | 'update';
const recoveryKey = 'bridgelib-password-recovery';

function PasswordField({ label, name, current = false }: { label: string; name: string; current?: boolean }) {
  const [visible, setVisible] = useState(false);
  return <label className="grid gap-2 text-sm font-semibold">{label}<span className="relative block"><input className="bl-input w-full pr-12" name={name} type={visible ? 'text' : 'password'} autoComplete={current ? 'current-password' : 'new-password'} required minLength={current ? undefined : 8} /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2" aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`} title={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</Button></span></label>;
}

export function AccountAccess({ mode, next }: { mode: Mode; next?: string }) {
  const navigate = useNavigate();
  const cache = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [access, setAccess] = useState<'checking' | 'ready' | 'invalid'>(mode === 'reset' || mode === 'update' ? 'checking' : 'ready');
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);
  const [done, setDone] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let active = true;
    const link = recoveryLinkState(window.location.hash, window.location.search);
    const recovery = mode === 'reset';
    if (recovery && link.recovery && !link.error) sessionStorage.setItem(recoveryKey, 'pending');
    if (recovery && link.error) sessionStorage.removeItem(recoveryKey);
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      setSignedIn(Boolean(session));
      if (recovery && event === 'PASSWORD_RECOVERY') {
        sessionStorage.setItem(recoveryKey, 'pending');
        setAccess('ready');
      }
      if (!session && (mode === 'reset' || mode === 'update')) setAccess('invalid');
    });
    void supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      const valid = !error && Boolean(data.user);
      setSignedIn(valid);
      if (mode === 'update') setAccess(valid ? 'ready' : 'invalid');
      if (recovery) setAccess(valid && !link.error && sessionStorage.getItem(recoveryKey) === 'pending' ? 'ready' : 'invalid');
    }).catch(() => { if (active && (mode === 'reset' || mode === 'update')) setAccess('invalid'); });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [mode]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setMessage(null);
    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(String(form.get('email') ?? '').trim(), { redirectTo: passwordResetDestination(window.location.origin) });
        if (error) throw error;
        setMessage({ error: false, text: 'If an account exists for this email, a reset link has been sent. Check your inbox and spam folder.' });
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: String(form.get('email') ?? '').trim(), password: String(form.get('password') ?? '') });
        if (error) throw error;
        await cache.invalidateQueries();
        await navigate({ href: signInDestination(next), replace: true });
      } else {
        if (access !== 'ready') throw new Error('Open the latest reset link from your email, or sign in to change your password.');
        const password = validateNewPassword(String(form.get('password') ?? ''), String(form.get('confirm') ?? ''));
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError || !data.user) { setAccess('invalid'); throw new Error('Your session has expired. Please request a new reset link.'); }
        const current = String(form.get('current') ?? '');
        if (mode === 'update' && !current) throw new Error('Enter your current password.');
        const { error } = await supabase.auth.updateUser(mode === 'update' ? { password, current_password: current } : { password });
        if (error) throw error;
        if (mode === 'reset') {
          sessionStorage.removeItem(recoveryKey);
          await cache.cancelQueries(); cache.clear();
          const signedOut = await supabase.auth.signOut({ scope: 'local' });
          setMessage({ error: false, text: signedOut.error ? 'Your password has been updated. You can continue to your dashboard.' : 'Your password has been updated. Sign in with your new password.' });
        } else setMessage({ error: false, text: 'Your password has been updated.' });
        setDone(true);
      }
    } catch (error) {
      setMessage({ error: true, text: error instanceof Error ? error.message : 'We could not complete this request. Please try again.' });
    } finally { setBusy(false); }
  }

  const title = mode === 'login' ? 'Welcome back' : mode === 'forgot' ? 'Reset your password' : mode === 'reset' ? 'Create a new password' : 'Change your password';
  const Icon = mode === 'login' ? LockKeyhole : mode === 'forgot' ? Mail : KeyRound;
  return <SiteLayout><section className="bl-container bl-section"><div className="mx-auto w-full max-w-md"><Link to="/" className="mb-6 flex items-center justify-center gap-3 text-2xl font-bold text-foreground"><img src={shield} alt="" width={44} height={44} /><span>Bridge<span className="text-destructive">LIB</span></span></Link><div className="rounded-md border border-border bg-card p-6 sm:p-8"><Icon size={30} className="mb-4 text-primary" /><h1 className="text-2xl font-bold text-foreground">{title}</h1><p className="mb-6 mt-2 text-sm text-muted-foreground">{mode === 'login' ? 'Sign in to continue learning.' : mode === 'forgot' ? 'Enter the email address linked to your BridgeLIB account.' : mode === 'reset' ? 'Choose a new password for your BridgeLIB account.' : 'Confirm your current password and choose a new one.'}</p>
      {message && <p role={message.error ? 'alert' : 'status'} className={`mb-5 rounded-md border border-border p-3 text-sm ${message.error ? 'text-destructive' : 'text-foreground'}`}>{message.text}</p>}
      {done ? <Link to={signedIn ? '/dashboard' : '/login'} className="bl-btn bl-btn-primary w-full">{signedIn ? 'Go to dashboard' : 'Back to sign in'} <ArrowRight size={16} /></Link> : access === 'checking' ? <p role="status">Checking your account…</p> : access === 'invalid' ? <div className="grid gap-4"><p role="alert" className="text-sm text-destructive">{mode === 'reset' ? 'This reset link is missing, expired or already used. Request a new link and open the latest email.' : 'Sign in before changing your password.'}</p><Link to={mode === 'reset' ? '/forgot-password' : '/login'} search={mode === 'update' ? { next: '/update-password' } : {}} className="bl-btn bl-btn-primary">{mode === 'reset' ? 'Request a new reset link' : 'Sign in'}</Link></div> : <form className="grid gap-5" onSubmit={submit}>
        {(mode === 'login' || mode === 'forgot') && <label className="grid gap-2 text-sm font-semibold">Email address<input name="email" type="email" autoComplete="email" className="bl-input w-full" required placeholder="you@example.com" /></label>}
        {mode === 'update' && <PasswordField name="current" label="Current password" current />}
        {mode !== 'forgot' && <PasswordField name="password" label={mode === 'login' ? 'Password' : 'New password'} current={mode === 'login'} />}
        {(mode === 'reset' || mode === 'update') && <><PasswordField name="confirm" label="Confirm new password" /><p className="text-xs text-muted-foreground">Use at least 8 characters.</p></>}
        {mode === 'login' && <Link to="/forgot-password" className="bl-link text-sm">Forgot password?</Link>}
        <Button type="submit" disabled={busy}>{busy ? mode === 'login' ? 'Signing in…' : mode === 'forgot' ? 'Sending link…' : 'Updating password…' : mode === 'login' ? 'Sign in' : mode === 'forgot' ? 'Send reset link' : 'Save new password'} <ArrowRight size={16} /></Button>
      </form>}
      <div className="mt-6 border-t border-border pt-5 text-center text-sm">{mode === 'login' ? <p>New to BridgeLIB? <Link to="/signup" className="bl-link">Create an account</Link></p> : <Link to="/login" className="bl-link">Back to sign in</Link>}</div>
    </div>{mode === 'login' && <p className="mt-5 text-center text-sm"><Link to="/admin-login" className="bl-link">Administrator sign in</Link></p>}</div></section></SiteLayout>;
}