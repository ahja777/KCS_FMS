'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { LIST_PATHS } from '@/constants/paths';

interface SRDetailData {
  id: number;
  srNo: string;
  shipmentId: number | null;
  bookingId: number | null;
  customerId: string | null;
  customerName: string;
  transportMode: string;
  tradeType: string;
  shipperName: string;
  shipperAddress: string;
  consigneeName: string;
  consigneeAddress: string;
  notifyParty: string;
  pol: string;
  pod: string;
  cargoReadyDate: string;
  commodityDesc: string;
  packageQty: number;
  packageType: string;
  grossWeight: number;
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

export default function SRSeaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [data, setData] = useState<SRDetailData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<SRDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/sr/sea?srId=${params.id}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
          setEditData(result);
        }
      } catch (error) {
        console.error('Failed to fetch SR:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => { setIsEditing(false); setEditData(data); };

  const handleSave = async () => {
    if (!editData) return;
    try {
      const response = await fetch('/api/sr/sea', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      if (response.ok) {
        setData(editData);
        setIsEditing(false);
        alert('S/R이 수정되었습니다.');
      } else {
        alert('수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to update SR:', error);
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  const handleChange = (field: keyof SRDetailData, value: string | number) => {
    if (editData) setEditData({ ...editData, [field]: value });
  };

  const handleDelete = async () => {
    if (!data) return;
    if (confirm('이 S/R을 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`/api/sr/sea?ids=${data.id}`, { method: 'DELETE' });
        if (response.ok) {
          alert('S/R이 삭제되었습니다.');
          router.push('/logis/sr/sea');
        } else {
          alert('삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('Failed to delete SR:', error);
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleCloseClick = () => setShowCloseModal(true);
  const handleConfirmClose = () => { setShowCloseModal(false); router.push(LIST_PATHS.SR_SEA); };

  useCloseConfirm({ showModal: showCloseModal, setShowModal: setShowCloseModal, onConfirmClose: handleConfirmClose });

  if (loading) return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">로딩 중...</div>;
  if (!data) return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">S/R을 찾을 수 없습니다.</div>;

  const displayData = isEditing ? editData! : data;
  const statusInfo = statusConfig[displayData.status] || { label: displayData.status, color: 'bg-gray-500' };

  return (
        <PageLayout title="S/R 상세조회 (해상)" subtitle="Logis > S/R > S/R 상세조회 (해상)" onClose={handleCloseClick} >
        <main ref={formRef} className="p-6">
          <div className="flex justify-end items-center mb-6">
            <div className="flex gap-2">
              <button onClick={() => router.push('/logis/sr/sea')} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">목록</button>
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
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">S/R 번호</label><input type="text" value={displayData.srNo || ''} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">상태</label>
                  {isEditing ? (
                    <select value={displayData.status || ''} onChange={e => handleChange('status', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg">
                      <option value="DRAFT">임시저장</option><option value="REQUESTED">요청</option><option value="CONFIRMED">확정</option><option value="CANCELLED">취소</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2"><span className={`px-2 py-1 text-xs rounded-full text-white ${statusInfo.color}`}>{statusInfo.label}</span></div>
                  )}
                </div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">고객사</label><input type="text" value={displayData.customerName || ''} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Cargo Ready Date</label><input type="date" value={displayData.cargoReadyDate || ''} disabled={!isEditing} onChange={e => handleChange('cargoReadyDate', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
              </div>
            </div>

            {/* 구간 정보 */}
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">구간 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">출발항 (POL)</label><input type="text" value={displayData.pol || ''} disabled={!isEditing} onChange={e => handleChange('pol', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">도착항 (POD)</label><input type="text" value={displayData.pod || ''} disabled={!isEditing} onChange={e => handleChange('pod', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
              </div>
            </div>

            {/* Shipper 정보 */}
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">Shipper 정보</h3>
              <div className="grid grid-cols-1 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Shipper</label><input type="text" value={displayData.shipperName || ''} disabled={!isEditing} onChange={e => handleChange('shipperName', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Shipper 주소</label><textarea value={displayData.shipperAddress || ''} disabled={!isEditing} onChange={e => handleChange('shipperAddress', e.target.value)} rows={2} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg resize-none ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
              </div>
            </div>

            {/* Consignee 정보 */}
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">Consignee 정보</h3>
              <div className="grid grid-cols-1 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Consignee</label><input type="text" value={displayData.consigneeName || ''} disabled={!isEditing} onChange={e => handleChange('consigneeName', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Consignee 주소</label><textarea value={displayData.consigneeAddress || ''} disabled={!isEditing} onChange={e => handleChange('consigneeAddress', e.target.value)} rows={2} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg resize-none ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Notify Party</label><input type="text" value={displayData.notifyParty || ''} disabled={!isEditing} onChange={e => handleChange('notifyParty', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
              </div>
            </div>
          </div>

          {/* 화물 정보 */}
          <div className="card p-6 mb-6">
            <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">화물 정보</h3>
            <div className="grid grid-cols-5 gap-4">
              <div className="col-span-2"><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">품목</label><input type="text" value={displayData.commodityDesc || ''} disabled={!isEditing} onChange={e => handleChange('commodityDesc', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
              <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">포장 수량</label><input type="number" value={displayData.packageQty || 0} disabled={!isEditing} onChange={e => handleChange('packageQty', parseInt(e.target.value) || 0)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
              <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">총중량 (KG)</label><input type="number" step="0.01" value={displayData.grossWeight || 0} disabled={!isEditing} onChange={e => handleChange('grossWeight', parseFloat(e.target.value) || 0)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
              <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">용적 (CBM)</label><input type="number" step="0.01" value={displayData.volume || 0} disabled={!isEditing} onChange={e => handleChange('volume', parseFloat(e.target.value) || 0)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
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
