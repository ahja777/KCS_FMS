'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { LatLngExpression } from 'leaflet';

// react-leaflet 컴포넌트 동적 import (SSR 비활성화)
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false, loading: () => <MapLoading /> }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import('react-leaflet').then((mod) => mod.Tooltip),
  { ssr: false }
);

// ============================================================
// 지도 뷰 설정 (두 가지 모드 지원)
// ============================================================
// COMPACT 모드: 대한민국 중심 세계지도 (왼쪽: 유럽/아프리카, 오른쪽: 태평양/아메리카)
// FULL 모드: 대한민국 중심 세계지도 (전체 뷰)
// ============================================================
const VIEW_CONFIGS = {
  compact: {
    center: [30, 130] as [number, number],  // 대한민국/동아시아 중심 (세계지도)
    zoom: 2.0,  // 전체 세계 뷰
    maxBounds: [[-60, -30], [75, 290]] as [[number, number], [number, number]],  // 왼쪽:유럽/아프리카, 오른쪽:아메리카
  },
  full: {
    center: [30, 130] as [number, number],  // 대한민국/동아시아 중심
    zoom: 2.0,
    maxBounds: [[-60, -30], [75, 290]] as [[number, number], [number, number]],
  },
};

// 지도 뷰 설정 컴포넌트 (마운트 시 강제 적용)
const SetMapView = dynamic(
  () => Promise.resolve(({ mode }: { mode: 'compact' | 'full' }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks, @typescript-eslint/no-require-imports
    const { useMap } = require('react-leaflet');
    // eslint-disable-next-line react-hooks/rules-of-hooks, @typescript-eslint/no-require-imports
    const { useEffect } = require('react');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const map = useMap();

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      const config = VIEW_CONFIGS[mode];
      // 즉시 뷰 설정
      map.setView(config.center, config.zoom, { animate: false });
      map.setMaxBounds(config.maxBounds);
      map.setMinZoom(mode === 'compact' ? 1.3 : 1.8);
    }, [map, mode]);

    return null;
  }),
  { ssr: false }
);

// 지도 초기화 컨트롤 컴포넌트
const MapResetControl = dynamic(
  () => Promise.resolve(({ onReset, mode }: { onReset: () => void; mode: 'compact' | 'full' }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks, @typescript-eslint/no-require-imports
    const { useMap } = require('react-leaflet');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const map = useMap();

    const handleReset = () => {
      const config = VIEW_CONFIGS[mode];
      map.setView(config.center, config.zoom, { animate: true, duration: 0.5 });
      onReset();
    };

    return (
      <button
        onClick={handleReset}
        className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg backdrop-blur-md z-[1001] hover:scale-105 transition-all duration-200"
        style={{ background: 'rgba(0,0,0,0.7)' }}
        title="지도 초기화"
      >
        <svg className="w-4 h-4 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span className="text-[11px] text-white/90 font-medium">초기화</span>
      </button>
    );
  }),
  { ssr: false }
);

// 로딩 컴포넌트
function MapLoading() {
  return (
    <div className="w-full h-[540px] rounded-2xl overflow-hidden bg-[#e5e7eb] flex items-center justify-center">
      <div className="text-white/60 flex items-center gap-2">
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span>Loading map...</span>
      </div>
    </div>
  );
}

// 타입 정의
interface Port {
  code: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  type?: string;
}

interface CargoInfo {
  customer?: string;
  carrier?: string;
  vessel?: string;
  voyageNo?: string;
  tradeType?: string;
  serviceType?: string;
  incoterms?: string;
  etd?: string;
  eta?: string;
  atd?: string;
  ata?: string;
  packages?: number;
  packageType?: string;
  grossWeight?: string | number;
  volume?: string | number;
  value?: string | number;
  currency?: string;
  blNo?: string;
  hblNo?: string;
  mblNo?: string;
  mblId?: number;
  hblId?: number;
}

interface ShipmentRoute {
  id: string;
  shipmentNo: string;
  type: 'sea' | 'air' | 'truck';
  status: string;
  from: Port;
  to: Port;
  progress: number;
  color: string;
  cargo: CargoInfo;
}

interface TrackingStats {
  totalShipments: number;
  inTransit: number;
  seaRoutes: number;
  airRoutes: number;
  activePorts: number;
}

// ============================================================
// Phase 1: 최적 경로 알고리즘 (해상 경로는 반드시 바다 경유)
// - 해상: 웨이포인트 기반 실제 해상 항로
// - 항공: 대권 항로 (최단 거리)
// ============================================================

// 주요 해상 웨이포인트 정의
const SEA_WAYPOINTS = {
  // 아시아 주요 항구 출구
  KOREA_EXIT: [33.0, 130.0] as [number, number],        // 대한해협 출구
  JAPAN_SOUTH: [30.0, 135.0] as [number, number],       // 일본 남쪽 해역
  TAIWAN_STRAIT: [24.0, 120.0] as [number, number],     // 대만해협
  SOUTH_CHINA_SEA: [15.0, 115.0] as [number, number],   // 남중국해

  // 동남아 해협
  MALACCA_EAST: [1.3, 104.0] as [number, number],       // 말라카해협 동쪽 (싱가포르)
  MALACCA_WEST: [5.0, 95.0] as [number, number],        // 말라카해협 서쪽

  // 인도양
  INDIAN_OCEAN_EAST: [5.0, 80.0] as [number, number],   // 인도양 동부 (스리랑카)
  INDIAN_OCEAN_CENTRAL: [10.0, 65.0] as [number, number], // 인도양 중부
  ARABIAN_SEA: [15.0, 55.0] as [number, number],        // 아라비아해

  // 수에즈 운하
  ADEN_GULF: [12.5, 45.0] as [number, number],          // 아덴만
  RED_SEA_SOUTH: [13.0, 43.0] as [number, number],      // 홍해 남부
  RED_SEA_NORTH: [27.5, 34.0] as [number, number],      // 홍해 북부
  SUEZ_SOUTH: [29.9, 32.5] as [number, number],         // 수에즈 운하 남쪽
  SUEZ_NORTH: [31.3, 32.3] as [number, number],         // 수에즈 운하 북쪽

  // 지중해
  MEDITERRANEAN_EAST: [33.0, 32.0] as [number, number], // 지중해 동부
  MEDITERRANEAN_CENTRAL: [36.0, 15.0] as [number, number], // 지중해 중부
  GIBRALTAR: [36.0, -6.0] as [number, number],          // 지브롤터 해협

  // 대서양
  ATLANTIC_IBERIA: [38.0, -10.0] as [number, number],   // 이베리아 반도 서쪽
  ATLANTIC_BISCAY: [45.0, -8.0] as [number, number],    // 비스케이만
  ENGLISH_CHANNEL: [50.0, -2.0] as [number, number],    // 영국해협
  NORTH_SEA: [54.0, 4.0] as [number, number],           // 북해

  // 태평양
  PACIFIC_NORTH: [40.0, 170.0] as [number, number],     // 태평양 북부
  PACIFIC_CENTRAL: [30.0, -170.0] as [number, number],  // 태평양 중부 (날짜변경선 근처)
  PACIFIC_HAWAII: [22.0, -158.0] as [number, number],   // 하와이 근처

  // 북미
  US_WEST_APPROACH: [32.0, -125.0] as [number, number], // 미국 서해안 접근
  PANAMA_PACIFIC: [8.0, -80.0] as [number, number],     // 파나마 태평양측
  PANAMA_ATLANTIC: [9.5, -80.0] as [number, number],    // 파나마 대서양측
  US_EAST_APPROACH: [35.0, -75.0] as [number, number],  // 미국 동해안 접근

  // 호주
  AUSTRALIA_NORTH: [-12.0, 130.0] as [number, number],  // 호주 북부
  AUSTRALIA_EAST: [-30.0, 155.0] as [number, number],   // 호주 동부
};

