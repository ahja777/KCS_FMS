# 보고서 출력 기능 설계서

## 1. 개요

보고서 설계서(A0203_G02_보고서설계서)를 기반으로 FMS 시스템의 각 화면에 보고서 출력 기능을 추가합니다.

## 2. 보고서 - 페이지 매핑

| 보고서명 | 조회 화면 | 등록/상세 화면 | 보고서 코드 |
|---------|----------|--------------|------------|
| 견적서 | quote/sea, quote/air | quote/sea/register, quote/air/register | RPT_QUOTE |
| 부킹확인서 | booking/sea, booking/air | booking/sea/register, booking/air/register | RPT_BOOKING |
| D/O (Delivery Order) | import-bl/sea, import-bl/air | import-bl/sea/[id], import-bl/air/[id] | RPT_DO |
| 혼재적하목록 | manifest/sea | manifest/sea/register, manifest/sea/[id] | RPT_MANIFEST |
| 혼재적하목록정정신청서 | manifest/sea | manifest/sea/[id] | RPT_MANIFEST_CORRECTION |
| 사유서 | - | 별도 모달 | RPT_REASON |
| 선적요청서(SR) | sr/sea | sr/sea/register, sr/sea/[id] | RPT_SR |
| B/L (CHECK) | import-bl/sea, import-bl/air | import-bl/sea/[id], import-bl/air/[id] | RPT_BL_CHECK |
| B/L | import-bl/sea, import-bl/air | import-bl/sea/[id], import-bl/air/[id] | RPT_BL |
| 화물도착통지서(AN) | import-bl/sea/arrival, import-bl/air/arrival | import-bl/sea/[id], import-bl/air/[id] | RPT_AN |
| 운송요청서 | transport/request, transport/manage | transport/request | RPT_TRANSPORT |
| VGM | export/vgm | export/vgm | RPT_VGM |
| 보세창고 지정신청서 | warehouse/manage | warehouse/manage | RPT_WAREHOUSE |
| 청구서(인보이스) | cost/payment | cost/payment | RPT_INVOICE |

## 3. 출력 버튼 동작 규칙

### 3.1 등록/상세 화면
- **활성화 조건**:
  - 데이터가 있는 상태 (기존 데이터 조회)
  - 저장된 상태 (신규 등록 후 저장 완료)
- **비활성화 조건**:
  - 신규 등록 상태 (아직 저장되지 않은 상태)
  - 데이터가 없는 상태

### 3.2 조회 화면
- 목록에서 체크박스로 선택된 데이터를 출력
- 복수 선택 시 일괄 출력 지원
- 선택된 항목이 없으면 "선택된 항목이 없습니다" 알림

## 4. 컴포넌트 설계

### 4.1 ReportPrintButton 컴포넌트
```tsx
interface ReportPrintButtonProps {
  reportType: ReportType;           // 보고서 종류
  data: Record<string, any>;        // 출력 데이터
  disabled?: boolean;               // 비활성화 여부
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}
```

### 4.2 ReportPrintModal 컴포넌트
```tsx
interface ReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: ReportType;
  data: Record<string, any> | Record<string, any>[];
  options?: ReportOptions;
}

interface ReportOptions {
  copies?: number;          // 출력 부수
  paperSize?: 'A4' | 'A3';  // 용지 크기
  orientation?: 'portrait' | 'landscape';
  includeHeader?: boolean;
  includeFooter?: boolean;
}
```

### 4.3 보고서 템플릿 시스템
```
/components/reports/
  ├── ReportPrintButton.tsx       # 출력 버튼 컴포넌트
  ├── ReportPrintModal.tsx        # 출력 미리보기 모달
  ├── ReportViewer.tsx            # 보고서 뷰어
  ├── templates/
  │   ├── QuoteReport.tsx         # 견적서 템플릿
  │   ├── BookingConfirmReport.tsx # 부킹확인서 템플릿
  │   ├── DOReport.tsx            # D/O 템플릿
  │   ├── ManifestReport.tsx      # 적하목록 템플릿
  │   ├── SRReport.tsx            # SR 템플릿
  │   ├── BLReport.tsx            # B/L 템플릿
  │   ├── BLCheckReport.tsx       # B/L(CHECK) 템플릿
  │   ├── ANReport.tsx            # 도착통지서 템플릿
  │   ├── TransportRequestReport.tsx # 운송요청서 템플릿
  │   ├── VGMReport.tsx           # VGM 템플릿
  │   ├── WarehouseReport.tsx     # 보세창고신청서 템플릿
  │   └── InvoiceReport.tsx       # 청구서 템플릿
  └── styles/
      └── report.css              # 보고서 공통 스타일
```

