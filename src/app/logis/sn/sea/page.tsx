'use client';

import { useRouter } from 'next/navigation';
import { LIST_PATHS } from '@/constants/paths';

import { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import DateRangeButtons, { getToday } from '@/components/DateRangeButtons';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { useSorting, SortableHeader, SortStatusBadge } from '@/components/table';

interface SNData {
  id: number;
  snNo: string;
  snDate: string;
  srNo: string;
  blNo: string;
  shipper: string;
  consignee: string;
  carrier: string;
  vessel: string;
  voyage: string;
  pol: string;
  pod: string;
  etd: string;
  atd: string;
  eta: string;
  containerQty: number;
  status: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: '대기', color: 'bg-gray-500', bgColor: '#F3F4F6' },
  SENT: { label: '발송완료', color: 'bg-blue-500', bgColor: '#DBEAFE' },
  CONFIRMED: { label: '확인완료', color: 'bg-green-500', bgColor: '#D1FAE5' },
  DEPARTED: { label: '출항완료', color: 'bg-purple-500', bgColor: '#F3E8FF' },
  DRAFT: { label: '초안', color: 'bg-gray-500', bgColor: '#F3F4F6' },
  SUBMITTED: { label: '제출', color: 'bg-blue-500', bgColor: '#DBEAFE' },
  APPROVED: { label: '승인', color: 'bg-green-500', bgColor: '#D1FAE5' },
  REJECTED: { label: '반려', color: 'bg-red-500', bgColor: '#FEE2E2' },
  EXPIRED: { label: '만료', color: 'bg-gray-500', bgColor: '#F3F4F6' },
  CANCELLED: { label: '취소', color: 'bg-red-500', bgColor: '#FEE2E2' },
};

const getStatusConfig = (status: string) => statusConfig[status] || { label: status || '미정', color: 'bg-gray-500', bgColor: '#F3F4F6' };

const mockData: SNData[] = [
  { id: 1, snNo: 'SN-2026-0001', snDate: '2026-01-20', srNo: 'SR-2026-0001', blNo: 'HDMU1234567', shipper: '삼성전자', consignee: '삼성아메리카', carrier: 'HMM', vessel: 'HMM GDANSK', voyage: '001E', pol: 'KRPUS', pod: 'USLAX', etd: '2026-01-22', atd: '', eta: '2026-02-08', containerQty: 2, status: 'SENT' },
  { id: 2, snNo: 'SN-2026-0002', snDate: '2026-01-19', srNo: 'SR-2026-0002', blNo: 'MAEU5678901', shipper: 'LG전자', consignee: 'LG Electronics USA', carrier: 'MAERSK', vessel: 'MAERSK EINDHOVEN', voyage: '002W', pol: 'KRPUS', pod: 'USNYC', etd: '2026-01-21', atd: '2026-01-21', eta: '2026-02-15', containerQty: 3, status: 'DEPARTED' },
  { id: 3, snNo: 'SN-2026-0003', snDate: '2026-01-18', srNo: 'SR-2026-0003', blNo: '', shipper: '현대자동차', consignee: 'Hyundai Motor America', carrier: 'MSC', vessel: 'MSC OSCAR', voyage: '003E', pol: 'KRPUS', pod: 'DEHAM', etd: '2026-01-25', atd: '', eta: '2026-02-20', containerQty: 5, status: 'PENDING' },
  { id: 4, snNo: 'SN-2026-0004', snDate: '2026-01-17', srNo: 'SR-2026-0004', blNo: 'EGLV9012345', shipper: 'SK하이닉스', consignee: 'SK Hynix America', carrier: 'EVERGREEN', vessel: 'EVER GIVEN', voyage: '004W', pol: 'KRPUS', pod: 'CNSHA', etd: '2026-01-20', atd: '2026-01-20', eta: '2026-01-25', containerQty: 1, status: 'CONFIRMED' },
];

