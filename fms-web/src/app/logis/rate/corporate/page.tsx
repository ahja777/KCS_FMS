'use client';

import { useRouter } from 'next/navigation';

import { useState, useRef } from 'react';
import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { formatCurrency } from '@/utils/format';

interface CorporateRateData {
  id: number;
  contractNo: string;
  customerCode: string;
  customerName: string;
  transportMode: string;
  carrier: string;
  pol: string;
  pod: string;
  containerType: string;
  validFrom: string;
  validTo: string;
  currency: string;
  agreedRate: number;
  margin: number;
  sellingRate: number;
  status: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: '유효', color: 'bg-green-500' },
  EXPIRED: { label: '만료', color: 'bg-gray-500' },
  PENDING: { label: '대기', color: 'bg-yellow-500' },
  SUSPENDED: { label: '중지', color: 'bg-red-500' },
};

const mockData: CorporateRateData[] = [
  { id: 1, contractNo: 'CT-2026-001', customerCode: 'SAMSUNG', customerName: '삼성전자', transportMode: 'SEA', carrier: 'HMM', pol: 'KRPUS', pod: 'USLAX', containerType: '40HC', validFrom: '2026-01-01', validTo: '2026-12-31', currency: 'USD', agreedRate: 2800, margin: 200, sellingRate: 3000, status: 'ACTIVE' },
  { id: 2, contractNo: 'CT-2026-002', customerCode: 'LG', customerName: 'LG전자', transportMode: 'SEA', carrier: 'MAERSK', pol: 'KRPUS', pod: 'DEHAM', containerType: '40HC', validFrom: '2026-01-01', validTo: '2026-06-30', currency: 'USD', agreedRate: 2100, margin: 150, sellingRate: 2250, status: 'ACTIVE' },
  { id: 3, contractNo: 'CT-2026-003', customerCode: 'HYUNDAI', customerName: '현대자동차', transportMode: 'AIR', carrier: 'KE', pol: 'ICN', pod: 'LAX', containerType: '+100KG', validFrom: '2026-01-01', validTo: '2026-03-31', currency: 'USD', agreedRate: 4.50, margin: 0.30, sellingRate: 4.80, status: 'ACTIVE' },
  { id: 4, contractNo: 'CT-2025-010', customerCode: 'SK', customerName: 'SK하이닉스', transportMode: 'SEA', carrier: 'MSC', pol: 'KRPUS', pod: 'CNSHA', containerType: '20GP', validFrom: '2025-07-01', validTo: '2025-12-31', currency: 'USD', agreedRate: 900, margin: 100, sellingRate: 1000, status: 'EXPIRED' },
];

