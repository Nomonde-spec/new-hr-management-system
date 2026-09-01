import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth';

export const getAttendanceLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId, startDate, endDate } = req.query;

    const where: any = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'HR_MANAGER'
      ? {}
      : { employeeId: req.user?.employeeId || '__no_employee__' };
    if (employeeId && (req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'HR_MANAGER')) where.employeeId = String(employeeId);
    if (startDate && endDate) {
      where.date = {
        gte: new Date(String(startDate)),
        lte: new Date(String(endDate)),
      };
    }

    const attendances = await prisma.attendance.findMany({
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
      take: 100,
    });

    return res.json({ success: true, attendances });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const clockIn = async (req: AuthRequest, res: Response) => {
  try {
    const empId = req.user?.employeeId;
    if (!empId) {
      return res.status(400).json({ success: false, message: 'Employee ID is required' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.attendance.findFirst({
      where: { employeeId: empId, date: today },
    });

    if (existing && existing.clockIn) {
      return res.status(400).json({ success: false, message: 'Already clocked in today', attendance: existing });
    }

    const now = new Date();
    const targetTime = new Date();
    targetTime.setHours(9, 0, 0, 0); // 9:00 AM standard start

    const isLate = now > targetTime;

    const attendance = existing
      ? await prisma.attendance.update({
          where: { id: existing.id },
          data: {
            clockIn: now,
            status: isLate ? 'LATE' : 'PRESENT',
            notes: isLate ? 'Clocked in after 09:00 AM' : 'On time',
          },
        })
      : await prisma.attendance.create({
          data: {
            employeeId: empId,
            date: today,
            clockIn: now,
            status: isLate ? 'LATE' : 'PRESENT',
            notes: isLate ? 'Clocked in after 09:00 AM' : 'On time',
          },
        });

    return res.json({ success: true, message: 'Clocked in successfully', attendance });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const clockOut = async (req: AuthRequest, res: Response) => {
  try {
    const empId = req.user?.employeeId;

    if (!empId) {
      return res.status(400).json({ success: false, message: 'Employee ID is required' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findFirst({
      where: { employeeId: empId, date: today },
    });

    if (!attendance || !attendance.clockIn) {
      return res.status(400).json({ success: false, message: 'Must clock in before clocking out' });
    }

    const now = new Date();
    const sessionHours = Number(((now.getTime() - new Date(attendance.clockIn).getTime()) / (1000 * 60 * 60)).toFixed(2));
    const updatedTotalHours = Number((Number(attendance.totalHours || 0) + sessionHours).toFixed(2));

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        clockOut: now,
        clockIn: null,
        totalHours: updatedTotalHours,
        status: updatedTotalHours >= 8 ? 'PRESENT' : updatedTotalHours > 0 ? 'HALF_DAY' : 'ABSENT',
      },
    });

    return res.json({ success: true, message: 'Clocked out successfully', attendance: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
