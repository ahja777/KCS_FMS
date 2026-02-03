'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { OrderInfoModal, type OrderItem } from '@/components/popup';
import { getToday } from '@/components/DateRangeButtons';

interface TransportRequest {
  id: string;
  requestNo: string;
  requestDate: string;
  customerName: string;
  blNo: string;
  origin: string;
  destination: string;
  pickupDate: string;
  deliveryDate: string;
  vehicleType: string;
  weight: number;
  status: 'requested' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
}

interface SearchFilters {
  startDate: string;
  endDate: string;
  requestNo: string;
  blNo: string;
  customerName: string;
  status: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  requested: { label: '요청', color: '#2563EB', bgColor: '#DBEAFE' },
  assigned: { label: '배차완료', color: '#7C3AED', bgColor: '#EDE9FE' },
  in_progress: { label: '운송중', color: '#EA580C', bgColor: '#FED7AA' },
  completed: { label: '완료', color: '#059669', bgColor: '#D1FAE5' },
  cancelled: { label: '취소', color: '#DC2626', bgColor: '#FEE2E2' },
};

const sampleData: TransportRequest[] = [
  { id: '1', requestNo: 'TR-2026-0001', requestDate: '2026-01-15', customerName: '삼성전자', blNo: 'HBL2026010001', origin: '부산항 신항', destination: '수원 삼성물류센터', pickupDate: '2026-01-16', deliveryDate: '2026-01-16', vehicleType: '5톤 윙바디', weight: 4500, status: 'completed' },
  { id: '2', requestNo: 'TR-2026-0002', requestDate: '2026-01-15', customerName: 'LG전자', blNo: 'HBL2026010002', origin: '인천공항 화물터미널', destination: '평택 LG물류센터', pickupDate: '2026-01-16', deliveryDate: '2026-01-16', vehicleType: '11톤 카고', weight: 8200, status: 'in_progress' },
  { id: '3', requestNo: 'TR-2026-0003', requestDate: '2026-01-14', customerName: '현대자동차', blNo: 'HBL2026010003', origin: '울산 현대공장', destination: '부산 신항 CY', pickupDate: '2026-01-15', deliveryDate: '2026-01-15', vehicleType: '25톤 트레일러', weight: 22000, status: 'assigned' },
  { id: '4', requestNo: 'TR-2026-0004', requestDate: '2026-01-14', customerName: 'SK하이닉스', blNo: 'HBL2026010004', origin: '인천공항', destination: '이천 SK물류센터', pickupDate: '2026-01-15', deliveryDate: '2026-01-15', vehicleType: '5톤 탑차', weight: 3000, status: 'requested' },
  { id: '5', requestNo: 'TR-2026-0005', requestDate: '2026-01-13', customerName: '포스코', blNo: 'HBL2026010005', origin: '광양 포스코', destination: '서울 물류센터', pickupDate: '2026-01-14', deliveryDate: '2026-01-14', vehicleType: '25톤 트레일러', weight: 28000, status: 'cancelled' },
];

const today = getToday();
const initialFilters: SearchFilters = {
  startDate: today,
  endDate: today,
  requestNo: '',
  blNo: '',
  customerName: '',
  status: '',
};

