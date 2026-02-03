'use client';

import { useRouter } from 'next/navigation';
import { LIST_PATHS } from '@/constants/paths';
import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import DateRangeButtons, { getToday, calculateDateRange } from '@/components/DateRangeButtons';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import ExcelButtons from '@/components/ExcelButtons';
import { useSorting, SortableHeader, SortStatusBadge } from '@/components/table';

interface ScheduleData {
  id: number;
  transportType: 'SEA' | 'AIR';
  carrier: string;
  vessel: string;
  voyage: string;
  callSign: string | null;
  imo: string | null;
  origin: string;
  originTerminal: string;
  destination: string;
  destinationTerminal: string;
  etd: string;
  atd: string | null;
  eta: string;
  ata: string | null;
  transitDays: number;
  cutOff: string;
  cyClosing: string | null;
  cfsClosing: string | null;
  status: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  SCHEDULED: { label: '예정', color: 'bg-blue-500', bgColor: '#DBEAFE' },
  OPEN: { label: '부킹가능', color: 'bg-green-500', bgColor: '#D1FAE5' },
  LIMITED: { label: '잔여공간', color: 'bg-yellow-500', bgColor: '#FEF3C7' },
  FULL: { label: '만석', color: 'bg-red-500', bgColor: '#FEE2E2' },
  CLOSED: { label: '마감', color: 'bg-gray-500', bgColor: '#F3F4F6' },
  DEPARTED: { label: '출발', color: 'bg-purple-500', bgColor: '#E9D5FF' },
  ARRIVED: { label: '도착', color: 'bg-teal-500', bgColor: '#CCFBF1' },
  CANCELLED: { label: '취소', color: 'bg-red-500', bgColor: '#FEE2E2' },
};

const getStatusConfig = (status: string) =>
  statusConfig[status] || { label: status || '미정', color: 'bg-gray-500', bgColor: '#F3F4F6' };

const excelColumns: { key: keyof ScheduleData; label: string }[] = [
  { key: 'transportType', label: '운송유형' },
  { key: 'carrier', label: '운송사' },
  { key: 'vessel', label: '선명/편명' },
  { key: 'voyage', label: 'Voyage' },
  { key: 'callSign', label: 'Call Sign' },
  { key: 'imo', label: 'IMO' },
  { key: 'origin', label: '출발지' },
  { key: 'destination', label: '도착지' },
  { key: 'etd', label: '출발예정일시' },
  { key: 'atd', label: '출발실제일시' },
  { key: 'eta', label: '도착예정일시' },
  { key: 'ata', label: '도착실제일시' },
  { key: 'transitDays', label: 'T/T(일)' },
  { key: 'cutOff', label: 'Cut-Off' },
  { key: 'status', label: '상태' },
];

