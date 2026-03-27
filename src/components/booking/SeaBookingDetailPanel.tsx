'use client';

import { useState } from 'react';

export interface SeaBookingDetail {
  id: string;
  bookingNo: string;
  bookingDate: string;
  shipper: string;
  shipperContact?: string;
  consignee: string;
  consigneeContact?: string;
  notifyParty?: string;
  carrier: string;
  vessel: string;
  voyage: string;
  pol: string;
  pod: string;
  finalDest?: string;
  etd: string;
  eta: string;
  containerType: string;
  containerQty: number;
  commodity: string;
  grossWeight?: number;
  weightUnit?: string;
  measurement?: number;
  measurementUnit?: string;
  freightTerms?: string;
  paymentTerms?: string;
  remarks?: string;
  status: 'draft' | 'requested' | 'confirmed' | 'rejected' | 'cancelled';
  srNo?: string;
  srDate?: string;
  bcNo?: string;
  bcDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SeaBookingDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  booking: SeaBookingDetail | null;
  onEdit: (booking: SeaBookingDetail) => void;
  onSendSR: (booking: SeaBookingDetail) => void;
  onStatusChange: (bookingId: string, newStatus: string) => void;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  draft: { label: '작성중', color: '#6B7280', bgColor: 'rgba(107, 114, 128, 0.1)', icon: '📝' },
  requested: { label: 'B/R 요청', color: '#2563EB', bgColor: 'rgba(37, 99, 235, 0.1)', icon: '📤' },
  confirmed: { label: 'B/C 완료', color: '#059669', bgColor: 'rgba(5, 150, 105, 0.1)', icon: '✅' },
  rejected: { label: '거절', color: '#DC2626', bgColor: 'rgba(220, 38, 38, 0.1)', icon: '❌' },
  cancelled: { label: '취소', color: '#9CA3AF', bgColor: 'rgba(156, 163, 175, 0.1)', icon: '🚫' },
};

