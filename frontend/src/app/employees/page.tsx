'use client';

import React, { useEffect, useState } from 'react';
import { employeeApi, departmentApi } from '@/lib/api';
import {
  Users,
  Search,
  Plus,
  Filter,
  Mail,
  Phone,
  Building,
  Briefcase,
  DollarSign,
  UserCheck,
  X,
  CheckCircle,
  Eye,
} from 'lucide-react';

const defaultDepartments = [
  { id: 'eng', name: 'Engineering', code: 'ENG' },
  { id: 'hr', name: 'Human Resources', code: 'HR' },
  { id: 'sales', name: 'Sales & Marketing', code: 'SALES' },
  { id: 'product', name: 'Product & Design', code: 'PROD' },
];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>(defaultDepartments);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeptQuickCreate, setShowDeptQuickCreate] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentId: '',
    positionId: '',
    basicSalary: '',
    employmentType: 'FULL_TIME',
    role: 'EMPLOYEE',
  });

  const [deptQuickForm, setDeptQuickForm] = useState({
    name: '',
    code: '',
    description: '',
    budget: '',
  });

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, [search, selectedDept, selectedStatus]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await employeeApi.getAll({
        search,
        departmentId: selectedDept,
        status: selectedStatus,
      });
      if (res.data.success) {
        setEmployees(res.data.employees);
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await departmentApi.getDepartments();
      if (res?.data?.success && Array.isArray(res.data.departments) && res.data.departments.length > 0) {
        setDepartments(res.data.departments);
        return;
      }
      setDepartments(defaultDepartments);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
      setDepartments(defaultDepartments);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      departmentId: '',
      positionId: '',
      basicSalary: '',
      employmentType: 'FULL_TIME',
      role: 'EMPLOYEE',
    });
    setEditingEmployeeId(null);
  };

  const openAddEmployeeModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditEmployeeModal = async (employee: any) => {
    setSelectedEmp(null);
    setEditingEmployeeId(employee.id);
    setFormData({
      firstName: employee.firstName || '',
      lastName: employee.lastName || '',
      email: employee.email || '',
      phone: employee.phone || '',
      departmentId: employee.departmentId || '',
      positionId: employee.positionId || '',
      basicSalary: String(employee.basicSalary || ''),
      employmentType: employee.employmentType || 'FULL_TIME',
      role: employee.user?.role || 'EMPLOYEE',
    });
    setShowAddModal(true);
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        basicSalary: formData.basicSalary ? Number(formData.basicSalary) : 0,
      };

      const res = editingEmployeeId
        ? await employeeApi.update(editingEmployeeId, payload)
        : await employeeApi.create(payload);

      if (res.data.success) {
        setShowAddModal(false);
        resetForm();
        fetchEmployees();
      }
    } catch (err) {
      console.error('Error saving employee:', err);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    const confirmed = window.confirm('Delete this employee and their login account?');
    if (!confirmed) return;

    try {
      const res = await employeeApi.delete(id);
      if (res.data.success) {
        setSelectedEmp(null);
        fetchEmployees();
      }
    } catch (err) {
      console.error('Error deleting employee:', err);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await departmentApi.createDepartment({
        ...deptQuickForm,
        managerId: '',
      });

      if (response.data.success) {
        const created = response.data.department;
        setDepartments((prev) => [...prev, created]);
        setFormData((prev) => ({ ...prev, departmentId: created.id }));
        setDeptQuickForm({ name: '', code: '', description: '', budget: '' });
        setShowDeptQuickCreate(false);
      }
    } catch (err) {
      console.error('Error creating department:', err);
    }
  };

  const openEmployeeDetail = async (id: string) => {
    try {
      const res = await employeeApi.getById(id);
      if (res.data.success) {
        setSelectedEmp(res.data.employee);
      }
    } catch (err) {
      console.error('Failed to get employee detail:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" /> Employee Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage organization workforce, profiles, and employment contracts.
          </p>
        </div>
        <button
          onClick={openAddEmployeeModal}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/20 hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" /> Add New Employee
        </button>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or employee ID..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Employees Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading Directory...</div>
      ) : employees.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center text-slate-400 text-xs">
          No employees found matching the specified filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {employees.map((emp) => (
            <div key={emp.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                    {emp.employeeId}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      emp.employmentStatus === 'ACTIVE'
                        ? 'badge-present'
                        : emp.employmentStatus === 'ON_LEAVE'
                        ? 'badge-pending'
                        : 'badge-absent'
                    }`}
                  >
                    {emp.employmentStatus}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-sm shadow">
                    {emp.firstName[0]}
                    {emp.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-white truncate">
                      {emp.firstName} {emp.lastName}
                    </h3>
                    <p className="text-[11px] text-indigo-400 font-medium truncate">
                      {emp.position?.title || 'Staff Member'}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2 truncate">
                    <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{emp.department?.name || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => openEmployeeDetail(emp.id)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-400" /> View Profile
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white">Add New Staff Member</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Department</label>
                  <div className="flex gap-2">
                    <select
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
                    >
                      <option value="">Select Dept</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowDeptQuickCreate(true)}
                      className="px-2 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 hover:border-indigo-500 transition"
                      title="Add department"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Annual Basic Salary ($)</label>
                  <input
                    type="number"
                    placeholder="95000"
                    value={formData.basicSalary}
                    onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
                  />
                </div>
              </div>

              {showDeptQuickCreate && (
                <div className="rounded-xl border border-indigo-500/30 bg-slate-900/80 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-200">Create Department</p>
                    <button
                      type="button"
                      onClick={() => setShowDeptQuickCreate(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateDepartment} className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">Name *</label>
                        <input
                          type="text"
                          required
                          value={deptQuickForm.name}
                          onChange={(e) => setDeptQuickForm({ ...deptQuickForm, name: e.target.value })}
                          className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Code *</label>
                        <input
                          type="text"
                          required
                          value={deptQuickForm.code}
                          onChange={(e) => setDeptQuickForm({ ...deptQuickForm, code: e.target.value })}
                          className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 uppercase"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Description</label>
                      <input
                        type="text"
                        value={deptQuickForm.description}
                        onChange={(e) => setDeptQuickForm({ ...deptQuickForm, description: e.target.value })}
                        className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Budget</label>
                      <input
                        type="number"
                        value={deptQuickForm.budget}
                        onChange={(e) => setDeptQuickForm({ ...deptQuickForm, budget: e.target.value })}
                        className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowDeptQuickCreate(false)}
                        className="px-3 py-2 bg-slate-800 text-slate-300 rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-2 bg-indigo-600 text-white rounded-xl font-semibold"
                      >
                        Save Dept
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow"
                >
                  {editingEmployeeId ? 'Update Employee' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Detail Modal */}
      {selectedEmp && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-800 p-6 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-lg">
                  {selectedEmp.firstName[0]}
                  {selectedEmp.lastName[0]}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {selectedEmp.firstName} {selectedEmp.lastName}
                  </h2>
                  <p className="text-xs text-indigo-400 font-semibold">{selectedEmp.position?.title || 'Employee'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditEmployeeModal(selectedEmp)}
                  className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-[11px] font-semibold"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteEmployee(selectedEmp.id)}
                  className="px-3 py-2 bg-rose-600 text-white rounded-xl text-[11px] font-semibold"
                >
                  Delete
                </button>
                <button onClick={() => setSelectedEmp(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Profile Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <p className="text-slate-500 text-[10px]">Employee ID</p>
                <p className="font-semibold text-slate-200 font-mono mt-0.5">{selectedEmp.employeeId}</p>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <p className="text-slate-500 text-[10px]">Department</p>
                <p className="font-semibold text-slate-200 mt-0.5">{selectedEmp.department?.name || 'N/A'}</p>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <p className="text-slate-500 text-[10px]">Basic Salary (Annual)</p>
                <p className="font-semibold text-emerald-400 mt-0.5">${selectedEmp.basicSalary?.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <p className="text-slate-500 text-[10px]">Email</p>
                <p className="font-semibold text-slate-200 mt-0.5 truncate">{selectedEmp.email}</p>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <p className="text-slate-500 text-[10px]">Bank Name</p>
                <p className="font-semibold text-slate-200 mt-0.5">{selectedEmp.bankName || 'Silicon Valley Bank'}</p>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <p className="text-slate-500 text-[10px]">Account No.</p>
                <p className="font-semibold text-slate-200 font-mono mt-0.5">{selectedEmp.accountNumber || '••••9876'}</p>
              </div>
            </div>

            {/* Leave Balances Summary */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-300">Annual Leave Allowances</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {(selectedEmp.leaveBalances || []).map((lb: any) => (
                  <div key={lb.id} className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 text-center">
                    <p className="text-[10px] text-slate-400">{lb.leaveType?.name}</p>
                    <p className="text-sm font-bold text-indigo-400 mt-1">
                      {lb.allocated - lb.used} / {lb.allocated} Days
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
