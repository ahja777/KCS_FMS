'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import SelectionAlertModal from '@/components/SelectionAlertModal';
import EmailModal from '@/components/EmailModal';
import CodeSearchModal, { CodeType, CodeItem } from '@/components/popup/CodeSearchModal';
import BLPrintModal, { BLData as PrintBLData } from '@/components/BLPrintModal';
import { ActionButton } from '@/components/buttons';
import DateRangeButtons, { getToday } from '@/components/DateRangeButtons';

// Master B/L 검색조건 인터페이스
interface SearchFilters {
  ioType: string;
  obDateFrom: string;
  obDateTo: string;
  arDateFrom: string;
  arDateTo: string;
  lineCode: string;
  bookingNo: string;
  vessel: string;
  voyage: string;
  pol: string;
  pod: string;
  shipper: string;
  consignee: string;
  notify: string;
  partner: string;
  ctnrNo: string;
  licenseNo: string;
}

// Master B/L 목록 데이터 인터페이스
interface MasterBL {
  id: string;
  obDate: string;
  arDate: string;
  mblNo: string;
  bookingNo: string;
  lineCode: string;
  lineName: string;
  vesselName: string;
  voyage: string;
  pol: string;
  pod: string;
  etd: string;
  eta: string;
  freightTerm: string;
  serviceTerm: string;
  hblCount: number;
  totalPackage: number;
  totalWeight: number;
  totalCbm: number;
  status: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: '작성중', color: '#6B7280', bgColor: '#F3F4F6' },
  CONFIRMED: { label: '확정', color: '#059669', bgColor: '#D1FAE5' },
  SHIPPED: { label: '선적완료', color: '#2563EB', bgColor: '#DBEAFE' },
  ARRIVED: { label: '도착', color: '#7C3AED', bgColor: '#EDE9FE' },
};

const getStatusConfig = (status: string) => {
  return statusConfig[status] || { label: status || '미정', color: '#6B7280', bgColor: '#F3F4F6' };
};

const today = getToday();
const initialFilters: SearchFilters = {
  ioType: 'OUT',
  obDateFrom: today,
  obDateTo: today,
  arDateFrom: '',
  arDateTo: '',
  lineCode: '',
  bookingNo: '',
  vessel: '',
  voyage: '',
  pol: '',
  pod: '',
  shipper: '',
  consignee: '',
  notify: '',
  partner: '',
  ctnrNo: '',
  licenseNo: '',
};

