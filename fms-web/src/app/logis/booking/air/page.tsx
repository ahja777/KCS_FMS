'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LIST_PATHS } from '@/constants/paths';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import DateRangeButtons, { getToday } from '@/components/DateRangeButtons';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import ExcelButtons from '@/components/ExcelButtons';
import { ReportPrintModal } from '@/components/reports';
import SelectionAlertModal from '@/components/SelectionAlertModal';
import SearchIconButton from '@/components/SearchIconButton';
import CodeSearchModal, { CodeItem } from '@/components/popup/CodeSearchModal';

interface AirBooking {
  id: string;
  bookingNo: string;
  bookingDate: string;
  shipper: string;
  consignee: string;
  airline: string;
  flightNo: string;
  origin: string;
  destination: string;
  etd: string;
  eta: string;
  pieces: number;
  weight: number;
  volume: number;
  commodity: string;
  status: 'draft' | 'requested' | 'confirmed' | 'rejected' | 'cancelled';
}

interface SearchFilters {
  startDate: string;
  endDate: string;
  bookingNo: string;
  shipper: string;
  airline: string;
  origin: string;
  destination: string;
  status: string;
}

interface SortConfig {
  key: keyof AirBooking | null;
  direction: 'asc' | 'desc';
}

const columnLabels: Record<string, string> = {
  bookingNo: '예약번호',
  bookingDate: '예약일자',
  shipper: '화주',
  airline: '항공사',
  flightNo: '편명',
  origin: '출발',
  destination: '도착',
  etd: 'ETD',
  pieces: 'PCS',
  weight: '중량',
  status: '상태',
};

const SortIcon = ({ columnKey, sortConfig }: { columnKey: keyof AirBooking; sortConfig: SortConfig }) => {
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

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  // 소문자 상태값
  draft: { label: '작성중', color: '#6B7280', bgColor: '#F3F4F6' },
  requested: { label: '요청', color: '#2563EB', bgColor: '#DBEAFE' },
  confirmed: { label: '예약확정', color: '#059669', bgColor: '#D1FAE5' },
  rejected: { label: '거절', color: '#DC2626', bgColor: '#FEE2E2' },
  cancelled: { label: '취소', color: '#9CA3AF', bgColor: '#F3F4F6' },
  pending: { label: '대기', color: '#F59E0B', bgColor: '#FEF3C7' },
  // 대문자 상태값 (DB 호환)
  DRAFT: { label: '작성중', color: '#6B7280', bgColor: '#F3F4F6' },
  REQUESTED: { label: '요청', color: '#2563EB', bgColor: '#DBEAFE' },
  CONFIRMED: { label: '예약확정', color: '#059669', bgColor: '#D1FAE5' },
  REJECTED: { label: '거절', color: '#DC2626', bgColor: '#FEE2E2' },
  CANCELLED: { label: '취소', color: '#9CA3AF', bgColor: '#F3F4F6' },
  PENDING: { label: '대기', color: '#F59E0B', bgColor: '#FEF3C7' },
};

// 안전한 상태 조회 함수
const getStatusConfig = (status: string) => {
  return statusConfig[status] || { label: status || '미정', color: '#6B7280', bgColor: '#F3F4F6' };
};

