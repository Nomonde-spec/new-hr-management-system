'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, UserPlus, ShieldCheck } from 'lucide-react';
import { authApi, departmentApi } from '@/lib/api';

const roles = [
  { value: 'SUPER_ADMIN', label: 'Admin' },
  { value: 'HR_MANAGER', label: 'HR Manager' },
  { value: 'EMPLOYEE', label: 'Employee' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'EMPLOYEE', departmentId: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const res = await departmentApi.getDepartments();
        if (res?.data?.success && Array.isArray(res.data.departments)) {
          setDepartments(res.data.departments);
          if (res.data.departments.length > 0) {
            setForm((prev) => ({ ...prev, departmentId: prev.departmentId || res.data.departments[0].id }));
          }
        }
      } catch (err) {
        console.error('Failed to load departments:', err);
      }
    };

    loadDepartments();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await authApi.register(form);
      if (response.data.success) router.replace('/login?registered=1');
      else setError(response.data.message || 'Registration failed.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-brand-panel register-brand">
        <div className="brand-mark"><ShieldCheck /></div>
        <p className="auth-kicker">Build your team space</p>
        <h1>Make work feel more human.</h1>
        <p>Choose your role and start with a workspace designed around the people behind the numbers.</p>
      </section>
      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <div className="mobile-brand"><div className="brand-mark"><ShieldCheck /></div><span>Acme HRMS</span></div>
          <p className="auth-kicker">Get started</p>
          <h2>Create your account</h2>
          <p className="auth-muted">Set up your profile in less than a minute.</p>
          <form onSubmit={submit} className="auth-form">
            <label>Full name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" required /></label>
            <label>Work email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" required /></label>
            <label>Role<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select></label>
            <label>Department<select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} required>
              <option value="">Select department</option>
              {departments.map((dept) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
            </select></label>
            <label>Password<div className="password-field"><input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" minLength={8} required /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label>
            {error && <p className="auth-error">{error}</p>}
            <button className="auth-submit" disabled={submitting}>{submitting ? 'Creating account...' : 'Create account'}<UserPlus /></button>
          </form>
          <p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p>
        </div>
      </section>
    </main>
  );
}