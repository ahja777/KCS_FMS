'use client';

import { useRouter } from 'next/navigation';

import { useState, useRef } from 'react';
import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import DateRangeButtons, { getToday } from '@/components/DateRangeButtons';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';

interface VGMData {
  id: number;
  vgmNo: string;
  bookingNo: string;
  blNo: string;
  containerNo: string;
  containerType: string;
  sealNo: string;
  shipper: string;
  tareWeight: number;
  cargoWeight: number;
  vgmWeight: number;
  weighingMethod: string;
  weighingDate: string;
  weighingStation: string;
  cutOffDate: string;
  submittedDate: string;
  status: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: '대기', color: 'bg-gray-500' },
  SUBMITTED: { label: '제출', color: 'bg-blue-500' },
  ACCEPTED: { label: '수신확인', color: 'bg-green-500' },
  REJECTED: { label: '반려', color: 'bg-red-500' },
  OVERDUE: { label: '기한초과', color: 'bg-yellow-500' },
};

const mockData: VGMData[] = [
  { id: 1, vgmNo: 'VGM-2026-0001', bookingNo: 'BK-2026-0001', blNo: 'HDMU1234567', containerNo: 'HDMU1234567', containerType: '40HC', sealNo: 'SL001234', shipper: '삼성전자', tareWeight: 3800, cargoWeight: 12000, vgmWeight: 15800, weighingMethod: 'Method 1', weighingDate: '2026-01-22', weighingStation: '부산신항 계근장', cutOffDate: '2026-01-23', submittedDate: '2026-01-22', status: 'ACCEPTED' },
  { id: 2, vgmNo: 'VGM-2026-0002', bookingNo: 'BK-2026-0002', blNo: 'MAEU5678901', containerNo: 'MAEU5678901', containerType: '20GP', sealNo: 'SL002345', shipper: 'LG전자', tareWeight: 2200, cargoWeight: 8000, vgmWeight: 10200, weighingMethod: 'Method 2', weighingDate: '2026-01-21', weighingStation: '인천항 계근장', cutOffDate: '2026-01-24', submittedDate: '2026-01-22', status: 'SUBMITTED' },
  { id: 3, vgmNo: 'VGM-2026-0003', bookingNo: 'BK-2026-0003', blNo: '', containerNo: 'MSCU2345678', containerType: '40HC', sealNo: '', shipper: '현대자동차', tareWeight: 3800, cargoWeight: 18000, vgmWeight: 21800, weighingMethod: 'Method 1', weighingDate: '', weighingStation: '', cutOffDate: '2026-01-25', submittedDate: '', status: 'PENDING' },
  { id: 4, vgmNo: 'VGM-2026-0004', bookingNo: 'BK-2026-0004', blNo: 'EGLV9012345', containerNo: 'EGLV9012345', containerType: '40GP', sealNo: 'SL003456', shipper: 'SK하이닉스', tareWeight: 3700, cargoWeight: 15000, vgmWeight: 18700, weighingMethod: 'Method 1', weighingDate: '2026-01-20', weighingStation: '부산신항 계근장', cutOffDate: '2026-01-19', submittedDate: '', status: 'OVERDUE' },
];

