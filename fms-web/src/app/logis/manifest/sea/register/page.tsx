'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useScreenClose } from '@/hooks/useScreenClose';
import { LIST_PATHS } from '@/constants/paths';
import SearchIconButton from '@/components/SearchIconButton';
import {
  CodeSearchModal,
  LocationCodeModal,
  BLSearchModal,
  HSCodeModal,
  type CodeItem,
  type CodeType,
  type LocationItem,
  type SeaBL,
  type AirBL,
  type HSCodeItem,
} from '@/components/popup';

interface ManifestFormData {
  mfNo: string;
  mfDate: string;
  mfType: string;
  blNo: string;
  shipperCode: string;
  shipper: string;
  shipperAddr: string;
  consigneeCode: string;
  consignee: string;
  consigneeAddr: string;
  notifyParty: string;
  carrier: string;
  vessel: string;
  voyage: string;
  callSign: string;
  pol: string;
  polName: string;
  pod: string;
  podName: string;
  finalDest: string;
  etd: string;
  eta: string;
  containerType: string;
  containerQty: number;
  containerNo: string;
  sealNo: string;
  packageType: string;
  packageQty: number;
  commodity: string;
  hsCode: string;
  grossWeight: number;
  measurement: number;
  freightTerms: string;
  remarks: string;
}

const initialFormData: ManifestFormData = {
  mfNo: '자동생성',
  mfDate: new Date().toISOString().split('T')[0],
  mfType: '수출',
  blNo: '',
  shipperCode: '',
  shipper: '',
  shipperAddr: '',
  consigneeCode: '',
  consignee: '',
  consigneeAddr: '',
  notifyParty: '',
  carrier: '',
  vessel: '',
  voyage: '',
  callSign: '',
  pol: '',
  polName: '',
  pod: '',
  podName: '',
  finalDest: '',
  etd: '',
  eta: '',
  containerType: '40HC',
  containerQty: 1,
  containerNo: '',
  sealNo: '',
  packageType: 'CARTON',
  packageQty: 0,
  commodity: '',
  hsCode: '',
  grossWeight: 0,
  measurement: 0,
  freightTerms: 'PREPAID',
  remarks: '',
};

function ManifestRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });


  // useScreenClose 훅
  const {
    showModal: showCloseModal,
    handleCloseClick,
    handleModalClose,
    handleDiscard: handleDiscardChanges,
  } = useScreenClose({
    hasChanges: false,  // 이 페이지는 변경사항 추적 없음
    listPath: LIST_PATHS.MANIFEST_SEA,
  });

  const [formData, setFormData] = useState<ManifestFormData>(initialFormData);
  const [isNewMode, setIsNewMode] = useState(!editId); // 신규 입력 모드 (신규버튼 비활성화 제어)

  // 수정 모드: 기존 데이터 로드
  useEffect(() => {
    if (!editId) return;
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/manifest/sea?manifestId=${editId}`);
        if (!res.ok) return;
        const data = await res.json();
        setFormData(prev => ({
          ...prev,
          mfNo: data.filingNo || '자동생성',
          mfDate: data.filingDate || prev.mfDate,
          mfType: data.manifestType === 'MANIFEST' ? '수출' : '수입',
          blNo: data.mblNo || data.hblNo || '',
          shipper: data.shipperName || '',
          shipperAddr: data.shipperAddr || '',
          consignee: data.consigneeName || '',
          consigneeAddr: data.consigneeAddr || '',
          notifyParty: data.notifyName || '',
          containerNo: data.containerNo || '',
          sealNo: data.sealNo || '',
          commodity: data.goodsDesc || '',
          grossWeight: Number(data.weight) || 0,
          remarks: data.remarks || '',
        }));
        setIsNewMode(false);
      } catch (error) {
        console.error('Failed to fetch manifest data:', error);
      }
    };
    fetchData();
  }, [editId]);

  // 코드/위치 검색 팝업 상태
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showBLModal, setShowBLModal] = useState(false);
  const [showHSCodeModal, setShowHSCodeModal] = useState(false);
  const [currentField, setCurrentField] = useState<string>('');
  const [currentCodeType, setCurrentCodeType] = useState<CodeType>('customer');

  const handleChange = (field: keyof ManifestFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  
  // 코드 검색 버튼 클릭
  const handleCodeSearch = (field: string, codeType: CodeType) => {
    setCurrentField(field);
    setCurrentCodeType(codeType);
    setShowCodeModal(true);
  };

  // 코드 선택 완료
  const handleCodeSelect = (item: CodeItem) => {
    if (currentField === 'shipper') {
      setFormData(prev => ({ ...prev, shipperCode: item.code, shipper: item.name }));
    } else if (currentField === 'consignee') {
      setFormData(prev => ({ ...prev, consigneeCode: item.code, consignee: item.name }));
    }
    setShowCodeModal(false);
  };

  // 위치 검색 버튼 클릭
  const handleLocationSearch = (field: string) => {
    setCurrentField(field);
    setShowLocationModal(true);
  };

  // 위치 선택 완료
  const handleLocationSelect = (item: LocationItem) => {
    setFormData(prev => ({ ...prev, [currentField]: item.code, [currentField + 'Name']: item.nameEn || item.nameKr || '' }));
    setShowLocationModal(false);
  };

  // B/L 선택 완료
  const handleBLSelect = (bl: SeaBL | AirBL) => {
    if ('blNo' in bl) {
      setFormData(prev => ({
        ...prev,
        blNo: bl.blNo,
        shipper: bl.shipper,
        consignee: bl.consignee,
        pol: bl.pol,
        pod: bl.pod,
        vessel: bl.vessel,
        voyage: bl.voyageNo,
        carrier: bl.line,
      }));
    }
    setShowBLModal(false);
  };

  // HS Code 선택 완료
  const handleHSCodeSelect = (item: HSCodeItem) => {
    setFormData(prev => ({ ...prev, hsCode: item.hsCode, commodity: item.nameKr || item.nameEn }));
    setShowHSCodeModal(false);
  };

  const handleSubmit = async () => {
    if (!formData.blNo) { alert('B/L 번호를 입력하세요.'); return; }
    if (!formData.shipper) { alert('화주를 입력하세요.'); return; }
    if (!formData.vessel) { alert('선명을 입력하세요.'); return; }

    try {
      const payload = {
        mblNo: formData.blNo,
        hblNo: '',
        filingType: formData.mfType === '수출' ? 'ORIGINAL' : 'ORIGINAL',
        filingNo: formData.mfNo !== '자동생성' ? formData.mfNo : '',
        filingDate: formData.mfDate || null,
        shipperName: formData.shipper,
        shipperAddr: formData.shipperAddr,
        consigneeName: formData.consignee,
        consigneeAddr: formData.consigneeAddr,
        notifyName: formData.notifyParty,
        notifyAddr: '',
        goodsDesc: formData.commodity,
        containerNo: formData.containerNo,
        sealNo: formData.sealNo,
        weight: formData.grossWeight,
        weightUnit: 'KG',
        status: 'DRAFT',
      };

      const res = await fetch('/api/manifest/sea', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editId ? { id: editId, ...payload } : payload),
      });

      if (!res.ok) throw new Error('Failed to save');
      setIsNewMode(false);
      alert(editId ? '적하목록이 수정되었습니다.' : '적하목록이 등록되었습니다.');
      router.push('/logis/manifest/sea');
    } catch (error) {
      console.error('Save error:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleFillTestData = () => {
    setFormData({
      ...initialFormData,
      mfType: '수출',
      blNo: 'HDMU1234567',
      shipper: '삼성전자 주식회사',
      shipperAddr: '경기도 수원시 영통구 삼성로 129',
      consignee: '삼성아메리카',
      consigneeAddr: '85 Challenger Rd, Ridgefield Park, NJ 07660, USA',
      notifyParty: 'Same as Consignee',
      carrier: 'HMM',
      vessel: 'HMM GDANSK',
      voyage: '001E',
      callSign: 'H9HM',
      pol: 'KRPUS',
      pod: 'USLAX',
      finalDest: 'Los Angeles, CA, USA',
      etd: '2026-01-22',
      eta: '2026-02-08',
      containerType: '40HC',
      containerQty: 2,
      containerNo: 'HDMU1234567, HDMU1234568',
      sealNo: 'SL001, SL002',
      packageType: 'CARTON',
      packageQty: 500,
      commodity: 'ELECTRONIC PRODUCTS (TV, MONITOR)',
      hsCode: '8528.72',
      grossWeight: 18500,
      measurement: 68,
      freightTerms: 'PREPAID',
      remarks: 'HANDLE WITH CARE - ELECTRONIC EQUIPMENT',
    });
  };

  const handleReset = () => {
    if (!confirm('입력한 내용을 모두 초기화하시겠습니까?')) return;
    setFormData(initialFormData);
  };

  const handleSendEDI = () => {
    if (!formData.blNo) { alert('B/L 번호를 먼저 입력하세요.'); return; }
    alert('적하목록 EDI가 세관으로 전송되었습니다.');
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header title="적하목록 등록" subtitle="Logis 
        onClose={() => setShowCloseModal(true)}> 적하목록 > 적하목록 등록 (해상)" onClose={handleCloseClick} />
      <main ref={formRef} className="p-6">
          <div className="sticky top-0 z-20 bg-white py-2 border-b border-gray-200 flex justify-end items-center mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => { setFormData(initialFormData); setIsNewMode(true); }}
                disabled={isNewMode}
                className={`px-4 py-2 rounded-lg ${isNewMode ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-[var(--surface-100)] text-[var(--foreground)] hover:bg-[var(--surface-200)]'}`}
              >신규</button>
              <button onClick={handleReset} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">초기화</button>
              <button onClick={handleSendEDI} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">EDI전송</button>
              <button onClick={handleSubmit} className="px-6 py-2 font-semibold rounded-lg bg-[var(--surface-100)] text-[var(--foreground)] hover:bg-[var(--surface-200)]">저장</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">기본 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">적하목록 번호</label><input type="text" value={formData.mfNo} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">적하목록 일자</label><input type="date" value={formData.mfDate} onChange={e => handleChange('mfDate', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">구분</label><select value={formData.mfType} onChange={e => handleChange('mfType', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"><option value="수출">수출</option><option value="수입">수입</option></select></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">B/L 번호 *</label><div className="flex gap-2"><input type="text" value={formData.blNo} onChange={e => handleChange('blNo', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="HDMU1234567" /><SearchIconButton onClick={() => setShowBLModal(true)} /></div></div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">운송 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">선사</label><select value={formData.carrier} onChange={e => handleChange('carrier', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"><option value="">선택</option><option value="MAERSK">MAERSK</option><option value="MSC">MSC</option><option value="HMM">HMM</option><option value="EVERGREEN">EVERGREEN</option><option value="ONE">ONE</option></select></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">선명 *</label><input type="text" value={formData.vessel} onChange={e => handleChange('vessel', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="선박명" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">항차</label><input type="text" value={formData.voyage} onChange={e => handleChange('voyage', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="001E" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">호출부호</label><input type="text" value={formData.callSign} onChange={e => handleChange('callSign', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="H9HM" /></div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">화주/수하인 정보</h3>
              <div className="grid grid-cols-1 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">화주 (Shipper) *</label><div className="flex gap-1"><input type="text" value={formData.shipperCode} onChange={e => handleChange('shipperCode', e.target.value)} className="w-[120px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" /><SearchIconButton onClick={() => handleCodeSearch('shipper', 'customer')} /><input type="text" value={formData.shipper} onChange={e => handleChange('shipper', e.target.value)} className="flex-1 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="이름/상호" /></div></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">화주 주소</label><input type="text" value={formData.shipperAddr} onChange={e => handleChange('shipperAddr', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="화주 주소" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">수하인 (Consignee)</label><div className="flex gap-1"><input type="text" value={formData.consigneeCode} onChange={e => handleChange('consigneeCode', e.target.value)} className="w-[120px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" /><SearchIconButton onClick={() => handleCodeSearch('consignee', 'customer')} /><input type="text" value={formData.consignee} onChange={e => handleChange('consignee', e.target.value)} className="flex-1 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="이름/상호" /></div></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">수하인 주소</label><input type="text" value={formData.consigneeAddr} onChange={e => handleChange('consigneeAddr', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="수하인 주소" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Notify Party</label><input type="text" value={formData.notifyParty} onChange={e => handleChange('notifyParty', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="통지처" /></div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">구간/일정 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">선적항 (POL)</label><div className="flex gap-1"><input type="text" value={formData.pol} onChange={e => handleChange('pol', e.target.value)} className="w-[80px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" /><SearchIconButton onClick={() => handleLocationSearch('pol')} /><input type="text" value={formData.polName} readOnly className="flex-1 h-[32px] px-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-500" placeholder="이름" /></div></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">양하항 (POD)</label><div className="flex gap-1"><input type="text" value={formData.pod} onChange={e => handleChange('pod', e.target.value)} className="w-[80px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" /><SearchIconButton onClick={() => handleLocationSearch('pod')} /><input type="text" value={formData.podName} readOnly className="flex-1 h-[32px] px-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-500" placeholder="이름" /></div></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ETD</label><input type="date" value={formData.etd} onChange={e => handleChange('etd', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ETA</label><input type="date" value={formData.eta} onChange={e => handleChange('eta', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">최종목적지</label><input type="text" value={formData.finalDest} onChange={e => handleChange('finalDest', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="최종 목적지" /></div>
              </div>
            </div>

            <div className="card p-6 col-span-2">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">컨테이너/화물 정보</h3>
              <div className="grid grid-cols-4 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">컨테이너 타입</label><select value={formData.containerType} onChange={e => handleChange('containerType', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"><option value="20GP">20GP</option><option value="40GP">40GP</option><option value="40HC">40HC</option><option value="45HC">45HC</option><option value="20RF">20RF</option><option value="40RF">40RF</option></select></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">수량</label><input type="number" value={formData.containerQty} onChange={e => handleChange('containerQty', parseInt(e.target.value) || 0)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">포장단위</label><select value={formData.packageType} onChange={e => handleChange('packageType', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"><option value="CARTON">CARTON</option><option value="PALLET">PALLET</option><option value="DRUM">DRUM</option><option value="BAG">BAG</option><option value="CASE">CASE</option></select></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">포장수량</label><input type="number" value={formData.packageQty} onChange={e => handleChange('packageQty', parseInt(e.target.value) || 0)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">컨테이너 번호</label><input type="text" value={formData.containerNo} onChange={e => handleChange('containerNo', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="HDMU1234567, HDMU1234568" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">씰 번호</label><input type="text" value={formData.sealNo} onChange={e => handleChange('sealNo', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="SL001, SL002" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">품명</label><input type="text" value={formData.commodity} onChange={e => handleChange('commodity', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="화물 품명 (영문)" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">HS Code</label><div className="flex gap-2"><input type="text" value={formData.hsCode} onChange={e => handleChange('hsCode', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="8528.72" /><SearchIconButton onClick={() => setShowHSCodeModal(true)} /></div></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">운임조건</label><select value={formData.freightTerms} onChange={e => handleChange('freightTerms', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"><option value="PREPAID">PREPAID</option><option value="COLLECT">COLLECT</option></select></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">총중량 (KG)</label><input type="number" value={formData.grossWeight} onChange={e => handleChange('grossWeight', parseInt(e.target.value) || 0)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">용적 (CBM)</label><input type="number" value={formData.measurement} onChange={e => handleChange('measurement', parseInt(e.target.value) || 0)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">비고</label><input type="text" value={formData.remarks} onChange={e => handleChange('remarks', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="특이사항" /></div>
              </div>
            </div>
          </div>
        </main>
      {/* 코드 검색 모달 */}
      <CodeSearchModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        onSelect={handleCodeSelect}
        codeType={currentCodeType}
      />

      {/* 위치 검색 모달 */}
      <LocationCodeModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelect={handleLocationSelect}
        type="seaport"
      />

      {/* B/L 검색 모달 */}
      <BLSearchModal
        isOpen={showBLModal}
        onClose={() => setShowBLModal(false)}
        onSelect={handleBLSelect}
        type="sea"
      />

      {/* HS Code 검색 모달 */}
      <HSCodeModal
        isOpen={showHSCodeModal}
        onClose={() => setShowHSCodeModal(false)}
        onSelect={handleHSCodeSelect}
      />    </div>
  );
}

export default function ManifestRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)] flex items-center justify-center">Loading...</div>}>
      <ManifestRegisterContent />
    </Suspense>
  );
}
