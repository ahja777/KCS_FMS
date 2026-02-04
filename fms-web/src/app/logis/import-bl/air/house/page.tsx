'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import SelectionAlertModal from '@/components/SelectionAlertModal';
import EmailModal from '@/components/EmailModal';
import CodeSearchModal, { CodeType, CodeItem } from '@/components/popup/CodeSearchModal';
import AWBPrintModal, { AWBData } from '@/components/AWBPrintModal';
import { ActionButton } from '@/components/buttons';

interface SearchFilters {
  ioType: string;
  obDateFrom: string;
  obDateTo: string;
  shipperCode: string;
  consigneeCode: string;
  mawbNo: string;
  flightNo: string;
  notify: string;
  partner: string;
  destination: string;
  licenseNo: string;
  salesMan: string;
}

interface HouseAWB {
  id: string;
  obDate: string;
  arDate: string;
  jobNo: string;
  mawbNo: string;
  hawbNo: string;
  lcNo: string;
  poNo: string;
  type: string;
  dc: string;
  ln: string;
  pc: string;
  inco: string;
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

const initialSampleData: HouseAWB[] = [
  { id: '1', obDate: '2026-01-15', arDate: '2026-01-16', jobNo: 'AIM-2026-0001', mawbNo: '618-11223344', hawbNo: 'HAWB2026010001', lcNo: 'LC2026-003', poNo: '', type: 'ORI', dc: 'C', ln: 'N', pc: 'P', inco: 'CIF', shipperName: 'ABC Corp', consigneeName: '현대자동차', departure: 'LAX', arrival: 'ICN', flightNo: 'KE002', ioType: 'IN', status: 'ISSUED' },
  { id: '2', obDate: '2026-01-10', arDate: '2026-01-11', jobNo: 'AIM-2026-0002', mawbNo: '160-99887766', hawbNo: 'HAWB2026010002', lcNo: 'LC2026-005', poNo: 'PO-005', type: 'ORI', dc: 'C', ln: 'L', pc: 'C', inco: 'DDP', shipperName: 'XYZ Ltd', consigneeName: '포스코', departure: 'PVG', arrival: 'ICN', flightNo: 'CA123', ioType: 'IN', status: 'DELIVERED' },
  { id: '3', obDate: '2026-01-08', arDate: '2026-01-09', jobNo: 'AIM-2026-0003', mawbNo: '205-44556677', hawbNo: 'HAWB2026010003', lcNo: '', poNo: 'PO-006', type: 'SWB', dc: 'C', ln: 'L', pc: 'P', inco: 'FOB', shipperName: 'DEF Inc', consigneeName: '삼성전자', departure: 'NRT', arrival: 'ICN', flightNo: 'NH861', ioType: 'IN', status: 'DRAFT' },
];

const initialFilters: SearchFilters = {
  ioType: 'IN',
  obDateFrom: '',
  obDateTo: '',
  shipperCode: '',
  consigneeCode: '',
  mawbNo: '',
  flightNo: '',
  notify: '',
  partner: '',
  destination: '',
  licenseNo: '',
  salesMan: '',
};

export default function ImportHouseAWBListPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [data, setData] = useState<HouseAWB[]>(initialSampleData);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(true);

