# FMS-WEB 코드 데이터 동기화 계획

## 분석 결과 요약

### 1. PORT 코드 문제
| 현재 사용값 | 공통코드 존재 여부 | 수정 방안 |
|------------|------------------|----------|
| KRPUS | 미등록 | → KRBUS (BUSAN KOREA) 또는 공통코드에 KRPUS 추가 |
| KRINC | 미등록 | → INC (INCHON) 또는 공통코드에 KRINC 추가 |
| USLA | 미등록 | → USLAX |

### 2. PKG_TYPE_CD 매칭 문제
| 현재 사용값 | 공통코드(UNIT) | 수정 방안 |
|------------|---------------|----------|
| CARTON | CT | 공통코드에 CARTON 추가 (사용편의) |
| PALLET | PT | 공통코드에 PALLET 추가 (사용편의) |
| DRUM | DR | 공통코드에 DRUM 추가 |

### 3. STATUS 코드 대소문자 불일치
- QUO_QUOTE_SEA: draft, approved, submitted, rejected, expired, PENDING, active 혼용
- ORD_OCEAN_BOOKING: DRAFT, PENDING, REQUESTED, CONFIRMED, CONFIRM 혼용
- BL_HOUSE_BL: DRAFT, CONFIRMED, PRINTED, ISSUED, DEPARTED, IN_TRANSIT, ARRIVED

**수정 방안**: 모두 대문자로 통일

### 4. 누락된 코드 그룹 생성 필요

#### FREIGHT_TERM (운임조건)
| 코드 | 명칭 |
|------|------|
| PREPAID | Freight Prepaid (선불) |
| COLLECT | Freight Collect (착불) |

#### BL_TYPE (B/L 유형)
| 코드 | 명칭 |
|------|------|
| ORIGINAL | Original B/L |
| SEAWAY | Sea Waybill |
| LCL | LCL B/L |
| FCL | FCL B/L |
| SIMPLE | Simple B/L |

#### QUOTE_STATUS (견적 상태)
| 코드 | 명칭 |
|------|------|
| DRAFT | 작성중 |
| SUBMITTED | 제출됨 |
| APPROVED | 승인됨 |
| REJECTED | 반려됨 |
| EXPIRED | 만료됨 |
| ACTIVE | 활성 |
| PENDING | 대기중 |

#### BOOKING_STATUS (부킹 상태)
| 코드 | 명칭 |
|------|------|
| DRAFT | 작성중 |
| PENDING | 대기중 |
| REQUESTED | 요청됨 |
| CONFIRMED | 확정됨 |
| CANCELLED | 취소됨 |

#### BL_STATUS (B/L 상태)
| 코드 | 명칭 |
|------|------|
| DRAFT | 작성중 |
| CONFIRMED | 확정됨 |
| PRINTED | 출력됨 |
| ISSUED | 발행됨 |
| DEPARTED | 출항 |
| IN_TRANSIT | 운송중 |
| ARRIVED | 도착 |
| DELIVERED | 인도완료 |

#### SCHEDULE_STATUS (스케줄 상태)
| 코드 | 명칭 |
|------|------|
| SCHEDULED | 예정 |
| OPEN | 부킹가능 |
| LIMITED | 잔여공간 |
| FULL | 만석 |
| CLOSED | 마감 |
| DEPARTED | 출항 |
| ARRIVED | 도착 |
| CANCELLED | 취소 |
| ACTIVE | 활성 |

---

## 실행 계획

### Phase 1: 공통코드 그룹 및 코드 추가
1. MST_COMMON_CODE_GROUP에 누락된 그룹 추가
2. MST_COMMON_CODE에 각 그룹별 코드 추가
3. PORT 코드 추가 (KRPUS, KRINC)
4. PKG_TYPE 코드 추가 (CARTON, PALLET, DRUM)

### Phase 2: 데이터 정규화
1. STATUS 대소문자 통일 (대문자)
2. CONFIRM → CONFIRMED 수정
3. PORT 코드 정규화 (필요시)

### Phase 3: 테스트
1. 각 API CRUD 테스트
2. fms-web 화면 정상 동작 확인
3. 코드 드롭다운 표시 확인

---

## 영향받는 테이블

| 테이블명 | 영향받는 컬럼 | 데이터 건수 |
|---------|-------------|-----------|
| QUO_QUOTE_SEA | STATUS, POL_PORT_CD, POD_PORT_CD | 15건 |
| QUO_QUOTE_AIR | STATUS | 6건 |
| ORD_OCEAN_BOOKING | STATUS_CD, POL_PORT_CD, POD_PORT_CD | 33건 |
| ORD_AIR_BOOKING | STATUS_CD | 12건 |
| BL_HOUSE_BL | STATUS_CD, PKG_TYPE_CD, FREIGHT_TERM_CD | 28건 |
| BL_MASTER_BL | STATUS_CD, PKG_TYPE_CD | 18건 |
| SHP_SHIPPING_REQUEST | STATUS_CD | 11건 |
| SCH_OCEAN_SCHEDULE | STATUS_CD | 16건 |
| SCH_AIR_SCHEDULE | STATUS_CD | 17건 |
