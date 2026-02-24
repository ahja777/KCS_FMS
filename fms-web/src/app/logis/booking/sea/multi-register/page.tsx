'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import ScheduleSearchModal from '@/components/ScheduleSearchModal';
import LocationCodeModal, { type LocationItem } from '@/components/popup/LocationCodeModal';
import CarrierCodeModal, { type CarrierItem } from '@/components/popup/CarrierCodeModal';

interface BookingRow {
  id: string;
  selected: boolean;
  shipperName: string;
  shipperCode: string;
  consigneeName: string;
  consigneeCode: string;
  commodity: string;
  hsCode: string;
  containerType: string;
  containerQty: number;
  grossWeight: number;
  measurement: number;
  specialRequest: string;
  remarks: string;
}

interface CommonSchedule {
  carrier: string;
  vessel: string;
  voyage: string;
  pol: string;
  pod: string;
  finalDest: string;
  etd: string;
  eta: string;
  closingDate: string;
  freightTerms: string;
  paymentTerms: string;
}

const createEmptyRow = (): BookingRow => ({
  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  selected: false,
  shipperName: '',
  shipperCode: '',
  consigneeName: '',
  consigneeCode: '',
  commodity: '',
  hsCode: '',
  containerType: '40HC',
  containerQty: 1,
  grossWeight: 0,
  measurement: 0,
  specialRequest: '',
  remarks: '',
});

const initialSchedule: CommonSchedule = {
  carrier: '',
  vessel: '',
  voyage: '',
  pol: 'KRPUS',
  pod: '',
  finalDest: '',
  etd: '',
  eta: '',
  closingDate: '',
  freightTerms: 'CY-CY',
  paymentTerms: 'PREPAID',
};

