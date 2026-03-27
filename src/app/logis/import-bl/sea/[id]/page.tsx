'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import BLPrintModal, { BLData as PrintBLData } from '@/components/BLPrintModal';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';

interface ImportBLDetailData {
  hbl_id: number;
  hbl_no: string;
  mbl_id: number;
  mbl_no: string;
  customer_name: string;
  carrier_name: string;
  carrier_code: string;
  vessel_nm: string;
  voyage_no: string;
  pol_port_cd: string;
  pod_port_cd: string;
  pol_port_name: string;
  pod_port_name: string;
  place_of_receipt: string;
  place_of_delivery: string;
  final_dest: string;
  etd_dt: string;
  eta_dt: string;
  issue_dt: string;
  issue_place: string;
  shipper_nm: string;
  shipper_addr: string;
  consignee_nm: string;
  consignee_addr: string;
  notify_party: string;
  total_pkg_qty: number;
  pkg_type_cd: string;
  gross_weight_kg: number;
  volume_cbm: number;
  commodity_desc: string;
  marks_nos: string;
  freight_term_cd: string;
  bl_type_cd: string;
  status_cd: string;
  created_dtm: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '작성중', color: 'bg-gray-500' },
  CONFIRMED: { label: '확정', color: 'bg-green-500' },
  RELEASED: { label: '발급', color: 'bg-blue-500' },
  CANCELLED: { label: '취소', color: 'bg-red-500' },
};

