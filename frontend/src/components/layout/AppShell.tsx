'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    if (!loading && !user && !isAuthPage) router.replace('/login');
  }, [isAuthPage, loading, router, user]);

  if (isAuthPage) return <>{children}</>;
  if (loading || !user) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </>
  );
};