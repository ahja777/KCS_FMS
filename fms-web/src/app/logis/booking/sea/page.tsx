'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { LIST_PATHS } from '@/constants/paths';
import DateRangeButtons, { getToday } from '@/components/DateRangeButtons';
import SearchIconButton from '@/components/SearchIconButton';
import { CodeSearchModal, type CodeItem } from '@/components/popup';
import SeaBookingDetailPanel, { SeaBookingDetail } from '@/components/booking/SeaBookingDetailPanel';
import { ReportPrintModal } from '@/components/reports';
import SelectionAlertModal from '@/components/SelectionAlertModal';
import EmailModal from '@/components/EmailModal';

// 화면설계서 기준 검색조건 인터페이스
interface SearchFilters {
  startDate: string;
  endDate: string;
  bookingStatus: string;       // Booking 상태
  carrierBookingNo: string;    // 선사부킹번호
  pol: string;                 // 선적지
  pod: string;                 // 양하항
}

// 화면설계서 기준 목록 데이터 인터페이스
interface SeaBooking {
  id: string;
  bookingStatus: string;       // Booking 상태
  bookingNo: string;           // Booking No.
  bookingRequestDate: string;  // 부킹요청일자
  pol: string;                 // 선적항
  pod: string;                 // 양하항
  vesselVoyage: string;        // 선명/항차
  customerName: string;        // 거래처명
  commodity: string;           // Commodity
  grossWeight: number;         // G.Weight
  measurement: number;         // Measure
  specialHandlingCode: string; // Special Handing Code
  // 전송정보
  transmitDate?: string;       // 전송일시
  receiveDate?: string;        // 수신일시
  requestCustomer?: string;    // 부킹요청거래처
  confirmCustomer?: string;    // 부킹확정거래처
  // 추가 필드
  carrierBookingNo?: string;
  vessel?: string;
  voyage?: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  REQUEST: { label: '부킹요청', color: '#2563EB', bgColor: '#DBEAFE' },
  CONFIRM: { label: '부킹확정', color: '#059669', bgColor: '#D1FAE5' },
  CANCEL: { label: '부킹취소', color: '#DC2626', bgColor: '#FEE2E2' },
  DRAFT: { label: '작성중', color: '#6B7280', bgColor: '#F3F4F6' },
};

const getStatusConfig = (status: string) => {
  return statusConfig[status] || { label: status || '미정', color: '#6B7280', bgColor: '#F3F4F6' };
};

// 샘플 데이터 - 화면설계서 기준
const initialSampleData: SeaBooking[] = [
  { id: '1', bookingStatus: 'CONFIRM', bookingNo: 'AN-0107120001', bookingRequestDate: '2026-01-15', pol: 'KRPUS', pod: 'USLGB', vesselVoyage: 'HANJIN SHIP / 031E', customerName: '삼성전자', commodity: '전자제품', grossWeight: 15000, measurement: 65, specialHandlingCode: '', transmitDate: '2026-01-15 10:30', receiveDate: '2026-01-15 10:35', requestCustomer: '삼성물류', confirmCustomer: 'MAERSK' },
  { id: '2', bookingStatus: 'REQUEST', bookingNo: 'AN-0107120002', bookingRequestDate: '2026-01-14', pol: 'KRPUS', pod: 'DEHAM', vesselVoyage: 'MSC GULSUN / W002', customerName: 'LG전자', commodity: '가전제품', grossWeight: 24000, measurement: 80, specialHandlingCode: 'DG', transmitDate: '2026-01-14 09:00', requestCustomer: 'LG물류' },
  { id: '3', bookingStatus: 'DRAFT', bookingNo: 'AN-0107120003', bookingRequestDate: '2026-01-13', pol: 'KRINC', pod: 'USNYC', vesselVoyage: 'HMM ALGECIRAS / 003S', customerName: '현대자동차', commodity: '자동차 부품', grossWeight: 45000, measurement: 120, specialHandlingCode: '' },
  { id: '4', bookingStatus: 'CANCEL', bookingNo: 'AN-0107120004', bookingRequestDate: '2026-01-12', pol: 'KRPUS', pod: 'USLGB', vesselVoyage: 'EVER GIVEN / 004E', customerName: 'SK하이닉스', commodity: '반도체 장비', grossWeight: 32000, measurement: 90, specialHandlingCode: 'REEFER', transmitDate: '2026-01-12 14:00', receiveDate: '2026-01-12 14:30', requestCustomer: 'SK물류', confirmCustomer: 'EVERGREEN' },
  { id: '5', bookingStatus: 'CONFIRM', bookingNo: 'AN-0107120005', bookingRequestDate: '2026-01-11', pol: 'KRPUS', pod: 'JPTYO', vesselVoyage: 'ONE APUS / 005N', customerName: '포스코', commodity: '철강 제품', grossWeight: 180000, measurement: 200, specialHandlingCode: '', transmitDate: '2026-01-11 08:00', receiveDate: '2026-01-11 08:30', requestCustomer: '포스코물류', confirmCustomer: 'ONE' },
];

