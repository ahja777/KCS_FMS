# FMS-Web 팝업 및 이벤트 기능 설계서

## 1. 개요

화면설계서(A0203_G01_화면설계서_Shipping_V1.0)를 기반으로 fms-web 전체 페이지에 찾기 버튼 클릭 시 팝업 연동 및 이벤트 기능을 구현합니다.

---

## 2. 화면설계서 분석 결과

### 2.1 팝업 유형 (슬라이드 218-240)

| 번호 | 팝업명 | 슬라이드 | 기존 컴포넌트 | 상태 |
|------|--------|----------|---------------|------|
| 1 | 우편번호 팝업 | 218 | PostcodeModal | ✅ 존재 |
| 2 | 거래처코드 팝업 | 219 | CodeSearchModal (customer) | ✅ 존재 |
| 3 | 담당자코드 팝업 | 220 | CodeSearchModal (manager) | ✅ 존재 |
| 4 | 공항코드(항공) 팝업 | 221 | CodeSearchModal (airport) | ✅ 존재 |
| 5 | 항구코드(해상) 팝업 | 222 | CodeSearchModal (seaport) | ✅ 존재 |
| 6 | 선사코드 팝업 | 223 | CodeSearchModal (carrier) | ✅ 존재 |
| 7 | 항공사코드 팝업 | 224 | CodeSearchModal (airline) | ✅ 존재 |
| 8 | 세관코드 팝업 | 225 | CodeSearchModal (customs) | ✅ 존재 |
| 9 | 운임코드 팝업(해상) | 226 | FreightCodeModal | ✅ 존재 |
| 10 | 운임코드 팝업(항공) | 227 | FreightCodeModal | ✅ 존재 |
| 11 | 운임기초정보코드 팝업 | 228 | CodeSearchModal (freightBase) | ✅ 존재 |
| 12 | 컨테이너종류코드 팝업 | 229 | CodeSearchModal (containerType) | ✅ 존재 |
| 13 | 통화단위코드 팝업 | 230 | CodeSearchModal (currency) | ✅ 존재 |
| 14 | 출발지/도착지 코드 팝업 | 231 | LocationCodeModal | ✅ 존재 |
| 15 | 특수화물 코드 팝업 | 232 | CodeSearchModal (specialCargo) | ✅ 존재 |
| 16 | 품목코드 팝업 | 233 | CodeSearchModal (commodity) | ✅ 존재 |
| 17 | HS품목코드 팝업 | 234 | HSCodeModal | ✅ 존재 |
| 18 | 은행계정과목코드 팝업 | 235 | CodeSearchModal (bankAccount) | ✅ 존재 |
| 19 | 국가코드 팝업 | 236 | CodeSearchModal (country) | ✅ 존재 |
| 20 | 지역코드 팝업 | 237 | CodeSearchModal (region) | ✅ 존재 |
| 21 | Email Send 팝업 | 238 | EmailModal | ✅ 존재 |
| 22 | 부킹정보조회 팝업(해상) | 239 | BookingSearchModal | ✅ 존재 |
| 23 | 부킹정보조회 팝업(항공) | 240 | BookingSearchModal | ✅ 존재 |

### 2.2 업무 팝업 (슬라이드 36-185)

