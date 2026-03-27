'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import WorldMapGlobe from '@/components/WorldMapGlobe';
import StatusDistributionChart from '@/components/StatusDistributionChart';
import AlertsExceptionsPanel from '@/components/AlertsExceptionsPanel';

// ============================================================
// Global Shipment Tracking 전체화면 모달 컴포넌트
// ============================================================
function FullscreenMapModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div className="relative w-[95vw] h-[90vh] bg-[var(--card)] rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* 헤더 */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #E8A838 0%, #D4943A 100%)' }}>
              <svg className="w-5 h-5 text-[#0C1222]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                Global Shipment Tracking
              </h2>
              <p className="text-sm text-white/70">Real-time worldwide logistics monitoring • Press ESC to close</p>
            </div>
          </div>

          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all duration-200"
          >
            <span className="text-sm font-medium text-white/90">Close</span>
            <div className="w-8 h-8 rounded-lg bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </button>
        </div>

        {/* 지도 영역 */}
        <div className="w-full h-full">
          <WorldMapGlobe viewMode="full" compactHeight={typeof window !== 'undefined' ? window.innerHeight * 0.9 : 800} />
        </div>
      </div>

      {/* 애니메이션 스타일 */}
      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

interface DashboardData {
  stats: {
    totalShipments: number;
    inTransit: number;
    pendingBL: number;
  };
  recentShipments: Array<{
    shipment_no: string;
    customer_name: string;
    route: string;
    status: string;
    eta: string;
    transport_mode: string;
    pkg_qty: number;
    pkg_type: string;
    gross_weight: number;
    volume_cbm: number;
  }>;
}

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  PENDING: { bg: 'rgba(245, 158, 11, 0.1)', text: '#B45309', dot: '#F59E0B' },
  BOOKED: { bg: 'rgba(59, 130, 246, 0.1)', text: '#1D4ED8', dot: '#3B82F6' },
  SHIPPED: { bg: 'rgba(139, 92, 246, 0.1)', text: '#6D28D9', dot: '#8B5CF6' },
  DEPARTED: { bg: 'rgba(236, 72, 153, 0.1)', text: '#BE185D', dot: '#EC4899' },
  ARRIVED: { bg: 'rgba(20, 184, 166, 0.1)', text: '#0F766E', dot: '#14B8A6' },
  DELIVERED: { bg: 'rgba(34, 197, 94, 0.1)', text: '#15803D', dot: '#22C55E' },
};

function useAnimatedValue(endValue: number, duration: number = 1500) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (endValue === 0) return;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(endValue * easeOut));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [endValue, duration]);
  return value;
}

