'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import DimensionsCalcModal from '@/components/popup/DimensionsCalcModal';
import CodeSearchModal, { CodeType, CodeItem } from '@/components/popup/CodeSearchModal';
import { formatCurrency } from '@/utils/format';

// 화면설계서 UI-G-01-07-06 기준 탭 타입
type TabType = 'MAIN' | 'CARGO' | 'OTHER';

// MAWB Check Digit 검증 (11자리)
const validateMAWBCheckDigit = (mawbNo: string): boolean => {
  const cleaned = mawbNo.replace(/-/g, '');
  if (cleaned.length !== 11) return false;
  const serial = cleaned.substring(3, 10);
  const checkDigit = parseInt(cleaned.substring(10));
  return (parseInt(serial) % 7) === checkDigit;
};

// MAIN TAB 데이터 인터페이스
interface MainData {
  ioType: string;              // 수출입구분
  jobNo: string;               // JOB NO
  bookingNo: string;           // BOOKING NO
  mawbNo: string;              // MAWB NO
  hawbNo: string;              // HAWB NO
  shipperCode: string;
  shipperName: string;
  shipperAddress: string;
  consigneeCode: string;
  consigneeName: string;
  consigneeAddress: string;
  consigneeCopy: boolean;
  notifyCode: string;
  notifyName: string;
  notifyAddress: string;
  notifySameAs: boolean;
  currencyCode: string;        // 통화종류
  wtVal: string;               // WT/VAL (P/C)
  otherChgs: string;           // OTHER (P/C)
  chgsCode: string;            // CHGS CODE
  netCode: string;             // Net..
  netName: string;
  departure: string;           // 출발지
  arrival: string;             // 도착지
  flightNo: string;            // Flight No.
  flightDate: string;
  handlingInfo: string;        // HANDLING INFORMATION
}

// CARGO TAB 데이터 인터페이스
interface CargoData {
  cargoItems: CargoItem[];
  otherCharges: OtherCharge[];
  natureOfGoods: string;       // Nature and Quantity of Goods
  weightCharge: number;        // Weight Charge
  dimensions: DimensionItem[];
  totalPcs: number;
  totalVolume: number;
  atPlace: string;             // At(Place)
  signatureCarrier: string;    // Signature of Issuing Carrier
}

// OTHER TAB 데이터 인터페이스
interface OtherData {
  agentCode: string;
  agentName: string;
  subAgentCode: string;
  subAgentName: string;
  partnerCode: string;
  partnerName: string;
  airlineCode: string;
  airlineName: string;
  regionCode: string;
  countryCode: string;
  mrnNo: string;
  msn: string;
  lcNo: string;
  poNo: string;
  createdAt: string;
  updatedAt: string;
}

// Cargo Item
interface CargoItem {
  id: string;
  piecesRcp: number;           // No. of pieces RCP
  grossWeight: number;         // GrossWeight
  weightUnit: string;          // Kg/lb
  rateClass: string;           // Rate Class/Commodity Item No.
  chargeableWeight: number;    // Chargeable Weight
  rateCharge: number;          // Rate/Charge
  total: number;               // Total
  asArranged: boolean;         // As Arranged
}

// Other Charge
interface OtherCharge {
  id: string;
  codes: string;               // Codes
  currency: string;            // CUR
  rate: number;                // Rate
  amount: number;              // Amount
  pc: string;                  // P/C
  ac: string;                  // A/C
}

// Dimension Item
interface DimensionItem {
  id: string;
  print: boolean;
  width: number;
  length: number;
  height: number;
  pcs: number;
  volume: number;
}

const initialMainData: MainData = {
  ioType: 'OUT',
  jobNo: '',
  bookingNo: '',
  mawbNo: '',
  hawbNo: '',
  shipperCode: '',
  shipperName: '',
  shipperAddress: '',
  consigneeCode: '',
  consigneeName: '',
  consigneeAddress: '',
  consigneeCopy: false,
  notifyCode: '',
  notifyName: '',
  notifyAddress: '',
  notifySameAs: false,
  currencyCode: 'USD',
  wtVal: 'C',
  otherChgs: 'C',
  chgsCode: '',
  netCode: '',
  netName: '',
  departure: 'ICN',
  arrival: '',
  flightNo: '',
  flightDate: '',
  handlingInfo: '',
};

const initialCargoData: CargoData = {
  cargoItems: [],
  otherCharges: [],
  natureOfGoods: '',
  weightCharge: 0,
  dimensions: [],
  totalPcs: 0,
  totalVolume: 0,
  atPlace: '',
  signatureCarrier: '',
};