export default function VGMPage() {
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const today = getToday();
  const [filters, setFilters] = useState({
    startDate: today,
    endDate: today,
    vgmNo: '',
    containerNo: '',
    shipper: '',
    status: '',
  });
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [data] = useState<VGMData[]>(mockData);

  const handleDateRangeSelect = (startDate: string, endDate: string) => {
    setFilters(prev => ({ ...prev, startDate, endDate }));
  };

  const handleSearch = () => setAppliedFilters(filters);
  const handleReset = () => {
    const resetFilters = { startDate: today, endDate: today, vgmNo: '', containerNo: '', shipper: '', status: '' };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
  };

  const filteredData = data.filter(item => {
    if (appliedFilters.vgmNo && !item.vgmNo.includes(appliedFilters.vgmNo)) return false;
    if (appliedFilters.containerNo && !item.containerNo.includes(appliedFilters.containerNo)) return false;
    if (appliedFilters.shipper && !item.shipper.includes(appliedFilters.shipper)) return false;
    if (appliedFilters.status && item.status !== appliedFilters.status) return false;
    return true;
  });

  const summaryStats = {
    total: filteredData.length,
    pending: filteredData.filter(d => d.status === 'PENDING').length,
    submitted: filteredData.filter(d => d.status === 'SUBMITTED').length,
    accepted: filteredData.filter(d => d.status === 'ACCEPTED').length,
    overdue: filteredData.filter(d => d.status === 'OVERDUE').length,
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
        <PageLayout title="VGM 관리" subtitle="Logis > 수출B/L관리 > VGM 관리" showCloseButton={false} >
        <main ref={formRef} className="p-6">
          <div className="flex justify-end items-center mb-6">
            <Link href="/logis/export/vgm/register" className="px-6 py-2 font-semibold rounded-lg bg-[var(--surface-100)] text-[var(--foreground)] hover:bg-[var(--surface-200)]">
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
              <div className="grid grid-cols-6 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Cut-Off 기간 <span className="text-red-500">*</span></label>
                  <div className="flex items-center gap-2">
                    <input type="date" value={filters.startDate} onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))} className="flex-1 h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
                    <span className="text-[var(--muted)]">~</span>
                    <input type="date" value={filters.endDate} onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))} className="flex-1 h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
                    <DateRangeButtons onRangeSelect={handleDateRangeSelect} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">VGM 번호</label>
                  <input type="text" value={filters.vgmNo} onChange={(e) => setFilters(prev => ({ ...prev, vgmNo: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" placeholder="VGM-YYYY-XXXX" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">컨테이너 번호</label>
                  <input type="text" value={filters.containerNo} onChange={(e) => setFilters(prev => ({ ...prev, containerNo: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" placeholder="HDMU1234567" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">상태</label>
                  <select value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm">
                    <option value="">전체</option>
                    <option value="PENDING">대기</option>
                    <option value="SUBMITTED">제출</option>
                    <option value="ACCEPTED">수신확인</option>
                    <option value="REJECTED">반려</option>
                    <option value="OVERDUE">기한초과</option>
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
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-gray-500">{summaryStats.pending}</div><div className="text-sm text-[var(--muted)]">대기</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-blue-500">{summaryStats.submitted}</div><div className="text-sm text-[var(--muted)]">제출</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-green-500">{summaryStats.accepted}</div><div className="text-sm text-[var(--muted)]">수신확인</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-yellow-500">{summaryStats.overdue}</div><div className="text-sm text-[var(--muted)]">기한초과</div></div>
          </div>

          <div className="card overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th className="text-center">VGM 번호</th>
                  <th className="text-center">부킹번호</th>
                  <th className="text-center">컨테이너</th>
                  <th className="text-center">화주</th>
                  <th className="text-center">Tare (KG)</th>
                  <th className="text-center">Cargo (KG)</th>
                  <th className="text-center">VGM (KG)</th>
                  <th className="text-center">Method</th>
                  <th className="text-center">Cut-Off</th>
                  <th className="text-center">제출일</th>
                  <th className="text-center">상태</th>
                  <th className="text-center">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredData.map(item => (
                  <tr key={item.id} className="hover:bg-[var(--surface-50)] cursor-pointer">
                    <td className="px-4 py-3 text-center"><Link href={`/logis/export/vgm/${item.id}`} className="text-blue-400 hover:underline">{item.vgmNo}</Link></td>
                    <td className="px-4 py-3 text-sm text-center">{item.bookingNo}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.containerNo} ({item.containerType})</td>
                    <td className="px-4 py-3 text-sm text-center">{item.shipper}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.tareWeight.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.cargoWeight.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-center font-medium">{item.vgmWeight.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.weighingMethod}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.cutOffDate}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.submittedDate || '-'}</td>
                    <td className="px-4 py-3 text-center"><span className={`px-2 py-1 text-xs rounded-full text-white ${statusConfig[item.status]?.color}`}>{statusConfig[item.status]?.label}</span></td>
                    <td className="px-4 py-3 text-center">
                      {item.status === 'PENDING' && <button className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">제출</button>}
                      {item.status === 'OVERDUE' && <button className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">긴급제출</button>}
                    </td>
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
