'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useScreenClose } from '@/hooks/useScreenClose';
import {
  CodeSearchModal,
  LocationCodeModal,
  type CodeItem,
  type CodeType,
  type LocationItem,
} from '@/components/popup';
import SearchIconButton from '@/components/SearchIconButton';

interface ANFormData {
  anNo: string;
  anDate: string;
  mawbNo: string;
  hawbNo: string;
  shipperCd: string;
  shipper: string;
  shipperAddr: string;
  consigneeCd: string;
  consignee: string;
  consigneeAddr: string;
  notifyPartyCd: string;
  notifyParty: string;
  notifyAddr: string;
  airlineCd: string;
  airlineNm: string;
  flightNo: string;
  origin: string;
  originName: string;
  destination: string;
  destinationName: string;
  finalDest: string;
  finalDestName: string;
  etd: string;
  atd: string;
  eta: string;
  ata: string;
  cargoStatus: string;
  customsStatus: string;
  pieces: number;
  grossWeight: number;
  chargeableWeight: number;
  volume: number;
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
  mawbNo: '',
  hawbNo: '',
  shipperCd: '',
  shipper: '',
  shipperAddr: '',
  consigneeCd: '',
  consignee: '',
  consigneeAddr: '',
  notifyPartyCd: '',
  notifyParty: '',
  notifyAddr: '',
  airlineCd: '',
  airlineNm: '',
  flightNo: '',
  origin: '',
  originName: '',
  destination: 'ICN',
  destinationName: '',
  finalDest: '',
  finalDestName: '',
  etd: '',
  atd: '',
  eta: '',
  ata: '',
  cargoStatus: 'IN_TRANSIT',
  customsStatus: 'PENDING',
  pieces: 0,
  grossWeight: 0,
  chargeableWeight: 0,
  volume: 0,
  commodity: '',
  freightType: 'CC',
  freightAmt: 0,
  currency: 'USD',
  storageInfo: '',
  remarks: '',
};

function ANAirRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const [formData, setFormData] = useState<ANFormData>(initialFormData);
  const [hasChanges, setHasChanges] = useState(false);
  const [isNewMode, setIsNewMode] = useState(!editId);

  // 수정 모드: 기존 데이터 로드
  useEffect(() => {
    if (!editId) return;
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/an/air?id=${editId}`);
        const data = await response.json();
        if (data && !data.error) {
          setFormData({
            anNo: data.AN_NO || '자동생성',
            anDate: data.AN_DATE ? data.AN_DATE.split('T')[0] : initialFormData.anDate,
            mawbNo: data.MAWB_NO || '',
            hawbNo: data.HAWB_NO || '',
            shipperCd: data.SHIPPER_CD || '',
            shipper: data.SHIPPER || '',
            shipperAddr: data.SHIPPER_ADDR || '',
            consigneeCd: data.CONSIGNEE_CD || '',
            consignee: data.CONSIGNEE || '',
            consigneeAddr: data.CONSIGNEE_ADDR || '',
            notifyPartyCd: data.NOTIFY_PARTY_CD || '',
            notifyParty: data.NOTIFY_PARTY || '',
            notifyAddr: data.NOTIFY_ADDR || '',
            airlineCd: data.AIRLINE_CD || '',
            airlineNm: data.AIRLINE_NM || '',
            flightNo: data.FLIGHT_NO || '',
            origin: data.ORIGIN || '',
            originName: data.ORIGIN_NAME || '',
            destination: data.DESTINATION || 'ICN',
            destinationName: data.DESTINATION_NAME || '',
            finalDest: data.FINAL_DEST || '',
            finalDestName: data.FINAL_DEST_NAME || '',
            etd: data.ETD ? data.ETD.split('T')[0] : '',
            atd: data.ATD ? data.ATD.split('T')[0] : '',
            eta: data.ETA ? data.ETA.split('T')[0] : '',
            ata: data.ATA ? data.ATA.split('T')[0] : '',
            cargoStatus: data.CARGO_STATUS || 'IN_TRANSIT',
            customsStatus: data.CUSTOMS_STATUS || 'PENDING',
            pieces: data.PIECES || 0,
            grossWeight: data.GROSS_WEIGHT || 0,
            chargeableWeight: data.CHARGEABLE_WEIGHT || 0,
            volume: data.VOLUME || 0,
            commodity: data.COMMODITY || '',
            freightType: data.FREIGHT_TYPE || 'CC',
            freightAmt: data.FREIGHT_AMT || 0,
            currency: data.CURRENCY || 'USD',
            storageInfo: data.STORAGE_INFO || '',
            remarks: data.REMARKS || '',
          });
          setIsNewMode(false);
        }
      } catch (error) {
        console.error('Failed to load A/N data:', error);
      }
    };
    fetchData();
  }, [editId]);

  const {
    showModal: showCloseModal,
    handleCloseClick,
    handleModalClose,
    handleDiscard,
  } = useScreenClose({
    hasChanges,
    listPath: '/logis/an/air',
  });

  // 팝업 상태
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
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
      setFormData(prev => ({ ...prev, shipperCd: item.code, shipper: item.name }));
    } else if (currentField === 'consignee') {
      setFormData(prev => ({ ...prev, consigneeCd: item.code, consignee: item.name }));
    } else if (currentField === 'notifyParty') {
      setFormData(prev => ({ ...prev, notifyPartyCd: item.code, notifyParty: item.name }));
    } else if (currentField === 'airline') {
      setFormData(prev => ({ ...prev, airlineCd: item.code, airlineNm: item.name }));
    }
    setShowCodeModal(false);
    setHasChanges(true);
  };

  const handleLocationSearch = (field: string) => {
    setCurrentField(field);
    setShowLocationModal(true);
  };

  const handleLocationSelect = (item: LocationItem) => {
    const nameVal = item.nameEn || item.nameKr || '';
    setFormData(prev => ({ ...prev, [currentField]: item.code, [currentField + 'Name']: nameVal }));
    setShowLocationModal(false);
    setHasChanges(true);
  };

  const handleSubmit = async () => {
    if (!formData.consignee) {
      alert('수하인을 입력하세요.');
      return;
    }

    try {
      const method = editId ? 'PUT' : 'POST';
      const payload = editId ? { ...formData, id: Number(editId) } : formData;
      const response = await fetch('/api/an/air', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        if (editId) {
          alert('도착통지(A/N)가 수정되었습니다.');
        } else {
          alert(`도착통지(A/N)가 등록되었습니다.\nA/N 번호: ${result.anNo}`);
          router.replace(`/logis/an/air/register?id=${result.id}`);
        }
        setIsNewMode(false);
        setHasChanges(false);
      } else {
        alert('등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to save A/N:', error);
      alert('등록 중 오류가 발생했습니다.');
    }
  };

  const handleNew = () => {
    if (editId) { router.push('/logis/an/air/register'); return; }
    setFormData(initialFormData);
    setHasChanges(false);
    setIsNewMode(true);
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setHasChanges(false);
  };

  const handleFillTestData = () => {
    setFormData({
      ...initialFormData,
      mawbNo: '180-99887766',
      hawbNo: 'HKCS-A0010',
      shipperCd: 'SH002',
      shipper: '글로벌테크',
      shipperAddr: '456 Silicon Valley, San Jose, CA 95134, USA',
      consigneeCd: 'CN002',
      consignee: 'LG전자',
      consigneeAddr: '서울특별시 영등포구 여의대로 128',
      notifyPartyCd: 'CN002',
      notifyParty: 'LG전자',
      notifyAddr: '서울특별시 영등포구 여의대로 128',
      airlineCd: 'KE',
      airlineNm: '대한항공',
      flightNo: 'KE012',
      origin: 'SFO',
      originName: 'San Francisco Intl',
      destination: 'ICN',
      destinationName: 'Incheon Intl',
      finalDest: 'ICN',
      finalDestName: 'Incheon Intl',
      etd: '2026-01-28',
      eta: '2026-01-30',
      cargoStatus: 'IN_TRANSIT',
      customsStatus: 'PENDING',
      pieces: 150,
      grossWeight: 5500,
      chargeableWeight: 6000,
      volume: 18.5,
      commodity: 'IT Equipment',
      freightType: 'CC',
      freightAmt: 3200,
      currency: 'USD',
      storageInfo: '인천공항 아시아나 화물터미널',
      remarks: '신속통관 요청',
    });
    setHasChanges(true);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header
        title="도착통지 등록 (A/N) - 항공"
        subtitle="Logis > 항공수입 > 도착통지 등록"
        onClose={handleCloseClick}
      />
      <main ref={formRef} className="p-6">
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200 py-2 flex justify-between items-center mb-6">
          <span className="text-sm text-gray-500">화면 ID: AN-AIR-REG</span>
          <div className="flex gap-2">
            <button onClick={handleNew} disabled={isNewMode} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed">신규</button>
            <button onClick={handleReset} className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 font-medium">초기화</button>
            <button onClick={() => router.push('/logis/an/air')} className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 font-medium">목록</button>
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
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">MAWB 번호</label>
                <input type="text" value={formData.mawbNo} onChange={e => handleChange('mawbNo', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="180-12345678" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">HAWB 번호</label>
                <input type="text" value={formData.hawbNo} onChange={e => handleChange('hawbNo', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="HKCS-A0001" />
              </div>
            </div>
          </div>

          {/* 운송 정보 */}
          <div className="card p-6">
            <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">운송 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">항공사</label>
                <div className="flex gap-2">
                  <input type="text" value={formData.airlineNm} onChange={e => handleChange('airlineNm', e.target.value)} className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
                  <SearchIconButton onClick={() => handleCodeSearch('airline', 'carrier')} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">편명</label>
                <input type="text" value={formData.flightNo} onChange={e => handleChange('flightNo', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="KE001" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-500">출발공항</label>
                <div className="flex gap-1">
                  <input type="text" value={formData.origin} onChange={e => handleChange('origin', e.target.value)} className="w-[80px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" />
                  <SearchIconButton onClick={() => handleLocationSearch('origin')} />
                  <input type="text" value={formData.originName} readOnly className="flex-1 h-[32px] px-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-500" placeholder="이름" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-500">도착공항</label>
                <div className="flex gap-1">
                  <input type="text" value={formData.destination} onChange={e => handleChange('destination', e.target.value)} className="w-[80px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" />
                  <SearchIconButton onClick={() => handleLocationSearch('destination')} />
                  <input type="text" value={formData.destinationName} readOnly className="flex-1 h-[32px] px-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-500" placeholder="이름" />
                </div>
              </div>
            </div>
          </div>

          {/* 화주/수하인 정보 */}
          <div className="card p-6">
            <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">화주/수하인 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-500">송하인 (Shipper)</label>
                <div className="flex gap-1">
                  <input type="text" value={formData.shipperCd} onChange={e => handleChange('shipperCd', e.target.value)} className="w-[120px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" />
                  <SearchIconButton onClick={() => handleCodeSearch('shipper', 'customer')} />
                  <input type="text" value={formData.shipper} onChange={e => handleChange('shipper', e.target.value)} className="flex-1 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="이름/상호" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-500">수하인 (Consignee) *</label>
                <div className="flex gap-1">
                  <input type="text" value={formData.consigneeCd} onChange={e => handleChange('consigneeCd', e.target.value)} className="w-[120px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" />
                  <SearchIconButton onClick={() => handleCodeSearch('consignee', 'customer')} />
                  <input type="text" value={formData.consignee} onChange={e => handleChange('consignee', e.target.value)} className="flex-1 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="이름/상호" />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">수하인 주소</label>
                <input type="text" value={formData.consigneeAddr} onChange={e => handleChange('consigneeAddr', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-500">Notify Party</label>
                <div className="flex gap-1">
                  <input type="text" value={formData.notifyPartyCd} onChange={e => handleChange('notifyPartyCd', e.target.value)} className="w-[120px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" />
                  <SearchIconButton onClick={() => handleCodeSearch('notifyParty', 'customer')} />
                  <input type="text" value={formData.notifyParty} onChange={e => handleChange('notifyParty', e.target.value)} className="flex-1 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="이름/상호" />
                </div>
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
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">ETD (출발예정)</label>
                <input type="date" value={formData.etd} onChange={e => handleChange('etd', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">ATD (실출발)</label>
                <input type="date" value={formData.atd} onChange={e => handleChange('atd', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">ETA (도착예정)</label>
                <input type="date" value={formData.eta} onChange={e => handleChange('eta', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">ATA (실도착)</label>
                <input type="date" value={formData.ata} onChange={e => handleChange('ata', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">화물상태</label>
                <select value={formData.cargoStatus} onChange={e => handleChange('cargoStatus', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg">
                  <option value="IN_TRANSIT">비행중</option>
                  <option value="ARRIVED">도착</option>
                  <option value="UNLOADED">하기완료</option>
                  <option value="IN_BONDED">보세창고</option>
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
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">건수 (PCS)</label>
                <input type="number" value={formData.pieces} onChange={e => handleChange('pieces', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">총중량 (KG)</label>
                <input type="number" step="0.001" value={formData.grossWeight} onChange={e => handleChange('grossWeight', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">청구중량 (KG)</label>
                <input type="number" step="0.001" value={formData.chargeableWeight} onChange={e => handleChange('chargeableWeight', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">용적 (CBM)</label>
                <input type="number" step="0.001" value={formData.volume} onChange={e => handleChange('volume', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
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
              <div className="col-span-3">
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">보세창고 정보</label>
                <input type="text" value={formData.storageInfo} onChange={e => handleChange('storageInfo', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="화물터미널/보세창고 정보" />
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
        type="airport"
      />
      <CloseConfirmModal
        isOpen={showCloseModal}
        onClose={handleModalClose}
        onConfirm={handleDiscard}
      />
    </div>
  );
}

export default function ANAirRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)] flex items-center justify-center">Loading...</div>}>
      <ANAirRegisterContent />
    </Suspense>
  );
}
