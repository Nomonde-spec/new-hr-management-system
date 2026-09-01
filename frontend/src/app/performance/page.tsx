'use client';

import React, { useEffect, useState } from 'react';
import { performanceApi, employeeApi } from '@/lib/api';
import { Award, Target, Star, Plus, CheckCircle, TrendingUp, X } from 'lucide-react';

export default function PerformancePage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);

  const [reviewForm, setReviewForm] = useState({
    revieweeId: '',
    reviewPeriod: 'H2 2026',
    qualityOfWork: 5,
    productivity: 4,
    teamwork: 5,
    communication: 4,
    feedback: '',
  });

  const [goalForm, setGoalForm] = useState({
    employeeId: '',
    title: '',
    description: '',
    dueDate: '',
    priority: 'HIGH',
  });

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const [rRes, gRes, eRes] = await Promise.all([
        performanceApi.getReviews(),
        performanceApi.getGoals(),
        employeeApi.getAll(),
      ]);

      if (rRes.data.success) setReviews(rRes.data.reviews);
      if (gRes.data.success) setGoals(gRes.data.goals);
      if (eRes.data.success) setEmployees(eRes.data.employees);
    } catch (err) {
      console.error('Failed to fetch performance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await performanceApi.createReview(reviewForm);
      if (res.data.success) {
        setShowReviewModal(false);
        fetchPerformanceData();
      }
    } catch (err) {
      console.error('Create review error:', err);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await performanceApi.createGoal(goalForm);
      if (res.data.success) {
        setShowGoalModal(false);
        fetchPerformanceData();
      }
    } catch (err) {
      console.error('Create goal error:', err);
    }
  };

  const handleUpdateGoalProgress = async (id: string, newProgress: number) => {
    try {
      await performanceApi.updateGoalProgress(id, { progress: newProgress });
      fetchPerformanceData();
    } catch (err) {
      console.error('Update progress error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-400" /> Performance & Goals Tracker
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Conduct 360-degree performance reviews and track employee KPI goals.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setShowGoalModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold hover:border-slate-600 transition"
          >
            <Target className="w-4 h-4 text-indigo-400" /> New Key Goal
          </button>
          <button
            onClick={() => setShowReviewModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-amber-500/20 hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" /> Submit 360 Review
          </button>
        </div>
      </div>

      {/* Grid of Reviews and Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Reviews */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> 360 Performance Evaluations
            </h2>
            <span className="text-xs text-slate-400">Scorecard scale 1-5</span>
          </div>

          <div className="space-y-3">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      {rev.reviewee?.firstName} {rev.reviewee?.lastName}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Evaluated by {rev.reviewer?.firstName} • {rev.reviewPeriod}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-amber-400">{rev.overallScore}</span>
                    <span className="text-xs text-slate-500"> / 5.0</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 italic bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  "{rev.feedback || 'Outstanding technical execution and team collaboration.'}"
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Strategic Goals Tracker */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400" /> Strategic Goals & Objectives
            </h2>
            <span className="text-xs text-slate-400">KPI Deliverables</span>
          </div>

          <div className="space-y-3">
            {goals.map((goal) => (
              <div key={goal.id} className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-white">{goal.title}</h3>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                          goal.priority === 'URGENT'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}
                      >
                        {goal.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Assigned to {goal.employee?.firstName} {goal.employee?.lastName} • Due:{' '}
                      {new Date(goal.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-indigo-400">{goal.progress}%</span>
                </div>

                {/* Interactive Progress Slider */}
                <div className="space-y-1">
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={goal.progress}
                    onChange={(e) => handleUpdateGoalProgress(goal.id, parseInt(e.target.value))}
                    className="w-full h-1 bg-transparent cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white">Conduct Performance Review</h2>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReview} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Select Employee *</label>
                <select
                  required
                  value={reviewForm.revieweeId}
                  onChange={(e) => setReviewForm({ ...reviewForm, revieweeId: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
                >
                  <option value="">Select Employee</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} ({e.department?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Feedback Comments *</label>
                <textarea
                  required
                  rows={3}
                  value={reviewForm.feedback}
                  onChange={(e) => setReviewForm({ ...reviewForm, feedback: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-semibold shadow"
                >
                  Save Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white">Create New Strategic Goal</h2>
              <button onClick={() => setShowGoalModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Assignee *</label>
                <select
                  required
                  value={goalForm.employeeId}
                  onChange={(e) => setGoalForm({ ...goalForm, employeeId: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
                >
                  <option value="">Select Employee</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Goal Title *</label>
                <input
                  type="text"
                  required
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Due Date *</label>
                <input
                  type="date"
                  required
                  value={goalForm.dueDate}
                  onChange={(e) => setGoalForm({ ...goalForm, dueDate: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