export default function SeaBookingDetailPanel({
  isOpen,
  onClose,
  booking,
  onEdit,
  onSendSR,
  onStatusChange,
}: SeaBookingDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'timeline' | 'documents'>('info');

  if (!isOpen || !booking) return null;

  const status = statusConfig[booking.status];

  const timelineEvents = [
    { date: booking.createdAt || booking.bookingDate, event: '부킹 등록', status: 'completed' },
    { date: booking.status !== 'draft' ? booking.bookingDate : null, event: 'B/R 요청', status: booking.status !== 'draft' ? 'completed' : 'pending' },
    { date: booking.bcDate, event: 'B/C 확정', status: booking.status === 'confirmed' ? 'completed' : 'pending' },
    { date: booking.srDate, event: 'S/R 전송', status: booking.srNo ? 'completed' : 'pending' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-2xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, #0F1629 0%, #0A0F1C 100%)',
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div>
              <h2 className="text-lg font-bold text-white">{booking.bookingNo}</h2>
              <p className="text-sm text-white/50">{booking.shipper}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ color: status.color, backgroundColor: status.bgColor }}
            >
              {status.icon} {status.label}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-white/10">
          <div className="flex gap-1">
            {[
              { id: 'info', label: '상세정보', icon: '📋' },
              { id: 'timeline', label: '진행현황', icon: '📊' },
              { id: 'documents', label: '관련문서', icon: '📄' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#E8A838] text-[#E8A838]'
                    : 'border-transparent text-white/50 hover:text-white/70'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6" style={{ height: 'calc(100vh - 180px)' }}>
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* 기본정보 */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <h3 className="text-sm font-semibold text-[#E8A838] mb-4">기본정보</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-white/40">부킹번호</span>
                    <p className="text-white font-medium">{booking.bookingNo}</p>
                  </div>
                  <div>
                    <span className="text-white/40">부킹일자</span>
                    <p className="text-white">{booking.bookingDate}</p>
                  </div>
                  <div>
                    <span className="text-white/40">선사</span>
                    <p className="text-white font-medium">{booking.carrier}</p>
                  </div>
                  <div>
                    <span className="text-white/40">선명/항차</span>
                    <p className="text-white">{booking.vessel} / {booking.voyage}</p>
                  </div>
                </div>
              </div>

              {/* 거래처정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <h3 className="text-sm font-semibold text-[#E8A838] mb-3">화주 (Shipper)</h3>
                  <p className="text-white font-medium">{booking.shipper}</p>
                  {booking.shipperContact && (
                    <p className="text-sm text-white/50 mt-1">{booking.shipperContact}</p>
                  )}
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <h3 className="text-sm font-semibold text-[#E8A838] mb-3">수하인 (Consignee)</h3>
                  <p className="text-white font-medium">{booking.consignee}</p>
                  {booking.consigneeContact && (
                    <p className="text-sm text-white/50 mt-1">{booking.consigneeContact}</p>
                  )}
                </div>
              </div>

              {/* 운송정보 */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <h3 className="text-sm font-semibold text-[#E8A838] mb-4">운송정보</h3>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-center">
                    <p className="text-xs text-white/40 mb-1">선적항 (POL)</p>
                    <p className="text-white font-bold">{booking.pol}</p>
                    <p className="text-xs text-[#E8A838] mt-1">ETD: {booking.etd}</p>
                  </div>
                  <div className="flex-1 px-4">
                    <div className="relative">
                      <div className="h-px bg-white/20" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <svg className="w-6 h-6 text-[#E8A838]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-white/40 mb-1">양하항 (POD)</p>
                    <p className="text-white font-bold">{booking.pod}</p>
                    <p className="text-xs text-[#E8A838] mt-1">ETA: {booking.eta}</p>
                  </div>
                </div>
                {booking.finalDest && (
                  <div className="text-center pt-3 border-t border-white/5">
                    <p className="text-xs text-white/40">최종목적지</p>
                    <p className="text-white">{booking.finalDest}</p>
                  </div>
                )}
              </div>

              {/* 화물/컨테이너 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <h3 className="text-sm font-semibold text-[#E8A838] mb-3">화물정보</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-white/40">품목</span>
                      <p className="text-white">{booking.commodity}</p>
                    </div>
                    {booking.grossWeight && (
                      <div>
                        <span className="text-white/40">중량</span>
                        <p className="text-white">{booking.grossWeight.toLocaleString()} {booking.weightUnit || 'KG'}</p>
                      </div>
                    )}
                    {booking.measurement && (
                      <div>
                        <span className="text-white/40">용적</span>
                        <p className="text-white">{booking.measurement} {booking.measurementUnit || 'CBM'}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-[#E8A838]/10 to-transparent border border-[#E8A838]/20">
                  <h3 className="text-sm font-semibold text-[#E8A838] mb-3">컨테이너</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-[#E8A838]/20 flex items-center justify-center">
                      <svg className="w-7 h-7 text-[#E8A838]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{booking.containerQty}</p>
                      <p className="text-sm text-white/50">x {booking.containerType}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 운송조건 */}
              {(booking.freightTerms || booking.paymentTerms) && (
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <h3 className="text-sm font-semibold text-[#E8A838] mb-3">운송조건</h3>
                  <div className="flex gap-6 text-sm">
                    {booking.freightTerms && (
                      <div>
                        <span className="text-white/40">Freight Terms</span>
                        <p className="text-white font-medium">{booking.freightTerms}</p>
                      </div>
                    )}
                    {booking.paymentTerms && (
                      <div>
                        <span className="text-white/40">Payment</span>
                        <p className="text-white font-medium">{booking.paymentTerms}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 비고 */}
              {booking.remarks && (
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <h3 className="text-sm font-semibold text-[#E8A838] mb-2">비고</h3>
                  <p className="text-sm text-white/70">{booking.remarks}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <h3 className="text-sm font-semibold text-[#E8A838] mb-4">진행 현황</h3>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-3 top-0 bottom-0 w-px bg-white/10" />

                  {timelineEvents.map((event, index) => (
                    <div key={index} className="relative pl-10 pb-6 last:pb-0">
                      {/* Dot */}
                      <div
                        className={`absolute left-0 w-6 h-6 rounded-full flex items-center justify-center ${
                          event.status === 'completed'
                            ? 'bg-[#059669]'
                            : 'bg-white/10 border border-white/20'
                        }`}
                      >
                        {event.status === 'completed' && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>

                      <div>
                        <p className={`font-medium ${event.status === 'completed' ? 'text-white' : 'text-white/40'}`}>
                          {event.event}
                        </p>
                        <p className="text-xs text-white/40 mt-1">
                          {event.date || '대기중'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* B/C 정보 */}
              {booking.bcNo && (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-400">✅</span>
                    <h3 className="text-sm font-semibold text-green-400">Booking Confirmation</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-white/40">B/C No.</span>
                      <p className="text-white font-medium">{booking.bcNo}</p>
                    </div>
                    <div>
                      <span className="text-white/40">확정일</span>
                      <p className="text-white">{booking.bcDate}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* S/R 정보 */}
              {booking.srNo && (
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-blue-400">📤</span>
                    <h3 className="text-sm font-semibold text-blue-400">Shipping Request</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-white/40">S/R No.</span>
                      <p className="text-white font-medium">{booking.srNo}</p>
                    </div>
                    <div>
                      <span className="text-white/40">전송일</span>
                      <p className="text-white">{booking.srDate}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <h3 className="text-sm font-semibold text-[#E8A838] mb-4">관련 문서</h3>
                <div className="space-y-2">
                  {[
                    { type: 'B/R', name: 'Booking Request', available: true },
                    { type: 'B/C', name: 'Booking Confirmation', available: booking.status === 'confirmed' },
                    { type: 'S/R', name: 'Shipping Request', available: !!booking.srNo },
                    { type: 'S/I', name: 'Shipping Instruction', available: false },
                  ].map((doc, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        doc.available ? 'bg-white/5 hover:bg-white/10 cursor-pointer' : 'bg-white/[0.02] opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          doc.available ? 'bg-[#E8A838]/20 text-[#E8A838]' : 'bg-white/5 text-white/30'
                        }`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className={`font-medium ${doc.available ? 'text-white' : 'text-white/40'}`}>{doc.type}</p>
                          <p className="text-xs text-white/40">{doc.name}</p>
                        </div>
                      </div>
                      {doc.available && (
                        <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="h-20 px-6 flex items-center justify-between border-t border-white/10">
          <div className="flex gap-2">
            {booking.status === 'draft' && (
              <button
                onClick={() => onStatusChange(booking.id, 'requested')}
                className="px-4 py-2 rounded-lg text-sm font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
              >
                B/R 요청
              </button>
            )}
            {booking.status === 'confirmed' && !booking.srNo && (
              <button
                onClick={() => onSendSR(booking)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
              >
                S/R 전송
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {(booking.status === 'draft' || booking.status === 'requested') && (
              <button
                onClick={() => onEdit(booking)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-white/20 text-white/70 hover:bg-white/5 transition-colors"
              >
                수정
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                background: 'linear-gradient(135deg, #E8A838 0%, #D4943A 100%)',
                color: '#0C1222',
              }}
            >
              인쇄
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
