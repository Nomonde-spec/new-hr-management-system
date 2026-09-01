import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth';

export const getLeaveTypes = async (_req: AuthRequest, res: Response) => {
  try {
    const leaveTypes = await prisma.leaveType.findMany({ orderBy: { name: 'asc' } });
    return res.json({ success: true, leaveTypes });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getLeaveRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { status, employeeId } = req.query;

    const where: any = {};
    if (status && String(status) !== 'ALL') {
      where.status = String(status);
    }
    if (employeeId) {
      where.employeeId = String(employeeId);
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
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
        leaveType: true,
        approver: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, leaveRequests });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getLeaveBalances = async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId } = req.query;
    const empId = (employeeId ? String(employeeId) : req.user?.employeeId) || '';

    const year = new Date().getFullYear();

    const balances = await prisma.leaveBalance.findMany({
      where: { employeeId: empId, year },
      include: { leaveType: true },
    });

    return res.json({ success: true, balances });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const requestLeave = async (req: AuthRequest, res: Response) => {
  try {
    const { leaveTypeId, startDate, endDate, reason } = req.body;
    const empId = req.user?.employeeId;

    if (!empId || !leaveTypeId || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    if (totalDays <= 0) {
      return res.status(400).json({ success: false, message: 'End date must be after or equal to start date' });
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId: empId,
        leaveTypeId,
        startDate: start,
        endDate: end,
        totalDays,
        reason,
        status: 'PENDING',
      },
      include: { leaveType: true },
    });

    // Update pending balance
    const currentYear = new Date().getFullYear();
    const balance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: empId,
          leaveTypeId,
          year: currentYear,
        },
      },
    });

    if (balance) {
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { pending: balance.pending + totalDays },
      });
    }

    return res.status(201).json({ success: true, leaveRequest });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const updateLeaveStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    const request = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    const currentYear = new Date().getFullYear();
    const balance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          year: currentYear,
        },
      },
    });

    if (status === 'APPROVED') {
      if (balance) {
        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: {
            used: balance.used + request.totalDays,
            pending: Math.max(0, balance.pending - request.totalDays),
          },
        });
      }
      await prisma.employee.update({
        where: { id: request.employeeId },
        data: { employmentStatus: 'ON_LEAVE' },
      });
    } else if (status === 'REJECTED') {
      if (balance) {
        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: {
            pending: Math.max(0, balance.pending - request.totalDays),
          },
        });
      }
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        approverId: req.user?.employeeId || null,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
      },
      include: { leaveType: true, employee: true, approver: true },
    });

    return res.json({ success: true, leaveRequest: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
