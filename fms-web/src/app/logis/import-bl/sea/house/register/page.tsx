'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import CodeSearchModal, { CodeType, CodeItem } from '@/components/popup/CodeSearchModal';
import SearchIconButton from '@/components/SearchIconButton';

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
  const [shipperCode, setShipperCode] = useState('');
  const [shipperName, setShipperName] = useState('');
  const [consigneeCode, setConsigneeCode] = useState('');
  const [consigneeName, setConsigneeName] = useState('');

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
          <div className="sticky top-0 z-20 bg-white border-b border-gray-200 py-2 flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <button onClick={handleList} className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200">목록</button>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} className="px-6 py-2 bg-[#E8A838] text-[#0C1222] font-semibold rounded-lg hover:bg-[#D4943A]">저장</button>
            </div>
          </div>
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
                <label className="block text-sm font-medium mb-1 text-gray-500">Shipper</label>
                <div className="flex gap-1">
                  <input type="text" value={shipperCode} onChange={e => setShipperCode(e.target.value)} className="w-[120px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" />
                  <SearchIconButton onClick={() => { setCodeField('shipper'); setShowCodeModal(true); }} />
                  <input type="text" value={shipperName} onChange={e => setShipperName(e.target.value)} className="flex-1 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="이름/상호" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-500">Consignee</label>
                <div className="flex gap-1">
                  <input type="text" value={consigneeCode} onChange={e => setConsigneeCode(e.target.value)} className="w-[120px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" />
                  <SearchIconButton onClick={() => { setCodeField('consignee'); setShowCodeModal(true); }} />
                  <input type="text" value={consigneeName} onChange={e => setConsigneeName(e.target.value)} className="flex-1 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="이름/상호" />
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
      <CloseConfirmModal isOpen={showCloseModal} onConfirm={handleConfirm} onClose={() => setShowCloseModal(false)} />
      <CodeSearchModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        onSelect={(item) => {
          if (codeField === 'shipper') { setShipperCode(item.code); setShipperName(item.name); }
          else if (codeField === 'consignee') { setConsigneeCode(item.code); setConsigneeName(item.name); }
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
