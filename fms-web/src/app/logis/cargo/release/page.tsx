'use client';

import { useRouter } from 'next/navigation';
import { LIST_PATHS } from '@/constants/paths';

import { useState, useRef } from 'react';
import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import DateRangeButtons, { getToday } from '@/components/DateRangeButtons';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';

interface CargoReleaseData {
  id: number;
  releaseNo: string;
  releaseType: string;
  blNo: string;
  containerNo: string;
  containerType: string;
  releaseDate: string;
  releaseTime: string;
  location: string;
  shipper: string;
  consignee: string;
  packages: number;
  grossWeight: number;
  volume: number;
  transportNo: string;
  driverName: string;
  truckNo: string;
  customsStatus: string;
  status: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  REQUESTED: { label: '요청', color: 'bg-blue-500' },
  APPROVED: { label: '승인', color: 'bg-cyan-500' },
  IN_PROGRESS: { label: '진행중', color: 'bg-yellow-500' },
  COMPLETED: { label: '완료', color: 'bg-green-500' },
  CANCELLED: { label: '취소', color: 'bg-red-500' },
};

const mockData: CargoReleaseData[] = [
  { id: 1, releaseNo: 'REL-2026-0001', releaseType: '반출', blNo: 'HDMU1234567', containerNo: 'HDMU1234567', containerType: '40HC', releaseDate: '2026-01-22', releaseTime: '14:00', location: '부산신항 CY', shipper: '삼성전자', consignee: 'Samsung America', packages: 500, grossWeight: 12000, volume: 65.5, transportNo: 'TR-2026-0001', driverName: '김기사', truckNo: '12가3456', customsStatus: 'CLEARED', status: 'COMPLETED' },
  { id: 2, releaseNo: 'REL-2026-0002', releaseType: '반입', blNo: 'MAEU5678901', containerNo: 'MAEU5678901', containerType: '20GP', releaseDate: '2026-01-23', releaseTime: '09:00', location: '인천항 CY', shipper: 'Apple Inc.', consignee: 'LG전자', packages: 200, grossWeight: 8000, volume: 45.2, transportNo: 'TR-2026-0002', driverName: '이기사', truckNo: '34나5678', customsStatus: 'CLEARED', status: 'IN_PROGRESS' },
  { id: 3, releaseNo: 'REL-2026-0003', releaseType: '반출', blNo: 'MSCU2345678', containerNo: 'MSCU2345678', containerType: '40HC', releaseDate: '2026-01-24', releaseTime: '10:00', location: '부산신항 CY', shipper: '현대자동차', consignee: 'Hyundai Motor Germany', packages: 800, grossWeight: 18000, volume: 72.0, transportNo: '', driverName: '', truckNo: '', customsStatus: 'PENDING', status: 'REQUESTED' },
];

