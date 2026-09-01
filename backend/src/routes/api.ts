import { Router } from 'express';
import * as authController from '../controllers/authController';
import * as dashboardController from '../controllers/dashboardController';
import * as employeeController from '../controllers/employeeController';
import * as departmentController from '../controllers/departmentController';
import * as attendanceController from '../controllers/attendanceController';
import * as leaveController from '../controllers/leaveController';
import * as payrollController from '../controllers/payrollController';
import * as workReportController from '../controllers/workReportController';
import * as recruitmentController from '../controllers/recruitmentController';
import * as performanceController from '../controllers/performanceController';
import { authenticateJWT, requireRoles } from '../middleware/auth';

const router = Router();

// Auth Routes (Public)
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.get('/auth/demo-accounts', authController.getDemoAccounts);
router.get('/auth/me', authenticateJWT, authController.getMe);

// Dashboard (Protected)
router.get('/dashboard/stats', authenticateJWT, dashboardController.getDashboardStats);

// Employees (Protected)
router.get('/employees', authenticateJWT, employeeController.getEmployees);
router.get('/employees/:id', authenticateJWT, employeeController.getEmployeeById);
router.post('/employees', authenticateJWT, requireRoles(['SUPER_ADMIN', 'HR_MANAGER']), employeeController.createEmployee);
router.put('/employees/:id', authenticateJWT, requireRoles(['SUPER_ADMIN', 'HR_MANAGER']), employeeController.updateEmployee);
router.delete('/employees/:id', authenticateJWT, requireRoles(['SUPER_ADMIN', 'HR_MANAGER']), employeeController.deleteEmployee);

// Departments & Positions
router.get('/departments', departmentController.getDepartments);
router.post('/departments', authenticateJWT, requireRoles(['SUPER_ADMIN', 'HR_MANAGER']), departmentController.createDepartment);
router.put('/departments/:id', authenticateJWT, requireRoles(['SUPER_ADMIN', 'HR_MANAGER']), departmentController.updateDepartment);
router.delete('/departments/:id', authenticateJWT, requireRoles(['SUPER_ADMIN', 'HR_MANAGER']), departmentController.deleteDepartment);
router.get('/positions', authenticateJWT, departmentController.getPositions);
router.post('/positions', authenticateJWT, departmentController.createPosition);

// Attendance (Protected)
router.get('/attendance', authenticateJWT, attendanceController.getAttendanceLogs);
router.post('/attendance/clock-in', authenticateJWT, attendanceController.clockIn);
router.post('/attendance/clock-out', authenticateJWT, attendanceController.clockOut);

// Daily Work Reports (Protected)
router.get('/work-reports', authenticateJWT, workReportController.getWorkReports);
router.post('/work-reports', authenticateJWT, workReportController.submitWorkReport);
router.put('/work-reports/:id/status', authenticateJWT, requireRoles(['HR_MANAGER']), workReportController.updateWorkReportStatus);

// Leave Management (Protected)
router.get('/leave/types', authenticateJWT, leaveController.getLeaveTypes);
router.get('/leave/requests', authenticateJWT, leaveController.getLeaveRequests);
router.get('/leave/balances', authenticateJWT, leaveController.getLeaveBalances);
router.post('/leave/requests', authenticateJWT, leaveController.requestLeave);
router.put('/leave/requests/:id/status', authenticateJWT, requireRoles(['HR_MANAGER']), leaveController.updateLeaveStatus);

// Payroll & Payslips (HR only)
router.get('/payroll', authenticateJWT, requireRoles(['HR_MANAGER']), payrollController.getPayrolls);
router.post('/payroll/run', authenticateJWT, requireRoles(['HR_MANAGER']), payrollController.createPayrollRun);
router.get('/payslips', authenticateJWT, requireRoles(['HR_MANAGER']), payrollController.getPayslips);
router.put('/payslips/:id/pay', authenticateJWT, requireRoles(['HR_MANAGER']), payrollController.markPayslipPaid);

// Recruitment / ATS (HR only for posting jobs)
router.get('/jobs', authenticateJWT, recruitmentController.getJobs);
router.post('/jobs', authenticateJWT, requireRoles(['HR_MANAGER']), recruitmentController.createJob);
router.get('/candidates', authenticateJWT, recruitmentController.getCandidates);
router.put('/candidates/:id/stage', authenticateJWT, recruitmentController.updateCandidateStage);
router.post('/interviews', authenticateJWT, recruitmentController.scheduleInterview);

// Performance & Goals (Protected)
router.get('/performance/reviews', authenticateJWT, performanceController.getPerformanceReviews);
router.post('/performance/reviews', authenticateJWT, performanceController.createPerformanceReview);
router.get('/performance/goals', authenticateJWT, performanceController.getGoals);
router.post('/performance/goals', authenticateJWT, performanceController.createGoal);
router.put('/performance/goals/:id/progress', authenticateJWT, performanceController.updateGoalProgress);

export default router;
