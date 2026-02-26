'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { LIST_PATHS } from '@/constants/paths';
import DateRangeButtons, { getToday } from '@/components/DateRangeButtons';
import CodeSearchModal, { CodeType, CodeItem } from '@/components/popup/CodeSearchModal';
import LocationCodeModal, { LocationItem } from '@/components/popup/LocationCodeModal';
import CarrierCodeModal, { CarrierItem } from '@/components/popup/CarrierCodeModal';
import SearchIconButton from '@/components/SearchIconButton';

// 검색 조건 인터페이스
interface SearchFilters {
  startDate: string;
  endDate: string;
  ioType: string;          // 수출입구분
  customerCd: string;      // 거래처 코드
  customerNm: string;      // 거래처명
  carrierCd: string;       // 선사 코드
  carrierNm: string;       // 선사명
  polCd: string;           // 출발항 코드
  polNm: string;           // 출발항명
  podCd: string;           // 도착항 코드
  podNm: string;           // 도착항명
}

// 운임상세 인터페이스 (첫 행 표시용)
interface RateDetailRow {
  FREIGHT_CD?: string;
  FREIGHT_TYPE?: string;
  RATE_MIN?: number;
  RATE_BL?: number;
  RATE_RTON?: number;
  CNTR_DRY_20?: number;
  CNTR_DRY_40?: number;
  RATE_BULK?: number;
}

// 목록 데이터 인터페이스
interface CorporateRateItem {
  RATE_ID: number;
  RATE_NO: string;
  TRANSPORT_MODE: string;
  IO_TYPE: string;
  CUSTOMER_CD: string;
  CUSTOMER_NM: string;
  CARRIER_CD: string;
  CARRIER_NM: string;
  POL_CD: string;
  POL_NM: string;
  POD_CD: string;
  POD_NM: string;
  CREATED_DATE: string;
  details?: RateDetailRow[];
}

// 정렬 설정 인터페이스
interface SortConfig {
  key: string | null;
  direction: 'asc' | 'desc';
}

