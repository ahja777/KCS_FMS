'use client';

import { useRouter } from 'next/navigation';

import { useState, useRef } from 'react';
import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import DateRangeButtons, { getToday } from '@/components/DateRangeButtons';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';

interface AirArrivalData {
  id: number;
  awbNo: string;
  flightNo: string;
  airline: string;
  eta: string;
  ata: string;
  origin: string;
  destination: string;
  shipper: string;
  consignee: string;
  pieces: number;
  grossWeight: number;
  commodity: string;
  cargoStatus: string;
  customsStatus: string;
  arrivalNotice: boolean;
  releaseOrder: boolean;
}

const cargoStatusConfig: Record<string, { label: string; color: string }> = {
  IN_TRANSIT: { label: '비행중', color: 'bg-blue-500' },
  ARRIVED: { label: '도착', color: 'bg-purple-500' },
  UNLOADED: { label: '하기완료', color: 'bg-cyan-500' },
  IN_BONDED: { label: '보세창고', color: 'bg-yellow-500' },
  RELEASED: { label: '반출', color: 'bg-green-500' },
  DELIVERED: { label: '배송완료', color: 'bg-gray-500' },
};

const customsStatusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: '대기', color: 'bg-gray-500' },
  DECLARED: { label: '신고', color: 'bg-blue-500' },
  INSPECTING: { label: '검사', color: 'bg-yellow-500' },
  CLEARED: { label: '통관완료', color: 'bg-green-500' },
};

const mockData: AirArrivalData[] = [
  { id: 1, awbNo: '180-98765432', flightNo: 'KE001', airline: 'KE', eta: '2026-01-25', ata: '2026-01-25', origin: 'LAX', destination: 'ICN', shipper: '애플코리아', consignee: 'LG전자', pieces: 200, grossWeight: 8000, commodity: 'Electronics', cargoStatus: 'UNLOADED', customsStatus: 'DECLARED', arrivalNotice: true, releaseOrder: false },
  { id: 2, awbNo: '988-11223344', flightNo: 'OZ202', airline: 'OZ', eta: '2026-01-26', ata: '', origin: 'NRT', destination: 'ICN', shipper: 'Sony Japan', consignee: '삼성전자', pieces: 50, grossWeight: 2500, commodity: 'Components', cargoStatus: 'IN_TRANSIT', customsStatus: 'PENDING', arrivalNotice: false, releaseOrder: false },
  { id: 3, awbNo: '160-55667788', flightNo: 'CX415', airline: 'CX', eta: '2026-01-24', ata: '2026-01-24', origin: 'HKG', destination: 'ICN', shipper: 'HK Trading', consignee: '현대자동차', pieces: 80, grossWeight: 3200, commodity: 'Auto Parts', cargoStatus: 'IN_BONDED', customsStatus: 'CLEARED', arrivalNotice: true, releaseOrder: true },
  { id: 4, awbNo: '131-44556677', flightNo: 'NH872', airline: 'NH', eta: '2026-01-27', ata: '', origin: 'TYO', destination: 'ICN', shipper: 'Japan Electronics', consignee: 'SK하이닉스', pieces: 120, grossWeight: 4800, commodity: 'Semiconductors', cargoStatus: 'IN_TRANSIT', customsStatus: 'PENDING', arrivalNotice: false, releaseOrder: false },
];

