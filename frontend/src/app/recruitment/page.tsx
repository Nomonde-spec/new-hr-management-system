'use client';

import React, { useEffect, useState } from 'react';
import { recruitmentApi, departmentApi } from '@/lib/api';
import { Briefcase, UserCheck, Calendar, Star, Plus, ArrowRight, X, MapPin, DollarSign } from 'lucide-react';

const STAGES = ['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED'];

export default function RecruitmentPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showJobModal, setShowJobModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);

  const [jobForm, setJobForm] = useState({
    title: '',
    departmentId: '',
    location: 'Remote',
    minSalary: '',
    maxSalary: '',
    description: '',
    requirements: '',
  });

  const [interviewForm, setInterviewForm] = useState({
    scheduledAt: '',
    location: 'https://meet.google.com/xyz-hrms-call',
    feedback: '',
  });

  useEffect(() => {
    fetchRecruitmentData();
  }, []);

  const fetchRecruitmentData = async () => {
    try {
      setLoading(true);
      const [jRes, cRes, dRes] = await Promise.all([
        recruitmentApi.getJobs(),
        recruitmentApi.getCandidates(),
        departmentApi.getDepartments(),
      ]);

      if (jRes.data.success) setJobs(jRes.data.jobs);
      if (cRes.data.success) setCandidates(cRes.data.candidates);
      if (dRes.data.success) setDepartments(dRes.data.departments);
    } catch (err) {
      console.error('Error fetching recruitment data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await recruitmentApi.createJob(jobForm);
      if (res.data.success) {
        setShowJobModal(false);
        setJobForm({
          title: '',
          departmentId: '',
          location: 'Remote',
          minSalary: '',
          maxSalary: '',
          description: '',
          requirements: '',
        });
        fetchRecruitmentData();
      }
    } catch (err) {
      console.error('Create job error:', err);
    }
  };

  const handleAdvanceStage = async (candidateId: string, currentStage: string) => {
    const currentIndex = STAGES.indexOf(currentStage);
    if (currentIndex < STAGES.length - 1) {
      const nextStage = STAGES[currentIndex + 1];
      try {
        await recruitmentApi.updateStage(candidateId, { stage: nextStage });
        fetchRecruitmentData();
      } catch (err) {
        console.error('Advance stage error:', err);
      }
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;
    try {
      await recruitmentApi.scheduleInterview({
        candidateId: selectedCandidate.id,
        jobId: selectedCandidate.jobId,
        scheduledAt: interviewForm.scheduledAt,
        location: interviewForm.location,
        feedback: interviewForm.feedback,
      });
      setShowInterviewModal(false);
      fetchRecruitmentData();
    } catch (err) {
      console.error('Schedule interview error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-indigo-400" /> Recruitment & Applicant Tracking System (ATS)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage job requisitions, candidate evaluation pipelines, and interview schedules.
          </p>
        </div>
        <button
          onClick={() => setShowJobModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/20 hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" /> Post New Job Requisition
        </button>
      </div>

      {/* Active Jobs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.map((job) => (
          <div key={job.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-indigo-300 border border-slate-700">
                {job.code}
              </span>
              <span className="badge-present text-[10px] font-bold px-2.5 py-0.5 rounded-full">{job.status}</span>
            </div>

            <div>
              <h3 className="font-bold text-sm text-white">{job.title}</h3>
              <div className="flex items-center gap-3 text-slate-400 text-[11px] mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-500" /> {job.location}
                </span>
                <span>•</span>
                <span>{job.department?.name}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <span className="text-emerald-400 font-semibold font-mono">
                ${job.minSalary?.toLocaleString()} - ${job.maxSalary?.toLocaleString()}
              </span>
              <span className="text-indigo-400 font-bold">{job._count?.candidates || 0} Candidates</span>
            </div>
          </div>
        ))}
      </div>

      {/* Candidate Kanban Pipeline */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-indigo-400" /> Candidate Pipeline
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageCandidates = candidates.filter((c) => c.stage === stage);

            return (
              <div key={stage} className="glass-panel rounded-2xl border border-slate-800 p-3 space-y-3 min-w-[200px]">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">{stage}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300">
                    {stageCandidates.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {stageCandidates.map((cand) => (
                    <div key={cand.id} className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-xs text-white">
                            {cand.firstName} {cand.lastName}
                          </p>
                          <p className="text-[10px] text-slate-400">{cand.job?.title}</p>
                        </div>
                        <div className="flex text-amber-400">
                          <Star className="w-3 h-3 fill-current" />
                          <span className="text-[10px] ml-0.5 font-bold">{cand.rating}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[10px]">
                        <button
                          onClick={() => {
                            setSelectedCandidate(cand);
                            setShowInterviewModal(true);
                          }}
                          className="text-indigo-400 hover:underline font-semibold flex items-center gap-1"
                        >
                          <Calendar className="w-3 h-3" /> Interview
                        </button>

                        {stage !== 'HIRED' && (
                          <button
                            onClick={() => handleAdvanceStage(cand.id, cand.stage)}
                            className="p-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded border border-indigo-500/30 transition"
                            title="Advance to next stage"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Post Job Modal */}
      {showJobModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white">Post New Job Opening</h2>
              <button onClick={() => setShowJobModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  value={jobForm.title}
                  onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                  placeholder="e.g. Senior Frontend Developer"
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Department *</label>
                  <select
                    required
                    value={jobForm.departmentId}
                    onChange={(e) => setJobForm({ ...jobForm, departmentId: e.target.value })}
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
                <div>
                  <label className="block text-slate-400 mb-1">Location</label>
                  <input
                    type="text"
                    value={jobForm.location}
                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Job Description *</label>
                <textarea
                  required
                  rows={3}
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowJobModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow"
                >
                  Publish Job Posting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {showInterviewModal && selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white">Schedule Candidate Interview</h2>
              <button onClick={() => setShowInterviewModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-indigo-400 font-semibold">
              Candidate: {selectedCandidate.firstName} {selectedCandidate.lastName} ({selectedCandidate.job?.title})
            </p>

            <form onSubmit={handleScheduleInterview} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={interviewForm.scheduledAt}
                  onChange={(e) => setInterviewForm({ ...interviewForm, scheduledAt: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Meeting Link / Room *</label>
                <input
                  type="text"
                  required
                  value={interviewForm.location}
                  onChange={(e) => setInterviewForm({ ...interviewForm, location: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowInterviewModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