export default function SNListPage() {
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const today = getToday();
  const [filters, setFilters] = useState({
    startDate: today,
    endDate: today,
    snNo: '',
    srNo: '',
    blNo: '',
    shipper: '',
    carrier: '',
    status: '',
  });
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [data] = useState<SNData[]>(mockData);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const handleSelectAll = (checked: boolean) => { setSelectedRows(checked ? filteredData.map(d => d.id) : []); };
  const handleSelectRow = (id: number, checked: boolean) => { setSelectedRows(prev => checked ? [...prev, id] : prev.filter(r => r !== id)); };
  // 수정 버튼 핸들러
  const handleEdit = () => {
    if (selectedRows.length === 0) { alert('수정할 항목을 선택해주세요.'); return; }
    if (selectedRows.length > 1) { alert('수정할 항목을 1개만 선택해주세요.'); return; }
    const id = selectedRows[0];
    router.push(`/logis/sn/sea/register?id=${id}`);
  };


  const handleDelete = async () => {
    if (selectedRows.length === 0) { alert('삭제할 항목을 선택하세요.'); return; }
    if (!confirm(`${selectedRows.length}건을 삭제하시겠습니까?`)) return;
    alert('삭제되었습니다. (샘플)');
    setSelectedRows([]);
  };

  // 정렬 훅
  const { sortConfig, handleSort, sortData, getSortStatusText, resetSort } = useSorting<SNData>();

  // 컬럼 레이블
  const columnLabels: Record<string, string> = {
    snNo: 'S/N 번호',
    snDate: 'S/N 일자',
    srNo: 'S/R 번호',
    blNo: 'B/L 번호',
    shipper: '화주',
    carrier: '선사',
    pol: 'POL',
    etd: 'ETD',
    containerQty: '컨테이너',
    status: '상태',
  };

  const handleDateRangeSelect = (startDate: string, endDate: string) => {
    setFilters(prev => ({ ...prev, startDate, endDate }));
  };

  const handleSearch = () => setAppliedFilters(filters);
  const handleReset = () => {
    const resetFilters = { startDate: today, endDate: today, snNo: '', srNo: '', blNo: '', shipper: '', carrier: '', status: '' };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
  };

  const filteredData = useMemo(() => data.filter(item => {
    if (appliedFilters.snNo && !item.snNo.toLowerCase().includes(appliedFilters.snNo.toLowerCase())) return false;
    if (appliedFilters.srNo && !item.srNo.toLowerCase().includes(appliedFilters.srNo.toLowerCase())) return false;
    if (appliedFilters.blNo && !item.blNo.toLowerCase().includes(appliedFilters.blNo.toLowerCase())) return false;
    if (appliedFilters.shipper && !item.shipper.toLowerCase().includes(appliedFilters.shipper.toLowerCase())) return false;
    if (appliedFilters.carrier && item.carrier !== appliedFilters.carrier) return false;
    if (appliedFilters.status && item.status !== appliedFilters.status) return false;
    return true;
  }), [data, appliedFilters]);

  // 정렬된 목록
  const sortedList = useMemo(() => sortData(filteredData), [filteredData, sortData]);

  const summaryStats = useMemo(() => ({
    total: filteredData.length,
    pending: filteredData.filter(d => d.status === 'PENDING').length,
    sent: filteredData.filter(d => d.status === 'SENT').length,
    confirmed: filteredData.filter(d => d.status === 'CONFIRMED').length,
    departed: filteredData.filter(d => d.status === 'DEPARTED').length,
  }), [filteredData]);

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
        <PageLayout title="선적통지 목록 (S/N)" subtitle="Logis > 선적관리 > 선적통지 목록 (해상)" showCloseButton={false} >
        <main ref={formRef} className="p-6">
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => router.push('/logis/sn/sea/register')} className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] text-sm">신규</button>
              <button onClick={handleEdit} className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] text-sm">
                수정
              </button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium" disabled={selectedRows.length === 0}>삭제</button>
            <Link href="/logis/sn/sea/register" className="px-6 py-2 font-semibold rounded-lg bg-[var(--surface-100)] text-[var(--foreground)] hover:bg-[var(--surface-200)]">
              신규 등록
            </Link>
          </div>

          {/* 검색조건 - Booking Sea 스타일 */}
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
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">S/N 일자</label>
                  <div className="flex items-center gap-2">
                    <input type="date" value={filters.startDate} onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
                    <span className="text-[var(--muted)]">~</span>
                    <input type="date" value={filters.endDate} onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
                    <DateRangeButtons onRangeSelect={handleDateRangeSelect} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">S/N 번호</label>
                  <input type="text" value={filters.snNo} onChange={(e) => setFilters(prev => ({ ...prev, snNo: e.target.value }))} placeholder="SN-YYYY-XXXX" className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">S/R 번호</label>
                  <input type="text" value={filters.srNo} onChange={(e) => setFilters(prev => ({ ...prev, srNo: e.target.value }))} placeholder="SR-YYYY-XXXX" className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">B/L 번호</label>
                  <input type="text" value={filters.blNo} onChange={(e) => setFilters(prev => ({ ...prev, blNo: e.target.value }))} placeholder="HDMU1234567" className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">화주</label>
                  <input type="text" value={filters.shipper} onChange={(e) => setFilters(prev => ({ ...prev, shipper: e.target.value }))} placeholder="화주명" className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">선사</label>
                  <select value={filters.carrier} onChange={(e) => setFilters(prev => ({ ...prev, carrier: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm">
                    <option value="">전체</option>
                    <option value="MAERSK">MAERSK</option>
                    <option value="MSC">MSC</option>
                    <option value="HMM">HMM</option>
                    <option value="EVERGREEN">EVERGREEN</option>
                    <option value="ONE">ONE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">상태</label>
                  <select value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm">
                    <option value="">전체</option>
                    <option value="PENDING">대기</option>
                    <option value="SENT">발송완료</option>
                    <option value="CONFIRMED">확인완료</option>
                    <option value="DEPARTED">출항완료</option>
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
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-blue-500">{summaryStats.sent}</div><div className="text-sm text-[var(--muted)]">발송완료</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-green-500">{summaryStats.confirmed}</div><div className="text-sm text-[var(--muted)]">확인완료</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-purple-500">{summaryStats.departed}</div><div className="text-sm text-[var(--muted)]">출항완료</div></div>
          </div>

          <div className="card overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] flex items-center gap-3">
              <h3 className="font-bold">S/N 목록</h3>
              <span className="px-2 py-1 bg-[#E8A838]/20 text-[#E8A838] rounded text-sm font-medium">{filteredData.length}건</span>
              <SortStatusBadge statusText={getSortStatusText(columnLabels)} onReset={resetSort} />
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th className="w-12"><input type="checkbox" checked={selectedRows.length === filteredData.length && filteredData.length > 0} onChange={e => handleSelectAll(e.target.checked)} className="rounded" /></th>
                  <th className="w-14">No</th>
                  <SortableHeader columnKey="snNo" label="S/N 번호" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="snDate" label="S/N 일자" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="srNo" label="S/R 번호" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="blNo" label="B/L 번호" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="shipper" label="화주" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="carrier" label="선사/선명" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="pol" label="POL/POD" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="etd" label="ETD/ATD" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="containerQty" label="컨테이너" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="status" label="상태" sortConfig={sortConfig} onSort={handleSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {sortedList.map((item, index) => (
                  <tr key={item.id} className="hover:bg-[var(--surface-50)] cursor-pointer" onClick={() => router.push(`/logis/sn/sea/${item.id}`)}>
                    <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}><input type="checkbox" checked={selectedRows.includes(item.id)} onChange={e => handleSelectRow(item.id, e.target.checked)} className="rounded" /></td>
                    <td className="px-4 py-3 text-center text-sm">{index + 1}</td>
                    <td className="px-4 py-3 text-center whitespace-nowrap"><Link href={`/logis/sn/sea/${item.id}`} className="text-blue-400 hover:underline" onClick={(e) => e.stopPropagation()}>{item.snNo}</Link></td>
                    <td className="px-4 py-3 text-sm text-center whitespace-nowrap">{item.snDate}</td>
                    <td className="px-4 py-3 text-sm text-center whitespace-nowrap">{item.srNo}</td>
                    <td className="px-4 py-3 text-sm text-center whitespace-nowrap">{item.blNo || '-'}</td>
                    <td className="px-4 py-3 text-sm text-center whitespace-nowrap">{item.shipper}</td>
                    <td className="px-4 py-3 text-sm text-center whitespace-nowrap">{item.carrier} / {item.vessel}</td>
                    <td className="px-4 py-3 text-sm text-center whitespace-nowrap">{item.pol} → {item.pod}</td>
                    <td className="px-4 py-3 text-sm text-center whitespace-nowrap">{item.etd}{item.atd && ` / ${item.atd}`}</td>
                    <td className="px-4 py-3 text-sm text-center whitespace-nowrap">{item.containerQty}</td>
                    <td className="px-4 py-3 text-center whitespace-nowrap"><span className={`px-2 py-1 text-xs rounded-full text-white ${getStatusConfig(item.status).color}`}>{getStatusConfig(item.status).label}</span></td>
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
