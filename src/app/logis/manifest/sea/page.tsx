'use client';

import { useRouter } from 'next/navigation';
import { LIST_PATHS } from '@/constants/paths';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import DateRangeButtons, { getToday } from '@/components/DateRangeButtons';
import SearchFilterPanel, { SearchFilterGrid, SearchFilterField, DateRangeField, TextField, SelectField } from '@/components/search/SearchFilterPanel';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';

interface ManifestData {
  id: string;
  mfNo: string;
  mfDate: string;
  mfType: string;
  blNo: string;
  vessel: string;
  voyage: string;
  pol: string;
  pod: string;
  etd: string;
  shipper: string;
  consignee: string;
  containerQty: number;
  grossWeight: number;
  ediStatus: string;
  status: string;
}

// 정렬 설정 인터페이스
interface SortConfig {
  key: keyof ManifestData | null;
  direction: 'asc' | 'desc';
}

// 정렬 아이콘 컴포넌트 (CSS 삼각형 스타일)
const SortIcon = ({ columnKey, sortConfig }: { columnKey: keyof ManifestData; sortConfig: SortConfig }) => {
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
  READY: { label: '제출대기', color: 'bg-yellow-500' },
  SENT: { label: '전송완료', color: 'bg-blue-500' },
  ACCEPTED: { label: '수리', color: 'bg-green-500' },
  REJECTED: { label: '반려', color: 'bg-red-500' },
};

const ediStatusConfig: Record<string, { label: string; color: string }> = {
  NOT_SENT: { label: '미전송', color: 'text-gray-500' },
  SENDING: { label: '전송중', color: 'text-yellow-500' },
  SENT: { label: '전송완료', color: 'text-blue-500' },
  ERROR: { label: '전송오류', color: 'text-red-500' },
};

const defaultData: ManifestData[] = [
  { id: '1', mfNo: 'MF-2026-0001', mfDate: '2026-01-20', mfType: '수출', blNo: 'HDMU1234567', vessel: 'HMM GDANSK', voyage: '001E', pol: 'KRPUS', pod: 'USLAX', etd: '2026-01-22', shipper: '삼성전자', consignee: 'Samsung America', containerQty: 2, grossWeight: 18500, ediStatus: 'SENT', status: 'ACCEPTED' },
  { id: '2', mfNo: 'MF-2026-0002', mfDate: '2026-01-19', mfType: '수출', blNo: 'MAEU5678901', vessel: 'MAERSK EINDHOVEN', voyage: '002W', pol: 'KRPUS', pod: 'USNYC', etd: '2026-01-25', shipper: 'LG전자', consignee: 'LG Electronics USA', containerQty: 3, grossWeight: 22000, ediStatus: 'SENDING', status: 'SENT' },
  { id: '3', mfNo: 'MF-2026-0003', mfDate: '2026-01-18', mfType: '수출', blNo: 'MSCU2345678', vessel: 'MSC OSCAR', voyage: '003E', pol: 'KRPUS', pod: 'DEHAM', etd: '2026-01-28', shipper: '현대자동차', consignee: 'Hyundai Motor Germany', containerQty: 5, grossWeight: 45000, ediStatus: 'NOT_SENT', status: 'DRAFT' },
  { id: '4', mfNo: 'MF-2026-0004', mfDate: '2026-01-17', mfType: '수입', blNo: 'EGLV9012345', vessel: 'EVER GIVEN', voyage: '004W', pol: 'CNSHA', pod: 'KRPUS', etd: '2026-01-15', shipper: 'China Electronics', consignee: 'SK하이닉스', containerQty: 4, grossWeight: 32000, ediStatus: 'ERROR', status: 'REJECTED' },
];

