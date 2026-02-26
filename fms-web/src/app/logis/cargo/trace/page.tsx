'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { LIST_PATHS } from '@/constants/paths';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import DateRangeButtons, { getToday } from '@/components/DateRangeButtons';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import Link from 'next/link';

interface CargoTraceData {
  id: string;
  blNo: string;
  mode: 'SEA' | 'AIR';
  shipper: string;
  origin: string;
  destination: string;
  etd: string;
  eta: string;
  progress: number;
  status: 'preparing' | 'in_transit' | 'arrived' | 'delivered';
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  preparing: { label: '화물준비', color: '#6B7280', bgColor: '#F3F4F6' },
  in_transit: { label: '운송중', color: '#2563EB', bgColor: '#DBEAFE' },
  arrived: { label: '도착', color: '#7C3AED', bgColor: '#EDE9FE' },
  delivered: { label: '배송완료', color: '#059669', bgColor: '#D1FAE5' },
};

const sampleData: CargoTraceData[] = [
  { id: '1', blNo: 'HBL2026010001', mode: 'SEA', shipper: '삼성전자', origin: 'KRPUS (부산)', destination: 'USLAX (로스앤젤레스)', etd: '2026-01-20', eta: '2026-02-05', progress: 65, status: 'in_transit' },
  { id: '2', blNo: 'HAWB2026-0001', mode: 'AIR', shipper: 'SK하이닉스', origin: 'ICN (인천)', destination: 'LAX (로스앤젤레스)', etd: '2026-01-22', eta: '2026-01-23', progress: 100, status: 'delivered' },
  { id: '3', blNo: 'HBL2026010002', mode: 'SEA', shipper: 'LG전자', origin: 'CNSHA (상하이)', destination: 'KRPUS (부산)', etd: '2026-01-18', eta: '2026-01-25', progress: 90, status: 'arrived' },
  { id: '4', blNo: 'HAWB2026-0002', mode: 'AIR', shipper: '현대자동차', origin: 'SFO (샌프란시스코)', destination: 'ICN (인천)', etd: '2026-01-28', eta: '2026-01-29', progress: 10, status: 'preparing' },
  { id: '5', blNo: 'HBL2026010003', mode: 'SEA', shipper: '포스코', origin: 'KRPUS (부산)', destination: 'USNYC (뉴욕)', etd: '2026-01-25', eta: '2026-02-15', progress: 40, status: 'in_transit' },
  { id: '6', blNo: 'HAWB2026-0003', mode: 'AIR', shipper: 'LG전자', origin: 'ICN (인천)', destination: 'JFK (뉴욕)', etd: '2026-01-26', eta: '2026-01-27', progress: 100, status: 'delivered' },
];

const today = getToday();

