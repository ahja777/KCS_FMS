'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { UnsavedChangesModal } from '@/components/UnsavedChangesModal';
import { useScreenClose } from '@/hooks/useScreenClose';
import { formatCurrency } from '@/utils/format';
import CodeSearchModal, { CodeType, CodeItem } from '@/components/popup/CodeSearchModal';
import SRSearchModal, { SRData } from '@/components/popup/SRSearchModal';

// 화면설계서 UI-G-01-07-03 기준 탭 타입
type TabType = 'MAIN' | 'CARGO' | 'OTHER';

// SERVICE TERM과 컨테이너 규격 매핑
const serviceTermMapping: Record<string, string> = {
  'CFS/CFS': 'LCL',
  'CY/CY': 'FCL',
  'CFS/DOOR': 'LCL',
  'DOOR/CFS': 'LCL',
  'CY/DOOR': 'FCL',
  'DOOR/CY': 'FCL',
  'BULK': 'BULK'
};

// R.TON 자동계산
const calculateRTON = (grossWeight: number, measurement: number): number => {
  const weightTon = grossWeight / 1000;
  return weightTon > measurement ? measurement : Number(weightTon.toFixed(3));
};

// MAIN TAB 데이터 인터페이스
interface MainData {
  ioType: string;              // 수출입구분
  jobNo: string;               // JOB NO
  bookingNo: string;           // BOOKING NO
  salesType: string;           // 영업유형
  paymentMethod: string;       // 지불방법
  businessType: string;        // 업무유형
  importTransit: string;       // 수입환적
  mblNo: string;               // M BL NO
  hblNo: string;               // H BL NO
  srNo: string;                // S/R NO
  shipperCode: string;         // SHIPPER CODE
  shipperName: string;
  shipperAddress: string;
  consigneeCode: string;       // CONSIGNEE CODE
  consigneeName: string;
  consigneeAddress: string;
  consigneeCopy: boolean;      // Copy 체크박스
  notifyCode: string;          // NOTIFY CODE
  notifyName: string;
  notifyAddress: string;
  notifyToOrder: boolean;      // To Order 체크박스
  notifySameAs: boolean;       // Same As 체크박스
  forDeliveryCode: string;     // For Delivery CODE
  forDeliveryName: string;
  forDeliveryAddress: string;
  blType: string;              // BL TYPE
  // Schedule Information
  placeOfReceipt: string;
  lineCode: string;
  lineName: string;
  preCarriageBy: string;
  callSign: string;
  portOfLoading: string;
  onboardDate: string;
  onboardTime: string;
  vesselName: string;
  voyageNo: string;
  portOfDischarge: string;
  etd: string;
  eta: string;
  placeOfDelivery: string;
  freightPayableAt: string;
  freightTerm: string;
  finalDestination: string;
  serviceTerm: string;
}

// CARGO TAB 데이터 인터페이스
interface CargoData {
  containerType: string;       // LCL/FCL/BULK
  packageQty: number;
  packageUnit: string;
  grossWeight: number;
  measurement: number;
  rton: number;
  container20Type: string;
  container20Qty: number;
  container40Type: string;
  container40Qty: number;
  containers: ContainerInfo[];
  otherCharges: OtherCharge[];
  // Issue Information
  issuePlace: string;
  issueDate: string;
  blIssueType: string;
  noOfOriginalBL: number;
  signature: string;
  issuingCarrier: string;
}

// OTHER TAB 데이터 인터페이스
interface OtherData {
  agentCode: string;
  agentName: string;
  subAgentCode: string;
  subAgentName: string;
  partnerCode: string;
  partnerName: string;
  inputEmployee: string;
  branchType: string;
  countryCode: string;
  regionCode: string;
  item: string;
  amount: string;
  lcNo: string;
  poNo: string;
  invValue: string;
  invNo: string;
  mrnNo: string;
  msn: string;
  createdAt: string;
  updatedAt: string;
}

// 컨테이너 정보
interface ContainerInfo {
  id: string;
  containerNo: string;
  containerType: string;
  seal1No: string;
  seal2No: string;
  seal3No: string;
  packageQty: number;
  packageUnit: string;
  grossWeight: number;
  measurement: number;
}

// Other Charge 정보
interface OtherCharge {
  id: string;
  code: string;
  charges: string;
  currency: string;
  prepaid: number;
  collect: number;
}

const initialMainData: MainData = {
  ioType: 'OUT',
  jobNo: '',
  bookingNo: '',
  salesType: '',
  paymentMethod: '',
  businessType: 'SIMPLE',
  importTransit: '',
  mblNo: '',
  hblNo: '',
  srNo: '',
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
  notifyToOrder: false,
  notifySameAs: false,
  forDeliveryCode: '',
  forDeliveryName: '',
  forDeliveryAddress: '',
  blType: 'ORIGINAL',
  placeOfReceipt: '',
  lineCode: '',
  lineName: '',
  preCarriageBy: '',
  callSign: '',
  portOfLoading: '',
  onboardDate: '',
  onboardTime: '',
  vesselName: '',
  voyageNo: '',
  portOfDischarge: '',
  etd: '',
  eta: '',
  placeOfDelivery: '',
  freightPayableAt: '',
  freightTerm: 'PREPAID',
  finalDestination: '',
  serviceTerm: 'CY/CY',
};

