'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { LIST_PATHS } from '@/constants/paths';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import DateRangeButtons, { getToday } from '@/components/DateRangeButtons';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';

interface BlManageData {
  id: string;
  mode: 'SEA' | 'AIR';
  direction: 'EXPORT' | 'IMPORT';
  hblNo: string;
  mblNo: string;
  shipper: string;
  consignee: string;
  pol: string;
  pod: string;
  etd: string;
  eta: string;
  status: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: '작성중', color: '#6B7280', bgColor: '#F3F4F6' },
  CONFIRMED: { label: '확정', color: '#2563EB', bgColor: '#DBEAFE' },
  SHIPPED: { label: '선적완료', color: '#7C3AED', bgColor: '#EDE9FE' },
  ARRIVED: { label: '도착', color: '#059669', bgColor: '#D1FAE5' },
};

const sampleData: BlManageData[] = [
  { id: '1', mode: 'SEA', direction: 'EXPORT', hblNo: 'HBL2026010001', mblNo: 'MBL2026010001', shipper: '삼성전자', consignee: 'Samsung America', pol: 'KRPUS', pod: 'USLAX', etd: '2026-01-20', eta: '2026-02-05', status: 'SHIPPED' },
  { id: '2', mode: 'SEA', direction: 'IMPORT', hblNo: 'HBL2026010002', mblNo: 'MBL2026010002', shipper: 'Apple Inc.', consignee: 'LG전자', pol: 'CNSHA', pod: 'KRPUS', etd: '2026-01-18', eta: '2026-01-25', status: 'ARRIVED' },
  { id: '3', mode: 'AIR', direction: 'EXPORT', hblNo: 'HAWB2026-0001', mblNo: 'MAWB2026-0001', shipper: 'SK하이닉스', consignee: 'SK Hynix America', pol: 'ICN', pod: 'LAX', etd: '2026-01-22', eta: '2026-01-23', status: 'CONFIRMED' },
  { id: '4', mode: 'AIR', direction: 'IMPORT', hblNo: 'HAWB2026-0002', mblNo: 'MAWB2026-0002', shipper: 'Intel Corp.', consignee: '현대자동차', pol: 'SFO', pod: 'ICN', etd: '2026-01-19', eta: '2026-01-20', status: 'ARRIVED' },
  { id: '5', mode: 'SEA', direction: 'EXPORT', hblNo: 'HBL2026010003', mblNo: 'MBL2026010003', shipper: '포스코', consignee: 'POSCO America', pol: 'KRPUS', pod: 'USNYC', etd: '2026-01-25', eta: '2026-02-15', status: 'DRAFT' },
  { id: '6', mode: 'AIR', direction: 'EXPORT', hblNo: 'HAWB2026-0003', mblNo: 'MAWB2026-0003', shipper: 'LG전자', consignee: 'LG Electronics USA', pol: 'ICN', pod: 'JFK', etd: '2026-01-28', eta: '2026-01-29', status: 'SHIPPED' },
];

const today = getToday();