const initialOtherData: OtherData = {
  agentCode: '',
  agentName: '',
  subAgentCode: '',
  subAgentName: '',
  partnerCode: '',
  partnerName: '',
  airlineCode: '',
  airlineName: '',
  regionCode: '',
  countryCode: '',
  mrnNo: '',
  msn: '',
  lcNo: '',
  poNo: '',
  createdAt: '',
  updatedAt: '',
};

function AWBRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [activeTab, setActiveTab] = useState<TabType>('MAIN');
  const [mainData, setMainData] = useState<MainData>(initialMainData);
  const [cargoData, setCargoData] = useState<CargoData>(initialCargoData);
  const [otherData, setOtherData] = useState<OtherData>(initialOtherData);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showDimensionsModal, setShowDimensionsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [mawbError, setMawbError] = useState('');

  // 검색 팝업 상태
  const [showCodeSearchModal, setShowCodeSearchModal] = useState(false);
  const [searchModalType, setSearchModalType] = useState<CodeType>('customer');
  const [searchTargetCallback, setSearchTargetCallback] = useState<((item: CodeItem) => void) | null>(null);

  // 검색 팝업 열기
  const openCodeSearchModal = (codeType: CodeType, callback: (item: CodeItem) => void) => {
    setSearchModalType(codeType);
    setSearchTargetCallback(() => callback);
    setShowCodeSearchModal(true);
  };

  // 검색 팝업에서 선택 처리
  const handleCodeSelect = (item: CodeItem) => {
    if (searchTargetCallback) {
      searchTargetCallback(item);
    }
    setShowCodeSearchModal(false);
  };

  // 화면닫기 핸들러
  const handleConfirmClose = () => {
    setShowCloseModal(false);
    router.push('/logis/bl/air');
  };

  useCloseConfirm({
    showModal: showCloseModal,
    setShowModal: setShowCloseModal,
    onConfirmClose: handleConfirmClose,
  });

  // 수정 모드일 경우 데이터 로드
  useEffect(() => {
    if (editId) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/bl/air?awbId=${editId}`);
          if (response.ok) {
            const data = await response.json();
            setMainData(prev => ({
              ...prev,
              ...data,
            }));
            setIsSaved(true);
          }
        } catch (error) {
          console.error('Failed to fetch AWB data:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [editId]);

  // 통화종류 변경시 WT/VAL, OTHER 연동
  useEffect(() => {
    if (mainData.currencyCode === 'KRW') {
      setMainData(prev => ({ ...prev, wtVal: 'P', otherChgs: 'P' }));
    } else {
      setMainData(prev => ({ ...prev, wtVal: 'C', otherChgs: 'C' }));
    }
  }, [mainData.currencyCode]);

  // Copy 체크시 Shipper 정보 복사
  useEffect(() => {
    if (mainData.consigneeCopy) {
      setMainData(prev => ({
        ...prev,
        consigneeName: prev.shipperName,
        consigneeAddress: prev.shipperAddress,
      }));
    }
  }, [mainData.consigneeCopy, mainData.shipperName, mainData.shipperAddress]);

  // Same As 체크시 Consignee와 동일하게 처리
  useEffect(() => {
    if (mainData.notifySameAs) {
      setMainData(prev => ({
        ...prev,
        notifyCode: '',
        notifyName: 'SAME AS CONSIGNEE',
        notifyAddress: '',
      }));
    }
  }, [mainData.notifySameAs]);

  // MAWB NO 검증
  const handleMawbChange = (value: string) => {
    setMainData(prev => ({ ...prev, mawbNo: value }));

    // 11자리 입력시 Check Digit 검증
    const cleaned = value.replace(/-/g, '');
    if (cleaned.length === 11) {
      if (!validateMAWBCheckDigit(value)) {
        setMawbError('MAWB Check Digit가 유효하지 않습니다.');
      } else {
        setMawbError('');
      }
    } else if (cleaned.length > 0 && cleaned.length < 11) {
      setMawbError('MAWB는 11자리 숫자여야 합니다.');
    } else {
      setMawbError('');
    }
  };

  // 핸들러
  const handleMainChange = (field: keyof MainData, value: string | boolean) => {
    setMainData(prev => ({ ...prev, [field]: value }));
  };

  const handleCargoChange = (field: keyof CargoData, value: unknown) => {
    setCargoData(prev => ({ ...prev, [field]: value }));
  };

  const handleOtherChange = (field: keyof OtherData, value: string) => {
    setOtherData(prev => ({ ...prev, [field]: value }));
  };

  // Cargo Item 추가
  const addCargoItem = () => {
    const newItem: CargoItem = {
      id: `CARGO-${Date.now()}`,
      piecesRcp: 0,
      grossWeight: 0,
      weightUnit: 'K',
      rateClass: '',
      chargeableWeight: 0,
      rateCharge: 0,
      total: 0,
      asArranged: false,
    };
    setCargoData(prev => ({
      ...prev,
      cargoItems: [...prev.cargoItems, newItem],
    }));
  };

  // Cargo Item 삭제
  const removeCargoItem = (id: string) => {
    setCargoData(prev => ({
      ...prev,
      cargoItems: prev.cargoItems.filter(c => c.id !== id),
    }));
  };

  // Other Charge 추가
  const addOtherCharge = () => {
    const newCharge: OtherCharge = {
      id: `CHG-${Date.now()}`,
      codes: '',
      currency: 'USD',
      rate: 0,
      amount: 0,
      pc: 'P',
      ac: '',
    };
    setCargoData(prev => ({
      ...prev,
      otherCharges: [...prev.otherCharges, newCharge],
    }));
  };

  // Other Charge 삭제
  const removeOtherCharge = (id: string) => {
    setCargoData(prev => ({
      ...prev,
      otherCharges: prev.otherCharges.filter(c => c.id !== id),
    }));
  };

  // Dimensions 적용
  const handleDimensionsApply = (dimensions: DimensionItem[], totalPcs: number, totalVolume: number) => {
    setCargoData(prev => ({
      ...prev,
      dimensions,
      totalPcs,
      totalVolume,
    }));
  };

  // 저장
  const handleSave = async () => {
    if (!mainData.hawbNo) {
      alert('HAWB NO는 필수 입력값입니다.');
      return;
    }

    if (mawbError) {
      alert('MAWB NO를 확인해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/bl/air', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editId,
          main: mainData,
          cargo: cargoData,
          other: otherData,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (!editId && result.jobNo) {
          setMainData(prev => ({ ...prev, jobNo: result.jobNo }));
        }
        setIsSaved(true);
        alert('저장되었습니다.');
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('Save error:', error);
      const jobNo = mainData.jobNo || `AEX-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
      setMainData(prev => ({ ...prev, jobNo }));
      setIsSaved(true);
      alert('저장되었습니다. (로컬)');
    } finally {
      setIsLoading(false);
    }
  };

  // House 신규 (MAWB 유지, HAWB 초기화)
  const handleHouseNew = () => {
    if (!isSaved) {
      alert('저장 완료 후 House 신규가 가능합니다.');
      return;
    }
    setMainData(prev => ({
      ...prev,
      jobNo: '',
      hawbNo: '',
    }));
    setIsSaved(false);
    alert('MAWB를 유지하고 새로운 HAWB를 입력해주세요.');
  };

  // AWB 복사 (JOB NO, MAWB NO, HAWB NO 초기화)
  const handleCopyAWB = () => {
    if (!isSaved) {
      alert('저장 완료 후 AWB 복사가 가능합니다.');
      return;
    }
    setMainData(prev => ({
      ...prev,
      jobNo: '',
      mawbNo: '',
      hawbNo: '',
    }));
    setIsSaved(false);
    alert('AWB가 복사되었습니다. 새로운 AWB NO를 입력해주세요.');
  };

  // 목록으로
  const handleList = () => {
    router.push('/logis/bl/air');
  };

  // 탭 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 'MAIN':
        return renderMainTab();
      case 'CARGO':
        return renderCargoTab();
      case 'OTHER':
        return renderOtherTab();
      default:
        return null;
    }
  };

  // MAIN TAB 렌더링
  const renderMainTab = () => (
    <div className="space-y-6">
      {/* Main Information */}
      <div className="card">
        <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="font-bold">Main Information</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-6 gap-4 mb-4">
            {/* 수출입구분 */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">
                수출입구분 <span className="text-red-500">*</span>
              </label>
              <select
                value={mainData.ioType}
                onChange={e => handleMainChange('ioType', e.target.value)}
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
              >
                <option value="OUT">수출(OUT)</option>
                <option value="IN">수입(IN)</option>
              </select>
            </div>
            {/* JOB NO */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">JOB NO</label>
              <input
                type="text"
                value={mainData.jobNo}
                readOnly
                className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm"
                placeholder="자동생성"
              />
            </div>
            {/* BOOKING NO */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">BOOKING NO</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={mainData.bookingNo}
                  onChange={e => handleMainChange('bookingNo', e.target.value)}
                  className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                />
                <button className="px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] text-sm">
                  부킹조회
                </button>
              </div>
            </div>
            {/* 통화종류 */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">통화종류</label>
              <select
                value={mainData.currencyCode}
                onChange={e => handleMainChange('currencyCode', e.target.value)}
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
              >
                <option value="USD">USD</option>
                <option value="KRW">KRW</option>
                <option value="EUR">EUR</option>
                <option value="JPY">JPY</option>
              </select>
            </div>
            {/* WT/VAL */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">WT/VAL</label>
              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="wtVal"
                    value="P"
                    checked={mainData.wtVal === 'P'}
                    onChange={e => handleMainChange('wtVal', e.target.value)}
                    className="text-[#E8A838]"
                  />
                  <span className="text-sm">P</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="wtVal"
                    value="C"
                    checked={mainData.wtVal === 'C'}
                    onChange={e => handleMainChange('wtVal', e.target.value)}
                    className="text-[#E8A838]"
                  />
                  <span className="text-sm">C</span>
                </label>
              </div>
            </div>
            {/* OTHER */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">OTHER</label>
              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="otherChgs"
                    value="P"
                    checked={mainData.otherChgs === 'P'}
                    onChange={e => handleMainChange('otherChgs', e.target.value)}
                    className="text-[#E8A838]"
                  />
                  <span className="text-sm">P</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="otherChgs"
                    value="C"
                    checked={mainData.otherChgs === 'C'}
                    onChange={e => handleMainChange('otherChgs', e.target.value)}
                    className="text-[#E8A838]"
                  />
                  <span className="text-sm">C</span>
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-4 mb-4">
            {/* MAWB NO */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">
                MAWB NO
              </label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={mainData.mawbNo}
                  onChange={e => handleMawbChange(e.target.value)}
                  className={`flex-1 h-[38px] px-3 bg-[var(--surface-50)] border rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm ${mawbError ? 'border-red-500' : 'border-[var(--border)]'}`}
                  placeholder="000-00000000"
                  maxLength={12}
                />
                <button className="px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
              {mawbError && <p className="text-xs text-red-500 mt-1">{mawbError}</p>}
            </div>
            {/* HAWB NO */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">
                HAWB NO <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={mainData.hawbNo}
                  onChange={e => handleMainChange('hawbNo', e.target.value)}
                  className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                  placeholder="HAWB NO"
                />
                <button className="px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Account Information 표시 */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ACCOUNT INFORMATION</label>
              <div className="h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm">
                {mainData.wtVal === 'P' ? 'Freight Prepaid' : 'Freight Collect'}
              </div>
            </div>
          </div>

          {/* Shipper / Consignee / Notify */}
          <div className="grid grid-cols-3 gap-4">
            {/* SHIPPER */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">SHIPPER</label>
              <div className="flex gap-1 mb-2">
                <input
                  type="text"
                  value={mainData.shipperCode}
                  onChange={e => handleMainChange('shipperCode', e.target.value)}
                  className="w-24 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                  placeholder="코드"
                />
                <input
                  type="text"
                  value={mainData.shipperName}
                  onChange={e => handleMainChange('shipperName', e.target.value)}
                  className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                  placeholder="Shipper Name"
                />
                <button
                  onClick={() => openCodeSearchModal('customer', (item) => {
                    setMainData(prev => ({ ...prev, shipperCode: item.code, shipperName: item.name }));
                  })}
                  className="px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
              <textarea
                value={mainData.shipperAddress}
                onChange={e => handleMainChange('shipperAddress', e.target.value)}
                rows={3}
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm resize-none"
                placeholder="Address"
              />
            </div>
            {/* CONSIGNEE */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-[var(--foreground)]">CONSIGNEE</label>
                <label className="flex items-center gap-1 text-xs text-[var(--foreground)]">
                  <input
                    type="checkbox"
                    checked={mainData.consigneeCopy}
                    onChange={e => handleMainChange('consigneeCopy', e.target.checked)}
                    className="rounded"
                  />
                  Copy
                </label>
              </div>
              <div className="flex gap-1 mb-2">
                <input
                  type="text"
                  value={mainData.consigneeCode}
                  onChange={e => handleMainChange('consigneeCode', e.target.value)}
                  className="w-24 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                  placeholder="코드"
                />
                <input
                  type="text"
                  value={mainData.consigneeName}
                  onChange={e => handleMainChange('consigneeName', e.target.value)}
                  className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                  placeholder="Consignee Name"
                />
                <button
                  onClick={() => openCodeSearchModal('customer', (item) => {
                    setMainData(prev => ({ ...prev, consigneeCode: item.code, consigneeName: item.name }));
                  })}
                  className="px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
              <textarea
                value={mainData.consigneeAddress}
                onChange={e => handleMainChange('consigneeAddress', e.target.value)}
                rows={3}
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm resize-none"
                placeholder="Address"
              />
            </div>
            {/* NOTIFY */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-[var(--foreground)]">NOTIFY PARTY</label>
                <label className="flex items-center gap-1 text-xs text-[var(--foreground)]">
                  <input
                    type="checkbox"
                    checked={mainData.notifySameAs}
                    onChange={e => handleMainChange('notifySameAs', e.target.checked)}
                    className="rounded"
                  />
                  Same As
                </label>
              </div>
              <div className="flex gap-1 mb-2">
                <input
                  type="text"
                  value={mainData.notifyCode}
                  onChange={e => handleMainChange('notifyCode', e.target.value)}
                  className="w-24 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                  placeholder="코드"
                  disabled={mainData.notifySameAs}
                />
                <input
                  type="text"
                  value={mainData.notifyName}
                  onChange={e => handleMainChange('notifyName', e.target.value)}
                  className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                  placeholder="Notify Name"
                  disabled={mainData.notifySameAs}
                />
                <button
                  onClick={() => openCodeSearchModal('customer', (item) => {
                    setMainData(prev => ({ ...prev, notifyCode: item.code, notifyName: item.name }));
                  })}
                  disabled={mainData.notifySameAs}
                  className="px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
              <textarea
                value={mainData.notifyAddress}
                onChange={e => handleMainChange('notifyAddress', e.target.value)}
                rows={3}
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm resize-none"
                placeholder="Address"
                disabled={mainData.notifySameAs}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Flight Information */}
      <div className="card">
        <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <h3 className="font-bold">Flight Information</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-6 gap-4">
            {/* 출발지 */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">출발지</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={mainData.departure}
                  onChange={e => handleMainChange('departure', e.target.value)}
                  className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                  placeholder="ICN"
                />
                <button
                  onClick={() => openCodeSearchModal('airport', (item) => {
                    setMainData(prev => ({ ...prev, departure: item.code }));
                  })}
                  className="px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
            {/* 도착지 */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">도착지</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={mainData.arrival}
                  onChange={e => handleMainChange('arrival', e.target.value)}
                  className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                  placeholder="LAX"
                />
                <button
                  onClick={() => openCodeSearchModal('airport', (item) => {
                    setMainData(prev => ({ ...prev, arrival: item.code }));
                  })}
                  className="px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Flight No. */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Flight No.</label>
              <input
                type="text"
                value={mainData.flightNo}
                onChange={e => handleMainChange('flightNo', e.target.value)}
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                placeholder="KE001"
              />
            </div>
            {/* Flight Date */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Flight Date</label>
              <input
                type="date"
                value={mainData.flightDate}
                onChange={e => handleMainChange('flightDate', e.target.value)}
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
              />
            </div>
            {/* HANDLING INFORMATION */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">HANDLING INFORMATION</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={mainData.handlingInfo}
                  onChange={e => handleMainChange('handlingInfo', e.target.value)}
                  className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                />
                <button className="px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // CARGO TAB 렌더링
  const renderCargoTab = () => (
    <div className="space-y-6">
      {/* Cargo Information */}
      <div className="card">
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="font-bold">Cargo Information</h3>
          </div>
          <button
            onClick={addCargoItem}
            className="px-3 py-1 text-sm bg-[#E8A838] text-white rounded hover:bg-[#d99a2f]"
          >
            추가
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="text-center w-12"></th>
                <th className="text-center">No. of pieces RCP</th>
                <th className="text-center">GrossWeight</th>
                <th className="text-center">Kg/lb</th>
                <th className="text-center">Rate Class</th>
                <th className="text-center">Chargeable Weight</th>
                <th className="text-center">Rate/Charge</th>
                <th className="text-center">Total</th>
                <th className="text-center">As Arranged</th>
              </tr>
            </thead>
            <tbody>
              {cargoData.cargoItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-[var(--muted)] text-sm">
                    Cargo 정보가 없습니다. 추가 버튼을 클릭하세요.
                  </td>
                </tr>
              ) : cargoData.cargoItems.map((item, index) => (
                <tr key={item.id} className="border-t border-[var(--border)]">
                  <td className="p-2 text-center">
                    <button
                      onClick={() => removeCargoItem(item.id)}
                      className="text-red-400 hover:text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={item.piecesRcp}
                      onChange={e => {
                        const updated = [...cargoData.cargoItems];
                        updated[index].piecesRcp = parseInt(e.target.value) || 0;
                        handleCargoChange('cargoItems', updated);
                      }}
                      className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={item.grossWeight}
                      onChange={e => {
                        const updated = [...cargoData.cargoItems];
                        updated[index].grossWeight = parseFloat(e.target.value) || 0;
                        handleCargoChange('cargoItems', updated);
                      }}
                      className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={item.weightUnit}
                      onChange={e => {
                        const updated = [...cargoData.cargoItems];
                        updated[index].weightUnit = e.target.value;
                        handleCargoChange('cargoItems', updated);
                      }}
                      className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                    >
                      <option value="K">K</option>
                      <option value="L">L</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.rateClass}
                      onChange={e => {
                        const updated = [...cargoData.cargoItems];
                        updated[index].rateClass = e.target.value;
                        handleCargoChange('cargoItems', updated);
                      }}
                      className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={item.chargeableWeight}
                      onChange={e => {
                        const updated = [...cargoData.cargoItems];
                        updated[index].chargeableWeight = parseFloat(e.target.value) || 0;
                        handleCargoChange('cargoItems', updated);
                      }}
                      className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={item.rateCharge}
                      onChange={e => {
                        const updated = [...cargoData.cargoItems];
                        updated[index].rateCharge = parseFloat(e.target.value) || 0;
                        updated[index].total = updated[index].chargeableWeight * updated[index].rateCharge;
                        handleCargoChange('cargoItems', updated);
                      }}
                      className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={formatCurrency(item.total)}
                      readOnly
                      className="w-full px-2 py-1 bg-[var(--surface-200)] border border-[var(--border)] rounded text-sm text-right"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={item.asArranged}
                      onChange={e => {
                        const updated = [...cargoData.cargoItems];
                        updated[index].asArranged = e.target.checked;
                        handleCargoChange('cargoItems', updated);
                      }}
                      className="rounded"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Other Charges */}
      <div className="card">
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
          <h3 className="font-bold">Other Charges</h3>
          <button
            onClick={addOtherCharge}
            className="px-3 py-1 text-sm bg-[#E8A838] text-white rounded hover:bg-[#d99a2f]"
          >
            추가
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="text-center w-12"></th>
                <th>Codes</th>
                <th className="text-center">CUR</th>
                <th className="text-center">Rate</th>
                <th className="text-center">Amount</th>
                <th className="text-center">P/C</th>
                <th className="text-center">A/C</th>
              </tr>
            </thead>
            <tbody>
              {cargoData.otherCharges.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-[var(--muted)] text-sm">
                    운임 정보가 없습니다.
                  </td>
                </tr>
              ) : cargoData.otherCharges.map((charge, index) => (
                <tr key={charge.id} className="border-t border-[var(--border)]">
                  <td className="p-2 text-center">
                    <button
                      onClick={() => removeOtherCharge(charge.id)}
                      className="text-red-400 hover:text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                  <td className="p-2">
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={charge.codes}
                        onChange={e => {
                          const updated = [...cargoData.otherCharges];
                          updated[index].codes = e.target.value;
                          handleCargoChange('otherCharges', updated);
                        }}
                        className="flex-1 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                      />
                      <button className="px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded hover:bg-[var(--surface-200)]">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td className="p-2">
                    <select
                      value={charge.currency}
                      onChange={e => {
                        const updated = [...cargoData.otherCharges];
                        updated[index].currency = e.target.value;
                        handleCargoChange('otherCharges', updated);
                      }}
                      className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                    >
                      <option value="USD">USD</option>
                      <option value="KRW">KRW</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={charge.rate}
                      onChange={e => {
                        const updated = [...cargoData.otherCharges];
                        updated[index].rate = parseFloat(e.target.value) || 0;
                        handleCargoChange('otherCharges', updated);
                      }}
                      className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={charge.amount}
                      onChange={e => {
                        const updated = [...cargoData.otherCharges];
                        updated[index].amount = parseFloat(e.target.value) || 0;
                        handleCargoChange('otherCharges', updated);
                      }}
                      className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={charge.pc}
                      onChange={e => {
                        const updated = [...cargoData.otherCharges];
                        updated[index].pc = e.target.value;
                        handleCargoChange('otherCharges', updated);
                      }}
                      className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                    >
                      <option value="P">P</option>
                      <option value="C">C</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={charge.ac}
                      onChange={e => {
                        const updated = [...cargoData.otherCharges];
                        updated[index].ac = e.target.value;
                        handleCargoChange('otherCharges', updated);
                      }}
                      className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nature of Goods & Dimensions */}
      <div className="card">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="font-bold">Additional Information</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Nature and Quantity of Goods */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Nature and Quantity of Goods</label>
              <textarea
                value={cargoData.natureOfGoods}
                onChange={e => handleCargoChange('natureOfGoods', e.target.value)}
                rows={4}
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm resize-none"
                placeholder="Description of Goods"
              />
            </div>
            {/* Dimensions */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-[var(--foreground)]">Dimensions</label>
                <button
                  onClick={() => setShowDimensionsModal(true)}
                  className="px-3 py-1 text-sm bg-[#2563EB] text-white rounded hover:bg-[#1d4ed8]"
                >
                  Dimensions 계산
                </button>
              </div>
              <div className="p-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-[var(--muted)]">Total PCS:</span>
                    <span className="ml-2 font-medium">{cargoData.totalPcs}</span>
                  </div>
                  <div>
                    <span className="text-[var(--muted)]">Total Volume:</span>
                    <span className="ml-2 font-medium">{cargoData.totalVolume.toFixed(3)} CBM</span>
                  </div>
                </div>
                {cargoData.dimensions.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[var(--border)]">
                    <p className="text-xs text-[var(--muted)]">{cargoData.dimensions.length}개 항목</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {/* Weight Charge */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Weight Charge</label>
              <input
                type="number"
                value={cargoData.weightCharge}
                onChange={e => handleCargoChange('weightCharge', parseFloat(e.target.value) || 0)}
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm text-right"
              />
            </div>
            {/* At(Place) */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">At(Place)</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={cargoData.atPlace}
                  onChange={e => handleCargoChange('atPlace', e.target.value)}
                  className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                />
                <button className="px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Signature of Issuing Carrier */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Signature of Issuing Carrier</label>
              <input
                type="text"
                value={cargoData.signatureCarrier}
                onChange={e => handleCargoChange('signatureCarrier', e.target.value)}
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // OTHER TAB 렌더링
  const renderOtherTab = () => (
    <div className="space-y-6">
      <div className="card">
        <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-bold">Other Information</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-4 gap-4 mb-4">
            {/* Agent */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Agent</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={otherData.agentCode}
                  onChange={e => handleOtherChange('agentCode', e.target.value)}
                  className="w-20 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                  placeholder="코드"
                />
                <input
                  type="text"
                  value={otherData.agentName}
                  onChange={e => handleOtherChange('agentName', e.target.value)}
                  className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                />
                <button
                  onClick={() => openCodeSearchModal('customer', (item) => {
                    setOtherData(prev => ({ ...prev, agentCode: item.code, agentName: item.name }));
                  })}
                  className="px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Sub Agent */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Sub Agent</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={otherData.subAgentCode}
                  onChange={e => handleOtherChange('subAgentCode', e.target.value)}
                  className="w-20 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                  placeholder="코드"
                />
                <input
                  type="text"
                  value={otherData.subAgentName}
                  onChange={e => handleOtherChange('subAgentName', e.target.value)}
                  className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                />
                <button
                  onClick={() => openCodeSearchModal('customer', (item) => {
                    setOtherData(prev => ({ ...prev, subAgentCode: item.code, subAgentName: item.name }));
                  })}
                  className="px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Partner */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Partner</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={otherData.partnerCode}
                  onChange={e => handleOtherChange('partnerCode', e.target.value)}
                  className="w-20 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                  placeholder="코드"
                />
                <input
                  type="text"
                  value={otherData.partnerName}
                  onChange={e => handleOtherChange('partnerName', e.target.value)}
                  className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                />
                <button
                  onClick={() => openCodeSearchModal('customer', (item) => {
                    setOtherData(prev => ({ ...prev, partnerCode: item.code, partnerName: item.name }));
                  })}
                  className="px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
            {/* 항공사 */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">항공사</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={otherData.airlineCode}
                  onChange={e => handleOtherChange('airlineCode', e.target.value)}
                  className="w-20 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                  placeholder="코드"
                />
                <input
                  type="text"
                  value={otherData.airlineName}
                  onChange={e => handleOtherChange('airlineName', e.target.value)}
                  className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                />
                <button
                  onClick={() => openCodeSearchModal('airline', (item) => {
                    setOtherData(prev => ({ ...prev, airlineCode: item.code, airlineName: item.name }));
                  })}
                  className="px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-4">
            {/* 지역 */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">지역</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={otherData.regionCode}
                  onChange={e => handleOtherChange('regionCode', e.target.value)}
                  className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                />
                <button
                  onClick={() => openCodeSearchModal('region', (item) => {
                    setOtherData(prev => ({ ...prev, regionCode: item.code }));
                  })}
                  className="px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
            {/* 국가 */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">국가</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={otherData.countryCode}
                  onChange={e => handleOtherChange('countryCode', e.target.value)}
                  className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                />
                <button
                  onClick={() => openCodeSearchModal('country', (item) => {
                    setOtherData(prev => ({ ...prev, countryCode: item.code }));
                  })}
                  className="px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
            {/* MRN NO */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">MRN NO</label>
              <input
                type="text"
                value={otherData.mrnNo}
                onChange={e => handleOtherChange('mrnNo', e.target.value)}
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
              />
            </div>
            {/* MSN */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">MSN</label>
              <input
                type="text"
                value={otherData.msn}
                onChange={e => handleOtherChange('msn', e.target.value)}
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {/* L/C NO */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">L/C NO</label>
              <input
                type="text"
                value={otherData.lcNo}
                onChange={e => handleOtherChange('lcNo', e.target.value)}
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
              />
            </div>
            {/* P/O NO */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">P/O NO</label>
              <input
                type="text"
                value={otherData.poNo}
                onChange={e => handleOtherChange('poNo', e.target.value)}
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
              />
            </div>
            {/* 최초등록일 */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">최초등록일</label>
              <input
                type="text"
                value={otherData.createdAt}
                readOnly
                className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm"
                placeholder="자동생성"
              />
            </div>
            {/* 최종수정일 */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">최종수정일</label>
              <input
                type="text"
                value={otherData.updatedAt}
                readOnly
                className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm"
                placeholder="자동생성"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header
        title={editId ? "AWB 수정 (항공)" : "AWB 등록 (항공)"}
        subtitle="HOME > 선적관리 > B/L 관리(항공) > AWB 등록"
        onClose={() => setShowCloseModal(true)}
      />
      <main className="p-6">
          {/* 상단 버튼 영역 */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <button
                onClick={handleList}
                className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
              >
                목록
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleHouseNew}
                disabled={!isSaved}
                className={`px-4 py-2 rounded-lg font-medium ${isSaved ? 'bg-[var(--surface-100)] text-[var(--foreground)] hover:bg-[var(--surface-200)]' : 'bg-[var(--surface-200)] text-[var(--muted)] cursor-not-allowed'}`}
              >
                House 신규
              </button>
              <button
                onClick={handleCopyAWB}
                disabled={!isSaved}
                className={`px-4 py-2 rounded-lg font-medium ${isSaved ? 'bg-[var(--surface-100)] border border-[var(--border)] hover:bg-[var(--surface-200)]' : 'bg-[var(--surface-200)] text-[var(--muted)] cursor-not-allowed'}`}
              >
                AWB 복사
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)] font-medium disabled:opacity-50"
              >
                {isLoading ? '저장중...' : '저장'}
              </button>
            </div>
          </div>

          {/* TAB 영역 */}
          <div className="flex gap-1 border-b border-[var(--border)] mb-6">
            {(['MAIN', 'CARGO', 'OTHER'] as TabType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-6 py-3 font-medium rounded-t-lg transition-colors ${
                  activeTab === tab
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-[var(--surface-100)] text-[var(--muted)] hover:bg-[var(--surface-200)] hover:text-[var(--foreground)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* TAB 컨텐츠 */}
          {renderTabContent()}
        </main>
      <CloseConfirmModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onConfirm={handleConfirmClose}
      />

      <DimensionsCalcModal
        isOpen={showDimensionsModal}
        onClose={() => setShowDimensionsModal(false)}
        onApply={handleDimensionsApply}
        initialData={cargoData.dimensions}
      />

      <CodeSearchModal
        isOpen={showCodeSearchModal}
        onClose={() => setShowCodeSearchModal(false)}
        onSelect={handleCodeSelect}
        codeType={searchModalType}
      />
    </div>
  );
}

export default function AWBRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)] flex items-center justify-center">Loading...</div>}>
      <AWBRegisterContent />
    </Suspense>
  );
}
