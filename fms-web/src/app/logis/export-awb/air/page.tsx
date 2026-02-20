'use client';

import { useRouter } from 'next/navigation';
import { LIST_PATHS } from '@/constants/paths';
import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import DateRangeButtons, { getToday } from '@/components/DateRangeButtons';
import SearchFilterPanel, { SearchFilterGrid, SearchFilterField, DateRangeField, TextField, SelectField } from '@/components/search/SearchFilterPanel';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import SelectionAlertModal from '@/components/SelectionAlertModal';
import AWBPrintModal from '@/components/AWBPrintModal';

interface AWBData {
  mawb_id: number;
  mawb_no: string;
  flight_no: string;
  etd_dt: string;
  eta_dt: string;
  origin_airport_cd: string;
  dest_airport_cd: string;
  origin_airport_name: string;
  dest_airport_name: string;
  shipper_nm: string;
  shipper_addr?: string;
  consignee_nm: string;
  consignee_addr?: string;
  pieces: number;
  gross_weight_kg: number;
  charge_weight_kg: number;
  commodity_desc: string;
  goods_desc?: string;
  status_cd: string;
  hawb_count: number;
  carrier_name: string;
  carrier_cd?: string;
  airline_code: string;
  freight_amt?: number;
  // 추가 필드 (MAWB API에서 조회)
  volume_cbm?: number;
  dimensions?: string;
  special_handling?: string;
  declared_value?: number;
  declared_currency?: string;
  insurance_value?: number;
  freight_charges?: number;
  other_charges?: number;
  weight_charge?: number;
  valuation_charge?: number;
  tax_amt?: number;
  total_other_agent?: number;
  total_other_carrier?: number;
  rate_class?: string;
  rate?: number;
  payment_terms?: string;
  agent_code?: string;
  agent_name?: string;
  issue_dt?: string;
  issue_place?: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: '초안', color: 'bg-gray-500', bgColor: '#F3F4F6' },
  BOOKED: { label: '부킹', color: 'bg-blue-500', bgColor: '#DBEAFE' },
  ACCEPTED: { label: '수탁', color: 'bg-cyan-500', bgColor: '#CFFAFE' },
  DEPARTED: { label: '출발', color: 'bg-purple-500', bgColor: '#F3E8FF' },
  IN_TRANSIT: { label: '운송중', color: 'bg-yellow-500', bgColor: '#FEF3C7' },
  ARRIVED: { label: '도착', color: 'bg-green-500', bgColor: '#D1FAE5' },
  DELIVERED: { label: '인도완료', color: 'bg-emerald-600', bgColor: '#D1FAE5' },
  CONFIRMED: { label: '확정', color: 'bg-green-500', bgColor: '#D1FAE5' },
  CANCELLED: { label: '취소', color: 'bg-red-500', bgColor: '#FEE2E2' },
};

const getStatusConfig = (status: string) => statusConfig[status] || { label: status || '미정', color: 'bg-gray-500', bgColor: '#F3F4F6' };

// 샘플 데이터
const sampleData: AWBData[] = [
  { mawb_id: 1, mawb_no: '180-12345678', flight_no: 'KE001', etd_dt: '2026-01-25', eta_dt: '2026-01-26', origin_airport_cd: 'ICN', dest_airport_cd: 'LAX', origin_airport_name: '인천국제공항', dest_airport_name: 'Los Angeles Intl', shipper_nm: '삼성전자', consignee_nm: 'Samsung America', pieces: 100, gross_weight_kg: 2500, charge_weight_kg: 2800, commodity_desc: '전자제품', status_cd: 'BOOKED', hawb_count: 5, carrier_name: 'Korean Air', airline_code: 'KE' },
  { mawb_id: 2, mawb_no: '180-87654321', flight_no: 'KE011', etd_dt: '2026-01-26', eta_dt: '2026-01-27', origin_airport_cd: 'ICN', dest_airport_cd: 'NRT', origin_airport_name: '인천국제공항', dest_airport_name: 'Narita Intl', shipper_nm: 'LG전자', consignee_nm: 'LG Japan', pieces: 50, gross_weight_kg: 1200, charge_weight_kg: 1400, commodity_desc: '가전제품', status_cd: 'DRAFT', hawb_count: 3, carrier_name: 'Korean Air', airline_code: 'KE' },
  { mawb_id: 3, mawb_no: '988-11223344', flight_no: 'OZ101', etd_dt: '2026-01-24', eta_dt: '2026-01-25', origin_airport_cd: 'ICN', dest_airport_cd: 'FRA', origin_airport_name: '인천국제공항', dest_airport_name: 'Frankfurt Intl', shipper_nm: '현대자동차', consignee_nm: 'Hyundai Europe', pieces: 80, gross_weight_kg: 3200, charge_weight_kg: 3500, commodity_desc: '자동차부품', status_cd: 'ACCEPTED', hawb_count: 4, carrier_name: 'Asiana Airlines', airline_code: 'OZ' },
  { mawb_id: 4, mawb_no: '618-99887766', flight_no: 'KE023', etd_dt: '2026-01-23', eta_dt: '2026-01-24', origin_airport_cd: 'ICN', dest_airport_cd: 'SIN', origin_airport_name: '인천국제공항', dest_airport_name: 'Singapore Changi', shipper_nm: 'SK하이닉스', consignee_nm: 'SK Singapore', pieces: 200, gross_weight_kg: 800, charge_weight_kg: 1000, commodity_desc: '반도체', status_cd: 'DEPARTED', hawb_count: 8, carrier_name: 'Korean Air', airline_code: 'KE' },
  { mawb_id: 5, mawb_no: '180-55667788', flight_no: 'OZ201', etd_dt: '2026-01-22', eta_dt: '2026-01-23', origin_airport_cd: 'ICN', dest_airport_cd: 'PVG', origin_airport_name: '인천국제공항', dest_airport_name: 'Shanghai Pudong', shipper_nm: '포스코', consignee_nm: 'POSCO China', pieces: 150, gross_weight_kg: 4500, charge_weight_kg: 5000, commodity_desc: '철강제품', status_cd: 'ARRIVED', hawb_count: 6, carrier_name: 'Asiana Airlines', airline_code: 'OZ' },
];

