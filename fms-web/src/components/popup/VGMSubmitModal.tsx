'use client';

import { useState } from 'react';

export interface VGMData {
  containerNo: string;
  sealNo: string;
  weighingMethod: '1' | '2';  // 1: Method 1 (계량), 2: Method 2 (계산)
  vgm: number;
  tareWeight: number;
  cargoWeight: number;
  packingMaterial: number;
  weighingStation?: string;
  weighingDate: string;
  weighingTime: string;
  certificationNo?: string;
  responsiblePerson: string;
  contactNo: string;
}

interface VGMSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: VGMData) => void;
  containerNo?: string;
  bookingNo?: string;
}

export default function VGMSubmitModal({
  isOpen,
  onClose,
  onSubmit,
  containerNo = '',
  bookingNo = '',
}: VGMSubmitModalProps) {
  const [formData, setFormData] = useState<VGMData>({
    containerNo: containerNo,
    sealNo: '',
    weighingMethod: '1',
    vgm: 0,
    tareWeight: 0,
    cargoWeight: 0,
    packingMaterial: 0,
    weighingStation: '',
    weighingDate: new Date().toISOString().split('T')[0],
    weighingTime: new Date().toTimeString().slice(0, 5),
    certificationNo: '',
    responsiblePerson: '',
    contactNo: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof VGMData, string>>>({});

  const handleChange = (field: keyof VGMData, value: string | number) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Method 1: VGM = 계량 결과
      // Method 2: VGM = Tare + Cargo + Packing
      if (field === 'weighingMethod' && value === '2') {
        updated.vgm = updated.tareWeight + updated.cargoWeight + updated.packingMaterial;
      } else if (['tareWeight', 'cargoWeight', 'packingMaterial'].includes(field) && formData.weighingMethod === '2') {
        const tare = field === 'tareWeight' ? Number(value) : updated.tareWeight;
        const cargo = field === 'cargoWeight' ? Number(value) : updated.cargoWeight;
        const packing = field === 'packingMaterial' ? Number(value) : updated.packingMaterial;
        updated.vgm = tare + cargo + packing;
      }

      return updated;
    });

    // 에러 클리어
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof VGMData, string>> = {};

    if (!formData.containerNo) newErrors.containerNo = '컨테이너 번호를 입력하세요';
    if (!formData.sealNo) newErrors.sealNo = 'Seal 번호를 입력하세요';
    if (!formData.vgm || formData.vgm <= 0) newErrors.vgm = 'VGM 중량을 입력하세요';
    if (!formData.weighingDate) newErrors.weighingDate = '계량일자를 선택하세요';
    if (!formData.responsiblePerson) newErrors.responsiblePerson = '책임자 이름을 입력하세요';
    if (!formData.contactNo) newErrors.contactNo = '연락처를 입력하세요';

    if (formData.weighingMethod === '1' && !formData.weighingStation) {
      newErrors.weighingStation = '계량소 정보를 입력하세요';
    }

    if (formData.weighingMethod === '2') {
      if (!formData.tareWeight || formData.tareWeight <= 0) newErrors.tareWeight = 'Tare 중량을 입력하세요';
      if (!formData.cargoWeight || formData.cargoWeight <= 0) newErrors.cargoWeight = '화물 중량을 입력하세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(formData);
      onClose();
    }
  };

  const handleReset = () => {
    setFormData({
      containerNo: containerNo,
      sealNo: '',
      weighingMethod: '1',
      vgm: 0,
      tareWeight: 0,
      cargoWeight: 0,
      packingMaterial: 0,
      weighingStation: '',
      weighingDate: new Date().toISOString().split('T')[0],
      weighingTime: new Date().toTimeString().slice(0, 5),
      certificationNo: '',
      responsiblePerson: '',
      contactNo: '',
    });
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--surface-100)] rounded-lg shadow-xl w-[700px] max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[#1A2744] rounded-t-lg">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            VGM 제출
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 폼 내용 */}
        <div className="flex-1 overflow-auto p-4">
          {bookingNo && (
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <span className="text-sm text-blue-300">Booking No: </span>
              <span className="text-sm font-medium text-white">{bookingNo}</span>
            </div>
          )}

          {/* 컨테이너 정보 */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-[var(--foreground)] mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-[#E8A838] rounded-full"></span>
              컨테이너 정보
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                  컨테이너 번호 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.containerNo}
                  onChange={(e) => handleChange('containerNo', e.target.value.toUpperCase())}
                  placeholder="ABCD1234567"
                  className={`w-full px-3 py-2 text-sm bg-[var(--surface-50)] border rounded-lg ${
                    errors.containerNo ? 'border-red-500' : 'border-[var(--border)]'
                  }`}
                />
                {errors.containerNo && <p className="text-xs text-red-400 mt-1">{errors.containerNo}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                  Seal 번호 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.sealNo}
                  onChange={(e) => handleChange('sealNo', e.target.value.toUpperCase())}
                  placeholder="SEAL123456"
                  className={`w-full px-3 py-2 text-sm bg-[var(--surface-50)] border rounded-lg ${
                    errors.sealNo ? 'border-red-500' : 'border-[var(--border)]'
                  }`}
                />
                {errors.sealNo && <p className="text-xs text-red-400 mt-1">{errors.sealNo}</p>}
              </div>
            </div>
          </div>

          {/* 계량 방법 */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-[var(--foreground)] mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-[#E8A838] rounded-full"></span>
              계량 방법
            </h3>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="weighingMethod"
                  value="1"
                  checked={formData.weighingMethod === '1'}
                  onChange={(e) => handleChange('weighingMethod', e.target.value)}
                  className="w-4 h-4 accent-[#E8A838]"
                />
                <span className="text-sm">Method 1 (계량)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="weighingMethod"
                  value="2"
                  checked={formData.weighingMethod === '2'}
                  onChange={(e) => handleChange('weighingMethod', e.target.value)}
                  className="w-4 h-4 accent-[#E8A838]"
                />
                <span className="text-sm">Method 2 (계산)</span>
              </label>
            </div>

            {formData.weighingMethod === '1' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                    VGM (kg) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.vgm || ''}
                    onChange={(e) => handleChange('vgm', Number(e.target.value))}
                    placeholder="0"
                    className={`w-full px-3 py-2 text-sm bg-[var(--surface-50)] border rounded-lg ${
                      errors.vgm ? 'border-red-500' : 'border-[var(--border)]'
                    }`}
                  />
                  {errors.vgm && <p className="text-xs text-red-400 mt-1">{errors.vgm}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                    계량소 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.weighingStation}
                    onChange={(e) => handleChange('weighingStation', e.target.value)}
                    placeholder="계량소 이름"
                    className={`w-full px-3 py-2 text-sm bg-[var(--surface-50)] border rounded-lg ${
                      errors.weighingStation ? 'border-red-500' : 'border-[var(--border)]'
                    }`}
                  />
                  {errors.weighingStation && <p className="text-xs text-red-400 mt-1">{errors.weighingStation}</p>}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                      Tare Weight (kg) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.tareWeight || ''}
                      onChange={(e) => handleChange('tareWeight', Number(e.target.value))}
                      placeholder="0"
                      className={`w-full px-3 py-2 text-sm bg-[var(--surface-50)] border rounded-lg ${
                        errors.tareWeight ? 'border-red-500' : 'border-[var(--border)]'
                      }`}
                    />
                    {errors.tareWeight && <p className="text-xs text-red-400 mt-1">{errors.tareWeight}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                      Cargo Weight (kg) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.cargoWeight || ''}
                      onChange={(e) => handleChange('cargoWeight', Number(e.target.value))}
                      placeholder="0"
                      className={`w-full px-3 py-2 text-sm bg-[var(--surface-50)] border rounded-lg ${
                        errors.cargoWeight ? 'border-red-500' : 'border-[var(--border)]'
                      }`}
                    />
                    {errors.cargoWeight && <p className="text-xs text-red-400 mt-1">{errors.cargoWeight}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                      Packing Material (kg)
                    </label>
                    <input
                      type="number"
                      value={formData.packingMaterial || ''}
                      onChange={(e) => handleChange('packingMaterial', Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    />
                  </div>
                </div>
                <div className="p-3 bg-[#E8A838]/10 border border-[#E8A838]/30 rounded-lg">
                  <span className="text-sm text-[var(--muted)]">계산된 VGM: </span>
                  <span className="text-lg font-bold text-[#E8A838]">
                    {formData.vgm.toLocaleString()} kg
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 계량 일시 */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-[var(--foreground)] mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-[#E8A838] rounded-full"></span>
              계량 일시
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                  계량일자 <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={formData.weighingDate}
                  onChange={(e) => handleChange('weighingDate', e.target.value)}
                  className={`w-full px-3 py-2 text-sm bg-[var(--surface-50)] border rounded-lg ${
                    errors.weighingDate ? 'border-red-500' : 'border-[var(--border)]'
                  }`}
                />
                {errors.weighingDate && <p className="text-xs text-red-400 mt-1">{errors.weighingDate}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1">계량시간</label>
                <input
                  type="time"
                  value={formData.weighingTime}
                  onChange={(e) => handleChange('weighingTime', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* 책임자 정보 */}
          <div className="mb-4">
            <h3 className="text-sm font-bold text-[var(--foreground)] mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-[#E8A838] rounded-full"></span>
              책임자 정보
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                  책임자 성명 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.responsiblePerson}
                  onChange={(e) => handleChange('responsiblePerson', e.target.value)}
                  placeholder="홍길동"
                  className={`w-full px-3 py-2 text-sm bg-[var(--surface-50)] border rounded-lg ${
                    errors.responsiblePerson ? 'border-red-500' : 'border-[var(--border)]'
                  }`}
                />
                {errors.responsiblePerson && <p className="text-xs text-red-400 mt-1">{errors.responsiblePerson}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                  연락처 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.contactNo}
                  onChange={(e) => handleChange('contactNo', e.target.value)}
                  placeholder="010-1234-5678"
                  className={`w-full px-3 py-2 text-sm bg-[var(--surface-50)] border rounded-lg ${
                    errors.contactNo ? 'border-red-500' : 'border-[var(--border)]'
                  }`}
                />
                {errors.contactNo && <p className="text-xs text-red-400 mt-1">{errors.contactNo}</p>}
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-[var(--muted)] mb-1">인증서 번호</label>
                <input
                  type="text"
                  value={formData.certificationNo}
                  onChange={(e) => handleChange('certificationNo', e.target.value)}
                  placeholder="선택사항"
                  className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="p-4 border-t border-[var(--border)] flex justify-between">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm bg-[var(--surface-200)] hover:bg-[var(--surface-300)] rounded-lg"
          >
            초기화
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-[var(--surface-200)] hover:bg-[var(--surface-300)] rounded-lg"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 text-sm font-medium rounded-lg"
              style={{
                background: 'linear-gradient(135deg, #E8A838 0%, #D4943A 100%)',
                color: '#0C1222',
              }}
            >
              VGM 제출
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
