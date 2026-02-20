'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import AWBPrintModal from '@/components/AWBPrintModal';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { LIST_PATHS } from '@/constants/paths';

interface AWBDetailData {
  mawb_id: number;
  mawb_no: string;
  import_type: string;
  airline_code: string;
  flight_no: string;
  origin_airport_cd: string;
  dest_airport_cd: string;
  etd_dt: string;
  etd_time: string;
  eta_dt: string;
  eta_time: string;
  atd_dt: string;
  atd_time: string;
  ata_dt: string;
  ata_time: string;
  issue_dt: string;
  issue_place: string;
  shipper_nm: string;
  shipper_addr: string;
  consignee_nm: string;
  consignee_addr: string;
  notify_party: string;
  pieces: number;
  gross_weight_kg: number;
  charge_weight_kg: number;
  volume_cbm: number;
  commodity_desc: string;
  hs_code: string;
  dimensions: string;
  special_handling: string;
  declared_value: number;
  declared_currency: string;
  insurance_value: number;
  freight_charges: number;
  other_charges: number;
  weight_charge: number;
  valuation_charge: number;
  tax_amt: number;
  total_other_agent: number;
  total_other_carrier: number;
  rate_class: string;
  rate: number;
  payment_terms: string;
  mrn_no: string;
  msn: string;
  agent_code: string;
  agent_name: string;
  customs_status: string;
  customs_clearance_dt: string;
  release_dt: string;
  status_cd: string;
  remarks: string;
  created_dtm: string;
  updated_dtm: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '작성중', color: 'bg-gray-500' },
  BOOKED: { label: '부킹', color: 'bg-blue-500' },
  ACCEPTED: { label: '수탁', color: 'bg-cyan-500' },
  DEPARTED: { label: '출발', color: 'bg-purple-500' },
  IN_TRANSIT: { label: '운송중', color: 'bg-yellow-500' },
  ARRIVED: { label: '도착', color: 'bg-green-500' },
  DELIVERED: { label: '인도완료', color: 'bg-gray-600' },
};

type TabType = 'MAIN' | 'CARGO' | 'OTHER';

