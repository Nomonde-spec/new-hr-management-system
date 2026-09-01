import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth';

const normalizeDateOnly = (value?: string | Date) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date();
  }

  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

export const getWorkReports = async (req: AuthRequest, res: Response) => {
  try {
    const employeeId = req.user?.employeeId;
    const role = req.user?.role || '';
    const canViewAll = role === 'HR_MANAGER';

    const where = canViewAll
      ? {}
      : { employeeId: employeeId || '__missing__' };

    const reports = await prisma.workReport.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 200,
    });

    const filteredReports = canViewAll ? reports : reports.filter((report) => report.employeeId === employeeId);

    return res.json({ success: true, reports: filteredReports });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const submitWorkReport = async (req: AuthRequest, res: Response) => {
  try {
    const employeeId = req.user?.employeeId;
    const { date, summary, tasks, blockers, hoursWorked, attachmentUrl } = req.body;

    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Employee profile is required to submit a work report.' });
    }

    if (!summary || String(summary).trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Please provide a clear summary of your daily work.' });
    }

    const normalizedDate = normalizeDateOnly(date);
    const hours = Number(hoursWorked) || 0;

    const report = await prisma.workReport.create({
      data: {
        employeeId,
        date: normalizedDate,
        summary: String(summary).trim(),
        tasks: tasks ? String(tasks).trim() : null,
        blockers: blockers ? String(blockers).trim() : null,
        hoursWorked: hours,
        attachmentUrl: attachmentUrl ? String(attachmentUrl).trim() : null,
        status: 'SUBMITTED',
      },
    });

    return res.status(201).json({ success: true, message: 'Daily work report submitted successfully.', report });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const updateWorkReportStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, managerNotes } = req.body;

    if (!['APPROVED', 'REJECTED', 'REVIEWED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const report = await prisma.workReport.update({
      where: { id },
      data: {
        status,
        managerNotes: managerNotes ? String(managerNotes).trim() : null,
      },
    });

    return res.json({ success: true, message: 'Work report status updated.', report });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
