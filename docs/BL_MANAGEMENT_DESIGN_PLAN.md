# B/L 관리 시스템 설계 계획서

## 화면설계서 분석 결과 (슬라이드 125-148)

### 개요
화면설계서 125~148 페이지는 **B/L(선하증권) 관리** 기능에 대한 화면 설계입니다.
- **해상 B/L 관리**: 슬라이드 125-138
- **항공 B/L 관리**: 슬라이드 139-147
- **공통 팝업**: 슬라이드 148 (Dimensions 계산)

---

## 1. B/L 관리(해상) 화면 구조

### 1.1 B/L 조회(해상) - UI-G-01-07-02
**경로**: `/logis/bl/sea`

#### 검색 조건
| 필드명 | 타입 | 설명 |
|--------|------|------|
| 업무구분 | Select | 해상 (고정) |
| 수출입구분 | Select | IN/OUT |
| O/B.Date | DateRange | 출발일자 범위 |
| A/R.Date | DateRange | 도착일자 범위 |
| Shipper | Search | 거래처코드 팝업 (UI-G-00-00-04) |
| Consignee | Search | 거래처코드 팝업 |
| Notify | Search | 거래처코드 팝업 |
| Line | Search | 거래처코드 팝업 |
| Partner | Search | 거래처코드 팝업 |
| Loading | Search | 선사코드 팝업 (UI-G-00-00-08) |
| License No. | Input | 라이센스 번호 |
| Business Type | Select | 업무유형 |
| CTNR NO./Original | Input | 컨테이너번호/원본 |
| Vessel / Area | Search | 선박/지역 |
| 입력사원 | Input | 입력사원 |
| 본지사 | Select | 본사/지사 구분 |

#### 목록 컬럼
| No | 컬럼명 | 설명 |
|----|--------|------|
| 1 | No. | 순번 |
| 2 | O/B.Date | 출발일자 |
| 3 | A/R.Date | 도착일자 |
| 4 | JOB.NO. | 잡번호 |
| 5 | S/R NO. | S/R 번호 |
| 6 | M.B/L NO. | Master B/L 번호 |
| 7 | H.B/L NO. | House B/L 번호 |
| 8 | L/C NO. | 신용장 번호 |
| 9 | P/O NO. | Purchase Order 번호 |
| 10 | TYPE | 유형 |
| 11 | D/C | D/C 구분 |
| 12 | L/N | L/N 구분 |
| 13 | PC | PC 구분 |
| 14 | INCO | 인코텀즈 |

#### 버튼
- **조회**: 검색 실행
- **초기화**: 검색조건 초기화
- **신규**: B/L 등록 화면으로 이동
- **수정**: 선택된 B/L 수정 화면으로 이동
- **삭제**: 선택된 B/L 삭제

---

### 1.2 B/L 등록(해상) - UI-G-01-07-03
**경로**: `/logis/bl/sea/register`

#### TAB 구조
```
[MAIN] [CARGO] [OTHER]
```

#### MAIN TAB 필드
**Main Information**
| 필드명 | 타입 | 필수 | 이벤트 |
|--------|------|------|--------|
| 수출입구분 | Select | * | IN 선택시 M A/N 조회 활성화, OUT 선택시 부킹조회 활성화 |
| JOB NO | Display | - | 시스템 자동생성 |
| BOOKING NO | Display | - | 부킹조회에서 선택 |
| 영업유형 / 지불방법 | Select | - | - |
| 업무유형 / 수입환적 | Select | - | Consol/Co-Load/Simple 선택 |
| M BL NO | Search | - | M BL NO 팝업 호출 (UI-G-01-00-06A) |
| HBL NO | Search | * | HBL NO 팝업 호출 |
| S/R NO | Search | - | S/R 등록화면 이동 (저장완료시만 활성화) |
| SHIPPER | Search | - | 거래처코드 팝업 |
| CONSIGNEE | Search | - | 거래처코드 팝업 + Copy 체크박스 |
| NOTIFY | Search | - | 거래처코드 팝업 + To Order 체크박스 + Same As 체크박스 |
| For Delivery | Search | - | 거래처코드 팝업 |
| BL TYPE | Select | - | B/L 타입 선택 |