export default function AWBDetailPage() {
  const router = useRouter();
  const params = useParams();
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const [activeTab, setActiveTab] = useState<TabType>('MAIN');
  const [data, setData] = useState<AWBDetailData | null>(null);
  const [editData, setEditData] = useState<AWBDetailData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/awb/mawb/${params.id}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
          setEditData(result);
        } else {
          alert('데이터를 불러올 수 없습니다.');
          router.push('/logis/import-bl/air');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchData();
  }, [params.id, router]);

  const printMawbId = params.id ? Number(params.id) : undefined;
  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => { setIsEditing(false); setEditData(data); };

  const handleSave = async () => {
    if (!editData) return;
    try {
      const response = await fetch('/api/awb/mawb', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      if (response.ok) {
        setData(editData);
        setIsEditing(false);
        alert('AWB가 수정되었습니다.');
      } else {
        const err = await response.json();
        alert('수정 실패: ' + (err.error || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleChange = (field: keyof AWBDetailData, value: string | number) => {
    if (editData) setEditData({ ...editData, [field]: value });
  };

  const handleDelete = async () => {
    if (!confirm('이 AWB를 삭제하시겠습니까?')) return;
    try {
      const response = await fetch(`/api/awb/mawb?id=${params.id}`, { method: 'DELETE' });
      if (response.ok) {
        alert('AWB가 삭제되었습니다.');
        router.push('/logis/import-bl/air');
      } else {
        alert('삭제 실패');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handlePrint = () => setShowPrintModal(true);
  const handleConfirmClose = () => { setShowCloseModal(false); router.push(LIST_PATHS.IMPORT_BL_AIR); };
  useCloseConfirm({ showModal: showCloseModal, setShowModal: setShowCloseModal, onConfirmClose: handleConfirmClose });

  if (loading) return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center"><div className="text-lg">로딩 중...</div></div>;
  if (!data) return null;

  const displayData = isEditing ? editData! : data;
  const statusInfo = statusConfig[displayData.status_cd] || statusConfig.DRAFT;
  const tabs: { key: TabType; label: string }[] = [{ key: 'MAIN', label: 'MAIN' }, { key: 'CARGO', label: 'CARGO' }, { key: 'OTHER', label: 'OTHER' }];
  const inputClass = (editing: boolean) => `w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${editing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`;

  return (
        <PageLayout title="AWB 상세조회 (항공수입)" subtitle="Logis > 수입B/L관리 > AWB 상세조회" onClose={() => setShowCloseModal(true)} >
        <main ref={formRef} className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <span className="font-mono font-bold text-xl">{displayData.mawb_no}</span>
              <span className={`px-3 py-1 text-sm rounded-full text-white ${statusInfo.color}`}>{statusInfo.label}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => router.push('/logis/import-bl/air')} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">목록</button>
              <button onClick={handlePrint} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">출력</button>
              {isEditing ? (
                <>
                  <button onClick={handleCancel} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">취소</button>
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

          <div className="flex gap-1 border-b border-[var(--border)] mb-6">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-6 py-3 font-medium rounded-t-lg transition-colors ${activeTab === tab.key ? 'bg-[#2563EB] text-white' : 'bg-[var(--surface-100)] text-[var(--muted)] hover:bg-[var(--surface-200)] hover:text-[var(--foreground)]'}`}>{tab.label}</button>
            ))}
          </div>

          {activeTab === 'MAIN' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">기본 정보</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div><label className="block text-sm text-[var(--foreground)] mb-1">MAWB No.</label><input type="text" value={displayData.mawb_no || ''} disabled className={inputClass(false)} /></div>
                  <div><label className="block text-sm text-[var(--foreground)] mb-1">수출/수입</label><input type="text" value={displayData.import_type === 'IMPORT' ? '수입' : '수출'} disabled className={inputClass(false)} /></div>
                  <div><label className="block text-sm text-[var(--foreground)] mb-1">발행일</label><input type="date" value={displayData.issue_dt || ''} disabled={!isEditing} onChange={e => handleChange('issue_dt', e.target.value)} className={inputClass(isEditing)} /></div>
                  <div><label className="block text-sm text-[var(--foreground)] mb-1">발행장소</label><input type="text" value={displayData.issue_place || ''} disabled={!isEditing} onChange={e => handleChange('issue_place', e.target.value)} className={inputClass(isEditing)} /></div>
                </div>
              </div>
              <div className="card p-6">
                <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">항공편 정보</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div><label className="block text-sm text-[var(--foreground)] mb-1">항공사</label><input type="text" value={displayData.airline_code || ''} disabled={!isEditing} onChange={e => handleChange('airline_code', e.target.value)} className={inputClass(isEditing)} /></div>
                  <div><label className="block text-sm text-[var(--foreground)] mb-1">편명</label><input type="text" value={displayData.flight_no || ''} disabled={!isEditing} onChange={e => handleChange('flight_no', e.target.value)} className={inputClass(isEditing)} /></div>
                  <div><label className="block text-sm text-[var(--foreground)] mb-1">출발공항</label><input type="text" value={displayData.origin_airport_cd || ''} disabled={!isEditing} onChange={e => handleChange('origin_airport_cd', e.target.value)} className={inputClass(isEditing)} /></div>
                  <div><label className="block text-sm text-[var(--foreground)] mb-1">도착공항</label><input type="text" value={displayData.dest_airport_cd || ''} disabled={!isEditing} onChange={e => handleChange('dest_airport_cd', e.target.value)} className={inputClass(isEditing)} /></div>
                  <div><label className="block text-sm text-[var(--foreground)] mb-1">ETD 일자</label><input type="date" value={displayData.etd_dt || ''} disabled={!isEditing} onChange={e => handleChange('etd_dt', e.target.value)} className={inputClass(isEditing)} /></div>
                  <div><label className="block text-sm text-[var(--foreground)] mb-1">ETD 시간</label><input type="time" value={displayData.etd_time || ''} disabled={!isEditing} onChange={e => handleChange('etd_time', e.target.value)} className={inputClass(isEditing)} /></div>
                  <div><label className="block text-sm text-[var(--foreground)] mb-1">ETA 일자</label><input type="date" value={displayData.eta_dt || ''} disabled={!isEditing} onChange={e => handleChange('eta_dt', e.target.value)} className={inputClass(isEditing)} /></div>
                  <div><label className="block text-sm text-[var(--foreground)] mb-1">ETA 시간</label><input type="time" value={displayData.eta_time || ''} disabled={!isEditing} onChange={e => handleChange('eta_time', e.target.value)} className={inputClass(isEditing)} /></div>
                  <div><label className="block text-sm text-[var(--foreground)] mb-1">ATD 일자</label><input type="date" value={displayData.atd_dt || ''} disabled={!isEditing} onChange={e => handleChange('atd_dt', e.target.value)} className={inputClass(isEditing)} /></div>
                  <div><label className="block text-sm text-[var(--foreground)] mb-1">ATD 시간</label><input type="time" value={displayData.atd_time || ''} disabled={!isEditing} onChange={e => handleChange('atd_time', e.target.value)} className={inputClass(isEditing)} /></div>
                  <div><label className="block text-sm text-[var(--foreground)] mb-1">ATA 일자</label><input type="date" value={displayData.ata_dt || ''} disabled={!isEditing} onChange={e => handleChange('ata_dt', e.target.value)} className={inputClass(isEditing)} /></div>
                  <div><label className="block text-sm text-[var(--foreground)] mb-1">ATA 시간</label><input type="time" value={displayData.ata_time || ''} disabled={!isEditing} onChange={e => handleChange('ata_time', e.target.value)} className={inputClass(isEditing)} /></div>
                </div>
              </div>
              <div className="card p-6">
                <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">거래처 정보</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-blue-400">Shipper (송하인)</h4>
                    <div><label className="block text-sm text-[var(--foreground)] mb-1">회사명</label><input type="text" value={displayData.shipper_nm || ''} disabled={!isEditing} onChange={e => handleChange('shipper_nm', e.target.value)} className={inputClass(isEditing)} /></div>
                    <div><label className="block text-sm text-[var(--foreground)] mb-1">주소</label><textarea value={displayData.shipper_addr || ''} disabled={!isEditing} onChange={e => handleChange('shipper_addr', e.target.value)} rows={3} className={inputClass(isEditing)} /></div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-green-400">Consignee (수하인)</h4>
                    <div><label className="block text-sm text-[var(--foreground)] mb-1">회사명</label><input type="text" value={displayData.consignee_nm || ''} disabled={!isEditing} onChange={e => handleChange('consignee_nm', e.target.value)} className={inputClass(isEditing)} /></div>
                    <div><label className="block text-sm text-[var(--foreground)] mb-1">주소</label><textarea value={displayData.consignee_addr || ''} disabled={!isEditing} onChange={e => handleChange('consignee_addr', e.target.value)} rows={3} className={inputClass(isEditing)} /></div>
                  </div>
                </div>
                <div className="mt-4"><label className="block text-sm text-[var(--foreground)] mb-1">Notify Party</label><input type="text" value={displayData.notify_party || ''} disabled={!isEditing} onChange={e => handleChange('notify_party', e.target.value)} className={inputClass(isEditing)} /></div>
              </div>
            </div>
          )}

          {activeTab === 'CARGO' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">ȭ�� ����</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div><label className="block text-sm text-[var(--foreground)] mb-1">PCS</label><input type="number" value={displayData.pieces || ''} disabled={!isEditing} onChange={e => handleChange('pieces', parseInt(e.target.value) || 0)} className={inputClass(isEditing)} /></div>
                  <div><label className="block text-sm text-[var(--foreground)] mb-1">Gross Weight</label><input type="number" step="0.01" value={displayData.gross_weight_kg || ''} disabled={!isEditing} onChange={e => handleChange('gross_weight_kg', parseFloat(e.target.value) || 0)} className={inputClass(isEditing)} /></div>
                  <div><label className="block text-sm text-[var(--foreground)] mb-1">Charge Weight</label><input type="number" step="0.01" value={displayData.charge_weight_kg || ''} disabled={!isEditing} onChange={e => handleChange('charge_weight_kg', parseFloat(e.target.value) || 0)} className={inputClass(isEditing)} /></div>
                  <div><label className="block text-sm text-[var(--foreground)] mb-1">Volume (CBM)</label><input type="number" step="0.01" value={displayData.volume_cbm || ''} disabled={!isEditing} onChange={e => handleChange('volume_cbm', parseFloat(e.target.value) || 0)} className={inputClass(isEditing)} /></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'OTHER' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">��� ����</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div><label className="block text-sm text-[var(--foreground)] mb-1">MRN NO</label><input type="text" value={displayData.mrn_no || ''} disabled={!isEditing} onChange={e => handleChange('mrn_no', e.target.value)} className={inputClass(isEditing)} /></div>
                  <div><label className="block text-sm text-[var(--foreground)] mb-1">MSN</label><input type="text" value={displayData.msn || ''} disabled={!isEditing} onChange={e => handleChange('msn', e.target.value)} className={inputClass(isEditing)} /></div>
                </div>
              </div>
              <div className="card p-6">
                <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">Agent ����</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm text-[var(--foreground)] mb-1">Agent Code</label><input type="text" value={displayData.agent_code || ''} disabled={!isEditing} onChange={e => handleChange('agent_code', e.target.value)} className={inputClass(isEditing)} /></div>
                  <div><label className="block text-sm text-[var(--foreground)] mb-1">Agent Name</label><input type="text" value={displayData.agent_name || ''} disabled={!isEditing} onChange={e => handleChange('agent_name', e.target.value)} className={inputClass(isEditing)} /></div>
                </div>
              </div>
            </div>
          )}
        </main>
      <CloseConfirmModal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} onConfirm={handleConfirmClose} />
      <AWBPrintModal isOpen={showPrintModal} onClose={() => setShowPrintModal(false)} awbData={null} mawbId={printMawbId} />
    </PageLayout>
  );
}
