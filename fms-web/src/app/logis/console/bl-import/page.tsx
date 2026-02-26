'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { HBLConsoleModal, type HBLConsoleItem } from '@/components/popup';
import { getToday } from '@/components/DateRangeButtons';

interface ConsoleBL {
  id: string;
  consoleNo: string;
  consoleDate: string;
  mblNo: string;
  hblCount: number;
  carrier: string;
  vessel: string;
  voyage: string;
  pol: string;
  pod: string;
  eta: string;
  totalContainers: number;
  totalWeight: number;
  status: 'collecting' | 'consolidated' | 'shipped' | 'arrived' | 'released';
}

interface SearchFilters {
  startDate: string;
  endDate: string;
  consoleNo: string;
  mblNo: string;
  carrier: string;
  pol: string;
  status: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  collecting: { label: '취합중', color: '#EA580C', bgColor: '#FED7AA' },
  consolidated: { label: '취합완료', color: '#2563EB', bgColor: '#DBEAFE' },
  shipped: { label: '선적', color: '#7C3AED', bgColor: '#EDE9FE' },
  arrived: { label: '도착', color: '#059669', bgColor: '#D1FAE5' },
  released: { label: '반출', color: '#14B8A6', bgColor: '#CCFBF1' },
};

const sampleData: ConsoleBL[] = [
  { id: '1', consoleNo: 'CON-2026-0001', consoleDate: '2026-01-15', mblNo: 'MBL2026010001', hblCount: 5, carrier: 'MAERSK', vessel: 'MAERSK EINDHOVEN', voyage: '001E', pol: 'CNSHA (상해)', pod: 'KRPUS (부산)', eta: '2026-01-20', totalContainers: 2, totalWeight: 35000, status: 'arrived' },
  { id: '2', consoleNo: 'CON-2026-0002', consoleDate: '2026-01-14', mblNo: 'MBL2026010002', hblCount: 3, carrier: 'MSC', vessel: 'MSC GULSUN', voyage: 'W002', pol: 'SGSIN (싱가포르)', pod: 'KRINC (인천)', eta: '2026-01-22', totalContainers: 1, totalWeight: 18000, status: 'shipped' },
  { id: '3', consoleNo: 'CON-2026-0003', consoleDate: '2026-01-13', mblNo: 'MBL2026010003', hblCount: 8, carrier: 'COSCO', vessel: 'COSCO SHIPPING UNIVERSE', voyage: '015E', pol: 'CNNGB (닝보)', pod: 'KRPUS (부산)', eta: '2026-01-25', totalContainers: 3, totalWeight: 52000, status: 'collecting' },
  { id: '4', consoleNo: 'CON-2026-0004', consoleDate: '2026-01-12', mblNo: 'MBL2026010004', hblCount: 4, carrier: 'EVERGREEN', vessel: 'EVER GIVEN', voyage: '005E', pol: 'JPTYO (도쿄)', pod: 'KRPUS (부산)', eta: '2026-01-18', totalContainers: 2, totalWeight: 28000, status: 'released' },
  { id: '5', consoleNo: 'CON-2026-0005', consoleDate: '2026-01-11', mblNo: 'MBL2026010005', hblCount: 6, carrier: 'HMM', vessel: 'HMM ALGECIRAS', voyage: '003S', pol: 'VNSGN (호치민)', pod: 'KRINC (인천)', eta: '2026-01-19', totalContainers: 2, totalWeight: 32000, status: 'consolidated' },
];

const today = getToday();
const initialFilters: SearchFilters = {
  startDate: today,
  endDate: today,
  consoleNo: '',
  mblNo: '',
  carrier: '',
  pol: '',
  status: '',
};

