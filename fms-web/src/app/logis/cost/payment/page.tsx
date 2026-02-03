'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { getToday } from '@/components/DateRangeButtons';
import { formatCurrency } from '@/utils/format';

interface CostPayment {
  id: string;
  paymentNo: string;
  paymentDate: string;
  blNo: string;
  customerName: string;
  costType: string;
  description: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  dueDate: string;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
}

interface SearchFilters {
  startDate: string;
  endDate: string;
  blNo: string;
  costType: string;
  customerName: string;
  status: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: '대기', color: '#6B7280', bgColor: '#F3F4F6' },
  approved: { label: '승인', color: '#2563EB', bgColor: '#DBEAFE' },
  paid: { label: '결제완료', color: '#059669', bgColor: '#D1FAE5' },
  cancelled: { label: '취소', color: '#DC2626', bgColor: '#FEE2E2' },
};

const sampleData: CostPayment[] = [
  { id: '1', paymentNo: 'CP-2026-0001', paymentDate: '2026-01-15', blNo: 'HBL2026010001', customerName: '삼성전자', costType: 'THC', description: 'Terminal Handling Charge', amount: 150000, currency: 'KRW', paymentMethod: '계좌이체', dueDate: '2026-01-20', status: 'paid' },
  { id: '2', paymentNo: 'CP-2026-0002', paymentDate: '2026-01-15', blNo: 'HBL2026010002', customerName: 'LG전자', costType: 'CFS', description: 'CFS Charge', amount: 85000, currency: 'KRW', paymentMethod: '계좌이체', dueDate: '2026-01-22', status: 'approved' },
  { id: '3', paymentNo: 'CP-2026-0003', paymentDate: '2026-01-14', blNo: 'HBL2026010003', customerName: '현대자동차', costType: 'D/O', description: 'D/O Fee', amount: 50000, currency: 'KRW', paymentMethod: '카드', dueDate: '2026-01-21', status: 'pending' },
  { id: '4', paymentNo: 'CP-2026-0004', paymentDate: '2026-01-14', blNo: 'HBL2026010004', customerName: 'SK하이닉스', costType: '통관수수료', description: 'Customs Clearance Fee', amount: 120000, currency: 'KRW', paymentMethod: '계좌이체', dueDate: '2026-01-19', status: 'paid' },
  { id: '5', paymentNo: 'CP-2026-0005', paymentDate: '2026-01-13', blNo: 'HBL2026010005', customerName: '포스코', costType: 'THC', description: 'Terminal Handling Charge', amount: 180000, currency: 'KRW', paymentMethod: '계좌이체', dueDate: '2026-01-18', status: 'cancelled' },
  { id: '6', paymentNo: 'CP-2026-0006', paymentDate: '2026-01-12', blNo: 'HBL2026010006', customerName: '삼성전자', costType: 'CFS', description: 'CFS Charge', amount: 95000, currency: 'KRW', paymentMethod: '카드', dueDate: '2026-01-17', status: 'paid' },
];

const today = getToday();
const initialFilters: SearchFilters = {
  startDate: today,
  endDate: today,
  blNo: '',
  costType: '',
  customerName: '',
  status: '',
};