| 번호 | 팝업명 | 슬라이드 | 기존 컴포넌트 | 상태 |
|------|--------|----------|---------------|------|
| 24 | 스케줄 조회 팝업(해상) | 36 | ScheduleSearchModal | ✅ 존재 |
| 25 | 스케줄 조회 팝업(항공) | 41 | ScheduleSearchModal | ✅ 존재 |
| 26 | 운임관리 조회 팝업(해상) | 57 | FreightSearchModal | ✅ 존재 |
| 27 | 운임관리 조회 팝업(항공) | 64 | FreightSearchModal | ✅ 존재 |
| 28 | 견적의뢰조회 팝업 | 72 | QuoteSearchModal | ✅ 존재 |
| 29 | 주문정보 팝업 | 158 | - | ⚠️ 신규 필요 |
| 30 | A/N 검색 팝업(해상) | 159 | - | ⚠️ 신규 필요 |
| 31 | A/N 검색 팝업(항공) | 160 | - | ⚠️ 신규 필요 |
| 32 | STUFFING ORDER 조회 팝업 | 170 | - | ⚠️ 신규 필요 |
| 33 | HOUSE B/L CONSOLE 팝업 | 185 | - | ⚠️ 신규 필요 |
| 34 | B/L 검색 팝업(해상) | 215 | BLSearchModal | ✅ 존재 |
| 35 | B/L 검색 팝업(항공) | 217 | BLSearchModal | ✅ 존재 |
| 36 | Dimensions 계산 팝업 | 148 | - | ⚠️ 신규 필요 |

---

## 3. 페이지별 팝업 연동 설계

### 3.1 물류견적관리 (슬라이드 10-70)

#### 3.1.1 견적요청 등록 (quote/request/register)
| 필드 | 팝업 | CodeType | 이벤트 |
|------|------|----------|--------|
| 출발지 | LocationCodeModal | airport/seaport | 선택 시 코드/명칭 자동입력 |
| 도착지 | LocationCodeModal | airport/seaport | 선택 시 코드/명칭 자동입력 |
| 거래처 | CodeSearchModal | customer | 선택 시 거래처코드/명 자동입력 |

#### 3.1.2 견적관리 등록/조회 (quote/sea, quote/air)
| 필드 | 팝업 | CodeType | 이벤트 |
|------|------|----------|--------|
| 거래처 | CodeSearchModal | customer | 선택 시 거래처 정보 자동입력 |
| 담당자 | CodeSearchModal | manager | 선택 시 담당자 정보 자동입력 |
| 출발지 | LocationCodeModal | seaport/airport | 선택 시 코드/명칭 자동입력 |
| 도착지 | LocationCodeModal | seaport/airport | 선택 시 코드/명칭 자동입력 |
| 선사/항공사 | CodeSearchModal | carrier/airline | 선택 시 선사/항공사 정보 자동입력 |
| 운임요율 | FreightCodeModal | - | 선택 시 운임 정보 자동입력 |

### 3.2 스케줄관리 (슬라이드 31-41)

#### 3.2.1 스케줄 등록/조회 (schedule/sea, schedule/air)
| 필드 | 팝업 | CodeType | 이벤트 |
|------|------|----------|--------|
| 출발지 | LocationCodeModal | seaport/airport | 선택 시 출발항/공항 자동입력 |
| 도착지 | LocationCodeModal | seaport/airport | 선택 시 도착항/공항 자동입력 |
| 선사/항공사 | CodeSearchModal | carrier/airline | 선택 시 선사/항공사 자동입력 |
| 세관 | CodeSearchModal | customs | 선택 시 세관코드 자동입력 |
| 입력사원 | CodeSearchModal | manager | 선택 시 담당자 자동입력 |

### 3.3 선적부킹관리 (슬라이드 78-89)

#### 3.3.1 선적부킹 등록/조회 (booking/sea, booking/air)
| 필드 | 팝업 | CodeType | 이벤트 |
|------|------|----------|--------|
| 거래처 | CodeSearchModal | customer | 선택 시 거래처 정보 자동입력 |
| 화주 | CodeSearchModal | customer (shipper) | 선택 시 화주 정보 자동입력 |
| 선사/항공사 | CodeSearchModal | carrier/airline | 선택 시 선사/항공사 자동입력 |
| POR(선적지) | LocationCodeModal | seaport/airport | 선택 시 선적지 자동입력 |
| POD(양하항) | LocationCodeModal | seaport/airport | 선택 시 양하항 자동입력 |
| 운송사 | CodeSearchModal | customer (carrier) | 선택 시 운송사 정보 자동입력 |
| 스케줄조회 | ScheduleSearchModal | - | 선택 시 스케줄 정보 자동입력 |
| 부킹정보조회 | BookingSearchModal | - | 선택 시 부킹 정보 자동입력 |

