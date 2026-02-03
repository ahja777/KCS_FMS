'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';

interface Warehouse {
  id: string;
  warehouseCode: string;
  warehouseName: string;
  warehouseType: string;
  address: string;
  capacity: number;
  usedCapacity: number;
  manager: string;
  contact: string;
  status: 'active' | 'inactive' | 'full';
}

interface SearchFilters {
  warehouseCode: string;
  warehouseName: string;
  warehouseType: string;
  status: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  active: { label: '운영중', color: '#059669', bgColor: '#D1FAE5' },
  inactive: { label: '미운영', color: '#6B7280', bgColor: '#F3F4F6' },
  full: { label: '만차', color: '#DC2626', bgColor: '#FEE2E2' },
};

const sampleData: Warehouse[] = [
  { id: '1', warehouseCode: 'WH-001', warehouseName: '부산 신항 CY', warehouseType: 'CY', address: '부산광역시 강서구 송정동 1600', capacity: 5000, usedCapacity: 3500, manager: '김창고', contact: '051-123-4567', status: 'active' },
  { id: '2', warehouseCode: 'WH-002', warehouseName: '인천항 CFS', warehouseType: 'CFS', address: '인천광역시 중구 항동7가', capacity: 3000, usedCapacity: 2800, manager: '이물류', contact: '032-234-5678', status: 'active' },
  { id: '3', warehouseCode: 'WH-003', warehouseName: '인천공항 창고', warehouseType: '항공창고', address: '인천광역시 중구 공항동로 272', capacity: 2000, usedCapacity: 2000, manager: '박항공', contact: '032-345-6789', status: 'full' },
  { id: '4', warehouseCode: 'WH-004', warehouseName: '평택 물류센터', warehouseType: '일반창고', address: '경기도 평택시 포승읍 평택항만길', capacity: 8000, usedCapacity: 4200, manager: '최센터', contact: '031-456-7890', status: 'active' },
  { id: '5', warehouseCode: 'WH-005', warehouseName: '광양 CY', warehouseType: 'CY', address: '전라남도 광양시 항만대로', capacity: 4000, usedCapacity: 1200, manager: '정광양', contact: '061-567-8901', status: 'active' },
  { id: '6', warehouseCode: 'WH-006', warehouseName: '김포 물류센터', warehouseType: '일반창고', address: '경기도 김포시 고촌읍', capacity: 6000, usedCapacity: 0, manager: '강김포', contact: '031-678-9012', status: 'inactive' },
];

const initialFilters: SearchFilters = {
  warehouseCode: '',
  warehouseName: '',
  warehouseType: '',
  status: '',
};

