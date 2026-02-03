'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { LIST_PATHS } from '@/constants/paths';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { getToday } from '@/components/DateRangeButtons';

interface CargoStatus {
  id: string;
  blNo: string;
  containerNo: string;
  sealNo: string;
  customerName: string;
  commodity: string;
  weight: number;
  volume: number;
  location: string;
  warehouseZone: string;
  inDate: string;
  status: 'in_storage' | 'pending_release' | 'released' | 'customs_hold';
  customsStatus: string;
}

interface SearchFilters {
  startDate: string;
  endDate: string;
  blNo: string;
  containerNo: string;
  customerName: string;
  location: string;
  status: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  in_storage: { label: '보관중', color: '#2563EB', bgColor: '#DBEAFE' },
  pending_release: { label: '출고대기', color: '#EA580C', bgColor: '#FED7AA' },
  released: { label: '출고완료', color: '#059669', bgColor: '#D1FAE5' },
  customs_hold: { label: '통관보류', color: '#DC2626', bgColor: '#FEE2E2' },
};

const sampleData: CargoStatus[] = [
  { id: '1', blNo: 'HBL2026010001', containerNo: 'MSKU1234567', sealNo: 'SL12345', customerName: '삼성전자', commodity: '전자제품', weight: 12500, volume: 32.5, location: '부산 신항 CY', warehouseZone: 'A-12-03', inDate: '2026-01-15', status: 'in_storage', customsStatus: '통관완료' },
  { id: '2', blNo: 'HBL2026010002', containerNo: 'MSCU2345678', sealNo: 'SL23456', customerName: 'LG전자', commodity: '가전제품', weight: 18000, volume: 45.0, location: '인천항 CFS', warehouseZone: 'B-05-01', inDate: '2026-01-14', status: 'pending_release', customsStatus: '통관완료' },
  { id: '3', blNo: 'HBL2026010003', containerNo: 'HLCU3456789', sealNo: 'SL34567', customerName: '현대자동차', commodity: '자동차 부품', weight: 22000, volume: 55.0, location: '부산 신항 CY', warehouseZone: 'C-08-02', inDate: '2026-01-13', status: 'customs_hold', customsStatus: '검사대기' },
  { id: '4', blNo: 'HBL2026010004', containerNo: 'EITU4567890', sealNo: 'SL45678', customerName: 'SK하이닉스', commodity: '반도체', weight: 5000, volume: 8.0, location: '인천공항 창고', warehouseZone: 'D-01-05', inDate: '2026-01-12', status: 'released', customsStatus: '통관완료' },
  { id: '5', blNo: 'HBL2026010005', containerNo: 'TCLU5678901', sealNo: 'SL56789', customerName: '포스코', commodity: '철강재', weight: 35000, volume: 28.0, location: '부산 신항 CY', warehouseZone: 'A-15-02', inDate: '2026-01-16', status: 'in_storage', customsStatus: '통관완료' },
  { id: '6', blNo: 'HBL2026010006', containerNo: 'CMAU6789012', sealNo: 'SL67890', customerName: '삼성전자', commodity: '디스플레이', weight: 8500, volume: 42.0, location: '인천항 CFS', warehouseZone: 'B-08-03', inDate: '2026-01-11', status: 'pending_release', customsStatus: '통관완료' },
];

const today = getToday();
const initialFilters: SearchFilters = {
  startDate: today,
  endDate: today,
  blNo: '',
  containerNo: '',
  customerName: '',
  location: '',
  status: '',
};

