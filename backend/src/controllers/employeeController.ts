import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth';

export const getEmployees = async (req: Request, res: Response) => {
  try {
    const { search, departmentId, status, employmentType } = req.query;

    const where: any = {};

    if (search) {
      const q = String(search).trim();
      where.OR = [
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { email: { contains: q } },
        { employeeId: { contains: q } },
      ];
    }

    if (departmentId && String(departmentId) !== 'ALL') {
      where.departmentId = String(departmentId);
    }

    if (status && String(status) !== 'ALL') {
      where.employmentStatus = String(status);
    }

    if (employmentType && String(employmentType) !== 'ALL') {
      where.employmentType = String(employmentType);
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        department: true,
        position: true,
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        user: {
          select: { role: true, isActive: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, employees });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        position: true,
        manager: true,
        subordinates: true,
        user: { select: { id: true, email: true, role: true, isActive: true } },
        leaveBalances: { include: { leaveType: true } },
        leaveRequests: { include: { leaveType: true }, take: 10, orderBy: { createdAt: 'desc' } },
        attendances: { take: 15, orderBy: { date: 'desc' } },
        payslips: { take: 6, orderBy: { createdAt: 'desc' } },
        receivedReviews: { take: 5, orderBy: { createdAt: 'desc' } },
        goals: { orderBy: { dueDate: 'asc' } },
      },
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    return res.json({ success: true, employee });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const createEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      phone,
      departmentId,
      positionId,
      managerId,
      basicSalary,
      employmentType,
      employmentStatus,
      bankName,
      accountNumber,
    } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ success: false, message: 'First name, last name, and email are required' });
    }

    // Check if email exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const org = await prisma.organization.findFirst();
    if (!org) {
      return res.status(400).json({ success: false, message: 'Organization does not exist' });
    }

    const passwordHash = await bcrypt.hash(password || 'password123', 10);

    const count = await prisma.employee.count();
    const employeeId = `EMP-${String(count + 1).padStart(3, '0')}`;

    const user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        role: role || 'EMPLOYEE',
        organizationId: org.id,
      },
    });

    const employee = await prisma.employee.create({
      data: {
        employeeId,
        userId: user.id,
        firstName,
        lastName,
        email,
        phone,
        organizationId: org.id,
        departmentId: departmentId || null,
        positionId: positionId || null,
        managerId: managerId || null,
        basicSalary: basicSalary ? parseFloat(basicSalary) : 0,
        employmentType: employmentType || 'FULL_TIME',
        employmentStatus: employmentStatus || 'ACTIVE',
        bankName,
        accountNumber,
      },
      include: {
        department: true,
        position: true,
      },
    });

    // Create default leave balances
    const leaveTypes = await prisma.leaveType.findMany();
    for (const lt of leaveTypes) {
      await prisma.leaveBalance.create({
        data: {
          employeeId: employee.id,
          leaveTypeId: lt.id,
          year: new Date().getFullYear(),
          allocated: lt.maxDays,
          used: 0,
          pending: 0,
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || user.id,
        action: 'EMPLOYEE_CREATED',
        resource: 'Employee',
        resourceId: employee.id,
        details: `Employee ${employee.firstName} ${employee.lastName} created`,
      },
    });

    return res.status(201).json({ success: true, employee });
  } catch (error: any) {
    console.error('Create employee error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const updateEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        departmentId: data.departmentId || null,
        positionId: data.positionId || null,
        managerId: data.managerId || null,
        basicSalary: data.basicSalary !== undefined ? parseFloat(data.basicSalary) : undefined,
        employmentType: data.employmentType,
        employmentStatus: data.employmentStatus,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
      },
      include: {
        department: true,
        position: true,
      },
    });

    if (data.role && existing.userId) {
      await prisma.user.update({
        where: { id: existing.userId },
        data: { role: data.role },
      });
    }

    return res.json({ success: true, employee: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const deleteEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const emp = await prisma.employee.findUnique({ where: { id } });
    if (!emp) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    await prisma.employee.delete({ where: { id } });
    if (emp.userId) {
      await prisma.user.delete({ where: { id: emp.userId } });
    }

    return res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