**Schedule Information**
| 필드명 | 타입 | 이벤트 |
|--------|------|--------|
| Place of Receipt | Search | 항구코드 팝업 (UI-G-00-00-07) |
| LINE | Search | 선사코드 팝업 (UI-G-00-00-08) |
| Pre-carriage by / Call Sign | Input | - |
| Port of Loading | Search | 항구코드 팝업 |
| Onboard Date | DateTimePicker | - |
| Vessel Name & Voyage No | Input | - |
| Port of Discharge | Search | 항구코드 팝업 |
| ETD | Date | - |
| ETA | Date | - |
| Place of Delivery | Search | 항구코드 팝업 |
| Freight Payable at | Input | FREIGHT TERM에 따라 자동입력 |
| FREIGHT TERM | Select | Prepaid/Collect 선택시 연동 |
| Final Destination | Search | 항구코드 팝업 |
| SERVICE TERM | Select | 컨테이너 규격과 연동 |

**MAIN TAB 이벤트 로직**
1. **To Order 체크**: Notify 코드/주소 Space 처리, "To Order Of" 문구 삽입
2. **Copy 체크**: Consignee 항목과 동일하게 삽입
3. **Same As 체크**: "Same As Consignee" 문구 삽입
4. **FREIGHT TERM 연동**:
   - CFR~DES 선택시 → Prepaid 자동선택
   - EXW~FOB 선택시 → Collect 자동선택
5. **SERVICE TERM 연동**:
   - CFS/CFS → 컨테이너규격 LCL
   - CY/CY → 컨테이너규격 FCL
   - BULK → 컨테이너규격 BULK
6. **B/L복사**: JOB NO, M B/L NO, S/R NO, H B/L NO 초기화 후 나머지 데이터 유지

---

#### CARGO TAB 필드
**Cargo Information**
| 필드명 | 타입 | 이벤트 |
|--------|------|--------|
| 컨테이너 규격 | Radio | LCL/FCL/BULK 선택 |
| Package | Input | 포장갯수 입력 |
| Gross Weight | Input | 총중량 (KG) |
| Measurement | Input | 용적 (CBM) |
| R.TON | Calc | G.WEIGHT와 MESS 비교하여 자동계산 |
| Container 20 | Select | 20피트 컨테이너 종류/수량 |
| Container 40 | Select | 40피트 컨테이너 종류/수량 |

**Container Information Grid**
| 컬럼 | 설명 |
|------|------|
| Container No | 컨테이너 번호 |
| Container 규격 | 컨테이너종류코드 팝업 (UI-G-00-00-14) |
| Seal 1 No. | Seal 번호 1 |
| Seal 2 No. | Seal 번호 2 |
| Seal 3 No. | Seal 번호 3 |
| Package | 포장수량 |
| Unit | 단위 |
| G.Weight | 중량 |
| Measurement | 용적 |

**Other Charge Grid**
| 컬럼 | 설명 |
|------|------|
| CODE | 운임종류코드 팝업 (UI-G-00-00-13) |
| Charges | 운임명 |
| Cur | 통화단위코드 팝업 (UI-G-00-00-15) |
| Prepaid | 선불금액 |
| Collect | 착불금액 |

**Issue Information**
| 필드명 | 타입 |
|--------|------|
| issue Place | Search (공항코드 팝업) |
| Issue Date | Date |
| BL Issue Type | Select |
| No. of original B/L | Input |
| Signature | Input |
| Issuing Carrier or its Agent | Input |

**CARGO TAB 이벤트 로직**
1. **LCL 선택시**: 컨테이너 그리드 비활성화, "SAID TO CONTAIN" 메시지 표시
2. **FCL 선택시**: 컨테이너 그리드 활성화, "SHIPPER'S LOAD & COUNT" 메시지 표시
3. **BULK 선택시**: "SAID TO BE" 메시지 표시
4. **FREIGHT TERM 연동**:
   - Prepaid → "FREIGHT PREPAID" 표시
   - Collect → "FREIGHT COLLECT" 표시
5. **R.TON 자동계산**:
   - G.WEIGHT > MESS 일 때: R.TON = MESS
   - G.WEIGHT < MESS 일 때: R.TON = G.WEIGHT / 1000

---

