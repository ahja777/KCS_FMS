'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import ScheduleSearchModal from '@/components/ScheduleSearchModal';
import EmailModal from '@/components/EmailModal';
import { UnsavedChangesModal } from '@/components/UnsavedChangesModal';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useScreenClose } from '@/hooks/useScreenClose';
import { LIST_PATHS } from '@/constants/paths';
import {
  CodeSearchModal,
  type CodeItem,
} from '@/components/popup';
import SearchIconButton from '@/components/SearchIconButton';

// 화면설계서 기준 인터페이스
interface BookingFormData {
  // 기본정보 (화면설계서 기준)
  jobNo: string;                    // Job No*
  regDate: string;                  // 등록일자*
  inputUser: string;                // 입력사원
  bookingStatus: string;            // 부킹상태
  bookingRequestDate: string;       // 부킹요청일자
  bookingConfirmDate: string;       // 부킹확정일자
  forwarderCode: string;            // 포워더코드*
  carrierCode: string;              // 선사코드
  bookingNo: string;                // Booking No

  // Schedule (화면설계서 기준)
  vesselVoyage: string;             // 선명/항차
  partnerVoyage: string;            // Partner's Voyage
  por: string;                      // POR (선적지)
  porName: string;                  // POR 이름
  pol: string;                      // POL (선적항)*
  polName: string;                  // POL 이름
  pod: string;                      // POD (양하항)*
  podName: string;                  // POD 이름
  pvy: string;                      // PVY (인도지)
  pvyName: string;                  // PVY 이름
  etd: string;                      // ETD
  eta: string;                      // ETA
  blType: string;                   // B/L TYPE

  // 송수하인 정보 (화면설계서 기준)
  customerCode: string;             // 거래처*
  actualCustomerName: string;       // 실거래처명*
  bizNo: string;                    // 사업자번호
  bookingManager: string;           // Booking 담당자
  containerManager: string;         // 컨테이너 반입 담당자
  notifyCode: string;               // Notify 코드
  notify: string;                   // Notify
  consigneeCode: string;            // Consignee 코드
  consignee: string;                // Consignee

  // Cargo Information (화면설계서 기준)
  contractHolder: string;           // Contract Holder*
  serviceTerm: string;              // Service Term*
  bookingShipper: string;           // Booking Shipper*
  commodity: string;                // Commodity*
  serviceContractNo: string;        // Service Contract No
  bookingOffice: string;            // Booking Office
  namedCustomer: string;            // Named Customer*
  specialHandlingCode: string;      // Special Handing Code
  grossWeight: number;              // Gross Weight(KGS)*

  // Container Pick up Information (화면설계서 기준)
  pickup: string;                   // Pick up*
  transportManager: string;         // 운송담당자
  transportCompany: string;         // 운송사
  transportTel: string;             // 운송 Tel
  pickupDate: string;               // Pick Up 일자
  remark: string;                   // Remark
}

// 부킹상태 설정 (화면설계서 기준)
const statusOptions = [
  { value: 'DRAFT', label: '작성중' },
  { value: 'REQUEST', label: '부킹요청' },
  { value: 'CONFIRM', label: '부킹확정' },
  { value: 'CANCEL', label: '부킹취소' },
];

const initialFormData: BookingFormData = {
  // 기본정보
  jobNo: '',
  regDate: new Date().toISOString().split('T')[0],
  inputUser: '',
  bookingStatus: 'DRAFT',
  bookingRequestDate: '',
  bookingConfirmDate: '',
  forwarderCode: '',
  carrierCode: '',
  bookingNo: '',

  // Schedule
  vesselVoyage: '',
  partnerVoyage: '',
  por: '',
  porName: '',
  pol: '',
  polName: '',
  pod: '',
  podName: '',
  pvy: '',
  pvyName: '',
  etd: '',
  eta: '',
  blType: 'ORIGINAL',

  // 송수하인 정보
  customerCode: '',
  actualCustomerName: '',
  bizNo: '',
  bookingManager: '',
  containerManager: '',
  notifyCode: '',
  notify: '',
  consigneeCode: '',
  consignee: '',

  // Cargo Information
  contractHolder: '',
  serviceTerm: 'CY-CY',
  bookingShipper: '',
  commodity: '',
  serviceContractNo: '',
  bookingOffice: '',
  namedCustomer: '',
  specialHandlingCode: '',
  grossWeight: 0,

  // Container Pick up Information
  pickup: '',
  transportManager: '',
  transportCompany: '',
  transportTel: '',
  pickupDate: '',
  remark: '',
};

function BookingSeaRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });
  const [formData, setFormData] = useState<BookingFormData>(initialFormData);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isNewMode, setIsNewMode] = useState(!editId);

  // 화면닫기 통합 훅
  const {
    showModal: showCloseModal,
    handleCloseClick,
    handleModalClose,
    handleDiscard: handleDiscardChanges,
  } = useScreenClose({
    hasChanges: hasUnsavedChanges,
    listPath: LIST_PATHS.BOOKING_SEA,
  });

  // 팝업 상태
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showForwarderModal, setShowForwarderModal] = useState(false);
  const [showCarrierModal, setShowCarrierModal] = useState(false);
  const [showSeaportModal, setShowSeaportModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showConsigneeModal, setShowConsigneeModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [showTransportModal, setShowTransportModal] = useState(false);
  const [currentPortField, setCurrentPortField] = useState<'por' | 'pol' | 'pod' | 'pvy'>('pol');

  // 수정 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (!editId) return;
    const fetchBookingData = async () => {
      try {
        const response = await fetch(`/api/booking/sea?bookingId=${editId}`);
        if (!response.ok) throw new Error('데이터 조회 실패');
        const data = await response.json();

        const vesselVoyage = [data.vesselName, data.voyageNo].filter(Boolean).join(' / ');

        setFormData({
          // 기본정보
          jobNo: data.bookingNo || '',
          regDate: data.createdAt ? data.createdAt.substring(0, 10) : new Date().toISOString().split('T')[0],
          inputUser: '',
          bookingStatus: data.status || 'DRAFT',
          bookingRequestDate: '',
          bookingConfirmDate: '',
          forwarderCode: '',
          carrierCode: data.carrierId || '',
          bookingNo: data.bookingNo || '',

          // Schedule
          vesselVoyage,
          partnerVoyage: '',
          por: '',
          pol: data.pol || '',
          pod: data.pod || '',
          pvy: '',
          etd: data.etd || '',
          eta: data.eta || '',
          blType: 'ORIGINAL',

          // 송수하인 정보
          customerCode: '',
          actualCustomerName: '',
          bizNo: '',
          bookingManager: '',
          containerManager: '',
          notify: '',
          consignee: '',

          // Cargo Information
          contractHolder: '',
          serviceTerm: 'CY-CY',
          bookingShipper: '',
          commodity: data.commodityDesc || '',
          serviceContractNo: '',
          bookingOffice: '',
          namedCustomer: '',
          specialHandlingCode: '',
          grossWeight: parseFloat(data.grossWeight) || 0,

          // Container Pick up Information
          pickup: '',
          transportManager: '',
          transportCompany: '',
          transportTel: '',
          pickupDate: '',
          remark: data.remark || '',
        });
        setIsNewMode(false);
      } catch (error) {
        console.error('데이터 로드 실패:', error);
        alert('데이터를 불러오는 데 실패했습니다.');
      }
    };
    fetchBookingData();
  }, [editId]);

  // 거래처 선택
  const handleCustomerSelect = (item: CodeItem) => {
    setFormData(prev => ({
      ...prev,
      customerCode: item.code,
      actualCustomerName: item.name,
    }));
    setShowCustomerModal(false);
  };

  // 포워더 선택
  const handleForwarderSelect = (item: CodeItem) => {
    setFormData(prev => ({
      ...prev,
      forwarderCode: item.code,
    }));
    setShowForwarderModal(false);
  };

  // 선사 선택
  const handleCarrierSelect = (item: CodeItem) => {
    setFormData(prev => ({
      ...prev,
      carrierCode: item.code,
    }));
    setShowCarrierModal(false);
  };

  // 항구 검색
  const handleSeaportSearch = (field: 'por' | 'pol' | 'pod' | 'pvy') => {
    setCurrentPortField(field);
    setShowSeaportModal(true);
  };

  const handleSeaportSelect = (item: CodeItem) => {
    setFormData(prev => ({
      ...prev,
      [currentPortField]: item.code,
    }));
    setShowSeaportModal(false);
  };

  // 입력사원 선택
  const handleStaffSelect = (item: CodeItem) => {
    setFormData(prev => ({ ...prev, inputUser: item.name }));
    setShowStaffModal(false);
  };

  // Consignee 선택
  const handleConsigneeSelect = (item: CodeItem) => {
    setFormData(prev => ({ ...prev, consignee: item.name }));
    setShowConsigneeModal(false);
  };

  // Notify 선택
  const handleNotifySelect = (item: CodeItem) => {
    setFormData(prev => ({ ...prev, notify: item.name }));
    setShowNotifyModal(false);
  };

  // 운송사 선택
  const handleTransportSelect = (item: CodeItem) => {
    setFormData(prev => ({ ...prev, transportCompany: item.name }));
    setShowTransportModal(false);
  };

  // 폼 변경 감지
  useEffect(() => {
    const hasChanges = formData.customerCode !== '' ||
                       formData.vesselVoyage !== '' ||
                       formData.pol !== '' ||
                       formData.pod !== '';
    setHasUnsavedChanges(hasChanges);
  }, [formData]);

  const handleInputChange = (field: keyof BookingFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleScheduleSelect = (schedule: any) => {
    setFormData(prev => ({
      ...prev,
      vesselVoyage: `${schedule.vesselName || schedule.vessel} / ${schedule.voyage || schedule.vesselVoyage}`,
      carrierCode: schedule.carrier || schedule.carrierId,
      pol: schedule.pol,
      pod: schedule.pod,
      etd: schedule.etd,
      eta: schedule.eta,
    }));
    setShowScheduleModal(false);
  };

  const handleSave = async () => {
    // 필수값 검증 (화면설계서 기준 * 표시 필드)
    if (!formData.customerCode) {
      alert('거래처를 선택해주세요.');
      return;
    }
    if (!formData.actualCustomerName) {
      alert('실거래처명을 입력해주세요.');
      return;
    }
    if (!formData.forwarderCode) {
      alert('포워더코드를 선택해주세요.');
      return;
    }
    if (!formData.pol) {
      alert('선적항(POL)을 선택해주세요.');
      return;
    }
    if (!formData.pod) {
      alert('양하항(POD)을 선택해주세요.');
      return;
    }
    if (!formData.contractHolder) {
      alert('Contract Holder를 입력해주세요.');
      return;
    }
    if (!formData.serviceTerm) {
      alert('Service Term을 선택해주세요.');
      return;
    }
    if (!formData.bookingShipper) {
      alert('Booking Shipper를 입력해주세요.');
      return;
    }
    if (!formData.commodity) {
      alert('Commodity를 입력해주세요.');
      return;
    }
    if (!formData.namedCustomer) {
      alert('Named Customer를 입력해주세요.');
      return;
    }
    if (!formData.grossWeight || formData.grossWeight <= 0) {
      alert('Gross Weight를 입력해주세요.');
      return;
    }
    if (!formData.pickup) {
      alert('Pick up 정보를 입력해주세요.');
      return;
    }

    setIsSaving(true);

    try {
      const [vesselName, voyageNo] = formData.vesselVoyage.split(' / ');
      const isEditMode = !!editId && !isNewMode;

      const response = await fetch('/api/booking/sea', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isEditMode ? { id: editId } : {}),
          // 스케줄 정보
          vesselName: vesselName || '',
          voyageNo: voyageNo || '',
          pol: formData.pol,
          pod: formData.pod,
          etd: formData.etd || null,
          eta: formData.eta || null,
          // 거래처 정보
          shipperCode: formData.customerCode,
          shipperName: formData.actualCustomerName,
          // Cargo 정보
          commodityDesc: formData.commodity,
          grossWeight: formData.grossWeight,
          // Container Pick up 정보
          pickupLocation: formData.pickup,
          pickupTransporter: formData.transportManager,
          pickupTransportCompany: formData.transportCompany,
          pickupDate: formData.pickupDate || null,
          // 상태 및 비고
          status: formData.bookingStatus,
          remark: formData.remark,
          // PUT에서 사용하는 필드
          carrierId: formData.carrierCode || null,
        }),
      });

      if (!response.ok) {
        throw new Error('저장 실패');
      }

      const result = await response.json();
      setHasUnsavedChanges(false);
      setIsNewMode(false);
      if (!isEditMode) {
        setFormData(prev => ({
          ...prev,
          jobNo: result.bookingNo,
          bookingNo: result.bookingNo,
        }));
      }
      alert(isEditMode ? '부킹이 수정되었습니다.' : `부킹이 저장되었습니다.\nBooking No: ${result.bookingNo}`);
    } catch (error) {
      console.error('Save error:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 부킹요청 처리
  const handleBookingRequest = async () => {
    setFormData(prev => ({
      ...prev,
      bookingStatus: 'REQUEST',
      bookingRequestDate: new Date().toISOString().split('T')[0],
    }));
    await handleSave();
    alert('부킹요청이 완료되었습니다.');
  };

  // 부킹확정 처리
  const handleBookingConfirm = () => {
    setFormData(prev => ({
      ...prev,
      bookingStatus: 'CONFIRM',
      bookingConfirmDate: new Date().toISOString().split('T')[0],
    }));
    alert('부킹이 확정되었습니다.');
  };

  // 부킹취소 처리
  const handleBookingCancel = () => {
    if (!confirm('부킹을 취소하시겠습니까?')) return;
    setFormData(prev => ({
      ...prev,
      bookingStatus: 'CANCEL',
    }));
    alert('부킹이 취소되었습니다.');
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
    router.push(LIST_PATHS.BOOKING_SEA);
  };

  // 신규 등록
  const handleNew = () => {
    setFormData(initialFormData);
    setHasUnsavedChanges(false);
    setIsNewMode(true);
  };

  // 초기화
  const handleReset = () => {
    if (!confirm('입력한 내용을 모두 초기화하시겠습니까?')) return;
    setFormData(initialFormData);
    setHasUnsavedChanges(false);
  };

  // 삭제 처리
  const handleDelete = async () => {
    if (!formData.bookingNo || !confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/booking/sea?ids=${formData.bookingNo}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('삭제 실패');
      }

      setHasUnsavedChanges(false);
      alert('부킹이 삭제되었습니다.');
      router.push(LIST_PATHS.BOOKING_SEA);
    } catch (error) {
      console.error('Delete error:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 테스트 데이터 입력
  const handleFillTestData = () => {
    setFormData({
      // 기본정보
      jobNo: '',
      regDate: new Date().toISOString().split('T')[0],
      inputUser: '홍길동',
      bookingStatus: 'DRAFT',
      bookingRequestDate: '',
      bookingConfirmDate: '',
      forwarderCode: 'FWD001',
      carrierCode: 'MAEU',
      bookingNo: '',
      // Schedule
      vesselVoyage: 'MAERSK EINDHOVEN / 001E',
      partnerVoyage: 'KCS-001E',
      por: 'KRPUS',
      pol: 'KRPUS',
      pod: 'USLAX',
      pvy: 'USLAX',
      etd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      eta: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      blType: 'ORIGINAL',
      // 송수하인 정보
      customerCode: 'C001',
      actualCustomerName: '삼성전자',
      bizNo: '123-45-67890',
      bookingManager: '김담당',
      containerManager: '박컨테이너',
      notify: '삼성아메리카',
      consignee: '삼성아메리카',
      // Cargo Information
      contractHolder: '삼성전자',
      serviceTerm: 'CY-CY',
      bookingShipper: '삼성전자 물류팀',
      commodity: '전자제품',
      serviceContractNo: 'SC-2026-001',
      bookingOffice: '서울본사',
      namedCustomer: 'Samsung Electronics',
      specialHandlingCode: '',
      grossWeight: 15000,
      // Container Pick up Information
      pickup: '부산항 신항',
      transportManager: '이운송',
      transportCompany: '한국물류(주)',
      transportTel: '02-1234-5678',
      pickupDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      remark: '테스트 데이터입니다.',
    });
    setHasUnsavedChanges(true);
    alert('테스트 데이터가 입력되었습니다.');
  };

  // 상태별 배지 스타일
  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; bgColor: string; textColor: string }> = {
      DRAFT: { label: '작성중', bgColor: '#F3F4F6', textColor: '#6B7280' },
      REQUEST: { label: '부킹요청', bgColor: '#DBEAFE', textColor: '#2563EB' },
      CONFIRM: { label: '부킹확정', bgColor: '#D1FAE5', textColor: '#059669' },
      CANCEL: { label: '부킹취소', bgColor: '#FEE2E2', textColor: '#DC2626' },
    };
    const statusConfig = config[status] || config.DRAFT;
    return (
      <span
        className="px-3 py-1 rounded-full text-sm font-medium"
        style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.textColor }}
      >
        {statusConfig.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header
        title="선적부킹관리 등록 (해상)"
        subtitle="견적/부킹관리 
        onClose={() => setShowCloseModal(true)}> 선적부킹관리 (해상) > 등록"
        onClose={handleCloseClick}
      />
      <main ref={formRef} className="p-6">
          {/* 상단 버튼 영역 (화면설계서 기준) */}
          <div className="sticky top-0 z-20 bg-white py-2 border-b border-gray-200 flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-[var(--muted)]">화면번호: FMS-BK-002</span>
            </div>
            <div className="flex gap-2">
              {/* 화면설계서 기준 버튼: 신규, 수정, 삭제, 출력, E-mail, Excel, 부킹확정/취소, 부킹요청 */}
              <button
                onClick={handleNew}
                disabled={isNewMode}
                className="px-4 py-2 text-sm font-medium bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                신규
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)] disabled:opacity-50"
              >
                {isSaving ? '저장중...' : '수정'}
              </button>
              <button
                onClick={handleDelete}
                disabled={!formData.bookingNo}
                className="px-4 py-2 text-sm font-medium bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                삭제
              </button>
              <button className="px-4 py-2 text-sm font-medium bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">
                출력
              </button>
              <button
                onClick={() => setShowEmailModal(true)}
                className="px-4 py-2 text-sm font-medium bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]"
              >
                E-mail
              </button>
              <button className="px-4 py-2 text-sm font-medium bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">
                Excel
              </button>
              {formData.bookingStatus === 'REQUEST' ? (
                <>
                  <button
                    onClick={handleBookingConfirm}
                    className="px-4 py-2 text-sm font-medium bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]"
                  >
                    부킹확정
                  </button>
                  <button
                    onClick={handleBookingCancel}
                    className="px-4 py-2 text-sm font-medium bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]"
                  >
                    부킹취소
                  </button>
                </>
              ) : formData.bookingStatus === 'DRAFT' ? (
                <button
                  onClick={handleBookingRequest}
                  className="px-4 py-2 text-sm font-medium bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]"
                >
                  부킹요청
                </button>
              ) : null}
            </div>
          </div>

          {/* 기본정보 섹션 (화면설계서 기준) */}
          <div className="card mb-6">
            <div className="section-header">
              <h3 className="font-bold text-white">기본정보</h3>
            </div>
            <div className="p-4 grid grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Job No <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.jobNo || '자동생성'}
                  disabled
                  className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">등록일자 <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={formData.regDate}
                  onChange={(e) => handleInputChange('regDate', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">입력사원</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={formData.inputUser}
                    onChange={(e) => handleInputChange('inputUser', e.target.value)}
                    className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="사원명"
                  />
                  <SearchIconButton onClick={() => setShowStaffModal(true)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">부킹상태</label>
                <div className="flex items-center h-[42px]">
                  {getStatusBadge(formData.bookingStatus)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">부킹요청일자</label>
                <input
                  type="date"
                  value={formData.bookingRequestDate}
                  disabled
                  className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">부킹확정일자</label>
                <input
                  type="date"
                  value={formData.bookingConfirmDate}
                  disabled
                  className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">포워더코드 <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.forwarderCode}
                    onChange={(e) => handleInputChange('forwarderCode', e.target.value)}
                    className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="포워더코드"
                  />
                  <SearchIconButton onClick={() => setShowForwarderModal(true)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">선사코드</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.carrierCode}
                    onChange={(e) => handleInputChange('carrierCode', e.target.value)}
                    className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="선사코드"
                  />
                  <SearchIconButton onClick={() => setShowCarrierModal(true)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Booking No</label>
                <input
                  type="text"
                  value={formData.bookingNo || '자동생성'}
                  disabled
                  className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]"
                />
              </div>
            </div>
          </div>

          {/* Schedule 섹션 (화면설계서 기준) */}
          <div className="card mb-6">
            <div className="section-header flex justify-between items-center">
              <h3 className="font-bold text-white">Schedule</h3>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="px-3 py-1 bg-white/20 text-white text-sm rounded hover:bg-white/30"
              >
                스케줄 검색
              </button>
            </div>
            <div className="p-4 grid grid-cols-6 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">선명/항차</label>
                <input
                  type="text"
                  value={formData.vesselVoyage}
                  onChange={(e) => handleInputChange('vesselVoyage', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="선박명 / 항차"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Partner's Voyage</label>
                <input
                  type="text"
                  value={formData.partnerVoyage}
                  onChange={(e) => handleInputChange('partnerVoyage', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="파트너 항차"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">POR (선적지)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.por}
                    onChange={(e) => handleInputChange('por', e.target.value)}
                    className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="KRPUS"
                  />
                  <SearchIconButton onClick={() => handleSeaportSearch('por')} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">POL (선적항) <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.pol}
                    onChange={(e) => handleInputChange('pol', e.target.value)}
                    className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="KRPUS"
                  />
                  <SearchIconButton onClick={() => handleSeaportSearch('pol')} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">POD (양하항) <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.pod}
                    onChange={(e) => handleInputChange('pod', e.target.value)}
                    className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="USLAX"
                  />
                  <SearchIconButton onClick={() => handleSeaportSearch('pod')} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">PVY (인도지)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.pvy}
                    onChange={(e) => handleInputChange('pvy', e.target.value)}
                    className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="USLAX"
                  />
                  <SearchIconButton onClick={() => handleSeaportSearch('pvy')} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ETD</label>
                <input
                  type="date"
                  value={formData.etd}
                  onChange={(e) => handleInputChange('etd', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ETA</label>
                <input
                  type="date"
                  value={formData.eta}
                  onChange={(e) => handleInputChange('eta', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">B/L TYPE</label>
                <select
                  value={formData.blType}
                  onChange={(e) => handleInputChange('blType', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                >
                  <option value="ORIGINAL">Original B/L</option>
                  <option value="SEAWAY">Sea Waybill</option>
                  <option value="SURRENDER">Surrendered B/L</option>
                </select>
              </div>
            </div>
          </div>

          {/* 송수하인 정보 섹션 (화면설계서 기준) */}
          <div className="card mb-6">
            <div className="section-header">
              <h3 className="font-bold text-white">송수하인 정보</h3>
            </div>
            <div className="p-4 grid grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">거래처 <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.customerCode}
                    onChange={(e) => handleInputChange('customerCode', e.target.value)}
                    className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="거래처코드"
                  />
                  <SearchIconButton onClick={() => setShowCustomerModal(true)} />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">실거래처명 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.actualCustomerName}
                  onChange={(e) => handleInputChange('actualCustomerName', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="실제 거래처명"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">사업자번호</label>
                <input
                  type="text"
                  value={formData.bizNo}
                  onChange={(e) => handleInputChange('bizNo', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="000-00-00000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Booking 담당자</label>
                <input
                  type="text"
                  value={formData.bookingManager}
                  onChange={(e) => handleInputChange('bookingManager', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="담당자명"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">컨테이너 반입 담당자</label>
                <input
                  type="text"
                  value={formData.containerManager}
                  onChange={(e) => handleInputChange('containerManager', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="반입 담당자"
                />
              </div>
              <div className="col-span-3">
                <label className="block text-sm font-medium mb-1">Notify</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.notify}
                    onChange={(e) => handleInputChange('notify', e.target.value)}
                    className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="Notify Party"
                  />
                  <SearchIconButton onClick={() => setShowNotifyModal(true)} />
                </div>
              </div>
              <div className="col-span-3">
                <label className="block text-sm font-medium mb-1">Consignee</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.consignee}
                    onChange={(e) => handleInputChange('consignee', e.target.value)}
                    className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="Consignee"
                  />
                  <SearchIconButton onClick={() => setShowConsigneeModal(true)} />
                </div>
              </div>
            </div>
          </div>

          {/* Cargo Information 섹션 (화면설계서 기준) */}
          <div className="card mb-6">
            <div className="section-header">
              <h3 className="font-bold text-white">Cargo Information</h3>
            </div>
            <div className="p-4 grid grid-cols-6 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Contract Holder <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.contractHolder}
                  onChange={(e) => handleInputChange('contractHolder', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="Contract Holder"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Service Term <span className="text-red-500">*</span></label>
                <select
                  value={formData.serviceTerm}
                  onChange={(e) => handleInputChange('serviceTerm', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                >
                  <option value="CY-CY">CY-CY</option>
                  <option value="CY-DOOR">CY-DOOR</option>
                  <option value="DOOR-CY">DOOR-CY</option>
                  <option value="DOOR-DOOR">DOOR-DOOR</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Booking Shipper <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.bookingShipper}
                  onChange={(e) => handleInputChange('bookingShipper', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="Booking Shipper"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Service Contract No</label>
                <input
                  type="text"
                  value={formData.serviceContractNo}
                  onChange={(e) => handleInputChange('serviceContractNo', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="SC-0000-000"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Commodity <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.commodity}
                  onChange={(e) => handleInputChange('commodity', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="품명"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Booking Office</label>
                <input
                  type="text"
                  value={formData.bookingOffice}
                  onChange={(e) => handleInputChange('bookingOffice', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="부킹 오피스"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Named Customer <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.namedCustomer}
                  onChange={(e) => handleInputChange('namedCustomer', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="Named Customer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Special Handing Code</label>
                <input
                  type="text"
                  value={formData.specialHandlingCode}
                  onChange={(e) => handleInputChange('specialHandlingCode', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="특수 핸들링 코드"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gross Weight(KGS) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={formData.grossWeight || ''}
                  onChange={(e) => handleInputChange('grossWeight', Number(e.target.value))}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-center"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Container Pick up Information 섹션 (화면설계서 기준) */}
          <div className="card mb-6">
            <div className="section-header">
              <h3 className="font-bold text-white">Container Pick up Information</h3>
            </div>
            <div className="p-4 grid grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Pick up <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.pickup}
                  onChange={(e) => handleInputChange('pickup', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="픽업 장소"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">운송담당자</label>
                <input
                  type="text"
                  value={formData.transportManager}
                  onChange={(e) => handleInputChange('transportManager', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="운송담당자"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">운송사</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.transportCompany}
                    onChange={(e) => handleInputChange('transportCompany', e.target.value)}
                    className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="운송사"
                  />
                  <SearchIconButton onClick={() => setShowTransportModal(true)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">운송 Tel</label>
                <input
                  type="text"
                  value={formData.transportTel}
                  onChange={(e) => handleInputChange('transportTel', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="000-0000-0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pick Up 일자</label>
                <input
                  type="date"
                  value={formData.pickupDate}
                  onChange={(e) => handleInputChange('pickupDate', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Remark</label>
                <input
                  type="text"
                  value={formData.remark}
                  onChange={(e) => handleInputChange('remark', e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="비고"
                />
              </div>
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={handleGoList}
              className="px-8 py-3 text-sm font-medium bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]"
            >
              목록
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-8 py-3 text-sm font-medium bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)] disabled:opacity-50"
            >
              {isSaving ? '저장중...' : '저장'}
            </button>
            {formData.bookingStatus === 'DRAFT' && (
              <button
                onClick={handleBookingRequest}
                className="px-8 py-3 text-sm font-medium bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]"
              >
                부킹요청
              </button>
            )}
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
        documentNo={formData.bookingNo || '신규'}
      />

      {/* 저장 확인 모달 */}
      <UnsavedChangesModal
        isOpen={showCloseModal}
        onClose={handleModalClose}
        onDiscard={handleDiscardChanges}
        onSave={handleSave}
        message="작성 중인 내용이 저장되지 않습니다. 저장하시겠습니까?"
      />

      {/* 거래처 검색 팝업 */}
      <CodeSearchModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSelect={handleCustomerSelect}
        codeType="customer"
        title="거래처 조회"
      />

      {/* 포워더 검색 팝업 */}
      <CodeSearchModal
        isOpen={showForwarderModal}
        onClose={() => setShowForwarderModal(false)}
        onSelect={handleForwarderSelect}
        codeType="forwarder"
        title="포워더 조회"
      />

      {/* 선사 검색 팝업 */}
      <CodeSearchModal
        isOpen={showCarrierModal}
        onClose={() => setShowCarrierModal(false)}
        onSelect={handleCarrierSelect}
        codeType="carrier"
        title="선사 조회"
      />

      {/* 항구 검색 팝업 */}
      <CodeSearchModal
        isOpen={showSeaportModal}
        onClose={() => setShowSeaportModal(false)}
        onSelect={handleSeaportSelect}
        codeType="seaport"
        title={
          currentPortField === 'por' ? 'POR (선적지) 조회' :
          currentPortField === 'pol' ? 'POL (선적항) 조회' :
          currentPortField === 'pod' ? 'POD (양하항) 조회' :
          'PVY (인도지) 조회'
        }
      />

      {/* 입력사원 검색 팝업 */}
      <CodeSearchModal
        isOpen={showStaffModal}
        onClose={() => setShowStaffModal(false)}
        onSelect={handleStaffSelect}
        codeType="manager"
        title="입력사원 조회"
      />

      {/* Consignee 검색 팝업 */}
      <CodeSearchModal
        isOpen={showConsigneeModal}
        onClose={() => setShowConsigneeModal(false)}
        onSelect={handleConsigneeSelect}
        codeType="customer"
        title="Consignee 조회"
      />

      {/* Notify 검색 팝업 */}
      <CodeSearchModal
        isOpen={showNotifyModal}
        onClose={() => setShowNotifyModal(false)}
        onSelect={handleNotifySelect}
        codeType="customer"
        title="Notify 조회"
      />

      {/* 운송사 검색 팝업 */}
      <CodeSearchModal
        isOpen={showTransportModal}
        onClose={() => setShowTransportModal(false)}
        onSelect={handleTransportSelect}
        codeType="carrier"
        title="운송사 조회"
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
        <p className="text-[var(--muted)]">로딩중...</p>
      </div>
    </div>
  );
}

export default function BookingSeaRegisterPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <BookingSeaRegisterContent />
    </Suspense>
  );
}
