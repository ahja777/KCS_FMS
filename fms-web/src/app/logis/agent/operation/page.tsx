'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { LIST_PATHS } from '@/constants/paths';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';

interface AgentOperation {
  id: string;
  agentCode: string;
  agentName: string;
  agentType: string;
  country: string;
  city: string;
  contactPerson: string;
  email: string;
  phone: string;
  contractStart: string;
  contractEnd: string;
  commission: number;
  status: 'active' | 'inactive' | 'pending';
}

interface SearchFilters {
  agentCode: string;
  agentName: string;
  country: string;
  status: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  active: { label: '활성', color: '#059669', bgColor: '#D1FAE5' },
  inactive: { label: '비활성', color: '#6B7280', bgColor: '#F3F4F6' },
  pending: { label: '승인대기', color: '#EA580C', bgColor: '#FED7AA' },
};

const sampleData: AgentOperation[] = [
  { id: '1', agentCode: 'AG-001', agentName: 'Shanghai Freight Co.', agentType: '해외대리점', country: 'CN', city: 'Shanghai', contactPerson: 'Zhang Wei', email: 'zhang@shfreight.com', phone: '+86-21-1234-5678', contractStart: '2025-01-01', contractEnd: '2026-12-31', commission: 5.0, status: 'active' },
  { id: '2', agentCode: 'AG-002', agentName: 'Singapore Logistics Pte.', agentType: '해외대리점', country: 'SG', city: 'Singapore', contactPerson: 'John Tan', email: 'john@sglogistics.com', phone: '+65-6789-0123', contractStart: '2025-03-01', contractEnd: '2026-02-28', commission: 4.5, status: 'active' },
  { id: '3', agentCode: 'AG-003', agentName: 'Tokyo Shipping Inc.', agentType: '해외대리점', country: 'JP', city: 'Tokyo', contactPerson: 'Tanaka Yuki', email: 'tanaka@tokyoship.jp', phone: '+81-3-1234-5678', contractStart: '2026-01-01', contractEnd: '2026-12-31', commission: 4.0, status: 'pending' },
  { id: '4', agentCode: 'AG-004', agentName: 'LA Forwarding LLC', agentType: '해외대리점', country: 'US', city: 'Los Angeles', contactPerson: 'Mike Johnson', email: 'mike@laforward.com', phone: '+1-213-456-7890', contractStart: '2024-06-01', contractEnd: '2025-05-31', commission: 5.5, status: 'inactive' },
  { id: '5', agentCode: 'AG-005', agentName: 'Vietnam Logistics JSC', agentType: '해외대리점', country: 'VN', city: 'Ho Chi Minh', contactPerson: 'Nguyen Van', email: 'nguyen@vnlogistics.vn', phone: '+84-28-1234-5678', contractStart: '2025-06-01', contractEnd: '2026-05-31', commission: 4.8, status: 'active' },
  { id: '6', agentCode: 'AG-006', agentName: 'Bangkok Freight Ltd.', agentType: '해외대리점', country: 'TH', city: 'Bangkok', contactPerson: 'Somchai Lee', email: 'somchai@bkfreight.co.th', phone: '+66-2-123-4567', contractStart: '2026-01-15', contractEnd: '2027-01-14', commission: 4.2, status: 'pending' },
];

const initialFilters: SearchFilters = {
  agentCode: '',
  agentName: '',
  country: '',
  status: '',
};

