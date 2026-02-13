'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useScreenClose } from '@/hooks/useScreenClose';
import { LIST_PATHS } from '@/constants/paths';
import ScheduleSearchModal from '@/components/ScheduleSearchModal';
import EmailModal from '@/components/EmailModal';
import {
  CodeSearchModal,
  LocationCodeModal,
  BookingSearchModal,
  type CodeItem,
  type CodeType,
  type LocationItem,
  type SeaBooking,
  type AirBooking,
} from '@/components/popup';

interface SRFormData {
  srNo: string;
  srDate: string;
  bookingNo: string;
  shipper: string;
  shipperContact: string;
  consignee: string;
  consigneeContact: string;
  notifyParty: string;
  carrier: string;
  vessel: string;
  voyage: string;
  pol: string;
  pod: string;
  finalDest: string;
  etd: string;
  eta: string;
  containerType: string;
  containerQty: number;
  commodity: string;
  grossWeight: number;
  measurement: number;
  freightTerms: string;
  remarks: string;
}

const initialFormData: SRFormData = {
  srNo: '자동생성',
  srDate: new Date().toISOString().split('T')[0],
  bookingNo: '',
  shipper: '',
  shipperContact: '',
  consignee: '',
  consigneeContact: '',
  notifyParty: '',
  carrier: '',
  vessel: '',
  voyage: '',
  pol: '',
  pod: '',
  finalDest: '',
  etd: '',
  eta: '',
  containerType: '40HC',
  containerQty: 1,
  commodity: '',
  grossWeight: 0,
  measurement: 0,
  freightTerms: 'CY-CY',
  remarks: '',
};

function SRRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const blId = searchParams.get('blId');
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });


  // useScreenClose 훅
  const {
    showModal: showCloseModal,
    handleCloseClick,
    handleModalClose,
    handleDiscard: handleDiscardChanges,
  } = useScreenClose({
    hasChanges: false,  // 이 페이지는 변경사항 추적 없음
    listPath: LIST_PATHS.SR_SEA,
  });

  const [formData, setFormData] = useState<SRFormData>(initialFormData);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isNewMode, setIsNewMode] = useState(true); // 신규 입력 모드 (신규버튼 비활성화 제어)
  const [isSaving, setIsSaving] = useState(false);

  // 팝업 상태
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [currentField, setCurrentField] = useState<string>('');
  const [currentCodeType, setCurrentCodeType] = useState<CodeType>('customer');

  // 수정 모드: editId가 있으면 기존 S/R 데이터 로드
  useEffect(() => {
    if (!editId) return;
    const fetchSRData = async () => {
      try {
        const res = await fetch(`/api/sr/sea?srId=${editId}`);
        if (!res.ok) return;
        const data = await res.json();
        setFormData({
          srNo: data.srNo || '자동생성',
          srDate: data.cargoReadyDate || new Date().toISOString().split('T')[0],
          bookingNo: data.bookingId ? `BK-${data.bookingId}` : data.srNo || '',
          shipper: data.shipperName || '',
          shipperContact: '',
          consignee: data.consigneeName || '',
          consigneeContact: '',
          notifyParty: data.notifyParty || '',
          carrier: data.carrier || '',
          vessel: data.vessel || '',
          voyage: data.voyage || '',
          pol: data.pol || '',
          pod: data.pod || '',
          finalDest: data.finalDest || '',
          etd: data.etd || '',
          eta: data.eta || '',
          containerType: data.packageType || '40HC',
          containerQty: data.packageQty || 1,
          commodity: data.commodityDesc || '',
          grossWeight: parseFloat(data.grossWeight) || 0,
          measurement: parseFloat(data.volume) || 0,
          freightTerms: data.freightTerms || 'CY-CY',
          remarks: data.remark || '',
        });
        setIsNewMode(false);
      } catch (error) {
        console.error('S/R 데이터 조회 실패:', error);
      }
    };
    fetchSRData();
  }, [editId]);

  // B/L 데이터 자동 입력: blId query parameter가 있으면 B/L 조회 후 폼에 매핑
  useEffect(() => {
    if (!blId) return;
    const fetchBLData = async () => {
      try {
        const res = await fetch(`/api/bl/sea?blId=${blId}`);
        if (!res.ok) return;
        const data = await res.json();
        setFormData(prev => ({
          ...prev,
          shipper: data.shipperName || '',
          consignee: data.consigneeName || '',
          notifyParty: data.notifyName || '',
          carrier: data.lineName || '',
          vessel: data.vesselName || '',
          voyage: data.voyageNo || '',
          pol: data.portOfLoading || '',
          pod: data.portOfDischarge || '',
          finalDest: data.finalDestination || '',
          etd: data.etd || '',
          eta: data.eta || '',
          freightTerms: data.serviceTerm || prev.freightTerms,
          grossWeight: data.grossWeight || 0,
          measurement: data.measurement || 0,
        }));
      } catch (error) {
        console.error('B/L 데이터 조회 실패:', error);
      }
    };
    fetchBLData();
  }, [blId]);

  // 코드 검색 버튼 클릭
  const handleCodeSearch = (field: string, codeType: CodeType) => {
    setCurrentField(field);
    setCurrentCodeType(codeType);
    setShowCodeModal(true);
  };

  // 코드 선택 완료
  const handleCodeSelect = (item: CodeItem) => {
    if (currentField === 'shipper') {
      setFormData(prev => ({ ...prev, shipper: item.name }));
    } else if (currentField === 'consignee') {
      setFormData(prev => ({ ...prev, consignee: item.name }));
    } else if (currentField === 'carrier') {
      setFormData(prev => ({ ...prev, carrier: item.name }));
    }
    setShowCodeModal(false);
    setHasUnsavedChanges(true);
  };

  // 위치 검색 버튼 클릭
  const handleLocationSearch = (field: string) => {
    setCurrentField(field);
    setShowLocationModal(true);
  };

  // 위치 선택 완료
  const handleLocationSelect = (item: LocationItem) => {
    setFormData(prev => ({ ...prev, [currentField]: item.code }));
    setShowLocationModal(false);
    setHasUnsavedChanges(true);
  };

  // 부킹 선택 완료
  const handleBookingSelect = (booking: SeaBooking | AirBooking) => {
    if ('pol' in booking) {
      // SeaBooking 타입
      setFormData(prev => ({
        ...prev,
        bookingNo: booking.bookingNo,
        shipper: booking.shipper,
        carrier: booking.carrier,
        pol: booking.pol,
        pod: booking.pod,
        etd: booking.etd,
        eta: booking.eta,
      }));
    }
    setShowBookingModal(false);
    setHasUnsavedChanges(true);
  };

  // 스케줄 선택 완료
  const handleScheduleSelect = (schedule: any) => {
    setFormData(prev => ({
      ...prev,
      carrier: schedule.carrier,
      vessel: schedule.vesselName || schedule.vessel,
      voyage: schedule.voyageNo || schedule.voyage,
      pol: schedule.pol,
      pod: schedule.pod,
      etd: schedule.etd,
      eta: schedule.eta,
    }));
    setShowScheduleModal(false);
    setHasUnsavedChanges(true);
  };

  // 이메일 발송 핸들러
  const handleEmailSend = (emailData: any) => {
    alert('이메일이 발송되었습니다.');
  };

  const handleChange = (field: keyof SRFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSubmit = async () => {
    // 수정 모드에서는 bookingNo 검증 스킵 (DB에 bookingNo 컬럼이 아닌 bookingId로 관리)
    if (!editId && !formData.bookingNo) { alert('부킹번호를 입력하세요.'); return; }
    if (!formData.shipper) { alert('화주를 입력하세요.'); return; }

    setIsSaving(true);
    try {
      const payload: Record<string, any> = {
        shipperName: formData.shipper,
        shipperAddress: '',
        consigneeName: formData.consignee,
        consigneeAddress: '',
        notifyParty: formData.notifyParty,
        pol: formData.pol,
        pod: formData.pod,
        cargoReadyDate: formData.srDate || null,
        commodityDesc: formData.commodity,
        packageQty: formData.containerQty,
        packageType: formData.containerType,
        grossWeight: formData.grossWeight,
        volume: formData.measurement,
        remark: formData.remarks,
        carrier: formData.carrier,
        vessel: formData.vessel,
        voyage: formData.voyage,
        finalDest: formData.finalDest,
        etd: formData.etd || null,
        eta: formData.eta || null,
        freightTerms: formData.freightTerms,
        hblId: blId || null,
      };

      if (editId) {
        payload.id = editId;
      }

      const res = await fetch('/api/sr/sea', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        setIsNewMode(false);
        alert(editId ? 'S/R이 수정되었습니다.' : `S/R이 등록되었습니다. (${result.srNo})`);
        router.push('/logis/sr/sea');
      } else {
        const err = await res.json();
        alert(`S/R ${editId ? '수정' : '등록'} 실패: ${err.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('S/R 저장 오류:', error);
      alert('S/R 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFillTestData = () => {
    setFormData({
      ...initialFormData,
      bookingNo: 'SB-2026-0001',
      shipper: '삼성전자',
      shipperContact: '02-1234-5678',
      consignee: '삼성아메리카',
      consigneeContact: '+1-123-456-7890',
      notifyParty: 'Same as Consignee',
      carrier: 'MAERSK',
      vessel: 'MAERSK EINDHOVEN',
      voyage: '001E',
      pol: 'KRPUS',
      pod: 'USLAX',
      finalDest: 'Los Angeles, CA',
      etd: '2026-01-20',
      eta: '2026-02-05',
      containerType: '40HC',
      containerQty: 2,
      commodity: '전자제품 (ELECTRONIC PRODUCTS)',
      grossWeight: 15000,
      measurement: 65,
      freightTerms: 'CY-CY',
      remarks: '특별 취급 요청사항 없음',
    });
    setHasUnsavedChanges(true);
  };

  const handleReset = () => {
    if (!confirm('입력한 내용을 모두 초기화하시겠습니까?')) return;
    setFormData(initialFormData);
    setHasUnsavedChanges(false);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header title={editId ? "선적요청 수정 (S/R)" : "선적요청 등록 (S/R)"} subtitle={`Logis > 선적관리 > 선적요청 ${editId ? '수정' : '등록'} (해상)`} onClose={handleCloseClick} />
      <main ref={formRef} className="p-6">
          <div className="flex justify-end items-center mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => { setFormData(initialFormData); setHasUnsavedChanges(false); setIsNewMode(true); }}
                disabled={isNewMode}
                className={`px-4 py-2 rounded-lg ${isNewMode ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-[var(--surface-100)] text-[var(--foreground)] hover:bg-[var(--surface-200)]'}`}
              >신규</button>
              <button onClick={handleReset} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">초기화</button>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]"
              >
                스케줄조회
              </button>
              <button
                onClick={() => setShowEmailModal(true)}
                className="px-4 py-2 bg-[var(--surface-100)] rounded-lg hover:bg-[var(--surface-200)] flex items-center gap-2"
              >
                E-mail
              </button>
              <button onClick={handleSubmit} disabled={isSaving} className="px-6 py-2 font-semibold rounded-lg bg-[var(--surface-100)] text-[var(--foreground)] hover:bg-[var(--surface-200)]">
                {isSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">기본 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">S/R 번호</label><input type="text" value={formData.srNo} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">S/R 일자</label><input type="date" value={formData.srDate} onChange={e => handleChange('srDate', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" /></div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">부킹번호 *</label>
                  <div className="flex gap-2">
                    <input type="text" value={formData.bookingNo} onChange={e => handleChange('bookingNo', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="SB-YYYY-XXXX" />
                    <button onClick={() => setShowBookingModal(true)} className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">찾기</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">운송 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">선사</label><select value={formData.carrier} onChange={e => handleChange('carrier', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"><option value="">선택</option><option value="MAERSK">MAERSK</option><option value="MSC">MSC</option><option value="HMM">HMM</option><option value="EVERGREEN">EVERGREEN</option><option value="ONE">ONE</option></select></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">선명</label><input type="text" value={formData.vessel} onChange={e => handleChange('vessel', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="선박명" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">항차</label><input type="text" value={formData.voyage} onChange={e => handleChange('voyage', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="001E" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">운송조건</label><select value={formData.freightTerms} onChange={e => handleChange('freightTerms', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"><option value="CY-CY">CY-CY</option><option value="CY-CFS">CY-CFS</option><option value="CFS-CY">CFS-CY</option><option value="CFS-CFS">CFS-CFS</option></select></div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">화주/수하인 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">화주 (Shipper) *</label>
                  <div className="flex gap-2">
                    <input type="text" value={formData.shipper} onChange={e => handleChange('shipper', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="화주명" />
                    <button onClick={() => handleCodeSearch('shipper', 'customer')} className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">찾기</button>
                  </div>
                </div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">화주 연락처</label><input type="text" value={formData.shipperContact} onChange={e => handleChange('shipperContact', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="000-0000-0000" /></div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">수하인 (Consignee)</label>
                  <div className="flex gap-2">
                    <input type="text" value={formData.consignee} onChange={e => handleChange('consignee', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="수하인명" />
                    <button onClick={() => handleCodeSearch('consignee', 'customer')} className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">찾기</button>
                  </div>
                </div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">수하인 연락처</label><input type="text" value={formData.consigneeContact} onChange={e => handleChange('consigneeContact', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="+1-000-000-0000" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Notify Party</label><input type="text" value={formData.notifyParty} onChange={e => handleChange('notifyParty', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="통지처" /></div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">구간/일정 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">선적항 (POL)</label>
                  <div className="flex gap-2">
                    <input type="text" value={formData.pol} onChange={e => handleChange('pol', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="KRPUS" />
                    <button onClick={() => handleLocationSearch('pol')} className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">찾기</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">양하항 (POD)</label>
                  <div className="flex gap-2">
                    <input type="text" value={formData.pod} onChange={e => handleChange('pod', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="USLAX" />
                    <button onClick={() => handleLocationSearch('pod')} className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">찾기</button>
                  </div>
                </div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ETD</label><input type="date" value={formData.etd} onChange={e => handleChange('etd', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ETA</label><input type="date" value={formData.eta} onChange={e => handleChange('eta', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">최종목적지</label><input type="text" value={formData.finalDest} onChange={e => handleChange('finalDest', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="최종 목적지" /></div>
              </div>
            </div>

            <div className="card p-6 col-span-2">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">화물 정보</h3>
              <div className="grid grid-cols-4 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">컨테이너 타입</label><select value={formData.containerType} onChange={e => handleChange('containerType', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"><option value="20GP">20GP</option><option value="40GP">40GP</option><option value="40HC">40HC</option><option value="45HC">45HC</option><option value="20RF">20RF</option><option value="40RF">40RF</option></select></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">수량</label><input type="number" value={formData.containerQty} onChange={e => handleChange('containerQty', parseInt(e.target.value) || 0)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">총중량 (KG)</label><input type="number" value={formData.grossWeight} onChange={e => handleChange('grossWeight', parseInt(e.target.value) || 0)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">용적 (CBM)</label><input type="number" value={formData.measurement} onChange={e => handleChange('measurement', parseInt(e.target.value) || 0)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">품명</label><input type="text" value={formData.commodity} onChange={e => handleChange('commodity', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="화물 품명" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">비고</label><input type="text" value={formData.remarks} onChange={e => handleChange('remarks', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="특이사항" /></div>
              </div>
            </div>
          </div>
        </main>
      {/* 스케줄 조회 모달 */}
      <ScheduleSearchModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSelect={handleScheduleSelect}
        type="sea"
      />

      {/* 이메일 모달 */}
      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSend={handleEmailSend}
        documentType="booking"
        documentNo={formData.srNo || '신규'}
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
        type="seaport"
      />

      {/* 부킹 검색 모달 */}
      <BookingSearchModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onSelect={handleBookingSelect}
        type="sea"
      />
    </div>
  );
}

export default function SRRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)] flex items-center justify-center">Loading...</div>}>
      <SRRegisterContent />
    </Suspense>
  );
}
