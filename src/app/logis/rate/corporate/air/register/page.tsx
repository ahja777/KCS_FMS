'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { UnsavedChangesModal } from '@/components/UnsavedChangesModal';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useScreenClose } from '@/hooks/useScreenClose';
import {
  CodeSearchModal,
  LocationCodeModal,
  type CodeItem,
  type CodeType,
  type LocationItem,
} from '@/components/popup';
import SearchIconButton from '@/components/SearchIconButton';

// 필수 항목 뱃지 컴포넌트
const RequiredBadge = () => (
  <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-red-500/20 text-red-400 rounded">
    필수
  </span>
);

// 운임정보 타입 (항공)
interface FreightItem {
  id: string;
  freightType: string;   // AFC/FSC/SCC/AWC/THC
  freightCode: string;
  currency: string;
  kgLb: string;          // Kg/Lb
  rateMinAir: number;    // Min
  rateAwb: number;       // Awb
  rate45l: number;       // Rate_45L
  rate45: number;        // Rate_45
  rate100: number;       // Rate_100
  rate300: number;       // Rate_300
  rate500: number;       // Rate_500
  rate1000: number;      // Rate_1000
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

const LIST_PATH = '/logis/rate/corporate/air';

function CorporateAirRateRegisterContent() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });
  const searchParams = useSearchParams();
  const rateId = searchParams.get('id');
  const isEditMode = !!rateId;
  const today = new Date().toISOString().split('T')[0];

  // 기본정보
  const [basicInfo, setBasicInfo] = useState({
    contractNo: '',       // 계약번호 (자동생성)
    registrationDate: today,
    exportImport: 'export',
    businessType: 'LOCAL',
    tradeTerms: 'CFR',
    customerCode: '',
    customerName: '',
    customerManager: '',
    customerPhone: '',
    origin: '',
    originName: '',
    destination: '',
    destinationName: '',
    toBy1: '',
    toBy1Name: '',
    toBy2: '',
    toBy2Name: '',
    airline: '',
    airlineName: '',
    airlineManager: '',
    airlineTel: '',
    airlineFax: '',
    flightNo: '',
    inputEmployee: '홍길동',
    validFrom: today,
    validTo: '',
    remark: '',
  });

  // 운임정보 목록 (항공)
  const [freightItems, setFreightItems] = useState<FreightItem[]>([
    {
      id: '1',
      freightType: 'AFC',
      freightCode: 'AFC',
      currency: 'USD',
      kgLb: 'Kg',
      rateMinAir: 0,
      rateAwb: 0,
      rate45l: 0,
      rate45: 0,
      rate100: 0,
      rate300: 0,
      rate500: 0,
      rate1000: 0,
    },
  ]);

  // 운송요율 목록
  const [transportRates, setTransportRates] = useState<TransportRateItem[]>([]);

  // 에러 상태
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    listPath: LIST_PATH,
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
      [`${currentField}Name`]: item.nameEn || item.nameKr || '',
    }));
    setShowLocationModal(false);
  };

  // 수정 모드일 경우 데이터 로드
  useEffect(() => {
    if (!rateId) return;
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/rate/corporate/air?id=${rateId}`);
        if (!response.ok) return;
        const data = await response.json();

        const formatDate = (v: string | null | undefined) => v ? v.split('T')[0] : '';

        setBasicInfo(prev => ({
          ...prev,
          contractNo: data.contractNo || '',
          registrationDate: formatDate(data.registrationDate) || today,
          exportImport: data.exportImport || 'export',
          businessType: data.businessType || 'LOCAL',
          tradeTerms: data.tradeTerms || 'CFR',
          customerCode: data.customerCode || '',
          customerName: data.customerName || '',
          customerManager: data.customerManager || '',
          customerPhone: data.customerPhone || '',
          origin: data.origin || '',
          originName: data.originName || '',
          destination: data.destination || '',
          destinationName: data.destinationName || '',
          airline: data.airlineCd || '',
          airlineName: data.airlineName || '',
          flightNo: data.flightNo || '',
          validFrom: formatDate(data.validFrom) || today,
          validTo: formatDate(data.validTo),
          remark: data.remark || '',
        }));

        if (data.freightItems?.length) {
          setFreightItems(data.freightItems);
        }
        if (data.transportRates?.length) {
          setTransportRates(data.transportRates);
        }

        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      }
    };
    fetchData();
  }, [rateId, today]);

  // 폼 변경 감지
  useEffect(() => {
    if (basicInfo.customerName || basicInfo.origin || basicInfo.destination) {
      setHasUnsavedChanges(true);
    }
  }, [basicInfo.customerName, basicInfo.origin, basicInfo.destination]);

  // 에러 메시지 표시 컴포넌트
  const FieldError = ({ field }: { field: string }) => {
    const errorMsg = errors[field];
    if (!errorMsg) return null;
    return <p className="text-red-400 text-xs mt-1">{errorMsg}</p>;
  };

  // 유효성 검사
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!basicInfo.registrationDate) {
      newErrors.registrationDate = '등록일자는 필수 입력 항목입니다';
    }
    if (!basicInfo.customerName) {
      newErrors.customerName = '거래처는 필수 입력 항목입니다';
    }
    if (!basicInfo.airline) {
      newErrors.airline = '항공사는 필수 입력 항목입니다';
    }
    if (!basicInfo.validFrom) {
      newErrors.validFrom = '유효기간 시작일은 필수 입력 항목입니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const errorCount = Object.keys(errors).length;

  // 운임정보 추가
  const handleAddFreight = () => {
    const newItem: FreightItem = {
      id: Date.now().toString(),
      freightType: '',
      freightCode: '',
      currency: 'USD',
      kgLb: 'Kg',
      rateMinAir: 0,
      rateAwb: 0,
      rate45l: 0,
      rate45: 0,
      rate100: 0,
      rate300: 0,
      rate500: 0,
      rate1000: 0,
    };
    setFreightItems([...freightItems, newItem]);
  };

  // 운임정보 삭제
  const handleDeleteFreight = (ids: string[]) => {
    if (ids.length === 0) {
      // 체크된 항목 삭제 (간편 구현: 전체 선택 제외)
      return;
    }
    setFreightItems(freightItems.filter(item => !ids.includes(item.id)));
  };

  // 운임정보 수정
  const handleFreightChange = (id: string, field: keyof FreightItem, value: string | number) => {
    setFreightItems(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
    setHasUnsavedChanges(true);
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

    const rateData = {
      id: isEditMode ? rateId : undefined,
      transportMode: 'AIR',
      registrationDate: basicInfo.registrationDate,
      exportImport: basicInfo.exportImport,
      businessType: basicInfo.businessType,
      tradeTerms: basicInfo.tradeTerms,
      customerCode: basicInfo.customerCode || null,
      customerName: basicInfo.customerName,
      customerManager: basicInfo.customerManager,
      customerPhone: basicInfo.customerPhone,
      origin: basicInfo.origin,
      originName: basicInfo.originName,
      destination: basicInfo.destination,
      destinationName: basicInfo.destinationName,
      airlineCd: basicInfo.airline || null,
      airlineName: basicInfo.airlineName,
      flightNo: basicInfo.flightNo,
      validFrom: basicInfo.validFrom || null,
      validTo: basicInfo.validTo || null,
      remark: basicInfo.remark,
      freightItems,
      transportRates,
    };

    try {
      const response = await fetch('/api/rate/corporate/air', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rateData),
      });

      if (!response.ok) throw new Error('Failed to save');

      const result = await response.json();
      setHasUnsavedChanges(false);
      setIsNewMode(false);
      alert(isEditMode ? '기업운임이 수정되었습니다.' : `기업운임이 저장되었습니다. (${result.contractNo || ''})`);
      router.push(LIST_PATH);
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
    router.push(LIST_PATH);
  };

  // 신규 등록
  const handleNew = () => {
    router.push(window.location.pathname);
  };

  // 삭제 처리
  const handleDelete = async () => {
    if (!rateId || !confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/rate/corporate/air?ids=${rateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      setHasUnsavedChanges(false);
      alert('기업운임이 삭제되었습니다.');
      router.push(LIST_PATH);
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  // 초기화
  const handleReset = () => {
    if (!confirm('입력한 내용을 모두 초기화하시겠습니까?')) return;
    setBasicInfo({
      contractNo: '',
      registrationDate: new Date().toISOString().split('T')[0],
      exportImport: 'export',
      businessType: 'LOCAL',
      tradeTerms: 'CFR',
      customerCode: '',
      customerName: '',
      customerManager: '',
      customerPhone: '',
      origin: '',
      originName: '',
      destination: '',
      destinationName: '',
      toBy1: '',
      toBy1Name: '',
      toBy2: '',
      toBy2Name: '',
      airline: '',
      airlineName: '',
      airlineManager: '',
      airlineTel: '',
      airlineFax: '',
      flightNo: '',
      inputEmployee: '홍길동',
      validFrom: new Date().toISOString().split('T')[0],
      validTo: '',
      remark: '',
    });
    setFreightItems([]);
    setTransportRates([]);
    setErrors({});
    setHasUnsavedChanges(false);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header title="기업운임관리 등록 (항공)" subtitle="Logis > 운임관리 > 기업운임관리 > 등록 (항공)" onClose={handleCloseClick} />

      <main ref={formRef} className="p-6">
        {/* 상단 버튼 */}
        <div className="sticky top-20 z-20 bg-white flex justify-end items-center mb-6 py-2 border-b border-gray-200">
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
              <p className="text-sm font-medium text-red-400">필수 입력 항목 (4개)</p>
              <p className="text-xs text-red-400/80 mt-1">
                등록일자, 거래처, 항공사, 유효기간 시작일은 필수 입력 항목입니다.
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
                <label className="block text-sm font-medium mb-1">계약번호</label>
                <input
                  type="text"
                  value={basicInfo.contractNo || '자동생성'}
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
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={basicInfo.customerCode}
                    onChange={(e) => setBasicInfo({ ...basicInfo, customerCode: e.target.value })}
                    className={`w-[120px] h-[32px] px-2 bg-white border rounded text-sm ${
                      errors.customerName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="코드"
                  />
                  <SearchIconButton onClick={() => handleCodeSearch('customer', 'customer')} />
                  <input
                    type="text"
                    value={basicInfo.customerName}
                    onChange={(e) => setBasicInfo({ ...basicInfo, customerName: e.target.value })}
                    className={`flex-1 h-[32px] px-2 bg-white border rounded text-sm ${
                      errors.customerName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="이름/상호"
                  />
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

              {/* 3행 - 공항 */}
              <div>
                <label className="block text-sm font-medium mb-1">출발공항</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={basicInfo.origin}
                    onChange={(e) => setBasicInfo({ ...basicInfo, origin: e.target.value })}
                    className="w-[80px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm"
                    placeholder="코드"
                  />
                  <SearchIconButton onClick={() => handleLocationSearch('origin')} />
                  <input
                    type="text"
                    value={basicInfo.originName}
                    readOnly
                    className="flex-1 h-[32px] px-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-500"
                    placeholder="이름"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">경유지 1</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={basicInfo.toBy1}
                    onChange={(e) => setBasicInfo({ ...basicInfo, toBy1: e.target.value })}
                    className="w-[80px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm"
                    placeholder="코드"
                  />
                  <SearchIconButton onClick={() => handleLocationSearch('toBy1')} />
                  <input
                    type="text"
                    value={basicInfo.toBy1Name}
                    readOnly
                    className="flex-1 h-[32px] px-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-500"
                    placeholder="이름"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">경유지 2</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={basicInfo.toBy2}
                    onChange={(e) => setBasicInfo({ ...basicInfo, toBy2: e.target.value })}
                    className="w-[80px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm"
                    placeholder="코드"
                  />
                  <SearchIconButton onClick={() => handleLocationSearch('toBy2')} />
                  <input
                    type="text"
                    value={basicInfo.toBy2Name}
                    readOnly
                    className="flex-1 h-[32px] px-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-500"
                    placeholder="이름"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">도착공항</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={basicInfo.destination}
                    onChange={(e) => setBasicInfo({ ...basicInfo, destination: e.target.value })}
                    className="w-[80px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm"
                    placeholder="코드"
                  />
                  <SearchIconButton onClick={() => handleLocationSearch('destination')} />
                  <input
                    type="text"
                    value={basicInfo.destinationName}
                    readOnly
                    className="flex-1 h-[32px] px-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-500"
                    placeholder="이름"
                  />
                </div>
              </div>

              {/* 4행 - 항공사 정보 */}
              <div>
                <label className="block text-sm font-medium mb-1">항공사 <RequiredBadge /></label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={basicInfo.airline}
                    onChange={(e) => setBasicInfo({ ...basicInfo, airline: e.target.value })}
                    className={`w-[120px] h-[32px] px-2 bg-white border rounded text-sm ${
                      errors.airline ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="코드"
                  />
                  <SearchIconButton onClick={() => handleCodeSearch('airline', 'airline')} />
                  <input
                    type="text"
                    value={basicInfo.airlineName}
                    onChange={(e) => setBasicInfo({ ...basicInfo, airlineName: e.target.value })}
                    className={`flex-1 h-[32px] px-2 bg-white border rounded text-sm ${
                      errors.airline ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="이름/상호"
                  />
                </div>
                <FieldError field="airline" />
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

              {/* 5행 - 편명/유효기간 */}
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
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">유효기간 <RequiredBadge /></label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={basicInfo.validFrom}
                    onChange={(e) => setBasicInfo({ ...basicInfo, validFrom: e.target.value })}
                    className={`flex-1 h-[38px] px-3 bg-[var(--surface-50)] border rounded-lg ${
                      errors.validFrom ? 'border-red-500' : 'border-[var(--border)]'
                    }`}
                  />
                  <span>~</span>
                  <input
                    type="date"
                    value={basicInfo.validTo}
                    onChange={(e) => setBasicInfo({ ...basicInfo, validTo: e.target.value })}
                    className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  />
                </div>
                <FieldError field="validFrom" />
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

              {/* 6행 - 비고 */}
              <div className="col-span-4">
                <label className="block text-sm font-medium mb-1">비고</label>
                <textarea
                  value={basicInfo.remark}
                  onChange={(e) => setBasicInfo({ ...basicInfo, remark: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg resize-none"
                  rows={2}
                  placeholder="비고사항을 입력하세요"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 운임정보 섹션 (항공) */}
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
                  <th className="p-2 text-center">통화단위</th>
                  <th className="p-2 text-center">Kg/Lb</th>
                  <th className="p-2 text-center">Min</th>
                  <th className="p-2 text-center">Awb</th>
                  <th className="p-2 text-center">Rate_45L</th>
                  <th className="p-2 text-center">Rate_45</th>
                  <th className="p-2 text-center">Rate_100</th>
                  <th className="p-2 text-center">Rate_300</th>
                  <th className="p-2 text-center">Rate_500</th>
                  <th className="p-2 text-center">Rate_1000</th>
                </tr>
              </thead>
              <tbody>
                {freightItems.map((item) => (
                  <tr key={item.id} className="border-t border-[var(--border)]">
                    <td className="p-2 text-center"><input type="checkbox" /></td>
                    <td className="p-2">
                      <select
                        value={item.freightType}
                        onChange={(e) => handleFreightChange(item.id, 'freightType', e.target.value)}
                        className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                      >
                        <option value="">선택</option>
                        <option value="AFC">AFC</option>
                        <option value="FSC">FSC</option>
                        <option value="SCC">SCC</option>
                        <option value="AWC">AWC</option>
                        <option value="THC">THC</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.freightCode}
                        onChange={(e) => handleFreightChange(item.id, 'freightCode', e.target.value)}
                        className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={item.currency}
                        onChange={(e) => handleFreightChange(item.id, 'currency', e.target.value)}
                        className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                      >
                        <option value="USD">USD</option>
                        <option value="KRW">KRW</option>
                        <option value="EUR">EUR</option>
                        <option value="JPY">JPY</option>
                        <option value="CNY">CNY</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <select
                        value={item.kgLb}
                        onChange={(e) => handleFreightChange(item.id, 'kgLb', e.target.value)}
                        className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                      >
                        <option value="Kg">Kg</option>
                        <option value="Lb">Lb</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.rateMinAir || ''}
                        onChange={(e) => handleFreightChange(item.id, 'rateMinAir', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                        placeholder="0"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.rateAwb || ''}
                        onChange={(e) => handleFreightChange(item.id, 'rateAwb', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                        placeholder="0"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.rate45l || ''}
                        onChange={(e) => handleFreightChange(item.id, 'rate45l', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                        placeholder="0"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.rate45 || ''}
                        onChange={(e) => handleFreightChange(item.id, 'rate45', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                        placeholder="0"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.rate100 || ''}
                        onChange={(e) => handleFreightChange(item.id, 'rate100', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                        placeholder="0"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.rate300 || ''}
                        onChange={(e) => handleFreightChange(item.id, 'rate300', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                        placeholder="0"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.rate500 || ''}
                        onChange={(e) => handleFreightChange(item.id, 'rate500', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                        placeholder="0"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.rate1000 || ''}
                        onChange={(e) => handleFreightChange(item.id, 'rate1000', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                        placeholder="0"
                      />
                    </td>
                  </tr>
                ))}
                {freightItems.length === 0 && (
                  <tr>
                    <td colSpan={13} className="p-4 text-center text-[var(--muted)]">운임정보를 추가해주세요.</td>
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
                <SearchIconButton onClick={() => {}} />
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
                <SearchIconButton onClick={() => {}} />
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
      </main>

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
    </div>
  );
}

export default function CorporateAirRateRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)] flex items-center justify-center">로딩중...</div>}>
      <CorporateAirRateRegisterContent />
    </Suspense>
  );
}
