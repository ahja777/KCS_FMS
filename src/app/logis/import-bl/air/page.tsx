'use client';

import { useRouter } from 'next/navigation';
import { LIST_PATHS } from '@/constants/paths';
import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import AWBPrintModal from '@/components/AWBPrintModal';
import DateRangeButtons, { getToday } from '@/components/DateRangeButtons';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { useSorting, SortableHeader, SortStatusBadge } from '@/components/table';
import SelectionAlertModal from '@/components/SelectionAlertModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';

interface AWBData {
  mawb_id: number;
  mawb_no: string;
  airline_code: string;
  flight_no: string;
  etd_dt: string;
  eta_dt: string;
  ata_dt: string;
  origin_airport_cd: string;
  dest_airport_cd: string;
  shipper_nm: string;
  consignee_nm: string;
  pieces: number;
  gross_weight_kg: number;
  charge_weight_kg: number;
  commodity_desc: string;
  status_cd: string;
  hawb_count: number;
  remarks: string;
}

// 항공수입용 상태 (부킹 관련 제거)
const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: '초안', color: 'bg-gray-500', bgColor: '#F3F4F6' },
  ACCEPTED: { label: '수탁', color: 'bg-cyan-500', bgColor: '#CFFAFE' },
  DEPARTED: { label: '출발', color: 'bg-purple-500', bgColor: '#F3E8FF' },
  IN_TRANSIT: { label: '운송중', color: 'bg-yellow-500', bgColor: '#FEF3C7' },
  ARRIVED: { label: '도착', color: 'bg-green-500', bgColor: '#D1FAE5' },
  CUSTOMS: { label: '통관중', color: 'bg-orange-500', bgColor: '#FFEDD5' },
  RELEASED: { label: '반출', color: 'bg-blue-500', bgColor: '#DBEAFE' },
  DELIVERED: { label: '인도완료', color: 'bg-emerald-600', bgColor: '#D1FAE5' },
  CANCELLED: { label: '취소', color: 'bg-red-500', bgColor: '#FEE2E2' },
};

const getStatusConfig = (status: string) => statusConfig[status] || { label: status || '미정', color: 'bg-gray-500', bgColor: '#F3F4F6' };

// 샘플 데이터
const sampleData: AWBData[] = [
  { mawb_id: 1, mawb_no: '180-12345671', airline_code: 'KE', flight_no: 'KE002', etd_dt: '2026-01-20', eta_dt: '2026-01-21', ata_dt: '2026-01-21', origin_airport_cd: 'LAX', dest_airport_cd: 'ICN', shipper_nm: 'ABC Corp', consignee_nm: '삼성전자', pieces: 50, gross_weight_kg: 1250, charge_weight_kg: 1350, commodity_desc: '전자부품', status_cd: 'ARRIVED', hawb_count: 3, remarks: '' },
  { mawb_id: 2, mawb_no: '180-98765432', airline_code: 'OZ', flight_no: 'OZ202', etd_dt: '2026-01-18', eta_dt: '2026-01-19', ata_dt: '', origin_airport_cd: 'FRA', dest_airport_cd: 'ICN', shipper_nm: 'XYZ GmbH', consignee_nm: 'LG전자', pieces: 30, gross_weight_kg: 850, charge_weight_kg: 900, commodity_desc: '자동차부품', status_cd: 'IN_TRANSIT', hawb_count: 2, remarks: '' },
  { mawb_id: 3, mawb_no: '618-11223344', airline_code: 'KE', flight_no: 'KE012', etd_dt: '2026-01-22', eta_dt: '2026-01-23', ata_dt: '', origin_airport_cd: 'NRT', dest_airport_cd: 'ICN', shipper_nm: 'DEF Inc', consignee_nm: '현대자동차', pieces: 100, gross_weight_kg: 2500, charge_weight_kg: 2800, commodity_desc: '기계장비', status_cd: 'DEPARTED', hawb_count: 5, remarks: '' },
  { mawb_id: 4, mawb_no: '988-55667788', airline_code: 'CA', flight_no: 'CA124', etd_dt: '2026-01-15', eta_dt: '2026-01-16', ata_dt: '2026-01-16', origin_airport_cd: 'PVG', dest_airport_cd: 'ICN', shipper_nm: 'GHI Trading', consignee_nm: 'SK하이닉스', pieces: 80, gross_weight_kg: 1800, charge_weight_kg: 2000, commodity_desc: '반도체장비', status_cd: 'CUSTOMS', hawb_count: 4, remarks: '' },
  { mawb_id: 5, mawb_no: '160-99887766', airline_code: 'SQ', flight_no: 'SQ608', etd_dt: '2026-01-10', eta_dt: '2026-01-11', ata_dt: '2026-01-11', origin_airport_cd: 'SIN', dest_airport_cd: 'ICN', shipper_nm: 'JKL Pte Ltd', consignee_nm: '포스코', pieces: 200, gross_weight_kg: 5000, charge_weight_kg: 5500, commodity_desc: '화학제품', status_cd: 'DELIVERED', hawb_count: 8, remarks: '' },
];