export default function ConsoleBLImportPage() {
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

  const [allData] = useState<ConsoleBL[]>(sampleData);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(initialFilters);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchMessage, setSearchMessage] = useState<string>('');
  const [showHBLModal, setShowHBLModal] = useState(false);

  const filteredList = useMemo(() => {
    return allData.filter(item => {
      if (appliedFilters.consoleNo && !item.consoleNo.toLowerCase().includes(appliedFilters.consoleNo.toLowerCase())) return false;
      if (appliedFilters.mblNo && !item.mblNo.toLowerCase().includes(appliedFilters.mblNo.toLowerCase())) return false;
      if (appliedFilters.carrier && item.carrier !== appliedFilters.carrier) return false;
      if (appliedFilters.pol && !item.pol.toLowerCase().includes(appliedFilters.pol.toLowerCase())) return false;
      if (appliedFilters.status && item.status !== appliedFilters.status) return false;
      if (appliedFilters.startDate && item.consoleDate < appliedFilters.startDate) return false;
      if (appliedFilters.endDate && item.consoleDate > appliedFilters.endDate) return false;
      return true;
    });
  }, [allData, appliedFilters]);

  const summary = useMemo(() => ({
    collecting: filteredList.filter(c => c.status === 'collecting').length,
    consolidated: filteredList.filter(c => c.status === 'consolidated').length,
    shipped: filteredList.filter(c => c.status === 'shipped').length,
    arrived: filteredList.filter(c => c.status === 'arrived').length,
    released: filteredList.filter(c => c.status === 'released').length,
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

  const handleHBLSelect = (items: HBLConsoleItem[]) => {
    alert(items.length + ' HBL selected, Total CBM: ' + items.reduce((s, i) => s + i.cbm, 0).toFixed(2));
    setShowHBLModal(false);
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
        <PageLayout title="B/L취합관리 (수입/해상)" subtitle="콘솔취합관리  B/L취합관리 (수입/해상)" showCloseButton={false} >
        <main className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-2">
              <button onClick={() => { if (selectedIds.size === 0) { alert('삭제할 항목을 선택해주세요.'); return; } if (!confirm(`${selectedIds.size}건을 삭제하시겠습니까?`)) return; setSelectedIds(new Set()); alert('삭제되었습니다.'); }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50" disabled={selectedIds.size === 0}>삭제</button>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)]">콘솔등록</button>
              <button onClick={() => setShowHBLModal(true)} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">HBL 추가</button>
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
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">콘솔일자 <span className="text-red-500">*</span></label>
                  <div className="flex items-center gap-2">
                    <input type="date" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
                    <span className="text-[var(--muted)]">~</span>
                    <input type="date" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">콘솔번호</label>
                  <input type="text" value={filters.consoleNo} onChange={(e) => handleFilterChange('consoleNo', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" placeholder="CON-YYYY-XXXX" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">MBL No</label>
                  <input type="text" value={filters.mblNo} onChange={(e) => handleFilterChange('mblNo', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" placeholder="MBL No" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">선사</label>
                  <select value={filters.carrier} onChange={(e) => handleFilterChange('carrier', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm">
                    <option value="">전체</option>
                    <option value="MAERSK">MAERSK</option>
                    <option value="MSC">MSC</option>
                    <option value="COSCO">COSCO</option>
                    <option value="EVERGREEN">EVERGREEN</option>
                    <option value="HMM">HMM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">POL</label>
                  <input type="text" value={filters.pol} onChange={(e) => handleFilterChange('pol', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" placeholder="선적항" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">상태</label>
                  <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm">
                    <option value="">전체</option>
                    <option value="collecting">취합중</option>
                    <option value="consolidated">취합완료</option>
                    <option value="shipped">선적</option>
                    <option value="arrived">도착</option>
                    <option value="released">반출</option>
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
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'collecting' })); setAppliedFilters(prev => ({ ...prev, status: 'collecting' })); }}>
              <p className="text-2xl font-bold text-[#EA580C]">{summary.collecting}</p>
              <p className="text-sm text-[var(--muted)]">취합중</p>
            </div>
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'consolidated' })); setAppliedFilters(prev => ({ ...prev, status: 'consolidated' })); }}>
              <p className="text-2xl font-bold text-[#2563EB]">{summary.consolidated}</p>
              <p className="text-sm text-[var(--muted)]">취합완료</p>
            </div>
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'shipped' })); setAppliedFilters(prev => ({ ...prev, status: 'shipped' })); }}>
              <p className="text-2xl font-bold text-[#7C3AED]">{summary.shipped}</p>
              <p className="text-sm text-[var(--muted)]">선적</p>
            </div>
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'arrived' })); setAppliedFilters(prev => ({ ...prev, status: 'arrived' })); }}>
              <p className="text-2xl font-bold text-[#059669]">{summary.arrived}</p>
              <p className="text-sm text-[var(--muted)]">도착</p>
            </div>
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'released' })); setAppliedFilters(prev => ({ ...prev, status: 'released' })); }}>
              <p className="text-2xl font-bold text-[#14B8A6]">{summary.released}</p>
              <p className="text-sm text-[var(--muted)]">반출</p>
            </div>
          </div>

          <div className="card">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
              <h3 className="font-bold">콘솔 목록 ({filteredList.length}건)</h3>
              {selectedIds.size > 0 && <span className="text-sm text-blue-600">{selectedIds.size}건 선택됨</span>}
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-10"><input type="checkbox" checked={filteredList.length > 0 && selectedIds.size === filteredList.length} onChange={handleSelectAll} /></th>
                    <th className="w-14">No</th>
                    <th>콘솔번호</th>
                    <th>콘솔일자</th>
                    <th>MBL No</th>
                    <th className="text-center">HBL 수</th>
                    <th>선사</th>
                    <th>선명/항차</th>
                    <th>POL</th>
                    <th>POD</th>
                    <th className="text-center">ETA</th>
                    <th className="text-center">컨테이너</th>
                    <th className="text-center">중량(kg)</th>
                    <th className="text-center">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.length === 0 ? (
                    <tr><td colSpan={14} className="p-8 text-center text-[var(--muted)]">조회된 데이터가 없습니다.</td></tr>
                  ) : (
                    filteredList.map((row, index) => (
                      <tr key={row.id} className={`border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer ${selectedIds.has(row.id) ? 'bg-blue-50' : ''}`} onClick={() => handleRowSelect(row.id)}>
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => handleRowSelect(row.id)} /></td>
                        <td className="text-center text-[var(--muted)]">{index + 1}</td>
                        <td className="p-3 text-[#2563EB] font-medium">{row.consoleNo}</td>
                        <td className="p-3 text-sm">{row.consoleDate}</td>
                        <td className="p-3 text-sm">{row.mblNo}</td>
                        <td className="p-3 text-sm text-center font-semibold">{row.hblCount}</td>
                        <td className="p-3 text-sm font-medium">{row.carrier}</td>
                        <td className="p-3 text-sm">{row.vessel} / {row.voyage}</td>
                        <td className="p-3 text-sm">{row.pol}</td>
                        <td className="p-3 text-sm">{row.pod}</td>
                        <td className="p-3 text-sm text-center">{row.eta}</td>
                        <td className="p-3 text-sm text-center">{row.totalContainers}</td>
                        <td className="p-3 text-sm text-center">{row.totalWeight.toLocaleString()}</td>
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
      <HBLConsoleModal
        isOpen={showHBLModal}
        onClose={() => setShowHBLModal(false)}
        onSelect={handleHBLSelect}
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
