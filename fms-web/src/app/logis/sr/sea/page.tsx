'use client';

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LIST_PATHS } from '@/constants/paths';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import DateRangeButtons, { getToday } from '@/components/DateRangeButtons';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { useSorting, SortableHeader, SortStatusBadge } from '@/components/table';

interface SRData {
  id: string;
  srNo: string;
  srDate: string;
  bookingNo: string;
  shipper: string;
  consignee: string;
  carrier: string;
  vessel: string;
  voyage: string;
  pol: string;
  pod: string;
  etd: string;
  eta: string;
  containerType: string;
  containerQty: number;
  commodity: string;
  status: 'draft' | 'submitted' | 'confirmed' | 'rejected';
}

interface SearchFilters {
  startDate: string;
  endDate: string;
  srNo: string;
  bookingNo: string;
  shipper: string;
  carrier: string;
  pol: string;
  pod: string;
  status: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: '작성중', color: '#6B7280', bgColor: '#F3F4F6' },
  submitted: { label: '전송', color: '#2563EB', bgColor: '#DBEAFE' },
  confirmed: { label: '확정', color: '#059669', bgColor: '#D1FAE5' },
  rejected: { label: '반려', color: '#DC2626', bgColor: '#FEE2E2' },
  DRAFT: { label: '초안', color: '#6B7280', bgColor: '#F3F4F6' },
  PENDING: { label: '대기', color: '#D97706', bgColor: '#FEF3C7' },
  SUBMITTED: { label: '제출', color: '#2563EB', bgColor: '#DBEAFE' },
  APPROVED: { label: '승인', color: '#059669', bgColor: '#D1FAE5' },
  REJECTED: { label: '반려', color: '#DC2626', bgColor: '#FEE2E2' },
  CONFIRMED: { label: '확정', color: '#059669', bgColor: '#D1FAE5' },
  EXPIRED: { label: '만료', color: '#6B7280', bgColor: '#F3F4F6' },
  CANCELLED: { label: '취소', color: '#DC2626', bgColor: '#FEE2E2' },
};

const getStatusConfig = (status: string) => statusConfig[status] || { label: status || '미정', color: '#6B7280', bgColor: '#F3F4F6' };

const sampleData: SRData[] = [
  { id: '1', srNo: 'SR-2026-0001', srDate: '2026-01-15', bookingNo: 'SB-2026-0001', shipper: '삼성전자', consignee: '삼성아메리카', carrier: 'MAERSK', vessel: 'MAERSK EINDHOVEN', voyage: '001E', pol: 'KRPUS', pod: 'USLGB', etd: '2026-01-20', eta: '2026-02-05', containerType: '40HC', containerQty: 2, commodity: '전자제품', status: 'confirmed' },
  { id: '2', srNo: 'SR-2026-0002', srDate: '2026-01-14', bookingNo: 'SB-2026-0002', shipper: 'LG전자', consignee: 'LG Europe B.V.', carrier: 'MSC', vessel: 'MSC GULSUN', voyage: 'W002', pol: 'KRPUS', pod: 'DEHAM', etd: '2026-01-22', eta: '2026-02-15', containerType: '40GP', containerQty: 3, commodity: '가전제품', status: 'submitted' },
  { id: '3', srNo: 'SR-2026-0003', srDate: '2026-01-13', bookingNo: 'SB-2026-0003', shipper: '현대자동차', consignee: 'Hyundai Motor America', carrier: 'HMM', vessel: 'HMM ALGECIRAS', voyage: '003S', pol: 'KRINC', pod: 'USNYC', etd: '2026-01-25', eta: '2026-02-20', containerType: '45HC', containerQty: 5, commodity: '자동차 부품', status: 'draft' },
  { id: '4', srNo: 'SR-2026-0004', srDate: '2026-01-12', bookingNo: 'SB-2026-0004', shipper: 'SK하이닉스', consignee: 'SK아메리카', carrier: 'EVERGREEN', vessel: 'EVER GIVEN', voyage: '004E', pol: 'KRPUS', pod: 'USLGB', etd: '2026-01-28', eta: '2026-02-12', containerType: '40HC', containerQty: 4, commodity: '반도체 장비', status: 'rejected' },
  { id: '5', srNo: 'SR-2026-0005', srDate: '2026-01-11', bookingNo: 'SB-2026-0005', shipper: '포스코', consignee: '포스코재팬', carrier: 'ONE', vessel: 'ONE APUS', voyage: '005N', pol: 'KRPUS', pod: 'JPTYO', etd: '2026-01-18', eta: '2026-01-21', containerType: '20GP', containerQty: 10, commodity: '철강 제품', status: 'confirmed' },
];