// 지역 판별 함수
type Region = 'EAST_ASIA' | 'SOUTHEAST_ASIA' | 'SOUTH_ASIA' | 'MIDDLE_EAST' | 'EUROPE_MED' | 'EUROPE_NORTH' | 'AFRICA' | 'US_WEST' | 'US_EAST' | 'SOUTH_AMERICA' | 'AUSTRALIA' | 'UNKNOWN';

function getRegion(lat: number, lng: number): Region {
  // 동아시아 (한국, 일본, 중국 동부)
  if (lat >= 20 && lat <= 55 && lng >= 100 && lng <= 150) return 'EAST_ASIA';
  // 동남아시아
  if (lat >= -10 && lat < 20 && lng >= 95 && lng <= 140) return 'SOUTHEAST_ASIA';
  // 남아시아 (인도)
  if (lat >= 5 && lat <= 35 && lng >= 65 && lng < 95) return 'SOUTH_ASIA';
  // 중동
  if (lat >= 10 && lat <= 40 && lng >= 30 && lng < 65) return 'MIDDLE_EAST';
  // 유럽 (지중해)
  if (lat >= 30 && lat <= 50 && lng >= -10 && lng < 30) return 'EUROPE_MED';
  // 유럽 (북부)
  if (lat > 50 && lat <= 70 && lng >= -10 && lng <= 30) return 'EUROPE_NORTH';
  // 아프리카
  if (lat >= -35 && lat < 30 && lng >= -20 && lng <= 50) return 'AFRICA';
  // 북미 서해안
  if (lat >= 20 && lat <= 60 && lng >= -130 && lng < -100) return 'US_WEST';
  // 북미 동해안
  if (lat >= 20 && lat <= 55 && lng >= -100 && lng <= -60) return 'US_EAST';
  // 남미
  if (lat >= -55 && lat < 15 && lng >= -85 && lng <= -30) return 'SOUTH_AMERICA';
  // 호주
  if (lat >= -50 && lat < -10 && lng >= 110 && lng <= 180) return 'AUSTRALIA';

  return 'UNKNOWN';
}

// 두 점 사이의 해상 웨이포인트 결정
function getSeaWaypoints(from: [number, number], to: [number, number]): [number, number][] {
  const fromRegion = getRegion(from[0], from[1]);
  const toRegion = getRegion(to[0], to[1]);

  const waypoints: [number, number][] = [];

  // 동아시아 출발
  if (fromRegion === 'EAST_ASIA') {
    // 동아시아 → 북미 서해안 (태평양 횡단)
    if (toRegion === 'US_WEST') {
      waypoints.push(SEA_WAYPOINTS.KOREA_EXIT);
      waypoints.push(SEA_WAYPOINTS.JAPAN_SOUTH);
      waypoints.push(SEA_WAYPOINTS.PACIFIC_NORTH);
      waypoints.push(SEA_WAYPOINTS.PACIFIC_HAWAII);
      waypoints.push(SEA_WAYPOINTS.US_WEST_APPROACH);
    }
    // 동아시아 → 북미 동해안 (파나마 운하 경유)
    else if (toRegion === 'US_EAST') {
      waypoints.push(SEA_WAYPOINTS.KOREA_EXIT);
      waypoints.push(SEA_WAYPOINTS.JAPAN_SOUTH);
      waypoints.push(SEA_WAYPOINTS.PACIFIC_NORTH);
      waypoints.push(SEA_WAYPOINTS.PACIFIC_HAWAII);
      waypoints.push(SEA_WAYPOINTS.PANAMA_PACIFIC);
      waypoints.push(SEA_WAYPOINTS.PANAMA_ATLANTIC);
      waypoints.push(SEA_WAYPOINTS.US_EAST_APPROACH);
    }
    // 동아시아 → 유럽 (수에즈 운하 경유)
    else if (toRegion === 'EUROPE_MED' || toRegion === 'EUROPE_NORTH') {
      waypoints.push(SEA_WAYPOINTS.KOREA_EXIT);
      waypoints.push(SEA_WAYPOINTS.TAIWAN_STRAIT);
      waypoints.push(SEA_WAYPOINTS.SOUTH_CHINA_SEA);
      waypoints.push(SEA_WAYPOINTS.MALACCA_EAST);
      waypoints.push(SEA_WAYPOINTS.MALACCA_WEST);
      waypoints.push(SEA_WAYPOINTS.INDIAN_OCEAN_EAST);
      waypoints.push(SEA_WAYPOINTS.ARABIAN_SEA);
      waypoints.push(SEA_WAYPOINTS.ADEN_GULF);
      waypoints.push(SEA_WAYPOINTS.RED_SEA_SOUTH);
      waypoints.push(SEA_WAYPOINTS.RED_SEA_NORTH);
      waypoints.push(SEA_WAYPOINTS.SUEZ_SOUTH);
      waypoints.push(SEA_WAYPOINTS.SUEZ_NORTH);
      waypoints.push(SEA_WAYPOINTS.MEDITERRANEAN_EAST);
      if (toRegion === 'EUROPE_NORTH') {
        waypoints.push(SEA_WAYPOINTS.MEDITERRANEAN_CENTRAL);
        waypoints.push(SEA_WAYPOINTS.GIBRALTAR);
        waypoints.push(SEA_WAYPOINTS.ATLANTIC_IBERIA);
        waypoints.push(SEA_WAYPOINTS.ATLANTIC_BISCAY);
        waypoints.push(SEA_WAYPOINTS.ENGLISH_CHANNEL);
        waypoints.push(SEA_WAYPOINTS.NORTH_SEA);
      }
    }
    // 동아시아 → 동남아시아
    else if (toRegion === 'SOUTHEAST_ASIA') {
      waypoints.push(SEA_WAYPOINTS.KOREA_EXIT);
      waypoints.push(SEA_WAYPOINTS.TAIWAN_STRAIT);
      waypoints.push(SEA_WAYPOINTS.SOUTH_CHINA_SEA);
    }
    // 동아시아 → 호주
    else if (toRegion === 'AUSTRALIA') {
      waypoints.push(SEA_WAYPOINTS.KOREA_EXIT);
      waypoints.push(SEA_WAYPOINTS.TAIWAN_STRAIT);
      waypoints.push(SEA_WAYPOINTS.SOUTH_CHINA_SEA);
      waypoints.push(SEA_WAYPOINTS.AUSTRALIA_NORTH);
    }
  }

  // 동남아시아 출발
  else if (fromRegion === 'SOUTHEAST_ASIA') {
    if (toRegion === 'US_WEST') {
      waypoints.push(SEA_WAYPOINTS.SOUTH_CHINA_SEA);
      waypoints.push(SEA_WAYPOINTS.TAIWAN_STRAIT);
      waypoints.push(SEA_WAYPOINTS.JAPAN_SOUTH);
      waypoints.push(SEA_WAYPOINTS.PACIFIC_NORTH);
      waypoints.push(SEA_WAYPOINTS.PACIFIC_HAWAII);
      waypoints.push(SEA_WAYPOINTS.US_WEST_APPROACH);
    }
    else if (toRegion === 'EUROPE_MED' || toRegion === 'EUROPE_NORTH') {
      waypoints.push(SEA_WAYPOINTS.MALACCA_EAST);
      waypoints.push(SEA_WAYPOINTS.MALACCA_WEST);
      waypoints.push(SEA_WAYPOINTS.INDIAN_OCEAN_EAST);
      waypoints.push(SEA_WAYPOINTS.ARABIAN_SEA);
      waypoints.push(SEA_WAYPOINTS.ADEN_GULF);
      waypoints.push(SEA_WAYPOINTS.RED_SEA_SOUTH);
      waypoints.push(SEA_WAYPOINTS.RED_SEA_NORTH);
      waypoints.push(SEA_WAYPOINTS.SUEZ_SOUTH);
      waypoints.push(SEA_WAYPOINTS.SUEZ_NORTH);
      waypoints.push(SEA_WAYPOINTS.MEDITERRANEAN_EAST);
    }
  }

  // 유럽 출발
  else if (fromRegion === 'EUROPE_MED' || fromRegion === 'EUROPE_NORTH') {
    if (toRegion === 'EAST_ASIA' || toRegion === 'SOUTHEAST_ASIA') {
      if (fromRegion === 'EUROPE_NORTH') {
        waypoints.push(SEA_WAYPOINTS.NORTH_SEA);
        waypoints.push(SEA_WAYPOINTS.ENGLISH_CHANNEL);
        waypoints.push(SEA_WAYPOINTS.ATLANTIC_BISCAY);
        waypoints.push(SEA_WAYPOINTS.ATLANTIC_IBERIA);
        waypoints.push(SEA_WAYPOINTS.GIBRALTAR);
        waypoints.push(SEA_WAYPOINTS.MEDITERRANEAN_CENTRAL);
      }
      waypoints.push(SEA_WAYPOINTS.MEDITERRANEAN_EAST);
      waypoints.push(SEA_WAYPOINTS.SUEZ_NORTH);
      waypoints.push(SEA_WAYPOINTS.SUEZ_SOUTH);
      waypoints.push(SEA_WAYPOINTS.RED_SEA_NORTH);
      waypoints.push(SEA_WAYPOINTS.RED_SEA_SOUTH);
      waypoints.push(SEA_WAYPOINTS.ADEN_GULF);
      waypoints.push(SEA_WAYPOINTS.ARABIAN_SEA);
      waypoints.push(SEA_WAYPOINTS.INDIAN_OCEAN_EAST);
      waypoints.push(SEA_WAYPOINTS.MALACCA_WEST);
      waypoints.push(SEA_WAYPOINTS.MALACCA_EAST);
      waypoints.push(SEA_WAYPOINTS.SOUTH_CHINA_SEA);
      if (toRegion === 'EAST_ASIA') {
        waypoints.push(SEA_WAYPOINTS.TAIWAN_STRAIT);
        waypoints.push(SEA_WAYPOINTS.KOREA_EXIT);
      }
    }
    else if (toRegion === 'US_EAST') {
      if (fromRegion === 'EUROPE_NORTH') {
        waypoints.push(SEA_WAYPOINTS.NORTH_SEA);
        waypoints.push(SEA_WAYPOINTS.ENGLISH_CHANNEL);
      }
      waypoints.push(SEA_WAYPOINTS.ATLANTIC_BISCAY);
      waypoints.push(SEA_WAYPOINTS.ATLANTIC_IBERIA);
      waypoints.push(SEA_WAYPOINTS.US_EAST_APPROACH);
    }
  }

  // 북미 서해안 출발
  else if (fromRegion === 'US_WEST') {
    if (toRegion === 'EAST_ASIA') {
      waypoints.push(SEA_WAYPOINTS.US_WEST_APPROACH);
      waypoints.push(SEA_WAYPOINTS.PACIFIC_HAWAII);
      waypoints.push(SEA_WAYPOINTS.PACIFIC_NORTH);
      waypoints.push(SEA_WAYPOINTS.JAPAN_SOUTH);
      waypoints.push(SEA_WAYPOINTS.KOREA_EXIT);
    }
  }

  return waypoints;
}