function KPIGauge({ value, label, color }: { value: number; label: string; color: string }) {
  const animatedValue = useAnimatedValue(value, 2000);
  const circumference = 2 * Math.PI * 35;
  const strokeDashoffset = circumference - (animatedValue / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="90" height="90" className="-rotate-90">
          <circle cx="45" cy="45" r="35" fill="none" stroke="var(--surface-100)" strokeWidth="8" />
          <circle cx="45" cy="45" r="35" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000" style={{ filter: `drop-shadow(0 0 6px ${color}50)` }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center"><span className="text-xl font-bold text-[var(--foreground)]">{animatedValue}%</span></div>
      </div>
      <span className="mt-2 text-xs text-[var(--muted)] text-center">{label}</span>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (response.ok) { const result = await response.json(); setData(result); }
      } catch (error) { console.error('Failed to fetch dashboard data:', error); }
      finally { setIsLoading(false); }
    };
    fetchData();
  }, []);

  const animatedTotal = useAnimatedValue(data?.stats.totalShipments || 0);
  const animatedInTransit = useAnimatedValue(data?.stats.inTransit || 0);
  const animatedPending = useAnimatedValue(data?.stats.pendingBL || 0);

  const donutData = useMemo(() => [
    { label: 'In Transit', value: data?.stats.inTransit || 28, color: '#14D4CE' },
    { label: 'Pending', value: data?.stats.pendingBL || 15, color: '#E8A838' },
    { label: 'Completed', value: 42, color: '#22C55E' },
    { label: 'Delayed', value: 8, color: '#F06449' },
  ], [data]);

  const stats: Array<{ title: string; value: number; suffix: string; prefix?: string; change: string; trend: string; icon: React.ReactNode; gradient: string }> = [
    { title: 'Total Shipments', value: animatedTotal, suffix: '', change: '+12%', trend: 'up', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>), gradient: 'linear-gradient(135deg, #1A2744 0%, #243B67 100%)' },
    { title: 'In Transit', value: animatedInTransit, suffix: '', change: '+5%', trend: 'up', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>), gradient: 'linear-gradient(135deg, #0EA5A1 0%, #14D4CE 100%)' },
    { title: 'Pending B/L', value: animatedPending, suffix: '', change: '-8%', trend: 'down', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>), gradient: 'linear-gradient(135deg, #E8A838 0%, #F5B756 100%)' },
    { title: 'Revenue (MTD)', value: 2.4, suffix: 'M', prefix: '$', change: '+18%', trend: 'up', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>), gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)' },
    { title: 'Avg Lead Time', value: 4.2, suffix: 'd', change: '-12%', trend: 'down', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>), gradient: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)' },
  ];

  const alerts: Array<{ type: 'critical' | 'warning' | 'info' | 'success'; title: string; desc: string; time?: string }> = [
    { type: 'critical', title: 'Delayed Shipment', desc: 'SHP20260002 - 2 days delay at Shanghai port', time: '2 min ago' },
    { type: 'warning', title: 'Document Pending', desc: '3 B/L documents awaiting approval', time: '15 min ago' },
    { type: 'info', title: 'Vessel Arrival', desc: 'EVER GIVEN arriving Rotterdam terminal', time: '1 hour ago' },
    { type: 'success', title: 'Customs Cleared', desc: 'SHP20260008 cleared customs successfully', time: '2 hours ago' },
  ];

  return (
    <PageLayout title="Dashboard" subtitle="Maritime Command Center" showCloseButton={false}>
        {/* 전체화면 지도 모달 */}
        <FullscreenMapModal
          isOpen={isMapFullscreen}
          onClose={() => setIsMapFullscreen(false)}
        />

        <main className="p-3 sm:p-4 lg:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {stats.map((stat, index) => (
              <div key={stat.title} className="stat-card opacity-0 animate-slide-up" style={{ animationDelay: `${index * 0.08}s`, animationFillMode: 'forwards' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: stat.gradient }}>{stat.icon}</div>
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold ${stat.trend === 'up' ? 'bg-[rgba(34,197,94,0.1)] text-[#15803D]' : 'bg-[rgba(239,68,68,0.1)] text-[#DC2626]'}`}>
                    <svg className={`w-2.5 h-2.5 ${stat.trend === 'down' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                    {stat.change}
                  </div>
                </div>
                <p className="text-2xl font-bold text-[var(--foreground)] mb-0.5 number-display" style={{ fontFamily: 'var(--font-display)' }}>
                  {isLoading ? <span className="inline-block w-16 h-7 skeleton" /> : <>{stat.prefix || ''}{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}{stat.suffix || ''}</>}
                </p>
                <p className="text-xs text-[var(--muted)]">{stat.title}</p>
              </div>
            ))}
          </div>

          {/* Global Shipment Tracking + Recent Shipments 나란히 배치 */}
          <div className="grid grid-cols-12 gap-5 mb-5">
            {/* Global Shipment Tracking - 70% (8칸) */}
            <div className="col-span-12 lg:col-span-8 card opacity-0 animate-slide-up" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
              <div className="card-header flex items-center justify-between pb-2">
                <div>
                  <h2 className="text-sm font-bold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-display)' }}>Global Shipment Tracking</h2>
                  <p className="text-[10px] text-[var(--muted)] mt-0.5">Korea Centered - Real-time Shipment Monitoring</p>
                </div>
                {/* 확대보기 버튼 */}
                <button
                  onClick={() => setIsMapFullscreen(true)}
                  className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[var(--surface-100)] to-[var(--surface-50)] hover:from-[#E8A838]/10 hover:to-[#E8A838]/5 border border-[var(--border)] hover:border-[#E8A838]/30 transition-all duration-300 shadow-sm hover:shadow-md"
                  title="전체화면으로 보기"
                >
                  <svg
                    className="w-4 h-4 text-[var(--muted)] group-hover:text-[#E8A838] transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  <span className="text-[11px] font-medium text-[var(--muted)] group-hover:text-[#E8A838] transition-colors">
                    확대
                  </span>
                </button>
              </div>
              <div className="px-3 pb-3">
                <WorldMapGlobe viewMode="compact" compactHeight={527} />
              </div>
            </div>

            {/* Recent Shipments - 30% (4칸) */}
            <div className="col-span-12 lg:col-span-4 card opacity-0 animate-slide-up" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
              <div className="card-header flex items-center justify-between pb-2">
                <div><h2 className="text-lg font-bold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-display)' }}>Recent Shipments</h2></div>
                <a href="/logis" className="flex items-center gap-1 text-sm font-medium text-[var(--amber-500)] hover:underline">View All<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></a>
              </div>
              <div className="overflow-y-auto" style={{ height: '527px' }}>
                {isLoading ? (
                  <div className="card-body"><div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => (<div key={i} className="flex items-center gap-3"><div className="w-10 h-10 skeleton rounded-lg" /><div className="flex-1 space-y-1.5"><div className="w-28 h-4 skeleton" /><div className="w-40 h-3 skeleton" /></div></div>))}</div></div>
                ) : (
                  <div className="space-y-2.5 p-3">
                    {(!data?.recentShipments || data.recentShipments.length === 0) ? (
                      <div className="text-center py-8"><div className="flex flex-col items-center gap-2"><div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface-100)' }}><svg className="w-7 h-7 text-[var(--surface-400)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div><p className="text-sm text-[var(--muted)]">No shipments found</p></div></div>
                    ) : (
                      data.recentShipments.slice(0, 6).map((shipment) => (
                        <div key={shipment.shipment_no} className="p-3 rounded-lg hover:bg-[var(--surface-50)] transition-all cursor-pointer group border border-transparent hover:border-[var(--border)]">
                          {/* 상단: Shipment No, 운송모드, 상태 */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${shipment.transport_mode === 'SEA' ? 'bg-[rgba(26,39,68,0.1)] text-[#1A2744]' : 'bg-[rgba(14,165,233,0.1)] text-[#0284C7]'}`}>
                                {shipment.transport_mode === 'SEA' ? (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>) : (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>)}
                              </div>
                              <Link
                                href={shipment.transport_mode === 'SEA' ? `/logis/import-bl/sea/${shipment.shipment_no}` : `/logis/import-bl/air/${shipment.shipment_no}`}
                                className="font-semibold text-[var(--foreground)] text-sm group-hover:text-[var(--amber-500)] transition-colors hover:underline"
                              >
                                {shipment.shipment_no}
                              </Link>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold" style={{ background: statusConfig[shipment.status]?.bg || 'var(--surface-100)', color: statusConfig[shipment.status]?.text || 'var(--muted)' }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusConfig[shipment.status]?.dot || 'var(--muted)' }} />{shipment.status}
                            </span>
                          </div>
                          {/* 화주 + Route + 갯수/중량/용적 나란히 */}
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                            <div className="flex items-center gap-1.5 text-[var(--muted)]">
                              <span>화주:</span>
                              <span className="font-medium text-[var(--foreground)] truncate">{shipment.customer_name || '-'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[var(--muted)]">
                              <span>수량:</span>
                              <span className="font-medium text-[var(--foreground)]">{Number(shipment.pkg_qty || 0).toLocaleString()} {shipment.pkg_type || 'PKG'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[var(--muted)]">
                              <span>출발:</span>
                              <span className="font-medium text-[var(--foreground)]">{shipment.route?.split('→')[0]?.trim() || '-'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[var(--muted)]">
                              <span>중량:</span>
                              <span className="font-medium text-[var(--foreground)]">{Number(shipment.gross_weight || 0).toLocaleString()} KG</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[var(--muted)]">
                              <span>도착:</span>
                              <span className="font-medium text-[var(--foreground)]">{shipment.route?.split('→')[1]?.trim() || '-'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[var(--muted)]">
                              <span>용적:</span>
                              <span className="font-medium text-[var(--foreground)]">{Number(shipment.volume_cbm || 0).toFixed(1)} CBM</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 하단 위젯 영역 */}
          <>
              <div className="grid grid-cols-12 gap-5">
                {/* Performance KPIs */}
                <div className="col-span-12 md:col-span-6 lg:col-span-4 card opacity-0 animate-slide-up flex flex-col" style={{ animationDelay: '0.55s', animationFillMode: 'forwards', height: '300px' }}>
                  <div className="card-header pb-1 flex-shrink-0"><h2 className="text-base font-bold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-display)' }}>Performance KPIs</h2></div>
                  <div className="card-body py-4 flex-1 flex items-center justify-center">
                    <div className="flex justify-around items-center w-full px-4">
                      <KPIGauge value={94} label="On-Time Rate" color="#22C55E" />
                      <KPIGauge value={87} label="Customer Sat." color="#3B82F6" />
                      <KPIGauge value={78} label="Efficiency" color="#E8A838" />
                    </div>
                  </div>
                </div>
                {/* Status Distribution */}
                <div className="col-span-12 md:col-span-6 lg:col-span-4 card opacity-0 animate-slide-up flex flex-col" style={{ animationDelay: '0.6s', animationFillMode: 'forwards', height: '300px' }}>
                  <div className="card-header pb-1 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-bold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-display)' }}>Status Distribution</h2>
                      <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Live</span>
                    </div>
                  </div>
                  <div className="card-body py-2 flex-1 flex items-center justify-center">
                    <StatusDistributionChart data={donutData} />
                  </div>
                </div>
                {/* Alerts & Exceptions */}
                <div className="col-span-12 md:col-span-12 lg:col-span-4 card opacity-0 animate-slide-up flex flex-col" style={{ animationDelay: '0.65s', animationFillMode: 'forwards', height: '300px' }}>
                  <div className="card-header flex items-center justify-between pb-2">
                    <h2 className="text-base font-bold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-display)' }}>Alerts & Exceptions</h2>
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
                      style={{
                        backgroundColor: 'rgba(220, 38, 38, 0.1)',
                        color: '#DC2626',
                        border: '1px solid rgba(220, 38, 38, 0.2)'
                      }}
                    >
                      {alerts.length} NEW
                    </span>
                  </div>
                  <div className="card-body flex-1 overflow-hidden">
                    <AlertsExceptionsPanel alerts={alerts} />
                  </div>
                </div>
              </div>

              <div className="mt-5 card opacity-0 animate-slide-up" style={{ animationDelay: '1s', animationFillMode: 'forwards' }}>
                <div className="card-body py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Quick Actions</span>
                    <div className="w-px h-6 bg-[var(--border)]" />
                    <div className="flex gap-2 flex-1">
                      {[{ label: 'New Shipment', icon: '📦', href: '/logis' }, { label: 'Issue B/L', icon: '📄', href: '/logis' }, { label: 'Check Schedules', icon: '📅', href: '/logis' }, { label: 'Track & Trace', icon: '🔍', href: '/logis' }, { label: 'Generate Report', icon: '📊', href: '/logis' }].map((action) => (
                        <a key={action.label} href={action.href} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 hover:bg-[var(--surface-100)] hover:text-[var(--amber-500)]" style={{ color: 'var(--foreground)' }}><span>{action.icon}</span>{action.label}</a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
          </>
        </main>
    </PageLayout>
  );
}