export default function ExportAWBListPage() {
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const today = getToday();
  const [filters, setFilters] = useState({
    startDate: today,
    endDate: today,
    awbNo: '',
    flightNo: '',
    shipper: '',
    status: '',
  });
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [data, setData] = useState<AWBData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showSelectionAlert, setShowSelectionAlert] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printMawbId, setPrintMawbId] = useState<number | undefined>(undefined);

  // 데이터 조회
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (appliedFilters.awbNo) params.append('awb_no', appliedFilters.awbNo);
      if (appliedFilters.status) params.append('status', appliedFilters.status);

      const response = await fetch(`/api/awb/mawb?${params}`);
      const result = await response.json();
      if (Array.isArray(result) && result.length > 0) {
        setData(result);
      } else {
        // API 결과가 없으면 샘플 데이터 사용
        setData(sampleData);
      }
    } catch (error) {
      console.error('Error fetching AWB data:', error);
      // 에러 시 샘플 데이터 사용
      setData(sampleData);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDateRangeSelect = (startDate: string, endDate: string) => {
    setFilters(prev => ({ ...prev, startDate, endDate }));
  };

  const handleSearch = () => {
    setAppliedFilters(filters);
  };

  const handleReset = () => {
    const resetFilters = { startDate: today, endDate: today, awbNo: '', flightNo: '', shipper: '', status: '' };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
  };

  const filteredData = data.filter(item => {
    if (appliedFilters.flightNo && !item.flight_no?.toLowerCase().includes(appliedFilters.flightNo.toLowerCase())) return false;
    if (appliedFilters.shipper && !item.shipper_nm?.includes(appliedFilters.shipper)) return false;
    return true;
  });

  const summaryStats = {
    total: filteredData.length,
    draft: filteredData.filter(d => d.status_cd === 'DRAFT').length,
    booked: filteredData.filter(d => d.status_cd === 'BOOKED').length,
    totalWeight: filteredData.reduce((sum, d) => sum + (d.gross_weight_kg || 0), 0),
  };

  const handleCloseClick = () => {
    setShowCloseModal(true);
  };

  const handleConfirmClose = () => {
    setShowCloseModal(false);
    router.push(LIST_PATHS.DASHBOARD);
  };

  useCloseConfirm({
    showModal: showCloseModal,
    setShowModal: setShowCloseModal,
    onConfirmClose: handleConfirmClose,
  });

  // 체크박스 핸들러
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredData.map(d => d.mawb_id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelect = (id: number, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  // 출력 핸들러
  const handlePrint = () => {
    if (selectedIds.size === 0) {
      setShowSelectionAlert(true);
      return;
    }
    const firstSelectedId = Array.from(selectedIds)[0];
    setPrintMawbId(firstSelectedId);
    setShowPrintModal(true);
  };

  // 삭제 핸들러
  const handleDelete = async () => {
    if (selectedIds.size === 0) {
      setShowSelectionAlert(true);
      return;
    }
    if (!confirm(`선택한 ${selectedIds.size}건을 삭제하시겠습니까?`)) return;

    try {
      for (const id of selectedIds) {
        await fetch(`/api/awb/mawb?id=${id}`, { method: 'DELETE' });
      }
      alert('삭제가 완료되었습니다.');
      setSelectedIds(new Set());
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  return (
        <PageLayout title="AWB 관리 (항공수출)" subtitle="Logis > 항공수출 > AWB 관리" showCloseButton={false} >
        <main ref={formRef} className="p-6">
          <div className="flex justify-end items-center mb-6">
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]"
              >
                출력 ({selectedIds.size})
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]"
              >
                삭제
              </button>
              <Link href="/logis/export-awb/air/register" className="px-6 py-2 font-semibold rounded-lg bg-[var(--surface-100)] text-[var(--foreground)] hover:bg-[var(--surface-200)]">
                신규 등록
              </Link>
            </div>
          </div>

          {/* 검색조건 - SearchFilterPanel 컴포넌트 사용 */}
          <SearchFilterPanel onSearch={handleSearch} onReset={handleReset} className="mb-6">
            <SearchFilterGrid columns={6}>
              <SearchFilterField label="ETD 기간" colSpan={2}>
                <DateRangeField
                  startValue={filters.startDate}
                  endValue={filters.endDate}
                  onStartChange={(value) => setFilters(prev => ({ ...prev, startDate: value }))}
                  onEndChange={(value) => setFilters(prev => ({ ...prev, endDate: value }))}
                />
                <DateRangeButtons onRangeSelect={handleDateRangeSelect} />
              </SearchFilterField>
              <SearchFilterField label="MAWB No.">
                <TextField
                  value={filters.awbNo}
                  onChange={(value) => setFilters(prev => ({ ...prev, awbNo: value }))}
                  placeholder="180-12345678"
                />
              </SearchFilterField>
              <SearchFilterField label="편명">
                <TextField
                  value={filters.flightNo}
                  onChange={(value) => setFilters(prev => ({ ...prev, flightNo: value }))}
                  placeholder="KE001"
                />
              </SearchFilterField>
              <SearchFilterField label="화주">
                <TextField
                  value={filters.shipper}
                  onChange={(value) => setFilters(prev => ({ ...prev, shipper: value }))}
                  placeholder="화주명"
                />
              </SearchFilterField>
              <SearchFilterField label="상태">
                <SelectField
                  value={filters.status}
                  onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                  options={[
                    { value: 'DRAFT', label: '초안' },
                    { value: 'BOOKED', label: '부킹' },
                    { value: 'ACCEPTED', label: '수탁' },
                    { value: 'DEPARTED', label: '출발' },
                    { value: 'IN_TRANSIT', label: '운송중' },
                    { value: 'ARRIVED', label: '도착' },
                    { value: 'DELIVERED', label: '인도완료' },
                  ]}
                />
              </SearchFilterField>
            </SearchFilterGrid>
          </SearchFilterPanel>

          {/* 요약 통계 */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold">{summaryStats.total}</div>
              <div className="text-sm text-[var(--muted)]">전체</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-gray-500">{summaryStats.draft}</div>
              <div className="text-sm text-[var(--muted)]">초안</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-blue-500">{summaryStats.booked}</div>
              <div className="text-sm text-[var(--muted)]">부킹</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-purple-500">{summaryStats.totalWeight.toLocaleString()}</div>
              <div className="text-sm text-[var(--muted)]">총 중량 (KG)</div>
            </div>
          </div>

          {/* 테이블 */}
          <div className="card overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-12 text-center">
                    <input
                      type="checkbox"
                      checked={filteredData.length > 0 && selectedIds.size === filteredData.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded"
                    />
                  </th>
                  <th className="text-center">MAWB No.</th>
                  <th className="text-center">항공사</th>
                  <th className="text-center">편명</th>
                  <th className="text-center">ETD</th>
                  <th className="text-center">구간</th>
                  <th className="text-center">화주</th>
                  <th className="text-center">품명</th>
                  <th className="text-center">PCS</th>
                  <th className="text-center">G/W</th>
                  <th className="text-center">HAWB</th>
                  <th className="text-center">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {loading ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-8 text-center text-[var(--muted)]">
                      로딩 중...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-8 text-center text-[var(--muted)]">
                      데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredData.map(item => (
                    <tr key={item.mawb_id} className="hover:bg-[var(--surface-50)]">
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.mawb_id)}
                          onChange={(e) => handleSelect(item.mawb_id, e.target.checked)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link href={`/logis/export-awb/air/${item.mawb_id}`} className="text-blue-400 hover:underline font-medium">
                          {item.mawb_no}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">{item.carrier_name || item.airline_code}</td>
                      <td className="px-4 py-3 text-sm text-center">{item.flight_no}</td>
                      <td className="px-4 py-3 text-sm text-center">{item.etd_dt}</td>
                      <td className="px-4 py-3 text-sm text-center">{item.origin_airport_cd} → {item.dest_airport_cd}</td>
                      <td className="px-4 py-3 text-sm text-center">{item.shipper_nm}</td>
                      <td className="px-4 py-3 text-sm text-center">{item.commodity_desc}</td>
                      <td className="px-4 py-3 text-sm text-center">{item.pieces?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-center">{item.gross_weight_kg?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          {item.hawb_count || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs rounded-full text-white ${getStatusConfig(item.status_cd).color}`}>
                          {getStatusConfig(item.status_cd).label}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      <CloseConfirmModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onConfirm={handleConfirmClose}
      />

      <SelectionAlertModal
        isOpen={showSelectionAlert}
        onClose={() => setShowSelectionAlert(false)}
      />

      <AWBPrintModal
        isOpen={showPrintModal}
        onClose={() => { setShowPrintModal(false); setPrintMawbId(undefined); }}
        awbData={null}
        mawbId={printMawbId}
      />
    </PageLayout>
  );
}
