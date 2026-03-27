'use client';

import { useState, useEffect } from 'react';
import { SeaBookingDetail } from './SeaBookingDetailPanel';

interface SRSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (srData: SRData) => void;
  booking: SeaBookingDetail | null;
}

interface SRData {
  bookingId: string;
  bookingNo: string;
  shippingDate: string;
  cutOffDate: string;
  cutOffTime: string;
  docCutOffDate: string;
  docCutOffTime: string;
  cyLocation: string;
  specialInstruction: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
}

export default function SRSendModal({ isOpen, onClose, onSend, booking }: SRSendModalProps) {
  const [formData, setFormData] = useState<Partial<SRData>>({
    shippingDate: '',
    cutOffDate: '',
    cutOffTime: '17:00',
    docCutOffDate: '',
    docCutOffTime: '12:00',
    cyLocation: '',
    specialInstruction: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'required' | 'optional'>('required');

  // booking이 변경될 때 shippingDate 초기화
  useEffect(() => {
    if (booking?.etd) {
      setFormData(prev => ({ ...prev, shippingDate: booking.etd }));
    }
  }, [booking]);

  if (!isOpen || !booking) return null;

  const handleChange = (field: keyof SRData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 필수 항목 검증
    if (!formData.shippingDate) newErrors.shippingDate = '선적예정일을 입력하세요';
    if (!formData.cyLocation) newErrors.cyLocation = 'CY 장소를 선택하세요';
    if (!formData.cutOffDate) newErrors.cutOffDate = 'Cargo Cut-off 날짜를 입력하세요';
    if (!formData.cutOffTime) newErrors.cutOffTime = 'Cargo Cut-off 시간을 입력하세요';

    setErrors(newErrors);

    // 에러가 있으면 필수정보 탭으로 이동
    if (Object.keys(newErrors).length > 0) {
      setActiveTab('required');
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setIsSending(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    onSend({
      bookingId: booking.id,
      bookingNo: booking.bookingNo,
      shippingDate: formData.shippingDate || '',
      cutOffDate: formData.cutOffDate || '',
      cutOffTime: formData.cutOffTime || '',
      docCutOffDate: formData.docCutOffDate || '',
      docCutOffTime: formData.docCutOffTime || '',
      cyLocation: formData.cyLocation || '',
      specialInstruction: formData.specialInstruction || '',
      contactPerson: formData.contactPerson || '',
      contactPhone: formData.contactPhone || '',
      contactEmail: formData.contactEmail || '',
    });

    setIsSending(false);
    onClose();
  };

  const tabs = [
    { id: 'required', label: '필수정보', icon: '⭐', badge: 4 },
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
      <div
        className="relative w-full max-w-2xl mx-4 rounded-2xl overflow-hidden"
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
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)' }}
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Shipping Request 전송</h2>
                <p className="text-xs text-white/40">{booking.bookingNo}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
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
                    ? 'bg-purple-500 text-white'
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
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* 부킹 정보 요약 */}
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 mb-6">
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-white/40">선사</span>
                <p className="text-white font-medium">{booking.carrier}</p>
              </div>
              <div>
                <span className="text-white/40">선명/항차</span>
                <p className="text-white">{booking.vessel}/{booking.voyage}</p>
              </div>
              <div>
                <span className="text-white/40">POL → POD</span>
                <p className="text-white">{booking.pol} → {booking.pod}</p>
              </div>
              <div>
                <span className="text-white/40">컨테이너</span>
                <p className="text-white">{booking.containerQty} x {booking.containerType}</p>
              </div>
            </div>
          </div>

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
                    <p className="text-red-300/80 mt-1">아래 항목은 S/R 전송을 위해 반드시 입력해야 합니다.</p>
                  </div>
                </div>
              </div>

              {/* 선적 일정 */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <h3 className="text-sm font-semibold text-[#E8A838] mb-4">선적 일정</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      선적예정일 <RequiredBadge />
                    </label>
                    <input
                      type="date"
                      value={formData.shippingDate}
                      onChange={(e) => handleChange('shippingDate', e.target.value)}
                      className={`w-full px-4 py-2.5 bg-white/5 border rounded-lg text-white focus:ring-2 focus:ring-purple-500 ${
                        errors.shippingDate ? 'border-red-500' : 'border-white/10'
                      }`}
                    />
                    <FieldError field="shippingDate" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      CY 장소 <RequiredBadge />
                    </label>
                    <select
                      value={formData.cyLocation}
                      onChange={(e) => handleChange('cyLocation', e.target.value)}
                      className={`w-full px-4 py-2.5 bg-white/5 border rounded-lg text-white focus:ring-2 focus:ring-purple-500 ${
                        errors.cyLocation ? 'border-red-500' : 'border-white/10'
                      }`}
                    >
                      <option value="">선택하세요</option>
                      <option value="PNIT">PNIT (부산신항)</option>
                      <option value="HPNT">HPNT (부산신항)</option>
                      <option value="PNC">PNC (부산신항)</option>
                      <option value="HJNC">HJNC (부산북항)</option>
                      <option value="ICT">ICT (인천항)</option>
                    </select>
                    <FieldError field="cyLocation" />
                  </div>
                </div>
              </div>

              {/* Cargo Cut-off 정보 */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <h3 className="text-sm font-semibold text-[#E8A838] mb-4">Cargo Cut-off</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Cut-off 날짜 <RequiredBadge />
                    </label>
                    <input
                      type="date"
                      value={formData.cutOffDate}
                      onChange={(e) => handleChange('cutOffDate', e.target.value)}
                      className={`w-full px-4 py-2.5 bg-white/5 border rounded-lg text-white focus:ring-2 focus:ring-purple-500 ${
                        errors.cutOffDate ? 'border-red-500' : 'border-white/10'
                      }`}
                    />
                    <FieldError field="cutOffDate" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Cut-off 시간 <RequiredBadge />
                    </label>
                    <input
                      type="time"
                      value={formData.cutOffTime}
                      onChange={(e) => handleChange('cutOffTime', e.target.value)}
                      className={`w-full px-4 py-2.5 bg-white/5 border rounded-lg text-white focus:ring-2 focus:ring-purple-500 ${
                        errors.cutOffTime ? 'border-red-500' : 'border-white/10'
                      }`}
                    />
                    <FieldError field="cutOffTime" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 탭 2: 선택정보 */}
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

              {/* Document Cut-off */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <h3 className="text-sm font-semibold text-[#E8A838] mb-4">Document Cut-off</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/50 mb-1">Doc Cut-off 날짜</label>
                    <input
                      type="date"
                      value={formData.docCutOffDate}
                      onChange={(e) => handleChange('docCutOffDate', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/50 mb-1">Doc Cut-off 시간</label>
                    <input
                      type="time"
                      value={formData.docCutOffTime}
                      onChange={(e) => handleChange('docCutOffTime', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* 담당자 정보 */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <h3 className="text-sm font-semibold text-[#E8A838] mb-4">담당자 정보</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-white/50 mb-1">담당자명</label>
                    <input
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => handleChange('contactPerson', e.target.value)}
                      placeholder="홍길동"
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/50 mb-1">연락처</label>
                    <input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => handleChange('contactPhone', e.target.value)}
                      placeholder="010-1234-5678"
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/50 mb-1">이메일</label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => handleChange('contactEmail', e.target.value)}
                      placeholder="email@company.com"
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* 특이사항 */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <h3 className="text-sm font-semibold text-[#E8A838] mb-4">특이사항 / 요청사항</h3>
                <textarea
                  value={formData.specialInstruction}
                  onChange={(e) => handleChange('specialInstruction', e.target.value)}
                  placeholder="선사에 전달할 특이사항이나 요청사항을 입력하세요"
                  rows={4}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-purple-500 resize-none"
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
              disabled={isSending}
              className="px-6 py-2.5 rounded-lg border border-white/20 text-white/70 hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSending}
              className="px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-all disabled:opacity-70"
              style={{
                background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                color: 'white',
              }}
            >
              {isSending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  전송중...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  S/R 전송
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
