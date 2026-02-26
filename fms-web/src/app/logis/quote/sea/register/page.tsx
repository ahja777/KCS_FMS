'use client';

import { useState, useRef, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import ScheduleSearchModal from '@/components/ScheduleSearchModal';
import FreightSearchModal from '@/components/FreightSearchModal';
import CorporateRateSearchModal from '@/components/popup/CorporateRateSearchModal';
import EmailModal from '@/components/EmailModal';
import { UnsavedChangesModal, useUnsavedChanges } from '@/components/UnsavedChangesModal';
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
import { ReportPrintModal } from '@/components/reports';
import SearchIconButton from '@/components/SearchIconButton';

// localStorage 키
const STORAGE_KEY = 'fms_quote_sea_data';

// 필수 항목 뱃지 컴포넌트
const RequiredBadge = () => (
  <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-red-500/20 text-red-400 rounded">
    필수
  </span>
);

// 운임정보 타입 (디자인 문서 기준)
interface FreightItem {
  id: string;
  freightType: string;
  freightCode: string;
  currency: string;
  exchangeRate: number;
  // Rate Per
  rateMin: number;
  rateBL: number;
  rateRTon: number;
  // Container DRY
  containerDry20: number;
  containerDry40: number;
  // Container Type A/B/C (Code, Rate)
  containerTypeACode: string;
  containerTypeARate: number;
  containerTypeBCode: string;
  containerTypeBRate: number;
  containerTypeCCode: string;
  containerTypeCRate: number;
  // Bulk
  bulkRate: number;
  vatYn: 'Y' | 'N';
  unitPrice: number;
  amountForeign: number;
  amountKrw: number;
  vat: number;
  totalAmount: number;
}

// 운송요율 타입
interface TransportRateItem {
  id: string;
  freightCode: string;
  origin: string;
  originName: string;
  destination: string;
  destinationName: string;
  lcl: number;
  ft20: number;
  ft40: number;
  etc: number;
  manager: string;
  phone: string;
  fax: string;
  email: string;
  vatYn: 'Y' | 'N';
  unitPrice: number;
  amount: number;
  vat: number;
  totalAmount: number;
}

function QuoteSeaRegisterPageContent() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });
  const searchParams = useSearchParams();
  const quoteId = searchParams.get('quoteId');
  const isEditMode = !!quoteId;
  const today = new Date().toISOString().split('T')[0];

  // 기본정보
  const [basicInfo, setBasicInfo] = useState({
    quoteNo: '', // 자동생성
    registrationDate: today,
    exportImport: 'export',
    businessType: 'LOCAL',
    tradeTerms: 'CFR',
    customerCode: '',
    customerName: '',
    customerManager: '',
    customerPhone: '',
    senderName: '',
    senderManager: '',
    senderPhone: '',
    origin: '',
    originName: '',
    inputEmployee: '홍길동',
    toBy1: '',
    toBy1Name: '',
    toBy2: '',
    toBy2Name: '',
    destination: '',
    destinationName: '',
    carrier: '',
    carrierName: '',
    carrierManager: '',
    carrierTel: '',
    carrierFax: '',
    cyCfs: '',
    cyCfsName: '',
    cyCfsManager: '',
    cyCfsTel: '',
    cyCfsFax: '',
    vesselName: '',
    voyageNo: '',
    etd: '',
    eta: '',
    validFrom: today,
    validTo: '',
  });

  // 화물정보
  const [cargoInfo, setCargoInfo] = useState({
    cargoType: 'container',
    vehicleType: '',
    vehicleCount: 0,
    weight: 0,
    volume: 0,
    commodity: '',
    packageCount: 0,
    region: '',
    specialCargo: false,
    tonnage: 0,
  });

  // 운임정보 목록
  const [freightItems, setFreightItems] = useState<FreightItem[]>([
    {
      id: '1',
      freightType: 'SFC',
      freightCode: 'SFC',
      currency: 'USD',
      exchangeRate: 1300,
      rateMin: 0,
      rateBL: 0,
      rateRTon: 0,
      containerDry20: 0,
      containerDry40: 0,
      containerTypeACode: '20FH',
      containerTypeARate: 0,
      containerTypeBCode: '20RF',
      containerTypeBRate: 0,
      containerTypeCCode: '40DR',
      containerTypeCRate: 0,
      bulkRate: 0,
      vatYn: 'Y',
      unitPrice: 0,
      amountForeign: 0,
      amountKrw: 0,
      vat: 0,
      totalAmount: 0,
    },
  ]);

  // 운송요율 목록
  const [transportRates, setTransportRates] = useState<TransportRateItem[]>([]);

  // 에러 상태
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 팝업 모달 상태
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showFreightModal, setShowFreightModal] = useState(false);
  const [showCorporateRateModal, setShowCorporateRateModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // 코드/위치 검색 팝업 상태
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [currentField, setCurrentField] = useState<string>('');
  const [currentCodeType, setCurrentCodeType] = useState<CodeType>('customer');
  const [currentLocationType, setCurrentLocationType] = useState<'airport' | 'seaport' | 'city'>('seaport');

  // 출력 모달 상태
  const [showPrintModal, setShowPrintModal] = useState(false);

  // 변경사항 추적
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 신규 입력 모드 (신규버튼 비활성화 제어)
  const [isNewMode, setIsNewMode] = useState(!isEditMode);

  // useScreenClose 훅
  const {
    showModal: showCloseModal,
    handleCloseClick,
    handleModalClose,
    handleDiscard: handleDiscardChanges,
  } = useScreenClose({
    hasChanges: hasUnsavedChanges,
    listPath: LIST_PATHS.QUOTE_SEA,
  });

  // 수정 모드일 경우 데이터 로드
  useEffect(() => {
    if (!quoteId) return;
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/quote/sea?quoteId=${quoteId}`);
        if (!response.ok) return;
        const data = await response.json();

        // 날짜 헬퍼: null/undefined -> ''
        const formatDate = (v: string | null | undefined) => v ? v.split('T')[0] : '';

        setBasicInfo(prev => ({
          ...prev,
          quoteNo: data.quoteNo || '',
          registrationDate: formatDate(data.quoteDate) || today,
          tradeTerms: data.incoterms || 'CFR',
          customerCode: data.customerId ? String(data.customerId) : '',
          customerName: data.shipper || '',
          senderName: data.consignee || '',
          origin: data.pol || '',
          destination: data.pod || '',
          carrier: data.carrierCd || '',
          carrierName: data.carrier || '',
          validFrom: formatDate(data.validFrom) || today,
          validTo: formatDate(data.validTo),
        }));

        setCargoInfo(prev => ({
          ...prev,
          vehicleType: data.containerType || '',
          vehicleCount: data.containerQty || 0,
          commodity: data.remark || '',
        }));

        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      }
    };
    fetchData();
  }, [quoteId, today]);

  // 폼 변경 감지
  useEffect(() => {
    if (basicInfo.customerName || basicInfo.origin || basicInfo.destination) {
      setHasUnsavedChanges(true);
    }
  }, [basicInfo.customerName, basicInfo.origin, basicInfo.destination]);

  // 스케줄 선택 핸들러
  const handleScheduleSelect = (schedule: any) => {
    // 선택한 스케줄 정보로 폼 데이터 업데이트
    setBasicInfo(prev => ({
      ...prev,
      carrier: schedule.carrierCode || '',
      carrierName: schedule.carrier || '',
      origin: schedule.pol || '',
      originName: schedule.polName || '',
      destination: schedule.pod || '',
      destinationName: schedule.podName || '',
    }));
    alert(`선박 "${schedule.vesselName}" (${schedule.voyageNo}) 스케줄이 선택되었습니다.`);
  };

  // 운임 선택 핸들러
  const handleFreightSelect = (freight: any) => {
    // 선택한 운임 정보로 운임 목록에 추가
    const newFreightItem: FreightItem = {
      id: Date.now().toString(),
      freightType: 'SEA',
      freightCode: 'O/F',
      currency: freight.currency,
      exchangeRate: 1350,
      rateMin: 0,
      rateBL: 0,
      rateRTon: 0,
      containerDry20: freight.containerType === '20GP' ? freight.oceanFreight : 0,
      containerDry40: freight.containerType === '40GP' ? freight.oceanFreight : 0,
      containerTypeACode: '20FH',
      containerTypeARate: 0,
      containerTypeBCode: '20RF',
      containerTypeBRate: 0,
      containerTypeCCode: '40DR',
      containerTypeCRate: freight.containerType === '40HC' ? freight.oceanFreight : 0,
      bulkRate: freight.containerType === 'LCL' ? freight.oceanFreight : 0,
      vatYn: 'N',
      unitPrice: freight.total,
      amountForeign: freight.total,
      amountKrw: freight.total * 1350,
      vat: 0,
      totalAmount: freight.total * 1350,
    };
    setFreightItems(prev => [...prev, newFreightItem]);
    alert(`"${freight.carrier}" 운임 (${freight.containerType}: ${freight.total} ${freight.currency})이 추가되었습니다.`);
  };

  // 기업운임 선택 핸들러
  const handleCorporateRateSelect = (selectedRates: any[]) => {
    const newItems: FreightItem[] = selectedRates.map((rate, idx) => ({
      id: (Date.now() + idx).toString(),
      freightType: rate.FREIGHT_TYPE || 'OFC',
      freightCode: rate.FREIGHT_CD || 'O/F',
      currency: rate.CURRENCY_CD || 'USD',
      exchangeRate: 1350,
      rateMin: Number(rate.RATE_MIN) || 0,
      rateBL: Number(rate.RATE_BL) || 0,
      rateRTon: Number(rate.RATE_RTON) || 0,
      containerDry20: Number(rate.CNTR_DRY_20) || 0,
      containerDry40: Number(rate.CNTR_DRY_40) || 0,
      containerTypeACode: rate.CNTR_TYPE_A_CD || '',
      containerTypeARate: Number(rate.CNTR_TYPE_A_RATE) || 0,
      containerTypeBCode: rate.CNTR_TYPE_B_CD || '',
      containerTypeBRate: Number(rate.CNTR_TYPE_B_RATE) || 0,
      containerTypeCCode: rate.CNTR_TYPE_C_CD || '',
      containerTypeCRate: Number(rate.CNTR_TYPE_C_RATE) || 0,
      bulkRate: Number(rate.RATE_BULK) || 0,
      vatYn: 'N' as const,
      unitPrice: 0,
      amountForeign: 0,
      amountKrw: 0,
      vat: 0,
      totalAmount: 0,
    }));
    setFreightItems(prev => [...prev, ...newItems]);
    setHasUnsavedChanges(true);
    alert(`기업운임 ${newItems.length}건이 운임정보에 추가되었습니다.`);
  };

  // 이메일 발송 핸들러
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
    if (currentField === 'customer') {
      setBasicInfo(prev => ({
        ...prev,
        customerCode: item.code,
        customerName: item.name,
      }));
    } else if (currentField === 'customerManager') {
      setBasicInfo(prev => ({
        ...prev,
        customerManager: item.name,
      }));
    } else if (currentField === 'carrier') {
      setBasicInfo(prev => ({
        ...prev,
        carrier: item.code,
        carrierName: item.name,
      }));
    } else if (currentField === 'cyCfs') {
      setBasicInfo(prev => ({
        ...prev,
        cyCfs: item.code,
        cyCfsName: item.name,
      }));
    } else if (currentField === 'region') {
      setCargoInfo(prev => ({
        ...prev,
        region: item.name,
      }));
    }
    setShowCodeModal(false);
  };

  // 위치 검색 버튼 클릭
  const handleLocationSearch = (field: string, type: 'airport' | 'seaport' | 'city') => {
    setCurrentField(field);
    setCurrentLocationType(type);
    setShowLocationModal(true);
  };

  // 위치 선택 완료
  const handleLocationSelect = (item: LocationItem) => {
    setBasicInfo(prev => ({
      ...prev,
      [currentField]: item.code,
      [`${currentField}Name`]: item.nameKr,
    }));
    setShowLocationModal(false);
  };

  // 에러 메시지 표시 컴포넌트
  const FieldError = ({ field }: { field: string }) => {
    const errorMsg = errors[field];
    if (!errorMsg) return null;
    return <p className="text-red-400 text-xs mt-1">{errorMsg}</p>;
  };

  // 유효성 검사 함수
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!basicInfo.registrationDate) {
      newErrors.registrationDate = '등록일자는 필수 입력 항목입니다';
    }
    if (!basicInfo.customerName) {
      newErrors.customerName = '거래처는 필수 입력 항목입니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 에러 개수 계산
  const errorCount = Object.keys(errors).length;

  // 운임정보 추가
  const handleAddFreight = () => {
    const newItem: FreightItem = {
      id: Date.now().toString(),
      freightType: '',
      freightCode: '',
      currency: 'USD',
      exchangeRate: 1300,
      rateMin: 0,
      rateBL: 0,
      rateRTon: 0,
      containerDry20: 0,
      containerDry40: 0,
      containerTypeACode: '',
      containerTypeARate: 0,
      containerTypeBCode: '',
      containerTypeBRate: 0,
      containerTypeCCode: '',
      containerTypeCRate: 0,
      bulkRate: 0,
      vatYn: 'Y',
      unitPrice: 0,
      amountForeign: 0,
      amountKrw: 0,
      vat: 0,
      totalAmount: 0,
    };
    setFreightItems([...freightItems, newItem]);
  };

  // 운임정보 삭제
  const handleDeleteFreight = (ids: string[]) => {
    setFreightItems(freightItems.filter(item => !ids.includes(item.id)));
  };

  // 운송요율 추가
  const handleAddTransportRate = () => {
    const newItem: TransportRateItem = {
      id: Date.now().toString(),
      freightCode: '',
      origin: '',
      originName: '',
      destination: '',
      destinationName: '',
      lcl: 0,
      ft20: 0,
      ft40: 0,
      etc: 0,
      manager: '',
      phone: '',
      fax: '',
      email: '',
      vatYn: 'Y',
      unitPrice: 0,
      amount: 0,
      vat: 0,
      totalAmount: 0,
    };
    setTransportRates([...transportRates, newItem]);
  };

  // 저장
  const handleSave = async () => {
    if (!validate()) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    // DB API로 저장
    const quoteData = {
      id: isEditMode ? quoteId : undefined,
      quoteDate: basicInfo.registrationDate,
      requestNo: '',
      customerId: basicInfo.customerCode || null,
      consignee: basicInfo.senderName || '',
      pol: basicInfo.origin || '',
      pod: basicInfo.destination || '',
      carrierCd: basicInfo.carrier || null,
      containerType: cargoInfo.vehicleType || '40HC',
      containerQty: cargoInfo.vehicleCount || 1,
      incoterms: basicInfo.tradeTerms || 'CFR',
      validFrom: basicInfo.validFrom || null,
      validTo: basicInfo.validTo || null,
      totalAmount: freightItems.reduce((sum, item) => sum + item.totalAmount, 0) || 0,
      currency: 'USD',
      status: 'draft',
      remark: cargoInfo.commodity || '',
    };

    try {
      const response = await fetch('/api/quote/sea', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteData),
      });

      if (!response.ok) throw new Error('Failed to save');

      const result = await response.json();
      setHasUnsavedChanges(false);
      setIsNewMode(false); // 저장 완료 후 신규버튼 활성화
      alert(isEditMode ? '견적이 수정되었습니다.' : `견적이 저장되었습니다. (${result.quoteNo || ''})`);
      router.push(LIST_PATHS.QUOTE_SEA);
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 목록으로
  const handleGoList = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = confirm('작성 중인 내용이 저장되지 않습니다. 목록으로 이동하시겠습니까?');
      if (!confirmLeave) return;
    }
    router.push(LIST_PATHS.QUOTE_SEA);
  };

  // 신규 등록
  const handleNew = () => {
    router.push(window.location.pathname);
  };

  // 삭제 처리
  const handleDelete = async () => {
    if (!quoteId || !confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/quote/sea?ids=${quoteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      setHasUnsavedChanges(false);
      alert('견적이 삭제되었습니다.');
      router.push(LIST_PATHS.QUOTE_SEA);
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  // 초기화
  const handleReset = () => {
    if (!confirm('입력한 내용을 모두 초기화하시겠습니까?')) return;
    setBasicInfo({
      quoteNo: '',
      registrationDate: new Date().toISOString().split('T')[0],
      exportImport: 'export',
      businessType: 'LOCAL',
      tradeTerms: 'CFR',
      customerCode: '',
      customerName: '',
      customerManager: '',
      customerPhone: '',
      senderName: '',
      senderManager: '',
      senderPhone: '',
      origin: '',
      originName: '',
      inputEmployee: '홍길동',
      toBy1: '',
      toBy1Name: '',
      toBy2: '',
      toBy2Name: '',
      destination: '',
      destinationName: '',
      carrier: '',
      carrierName: '',
      carrierManager: '',
      carrierTel: '',
      carrierFax: '',
      cyCfs: '',
      cyCfsName: '',
      cyCfsManager: '',
      cyCfsTel: '',
      cyCfsFax: '',
      vesselName: '',
      voyageNo: '',
      etd: '',
      eta: '',
      validFrom: new Date().toISOString().split('T')[0],
      validTo: '',
    });
    setFreightItems([]);
    setTransportRates([]);
    setErrors({});
    setHasUnsavedChanges(false);
  };

  // 테스트 데이터 입력
  const handleFillTestData = () => {
    setBasicInfo({
      quoteNo: '',
      registrationDate: new Date().toISOString().split('T')[0],
      exportImport: 'export',
      businessType: 'LOCAL',
      tradeTerms: 'FOB',
      customerCode: '1', // CUSTOMER_ID (숫자)
      customerName: '삼성전자',
      customerManager: '김담당',
      customerPhone: '02-1234-5678',
      senderName: 'Samsung Electronics',
      senderManager: 'John Kim',
      senderPhone: '+82-2-1234-5678',
      origin: 'KRPUS',
      originName: '부산항',
      inputEmployee: '홍길동',
      toBy1: '',
      toBy1Name: '',
      toBy2: '',
      toBy2Name: '',
      destination: 'USLAX',
      destinationName: '로스앤젤레스',
      carrier: 'MAERSK',
      carrierName: '머스크라인',
      carrierManager: '이선사',
      carrierTel: '02-9876-5432',
      carrierFax: '02-9876-5433',
      cyCfs: '',
      cyCfsName: '',
      cyCfsManager: '',
      cyCfsTel: '',
      cyCfsFax: '',
      vesselName: 'MAERSK EINDHOVEN',
      voyageNo: '001E',
      etd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      eta: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      validFrom: new Date().toISOString().split('T')[0],
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setFreightItems([
      {
        id: '1',
        freightType: 'O/F',
        freightCode: 'O/F',
        currency: 'USD',
        exchangeRate: 1350,
        rateMin: 10,
        rateBL: 20,
        rateRTon: 30,
        containerDry20: 1500,
        containerDry40: 2800,
        containerTypeACode: '20FH',
        containerTypeARate: 10,
        containerTypeBCode: '20RF',
        containerTypeBRate: 20,
        containerTypeCCode: '40DR',
        containerTypeCRate: 30,
        bulkRate: 5,
        vatYn: 'N',
        unitPrice: 3000,
        amountForeign: 3000,
        amountKrw: 4050000,
        vat: 0,
        totalAmount: 4050000,
      },
    ]);
    setHasUnsavedChanges(true);
    alert('테스트 데이터가 입력되었습니다.');
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header title="견적관리 등록 (해상)" subtitle="물류견적관리  견적관리 (해상) 
        onClose={() => setShowCloseModal(true)}> 견적관리 등록 (해상)" onClose={handleCloseClick} />

      <main ref={formRef} className="p-6">
          {/* 상단 버튼 */}
          <div className="sticky top-20 z-20 bg-white py-2 border-b border-gray-200 flex justify-end items-center mb-6">
            <div className="flex items-center gap-4">
              {/* 에러 카운트 표시 */}
              {errorCount > 0 && (
                <div className="flex items-center gap-2 text-red-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-sm font-medium">{errorCount}개의 필수 항목이 입력되지 않았습니다</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                {/* 스케줄조회 버튼 */}
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)] transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  스케줄조회
                </button>

                {/* 운임조회 버튼 */}
                <button
                  onClick={() => setShowFreightModal(true)}
                  className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)] transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  운임조회
                </button>

                {/* 기업운임조회 버튼 */}
                <button
                  onClick={() => setShowCorporateRateModal(true)}
                  className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)] transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  기업운임조회
                </button>

                {/* E-mail 버튼 */}
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)] transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  E-mail
                </button>

                {/* 출력 버튼 (수정 모드 또는 저장 완료 시에만 활성화) */}
                <button
                  onClick={() => setShowPrintModal(true)}
                  disabled={isNewMode}
                  className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  출력
                </button>

                {/* 신규 버튼 */}
                <button
                  onClick={handleNew}
                  disabled={isNewMode}
                  className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  신규
                </button>

                {/* 초기화 버튼 */}
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)] transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  초기화
                </button>

                {/* 목록 버튼 */}
                <button
                  onClick={handleGoList}
                  className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)] transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  목록
                </button>

                {/* 삭제 버튼 (수정 모드에서만) */}
                {isEditMode && (
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)] transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    삭제
                  </button>
                )}

                {/* 저장/수정 버튼 */}
                <button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {isEditMode ? '수정' : '저장'}
                </button>
              </div>
            </div>
          </div>

          {/* 필수 항목 안내 박스 */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-400">필수 입력 항목 (2개)</p>
                <p className="text-xs text-red-400/80 mt-1">
                  등록일자, 거래처는 필수 입력 항목입니다.
                </p>
              </div>
            </div>
          </div>

          {/* 기본정보 섹션 */}
          <div className="card mb-6">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#059669] rounded-full"></span>
                기본정보
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-4 gap-4">
                {/* 1행 */}
                <div>
                  <label className="block text-sm font-medium mb-1">견적서 번호</label>
                  <input
                    type="text"
                    value={basicInfo.quoteNo || '자동생성'}
                    disabled
                    className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-[var(--muted)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">등록일자 <RequiredBadge /></label>
                  <input
                    type="date"
                    value={basicInfo.registrationDate}
                    onChange={(e) => setBasicInfo({ ...basicInfo, registrationDate: e.target.value })}
                    className={`w-full h-[38px] px-3 bg-[var(--surface-50)] border rounded-lg ${
                      errors.registrationDate ? 'border-red-500' : 'border-[var(--border)]'
                    }`}
                  />
                  <FieldError field="registrationDate" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">수출입구분</label>
                  <select
                    value={basicInfo.exportImport}
                    onChange={(e) => setBasicInfo({ ...basicInfo, exportImport: e.target.value })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  >
                    <option value="export">수출</option>
                    <option value="import">수입</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">영업구분</label>
                  <select
                    value={basicInfo.businessType}
                    onChange={(e) => setBasicInfo({ ...basicInfo, businessType: e.target.value })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  >
                    <option value="LOCAL">LOCAL</option>
                    <option value="CROSS">CROSS</option>
                    <option value="THIRD">THIRD</option>
                  </select>
                </div>

                {/* 2행 */}
                <div>
                  <label className="block text-sm font-medium mb-1">무역조건</label>
                  <select
                    value={basicInfo.tradeTerms}
                    onChange={(e) => setBasicInfo({ ...basicInfo, tradeTerms: e.target.value })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  >
                    <option value="CFR">CFR</option>
                    <option value="CIF">CIF</option>
                    <option value="FOB">FOB</option>
                    <option value="EXW">EXW</option>
                    <option value="DDP">DDP</option>
                    <option value="DAP">DAP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">거래처 <RequiredBadge /></label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      type="text"
                      value={basicInfo.customerName}
                      onChange={(e) => setBasicInfo({ ...basicInfo, customerName: e.target.value })}
                      className={`flex-1 h-[38px] px-3 bg-[var(--surface-50)] border rounded-lg ${
                        errors.customerName ? 'border-red-500' : 'border-[var(--border)]'
                      }`}
                      style={{ flex: 1, minWidth: 0 }}
                      placeholder="거래처명"
                    />
                    <SearchIconButton onClick={() => handleCodeSearch('customer', 'customer')} />
                  </div>
                  <FieldError field="customerName" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">담당자</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      type="text"
                      value={basicInfo.customerManager}
                      onChange={(e) => setBasicInfo({ ...basicInfo, customerManager: e.target.value })}
                      className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                      style={{ flex: 1, minWidth: 0 }}
                      placeholder="담당자명"
                    />
                    <SearchIconButton onClick={() => handleCodeSearch('customerManager', 'manager')} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">전화번호</label>
                  <input
                    type="text"
                    value={basicInfo.customerPhone}
                    onChange={(e) => setBasicInfo({ ...basicInfo, customerPhone: e.target.value })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="000-0000-0000"
                  />
                </div>

                {/* 3행 */}
                <div>
                  <label className="block text-sm font-medium mb-1">출발지</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={basicInfo.origin}
                      onChange={(e) => setBasicInfo({ ...basicInfo, origin: e.target.value })}
                      className="w-[80px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm"
                      placeholder="코드"
                    />
                    <SearchIconButton onClick={() => handleLocationSearch('origin', 'seaport')} />
                    <input
                      type="text"
                      value={basicInfo.originName || ''}
                      readOnly
                      className="flex-1 h-[32px] px-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-500"
                      placeholder="이름"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">TO BY 1</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={basicInfo.toBy1}
                      onChange={(e) => setBasicInfo({ ...basicInfo, toBy1: e.target.value })}
                      className="w-[80px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm"
                      placeholder="코드"
                    />
                    <SearchIconButton onClick={() => handleLocationSearch('toBy1', 'seaport')} />
                    <input
                      type="text"
                      value={basicInfo.toBy1Name || ''}
                      readOnly
                      className="flex-1 h-[32px] px-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-500"
                      placeholder="이름"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">TO BY 2</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={basicInfo.toBy2}
                      onChange={(e) => setBasicInfo({ ...basicInfo, toBy2: e.target.value })}
                      className="w-[80px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm"
                      placeholder="코드"
                    />
                    <SearchIconButton onClick={() => handleLocationSearch('toBy2', 'seaport')} />
                    <input
                      type="text"
                      value={basicInfo.toBy2Name || ''}
                      readOnly
                      className="flex-1 h-[32px] px-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-500"
                      placeholder="이름"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">도착지</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={basicInfo.destination}
                      onChange={(e) => setBasicInfo({ ...basicInfo, destination: e.target.value })}
                      className="w-[80px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm"
                      placeholder="코드"
                    />
                    <SearchIconButton onClick={() => handleLocationSearch('destination', 'seaport')} />
                    <input
                      type="text"
                      value={basicInfo.destinationName || ''}
                      readOnly
                      className="flex-1 h-[32px] px-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-500"
                      placeholder="이름"
                    />
                  </div>
                </div>

                {/* 4행 - 선사 정보 */}
                <div>
                  <label className="block text-sm font-medium mb-1">선사</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      type="text"
                      value={basicInfo.carrierName}
                      onChange={(e) => setBasicInfo({ ...basicInfo, carrierName: e.target.value })}
                      className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                      style={{ flex: 1, minWidth: 0 }}
                      placeholder="선사명"
                    />
                    <SearchIconButton onClick={() => handleCodeSearch('carrier', 'carrier')} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">선사 담당자</label>
                  <input
                    type="text"
                    value={basicInfo.carrierManager}
                    onChange={(e) => setBasicInfo({ ...basicInfo, carrierManager: e.target.value })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="담당자명"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">선사 Tel</label>
                  <input
                    type="text"
                    value={basicInfo.carrierTel}
                    onChange={(e) => setBasicInfo({ ...basicInfo, carrierTel: e.target.value })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="000-0000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">선사 Fax</label>
                  <input
                    type="text"
                    value={basicInfo.carrierFax}
                    onChange={(e) => setBasicInfo({ ...basicInfo, carrierFax: e.target.value })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="000-0000-0000"
                  />
                </div>

                {/* 5행 - CY/CFS 정보 */}
                <div>
                  <label className="block text-sm font-medium mb-1">CY/CFS</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      type="text"
                      value={basicInfo.cyCfsName}
                      onChange={(e) => setBasicInfo({ ...basicInfo, cyCfsName: e.target.value })}
                      className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                      style={{ flex: 1, minWidth: 0 }}
                      placeholder="CY/CFS명"
                    />
                    <SearchIconButton onClick={() => handleCodeSearch('cyCfs', 'customer')} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CY/CFS 담당자</label>
                  <input
                    type="text"
                    value={basicInfo.cyCfsManager}
                    onChange={(e) => setBasicInfo({ ...basicInfo, cyCfsManager: e.target.value })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="담당자명"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CY/CFS Tel</label>
                  <input
                    type="text"
                    value={basicInfo.cyCfsTel}
                    onChange={(e) => setBasicInfo({ ...basicInfo, cyCfsTel: e.target.value })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="000-0000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CY/CFS Fax</label>
                  <input
                    type="text"
                    value={basicInfo.cyCfsFax}
                    onChange={(e) => setBasicInfo({ ...basicInfo, cyCfsFax: e.target.value })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="000-0000-0000"
                  />
                </div>

                {/* 6행 - 견적적용일자, 입력사원 */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">견적적용일자</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={basicInfo.validFrom}
                      onChange={(e) => setBasicInfo({ ...basicInfo, validFrom: e.target.value })}
                      className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    />
                    <span>~</span>
                    <input
                      type="date"
                      value={basicInfo.validTo}
                      onChange={(e) => setBasicInfo({ ...basicInfo, validTo: e.target.value })}
                      className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">입력사원</label>
                  <input
                    type="text"
                    value={basicInfo.inputEmployee}
                    disabled
                    className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-[var(--muted)]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 화물정보 섹션 */}
          <div className="card mb-6">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#7C3AED] rounded-full"></span>
                화물정보
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">화물구분</label>
                  <select
                    value={cargoInfo.cargoType}
                    onChange={(e) => setCargoInfo({ ...cargoInfo, cargoType: e.target.value })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  >
                    <option value="container">컨테이너</option>
                    <option value="lcl">LCL</option>
                    <option value="bulk">Bulk</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">차량종류</label>
                  <select
                    value={cargoInfo.vehicleType}
                    onChange={(e) => setCargoInfo({ ...cargoInfo, vehicleType: e.target.value })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  >
                    <option value="">선택</option>
                    <option value="5ton">5톤</option>
                    <option value="11ton">11톤</option>
                    <option value="25ton">25톤</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">차량대수</label>
                  <input
                    type="number"
                    value={cargoInfo.vehicleCount}
                    onChange={(e) => setCargoInfo({ ...cargoInfo, vehicleCount: parseInt(e.target.value) || 0 })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">중량 (Kg)</label>
                  <input
                    type="number"
                    value={cargoInfo.weight}
                    onChange={(e) => setCargoInfo({ ...cargoInfo, weight: parseInt(e.target.value) || 0 })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">용적 (CBM)</label>
                  <input
                    type="number"
                    value={cargoInfo.volume}
                    onChange={(e) => setCargoInfo({ ...cargoInfo, volume: parseFloat(e.target.value) || 0 })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">품명</label>
                  <input
                    type="text"
                    value={cargoInfo.commodity}
                    onChange={(e) => setCargoInfo({ ...cargoInfo, commodity: e.target.value })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="품명"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">포장갯수 (CT)</label>
                  <input
                    type="number"
                    value={cargoInfo.packageCount}
                    onChange={(e) => setCargoInfo({ ...cargoInfo, packageCount: parseInt(e.target.value) || 0 })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">지역</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      type="text"
                      value={cargoInfo.region}
                      onChange={(e) => setCargoInfo({ ...cargoInfo, region: e.target.value })}
                      className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                      style={{ flex: 1, minWidth: 0 }}
                      placeholder="지역"
                    />
                    <SearchIconButton onClick={() => handleCodeSearch('region', 'region')} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">톤수</label>
                  <input
                    type="number"
                    value={cargoInfo.tonnage}
                    onChange={(e) => setCargoInfo({ ...cargoInfo, tonnage: parseFloat(e.target.value) || 0 })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={cargoInfo.specialCargo}
                      onChange={(e) => setCargoInfo({ ...cargoInfo, specialCargo: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">Special Cargo</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 운임정보 섹션 */}
          <div className="card mb-6">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#E8A838] rounded-full"></span>
                운임정보
              </h3>
              <div className="flex gap-2">
                <button onClick={handleAddFreight} className="px-3 py-1.5 text-sm bg-[#1A2744] text-white rounded-lg hover:bg-[#243354]">
                  추가
                </button>
                <button onClick={() => handleDeleteFreight([])} className="px-3 py-1.5 text-sm bg-[var(--surface-100)] rounded-lg hover:bg-[var(--surface-200)]">
                  선택삭제
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--surface-100)]">
                  <tr>
                    <th rowSpan={2} className="w-10 p-2 text-center border-r border-[var(--border)]"><input type="checkbox" /></th>
                    <th rowSpan={2} className="p-2 text-center border-r border-[var(--border)]">운임유형</th>
                    <th rowSpan={2} className="p-2 text-center border-r border-[var(--border)]">운임코드</th>
                    <th rowSpan={2} className="p-2 text-center border-r border-[var(--border)]">통화단위</th>
                    <th rowSpan={2} className="p-2 text-center border-r border-[var(--border)]">환율</th>
                    <th colSpan={3} className="p-2 text-center border-r border-[var(--border)] border-b">Rate Per</th>
                    <th colSpan={2} className="p-2 text-center border-r border-[var(--border)] border-b">Container DRY</th>
                    <th colSpan={2} className="p-2 text-center border-r border-[var(--border)] border-b">Container Type A</th>
                    <th colSpan={2} className="p-2 text-center border-r border-[var(--border)] border-b">Container Type B</th>
                    <th colSpan={2} className="p-2 text-center border-r border-[var(--border)] border-b">Container Type C</th>
                    <th rowSpan={2} className="p-2 text-center border-r border-[var(--border)]">Bulk</th>
                    <th rowSpan={2} className="p-2 text-center border-r border-[var(--border)]">VAT</th>
                    <th rowSpan={2} className="p-2 text-center border-r border-[var(--border)]">단가</th>
                    <th rowSpan={2} className="p-2 text-center border-r border-[var(--border)]">AMOUNT(외화)</th>
                    <th rowSpan={2} className="p-2 text-center border-r border-[var(--border)]">AMOUNT(원화)</th>
                    <th rowSpan={2} className="p-2 text-center border-r border-[var(--border)]">VAT</th>
                    <th rowSpan={2} className="p-2 text-center">합계금액</th>
                  </tr>
                  <tr className="bg-[var(--surface-100)]">
                    <th className="p-1 text-center text-xs border-r border-[var(--border)]">Min</th>
                    <th className="p-1 text-center text-xs border-r border-[var(--border)]">B/L</th>
                    <th className="p-1 text-center text-xs border-r border-[var(--border)]">R.Ton</th>
                    <th className="p-1 text-center text-xs border-r border-[var(--border)]">20</th>
                    <th className="p-1 text-center text-xs border-r border-[var(--border)]">40</th>
                    <th className="p-1 text-center text-xs border-r border-[var(--border)]">Code</th>
                    <th className="p-1 text-center text-xs border-r border-[var(--border)]">Rate</th>
                    <th className="p-1 text-center text-xs border-r border-[var(--border)]">Code</th>
                    <th className="p-1 text-center text-xs border-r border-[var(--border)]">Rate</th>
                    <th className="p-1 text-center text-xs border-r border-[var(--border)]">Code</th>
                    <th className="p-1 text-center text-xs border-r border-[var(--border)]">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {freightItems.map((item) => (
                    <tr key={item.id} className="border-t border-[var(--border)]">
                      <td className="p-2 text-center"><input type="checkbox" /></td>
                      <td className="p-2">
                        <select className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm">
                          <option value="SFC">SFC</option>
                          <option value="OFC">OFC</option>
                          <option value="THC">THC</option>
                          <option value="DOC">DOC</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input type="text" className="w-16 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm" />
                      </td>
                      <td className="p-2">
                        <select className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm">
                          <option value="USD">USD</option>
                          <option value="KRW">KRW</option>
                        </select>
                      </td>
                      <td className="p-2"><input type="number" className="w-16 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right" defaultValue="1300" /></td>
                      {/* Rate Per */}
                      <td className="p-2"><input type="number" className="w-14 px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right" placeholder="Min" /></td>
                      <td className="p-2"><input type="number" className="w-14 px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right" placeholder="B/L" /></td>
                      <td className="p-2"><input type="number" className="w-14 px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right" placeholder="R.Ton" /></td>
                      {/* Container DRY */}
                      <td className="p-2"><input type="number" className="w-14 px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right" placeholder="20" /></td>
                      <td className="p-2"><input type="number" className="w-14 px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right" placeholder="40" /></td>
                      {/* Container Type A */}
                      <td className="p-2"><input type="text" className="w-14 px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm" placeholder="Code" /></td>
                      <td className="p-2"><input type="number" className="w-14 px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right" placeholder="Rate" /></td>
                      {/* Container Type B */}
                      <td className="p-2"><input type="text" className="w-14 px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm" placeholder="Code" /></td>
                      <td className="p-2"><input type="number" className="w-14 px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right" placeholder="Rate" /></td>
                      {/* Container Type C */}
                      <td className="p-2"><input type="text" className="w-14 px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm" placeholder="Code" /></td>
                      <td className="p-2"><input type="number" className="w-14 px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right" placeholder="Rate" /></td>
                      {/* Bulk */}
                      <td className="p-2"><input type="number" className="w-14 px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right" /></td>
                      {/* VAT */}
                      <td className="p-2 text-center">
                        <select className="px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm">
                          <option value="Y">Y</option>
                          <option value="N">N</option>
                        </select>
                      </td>
                      <td className="p-2"><input type="number" className="w-16 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right" /></td>
                      <td className="p-2"><input type="number" className="w-20 px-2 py-1 bg-[var(--surface-200)] border border-[var(--border)] rounded text-sm text-right" disabled /></td>
                      <td className="p-2"><input type="number" className="w-20 px-2 py-1 bg-[var(--surface-200)] border border-[var(--border)] rounded text-sm text-right" disabled /></td>
                      <td className="p-2"><input type="number" className="w-16 px-2 py-1 bg-[var(--surface-200)] border border-[var(--border)] rounded text-sm text-right" disabled /></td>
                      <td className="p-2"><input type="number" className="w-20 px-2 py-1 bg-[var(--surface-200)] border border-[var(--border)] rounded text-sm text-right font-semibold" disabled /></td>
                    </tr>
                  ))}
                  {freightItems.length === 0 && (
                    <tr>
                      <td colSpan={22} className="p-4 text-center text-[var(--muted)]">운임정보를 추가해주세요.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 운송요율 섹션 */}
          <div className="card">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#2563EB] rounded-full"></span>
                운송요율
              </h3>
              <div className="flex gap-2">
                <button onClick={handleAddTransportRate} className="px-3 py-1.5 text-sm bg-[#1A2744] text-white rounded-lg hover:bg-[#243354]">
                  추가
                </button>
                <button className="px-3 py-1.5 text-sm bg-[var(--surface-100)] rounded-lg hover:bg-[var(--surface-200)]">
                  선택삭제
                </button>
              </div>
            </div>
            <div className="p-4 grid grid-cols-4 gap-4 border-b border-[var(--border)]">
              <div>
                <label className="block text-sm font-medium mb-1">운송사</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input type="text" className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" style={{ flex: 1, minWidth: 0 }} placeholder="운송사명" />
                  <SearchIconButton onClick={() => handleCodeSearch('transportCompany', 'carrier')} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">운송사 담당자</label>
                <input type="text" className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">운송사 Tel</label>
                <input type="text" className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">운송사 Fax</label>
                <input type="text" className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">창고</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input type="text" className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" style={{ flex: 1, minWidth: 0 }} placeholder="창고명" />
                  <SearchIconButton onClick={() => handleCodeSearch('warehouse', 'customer')} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">창고 담당자</label>
                <input type="text" className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">창고 Tel</label>
                <input type="text" className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">창고 Fax</label>
                <input type="text" className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--surface-100)]">
                  <tr>
                    <th className="w-10 p-2 text-center"><input type="checkbox" /></th>
                    <th className="p-2 text-center">운임코드</th>
                    <th className="p-2 text-center">출발지</th>
                    <th className="p-2 text-center">출발지명</th>
                    <th className="p-2 text-center">도착지</th>
                    <th className="p-2 text-center">도착지명</th>
                    <th className="p-2 text-center">LCL</th>
                    <th className="p-2 text-center">20'</th>
                    <th className="p-2 text-center">40'</th>
                    <th className="p-2 text-center">E.TC</th>
                    <th className="p-2 text-center">담당자</th>
                    <th className="p-2 text-center">전화번호</th>
                    <th className="p-2 text-center">팩스번호</th>
                    <th className="p-2 text-center">E-mail</th>
                    <th className="p-2 text-center">VAT</th>
                    <th className="p-2 text-center">단가</th>
                    <th className="p-2 text-center">AMOUNT</th>
                    <th className="p-2 text-center">VAT</th>
                    <th className="p-2 text-center">합계금액</th>
                  </tr>
                </thead>
                <tbody>
                  {transportRates.map((item) => (
                    <tr key={item.id} className="border-t border-[var(--border)]">
                      <td className="p-2 text-center"><input type="checkbox" /></td>
                      <td className="p-2"><input type="text" className="w-20 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm" /></td>
                      <td className="p-2"><input type="text" className="w-20 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm" /></td>
                      <td className="p-2"><input type="text" className="w-24 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm" /></td>
                      <td className="p-2"><input type="text" className="w-20 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm" /></td>
                      <td className="p-2"><input type="text" className="w-24 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm" /></td>
                      <td className="p-2"><input type="number" className="w-14 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right" /></td>
                      <td className="p-2"><input type="number" className="w-14 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right" /></td>
                      <td className="p-2"><input type="number" className="w-14 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right" /></td>
                      <td className="p-2"><input type="number" className="w-14 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right" /></td>
                      <td className="p-2"><input type="text" className="w-20 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm" /></td>
                      <td className="p-2"><input type="text" className="w-24 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm" /></td>
                      <td className="p-2"><input type="text" className="w-24 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm" /></td>
                      <td className="p-2"><input type="email" className="w-32 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm" /></td>
                      <td className="p-2 text-center">
                        <select className="px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm">
                          <option value="Y">Y</option>
                          <option value="N">N</option>
                        </select>
                      </td>
                      <td className="p-2"><input type="number" className="w-16 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right" /></td>
                      <td className="p-2"><input type="number" className="w-20 px-2 py-1 bg-[var(--surface-200)] border border-[var(--border)] rounded text-sm text-right" disabled /></td>
                      <td className="p-2"><input type="number" className="w-16 px-2 py-1 bg-[var(--surface-200)] border border-[var(--border)] rounded text-sm text-right" disabled /></td>
                      <td className="p-2"><input type="number" className="w-20 px-2 py-1 bg-[var(--surface-200)] border border-[var(--border)] rounded text-sm text-right font-semibold" disabled /></td>
                    </tr>
                  ))}
                  {transportRates.length === 0 && (
                    <tr>
                      <td colSpan={19} className="p-4 text-center text-[var(--muted)]">운송요율 정보를 추가해주세요.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      {/* 스케줄조회 모달 */}
      <ScheduleSearchModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSelect={handleScheduleSelect}
        type="sea"
        defaultOrigin={basicInfo.origin}
        defaultDestination={basicInfo.destination}
      />

      {/* 운임조회 모달 */}
      <FreightSearchModal
        isOpen={showFreightModal}
        onClose={() => setShowFreightModal(false)}
        onSelect={handleFreightSelect}
        type="sea"
        defaultOrigin={basicInfo.origin}
        defaultDestination={basicInfo.destination}
      />

      {/* 기업운임조회 모달 */}
      <CorporateRateSearchModal
        isOpen={showCorporateRateModal}
        onClose={() => setShowCorporateRateModal(false)}
        onSelect={handleCorporateRateSelect}
        type="sea"
        defaultOrigin={basicInfo.origin}
        defaultDestination={basicInfo.destination}
      />

      {/* 이메일 모달 */}
      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSend={handleEmailSend}
        documentType="quote"
        documentNo={basicInfo.quoteNo || '자동생성'}
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
        type={currentLocationType}
      />

      {/* 출력 모달 */}
      <ReportPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        reportType="QUOTE"
        data={[{
          quoteNo: basicInfo.quoteNo || '자동생성',
          quoteDate: basicInfo.registrationDate,
          validFrom: basicInfo.validFrom,
          validTo: basicInfo.validTo,
          shipper: basicInfo.customerName,
          shipperAddress: '',
          shipperContact: basicInfo.customerManager,
          shipperTel: basicInfo.customerPhone,
          consignee: basicInfo.senderName,
          consigneeAddress: '',
          consigneeContact: basicInfo.senderManager,
          consigneeTel: basicInfo.senderPhone,
          carrier: basicInfo.carrierName || basicInfo.carrier,
          pol: basicInfo.originName || basicInfo.origin,
          pod: basicInfo.destinationName || basicInfo.destination,
          vessel: basicInfo.vesselName,
          voyage: basicInfo.voyageNo,
          etd: basicInfo.etd,
          eta: basicInfo.eta,
          containerType: cargoInfo.vehicleType,
          containerQty: cargoInfo.vehicleCount,
          commodity: cargoInfo.commodity,
          grossWeight: cargoInfo.weight,
          measurement: cargoInfo.volume,
          freightTerms: basicInfo.tradeTerms,
          items: freightItems.map(f => ({
            description: f.freightCode || f.freightType,
            currency: f.currency,
            unitPrice: f.unitPrice,
            amount: f.totalAmount,
          })),
          subtotal: freightItems.reduce((sum, f) => sum + f.amountKrw, 0),
          vat: freightItems.reduce((sum, f) => sum + f.vat, 0),
          total: freightItems.reduce((sum, f) => sum + f.totalAmount, 0),
          currency: 'KRW',
        }]}
      />
    </div>
  );
}

export default function QuoteSeaRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)] flex items-center justify-center">로딩중...</div>}>
      <QuoteSeaRegisterPageContent />
    </Suspense>
  );
}