#### OTHER TAB 필드
**Other Information**
| 필드명 | 타입 |
|--------|------|
| AGENT CODE | Search (거래처코드 팝업) |
| SUB AGENT | Search (거래처코드 팝업) |
| PARTNER | Search (거래처코드 팝업) |
| 입력사원 | Input |
| 본/지사 | Select |
| 국가코드 | Search (국가코드 팝업 UI-G-00-00-20) |
| 지역코드 | Search (지역코드 팝업 UI-G-00-00-21) |
| ITEM | Input |
| AMOUNT | Input |
| L/C NO | Input |
| P/O NO | Input |
| INV VALUE | Input |
| INV NO | Input |
| MRN NO | Input |
| MSN | Input |
| 최초등록일 | Display |
| 최종수정일 | Display |

**Console Information Grid (읽기전용)**
| 컬럼 | 설명 |
|------|------|
| M BL No | Master B/L 번호 |
| Shipper | 화주 |
| Partner | 파트너 |
| Package | 포장수량 |
| G.Weight | 중량 |
| Measurement | 용적 |
| 컨테이너 유형 | 컨테이너타입 |

---

### 1.3 B/L 상세조회(해상) - UI-G-01-07-04
**경로**: `/logis/bl/sea/[id]`

- 등록화면과 동일한 구조 (읽기전용)
- 버튼: 목록, 수정

---

## 2. B/L 관리(항공) 화면 구조

### 2.1 B/L 조회(항공) - UI-G-01-07-05
**경로**: `/logis/bl/air`

#### 검색 조건
| 필드명 | 타입 | 설명 |
|--------|------|------|
| 업무구분 | Select | 항공 (고정) |
| 수출입구분 | Select | IN/OUT |
| O/B.Date | DateRange | 출발일자 |
| A/R.Date | DateRange | 도착일자 |
| Shipper | Search | 거래처코드 팝업 |
| Consignee | Search | 거래처코드 팝업 |
| Notify | Search | 거래처코드 팝업 |
| Partner | Search | 거래처코드 팝업 |
| Destination | Search | 공항코드 팝업 (UI-G-00-00-06) |
| Flight No. | Search | 항공사코드 팝업 (UI-G-00-00-09) |
| 입력사원 | Input | - |
| 본지사 | Select | - |
| Sales Man | Input | - |

#### 목록 컬럼
| 컬럼명 | 설명 |
|--------|------|
| O/B.Date | 출발일자 |
| A/R.Date | 도착일자 |
| JOB.NO. | 잡번호 |
| MAWB NO. | Master AWB 번호 |
| HAWB NO. | House AWB 번호 |
| L/C NO. | 신용장 번호 |
| P/O NO. | PO 번호 |
| TYPE | 유형 |
| D/C | D/C |
| L/N | L/N |
| PC | PC |
| INCO | 인코텀즈 |

---

### 2.2 B/L 등록(항공) - UI-G-01-07-06
**경로**: `/logis/bl/air/register`

#### MAIN TAB 필드
| 필드명 | 타입 | 이벤트 |
|--------|------|--------|
| MAWB NO | Input | 11자리 숫자 Check Digit 검증 |
| HAWB NO | Input | 중복체크, HAWB 검색팝업 |
| 부킹조회 | Button | 부킹조회 팝업 (UI-G-00-00-24) |
| BOOKING NO | Display | 부킹조회에서 선택 |
| SHIPPER | Search | 거래처코드 팝업 |
| CONSIGNEE | Search | 거래처코드 팝업 + Copy 체크박스 |
| NOTIFY | Search | 거래처코드 팝업 + Same As 체크박스 |
| 통화종류 | Input | KRW→P, USD→C 자동설정 |
| WT/VAL | Radio | P/C 선택 (하나만 선택 가능) |
| OTHER | Radio | P/C 선택 (하나만 선택 가능) |
| CHGS CODE | Input | - |
| Net.. | Search | 거래처코드 팝업 |
| 출발지 | Search | 공항코드 팝업 |
| 도착지 | Search | 공항코드 팝업 |
| HANDLING INFORMATION | Search | HANDLING INFORMATION 코드 팝업 |
| House 신규 | Button | 저장완료 후 활성화, MAWB 유지하고 HAWB 초기화 |
| AWB 복사 | Button | JOB NO, MAWB NO, HAWB NO 초기화 |

