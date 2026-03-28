'use client';

import { useRouter } from 'next/navigation';
import { LIST_PATHS } from '@/constants/paths';

import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import DateRangeButtons, { calculateDateRange } from '@/components/DateRangeButtons';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import ExcelButtons from '@/components/ExcelButtons';
import { useSorting, SortableHeader, SortStatusBadge } from '@/components/table';

interface ScheduleData {
  id: number;
  carrierId: string;
  carrierName: string;
  vesselName: string;
  voyageNo: string;
  callSign: string | null;
  imo: string | null;
  pol: string;
  polTerminal: string;
  pod: string;
  podTerminal: string;
  etd: string;
  atd: string | null;
  eta: string;
  ata: string | null;
  transitDays: number;
  cutOff: string;
  docCutOff: string;
  cyClosing: string | null;
  cfsClosing: string | null;
  status: string;
  remark: string | null;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  SCHEDULED: { label: '예정', color: 'bg-blue-500', bgColor: '#DBEAFE' },
  OPEN: { label: '부킹가능', color: 'bg-green-500', bgColor: '#D1FAE5' },
  LIMITED: { label: '잔여공간', color: 'bg-yellow-500', bgColor: '#FEF3C7' },
  FULL: { label: '만석', color: 'bg-red-500', bgColor: '#FEE2E2' },
  CLOSED: { label: '마감', color: 'bg-gray-500', bgColor: '#F3F4F6' },
  DEPARTED: { label: '출항', color: 'bg-purple-500', bgColor: '#E9D5FF' },
  ARRIVED: { label: '도착', color: 'bg-teal-500', bgColor: '#CCFBF1' },
  CANCELLED: { label: '취소', color: 'bg-red-500', bgColor: '#FEE2E2' },
};

const getStatusConfig = (status: string) => statusConfig[status] || { label: status || '미정', color: 'bg-gray-500', bgColor: '#F3F4F6' };

const excelColumns: { key: keyof ScheduleData; label: string }[] = [
  { key: 'carrierName', label: '선사' },
  { key: 'vesselName', label: '선명' },
  { key: 'voyageNo', label: '항차' },
  { key: 'callSign', label: 'Call Sign' },
  { key: 'imo', label: 'IMO' },
  { key: 'pol', label: 'POL' },
  { key: 'polTerminal', label: 'POL터미널' },
  { key: 'pod', label: 'POD' },
  { key: 'podTerminal', label: 'POD터미널' },
  { key: 'etd', label: 'ETD' },
  { key: 'eta', label: 'ETA' },
  { key: 'transitDays', label: 'T/T(일)' },
  { key: 'cutOff', label: 'C/T Off' },
  { key: 'status', label: '상태' },
];

