'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  DollarSign,
  Briefcase,
  Award,
  Building2,
  Settings,
  ShieldCheck,
  ClipboardList,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'HR_MANAGER', 'EMPLOYEE'] },
  { label: 'Employees', href: '/employees', icon: Users, roles: ['SUPER_ADMIN', 'HR_MANAGER'] },
  { label: 'Attendance', href: '/attendance', icon: Clock, roles: ['SUPER_ADMIN', 'HR_MANAGER', 'EMPLOYEE'] },
  { label: 'Leave Hub', href: '/leave', icon: CalendarDays, roles: ['HR_MANAGER', 'EMPLOYEE'] },
  { label: 'Work Reports', href: '/work-reports', icon: ClipboardList, roles: ['SUPER_ADMIN', 'HR_MANAGER', 'EMPLOYEE'] },
  { label: 'Payroll', href: '/payroll', icon: DollarSign, roles: ['HR_MANAGER'] },
  { label: 'Recruitment (ATS)', href: '/recruitment', icon: Briefcase, roles: ['HR_MANAGER'] },
  { label: 'Performance', href: '/performance', icon: Award, roles: ['SUPER_ADMIN', 'HR_MANAGER', 'EMPLOYEE'] },
  { label: 'Departments', href: '/departments', icon: Building2, roles: ['SUPER_ADMIN', 'HR_MANAGER'] },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const visibleItems = navItems.filter((item) => item.roles.includes(user?.role || 'EMPLOYEE'));

  return (
    <aside className="w-64 glass-panel border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white tracking-wide">Acme HRMS</h1>
            <p className="text-[11px] text-indigo-400 font-semibold tracking-wider uppercase">Enterprise Edition</p>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="p-4 space-y-1.5">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Main Menu</p>
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Card */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="glass-card rounded-xl p-3.5 border border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="font-semibold text-slate-200 text-[11px]">Backend API Online</p>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            RESTful Node.js + Express API connected to SQLite DB.
          </p>
        </div>
      </div>
    </aside>
  );
};
