'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { LIST_PATHS } from '@/constants/paths';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { getToday } from '@/components/DateRangeButtons';

interface TransportManage {
  id: string;
  transportNo: string;
  requestNo: string;
  driverName: string;
  driverPhone: string;
  vehicleNo: string;
  vehicleType: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  status: 'waiting' | 'departed' | 'arrived' | 'completed';
  gpsLat: number;
  gpsLng: number;
}

interface SearchFilters {
  startDate: string;
  endDate: string;
  transportNo: string;
  driverName: string;
  vehicleNo: string;
  status: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  waiting: { label: '대기', color: '#6B7280', bgColor: '#F3F4F6' },
  departed: { label: '출발', color: '#2563EB', bgColor: '#DBEAFE' },
  arrived: { label: '도착', color: '#7C3AED', bgColor: '#EDE9FE' },
  completed: { label: '완료', color: '#059669', bgColor: '#D1FAE5' },
};

const sampleData: TransportManage[] = [
  { id: '1', transportNo: 'TM-2026-0001', requestNo: 'TR-2026-0001', driverName: '김운전', driverPhone: '010-1234-5678', vehicleNo: '12가 3456', vehicleType: '5톤 윙바디', origin: '부산항 신항', destination: '수원 물류센터', departureTime: '2026-01-16 08:00', arrivalTime: '2026-01-16 14:30', status: 'completed', gpsLat: 37.2636, gpsLng: 127.0286 },
  { id: '2', transportNo: 'TM-2026-0002', requestNo: 'TR-2026-0002', driverName: '이배송', driverPhone: '010-2345-6789', vehicleNo: '34나 5678', vehicleType: '11톤 카고', origin: '인천공항', destination: '평택 물류센터', departureTime: '2026-01-16 09:30', arrivalTime: '', status: 'departed', gpsLat: 37.0324, gpsLng: 127.0716 },
  { id: '3', transportNo: 'TM-2026-0003', requestNo: 'TR-2026-0003', driverName: '박물류', driverPhone: '010-3456-7890', vehicleNo: '56다 7890', vehicleType: '25톤 트레일러', origin: '울산 공장', destination: '부산 신항', departureTime: '', arrivalTime: '', status: 'waiting', gpsLat: 35.5384, gpsLng: 129.3114 },
  { id: '4', transportNo: 'TM-2026-0004', requestNo: 'TR-2026-0004', driverName: '최배달', driverPhone: '010-4567-8901', vehicleNo: '78라 1234', vehicleType: '5톤 탑차', origin: '인천공항', destination: '이천 물류센터', departureTime: '2026-01-16 10:00', arrivalTime: '2026-01-16 12:30', status: 'arrived', gpsLat: 37.2795, gpsLng: 127.4428 },
];

const today = getToday();
const initialFilters: SearchFilters = {
  startDate: today,
  endDate: today,
  transportNo: '',
  driverName: '',
  vehicleNo: '',
  status: '',
};

