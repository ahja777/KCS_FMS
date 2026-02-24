'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import CodeSearchModal, { CodeType, CodeItem } from '@/components/popup/CodeSearchModal';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [showCloseModal, setShowCloseModal] = useState(false);
  const handleConfirmClose = useCallback(() => {
    setShowCloseModal(false);
    router.push('/logis/import-bl/sea/house');
  }, [router]);

  const { handleConfirm } = useCloseConfirm({
    showModal: showCloseModal,
    setShowModal: setShowCloseModal,
    onConfirmClose: handleConfirmClose,
  });

  const handleCloseClick = () => setShowCloseModal(true);

  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeField, setCodeField] = useState<string>('');
  const [shipper, setShipper] = useState('');
  const [consignee, setConsignee] = useState('');

  const handleList = () => router.push('/logis/import-bl/sea/house');
  const handleSave = () => { alert('저장되었습니다.'); handleList(); };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="ml-56">
        <Header
          title={editId ? "House B/L 수정" : "House B/L 등록"}
          subtitle="Logis 
        onClose={() => setShowCloseModal(true)}> 해상수입 > House B/L 관리 > 등록"
          onClose={handleCloseClick}
        />
        <main className="p-6">
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">기본정보</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">H.B/L NO</label>
                <input type="text" className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="House B/L 번호" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">M.B/L NO</label>
                <input type="text" className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="Master B/L 번호" />
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
            <h3 className="text-lg font-bold mb-4">거래처 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Shipper</label>
                <div className="flex gap-2 items-start">
                  <textarea value={shipper} onChange={e => setShipper(e.target.value)} className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg h-24" placeholder="화주 정보" />
                  <button type="button" onClick={() => { setCodeField('shipper'); setShowCodeModal(true); }} style={{ minWidth: '44px', height: '38px', background: '#6e5fc9', color: 'white', border: '1px solid #5a4db3', borderRadius: '8px', fontSize: '12px', fontWeight: 600, flexShrink: 0, cursor: 'pointer' }}>찾기</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Consignee</label>
                <div className="flex gap-2 items-start">
                  <textarea value={consignee} onChange={e => setConsignee(e.target.value)} className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg h-24" placeholder="수하인 정보" />
                  <button type="button" onClick={() => { setCodeField('consignee'); setShowCodeModal(true); }} style={{ minWidth: '44px', height: '38px', background: '#6e5fc9', color: 'white', border: '1px solid #5a4db3', borderRadius: '8px', fontSize: '12px', fontWeight: 600, flexShrink: 0, cursor: 'pointer' }}>찾기</button>
                </div>
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
      <CodeSearchModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        onSelect={(item) => {
          if (codeField === 'shipper') setShipper(item.name);
          else if (codeField === 'consignee') setConsignee(item.name);
          setShowCodeModal(false);
        }}
        codeType="customer"
      />
    </div>
  );
}

export default function ImportHouseBLRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)] flex items-center justify-center">Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