export default function CargoReleasePage() {
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const today = getToday();
  const [filters, setFilters] = useState({
    startDate: today,
    endDate: today,
    releaseNo: '',
    blNo: '',
    containerNo: '',
    releaseType: '',
    status: '',
  });
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [data] = useState<CargoReleaseData[]>(mockData);

  const handleDateRangeSelect = (startDate: string, endDate: string) => {
    setFilters(prev => ({ ...prev, startDate, endDate }));
  };

  const handleSearch = () => setAppliedFilters(filters);
  const handleReset = () => {
    const resetFilters = { startDate: today, endDate: today, releaseNo: '', blNo: '', containerNo: '', releaseType: '', status: '' };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
  };

  const filteredData = data.filter(item => {
    if (appliedFilters.releaseNo && !item.releaseNo.includes(appliedFilters.releaseNo)) return false;
    if (appliedFilters.blNo && !item.blNo.includes(appliedFilters.blNo)) return false;
    if (appliedFilters.containerNo && !item.containerNo.includes(appliedFilters.containerNo)) return false;
    if (appliedFilters.releaseType && item.releaseType !== appliedFilters.releaseType) return false;
    if (appliedFilters.status && item.status !== appliedFilters.status) return false;
    return true;
  });

  const summaryStats = {
    total: filteredData.length,
    requested: filteredData.filter(d => d.status === 'REQUESTED').length,
    inProgress: filteredData.filter(d => d.status === 'IN_PROGRESS').length,
    completed: filteredData.filter(d => d.status === 'COMPLETED').length,
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
        <PageLayout title="화물반출입관리" subtitle="Logis > B/L관리 > 화물반출입관리" showCloseButton={false} >
        <main ref={formRef} className="p-6">
          <div className="flex justify-end items-center mb-6">
            <Link href="/logis/cargo/release/register" className="px-6 py-2 font-semibold rounded-lg bg-[var(--surface-100)] text-[var(--foreground)] hover:bg-[var(--surface-200)]">
              신규 등록
            </Link>
          </div>

          <div className="card mb-6">
            <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="font-bold">검색조건</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">반출입 일자</label>
                  <div className="flex gap-2 items-center flex-nowrap">
                    <input type="date" value={filters.startDate} onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))} className="w-[130px] h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg flex-shrink-0 text-sm" />
                    <span className="text-[var(--muted)] flex-shrink-0">~</span>
                    <input type="date" value={filters.endDate} onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))} className="w-[130px] h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg flex-shrink-0 text-sm" />
                    <DateRangeButtons onRangeSelect={handleDateRangeSelect} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">B/L 번호</label>
                  <input type="text" value={filters.blNo} onChange={e => setFilters(prev => ({ ...prev, blNo: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="HDMU1234567" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">컨테이너 번호</label>
                  <input type="text" value={filters.containerNo} onChange={e => setFilters(prev => ({ ...prev, containerNo: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="HDMU1234567" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">구분</label>
                  <select value={filters.releaseType} onChange={e => setFilters(prev => ({ ...prev, releaseType: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm">
                    <option value="">전체</option>
                    <option value="반출">반출</option>
                    <option value="반입">반입</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">상태</label>
                  <select value={filters.status} onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm">
                    <option value="">전체</option>
                    <option value="REQUESTED">요청</option>
                    <option value="APPROVED">승인</option>
                    <option value="IN_PROGRESS">진행중</option>
                    <option value="COMPLETED">완료</option>
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
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-blue-500">{summaryStats.requested}</div><div className="text-sm text-[var(--muted)]">요청</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-yellow-500">{summaryStats.inProgress}</div><div className="text-sm text-[var(--muted)]">진행중</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-green-500">{summaryStats.completed}</div><div className="text-sm text-[var(--muted)]">완료</div></div>
          </div>

          <div className="card overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th className="text-center">반출입번호</th>
                  <th className="text-center">구분</th>
                  <th className="text-center">B/L 번호</th>
                  <th className="text-center">컨테이너</th>
                  <th className="text-center">일시</th>
                  <th className="text-center">장소</th>
                  <th className="text-center">G/W (KG)</th>
                  <th className="text-center">차량번호</th>
                  <th className="text-center">통관</th>
                  <th className="text-center">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredData.map(item => (
                  <tr key={item.id} className="hover:bg-[var(--surface-50)] cursor-pointer">
                    <td className="px-4 py-3 text-center"><Link href={`/logis/cargo/release/${item.id}`} className="text-blue-400 hover:underline">{item.releaseNo}</Link></td>
                    <td className="px-4 py-3 text-center"><span className={`px-2 py-1 text-xs rounded-full ${item.releaseType === '반출' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{item.releaseType}</span></td>
                    <td className="px-4 py-3 text-sm text-center">{item.blNo}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.containerNo} ({item.containerType})</td>
                    <td className="px-4 py-3 text-sm text-center">{item.releaseDate} {item.releaseTime}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.location}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.grossWeight.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.truckNo || '-'}</td>
                    <td className="px-4 py-3 text-center"><span className={`px-2 py-1 text-xs rounded-full text-white ${item.customsStatus === 'CLEARED' ? 'bg-green-500' : 'bg-yellow-500'}`}>{item.customsStatus === 'CLEARED' ? '통관완료' : '대기'}</span></td>
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
