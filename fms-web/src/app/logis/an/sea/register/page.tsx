'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useScreenClose } from '@/hooks/useScreenClose';
import {
  CodeSearchModal,
  LocationCodeModal,
  BLSearchModal,
  type CodeItem,
  type CodeType,
  type LocationItem,
  type SeaBL,
  type AirBL,
} from '@/components/popup';

interface ANFormData {
  anNo: string;
  anDate: string;
  blNo: string;
  hblNo: string;
  shipper: string;
  shipperAddr: string;
  consignee: string;
  consigneeAddr: string;
  notifyParty: string;
  notifyAddr: string;
  carrierCd: string;
  carrierNm: string;
  vesselNm: string;
  voyageNo: string;
  pol: string;
  pod: string;
  finalDest: string;
  etd: string;
  atd: string;
  eta: string;
  ata: string;
  cargoStatus: string;
  customsStatus: string;
  containerInfo: string;
  containerCnt: number;
  packageCnt: number;
  grossWeight: number;
  measurement: number;
  commodity: string;
  freightType: string;
  freightAmt: number;
  currency: string;
  storageInfo: string;
  remarks: string;
}

const initialFormData: ANFormData = {
  anNo: '자동생성',
  anDate: new Date().toISOString().split('T')[0],
  blNo: '',
  hblNo: '',
  shipper: '',
  shipperAddr: '',
  consignee: '',
  consigneeAddr: '',
  notifyParty: '',
  notifyAddr: '',
  carrierCd: '',
  carrierNm: '',
  vesselNm: '',
  voyageNo: '',
  pol: '',
  pod: 'KRPUS',
  finalDest: '',
  etd: '',
  atd: '',
  eta: '',
  ata: '',
  cargoStatus: 'IN_TRANSIT',
  customsStatus: 'PENDING',
  containerInfo: '',
  containerCnt: 1,
  packageCnt: 0,
  grossWeight: 0,
  measurement: 0,
  commodity: '',
  freightType: 'CC',
  freightAmt: 0,
  currency: 'USD',
  storageInfo: '',
  remarks: '',
};

