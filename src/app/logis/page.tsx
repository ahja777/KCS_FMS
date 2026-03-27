'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';

const menuCategories = [
  {
    id: 'quote',
    title: '1. 물류견적관리',
    description: '견적요청, 견적관리, 스케줄관리, 기업운임관리',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    color: '#1A2744',
    subMenus: [
      { id: 'quote-request', title: '견적요청 등록/조회', href: '/logis/quote/request' },
      { id: 'quote-manage-sea', title: '견적관리 (해상)', href: '/logis/quote/sea' },
      { id: 'quote-manage-air', title: '견적관리 (항공)', href: '/logis/quote/air' },
      { id: 'schedule-sea', title: '스케줄관리 (해상)', href: '/logis/schedule/sea' },
      { id: 'schedule-air', title: '스케줄관리 (항공)', href: '/logis/schedule/air' },
      { id: 'company-rate', title: '기업운임관리', href: '/logis/rate/corporate' },
    ],
  },
  {
    id: 'transport',
    title: '2. 운송의뢰관리',
    description: '운송견적관리, 운송요청관리, 운송관리, 서류관리',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    color: '#0F766E',
    subMenus: [
      { id: 'transport-quote', title: '운송견적관리', href: '/logis/transport/quote' },
      { id: 'transport-request', title: '운송요청관리', href: '/logis/transport/request' },
      { id: 'transport-manage', title: '운송관리 조회', href: '/logis/transport/manage' },
      { id: 'transport-status', title: '운송상태 정보조회', href: '/logis/transport/status' },
      { id: 'transport-doc', title: '서류관리 조회', href: '/logis/document' },
    ],
  },
  {
    id: 'booking',
    title: '3. 견적/부킹관리 (수출)',
    description: '선적부킹관리, 컨테이너공유, 수출입서류관리',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
    color: '#7C3AED',
    subMenus: [
      { id: 'booking-sea', title: '선적부킹관리 (해상)', href: '/logis/booking/sea' },
      { id: 'booking-air', title: '선적부킹관리 (항공)', href: '/logis/booking/air' },
      { id: 'container-share', title: '컨테이너공유관리', href: '/logis/container/share' },
      { id: 'export-doc', title: '수출입서류관리', href: '/logis/document' },
    ],
  },
  {
    id: 'cargo',
    title: '4. 화물재고현황',
    description: '화물재고관리, 화물반출입관리',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    color: '#EA580C',
    subMenus: [
      { id: 'cargo-status', title: '화물재고현황 조회', href: '/logis/cargo/status' },
      { id: 'cargo-release', title: '화물반출입관리', href: '/logis/cargo/release' },
    ],
  },
  {
    id: 'cost',
    title: '5. 부대비용관리',
    description: '부대비용결제관리',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
    color: '#0284C7',
    subMenus: [
      { id: 'cost-payment', title: '부대비용결제관리', href: '/logis/cost/payment' },
    ],
  },
  {
    id: 'agent',
    title: '6. 입력대행관리',
    description: '운영관리',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    color: '#DC2626',
    subMenus: [
      { id: 'agent-operation', title: '운영관리 조회', href: '/logis/agent/operation' },
    ],
  },
  {
    id: 'import-bl',
    title: '7. 수입 B/L관리',
    description: 'B/L관리, B/L도착관리, 적하목록관리, 화물반출입관리',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    color: '#059669',
    subMenus: [
      { id: 'import-bl-sea', title: 'B/L관리 (해상)', href: '/logis/import-bl/sea' },
      { id: 'import-bl-air', title: 'B/L관리 (항공)', href: '/logis/import-bl/air' },
      { id: 'import-bl-arrival-sea', title: 'B/L도착관리 (해상)', href: '/logis/import-bl/sea/arrival' },
      { id: 'import-bl-arrival-air', title: 'B/L도착관리 (항공)', href: '/logis/import-bl/air/arrival' },
      { id: 'import-bl-manifest', title: '적하목록관리', href: '/logis/manifest/sea' },
      { id: 'import-bl-cargo', title: '화물반출입관리', href: '/logis/cargo/release' },
    ],
  },
  {
    id: 'export-bl',
    title: '8. 수출 B/L관리',
    description: 'S/R관리, S/N관리, CLP관리, VGM관리, 적하목록관리',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
    color: '#7C3AED',
    subMenus: [
      { id: 'export-bl-manage', title: 'B/L관리', href: '/logis/export-bl/manage' },
      { id: 'export-sr', title: '선적요청(S/R)관리', href: '/logis/sr/sea' },
      { id: 'export-sn', title: '선적통지(S/N)관리', href: '/logis/sn/sea' },
      { id: 'export-stuffing', title: 'STUFFING관리', href: '/logis/export/stuffing' },
      { id: 'export-bl-clp', title: 'CLP관리', href: '/logis/export/clp' },
      { id: 'export-bl-vgm', title: 'VGM관리', href: '/logis/export/vgm' },
      { id: 'export-bl-manifest', title: '적하목록관리', href: '/logis/manifest/sea' },
    ],
  },
  {
    id: 'customs',
    title: '9. 통관/AMS관리',
    description: '통관관리, AMS관리',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    color: '#B45309',
    subMenus: [
      { id: 'customs-sea', title: '통관관리', href: '/logis/customs/sea' },
      { id: 'ams-sea', title: 'AMS관리', href: '/logis/ams/sea' },
    ],
  },
  {
    id: 'warehouse',
    title: '10. 창고화물관리',
    description: '창고(장치장)관리',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    ),
    color: '#14B8A6',
    subMenus: [
      { id: 'warehouse-manage', title: '창고(장치장)관리 조회', href: '/logis/warehouse/manage' },
    ],
  },
  {
    id: 'console',
    title: '11. 콘솔취합관리',
    description: 'B/L취합관리',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
    color: '#EC4899',
    subMenus: [
      { id: 'console-bl-import', title: 'B/L취합관리 (수입/해상)', href: '/logis/console/bl-import' },
    ],
  },
];