**MAIN TAB 이벤트 로직**
1. **통화종류 연동**: KRW → WT/VAL "P", OTHER "P" / USD → WT/VAL "C", OTHER "C"
2. **ACCOUNT INFORMATION**: WT/VAL "P" → "Freight Prepaid" / "C" → "Freight Collect"

---

#### CARGO TAB 필드
**Cargo Information Grid**
| 컬럼 | 설명 |
|------|------|
| No. of pieces RCP | 개수 |
| GrossWeight | 총중량 |
| Kg/lb | 단위 |
| Rate Class/Commodity Item No. | 요율 클래스 |
| Chargeable Weight | 청구중량 |
| Rate/Charge | 요율 |
| Total | 합계 |
| As Arranged | 체크시 출력물에 "As Arranged" 표시 |

**Other Charge Grid**
| 컬럼 | 설명 |
|------|------|
| Codes | 운임종류코드 팝업 |
| CUR | 통화단위코드 팝업 |
| Rate | 요율 |
| Amount | 금액 |
| P/C | Prepaid/Collect |
| A/C | Account |

**기타 필드**
| 필드명 | 타입 |
|--------|------|
| Nature and Quantity of Goods | Textarea |
| Weight Charge | Input (숫자) |
| Dimensions | Button (Dimensions 계산 팝업 호출) |
| At(Place) | Search (공항코드 팝업) |
| Signature of Issuing Carrier | Input |

---

#### OTHER TAB 필드
| 필드명 | 타입 |
|--------|------|
| Agent | Search (거래처코드 팝업) |
| Sub Agent | Search (거래처코드 팝업) |
| Partner | Search (거래처코드 팝업) |
| 항공사 | Search (항공사코드 팝업) |
| 지역 | Search (지역코드 팝업) |
| 국가 | Search (국가코드 팝업) |
| MRN NO | Input |
| MSN | Input |

---

### 2.3 B/L 상세조회(항공) - UI-G-01-07-07
**경로**: `/logis/bl/air/[id]`

- 등록화면과 동일한 구조 (읽기전용)
- 버튼: 목록, 수정

---

## 3. 공통 팝업 컴포넌트

### 3.1 Dimensions 계산 팝업 - UI-G-00-00-03
**경로**: `/components/popup/DimensionsCalcModal.tsx`

#### Grid 컬럼
| 컬럼 | 설명 |
|------|------|
| Print | 출력여부 |
| Width | 가로 (cm) |
| Length | 세로 (cm) |
| Height | 높이 (cm) |
| PCS | 포장개수 |
| Volume | 용적 (자동계산) |

#### 버튼
- **추가**: Row 추가
- **삭제**: 선택 Row 삭제
- **초기화**: 전체 초기화
- **적용**: 계산결과를 AWB Cargo Tab에 반영
- **닫기**: 팝업 닫기

#### 계산 로직
```
Volume = (Width × Length × Height × PCS) ÷ 6,000
Total = Sum of all PCS, Sum of all Volume
```

---

## 4. 파일 구조 계획

```
src/app/logis/bl/
├── sea/
│   ├── page.tsx                    # B/L 조회(해상)
│   ├── register/
│   │   └── page.tsx                # B/L 등록(해상)
│   └── [id]/
│       └── page.tsx                # B/L 상세조회(해상)
├── air/
│   ├── page.tsx                    # B/L 조회(항공)
│   ├── register/
│   │   └── page.tsx                # B/L 등록(항공)
│   └── [id]/
│       └── page.tsx                # B/L 상세조회(항공)

src/app/api/bl/
├── sea/
│   └── route.ts                    # 해상 B/L API
├── air/
│   └── route.ts                    # 항공 B/L API

src/components/popup/
├── DimensionsCalcModal.tsx         # Dimensions 계산 팝업
├── MBLSearchModal.tsx              # M B/L 검색 팝업
├── HBLSearchModal.tsx              # H B/L 검색 팝업
├── BookingSearchModal.tsx          # 부킹조회 팝업
├── ContainerTypeModal.tsx          # 컨테이너종류 팝업
├── FreightCodeModal.tsx            # 운임종류 팝업
├── CurrencyCodeModal.tsx           # 통화단위 팝업
├── CountryCodeModal.tsx            # 국가코드 팝업
└── RegionCodeModal.tsx             # 지역코드 팝업
```

