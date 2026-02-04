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

interface SearchFilters {
  obDateFrom: string;
  obDateTo: string;
  lineCode: string;
  mblNo: string;
  vessel: string;
  pol: string;
  pod: string;
}

interface MasterBL {
  id: string;
  obDate: string;
  arDate: string;
  mblNo: string;
  lineCode: string;
  lineName: string;
  vesselName: string;
  voyage: string;
  hblCount: number;
  totalPackage: number;
  totalWeight: number;
  totalCbm: number;
  pol: string;
  pod: string;
  freightTerm: string;
  status: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: '작성중', color: '#6B7280', bgColor: '#F3F4F6' },
  CONFIRMED: { label: '확정', color: '#059669', bgColor: '#D1FAE5' },
  ARRIVED: { label: '도착', color: '#7C3AED', bgColor: '#EDE9FE' },
  IN_TRANSIT: { label: '운송중', color: '#2563EB', bgColor: '#DBEAFE' },
  RELEASED: { label: '반출', color: '#DC2626', bgColor: '#FEE2E2' },
};

const getStatusConfig = (status: string) => {
  return statusConfig[status] || { label: status || '미정', color: '#6B7280', bgColor: '#F3F4F6' };
};

const initialFilters: SearchFilters = {
  obDateFrom: '',
  obDateTo: '',
  lineCode: '',
  mblNo: '',
  vessel: '',
  pol: '',
  pod: '',
};