export default function LogisPage() {
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // 화면닫기 핸들러
  const handleCloseClick = () => {
    setShowCloseModal(true);
  };

  const handleConfirmClose = () => {
    setShowCloseModal(false);
    router.back();
  };

  // 브라우저 뒤로가기 버튼 처리
  useCloseConfirm({
    showModal: showCloseModal,
    setShowModal: setShowCloseModal,
    onConfirmClose: handleConfirmClose,
  });

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  return (
      <PageLayout title="Logis" subtitle="디지털물류네트워크 Shipping 관리" showCloseButton={false} >

        <main className="p-6">
          {/* Page Title */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #E8A838 0%, #D4943A 100%)' }}
              >
                <svg className="w-5 h-5 text-[#0C1222]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--foreground)]">화면설계서 기반 메뉴</h2>
                <p className="text-sm text-[var(--muted)]">A0203_G01_화면설계서(디지털물류네트워크)_Shipping_V1.0</p>
              </div>
            </div>
          </div>

          {/* Menu Categories Grid */}
          <div className="grid grid-cols-2 gap-6">
            {menuCategories.map((category, idx) => (
              <div
                key={category.id}
                className="card overflow-hidden animate-slide-up"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                {/* Category Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-[var(--surface-50)] transition-colors"
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${category.color}15`, color: category.color }}
                      >
                        {category.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">
                          {category.title}
                        </h3>
                        <p className="text-sm text-[var(--muted)]">{category.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs font-medium px-2 py-1 rounded-full"
                            style={{ background: `${category.color}15`, color: category.color }}
                          >
                            {category.subMenus.length}개 메뉴
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="p-2 rounded-lg hover:bg-[var(--surface-100)] transition-colors">
                      <svg
                        className={`w-5 h-5 text-[var(--muted)] transition-transform duration-200 ${
                          expandedCategory === category.id ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Sub Menus */}
                {expandedCategory === category.id && (
                  <div className="border-t border-[var(--border)] bg-[var(--surface-50)]">
                    <div className="p-4 grid gap-2">
                      {category.subMenus.map((subMenu, subIdx) => (
                        <Link
                          key={subMenu.id}
                          href={subMenu.href}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-white transition-all group"
                          style={{ animationDelay: `${subIdx * 0.03}s` }}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ background: category.color }}
                          />
                          <span className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--amber-500)] transition-colors">
                            {subMenu.title}
                          </span>
                          <svg
                            className="w-4 h-4 text-[var(--muted)] ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Access Section */}
          <div className="mt-8">
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-4">자주 사용하는 메뉴</h3>
            <div className="grid grid-cols-4 gap-4">
              {[
                { title: '견적요청 등록', href: '/logis/quote/request', icon: '📝' },
                { title: 'B/L관리 (수입)', href: '/logis/import-bl/sea', icon: '📄' },
                { title: '선적부킹관리', href: '/logis/booking/sea', icon: '🚢' },
                { title: '화물재고현황', href: '/logis/cargo/status', icon: '📦' },
              ].map((item, idx) => (
                <Link
                  key={idx}
                  href={item.href}
                  className="card p-4 flex items-center gap-3 hover:shadow-lg transition-all group"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="font-medium text-[var(--foreground)] group-hover:text-[var(--amber-500)] transition-colors">
                    {item.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </main>

      {/* 화면 닫기 확인 모달 */}
      <CloseConfirmModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onConfirm={handleConfirmClose}
      />
    </PageLayout>
  );
}