export default function TransportRequestPage() {
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);

  // 화면닫기 핸들러
  const handleCloseClick = () => {
    setShowCloseModal(true);
  };

  const handleConfirmClose = () => {
    setShowCloseModal(false);
    router.back();
  };

  // 브라우저 뒤로가기 버튼 처리
  useCloseConfirm({
    showModal: showCloseModal,
    setShowModal: setShowCloseModal,
    onConfirmClose: handleConfirmClose,
  });

  const [allData] = useState<TransportRequest[]>(sampleData);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(initialFilters);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchMessage, setSearchMessage] = useState<string>('');
  const [showOrderModal, setShowOrderModal] = useState(false);

  const filteredList = useMemo(() => {
    return allData.filter(item => {
      if (appliedFilters.requestNo && !item.requestNo.toLowerCase().includes(appliedFilters.requestNo.toLowerCase())) return false;
      if (appliedFilters.blNo && !item.blNo.toLowerCase().includes(appliedFilters.blNo.toLowerCase())) return false;
      if (appliedFilters.customerName && !item.customerName.toLowerCase().includes(appliedFilters.customerName.toLowerCase())) return false;
      if (appliedFilters.status && item.status !== appliedFilters.status) return false;
      if (appliedFilters.startDate && item.requestDate < appliedFilters.startDate) return false;
      if (appliedFilters.endDate && item.requestDate > appliedFilters.endDate) return false;
      return true;
    });
  }, [allData, appliedFilters]);

  const summary = useMemo(() => ({
    total: filteredList.length,
    requested: filteredList.filter(r => r.status === 'requested').length,
    assigned: filteredList.filter(r => r.status === 'assigned').length,
    in_progress: filteredList.filter(r => r.status === 'in_progress').length,
    completed: filteredList.filter(r => r.status === 'completed').length,
  }), [filteredList]);

  const handleOrderSelect = (item: OrderItem) => {
    setFilters(prev => ({ ...prev, customerName: item.customer }));
    setShowOrderModal(false);
  };

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
        <PageLayout title="운송요청관리" subtitle="운송의뢰관리  운송요청관리" showCloseButton={false} >
        <main className="p-6">
          <div className="flex justify-end items-center mb-6">
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)]">운송요청 등록</button>
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
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">요청일자 <span className="text-red-500">*</span></label>
                  <div className="flex items-center gap-2">
                    <input type="date" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
                    <span className="text-[var(--muted)]">~</span>
                    <input type="date" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">요청번호</label>
                  <input type="text" value={filters.requestNo} onChange={(e) => handleFilterChange('requestNo', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" placeholder="TR-YYYY-XXXX" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">B/L 번호</label>
                  <input type="text" value={filters.blNo} onChange={(e) => handleFilterChange('blNo', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" placeholder="B/L No" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">고객사</label>
                  <input type="text" value={filters.customerName} onChange={(e) => handleFilterChange('customerName', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" placeholder="고객사명" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">상태</label>
                  <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm">
                    <option value="">전체</option>
                    <option value="requested">요청</option>
                    <option value="assigned">배차완료</option>
                    <option value="in_progress">운송중</option>
                    <option value="completed">완료</option>
                    <option value="cancelled">취소</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-[var(--border)] flex justify-center gap-2">
              <button onClick={handleSearch} className="px-6 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] font-medium">조회</button>
              <button onClick={handleReset} className="px-6 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">초기화</button>
              <button onClick={() => setShowOrderModal(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">주문정보</button>
            </div>
          </div>

          {/* 현황 카드 */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: '' })); setAppliedFilters(prev => ({ ...prev, status: '' })); }}>
              <p className="text-2xl font-bold">{summary.total}</p>
              <p className="text-sm text-[var(--muted)]">전체</p>
            </div>
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'requested' })); setAppliedFilters(prev => ({ ...prev, status: 'requested' })); }}>
              <p className="text-2xl font-bold text-[#2563EB]">{summary.requested}</p>
              <p className="text-sm text-[var(--muted)]">요청</p>
            </div>
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'assigned' })); setAppliedFilters(prev => ({ ...prev, status: 'assigned' })); }}>
              <p className="text-2xl font-bold text-[#7C3AED]">{summary.assigned}</p>
              <p className="text-sm text-[var(--muted)]">배차완료</p>
            </div>
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'in_progress' })); setAppliedFilters(prev => ({ ...prev, status: 'in_progress' })); }}>
              <p className="text-2xl font-bold text-[#EA580C]">{summary.in_progress}</p>
              <p className="text-sm text-[var(--muted)]">운송중</p>
            </div>
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'completed' })); setAppliedFilters(prev => ({ ...prev, status: 'completed' })); }}>
              <p className="text-2xl font-bold text-[#059669]">{summary.completed}</p>
              <p className="text-sm text-[var(--muted)]">완료</p>
            </div>
          </div>

          <div className="card">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
              <h3 className="font-bold">운송요청 목록 ({filteredList.length}건)</h3>
              {selectedIds.size > 0 && <span className="text-sm text-blue-600">{selectedIds.size}건 선택됨</span>}
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-10 text-center"><input type="checkbox" checked={filteredList.length > 0 && selectedIds.size === filteredList.length} onChange={handleSelectAll} /></th>
                    <th className="text-center">요청번호</th>
                    <th className="text-center">요청일자</th>
                    <th className="text-center">고객사</th>
                    <th className="text-center">B/L No</th>
                    <th className="text-center">출발지</th>
                    <th className="text-center">도착지</th>
                    <th className="text-center">픽업일</th>
                    <th className="text-center">배송일</th>
                    <th className="text-center">차량</th>
                    <th className="text-center">중량(kg)</th>
                    <th className="text-center">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.length === 0 ? (
                    <tr><td colSpan={12} className="p-8 text-center text-[var(--muted)]">조회된 데이터가 없습니다.</td></tr>
                  ) : (
                    filteredList.map((row) => (
                      <tr key={row.id} className={`border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer ${selectedIds.has(row.id) ? 'bg-blue-50' : ''}`} onClick={() => handleRowSelect(row.id)}>
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => handleRowSelect(row.id)} /></td>
                        <td className="p-3 text-center text-[#2563EB] font-medium">{row.requestNo}</td>
                        <td className="p-3 text-center text-sm">{row.requestDate}</td>
                        <td className="p-3 text-center text-sm">{row.customerName}</td>
                        <td className="p-3 text-center text-sm">{row.blNo}</td>
                        <td className="p-3 text-center text-sm">{row.origin}</td>
                        <td className="p-3 text-center text-sm">{row.destination}</td>
                        <td className="p-3 text-center text-sm">{row.pickupDate}</td>
                        <td className="p-3 text-center text-sm">{row.deliveryDate}</td>
                        <td className="p-3 text-center text-sm">{row.vehicleType}</td>
                        <td className="p-3 text-center text-sm">{row.weight.toLocaleString()}</td>
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
      <OrderInfoModal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        onSelect={handleOrderSelect}
      />

      {/* 화면 닫기 확인 모달 */}
      <CloseConfirmModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onConfirm={handleConfirmClose}
      />
    </PageLayout>
  );
}
