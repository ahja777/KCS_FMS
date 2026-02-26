'use client';

import { useRouter } from 'next/navigation';

import { useState, useRef } from 'react';
import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import DateRangeButtons, { getToday } from '@/components/DateRangeButtons';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';

interface ContainerShareData {
  id: number;
  shareNo: string;
  containerNo: string;
  containerType: string;
  sealNo: string;
  masterBlNo: string;
  pol: string;
  pod: string;
  etd: string;
  vessel: string;
  voyage: string;
  totalWeight: number;
  totalVolume: number;
  usedWeight: number;
  usedVolume: number;
  hblCount: number;
  status: string;
}

interface HBLItem {
  hblNo: string;
  shipper: string;
  packages: number;
  weight: number;
  volume: number;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  OPEN: { label: '오픈', color: 'bg-green-500' },
  PARTIAL: { label: '일부적입', color: 'bg-blue-500' },
  FULL: { label: '만적', color: 'bg-purple-500' },
  CLOSED: { label: '마감', color: 'bg-gray-500' },
};

const mockData: ContainerShareData[] = [
  { id: 1, shareNo: 'CS-2026-0001', containerNo: 'HDMU1234567', containerType: '40HC', sealNo: 'SL001234', masterBlNo: 'MBL-2026-0001', pol: 'KRPUS', pod: 'USLAX', etd: '2026-01-25', vessel: 'HMM GDANSK', voyage: '001E', totalWeight: 26000, totalVolume: 67, usedWeight: 18500, usedVolume: 48, hblCount: 4, status: 'PARTIAL' },
  { id: 2, shareNo: 'CS-2026-0002', containerNo: 'MAEU5678901', containerType: '20GP', sealNo: '', masterBlNo: 'MBL-2026-0002', pol: 'KRINC', pod: 'DEHAM', etd: '2026-01-26', vessel: 'MAERSK SEOUL', voyage: '025W', totalWeight: 18000, totalVolume: 33, usedWeight: 0, usedVolume: 0, hblCount: 0, status: 'OPEN' },
  { id: 3, shareNo: 'CS-2026-0003', containerNo: 'MSCU2345678', containerType: '40HC', sealNo: 'SL002345', masterBlNo: 'MBL-2026-0003', pol: 'KRPUS', pod: 'NLRTM', etd: '2026-01-24', vessel: 'MSC EMMA', voyage: '102E', totalWeight: 26000, totalVolume: 67, usedWeight: 26000, usedVolume: 65, hblCount: 6, status: 'FULL' },
];

const mockHBLs: HBLItem[] = [
  { hblNo: 'HBL-2026-0001', shipper: '삼성전자', packages: 100, weight: 5000, volume: 12 },
  { hblNo: 'HBL-2026-0002', shipper: 'LG전자', packages: 80, weight: 4500, volume: 11 },
  { hblNo: 'HBL-2026-0003', shipper: '현대자동차', packages: 150, weight: 6000, volume: 15 },
  { hblNo: 'HBL-2026-0004', shipper: 'SK하이닉스', packages: 50, weight: 3000, volume: 10 },
];

