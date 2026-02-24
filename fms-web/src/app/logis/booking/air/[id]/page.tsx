'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { LIST_PATHS } from '@/constants/paths';

interface BookingDetailData {
  id: number;
  bookingNo: string;
  carrierBookingNo: string;
  carrierId: number | null;
  carrierName: string;
  flightNo: string;
  flightDate: string;
  origin: string;
  destination: string;
  etd: string;
  eta: string;
  commodityDesc: string;
  pkgQty: number;
  pkgType: string;
  grossWeight: number;
  chargeableWeight: number;
  volume: number;
  status: string;
  remark: string;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '임시저장', color: 'bg-gray-500' },
  REQUESTED: { label: '요청', color: 'bg-blue-500' },
  CONFIRMED: { label: '확정', color: 'bg-green-500' },
  CANCELLED: { label: '취소', color: 'bg-red-500' },
};

export default function BookingAirDetailPage() {
  const router = useRouter();
  const params = useParams();
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [data, setData] = useState<BookingDetailData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<BookingDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/booking/air?bookingId=${params.id}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
          setEditData(result);
        }
      } catch (error) {
        console.error('Failed to fetch booking:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  const handleEdit = () => {
    router.push(`/logis/booking/air/register?id=${params.id}`);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(data);
  };

  const handleSave = async () => {
    if (!editData) return;

    try {
      const response = await fetch('/api/booking/air', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });

      if (response.ok) {
        setData(editData);
        setIsEditing(false);
        alert('부킹이 수정되었습니다.');
      } else {
        alert('수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to update booking:', error);
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  const handleChange = (field: keyof BookingDetailData, value: string | number) => {
    if (editData) {
      setEditData({ ...editData, [field]: value });
    }
  };

  const handleDelete = async () => {
    if (!data) return;

    if (confirm('이 부킹을 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`/api/booking/air?ids=${data.id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          alert('부킹이 삭제되었습니다.');
          router.push('/logis/booking/air');
        } else {
          alert('삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('Failed to delete booking:', error);
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleCloseClick = () => {
    setShowCloseModal(true);
  };

  const handleConfirmClose = () => {
    setShowCloseModal(false);
    router.push(LIST_PATHS.BOOKING_AIR);
  };

  useCloseConfirm({
    showModal: showCloseModal,
    setShowModal: setShowCloseModal,
    onConfirmClose: handleConfirmClose,
  });

  if (loading) {
    return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">로딩 중...</div>;
  }

  if (!data) {
    return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">부킹을 찾을 수 없습니다.</div>;
  }

  const displayData = isEditing ? editData! : data;
  const statusInfo = statusConfig[displayData.status] || { label: displayData.status, color: 'bg-gray-500' };

  return (
        <PageLayout title="부킹 상세조회 (항공)" subtitle="Logis > Booking > 부킹 상세조회 (항공)" onClose={handleCloseClick} >
        <main ref={formRef} className="p-6">
          <div className="flex justify-end items-center mb-6">
            <div className="flex gap-2">
              <button onClick={() => router.push('/logis/booking/air')} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">목록</button>
              {isEditing ? (
                <>
                  <button onClick={handleCancel} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">취소</button>
                  <button onClick={handleSave} className="px-6 py-2 font-semibold bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">저장</button>
                </>
              ) : (
                <>
                  <button onClick={handleEdit} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">수정</button>
                  <button onClick={handleDelete} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">삭제</button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* 기본 정보 */}
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">기본 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">부킹 번호</label>
                  <input type="text" value={displayData.bookingNo || ''} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">상태</label>
                  {isEditing ? (
                    <select value={displayData.status || ''} onChange={e => handleChange('status', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg">
                      <option value="DRAFT">임시저장</option>
                      <option value="REQUESTED">요청</option>
                      <option value="CONFIRMED">확정</option>
                      <option value="CANCELLED">취소</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2">
                      <span className={`px-2 py-1 text-xs rounded-full text-white ${statusInfo.color}`}>{statusInfo.label}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">항공사 부킹번호</label>
                  <input type="text" value={displayData.carrierBookingNo || ''} disabled={!isEditing} onChange={e => handleChange('carrierBookingNo', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">항공사</label>
                  <input type="text" value={displayData.carrierName || ''} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">편명</label>
                  <input type="text" value={displayData.flightNo || ''} disabled={!isEditing} onChange={e => handleChange('flightNo', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">운항일</label>
                  <input type="date" value={displayData.flightDate || ''} disabled={!isEditing} onChange={e => handleChange('flightDate', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} />
                </div>
              </div>
            </div>

            {/* 구간/일정 정보 */}
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">구간/일정 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">출발공항</label>
                  <input type="text" value={displayData.origin || ''} disabled={!isEditing} onChange={e => handleChange('origin', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">도착공항</label>
                  <input type="text" value={displayData.destination || ''} disabled={!isEditing} onChange={e => handleChange('destination', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ETD (출발예정)</label>
                  <input type="datetime-local" value={displayData.etd?.replace(' ', 'T') || ''} disabled={!isEditing} onChange={e => handleChange('etd', e.target.value.replace('T', ' '))} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ETA (도착예정)</label>
                  <input type="datetime-local" value={displayData.eta?.replace(' ', 'T') || ''} disabled={!isEditing} onChange={e => handleChange('eta', e.target.value.replace('T', ' '))} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} />
                </div>
              </div>
            </div>

            {/* 화물 정보 */}
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">화물 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">품목</label>
                  <input type="text" value={displayData.commodityDesc || ''} disabled={!isEditing} onChange={e => handleChange('commodityDesc', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">포장 수량</label>
                  <input type="number" value={displayData.pkgQty || 0} disabled={!isEditing} onChange={e => handleChange('pkgQty', parseInt(e.target.value) || 0)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">포장 단위</label>
                  <input type="text" value={displayData.pkgType || ''} disabled={!isEditing} onChange={e => handleChange('pkgType', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} />
                </div>
              </div>
            </div>

            {/* 중량/용적 정보 */}
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">중량/용적 정보</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-[var(--surface-50)] rounded-lg">
                  <div className="text-sm text-[var(--muted)]">총중량 (KG)</div>
                  {isEditing ? (
                    <input type="number" step="0.01" value={displayData.grossWeight || 0} onChange={e => handleChange('grossWeight', parseFloat(e.target.value) || 0)} className="w-full text-center text-lg font-bold bg-[var(--surface-50)] border border-[var(--border)] rounded mt-1" />
                  ) : (
                    <div className="text-lg font-bold">{(displayData.grossWeight || 0).toLocaleString()}</div>
                  )}
                </div>
                <div className="text-center p-3 bg-[var(--surface-50)] rounded-lg">
                  <div className="text-sm text-[var(--muted)]">부피중량 (KG)</div>
                  {isEditing ? (
                    <input type="number" step="0.01" value={displayData.chargeableWeight || 0} onChange={e => handleChange('chargeableWeight', parseFloat(e.target.value) || 0)} className="w-full text-center text-lg font-bold bg-[var(--surface-50)] border border-[var(--border)] rounded mt-1" />
                  ) : (
                    <div className="text-lg font-bold">{(displayData.chargeableWeight || 0).toLocaleString()}</div>
                  )}
                </div>
                <div className="text-center p-3 bg-[var(--surface-50)] rounded-lg">
                  <div className="text-sm text-[var(--muted)]">용적 (CBM)</div>
                  {isEditing ? (
                    <input type="number" step="0.01" value={displayData.volume || 0} onChange={e => handleChange('volume', parseFloat(e.target.value) || 0)} className="w-full text-center text-lg font-bold bg-[var(--surface-50)] border border-[var(--border)] rounded mt-1" />
                  ) : (
                    <div className="text-lg font-bold">{(displayData.volume || 0).toFixed(2)}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 비고 */}
          <div className="card p-6 mb-6">
            <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">비고</h3>
            <textarea
              value={displayData.remark || ''}
              disabled={!isEditing}
              onChange={e => handleChange('remark', e.target.value)}
              rows={3}
              className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg resize-none ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`}
            />
          </div>

          <div className="text-sm text-[var(--muted)]">
            <span>등록일: {data.createdAt}</span>
          </div>
        </main>
      <CloseConfirmModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onConfirm={handleConfirmClose}
      />
    </PageLayout>
  );
}
