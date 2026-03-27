'use client';

import { useState, useCallback, useEffect } from 'react';
import PageLayout from '@/components/PageLayout';

interface TrackingEvent {
  id: number;
  datetime: string;
  location: string;
  status: string;
  description: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

interface CargoInfo {
  trackingNo: string;
  blNo: string;
  containerNo: string;
  transportMode: 'SEA' | 'AIR' | 'TRUCK' | 'RAIL';
  status: string;
  shipper: string;
  consignee: string;
  origin: string;
  destination: string;
  etd: string;
  eta: string;
  atd: string;
  ata: string;
  vessel: string;
  voyage: string;
  carrier: string;
  commodity: string;
  packages: number;
  weight: number;
  volume: number;
  progress: number;
  events: TrackingEvent[];
}

// 샘플 화물 데이터
const sampleCargoData: Record<string, CargoInfo> = {
  'MSKU1234567': {
    trackingNo: 'MSKU1234567',
    blNo: 'MAEU123456789',
    containerNo: 'MSKU1234567',
    transportMode: 'SEA',
    status: 'IN_TRANSIT',
    shipper: '삼성전자',
    consignee: '삼성아메리카',
    origin: 'KRPUS (부산)',
    destination: 'USLAX (로스앤젤레스)',
    etd: '2026-01-20',
    eta: '2026-02-05',
    atd: '2026-01-20',
    ata: '',
    vessel: 'MAERSK HANGZHOU',
    voyage: '001E',
    carrier: 'Maersk Line',
    commodity: '전자제품',
    packages: 150,
    weight: 12500,
    volume: 45.5,
    progress: 65,
    events: [
      { id: 1, datetime: '2026-01-15 09:00', location: '수원 공장', status: 'CARGO_READY', description: '화물 준비 완료', isCompleted: true, isCurrent: false },
      { id: 2, datetime: '2026-01-17 14:00', location: '수원 → 부산', status: 'PICKUP', description: '내륙운송 픽업', isCompleted: true, isCurrent: false },
      { id: 3, datetime: '2026-01-18 08:00', location: '부산항 CY', status: 'GATE_IN', description: '터미널 반입', isCompleted: true, isCurrent: false },
      { id: 4, datetime: '2026-01-19 10:00', location: '부산세관', status: 'CUSTOMS_CLEARED', description: '수출 통관 완료', isCompleted: true, isCurrent: false },
      { id: 5, datetime: '2026-01-20 06:00', location: '부산항', status: 'DEPARTED', description: '선박 출항', isCompleted: true, isCurrent: false },
      { id: 6, datetime: '2026-01-28 12:00', location: '태평양', status: 'IN_TRANSIT', description: '운송 중 (태평양 횡단)', isCompleted: false, isCurrent: true },
      { id: 7, datetime: '2026-02-05 08:00', location: 'LA항', status: 'ARRIVAL', description: '도착 예정', isCompleted: false, isCurrent: false },
      { id: 8, datetime: '2026-02-06 10:00', location: 'LA 세관', status: 'CUSTOMS', description: '수입 통관 예정', isCompleted: false, isCurrent: false },
      { id: 9, datetime: '2026-02-07 14:00', location: 'Dallas, TX', status: 'DELIVERED', description: '최종 배송 예정', isCompleted: false, isCurrent: false },
    ],
  },
  '180-12345678': {
    trackingNo: '180-12345678',
    blNo: '180-12345678',
    containerNo: '',
    transportMode: 'AIR',
    status: 'DELIVERED',
    shipper: 'LG전자',
    consignee: 'LG Electronics USA',
    origin: 'ICN (인천)',
    destination: 'JFK (뉴욕)',
    etd: '2026-01-25',
    eta: '2026-01-26',
    atd: '2026-01-25',
    ata: '2026-01-26',
    vessel: 'KE081',
    voyage: '',
    carrier: 'Korean Air',
    commodity: '가전제품',
    packages: 50,
    weight: 2500,
    volume: 15.0,
    progress: 100,
    events: [
      { id: 1, datetime: '2026-01-24 10:00', location: '평택 공장', status: 'CARGO_READY', description: '화물 준비 완료', isCompleted: true, isCurrent: false },
      { id: 2, datetime: '2026-01-24 18:00', location: '인천공항', status: 'ARRIVED_AT_AIRPORT', description: '공항 도착', isCompleted: true, isCurrent: false },
      { id: 3, datetime: '2026-01-25 02:00', location: '인천공항', status: 'CUSTOMS_CLEARED', description: '수출 통관 완료', isCompleted: true, isCurrent: false },
      { id: 4, datetime: '2026-01-25 08:00', location: '인천공항', status: 'DEPARTED', description: '항공기 출발 (KE081)', isCompleted: true, isCurrent: false },
      { id: 5, datetime: '2026-01-25 22:00', location: 'JFK 공항', status: 'ARRIVAL', description: '뉴욕 도착', isCompleted: true, isCurrent: false },
      { id: 6, datetime: '2026-01-26 06:00', location: 'JFK 세관', status: 'CUSTOMS', description: '수입 통관 완료', isCompleted: true, isCurrent: false },
      { id: 7, datetime: '2026-01-26 14:00', location: 'New Jersey', status: 'DELIVERED', description: '배송 완료', isCompleted: true, isCurrent: false },
    ],
  },
  'TRK-2026-001': {
    trackingNo: 'TRK-2026-001',
    blNo: '',
    containerNo: '',
    transportMode: 'TRUCK',
    status: 'IN_TRANSIT',
    shipper: 'SK하이닉스',
    consignee: 'SK하이닉스 이천공장',
    origin: '서울 물류센터',
    destination: '이천 공장',
    etd: '2026-01-28',
    eta: '2026-01-28',
    atd: '2026-01-28',
    ata: '',
    vessel: '5.5톤 트럭',
    voyage: '차량번호: 12가3456',
    carrier: '대한통운',
    commodity: '반도체 장비',
    packages: 5,
    weight: 3000,
    volume: 12.0,
    progress: 50,
    events: [
      { id: 1, datetime: '2026-01-28 08:00', location: '서울 물류센터', status: 'PICKUP', description: '화물 상차 완료', isCompleted: true, isCurrent: false },
      { id: 2, datetime: '2026-01-28 08:30', location: '서울', status: 'DEPARTED', description: '출발', isCompleted: true, isCurrent: false },
      { id: 3, datetime: '2026-01-28 09:30', location: '경기도 광주', status: 'IN_TRANSIT', description: '운송 중', isCompleted: false, isCurrent: true },
      { id: 4, datetime: '2026-01-28 10:30', location: '이천 공장', status: 'DELIVERED', description: '배송 예정', isCompleted: false, isCurrent: false },
    ],
  },
};

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  CARGO_READY: { label: '화물준비', color: '#6B7280', bgColor: 'rgba(107, 114, 128, 0.15)' },
  PICKUP: { label: '픽업', color: '#8B5CF6', bgColor: 'rgba(139, 92, 246, 0.15)' },
  GATE_IN: { label: '반입', color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.15)' },
  ARRIVED_AT_AIRPORT: { label: '공항도착', color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.15)' },
  CUSTOMS_CLEARED: { label: '통관완료', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.15)' },
  CUSTOMS: { label: '통관중', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.15)' },
  DEPARTED: { label: '출발', color: '#2563EB', bgColor: 'rgba(37, 99, 235, 0.15)' },
  IN_TRANSIT: { label: '운송중', color: '#E8A838', bgColor: 'rgba(232, 168, 56, 0.15)' },
  ARRIVAL: { label: '도착', color: '#059669', bgColor: 'rgba(5, 150, 105, 0.15)' },
  DELIVERED: { label: '배송완료', color: '#059669', bgColor: 'rgba(5, 150, 105, 0.15)' },
};

