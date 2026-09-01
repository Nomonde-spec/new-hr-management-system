'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { dashboardApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ArrowRight, Award, Briefcase, Building2, CalendarDays, CheckCircle2, Clock, DollarSign, FileText, Plus, ShieldCheck, Users } from 'lucide-react';
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Role = 'SUPER_ADMIN' | 'HR_MANAGER' | 'MANAGER_DEPT' | 'MANAGER' | 'EMPLOYEE';

type RoleContent = { label: string; eyebrow: string; title: string; description: string; accent: string };

const roleContent: Record<Role, RoleContent> = {
  SUPER_ADMIN: { label: 'Admin', eyebrow: 'System command center', title: 'Keep the whole operation in view.', description: 'Govern workforce, finance, access, and organizational performance from one place.', accent: 'indigo' },
  HR_MANAGER: { label: 'HR Manager', eyebrow: 'People operations desk', title: 'Move people work forward.', description: 'Coordinate hiring, employee records, leave, and performance across the organization.', accent: 'emerald' },
  MANAGER_DEPT: { label: 'Dept Manager', eyebrow: 'Department leadership view', title: 'Keep your department moving.', description: 'Manage attendance, leave, performance, and goals across your department.', accent: 'amber' },
  MANAGER: { label: 'Dept Manager', eyebrow: 'Team leadership view', title: 'Lead the team in front of you.', description: 'Stay close to attendance, approvals, goals, and the people who need your attention.', accent: 'amber' },
  EMPLOYEE: { label: 'Employee', eyebrow: 'My work space', title: 'Your work, clearly accounted for.', description: 'Handle everyday attendance, leave, payroll, and growth tasks without the noise.', accent: 'cyan' },
};

const accentClasses: Record<string, string> = {
  indigo: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  amber: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
};

const roleActions: Record<Role, { label: string; href: string; icon: React.ElementType }[]> = {
  SUPER_ADMIN: [{ label: 'Add employee', href: '/employees', icon: Plus }, { label: 'View departments', href: '/departments', icon: Building2 }, { label: 'Review performance', href: '/performance', icon: Award }],
  HR_MANAGER: [{ label: 'Add employee', href: '/employees', icon: Plus }, { label: 'Review leaves', href: '/leave', icon: CalendarDays }, { label: 'Open payroll', href: '/payroll', icon: DollarSign }],
  MANAGER_DEPT: [{ label: 'Approve leave', href: '/leave', icon: CalendarDays }, { label: 'View department', href: '/departments', icon: Building2 }, { label: 'Review goals', href: '/performance', icon: Award }],
  MANAGER: [{ label: 'Approve leave', href: '/leave', icon: CalendarDays }, { label: 'View attendance', href: '/attendance', icon: Clock }, { label: 'Review goals', href: '/performance', icon: Award }],
  EMPLOYEE: [{ label: 'Clock attendance', href: '/attendance', icon: Clock }, { label: 'Request leave', href: '/leave', icon: CalendarDays }, { label: 'View goals', href: '/performance', icon: Award }],
};

function Metric({ icon: Icon, label, value, detail, tone }: { icon: React.ElementType; label: string; value: string | number; detail: string; tone: string }) {
  return <div className="glass-card rounded-2xl border border-slate-800 p-5"><div className="flex items-start justify-between gap-3"><p className="text-xs font-semibold text-slate-400">{label}</p><div className={`rounded-xl border p-2 ${tone}`}><Icon className="h-4 w-4" /></div></div><p className="mt-5 text-2xl font-black tracking-tight text-white">{value}</p><p className="mt-1 text-[11px] font-medium text-slate-500">{detail}</p></div>;
}

function ActionList({ role }: { role: Role }) {
  return <div className="glass-panel rounded-2xl border border-slate-800 p-6"><div className="mb-5 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Shortcuts</p><h2 className="mt-1 text-base font-bold text-white">Your next moves</h2></div><ArrowRight className="h-4 w-4 text-slate-500" /></div><div className="space-y-2">{roleActions[role].map(({ label, href, icon: Icon }) => <Link key={href} href={href} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 px-3.5 py-3 text-xs font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white"><span className="flex items-center gap-3"><Icon className="h-4 w-4 text-slate-500" />{label}</span><ArrowRight className="h-3.5 w-3.5 text-slate-600" /></Link>)}</div></div>;
}

