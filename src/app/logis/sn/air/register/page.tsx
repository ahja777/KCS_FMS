'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import AirlineCodeModal, { type AirlineItem } from '@/components/popup/AirlineCodeModal';
import LocationCodeModal, { type LocationItem } from '@/components/popup/LocationCodeModal';
import CodeSearchModal, { type CodeType, type CodeItem } from '@/components/popup/CodeSearchModal';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import SearchIconButton from '@/components/SearchIconButton';

function AirSNRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showAirlineModal, setShowAirlineModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationField, setLocationField] = useState<string>('');
  const [showCodeSearchModal, setShowCodeSearchModal] = useState(false);
  const [codeSearchTarget, setCodeSearchTarget] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isNewMode, setIsNewMode] = useState(!editId);
  const [formData, setFormData] = useState({
    snNo: '',
    snDate: new Date().toISOString().split('T')[0],
    awbNo: '',
    shipperCode: '',
    shipper: '',
    consigneeCode: '',
    consignee: '',
    notifyCode: '',
    notifyParty: '',
    airline: '',
    flightNo: '',
    origin: '',
    originName: '',
    destination: '',
    destinationName: '',
    etd: '',
    eta: '',
    commodity: '',
    pieces: 0,
    grossWeight: 0,
    chargeableWeight: 0,
    volume: 0,
    remark: '',
  });

  // 수정 모드: 기존 데이터 로드
  useEffect(() => {
    if (!editId) return;
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/sn/air?id=${editId}`);
        const data = await response.json();
        if (data && !data.error) {
          setFormData({
            snNo: data.SN_NO || data.snNo || '',
            snDate: (data.SN_DATE || data.snDate || '').split('T')[0] || new Date().toISOString().split('T')[0],
            awbNo: data.AWB_NO || data.awbNo || '',
            shipperCode: data.SHIPPER_CODE || data.shipperCode || '',
            shipper: data.SHIPPER || data.shipper || '',
            consigneeCode: data.CONSIGNEE_CODE || data.consigneeCode || '',
            consignee: data.CONSIGNEE || data.consignee || '',
            notifyCode: data.NOTIFY_CODE || data.notifyCode || '',
            notifyParty: data.NOTIFY_PARTY || data.notifyParty || '',
            airline: data.AIRLINE || data.airline || '',
            flightNo: data.FLIGHT_NO || data.flightNo || '',
            origin: data.ORIGIN || data.origin || '',
            originName: data.ORIGIN_NAME || data.originName || '',
            destination: data.DESTINATION || data.destination || '',
            destinationName: data.DESTINATION_NAME || data.destinationName || '',
            etd: (data.ETD || data.etd || '').split('T')[0] || '',
            eta: (data.ETA || data.eta || '').split('T')[0] || '',
            commodity: data.COMMODITY || data.commodity || '',
            pieces: data.PIECES || data.pieces || 0,
            grossWeight: data.GROSS_WEIGHT || data.grossWeight || 0,
            chargeableWeight: data.CHARGEABLE_WEIGHT || data.chargeableWeight || 0,
            volume: data.VOLUME || data.volume || 0,
            remark: data.REMARK || data.remark || '',
          });
          setIsNewMode(false);
        }
      } catch (error) {
        console.error('Failed to load S/N data:', error);
      }
    };
    fetchData();
  }, [editId]);

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleAirlineSelect = (item: AirlineItem) => {
    setFormData(prev => ({ ...prev, airline: item.code }));
    setShowAirlineModal(false);
  };

  const handleLocationSelect = (item: LocationItem) => {
    if (locationField === 'origin') {
      setFormData(prev => ({ ...prev, origin: item.code, originName: item.nameEn || item.nameKr || '' }));
    } else if (locationField === 'destination') {
      setFormData(prev => ({ ...prev, destination: item.code, destinationName: item.nameEn || item.nameKr || '' }));
    }
    setShowLocationModal(false);
  };

  const handleCodeSearch = (target: string) => {
    setCodeSearchTarget(target);
    setShowCodeSearchModal(true);
  };

  const handleCodeSelect = (item: CodeItem) => {
    if (codeSearchTarget === 'shipper') {
      setFormData(prev => ({ ...prev, shipperCode: item.code, shipper: item.name }));
    } else if (codeSearchTarget === 'consignee') {
      setFormData(prev => ({ ...prev, consigneeCode: item.code, consignee: item.name }));
    } else if (codeSearchTarget === 'notify') {
      setFormData(prev => ({ ...prev, notifyCode: item.code, notifyParty: item.name }));
    }
    setShowCodeSearchModal(false);
  };

  const handleSave = async () => {
    try {
      const method = editId ? 'PUT' : 'POST';
      const payload = editId ? { ...formData, id: Number(editId) } : formData;
      const response = await fetch('/api/sn/air', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const result = await response.json();
        if (editId) {
          alert('S/N이 수정되었습니다.');
        } else {
          alert(`S/N이 등록되었습니다.${result.snNo ? `\nS/N 번호: ${result.snNo}` : ''}`);
          const newId = result.snId || result.id;
          if (newId) router.replace(`/logis/sn/air/register?id=${newId}`);
        }
        setIsNewMode(false);
        setHasUnsavedChanges(false);
      } else {
        alert('등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to save SN:', error);
      alert('등록 중 오류가 발생했습니다.');
    }
  };

  const handleNew = () => {
    if (editId) { router.push('/logis/sn/air/register'); return; }
    setFormData({
      snNo: '',
      snDate: new Date().toISOString().split('T')[0],
      awbNo: '', shipperCode: '', shipper: '', consigneeCode: '', consignee: '', notifyCode: '', notifyParty: '',
      airline: '', flightNo: '', origin: '', originName: '', destination: '', destinationName: '',
      etd: '', eta: '', commodity: '',
      pieces: 0, grossWeight: 0, chargeableWeight: 0, volume: 0, remark: '',
    });
    setHasUnsavedChanges(false);
    setIsNewMode(true);
  };

  const handleReset = () => {
    setFormData({
      snNo: '',
      snDate: new Date().toISOString().split('T')[0],
      awbNo: '',
      shipperCode: '',
      shipper: '',
      consigneeCode: '',
      consignee: '',
      notifyCode: '',
      notifyParty: '',
      airline: '',
      flightNo: '',
      origin: '',
      originName: '',
      destination: '',
      destinationName: '',
      etd: '',
      eta: '',
      commodity: '',
      pieces: 0,
      grossWeight: 0,
      chargeableWeight: 0,
      volume: 0,
      remark: '',
    });
  };

  const handleCloseClick = () => setShowCloseModal(true);
  const handleConfirmClose = () => { setShowCloseModal(false); router.back(); };

  useCloseConfirm({ showModal: showCloseModal, setShowModal: setShowCloseModal, onConfirmClose: handleConfirmClose });

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="main-content">
        <Header title="선적통지 등록 (S/N)" subtitle="Logis 
        onClose={() => setShowCloseModal(true)}> 선적관리 > 선적통지 등록 (항공)" onClose={handleCloseClick} />
        <main ref={formRef} className="p-6">
          <div className="sticky top-20 z-20 bg-white py-2 -mx-6 px-6 border-b border-gray-200 flex justify-between items-center mb-6">
            <span className="text-sm text-[var(--muted)]">화면 ID: SN-AIR-REG</span>
            <div className="flex gap-2">
              <button onClick={handleNew} disabled={isNewMode} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed">신규</button>
              <button onClick={handleReset} className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] font-medium">초기화</button>
              <button onClick={() => router.push('/logis/sn/air')} className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] font-medium">목록</button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">통지발송</button>
              <button onClick={handleSave} className="px-6 py-2 bg-[#E8A838] text-[#0C1222] font-semibold rounded-lg hover:bg-[#D4943A]">저장</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* 기본 정보 */}
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">기본 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--muted)]">S/N 번호</label>
                  <input type="text" value={formData.snNo} onChange={e => handleChange('snNo', e.target.value)} placeholder="자동생성" className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg" disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--muted)]">S/N 일자</label>
                  <input type="date" value={formData.snDate} onChange={e => handleChange('snDate', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--muted)]">AWB 번호 *</label>
                  <div className="flex gap-2" style={{ display: 'flex', gap: '4px' }}>
                    <input type="text" value={formData.awbNo} onChange={e => handleChange('awbNo', e.target.value)} placeholder="000-00000000" className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" style={{ flex: 1, minWidth: 0 }} />
                    <SearchIconButton onClick={() => {}} />
                  </div>
                </div>
              </div>
            </div>

            {/* 운송 정보 */}
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">운송 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--muted)]">항공사</label>
                  <div className="flex gap-2" style={{ display: 'flex', gap: '4px' }}>
                    <input type="text" value={formData.airline} onChange={e => handleChange('airline', e.target.value)} placeholder="항공사 코드" className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" style={{ flex: 1, minWidth: 0 }} />
                    <SearchIconButton onClick={() => setShowAirlineModal(true)} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--muted)]">편명</label>
                  <input type="text" value={formData.flightNo} onChange={e => handleChange('flightNo', e.target.value)} placeholder="KE001" className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
                </div>
              </div>
            </div>

            {/* 화주/수하인 정보 */}
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">화주/수하인 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--muted)]">화주 (Shipper) *</label>
                  <div className="flex gap-1">
                    <input type="text" value={formData.shipperCode} onChange={e => handleChange('shipperCode', e.target.value)} className="w-[120px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" />
                    <SearchIconButton onClick={() => handleCodeSearch('shipper')} />
                    <input type="text" value={formData.shipper} onChange={e => handleChange('shipper', e.target.value)} className="flex-1 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="이름/상호" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--muted)]">수하인 (Consignee)</label>
                  <div className="flex gap-1">
                    <input type="text" value={formData.consigneeCode} onChange={e => handleChange('consigneeCode', e.target.value)} className="w-[120px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" />
                    <SearchIconButton onClick={() => handleCodeSearch('consignee')} />
                    <input type="text" value={formData.consignee} onChange={e => handleChange('consignee', e.target.value)} className="flex-1 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="이름/상호" />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Notify Party</label>
                  <div className="flex gap-1">
                    <input type="text" value={formData.notifyCode} onChange={e => handleChange('notifyCode', e.target.value)} className="w-[120px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" />
                    <SearchIconButton onClick={() => handleCodeSearch('notify')} />
                    <input type="text" value={formData.notifyParty} onChange={e => handleChange('notifyParty', e.target.value)} className="flex-1 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="이름/상호" />
                  </div>
                </div>
              </div>
            </div>

            {/* 구간/일정 정보 */}
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">구간/일정 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--muted)]">출발지 (Origin)</label>
                  <div className="flex gap-1">
                    <input type="text" value={formData.origin} onChange={e => handleChange('origin', e.target.value)} placeholder="코드" className="w-[80px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" />
                    <SearchIconButton onClick={() => { setLocationField('origin'); setShowLocationModal(true); }} />
                    <input type="text" value={formData.originName} readOnly className="flex-1 h-[32px] px-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-500" placeholder="이름" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--muted)]">도착지 (Destination)</label>
                  <div className="flex gap-1">
                    <input type="text" value={formData.destination} onChange={e => handleChange('destination', e.target.value)} placeholder="코드" className="w-[80px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" />
                    <SearchIconButton onClick={() => { setLocationField('destination'); setShowLocationModal(true); }} />
                    <input type="text" value={formData.destinationName} readOnly className="flex-1 h-[32px] px-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-500" placeholder="이름" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--muted)]">ETD</label>
                  <input type="date" value={formData.etd} onChange={e => handleChange('etd', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--muted)]">ETA</label>
                  <input type="date" value={formData.eta} onChange={e => handleChange('eta', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
                </div>
              </div>
            </div>

            {/* 화물 정보 */}
            <div className="card p-6 col-span-2">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">화물 정보</h3>
              <div className="grid grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--muted)]">품목</label>
                  <input type="text" value={formData.commodity} onChange={e => handleChange('commodity', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--muted)]">수량 (PCS)</label>
                  <input type="number" value={formData.pieces} onChange={e => handleChange('pieces', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--muted)]">총중량 (KG)</label>
                  <input type="number" step="0.01" value={formData.grossWeight} onChange={e => handleChange('grossWeight', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--muted)]">청구중량 (KG)</label>
                  <input type="number" step="0.01" value={formData.chargeableWeight} onChange={e => handleChange('chargeableWeight', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--muted)]">용적 (CBM)</label>
                  <input type="number" step="0.001" value={formData.volume} onChange={e => handleChange('volume', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
                </div>
              </div>
            </div>

            {/* 비고 */}
            <div className="card p-6 col-span-2">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">비고</h3>
              <textarea value={formData.remark} onChange={e => handleChange('remark', e.target.value)} rows={3} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg resize-none" />
            </div>
          </div>
        </main>
      </div>
      <CloseConfirmModal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} onConfirm={handleConfirmClose} />
      <CodeSearchModal
        isOpen={showCodeSearchModal}
        onClose={() => setShowCodeSearchModal(false)}
        onSelect={handleCodeSelect}
        codeType="customer"
      />
      <AirlineCodeModal
        isOpen={showAirlineModal}
        onClose={() => setShowAirlineModal(false)}
        onSelect={handleAirlineSelect}
      />
      <LocationCodeModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelect={handleLocationSelect}
        type="airport"
      />
    </div>
  );
}

export default function AirSNRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)] flex items-center justify-center">Loading...</div>}>
      <AirSNRegisterContent />
    </Suspense>
  );
}