export default function WarehouseManagePage() {
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

  const [allData] = useState<Warehouse[]>(sampleData);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(initialFilters);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchMessage, setSearchMessage] = useState<string>('');

  const filteredList = useMemo(() => {
    return allData.filter(item => {
      if (appliedFilters.warehouseCode && !item.warehouseCode.toLowerCase().includes(appliedFilters.warehouseCode.toLowerCase())) return false;
      if (appliedFilters.warehouseName && !item.warehouseName.toLowerCase().includes(appliedFilters.warehouseName.toLowerCase())) return false;
      if (appliedFilters.warehouseType && item.warehouseType !== appliedFilters.warehouseType) return false;
      if (appliedFilters.status && item.status !== appliedFilters.status) return false;
      return true;
    });
  }, [allData, appliedFilters]);

  const summary = useMemo(() => ({
    total: filteredList.length,
    active: filteredList.filter(w => w.status === 'active').length,
    full: filteredList.filter(w => w.status === 'full').length,
    avgUsage: filteredList.length > 0 ? Math.round(filteredList.reduce((sum, w) => sum + (w.usedCapacity / w.capacity * 100), 0) / filteredList.length) : 0,
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
        <PageLayout title="창고(장치장)관리 조회" subtitle="창고화물관리  창고(장치장)관리 조회" showCloseButton={false} >
        <main className="p-6">
          <div className="flex justify-end items-center mb-6">
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)]">창고등록</button>
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
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">창고코드</label>
                  <input type="text" value={filters.warehouseCode} onChange={(e) => handleFilterChange('warehouseCode', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" placeholder="WH-XXX" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">창고명</label>
                  <input type="text" value={filters.warehouseName} onChange={(e) => handleFilterChange('warehouseName', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" placeholder="창고명" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">창고유형</label>
                  <select value={filters.warehouseType} onChange={(e) => handleFilterChange('warehouseType', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm">
                    <option value="">전체</option>
                    <option value="CY">CY</option>
                    <option value="CFS">CFS</option>
                    <option value="항공창고">항공창고</option>
                    <option value="일반창고">일반창고</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">상태</label>
                  <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm">
                    <option value="">전체</option>
                    <option value="active">운영중</option>
                    <option value="inactive">미운영</option>
                    <option value="full">만차</option>
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
              <p className="text-sm text-[var(--muted)]">전체 창고</p>
            </div>
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'active' })); setAppliedFilters(prev => ({ ...prev, status: 'active' })); }}>
              <p className="text-2xl font-bold text-[#059669]">{summary.active}</p>
              <p className="text-sm text-[var(--muted)]">운영중</p>
            </div>
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'full' })); setAppliedFilters(prev => ({ ...prev, status: 'full' })); }}>
              <p className="text-2xl font-bold text-[#DC2626]">{summary.full}</p>
              <p className="text-sm text-[var(--muted)]">만차</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold">{summary.avgUsage}%</p>
              <p className="text-sm text-[var(--muted)]">평균 사용률</p>
            </div>
          </div>

          <div className="card">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
              <h3 className="font-bold">창고 목록 ({filteredList.length}건)</h3>
              {selectedIds.size > 0 && <span className="text-sm text-blue-600">{selectedIds.size}건 선택됨</span>}
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-10"><input type="checkbox" checked={filteredList.length > 0 && selectedIds.size === filteredList.length} onChange={handleSelectAll} /></th>
                    <th>창고코드</th>
                    <th>창고명</th>
                    <th>유형</th>
                    <th>주소</th>
                    <th className="text-center">용량</th>
                    <th className="text-center">사용률</th>
                    <th>담당자</th>
                    <th>연락처</th>
                    <th className="text-center">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.length === 0 ? (
                    <tr><td colSpan={10} className="p-8 text-center text-[var(--muted)]">조회된 데이터가 없습니다.</td></tr>
                  ) : (
                    filteredList.map((row) => (
                      <tr key={row.id} className={`border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer ${selectedIds.has(row.id) ? 'bg-blue-50' : ''}`} onClick={() => handleRowSelect(row.id)}>
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => handleRowSelect(row.id)} /></td>
                        <td className="p-3 text-[#2563EB] font-medium">{row.warehouseCode}</td>
                        <td className="p-3 text-sm font-medium">{row.warehouseName}</td>
                        <td className="p-3 text-sm">{row.warehouseType}</td>
                        <td className="p-3 text-sm">{row.address}</td>
                        <td className="p-3 text-sm text-center">{row.capacity.toLocaleString()} TEU</td>
                        <td className="p-3">
                          <div className="w-full bg-[var(--surface-200)] rounded-full h-2">
                            <div className={`h-2 rounded-full ${row.usedCapacity / row.capacity > 0.9 ? 'bg-red-500' : row.usedCapacity / row.capacity > 0.7 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${(row.usedCapacity / row.capacity) * 100}%` }}></div>
                          </div>
                          <p className="text-xs text-center mt-1">{Math.round((row.usedCapacity / row.capacity) * 100)}%</p>
                        </td>
                        <td className="p-3 text-sm">{row.manager}</td>
                        <td className="p-3 text-sm">{row.contact}</td>
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
