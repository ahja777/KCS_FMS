'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';

interface SNDetailData {
  id: number;
  snNo: string;
  shipmentId: number | null;
  mblId: number | null;
  hblId: number | null;
  senderName: string;
  recipientName: string;
  recipientEmail: string;
  transportMode: string;
  carrierName: string;
  vesselFlight: string;
  voyageNo: string;
  pol: string;
  pod: string;
  etd: string;
  eta: string;
  commodityDesc: string;
  packageQty: number;
  grossWeight: number;
  volume: number;
  status: string;
  remark: string;
  sentAt: string;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '작성중', color: 'bg-gray-500' },
  SENT: { label: '발송완료', color: 'bg-green-500' },
  FAILED: { label: '발송실패', color: 'bg-red-500' },
};

export default function SNSeaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [data, setData] = useState<SNDetailData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<SNDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/sn/sea?snId=${params.id}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
          setEditData(result);
        }
      } catch (error) {
        console.error('Failed to fetch SN:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  const handleEdit = () => router.push(`/logis/sn/sea/register?id=${params.id}`);
  const handleCancel = () => { setIsEditing(false); setEditData(data); };

  const handleSave = async () => {
    if (!editData) return;
    try {
      const response = await fetch('/api/sn/sea', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      if (response.ok) {
        setData(editData);
        setIsEditing(false);
        alert('S/N이 수정되었습니다.');
      } else {
        alert('수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to update SN:', error);
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  const handleChange = (field: keyof SNDetailData, value: string | number) => {
    if (editData) setEditData({ ...editData, [field]: value });
  };

  const handleDelete = async () => {
    if (!data) return;
    if (confirm('이 S/N을 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`/api/sn/sea?ids=${data.id}`, { method: 'DELETE' });
        if (response.ok) {
          alert('S/N이 삭제되었습니다.');
          router.push('/logis/sn/sea');
        } else {
          alert('삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('Failed to delete SN:', error);
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleCloseClick = () => setShowCloseModal(true);
  const handleConfirmClose = () => { setShowCloseModal(false); router.back(); };

  useCloseConfirm({ showModal: showCloseModal, setShowModal: setShowCloseModal, onConfirmClose: handleConfirmClose });

  if (loading) return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">로딩 중...</div>;
  if (!data) return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">S/N을 찾을 수 없습니다.</div>;

  const displayData = isEditing ? editData! : data;
  const statusInfo = statusConfig[displayData.status] || { label: displayData.status, color: 'bg-gray-500' };

  return (
        <PageLayout title="S/N 상세조회 (해상)" subtitle="Logis > S/N > S/N 상세조회 (해상)" onClose={handleCloseClick} >
        <main ref={formRef} className="p-6">
          <div className="flex justify-end items-center mb-6">
            <div className="flex gap-2">
              <button onClick={() => router.push('/logis/sn/sea')} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">목록</button>
              {isEditing ? (
                <>
                  <button onClick={handleCancel} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">취소</button>
                  <button onClick={handleSave} className="px-6 py-2 font-semibold rounded-lg bg-[var(--surface-100)] text-[var(--foreground)] hover:bg-[var(--surface-200)]">저장</button>
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
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">S/N 번호</label><input type="text" value={displayData.snNo || ''} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">상태</label>
                  {isEditing ? (
                    <select value={displayData.status || ''} onChange={e => handleChange('status', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg">
                      <option value="DRAFT">작성중</option><option value="SENT">발송완료</option><option value="FAILED">발송실패</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2"><span className={`px-2 py-1 text-xs rounded-full text-white ${statusInfo.color}`}>{statusInfo.label}</span></div>
                  )}
                </div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">발송인</label><input type="text" value={displayData.senderName || ''} disabled={!isEditing} onChange={e => handleChange('senderName', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">발송일시</label><input type="text" value={displayData.sentAt || '-'} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">수신인</label><input type="text" value={displayData.recipientName || ''} disabled={!isEditing} onChange={e => handleChange('recipientName', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">수신 이메일</label><input type="email" value={displayData.recipientEmail || ''} disabled={!isEditing} onChange={e => handleChange('recipientEmail', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
              </div>
            </div>

            {/* 운송 정보 */}
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">운송 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">선사</label><input type="text" value={displayData.carrierName || ''} disabled={!isEditing} onChange={e => handleChange('carrierName', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">선명/편명</label><input type="text" value={displayData.vesselFlight || ''} disabled={!isEditing} onChange={e => handleChange('vesselFlight', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">항차</label><input type="text" value={displayData.voyageNo || ''} disabled={!isEditing} onChange={e => handleChange('voyageNo', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">운송모드</label><input type="text" value={displayData.transportMode || ''} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
              </div>
            </div>

            {/* 구간/일정 정보 */}
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">구간/일정 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">출발항 (POL)</label><input type="text" value={displayData.pol || ''} disabled={!isEditing} onChange={e => handleChange('pol', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">도착항 (POD)</label><input type="text" value={displayData.pod || ''} disabled={!isEditing} onChange={e => handleChange('pod', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ETD</label><input type="date" value={displayData.etd || ''} disabled={!isEditing} onChange={e => handleChange('etd', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ETA</label><input type="date" value={displayData.eta || ''} disabled={!isEditing} onChange={e => handleChange('eta', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
              </div>
            </div>

            {/* 화물 정보 */}
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">화물 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">품목</label><input type="text" value={displayData.commodityDesc || ''} disabled={!isEditing} onChange={e => handleChange('commodityDesc', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">포장 수량</label><input type="number" value={displayData.packageQty || 0} disabled={!isEditing} onChange={e => handleChange('packageQty', parseInt(e.target.value) || 0)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">총중량 (KG)</label><input type="number" step="0.01" value={displayData.grossWeight || 0} disabled={!isEditing} onChange={e => handleChange('grossWeight', parseFloat(e.target.value) || 0)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">용적 (CBM)</label><input type="number" step="0.01" value={displayData.volume || 0} disabled={!isEditing} onChange={e => handleChange('volume', parseFloat(e.target.value) || 0)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
              </div>
            </div>
          </div>

          {/* 비고 */}
          <div className="card p-6 mb-6">
            <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">비고</h3>
            <textarea value={displayData.remark || ''} disabled={!isEditing} onChange={e => handleChange('remark', e.target.value)} rows={3} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg resize-none ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} />
          </div>

          <div className="text-sm text-[var(--muted)]"><span>등록일: {data.createdAt}</span></div>
        </main>
      <CloseConfirmModal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} onConfirm={handleConfirmClose} />
    </PageLayout>
  );
}
