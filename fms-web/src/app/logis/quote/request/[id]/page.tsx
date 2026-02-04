'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { formatCurrency } from '@/utils/format';
import { LIST_PATHS } from '@/constants/paths';

interface QuoteRequestDetail {
  requestNo: string;
  requestDate: string;
  requestType: string;
  transportMode: string;
  shipper: string;
  shipperContact: string;
  shipperEmail: string;
  consignee: string;
  origin: string;
  destination: string;
  incoterms: string;
  commodity: string;
  hsCode: string;
  cargoType: string;
  packages: number;
  packageUnit: string;
  grossWeight: number;
  volume: number;
  containerType: string;
  containerQty: number;
  pickupAddress: string;
  deliveryAddress: string;
  requestedETD: string;
  requestedETA: string;
  specialRequirements: string;
  status: string;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
}

interface QuoteResponse {
  id: number;
  quoteNo: string;
  carrier: string;
  transitTime: string;
  validFrom: string;
  validTo: string;
  oceanFreight: number;
  localCharges: number;
  totalAmount: number;
  currency: string;
  status: string;
  createdAt: string;
}

const mockRequestData: QuoteRequestDetail = {
  requestNo: 'QR-2026-0001',
  requestDate: '2026-01-20',
  requestType: '수출',
  transportMode: 'SEA',
  shipper: '삼성전자 주식회사',
  shipperContact: '김영수',
  shipperEmail: 'kim@samsung.com',
  consignee: '삼성아메리카',
  origin: 'KRPUS',
  destination: 'USLAX',
  incoterms: 'FOB',
  commodity: '전자제품 (TV, 모니터)',
  hsCode: '8528.72',
  cargoType: 'GENERAL',
  packages: 500,
  packageUnit: 'CTN',
  grossWeight: 12500,
  volume: 85.5,
  containerType: '40HC',
  containerQty: 5,
  pickupAddress: '경기도 수원시 영통구 삼성로 129',
  deliveryAddress: 'Los Angeles, CA, USA',
  requestedETD: '2026-02-01',
  requestedETA: '2026-02-20',
  specialRequirements: '파손 주의, 온도 민감 화물, 보험 필요',
  status: 'QUOTED',
  assignedTo: '이상훈',
  createdAt: '2026-01-20 10:30:00',
  updatedAt: '2026-01-21 14:20:00',
};

const mockQuotes: QuoteResponse[] = [
  { id: 1, quoteNo: 'QT-2026-0001', carrier: 'HMM', transitTime: '18일', validFrom: '2026-01-25', validTo: '2026-02-25', oceanFreight: 15000, localCharges: 2500, totalAmount: 17500, currency: 'USD', status: '발송', createdAt: '2026-01-21' },
  { id: 2, quoteNo: 'QT-2026-0002', carrier: 'MAERSK', transitTime: '16일', validFrom: '2026-01-25', validTo: '2026-02-25', oceanFreight: 16500, localCharges: 2800, totalAmount: 19300, currency: 'USD', status: '발송', createdAt: '2026-01-21' },
  { id: 3, quoteNo: 'QT-2026-0003', carrier: 'MSC', transitTime: '20일', validFrom: '2026-01-25', validTo: '2026-02-25', oceanFreight: 14000, localCharges: 2200, totalAmount: 16200, currency: 'USD', status: '작성중', createdAt: '2026-01-21' },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: '대기', color: 'bg-gray-500' },
  PROCESSING: { label: '처리중', color: 'bg-blue-500' },
  QUOTED: { label: '견적완료', color: 'bg-green-500' },
  ACCEPTED: { label: '수락', color: 'bg-purple-500' },
  REJECTED: { label: '거절', color: 'bg-red-500' },
  EXPIRED: { label: '만료', color: 'bg-yellow-500' },
};