### 3.4 S/R 관리 (슬라이드 177-184)

#### 3.4.1 선적요청(S/R) 등록/조회 (sr/sea)
| 필드 | 팝업 | CodeType | 이벤트 |
|------|------|----------|--------|
| 선사 | CodeSearchModal | carrier | 선택 시 선사 정보 자동입력 |
| B/L TYPE | - | - | 드롭다운 선택 |
| Place of Receipt | LocationCodeModal | seaport | 선택 시 수취지 자동입력 |
| Port of Loading | LocationCodeModal | seaport | 선택 시 선적항 자동입력 |
| Port of Discharge | LocationCodeModal | seaport | 선택 시 양하항 자동입력 |
| Place of Delivery | LocationCodeModal | seaport | 선택 시 인도지 자동입력 |
| 입력사원 | CodeSearchModal | manager | 선택 시 담당자 자동입력 |
| 본/지사 | CodeSearchModal | region | 선택 시 지사 정보 자동입력 |

### 3.5 B/L 관리 (슬라이드 125-147)

#### 3.5.1 B/L 등록/조회 (import-bl/sea, import-bl/air)
| 필드 | 팝업 | CodeType | 이벤트 |
|------|------|----------|--------|
| Shipper | CodeSearchModal | customer | 선택 시 송화인 정보 자동입력 |
| Consignee | CodeSearchModal | customer | 선택 시 수화인 정보 자동입력 |
| Notify Party | CodeSearchModal | customer | 선택 시 통지처 정보 자동입력 |
| LINE | CodeSearchModal | carrier | 선택 시 선사 정보 자동입력 |
| Port of Loading | LocationCodeModal | seaport | 선택 시 선적항 자동입력 |
| Port of Discharge | LocationCodeModal | seaport | 선택 시 양하항 자동입력 |
| AGENT CODE | CodeSearchModal | customer | 선택 시 에이전트 정보 자동입력 |
| 국가코드 | CodeSearchModal | country | 선택 시 국가 정보 자동입력 |
| 지역코드 | CodeSearchModal | region | 선택 시 지역 정보 자동입력 |
| Other Charge | FreightCodeModal | - | 선택 시 운임 정보 자동입력 |

### 3.6 도착통지(A/N) 관리 (슬라이드 150-157)

#### 3.6.1 B/L 도착관리 등록/조회 (import-bl/sea/arrival, import-bl/air/arrival)
| 필드 | 팝업 | CodeType | 이벤트 |
|------|------|----------|--------|
| 거래처 | CodeSearchModal | customer | 선택 시 거래처 정보 자동입력 |
| 입력사원 | CodeSearchModal | manager | 선택 시 담당자 자동입력 |
| 본/지사 | CodeSearchModal | region | 선택 시 지사 정보 자동입력 |
| 항구/공항 | LocationCodeModal | seaport/airport | 선택 시 항구/공항 자동입력 |
| A/N 조회 | ANSearchModal (신규) | - | 선택 시 A/N 정보 자동입력 |

### 3.7 적하목록관리 (슬라이드 161-162, 186-187)

#### 3.7.1 적하목록관리 조회 (manifest/sea)
| 필드 | 팝업 | CodeType | 이벤트 |
|------|------|----------|--------|
| 입력사원 | CodeSearchModal | manager | 선택 시 담당자 자동입력 |
| 본/지사 | CodeSearchModal | region | 선택 시 지사 정보 자동입력 |

### 3.8 수출 B/L 관리 (슬라이드 167-190)

#### 3.8.1 STUFFING ORDER 관리 (export/stuffing)
| 필드 | 팝업 | CodeType | 이벤트 |
|------|------|----------|--------|
| 거래처 | CodeSearchModal | customer | 선택 시 거래처 정보 자동입력 |
| 출발항 | LocationCodeModal | seaport | 선택 시 출발항 자동입력 |
| 입력사원 | CodeSearchModal | manager | 선택 시 담당자 자동입력 |
| STUFFING ORDER 조회 | StuffingOrderModal (신규) | - | 선택 시 S/O 정보 자동입력 |