export default function CargoTracePage() {
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
    shipper: '',
    status: '',
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
    const resetFilters = { startDate: today, endDate: today, blNo: '', mode: '', shipper: '', status: '' };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
  };

  const filteredData = useMemo(() => {
    return sampleData.filter(item => {
      if (appliedFilters.blNo && !item.blNo.toLowerCase().includes(appliedFilters.blNo.toLowerCase())) return false;
      if (appliedFilters.mode && item.mode !== appliedFilters.mode) return false;
      if (appliedFilters.shipper && !item.shipper.toLowerCase().includes(appliedFilters.shipper.toLowerCase())) return false;
      if (appliedFilters.status && item.status !== appliedFilters.status) return false;
      return true;
    });
  }, [appliedFilters]);

  const summary = useMemo(() => ({
    total: filteredData.length,
    preparing: filteredData.filter(d => d.status === 'preparing').length,
    inTransit: filteredData.filter(d => d.status === 'in_transit').length,
    arrived: filteredData.filter(d => d.status === 'arrived').length,
    delivered: filteredData.filter(d => d.status === 'delivered').length,
  }), [filteredData]);

  const getProgressBarColor = (progress: number) => {
    if (progress >= 100) return '#059669';
    if (progress >= 70) return '#7C3AED';
    if (progress >= 30) return '#2563EB';
    return '#6B7280';
  };

  return (
    <PageLayout title="화물추적 관리" subtitle="Logis > 화물추적 관리" showCloseButton={false}>
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
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">운송모드</label>
                <select value={filters.mode} onChange={(e) => handleFilterChange('mode', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm">
                  <option value="">전체</option>
                  <option value="SEA">SEA</option>
                  <option value="AIR">AIR</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">화주</label>
                <input type="text" value={filters.shipper} onChange={(e) => handleFilterChange('shipper', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" placeholder="화주명" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">상태</label>
                <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm">
                  <option value="">전체</option>
                  <option value="preparing">화물준비</option>
                  <option value="in_transit">운송중</option>
                  <option value="arrived">도착</option>
                  <option value="delivered">배송완료</option>
                </select>
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-[var(--border)] flex justify-center gap-2">
            <button onClick={handleSearch} className="px-6 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] font-medium">조회</button>
            <button onClick={handleReset} className="px-6 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">초기화</button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { handleFilterChange('status', ''); setAppliedFilters(prev => ({ ...prev, status: '' })); }}>
            <p className="text-2xl font-bold">{summary.total}</p>
            <p className="text-sm text-[var(--muted)]">전체</p>
          </div>
          <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { handleFilterChange('status', 'preparing'); setAppliedFilters(prev => ({ ...prev, status: 'preparing' })); }}>
            <p className="text-2xl font-bold text-[#6B7280]">{summary.preparing}</p>
            <p className="text-sm text-[var(--muted)]">화물준비</p>
          </div>
          <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { handleFilterChange('status', 'in_transit'); setAppliedFilters(prev => ({ ...prev, status: 'in_transit' })); }}>
            <p className="text-2xl font-bold text-[#2563EB]">{summary.inTransit}</p>
            <p className="text-sm text-[var(--muted)]">운송중</p>
          </div>
          <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { handleFilterChange('status', 'arrived'); setAppliedFilters(prev => ({ ...prev, status: 'arrived' })); }}>
            <p className="text-2xl font-bold text-[#7C3AED]">{summary.arrived}</p>
            <p className="text-sm text-[var(--muted)]">도착</p>
          </div>
          <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { handleFilterChange('status', 'delivered'); setAppliedFilters(prev => ({ ...prev, status: 'delivered' })); }}>
            <p className="text-2xl font-bold text-[#059669]">{summary.delivered}</p>
            <p className="text-sm text-[var(--muted)]">배송완료</p>
          </div>
        </div>

        <div className="card">
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="font-bold">화물추적 목록 ({filteredData.length}건)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-12"><input type="checkbox" checked={selectedRows.length === filteredData.length && filteredData.length > 0} onChange={e => handleSelectAll(e.target.checked)} className="rounded" /></th>
                  <th className="w-14">No</th>
                  <th>B/L·AWB No</th>
                  <th className="text-center">운송모드</th>
                  <th>화주</th>
                  <th>출발지</th>
                  <th>도착지</th>
                  <th className="text-center">ETD</th>
                  <th className="text-center">ETA</th>
                  <th className="text-center">진행률</th>
                  <th className="text-center">상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr><td colSpan={11} className="p-8 text-center text-[var(--muted)]">조회된 데이터가 없습니다.</td></tr>
                ) : (
                  filteredData.map((row, index) => (
                    <tr key={row.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer">
                      <td className="p-3 text-center" onClick={e => e.stopPropagation()}><input type="checkbox" checked={selectedRows.includes(row.id)} onChange={e => handleSelectRow(row.id, e.target.checked)} className="rounded" /></td>
                      <td className="p-3 text-center text-sm">{index + 1}</td>
                      <td className="p-3">
                        <Link href="/logis/cargo/tracking" className="text-[#2563EB] font-medium hover:underline">{row.blNo}</Link>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${row.mode === 'SEA' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{row.mode}</span>
                      </td>
                      <td className="p-3 text-sm">{row.shipper}</td>
                      <td className="p-3 text-sm">{row.origin}</td>
                      <td className="p-3 text-sm">{row.destination}</td>
                      <td className="p-3 text-sm text-center">{row.etd}</td>
                      <td className="p-3 text-sm text-center">{row.eta}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className="h-2 rounded-full transition-all" style={{ width: `${row.progress}%`, backgroundColor: getProgressBarColor(row.progress) }} />
                          </div>
                          <span className="text-xs text-[var(--muted)] w-8 text-right">{row.progress}%</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-1 rounded-full text-xs" style={{ color: statusConfig[row.status]?.color, backgroundColor: statusConfig[row.status]?.bgColor }}>{statusConfig[row.status]?.label}</span>
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
