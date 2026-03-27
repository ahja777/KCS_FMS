'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ScheduleSearchModal from '@/components/ScheduleSearchModal';
import EmailModal from '@/components/EmailModal';
import { UnsavedChangesModal } from '@/components/UnsavedChangesModal';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import {
  CodeSearchModal,
  HSCodeModal,
  type CodeItem,
  type HSCodeItem,
} from '@/components/popup';

const LIST_PATH = '/logis/booking/sea';

interface ContainerItem {
  id: string;
  containerType: string;
  quantity: number;
  sealNo: string;
  tareWeight: number;
  grossWeight: number;
  measurement: number;
  commodity: string;
  hsCode: string;
  remarks: string;
}

interface BookingFormData {
  // 기본정보
  bookingNo: string;
  bookingDate: string;
  bookingType: string;
  serviceType: string;
  incoterms: string;
  freightTerms: string;
  paymentTerms: string;

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
  carrier: string;
  vessel: string;
  voyage: string;
  pol: string;
  polTerminal: string;
  pod: string;
  podTerminal: string;
  finalDest: string;
  etd: string;
  eta: string;
  closingDate: string;
  closingTime: string;

  // B/L 정보
  mblNo: string;
  hblNo: string;
  blType: string;

  // 화물정보
  totalContainers: number;
  totalGrossWeight: number;
  totalMeasurement: number;

  // 기타
  specialRequest: string;
  dangerousGoods: boolean;
  dgClass: string;
  unNumber: string;
  imoClass: string;
  remarks: string;
}

const initialFormData: BookingFormData = {
  bookingNo: '',
  bookingDate: new Date().toISOString().split('T')[0],
  bookingType: 'EXPORT',
  serviceType: 'CY_TO_CY',
  incoterms: 'FOB',
  freightTerms: 'CY-CY',
  paymentTerms: 'PREPAID',

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

  carrier: '',
  vessel: '',
  voyage: '',
  pol: 'KRPUS',
  polTerminal: '',
  pod: '',
  podTerminal: '',
  finalDest: '',
  etd: '',
  eta: '',
  closingDate: '',
  closingTime: '',

  mblNo: '',
  hblNo: '',
  blType: 'ORIGINAL',

  totalContainers: 0,
  totalGrossWeight: 0,
  totalMeasurement: 0,

  specialRequest: '',
  dangerousGoods: false,
  dgClass: '',
  unNumber: '',
  imoClass: '',
  remarks: '',
};

const initialContainerItem: ContainerItem = {
  id: '1',
  containerType: '40HC',
  quantity: 1,
  sealNo: '',
  tareWeight: 0,
  grossWeight: 0,
  measurement: 0,
  commodity: '',
  hsCode: '',
  remarks: '',
};

