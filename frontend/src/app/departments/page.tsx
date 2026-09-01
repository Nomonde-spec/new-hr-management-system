'use client';

import React, { useEffect, useState } from 'react';
import { departmentApi, employeeApi } from '@/lib/api';
import { Building2, Briefcase, Plus, Users, DollarSign, X, Pencil, Trash2 } from 'lucide-react';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showPosModal, setShowPosModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<any>(null);

  const [deptForm, setDeptForm] = useState({
    name: '',
    code: '',
    description: '',
    budget: '',
    managerId: '',
  });

  const [posForm, setPosForm] = useState({
    title: '',
    code: '',
    departmentId: '',
    minSalary: '',
    maxSalary: '',
    skills: '',
  });

  useEffect(() => {
    fetchDeptData();
  }, []);

  const fetchDeptData = async () => {
    try {
      setLoading(true);
      const [dRes, pRes, eRes] = await Promise.all([
        departmentApi.getDepartments(),
        departmentApi.getPositions(),
        employeeApi.getAll(),
      ]);

      if (dRes.data.success) setDepartments(dRes.data.departments);
      if (pRes.data.success) setPositions(pRes.data.positions);
      if (eRes.data.success) setEmployees(eRes.data.employees);
    } catch (err) {
      console.error('Error fetching department data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePos = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await departmentApi.createPosition(posForm);
      if (res.data.success) {
        setShowPosModal(false);
        fetchDeptData();
      }
    } catch (err) {
      console.error('Create position error:', err);
    }
  };

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = editingDepartment ? await departmentApi.updateDepartment(editingDepartment.id, deptForm) : await departmentApi.createDepartment(deptForm);
      if (response.data.success) {
        setShowDeptModal(false);
        setEditingDepartment(null);
        setDeptForm({ name: '', code: '', description: '', budget: '', managerId: '' });
        fetchDeptData();
      }
    } catch (err) { console.error('Save department error:', err); }
  };

  const editDepartment = (department: any) => {
    setEditingDepartment(department);
    setDeptForm({ name: department.name, code: department.code, description: department.description || '', budget: String(department.budget || ''), managerId: department.managerId || '' });
    setShowDeptModal(true);
  };

  const deleteDepartment = async (id: string) => {
    if (!window.confirm('Delete this department?')) return;
    try { await departmentApi.deleteDepartment(id); fetchDeptData(); } catch (err) { console.error('Delete department error:', err); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-400" /> Departments & Positions Architecture
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure business units, budget allocations, job position titles, and salary bands.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setShowPosModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold hover:border-slate-600 transition"
          >
            <Briefcase className="w-4 h-4 text-indigo-400" /> Add Position Title
          </button>
          <button
            onClick={() => setShowDeptModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/20 hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" /> Create Department
          </button>
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {departments.map((dept) => (
          <div key={dept.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-indigo-300 border border-slate-700">
                {dept.code}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">{dept._count?.employees || 0} Staff</span>
                <button onClick={() => editDepartment(dept)} aria-label="Edit department" className="text-slate-400 hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => deleteDepartment(dept.id)} aria-label="Delete department" className="text-rose-400 hover:text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-sm text-white">{dept.name}</h3>
              <p className="text-xs text-slate-400 line-clamp-2 mt-1">{dept.description || 'Department unit'}</p>
            </div>

            <div className="pt-2 border-t border-slate-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Annual Budget:</span>
                <span className="font-mono font-bold text-emerald-400">${dept.budget?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Manager:</span>
                <span className="text-slate-300 font-medium">
                  {dept.manager ? `${dept.manager.firstName} ${dept.manager.lastName}` : 'Unassigned'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Positions Directory */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Job Position Titles & Pay Bands</h2>
          <span className="text-xs text-slate-400 font-mono">Organizational Roles</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading Positions...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Position Title</th>
                  <th className="px-5 py-3.5">Code</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Salary Range (Annual)</th>
                  <th className="px-5 py-3.5">Required Skills</th>
                  <th className="px-5 py-3.5">Active Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {positions.map((pos) => (
                  <tr key={pos.id} className="hover:bg-slate-900/40 transition">
                    <td className="px-5 py-4 font-bold text-white">{pos.title}</td>
                    <td className="px-5 py-4 font-mono text-indigo-300">{pos.code}</td>
                    <td className="px-5 py-4 text-slate-300">{pos.department?.name}</td>
                    <td className="px-5 py-4 font-mono text-emerald-400 font-semibold">
                      ${pos.minSalary?.toLocaleString()} - ${pos.maxSalary?.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-slate-400 font-mono text-[11px]">{pos.skills || 'N/A'}</td>
                    <td className="px-5 py-4 font-bold text-indigo-400">{pos._count?.employees || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dept Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white">{editingDepartment ? 'Edit Department' : 'Create New Department'}</h2>
              <button onClick={() => setShowDeptModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDept} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  placeholder="e.g. Product Marketing"
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Dept Code *</label>
                  <input
                    type="text"
                    required
                    value={deptForm.code}
                    onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                    placeholder="MKT"
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Annual Budget ($)</label>
                  <input
                    type="number"
                    value={deptForm.budget}
                    onChange={(e) => setDeptForm({ ...deptForm, budget: e.target.value })}
                    placeholder="500000"
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Position Modal */}
      {showPosModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white">Create Position Title</h2>
              <button onClick={() => setShowPosModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePos} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Position Title *</label>
                <input
                  type="text"
                  required
                  value={posForm.title}
                  onChange={(e) => setPosForm({ ...posForm, title: e.target.value })}
                  placeholder="e.g. Lead Security Engineer"
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Position Code *</label>
                  <input
                    type="text"
                    required
                    value={posForm.code}
                    onChange={(e) => setPosForm({ ...posForm, code: e.target.value })}
                    placeholder="SEC-LEAD"
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Department *</label>
                  <select
                    required
                    value={posForm.departmentId}
                    onChange={(e) => setPosForm({ ...posForm, departmentId: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
                  >
                    <option value="">Select Dept</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPosModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow"
                >
                  Create Position
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