export default function ANSeaRegisterPage() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const [formData, setFormData] = useState<ANFormData>(initialFormData);
  const [hasChanges, setHasChanges] = useState(false);

  const {
    showModal: showCloseModal,
    handleCloseClick,
    handleModalClose,
    handleDiscard,
  } = useScreenClose({
    hasChanges,
    listPath: '/logis/an/sea',
  });

  // 팝업 상태
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showBLModal, setShowBLModal] = useState(false);
  const [currentField, setCurrentField] = useState<string>('');
  const [currentCodeType, setCurrentCodeType] = useState<CodeType>('customer');

  const handleChange = (field: keyof ANFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleCodeSearch = (field: string, codeType: CodeType) => {
    setCurrentField(field);
    setCurrentCodeType(codeType);
    setShowCodeModal(true);
  };

  const handleCodeSelect = (item: CodeItem) => {
    if (currentField === 'shipper') {
      setFormData(prev => ({ ...prev, shipper: item.name }));
    } else if (currentField === 'consignee') {
      setFormData(prev => ({ ...prev, consignee: item.name }));
    } else if (currentField === 'carrier') {
      setFormData(prev => ({ ...prev, carrierCd: item.code, carrierNm: item.name }));
    }
    setShowCodeModal(false);
    setHasChanges(true);
  };

  const handleLocationSearch = (field: string) => {
    setCurrentField(field);
    setShowLocationModal(true);
  };

  const handleLocationSelect = (item: LocationItem) => {
    setFormData(prev => ({ ...prev, [currentField]: item.code }));
    setShowLocationModal(false);
    setHasChanges(true);
  };

  const handleBLSelect = (bl: SeaBL | AirBL) => {
    if ('blNo' in bl) {
      setFormData(prev => ({
        ...prev,
        blNo: bl.blNo,
        shipper: bl.shipper,
        consignee: bl.consignee,
        pol: bl.pol,
        pod: bl.pod,
        vesselNm: bl.vessel,
        voyageNo: bl.voyageNo,
        carrierNm: bl.line,
      }));
      setHasChanges(true);
    }
    setShowBLModal(false);
  };

  const handleSubmit = async () => {
    if (!formData.consignee) {
      alert('수하인을 입력하세요.');
      return;
    }

    try {
      const response = await fetch('/api/an/sea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        alert(`도착통지(A/N)가 등록되었습니다.\nA/N 번호: ${result.anNo}`);
        router.push('/logis/an/sea');
      } else {
        alert('등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to save A/N:', error);
      alert('등록 중 오류가 발생했습니다.');
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setHasChanges(false);
  };

  const handleFillTestData = () => {
    setFormData({
      ...initialFormData,
      blNo: 'HDMU9876543',
      hblNo: 'HKCS0010',
      shipper: 'Global Electronics Corp.',
      shipperAddr: '123 Export Street, Los Angeles, CA 90001, USA',
      consignee: '삼성전자',
      consigneeAddr: '서울특별시 서초구 서초대로 74길 11',
      notifyParty: '삼성전자',
      notifyAddr: '서울특별시 서초구 서초대로 74길 11',
      carrierCd: 'HMM',
      carrierNm: 'HMM',
      vesselNm: 'HMM ALGECIRAS',
      voyageNo: '025E',
      pol: 'USLAX',
      pod: 'KRPUS',
      finalDest: 'KRSEL',
      etd: '2026-01-15',
      eta: '2026-02-01',
      cargoStatus: 'IN_TRANSIT',
      customsStatus: 'PENDING',
      containerInfo: '40HC x 2, 20GP x 1',
      containerCnt: 3,
      packageCnt: 250,
      grossWeight: 35000,
      measurement: 120.5,
      commodity: 'Electronic Components',
      freightType: 'CC',
      freightAmt: 5500,
      currency: 'USD',
      storageInfo: '부산신항 HPNT 터미널',
      remarks: '긴급 통관 요청',
    });
    setHasChanges(true);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header
        title="도착통지 등록 (A/N) - 해상"
        subtitle="Logis > 해상수입 > 도착통지 등록"
        onClose={handleCloseClick}
      />
      <main ref={formRef} className="p-6">
        <div className="flex justify-between items-center mb-6">
          <span className="text-sm text-[var(--muted)]">화면 ID: AN-SEA-REG</span>
          <div className="flex gap-2">
            <button onClick={() => router.push('/logis/an/sea/register')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">신규</button>
            <button onClick={handleFillTestData} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">테스트</button>
            <button onClick={handleReset} className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] font-medium">초기화</button>
            <button onClick={() => router.push('/logis/an/sea')} className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] font-medium">목록</button>
            <button onClick={handleSubmit} className="px-6 py-2 bg-[#E8A838] text-[#0C1222] font-semibold rounded-lg hover:bg-[#D4943A]">저장</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* 기본 정보 */}
          <div className="card p-6">
            <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">기본 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">A/N 번호</label>
                <input type="text" value={formData.anNo} disabled className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">A/N 일자 *</label>
                <input type="date" value={formData.anDate} onChange={e => handleChange('anDate', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">M/BL 번호</label>
                <div className="flex gap-2">
                  <input type="text" value={formData.blNo} onChange={e => handleChange('blNo', e.target.value)} className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="HDMU1234567" />
                  <button onClick={() => setShowBLModal(true)} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm">찾기</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">H/BL 번호</label>
                <input type="text" value={formData.hblNo} onChange={e => handleChange('hblNo', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="HKCS0001" />
              </div>
            </div>
          </div>

          {/* 운송 정보 */}
          <div className="card p-6">
            <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">운송 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">선사</label>
                <div className="flex gap-2">
                  <input type="text" value={formData.carrierNm} onChange={e => handleChange('carrierNm', e.target.value)} className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
                  <button onClick={() => handleCodeSearch('carrier', 'carrier')} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm">찾기</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">선명/항차</label>
                <div className="flex gap-2">
                  <input type="text" value={formData.vesselNm} onChange={e => handleChange('vesselNm', e.target.value)} className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="선명" />
                  <input type="text" value={formData.voyageNo} onChange={e => handleChange('voyageNo', e.target.value)} className="w-24 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="항차" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">선적항 (POL)</label>
                <div className="flex gap-2">
                  <input type="text" value={formData.pol} onChange={e => handleChange('pol', e.target.value)} className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="USLAX" />
                  <button onClick={() => handleLocationSearch('pol')} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm">찾기</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">양하항 (POD)</label>
                <div className="flex gap-2">
                  <input type="text" value={formData.pod} onChange={e => handleChange('pod', e.target.value)} className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="KRPUS" />
                  <button onClick={() => handleLocationSearch('pod')} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm">찾기</button>
                </div>
              </div>
            </div>
          </div>

          {/* 화주/수하인 정보 */}
          <div className="card p-6">
            <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">화주/수하인 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">송하인 (Shipper)</label>
                <div className="flex gap-2">
                  <input type="text" value={formData.shipper} onChange={e => handleChange('shipper', e.target.value)} className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
                  <button onClick={() => handleCodeSearch('shipper', 'customer')} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm">찾기</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">수하인 (Consignee) *</label>
                <div className="flex gap-2">
                  <input type="text" value={formData.consignee} onChange={e => handleChange('consignee', e.target.value)} className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
                  <button onClick={() => handleCodeSearch('consignee', 'customer')} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm">찾기</button>
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">수하인 주소</label>
                <input type="text" value={formData.consigneeAddr} onChange={e => handleChange('consigneeAddr', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Notify Party</label>
                <input type="text" value={formData.notifyParty} onChange={e => handleChange('notifyParty', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Notify 주소</label>
                <input type="text" value={formData.notifyAddr} onChange={e => handleChange('notifyAddr', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
            </div>
          </div>

          {/* 일정 정보 */}
          <div className="card p-6">
            <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">일정 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">ETD (출항예정)</label>
                <input type="date" value={formData.etd} onChange={e => handleChange('etd', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">ATD (실출항)</label>
                <input type="date" value={formData.atd} onChange={e => handleChange('atd', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">ETA (입항예정)</label>
                <input type="date" value={formData.eta} onChange={e => handleChange('eta', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">ATA (실입항)</label>
                <input type="date" value={formData.ata} onChange={e => handleChange('ata', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">화물상태</label>
                <select value={formData.cargoStatus} onChange={e => handleChange('cargoStatus', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg">
                  <option value="IN_TRANSIT">운송중</option>
                  <option value="ARRIVED">입항</option>
                  <option value="DISCHARGED">양하완료</option>
                  <option value="IN_CY">CY반입</option>
                  <option value="RELEASED">반출</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">통관상태</label>
                <select value={formData.customsStatus} onChange={e => handleChange('customsStatus', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg">
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
                <input type="text" value={formData.containerInfo} onChange={e => handleChange('containerInfo', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="40HC x 2, 20GP x 1" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">컨테이너 수</label>
                <input type="number" value={formData.containerCnt} onChange={e => handleChange('containerCnt', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">포장 수량</label>
                <input type="number" value={formData.packageCnt} onChange={e => handleChange('packageCnt', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">총중량 (KG)</label>
                <input type="number" step="0.001" value={formData.grossWeight} onChange={e => handleChange('grossWeight', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">용적 (CBM)</label>
                <input type="number" step="0.001" value={formData.measurement} onChange={e => handleChange('measurement', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">품명</label>
                <input type="text" value={formData.commodity} onChange={e => handleChange('commodity', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">운임구분</label>
                <select value={formData.freightType} onChange={e => handleChange('freightType', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg">
                  <option value="PP">Prepaid</option>
                  <option value="CC">Collect</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">운임금액</label>
                <input type="number" step="0.01" value={formData.freightAmt} onChange={e => handleChange('freightAmt', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">통화</label>
                <select value={formData.currency} onChange={e => handleChange('currency', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg">
                  <option value="USD">USD</option>
                  <option value="KRW">KRW</option>
                  <option value="EUR">EUR</option>
                  <option value="JPY">JPY</option>
                  <option value="CNY">CNY</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">보관정보</label>
                <input type="text" value={formData.storageInfo} onChange={e => handleChange('storageInfo', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="터미널/창고 정보" />
              </div>
            </div>
          </div>

          {/* 비고 */}
          <div className="card p-6 col-span-2">
            <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">비고</h3>
            <textarea value={formData.remarks} onChange={e => handleChange('remarks', e.target.value)} rows={3} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg resize-none" />
          </div>
        </div>
      </main>

      {/* 팝업 모달들 */}
      <CodeSearchModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        onSelect={handleCodeSelect}
        codeType={currentCodeType}
      />
      <LocationCodeModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelect={handleLocationSelect}
        type="seaport"
      />
      <BLSearchModal
        isOpen={showBLModal}
        onClose={() => setShowBLModal(false)}
        onSelect={handleBLSelect}
        type="sea"
      />
      <CloseConfirmModal
        isOpen={showCloseModal}
        onClose={handleModalClose}
        onConfirm={handleDiscard}
      />
    </div>
  );
}