/**
 * 두 점 사이의 곡선 경로 생성 (부드러운 호형) - 해상 경로용
 * 항공 경로와 겹치지 않도록 남쪽(적도 방향)으로 약간 볼록한 호
 */
function createCurvedSegment(
  from: [number, number],
  to: [number, number],
  numPoints: number = 20
): [number, number][] {
  const points: [number, number][] = [];

  // 최단 경로 방향 결정
  let lngDiff = to[1] - from[1];

  // 180도 이상 차이나면 반대 방향이 더 짧음
  if (lngDiff > 180) {
    lngDiff -= 360;
  } else if (lngDiff < -180) {
    lngDiff += 360;
  }

  // 중간 위도 계산 (곡선 방향 결정용)
  const midLat = (from[0] + to[0]) / 2;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat = from[0] + (to[0] - from[0]) * t;
    const lng = from[1] + lngDiff * t;

    // ============================================================
    // 해상 경로: 남쪽(적도 방향)으로 볼록한 호 - 항공과 반대 방향
    // 북반구: 남쪽으로 볼록 (음수 오프셋)
    // 남반구: 북쪽으로 볼록 (양수 오프셋, 적도 방향)
    // ============================================================
    const curveDirection = midLat >= 0 ? -1 : 1;  // 항공과 반대 방향
    const baseCurvature = Math.sin(t * Math.PI) * 2;  // 기본 곡률 2도
    const curvature = baseCurvature * curveDirection;

    points.push([lat + curvature, lng]);
  }

  return points;
}

/**
 * 해상 운송 경로 (웨이포인트 기반 - 반드시 바다 경유)
 */
function createSeaRoutePath(
  from: [number, number],
  to: [number, number],
  numPoints: number = 50
): [number, number][] {
  // 웨이포인트 가져오기
  const waypoints = getSeaWaypoints(from, to);

  // 전체 경로 포인트
  const allPoints: [number, number][] = [];

  // 시작점 → 첫 웨이포인트 → ... → 마지막 웨이포인트 → 끝점
  const fullPath = [from, ...waypoints, to];

  // 각 구간별 포인트 수 계산
  const segmentPoints = Math.max(5, Math.floor(numPoints / fullPath.length));

  for (let i = 0; i < fullPath.length - 1; i++) {
    const segment = createCurvedSegment(fullPath[i], fullPath[i + 1], segmentPoints);
    // 중복 포인트 제거 (마지막 포인트는 다음 세그먼트의 시작점과 동일)
    if (i < fullPath.length - 2) {
      allPoints.push(...segment.slice(0, -1));
    } else {
      allPoints.push(...segment);
    }
  }

  return allPoints;
}

/**
 * 항공 경로용 대권 항로 (Great Circle Route)
 */
function createGreatCirclePath(
  from: [number, number],
  to: [number, number],
  numPoints: number = 50
): [number, number][] {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  // 경도 차이가 180도를 넘으면 날짜변경선 처리
  let lng1Adj = from[1];
  let lng2Adj = to[1];
  let crossesPacific = false;

  if (Math.abs(to[1] - from[1]) > 180) {
    crossesPacific = true;
    if (from[1] > 0 && to[1] < 0) {
      lng2Adj = to[1] + 360;
    } else if (from[1] < 0 && to[1] > 0) {
      lng1Adj = from[1] + 360;
    }
  }

  const lat1 = toRad(from[0]);
  const lng1 = toRad(lng1Adj);
  const lat2 = toRad(to[0]);
  const lng2 = toRad(lng2Adj);

  const points: [number, number][] = [];

  const d = Math.acos(
    Math.max(-1, Math.min(1,
      Math.sin(lat1) * Math.sin(lat2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1)
    ))
  );

  if (d === 0 || isNaN(d)) {
    for (let i = 0; i <= numPoints; i++) points.push(from);
    return points;
  }

  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);

    const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
    const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);

    const lat = toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)));
    let lng = toDeg(Math.atan2(y, x));

    if (crossesPacific && i > 0) {
      const prevLng = points[i - 1][1];
      while (lng - prevLng > 180) lng -= 360;
      while (lng - prevLng < -180) lng += 360;
    }

    points.push([lat, lng]);
  }

  return points;
}

/**
 * 항공 경로 (Quadratic Bezier Curve) - 높은 호형 곡선
 * 비행기 기내 화면 스타일: 해상 경로와 명확히 구분되는 높은 호
 *
 * 핵심: 항공 경로는 해상 경로보다 훨씬 높은 호를 그려 겹침 방지
 * - 북반구: 북쪽으로 높은 호 (위도 +15~25도)
 * - 남반구: 남쪽으로 높은 호
 */
