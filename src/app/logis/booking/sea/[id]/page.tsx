'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import EmailModal from '@/components/EmailModal';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { LIST_PATHS } from '@/constants/paths';

interface BookingDetailData {
  id: string;
  jobNo: string;
  regDate: string;
  inputUser: string;
  bookingStatus: string;
  bookingRequestDate: string;
  bookingConfirmDate: string;
  forwarderCode: string;
  carrierCode: string;
  bookingNo: string;
  vesselVoyage: string;
  partnerVoyage: string;
  por: string;
  pol: string;
  pod: string;
  pvy: string;
  etd: string;
  eta: string;
  blType: string;
  customerCode: string;
  actualCustomerName: string;
  bizNo: string;
  bookingManager: string;
  containerManager: string;
  notify: string;
  consignee: string;
  contractHolder: string;
  serviceTerm: string;
  bookingShipper: string;
  commodity: string;
  serviceContractNo: string;
  bookingOffice: string;
  namedCustomer: string;
  specialHandlingCode: string;
  grossWeight: number;
  pickup: string;
  transportManager: string;
  transportCompany: string;
  pickupDate: string;
  remark: string;
  transmitDate: string;
  receiveDate: string;
  requestCustomer: string;
  confirmCustomer: string;
}

export default function BookingSeaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const bookingId = params.id as string;
  const [data, setData] = useState<BookingDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/booking/sea?bookingId=' + bookingId);
        if (!response.ok) throw new Error('데이터 조회 실패');
        const result = await response.json();
        setData({
          id: result.id,
          jobNo: result.bookingNo,
          regDate: result.createdAt ? result.createdAt.split(' ')[0] : '',
          inputUser: result.inputUser || '',
          bookingStatus: result.status || 'DRAFT',
          bookingRequestDate: result.bookingRequestDate || '',
          bookingConfirmDate: result.bookingConfirmDate || '',
          forwarderCode: result.forwarderCode || '',
          carrierCode: result.carrierId || '',
          bookingNo: result.bookingNo,
          vesselVoyage: (result.vesselName || '') + ' / ' + (result.voyageNo || ''),
          partnerVoyage: result.partnerVoyage || '',
          por: result.por || '',
          pol: result.pol || '',
          pod: result.pod || '',
          pvy: result.pvy || '',
          etd: result.etd || '',
          eta: result.eta || '',
          blType: result.blType || 'ORIGINAL',
          customerCode: result.shipperCode || '',
          actualCustomerName: result.shipperName || result.carrierName || '',
          bizNo: result.bizNo || '',
          bookingManager: result.bookingManager || '',
          containerManager: result.containerManager || '',
          notify: result.notify || '',
          consignee: result.consignee || '',
          contractHolder: result.contractHolder || '',
          serviceTerm: result.serviceTerm || 'CY-CY',
          bookingShipper: result.bookingShipper || '',
          commodity: result.commodityDesc || '',
          serviceContractNo: result.serviceContractNo || '',
          bookingOffice: result.bookingOffice || '',
          namedCustomer: result.namedCustomer || '',
          specialHandlingCode: result.specialHandlingCode || '',
          grossWeight: result.grossWeight || 0,
          pickup: result.pickup || '',
          transportManager: result.transportManager || '',
          transportCompany: result.transportCompany || '',
          pickupDate: result.pickupDate || '',
          remark: result.remark || '',
          transmitDate: result.transmitDate || '',
          receiveDate: result.receiveDate || '',
          requestCustomer: result.requestCustomer || '',
          confirmCustomer: result.confirmCustomer || '',
        });
      } catch (error) {
        console.error('데이터 조회 오류:', error);
        alert('데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    if (bookingId) fetchData();
  }, [bookingId]);

  const handleGoList = () => router.push(LIST_PATHS.BOOKING_SEA);
  const handleGoEdit = () => router.push('/logis/booking/sea/register?id=' + bookingId);
  const handleEmailSend = (emailData: { to: string[] }) => {
    alert('이메일이 발송되었습니다.\n받는 사람: ' + emailData.to.join(', '));
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; bgColor: string; textColor: string }> = {
      DRAFT: { label: '작성중', bgColor: '#F3F4F6', textColor: '#6B7280' },
      REQUEST: { label: '부킹요청', bgColor: '#DBEAFE', textColor: '#2563EB' },
      CONFIRM: { label: '부킹확정', bgColor: '#D1FAE5', textColor: '#059669' },
      CANCEL: { label: '부킹취소', bgColor: '#FEE2E2', textColor: '#DC2626' },
    };
    const statusConfig = config[status] || config.DRAFT;
    return (
      <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.textColor }}>
        {statusConfig.label}
      </span>
    );
  };

  const getBlTypeLabel = (type: string) => {
    const labels: Record<string, string> = { ORIGINAL: 'Original B/L', SEAWAY: 'Sea Waybill', SURRENDER: 'Surrendered B/L' };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E8A838] mx-auto mb-4"></div>
          <p className="text-[var(--muted)]">데이터를 불러오는 중...</p>
        </div>
      </div>
  );
}

  if (!data) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">데이터를 찾을 수 없습니다.</p>
          <button onClick={handleGoList} className="px-4 py-2 bg-[var(--surface-100)] text-white rounded-lg">목록으로 이동</button>
        </div>
      </div>
    );
  }

  return (
        <PageLayout title="선적부킹관리 상세조회 (해상)" subtitle="견적/부킹관리 > 선적부킹관리 (해상) > 상세조회" onClose={handleGoList} >
        <main ref={formRef} className="p-6">
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm text-[var(--muted)]">화면번호: FMS-BK-003</span>
            <div className="flex gap-2">
              <button onClick={() => router.push('/logis/booking/sea/register')} className="px-4 py-2 text-sm font-medium bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">신규</button>
              <button onClick={handleGoEdit} className="px-4 py-2 text-sm font-medium bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">수정</button>
              <button className="px-4 py-2 text-sm font-medium bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">삭제</button>
              <button className="px-4 py-2 text-sm font-medium bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">출력</button>
              <button onClick={() => setShowEmailModal(true)} className="px-4 py-2 text-sm font-medium bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">E-mail</button>
              <button className="px-4 py-2 text-sm font-medium bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">Excel</button>
              {data.bookingStatus === 'REQUEST' && (
                <>
                  <button className="px-4 py-2 text-sm font-medium bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">부킹확정</button>
                  <button className="px-4 py-2 text-sm font-medium bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">부킹취소</button>
                </>
              )}
              {data.bookingStatus === 'DRAFT' && (
                <button className="px-4 py-2 text-sm font-medium bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">부킹요청</button>
              )}
            </div>
          </div>

          {/* 기본정보 */}
          <div className="card mb-6">
            <div className="section-header"><h3 className="font-bold text-white">기본정보</h3></div>
            <div className="p-4 grid grid-cols-6 gap-4">
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">Job No</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.jobNo || '-'}</div></div>
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">등록일자</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.regDate || '-'}</div></div>
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">입력사원</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.inputUser || '-'}</div></div>
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">부킹상태</label><div className="flex items-center h-[42px]">{getStatusBadge(data.bookingStatus)}</div></div>
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">부킹요청일자</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.bookingRequestDate || '-'}</div></div>
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">부킹확정일자</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.bookingConfirmDate || '-'}</div></div>
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">포워더코드</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.forwarderCode || '-'}</div></div>
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">선사코드</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.carrierCode || '-'}</div></div>
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">Booking No</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg font-medium text-[#E8A838]">{data.bookingNo || '-'}</div></div>
            </div>
          </div>

          {/* Schedule */}
          <div className="card mb-6">
            <div className="section-header"><h3 className="font-bold text-white">Schedule</h3></div>
            <div className="p-4 grid grid-cols-6 gap-4">
              <div className="col-span-2"><label className="block text-sm font-medium text-[var(--foreground)] mb-1">선명/항차</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.vesselVoyage || '-'}</div></div>
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">Partner Voyage</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.partnerVoyage || '-'}</div></div>
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">POR (선적지)</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.por || '-'}</div></div>
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">POL (선적항)</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.pol || '-'}</div></div>
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">POD (양하항)</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.pod || '-'}</div></div>
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">PVY (인도지)</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.pvy || '-'}</div></div>
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">ETD</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.etd || '-'}</div></div>
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">ETA</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.eta || '-'}</div></div>
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">B/L TYPE</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{getBlTypeLabel(data.blType)}</div></div>
            </div>
          </div>

          {/* 송수하인 정보 */}
          <div className="card mb-6">
            <div className="section-header"><h3 className="font-bold text-white">송수하인 정보</h3></div>
            <div className="p-4 grid grid-cols-6 gap-4">
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">거래처</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.customerCode || '-'}</div></div>
              <div className="col-span-2"><label className="block text-sm font-medium text-[var(--foreground)] mb-1">실거래처명</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.actualCustomerName || '-'}</div></div>
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">사업자번호</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.bizNo || '-'}</div></div>
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">Booking 담당자</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.bookingManager || '-'}</div></div>
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">컨테이너 반입 담당자</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.containerManager || '-'}</div></div>
              <div className="col-span-3"><label className="block text-sm font-medium text-[var(--foreground)] mb-1">Notify</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.notify || '-'}</div></div>
              <div className="col-span-3"><label className="block text-sm font-medium text-[var(--foreground)] mb-1">Consignee</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.consignee || '-'}</div></div>
            </div>
          </div>

          {/* Cargo Information */}
          <div className="card mb-6">
            <div className="section-header"><h3 className="font-bold text-white">Cargo Information</h3></div>
            <div className="p-4 grid grid-cols-6 gap-4">
              <div className="col-span-2"><label className="block text-sm font-medium text-[var(--foreground)] mb-1">Contract Holder</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.contractHolder || '-'}</div></div>
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">Service Term</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.serviceTerm || '-'}</div></div>
              <div className="col-span-2"><label className="block text-sm font-medium text-[var(--foreground)] mb-1">Booking Shipper</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.bookingShipper || '-'}</div></div>
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">Service Contract No</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.serviceContractNo || '-'}</div></div>
              <div className="col-span-2"><label className="block text-sm font-medium text-[var(--foreground)] mb-1">Commodity</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.commodity || '-'}</div></div>
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">Booking Office</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.bookingOffice || '-'}</div></div>
              <div className="col-span-2"><label className="block text-sm font-medium text-[var(--foreground)] mb-1">Named Customer</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.namedCustomer || '-'}</div></div>
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">Special Handing Code</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.specialHandlingCode || '-'}</div></div>
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">Gross Weight(KGS)</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-right">{data.grossWeight ? data.grossWeight.toLocaleString() : '0'}</div></div>
            </div>
          </div>

          {/* Container Pick up Information */}
          <div className="card mb-6">
            <div className="section-header"><h3 className="font-bold text-white">Container Pick up Information</h3></div>
            <div className="p-4 grid grid-cols-5 gap-4">
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">Pick up</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.pickup || '-'}</div></div>
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">운송담당자</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.transportManager || '-'}</div></div>
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">운송사</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.transportCompany || '-'}</div></div>
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">Pick Up 일자</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.pickupDate || '-'}</div></div>
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">Remark</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.remark || '-'}</div></div>
            </div>
          </div>

          {/* 전송정보 */}
          <div className="card mb-6">
            <div className="section-header"><h3 className="font-bold text-white">전송정보</h3></div>
            <div className="p-4 grid grid-cols-4 gap-4">
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">전송일시</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.transmitDate || '-'}</div></div>
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">수신일시</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.receiveDate || '-'}</div></div>
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">부킹요청거래처</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.requestCustomer || '-'}</div></div>
              <div><label className="block text-sm font-medium text-[var(--foreground)] mb-1">부킹확정거래처</label><div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">{data.confirmCustomer || '-'}</div></div>
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-8">
            <button onClick={handleGoList} className="px-8 py-3 text-sm font-medium bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">목록</button>
            <button onClick={handleGoEdit} className="px-8 py-3 text-sm font-medium bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">수정</button>
          </div>
        </main>
      <EmailModal isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} onSend={handleEmailSend} documentType="booking" documentNo={data.bookingNo || ''} />
    </PageLayout>
  );
}
