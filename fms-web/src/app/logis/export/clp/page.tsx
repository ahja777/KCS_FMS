'use client';

import { useRouter } from 'next/navigation';

import { useState, useRef } from 'react';
import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import DateRangeButtons, { getToday } from '@/components/DateRangeButtons';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';

interface CLPData {
  id: number;
  clpNo: string;
  bookingNo: string;
  blNo: string;
  containerNo: string;
  containerType: string;
  sealNo: string;
  shipper: string;
  consignee: string;
  pol: string;
  pod: string;
  packages: number;
  grossWeight: number;
  volume: number;
  commodity: string;
  createdDate: string;
  status: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '작성중', color: 'bg-gray-500' },
  CONFIRMED: { label: '확정', color: 'bg-blue-500' },
  SUBMITTED: { label: '제출', color: 'bg-green-500' },
  REJECTED: { label: '반려', color: 'bg-red-500' },
};

const mockData: CLPData[] = [
  { id: 1, clpNo: 'CLP-2026-0001', bookingNo: 'BK-2026-0001', blNo: 'HDMU1234567', containerNo: 'HDMU1234567', containerType: '40HC', sealNo: 'SL001234', shipper: '삼성전자', consignee: 'Samsung America', pol: 'KRPUS', pod: 'USLAX', packages: 500, grossWeight: 12000, volume: 65.5, commodity: '전자제품', createdDate: '2026-01-20', status: 'SUBMITTED' },
  { id: 2, clpNo: 'CLP-2026-0002', bookingNo: 'BK-2026-0002', blNo: 'MAEU5678901', containerNo: 'MAEU5678901', containerType: '20GP', sealNo: 'SL002345', shipper: 'LG전자', consignee: 'LG Electronics USA', pol: 'KRINC', pod: 'DEHAM', packages: 200, grossWeight: 8000, volume: 45.2, commodity: '가전제품', createdDate: '2026-01-21', status: 'CONFIRMED' },
  { id: 3, clpNo: 'CLP-2026-0003', bookingNo: 'BK-2026-0003', blNo: '', containerNo: 'MSCU2345678', containerType: '40HC', sealNo: '', shipper: '현대자동차', consignee: 'Hyundai Motor Germany', pol: 'KRPUS', pod: 'NLRTM', packages: 800, grossWeight: 18000, volume: 72.0, commodity: '자동차부품', createdDate: '2026-01-22', status: 'DRAFT' },
];

