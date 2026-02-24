'use client';

import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import DateRangeButtons, { getToday } from '@/components/DateRangeButtons';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { useSorting, SortableHeader, SortStatusBadge } from '@/components/table';
import { LIST_PATHS } from '@/constants/paths';

interface ANAirData {
  AN_ID: number;
  AN_NO: string;
  AN_DATE: string;
  MAWB_NO: string;
  HAWB_NO: string;
  SHIPPER: string;
  CONSIGNEE: string;
  AIRLINE_NM: string;
  FLIGHT_NO: string;
  ORIGIN: string;
  DESTINATION: string;
  ETA: string;
  ATA: string;
  CARGO_STATUS: string;
  CUSTOMS_STATUS: string;
  PIECES: number;
  GROSS_WEIGHT: number;
  AN_SENT_YN: string;
  RO_NO: string;
  STATUS: string;
}

const cargoStatusConfig: Record<string, { label: string; color: string }> = {
  IN_TRANSIT: { label: '비행중', color: 'bg-blue-500' },
  ARRIVED: { label: '도착', color: 'bg-purple-500' },
  UNLOADED: { label: '하기완료', color: 'bg-cyan-500' },
  IN_BONDED: { label: '보세창고', color: 'bg-yellow-500' },
  RELEASED: { label: '반출', color: 'bg-green-500' },
  DELIVERED: { label: '배송완료', color: 'bg-gray-500' },
};

const customsStatusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: '대기', color: 'bg-gray-500' },
  DECLARED: { label: '신고', color: 'bg-blue-500' },
  INSPECTING: { label: '검사', color: 'bg-yellow-500' },
  CLEARED: { label: '통관완료', color: 'bg-green-500' },
};

const getConfig = (config: Record<string, { label: string; color: string }>, status: string) =>
  config[status] || { label: status || '-', color: 'bg-gray-500' };

