# Dashboard 지도 기능 개선 설계서

## 1. 개요

### 1.1 요구사항
1. **항공/해상 최적 경로 표시**: 운송 유형별 실제 이동 경로에 가까운 최적 경로 알고리즘 적용
2. **B/L No 클릭 시 상세 화면 이동**: 항공은 항공 AWB 상세, 해상은 해상 B/L 상세 화면으로 라우팅
3. **포커스 아웃 시 팝업 종료**: 마커 아이콘에서 포커스가 벗어나면 Tooltip/팝업 자동 종료

### 1.2 현재 상태 분석
| 항목 | 현재 구현 | 개선 필요 |
|------|---------|----------|
| 경로 표시 | 단순 곡선 (curvature 고정) | 운송 유형별 최적 경로 알고리즘 |
| B/L 클릭 | `/logis/shipment/${id}`로 통일 | 타입별 분기 라우팅 필요 |
| 팝업 종료 | 클릭으로만 종료 | 포커스 아웃 시 자동 종료 |

---

## 2. 설계 상세

### 2.1 항공/해상 최적 경로 알고리즘

#### 2.1.1 해상 운송 경로 (Great Circle Route)
실제 선박은 **대권 항로(Great Circle Route)**를 따라 이동합니다. 지구가 구형이므로 두 점 사이의 최단 거리는 대권을 따르는 경로입니다.

```typescript
/**
 * 대권 항로 (Great Circle Route) 계산
 * - 지구 구면상의 최단 경로
 * - 실제 선박 항로에 가장 근접
 */
function createGreatCirclePath(
  from: [number, number],  // [lat, lng]
  to: [number, number],
  numPoints: number = 50
): [number, number][] {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const lat1 = toRad(from[0]);
  const lng1 = toRad(from[1]);
  const lat2 = toRad(to[0]);
  const lng2 = toRad(to[1]);

  const points: [number, number][] = [];

  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints;

    // Spherical linear interpolation (SLERP)
    const d = Math.acos(
      Math.sin(lat1) * Math.sin(lat2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1)
    );

    if (d === 0) {
      points.push(from);
      continue;
    }

    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);

    const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
    const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);

    const lat = toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)));
    const lng = toDeg(Math.atan2(y, x));

    points.push([lat, lng]);
  }

  return points;
}
```

#### 2.1.2 항공 운송 경로 (Geodesic with Altitude Arc)
항공기는 대권 항로를 따르되, 고도를 표현하기 위해 **위로 볼록한 호(Arc)**를 그립니다.

```typescript
/**
 * 항공 경로 (Geodesic + Altitude Arc)
 * - 대권 항로 기반
 * - 비행 고도를 시각적으로 표현하는 위로 볼록한 곡선
 */
function createAirRoutePath(
  from: [number, number],
  to: [number, number],
  numPoints: number = 50,
  altitudeFactor: number = 0.15  // 경로 길이 대비 최대 고도 비율
): [number, number][] {
  // 기본 대권 경로 계산
  const greatCircle = createGreatCirclePath(from, to, numPoints);

  // 거리 계산 (위도 차이 기준)
  const distance = Math.sqrt(
    Math.pow(to[0] - from[0], 2) +
    Math.pow(to[1] - from[1], 2)
  );

  // 고도 곡선 적용 (포물선)
  return greatCircle.map((point, i) => {
    const t = i / numPoints;
    // 포물선 함수: 4t(1-t)는 t=0.5에서 최대값 1
    const altitude = 4 * t * (1 - t) * distance * altitudeFactor;
    return [point[0] + altitude, point[1]];
  });
}
```

#### 2.1.3 내륙 운송 경로 (Direct Line)
트럭 운송은 도로를 따르므로 **직선에 가까운 경로**로 표시합니다.

```typescript
/**
 * 내륙 운송 경로 (Direct Line with minor curve)
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

    // 약간의 곡선 (도로 표현)
    const curve = Math.sin(t * Math.PI) * 0.5;
    points.push([lat + curve, lng]);
  }

  return points;
}
```

#### 2.1.4 통합 경로 생성 함수

