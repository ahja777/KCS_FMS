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
  id: number;
  requestNo: string;
  requestDate: string;
  bizType: string;
  ioType: string;
  customerId: number | null;
  customerNm: string;
  inputEmployee: string;
  originCd: string;
  originNm: string;
  destCd: string;
  destNm: string;
  incoterms: string;
  shippingDate: string;
  commodity: string;
  cargoType: string;
  weightKg: number;
  volumeCbm: number;
  quantity: number;
  totalAmount: number;
  currencyCd: string;
  status: string;
  remark: string;
  createdBy: string;
  createdDtm: string;
  updatedDtm: string;
  rateInfoList: Record<string, unknown>[];
  transportRateList: Record<string, unknown>[];
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  '01': { label: '미요청', color: '#6B7280', bgColor: '#F3F4F6' },
  '02': { label: '요청', color: '#2563EB', bgColor: '#DBEAFE' },
  '03': { label: '확인', color: '#7C3AED', bgColor: '#EDE9FE' },
  '04': { label: '승인', color: '#059669', bgColor: '#D1FAE5' },
  '05': { label: '거절', color: '#DC2626', bgColor: '#FEE2E2' },
};

const inputCls = "w-full px-2 py-1 bg-[var(--surface-100)] border border-[var(--border)] rounded text-sm text-center";

