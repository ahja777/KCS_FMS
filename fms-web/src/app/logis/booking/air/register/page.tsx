'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import ScheduleSearchModal from '@/components/ScheduleSearchModal';
import EmailModal from '@/components/EmailModal';
import { UnsavedChangesModal } from '@/components/UnsavedChangesModal';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useScreenClose } from '@/hooks/useScreenClose';
import { LIST_PATHS } from '@/constants/paths';
import {
  CodeSearchModal,
  LocationCodeModal,
  type CodeItem,
  type CodeType,
  type LocationItem,
} from '@/components/popup';
import AirlineCodeModal, { type AirlineItem } from '@/components/popup/AirlineCodeModal';
import SearchIconButton from '@/components/SearchIconButton';


interface CargoItem {
  id: string;
  pieces: number;
  packageType: string;
  grossWeight: number;
  chargeableWeight: number;
  length: number;
  width: number;
  height: number;
  volume: number;
  commodity: string;
  hsCode: string;
}

interface BookingFormData {
  // 기본정보
  bookingNo: string;
  bookingDate: string;
  bookingType: string;
  serviceType: string;
  incoterms: string;

  // 화주정보
  shipperCode: string;
  shipperName: string;
  shipperAddress: string;
  shipperContact: string;
  shipperTel: string;
  shipperEmail: string;

  // 수하인정보
  consigneeCode: string;
  consigneeName: string;
  consigneeAddress: string;
  consigneeContact: string;
  consigneeTel: string;
  consigneeEmail: string;

  // Notify Party
  notifyPartyCode: string;
  notifyPartyName: string;
  notifyPartyAddress: string;

  // 스케줄정보
  airline: string;
  flightNo: string;
  origin: string;
  destination: string;
  etd: string;
  eta: string;
  transitPort: string;
  transitTime: string;

  // MAWB/HAWB 정보
  mawbNo: string;
  hawbNo: string;

  // 화물정보
  totalPieces: number;
  totalGrossWeight: number;
  totalChargeableWeight: number;
  totalVolume: number;

  // 기타
  specialHandling: string;
  dangerousGoods: boolean;
  dgClass: string;
  unNumber: string;
  remarks: string;
}

const initialFormData: BookingFormData = {
  bookingNo: '',
  bookingDate: new Date().toISOString().split('T')[0],
  bookingType: 'EXPORT',
  serviceType: 'AIRPORT_TO_AIRPORT',
  incoterms: 'FOB',

  shipperCode: '',
  shipperName: '',
  shipperAddress: '',
  shipperContact: '',
  shipperTel: '',
  shipperEmail: '',

  consigneeCode: '',
  consigneeName: '',
  consigneeAddress: '',
  consigneeContact: '',
  consigneeTel: '',
  consigneeEmail: '',

  notifyPartyCode: '',
  notifyPartyName: '',
  notifyPartyAddress: '',

  airline: '',
  flightNo: '',
  origin: 'ICN',
  destination: '',
  etd: '',
  eta: '',
  transitPort: '',
  transitTime: '',

  mawbNo: '',
  hawbNo: '',

  totalPieces: 0,
  totalGrossWeight: 0,
  totalChargeableWeight: 0,
  totalVolume: 0,

  specialHandling: '',
  dangerousGoods: false,
  dgClass: '',
  unNumber: '',
  remarks: '',
};

const initialCargoItem: CargoItem = {
  id: '1',
  pieces: 0,
  packageType: 'CARTON',
  grossWeight: 0,
  chargeableWeight: 0,
  length: 0,
  width: 0,
  height: 0,
  volume: 0,
  commodity: '',
  hsCode: '',
};

function BookingAirRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });
  const [formData, setFormData] = useState<BookingFormData>(initialFormData);
  const [cargoItems, setCargoItems] = useState<CargoItem[]>([initialCargoItem]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isNewMode, setIsNewMode] = useState(true); // 신규 입력 모드 (신규버튼 비활성화 제어)
  const [isLoading, setIsLoading] = useState(false);

  // 팝업 상태
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showAirlineModal, setShowAirlineModal] = useState(false);
  const [currentField, setCurrentField] = useState<string>('');
  const [currentCodeType, setCurrentCodeType] = useState<CodeType>('customer');

  // useScreenClose 훅
  const {
    showModal: showCloseModal,
    handleCloseClick,
    handleModalClose,
    handleDiscard: handleDiscardChanges,
  } = useScreenClose({
    hasChanges: hasUnsavedChanges,
    listPath: LIST_PATHS.BOOKING_AIR,
  });

  // 기존 데이터 로드
  useEffect(() => {
    if (!editId) return;
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/booking/air?bookingId=${editId}`);
        if (!res.ok) return;
        const d = await res.json();
        const ds = (v: string | null | undefined) => v ? v.substring(0, 10) : '';

        setFormData({
          // 기본정보
          bookingNo: d.bookingNo || '',
          bookingDate: ds(d.flightDate) || new Date().toISOString().split('T')[0],
          bookingType: d.bookingType || 'EXPORT',
          serviceType: d.serviceType || 'AIRPORT_TO_AIRPORT',
          incoterms: d.incoterms || 'FOB',

          // 화주정보
          shipperCode: d.shipperCode || '',
          shipperName: d.shipperName || '',
          shipperAddress: d.shipperAddress || '',
          shipperContact: d.shipperContact || '',
          shipperTel: d.shipperTel || '',
          shipperEmail: d.shipperEmail || '',

          // 수하인정보
          consigneeCode: d.consigneeCode || '',
          consigneeName: d.consigneeName || '',
          consigneeAddress: d.consigneeAddress || '',
          consigneeContact: d.consigneeContact || '',
          consigneeTel: d.consigneeTel || '',
          consigneeEmail: d.consigneeEmail || '',

          // Notify Party
          notifyPartyCode: d.notifyPartyCode || '',
          notifyPartyName: d.notifyPartyName || '',
          notifyPartyAddress: d.notifyPartyAddress || '',

          // 스케줄정보
          airline: d.carrierName || '',
          flightNo: d.flightNo || '',
          origin: d.origin || 'ICN',
          destination: d.destination || '',
          etd: ds(d.etd),
          eta: ds(d.eta),
          transitPort: d.transitPort || '',
          transitTime: d.transitTime || '',

          // MAWB/HAWB 정보
          mawbNo: d.mawbNo || '',
          hawbNo: d.hawbNo || '',

          // 화물정보
          totalPieces: Number(d.pkgQty) || 0,
          totalGrossWeight: parseFloat(d.grossWeight) || 0,
          totalChargeableWeight: parseFloat(d.chargeableWeight) || 0,
          totalVolume: parseFloat(d.volume) || 0,

          // 기타
          specialHandling: d.specialHandling || '',
          dangerousGoods: d.dangerousGoods === true || d.dangerousGoods === 'Y',
          dgClass: d.dgClass || '',
          unNumber: d.unNumber || '',
          remarks: d.remark || '',
        });

        // 화물 아이템이 있으면 로드
        if (d.cargoItems && Array.isArray(d.cargoItems) && d.cargoItems.length > 0) {
          setCargoItems(d.cargoItems.map((item: any, idx: number) => ({
            id: item.id || String(idx + 1),
            pieces: Number(item.pieces) || 0,
            packageType: item.packageType || 'CARTON',
            grossWeight: Number(item.grossWeight) || 0,
            chargeableWeight: Number(item.chargeableWeight) || 0,
            length: Number(item.length) || 0,
            width: Number(item.width) || 0,
            height: Number(item.height) || 0,
            volume: Number(item.volume) || 0,
            commodity: item.commodity || d.commodityDesc || '',
            hsCode: item.hsCode || '',
          })));
        } else if (d.commodityDesc || Number(d.pkgQty) > 0) {
          // cargoItems가 없지만 요약 화물정보가 있으면 단일 아이템으로 생성
          setCargoItems([{
            id: '1',
            pieces: Number(d.pkgQty) || 0,
            packageType: d.pkgType || 'CARTON',
            grossWeight: parseFloat(d.grossWeight) || 0,
            chargeableWeight: parseFloat(d.chargeableWeight) || 0,
            length: 0,
            width: 0,
            height: 0,
            volume: parseFloat(d.volume) || 0,
            commodity: d.commodityDesc || '',
            hsCode: '',
          }]);
        }

        setIsNewMode(false);
        setHasUnsavedChanges(false);
      } catch (e) {
        console.error('Failed to fetch booking:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [editId]);

  // 폼 변경 감지
  useEffect(() => {
    if (formData.shipperName || formData.airline || formData.flightNo) {
      setHasUnsavedChanges(true);
    }
  }, [formData.shipperName, formData.airline, formData.flightNo]);

  const handleInputChange = (field: keyof BookingFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCargoChange = (index: number, field: keyof CargoItem, value: string | number) => {
    setCargoItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // 체적 자동 계산 (CBM)
      if (field === 'length' || field === 'width' || field === 'height') {
        const item = updated[index];
        const volumeCbm = (item.length * item.width * item.height) / 1000000;
        updated[index].volume = Math.round(volumeCbm * 1000) / 1000;

        // 체적중량 계산 (항공: 1CBM = 167kg)
        const volumeWeight = volumeCbm * 167;
        updated[index].chargeableWeight = Math.max(item.grossWeight, volumeWeight);
      }

      if (field === 'grossWeight') {
        const item = updated[index];
        const volumeWeight = item.volume * 167;
        updated[index].chargeableWeight = Math.max(Number(value), volumeWeight);
      }

      return updated;
    });

    // 총합계 업데이트
    setTimeout(() => {
      updateTotals();
    }, 0);
  };

  const updateTotals = () => {
    const totals = cargoItems.reduce((acc, item) => ({
      pieces: acc.pieces + item.pieces,
      grossWeight: acc.grossWeight + item.grossWeight,
      chargeableWeight: acc.chargeableWeight + item.chargeableWeight,
      volume: acc.volume + item.volume,
    }), { pieces: 0, grossWeight: 0, chargeableWeight: 0, volume: 0 });

    setFormData(prev => ({
      ...prev,
      totalPieces: totals.pieces,
      totalGrossWeight: Math.round(totals.grossWeight * 100) / 100,
      totalChargeableWeight: Math.round(totals.chargeableWeight * 100) / 100,
      totalVolume: Math.round(totals.volume * 1000) / 1000,
    }));
  };

  const addCargoItem = () => {
    setCargoItems(prev => [...prev, {
      ...initialCargoItem,
      id: Date.now().toString(),
    }]);
  };

  const removeCargoItem = (index: number) => {
    if (cargoItems.length > 1) {
      setCargoItems(prev => prev.filter((_, i) => i !== index));
      setTimeout(updateTotals, 0);
    }
  };

  const handleScheduleSelect = (schedule: any) => {
    setFormData(prev => ({
      ...prev,
      airline: schedule.carrier || schedule.airline,
      flightNo: schedule.flightNo || schedule.vesselVoyage,
      origin: schedule.pol || schedule.origin,
      destination: schedule.pod || schedule.destination,
      etd: schedule.etd,
      eta: schedule.eta,
      transitPort: schedule.transitPort || '',
      transitTime: schedule.transitTime || '',
    }));
    setShowScheduleModal(false);
  };

  const handleSave = async () => {
    if (!formData.shipperName) {
      alert('화주(Shipper) 정보를 입력해주세요.');
      return;
    }
    if (!formData.consigneeName) {
      alert('수하인(Consignee) 정보를 입력해주세요.');
      return;
    }
    if (!formData.airline || !formData.flightNo) {
      alert('스케줄 정보를 선택해주세요.');
      return;
    }
    if (formData.totalPieces === 0) {
      alert('화물 정보를 입력해주세요.');
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        carrierName: formData.airline,
        flightNo: formData.flightNo,
        flightDate: formData.bookingDate || null,
        origin: formData.origin,
        destination: formData.destination,
        etd: formData.etd || null,
        eta: formData.eta || null,
        commodityDesc: cargoItems.map(c => c.commodity).filter(Boolean).join(', '),
        pkgQty: formData.totalPieces,
        pkgType: cargoItems[0]?.packageType || '',
        grossWeight: formData.totalGrossWeight,
        chargeableWeight: formData.totalChargeableWeight,
        volume: formData.totalVolume,
        status: 'DRAFT',
        remark: formData.remarks,
      };

      if (editId) {
        // 기존 데이터 수정 (PUT)
        const res = await fetch('/api/booking/air', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editId, ...payload }),
        });
        if (!res.ok) throw new Error('Failed to update');

        setHasUnsavedChanges(false);
        setIsNewMode(false);
        alert(`예약이 수정되었습니다.\n예약번호: ${formData.bookingNo}`);
      } else {
        // 신규 등록 (POST)
        const res = await fetch('/api/booking/air', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create');
        const result = await res.json();

        setHasUnsavedChanges(false);
        setIsNewMode(false);
        setFormData(prev => ({ ...prev, bookingNo: result.bookingNo }));
        alert(`예약이 저장되었습니다.\n예약번호: ${result.bookingNo}`);
      }
    } catch (error) {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    await handleSave();
    // 실제로는 API 호출하여 예약 요청
    alert('예약 요청이 완료되었습니다.');
  };

  const handleEmailSend = (emailData: any) => {
    console.log('이메일 발송:', emailData);
    alert(`이메일이 발송되었습니다.\n받는 사람: ${emailData.to.join(', ')}\n제목: ${emailData.subject}`);
  };

  // 코드 검색 버튼 클릭
  const handleCodeSearch = (field: string, codeType: CodeType) => {
    setCurrentField(field);
    setCurrentCodeType(codeType);
    setShowCodeModal(true);
  };

  // 코드 선택 완료
  const handleCodeSelect = (item: CodeItem) => {
    setFormData(prev => ({
      ...prev,
      [`${currentField}Code`]: item.code,
      [`${currentField}Name`]: item.name,
    }));
    setShowCodeModal(false);
  };

  // 위치 검색 버튼 클릭
  const handleLocationSearch = (field: string) => {
    setCurrentField(field);
    setShowLocationModal(true);
  };

  // 위치 선택 완료
  const handleLocationSelect = (item: LocationItem) => {
    setFormData(prev => ({
      ...prev,
      [currentField]: item.code,
    }));
    setShowLocationModal(false);
  };

  // 항공사 선택 완료
  const handleAirlineSelect = (item: AirlineItem) => {
    setFormData(prev => ({
      ...prev,
      airline: item.nameKr || item.code,
    }));
    setShowAirlineModal(false);
  };

  const handleGoList = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = confirm('작성 중인 내용이 저장되지 않습니다. 목록으로 이동하시겠습니까?');
      if (!confirmLeave) return;
    }
    router.push(LIST_PATHS.BOOKING_AIR);
  };

  // 신규 등록
  const handleNew = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = confirm('작성 중인 내용이 저장되지 않습니다. 새로 작성하시겠습니까?');
      if (!confirmLeave) return;
    }
    // editId가 있으면 쿼리 파라미터 없는 URL로 이동
    if (editId) {
      router.push('/logis/booking/air/register');
      return;
    }
    setFormData(initialFormData);
    setCargoItems([initialCargoItem]);
    setHasUnsavedChanges(false);
    setIsNewMode(true); // 신규 모드로 전환 (신규버튼 비활성화)
  };

  // 초기화
  const handleReset = () => {
    if (!confirm('입력한 내용을 모두 초기화하시겠습니까?')) return;
    setFormData(initialFormData);
    setCargoItems([initialCargoItem]);
    setHasUnsavedChanges(false);
  };

  // 삭제
  const handleDelete = async () => {
    if ((!formData.bookingNo && !editId) || !confirm('정말 삭제하시겠습니까?')) return;

    try {
      if (editId) {
        const res = await fetch(`/api/booking/air?ids=${editId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete');
      }
    } catch (e) {
      console.error('Failed to delete:', e);
      alert('삭제 중 오류가 발생했습니다.');
      return;
    }

    setHasUnsavedChanges(false);
    alert('부킹이 삭제되었습니다.');
    router.push(LIST_PATHS.BOOKING_AIR);
  };

  // 테스트 데이터 입력
  const handleFillTestData = () => {
    const today = new Date().toISOString().split('T')[0];
    const etdDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const etaDate = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    setFormData({
      ...initialFormData,
      bookingDate: today,
      bookingType: 'EXPORT',
      serviceType: 'AIRPORT_TO_AIRPORT',
      incoterms: 'FOB',
      shipperCode: 'SH001',
      shipperName: '삼성전자 주식회사',
      shipperAddress: '경기도 수원시 영통구 삼성로 129',
      shipperContact: '김철수',
      shipperTel: '031-200-1234',
      shipperEmail: 'shipper@samsung.com',
      consigneeCode: 'CN001',
      consigneeName: 'Samsung Electronics America',
      consigneeAddress: '85 Challenger Road, Ridgefield Park, NJ 07660, USA',
      consigneeContact: 'John Smith',
      consigneeTel: '+1-201-229-4000',
      consigneeEmail: 'consignee@samsung.com',
      notifyPartyCode: 'NP001',
      notifyPartyName: 'Same as Consignee',
      notifyPartyAddress: '85 Challenger Road, Ridgefield Park, NJ 07660, USA',
      airline: 'KOREAN AIR',
      flightNo: 'KE081',
      origin: 'ICN',
      destination: 'JFK',
      etd: etdDate,
      eta: etaDate,
      transitPort: '',
      transitTime: '14시간',
      mawbNo: '180-12345678',
      hawbNo: 'HAWB-2024-001',
      totalPieces: 50,
      totalGrossWeight: 500,
      totalChargeableWeight: 600,
      totalVolume: 3.6,
      specialHandling: 'FRAGILE',
      dangerousGoods: false,
      dgClass: '',
      unNumber: '',
      remarks: '테스트 데이터 - 항공 부킹 등록',
    });

    setCargoItems([
      {
        id: '1',
        pieces: 30,
        packageType: 'CARTON',
        grossWeight: 300,
        chargeableWeight: 350,
        length: 60,
        width: 40,
        height: 50,
        volume: 1.2,
        commodity: '반도체 부품',
        hsCode: '8542.31.0000',
      },
      {
        id: '2',
        pieces: 20,
        packageType: 'PALLET',
        grossWeight: 200,
        chargeableWeight: 250,
        length: 120,
        width: 100,
        height: 100,
        volume: 2.4,
        commodity: '전자 디스플레이',
        hsCode: '8528.52.0000',
      },
    ]);

    setHasUnsavedChanges(true);
    alert('테스트 데이터가 입력되었습니다.');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-[var(--muted)]">데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header title="선적부킹 등록 (항공)" subtitle="견적/부킹관리  선적부킹관리 (항공)  예약등록" onClose={handleCloseClick} />
      <main ref={formRef} className="p-6">
          {/* 상단 버튼 */}
          <div className="sticky top-20 z-20 bg-white py-2 -mx-6 px-6 border-b border-gray-200 flex justify-end items-center mb-6">
            <div className="flex gap-2">
              <button
                onClick={handleNew}
                disabled={isNewMode}
                className="px-4 py-2 rounded-lg flex items-center gap-2 bg-[var(--surface-100)] text-[var(--foreground)] hover:bg-[var(--surface-200)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                신규
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)] flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                초기화
              </button>
              {(formData.bookingNo || editId) && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)] flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  삭제
                </button>
              )}
              <button
                onClick={() => setShowScheduleModal(true)}
                className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]"
              >
                스케줄조회
              </button>
              <button
                onClick={() => setShowEmailModal(true)}
                className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)] flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                E-mail
              </button>
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
                disabled={isSaving}
                className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)] flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {isSaving ? '저장중...' : '저장'}
              </button>
            </div>
          </div>
          {/* 기본정보 */}
          <div className="card mb-6">
            <div className="section-header">
              <h3 className="font-bold text-white">기본정보</h3>
            </div>
            <div className="p-4 grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">예약번호</label>
                <input
                  type="text"
                  value={formData.bookingNo || '자동생성'}
                  disabled
                  className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">예약일자</label>
                <input
                  type="date"
                  value={formData.bookingDate}
                  onChange={(e) => handleInputChange('bookingDate', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">예약구분</label>
                <select
                  value={formData.bookingType}
                  onChange={(e) => handleInputChange('bookingType', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                >
                  <option value="EXPORT">수출</option>
                  <option value="IMPORT">수입</option>
                  <option value="CROSS_TRADE">삼국간</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">서비스유형</label>
                <select
                  value={formData.serviceType}
                  onChange={(e) => handleInputChange('serviceType', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                >
                  <option value="AIRPORT_TO_AIRPORT">Airport to Airport</option>
                  <option value="AIRPORT_TO_DOOR">Airport to Door</option>
                  <option value="DOOR_TO_AIRPORT">Door to Airport</option>
                  <option value="DOOR_TO_DOOR">Door to Door</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Incoterms</label>
                <select
                  value={formData.incoterms}
                  onChange={(e) => handleInputChange('incoterms', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                >
                  <option value="EXW">EXW</option>
                  <option value="FCA">FCA</option>
                  <option value="FOB">FOB</option>
                  <option value="CFR">CFR</option>
                  <option value="CIF">CIF</option>
                  <option value="DAP">DAP</option>
                  <option value="DDP">DDP</option>
                </select>
              </div>
            </div>
          </div>

          {/* 화주/수하인 정보 */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Shipper */}
            <div className="card">
              <div className="section-header">
                <h3 className="font-bold text-white">화주 (Shipper)</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">업체코드</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.shipperCode}
                        onChange={(e) => handleInputChange('shipperCode', e.target.value)}
                        className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                        placeholder="업체코드"
                      />
                      <SearchIconButton onClick={() => handleCodeSearch('shipper', 'customer')} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">업체명 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.shipperName}
                    onChange={(e) => handleInputChange('shipperName', e.target.value)}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="화주명"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">주소</label>
                  <input
                    type="text"
                    value={formData.shipperAddress}
                    onChange={(e) => handleInputChange('shipperAddress', e.target.value)}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="주소"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">담당자</label>
                    <input
                      type="text"
                      value={formData.shipperContact}
                      onChange={(e) => handleInputChange('shipperContact', e.target.value)}
                      className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                      placeholder="담당자명"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">연락처</label>
                    <input
                      type="text"
                      value={formData.shipperTel}
                      onChange={(e) => handleInputChange('shipperTel', e.target.value)}
                      className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                      placeholder="000-0000-0000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">이메일</label>
                  <input
                    type="email"
                    value={formData.shipperEmail}
                    onChange={(e) => handleInputChange('shipperEmail', e.target.value)}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Consignee */}
            <div className="card">
              <div className="section-header">
                <h3 className="font-bold text-white">수하인 (Consignee)</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">업체코드</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.consigneeCode}
                        onChange={(e) => handleInputChange('consigneeCode', e.target.value)}
                        className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                        placeholder="업체코드"
                      />
                      <SearchIconButton onClick={() => handleCodeSearch('consignee', 'customer')} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">업체명 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.consigneeName}
                    onChange={(e) => handleInputChange('consigneeName', e.target.value)}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="수하인명"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">주소</label>
                  <input
                    type="text"
                    value={formData.consigneeAddress}
                    onChange={(e) => handleInputChange('consigneeAddress', e.target.value)}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="주소"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">담당자</label>
                    <input
                      type="text"
                      value={formData.consigneeContact}
                      onChange={(e) => handleInputChange('consigneeContact', e.target.value)}
                      className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                      placeholder="담당자명"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">연락처</label>
                    <input
                      type="text"
                      value={formData.consigneeTel}
                      onChange={(e) => handleInputChange('consigneeTel', e.target.value)}
                      className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                      placeholder="000-0000-0000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">이메일</label>
                  <input
                    type="email"
                    value={formData.consigneeEmail}
                    onChange={(e) => handleInputChange('consigneeEmail', e.target.value)}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 스케줄 정보 */}
          <div className="card mb-6">
            <div className="section-header flex justify-between items-center">
              <h3 className="font-bold text-white">스케줄 정보</h3>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="px-3 py-1 bg-white/20 text-white text-sm rounded hover:bg-white/30"
              >
                스케줄 검색
              </button>
            </div>
            <div className="p-4 grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">항공사 <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.airline}
                    onChange={(e) => handleInputChange('airline', e.target.value)}
                    className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="항공사"
                  />
                  <SearchIconButton onClick={() => setShowAirlineModal(true)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">편명 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.flightNo}
                  onChange={(e) => handleInputChange('flightNo', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="KE001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">출발공항 (Origin)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.origin}
                    onChange={(e) => handleInputChange('origin', e.target.value)}
                    className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="ICN"
                  />
                  <SearchIconButton onClick={() => handleLocationSearch('origin')} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">도착공항 (Destination)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.destination}
                    onChange={(e) => handleInputChange('destination', e.target.value)}
                    className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="JFK"
                  />
                  <SearchIconButton onClick={() => handleLocationSearch('destination')} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ETD (출발예정일)</label>
                <input
                  type="date"
                  value={formData.etd}
                  onChange={(e) => handleInputChange('etd', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ETA (도착예정일)</label>
                <input
                  type="date"
                  value={formData.eta}
                  onChange={(e) => handleInputChange('eta', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">경유지</label>
                <input
                  type="text"
                  value={formData.transitPort}
                  onChange={(e) => handleInputChange('transitPort', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="경유 공항 (선택)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">운송시간</label>
                <input
                  type="text"
                  value={formData.transitTime}
                  onChange={(e) => handleInputChange('transitTime', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="예: 14시간"
                />
              </div>
            </div>
          </div>

          {/* AWB 정보 */}
          <div className="card mb-6">
            <div className="section-header">
              <h3 className="font-bold text-white">AWB 정보</h3>
            </div>
            <div className="p-4 grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">MAWB No.</label>
                <input
                  type="text"
                  value={formData.mawbNo}
                  onChange={(e) => handleInputChange('mawbNo', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="000-00000000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">HAWB No.</label>
                <input
                  type="text"
                  value={formData.hawbNo}
                  onChange={(e) => handleInputChange('hawbNo', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="자동생성 또는 입력"
                />
              </div>
            </div>
          </div>

          {/* 화물 정보 */}
          <div className="card mb-6">
            <div className="section-header flex justify-between items-center">
              <h3 className="font-bold text-white">화물 정보</h3>
              <button
                onClick={addCargoItem}
                className="px-3 py-1 bg-white/20 text-white text-sm rounded hover:bg-white/30"
              >
                + 품목 추가
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="text-center">No</th>
                    <th className="text-center">품명 (Commodity)</th>
                    <th className="text-center">HS Code</th>
                    <th className="text-center">포장유형</th>
                    <th className="text-center">수량 (PCS)</th>
                    <th className="text-center">L (cm)</th>
                    <th className="text-center">W (cm)</th>
                    <th className="text-center">H (cm)</th>
                    <th className="text-center">체적 (CBM)</th>
                    <th className="text-center">총중량 (kg)</th>
                    <th className="text-center">과금중량 (kg)</th>
                    <th className="text-center">삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {cargoItems.map((item, index) => (
                    <tr key={item.id} className="border-t border-[var(--border)]">
                      <td className="p-2 text-center">{index + 1}</td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.commodity}
                          onChange={(e) => handleCargoChange(index, 'commodity', e.target.value)}
                          className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                          placeholder="품명"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.hsCode}
                          onChange={(e) => handleCargoChange(index, 'hsCode', e.target.value)}
                          className="w-24 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                          placeholder="0000.00"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={item.packageType}
                          onChange={(e) => handleCargoChange(index, 'packageType', e.target.value)}
                          className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                        >
                          <option value="CARTON">Carton</option>
                          <option value="PALLET">Pallet</option>
                          <option value="CASE">Case</option>
                          <option value="CRATE">Crate</option>
                          <option value="BAG">Bag</option>
                          <option value="DRUM">Drum</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={item.pieces || ''}
                          onChange={(e) => handleCargoChange(index, 'pieces', Number(e.target.value))}
                          className="w-20 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-center"
                          min="0"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={item.length || ''}
                          onChange={(e) => handleCargoChange(index, 'length', Number(e.target.value))}
                          className="w-16 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-center"
                          min="0"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={item.width || ''}
                          onChange={(e) => handleCargoChange(index, 'width', Number(e.target.value))}
                          className="w-16 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-center"
                          min="0"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={item.height || ''}
                          onChange={(e) => handleCargoChange(index, 'height', Number(e.target.value))}
                          className="w-16 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-center"
                          min="0"
                        />
                      </td>
                      <td className="p-2 text-center text-sm">{item.volume.toFixed(3)}</td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={item.grossWeight || ''}
                          onChange={(e) => handleCargoChange(index, 'grossWeight', Number(e.target.value))}
                          className="w-20 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="p-2 text-center text-sm font-medium">{item.chargeableWeight.toFixed(2)}</td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => removeCargoItem(index)}
                          disabled={cargoItems.length === 1}
                          className="text-red-500 hover:text-red-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[var(--surface-100)] font-medium">
                  <tr>
                    <td colSpan={4} className="p-3 text-center">합계</td>
                    <td className="p-3 text-center">{formData.totalPieces}</td>
                    <td colSpan={3}></td>
                    <td className="p-3 text-center">{formData.totalVolume.toFixed(3)} CBM</td>
                    <td className="p-3 text-center">{formData.totalGrossWeight.toFixed(2)} kg</td>
                    <td className="p-3 text-center">{formData.totalChargeableWeight.toFixed(2)} kg</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 위험물 / 특수 취급 */}
          <div className="card mb-6">
            <div className="section-header">
              <h3 className="font-bold text-white">위험물 / 특수 취급</h3>
            </div>
            <div className="p-4 grid grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="dangerousGoods"
                  checked={formData.dangerousGoods}
                  onChange={(e) => handleInputChange('dangerousGoods', e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="dangerousGoods" className="text-sm font-medium">위험물 (DG)</label>
              </div>
              {formData.dangerousGoods && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">DG Class</label>
                    <select
                      value={formData.dgClass}
                      onChange={(e) => handleInputChange('dgClass', e.target.value)}
                      className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    >
                      <option value="">선택</option>
                      <option value="1">Class 1 - 폭발물</option>
                      <option value="2">Class 2 - 가스류</option>
                      <option value="3">Class 3 - 인화성 액체</option>
                      <option value="4">Class 4 - 가연성 물질</option>
                      <option value="5">Class 5 - 산화성 물질</option>
                      <option value="6">Class 6 - 독성 물질</option>
                      <option value="7">Class 7 - 방사성 물질</option>
                      <option value="8">Class 8 - 부식성 물질</option>
                      <option value="9">Class 9 - 기타 위험물</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">UN Number</label>
                    <input
                      type="text"
                      value={formData.unNumber}
                      onChange={(e) => handleInputChange('unNumber', e.target.value)}
                      className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                      placeholder="UN0000"
                    />
                  </div>
                </>
              )}
              <div className="col-span-4">
                <label className="block text-sm font-medium mb-1">특수 취급 지시사항</label>
                <input
                  type="text"
                  value={formData.specialHandling}
                  onChange={(e) => handleInputChange('specialHandling', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="예: PERISHABLE, FRAGILE, TEMPERATURE CONTROL, LIVE ANIMAL 등"
                />
              </div>
            </div>
          </div>

          {/* 비고 */}
          <div className="card mb-6">
            <div className="section-header">
              <h3 className="font-bold text-white">비고</h3>
            </div>
            <div className="p-4">
              <textarea
                value={formData.remarks}
                onChange={(e) => handleInputChange('remarks', e.target.value)}
                rows={4}
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg resize-none"
                placeholder="기타 요청사항이나 메모를 입력하세요..."
              />
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
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-3 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)]"
            >
              {isSaving ? '저장중...' : '임시저장'}
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-3 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)]"
            >
              예약요청
            </button>
          </div>
        </main>
      {/* 스케줄 조회 모달 */}
      <ScheduleSearchModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSelect={handleScheduleSelect}
        type="air"
      />

      {/* 이메일 모달 */}
      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSend={handleEmailSend}
        documentType="booking"
        documentNo={formData.bookingNo || '신규'}
      />

      {/* 저장 확인 모달 */}
      <UnsavedChangesModal
        isOpen={showCloseModal}
        onClose={handleModalClose}
        onDiscard={handleDiscardChanges}
        onSave={handleSave}
        message="작성 중인 내용이 저장되지 않습니다. 저장하시겠습니까?"
      />

      {/* 코드 검색 모달 */}
      <CodeSearchModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        onSelect={handleCodeSelect}
        codeType={currentCodeType}
      />

      {/* 위치 검색 모달 */}
      <LocationCodeModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelect={handleLocationSelect}
        type="airport"
      />

      {/* 항공사 코드 검색 모달 */}
      <AirlineCodeModal
        isOpen={showAirlineModal}
        onClose={() => setShowAirlineModal(false)}
        onSelect={handleAirlineSelect}
      />
    </div>
  );
}

export default function BookingAirRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)] flex items-center justify-center">Loading...</div>}>
      <BookingAirRegisterContent />
    </Suspense>
  );
}