export default function SeaSchedulePage() {
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const { startDate: monthStart, endDate: monthEnd } = calculateDateRange('month');
  const [filters, setFilters] = useState({
    startDate: monthStart,
    endDate: monthEnd,
    carrier: '',
    pol: '',
    pod: '',
    status: '',
  });
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [data, setData] = useState<ScheduleData[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const { sortConfig, handleSort, sortData, getSortStatusText, resetSort } = useSorting<ScheduleData>();

  const columnLabels: Record<string, string> = {
    carrierName: '선사',
    vesselName: '선명',
    pol: 'POL',
    pod: 'POD',
    etd: 'ETD',
    eta: 'ETA',
    transitDays: 'T/T',
    cutOff: 'C/T Off',
    status: '상태',
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        carrier: appliedFilters.carrier,
        pol: appliedFilters.pol,
        pod: appliedFilters.pod,
        status: appliedFilters.status,
        startDate: appliedFilters.startDate,
        endDate: appliedFilters.endDate,
      });
      const response = await fetch(`/api/schedule/sea?${params}`);
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
      carrier: '',
      pol: '',
      pod: '',
      status: ''
    };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
  };

  const sortedList = useMemo(() => sortData(data), [data, sortData]);

  const summaryStats = useMemo(() => ({
    total: data.length,
    open: data.filter(d => d.status === 'OPEN' || d.status === 'SCHEDULED').length,
    limited: data.filter(d => d.status === 'LIMITED').length,
    full: data.filter(d => d.status === 'FULL').length,
    departed: data.filter(d => d.status === 'DEPARTED').length,
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

  const handleRowClick = (id: number) => {
    router.push(`/logis/schedule/sea/${id}`);
  };
  // 수정 버튼 핸들러
  const handleEdit = () => {
    if (selectedRows.length === 0) { alert('수정할 항목을 선택해주세요.'); return; }
    if (selectedRows.length > 1) { alert('수정할 항목을 1개만 선택해주세요.'); return; }
    const id = selectedRows[0];
    router.push(`/logis/schedule/sea/register?id=${id}`);
  };


  const handleDelete = async () => {
    if (selectedRows.length === 0) {
      alert('삭제할 항목을 선택해주세요.');
      return;
    }
    if (!confirm(`${selectedRows.length}건을 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/schedule/sea?ids=${selectedRows.join(',')}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('삭제 실패');
      setSelectedRows([]);
      fetchData();
      alert('삭제되었습니다.');
    } catch (err) {
      console.error(err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedRows(checked ? sortedList.map(d => d.id) : []);
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    setSelectedRows(prev => checked ? [...prev, id] : prev.filter(r => r !== id));
  };

  return (
    <PageLayout title="해상 스케줄 조회" subtitle="Logis > 스케줄관리 > 해상 스케줄 조회" showCloseButton={false}>
      <main ref={formRef} className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <button onClick={() => router.push('/logis/schedule/sea/register')} className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] text-sm">신규</button>
              <button onClick={handleEdit} className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] text-sm">
                수정
              </button>
              <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
              disabled={selectedRows.length === 0}
            >
              삭제
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/logis/schedule/sea/register')}
              className="px-4 py-2 bg-[#6e5fc9] text-white rounded-lg hover:bg-[#584bb0] font-medium"
            >
              신규등록
            </button>
            <ExcelButtons
              data={data}
              columns={excelColumns}
              filename="해상스케줄"
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
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ETD 기간</label>
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
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">선사</label>
                <input
                  type="text"
                  value={filters.carrier}
                  onChange={e => setFilters(prev => ({ ...prev, carrier: e.target.value }))}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                  placeholder="HMM, MAERSK..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">선적항 (POL)</label>
                <input
                  type="text"
                  value={filters.pol}
                  onChange={e => setFilters(prev => ({ ...prev, pol: e.target.value }))}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                  placeholder="KRPUS"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">양하항 (POD)</label>
                <input
                  type="text"
                  value={filters.pod}
                  onChange={e => setFilters(prev => ({ ...prev, pod: e.target.value }))}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                  placeholder="USLAX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">상태</label>
                <select
                  value={filters.status}
                  onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                >
                  <option value="">전체</option>
                  <option value="SCHEDULED">예정</option>
                  <option value="OPEN">부킹가능</option>
                  <option value="LIMITED">잔여공간</option>
                  <option value="FULL">만석</option>
                  <option value="DEPARTED">출항</option>
                  <option value="CLOSED">마감</option>
                </select>
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
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold">{summaryStats.total}</div>
            <div className="text-sm text-[var(--muted)]">전체</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-green-500">{summaryStats.open}</div>
            <div className="text-sm text-[var(--muted)]">예정/부킹가능</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-yellow-500">{summaryStats.limited}</div>
            <div className="text-sm text-[var(--muted)]">잔여공간</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-red-500">{summaryStats.full}</div>
            <div className="text-sm text-[var(--muted)]">만석</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-purple-500">{summaryStats.departed}</div>
            <div className="text-sm text-[var(--muted)]">출항</div>
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
                  <th className="w-12">
                    <input type="checkbox"
                      checked={selectedRows.length === sortedList.length && sortedList.length > 0}
                      onChange={e => handleSelectAll(e.target.checked)}
                      className="rounded" />
                  </th>
                  <th className="w-14">No</th>
                  <SortableHeader columnKey="carrierName" label="선사" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="vesselName" label="선명/항차" sortConfig={sortConfig} onSort={handleSort} />
                  <th>Call Sign</th>
                  <th>IMO</th>
                  <SortableHeader columnKey="pol" label="POL" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="pod" label="POD" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="etd" label="ETD" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="eta" label="ETA" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="transitDays" label="T/T" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="cutOff" label="C/T Off" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="status" label="상태" sortConfig={sortConfig} onSort={handleSort} />
                  <th>부킹</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={14} className="text-center py-8 text-[var(--muted)]">
                      데이터를 불러오는 중...
                    </td>
                  </tr>
                ) : sortedList.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="text-center py-8 text-[var(--muted)]">
                      조회된 스케줄이 없습니다.
                    </td>
                  </tr>
                ) : (
                  sortedList.map((item, index) => (
                    <tr
                      key={item.id}
                      onClick={() => handleRowClick(item.id)}
                      className="cursor-pointer hover:bg-[var(--surface-hover)]"
                    >
                      <td className="text-center" onClick={e => e.stopPropagation()}>
                        <input type="checkbox"
                          checked={selectedRows.includes(item.id)}
                          onChange={e => handleSelectRow(item.id, e.target.checked)}
                          className="rounded" />
                      </td>
                      <td className="text-center text-[var(--muted)]">{index + 1}</td>
                      <td className="text-center font-medium">{item.carrierName || '-'}</td>
                      <td className="text-center">
                        {item.vesselName || '-'}
                        <br />
                        <span className="text-[var(--muted)] text-xs">{item.voyageNo || ''}</span>
                      </td>
                      <td className="text-center">{item.callSign || '-'}</td>
                      <td className="text-center">{item.imo || '-'}</td>
                      <td className="text-center">
                        {item.pol || '-'}
                        <br />
                        <span className="text-[var(--muted)] text-xs">{item.polTerminal || ''}</span>
                      </td>
                      <td className="text-center">
                        {item.pod || '-'}
                        <br />
                        <span className="text-[var(--muted)] text-xs">{item.podTerminal || ''}</span>
                      </td>
                      <td className="text-center">{item.etd || '-'}</td>
                      <td className="text-center">{item.eta || '-'}</td>
                      <td className="text-center">{item.transitDays ? `${item.transitDays}일` : '-'}</td>
                      <td className="text-center text-xs">
                        {item.cutOff || '-'}
                        <br />
                        <span className="text-[var(--muted)]">Doc: {item.docCutOff || '-'}</span>
                      </td>
                      <td className="text-center">
                        <span className={`px-2 py-1 text-xs rounded-full text-white ${getStatusConfig(item.status).color}`}>
                          {getStatusConfig(item.status).label}
                        </span>
                      </td>
                      <td className="text-center" onClick={e => e.stopPropagation()}>
                        {item.status !== 'FULL' && item.status !== 'CLOSED' && item.status !== 'DEPARTED' && (
                          <button className="px-3 py-1.5 text-xs bg-[#6e5fc9] text-white rounded hover:bg-[#584bb0]">
                            부킹요청
                          </button>
                        )}
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
