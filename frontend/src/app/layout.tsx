import './globals.css';
import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';

export const metadata = {
  title: 'Acme HRMS - Enterprise Human Resource Management System',
  description: 'Full stack Enterprise HR SaaS system built with Next.js 15, Node.js, Express, and Prisma.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased flex min-h-screen">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
