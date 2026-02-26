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

interface AMSData {
  id: string;
  amsNo: string;
  amsDate: string;
  amsType: string;
  targetCountry: string;
  blNo: string;
  shipper: string;
  consignee: string;
  vessel: string;
  voyage: string;
  pol: string;
  pod: string;
  etd: string;
  filingDeadline: string;
  containerQty: number;
  responseCode: string;
  status: string;
}

// 정렬 설정 인터페이스
interface SortConfig {
  key: keyof AMSData | null;
  direction: 'asc' | 'desc';
}

// 정렬 아이콘 컴포넌트 (CSS 삼각형 스타일)
const SortIcon = ({ columnKey, sortConfig }: { columnKey: keyof AMSData; sortConfig: SortConfig }) => {
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
  SENT: { label: '전송완료', color: 'bg-blue-500' },
  ACCEPTED: { label: '접수완료', color: 'bg-green-500' },
  HOLD: { label: 'HOLD', color: 'bg-yellow-500' },
  REJECTED: { label: '반려', color: 'bg-red-500' },
  NO_LOAD: { label: 'DO NOT LOAD', color: 'bg-red-600' },
};

const responseConfig: Record<string, { label: string; color: string }> = {
  NONE: { label: '-', color: 'text-gray-500' },
  '': { label: '-', color: 'text-gray-500' },
  '1A': { label: '1A (접수)', color: 'text-green-500' },
  '1B': { label: '1B (Hold)', color: 'text-yellow-500' },
  '1C': { label: '1C (반려)', color: 'text-red-500' },
  '3H': { label: '3H (Do Not Load)', color: 'text-red-600' },
};

const defaultData: AMSData[] = [
  { id: '1', amsNo: 'AMS-2026-0001', amsDate: '2026-01-20', amsType: 'ISF', targetCountry: 'USA', blNo: 'HDMU1234567', shipper: '삼성전자', consignee: 'Samsung America', vessel: 'HMM GDANSK', voyage: '001E', pol: 'KRPUS', pod: 'USLAX', etd: '2026-01-22', filingDeadline: '2026-01-20 12:00', containerQty: 2, responseCode: '1A', status: 'ACCEPTED' },
  { id: '2', amsNo: 'AMS-2026-0002', amsDate: '2026-01-19', amsType: 'AMS', targetCountry: 'USA', blNo: 'MAEU5678901', shipper: 'LG전자', consignee: 'LG Electronics USA', vessel: 'MAERSK EINDHOVEN', voyage: '002W', pol: 'KRPUS', pod: 'USNYC', etd: '2026-01-25', filingDeadline: '2026-01-23 12:00', containerQty: 3, responseCode: '1B', status: 'HOLD' },
  { id: '3', amsNo: 'AMS-2026-0003', amsDate: '2026-01-18', amsType: 'ACI', targetCountry: 'Canada', blNo: 'MSCU2345678', shipper: '현대자동차', consignee: 'Hyundai Motor Canada', vessel: 'MSC OSCAR', voyage: '003E', pol: 'KRPUS', pod: 'CAHAL', etd: '2026-01-28', filingDeadline: '2026-01-25 00:00', containerQty: 5, responseCode: 'NONE', status: 'SENT' },
  { id: '4', amsNo: 'AMS-2026-0004', amsDate: '2026-01-17', amsType: 'ENS', targetCountry: 'EU', blNo: 'EGLV9012345', shipper: 'SK하이닉스', consignee: 'SK Hynix Europe', vessel: 'EVER GIVEN', voyage: '004W', pol: 'KRPUS', pod: 'DEHAM', etd: '2026-02-01', filingDeadline: '2026-01-30 00:00', containerQty: 1, responseCode: 'NONE', status: 'DRAFT' },
  { id: '5', amsNo: 'AMS-2026-0005', amsDate: '2026-01-16', amsType: 'AFR', targetCountry: 'Japan', blNo: 'NYKU7890123', shipper: '포스코', consignee: 'Nippon Steel', vessel: 'ONE STORK', voyage: '005E', pol: 'KRPUS', pod: 'JPYOK', etd: '2026-01-22', filingDeadline: '2026-01-20 00:00', containerQty: 10, responseCode: '1A', status: 'ACCEPTED' },
];

