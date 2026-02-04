'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import DateRangeButtons, { getToday } from '@/components/DateRangeButtons';
import { useSorting, SortableHeader, SortStatusBadge } from '@/components/table';

interface SNData {
  id: number;
  snNo: string;
  snDate: string;
  awbNo: string;
  shipper: string;
  consignee: string;
  airline: string;
  flightNo: string;
  origin: string;
  destination: string;
  etd: string;
  eta: string;
  pieces: number;
  grossWeight: number;
  status: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: '대기', color: 'bg-gray-500', bgColor: '#F3F4F6' },
  SENT: { label: '발송완료', color: 'bg-blue-500', bgColor: '#DBEAFE' },
  CONFIRMED: { label: '확인완료', color: 'bg-green-500', bgColor: '#D1FAE5' },
  DEPARTED: { label: '출발완료', color: 'bg-purple-500', bgColor: '#F3E8FF' },
};

const getStatusConfig = (status: string) => statusConfig[status] || { label: status || '미정', color: 'bg-gray-500', bgColor: '#F3F4F6' };

const mockData: SNData[] = [
  { id: 1, snNo: 'ASN-2026-0001', snDate: '2026-01-20', awbNo: '180-12345678', shipper: '삼성전자', consignee: '삼성아메리카', airline: 'KE', flightNo: 'KE001', origin: 'ICN', destination: 'LAX', etd: '2026-01-22', eta: '2026-01-22', pieces: 50, grossWeight: 1200, status: 'SENT' },
  { id: 2, snNo: 'ASN-2026-0002', snDate: '2026-01-19', awbNo: '988-87654321', shipper: 'LG전자', consignee: 'LG Electronics USA', airline: 'OZ', flightNo: 'OZ202', origin: 'ICN', destination: 'JFK', etd: '2026-01-21', eta: '2026-01-21', pieces: 30, grossWeight: 800, status: 'DEPARTED' },
  { id: 3, snNo: 'ASN-2026-0003', snDate: '2026-01-18', awbNo: '180-11112222', shipper: '현대자동차', consignee: 'Hyundai Motor America', airline: 'KE', flightNo: 'KE017', origin: 'ICN', destination: 'ORD', etd: '2026-01-25', eta: '2026-01-25', pieces: 100, grossWeight: 2500, status: 'PENDING' },
  { id: 4, snNo: 'ASN-2026-0004', snDate: '2026-01-17', awbNo: '988-33334444', shipper: 'SK하이닉스', consignee: 'SK Hynix America', airline: 'OZ', flightNo: 'OZ222', origin: 'ICN', destination: 'SFO', etd: '2026-01-20', eta: '2026-01-20', pieces: 20, grossWeight: 500, status: 'CONFIRMED' },
];

