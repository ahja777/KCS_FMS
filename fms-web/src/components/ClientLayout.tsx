'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

interface ClientLayoutProps {
  children: React.ReactNode;
}

// Sidebar를 자체적으로 렌더링하는 페이지 경로 패턴
const pagesWithOwnSidebar = [
  // 상세 페이지 ([id]) 및 목록 페이지
  '/logis/sr/sea/',
  '/logis/sn/sea/',
  '/logis/sn/air/',           // 항공 S/N
  '/logis/quote/sea/',
  '/logis/quote/air/',
  '/logis/manifest/sea/',
  '/logis/import-bl/sea/',
  '/logis/import-bl/air/',    // 항공수입 AWB
  '/logis/bl/sea/',           // 해상수출 B/L
  '/logis/bl/air/',           // 항공수출 AWB
  '/logis/export-awb/air/',
  '/logis/customs/sea/',
  '/logis/ams/sea/',
  // 등록 페이지 (register)
  '/logis/import-bl/sea/register',
  '/logis/import-bl/sea/master/register',
  '/logis/import-bl/sea/house/register',
  '/logis/import-bl/air/master/register',
  '/logis/import-bl/air/house/register',
  '/logis/bl/sea/register',
  '/logis/bl/sea/master/register',
  '/logis/bl/sea/house/register',
  '/logis/bl/air/register',
  '/logis/bl/air/master/register',
  '/logis/bl/air/house/register',
  '/logis/sn/air/register',   // 항공 S/N 등록
];

function hasOwnSidebar(pathname: string): boolean {
  return pagesWithOwnSidebar.some(pattern => {
    if (pattern.endsWith('/')) {
      // 상세 페이지 패턴 - /logis/sr/sea/123 같은 형태
      return pathname.startsWith(pattern) && pathname !== pattern.slice(0, -1);
    }
    // 정확한 매칭 (등록 페이지)
    return pathname === pattern;
  });
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const skipGlobalSidebar = hasOwnSidebar(pathname);

  // 자체 Sidebar가 있는 페이지는 전역 Sidebar를 표시하지 않음
  if (skipGlobalSidebar) {
    return (
      <div className="min-h-screen bg-[#f3f4f6]">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <Sidebar />
      <div className="ml-56 bg-[#f3f4f6] min-h-screen">
        {children}
      </div>
    </div>
  );
}
