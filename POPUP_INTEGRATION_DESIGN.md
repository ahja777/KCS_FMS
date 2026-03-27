# FMS-Web Logis 메뉴 팝업 연동 설계서

## 1. 개요

### 1.1 목적
fms-web logis 메뉴 내 전체 페이지에 팝업 컴포넌트를 연동하여 일관된 사용자 경험 제공

### 1.2 현재 상태
- **완료**: 해상 부킹 등록 (`/logis/booking/sea/register`)
- **미연동**: 12개 등록 페이지

### 1.3 사용 가능한 팝업 컴포넌트 (9개)
| 컴포넌트 | 위치 | 용도 |
|---------|------|------|
| `CodeSearchModal` | `@/components/popup` | 15종 코드 검색 (거래처, 담당자, 공항, 항구, 선사, 항공사, 세관, 운임기초정보, 컨테이너종류, 통화, 특수화물, 품목, 은행계정, 국가, 지역) |
| `BLSearchModal` | `@/components/popup` | B/L 검색 (해상/항공) |
| `BookingSearchModal` | `@/components/popup` | 부킹정보 조회 (해상/항공) |
| `PostcodeModal` | `@/components/popup` | 우편번호 검색 |
| `HSCodeModal` | `@/components/popup` | HS 품목코드 검색 |
| `LocationCodeModal` | `@/components/popup` | 출발지/도착지 코드 검색 |
| `FreightCodeModal` | `@/components/popup` | 운임코드 검색 |
| `QuoteSearchModal` | `@/components/popup` | 견적의뢰 조회 |
| `TransportStatusModal` | `@/components/popup` | 운송상태 정보 조회 |

---

## 2. 페이지별 팝업 연동 설계

### 2.1 항공 부킹 등록 (`/logis/booking/air/register`)

#### 현재 상태
- 기존 모달: `ScheduleSearchModal`, `EmailModal`, `UnsavedChangesModal`
- "찾기" 버튼 미연동

#### 필요한 팝업 연동
| 필드 | 팝업 | CodeType |
|-----|------|----------|
| 화주(Shipper) 업체코드 | `CodeSearchModal` | `customer` |
| 수하인(Consignee) 업체코드 | `CodeSearchModal` | `customer` |
| 출발공항 (Origin) | `LocationCodeModal` | type=`airport` |
| 도착공항 (Destination) | `LocationCodeModal` | type=`airport` |

#### Import 추가
```typescript
import {
  CodeSearchModal,
  LocationCodeModal,
  type CodeItem,
  type LocationItem,
} from '@/components/popup';
```

---

### 2.2 해상 견적 등록 (`/logis/quote/sea/register`)

#### 현재 상태
- 기존 모달: `ScheduleSearchModal`, `FreightSearchModal`, `EmailModal`, `UnsavedChangesModal`
- "찾기" 버튼 미연동

#### 필요한 팝업 연동
| 필드 | 팝업 | CodeType |
|-----|------|----------|
| 거래처 | `CodeSearchModal` | `customer` |
| 담당자 | `CodeSearchModal` | `manager` |
| 출발지 | `LocationCodeModal` | type=`seaport` |
| TO BY 1 | `LocationCodeModal` | type=`seaport` |
| TO BY 2 | `LocationCodeModal` | type=`seaport` |
| 도착지 | `LocationCodeModal` | type=`seaport` |
| 선사 | `CodeSearchModal` | `carrier` |
| CY/CFS | `CodeSearchModal` | `customer` |
| 지역 | `CodeSearchModal` | `region` |
| 운송사 | `CodeSearchModal` | `customer` |
| 창고 | `CodeSearchModal` | `customer` |

---

### 2.3 항공 견적 등록 (`/logis/quote/air/register`)

#### 필요한 팝업 연동
| 필드 | 팝업 | CodeType |
|-----|------|----------|
| 거래처 | `CodeSearchModal` | `customer` |
| 담당자 | `CodeSearchModal` | `manager` |
| 출발지 | `LocationCodeModal` | type=`airport` |
| TO BY 1 | `LocationCodeModal` | type=`airport` |
| TO BY 2 | `LocationCodeModal` | type=`airport` |
| 도착지 | `LocationCodeModal` | type=`airport` |
| 항공사 | `CodeSearchModal` | `airline` |

---

### 2.4 해상 수입 B/L 등록 (`/logis/import-bl/sea/register`)

