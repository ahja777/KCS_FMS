'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { formatCurrency } from '@/utils/format';
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

interface CustomsFormData {
  customsNo: string;
  customsDate: string;
  customsType: string;
  blNo: string;
  declarationNo: string;
  shipperCode: string;
  shipper: string;
  shipperAddr: string;
  consigneeCode: string;
  consignee: string;
  consigneeAddr: string;
  brokerCode: string;
  broker: string;
  brokerContact: string;
  hsCode: string;
  commodity: string;
  origin: string;
  packageType: string;
  packageQty: number;
  grossWeight: number;
  totalAmount: number;
  currency: string;
  exchangeRate: number;
  dutyRate: number;
  dutyAmount: number;
  vatAmount: number;
  etaDate: string;
  clearanceDate: string;
  remarks: string;
}

const initialFormData: CustomsFormData = {
  customsNo: '자동생성',
  customsDate: new Date().toISOString().split('T')[0],
  customsType: '수출',
  blNo: '',
  declarationNo: '',
  shipperCode: '',
  shipper: '',
  shipperAddr: '',
  consigneeCode: '',
  consignee: '',
  consigneeAddr: '',
  brokerCode: '',
  broker: '',
  brokerContact: '',
  hsCode: '',
  commodity: '',
  origin: '',
  packageType: 'CARTON',
  packageQty: 0,
  grossWeight: 0,
  totalAmount: 0,
  currency: 'USD',
  exchangeRate: 1350,
  dutyRate: 0,
  dutyAmount: 0,
  vatAmount: 0,
  etaDate: '',
  clearanceDate: '',
  remarks: '',
};

