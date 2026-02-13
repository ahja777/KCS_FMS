'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { LIST_PATHS } from '@/constants/paths';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import DateRangeButtons, { getToday } from '@/components/DateRangeButtons';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';

interface InlandTransport {
  id: string;
  transportNo: string;
  blNo: string;
  transportType: 'TRUCK' | 'RAIL' | 'BARGE';
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  driverName: string;
  vehicleNo: string;
  containerNo: string;
  status: 'waiting' | 'departed' | 'arrived' | 'completed';
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  waiting: { label: '대기', color: '#6B7280', bgColor: '#F3F4F6' },
  departed: { label: '출발', color: '#2563EB', bgColor: '#DBEAFE' },
  arrived: { label: '도착', color: '#7C3AED', bgColor: '#EDE9FE' },
  completed: { label: '완료', color: '#059669', bgColor: '#D1FAE5' },
};

const transportTypeConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  TRUCK: { label: '트럭', color: '#2563EB', bgColor: '#DBEAFE' },
  RAIL: { label: '철도', color: '#7C3AED', bgColor: '#EDE9FE' },
  BARGE: { label: '바지선', color: '#EA580C', bgColor: '#FED7AA' },
};

const sampleData: InlandTransport[] = [
  { id: '1', transportNo: 'IL-2026-0001', blNo: 'HBL2026010001', transportType: 'TRUCK', origin: '부산항 신항', destination: '수원 물류센터', departureTime: '2026-01-16 08:00', arrivalTime: '2026-01-16 14:30', driverName: '김운전', vehicleNo: '12가 3456', containerNo: 'MSKU1234567', status: 'completed' },
  { id: '2', transportNo: 'IL-2026-0002', blNo: 'HBL2026010002', transportType: 'TRUCK', origin: '인천공항', destination: '평택 물류센터', departureTime: '2026-01-16 09:30', arrivalTime: '', driverName: '이배송', vehicleNo: '34나 5678', containerNo: 'MSCU2345678', status: 'departed' },
  { id: '3', transportNo: 'IL-2026-0003', blNo: 'HBL2026010003', transportType: 'RAIL', origin: '부산 신항역', destination: '의왕 ICD', departureTime: '2026-01-17 06:00', arrivalTime: '2026-01-17 12:00', driverName: '-', vehicleNo: 'KR-RAIL-0103', containerNo: 'HLCU3456789', status: 'arrived' },
  { id: '4', transportNo: 'IL-2026-0004', blNo: 'HBL2026010004', transportType: 'TRUCK', origin: '의왕 ICD', destination: '이천 물류센터', departureTime: '', arrivalTime: '', driverName: '박물류', vehicleNo: '56다 7890', containerNo: 'EITU4567890', status: 'waiting' },
  { id: '5', transportNo: 'IL-2026-0005', blNo: 'HBL2026010005', transportType: 'BARGE', origin: '부산 신항', destination: '인천 내항', departureTime: '2026-01-18 10:00', arrivalTime: '', driverName: '-', vehicleNo: 'BG-2026-01', containerNo: 'TCLU5678901', status: 'departed' },
];

const today = getToday();