export default function QuoteRequestDetailPage() {
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const params = useParams();
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const [data, setData] = useState<QuoteRequestDetail | null>(null);
  const [quotes] = useState<QuoteResponse[]>(mockQuotes);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<QuoteRequestDetail | null>(null);

  useEffect(() => {
    setData(mockRequestData);
    setEditData(mockRequestData);
  }, [params.id]);

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => { setIsEditing(false); setEditData(data); };
  const handleSave = () => {
    if (editData) {
      setData(editData);
      setIsEditing(false);
      alert('견적요청이 수정되었습니다.');
    }
  };

  const handleChange = (field: keyof QuoteRequestDetail, value: string | number) => {
    if (editData) setEditData({ ...editData, [field]: value });
  };

  const handleCreateQuote = () => {
    router.push(`/logis/quote/sea/register?requestNo=${data?.requestNo}`);
  };

  if (!data) return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">로딩 중...</div>;

  const displayData = isEditing ? editData! : data;

  const handleCloseClick = () => {
    setShowCloseModal(true);
  };

  const handleConfirmClose = () => {
    setShowCloseModal(false);
    router.push(LIST_PATHS.QUOTE_REQUEST);
  };

  // 브라우저 뒤로가기 버튼 처리
  useCloseConfirm({
    showModal: showCloseModal,
    setShowModal: setShowCloseModal,
    onConfirmClose: handleConfirmClose,
  });

  return (
        <PageLayout title="견적요청 상세조회" subtitle="Logis > 물류견적관리 > 견적요청 상세조회" onClose={handleCloseClick} >
        <main ref={formRef} className="p-6">
          <div className="flex justify-end items-center mb-6">
            <div className="flex gap-2">
              <button onClick={() => router.push('/logis/quote/request')} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">목록</button>
              {isEditing ? (
                <>
                  <button onClick={handleCancel} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">취소</button>
                  <button onClick={handleSave} className="px-6 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">저장</button>
                </>
              ) : (
                <>
                  <button onClick={handleEdit} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">수정</button>
                  <button onClick={handleCreateQuote} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">견적작성</button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">요청 정보</h3>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-[var(--muted)]">요청번호</span><span className="font-medium">{displayData.requestNo}</span></div>
                <div className="flex justify-between"><span className="text-[var(--muted)]">요청일자</span><span>{displayData.requestDate}</span></div>
                <div className="flex justify-between"><span className="text-[var(--muted)]">구분</span><span>{displayData.requestType}</span></div>
                <div className="flex justify-between"><span className="text-[var(--muted)]">운송모드</span><span>{displayData.transportMode}</span></div>
                <div className="flex justify-between"><span className="text-[var(--muted)]">담당자</span><span>{displayData.assignedTo}</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--muted)]">상태</span>
                  <span className={`px-2 py-1 text-xs rounded-full text-white ${statusConfig[displayData.status]?.color}`}>{statusConfig[displayData.status]?.label}</span>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">화주 정보</h3>
              <div className="space-y-3">
                <div><label className="block text-sm text-[var(--foreground)]">화주명</label><input type="text" value={displayData.shipper} disabled={!isEditing} onChange={e => handleChange('shipper', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm text-[var(--foreground)]">담당자</label><input type="text" value={displayData.shipperContact} disabled={!isEditing} onChange={e => handleChange('shipperContact', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm text-[var(--foreground)]">이메일</label><input type="email" value={displayData.shipperEmail} disabled={!isEditing} onChange={e => handleChange('shipperEmail', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">수하인 정보</h3>
              <div className="space-y-3">
                <div><label className="block text-sm text-[var(--foreground)]">수하인명</label><input type="text" value={displayData.consignee} disabled={!isEditing} onChange={e => handleChange('consignee', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm text-[var(--foreground)]">Incoterms</label><input type="text" value={displayData.incoterms} disabled={!isEditing} onChange={e => handleChange('incoterms', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">구간 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-[var(--foreground)]">출발지</label><input type="text" value={displayData.origin} disabled={!isEditing} onChange={e => handleChange('origin', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm text-[var(--foreground)]">도착지</label><input type="text" value={displayData.destination} disabled={!isEditing} onChange={e => handleChange('destination', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm text-[var(--foreground)]">희망 ETD</label><input type="date" value={displayData.requestedETD} disabled={!isEditing} onChange={e => handleChange('requestedETD', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm text-[var(--foreground)]">희망 ETA</label><input type="date" value={displayData.requestedETA} disabled={!isEditing} onChange={e => handleChange('requestedETA', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div className="col-span-2"><label className="block text-sm text-[var(--foreground)]">픽업 주소</label><input type="text" value={displayData.pickupAddress} disabled={!isEditing} onChange={e => handleChange('pickupAddress', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div className="col-span-2"><label className="block text-sm text-[var(--foreground)]">배송 주소</label><input type="text" value={displayData.deliveryAddress} disabled={!isEditing} onChange={e => handleChange('deliveryAddress', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">화물 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-[var(--foreground)]">품명</label><input type="text" value={displayData.commodity} disabled={!isEditing} onChange={e => handleChange('commodity', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm text-[var(--foreground)]">HS Code</label><input type="text" value={displayData.hsCode} disabled={!isEditing} onChange={e => handleChange('hsCode', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm text-[var(--foreground)]">화물 타입</label><input type="text" value={displayData.cargoType} disabled={!isEditing} onChange={e => handleChange('cargoType', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm text-[var(--foreground)]">포장수량</label><input type="text" value={`${displayData.packages} ${displayData.packageUnit}`} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
                <div><label className="block text-sm text-[var(--foreground)]">총 중량 (KG)</label><input type="number" value={displayData.grossWeight} disabled={!isEditing} onChange={e => handleChange('grossWeight', parseFloat(e.target.value) || 0)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm text-[var(--foreground)]">총 용적 (CBM)</label><input type="number" value={displayData.volume} disabled={!isEditing} onChange={e => handleChange('volume', parseFloat(e.target.value) || 0)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm text-[var(--foreground)]">컨테이너 타입</label><input type="text" value={displayData.containerType} disabled={!isEditing} onChange={e => handleChange('containerType', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm text-[var(--foreground)]">컨테이너 수량</label><input type="number" value={displayData.containerQty} disabled={!isEditing} onChange={e => handleChange('containerQty', parseInt(e.target.value) || 0)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
              </div>
              <div className="mt-4"><label className="block text-sm text-[var(--foreground)]">특별 요청사항</label><textarea value={displayData.specialRequirements} disabled={!isEditing} onChange={e => handleChange('specialRequirements', e.target.value)} rows={3} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[var(--border)]">
              <h3 className="font-bold text-lg">견적 응답 목록</h3>
              <button onClick={handleCreateQuote} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">+ 견적 추가</button>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th className="text-center">견적번호</th>
                  <th className="text-center">선사</th>
                  <th className="text-center">Transit Time</th>
                  <th className="text-center">유효기간</th>
                  <th className="text-center">Ocean Freight</th>
                  <th className="text-center">Local Charges</th>
                  <th className="text-center">총액</th>
                  <th className="text-center">상태</th>
                  <th className="text-center">작성일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {quotes.map(quote => (
                  <tr key={quote.id} className="hover:bg-[var(--surface-50)]">
                    <td className="px-4 py-3 text-center text-blue-400 hover:underline cursor-pointer">{quote.quoteNo}</td>
                    <td className="px-4 py-3 text-center">{quote.carrier}</td>
                    <td className="px-4 py-3 text-center">{quote.transitTime}</td>
                    <td className="px-4 py-3 text-sm text-center">{quote.validFrom} ~ {quote.validTo}</td>
                    <td className="px-4 py-3 text-center">{formatCurrency(quote.oceanFreight, quote.currency)}</td>
                    <td className="px-4 py-3 text-center">{formatCurrency(quote.localCharges, quote.currency)}</td>
                    <td className="px-4 py-3 text-center font-medium">{formatCurrency(quote.totalAmount, quote.currency)}</td>
                    <td className="px-4 py-3 text-center"><span className={`px-2 py-1 text-xs rounded-full text-white ${quote.status === '발송' ? 'bg-green-500' : 'bg-yellow-500'}`}>{quote.status}</span></td>
                    <td className="px-4 py-3 text-center">{quote.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-[var(--muted)]">
            <span>등록일: {data.createdAt}</span>
            <span className="ml-4">수정일: {data.updatedAt}</span>
          </div>
        </main>
      {/* 화면 닫기 확인 모달 */}
      <CloseConfirmModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onConfirm={handleConfirmClose}
      />
    </PageLayout>
  );
}
