'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { LIST_PATHS } from '@/constants/paths';
import AWBPrintModal from '@/components/AWBPrintModal';
import SelectionAlertModal from '@/components/SelectionAlertModal';
import EmailModal from '@/components/EmailModal';
import CodeSearchModal, { CodeType, CodeItem } from '@/components/popup/CodeSearchModal';
import SearchFilterPanel, {
  SearchFilterGrid,
  SearchFilterField,
  DateRangeField,
  SearchInputField,
  SelectField,
  TextField,
} from '@/components/search/SearchFilterPanel';
import DateRangeButtons, { getToday } from '@/components/DateRangeButtons';

// 화면설계서 UI-G-01-07-05 기준 검색조건 인터페이스
interface SearchFilters {
  ioType: string;              // 수출입구분 (IN/OUT)
  obDateFrom: string;          // O/B.Date 시작
  obDateTo: string;            // O/B.Date 종료
  arDateFrom: string;          // A/R.Date 시작
  arDateTo: string;            // A/R.Date 종료
  shipperCode: string;         // Shipper
  consigneeCode: string;       // Consignee
  notifyCode: string;          // Notify
  partnerCode: string;         // Partner
  destination: string;         // Destination
  flightNo: string;            // Flight No.
  inputEmployee: string;       // 입력사원
  branchType: string;          // 본지사
  salesMan: string;            // Sales Man
}

// 화면설계서 UI-G-01-07-05 기준 목록 데이터 인터페이스
interface AirAWB {
  id: string;
  obDate: string;              // O/B.Date
  arDate: string;              // A/R.Date
  jobNo: string;               // JOB.NO.
  mawbNo: string;              // MAWB NO.
  hawbNo: string;              // HAWB NO.
  lcNo: string;                // L/C NO.
  poNo: string;                // P/O NO.
  type: string;                // TYPE
  dc: string;                  // D/C
  ln: string;                  // L/N
  pc: string;                  // PC (Prepaid/Collect)
  inco: string;                // INCO (인코텀즈)
  // 추가 정보
  shipperName?: string;
  consigneeName?: string;
  departure?: string;
  arrival?: string;
  flightNo?: string;
  ioType?: string;
  status?: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: '작성중', color: '#6B7280', bgColor: '#F3F4F6' },
  ISSUED: { label: '발행완료', color: '#059669', bgColor: '#D1FAE5' },
  SENT: { label: '전송완료', color: '#2563EB', bgColor: '#DBEAFE' },
  DELIVERED: { label: '배달완료', color: '#7C3AED', bgColor: '#EDE9FE' },
};

const getStatusConfig = (status: string) => {
  return statusConfig[status] || { label: status || '미정', color: '#6B7280', bgColor: '#F3F4F6' };
};

