'use client';

import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LIST_PATHS } from '@/constants/paths';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import EmailModal from '@/components/EmailModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import DateRangeButtons, { getToday } from '@/components/DateRangeButtons';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import ExcelButtons from '@/components/ExcelButtons';
import { ReportPrintModal } from '@/components/reports';
import SelectionAlertModal from '@/components/SelectionAlertModal';
import { formatCurrency } from '@/utils/format';

// 견적 데이터 타입
interface QuoteData {
  id: string;
  quoteNo: string;
  quoteDate: string;
  requestNo: string;
  shipper: string;
  consignee: string;
  pol: string;
  pod: string;
  containerType: string;
  containerQty: number;
  commodity?: string;
  validFrom: string;
  validTo: string;
  totalAmount: number;
  currency: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'expired';
  carrier: string;
}

interface SearchFilters {
  dateFrom: string;
  dateTo: string;
  quoteNo: string;
  requestNo: string;
  status: string;
  shipper: string;
  pol: string;
  pod: string;
  carrier: string;
}

interface SortConfig {
  key: keyof QuoteData | null;
  direction: 'asc' | 'desc';
}

const columnLabels: Record<string, string> = {
  quoteNo: '견적번호',
  quoteDate: '견적일자',
  shipper: '화주',
  pol: 'POL',
  pod: 'POD',
  containerQty: '컨테이너',
  carrier: '선사',
  validFrom: '유효기간',
  totalAmount: '견적금액',
  status: '상태',
};

// Excel 내보내기용 컬럼 정의
const excelColumns: { key: keyof QuoteData; label: string }[] = [
  { key: 'quoteNo', label: '견적번호' },
  { key: 'quoteDate', label: '견적일자' },
  { key: 'shipper', label: '화주' },
  { key: 'consignee', label: '수하인' },
  { key: 'pol', label: 'POL' },
  { key: 'pod', label: 'POD' },
  { key: 'containerType', label: '컨테이너타입' },
  { key: 'containerQty', label: '수량' },
  { key: 'carrier', label: '선사' },
  { key: 'validFrom', label: '유효기간시작' },
  { key: 'validTo', label: '유효기간종료' },
  { key: 'totalAmount', label: '견적금액' },
  { key: 'currency', label: '통화' },
  { key: 'status', label: '상태' },
];

const SortIcon = ({ columnKey, sortConfig }: { columnKey: keyof QuoteData; sortConfig: SortConfig }) => {
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
  submitted: { label: '제출', color: '#2563EB', bgColor: '#DBEAFE' },
  approved: { label: '승인', color: '#059669', bgColor: '#D1FAE5' },
  rejected: { label: '반려', color: '#DC2626', bgColor: '#FEE2E2' },
  expired: { label: '만료', color: '#9CA3AF', bgColor: '#F3F4F6' },
  pending: { label: '대기', color: '#F59E0B', bgColor: '#FEF3C7' },
  // 대문자 상태값 (DB 호환)
  DRAFT: { label: '작성중', color: '#6B7280', bgColor: '#F3F4F6' },
  SUBMITTED: { label: '제출', color: '#2563EB', bgColor: '#DBEAFE' },
  APPROVED: { label: '승인', color: '#059669', bgColor: '#D1FAE5' },
  REJECTED: { label: '반려', color: '#DC2626', bgColor: '#FEE2E2' },
  EXPIRED: { label: '만료', color: '#9CA3AF', bgColor: '#F3F4F6' },
  PENDING: { label: '대기', color: '#F59E0B', bgColor: '#FEF3C7' },
};

// 안전한 상태 조회 함수
const getStatusConfig = (status: string) => {
  return statusConfig[status] || { label: status || '미정', color: '#6B7280', bgColor: '#F3F4F6' };
};

// 오늘 날짜 기본값 설정
const getInitialFilters = (): SearchFilters => {
  const today = getToday();
  return {
    dateFrom: today,
    dateTo: today,
    quoteNo: '',
    requestNo: '',
    status: '',
    shipper: '',
    pol: '',
    pod: '',
    carrier: '',
  };
};
const initialFilters: SearchFilters = getInitialFilters();

