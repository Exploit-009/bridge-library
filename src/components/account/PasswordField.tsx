import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PasswordField({ label, name, current = false }: { label: string; name: string; current?: boolean }) {
  const [visible, setVisible] = useState(false);
  return <label className="grid gap-2 text-sm font-semibold">{label}<span className="relative block"><input className="bl-input w-full pr-12" name={name} type={visible ? 'text' : 'password'} autoComplete={current ? 'current-password' : 'new-password'} required minLength={current ? undefined : 8} /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2" aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`} title={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</Button></span></label>;
}