import { Request, Response } from 'express';
import { prisma } from '../config/db';

export const getDepartments = async (_req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: {
          select: { employees: true, jobs: true, positions: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return res.json({ success: true, departments });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getPositions = async (req: Request, res: Response) => {
  try {
    const { departmentId } = req.query;

    const where: any = {};
    if (departmentId && String(departmentId) !== 'ALL') {
      where.departmentId = String(departmentId);
    }

    const positions = await prisma.position.findMany({
      where,
      include: {
        department: { select: { id: true, name: true, code: true } },
        _count: { select: { employees: true, jobs: true } },
      },
      orderBy: { title: 'asc' },
    });

    return res.json({ success: true, positions });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { name, code, description, budget, managerId } = req.body;

    const org = await prisma.organization.findFirst();
    if (!org) return res.status(400).json({ success: false, message: 'Organization not found' });

    const dept = await prisma.department.create({
      data: {
        name,
        code: code.toUpperCase(),
        description,
        budget: budget ? parseFloat(budget) : 0,
        managerId: managerId || null,
        organizationId: org.id,
      },
    });

    return res.status(201).json({ success: true, department: dept });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const createPosition = async (req: Request, res: Response) => {
  try {
    const { title, code, description, minSalary, maxSalary, skills, departmentId } = req.body;

    const position = await prisma.position.create({
      data: {
        title,
        code: code.toUpperCase(),
        description,
        minSalary: minSalary ? parseFloat(minSalary) : 0,
        maxSalary: maxSalary ? parseFloat(maxSalary) : 0,
        skills,
        departmentId,
      },
      include: { department: true },
    });

    return res.status(201).json({ success: true, position });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const { name, code, description, budget, managerId } = req.body;
    const department = await prisma.department.update({ where: { id: req.params.id }, data: { name, code: code?.toUpperCase(), description, budget: budget === undefined ? undefined : parseFloat(budget), managerId: managerId || null } });
    return res.json({ success: true, department });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const department = await prisma.department.findUnique({ where: { id: req.params.id }, include: { _count: { select: { employees: true, positions: true, jobs: true } } } });
    if (!department) return res.status(404).json({ success: false, message: 'Department not found' });
    if (department._count.employees || department._count.positions || department._count.jobs) return res.status(409).json({ success: false, message: 'Move employees, positions, and jobs before deleting this department' });
    await prisma.department.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Department deleted' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