#### 3.8.2 CLP 관리 (export/clp)
| 필드 | 팝업 | CodeType | 이벤트 |
|------|------|----------|--------|
| 거래처 | CodeSearchModal | customer | 선택 시 거래처 정보 자동입력 |
| 입력사원 | CodeSearchModal | manager | 선택 시 담당자 자동입력 |
| B/L NO | BLSearchModal | - | 선택 시 B/L 정보 자동입력 |

#### 3.8.3 VGM 관리 (export/vgm)
| 필드 | 팝업 | CodeType | 이벤트 |
|------|------|----------|--------|
| 거래처 | CodeSearchModal | customer | 선택 시 거래처 정보 자동입력 |
| 입력사원 | CodeSearchModal | manager | 선택 시 담당자 자동입력 |
| Booking No | BookingSearchModal | - | 선택 시 부킹 정보 자동입력 |

### 3.9 AMS 관리 (슬라이드 미포함, 기존 구현)

#### 3.9.1 AMS 등록/조회 (ams/sea)
| 필드 | 팝업 | CodeType | 이벤트 |
|------|------|----------|--------|
| 거래처 | CodeSearchModal | customer | 선택 시 거래처 정보 자동입력 |
| 세관 | CodeSearchModal | customs | 선택 시 세관 정보 자동입력 |
| 출발항 | LocationCodeModal | seaport | 선택 시 출발항 자동입력 |
| 도착항 | LocationCodeModal | seaport | 선택 시 도착항 자동입력 |
| 국가코드 | CodeSearchModal | country | 선택 시 국가 정보 자동입력 |
| HS 품목코드 | HSCodeModal | - | 선택 시 HS코드 정보 자동입력 |

### 3.10 통관관리 (슬라이드 210-211)

#### 3.10.1 화물통관관리 조회 (customs/sea)
| 필드 | 팝업 | CodeType | 이벤트 |
|------|------|----------|--------|
| 입력사원 | CodeSearchModal | manager | 선택 시 담당자 자동입력 |
| 본/지사 | CodeSearchModal | region | 선택 시 지사 정보 자동입력 |

---

## 4. 신규 팝업 컴포넌트 설계

### 4.1 ANSearchModal (A/N 검색 팝업)

```typescript
interface ANItem {
  anNo: string;           // A/N 번호
  blNo: string;           // B/L 번호
  arrivalDate: string;    // 도착일자
  shipper: string;        // 송화인
  consignee: string;      // 수화인
  portOfLoading: string;  // 선적항
  portOfDischarge: string; // 양하항
  status: string;         // 상태
}

interface ANSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: ANItem) => void;
  type: 'sea' | 'air';
}
```

**검색조건**: 일자, 상태, B/L No, 업무구분
**표시항목**: A/N번호, B/L번호, 도착일자, 송화인, 수화인, 상태

### 4.2 StuffingOrderModal (STUFFING ORDER 조회 팝업)

```typescript
interface StuffingOrderItem {
  soNo: string;           // S/O 번호
  blNo: string;           // B/L 번호
  regDate: string;        // 등록일자
  customer: string;       // 거래처
  portOfLoading: string;  // 출발항
  portOfDischarge: string; // 도착항
  status: string;         // 상태
}

interface StuffingOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: StuffingOrderItem) => void;
}
```

**검색조건**: 등록일자, 거래처, 출발항, 상태
**표시항목**: S/O번호, B/L번호, 등록일자, 거래처, 출발항, 도착항, 상태

### 4.3 HBLConsoleModal (HOUSE B/L CONSOLE 팝업)

```typescript
interface HBLConsoleItem {
  hblNo: string;          // HBL 번호
  mblNo: string;          // MBL 번호
  regDate: string;        // 등록일자
  shipper: string;        // 송화인
  consignee: string;      // 수화인
  status: string;         // 상태
}

interface HBLConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (items: HBLConsoleItem[]) => void; // 다중선택
}
```

