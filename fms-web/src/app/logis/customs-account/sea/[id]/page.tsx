'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { LIST_PATHS } from '@/constants/paths';
import { ActionButton } from '@/components/buttons';
import { formatCurrency } from '@/utils/format';
import EmailModal from '@/components/EmailModal';

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: '작성중', color: '#6B7280', bgColor: '#F3F4F6' },
  ACTIVE: { label: '진행중', color: '#2563EB', bgColor: '#DBEAFE' },
  CONFIRMED: { label: '확정', color: '#059669', bgColor: '#D1FAE5' },
  CLOSED: { label: '마감', color: '#7C3AED', bgColor: '#EDE9FE' },
};

const getStatusConfig = (status: string) => {
  return statusConfig[status] || { label: status || '미정', color: '#6B7280', bgColor: '#F3F4F6' };
};

const boundLabels: Record<string, string> = { AI: '항공수입', AO: '항공수출', SI: '해상수입', SO: '해상수출' };

interface AccountData {
  id: string;
  jobNo: string;
  boundType: string;
  businessType: string;
  tradeTerms: string;
  branch: string;
  mblNo: string;
  hblNo: string;
  caseqNo: string;
  accountCode: string;
  accountName: string;
  shipperName: string;
  shipperAddr: string;
  consigneeName: string;
  consigneeAddr: string;
  performanceDate: string;
  performanceAmt: number;
  packages: number;
  packageUnit: string;
  weight: number;
  weightUnit: string;
  cbm: number;
  inputDate: string;
  obArDate: string;
  flightNo: string;
  vesselName: string;
  voyageNo: string;
  containerType: string;
  callSign: string;
  pol: string;
  pod: string;
  salesEmployee: string;
  lcNo: string;
  invNo: string;
  poNo: string;
  item: string;
  container20dr: number;
  container20hc: number;
  container20rf: number;
  container40dr: number;
  container40hc: number;
  container40rf: number;
  customsDate: string;
  licenseNo: string;
  brokerName: string;
  customsOffice: string;
  transportDate: string;
  bondedWarehouse: string;
  customsType: string;
  customsDept: string;
  declaredValue: number;
  currency: string;
  exRate: number;
  dutyRate: number;
  assessedValue: number;
  freightAmt: number;
  dutyAmt: number;
  vatRate: number;
  vatAmt: number;
  remarks: string;
  status: string;
  createdAt: string;
  [key: string]: string | number | undefined;
}

