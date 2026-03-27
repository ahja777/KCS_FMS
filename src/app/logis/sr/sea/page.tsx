'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LIST_PATHS } from '@/constants/paths';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import DateRangeButtons, { getToday } from '@/components/DateRangeButtons';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { useSorting, SortableHeader, SortStatusBadge } from '@/components/table';
import SearchIconButton from '@/components/SearchIconButton';
import { CodeSearchModal, type CodeItem } from '@/components/popup';

/* ───────────── 타입 정의 ───────────── */

interface SRListItem {
  id: number;
  srNo: string;
  jobNo: string;
  blType: string;
  mblNo: string;
  shipperName: string;
  consigneeName: string;
  carrier: string;
  lineTo: string;
  inputUser: string;
  pol: string;
  pod: string;
  eta: string;
  etd: string;
  packageQty: number;
  grossWeight: number;
  status: string;
  createdAt: string;
}

interface HBLItem {
  no: number;
  hblNo: string;
  shipper: string;
  consignee: string;
  pol: string;
  pod: string;
  pkg: number;
  grossWeight: number;
  measurement: number;
}

interface SearchFilters {
  startDate: string;
  endDate: string;
  srNo: string;
  blType: string;
  location: string;
  carrier: string;
  inputUser: string;
  branch: string;
}

/* ───────────── 상수 ───────────── */

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: '초안', color: '#6B7280', bgColor: '#F3F4F6' },
  PENDING: { label: '대기', color: '#D97706', bgColor: '#FEF3C7' },
  SUBMITTED: { label: '제출', color: '#2563EB', bgColor: '#DBEAFE' },
  APPROVED: { label: '승인', color: '#059669', bgColor: '#D1FAE5' },
  REJECTED: { label: '반려', color: '#DC2626', bgColor: '#FEE2E2' },
  CONFIRMED: { label: '확정', color: '#059669', bgColor: '#D1FAE5' },
  EXPIRED: { label: '만료', color: '#6B7280', bgColor: '#F3F4F6' },
  CANCELLED: { label: '취소', color: '#DC2626', bgColor: '#FEE2E2' },
};

const getStatusConfig = (status: string) =>
  statusConfig[status] || { label: status || '미정', color: '#6B7280', bgColor: '#F3F4F6' };

const getInitialFilters = (): SearchFilters => {
  const today = getToday();
  return {
    startDate: today,
    endDate: today,
    srNo: '',
    blType: '',
    location: '',
    carrier: '',
    inputUser: '',
    branch: '',
  };
};

const columnLabels: Record<string, string> = {
  blType: 'B/L TYPE',
  srNo: 'S/R NO',
  mblNo: 'MBL NO',
  shipperName: 'Shipper',
  consigneeName: 'Consignee',
  carrier: 'Line',
  lineTo: 'Agent',
  eta: '도착일자(ETA)',
  pod: '도착지(POD)',
};

/* ───────────── 컴포넌트 ───────────── */

