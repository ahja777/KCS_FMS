'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { LIST_PATHS } from '@/constants/paths';
import SelectionAlertModal from '@/components/SelectionAlertModal';
import EmailModal from '@/components/EmailModal';
import CodeSearchModal, { CodeType, CodeItem } from '@/components/popup/CodeSearchModal';
import BLPrintModal, { BLData as PrintBLData } from '@/components/BLPrintModal';
import { ActionButton } from '@/components/buttons';

// House B/L 검색조건 인터페이스
interface SearchFilters {
  ioType: string;
  obDateFrom: string;
  obDateTo: string;
  arDateFrom: string;
  arDateTo: string;
  shipperCode: string;
  consigneeCode: string;
  notifyCode: string;
  lineCode: string;
  partnerCode: string;
  loadingPort: string;
  businessType: string;
  mblNo: string;
  vessel: string;
  inputEmployee: string;
}

// House B/L 목록 데이터 인터페이스
interface HouseBL {
  id: string;
  obDate: string;
  arDate: string;
  jobNo: string;
  srNo: string;
  mblNo: string;
  hblNo: string;
  lcNo: string;
  poNo: string;
  type: string;
  dc: string;
  ln: string;
  pc: string;
  inco: string;
  shipperName?: string;
  consigneeName?: string;
  pol?: string;
  pod?: string;
  vesselVoyage?: string;
  ioType?: string;
  status?: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: '작성중', color: '#6B7280', bgColor: '#F3F4F6' },
  ISSUED: { label: '발행완료', color: '#059669', bgColor: '#D1FAE5' },
  SURRENDERED: { label: 'Surrendered', color: '#2563EB', bgColor: '#DBEAFE' },
  RELEASED: { label: 'Released', color: '#7C3AED', bgColor: '#EDE9FE' },
};

const getStatusConfig = (status: string) => {
  return statusConfig[status] || { label: status || '미정', color: '#6B7280', bgColor: '#F3F4F6' };
};


const initialFilters: SearchFilters = {
  ioType: 'OUT',
  obDateFrom: '',
  obDateTo: '',
  arDateFrom: '',
  arDateTo: '',
  shipperCode: '',
  consigneeCode: '',
  notifyCode: '',
  lineCode: '',
  partnerCode: '',
  loadingPort: '',
  businessType: '',
  mblNo: '',
  vessel: '',
  inputEmployee: '',
};

