'use client';

import { useRouter } from 'next/navigation';
import { LIST_PATHS } from '@/constants/paths';
import { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import DateRangeButtons, { getToday } from '@/components/DateRangeButtons';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { formatCurrency } from '@/utils/format';

interface CustomsData {
  id: string;
  declarationNo: string;
  declarationType: string;
  declarationDate: string;
  brokerName: string;
  importerExporter: string;
  hsCode: string;
  goodsDesc: string;
  packageQty: number;
  grossWeight: string;
  declaredValue: string;
  currency: string;
  totalTax: string;
  status: string;
  clearanceDate: string | null;
}

interface SortConfig {
  key: keyof CustomsData | null;
  direction: 'asc' | 'desc';
}

const SortIcon = ({ columnKey, sortConfig }: { columnKey: keyof CustomsData; sortConfig: SortConfig }) => {
  const isActive = sortConfig.key === columnKey;
  return (
    <span className="inline-flex flex-col ml-1.5 gap-px">
      <span style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: `5px solid ${isActive && sortConfig.direction === 'asc' ? '#ffffff' : 'rgba(255,255,255,0.35)'}` }} />
      <span style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: `5px solid ${isActive && sortConfig.direction === 'desc' ? '#ffffff' : 'rgba(255,255,255,0.35)'}` }} />
    </span>
  );
};

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '작성중', color: 'bg-gray-500' },
  SUBMITTED: { label: '신고완료', color: 'bg-blue-500' },
  ACCEPTED: { label: '수리', color: 'bg-green-500' },
  CLEARED: { label: '통관완료', color: 'bg-emerald-500' },
  REJECTED: { label: '반려', color: 'bg-red-500' },
};

const sampleData: CustomsData[] = [
  { id: '1', declarationNo: 'ID2026-001234', declarationType: 'IMPORT', declarationDate: '2026-01-28', brokerName: '(주)세일관세사', importerExporter: '삼성전자', hsCode: '8542.31', goodsDesc: '집적회로(반도체)', packageQty: 1000, grossWeight: '500', declaredValue: '85000', currency: 'USD', totalTax: '8500000', status: 'CLEARED', clearanceDate: '2026-01-28' },
  { id: '2', declarationNo: 'ID2026-005678', declarationType: 'IMPORT', declarationDate: '2026-01-27', brokerName: '(주)한진관세사', importerExporter: 'LG전자', hsCode: '8471.30', goodsDesc: '휴대용 컴퓨터', packageQty: 500, grossWeight: '2500', declaredValue: '125000', currency: 'USD', totalTax: '12500000', status: 'ACCEPTED', clearanceDate: '2026-01-27' },
  { id: '3', declarationNo: 'ID2026-002345', declarationType: 'IMPORT', declarationDate: '2026-01-27', brokerName: '(주)현대관세사', importerExporter: '현대자동차', hsCode: '8486.20', goodsDesc: '반도체 제조장비', packageQty: 5, grossWeight: '25000', declaredValue: '2500000', currency: 'USD', totalTax: '250000000', status: 'SUBMITTED', clearanceDate: null },
  { id: '4', declarationNo: 'ID2026-006789', declarationType: 'IMPORT', declarationDate: '2026-01-26', brokerName: '(주)세일관세사', importerExporter: 'SK하이닉스', hsCode: '8541.10', goodsDesc: '다이오드', packageQty: 2000, grossWeight: '300', declaredValue: '45000', currency: 'USD', totalTax: '4500000', status: 'CLEARED', clearanceDate: '2026-01-26' },
  { id: '5', declarationNo: 'ID2026-003456', declarationType: 'IMPORT', declarationDate: '2026-01-25', brokerName: '(주)포스코관세사', importerExporter: '포스코', hsCode: '7208.51', goodsDesc: '열연강판', packageQty: 50, grossWeight: '150000', declaredValue: '180000', currency: 'USD', totalTax: '18000000', status: 'DRAFT', clearanceDate: null },
];