export default function ShipperSchedulePage() {
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const { startDate: monthStart, endDate: monthEnd } = calculateDateRange('month');
  const [filters, setFilters] = useState({
    startDate: monthStart,
    endDate: monthEnd,
    type: 'all',
    carrier: '',
    origin: '',
    destination: '',
  });
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [data, setData] = useState<ScheduleData[]>([]);
  const [loading, setLoading] = useState(false);

  const { sortConfig, handleSort, sortData, getSortStatusText, resetSort } = useSorting<ScheduleData>();

  const columnLabels: Record<string, string> = {
    transportType: '운송유형',
    carrier: '운송사',
    vessel: '선명/편명',
    origin: '출발지',
    destination: '도착지',
    etd: '출발예정',
    eta: '도착예정',
    transitDays: 'T/T',
    status: '상태',
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: appliedFilters.type,
        origin: appliedFilters.origin,
        destination: appliedFilters.destination,
        carrier: appliedFilters.carrier,
        startDate: appliedFilters.startDate,
        endDate: appliedFilters.endDate,
      });
      const response = await fetch(`/api/schedule/shipper?${params}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDateRangeSelect = (startDate: string, endDate: string) => {
    setFilters(prev => ({ ...prev, startDate, endDate }));
  };

  const handleSearch = () => setAppliedFilters(filters);
  const handleReset = () => {
    const resetFilters = {
      startDate: monthStart,
      endDate: monthEnd,
      type: 'all',
      carrier: '',
      origin: '',
      destination: ''
    };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
  };

  const sortedList = useMemo(() => sortData(data), [data, sortData]);

  const summaryStats = useMemo(() => ({
    total: data.length,
    sea: data.filter(d => d.transportType === 'SEA').length,
    air: data.filter(d => d.transportType === 'AIR').length,
    open: data.filter(d => d.status === 'OPEN' || d.status === 'SCHEDULED').length,
    departed: data.filter(d => d.status === 'DEPARTED').length,
    arrived: data.filter(d => d.status === 'ARRIVED').length,
  }), [data]);

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
    <PageLayout title="스케줄 조회 (화주)" subtitle="Logis > 공통 > 스케줄 조회" showCloseButton={false}>
      <main ref={formRef} className="p-6">
        <div className="flex justify-end items-center mb-6">
          <div className="flex gap-2">
            <ExcelButtons
              data={data}
              columns={excelColumns}
              filename="스케줄조회"
            />
          </div>
        </div>

        {/* 검색조건 */}
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
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">출발일 기간</label>
                <div className="flex gap-2 items-center flex-nowrap">
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-[130px] h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg flex-shrink-0 text-sm"
                  />
                  <span className="text-[var(--muted)] flex-shrink-0">~</span>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-[130px] h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg flex-shrink-0 text-sm"
                  />
                  <DateRangeButtons onRangeSelect={handleDateRangeSelect} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">운송유형</label>
                <select
                  value={filters.type}
                  onChange={e => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                >
                  <option value="all">전체</option>
                  <option value="sea">해상</option>
                  <option value="air">항공</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">운송사</label>
                <input
                  type="text"
                  value={filters.carrier}
                  onChange={e => setFilters(prev => ({ ...prev, carrier: e.target.value }))}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                  placeholder="HMM, MAERSK..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">출발지</label>
                <input
                  type="text"
                  value={filters.origin}
                  onChange={e => setFilters(prev => ({ ...prev, origin: e.target.value }))}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                  placeholder="KRPUS"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">도착지</label>
                <input
                  type="text"
                  value={filters.destination}
                  onChange={e => setFilters(prev => ({ ...prev, destination: e.target.value }))}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                  placeholder="USLAX"
                />
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-[var(--border)] flex justify-center gap-2">
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] font-medium"
            >
              조회
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
            >
              초기화
            </button>
          </div>
        </div>

        {/* 요약 통계 */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold">{summaryStats.total}</div>
            <div className="text-sm text-[var(--muted)]">전체</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">{summaryStats.sea}</div>
            <div className="text-sm text-[var(--muted)]">해상</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-sky-500">{summaryStats.air}</div>
            <div className="text-sm text-[var(--muted)]">항공</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-green-500">{summaryStats.open}</div>
            <div className="text-sm text-[var(--muted)]">예정/부킹가능</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-purple-500">{summaryStats.departed}</div>
            <div className="text-sm text-[var(--muted)]">출발</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-teal-500">{summaryStats.arrived}</div>
            <div className="text-sm text-[var(--muted)]">도착</div>
          </div>
        </div>

        {/* 스케줄 목록 */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] flex items-center gap-3">
            <h3 className="font-bold">스케줄 목록</h3>
            <span className="px-2 py-1 bg-[#E8A838]/20 text-[#E8A838] rounded text-sm font-medium">
              {data.length}건
            </span>
            <SortStatusBadge statusText={getSortStatusText(columnLabels)} onReset={resetSort} />
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <SortableHeader columnKey="transportType" label="유형" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="carrier" label="운송사" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="vessel" label="선명/편명" sortConfig={sortConfig} onSort={handleSort} />
                  <th>Voyage</th>
                  <th>Call Sign</th>
                  <th>IMO</th>
                  <SortableHeader columnKey="origin" label="출발지" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="destination" label="도착지" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="etd" label="출발예정" sortConfig={sortConfig} onSort={handleSort} />
                  <th>출발실제</th>
                  <SortableHeader columnKey="eta" label="도착예정" sortConfig={sortConfig} onSort={handleSort} />
                  <th>도착실제</th>
                  <SortableHeader columnKey="transitDays" label="T/T" sortConfig={sortConfig} onSort={handleSort} />
                  <th>Cut-Off</th>
                  <SortableHeader columnKey="status" label="상태" sortConfig={sortConfig} onSort={handleSort} />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={15} className="text-center py-8 text-[var(--muted)]">
                      데이터를 불러오는 중...
                    </td>
                  </tr>
                ) : sortedList.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="text-center py-8 text-[var(--muted)]">
                      조회된 스케줄이 없습니다.
                    </td>
                  </tr>
                ) : (
                  sortedList.map(item => (
                    <tr key={`${item.transportType}-${item.id}`}>
                      <td className="text-center">
                        <span className={`px-2 py-1 text-xs rounded-full text-white ${
                          item.transportType === 'SEA' ? 'bg-blue-500' : 'bg-sky-500'
                        }`}>
                          {item.transportType === 'SEA' ? '해상' : '항공'}
                        </span>
                      </td>
                      <td className="text-center font-medium">{item.carrier || '-'}</td>
                      <td className="text-center">{item.vessel || '-'}</td>
                      <td className="text-center">{item.voyage || '-'}</td>
                      <td className="text-center">{item.callSign || '-'}</td>
                      <td className="text-center">{item.imo || '-'}</td>
                      <td className="text-center">
                        {item.origin}
                        {item.originTerminal && (
                          <><br /><span className="text-[var(--muted)] text-xs">{item.originTerminal}</span></>
                        )}
                      </td>
                      <td className="text-center">
                        {item.destination}
                        {item.destinationTerminal && (
                          <><br /><span className="text-[var(--muted)] text-xs">{item.destinationTerminal}</span></>
                        )}
                      </td>
                      <td className="text-center">{item.etd || '-'}</td>
                      <td className="text-center">{item.atd || '-'}</td>
                      <td className="text-center">{item.eta || '-'}</td>
                      <td className="text-center">{item.ata || '-'}</td>
                      <td className="text-center">{item.transitDays ? `${item.transitDays}일` : '-'}</td>
                      <td className="text-center text-xs">{item.cutOff || '-'}</td>
                      <td className="text-center">
                        <span className={`px-2 py-1 text-xs rounded-full text-white ${getStatusConfig(item.status).color}`}>
                          {getStatusConfig(item.status).label}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
