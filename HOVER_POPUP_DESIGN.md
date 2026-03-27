# 지도 마우스 오버 팝업 설계서

## 1. 현재 상태 분석

### 현재 구현
- **Leaflet Tooltip**: 마커 호버 시 표시되는 기본 툴팁
- **문제점**:
  - 마커에서 마우스가 나가면 즉시 사라짐
  - 팝업으로 마우스 이동 불가능
  - B/L 번호가 클릭 불가능한 텍스트

### 사용자 요구사항
1. 마우스 오버 시 팝업 표시
2. 팝업으로 마우스 진입 시 팝업 유지
3. B/L No 클릭 가능
4. 클릭 시 B/L 관리 상세 조회 화면으로 이동

---

## 2. 설계 방안

### 2.1 커스텀 호버 팝업 컴포넌트

Leaflet Tooltip 대신 **커스텀 호버 팝업**을 구현합니다.

```
┌─────────────────────────────────────────────────────────────┐
│                        WorldMapGlobe                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐                                                │
│  │  Marker │ ──── mouseover ────▶ setHoveredRoute(route)   │
│  │  (Icon) │                                                │
│  └─────────┘                                                │
│       │                                                      │
│       │ mouseout (with delay)                               │
│       ▼                                                      │
│  ┌─────────────────────────────────┐                        │
│  │     HoverPopup (커스텀)          │                        │
│  │  ┌─────────────────────────────┐│                        │
│  │  │ Shipment No: SN-001        ││                        │
│  │  │ Route: 부산 → LA            ││                        │
│  │  ├─────────────────────────────┤│                        │
│  │  │ MBL No: HDMU1234567        ││ ◀── 클릭 가능          │
│  │  │ HBL No: SHBL1234567        ││ ◀── 클릭 가능          │
│  │  └─────────────────────────────┘│                        │
│  │  onMouseEnter: 타이머 취소      │                        │
│  │  onMouseLeave: 타이머 시작      │                        │
│  └─────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 상태 관리

```typescript
// 기존 상태
const [selectedRoute, setSelectedRoute] = useState<ShipmentRoute | null>(null);
const [hoveredRoute, setHoveredRoute] = useState<ShipmentRoute | null>(null);

// 호버 팝업 위치 (마커 위치 기반)
const [hoverPopupPosition, setHoverPopupPosition] = useState<{x: number, y: number} | null>(null);

// 타이머 참조
const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
```

### 2.3 이벤트 흐름

```
[마커 mouseover]
     │
     ▼
타이머 취소 (있으면)
     │
     ▼
setHoveredRoute(route)
setHoverPopupPosition(마커 화면 좌표)
     │
     ▼
[HoverPopup 렌더링]
     │
     ├──▶ [팝업 mouseenter] ──▶ 타이머 취소 (팝업 유지)
     │
     ├──▶ [팝업 mouseleave] ──▶ 300ms 후 팝업 종료 타이머 시작
     │
     └──▶ [B/L 클릭] ──▶ handleBlClick() ──▶ 상세 화면 이동

[마커 mouseout]
     │
     ▼
300ms 후 팝업 종료 타이머 시작
(팝업에 마우스 진입하면 취소됨)
```

---

## 3. 컴포넌트 설계

### 3.1 HoverPopup 컴포넌트

```typescript
interface HoverPopupProps {
  route: ShipmentRoute;
  position: { x: number; y: number };
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onBlClick: (blNo: string, blType: 'mbl' | 'hbl', transportType: 'sea' | 'air' | 'truck', blId?: number) => void;
}

function HoverPopup({ route, position, onMouseEnter, onMouseLeave, onBlClick }: HoverPopupProps) {
  return (
    <div
      className="absolute z-[1500] bg-white rounded-xl shadow-2xl p-4 min-w-[320px]"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%) translateY(-20px)', // 마커 위에 표시
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-gray-800">{route.shipmentNo}</span>
        <span className="px-2 py-1 rounded text-white text-xs" style={{ backgroundColor: route.color }}>
          {route.type === 'air' ? '항공' : route.type === 'truck' ? '내륙' : '해상'}
        </span>
      </div>

      {/* 경로 */}
      <div className="text-sm text-gray-500 mb-3">
        {route.from.name} → {route.to.name}
      </div>

      {/* B/L 정보 - 클릭 가능 */}
      <div className="border-t pt-3 space-y-2">
        <div className="text-xs font-semibold text-gray-600">
          {route.type === 'air' ? 'AWB Information' : 'B/L Information'}
        </div>

        {/* MBL/MAWB - 클릭 가능 */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">
            {route.type === 'air' ? 'MAWB No.' : 'MBL No.'}
          </span>
          <button
            onClick={() => onBlClick(route.cargo.mblNo!, 'mbl', route.type, route.cargo.mblId)}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
          >
            {route.cargo.mblNo || 'HDMU' + route.id.replace(/\D/g, '').padStart(7, '0')}
          </button>
        </div>

        {/* HBL/HAWB - 클릭 가능 */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">
            {route.type === 'air' ? 'HAWB No.' : 'HBL No.'}
          </span>
          <button
            onClick={() => onBlClick(route.cargo.hblNo!, 'hbl', route.type, route.cargo.hblId)}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
          >
            {route.cargo.hblNo || 'SHBL' + route.id.replace(/\D/g, '').padStart(7, '0')}
          </button>
        </div>
      </div>

      {/* 화살표 (팝업 아래 삼각형) */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
        <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white"></div>
      </div>
    </div>
  );
}
```

### 3.2 마커 이벤트 핸들러

```typescript
// 마커 이벤트 핸들러
eventHandlers={{
  click: () => {
    setSelectedRoute(route);
    setHoveredRoute(null); // 호버 팝업 닫기
  },
  mouseover: (e) => {
    // 타이머 취소
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    // 마커의 화면 좌표 계산
    const point = e.target._map.latLngToContainerPoint(e.latlng);
    setHoverPopupPosition({ x: point.x, y: point.y });
    setHoveredRoute(route);
  },
  mouseout: () => {
    // 300ms 딜레이 후 팝업 종료 (팝업으로 마우스 이동 시간 확보)
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredRoute(null);
      setHoverPopupPosition(null);
    }, 300);
  },
}}
```

### 3.3 팝업 마우스 이벤트 핸들러

```typescript
// 팝업 마우스 진입 시 - 타이머 취소
const handleHoverPopupMouseEnter = useCallback(() => {
  if (hoverTimeoutRef.current) {
    clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = null;
  }
}, []);