export default function CLPPage() {
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const today = getToday();
  const [filters, setFilters] = useState({
    startDate: today,
    endDate: today,
    clpNo: '',
    bookingNo: '',
    containerNo: '',
    status: '',
  });
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [data] = useState<CLPData[]>(mockData);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const handleSelectAll = (checked: boolean) => { setSelectedRows(checked ? filteredData.map(d => d.id) : []); };
  const handleSelectRow = (id: number, checked: boolean) => { setSelectedRows(prev => checked ? [...prev, id] : prev.filter(r => r !== id)); };

  const handleDelete = async () => {
    if (selectedRows.length === 0) { alert('삭제할 항목을 선택하세요.'); return; }
    if (!confirm(`${selectedRows.length}건을 삭제하시겠습니까?`)) return;
    alert('삭제되었습니다. (샘플)');
    setSelectedRows([]);
  };

  const handleDateRangeSelect = (startDate: string, endDate: string) => {
    setFilters(prev => ({ ...prev, startDate, endDate }));
  };

  const handleSearch = () => setAppliedFilters(filters);
  const handleReset = () => {
    const resetFilters = { startDate: today, endDate: today, clpNo: '', bookingNo: '', containerNo: '', status: '' };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
  };

  const filteredData = data.filter(item => {
    if (appliedFilters.clpNo && !item.clpNo.includes(appliedFilters.clpNo)) return false;
    if (appliedFilters.bookingNo && !item.bookingNo.includes(appliedFilters.bookingNo)) return false;
    if (appliedFilters.containerNo && !item.containerNo.includes(appliedFilters.containerNo)) return false;
    if (appliedFilters.status && item.status !== appliedFilters.status) return false;
    return true;
  });

  const summaryStats = {
    total: filteredData.length,
    draft: filteredData.filter(d => d.status === 'DRAFT').length,
    confirmed: filteredData.filter(d => d.status === 'CONFIRMED').length,
    submitted: filteredData.filter(d => d.status === 'SUBMITTED').length,
  };

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

  return (
        <PageLayout title="CLP 관리" subtitle="Logis > 수출B/L관리 > CLP 관리" showCloseButton={false} >
        <main ref={formRef} className="p-6">
          <div className="flex justify-between items-center mb-6">
            <button onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium" disabled={selectedRows.length === 0}>삭제</button>
            <Link href="/logis/export/clp/register" className="px-6 py-2 font-semibold rounded-lg bg-[var(--surface-100)] text-[var(--foreground)] hover:bg-[var(--surface-200)]">
              신규 등록
            </Link>
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
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">작성 일자 <span className="text-red-500">*</span></label>
                  <div className="flex items-center gap-2">
                    <input type="date" value={filters.startDate} onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))} className="flex-1 h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
                    <span className="text-[var(--muted)]">~</span>
                    <input type="date" value={filters.endDate} onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))} className="flex-1 h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
                    <DateRangeButtons onRangeSelect={handleDateRangeSelect} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">CLP 번호</label>
                  <input type="text" value={filters.clpNo} onChange={(e) => setFilters(prev => ({ ...prev, clpNo: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" placeholder="CLP-YYYY-XXXX" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">컨테이너 번호</label>
                  <input type="text" value={filters.containerNo} onChange={(e) => setFilters(prev => ({ ...prev, containerNo: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" placeholder="HDMU1234567" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">상태</label>
                  <select value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm">
                    <option value="">전체</option>
                    <option value="DRAFT">작성중</option>
                    <option value="CONFIRMED">확정</option>
                    <option value="SUBMITTED">제출</option>
                    <option value="REJECTED">반려</option>
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
            <div className="card p-4 text-center"><div className="text-2xl font-bold">{summaryStats.total}</div><div className="text-sm text-[var(--muted)]">전체</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-gray-500">{summaryStats.draft}</div><div className="text-sm text-[var(--muted)]">작성중</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-blue-500">{summaryStats.confirmed}</div><div className="text-sm text-[var(--muted)]">확정</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-green-500">{summaryStats.submitted}</div><div className="text-sm text-[var(--muted)]">제출</div></div>
          </div>

          <div className="card overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-12"><input type="checkbox" checked={selectedRows.length === filteredData.length && filteredData.length > 0} onChange={e => handleSelectAll(e.target.checked)} className="rounded" /></th>
                  <th className="w-14">No</th>
                  <th className="text-center">CLP 번호</th>
                  <th className="text-center">부킹번호</th>
                  <th className="text-center">B/L 번호</th>
                  <th className="text-center">컨테이너</th>
                  <th className="text-center">구간</th>
                  <th className="text-center">화주</th>
                  <th className="text-center">PKG</th>
                  <th className="text-center">G/W (KG)</th>
                  <th className="text-center">CBM</th>
                  <th className="text-center">작성일</th>
                  <th className="text-center">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-[var(--surface-50)] cursor-pointer">
                    <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}><input type="checkbox" checked={selectedRows.includes(item.id)} onChange={e => handleSelectRow(item.id, e.target.checked)} className="rounded" /></td>
                    <td className="px-4 py-3 text-center text-sm">{index + 1}</td>
                    <td className="px-4 py-3 text-center"><Link href={`/logis/export/clp/${item.id}`} className="text-blue-400 hover:underline">{item.clpNo}</Link></td>
                    <td className="px-4 py-3 text-sm text-center">{item.bookingNo}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.blNo || '-'}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.containerNo} ({item.containerType})</td>
                    <td className="px-4 py-3 text-sm text-center">{item.pol} → {item.pod}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.shipper}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.packages}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.grossWeight.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.volume}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.createdDate}</td>
                    <td className="px-4 py-3 text-center"><span className={`px-2 py-1 text-xs rounded-full text-white ${statusConfig[item.status]?.color}`}>{statusConfig[item.status]?.label}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
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
