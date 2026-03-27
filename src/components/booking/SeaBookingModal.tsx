'use client';

import { useState, useEffect } from 'react';

export interface SeaBookingData {
  id?: string;
  bookingNo?: string;
  // 필수 항목
  bookingDate: string;
  shipper: string;
  pol: string;
  pod: string;
  commodity: string;
  grossWeight: number;
  containerType: string;
  containerQty: number;
  // 선택 항목
  shipperContact: string;
  consignee: string;
  consigneeContact: string;
  notifyParty: string;
  carrier: string;
  vessel: string;
  voyage: string;
  finalDest: string;
  etd: string;
  eta: string;
  weightUnit: string;
  measurement: number;
  measurementUnit: string;
  freightTerms: string;
  paymentTerms: string;
  remarks: string;
  // 추가 필드 (PPT 기준)
  forwarderCode: string;
  contractHolder: string;
  serviceTerm: string;
  namedCustomer: string;
  pickupLocation: string;
  status?: 'draft' | 'requested' | 'confirmed' | 'rejected' | 'cancelled';
}

interface SeaBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SeaBookingData) => void;
  editData?: SeaBookingData | null;
  mode: 'create' | 'edit';
}

const initialFormData: SeaBookingData = {
  bookingDate: new Date().toISOString().split('T')[0],
  shipper: '',
  shipperContact: '',
  consignee: '',
  consigneeContact: '',
  notifyParty: '',
  carrier: '',
  vessel: '',
  voyage: '',
  pol: '',
  pod: '',
  finalDest: '',
  etd: '',
  eta: '',
  containerType: '40HC',
  containerQty: 1,
  commodity: '',
  grossWeight: 0,
  weightUnit: 'KG',
  measurement: 0,
  measurementUnit: 'CBM',
  freightTerms: 'CY-CY',
  paymentTerms: 'PREPAID',
  remarks: '',
  forwarderCode: '',
  contractHolder: '',
  serviceTerm: 'CY-CY',
  namedCustomer: '',
  pickupLocation: '',
};

const carriers = [
  { code: 'MAERSK', name: 'Maersk Line' },
  { code: 'MSC', name: 'Mediterranean Shipping Company' },
  { code: 'HMM', name: 'HMM (Hyundai Merchant Marine)' },
  { code: 'ONE', name: 'Ocean Network Express' },
  { code: 'EVERGREEN', name: 'Evergreen Marine' },
  { code: 'CMA', name: 'CMA CGM' },
  { code: 'COSCO', name: 'COSCO Shipping' },
  { code: 'YANGMING', name: 'Yang Ming Marine' },
];

const containerTypes = [
  { code: '20GP', name: "20' General Purpose" },
  { code: '40GP', name: "40' General Purpose" },
  { code: '40HC', name: "40' High Cube" },
  { code: '45HC', name: "45' High Cube" },
  { code: '20RF', name: "20' Reefer" },
  { code: '40RF', name: "40' Reefer" },
  { code: '20OT', name: "20' Open Top" },
  { code: '40OT', name: "40' Open Top" },
  { code: '20FR', name: "20' Flat Rack" },
  { code: '40FR', name: "40' Flat Rack" },
];

const ports = [
  { code: 'KRPUS', name: '부산항 (Busan)' },
  { code: 'KRINC', name: '인천항 (Incheon)' },
  { code: 'KRKAN', name: '광양항 (Gwangyang)' },
  { code: 'CNSHA', name: '상하이 (Shanghai)' },
  { code: 'CNNBO', name: '닝보 (Ningbo)' },
  { code: 'JPTYO', name: '도쿄 (Tokyo)' },
  { code: 'JPYOK', name: '요코하마 (Yokohama)' },
  { code: 'USLAX', name: '로스앤젤레스 (Los Angeles)' },
  { code: 'USLGB', name: '롱비치 (Long Beach)' },
  { code: 'USNYC', name: '뉴욕 (New York)' },
  { code: 'DEHAM', name: '함부르크 (Hamburg)' },
  { code: 'NLRTM', name: '로테르담 (Rotterdam)' },
  { code: 'SGSIN', name: '싱가포르 (Singapore)' },
];