export default function HouseBLListPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [data, setData] = useState<HouseBL[]>([]);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(true);

  // 모달 상태
  const [showSelectionAlert, setShowSelectionAlert] = useState(false);
  const [selectionAlertMessage, setSelectionAlertMessage] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeModalType, setCodeModalType] = useState<CodeType>('customer');
  const [codeModalTarget, setCodeModalTarget] = useState<string>('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printData, setPrintData] = useState<PrintBLData | null>(null);

  // 정렬 상태
  const [sortField, setSortField] = useState<keyof HouseBL>('obDate');
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
    try {
      const res = await fetch('/api/bl/hbl?direction=EXPORT');
      if (res.ok) {
        const rows = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: HouseBL[] = rows.map((r: any) => ({
          id: String(r.hbl_id),
          obDate: r.etd_dt || '',
          arDate: r.eta_dt || '',
          jobNo: r.hbl_no || '',
          srNo: '',
          mblNo: r.mbl_no || '',
          hblNo: r.hbl_no || '',
          lcNo: '',
          poNo: '',
          type: r.bl_type_cd || 'ORI',
          dc: 'D',
          ln: 'L',
          pc: r.freight_term_cd === 'PREPAID' ? 'P' : 'C',
          inco: '',
          shipperName: r.shipper_nm || '',
          consigneeName: r.consignee_nm || '',
          pol: r.pol_port_cd || '',
          pod: r.pod_port_cd || '',
          vesselVoyage: [r.vessel_nm, r.voyage_no].filter(Boolean).join(' / '),
          ioType: 'OUT',
          status: r.status_cd || 'DRAFT',
        }));
        setData(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch House B/L:', err);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (filters.ioType && item.ioType !== filters.ioType) return false;
      if (filters.mblNo && !item.mblNo?.toLowerCase().includes(filters.mblNo.toLowerCase())) return false;
      if (filters.shipperCode && !item.shipperName?.toLowerCase().includes(filters.shipperCode.toLowerCase())) return false;
      if (filters.consigneeCode && !item.consigneeName?.toLowerCase().includes(filters.consigneeCode.toLowerCase())) return false;
      if (filters.vessel && !item.vesselVoyage?.toLowerCase().includes(filters.vessel.toLowerCase())) return false;
      if (filters.loadingPort && item.pol !== filters.loadingPort) return false;
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
  const handleSort = (field: keyof HouseBL) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 신규 등록
  const handleNew = () => {
    router.push('/logis/bl/sea/house/register');
  };

  // 행 클릭 (상세/수정)
  const handleRowClick = (id: string) => {
    router.push(`/logis/bl/sea/house/register?id=${id}`);
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
          await fetch(`/api/bl/hbl?id=${id}`, { method: 'DELETE' });
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
      'JOB NO': item.jobNo,
      'S/R NO': item.srNo,
      'M.B/L NO': item.mblNo,
      'H.B/L NO': item.hblNo,
      'L/C NO': item.lcNo,
      'P/O NO': item.poNo,
      'TYPE': item.type,
      'D/C': item.dc,
      'L/N': item.ln,
      'P/C': item.pc,
      'INCO': item.inco,
      'Shipper': item.shipperName,
      'Consignee': item.consigneeName,
      'POL': item.pol,
      'POD': item.pod,
      'Vessel/Voyage': item.vesselVoyage,
      'Status': getStatusConfig(item.status || '').label,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'House BL List');
    XLSX.writeFile(wb, `House_BL_List_${new Date().toISOString().split('T')[0]}.xlsx`);
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
        hblNo: selected.hblNo,
        mblNo: selected.mblNo || '',
        blDate: new Date().toISOString().split('T')[0],
        shipper: selected.shipperName || '',
        consignee: selected.consigneeName || '',
        notifyParty: '',
        carrier: '',
        vessel: selected.vesselVoyage?.split('/')[0]?.trim() || '',
        voyage: selected.vesselVoyage?.split('/')[1]?.trim() || '',
        pol: selected.pol || '',
        pod: selected.pod || '',
        etd: selected.obDate || '',
        containerNo: '',
        sealNo: '',
        containerType: '',
        containerQty: 0,
        description: '',
        weight: 0,
        measurement: 0,
        freightTerms: selected.pc === 'P' ? 'PREPAID' : 'COLLECT',
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
    if (codeModalTarget === 'shipper') {
      setFilters(prev => ({ ...prev, shipperCode: item.name }));
    } else if (codeModalTarget === 'consignee') {
      setFilters(prev => ({ ...prev, consigneeCode: item.name }));
    } else if (codeModalTarget === 'line') {
      setFilters(prev => ({ ...prev, lineCode: item.name }));
    }
    setShowCodeModal(false);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="ml-72">
        <Header
          title="House B/L 관리"
          subtitle="Logis 
        onClose={() => setShowCloseModal(true)}> 해상수출 > House B/L 관리"
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
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">수출입구분</label>
                    <select
                      value={filters.ioType}
                      onChange={(e) => handleFilterChange('ioType', e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                    >
                      <option value="">전체</option>
                      <option value="OUT">수출</option>
                      <option value="IN">수입</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">O/B Date</label>
                    <div className="flex gap-1">
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
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">M.B/L NO</label>
                    <input
                      type="text"
                      value={filters.mblNo}
                      onChange={(e) => handleFilterChange('mblNo', e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                      placeholder="Master B/L 번호"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Shipper</label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={filters.shipperCode}
                        onChange={(e) => handleFilterChange('shipperCode', e.target.value)}
                        className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                        placeholder="화주"
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
                        value={filters.consigneeCode}
                        onChange={(e) => handleFilterChange('consigneeCode', e.target.value)}
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
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Vessel</label>
                    <input
                      type="text"
                      value={filters.vessel}
                      onChange={(e) => handleFilterChange('vessel', e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                      placeholder="선박명"
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
                    <th className="p-3 text-left text-sm font-medium cursor-pointer" onClick={() => handleSort('jobNo')}>
                      JOB NO {sortField === 'jobNo' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="p-3 text-left text-sm font-medium">S/R NO</th>
                    <th className="p-3 text-left text-sm font-medium">M.B/L NO</th>
                    <th className="p-3 text-left text-sm font-medium cursor-pointer" onClick={() => handleSort('hblNo')}>
                      H.B/L NO {sortField === 'hblNo' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="p-3 text-center text-sm font-medium">TYPE</th>
                    <th className="p-3 text-center text-sm font-medium">P/C</th>
                    <th className="p-3 text-left text-sm font-medium">Shipper</th>
                    <th className="p-3 text-left text-sm font-medium">Consignee</th>
                    <th className="p-3 text-center text-sm font-medium">POL</th>
                    <th className="p-3 text-center text-sm font-medium">POD</th>
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
                      const status = getStatusConfig(item.status || '');
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
                          <td className="p-3 text-sm font-medium text-[#E8A838]">{item.jobNo}</td>
                          <td className="p-3 text-sm">{item.srNo}</td>
                          <td className="p-3 text-sm">{item.mblNo}</td>
                          <td className="p-3 text-sm font-medium text-[#3B82F6]">{item.hblNo}</td>
                          <td className="p-3 text-sm text-center">{item.type}</td>
                          <td className="p-3 text-sm text-center">{item.pc}</td>
                          <td className="p-3 text-sm">{item.shipperName}</td>
                          <td className="p-3 text-sm">{item.consigneeName}</td>
                          <td className="p-3 text-sm text-center">{item.pol}</td>
                          <td className="p-3 text-sm text-center">{item.pod}</td>
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
        documentNo={selectedRows.length > 0 ? data.find(d => d.id === selectedRows[0])?.hblNo || '' : ''}
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