// 팝업 마우스 이탈 시 - 타이머 시작
const handleHoverPopupMouseLeave = useCallback(() => {
  hoverTimeoutRef.current = setTimeout(() => {
    setHoveredRoute(null);
    setHoverPopupPosition(null);
  }, 300);
}, []);
```

---

## 4. 구현 계획

### Phase 1: Leaflet Tooltip 제거
- 기존 `<Tooltip>` 컴포넌트 제거
- 마커 이벤트 핸들러 수정

### Phase 2: 커스텀 HoverPopup 구현
- HoverPopup 컴포넌트 생성
- 마커 위치 기반 팝업 위치 계산
- 마우스 이벤트 핸들러 구현

### Phase 3: B/L 클릭 라우팅
- B/L 번호 클릭 이벤트 연결
- 운송 유형별 상세 화면 라우팅
  - 해상: `/logis/import-bl/sea/[id]`
  - 항공: `/logis/import-bl/air/[id]`

### Phase 4: 스타일링 및 애니메이션
- 팝업 등장/사라짐 애니메이션
- 화살표 스타일링
- 반응형 위치 조정 (화면 경계 처리)

---

## 5. 핵심 기술 포인트

### 5.1 마커-팝업 간 마우스 이동 처리
```
[마커] ──── 300ms 딜레이 ────▶ [팝업 종료]
   │                              │
   └── 팝업 mouseenter ──────────┘ (타이머 취소)
```

딜레이를 통해 마커에서 팝업으로 마우스를 이동하는 동안 팝업이 사라지지 않도록 합니다.

### 5.2 팝업 위치 계산
```typescript
// Leaflet의 latLngToContainerPoint 사용
const point = map.latLngToContainerPoint(markerLatLng);
// 팝업을 마커 위에 표시 (transform 사용)
style={{
  left: point.x,
  top: point.y,
  transform: 'translate(-50%, -100%) translateY(-20px)'
}}
```

### 5.3 B/L 클릭 라우팅
```typescript
const handleBlClick = (blNo, blType, transportType, blId) => {
  const id = blId || extractId(blNo);
  if (transportType === 'air') {
    router.push(`/logis/import-bl/air/${id}`);
  } else {
    router.push(`/logis/import-bl/sea/${id}`);
  }
};
```

---

## 6. 예상 결과

### Before (현재)
- 마커 hover → Tooltip 표시
- 마커에서 마우스 이탈 → Tooltip 즉시 사라짐
- B/L 번호 클릭 불가

### After (개선 후)
- 마커 hover → HoverPopup 표시
- 마커에서 팝업으로 마우스 이동 → 팝업 유지
- B/L 번호 클릭 → 상세 화면 이동
- 팝업 외부로 마우스 이동 → 300ms 후 팝업 종료

---

## 7. 파일 변경 목록

| 파일 | 변경 내용 |
|------|----------|
| `src/components/WorldMapGlobe.tsx` | HoverPopup 컴포넌트 추가, Tooltip 제거, 이벤트 핸들러 수정 |

---

## 8. 승인 요청

위 설계 내용을 검토 후 승인해 주시면 구현을 시작하겠습니다.

**예상 구현 항목:**
1. HoverPopup 컴포넌트 생성
2. Leaflet Tooltip 제거
3. 마커 이벤트 핸들러 수정
4. B/L 클릭 라우팅 연결
5. 스타일링 및 애니메이션

**핵심 기능:**
- 마우스 오버 시 팝업 표시
- 팝업 진입 시 팝업 유지
- B/L No 클릭 → 상세 화면 이동