export default function SRSeaPage() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  /* 상태 */
  const [listData, setListData] = useState<SRListItem[]>([]);
  const [filters, setFilters] = useState<SearchFilters>(getInitialFilters);
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(getInitialFilters);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedSrId, setSelectedSrId] = useState<number | null>(null);
  const [hblList] = useState<HBLItem[]>([]);

  /* 모달 */
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCarrierModal, setShowCarrierModal] = useState(false);

  /* 정렬 */
  const { sortConfig, handleSort, sortData, getSortStatusText, resetSort } = useSorting<SRListItem>();

  /* 정렬된 목록 */
  const sortedList = useMemo(() => sortData(listData), [listData, sortData]);

  /* ── 데이터 조회 ── */
  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (appliedFilters.startDate) params.set('startDate', appliedFilters.startDate);
      if (appliedFilters.endDate) params.set('endDate', appliedFilters.endDate);
      if (appliedFilters.srNo) params.set('srNo', appliedFilters.srNo);
      if (appliedFilters.blType) params.set('blType', appliedFilters.blType);
      if (appliedFilters.location) params.set('location', appliedFilters.location);
      if (appliedFilters.carrier) params.set('carrier', appliedFilters.carrier);
      if (appliedFilters.inputUser) params.set('inputUser', appliedFilters.inputUser);
      if (appliedFilters.branch) params.set('branch', appliedFilters.branch);

      const res = await fetch(`/api/sr/sea?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setListData(data);
      }
    } catch (error) {
      console.error('S/R 목록 조회 실패:', error);
    }
  }, [appliedFilters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── 검색 / 초기화 ── */
  const handleSearch = () => {
    setAppliedFilters({ ...filters });
    setSelectedIds(new Set());
    setSelectedSrId(null);
  };

  const handleReset = () => {
    const f = getInitialFilters();
    setFilters(f);
    setAppliedFilters(f);
    setSelectedIds(new Set());
    setSelectedSrId(null);
  };

  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  /* ── 행 선택 ── */
  const handleRowSelect = (id: number) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === sortedList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedList.map(i => i.id)));
    }
  };

  /* ── 행 클릭 → 상세 이동 ── */
  const handleRowClick = (row: SRListItem) => {
    setSelectedSrId(row.id);
  };

  const handleRowDoubleClick = (row: SRListItem) => {
    router.push(`/logis/sr/sea/register?id=${row.id}`);
  };

  /* ── 액션 버튼 핸들러 ── */
  const handleNew = () => {
    router.push('/logis/sr/sea/register');
  };

  const handleEdit = () => {
    if (selectedIds.size !== 1) {
      alert('수정할 항목을 1개 선택해주세요.');
      return;
    }
    const id = Array.from(selectedIds)[0];
    router.push(`/logis/sr/sea/register?id=${id}`);
  };

  const handleDelete = async () => {
    if (selectedIds.size === 0) {
      alert('삭제할 항목을 선택하세요.');
      return;
    }
    if (!confirm(`${selectedIds.size}건을 삭제하시겠습니까?`)) return;
    const ids = Array.from(selectedIds).join(',');
    const res = await fetch(`/api/sr/sea?ids=${ids}`, { method: 'DELETE' });
    if (res.ok) {
      alert('삭제되었습니다.');
      fetchData();
      setSelectedIds(new Set());
      setSelectedSrId(null);
    }
  };

  const handleSRSend = () => {
    if (selectedIds.size === 0) {
      alert('S/R 송신할 항목을 선택하세요.');
      return;
    }
    alert(`${selectedIds.size}건 S/R 송신 (미구현)`);
  };

  const handleSRReceive = () => {
    alert('S/R 수신 (미구현)');
  };

  const handleULH = () => {
    if (selectedIds.size === 0) {
      alert('ULH 신고할 항목을 선택하세요.');
      return;
    }
    alert(`${selectedIds.size}건 ULH 해외신고 (미구현)`);
  };

  /* ── 화면 닫기 ── */
  const handleConfirmClose = () => {
    setShowCloseModal(false);
    router.push(LIST_PATHS.DASHBOARD);
  };

  useCloseConfirm({
    showModal: showCloseModal,
    setShowModal: setShowCloseModal,
    onConfirmClose: handleConfirmClose,
  });

  /* ── 팝업 선택 핸들러 ── */
  const handleLocationSelect = (item: CodeItem) => {
    handleFilterChange('location', item.code);
    setShowLocationModal(false);
  };

  const handleCarrierSelect = (item: CodeItem) => {
    handleFilterChange('carrier', item.code);
    setShowCarrierModal(false);
  };

  return (
    <PageLayout
      title="선적요청관리 (S/R)"
      subtitle="Logis > 선적관리 > 선적요청관리 (해상)"
      showCloseButton={false}
    >
      <main ref={formRef} className="p-6">
        {/* ─── 상단 액션 버튼 ─── */}
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
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
            >
              수정
            </button>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
            >
              조회
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
            >
              초기화
            </button>
            <button
              onClick={handleSRSend}
              className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
            >
              S/R송신
            </button>
            <button
              onClick={handleSRReceive}
              className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
            >
              S/R수신
            </button>
            <button
              onClick={handleULH}
              className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
            >
              ULH(해외신고)
            </button>
          </div>
        </div>

        {/* ─── 검색조건 카드 ─── */}
        <div className="card mb-6">
          <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="font-bold">검색조건</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-6 gap-4">
              {/* 일자(기간) */}
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">
                  일자(기간) <span className="text-red-500">*</span>
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
                  <DateRangeButtons
                    onRangeSelect={(start, end) => {
                      handleFilterChange('startDate', start);
                      handleFilterChange('endDate', end);
                    }}
                  />
                </div>
              </div>
              {/* S/R NO */}
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">S/R NO</label>
                <input
                  type="text"
                  value={filters.srNo}
                  onChange={e => handleFilterChange('srNo', e.target.value)}
                  placeholder="SR-YYYY-XXXX"
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                />
              </div>
              {/* B/L TYPE */}
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">B/L TYPE</label>
                <select
                  value={filters.blType}
                  onChange={e => handleFilterChange('blType', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                >
                  <option value="">전체</option>
                  <option value="OBL">OBL</option>
                  <option value="SWB">SWB</option>
                  <option value="SEAWAY BILL">SEAWAY BILL</option>
                </select>
              </div>
              {/* LOCATION */}
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">LOCATION</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={filters.location}
                    onChange={e => handleFilterChange('location', e.target.value)}
                    placeholder="항구코드"
                    className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                  />
                  <SearchIconButton onClick={() => setShowLocationModal(true)} />
                </div>
              </div>
              {/* 선사 */}
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">선사</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={filters.carrier}
                    onChange={e => handleFilterChange('carrier', e.target.value)}
                    placeholder="선사코드"
                    className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                  />
                  <SearchIconButton onClick={() => setShowCarrierModal(true)} />
                </div>
              </div>
              {/* 입력사원 */}
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">입력사원</label>
                <input
                  type="text"
                  value={filters.inputUser}
                  onChange={e => handleFilterChange('inputUser', e.target.value)}
                  placeholder="입력사원명"
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                />
              </div>
              {/* 본/지사 */}
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">본/지사</label>
                <select
                  value={filters.branch}
                  onChange={e => handleFilterChange('branch', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                >
                  <option value="">전체</option>
                  <option value="HQ">본사</option>
                  <option value="BR">지사</option>
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

        {/* ─── Shipping Request 목록 (상단 테이블) ─── */}
        <div className="card mb-6">
          <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h3 className="font-bold">Shipping Request List</h3>
              <span className="px-2 py-1 bg-[#E8A838]/20 text-[#E8A838] rounded text-sm font-medium">
                {listData.length}건
              </span>
              <SortStatusBadge statusText={getSortStatusText(columnLabels)} onReset={resetSort} />
            </div>
            {selectedIds.size > 0 && (
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
              >
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
                  <SortableHeader columnKey="blType" label="B/L TYPE" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="srNo" label="S/R NO" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="mblNo" label="MBL NO" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="shipperName" label="Shipper" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="consigneeName" label="Consignee" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="carrier" label="Line" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="lineTo" label="Agent" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="eta" label="도착일자(ETA)" sortConfig={sortConfig} onSort={handleSort} align="center" />
                  <SortableHeader columnKey="pod" label="도착지(POD)" sortConfig={sortConfig} onSort={handleSort} />
                </tr>
              </thead>
              <tbody>
                {sortedList.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <svg className="w-12 h-12 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-[var(--muted)]">조회된 데이터가 없습니다.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedList.map((row, index) => (
                    <tr
                      key={row.id}
                      className={`border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer transition-colors ${selectedIds.has(row.id) ? 'bg-blue-500/10' : ''} ${selectedSrId === row.id ? 'bg-[#E8A838]/10' : ''}`}
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
                      <td className="p-3 text-center text-sm">
                        {row.blType ? (
                          <span className="px-2 py-1 bg-[var(--surface-100)] rounded text-xs font-medium">{row.blType}</span>
                        ) : '-'}
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-[#E8A838] font-medium hover:underline">{row.srNo}</span>
                      </td>
                      <td className="p-3 text-center text-sm">{row.mblNo || '-'}</td>
                      <td className="p-3 text-center text-sm font-medium">{row.shipperName || '-'}</td>
                      <td className="p-3 text-center text-sm font-medium">{row.consigneeName || '-'}</td>
                      <td className="p-3 text-center">
                        {row.carrier ? (
                          <span className="px-2 py-1 bg-[var(--surface-100)] rounded text-sm font-medium">{row.carrier}</span>
                        ) : '-'}
                      </td>
                      <td className="p-3 text-center text-sm">{row.lineTo || '-'}</td>
                      <td className="p-3 text-center text-sm">{row.eta || '-'}</td>
                      <td className="p-3 text-center text-sm font-medium">{row.pod || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── House B/L List (하단 테이블) ─── */}
        <div className="card">
          <div className="p-4 border-b border-[var(--border)] flex items-center gap-3">
            <h3 className="font-bold">House B/L List</h3>
            {selectedSrId && (
              <span className="px-2 py-1 bg-[#E8A838]/20 text-[#E8A838] rounded text-sm font-medium">
                {hblList.length}건
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="p-3 text-center text-sm font-semibold">No</th>
                  <th className="p-3 text-center text-sm font-semibold">HBL NO</th>
                  <th className="p-3 text-center text-sm font-semibold">Shipper</th>
                  <th className="p-3 text-center text-sm font-semibold">Consignee</th>
                  <th className="p-3 text-center text-sm font-semibold">POL</th>
                  <th className="p-3 text-center text-sm font-semibold">POD</th>
                  <th className="p-3 text-center text-sm font-semibold">PKG</th>
                  <th className="p-3 text-center text-sm font-semibold">G.Weight</th>
                  <th className="p-3 text-center text-sm font-semibold">Measurement</th>
                </tr>
              </thead>
              <tbody>
                {hblList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center">
                      <p className="text-[var(--muted)] text-sm">
                        {selectedSrId ? '관련 House B/L이 없습니다.' : '상위 S/R을 선택하면 House B/L 정보가 표시됩니다.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  hblList.map((hbl) => (
                    <tr key={hbl.no} className="border-t border-[var(--border)] hover:bg-[var(--surface-50)] transition-colors">
                      <td className="p-3 text-center text-sm">{hbl.no}</td>
                      <td className="p-3 text-center">
                        <span className="text-[#E8A838] font-medium">{hbl.hblNo}</span>
                      </td>
                      <td className="p-3 text-center text-sm font-medium">{hbl.shipper}</td>
                      <td className="p-3 text-center text-sm font-medium">{hbl.consignee}</td>
                      <td className="p-3 text-center text-sm">{hbl.pol}</td>
                      <td className="p-3 text-center text-sm">{hbl.pod}</td>
                      <td className="p-3 text-center text-sm">{hbl.pkg.toLocaleString()}</td>
                      <td className="p-3 text-center text-sm">{hbl.grossWeight.toLocaleString()}</td>
                      <td className="p-3 text-center text-sm">{hbl.measurement.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ─── 모달 ─── */}
      <CloseConfirmModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onConfirm={handleConfirmClose}
      />

      <CodeSearchModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelect={handleLocationSelect}
        codeType="seaport"
        title="LOCATION 조회"
      />

      <CodeSearchModal
        isOpen={showCarrierModal}
        onClose={() => setShowCarrierModal(false)}
        onSelect={handleCarrierSelect}
        codeType="carrier"
        title="선사 조회"
      />
    </PageLayout>
  );
}