export default function BlManagePage() {
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);

  const handleConfirmClose = () => {
    setShowCloseModal(false);
    router.push(LIST_PATHS.DASHBOARD);
  };

  useCloseConfirm({
    showModal: showCloseModal,
    setShowModal: setShowCloseModal,
    onConfirmClose: handleConfirmClose,
  });

  const [filters, setFilters] = useState({
    startDate: today,
    endDate: today,
    blNo: '',
    mode: '',
    direction: '',
    shipper: '',
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const handleSelectAll = (checked: boolean) => { setSelectedRows(checked ? filteredData.map(d => d.id) : []); };
  const handleSelectRow = (id: string, checked: boolean) => { setSelectedRows(prev => checked ? [...prev, id] : prev.filter(r => r !== id)); };

  const handleDelete = async () => {
    if (selectedRows.length === 0) { alert('삭제할 항목을 선택하세요.'); return; }
    if (!confirm(`${selectedRows.length}건을 삭제하시겠습니까?`)) return;
    alert('삭제되었습니다. (샘플)');
    setSelectedRows([]);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => setAppliedFilters({ ...filters });
  const handleReset = () => {
    const resetFilters = { startDate: today, endDate: today, blNo: '', mode: '', direction: '', shipper: '' };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
  };

  const filteredData = useMemo(() => {
    return sampleData.filter(item => {
      if (appliedFilters.blNo && !item.hblNo.toLowerCase().includes(appliedFilters.blNo.toLowerCase()) && !item.mblNo.toLowerCase().includes(appliedFilters.blNo.toLowerCase())) return false;
      if (appliedFilters.mode && item.mode !== appliedFilters.mode) return false;
      if (appliedFilters.direction && item.direction !== appliedFilters.direction) return false;
      if (appliedFilters.shipper && !item.shipper.toLowerCase().includes(appliedFilters.shipper.toLowerCase())) return false;
      return true;
    });
  }, [appliedFilters]);

  const summary = useMemo(() => ({
    total: filteredData.length,
    seaBl: filteredData.filter(d => d.mode === 'SEA').length,
    airAwb: filteredData.filter(d => d.mode === 'AIR').length,
    exportCount: filteredData.filter(d => d.direction === 'EXPORT').length,
    importCount: filteredData.filter(d => d.direction === 'IMPORT').length,
  }), [filteredData]);

  return (
    <PageLayout title="B/L 통합관리" subtitle="Logis > B/L 통합관리" showCloseButton={false}>
      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <button onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium" disabled={selectedRows.length === 0}>삭제</button>
          <div></div>
        </div>

        <div className="card mb-6">
          <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="font-bold">검색조건</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-6 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">기간</label>
                <div className="flex items-center gap-2">
                  <input type="date" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
                  <span className="text-[var(--muted)]">~</span>
                  <input type="date" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
                  <DateRangeButtons onRangeSelect={(start, end) => { handleFilterChange('startDate', start); handleFilterChange('endDate', end); }} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">B/L·AWB 번호</label>
                <input type="text" value={filters.blNo} onChange={(e) => handleFilterChange('blNo', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" placeholder="B/L or AWB No" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">구분</label>
                <select value={filters.mode} onChange={(e) => handleFilterChange('mode', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm">
                  <option value="">전체</option>
                  <option value="SEA">SEA</option>
                  <option value="AIR">AIR</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">수출입</label>
                <select value={filters.direction} onChange={(e) => handleFilterChange('direction', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm">
                  <option value="">전체</option>
                  <option value="EXPORT">수출</option>
                  <option value="IMPORT">수입</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Shipper</label>
                <input type="text" value={filters.shipper} onChange={(e) => handleFilterChange('shipper', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" placeholder="Shipper명" />
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-[var(--border)] flex justify-center gap-2">
            <button onClick={handleSearch} className="px-6 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] font-medium">조회</button>
            <button onClick={handleReset} className="px-6 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">초기화</button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { handleFilterChange('mode', ''); handleFilterChange('direction', ''); setAppliedFilters(prev => ({ ...prev, mode: '', direction: '' })); }}>
            <p className="text-2xl font-bold">{summary.total}</p>
            <p className="text-sm text-[var(--muted)]">전체</p>
          </div>
          <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { handleFilterChange('mode', 'SEA'); setAppliedFilters(prev => ({ ...prev, mode: 'SEA' })); }}>
            <p className="text-2xl font-bold text-[#2563EB]">{summary.seaBl}</p>
            <p className="text-sm text-[var(--muted)]">해상 B/L</p>
          </div>
          <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { handleFilterChange('mode', 'AIR'); setAppliedFilters(prev => ({ ...prev, mode: 'AIR' })); }}>
            <p className="text-2xl font-bold text-[#7C3AED]">{summary.airAwb}</p>
            <p className="text-sm text-[var(--muted)]">항공 AWB</p>
          </div>
          <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { handleFilterChange('direction', 'EXPORT'); setAppliedFilters(prev => ({ ...prev, direction: 'EXPORT' })); }}>
            <p className="text-2xl font-bold text-[#059669]">{summary.exportCount}</p>
            <p className="text-sm text-[var(--muted)]">수출</p>
          </div>
          <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { handleFilterChange('direction', 'IMPORT'); setAppliedFilters(prev => ({ ...prev, direction: 'IMPORT' })); }}>
            <p className="text-2xl font-bold text-[#EA580C]">{summary.importCount}</p>
            <p className="text-sm text-[var(--muted)]">수입</p>
          </div>
        </div>

        <div className="card">
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="font-bold">B/L·AWB 목록 ({filteredData.length}건)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-12"><input type="checkbox" checked={selectedRows.length === filteredData.length && filteredData.length > 0} onChange={e => handleSelectAll(e.target.checked)} className="rounded" /></th>
                  <th className="w-14">No</th>
                  <th className="text-center">구분</th>
                  <th>H B/L·AWB No</th>
                  <th>M B/L·AWB No</th>
                  <th>Shipper</th>
                  <th>Consignee</th>
                  <th className="text-center">POL</th>
                  <th className="text-center">POD</th>
                  <th className="text-center">ETD</th>
                  <th className="text-center">ETA</th>
                  <th className="text-center">상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr><td colSpan={12} className="p-8 text-center text-[var(--muted)]">조회된 데이터가 없습니다.</td></tr>
                ) : (
                  filteredData.map((row, index) => (
                    <tr key={row.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer">
                      <td className="p-3 text-center" onClick={e => e.stopPropagation()}><input type="checkbox" checked={selectedRows.includes(row.id)} onChange={e => handleSelectRow(row.id, e.target.checked)} className="rounded" /></td>
                      <td className="p-3 text-center text-sm">{index + 1}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${row.mode === 'SEA' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{row.mode}</span>
                        <span className={`ml-1 px-2 py-1 rounded text-xs font-medium ${row.direction === 'EXPORT' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{row.direction === 'EXPORT' ? '수출' : '수입'}</span>
                      </td>
                      <td className="p-3 text-[#2563EB] font-medium">{row.hblNo}</td>
                      <td className="p-3 text-sm">{row.mblNo}</td>
                      <td className="p-3 text-sm">{row.shipper}</td>
                      <td className="p-3 text-sm">{row.consignee}</td>
                      <td className="p-3 text-sm text-center">{row.pol}</td>
                      <td className="p-3 text-sm text-center">{row.pod}</td>
                      <td className="p-3 text-sm text-center">{row.etd}</td>
                      <td className="p-3 text-sm text-center">{row.eta}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-1 rounded-full text-xs" style={{ color: statusConfig[row.status]?.color, backgroundColor: statusConfig[row.status]?.bgColor }}>{statusConfig[row.status]?.label || row.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <CloseConfirmModal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} onConfirm={handleConfirmClose} />
    </PageLayout>
  );
}
