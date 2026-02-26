'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useScreenClose } from '@/hooks/useScreenClose';
import { LIST_PATHS } from '@/constants/paths';
import ScheduleSearchModal from '@/components/ScheduleSearchModal';
import EmailModal from '@/components/EmailModal';
import SearchIconButton from '@/components/SearchIconButton';
import {
  CodeSearchModal,
  LocationCodeModal,
  BookingSearchModal,
  HBLConsoleModal,
  type CodeItem,
  type CodeType,
  type LocationItem,
  type SeaBooking,
  type AirBooking,
  type HBLConsoleItem,
} from '@/components/popup';

// MAIN/CARGO 탭 타입
type TabType = 'MAIN' | 'CARGO';

// MAIN 탭 데이터 인터페이스
interface MainData {
  blType: string;
  srNo: string;
  regDate: string;
  inputUser: string;
  mblNo: string;
  shipperCode: string;
  shipperName: string;
  consigneeCode: string;
  consigneeName: string;
  msn: string;
  mrnNo: string;
  lineToCode: string;
  lineToName: string;
  notifyCode: string;
  notifyName: string;
  bookingNo: string;
  fromCd: string;
  fromName: string;
  hblNo: string;
  // Schedule Information
  placeOfReceipt: string;
  placeOfReceiptName: string;
  pol: string;
  polName: string;
  pod: string;
  podName: string;
  placeOfDelivery: string;
  placeOfDeliveryName: string;
  finalDest: string;
  finalDestName: string;
  vessel: string;
  voyage: string;
  etd: string;
  eta: string;
  freightServiceTerm: string;
  cyCfsType: string;
  consolYn: boolean;
}

// CARGO 탭 데이터 인터페이스
interface CargoData {
  marks: string;
  description: string;
  packageQty: number;
  packageCode: string;
  noOfPackage: string;
  grossWeight: number;
  measurement: number;
  container20DR: number;
  container20HC: number;
  container20RF: number;
  container40DR: number;
  container40HC: number;
  container40RF: number;
  totalPackagesInWords: string;
}

// 컨테이너 상세 인터페이스
interface ContainerRow {
  id: string;
  hblNo: string;
  containerNo: string;
  sealNo1: string;
  sealNo2: string;
  sealNo3: string;
  packageQty: number;
  packageUnit: string;
  grossWeight: number;
  measurement: number;
}

const initialMainData: MainData = {
  blType: 'CONSOL',
  srNo: '',
  regDate: new Date().toISOString().split('T')[0],
  inputUser: '',
  mblNo: '',
  shipperCode: '',
  shipperName: '',
  consigneeCode: '',
  consigneeName: '',
  msn: '',
  mrnNo: '',
  lineToCode: '',
  lineToName: '',
  notifyCode: '',
  notifyName: '',
  bookingNo: '',
  fromCd: '',
  fromName: '',
  hblNo: '',
  placeOfReceipt: '',
  placeOfReceiptName: '',
  pol: '',
  polName: '',
  pod: '',
  podName: '',
  placeOfDelivery: '',
  placeOfDeliveryName: '',
  finalDest: '',
  finalDestName: '',
  vessel: '',
  voyage: '',
  etd: '',
  eta: '',
  freightServiceTerm: 'FCL/FCL',
  cyCfsType: 'CY/CY',
  consolYn: false,
};

const initialCargoData: CargoData = {
  marks: '',
  description: '',
  packageQty: 0,
  packageCode: 'CT',
  noOfPackage: '',
  grossWeight: 0,
  measurement: 0,
  container20DR: 0,
  container20HC: 0,
  container20RF: 0,
  container40DR: 0,
  container40HC: 0,
  container40RF: 0,
  totalPackagesInWords: '',
};

const FREIGHT_SERVICE_TERMS = [
  'FCL/FCL', 'FCL/LCL', 'LCL/FCL', 'LCL/LCL',
  'LCL/DOOR', 'DOOR/LCL', 'FCL/DOOR', 'DOOR/FCL',
  'DOOR/DOOR', 'BULK',
];

const FREIGHT_TO_CYCFS: Record<string, string> = {
  'FCL/FCL': 'CY/CY',
  'FCL/LCL': 'CY/CFS',
  'LCL/FCL': 'CFS/CY',
  'LCL/LCL': 'CFS/CFS',
  'LCL/DOOR': 'CFS/DOOR',
  'DOOR/LCL': 'DOOR/CFS',
  'FCL/DOOR': 'CY/DOOR',
  'DOOR/FCL': 'DOOR/CY',
  'DOOR/DOOR': 'DOOR/DOOR',
  'BULK': 'BULK',
};

const CYCFS_OPTIONS = [
  'CY/CY', 'CY/CFS', 'CFS/CY', 'CFS/CFS',
  'CFS/DOOR', 'DOOR/CFS', 'CY/DOOR', 'DOOR/CY',
  'DOOR/DOOR', 'BULK',
];

const PACKAGE_CODES = ['CT', 'PKG', 'PLT', 'PCS', 'CS', 'BG', 'DR', 'SET'];

// 바이트 길이 계산
function getByteLength(str: string): number {
  let len = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code <= 0x7f) len += 1;
    else if (code <= 0x7ff) len += 2;
    else len += 3;
  }
  return len;
}

// 공통 스타일 상수
const TH_CLS = 'bg-gray-100 text-right px-3 py-2 text-sm font-medium border border-gray-300 whitespace-nowrap';
const TD_CLS = 'px-2 py-1 border border-gray-300';
const INPUT_CLS = 'w-full h-[32px] px-2 bg-white border border-gray-300 rounded text-sm';
const INPUT_RO_CLS = 'w-full h-[32px] px-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-500';
const SELECT_CLS = 'w-full h-[32px] px-2 bg-white border border-gray-300 rounded text-sm';

function SRRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  // useScreenClose
  const {
    showModal: showCloseModal,
    handleCloseClick,
    handleModalClose,
    handleDiscard: handleDiscardChanges,
  } = useScreenClose({
    hasChanges: false,
    listPath: LIST_PATHS.SR_SEA,
  });

  const [activeTab, setActiveTab] = useState<TabType>('MAIN');
  const [mainData, setMainData] = useState<MainData>(initialMainData);
  const [cargoData, setCargoData] = useState<CargoData>(initialCargoData);
  const [containers, setContainers] = useState<ContainerRow[]>([]);
  const [selectedContainerIds, setSelectedContainerIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isNewMode, setIsNewMode] = useState(!editId);

  // 팝업 상태
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showHBLConsoleModal, setShowHBLConsoleModal] = useState(false);
  const [currentField, setCurrentField] = useState<string>('');
  const [currentCodeType, setCurrentCodeType] = useState<CodeType>('customer');

  // 컨테이너 합계 계산
  const containerTotals = containers.reduce(
    (acc, row) => ({
      packageQty: acc.packageQty + (row.packageQty || 0),
      grossWeight: acc.grossWeight + (row.grossWeight || 0),
      measurement: acc.measurement + (row.measurement || 0),
    }),
    { packageQty: 0, grossWeight: 0, measurement: 0 }
  );

  // HBL 수 (고유 hblNo 기준)
  const uniqueHblCount = new Set(containers.map(c => c.hblNo).filter(Boolean)).size;

  // 수정 모드: 기존 데이터 로드
  useEffect(() => {
    if (!editId) return;
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/sr/sea?srId=${editId}`);
        if (!res.ok) return;
        const data = await res.json();

        const freightTerm = data.freightTerms || 'FCL/FCL';

        setMainData({
          blType: data.blType || 'CONSOL',
          srNo: data.srNo || '',
          regDate: data.cargoReadyDate || new Date().toISOString().split('T')[0],
          inputUser: data.inputUser || '',
          mblNo: data.mblNo || '',
          shipperCode: data.shipperCode || '',
          shipperName: data.shipperName || '',
          consigneeCode: data.consigneeCode || '',
          consigneeName: data.consigneeName || '',
          msn: data.msn || '',
          mrnNo: data.mrnNo || '',
          lineToCode: data.lineToCode || '',
          lineToName: data.lineTo || '',
          notifyCode: data.notifyCode || '',
          notifyName: data.notifyParty || '',
          bookingNo: data.bookingId ? `SB-${data.bookingId}` : '',
          fromCd: data.fromCd || '',
          fromName: data.fromName || '',
          hblNo: data.hblId ? String(data.hblId) : '',
          placeOfReceipt: data.placeOfReceipt || '',
          placeOfReceiptName: data.placeOfReceiptName || '',
          pol: data.pol || '',
          polName: data.polName || '',
          pod: data.pod || '',
          podName: data.podName || '',
          placeOfDelivery: data.placeOfDelivery || '',
          placeOfDeliveryName: data.placeOfDeliveryName || '',
          finalDest: data.finalDest || '',
          finalDestName: data.finalDestName || '',
          vessel: data.vessel || '',
          voyage: data.voyage || '',
          etd: data.etd || '',
          eta: data.eta || '',
          freightServiceTerm: freightTerm,
          cyCfsType: FREIGHT_TO_CYCFS[freightTerm] || 'CY/CY',
          consolYn: data.consolYn === 'Y',
        });

        setCargoData({
          marks: data.marksNos || '',
          description: data.descriptionText || data.commodityDesc || '',
          packageQty: Number(data.packageQty) || 0,
          packageCode: data.packageCode || 'CT',
          noOfPackage: data.packageType || '',
          grossWeight: parseFloat(data.grossWeight) || 0,
          measurement: parseFloat(data.volume) || 0,
          container20DR: 0,
          container20HC: 0,
          container20RF: 0,
          container40DR: 0,
          container40HC: 0,
          container40RF: 0,
          totalPackagesInWords: '',
        });

        // 컨테이너 로드
        if (data.containers && Array.isArray(data.containers)) {
          setContainers(
            data.containers.map((c: any) => ({
              id: `CNTR-${c.id || Date.now()}-${Math.random()}`,
              hblNo: c.hblNo || '',
              containerNo: c.containerNo || '',
              sealNo1: c.sealNo1 || '',
              sealNo2: c.sealNo2 || '',
              sealNo3: c.sealNo3 || '',
              packageQty: Number(c.packageQty) || 0,
              packageUnit: c.packageUnit || 'CT',
              grossWeight: parseFloat(c.grossWeight) || 0,
              measurement: parseFloat(c.volume) || 0,
            }))
          );
        }
        setIsNewMode(false);
      } catch (error) {
        console.error('S/R 데이터 조회 실패:', error);
      }
    };
    fetchData();
  }, [editId]);

  // 코드 검색 팝업
  const handleCodeSearch = (field: string, codeType: CodeType) => {
    setCurrentField(field);
    setCurrentCodeType(codeType);
    setShowCodeModal(true);
  };

  const handleCodeSelect = (item: CodeItem) => {
    if (currentField === 'shipper') {
      setMainData(prev => ({ ...prev, shipperCode: item.code, shipperName: item.name }));
    } else if (currentField === 'consignee') {
      setMainData(prev => ({ ...prev, consigneeCode: item.code, consigneeName: item.name }));
    } else if (currentField === 'notify') {
      setMainData(prev => ({ ...prev, notifyCode: item.code, notifyName: item.name }));
    } else if (currentField === 'lineTo') {
      setMainData(prev => ({ ...prev, lineToCode: item.code, lineToName: item.name }));
    }
    setShowCodeModal(false);
    setHasUnsavedChanges(true);
  };

  // 위치 검색 팝업
  const handleLocationSearch = (field: string) => {
    setCurrentField(field);
    setShowLocationModal(true);
  };

  const handleLocationSelect = (item: LocationItem) => {
    const nameField = currentField + 'Name';
    setMainData(prev => ({
      ...prev,
      [currentField]: item.code,
      [nameField]: item.nameEn || item.nameKr || '',
    }));
    setShowLocationModal(false);
    setHasUnsavedChanges(true);
  };

  // 부킹 검색 팝업
  const handleBookingSelect = (booking: SeaBooking | AirBooking) => {
    if ('pol' in booking) {
      setMainData(prev => ({
        ...prev,
        bookingNo: booking.bookingNo,
        shipperName: booking.shipper || prev.shipperName,
        lineToName: booking.carrier || prev.lineToName,
        pol: booking.pol || prev.pol,
        pod: booking.pod || prev.pod,
        etd: booking.etd || prev.etd,
        eta: booking.eta || prev.eta,
      }));
    }
    setShowBookingModal(false);
    setHasUnsavedChanges(true);
  };

  // 스케줄 검색 팝업
  const handleScheduleSelect = (schedule: any) => {
    setMainData(prev => ({
      ...prev,
      lineToName: schedule.carrier || prev.lineToName,
      vessel: schedule.vesselName || schedule.vessel || prev.vessel,
      voyage: schedule.voyageNo || schedule.voyage || prev.voyage,
      pol: schedule.pol || prev.pol,
      pod: schedule.pod || prev.pod,
      etd: schedule.etd || prev.etd,
      eta: schedule.eta || prev.eta,
    }));
    setShowScheduleModal(false);
    setHasUnsavedChanges(true);
  };

  // 이메일 발송
  const handleEmailSend = (emailData: any) => {
    alert('이메일이 발송되었습니다.');
  };

  // 필드 변경 핸들러
  const handleMainChange = (field: keyof MainData, value: string | boolean) => {
    if (field === 'freightServiceTerm' && typeof value === 'string') {
      const mapped = FREIGHT_TO_CYCFS[value] || '';
      setMainData(prev => ({ ...prev, [field]: value, cyCfsType: mapped }));
    } else {
      setMainData(prev => ({ ...prev, [field]: value }));
    }
    setHasUnsavedChanges(true);
  };

  const handleCargoChange = (field: keyof CargoData, value: string | number) => {
    setCargoData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  // MARK/Description 바이트 초과 처리
  const handleMarkChange = (value: string) => {
    if (getByteLength(value) > 240) {
      setCargoData(prev => ({ ...prev, marks: 'AS PER ATTACHED RIDER' }));
    } else {
      setCargoData(prev => ({ ...prev, marks: value }));
    }
    setHasUnsavedChanges(true);
  };

  const handleDescriptionChange = (value: string) => {
    if (getByteLength(value) > 960) {
      setCargoData(prev => ({ ...prev, description: 'AS PER ATTACHED RIDER' }));
    } else {
      setCargoData(prev => ({ ...prev, description: value }));
    }
    setHasUnsavedChanges(true);
  };

  // 컨테이너 행 추가
  const addContainerRow = () => {
    const newRow: ContainerRow = {
      id: `CNTR-${Date.now()}`,
      hblNo: '',
      containerNo: '',
      sealNo1: '',
      sealNo2: '',
      sealNo3: '',
      packageQty: 0,
      packageUnit: 'CT',
      grossWeight: 0,
      measurement: 0,
    };
    setContainers(prev => [...prev, newRow]);
    setHasUnsavedChanges(true);
  };

  // 컨테이너 선택 삭제
  const removeSelectedContainerRows = () => {
    if (selectedContainerIds.size === 0) {
      alert('삭제할 행을 선택하세요.');
      return;
    }
    setContainers(prev => prev.filter(c => !selectedContainerIds.has(c.id)));
    setSelectedContainerIds(new Set());
    setHasUnsavedChanges(true);
  };

  // 컨테이너 체크박스 토글
  const toggleContainerSelect = (id: string) => {
    setSelectedContainerIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 컨테이너 전체 선택/해제
  const toggleAllContainers = () => {
    if (selectedContainerIds.size === containers.length) {
      setSelectedContainerIds(new Set());
    } else {
      setSelectedContainerIds(new Set(containers.map(c => c.id)));
    }
  };

  // 컨테이너 행 업데이트
  const updateContainerRow = (index: number, field: keyof ContainerRow, value: string | number) => {
    setContainers(prev => {
      const updated = [...prev];
      (updated[index] as any)[field] = value;
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  // 저장
  const handleSave = async () => {
    if (!mainData.shipperName && !mainData.shipperCode) {
      alert('SHIPPER를 입력하세요.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Record<string, any> = {
        blType: mainData.blType,
        shipperCode: mainData.shipperCode,
        shipperName: mainData.shipperName,
        shipperAddress: '',
        consigneeCode: mainData.consigneeCode,
        consigneeName: mainData.consigneeName,
        consigneeAddress: '',
        notifyCode: mainData.notifyCode,
        notifyParty: mainData.notifyName,
        pol: mainData.pol,
        polName: mainData.polName,
        pod: mainData.pod,
        podName: mainData.podName,
        cargoReadyDate: mainData.regDate || null,
        commodityDesc: cargoData.description,
        packageQty: cargoData.packageQty,
        packageCode: cargoData.packageCode,
        packageType: cargoData.noOfPackage,
        grossWeight: cargoData.grossWeight,
        volume: cargoData.measurement,
        remark: '',
        carrier: mainData.lineToName,
        lineToCode: mainData.lineToCode,
        vessel: mainData.vessel,
        voyage: mainData.voyage,
        finalDest: mainData.finalDest,
        finalDestName: mainData.finalDestName,
        etd: mainData.etd || null,
        eta: mainData.eta || null,
        freightTerms: mainData.freightServiceTerm,
        cyCfsType: mainData.cyCfsType,
        hblId: null,
        marksNos: cargoData.marks,
        mblNo: mainData.mblNo,
        msn: mainData.msn,
        mrnNo: mainData.mrnNo,
        fromCd: mainData.fromCd,
        fromName: mainData.fromName,
        lineTo: mainData.lineToName,
        placeOfReceipt: mainData.placeOfReceipt,
        placeOfReceiptName: mainData.placeOfReceiptName,
        placeOfDelivery: mainData.placeOfDelivery,
        placeOfDeliveryName: mainData.placeOfDeliveryName,
        consolYn: mainData.consolYn ? 'Y' : 'N',
        container20Qty: (cargoData.container20DR || 0) + (cargoData.container20HC || 0) + (cargoData.container20RF || 0),
        container40Qty: (cargoData.container40DR || 0) + (cargoData.container40HC || 0) + (cargoData.container40RF || 0),
        inputUser: mainData.inputUser,
        descriptionText: cargoData.description,
        containers: containers.map(c => ({
          hblNo: c.hblNo,
          containerNo: c.containerNo,
          sealNo1: c.sealNo1,
          sealNo2: c.sealNo2,
          sealNo3: c.sealNo3,
          packageQty: c.packageQty,
          packageUnit: c.packageUnit,
          grossWeight: c.grossWeight,
          volume: c.measurement,
        })),
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
        alert(editId ? 'S/R이 수정되었습니다.' : `S/R이 등록되었습니다. (${result.srNo})`);
        setHasUnsavedChanges(false);
        setIsNewMode(false);
        if (!editId && result.srId) {
          setMainData(prev => ({ ...prev, srNo: result.srNo || '' }));
          router.replace(`/logis/sr/sea/register?id=${result.srId}`);
        }
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

  // 목록 이동
  const handleList = () => {
    router.push('/logis/sr/sea');
  };

  // 신규
  const handleNew = () => {
    if (editId) {
      router.push('/logis/sr/sea/register');
    } else {
      setMainData(initialMainData);
      setCargoData(initialCargoData);
      setContainers([]);
      setSelectedContainerIds(new Set());
      setHasUnsavedChanges(false);
      setIsNewMode(true);
    }
  };

  // S/R 복사
  const handleCopySR = () => {
    if (!editId) {
      alert('저장된 S/R만 복사할 수 있습니다.');
      return;
    }
    setMainData(prev => ({
      ...prev,
      srNo: '',
      mblNo: '',
      bookingNo: '',
      mrnNo: '',
      msn: '',
      hblNo: '',
    }));
    alert('S/R이 복사되었습니다. 저장 버튼을 클릭하면 새로운 S/R로 등록됩니다.');
    router.push('/logis/sr/sea/register');
  };

  // ========================
  // MAIN TAB 렌더링
  // ========================
  const renderMainTab = () => (
    <div className="space-y-4">
      {/* Main Information */}
      <div className="bg-white border border-gray-300 rounded">
        <div className="bg-blue-50 px-4 py-2 border-b border-gray-300">
          <h3 className="font-bold text-sm text-blue-800">Main Information</h3>
        </div>
        <div className="p-2">
          <table className="w-full border-collapse">
            <tbody>
              {/* 행1: S/R NO | BL TYPE | House B/L NO */}
              <tr>
                <th className={`${TH_CLS} w-[120px]`}>S/R NO</th>
                <td className={TD_CLS}>
                  <input
                    type="text"
                    value={mainData.srNo || '자동생성'}
                    disabled
                    className={INPUT_RO_CLS}
                  />
                </td>
                <th className={`${TH_CLS} w-[120px]`}>BL TYPE</th>
                <td className={TD_CLS}>
                  <select
                    value={mainData.blType}
                    onChange={e => handleMainChange('blType', e.target.value)}
                    className={SELECT_CLS}
                  >
                    <option value="CONSOL">CONSOL</option>
                    <option value="OBL">OBL</option>
                    <option value="SWB">SWB</option>
                    <option value="SEAWAY BILL">SEAWAY BILL</option>
                  </select>
                </td>
                <th className={`${TH_CLS} w-[120px]`}>House B/L NO</th>
                <td className={TD_CLS}>
                  <input
                    type="text"
                    value={mainData.hblNo}
                    readOnly
                    className={INPUT_RO_CLS}
                    placeholder="HBL Console 적용"
                  />
                </td>
              </tr>
              {/* 행2: M B/L NO | 등록일자 입력사원 */}
              <tr>
                <th className={`${TH_CLS} w-[120px]`}>M B/L NO</th>
                <td className={TD_CLS}>
                  <input
                    type="text"
                    value={mainData.mblNo}
                    onChange={e => handleMainChange('mblNo', e.target.value)}
                    readOnly={!!editId && !!mainData.mblNo}
                    className={editId && mainData.mblNo ? INPUT_RO_CLS : INPUT_CLS}
                    placeholder="M B/L NO"
                  />
                </td>
                <th className={`${TH_CLS} w-[120px]`}>등록일자</th>
                <td className={TD_CLS}>
                  <input
                    type="date"
                    value={mainData.regDate}
                    onChange={e => handleMainChange('regDate', e.target.value)}
                    className={INPUT_CLS}
                  />
                </td>
                <th className={`${TH_CLS} w-[120px]`}>입력사원</th>
                <td className={TD_CLS}>
                  <input
                    type="text"
                    value={mainData.inputUser}
                    onChange={e => handleMainChange('inputUser', e.target.value)}
                    className={INPUT_CLS}
                    placeholder="입력사원"
                  />
                </td>
              </tr>
              {/* 행3: SHIPPER 코드+이름 | CONSIGNEE 코드+이름 */}
              <tr>
                <th className={`${TH_CLS} w-[120px]`} rowSpan={2}>SHIPPER</th>
                <td className={TD_CLS}>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={mainData.shipperCode}
                      onChange={e => handleMainChange('shipperCode', e.target.value)}
                      className="w-[120px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm"
                      placeholder="코드"
                    />
                    <SearchIconButton onClick={() => handleCodeSearch('shipper', 'customer')} />
                  </div>
                </td>
                <th className={`${TH_CLS} w-[120px]`} rowSpan={2}>CONSIGNEE</th>
                <td className={TD_CLS}>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={mainData.consigneeCode}
                      onChange={e => handleMainChange('consigneeCode', e.target.value)}
                      className="w-[120px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm"
                      placeholder="코드"
                    />
                    <SearchIconButton onClick={() => handleCodeSearch('consignee', 'customer')} />
                  </div>
                </td>
                <td className={TD_CLS} colSpan={2} rowSpan={2}></td>
              </tr>
              <tr>
                {/* SHIPPER 이름 (2행) */}
                <td className={TD_CLS}>
                  <input
                    type="text"
                    value={mainData.shipperName}
                    onChange={e => handleMainChange('shipperName', e.target.value)}
                    className={INPUT_CLS}
                    placeholder="이름/상호"
                  />
                </td>
                {/* CONSIGNEE 이름 (2행) */}
                <td className={TD_CLS}>
                  <input
                    type="text"
                    value={mainData.consigneeName}
                    onChange={e => handleMainChange('consigneeName', e.target.value)}
                    className={INPUT_CLS}
                    placeholder="이름/상호"
                  />
                </td>
              </tr>
              {/* 행4: NOTIFY 코드+이름 | LINE(TO) 코드+이름 */}
              <tr>
                <th className={`${TH_CLS} w-[120px]`} rowSpan={2}>NOTIFY</th>
                <td className={TD_CLS}>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={mainData.notifyCode}
                      onChange={e => handleMainChange('notifyCode', e.target.value)}
                      className="w-[120px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm"
                      placeholder="코드"
                    />
                    <SearchIconButton onClick={() => handleCodeSearch('notify', 'customer')} />
                  </div>
                </td>
                <th className={`${TH_CLS} w-[120px]`} rowSpan={2}>LINE(TO)</th>
                <td className={TD_CLS}>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={mainData.lineToCode}
                      onChange={e => handleMainChange('lineToCode', e.target.value)}
                      className="w-[120px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm"
                      placeholder="코드"
                    />
                    <SearchIconButton onClick={() => handleCodeSearch('lineTo', 'carrier')} />
                  </div>
                </td>
                <td className={TD_CLS} colSpan={2} rowSpan={2}></td>
              </tr>
              <tr>
                {/* NOTIFY 이름 (2행) */}
                <td className={TD_CLS}>
                  <input
                    type="text"
                    value={mainData.notifyName}
                    onChange={e => handleMainChange('notifyName', e.target.value)}
                    className={INPUT_CLS}
                    placeholder="이름/상호"
                  />
                </td>
                {/* LINE(TO) 이름 (2행) */}
                <td className={TD_CLS}>
                  <input
                    type="text"
                    value={mainData.lineToName}
                    onChange={e => handleMainChange('lineToName', e.target.value)}
                    className={INPUT_CLS}
                    placeholder="이름/상호"
                  />
                </td>
              </tr>
              {/* 행5: BOOKING NO | FROM 코드+이름 */}
              <tr>
                <th className={`${TH_CLS} w-[120px]`}>BOOKING NO</th>
                <td className={TD_CLS}>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={mainData.bookingNo}
                      onChange={e => handleMainChange('bookingNo', e.target.value)}
                      className={`flex-1 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm`}
                      placeholder="BOOKING NO"
                    />
                    <SearchIconButton onClick={() => setShowBookingModal(true)} />
                  </div>
                </td>
                <th className={`${TH_CLS} w-[120px]`}>FROM</th>
                <td className={TD_CLS} colSpan={3}>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={mainData.fromCd}
                      onChange={e => handleMainChange('fromCd', e.target.value)}
                      className="w-[100px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm"
                      placeholder="코드"
                    />
                    <SearchIconButton onClick={() => handleCodeSearch('from', 'customer')} />
                    <input
                      type="text"
                      value={mainData.fromName}
                      onChange={e => handleMainChange('fromName', e.target.value)}
                      className="flex-1 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm"
                      placeholder="이름"
                    />
                  </div>
                </td>
              </tr>
              {/* 행6: MRN NO */}
              <tr>
                <th className={`${TH_CLS} w-[120px]`}>MRN NO</th>
                <td className={TD_CLS} colSpan={5}>
                  <input
                    type="text"
                    value={mainData.mrnNo}
                    onChange={e => handleMainChange('mrnNo', e.target.value)}
                    className={INPUT_CLS}
                    placeholder="MRN NO"
                  />
                </td>
              </tr>
              {/* 행7: MSN */}
              <tr>
                <th className={`${TH_CLS} w-[120px]`}>MSN</th>
                <td className={TD_CLS} colSpan={5}>
                  <input
                    type="text"
                    value={mainData.msn}
                    onChange={e => handleMainChange('msn', e.target.value)}
                    className={INPUT_CLS}
                    placeholder="MSN"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Information */}
      <div className="bg-white border border-gray-300 rounded">
        <div className="bg-blue-50 px-4 py-2 border-b border-gray-300">
          <h3 className="font-bold text-sm text-blue-800">Schedule Information</h3>
        </div>
        <div className="p-2">
          <table className="w-full border-collapse">
            <tbody>
              {/* 행1: Place of Receipt | Port of Loading | Port of Discharge (3열) */}
              <tr>
                <th className={`${TH_CLS} w-[120px]`}>Place of Receipt</th>
                <td className={TD_CLS}>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={mainData.placeOfReceipt}
                      onChange={e => handleMainChange('placeOfReceipt', e.target.value)}
                      className="w-[80px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm"
                      placeholder="코드"
                    />
                    <SearchIconButton onClick={() => handleLocationSearch('placeOfReceipt')} />
                    <input
                      type="text"
                      value={mainData.placeOfReceiptName}
                      onChange={e => handleMainChange('placeOfReceiptName', e.target.value)}
                      className="flex-1 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm"
                      placeholder="이름"
                      readOnly
                    />
                  </div>
                </td>
                <th className={`${TH_CLS} w-[120px]`}>Port of Loading</th>
                <td className={TD_CLS}>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={mainData.pol}
                      onChange={e => handleMainChange('pol', e.target.value)}
                      className="w-[80px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm"
                      placeholder="코드"
                    />
                    <SearchIconButton onClick={() => handleLocationSearch('pol')} />
                    <input
                      type="text"
                      value={mainData.polName}
                      onChange={e => handleMainChange('polName', e.target.value)}
                      className="flex-1 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm"
                      placeholder="이름"
                      readOnly
                    />
                  </div>
                </td>
                <th className={`${TH_CLS} w-[120px]`}>Port of Discharge</th>
                <td className={TD_CLS}>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={mainData.pod}
                      onChange={e => handleMainChange('pod', e.target.value)}
                      className="w-[80px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm"
                      placeholder="코드"
                    />
                    <SearchIconButton onClick={() => handleLocationSearch('pod')} />
                    <input
                      type="text"
                      value={mainData.podName}
                      onChange={e => handleMainChange('podName', e.target.value)}
                      className="flex-1 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm"
                      placeholder="이름"
                      readOnly
                    />
                  </div>
                </td>
              </tr>
              {/* 행2: Place of Delivery | Final Destination | Vessel Name / Voyage */}
              <tr>
                <th className={`${TH_CLS} w-[120px]`}>Place of Delivery</th>
                <td className={TD_CLS}>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={mainData.placeOfDelivery}
                      onChange={e => handleMainChange('placeOfDelivery', e.target.value)}
                      className="w-[80px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm"
                      placeholder="코드"
                    />
                    <SearchIconButton onClick={() => handleLocationSearch('placeOfDelivery')} />
                    <input
                      type="text"
                      value={mainData.placeOfDeliveryName}
                      onChange={e => handleMainChange('placeOfDeliveryName', e.target.value)}
                      className="flex-1 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm"
                      placeholder="이름"
                      readOnly
                    />
                  </div>
                </td>
                <th className={`${TH_CLS} w-[120px]`}>Final Destination</th>
                <td className={TD_CLS}>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={mainData.finalDest}
                      onChange={e => handleMainChange('finalDest', e.target.value)}
                      className="w-[80px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm"
                      placeholder="코드"
                    />
                    <SearchIconButton onClick={() => handleLocationSearch('finalDest')} />
                    <input
                      type="text"
                      value={mainData.finalDestName}
                      onChange={e => handleMainChange('finalDestName', e.target.value)}
                      className="flex-1 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm"
                      placeholder="이름"
                      readOnly
                    />
                  </div>
                </td>
                <th className={`${TH_CLS} w-[120px]`}>Vessel / Voyage</th>
                <td className={TD_CLS}>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={mainData.vessel}
                      onChange={e => handleMainChange('vessel', e.target.value)}
                      className="flex-1 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm"
                      placeholder="Vessel Name"
                    />
                    <input
                      type="text"
                      value={mainData.voyage}
                      onChange={e => handleMainChange('voyage', e.target.value)}
                      className="w-[80px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm"
                      placeholder="Voyage"
                    />
                  </div>
                </td>
              </tr>
              {/* 행3: E.T.D / E.T.A | Freight Service Term | CY/CFS + CONSOL */}
              <tr>
                <th className={`${TH_CLS} w-[120px]`}>E.T.D / E.T.A</th>
                <td className={TD_CLS}>
                  <div className="flex gap-1 items-center">
                    <input
                      type="date"
                      value={mainData.etd}
                      onChange={e => handleMainChange('etd', e.target.value)}
                      className="flex-1 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm"
                    />
                    <span className="text-sm text-gray-500">/</span>
                    <input
                      type="date"
                      value={mainData.eta}
                      onChange={e => handleMainChange('eta', e.target.value)}
                      className="flex-1 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm"
                    />
                  </div>
                </td>
                <th className={`${TH_CLS} w-[120px]`}>Freight Term</th>
                <td className={TD_CLS}>
                  <select
                    value={mainData.freightServiceTerm}
                    onChange={e => handleMainChange('freightServiceTerm', e.target.value)}
                    className={SELECT_CLS}
                  >
                    {FREIGHT_SERVICE_TERMS.map(term => (
                      <option key={term} value={term}>{term}</option>
                    ))}
                  </select>
                </td>
                <th className={`${TH_CLS} w-[120px]`}>CY/CFS</th>
                <td className={TD_CLS}>
                  <div className="flex gap-2 items-center">
                    <select
                      value={mainData.cyCfsType}
                      className="flex-1 h-[32px] px-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-500"
                      disabled
                    >
                      {CYCFS_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-1 whitespace-nowrap">
                      <span className="text-sm font-medium">CONSOL</span>
                      <select
                        value={mainData.consolYn ? 'Y' : 'N'}
                        onChange={e => handleMainChange('consolYn', e.target.value === 'Y')}
                        className="w-[50px] h-[32px] px-1 bg-white border border-gray-300 rounded text-sm"
                      >
                        <option value="N">N</option>
                        <option value="Y">Y</option>
                      </select>
                    </label>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ========================
  // CARGO TAB 렌더링
  // ========================
  const renderCargoTab = () => (
    <div className="space-y-4">
      {/* Cargo Information */}
      <div className="bg-white border border-gray-300 rounded">
        <div className="bg-blue-50 px-4 py-2 border-b border-gray-300">
          <h3 className="font-bold text-sm text-blue-800">Cargo Information</h3>
        </div>
        <div className="p-2">
          <table className="w-full border-collapse">
            <tbody>
              {/* MARK */}
              <tr>
                <th className={`${TH_CLS} w-[140px] align-top`}>MARK</th>
                <td colSpan={5} className={TD_CLS}>
                  <textarea
                    value={cargoData.marks}
                    onChange={e => handleMarkChange(e.target.value)}
                    rows={4}
                    className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-sm resize-none"
                    placeholder="MARK (240byte 초과 시 AS PER ATTACHED RIDER)"
                  />
                  <div className="text-xs text-gray-400 text-right">{getByteLength(cargoData.marks)}/240 bytes</div>
                </td>
              </tr>
              {/* Description */}
              <tr>
                <th className={`${TH_CLS} w-[140px] align-top`}>Description</th>
                <td colSpan={5} className={TD_CLS}>
                  <textarea
                    value={cargoData.description}
                    onChange={e => handleDescriptionChange(e.target.value)}
                    rows={4}
                    className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-sm resize-none"
                    placeholder="Description of Goods (960byte 초과 시 AS PER ATTACHED RIDER)"
                  />
                  <div className="text-xs text-gray-400 text-right">{getByteLength(cargoData.description)}/960 bytes</div>
                </td>
              </tr>
              {/* Package [수량][포장코드▼] | No of Package | Gross Weight | Measurement */}
              <tr>
                <th className={`${TH_CLS} w-[140px]`}>Package</th>
                <td className={TD_CLS}>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={cargoData.packageQty}
                      onChange={e => handleCargoChange('packageQty', parseInt(e.target.value) || 0)}
                      className="w-[80px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm text-right"
                      placeholder="수량"
                    />
                    <select
                      value={cargoData.packageCode}
                      onChange={e => handleCargoChange('packageCode', e.target.value)}
                      className="w-[70px] h-[32px] px-1 bg-white border border-gray-300 rounded text-sm"
                    >
                      {PACKAGE_CODES.map(code => (
                        <option key={code} value={code}>{code}</option>
                      ))}
                    </select>
                  </div>
                </td>
                <th className={`${TH_CLS} w-[120px]`}>No of Package</th>
                <td className={TD_CLS}>
                  <input
                    type="text"
                    value={cargoData.noOfPackage}
                    onChange={e => handleCargoChange('noOfPackage', e.target.value)}
                    className={INPUT_CLS}
                    placeholder="PALLETS"
                  />
                </td>
                <th className={`${TH_CLS} w-[120px]`}>Gross Weight</th>
                <td className={TD_CLS}>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={cargoData.grossWeight}
                      onChange={e => handleCargoChange('grossWeight', parseFloat(e.target.value) || 0)}
                      className="flex-1 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm text-right"
                      placeholder="0"
                      step="0.001"
                    />
                    <span className="text-sm text-gray-600 whitespace-nowrap">KG</span>
                  </div>
                </td>
              </tr>
              <tr>
                <th className={`${TH_CLS} w-[140px]`}>Measurement</th>
                <td className={TD_CLS}>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={cargoData.measurement}
                      onChange={e => handleCargoChange('measurement', parseFloat(e.target.value) || 0)}
                      className="flex-1 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm text-right"
                      placeholder="0"
                      step="0.0001"
                    />
                    <span className="text-sm text-gray-600 whitespace-nowrap">CBM</span>
                  </div>
                </td>
                <td colSpan={4}></td>
              </tr>
              {/* Container 20 / 40 */}
              <tr>
                <th className={`${TH_CLS} w-[140px]`}>Container 20</th>
                <td colSpan={5} className={TD_CLS}>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1">
                      <label className="text-sm font-medium whitespace-nowrap">20DR</label>
                      <input
                        type="number"
                        value={cargoData.container20DR}
                        onChange={e => handleCargoChange('container20DR', parseInt(e.target.value) || 0)}
                        className="w-16 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm text-right"
                        min={0}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <label className="text-sm font-medium whitespace-nowrap">20HC</label>
                      <input
                        type="number"
                        value={cargoData.container20HC}
                        onChange={e => handleCargoChange('container20HC', parseInt(e.target.value) || 0)}
                        className="w-16 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm text-right"
                        min={0}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <label className="text-sm font-medium whitespace-nowrap">20RF</label>
                      <input
                        type="number"
                        value={cargoData.container20RF}
                        onChange={e => handleCargoChange('container20RF', parseInt(e.target.value) || 0)}
                        className="w-16 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm text-right"
                        min={0}
                      />
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <th className={`${TH_CLS} w-[140px]`}>Container 40</th>
                <td colSpan={5} className={TD_CLS}>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1">
                      <label className="text-sm font-medium whitespace-nowrap">40DR</label>
                      <input
                        type="number"
                        value={cargoData.container40DR}
                        onChange={e => handleCargoChange('container40DR', parseInt(e.target.value) || 0)}
                        className="w-16 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm text-right"
                        min={0}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <label className="text-sm font-medium whitespace-nowrap">40HC</label>
                      <input
                        type="number"
                        value={cargoData.container40HC}
                        onChange={e => handleCargoChange('container40HC', parseInt(e.target.value) || 0)}
                        className="w-16 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm text-right"
                        min={0}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <label className="text-sm font-medium whitespace-nowrap">40RF</label>
                      <input
                        type="number"
                        value={cargoData.container40RF}
                        onChange={e => handleCargoChange('container40RF', parseInt(e.target.value) || 0)}
                        className="w-16 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm text-right"
                        min={0}
                      />
                    </div>
                  </div>
                </td>
              </tr>
              {/* Total Packages in Words */}
              <tr>
                <th className={`${TH_CLS} w-[140px]`}>Total Packages in Words</th>
                <td colSpan={5} className={TD_CLS}>
                  <input
                    type="text"
                    value={cargoData.totalPackagesInWords}
                    onChange={e => handleCargoChange('totalPackagesInWords', e.target.value)}
                    className={INPUT_CLS}
                    placeholder="Total Packages in Words"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Container Information */}
      <div className="bg-white border border-gray-300 rounded">
        <div className="bg-blue-50 px-4 py-2 border-b border-gray-300 flex justify-between items-center">
          <h3 className="font-bold text-sm text-blue-800">Container Information</h3>
          <div className="flex gap-2">
            <button
              onClick={addContainerRow}
              className="px-3 py-1 text-sm bg-[#2563EB] text-white rounded hover:bg-[#1d4ed8]"
            >
              추가
            </button>
            <button
              onClick={removeSelectedContainerRows}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              삭제
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-2 text-sm font-medium text-center w-10">
                  <input
                    type="checkbox"
                    checked={containers.length > 0 && selectedContainerIds.size === containers.length}
                    onChange={toggleAllContainers}
                    className="rounded"
                  />
                </th>
                <th className="border border-gray-300 px-2 py-2 text-sm font-medium text-center w-10">No</th>
                <th className="border border-gray-300 px-2 py-2 text-sm font-medium text-center">HOUSE B/L No</th>
                <th className="border border-gray-300 px-2 py-2 text-sm font-medium text-center">Container No</th>
                <th className="border border-gray-300 px-2 py-2 text-sm font-medium text-center">Seal 1 No.</th>
                <th className="border border-gray-300 px-2 py-2 text-sm font-medium text-center">Seal 2 No.</th>
                <th className="border border-gray-300 px-2 py-2 text-sm font-medium text-center">Seal 3 No.</th>
                <th className="border border-gray-300 px-2 py-2 text-sm font-medium text-center">Package</th>
                <th className="border border-gray-300 px-2 py-2 text-sm font-medium text-center">Unit</th>
                <th className="border border-gray-300 px-2 py-2 text-sm font-medium text-center">G.Weight</th>
                <th className="border border-gray-300 px-2 py-2 text-sm font-medium text-center">Measurement</th>
              </tr>
            </thead>
            <tbody>
              {containers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="border border-gray-300 p-4 text-center text-gray-400 text-sm">
                    컨테이너 정보가 없습니다. 추가 버튼을 클릭하세요.
                  </td>
                </tr>
              ) : (
                containers.map((row, index) => (
                  <tr key={row.id} className="hover:bg-blue-50">
                    <td className="border border-gray-300 px-2 py-1 text-center">
                      <input
                        type="checkbox"
                        checked={selectedContainerIds.has(row.id)}
                        onChange={() => toggleContainerSelect(row.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center text-sm">{index + 1}</td>
                    <td className="border border-gray-300 px-1 py-1">
                      <input
                        type="text"
                        value={row.hblNo}
                        onChange={e => updateContainerRow(index, 'hblNo', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-sm"
                        placeholder="HBL No"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <input
                        type="text"
                        value={row.containerNo}
                        onChange={e => updateContainerRow(index, 'containerNo', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-sm"
                        placeholder="XXXX1234567"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <input
                        type="text"
                        value={row.sealNo1}
                        onChange={e => updateContainerRow(index, 'sealNo1', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-sm"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <input
                        type="text"
                        value={row.sealNo2}
                        onChange={e => updateContainerRow(index, 'sealNo2', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-sm"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <input
                        type="text"
                        value={row.sealNo3}
                        onChange={e => updateContainerRow(index, 'sealNo3', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-sm"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <input
                        type="number"
                        value={row.packageQty}
                        onChange={e => updateContainerRow(index, 'packageQty', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-sm text-right"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <select
                        value={row.packageUnit}
                        onChange={e => updateContainerRow(index, 'packageUnit', e.target.value)}
                        className="w-full px-1 py-1 bg-white border border-gray-300 rounded text-sm"
                      >
                        {PACKAGE_CODES.map(code => (
                          <option key={code} value={code}>{code}</option>
                        ))}
                      </select>
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <input
                        type="number"
                        value={row.grossWeight}
                        onChange={e => updateContainerRow(index, 'grossWeight', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-sm text-right"
                        step="0.001"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <input
                        type="number"
                        value={row.measurement}
                        onChange={e => updateContainerRow(index, 'measurement', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-sm text-right"
                        step="0.0001"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Total 합계 영역 */}
        <div className="p-2 border-t border-gray-300 bg-gray-50">
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <th className={`${TH_CLS} w-[140px]`}>Total H B/L List</th>
                <td className={TD_CLS}>
                  <input type="text" value={uniqueHblCount} readOnly className={INPUT_RO_CLS} />
                </td>
                <th className={`${TH_CLS} w-[120px]`}>Total Package</th>
                <td className={TD_CLS}>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={containerTotals.packageQty.toLocaleString()}
                      readOnly
                      className={`flex-1 ${INPUT_RO_CLS} text-right`}
                    />
                    <span className="text-sm text-gray-600 whitespace-nowrap">CT</span>
                  </div>
                </td>
                <th className={`${TH_CLS} w-[120px]`}>Total Gross Weight</th>
                <td className={TD_CLS}>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={containerTotals.grossWeight.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                      readOnly
                      className={`flex-1 ${INPUT_RO_CLS} text-right`}
                    />
                    <span className="text-sm text-gray-600 whitespace-nowrap">KG</span>
                  </div>
                </td>
                <th className={`${TH_CLS} w-[120px]`}>Total Measurement</th>
                <td className={TD_CLS}>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={containerTotals.measurement.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                      readOnly
                      className={`flex-1 ${INPUT_RO_CLS} text-right`}
                    />
                    <span className="text-sm text-gray-600 whitespace-nowrap">CBM</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // 탭 컨텐츠 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 'MAIN':
        return renderMainTab();
      case 'CARGO':
        return renderCargoTab();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header
        title={editId ? '선적요청 수정 (S/R)' : '선적요청 등록 (S/R)'}
        subtitle={`Logis > 선적관리 > 선적요청 ${editId ? '수정' : '등록'} (해상)`}
        onClose={handleCloseClick}
      />
      <main ref={formRef} className="p-6">
        {/* 상단 버튼 + TAB 영역 */}
        <div className="sticky top-20 z-20 bg-white -mx-6 px-6 pb-0 pt-2">
          <div className="flex justify-between items-center pb-2">
            <div />
            <div className="flex gap-2">
              <button
                onClick={handleNew}
                disabled={isNewMode}
                className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                신규
              </button>
              <button
                onClick={() => setShowHBLConsoleModal(true)}
                className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] text-sm font-medium"
              >
                HOUSE B/L CONSOLE
              </button>
              <button
                onClick={handleList}
                className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] text-sm font-medium"
              >
                목록
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] text-sm font-medium disabled:opacity-50"
              >
                {isSaving ? '저장 중...' : '저장'}
              </button>
              <button
                onClick={() => alert('S/R 송신 기능은 준비 중입니다.')}
                className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] text-sm font-medium"
              >
                S/R송신
              </button>
              <button
                onClick={() => alert('S/R 수신 기능은 준비 중입니다.')}
                className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] text-sm font-medium"
              >
                S/R수신
              </button>
              <button
                onClick={handleCopySR}
                className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] text-sm font-medium"
              >
                S/R복사
              </button>
              <button
                onClick={() => alert('ULH(해외신고) 기능은 준비 중입니다.')}
                className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] text-sm font-medium"
              >
                ULH(해외신고)
              </button>
            </div>
          </div>
          <div className="flex gap-1 border-b border-[var(--border)]">
            {(['MAIN', 'CARGO'] as TabType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-6 py-3 font-medium rounded-t-lg transition-colors ${
                  activeTab === tab
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-[var(--surface-100)] text-[var(--foreground)] hover:bg-[var(--surface-200)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* TAB 컨텐츠 */}
        {renderTabContent()}
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
        documentNo={mainData.srNo || '신규'}
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

      {/* HOUSE B/L CONSOLE 팝업 */}
      <HBLConsoleModal
        isOpen={showHBLConsoleModal}
        onClose={() => setShowHBLConsoleModal(false)}
        onSelect={(items: HBLConsoleItem[]) => {
          // 선택된 HBL 번호를 콤마 구분으로 hblNo에 삽입
          const hblNos = items.map(item => item.hblNo).filter(Boolean);
          // Container 테이블에 반영
          const newRows = items.map((item, idx) => ({
            id: `hbl-${Date.now()}-${idx}`,
            hblNo: item.hblNo,
            containerNo: '',
            sealNo1: '',
            sealNo2: '',
            sealNo3: '',
            packageQty: item.packages,
            packageUnit: 'CT',
            grossWeight: item.grossWeight,
            measurement: item.cbm,
          }));
          setContainers(prev => [...prev, ...newRows]);
          // MAIN 탭 필드 업데이트
          if (items.length > 0) {
            const first = items[0];
            // Cargo 합산
            const totalPkg = items.reduce((sum, i) => sum + (i.packages || 0), 0);
            const totalGw = items.reduce((sum, i) => sum + (i.grossWeight || 0), 0);
            const totalCbm = items.reduce((sum, i) => sum + (i.cbm || 0), 0);
            setMainData(prev => ({
              ...prev,
              mblNo: first.mblNo || prev.mblNo,
              shipperName: first.shipper || prev.shipperName,
              hblNo: hblNos.join(', '),
            }));
            setCargoData(prev => ({
              ...prev,
              packageQty: prev.packageQty + totalPkg,
              grossWeight: prev.grossWeight + totalGw,
              measurement: prev.measurement + totalCbm,
            }));
          }
          setShowHBLConsoleModal(false);
          setHasUnsavedChanges(true);
        }}
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
