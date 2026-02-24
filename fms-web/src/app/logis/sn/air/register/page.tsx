'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import AirlineCodeModal, { type AirlineItem } from '@/components/popup/AirlineCodeModal';
import LocationCodeModal, { type LocationItem } from '@/components/popup/LocationCodeModal';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';

export default function AirSNRegisterPage() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showAirlineModal, setShowAirlineModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationField, setLocationField] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formData, setFormData] = useState({
    snNo: '',
    snDate: new Date().toISOString().split('T')[0],
    awbNo: '',
    shipper: '',
    consignee: '',
    notifyParty: '',
    airline: '',
    flightNo: '',
    origin: '',
    destination: '',
    etd: '',
    eta: '',
    commodity: '',
    pieces: 0,
    grossWeight: 0,
    chargeableWeight: 0,
    volume: 0,
    remark: '',
  });

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
      setFormData(prev => ({ ...prev, origin: item.code }));
    } else if (locationField === 'destination') {
      setFormData(prev => ({ ...prev, destination: item.code }));
    }
    setShowLocationModal(false);
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/sn/air', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        alert('S/N이 등록되었습니다.');
        router.push('/logis/sn/air');
      } else {
        alert('등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to save SN:', error);
      alert('등록 중 오류가 발생했습니다.');
    }
  };

  const handleReset = () => {
    setFormData({
      snNo: '',
      snDate: new Date().toISOString().split('T')[0],
      awbNo: '',
      shipper: '',
      consignee: '',
      notifyParty: '',
      airline: '',
      flightNo: '',
      origin: '',
      destination: '',
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
      <div className="ml-56">
        <Header title="선적통지 등록 (S/N)" subtitle="Logis 
        onClose={() => setShowCloseModal(true)}> 선적관리 > 선적통지 등록 (항공)" onClose={handleCloseClick} />
        <main ref={formRef} className="p-6">
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm text-[var(--muted)]">화면 ID: SN-AIR-REG</span>
            <div className="flex gap-2">
              <button onClick={() => router.push('/logis/sn/air')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">신규</button>
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
                    <button style={{ minWidth: '44px', height: '38px', background: '#6e5fc9', color: 'white', border: '1px solid #5a4db3', borderRadius: '8px', fontSize: '12px', fontWeight: 600, flexShrink: 0, cursor: 'pointer' }}>찾기</button>
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
                    <button onClick={() => setShowAirlineModal(true)} style={{ minWidth: '44px', height: '38px', background: '#6e5fc9', color: 'white', border: '1px solid #5a4db3', borderRadius: '8px', fontSize: '12px', fontWeight: 600, flexShrink: 0, cursor: 'pointer' }}>찾기</button>
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
                  <div className="flex gap-2" style={{ display: 'flex', gap: '4px' }}>
                    <input type="text" value={formData.shipper} onChange={e => handleChange('shipper', e.target.value)} className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" style={{ flex: 1, minWidth: 0 }} />
                    <button style={{ minWidth: '44px', height: '38px', background: '#6e5fc9', color: 'white', border: '1px solid #5a4db3', borderRadius: '8px', fontSize: '12px', fontWeight: 600, flexShrink: 0, cursor: 'pointer' }}>찾기</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--muted)]">수하인 (Consignee)</label>
                  <div className="flex gap-2" style={{ display: 'flex', gap: '4px' }}>
                    <input type="text" value={formData.consignee} onChange={e => handleChange('consignee', e.target.value)} className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" style={{ flex: 1, minWidth: 0 }} />
                    <button style={{ minWidth: '44px', height: '38px', background: '#6e5fc9', color: 'white', border: '1px solid #5a4db3', borderRadius: '8px', fontSize: '12px', fontWeight: 600, flexShrink: 0, cursor: 'pointer' }}>찾기</button>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Notify Party</label>
                  <input type="text" value={formData.notifyParty} onChange={e => handleChange('notifyParty', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
                </div>
              </div>
            </div>

            {/* 구간/일정 정보 */}
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">구간/일정 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--muted)]">출발지 (Origin)</label>
                  <div className="flex gap-2" style={{ display: 'flex', gap: '4px' }}>
                    <input type="text" value={formData.origin} onChange={e => handleChange('origin', e.target.value)} placeholder="ICN" className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" style={{ flex: 1, minWidth: 0 }} />
                    <button onClick={() => { setLocationField('origin'); setShowLocationModal(true); }} style={{ minWidth: '44px', height: '38px', background: '#6e5fc9', color: 'white', border: '1px solid #5a4db3', borderRadius: '8px', fontSize: '12px', fontWeight: 600, flexShrink: 0, cursor: 'pointer' }}>찾기</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--muted)]">도착지 (Destination)</label>
                  <div className="flex gap-2" style={{ display: 'flex', gap: '4px' }}>
                    <input type="text" value={formData.destination} onChange={e => handleChange('destination', e.target.value)} placeholder="LAX" className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" style={{ flex: 1, minWidth: 0 }} />
                    <button onClick={() => { setLocationField('destination'); setShowLocationModal(true); }} style={{ minWidth: '44px', height: '38px', background: '#6e5fc9', color: 'white', border: '1px solid #5a4db3', borderRadius: '8px', fontSize: '12px', fontWeight: 600, flexShrink: 0, cursor: 'pointer' }}>찾기</button>
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
