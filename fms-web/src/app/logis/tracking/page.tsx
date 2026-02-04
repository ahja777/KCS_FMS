'use client';

import { useState, useRef, useEffect } from 'react';
import PageLayout from '@/components/PageLayout';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';

interface TrackingEvent {
  id: number;
  datetime: string;
  location: string;
  status: string;
  description: string;
  isCompleted: boolean;
  isCurrent?: boolean;
}

interface TrackingData {
  id: number;
  trackingNo: string;
  transportMode: string;
  blNo: string;
  containerNo: string;
  shipper: string;
  consignee: string;
  pol: string;
  pod: string;
  etd: string;
  eta: string;
  atd: string;
  ata: string;
  vessel: string;
  voyage: string;
  carrier: string;
  currentStatus: string;
  currentLocation: string;
  progress: number;
  events: TrackingEvent[];
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  BOOKED: { label: '부킹완료', color: '#6B7280', bgColor: 'rgba(107, 114, 128, 0.15)' },
  PICKED_UP: { label: '픽업완료', color: '#8B5CF6', bgColor: 'rgba(139, 92, 246, 0.15)' },
  AT_ORIGIN_PORT: { label: '출발항도착', color: '#6e5fc9', bgColor: 'rgba(110, 95, 201, 0.15)' },
  DEPARTED: { label: '출항', color: '#2563EB', bgColor: 'rgba(37, 99, 235, 0.15)' },
  IN_TRANSIT: { label: '운송중', color: '#E8A838', bgColor: 'rgba(232, 168, 56, 0.15)' },
  AT_DESTINATION_PORT: { label: '도착항도착', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.15)' },
  CUSTOMS_CLEARED: { label: '통관완료', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.15)' },
  DELIVERED: { label: '배송완료', color: '#059669', bgColor: 'rgba(5, 150, 105, 0.15)' },
};

// 운송 모드 SVG 아이콘 컴포넌트
function TransportIcon({ mode, className = "w-6 h-6" }: { mode: string; className?: string }) {
  switch (mode) {
    case 'SEA':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 17h1m16 0h1M5.6 17l-.8-2.4a1 1 0 01.2-1l2-2a1 1 0 01.7-.3h8.6a1 1 0 01.7.3l2 2a1 1 0 01.2 1l-.8 2.4M7 17v2m10-2v2M6 13V9a2 2 0 012-2h8a2 2 0 012 2v4M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2" />
        </svg>
      );
    case 'AIR':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      );
    case 'TRUCK':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      );
    case 'RAIL':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 17h8M8 17l-2 4m2-4V7m8 10l2 4m-2-4V7M6 7h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2z" />
        </svg>
      );
    default:
      return null;
  }
}

const transportModeConfig: Record<string, { label: string; color: string }> = {
  SEA: { label: '해상', color: '#3B82F6' },
  AIR: { label: '항공', color: '#8B5CF6' },
  TRUCK: { label: '육상', color: '#10B981' },
  RAIL: { label: '철도', color: '#F59E0B' },
};

const mockTrackingData: TrackingData = {
  id: 1,
  trackingNo: 'TRK-2026-0001',
  transportMode: 'SEA',
  blNo: 'HDMU1234567',
  containerNo: 'HDMU1234567',
  shipper: '삼성전자',
  consignee: '삼성아메리카',
  pol: 'KRPUS',
  pod: 'USLAX',
  etd: '2026-01-20',
  eta: '2026-02-05',
  atd: '2026-01-20',
  ata: '',
  vessel: 'HMM GDANSK',
  voyage: '001E',
  carrier: 'HMM',
  currentStatus: 'IN_TRANSIT',
  currentLocation: '태평양 (북위 35°, 서경 170°)',
  progress: 65,
  events: [
    { id: 1, datetime: '2026-01-15 09:00', location: '서울 본사', status: 'BOOKED', description: '부킹 완료 - HMM GDANSK 001E', isCompleted: true },
    { id: 2, datetime: '2026-01-18 14:30', location: '인천 물류센터', status: 'PICKED_UP', description: '화물 픽업 완료 (500 PKG / 12,000 KG)', isCompleted: true },
    { id: 3, datetime: '2026-01-19 08:00', location: '부산신항 HPNT', status: 'AT_ORIGIN_PORT', description: '출발항 터미널 반입 완료', isCompleted: true },
    { id: 4, datetime: '2026-01-20 16:00', location: '부산신항', status: 'DEPARTED', description: '본선 출항 (HMM GDANSK)', isCompleted: true },
    { id: 5, datetime: '2026-01-25 12:00', location: '태평양', status: 'IN_TRANSIT', description: '운송중 - 예상 도착 2026-02-05', isCompleted: false, isCurrent: true },
    { id: 6, datetime: '2026-02-05 08:00', location: 'Los Angeles, USA', status: 'AT_DESTINATION_PORT', description: '도착항 입항 예정', isCompleted: false },
    { id: 7, datetime: '2026-02-06 14:00', location: 'Los Angeles, USA', status: 'CUSTOMS_CLEARED', description: '통관 예정', isCompleted: false },
    { id: 8, datetime: '2026-02-08 10:00', location: '삼성아메리카', status: 'DELIVERED', description: '최종 배송 예정', isCompleted: false },
  ],
};