// 정렬 아이콘 컴포넌트
const SortIcon = ({ columnKey, sortConfig }: { columnKey: string; sortConfig: SortConfig }) => {
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

const today = getToday();
const initialFilters: SearchFilters = {
  startDate: today,
  endDate: today,
  ioType: '',
  customerCd: '',
  customerNm: '',
  carrierCd: '',
  carrierNm: '',
  polCd: '',
  polNm: '',
  podCd: '',
  podNm: '',
};

export default function CorporateRateSeaPage() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const [data, setData] = useState<CorporateRateItem[]>([]);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(initialFilters);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });

  // 모달 상태
  const [showCodeSearchModal, setShowCodeSearchModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCarrierModal, setShowCarrierModal] = useState(false);
  const [locationTarget, setLocationTarget] = useState<'pol' | 'pod'>('pol');

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

  // 데이터 조회
  const fetchData = useCallback(async (searchFilters?: SearchFilters) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('transportMode', 'SEA');
      const f = searchFilters || initialFilters;
      if (f.ioType) params.set('ioType', f.ioType);
      if (f.customerCd) params.set('customerCd', f.customerCd);
      if (f.carrierCd) params.set('carrierCd', f.carrierCd);
      if (f.polCd) params.set('polCd', f.polCd);
      if (f.podCd) params.set('podCd', f.podCd);

      const qs = params.toString();
      const response = await fetch(`/api/logis/rate/corporate${qs ? `?${qs}` : ''}`);
      if (response.ok) {
        const result = await response.json();
        setData(Array.isArray(result) ? result : []);
      }
    } catch (error) {
      console.error('Failed to fetch corporate rates:', error);
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 날짜 범위 선택
  const handleDateRangeSelect = (startDate: string, endDate: string) => {
    setFilters(prev => ({ ...prev, startDate, endDate }));
  };

  // 검색
  const handleSearch = useCallback(() => {
    setSelectedIds(new Set());
    setAppliedFilters({ ...filters });
    fetchData(filters);
  }, [filters, fetchData]);

  // 초기화
  const handleReset = useCallback(() => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setSelectedIds(new Set());
    setSortConfig({ key: null, direction: 'asc' });
    fetchData(initialFilters);
  }, [fetchData]);

  // 필터 변경
  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Enter 키로 검색
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  }, [handleSearch]);

  // 거래처 모달 열기
  const openCustomerModal = () => {
    setShowCodeSearchModal(true);
  };
  const handleCustomerSelect = (item: CodeItem) => {
    setFilters(prev => ({ ...prev, customerCd: item.code, customerNm: item.name }));
    setShowCodeSearchModal(false);
  };

  // 선사 모달 열기
  const openCarrierModal = () => {
    setShowCarrierModal(true);
  };
  const handleCarrierSelect = (item: CarrierItem) => {
    setFilters(prev => ({ ...prev, carrierCd: item.code, carrierNm: item.nameKr || item.nameEn }));
    setShowCarrierModal(false);
  };

  // 출발항/도착항 모달 열기
  const openLocationModal = (target: 'pol' | 'pod') => {
    setLocationTarget(target);
    setShowLocationModal(true);
  };
  const handleLocationSelect = (item: LocationItem) => {
    if (locationTarget === 'pol') {
      setFilters(prev => ({ ...prev, polCd: item.code, polNm: item.nameKr || item.nameEn }));
    } else {
      setFilters(prev => ({ ...prev, podCd: item.code, podNm: item.nameKr || item.nameEn }));
    }
    setShowLocationModal(false);
  };

  // 정렬
  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedList = useMemo(() => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortConfig.key!];
      const bVal = (b as unknown as Record<string, unknown>)[sortConfig.key!];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === 'number' && typeof bVal === 'number'
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal), 'ko');
      return sortConfig.direction === 'asc' ? cmp : -cmp;
    });
  }, [data, sortConfig]);

  // 정렬 가능한 헤더 컴포넌트
  const SortableHeader = ({ columnKey, label, className = '' }: { columnKey: string; label: string; className?: string }) => (
    <th className={`cursor-pointer select-none ${className}`} onClick={() => handleSort(columnKey)}>
      <span className="inline-flex items-center">{label}<SortIcon columnKey={columnKey} sortConfig={sortConfig} /></span>
    </th>
  );

  // 체크박스 선택
  const handleRowSelect = (id: number) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const handleSelectAll = () => {
    selectedIds.size === sortedList.length
      ? setSelectedIds(new Set())
      : setSelectedIds(new Set(sortedList.map(i => i.RATE_ID)));
  };

  // 행 클릭 -> 상세
  const handleRowClick = (item: CorporateRateItem) => {
    router.push(`/logis/rate/corporate/sea/${item.RATE_ID}`);
  };

  // 신규
  const handleNew = () => {
    router.push('/logis/rate/corporate/sea/register');
  };

  // 삭제
  const handleDelete = async () => {
    if (selectedIds.size === 0) {
      alert('삭제할 항목을 선택해주세요.');
      return;
    }
    if (confirm(`${selectedIds.size}건을 삭제하시겠습니까?`)) {
      try {
        const ids = Array.from(selectedIds).join(',');
        const res = await fetch(`/api/logis/rate/corporate?ids=${ids}`, { method: 'DELETE' });
        if (res.ok) {
          setData(prev => prev.filter(d => !selectedIds.has(d.RATE_ID)));
          setSelectedIds(new Set());
          alert('삭제되었습니다.');
        } else {
          alert('삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('Delete error:', error);
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // 첫번째 detail row에서 값 가져오기
  const getDetailValue = (item: CorporateRateItem, field: keyof RateDetailRow): string => {
    if (!item.details || item.details.length === 0) return '-';
    const val = item.details[0][field];
    if (val === undefined || val === null) return '-';
    if (typeof val === 'number') return val === 0 ? '-' : Number(val).toLocaleString();
    return String(val) || '-';
  };

  return (
    <PageLayout title="기업운임관리(해상)" subtitle="Logis > 운임관리 > 기업운임관리(해상)" showCloseButton={false}>
      <main ref={formRef} className="p-6" onKeyDown={handleKeyDown}>
        {/* 상단 버튼 영역 */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50" disabled={selectedIds.size === 0}>삭제</button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleNew}
              className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)] font-medium"
            >
              신규
            </button>
          </div>
        </div>

        {/* 검색조건 */}
        <div className="card mb-6">
          <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="font-bold">검색조건</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-6 gap-4 mb-4">
              {/* 등록일자 */}
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">등록일자</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={e => handleFilterChange('startDate', e.target.value)}
                    className="flex-1 h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                  />
                  <span className="text-[var(--muted)]">~</span>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={e => handleFilterChange('endDate', e.target.value)}
                    className="flex-1 h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                  />
                  <DateRangeButtons onRangeSelect={handleDateRangeSelect} />
                </div>
              </div>
              {/* 수출입구분 */}
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">수출입구분</label>
                <select
                  value={filters.ioType}
                  onChange={e => handleFilterChange('ioType', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                >
                  <option value="">전체</option>
                  <option value="EXPORT">수출</option>
                  <option value="IMPORT">수입</option>
                </select>
              </div>
              {/* 거래처 */}
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">거래처</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={filters.customerNm}
                    onChange={e => handleFilterChange('customerNm', e.target.value)}
                    className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                    placeholder="거래처명"
                  />
                  <SearchIconButton onClick={openCustomerModal} />
                </div>
              </div>
              {/* 선사 */}
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">선사</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={filters.carrierNm}
                    onChange={e => handleFilterChange('carrierNm', e.target.value)}
                    className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                    placeholder="선사명"
                  />
                  <SearchIconButton onClick={openCarrierModal} />
                </div>
              </div>
              {/* 출발항 */}
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">출발항</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={filters.polNm}
                    onChange={e => handleFilterChange('polNm', e.target.value)}
                    className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                    placeholder="출발항"
                  />
                  <SearchIconButton onClick={() => openLocationModal('pol')} />
                </div>
              </div>
              {/* 도착항 */}
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">도착항</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={filters.podNm}
                    onChange={e => handleFilterChange('podNm', e.target.value)}
                    className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                    placeholder="도착항"
                  />
                  <SearchIconButton onClick={() => openLocationModal('pod')} />
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

        {/* 목록 테이블 */}
        <div className="card mb-6">
          <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h3 className="font-bold">기업운임 목록</h3>
              <span className="px-2 py-1 bg-[#E8A838]/20 text-[#E8A838] rounded text-sm font-medium">
                {sortedList.length}건
              </span>
            </div>
            {selectedIds.size > 0 && (
              <button onClick={() => setSelectedIds(new Set())} className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
                선택 해제 ({selectedIds.size}건)
              </button>
            )}
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
                  <SortableHeader columnKey="CREATED_DATE" label="Date" className="text-center font-semibold" />
                  <SortableHeader columnKey="IO_TYPE" label="수출입구분" className="text-center font-semibold" />
                  <SortableHeader columnKey="CUSTOMER_NM" label="거래처" className="text-center font-semibold" />
                  <SortableHeader columnKey="CARRIER_NM" label="Line" className="text-center font-semibold" />
                  <SortableHeader columnKey="POL_NM" label="Loading" className="text-center font-semibold" />
                  <SortableHeader columnKey="POD_NM" label="Destn" className="text-center font-semibold" />
                  <th className="text-center font-semibold">Freight</th>
                  <th className="text-center font-semibold">Type</th>
                  <th className="text-center font-semibold">MIN</th>
                  <th className="text-center font-semibold">BL</th>
                  <th className="text-center font-semibold">R.TON</th>
                  <th className="text-center font-semibold">20CONT</th>
                  <th className="text-center font-semibold">40CONT</th>
                  <th className="text-center font-semibold">BULK</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={16} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-[#E8A838] border-t-transparent rounded-full animate-spin" />
                        <p className="text-[var(--muted)]">조회 중...</p>
                      </div>
                    </td>
                  </tr>
                ) : sortedList.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <svg className="w-12 h-12 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-[var(--muted)]">{isInitialLoad ? '데이터를 불러오는 중...' : '조회된 데이터가 없습니다.'}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedList.map((row, index) => (
                    <tr
                      key={row.RATE_ID}
                      className={`border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer transition-colors ${selectedIds.has(row.RATE_ID) ? 'bg-blue-500/10' : ''}`}
                      onClick={() => handleRowClick(row)}
                    >
                      <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.RATE_ID)}
                          onChange={() => handleRowSelect(row.RATE_ID)}
                          className="rounded"
                        />
                      </td>
                      <td className="p-3 text-center text-sm">{index + 1}</td>
                      <td className="p-3 text-center text-sm text-[var(--muted)]">{row.CREATED_DATE || '-'}</td>
                      <td className="p-3 text-center text-sm">
                        {row.IO_TYPE === 'EXPORT' ? '수출' : row.IO_TYPE === 'IMPORT' ? '수입' : row.IO_TYPE || '-'}
                      </td>
                      <td className="p-3 text-center text-sm font-medium">{row.CUSTOMER_NM || '-'}</td>
                      <td className="p-3 text-center text-sm">{row.CARRIER_NM || '-'}</td>
                      <td className="p-3 text-center text-sm">{row.POL_NM || row.POL_CD || '-'}</td>
                      <td className="p-3 text-center text-sm">{row.POD_NM || row.POD_CD || '-'}</td>
                      <td className="p-3 text-center text-sm">{getDetailValue(row, 'FREIGHT_CD')}</td>
                      <td className="p-3 text-center text-sm">{getDetailValue(row, 'FREIGHT_TYPE')}</td>
                      <td className="p-3 text-center text-sm">{getDetailValue(row, 'RATE_MIN')}</td>
                      <td className="p-3 text-center text-sm">{getDetailValue(row, 'RATE_BL')}</td>
                      <td className="p-3 text-center text-sm">{getDetailValue(row, 'RATE_RTON')}</td>
                      <td className="p-3 text-center text-sm">{getDetailValue(row, 'CNTR_DRY_20')}</td>
                      <td className="p-3 text-center text-sm">{getDetailValue(row, 'CNTR_DRY_40')}</td>
                      <td className="p-3 text-center text-sm">{getDetailValue(row, 'RATE_BULK')}</td>
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

      {/* 거래처 코드 검색 모달 */}
      <CodeSearchModal
        isOpen={showCodeSearchModal}
        onClose={() => setShowCodeSearchModal(false)}
        onSelect={handleCustomerSelect}
        codeType="customer"
      />

      {/* 선사 코드 검색 모달 */}
      <CarrierCodeModal
        isOpen={showCarrierModal}
        onClose={() => setShowCarrierModal(false)}
        onSelect={handleCarrierSelect}
      />

      {/* 출발항/도착항 검색 모달 */}
      <LocationCodeModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelect={handleLocationSelect}
        type="seaport"
        locationType={locationTarget === 'pol' ? 'origin' : 'destination'}
      />
    </PageLayout>
  );
}