export default function TransportManagePage() {
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);

  // 화면닫기 핸들러
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

  const [allData] = useState<TransportManage[]>(sampleData);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(initialFilters);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchMessage, setSearchMessage] = useState<string>('');

  const filteredList = useMemo(() => {
    return allData.filter(item => {
      if (appliedFilters.transportNo && !item.transportNo.toLowerCase().includes(appliedFilters.transportNo.toLowerCase())) return false;
      if (appliedFilters.driverName && !item.driverName.toLowerCase().includes(appliedFilters.driverName.toLowerCase())) return false;
      if (appliedFilters.vehicleNo && !item.vehicleNo.toLowerCase().includes(appliedFilters.vehicleNo.toLowerCase())) return false;
      if (appliedFilters.status && item.status !== appliedFilters.status) return false;
      return true;
    });
  }, [allData, appliedFilters]);

  const summary = useMemo(() => ({
    total: filteredList.length,
    waiting: filteredList.filter(t => t.status === 'waiting').length,
    departed: filteredList.filter(t => t.status === 'departed').length,
    arrived: filteredList.filter(t => t.status === 'arrived').length,
    completed: filteredList.filter(t => t.status === 'completed').length,
  }), [filteredList]);

  const handleSearch = () => {
    setAppliedFilters({ ...filters });
    setSelectedIds(new Set());
    setSearchMessage(`검색 완료: ${filteredList.length}건이 조회되었습니다.`);
    setTimeout(() => setSearchMessage(''), 3000);
  };

  const handleReset = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setSelectedIds(new Set());
    setSearchMessage('검색 조건이 초기화되었습니다.');
    setTimeout(() => setSearchMessage(''), 3000);
  };

  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleRowSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredList.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredList.map(item => item.id)));
  };

  return (
        <PageLayout title="운송관리 조회" subtitle="운송의뢰관리  운송관리 조회" showCloseButton={false} >
        <main className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-2">
              <button onClick={() => { if (selectedIds.size === 0) { alert('삭제할 항목을 선택해주세요.'); return; } if (!confirm(`${selectedIds.size}건을 삭제하시겠습니까?`)) return; setSelectedIds(new Set()); alert('삭제되었습니다.'); }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50" disabled={selectedIds.size === 0}>삭제</button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => alert(`Excel 다운로드: ${selectedIds.size > 0 ? selectedIds.size : filteredList.length}건`)} className="px-4 py-2 bg-[var(--surface-100)] rounded-lg hover:bg-[var(--surface-200)]">Excel</button>
            </div>
          </div>

          {searchMessage && (
            <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded-lg">{searchMessage}</div>
          )}

          {/* 검색조건 - 화면설계서 기준 */}
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
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">운송일자 <span className="text-red-500">*</span></label>
                  <div className="flex items-center gap-2">
                    <input type="date" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
                    <span className="text-[var(--muted)]">~</span>
                    <input type="date" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">운송번호</label>
                  <input type="text" value={filters.transportNo} onChange={(e) => handleFilterChange('transportNo', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" placeholder="TM-YYYY-XXXX" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">기사명</label>
                  <input type="text" value={filters.driverName} onChange={(e) => handleFilterChange('driverName', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" placeholder="기사명" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">차량번호</label>
                  <input type="text" value={filters.vehicleNo} onChange={(e) => handleFilterChange('vehicleNo', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" placeholder="00가 0000" />
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

          {/* 현황 카드 */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: '' })); setAppliedFilters(prev => ({ ...prev, status: '' })); }}>
              <p className="text-2xl font-bold">{summary.total}</p>
              <p className="text-sm text-[var(--muted)]">전체</p>
            </div>
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'waiting' })); setAppliedFilters(prev => ({ ...prev, status: 'waiting' })); }}>
              <p className="text-2xl font-bold text-[#6B7280]">{summary.waiting}</p>
              <p className="text-sm text-[var(--muted)]">대기</p>
            </div>
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'departed' })); setAppliedFilters(prev => ({ ...prev, status: 'departed' })); }}>
              <p className="text-2xl font-bold text-[#2563EB]">{summary.departed}</p>
              <p className="text-sm text-[var(--muted)]">출발</p>
            </div>
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'arrived' })); setAppliedFilters(prev => ({ ...prev, status: 'arrived' })); }}>
              <p className="text-2xl font-bold text-[#7C3AED]">{summary.arrived}</p>
              <p className="text-sm text-[var(--muted)]">도착</p>
            </div>
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'completed' })); setAppliedFilters(prev => ({ ...prev, status: 'completed' })); }}>
              <p className="text-2xl font-bold text-[#059669]">{summary.completed}</p>
              <p className="text-sm text-[var(--muted)]">완료</p>
            </div>
          </div>

          <div className="card">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
              <h3 className="font-bold">운송관리 목록 ({filteredList.length}건)</h3>
              {selectedIds.size > 0 && <span className="text-sm text-blue-600">{selectedIds.size}건 선택됨</span>}
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-10 text-center"><input type="checkbox" checked={filteredList.length > 0 && selectedIds.size === filteredList.length} onChange={handleSelectAll} /></th>
                    <th className="w-14">No</th>
                    <th>운송번호</th>
                    <th>요청번호</th>
                    <th>기사명</th>
                    <th>연락처</th>
                    <th>차량번호</th>
                    <th>차량종류</th>
                    <th>출발지</th>
                    <th>도착지</th>
                    <th className="text-center">출발시간</th>
                    <th className="text-center">도착시간</th>
                    <th className="text-center">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.length === 0 ? (
                    <tr><td colSpan={13} className="p-8 text-center text-[var(--muted)]">조회된 데이터가 없습니다.</td></tr>
                  ) : (
                    filteredList.map((row, index) => (
                      <tr key={row.id} className={`border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer ${selectedIds.has(row.id) ? 'bg-blue-50' : ''}`} onClick={() => handleRowSelect(row.id)}>
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => handleRowSelect(row.id)} /></td>
                        <td className="text-center text-[var(--muted)]">{index + 1}</td>
                        <td className="p-3 text-[#2563EB] font-medium">{row.transportNo}</td>
                        <td className="p-3 text-sm">{row.requestNo}</td>
                        <td className="p-3 text-sm">{row.driverName}</td>
                        <td className="p-3 text-sm">{row.driverPhone}</td>
                        <td className="p-3 text-sm">{row.vehicleNo}</td>
                        <td className="p-3 text-sm">{row.vehicleType}</td>
                        <td className="p-3 text-sm">{row.origin}</td>
                        <td className="p-3 text-sm">{row.destination}</td>
                        <td className="p-3 text-sm text-center">{row.departureTime || '-'}</td>
                        <td className="p-3 text-sm text-center">{row.arrivalTime || '-'}</td>
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
      {/* 화면 닫기 확인 모달 */}
      <CloseConfirmModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onConfirm={handleConfirmClose}
      />
    </PageLayout>
  );
}
