'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useScreenClose } from '@/hooks/useScreenClose';
import { LIST_PATHS } from '@/constants/paths';
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

interface AMSFormData {
  amsNo: string;
  amsDate: string;
  amsType: string;
  targetCountry: string;
  blNo: string;
  shipper: string;
  shipperAddr: string;
  shipperTaxId: string;
  consignee: string;
  consigneeAddr: string;
  consigneeTaxId: string;
  notifyParty: string;
  seller: string;
  sellerAddr: string;
  buyer: string;
  buyerAddr: string;
  manufacturer: string;
  manufacturerAddr: string;
  consolidator: string;
  carrier: string;
  vessel: string;
  voyage: string;
  pol: string;
  pod: string;
  finalDest: string;
  etd: string;
  containerType: string;
  containerQty: number;
  containerNo: string;
  sealNo: string;
  hsCode: string;
  commodity: string;
  grossWeight: number;
  remarks: string;
}

const initialFormData: AMSFormData = {
  amsNo: '자동생성',
  amsDate: new Date().toISOString().split('T')[0],
  amsType: 'AMS',
  targetCountry: 'USA',
  blNo: '',
  shipper: '',
  shipperAddr: '',
  shipperTaxId: '',
  consignee: '',
  consigneeAddr: '',
  consigneeTaxId: '',
  notifyParty: '',
  seller: '',
  sellerAddr: '',
  buyer: '',
  buyerAddr: '',
  manufacturer: '',
  manufacturerAddr: '',
  consolidator: '',
  carrier: '',
  vessel: '',
  voyage: '',
  pol: '',
  pod: '',
  finalDest: '',
  etd: '',
  containerType: '40HC',
  containerQty: 1,
  containerNo: '',
  sealNo: '',
  hsCode: '',
  commodity: '',
  grossWeight: 0,
  remarks: '',
};

