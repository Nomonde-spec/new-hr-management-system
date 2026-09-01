'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    const success = await login(email, password);
    setSubmitting(false);
    if (success) router.replace('/');
    else setError('We could not sign you in. Check your email and password.');
  };

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <div className="brand-mark"><ShieldCheck /></div>
        <p className="auth-kicker">Acme HRMS</p>
        <h1>People operations, with a clearer point of view.</h1>
        <p>One secure workspace for every team, from first day to next chapter.</p>
      </section>
      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <div className="mobile-brand"><div className="brand-mark"><ShieldCheck /></div><span>Acme HRMS</span></div>
          <p className="auth-kicker">Welcome back</p>
          <h2>Sign in to your workspace</h2>
          <p className="auth-muted">Use your work email to continue.</p>
          <form onSubmit={submit} className="auth-form">
            <label>Email address<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required /></label>
            <label>Password<div className="password-field"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label>
            {error && <p className="auth-error">{error}</p>}
            <button className="auth-submit" disabled={submitting}>{submitting ? 'Signing in...' : 'Sign in'}<KeyRound /></button>
          </form>
          <p className="auth-switch">New to Acme HRMS? <Link href="/register">Create an account</Link></p>
        </div>
      </section>
    </main>
  );
}