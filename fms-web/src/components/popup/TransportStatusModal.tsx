'use client';

import { useState } from 'react';

export interface TransportStatus {
  step: number;
  name: string;
  status: 'completed' | 'current' | 'pending';
  dateTime?: string;
  description?: string;
}

export interface TransportInfo {
  transportNo: string;
  shipper: string;
  consignee: string;
  origin: string;
  destination: string;
  carrier: string;
  carrierContact: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNo?: string;
  currentStatus: string;
  statusHistory: TransportStatus[];
}

interface TransportStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  transportNo?: string;
}

// 샘플 운송 상태 데이터
const sampleTransportInfo: TransportInfo = {
  transportNo: 'TR2026010001',
  shipper: '삼성전자 수원사업장',
  consignee: '부산항 CY',
  origin: '경기도 수원시 영통구',
  destination: '부산광역시 강서구 부산신항',
  carrier: '한진택배',
  carrierContact: '1588-0011',
  driverName: '김운전',
  driverPhone: '010-1234-5678',
  vehicleNo: '서울 12가 3456',
  currentStatus: '운송진행',
  statusHistory: [
    { step: 1, name: '배차진행', status: 'completed', dateTime: '2026-01-22 09:00', description: '차량 배차가 시작되었습니다.' },
    { step: 2, name: '배차확정', status: 'completed', dateTime: '2026-01-22 10:30', description: '차량 배차가 확정되었습니다. (차량번호: 서울 12가 3456)' },
    { step: 3, name: '운송시작', status: 'completed', dateTime: '2026-01-22 11:00', description: '화물 상차 완료, 운송을 시작합니다.' },
    { step: 4, name: '운송진행', status: 'current', dateTime: '2026-01-22 14:30', description: '현재 경부고속도로 천안IC 부근 운행 중' },
    { step: 5, name: '운송종료', status: 'pending', description: '목적지 도착 및 화물 하차' },
    { step: 6, name: '계산서 발행', status: 'pending', description: '운송 완료 후 세금계산서 발행' },
    { step: 7, name: '대금결제완료', status: 'pending', description: '운송비 결제 완료' },
  ],
};

const statusColors = {
  completed: { bg: '#D1FAE5', text: '#059669', border: '#10B981' },
  current: { bg: '#DBEAFE', text: '#2563EB', border: '#3B82F6' },
  pending: { bg: '#F3F4F6', text: '#9CA3AF', border: '#D1D5DB' },
};

export default function TransportStatusModal({
  isOpen,
  onClose,
}: TransportStatusModalProps) {
  const [info] = useState<TransportInfo>(sampleTransportInfo);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--surface-100)] rounded-lg shadow-xl w-[700px] max-h-[85vh] flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[#1A2744] rounded-t-lg">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
            운송상태 정보 조회
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 운송 기본 정보 */}
        <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-100)]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-[var(--muted)] mb-1">운송번호</div>
              <div className="font-medium text-blue-600">{info.transportNo}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--muted)] mb-1">현재상태</div>
              <div className="font-medium text-green-600">{info.currentStatus}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--muted)] mb-1">출발지</div>
              <div className="text-sm">{info.origin}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--muted)] mb-1">도착지</div>
              <div className="text-sm">{info.destination}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--muted)] mb-1">위탁업체명</div>
              <div className="text-sm">{info.carrier}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--muted)] mb-1">담당자 연락처</div>
              <div className="text-sm">{info.carrierContact}</div>
            </div>
            {info.driverName && (
              <>
                <div>
                  <div className="text-xs text-[var(--muted)] mb-1">기사명</div>
                  <div className="text-sm">{info.driverName}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--muted)] mb-1">기사 연락처</div>
                  <div className="text-sm">{info.driverPhone}</div>
                </div>
              </>
            )}
            {info.vehicleNo && (
              <div>
                <div className="text-xs text-[var(--muted)] mb-1">차량번호</div>
                <div className="text-sm font-medium">{info.vehicleNo}</div>
              </div>
            )}
          </div>
        </div>

        {/* 운송 진행 상태 */}
        <div className="flex-1 overflow-auto p-4">
          <h3 className="text-sm font-medium text-[var(--foreground)] mb-4">운송진행상태</h3>
          <div className="relative">
            {/* 연결선 */}
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-[var(--border)]" />

            <div className="space-y-4">
              {info.statusHistory.map((step, index) => (
                <div key={step.step} className="relative flex items-start gap-4">
                  {/* 단계 표시 원 */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border-2 z-10"
                    style={{
                      backgroundColor: statusColors[step.status].bg,
                      borderColor: statusColors[step.status].border,
                    }}
                  >
                    {step.status === 'completed' ? (
                      <svg className="w-6 h-6" style={{ color: statusColors[step.status].text }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : step.status === 'current' ? (
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                    ) : (
                      <span className="text-sm font-medium" style={{ color: statusColors[step.status].text }}>{step.step}</span>
                    )}
                  </div>

                  {/* 단계 정보 */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-medium"
                        style={{ color: step.status === 'pending' ? '#9CA3AF' : '#1F2937' }}
                      >
                        {step.name}
                      </span>
                      {step.dateTime && (
                        <span className="text-xs text-[var(--muted)]">{step.dateTime}</span>
                      )}
                    </div>
                    {step.description && (
                      <p className="text-sm text-[var(--muted)] mt-1">{step.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="p-4 border-t border-[var(--border)] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
