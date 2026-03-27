'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import SelectionAlertModal from '@/components/SelectionAlertModal';
import EmailModal from '@/components/EmailModal';
import CodeSearchModal, { CodeType, CodeItem } from '@/components/popup/CodeSearchModal';
import AWBPrintModal from '@/components/AWBPrintModal';
import { ActionButton } from '@/components/buttons';
import DateRangeButtons, { getToday } from '@/components/DateRangeButtons';

interface SearchFilters {
  ioType: string;
  obDateFrom: string;
  obDateTo: string;
  airlineCode: string;
  mawbNo: string;
  flightNo: string;
  shipper: string;
  consignee: string;
  notify: string;
  partner: string;
  destination: string;
  licenseNo: string;
  salesMan: string;
}

interface MasterAWB {
  id: string;
  obDate: string;
  arDate: string;
  jobNo: string;
  mawbNo: string;
  airlineCode: string;
  airlineName: string;
  hawbCount: number;
  totalPieces: number;
  totalWeight: number;
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

const initialSampleData: MasterAWB[] = [
  { id: '1', obDate: '2026-01-15', arDate: '2026-01-16', jobNo: 'AIM-2026-0001', mawbNo: '618-11223344', airlineCode: 'KE', airlineName: 'KOREAN AIR', hawbCount: 3, totalPieces: 120, totalWeight: 1800, departure: 'LAX', arrival: 'ICN', flightNo: 'KE002', ioType: 'IN', status: 'ISSUED' },
  { id: '2', obDate: '2026-01-10', arDate: '2026-01-11', jobNo: 'AIM-2026-0002', mawbNo: '160-99887766', airlineCode: 'CA', airlineName: 'AIR CHINA', hawbCount: 2, totalPieces: 80, totalWeight: 1200, departure: 'PVG', arrival: 'ICN', flightNo: 'CA123', ioType: 'IN', status: 'DELIVERED' },
  { id: '3', obDate: '2026-01-08', arDate: '2026-01-09', jobNo: 'AIM-2026-0003', mawbNo: '205-44556677', airlineCode: 'NH', airlineName: 'ANA', hawbCount: 4, totalPieces: 150, totalWeight: 2500, departure: 'NRT', arrival: 'ICN', flightNo: 'NH861', ioType: 'IN', status: 'DRAFT' },
];

const today = getToday();
const initialFilters: SearchFilters = {
  ioType: 'IN',
  obDateFrom: today,
  obDateTo: today,
  airlineCode: '',
  mawbNo: '',
  flightNo: '',
  shipper: '',
  consignee: '',
  notify: '',
  partner: '',
  destination: '',
  licenseNo: '',
  salesMan: '',
};

export default function ImportMasterAWBListPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [data, setData] = useState<MasterAWB[]>([]);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(true);