export default function ManifestListPage() {
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const today = getToday();
  const [filters, setFilters] = useState({
    startDate: today,
    endDate: today,
    mfNo: '',
    blNo: '',
    mfType: '',
    vessel: '',
    status: '',
  });
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [data, setData] = useState<ManifestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/manifest/sea');
      if (response.ok) {
        const result = await response.json();
        if (Array.isArray(result) && result.length > 0) {
          const mappedData: ManifestData[] = result.map((item: Record<string, unknown>) => ({
            id: String(item.id || ''),
            mfNo: String(item.filingNo || item.id || ''),
            mfDate: String(item.filingDate || ''),
            mfType: '수출',
            blNo: String(item.mblNo || item.hblNo || ''),
            vessel: '-',
            voyage: '-',
            pol: 'KRPUS',
            pod: 'USLAX',
            etd: '-',
            shipper: String(item.shipperName || ''),
            consignee: String(item.consigneeName || ''),
            containerQty: 1,
            grossWeight: Number(item.weight) || 0,
            ediStatus: item.responseCode ? 'SENT' : 'NOT_SENT',
            status: String(item.status || 'DRAFT'),
          }));
          setData(mappedData);
        } else {
          setData(defaultData);
        }
      } else {
        setData(defaultData);
      }
    } catch (error) {
      console.error('적하목록 조회 오류:', error);
      setData(defaultData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDateRangeSelect = (startDate: string, endDate: string) => {
    setFilters(prev => ({ ...prev, startDate, endDate }));
  };

  const handleSearch = () => setAppliedFilters(filters);
  const handleReset = () => {
    const resetFilters = { startDate: today, endDate: today, mfNo: '', blNo: '', mfType: '', vessel: '', status: '' };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
  };

  const filteredData = data.filter(item => {
    if (appliedFilters.mfNo && !item.mfNo.toLowerCase().includes(appliedFilters.mfNo.toLowerCase())) return false;
    if (appliedFilters.blNo && !item.blNo.toLowerCase().includes(appliedFilters.blNo.toLowerCase())) return false;
    if (appliedFilters.mfType && item.mfType !== appliedFilters.mfType) return false;
    if (appliedFilters.vessel && !item.vessel.toLowerCase().includes(appliedFilters.vessel.toLowerCase())) return false;
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
  const handleSort = (key: keyof ManifestData) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // 정렬 가능한 헤더 컴포넌트
  const SortableHeader = ({ columnKey, children, className = '' }: { columnKey: keyof ManifestData; children: React.ReactNode; className?: string }) => (
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
    sent: filteredData.filter(d => d.status === 'SENT').length,
    accepted: filteredData.filter(d => d.status === 'ACCEPTED').length,
    rejected: filteredData.filter(d => d.status === 'REJECTED').length,
  };

  const handleSendEDI = (id: string) => {
    alert('적하목록 ID ' + id + '의 EDI를 전송합니다.');
  };
  // 수정 버튼 핸들러
  const handleEdit = () => {
    if (selectedIds.length === 0) { alert('수정할 항목을 선택해주세요.'); return; }
    if (selectedIds.length > 1) { alert('수정할 항목을 1개만 선택해주세요.'); return; }
    const id = selectedIds[0];
    router.push(`/logis/manifest/sea/register?id=${id}`);
  };


  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      alert('삭제할 항목을 선택해주세요.');
      return;
    }
    if (!confirm('선택한 ' + selectedIds.length + '건을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch('/api/manifest/sea?ids=' + selectedIds.join(','), {
        method: 'DELETE',
      });
      if (response.ok) {
        alert('삭제되었습니다.');
        setSelectedIds([]);
        fetchData();
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredData.map(item => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleCloseClick = () => {
    setShowCloseModal(true);
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
        <PageLayout title="적하목록 관리" subtitle="Logis > 적하목록 > 적하목록 관리 (해상)" showCloseButton={false} >
        <main ref={formRef} className="p-6">
          <div className="flex justify-end items-center mb-6">
            <div className="flex gap-2">
              <button onClick={() => router.push('/logis/manifest/sea/register')} className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] text-sm">신규</button>
              <button onClick={handleEdit} className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] text-sm">
                수정
              </button>
              <button onClick={handleDelete} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">삭제</button>
              <Link href="/logis/manifest/sea/register" className="px-6 py-2 font-semibold rounded-lg bg-[var(--surface-100)] text-[var(--foreground)] hover:bg-[var(--surface-200)]">
                신규 등록
              </Link>
            </div>
          </div>

          {/* 검색조건 - SearchFilterPanel 컴포넌트 사용 */}
          <SearchFilterPanel onSearch={handleSearch} onReset={handleReset} className="mb-6">
            <SearchFilterGrid columns={6}>
              <SearchFilterField label="적하목록 일자" colSpan={2}>
                <DateRangeField
                  startValue={filters.startDate}
                  endValue={filters.endDate}
                  onStartChange={(value) => setFilters(prev => ({ ...prev, startDate: value }))}
                  onEndChange={(value) => setFilters(prev => ({ ...prev, endDate: value }))}
                />
                <DateRangeButtons onRangeSelect={handleDateRangeSelect} />
              </SearchFilterField>
              <SearchFilterField label="적하목록 번호">
                <TextField
                  value={filters.mfNo}
                  onChange={(value) => setFilters(prev => ({ ...prev, mfNo: value }))}
                  placeholder="MF-YYYY-XXXX"
                />
              </SearchFilterField>
              <SearchFilterField label="B/L 번호">
                <TextField
                  value={filters.blNo}
                  onChange={(value) => setFilters(prev => ({ ...prev, blNo: value }))}
                  placeholder="HDMU1234567"
                />
              </SearchFilterField>
              <SearchFilterField label="구분">
                <SelectField
                  value={filters.mfType}
                  onChange={(value) => setFilters(prev => ({ ...prev, mfType: value }))}
                  options={[
                    { value: '수출', label: '수출' },
                    { value: '수입', label: '수입' },
                  ]}
                />
              </SearchFilterField>
              <SearchFilterField label="선명">
                <TextField
                  value={filters.vessel}
                  onChange={(value) => setFilters(prev => ({ ...prev, vessel: value }))}
                  placeholder="선박명"
                />
              </SearchFilterField>
              <SearchFilterField label="상태">
                <SelectField
                  value={filters.status}
                  onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                  options={[
                    { value: 'DRAFT', label: '작성중' },
                    { value: 'READY', label: '제출대기' },
                    { value: 'SENT', label: '전송완료' },
                    { value: 'ACCEPTED', label: '수리' },
                    { value: 'REJECTED', label: '반려' },
                  ]}
                />
              </SearchFilterField>
            </SearchFilterGrid>
          </SearchFilterPanel>

          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="card p-4 text-center"><div className="text-2xl font-bold">{summaryStats.total}</div><div className="text-sm text-[var(--muted)]">전체</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-gray-500">{summaryStats.draft}</div><div className="text-sm text-[var(--muted)]">작성중</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-blue-500">{summaryStats.sent}</div><div className="text-sm text-[var(--muted)]">전송완료</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-green-500">{summaryStats.accepted}</div><div className="text-sm text-[var(--muted)]">수리</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-red-500">{summaryStats.rejected}</div><div className="text-sm text-[var(--muted)]">반려</div></div>
          </div>

          <div className="card overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-[var(--muted)]">데이터를 불러오는 중...</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th className="text-center w-12">
                      <input type="checkbox" checked={selectedIds.length === sortedData.length && sortedData.length > 0} onChange={e => handleSelectAll(e.target.checked)} className="w-4 h-4" />
                    </th>
                    <th className="w-14">No</th>
                    <SortableHeader columnKey="mfNo">적하목록번호</SortableHeader>
                    <SortableHeader columnKey="mfDate">일자</SortableHeader>
                    <SortableHeader columnKey="mfType">구분</SortableHeader>
                    <SortableHeader columnKey="blNo">B/L 번호</SortableHeader>
                    <SortableHeader columnKey="vessel">선명/항차</SortableHeader>
                    <SortableHeader columnKey="pol">POL/POD</SortableHeader>
                    <SortableHeader columnKey="shipper">화주</SortableHeader>
                    <SortableHeader columnKey="containerQty">컨테이너</SortableHeader>
                    <SortableHeader columnKey="grossWeight">중량(KG)</SortableHeader>
                    <SortableHeader columnKey="ediStatus">EDI</SortableHeader>
                    <SortableHeader columnKey="status">상태</SortableHeader>
                    <th className="text-center">전송</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {sortedData.map((item, index) => (
                    <tr key={item.id} className="hover:bg-[var(--surface-50)] cursor-pointer" onClick={() => router.push(`/logis/manifest/sea/${item.id}`)}>
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={e => handleSelectOne(item.id, e.target.checked)} className="w-4 h-4" />
                      </td>
                      <td className="text-center text-[var(--muted)]">{index + 1}</td>
                      <td className="px-4 py-3 text-center"><Link href={`/logis/manifest/sea/${item.id}`} className="text-blue-400 hover:underline" onClick={(e) => e.stopPropagation()}>{item.mfNo}</Link></td>
                      <td className="px-4 py-3 text-sm text-center">{item.mfDate}</td>
                      <td className="px-4 py-3 text-sm text-center">{item.mfType}</td>
                      <td className="px-4 py-3 text-sm text-center">{item.blNo}</td>
                      <td className="px-4 py-3 text-sm text-center">{item.vessel}<br /><span className="text-[var(--muted)]">{item.voyage}</span></td>
                      <td className="px-4 py-3 text-sm text-center">{item.pol} → {item.pod}</td>
                      <td className="px-4 py-3 text-sm text-center">{item.shipper}</td>
                      <td className="px-4 py-3 text-sm text-center">{item.containerQty}</td>
                      <td className="px-4 py-3 text-sm text-center">{item.grossWeight.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-center"><span className={ediStatusConfig[item.ediStatus]?.color || 'text-gray-500'}>{ediStatusConfig[item.ediStatus]?.label || '-'}</span></td>
                      <td className="px-4 py-3 text-center"><span className={'px-2 py-1 text-xs rounded-full text-white ' + (statusConfig[item.status]?.color || 'bg-gray-500')}>{statusConfig[item.status]?.label || item.status}</span></td>
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        {(item.status === 'DRAFT' || item.status === 'READY' || item.status === 'REJECTED') && (
                          <button onClick={() => handleSendEDI(item.id)} className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">EDI전송</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      <CloseConfirmModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onConfirm={handleConfirmClose}
      />
    </PageLayout>
  );
}
