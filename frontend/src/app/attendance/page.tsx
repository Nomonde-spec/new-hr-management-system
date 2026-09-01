'use client';

import React, { useEffect, useState } from 'react';
import { attendanceApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Clock, CheckCircle, AlertTriangle, XCircle, Calendar, Play, Square } from 'lucide-react';

export default function AttendancePage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clockedIn, setClockedIn] = useState(false);
  const [clockLoading, setClockLoading] = useState(false);
  const [clockError, setClockError] = useState('');

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await attendanceApi.getLogs();
      if (res.data.success) {
        setLogs(res.data.attendances);
      }
    } catch (err) {
      console.error('Failed to fetch attendance logs:', err);
    } finally {
      setLoading(false);
    }
  };

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
      fetchAttendance();
    } catch (err: any) {
      setClockError(err.response?.data?.message || err.message || 'Unable to update attendance.');
      console.error('Clock toggle error:', err);
    } finally {
      setClockLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Clock In Widget Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Digital Time Card</span>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-400" /> Attendance & Time Tracker
          </h1>
          <p className="text-xs text-slate-400">
            Log your daily shift, track work hours, and inspect employee presence logs.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-inner">
          <div className="text-right">
            <p className="text-xs text-slate-400 font-medium">Shift Status</p>
            <p className={`text-sm font-bold ${clockedIn ? 'text-amber-400' : 'text-emerald-400'}`}>
              {clockedIn ? 'Active Shift' : 'Off Clock'}
            </p>
          </div>
          <button
            onClick={handleClockToggle}
            disabled={clockLoading}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold shadow-lg transition ${
              clockedIn
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
            }`}
          >
            {clockedIn ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            {clockedIn ? 'Clock Out' : 'Clock In Now'}
          </button>
          {clockError && <p role="alert" className="max-w-xs text-right text-[11px] text-rose-400">{clockError}</p>}
        </div>
      </div>

      {/* Attendance Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Overall On-Time Rate</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">94.2%</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Average Work Shift</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white">8.4 Hours</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Late Clock-Ins (This Month)</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white">1 Record</p>
        </div>
      </div>

      {/* Attendance Logs Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Daily Attendance Logs</h2>
          <span className="text-xs text-slate-400 font-mono">Showing recent records</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading Attendance Logs...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Clock In</th>
                  <th className="px-5 py-3.5">Clock Out</th>
                  <th className="px-5 py-3.5">Total Hours</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition">
                    <td className="px-5 py-4 font-semibold text-white">
                      {log.employee?.firstName} {log.employee?.lastName}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {log.employee?.department?.name || 'Staff'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400 font-mono">
                      {new Date(log.date).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 font-mono text-emerald-400 font-semibold">
                      {log.clockIn ? new Date(log.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-300">
                      {log.clockOut ? new Date(log.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-5 py-4 font-semibold text-indigo-300">
                      {log.totalHours ? `${log.totalHours} hrs` : 'In Progress'}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          log.status === 'PRESENT'
                            ? 'badge-present'
                            : log.status === 'LATE'
                            ? 'badge-late'
                            : 'badge-absent'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400 italic text-[11px] max-w-xs truncate">
                      {log.notes || 'Normal entry'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