const sampleData: AirBooking[] = [
  { id: '1', bookingNo: 'AB-2026-0001', bookingDate: '2026-01-22', shipper: '삼성전자', consignee: 'Samsung America', airline: 'KOREAN AIR', flightNo: 'KE081', origin: 'ICN (인천)', destination: 'JFK (뉴욕)', etd: '2026-01-25', eta: '2026-01-25', pieces: 50, weight: 500, volume: 3.5, commodity: '반도체', status: 'confirmed' },
  { id: '2', bookingNo: 'AB-2026-0002', bookingDate: '2026-01-22', shipper: 'SK하이닉스', consignee: 'SK Hynix America', airline: 'ASIANA', flightNo: 'OZ212', origin: 'ICN (인천)', destination: 'SFO (샌프란시스코)', etd: '2026-01-26', eta: '2026-01-26', pieces: 80, weight: 800, volume: 5.2, commodity: '메모리', status: 'requested' },
  { id: '3', bookingNo: 'AB-2026-0003', bookingDate: '2026-01-22', shipper: 'LG디스플레이', consignee: 'LG Display EU', airline: 'LUFTHANSA', flightNo: 'LH713', origin: 'ICN (인천)', destination: 'FRA (프랑크푸르트)', etd: '2026-01-27', eta: '2026-01-27', pieces: 35, weight: 350, volume: 2.8, commodity: '디스플레이', status: 'draft' },
  { id: '4', bookingNo: 'AB-2026-0004', bookingDate: '2026-01-22', shipper: '현대자동차', consignee: 'Hyundai EU', airline: 'EMIRATES', flightNo: 'EK327', origin: 'ICN (인천)', destination: 'DXB (두바이)', etd: '2026-01-28', eta: '2026-01-28', pieces: 60, weight: 620, volume: 4.5, commodity: '자동차 부품', status: 'rejected' },
  { id: '5', bookingNo: 'AB-2026-0005', bookingDate: '2026-01-22', shipper: '포스코', consignee: 'POSCO America', airline: 'KOREAN AIR', flightNo: 'KE017', origin: 'ICN (인천)', destination: 'LAX (로스앤젤레스)', etd: '2026-01-24', eta: '2026-01-24', pieces: 25, weight: 300, volume: 2.0, commodity: '철강 샘플', status: 'confirmed' },
  { id: '6', bookingNo: 'AB-2026-0006', bookingDate: '2026-01-22', shipper: '기아자동차', consignee: 'Kia Motors Europe', airline: 'ASIANA', flightNo: 'OZ541', origin: 'ICN (인천)', destination: 'CDG (파리)', etd: '2026-01-29', eta: '2026-01-29', pieces: 45, weight: 450, volume: 3.2, commodity: '자동차부품', status: 'confirmed' },
  { id: '7', bookingNo: 'AB-2026-0007', bookingDate: '2026-01-22', shipper: '한화솔루션', consignee: 'Hanwha USA', airline: 'KOREAN AIR', flightNo: 'KE017', origin: 'ICN (인천)', destination: 'LAX (로스앤젤레스)', etd: '2026-01-30', eta: '2026-01-30', pieces: 70, weight: 700, volume: 4.8, commodity: '화학제품', status: 'requested' },
  { id: '8', bookingNo: 'AB-2026-0008', bookingDate: '2026-01-22', shipper: '삼성SDI', consignee: 'Samsung SDI EU', airline: 'LUFTHANSA', flightNo: 'LH719', origin: 'ICN (인천)', destination: 'MUC (뮌헨)', etd: '2026-01-31', eta: '2026-01-31', pieces: 55, weight: 550, volume: 3.8, commodity: '배터리', status: 'draft' },
  { id: '9', bookingNo: 'AB-2026-0009', bookingDate: '2026-01-22', shipper: 'LG에너지솔루션', consignee: 'LG Energy America', airline: 'EMIRATES', flightNo: 'EK323', origin: 'ICN (인천)', destination: 'ORD (시카고)', etd: '2026-02-01', eta: '2026-02-01', pieces: 90, weight: 900, volume: 6.0, commodity: '배터리셀', status: 'confirmed' },
  { id: '10', bookingNo: 'AB-2026-0010', bookingDate: '2026-01-22', shipper: '현대모비스', consignee: 'Hyundai Mobis Japan', airline: 'KOREAN AIR', flightNo: 'KE701', origin: 'ICN (인천)', destination: 'HND (하네다)', etd: '2026-02-02', eta: '2026-02-02', pieces: 40, weight: 400, volume: 2.5, commodity: '자동차전장', status: 'requested' },
];

// Excel 내보내기용 컬럼 정의
const excelColumns: { key: keyof AirBooking; label: string }[] = [
  { key: 'bookingNo', label: '예약번호' },
  { key: 'bookingDate', label: '예약일자' },
  { key: 'shipper', label: '화주' },
  { key: 'consignee', label: '수하인' },
  { key: 'airline', label: '항공사' },
  { key: 'flightNo', label: '편명' },
  { key: 'origin', label: '출발' },
  { key: 'destination', label: '도착' },
  { key: 'etd', label: 'ETD' },
  { key: 'eta', label: 'ETA' },
  { key: 'pieces', label: 'PCS' },
  { key: 'weight', label: '중량(kg)' },
  { key: 'commodity', label: '품목' },
  { key: 'status', label: '상태' },
];

// 기본 필터 설정 (오늘 날짜로 초기화)
const today = getToday();
const getInitialFilters = (): SearchFilters => {
  return {
    startDate: today,
    endDate: today,
    bookingNo: '',
    shipper: '',
    airline: '',
    origin: '',
    destination: '',
    status: '',
  };
};
const initialFilters: SearchFilters = getInitialFilters();