export default function ImportBLSeaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [data, setData] = useState<ImportBLDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  // B/L 출력용 데이터 변환
  const blPrintData: PrintBLData | null = useMemo(() => {
    if (!data) return null;
    return {
      hblNo: data.hbl_no || '',
      mblNo: data.mbl_no || '',
      blDate: data.issue_dt || '',
      shipper: data.shipper_nm || '',
      shipperAddress: data.shipper_addr || '',
      consignee: data.consignee_nm || '',
      consigneeAddress: data.consignee_addr || '',
      notifyParty: data.notify_party || '',
      carrier: data.carrier_code || data.carrier_name || '',
      vessel: data.vessel_nm || '',
      voyage: data.voyage_no || '',
      pol: data.pol_port_cd || '',
      pod: data.pod_port_cd || '',
      placeOfReceipt: data.place_of_receipt || '',
      placeOfDelivery: data.place_of_delivery || '',
      finalDestination: data.final_dest || '',
      etd: data.etd_dt || '',
      eta: data.eta_dt || '',
      containerNo: '',
      sealNo: '',
      containerType: data.pkg_type_cd || 'DRY',
      containerQty: 1,
      marksAndNumbers: data.marks_nos || '',
      description: data.commodity_desc || '',
      weight: data.gross_weight_kg || 0,
      measurement: data.volume_cbm || 0,
      packageType: data.pkg_type_cd || 'PKGS',
      packageQty: data.total_pkg_qty || 0,
      freightTerms: data.freight_term_cd === 'P' ? 'PREPAID' : 'COLLECT',
      numberOfOriginalBL: 3,
      dateOfIssue: data.issue_dt || '',
      placeOfIssue: data.issue_place || 'SEOUL, KOREA',
    };
  }, [data]);

  const handlePrint = () => {
    setShowPrintModal(true);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/bl/import?hbl_id=${params.id}`);
        if (response.ok) {
          const result = await response.json();
          if (result.length > 0) {
            setData(result[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch Import B/L:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  const handleDelete = async () => {
    if (!data) return;
    if (confirm('이 수입 B/L을 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`/api/bl/import?hbl_id=${data.hbl_id}`, { method: 'DELETE' });
        if (response.ok) {
          alert('수입 B/L이 삭제되었습니다.');
          router.push('/logis/import-bl/sea');
        } else {
          alert('삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('Failed to delete Import B/L:', error);
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleCloseClick = () => setShowCloseModal(true);
  const handleConfirmClose = () => { setShowCloseModal(false); router.back(); };

  useCloseConfirm({ showModal: showCloseModal, setShowModal: setShowCloseModal, onConfirmClose: handleConfirmClose });

  if (loading) return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">로딩 중...</div>;
  if (!data) return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">수입 B/L을 찾을 수 없습니다.</div>;

  const statusInfo = statusConfig[data.status_cd] || { label: data.status_cd, color: 'bg-gray-500' };

  return (
        <PageLayout title="수입 B/L 상세조회 (해상)" subtitle="Logis > 수입 B/L > 수입 B/L 상세조회 (해상)" onClose={handleCloseClick} >
        <main ref={formRef} className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-2">
              <button onClick={() => router.push('/logis/import-bl/sea')} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">목록</button>
              <button onClick={() => router.push(`/logis/import-bl/sea/register?hbl_id=${data.hbl_id}`)} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">수정</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">삭제</button>
            </div>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)] flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              B/L 출력
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* 기본 정보 */}
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">기본 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">H B/L No</label><input type="text" value={data.hbl_no || ''} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">M B/L No</label><input type="text" value={data.mbl_no || ''} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">상태</label>
                  <div className="flex items-center gap-2 px-3 py-2"><span className={`px-2 py-1 text-xs rounded-full text-white ${statusInfo.color}`}>{statusInfo.label}</span></div>
                </div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">고객사</label><input type="text" value={data.customer_name || ''} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
              </div>
            </div>

            {/* 운송 정보 */}
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">운송 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">선사</label><input type="text" value={data.carrier_name || ''} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">선명</label><input type="text" value={data.vessel_nm || ''} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">항차</label><input type="text" value={data.voyage_no || ''} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">운임조건</label><input type="text" value={data.freight_term_cd || ''} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
              </div>
            </div>

            {/* 구간 정보 */}
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">구간 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">선적항 (POL)</label><input type="text" value={`${data.pol_port_cd || ''} ${data.pol_port_name ? `- ${data.pol_port_name}` : ''}`} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">양하항 (POD)</label><input type="text" value={`${data.pod_port_cd || ''} ${data.pod_port_name ? `- ${data.pod_port_name}` : ''}`} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ETD</label><input type="text" value={data.etd_dt || ''} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ETA</label><input type="text" value={data.eta_dt || ''} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Place of Receipt</label><input type="text" value={data.place_of_receipt || ''} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Place of Delivery</label><input type="text" value={data.place_of_delivery || ''} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
              </div>
            </div>

            {/* 발급 정보 */}
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">발급 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">발급일</label><input type="text" value={data.issue_dt || ''} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">발급장소</label><input type="text" value={data.issue_place || ''} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">B/L 타입</label><input type="text" value={data.bl_type_cd || ''} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
              </div>
            </div>
          </div>

          {/* 당사자 정보 */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">Shipper</h3>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">이름</label><input type="text" value={data.shipper_nm || ''} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">주소</label><textarea value={data.shipper_addr || ''} disabled rows={2} className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)] resize-none" /></div>
              </div>
            </div>
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">Consignee</h3>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">이름</label><input type="text" value={data.consignee_nm || ''} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">주소</label><textarea value={data.consignee_addr || ''} disabled rows={2} className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)] resize-none" /></div>
              </div>
            </div>
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">Notify Party</h3>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Notify</label><textarea value={data.notify_party || ''} disabled rows={4} className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)] resize-none" /></div>
              </div>
            </div>
          </div>

          {/* 화물 정보 */}
          <div className="card p-6 mb-6">
            <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">화물 정보</h3>
            <div className="grid grid-cols-5 gap-4">
              <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">포장 수량</label><input type="text" value={`${data.total_pkg_qty || 0} ${data.pkg_type_cd || ''}`} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
              <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">총중량 (KG)</label><input type="text" value={(data.gross_weight_kg || 0).toLocaleString()} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
              <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">용적 (CBM)</label><input type="text" value={Number(data.volume_cbm || 0).toFixed(2)} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
              <div className="col-span-2"><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">품목</label><input type="text" value={data.commodity_desc || ''} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
            </div>
            <div className="mt-4"><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Marks & Numbers</label><textarea value={data.marks_nos || ''} disabled rows={2} className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)] resize-none" /></div>
          </div>

          <div className="text-sm text-[var(--muted)]"><span>등록일: {data.created_dtm}</span></div>
        </main>
      <CloseConfirmModal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} onConfirm={handleConfirmClose} />

      {/* B/L 출력 모달 */}
      <BLPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        blData={blPrintData}
      />
    </PageLayout>
  );
}