export default function ANAirListPage() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const [showCloseModal, setShowCloseModal] = useState(false);

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

  const today = getToday();
  const [filters, setFilters] = useState({
    startDate: today,
    endDate: today,
    anNo: '',
    awbNo: '',
    consignee: '',
    cargoStatus: '',
    customsStatus: '',
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [data, setData] = useState<ANAirData[]>([]);
  const [loading, setLoading] = useState(false);

  const { sortConfig, handleSort, sortData, getSortStatusText, resetSort } = useSorting<ANAirData>();

  const columnLabels: Record<string, string> = {
    AN_NO: 'A/N 번호',
    AN_DATE: 'A/N 일자',
    MAWB_NO: 'AWB 번호',
    CONSIGNEE: '수하인',
    FLIGHT_NO: '편명',
    ETA: 'ETA',
    CARGO_STATUS: '화물상태',
    CUSTOMS_STATUS: '통관상태',
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (appliedFilters.startDate) params.append('startDate', appliedFilters.startDate);
      if (appliedFilters.endDate) params.append('endDate', appliedFilters.endDate);
      if (appliedFilters.anNo) params.append('anNo', appliedFilters.anNo);
      if (appliedFilters.awbNo) params.append('awbNo', appliedFilters.awbNo);
      if (appliedFilters.consignee) params.append('consignee', appliedFilters.consignee);
      if (appliedFilters.cargoStatus) params.append('cargoStatus', appliedFilters.cargoStatus);
      if (appliedFilters.customsStatus) params.append('customsStatus', appliedFilters.customsStatus);

      const response = await fetch(`/api/an/air?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
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
    const resetFilters = { startDate: today, endDate: today, anNo: '', awbNo: '', consignee: '', cargoStatus: '', customsStatus: '' };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
    resetSort();
  };

  const sortedList = useMemo(() => sortData(data), [data, sortData]);

  const summaryStats = useMemo(() => ({
    total: data.length,
    inTransit: data.filter(d => d.CARGO_STATUS === 'IN_TRANSIT').length,
    arrived: data.filter(d => ['ARRIVED', 'UNLOADED', 'IN_BONDED'].includes(d.CARGO_STATUS)).length,
    pendingAN: data.filter(d => d.AN_SENT_YN !== 'Y').length,
    pendingRO: data.filter(d => !d.RO_NO && d.CUSTOMS_STATUS === 'CLEARED').length,
  }), [data]);

  const handleSendAN = async (id: number) => {
    if (!confirm('A/N을 발송하시겠습니까?')) return;
    try {
      const response = await fetch('/api/an/air', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          anSentYn: 'Y',
          anSentDate: new Date().toISOString(),
          status: 'SENT'
        })
      });
      if (response.ok) {
        alert('A/N이 발송되었습니다.');
        fetchData();
      }
    } catch (error) {
      console.error('Failed to send A/N:', error);
      alert('A/N 발송에 실패했습니다.');
    }
  };

  const handleIssueRO = async (id: number) => {
    if (!confirm('R/O를 발급하시겠습니까?')) return;
    const roNo = `RO-${Date.now()}`;
    try {
      const response = await fetch('/api/an/air', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          roNo,
          roIssueDate: new Date().toISOString().split('T')[0],
          status: 'CONFIRMED'
        })
      });
      if (response.ok) {
        alert('R/O가 발급되었습니다.');
        fetchData();
      }
    } catch (error) {
      console.error('Failed to issue R/O:', error);
      alert('R/O 발급에 실패했습니다.');
    }
  };

  return (
    <PageLayout title="도착통지 목록 (A/N) - 항공" subtitle="Logis > 항공수입 > 도착통지 목록" onClose={handleCloseClick}>
      <main ref={formRef} className="p-6">
        <div className="flex justify-end items-center mb-6">
          <Link href="/logis/an/air/register" className="px-6 py-2 font-semibold rounded-lg bg-[var(--surface-100)] text-[var(--foreground)] hover:bg-[var(--surface-200)]">
            신규 등록
          </Link>
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
                <label className="block text-sm font-medium mb-1">A/N 일자</label>
                <div className="flex gap-2 items-center">
                  <input type="date" value={filters.startDate} onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))} className="w-[130px] h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" />
                  <span className="text-[var(--muted)]">~</span>
                  <input type="date" value={filters.endDate} onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))} className="w-[130px] h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" />
                  <DateRangeButtons onRangeSelect={handleDateRangeSelect} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">A/N 번호</label>
                <input type="text" value={filters.anNo} onChange={e => setFilters(prev => ({ ...prev, anNo: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="AN-AIR-2026-0001" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">AWB 번호</label>
                <input type="text" value={filters.awbNo} onChange={e => setFilters(prev => ({ ...prev, awbNo: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="180-12345678" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">수하인</label>
                <input type="text" value={filters.consignee} onChange={e => setFilters(prev => ({ ...prev, consignee: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="수하인명" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">화물상태</label>
                <select value={filters.cargoStatus} onChange={e => setFilters(prev => ({ ...prev, cargoStatus: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm">
                  <option value="">전체</option>
                  {Object.entries(cargoStatusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">통관상태</label>
                <select value={filters.customsStatus} onChange={e => setFilters(prev => ({ ...prev, customsStatus: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm">
                  <option value="">전체</option>
                  {Object.entries(customsStatusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-[var(--border)] flex justify-center gap-2">
            <button onClick={handleSearch} className="px-6 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] font-medium">조회</button>
            <button onClick={handleReset} className="px-6 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">초기화</button>
          </div>
        </div>

        {/* 요약 통계 */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="card p-4 text-center"><div className="text-2xl font-bold">{summaryStats.total}</div><div className="text-sm text-[var(--muted)]">전체</div></div>
          <div className="card p-4 text-center"><div className="text-2xl font-bold text-blue-500">{summaryStats.inTransit}</div><div className="text-sm text-[var(--muted)]">비행중</div></div>
          <div className="card p-4 text-center"><div className="text-2xl font-bold text-green-500">{summaryStats.arrived}</div><div className="text-sm text-[var(--muted)]">도착</div></div>
          <div className="card p-4 text-center"><div className="text-2xl font-bold text-yellow-500">{summaryStats.pendingAN}</div><div className="text-sm text-[var(--muted)]">A/N 미발송</div></div>
          <div className="card p-4 text-center"><div className="text-2xl font-bold text-purple-500">{summaryStats.pendingRO}</div><div className="text-sm text-[var(--muted)]">R/O 미발급</div></div>
        </div>

        {/* 정렬 상태 */}
        {sortConfig.key && <SortStatusBadge statusText={getSortStatusText(columnLabels)} onReset={resetSort} />}

        {/* 목록 테이블 */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-[var(--muted)]">데이터를 불러오는 중...</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <SortableHeader columnKey="AN_NO" label="A/N 번호" sortConfig={sortConfig} onSort={handleSort} className="text-center" />
                  <SortableHeader columnKey="AN_DATE" label="A/N 일자" sortConfig={sortConfig} onSort={handleSort} className="text-center" />
                  <SortableHeader columnKey="MAWB_NO" label="AWB 번호" sortConfig={sortConfig} onSort={handleSort} className="text-center" />
                  <SortableHeader columnKey="FLIGHT_NO" label="편명" sortConfig={sortConfig} onSort={handleSort} className="text-center" />
                  <SortableHeader columnKey="ETA" label="ETA" sortConfig={sortConfig} onSort={handleSort} className="text-center" />
                  <th className="text-center">ATA</th>
                  <th className="text-center">구간</th>
                  <SortableHeader columnKey="CONSIGNEE" label="수하인" sortConfig={sortConfig} onSort={handleSort} className="text-center" />
                  <th className="text-center">PCS</th>
                  <th className="text-center">G/W</th>
                  <th className="text-center">화물상태</th>
                  <th className="text-center">통관상태</th>
                  <th className="text-center">A/N</th>
                  <th className="text-center">R/O</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {sortedList.length === 0 ? (
                  <tr><td colSpan={14} className="px-4 py-8 text-center text-[var(--muted)]">데이터가 없습니다.</td></tr>
                ) : sortedList.map(item => (
                  <tr key={item.AN_ID} className="hover:bg-[var(--surface-50)] cursor-pointer" onClick={() => router.push(`/logis/an/air/${item.AN_ID}`)}>
                    <td className="px-4 py-3 text-center">
                      <Link href={`/logis/an/air/${item.AN_ID}`} className="text-blue-400 hover:underline" onClick={(e) => e.stopPropagation()}>{item.AN_NO}</Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">{item.AN_DATE?.split('T')[0]}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.MAWB_NO || '-'}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.FLIGHT_NO}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.ETA?.split('T')[0] || '-'}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.ATA?.split('T')[0] || '-'}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.ORIGIN} → {item.DESTINATION}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.CONSIGNEE}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.PIECES}</td>
                    <td className="px-4 py-3 text-sm text-center">{Number(item.GROSS_WEIGHT).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full text-white ${getConfig(cargoStatusConfig, item.CARGO_STATUS).color}`}>
                        {getConfig(cargoStatusConfig, item.CARGO_STATUS).label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full text-white ${getConfig(customsStatusConfig, item.CUSTOMS_STATUS).color}`}>
                        {getConfig(customsStatusConfig, item.CUSTOMS_STATUS).label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      {item.AN_SENT_YN === 'Y' ? (
                        <span className="text-green-500">✓</span>
                      ) : (
                        <button onClick={() => handleSendAN(item.AN_ID)} className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">발송</button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      {item.RO_NO ? (
                        <span className="text-green-500">✓</span>
                      ) : item.CUSTOMS_STATUS === 'CLEARED' ? (
                        <button onClick={() => handleIssueRO(item.AN_ID)} className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">발급</button>
                      ) : (
                        <span className="text-[var(--muted)]">-</span>
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
