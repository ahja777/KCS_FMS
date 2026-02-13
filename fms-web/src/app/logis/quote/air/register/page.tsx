'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import ScheduleSearchModal from '@/components/ScheduleSearchModal';
import FreightSearchModal from '@/components/FreightSearchModal';
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
import ExchangeRateModal from '@/components/ExchangeRateModal';
import { formatCurrency } from '@/utils/format';

// 필수 항목 뱃지 컴포넌트
const RequiredBadge = () => (
  <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-red-500/20 text-red-400 rounded">
    필수
  </span>
);

// 운임정보 타입
interface FreightItem {
  id: string;
  freightType: string;
  freightCode: string;
  currency: string;
  exchangeRate: number;
  minCharge: number;
  under45: number;
  under100: number;
  under300: number;
  under500: number;
  over500: number;
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
  under45: number;
  under100: number;
  under300: number;
  over300: number;
  vatYn: 'Y' | 'N';
  unitPrice: number;
  amount: number;
  vat: number;
  totalAmount: number;
}

function QuoteAirRegisterPageContent() {
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
    airline: '',
    airlineName: '',
    airlineManager: '',
    airlineTel: '',
    airlineFax: '',
    flightNo: '',
    etd: '',
    eta: '',
    validFrom: today,
    validTo: '',
  });

  // 화물정보
  const [cargoInfo, setCargoInfo] = useState({
    cargoType: 'general',
    pieces: 0,
    grossWeight: 0,
    chargeableWeight: 0,
    volume: 0,
    commodity: '',
    hsCode: '',
    dimensions: '',
    specialCargo: false,
    dangerousGoods: false,
    dgClass: '',
    unNumber: '',
  });

  // 운임정보 목록
  const [freightItems, setFreightItems] = useState<FreightItem[]>([
    {
      id: '1',
      freightType: 'AFC',
      freightCode: 'AFC',
      currency: 'USD',
      exchangeRate: 1300,
      minCharge: 0,
      under45: 0,
      under100: 0,
      under300: 0,
      under500: 0,
      over500: 0,
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
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showExchangeRateModal, setShowExchangeRateModal] = useState(false);

  // 코드/위치 검색 팝업 상태
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [currentField, setCurrentField] = useState<string>('');
  const [currentCodeType, setCurrentCodeType] = useState<CodeType>('customer');

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
    listPath: LIST_PATHS.QUOTE_AIR,
  });

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
    } else if (currentField === 'airline') {
      setBasicInfo(prev => ({
        ...prev,
        airline: item.code,
        airlineName: item.name,
      }));
    }
    setShowCodeModal(false);
  };

  // 위치 검색 버튼 클릭
  const handleLocationSearch = (field: string) => {
    setCurrentField(field);
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

  // 수정 모드일 경우 데이터 로드
  useEffect(() => {
    if (!quoteId) return;
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/quote/air?quoteId=${quoteId}`);
        if (!response.ok) return;
        const data = await response.json();

        // 날짜 헬퍼: null/undefined -> ''
        const formatDate = (v: string | null | undefined) => v ? v.split('T')[0] : '';

        setBasicInfo(prev => ({
          ...prev,
          quoteNo: data.quoteNo || '',
          registrationDate: formatDate(data.quoteDate) || today,
          customerCode: data.customerId ? String(data.customerId) : '',
          customerName: data.shipper || '',
          senderName: data.consignee || '',
          origin: data.origin || '',
          destination: data.destination || '',
          airline: data.airlineCd || '',
          airlineName: data.airline || '',
          flightNo: data.flightNo || '',
          validFrom: formatDate(data.validFrom) || today,
          validTo: formatDate(data.validTo),
        }));

        setCargoInfo(prev => ({
          ...prev,
          grossWeight: parseFloat(data.weight) || 0,
          volume: parseFloat(data.volume) || 0,
          commodity: data.commodity || '',
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
    setBasicInfo(prev => ({
      ...prev,
      carrier: schedule.airlineCode || '',
      carrierName: schedule.airline || '',
      origin: schedule.origin || '',
      originName: schedule.originName || '',
      destination: schedule.destination || '',
      destinationName: schedule.destinationName || '',
    }));
    alert(`항공편 "${schedule.flightNo}" (${schedule.airline}) 스케줄이 선택되었습니다.`);
  };

  // 운임 선택 핸들러
  const handleFreightSelect = (freight: any) => {
    const newFreightItem: FreightItem = {
      id: Date.now().toString(),
      freightType: 'AIR',
      freightCode: 'A/F',
      currency: freight.currency,
      exchangeRate: 1350,
      minCharge: freight.minCharge || 0,
      under45: freight.ratePerKg || 0,
      under100: freight.ratePerKg || 0,
      under300: freight.ratePerKg || 0,
      under500: freight.ratePerKg || 0,
      over500: freight.ratePerKg || 0,
      vatYn: 'N',
      unitPrice: freight.total,
      amountForeign: freight.total * 100,
      amountKrw: freight.total * 100 * 1350,
      vat: 0,
      totalAmount: freight.total * 100 * 1350,
    };
    setFreightItems(prev => [...prev, newFreightItem]);
    alert(`"${freight.airline}" 운임 (${freight.weightBreak}: ${freight.total} ${freight.currency}/kg)이 추가되었습니다.`);
  };

  // 이메일 발송 핸들러
  const handleEmailSend = (emailData: any) => {
    console.log('이메일 발송:', emailData);
    alert(`이메일이 발송되었습니다.\n받는 사람: ${emailData.to.join(', ')}\n제목: ${emailData.subject}`);
  };

  // 환율 선택 핸들러
  const handleExchangeRateSelect = (rate: { currencyCode: string; dealBasR: number }) => {
    // 선택된 환율을 운임정보에 적용
    setFreightItems(prev => prev.map(item => ({
      ...item,
      exchangeRate: rate.dealBasR,
      currency: rate.currencyCode.replace('(100)', ''),
      amountKrw: item.amountForeign * rate.dealBasR,
      totalAmount: item.amountForeign * rate.dealBasR + item.vat,
    })));
    alert(`환율이 적용되었습니다.\n통화: ${rate.currencyCode}\n환율: ${rate.dealBasR.toLocaleString()} KRW`);
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
      minCharge: 0,
      under45: 0,
      under100: 0,
      under300: 0,
      under500: 0,
      over500: 0,
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
      under45: 0,
      under100: 0,
      under300: 0,
      over300: 0,
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
      originAirportCd: basicInfo.origin || '',
      destAirportCd: basicInfo.destination || '',
      airlineCd: basicInfo.airline || null,
      flightNo: basicInfo.flightNo || '',
      weight: cargoInfo.grossWeight || 0,
      volume: cargoInfo.volume || 0,
      commodity: cargoInfo.commodity || '일반화물',
      validFrom: basicInfo.validFrom || null,
      validTo: basicInfo.validTo || null,
      totalAmount: transportRates.reduce((sum, item) => sum + item.totalAmount, 0) || 0,
      currency: 'USD',
      status: 'draft',
      remark: '',
    };

    try {
      const response = await fetch('/api/quote/air', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteData),
      });

      if (!response.ok) throw new Error('Failed to save');

      const result = await response.json();
      setHasUnsavedChanges(false);
      setIsNewMode(false); // 저장 완료 후 신규버튼 활성화
      alert(isEditMode ? '견적이 수정되었습니다.' : `견적이 저장되었습니다. (${result.quoteNo || ''})`);
      router.push(LIST_PATHS.QUOTE_AIR);
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
    router.push(LIST_PATHS.QUOTE_AIR);
  };

  // 신규 등록
  const handleNew = () => {
    router.push(window.location.pathname);
  };

  // 삭제 처리
  const handleDelete = async () => {
    if (!quoteId || !confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/quote/air?ids=${quoteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      setHasUnsavedChanges(false);
      alert('견적이 삭제되었습니다.');
      router.push(LIST_PATHS.QUOTE_AIR);
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
      airline: '',
      airlineName: '',
      airlineManager: '',
      airlineTel: '',
      airlineFax: '',
      flightNo: '',
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
      origin: 'ICN',
      originName: '인천국제공항',
      inputEmployee: '홍길동',
      toBy1: '',
      toBy1Name: '',
      toBy2: '',
      toBy2Name: '',
      destination: 'JFK',
      destinationName: 'JFK 국제공항',
      airline: 'KE',
      airlineName: '대한항공',
      airlineManager: '이항공',
      airlineTel: '02-9876-5432',
      airlineFax: '02-9876-5433',
      flightNo: 'KE081',
      etd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      eta: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      validFrom: new Date().toISOString().split('T')[0],
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setCargoInfo({
      cargoType: 'general',
      pieces: 50,
      grossWeight: 500,
      chargeableWeight: 520,
      volume: 3.5,
      commodity: '전자부품',
      hsCode: '8542.31.0000',
      dimensions: '60 x 40 x 40 cm',
      specialCargo: false,
      dangerousGoods: false,
      dgClass: '',
      unNumber: '',
    });
    setFreightItems([
      {
        id: '1',
        freightType: 'AFC',
        freightCode: 'AFC',
        currency: 'USD',
        exchangeRate: 1350,
        minCharge: 150,
        under45: 4.5,
        under100: 4.2,
        under300: 3.8,
        under500: 3.5,
        over500: 3.2,
        vatYn: 'N',
        unitPrice: 3.5,
        amountForeign: 1820,
        amountKrw: 2457000,
        vat: 0,
        totalAmount: 2457000,
      },
    ]);
    setHasUnsavedChanges(true);
    alert('테스트 데이터가 입력되었습니다.');
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header title="견적관리 등록 (항공)" subtitle="물류견적관리  견적관리 (항공) 
        onClose={() => setShowCloseModal(true)}> 견적관리 등록 (항공)" onClose={handleCloseClick} />

      <main ref={formRef} className="p-6">
          {/* 상단 버튼 */}
          <div className="flex justify-end items-center mb-6">
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

                {/* 환율조회 버튼 */}
                <button
                  onClick={() => setShowExchangeRateModal(true)}
                  className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)] transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  환율조회
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

                {/* 신규 버튼 */}
                <button
                  onClick={handleNew}
                  disabled={isNewMode}
                  className={`px-4 py-2 font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                    isNewMode
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  신규
                </button>

                {/* 초기화 버튼 */}
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
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
                    className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
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
                  className="px-4 py-2 bg-[#E8A838] text-[#0C1222] font-semibold rounded-lg hover:bg-[#D4943A] transition-colors disabled:opacity-50 flex items-center gap-2"
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
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={basicInfo.customerName}
                      onChange={(e) => setBasicInfo({ ...basicInfo, customerName: e.target.value })}
                      className={`flex-1 h-[38px] px-3 bg-[var(--surface-50)] border rounded-lg ${
                        errors.customerName ? 'border-red-500' : 'border-[var(--border)]'
                      }`}
                      placeholder="거래처명"
                    />
                    <button className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                      찾기
                    </button>
                  </div>
                  <FieldError field="customerName" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">담당자</label>
                  <input
                    type="text"
                    value={basicInfo.customerManager}
                    onChange={(e) => setBasicInfo({ ...basicInfo, customerManager: e.target.value })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="담당자명"
                  />
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
                  <label className="block text-sm font-medium mb-1">출발공항</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={basicInfo.origin}
                      onChange={(e) => setBasicInfo({ ...basicInfo, origin: e.target.value })}
                      className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                      placeholder="ICN"
                    />
                    <button className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                      찾기
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">경유지 1</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={basicInfo.toBy1}
                      onChange={(e) => setBasicInfo({ ...basicInfo, toBy1: e.target.value })}
                      className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                      placeholder="경유공항1"
                    />
                    <button className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                      찾기
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">경유지 2</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={basicInfo.toBy2}
                      onChange={(e) => setBasicInfo({ ...basicInfo, toBy2: e.target.value })}
                      className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                      placeholder="경유공항2"
                    />
                    <button className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                      찾기
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">도착공항</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={basicInfo.destination}
                      onChange={(e) => setBasicInfo({ ...basicInfo, destination: e.target.value })}
                      className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                      placeholder="JFK"
                    />
                    <button
                      onClick={() => handleLocationSearch('destination')}
                      className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
                    >
                      찾기
                    </button>
                  </div>
                </div>

                {/* 4행 - 항공사 정보 */}
                <div>
                  <label className="block text-sm font-medium mb-1">항공사</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={basicInfo.airlineName}
                      onChange={(e) => setBasicInfo({ ...basicInfo, airlineName: e.target.value })}
                      className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                      placeholder="항공사명"
                    />
                    <button
                      onClick={() => handleCodeSearch('airline', 'airline')}
                      className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
                    >
                      찾기
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">항공사 담당자</label>
                  <input
                    type="text"
                    value={basicInfo.airlineManager}
                    onChange={(e) => setBasicInfo({ ...basicInfo, airlineManager: e.target.value })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="담당자명"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">항공사 Tel</label>
                  <input
                    type="text"
                    value={basicInfo.airlineTel}
                    onChange={(e) => setBasicInfo({ ...basicInfo, airlineTel: e.target.value })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="000-0000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">항공사 Fax</label>
                  <input
                    type="text"
                    value={basicInfo.airlineFax}
                    onChange={(e) => setBasicInfo({ ...basicInfo, airlineFax: e.target.value })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="000-0000-0000"
                  />
                </div>

                {/* 5행 - 편명/스케줄 정보 */}
                <div>
                  <label className="block text-sm font-medium mb-1">편명 (Flight No.)</label>
                  <input
                    type="text"
                    value={basicInfo.flightNo}
                    onChange={(e) => setBasicInfo({ ...basicInfo, flightNo: e.target.value })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="KE081"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ETD (출발예정)</label>
                  <input
                    type="datetime-local"
                    value={basicInfo.etd}
                    onChange={(e) => setBasicInfo({ ...basicInfo, etd: e.target.value })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ETA (도착예정)</label>
                  <input
                    type="datetime-local"
                    value={basicInfo.eta}
                    onChange={(e) => setBasicInfo({ ...basicInfo, eta: e.target.value })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  />
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

                {/* 6행 - 견적적용일자 */}
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
                    <option value="general">일반화물</option>
                    <option value="express">특송화물</option>
                    <option value="dangerous">위험물</option>
                    <option value="perishable">부패성화물</option>
                    <option value="valuable">귀중화물</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pieces (PCS)</label>
                  <input
                    type="number"
                    value={cargoInfo.pieces}
                    onChange={(e) => setCargoInfo({ ...cargoInfo, pieces: parseInt(e.target.value) || 0 })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Gross Weight (Kg)</label>
                  <input
                    type="number"
                    value={cargoInfo.grossWeight}
                    onChange={(e) => setCargoInfo({ ...cargoInfo, grossWeight: parseFloat(e.target.value) || 0 })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Chargeable Weight (Kg)</label>
                  <input
                    type="number"
                    value={cargoInfo.chargeableWeight}
                    onChange={(e) => setCargoInfo({ ...cargoInfo, chargeableWeight: parseFloat(e.target.value) || 0 })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Volume (CBM)</label>
                  <input
                    type="number"
                    value={cargoInfo.volume}
                    onChange={(e) => setCargoInfo({ ...cargoInfo, volume: parseFloat(e.target.value) || 0 })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">품명 (Commodity)</label>
                  <input
                    type="text"
                    value={cargoInfo.commodity}
                    onChange={(e) => setCargoInfo({ ...cargoInfo, commodity: e.target.value })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="품명"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">HS Code</label>
                  <input
                    type="text"
                    value={cargoInfo.hsCode}
                    onChange={(e) => setCargoInfo({ ...cargoInfo, hsCode: e.target.value })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="0000.00.0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Dimensions (L x W x H)</label>
                  <input
                    type="text"
                    value={cargoInfo.dimensions}
                    onChange={(e) => setCargoInfo({ ...cargoInfo, dimensions: e.target.value })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="100 x 80 x 60 cm"
                  />
                </div>
                <div className="flex items-end gap-4">
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
                <div className="flex items-end gap-4">
                  <label className="flex items-center gap-2 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={cargoInfo.dangerousGoods}
                      onChange={(e) => setCargoInfo({ ...cargoInfo, dangerousGoods: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">Dangerous Goods</span>
                  </label>
                </div>
                {cargoInfo.dangerousGoods && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">DG Class</label>
                      <input
                        type="text"
                        value={cargoInfo.dgClass}
                        onChange={(e) => setCargoInfo({ ...cargoInfo, dgClass: e.target.value })}
                        className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                        placeholder="Class 3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">UN Number</label>
                      <input
                        type="text"
                        value={cargoInfo.unNumber}
                        onChange={(e) => setCargoInfo({ ...cargoInfo, unNumber: e.target.value })}
                        className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                        placeholder="UN1234"
                      />
                    </div>
                  </>
                )}
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
                    <th className="w-10 p-2 text-center"><input type="checkbox" /></th>
                    <th className="p-2 text-center">운임유형</th>
                    <th className="p-2 text-center">운임코드</th>
                    <th className="p-2 text-center">통화</th>
                    <th className="p-2 text-center">환율</th>
                    <th className="p-2 text-center">M/C</th>
                    <th className="p-2 text-center">-45K</th>
                    <th className="p-2 text-center">-100K</th>
                    <th className="p-2 text-center">-300K</th>
                    <th className="p-2 text-center">-500K</th>
                    <th className="p-2 text-center">+500K</th>
                    <th className="p-2 text-center">VAT</th>
                    <th className="p-2 text-center">AMOUNT(외화)</th>
                    <th className="p-2 text-center">AMOUNT(원화)</th>
                    <th className="p-2 text-center">VAT</th>
                    <th className="p-2 text-center">합계</th>
                  </tr>
                </thead>
                <tbody>
                  {freightItems.map((item) => (
                    <tr key={item.id} className="border-t border-[var(--border)]">
                      <td className="p-2 text-center"><input type="checkbox" /></td>
                      <td className="p-2">
                        <select className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm">
                          <option value="AFC">AFC</option>
                          <option value="FSC">FSC</option>
                          <option value="SCC">SCC</option>
                          <option value="AWC">AWC</option>
                          <option value="THC">THC</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input type="text" className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm" />
                      </td>
                      <td className="p-2">
                        <select className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm">
                          <option value="USD">USD</option>
                          <option value="KRW">KRW</option>
                        </select>
                      </td>
                      <td className="p-2"><input type="number" className="w-20 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right" defaultValue="1300" /></td>
                      <td className="p-2"><input type="number" className="w-16 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right" /></td>
                      <td className="p-2"><input type="number" className="w-16 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right" /></td>
                      <td className="p-2"><input type="number" className="w-16 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right" /></td>
                      <td className="p-2"><input type="number" className="w-16 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right" /></td>
                      <td className="p-2"><input type="number" className="w-16 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right" /></td>
                      <td className="p-2"><input type="number" className="w-16 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right" /></td>
                      <td className="p-2 text-center">
                        <select className="px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm">
                          <option value="Y">Y</option>
                          <option value="N">N</option>
                        </select>
                      </td>
                      <td className="p-2"><input type="number" className="w-24 px-2 py-1 bg-[var(--surface-200)] border border-[var(--border)] rounded text-sm text-right" disabled /></td>
                      <td className="p-2"><input type="number" className="w-24 px-2 py-1 bg-[var(--surface-200)] border border-[var(--border)] rounded text-sm text-right" disabled /></td>
                      <td className="p-2"><input type="number" className="w-20 px-2 py-1 bg-[var(--surface-200)] border border-[var(--border)] rounded text-sm text-right" disabled /></td>
                      <td className="p-2"><input type="number" className="w-24 px-2 py-1 bg-[var(--surface-200)] border border-[var(--border)] rounded text-sm text-right font-semibold" disabled /></td>
                    </tr>
                  ))}
                  {freightItems.length === 0 && (
                    <tr>
                      <td colSpan={16} className="p-4 text-center text-[var(--muted)]">운임정보를 추가해주세요.</td>
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
                <div className="flex gap-2">
                  <input type="text" className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="운송사명" />
                  <button className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">찾기</button>
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
                <label className="block text-sm font-medium mb-1">창고/터미널</label>
                <div className="flex gap-2">
                  <input type="text" className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="창고/터미널명" />
                  <button className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">찾기</button>
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
                    <th className="p-2 text-center">-45K</th>
                    <th className="p-2 text-center">-100K</th>
                    <th className="p-2 text-center">-300K</th>
                    <th className="p-2 text-center">+300K</th>
                    <th className="p-2 text-center">VAT</th>
                    <th className="p-2 text-center">단가</th>
                    <th className="p-2 text-center">AMOUNT</th>
                    <th className="p-2 text-center">VAT</th>
                    <th className="p-2 text-center">합계</th>
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
                      <td className="p-2"><input type="number" className="w-16 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right" /></td>
                      <td className="p-2"><input type="number" className="w-16 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right" /></td>
                      <td className="p-2"><input type="number" className="w-16 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right" /></td>
                      <td className="p-2"><input type="number" className="w-16 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right" /></td>
                      <td className="p-2 text-center">
                        <select className="px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm">
                          <option value="Y">Y</option>
                          <option value="N">N</option>
                        </select>
                      </td>
                      <td className="p-2"><input type="number" className="w-20 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right" /></td>
                      <td className="p-2"><input type="number" className="w-24 px-2 py-1 bg-[var(--surface-200)] border border-[var(--border)] rounded text-sm text-right" disabled /></td>
                      <td className="p-2"><input type="number" className="w-20 px-2 py-1 bg-[var(--surface-200)] border border-[var(--border)] rounded text-sm text-right" disabled /></td>
                      <td className="p-2"><input type="number" className="w-24 px-2 py-1 bg-[var(--surface-200)] border border-[var(--border)] rounded text-sm text-right font-semibold" disabled /></td>
                    </tr>
                  ))}
                  {transportRates.length === 0 && (
                    <tr>
                      <td colSpan={15} className="p-4 text-center text-[var(--muted)]">운송요율 정보를 추가해주세요.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 기타정보 섹션 */}
          <div className="card mb-6">
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#9333EA] rounded-full"></span>
                기타정보
              </h3>
            </div>
            <div className="p-4">
              {/* 견적 문구 */}
              <div className="bg-[var(--surface-50)] border border-[var(--border)] rounded-lg p-4 mb-4">
                <p className="text-sm text-[var(--foreground)]">
                  귀사의 일익 번창하심을 진심으로 기원합니다.
                </p>
                <p className="text-sm text-[var(--foreground)] mt-2">
                  항공 운임 견적을 다음과 같이 알려드리오니 참고하시어 많은 협조바랍니다.
                </p>
              </div>

              {/* 합계 정보 */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-[var(--surface-100)] rounded-lg p-4 text-center">
                  <p className="text-sm text-[var(--muted)] mb-1">외화합계</p>
                  <p className="text-xl font-bold text-blue-500">
                    {formatCurrency(freightItems.reduce((sum, item) => sum + item.amountForeign, 0), 'USD')}
                  </p>
                </div>
                <div className="bg-[var(--surface-100)] rounded-lg p-4 text-center">
                  <p className="text-sm text-[var(--muted)] mb-1">원화합계</p>
                  <p className="text-xl font-bold text-[var(--foreground)]">
                    {formatCurrency(freightItems.reduce((sum, item) => sum + item.amountKrw, 0))} 원
                  </p>
                </div>
                <div className="bg-[var(--surface-100)] rounded-lg p-4 text-center">
                  <p className="text-sm text-[var(--muted)] mb-1">부가세합계</p>
                  <p className="text-xl font-bold text-orange-500">
                    {formatCurrency(freightItems.reduce((sum, item) => sum + item.vat, 0))} 원
                  </p>
                </div>
                <div className="bg-[#E8A838]/20 border border-[#E8A838] rounded-lg p-4 text-center">
                  <p className="text-sm text-[#E8A838] mb-1">총 합계</p>
                  <p className="text-xl font-bold text-[#E8A838]">
                    {formatCurrency(freightItems.reduce((sum, item) => sum + item.totalAmount, 0))} 원
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      {/* 스케줄조회 모달 */}
      <ScheduleSearchModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSelect={handleScheduleSelect}
        type="air"
        defaultOrigin={basicInfo.origin}
        defaultDestination={basicInfo.destination}
      />

      {/* 운임조회 모달 */}
      <FreightSearchModal
        isOpen={showFreightModal}
        onClose={() => setShowFreightModal(false)}
        onSelect={handleFreightSelect}
        type="air"
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
        type="airport"
      />

      {/* 환율조회 모달 */}
      <ExchangeRateModal
        isOpen={showExchangeRateModal}
        onClose={() => setShowExchangeRateModal(false)}
        onSelect={handleExchangeRateSelect}
      />
    </div>
  );
}

export default function QuoteAirRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)] flex items-center justify-center">로딩중...</div>}>
      <QuoteAirRegisterPageContent />
    </Suspense>
  );
}