const today = getToday();
const initialFilters: SearchFilters = {
  startDate: today,
  endDate: today,
  bookingStatus: '',
  carrierBookingNo: '',
  pol: '',
  pod: '',
};

const portNames: Record<string, string> = { KRPUS: '부산', KRINC: '인천', KRKAN: '광양', USLAX: 'LA', USLGB: '롱비치', USNYC: '뉴욕', USHOU: '휴스턴', DEHAM: '함부르크', NLRTM: '로테르담', JPTYO: '도쿄', CNSHA: '상하이', SGSIN: '싱가포르' };

// 정렬 설정 인터페이스
interface SortConfig {
  key: keyof SeaBooking | null;
  direction: 'asc' | 'desc';
}

// 정렬 아이콘 컴포넌트
const SortIcon = ({ columnKey, sortConfig }: { columnKey: keyof SeaBooking; sortConfig: SortConfig }) => {
  const isActive = sortConfig.key === columnKey;
  return (
    <span className="inline-flex flex-col ml-1.5 gap-px">
      <span
        style={{
          width: 0,
          height: 0,
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderBottom: `5px solid ${isActive && sortConfig.direction === 'asc' ? '#ffffff' : 'rgba(255,255,255,0.35)'}`,
        }}
      />
      <span
        style={{
          width: 0,
          height: 0,
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderTop: `5px solid ${isActive && sortConfig.direction === 'desc' ? '#ffffff' : 'rgba(255,255,255,0.35)'}`,
        }}
      />
    </span>
  );
};

