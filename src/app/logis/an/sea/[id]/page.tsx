'use client';

import { useState, useRef, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useScreenClose } from '@/hooks/useScreenClose';
import { formatCurrency } from '@/utils/format';

interface ANSeaDetail {
  AN_ID: number;
  AN_NO: string;
  AN_DATE: string;
  BL_NO: string;
  HBL_NO: string;
  SHIPPER: string;
  SHIPPER_ADDR: string;
  CONSIGNEE: string;
  CONSIGNEE_ADDR: string;
  NOTIFY_PARTY: string;
  NOTIFY_ADDR: string;
  CARRIER_CD: string;
  CARRIER_NM: string;
  VESSEL_NM: string;
  VOYAGE_NO: string;
  POL: string;
  POD: string;
  FINAL_DEST: string;
  ETD: string;
  ATD: string;
  ETA: string;
  ATA: string;
  CARGO_STATUS: string;
  CUSTOMS_STATUS: string;
  CONTAINER_INFO: string;
  CONTAINER_CNT: number;
  PACKAGE_CNT: number;
  GROSS_WEIGHT: number;
  MEASUREMENT: number;
  COMMODITY: string;
  FREIGHT_TYPE: string;
  FREIGHT_AMT: number;
  CURRENCY: string;
  STORAGE_INFO: string;
  DO_NO: string;
  DO_ISSUE_DATE: string;
  AN_SENT_YN: string;
  AN_SENT_DATE: string;
  STATUS: string;
  REMARKS: string;
}

const cargoStatusConfig: Record<string, { label: string; color: string }> = {
  IN_TRANSIT: { label: '운송중', color: 'bg-blue-500' },
  ARRIVED: { label: '입항', color: 'bg-purple-500' },
  DISCHARGED: { label: '양하완료', color: 'bg-cyan-500' },
  IN_CY: { label: 'CY반입', color: 'bg-yellow-500' },
  RELEASED: { label: '반출', color: 'bg-green-500' },
  DELIVERED: { label: '배송완료', color: 'bg-gray-500' },
};

const customsStatusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: '대기', color: 'bg-gray-500' },
  DECLARED: { label: '신고', color: 'bg-blue-500' },
  INSPECTING: { label: '검사', color: 'bg-yellow-500' },
  CLEARED: { label: '통관완료', color: 'bg-green-500' },
};

const getConfig = (config: Record<string, { label: string; color: string }>, status: string) =>
  config[status] || { label: status || '-', color: 'bg-gray-500' };