// 샘플 데이터
const sampleData: QuoteData[] = [
  { id: '1', quoteNo: 'SQ-2026-0001', quoteDate: '2026-01-28', requestNo: 'RQ-2026-0001', shipper: '삼성전자', consignee: '삼성아메리카', pol: 'KRPUS', pod: 'USLAX', containerType: '40HC', containerQty: 2, commodity: '전자제품', validFrom: '2026-01-28', validTo: '2026-02-28', totalAmount: 4500, currency: 'USD', status: 'approved', carrier: 'HMM' },
  { id: '2', quoteNo: 'SQ-2026-0002', quoteDate: '2026-01-27', requestNo: 'RQ-2026-0002', shipper: 'LG전자', consignee: 'LG Electronics USA', pol: 'KRPUS', pod: 'USNYC', containerType: '40HC', containerQty: 3, commodity: '가전제품', validFrom: '2026-01-27', validTo: '2026-02-27', totalAmount: 6800, currency: 'USD', status: 'submitted', carrier: 'MAERSK' },
  { id: '3', quoteNo: 'SQ-2026-0003', quoteDate: '2026-01-26', requestNo: 'RQ-2026-0003', shipper: '현대자동차', consignee: 'Hyundai Motor Europe', pol: 'KRPUS', pod: 'DEHAM', containerType: '40GP', containerQty: 5, commodity: '자동차부품', validFrom: '2026-01-26', validTo: '2026-02-26', totalAmount: 9500, currency: 'USD', status: 'approved', carrier: 'MSC' },
  { id: '4', quoteNo: 'SQ-2026-0004', quoteDate: '2026-01-25', requestNo: 'RQ-2026-0004', shipper: 'SK하이닉스', consignee: 'SK Hynix America', pol: 'KRPUS', pod: 'USLAX', containerType: '20GP', containerQty: 1, commodity: '반도체', validFrom: '2026-01-25', validTo: '2026-02-25', totalAmount: 2200, currency: 'USD', status: 'draft', carrier: 'ONE' },
  { id: '5', quoteNo: 'SQ-2026-0005', quoteDate: '2026-01-24', requestNo: 'RQ-2026-0005', shipper: '포스코', consignee: 'POSCO America', pol: 'KRPUS', pod: 'USNYC', containerType: '40HC', containerQty: 10, commodity: '철강제품', validFrom: '2026-01-24', validTo: '2026-02-24', totalAmount: 22000, currency: 'USD', status: 'expired', carrier: 'HMM' },
];

