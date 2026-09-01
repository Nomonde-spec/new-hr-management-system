import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.document.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.performanceReview.deleteMany();
  await prisma.payslip.deleteMany();
  await prisma.payroll.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.leaveType.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.job.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.position.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Acme Enterprise Solutions',
      code: 'ACME',
      website: 'https://acme-enterprise.com',
      email: 'contact@acme-enterprise.com',
      phone: '+1 (555) 019-2834',
      address: '100 Innovation Way, Suite 400, Tech City, CA 94016',
    },
  });
  console.log(`✅ Organization created: ${org.name}`);

  // 2. Create Leave Types
  const leaveTypes = await Promise.all([
    prisma.leaveType.create({
      data: { name: 'Annual Leave', code: 'ANNUAL', maxDays: 20, isPaid: true, description: 'Standard paid annual vacation leave' },
    }),
    prisma.leaveType.create({
      data: { name: 'Sick Leave', code: 'SICK', maxDays: 12, isPaid: true, description: 'Paid medical or sick leave' },
    }),
    prisma.leaveType.create({
      data: { name: 'Maternity Leave', code: 'MATERNITY', maxDays: 90, isPaid: true, description: 'Maternity leave for new mothers' },
    }),
    prisma.leaveType.create({
      data: { name: 'Paternity Leave', code: 'PATERNITY', maxDays: 10, isPaid: true, description: 'Paternity leave for new fathers' },
    }),
    prisma.leaveType.create({
      data: { name: 'Study Leave', code: 'STUDY', maxDays: 5, isPaid: true, description: 'Professional development and examination leave' },
    }),
    prisma.leaveType.create({
      data: { name: 'Unpaid Leave', code: 'UNPAID', maxDays: 30, isPaid: false, description: 'Approved unpaid leave of absence' },
    }),
  ]);
  console.log(`✅ ${leaveTypes.length} Leave types created`);

  // 3. Create Departments
  const engDept = await prisma.department.create({
    data: { name: 'Engineering', code: 'ENG', description: 'Software Engineering & Infrastructure', budget: 1200000, organizationId: org.id },
  });
  const hrDept = await prisma.department.create({
    data: { name: 'Human Resources', code: 'HR', description: 'People Operations & Talent Acquisition', budget: 450000, organizationId: org.id },
  });
  const salesDept = await prisma.department.create({
    data: { name: 'Sales & Marketing', code: 'SALES', description: 'Revenue Growth & Marketing Strategy', budget: 850000, organizationId: org.id },
  });
  const prodDept = await prisma.department.create({
    data: { name: 'Product & Design', code: 'PROD', description: 'Product Management & UI/UX Design', budget: 600000, organizationId: org.id },
  });
  console.log(`✅ 4 Departments created`);

  // 4. Create Positions
  const posEngLead = await prisma.position.create({
    data: { title: 'Lead Software Engineer', code: 'ENG-LEAD', departmentId: engDept.id, minSalary: 120000, maxSalary: 160000, skills: 'TypeScript, React, Node.js, PostgreSQL' },
  });
  const posSeniorDev = await prisma.position.create({
    data: { title: 'Senior Full Stack Engineer', code: 'ENG-SR', departmentId: engDept.id, minSalary: 95000, maxSalary: 130000, skills: 'React, Node.js, Next.js, Prisma' },
  });
  const posDevOps = await prisma.position.create({
    data: { title: 'DevOps & Cloud Specialist', code: 'ENG-OPS', departmentId: engDept.id, minSalary: 90000, maxSalary: 125000, skills: 'AWS, Docker, Kubernetes, CI/CD' },
  });
  const posHRDir = await prisma.position.create({
    data: { title: 'Director of Human Resources', code: 'HR-DIR', departmentId: hrDept.id, minSalary: 110000, maxSalary: 150000, skills: 'Labor Law, Talent Management, Payroll, HRIS' },
  });
  const posHRSpec = await prisma.position.create({
    data: { title: 'HR Specialist', code: 'HR-SPEC', departmentId: hrDept.id, minSalary: 60000, maxSalary: 85000, skills: 'Onboarding, Employee Relations, Benefits' },
  });
  const posSalesDir = await prisma.position.create({
    data: { title: 'Sales Director', code: 'SALES-DIR', departmentId: salesDept.id, minSalary: 115000, maxSalary: 165000, skills: 'Enterprise Sales, CRM, Negotiation' },
  });
  const posProdMgr = await prisma.position.create({
    data: { title: 'Senior Product Manager', code: 'PROD-SR', departmentId: prodDept.id, minSalary: 105000, maxSalary: 145000, skills: 'Roadmap, Agile, Analytics, User Research' },
  });
  const posDesigner = await prisma.position.create({
    data: { title: 'Lead UI/UX Designer', code: 'DES-LEAD', departmentId: prodDept.id, minSalary: 85000, maxSalary: 120000, skills: 'Figma, Wireframing, Design Systems' },
  });
  console.log(`✅ 8 Positions created`);

  // 5. Create Key Users & Employees
  // Account 1: Super Admin / HR Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@acme.com',
      password: passwordHash,
      role: 'SUPER_ADMIN',
      organizationId: org.id,
    },
  });

  const adminEmployee = await prisma.employee.create({
    data: {
      employeeId: 'EMP-001',
      userId: adminUser.id,
      firstName: 'Eleanor',
      lastName: 'Vance',
      email: 'admin@acme.com',
      phone: '+1 (555) 234-5678',
      gender: 'FEMALE',
      dateOfBirth: new Date('1985-04-12'),
      address: '42 Wallaby Way, Tech Center, CA',
      organizationId: org.id,
      departmentId: hrDept.id,
      positionId: posHRDir.id,
      employmentType: 'FULL_TIME',
      employmentStatus: 'ACTIVE',
      hireDate: new Date('2020-01-15'),
      basicSalary: 135000,
      bankName: 'Silicon Valley Bank',
      accountNumber: '9876543210',
      branchCode: 'SVB123',
    },
  });

  // Account 2: HR Manager
  const hrManagerUser = await prisma.user.create({
    data: {
      email: 'hrmanager@acme.com',
      password: passwordHash,
      role: 'HR_MANAGER',
      organizationId: org.id,
    },
  });

  const hrManagerEmp = await prisma.employee.create({
    data: {
      employeeId: 'EMP-002',
      userId: hrManagerUser.id,
      firstName: 'Marcus',
      lastName: 'Sterling',
      email: 'hrmanager@acme.com',
      phone: '+1 (555) 345-6789',
      gender: 'MALE',
      dateOfBirth: new Date('1988-08-22'),
      address: '742 Evergreen Terrace, Tech City',
      organizationId: org.id,
      departmentId: hrDept.id,
      positionId: posHRSpec.id,
      managerId: adminEmployee.id,
      employmentType: 'FULL_TIME',
      employmentStatus: 'ACTIVE',
      hireDate: new Date('2021-03-01'),
      basicSalary: 82000,
      bankName: 'Chase Bank',
      accountNumber: '8765432109',
      branchCode: 'CHS456',
    },
  });

  // Account 3: Tech Manager / Lead
  const techLeadUser = await prisma.user.create({
    data: {
      email: 'manager@acme.com',
      password: passwordHash,
      role: 'MANAGER',
      organizationId: org.id,
    },
  });

  const techLeadEmp = await prisma.employee.create({
    data: {
      employeeId: 'EMP-003',
      userId: techLeadUser.id,
      firstName: 'David',
      lastName: 'Chen',
      email: 'manager@acme.com',
      phone: '+1 (555) 456-7890',
      gender: 'MALE',
      dateOfBirth: new Date('1986-11-05'),
      address: '128 Silicon Ave, San Jose, CA',
      organizationId: org.id,
      departmentId: engDept.id,
      positionId: posEngLead.id,
      managerId: adminEmployee.id,
      employmentType: 'FULL_TIME',
      employmentStatus: 'ACTIVE',
      hireDate: new Date('2019-06-10'),
      basicSalary: 150000,
      bankName: 'Bank of America',
      accountNumber: '7654321098',
      branchCode: 'BOA789',
    },
  });

  // Update Engineering department manager
  await prisma.department.update({
    where: { id: engDept.id },
    data: { managerId: techLeadEmp.id },
  });
  await prisma.department.update({
    where: { id: hrDept.id },
    data: { managerId: adminEmployee.id },
  });

  // Account 4: Regular Employee (Senior Dev)
  const devUser = await prisma.user.create({
    data: {
      email: 'employee@acme.com',
      password: passwordHash,
      role: 'EMPLOYEE',
      organizationId: org.id,
    },
  });

  const devEmp = await prisma.employee.create({
    data: {
      employeeId: 'EMP-004',
      userId: devUser.id,
      firstName: 'Sophia',
      lastName: 'Rodriguez',
      email: 'employee@acme.com',
      phone: '+1 (555) 567-8901',
      gender: 'FEMALE',
      dateOfBirth: new Date('1992-02-18'),
      address: '500 Tech Hub Blvd, San Francisco, CA',
      organizationId: org.id,
      departmentId: engDept.id,
      positionId: posSeniorDev.id,
      managerId: techLeadEmp.id,
      employmentType: 'FULL_TIME',
      employmentStatus: 'ACTIVE',
      hireDate: new Date('2022-04-15'),
      basicSalary: 110000,
      bankName: 'Wells Fargo',
      accountNumber: '6543210987',
      branchCode: 'WFC321',
    },
  });

  // Account 5: DevOps Specialist
  const devOpsUser = await prisma.user.create({
    data: {
      email: 'alex.devops@acme.com',
      password: passwordHash,
      role: 'EMPLOYEE',
      organizationId: org.id,
    },
  });

  const devOpsEmp = await prisma.employee.create({
    data: {
      employeeId: 'EMP-005',
      userId: devOpsUser.id,
      firstName: 'Alex',
      lastName: 'Kowalski',
      email: 'alex.devops@acme.com',
      phone: '+1 (555) 678-9012',
      gender: 'MALE',
      dateOfBirth: new Date('1990-09-30'),
      organizationId: org.id,
      departmentId: engDept.id,
      positionId: posDevOps.id,
      managerId: techLeadEmp.id,
      employmentType: 'FULL_TIME',
      employmentStatus: 'ACTIVE',
      hireDate: new Date('2022-08-01'),
      basicSalary: 105000,
      bankName: 'Chase Bank',
    },
  });

  // Account 6: Product Manager
  const pmUser = await prisma.user.create({
    data: {
      email: 'sarah.pm@acme.com',
      password: passwordHash,
      role: 'MANAGER',
      organizationId: org.id,
    },
  });

  const pmEmp = await prisma.employee.create({
    data: {
      employeeId: 'EMP-006',
      userId: pmUser.id,
      firstName: 'Sarah',
      lastName: 'Jenkins',
      email: 'sarah.pm@acme.com',
      phone: '+1 (555) 789-0123',
      gender: 'FEMALE',
      organizationId: org.id,
      departmentId: prodDept.id,
      positionId: posProdMgr.id,
      managerId: adminEmployee.id,
      employmentType: 'FULL_TIME',
      employmentStatus: 'ACTIVE',
      hireDate: new Date('2021-09-15'),
      basicSalary: 130000,
      bankName: 'Citibank',
    },
  });

  // Account 7: UI/UX Designer
  const designerUser = await prisma.user.create({
    data: {
      email: 'lisa.designer@acme.com',
      password: passwordHash,
      role: 'EMPLOYEE',
      organizationId: org.id,
    },
  });

  const designerEmp = await prisma.employee.create({
    data: {
      employeeId: 'EMP-007',
      userId: designerUser.id,
      firstName: 'Lisa',
      lastName: 'Monroe',
      email: 'lisa.designer@acme.com',
      phone: '+1 (555) 890-1234',
      gender: 'FEMALE',
      organizationId: org.id,
      departmentId: prodDept.id,
      positionId: posDesigner.id,
      managerId: pmEmp.id,
      employmentType: 'FULL_TIME',
      employmentStatus: 'ACTIVE',
      hireDate: new Date('2023-01-10'),
      basicSalary: 95000,
      bankName: 'Bank of America',
    },
  });

  // Account 8: Sales Director
  const salesDirUser = await prisma.user.create({
    data: {
      email: 'james.sales@acme.com',
      password: passwordHash,
      role: 'MANAGER',
      organizationId: org.id,
    },
  });

  const salesDirEmp = await prisma.employee.create({
    data: {
      employeeId: 'EMP-008',
      userId: salesDirUser.id,
      firstName: 'James',
      lastName: 'O\'Connor',
      email: 'james.sales@acme.com',
      phone: '+1 (555) 901-2345',
      gender: 'MALE',
      organizationId: org.id,
      departmentId: salesDept.id,
      positionId: posSalesDir.id,
      managerId: adminEmployee.id,
      employmentType: 'FULL_TIME',
      employmentStatus: 'ACTIVE',
      hireDate: new Date('2020-05-20'),
      basicSalary: 140000,
      bankName: 'Silicon Valley Bank',
    },
  });

  // Account 9: Mitchell (Custom User)
  const mitchellUser = await prisma.user.create({
    data: {
      email: 'mitchell@gmail.com',
      password: passwordHash,
      role: 'EMPLOYEE',
      organizationId: org.id,
    },
  });

  const mitchellEmp = await prisma.employee.create({
    data: {
      employeeId: 'EMP-009',
      userId: mitchellUser.id,
      firstName: 'Mitchell',
      lastName: 'Johnson',
      email: 'mitchell@gmail.com',
      phone: '+1 (555) 234-5678',
      gender: 'MALE',
      dateOfBirth: new Date('1995-06-15'),
      address: '1250 Tech Drive, San Francisco, CA',
      organizationId: org.id,
      departmentId: engDept.id,
      positionId: posSeniorDev.id,
      managerId: techLeadEmp.id,
      employmentType: 'FULL_TIME',
      employmentStatus: 'ACTIVE',
      hireDate: new Date('2023-07-01'),
      basicSalary: 120000,
      bankName: 'Chase Bank',
      accountNumber: '5555555555',
      branchCode: 'CHB999',
    },
  });

  const allEmployees = [adminEmployee, hrManagerEmp, techLeadEmp, devEmp, devOpsEmp, pmEmp, designerEmp, salesDirEmp, mitchellEmp];
  console.log(`✅ 9 Users and Employees seeded`);

  // 6. Leave Balances & Requests
  for (const emp of allEmployees) {
    for (const lt of leaveTypes) {
      const allocatedDays = lt.code === 'ANNUAL' ? 20 : lt.code === 'SICK' ? 12 : 5;
      await prisma.leaveBalance.create({
        data: {
          employeeId: emp.id,
          leaveTypeId: lt.id,
          year: 2026,
          allocated: allocatedDays,
          used: emp.id === devEmp.id ? 4 : emp.id === techLeadEmp.id ? 2 : 0,
          pending: emp.id === devEmp.id ? 3 : 0,
        },
      });
    }
  }

  // Create sample Leave Requests
  const annualLt = leaveTypes.find(l => l.code === 'ANNUAL')!;
  const sickLt = leaveTypes.find(l => l.code === 'SICK')!;

  await prisma.leaveRequest.create({
    data: {
      employeeId: devEmp.id,
      leaveTypeId: annualLt.id,
      startDate: new Date('2026-09-10'),
      endDate: new Date('2026-09-15'),
      totalDays: 5,
      reason: 'Family vacation and personal downtime',
      status: 'PENDING',
    },
  });

  await prisma.leaveRequest.create({
    data: {
      employeeId: devOpsEmp.id,
      leaveTypeId: sickLt.id,
      startDate: new Date('2026-08-20'),
      endDate: new Date('2026-08-21'),
      totalDays: 2,
      reason: 'Severe flu and doctor visit',
      status: 'APPROVED',
      approverId: techLeadEmp.id,
    },
  });

  await prisma.leaveRequest.create({
    data: {
      employeeId: designerEmp.id,
      leaveTypeId: annualLt.id,
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-05'),
      totalDays: 5,
      reason: 'Summer vacation trip',
      status: 'APPROVED',
      approverId: pmEmp.id,
    },
  });

  console.log(`✅ Leave balances and sample requests created`);

  // 7. Attendance Records (Past 5 working days)
  const today = new Date();
  for (let i = 0; i < 5; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    for (const emp of allEmployees) {
      const clockIn = new Date(date);
      const isLate = i === 1 && emp.id === devOpsEmp.id;
      clockIn.setHours(isLate ? 9 : 8, isLate ? 45 : 50 + (emp.firstName.length % 10), 0);

      const clockOut = new Date(date);
      clockOut.setHours(17, 30 + (emp.lastName.length % 15), 0);

      const totalHours = Number(((clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)).toFixed(2));

      await prisma.attendance.create({
        data: {
          employeeId: emp.id,
          date: date,
          clockIn: clockIn,
          clockOut: clockOut,
          totalHours: totalHours,
          status: isLate ? 'LATE' : 'PRESENT',
          notes: isLate ? 'Delayed due to traffic' : 'On time',
        },
      });
    }
  }
  console.log(`✅ Attendance logs generated`);

  // 8. Payroll & Payslips
  const payrollJuly = await prisma.payroll.create({
    data: {
      title: 'Payroll July 2026',
      month: 7,
      year: 2026,
      totalAmount: 795000 / 12,
      status: 'COMPLETED',
      processedAt: new Date('2026-07-28'),
    },
  });

  const payrollAugust = await prisma.payroll.create({
    data: {
      title: 'Payroll August 2026',
      month: 8,
      year: 2026,
      totalAmount: 795000 / 12,
      status: 'PROCESSING',
    },
  });

  for (const emp of allEmployees) {
    const monthlyBasic = emp.basicSalary / 12;
    const allowances = monthlyBasic * 0.1;
    const taxDeduction = monthlyBasic * 0.18;
    const netSalary = monthlyBasic + allowances - taxDeduction;

    // July Payslip (Paid)
    await prisma.payslip.create({
      data: {
        payrollId: payrollJuly.id,
        employeeId: emp.id,
        payPeriod: 'July 2026',
        basicSalary: Number(monthlyBasic.toFixed(2)),
        allowances: Number(allowances.toFixed(2)),
        overtimePay: 0,
        bonuses: 0,
        deductions: 0,
        taxDeduction: Number(taxDeduction.toFixed(2)),
        netSalary: Number(netSalary.toFixed(2)),
        status: 'PAID',
        paidAt: new Date('2026-07-30'),
      },
    });

    // August Payslip (Unpaid / Processing)
    await prisma.payslip.create({
      data: {
        payrollId: payrollAugust.id,
        employeeId: emp.id,
        payPeriod: 'August 2026',
        basicSalary: Number(monthlyBasic.toFixed(2)),
        allowances: Number(allowances.toFixed(2)),
        overtimePay: emp.id === devEmp.id ? 450 : 0,
        bonuses: emp.id === salesDirEmp.id ? 1200 : 0,
        deductions: 0,
        taxDeduction: Number(taxDeduction.toFixed(2)),
        netSalary: Number((netSalary + (emp.id === devEmp.id ? 450 : 0) + (emp.id === salesDirEmp.id ? 1200 : 0)).toFixed(2)),
        status: 'UNPAID',
      },
    });
  }
  console.log(`✅ Payroll records and payslips created`);

  // 9. Recruitment (Jobs & Candidates & Interviews)
  const job1 = await prisma.job.create({
    data: {
      title: 'Senior Frontend Engineer (React/Next.js)',
      code: 'JOB-2026-001',
      departmentId: engDept.id,
      positionId: posSeniorDev.id,
      location: 'Remote / Hybrid (San Francisco, CA)',
      employmentType: 'FULL_TIME',
      minSalary: 110000,
      maxSalary: 140000,
      description: 'We are seeking a highly skilled Senior Frontend Engineer to build modern UI interfaces for our HR SaaS platform.',
      requirements: '- 5+ years of experience with React, TypeScript, and Next.js\n- Deep knowledge of Tailwind CSS and design systems\n- Experience building accessible and high-performance Web applications.',
      responsibilities: 'Build interactive dashboards, optimize client-side rendering, collaborate with UX designers.',
      recruiterId: hrManagerEmp.id,
      status: 'PUBLISHED',
    },
  });

  const job2 = await prisma.job.create({
    data: {
      title: 'Enterprise Account Executive',
      code: 'JOB-2026-002',
      departmentId: salesDept.id,
      positionId: posSalesDir.id,
      location: 'New York, NY',
      employmentType: 'FULL_TIME',
      minSalary: 90000,
      maxSalary: 130000,
      description: 'Join our high-performing sales team to drive B2B SaaS adoption among enterprise clients.',
      requirements: '- 3+ years in SaaS enterprise sales\n- Proven track record exceeding revenue quotas\n- Strong presentation and closing skills.',
      recruiterId: hrManagerEmp.id,
      status: 'PUBLISHED',
    },
  });

  // Candidates
  const cand1 = await prisma.candidate.create({
    data: {
      firstName: 'Emily',
      lastName: 'Watson',
      email: 'emily.watson@example.com',
      phone: '+1 (555) 987-6543',
      jobId: job1.id,
      stage: 'INTERVIEW',
      rating: 4,
      notes: 'Strong React architecture experience. Outstanding live coding performance.',
    },
  });

  const cand2 = await prisma.candidate.create({
    data: {
      firstName: 'Michael',
      lastName: 'Chang',
      email: 'michael.chang@example.com',
      phone: '+1 (555) 876-5432',
      jobId: job1.id,
      stage: 'SHORTLISTED',
      rating: 5,
      notes: 'Ex-Google frontend developer. Excellent communication skills.',
    },
  });

  const cand3 = await prisma.candidate.create({
    data: {
      firstName: 'Rachel',
      lastName: 'Green',
      email: 'rachel.green@example.com',
      phone: '+1 (555) 765-4321',
      jobId: job2.id,
      stage: 'OFFER',
      rating: 5,
      notes: 'Extensive portfolio of enterprise SaaS deals. Verbal offer extended.',
    },
  });

  // Interview
  await prisma.interview.create({
    data: {
      candidateId: cand1.id,
      jobId: job1.id,
      interviewerId: techLeadEmp.id,
      scheduledAt: new Date(Date.now() + 86400000 * 2),
      location: 'https://meet.google.com/xyz-abc-hrms',
      status: 'SCHEDULED',
      feedback: 'Technical interview focusing on React 19 concurrent features & Prisma queries.',
    },
  });

  console.log(`✅ Recruitment job listings, candidates, and interviews seeded`);

  // 10. Performance Reviews & Goals
  await prisma.performanceReview.create({
    data: {
      reviewerId: techLeadEmp.id,
      revieweeId: devEmp.id,
      reviewPeriod: 'H1 2026',
      qualityOfWork: 5,
      productivity: 4,
      teamwork: 5,
      communication: 4,
      attendanceRating: 5,
      problemSolving: 5,
      leadership: 4,
      professionalism: 5,
      overallScore: 4.6,
      feedback: 'Sophia consistently delivers high-quality code ahead of deadlines. Exceptional mentor to junior devs.',
      goalsForNextPeriod: 'Lead the architectural revamp of the analytics module.',
    },
  });

  await prisma.goal.create({
    data: {
      employeeId: devEmp.id,
      title: 'Migrate Core Dashboard to Next.js 15 App Router',
      description: 'Upgrade the existing dashboard components to leverage Server Components and streaming SSR.',
      startDate: new Date('2026-07-01'),
      dueDate: new Date('2026-09-30'),
      priority: 'HIGH',
      progress: 75,
      status: 'IN_PROGRESS',
    },
  });

  await prisma.goal.create({
    data: {
      employeeId: devOpsEmp.id,
      title: 'Achieve 99.99% API Uptime & Implement Automated Failover',
      description: 'Set up multi-region deployment and automated health monitoring with Prometheus & Grafana.',
      startDate: new Date('2026-06-15'),
      dueDate: new Date('2026-10-15'),
      priority: 'URGENT',
      progress: 60,
      status: 'IN_PROGRESS',
    },
  });

  console.log(`✅ Performance reviews and goals created`);

  // 11. Notifications & Audit Logs
  await prisma.notification.create({
    data: {
      userId: devUser.id,
      title: 'Leave Request Status Updated',
      message: 'Your annual leave request for Sep 10 - Sep 15 is pending manager approval.',
      type: 'INFO',
    },
  });

  await prisma.notification.create({
    data: {
      userId: adminUser.id,
      title: 'Monthly Payroll Processing Required',
      message: 'August 2026 payroll run is ready for review and disbursement.',
      type: 'WARNING',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'SYSTEM_INITIALIZATION',
      resource: 'Database',
      details: 'Initial database seeding completed successfully with demo dataset.',
    },
  });

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
