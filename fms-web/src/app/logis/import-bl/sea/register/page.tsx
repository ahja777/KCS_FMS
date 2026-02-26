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
import { formatCurrency } from '@/utils/format';
import {
  CodeSearchModal,
  LocationCodeModal,
  DimensionsCalculatorModal,
  type CodeItem,
  type CodeType,
  type LocationItem,
  type DimensionItem,
} from '@/components/popup';

// 탭 타입 정의
type TabType = 'MAIN' | 'CARGO' | 'OTHER';

// B/L 등록 폼 데이터 타입
interface BLFormData {
  // MAIN TAB
  jobNo: string;
  importExport: 'IN' | 'OUT';
  businessType: 'CONSOL' | 'CO-LOAD' | 'SIMPLE';
  paymentMethod: 'PREPAID' | 'COLLECT';
  mblNo: string;
  hblNo: string;
  srNo: string;
  bookingNo: string;
  shipperCode: string;
  shipperName: string;
  shipperAddress: string;
  consigneeCode: string;
  consigneeName: string;
  consigneeAddress: string;
  notifyCode: string;
  notifyName: string;
  notifyAddress: string;
  notifyToOrder: boolean;
  notifySameAsConsignee: boolean;
  forwardingAgentCode: string;
  forwardingAgentName: string;
  placeOfReceipt: string;
  placeOfReceiptName: string;
  portOfLoading: string;
  portOfLoadingName: string;
  portOfDischarge: string;
  portOfDischargeName: string;
  placeOfDelivery: string;
  placeOfDeliveryName: string;
  finalDestination: string;
  finalDestinationName: string;
  carrierCode: string;
  carrierName: string;
  vesselName: string;
  voyageNo: string;
  etd: string;
  eta: string;
  serviceTerm: string;
  freightTerm: 'PREPAID' | 'COLLECT';
  freightPayableAt: string;
  blIssueDate: string;
  blIssuePlace: string;
  // CARGO TAB
  containerType: 'LCL' | 'FCL' | 'BULK';
  packageQty: number;
  packageUnit: string;
  grossWeight: number;
  weightUnit: string;
  measurement: number;
  measurementUnit: string;
  asArranged: boolean;
  cargoDescription: string;
  marksAndNumbers: string;
  containers: ContainerInfo[];
  // OTHER TAB
  otherCharges: OtherCharge[];
  remarks: string;
}

interface ContainerInfo {
  id: string;
  containerNo: string;
  sealNo: string;
  containerType: string;
  size: string;
  packageQty: number;
  packageUnit: string;
  grossWeight: number;
  measurement: number;
}

interface OtherCharge {
  id: string;
  code: string;
  description: string;
  currency: string;
  prepaid: number;
  collect: number;
}

const initialFormData: BLFormData = {
  jobNo: '',
  importExport: 'IN',
  businessType: 'CONSOL',
  paymentMethod: 'PREPAID',
  mblNo: '',
  hblNo: '',
  srNo: '',
  bookingNo: '',
  shipperCode: '',
  shipperName: '',
  shipperAddress: '',
  consigneeCode: '',
  consigneeName: '',
  consigneeAddress: '',
  notifyCode: '',
  notifyName: '',
  notifyAddress: '',
  notifyToOrder: false,
  notifySameAsConsignee: false,
  forwardingAgentCode: '',
  forwardingAgentName: '',
  placeOfReceipt: '',
  placeOfReceiptName: '',
  portOfLoading: '',
  portOfLoadingName: '',
  portOfDischarge: 'KRPUS',
  portOfDischargeName: '',
  placeOfDelivery: '',
  placeOfDeliveryName: '',
  finalDestination: '',
  finalDestinationName: '',
  carrierCode: '',
  carrierName: '',
  vesselName: '',
  voyageNo: '',
  etd: '',
  eta: '',
  serviceTerm: 'CY/CY',
  freightTerm: 'PREPAID',
  freightPayableAt: '',
  blIssueDate: '',
  blIssuePlace: '',
  containerType: 'FCL',
  packageQty: 0,
  packageUnit: 'CT',
  grossWeight: 0,
  weightUnit: 'KG',
  measurement: 0,
  measurementUnit: 'CBM',
  asArranged: true,
  cargoDescription: '',
  marksAndNumbers: '',
  containers: [],
  otherCharges: [],
  remarks: '',
};

// 컨테이너 타입 옵션
const containerTypeOptions = [
  { code: '20GP', label: "20' Dry" },
  { code: '20HC', label: "20' HC" },
  { code: '20RF', label: "20' Reefer" },
  { code: '40GP', label: "40' Dry" },
  { code: '40HC', label: "40' HC" },
  { code: '40RF', label: "40' Reefer" },
  { code: '45HC', label: "45' HC" },
];

// 서비스 텀 옵션
const serviceTermOptions = [
  'CY/CY', 'CFS/CFS', 'CY/CFS', 'CFS/CY',
  'CY/DOOR', 'DOOR/CY', 'CFS/DOOR', 'DOOR/CFS',
  'DOOR/DOOR', 'BULK'
];

// 패키지 유닛 옵션
const packageUnitOptions = [
  { code: 'CT', label: 'Carton' },
  { code: 'PK', label: 'Package' },
  { code: 'PL', label: 'Pallet' },
  { code: 'BX', label: 'Box' },
  { code: 'BG', label: 'Bag' },
  { code: 'DR', label: 'Drum' },
  { code: 'PC', label: 'Piece' },
];

// 필수 항목 뱃지 컴포넌트
const RequiredBadge = () => (
  <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-red-500/20 text-red-400 rounded">
    필수
  </span>
);

// 필수 필드 목록 (5개)
const REQUIRED_FIELDS = ['importExport', 'mblNo', 'hblNo', 'portOfLoading', 'portOfDischarge'] as const;