export default function CustomsAccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const [data, setData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const handleConfirmClose = () => { setShowCloseModal(false); router.push(LIST_PATHS.CUSTOMS_ACCOUNT_SEA); };
  useCloseConfirm({ showModal: showCloseModal, setShowModal: setShowCloseModal, onConfirmClose: handleConfirmClose });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/customs-account/sea?accountId=${resolvedParams.id}`);
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [resolvedParams.id]);

  const handleEdit = () => { router.push(`/logis/customs-account/sea/register?id=${resolvedParams.id}`); };
  const handleList = () => { router.push('/logis/customs-account/sea'); };

  const handleDelete = async () => {
    if (!data) return;
    if (confirm('이 통관정산 자료를 삭제하시겠습니까?')) {
      try {
        const res = await fetch(`/api/customs-account/sea?ids=${data.id}`, { method: 'DELETE' });
        if (res.ok) {
          alert('삭제되었습니다.');
          router.push('/logis/customs-account/sea');
        }
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E8A838] mx-auto"></div>
          <p className="mt-4 text-[var(--muted)]">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <PageLayout title="통관정산 상세" subtitle="HOME > 통관관리 > 통관정산 관리 > 상세" onClose={() => setShowCloseModal(true)}>
        <main className="p-6">
          <div className="card p-12 text-center">
            <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">통관정산 자료를 찾을 수 없습니다</h3>
            <p className="text-[var(--muted)] mb-6">요청하신 정보가 존재하지 않습니다.</p>
            <button onClick={handleList} className="px-6 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">목록으로 돌아가기</button>
          </div>
        </main>
      </PageLayout>
    );
  }

  const st = getStatusConfig(data.status);
  const totalContainers = (data.container20dr || 0) + (data.container20hc || 0) + (data.container20rf || 0) + (data.container40dr || 0) + (data.container40hc || 0) + (data.container40rf || 0);
  const valueCls = "text-[var(--foreground)] font-medium";
  const labelCls = "block text-xs text-[var(--muted)] mb-1";

  return (
    <PageLayout title="통관정산 상세" subtitle="HOME > 통관관리 > 통관정산 관리 > 상세조회" onClose={() => setShowCloseModal(true)}>
      <main ref={formRef} className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ color: st.color, backgroundColor: st.bgColor }}>{st.label}</span>
          </div>
          <div className="flex gap-2">
            <ActionButton variant="default" icon="email" onClick={() => setShowEmailModal(true)}>E-mail</ActionButton>
            <ActionButton variant="default" icon="edit" onClick={handleList}>목록</ActionButton>
            <ActionButton variant="default" icon="edit" onClick={handleEdit}>수정</ActionButton>
            <ActionButton variant="default" icon="delete" onClick={handleDelete}>삭제</ActionButton>
          </div>
        </div>

        {/* 기본정보 */}
        <div className="card mb-6">
          <div className="p-4 border-b border-[var(--border)]"><h3 className="font-bold">기본정보</h3></div>
          <div className="p-4">
            <div className="grid grid-cols-6 gap-4 mb-4">
              <div><label className={labelCls}>JOB NO</label><p className="text-[#E8A838] font-bold text-lg">{data.jobNo}</p></div>
              <div><label className={labelCls}>BOUND</label><p className={valueCls}>{boundLabels[data.boundType] || data.boundType}</p></div>
              <div><label className={labelCls}>업무유형</label><p className={valueCls}>{data.businessType}</p></div>
              <div><label className={labelCls}>무역조건</label><p className={valueCls}>{data.tradeTerms}</p></div>
              <div><label className={labelCls}>본지사</label><p className={valueCls}>{data.branch || '-'}</p></div>
              <div><label className={labelCls}>실적일자 / 금액</label><p className={valueCls}>{data.performanceDate || '-'} / <span className="text-[#E8A838]">{formatCurrency(data.performanceAmt || 0)}</span></p></div>
            </div>
            <div className="grid grid-cols-6 gap-4 mb-4">
              <div className="col-span-2"><label className={labelCls}>M.B/L(MAWB) NO</label><p className={valueCls}>{data.mblNo || '-'}</p></div>
              <div className="col-span-2"><label className={labelCls}>H.B/L(HAWB) NO</label><p className={valueCls}>{data.hblNo || '-'}</p></div>
              <div className="col-span-2"><label className={labelCls}>CASEQ NO</label><p className={valueCls}>{data.caseqNo || '-'}</p></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className={labelCls}>정산화주 (Account)</label><p className={valueCls}>{data.accountName || '-'}</p></div>
              <div><label className={labelCls}>SHIPPER</label><p className={valueCls}>{data.shipperName || '-'}</p></div>
              <div><label className={labelCls}>CONSIGNEE</label><p className={valueCls}>{data.consigneeName || '-'}</p></div>
            </div>
          </div>
        </div>

        {/* 화물/운송 정보 */}
        <div className="card mb-6">
          <div className="p-4 border-b border-[var(--border)]"><h3 className="font-bold">화물/운송 정보</h3></div>
          <div className="p-4">
            <div className="grid grid-cols-6 gap-4 mb-4">
              <div><label className={labelCls}>Packages</label><p className={valueCls}>{data.packages} {data.packageUnit}</p></div>
              <div><label className={labelCls}>Weight</label><p className={valueCls}>{data.weight?.toLocaleString()} {data.weightUnit}</p></div>
              <div><label className={labelCls}>CBM</label><p className={valueCls}>{data.cbm}</p></div>
              <div><label className={labelCls}>입출항일자</label><p className={valueCls}>{data.obArDate || '-'}</p></div>
              <div><label className={labelCls}>P.O.L</label><p className={valueCls}>{data.pol || '-'}</p></div>
              <div><label className={labelCls}>P.O.D</label><p className={valueCls}>{data.pod || '-'}</p></div>
            </div>
            <div className="grid grid-cols-6 gap-4 mb-4">
              <div><label className={labelCls}>Vessel</label><p className={valueCls}>{data.vesselName || '-'}</p></div>
              <div><label className={labelCls}>Voyage</label><p className={valueCls}>{data.voyageNo || '-'}</p></div>
              <div><label className={labelCls}>Flight No</label><p className={valueCls}>{data.flightNo || '-'}</p></div>
              <div><label className={labelCls}>영업사원</label><p className={valueCls}>{data.salesEmployee || '-'}</p></div>
              <div><label className={labelCls}>L/C NO</label><p className={valueCls}>{data.lcNo || '-'}</p></div>
              <div><label className={labelCls}>INV NO.</label><p className={valueCls}>{data.invNo || '-'}</p></div>
            </div>
            {totalContainers > 0 && (
              <div className="border border-[var(--border)] rounded-lg p-3">
                <div className="text-xs font-medium text-[var(--muted)] mb-2">컨테이너 (합계: {totalContainers})</div>
                <div className="grid grid-cols-6 gap-3 text-center text-sm">
                  <div><span className="text-xs text-[var(--muted)]">20DR</span><p>{data.container20dr}</p></div>
                  <div><span className="text-xs text-[var(--muted)]">20HC</span><p>{data.container20hc}</p></div>
                  <div><span className="text-xs text-[var(--muted)]">20RF</span><p>{data.container20rf}</p></div>
                  <div><span className="text-xs text-[var(--muted)]">40DR</span><p>{data.container40dr}</p></div>
                  <div><span className="text-xs text-[var(--muted)]">40HC</span><p>{data.container40hc}</p></div>
                  <div><span className="text-xs text-[var(--muted)]">40RF</span><p>{data.container40rf}</p></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 통관정보 */}
        <div className="card mb-6">
          <div className="p-4 border-b border-[var(--border)]"><h3 className="font-bold">통관정보</h3></div>
          <div className="p-4">
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div><label className={labelCls}>통관수리일자</label><p className={valueCls}>{data.customsDate || '-'}</p></div>
              <div><label className={labelCls}>신고필증번호</label><p className={valueCls}>{data.licenseNo || '-'}</p></div>
              <div><label className={labelCls}>관세사</label><p className={valueCls}>{data.brokerName || '-'}</p></div>
              <div><label className={labelCls}>관할지 세관</label><p className={valueCls}>{data.customsOffice || '-'}</p></div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div><label className={labelCls}>운송일자</label><p className={valueCls}>{data.transportDate || '-'}</p></div>
              <div><label className={labelCls}>보세창고</label><p className={valueCls}>{data.bondedWarehouse || '-'}</p></div>
              <div><label className={labelCls}>통관유형</label><p className={valueCls}>{data.customsType || '-'}</p></div>
              <div><label className={labelCls}>세관 과</label><p className={valueCls}>{data.customsDept || '-'}</p></div>
            </div>
          </div>
        </div>

        {/* 과세/세액 */}
        <div className="card mb-6">
          <div className="p-4 border-b border-[var(--border)]"><h3 className="font-bold">과세/세액 정보</h3></div>
          <div className="p-4">
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div><label className={labelCls}>신고가격</label><p className={valueCls}>{data.declaredValue?.toLocaleString()} {data.currency}</p></div>
              <div><label className={labelCls}>환율</label><p className={valueCls}>{data.exRate}</p></div>
              <div><label className={labelCls}>과세가격 (KRW)</label><p className="text-[var(--foreground)] font-bold">{formatCurrency(data.assessedValue || 0)}</p></div>
              <div><label className={labelCls}>운임</label><p className={valueCls}>{formatCurrency(data.freightAmt || 0)}</p></div>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div><label className={labelCls}>관세율</label><p className={valueCls}>{data.dutyRate}%</p></div>
              <div><label className={labelCls}>관세</label><p className="text-[var(--foreground)] font-bold">{formatCurrency(data.dutyAmt || 0)}</p></div>
              <div><label className={labelCls}>세율 (VAT)</label><p className={valueCls}>{data.vatRate}%</p></div>
              <div><label className={labelCls}>부가세</label><p className="text-[var(--foreground)] font-bold">{formatCurrency(data.vatAmt || 0)}</p></div>
            </div>
            {data.remarks && (
              <div><label className={labelCls}>비고</label><p className={valueCls}>{data.remarks}</p></div>
            )}
          </div>
        </div>

        <div className="text-sm text-[var(--muted)]">등록일: {data.createdAt}</div>
      </main>

      <CloseConfirmModal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} onConfirm={handleConfirmClose} />
      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSend={(emailData) => { console.log('Email:', emailData); alert('이메일이 발송되었습니다.'); setShowEmailModal(false); }}
        documentType="invoice"
        documentNo={data.jobNo}
        defaultSubject={`[통관정산] ${data.jobNo} - 인터지스 물류`}
      />
    </PageLayout>
  );
}