export default function AirArrivalPage() {
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const today = getToday();
  const [filters, setFilters] = useState({
    startDate: today,
    endDate: today,
    awbNo: '',
    flightNo: '',
    consignee: '',
    cargoStatus: '',
    customsStatus: '',
  });
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [data] = useState<AirArrivalData[]>(mockData);

  const handleDateRangeSelect = (startDate: string, endDate: string) => {
    setFilters(prev => ({ ...prev, startDate, endDate }));
  };

  const handleSearch = () => setAppliedFilters(filters);
  const handleReset = () => {
    const resetFilters = { startDate: today, endDate: today, awbNo: '', flightNo: '', consignee: '', cargoStatus: '', customsStatus: '' };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
  };

  const filteredData = data.filter(item => {
    if (appliedFilters.awbNo && !item.awbNo.includes(appliedFilters.awbNo)) return false;
    if (appliedFilters.flightNo && !item.flightNo.toLowerCase().includes(appliedFilters.flightNo.toLowerCase())) return false;
    if (appliedFilters.consignee && !item.consignee.includes(appliedFilters.consignee)) return false;
    if (appliedFilters.cargoStatus && item.cargoStatus !== appliedFilters.cargoStatus) return false;
    if (appliedFilters.customsStatus && item.customsStatus !== appliedFilters.customsStatus) return false;
    return true;
  });

  const summaryStats = {
    total: filteredData.length,
    inTransit: filteredData.filter(d => d.cargoStatus === 'IN_TRANSIT').length,
    arrived: filteredData.filter(d => ['ARRIVED', 'UNLOADED', 'IN_BONDED'].includes(d.cargoStatus)).length,
    pendingAN: filteredData.filter(d => !d.arrivalNotice).length,
    pendingRO: filteredData.filter(d => !d.releaseOrder && d.customsStatus === 'CLEARED').length,
  };

  const handleCloseClick = () => {
    setShowCloseModal(true);
  };

  const handleConfirmClose = () => {
    setShowCloseModal(false);
    router.back();
  };


  return (
        <PageLayout title="AWB 도착관리 (항공)" subtitle="Logis > AWB 관리 > AWB 도착관리 (항공)" showCloseButton={false} >
        <main ref={formRef} className="p-6">
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
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ETA 기간</label>
                  <div className="flex gap-2 items-center flex-nowrap">
                    <input type="date" value={filters.startDate} onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))} className="w-[130px] h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg flex-shrink-0 text-sm" />
                    <span className="text-[var(--muted)] flex-shrink-0">~</span>
                    <input type="date" value={filters.endDate} onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))} className="w-[130px] h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg flex-shrink-0 text-sm" />
                    <DateRangeButtons onRangeSelect={handleDateRangeSelect} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">AWB No.</label>
                  <input type="text" value={filters.awbNo} onChange={e => setFilters(prev => ({ ...prev, awbNo: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="180-12345678" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">편명</label>
                  <input type="text" value={filters.flightNo} onChange={e => setFilters(prev => ({ ...prev, flightNo: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="KE001" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">수하인</label>
                  <input type="text" value={filters.consignee} onChange={e => setFilters(prev => ({ ...prev, consignee: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="수하인명" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">화물 상태</label>
                  <select value={filters.cargoStatus} onChange={e => setFilters(prev => ({ ...prev, cargoStatus: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm">
                    <option value="">전체</option>
                    <option value="IN_TRANSIT">비행중</option>
                    <option value="ARRIVED">도착</option>
                    <option value="UNLOADED">하기완료</option>
                    <option value="IN_BONDED">보세창고</option>
                    <option value="RELEASED">반출</option>
                    <option value="DELIVERED">배송완료</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">통관 상태</label>
                  <select value={filters.customsStatus} onChange={e => setFilters(prev => ({ ...prev, customsStatus: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm">
                    <option value="">전체</option>
                    <option value="PENDING">대기</option>
                    <option value="DECLARED">신고</option>
                    <option value="INSPECTING">검사</option>
                    <option value="CLEARED">통관완료</option>
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
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-blue-500">{summaryStats.inTransit}</div><div className="text-sm text-[var(--muted)]">비행중</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-green-500">{summaryStats.arrived}</div><div className="text-sm text-[var(--muted)]">도착</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-yellow-500">{summaryStats.pendingAN}</div><div className="text-sm text-[var(--muted)]">A/N 미발송</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-purple-500">{summaryStats.pendingRO}</div><div className="text-sm text-[var(--muted)]">R/O 미발급</div></div>
          </div>

          <div className="card overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th className="text-center">AWB No.</th>
                  <th className="text-center">편명</th>
                  <th className="text-center">ETA</th>
                  <th className="text-center">ATA</th>
                  <th className="text-center">구간</th>
                  <th className="text-center">수하인</th>
                  <th className="text-center">PCS</th>
                  <th className="text-center">G/W</th>
                  <th className="text-center">화물상태</th>
                  <th className="text-center">통관상태</th>
                  <th className="text-center">A/N</th>
                  <th className="text-center">R/O</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredData.map(item => (
                  <tr key={item.id} className="hover:bg-[var(--surface-50)] cursor-pointer">
                    <td className="px-4 py-3 text-center"><Link href={`/logis/import-bl/air/${item.id}`} className="text-blue-400 hover:underline">{item.awbNo}</Link></td>
                    <td className="px-4 py-3 text-sm text-center">{item.flightNo}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.eta}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.ata || '-'}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.origin} → {item.destination}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.consignee}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.pieces}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.grossWeight.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center"><span className={`px-2 py-1 text-xs rounded-full text-white ${cargoStatusConfig[item.cargoStatus].color}`}>{cargoStatusConfig[item.cargoStatus].label}</span></td>
                    <td className="px-4 py-3 text-center"><span className={`px-2 py-1 text-xs rounded-full text-white ${customsStatusConfig[item.customsStatus].color}`}>{customsStatusConfig[item.customsStatus].label}</span></td>
                    <td className="px-4 py-3 text-center">{item.arrivalNotice ? <span className="text-green-500">✓</span> : <button className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">발송</button>}</td>
                    <td className="px-4 py-3 text-center">{item.releaseOrder ? <span className="text-green-500">✓</span> : (item.customsStatus === 'CLEARED' ? <button className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">발급</button> : <span className="text-[var(--muted)]">-</span>)}</td>
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