  const [showSelectionAlert, setShowSelectionAlert] = useState(false);
  const [selectionAlertMessage, setSelectionAlertMessage] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeModalType, setCodeModalType] = useState<CodeType>('airline');
  const [codeModalTarget, setCodeModalTarget] = useState<string>('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printMawbId, setPrintMawbId] = useState<number | undefined>(undefined);

  const [sortField, setSortField] = useState<keyof MasterAWB>('obDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // API에서 데이터 로드
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/bl/air/master?ioType=IN');
      if (res.ok) {
        const rows = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: MasterAWB[] = rows.map((r: any) => ({
          id: String(r.ID),
          obDate: r.OB_DATE ? String(r.OB_DATE).substring(0, 10) : '',
          arDate: r.AR_DATE ? String(r.AR_DATE).substring(0, 10) : '',
          jobNo: r.JOB_NO || '',
          mawbNo: r.MAWB_NO || '',
          airlineCode: r.AIRLINE_CODE || '',
          airlineName: r.AIRLINE_NAME || r.AIRLINE_CODE || '',
          hawbCount: r.HAWB_COUNT || 0,
          totalPieces: r.TOTAL_PIECES || 0,
          totalWeight: Number(r.TOTAL_WEIGHT) || 0,
          departure: r.DEPARTURE || '',
          arrival: r.ARRIVAL || '',
          flightNo: r.FLIGHT_NO || '',
          ioType: 'IN',
          status: r.STATUS || 'DRAFT',
        }));
        setData(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch Import MAWB:', err);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (filters.ioType && item.ioType !== filters.ioType) return false;
      if (filters.mawbNo && !item.mawbNo?.toLowerCase().includes(filters.mawbNo.toLowerCase())) return false;
      if (filters.airlineCode && !item.airlineName?.toLowerCase().includes(filters.airlineCode.toLowerCase())) return false;
      if (filters.flightNo && !item.flightNo?.toLowerCase().includes(filters.flightNo.toLowerCase())) return false;
      return true;
    });
  }, [data, filters]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      return sortDirection === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
  }, [filteredData, sortField, sortDirection]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const handleReset = () => {
    setFilters(initialFilters);
    setCurrentPage(1);
  };

  const handleRowSelect = (id: string) => {
    setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    setSelectedRows(selectedRows.length === paginatedData.length ? [] : paginatedData.map(item => item.id));
  };

  const handleSort = (field: keyof MasterAWB) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleNew = () => router.push('/logis/import-bl/air/master/register');
  const handleRowClick = (id: string) => router.push(`/logis/import-bl/air/master/register?id=${id}`);

  const handleDelete = async () => {
    if (selectedRows.length === 0) {
      setSelectionAlertMessage('삭제할 항목을 선택해주세요.');
      setShowSelectionAlert(true);
      return;
    }
    if (confirm(`선택한 ${selectedRows.length}개 항목을 삭제하시겠습니까?`)) {
      try {
        await fetch('/api/bl/air/master', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedRows.map(Number) }),
        });
        setSelectedRows([]);
        fetchData();
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }
  };

  const handleExcelDownload = () => {
    const exportData = filteredData.map(item => ({
      'O/B Date': item.obDate, 'A/R Date': item.arDate, 'JOB NO': item.jobNo,
      'MAWB NO': item.mawbNo, 'Airline': item.airlineName, 'HAWB Count': item.hawbCount,
      'Total Pieces': item.totalPieces, 'Total Weight': item.totalWeight,
      'Departure': item.departure, 'Arrival': item.arrival, 'Flight': item.flightNo,
      'Status': getStatusConfig(item.status || '').label,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Import Master AWB List');
    XLSX.writeFile(wb, `Import_Master_AWB_List_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleEmailClick = () => {
    if (selectedRows.length === 0) {
      setSelectionAlertMessage('이메일을 발송할 항목을 선택해주세요.');
      setShowSelectionAlert(true);
      return;
    }
    setShowEmailModal(true);
  };

  const handlePrint = () => {
    if (selectedRows.length === 0) {
      setSelectionAlertMessage('출력할 항목을 선택해주세요.');
      setShowSelectionAlert(true);
      return;
    }
    setPrintMawbId(Number(selectedRows[0]));
    setShowPrintModal(true);
  };

  const openCodeModal = (type: CodeType, target: string) => {
    setCodeModalType(type);
    setCodeModalTarget(target);
    setShowCodeModal(true);
  };

  const handleCodeSelect = (item: CodeItem) => {
    if (codeModalTarget === 'airline') setFilters(prev => ({ ...prev, airlineCode: item.name }));
    else if (codeModalTarget === 'shipper') setFilters(prev => ({ ...prev, shipper: item.name }));
    else if (codeModalTarget === 'consignee') setFilters(prev => ({ ...prev, consignee: item.name }));
    else if (codeModalTarget === 'notify') setFilters(prev => ({ ...prev, notify: item.name }));
    else if (codeModalTarget === 'partner') setFilters(prev => ({ ...prev, partner: item.name }));
    else if (codeModalTarget === 'destination') setFilters(prev => ({ ...prev, destination: item.code }));
    setShowCodeModal(false);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="main-content">
        <Header title="Master AWB 관리" subtitle="Logis > 항공수입 > Master AWB 관리" onClose={handleCloseClick} />

        <main className="p-6">
          <div className="card mb-6">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center cursor-pointer" onClick={() => setIsSearchOpen(!isSearchOpen)}>
              <h3 className="font-bold flex items-center gap-2">
                <svg className="w-5 h-5 text-[#E8A838]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                검색조건
              </h3>
              <svg className={`w-5 h-5 transition-transform ${isSearchOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {isSearchOpen && (
              <div className="p-4">
                <div className="grid grid-cols-6 gap-4 mb-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">A/R Date</label>
                    <div className="flex items-center gap-1">
                      <input type="date" value={filters.obDateFrom} onChange={(e) => handleFilterChange('obDateFrom', e.target.value)} className="flex-1 px-2 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" />
                      <span className="self-center">~</span>
                      <input type="date" value={filters.obDateTo} onChange={(e) => handleFilterChange('obDateTo', e.target.value)} className="flex-1 px-2 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" />
                      <DateRangeButtons onRangeSelect={(start, end) => { handleFilterChange('obDateFrom', start); handleFilterChange('obDateTo', end); }} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">MAWB NO</label>
                    <input type="text" value={filters.mawbNo} onChange={(e) => handleFilterChange('mawbNo', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="Master AWB 번호" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">항공사</label>
                    <div className="flex gap-1">
                      <input type="text" value={filters.airlineCode} onChange={(e) => handleFilterChange('airlineCode', e.target.value)} className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="항공사" />
                      <button onClick={() => openCodeModal('airline', 'airline')} className="px-2 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Flight No.</label>
                    <input type="text" value={filters.flightNo} onChange={(e) => handleFilterChange('flightNo', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="편명" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Destination</label>
                    <input type="text" value={filters.destination} onChange={(e) => handleFilterChange('destination', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="목적지" />
                  </div>
                </div>
                {/* 두 번째 검색 조건 행 */}
                <div className="grid grid-cols-6 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Shipper</label>
                    <div className="flex gap-1">
                      <input type="text" value={filters.shipper} onChange={(e) => handleFilterChange('shipper', e.target.value)} className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="송하인" />
                      <button onClick={() => openCodeModal('customer', 'shipper')} className="px-2 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Consignee</label>
                    <div className="flex gap-1">
                      <input type="text" value={filters.consignee} onChange={(e) => handleFilterChange('consignee', e.target.value)} className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="수하인" />
                      <button onClick={() => openCodeModal('customer', 'consignee')} className="px-2 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Notify</label>
                    <div className="flex gap-1">
                      <input type="text" value={filters.notify} onChange={(e) => handleFilterChange('notify', e.target.value)} className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="통지처" />
                      <button onClick={() => openCodeModal('customer', 'notify')} className="px-2 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Partner</label>
                    <div className="flex gap-1">
                      <input type="text" value={filters.partner} onChange={(e) => handleFilterChange('partner', e.target.value)} className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="파트너" />
                      <button onClick={() => openCodeModal('customer', 'partner')} className="px-2 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Sales Man</label>
                    <input type="text" value={filters.salesMan} onChange={(e) => handleFilterChange('salesMan', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="영업담당" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">License No.</label>
                    <input type="text" value={filters.licenseNo} onChange={(e) => handleFilterChange('licenseNo', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="라이센스번호" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={handleReset} className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">초기화</button>
                  <button onClick={() => setCurrentPage(1)} className="px-6 py-2 bg-[#E8A838] text-[#0C1222] font-semibold rounded-lg hover:bg-[#D4943A]">검색</button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-[var(--muted)]">총 <span className="font-bold text-[var(--foreground)]">{filteredData.length}</span>건</span>
            <div className="flex gap-2">
              <ActionButton variant="primary" onClick={handleNew}>신규</ActionButton>
              <ActionButton variant="danger" onClick={handleDelete}>삭제</ActionButton>
              <ActionButton variant="secondary" onClick={handleExcelDownload}>Excel</ActionButton>
              <ActionButton variant="secondary" onClick={handleEmailClick}>E-mail</ActionButton>
              <ActionButton variant="secondary" onClick={handlePrint}>출력</ActionButton>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--surface-100)]">
                  <tr>
                    <th className="p-3 w-10"><input type="checkbox" checked={selectedRows.length === paginatedData.length && paginatedData.length > 0} onChange={handleSelectAll} className="rounded" /></th>
                    <th className="w-14">No</th>
                    <th className="p-3 text-left text-sm font-medium cursor-pointer" onClick={() => handleSort('obDate')}>O/B Date {sortField === 'obDate' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                    <th className="p-3 text-left text-sm font-medium cursor-pointer" onClick={() => handleSort('jobNo')}>JOB NO {sortField === 'jobNo' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                    <th className="p-3 text-left text-sm font-medium cursor-pointer" onClick={() => handleSort('mawbNo')}>MAWB NO {sortField === 'mawbNo' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                    <th className="p-3 text-left text-sm font-medium">Airline</th>
                    <th className="p-3 text-center text-sm font-medium">HAWB Count</th>
                    <th className="p-3 text-right text-sm font-medium">Total Pieces</th>
                    <th className="p-3 text-right text-sm font-medium">Total Weight</th>
                    <th className="p-3 text-center text-sm font-medium">DEP</th>
                    <th className="p-3 text-center text-sm font-medium">ARR</th>
                    <th className="p-3 text-center text-sm font-medium">Flight</th>
                    <th className="p-3 text-center text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length === 0 ? (
                    <tr><td colSpan={13} className="p-8 text-center text-[var(--muted)]">검색 결과가 없습니다.</td></tr>
                  ) : paginatedData.map((item, index) => {
                    const status = getStatusConfig(item.status || '');
                    return (
                      <tr key={item.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer" onClick={() => handleRowClick(item.id)}>
                        <td className="p-3" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedRows.includes(item.id)} onChange={() => handleRowSelect(item.id)} className="rounded" /></td>
                        <td className="text-center text-[var(--muted)]">{index + 1}</td>
                        <td className="p-3 text-sm">{item.obDate}</td>
                        <td className="p-3 text-sm font-medium text-[#E8A838]">{item.jobNo}</td>
                        <td className="p-3 text-sm font-medium text-[#EA580C]">{item.mawbNo}</td>
                        <td className="p-3 text-sm">{item.airlineName}</td>
                        <td className="p-3 text-sm text-center">{item.hawbCount}</td>
                        <td className="p-3 text-sm text-right">{item.totalPieces.toLocaleString()}</td>
                        <td className="p-3 text-sm text-right">{item.totalWeight.toLocaleString()} kg</td>
                        <td className="p-3 text-sm text-center">{item.departure}</td>
                        <td className="p-3 text-sm text-center">{item.arrival}</td>
                        <td className="p-3 text-sm text-center">{item.flightNo}</td>
                        <td className="p-3 text-center"><span className="px-2 py-1 text-xs rounded-full" style={{ color: status.color, backgroundColor: status.bgColor }}>{status.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="p-4 border-t border-[var(--border)] flex justify-center gap-2">
                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-3 py-1 rounded border border-[var(--border)] disabled:opacity-50">&laquo;</button>
                <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-3 py-1 rounded border border-[var(--border)] disabled:opacity-50">&lt;</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
                  if (page > totalPages) return null;
                  return <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1 rounded border ${currentPage === page ? 'bg-[#E8A838] text-[#0C1222] border-[#E8A838]' : 'border-[var(--border)]'}`}>{page}</button>;
                })}
                <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="px-3 py-1 rounded border border-[var(--border)] disabled:opacity-50">&gt;</button>
                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-3 py-1 rounded border border-[var(--border)] disabled:opacity-50">&raquo;</button>
              </div>
            )}
          </div>
        </main>
      </div>

      <CloseConfirmModal isOpen={showCloseModal} onConfirm={handleConfirm} onClose={() => setShowCloseModal(false)} />
      <SelectionAlertModal isOpen={showSelectionAlert} onClose={() => setShowSelectionAlert(false)} message={selectionAlertMessage} />
      <EmailModal isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} onSend={() => { alert('이메일이 발송되었습니다.'); setShowEmailModal(false); }} documentType="awb" documentNo={selectedRows.length > 0 ? data.find(d => d.id === selectedRows[0])?.mawbNo || '' : ''} />
      <CodeSearchModal isOpen={showCodeModal} onClose={() => setShowCodeModal(false)} onSelect={handleCodeSelect} codeType={codeModalType} />
      <AWBPrintModal isOpen={showPrintModal} onClose={() => { setShowPrintModal(false); setPrintMawbId(undefined); }} awbData={null} mawbId={printMawbId} />
    </div>
  );
}
