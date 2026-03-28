'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import CarrierCodeModal from '@/components/popup/CarrierCodeModal';
import LocationCodeModal from '@/components/popup/LocationCodeModal';
import SearchIconButton from '@/components/SearchIconButton';

interface HblRow {
  no: number;
  hblNo: string;
  shipper: string;
  consignee: string;
  packageQty: number;
  weight: number;
  cbm: number;
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  // Close confirm
  const [showCloseModal, setShowCloseModal] = useState(false);
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

  // 기본정보 states
  const [mblNo, setMblNo] = useState('');
  const [carrierCode, setCarrierCode] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [obDate, setObDate] = useState('');
  const [arDate, setArDate] = useState('');

  // 운송정보 states
  const [vessel, setVessel] = useState('');
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

  // 화물 총괄 정보 states
  const [hblCount, setHblCount] = useState<number>(0);
  const [totalPackage, setTotalPackage] = useState<number>(0);
  const [packageType, setPackageType] = useState('CT');
  const [totalWeight, setTotalWeight] = useState<number>(0);
  const [totalCbm, setTotalCbm] = useState<number>(0);

  // House B/L 목록
  const [hblList, setHblList] = useState<HblRow[]>([]);

  // 비고
  const [remark, setRemark] = useState('');

  // Modal states
  const [showCarrierModal, setShowCarrierModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationField, setLocationField] = useState<'pol' | 'pod' | 'podl' | 'fd'>('pol');

  // Handlers
  const handleList = () => router.push('/logis/import-bl/sea/master');
  const handleNew = () => {
    setMblNo('');
    setCarrierCode(''); setCarrierName('');
    setObDate(''); setArDate('');
    setVessel('');
    setPol(''); setPolName('');
    setPod(''); setPodName('');
    setPodl(''); setPodlName('');
    setFd(''); setFdName('');
    setServiceTerm(''); setEtd(''); setEta(''); setFreightTerm('');
    setHblCount(0); setTotalPackage(0); setPackageType('CT');
    setTotalWeight(0); setTotalCbm(0);
    setHblList([]);
    setRemark('');
  };
  const handleSave = () => { alert('저장되었습니다.'); handleList(); };

  const handleAddHbl = () => {
    const newRow: HblRow = {
      no: hblList.length + 1,
      hblNo: '',
      shipper: '',
      consignee: '',
      packageQty: 0,
      weight: 0,
      cbm: 0,
    };
    setHblList([...hblList, newRow]);
  };

  const openLocationModal = (field: 'pol' | 'pod' | 'podl' | 'fd') => {
    setLocationField(field);
    setShowLocationModal(true);
  };