export default function BookingSeaRegisterPage() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });
  const [formData, setFormData] = useState<BookingFormData>(initialFormData);
  const [containerItems, setContainerItems] = useState<ContainerItem[]>([initialContainerItem]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 팝업 상태
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showSeaportModal, setShowSeaportModal] = useState(false);
  const [showHSCodeModal, setShowHSCodeModal] = useState(false);
  const [currentCustomerField, setCurrentCustomerField] = useState<'shipper' | 'consignee' | 'notify'>('shipper');
  const [currentPortField, setCurrentPortField] = useState<'pol' | 'pod'>('pol');
  const [currentHSCodeIndex, setCurrentHSCodeIndex] = useState(0);

  // 팝업 핸들러
  const handleCustomerSearch = (field: 'shipper' | 'consignee' | 'notify') => {
    setCurrentCustomerField(field);
    setShowCustomerModal(true);
  };

  const handleCustomerSelect = (item: CodeItem) => {
    if (currentCustomerField === 'shipper') {
      setFormData(prev => ({ ...prev, shipperCode: item.code, shipperName: item.name }));
    } else if (currentCustomerField === 'consignee') {
      setFormData(prev => ({ ...prev, consigneeCode: item.code, consigneeName: item.name }));
    } else {
      setFormData(prev => ({ ...prev, notifyPartyCode: item.code, notifyPartyName: item.name }));
    }
    setShowCustomerModal(false);
  };

  const handleSeaportSearch = (field: 'pol' | 'pod') => {
    setCurrentPortField(field);
    setShowSeaportModal(true);
  };

  const handleSeaportSelect = (item: CodeItem) => {
    if (currentPortField === 'pol') {
      setFormData(prev => ({ ...prev, pol: item.code }));
    } else {
      setFormData(prev => ({ ...prev, pod: item.code }));
    }
    setShowSeaportModal(false);
  };

  const handleHSCodeSearch = (index: number) => {
    setCurrentHSCodeIndex(index);
    setShowHSCodeModal(true);
  };

  const handleHSCodeSelect = (item: HSCodeItem) => {
    setContainerItems(prev => {
      const updated = [...prev];
      updated[currentHSCodeIndex] = { ...updated[currentHSCodeIndex], hsCode: item.hsCode };
      return updated;
    });
    setShowHSCodeModal(false);
  };


  // 브라우저 뒤로가기 버튼 처리
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (hasUnsavedChanges) {
        window.history.pushState(null, '', window.location.href);
        setShowCloseModal(true);
      } else {
        router.push(LIST_PATH);
      }
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [router, hasUnsavedChanges]);

  // 마우스 뒤로가기 버튼 처리
  useEffect(() => {
    const handleMouseBack = (event: MouseEvent) => {
      if (event.button === 3 || event.button === 4) {
        event.preventDefault();
        if (hasUnsavedChanges) {
          setShowCloseModal(true);
        } else {
          router.push(LIST_PATH);
        }
      }
    };

    window.addEventListener('mouseup', handleMouseBack);

    return () => {
      window.removeEventListener('mouseup', handleMouseBack);
    };
  }, [router, hasUnsavedChanges]);

  // 화면 닫기 버튼 핸들러
  const handleCloseClick = () => {
    if (hasUnsavedChanges) {
      setShowCloseModal(true);
    } else {
      router.push(LIST_PATH);
    }
  };

  // 저장 안함 (페이지 이탈)
  const handleDiscardChanges = () => {
    setShowCloseModal(false);
    setHasUnsavedChanges(false);
    router.push(LIST_PATH);
  };

  // 저장 후 이동
  const handleSaveAndClose = () => {
    handleSave();
    setShowCloseModal(false);
  };

  // 폼 변경 감지
  useEffect(() => {
    if (formData.shipperName || formData.vessel || formData.carrier) {
      setHasUnsavedChanges(true);
    }
  }, [formData.shipperName, formData.vessel, formData.carrier]);

  const handleInputChange = (field: keyof BookingFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleContainerChange = (index: number, field: keyof ContainerItem, value: string | number) => {
    setContainerItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setTimeout(updateTotals, 0);
  };

  const updateTotals = () => {
    const totals = containerItems.reduce((acc, item) => ({
      containers: acc.containers + item.quantity,
      grossWeight: acc.grossWeight + item.grossWeight,
      measurement: acc.measurement + item.measurement,
    }), { containers: 0, grossWeight: 0, measurement: 0 });

    setFormData(prev => ({
      ...prev,
      totalContainers: totals.containers,
      totalGrossWeight: Math.round(totals.grossWeight * 100) / 100,
      totalMeasurement: Math.round(totals.measurement * 1000) / 1000,
    }));
  };

  const addContainerItem = () => {
    setContainerItems(prev => [...prev, {
      ...initialContainerItem,
      id: Date.now().toString(),
    }]);
  };

  const removeContainerItem = (index: number) => {
    if (containerItems.length > 1) {
      setContainerItems(prev => prev.filter((_, i) => i !== index));
      setTimeout(updateTotals, 0);
    }
  };

  const handleScheduleSelect = (schedule: any) => {
    setFormData(prev => ({
      ...prev,
      carrier: schedule.carrier,
      vessel: schedule.vesselName || schedule.vessel,
      voyage: schedule.voyage || schedule.vesselVoyage,
      pol: schedule.pol,
      pod: schedule.pod,
      etd: schedule.etd,
      eta: schedule.eta,
      closingDate: schedule.closingDate || '',
      closingTime: schedule.closingTime || '',
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
    if (!formData.carrier || !formData.vessel) {
      alert('스케줄 정보를 선택해주세요.');
      return;
    }
    if (formData.totalContainers === 0) {
      alert('컨테이너 정보를 입력해주세요.');
      return;
    }

    setIsSaving(true);

    try {
      const bookingNo = `SB-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

      const bookingData = {
        ...formData,
        bookingNo,
        containerItems,
        createdAt: new Date().toISOString(),
        status: 'draft',
      };

      const existingBookings = JSON.parse(localStorage.getItem('seaBookings') || '[]');
      existingBookings.push(bookingData);
      localStorage.setItem('seaBookings', JSON.stringify(existingBookings));

      setHasUnsavedChanges(false);
      alert(`부킹이 저장되었습니다.\n부킹번호: ${bookingNo}`);
      router.push(LIST_PATH);
    } catch (error) {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    await handleSave();
    alert('B/R 요청이 완료되었습니다.');
  };

  const handleEmailSend = (emailData: any) => {
    console.log('이메일 발송:', emailData);
    alert(`이메일이 발송되었습니다.\n받는 사람: ${emailData.to.join(', ')}\n제목: ${emailData.subject}`);
  };

  const handleGoList = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = confirm('작성 중인 내용이 저장되지 않습니다. 목록으로 이동하시겠습니까?');
      if (!confirmLeave) return;
    }
    router.push(LIST_PATH);
  };

  // 신규 등록
  const handleNew = () => {
    router.push(window.location.pathname);
  };

  // 초기화
  const handleReset = () => {
    if (!confirm('입력한 내용을 모두 초기화하시겠습니까?')) return;
    setFormData(initialFormData);
    setContainerItems([initialContainerItem]);
    setHasUnsavedChanges(false);
  };

  // 삭제 처리
  const handleDelete = () => {
    if (!formData.bookingNo || !confirm('정말 삭제하시겠습니까?')) return;

    try {
      const stored = localStorage.getItem('seaBookings');
      if (stored) {
        const data = JSON.parse(stored);
        const filtered = data.filter((item: any) => item.bookingNo !== formData.bookingNo);
        localStorage.setItem('seaBookings', JSON.stringify(filtered));
      }
    } catch (e) {
      console.error('Failed to delete:', e);
    }

    setHasUnsavedChanges(false);
    alert('부킹이 삭제되었습니다.');
    router.push(LIST_PATH);
  };

  // 테스트 데이터 입력
  const handleFillTestData = () => {
    setFormData({
      ...initialFormData,
      bookingDate: new Date().toISOString().split('T')[0],
      bookingType: 'EXPORT',
      serviceType: 'CY_TO_CY',
      incoterms: 'FOB',
      freightTerms: 'CY-CY',
      paymentTerms: 'PREPAID',
      shipperCode: 'C001',
      shipperName: '삼성전자',
      shipperAddress: '경기도 수원시 영통구 삼성로 129',
      shipperContact: '김담당',
      shipperTel: '02-1234-5678',
      shipperEmail: 'test@samsung.com',
      consigneeCode: 'C002',
      consigneeName: 'Samsung America',
      consigneeAddress: '123 Main St, Los Angeles, CA 90001',
      consigneeContact: 'John Kim',
      consigneeTel: '+1-213-555-0100',
      consigneeEmail: 'john@samsung-usa.com',
      notifyPartyCode: 'C002',
      notifyPartyName: 'Samsung America',
      notifyPartyAddress: '123 Main St, Los Angeles, CA 90001',
      carrier: 'MAERSK',
      vessel: 'MAERSK EINDHOVEN',
      voyage: '001E',
      pol: 'KRPUS',
      polTerminal: 'PNIT',
      pod: 'USLAX',
      podTerminal: 'APM Terminal',
      finalDest: 'Los Angeles',
      etd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      eta: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      closingDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      closingTime: '17:00',
      mblNo: '',
      hblNo: '',
      blType: 'ORIGINAL',
      totalContainers: 2,
      totalGrossWeight: 30000,
      totalMeasurement: 60,
      specialRequest: '',
      dangerousGoods: false,
      dgClass: '',
      unNumber: '',
      imoClass: '',
      remarks: '테스트 데이터입니다.',
    });
    setContainerItems([
      {
        id: '1',
        containerType: '40HC',
        quantity: 1,
        sealNo: 'SEAL001',
        tareWeight: 3800,
        grossWeight: 15000,
        measurement: 30,
        commodity: '전자제품',
        hsCode: '8542.31.0000',
        remarks: '',
      },
      {
        id: '2',
        containerType: '40HC',
        quantity: 1,
        sealNo: 'SEAL002',
        tareWeight: 3800,
        grossWeight: 15000,
        measurement: 30,
        commodity: '전자제품',
        hsCode: '8542.31.0000',
        remarks: '',
      },
    ]);
    setHasUnsavedChanges(true);
    alert('테스트 데이터가 입력되었습니다.');
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="ml-72">
        <Header title="선적부킹 등록 (해상)" subtitle="견적/부킹관리 > 선적부킹관리 (해상) > 예약등록" onClose={handleCloseClick} />
        <main ref={formRef} className="p-6">
          {/* 상단 버튼 */}
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm text-[var(--muted)]">화면 ID: FMS-BK-002</span>
            <div className="flex gap-2">
              <button
                onClick={handleFillTestData}
                className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                테스트데이터
              </button>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="px-4 py-2 bg-[#1E40AF] text-white rounded-lg hover:bg-[#1E3A8A]"
              >
                스케줄조회
              </button>
              <button
                onClick={() => setShowEmailModal(true)}
                className="px-4 py-2 bg-[var(--surface-100)] rounded-lg hover:bg-[var(--surface-200)] flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                E-mail
              </button>
              <button
                onClick={handleNew}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                신규
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                초기화
              </button>
              <button
                onClick={handleGoList}
                className="px-4 py-2 bg-[var(--surface-100)] rounded-lg hover:bg-[var(--surface-200)] flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                목록
              </button>
              {formData.bookingNo && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  삭제
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-[#E8A838] text-[#0C1222] font-semibold rounded-lg hover:bg-[#D4943A] flex items-center gap-2"
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
                <label className="block text-sm font-medium mb-1">부킹번호</label>
                <input
                  type="text"
                  value={formData.bookingNo || '자동생성'}
                  disabled
                  className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">부킹일자</label>
                <input
                  type="date"
                  value={formData.bookingDate}
                  onChange={(e) => handleInputChange('bookingDate', e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">부킹구분</label>
                <select
                  value={formData.bookingType}
                  onChange={(e) => handleInputChange('bookingType', e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
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
                  className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                >
                  <option value="CY_TO_CY">CY to CY</option>
                  <option value="CY_TO_DOOR">CY to Door</option>
                  <option value="DOOR_TO_CY">Door to CY</option>
                  <option value="DOOR_TO_DOOR">Door to Door</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Incoterms</label>
                <select
                  value={formData.incoterms}
                  onChange={(e) => handleInputChange('incoterms', e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                >
                  <option value="EXW">EXW</option>
                  <option value="FCA">FCA</option>
                  <option value="FAS">FAS</option>
                  <option value="FOB">FOB</option>
                  <option value="CFR">CFR</option>
                  <option value="CIF">CIF</option>
                  <option value="DAP">DAP</option>
                  <option value="DPU">DPU</option>
                  <option value="DDP">DDP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Freight Terms</label>
                <select
                  value={formData.freightTerms}
                  onChange={(e) => handleInputChange('freightTerms', e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                >
                  <option value="CY-CY">CY-CY</option>
                  <option value="CY-DOOR">CY-DOOR</option>
                  <option value="DOOR-CY">DOOR-CY</option>
                  <option value="DOOR-DOOR">DOOR-DOOR</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Terms</label>
                <select
                  value={formData.paymentTerms}
                  onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                >
                  <option value="PREPAID">Prepaid</option>
                  <option value="COLLECT">Collect</option>
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
                        className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                        placeholder="업체코드"
                      />
                      <button onClick={() => handleCustomerSearch('shipper')} className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                        찾기
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">업체명 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.shipperName}
                    onChange={(e) => handleInputChange('shipperName', e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="화주명"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">주소</label>
                  <textarea
                    value={formData.shipperAddress}
                    onChange={(e) => handleInputChange('shipperAddress', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg resize-none"
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
                      className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                      placeholder="담당자명"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">연락처</label>
                    <input
                      type="text"
                      value={formData.shipperTel}
                      onChange={(e) => handleInputChange('shipperTel', e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                      placeholder="000-0000-0000"
                    />
                  </div>
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
                        className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                        placeholder="업체코드"
                      />
                      <button onClick={() => handleCustomerSearch('consignee')} className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                        찾기
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">업체명 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.consigneeName}
                    onChange={(e) => handleInputChange('consigneeName', e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="수하인명"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">주소</label>
                  <textarea
                    value={formData.consigneeAddress}
                    onChange={(e) => handleInputChange('consigneeAddress', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg resize-none"
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
                      className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                      placeholder="담당자명"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">연락처</label>
                    <input
                      type="text"
                      value={formData.consigneeTel}
                      onChange={(e) => handleInputChange('consigneeTel', e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                      placeholder="000-0000-0000"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notify Party */}
          <div className="card mb-6">
            <div className="section-header">
              <h3 className="font-bold text-white">Notify Party</h3>
            </div>
            <div className="p-4 grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">업체코드</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.notifyPartyCode}
                    onChange={(e) => handleInputChange('notifyPartyCode', e.target.value)}
                    className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="업체코드"
                  />
                  <button className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                    찾기
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">업체명</label>
                <input
                  type="text"
                  value={formData.notifyPartyName}
                  onChange={(e) => handleInputChange('notifyPartyName', e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="Same as Consignee 또는 업체명"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">주소</label>
                <input
                  type="text"
                  value={formData.notifyPartyAddress}
                  onChange={(e) => handleInputChange('notifyPartyAddress', e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="주소"
                />
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
                <label className="block text-sm font-medium mb-1">선사 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.carrier}
                  onChange={(e) => handleInputChange('carrier', e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="선사"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">선명 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.vessel}
                  onChange={(e) => handleInputChange('vessel', e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="선박명"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">항차</label>
                <input
                  type="text"
                  value={formData.voyage}
                  onChange={(e) => handleInputChange('voyage', e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="001E"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">B/L Type</label>
                <select
                  value={formData.blType}
                  onChange={(e) => handleInputChange('blType', e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                >
                  <option value="ORIGINAL">Original B/L</option>
                  <option value="SEAWAY">Sea Waybill</option>
                  <option value="SURRENDER">Surrendered B/L</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">선적항 (POL)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.pol}
                    onChange={(e) => handleInputChange('pol', e.target.value)}
                    className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="KRPUS"
                  />
                  <button onClick={() => handleSeaportSearch('pol')} className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                    찾기
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">양하항 (POD)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.pod}
                    onChange={(e) => handleInputChange('pod', e.target.value)}
                    className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="USLAX"
                  />
                  <button onClick={() => handleSeaportSearch('pod')} className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                    찾기
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">최종목적지</label>
                <input
                  type="text"
                  value={formData.finalDest}
                  onChange={(e) => handleInputChange('finalDest', e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="Los Angeles, CA"
                />
              </div>
              <div></div>
              <div>
                <label className="block text-sm font-medium mb-1">ETD (출항예정일)</label>
                <input
                  type="date"
                  value={formData.etd}
                  onChange={(e) => handleInputChange('etd', e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ETA (도착예정일)</label>
                <input
                  type="date"
                  value={formData.eta}
                  onChange={(e) => handleInputChange('eta', e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">서류마감일</label>
                <input
                  type="date"
                  value={formData.closingDate}
                  onChange={(e) => handleInputChange('closingDate', e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">마감시간</label>
                <input
                  type="time"
                  value={formData.closingTime}
                  onChange={(e) => handleInputChange('closingTime', e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* 컨테이너 정보 */}
          <div className="card mb-6">
            <div className="section-header flex justify-between items-center">
              <h3 className="font-bold text-white">컨테이너 정보</h3>
              <button
                onClick={addContainerItem}
                className="px-3 py-1 bg-white/20 text-white text-sm rounded hover:bg-white/30"
              >
                + 컨테이너 추가
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--surface-100)]">
                  <tr>
                    <th className="p-3 text-left text-sm">No</th>
                    <th className="p-3 text-left text-sm">컨테이너 타입</th>
                    <th className="p-3 text-center text-sm">수량</th>
                    <th className="p-3 text-left text-sm">Seal No.</th>
                    <th className="p-3 text-left text-sm">품명 (Commodity)</th>
                    <th className="p-3 text-left text-sm">HS Code</th>
                    <th className="p-3 text-right text-sm">총중량 (kg)</th>
                    <th className="p-3 text-right text-sm">용적 (CBM)</th>
                    <th className="p-3 text-center text-sm">삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {containerItems.map((item, index) => (
                    <tr key={item.id} className="border-t border-[var(--border)]">
                      <td className="p-2 text-center">{index + 1}</td>
                      <td className="p-2">
                        <select
                          value={item.containerType}
                          onChange={(e) => handleContainerChange(index, 'containerType', e.target.value)}
                          className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                        >
                          <option value="20GP">20GP</option>
                          <option value="40GP">40GP</option>
                          <option value="40HC">40HC</option>
                          <option value="45HC">45HC</option>
                          <option value="20RF">20RF (냉동)</option>
                          <option value="40RF">40RF (냉동)</option>
                          <option value="20OT">20OT (오픈탑)</option>
                          <option value="40OT">40OT (오픈탑)</option>
                          <option value="20FR">20FR (플랫랙)</option>
                          <option value="40FR">40FR (플랫랙)</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={item.quantity || ''}
                          onChange={(e) => handleContainerChange(index, 'quantity', Number(e.target.value))}
                          className="w-20 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-center"
                          min="1"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.sealNo}
                          onChange={(e) => handleContainerChange(index, 'sealNo', e.target.value)}
                          className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                          placeholder="Seal No."
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.commodity}
                          onChange={(e) => handleContainerChange(index, 'commodity', e.target.value)}
                          className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                          placeholder="품명"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.hsCode}
                          onChange={(e) => handleContainerChange(index, 'hsCode', e.target.value)}
                          className="w-24 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                          placeholder="0000.00"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={item.grossWeight || ''}
                          onChange={(e) => handleContainerChange(index, 'grossWeight', Number(e.target.value))}
                          className="w-28 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={item.measurement || ''}
                          onChange={(e) => handleContainerChange(index, 'measurement', Number(e.target.value))}
                          className="w-24 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                          min="0"
                          step="0.001"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => removeContainerItem(index)}
                          disabled={containerItems.length === 1}
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
                    <td colSpan={2} className="p-3 text-right">합계</td>
                    <td className="p-3 text-center">{formData.totalContainers}</td>
                    <td colSpan={3}></td>
                    <td className="p-3 text-right">{formData.totalGrossWeight.toLocaleString()} kg</td>
                    <td className="p-3 text-right">{formData.totalMeasurement.toFixed(3)} CBM</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 위험물 / 특수 화물 */}
          <div className="card mb-6">
            <div className="section-header">
              <h3 className="font-bold text-white">위험물 / 특수 화물</h3>
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
                    <label className="block text-sm font-medium mb-1">IMO Class</label>
                    <select
                      value={formData.imoClass}
                      onChange={(e) => handleInputChange('imoClass', e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
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
                      className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                      placeholder="UN0000"
                    />
                  </div>
                </>
              )}
              <div className="col-span-4">
                <label className="block text-sm font-medium mb-1">특수 요청사항</label>
                <input
                  type="text"
                  value={formData.specialRequest}
                  onChange={(e) => handleInputChange('specialRequest', e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="예: REEFER(냉동), OOG(규격외), HAZMAT 등"
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
                className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg resize-none"
                placeholder="기타 요청사항이나 메모를 입력하세요..."
              />
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="flex justify-center gap-3">
            <button
              onClick={handleGoList}
              className="px-6 py-3 bg-[var(--surface-100)] rounded-lg hover:bg-[var(--surface-200)]"
            >
              목록
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-3 bg-[#E8A838] text-[#0C1222] font-semibold rounded-lg hover:bg-[#D4943A]"
            >
              {isSaving ? '저장중...' : '임시저장'}
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-3 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-[#1D4ED8]"
            >
              B/R 요청
            </button>
          </div>
        </main>
      </div>

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
        documentNo={formData.bookingNo || '신규'}
      />

      {/* 저장 확인 모달 */}
      <UnsavedChangesModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onDiscard={handleDiscardChanges}
        onSave={handleSaveAndClose}
        message="작성 중인 내용이 저장되지 않습니다. 저장하시겠습니까?"
      />

      {/* 거래처 검색 팝업 */}
      <CodeSearchModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSelect={handleCustomerSelect}
        codeType="customer"
        title={currentCustomerField === 'shipper' ? '화주 조회' : currentCustomerField === 'consignee' ? '수하인 조회' : 'Notify Party 조회'}
      />

      {/* 항구 검색 팝업 */}
      <CodeSearchModal
        isOpen={showSeaportModal}
        onClose={() => setShowSeaportModal(false)}
        onSelect={handleSeaportSelect}
        codeType="seaport"
        title={currentPortField === 'pol' ? '선적항 (POL) 조회' : '양하항 (POD) 조회'}
      />

      {/* HS코드 검색 팝업 */}
      <HSCodeModal
        isOpen={showHSCodeModal}
        onClose={() => setShowHSCodeModal(false)}
        onSelect={handleHSCodeSelect}
      />
    </div>
  );
}
