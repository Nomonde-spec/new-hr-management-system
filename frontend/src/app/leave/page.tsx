'use client';

import React, { useEffect, useState } from 'react';
import { leaveApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { CalendarDays, Plus, Check, X, Clock, AlertCircle } from 'lucide-react';

export default function LeavePage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    fetchLeaveData();
  }, []);

  const fetchLeaveData = async () => {
    try {
      setLoading(true);
      const [reqRes, balRes, typeRes] = await Promise.all([
        leaveApi.getRequests(),
        leaveApi.getBalances(),
        leaveApi.getTypes(),
      ]);

      if (reqRes.data.success) setRequests(reqRes.data.leaveRequests);
      if (balRes.data.success) setBalances(balRes.data.balances);
      if (typeRes.data.success) setLeaveTypes(typeRes.data.leaveTypes);
    } catch (err) {
      console.error('Error fetching leave data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await leaveApi.requestLeave({
        ...formData,
        employeeId: user?.employee?.id,
      });
      if (res.data.success) {
        setShowRequestModal(false);
        setFormData({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
        fetchLeaveData();
      }
    } catch (err) {
      console.error('Leave request error:', err);
    }
  };

  const handleStatusChange = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await leaveApi.updateStatus(id, { status, rejectionReason: status === 'REJECTED' ? 'Policy bounds exceeded' : null });
      fetchLeaveData();
    } catch (err) {
      console.error('Update leave status error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-indigo-400" /> Leave Management Hub
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Submit leave applications, track balance entitlements, and review manager approvals.
          </p>
        </div>
        <button
          onClick={() => setShowRequestModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/20 hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" /> Apply For Leave
        </button>
      </div>

      {/* Leave Entitlement Progress Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {balances.map((b) => {
          const available = b.allocated - b.used;
          const pct = Math.round((available / b.allocated) * 100);
          return (
            <div key={b.id} className="glass-card p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">{b.leaveType?.name}</span>
                <span className="text-slate-400 font-mono text-[10px]">{b.year}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-indigo-400">{available}</span>
                <span className="text-xs text-slate-400">/ {b.allocated} days remaining</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Leave Requests Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Leave Requests & Approvals</h2>
          <span className="text-xs text-slate-400">Workflow pipeline</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading requests...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Leave Type</th>
                  <th className="px-5 py-3.5">Dates</th>
                  <th className="px-5 py-3.5">Duration</th>
                  <th className="px-5 py-3.5">Reason</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Manager Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-900/40 transition">
                    <td className="px-5 py-4 font-semibold text-white">
                      {req.employee?.firstName} {req.employee?.lastName}
                    </td>
                    <td className="px-5 py-4 text-indigo-300 font-medium">{req.leaveType?.name}</td>
                    <td className="px-5 py-4 font-mono text-slate-400 text-[11px]">
                      {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-200">{req.totalDays} Days</td>
                    <td className="px-5 py-4 text-slate-400 max-w-xs truncate">{req.reason}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          req.status === 'APPROVED'
                            ? 'badge-present'
                            : req.status === 'PENDING'
                            ? 'badge-pending'
                            : 'badge-absent'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {req.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleStatusChange(req.id, 'APPROVED')}
                            className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg border border-emerald-500/30 transition"
                            title="Approve Leave"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleStatusChange(req.id, 'REJECTED')}
                            className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg border border-rose-500/30 transition"
                            title="Reject Leave"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">
                          {req.status === 'APPROVED' ? `Approved by ${req.approver?.firstName || 'Manager'}` : 'Processed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white">Apply For Leave</h2>
              <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Leave Type *</label>
                <select
                  required
                  value={formData.leaveTypeId}
                  onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
                >
                  <option value="">Select Type</option>
                  {leaveTypes.map((lt) => (
                    <option key={lt.id} value={lt.id}>
                      {lt.name} (Max {lt.maxDays} Days)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Reason for Leave *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Provide context for manager review..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