export default function AgentOperationPage() {
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

  const [allData] = useState<AgentOperation[]>(sampleData);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(initialFilters);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchMessage, setSearchMessage] = useState<string>('');

  const filteredList = useMemo(() => {
    return allData.filter(item => {
      if (appliedFilters.agentCode && !item.agentCode.toLowerCase().includes(appliedFilters.agentCode.toLowerCase())) return false;
      if (appliedFilters.agentName && !item.agentName.toLowerCase().includes(appliedFilters.agentName.toLowerCase())) return false;
      if (appliedFilters.country && item.country !== appliedFilters.country) return false;
      if (appliedFilters.status && item.status !== appliedFilters.status) return false;
      return true;
    });
  }, [allData, appliedFilters]);

  const summary = useMemo(() => ({
    total: filteredList.length,
    active: filteredList.filter(a => a.status === 'active').length,
    pending: filteredList.filter(a => a.status === 'pending').length,
    inactive: filteredList.filter(a => a.status === 'inactive').length,
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
        <PageLayout title="운영관리 조회" subtitle="입력대행관리  운영관리 조회" showCloseButton={false} >
        <main className="p-6">
          <div className="flex justify-end items-center mb-6">
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)] transition-colors">대리점 등록</button>
              <button onClick={() => alert(`Excel 다운로드: ${selectedIds.size > 0 ? selectedIds.size : filteredList.length}건`)} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">Excel</button>
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
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">대리점코드</label>
                  <input type="text" value={filters.agentCode} onChange={(e) => handleFilterChange('agentCode', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" placeholder="AG-XXX" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">대리점명</label>
                  <input type="text" value={filters.agentName} onChange={(e) => handleFilterChange('agentName', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" placeholder="대리점명" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">국가</label>
                  <select value={filters.country} onChange={(e) => handleFilterChange('country', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm">
                    <option value="">전체</option>
                    <option value="CN">중국</option>
                    <option value="SG">싱가포르</option>
                    <option value="JP">일본</option>
                    <option value="US">미국</option>
                    <option value="VN">베트남</option>
                    <option value="TH">태국</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">상태</label>
                  <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm">
                    <option value="">전체</option>
                    <option value="active">활성</option>
                    <option value="inactive">비활성</option>
                    <option value="pending">승인대기</option>
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
              <p className="text-sm text-[var(--muted)]">전체 대리점</p>
            </div>
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'active' })); setAppliedFilters(prev => ({ ...prev, status: 'active' })); }}>
              <p className="text-2xl font-bold text-[#059669]">{summary.active}</p>
              <p className="text-sm text-[var(--muted)]">활성</p>
            </div>
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'pending' })); setAppliedFilters(prev => ({ ...prev, status: 'pending' })); }}>
              <p className="text-2xl font-bold text-[#EA580C]">{summary.pending}</p>
              <p className="text-sm text-[var(--muted)]">승인대기</p>
            </div>
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'inactive' })); setAppliedFilters(prev => ({ ...prev, status: 'inactive' })); }}>
              <p className="text-2xl font-bold text-[#6B7280]">{summary.inactive}</p>
              <p className="text-sm text-[var(--muted)]">비활성</p>
            </div>
          </div>

          <div className="card">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
              <h3 className="font-bold">대리점 목록 ({filteredList.length}건)</h3>
              {selectedIds.size > 0 && <span className="text-sm text-blue-600">{selectedIds.size}건 선택됨</span>}
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-10"><input type="checkbox" checked={filteredList.length > 0 && selectedIds.size === filteredList.length} onChange={handleSelectAll} /></th>
                    <th className="text-center">대리점코드</th>
                    <th className="text-center">대리점명</th>
                    <th className="text-center">유형</th>
                    <th className="text-center">국가</th>
                    <th className="text-center">도시</th>
                    <th className="text-center">담당자</th>
                    <th className="text-center">이메일</th>
                    <th className="text-center">계약기간</th>
                    <th className="text-center">수수료(%)</th>
                    <th className="text-center">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.length === 0 ? (
                    <tr><td colSpan={11} className="p-8 text-center text-[var(--muted)]">조회된 데이터가 없습니다.</td></tr>
                  ) : (
                    filteredList.map((row) => (
                      <tr key={row.id} className={`border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer ${selectedIds.has(row.id) ? 'bg-blue-50' : ''}`} onClick={() => handleRowSelect(row.id)}>
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => handleRowSelect(row.id)} /></td>
                        <td className="p-3 text-center text-[#2563EB] font-medium">{row.agentCode}</td>
                        <td className="p-3 text-center text-sm font-medium">{row.agentName}</td>
                        <td className="p-3 text-center text-sm">{row.agentType}</td>
                        <td className="p-3 text-center text-sm">{row.country}</td>
                        <td className="p-3 text-center text-sm">{row.city}</td>
                        <td className="p-3 text-center text-sm">{row.contactPerson}</td>
                        <td className="p-3 text-center text-sm">{row.email}</td>
                        <td className="p-3 text-center text-sm">{row.contractStart} ~ {row.contractEnd}</td>
                        <td className="p-3 text-center text-sm">{row.commission}%</td>
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
