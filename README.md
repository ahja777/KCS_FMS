# FMS (Forwarder Management System)

인터지스 통합물류플랫폼의 FMS 웹 애플리케이션입니다.

Cloud 기반 통합 물류 Platform으로 포워딩/창고관리/운송관리/가시성관리/정산관리 등 국제 수출입 포워더 전 영역의 통합 기능을 제공합니다.

## 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MariaDB/MySQL
- **State Management**: React Hooks (useState, useMemo)

## 주요 기능

### 물류견적관리 (Quote)
- 해상 견적관리
- 항공 견적관리
- 견적요청 등록/조회

### 운송의뢰관리 (Transport)
- 운송견적 관리
- 운송의뢰 관리
- 운송관리 조회
- 운송상태 정보조회

### 부킹관리 (Booking)
- 해상 부킹관리
- 항공 부킹관리

### B/L 관리
- 수입 B/L 관리 (해상)
- 수출 B/L 관리

### 기타
- 화물현황 조회
- 창고관리
- 비용/정산 관리
- 콘솔 B/L Import
- Agent 운영 관리

## 공통 기능

모든 조회 페이지에 구현된 기능:
- **실시간 필터링**: useMemo 기반 성능 최적화
- **상태별 요약 카드**: 클릭 시 즉시 필터링
- **검색 조건**: 다양한 필터 옵션 지원
- **체크박스 선택**: 개별/전체 선택
- **Excel 다운로드**: 조회 데이터 내보내기

## 시작하기

### 요구사항
- Node.js 18+
- npm 또는 yarn

### 설치

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

### 환경 변수

```env
DATABASE_URL=mysql://user:password@host:port/database
```

## 프로젝트 구조

```
src/
├── app/
│   ├── api/              # API 라우트
│   ├── logis/            # 물류 메뉴 페이지
│   │   ├── quote/        # 견적관리
│   │   ├── transport/    # 운송관리
│   │   ├── booking/      # 부킹관리
│   │   ├── import-bl/    # 수입 B/L
│   │   ├── export-bl/    # 수출 B/L
│   │   ├── cargo/        # 화물현황
│   │   ├── warehouse/    # 창고관리
│   │   ├── cost/         # 비용정산
│   │   ├── console/      # 콘솔관리
│   │   └── agent/        # Agent관리
│   └── ...
├── components/           # 공통 컴포넌트
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   └── ...
├── lib/                  # 유틸리티
└── types/                # TypeScript 타입 정의
```

## 주요 문서 유형

| 코드 | 문서명 | 설명 |
|------|--------|------|
| S/O | Shipping Order | 선적 오더 |
| B/L | Bill of Lading | 선하증권 |
| AWB | Air Waybill | 항공화물운송장 |
| A/N | Arrival Notice | 도착 통지 |
| D/O | Delivery Order | 인도 지시서 |

## 라이선스

Private - 인터지스 내부용