**검색조건**: 등록일자, Console여부, 입력사원
**표시항목**: HBL번호, MBL번호, 등록일자, 송화인, 수화인, 상태

### 4.4 OrderInfoModal (주문정보 팝업)

```typescript
interface OrderItem {
  orderNo: string;        // 주문번호
  orderDate: string;      // 주문일자
  customer: string;       // 거래처
  origin: string;         // 출발지
  destination: string;    // 도착지
  status: string;         // 상태
}

interface OrderInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: OrderItem) => void;
}
```

**검색조건**: 일자, 거래처, 상태
**표시항목**: 주문번호, 주문일자, 거래처, 출발지, 도착지, 상태

### 4.5 DimensionsCalculatorModal (Dimensions 계산 팝업)

```typescript
interface DimensionItem {
  length: number;         // 가로
  width: number;          // 세로
  height: number;         // 높이
  qty: number;            // 수량
  cbm: number;            // CBM (자동계산)
}

interface DimensionsCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (totalCbm: number, items: DimensionItem[]) => void;
}
```

**기능**: 가로/세로/높이/수량 입력 시 CBM 자동계산
**버튼**: 추가, 삭제, 초기화, 적용

---

## 5. 이벤트 기능 설계

### 5.1 공통 이벤트 패턴

```typescript
// 팝업 열기
const handleOpenPopup = (field: string, type: string) => {
  setCurrentField(field);
  setPopupType(type);
  setShowPopup(true);
};

// 팝업 선택 시 자동입력
const handleSelect = (item: any) => {
  switch(currentField) {
    case 'shipper':
      setFormData(prev => ({
        ...prev,
        shipperCode: item.code,
        shipperName: item.name,
      }));
      break;
    // ... 기타 필드
  }
  setShowPopup(false);
};
```

### 5.2 화면설계서 이벤트 명세

#### 5.2.1 견적요청 등록 (슬라이드 10-13)
| 이벤트 | 설명 |
|--------|------|
| 찾기 버튼 클릭 | 해당 필드의 코드 조회 팝업 표시 |
| 코드 선택 | 선택한 코드/명칭 자동입력 |
| 저장 버튼 클릭 | 필수값 검증 후 저장 API 호출 |
| 목록 버튼 클릭 | 목록 페이지로 이동 |

#### 5.2.2 견적관리 등록 (슬라이드 19-21, 25-26)
| 이벤트 | 설명 |
|--------|------|
| 운임요율 찾기 | FreightCodeModal 표시 |
| 선택된 운임 적용 | 운임항목 그리드에 추가 |
| 합계 자동계산 | 운임항목 변경 시 합계 재계산 |

#### 5.2.3 스케줄 조회 팝업 (슬라이드 36, 41)
| 이벤트 | 설명 |
|--------|------|
| 선사/항공사 찾기 | CodeSearchModal 표시 |
| 출발지/도착지 찾기 | LocationCodeModal 표시 |
| 스케줄 선택 | 선택한 스케줄 정보 부모 화면에 자동입력 |
| 더블클릭 | 즉시 선택 및 팝업 닫기 |

#### 5.2.4 선적부킹 등록 (슬라이드 78-82)
| 이벤트 | 설명 |
|--------|------|
| 스케줄조회 버튼 | ScheduleSearchModal 표시 |
| 스케줄 선택 | 선명/항차, 출발항, 도착항, ETD/ETA 자동입력 |
| Container Pick up 입력 | 픽업 관련 정보 입력 |
| 운송사 찾기 | CodeSearchModal (carrier) 표시 |

#### 5.2.5 B/L 등록 (슬라이드 127-138)
| 이벤트 | 설명 |
|--------|------|
| MAIN 탭 | 기본정보 입력 화면 |
| CARGO 탭 | 화물정보 입력 화면 |
| OTHER 탭 | 기타정보 입력 화면 |
| 탭 전환 | 탭별 데이터 유지 |
| Other Charge 추가/삭제 | 운임항목 관리 |
| Dimensions 계산 | DimensionsCalculatorModal 표시 |

