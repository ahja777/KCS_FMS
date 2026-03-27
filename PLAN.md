# 항공수입 AWB 관리 화면 재구성 계획

## 1. 현황 분석

### 화면설계서 TAB 구조 (슬라이드 140-147)

| TAB | 내용 | 슬라이드 |
|-----|------|----------|
| **MAIN TAB** | 기본정보, 항공편정보, 거래처정보 | 140-142 |
| **CARGO TAB** | Weight Charge, Other Charge, Dimensions | 143 |
| **OTHER TAB** | MRN NO, MSN, AGENT 정보 등 | 144 |

### 항공수출 vs 항공수입 AWB 등록화면 비교

| 구성요소 | 항공수출 | 항공수입 | 누락여부 |
|----------|----------|----------|----------|
| AWB 타입 선택 | O | O | - |
| **발행일자** | O | X | **누락** |
| **발행지** | O | X | **누락** |
| 항공편 정보 | O | O | - |
| 거래처 정보 | O | O | - |
| 화물 정보 | O | O | - |
| 운임 정보 | O | O | - |
| 통관 정보 | X | O | 수입 특화 |
| **TAB 구조** | X | X | **양쪽 누락** |

### 누락 항목 상세
1. TAB 구조 미구현 (MAIN/CARGO/OTHER)
2. 발행일자/발행지 누락 (항공수입)
3. CARGO TAB 필드: Weight Charge, Valuation Charge, Rate
4. OTHER TAB 필드: MRN NO, MSN, AGENT 정보

## 2. 구현 계획

### Phase 1: 항공수입 AWB 등록화면 재구성
- TAB 구조 추가 (MAIN/CARGO/OTHER)
- 발행일자, 발행지 필드 추가
- CARGO TAB: 화물정보 + 운임정보
- OTHER TAB: 통관정보 + Agent정보 + 비고

### Phase 2: DB 스키마 업데이트
- MRN_NO, MSN, AGENT_CODE, AGENT_NAME
- WEIGHT_CHARGE, VALUATION_CHARGE, TAX_AMT
- ISSUE_DT, ISSUE_PLACE

### Phase 3: API 업데이트
- 새 필드 지원 추가

### Phase 4: CRUD 테스트
- CREATE/READ/UPDATE/DELETE 테스트

## 3. 구현 순서
1. DB 스키마 업데이트
2. API 업데이트
3. 등록화면 재구성
4. 빌드 테스트
5. CRUD 테스트
