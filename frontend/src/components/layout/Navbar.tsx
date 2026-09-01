'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { attendanceApi } from '@/lib/api';
import {
  Bell,
  Search,
  Clock,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const [clockedIn, setClockedIn] = useState(false);
  const [clockLoading, setClockLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [lightTheme, setLightTheme] = useState(false);
  const [clockError, setClockError] = useState('');

  useEffect(() => {
    const isLight = localStorage.getItem('hrms_theme') === 'light';
    setLightTheme(isLight);
    document.documentElement.classList.toggle('light', isLight);
  }, []);

  useEffect(() => {
    attendanceApi.getLogs().then((res) => {
      const today = new Date().toDateString();
      const record = res.data.attendances?.find((item: any) => new Date(item.date).toDateString() === today);
      setClockedIn(Boolean(record?.clockIn && !record?.clockOut));
    }).catch(() => undefined);
  }, []);

  const handleClockToggle = async () => {
    setClockLoading(true);
    setClockError('');
    try {
      if (!user?.employee?.id) throw new Error('Your account is not linked to an employee record. Contact HR.');
      if (!clockedIn) {
        await attendanceApi.clockIn();
        setClockedIn(true);
      } else {
        await attendanceApi.clockOut();
        setClockedIn(false);
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Unable to update attendance.';
      setClockError(message);
      console.error('Clock action error:', err);
    } finally {
      setClockLoading(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800 px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search employees, departments, job postings..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-700/60 rounded-xl text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
          />
        </div>

        {/* Action Widgets & Profile */}
        <div className="flex items-center gap-3">
          <button onClick={() => { const next = !lightTheme; setLightTheme(next); localStorage.setItem('hrms_theme', next ? 'light' : 'dark'); document.documentElement.classList.toggle('light', next); }} aria-label={lightTheme ? 'Use dark theme' : 'Use light theme'} className="p-2 text-slate-400 hover:text-white bg-slate-900/60 rounded-xl border border-slate-800 transition">
            {lightTheme ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          {/* Quick Attendance Clock In / Out */}
          <button
            onClick={handleClockToggle}
            disabled={clockLoading}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition shadow-sm ${
              clockedIn
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
            }`}
          >
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            <span>{clockedIn ? 'Clock Out' : 'Clock In'}</span>
          </button>
          {clockError && <span role="alert" className="max-w-48 text-[10px] text-rose-400">{clockError}</span>}

          {/* Notifications Trigger */}
          <button className="relative p-2 text-slate-400 hover:text-white bg-slate-900/60 rounded-xl border border-slate-800 hover:border-slate-700 transition">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 pl-2 pr-3 py-1 bg-slate-900/60 rounded-xl border border-slate-800 hover:border-slate-700 transition"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow">
                {user?.employee?.firstName?.[0] || user?.email?.[0] || 'U'}
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-xs font-semibold text-slate-200">
                  {user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user?.email}
                </p>
                <p className="text-[10px] text-indigo-400 uppercase tracking-wider font-semibold">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 glass-panel rounded-xl shadow-2xl py-2 border border-slate-800 text-xs">
                <div className="px-4 py-2 border-b border-slate-800">
                  <p className="font-semibold text-slate-200">{user?.email}</p>
                  <p className="text-slate-400 text-[10px]">Acme Enterprise Solutions</p>
                </div>
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
