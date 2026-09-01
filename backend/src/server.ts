import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import apiRouter from './routes/api';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((origin) => origin.trim());

const ensureStarterData = async () => {
  const org = await prisma.organization.findFirst();

  if (!org) {
    const createdOrg = await prisma.organization.create({
      data: {
        name: 'My Company',
        code: 'MYCOMP',
        website: 'https://example.com',
        email: 'admin@company.com',
        phone: '+1-555-0100',
        address: '123 Business Avenue',
      },
    });

    const defaultDepartments = [
      { name: 'Engineering', code: 'ENG', description: 'Software engineering and platform delivery' },
      { name: 'Human Resources', code: 'HR', description: 'People operations, HR and policies' },
      { name: 'Sales & Marketing', code: 'SALES', description: 'Revenue growth and brand outreach' },
      { name: 'Product & Design', code: 'PROD', description: 'Product planning and design' },
    ];

    await Promise.all(
      defaultDepartments.map((dept) =>
        prisma.department.create({
          data: {
            ...dept,
            budget: 0,
            organizationId: createdOrg.id,
          },
        })
      )
    );

    console.log('✅ Default organization and departments created');
    return;
  }

  const departmentCount = await prisma.department.count({
    where: { organizationId: org.id },
  });

  if (departmentCount === 0) {
    const defaultDepartments = [
      { name: 'Engineering', code: 'ENG', description: 'Software engineering and platform delivery' },
      { name: 'Human Resources', code: 'HR', description: 'People operations, HR and policies' },
      { name: 'Sales & Marketing', code: 'SALES', description: 'Revenue growth and brand outreach' },
      { name: 'Product & Design', code: 'PROD', description: 'Product planning and design' },
    ];

    await Promise.all(
      defaultDepartments.map((dept) =>
        prisma.department.create({
          data: {
            ...dept,
            budget: 0,
            organizationId: org.id,
          },
        })
      )
    );

    console.log('✅ Default departments created for existing organization');
  }
};

// Security & Parsing Middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Origin not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'UP', timestamp: new Date().toISOString(), service: 'HRMS Backend API' });
});

// API Routes
app.use('/api', apiRouter);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'API Endpoint Not Found' });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Global Error Handler:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const startServer = async () => {
  await ensureStarterData();

  app.listen(PORT, () => {
    console.log(`🚀 HRMS Backend Server running on port ${PORT}`);
    console.log(`📡 API Health Check: http://localhost:${PORT}/health`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
