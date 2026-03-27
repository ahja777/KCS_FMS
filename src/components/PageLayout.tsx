'use client';

import Header from '@/components/Header';

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showCloseButton?: boolean;
  onClose?: () => void;
}

/**
 * 공통 페이지 레이아웃 컴포넌트
 * - Header 영역을 포함하여 일관된 페이지 구조 제공
 * - Sidebar는 ClientLayout에서 전역으로 제공
 *
 * @example
 * ```tsx
 * import PageLayout from '@/components/PageLayout';
 *
 * export default function MyPage() {
 *   return (
 *     <PageLayout title="페이지 제목" subtitle="부제목">
 *       <main className="p-6">
 *         // 페이지 컨텐츠
 *       </main>
 *     </PageLayout>
 *   );
 * }
 * ```
 */
export default function PageLayout({
  children,
  title,
  subtitle,
  showCloseButton = true,
  onClose,
}: PageLayoutProps) {
  return (
    <>
      <Header
        title={title}
        subtitle={subtitle}
        showCloseButton={showCloseButton}
        onClose={onClose}
      />
      {children}
    </>
  );
}