function DepartmentChart({ departments }: { departments: any[] }) {
  return <div className="glass-panel rounded-2xl border border-slate-800 p-6"><div className="mb-5"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Organization pulse</p><h2 className="mt-1 text-base font-bold text-white">Headcount by department</h2></div><div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={departments}><CartesianGrid stroke="#273449" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} /><YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} /><Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }} /><Bar dataKey="employeeCount" fill="#34d399" radius={[5, 5, 0, 0]} name="Employees" /></BarChart></ResponsiveContainer></div></div>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const role = (user?.role || 'EMPLOYEE') as Role;
  const content = roleContent[role] || roleContent.EMPLOYEE;

  useEffect(() => {
    dashboardApi.getStats().then((response) => { if (response.data.success) setData(response.data); }).catch((error) => console.error('Failed to fetch dashboard data:', error)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" /></div>;

  const stats = data?.stats || {};
  const isEmployee = role === 'EMPLOYEE';
  const isManager = role === 'MANAGER' || role === 'MANAGER_DEPT';
  const isDepartmentManager = role === 'MANAGER_DEPT';
  const isPeopleRole = role === 'SUPER_ADMIN' || role === 'HR_MANAGER';

  return <div className="space-y-6 pb-8"><header className="glass-panel rounded-2xl border border-slate-800 p-6 md:p-8"><div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div className="max-w-2xl"><div className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] ${accentClasses[content.accent]}`}><ShieldCheck className="h-3.5 w-3.5" />{content.label} dashboard</div><p className="text-xs font-bold uppercase tracking-[.18em] text-slate-500">{content.eyebrow}</p><h1 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">{content.title}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">{content.description}</p></div><div className="flex flex-wrap gap-2">{roleActions[role].slice(0, 2).map(({ label, href, icon: Icon }) => <Link key={href} href={href} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-500"><Icon className="h-3.5 w-3.5" />{label}</Link>)}</div></div></header>

  {isEmployee ? <><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric icon={Clock} label="Attendance" value="Manage" detail="Clock in or review your logs" tone="border-cyan-500/20 bg-cyan-500/10 text-cyan-300" /><Metric icon={CalendarDays} label="Leave" value="Request" detail="Submit time away for approval" tone="border-amber-500/20 bg-amber-500/10 text-amber-300" /><Metric icon={DollarSign} label="Payroll" value="View" detail="Open your latest payslip" tone="border-emerald-500/20 bg-emerald-500/10 text-emerald-300" /><Metric icon={Award} label="Growth" value="Review" detail="Track goals and feedback" tone="border-indigo-500/20 bg-indigo-500/10 text-indigo-300" /></div><div className="grid grid-cols-1 gap-6 lg:grid-cols-2"><ActionList role={role} /><div className="glass-panel rounded-2xl border border-slate-800 p-6"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Personal record</p><h2 className="mt-1 text-base font-bold text-white">Keep your profile current</h2><p className="mt-3 text-sm leading-6 text-slate-400">Your manager and HR team use your employee record for leave, payroll, and performance workflows.</p><Link href="/employees" className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-cyan-300">View employee record <ArrowRight className="h-3.5 w-3.5" /></Link></div></div></> : <><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric icon={Users} label={isManager ? 'Active team' : 'Active employees'} value={stats.activeEmployees ?? 0} detail={isManager ? 'People currently on your team' : 'Currently active workforce'} tone="border-emerald-500/20 bg-emerald-500/10 text-emerald-300" /><Metric icon={CalendarDays} label="Pending leave" value={stats.pendingLeaveRequests ?? 0} detail={isManager ? 'Requests needing your review' : 'Requests awaiting action'} tone="border-amber-500/20 bg-amber-500/10 text-amber-300" /><Metric icon={isPeopleRole ? Briefcase : CheckCircle2} label={isPeopleRole ? 'Open positions' : 'On leave'} value={isPeopleRole ? (stats.openJobs ?? 0) : (stats.onLeaveEmployees ?? 0)} detail={isPeopleRole ? 'Published opportunities' : 'Team members away today'} tone="border-cyan-500/20 bg-cyan-500/10 text-cyan-300" /><Metric icon={isPeopleRole ? DollarSign : Award} label={isPeopleRole ? 'Payroll run' : 'Departments'} value={isPeopleRole ? `$${(stats.monthlyPayrollTotal ?? 0).toLocaleString()}` : (stats.totalDepartments ?? 0)} detail={isPeopleRole ? 'Latest total payroll' : 'Connected team units'} tone="border-indigo-500/20 bg-indigo-500/10 text-indigo-300" /></div><div className="grid grid-cols-1 gap-6 lg:grid-cols-3"><div className="lg:col-span-2"><DepartmentChart departments={data?.departmentStats || []} /></div><ActionList role={role} /></div><div className="grid grid-cols-1 gap-4 md:grid-cols-3">{(isManager ? [{ label: 'Attendance', href: '/attendance', icon: Clock, text: 'Monitor your team presence.' }, { label: 'Leave approvals', href: '/leave', icon: CalendarDays, text: 'Keep requests moving.' }, { label: 'Performance', href: '/performance', icon: Award, text: 'Follow up on goals.' }] : [{ label: 'People directory', href: '/employees', icon: Users, text: 'Maintain employee records.' }, { label: 'Departments', href: '/departments', icon: Building2, text: 'Shape the org structure.' }, { label: 'Reports', href: '/payroll', icon: FileText, text: 'Review operational reports.' }]).map(({ label, href, icon: Icon, text }) => <Link key={href} href={href} className="glass-card rounded-2xl border border-slate-800 p-5 transition hover:border-indigo-500/40"><Icon className="h-5 w-5 text-indigo-300" /><h2 className="mt-4 text-sm font-bold text-white">{label}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{text}</p><span className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-300">Open module <ArrowRight className="h-3 w-3" /></span></Link>)}</div></>}
  </div>;
}
