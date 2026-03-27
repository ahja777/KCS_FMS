'use client';

import { useRouter } from 'next/navigation';

import { useState, useRef } from 'react';
import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import DateRangeButtons, { getToday } from '@/components/DateRangeButtons';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { StuffingOrderModal, type StuffingOrderItem } from '@/components/popup';

interface StuffingData {
  id: number;
  stuffingNo: string;
  bookingNo: string;
  blNo: string;
  containerNo: string;
  containerType: string;
  sealNo: string;
  stuffingDate: string;
  stuffingTime: string;
  warehouse: string;
  shipper: string;
  packages: number;
  grossWeight: number;
  volume: number;
  commodity: string;
  status: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: '예정', color: 'bg-blue-500' },
  IN_PROGRESS: { label: '진행중', color: 'bg-yellow-500' },
  COMPLETED: { label: '완료', color: 'bg-green-500' },
  CANCELLED: { label: '취소', color: 'bg-red-500' },
};

const mockData: StuffingData[] = [
  { id: 1, stuffingNo: 'STF-2026-0001', bookingNo: 'BK-2026-0001', blNo: 'HDMU1234567', containerNo: 'HDMU1234567', containerType: '40HC', sealNo: 'SL001234', stuffingDate: '2026-01-22', stuffingTime: '09:00', warehouse: '부산신항 CFS', shipper: '삼성전자', packages: 500, grossWeight: 12000, volume: 65.5, commodity: '전자제품', status: 'COMPLETED' },
  { id: 2, stuffingNo: 'STF-2026-0002', bookingNo: 'BK-2026-0002', blNo: 'MAEU5678901', containerNo: 'MAEU5678901', containerType: '20GP', sealNo: '', stuffingDate: '2026-01-23', stuffingTime: '14:00', warehouse: '인천항 CFS', shipper: 'LG전자', packages: 200, grossWeight: 8000, volume: 45.2, commodity: '가전제품', status: 'SCHEDULED' },
  { id: 3, stuffingNo: 'STF-2026-0003', bookingNo: 'BK-2026-0003', blNo: 'MSCU2345678', containerNo: 'MSCU2345678', containerType: '40HC', sealNo: 'SL002345', stuffingDate: '2026-01-21', stuffingTime: '10:00', warehouse: '부산신항 CFS', shipper: '현대자동차', packages: 800, grossWeight: 18000, volume: 72.0, commodity: '자동차부품', status: 'IN_PROGRESS' },
];