export default function CorporateRatePage() {
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const [filters, setFilters] = useState({
    customerName: '',
    transportMode: '',
    carrier: '',
    status: '',
  });
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [data] = useState<CorporateRateData[]>(mockData);

  const handleSearch = () => setAppliedFilters(filters);
  const handleReset = () => {
    const resetFilters = { customerName: '', transportMode: '', carrier: '', status: '' };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
  };

  const filteredData = data.filter(item => {
    if (appliedFilters.customerName && !item.customerName.includes(appliedFilters.customerName)) return false;
    if (appliedFilters.transportMode && item.transportMode !== appliedFilters.transportMode) return false;
    if (appliedFilters.carrier && !item.carrier.toLowerCase().includes(appliedFilters.carrier.toLowerCase())) return false;
    if (appliedFilters.status && item.status !== appliedFilters.status) return false;
    return true;
  });

  const summaryStats = {
    total: filteredData.length,
    customers: new Set(filteredData.map(d => d.customerCode)).size,
    active: filteredData.filter(d => d.status === 'ACTIVE').length,
    expiringSoon: filteredData.filter(d => {
      const validTo = new Date(d.validTo);
      const today = new Date();
      const diffDays = Math.ceil((validTo.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 30 && diffDays > 0;
    }).length,
  };

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

  return (
        <PageLayout title="기업운임관리" subtitle="Logis > 운임관리 > 기업운임관리" showCloseButton={false} >
        <main ref={formRef} className="p-6">
          <div className="flex justify-end items-center mb-6">
            <Link href="/logis/rate/corporate/register" className="px-6 py-2 font-semibold rounded-lg bg-[var(--surface-100)] text-[var(--foreground)] hover:bg-[var(--surface-200)]">
              신규 계약
            </Link>
          </div>

          {/* 검색조건 - 화면설계서 기준 */}
          <div className="card mb-6">
            <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="font-bold">검색조건</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">고객사</label>
                  <input type="text" value={filters.customerName} onChange={e => setFilters(prev => ({ ...prev, customerName: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="고객사명" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">운송모드</label>
                  <select value={filters.transportMode} onChange={e => setFilters(prev => ({ ...prev, transportMode: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm">
                    <option value="">전체</option>
                    <option value="SEA">해상</option>
                    <option value="AIR">항공</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">선사/항공사</label>
                  <input type="text" value={filters.carrier} onChange={e => setFilters(prev => ({ ...prev, carrier: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="HMM, KE 등" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">상태</label>
                  <select value={filters.status} onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm">
                    <option value="">전체</option>
                    <option value="ACTIVE">유효</option>
                    <option value="EXPIRED">만료</option>
                    <option value="PENDING">대기</option>
                    <option value="SUSPENDED">중지</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-[var(--border)] flex justify-center gap-2">
              <button onClick={handleSearch} className="px-6 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] font-medium">조회</button>
              <button onClick={handleReset} className="px-6 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">초기화</button>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="card p-4 text-center"><div className="text-2xl font-bold">{summaryStats.total}</div><div className="text-sm text-[var(--muted)]">전체 계약</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-blue-500">{summaryStats.customers}</div><div className="text-sm text-[var(--muted)]">고객사</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-green-500">{summaryStats.active}</div><div className="text-sm text-[var(--muted)]">유효 계약</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-yellow-500">{summaryStats.expiringSoon}</div><div className="text-sm text-[var(--muted)]">만료 임박</div></div>
          </div>

          <div className="card overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th className="text-center">계약번호</th>
                  <th className="text-center">고객사</th>
                  <th className="text-center">모드</th>
                  <th className="text-center">선사/항공사</th>
                  <th className="text-center">구간</th>
                  <th className="text-center">타입</th>
                  <th className="text-center">유효기간</th>
                  <th className="text-center">계약단가</th>
                  <th className="text-center">마진</th>
                  <th className="text-center">판매단가</th>
                  <th className="text-center">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredData.map(item => (
                  <tr key={item.id} className="hover:bg-[var(--surface-50)] cursor-pointer">
                    <td className="px-4 py-3 text-center"><Link href={`/logis/rate/corporate/${item.id}`} className="text-blue-400 hover:underline">{item.contractNo}</Link></td>
                    <td className="px-4 py-3 text-center">{item.customerName}</td>
                    <td className="px-4 py-3 text-center"><span className={`px-2 py-1 text-xs rounded-full ${item.transportMode === 'SEA' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>{item.transportMode}</span></td>
                    <td className="px-4 py-3 text-center">{item.carrier}</td>
                    <td className="px-4 py-3 text-center text-sm">{item.pol} → {item.pod}</td>
                    <td className="px-4 py-3 text-center text-sm">{item.containerType}</td>
                    <td className="px-4 py-3 text-center text-sm">{item.validFrom} ~ {item.validTo}</td>
                    <td className="px-4 py-3 text-center text-sm">{formatCurrency(item.agreedRate, item.currency)}</td>
                    <td className="px-4 py-3 text-center text-sm text-green-500">+{formatCurrency(item.margin, item.currency)}</td>
                    <td className="px-4 py-3 text-center text-sm font-medium">{formatCurrency(item.sellingRate, item.currency)}</td>
                    <td className="px-4 py-3 text-center"><span className={`px-2 py-1 text-xs rounded-full text-white ${statusConfig[item.status]?.color}`}>{statusConfig[item.status]?.label}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
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