export default function CostPaymentPage() {
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

  const [allData] = useState<CostPayment[]>(sampleData);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(initialFilters);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchMessage, setSearchMessage] = useState<string>('');

  const filteredList = useMemo(() => {
    return allData.filter(item => {
      if (appliedFilters.blNo && !item.blNo.toLowerCase().includes(appliedFilters.blNo.toLowerCase())) return false;
      if (appliedFilters.customerName && !item.customerName.toLowerCase().includes(appliedFilters.customerName.toLowerCase())) return false;
      if (appliedFilters.costType && item.costType !== appliedFilters.costType) return false;
      if (appliedFilters.status && item.status !== appliedFilters.status) return false;
      if (appliedFilters.startDate && item.paymentDate < appliedFilters.startDate) return false;
      if (appliedFilters.endDate && item.paymentDate > appliedFilters.endDate) return false;
      return true;
    });
  }, [allData, appliedFilters]);

  const totalAmount = filteredList.reduce((sum, p) => sum + p.amount, 0);
  const paidAmount = filteredList.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);

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
        <PageLayout title="부대비용결제관리" subtitle="부대비용관리  부대비용결제관리" showCloseButton={false} >
        <main className="p-6">
          <div className="flex justify-end items-center mb-6">
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)]">비용등록</button>
              <button onClick={() => alert(`Excel 다운로드: ${selectedIds.size > 0 ? selectedIds.size : filteredList.length}건`)} className="px-4 py-2 bg-[var(--surface-100)] rounded-lg hover:bg-[var(--surface-200)]">Excel</button>
            </div>
          </div>

          {searchMessage && (
            <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded-lg">{searchMessage}</div>
          )}

          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="card p-4">
              <p className="text-sm text-[var(--muted)] mb-1">총 비용</p>
              <p className="text-2xl font-bold">{formatCurrency(totalAmount, 'KRW')}</p>
            </div>
            <div className="card p-4 cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'paid' })); setAppliedFilters(prev => ({ ...prev, status: 'paid' })); }}>
              <p className="text-sm text-[var(--muted)] mb-1">결제완료</p>
              <p className="text-2xl font-bold text-[#059669]">{formatCurrency(paidAmount, 'KRW')}</p>
            </div>
            <div className="card p-4 cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'pending' })); setAppliedFilters(prev => ({ ...prev, status: 'pending' })); }}>
              <p className="text-sm text-[var(--muted)] mb-1">미결제</p>
              <p className="text-2xl font-bold text-[#EA580C]">{formatCurrency(totalAmount - paidAmount, 'KRW')}</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-[var(--muted)] mb-1">결제율</p>
              <p className="text-2xl font-bold">{totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0}%</p>
            </div>
          </div>

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
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">등록일자 <span className="text-red-500">*</span></label>
                  <div className="flex items-center gap-2">
                    <input type="date" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
                    <span className="text-[var(--muted)]">~</span>
                    <input type="date" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">B/L 번호</label>
                  <input type="text" value={filters.blNo} onChange={(e) => handleFilterChange('blNo', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" placeholder="B/L No" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">비용유형</label>
                  <select value={filters.costType} onChange={(e) => handleFilterChange('costType', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm">
                    <option value="">전체</option>
                    <option value="THC">THC</option>
                    <option value="CFS">CFS</option>
                    <option value="D/O">D/O</option>
                    <option value="통관수수료">통관수수료</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">고객사</label>
                  <input type="text" value={filters.customerName} onChange={(e) => handleFilterChange('customerName', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" placeholder="고객사명" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">상태</label>
                  <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm">
                    <option value="">전체</option>
                    <option value="pending">대기</option>
                    <option value="approved">승인</option>
                    <option value="paid">결제완료</option>
                    <option value="cancelled">취소</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-[var(--border)] flex justify-center gap-2">
              <button onClick={handleSearch} className="px-6 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] font-medium">조회</button>
              <button onClick={handleReset} className="px-6 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">초기화</button>
            </div>
          </div>

          <div className="card">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
              <h3 className="font-bold">부대비용 목록 ({filteredList.length}건)</h3>
              {selectedIds.size > 0 && <span className="text-sm text-blue-600">{selectedIds.size}건 선택됨</span>}
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-12"><input type="checkbox" checked={filteredList.length > 0 && selectedIds.size === filteredList.length} onChange={handleSelectAll} /></th>
                    <th>결제번호</th>
                    <th>등록일자</th>
                    <th>B/L No</th>
                    <th>고객사</th>
                    <th>비용유형</th>
                    <th>내역</th>
                    <th className="text-center">금액</th>
                    <th>결제방법</th>
                    <th className="text-center">결제기한</th>
                    <th className="text-center">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.length === 0 ? (
                    <tr><td colSpan={11} className="text-center py-8 text-[var(--muted)]">조회된 데이터가 없습니다.</td></tr>
                  ) : (
                    filteredList.map((row) => (
                      <tr key={row.id} className={`cursor-pointer ${selectedIds.has(row.id) ? 'selected' : ''}`} onClick={() => handleRowSelect(row.id)}>
                        <td className="text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => handleRowSelect(row.id)} /></td>
                        <td className="text-[#6e5fc9] font-medium">{row.paymentNo}</td>
                        <td>{row.paymentDate}</td>
                        <td>{row.blNo}</td>
                        <td>{row.customerName}</td>
                        <td className="font-medium">{row.costType}</td>
                        <td>{row.description}</td>
                        <td className="text-center font-semibold">{formatCurrency(row.amount, row.currency)}</td>
                        <td>{row.paymentMethod}</td>
                        <td className="text-center">{row.dueDate}</td>
                        <td className="text-center">
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
