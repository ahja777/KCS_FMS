'use client';

import { useRouter } from 'next/navigation';
import { LIST_PATHS } from '@/constants/paths';

import { useState, useRef, useEffect, useMemo } from 'react';
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

// 정렬 설정 인터페이스
interface SortConfig {
  key: keyof CustomsData | null;
  direction: 'asc' | 'desc';
}

// 정렬 아이콘 컴포넌트 (CSS 삼각형 스타일)
const SortIcon = ({ columnKey, sortConfig }: { columnKey: keyof CustomsData; sortConfig: SortConfig }) => {
  const isActive = sortConfig.key === columnKey;
  return (
    <span className="inline-flex flex-col ml-1.5 gap-px">
      <span
        style={{
          width: 0,
          height: 0,
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderBottom: `5px solid ${isActive && sortConfig.direction === 'asc' ? '#ffffff' : 'rgba(255,255,255,0.35)'}`,
        }}
      />
      <span
        style={{
          width: 0,
          height: 0,
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderTop: `5px solid ${isActive && sortConfig.direction === 'desc' ? '#ffffff' : 'rgba(255,255,255,0.35)'}`,
        }}
      />
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

// 샘플 데이터
const sampleData: CustomsData[] = [
  { id: '1', declarationNo: 'ED2026-001234', declarationType: 'EXPORT', declarationDate: '2026-01-28', brokerName: '(주)세일관세사', importerExporter: '삼성전자', hsCode: '8471.30', goodsDesc: '휴대용 컴퓨터', packageQty: 500, grossWeight: '2500', declaredValue: '125000000', currency: 'KRW', totalTax: '0', status: 'CLEARED', clearanceDate: '2026-01-28' },
  { id: '2', declarationNo: 'ID2026-005678', declarationType: 'IMPORT', declarationDate: '2026-01-27', brokerName: '(주)한진관세사', importerExporter: 'LG전자', hsCode: '8542.31', goodsDesc: '집적회로(반도체)', packageQty: 1000, grossWeight: '500', declaredValue: '85000', currency: 'USD', totalTax: '8500000', status: 'ACCEPTED', clearanceDate: '2026-01-27' },
  { id: '3', declarationNo: 'ED2026-002345', declarationType: 'EXPORT', declarationDate: '2026-01-27', brokerName: '(주)현대관세사', importerExporter: '현대자동차', hsCode: '8703.23', goodsDesc: '승용자동차 부품', packageQty: 200, grossWeight: '8000', declaredValue: '450000', currency: 'USD', totalTax: '0', status: 'SUBMITTED', clearanceDate: null },
  { id: '4', declarationNo: 'ID2026-006789', declarationType: 'IMPORT', declarationDate: '2026-01-26', brokerName: '(주)세일관세사', importerExporter: 'SK하이닉스', hsCode: '8486.20', goodsDesc: '반도체 제조장비', packageQty: 5, grossWeight: '25000', declaredValue: '2500000', currency: 'USD', totalTax: '250000000', status: 'CLEARED', clearanceDate: '2026-01-26' },
  { id: '5', declarationNo: 'ED2026-003456', declarationType: 'EXPORT', declarationDate: '2026-01-25', brokerName: '(주)포스코관세사', importerExporter: '포스코', hsCode: '7208.51', goodsDesc: '열연강판', packageQty: 50, grossWeight: '150000', declaredValue: '180000', currency: 'USD', totalTax: '0', status: 'DRAFT', clearanceDate: null },
];

export default function CustomsListPage() {
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const today = getToday();
  const [filters, setFilters] = useState({
    startDate: today,
    endDate: today,
    declarationNo: '',
    declarationType: '',
    importerExporter: '',
    status: '',
  });
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [data, setData] = useState<CustomsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customs/sea');
      if (response.ok) {
        const result = await response.json();
        if (result && result.length > 0) {
          setData(result);
        } else {
          setData(sampleData);
        }
      } else {
        setData(sampleData);
      }
    } catch (error) {
      console.error('Failed to fetch customs data:', error);
      setData(sampleData);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeSelect = (startDate: string, endDate: string) => {
    setFilters(prev => ({ ...prev, startDate, endDate }));
  };

  const handleSearch = () => setAppliedFilters(filters);
  const handleReset = () => {
    const resetFilters = { startDate: today, endDate: today, declarationNo: '', declarationType: '', importerExporter: '', status: '' };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
  };

  const filteredData = data.filter(item => {
    if (appliedFilters.declarationNo && !item.declarationNo.toLowerCase().includes(appliedFilters.declarationNo.toLowerCase())) return false;
    if (appliedFilters.declarationType && item.declarationType !== appliedFilters.declarationType) return false;
    if (appliedFilters.importerExporter && !item.importerExporter.toLowerCase().includes(appliedFilters.importerExporter.toLowerCase())) return false;
    if (appliedFilters.status && item.status !== appliedFilters.status) return false;
    return true;
  });

  // 정렬된 데이터
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

      const aStr = String(aValue);
      const bStr = String(bValue);
      const comparison = aStr.localeCompare(bStr, 'ko');
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig]);

  // 정렬 핸들러
  const handleSort = (key: keyof CustomsData) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // 정렬 가능한 헤더 컴포넌트
  const SortableHeader = ({ columnKey, children, className = '' }: { columnKey: keyof CustomsData; children: React.ReactNode; className?: string }) => (
    <th
      className={`cursor-pointer select-none text-center ${className}`}
      onClick={() => handleSort(columnKey)}
    >
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

  const handleCloseClick = () => {
    setShowCloseModal(true);
  };

  const handleConfirmClose = () => {
    setShowCloseModal(false);
    router.push(LIST_PATHS.DASHBOARD);
  };

  // 브라우저 뒤로가기 버튼 처리
  useCloseConfirm({
    showModal: showCloseModal,
    setShowModal: setShowCloseModal,
    onConfirmClose: handleConfirmClose,
  });

  return (
        <PageLayout title="통관 관리" subtitle="Logis > 통관 > 통관 관리 (해상)" showCloseButton={false} >
        <main ref={formRef} className="p-6">
          <div className="flex justify-end items-center mb-6">
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
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">신고 일자</label>
                  <div className="flex gap-2 items-center flex-nowrap">
                    <input type="date" value={filters.startDate} onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))} className="w-[130px] h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg flex-shrink-0 text-sm" />
                    <span className="text-[var(--muted)] flex-shrink-0">~</span>
                    <input type="date" value={filters.endDate} onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))} className="w-[130px] h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg flex-shrink-0 text-sm" />
                    <DateRangeButtons onRangeSelect={handleDateRangeSelect} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">신고번호</label>
                  <input type="text" value={filters.declarationNo} onChange={e => setFilters(prev => ({ ...prev, declarationNo: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="ED2024-001234" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">구분</label>
                  <select value={filters.declarationType} onChange={e => setFilters(prev => ({ ...prev, declarationType: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm">
                    <option value="">전체</option>
                    <option value="EXPORT">수출</option>
                    <option value="IMPORT">수입</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">수출입자</label>
                  <input type="text" value={filters.importerExporter} onChange={e => setFilters(prev => ({ ...prev, importerExporter: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="업체명" />
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
            {loading ? (
              <div className="p-8 text-center text-[var(--muted)]">데이터를 불러오는 중...</div>
            ) : (
            <table className="table">
              <thead>
                <tr>
                  <SortableHeader columnKey="declarationNo">신고번호</SortableHeader>
                  <SortableHeader columnKey="declarationDate">신고일자</SortableHeader>
                  <SortableHeader columnKey="declarationType">구분</SortableHeader>
                  <SortableHeader columnKey="importerExporter">수출입자</SortableHeader>
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
                  <tr><td colSpan={11} className="text-center py-8 text-[var(--muted)]">데이터가 없습니다.</td></tr>
                ) : (
                sortedData.map(item => (
                  <tr key={item.id} className="cursor-pointer">
                    <td className="text-center"><Link href={`/logis/customs/sea/${item.id}`} className="text-[#6e5fc9] hover:underline font-medium">{item.declarationNo}</Link></td>
                    <td className="text-center">{item.declarationDate}</td>
                    <td className="text-center">{item.declarationType === 'EXPORT' ? '수출' : '수입'}</td>
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
            )}
          </div>
        </main>
      {/* 화면 닫기 확인 모달 */}
      <CloseConfirmModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onConfirm={handleConfirmClose}
      />
    </PageLayout>
  );
}