export default function ContainerSharePage() {
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const today = getToday();
  const [filters, setFilters] = useState({
    startDate: today,
    endDate: today,
    shareNo: '',
    containerNo: '',
    pol: '',
    pod: '',
    status: '',
  });
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [data] = useState<ContainerShareData[]>(mockData);
  const [selectedShare, setSelectedShare] = useState<ContainerShareData | null>(null);
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
    const resetFilters = { startDate: today, endDate: today, shareNo: '', containerNo: '', pol: '', pod: '', status: '' };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
  };

  const filteredData = data.filter(item => {
    if (appliedFilters.shareNo && !item.shareNo.includes(appliedFilters.shareNo)) return false;
    if (appliedFilters.containerNo && !item.containerNo.includes(appliedFilters.containerNo)) return false;
    if (appliedFilters.pol && !item.pol.includes(appliedFilters.pol)) return false;
    if (appliedFilters.pod && !item.pod.includes(appliedFilters.pod)) return false;
    if (appliedFilters.status && item.status !== appliedFilters.status) return false;
    return true;
  });

  const summaryStats = {
    total: filteredData.length,
    open: filteredData.filter(d => d.status === 'OPEN').length,
    partial: filteredData.filter(d => d.status === 'PARTIAL').length,
    full: filteredData.filter(d => d.status === 'FULL').length,
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
        <PageLayout title="컨테이너공유관리 (콘솔)" subtitle="Logis > 견적/부킹관리 > 컨테이너공유관리" showCloseButton={false} >
        <main ref={formRef} className="p-6">
          <div className="flex justify-between items-center mb-6">
            <button onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium" disabled={selectedRows.length === 0}>삭제</button>
            <Link href="/logis/container/share/register" className="px-6 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">
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
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ETD 기간</label>
                  <div className="flex gap-2 items-center flex-nowrap">
                    <input type="date" value={filters.startDate} onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))} className="w-[130px] h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg flex-shrink-0 text-sm" />
                    <span className="text-[var(--muted)] flex-shrink-0">~</span>
                    <input type="date" value={filters.endDate} onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))} className="w-[130px] h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg flex-shrink-0 text-sm" />
                    <DateRangeButtons onRangeSelect={handleDateRangeSelect} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">컨테이너 번호</label>
                  <input type="text" value={filters.containerNo} onChange={e => setFilters(prev => ({ ...prev, containerNo: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="HDMU1234567" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">구간</label>
                  <div className="flex gap-2">
                    <input type="text" value={filters.pol} onChange={e => setFilters(prev => ({ ...prev, pol: e.target.value }))} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="POL" />
                    <input type="text" value={filters.pod} onChange={e => setFilters(prev => ({ ...prev, pod: e.target.value }))} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="POD" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">상태</label>
                  <select value={filters.status} onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm">
                    <option value="">전체</option>
                    <option value="OPEN">오픈</option>
                    <option value="PARTIAL">일부적입</option>
                    <option value="FULL">만적</option>
                    <option value="CLOSED">마감</option>
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
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-green-500">{summaryStats.open}</div><div className="text-sm text-[var(--muted)]">오픈</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-blue-500">{summaryStats.partial}</div><div className="text-sm text-[var(--muted)]">일부적입</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-purple-500">{summaryStats.full}</div><div className="text-sm text-[var(--muted)]">만적</div></div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 card overflow-hidden">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-12"><input type="checkbox" checked={selectedRows.length === filteredData.length && filteredData.length > 0} onChange={e => handleSelectAll(e.target.checked)} className="rounded" /></th>
                    <th className="w-14">No</th>
                    <th className="text-center">공유번호</th>
                    <th className="text-center">컨테이너</th>
                    <th className="text-center">구간</th>
                    <th className="text-center">ETD</th>
                    <th className="text-center">선명/항차</th>
                    <th className="text-center">적입현황</th>
                    <th className="text-center">HBL</th>
                    <th className="text-center">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredData.map((item, index) => (
                    <tr key={item.id} className={`hover:bg-[var(--surface-50)] cursor-pointer ${selectedShare?.id === item.id ? 'bg-[var(--surface-100)]' : ''}`} onClick={() => setSelectedShare(item)}>
                      <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}><input type="checkbox" checked={selectedRows.includes(item.id)} onChange={e => handleSelectRow(item.id, e.target.checked)} className="rounded" /></td>
                      <td className="px-4 py-3 text-center text-sm">{index + 1}</td>
                      <td className="px-4 py-3 text-center"><Link href={`/logis/container/share/${item.id}`} className="text-blue-400 hover:underline">{item.shareNo}</Link></td>
                      <td className="px-4 py-3 text-sm text-center">{item.containerNo} ({item.containerType})</td>
                      <td className="px-4 py-3 text-sm text-center">{item.pol} → {item.pod}</td>
                      <td className="px-4 py-3 text-sm text-center">{item.etd}</td>
                      <td className="px-4 py-3 text-sm text-center">{item.vessel} / {item.voyage}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="flex-1 max-w-[100px] h-2 bg-[var(--surface-100)] rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${(item.usedWeight / item.totalWeight) * 100}%` }} />
                          </div>
                          <span className="text-xs">{Math.round((item.usedWeight / item.totalWeight) * 100)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">{item.hblCount}</td>
                      <td className="px-4 py-3 text-center"><span className={`px-2 py-1 text-xs rounded-full text-white ${statusConfig[item.status]?.color}`}>{statusConfig[item.status]?.label}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">H B/L 목록</h3>
              {selectedShare ? (
                <>
                  <div className="mb-4 p-3 bg-[var(--surface-50)] rounded-lg">
                    <div className="text-sm text-[var(--muted)]">{selectedShare.containerNo}</div>
                    <div className="font-medium">{selectedShare.pol} → {selectedShare.pod}</div>
                    <div className="text-sm">적입: {selectedShare.usedWeight.toLocaleString()} / {selectedShare.totalWeight.toLocaleString()} KG</div>
                  </div>
                  <div className="space-y-3">
                    {mockHBLs.slice(0, selectedShare.hblCount).map(hbl => (
                      <div key={hbl.hblNo} className="p-3 bg-[var(--surface-50)] rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-blue-400">{hbl.hblNo}</div>
                            <div className="text-sm text-[var(--muted)]">{hbl.shipper}</div>
                          </div>
                          <div className="text-right text-sm">
                            <div>{hbl.packages} PKG</div>
                            <div>{hbl.weight.toLocaleString()} KG</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">H B/L 추가</button>
                </>
              ) : (
                <div className="text-center text-[var(--muted)] py-8">컨테이너를 선택하세요</div>
              )}
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