#### 필요한 팝업 연동
| 필드 | 팝업 | CodeType |
|-----|------|----------|
| Shipper 코드 | `CodeSearchModal` | `customer` |
| Consignee 코드 | `CodeSearchModal` | `customer` |
| Notify 코드 | `CodeSearchModal` | `customer` |
| Forwarding Agent 코드 | `CodeSearchModal` | `customer` |
| 선적항(POL) | `LocationCodeModal` | type=`seaport` |
| 양하항(POD) | `LocationCodeModal` | type=`seaport` |
| Place of Receipt | `LocationCodeModal` | type=`city` |
| Place of Delivery | `LocationCodeModal` | type=`city` |
| Final Destination | `LocationCodeModal` | type=`city` |
| 선사 | `CodeSearchModal` | `carrier` |

---

### 2.5 항공 수입 AWB 등록 (`/logis/import-bl/air/register`)

#### 필요한 팝업 연동
| 필드 | 팝업 | CodeType |
|-----|------|----------|
| Shipper 코드 | `CodeSearchModal` | `customer` |
| Consignee 코드 | `CodeSearchModal` | `customer` |
| 출발공항 | `LocationCodeModal` | type=`airport` |
| 도착공항 | `LocationCodeModal` | type=`airport` |
| 항공사 | `CodeSearchModal` | `airline` |

---

### 2.6 해상 S/R 등록 (`/logis/sr/sea/register`)

#### 현재 상태
- 팝업 전혀 없음

#### 필요한 팝업 연동
| 필드 | 팝업 | CodeType |
|-----|------|----------|
| 부킹번호 | `BookingSearchModal` | type=`sea` |
| 화주(Shipper) | `CodeSearchModal` | `customer` |
| 수하인(Consignee) | `CodeSearchModal` | `customer` |
| 선사 | `CodeSearchModal` | `carrier` |
| 선적항(POL) | `LocationCodeModal` | type=`seaport` |
| 양하항(POD) | `LocationCodeModal` | type=`seaport` |

#### 추가 필요 모달
- `ScheduleSearchModal` (스케줄 조회)
- `EmailModal` (이메일 발송)
- `UnsavedChangesModal` (저장 확인)

---

### 2.7 해상 S/N 등록 (`/logis/sn/sea/register`)

#### 필요한 팝업 연동
| 필드 | 팝업 | 비고 |
|-----|------|------|
| S/R 번호 | 커스텀 조회 | S/R 목록에서 선택 |
| 선사 | `CodeSearchModal` | `carrier` |
| 선적항/양하항 | `LocationCodeModal` | `seaport` |

---

### 2.8 적하목록 등록 (`/logis/manifest/sea/register`)

#### 필요한 팝업 연동
| 필드 | 팝업 | 비고 |
|-----|------|------|
| B/L 번호 | `BLSearchModal` | type=`sea` |
| 선사 | `CodeSearchModal` | `carrier` |
| 항구 | `LocationCodeModal` | `seaport` |
| 세관 | `CodeSearchModal` | `customs` |

---

### 2.9 통관 등록 (`/logis/customs/sea/register`)

#### 필요한 팝업 연동
| 필드 | 팝업 | 비고 |
|-----|------|------|
| B/L 번호 | `BLSearchModal` | type=`sea` |
| 세관코드 | `CodeSearchModal` | `customs` |
| 관세사 | `CodeSearchModal` | `customer` |
| HS Code | `HSCodeModal` | - |

---

### 2.10 AMS 등록 (`/logis/ams/sea/register`)

#### 필요한 팝업 연동
| 필드 | 팝업 | 비고 |
|-----|------|------|
| B/L 번호 | `BLSearchModal` | type=`sea` |
| 선사 | `CodeSearchModal` | `carrier` |
| 항구 | `LocationCodeModal` | `seaport` |

---

### 2.11 해상 스케줄 등록 (`/logis/schedule/sea/register`)

#### 필요한 팝업 연동
| 필드 | 팝업 | 비고 |
|-----|------|------|
| 선사 | `CodeSearchModal` | `carrier` |
| 출발항 | `LocationCodeModal` | `seaport` |
| 도착항 | `LocationCodeModal` | `seaport` |
| 경유항 | `LocationCodeModal` | `seaport` |

---

### 2.12 항공 스케줄 등록 (`/logis/schedule/air/register`)

#### 필요한 팝업 연동
| 필드 | 팝업 | 비고 |
|-----|------|------|
| 항공사 | `CodeSearchModal` | `airline` |
| 출발공항 | `LocationCodeModal` | `airport` |
| 도착공항 | `LocationCodeModal` | `airport` |
| 경유공항 | `LocationCodeModal` | `airport` |

---

## 3. 구현 패턴

