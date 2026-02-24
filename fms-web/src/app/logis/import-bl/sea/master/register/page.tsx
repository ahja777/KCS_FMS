'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import CarrierCodeModal from '@/components/popup/CarrierCodeModal';
import LocationCodeModal from '@/components/popup/LocationCodeModal';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [carrier, setCarrier] = useState('');
  const [pol, setPol] = useState('');
  const [pod, setPod] = useState('');
  const [showCarrierModal, setShowCarrierModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationField, setLocationField] = useState<'pol' | 'pod'>('pol');
  const handleConfirmClose = useCallback(() => {
    setShowCloseModal(false);
    router.push('/logis/import-bl/sea/master');
  }, [router]);

  const { handleConfirm } = useCloseConfirm({
    showModal: showCloseModal,
    setShowModal: setShowCloseModal,
    onConfirmClose: handleConfirmClose,
  });

  const handleCloseClick = () => setShowCloseModal(true);

  const handleList = () => router.push('/logis/import-bl/sea/master');
  const handleSave = () => { alert('저장되었습니다.'); handleList(); };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="ml-56">
        <Header
          title={editId ? "Master B/L 수정" : "Master B/L 등록"}
          subtitle="Logis 
        onClose={() => setShowCloseModal(true)}> 해상수입 > Master B/L 관리 > 등록"
          onClose={handleCloseClick}
        />
        <main className="p-6">
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">기본정보</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">M.B/L NO</label>
                <input type="text" className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="Master B/L 번호" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">선사</label>
                <div className="flex gap-2">
                  <input type="text" value={carrier} onChange={e => setCarrier(e.target.value)} className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="선사" />
                  <button type="button" onClick={() => setShowCarrierModal(true)} style={{ minWidth: '44px', height: '38px', background: '#6e5fc9', color: 'white', border: '1px solid #5a4db3', borderRadius: '8px', fontSize: '12px', fontWeight: 600, flexShrink: 0, cursor: 'pointer' }}>찾기</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">O/B Date</label>
                <input type="date" className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">A/R Date</label>
                <input type="date" className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
            </div>
          </div>

          <div className="card p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">운송정보</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Vessel/Voyage</label>
                <input type="text" className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="선명/항차" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">POL</label>
                <div className="flex gap-2">
                  <input type="text" value={pol} onChange={e => setPol(e.target.value)} className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="선적항" />
                  <button type="button" onClick={() => { setLocationField('pol'); setShowLocationModal(true); }} style={{ minWidth: '44px', height: '38px', background: '#6e5fc9', color: 'white', border: '1px solid #5a4db3', borderRadius: '8px', fontSize: '12px', fontWeight: 600, flexShrink: 0, cursor: 'pointer' }}>찾기</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">POD</label>
                <div className="flex gap-2">
                  <input type="text" value={pod} onChange={e => setPod(e.target.value)} className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="도착항" />
                  <button type="button" onClick={() => { setLocationField('pod'); setShowLocationModal(true); }} style={{ minWidth: '44px', height: '38px', background: '#6e5fc9', color: 'white', border: '1px solid #5a4db3', borderRadius: '8px', fontSize: '12px', fontWeight: 600, flexShrink: 0, cursor: 'pointer' }}>찾기</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">HBL Count</label>
                <input type="number" className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="0" />
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-2">
            <button onClick={handleSave} className="px-6 py-2 bg-[#E8A838] text-[#0C1222] font-semibold rounded-lg hover:bg-[#D4943A]">저장</button>
            <button onClick={handleList} className="px-6 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">목록</button>
          </div>
        </main>
      </div>
      <CloseConfirmModal isOpen={showCloseModal} onConfirm={handleConfirm} onClose={() => setShowCloseModal(false)} />
      <CarrierCodeModal
        isOpen={showCarrierModal}
        onClose={() => setShowCarrierModal(false)}
        onSelect={(item) => { setCarrier(item.code + ' ' + item.nameKr); setShowCarrierModal(false); }}
      />
      <LocationCodeModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelect={(item) => {
          if (locationField === 'pol') setPol(item.code);
          else setPod(item.code);
          setShowLocationModal(false);
        }}
        type="seaport"
      />
    </div>
  );
}

export default function ImportMasterBLRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)] flex items-center justify-center">Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