const serviceTerms = [
  { code: 'CY-CY', name: 'CY to CY' },
  { code: 'CY-CFS', name: 'CY to CFS' },
  { code: 'CFS-CY', name: 'CFS to CY' },
  { code: 'CFS-CFS', name: 'CFS to CFS' },
  { code: 'DOOR-DOOR', name: 'Door to Door' },
  { code: 'CY-DOOR', name: 'CY to Door' },
  { code: 'DOOR-CY', name: 'Door to CY' },
];

export default function SeaBookingModal({ isOpen, onClose, onSave, editData, mode }: SeaBookingModalProps) {
  const [formData, setFormData] = useState<SeaBookingData>(initialFormData);
  const [activeTab, setActiveTab] = useState<'required' | 'party' | 'schedule' | 'optional'>('required');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editData && mode === 'edit') {
      setFormData(editData);
    } else {
      setFormData(initialFormData);
    }
    setActiveTab('required');
    setErrors({});
  }, [editData, mode, isOpen]);

  const handleChange = (field: keyof SeaBookingData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 필수 항목만 검증 (PPT 화면설계서 기준)
    if (!formData.bookingDate) newErrors.bookingDate = '등록일자를 입력하세요';
    if (!formData.shipper) newErrors.shipper = '거래처(화주)를 입력하세요';
    if (!formData.pol) newErrors.pol = '선적항(POL)을 선택하세요';
    if (!formData.pod) newErrors.pod = '양하항(POD)을 선택하세요';
    if (!formData.commodity) newErrors.commodity = '품목(Commodity)을 입력하세요';
    if (!formData.grossWeight || formData.grossWeight <= 0) newErrors.grossWeight = '총중량을 입력하세요';
    if (!formData.containerType) newErrors.containerType = '컨테이너 타입을 선택하세요';
    if (!formData.containerQty || formData.containerQty < 1) newErrors.containerQty = '컨테이너 수량을 입력하세요';

    setErrors(newErrors);

    // 에러가 있으면 필수정보 탭으로 이동
    if (Object.keys(newErrors).length > 0) {
      setActiveTab('required');
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSave(formData);
      onClose();
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'required', label: '필수정보', icon: '⭐', badge: 8 },
    { id: 'party', label: '송수하인', icon: '👥', badge: 0 },
    { id: 'schedule', label: '스케줄', icon: '📅', badge: 0 },
    { id: 'optional', label: '선택정보', icon: '📝', badge: 0 },
  ];

  // 필수 항목 뱃지 컴포넌트
  const RequiredBadge = () => (
    <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-red-500/20 text-red-400 rounded">
      필수
    </span>
  );

  // 에러 메시지 컴포넌트
  const FieldError = ({ field }: { field: string }) => {
    const errorMsg = errors[field];
    if (!errorMsg) return null;
    return <p className="text-red-400 text-xs mt-1">{errorMsg}</p>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] mx-4 overflow-hidden rounded-2xl"
        style={{
          background: 'linear-gradient(180deg, #0F1629 0%, #0A0F1C 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #E8A838 0%, #D4943A 100%)' }}
              >
                <svg className="w-5 h-5 text-[#0C1222]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {mode === 'create' ? '선적부킹 등록' : '선적부킹 수정'}
                </h2>
                <p className="text-xs text-white/40">
                  {editData?.bookingNo || '신규 부킹 요청'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#E8A838] text-[#0C1222]'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full">{tab.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* 탭 1: 필수정보 */}
          {activeTab === 'required' && (
            <div className="space-y-6">
              {/* 필수 항목 안내 */}
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium text-red-400">필수 입력 항목</p>
                    <p className="text-red-300/80 mt-1">아래 항목은 부킹 등록을 위해 반드시 입력해야 합니다.</p>
                  </div>
                </div>
              </div>

              {/* 기본 정보 */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <h4 className="text-sm font-semibold text-[#E8A838] mb-4">기본 정보</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      등록일자 <RequiredBadge />
                    </label>
                    <input
                      type="date"
                      value={formData.bookingDate}
                      onChange={(e) => handleChange('bookingDate', e.target.value)}
                      className={`w-full px-4 py-2.5 bg-white/5 border rounded-lg text-white focus:ring-2 focus:ring-[#E8A838] focus:border-transparent ${
                        errors.bookingDate ? 'border-red-500' : 'border-white/10'
                      }`}
                    />
                    <FieldError field="bookingDate" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      거래처 (Shipper) <RequiredBadge />
                    </label>
                    <input
                      type="text"
                      value={formData.shipper}
                      onChange={(e) => handleChange('shipper', e.target.value)}
                      placeholder="화주명을 입력하세요"
                      className={`w-full px-4 py-2.5 bg-white/5 border rounded-lg text-white focus:ring-2 focus:ring-[#E8A838] focus:border-transparent ${
                        errors.shipper ? 'border-red-500' : 'border-white/10'
                      }`}
                    />
                    <FieldError field="shipper" />
                  </div>
                </div>
              </div>

              {/* 항구 정보 */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <h4 className="text-sm font-semibold text-[#E8A838] mb-4">항구 정보</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      선적항 (POL) <RequiredBadge />
                    </label>
                    <select
                      value={formData.pol}
                      onChange={(e) => handleChange('pol', e.target.value)}
                      className={`w-full px-4 py-2.5 bg-white/5 border rounded-lg text-white focus:ring-2 focus:ring-[#E8A838] ${
                        errors.pol ? 'border-red-500' : 'border-white/10'
                      }`}
                    >
                      <option value="">선택하세요</option>
                      {ports.map((p) => (
                        <option key={p.code} value={p.code}>{p.code} - {p.name}</option>
                      ))}
                    </select>
                    <FieldError field="pol" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      양하항 (POD) <RequiredBadge />
                    </label>
                    <select
                      value={formData.pod}
                      onChange={(e) => handleChange('pod', e.target.value)}
                      className={`w-full px-4 py-2.5 bg-white/5 border rounded-lg text-white focus:ring-2 focus:ring-[#E8A838] ${
                        errors.pod ? 'border-red-500' : 'border-white/10'
                      }`}
                    >
                      <option value="">선택하세요</option>
                      {ports.map((p) => (
                        <option key={p.code} value={p.code}>{p.code} - {p.name}</option>
                      ))}
                    </select>
                    <FieldError field="pod" />
                  </div>
                </div>
              </div>

              {/* 화물 정보 */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <h4 className="text-sm font-semibold text-[#E8A838] mb-4">화물 정보</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      품목 (Commodity) <RequiredBadge />
                    </label>
                    <input
                      type="text"
                      value={formData.commodity}
                      onChange={(e) => handleChange('commodity', e.target.value)}
                      placeholder="예: 전자제품, 자동차 부품"
                      className={`w-full px-4 py-2.5 bg-white/5 border rounded-lg text-white focus:ring-2 focus:ring-[#E8A838] ${
                        errors.commodity ? 'border-red-500' : 'border-white/10'
                      }`}
                    />
                    <FieldError field="commodity" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      총중량 (Gross Weight) <RequiredBadge />
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={formData.grossWeight || ''}
                        onChange={(e) => handleChange('grossWeight', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className={`flex-1 px-4 py-2.5 bg-white/5 border rounded-lg text-white focus:ring-2 focus:ring-[#E8A838] ${
                          errors.grossWeight ? 'border-red-500' : 'border-white/10'
                        }`}
                      />
                      <select
                        value={formData.weightUnit}
                        onChange={(e) => handleChange('weightUnit', e.target.value)}
                        className="w-20 px-2 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white"
                      >
                        <option value="KG">KG</option>
                        <option value="LB">LB</option>
                        <option value="MT">MT</option>
                      </select>
                    </div>
                    <FieldError field="grossWeight" />
                  </div>
                </div>
              </div>

              {/* 컨테이너 정보 */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <h4 className="text-sm font-semibold text-[#E8A838] mb-4">컨테이너 정보</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      컨테이너 타입 <RequiredBadge />
                    </label>
                    <select
                      value={formData.containerType}
                      onChange={(e) => handleChange('containerType', e.target.value)}
                      className={`w-full px-4 py-2.5 bg-white/5 border rounded-lg text-white focus:ring-2 focus:ring-[#E8A838] ${
                        errors.containerType ? 'border-red-500' : 'border-white/10'
                      }`}
                    >
                      {containerTypes.map((ct) => (
                        <option key={ct.code} value={ct.code}>{ct.code} - {ct.name}</option>
                      ))}
                    </select>
                    <FieldError field="containerType" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      수량 <RequiredBadge />
                    </label>
                    <input
                      type="number"
                      value={formData.containerQty}
                      onChange={(e) => handleChange('containerQty', parseInt(e.target.value) || 0)}
                      min="1"
                      className={`w-full px-4 py-2.5 bg-white/5 border rounded-lg text-white focus:ring-2 focus:ring-[#E8A838] ${
                        errors.containerQty ? 'border-red-500' : 'border-white/10'
                      }`}
                    />
                    <FieldError field="containerQty" />
                  </div>
                </div>

                {/* 컨테이너 요약 */}
                <div className="mt-4 p-4 rounded-lg bg-[#E8A838]/10 border border-[#E8A838]/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#E8A838]/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#E8A838]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white">{formData.containerQty} x {formData.containerType}</p>
                        <p className="text-xs text-white/50">
                          예상 TEU: {formData.containerType.startsWith('20') ? formData.containerQty : formData.containerQty * 2}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 탭 2: 송수하인 (선택 항목) */}
          {activeTab === 'party' && (
            <div className="space-y-6">
              {/* 선택 항목 안내 */}
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium text-blue-400">선택 입력 항목</p>
                    <p className="text-blue-300/80 mt-1">송수하인 정보는 선택사항이며, 나중에 입력할 수 있습니다.</p>
                  </div>
                </div>
              </div>

              {/* 화주 상세 */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <h4 className="text-sm font-semibold text-[#E8A838] mb-4">화주 (Shipper) 상세</h4>
                <div>
                  <label className="block text-sm text-white/50 mb-1">연락처</label>
                  <input
                    type="text"
                    value={formData.shipperContact}
                    onChange={(e) => handleChange('shipperContact', e.target.value)}
                    placeholder="연락처를 입력하세요"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-[#E8A838]"
                  />
                </div>
              </div>

              {/* 수하인 */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <h4 className="text-sm font-semibold text-[#E8A838] mb-4">수하인 (Consignee)</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/50 mb-1">수하인명</label>
                    <input
                      type="text"
                      value={formData.consignee}
                      onChange={(e) => handleChange('consignee', e.target.value)}
                      placeholder="수하인명을 입력하세요"
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-[#E8A838]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/50 mb-1">연락처</label>
                    <input
                      type="text"
                      value={formData.consigneeContact}
                      onChange={(e) => handleChange('consigneeContact', e.target.value)}
                      placeholder="연락처를 입력하세요"
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-[#E8A838]"
                    />
                  </div>
                </div>
              </div>

              {/* Notify Party */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <h4 className="text-sm font-semibold text-[#E8A838] mb-4">통지처 (Notify Party)</h4>
                <input
                  type="text"
                  value={formData.notifyParty}
                  onChange={(e) => handleChange('notifyParty', e.target.value)}
                  placeholder="통지처를 입력하세요"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-[#E8A838]"
                />
              </div>
            </div>
          )}

          {/* 탭 3: 스케줄 (선택 항목) */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              {/* 선택 항목 안내 */}
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium text-blue-400">선택 입력 항목</p>
                    <p className="text-blue-300/80 mt-1">스케줄 정보는 선사 확정 후 입력할 수 있습니다.</p>
                  </div>
                </div>
              </div>

              {/* 선사 정보 */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <h4 className="text-sm font-semibold text-[#E8A838] mb-4">선사 정보</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-white/50 mb-1">선사</label>
                    <select
                      value={formData.carrier}
                      onChange={(e) => handleChange('carrier', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-[#E8A838]"
                    >
                      <option value="">선택</option>
                      {carriers.map((c) => (
                        <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-white/50 mb-1">선명 (Vessel)</label>
                    <input
                      type="text"
                      value={formData.vessel}
                      onChange={(e) => handleChange('vessel', e.target.value)}
                      placeholder="선명"
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-[#E8A838]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/50 mb-1">항차 (Voyage)</label>
                    <input
                      type="text"
                      value={formData.voyage}
                      onChange={(e) => handleChange('voyage', e.target.value)}
                      placeholder="항차"
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-[#E8A838]"
                    />
                  </div>
                </div>
              </div>

              {/* 일정 정보 */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <h4 className="text-sm font-semibold text-[#E8A838] mb-4">일정 정보</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-white/50 mb-1">ETD (출항예정일)</label>
                    <input
                      type="date"
                      value={formData.etd}
                      onChange={(e) => handleChange('etd', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-[#E8A838]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/50 mb-1">ETA (도착예정일)</label>
                    <input
                      type="date"
                      value={formData.eta}
                      onChange={(e) => handleChange('eta', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-[#E8A838]"
                    />
                  </div>
                </div>
              </div>

              {/* 최종목적지 */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <h4 className="text-sm font-semibold text-[#E8A838] mb-4">최종목적지</h4>
                <input
                  type="text"
                  value={formData.finalDest}
                  onChange={(e) => handleChange('finalDest', e.target.value)}
                  placeholder="최종 목적지를 입력하세요"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-[#E8A838]"
                />
              </div>
            </div>
          )}

          {/* 탭 4: 선택정보 */}
          {activeTab === 'optional' && (
            <div className="space-y-6">
              {/* 선택 항목 안내 */}
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium text-blue-400">선택 입력 항목</p>
                    <p className="text-blue-300/80 mt-1">아래 항목들은 선택사항이며, 필요한 경우에만 입력하세요.</p>
                  </div>
                </div>
              </div>

              {/* 추가 정보 */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <h4 className="text-sm font-semibold text-[#E8A838] mb-4">추가 정보</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/50 mb-1">포워더 코드</label>
                    <input
                      type="text"
                      value={formData.forwarderCode}
                      onChange={(e) => handleChange('forwarderCode', e.target.value)}
                      placeholder="포워더 코드"
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-[#E8A838]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/50 mb-1">Contract Holder</label>
                    <input
                      type="text"
                      value={formData.contractHolder}
                      onChange={(e) => handleChange('contractHolder', e.target.value)}
                      placeholder="계약 담당"
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-[#E8A838]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/50 mb-1">Named Customer</label>
                    <input
                      type="text"
                      value={formData.namedCustomer}
                      onChange={(e) => handleChange('namedCustomer', e.target.value)}
                      placeholder="지정 고객"
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-[#E8A838]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/50 mb-1">Pick up 장소</label>
                    <input
                      type="text"
                      value={formData.pickupLocation}
                      onChange={(e) => handleChange('pickupLocation', e.target.value)}
                      placeholder="픽업 장소"
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-[#E8A838]"
                    />
                  </div>
                </div>
              </div>

              {/* 운송 조건 */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <h4 className="text-sm font-semibold text-[#E8A838] mb-4">운송 조건</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/50 mb-1">Service Term</label>
                    <select
                      value={formData.serviceTerm}
                      onChange={(e) => handleChange('serviceTerm', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-[#E8A838]"
                    >
                      {serviceTerms.map((st) => (
                        <option key={st.code} value={st.code}>{st.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-white/50 mb-1">Freight Terms</label>
                    <select
                      value={formData.freightTerms}
                      onChange={(e) => handleChange('freightTerms', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-[#E8A838]"
                    >
                      {serviceTerms.map((st) => (
                        <option key={st.code} value={st.code}>{st.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-white/50 mb-1">결제조건</label>
                    <select
                      value={formData.paymentTerms}
                      onChange={(e) => handleChange('paymentTerms', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-[#E8A838]"
                    >
                      <option value="PREPAID">Prepaid (선불)</option>
                      <option value="COLLECT">Collect (착불)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-white/50 mb-1">용적 (Measurement)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={formData.measurement || ''}
                        onChange={(e) => handleChange('measurement', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-[#E8A838]"
                      />
                      <select
                        value={formData.measurementUnit}
                        onChange={(e) => handleChange('measurementUnit', e.target.value)}
                        className="w-20 px-2 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white"
                      >
                        <option value="CBM">CBM</option>
                        <option value="CFT">CFT</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* 비고 */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <h4 className="text-sm font-semibold text-[#E8A838] mb-4">비고</h4>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => handleChange('remarks', e.target.value)}
                  placeholder="추가 사항이나 특이사항을 입력하세요"
                  rows={4}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-[#E8A838] resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="text-xs text-white/40">
              <span className="text-red-400 font-medium">필수</span> 표시는 필수 입력 항목입니다
            </div>
            {Object.keys(errors).length > 0 && (
              <div className="text-xs text-red-400">
                {Object.keys(errors).length}개의 필수 항목이 누락되었습니다
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg border border-white/20 text-white/70 hover:bg-white/5 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-lg font-semibold transition-all"
              style={{
                background: 'linear-gradient(135deg, #E8A838 0%, #D4943A 100%)',
                color: '#0C1222',
              }}
            >
              {mode === 'create' ? '등록' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
