import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const role = req.user.role;
    const isAdmin = role === 'SUPER_ADMIN' || role === 'HR_MANAGER' || role === 'HR_ADMIN';
    const isDepartmentManager = role === 'MANAGER_DEPT' || role === 'MANAGERDEPT';
    let employeeWhere: any = { organizationId: req.user.organizationId || undefined };

    if (!isAdmin) {
      if (!req.user.employeeId) {
        employeeWhere = { id: '__no_employee__' };
      } else if (isDepartmentManager) {
        const managedDepartments = await prisma.department.findMany({
          where: { managerId: req.user.employeeId },
          select: { id: true },
        });
        employeeWhere = { departmentId: { in: managedDepartments.map((department) => department.id) } };
      } else if (role === 'MANAGER') {
        employeeWhere = { managerId: req.user.employeeId };
      } else {
        employeeWhere = { id: req.user.employeeId };
      }
    }

    const scopedEmployees = await prisma.employee.findMany({ where: employeeWhere, select: { id: true, departmentId: true } });
    const employeeIds = scopedEmployees.map((employee) => employee.id);
    const departmentIds = [...new Set(scopedEmployees.map((employee) => employee.departmentId).filter(Boolean))] as string[];
    const attendanceWhere: any = isAdmin ? {} : { employeeId: { in: employeeIds } };
    const leaveWhere: any = isAdmin ? { status: 'PENDING' } : { status: 'PENDING', employeeId: { in: employeeIds } };

    const [
      totalEmployees, 
      activeEmployees, 
      onLeaveEmployees, 
      totalDepartments, 
      openJobs, 
      pendingLeaveRequests, 
      recentNotifications, 
      departmentsWithCount, 
      recentAuditLogs, 
      todayAttendance,
    ] = await Promise.all([
      prisma.employee.count({ where: employeeWhere }),
      prisma.employee.count({ where: { ...employeeWhere, employmentStatus: 'ACTIVE' } }),
      prisma.employee.count({ where: { ...employeeWhere, employmentStatus: 'ON_LEAVE' } }),
      prisma.department.count({ where: isAdmin ? { organizationId: req.user.organizationId || undefined } : { id: { in: departmentIds } } }),
      prisma.job.count({ where: isAdmin ? { status: 'PUBLISHED' } : { status: 'PUBLISHED', departmentId: { in: departmentIds } } }),
      prisma.leaveRequest.count({ where: leaveWhere }),
      prisma.notification.findMany({ where: isAdmin ? undefined : { userId: req.user.id }, take: 5, orderBy: { createdAt: 'desc' } }),
      prisma.department.findMany({ where: isAdmin ? { organizationId: req.user.organizationId || undefined } : { id: { in: departmentIds } }, include: { _count: { select: { employees: true } } } }),
      prisma.auditLog.findMany({ where: isAdmin ? undefined : { userId: req.user.id }, take: 6, orderBy: { createdAt: 'desc' }, include: { user: { select: { email: true } } } }),
      prisma.attendance.findMany({ where: attendanceWhere, orderBy: { date: 'desc' }, take: 20, include: { employee: { select: { firstName: true, lastName: true, employeeId: true } } } }),
    ]);

    // Monthly Payroll Calculation
    const payrollRun = isAdmin
      ? await prisma.payroll.findFirst({ orderBy: { createdAt: 'desc' } })
      : null;

    const departmentStats = departmentsWithCount.map((dept) => ({
      id: dept.id,
      name: dept.name,
      code: dept.code,
      employeeCount: isAdmin ? dept._count.employees : scopedEmployees.filter((employee) => employee.departmentId === dept.id).length,
      budget: dept.budget,
    }));

    return res.json({
      success: true,
      stats: {
        totalEmployees,
        activeEmployees,
        onLeaveEmployees,
        totalDepartments,
        openJobs,
        pendingLeaveRequests,
        monthlyPayrollTotal: payrollRun ? payrollRun.totalAmount : 0,
      },
      departmentStats,
      recentNotifications,
      recentAuditLogs,
      todayAttendance: todayAttendance.slice(0, 5),
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