// 운송 모드 아이콘 SVG 컴포넌트
function TransportIcon({ mode, className = "w-6 h-6", style }: { mode: string; className?: string; style?: React.CSSProperties }) {
  switch (mode) {
    case 'SEA':
      return (
        <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 17h1m16 0h1M5.6 17l-.8-2.4a1 1 0 01.2-1l2-2a1 1 0 01.7-.3h8.6a1 1 0 01.7.3l2 2a1 1 0 01.2 1l-.8 2.4M7 17v2m10-2v2M6 13V9a2 2 0 012-2h8a2 2 0 012 2v4M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2" />
        </svg>
      );
    case 'AIR':
      return (
        <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      );
    case 'TRUCK':
      return (
        <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      );
    case 'RAIL':
      return (
        <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 17h8M8 17l-2 4m2-4V7m8 10l2 4m-2-4V7M6 7h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2z" />
        </svg>
      );
    default:
      return null;
  }
}

const transportModeConfig: Record<string, { label: string; color: string; gradient: string }> = {
  SEA: { label: '해상', color: '#3B82F6', gradient: 'from-blue-500/20 to-blue-600/5' },
  AIR: { label: '항공', color: '#8B5CF6', gradient: 'from-purple-500/20 to-purple-600/5' },
  TRUCK: { label: '육상', color: '#10B981', gradient: 'from-emerald-500/20 to-emerald-600/5' },
  RAIL: { label: '철도', color: '#F59E0B', gradient: 'from-amber-500/20 to-amber-600/5' },
};