export default function TransportInlandPage() {
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
    transportNo: '',
    transportType: '',
    blNo: '',
    status: '',
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => setAppliedFilters({ ...filters });
  const handleReset = () => {
    const resetFilters = { startDate: today, endDate: today, transportNo: '', transportType: '', blNo: '', status: '' };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
  };

  const filteredData = useMemo(() => {
    return sampleData.filter(item => {
      if (appliedFilters.transportNo && !item.transportNo.toLowerCase().includes(appliedFilters.transportNo.toLowerCase())) return false;
      if (appliedFilters.transportType && item.transportType !== appliedFilters.transportType) return false;
      if (appliedFilters.blNo && !item.blNo.toLowerCase().includes(appliedFilters.blNo.toLowerCase())) return false;
      if (appliedFilters.status && item.status !== appliedFilters.status) return false;
      return true;
    });
  }, [appliedFilters]);

  const summary = useMemo(() => ({
    total: filteredData.length,
    waiting: filteredData.filter(t => t.status === 'waiting').length,
    departed: filteredData.filter(t => t.status === 'departed').length,
    arrived: filteredData.filter(t => t.status === 'arrived').length,
    completed: filteredData.filter(t => t.status === 'completed').length,
  }), [filteredData]);

  return (
    <PageLayout title="내륙운송 관리" subtitle="Logis > 내륙운송 관리" showCloseButton={false}>
      <main className="p-6">
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
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">운송일자</label>
                <div className="flex items-center gap-2">
                  <input type="date" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
                  <span className="text-[var(--muted)]">~</span>
                  <input type="date" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
                  <DateRangeButtons onRangeSelect={(start, end) => { handleFilterChange('startDate', start); handleFilterChange('endDate', end); }} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">운송번호</label>
                <input type="text" value={filters.transportNo} onChange={(e) => handleFilterChange('transportNo', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" placeholder="IL-YYYY-XXXX" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">운송구분</label>
                <select value={filters.transportType} onChange={(e) => handleFilterChange('transportType', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm">
                  <option value="">전체</option>
                  <option value="TRUCK">트럭</option>
                  <option value="RAIL">철도</option>
                  <option value="BARGE">바지선</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">B/L 번호</label>
                <input type="text" value={filters.blNo} onChange={(e) => handleFilterChange('blNo', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" placeholder="B/L No" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">상태</label>
                <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm">
                  <option value="">전체</option>
                  <option value="waiting">대기</option>
                  <option value="departed">출발</option>
                  <option value="arrived">도착</option>
                  <option value="completed">완료</option>
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
          <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { handleFilterChange('status', 'waiting'); setAppliedFilters(prev => ({ ...prev, status: 'waiting' })); }}>
            <p className="text-2xl font-bold text-[#6B7280]">{summary.waiting}</p>
            <p className="text-sm text-[var(--muted)]">대기</p>
          </div>
          <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { handleFilterChange('status', 'departed'); setAppliedFilters(prev => ({ ...prev, status: 'departed' })); }}>
            <p className="text-2xl font-bold text-[#2563EB]">{summary.departed}</p>
            <p className="text-sm text-[var(--muted)]">출발</p>
          </div>
          <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { handleFilterChange('status', 'arrived'); setAppliedFilters(prev => ({ ...prev, status: 'arrived' })); }}>
            <p className="text-2xl font-bold text-[#7C3AED]">{summary.arrived}</p>
            <p className="text-sm text-[var(--muted)]">도착</p>
          </div>
          <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { handleFilterChange('status', 'completed'); setAppliedFilters(prev => ({ ...prev, status: 'completed' })); }}>
            <p className="text-2xl font-bold text-[#059669]">{summary.completed}</p>
            <p className="text-sm text-[var(--muted)]">완료</p>
          </div>
        </div>

        <div className="card">
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="font-bold">내륙운송 목록 ({filteredData.length}건)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>운송번호</th>
                  <th>B/L 번호</th>
                  <th className="text-center">운송구분</th>
                  <th>출발지</th>
                  <th>도착지</th>
                  <th className="text-center">출발시각</th>
                  <th className="text-center">도착시각</th>
                  <th>기사명</th>
                  <th>차량번호</th>
                  <th className="text-center">상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr><td colSpan={10} className="p-8 text-center text-[var(--muted)]">조회된 데이터가 없습니다.</td></tr>
                ) : (
                  filteredData.map(row => (
                    <tr key={row.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer">
                      <td className="p-3 text-[#2563EB] font-medium">{row.transportNo}</td>
                      <td className="p-3 text-sm">{row.blNo}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-1 rounded text-xs font-medium" style={{ color: transportTypeConfig[row.transportType]?.color, backgroundColor: transportTypeConfig[row.transportType]?.bgColor }}>{transportTypeConfig[row.transportType]?.label}</span>
                      </td>
                      <td className="p-3 text-sm">{row.origin}</td>
                      <td className="p-3 text-sm">{row.destination}</td>
                      <td className="p-3 text-sm text-center">{row.departureTime || '-'}</td>
                      <td className="p-3 text-sm text-center">{row.arrivalTime || '-'}</td>
                      <td className="p-3 text-sm">{row.driverName}</td>
                      <td className="p-3 text-sm">{row.vehicleNo}</td>
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