export default function MasterBLListPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [data, setData] = useState<MasterBL[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(true);

  // 모달 상태
  const [showSelectionAlert, setShowSelectionAlert] = useState(false);
  const [selectionAlertMessage, setSelectionAlertMessage] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeModalType, setCodeModalType] = useState<CodeType>('carrier');
  const [codeModalTarget, setCodeModalTarget] = useState<string>('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printData, setPrintData] = useState<PrintBLData | null>(null);

  // 정렬 상태
  const [sortField, setSortField] = useState<keyof MasterBL>('obDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 화면닫기 훅
  const [showCloseModal, setShowCloseModal] = useState(false);
  const handleConfirmClose = useCallback(() => {
    setShowCloseModal(false);
    router.push('/');
  }, [router]);

  const { handleConfirm } = useCloseConfirm({
    showModal: showCloseModal,
    setShowModal: setShowCloseModal,
    onConfirmClose: handleConfirmClose,
  });

  const handleCloseClick = () => setShowCloseModal(true);

  // API에서 데이터 로드 (수출 - EXPORT)
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bl/mbl?direction=EXPORT');
      if (res.ok) {
        const rows = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: MasterBL[] = rows.map((r: any) => ({
          id: String(r.mbl_id),
          obDate: r.etd_dt || '',
          arDate: r.eta_dt || '',
          mblNo: r.mbl_no || '',
          bookingNo: r.booking_id ? `BK-${r.booking_id}` : '',
          lineCode: r.carrier_id ? String(r.carrier_id) : '',
          lineName: r.carrier_name || '',
          vesselName: r.vessel_nm || '',
          voyage: r.voyage_no || '',
          pol: r.pol_port_cd || '',
          pod: r.pod_port_cd || '',
          etd: r.etd_dt || '',
          eta: r.eta_dt || '',
          freightTerm: r.freight_term_cd || '',
          serviceTerm: r.bl_type_cd || '',
          hblCount: r.hbl_count || 0,
          totalPackage: r.total_pkg_qty || 0,
          totalWeight: Number(r.gross_weight_kg) || 0,
          totalCbm: Number(r.volume_cbm) || 0,
          status: r.status_cd || 'DRAFT',
        }));
        setData(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch Master B/L:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (filters.lineCode && !item.lineCode?.toLowerCase().includes(filters.lineCode.toLowerCase()) &&
          !item.lineName?.toLowerCase().includes(filters.lineCode.toLowerCase())) return false;
      if (filters.bookingNo && !item.bookingNo?.toLowerCase().includes(filters.bookingNo.toLowerCase())) return false;
      if (filters.vessel && !item.vesselName?.toLowerCase().includes(filters.vessel.toLowerCase())) return false;
      if (filters.voyage && !item.voyage?.toLowerCase().includes(filters.voyage.toLowerCase())) return false;
      if (filters.pol && item.pol !== filters.pol) return false;
      if (filters.pod && item.pod !== filters.pod) return false;
      return true;
    });
  }, [data, filters]);

  // 정렬된 데이터
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });
  }, [filteredData, sortField, sortDirection]);

  // 페이지네이션 데이터
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  // 필터 변경
  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  // 검색 초기화
  const handleReset = () => {
    setFilters(initialFilters);
    setCurrentPage(1);
  };

  // 행 선택
  const handleRowSelect = (id: string) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  // 전체 선택
  const handleSelectAll = () => {
    if (selectedRows.length === paginatedData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(paginatedData.map(item => item.id));
    }
  };

  // 정렬 토글
  const handleSort = (field: keyof MasterBL) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 신규 등록
  const handleNew = () => {
    router.push('/logis/bl/sea/master/register');
  };

  // 행 클릭 (상세/수정)
  const handleRowClick = (id: string) => {
    router.push(`/logis/bl/sea/master/register?id=${id}`);
  };

  // 삭제
  const handleDelete = async () => {
    if (selectedRows.length === 0) {
      setSelectionAlertMessage('삭제할 항목을 선택해주세요.');
      setShowSelectionAlert(true);
      return;
    }
    if (confirm(`선택한 ${selectedRows.length}개 항목을 삭제하시겠습니까?`)) {
      try {
        for (const id of selectedRows) {
          await fetch(`/api/bl/mbl?id=${id}`, { method: 'DELETE' });
        }
        setSelectedRows([]);
        fetchData();
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }
  };

  // Excel 다운로드
  const handleExcelDownload = () => {
    const exportData = filteredData.map(item => ({
      'O/B Date': item.obDate,
      'A/R Date': item.arDate,
      'M.B/L NO': item.mblNo,
      'Booking NO': item.bookingNo,
      'Line': item.lineName,
      'Vessel': item.vesselName,
      'Voyage': item.voyage,
      'POL': item.pol,
      'POD': item.pod,
      'ETD': item.etd,
      'ETA': item.eta,
      'Freight Term': item.freightTerm,
      'Service Term': item.serviceTerm,
      'H.B/L Count': item.hblCount,
      'Total PKG': item.totalPackage,
      'Total Weight(KG)': item.totalWeight,
      'Total CBM': item.totalCbm,
      'Status': getStatusConfig(item.status).label,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Master BL List');
    XLSX.writeFile(wb, `Master_BL_List_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // 이메일 발송
  const handleEmailClick = () => {
    if (selectedRows.length === 0) {
      setSelectionAlertMessage('이메일을 발송할 항목을 선택해주세요.');
      setShowSelectionAlert(true);
      return;
    }
    setShowEmailModal(true);
  };

  // 출력
  const handlePrint = () => {
    if (selectedRows.length === 0) {
      setSelectionAlertMessage('출력할 항목을 선택해주세요.');
      setShowSelectionAlert(true);
      return;
    }
    const selected = data.find(item => item.id === selectedRows[0]);
    if (selected) {
      setPrintData({
        hblNo: '',
        mblNo: selected.mblNo,
        blDate: new Date().toISOString().split('T')[0],
        shipper: '',
        consignee: '',
        notifyParty: '',
        carrier: selected.lineName || '',
        vessel: selected.vesselName,
        voyage: selected.voyage,
        pol: selected.pol,
        pod: selected.pod,
        etd: selected.etd || '',
        containerNo: '',
        sealNo: '',
        containerType: selected.serviceTerm || '',
        containerQty: 0,
        description: '',
        weight: selected.totalWeight || 0,
        measurement: selected.totalCbm || 0,
        freightTerms: selected.freightTerm === 'PREPAID' ? 'PREPAID' : 'COLLECT',
        placeOfIssue: 'SEOUL, KOREA',
        dateOfIssue: new Date().toISOString().split('T')[0],
      });
      setShowPrintModal(true);
    }
  };

  // 코드 검색 모달 열기
  const openCodeModal = (type: CodeType, target: string) => {
    setCodeModalType(type);
    setCodeModalTarget(target);
    setShowCodeModal(true);
  };

  // 코드 선택
  const handleCodeSelect = (item: CodeItem) => {
    if (codeModalTarget === 'line') {
      setFilters(prev => ({ ...prev, lineCode: item.name }));
    } else if (codeModalTarget === 'shipper') {
      setFilters(prev => ({ ...prev, shipper: item.name }));
    } else if (codeModalTarget === 'consignee') {
      setFilters(prev => ({ ...prev, consignee: item.name }));
    } else if (codeModalTarget === 'notify') {
      setFilters(prev => ({ ...prev, notify: item.name }));
    } else if (codeModalTarget === 'partner') {
      setFilters(prev => ({ ...prev, partner: item.name }));
    }
    setShowCodeModal(false);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="ml-56">
        <Header
          title="Master B/L 관리"
          subtitle="Logis > 해상수출 > Master B/L 관리"
          onClose={handleCloseClick}
        />

        <main className="p-6">
          {/* 검색 영역 */}
          <div className="card mb-6">
            <div
              className="p-4 border-b border-[var(--border)] flex justify-between items-center cursor-pointer"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <h3 className="font-bold flex items-center gap-2">
                <svg className="w-5 h-5 text-[#E8A838]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                검색조건
              </h3>
              <svg
                className={`w-5 h-5 transition-transform ${isSearchOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {isSearchOpen && (
              <div className="p-4">
                <div className="grid grid-cols-6 gap-4 mb-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">O/B Date</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="date"
                        value={filters.obDateFrom}
                        onChange={(e) => handleFilterChange('obDateFrom', e.target.value)}
                        className="flex-1 px-2 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                      />
                      <span className="self-center">~</span>
                      <input
                        type="date"
                        value={filters.obDateTo}
                        onChange={(e) => handleFilterChange('obDateTo', e.target.value)}
                        className="flex-1 px-2 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                      />
                      <DateRangeButtons onRangeSelect={(start, end) => { handleFilterChange('obDateFrom', start); handleFilterChange('obDateTo', end); }} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Booking NO</label>
                    <input
                      type="text"
                      value={filters.bookingNo}
                      onChange={(e) => handleFilterChange('bookingNo', e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                      placeholder="부킹번호"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Line (선사)</label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={filters.lineCode}
                        onChange={(e) => handleFilterChange('lineCode', e.target.value)}
                        className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                        placeholder="선사"
                      />
                      <button
                        onClick={() => openCodeModal('carrier', 'line')}
                        className="px-2 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Vessel</label>
                    <input
                      type="text"
                      value={filters.vessel}
                      onChange={(e) => handleFilterChange('vessel', e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                      placeholder="선박명"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">POL</label>
                    <input
                      type="text"
                      value={filters.pol}
                      onChange={(e) => handleFilterChange('pol', e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                      placeholder="선적항"
                    />
                  </div>
                </div>
                {/* 두 번째 검색 조건 행 */}
                <div className="grid grid-cols-6 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">POD</label>
                    <input
                      type="text"
                      value={filters.pod}
                      onChange={(e) => handleFilterChange('pod', e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                      placeholder="양하항"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Shipper</label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={filters.shipper}
                        onChange={(e) => handleFilterChange('shipper', e.target.value)}
                        className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                        placeholder="송하인"
                      />
                      <button
                        onClick={() => openCodeModal('customer', 'shipper')}
                        className="px-2 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Consignee</label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={filters.consignee}
                        onChange={(e) => handleFilterChange('consignee', e.target.value)}
                        className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                        placeholder="수하인"
                      />
                      <button
                        onClick={() => openCodeModal('customer', 'consignee')}
                        className="px-2 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Notify</label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={filters.notify}
                        onChange={(e) => handleFilterChange('notify', e.target.value)}
                        className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                        placeholder="통지처"
                      />
                      <button
                        onClick={() => openCodeModal('customer', 'notify')}
                        className="px-2 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Partner</label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={filters.partner}
                        onChange={(e) => handleFilterChange('partner', e.target.value)}
                        className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                        placeholder="파트너"
                      />
                      <button
                        onClick={() => openCodeModal('customer', 'partner')}
                        className="px-2 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">CTNR NO.</label>
                    <input
                      type="text"
                      value={filters.ctnrNo}
                      onChange={(e) => handleFilterChange('ctnrNo', e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                      placeholder="컨테이너번호"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">License No.</label>
                    <input
                      type="text"
                      value={filters.licenseNo}
                      onChange={(e) => handleFilterChange('licenseNo', e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                      placeholder="라이센스번호"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
                  >
                    초기화
                  </button>
                  <button
                    onClick={() => setCurrentPage(1)}
                    className="px-6 py-2 bg-[#E8A838] text-[#0C1222] font-semibold rounded-lg hover:bg-[#D4943A]"
                  >
                    검색
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 버튼 영역 */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--muted)]">
                총 <span className="font-bold text-[var(--foreground)]">{filteredData.length}</span>건
              </span>
            </div>
            <div className="flex gap-2">
              <ActionButton variant="primary" onClick={handleNew}>신규</ActionButton>
              <ActionButton variant="danger" onClick={handleDelete}>삭제</ActionButton>
              <ActionButton variant="secondary" onClick={handleExcelDownload}>Excel</ActionButton>
              <ActionButton variant="secondary" onClick={handleEmailClick}>E-mail</ActionButton>
              <ActionButton variant="secondary" onClick={handlePrint}>출력</ActionButton>
            </div>
          </div>

          {/* 목록 테이블 */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--surface-100)]">
                  <tr>
                    <th className="p-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="p-3 text-left text-sm font-medium cursor-pointer" onClick={() => handleSort('obDate')}>
                      O/B Date {sortField === 'obDate' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="p-3 text-left text-sm font-medium cursor-pointer" onClick={() => handleSort('mblNo')}>
                      M.B/L NO {sortField === 'mblNo' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="p-3 text-left text-sm font-medium">Booking NO</th>
                    <th className="p-3 text-left text-sm font-medium">Line</th>
                    <th className="p-3 text-left text-sm font-medium">Vessel / Voyage</th>
                    <th className="p-3 text-center text-sm font-medium">POL</th>
                    <th className="p-3 text-center text-sm font-medium">POD</th>
                    <th className="p-3 text-center text-sm font-medium">ETD</th>
                    <th className="p-3 text-center text-sm font-medium">H.B/L</th>
                    <th className="p-3 text-right text-sm font-medium">Total PKG</th>
                    <th className="p-3 text-right text-sm font-medium">Weight(KG)</th>
                    <th className="p-3 text-center text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="p-8 text-center text-[var(--muted)]">
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((item) => {
                      const status = getStatusConfig(item.status);
                      return (
                        <tr
                          key={item.id}
                          className="border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer"
                          onClick={() => handleRowClick(item.id)}
                        >
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedRows.includes(item.id)}
                              onChange={() => handleRowSelect(item.id)}
                              className="rounded"
                            />
                          </td>
                          <td className="p-3 text-sm">{item.obDate}</td>
                          <td className="p-3 text-sm font-medium text-[#E8A838]">{item.mblNo}</td>
                          <td className="p-3 text-sm">{item.bookingNo}</td>
                          <td className="p-3 text-sm">{item.lineName}</td>
                          <td className="p-3 text-sm">{item.vesselName} / {item.voyage}</td>
                          <td className="p-3 text-sm text-center">{item.pol}</td>
                          <td className="p-3 text-sm text-center">{item.pod}</td>
                          <td className="p-3 text-sm text-center">{item.etd}</td>
                          <td className="p-3 text-sm text-center font-medium text-[#3B82F6]">{item.hblCount}</td>
                          <td className="p-3 text-sm text-right">{item.totalPackage.toLocaleString()}</td>
                          <td className="p-3 text-sm text-right">{item.totalWeight.toLocaleString()}</td>
                          <td className="p-3 text-center">
                            <span
                              className="px-2 py-1 text-xs rounded-full"
                              style={{ color: status.color, backgroundColor: status.bgColor }}
                            >
                              {status.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-[var(--border)] flex justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded border border-[var(--border)] disabled:opacity-50"
                >
                  &laquo;
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded border border-[var(--border)] disabled:opacity-50"
                >
                  &lt;
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
                  if (page > totalPages) return null;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded border ${
                        currentPage === page
                          ? 'bg-[#E8A838] text-[#0C1222] border-[#E8A838]'
                          : 'border-[var(--border)]'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded border border-[var(--border)] disabled:opacity-50"
                >
                  &gt;
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded border border-[var(--border)] disabled:opacity-50"
                >
                  &raquo;
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 모달들 */}
      <CloseConfirmModal
        isOpen={showCloseModal}
        onConfirm={handleConfirm}
        onClose={() => setShowCloseModal(false)}
      />

      <SelectionAlertModal
        isOpen={showSelectionAlert}
        onClose={() => setShowSelectionAlert(false)}
        message={selectionAlertMessage}
      />

      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSend={() => {
          alert('이메일이 발송되었습니다.');
          setShowEmailModal(false);
        }}
        documentType="bl"
        documentNo={selectedRows.length > 0 ? data.find(d => d.id === selectedRows[0])?.mblNo || '' : ''}
      />

      <CodeSearchModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        onSelect={handleCodeSelect}
        codeType={codeModalType}
      />

      {printData && (
        <BLPrintModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          blData={printData}
        />
      )}
    </div>
  );
}