  // 수정 모드일 경우 데이터 로드
  useEffect(() => {
    if (!editId) return;
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/bl/mbl?mblId=${editId}`);
        if (!res.ok) return;
        const d = await res.json();
        if (!d || d.error) return;
        // DB 컬럼(대문자) → 폼 state 매핑
        setMblNo(d.MBL_NO || d.mbl_no || '');
        setCarrierCode(d.CARRIER_ID ? String(d.CARRIER_ID) : '');
        setObDate(d.on_board_dt || d.ON_BOARD_DT || '');
        setArDate(d.ata_dt || d.ATA_DT || d.eta_dt || d.ETA_DT || '');
        setVessel(
          [d.VESSEL_NM || d.vessel_nm, d.VOYAGE_NO || d.voyage_no].filter(Boolean).join(' / ')
        );
        setPol(d.POL_PORT_CD || d.pol_port_cd || '');
        setPod(d.POD_PORT_CD || d.pod_port_cd || '');
        setPodl(d.PLACE_OF_DELIVERY || d.place_of_delivery || '');
        setFd(d.FINAL_DEST || d.final_dest || '');
        setServiceTerm(d.SERVICE_TERM_CD || d.service_term_cd || '');
        setEtd(d.etd_dt || d.ETD_DT || '');
        setEta(d.eta_dt || d.ETA_DT || '');
        setFreightTerm(d.FREIGHT_TERM_CD || d.freight_term_cd || '');
        setTotalPackage(Number(d.TOTAL_PKG_QTY || d.total_pkg_qty) || 0);
        setPackageType(d.PKG_TYPE_CD || d.pkg_type_cd || 'CT');
        setTotalWeight(Number(d.GROSS_WEIGHT_KG || d.gross_weight_kg) || 0);
        setTotalCbm(Number(d.VOLUME_CBM || d.volume_cbm) || 0);
        setHblCount(Number(d.hbl_count) || 0);
        setRemark('');
      } catch (err) {
        console.error('Failed to load MBL data:', err);
      }
    };
    fetchData();
  }, [editId]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="main-content">
        <Header
          title={editId ? "Master B/L 수정" : "Master B/L 등록"}
          subtitle="Logis > 해상수입 > Master B/L 관리 > 등록"
          onClose={handleCloseClick}
        />
        <main className="p-6">
          {/* Sticky 버튼 영역 */}
          <div className="sticky top-20 z-20 bg-white border-b border-gray-200 py-2 flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <button onClick={handleList} className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200">목록</button>
            </div>
            <div className="flex gap-2">
              <button onClick={handleNew} className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200">신규</button>
              <button onClick={handleSave} className="px-6 py-2 bg-[#E8A838] text-[#0C1222] font-semibold rounded-lg hover:bg-[#D4943A]">저장</button>
            </div>
          </div>

          {/* 1. 기본정보 */}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">기본정보</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">M.B/L NO</label>
                <input type="text" value={mblNo} onChange={e => setMblNo(e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="Master B/L 번호" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-500">선사 (Carrier)</label>
                <div className="flex gap-1">
                  <input type="text" value={carrierCode} onChange={e => setCarrierCode(e.target.value)} className="w-[80px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" />
                  <SearchIconButton onClick={() => setShowCarrierModal(true)} />
                  <input type="text" value={carrierName} readOnly className="flex-1 h-[32px] px-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-500" placeholder="선사명" />
                </div>
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

          {/* 2. 운송 정보 */}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">운송 정보</h3>
            <div className="grid grid-cols-4 gap-4">
              {/* Row 1 */}
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Vessel/Voyage</label>
                <input type="text" value={vessel} onChange={e => setVessel(e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="선명/항차" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-500">POL</label>
                <div className="flex gap-1">
                  <input type="text" value={pol} onChange={e => setPol(e.target.value)} className="w-[80px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" />
                  <SearchIconButton onClick={() => openLocationModal('pol')} />
                  <input type="text" value={polName} readOnly className="flex-1 h-[32px] px-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-500" placeholder="이름" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-500">POD</label>
                <div className="flex gap-1">
                  <input type="text" value={pod} onChange={e => setPod(e.target.value)} className="w-[80px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" />
                  <SearchIconButton onClick={() => openLocationModal('pod')} />
                  <input type="text" value={podName} readOnly className="flex-1 h-[32px] px-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-500" placeholder="이름" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-500">Place of Delivery</label>
                <div className="flex gap-1">
                  <input type="text" value={podl} onChange={e => setPodl(e.target.value)} className="w-[80px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" />
                  <SearchIconButton onClick={() => openLocationModal('podl')} />
                  <input type="text" value={podlName} readOnly className="flex-1 h-[32px] px-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-500" placeholder="이름" />
                </div>
              </div>

              {/* Row 2 */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-500">Final Destination</label>
                <div className="flex gap-1">
                  <input type="text" value={fd} onChange={e => setFd(e.target.value)} className="w-[80px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" />
                  <SearchIconButton onClick={() => openLocationModal('fd')} />
                  <input type="text" value={fdName} readOnly className="flex-1 h-[32px] px-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-500" placeholder="이름" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Service Term</label>
                <select value={serviceTerm} onChange={e => setServiceTerm(e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg">
                  <option value="">선택</option>
                  <option value="CY/CY">CY/CY</option>
                  <option value="CFS/CFS">CFS/CFS</option>
                  <option value="CY/CFS">CY/CFS</option>
                  <option value="CFS/CY">CFS/CY</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">ETD</label>
                <input type="date" value={etd} onChange={e => setEtd(e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">ETA</label>
                <input type="date" value={eta} onChange={e => setEta(e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>

              {/* Row 3 */}
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Freight Term</label>
                <select value={freightTerm} onChange={e => setFreightTerm(e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg">
                  <option value="">선택</option>
                  <option value="Prepaid">Prepaid</option>
                  <option value="Collect">Collect</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. 화물 총괄 정보 */}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">화물 총괄 정보</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">HBL Count</label>
                <input type="number" value={hblCount} onChange={e => setHblCount(Number(e.target.value))} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Total Package</label>
                <div className="flex gap-2">
                  <input type="number" value={totalPackage} onChange={e => setTotalPackage(Number(e.target.value))} className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="0" />
                  <select value={packageType} onChange={e => setPackageType(e.target.value)} className="w-[100px] px-2 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg">
                    <option value="CT">CT</option>
                    <option value="PKG">PKG</option>
                    <option value="PLT">PLT</option>
                    <option value="PCS">PCS</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Total Gross Weight (KG)</label>
                <input type="number" value={totalWeight} onChange={e => setTotalWeight(Number(e.target.value))} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="0.000" step="0.001" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Total Measurement (CBM)</label>
                <input type="number" value={totalCbm} onChange={e => setTotalCbm(Number(e.target.value))} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="0.000" step="0.001" />
              </div>
            </div>
          </div>

          {/* 4. House B/L 목록 */}
          <div className="card p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">House B/L 목록</h3>
              <button onClick={handleAddHbl} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">House B/L 추가</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 w-[60px]">No</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">H.B/L NO</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Shipper</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Consignee</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Package</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Weight(KG)</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">CBM</th>
                  </tr>
                </thead>
                <tbody>
                  {hblList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-400">등록된 House B/L이 없습니다.</td>
                    </tr>
                  ) : (
                    hblList.map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">{row.no}</td>
                        <td className="px-4 py-2">
                          <input type="text" value={row.hblNo} onChange={e => {
                            const updated = [...hblList];
                            updated[idx] = { ...updated[idx], hblNo: e.target.value };
                            setHblList(updated);
                          }} className="w-full px-2 py-1 border border-gray-300 rounded text-sm" placeholder="H.B/L NO" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="text" value={row.shipper} onChange={e => {
                            const updated = [...hblList];
                            updated[idx] = { ...updated[idx], shipper: e.target.value };
                            setHblList(updated);
                          }} className="w-full px-2 py-1 border border-gray-300 rounded text-sm" placeholder="Shipper" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="text" value={row.consignee} onChange={e => {
                            const updated = [...hblList];
                            updated[idx] = { ...updated[idx], consignee: e.target.value };
                            setHblList(updated);
                          }} className="w-full px-2 py-1 border border-gray-300 rounded text-sm" placeholder="Consignee" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" value={row.packageQty} onChange={e => {
                            const updated = [...hblList];
                            updated[idx] = { ...updated[idx], packageQty: Number(e.target.value) };
                            setHblList(updated);
                          }} className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" value={row.weight} onChange={e => {
                            const updated = [...hblList];
                            updated[idx] = { ...updated[idx], weight: Number(e.target.value) };
                            setHblList(updated);
                          }} className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right" step="0.001" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" value={row.cbm} onChange={e => {
                            const updated = [...hblList];
                            updated[idx] = { ...updated[idx], cbm: Number(e.target.value) };
                            setHblList(updated);
                          }} className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right" step="0.001" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. 비고 */}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">비고</h3>
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Remark</label>
              <textarea value={remark} onChange={e => setRemark(e.target.value)} rows={2} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg resize-none" placeholder="비고 사항을 입력하세요" />
            </div>
          </div>

        </main>
      </div>
      <CloseConfirmModal isOpen={showCloseModal} onConfirm={handleConfirm} onClose={() => setShowCloseModal(false)} />
      <CarrierCodeModal
        isOpen={showCarrierModal}
        onClose={() => setShowCarrierModal(false)}
        onSelect={(item) => {
          setCarrierCode(item.code);
          setCarrierName(item.nameKr);
          setShowCarrierModal(false);
        }}
      />
      <LocationCodeModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelect={(item) => {
          if (locationField === 'pol') { setPol(item.code); setPolName(item.nameEn || item.nameKr || ''); }
          else if (locationField === 'pod') { setPod(item.code); setPodName(item.nameEn || item.nameKr || ''); }
          else if (locationField === 'podl') { setPodl(item.code); setPodlName(item.nameEn || item.nameKr || ''); }
          else if (locationField === 'fd') { setFd(item.code); setFdName(item.nameEn || item.nameKr || ''); }
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