const initialCargoData: CargoData = {
  containerType: 'FCL',
  packageQty: 0,
  packageUnit: 'PKG',
  grossWeight: 0,
  measurement: 0,
  rton: 0,
  container20Type: '',
  container20Qty: 0,
  container40Type: '',
  container40Qty: 0,
  containers: [],
  otherCharges: [],
  issuePlace: '',
  issueDate: '',
  blIssueType: 'ORIGINAL',
  noOfOriginalBL: 3,
  signature: '',
  issuingCarrier: '',
};

const initialOtherData: OtherData = {
  agentCode: '',
  agentName: '',
  subAgentCode: '',
  subAgentName: '',
  partnerCode: '',
  partnerName: '',
  inputEmployee: '',
  branchType: 'HEAD',
  countryCode: '',
  regionCode: '',
  item: '',
  amount: '',
  lcNo: '',
  poNo: '',
  invValue: '',
  invNo: '',
  mrnNo: '',
  msn: '',
  createdAt: '',
  updatedAt: '',
};

function BLSeaRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [activeTab, setActiveTab] = useState<TabType>('MAIN');
  const [mainData, setMainData] = useState<MainData>(initialMainData);
  const [cargoData, setCargoData] = useState<CargoData>(initialCargoData);
  const [otherData, setOtherData] = useState<OtherData>(initialOtherData);
    const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 검색 팝업 상태
  const [showCodeSearchModal, setShowCodeSearchModal] = useState(false);
  const [searchModalType, setSearchModalType] = useState<CodeType>('customer');
  const [searchTargetCallback, setSearchTargetCallback] = useState<((item: CodeItem) => void) | null>(null);

  // S/R 검색 팝업 상태
  const [showSRSearchModal, setShowSRSearchModal] = useState(false);

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

  // S/R 선택 처리 - S/R 데이터를 B/L 폼에 반영
  const handleSRSelect = (sr: SRData) => {
    setMainData(prev => ({
      ...prev,
      srNo: sr.srNo,
      bookingNo: sr.bookingNo || '',
      shipperName: sr.shipper || '',
      shipperAddress: sr.shipperAddress || '',
      consigneeName: sr.consignee || '',
      consigneeAddress: sr.consigneeAddress || '',
      notifyName: sr.notifyParty || '',
      portOfLoading: sr.pol || '',
      portOfDischarge: sr.pod || '',
      etd: sr.cargoReadyDate || sr.etd || '',
    }));
    setCargoData(prev => ({
      ...prev,
      packageQty: sr.packageQty || 0,
      packageUnit: sr.packageType || 'PKG',
      grossWeight: sr.grossWeight || 0,
      measurement: sr.volume || sr.measurement || 0,
    }));
    setShowSRSearchModal(false);
  };

  // 화면닫기 통합 훅
  const {
    showModal: showCloseModal,
    handleCloseClick,
    handleModalClose,
    handleDiscard: handleDiscardChanges,
  } = useScreenClose({
    hasChanges: hasUnsavedChanges,
    listPath: '/logis/bl/sea/house',
  });

  // 수정 모드일 경우 데이터 로드
  useEffect(() => {
    if (editId) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/bl/sea?blId=${editId}`);
          if (response.ok) {
            const data = await response.json();
            // 데이터 매핑
            setMainData(prev => ({
              ...prev,
              ...data.main,
            }));
            setCargoData(prev => ({
              ...prev,
              ...data.cargo,
            }));
            setOtherData(prev => ({
              ...prev,
              ...data.other,
            }));
            setIsSaved(true);
          }
        } catch (error) {
          console.error('Failed to fetch B/L data:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [editId]);

  // SERVICE TERM 변경시 컨테이너 규격 연동
  useEffect(() => {
    const containerType = serviceTermMapping[mainData.serviceTerm];
    if (containerType) {
      setCargoData(prev => ({ ...prev, containerType }));
    }
  }, [mainData.serviceTerm]);

  // Gross Weight, Measurement 변경시 R.TON 자동계산
  useEffect(() => {
    const rton = calculateRTON(cargoData.grossWeight, cargoData.measurement);
    setCargoData(prev => ({ ...prev, rton }));
  }, [cargoData.grossWeight, cargoData.measurement]);

  // To Order 체크시 Notify 처리
  useEffect(() => {
    if (mainData.notifyToOrder) {
      setMainData(prev => ({
        ...prev,
        notifyCode: '',
        notifyName: 'TO ORDER OF ' + prev.shipperName,
        notifyAddress: '',
      }));
    }
  }, [mainData.notifyToOrder, mainData.shipperName]);

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

  // FREIGHT TERM 연동
  const handleFreightTermChange = (term: string) => {
    setMainData(prev => {
      let freightPayableAt = prev.freightPayableAt;
      // CFR~DES 선택시 Prepaid, EXW~FOB 선택시 Collect
      if (['CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP', 'DES'].includes(term)) {
        freightPayableAt = 'PREPAID';
      } else if (['EXW', 'FCA', 'FAS', 'FOB'].includes(term)) {
        freightPayableAt = 'COLLECT';
      }
      return { ...prev, freightTerm: term, freightPayableAt };
    });
  };

  // 핸들러
  const handleMainChange = (field: keyof MainData, value: string | boolean) => {
    setHasUnsavedChanges(true);
    setMainData(prev => ({ ...prev, [field]: value }));
  };

  const handleCargoChange = (field: keyof CargoData, value: string | number | ContainerInfo[] | OtherCharge[]) => {
    setCargoData(prev => ({ ...prev, [field]: value }));
  };

  const handleOtherChange = (field: keyof OtherData, value: string) => {
    setOtherData(prev => ({ ...prev, [field]: value }));
  };

  // 컨테이너 추가
  const addContainer = () => {
    const newContainer: ContainerInfo = {
      id: `CNTR-${Date.now()}`,
      containerNo: '',
      containerType: '',
      seal1No: '',
      seal2No: '',
      seal3No: '',
      packageQty: 0,
      packageUnit: 'PKG',
      grossWeight: 0,
      measurement: 0,
    };
    setCargoData(prev => ({
      ...prev,
      containers: [...prev.containers, newContainer],
    }));
  };

  // 컨테이너 삭제
  const removeContainer = (id: string) => {
    setCargoData(prev => ({
      ...prev,
      containers: prev.containers.filter(c => c.id !== id),
    }));
  };

  // Other Charge 추가
  const addOtherCharge = () => {
    const newCharge: OtherCharge = {
      id: `CHG-${Date.now()}`,
      code: '',
      charges: '',
      currency: 'USD',
      prepaid: 0,
      collect: 0,
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

  // 저장
  const handleSave = async () => {
    if (!mainData.hblNo) {
      alert('H B/L NO는 필수 입력값입니다.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/bl/sea', {
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
      // 로컬 저장 처리
      const jobNo = mainData.jobNo || `SEX-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
      setMainData(prev => ({ ...prev, jobNo }));
      setIsSaved(true);
      alert('저장되었습니다. (로컬)');
    } finally {
      setIsLoading(false);
    }
  };

  // B/L 복사
  const handleCopyBL = () => {
    if (!isSaved) {
      alert('저장 완료 후 B/L 복사가 가능합니다.');
      return;
    }
    // JOB NO, M B/L NO, S/R NO, H B/L NO 초기화 후 나머지 데이터 유지
    setMainData(prev => ({
      ...prev,
      jobNo: '',
      mblNo: '',
      srNo: '',
      hblNo: '',
    }));
    setIsSaved(false);
    alert('B/L이 복사되었습니다. 새로운 B/L NO를 입력해주세요.');
  };

  // 목록으로
  const handleList = () => {
    router.push('/logis/bl/sea/house');
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
          <svg className="w-5 h-5 text-[#E8A838]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="font-bold">Main Information</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-6 gap-4 mb-4">
            {/* 수출입구분 */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">
                수출입구분 <span className="text-red-500">*</span>
              </label>
              <select
                value={mainData.ioType}
                onChange={e => handleMainChange('ioType', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
              >
                <option value="OUT">수출(OUT)</option>
                <option value="IN">수입(IN)</option>
              </select>
            </div>
            {/* JOB NO */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">JOB NO</label>
              <input
                type="text"
                value={mainData.jobNo}
                readOnly
                className="w-full px-3 py-2 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm"
                placeholder="자동생성"
              />
            </div>
            {/* BOOKING NO */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">BOOKING NO</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={mainData.bookingNo}
                  onChange={e => handleMainChange('bookingNo', e.target.value)}
                  className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
                />
                <button className="px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] text-sm">
                  부킹조회
                </button>
              </div>
            </div>
            {/* 영업유형 / 지불방법 */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">영업유형</label>
              <select
                value={mainData.salesType}
                onChange={e => handleMainChange('salesType', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
              >
                <option value="">선택</option>
                <option value="NOMINATED">Nominated</option>
                <option value="FREE_HAND">Free Hand</option>
              </select>
            </div>
            {/* 업무유형 */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">업무유형</label>
              <select
                value={mainData.businessType}
                onChange={e => handleMainChange('businessType', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
              >
                <option value="SIMPLE">Simple</option>
                <option value="CONSOL">Consol</option>
                <option value="CO_LOAD">Co-Load</option>
              </select>
            </div>
            {/* BL TYPE */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">B/L TYPE</label>
              <select
                value={mainData.blType}
                onChange={e => handleMainChange('blType', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
              >
                <option value="ORIGINAL">Original</option>
                <option value="SWB">Sea Waybill</option>
                <option value="TLX">Telex Release</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-4 mb-4">
            {/* M BL NO */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">M B/L NO</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={mainData.mblNo}
                  onChange={e => handleMainChange('mblNo', e.target.value)}
                  className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
                  placeholder="M B/L NO"
                />
                <button className="px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
            {/* H BL NO */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">
                H B/L NO <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={mainData.hblNo}
                  onChange={e => handleMainChange('hblNo', e.target.value)}
                  className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
                  placeholder="H B/L NO"
                />
                <button className="px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
            {/* S/R NO */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">S/R NO</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={mainData.srNo}
                  onChange={e => handleMainChange('srNo', e.target.value)}
                  className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
                  placeholder="S/R NO"
                />
                <button
                  type="button"
                  onClick={() => setShowSRSearchModal(true)}
                  className="px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
                  title="S/R 검색"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                <button
                  disabled={!isSaved}
                  className={`px-3 text-sm rounded-lg ${isSaved ? 'bg-[#2563EB] text-white hover:bg-[#1d4ed8]' : 'bg-[var(--surface-200)] text-[var(--muted)]'}`}
                >
                  S/R등록
                </button>
              </div>
            </div>
          </div>

          {/* Shipper / Consignee / Notify */}
          <div className="grid grid-cols-3 gap-4">
            {/* SHIPPER */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">SHIPPER</label>
              <div className="flex gap-1 mb-2">
                <input
                  type="text"
                  value={mainData.shipperCode}
                  onChange={e => handleMainChange('shipperCode', e.target.value)}
                  className="w-24 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
                  placeholder="코드"
                />
                <input
                  type="text"
                  value={mainData.shipperName}
                  onChange={e => handleMainChange('shipperName', e.target.value)}
                  className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
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
                className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm resize-none"
                placeholder="Address"
              />
            </div>
            {/* CONSIGNEE */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-[var(--muted)]">CONSIGNEE</label>
                <label className="flex items-center gap-1 text-xs text-[var(--muted)]">
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
                  className="w-24 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
                  placeholder="코드"
                />
                <input
                  type="text"
                  value={mainData.consigneeName}
                  onChange={e => handleMainChange('consigneeName', e.target.value)}
                  className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
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
                className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm resize-none"
                placeholder="Address"
              />
            </div>
            {/* NOTIFY */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-[var(--muted)]">NOTIFY PARTY</label>
                <div className="flex gap-2">
                  <label className="flex items-center gap-1 text-xs text-[var(--muted)]">
                    <input
                      type="checkbox"
                      checked={mainData.notifyToOrder}
                      onChange={e => handleMainChange('notifyToOrder', e.target.checked)}
                      className="rounded"
                    />
                    To Order
                  </label>
                  <label className="flex items-center gap-1 text-xs text-[var(--muted)]">
                    <input
                      type="checkbox"
                      checked={mainData.notifySameAs}
                      onChange={e => handleMainChange('notifySameAs', e.target.checked)}
                      className="rounded"
                    />
                    Same As
                  </label>
                </div>
              </div>
              <div className="flex gap-1 mb-2">
                <input
                  type="text"
                  value={mainData.notifyCode}
                  onChange={e => handleMainChange('notifyCode', e.target.value)}
                  className="w-24 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
                  placeholder="코드"
                  disabled={mainData.notifyToOrder || mainData.notifySameAs}
                />
                <input
                  type="text"
                  value={mainData.notifyName}
                  onChange={e => handleMainChange('notifyName', e.target.value)}
                  className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
                  placeholder="Notify Name"
                  disabled={mainData.notifyToOrder || mainData.notifySameAs}
                />
                <button
                  onClick={() => openCodeSearchModal('customer', (item) => {
                    setMainData(prev => ({ ...prev, notifyCode: item.code, notifyName: item.name }));
                  })}
                  disabled={mainData.notifyToOrder || mainData.notifySameAs}
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
                className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm resize-none"
                placeholder="Address"
                disabled={mainData.notifyToOrder || mainData.notifySameAs}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Information */}
      <div className="card">
        <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
          <svg className="w-5 h-5 text-[#E8A838]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="font-bold">Schedule Information</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-6 gap-4 mb-4">
            {/* Place of Receipt */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Place of Receipt</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={mainData.placeOfReceipt}
                  onChange={e => handleMainChange('placeOfReceipt', e.target.value)}
                  className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
                />
                <button
                  onClick={() => openCodeSearchModal('seaport', (item) => {
                    setMainData(prev => ({ ...prev, placeOfReceipt: item.code }));
                  })}
                  className="px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
            {/* LINE */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">LINE</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={mainData.lineCode}
                  onChange={e => handleMainChange('lineCode', e.target.value)}
                  className="w-20 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
                  placeholder="코드"
                />
                <input
                  type="text"
                  value={mainData.lineName}
                  onChange={e => handleMainChange('lineName', e.target.value)}
                  className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
                />
                <button
                  onClick={() => openCodeSearchModal('carrier', (item) => {
                    setMainData(prev => ({ ...prev, lineCode: item.code, lineName: item.name }));
                  })}
                  className="px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Pre-carriage by */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Pre-carriage by</label>
              <input
                type="text"
                value={mainData.preCarriageBy}
                onChange={e => handleMainChange('preCarriageBy', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
              />
            </div>
            {/* Call Sign */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Call Sign</label>
              <input
                type="text"
                value={mainData.callSign}
                onChange={e => handleMainChange('callSign', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
              />
            </div>
            {/* Port of Loading */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Port of Loading</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={mainData.portOfLoading}
                  onChange={e => handleMainChange('portOfLoading', e.target.value)}
                  className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
                />
                <button
                  onClick={() => openCodeSearchModal('seaport', (item) => {
                    setMainData(prev => ({ ...prev, portOfLoading: item.code }));
                  })}
                  className="px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Onboard Date */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Onboard Date</label>
              <div className="flex gap-1">
                <input
                  type="date"
                  value={mainData.onboardDate}
                  onChange={e => handleMainChange('onboardDate', e.target.value)}
                  className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
                />
                <input
                  type="time"
                  value={mainData.onboardTime}
                  onChange={e => handleMainChange('onboardTime', e.target.value)}
                  className="w-24 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-4 mb-4">
            {/* Vessel Name */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Vessel Name & Voyage No</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={mainData.vesselName}
                  onChange={e => handleMainChange('vesselName', e.target.value)}
                  className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
                  placeholder="Vessel Name"
                />
                <input
                  type="text"
                  value={mainData.voyageNo}
                  onChange={e => handleMainChange('voyageNo', e.target.value)}
                  className="w-24 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
                  placeholder="Voyage"
                />
              </div>
            </div>
            {/* Port of Discharge */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Port of Discharge</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={mainData.portOfDischarge}
                  onChange={e => handleMainChange('portOfDischarge', e.target.value)}
                  className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
                />
                <button
                  onClick={() => openCodeSearchModal('seaport', (item) => {
                    setMainData(prev => ({ ...prev, portOfDischarge: item.code }));
                  })}
                  className="px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
            {/* ETD */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">ETD</label>
              <input
                type="date"
                value={mainData.etd}
                onChange={e => handleMainChange('etd', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
              />
            </div>
            {/* ETA */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">ETA</label>
              <input
                type="date"
                value={mainData.eta}
                onChange={e => handleMainChange('eta', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
              />
            </div>
            {/* Place of Delivery */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Place of Delivery</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={mainData.placeOfDelivery}
                  onChange={e => handleMainChange('placeOfDelivery', e.target.value)}
                  className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
                />
                <button
                  onClick={() => openCodeSearchModal('seaport', (item) => {
                    setMainData(prev => ({ ...prev, placeOfDelivery: item.code }));
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

          <div className="grid grid-cols-6 gap-4">
            {/* Freight Payable at */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Freight Payable at</label>
              <input
                type="text"
                value={mainData.freightPayableAt}
                onChange={e => handleMainChange('freightPayableAt', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
              />
            </div>
            {/* FREIGHT TERM */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">FREIGHT TERM</label>
              <select
                value={mainData.freightTerm}
                onChange={e => handleFreightTermChange(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
              >
                <option value="PREPAID">Prepaid</option>
                <option value="COLLECT">Collect</option>
              </select>
            </div>
            {/* Final Destination */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Final Destination</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={mainData.finalDestination}
                  onChange={e => handleMainChange('finalDestination', e.target.value)}
                  className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
                />
                <button
                  onClick={() => openCodeSearchModal('seaport', (item) => {
                    setMainData(prev => ({ ...prev, finalDestination: item.code }));
                  })}
                  className="px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
            {/* SERVICE TERM */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">SERVICE TERM</label>
              <select
                value={mainData.serviceTerm}
                onChange={e => handleMainChange('serviceTerm', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
              >
                <option value="CY/CY">CY/CY</option>
                <option value="CFS/CFS">CFS/CFS</option>
                <option value="CY/DOOR">CY/DOOR</option>
                <option value="DOOR/CY">DOOR/CY</option>
                <option value="CFS/DOOR">CFS/DOOR</option>
                <option value="DOOR/CFS">DOOR/CFS</option>
                <option value="BULK">BULK</option>
              </select>
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
        <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
          <svg className="w-5 h-5 text-[#E8A838]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="font-bold">Cargo Information</h3>
        </div>
        <div className="p-4">
          <div className="flex gap-6 mb-4">
            {/* 컨테이너 규격 */}
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--muted)]">컨테이너 규격</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="containerType"
                    value="LCL"
                    checked={cargoData.containerType === 'LCL'}
                    onChange={e => handleCargoChange('containerType', e.target.value)}
                    className="text-[#E8A838]"
                  />
                  <span className="text-sm">LCL</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="containerType"
                    value="FCL"
                    checked={cargoData.containerType === 'FCL'}
                    onChange={e => handleCargoChange('containerType', e.target.value)}
                    className="text-[#E8A838]"
                  />
                  <span className="text-sm">FCL</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="containerType"
                    value="BULK"
                    checked={cargoData.containerType === 'BULK'}
                    onChange={e => handleCargoChange('containerType', e.target.value)}
                    className="text-[#E8A838]"
                  />
                  <span className="text-sm">BULK</span>
                </label>
              </div>
              {/* 메시지 표시 */}
              <div className="mt-2 text-xs text-[var(--muted)]">
                {cargoData.containerType === 'LCL' && '* SAID TO CONTAIN'}
                {cargoData.containerType === 'FCL' && "* SHIPPER'S LOAD & COUNT"}
                {cargoData.containerType === 'BULK' && '* SAID TO BE'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-4 mb-4">
            {/* Package */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Package</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  value={cargoData.packageQty}
                  onChange={e => handleCargoChange('packageQty', parseInt(e.target.value) || 0)}
                  className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm text-right"
                />
                <select
                  value={cargoData.packageUnit}
                  onChange={e => handleCargoChange('packageUnit', e.target.value)}
                  className="w-20 px-2 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
                >
                  <option value="PKG">PKG</option>
                  <option value="CTN">CTN</option>
                  <option value="PLT">PLT</option>
                  <option value="PCS">PCS</option>
                </select>
              </div>
            </div>
            {/* Gross Weight */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Gross Weight (KG)</label>
              <input
                type="number"
                value={cargoData.grossWeight}
                onChange={e => handleCargoChange('grossWeight', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm text-right"
              />
            </div>
            {/* Measurement */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Measurement (CBM)</label>
              <input
                type="number"
                value={cargoData.measurement}
                onChange={e => handleCargoChange('measurement', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm text-right"
              />
            </div>
            {/* R.TON */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">R.TON</label>
              <input
                type="text"
                value={cargoData.rton.toFixed(3)}
                readOnly
                className="w-full px-3 py-2 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm text-right"
              />
            </div>
            {/* Container 20 */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Container 20</label>
              <div className="flex gap-1">
                <select
                  value={cargoData.container20Type}
                  onChange={e => handleCargoChange('container20Type', e.target.value)}
                  className="flex-1 px-2 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
                  disabled={cargoData.containerType === 'LCL'}
                >
                  <option value="">선택</option>
                  <option value="20GP">20GP</option>
                  <option value="20HC">20HC</option>
                  <option value="20OT">20OT</option>
                  <option value="20RF">20RF</option>
                </select>
                <input
                  type="number"
                  value={cargoData.container20Qty}
                  onChange={e => handleCargoChange('container20Qty', parseInt(e.target.value) || 0)}
                  className="w-16 px-2 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm text-right"
                  disabled={cargoData.containerType === 'LCL'}
                />
              </div>
            </div>
            {/* Container 40 */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Container 40</label>
              <div className="flex gap-1">
                <select
                  value={cargoData.container40Type}
                  onChange={e => handleCargoChange('container40Type', e.target.value)}
                  className="flex-1 px-2 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
                  disabled={cargoData.containerType === 'LCL'}
                >
                  <option value="">선택</option>
                  <option value="40GP">40GP</option>
                  <option value="40HC">40HC</option>
                  <option value="40OT">40OT</option>
                  <option value="40RF">40RF</option>
                </select>
                <input
                  type="number"
                  value={cargoData.container40Qty}
                  onChange={e => handleCargoChange('container40Qty', parseInt(e.target.value) || 0)}
                  className="w-16 px-2 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm text-right"
                  disabled={cargoData.containerType === 'LCL'}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Container Information Grid */}
      {cargoData.containerType === 'FCL' && (
        <div className="card">
          <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
            <h3 className="font-bold">Container Information</h3>
            <div className="flex gap-2">
              <button
                onClick={addContainer}
                className="px-3 py-1 text-sm bg-[#E8A838] text-white rounded hover:bg-[#d99a2f]"
              >
                추가
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--surface-100)]">
                <tr>
                  <th className="p-2 text-center text-xs font-semibold w-12"></th>
                  <th className="p-2 text-left text-xs font-semibold">Container No</th>
                  <th className="p-2 text-center text-xs font-semibold">규격</th>
                  <th className="p-2 text-left text-xs font-semibold">Seal 1</th>
                  <th className="p-2 text-left text-xs font-semibold">Seal 2</th>
                  <th className="p-2 text-left text-xs font-semibold">Seal 3</th>
                  <th className="p-2 text-right text-xs font-semibold">Package</th>
                  <th className="p-2 text-center text-xs font-semibold">Unit</th>
                  <th className="p-2 text-right text-xs font-semibold">G.Weight</th>
                  <th className="p-2 text-right text-xs font-semibold">Measurement</th>
                </tr>
              </thead>
              <tbody>
                {cargoData.containers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-4 text-center text-[var(--muted)] text-sm">
                      컨테이너 정보가 없습니다. 추가 버튼을 클릭하세요.
                    </td>
                  </tr>
                ) : cargoData.containers.map((container, index) => (
                  <tr key={container.id} className="border-t border-[var(--border)]">
                    <td className="p-2 text-center">
                      <button
                        onClick={() => removeContainer(container.id)}
                        className="text-red-400 hover:text-red-500"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={container.containerNo}
                        onChange={e => {
                          const updated = [...cargoData.containers];
                          updated[index].containerNo = e.target.value;
                          handleCargoChange('containers', updated);
                        }}
                        className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                        placeholder="XXXX1234567"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={container.containerType}
                        onChange={e => {
                          const updated = [...cargoData.containers];
                          updated[index].containerType = e.target.value;
                          handleCargoChange('containers', updated);
                        }}
                        className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                      >
                        <option value="">선택</option>
                        <option value="20GP">20GP</option>
                        <option value="20HC">20HC</option>
                        <option value="40GP">40GP</option>
                        <option value="40HC">40HC</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={container.seal1No}
                        onChange={e => {
                          const updated = [...cargoData.containers];
                          updated[index].seal1No = e.target.value;
                          handleCargoChange('containers', updated);
                        }}
                        className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={container.seal2No}
                        onChange={e => {
                          const updated = [...cargoData.containers];
                          updated[index].seal2No = e.target.value;
                          handleCargoChange('containers', updated);
                        }}
                        className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={container.seal3No}
                        onChange={e => {
                          const updated = [...cargoData.containers];
                          updated[index].seal3No = e.target.value;
                          handleCargoChange('containers', updated);
                        }}
                        className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={container.packageQty}
                        onChange={e => {
                          const updated = [...cargoData.containers];
                          updated[index].packageQty = parseInt(e.target.value) || 0;
                          handleCargoChange('containers', updated);
                        }}
                        className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={container.packageUnit}
                        onChange={e => {
                          const updated = [...cargoData.containers];
                          updated[index].packageUnit = e.target.value;
                          handleCargoChange('containers', updated);
                        }}
                        className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                      >
                        <option value="PKG">PKG</option>
                        <option value="CTN">CTN</option>
                        <option value="PLT">PLT</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={container.grossWeight}
                        onChange={e => {
                          const updated = [...cargoData.containers];
                          updated[index].grossWeight = parseFloat(e.target.value) || 0;
                          handleCargoChange('containers', updated);
                        }}
                        className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={container.measurement}
                        onChange={e => {
                          const updated = [...cargoData.containers];
                          updated[index].measurement = parseFloat(e.target.value) || 0;
                          handleCargoChange('containers', updated);
                        }}
                        className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Other Charge Grid */}
      <div className="card">
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
          <h3 className="font-bold">Other Charges</h3>
          <div className="flex gap-2">
            <button
              onClick={addOtherCharge}
              className="px-3 py-1 text-sm bg-[#E8A838] text-white rounded hover:bg-[#d99a2f]"
            >
              추가
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--surface-100)]">
              <tr>
                <th className="p-2 text-center text-xs font-semibold w-12"></th>
                <th className="p-2 text-left text-xs font-semibold">CODE</th>
                <th className="p-2 text-left text-xs font-semibold">Charges</th>
                <th className="p-2 text-center text-xs font-semibold">Cur</th>
                <th className="p-2 text-right text-xs font-semibold">Prepaid</th>
                <th className="p-2 text-right text-xs font-semibold">Collect</th>
              </tr>
            </thead>
            <tbody>
              {cargoData.otherCharges.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-[var(--muted)] text-sm">
                    운임 정보가 없습니다. 추가 버튼을 클릭하세요.
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
                        value={charge.code}
                        onChange={e => {
                          const updated = [...cargoData.otherCharges];
                          updated[index].code = e.target.value;
                          handleCargoChange('otherCharges', updated);
                        }}
                        className="w-20 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                      />
                      <button className="px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded hover:bg-[var(--surface-200)]">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={charge.charges}
                      onChange={e => {
                        const updated = [...cargoData.otherCharges];
                        updated[index].charges = e.target.value;
                        handleCargoChange('otherCharges', updated);
                      }}
                      className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                    />
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
                      <option value="JPY">JPY</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={charge.prepaid}
                      onChange={e => {
                        const updated = [...cargoData.otherCharges];
                        updated[index].prepaid = parseFloat(e.target.value) || 0;
                        handleCargoChange('otherCharges', updated);
                      }}
                      className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={charge.collect}
                      onChange={e => {
                        const updated = [...cargoData.otherCharges];
                        updated[index].collect = parseFloat(e.target.value) || 0;
                        handleCargoChange('otherCharges', updated);
                      }}
                      className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            {cargoData.otherCharges.length > 0 && (
              <tfoot className="bg-[var(--surface-50)]">
                <tr className="border-t border-[var(--border)] font-medium">
                  <td colSpan={4} className="p-2 text-right text-sm">Total:</td>
                  <td className="p-2 text-right text-sm">
                    {formatCurrency(cargoData.otherCharges.reduce((sum, c) => sum + c.prepaid, 0))}
                  </td>
                  <td className="p-2 text-right text-sm">
                    {formatCurrency(cargoData.otherCharges.reduce((sum, c) => sum + c.collect, 0))}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Issue Information */}
      <div className="card">
        <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
          <svg className="w-5 h-5 text-[#E8A838]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-bold">Issue Information</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-6 gap-4">
            {/* Issue Place */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Issue Place</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={cargoData.issuePlace}
                  onChange={e => handleCargoChange('issuePlace', e.target.value)}
                  className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
                />
                <button className="px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Issue Date */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Issue Date</label>
              <input
                type="date"
                value={cargoData.issueDate}
                onChange={e => handleCargoChange('issueDate', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
              />
            </div>
            {/* BL Issue Type */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">B/L Issue Type</label>
              <select
                value={cargoData.blIssueType}
                onChange={e => handleCargoChange('blIssueType', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
              >
                <option value="ORIGINAL">Original</option>
                <option value="COPY">Copy</option>
                <option value="SURRENDER">Surrender</option>
              </select>
            </div>
            {/* No. of original B/L */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">No. of Original B/L</label>
              <input
                type="number"
                value={cargoData.noOfOriginalBL}
                onChange={e => handleCargoChange('noOfOriginalBL', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm text-right"
                min={0}
                max={10}
              />
            </div>
            {/* Signature */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Signature</label>
              <input
                type="text"
                value={cargoData.signature}
                onChange={e => handleCargoChange('signature', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
              />
            </div>
            {/* Issuing Carrier */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Issuing Carrier or Agent</label>
              <input
                type="text"
                value={cargoData.issuingCarrier}
                onChange={e => handleCargoChange('issuingCarrier', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
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
      {/* Other Information */}
      <div className="card">
        <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
          <svg className="w-5 h-5 text-[#E8A838]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-bold">Other Information</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-4 gap-4 mb-4">
            {/* AGENT CODE */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">AGENT CODE</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={otherData.agentCode}
                  onChange={e => handleOtherChange('agentCode', e.target.value)}
                  className="w-24 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
                  placeholder="코드"
                />
                <input
                  type="text"
                  value={otherData.agentName}
                  onChange={e => handleOtherChange('agentName', e.target.value)}
                  className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
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
            {/* SUB AGENT */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">SUB AGENT</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={otherData.subAgentCode}
                  onChange={e => handleOtherChange('subAgentCode', e.target.value)}
                  className="w-24 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
                  placeholder="코드"
                />
                <input
                  type="text"
                  value={otherData.subAgentName}
                  onChange={e => handleOtherChange('subAgentName', e.target.value)}
                  className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
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
            {/* PARTNER */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">PARTNER</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={otherData.partnerCode}
                  onChange={e => handleOtherChange('partnerCode', e.target.value)}
                  className="w-24 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
                  placeholder="코드"
                />
                <input
                  type="text"
                  value={otherData.partnerName}
                  onChange={e => handleOtherChange('partnerName', e.target.value)}
                  className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
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
            {/* 입력사원 */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">입력사원</label>
              <input
                type="text"
                value={otherData.inputEmployee}
                onChange={e => handleOtherChange('inputEmployee', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-4">
            {/* 본/지사 */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">본/지사</label>
              <select
                value={otherData.branchType}
                onChange={e => handleOtherChange('branchType', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
              >
                <option value="HEAD">본사</option>
                <option value="BRANCH">지사</option>
              </select>
            </div>
            {/* 국가코드 */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">국가코드</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={otherData.countryCode}
                  onChange={e => handleOtherChange('countryCode', e.target.value)}
                  className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
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
            {/* 지역코드 */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">지역코드</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={otherData.regionCode}
                  onChange={e => handleOtherChange('regionCode', e.target.value)}
                  className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
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
            {/* ITEM */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">ITEM</label>
              <input
                type="text"
                value={otherData.item}
                onChange={e => handleOtherChange('item', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-4">
            {/* L/C NO */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">L/C NO</label>
              <input
                type="text"
                value={otherData.lcNo}
                onChange={e => handleOtherChange('lcNo', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
              />
            </div>
            {/* P/O NO */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">P/O NO</label>
              <input
                type="text"
                value={otherData.poNo}
                onChange={e => handleOtherChange('poNo', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
              />
            </div>
            {/* INV VALUE */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">INV VALUE</label>
              <input
                type="text"
                value={otherData.invValue}
                onChange={e => handleOtherChange('invValue', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
              />
            </div>
            {/* INV NO */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">INV NO</label>
              <input
                type="text"
                value={otherData.invNo}
                onChange={e => handleOtherChange('invNo', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {/* MRN NO */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">MRN NO</label>
              <input
                type="text"
                value={otherData.mrnNo}
                onChange={e => handleOtherChange('mrnNo', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
              />
            </div>
            {/* MSN */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">MSN</label>
              <input
                type="text"
                value={otherData.msn}
                onChange={e => handleOtherChange('msn', e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[#E8A838] text-sm"
              />
            </div>
            {/* 최초등록일 */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">최초등록일</label>
              <input
                type="text"
                value={otherData.createdAt}
                readOnly
                className="w-full px-3 py-2 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm"
                placeholder="자동생성"
              />
            </div>
            {/* 최종수정일 */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">최종수정일</label>
              <input
                type="text"
                value={otherData.updatedAt}
                readOnly
                className="w-full px-3 py-2 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm"
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
      <Sidebar />
      <div className="ml-72">
        <Header
          title={editId ? "House B/L 수정" : "House B/L 등록"}
          subtitle="Logis 
        onClose={() => setShowCloseModal(true)}> 해상수출 > House B/L 관리 > 등록"
          onClose={handleCloseClick}
        />
        <main className="p-6">
          {/* 상단 버튼 영역 */}
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm text-[var(--muted)]">화면 ID: HBL-SEA-REG</span>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/logis/bl/sea/house/register')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                신규
              </button>
              <button
                onClick={() => router.push('/logis/bl/sea/house/register')}
                className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] font-medium"
              >
                초기화
              </button>
              <button
                onClick={handleList}
                className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] font-medium"
              >
                목록
              </button>
              <button
                onClick={handleCopyBL}
                disabled={!isSaved}
                className={`px-4 py-2 rounded-lg font-medium ${isSaved ? 'bg-[var(--surface-100)] border border-[var(--border)] hover:bg-[var(--surface-200)]' : 'bg-[var(--surface-200)] text-[var(--muted)] cursor-not-allowed'}`}
              >
                B/L 복사
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-6 py-2 bg-[#E8A838] text-[#0C1222] font-semibold rounded-lg hover:bg-[#D4943A] disabled:opacity-50"
              >
                {isLoading ? '저장중...' : '저장'}
              </button>
            </div>
          </div>

          {/* TAB 영역 */}
          <div className="flex gap-1 mb-4">
            {(['MAIN', 'CARGO', 'OTHER'] as TabType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-t-lg font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-[#E8A838] text-white'
                    : 'bg-[var(--surface-100)] text-[var(--muted)] hover:bg-[var(--surface-200)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* TAB 컨텐츠 */}
          {renderTabContent()}
        </main>
      </div>

      <UnsavedChangesModal
        isOpen={showCloseModal}
        onClose={handleModalClose}
        onDiscard={handleDiscardChanges}
        message="저장하지 않은 변경사항이 있습니다.\n이 페이지를 떠나시겠습니까?"
      />

      <CodeSearchModal
        isOpen={showCodeSearchModal}
        onClose={() => setShowCodeSearchModal(false)}
        onSelect={handleCodeSelect}
        codeType={searchModalType}
      />

      <SRSearchModal
        isOpen={showSRSearchModal}
        onClose={() => setShowSRSearchModal(false)}
        onSelect={handleSRSelect}
      />
    </div>
  );
}

export default function BLSeaRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)] flex items-center justify-center">Loading...</div>}>
      <BLSeaRegisterContent />
    </Suspense>
  );
}