// 샘플 데이터 - 화면설계서 기준
const initialSampleData: AirAWB[] = [
  { id: '1', obDate: '2026-01-20', arDate: '2026-01-21', jobNo: 'AEX-2026-0001', mawbNo: '180-12345670', hawbNo: 'HAWB2026010001', lcNo: 'LC2026-001', poNo: 'PO-001', type: 'ORI', dc: 'D', ln: 'L', pc: 'P', inco: 'FOB', shipperName: '삼성전자', consigneeName: 'ABC Corp', departure: 'ICN', arrival: 'LAX', flightNo: 'KE001', ioType: 'OUT', status: 'ISSUED' },
  { id: '2', obDate: '2026-01-18', arDate: '2026-01-19', jobNo: 'AEX-2026-0002', mawbNo: '180-98765432', hawbNo: 'HAWB2026010002', lcNo: '', poNo: 'PO-002', type: 'SWB', dc: 'D', ln: 'L', pc: 'C', inco: 'CFR', shipperName: 'LG전자', consigneeName: 'XYZ Ltd', departure: 'ICN', arrival: 'FRA', flightNo: 'LH711', ioType: 'OUT', status: 'DRAFT' },
  { id: '3', obDate: '2026-01-15', arDate: '2026-01-16', jobNo: 'AIM-2026-0001', mawbNo: '618-11223344', hawbNo: 'HAWB2026010003', lcNo: 'LC2026-003', poNo: '', type: 'ORI', dc: 'C', ln: 'N', pc: 'P', inco: 'CIF', shipperName: '현대자동차', consigneeName: 'DEF Inc', departure: 'LAX', arrival: 'ICN', flightNo: 'KE002', ioType: 'IN', status: 'SENT' },
  { id: '4', obDate: '2026-01-12', arDate: '2026-01-13', jobNo: 'AEX-2026-0003', mawbNo: '988-55667788', hawbNo: 'HAWB2026010004', lcNo: '', poNo: 'PO-004', type: 'TLX', dc: 'D', ln: 'L', pc: 'P', inco: 'EXW', shipperName: 'SK하이닉스', consigneeName: 'GHI Corp', departure: 'ICN', arrival: 'NRT', flightNo: 'OZ101', ioType: 'OUT', status: 'DELIVERED' },
  { id: '5', obDate: '2026-01-10', arDate: '2026-01-11', jobNo: 'AIM-2026-0002', mawbNo: '160-99887766', hawbNo: 'HAWB2026010005', lcNo: 'LC2026-005', poNo: 'PO-005', type: 'ORI', dc: 'C', ln: 'L', pc: 'C', inco: 'DDP', shipperName: '포스코', consigneeName: 'JKL Ltd', departure: 'PVG', arrival: 'ICN', flightNo: 'CA123', ioType: 'IN', status: 'ISSUED' },
];

const today = getToday();
const initialFilters: SearchFilters = {
  ioType: '',
  obDateFrom: today,
  obDateTo: today,
  arDateFrom: '',
  arDateTo: '',
  shipperCode: '',
  consigneeCode: '',
  notifyCode: '',
  partnerCode: '',
  destination: '',
  flightNo: '',
  inputEmployee: '',
  branchType: '',
  salesMan: '',
};

// MAWB Check Digit 검증 (11자리)
const validateMAWBCheckDigit = (mawbNo: string): boolean => {
  const cleaned = mawbNo.replace(/-/g, '');
  if (cleaned.length !== 11) return false;
  const serial = cleaned.substring(3, 10);
  const checkDigit = parseInt(cleaned.substring(10));
  return (parseInt(serial) % 7) === checkDigit;
};

