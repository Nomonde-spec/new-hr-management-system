'use client';

import React, { useEffect, useState } from 'react';
import { payrollApi } from '@/lib/api';
import { DollarSign, FileText, CheckCircle, Clock, Plus, Printer, X, ShieldCheck } from 'lucide-react';

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);

  useEffect(() => {
    fetchPayrollData();
  }, []);

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      const [pRes, psRes] = await Promise.all([payrollApi.getPayrolls(), payrollApi.getPayslips()]);

      if (pRes.data.success) setPayrolls(pRes.data.payrolls);
      if (psRes.data.success) setPayslips(psRes.data.payslips);
    } catch (err) {
      console.error('Failed to fetch payroll data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunPayroll = async () => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const res = await payrollApi.runPayroll({ month: currentMonth, year: currentYear });
      if (res.data.success) {
        fetchPayrollData();
      }
    } catch (err) {
      console.error('Payroll run error:', err);
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await payrollApi.markPaid(id);
      fetchPayrollData();
      if (selectedPayslip && selectedPayslip.id === id) {
        setSelectedPayslip({ ...selectedPayslip, status: 'PAID' });
      }
    } catch (err) {
      console.error('Mark paid error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-400" /> Payroll & Payslip Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generate monthly payrolls, calculate tax deductions, and disburse digital payslips.
          </p>
        </div>
        <button
          onClick={handleRunPayroll}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-500/20 hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" /> Run New Monthly Payroll
        </button>
      </div>

      {/* Payroll Runs Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {payrolls.map((p) => (
          <div key={p.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">{p.title}</span>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  p.status === 'COMPLETED' ? 'badge-present' : 'badge-pending'
                }`}
              >
                {p.status}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-xs text-slate-400">Total Disbursement</p>
                <p className="text-xl font-black text-emerald-400">${p.totalAmount?.toLocaleString()}</p>
              </div>
              <span className="text-xs text-indigo-300 font-mono">{p._count?.payslips || 8} Payslips</span>
            </div>
          </div>
        ))}
      </div>

      {/* Payslips Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Employee Payslips Directory</h2>
          <span className="text-xs text-slate-400">August 2026 Period</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading payslips...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Pay Period</th>
                  <th className="px-5 py-3.5">Hours Worked</th>
                  <th className="px-5 py-3.5">Rate / Hour</th>
                  <th className="px-5 py-3.5">Gross Salary</th>
                  <th className="px-5 py-3.5">Tax Deduction</th>
                  <th className="px-5 py-3.5">Net Salary</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {payslips.map((ps) => (
                  <tr key={ps.id} className="hover:bg-slate-900/40 transition">
                    <td className="px-5 py-4 font-semibold text-white">
                      {ps.employee?.firstName} {ps.employee?.lastName}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {ps.employee?.position?.title || 'Staff'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400">{ps.payPeriod}</td>
                    <td className="px-5 py-4 font-mono text-indigo-300">{ps.hoursWorked ?? 0} hrs</td>
                    <td className="px-5 py-4 font-mono text-slate-300">R{Number(ps.hourlyRate ?? 50).toLocaleString()}</td>
                    <td className="px-5 py-4 font-mono text-slate-300">R{Number(ps.grossSalary ?? ps.basicSalary ?? 0).toLocaleString()}</td>
                    <td className="px-5 py-4 font-mono text-rose-400">-R{Number(ps.taxDeduction ?? 0).toLocaleString()}</td>
                    <td className="px-5 py-4 font-mono font-bold text-emerald-300">R{Number(ps.netSalary ?? 0).toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          ps.status === 'PAID' ? 'badge-present' : 'badge-pending'
                        }`}
                      >
                        {ps.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {ps.status === 'UNPAID' && (
                          <button
                            onClick={() => handleMarkPaid(ps.id)}
                            className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold transition"
                          >
                            Mark Paid
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedPayslip(ps)}
                          className="px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                        >
                          <FileText className="w-3 h-3" /> View Payslip
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Payslip Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-700 p-6 space-y-6 bg-slate-950">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">OFFICIAL PAYSLIP</h2>
                  <p className="text-xs text-slate-400">Acme Enterprise Solutions</p>
                </div>
              </div>
              <button onClick={() => setSelectedPayslip(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Employee Info */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div>
                <p className="text-slate-500 text-[10px]">EMPLOYEE NAME</p>
                <p className="font-bold text-white">
                  {selectedPayslip.employee?.firstName} {selectedPayslip.employee?.lastName}
                </p>
                <p className="text-[11px] text-indigo-400 mt-0.5">{selectedPayslip.employee?.position?.title}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px]">PAY PERIOD</p>
                <p className="font-bold text-white">{selectedPayslip.payPeriod}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Ref: {selectedPayslip.id.slice(0, 8)}</p>
              </div>
            </div>

            {/* Calculations Table */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-800 text-slate-300">
                <span>Hours worked this month</span>
                <span className="font-mono font-semibold">{Number(selectedPayslip.hoursWorked ?? 0).toLocaleString()} hrs</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800 text-slate-300">
                <span>Hourly rate</span>
                <span className="font-mono font-semibold">R{Number(selectedPayslip.hourlyRate ?? 50).toLocaleString()}/hr</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800 text-emerald-400">
                <span>Gross salary</span>
                <span className="font-mono font-semibold">R{Number(selectedPayslip.grossSalary ?? selectedPayslip.basicSalary ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800 text-rose-400">
                <span>Income Tax & Deductions (18%)</span>
                <span className="font-mono font-semibold">-R{Number(selectedPayslip.taxDeduction ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-indigo-500/40 text-sm font-bold text-white pt-3">
                <span>NET TAKE-HOME PAY</span>
                <span className="font-mono text-emerald-400 text-base">R{Number(selectedPayslip.netSalary ?? 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  selectedPayslip.status === 'PAID' ? 'badge-present' : 'badge-pending'
                }`}
              >
                STATUS: {selectedPayslip.status}
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Statement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