export default function CargoTrackingPage() {
  const [searchNo, setSearchNo] = useState('');
  const [searchType, setSearchType] = useState<'tracking' | 'bl' | 'container'>('tracking');
  const [cargoInfo, setCargoInfo] = useState<CargoInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(['MSKU1234567', '180-12345678', 'TRK-2026-001']);
  const [mounted, setMounted] = useState(false);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 진행률 애니메이션
  useEffect(() => {
    if (cargoInfo) {
      setAnimatedProgress(0);
      const timer = setTimeout(() => {
        setAnimatedProgress(cargoInfo.progress);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [cargoInfo]);

  const handleSearch = useCallback(async () => {
    if (!searchNo.trim()) {
      setError('추적번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    setCargoInfo(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const found = sampleCargoData[searchNo.trim().toUpperCase()] || sampleCargoData[searchNo.trim()];

      if (found) {
        setCargoInfo(found);
        setRecentSearches(prev => {
          const newSearches = [searchNo, ...prev.filter(s => s !== searchNo)].slice(0, 5);
          return newSearches;
        });
      } else {
        setError('해당 화물 정보를 찾을 수 없습니다. 추적번호를 확인해주세요.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [searchNo]);

  const handleRecentSearch = (no: string) => {
    setSearchNo(no);
    setSearchType('tracking');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <PageLayout title="화물 추적" subtitle="Logis > Cargo > Tracking" showCloseButton={false}>
      <main className="p-6">
        {/* 검색 영역 - 히어로 스타일 */}
        <div className="relative mb-8 overflow-hidden rounded-2xl">
          {/* 배경 그라데이션 */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#6e5fc9]/20 via-[#0A1628] to-[#E8A838]/10" />
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(110, 95, 201, 0.3) 0%, transparent 50%),
                              radial-gradient(circle at 80% 50%, rgba(232, 168, 56, 0.2) 0%, transparent 50%)`
          }} />

          <div className="relative p-8 md:p-12">
            <div className="max-w-3xl mx-auto">
              {/* 타이틀 */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface-100)]/50 backdrop-blur-sm mb-4">
                  <span className="w-2 h-2 rounded-full bg-[#E8A838] animate-pulse" />
                  <span className="text-sm font-medium text-[var(--muted)]">Real-time Tracking</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-white via-white to-[#E8A838] bg-clip-text text-transparent">
                  화물 실시간 추적
                </h2>
                <p className="text-[var(--muted)] text-lg">
                  B/L 번호, 컨테이너 번호, AWB 번호로 화물을 추적하세요
                </p>
              </div>

              {/* 검색 입력 */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value as 'tracking' | 'bl' | 'container')}
                    className="h-14 pl-4 pr-10 bg-[var(--surface-100)]/80 backdrop-blur-sm border border-[var(--border)] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#6e5fc9]/50 focus:border-[#6e5fc9] transition-all"
                  >
                    <option value="tracking">추적번호</option>
                    <option value="bl">B/L / AWB</option>
                    <option value="container">컨테이너</option>
                  </select>
                </div>
                <div className="relative flex-1">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchNo}
                    onChange={(e) => setSearchNo(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="추적번호를 입력하세요 (예: MSKU1234567)"
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
                      <span>조회</span>
                    </>
                  )}
                </button>
              </div>

              {/* 최근 검색 */}
              {recentSearches.length > 0 && !cargoInfo && (
                <div className="flex flex-wrap items-center gap-2 mt-6">
                  <span className="text-sm text-[var(--muted)]">최근 검색:</span>
                  {recentSearches.map((no, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleRecentSearch(no)}
                      className="px-4 py-2 bg-[var(--surface-100)]/60 backdrop-blur-sm border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] hover:border-[#6e5fc9]/50 transition-all duration-200 text-sm font-medium"
                    >
                      {no}
                    </button>
                  ))}
                </div>
              )}

              {error && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 화물 정보 */}
        {cargoInfo && (
          <div
            className="space-y-6"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.5s ease-out'
            }}
          >
            {/* 상태 요약 카드 */}
            <div className={`card overflow-hidden bg-gradient-to-br ${transportModeConfig[cargoInfo.transportMode].gradient}`}>
              <div className="p-6 md:p-8">
                {/* 헤더 */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
                  <div className="flex items-center gap-5">
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center transition-transform duration-300 hover:scale-105"
                      style={{
                        backgroundColor: `${transportModeConfig[cargoInfo.transportMode].color}20`,
                        color: transportModeConfig[cargoInfo.transportMode].color,
                        boxShadow: `0 8px 32px ${transportModeConfig[cargoInfo.transportMode].color}20`
                      }}
                    >
                      <TransportIcon mode={cargoInfo.transportMode} className="w-10 h-10" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="text-2xl md:text-3xl font-bold tracking-tight">{cargoInfo.trackingNo}</span>
                        <span
                          className="px-4 py-1.5 rounded-full text-sm font-semibold"
                          style={{
                            color: statusConfig[cargoInfo.status]?.color || '#6B7280',
                            backgroundColor: statusConfig[cargoInfo.status]?.bgColor || 'rgba(107, 114, 128, 0.15)'
                          }}
                        >
                          {statusConfig[cargoInfo.status]?.label || cargoInfo.status}
                        </span>
                      </div>
                      <p className="text-[var(--muted)] flex items-center gap-2">
                        <span className="font-medium">{cargoInfo.carrier}</span>
                        <span className="w-1 h-1 rounded-full bg-[var(--muted)]" />
                        <span>{cargoInfo.vessel} {cargoInfo.voyage && `/ ${cargoInfo.voyage}`}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSearch}
                      className="px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      새로고침
                    </button>
                    <button className="px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] transition-colors flex items-center gap-2 text-sm font-medium">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      PDF
                    </button>
                  </div>
                </div>

                {/* 진행률 바 */}
                <div className="mb-8">
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <p className="text-xs text-[var(--muted)] mb-1">출발지</p>
                      <p className="font-semibold">{cargoInfo.origin}</p>
                    </div>
                    <div className="text-center">
                      <span
                        className="text-3xl font-bold"
                        style={{ color: transportModeConfig[cargoInfo.transportMode].color }}
                      >
                        {animatedProgress}%
                      </span>
                      <p className="text-xs text-[var(--muted)]">진행률</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[var(--muted)] mb-1">도착지</p>
                      <p className="font-semibold">{cargoInfo.destination}</p>
                    </div>
                  </div>
                  <div className="relative h-3 bg-[var(--surface-200)] rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${animatedProgress}%`,
                        background: `linear-gradient(90deg, ${transportModeConfig[cargoInfo.transportMode].color} 0%, #E8A838 100%)`
                      }}
                    />
                    {/* 운송 아이콘 */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#0C1222] border-2 flex items-center justify-center transition-all duration-1000 ease-out"
                      style={{
                        left: `${animatedProgress}%`,
                        borderColor: '#E8A838'
                      }}
                    >
                      <TransportIcon mode={cargoInfo.transportMode} className="w-4 h-4 text-[#E8A838]" />
                    </div>
                  </div>
                </div>

                {/* 출발/도착 상세 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--surface-100)]/50 backdrop-blur-sm">
                    <div className="w-14 h-14 rounded-xl bg-blue-500/15 flex items-center justify-center">
                      <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-[var(--muted)] mb-1">출발지</p>
                      <p className="font-bold text-lg">{cargoInfo.origin}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm">
                        <span className="text-[var(--muted)]">ETD: {cargoInfo.etd}</span>
                        {cargoInfo.atd && (
                          <span className="text-green-400 font-medium">ATD: {cargoInfo.atd}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--surface-100)]/50 backdrop-blur-sm">
                    <div className="w-14 h-14 rounded-xl bg-green-500/15 flex items-center justify-center">
                      <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-[var(--muted)] mb-1">도착지</p>
                      <p className="font-bold text-lg">{cargoInfo.destination}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm">
                        <span className="text-[var(--muted)]">ETA: {cargoInfo.eta}</span>
                        {cargoInfo.ata && (
                          <span className="text-green-400 font-medium">ATA: {cargoInfo.ata}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 타임라인 */}
              <div className="lg:col-span-2 card">
                <div className="p-5 border-b border-[var(--border)] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#6e5fc9]/15 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#6e5fc9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold">운송 이력</h3>
                    <p className="text-xs text-[var(--muted)]">Tracking History</p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="relative">
                    {cargoInfo.events.map((event, idx) => (
                      <div
                        key={event.id}
                        className="flex gap-5 pb-6 last:pb-0"
                        style={{
                          opacity: mounted ? 1 : 0,
                          transform: mounted ? 'translateX(0)' : 'translateX(-20px)',
                          transition: `all 0.4s ease-out ${idx * 0.1}s`
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
                          {idx < cargoInfo.events.length - 1 && (
                            <div className={`w-0.5 flex-1 mt-1 ${
                              event.isCompleted ? 'bg-green-500' : 'bg-[var(--surface-200)]'
                            }`} />
                          )}
                        </div>

                        {/* 이벤트 내용 */}
                        <div className={`flex-1 pb-2 ${
                          event.isCurrent
                            ? 'bg-gradient-to-r from-[#E8A838]/15 to-transparent -ml-2 pl-4 pr-4 py-3 rounded-xl border-l-2 border-[#E8A838]'
                            : ''
                        }`}>
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span
                              className="px-2.5 py-1 rounded-md text-xs font-semibold"
                              style={{
                                color: event.isCompleted ? '#10B981' : event.isCurrent ? '#E8A838' : 'var(--muted)',
                                backgroundColor: event.isCompleted ? 'rgba(16, 185, 129, 0.15)' : event.isCurrent ? 'rgba(232, 168, 56, 0.15)' : 'var(--surface-100)'
                              }}
                            >
                              {statusConfig[event.status]?.label || event.status}
                            </span>
                            {event.isCurrent && (
                              <span className="flex items-center gap-1 text-xs text-[#E8A838] font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#E8A838] animate-pulse" />
                                현재 위치
                              </span>
                            )}
                          </div>
                          <p className={`font-semibold ${
                            event.isCompleted || event.isCurrent ? 'text-[var(--foreground)]' : 'text-[var(--muted)]'
                          }`}>
                            {event.description}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-sm text-[var(--muted)]">
                            <span className="flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {event.datetime}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              {event.location}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 화물 상세 정보 */}
              <div className="space-y-6">
                {/* 화물 정보 */}
                <div className="card">
                  <div className="p-4 border-b border-[var(--border)] flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#E8A838]/15 flex items-center justify-center">
                      <svg className="w-4.5 h-4.5 text-[#E8A838]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <h3 className="font-bold">화물 정보</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {cargoInfo.blNo && (
                      <div className="flex justify-between items-center py-2 border-b border-[var(--border)]/50">
                        <span className="text-[var(--muted)] text-sm">B/L No.</span>
                        <span className="font-semibold text-sm">{cargoInfo.blNo}</span>
                      </div>
                    )}
                    {cargoInfo.containerNo && (
                      <div className="flex justify-between items-center py-2 border-b border-[var(--border)]/50">
                        <span className="text-[var(--muted)] text-sm">Container</span>
                        <span className="font-semibold text-sm">{cargoInfo.containerNo}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2 border-b border-[var(--border)]/50">
                      <span className="text-[var(--muted)] text-sm">품목</span>
                      <span className="font-semibold text-sm">{cargoInfo.commodity}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div className="text-center p-3 rounded-lg bg-[var(--surface-100)]">
                        <p className="text-lg font-bold text-[#E8A838]">{cargoInfo.packages}</p>
                        <p className="text-xs text-[var(--muted)]">PKG</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-[var(--surface-100)]">
                        <p className="text-lg font-bold text-[#3B82F6]">{(cargoInfo.weight / 1000).toFixed(1)}</p>
                        <p className="text-xs text-[var(--muted)]">TON</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-[var(--surface-100)]">
                        <p className="text-lg font-bold text-[#10B981]">{cargoInfo.volume}</p>
                        <p className="text-xs text-[var(--muted)]">CBM</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 거래처 정보 */}
                <div className="card">
                  <div className="p-4 border-b border-[var(--border)] flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#6e5fc9]/15 flex items-center justify-center">
                      <svg className="w-4.5 h-4.5 text-[#6e5fc9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="font-bold">거래처 정보</h3>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <span className="text-xs text-[var(--muted)] uppercase tracking-wide">Shipper</span>
                      <p className="font-semibold mt-1">{cargoInfo.shipper}</p>
                    </div>
                    <div>
                      <span className="text-xs text-[var(--muted)] uppercase tracking-wide">Consignee</span>
                      <p className="font-semibold mt-1">{cargoInfo.consignee}</p>
                    </div>
                    <div>
                      <span className="text-xs text-[var(--muted)] uppercase tracking-wide">Carrier</span>
                      <p className="font-semibold mt-1">{cargoInfo.carrier}</p>
                    </div>
                  </div>
                </div>

                {/* 운송 정보 */}
                <div className="card">
                  <div className="p-4 border-b border-[var(--border)] flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${transportModeConfig[cargoInfo.transportMode].color}15` }}
                    >
                      <TransportIcon
                        mode={cargoInfo.transportMode}
                        className="w-4.5 h-4.5"
                        style={{ color: transportModeConfig[cargoInfo.transportMode].color } as React.CSSProperties}
                      />
                    </div>
                    <h3 className="font-bold">운송 정보</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-[var(--muted)] text-sm">운송 수단</span>
                      <span
                        className="px-3 py-1 rounded-full text-sm font-semibold"
                        style={{
                          backgroundColor: `${transportModeConfig[cargoInfo.transportMode].color}15`,
                          color: transportModeConfig[cargoInfo.transportMode].color
                        }}
                      >
                        {transportModeConfig[cargoInfo.transportMode].label}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-t border-[var(--border)]/50">
                      <span className="text-[var(--muted)] text-sm">
                        {cargoInfo.transportMode === 'AIR' ? 'Flight' : 'Vessel'}
                      </span>
                      <span className="font-semibold text-sm">{cargoInfo.vessel}</span>
                    </div>
                    {cargoInfo.voyage && (
                      <div className="flex justify-between items-center py-2 border-t border-[var(--border)]/50">
                        <span className="text-[var(--muted)] text-sm">
                          {cargoInfo.transportMode === 'TRUCK' ? '차량번호' : 'Voyage'}
                        </span>
                        <span className="font-semibold text-sm">{cargoInfo.voyage}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 화물 정보가 없을 때 안내 */}
        {!cargoInfo && !loading && !error && (
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
                <h3 className="text-2xl font-bold mb-3">화물 추적 번호를 입력하세요</h3>
                <p className="text-[var(--muted)] mb-10 max-w-md mx-auto">
                  B/L 번호, AWB 번호, 컨테이너 번호로<br />화물의 실시간 위치를 확인할 수 있습니다.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <div className="group p-6 rounded-2xl bg-[var(--surface-100)] border border-[var(--border)] hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-300 cursor-pointer">
                    <div className="w-14 h-14 rounded-xl bg-blue-500/15 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <TransportIcon mode="SEA" className="w-7 h-7 text-blue-400" />
                    </div>
                    <p className="font-semibold mb-1">해상 화물</p>
                    <p className="text-sm text-[var(--muted)]">B/L, Container No.</p>
                  </div>
                  <div className="group p-6 rounded-2xl bg-[var(--surface-100)] border border-[var(--border)] hover:border-purple-500/50 hover:bg-purple-500/5 transition-all duration-300 cursor-pointer">
                    <div className="w-14 h-14 rounded-xl bg-purple-500/15 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <TransportIcon mode="AIR" className="w-7 h-7 text-purple-400" />
                    </div>
                    <p className="font-semibold mb-1">항공 화물</p>
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