const getInitialFilters = (): SearchFilters => {
  const today = getToday();
  return { startDate: today, endDate: today, srNo: '', bookingNo: '', shipper: '', carrier: '', pol: '', pod: '', status: '' };
};

const initialFilters = getInitialFilters();

const portNames: Record<string, string> = { KRPUS: '부산', KRINC: '인천', USLAX: 'LA', USLGB: '롱비치', USNYC: '뉴욕', DEHAM: '함부르크', JPTYO: '도쿄' };

export default function SRSeaPage() {
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const [allData] = useState<SRData[]>(sampleData);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(initialFilters);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchMessage, setSearchMessage] = useState<string>('');

  // 정렬 훅
  const { sortConfig, handleSort, sortData, getSortStatusText, resetSort } = useSorting<SRData>();

  // 컬럼 레이블
  const columnLabels: Record<string, string> = {
    srNo: 'S/R 번호',
    srDate: 'S/R 일자',
    bookingNo: '부킹번호',
    shipper: '화주',
    carrier: '선사',
    vessel: '선명',
    pol: '구간',
    etd: 'ETD',
    containerQty: '컨테이너',
    status: '상태',
  };

  const filteredList = useMemo(() => {
    return allData.filter(item => {
      if (appliedFilters.srNo && !item.srNo.toLowerCase().includes(appliedFilters.srNo.toLowerCase())) return false;
      if (appliedFilters.bookingNo && !item.bookingNo.toLowerCase().includes(appliedFilters.bookingNo.toLowerCase())) return false;
      if (appliedFilters.shipper && !item.shipper.toLowerCase().includes(appliedFilters.shipper.toLowerCase())) return false;
      if (appliedFilters.carrier && item.carrier !== appliedFilters.carrier) return false;
      if (appliedFilters.pol && !item.pol.toLowerCase().includes(appliedFilters.pol.toLowerCase())) return false;
      if (appliedFilters.pod && !item.pod.toLowerCase().includes(appliedFilters.pod.toLowerCase())) return false;
      if (appliedFilters.status && item.status !== appliedFilters.status) return false;
      if (appliedFilters.startDate && item.srDate < appliedFilters.startDate) return false;
      if (appliedFilters.endDate && item.srDate > appliedFilters.endDate) return false;
      return true;
    });
  }, [allData, appliedFilters]);

  // 정렬된 목록
  const sortedList = useMemo(() => sortData(filteredList), [filteredList, sortData]);

  const summary = useMemo(() => ({
    total: filteredList.length,
    draft: filteredList.filter(b => b.status === 'draft').length,
    submitted: filteredList.filter(b => b.status === 'submitted').length,
    confirmed: filteredList.filter(b => b.status === 'confirmed').length,
  }), [filteredList]);

  const handleSearch = () => { setAppliedFilters({ ...filters }); setSelectedIds(new Set()); setSearchMessage('검색 완료: ' + filteredList.length + '건'); setTimeout(() => setSearchMessage(''), 3000); };
  const handleReset = () => { const f = getInitialFilters(); setFilters(f); setAppliedFilters(f); setSelectedIds(new Set()); setSearchMessage('초기화 완료'); setTimeout(() => setSearchMessage(''), 3000); };
  const handleFilterChange = (field: keyof SearchFilters, value: string) => setFilters(prev => ({ ...prev, [field]: value }));
  const handleRowSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const handleSelectAll = () => selectedIds.size === sortedList.length ? setSelectedIds(new Set()) : setSelectedIds(new Set(sortedList.map(i => i.id)));

  const summaryCards = [
    { key: '', label: '전체', value: summary.total, color: '#E8A838' },
    { key: 'draft', label: '작성중', value: summary.draft, color: '#6B7280' },
    { key: 'submitted', label: '전송', value: summary.submitted, color: '#2563EB' },
    { key: 'confirmed', label: '확정', value: summary.confirmed, color: '#059669' },
  ];

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
        <PageLayout title="선적요청관리 (S/R)" subtitle="Logis > 선적관리 > 선적요청관리 (해상)" showCloseButton={false} >
        <main ref={formRef} className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              {selectedIds.size > 0 && <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">{selectedIds.size}건 선택</span>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => router.push('/logis/sr/sea/register')} className="px-4 py-2 font-semibold rounded-lg flex items-center gap-2 bg-[var(--surface-100)] text-[var(--foreground)] hover:bg-[var(--surface-200)] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                S/R 등록
              </button>
              <button onClick={() => alert('Excel 다운로드')} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)] flex items-center gap-2">Excel</button>
            </div>
          </div>

          {searchMessage && (
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl flex items-center gap-3">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-blue-100">{searchMessage}</span>
            </div>
          )}

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
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">S/R 일자</label>
                  <div className="flex items-center gap-2">
                    <input type="date" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
                    <span className="text-[var(--muted)]">~</span>
                    <input type="date" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
                    <DateRangeButtons onRangeSelect={(start, end) => { handleFilterChange('startDate', start); handleFilterChange('endDate', end); }} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">S/R 번호</label>
                  <input type="text" value={filters.srNo} onChange={(e) => handleFilterChange('srNo', e.target.value)} placeholder="SR-YYYY-XXXX" className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">부킹번호</label>
                  <input type="text" value={filters.bookingNo} onChange={(e) => handleFilterChange('bookingNo', e.target.value)} placeholder="SB-YYYY-XXXX" className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">화주</label>
                  <input type="text" value={filters.shipper} onChange={(e) => handleFilterChange('shipper', e.target.value)} placeholder="화주명" className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">선사</label>
                  <select value={filters.carrier} onChange={(e) => handleFilterChange('carrier', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm">
                    <option value="">전체</option>
                    <option value="MAERSK">MAERSK</option>
                    <option value="MSC">MSC</option>
                    <option value="HMM">HMM</option>
                    <option value="EVERGREEN">EVERGREEN</option>
                    <option value="ONE">ONE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">선적항</label>
                  <input type="text" value={filters.pol} onChange={(e) => handleFilterChange('pol', e.target.value)} placeholder="예: KRPUS" className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">양하항</label>
                  <input type="text" value={filters.pod} onChange={(e) => handleFilterChange('pod', e.target.value)} placeholder="예: USLAX" className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-[var(--border)] flex justify-center gap-2">
              <button onClick={handleSearch} className="px-6 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] font-medium">조회</button>
              <button onClick={handleReset} className="px-6 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">초기화</button>
            </div>
          </div>

          {/* 현황 카드 */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            {summaryCards.map(c => (
              <div key={c.label} onClick={() => { setFilters(p => ({ ...p, status: c.key })); setAppliedFilters(p => ({ ...p, status: c.key })); }} className="card p-5 text-center cursor-pointer hover:scale-[1.02] transition-all duration-200" style={{ background: appliedFilters.status === c.key && c.key !== '' ? `linear-gradient(135deg, ${c.color}15 0%, transparent 100%)` : undefined }}>
                <p className="text-3xl font-bold" style={{ color: c.color }}>{c.value}</p>
                <p className="text-sm text-[var(--muted)] mt-1">{c.label}</p>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h3 className="font-bold">S/R 목록</h3>
                <span className="px-2 py-1 bg-[#E8A838]/20 text-[#E8A838] rounded text-sm font-medium">{filteredList.length}건</span>
                <SortStatusBadge statusText={getSortStatusText(columnLabels)} onReset={resetSort} />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-12"><input type="checkbox" checked={sortedList.length > 0 && selectedIds.size === sortedList.length} onChange={handleSelectAll} className="rounded" /></th>
                    <SortableHeader columnKey="srNo" label="S/R 번호" sortConfig={sortConfig} onSort={handleSort} />
                    <SortableHeader columnKey="srDate" label="S/R 일자" sortConfig={sortConfig} onSort={handleSort} />
                    <SortableHeader columnKey="bookingNo" label="부킹번호" sortConfig={sortConfig} onSort={handleSort} />
                    <SortableHeader columnKey="shipper" label="화주" sortConfig={sortConfig} onSort={handleSort} />
                    <SortableHeader columnKey="carrier" label="선사" sortConfig={sortConfig} onSort={handleSort} />
                    <SortableHeader columnKey="vessel" label="선명/항차" sortConfig={sortConfig} onSort={handleSort} />
                    <SortableHeader columnKey="pol" label="구간" sortConfig={sortConfig} onSort={handleSort} />
                    <SortableHeader columnKey="etd" label="ETD" sortConfig={sortConfig} onSort={handleSort} align="center" />
                    <SortableHeader columnKey="containerQty" label="컨테이너" sortConfig={sortConfig} onSort={handleSort} align="center" />
                    <SortableHeader columnKey="status" label="상태" sortConfig={sortConfig} onSort={handleSort} align="center" />
                  </tr>
                </thead>
                <tbody>
                  {sortedList.length === 0 ? (
                    <tr><td colSpan={11} className="p-12 text-center"><p className="text-[var(--muted)]">조회된 데이터가 없습니다.</p></td></tr>
                  ) : sortedList.map(row => (
                    <tr key={row.id} className={`border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer transition-colors ${selectedIds.has(row.id) ? 'bg-blue-500/10' : ''}`} onClick={() => router.push(`/logis/sr/sea/${row.id}`)}>
                      <td className="p-3 text-center" onClick={e => e.stopPropagation()}><input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => handleRowSelect(row.id)} className="rounded" /></td>
                      <td className="p-3 text-center"><span className="text-[#E8A838] font-medium hover:underline">{row.srNo}</span></td>
                      <td className="p-3 text-sm text-center text-[var(--muted)]">{row.srDate}</td>
                      <td className="p-3 text-sm text-center">{row.bookingNo}</td>
                      <td className="p-3 text-sm text-center font-medium">{row.shipper}</td>
                      <td className="p-3 text-center"><span className="px-2 py-1 bg-[var(--surface-100)] rounded text-sm font-medium">{row.carrier}</span></td>
                      <td className="p-3 text-sm text-center"><span className="text-white">{row.vessel}</span><span className="text-[var(--muted)]"> / {row.voyage}</span></td>
                      <td className="p-3 text-sm text-center"><span className="font-medium">{portNames[row.pol] || row.pol}</span> → <span className="font-medium">{portNames[row.pod] || row.pod}</span></td>
                      <td className="p-3 text-sm text-center">{row.etd}</td>
                      <td className="p-3 text-center"><span className="text-sm font-medium">{row.containerQty} x {row.containerType}</span></td>
                      <td className="p-3 text-center"><span className="px-3 py-1 rounded-full text-xs font-medium" style={{ color: getStatusConfig(row.status).color, backgroundColor: getStatusConfig(row.status).bgColor }}>{getStatusConfig(row.status).label}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
