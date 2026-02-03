'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';

interface CustomsDetailData {
  id: string;
  declarationNo: string;
  declarationType: string;
  declarationDate: string;
  brokerId: string;
  brokerName: string;
  declarant: string;
  importerExporter: string;
  brn: string;
  hsCode: string;
  goodsDesc: string;
  countryOrigin: string;
  packageQty: number;
  grossWeight: number;
  declaredValue: number;
  currency: string;
  dutyAmount: number;
  vatAmount: number;
  totalTax: number;
  status: string;
  clearanceDate: string;
  releaseDate: string;
  remarks: string;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '작성중', color: 'bg-gray-500' },
  SUBMITTED: { label: '신고', color: 'bg-blue-500' },
  ACCEPTED: { label: '수리', color: 'bg-green-500' },
  RELEASED: { label: '반출', color: 'bg-purple-500' },
  REJECTED: { label: '반려', color: 'bg-red-500' },
};

export default function CustomsSeaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [data, setData] = useState<CustomsDetailData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<CustomsDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/customs/sea?declarationId=${params.id}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
          setEditData(result);
        }
      } catch (error) {
        console.error('Failed to fetch customs:', error);
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
      const response = await fetch('/api/customs/sea', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      if (response.ok) {
        setData(editData);
        setIsEditing(false);
        alert('통관정보가 수정되었습니다.');
      } else {
        alert('수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to update:', error);
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  const handleChange = (field: keyof CustomsDetailData, value: string | number) => {
    if (editData) setEditData({ ...editData, [field]: value });
  };

  const handleDelete = async () => {
    if (!data) return;
    if (confirm('이 통관정보를 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`/api/customs/sea?ids=${data.id}`, { method: 'DELETE' });
        if (response.ok) {
          alert('통관정보가 삭제되었습니다.');
          router.push('/logis/customs/sea');
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
  if (!data) return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">통관정보를 찾을 수 없습니다.</div>;

  const displayData = isEditing ? editData! : data;
  const statusInfo = statusConfig[displayData.status] || { label: displayData.status, color: 'bg-gray-500' };

  return (
        <PageLayout title="통관 상세조회 (해상)" subtitle="Logis > 통관관리 > 통관 상세조회 (해상)" onClose={handleCloseClick} >
        <main ref={formRef} className="p-6">
          <div className="flex justify-end items-center mb-6">
            <div className="flex gap-2">
              <button onClick={() => router.push('/logis/customs/sea')} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">목록</button>
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
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">신고번호</label><input type="text" value={displayData.declarationNo || ''} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">상태</label>
                  {isEditing ? (
                    <select value={displayData.status || ''} onChange={e => handleChange('status', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg">
                      <option value="DRAFT">작성중</option><option value="SUBMITTED">신고</option><option value="ACCEPTED">수리</option><option value="RELEASED">반출</option><option value="REJECTED">반려</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2"><span className={`px-2 py-1 text-xs rounded-full text-white ${statusInfo.color}`}>{statusInfo.label}</span></div>
                  )}
                </div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">신고유형</label><input type="text" value={displayData.declarationType || ''} disabled={!isEditing} onChange={e => handleChange('declarationType', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">신고일</label><input type="date" value={displayData.declarationDate || ''} disabled={!isEditing} onChange={e => handleChange('declarationDate', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">관세사</label><input type="text" value={displayData.brokerName || ''} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">신고인</label><input type="text" value={displayData.declarant || ''} disabled={!isEditing} onChange={e => handleChange('declarant', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">수출입자 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">수출입자</label><input type="text" value={displayData.importerExporter || ''} disabled={!isEditing} onChange={e => handleChange('importerExporter', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">사업자등록번호</label><input type="text" value={displayData.brn || ''} disabled={!isEditing} onChange={e => handleChange('brn', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">원산지국</label><input type="text" value={displayData.countryOrigin || ''} disabled={!isEditing} onChange={e => handleChange('countryOrigin', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">화물 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">HS Code</label><input type="text" value={displayData.hsCode || ''} disabled={!isEditing} onChange={e => handleChange('hsCode', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">포장 수량</label><input type="number" value={displayData.packageQty || 0} disabled={!isEditing} onChange={e => handleChange('packageQty', parseInt(e.target.value) || 0)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div className="col-span-2"><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">품목</label><input type="text" value={displayData.goodsDesc || ''} disabled={!isEditing} onChange={e => handleChange('goodsDesc', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">총중량 (KG)</label><input type="number" step="0.01" value={displayData.grossWeight || 0} disabled={!isEditing} onChange={e => handleChange('grossWeight', parseFloat(e.target.value) || 0)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">세액 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">신고가격</label><input type="number" value={displayData.declaredValue || 0} disabled={!isEditing} onChange={e => handleChange('declaredValue', parseFloat(e.target.value) || 0)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">통화</label><input type="text" value={displayData.currency || ''} disabled={!isEditing} onChange={e => handleChange('currency', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">관세</label><input type="number" value={displayData.dutyAmount || 0} disabled={!isEditing} onChange={e => handleChange('dutyAmount', parseFloat(e.target.value) || 0)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">부가세</label><input type="number" value={displayData.vatAmount || 0} disabled={!isEditing} onChange={e => handleChange('vatAmount', parseFloat(e.target.value) || 0)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">총세액</label><input type="number" value={displayData.totalTax || 0} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">통관일</label><input type="date" value={displayData.clearanceDate || ''} disabled={!isEditing} onChange={e => handleChange('clearanceDate', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
              </div>
            </div>
          </div>

          <div className="card p-6 mb-6">
            <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">비고</h3>
            <textarea value={displayData.remarks || ''} disabled={!isEditing} onChange={e => handleChange('remarks', e.target.value)} rows={3} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg resize-none ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} />
          </div>

          <div className="text-sm text-[var(--muted)]"><span>등록일: {data.createdAt}</span></div>
        </main>
      <CloseConfirmModal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} onConfirm={handleConfirmClose} />
    </PageLayout>
  );
}