function ImportBLRegisterPageContent() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });
  const searchParams = useSearchParams();
  const hblId = searchParams.get('hblId');
  const isEditMode = !!hblId;

  const [activeTab, setActiveTab] = useState<TabType>('MAIN');
  const [formData, setFormData] = useState<BLFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 팝업 모달 상태
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showFreightModal, setShowFreightModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDimensionsCalculator, setShowDimensionsCalculator] = useState(false);

  // 코드/위치 검색 팝업 상태
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [currentField, setCurrentField] = useState<string>('');
  const [currentCodeType, setCurrentCodeType] = useState<CodeType>('customer');
  const [currentLocationType, setCurrentLocationType] = useState<'airport' | 'seaport' | 'city'>('seaport');

  // 변경사항 추적
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isNewMode, setIsNewMode] = useState(true);



  // useScreenClose hook
  const {
    showModal: showCloseModal,
    handleCloseClick,
    handleModalClose,
    handleDiscard: handleDiscardChanges,
  } = useScreenClose({
    hasChanges: hasUnsavedChanges,
    listPath: LIST_PATHS.IMPORT_BL_SEA,
  });

  // 폼 변경 감지
  useEffect(() => {
    if (formData.mblNo || formData.hblNo || formData.shipperName) {
      setHasUnsavedChanges(true);
    }
  }, [formData.mblNo, formData.hblNo, formData.shipperName]);

  // 목록으로 이동
  const handleGoList = () => {
    if (hasUnsavedChanges) {
      // useScreenClose hook의 handleCloseClick 사용
      handleCloseClick();
      return;
    }
    router.push(LIST_PATHS.IMPORT_BL_SEA);
  };

  // 스케줄 선택 핸들러
  const handleScheduleSelect = (schedule: any) => {
    setFormData(prev => ({
      ...prev,
      carrierId: schedule.carrierCode || '',
      carrierName: schedule.carrier || '',
      vesselName: schedule.vesselName || '',
      voyageNo: schedule.voyageNo || '',
      portOfLoading: schedule.pol || '',
      portOfDischarge: schedule.pod || '',
      etd: schedule.etd || '',
      eta: schedule.eta || '',
    }));
    setMessage({ type: 'success', text: `선박 "${schedule.vesselName}" (${schedule.voyageNo}) 스케줄이 선택되었습니다.` });
    setTimeout(() => setMessage(null), 3000);
  };

  // 운임 선택 핸들러
  const handleFreightSelect = (freight: any) => {
    setMessage({ type: 'success', text: `"${freight.carrier}" 운임 (${freight.containerType}: ${freight.total} ${freight.currency})이 선택되었습니다.` });
    setTimeout(() => setMessage(null), 3000);
  };

  // 이메일 발송 핸들러
  const handleEmailSend = (emailData: any) => {
    console.log('이메일 발송:', emailData);
    setMessage({ type: 'success', text: `이메일이 발송되었습니다. (받는 사람: ${emailData.to.join(', ')})` });
    setTimeout(() => setMessage(null), 5000);
  };

  // 코드 검색 버튼 클릭
  const handleCodeSearch = (field: string, codeType: CodeType) => {
    setCurrentField(field);
    setCurrentCodeType(codeType);
    setShowCodeModal(true);
  };

  // 코드 선택 완료
  const handleCodeSelect = (item: CodeItem) => {
    if (currentField === 'shipper') {
      setFormData(prev => ({
        ...prev,
        shipperCode: item.code,
        shipperName: item.name,
      }));
    } else if (currentField === 'consignee') {
      setFormData(prev => ({
        ...prev,
        consigneeCode: item.code,
        consigneeName: item.name,
      }));
    } else if (currentField === 'notify') {
      setFormData(prev => ({
        ...prev,
        notifyCode: item.code,
        notifyName: item.name,
      }));
    } else if (currentField === 'forwardingAgent') {
      setFormData(prev => ({
        ...prev,
        forwardingAgentCode: item.code,
        forwardingAgentName: item.name,
      }));
    } else if (currentField === 'carrier') {
      setFormData(prev => ({
        ...prev,
        carrierCode: item.code,
        carrierName: item.name,
      }));
    }
    setShowCodeModal(false);
    setHasUnsavedChanges(true);
  };

  // 위치 검색 버튼 클릭
  const handleLocationSearch = (field: string, type: 'airport' | 'seaport' | 'city') => {
    setCurrentField(field);
    setCurrentLocationType(type);
    setShowLocationModal(true);
  };

  // 위치 선택 완료
  const handleLocationSelect = (item: LocationItem) => {
    setFormData(prev => ({
      ...prev,
      [currentField]: item.code,
      [`${currentField}Name`]: item.nameKr,
    }));
    setShowLocationModal(false);
    setHasUnsavedChanges(true);
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

    if (!formData.mblNo) {
      newErrors.mblNo = 'M B/L NO는 필수 입력 항목입니다';
    }
    if (!formData.hblNo) {
      newErrors.hblNo = 'H B/L NO는 필수 입력 항목입니다';
    }
    if (!formData.portOfLoading) {
      newErrors.portOfLoading = 'Port of Loading은 필수 입력 항목입니다';
    }
    if (!formData.portOfDischarge) {
      newErrors.portOfDischarge = 'Port of Discharge는 필수 입력 항목입니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 에러 개수 계산
  const errorCount = Object.keys(errors).length;

  // 수정 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (isEditMode && hblId) {
      const fetchBLData = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/bl/import?hbl_id=${hblId}`);
          if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
              const bl = data[0];
              setFormData({
                ...initialFormData,
                mblNo: bl.mbl_no || '',
                hblNo: bl.hbl_no || '',
                shipperName: bl.shipper_nm || '',
                shipperAddress: bl.shipper_addr || '',
                consigneeName: bl.consignee_nm || '',
                consigneeAddress: bl.consignee_addr || '',
                notifyName: bl.notify_party || '',
                portOfLoading: bl.pol_port_cd || '',
                portOfLoadingName: bl.pol_port_name || '',
                portOfDischarge: bl.pod_port_cd || '',
                portOfDischargeName: bl.pod_port_name || '',
                placeOfReceipt: bl.place_of_receipt || '',
                placeOfDelivery: bl.place_of_delivery || '',
                finalDestination: bl.final_dest || '',
                carrierCode: bl.carrier_code || '',
                carrierName: bl.carrier_name || '',
                vesselName: bl.vessel_nm || '',
                voyageNo: bl.voyage_no || '',
                etd: bl.etd_dt || '',
                eta: bl.eta_dt || '',
                blIssueDate: bl.issue_dt || '',
                blIssuePlace: bl.issue_place || '',
                packageQty: bl.total_pkg_qty || 0,
                packageUnit: bl.pkg_type_cd || 'CT',
                grossWeight: parseFloat(bl.gross_weight_kg) || 0,
                measurement: parseFloat(bl.volume_cbm) || 0,
                cargoDescription: bl.commodity_desc || '',
                marksAndNumbers: bl.marks_nos || '',
                freightTerm: bl.freight_term_cd || 'PREPAID',
              });
            }
          }
        } catch (error) {
          console.error('Failed to fetch B/L data:', error);
          setMessage({ type: 'error', text: 'B/L 데이터를 불러오는데 실패했습니다.' });
        } finally {
          setIsLoading(false);
        }
      };
      fetchBLData();
    }
  }, [isEditMode, hblId]);

  // 폼 필드 변경 핸들러
  const handleChange = (field: keyof BLFormData, value: string | number | boolean) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // 업무유형이 SIMPLE일 경우 MBL과 HBL 동일하게 처리
      if (field === 'businessType' && value === 'SIMPLE') {
        updated.hblNo = updated.mblNo;
      }
      if (field === 'mblNo' && prev.businessType === 'SIMPLE') {
        updated.hblNo = value as string;
      }

      // To Order 체크 시 처리
      if (field === 'notifyToOrder' && value === true) {
        updated.notifyCode = '';
        updated.notifyName = 'To Order Of';
        updated.notifyAddress = '';
        updated.notifySameAsConsignee = false;
      }

      // Same As Consignee 체크 시 처리
      if (field === 'notifySameAsConsignee' && value === true) {
        updated.notifyCode = prev.consigneeCode;
        updated.notifyName = 'Same As Consignee';
        updated.notifyAddress = prev.consigneeAddress;
        updated.notifyToOrder = false;
      }

      // SERVICE TERM에 따른 컨테이너 규격 연동
      if (field === 'serviceTerm') {
        if (value === 'CFS/CFS' || value === 'CFS/DOOR' || value === 'DOOR/CFS') {
          updated.containerType = 'LCL';
        } else if (value === 'BULK') {
          updated.containerType = 'BULK';
        } else {
          updated.containerType = 'FCL';
        }
      }

      // FREIGHT TERM에 따른 Freight Payable At 처리
      if (field === 'freightTerm') {
        if (value === 'PREPAID') {
          updated.freightPayableAt = 'Destination';
        } else {
          updated.freightPayableAt = 'Seoul Korea';
        }
      }

      return updated;
    });
  };

  // 컨테이너 추가
  const addContainer = () => {
    const newContainer: ContainerInfo = {
      id: Date.now().toString(),
      containerNo: '',
      sealNo: '',
      containerType: '40HC',
      size: '40',
      packageQty: 0,
      packageUnit: 'CT',
      grossWeight: 0,
      measurement: 0,
    };
    setFormData(prev => ({
      ...prev,
      containers: [...prev.containers, newContainer],
    }));
  };

  // 컨테이너 삭제
  const removeContainer = (id: string) => {
    setFormData(prev => ({
      ...prev,
      containers: prev.containers.filter(c => c.id !== id),
    }));
  };

  // 컨테이너 정보 변경
  const updateContainer = (id: string, field: keyof ContainerInfo, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      containers: prev.containers.map(c =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    }));
  };

  // 기타비용 추가
  const addOtherCharge = () => {
    const newCharge: OtherCharge = {
      id: Date.now().toString(),
      code: '',
      description: '',
      currency: 'USD',
      prepaid: 0,
      collect: 0,
    };
    setFormData(prev => ({
      ...prev,
      otherCharges: [...prev.otherCharges, newCharge],
    }));
  };

  // 기타비용 삭제
  const removeOtherCharge = (id: string) => {
    setFormData(prev => ({
      ...prev,
      otherCharges: prev.otherCharges.filter(c => c.id !== id),
    }));
  };

  // 기타비용 정보 변경
  const updateOtherCharge = (id: string, field: keyof OtherCharge, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      otherCharges: prev.otherCharges.map(c =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    }));
  };

  // 폼 제출
  const handleSubmit = async () => {
    // 필수 필드 검증
    if (!validate()) {
      setMessage({ type: 'error', text: '필수 항목을 모두 입력해주세요.' });
      setActiveTab('MAIN'); // 필수 항목은 MAIN 탭에 있으므로 탭 이동
      return;
    }

    setIsSubmitting(true);
    try {
      // API 요청 데이터 구성
      const requestData = {
        importExport: formData.importExport,
        businessType: formData.businessType,
        paymentMethod: formData.paymentMethod,
        mblNo: formData.mblNo,
        hblNo: formData.hblNo,
        srNo: formData.srNo || undefined,
        bookingNo: formData.bookingNo || undefined,
        shipperCode: formData.shipperCode || undefined,
        shipperName: formData.shipperName || undefined,
        shipperAddress: formData.shipperAddress || undefined,
        consigneeCode: formData.consigneeCode || undefined,
        consigneeName: formData.consigneeName || undefined,
        consigneeAddress: formData.consigneeAddress || undefined,
        notifyCode: formData.notifyCode || undefined,
        notifyName: formData.notifyName || undefined,
        notifyAddress: formData.notifyAddress || undefined,
        forwardingAgentCode: formData.forwardingAgentCode || undefined,
        forwardingAgentName: formData.forwardingAgentName || undefined,
        placeOfReceipt: formData.placeOfReceipt || undefined,
        placeOfReceiptName: formData.placeOfReceiptName || undefined,
        portOfLoading: formData.portOfLoading,
        portOfLoadingName: formData.portOfLoadingName || undefined,
        portOfDischarge: formData.portOfDischarge,
        portOfDischargeName: formData.portOfDischargeName || undefined,
        placeOfDelivery: formData.placeOfDelivery || undefined,
        placeOfDeliveryName: formData.placeOfDeliveryName || undefined,
        finalDestination: formData.finalDestination || undefined,
        finalDestinationName: formData.finalDestinationName || undefined,
        carrierCode: formData.carrierCode || undefined,
        carrierName: formData.carrierName || undefined,
        vesselName: formData.vesselName || undefined,
        voyageNo: formData.voyageNo || undefined,
        etd: formData.etd || undefined,
        eta: formData.eta || undefined,
        serviceTerm: formData.serviceTerm || undefined,
        freightTerm: formData.freightTerm,
        freightPayableAt: formData.freightPayableAt || undefined,
        blIssueDate: formData.blIssueDate || undefined,
        blIssuePlace: formData.blIssuePlace || undefined,
        containerType: formData.containerType,
        packageQty: formData.packageQty || undefined,
        packageUnit: formData.packageUnit || undefined,
        grossWeight: formData.grossWeight || undefined,
        weightUnit: formData.weightUnit || undefined,
        measurement: formData.measurement || undefined,
        measurementUnit: formData.measurementUnit || undefined,
        cargoDescription: formData.cargoDescription || undefined,
        marksAndNumbers: formData.marksAndNumbers || undefined,
        containers: formData.containers.length > 0 ? formData.containers.map(c => ({
          containerNo: c.containerNo,
          sealNo: c.sealNo || undefined,
          containerType: c.containerType,
          size: c.size || undefined,
          packageQty: c.packageQty || undefined,
          packageUnit: c.packageUnit || undefined,
          grossWeight: c.grossWeight || undefined,
          measurement: c.measurement || undefined,
        })) : undefined,
        otherCharges: formData.otherCharges.length > 0 ? formData.otherCharges.map(c => ({
          code: c.code,
          description: c.description || undefined,
          currency: c.currency,
          prepaid: c.prepaid || undefined,
          collect: c.collect || undefined,
        })) : undefined,
        remarks: formData.remarks || undefined,
      };

      // localStorage 저장용 데이터 (목록 표시에 필요한 필드)
      const STORAGE_KEY = 'fms_import_bl_sea_data';
      const localStorageData = {
        id: Date.now().toString(),
        mblNo: formData.mblNo,
        hblNo: formData.hblNo,
        blType: 'HBL' as const,
        vesselName: formData.vesselName || '',
        voyageNo: formData.voyageNo || '',
        polCode: formData.portOfLoading,
        polName: formData.portOfLoadingName || '',
        podCode: formData.portOfDischarge,
        podName: formData.portOfDischargeName || '',
        etd: formData.etd || '',
        eta: formData.eta || '',
        atd: '',
        ata: '',
        shipper: formData.shipperName || '',
        consignee: formData.consigneeName || '',
        notifyParty: formData.notifyName || '',
        containerQty: formData.packageQty || 0,
        containerType: formData.containerType || 'FCL',
        weight: formData.grossWeight || 0,
        volume: formData.measurement || 0,
        status: 'DRAFT' as const,
        carrier: formData.carrierName || '',
      };

      let apiSuccess = false;
      let result: { hblNo?: string; jobNo?: string } = {};

      // API 호출 시도 (수정 모드면 PUT, 신규면 POST)
      try {
        const response = await fetch('/api/bl/import', {
          method: isEditMode ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(isEditMode ? { ...requestData, hblId: parseInt(hblId!) } : requestData),
        });

        result = await response.json();

        if (response.ok) {
          apiSuccess = true;
        }
      } catch (apiError) {
        console.log('API not available, saving to localStorage only');
      }

      // localStorage에 저장 (신규 등록 시에만)
      if (!isEditMode) {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          const existingData = stored ? JSON.parse(stored) : [];
          existingData.push(localStorageData);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(existingData));
        } catch (e) {
          console.error('Failed to save to localStorage:', e);
        }
      }

      setHasUnsavedChanges(false);
      setIsNewMode(false); // 저장 완료 후 신규버튼 활성화
      setMessage({
        type: 'success',
        text: isEditMode
          ? `B/L이 성공적으로 수정되었습니다. (HBL NO: ${result.hblNo || formData.hblNo})`
          : `B/L이 성공적으로 등록되었습니다. (HBL NO: ${result.jobNo || formData.hblNo})`
      });

      // 2초 후 목록 페이지로 이동
      setTimeout(() => {
        router.push(LIST_PATHS.IMPORT_BL_SEA);
      }, 2000);

    } catch (error) {
      console.error('Failed to submit B/L:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'B/L 등록에 실패했습니다. 다시 시도해주세요.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 폼 초기화
  const handleReset = () => {
    if (!confirm('입력한 내용을 모두 초기화하시겠습니까?')) return;
    setFormData(initialFormData);
    setErrors({});
    setMessage(null);
    setHasUnsavedChanges(false);
  };

  // 신규 등록
  const handleNew = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = confirm('작성 중인 내용이 저장되지 않습니다. 새로 작성하시겠습니까?');
      if (!confirmLeave) return;
    }
    window.location.href = '/logis/import-bl/sea/register';
  };

  // 테스트 데이터 입력
  const handleFillTestData = () => {
    const today = new Date().toISOString().split('T')[0];
    const etdDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const etaDate = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    setFormData({
      ...initialFormData,
      importExport: 'IN',
      businessType: 'CONSOL',
      paymentMethod: 'PREPAID',
      mblNo: 'MSKU1234567890',
      hblNo: 'HBLKR2024001234',
      shipperCode: 'SH001',
      shipperName: 'SAMSUNG ELECTRONICS CO., LTD.',
      shipperAddress: '129, Samsung-ro, Yeongtong-gu, Suwon-si, Gyeonggi-do, Korea',
      consigneeCode: 'CN001',
      consigneeName: 'SAMSUNG ELECTRONICS AMERICA, INC.',
      consigneeAddress: '85 Challenger Road, Ridgefield Park, NJ 07660, USA',
      notifyCode: 'NP001',
      notifyName: 'Same as Consignee',
      notifyAddress: '85 Challenger Road, Ridgefield Park, NJ 07660, USA',
      carrierCode: 'MAEU',
      carrierName: 'MAERSK LINE',
      vesselName: 'MAERSK EINDHOVEN',
      voyageNo: '2408E',
      portOfLoading: 'KRPUS',
      portOfLoadingName: 'BUSAN, KOREA',
      portOfDischarge: 'USLAX',
      portOfDischargeName: 'LOS ANGELES, USA',
      placeOfReceipt: 'BUSAN',
      placeOfDelivery: 'LOS ANGELES',
      finalDestination: 'LOS ANGELES',
      etd: etdDate,
      eta: etaDate,
      serviceTerm: 'CY/CY',
      freightTerm: 'PREPAID',
      freightPayableAt: 'Destination',
      blIssueDate: today,
      blIssuePlace: 'BUSAN, KOREA',
      containerType: 'FCL',
      packageQty: 200,
      packageUnit: 'CT',
      grossWeight: 15000,
      weightUnit: 'KG',
      measurement: 45,
      measurementUnit: 'CBM',
      asArranged: true,
      cargoDescription: 'SEMICONDUCTOR PRODUCTS\nHS CODE: 8542.31.0000\nMADE IN KOREA',
      marksAndNumbers: 'N/M\nCONTAINER NO. AS PER ATTACHED LIST',
      containers: [
        {
          id: '1',
          containerNo: 'MSKU1234567',
          sealNo: 'SEAL001',
          containerType: '40HC',
          size: '40',
          packageQty: 100,
          packageUnit: 'CT',
          grossWeight: 7500,
          measurement: 22.5,
        },
        {
          id: '2',
          containerNo: 'MSKU7654321',
          sealNo: 'SEAL002',
          containerType: '40HC',
          size: '40',
          packageQty: 100,
          packageUnit: 'CT',
          grossWeight: 7500,
          measurement: 22.5,
        },
      ],
      otherCharges: [],
      remarks: '테스트 데이터 - 수입 B/L 등록',
    });

    setErrors({});
    setHasUnsavedChanges(true);
    setMessage({ type: 'success', text: '테스트 데이터가 입력되었습니다.' });
    setTimeout(() => setMessage(null), 3000);
  };

  // 삭제 처리
  const handleDelete = async () => {
    if (!hblId || !confirm('정말 삭제하시겠습니까?')) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/bl/import?hbl_id=${hblId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'B/L 삭제에 실패했습니다.');
      }

      setHasUnsavedChanges(false);
      setMessage({ type: 'success', text: 'B/L이 삭제되었습니다.' });
      setTimeout(() => router.push(LIST_PATHS.IMPORT_BL_SEA), 1500);
    } catch (error) {
      console.error('Failed to delete B/L:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : '삭제 중 오류가 발생했습니다.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 탭 렌더링
  const renderTabs = () => (
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
          {tab === 'MAIN' && (
            <>
              Main Information
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500/20 text-red-400 rounded">
                필수 {REQUIRED_FIELDS.length - 1}
              </span>
            </>
          )}
          {tab === 'CARGO' && 'Cargo Information'}
          {tab === 'OTHER' && 'Other Charges'}
        </button>
      ))}
    </div>
  );

  // MAIN TAB 렌더링
  const renderMainTab = () => (
    <div className="space-y-6">
      {/* 필수 항목 안내 박스 */}
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-red-400">필수 입력 항목 (4개)</p>
            <p className="text-xs text-red-400/80 mt-1">
              M B/L NO, H B/L NO, Port of Loading, Port of Discharge는 필수 입력 항목입니다.
            </p>
          </div>
        </div>
      </div>

      {/* 기본 정보 섹션 */}
      <div className="card">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
            <span className="w-1.5 h-6 bg-[#059669] rounded-full"></span>
            기본 정보
          </h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-4 gap-4">
            {/* JOB NO */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                JOB NO
              </label>
              <input
                type="text"
                value={formData.jobNo || '(자동생성)'}
                disabled
                className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]"
              />
            </div>

            {/* 수출입구분 */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                수출입구분 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.importExport}
                onChange={(e) => handleChange('importExport', e.target.value)}
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669]"
              >
                <option value="IN">수입 (IN)</option>
                <option value="OUT">수출 (OUT)</option>
              </select>
            </div>

            {/* 업무유형 */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                업무유형
              </label>
              <select
                value={formData.businessType}
                onChange={(e) => handleChange('businessType', e.target.value)}
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669]"
              >
                <option value="CONSOL">Consol</option>
                <option value="CO-LOAD">Co-Load</option>
                <option value="SIMPLE">Simple</option>
              </select>
            </div>

            {/* 지불방법 */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                지불방법
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => handleChange('paymentMethod', e.target.value)}
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669]"
              >
                <option value="PREPAID">Prepaid</option>
                <option value="COLLECT">Collect</option>
              </select>
            </div>

            {/* M B/L NO */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                M B/L NO <RequiredBadge />
              </label>
              <input
                type="text"
                value={formData.mblNo}
                onChange={(e) => handleChange('mblNo', e.target.value)}
                placeholder="MBL 번호 입력"
                className={`w-full h-[38px] px-3 bg-[var(--surface-50)] border rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669] ${
                  errors.mblNo ? 'border-red-500' : 'border-[var(--border)]'
                }`}
              />
              <FieldError field="mblNo" />
            </div>

            {/* H B/L NO */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                H B/L NO <RequiredBadge />
              </label>
              <input
                type="text"
                value={formData.hblNo}
                onChange={(e) => handleChange('hblNo', e.target.value)}
                placeholder="HBL 번호 입력"
                disabled={formData.businessType === 'SIMPLE'}
                className={`w-full h-[38px] px-3 bg-[var(--surface-50)] border rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669] disabled:bg-[var(--surface-100)] disabled:text-[var(--muted)] ${
                  errors.hblNo ? 'border-red-500' : 'border-[var(--border)]'
                }`}
              />
              <FieldError field="hblNo" />
            </div>

            {/* S/R NO */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                S/R NO
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.srNo}
                  onChange={(e) => handleChange('srNo', e.target.value)}
                  placeholder="S/R 번호"
                  className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669]"
                />
                <button className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </button>
              </div>
            </div>

            {/* BOOKING NO */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                BOOKING NO
              </label>
              <input
                type="text"
                value={formData.bookingNo}
                disabled
                placeholder="(부킹 조회 시 자동입력)"
                className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 당사자 정보 섹션 */}
      <div className="card">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
            <span className="w-1.5 h-6 bg-[#7C3AED] rounded-full"></span>
            당사자 정보
          </h3>
        </div>
        <div className="p-4 space-y-4">
          {/* SHIPPER */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                SHIPPER
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.shipperCode}
                  onChange={(e) => handleChange('shipperCode', e.target.value)}
                  placeholder="코드"
                  className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669]"
                />
                <button
                  onClick={() => handleCodeSearch('shipper', 'customer')}
                  className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="col-span-4">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                영문상호
              </label>
              <input
                type="text"
                value={formData.shipperName}
                onChange={(e) => handleChange('shipperName', e.target.value)}
                placeholder="영문 상호명"
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669]"
              />
            </div>
            <div className="col-span-6">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                영문주소
              </label>
              <textarea
                value={formData.shipperAddress}
                onChange={(e) => handleChange('shipperAddress', e.target.value)}
                placeholder="영문 주소"
                rows={2}
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669] resize-none"
              />
            </div>
          </div>

          {/* CONSIGNEE */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                CONSIGNEE
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.consigneeCode}
                  onChange={(e) => handleChange('consigneeCode', e.target.value)}
                  placeholder="코드"
                  className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669]"
                />
                <button
                  onClick={() => handleCodeSearch('consignee', 'customer')}
                  className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="col-span-4">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                영문상호
              </label>
              <input
                type="text"
                value={formData.consigneeName}
                onChange={(e) => handleChange('consigneeName', e.target.value)}
                placeholder="영문 상호명"
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669]"
              />
            </div>
            <div className="col-span-6">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                영문주소
              </label>
              <textarea
                value={formData.consigneeAddress}
                onChange={(e) => handleChange('consigneeAddress', e.target.value)}
                placeholder="영문 주소"
                rows={2}
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669] resize-none"
              />
            </div>
          </div>

          {/* NOTIFY PARTY */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                NOTIFY PARTY
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.notifyCode}
                  onChange={(e) => handleChange('notifyCode', e.target.value)}
                  placeholder="코드"
                  disabled={formData.notifyToOrder || formData.notifySameAsConsignee}
                  className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669] disabled:bg-[var(--surface-100)]"
                />
                <button
                  onClick={() => handleCodeSearch('notify', 'customer')}
                  disabled={formData.notifyToOrder || formData.notifySameAsConsignee}
                  className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={formData.notifyToOrder}
                    onChange={(e) => handleChange('notifyToOrder', e.target.checked)}
                    className="rounded"
                  />
                  To Order
                </label>
                <label className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={formData.notifySameAsConsignee}
                    onChange={(e) => handleChange('notifySameAsConsignee', e.target.checked)}
                    className="rounded"
                  />
                  Same As
                </label>
              </div>
            </div>
            <div className="col-span-4">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                영문상호
              </label>
              <input
                type="text"
                value={formData.notifyName}
                onChange={(e) => handleChange('notifyName', e.target.value)}
                placeholder="영문 상호명"
                disabled={formData.notifyToOrder || formData.notifySameAsConsignee}
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669] disabled:bg-[var(--surface-100)]"
              />
            </div>
            <div className="col-span-6">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                영문주소
              </label>
              <textarea
                value={formData.notifyAddress}
                onChange={(e) => handleChange('notifyAddress', e.target.value)}
                placeholder="영문 주소"
                rows={2}
                disabled={formData.notifyToOrder || formData.notifySameAsConsignee}
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669] resize-none disabled:bg-[var(--surface-100)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 운송 정보 섹션 */}
      <div className="card">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
            <span className="w-1.5 h-6 bg-[#E8A838] rounded-full"></span>
            운송 정보
          </h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-4 gap-4">
            {/* Place of Receipt */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Place of Receipt
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.placeOfReceipt}
                  onChange={(e) => handleChange('placeOfReceipt', e.target.value)}
                  placeholder="항구코드"
                  className="w-24 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669]"
                />
                <input
                  type="text"
                  value={formData.placeOfReceiptName}
                  onChange={(e) => handleChange('placeOfReceiptName', e.target.value)}
                  placeholder="항구명"
                  className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669]"
                />
                <button
                  onClick={() => handleLocationSearch('placeOfReceipt', 'seaport')}
                  className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Port of Loading */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Port of Loading <RequiredBadge />
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.portOfLoading}
                  onChange={(e) => handleChange('portOfLoading', e.target.value)}
                  placeholder="항구코드"
                  className={`w-24 h-[38px] px-3 bg-[var(--surface-50)] border rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669] ${
                    errors.portOfLoading ? 'border-red-500' : 'border-[var(--border)]'
                  }`}
                />
                <input
                  type="text"
                  value={formData.portOfLoadingName}
                  onChange={(e) => handleChange('portOfLoadingName', e.target.value)}
                  placeholder="항구명"
                  className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669]"
                />
                <button
                  onClick={() => handleLocationSearch('portOfLoading', 'seaport')}
                  className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
              <FieldError field="portOfLoading" />
            </div>

            {/* Port of Discharge */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Port of Discharge <RequiredBadge />
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.portOfDischarge}
                  onChange={(e) => handleChange('portOfDischarge', e.target.value)}
                  placeholder="항구코드"
                  className={`w-24 h-[38px] px-3 bg-[var(--surface-50)] border rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669] ${
                    errors.portOfDischarge ? 'border-red-500' : 'border-[var(--border)]'
                  }`}
                />
                <input
                  type="text"
                  value={formData.portOfDischargeName}
                  onChange={(e) => handleChange('portOfDischargeName', e.target.value)}
                  placeholder="항구명"
                  className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669]"
                />
                <button
                  onClick={() => handleLocationSearch('portOfDischarge', 'seaport')}
                  className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
              <FieldError field="portOfDischarge" />
            </div>

            {/* Place of Delivery */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Place of Delivery
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.placeOfDelivery}
                  onChange={(e) => handleChange('placeOfDelivery', e.target.value)}
                  placeholder="항구코드"
                  className="w-24 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669]"
                />
                <input
                  type="text"
                  value={formData.placeOfDeliveryName}
                  onChange={(e) => handleChange('placeOfDeliveryName', e.target.value)}
                  placeholder="항구명"
                  className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669]"
                />
                <button
                  onClick={() => handleLocationSearch('placeOfDelivery', 'seaport')}
                  className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Final Destination */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Final Destination
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.finalDestination}
                  onChange={(e) => handleChange('finalDestination', e.target.value)}
                  placeholder="항구코드"
                  className="w-24 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669]"
                />
                <input
                  type="text"
                  value={formData.finalDestinationName}
                  onChange={(e) => handleChange('finalDestinationName', e.target.value)}
                  placeholder="항구명"
                  className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669]"
                />
                <button
                  onClick={() => handleLocationSearch('finalDestination', 'seaport')}
                  className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 선사 (Carrier) */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                선사 (LINE)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.carrierCode}
                  onChange={(e) => handleChange('carrierCode', e.target.value)}
                  placeholder="코드"
                  className="w-24 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669]"
                />
                <input
                  type="text"
                  value={formData.carrierName}
                  onChange={(e) => handleChange('carrierName', e.target.value)}
                  placeholder="선사명"
                  className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669]"
                />
                <button
                  onClick={() => handleCodeSearch('carrier', 'carrier')}
                  className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Vessel / Voyage */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                선명 / 항차
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.vesselName}
                  onChange={(e) => handleChange('vesselName', e.target.value)}
                  placeholder="선명"
                  className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669]"
                />
                <input
                  type="text"
                  value={formData.voyageNo}
                  onChange={(e) => handleChange('voyageNo', e.target.value)}
                  placeholder="항차"
                  className="w-24 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669]"
                />
              </div>
            </div>

            {/* Service Term */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                SERVICE TERM
              </label>
              <select
                value={formData.serviceTerm}
                onChange={(e) => handleChange('serviceTerm', e.target.value)}
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669]"
              >
                {serviceTermOptions.map(term => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </select>
            </div>

            {/* ETD */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                ETD
              </label>
              <input
                type="date"
                value={formData.etd}
                onChange={(e) => handleChange('etd', e.target.value)}
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669]"
              />
            </div>

            {/* ETA */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                ETA
              </label>
              <input
                type="date"
                value={formData.eta}
                onChange={(e) => handleChange('eta', e.target.value)}
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669]"
              />
            </div>

            {/* Freight Term */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                FREIGHT TERM
              </label>
              <select
                value={formData.freightTerm}
                onChange={(e) => handleChange('freightTerm', e.target.value)}
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669]"
              >
                <option value="PREPAID">Prepaid</option>
                <option value="COLLECT">Collect</option>
              </select>
            </div>

            {/* Freight Payable At */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Freight Payable At
              </label>
              <input
                type="text"
                value={formData.freightPayableAt}
                onChange={(e) => handleChange('freightPayableAt', e.target.value)}
                placeholder="지불장소"
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669]"
              />
            </div>

            {/* B/L Issue Date */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                B/L 발행일
              </label>
              <input
                type="date"
                value={formData.blIssueDate}
                onChange={(e) => handleChange('blIssueDate', e.target.value)}
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669]"
              />
            </div>

            {/* B/L Issue Place */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                B/L 발행지
              </label>
              <input
                type="text"
                value={formData.blIssuePlace}
                onChange={(e) => handleChange('blIssuePlace', e.target.value)}
                placeholder="발행 장소"
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // CARGO TAB 렌더링
  const renderCargoTab = () => (
    <div className="space-y-6">
      {/* 화물 기본 정보 */}
      <div className="card">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
            <span className="w-1.5 h-6 bg-[#059669] rounded-full"></span>
            화물 기본 정보
          </h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-6 gap-4">
            {/* 컨테이너 규격 */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                컨테이너 규격
              </label>
              <div className="flex gap-4">
                {(['LCL', 'FCL', 'BULK'] as const).map(type => (
                  <label key={type} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="containerType"
                      value={type}
                      checked={formData.containerType === type}
                      onChange={(e) => handleChange('containerType', e.target.value)}
                      className="w-4 h-4 text-[#059669]"
                    />
                    <span className="text-sm">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Package */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Package
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={formData.packageQty || ''}
                  onChange={(e) => handleChange('packageQty', parseInt(e.target.value) || 0)}
                  placeholder="수량"
                  className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669]"
                />
                <select
                  value={formData.packageUnit}
                  onChange={(e) => handleChange('packageUnit', e.target.value)}
                  className="w-24 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669]"
                >
                  {packageUnitOptions.map(opt => (
                    <option key={opt.code} value={opt.code}>{opt.code}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Gross Weight */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Gross Weight
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={formData.grossWeight || ''}
                  onChange={(e) => handleChange('grossWeight', parseFloat(e.target.value) || 0)}
                  placeholder="중량"
                  className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669]"
                />
                <select
                  value={formData.weightUnit}
                  onChange={(e) => handleChange('weightUnit', e.target.value)}
                  className="w-20 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669]"
                >
                  <option value="KG">KG</option>
                  <option value="LB">LB</option>
                </select>
              </div>
            </div>

            {/* Measurement */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Measurement
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={formData.measurement || ''}
                  onChange={(e) => handleChange('measurement', parseFloat(e.target.value) || 0)}
                  placeholder="용적"
                  className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669]"
                />
                <select
                  value={formData.measurementUnit}
                  onChange={(e) => handleChange('measurementUnit', e.target.value)}
                  className="w-20 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669]"
                >
                  <option value="CBM">CBM</option>
                  <option value="CFT">CFT</option>
                </select>
                <button
                  type="button"
                  onClick={() => setShowDimensionsCalculator(true)}
                  className="h-[38px] px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm whitespace-nowrap"
                >
                  계산
                </button>
              </div>
            </div>

            {/* As Arranged */}
            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.asArranged}
                  onChange={(e) => handleChange('asArranged', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">As Arranged</span>
              </label>
            </div>
          </div>

          {/* Description Box */}
          <div className="mt-4 p-4 bg-[var(--surface-50)] rounded-lg border border-[var(--border)]">
            <div className="text-sm text-[var(--foreground)] font-mono">
              {formData.containerType === 'LCL' && 'SAID TO CONTAIN'}
              {formData.containerType === 'FCL' && "SHIPPER'S LOAD & COUNT\nSAID TO CONTAIN"}
              {formData.containerType === 'BULK' && 'SAID TO BE'}
              {formData.packageQty > 0 && (
                <>
                  <br />
                  {formData.packageQty} {packageUnitOptions.find(p => p.code === formData.packageUnit)?.label?.toUpperCase() || formData.packageUnit}S
                </>
              )}
              <br />
              {formData.freightTerm === 'PREPAID' ? 'FREIGHT PREPAID' : 'FREIGHT COLLECT'}
            </div>
          </div>
        </div>
      </div>

      {/* Marks & Numbers / Description */}
      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#7C3AED] rounded-full"></span>
              Marks & Numbers
            </h3>
          </div>
          <div className="p-4">
            <textarea
              value={formData.marksAndNumbers}
              onChange={(e) => handleChange('marksAndNumbers', e.target.value)}
              placeholder="화인 및 번호 입력"
              rows={6}
              className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669] resize-none font-mono"
            />
          </div>
        </div>

        <div className="card">
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#E8A838] rounded-full"></span>
              Description of Goods
            </h3>
          </div>
          <div className="p-4">
            <textarea
              value={formData.cargoDescription}
              onChange={(e) => handleChange('cargoDescription', e.target.value)}
              placeholder="화물 상세 설명 입력"
              rows={6}
              className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669] resize-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* 컨테이너 정보 (FCL/BULK일 경우) */}
      {(formData.containerType === 'FCL' || formData.containerType === 'BULK') && (
        <div className="card">
          <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
            <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#2563EB] rounded-full"></span>
              Container Information
            </h3>
            <button
              onClick={addContainer}
              className="px-4 py-2 bg-[#E8A838] text-[#0C1222] font-semibold rounded-lg hover:bg-[#D4943A] transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              컨테이너 추가
            </button>
          </div>
          <div className="p-4">
            {formData.containers.length === 0 ? (
              <div className="text-center py-8 text-[var(--muted)]">
                컨테이너 정보를 추가하세요.
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Container No</th>
                    <th>Seal No</th>
                    <th>Type</th>
                    <th>Package</th>
                    <th>G.Weight</th>
                    <th>Measurement</th>
                    <th className="text-center">삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.containers.map((container, index) => (
                    <tr key={container.id} className="border-t border-[var(--border)]">
                      <td className="p-3 text-sm">{index + 1}</td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={container.containerNo}
                          onChange={(e) => updateContainer(container.id, 'containerNo', e.target.value)}
                          placeholder="CNTR NO"
                          className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={container.sealNo}
                          onChange={(e) => updateContainer(container.id, 'sealNo', e.target.value)}
                          placeholder="SEAL NO"
                          className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                        />
                      </td>
                      <td className="p-3">
                        <select
                          value={container.containerType}
                          onChange={(e) => updateContainer(container.id, 'containerType', e.target.value)}
                          className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                        >
                          {containerTypeOptions.map(opt => (
                            <option key={opt.code} value={opt.code}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={container.packageQty || ''}
                          onChange={(e) => updateContainer(container.id, 'packageQty', parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={container.grossWeight || ''}
                          onChange={(e) => updateContainer(container.id, 'grossWeight', parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          step="0.01"
                          value={container.measurement || ''}
                          onChange={(e) => updateContainer(container.id, 'measurement', parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => removeContainer(container.id)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // OTHER TAB 렌더링
  const renderOtherTab = () => (
    <div className="space-y-6">
      {/* Other Charges */}
      <div className="card">
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
          <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
            <span className="w-1.5 h-6 bg-[#059669] rounded-full"></span>
            Other Charges
          </h3>
          <button
            onClick={addOtherCharge}
            className="px-4 py-2 bg-[#E8A838] text-[#0C1222] font-semibold rounded-lg hover:bg-[#D4943A] transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            비용 추가
          </button>
        </div>
        <div className="p-4">
          {formData.otherCharges.length === 0 ? (
            <div className="text-center py-8 text-[var(--muted)]">
              기타 비용을 추가하세요.
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>CODE</th>
                  <th>Charges</th>
                  <th>Currency</th>
                  <th className="text-center">Prepaid</th>
                  <th className="text-center">Collect</th>
                  <th className="text-center">삭제</th>
                </tr>
              </thead>
              <tbody>
                {formData.otherCharges.map((charge) => (
                  <tr key={charge.id} className="border-t border-[var(--border)]">
                    <td className="p-3">
                      <input
                        type="text"
                        value={charge.code}
                        onChange={(e) => updateOtherCharge(charge.id, 'code', e.target.value)}
                        placeholder="코드"
                        className="w-24 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={charge.description}
                        onChange={(e) => updateOtherCharge(charge.id, 'description', e.target.value)}
                        placeholder="비용명"
                        className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                      />
                    </td>
                    <td className="p-3">
                      <select
                        value={charge.currency}
                        onChange={(e) => updateOtherCharge(charge.id, 'currency', e.target.value)}
                        className="w-20 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"
                      >
                        <option value="USD">USD</option>
                        <option value="KRW">KRW</option>
                        <option value="EUR">EUR</option>
                        <option value="JPY">JPY</option>
                        <option value="CNY">CNY</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        value={charge.prepaid || ''}
                        onChange={(e) => updateOtherCharge(charge.id, 'prepaid', parseFloat(e.target.value) || 0)}
                        className="w-28 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-center"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        value={charge.collect || ''}
                        onChange={(e) => updateOtherCharge(charge.id, 'collect', parseFloat(e.target.value) || 0)}
                        className="w-28 px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-center"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => removeOtherCharge(charge.id)}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-[var(--surface-50)]">
                <tr className="border-t-2 border-[var(--border)]">
                  <td colSpan={3} className="p-3 text-center font-bold">Total</td>
                  <td className="p-3 text-center font-bold">
                    {formatCurrency(formData.otherCharges.reduce((sum, c) => sum + c.prepaid, 0))}
                  </td>
                  <td className="p-3 text-center font-bold">
                    {formatCurrency(formData.otherCharges.reduce((sum, c) => sum + c.collect, 0))}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>

      {/* Remarks */}
      <div className="card">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
            <span className="w-1.5 h-6 bg-[#7C3AED] rounded-full"></span>
            Remarks
          </h3>
        </div>
        <div className="p-4">
          <textarea
            value={formData.remarks}
            onChange={(e) => handleChange('remarks', e.target.value)}
            placeholder="비고 사항 입력"
            rows={4}
            className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#059669] resize-none"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header
        title={isEditMode ? "수입 B/L 수정 (해상)" : "수입 B/L 등록 (해상)"}
        subtitle={`수입 B/L관리 
        onClose={() => setShowCloseModal(true)}> B/L관리 (해상) > ${isEditMode ? '수정' : '등록'}`}
      />

      <main ref={formRef} className="p-6">
          {/* 상단 버튼 영역 */}
          <div className="sticky top-20 z-20 bg-white py-2 border-b border-gray-200 flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <button
                onClick={handleGoList}
                className="flex items-center gap-2 text-[var(--foreground)] hover:text-[#E8A838] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                목록으로
              </button>
              {/* 에러 카운트 표시 */}
              {errorCount > 0 && (
                <div className="flex items-center gap-2 text-red-400 ml-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-sm font-medium">{errorCount}개의 필수 항목이 입력되지 않았습니다</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* 신규 버튼 */}
              <button
                onClick={handleNew}
                disabled={isNewMode}
                className={`px-4 py-2 font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                  isNewMode
                    ? 'bg-[var(--surface-200)] text-[var(--muted)] cursor-not-allowed'
                    : 'bg-[var(--surface-100)] text-[var(--foreground)] hover:bg-[var(--surface-200)]'
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
                className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)] transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                초기화
              </button>

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
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#E8A838] text-[#0C1222] font-semibold rounded-lg hover:bg-[#D4943A] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {isEditMode ? '수정중...' : '저장중...'}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {isEditMode ? '수정' : '저장'}
                  </>
                )}
              </button>

              {/* 삭제 버튼 (수정 모드에서만) */}
              {isEditMode && (
                <button
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  삭제
                </button>
              )}

              {/* 취소 버튼 */}
              <button
                onClick={handleGoList}
                disabled={isSubmitting}
                className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                취소
              </button>
            </div>
          </div>

          {/* 메시지 표시 */}
          {message && (
            <div className={`mb-4 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* 로딩 표시 */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="flex flex-col items-center gap-4">
                <svg className="w-10 h-10 animate-spin text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <p className="text-[var(--muted)]">B/L 데이터를 불러오는 중...</p>
              </div>
            </div>
          ) : (
            <>
              {/* 탭 */}
              {renderTabs()}

              {/* 탭 컨텐츠 */}
              {activeTab === 'MAIN' && renderMainTab()}
              {activeTab === 'CARGO' && renderCargoTab()}
              {activeTab === 'OTHER' && renderOtherTab()}
            </>
          )}
        </main>
      {/* 스케줄조회 모달 */}
      <ScheduleSearchModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSelect={handleScheduleSelect}
        type="sea"
        defaultOrigin={formData.portOfLoading}
        defaultDestination={formData.portOfDischarge}
      />

      {/* 운임조회 모달 */}
      <FreightSearchModal
        isOpen={showFreightModal}
        onClose={() => setShowFreightModal(false)}
        onSelect={handleFreightSelect}
        type="sea"
        defaultOrigin={formData.portOfLoading}
        defaultDestination={formData.portOfDischarge}
      />

      {/* 이메일 모달 */}
      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSend={handleEmailSend}
        documentType="bl"
        documentNo={formData.hblNo || '자동생성'}
      />

      {/* Dimensions 계산 모달 */}
      <DimensionsCalculatorModal
        isOpen={showDimensionsCalculator}
        onClose={() => setShowDimensionsCalculator(false)}
        onApply={(totalCbm) => {
          handleChange('measurement', totalCbm);
          handleChange('measurementUnit', 'CBM');
        }}
      />

      {/* 저장 확인 모달 */}
      <UnsavedChangesModal
        isOpen={showCloseModal}
        onClose={handleModalClose}
        onDiscard={handleDiscardChanges}
        onSave={handleSubmit}
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

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <svg className="w-10 h-10 animate-spin text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <p className="text-[var(--muted)]">로딩 중...</p>
      </div>
    </div>
  );
}

export default function ImportBLRegisterPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ImportBLRegisterPageContent />
    </Suspense>
  );
}
