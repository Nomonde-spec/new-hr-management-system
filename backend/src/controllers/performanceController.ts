import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth';

export const getPerformanceReviews = async (req: AuthRequest, res: Response) => {
  try {
    const { revieweeId } = req.query;

    const where: any = {};
    if (revieweeId) where.revieweeId = String(revieweeId);

    const reviews = await prisma.performanceReview.findMany({
      where,
      include: {
        reviewer: { select: { id: true, firstName: true, lastName: true, email: true } },
        reviewee: { select: { id: true, firstName: true, lastName: true, department: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, reviews });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const createPerformanceReview = async (req: AuthRequest, res: Response) => {
  try {
    const {
      revieweeId,
      reviewPeriod,
      qualityOfWork,
      productivity,
      teamwork,
      communication,
      attendanceRating,
      problemSolving,
      leadership,
      professionalism,
      feedback,
      goalsForNextPeriod,
    } = req.body;

    const scores = [
      qualityOfWork,
      productivity,
      teamwork,
      communication,
      attendanceRating,
      problemSolving,
      leadership,
      professionalism,
    ].map((s) => parseInt(s) || 3);

    const overallScore = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));

    const review = await prisma.performanceReview.create({
      data: {
        reviewerId: req.user?.employeeId || revieweeId,
        revieweeId,
        reviewPeriod: reviewPeriod || 'H2 2026',
        qualityOfWork: scores[0],
        productivity: scores[1],
        teamwork: scores[2],
        communication: scores[3],
        attendanceRating: scores[4],
        problemSolving: scores[5],
        leadership: scores[6],
        professionalism: scores[7],
        overallScore,
        feedback,
        goalsForNextPeriod,
      },
      include: {
        reviewer: { select: { firstName: true, lastName: true } },
        reviewee: { select: { firstName: true, lastName: true } },
      },
    });

    return res.status(201).json({ success: true, review });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getGoals = async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId, status } = req.query;

    const where: any = {};
    if (employeeId) where.employeeId = String(employeeId);
    if (status && String(status) !== 'ALL') where.status = String(status);

    const goals = await prisma.goal.findMany({
      where,
      include: {
        employee: { select: { firstName: true, lastName: true, department: { select: { name: true } } } },
      },
      orderBy: { dueDate: 'asc' },
    });

    return res.json({ success: true, goals });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const createGoal = async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId, title, description, startDate, dueDate, priority } = req.body;

    const empId = employeeId || req.user?.employeeId;
    if (!empId || !title || !dueDate) {
      return res.status(400).json({ success: false, message: 'Employee ID, title, and due date are required' });
    }

    const goal = await prisma.goal.create({
      data: {
        employeeId: empId,
        title,
        description,
        startDate: startDate ? new Date(startDate) : new Date(),
        dueDate: new Date(dueDate),
        priority: priority || 'MEDIUM',
        progress: 0,
        status: 'NOT_STARTED',
      },
    });

    return res.status(201).json({ success: true, goal });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const updateGoalProgress = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { progress, status } = req.body;

    const progNum = Math.min(100, Math.max(0, parseInt(progress) || 0));
    let autoStatus = status;
    if (!status) {
      if (progNum === 100) autoStatus = 'COMPLETED';
      else if (progNum > 0) autoStatus = 'IN_PROGRESS';
      else autoStatus = 'NOT_STARTED';
    }

    const updated = await prisma.goal.update({
      where: { id },
      data: {
        progress: progNum,
        status: autoStatus,
      },
    });

    return res.json({ success: true, goal: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
