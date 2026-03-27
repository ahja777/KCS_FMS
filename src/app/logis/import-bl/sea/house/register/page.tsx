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
import LocationCodeModal, { LocationItem } from '@/components/popup/LocationCodeModal';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  // Close confirm
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

  // ── 기본정보 ──
  const [hblNo, setHblNo] = useState('');
  const [mblNo, setMblNo] = useState('');
  const [obDate, setObDate] = useState('');
  const [arDate, setArDate] = useState('');

  // ── 거래처 정보 ──
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeField, setCodeField] = useState<string>('');
  const [shipperCode, setShipperCode] = useState('');
  const [shipperName, setShipperName] = useState('');
  const [consigneeCode, setConsigneeCode] = useState('');
  const [consigneeName, setConsigneeName] = useState('');
  const [notifyCode, setNotifyCode] = useState('');
  const [notifyName, setNotifyName] = useState('');

  // ── 운송 정보 ──
  const [vesselVoyage, setVesselVoyage] = useState('');
  const [pol, setPol] = useState('');
  const [polName, setPolName] = useState('');
  const [pod, setPod] = useState('');
  const [podName, setPodName] = useState('');
  const [podl, setPodl] = useState('');
  const [podlName, setPodlName] = useState('');
  const [fd, setFd] = useState('');
  const [fdName, setFdName] = useState('');
  const [serviceTerm, setServiceTerm] = useState('');
  const [etd, setEtd] = useState('');
  const [eta, setEta] = useState('');
  const [freightTerm, setFreightTerm] = useState('');
  const [freightPayableAt, setFreightPayableAt] = useState('');

  // ── Location modal ──
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationField, setLocationField] = useState<string>('');

  // ── 화물 정보 ──
  const [packageQty, setPackageQty] = useState('');
  const [packageType, setPackageType] = useState('');
  const [grossWeight, setGrossWeight] = useState('');
  const [measurement, setMeasurement] = useState('');
  const [descriptionOfGoods, setDescriptionOfGoods] = useState('');

  // ── Mark & Numbers ──
  const [markNumbers, setMarkNumbers] = useState('');

  // ── 비고 ──
  const [remark, setRemark] = useState('');

  // 목록/신규/저장 핸들러
  const handleList = () => router.push('/logis/import-bl/sea/house');
  const handleNew = () => {
    setHblNo(''); setMblNo(''); setObDate(''); setArDate('');
    setShipperCode(''); setShipperName('');
    setConsigneeCode(''); setConsigneeName('');
    setNotifyCode(''); setNotifyName('');
    setVesselVoyage('');
    setPol(''); setPolName('');
    setPod(''); setPodName('');
    setPodl(''); setPodlName('');
    setFd(''); setFdName('');
    setServiceTerm(''); setEtd(''); setEta('');
    setFreightTerm(''); setFreightPayableAt('');
    setPackageQty(''); setPackageType('');
    setGrossWeight(''); setMeasurement('');
    setDescriptionOfGoods('');
    setMarkNumbers('');
    setRemark('');
  };
  const handleSave = () => { alert('저장되었습니다.'); handleList(); };

  // CodeSearchModal 선택 핸들러
  const handleCodeSelect = (item: CodeItem) => {
    if (codeField === 'shipper') { setShipperCode(item.code); setShipperName(item.name); }
    else if (codeField === 'consignee') { setConsigneeCode(item.code); setConsigneeName(item.name); }
    else if (codeField === 'notify') { setNotifyCode(item.code); setNotifyName(item.name); }
    setShowCodeModal(false);
  };

  // LocationCodeModal 선택 핸들러
  const handleLocationSelect = (item: LocationItem) => {
    if (locationField === 'pol') { setPol(item.code); setPolName(item.nameEn); }
    else if (locationField === 'pod') { setPod(item.code); setPodName(item.nameEn); }
    else if (locationField === 'podl') { setPodl(item.code); setPodlName(item.nameEn); }
    else if (locationField === 'fd') { setFd(item.code); setFdName(item.nameEn); }
    setShowLocationModal(false);
  };

  const openCodeModal = (field: string) => {
    setCodeField(field);
    setShowCodeModal(true);
  };

  const openLocationModal = (field: string) => {
    setLocationField(field);
    setShowLocationModal(true);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="main-content">
        <Header
          title={editId ? "House B/L 수정" : "House B/L 등록"}
          subtitle="Logis > 해상수입 > House B/L 관리 > 등록"
          onClose={handleCloseClick}
        />
        <main className="p-6">

          {/* ── Sticky 버튼 영역 ── */}
          <div className="sticky top-20 z-20 bg-white border-b border-gray-200 py-2 flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <button onClick={handleList} className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200">목록</button>
            </div>
            <div className="flex gap-2">
              <button onClick={handleNew} className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200">신규</button>
              <button onClick={handleSave} className="px-6 py-2 bg-[#E8A838] text-[#0C1222] font-semibold rounded-lg hover:bg-[#D4943A]">저장</button>
            </div>
          </div>

          {/* ── 1. 기본정보 ── */}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">기본정보</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">H.B/L NO</label>
                <input type="text" value={hblNo} onChange={e => setHblNo(e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="House B/L 번호" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">M.B/L NO</label>
                <input type="text" value={mblNo} onChange={e => setMblNo(e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="Master B/L 번호" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">O/B Date</label>
                <input type="date" value={obDate} onChange={e => setObDate(e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">A/R Date</label>
                <input type="date" value={arDate} onChange={e => setArDate(e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
            </div>
          </div>

          {/* ── 2. 거래처 정보 ── */}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">거래처 정보</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-500">Shipper</label>
                <div className="flex gap-1">
                  <input type="text" value={shipperCode} onChange={e => setShipperCode(e.target.value)} className="w-[120px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" />
                  <SearchIconButton onClick={() => openCodeModal('shipper')} />
                  <input type="text" value={shipperName} onChange={e => setShipperName(e.target.value)} className="flex-1 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="이름/상호" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-500">Consignee</label>
                <div className="flex gap-1">
                  <input type="text" value={consigneeCode} onChange={e => setConsigneeCode(e.target.value)} className="w-[120px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" />
                  <SearchIconButton onClick={() => openCodeModal('consignee')} />
                  <input type="text" value={consigneeName} onChange={e => setConsigneeName(e.target.value)} className="flex-1 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="이름/상호" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-500">Notify Party</label>
                <div className="flex gap-1">
                  <input type="text" value={notifyCode} onChange={e => setNotifyCode(e.target.value)} className="w-[120px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" />
                  <SearchIconButton onClick={() => openCodeModal('notify')} />
                  <input type="text" value={notifyName} onChange={e => setNotifyName(e.target.value)} className="flex-1 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="이름/상호" />
                </div>
              </div>
            </div>
          </div>

          {/* ── 3. 운송 정보 ── */}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">운송 정보</h3>
            <div className="grid grid-cols-4 gap-4">
              {/* Row 1 */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-500">Vessel / Voyage</label>
                <input type="text" value={vesselVoyage} onChange={e => setVesselVoyage(e.target.value)} className="w-full h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="선명 / 항차" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-500">POL (선적항)</label>
                <div className="flex gap-1">
                  <input type="text" value={pol} onChange={e => setPol(e.target.value)} className="w-[80px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" />
                  <SearchIconButton onClick={() => openLocationModal('pol')} />
                  <input type="text" value={polName} readOnly className="flex-1 h-[32px] px-2 bg-gray-50 border border-gray-300 rounded text-sm" placeholder="선적항명" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-500">POD (양하항)</label>
                <div className="flex gap-1">
                  <input type="text" value={pod} onChange={e => setPod(e.target.value)} className="w-[80px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" />
                  <SearchIconButton onClick={() => openLocationModal('pod')} />
                  <input type="text" value={podName} readOnly className="flex-1 h-[32px] px-2 bg-gray-50 border border-gray-300 rounded text-sm" placeholder="양하항명" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-500">Place of Delivery</label>
                <div className="flex gap-1">
                  <input type="text" value={podl} onChange={e => setPodl(e.target.value)} className="w-[80px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" />
                  <SearchIconButton onClick={() => openLocationModal('podl')} />
                  <input type="text" value={podlName} readOnly className="flex-1 h-[32px] px-2 bg-gray-50 border border-gray-300 rounded text-sm" placeholder="인도지명" />
                </div>
              </div>

              {/* Row 2 */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-500">Final Destination</label>
                <div className="flex gap-1">
                  <input type="text" value={fd} onChange={e => setFd(e.target.value)} className="w-[80px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" />
                  <SearchIconButton onClick={() => openLocationModal('fd')} />
                  <input type="text" value={fdName} readOnly className="flex-1 h-[32px] px-2 bg-gray-50 border border-gray-300 rounded text-sm" placeholder="최종목적지명" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-500">Service Term</label>
                <select value={serviceTerm} onChange={e => setServiceTerm(e.target.value)} className="w-full h-[32px] px-2 bg-white border border-gray-300 rounded text-sm">
                  <option value="">선택</option>
                  <option value="CY/CY">CY/CY</option>
                  <option value="CFS/CFS">CFS/CFS</option>
                  <option value="CY/CFS">CY/CFS</option>
                  <option value="CFS/CY">CFS/CY</option>
                  <option value="CY/DOOR">CY/DOOR</option>
                  <option value="DOOR/CY">DOOR/CY</option>
                  <option value="CFS/DOOR">CFS/DOOR</option>
                  <option value="DOOR/CFS">DOOR/CFS</option>
                  <option value="DOOR/DOOR">DOOR/DOOR</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-500">ETD</label>
                <input type="date" value={etd} onChange={e => setEtd(e.target.value)} className="w-full h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-500">ETA</label>
                <input type="date" value={eta} onChange={e => setEta(e.target.value)} className="w-full h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" />
              </div>

              {/* Row 3 */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-500">Freight Term</label>
                <select value={freightTerm} onChange={e => setFreightTerm(e.target.value)} className="w-full h-[32px] px-2 bg-white border border-gray-300 rounded text-sm">
                  <option value="">선택</option>
                  <option value="Prepaid">Prepaid</option>
                  <option value="Collect">Collect</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-500">Freight Payable At</label>
                <input type="text" value={freightPayableAt} onChange={e => setFreightPayableAt(e.target.value)} className="w-full h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="운임지불지" />
              </div>
            </div>
          </div>

          {/* ── 4. 화물 정보 ── */}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">화물 정보</h3>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-500">Package</label>
                <div className="flex gap-1">
                  <input type="number" value={packageQty} onChange={e => setPackageQty(e.target.value)} className="flex-1 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="수량" />
                  <select value={packageType} onChange={e => setPackageType(e.target.value)} className="w-[100px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm">
                    <option value="">단위</option>
                    <option value="CT">CT</option>
                    <option value="PKG">PKG</option>
                    <option value="PLT">PLT</option>
                    <option value="PCS">PCS</option>
                    <option value="CS">CS</option>
                    <option value="BG">BG</option>
                    <option value="DR">DR</option>
                    <option value="SET">SET</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-500">Gross Weight (KG)</label>
                <input type="number" value={grossWeight} onChange={e => setGrossWeight(e.target.value)} className="w-full h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="0.000" step="0.001" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-500">Measurement (CBM)</label>
                <input type="number" value={measurement} onChange={e => setMeasurement(e.target.value)} className="w-full h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="0.000" step="0.001" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-500">Description of Goods</label>
              <textarea value={descriptionOfGoods} onChange={e => setDescriptionOfGoods(e.target.value)} rows={4} className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm" placeholder="화물 상세 내역" />
            </div>
          </div>

          {/* ── 5. Mark & Numbers ── */}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">Mark & Numbers</h3>
            <textarea value={markNumbers} onChange={e => setMarkNumbers(e.target.value)} rows={4} className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm" placeholder="Mark & Numbers" />
          </div>

          {/* ── 6. 비고 ── */}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">비고</h3>
            <textarea value={remark} onChange={e => setRemark(e.target.value)} rows={2} className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm" placeholder="Remark" />
          </div>

        </main>
      </div>

      {/* ── Modals ── */}
      <CloseConfirmModal isOpen={showCloseModal} onConfirm={handleConfirm} onClose={() => setShowCloseModal(false)} />
      <CodeSearchModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        onSelect={handleCodeSelect}
        codeType="customer"
      />
      <LocationCodeModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelect={handleLocationSelect}
        type="seaport"
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