function CustomsRegisterContent() {
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
    listPath: LIST_PATHS.CUSTOMS_SEA,
  });

  const [formData, setFormData] = useState<CustomsFormData>(initialFormData);
  const [isNewMode, setIsNewMode] = useState(!editId); // 신규 입력 모드 (신규버튼 비활성화 제어)

  // 수정 모드: 기존 데이터 로드
  useEffect(() => {
    if (!editId) return;
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/customs/sea?declarationId=${editId}`);
        if (!res.ok) return;
        const data = await res.json();
        setFormData(prev => ({
          ...prev,
          customsNo: data.declarationNo || '자동생성',
          customsDate: data.declarationDate || prev.customsDate,
          customsType: data.declarationType === 'IMPORT' ? '수입' : '수출',
          blNo: data.blNo || data.importerExporter || '',
          declarationNo: data.declarationNo || '',
          shipper: data.importerExporter || '',
          shipperAddr: data.shipperAddr || '',
          consignee: data.consignee || '',
          consigneeAddr: data.consigneeAddr || '',
          broker: data.brokerName || '',
          brokerContact: data.brokerContact || '',
          hsCode: data.hsCode || '',
          commodity: data.goodsDesc || '',
          origin: data.countryOrigin || '',
          packageQty: Number(data.packageQty) || 0,
          grossWeight: Number(data.grossWeight) || 0,
          totalAmount: Number(data.declaredValue) || 0,
          currency: data.currency || 'USD',
          dutyAmount: Number(data.dutyAmount) || 0,
          vatAmount: Number(data.vatAmount) || 0,
          clearanceDate: data.clearanceDate || '',
          remarks: data.remarks || '',
        }));
        setIsNewMode(false);
      } catch (error) {
        console.error('Failed to fetch customs data:', error);
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

  const handleChange = (field: keyof CustomsFormData, value: string | number) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'totalAmount' || field === 'exchangeRate' || field === 'dutyRate') {
        const krwAmount = newData.totalAmount * newData.exchangeRate;
        newData.dutyAmount = Math.round(krwAmount * newData.dutyRate / 100);
        newData.vatAmount = Math.round((krwAmount + newData.dutyAmount) * 0.1);
      }
      return newData;
    });
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
    } else if (currentField === 'broker') {
      setFormData(prev => ({ ...prev, brokerCode: item.code, broker: item.name }));
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
    setShowLocationModal(false);
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
    const rate = item.tariffRate ? parseFloat(item.tariffRate.replace('%', '')) : 0;
    setFormData(prev => ({
      ...prev,
      hsCode: item.hsCode,
      commodity: item.nameKr || item.nameEn,
      dutyRate: rate,
    }));
    setShowHSCodeModal(false);
  };

  const handleSubmit = async () => {
    if (!formData.blNo) { alert('B/L 번호를 입력하세요.'); return; }
    if (!formData.shipper) { alert('화주를 입력하세요.'); return; }

    try {
      const payload = {
        declarationType: formData.customsType === '수입' ? 'IMPORT' : 'EXPORT',
        declarationDate: formData.customsDate,
        importerExporter: formData.shipper,
        hsCode: formData.hsCode,
        goodsDesc: formData.commodity,
        countryOrigin: formData.origin,
        packageQty: formData.packageQty,
        grossWeight: formData.grossWeight,
        declaredValue: formData.totalAmount,
        currency: formData.currency,
        dutyAmount: formData.dutyAmount,
        vatAmount: formData.vatAmount,
        totalTax: formData.dutyAmount + formData.vatAmount,
        clearanceDate: formData.clearanceDate || null,
        remarks: formData.remarks,
      };

      const res = await fetch('/api/customs/sea', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editId ? { id: editId, ...payload } : payload),
      });

      if (!res.ok) throw new Error('Failed to save');
      setIsNewMode(false);
      alert(editId ? '통관 정보가 수정되었습니다.' : '통관 정보가 등록되었습니다.');
      router.push('/logis/customs/sea');
    } catch (error) {
      console.error('Save error:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleFillTestData = () => {
    setFormData({
      ...initialFormData,
      customsType: '수입',
      blNo: 'MAEU5678901',
      declarationNo: 'I-2026-0002345',
      shipper: '애플코리아',
      shipperAddr: 'One Apple Park Way, Cupertino, CA 95014, USA',
      consignee: 'LG전자 주식회사',
      consigneeAddr: '서울특별시 영등포구 여의대로 128',
      broker: '한국관세사무소',
      brokerContact: '02-1234-5678',
      hsCode: '8471.30',
      commodity: 'COMPUTER PARTS AND ACCESSORIES',
      origin: 'USA',
      packageType: 'CARTON',
      packageQty: 200,
      grossWeight: 5000,
      totalAmount: 120000,
      currency: 'USD',
      exchangeRate: 1350,
      dutyRate: 8,
      dutyAmount: 12960000,
      vatAmount: 17496000,
      etaDate: '2026-01-18',
      clearanceDate: '',
      remarks: '정밀검사 대상 가능성 있음',
    });
  };

  const handleReset = () => {
    if (!confirm('입력한 내용을 모두 초기화하시겠습니까?')) return;
    setFormData(initialFormData);
  };

  const handleDeclare = () => {
    if (!formData.blNo) { alert('B/L 번호를 먼저 입력하세요.'); return; }
    if (!formData.broker) { alert('관세사를 먼저 입력하세요.'); return; }
    alert('세관 신고가 접수되었습니다.');
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header title="통관 등록" subtitle="Logis 
        onClose={() => setShowCloseModal(true)}> 통관 > 통관 등록 (해상)" onClose={handleCloseClick} />
      <main ref={formRef} className="p-6">
          <div className="sticky top-20 z-20 bg-white flex justify-end items-center mb-6 py-2 border-b border-gray-200">
            <div className="flex gap-2">
              <button
                onClick={() => { setFormData(initialFormData); setIsNewMode(true); }}
                disabled={isNewMode}
                className={`px-4 py-2 rounded-lg ${isNewMode ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}
              >신규</button>
              <button onClick={handleReset} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">초기화</button>
              <button onClick={handleDeclare} className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200">세관신고</button>
              <button onClick={handleSubmit} className="px-6 py-2 font-semibold rounded-lg bg-gray-100 text-gray-900 hover:bg-gray-200">저장</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">기본 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">통관 번호</label><input type="text" value={formData.customsNo} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">통관 일자</label><input type="date" value={formData.customsDate} onChange={e => handleChange('customsDate', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">구분</label><select value={formData.customsType} onChange={e => handleChange('customsType', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"><option value="수출">수출</option><option value="수입">수입</option></select></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">B/L 번호 *</label><div className="flex gap-2"><input type="text" value={formData.blNo} onChange={e => handleChange('blNo', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="HDMU1234567" /><SearchIconButton onClick={() => setShowBLModal(true)} /></div></div>
                <div className="col-span-2"><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">신고번호</label><input type="text" value={formData.declarationNo} onChange={e => handleChange('declarationNo', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="E-2026-0001234" /></div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">관세사 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-gray-900">관세사</label><div className="flex gap-1"><input type="text" value={formData.brokerCode} onChange={e => handleChange('brokerCode' as keyof CustomsFormData, e.target.value)} className="w-[120px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" /><SearchIconButton onClick={() => handleCodeSearch('broker', 'customs')} /><input type="text" value={formData.broker} onChange={e => handleChange('broker', e.target.value)} className="flex-1 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="이름/상호" /></div></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">연락처</label><input type="text" value={formData.brokerContact} onChange={e => handleChange('brokerContact', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="02-0000-0000" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">입항예정일</label><input type="date" value={formData.etaDate} onChange={e => handleChange('etaDate', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">통관완료일</label><input type="date" value={formData.clearanceDate} onChange={e => handleChange('clearanceDate', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" /></div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">화주/수하인 정보</h3>
              <div className="grid grid-cols-1 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-gray-900">화주 (Shipper) *</label><div className="flex gap-1"><input type="text" value={formData.shipperCode} onChange={e => handleChange('shipperCode' as keyof CustomsFormData, e.target.value)} className="w-[120px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" /><SearchIconButton onClick={() => handleCodeSearch('shipper', 'customer')} /><input type="text" value={formData.shipper} onChange={e => handleChange('shipper', e.target.value)} className="flex-1 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="이름/상호" /></div></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">화주 주소</label><input type="text" value={formData.shipperAddr} onChange={e => handleChange('shipperAddr', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="화주 주소" /></div>
                <div><label className="block text-sm font-medium mb-1 text-gray-900">수하인 (Consignee)</label><div className="flex gap-1"><input type="text" value={formData.consigneeCode} onChange={e => handleChange('consigneeCode' as keyof CustomsFormData, e.target.value)} className="w-[120px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" /><SearchIconButton onClick={() => handleCodeSearch('consignee', 'customer')} /><input type="text" value={formData.consignee} onChange={e => handleChange('consignee', e.target.value)} className="flex-1 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="이름/상호" /></div></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">수하인 주소</label><input type="text" value={formData.consigneeAddr} onChange={e => handleChange('consigneeAddr', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="수하인 주소" /></div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">화물 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">HS Code</label><div className="flex gap-2"><input type="text" value={formData.hsCode} onChange={e => handleChange('hsCode', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="8471.30" /><SearchIconButton onClick={() => setShowHSCodeModal(true)} /></div></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">원산지</label><input type="text" value={formData.origin} onChange={e => handleChange('origin', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="USA" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">품명</label><input type="text" value={formData.commodity} onChange={e => handleChange('commodity', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="화물 품명" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">포장단위</label><select value={formData.packageType} onChange={e => handleChange('packageType', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"><option value="CARTON">CARTON</option><option value="PALLET">PALLET</option><option value="DRUM">DRUM</option><option value="BAG">BAG</option></select></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">포장수량</label><input type="number" value={formData.packageQty} onChange={e => handleChange('packageQty', parseInt(e.target.value) || 0)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">총중량 (KG)</label><input type="number" value={formData.grossWeight} onChange={e => handleChange('grossWeight', parseInt(e.target.value) || 0)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" /></div>
              </div>
            </div>

            <div className="card p-6 col-span-2">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">금액/세금 정보</h3>
              <div className="grid grid-cols-4 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">통화</label><select value={formData.currency} onChange={e => handleChange('currency', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"><option value="USD">USD</option><option value="EUR">EUR</option><option value="JPY">JPY</option><option value="CNY">CNY</option><option value="KRW">KRW</option></select></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">금액</label><input type="number" value={formData.totalAmount} onChange={e => handleChange('totalAmount', parseInt(e.target.value) || 0)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">환율</label><input type="number" value={formData.exchangeRate} onChange={e => handleChange('exchangeRate', parseFloat(e.target.value) || 0)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">관세율 (%)</label><input type="number" value={formData.dutyRate} onChange={e => handleChange('dutyRate', parseFloat(e.target.value) || 0)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">원화금액</label><input type="text" value={formatCurrency(formData.totalAmount * formData.exchangeRate)} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">관세</label><input type="text" value={formatCurrency(formData.dutyAmount)} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">부가세</label><input type="text" value={formatCurrency(formData.vatAmount)} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">총 납부액</label><input type="text" value={formatCurrency(formData.dutyAmount + formData.vatAmount)} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg font-bold" /></div>
                <div className="col-span-4"><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">비고</label><input type="text" value={formData.remarks} onChange={e => handleChange('remarks', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="특이사항" /></div>
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

export default function CustomsRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)] flex items-center justify-center">Loading...</div>}>
      <CustomsRegisterContent />
    </Suspense>
  );
}