  const [showSelectionAlert, setShowSelectionAlert] = useState(false);
  const [selectionAlertMessage, setSelectionAlertMessage] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeModalType, setCodeModalType] = useState<CodeType>('customer');
  const [codeModalTarget, setCodeModalTarget] = useState<string>('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printData, setPrintData] = useState<AWBData | null>(null);

  const [sortField, setSortField] = useState<keyof HouseAWB>('obDate');
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

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (filters.ioType && item.ioType !== filters.ioType) return false;
      if (filters.mawbNo && !item.mawbNo?.toLowerCase().includes(filters.mawbNo.toLowerCase())) return false;
      if (filters.shipperCode && !item.shipperName?.toLowerCase().includes(filters.shipperCode.toLowerCase())) return false;
      if (filters.consigneeCode && !item.consigneeName?.toLowerCase().includes(filters.consigneeCode.toLowerCase())) return false;
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

  const handleSort = (field: keyof HouseAWB) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleNew = () => router.push('/logis/import-bl/air/house/register');
  const handleRowClick = (id: string) => router.push(`/logis/import-bl/air/house/register?id=${id}`);

  const handleDelete = () => {
    if (selectedRows.length === 0) {
      setSelectionAlertMessage('삭제할 항목을 선택해주세요.');
      setShowSelectionAlert(true);
      return;
    }
    if (confirm(`선택한 ${selectedRows.length}개 항목을 삭제하시겠습니까?`)) {
      setData(prev => prev.filter(item => !selectedRows.includes(item.id)));
      setSelectedRows([]);
    }
  };

  const handleExcelDownload = () => {
    const exportData = filteredData.map(item => ({
      'O/B Date': item.obDate, 'A/R Date': item.arDate, 'JOB NO': item.jobNo,
      'MAWB NO': item.mawbNo, 'HAWB NO': item.hawbNo, 'TYPE': item.type,
      'P/C': item.pc, 'Shipper': item.shipperName, 'Consignee': item.consigneeName,
      'Departure': item.departure, 'Arrival': item.arrival, 'Flight': item.flightNo,
      'Status': getStatusConfig(item.status || '').label,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Import House AWB List');
    XLSX.writeFile(wb, `Import_House_AWB_List_${new Date().toISOString().split('T')[0]}.xlsx`);
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
    const selected = data.find(item => item.id === selectedRows[0]);
    if (selected) {
      setPrintData({
        hawbNo: selected.hawbNo, mawbNo: selected.mawbNo, awbDate: selected.obDate,
        shipper: selected.shipperName || '', consignee: selected.consigneeName || '',
        carrier: selected.flightNo?.substring(0, 2) || '', origin: selected.departure || '',
        destination: selected.arrival || '', flightNo: selected.flightNo || '',
        flightDate: selected.obDate, pieces: 1, weightUnit: 'K', grossWeight: 0,
        natureOfGoods: 'GENERAL CARGO', currency: 'USD', declaredValueCarriage: 'NVD',
        declaredValueCustoms: 'NCV', insuranceAmount: 'NIL', executedAt: 'SEOUL, KOREA',
        executedOn: selected.obDate, issuerName: 'INTERGIS LOGISTICS CO., LTD.',
      });
      setShowPrintModal(true);
    }
  };

  const openCodeModal = (type: CodeType, target: string) => {
    setCodeModalType(type);
    setCodeModalTarget(target);
    setShowCodeModal(true);
  };

  const handleCodeSelect = (item: CodeItem) => {
    if (codeModalTarget === 'shipper') setFilters(prev => ({ ...prev, shipperCode: item.name }));
    else if (codeModalTarget === 'consignee') setFilters(prev => ({ ...prev, consigneeCode: item.name }));
    else if (codeModalTarget === 'notify') setFilters(prev => ({ ...prev, notify: item.name }));
    else if (codeModalTarget === 'partner') setFilters(prev => ({ ...prev, partner: item.name }));
    else if (codeModalTarget === 'destination') setFilters(prev => ({ ...prev, destination: item.code }));
    setShowCodeModal(false);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="ml-56">
        <Header title="House AWB 관리" subtitle="Logis > 항공수입 > House AWB 관리" onClose={handleCloseClick} />

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
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">MAWB NO</label>
                    <input type="text" value={filters.mawbNo} onChange={(e) => handleFilterChange('mawbNo', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="Master AWB 번호" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Shipper</label>
                    <div className="flex gap-1">
                      <input type="text" value={filters.shipperCode} onChange={(e) => handleFilterChange('shipperCode', e.target.value)} className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="화주" />
                      <button onClick={() => openCodeModal('customer', 'shipper')} className="px-2 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Consignee</label>
                    <div className="flex gap-1">
                      <input type="text" value={filters.consigneeCode} onChange={(e) => handleFilterChange('consigneeCode', e.target.value)} className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="수하인" />
                      <button onClick={() => openCodeModal('customer', 'consignee')} className="px-2 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
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
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">License No.</label>
                    <input type="text" value={filters.licenseNo} onChange={(e) => handleFilterChange('licenseNo', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="라이센스번호" />
                  </div>
                </div>
                {/* 두 번째 검색 조건 행 */}
                <div className="grid grid-cols-6 gap-4 mb-4">
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
                  <div className="col-span-3 flex items-end gap-2 justify-end">
                    <button onClick={handleReset} className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">초기화</button>
                    <button onClick={() => setCurrentPage(1)} className="px-6 py-2 bg-[#E8A838] text-[#0C1222] font-semibold rounded-lg hover:bg-[#D4943A]">검색</button>
                  </div>
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
                    <th className="p-3 text-left text-sm font-medium cursor-pointer" onClick={() => handleSort('obDate')}>O/B Date {sortField === 'obDate' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                    <th className="p-3 text-left text-sm font-medium cursor-pointer" onClick={() => handleSort('jobNo')}>JOB NO {sortField === 'jobNo' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                    <th className="p-3 text-left text-sm font-medium">MAWB NO</th>
                    <th className="p-3 text-left text-sm font-medium cursor-pointer" onClick={() => handleSort('hawbNo')}>HAWB NO {sortField === 'hawbNo' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                    <th className="p-3 text-center text-sm font-medium">TYPE</th>
                    <th className="p-3 text-center text-sm font-medium">P/C</th>
                    <th className="p-3 text-left text-sm font-medium">Shipper</th>
                    <th className="p-3 text-left text-sm font-medium">Consignee</th>
                    <th className="p-3 text-center text-sm font-medium">DEP</th>
                    <th className="p-3 text-center text-sm font-medium">ARR</th>
                    <th className="p-3 text-center text-sm font-medium">Flight</th>
                    <th className="p-3 text-center text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length === 0 ? (
                    <tr><td colSpan={13} className="p-8 text-center text-[var(--muted)]">검색 결과가 없습니다.</td></tr>
                  ) : paginatedData.map((item) => {
                    const status = getStatusConfig(item.status || '');
                    return (
                      <tr key={item.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer" onClick={() => handleRowClick(item.id)}>
                        <td className="p-3" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedRows.includes(item.id)} onChange={() => handleRowSelect(item.id)} className="rounded" /></td>
                        <td className="p-3 text-sm">{item.obDate}</td>
                        <td className="p-3 text-sm font-medium text-[#E8A838]">{item.jobNo}</td>
                        <td className="p-3 text-sm">{item.mawbNo}</td>
                        <td className="p-3 text-sm font-medium text-[#EA580C]">{item.hawbNo}</td>
                        <td className="p-3 text-sm text-center">{item.type}</td>
                        <td className="p-3 text-sm text-center">{item.pc}</td>
                        <td className="p-3 text-sm">{item.shipperName}</td>
                        <td className="p-3 text-sm">{item.consigneeName}</td>
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
      <EmailModal isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} onSend={() => { alert('이메일이 발송되었습니다.'); setShowEmailModal(false); }} documentType="awb" documentNo={selectedRows.length > 0 ? data.find(d => d.id === selectedRows[0])?.hawbNo || '' : ''} />
      <CodeSearchModal isOpen={showCodeModal} onClose={() => setShowCodeModal(false)} onSelect={handleCodeSelect} codeType={codeModalType} />
      {printData && <AWBPrintModal isOpen={showPrintModal} onClose={() => setShowPrintModal(false)} awbData={printData} />}
    </div>
  );
}