export default function ImportAWBListPage() {
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const today = getToday();
  const [filters, setFilters] = useState({
    startDate: today,
    endDate: today,
    awbNo: '',
    flightNo: '',
    consignee: '',
    status: '',
  });
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printMawbId, setPrintMawbId] = useState<number | undefined>(undefined);
  const [showSelectionAlert, setShowSelectionAlert] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [data, setData] = useState<AWBData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedRow, setSelectedRow] = useState<AWBData | null>(null);

  // 정렬 훅
  const { sortConfig, handleSort, sortData, getSortStatusText, resetSort } = useSorting<AWBData>();

  // 컬럼 레이블
  const columnLabels: Record<string, string> = {
    mawb_no: 'MAWB No.',
    airline_code: '항공사',
    flight_no: '편명',
    eta_dt: 'ETA',
    origin_airport_cd: '구간',
    consignee_nm: '수하인',
    commodity_desc: '품명',
    pieces: 'PCS',
    gross_weight_kg: 'G/W',
    hawb_count: 'HAWB',
    status_cd: '상태',
  };

  // 데이터 조회
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      // 항공수입 타입 지정
      params.append('import_type', 'IMPORT');
      if (appliedFilters.awbNo) params.append('awb_no', appliedFilters.awbNo);
      if (appliedFilters.status) params.append('status', appliedFilters.status);

      const response = await fetch(`/api/awb/mawb?${params}`);
      const result = await response.json();
      if (Array.isArray(result) && result.length > 0) {
        setData(result);
      } else {
        // API 결과가 없으면 샘플 데이터 사용
        setData(sampleData);
      }
    } catch (error) {
      console.error('Error fetching AWB data:', error);
      // 에러 시 샘플 데이터 사용
      setData(sampleData);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDateRangeSelect = (startDate: string, endDate: string) => {
    setFilters(prev => ({ ...prev, startDate, endDate }));
  };

  const handleSearch = () => setAppliedFilters(filters);
  const handleReset = () => {
    const resetFilters = { startDate: today, endDate: today, awbNo: '', flightNo: '', consignee: '', status: '' };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
    setSelectedIds(new Set());
    setSelectedRow(null);
    resetSort();
  };

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (appliedFilters.flightNo && !item.flight_no?.toLowerCase().includes(appliedFilters.flightNo.toLowerCase())) return false;
      if (appliedFilters.consignee && !item.consignee_nm?.includes(appliedFilters.consignee)) return false;
      return true;
    });
  }, [data, appliedFilters]);

  // 정렬된 목록
  const sortedList = useMemo(() => sortData(filteredData), [filteredData, sortData]);

  // 요약 통계 (부킹 제거)
  const summaryStats = useMemo(() => ({
    total: filteredData.length,
    arrived: filteredData.filter(d => d.status_cd === 'ARRIVED').length,
    inTransit: filteredData.filter(d => d.status_cd === 'IN_TRANSIT').length,
    totalWeight: filteredData.reduce((sum, d) => sum + (d.gross_weight_kg || 0), 0),
  }), [filteredData]);

  // 선택 핸들러
  const handleRowSelect = (id: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === sortedList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedList.map(item => item.mawb_id)));
    }
  };

  const handleRowClick = (item: AWBData) => {
    setSelectedRow(item);
  };

  // 출력 핸들러
  const handlePrint = () => {
    if (selectedIds.size === 0) {
      setShowSelectionAlert(true);
      return;
    }
    const firstSelectedId = Array.from(selectedIds)[0];
    setPrintMawbId(firstSelectedId);
    setShowPrintModal(true);
  };
  // 수정 버튼 핸들러
  const handleEdit = () => {
    if (selectedIds.size === 0) { alert('수정할 항목을 선택해주세요.'); return; }
    if (selectedIds.size > 1) { alert('수정할 항목을 1개만 선택해주세요.'); return; }
    const id = Array.from(selectedIds)[0];
    router.push(`/logis/import-bl/air/register?id=${id}`);
  };


  // 삭제 핸들러
  const handleDeleteClick = () => {
    if (selectedIds.size === 0) {
      setShowSelectionAlert(true);
      return;
    }
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      for (const id of selectedIds) {
        await fetch(`/api/awb/mawb?id=${id}`, { method: 'DELETE' });
      }
      alert(`${selectedIds.size}건이 삭제되었습니다.`);
      setSelectedIds(new Set());
      setSelectedRow(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
    setShowDeleteConfirm(false);
  };

  const handleCloseClick = () => {
    setShowCloseModal(true);
  };

  const handleConfirmClose = () => {
    setShowCloseModal(false);
    router.push(LIST_PATHS.DASHBOARD);
  };

  useCloseConfirm({
    showModal: showCloseModal,
    setShowModal: setShowCloseModal,
    onConfirmClose: handleConfirmClose,
  });

  return (
        <PageLayout title="AWB 관리 (항공수입)" subtitle="Logis > 항공수입 > AWB 관리" showCloseButton={false} >
        <main ref={formRef} className="p-6">
          {/* 버튼 영역 */}
          <div className="flex justify-end items-center mb-6">
            <div className="flex gap-2">
              <Link href="/logis/import-bl/air/register" className="px-6 py-2 font-semibold rounded-lg bg-[var(--surface-100)] text-[var(--foreground)] hover:bg-[var(--surface-200)]">
                신규 등록
              </Link>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)] flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                출력
              </button>
              <button onClick={() => router.push('/logis/import-bl/air/register')} className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] text-sm">신규</button>
              <button onClick={handleEdit} className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] text-sm">
                수정
              </button>
              <button
                onClick={handleDeleteClick}
                className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)] flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                삭제
              </button>
              {selectedIds.size > 0 && (
                <button
                  onClick={() => { setSelectedIds(new Set()); setSelectedRow(null); }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  선택해제 ({selectedIds.size}건)
                </button>
              )}
            </div>
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
                {/* ETA 기간 */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ETA 기간</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                      className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                    />
                    <span className="text-[var(--muted)]">~</span>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                      className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                    />
                    <DateRangeButtons onRangeSelect={handleDateRangeSelect} />
                  </div>
                </div>
                {/* MAWB No. */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">MAWB No.</label>
                  <input
                    type="text"
                    value={filters.awbNo}
                    onChange={e => setFilters(prev => ({ ...prev, awbNo: e.target.value }))}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                    placeholder="180-12345678"
                  />
                </div>
                {/* 편명 */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">편명</label>
                  <input
                    type="text"
                    value={filters.flightNo}
                    onChange={e => setFilters(prev => ({ ...prev, flightNo: e.target.value }))}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                    placeholder="KE001"
                  />
                </div>
                {/* 수하인 */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">수하인</label>
                  <input
                    type="text"
                    value={filters.consignee}
                    onChange={e => setFilters(prev => ({ ...prev, consignee: e.target.value }))}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                    placeholder="수하인명"
                  />
                </div>
                {/* 상태 */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">상태</label>
                  <select
                    value={filters.status}
                    onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                  >
                    <option value="">전체</option>
                    <option value="DRAFT">초안</option>
                    <option value="DEPARTED">출발</option>
                    <option value="IN_TRANSIT">운송중</option>
                    <option value="ARRIVED">도착</option>
                    <option value="CUSTOMS">통관중</option>
                    <option value="RELEASED">반출</option>
                    <option value="DELIVERED">인도완료</option>
                  </select>
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

          {/* 요약 통계 (부킹 제거) */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold">{summaryStats.total}</div>
              <div className="text-sm text-[var(--muted)]">전체</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-yellow-500">{summaryStats.inTransit}</div>
              <div className="text-sm text-[var(--muted)]">운송중</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-green-500">{summaryStats.arrived}</div>
              <div className="text-sm text-[var(--muted)]">도착</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-purple-500">{summaryStats.totalWeight.toLocaleString()}</div>
              <div className="text-sm text-[var(--muted)]">총 중량 (KG)</div>
            </div>
          </div>

          {/* 테이블 */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] flex items-center gap-3">
              <h3 className="font-bold">AWB 목록 (항공수입)</h3>
              <span className="px-2 py-1 bg-[#E8A838]/20 text-[#E8A838] rounded text-sm font-medium">{filteredData.length}건</span>
              <SortStatusBadge statusText={getSortStatusText(columnLabels)} onReset={resetSort} />
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th className="text-center w-12">
                    <input
                      type="checkbox"
                      checked={sortedList.length > 0 && selectedIds.size === sortedList.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded"
                    />
                  </th>
                  <th className="w-14">No</th>
                  <SortableHeader columnKey="mawb_no" label="MAWB No." sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="airline_code" label="항공사" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="flight_no" label="편명" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="eta_dt" label="ETA" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="origin_airport_cd" label="구간" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="consignee_nm" label="수하인" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="commodity_desc" label="품명" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="pieces" label="PCS" sortConfig={sortConfig} onSort={handleSort} align="center" />
                  <SortableHeader columnKey="gross_weight_kg" label="G/W" sortConfig={sortConfig} onSort={handleSort} align="center" />
                  <SortableHeader columnKey="hawb_count" label="HAWB" sortConfig={sortConfig} onSort={handleSort} align="center" />
                  <SortableHeader columnKey="status_cd" label="상태" sortConfig={sortConfig} onSort={handleSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {loading ? (
                  <tr>
                    <td colSpan={13} className="px-4 py-8 text-center text-[var(--muted)]">
                      로딩 중...
                    </td>
                  </tr>
                ) : sortedList.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-4 py-8 text-center text-[var(--muted)]">
                      데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  sortedList.map((item, index) => (
                    <tr
                      key={item.mawb_id}
                      className={`hover:bg-[var(--surface-50)] cursor-pointer ${selectedIds.has(item.mawb_id) ? 'bg-blue-500/10' : ''} ${selectedRow?.mawb_id === item.mawb_id ? 'bg-[#E8A838]/10' : ''}`}
                      onClick={() => handleRowClick(item)}
                    >
                      <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.mawb_id)}
                          onChange={() => handleRowSelect(item.mawb_id)}
                          className="w-4 h-4 rounded"
                        />
                      </td>
                      <td className="text-center text-[var(--muted)]">{index + 1}</td>
                      <td className="px-4 py-3 text-center">
                        <Link href={`/logis/import-bl/air/${item.mawb_id}`} className="text-blue-400 hover:underline font-medium">
                          {item.mawb_no}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">{item.airline_code}</td>
                      <td className="px-4 py-3 text-sm text-center">{item.flight_no}</td>
                      <td className="px-4 py-3 text-sm text-center">{item.eta_dt || item.etd_dt}</td>
                      <td className="px-4 py-3 text-sm text-center">{item.origin_airport_cd} → {item.dest_airport_cd}</td>
                      <td className="px-4 py-3 text-sm text-center">{item.consignee_nm}</td>
                      <td className="px-4 py-3 text-sm text-center">{item.commodity_desc}</td>
                      <td className="px-4 py-3 text-sm text-center">{item.pieces?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-center">{item.gross_weight_kg?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          {item.hawb_count || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs rounded-full text-white ${getStatusConfig(item.status_cd).color}`}>
                          {getStatusConfig(item.status_cd).label}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
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

      {/* AWB 출력 모달 */}
      <AWBPrintModal
        isOpen={showPrintModal}
        onClose={() => { setShowPrintModal(false); setPrintMawbId(undefined); }}
        awbData={null}
        mawbId={printMawbId}
      />

      {/* 선택 알림 모달 */}
      <SelectionAlertModal
        isOpen={showSelectionAlert}
        onClose={() => setShowSelectionAlert(false)}
      />

      {/* 삭제 확인 모달 */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        itemCount={selectedIds.size}
      />
    </PageLayout>
  );
}