export default function BookingAirPage() {
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });
  const [allData, setAllData] = useState<AirBooking[]>([]);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [loading, setLoading] = useState(true);

  // API에서 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/booking/air');
        if (response.ok) {
          const data = await response.json();
          // API 응답을 프론트엔드 형식으로 변환
          const formattedData: AirBooking[] = data.map((item: Record<string, unknown>) => ({
            id: String(item.id),
            bookingNo: item.bookingNo || '',
            bookingDate: item.flightDate?.toString().substring(0, 10) || '',
            shipper: item.carrierName || '',
            consignee: '',
            airline: item.carrierName || '',
            flightNo: item.flightNo || '',
            origin: item.origin || '',
            destination: item.destination || '',
            etd: item.etd?.toString().substring(0, 10) || '',
            eta: item.eta?.toString().substring(0, 10) || '',
            pieces: Number(item.pkgQty) || 0,
            weight: Number(item.grossWeight) || 0,
            volume: 0,
            commodity: '',
            status: String(item.status || 'draft').toLowerCase(),
          }));
          setAllData(formattedData);
        }
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 화면닫기 핸들러
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

  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(initialFilters);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchMessage, setSearchMessage] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printData, setPrintData] = useState<AirBooking[]>([]);
  const [showSelectionAlert, setShowSelectionAlert] = useState(false);
  const [showOriginModal, setShowOriginModal] = useState(false);
  const [showDestModal, setShowDestModal] = useState(false);

  // 공항코드 검색 팝업 선택 처리
  const handleOriginSelect = (item: CodeItem) => {
    setFilters(prev => ({ ...prev, origin: item.code }));
    setShowOriginModal(false);
  };

  const handleDestSelect = (item: CodeItem) => {
    setFilters(prev => ({ ...prev, destination: item.code }));
    setShowDestModal(false);
  };

  // 출력 버튼 클릭
  const handlePrint = () => {
    if (selectedIds.size === 0) {
      setShowSelectionAlert(true);
      return;
    }
    const targets = allData.filter(item => selectedIds.has(item.id));
    setPrintData(targets);
    setShowPrintModal(true);
  };

  // 부킹확정/취소 핸들러
  const handleBookingConfirm = () => {
    if (selectedIds.size === 0) {
      setShowSelectionAlert(true);
      return;
    }
    alert(`${selectedIds.size}건의 부킹을 확정/취소 처리합니다.`);
  };

  // 부킹요청 핸들러
  const handleBookingRequest = () => {
    if (selectedIds.size === 0) {
      setShowSelectionAlert(true);
      return;
    }
    alert(`${selectedIds.size}건의 부킹을 요청합니다.`);
  };

  const filteredList = useMemo(() => {
    return allData.filter(item => {
      if (appliedFilters.bookingNo && !item.bookingNo.toLowerCase().includes(appliedFilters.bookingNo.toLowerCase())) return false;
      if (appliedFilters.shipper && !item.shipper.toLowerCase().includes(appliedFilters.shipper.toLowerCase())) return false;
      if (appliedFilters.airline && item.airline !== appliedFilters.airline) return false;
      if (appliedFilters.origin && !item.origin.toLowerCase().includes(appliedFilters.origin.toLowerCase())) return false;
      if (appliedFilters.destination && !item.destination.toLowerCase().includes(appliedFilters.destination.toLowerCase())) return false;
      if (appliedFilters.status && item.status !== appliedFilters.status) return false;
      if (appliedFilters.startDate && item.bookingDate < appliedFilters.startDate) return false;
      if (appliedFilters.endDate && item.bookingDate > appliedFilters.endDate) return false;
      return true;
    });
  }, [allData, appliedFilters]);

  const sortedList = useMemo(() => {
    if (!sortConfig.key) return filteredList;
    return [...filteredList].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      let comparison = 0;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue), 'ko');
      }
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredList, sortConfig]);

  const summary = useMemo(() => ({
    total: filteredList.length,
    draft: filteredList.filter(b => b.status === 'draft').length,
    requested: filteredList.filter(b => b.status === 'requested').length,
    confirmed: filteredList.filter(b => b.status === 'confirmed').length,
    totalWeight: filteredList.reduce((sum, b) => sum + b.weight, 0),
  }), [filteredList]);

  const handleSearch = () => {
    setAppliedFilters({ ...filters });
    setSelectedIds(new Set());
    setSearchMessage(`검색 완료: ${filteredList.length}건이 조회되었습니다.`);
    setTimeout(() => setSearchMessage(''), 3000);
  };

  const handleReset = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setSelectedIds(new Set());
    setSortConfig({ key: null, direction: 'asc' });
    setSearchMessage('검색 조건이 초기화되었습니다.');
    setTimeout(() => setSearchMessage(''), 3000);
  };

  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleRowSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === sortedList.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(sortedList.map(item => item.id)));
  };

  const handleSort = (key: keyof AirBooking) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const SortableHeader = ({ columnKey, label, className = '' }: { columnKey: keyof AirBooking; label: string; className?: string }) => (
    <th
      className={`cursor-pointer select-none text-center ${className}`}
      onClick={() => handleSort(columnKey)}
    >
      <span className="inline-flex items-center justify-center">
        {label}
        <SortIcon columnKey={columnKey} sortConfig={sortConfig} />
      </span>
    </th>
  );

  const getSortStatusText = () => {
    if (!sortConfig.key) return '';
    const label = columnLabels[sortConfig.key] || sortConfig.key;
    const direction = sortConfig.direction === 'asc' ? '오름차순' : '내림차순';
    return ` | 정렬: ${label} ${direction}`;
  };

  return (
        <PageLayout title="선적부킹관리 (항공)" subtitle="견적/부킹관리  선적부킹관리 (항공)" showCloseButton={false} >
        <main ref={formRef} className="p-6">
          <div className="flex justify-end items-center mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/logis/booking/air/register')}
                className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)]"
              >
                예약등록
              </button>
              <button
                onClick={() => router.push('/logis/booking/air/multi-register')}
                className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]"
              >
                멀티예약
              </button>
              <button
                onClick={handlePrint}
                className={`px-4 py-2 font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                  selectedIds.size === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[var(--surface-100)] text-[var(--foreground)] hover:bg-[var(--surface-200)]'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                출력 ({selectedIds.size})
              </button>
              <ExcelButtons
                data={selectedIds.size > 0 ? sortedList.filter(item => selectedIds.has(item.id)) : sortedList}
                columns={excelColumns}
                filename="항공부킹"
              />
            </div>
          </div>

          {searchMessage && (
            <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded-lg">{searchMessage}</div>
          )}

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
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">
                    예약일자 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input type="date" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
                    <span className="text-[var(--muted)]">~</span>
                    <input type="date" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">예약번호</label>
                  <input type="text" value={filters.bookingNo} onChange={(e) => handleFilterChange('bookingNo', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" placeholder="AB-YYYY-XXXX" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">항공사</label>
                  <select value={filters.airline} onChange={(e) => handleFilterChange('airline', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm">
                    <option value="">전체</option>
                    <option value="KOREAN AIR">대한항공</option>
                    <option value="ASIANA">아시아나</option>
                    <option value="LUFTHANSA">루프트한자</option>
                    <option value="EMIRATES">에미레이트</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">출발공항</label>
                  <div className="flex items-center gap-1">
                    <input type="text" value={filters.origin} onChange={(e) => handleFilterChange('origin', e.target.value)} className="flex-1 min-w-0 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" placeholder="공항코드" />
                    <SearchIconButton onClick={() => setShowOriginModal(true)} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">도착공항</label>
                  <div className="flex items-center gap-1">
                    <input type="text" value={filters.destination} onChange={(e) => handleFilterChange('destination', e.target.value)} className="flex-1 min-w-0 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" placeholder="공항코드" />
                    <SearchIconButton onClick={() => setShowDestModal(true)} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">화주</label>
                  <input type="text" value={filters.shipper} onChange={(e) => handleFilterChange('shipper', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" placeholder="화주명" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">상태</label>
                  <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm">
                    <option value="">전체</option>
                    <option value="draft">작성중</option>
                    <option value="requested">요청</option>
                    <option value="confirmed">예약확정</option>
                    <option value="rejected">거절</option>
                    <option value="cancelled">취소</option>
                  </select>
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
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: '' })); setAppliedFilters(prev => ({ ...prev, status: '' })); }}>
              <p className="text-2xl font-bold">{summary.total}</p>
              <p className="text-sm text-[var(--muted)]">전체 예약</p>
            </div>
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'draft' })); setAppliedFilters(prev => ({ ...prev, status: 'draft' })); }}>
              <p className="text-2xl font-bold text-[#6B7280]">{summary.draft}</p>
              <p className="text-sm text-[var(--muted)]">작성중</p>
            </div>
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'requested' })); setAppliedFilters(prev => ({ ...prev, status: 'requested' })); }}>
              <p className="text-2xl font-bold text-[#2563EB]">{summary.requested}</p>
              <p className="text-sm text-[var(--muted)]">요청</p>
            </div>
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'confirmed' })); setAppliedFilters(prev => ({ ...prev, status: 'confirmed' })); }}>
              <p className="text-2xl font-bold text-[#059669]">{summary.confirmed}</p>
              <p className="text-sm text-[var(--muted)]">예약확정</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold">{summary.totalWeight.toLocaleString()} kg</p>
              <p className="text-sm text-[var(--muted)]">총 중량</p>
            </div>
          </div>

          <div className="card">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h3 className="font-bold">예약목록</h3>
                <span className="px-2 py-1 bg-[#E8A838]/20 text-[#E8A838] rounded text-sm font-medium">
                  {sortedList.length}건
                </span>
                {getSortStatusText() && <span className="text-sm text-[var(--muted)]">{getSortStatusText()}</span>}
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
                    <th className="w-10 text-center"><input type="checkbox" checked={sortedList.length > 0 && selectedIds.size === sortedList.length} onChange={handleSelectAll} /></th>
                    <SortableHeader columnKey="bookingNo" label="예약번호" className="text-center" />
                    <SortableHeader columnKey="bookingDate" label="예약일자" className="text-center" />
                    <SortableHeader columnKey="shipper" label="화주" className="text-center" />
                    <SortableHeader columnKey="airline" label="항공사" className="text-center" />
                    <SortableHeader columnKey="flightNo" label="편명" className="text-center" />
                    <SortableHeader columnKey="origin" label="출발" className="text-center" />
                    <SortableHeader columnKey="destination" label="도착" className="text-center" />
                    <SortableHeader columnKey="etd" label="ETD" className="text-center" />
                    <SortableHeader columnKey="pieces" label="PCS" className="text-center" />
                    <SortableHeader columnKey="weight" label="중량(kg)" className="text-center" />
                    <SortableHeader columnKey="status" label="상태" className="text-center" />
                  </tr>
                </thead>
                <tbody>
                  {sortedList.length === 0 ? (
                    <tr><td colSpan={12} className="p-8 text-center text-[var(--muted)]">조회된 데이터가 없습니다.</td></tr>
                  ) : (
                    sortedList.map((row) => (
                      <tr key={row.id} className={`border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer ${selectedIds.has(row.id) ? 'bg-blue-50' : ''}`} onClick={() => handleRowSelect(row.id)}>
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => handleRowSelect(row.id)} /></td>
                        <td className="p-3 text-center text-[#2563EB] font-medium">{row.bookingNo}</td>
                        <td className="p-3 text-sm text-center">{row.bookingDate}</td>
                        <td className="p-3 text-sm text-center">{row.shipper}</td>
                        <td className="p-3 text-sm text-center font-medium">{row.airline}</td>
                        <td className="p-3 text-sm text-center">{row.flightNo}</td>
                        <td className="p-3 text-sm text-center">{row.origin}</td>
                        <td className="p-3 text-sm text-center">{row.destination}</td>
                        <td className="p-3 text-sm text-center">{row.etd}</td>
                        <td className="p-3 text-sm text-center">{row.pieces}</td>
                        <td className="p-3 text-sm text-center">{row.weight.toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-1 rounded-full text-xs" style={{ color: getStatusConfig(row.status).color, backgroundColor: getStatusConfig(row.status).bgColor }}>{getStatusConfig(row.status).label}</span>
                        </td>
                      </tr>
                    ))
                  )}
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

      {/* 출력 모달 */}
      <ReportPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        reportType="BOOKING_CONFIRM"
        data={printData as unknown as Record<string, unknown>[]}
      />

      {/* 선택 안내 모달 */}
      <SelectionAlertModal
        isOpen={showSelectionAlert}
        onClose={() => setShowSelectionAlert(false)}
        title="출력 안내"
        message="목록에서 출력할 데이터를 선택해주세요."
      />

      {/* 출발공항 검색 모달 */}
      <CodeSearchModal
        isOpen={showOriginModal}
        onClose={() => setShowOriginModal(false)}
        onSelect={handleOriginSelect}
        codeType="airport"
        title="출발공항 조회"
      />

      {/* 도착공항 검색 모달 */}
      <CodeSearchModal
        isOpen={showDestModal}
        onClose={() => setShowDestModal(false)}
        onSelect={handleDestSelect}
        codeType="airport"
        title="도착공항 조회"
      />
    </PageLayout>
  );
}
