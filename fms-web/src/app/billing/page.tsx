'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { formatCurrency } from '@/utils/format';

const menuCategories = [
  {
    id: 'sales',
    title: '1. 매출관리',
    description: '매출등록, 매출조회, 매출현황',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: '#059669',
    subMenus: [
      { id: 'sales-register', title: '매출등록', href: '/billing/sales/register' },
      { id: 'sales-list', title: '매출조회', href: '/billing/sales/list' },
      { id: 'sales-status', title: '매출현황', href: '/billing/sales/status' },
    ],
  },
  {
    id: 'purchase',
    title: '2. 매입관리',
    description: '매입등록, 매입조회, 매입현황',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
    color: '#DC2626',
    subMenus: [
      { id: 'purchase-register', title: '매입등록', href: '/billing/purchase/register' },
      { id: 'purchase-list', title: '매입조회', href: '/billing/purchase/list' },
      { id: 'purchase-status', title: '매입현황', href: '/billing/purchase/status' },
    ],
  },
  {
    id: 'invoice',
    title: '3. 청구관리',
    description: '청구서발행, 청구현황, 수금관리',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    color: '#7C3AED',
    subMenus: [
      { id: 'invoice-issue', title: '청구서발행', href: '/billing/invoice/issue' },
      { id: 'invoice-status', title: '청구현황', href: '/billing/invoice/status' },
      { id: 'invoice-collection', title: '수금관리', href: '/billing/invoice/collection' },
    ],
  },
  {
    id: 'payment',
    title: '4. 지급관리',
    description: '지급요청, 지급현황, 지급내역',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
    color: '#0284C7',
    subMenus: [
      { id: 'payment-request', title: '지급요청', href: '/billing/payment/request' },
      { id: 'payment-status', title: '지급현황', href: '/billing/payment/status' },
      { id: 'payment-history', title: '지급내역', href: '/billing/payment/history' },
    ],
  },
  {
    id: 'settlement',
    title: '5. 정산관리',
    description: '정산현황, 손익분석, 마감관리',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    color: '#EA580C',
    subMenus: [
      { id: 'settlement-status', title: '정산현황', href: '/billing/settlement/status' },
      { id: 'settlement-profit', title: '손익분석', href: '/billing/settlement/profit' },
      { id: 'settlement-close', title: '마감관리', href: '/billing/settlement/close' },
    ],
  },
  {
    id: 'rate',
    title: '6. 요율관리',
    description: '기본요율관리, 계약요율관리, 환율관리',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    color: '#14B8A6',
    subMenus: [
      { id: 'rate-base', title: '기본요율관리', href: '/logis/rate/base' },
      { id: 'rate-contract', title: '계약요율관리', href: '/logis/rate/corporate' },
      { id: 'rate-exchange', title: '환율관리', href: '/logis/exchange-rate' },
    ],
  },
];

// 샘플 통계 데이터
const summaryStats = {
  totalSales: 1250000000,
  totalPurchase: 980000000,
  profit: 270000000,
  profitRate: 21.6,
  pendingInvoice: 45,
  pendingPayment: 32,
};

export default function BillingPage() {
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const handleConfirmClose = () => {
    setShowCloseModal(false);
    router.back();
  };

  useCloseConfirm({
    showModal: showCloseModal,
    setShowModal: setShowCloseModal,
    onConfirmClose: handleConfirmClose,
  });

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };


  return (
    <PageLayout title="Billing" subtitle="정산관리 시스템" showCloseButton={false}>
      <main className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-6 gap-4 mb-8">
          <div className="card p-4">
            <div className="text-sm text-[var(--muted)] mb-1">총 매출</div>
            <div className="text-xl font-bold text-[#059669]">{formatCurrency(summaryStats.totalSales)}</div>
            <div className="text-xs text-[var(--muted)]">원</div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-[var(--muted)] mb-1">총 매입</div>
            <div className="text-xl font-bold text-[#DC2626]">{formatCurrency(summaryStats.totalPurchase)}</div>
            <div className="text-xs text-[var(--muted)]">원</div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-[var(--muted)] mb-1">순이익</div>
            <div className="text-xl font-bold text-[#7C3AED]">{formatCurrency(summaryStats.profit)}</div>
            <div className="text-xs text-[var(--muted)]">원</div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-[var(--muted)] mb-1">이익률</div>
            <div className="text-xl font-bold text-[#EA580C]">{summaryStats.profitRate}%</div>
            <div className="text-xs text-[var(--muted)]">전월 대비 +2.3%</div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-[var(--muted)] mb-1">미청구</div>
            <div className="text-xl font-bold text-[#0284C7]">{summaryStats.pendingInvoice}건</div>
            <div className="text-xs text-[var(--muted)]">청구 대기</div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-[var(--muted)] mb-1">미지급</div>
            <div className="text-xl font-bold text-[#14B8A6]">{summaryStats.pendingPayment}건</div>
            <div className="text-xs text-[var(--muted)]">지급 대기</div>
          </div>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #E8A838 0%, #D4943A 100%)' }}
            >
              <svg className="w-5 h-5 text-[#0C1222]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">정산관리 메뉴</h2>
              <p className="text-sm text-[var(--muted)]">매출/매입/청구/지급/정산 통합 관리</p>
            </div>
          </div>
        </div>

        {/* Menu Categories Grid */}
        <div className="grid grid-cols-2 gap-6">
          {menuCategories.map((category, idx) => (
            <div
              key={category.id}
              className="card overflow-hidden"
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
              { title: '매출등록', href: '/billing/sales/register', icon: '💰' },
              { title: '청구서발행', href: '/billing/invoice/issue', icon: '📄' },
              { title: '정산현황', href: '/billing/settlement/status', icon: '📊' },
              { title: '손익분석', href: '/billing/settlement/profit', icon: '📈' },
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