## 5. 출력 기능 구현

### 5.1 브라우저 인쇄 (window.print)
- 인쇄 전용 CSS (@media print)
- 페이지 나누기 제어
- 머리글/바닥글 자동 삽입

### 5.2 PDF 다운로드
- html2canvas + jsPDF 또는 react-to-print 라이브러리 활용
- 파일명 자동 생성: `[보고서종류]_[문서번호]_[날짜].pdf`

## 6. 버튼 배치 위치

### 6.1 등록/상세 화면
- 상단 버튼 영역: [신규] [저장] [삭제] [**출력**] [닫기]
- 출력 버튼은 저장/삭제 버튼 다음에 배치

### 6.2 조회 화면
- 상단 버튼 영역: [신규등록] [삭제] [**출력**] [Excel] [닫기]
- 또는 그리드 상단: [선택출력] 버튼

## 7. 상태 관리

### 7.1 등록 화면 상태
```typescript
const [isSaved, setIsSaved] = useState(false);
const [hasData, setHasData] = useState(false);

// 출력 버튼 활성화 조건
const isPrintEnabled = isSaved || hasData;
```

### 7.2 조회 화면 상태
```typescript
const [selectedRows, setSelectedRows] = useState<string[]>([]);

// 출력 버튼 활성화 조건
const isPrintEnabled = selectedRows.length > 0;
```

## 8. 적용 대상 페이지 목록

### 8.1 조회 화면 (체크박스 선택 출력)
1. `/logis/quote/sea/page.tsx` - 해상 견적 조회
2. `/logis/quote/air/page.tsx` - 항공 견적 조회
3. `/logis/booking/sea/page.tsx` - 해상 부킹 조회
4. `/logis/booking/air/page.tsx` - 항공 부킹 조회
5. `/logis/import-bl/sea/page.tsx` - 해상 B/L 조회
6. `/logis/import-bl/air/page.tsx` - 항공 AWB 조회
7. `/logis/sr/sea/page.tsx` - S/R 조회
8. `/logis/sn/sea/page.tsx` - S/N 조회
9. `/logis/manifest/sea/page.tsx` - 적하목록 조회
10. `/logis/transport/request/page.tsx` - 운송요청 조회
11. `/logis/transport/manage/page.tsx` - 운송관리
12. `/logis/export/vgm/page.tsx` - VGM
13. `/logis/cost/payment/page.tsx` - 정산관리
14. `/logis/import-bl/sea/arrival/page.tsx` - 도착통지 조회

### 8.2 등록/상세 화면 (저장 상태 출력)
1. `/logis/quote/sea/register/page.tsx` - 해상 견적 등록
2. `/logis/quote/air/register/page.tsx` - 항공 견적 등록
3. `/logis/booking/sea/register/page.tsx` - 해상 부킹 등록
4. `/logis/booking/air/register/page.tsx` - 항공 부킹 등록
5. `/logis/import-bl/sea/register/page.tsx` - 해상 B/L 등록
6. `/logis/import-bl/air/register/page.tsx` - 항공 AWB 등록
7. `/logis/sr/sea/register/page.tsx` - S/R 등록
8. `/logis/sn/sea/register/page.tsx` - S/N 등록
9. `/logis/manifest/sea/register/page.tsx` - 적하목록 등록
10. `/logis/import-bl/sea/[id]/page.tsx` - 해상 B/L 상세
11. `/logis/import-bl/air/[id]/page.tsx` - 항공 AWB 상세
12. `/logis/quote/sea/[id]/page.tsx` - 해상 견적 상세
13. `/logis/quote/air/[id]/page.tsx` - 항공 견적 상세
14. `/logis/booking/sea/[id]/page.tsx` - 해상 부킹 상세
15. `/logis/booking/air/[id]/page.tsx` - 항공 부킹 상세

## 9. 구현 순서

1. **Phase 1: 공통 컴포넌트**
   - ReportPrintButton 컴포넌트
   - ReportPrintModal 컴포넌트
   - 보고서 공통 스타일

2. **Phase 2: 보고서 템플릿**
   - 각 보고서 유형별 템플릿 컴포넌트
   - 인쇄 CSS 스타일

3. **Phase 3: 페이지 적용**
   - 조회 화면 출력 버튼 추가
   - 등록/상세 화면 출력 버튼 추가

4. **Phase 4: 테스트**
   - 각 보고서 출력 테스트
   - 다중 선택 출력 테스트
   - PDF 다운로드 테스트