export default function MultiBookingSeaRegisterPage() {
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

  const [schedule, setSchedule] = useState<CommonSchedule>(initialSchedule);
  const [bookingRows, setBookingRows] = useState<BookingRow[]>([
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
  ]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCarrierModal, setShowCarrierModal] = useState(false);
  const [currentLocationField, setCurrentLocationField] = useState<string>('pol');
  const [isSaving, setIsSaving] = useState(false);

  const handleLocationSearch = (field: string) => {
    setCurrentLocationField(field);
    setShowLocationModal(true);
  };

  const handleLocationSelect = (item: LocationItem) => {
    handleScheduleChange(currentLocationField as keyof CommonSchedule, item.code);
    setShowLocationModal(false);
  };

  const handleCarrierSelect = (item: CarrierItem) => {
    handleScheduleChange('carrier', item.nameEn || item.code);
    setShowCarrierModal(false);
  };

  const handleScheduleChange = (field: keyof CommonSchedule, value: string) => {
    setSchedule(prev => ({ ...prev, [field]: value }));
  };

  const handleScheduleSelect = (selectedSchedule: any) => {
    setSchedule({
      carrier: selectedSchedule.carrier,
      vessel: selectedSchedule.vesselName || selectedSchedule.vessel,
      voyage: selectedSchedule.voyage || selectedSchedule.vesselVoyage,
      pol: selectedSchedule.pol,
      pod: selectedSchedule.pod,
      finalDest: selectedSchedule.finalDest || '',
      etd: selectedSchedule.etd,
      eta: selectedSchedule.eta,
      closingDate: selectedSchedule.closingDate || '',
      freightTerms: schedule.freightTerms,
      paymentTerms: schedule.paymentTerms,
    });
    setShowScheduleModal(false);
  };

  const handleRowChange = useCallback((index: number, field: keyof BookingRow, value: string | number | boolean) => {
    setBookingRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const addRows = (count: number = 5) => {
    const newRows = Array(count).fill(null).map(() => createEmptyRow());
    setBookingRows(prev => [...prev, ...newRows]);
  };

  const removeSelectedRows = () => {
    const selectedCount = bookingRows.filter(r => r.selected).length;
    if (selectedCount === 0) {
      alert('삭제할 행을 선택해주세요.');
      return;
    }
    if (confirm(`선택한 ${selectedCount}건을 삭제하시겠습니까?`)) {
      setBookingRows(prev => {
        const remaining = prev.filter(r => !r.selected);
        return remaining.length > 0 ? remaining : [createEmptyRow()];
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setBookingRows(prev => prev.map(row => ({ ...row, selected: checked })));
  };

  const copyFromAbove = () => {
    setBookingRows(prev => {
      const updated = [...prev];
      for (let i = 1; i < updated.length; i++) {
        if (updated[i].selected && i > 0) {
          const above = updated[i - 1];
          updated[i] = {
            ...updated[i],
            shipperName: above.shipperName,
            shipperCode: above.shipperCode,
            consigneeName: above.consigneeName,
            consigneeCode: above.consigneeCode,
            commodity: above.commodity,
            hsCode: above.hsCode,
            containerType: above.containerType,
          };
        }
      }
      return updated;
    });
  };

  const getTotals = () => {
    return bookingRows.reduce((acc, row) => ({
      containers: acc.containers + (row.containerQty || 0),
      grossWeight: acc.grossWeight + (row.grossWeight || 0),
      measurement: acc.measurement + (row.measurement || 0),
    }), { containers: 0, grossWeight: 0, measurement: 0 });
  };

  const getValidRowsCount = () => {
    return bookingRows.filter(r => r.shipperName && r.consigneeName && r.containerQty > 0).length;
  };

  const handleSave = async () => {
    if (!schedule.carrier || !schedule.vessel) {
      alert('스케줄 정보를 선택해주세요.');
      return;
    }

    const validRows = bookingRows.filter(r => r.shipperName && r.consigneeName && r.containerQty > 0);
    if (validRows.length === 0) {
      alert('최소 1건 이상의 부킹 정보를 입력해주세요.');
      return;
    }

    setIsSaving(true);

    try {
      const bookings = validRows.map((row, index) => ({
        bookingNo: `SB-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}-${String(index + 1).padStart(2, '0')}`,
        bookingDate: new Date().toISOString().split('T')[0],
        ...schedule,
        shipper: row.shipperName,
        consignee: row.consigneeName,
        commodity: row.commodity,
        containerType: row.containerType,
        containerQty: row.containerQty,
        grossWeight: row.grossWeight,
        measurement: row.measurement,
        status: 'draft',
        createdAt: new Date().toISOString(),
      }));

      const existingBookings = JSON.parse(localStorage.getItem('seaBookings') || '[]');
      localStorage.setItem('seaBookings', JSON.stringify([...existingBookings, ...bookings]));

      alert(`${validRows.length}건의 부킹이 저장되었습니다.`);
      router.push('/logis/booking/sea');
    } catch (error) {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoList = () => {
    if (confirm('작성 중인 내용이 저장되지 않습니다. 목록으로 이동하시겠습니까?')) {
      router.push('/logis/booking/sea');
    }
  };

  const totals = getTotals();
  const validCount = getValidRowsCount();
  const selectedCount = bookingRows.filter(r => r.selected).length;

  return (
        <PageLayout title="멀티부킹 등록 (해상)" subtitle="견적/부킹관리  선적부킹관리 (해상) > 멀티예약" onClose={handleCloseClick} >
        <main className="p-6">
          {/* 상단 버튼 */}
          <div className="flex justify-end items-center mb-6">
            <div className="flex gap-2">
              <button
                onClick={handleGoList}
                className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)] flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                목록
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || validCount === 0}
                className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {isSaving ? '저장중...' : `멀티부킹 저장 (${validCount}건)`}
              </button>
            </div>
          </div>

          {/* 공통 스케줄 정보 */}
          <div className="card mb-6">
            <div className="section-header flex justify-between items-center">
              <h3 className="font-bold text-white">공통 스케줄 정보</h3>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="px-3 py-1 bg-white/20 text-white text-sm rounded hover:bg-white/30"
              >
                스케줄 검색
              </button>
            </div>
            <div className="p-4 grid grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">선사 <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={schedule.carrier}
                    onChange={(e) => handleScheduleChange('carrier', e.target.value)}
                    className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="선사"
                  />
                  <button
                    onClick={() => setShowCarrierModal(true)}
                    className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] text-sm"
                  >
                    찾기
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">선명 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={schedule.vessel}
                  onChange={(e) => handleScheduleChange('vessel', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="선박명"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">항차</label>
                <input
                  type="text"
                  value={schedule.voyage}
                  onChange={(e) => handleScheduleChange('voyage', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="001E"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">선적항 (POL)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={schedule.pol}
                    onChange={(e) => handleScheduleChange('pol', e.target.value)}
                    className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="KRPUS"
                  />
                  <button
                    onClick={() => handleLocationSearch('pol')}
                    className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] text-sm"
                  >
                    찾기
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">양하항 (POD)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={schedule.pod}
                    onChange={(e) => handleScheduleChange('pod', e.target.value)}
                    className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="USLAX"
                  />
                  <button
                    onClick={() => handleLocationSearch('pod')}
                    className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] text-sm"
                  >
                    찾기
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">최종목적지</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={schedule.finalDest}
                    onChange={(e) => handleScheduleChange('finalDest', e.target.value)}
                    className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="Los Angeles"
                  />
                  <button
                    onClick={() => handleLocationSearch('finalDest')}
                    className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] text-sm"
                  >
                    찾기
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ETD</label>
                <input
                  type="date"
                  value={schedule.etd}
                  onChange={(e) => handleScheduleChange('etd', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ETA</label>
                <input
                  type="date"
                  value={schedule.eta}
                  onChange={(e) => handleScheduleChange('eta', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">서류마감</label>
                <input
                  type="date"
                  value={schedule.closingDate}
                  onChange={(e) => handleScheduleChange('closingDate', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Freight Terms</label>
                <select
                  value={schedule.freightTerms}
                  onChange={(e) => handleScheduleChange('freightTerms', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                >
                  <option value="CY-CY">CY-CY</option>
                  <option value="CY-DOOR">CY-DOOR</option>
                  <option value="DOOR-CY">DOOR-CY</option>
                  <option value="DOOR-DOOR">DOOR-DOOR</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment</label>
                <select
                  value={schedule.paymentTerms}
                  onChange={(e) => handleScheduleChange('paymentTerms', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                >
                  <option value="PREPAID">Prepaid</option>
                  <option value="COLLECT">Collect</option>
                </select>
              </div>
            </div>
          </div>

          {/* 부킹 목록 */}
          <div className="card mb-6">
            <div className="section-header flex justify-between items-center">
              <h3 className="font-bold text-white">부킹 목록</h3>
              <div className="flex gap-2">
                <button
                  onClick={copyFromAbove}
                  disabled={selectedCount === 0}
                  className="px-3 py-1 bg-white/20 text-white text-sm rounded hover:bg-white/30 disabled:opacity-50"
                >
                  위 행 복사
                </button>
                <button
                  onClick={removeSelectedRows}
                  disabled={selectedCount === 0}
                  className="px-3 py-1 bg-red-500/80 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50"
                >
                  선택 삭제
                </button>
                <button
                  onClick={() => addRows(5)}
                  className="px-3 py-1 bg-white/20 text-white text-sm rounded hover:bg-white/30"
                >
                  + 5행 추가
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--surface-100)]">
                  <tr>
                    <th className="w-10 p-2">
                      <input
                        type="checkbox"
                        checked={bookingRows.length > 0 && bookingRows.every(r => r.selected)}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th className="p-2 text-center w-8">No</th>
                    <th className="p-2 text-center min-w-[120px]">화주 (Shipper) <span className="text-red-500">*</span></th>
                    <th className="p-2 text-center min-w-[120px]">수하인 (Consignee) <span className="text-red-500">*</span></th>
                    <th className="p-2 text-center min-w-[100px]">품명</th>
                    <th className="p-2 text-center w-24">HS Code</th>
                    <th className="p-2 text-center w-24">컨테이너</th>
                    <th className="p-2 text-center w-16">수량 <span className="text-red-500">*</span></th>
                    <th className="p-2 text-center w-24">G.W (kg)</th>
                    <th className="p-2 text-center w-20">CBM</th>
                    <th className="p-2 text-center min-w-[80px]">특수요청</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingRows.map((row, index) => (
                    <tr key={row.id} className={`border-t border-[var(--border)] ${row.selected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                      <td className="p-1 text-center">
                        <input
                          type="checkbox"
                          checked={row.selected}
                          onChange={(e) => handleRowChange(index, 'selected', e.target.checked)}
                        />
                      </td>
                      <td className="p-1 text-center text-[var(--muted)]">{index + 1}</td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={row.shipperName}
                          onChange={(e) => handleRowChange(index, 'shipperName', e.target.value)}
                          className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                          placeholder="화주명"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={row.consigneeName}
                          onChange={(e) => handleRowChange(index, 'consigneeName', e.target.value)}
                          className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                          placeholder="수하인명"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={row.commodity}
                          onChange={(e) => handleRowChange(index, 'commodity', e.target.value)}
                          className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                          placeholder="품명"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={row.hsCode}
                          onChange={(e) => handleRowChange(index, 'hsCode', e.target.value)}
                          className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                          placeholder="0000.00"
                        />
                      </td>
                      <td className="p-1">
                        <select
                          value={row.containerType}
                          onChange={(e) => handleRowChange(index, 'containerType', e.target.value)}
                          className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                        >
                          <option value="20GP">20GP</option>
                          <option value="40GP">40GP</option>
                          <option value="40HC">40HC</option>
                          <option value="45HC">45HC</option>
                          <option value="20RF">20RF</option>
                          <option value="40RF">40RF</option>
                        </select>
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          value={row.containerQty || ''}
                          onChange={(e) => handleRowChange(index, 'containerQty', Number(e.target.value))}
                          className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-center"
                          min="1"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          value={row.grossWeight || ''}
                          onChange={(e) => handleRowChange(index, 'grossWeight', Number(e.target.value))}
                          className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                          min="0"
                          placeholder="kg"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          value={row.measurement || ''}
                          onChange={(e) => handleRowChange(index, 'measurement', Number(e.target.value))}
                          className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                          min="0"
                          step="0.001"
                          placeholder="CBM"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={row.specialRequest}
                          onChange={(e) => handleRowChange(index, 'specialRequest', e.target.value)}
                          className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                          placeholder="DG, RF..."
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[var(--surface-100)] font-medium">
                  <tr>
                    <td colSpan={7} className="p-2 text-center">합계 ({validCount}건 유효)</td>
                    <td className="p-2 text-center">{totals.containers}</td>
                    <td className="p-2 text-center">{totals.grossWeight.toLocaleString()}</td>
                    <td className="p-2 text-center">{totals.measurement.toFixed(3)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 안내 메시지 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">멀티부킹 안내</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                  <li>동일 선박/항차에 여러 화주의 화물을 한 번에 부킹할 수 있습니다.</li>
                  <li>화주명, 수하인명, 컨테이너 수량은 필수 입력 항목입니다.</li>
                  <li>위 행 복사 기능으로 반복 입력을 줄일 수 있습니다.</li>
                  <li>저장 시 유효한 데이터만 부킹 처리됩니다.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="flex justify-center gap-3">
            <button
              onClick={handleGoList}
              className="px-6 py-3 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]"
            >
              목록
            </button>
            <button
              onClick={() => router.push('/logis/booking/sea/register')}
              className="px-6 py-3 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)]"
            >
              단건 등록으로 전환
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || validCount === 0}
              className="px-6 py-3 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? '저장중...' : `멀티부킹 저장 (${validCount}건)`}
            </button>
          </div>
        </main>
      {/* 스케줄 조회 모달 */}
      <ScheduleSearchModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSelect={handleScheduleSelect}
        type="sea"
      />

      {/* 위치 검색 모달 */}
      <LocationCodeModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelect={handleLocationSelect}
        type="seaport"
      />

      {/* 선사 코드 검색 모달 */}
      <CarrierCodeModal
        isOpen={showCarrierModal}
        onClose={() => setShowCarrierModal(false)}
        onSelect={handleCarrierSelect}
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