---

## 5. 데이터베이스 테이블 (예상)

### ORD_OCEAN_BL (해상 B/L)
```sql
- BL_ID (PK)
- JOB_NO
- BOOKING_NO
- M_BL_NO
- H_BL_NO
- SR_NO
- IO_TYPE (IN/OUT)
- BIZ_TYPE (Consol/Co-Load/Simple)
- SHIPPER_CD, SHIPPER_NM, SHIPPER_ADDR
- CONSIGNEE_CD, CONSIGNEE_NM, CONSIGNEE_ADDR
- NOTIFY_CD, NOTIFY_NM, NOTIFY_ADDR
- LINE_CD
- VESSEL_NM, VOYAGE_NO
- POL_CD, POD_CD
- ETD_DT, ETA_DT
- FREIGHT_TERM, SERVICE_TERM
- CONTAINER_TYPE (LCL/FCL/BULK)
- PACKAGE_QTY, GROSS_WEIGHT, MEASUREMENT
- STATUS_CD
- CREATED_BY, CREATED_DTM
- UPDATED_BY, UPDATED_DTM
```

### ORD_AIR_AWB (항공 AWB)
```sql
- AWB_ID (PK)
- JOB_NO
- BOOKING_NO
- M_AWB_NO
- H_AWB_NO
- IO_TYPE
- SHIPPER_CD, SHIPPER_NM
- CONSIGNEE_CD, CONSIGNEE_NM
- NOTIFY_CD, NOTIFY_NM
- DEPARTURE_CD, ARRIVAL_CD
- FLIGHT_NO
- WT_VAL, OTHER_CHGS
- CURRENCY_CD
- PIECES_QTY, GROSS_WEIGHT
- STATUS_CD
- CREATED_BY, CREATED_DTM
```

---

## 6. 구현 우선순위

### Phase 1: 해상 B/L 관리
1. B/L 조회(해상) 화면
2. B/L 등록(해상) - MAIN TAB
3. B/L 등록(해상) - CARGO TAB
4. B/L 등록(해상) - OTHER TAB
5. B/L 상세조회(해상)
6. 해상 B/L API

### Phase 2: 항공 B/L 관리
1. B/L 조회(항공) 화면
2. B/L 등록(항공) - MAIN TAB
3. B/L 등록(항공) - CARGO TAB
4. B/L 등록(항공) - OTHER TAB
5. B/L 상세조회(항공)
6. 항공 B/L API

### Phase 3: 공통 팝업
1. Dimensions 계산 팝업
2. M B/L / H B/L 검색 팝업
3. 부킹조회 팝업
4. 기타 코드 검색 팝업

---

## 7. 주요 비즈니스 로직 정리

### 7.1 SERVICE TERM ↔ 컨테이너규격 연동
```typescript
const serviceTermMapping = {
  'CFS/CFS': 'LCL',
  'CY/CY': 'FCL',
  'CFS/DOOR': 'LCL',
  'DOOR/CFS': 'LCL',
  'CY/DOOR': 'FCL',
  'DOOR/CY': 'FCL',
  'BULK': 'BULK'
};
```

### 7.2 R.TON 자동계산
```typescript
const calculateRTON = (grossWeight: number, measurement: number) => {
  const weightTon = grossWeight / 1000;
  return weightTon > measurement ? measurement : Number(weightTon.toFixed(3));
};
```

### 7.3 컨테이너 종류 EDI 변환
```typescript
const containerEdiMapping = {
  '20 DR': '22GP',
  '40 DR': '42GP',
  '40 HC': '45GP',
  // ... 기타 매핑
};
```

### 7.4 MAWB Check Digit 검증
```typescript
const validateMAWBCheckDigit = (mawbNo: string): boolean => {
  if (mawbNo.length !== 11) return false;
  const prefix = mawbNo.substring(0, 3);
  const serial = mawbNo.substring(3, 10);
  const checkDigit = parseInt(mawbNo.substring(10));
  return (parseInt(serial) % 7) === checkDigit;
};
```

---

**작성일**: 2026-01-27
**작성자**: Claude AI
**버전**: 1.0