export default function StuffingPage() {
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const today = getToday();
  const [filters, setFilters] = useState({
    startDate: today,
    endDate: today,
    stuffingNo: '',
    bookingNo: '',
    shipper: '',
    status: '',
  });
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [data] = useState<StuffingData[]>(mockData);
  const [showSOModal, setShowSOModal] = useState(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const handleSelectAll = (checked: boolean) => { setSelectedRows(checked ? filteredData.map(d => d.id) : []); };
  const handleSelectRow = (id: number, checked: boolean) => { setSelectedRows(prev => checked ? [...prev, id] : prev.filter(r => r !== id)); };

  const handleDeleteStuffing = async () => {
    if (selectedRows.length === 0) { alert('삭제할 항목을 선택하세요.'); return; }
    if (!confirm(`${selectedRows.length}건을 삭제하시겠습니까?`)) return;
    alert('삭제되었습니다. (샘플)');
    setSelectedRows([]);
  };

  const handleDateRangeSelect = (startDate: string, endDate: string) => {
    setFilters(prev => ({ ...prev, startDate, endDate }));
  };

  const handleSOSelect = (item: StuffingOrderItem) => {
    setFilters(prev => ({ ...prev, bookingNo: item.blNo }));
    setShowSOModal(false);
  };

  const handleSearch = () => setAppliedFilters(filters);
  const handleReset = () => {
    const resetFilters = { startDate: today, endDate: today, stuffingNo: '', bookingNo: '', shipper: '', status: '' };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
  };

  const filteredData = data.filter(item => {
    if (appliedFilters.stuffingNo && !item.stuffingNo.includes(appliedFilters.stuffingNo)) return false;
    if (appliedFilters.bookingNo && !item.bookingNo.includes(appliedFilters.bookingNo)) return false;
    if (appliedFilters.shipper && !item.shipper.includes(appliedFilters.shipper)) return false;
    if (appliedFilters.status && item.status !== appliedFilters.status) return false;
    return true;
  });

  const summaryStats = {
    total: filteredData.length,
    scheduled: filteredData.filter(d => d.status === 'SCHEDULED').length,
    inProgress: filteredData.filter(d => d.status === 'IN_PROGRESS').length,
    completed: filteredData.filter(d => d.status === 'COMPLETED').length,
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
        <PageLayout title="STUFFING ORDER 관리" subtitle="Logis > 수출B/L관리 > STUFFING ORDER 관리" showCloseButton={false} >
        <main ref={formRef} className="p-6">
          <div className="flex justify-between items-center mb-6">
            <button onClick={handleDeleteStuffing} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium" disabled={selectedRows.length === 0}>삭제</button>
            <div className="flex gap-2">
              <button onClick={() => setShowSOModal(true)} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">S/O 조회</button>
              <Link href="/logis/export/stuffing/register" className="px-6 py-2 font-semibold rounded-lg bg-[var(--surface-100)] text-[var(--foreground)] hover:bg-[var(--surface-200)]">
                신규 등록
              </Link>
            </div>
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
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">작업 일자 <span className="text-red-500">*</span></label>
                  <div className="flex items-center gap-2">
                    <input type="date" value={filters.startDate} onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))} className="flex-1 h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
                    <span className="text-[var(--muted)]">~</span>
                    <input type="date" value={filters.endDate} onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))} className="flex-1 h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
                    <DateRangeButtons onRangeSelect={handleDateRangeSelect} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">작업번호</label>
                  <input type="text" value={filters.stuffingNo} onChange={(e) => setFilters(prev => ({ ...prev, stuffingNo: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" placeholder="STF-YYYY-XXXX" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">부킹번호</label>
                  <input type="text" value={filters.bookingNo} onChange={(e) => setFilters(prev => ({ ...prev, bookingNo: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" placeholder="BK-YYYY-XXXX" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">상태</label>
                  <select value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm">
                    <option value="">전체</option>
                    <option value="SCHEDULED">예정</option>
                    <option value="IN_PROGRESS">진행중</option>
                    <option value="COMPLETED">완료</option>
                    <option value="CANCELLED">취소</option>
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
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-blue-500">{summaryStats.scheduled}</div><div className="text-sm text-[var(--muted)]">예정</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-yellow-500">{summaryStats.inProgress}</div><div className="text-sm text-[var(--muted)]">진행중</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-green-500">{summaryStats.completed}</div><div className="text-sm text-[var(--muted)]">완료</div></div>
          </div>

          <div className="card overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-12"><input type="checkbox" checked={selectedRows.length === filteredData.length && filteredData.length > 0} onChange={e => handleSelectAll(e.target.checked)} className="rounded" /></th>
                  <th className="w-14">No</th>
                  <th className="text-center">작업번호</th>
                  <th className="text-center">부킹번호</th>
                  <th className="text-center">컨테이너</th>
                  <th className="text-center">작업일시</th>
                  <th className="text-center">창고</th>
                  <th className="text-center">화주</th>
                  <th className="text-center">PKG</th>
                  <th className="text-center">G/W (KG)</th>
                  <th className="text-center">CBM</th>
                  <th className="text-center">Seal No.</th>
                  <th className="text-center">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-[var(--surface-50)] cursor-pointer">
                    <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}><input type="checkbox" checked={selectedRows.includes(item.id)} onChange={e => handleSelectRow(item.id, e.target.checked)} className="rounded" /></td>
                    <td className="px-4 py-3 text-center text-sm">{index + 1}</td>
                    <td className="px-4 py-3 text-center"><Link href={`/logis/export/stuffing/${item.id}`} className="text-blue-400 hover:underline">{item.stuffingNo}</Link></td>
                    <td className="px-4 py-3 text-sm text-center">{item.bookingNo}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.containerNo} ({item.containerType})</td>
                    <td className="px-4 py-3 text-sm text-center">{item.stuffingDate} {item.stuffingTime}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.warehouse}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.shipper}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.packages}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.grossWeight.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.volume}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.sealNo || '-'}</td>
                    <td className="px-4 py-3 text-center"><span className={`px-2 py-1 text-xs rounded-full text-white ${statusConfig[item.status]?.color}`}>{statusConfig[item.status]?.label}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      <StuffingOrderModal
        isOpen={showSOModal}
        onClose={() => setShowSOModal(false)}
        onSelect={handleSOSelect}
      />

      {/* 화면 닫기 확인 모달 */}
      <CloseConfirmModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onConfirm={handleConfirmClose}
      />
    </PageLayout>
  );
}