export default function ANSeaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const [data, setData] = useState<ANSeaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [editData, setEditData] = useState<Partial<ANSeaDetail>>({});

  const {
    showModal: showCloseModal,
    handleCloseClick,
    handleModalClose,
    handleDiscard,
  } = useScreenClose({
    hasChanges,
    listPath: '/logis/an/sea',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/an/sea?id=${id}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
          setEditData(result);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (field: string, value: string | number) => {
    setEditData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/an/sea', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: data?.AN_ID,
          anDate: editData.AN_DATE,
          blNo: editData.BL_NO,
          hblNo: editData.HBL_NO,
          shipper: editData.SHIPPER,
          consignee: editData.CONSIGNEE,
          consigneeAddr: editData.CONSIGNEE_ADDR,
          notifyParty: editData.NOTIFY_PARTY,
          carrierNm: editData.CARRIER_NM,
          vesselNm: editData.VESSEL_NM,
          voyageNo: editData.VOYAGE_NO,
          pol: editData.POL,
          pod: editData.POD,
          etd: editData.ETD,
          atd: editData.ATD,
          eta: editData.ETA,
          ata: editData.ATA,
          cargoStatus: editData.CARGO_STATUS,
          customsStatus: editData.CUSTOMS_STATUS,
          containerInfo: editData.CONTAINER_INFO,
          containerCnt: editData.CONTAINER_CNT,
          packageCnt: editData.PACKAGE_CNT,
          grossWeight: editData.GROSS_WEIGHT,
          measurement: editData.MEASUREMENT,
          commodity: editData.COMMODITY,
          freightType: editData.FREIGHT_TYPE,
          freightAmt: editData.FREIGHT_AMT,
          currency: editData.CURRENCY,
          storageInfo: editData.STORAGE_INFO,
          remarks: editData.REMARKS,
        })
      });

      if (response.ok) {
        alert('저장되었습니다.');
        setData({ ...data, ...editData } as ANSeaDetail);
        setIsEditing(false);
        setHasChanges(false);
      } else {
        alert('저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      const response = await fetch(`/api/an/sea?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        alert('삭제되었습니다.');
        router.push('/logis/an/sea');
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleSendAN = async () => {
    if (!confirm('A/N을 발송하시겠습니까?')) return;
    try {
      const response = await fetch('/api/an/sea', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: data?.AN_ID,
          anSentYn: 'Y',
          anSentDate: new Date().toISOString(),
          status: 'SENT'
        })
      });
      if (response.ok) {
        alert('A/N이 발송되었습니다.');
        setData(prev => prev ? { ...prev, AN_SENT_YN: 'Y', STATUS: 'SENT' } : null);
      }
    } catch (error) {
      console.error('Failed to send A/N:', error);
      alert('A/N 발송에 실패했습니다.');
    }
  };

  const handleIssueDO = async () => {
    if (!confirm('D/O를 발급하시겠습니까?')) return;
    const doNo = `DO-${Date.now()}`;
    try {
      const response = await fetch('/api/an/sea', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: data?.AN_ID,
          doNo,
          doIssueDate: new Date().toISOString().split('T')[0],
          status: 'CONFIRMED'
        })
      });
      if (response.ok) {
        alert('D/O가 발급되었습니다.');
        setData(prev => prev ? { ...prev, DO_NO: doNo, STATUS: 'CONFIRMED' } : null);
      }
    } catch (error) {
      console.error('Failed to issue D/O:', error);
      alert('D/O 발급에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Header title="도착통지 상세 (A/N) - 해상" subtitle="Logis > 해상수입 > 도착통지 상세" onClose={handleCloseClick} />
        <main className="main-content p-6 mt-20">
          <div className="flex justify-center items-center h-64">
            <p className="text-[var(--muted)]">데이터를 불러오는 중...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Header title="도착통지 상세 (A/N) - 해상" subtitle="Logis > 해상수입 > 도착통지 상세" onClose={handleCloseClick} />
        <main className="main-content p-6 mt-20">
          <div className="flex justify-center items-center h-64">
            <p className="text-[var(--muted)]">데이터를 찾을 수 없습니다.</p>
          </div>
        </main>
      </div>
    );
  }

  const displayValue = (field: keyof ANSeaDetail) => {
    if (isEditing) {
      return editData[field] ?? '';
    }
    return data[field] ?? '';
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header
        title="도착통지 상세 (A/N) - 해상"
        subtitle="Logis > 해상수입 > 도착통지 상세"
        onClose={handleCloseClick}
      />
      <main ref={formRef} className="main-content p-6 mt-20">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold">{data.AN_NO}</span>
            <span className={`px-3 py-1 text-sm rounded-full text-white ${getConfig(cargoStatusConfig, data.CARGO_STATUS).color}`}>
              {getConfig(cargoStatusConfig, data.CARGO_STATUS).label}
            </span>
            <span className={`px-3 py-1 text-sm rounded-full text-white ${getConfig(customsStatusConfig, data.CUSTOMS_STATUS).color}`}>
              {getConfig(customsStatusConfig, data.CUSTOMS_STATUS).label}
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => router.push('/logis/an/sea/register')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">신규</button>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] font-medium">수정</button>
            ) : (
              <button onClick={() => { setIsEditing(false); setEditData(data); setHasChanges(false); }} className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] font-medium">취소</button>
            )}
            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">삭제</button>
            <button onClick={() => router.push('/logis/an/sea')} className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] font-medium">목록</button>
            {data.AN_SENT_YN !== 'Y' && (
              <button onClick={handleSendAN} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">A/N 발송</button>
            )}
            {!data.DO_NO && data.CUSTOMS_STATUS === 'CLEARED' && (
              <button onClick={handleIssueDO} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">D/O 발급</button>
            )}
            {isEditing && (
              <button onClick={handleSave} className="px-6 py-2 bg-[#E8A838] text-[#0C1222] font-semibold rounded-lg hover:bg-[#D4943A]">저장</button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* 기본 정보 */}
          <div className="card p-6">
            <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">기본 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">A/N 번호</label>
                <input type="text" value={data.AN_NO} disabled className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">A/N 일자</label>
                <input type="date" value={String(displayValue('AN_DATE')).split('T')[0]} onChange={e => handleChange('AN_DATE', e.target.value)} disabled={!isEditing} className={`w-full px-3 py-2 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)]'}`} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">M/BL 번호</label>
                <input type="text" value={String(displayValue('BL_NO'))} onChange={e => handleChange('BL_NO', e.target.value)} disabled={!isEditing} className={`w-full px-3 py-2 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)]'}`} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">H/BL 번호</label>
                <input type="text" value={String(displayValue('HBL_NO'))} onChange={e => handleChange('HBL_NO', e.target.value)} disabled={!isEditing} className={`w-full px-3 py-2 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)]'}`} />
              </div>
            </div>
          </div>

          {/* 운송 정보 */}
          <div className="card p-6">
            <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">운송 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">선사</label>
                <input type="text" value={String(displayValue('CARRIER_NM'))} onChange={e => handleChange('CARRIER_NM', e.target.value)} disabled={!isEditing} className={`w-full px-3 py-2 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)]'}`} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">선명/항차</label>
                <div className="flex gap-2">
                  <input type="text" value={String(displayValue('VESSEL_NM'))} onChange={e => handleChange('VESSEL_NM', e.target.value)} disabled={!isEditing} className={`flex-1 px-3 py-2 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)]'}`} />
                  <input type="text" value={String(displayValue('VOYAGE_NO'))} onChange={e => handleChange('VOYAGE_NO', e.target.value)} disabled={!isEditing} className={`w-24 px-3 py-2 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)]'}`} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">선적항 (POL)</label>
                <input type="text" value={String(displayValue('POL'))} onChange={e => handleChange('POL', e.target.value)} disabled={!isEditing} className={`w-full px-3 py-2 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)]'}`} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">양하항 (POD)</label>
                <input type="text" value={String(displayValue('POD'))} onChange={e => handleChange('POD', e.target.value)} disabled={!isEditing} className={`w-full px-3 py-2 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)]'}`} />
              </div>
            </div>
          </div>

          {/* 화주/수하인 정보 */}
          <div className="card p-6">
            <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">화주/수하인 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">송하인</label>
                <input type="text" value={String(displayValue('SHIPPER'))} onChange={e => handleChange('SHIPPER', e.target.value)} disabled={!isEditing} className={`w-full px-3 py-2 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)]'}`} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">수하인</label>
                <input type="text" value={String(displayValue('CONSIGNEE'))} onChange={e => handleChange('CONSIGNEE', e.target.value)} disabled={!isEditing} className={`w-full px-3 py-2 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)]'}`} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">수하인 주소</label>
                <input type="text" value={String(displayValue('CONSIGNEE_ADDR'))} onChange={e => handleChange('CONSIGNEE_ADDR', e.target.value)} disabled={!isEditing} className={`w-full px-3 py-2 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)]'}`} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Notify Party</label>
                <input type="text" value={String(displayValue('NOTIFY_PARTY'))} onChange={e => handleChange('NOTIFY_PARTY', e.target.value)} disabled={!isEditing} className={`w-full px-3 py-2 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)]'}`} />
              </div>
            </div>
          </div>

          {/* 일정 정보 */}
          <div className="card p-6">
            <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">일정 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">ETD</label>
                <input type="date" value={String(displayValue('ETD')).split('T')[0] || ''} onChange={e => handleChange('ETD', e.target.value)} disabled={!isEditing} className={`w-full px-3 py-2 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)]'}`} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">ATD</label>
                <input type="date" value={String(displayValue('ATD')).split('T')[0] || ''} onChange={e => handleChange('ATD', e.target.value)} disabled={!isEditing} className={`w-full px-3 py-2 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)]'}`} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">ETA</label>
                <input type="date" value={String(displayValue('ETA')).split('T')[0] || ''} onChange={e => handleChange('ETA', e.target.value)} disabled={!isEditing} className={`w-full px-3 py-2 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)]'}`} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">ATA</label>
                <input type="date" value={String(displayValue('ATA')).split('T')[0] || ''} onChange={e => handleChange('ATA', e.target.value)} disabled={!isEditing} className={`w-full px-3 py-2 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)]'}`} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">화물상태</label>
                <select value={String(displayValue('CARGO_STATUS'))} onChange={e => handleChange('CARGO_STATUS', e.target.value)} disabled={!isEditing} className={`w-full px-3 py-2 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)]'}`}>
                  <option value="IN_TRANSIT">운송중</option>
                  <option value="ARRIVED">입항</option>
                  <option value="DISCHARGED">양하완료</option>
                  <option value="IN_CY">CY반입</option>
                  <option value="RELEASED">반출</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">통관상태</label>
                <select value={String(displayValue('CUSTOMS_STATUS'))} onChange={e => handleChange('CUSTOMS_STATUS', e.target.value)} disabled={!isEditing} className={`w-full px-3 py-2 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)]'}`}>
                  <option value="PENDING">대기</option>
                  <option value="DECLARED">신고</option>
                  <option value="INSPECTING">검사</option>
                  <option value="CLEARED">통관완료</option>
                </select>
              </div>
            </div>
          </div>

          {/* 화물 정보 */}
          <div className="card p-6 col-span-2">
            <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">화물 정보</h3>
            <div className="grid grid-cols-6 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">컨테이너 정보</label>
                <input type="text" value={String(displayValue('CONTAINER_INFO'))} onChange={e => handleChange('CONTAINER_INFO', e.target.value)} disabled={!isEditing} className={`w-full px-3 py-2 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)]'}`} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">컨테이너 수</label>
                <input type="number" value={Number(displayValue('CONTAINER_CNT'))} onChange={e => handleChange('CONTAINER_CNT', parseInt(e.target.value) || 0)} disabled={!isEditing} className={`w-full px-3 py-2 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)]'}`} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">포장 수량</label>
                <input type="number" value={Number(displayValue('PACKAGE_CNT'))} onChange={e => handleChange('PACKAGE_CNT', parseInt(e.target.value) || 0)} disabled={!isEditing} className={`w-full px-3 py-2 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)]'}`} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">총중량 (KG)</label>
                <input type="number" value={Number(displayValue('GROSS_WEIGHT'))} onChange={e => handleChange('GROSS_WEIGHT', parseFloat(e.target.value) || 0)} disabled={!isEditing} className={`w-full px-3 py-2 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)]'}`} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">용적 (CBM)</label>
                <input type="number" value={Number(displayValue('MEASUREMENT'))} onChange={e => handleChange('MEASUREMENT', parseFloat(e.target.value) || 0)} disabled={!isEditing} className={`w-full px-3 py-2 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)]'}`} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">품명</label>
                <input type="text" value={String(displayValue('COMMODITY'))} onChange={e => handleChange('COMMODITY', e.target.value)} disabled={!isEditing} className={`w-full px-3 py-2 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)]'}`} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">운임구분</label>
                <input type="text" value={displayValue('FREIGHT_TYPE') === 'PP' ? 'Prepaid' : displayValue('FREIGHT_TYPE') === 'CC' ? 'Collect' : String(displayValue('FREIGHT_TYPE'))} disabled className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">운임금액</label>
                <input type="text" value={`${formatCurrency(Number(displayValue('FREIGHT_AMT')))} ${displayValue('CURRENCY')}`} disabled className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">보관정보</label>
                <input type="text" value={String(displayValue('STORAGE_INFO'))} onChange={e => handleChange('STORAGE_INFO', e.target.value)} disabled={!isEditing} className={`w-full px-3 py-2 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)]'}`} />
              </div>
            </div>
          </div>

          {/* A/N 발송 / D/O 발급 정보 */}
          <div className="card p-6 col-span-2">
            <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">A/N 발송 / D/O 발급 정보</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">A/N 발송 여부</label>
                <div className="flex items-center gap-2 h-[42px]">
                  {data.AN_SENT_YN === 'Y' ? (
                    <span className="text-green-500 font-bold">발송완료</span>
                  ) : (
                    <span className="text-yellow-500 font-bold">미발송</span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">A/N 발송일시</label>
                <input type="text" value={data.AN_SENT_DATE ? new Date(data.AN_SENT_DATE).toLocaleString('ko-KR') : '-'} disabled className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">D/O 번호</label>
                <input type="text" value={data.DO_NO || '-'} disabled className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">D/O 발급일</label>
                <input type="text" value={data.DO_ISSUE_DATE?.split('T')[0] || '-'} disabled className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg" />
              </div>
            </div>
          </div>

          {/* 비고 */}
          <div className="card p-6 col-span-2">
            <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">비고</h3>
            <textarea value={String(displayValue('REMARKS'))} onChange={e => handleChange('REMARKS', e.target.value)} disabled={!isEditing} rows={3} className={`w-full px-3 py-2 border border-[var(--border)] rounded-lg resize-none ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)]'}`} />
          </div>
        </div>
      </main>

      <CloseConfirmModal
        isOpen={showCloseModal}
        onClose={handleModalClose}
        onConfirm={handleDiscard}
      />
    </div>
  );
}