export default function AirSNListPage() {
  const today = getToday();
  const [filters, setFilters] = useState({
    startDate: today,
    endDate: today,
    snNo: '',
    awbNo: '',
    shipper: '',
    airline: '',
    status: '',
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [data] = useState<SNData[]>(mockData);

  const { sortConfig, handleSort, sortData, getSortStatusText, resetSort } = useSorting<SNData>();

  const columnLabels: Record<string, string> = {
    snNo: 'S/N 번호',
    snDate: 'S/N 일자',
    awbNo: 'AWB 번호',
    shipper: '화주',
    airline: '항공사',
    origin: '출발지',
    etd: 'ETD',
    pieces: 'PCS',
    status: '상태',
  };

  const handleDateRangeSelect = (startDate: string, endDate: string) => {
    setFilters(prev => ({ ...prev, startDate, endDate }));
  };

  const handleSearch = () => setAppliedFilters(filters);
  const handleReset = () => {
    const resetFilters = { startDate: today, endDate: today, snNo: '', awbNo: '', shipper: '', airline: '', status: '' };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
  };

  const filteredData = useMemo(() => data.filter(item => {
    if (appliedFilters.snNo && !item.snNo.toLowerCase().includes(appliedFilters.snNo.toLowerCase())) return false;
    if (appliedFilters.awbNo && !item.awbNo.toLowerCase().includes(appliedFilters.awbNo.toLowerCase())) return false;
    if (appliedFilters.shipper && !item.shipper.toLowerCase().includes(appliedFilters.shipper.toLowerCase())) return false;
    if (appliedFilters.airline && item.airline !== appliedFilters.airline) return false;
    if (appliedFilters.status && item.status !== appliedFilters.status) return false;
    return true;
  }), [data, appliedFilters]);

  const sortedList = useMemo(() => sortData(filteredData), [filteredData, sortData]);

  const summaryStats = useMemo(() => ({
    total: filteredData.length,
    pending: filteredData.filter(d => d.status === 'PENDING').length,
    sent: filteredData.filter(d => d.status === 'SENT').length,
    confirmed: filteredData.filter(d => d.status === 'CONFIRMED').length,
    departed: filteredData.filter(d => d.status === 'DEPARTED').length,
  }), [filteredData]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="ml-56">
        <Header title="선적통지 목록 (S/N)" subtitle="Logis > 선적관리 > 선적통지 목록 (항공)" />
        <main className="p-6">
          <div className="flex justify-between items-center mb-6">
            <Link href="/logis/sn/air/register" className="px-6 py-2 font-semibold rounded-lg" style={{ background: 'linear-gradient(135deg, #E8A838 0%, #D4943A 100%)', color: '#0C1222' }}>
              신규 등록
            </Link>
          </div>

          <div className="card p-6 mb-6">
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">S/N 일자</label>
                <div className="flex gap-2 items-center flex-nowrap">
                  <input type="date" value={filters.startDate} onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))} className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
                  <span className="text-[var(--muted)]">~</span>
                  <input type="date" value={filters.endDate} onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))} className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
                  <DateRangeButtons onRangeSelect={handleDateRangeSelect} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">S/N 번호</label>
                <input type="text" value={filters.snNo} onChange={e => setFilters(prev => ({ ...prev, snNo: e.target.value }))} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="ASN-YYYY-XXXX" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">AWB 번호</label>
                <input type="text" value={filters.awbNo} onChange={e => setFilters(prev => ({ ...prev, awbNo: e.target.value }))} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="000-00000000" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">화주</label>
                <input type="text" value={filters.shipper} onChange={e => setFilters(prev => ({ ...prev, shipper: e.target.value }))} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="화주명" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">항공사</label>
                <select value={filters.airline} onChange={e => setFilters(prev => ({ ...prev, airline: e.target.value }))} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg">
                  <option value="">전체</option>
                  <option value="KE">대한항공</option>
                  <option value="OZ">아시아나항공</option>
                  <option value="UA">유나이티드항공</option>
                  <option value="AA">아메리칸항공</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">상태</label>
                <select value={filters.status} onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg">
                  <option value="">전체</option>
                  <option value="PENDING">대기</option>
                  <option value="SENT">발송완료</option>
                  <option value="CONFIRMED">확인완료</option>
                  <option value="DEPARTED">출발완료</option>
                </select>
              </div>
              <div className="flex items-end gap-2 col-span-2">
                <button onClick={handleSearch} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">검색</button>
                <button onClick={handleReset} className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">초기화</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="card p-4 text-center"><div className="text-2xl font-bold">{summaryStats.total}</div><div className="text-sm text-[var(--muted)]">전체</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-gray-500">{summaryStats.pending}</div><div className="text-sm text-[var(--muted)]">대기</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-blue-500">{summaryStats.sent}</div><div className="text-sm text-[var(--muted)]">발송완료</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-green-500">{summaryStats.confirmed}</div><div className="text-sm text-[var(--muted)]">확인완료</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-purple-500">{summaryStats.departed}</div><div className="text-sm text-[var(--muted)]">출발완료</div></div>
          </div>

          <div className="card overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] flex items-center gap-3">
              <h3 className="font-bold">S/N 목록</h3>
              <span className="px-2 py-1 bg-[#E8A838]/20 text-[#E8A838] rounded text-sm font-medium">{filteredData.length}건</span>
              <SortStatusBadge statusText={getSortStatusText(columnLabels)} onReset={resetSort} />
            </div>
            <table className="w-full">
              <thead className="bg-[var(--surface-100)]">
                <tr>
                  <SortableHeader columnKey="snNo" label="S/N 번호" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="snDate" label="S/N 일자" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="awbNo" label="AWB 번호" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="shipper" label="화주" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="airline" label="항공사/편명" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="origin" label="출발지/도착지" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="etd" label="ETD/ETA" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="pieces" label="PCS/중량" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHeader columnKey="status" label="상태" sortConfig={sortConfig} onSort={handleSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {sortedList.map(item => (
                  <tr key={item.id} className="hover:bg-[var(--surface-50)] cursor-pointer">
                    <td className="px-4 py-3"><Link href={`/logis/sn/air/${item.id}`} className="text-blue-400 hover:underline">{item.snNo}</Link></td>
                    <td className="px-4 py-3 text-sm">{item.snDate}</td>
                    <td className="px-4 py-3 text-sm">{item.awbNo}</td>
                    <td className="px-4 py-3 text-sm">{item.shipper}</td>
                    <td className="px-4 py-3 text-sm">{item.airline} / {item.flightNo}</td>
                    <td className="px-4 py-3 text-sm">{item.origin} → {item.destination}</td>
                    <td className="px-4 py-3 text-sm">{item.etd} / {item.eta}</td>
                    <td className="px-4 py-3 text-sm">{item.pieces} / {item.grossWeight}kg</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full text-white ${getStatusConfig(item.status).color}`}>{getStatusConfig(item.status).label}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