```typescript
/**
 * 운송 유형별 최적 경로 생성
 */
function createOptimalRoutePath(
  from: [number, number],
  to: [number, number],
  transportType: 'sea' | 'air' | 'truck',
  numPoints: number = 50
): [number, number][] {
  switch (transportType) {
    case 'air':
      return createAirRoutePath(from, to, numPoints, 0.12);
    case 'truck':
      return createTruckRoutePath(from, to, 20);
    case 'sea':
    default:
      return createGreatCirclePath(from, to, numPoints);
  }
}
```

---

### 2.2 B/L No 클릭 시 라우팅 설계

#### 2.2.1 라우팅 로직

```typescript
/**
 * B/L 클릭 핸들러 - 운송 유형별 상세 화면 이동
 */
const handleBlClick = useCallback((
  blNo: string,
  blType: 'mbl' | 'hbl',
  transportType: 'sea' | 'air',
  blId: string | number
) => {
  setSelectedRoute(null);

  // 운송 유형별 라우팅
  if (transportType === 'air') {
    // 항공 AWB 상세 화면
    router.push(`/logis/import-bl/air/${blId}`);
  } else {
    // 해상 B/L 상세 화면
    router.push(`/logis/import-bl/sea/${blId}`);
  }
}, [router]);
```

#### 2.2.2 팝업 컴포넌트 수정

```typescript
// ShipmentPopup 내 B/L 정보 섹션
{route.cargo.mblNo && (
  <div className="flex justify-between items-center">
    <span className="text-sm text-gray-500">
      {route.type === 'air' ? 'MAWB No.' : 'MBL No.'}
    </span>
    <button
      onClick={() => onBlClick(
        route.cargo.mblNo!,
        'mbl',
        route.type,
        route.cargo.mblId || route.id
      )}
      className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
    >
      {route.cargo.mblNo}
    </button>
  </div>
)}

{route.cargo.hblNo && (
  <div className="flex justify-between items-center">
    <span className="text-sm text-gray-500">
      {route.type === 'air' ? 'HAWB No.' : 'HBL No.'}
    </span>
    <button
      onClick={() => onBlClick(
        route.cargo.hblNo!,
        'hbl',
        route.type,
        route.cargo.hblId || route.id
      )}
      className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
    >
      {route.cargo.hblNo}
    </button>
  </div>
)}
```

#### 2.2.3 API 응답 데이터 확장

```typescript
// tracking API에서 B/L ID 추가 반환 필요
interface CargoInfo {
  // 기존 필드...
  mblNo?: string;
  hblNo?: string;
  mblId?: number;  // 추가: MBL/MAWB ID
  hblId?: number;  // 추가: HBL/HAWB ID
}
```

---

### 2.3 포커스 아웃 시 팝업 종료 설계

#### 2.3.1 Tooltip 포커스 관리

현재 Leaflet의 `Tooltip`은 기본적으로 `permanent={false}`로 설정되어 마우스 오버 시만 표시됩니다.
아이콘에서 마우스가 벗어나면 Tooltip이 자동으로 사라집니다.

**문제점**: 클릭으로 열리는 `ShipmentPopup`은 별도 관리 필요

#### 2.3.2 마커 포커스 아웃 처리

```typescript
// 마커 컴포넌트에 onMouseLeave 이벤트 추가
<Marker
  key={`${route.id}-vehicle`}
  position={position as LatLngExpression}
  icon={getTransportIcon(route, hoveredRoute?.id === route.id)}
  eventHandlers={{
    click: () => setSelectedRoute(route),
    mouseover: () => setHoveredRoute(route),
    mouseout: () => {
      setHoveredRoute(null);
      // 포커스 아웃 시 딜레이 후 팝업 종료
      if (selectedRoute?.id === route.id) {
        closePopupTimeoutRef.current = setTimeout(() => {
          setSelectedRoute(null);
        }, 300); // 300ms 딜레이
      }
    },
  }}
>
```

#### 2.3.3 팝업 마우스 진입 시 종료 취소

