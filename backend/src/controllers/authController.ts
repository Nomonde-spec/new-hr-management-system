import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'hrms_jwt_super_secret_key_2026_production_change_me';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, departmentId } = req.body;
    const allowedRoles = ['SUPER_ADMIN', 'HR_MANAGER', 'MANAGER_DEPT', 'MANAGER', 'EMPLOYEE'];

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and role are required' });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role selected' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    // Get or create a default organization
    let organization = await prisma.organization.findFirst();
    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          name: 'Default Organization',
          code: 'ORG-001',
        },
      });
    }

    let assignedDepartmentId: string | null = null;
    if (departmentId) {
      const department = await prisma.department.findUnique({ where: { id: String(departmentId) } });
      if (!department) {
        return res.status(400).json({ success: false, message: 'Selected department was not found' });
      }
      assignedDepartmentId = department.id;
    }

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: await bcrypt.hash(password, 10),
        role,
        organizationId: organization.id,
      },
    });

    // Automatically create an employee record for the new user
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    const employeeId = `EMP-${Date.now()}`;

    const employee = await prisma.employee.create({
      data: {
        employeeId,
        userId: user.id,
        firstName,
        lastName,
        email: normalizedEmail,
        organizationId: organization.id,
        departmentId: assignedDepartmentId,
        employmentType: 'FULL_TIME',
        employmentStatus: 'ACTIVE',
        hireDate: new Date(),
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful. You can now sign in.',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employee: {
          id: employee.id,
          employeeId: employee.employeeId,
          firstName: employee.firstName,
          lastName: employee.lastName,
        },
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        employee: true,
        organization: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or inactive account' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        employeeId: user.employee?.id || null,
      },
      JWT_SECRET as jwt.Secret,
      { expiresIn: '7d' }
    );

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        resource: 'User',
        resourceId: user.id,
        details: `User ${user.email} logged in successfully`,
      },
    });

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organization: user.organization,
        employee: user.employee,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        organization: true,
        employee: {
          include: {
            department: true,
            position: true,
            manager: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organization: user.organization,
        employee: user.employee,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getDemoAccounts = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      take: 6,
      include: {
        employee: {
          include: {
            department: true,
            position: true,
          },
        },
      },
    });

    const accounts = users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      name: u.employee ? `${u.employee.firstName} ${u.employee.lastName}` : u.email,
      department: u.employee?.department?.name || 'N/A',
      title: u.employee?.position?.title || u.role,
    }));

    return res.json({ success: true, accounts });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