function createAirRoutePath(
  from: [number, number],
  to: [number, number],
  numPoints: number = 50
): [number, number][] {
  const [fromLat, fromLng] = from;
  const [toLat, toLng] = to;

  // 최단 경로 방향 결정
  let lngDiff = toLng - fromLng;

  // 180도 이상 차이나면 반대 방향이 더 짧음
  if (lngDiff > 180) {
    lngDiff -= 360;
  } else if (lngDiff < -180) {
    lngDiff += 360;
  }

  // 중간점 계산
  const midLat = (fromLat + toLat) / 2;

  // 거리 계산 (호의 높이 결정용)
  const latDiff = Math.abs(toLat - fromLat);
  const absLngDiff = Math.abs(lngDiff);
  const distance = Math.sqrt(latDiff * latDiff + absLngDiff * absLngDiff);

  // ============================================================
  // 항공 경로 호 높이 대폭 증가 (해상 경로와 겹침 방지)
  // - 기존: distance * 0.04, 최대 8도
  // - 변경: distance * 0.15, 최대 25도, 최소 8도
  // ============================================================
  const baseArcHeight = Math.min(distance * 0.15, 25);
  const maxAllowedLat = 70;
  const latHeadroom = maxAllowedLat - Math.abs(midLat);
  // 최소 호 높이를 8도로 설정하여 항상 해상 경로와 분리
  const arcHeight = Math.min(baseArcHeight, Math.max(latHeadroom * 0.5, 8));

  // 곡선 방향: 북반구면 위로 (북극 방향), 남반구면 아래로
  const curveDirection = midLat >= 0 ? 1 : -1;

  // 제어점 위도 계산 - 더 높은 호를 위해 조정
  let controlLat = midLat + arcHeight * curveDirection;
  controlLat = Math.max(-65, Math.min(68, controlLat));

  const points: [number, number][] = [];

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;

    // Quadratic Bezier for latitude - 높은 호형 곡선
    const oneMinusT = 1 - t;
    let lat = oneMinusT * oneMinusT * fromLat +
              2 * oneMinusT * t * controlLat +
              t * t * toLat;

    // 경도 계산 (선형 보간) - 연속 좌표 유지
    const lng = fromLng + lngDiff * t;

    // 위도 클램핑
    lat = Math.max(-68, Math.min(68, lat));

    points.push([lat, lng]);
  }

  return points;
}

/**
 * 내륙 운송 경로 (Direct Line with slight curve)
 */
function createTruckRoutePath(
  from: [number, number],
  to: [number, number],
  numPoints: number = 20
): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat = from[0] + (to[0] - from[0]) * t;
    const lng = from[1] + (to[1] - from[1]) * t;
    const curve = Math.sin(t * Math.PI) * 0.5;
    points.push([lat + curve, lng]);
  }
  return points;
}

/**
 * 운송 유형별 최적 경로 생성
 * - 해상: 웨이포인트 기반 실제 해상 항로 (바다만 경유)
 * - 항공: 대권 항로 (최단 거리)
 * - 트럭: 직선 경로
 */
function createOptimalRoutePath(
  from: [number, number],
  to: [number, number],
  transportType: 'sea' | 'air' | 'truck',
  numPoints: number = 50
): [number, number][] {
  switch (transportType) {
    case 'air': return createAirRoutePath(from, to, numPoints);
    case 'truck': return createTruckRoutePath(from, to, 20);
    case 'sea':
    default: return createSeaRoutePath(from, to, numPoints);
  }
}

/**
 * 운송 유형별 애니메이션 속도
 */
function getAnimationSpeed(type: 'sea' | 'air' | 'truck'): number {
  switch (type) {
    case 'air': return 0.8;
    case 'truck': return 0.3;
    case 'sea':
    default: return 0.5;
  }
}

// 곡선 경로 생성 (하위 호환성)
function createCurvedPath(from: [number, number], to: [number, number], numPoints: number = 50): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat = from[0] + (to[0] - from[0]) * t;
    const lng = from[1] + (to[1] - from[1]) * t;
    const curvature = Math.sin(t * Math.PI) * Math.abs(to[1] - from[1]) * 0.1;
    points.push([lat + curvature, lng]);
  }
  return points;
}

// 경로상의 위치 계산 (지도 bounds 내로 정규화)
function getPositionOnPath(path: [number, number][], progress: number): [number, number] {
  const index = Math.floor((progress / 100) * (path.length - 1));
  const safeIndex = Math.max(0, Math.min(index, path.length - 1));
  const pos = path[safeIndex];

  if (!pos) {
    // 경로가 비어있거나 잘못된 경우 기본값 반환
    return [30, 130]; // 지도 중심
  }

  let [lat, lng] = pos;

  // 경도를 지도 중심(130°) 기준 연속 좌표계로 정규화
  // 지도 maxBounds: 경도 -30 ~ 290
  // 지도 중심 130도 기준으로 ±180도 범위로 정규화
  // -50 ~ 310 범위로 맞춤 (130 ± 180)
  while (lng < -50) lng += 360;
  while (lng >= 310) lng -= 360;

  return [lat, lng];
}

/**
 * 태평양 횡단 경로 처리 (지도 중심 180도 기준)
 *
 * 지도 중심이 180도일 때, 동아시아(~130°)에서 미국 서해안(~240° = -120°+360)으로
 * 가는 경로가 연속으로 표시되도록 좌표를 조정합니다.
 *
 * 핵심: 경로를 분리하지 않고, 좌표를 지도 중심 기준으로 연속 유지
 */
function adjustPathForPacificCrossing(path: [number, number][]): [number, number][] {
  if (path.length < 2) return path;

  const adjustedPath: [number, number][] = [];
  let prevLng = path[0][1];
  let lngOffset = 0;

  for (let i = 0; i < path.length; i++) {
    const [lat, lng] = path[i];
    let adjustedLng = lng + lngOffset;

    if (i > 0) {
      // 경도가 급격히 변하면 (180도 점프) 오프셋 조정
      const diff = lng - prevLng;
      if (diff > 180) {
        // 서쪽으로 날짜변경선 횡단 (예: 170 -> -170)
        lngOffset -= 360;
        adjustedLng = lng + lngOffset;
      } else if (diff < -180) {
        // 동쪽으로 날짜변경선 횡단 (예: -170 -> 170)
        lngOffset += 360;
        adjustedLng = lng + lngOffset;
      }
    }

    adjustedPath.push([lat, adjustedLng]);
    prevLng = lng;
  }

  return adjustedPath;
}

/**
 * 기존 splitPathAtDateLine 대체 - 경로를 단일 세그먼트로 반환
 * 지도 중심이 180도일 때 연속 경로가 유지되도록 함
 */
function splitPathAtDateLine(path: [number, number][]): [number, number][][] {
  // 태평양 횡단 경로 조정 후 단일 세그먼트로 반환
  return [adjustPathForPacificCrossing(path)];
}

// ============================================================
// 대한민국 기준 좌표 (서울)
// ============================================================
const KOREA_CENTER = { lat: 37.5665, lng: 126.9780 };

/**
 * 대한민국 기준 수출/수입 판단
 * @param from 출발지
 * @param to 도착지
 * @returns 'export' | 'import' | 'transit'
 */
function determineTradeDirection(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): 'export' | 'import' | 'transit' {
  // 한국과의 거리 계산 (간단한 유클리드 거리)
  const fromKoreaDistance = Math.sqrt(
    Math.pow(from.lat - KOREA_CENTER.lat, 2) +
    Math.pow(from.lng - KOREA_CENTER.lng, 2)
  );
  const toKoreaDistance = Math.sqrt(
    Math.pow(to.lat - KOREA_CENTER.lat, 2) +
    Math.pow(to.lng - KOREA_CENTER.lng, 2)
  );

  // 한국 근처 판정 (위도/경도 5도 이내)
  const KOREA_THRESHOLD = 5;
  const isFromKorea = fromKoreaDistance < KOREA_THRESHOLD;
  const isToKorea = toKoreaDistance < KOREA_THRESHOLD;

  if (isFromKorea && !isToKorea) return 'export';
  if (!isFromKorea && isToKorea) return 'import';
  return 'transit';
}