export default function ImportCustomsSeaPage() {
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const today = getToday();
  const [filters, setFilters] = useState({
    startDate: today,
    endDate: today,
    declarationNo: '',
    importerExporter: '',
    brokerName: '',
    status: '',
  });
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const handleSelectAll = (checked: boolean) => { setSelectedRows(checked ? sortedData.map(d => d.id) : []); };
  const handleSelectRow = (id: string, checked: boolean) => { setSelectedRows(prev => checked ? [...prev, id] : prev.filter(r => r !== id)); };

  const handleDelete = async () => {
    if (selectedRows.length === 0) { alert('삭제할 항목을 선택하세요.'); return; }
    if (!confirm(`${selectedRows.length}건을 삭제하시겠습니까?`)) return;
    alert('삭제되었습니다. (샘플)');
    setSelectedRows([]);
  };

  const handleDateRangeSelect = (startDate: string, endDate: string) => {
    setFilters(prev => ({ ...prev, startDate, endDate }));
  };

  const handleSearch = () => setAppliedFilters(filters);
  const handleReset = () => {
    const resetFilters = { startDate: today, endDate: today, declarationNo: '', importerExporter: '', brokerName: '', status: '' };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
  };

  const filteredData = sampleData.filter(item => {
    if (appliedFilters.declarationNo && !item.declarationNo.toLowerCase().includes(appliedFilters.declarationNo.toLowerCase())) return false;
    if (appliedFilters.importerExporter && !item.importerExporter.toLowerCase().includes(appliedFilters.importerExporter.toLowerCase())) return false;
    if (appliedFilters.brokerName && !item.brokerName.toLowerCase().includes(appliedFilters.brokerName.toLowerCase())) return false;
    if (appliedFilters.status && item.status !== appliedFilters.status) return false;
    return true;
  });

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
      if (bValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      const comparison = String(aValue).localeCompare(String(bValue), 'ko');
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig]);

  const handleSort = (key: keyof CustomsData) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const SortableHeader = ({ columnKey, children, className = '' }: { columnKey: keyof CustomsData; children: React.ReactNode; className?: string }) => (
    <th className={`cursor-pointer select-none text-center ${className}`} onClick={() => handleSort(columnKey)}>
      <span className="inline-flex items-center justify-center">
        {children}
        <SortIcon columnKey={columnKey} sortConfig={sortConfig} />
      </span>
    </th>
  );

  const summaryStats = {
    total: filteredData.length,
    draft: filteredData.filter(d => d.status === 'DRAFT').length,
    submitted: filteredData.filter(d => d.status === 'SUBMITTED').length,
    accepted: filteredData.filter(d => d.status === 'ACCEPTED').length,
    cleared: filteredData.filter(d => d.status === 'CLEARED').length,
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
    <PageLayout title="수입통관 관리" subtitle="Logis > 해상수입 > 수입통관 관리" showCloseButton={false}>
      <main ref={formRef} className="p-6">
        <div className="flex justify-between items-center mb-6">
          <button onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium" disabled={selectedRows.length === 0}>삭제</button>
          <Link href="/logis/customs/sea/register" className="px-6 py-2 font-semibold rounded-lg bg-[var(--surface-100)] text-[var(--foreground)] hover:bg-[var(--surface-200)]">
            신규 등록
          </Link>
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
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">신고일자</label>
                <div className="flex gap-2 items-center flex-nowrap">
                  <input type="date" value={filters.startDate} onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))} className="w-[130px] h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg flex-shrink-0 text-sm" />
                  <span className="text-[var(--muted)] flex-shrink-0">~</span>
                  <input type="date" value={filters.endDate} onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))} className="w-[130px] h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg flex-shrink-0 text-sm" />
                  <DateRangeButtons onRangeSelect={handleDateRangeSelect} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">신고번호</label>
                <input type="text" value={filters.declarationNo} onChange={e => setFilters(prev => ({ ...prev, declarationNo: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="ID2026-001234" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">상태</label>
                <select value={filters.status} onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm">
                  <option value="">전체</option>
                  <option value="DRAFT">작성중</option>
                  <option value="SUBMITTED">신고완료</option>
                  <option value="ACCEPTED">수리</option>
                  <option value="CLEARED">통관완료</option>
                  <option value="REJECTED">반려</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">수입자</label>
                <input type="text" value={filters.importerExporter} onChange={e => setFilters(prev => ({ ...prev, importerExporter: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="업체명" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">관세사</label>
                <input type="text" value={filters.brokerName} onChange={e => setFilters(prev => ({ ...prev, brokerName: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="관세사명" />
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-[var(--border)] flex justify-center gap-2">
            <button onClick={handleSearch} className="px-6 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] font-medium">조회</button>
            <button onClick={handleReset} className="px-6 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">초기화</button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="card p-4 text-center"><div className="text-2xl font-bold">{summaryStats.total}</div><div className="text-sm text-[var(--muted)]">전체</div></div>
          <div className="card p-4 text-center"><div className="text-2xl font-bold text-gray-500">{summaryStats.draft}</div><div className="text-sm text-[var(--muted)]">작성중</div></div>
          <div className="card p-4 text-center"><div className="text-2xl font-bold text-blue-500">{summaryStats.submitted}</div><div className="text-sm text-[var(--muted)]">신고완료</div></div>
          <div className="card p-4 text-center"><div className="text-2xl font-bold text-green-500">{summaryStats.accepted}</div><div className="text-sm text-[var(--muted)]">수리</div></div>
          <div className="card p-4 text-center"><div className="text-2xl font-bold text-emerald-500">{summaryStats.cleared}</div><div className="text-sm text-[var(--muted)]">통관완료</div></div>
        </div>

        <div className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th className="w-12"><input type="checkbox" checked={selectedRows.length === sortedData.length && sortedData.length > 0} onChange={e => handleSelectAll(e.target.checked)} className="rounded" /></th>
                <th className="w-14">No</th>
                <SortableHeader columnKey="declarationNo">신고번호</SortableHeader>
                <SortableHeader columnKey="declarationDate">신고일자</SortableHeader>
                <SortableHeader columnKey="importerExporter">수입자</SortableHeader>
                <SortableHeader columnKey="brokerName">관세사</SortableHeader>
                <SortableHeader columnKey="hsCode">HS Code</SortableHeader>
                <SortableHeader columnKey="goodsDesc">품명</SortableHeader>
                <SortableHeader columnKey="packageQty">수량</SortableHeader>
                <SortableHeader columnKey="declaredValue">신고금액</SortableHeader>
                <SortableHeader columnKey="totalTax">총세액</SortableHeader>
                <SortableHeader columnKey="status">상태</SortableHeader>
              </tr>
            </thead>
            <tbody>
              {sortedData.length === 0 ? (
                <tr><td colSpan={12} className="text-center py-8 text-[var(--muted)]">데이터가 없습니다.</td></tr>
              ) : (
                sortedData.map((item, index) => (
                  <tr key={item.id} className="cursor-pointer">
                    <td className="text-center" onClick={e => e.stopPropagation()}><input type="checkbox" checked={selectedRows.includes(item.id)} onChange={e => handleSelectRow(item.id, e.target.checked)} className="rounded" /></td>
                    <td className="text-center text-sm">{index + 1}</td>
                    <td className="text-center"><Link href={`/logis/customs/sea/${item.id}`} className="text-[#6e5fc9] hover:underline font-medium">{item.declarationNo}</Link></td>
                    <td className="text-center">{item.declarationDate}</td>
                    <td className="text-center">{item.importerExporter}</td>
                    <td className="text-center">{item.brokerName || '-'}</td>
                    <td className="text-center">{item.hsCode}</td>
                    <td className="text-center">{item.goodsDesc}</td>
                    <td className="text-center">{item.packageQty?.toLocaleString() || 0}</td>
                    <td className="text-center">{formatCurrency(Number(item.declaredValue), item.currency)}</td>
                    <td className="text-center">{Number(item.totalTax) > 0 ? formatCurrency(Number(item.totalTax)) : '-'}</td>
                    <td className="text-center"><span className={`px-2 py-1 text-xs rounded-full text-white ${statusConfig[item.status]?.color || 'bg-gray-500'}`}>{statusConfig[item.status]?.label || item.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
      <CloseConfirmModal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} onConfirm={handleConfirmClose} />
    </PageLayout>
  );
}
