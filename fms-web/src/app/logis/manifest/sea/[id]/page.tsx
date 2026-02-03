'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';

interface ManifestDetailData {
  id: string;
  shipmentId: string;
  mblNo: string;
  hblNo: string;
  manifestType: string;
  filingType: string;
  filingNo: string;
  filingDate: string;
  shipperName: string;
  shipperAddr: string;
  consigneeName: string;
  consigneeAddr: string;
  notifyName: string;
  notifyAddr: string;
  goodsDesc: string;
  containerNo: string;
  sealNo: string;
  weight: number;
  weightUnit: string;
  responseCode: string;
  responseMsg: string;
  status: string;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '작성중', color: 'bg-gray-500' },
  SUBMITTED: { label: '전송', color: 'bg-blue-500' },
  ACCEPTED: { label: '수리', color: 'bg-green-500' },
  REJECTED: { label: '반려', color: 'bg-red-500' },
};

export default function ManifestSeaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [data, setData] = useState<ManifestDetailData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<ManifestDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/manifest/sea?manifestId=${params.id}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
          setEditData(result);
        }
      } catch (error) {
        console.error('Failed to fetch manifest:', error);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchData();
  }, [params.id]);

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => { setIsEditing(false); setEditData(data); };

  const handleSave = async () => {
    if (!editData) return;
    try {
      const response = await fetch('/api/manifest/sea', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      if (response.ok) {
        setData(editData);
        setIsEditing(false);
        alert('적하목록이 수정되었습니다.');
      } else {
        alert('수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to update:', error);
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  const handleChange = (field: keyof ManifestDetailData, value: string | number) => {
    if (editData) setEditData({ ...editData, [field]: value });
  };

  const handleDelete = async () => {
    if (!data) return;
    if (confirm('이 적하목록을 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`/api/manifest/sea?ids=${data.id}`, { method: 'DELETE' });
        if (response.ok) {
          alert('적하목록이 삭제되었습니다.');
          router.push('/logis/manifest/sea');
        } else {
          alert('삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('Failed to delete:', error);
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleCloseClick = () => setShowCloseModal(true);
  const handleConfirmClose = () => { setShowCloseModal(false); router.back(); };
  useCloseConfirm({ showModal: showCloseModal, setShowModal: setShowCloseModal, onConfirmClose: handleConfirmClose });

  if (loading) return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">로딩 중...</div>;
  if (!data) return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">적하목록을 찾을 수 없습니다.</div>;

  const displayData = isEditing ? editData! : data;
  const statusInfo = statusConfig[displayData.status] || { label: displayData.status, color: 'bg-gray-500' };

  return (
        <PageLayout title="적하목록 상세조회 (해상)" subtitle="Logis > 적하목록 > 적하목록 상세조회 (해상)" onClose={handleCloseClick} >
        <main ref={formRef} className="p-6">
          <div className="flex justify-end items-center mb-6">
            <div className="flex gap-2">
              <button onClick={() => router.push('/logis/manifest/sea')} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">목록</button>
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
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">기본 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Filing No</label><input type="text" value={displayData.filingNo || ''} disabled={!isEditing} onChange={e => handleChange('filingNo', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">상태</label>
                  {isEditing ? (
                    <select value={displayData.status || ''} onChange={e => handleChange('status', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg">
                      <option value="DRAFT">작성중</option><option value="SUBMITTED">전송</option><option value="ACCEPTED">수리</option><option value="REJECTED">반려</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2"><span className={`px-2 py-1 text-xs rounded-full text-white ${statusInfo.color}`}>{statusInfo.label}</span></div>
                  )}
                </div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Filing Type</label><input type="text" value={displayData.filingType || ''} disabled={!isEditing} onChange={e => handleChange('filingType', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Filing Date</label><input type="date" value={displayData.filingDate || ''} disabled={!isEditing} onChange={e => handleChange('filingDate', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">M B/L No</label><input type="text" value={displayData.mblNo || ''} disabled={!isEditing} onChange={e => handleChange('mblNo', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">H B/L No</label><input type="text" value={displayData.hblNo || ''} disabled={!isEditing} onChange={e => handleChange('hblNo', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">응답 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Response Code</label><input type="text" value={displayData.responseCode || ''} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Response Message</label><textarea value={displayData.responseMsg || ''} disabled rows={2} className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)] resize-none" /></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">Shipper</h3>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Name</label><input type="text" value={displayData.shipperName || ''} disabled={!isEditing} onChange={e => handleChange('shipperName', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Address</label><textarea value={displayData.shipperAddr || ''} disabled={!isEditing} onChange={e => handleChange('shipperAddr', e.target.value)} rows={2} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg resize-none ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
              </div>
            </div>
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">Consignee</h3>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Name</label><input type="text" value={displayData.consigneeName || ''} disabled={!isEditing} onChange={e => handleChange('consigneeName', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Address</label><textarea value={displayData.consigneeAddr || ''} disabled={!isEditing} onChange={e => handleChange('consigneeAddr', e.target.value)} rows={2} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg resize-none ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
              </div>
            </div>
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">Notify Party</h3>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Name</label><input type="text" value={displayData.notifyName || ''} disabled={!isEditing} onChange={e => handleChange('notifyName', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Address</label><textarea value={displayData.notifyAddr || ''} disabled={!isEditing} onChange={e => handleChange('notifyAddr', e.target.value)} rows={2} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg resize-none ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
              </div>
            </div>
          </div>

          <div className="card p-6 mb-6">
            <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">화물/컨테이너 정보</h3>
            <div className="grid grid-cols-4 gap-4">
              <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Container No</label><input type="text" value={displayData.containerNo || ''} disabled={!isEditing} onChange={e => handleChange('containerNo', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
              <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Seal No</label><input type="text" value={displayData.sealNo || ''} disabled={!isEditing} onChange={e => handleChange('sealNo', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
              <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Weight</label><input type="number" value={displayData.weight || 0} disabled={!isEditing} onChange={e => handleChange('weight', parseFloat(e.target.value) || 0)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
              <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">단위</label><input type="text" value={displayData.weightUnit || ''} disabled={!isEditing} onChange={e => handleChange('weightUnit', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
              <div className="col-span-4"><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Goods Description</label><textarea value={displayData.goodsDesc || ''} disabled={!isEditing} onChange={e => handleChange('goodsDesc', e.target.value)} rows={2} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg resize-none ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
            </div>
          </div>

          <div className="text-sm text-[var(--muted)]"><span>등록일: {data.createdAt}</span></div>
        </main>
      <CloseConfirmModal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} onConfirm={handleConfirmClose} />
    </PageLayout>
  );
}