export default function ImportMasterBLListPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [data, setData] = useState<MasterBL[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(true);

  const [showSelectionAlert, setShowSelectionAlert] = useState(false);
  const [selectionAlertMessage, setSelectionAlertMessage] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeModalType, setCodeModalType] = useState<CodeType>('carrier');
  const [codeModalTarget, setCodeModalTarget] = useState<string>('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printData, setPrintData] = useState<PrintBLData | null>(null);

  const [sortField, setSortField] = useState<keyof MasterBL>('obDate');
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

  // API에서 데이터 로드 (수입 - IMPORT)
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bl/mbl?direction=IMPORT');
      if (res.ok) {
        const rows = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: MasterBL[] = rows.map((r: any) => ({
          id: String(r.mbl_id),
          obDate: r.etd_dt || '',
          arDate: r.eta_dt || '',
          mblNo: r.mbl_no || '',
          lineCode: r.carrier_id ? String(r.carrier_id) : '',
          lineName: r.carrier_name || '',
          vesselName: r.vessel_nm || '',
          voyage: r.voyage_no || '',
          pol: r.pol_port_cd || '',
          pod: r.pod_port_cd || '',
          freightTerm: r.freight_term_cd || '',
          hblCount: r.hbl_count || 0,
          totalPackage: r.total_pkg_qty || 0,
          totalWeight: Number(r.gross_weight_kg) || 0,
          totalCbm: Number(r.volume_cbm) || 0,
          status: r.status_cd || 'DRAFT',
        }));
        setData(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch Import Master B/L:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (filters.mblNo && !item.mblNo?.toLowerCase().includes(filters.mblNo.toLowerCase())) return false;
      if (filters.lineCode && !item.lineName?.toLowerCase().includes(filters.lineCode.toLowerCase())) return false;
      if (filters.vessel && !item.vesselName?.toLowerCase().includes(filters.vessel.toLowerCase())) return false;
      if (filters.pol && item.pol !== filters.pol) return false;
      if (filters.pod && item.pod !== filters.pod) return false;
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

  const handleSort = (field: keyof MasterBL) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleNew = () => router.push('/logis/import-bl/sea/master/register');
  const handleRowClick = (id: string) => router.push(`/logis/import-bl/sea/[id]?id=${id}&type=master`);

  const handleDelete = async () => {
    if (selectedRows.length === 0) {
      setSelectionAlertMessage('삭제할 항목을 선택해주세요.');
      setShowSelectionAlert(true);
      return;
    }
    if (confirm(`선택한 ${selectedRows.length}개 항목을 삭제하시겠습니까?`)) {
      for (const id of selectedRows) {
        await fetch(`/api/bl/mbl?id=${id}`, { method: 'DELETE' });
      }
      setSelectedRows([]);
      fetchData();
    }
  };

  const handleExcelDownload = () => {
    const exportData = filteredData.map(item => ({
      'ETD': item.obDate,
      'ETA': item.arDate,
      'M.B/L NO': item.mblNo,
      'Carrier': item.lineName,
      'Vessel': item.vesselName,
      'Voyage': item.voyage,
      'POL': item.pol,
      'POD': item.pod,
      'HBL Count': item.hblCount,
      'Total Package': item.totalPackage,
      'Total Weight': item.totalWeight,
      'Total CBM': item.totalCbm,
      'Freight Term': item.freightTerm,
      'Status': getStatusConfig(item.status).label,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Import Master BL');
    XLSX.writeFile(wb, `Import_Master_BL_${new Date().toISOString().split('T')[0]}.xlsx`);
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
        hblNo: '',
        mblNo: selected.mblNo,
        blDate: new Date().toISOString().split('T')[0],
        shipper: '',
        consignee: '',
        notifyParty: '',
        carrier: selected.lineName || '',
        vessel: selected.vesselName || '',
        voyage: selected.voyage || '',
        pol: selected.pol || '',
        pod: selected.pod || '',
        etd: selected.obDate || '',
        containerNo: '',
        sealNo: '',
        containerType: '',
        containerQty: 0,
        description: '',
        weight: selected.totalWeight || 0,
        measurement: selected.totalCbm || 0,
        freightTerms: (selected.freightTerm === 'COLLECT' ? 'COLLECT' : 'PREPAID') as 'PREPAID' | 'COLLECT',
        placeOfIssue: 'SEOUL, KOREA',
        dateOfIssue: new Date().toISOString().split('T')[0],
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
    if (codeModalTarget === 'line') setFilters(prev => ({ ...prev, lineCode: item.name }));
    if (codeModalTarget === 'pol') setFilters(prev => ({ ...prev, pol: item.code }));
    if (codeModalTarget === 'pod') setFilters(prev => ({ ...prev, pod: item.code }));
    setShowCodeModal(false);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="ml-56">
        <Header title="Master B/L 관리" subtitle="Logis > 해상수입 > Master B/L 관리" onClose={handleCloseClick} />

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
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">M.B/L NO</label>
                    <input type="text" value={filters.mblNo} onChange={(e) => handleFilterChange('mblNo', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="Master B/L 번호" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">선사</label>
                    <div className="flex gap-1">
                      <input type="text" value={filters.lineCode} onChange={(e) => handleFilterChange('lineCode', e.target.value)} className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="선사" />
                      <button onClick={() => openCodeModal('carrier', 'line')} className="px-2 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Vessel</label>
                    <input type="text" value={filters.vessel} onChange={(e) => handleFilterChange('vessel', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="선박명" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">POL</label>
                    <div className="flex gap-1">
                      <input type="text" value={filters.pol} onChange={(e) => handleFilterChange('pol', e.target.value)} className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="선적항" />
                      <button onClick={() => openCodeModal('seaport', 'pol')} className="px-2 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--muted)]">POD</label>
                    <div className="flex gap-1">
                      <input type="text" value={filters.pod} onChange={(e) => handleFilterChange('pod', e.target.value)} className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="도착항" />
                      <button onClick={() => openCodeModal('seaport', 'pod')} className="px-2 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-end gap-2 justify-end">
                    <button onClick={handleReset} className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">초기화</button>
                    <button onClick={() => fetchData()} className="px-6 py-2 bg-[#E8A838] text-[#0C1222] font-semibold rounded-lg hover:bg-[#D4943A]">검색</button>
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
                    <th className="p-3 text-left text-sm font-medium cursor-pointer" onClick={() => handleSort('obDate')}>ETD {sortField === 'obDate' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                    <th className="p-3 text-left text-sm font-medium cursor-pointer" onClick={() => handleSort('arDate')}>ETA {sortField === 'arDate' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                    <th className="p-3 text-left text-sm font-medium cursor-pointer" onClick={() => handleSort('mblNo')}>M.B/L NO {sortField === 'mblNo' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                    <th className="p-3 text-left text-sm font-medium">Carrier</th>
                    <th className="p-3 text-left text-sm font-medium">Vessel / Voyage</th>
                    <th className="p-3 text-center text-sm font-medium">POL</th>
                    <th className="p-3 text-center text-sm font-medium">POD</th>
                    <th className="p-3 text-center text-sm font-medium">HBL</th>
                    <th className="p-3 text-right text-sm font-medium">PKG</th>
                    <th className="p-3 text-right text-sm font-medium">Weight</th>
                    <th className="p-3 text-center text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={12} className="p-8 text-center text-[var(--muted)]">로딩 중...</td></tr>
                  ) : paginatedData.length === 0 ? (
                    <tr><td colSpan={12} className="p-8 text-center text-[var(--muted)]">검색 결과가 없습니다.</td></tr>
                  ) : paginatedData.map((item) => {
                    const status = getStatusConfig(item.status);
                    return (
                      <tr key={item.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer" onClick={() => handleRowClick(item.id)}>
                        <td className="p-3" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedRows.includes(item.id)} onChange={() => handleRowSelect(item.id)} className="rounded" /></td>
                        <td className="p-3 text-sm">{item.obDate}</td>
                        <td className="p-3 text-sm">{item.arDate}</td>
                        <td className="p-3 text-sm font-medium text-[#3B82F6]">{item.mblNo}</td>
                        <td className="p-3 text-sm">{item.lineName}</td>
                        <td className="p-3 text-sm">{item.vesselName} / {item.voyage}</td>
                        <td className="p-3 text-sm text-center">{item.pol}</td>
                        <td className="p-3 text-sm text-center">{item.pod}</td>
                        <td className="p-3 text-sm text-center">{item.hblCount}</td>
                        <td className="p-3 text-sm text-right">{item.totalPackage.toLocaleString()}</td>
                        <td className="p-3 text-sm text-right">{item.totalWeight.toLocaleString()} kg</td>
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
      <EmailModal isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} onSend={() => { alert('이메일이 발송되었습니다.'); setShowEmailModal(false); }} documentType="bl" documentNo={selectedRows.length > 0 ? data.find(d => d.id === selectedRows[0])?.mblNo || '' : ''} />
      <CodeSearchModal isOpen={showCodeModal} onClose={() => setShowCodeModal(false)} onSelect={handleCodeSelect} codeType={codeModalType} />
      {printData && <BLPrintModal isOpen={showPrintModal} onClose={() => setShowPrintModal(false)} blData={printData} />}
    </div>
  );
}