export default function BookingSeaPage() {
  const router = useRouter();
  const [allData, setAllData] = useState<SeaBooking[]>(initialSampleData);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(initialFilters);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedRow, setSelectedRow] = useState<SeaBooking | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSelectionAlert, setShowSelectionAlert] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [showPolModal, setShowPolModal] = useState(false);
  const [showPodModal, setShowPodModal] = useState(false);

  // 날짜 범위 선택 핸들러
  const handleDateRangeSelect = (startDate: string, endDate: string) => {
    setFilters(prev => ({ ...prev, startDate, endDate }));
  };

  // 항구 선택 핸들러
  const handlePolSelect = (item: CodeItem) => {
    setFilters(prev => ({ ...prev, pol: item.code }));
    setShowPolModal(false);
  };
  const handlePodSelect = (item: CodeItem) => {
    setFilters(prev => ({ ...prev, pod: item.code }));
    setShowPodModal(false);
  };

  // 화면닫기 핸들러
  const handleConfirmClose = () => {
    setShowCloseModal(false);
    router.push(LIST_PATHS.DASHBOARD);
  };

  useCloseConfirm({
    showModal: showCloseModal,
    setShowModal: setShowCloseModal,
    onConfirmClose: handleConfirmClose,
  });

  const filteredList = useMemo(() => {
    return allData.filter(item => {
      if (appliedFilters.bookingStatus && item.bookingStatus !== appliedFilters.bookingStatus) return false;
      if (appliedFilters.carrierBookingNo && !item.carrierBookingNo?.toLowerCase().includes(appliedFilters.carrierBookingNo.toLowerCase())) return false;
      if (appliedFilters.pol && !item.pol.toLowerCase().includes(appliedFilters.pol.toLowerCase())) return false;
      if (appliedFilters.pod && !item.pod.toLowerCase().includes(appliedFilters.pod.toLowerCase())) return false;
      if (appliedFilters.startDate && item.bookingRequestDate < appliedFilters.startDate) return false;
      if (appliedFilters.endDate && item.bookingRequestDate > appliedFilters.endDate) return false;
      return true;
    });
  }, [allData, appliedFilters]);

  // 정렬된 리스트
  const sortedList = useMemo(() => {
    if (!sortConfig.key) return filteredList;
    return [...filteredList].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue, 'ko');
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });
  }, [filteredList, sortConfig]);

  // 정렬 핸들러
  const handleSort = (key: keyof SeaBooking) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // 정렬 가능한 헤더 컴포넌트
  const SortableHeader = ({ columnKey, label, className = '' }: { columnKey: keyof SeaBooking; label: string; className?: string }) => (
    <th className={`cursor-pointer select-none ${className}`} onClick={() => handleSort(columnKey)}>
      <span className="inline-flex items-center">{label}<SortIcon columnKey={columnKey} sortConfig={sortConfig} /></span>
    </th>
  );

  // 핸들러
  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...filters });
    setSelectedIds(new Set());
    setSelectedRow(null);
  }, [filters]);

  const handleReset = useCallback(() => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setSelectedIds(new Set());
    setSelectedRow(null);
  }, []);

  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleRowSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const handleSelectAll = () => {
    selectedIds.size === sortedList.length
      ? setSelectedIds(new Set())
      : setSelectedIds(new Set(sortedList.map(i => i.id)));
  };

  const handleRowClick = (item: SeaBooking) => {
    setSelectedRow(item);
  };

  const handleRowDoubleClick = (item: SeaBooking) => {
    // 상세조회 화면으로 이동
    router.push(`/logis/booking/sea/${item.id}`);
  };

  // 신규 등록
  const handleNew = () => {
    router.push('/logis/booking/sea/register');
  };

  // 수정
  const handleEdit = () => {
    if (selectedIds.size !== 1) {
      alert('수정할 항목을 1개 선택해주세요.');
      return;
    }
    const id = Array.from(selectedIds)[0];
    router.push(`/logis/booking/sea/register?id=${id}`);
  };

  // 삭제
  const handleDelete = () => {
    if (selectedIds.size === 0) {
      alert('삭제할 항목을 선택해주세요.');
      return;
    }
    // 부킹확정 상태 체크
    const confirmed = allData.filter(d => selectedIds.has(d.id) && d.bookingStatus === 'CONFIRM');
    if (confirmed.length > 0) {
      alert('부킹확정 상태의 항목은 부킹취소 후 삭제할 수 있습니다.');
      return;
    }
    if (confirm(`${selectedIds.size}건을 삭제하시겠습니까?`)) {
      setAllData(prev => prev.filter(d => !selectedIds.has(d.id)));
      setSelectedIds(new Set());
      setSelectedRow(null);
    }
  };

  // 부킹확정/취소
  const handleBookingConfirm = () => {
    if (selectedIds.size === 0) {
      alert('부킹확정/취소할 항목을 선택해주세요.');
      return;
    }
    const items = allData.filter(d => selectedIds.has(d.id));
    const hasRequest = items.some(d => d.bookingStatus === 'REQUEST');
    const hasConfirm = items.some(d => d.bookingStatus === 'CONFIRM');

    if (hasRequest && hasConfirm) {
      alert('부킹요청 또는 부킹확정 상태의 항목만 선택해주세요.');
      return;
    }

    const newStatus = hasRequest ? 'CONFIRM' : 'REQUEST';
    const message = hasRequest ? '부킹확정' : '부킹취소';

    if (confirm(`${selectedIds.size}건을 ${message} 하시겠습니까?`)) {
      setAllData(prev => prev.map(d =>
        selectedIds.has(d.id)
          ? { ...d, bookingStatus: newStatus, confirmCustomer: newStatus === 'CONFIRM' ? '확정업체' : undefined }
          : d
      ));
      alert(`${message} 처리되었습니다.`);
    }
  };

  // 부킹요청
  const handleBookingRequest = () => {
    if (selectedIds.size === 0) {
      alert('부킹요청할 항목을 선택해주세요.');
      return;
    }
    const items = allData.filter(d => selectedIds.has(d.id) && d.bookingStatus === 'DRAFT');
    if (items.length === 0) {
      alert('작성중 상태의 항목만 부킹요청할 수 있습니다.');
      return;
    }
    if (confirm(`${items.length}건을 부킹요청 하시겠습니까?`)) {
      setAllData(prev => prev.map(d =>
        selectedIds.has(d.id) && d.bookingStatus === 'DRAFT'
          ? { ...d, bookingStatus: 'REQUEST', transmitDate: new Date().toISOString() }
          : d
      ));
      alert('부킹요청 처리되었습니다.');
    }
  };

  // 출력
  const handlePrint = () => {
    if (selectedIds.size === 0) {
      setShowSelectionAlert(true);
      return;
    }
    setShowPrintModal(true);
  };

  // Excel
  const handleExcel = () => {
    alert(`Excel 다운로드: ${selectedIds.size || filteredList.length}건`);
  };

  // E-mail
  const handleEmail = () => {
    if (selectedIds.size === 0) {
      alert('이메일 발송할 항목을 선택해주세요.');
      return;
    }
    setShowEmailModal(true);
  };

  return (
    <PageLayout
      title="선적부킹관리 조회 (해상)"
      subtitle="HOME > 견적/부킹의뢰 > 견적/부킹관리(수출) > 선적부킹관리(해상)"
      showCloseButton={false}
    >
        <main className="p-6">
          {/* 상단 버튼 영역 - 화면설계서 기준 */}
          <div className="flex justify-end items-center mb-4">
            <div className="flex gap-2">
              <button onClick={handleNew} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)] font-medium">
                신규
              </button>
              <button onClick={handleEdit} className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                수정
              </button>
              <button onClick={handleDelete} className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] text-red-400">
                삭제
              </button>
              <button onClick={handlePrint} className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                출력
              </button>
              <button onClick={handleEmail} className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                E-mail
              </button>
              <button onClick={handleExcel} className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                Excel
              </button>
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
                {/* 일자 */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">
                    일자 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={e => handleFilterChange('startDate', e.target.value)}
                      className="w-[130px] h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                    />
                    <span className="text-[var(--muted)]">~</span>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={e => handleFilterChange('endDate', e.target.value)}
                      className="w-[130px] h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                    />
                    <DateRangeButtons onRangeSelect={handleDateRangeSelect} />
                  </div>
                </div>
                {/* Booking 상태 */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Booking 상태</label>
                  <select
                    value={filters.bookingStatus}
                    onChange={e => handleFilterChange('bookingStatus', e.target.value)}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                  >
                    <option value="">전체</option>
                    <option value="DRAFT">작성중</option>
                    <option value="REQUEST">부킹요청</option>
                    <option value="CONFIRM">부킹확정</option>
                    <option value="CANCEL">부킹취소</option>
                  </select>
                </div>
                {/* 선사부킹번호 */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">선사부킹번호</label>
                  <input
                    type="text"
                    value={filters.carrierBookingNo}
                    onChange={e => handleFilterChange('carrierBookingNo', e.target.value)}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                    placeholder="선사부킹번호"
                  />
                </div>
                {/* 선적지 */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">선적지</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={filters.pol}
                      onChange={e => handleFilterChange('pol', e.target.value)}
                      className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                      placeholder="KRPUS"
                    />
                    <SearchIconButton onClick={() => setShowPolModal(true)} />
                  </div>
                </div>
                {/* 양하항 */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">양하항</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={filters.pod}
                      onChange={e => handleFilterChange('pod', e.target.value)}
                      className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                      placeholder="USLAX"
                    />
                    <SearchIconButton onClick={() => setShowPodModal(true)} />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-[var(--border)] flex justify-center gap-2">
              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] font-medium"
              >
                조회
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
              >
                초기화
              </button>
            </div>
          </div>

          {/* 목록 테이블 - 화면설계서 기준 */}
          <div className="card mb-6">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h3 className="font-bold">부킹목록</h3>
                <span className="px-2 py-1 bg-[#E8A838]/20 text-[#E8A838] rounded text-sm font-medium">
                  {filteredList.length}건
                </span>
              </div>
              <div className="flex items-center gap-2">
                {selectedIds.size > 0 && (
                  <button onClick={() => setSelectedIds(new Set())} className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
                    선택 해제 ({selectedIds.size}건)
                  </button>
                )}
                <button
                  onClick={handleBookingConfirm}
                  className="px-3 py-1.5 bg-[#059669] text-white rounded-lg hover:bg-[#047857] text-sm font-medium"
                >
                  부킹확정/취소
                </button>
                <button
                  onClick={handleBookingRequest}
                  className="px-3 py-1.5 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] text-sm font-medium"
                >
                  부킹요청
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-12 text-center">
                      <input
                        type="checkbox"
                        checked={sortedList.length > 0 && selectedIds.size === sortedList.length}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="p-3 text-center text-sm font-semibold">No</th>
                    <SortableHeader columnKey="bookingStatus" label="Booking 상태" className="text-center font-semibold" />
                    <SortableHeader columnKey="bookingNo" label="Booking No." className="text-center font-semibold" />
                    <SortableHeader columnKey="bookingRequestDate" label="부킹요청일자" className="text-center font-semibold" />
                    <SortableHeader columnKey="pol" label="선적항" className="text-center font-semibold" />
                    <SortableHeader columnKey="pod" label="양하항" className="text-center font-semibold" />
                    <SortableHeader columnKey="vesselVoyage" label="선명/항차" className="text-center font-semibold" />
                    <SortableHeader columnKey="customerName" label="거래처명" className="text-center font-semibold" />
                    <SortableHeader columnKey="commodity" label="Commodity" className="text-center font-semibold" />
                    <SortableHeader columnKey="grossWeight" label="G.Weight" className="text-center font-semibold" />
                    <SortableHeader columnKey="measurement" label="Measure" className="text-center font-semibold" />
                    <SortableHeader columnKey="specialHandlingCode" label="Special Handing" className="text-center font-semibold" />
                  </tr>
                </thead>
                <tbody>
                  {sortedList.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="p-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <svg className="w-12 h-12 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-[var(--muted)]">조회된 데이터가 없습니다.</p>
                        </div>
                      </td>
                    </tr>
                  ) : sortedList.map((row, index) => (
                    <tr
                      key={row.id}
                      className={`border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer transition-colors ${selectedIds.has(row.id) ? 'bg-blue-500/10' : ''} ${selectedRow?.id === row.id ? 'bg-[#E8A838]/10' : ''}`}
                      onClick={() => handleRowClick(row)}
                      onDoubleClick={() => handleRowDoubleClick(row)}
                    >
                      <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.id)}
                          onChange={() => handleRowSelect(row.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="p-3 text-center text-sm">{index + 1}</td>
                      <td className="p-3 text-center">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{ color: getStatusConfig(row.bookingStatus).color, backgroundColor: getStatusConfig(row.bookingStatus).bgColor }}
                        >
                          {getStatusConfig(row.bookingStatus).label}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-[#E8A838] font-medium hover:underline">{row.bookingNo}</span>
                      </td>
                      <td className="p-3 text-center text-sm text-[var(--muted)]">{row.bookingRequestDate}</td>
                      <td className="p-3 text-center text-sm font-medium">{portNames[row.pol] || row.pol}</td>
                      <td className="p-3 text-center text-sm font-medium">{portNames[row.pod] || row.pod}</td>
                      <td className="p-3 text-center text-sm">{row.vesselVoyage}</td>
                      <td className="p-3 text-center text-sm font-medium">{row.customerName}</td>
                      <td className="p-3 text-center text-sm">{row.commodity}</td>
                      <td className="p-3 text-center text-sm">{row.grossWeight.toLocaleString()}</td>
                      <td className="p-3 text-center text-sm">{row.measurement}</td>
                      <td className="p-3 text-center text-sm">
                        {row.specialHandlingCode && (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">{row.specialHandlingCode}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 전송정보 영역 - 화면설계서 기준 */}
          {selectedRow && (
            <div className="card">
              <div className="p-4 border-b border-[var(--border)]">
                <h3 className="font-bold">전송정보</h3>
              </div>
              <div className="p-4">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="text-center">전송일시</th>
                      <th className="text-center">수신일시</th>
                      <th className="text-center">부킹요청거래처</th>
                      <th className="text-center">부킹확정거래처</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-[var(--border)]">
                      <td className="p-3 text-center text-sm">{selectedRow.transmitDate || '-'}</td>
                      <td className="p-3 text-center text-sm">{selectedRow.receiveDate || '-'}</td>
                      <td className="p-3 text-center text-sm">{selectedRow.requestCustomer || '-'}</td>
                      <td className="p-3 text-center text-sm">{selectedRow.confirmCustomer || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>

      <CloseConfirmModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onConfirm={handleConfirmClose}
      />

      <ReportPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        reportType="BOOKING_CONFIRM"
        data={allData.filter(d => selectedIds.has(d.id)) as unknown as Record<string, unknown>[]}
      />

      <SelectionAlertModal
        isOpen={showSelectionAlert}
        onClose={() => setShowSelectionAlert(false)}
        title="출력 안내"
        message="목록에서 출력할 데이터를 선택해주세요."
      />

      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSend={(data) => {
          console.log('Email sent:', data);
          alert('이메일이 발송되었습니다.');
          setShowEmailModal(false);
        }}
        documentType="booking"
        documentNo={selectedRow?.bookingNo || ''}
      />

      <CodeSearchModal
        isOpen={showPolModal}
        onClose={() => setShowPolModal(false)}
        onSelect={handlePolSelect}
        codeType="seaport"
        title="선적지 검색"
      />
      <CodeSearchModal
        isOpen={showPodModal}
        onClose={() => setShowPodModal(false)}
        onSelect={handlePodSelect}
        codeType="seaport"
        title="양하항 검색"
      />
    </PageLayout>
  );
}