```typescript
// ShipmentPopup에서 마우스 진입 시 타이머 취소
<div
  className="relative bg-white rounded-2xl shadow-2xl w-[624px]"
  onClick={(e) => e.stopPropagation()}
  onMouseEnter={() => {
    // 팝업에 마우스가 들어오면 종료 타이머 취소
    if (closePopupTimeoutRef.current) {
      clearTimeout(closePopupTimeoutRef.current);
      closePopupTimeoutRef.current = null;
    }
  }}
  onMouseLeave={() => {
    // 팝업에서 마우스가 나가면 종료
    setSelectedRoute(null);
  }}
>
```

#### 2.3.4 상태 관리 추가

```typescript
const [hoveredRoute, setHoveredRoute] = useState<ShipmentRoute | null>(null);
const closePopupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

// 컴포넌트 언마운트 시 타이머 정리
useEffect(() => {
  return () => {
    if (closePopupTimeoutRef.current) {
      clearTimeout(closePopupTimeoutRef.current);
    }
  };
}, []);
```

---

## 3. 수정 대상 파일

| 파일 | 수정 내용 |
|------|---------|
| `src/components/WorldMapGlobe.tsx` | 경로 알고리즘, B/L 라우팅, 포커스 아웃 처리 |
| `src/app/api/shipments/tracking/route.ts` | B/L ID 응답 추가 |

---

## 4. 구현 단계

### Phase 1: 경로 알고리즘 개선
1. `createGreatCirclePath` 함수 추가 (해상)
2. `createAirRoutePath` 함수 추가 (항공)
3. `createOptimalRoutePath` 통합 함수 구현
4. 기존 `createCurvedPath` 대체

### Phase 2: B/L 클릭 라우팅
1. `handleBlClick` 함수 시그니처 변경
2. `ShipmentPopup` 컴포넌트 수정
3. API에서 B/L ID 반환 추가

### Phase 3: 포커스 아웃 처리
1. `hoveredRoute` 상태 추가
2. 마커 이벤트 핸들러 확장
3. 팝업 마우스 이벤트 처리
4. 타이머 기반 딜레이 종료 구현

---

## 5. 시각적 개선 사항

### 5.1 경로 스타일 차별화

| 운송 유형 | 선 스타일 | 색상 | 설명 |
|---------|---------|-----|------|
| 해상 | 실선 + 파선 | 골드/청록 계열 | 대권 항로 |
| 항공 | 점선 | 주황/분홍 계열 | 상승 곡선 |
| 내륙 | 짧은 점선 | 녹색 계열 | 직선에 가까움 |

### 5.2 애니메이션 효과

```typescript
// 운송 유형별 애니메이션 속도 차별화
const getAnimationSpeed = (type: 'sea' | 'air' | 'truck') => {
  switch (type) {
    case 'air': return 0.8;   // 빠름
    case 'truck': return 0.3; // 느림
    case 'sea':
    default: return 0.5;      // 중간
  }
};
```

---

## 6. 테스트 시나리오

1. **경로 표시 테스트**
   - 해상 경로가 대권을 따라 곡선으로 표시되는지 확인
   - 항공 경로가 위로 볼록한 호로 표시되는지 확인
   - 장거리 경로에서 차이가 명확한지 확인

2. **B/L 클릭 테스트**
   - 해상 선적의 MBL/HBL 클릭 시 `/logis/import-bl/sea/[id]` 이동
   - 항공 선적의 MAWB/HAWB 클릭 시 `/logis/import-bl/air/[id]` 이동
   - 존재하지 않는 ID 처리

3. **포커스 아웃 테스트**
   - 마커에서 마우스 이탈 시 Tooltip 즉시 사라짐
   - 팝업에서 마우스 이탈 시 팝업 종료
   - 팝업 내부 클릭 시 종료되지 않음
   - 빠른 마우스 이동 시 깜빡임 없음

---

## 7. 예상 결과

### Before (현재)
- 모든 경로가 동일한 단순 곡선
- B/L 클릭 시 동일 화면으로 이동
- 팝업이 클릭으로만 종료

### After (개선 후)
- 운송 유형별 실제 경로에 가까운 최적 경로 표시
- 항공/해상 B/L 클릭 시 각각의 상세 화면으로 이동
- 마커/팝업에서 포커스 아웃 시 자연스러운 팝업 종료
