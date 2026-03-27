'use client';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showCloseButton?: boolean;
}

export default function MainLayout({
  children,
  title = 'Dashboard',
  subtitle = '',
  showCloseButton = false
}: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="main-content">
        <Header title={title} subtitle={subtitle} showCloseButton={showCloseButton} />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