export default function CargoStatusPage() {
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

  const [allData] = useState<CargoStatus[]>(sampleData);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(initialFilters);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchMessage, setSearchMessage] = useState<string>('');

  // 필터링된 데이터
  const filteredList = useMemo(() => {
    return allData.filter(item => {
      // B/L 번호 필터
      if (appliedFilters.blNo && !item.blNo.toLowerCase().includes(appliedFilters.blNo.toLowerCase())) {
        return false;
      }
      // 컨테이너 번호 필터
      if (appliedFilters.containerNo && !item.containerNo.toLowerCase().includes(appliedFilters.containerNo.toLowerCase())) {
        return false;
      }
      // 고객사 필터
      if (appliedFilters.customerName && !item.customerName.toLowerCase().includes(appliedFilters.customerName.toLowerCase())) {
        return false;
      }
      // 보관장소 필터
      if (appliedFilters.location) {
        const locationMap: Record<string, string> = {
          'busan': '부산 신항 CY',
          'incheon': '인천항 CFS',
          'airport': '인천공항 창고',
        };
        if (item.location !== locationMap[appliedFilters.location]) {
          return false;
        }
      }
      // 상태 필터
      if (appliedFilters.status && item.status !== appliedFilters.status) {
        return false;
      }
      // 날짜 필터
      if (appliedFilters.startDate && item.inDate < appliedFilters.startDate) {
        return false;
      }
      if (appliedFilters.endDate && item.inDate > appliedFilters.endDate) {
        return false;
      }
      return true;
    });
  }, [allData, appliedFilters]);

  // 현황 집계
  const summary = useMemo(() => ({
    total: filteredList.length,
    inStorage: filteredList.filter(c => c.status === 'in_storage').length,
    pendingRelease: filteredList.filter(c => c.status === 'pending_release').length,
    released: filteredList.filter(c => c.status === 'released').length,
    customsHold: filteredList.filter(c => c.status === 'customs_hold').length,
  }), [filteredList]);

  // 검색 실행
  const handleSearch = () => {
    setAppliedFilters({ ...filters });
    setSelectedIds(new Set());
    setSearchMessage(`검색 완료: ${filteredList.length}건이 조회되었습니다.`);
    setTimeout(() => setSearchMessage(''), 3000);
  };

  // 초기화
  const handleReset = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setSelectedIds(new Set());
    setSearchMessage('검색 조건이 초기화되었습니다.');
    setTimeout(() => setSearchMessage(''), 3000);
  };

  // 필터 값 변경
  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // 개별 체크박스 선택
  const handleRowSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // 전체 선택
  const handleSelectAll = () => {
    if (selectedIds.size === filteredList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredList.map(item => item.id)));
    }
  };

  // Excel 다운로드 (시뮬레이션)
  const handleExcelDownload = () => {
    alert(`Excel 다운로드: ${selectedIds.size > 0 ? selectedIds.size : filteredList.length}건`);
  };

  return (
        <PageLayout title="화물재고현황 조회" subtitle="화물재고현황  화물재고현황 조회" showCloseButton={false} >
        <main className="p-6">
          <div className="flex justify-end items-center mb-6">
            <button
              onClick={handleExcelDownload}
              className="px-4 py-2 bg-[var(--surface-100)] rounded-lg hover:bg-[var(--surface-200)] transition-colors"
            >
              Excel
            </button>
          </div>

          {/* 검색 알림 메시지 */}
          {searchMessage && (
            <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded-lg animate-fade-in">
              {searchMessage}
            </div>
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
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">입고일자</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                  />
                  <span>~</span>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">B/L 번호</label>
                <input
                  type="text"
                  value={filters.blNo}
                  onChange={(e) => handleFilterChange('blNo', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                  placeholder="B/L No"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">컨테이너 번호</label>
                <input
                  type="text"
                  value={filters.containerNo}
                  onChange={(e) => handleFilterChange('containerNo', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                  placeholder="Container No"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">고객사</label>
                <input
                  type="text"
                  value={filters.customerName}
                  onChange={(e) => handleFilterChange('customerName', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                  placeholder="고객사명"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">보관장소</label>
                <select
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                >
                  <option value="">전체</option>
                  <option value="busan">부산 신항 CY</option>
                  <option value="incheon">인천항 CFS</option>
                  <option value="airport">인천공항 창고</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">상태</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                >
                  <option value="">전체</option>
                  <option value="in_storage">보관중</option>
                  <option value="pending_release">출고대기</option>
                  <option value="released">출고완료</option>
                  <option value="customs_hold">통관보류</option>
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

          {/* 현황 카드 */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { setFilters(prev => ({ ...prev, status: '' })); setAppliedFilters(prev => ({ ...prev, status: '' })); }}>
              <p className="text-2xl font-bold text-[var(--foreground)]">{summary.total}</p>
              <p className="text-sm text-[var(--muted)]">전체</p>
            </div>
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { setFilters(prev => ({ ...prev, status: 'in_storage' })); setAppliedFilters(prev => ({ ...prev, status: 'in_storage' })); }}>
              <p className="text-2xl font-bold text-[#2563EB]">{summary.inStorage}</p>
              <p className="text-sm text-[var(--muted)]">보관중</p>
            </div>
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { setFilters(prev => ({ ...prev, status: 'pending_release' })); setAppliedFilters(prev => ({ ...prev, status: 'pending_release' })); }}>
              <p className="text-2xl font-bold text-[#EA580C]">{summary.pendingRelease}</p>
              <p className="text-sm text-[var(--muted)]">출고대기</p>
            </div>
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { setFilters(prev => ({ ...prev, status: 'released' })); setAppliedFilters(prev => ({ ...prev, status: 'released' })); }}>
              <p className="text-2xl font-bold text-[#059669]">{summary.released}</p>
              <p className="text-sm text-[var(--muted)]">출고완료</p>
            </div>
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { setFilters(prev => ({ ...prev, status: 'customs_hold' })); setAppliedFilters(prev => ({ ...prev, status: 'customs_hold' })); }}>
              <p className="text-2xl font-bold text-[#DC2626]">{summary.customsHold}</p>
              <p className="text-sm text-[var(--muted)]">통관보류</p>
            </div>
          </div>

          <div className="card">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
              <h3 className="font-bold">화물재고 목록 ({filteredList.length}건)</h3>
              {selectedIds.size > 0 && (
                <span className="text-sm text-blue-600">{selectedIds.size}건 선택됨</span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-10 text-center">
                      <input
                        type="checkbox"
                        checked={filteredList.length > 0 && selectedIds.size === filteredList.length}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th>B/L No</th>
                    <th>컨테이너 No</th>
                    <th>고객사</th>
                    <th>품명</th>
                    <th className="text-center">중량(kg)</th>
                    <th className="text-center">용적(CBM)</th>
                    <th>보관장소</th>
                    <th>위치</th>
                    <th className="text-center">입고일</th>
                    <th className="text-center">통관상태</th>
                    <th className="text-center">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="p-8 text-center text-[var(--muted)]">
                        조회된 데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((row) => (
                      <tr
                        key={row.id}
                        className={`border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer transition-colors ${selectedIds.has(row.id) ? 'bg-blue-50' : ''}`}
                        onClick={() => handleRowSelect(row.id)}
                      >
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(row.id)}
                            onChange={() => handleRowSelect(row.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="p-3 text-[#2563EB] font-medium">{row.blNo}</td>
                        <td className="p-3 text-sm">{row.containerNo}</td>
                        <td className="p-3 text-sm">{row.customerName}</td>
                        <td className="p-3 text-sm">{row.commodity}</td>
                        <td className="p-3 text-sm text-center">{row.weight.toLocaleString()}</td>
                        <td className="p-3 text-sm text-center">{row.volume}</td>
                        <td className="p-3 text-sm">{row.location}</td>
                        <td className="p-3 text-sm font-mono">{row.warehouseZone}</td>
                        <td className="p-3 text-sm text-center">{row.inDate}</td>
                        <td className="p-3 text-sm text-center">{row.customsStatus}</td>
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
