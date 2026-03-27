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

// 운임정보 타입
interface FreightItem {
  id: string;
  selected: boolean;
  freightType: string;
  freightCode: string;
  currency: string;
  rateMin: number;
  rateBL: number;
  rateRTon: number;
  containerDry20: number;
  containerDry40: number;
  containerTypeACode: string;
  containerTypeARate: number;
  containerTypeBCode: string;
  containerTypeBRate: number;
  containerTypeCCode: string;
  containerTypeCRate: number;
  bulkRate: number;
}

// 운송요율 타입
interface TransportRateItem {
  id: string;
  selected: boolean;
  freightCode: string;
  origin: string;
  originName: string;
  destination: string;
  destinationName: string;
  lcl: number;
  ft20: number;
  ft40: number;
  etcRate: number;
  manager: string;
  phone: string;
  fax: string;
  email: string;
}

function CorporateSeaRegisterContent() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });
  const searchParams = useSearchParams();
  const rateId = searchParams.get('id');
  const isEditMode = !!rateId;
  const today = new Date().toISOString().split('T')[0];

  // 기본정보
  const [basicInfo, setBasicInfo] = useState({
    rateNo: '',
    exportImport: 'export',
    businessType: 'LOCAL',
    salesPerson: '',
    customerCode: '',
    customerName: '',
    carrierCode: '',
    carrierName: '',
    pol: '',
    polName: '',
    pod: '',
    podName: '',
    pod2: '',
    pod2Name: '',
    insuranceFee: 0,
    warehouseFee: 0,
    handlingFee: 0,
    inputEmployee: '홍길동',
    regionType: '',
  });

  // 운임정보 목록
  const [freightItems, setFreightItems] = useState<FreightItem[]>([]);

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
  const [currentLocationType, setCurrentLocationType] = useState<'airport' | 'seaport' | 'city'>('seaport');

  // 변경사항 추적
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 신규 입력 모드
  const [isNewMode, setIsNewMode] = useState(!isEditMode);

  // 전체선택 상태
  const [freightAllChecked, setFreightAllChecked] = useState(false);
  const [transportAllChecked, setTransportAllChecked] = useState(false);

  // useScreenClose 훅
  const {
    showModal: showCloseModal,
    handleCloseClick,
    handleModalClose,
    handleDiscard: handleDiscardChanges,
  } = useScreenClose({
    hasChanges: hasUnsavedChanges,
    listPath: '/logis/rate/corporate/sea',
  });

  // 수정 모드일 경우 데이터 로드
  useEffect(() => {
    if (!rateId) return;
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/logis/rate/corporate?id=${rateId}`);
        if (!response.ok) return;
        const data = await response.json();

        setBasicInfo(prev => ({
          ...prev,
          rateNo: data.rateNo || '',
          exportImport: data.exportImport || 'export',
          businessType: data.businessType || 'LOCAL',
          salesPerson: data.salesPerson || '',
          customerCode: data.customerCode || '',
          customerName: data.customerName || '',
          carrierCode: data.carrierCode || '',
          carrierName: data.carrierName || '',
          pol: data.pol || '',
          polName: data.polName || '',
          pod: data.pod || '',
          podName: data.podName || '',
          pod2: data.pod2 || '',
          pod2Name: data.pod2Name || '',
          insuranceFee: data.insuranceFee || 0,
          warehouseFee: data.warehouseFee || 0,
          handlingFee: data.handlingFee || 0,
          inputEmployee: data.inputEmployee || '홍길동',
          regionType: data.regionType || '',
        }));

        if (data.freightItems && data.freightItems.length > 0) {
          setFreightItems(data.freightItems.map((item: any) => ({
            ...item,
            selected: false,
          })));
        }

        if (data.transportRates && data.transportRates.length > 0) {
          setTransportRates(data.transportRates.map((item: any) => ({
            ...item,
            selected: false,
          })));
        }

        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      }
    };
    fetchData();
  }, [rateId]);

  // 폼 변경 감지
  useEffect(() => {
    if (basicInfo.customerName || basicInfo.pol || basicInfo.pod) {
      setHasUnsavedChanges(true);
    }
  }, [basicInfo.customerName, basicInfo.pol, basicInfo.pod]);

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
    } else if (currentField === 'carrier') {
      setBasicInfo(prev => ({
        ...prev,
        carrierCode: item.code,
        carrierName: item.name,
      }));
    }
    setShowCodeModal(false);
  };

  // 위치 검색 버튼 클릭
  const handleLocationSearch = (field: string) => {
    setCurrentField(field);
    setCurrentLocationType('seaport');
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

  // 유효성 검사
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!basicInfo.customerName) {
      newErrors.customerName = '거래처는 필수 입력 항목입니다';
    }
    if (!basicInfo.pol) {
      newErrors.pol = 'POL은 필수 입력 항목입니다';
    }
    if (!basicInfo.pod) {
      newErrors.pod = 'POD는 필수 입력 항목입니다';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const errorCount = Object.keys(errors).length;

  // --- 운임정보 행 관리 ---
  const handleAddFreight = () => {
    const newItem: FreightItem = {
      id: Date.now().toString(),
      selected: false,
      freightType: '',
      freightCode: '',
      currency: 'USD',
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
    };
    setFreightItems(prev => [...prev, newItem]);
    setHasUnsavedChanges(true);
  };

  const handleDeleteFreight = () => {
    const selected = freightItems.filter(item => item.selected);
    if (selected.length === 0) {
      alert('삭제할 항목을 선택해주세요.');
      return;
    }
    setFreightItems(prev => prev.filter(item => !item.selected));
    setFreightAllChecked(false);
    setHasUnsavedChanges(true);
  };

  const handleFreightSelectAll = (checked: boolean) => {
    setFreightAllChecked(checked);
    setFreightItems(prev => prev.map(item => ({ ...item, selected: checked })));
  };

  const handleFreightSelectRow = (id: string, checked: boolean) => {
    setFreightItems(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, selected: checked } : item);
      setFreightAllChecked(updated.every(item => item.selected) && updated.length > 0);
      return updated;
    });
  };

  const updateFreightItem = (id: string, field: keyof FreightItem, value: any) => {
    setFreightItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    setHasUnsavedChanges(true);
  };

  // --- 운송요율 행 관리 ---
  const handleAddTransportRate = () => {
    const newItem: TransportRateItem = {
      id: Date.now().toString(),
      selected: false,
      freightCode: '',
      origin: '',
      originName: '',
      destination: '',
      destinationName: '',
      lcl: 0,
      ft20: 0,
      ft40: 0,
      etcRate: 0,
      manager: '',
      phone: '',
      fax: '',
      email: '',
    };
    setTransportRates(prev => [...prev, newItem]);
    setHasUnsavedChanges(true);
  };

  const handleDeleteTransportRate = () => {
    const selected = transportRates.filter(item => item.selected);
    if (selected.length === 0) {
      alert('삭제할 항목을 선택해주세요.');
      return;
    }
    setTransportRates(prev => prev.filter(item => !item.selected));
    setTransportAllChecked(false);
    setHasUnsavedChanges(true);
  };

  const handleTransportSelectAll = (checked: boolean) => {
    setTransportAllChecked(checked);
    setTransportRates(prev => prev.map(item => ({ ...item, selected: checked })));
  };

  const handleTransportSelectRow = (id: string, checked: boolean) => {
    setTransportRates(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, selected: checked } : item);
      setTransportAllChecked(updated.every(item => item.selected) && updated.length > 0);
      return updated;
    });
  };

  const updateTransportItem = (id: string, field: keyof TransportRateItem, value: any) => {
    setTransportRates(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    setHasUnsavedChanges(true);
  };

  // 저장
  const handleSave = async () => {
    if (!validate()) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      id: isEditMode ? rateId : undefined,
      transportMode: 'SEA',
      exportImport: basicInfo.exportImport,
      businessType: basicInfo.businessType,
      salesPerson: basicInfo.salesPerson,
      customerCode: basicInfo.customerCode,
      customerName: basicInfo.customerName,
      carrierCode: basicInfo.carrierCode,
      carrierName: basicInfo.carrierName,
      pol: basicInfo.pol,
      polName: basicInfo.polName,
      pod: basicInfo.pod,
      podName: basicInfo.podName,
      pod2: basicInfo.pod2,
      pod2Name: basicInfo.pod2Name,
      insuranceFee: basicInfo.insuranceFee,
      warehouseFee: basicInfo.warehouseFee,
      handlingFee: basicInfo.handlingFee,
      inputEmployee: basicInfo.inputEmployee,
      regionType: basicInfo.regionType,
      freightItems: freightItems.map(({ selected, ...rest }) => rest),
      transportRates: transportRates.map(({ selected, ...rest }) => rest),
    };

    try {
      const response = await fetch('/api/logis/rate/corporate', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to save');

      const result = await response.json();
      setHasUnsavedChanges(false);
      setIsNewMode(false);
      alert(isEditMode ? '기업운임이 수정되었습니다.' : `기업운임이 저장되었습니다. (${result.rateNo || ''})`);
      router.push('/logis/rate/corporate/sea');
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
    router.push('/logis/rate/corporate/sea');
  };

  // 신규 등록
  const handleNew = () => {
    router.push(window.location.pathname);
  };

  // 초기화
  const handleReset = () => {
    if (!confirm('입력한 내용을 모두 초기화하시겠습니까?')) return;
    setBasicInfo({
      rateNo: '',
      exportImport: 'export',
      businessType: 'LOCAL',
      salesPerson: '',
      customerCode: '',
      customerName: '',
      carrierCode: '',
      carrierName: '',
      pol: '',
      polName: '',
      pod: '',
      podName: '',
      pod2: '',
      pod2Name: '',
      insuranceFee: 0,
      warehouseFee: 0,
      handlingFee: 0,
      inputEmployee: '홍길동',
      regionType: '',
    });
    setFreightItems([]);
    setTransportRates([]);
    setErrors({});
    setHasUnsavedChanges(false);
    setFreightAllChecked(false);
    setTransportAllChecked(false);
  };

  // 에러 메시지 표시 컴포넌트
  const FieldError = ({ field }: { field: string }) => {
    const errorMsg = errors[field];
    if (!errorMsg) return null;
    return <p className="text-red-400 text-xs mt-1">{errorMsg}</p>;
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header title="기업운임관리 등록 (해상)" subtitle="Logis > 운임관리 > 기업운임관리 (해상) > 등록" onClose={handleCloseClick} />

      <main ref={formRef} className="p-6">
        {/* 상단 버튼 */}
        <div className="sticky top-20 z-20 bg-white flex justify-end items-center mb-6 py-2 border-b border-gray-200">
          <div className="flex items-center gap-4">
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

        {/* ========== 기본정보 섹션 ========== */}
        <div className="card mb-6">
          <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#059669] rounded-full"></span>
              기본정보
            </h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-4 gap-4">
              {/* 1행: 운임번호, 수출입구분, 영업유형, 영업사원 */}
              <div>
                <label className="block text-sm font-medium mb-1">운임번호</label>
                <input
                  type="text"
                  value={basicInfo.rateNo || '자동생성'}
                  disabled
                  className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-[var(--muted)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">수출입구분</label>
                <div className="flex items-center gap-4 h-[38px]">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="exportImport"
                      value="export"
                      checked={basicInfo.exportImport === 'export'}
                      onChange={(e) => setBasicInfo({ ...basicInfo, exportImport: e.target.value })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">수출</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="exportImport"
                      value="import"
                      checked={basicInfo.exportImport === 'import'}
                      onChange={(e) => setBasicInfo({ ...basicInfo, exportImport: e.target.value })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">수입</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">영업유형</label>
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
              <div>
                <label className="block text-sm font-medium mb-1">영업사원</label>
                <input
                  type="text"
                  value={basicInfo.salesPerson}
                  onChange={(e) => { setBasicInfo({ ...basicInfo, salesPerson: e.target.value }); setHasUnsavedChanges(true); }}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="영업사원명"
                />
              </div>

              {/* 2행: 거래처, 선사, POL, POD */}
              <div>
                <label className="block text-sm font-medium mb-1">거래처</label>
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
                <label className="block text-sm font-medium mb-1">선사</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={basicInfo.carrierCode}
                    onChange={(e) => setBasicInfo({ ...basicInfo, carrierCode: e.target.value })}
                    className="w-[120px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm"
                    placeholder="코드"
                  />
                  <SearchIconButton onClick={() => handleCodeSearch('carrier', 'carrier')} />
                  <input
                    type="text"
                    value={basicInfo.carrierName}
                    onChange={(e) => setBasicInfo({ ...basicInfo, carrierName: e.target.value })}
                    className="flex-1 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm"
                    placeholder="이름/상호"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">POL</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={basicInfo.pol}
                    onChange={(e) => setBasicInfo({ ...basicInfo, pol: e.target.value })}
                    className={`w-[80px] h-[32px] px-2 bg-white border rounded text-sm ${
                      errors.pol ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="코드"
                  />
                  <SearchIconButton onClick={() => handleLocationSearch('pol')} />
                  <input
                    type="text"
                    value={basicInfo.polName}
                    readOnly
                    className="flex-1 h-[32px] px-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-500"
                    placeholder="이름"
                  />
                </div>
                <FieldError field="pol" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">POD</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={basicInfo.pod}
                    onChange={(e) => setBasicInfo({ ...basicInfo, pod: e.target.value })}
                    className={`w-[80px] h-[32px] px-2 bg-white border rounded text-sm ${
                      errors.pod ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="코드"
                  />
                  <SearchIconButton onClick={() => handleLocationSearch('pod')} />
                  <input
                    type="text"
                    value={basicInfo.podName}
                    readOnly
                    className="flex-1 h-[32px] px-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-500"
                    placeholder="이름"
                  />
                </div>
                <FieldError field="pod" />
              </div>

              {/* 3행: POD2, 보험료, 창고료, 작업료 */}
              <div>
                <label className="block text-sm font-medium mb-1">POD2</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={basicInfo.pod2}
                    onChange={(e) => setBasicInfo({ ...basicInfo, pod2: e.target.value })}
                    className="w-[80px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm"
                    placeholder="코드"
                  />
                  <SearchIconButton onClick={() => handleLocationSearch('pod2')} />
                  <input
                    type="text"
                    value={basicInfo.pod2Name}
                    readOnly
                    className="flex-1 h-[32px] px-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-500"
                    placeholder="이름"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">보험료</label>
                <input
                  type="number"
                  value={basicInfo.insuranceFee}
                  onChange={(e) => { setBasicInfo({ ...basicInfo, insuranceFee: parseFloat(e.target.value) || 0 }); setHasUnsavedChanges(true); }}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-right"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">창고료</label>
                <input
                  type="number"
                  value={basicInfo.warehouseFee}
                  onChange={(e) => { setBasicInfo({ ...basicInfo, warehouseFee: parseFloat(e.target.value) || 0 }); setHasUnsavedChanges(true); }}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-right"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">작업료</label>
                <input
                  type="number"
                  value={basicInfo.handlingFee}
                  onChange={(e) => { setBasicInfo({ ...basicInfo, handlingFee: parseFloat(e.target.value) || 0 }); setHasUnsavedChanges(true); }}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-right"
                  placeholder="0"
                />
              </div>

              {/* 4행: 입력사원, 지역구분 */}
              <div>
                <label className="block text-sm font-medium mb-1">입력사원</label>
                <input
                  type="text"
                  value={basicInfo.inputEmployee}
                  disabled
                  className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-[var(--muted)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">지역구분</label>
                <select
                  value={basicInfo.regionType}
                  onChange={(e) => { setBasicInfo({ ...basicInfo, regionType: e.target.value }); setHasUnsavedChanges(true); }}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                >
                  <option value="">선택</option>
                  <option value="ASIA">아시아</option>
                  <option value="EUROPE">유럽</option>
                  <option value="NAMERICA">북미</option>
                  <option value="SAMERICA">남미</option>
                  <option value="OCEANIA">대양주</option>
                  <option value="AFRICA">아프리카</option>
                  <option value="MIDEAST">중동</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ========== 운임정보 섹션 ========== */}
        <div className="card mb-6">
          <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#E8A838] rounded-full"></span>
              운임정보
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleAddFreight}
                className="px-3 py-1.5 text-sm bg-[#1A2744] text-white rounded-lg hover:bg-[#243354]"
              >
                추가
              </button>
              <button
                onClick={handleDeleteFreight}
                className="px-3 py-1.5 text-sm bg-[var(--surface-100)] rounded-lg hover:bg-[var(--surface-200)]"
              >
                선택삭제
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface-100)]">
                <tr>
                  <th rowSpan={2} className="w-10 p-2 text-center border-r border-[var(--border)]">
                    <input
                      type="checkbox"
                      checked={freightAllChecked}
                      onChange={(e) => handleFreightSelectAll(e.target.checked)}
                    />
                  </th>
                  <th rowSpan={2} className="p-2 text-center border-r border-[var(--border)]">운임유형</th>
                  <th rowSpan={2} className="p-2 text-center border-r border-[var(--border)]">운임코드</th>
                  <th rowSpan={2} className="p-2 text-center border-r border-[var(--border)]">통화단위</th>
                  <th colSpan={3} className="p-2 text-center border-r border-[var(--border)] border-b">Rate Per</th>
                  <th colSpan={2} className="p-2 text-center border-r border-[var(--border)] border-b">Container DRY</th>
                  <th colSpan={2} className="p-2 text-center border-r border-[var(--border)] border-b">Container Type A</th>
                  <th colSpan={2} className="p-2 text-center border-r border-[var(--border)] border-b">Container Type B</th>
                  <th colSpan={2} className="p-2 text-center border-r border-[var(--border)] border-b">Container Type C</th>
                  <th rowSpan={2} className="p-2 text-center">Bulk</th>
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
                  <th className="p-1 text-center text-xs">Rate</th>
                </tr>
              </thead>
              <tbody>
                {freightItems.map((item) => (
                  <tr key={item.id} className="border-t border-[var(--border)] bg-white">
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={(e) => handleFreightSelectRow(item.id, e.target.checked)}
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={item.freightType}
                        onChange={(e) => updateFreightItem(item.id, 'freightType', e.target.value)}
                        className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                      >
                        <option value="">선택</option>
                        <option value="SFC">SFC</option>
                        <option value="OFC">OFC</option>
                        <option value="THC">THC</option>
                        <option value="DOC">DOC</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.freightCode}
                        onChange={(e) => updateFreightItem(item.id, 'freightCode', e.target.value)}
                        className="w-16 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={item.currency}
                        onChange={(e) => updateFreightItem(item.id, 'currency', e.target.value)}
                        className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                      >
                        <option value="USD">USD</option>
                        <option value="KRW">KRW</option>
                      </select>
                    </td>
                    {/* Rate Per */}
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.rateMin || ''}
                        onChange={(e) => updateFreightItem(item.id, 'rateMin', parseFloat(e.target.value) || 0)}
                        className="w-14 px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                        placeholder="Min"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.rateBL || ''}
                        onChange={(e) => updateFreightItem(item.id, 'rateBL', parseFloat(e.target.value) || 0)}
                        className="w-14 px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                        placeholder="B/L"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.rateRTon || ''}
                        onChange={(e) => updateFreightItem(item.id, 'rateRTon', parseFloat(e.target.value) || 0)}
                        className="w-14 px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                        placeholder="R.Ton"
                      />
                    </td>
                    {/* Container DRY */}
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.containerDry20 || ''}
                        onChange={(e) => updateFreightItem(item.id, 'containerDry20', parseFloat(e.target.value) || 0)}
                        className="w-14 px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                        placeholder="20"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.containerDry40 || ''}
                        onChange={(e) => updateFreightItem(item.id, 'containerDry40', parseFloat(e.target.value) || 0)}
                        className="w-14 px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                        placeholder="40"
                      />
                    </td>
                    {/* Container Type A */}
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.containerTypeACode}
                        onChange={(e) => updateFreightItem(item.id, 'containerTypeACode', e.target.value)}
                        className="w-14 px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                        placeholder="Code"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.containerTypeARate || ''}
                        onChange={(e) => updateFreightItem(item.id, 'containerTypeARate', parseFloat(e.target.value) || 0)}
                        className="w-14 px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                        placeholder="Rate"
                      />
                    </td>
                    {/* Container Type B */}
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.containerTypeBCode}
                        onChange={(e) => updateFreightItem(item.id, 'containerTypeBCode', e.target.value)}
                        className="w-14 px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                        placeholder="Code"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.containerTypeBRate || ''}
                        onChange={(e) => updateFreightItem(item.id, 'containerTypeBRate', parseFloat(e.target.value) || 0)}
                        className="w-14 px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                        placeholder="Rate"
                      />
                    </td>
                    {/* Container Type C */}
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.containerTypeCCode}
                        onChange={(e) => updateFreightItem(item.id, 'containerTypeCCode', e.target.value)}
                        className="w-14 px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                        placeholder="Code"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.containerTypeCRate || ''}
                        onChange={(e) => updateFreightItem(item.id, 'containerTypeCRate', parseFloat(e.target.value) || 0)}
                        className="w-14 px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                        placeholder="Rate"
                      />
                    </td>
                    {/* Bulk */}
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.bulkRate || ''}
                        onChange={(e) => updateFreightItem(item.id, 'bulkRate', parseFloat(e.target.value) || 0)}
                        className="w-14 px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                      />
                    </td>
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

        {/* ========== 운송요율 섹션 ========== */}
        <div className="card">
          <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#2563EB] rounded-full"></span>
              운송요율
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleAddTransportRate}
                className="px-3 py-1.5 text-sm bg-[#1A2744] text-white rounded-lg hover:bg-[#243354]"
              >
                추가
              </button>
              <button
                onClick={handleDeleteTransportRate}
                className="px-3 py-1.5 text-sm bg-[var(--surface-100)] rounded-lg hover:bg-[var(--surface-200)]"
              >
                선택삭제
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface-100)]">
                <tr>
                  <th className="w-10 p-2 text-center"><input type="checkbox" checked={transportAllChecked} onChange={(e) => handleTransportSelectAll(e.target.checked)} /></th>
                  <th className="p-2 text-center">운임코드</th>
                  <th className="p-2 text-center">출발지</th>
                  <th className="p-2 text-center">출발지명</th>
                  <th className="p-2 text-center">도착지</th>
                  <th className="p-2 text-center">도착지명</th>
                  <th className="p-2 text-center">LCL</th>
                  <th className="p-2 text-center">20&apos;</th>
                  <th className="p-2 text-center">40&apos;</th>
                  <th className="p-2 text-center">기타운송료</th>
                  <th className="p-2 text-center">담당자</th>
                  <th className="p-2 text-center">전화</th>
                  <th className="p-2 text-center">팩스</th>
                  <th className="p-2 text-center">Email</th>
                </tr>
              </thead>
              <tbody>
                {transportRates.map((item) => (
                  <tr key={item.id} className="border-t border-[var(--border)] bg-white">
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={(e) => handleTransportSelectRow(item.id, e.target.checked)}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.freightCode}
                        onChange={(e) => updateTransportItem(item.id, 'freightCode', e.target.value)}
                        className="w-20 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.origin}
                        onChange={(e) => updateTransportItem(item.id, 'origin', e.target.value)}
                        className="w-20 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.originName}
                        onChange={(e) => updateTransportItem(item.id, 'originName', e.target.value)}
                        className="w-24 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.destination}
                        onChange={(e) => updateTransportItem(item.id, 'destination', e.target.value)}
                        className="w-20 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.destinationName}
                        onChange={(e) => updateTransportItem(item.id, 'destinationName', e.target.value)}
                        className="w-24 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.lcl || ''}
                        onChange={(e) => updateTransportItem(item.id, 'lcl', parseFloat(e.target.value) || 0)}
                        className="w-16 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.ft20 || ''}
                        onChange={(e) => updateTransportItem(item.id, 'ft20', parseFloat(e.target.value) || 0)}
                        className="w-16 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.ft40 || ''}
                        onChange={(e) => updateTransportItem(item.id, 'ft40', parseFloat(e.target.value) || 0)}
                        className="w-16 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.etcRate || ''}
                        onChange={(e) => updateTransportItem(item.id, 'etcRate', parseFloat(e.target.value) || 0)}
                        className="w-16 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.manager}
                        onChange={(e) => updateTransportItem(item.id, 'manager', e.target.value)}
                        className="w-20 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.phone}
                        onChange={(e) => updateTransportItem(item.id, 'phone', e.target.value)}
                        className="w-24 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.fax}
                        onChange={(e) => updateTransportItem(item.id, 'fax', e.target.value)}
                        className="w-24 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="email"
                        value={item.email}
                        onChange={(e) => updateTransportItem(item.id, 'email', e.target.value)}
                        className="w-32 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                      />
                    </td>
                  </tr>
                ))}
                {transportRates.length === 0 && (
                  <tr>
                    <td colSpan={14} className="p-4 text-center text-[var(--muted)]">운송요율 정보를 추가해주세요.</td>
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
        type={currentLocationType}
      />
    </div>
  );
}

export default function CorporateSeaRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)] flex items-center justify-center">로딩중...</div>}>
      <CorporateSeaRegisterContent />
    </Suspense>
  );
}
