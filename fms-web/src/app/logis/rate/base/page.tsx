'use client';

import { useRouter } from 'next/navigation';
import { LIST_PATHS } from '@/constants/paths';

import { useState, useRef } from 'react';
import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { formatCurrency } from '@/utils/format';

interface BaseRateData {
  id: number;
  rateCode: string;
  transportMode: string;
  carrier: string;
  pol: string;
  pod: string;
  containerType: string;
  validFrom: string;
  validTo: string;
  currency: string;
  oceanFreight: number;
  baf: number;
  caf: number;
  thc: number;
  docFee: number;
  totalRate: number;
  status: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: '유효', color: 'bg-green-500' },
  EXPIRED: { label: '만료', color: 'bg-gray-500' },
  PENDING: { label: '대기', color: 'bg-yellow-500' },
};

const mockData: BaseRateData[] = [
  { id: 1, rateCode: 'RT-SEA-001', transportMode: 'SEA', carrier: 'HMM', pol: 'KRPUS', pod: 'USLAX', containerType: '40HC', validFrom: '2026-01-01', validTo: '2026-03-31', currency: 'USD', oceanFreight: 2500, baf: 300, caf: 150, thc: 200, docFee: 50, totalRate: 3200, status: 'ACTIVE' },
  { id: 2, rateCode: 'RT-SEA-002', transportMode: 'SEA', carrier: 'MAERSK', pol: 'KRPUS', pod: 'DEHAM', containerType: '40HC', validFrom: '2026-01-01', validTo: '2026-03-31', currency: 'USD', oceanFreight: 1800, baf: 250, caf: 100, thc: 180, docFee: 50, totalRate: 2380, status: 'ACTIVE' },
  { id: 3, rateCode: 'RT-AIR-001', transportMode: 'AIR', carrier: 'KE', pol: 'ICN', pod: 'LAX', containerType: '+100KG', validFrom: '2026-01-01', validTo: '2026-02-28', currency: 'USD', oceanFreight: 4.80, baf: 0, caf: 0, thc: 0, docFee: 30, totalRate: 4.80, status: 'ACTIVE' },
  { id: 4, rateCode: 'RT-SEA-003', transportMode: 'SEA', carrier: 'MSC', pol: 'KRPUS', pod: 'CNSHA', containerType: '20GP', validFrom: '2025-10-01', validTo: '2025-12-31', currency: 'USD', oceanFreight: 800, baf: 100, caf: 50, thc: 120, docFee: 40, totalRate: 1110, status: 'EXPIRED' },
];

export default function BaseRatePage() {
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const [filters, setFilters] = useState({
    transportMode: '',
    carrier: '',
    pol: '',
    pod: '',
    status: '',
  });
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [data] = useState<BaseRateData[]>(mockData);

  const handleSearch = () => setAppliedFilters(filters);
  const handleReset = () => {
    const resetFilters = { transportMode: '', carrier: '', pol: '', pod: '', status: '' };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
  };

  const filteredData = data.filter(item => {
    if (appliedFilters.transportMode && item.transportMode !== appliedFilters.transportMode) return false;
    if (appliedFilters.carrier && !item.carrier.toLowerCase().includes(appliedFilters.carrier.toLowerCase())) return false;
    if (appliedFilters.pol && !item.pol.toLowerCase().includes(appliedFilters.pol.toLowerCase())) return false;
    if (appliedFilters.pod && !item.pod.toLowerCase().includes(appliedFilters.pod.toLowerCase())) return false;
    if (appliedFilters.status && item.status !== appliedFilters.status) return false;
    return true;
  });

  const summaryStats = {
    total: filteredData.length,
    sea: filteredData.filter(d => d.transportMode === 'SEA').length,
    air: filteredData.filter(d => d.transportMode === 'AIR').length,
    active: filteredData.filter(d => d.status === 'ACTIVE').length,
  };

  const handleCloseClick = () => {
    setShowCloseModal(true);
  };

  const handleConfirmClose = () => {
    setShowCloseModal(false);
    router.push(LIST_PATHS.DASHBOARD);
  };

  // 브라우저 뒤로가기 버튼 처리
  useCloseConfirm({
    showModal: showCloseModal,
    setShowModal: setShowCloseModal,
    onConfirmClose: handleConfirmClose,
  });

  return (
        <PageLayout title="운임기초정보 관리" subtitle="Logis > 운임관리 > 운임기초정보 관리" showCloseButton={false} >
        <main ref={formRef} className="p-6">
          <div className="flex justify-end items-center mb-6">
            <Link href="/logis/rate/base/register" className="px-6 py-2 font-semibold rounded-lg bg-[var(--surface-100)] text-[var(--foreground)] hover:bg-[var(--surface-200)]">
              신규 등록
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
              <div className="grid grid-cols-5 gap-4">
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
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">출발지</label>
                  <input type="text" value={filters.pol} onChange={e => setFilters(prev => ({ ...prev, pol: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="KRPUS, ICN" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">도착지</label>
                  <input type="text" value={filters.pod} onChange={e => setFilters(prev => ({ ...prev, pod: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="USLAX, LAX" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">상태</label>
                  <select value={filters.status} onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm">
                    <option value="">전체</option>
                    <option value="ACTIVE">유효</option>
                    <option value="EXPIRED">만료</option>
                    <option value="PENDING">대기</option>
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
            <div className="card p-4 text-center"><div className="text-2xl font-bold">{summaryStats.total}</div><div className="text-sm text-[var(--muted)]">전체</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-blue-500">{summaryStats.sea}</div><div className="text-sm text-[var(--muted)]">해상</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-purple-500">{summaryStats.air}</div><div className="text-sm text-[var(--muted)]">항공</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-green-500">{summaryStats.active}</div><div className="text-sm text-[var(--muted)]">유효</div></div>
          </div>

          <div className="card overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th className="text-center">운임코드</th>
                  <th className="text-center">모드</th>
                  <th className="text-center">선사/항공사</th>
                  <th className="text-center">구간</th>
                  <th className="text-center">타입</th>
                  <th className="text-center">유효기간</th>
                  <th className="text-center">O/F</th>
                  <th className="text-center">BAF</th>
                  <th className="text-center">Total</th>
                  <th className="text-center">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredData.map(item => (
                  <tr key={item.id} className="hover:bg-[var(--surface-50)] cursor-pointer">
                    <td className="px-4 py-3 text-center"><Link href={`/logis/rate/base/${item.id}`} className="text-blue-400 hover:underline">{item.rateCode}</Link></td>
                    <td className="px-4 py-3 text-center"><span className={`px-2 py-1 text-xs rounded-full ${item.transportMode === 'SEA' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>{item.transportMode}</span></td>
                    <td className="px-4 py-3 text-center">{item.carrier}</td>
                    <td className="px-4 py-3 text-center text-sm">{item.pol} → {item.pod}</td>
                    <td className="px-4 py-3 text-center text-sm">{item.containerType}</td>
                    <td className="px-4 py-3 text-center text-sm">{item.validFrom} ~ {item.validTo}</td>
                    <td className="px-4 py-3 text-center text-sm">{formatCurrency(item.oceanFreight, item.currency)}</td>
                    <td className="px-4 py-3 text-center text-sm">{item.baf > 0 ? formatCurrency(item.baf, item.currency) : '-'}</td>
                    <td className="px-4 py-3 text-center text-sm font-medium">{formatCurrency(item.totalRate, item.currency)}</td>
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