const recentTrackings = [
  { trackingNo: 'TRK-2026-0001', blNo: 'HDMU1234567', status: 'IN_TRANSIT', progress: 65 },
  { trackingNo: 'TRK-2026-0002', blNo: 'MAEU5678901', status: 'AT_DESTINATION_PORT', progress: 85 },
  { trackingNo: 'TRK-2026-0003', blNo: 'MSCU2345678', status: 'DELIVERED', progress: 100 },
  { trackingNo: 'TRK-2026-0004', blNo: 'OOLU9876543', status: 'DEPARTED', progress: 35 },
];

export default function CargoTrackingPage() {
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const [searchNo, setSearchNo] = useState('');
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (trackingData) {
      setAnimatedProgress(0);
      const timer = setTimeout(() => {
        setAnimatedProgress(trackingData.progress);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [trackingData]);

  const handleSearch = () => {
    if (!searchNo.trim()) {
      setError('추적 번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    setTimeout(() => {
      setTrackingData(mockTrackingData);
      setLoading(false);
    }, 800);
  };

  const handleQuickSearch = (trackingNo: string) => {
    setSearchNo(trackingNo);
    setLoading(true);
    setError('');

    setTimeout(() => {
      setTrackingData(mockTrackingData);
      setLoading(false);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <PageLayout
      title="화물 추적"
      subtitle="Logis > 공통 > 화물 추적"
      showCloseButton={false}
    >
      <main ref={formRef} className="p-6">
        {/* 검색 영역 - 히어로 스타일 */}
        <div className="relative mb-8 overflow-hidden rounded-2xl">
          {/* 배경 */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#6e5fc9]/15 via-[var(--surface-100)] to-[#E8A838]/10" />
          <div className="absolute inset-0 opacity-40" style={{
            backgroundImage: `radial-gradient(circle at 15% 50%, rgba(110, 95, 201, 0.2) 0%, transparent 50%),
                              radial-gradient(circle at 85% 50%, rgba(232, 168, 56, 0.15) 0%, transparent 50%)`
          }} />

          <div className="relative p-8 md:p-10">
            {/* 타이틀 */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface-100)]/60 backdrop-blur-sm border border-[var(--border)] mb-4">
                <span className="w-2 h-2 rounded-full bg-[#E8A838] animate-pulse" />
                <span className="text-sm font-medium text-[var(--muted)]">Real-time Tracking</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">화물 실시간 추적</h2>
              <p className="text-[var(--muted)]">B/L No. / AWB No. / Container No. / Tracking No.</p>
            </div>

            {/* 검색 입력 */}
            <div className="max-w-3xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchNo}
                    onChange={e => setSearchNo(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="HDMU1234567 또는 TRK-2026-0001"
                    className="w-full h-14 pl-12 pr-4 bg-[var(--surface-100)]/80 backdrop-blur-sm border border-[var(--border)] rounded-xl text-lg focus:ring-2 focus:ring-[#6e5fc9]/50 focus:border-[#6e5fc9] transition-all placeholder:text-[var(--muted)]/60"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="h-14 px-8 bg-gradient-to-r from-[#E8A838] to-[#D4943A] text-[#0C1222] font-bold rounded-xl hover:shadow-lg hover:shadow-[#E8A838]/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>조회중</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span>추적 조회</span>
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* 최근 조회 */}
              <div className="mt-6 pt-6 border-t border-[var(--border)]/50">
                <p className="text-sm font-medium text-[var(--muted)] mb-3">최근 조회</p>
                <div className="flex flex-wrap gap-2">
                  {recentTrackings.map(item => (
                    <button
                      key={item.trackingNo}
                      onClick={() => handleQuickSearch(item.blNo)}
                      className="group px-4 py-2.5 bg-[var(--surface-100)]/60 backdrop-blur-sm hover:bg-[var(--surface-200)] border border-[var(--border)] rounded-xl text-sm flex items-center gap-3 transition-all hover:border-[#6e5fc9]/50"
                    >
                      <span className="font-medium group-hover:text-[#E8A838] transition-colors">{item.blNo}</span>
                      <span
                        className="px-2 py-0.5 text-xs rounded-md font-medium"
                        style={{
                          color: statusConfig[item.status]?.color,
                          backgroundColor: statusConfig[item.status]?.bgColor
                        }}
                      >
                        {statusConfig[item.status]?.label}
                      </span>
                      <div className="w-14 h-1.5 bg-[var(--surface-200)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${item.progress}%`,
                            backgroundColor: statusConfig[item.status]?.color
                          }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 추적 결과 */}
        {trackingData && (
          <div
            className="space-y-6"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.5s ease-out'
            }}
          >
            {/* 요약 카드 */}
            <div className="card overflow-hidden">
              <div className="p-6 md:p-8">
                {/* 헤더 */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
                  <div className="flex items-center gap-5">
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center transition-transform duration-300 hover:scale-105"
                      style={{
                        backgroundColor: `${transportModeConfig[trackingData.transportMode].color}15`,
                        color: transportModeConfig[trackingData.transportMode].color,
                        boxShadow: `0 8px 32px ${transportModeConfig[trackingData.transportMode].color}20`
                      }}
                    >
                      <TransportIcon mode={trackingData.transportMode} className="w-10 h-10" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="text-2xl md:text-3xl font-bold tracking-tight">{trackingData.blNo}</span>
                        <span
                          className="px-4 py-1.5 rounded-full text-sm font-semibold"
                          style={{
                            color: statusConfig[trackingData.currentStatus]?.color,
                            backgroundColor: statusConfig[trackingData.currentStatus]?.bgColor
                          }}
                        >
                          {statusConfig[trackingData.currentStatus]?.label}
                        </span>
                      </div>
                      <p className="text-[var(--muted)] flex items-center gap-2">
                        <span className="font-medium">{trackingData.vessel}</span>
                        <span className="w-1 h-1 rounded-full bg-[var(--muted)]" />
                        <span>{trackingData.voyage}</span>
                        <span className="w-1 h-1 rounded-full bg-[var(--muted)]" />
                        <span>{trackingData.carrier}</span>
                      </p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--surface-100)] border border-[var(--border)]">
                    <p className="text-xs text-[var(--muted)] mb-1">현재 위치</p>
                    <p className="font-semibold text-lg flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#E8A838]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {trackingData.currentLocation}
                    </p>
                  </div>
                </div>

                {/* 진행률 */}
                <div className="mb-8">
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <p className="text-xs text-[var(--muted)] mb-1">출발지</p>
                      <p className="font-semibold">{trackingData.pol}</p>
                    </div>
                    <div className="text-center">
                      <span className="text-3xl font-bold text-[#E8A838]">{animatedProgress}%</span>
                      <p className="text-xs text-[var(--muted)]">진행률</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[var(--muted)] mb-1">도착지</p>
                      <p className="font-semibold">{trackingData.pod}</p>
                    </div>
                  </div>
                  <div className="relative h-3 bg-[var(--surface-200)] rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${animatedProgress}%`,
                        background: `linear-gradient(90deg, ${transportModeConfig[trackingData.transportMode].color} 0%, #E8A838 100%)`
                      }}
                    />
                    {/* 운송 아이콘 */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[var(--surface-100)] border-2 flex items-center justify-center transition-all duration-1000 ease-out"
                      style={{
                        left: `${animatedProgress}%`,
                        borderColor: '#E8A838'
                      }}
                    >
                      <TransportIcon mode={trackingData.transportMode} className="w-4 h-4 text-[#E8A838]" />
                    </div>
                  </div>
                </div>

                {/* 구간 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-4 p-5 rounded-xl bg-blue-500/5 border border-blue-500/20">
                    <div className="w-14 h-14 rounded-xl bg-blue-500/15 flex items-center justify-center">
                      <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-medium text-blue-400 uppercase tracking-wide">출발지</span>
                      <p className="font-bold text-xl mt-1">{trackingData.pol}</p>
                      <p className="text-sm text-[var(--muted)]">{trackingData.shipper}</p>
                      <div className="flex gap-4 mt-3 pt-3 border-t border-blue-500/20 text-sm">
                        <div>
                          <span className="text-[var(--muted)]">ETD:</span>
                          <span className="ml-1 font-medium">{trackingData.etd}</span>
                        </div>
                        <div>
                          <span className="text-[var(--muted)]">ATD:</span>
                          <span className="ml-1 font-medium text-green-400">{trackingData.atd || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-5 rounded-xl bg-green-500/5 border border-green-500/20">
                    <div className="w-14 h-14 rounded-xl bg-green-500/15 flex items-center justify-center">
                      <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-medium text-green-400 uppercase tracking-wide">도착지</span>
                      <p className="font-bold text-xl mt-1">{trackingData.pod}</p>
                      <p className="text-sm text-[var(--muted)]">{trackingData.consignee}</p>
                      <div className="flex gap-4 mt-3 pt-3 border-t border-green-500/20 text-sm">
                        <div>
                          <span className="text-[var(--muted)]">ETA:</span>
                          <span className="ml-1 font-medium">{trackingData.eta}</span>
                        </div>
                        <div>
                          <span className="text-[var(--muted)]">ATA:</span>
                          <span className="ml-1 font-medium text-green-400">{trackingData.ata || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 상세 정보 및 이벤트 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 화물 상세 정보 */}
              <div className="card">
                <div className="p-4 border-b border-[var(--border)] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#6e5fc9]/15 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#6e5fc9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold">화물 정보</h3>
                    <p className="text-xs text-[var(--muted)]">Cargo Details</p>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { label: 'Tracking No.', value: trackingData.trackingNo },
                    { label: 'B/L No.', value: trackingData.blNo },
                    { label: 'Container No.', value: trackingData.containerNo },
                    { label: '운송 수단', value: transportModeConfig[trackingData.transportMode].label, color: transportModeConfig[trackingData.transportMode].color },
                    { label: '선사', value: trackingData.carrier },
                    { label: '선명/항차', value: `${trackingData.vessel} / ${trackingData.voyage}` },
                  ].map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-[var(--border)]/50 last:border-0">
                      <span className="text-sm text-[var(--muted)]">{item.label}</span>
                      {item.color ? (
                        <span
                          className="px-2.5 py-1 rounded-md text-xs font-semibold"
                          style={{ backgroundColor: `${item.color}15`, color: item.color }}
                        >
                          {item.value}
                        </span>
                      ) : (
                        <span className="font-medium text-sm">{item.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 이벤트 타임라인 */}
              <div className="lg:col-span-2 card">
                <div className="p-4 border-b border-[var(--border)] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E8A838]/15 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#E8A838]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold">추적 이력</h3>
                    <p className="text-xs text-[var(--muted)]">Tracking History</p>
                  </div>
                </div>
                <div className="p-6 max-h-[450px] overflow-y-auto">
                  {trackingData.events.map((event, index) => (
                    <div
                      key={event.id}
                      className="flex gap-5 pb-6 last:pb-0"
                      style={{
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? 'translateX(0)' : 'translateX(-20px)',
                        transition: `all 0.4s ease-out ${index * 0.08}s`
                      }}
                    >
                      {/* 타임라인 */}
                      <div className="relative flex flex-col items-center">
                        <div className={`relative w-5 h-5 rounded-full z-10 flex items-center justify-center ${
                          event.isCompleted
                            ? 'bg-green-500'
                            : event.isCurrent
                              ? 'bg-[#E8A838]'
                              : 'bg-[var(--surface-200)] border-2 border-[var(--border)]'
                        }`}>
                          {event.isCompleted && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {event.isCurrent && (
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          )}
                        </div>
                        {index < trackingData.events.length - 1 && (
                          <div className={`w-0.5 flex-1 mt-1 min-h-[40px] ${
                            event.isCompleted ? 'bg-green-500' : 'bg-[var(--surface-200)]'
                          }`} />
                        )}
                      </div>

                      {/* 이벤트 내용 */}
                      <div className={`flex-1 pb-2 ${
                        event.isCurrent
                          ? 'bg-gradient-to-r from-[#E8A838]/10 to-transparent -ml-2 pl-4 pr-4 py-3 rounded-xl border-l-2 border-[#E8A838]'
                          : ''
                      }`}>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="px-2.5 py-1 rounded-md text-xs font-semibold"
                              style={{
                                color: event.isCompleted ? '#10B981' : event.isCurrent ? '#E8A838' : 'var(--muted)',
                                backgroundColor: event.isCompleted ? 'rgba(16, 185, 129, 0.15)' : event.isCurrent ? 'rgba(232, 168, 56, 0.15)' : 'var(--surface-100)'
                              }}
                            >
                              {statusConfig[event.status]?.label}
                            </span>
                            <span className={`font-semibold ${!event.isCompleted && !event.isCurrent ? 'text-[var(--muted)]' : ''}`}>
                              {event.location}
                            </span>
                            {event.isCurrent && (
                              <span className="flex items-center gap-1 text-xs text-[#E8A838] font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#E8A838] animate-pulse" />
                                현재
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-[var(--muted)] bg-[var(--surface-100)] px-2 py-1 rounded-md">
                            {event.datetime}
                          </span>
                        </div>
                        <p className={`text-sm ${!event.isCompleted && !event.isCurrent ? 'text-[var(--muted)]' : 'text-[var(--muted)]'}`}>
                          {event.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 알림 설정 */}
            <div className="card">
              <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#E8A838]/20 to-[#E8A838]/5 flex items-center justify-center">
                    <svg className="w-7 h-7 text-[#E8A838]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">알림 설정</h3>
                    <p className="text-sm text-[var(--muted)]">화물 상태 변경 시 실시간 알림을 받으세요</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="px-5 py-3 bg-[var(--surface-100)] hover:bg-[var(--surface-200)] border border-[var(--border)] rounded-xl flex items-center gap-2 transition-all hover:border-blue-500/50 group">
                    <svg className="w-5 h-5 text-[var(--muted)] group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">이메일</span>
                  </button>
                  <button className="px-5 py-3 bg-[var(--surface-100)] hover:bg-[var(--surface-200)] border border-[var(--border)] rounded-xl flex items-center gap-2 transition-all hover:border-green-500/50 group">
                    <svg className="w-5 h-5 text-[var(--muted)] group-hover:text-green-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">SMS</span>
                  </button>
                  <button className="px-5 py-3 bg-gradient-to-r from-[#6e5fc9] to-[#584bb0] text-white rounded-xl flex items-center gap-2 hover:shadow-lg hover:shadow-[#6e5fc9]/25 transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span className="font-semibold">링크 공유</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 검색 전 안내 */}
        {!trackingData && !loading && (
          <div
            className="card overflow-hidden"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.5s ease-out 0.2s'
            }}
          >
            <div className="p-12 md:p-16 text-center relative">
              {/* 배경 패턴 */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-10 left-10 w-32 h-32 border-2 border-current rounded-full" />
                <div className="absolute bottom-10 right-10 w-24 h-24 border-2 border-current rounded-full" />
                <div className="absolute top-1/2 left-1/4 w-16 h-16 border-2 border-current rounded-full" />
              </div>

              <div className="relative">
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-[#6e5fc9]/20 to-[#E8A838]/20 flex items-center justify-center mx-auto mb-8">
                  <svg className="w-14 h-14 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3">화물 추적 서비스</h3>
                <p className="text-[var(--muted)] mb-10 max-w-md mx-auto">
                  B/L 번호, AWB 번호, 컨테이너 번호 또는 추적 번호를 입력하여<br />
                  실시간 화물 위치와 운송 상태를 확인하세요.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <div className="group p-6 rounded-2xl bg-[var(--surface-100)] border border-[var(--border)] hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-300 cursor-pointer">
                    <div className="w-14 h-14 rounded-xl bg-blue-500/15 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <TransportIcon mode="SEA" className="w-7 h-7 text-blue-400" />
                    </div>
                    <p className="font-semibold mb-1">해상 운송</p>
                    <p className="text-sm text-[var(--muted)]">B/L, Container No.</p>
                  </div>
                  <div className="group p-6 rounded-2xl bg-[var(--surface-100)] border border-[var(--border)] hover:border-purple-500/50 hover:bg-purple-500/5 transition-all duration-300 cursor-pointer">
                    <div className="w-14 h-14 rounded-xl bg-purple-500/15 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <TransportIcon mode="AIR" className="w-7 h-7 text-purple-400" />
                    </div>
                    <p className="font-semibold mb-1">항공 운송</p>
                    <p className="text-sm text-[var(--muted)]">AWB No.</p>
                  </div>
                  <div className="group p-6 rounded-2xl bg-[var(--surface-100)] border border-[var(--border)] hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-300 cursor-pointer">
                    <div className="w-14 h-14 rounded-xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <TransportIcon mode="TRUCK" className="w-7 h-7 text-emerald-400" />
                    </div>
                    <p className="font-semibold mb-1">육상 운송</p>
                    <p className="text-sm text-[var(--muted)]">운송장 번호</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </PageLayout>
  );
}
