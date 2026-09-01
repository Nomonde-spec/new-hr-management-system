# Acme HRMS

A lightweight human resources management system built with Next.js, Express, Prisma, and PostgreSQL.

## Features

- Employee directory and profile management
- Department and role-based access control
- Leave requests and approval workflows
- Payroll and payslip management
- Recruitment and candidate tracking
- Performance goals and reviews
- Secure JWT authentication

## Roles

- Admin
  - Manages employees and departments
  - Can access dashboards and employee listings
  - Cannot post jobs
  - Cannot manage payroll
  - Cannot approve leave

- HR Manager
  - Manages employees, payroll, leave approvals, and job postings
  - Can access payroll and recruitment tools
  - Can approve leave requests

- Employee
  - Can clock attendance
  - Can request leave
  - Can view personal performance data
  - Cannot access payroll, leave approval screens, or recruitment management

## Default admin account

- Email: admin@company.com
- Password: Admin@123456

## Setup

### Backend

1. Open the backend folder
2. Install dependencies:
   npm install
3. Configure the database connection in the environment file
4. Run Prisma generate and migrations if needed
5. Start the API:
   npm run dev

### Frontend

1. Open the frontend folder
2. Install dependencies:
   npm install
3. Start the app:
   npm run dev

## Default URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## Notes

- New users can register from the frontend register page.
- Newly registered users are automatically added as employee records linked to a selected department.
- Payroll and recruitment job posting permissions are restricted to HR Manager only.
- Leave approval permissions are restricted to HR Manager only.