export default function BLAirPage() {
  const router = useRouter();
  const [allData, setAllData] = useState<AirAWB[]>(initialSampleData);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(initialFilters);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedRow, setSelectedRow] = useState<AirAWB | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printHawbId, setPrintHawbId] = useState<number | undefined>(undefined);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSelectionAlert, setShowSelectionAlert] = useState(false);

  // 검색 팝업 상태
  const [showCodeSearchModal, setShowCodeSearchModal] = useState(false);
  const [searchModalType, setSearchModalType] = useState<CodeType>('customer');
  const [searchTargetField, setSearchTargetField] = useState<keyof SearchFilters>('shipperCode');

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

  // API에서 데이터 조회
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/bl/air');
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setAllData(data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch AWB data:', error);
      }
    };
    fetchData();
  }, []);

  const filteredList = useMemo(() => {
    return allData.filter(item => {
      if (appliedFilters.ioType && item.ioType !== appliedFilters.ioType) return false;
      if (appliedFilters.obDateFrom && item.obDate < appliedFilters.obDateFrom) return false;
      if (appliedFilters.obDateTo && item.obDate > appliedFilters.obDateTo) return false;
      if (appliedFilters.arDateFrom && item.arDate < appliedFilters.arDateFrom) return false;
      if (appliedFilters.arDateTo && item.arDate > appliedFilters.arDateTo) return false;
      if (appliedFilters.shipperCode && !item.shipperName?.toLowerCase().includes(appliedFilters.shipperCode.toLowerCase())) return false;
      if (appliedFilters.consigneeCode && !item.consigneeName?.toLowerCase().includes(appliedFilters.consigneeCode.toLowerCase())) return false;
      if (appliedFilters.destination && !item.arrival?.toLowerCase().includes(appliedFilters.destination.toLowerCase())) return false;
      if (appliedFilters.flightNo && !item.flightNo?.toLowerCase().includes(appliedFilters.flightNo.toLowerCase())) return false;
      return true;
    });
  }, [allData, appliedFilters]);

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

  // 검색 팝업 열기
  const openCodeSearchModal = (codeType: CodeType, targetField: keyof SearchFilters) => {
    setSearchModalType(codeType);
    setSearchTargetField(targetField);
    setShowCodeSearchModal(true);
  };

  // 검색 팝업에서 선택 처리
  const handleCodeSelect = (item: CodeItem) => {
    setFilters(prev => ({ ...prev, [searchTargetField]: item.name || item.code }));
    setShowCodeSearchModal(false);
  };

  const handleRowSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const handleSelectAll = () => {
    selectedIds.size === filteredList.length
      ? setSelectedIds(new Set())
      : setSelectedIds(new Set(filteredList.map(i => i.id)));
  };

  const handleRowClick = (item: AirAWB) => {
    setSelectedRow(item);
  };

  const handleRowDoubleClick = (item: AirAWB) => {
    router.push(`/logis/bl/air/${item.id}`);
  };

  // 신규 등록
  const handleNew = () => {
    router.push('/logis/bl/air/register');
  };

  // 수정
  const handleEdit = () => {
    if (selectedIds.size !== 1) {
      alert('수정할 항목을 1개 선택해주세요.');
      return;
    }
    const id = Array.from(selectedIds)[0];
    router.push(`/logis/bl/air/register?id=${id}`);
  };

  // 삭제
  const handleDelete = async () => {
    if (selectedIds.size === 0) {
      alert('삭제할 항목을 선택해주세요.');
      return;
    }
    const issued = allData.filter(d => selectedIds.has(d.id) && d.status === 'ISSUED');
    if (issued.length > 0) {
      alert('발행완료 상태의 AWB는 삭제할 수 없습니다.');
      return;
    }
    if (confirm(`${selectedIds.size}건을 삭제하시겠습니까?`)) {
      try {
        const ids = Array.from(selectedIds).join(',');
        const response = await fetch(`/api/bl/air?ids=${ids}`, { method: 'DELETE' });
        if (response.ok) {
          setAllData(prev => prev.filter(d => !selectedIds.has(d.id)));
          setSelectedIds(new Set());
          setSelectedRow(null);
          alert('삭제되었습니다.');
        }
      } catch (error) {
        console.error('Delete error:', error);
        setAllData(prev => prev.filter(d => !selectedIds.has(d.id)));
        setSelectedIds(new Set());
        setSelectedRow(null);
      }
    }
  };

  // 출력
  const handlePrint = () => {
    if (selectedIds.size === 0) {
      setShowSelectionAlert(true);
      return;
    }
    const firstSelectedId = Array.from(selectedIds)[0];
    setPrintHawbId(Number(firstSelectedId));
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
      title="AWB 조회 (항공)"
      subtitle="HOME > 선적관리 > B/L 관리(항공) > AWB 조회"
      showCloseButton={false}
    >
        <main className="p-6">
          {/* 상단 버튼 영역 */}
          <div className="flex justify-end items-center mb-4">
            <div className="flex gap-2">
              <button onClick={handleNew} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)] font-medium">
                신규
              </button>
              <button onClick={handleEdit} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                수정
              </button>
              <button onClick={handleDelete} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                삭제
              </button>
              <button onClick={handlePrint} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                출력
              </button>
              <button onClick={handleEmail} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                E-mail
              </button>
              <button onClick={handleExcel} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                Excel
              </button>
            </div>
          </div>

          {/* 검색조건 - 통일된 SearchFilterPanel 컴포넌트 사용 */}
          <SearchFilterPanel
            title="검색조건"
            onSearch={handleSearch}
            onReset={handleReset}
            className="mb-6"
          >
            {/* 첫 번째 행: O/B.Date, A/R.Date, 업무구분, 수출입구분 */}
            <SearchFilterGrid columns={6} className="mb-4">
              <SearchFilterField label="O/B.Date" colSpan={2}>
                <DateRangeField
                  startValue={filters.obDateFrom}
                  endValue={filters.obDateTo}
                  onStartChange={(v) => handleFilterChange('obDateFrom', v)}
                  onEndChange={(v) => handleFilterChange('obDateTo', v)}
                />
                <DateRangeButtons onRangeSelect={(start, end) => { handleFilterChange('obDateFrom', start); handleFilterChange('obDateTo', end); }} />
              </SearchFilterField>

              <SearchFilterField label="A/R.Date" colSpan={2}>
                <DateRangeField
                  startValue={filters.arDateFrom}
                  endValue={filters.arDateTo}
                  onStartChange={(v) => handleFilterChange('arDateFrom', v)}
                  onEndChange={(v) => handleFilterChange('arDateTo', v)}
                />
                <DateRangeButtons onRangeSelect={(start, end) => { handleFilterChange('arDateFrom', start); handleFilterChange('arDateTo', end); }} />
              </SearchFilterField>

              <SearchFilterField label="업무구분">
                <TextField value="항공" onChange={() => {}} readOnly />
              </SearchFilterField>

              <SearchFilterField label="수출입구분">
                <SelectField
                  value={filters.ioType}
                  onChange={(v) => handleFilterChange('ioType', v)}
                  options={[
                    { value: 'OUT', label: '수출(OUT)' },
                    { value: 'IN', label: '수입(IN)' },
                  ]}
                />
              </SearchFilterField>
            </SearchFilterGrid>

            {/* 두 번째 행: Shipper, Consignee, Destination, Flight No., 입력사원, 본지사 */}
            <SearchFilterGrid columns={6}>
              <SearchFilterField label="Shipper">
                <SearchInputField
                  value={filters.shipperCode}
                  onChange={(v) => handleFilterChange('shipperCode', v)}
                  onSearchClick={() => openCodeSearchModal('customer', 'shipperCode')}
                  placeholder="Shipper"
                />
              </SearchFilterField>

              <SearchFilterField label="Consignee">
                <SearchInputField
                  value={filters.consigneeCode}
                  onChange={(v) => handleFilterChange('consigneeCode', v)}
                  onSearchClick={() => openCodeSearchModal('customer', 'consigneeCode')}
                  placeholder="Consignee"
                />
              </SearchFilterField>

              <SearchFilterField label="Destination">
                <SearchInputField
                  value={filters.destination}
                  onChange={(v) => handleFilterChange('destination', v)}
                  onSearchClick={() => openCodeSearchModal('airport', 'destination')}
                  placeholder="Airport Code"
                />
              </SearchFilterField>

              <SearchFilterField label="Flight No.">
                <SearchInputField
                  value={filters.flightNo}
                  onChange={(v) => handleFilterChange('flightNo', v)}
                  onSearchClick={() => openCodeSearchModal('airline', 'flightNo')}
                  placeholder="Flight No."
                />
              </SearchFilterField>

              <SearchFilterField label="입력사원">
                <TextField
                  value={filters.inputEmployee}
                  onChange={(v) => handleFilterChange('inputEmployee', v)}
                  placeholder="입력사원"
                />
              </SearchFilterField>

              <SearchFilterField label="본지사">
                <SelectField
                  value={filters.branchType}
                  onChange={(v) => handleFilterChange('branchType', v)}
                  options={[
                    { value: 'HEAD', label: '본사' },
                    { value: 'BRANCH', label: '지사' },
                  ]}
                />
              </SearchFilterField>
            </SearchFilterGrid>
          </SearchFilterPanel>

          {/* 목록 테이블 - 화면설계서 UI-G-01-07-05 기준 */}
          <div className="card mb-6">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h3 className="font-bold">AWB 목록</h3>
                <span className="px-2 py-1 bg-[#E8A838]/20 text-[#E8A838] rounded text-sm font-medium">
                  {filteredList.length}건
                </span>
              </div>
              {selectedIds.size > 0 && (
                <button onClick={() => setSelectedIds(new Set())} className="text-sm text-[var(--muted)] hover:text-white">
                  선택 해제 ({selectedIds.size}건)
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-12">
                      <input
                        type="checkbox"
                        checked={filteredList.length > 0 && selectedIds.size === filteredList.length}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="p-3 text-center text-sm font-semibold">No</th>
                    <th className="p-3 text-center text-sm font-semibold">O/B.Date</th>
                    <th className="p-3 text-center text-sm font-semibold">A/R.Date</th>
                    <th className="p-3 text-center text-sm font-semibold">JOB.NO.</th>
                    <th className="p-3 text-center text-sm font-semibold">MAWB NO.</th>
                    <th className="p-3 text-center text-sm font-semibold">HAWB NO.</th>
                    <th className="p-3 text-center text-sm font-semibold">L/C NO.</th>
                    <th className="p-3 text-center text-sm font-semibold">P/O NO.</th>
                    <th className="p-3 text-center text-sm font-semibold">TYPE</th>
                    <th className="p-3 text-center text-sm font-semibold">D/C</th>
                    <th className="p-3 text-center text-sm font-semibold">L/N</th>
                    <th className="p-3 text-center text-sm font-semibold">PC</th>
                    <th className="p-3 text-center text-sm font-semibold">INCO</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="p-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <svg className="w-12 h-12 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-[var(--muted)]">조회된 데이터가 없습니다.</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredList.map((row, index) => (
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
                      <td className="p-3 text-center text-sm text-[var(--muted)]">{row.obDate}</td>
                      <td className="p-3 text-center text-sm text-[var(--muted)]">{row.arDate}</td>
                      <td className="p-3 text-center">
                        <span className="text-[#E8A838] font-medium hover:underline">{row.jobNo}</span>
                      </td>
                      <td className="p-3 text-sm text-center font-medium">{row.mawbNo}</td>
                      <td className="p-3 text-sm text-center font-medium">{row.hawbNo}</td>
                      <td className="p-3 text-sm text-center">{row.lcNo || '-'}</td>
                      <td className="p-3 text-sm text-center">{row.poNo || '-'}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs font-medium">
                          {row.type}
                        </span>
                      </td>
                      <td className="p-3 text-center text-sm">{row.dc}</td>
                      <td className="p-3 text-center text-sm">{row.ln}</td>
                      <td className="p-3 text-center text-sm">{row.pc}</td>
                      <td className="p-3 text-center text-sm">{row.inco}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 선택된 AWB 상세 정보 */}
          {selectedRow && (
            <div className="card">
              <div className="p-4 border-b border-[var(--border)]">
                <h3 className="font-bold">선택된 AWB 정보</h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <span className="text-sm text-[var(--muted)]">JOB NO.</span>
                    <p className="font-medium">{selectedRow.jobNo}</p>
                  </div>
                  <div>
                    <span className="text-sm text-[var(--muted)]">MAWB NO.</span>
                    <p className="font-medium">{selectedRow.mawbNo}</p>
                  </div>
                  <div>
                    <span className="text-sm text-[var(--muted)]">HAWB NO.</span>
                    <p className="font-medium">{selectedRow.hawbNo}</p>
                  </div>
                  <div>
                    <span className="text-sm text-[var(--muted)]">상태</span>
                    <p>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{ color: getStatusConfig(selectedRow.status || '').color, backgroundColor: getStatusConfig(selectedRow.status || '').bgColor }}
                      >
                        {getStatusConfig(selectedRow.status || '').label}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-[var(--muted)]">Shipper</span>
                    <p className="font-medium">{selectedRow.shipperName || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-[var(--muted)]">Consignee</span>
                    <p className="font-medium">{selectedRow.consigneeName || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-[var(--muted)]">출발지</span>
                    <p className="font-medium">{selectedRow.departure || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-[var(--muted)]">도착지</span>
                    <p className="font-medium">{selectedRow.arrival || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      <CloseConfirmModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onConfirm={handleConfirmClose}
      />

      <AWBPrintModal
        isOpen={showPrintModal}
        onClose={() => { setShowPrintModal(false); setPrintHawbId(undefined); }}
        awbData={null}
        hawbId={printHawbId}
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
        documentType="awb"
        documentNo={selectedRow?.hawbNo || ''}
      />

      <CodeSearchModal
        isOpen={showCodeSearchModal}
        onClose={() => setShowCodeSearchModal(false)}
        onSelect={handleCodeSelect}
        codeType={searchModalType}
      />
    </PageLayout>
  );
}
