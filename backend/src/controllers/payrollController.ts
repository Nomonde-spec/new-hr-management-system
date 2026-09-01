import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth';

const HOURLY_RATE = 50;

const buildHoursBasedPayroll = async (employeeId: string, month: number, year: number) => {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      employeeId,
      date: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
  });

  const hoursWorked = Number(attendanceRecords.reduce((sum, record) => sum + Number(record.totalHours || 0), 0).toFixed(2));
  const grossSalary = Number((hoursWorked * HOURLY_RATE).toFixed(2));
  const taxDeduction = Number((grossSalary * 0.18).toFixed(2));
  const netSalary = Number((grossSalary - taxDeduction).toFixed(2));

  return {
    hoursWorked,
    hourlyRate: HOURLY_RATE,
    grossSalary,
    taxDeduction,
    netSalary,
  };
};

export const getPayrolls = async (_req: AuthRequest, res: Response) => {
  try {
    const payrolls = await prisma.payroll.findMany({
      include: {
        _count: { select: { payslips: true } },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    return res.json({ success: true, payrolls });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getPayslips = async (req: AuthRequest, res: Response) => {
  try {
    const { payrollId, employeeId } = req.query;

    const where: any = {};
    if (payrollId) where.payrollId = String(payrollId);
    if (employeeId) where.employeeId = String(employeeId);

    const payslips = await prisma.payslip.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            bankName: true,
            accountNumber: true,
            department: { select: { name: true } },
            position: { select: { title: true } },
          },
        },
        payroll: { select: { title: true, month: true, year: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const enrichedPayslips = await Promise.all(
      payslips.map(async (payslip) => {
        const payrollMonth = payslip.payroll?.month || new Date().getMonth() + 1;
        const payrollYear = payslip.payroll?.year || new Date().getFullYear();
        const payrollMetrics = await buildHoursBasedPayroll(payslip.employeeId, payrollMonth, payrollYear);

        return {
          ...payslip,
          hoursWorked: payrollMetrics.hoursWorked,
          hourlyRate: payrollMetrics.hourlyRate,
          grossSalary: payrollMetrics.grossSalary,
          taxDeduction: payrollMetrics.taxDeduction,
          netSalary: payrollMetrics.netSalary,
        };
      })
    );

    return res.json({ success: true, payslips: enrichedPayslips });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const createPayrollRun = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year, title } = req.body;

    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();

    const existing = await prisma.payroll.findUnique({
      where: { month_year: { month: m, year: y } },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: `Payroll for ${m}/${y} already exists` });
    }

    const employees = await prisma.employee.findMany({
      where: { employmentStatus: { in: ['ACTIVE', 'ON_LEAVE'] } },
      include: { department: true },
    });

    let totalAmount = 0;

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const payrollTitle = title || `Payroll ${monthNames[m - 1]} ${y}`;

    const payroll = await prisma.payroll.create({
      data: {
        title: payrollTitle,
        month: m,
        year: y,
        status: 'DRAFT',
      },
    });

    for (const emp of employees) {
      const payrollMetrics = await buildHoursBasedPayroll(emp.id, m, y);
      const { hoursWorked, grossSalary, taxDeduction, netSalary } = payrollMetrics;

      totalAmount += netSalary;

      await prisma.payslip.create({
        data: {
          payrollId: payroll.id,
          employeeId: emp.id,
          payPeriod: `${monthNames[m - 1]} ${y}`,
          basicSalary: Number(grossSalary.toFixed(2)),
          allowances: 0,
          overtimePay: 0,
          deductions: 0,
          taxDeduction: Number(taxDeduction.toFixed(2)),
          netSalary: Number(netSalary.toFixed(2)),
          status: 'UNPAID',
        },
      });
    }

    const updatedPayroll = await prisma.payroll.update({
      where: { id: payroll.id },
      data: { totalAmount: Number(totalAmount.toFixed(2)), status: 'PROCESSING' },
      include: { payslips: true },
    });

    return res.status(201).json({ success: true, payroll: updatedPayroll });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const markPayslipPaid = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const payslip = await prisma.payslip.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    return res.json({ success: true, payslip });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