// 날짜 포맷
function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// 숫자 포맷
function formatNumber(num: string | number | undefined): string {
  if (!num) return '-';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  return n.toLocaleString('ko-KR');
}

// ============================================================
// Phase 2 & 3: 선적정보 팝업 컴포넌트 (B/L 라우팅 + 포커스 아웃)
// ============================================================
function ShipmentPopup({
  route,
  onClose,
  onBlClick,
  onMouseEnter,
  onMouseLeave,
}: {
  route: ShipmentRoute;
  onClose: () => void;
  onBlClick: (blNo: string, blType: 'mbl' | 'hbl', transportType: 'sea' | 'air' | 'truck', blId?: number) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'sea': return '해상운송';
      case 'air': return '항공운송';
      case 'truck': return '내륙운송';
      default: return type;
    }
  };

  const getBlLabel = (type: 'sea' | 'air' | 'truck', blType: 'mbl' | 'hbl') => {
    if (type === 'air') {
      return blType === 'mbl' ? 'MAWB No.' : 'HAWB No.';
    }
    return blType === 'mbl' ? 'MBL No.' : 'HBL No.';
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      'BOOKED': { label: '예약', color: 'bg-blue-500' },
      'DEPARTED': { label: '출발', color: 'bg-orange-500' },
      'SHIPPED': { label: '운송중', color: 'bg-teal-500' },
      'IN_TRANSIT': { label: '운송중', color: 'bg-teal-500' },
      'ARRIVED': { label: '도착', color: 'bg-green-500' },
    };
    const s = statusMap[status] || { label: status, color: 'bg-gray-500' };
    return <span className={`px-2 py-0.5 rounded text-xs text-white ${s.color}`}>{s.label}</span>;
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-[624px] max-h-[85vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-gradient-to-r from-[#1A2744] to-[#243B67] text-white p-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{route.shipmentNo}</span>
                {getStatusBadge(route.status)}
              </div>
              <div className="text-sm text-white/70 mt-1">{getTypeLabel(route.type)}</div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="p-4 space-y-4">
          {/* 경로 정보 */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">출발지</div>
                <div className="font-bold text-gray-800">{route.from.name}</div>
                <div className="text-xs text-gray-500">{route.from.code}</div>
              </div>
              <div className="flex-1 mx-4">
                <div className="relative">
                  <div className="h-1 bg-gray-200 rounded-full">
                    <div
                      className="h-1 rounded-full transition-all duration-300"
                      style={{ width: `${route.progress}%`, backgroundColor: route.color }}
                    />
                  </div>
                  <div className="text-center text-xs text-gray-500 mt-1">{route.progress}%</div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">도착지</div>
                <div className="font-bold text-gray-800">{route.to.name}</div>
                <div className="text-xs text-gray-500">{route.to.code}</div>
              </div>
            </div>
          </div>

          {/* B/L 정보 - Phase 2: 타입별 라우팅 */}
          {(route.cargo.blNo || route.cargo.hblNo || route.cargo.mblNo || route.shipmentNo) && (
            <div className="border rounded-xl p-4">
              <div className="text-sm font-semibold text-gray-700 mb-3">
                {route.type === 'air' ? 'AWB Information' : 'B/L Information'}
              </div>
              <div className="space-y-2">
                {route.cargo.mblNo && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{getBlLabel(route.type, 'mbl')}</span>
                    <button
                      onClick={() => onBlClick(route.cargo.mblNo!, 'mbl', route.type, route.cargo.mblId)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {route.cargo.mblNo}
                    </button>
                  </div>
                )}
                {route.cargo.hblNo && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{getBlLabel(route.type, 'hbl')}</span>
                    <button
                      onClick={() => onBlClick(route.cargo.hblNo!, 'hbl', route.type, route.cargo.hblId)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {route.cargo.hblNo}
                    </button>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Shipment No.</span>
                  <button
                    onClick={() => onBlClick(route.shipmentNo, 'mbl', route.type)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {route.shipmentNo}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-xl p-4">
              <div className="text-sm font-semibold text-gray-700 mb-3">일정 정보</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">ETD</span>
                  <span className="font-medium">{formatDate(route.cargo.etd)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ETA</span>
                  <span className="font-medium">{formatDate(route.cargo.eta)}</span>
                </div>
                {route.cargo.atd && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">ATD</span>
                    <span className="font-medium text-green-600">{formatDate(route.cargo.atd)}</span>
                  </div>
                )}
                {route.cargo.ata && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">ATA</span>
                    <span className="font-medium text-green-600">{formatDate(route.cargo.ata)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border rounded-xl p-4">
              <div className="text-sm font-semibold text-gray-700 mb-3">화물 정보</div>
              <div className="space-y-2 text-sm">
                {route.cargo.packages && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">수량</span>
                    <span className="font-medium">{formatNumber(route.cargo.packages)} {route.cargo.packageType || 'PKG'}</span>
                  </div>
                )}
                {route.cargo.grossWeight && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">중량</span>
                    <span className="font-medium">{formatNumber(route.cargo.grossWeight)} kg</span>
                  </div>
                )}
                {route.cargo.volume && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">체적</span>
                    <span className="font-medium">{formatNumber(route.cargo.volume)} CBM</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 거래 정보 */}
          <div className="border rounded-xl p-4">
            <div className="text-sm font-semibold text-gray-700 mb-3">거래 정보</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {route.cargo.customer && (
                <div className="flex justify-between">
                  <span className="text-gray-500">고객사</span>
                  <span className="font-medium">{route.cargo.customer}</span>
                </div>
              )}
              {route.cargo.carrier && (
                <div className="flex justify-between">
                  <span className="text-gray-500">운송사</span>
                  <span className="font-medium">{route.cargo.carrier}</span>
                </div>
              )}
              {route.cargo.vessel && (
                <div className="flex justify-between">
                  <span className="text-gray-500">선박/항공편</span>
                  <span className="font-medium">{route.cargo.vessel}</span>
                </div>
              )}
              {route.cargo.incoterms && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Incoterms</span>
                  <span className="font-medium">{route.cargo.incoterms}</span>
                </div>
              )}
              {route.cargo.value && (
                <div className="flex justify-between">
                  <span className="text-gray-500">신고가액</span>
                  <span className="font-medium">{route.cargo.currency} {formatNumber(route.cargo.value)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-gray-50 p-4 rounded-b-2xl border-t">
          <button
            onClick={() => onBlClick(route.shipmentNo, 'mbl', route.type)}
            className="w-full py-2.5 bg-[#1A2744] hover:bg-[#243B67] text-white rounded-lg font-medium transition-colors"
          >
            상세 조회
          </button>
        </div>
      </div>
    </div>
  );
}

// Leaflet 지도 컴포넌트
function LeafletMap({ viewMode = 'compact', compactHeight }: { viewMode?: 'compact' | 'full'; compactHeight?: number }) {
  const mapHeight = compactHeight || 540;
  const router = useRouter();
  const [routes, setRoutes] = useState<ShipmentRoute[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [stats, setStats] = useState<TrackingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [selectedRoute, setSelectedRoute] = useState<ShipmentRoute | null>(null);
  const [hoveredRoute, setHoveredRoute] = useState<ShipmentRoute | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [L, setL] = useState<typeof import('leaflet') | null>(null);

  // Phase 3: 포커스 아웃 타이머 참조
  const closePopupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsClient(true);
    import('leaflet').then((leaflet) => setL(leaflet));
  }, []);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (closePopupTimeoutRef.current) {
        clearTimeout(closePopupTimeoutRef.current);
      }
    };
  }, []);

  // 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/shipments/tracking');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setRoutes(data.routes || []);
        setPorts(data.ports || []);
        setStats(data.stats || null);
        setLoading(false);
      } catch (err) {
        setError('데이터를 불러오는데 실패했습니다.');
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 애니메이션 (한 주기 약 50초 - 확실히 느린 속도)
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationProgress((prev) => (prev + 0.2) % 100);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // ============================================================
  // Phase 2: B/L 클릭 핸들러 - 운송 유형별 상세 화면 이동
  // ============================================================
  const handleBlClick = useCallback((
    blNo: string,
    blType: 'mbl' | 'hbl',
    transportType: 'sea' | 'air' | 'truck',
    blId?: number
  ) => {
    setSelectedRoute(null);
    // ID 추출 (shipment-14 -> 14, sn-5 -> 5)
    const extractedId = blId || blNo.replace('shipment-', '').replace('sn-', '').replace(/\D/g, '');
    // 운송 유형별 라우팅
    if (transportType === 'air') {
      // 항공 AWB 상세 화면
      router.push(`/logis/import-bl/air/${extractedId}`);
    } else {
      // 해상 B/L 상세 화면 (sea, truck 포함)
      router.push(`/logis/import-bl/sea/${extractedId}`);
    }
  }, [router]);

  // ============================================================
  // Phase 3: 팝업 포커스 아웃 핸들러 (개선된 버전)
  // - 팝업이 열리면 자동 종료 타이머 시작
  // - 팝업에 마우스가 올라가면 타이머 취소
  // - 팝업에서 마우스가 나가면 타이머 다시 시작
  // ============================================================
  const handlePopupMouseEnter = useCallback(() => {
    if (closePopupTimeoutRef.current) {
      clearTimeout(closePopupTimeoutRef.current);
      closePopupTimeoutRef.current = null;
    }
  }, []);

  const handlePopupMouseLeave = useCallback(() => {
    if (closePopupTimeoutRef.current) {
      clearTimeout(closePopupTimeoutRef.current);
    }
    closePopupTimeoutRef.current = setTimeout(() => {
      setSelectedRoute(null);
    }, 500);
  }, []);

  // 팝업이 열리면 자동 종료 타이머 시작
  useEffect(() => {
    if (selectedRoute) {
      // 팝업 열릴 때 3초 후 자동 종료 타이머 시작
      closePopupTimeoutRef.current = setTimeout(() => {
        setSelectedRoute(null);
      }, 3000);
    }
    return () => {
      if (closePopupTimeoutRef.current) {
        clearTimeout(closePopupTimeoutRef.current);
        closePopupTimeoutRef.current = null;
      }
    };
  }, [selectedRoute]);

  // ============================================================
  // 선박 아이콘 (해상운송) - 기존 스타일 유지 (회전 없음)
  // ============================================================
  const createShipIcon = useCallback((color: string, size: number, isHovered: boolean = false) => {
    if (!L) return undefined;
    const actualSize = isHovered ? size * 1.3 : size;
    const glow = isHovered ? '20px' : '10px';

    return L.divIcon({
      html: `<div style="
        width: ${actualSize}px; height: ${actualSize}px;
        background: ${color}; border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 ${glow} ${color}, 0 0 20px ${color}80;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; transition: all 0.2s;
      ">
        <svg width="${actualSize * 0.6}" height="${actualSize * 0.6}" viewBox="0 0 24 24" fill="white">
          <path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42c-.26.08-.48.26-.6.5s-.15.52-.05.78L3.95 19zM6 6h12v3.97L12 8 6 9.97V6z"/>
        </svg>
      </div>`,
      className: 'custom-marker',
      iconSize: [actualSize, actualSize],
      iconAnchor: [actualSize / 2, actualSize / 2],
    });
  }, [L]);

  // ============================================================
  // 비행기 아이콘 (항공운송) - 대한민국 기준 수출/수입 방향
  // isExport: true = 수출(한국→해외, 오른쪽), false = 수입(해외→한국, 왼쪽)
  // SVG 기본: 위쪽 방향 → 90deg = 오른쪽, -90deg = 왼쪽
  // ============================================================
  const createAirplaneIcon = useCallback((color: string, size: number, isHovered: boolean = false, isExport: boolean = true) => {
    if (!L) return undefined;
    const actualSize = isHovered ? size * 1.3 : size;
    const glow = isHovered ? '20px' : '10px';
    // 수출: 오른쪽(90도), 수입: 왼쪽(-90도)
    const rotation = isExport ? 90 : -90;

    return L.divIcon({
      html: `<div style="
        width: ${actualSize}px; height: ${actualSize}px;
        background: ${color}; border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 ${glow} ${color}, 0 0 20px ${color}80;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; transition: all 0.2s;
      ">
        <svg width="${actualSize * 0.6}" height="${actualSize * 0.6}" viewBox="0 0 24 24" fill="white" style="transform: rotate(${rotation}deg);">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
        </svg>
      </div>`,
      className: 'custom-marker',
      iconSize: [actualSize, actualSize],
      iconAnchor: [actualSize / 2, actualSize / 2],
    });
  }, [L]);

  // ============================================================
  // 트럭 아이콘 (내륙운송) - 기존 스타일 유지 (회전 없음)
  // ============================================================
  const createTruckIcon = useCallback((color: string, size: number, isHovered: boolean = false) => {
    if (!L) return undefined;
    const actualSize = isHovered ? size * 1.3 : size;
    const glow = isHovered ? '20px' : '10px';

    return L.divIcon({
      html: `<div style="
        width: ${actualSize}px; height: ${actualSize}px;
        background: ${color}; border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 ${glow} ${color}, 0 0 20px ${color}80;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; transition: all 0.2s;
      ">
        <svg width="${actualSize * 0.6}" height="${actualSize * 0.6}" viewBox="0 0 24 24" fill="white">
          <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </svg>
      </div>`,
      className: 'custom-marker',
      iconSize: [actualSize, actualSize],
      iconAnchor: [actualSize / 2, actualSize / 2],
    });
  }, [L]);

  // 항구 마커 아이콘
  const createPortIcon = useCallback((color: string, size: number) => {
    if (!L) return undefined;
    return L.divIcon({
      html: `<div style="
        width: ${size}px; height: ${size}px;
        background: ${color}; border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 8px ${color}, 0 2px 4px rgba(0,0,0,0.3);
      "></div>`,
      className: 'custom-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }, [L]);

  // ============================================================
  // 운송 유형별 아이콘 선택
  // 항공만 대한민국 기준 수출/수입 방향 적용
  // ============================================================
  const getTransportIcon = useCallback((
    route: ShipmentRoute,
    isHovered: boolean = false,
    isExport: boolean = true  // 항공 전용: 수출/수입 방향
  ) => {
    const size = 28;
    switch (route.type) {
      case 'air':
        return createAirplaneIcon(route.color, size, isHovered, isExport);
      case 'truck':
        return createTruckIcon(route.color, size, isHovered);
      case 'sea':
      default:
        return createShipIcon(route.color, size, isHovered);
    }
  }, [createShipIcon, createAirplaneIcon, createTruckIcon]);

  if (!isClient || !L) return <MapLoading />;
  if (loading) return <MapLoading />;
  if (error) {
    return (
      <div className="w-full h-[540px] rounded-2xl overflow-hidden bg-[#e5e7eb] flex items-center justify-center">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  const config = VIEW_CONFIGS[viewMode];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden" style={{ height: `${mapHeight}px` }}>
      <MapContainer
        key={`world-map-${viewMode}-v5`}
        center={config.center as LatLngExpression}
        zoom={config.zoom}
        minZoom={viewMode === 'compact' ? 1.3 : 1.8}
        maxZoom={8}
        maxBounds={config.maxBounds as [[number, number], [number, number]]}
        maxBoundsViscosity={0.9}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={true}
        dragging={true}
        worldCopyJump={true}
      >
        {/* Google Maps 스타일 타일 */}
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=r&hl=ko&x={x}&y={y}&z={z}"
          maxZoom={20}
          noWrap={false}
        />

        {/* 뷰 모드에 따른 지도 설정 적용 */}
        <SetMapView mode={viewMode} />

        {/* 지도 초기화 버튼 */}
        <MapResetControl mode={viewMode} onReset={() => {
          setAnimationProgress(0);
          setSelectedRoute(null);
          setHoveredRoute(null);
        }} />

        {/* ============================================================ */}
        {/* 경로 렌더링 순서: 해상 → 트럭 → 항공 (항공이 맨 위에 표시) */}
        {/* ============================================================ */}

        {/* 1단계: 해상 경로 배경선 (가장 먼저 렌더링 - 아래층) */}
        {routes.filter(r => r.type === 'sea').map((route) => {
          const path = createOptimalRoutePath(
            [route.from.lat, route.from.lng],
            [route.to.lat, route.to.lng],
            route.type
          );
          const segments = splitPathAtDateLine(path);
          return segments.map((segment, idx) => (
            <Polyline
              key={`${route.id}-bg-${idx}`}
              positions={segment as LatLngExpression[]}
              pathOptions={{
                color: route.color,
                weight: 2,
                opacity: 0.25,
                dashArray: '12, 8'  // 해상: 긴 점선
              }}
            />
          ));
        })}

        {/* 2단계: 해상 경로 진행선 */}
        {routes.filter(r => r.type === 'sea').map((route) => {
          const path = createOptimalRoutePath(
            [route.from.lat, route.from.lng],
            [route.to.lat, route.to.lng],
            route.type
          );
          const progressPath = path.slice(0, Math.floor((route.progress / 100) * path.length) + 1);
          const segments = splitPathAtDateLine(progressPath);
          return segments.map((segment, idx) => (
            <Polyline
              key={`${route.id}-progress-${idx}`}
              positions={segment as LatLngExpression[]}
              pathOptions={{
                color: route.color,
                weight: 3,
                opacity: 0.7
              }}
            />
          ));
        })}

        {/* 3단계: 트럭 경로 배경선 */}
        {routes.filter(r => r.type === 'truck').map((route) => {
          const path = createOptimalRoutePath(
            [route.from.lat, route.from.lng],
            [route.to.lat, route.to.lng],
            route.type
          );
          const segments = splitPathAtDateLine(path);
          return segments.map((segment, idx) => (
            <Polyline
              key={`${route.id}-bg-${idx}`}
              positions={segment as LatLngExpression[]}
              pathOptions={{
                color: route.color,
                weight: 2,
                opacity: 0.3,
                dashArray: '4, 4'  // 트럭: 짧은 점선
              }}
            />
          ));
        })}

        {/* 4단계: 트럭 경로 진행선 */}
        {routes.filter(r => r.type === 'truck').map((route) => {
          const path = createOptimalRoutePath(
            [route.from.lat, route.from.lng],
            [route.to.lat, route.to.lng],
            route.type
          );
          const progressPath = path.slice(0, Math.floor((route.progress / 100) * path.length) + 1);
          const segments = splitPathAtDateLine(progressPath);
          return segments.map((segment, idx) => (
            <Polyline
              key={`${route.id}-progress-${idx}`}
              positions={segment as LatLngExpression[]}
              pathOptions={{
                color: route.color,
                weight: 3,
                opacity: 0.8
              }}
            />
          ));
        })}

        {/* 5단계: 항공 경로 배경선 (마지막 렌더링 - 맨 위층) */}
        {routes.filter(r => r.type === 'air').map((route) => {
          const path = createOptimalRoutePath(
            [route.from.lat, route.from.lng],
            [route.to.lat, route.to.lng],
            route.type
          );
          const segments = splitPathAtDateLine(path);
          return segments.map((segment, idx) => (
            <Polyline
              key={`${route.id}-bg-${idx}`}
              positions={segment as LatLngExpression[]}
              pathOptions={{
                color: route.color,
                weight: 3,  // 항공: 더 두꺼운 선
                opacity: 0.35,
                dashArray: '6, 4'  // 항공: 중간 점선
              }}
            />
          ));
        })}

        {/* 6단계: 항공 경로 진행선 */}
        {routes.filter(r => r.type === 'air').map((route) => {
          const path = createOptimalRoutePath(
            [route.from.lat, route.from.lng],
            [route.to.lat, route.to.lng],
            route.type
          );
          const progressPath = path.slice(0, Math.floor((route.progress / 100) * path.length) + 1);
          const segments = splitPathAtDateLine(progressPath);
          return segments.map((segment, idx) => (
            <Polyline
              key={`${route.id}-progress-${idx}`}
              positions={segment as LatLngExpression[]}
              pathOptions={{
                color: route.color,
                weight: 4,  // 항공: 더 두꺼운 진행선
                opacity: 0.9
              }}
            />
          ));
        })}

        {/* ============================================================ */}
        {/* 운송 마커 (선박/비행기/트럭) - Phase 3: 포커스 아웃 처리 */}
        {/* 항공: 대한민국 기준 수출/수입 방향으로 비행기 회전 */}
        {/* ============================================================ */}
        {routes.map((route, routeIndex) => {
          // 경로 유효성 검사
          if (!route?.from?.lat || !route?.to?.lat) {
            return null;
          }

          const path = createOptimalRoutePath(
            [route.from.lat, route.from.lng],
            [route.to.lat, route.to.lng],
            route.type
          );

          // 경로가 비어있으면 스킵
          if (!path || path.length === 0) {
            return null;
          }

          // 태평양 횡단 경로 조정 - 폴리라인과 동일한 좌표계 사용
          const adjustedPath = adjustPathForPacificCrossing(path);

          // 조정된 경로가 비어있으면 원본 경로 사용
          const finalPath = (adjustedPath && adjustedPath.length > 0) ? adjustedPath : path;

          const speed = getAnimationSpeed(route.type);
          // 각 route별로 고유한 오프셋 적용 (겹침 방지)
          const routeOffset = (routeIndex * 20) % 100;
          // 원형 애니메이션: 0→100→0 (삼각파 함수로 왕복)
          // 이렇게 하면 100%에서 0%로 갑자기 점프하지 않고 자연스럽게 돌아옴
          const rawProgress = (animationProgress * speed + routeOffset) % 200;
          const animatedProgress = rawProgress <= 100 ? rawProgress : 200 - rawProgress;

          // ============================================================
          // 항공기 방향 결정 (대한민국 기준 수출/수입)
          // - 수출: 한국 → 해외 (오른쪽 방향)
          // - 수입: 해외 → 한국 (왼쪽 방향)
          // 왕복 애니메이션: 돌아올 때 방향 반전
          // ============================================================
          const tradeDirection = determineTradeDirection(route.from, route.to);
          const isExport = tradeDirection === 'export';

          // 돌아오는 구간 판단 (rawProgress > 100이면 돌아오는 중)
          const isReturning = rawProgress > 100;
          // 돌아올 때는 방향 반전 (수출→수입 방향, 수입→수출 방향)
          const finalDirection = isReturning ? !isExport : isExport;

          // 조정된 경로에서 위치 계산 - 마커가 폴리라인 위에 정확히 표시됨
          const position = getPositionOnPath(finalPath, animatedProgress);
          const isHovered = hoveredRoute?.id === route.id || selectedRoute?.id === route.id;

          return (
            <Marker
              key={`${route.id}-vehicle`}
              position={position as LatLngExpression}
              icon={getTransportIcon(route, isHovered, finalDirection)}
              eventHandlers={{
                click: () => {
                  setSelectedRoute(route);
                },
                mouseover: () => {
                  setHoveredRoute(route);
                },
                mouseout: () => {
                  setHoveredRoute(null);
                },
              }}
            >
              <Tooltip direction="top" offset={[0, -15]} className="custom-tooltip" permanent={false} sticky={false}>
                <div className="p-3 bg-white rounded-xl shadow-lg min-w-[300px]">
                  {/* 헤더 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-gray-800 text-base">{route.shipmentNo}</div>
                    <div className="flex items-center gap-1.5">
                      {/* 수출/수입 방향 표시 */}
                      {route.type === 'air' && (() => {
                        const direction = determineTradeDirection(route.from, route.to);
                        const dirConfig = {
                          export: { label: '수출', color: 'bg-blue-500', icon: '✈️↗' },
                          import: { label: '수입', color: 'bg-green-500', icon: '✈️↙' },
                          transit: { label: '환적', color: 'bg-purple-500', icon: '✈️↔' }
                        };
                        const config = dirConfig[direction];
                        return (
                          <span className={`px-1.5 py-0.5 rounded text-white text-[10px] font-medium ${config.color}`}>
                            {config.icon} {config.label}
                          </span>
                        );
                      })()}
                      <span className="px-2 py-0.5 rounded text-white text-xs" style={{ backgroundColor: route.color }}>
                        {route.type === 'air' ? '항공' : route.type === 'truck' ? '내륙' : '해상'}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">{route.from.name} → {route.to.name}</div>

                  {/* B/L 정보 */}
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="text-xs font-semibold text-gray-600 mb-1">
                      {route.type === 'air' ? 'AWB Information' : 'B/L Information'}
                    </div>
                    <div className="text-sm flex justify-between">
                      <span className="text-gray-400">{route.type === 'air' ? 'MAWB No.' : 'MBL No.'}</span>
                      <span className="font-medium text-blue-600">{route.cargo.mblNo || 'HDMU' + route.id.replace(/\D/g, '').padStart(7, '0')}</span>
                    </div>
                    <div className="text-sm flex justify-between">
                      <span className="text-gray-400">{route.type === 'air' ? 'HAWB No.' : 'HBL No.'}</span>
                      <span className="font-medium text-blue-600">{route.cargo.hblNo || 'SHBL' + route.id.replace(/\D/g, '').padStart(7, '0')}</span>
                    </div>
                  </div>

                  {/* 화주 정보 */}
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="text-xs font-semibold text-gray-600 mb-1">Shipper Info</div>
                    <div className="text-sm flex justify-between">
                      <span className="text-gray-400">화주</span>
                      <span className="font-medium text-gray-700">{route.cargo.customer || '삼성전자'}</span>
                    </div>
                    <div className="text-sm flex justify-between">
                      <span className="text-gray-400">운송사</span>
                      <span className="font-medium text-gray-700">{route.cargo.carrier || 'HMM'}</span>
                    </div>
                  </div>

                  {/* 물품 정보 */}
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="text-xs font-semibold text-gray-600 mb-1">Cargo Info</div>
                    <div className="grid grid-cols-2 gap-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">수량</span>
                        <span className="font-medium">{route.cargo.packages || 100} {route.cargo.packageType || 'PKG'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">중량</span>
                        <span className="font-medium">{formatNumber(route.cargo.grossWeight) || '5,000'} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">체적</span>
                        <span className="font-medium">{formatNumber(route.cargo.volume) || '25'} CBM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">진행률</span>
                        <span className="font-medium text-green-600">{route.progress}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {/* 항구 마커 */}
        {ports.map((port) => {
          const activeCount = routes.filter(r => r.from.code === port.code || r.to.code === port.code).length;
          const isActive = activeCount > 0;
          return (
            <Marker
              key={port.code}
              position={[port.lat, port.lng] as LatLngExpression}
              icon={createPortIcon(isActive ? '#E8A838' : '#64748b', isActive ? 12 : 8)}
            >
              <Tooltip direction="top" offset={[0, -8]} permanent={false} sticky={false}>
                <div className="p-2 bg-white rounded-lg min-w-[120px]">
                  <div className="font-bold text-gray-800">{port.name}</div>
                  <div className="text-xs text-gray-500">{port.code} | {port.country}</div>
                  {isActive && (
                    <div className="text-xs mt-1 text-[#E8A838] font-medium">{activeCount} Active</div>
                  )}
                </div>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>

      {/* 범례 - 운송 유형 + 항공 방향 */}
      <div className="absolute bottom-3 left-3 flex flex-col gap-2 z-[1000]">
        {/* 운송 유형 범례 */}
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg backdrop-blur-md" style={{ background: 'rgba(0,0,0,0.7)' }}>
            <svg className="w-4 h-4 text-[#E8A838]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2z"/>
            </svg>
            <span className="text-[11px] text-white/90 font-medium">해상</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg backdrop-blur-md" style={{ background: 'rgba(0,0,0,0.7)' }}>
            <svg className="w-4 h-4 text-[#F97316]" viewBox="0 0 24 24" fill="currentColor" style={{ transform: 'rotate(45deg)' }}>
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
            </svg>
            <span className="text-[11px] text-white/90 font-medium">항공</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg backdrop-blur-md" style={{ background: 'rgba(0,0,0,0.7)' }}>
            <svg className="w-4 h-4 text-[#22C55E]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z"/>
            </svg>
            <span className="text-[11px] text-white/90 font-medium">내륙</span>
          </div>
        </div>
        {/* 항공 방향 범례 */}
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg backdrop-blur-md" style={{ background: 'rgba(0,0,0,0.7)' }}>
            <span className="text-[11px]">✈️</span>
            <svg className="w-3 h-3 text-blue-400" viewBox="0 0 24 24" fill="currentColor" style={{ transform: 'rotate(45deg)' }}>
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
            </svg>
            <span className="text-[10px] text-blue-400 font-medium">수출 (KR→)</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg backdrop-blur-md" style={{ background: 'rgba(0,0,0,0.7)' }}>
            <span className="text-[11px]">✈️</span>
            <svg className="w-3 h-3 text-green-400" viewBox="0 0 24 24" fill="currentColor" style={{ transform: 'rotate(-135deg)' }}>
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
            </svg>
            <span className="text-[10px] text-green-400 font-medium">수입 (→KR)</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg backdrop-blur-md" style={{ background: 'rgba(0,0,0,0.7)' }}>
            <span className="text-[11px]">🇰🇷</span>
            <span className="text-[10px] text-white/70 font-medium">대한민국 기준</span>
          </div>
        </div>
      </div>

      {/* 통계 */}
      <div className="absolute top-3 right-3 flex gap-2 z-[1000]">
        <div className="px-3 py-2 rounded-lg backdrop-blur-md" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="text-[10px] text-white/60 uppercase">Total</div>
          <div className="text-xl font-bold text-[#E8A838]">{stats?.totalShipments || 0}</div>
        </div>
        <div className="px-3 py-2 rounded-lg backdrop-blur-md" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="text-[10px] text-white/60 uppercase">In Transit</div>
          <div className="text-xl font-bold text-[#14D4CE]">{stats?.inTransit || 0}</div>
        </div>
        <div className="px-3 py-2 rounded-lg backdrop-blur-md" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="text-[10px] text-white/60 uppercase">Ports</div>
          <div className="text-xl font-bold text-white">{stats?.activePorts || 0}</div>
        </div>
      </div>

      {/* 실시간 표시 - 초기화 버튼 아래 */}
      <div className="absolute top-14 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg backdrop-blur-md z-[1000]" style={{ background: 'rgba(0,0,0,0.7)' }}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span className="text-[11px] text-white/90 font-medium">Live Tracking</span>
      </div>

      {/* 데이터 없음 */}
      {routes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-[500] pointer-events-none">
          <div className="px-4 py-2 rounded-lg backdrop-blur-md text-white/60 text-sm" style={{ background: 'rgba(0,0,0,0.5)' }}>
            표시할 선적 데이터가 없습니다
          </div>
        </div>
      )}

      {/* 선적정보 팝업 - Phase 2 & 3 */}
      {selectedRoute && (
        <ShipmentPopup
          route={selectedRoute}
          onClose={() => setSelectedRoute(null)}
          onBlClick={handleBlClick}
          onMouseEnter={handlePopupMouseEnter}
          onMouseLeave={handlePopupMouseLeave}
        />
      )}
    </div>
  );
}

interface WorldMapGlobeProps {
  viewMode?: 'compact' | 'full';
  compactHeight?: number;
}

export default function WorldMapGlobe({ viewMode = 'compact', compactHeight }: WorldMapGlobeProps) {
  return <LeafletMap viewMode={viewMode} compactHeight={compactHeight} />;
}