export default function QuoteRequestDetailPage() {
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const params = useParams();
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const [data, setData] = useState<QuoteRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<QuoteRequestDetail | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/quote/request?requestId=${params.id}`);
        if (!res.ok) {
          alert('견적요청을 찾을 수 없습니다.');
          router.push('/logis/quote/request');
          return;
        }
        const detail = await res.json();
        setData(detail);
        setEditData(detail);
      } catch (err) {
        console.error(err);
        alert('데이터 로드 실패');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [params.id, router]);

  const handleEdit = () => router.push(`/logis/quote/request/register?id=${params.id}`);
  const handleCancel = () => { setIsEditing(false); setEditData(data); };

  const handleSave = async () => {
    if (!editData || saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/quote/request', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editData.id,
          bizType: editData.bizType,
          ioType: editData.ioType,
          customerNm: editData.customerNm,
          inputEmployee: editData.inputEmployee,
          originCd: editData.originCd,
          originNm: editData.originNm,
          destCd: editData.destCd,
          destNm: editData.destNm,
          incoterms: editData.incoterms,
          shippingDate: editData.shippingDate || null,
          commodity: editData.commodity,
          cargoType: editData.cargoType,
          weightKg: editData.weightKg,
          volumeCbm: editData.volumeCbm,
          quantity: editData.quantity,
          totalAmount: editData.totalAmount,
          currencyCd: editData.currencyCd,
          status: editData.status,
          remark: editData.remark,
          rateInfoList: editData.rateInfoList,
          transportRateList: editData.transportRateList,
        }),
      });
      if (!res.ok) throw new Error('수정 실패');
      setData(editData);
      setIsEditing(false);
      alert('수정되었습니다.');
    } catch (err) {
      console.error(err);
      alert('수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof QuoteRequestDetail, value: unknown) => {
    if (editData) setEditData({ ...editData, [field]: value });
  };

  const handleCloseClick = () => setShowCloseModal(true);
  const handleConfirmClose = () => {
    setShowCloseModal(false);
    router.push(LIST_PATHS.QUOTE_REQUEST);
  };

  useCloseConfirm({
    showModal: showCloseModal,
    setShowModal: setShowCloseModal,
    onConfirmClose: handleConfirmClose,
  });

  if (loading) return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">로딩 중...</div>;
  if (!data) return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">데이터를 찾을 수 없습니다.</div>;

  const displayData = isEditing ? editData! : data;
  const isAir = displayData.bizType === 'AIR';
  const fieldCls = (editable: boolean) =>
    `w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${editable && isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`;

  return (
    <PageLayout title="견적요청 상세조회" subtitle="Logis > 물류견적관리 > 견적요청 상세조회" onClose={handleCloseClick}>
      <main ref={formRef} className="p-6">
        <div className="flex justify-end items-center mb-6">
          <div className="flex gap-2">
            <button onClick={() => router.push('/logis/quote/request')} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">목록</button>
            {isEditing ? (
              <>
                <button onClick={handleCancel} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">취소</button>
                <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] disabled:opacity-50">
                  {saving ? '저장중...' : '저장'}
                </button>
              </>
            ) : (
              <button onClick={handleEdit} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">수정</button>
            )}
          </div>
        </div>

        {/* 요청 정보 + 화주/화물 정보 */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="card p-6">
            <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">요청 정보</h3>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-[var(--muted)]">요청번호</span><span className="font-medium">{displayData.requestNo}</span></div>
              <div className="flex justify-between"><span className="text-[var(--muted)]">요청일자</span><span>{displayData.requestDate}</span></div>
              <div className="flex justify-between"><span className="text-[var(--muted)]">구분</span><span>{isAir ? '항공' : '해상'}</span></div>
              <div className="flex justify-between"><span className="text-[var(--muted)]">수출입</span><span>{displayData.ioType === 'EXPORT' ? '수출' : '수입'}</span></div>
              <div className="flex justify-between"><span className="text-[var(--muted)]">담당자</span><span>{displayData.inputEmployee || '-'}</span></div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--muted)]">상태</span>
                {isEditing ? (
                  <select value={displayData.status} onChange={(e) => handleChange('status', e.target.value)}
                    className="px-2 py-1 border border-[var(--border)] rounded text-sm bg-[var(--surface-50)]">
                    <option value="01">미요청</option><option value="02">요청</option><option value="03">확인</option>
                    <option value="04">승인</option><option value="05">거절</option>
                  </select>
                ) : (
                  <span className="px-2 py-1 text-xs rounded-full font-medium"
                    style={{ color: statusConfig[displayData.status]?.color, backgroundColor: statusConfig[displayData.status]?.bgColor }}>
                    {statusConfig[displayData.status]?.label}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">구간 정보</h3>
            <div className="space-y-3">
              <div><label className="block text-sm text-[var(--muted)]">출발지</label>
                <input type="text" value={`${displayData.originCd || ''} ${displayData.originNm || ''}`} disabled={!isEditing}
                  onChange={(e) => handleChange('originNm', e.target.value)} className={fieldCls(true)} /></div>
              <div><label className="block text-sm text-[var(--muted)]">도착지</label>
                <input type="text" value={`${displayData.destCd || ''} ${displayData.destNm || ''}`} disabled={!isEditing}
                  onChange={(e) => handleChange('destNm', e.target.value)} className={fieldCls(true)} /></div>
              <div><label className="block text-sm text-[var(--muted)]">Incoterms</label>
                <input type="text" value={displayData.incoterms || ''} disabled={!isEditing}
                  onChange={(e) => handleChange('incoterms', e.target.value)} className={fieldCls(true)} /></div>
              <div><label className="block text-sm text-[var(--muted)]">출고예정일</label>
                <input type="date" value={displayData.shippingDate || ''} disabled={!isEditing}
                  onChange={(e) => handleChange('shippingDate', e.target.value)} className={fieldCls(true)} /></div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">화물 정보</h3>
            <div className="space-y-3">
              <div><label className="block text-sm text-[var(--muted)]">거래처</label>
                <input type="text" value={displayData.customerNm || ''} disabled={!isEditing}
                  onChange={(e) => handleChange('customerNm', e.target.value)} className={fieldCls(true)} /></div>
              <div><label className="block text-sm text-[var(--muted)]">품목</label>
                <input type="text" value={displayData.commodity || ''} disabled={!isEditing}
                  onChange={(e) => handleChange('commodity', e.target.value)} className={fieldCls(true)} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-sm text-[var(--muted)]">중량(kg)</label>
                  <input type="number" value={displayData.weightKg || 0} disabled={!isEditing}
                    onChange={(e) => handleChange('weightKg', parseFloat(e.target.value) || 0)} className={fieldCls(true)} /></div>
                <div><label className="block text-sm text-[var(--muted)]">용적(CBM)</label>
                  <input type="number" value={displayData.volumeCbm || 0} disabled={!isEditing}
                    onChange={(e) => handleChange('volumeCbm', parseFloat(e.target.value) || 0)} className={fieldCls(true)} /></div>
              </div>
              <div><label className="block text-sm text-[var(--muted)]">화물구분</label>
                <input type="text" value={displayData.cargoType || ''} disabled className={fieldCls(false)} /></div>
            </div>
          </div>
        </div>

        {/* 운임정보 테이블 */}
        {displayData.rateInfoList && displayData.rateInfoList.length > 0 && (
          <div className="card mb-6">
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#7C3AED] rounded-full"></span>운임정보
              </h3>
            </div>
            <div className="overflow-x-auto p-4">
              <table className="table">
                <thead>
                  <tr>
                    <th className="text-center">No</th>
                    <th className="text-center">운임유형</th>
                    <th className="text-center">운임코드</th>
                    <th className="text-center">통화</th>
                    {isAir ? (
                      <>
                        <th className="text-center">Rate Min</th><th className="text-center">-45L</th>
                        <th className="text-center">+45</th><th className="text-center">+100</th>
                        <th className="text-center">+300</th><th className="text-center">+500</th>
                        <th className="text-center">+1000</th><th className="text-center">Rate/KG</th>
                        <th className="text-center">Rate BL</th>
                      </>
                    ) : (
                      <>
                        <th className="text-center">Per Min</th><th className="text-center">Per BL</th>
                        <th className="text-center">Per R.Ton</th><th className="text-center">DRY 20</th>
                        <th className="text-center">DRY 40</th><th className="text-center">Type A</th>
                        <th className="text-center">Type B</th><th className="text-center">Type C</th>
                        <th className="text-center">Bulk</th>
                      </>
                    )}
                    <th className="text-center">비고</th>
                  </tr>
                </thead>
                <tbody>
                  {displayData.rateInfoList.map((rate, i) => (
                    <tr key={i} className="border-t border-[var(--border)] hover:bg-[var(--surface-50)]">
                      <td className="p-2 text-center text-sm">{i + 1}</td>
                      <td className="p-2 text-center text-sm">{String(rate.rateType || '-')}</td>
                      <td className="p-2 text-center text-sm">{String(rate.rateCd || '-')}</td>
                      <td className="p-2 text-center text-sm">{String(rate.currencyCd || 'USD')}</td>
                      {isAir ? (
                        <>
                          <td className="p-2 text-center text-sm">{Number(rate.rateMin || 0).toLocaleString()}</td>
                          <td className="p-2 text-center text-sm">{Number(rate.rate45l || 0).toLocaleString()}</td>
                          <td className="p-2 text-center text-sm">{Number(rate.rate45 || 0).toLocaleString()}</td>
                          <td className="p-2 text-center text-sm">{Number(rate.rate100 || 0).toLocaleString()}</td>
                          <td className="p-2 text-center text-sm">{Number(rate.rate300 || 0).toLocaleString()}</td>
                          <td className="p-2 text-center text-sm">{Number(rate.rate500 || 0).toLocaleString()}</td>
                          <td className="p-2 text-center text-sm">{Number(rate.rate1000 || 0).toLocaleString()}</td>
                          <td className="p-2 text-center text-sm">{Number(rate.ratePerKg || 0).toLocaleString()}</td>
                          <td className="p-2 text-center text-sm">{Number(rate.rateBl || 0).toLocaleString()}</td>
                        </>
                      ) : (
                        <>
                          <td className="p-2 text-center text-sm">{Number(rate.ratePerMin || 0).toLocaleString()}</td>
                          <td className="p-2 text-center text-sm">{Number(rate.ratePerBl || 0).toLocaleString()}</td>
                          <td className="p-2 text-center text-sm">{Number(rate.ratePerRton || 0).toLocaleString()}</td>
                          <td className="p-2 text-center text-sm">{Number(rate.rateDry20 || 0).toLocaleString()}</td>
                          <td className="p-2 text-center text-sm">{Number(rate.rateDry40 || 0).toLocaleString()}</td>
                          <td className="p-2 text-center text-sm">{rate.cntrTypeACd ? `${rate.cntrTypeACd}: ${Number(rate.cntrTypeARate || 0).toLocaleString()}` : '-'}</td>
                          <td className="p-2 text-center text-sm">{rate.cntrTypeBCd ? `${rate.cntrTypeBCd}: ${Number(rate.cntrTypeBRate || 0).toLocaleString()}` : '-'}</td>
                          <td className="p-2 text-center text-sm">{rate.cntrTypeCCd ? `${rate.cntrTypeCCd}: ${Number(rate.cntrTypeCRate || 0).toLocaleString()}` : '-'}</td>
                          <td className="p-2 text-center text-sm">{Number(rate.rateBulk || 0).toLocaleString()}</td>
                        </>
                      )}
                      <td className="p-2 text-center text-sm">{String(rate.remark || '-')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 운송요율 테이블 */}
        {displayData.transportRateList && displayData.transportRateList.length > 0 && (
          <div className="card mb-6">
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#059669] rounded-full"></span>운송요율
              </h3>
            </div>
            <div className="overflow-x-auto p-4">
              <table className="table">
                <thead>
                  <tr>
                    <th className="text-center">No</th>
                    <th className="text-center">운임코드</th>
                    <th className="text-center">출발지</th>
                    <th className="text-center">도착지</th>
                    {isAir ? (
                      <>
                        <th className="text-center">운송구분</th>
                        <th className="text-center">차량유형</th>
                        <th className="text-center">금액</th>
                      </>
                    ) : (
                      <>
                        <th className="text-center">LCL</th>
                        <th className="text-center">20&apos;</th>
                        <th className="text-center">40&apos;</th>
                      </>
                    )}
                    <th className="text-center">E.T.C</th>
                    <th className="text-center">담당자</th>
                    <th className="text-center">연락처</th>
                  </tr>
                </thead>
                <tbody>
                  {displayData.transportRateList.map((tr, i) => (
                    <tr key={i} className="border-t border-[var(--border)] hover:bg-[var(--surface-50)]">
                      <td className="p-2 text-center text-sm">{i + 1}</td>
                      <td className="p-2 text-center text-sm">{String(tr.rateCd || '-')}</td>
                      <td className="p-2 text-center text-sm">{tr.originNm ? `${tr.originNm} (${tr.originCd || ''})` : String(tr.originCd || '-')}</td>
                      <td className="p-2 text-center text-sm">{tr.destNm ? `${tr.destNm} (${tr.destCd || ''})` : String(tr.destCd || '-')}</td>
                      {isAir ? (
                        <>
                          <td className="p-2 text-center text-sm">{String(tr.transportType || '-')}</td>
                          <td className="p-2 text-center text-sm">{String(tr.vehicleType || '-')}</td>
                          <td className="p-2 text-center text-sm">{Number(tr.amount || 0).toLocaleString()}</td>
                        </>
                      ) : (
                        <>
                          <td className="p-2 text-center text-sm">{Number(tr.rateLcl || 0).toLocaleString()}</td>
                          <td className="p-2 text-center text-sm">{Number(tr.rate20ft || 0).toLocaleString()}</td>
                          <td className="p-2 text-center text-sm">{Number(tr.rate40ft || 0).toLocaleString()}</td>
                        </>
                      )}
                      <td className="p-2 text-center text-sm">{String(tr.etcDesc || '-')}</td>
                      <td className="p-2 text-center text-sm">{String(tr.contactNm || '-')}</td>
                      <td className="p-2 text-center text-sm">{tr.contactTel || tr.contactEmail ? `${tr.contactTel || ''} ${tr.contactEmail || ''}`.trim() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 비고 */}
        <div className="card p-6 mb-4">
          <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">비고</h3>
          <textarea value={displayData.remark || ''} disabled={!isEditing}
            onChange={(e) => handleChange('remark', e.target.value)}
            rows={3} className={`w-full px-3 py-2 border border-[var(--border)] rounded-lg resize-none ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} />
        </div>

        <div className="mt-4 text-sm text-[var(--muted)]">
          <span>등록일: {data.createdDtm}</span>
          {data.updatedDtm && <span className="ml-4">수정일: {data.updatedDtm}</span>}
        </div>
      </main>
      <CloseConfirmModal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} onConfirm={handleConfirmClose} />
    </PageLayout>
  );
}