function AMSRegisterContent() {
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
    listPath: LIST_PATHS.AMS_SEA,
  });

  const [formData, setFormData] = useState<AMSFormData>(initialFormData);
  const [isNewMode, setIsNewMode] = useState(!editId); // 신규 입력 모드 (신규버튼 비활성화 제어)

  // 수정 모드: 기존 데이터 로드
  useEffect(() => {
    if (!editId) return;
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/ams/sea?amsId=${editId}`);
        if (!res.ok) return;
        const data = await res.json();
        setFormData(prev => ({
          ...prev,
          amsNo: data.filingNo || '자동생성',
          amsDate: data.filingDate || prev.amsDate,
          amsType: data.amsType || 'AMS',
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
        console.error('Failed to fetch AMS data:', error);
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
  const [locationType, setLocationType] = useState<'seaport' | 'airport'>('seaport');

  const handleChange = (field: keyof AMSFormData, value: string | number) => {
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
    // 필드에 따라 적절히 처리
    setShowCodeModal(false);
  };

  // 위치 검색 버튼 클릭
  const handleLocationSearch = (field: string) => {
    setCurrentField(field);
    setShowLocationModal(true);
  };

  // 위치 선택 완료
  const handleLocationSelect = (item: LocationItem) => {
    if (currentField === 'pol') {
      setFormData(prev => ({ ...prev, pol: item.code }));
    } else if (currentField === 'pod') {
      setFormData(prev => ({ ...prev, pod: item.code }));
    }
    setShowLocationModal(false);
  };

  // 위치 검색 팝업 열기
  const handleOpenLocationModal = (field: string) => {
    setCurrentField(field);
    setLocationType('seaport');
    setShowLocationModal(true);
  };

  // B/L 선택 완료
  const handleBLSelect = (bl: SeaBL | AirBL) => {
    const blNo = 'blNo' in bl ? bl.blNo : '';
    setFormData(prev => ({
      ...prev,
      blNo,
      shipper: bl.shipper,
      consignee: bl.consignee,
    }));
    setShowBLModal(false);
  };

  // HS Code 선택 완료
  const handleHSCodeSelect = (item: HSCodeItem) => {
    setFormData(prev => ({
      ...prev,
      hsCode: item.hsCode,
      commodity: item.nameEn || item.nameKr,
    }));
    setShowHSCodeModal(false);
  };

  const handleSubmit = async () => {
    if (!formData.blNo) { alert('B/L 번호를 입력하세요.'); return; }
    if (!formData.shipper) { alert('Shipper를 입력하세요.'); return; }
    if (!formData.consignee) { alert('Consignee를 입력하세요.'); return; }

    try {
      const payload = {
        mblNo: formData.blNo,
        hblNo: '',
        filingType: formData.amsType || 'ORIGINAL',
        filingNo: formData.amsNo !== '자동생성' ? formData.amsNo : '',
        filingDate: formData.amsDate || null,
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

      const res = await fetch('/api/ams/sea', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editId ? { id: editId, ...payload } : payload),
      });

      if (!res.ok) throw new Error('Failed to save');
      setIsNewMode(false);
      alert(editId ? 'AMS가 수정되었습니다.' : 'AMS가 등록되었습니다.');
      router.push('/logis/ams/sea');
    } catch (error) {
      console.error('Save error:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleFillTestData = () => {
    setFormData({
      ...initialFormData,
      amsType: 'ISF',
      targetCountry: 'USA',
      blNo: 'HDMU1234567',
      shipper: '삼성전자',
      shipperAddr: '129 Samsung-ro, Yeongtong-gu, Suwon-si, Gyeonggi-do, Korea',
      shipperTaxId: '124-81-00998',
      consignee: '삼성아메리카',
      consigneeAddr: '85 Challenger Rd, Ridgefield Park, NJ 07660, USA',
      consigneeTaxId: '13-2789078',
      notifyParty: 'Same as Consignee',
      seller: '삼성전자',
      sellerAddr: '129 Samsung-ro, Yeongtong-gu, Suwon-si, Gyeonggi-do, Korea',
      buyer: '삼성아메리카',
      buyerAddr: '85 Challenger Rd, Ridgefield Park, NJ 07660, USA',
      manufacturer: 'Samsung Electronics Vietnam',
      manufacturerAddr: 'Yen Phong IP, Bac Ninh, Vietnam',
      consolidator: 'KCS물류',
      carrier: 'HMM',
      vessel: 'HMM GDANSK',
      voyage: '001E',
      pol: 'KRPUS',
      pod: 'USLAX',
      finalDest: 'Los Angeles, CA 90731',
      etd: '2026-01-22',
      containerType: '40HC',
      containerQty: 2,
      containerNo: 'HDMU1234567, HDMU1234568',
      sealNo: 'SL001, SL002',
      hsCode: '8528.72.6400',
      commodity: 'TELEVISION RECEIVERS, COLOR, WITH FLAT PANEL SCREEN',
      grossWeight: 18500,
      remarks: 'ISF 10+2 Filing for US Customs',
    });
  };

  const handleReset = () => {
    if (!confirm('입력한 내용을 모두 초기화하시겠습니까?')) return;
    setFormData(initialFormData);
  };

  const handleSendAMS = () => {
    if (!formData.blNo) { alert('B/L 번호를 먼저 입력하세요.'); return; }
    if (!formData.consignee) { alert('Consignee 정보를 먼저 입력하세요.'); return; }
    alert('AMS가 세관으로 전송되었습니다.');
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header title="AMS 등록" subtitle="Logis 
        onClose={() => setShowCloseModal(true)}> AMS > AMS 등록 (해상)" onClose={handleCloseClick} />
      <main ref={formRef} className="p-6">
          <div className="flex justify-end items-center mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => { setFormData(initialFormData); setIsNewMode(true); }}
                disabled={isNewMode}
                className={`px-4 py-2 rounded-lg ${isNewMode ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-[var(--surface-100)] text-[var(--foreground)] hover:bg-[var(--surface-200)]'}`}
              >신규</button>
              <button onClick={handleReset} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">초기화</button>
              <button onClick={handleSendAMS} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">AMS전송</button>
              <button onClick={handleSubmit} className="px-6 py-2 font-semibold rounded-lg bg-[var(--surface-100)] text-[var(--foreground)] hover:bg-[var(--surface-200)]">저장</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">기본 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">AMS 번호</label><input type="text" value={formData.amsNo} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">AMS 일자</label><input type="date" value={formData.amsDate} onChange={e => handleChange('amsDate', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">AMS 유형</label><select value={formData.amsType} onChange={e => handleChange('amsType', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"><option value="AMS">AMS (미국)</option><option value="ISF">ISF (미국)</option><option value="ACI">ACI (캐나다)</option><option value="ENS">ENS (EU)</option><option value="AFR">AFR (일본)</option></select></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">대상국가</label><select value={formData.targetCountry} onChange={e => handleChange('targetCountry', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"><option value="USA">USA</option><option value="Canada">Canada</option><option value="EU">EU</option><option value="Japan">Japan</option><option value="Mexico">Mexico</option></select></div>
                <div className="col-span-2"><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">B/L 번호 *</label><div className="flex gap-2"><input type="text" value={formData.blNo} onChange={e => handleChange('blNo', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="HDMU1234567" /><button type="button" onClick={() => setShowBLModal(true)} className="h-[38px] px-3 bg-[#1A2744] text-white text-sm rounded-lg hover:bg-[#243354]">찾기</button></div></div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">운송 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">선사</label><select value={formData.carrier} onChange={e => handleChange('carrier', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"><option value="">선택</option><option value="MAERSK">MAERSK</option><option value="MSC">MSC</option><option value="HMM">HMM</option><option value="EVERGREEN">EVERGREEN</option><option value="ONE">ONE</option></select></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">선명</label><input type="text" value={formData.vessel} onChange={e => handleChange('vessel', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="선박명" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">항차</label><input type="text" value={formData.voyage} onChange={e => handleChange('voyage', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="001E" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ETD</label><input type="date" value={formData.etd} onChange={e => handleChange('etd', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">POL</label><div className="flex gap-2"><input type="text" value={formData.pol} onChange={e => handleChange('pol', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="KRPUS" /><button type="button" onClick={() => handleOpenLocationModal('pol')} className="h-[38px] px-3 bg-[#1A2744] text-white text-sm rounded-lg hover:bg-[#243354]">찾기</button></div></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">POD</label><div className="flex gap-2"><input type="text" value={formData.pod} onChange={e => handleChange('pod', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="USLAX" /><button type="button" onClick={() => handleOpenLocationModal('pod')} className="h-[38px] px-3 bg-[#1A2744] text-white text-sm rounded-lg hover:bg-[#243354]">찾기</button></div></div>
                <div className="col-span-2"><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">최종목적지</label><input type="text" value={formData.finalDest} onChange={e => handleChange('finalDest', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="최종 배송지 주소" /></div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">Shipper / Consignee 정보</h3>
              <div className="grid grid-cols-1 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Shipper *</label><div className="flex gap-2"><input type="text" value={formData.shipper} onChange={e => handleChange('shipper', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="Shipper 회사명" /><button type="button" onClick={() => handleCodeSearch('shipper', 'customer')} className="h-[38px] px-3 bg-[#1A2744] text-white text-sm rounded-lg hover:bg-[#243354]">찾기</button></div></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Shipper 주소</label><input type="text" value={formData.shipperAddr} onChange={e => handleChange('shipperAddr', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="Shipper 전체 주소" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Shipper Tax ID</label><input type="text" value={formData.shipperTaxId} onChange={e => handleChange('shipperTaxId', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="사업자등록번호" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Consignee *</label><div className="flex gap-2"><input type="text" value={formData.consignee} onChange={e => handleChange('consignee', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="Consignee 회사명" /><button type="button" onClick={() => handleCodeSearch('consignee', 'customer')} className="h-[38px] px-3 bg-[#1A2744] text-white text-sm rounded-lg hover:bg-[#243354]">찾기</button></div></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Consignee 주소</label><input type="text" value={formData.consigneeAddr} onChange={e => handleChange('consigneeAddr', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="Consignee 전체 주소" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Consignee Tax ID (IRS/EIN)</label><input type="text" value={formData.consigneeTaxId} onChange={e => handleChange('consigneeTaxId', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="IRS/EIN Number" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Notify Party</label><input type="text" value={formData.notifyParty} onChange={e => handleChange('notifyParty', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="통지처" /></div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">ISF 10+2 정보 (미국 전용)</h3>
              <div className="grid grid-cols-1 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Seller</label><input type="text" value={formData.seller} onChange={e => handleChange('seller', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="판매자" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Seller 주소</label><input type="text" value={formData.sellerAddr} onChange={e => handleChange('sellerAddr', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="판매자 주소" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Buyer</label><input type="text" value={formData.buyer} onChange={e => handleChange('buyer', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="구매자" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Buyer 주소</label><input type="text" value={formData.buyerAddr} onChange={e => handleChange('buyerAddr', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="구매자 주소" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Manufacturer</label><input type="text" value={formData.manufacturer} onChange={e => handleChange('manufacturer', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="제조사" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Manufacturer 주소</label><input type="text" value={formData.manufacturerAddr} onChange={e => handleChange('manufacturerAddr', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="제조사 주소" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Consolidator</label><input type="text" value={formData.consolidator} onChange={e => handleChange('consolidator', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="컨솔업체" /></div>
              </div>
            </div>

            <div className="card p-6 col-span-2">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">컨테이너/화물 정보</h3>
              <div className="grid grid-cols-4 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">컨테이너 타입</label><select value={formData.containerType} onChange={e => handleChange('containerType', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"><option value="20GP">20GP</option><option value="40GP">40GP</option><option value="40HC">40HC</option><option value="45HC">45HC</option><option value="20RF">20RF</option><option value="40RF">40RF</option></select></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">수량</label><input type="number" value={formData.containerQty} onChange={e => handleChange('containerQty', parseInt(e.target.value) || 0)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">HS Code</label><div className="flex gap-2"><input type="text" value={formData.hsCode} onChange={e => handleChange('hsCode', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="8528.72.6400" /><button type="button" onClick={() => setShowHSCodeModal(true)} className="h-[38px] px-3 bg-[#1A2744] text-white text-sm rounded-lg hover:bg-[#243354]">찾기</button></div></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">총중량 (KG)</label><input type="number" value={formData.grossWeight} onChange={e => handleChange('grossWeight', parseInt(e.target.value) || 0)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">컨테이너 번호</label><input type="text" value={formData.containerNo} onChange={e => handleChange('containerNo', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="HDMU1234567, HDMU1234568" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">씰 번호</label><input type="text" value={formData.sealNo} onChange={e => handleChange('sealNo', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="SL001, SL002" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">품명 (영문)</label><input type="text" value={formData.commodity} onChange={e => handleChange('commodity', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="화물 품명 (영문 대문자)" /></div>
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
        type={locationType}
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

export default function AMSRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)] flex items-center justify-center">Loading...</div>}>
      <AMSRegisterContent />
    </Suspense>
  );
}