### 3.1 Import 패턴
```typescript
import {
  CodeSearchModal,
  BLSearchModal,
  BookingSearchModal,
  PostcodeModal,
  HSCodeModal,
  LocationCodeModal,
  FreightCodeModal,
  QuoteSearchModal,
  TransportStatusModal,
  type CodeItem,
  type CodeType,
  type SeaBL,
  type AirBL,
  type SeaBooking,
  type AirBooking,
  type PostcodeItem,
  type HSCodeItem,
  type LocationItem,
  type FreightCodeItem,
  type QuoteItem,
  type TransportInfo,
} from '@/components/popup';
```

### 3.2 State 패턴
```typescript
// 팝업 상태
const [showCustomerModal, setShowCustomerModal] = useState(false);
const [showLocationModal, setShowLocationModal] = useState(false);
const [currentField, setCurrentField] = useState<string>('');
const [currentCodeType, setCurrentCodeType] = useState<CodeType>('customer');
const [currentLocationType, setCurrentLocationType] = useState<'airport' | 'seaport' | 'city'>('seaport');
```

### 3.3 Handler 패턴
```typescript
// 코드 검색 버튼 클릭
const handleCodeSearch = (field: string, codeType: CodeType) => {
  setCurrentField(field);
  setCurrentCodeType(codeType);
  setShowCustomerModal(true);
};

// 코드 선택 완료
const handleCodeSelect = (item: CodeItem) => {
  setFormData(prev => ({
    ...prev,
    [`${currentField}Code`]: item.code,
    [`${currentField}Name`]: item.name,
  }));
  setShowCustomerModal(false);
};

// 위치 검색 버튼 클릭
const handleLocationSearch = (field: string, type: 'airport' | 'seaport' | 'city') => {
  setCurrentField(field);
  setCurrentLocationType(type);
  setShowLocationModal(true);
};

// 위치 선택 완료
const handleLocationSelect = (item: LocationItem) => {
  setFormData(prev => ({
    ...prev,
    [currentField]: item.code,
    [`${currentField}Name`]: item.name,
  }));
  setShowLocationModal(false);
};
```

### 3.4 버튼 연동 패턴
```tsx
<div className="flex gap-2">
  <input
    type="text"
    value={formData.shipperName}
    placeholder="화주명"
    className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
    readOnly
  />
  <button
    onClick={() => handleCodeSearch('shipper', 'customer')}
    className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
  >
    찾기
  </button>
</div>
```

### 3.5 모달 렌더링 패턴
```tsx
{/* 코드 검색 모달 */}
<CodeSearchModal
  isOpen={showCustomerModal}
  onClose={() => setShowCustomerModal(false)}
  onSelect={handleCodeSelect}
  codeType={currentCodeType}
  title={`${getCodeTypeLabel(currentCodeType)} 검색`}
/>

{/* 위치 검색 모달 */}
<LocationCodeModal
  isOpen={showLocationModal}
  onClose={() => setShowLocationModal(false)}
  onSelect={handleLocationSelect}
  type={currentLocationType}
/>
```

---

## 4. 구현 우선순위

### Phase 1: 핵심 등록 페이지 (높은 빈도)
1. `/logis/booking/air/register` - 항공 부킹 등록
2. `/logis/quote/sea/register` - 해상 견적 등록
3. `/logis/quote/air/register` - 항공 견적 등록
4. `/logis/import-bl/sea/register` - 해상 수입 B/L 등록

### Phase 2: 보조 등록 페이지
5. `/logis/import-bl/air/register` - 항공 수입 AWB 등록
6. `/logis/sr/sea/register` - 해상 S/R 등록
7. `/logis/sn/sea/register` - 해상 S/N 등록

### Phase 3: 관리 등록 페이지
8. `/logis/manifest/sea/register` - 적하목록 등록
9. `/logis/customs/sea/register` - 통관 등록
10. `/logis/ams/sea/register` - AMS 등록
11. `/logis/schedule/sea/register` - 해상 스케줄 등록
12. `/logis/schedule/air/register` - 항공 스케줄 등록

---

## 5. 예상 작업량

| 페이지 | 팝업 연동 수 | 예상 코드 변경 |
|-------|-------------|---------------|
| 항공 부킹 등록 | 4개 | ~100줄 |
| 해상 견적 등록 | 11개 | ~200줄 |
| 항공 견적 등록 | 7개 | ~150줄 |
| 해상 수입 B/L 등록 | 10개 | ~200줄 |
| 항공 수입 AWB 등록 | 5개 | ~100줄 |
| 해상 S/R 등록 | 6개 + 3개 모달 | ~200줄 |
| 기타 6개 페이지 | 각 3-5개 | ~600줄 |

**총 예상**: ~1,550줄 추가/수정

---

## 6. 테스트 계획

1. 각 페이지별 팝업 열기/닫기 테스트
2. 팝업에서 항목 선택 후 폼 반영 확인
3. 저장 후 데이터 무결성 확인
4. E2E 테스트 (Puppeteer)