#### 5.2.6 Email Send (슬라이드 238)
| 이벤트 | 설명 |
|--------|------|
| Customer 찾기 | 수신자 목록에서 선택 |
| 이메일 주소 입력 | 직접 입력 또는 선택 |
| 파일첨부 | 첨부파일 추가 |
| 발송 | 이메일 발송 API 호출 |

---

## 6. 구현 우선순위

### Phase 1: 기존 컴포넌트 연동 (즉시)
1. 모든 등록/조회 페이지에 CodeSearchModal 연동
2. LocationCodeModal 연동
3. ScheduleSearchModal 연동
4. BookingSearchModal 연동

### Phase 2: 신규 팝업 개발 (필요시)
1. ANSearchModal
2. StuffingOrderModal
3. HBLConsoleModal
4. OrderInfoModal
5. DimensionsCalculatorModal

### Phase 3: 이벤트 고도화
1. 자동입력 로직 고도화
2. 유효성 검증 강화
3. 에러 핸들링 개선

---

## 7. 파일 구조

```
src/components/popup/
├── index.ts                    # Export 모듈
├── CodeSearchModal.tsx         # 공통 코드 검색 (15+ 타입)
├── LocationCodeModal.tsx       # 출발지/도착지 코드
├── BookingSearchModal.tsx      # 부킹 정보 조회
├── BLSearchModal.tsx           # B/L 검색
├── HSCodeModal.tsx             # HS 품목코드
├── FreightCodeModal.tsx        # 운임코드
├── PostcodeModal.tsx           # 우편번호
├── QuoteSearchModal.tsx        # 견적의뢰 조회
├── TransportStatusModal.tsx    # 운송상태 정보
├── ANSearchModal.tsx           # A/N 검색 (신규)
├── StuffingOrderModal.tsx      # STUFFING ORDER 조회 (신규)
├── HBLConsoleModal.tsx         # HBL CONSOLE (신규)
├── OrderInfoModal.tsx          # 주문정보 (신규)
└── DimensionsCalculatorModal.tsx # Dimensions 계산 (신규)

src/components/
├── ScheduleSearchModal.tsx     # 스케줄 조회
├── FreightSearchModal.tsx      # 운임관리 조회
└── EmailModal.tsx              # Email Send
```

---

## 8. 적용 대상 페이지 목록 (57개)

### 등록/조회 페이지 (팝업 연동 필수)
| 카테고리 | 페이지 | 연동 팝업 |
|----------|--------|-----------|
| 부킹 | booking/sea/register | 10개 |
| 부킹 | booking/air/register | 10개 |
| 견적 | quote/sea/register | 8개 |
| 견적 | quote/air/register | 8개 |
| 견적요청 | quote/request | 4개 |
| S/R | sr/sea/register | 12개 |
| S/N | sn/sea/register | 8개 |
| 스케줄 | schedule/sea/register | 6개 |
| 스케줄 | schedule/air/register | 6개 |
| 수입B/L | import-bl/sea/register | 15개 |
| 수입B/L | import-bl/air/register | 15개 |
| 적하목록 | manifest/sea/register | 5개 |
| 통관 | customs/sea/register | 6개 |
| AMS | ams/sea/register | 10개 |
| 수출 | export/stuffing | 6개 |
| 수출 | export/clp | 5개 |
| 수출 | export/vgm | 5개 |

---

## 9. 결론

화면설계서 분석 결과, 기존 팝업 컴포넌트(9개)가 대부분의 요구사항을 충족합니다.
신규 팝업 5개(ANSearchModal, StuffingOrderModal, HBLConsoleModal, OrderInfoModal, DimensionsCalculatorModal)가 추가로 필요합니다.

**다음 단계**: 사용자 승인 후 구현 진행