export default function AMSListPage() {
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const today = getToday();
  const [filters, setFilters] = useState({
    startDate: today,
    endDate: today,
    amsNo: '',
    blNo: '',
    amsType: '',
    targetCountry: '',
    shipper: '',
    status: '',
  });
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [data, setData] = useState<AMSData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ams/sea');
      if (response.ok) {
        const result = await response.json();
        if (Array.isArray(result) && result.length > 0) {
          const mappedData: AMSData[] = result.map((item: Record<string, unknown>) => ({
            id: String(item.id || ''),
            amsNo: String(item.filingNo || item.id || ''),
            amsDate: String(item.filingDate || ''),
            amsType: 'AMS',
            targetCountry: 'USA',
            blNo: String(item.mblNo || item.hblNo || ''),
            shipper: String(item.shipperName || ''),
            consignee: String(item.consigneeName || ''),
            vessel: '-',
            voyage: '-',
            pol: 'KRPUS',
            pod: 'USLAX',
            etd: '-',
            filingDeadline: String(item.filingDate || ''),
            containerQty: 1,
            responseCode: String(item.responseCode || 'NONE'),
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
      console.error('AMS 조회 오류:', error);
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
    const resetFilters = { startDate: today, endDate: today, amsNo: '', blNo: '', amsType: '', targetCountry: '', shipper: '', status: '' };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
  };

  const filteredData = data.filter(item => {
    if (appliedFilters.amsNo && !item.amsNo.toLowerCase().includes(appliedFilters.amsNo.toLowerCase())) return false;
    if (appliedFilters.blNo && !item.blNo.toLowerCase().includes(appliedFilters.blNo.toLowerCase())) return false;
    if (appliedFilters.amsType && item.amsType !== appliedFilters.amsType) return false;
    if (appliedFilters.targetCountry && item.targetCountry !== appliedFilters.targetCountry) return false;
    if (appliedFilters.shipper && !item.shipper.toLowerCase().includes(appliedFilters.shipper.toLowerCase())) return false;
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
  const handleSort = (key: keyof AMSData) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // 정렬 가능한 헤더 컴포넌트
  const SortableHeader = ({ columnKey, children, className = '' }: { columnKey: keyof AMSData; children: React.ReactNode; className?: string }) => (
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
    hold: filteredData.filter(d => d.status === 'HOLD').length,
  };

  const handleSendAMS = (id: string) => {
    alert('AMS ID ' + id + '를 세관으로 전송합니다.');
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      alert('삭제할 항목을 선택해주세요.');
      return;
    }
    if (!confirm('선택한 ' + selectedIds.length + '건을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch('/api/ams/sea?ids=' + selectedIds.join(','), {
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
        <PageLayout title="AMS 관리" subtitle="Logis > AMS > AMS 관리 (해상)" showCloseButton={false} >
        <main ref={formRef} className="p-6">
          <div className="flex justify-end items-center mb-6">
            <div className="flex gap-2">
              <button onClick={handleDelete} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">삭제</button>
              <Link href="/logis/ams/sea/register" className="px-6 py-2 font-semibold rounded-lg bg-[var(--surface-100)] text-[var(--foreground)] hover:bg-[var(--surface-200)]">
                신규 등록
              </Link>
            </div>
          </div>

          {/* 검색조건 - SearchFilterPanel 컴포넌트 사용 */}
          <SearchFilterPanel onSearch={handleSearch} onReset={handleReset} className="mb-6">
            <SearchFilterGrid columns={4}>
              <SearchFilterField label="AMS 일자" colSpan={2}>
                <DateRangeField
                  startValue={filters.startDate}
                  endValue={filters.endDate}
                  onStartChange={(value) => setFilters(prev => ({ ...prev, startDate: value }))}
                  onEndChange={(value) => setFilters(prev => ({ ...prev, endDate: value }))}
                />
                <DateRangeButtons onRangeSelect={handleDateRangeSelect} />
              </SearchFilterField>
              <SearchFilterField label="AMS 번호">
                <TextField
                  value={filters.amsNo}
                  onChange={(value) => setFilters(prev => ({ ...prev, amsNo: value }))}
                  placeholder="AMS-YYYY-XXXX"
                />
              </SearchFilterField>
              <SearchFilterField label="B/L 번호">
                <TextField
                  value={filters.blNo}
                  onChange={(value) => setFilters(prev => ({ ...prev, blNo: value }))}
                  placeholder="HDMU1234567"
                />
              </SearchFilterField>
              <SearchFilterField label="AMS 유형">
                <SelectField
                  value={filters.amsType}
                  onChange={(value) => setFilters(prev => ({ ...prev, amsType: value }))}
                  options={[
                    { value: 'AMS', label: 'AMS (미국)' },
                    { value: 'ISF', label: 'ISF (미국)' },
                    { value: 'ACI', label: 'ACI (캐나다)' },
                    { value: 'ENS', label: 'ENS (EU)' },
                    { value: 'AFR', label: 'AFR (일본)' },
                  ]}
                />
              </SearchFilterField>
              <SearchFilterField label="대상국가">
                <SelectField
                  value={filters.targetCountry}
                  onChange={(value) => setFilters(prev => ({ ...prev, targetCountry: value }))}
                  options={[
                    { value: 'USA', label: 'USA' },
                    { value: 'Canada', label: 'Canada' },
                    { value: 'EU', label: 'EU' },
                    { value: 'Japan', label: 'Japan' },
                    { value: 'Mexico', label: 'Mexico' },
                  ]}
                />
              </SearchFilterField>
              <SearchFilterField label="화주">
                <TextField
                  value={filters.shipper}
                  onChange={(value) => setFilters(prev => ({ ...prev, shipper: value }))}
                  placeholder="화주명"
                />
              </SearchFilterField>
              <SearchFilterField label="상태">
                <SelectField
                  value={filters.status}
                  onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                  options={[
                    { value: 'DRAFT', label: '작성중' },
                    { value: 'SENT', label: '전송완료' },
                    { value: 'ACCEPTED', label: '접수완료' },
                    { value: 'HOLD', label: 'HOLD' },
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
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-green-500">{summaryStats.accepted}</div><div className="text-sm text-[var(--muted)]">접수완료</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-yellow-500">{summaryStats.hold}</div><div className="text-sm text-[var(--muted)]">HOLD</div></div>
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
                    <SortableHeader columnKey="amsNo">AMS 번호</SortableHeader>
                    <SortableHeader columnKey="amsDate">일자</SortableHeader>
                    <SortableHeader columnKey="amsType">유형</SortableHeader>
                    <SortableHeader columnKey="targetCountry">대상국</SortableHeader>
                    <SortableHeader columnKey="blNo">B/L 번호</SortableHeader>
                    <SortableHeader columnKey="shipper">화주</SortableHeader>
                    <SortableHeader columnKey="vessel">선명/항차</SortableHeader>
                    <SortableHeader columnKey="pol">POL/POD</SortableHeader>
                    <SortableHeader columnKey="filingDeadline">Filing 마감</SortableHeader>
                    <SortableHeader columnKey="responseCode">Response</SortableHeader>
                    <SortableHeader columnKey="status">상태</SortableHeader>
                    <th className="text-center">전송</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {sortedData.map((item, index) => (
                    <tr key={item.id} className="hover:bg-[var(--surface-50)] cursor-pointer" onClick={() => router.push(`/logis/ams/sea/${item.id}`)}>
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={e => handleSelectOne(item.id, e.target.checked)} className="w-4 h-4" />
                      </td>
                      <td className="text-center text-[var(--muted)]">{index + 1}</td>
                      <td className="px-4 py-3 text-center"><Link href={`/logis/ams/sea/${item.id}`} className="text-blue-400 hover:underline" onClick={(e) => e.stopPropagation()}>{item.amsNo}</Link></td>
                      <td className="px-4 py-3 text-sm text-center">{item.amsDate}</td>
                      <td className="px-4 py-3 text-sm text-center font-medium">{item.amsType}</td>
                      <td className="px-4 py-3 text-sm text-center">{item.targetCountry}</td>
                      <td className="px-4 py-3 text-sm text-center">{item.blNo}</td>
                      <td className="px-4 py-3 text-sm text-center">{item.shipper}</td>
                      <td className="px-4 py-3 text-sm text-center">{item.vessel}<br /><span className="text-[var(--muted)]">{item.voyage}</span></td>
                      <td className="px-4 py-3 text-sm text-center">{item.pol} → {item.pod}</td>
                      <td className="px-4 py-3 text-sm text-center">{item.filingDeadline}</td>
                      <td className="px-4 py-3 text-sm text-center"><span className={responseConfig[item.responseCode]?.color || 'text-gray-500'}>{responseConfig[item.responseCode]?.label || '-'}</span></td>
                      <td className="px-4 py-3 text-center"><span className={'px-2 py-1 text-xs rounded-full text-white ' + (statusConfig[item.status]?.color || 'bg-gray-500')}>{statusConfig[item.status]?.label || item.status}</span></td>
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        {item.status === 'DRAFT' && (
                          <button onClick={() => handleSendAMS(item.id)} className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">전송</button>
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