export default function QuoteSeaPage() {
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });
  const [allData, setAllData] = useState<QuoteData[]>([]);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [loading, setLoading] = useState(true);

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
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTarget, setEmailTarget] = useState<QuoteData[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printData, setPrintData] = useState<QuoteData[]>([]);
  const [showSelectionAlert, setShowSelectionAlert] = useState(false);

  // DB API에서 데이터 로드
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/quote/sea');
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      if (data && data.length > 0) {
        setAllData(data);
      } else {
        setAllData(sampleData);
      }
    } catch (error) {
      console.error('데이터 조회 실패:', error);
      setAllData(sampleData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 필터링된 데이터
  const filteredList = useMemo(() => {
    return allData.filter(item => {
      if (appliedFilters.quoteNo && !item.quoteNo.toLowerCase().includes(appliedFilters.quoteNo.toLowerCase())) return false;
      if (appliedFilters.shipper && !item.shipper.toLowerCase().includes(appliedFilters.shipper.toLowerCase())) return false;
      if (appliedFilters.pol && !item.pol.toLowerCase().includes(appliedFilters.pol.toLowerCase())) return false;
      if (appliedFilters.pod && !item.pod.toLowerCase().includes(appliedFilters.pod.toLowerCase())) return false;
      if (appliedFilters.carrier && item.carrier !== appliedFilters.carrier) return false;
      if (appliedFilters.status && item.status !== appliedFilters.status) return false;
      if (appliedFilters.dateFrom && item.quoteDate < appliedFilters.dateFrom) return false;
      if (appliedFilters.dateTo && item.quoteDate > appliedFilters.dateTo) return false;
      return true;
    });
  }, [allData, appliedFilters]);

  // 정렬된 데이터
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

  // 현황 집계
  const summary = useMemo(() => ({
    total: filteredList.length,
    draft: filteredList.filter(q => q.status === 'draft').length,
    submitted: filteredList.filter(q => q.status === 'submitted').length,
    approved: filteredList.filter(q => q.status === 'approved').length,
    rejected: filteredList.filter(q => q.status === 'rejected').length,
    totalAmount: filteredList.reduce((sum, q) => sum + q.totalAmount, 0),
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

  const handleSort = (key: keyof QuoteData) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const SortableHeader = ({ columnKey, label, className = '' }: { columnKey: keyof QuoteData; label: string; className?: string }) => (
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

  const handleRegister = () => {
    router.push('/logis/quote/sea/register');
  };

  // 수정
  const handleEdit = () => {
    if (selectedIds.size === 0) {
      alert('수정할 항목을 선택해주세요.');
      return;
    }
    if (selectedIds.size > 1) {
      alert('수정은 1건만 선택해주세요.');
      return;
    }
    const selectedId = Array.from(selectedIds)[0];
    router.push(`/logis/quote/sea/register?quoteId=${selectedId}`);
  };

  // 삭제 버튼 클릭
  const handleDeleteClick = () => {
    if (selectedIds.size === 0) {
      alert('삭제할 항목을 선택해주세요.');
      return;
    }
    setShowDeleteModal(true);
  };

  // 삭제 확인
  const handleDeleteConfirm = async () => {
    const deleteCount = selectedIds.size;
    const idsArray = Array.from(selectedIds);

    try {
      // DB API로 삭제
      const response = await fetch(`/api/quote/sea?ids=${idsArray.join(',')}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      // 화면에서 데이터 제거
      setAllData(prev => prev.filter(item => !selectedIds.has(item.id)));
      setSelectedIds(new Set());
      setSearchMessage(`${deleteCount}건의 견적이 삭제되었습니다.`);
      setTimeout(() => setSearchMessage(''), 3000);
    } catch (error) {
      console.error('삭제 실패:', error);
      setSearchMessage('삭제에 실패했습니다. 잠시 후 다시 시도해주세요.');
      setTimeout(() => setSearchMessage(''), 3000);
    }
  };

  // E-mail 발송
  const handleEmail = () => {
    if (selectedIds.size === 0) {
      alert('E-mail을 발송할 항목을 선택해주세요.');
      return;
    }
    const targets = allData.filter(item => selectedIds.has(item.id));
    setEmailTarget(targets);
    setShowEmailModal(true);
  };

  // 이메일 발송 처리
  const handleEmailSend = (emailData: any) => {
    console.log('이메일 발송:', emailData);
    console.log('대상 견적:', emailTarget.map(t => t.quoteNo));
    alert(`${emailTarget.length}건의 견적서가 이메일로 발송되었습니다.\n받는 사람: ${emailData.to.join(', ')}`);
    setSelectedIds(new Set());
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

  return (
        <PageLayout title="견적관리 (해상)" subtitle="물류견적관리  견적관리 (해상)" showCloseButton={false} >

        <main ref={formRef} className="p-6">
          {/* 상단 버튼 */}
          <div className="flex justify-end items-center mb-6">
            <div className="flex gap-2">
              {/* 신규 버튼 */}
              <button onClick={handleRegister} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)] transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                신규
              </button>
              {/* 수정 버튼 */}
              <button onClick={handleEdit} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)] transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                수정
              </button>
              {/* 삭제 버튼 */}
              <button onClick={handleDeleteClick} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)] transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                삭제
              </button>
              {/* E-mail 버튼 */}
              <button onClick={handleEmail} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)] transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                E-mail
              </button>
              {/* 출력 버튼 */}
              <button
                onClick={handlePrint}
                disabled={selectedIds.size === 0}
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
              {/* 초기화 버튼 */}
              <button onClick={handleReset} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)] transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                초기화
              </button>
              {/* Excel 다운로드/업로드 버튼 */}
              <ExcelButtons
                data={selectedIds.size > 0 ? sortedList.filter(item => selectedIds.has(item.id)) : sortedList}
                columns={excelColumns}
                filename="해상견적"
              />
            </div>
          </div>

          {/* 검색 알림 메시지 */}
          {searchMessage && (
            <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded-lg">
              {searchMessage}
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
                {/* 견적일자 */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">견적일자</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                      className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                    />
                    <span className="text-[var(--muted)]">~</span>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                      className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                    />
                    <DateRangeButtons onRangeSelect={(start, end) => { handleFilterChange('dateFrom', start); handleFilterChange('dateTo', end); }} />
                  </div>
                </div>
                {/* 견적번호 */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">견적번호</label>
                  <input
                    type="text"
                    value={filters.quoteNo}
                    onChange={(e) => handleFilterChange('quoteNo', e.target.value)}
                    placeholder="SQ-YYYY-XXXX"
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                  />
                </div>
                {/* 상태 */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">상태</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                  >
                    <option value="">전체</option>
                    <option value="draft">작성중</option>
                    <option value="submitted">제출</option>
                    <option value="approved">승인</option>
                    <option value="rejected">반려</option>
                    <option value="expired">만료</option>
                  </select>
                </div>
                {/* 화주 */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">화주</label>
                  <input
                    type="text"
                    value={filters.shipper}
                    onChange={(e) => handleFilterChange('shipper', e.target.value)}
                    placeholder="화주명"
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                  />
                </div>
                {/* 선적항 (POL) */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">선적항 (POL)</label>
                  <input
                    type="text"
                    value={filters.pol}
                    onChange={(e) => handleFilterChange('pol', e.target.value)}
                    placeholder="항구명/코드"
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                  />
                </div>
                {/* 양하항 (POD) */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">양하항 (POD)</label>
                  <input
                    type="text"
                    value={filters.pod}
                    onChange={(e) => handleFilterChange('pod', e.target.value)}
                    placeholder="항구명/코드"
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                  />
                </div>
                {/* 선사 */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">선사</label>
                  <select
                    value={filters.carrier}
                    onChange={(e) => handleFilterChange('carrier', e.target.value)}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                  >
                    <option value="">전체</option>
                    <option value="MAERSK">MAERSK</option>
                    <option value="MSC">MSC</option>
                    <option value="HMM">HMM</option>
                    <option value="EVERGREEN">EVERGREEN</option>
                    <option value="COSCO">COSCO</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-[var(--border)] flex justify-center gap-2">
              <button onClick={handleSearch} className="px-6 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] font-medium">
                조회
              </button>
              <button onClick={handleReset} className="px-6 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                초기화
              </button>
            </div>
          </div>

          {/* 현황 카드 */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { setFilters(prev => ({ ...prev, status: '' })); setAppliedFilters(prev => ({ ...prev, status: '' })); }}>
              <p className="text-2xl font-bold">{summary.total}</p>
              <p className="text-sm text-[var(--muted)]">전체</p>
            </div>
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { setFilters(prev => ({ ...prev, status: 'draft' })); setAppliedFilters(prev => ({ ...prev, status: 'draft' })); }}>
              <p className="text-2xl font-bold text-[#6B7280]">{summary.draft}</p>
              <p className="text-sm text-[var(--muted)]">작성중</p>
            </div>
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { setFilters(prev => ({ ...prev, status: 'submitted' })); setAppliedFilters(prev => ({ ...prev, status: 'submitted' })); }}>
              <p className="text-2xl font-bold text-[#2563EB]">{summary.submitted}</p>
              <p className="text-sm text-[var(--muted)]">제출</p>
            </div>
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { setFilters(prev => ({ ...prev, status: 'approved' })); setAppliedFilters(prev => ({ ...prev, status: 'approved' })); }}>
              <p className="text-2xl font-bold text-[#059669]">{summary.approved}</p>
              <p className="text-sm text-[var(--muted)]">승인</p>
            </div>
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { setFilters(prev => ({ ...prev, status: 'rejected' })); setAppliedFilters(prev => ({ ...prev, status: 'rejected' })); }}>
              <p className="text-2xl font-bold text-[#DC2626]">{summary.rejected}</p>
              <p className="text-sm text-[var(--muted)]">반려</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-[#E8A838]">{formatCurrency(summary.totalAmount, 'USD')}</p>
              <p className="text-sm text-[var(--muted)]">총 견적금액</p>
            </div>
          </div>

          {/* 조회 결과 */}
          <div className="card">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[var(--foreground)]">견적목록 ({sortedList.length}건){getSortStatusText()}</h3>
              {selectedIds.size > 0 && (
                <span className="text-sm text-blue-600">{selectedIds.size}건 선택됨</span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-10 text-center">
                      <input
                        type="checkbox"
                        checked={sortedList.length > 0 && selectedIds.size === sortedList.length}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <SortableHeader columnKey="quoteNo" label="견적번호" className="text-center font-medium" />
                    <SortableHeader columnKey="quoteDate" label="견적일자" className="text-center font-medium" />
                    <SortableHeader columnKey="shipper" label="화주" className="text-center font-medium" />
                    <SortableHeader columnKey="pol" label="POL" className="text-center font-medium" />
                    <SortableHeader columnKey="pod" label="POD" className="text-center font-medium" />
                    <SortableHeader columnKey="containerQty" label="컨테이너" className="text-center font-medium" />
                    <SortableHeader columnKey="carrier" label="선사" className="text-center font-medium" />
                    <SortableHeader columnKey="validFrom" label="유효기간" className="text-center font-medium" />
                    <SortableHeader columnKey="totalAmount" label="견적금액" className="text-center font-medium" />
                    <SortableHeader columnKey="status" label="상태" className="text-center font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-[var(--muted)]">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#E8A838]"></div>
                          데이터를 불러오는 중...
                        </div>
                      </td>
                    </tr>
                  ) : sortedList.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-[var(--muted)]">
                        조회된 데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    sortedList.map((row) => (
                      <tr
                        key={row.id}
                        className={`border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer transition-colors ${selectedIds.has(row.id) ? 'bg-blue-50' : ''}`}
                        onClick={() => handleRowSelect(row.id)}
                      >
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(row.id)}
                            onChange={() => handleRowSelect(row.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="p-3 text-center"><Link href={`/logis/quote/sea/${row.id}`} className="text-[#2563EB] hover:underline font-medium" onClick={(e) => e.stopPropagation()}>{row.quoteNo}</Link></td>
                        <td className="p-3 text-sm text-center">{row.quoteDate}</td>
                        <td className="p-3 text-sm text-center">{row.shipper}</td>
                        <td className="p-3 text-sm text-center">{row.pol}</td>
                        <td className="p-3 text-sm text-center">{row.pod}</td>
                        <td className="p-3 text-sm text-center">{row.containerQty} x {row.containerType}</td>
                        <td className="p-3 text-sm text-center font-medium">{row.carrier}</td>
                        <td className="p-3 text-sm text-center">{row.validFrom} ~ {row.validTo}</td>
                        <td className="p-3 text-sm text-center font-semibold">{formatCurrency(row.totalAmount, row.currency)}</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ color: getStatusConfig(row.status).color, backgroundColor: getStatusConfig(row.status).bgColor }}>
                            {getStatusConfig(row.status).label}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      {/* 이메일 모달 */}
      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSend={handleEmailSend}
        documentType="quote"
        documentNo={emailTarget.length > 0 ? emailTarget.map(t => t.quoteNo).join(', ') : ''}
        defaultSubject={emailTarget.length > 0 ? `[견적서] ${emailTarget.map(t => t.quoteNo).join(', ')} - 인터지스 물류` : ''}
      />

      {/* 삭제 확인 모달 */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="견적 삭제"
        itemCount={selectedIds.size}
      />

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
        reportType="QUOTE"
        data={printData as unknown as Record<string, unknown>[]}
      />

      {/* 선택 안내 모달 */}
      <SelectionAlertModal
        isOpen={showSelectionAlert}
        onClose={() => setShowSelectionAlert(false)}
        title="출력 안내"
        message="목록에서 출력할 데이터를 선택해주세요."
      />
    </PageLayout>
  );
}
