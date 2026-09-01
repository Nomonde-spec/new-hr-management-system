import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth';

export const getJobs = async (req: Request, res: Response) => {
  try {
    const { status, departmentId } = req.query;

    const where: any = {};
    if (status && String(status) !== 'ALL') where.status = String(status);
    if (departmentId && String(departmentId) !== 'ALL') where.departmentId = String(departmentId);

    const jobs = await prisma.job.findMany({
      where,
      include: {
        department: { select: { name: true, code: true } },
        position: { select: { title: true } },
        recruiter: { select: { firstName: true, lastName: true } },
        _count: { select: { candidates: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, jobs });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const createJob = async (req: AuthRequest, res: Response) => {
  try {
    const { title, departmentId, positionId, location, employmentType, minSalary, maxSalary, description, requirements, responsibilities } = req.body;

    const count = await prisma.job.count();
    const code = `JOB-2026-${String(count + 1).padStart(3, '0')}`;

    const job = await prisma.job.create({
      data: {
        title,
        code,
        departmentId,
        positionId: positionId || null,
        location: location || 'Remote',
        employmentType: employmentType || 'FULL_TIME',
        minSalary: minSalary ? parseFloat(minSalary) : null,
        maxSalary: maxSalary ? parseFloat(maxSalary) : null,
        description,
        requirements,
        responsibilities,
        recruiterId: req.user?.employeeId || null,
        status: 'PUBLISHED',
      },
      include: { department: true },
    });

    return res.status(201).json({ success: true, job });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getCandidates = async (req: Request, res: Response) => {
  try {
    const { jobId, stage } = req.query;

    const where: any = {};
    if (jobId) where.jobId = String(jobId);
    if (stage && String(stage) !== 'ALL') where.stage = String(stage);

    const candidates = await prisma.candidate.findMany({
      where,
      include: {
        job: { select: { id: true, title: true, code: true } },
        interviews: { include: { interviewer: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, candidates });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const updateCandidateStage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { stage, notes, rating } = req.body;

    const updated = await prisma.candidate.update({
      where: { id },
      data: {
        stage,
        notes: notes !== undefined ? notes : undefined,
        rating: rating !== undefined ? parseInt(rating) : undefined,
      },
      include: { job: true },
    });

    return res.json({ success: true, candidate: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const scheduleInterview = async (req: AuthRequest, res: Response) => {
  try {
    const { candidateId, jobId, interviewerId, scheduledAt, location, feedback } = req.body;

    const interview = await prisma.interview.create({
      data: {
        candidateId,
        jobId,
        interviewerId: interviewerId || req.user?.employeeId || null,
        scheduledAt: new Date(scheduledAt),
        location: location || 'Google Meet',
        feedback,
        status: 'SCHEDULED',
      },
      include: {
        candidate: true,
        job: true,
        interviewer: { select: { firstName: true, lastName: true } },
      },
    });

    await prisma.candidate.update({
      where: { id: candidateId },
      data: { stage: 'INTERVIEW' },
    });

    return res.status(201).json({ success: true, interview });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
