'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { workReportApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ClipboardList, UploadCloud, Send, CheckCircle2, XCircle, Clock3, FileText } from 'lucide-react';

const EMPTY_FORM = {
  date: new Date().toISOString().slice(0, 10),
  summary: '',
  tasks: '',
  blockers: '',
  hoursWorked: '8',
  attachmentUrl: '',
};

export default function WorkReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const visibleReports = useMemo(() => {
    if (!user) return [];
    if (user.role === 'HR_MANAGER') return reports;
    return reports.filter((report) => report.employeeId === user.employee?.id || report.employee?.id === user.employee?.id);
  }, [reports, user]);

  const selectedReport = useMemo(() => {
    if (!visibleReports.length) return null;
    return visibleReports[0];
  }, [visibleReports]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await workReportApi.getAll();
      if (res.data.success) setReports(res.data.reports || []);
    } catch (err) {
      console.error('Failed to fetch work reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await workReportApi.submit({
        ...form,
        hoursWorked: Number(form.hoursWorked || 0),
      });

      if (res.data.success) {
        setForm(EMPTY_FORM);
        fetchReports();
      }
    } catch (err: any) {
      console.error('Failed to submit work report:', err);
      alert(err.response?.data?.message || 'Unable to submit your daily work report.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: 'APPROVED' | 'REJECTED' | 'REVIEWED') => {
    try {
      await workReportApi.updateStatus(id, { status, managerNotes: status === 'REJECTED' ? 'Please revise the daily update.' : 'Reviewed and accepted.' });
      fetchReports();
    } catch (err) {
      console.error('Failed to update work report status:', err);
    }
  };

  const isHr = useMemo(
    () => user?.role === 'HR_MANAGER',
    [user?.role]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-indigo-400" /> Daily Work Reports
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Employees submit what they worked on daily and hours are tracked for payroll based on R50 per hour.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Daily submissions</h2>
            <span className="text-xs text-slate-400">Hours tracked for payroll</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading reports...</div>
          ) : (
            <div className="space-y-4 p-4">
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-5 py-3.5">Employee</th>
                      <th className="px-5 py-3.5">Date</th>
                      <th className="px-5 py-3.5">Hours</th>
                      <th className="px-5 py-3.5">Status</th>
                      {isHr && <th className="px-5 py-3.5 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {visibleReports.map((report) => (
                      <tr key={report.id} className="hover:bg-slate-900/40 transition align-top">
                        <td className="px-5 py-4 font-semibold text-white">
                          {report.employee?.firstName} {report.employee?.lastName}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {report.employee?.department?.name || 'Department'}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-slate-300">{new Date(report.date).toLocaleDateString()}</td>
                        <td className="px-5 py-4 font-semibold text-indigo-300">{report.hoursWorked} hrs</td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            report.status === 'APPROVED' ? 'badge-present' :
                            report.status === 'REJECTED' ? 'badge-absent' : 'badge-pending'
                          }`}>
                            {report.status}
                          </span>
                        </td>
                        {isHr && (
                          <td className="px-5 py-4 text-right">
                            {report.status === 'SUBMITTED' && (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleStatusUpdate(report.id, 'APPROVED')}
                                  className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(report.id, 'REJECTED')}
                                  className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-lg text-[10px] font-bold"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedReport && (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">Work details</h3>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400">{new Date(selectedReport.date).toLocaleDateString()}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                      <p className="text-slate-400 mb-1">Summary</p>
                      <p className="text-slate-200 whitespace-pre-wrap">{selectedReport.summary || 'No summary provided.'}</p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                      <p className="text-slate-400 mb-1">Tasks / deliverables</p>
                      <p className="text-slate-200 whitespace-pre-wrap">{selectedReport.tasks || 'No tasks listed.'}</p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                      <p className="text-slate-400 mb-1">Blockers / issues</p>
                      <p className="text-slate-200 whitespace-pre-wrap">{selectedReport.blockers || 'No blockers reported.'}</p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                      <p className="text-slate-400 mb-1">Attachment</p>
                      <p className="text-indigo-300 break-all">{selectedReport.attachmentUrl || 'No attachment uploaded.'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="glass-panel rounded-2xl border border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <UploadCloud className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Submit daily work</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Summary of work completed</label>
              <textarea
                rows={4}
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                placeholder="Describe the work completed today..."
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Tasks / deliverables</label>
              <textarea
                rows={3}
                value={form.tasks}
                onChange={(e) => setForm({ ...form, tasks: e.target.value })}
                placeholder="List key tasks or milestones..."
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Blockers / issues</label>
              <textarea
                rows={2}
                value={form.blockers}
                onChange={(e) => setForm({ ...form, blockers: e.target.value })}
                placeholder="Anything that slowed you down?"
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Hours worked</label>
                <input
                  type="number"
                  min="0"
                  max="12"
                  step="0.5"
                  value={form.hoursWorked}
                  onChange={(e) => setForm({ ...form, hoursWorked: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Attachment URL</label>
                <input
                  type="url"
                  value={form.attachmentUrl}
                  onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-500/20 disabled:opacity-60"
            >
              <Send className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Submit Daily Work Report'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
