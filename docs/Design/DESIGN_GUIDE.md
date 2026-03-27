# FMS Web Design Guide

**Material Vivid × Industrial Maritime Luxury**
Premium Dark Theme with Glass Morphism & Noise Texture

---

## 목차

1. [디자인 철학 및 원칙](#1-디자인-철학-및-원칙)
2. [컬러 시스템](#2-컬러-시스템)
3. [타이포그래피](#3-타이포그래피)
4. [스페이싱 시스템](#4-스페이싱-시스템)
5. [컴포넌트 가이드](#5-컴포넌트-가이드)
6. [아이콘 시스템](#6-아이콘-시스템)
7. [레이아웃 패턴](#7-레이아웃-패턴)
8. [애니메이션 & 인터랙션](#8-애니메이션--인터랙션)
9. [다크모드 지원](#9-다크모드-지원)
10. [Tone & Manner 가이드](#10-tone--manner-가이드)
11. [메뉴별 디자인 가이드](#11-메뉴별-디자인-가이드)
12. [페이지 유형별 디자인 패턴](#12-페이지-유형별-디자인-패턴)
13. [코드 스니펫 & 예제](#13-코드-스니펫--예제)

---

## 1. 디자인 철학 및 원칙

### 1.1 디자인 컨셉

**Material Vivid × Industrial Maritime Luxury**

FMS(Freight Management System) 웹 애플리케이션은 물류 산업의 전문성과 신뢰감을 현대적이고 세련된 디자인으로 표현합니다.

#### 핵심 키워드
- **Premium**: 고급스러운 골드 악센트와 딥 네이비 기반
- **Trust**: 안정적이고 신뢰감 있는 색상 체계
- **Modern**: Glass Morphism과 미묘한 노이즈 텍스처
- **Functional**: 데이터 중심의 명확한 정보 계층

### 1.2 디자인 원칙

| 원칙 | 설명 |
|------|------|
| **Clarity First** | 복잡한 물류 데이터를 명확하게 전달 |
| **Visual Hierarchy** | 정보의 중요도에 따른 시각적 계층 구조 |
| **Consistency** | 일관된 컴포넌트와 패턴 사용 |
| **Accessibility** | 충분한 명도 대비와 직관적인 인터랙션 |
| **Performance** | 최적화된 애니메이션과 렌더링 |

### 1.3 물류 플랫폼 특화 디자인 방향성

```
┌─────────────────────────────────────────────────────────────┐
│  FMS Design Philosophy                                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐           │
│  │  Maritime │ +  │  Premium  │ +  │  Modern   │           │
│  │   Navy    │    │   Gold    │    │   Glass   │           │
│  └───────────┘    └───────────┘    └───────────┘           │
│        ↓                ↓                ↓                  │
│   신뢰와 안정       고급스러움        현대적 감각            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 컬러 시스템

### 2.1 Core Palette - Deep Navy Dominant

| 변수명 | HEX 값 | 용도 |
|--------|--------|------|
| `--navy-950` | `#030712` | 가장 어두운 배경 |
| `--navy-900` | `#0A1628` | 기본 배경 (surface-base) |
| `--navy-800` | `#0F1D32` | 약간 밝은 배경 |
| `--navy-700` | `#162544` | Elevated 표면 |
| `--navy-600` | `#1E3A5F` | 카드 배경 |
| `--navy-500` | `#2563EB` | Primary Blue |

```css
/* CSS Variables */
--navy-950: #030712;
--navy-900: #0A1628;
--navy-800: #0F1D32;
--navy-700: #162544;
--navy-600: #1E3A5F;
--navy-500: #2563EB;
```

### 2.2 Accent - Warm Gold

| 변수명 | HEX 값 | 용도 |
|--------|--------|------|
| `--gold-300` | `#F5D98A` | 밝은 골드 (하이라이트) |
| `--gold-400` | `#E8C468` | 호버 상태 |
| `--gold-500` | `#D4A853` | 기본 악센트 |
| `--gold-600` | `#B8923F` | 버튼 그라데이션 끝 |

```css
/* Gold Palette */
--gold-500: #D4A853;
--gold-400: #E8C468;
--gold-300: #F5D98A;
--gold-600: #B8923F;
```

### 2.3 Semantic Colors

| 상태 | 기본 색상 | Muted (15% 투명도) |
|------|----------|-------------------|
| Success | `#10B981` | `rgba(16, 185, 129, 0.15)` |
| Warning | `#F59E0B` | `rgba(245, 158, 11, 0.15)` |
| Error | `#EF4444` | `rgba(239, 68, 68, 0.15)` |
| Info | `#3B82F6` | `rgba(59, 130, 246, 0.15)` |

```css
/* Semantic Colors */
--success: #10B981;
--success-muted: rgba(16, 185, 129, 0.15);
--warning: #F59E0B;
--warning-muted: rgba(245, 158, 11, 0.15);
--error: #EF4444;
--error-muted: rgba(239, 68, 68, 0.15);
--info: #3B82F6;
--info-muted: rgba(59, 130, 246, 0.15);
```

### 2.4 Surface System - Glass Morphism Ready

| 변수명 | 값 | 용도 |
|--------|-----|------|
| `--surface-base` | `#0A1628` | 기본 배경 |
| `--surface-elevated` | `rgba(22, 37, 68, 0.7)` | 부유 컴포넌트 |
| `--surface-card` | `rgba(30, 58, 95, 0.4)` | 카드 배경 |
| `--surface-hover` | `rgba(37, 99, 235, 0.08)` | 호버 상태 |
| `--surface-active` | `rgba(37, 99, 235, 0.12)` | 활성 상태 |

### 2.5 Text Hierarchy

| 변수명 | HEX 값 | 용도 |
|--------|--------|------|
| `--text-primary` | `#F8FAFC` | 주요 텍스트 |
| `--text-secondary` | `#94A3B8` | 보조 텍스트 |
| `--text-muted` | `#64748B` | 비활성/힌트 텍스트 |
| `--text-accent` | `#D4A853` | 강조 텍스트 |

### 2.6 카테고리별 색상 (물류 도메인)

| 카테고리 | 색상 | HEX | 사용처 |
|----------|------|-----|--------|
| 해상수출 | Blue | `#3B82F6` | 메뉴 아이콘, 상태 뱃지, 차트 |
| 해상수입 | Green | `#10B981` | 메뉴 아이콘, 상태 뱃지, 차트 |
| 항공수출 | Purple | `#8B5CF6` | 메뉴 아이콘, 상태 뱃지, 차트 |
| 항공수입 | Amber | `#F59E0B` | 메뉴 아이콘, 상태 뱃지, 차트 |
| OMS | Pink | `#EC4899` | 메뉴 아이콘, 상태 뱃지, 차트 |
| 공통 | Gray | `#64748B` | 메뉴 아이콘, 상태 뱃지, 차트 |

---

## 3. 타이포그래피

### 3.1 Font Family

| 변수명 | 폰트 | 용도 |
|--------|------|------|
| `--font-display` | `'Outfit', -apple-system, BlinkMacSystemFont, sans-serif` | 제목, 레이블 |
| `--font-body` | `'Outfit', -apple-system, BlinkMacSystemFont, sans-serif` | 본문 텍스트 |
| `--font-mono` | `'JetBrains Mono', 'SF Mono', monospace` | 숫자, 코드, B/L 번호 |

### 3.2 Size Scale

| 크기 | rem | px | 용도 |
|------|-----|-----|------|
| xs | 0.6875rem | 11px | 뱃지, 레이블 |
| sm | 0.875rem | 14px | 기본 본문 |
| base | 1rem | 16px | 큰 본문 |
| lg | 1.125rem | 18px | 서브 제목 |
| xl | 1.25rem | 20px | 섹션 제목 |
| 2xl | 1.5rem | 24px | 페이지 제목 |
| 3xl | 1.875rem | 30px | 대시보드 숫자 |
| 4xl | 2.25rem | 36px | 히어로 숫자 |

### 3.3 Font Weight

| 굵기 | 값 | 용도 |
|------|-----|------|
| Regular | 400 | 본문 텍스트 |
| Medium | 500 | 버튼, 링크 |
| Semibold | 600 | 제목, 강조 |
| Bold | 700 | 주요 제목 |

### 3.4 숫자 표기 규칙

숫자 표시에는 항상 `font-mono`와 tabular figures를 사용합니다.

```css
.number-display {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' on, 'lnum' on;
  letter-spacing: -0.02em;
}
```

### 3.5 Heading Styles

```css
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.2;
  color: var(--text-primary);
}
```

---

## 4. 스페이싱 시스템

### 4.1 8px Grid System

기본 단위: **8px**

| 토큰 | 값 | 용도 |
|------|-----|------|
| `space-1` | 4px | 최소 간격 |
| `space-2` | 8px | 요소 내부 간격 |
| `space-3` | 12px | 소형 패딩 |
| `space-4` | 16px | 기본 패딩 |
| `space-5` | 20px | 카드 헤더 패딩 |
| `space-6` | 24px | 카드 바디 패딩 |
| `space-8` | 32px | 섹션 간격 |
| `space-10` | 40px | 대형 간격 |

### 4.2 컴포넌트별 패딩 규칙

| 컴포넌트 | Padding |
|----------|---------|
| Button (small) | `8px 16px` |
| Button (default) | `12px 28px` |
| Input | `12px 16px` |
| Card Header | `20px 24px` |
| Card Body | `24px` |
| Stat Card | `24px` |
| Badge | `4px 10px` |
| Modal | `24px 32px` |

### 4.3 Border Radius

| 용도 | 값 |
|------|-----|
| Small (뱃지) | `8px` |
| Medium (버튼, 인풋) | `12px` |
| Large (카드) | `20px` |
| Circle | `9999px` |

---

## 5. 컴포넌트 가이드

### 5.1 Cards

#### 기본 카드 (`.card`)

```css
.card {
  background: var(--glass-bg);           /* rgba(22, 37, 68, 0.6) */
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border); /* rgba(255, 255, 255, 0.08) */
  border-radius: 20px;
  box-shadow: var(--shadow-card);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  border-color: var(--border-accent);    /* rgba(212, 168, 83, 0.3) */
  box-shadow: var(--shadow-card), var(--shadow-glow);
  transform: translateY(-2px);
}
```

#### Stat Card (`.stat-card`)

KPI 표시용 프리미엄 카드

```css
.stat-card {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  padding: 24px;
  box-shadow: var(--shadow-card);
}

.stat-card:hover {
  border-color: var(--border-accent);
  transform: translateY(-4px) scale(1.02);
}

/* 상단 골드 라인 (hover 시 표시) */
.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--gold-500), var(--gold-400), var(--gold-500));
  opacity: 0;
  transition: opacity 0.3s;
}

.stat-card:hover::before {
  opacity: 1;
}
```

### 5.2 Buttons

#### Filled Button (Primary)

```css
.btn-filled {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 28px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--gold-500) 0%, var(--gold-600) 100%);
  color: var(--navy-900);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 14px;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(212, 168, 83, 0.3);
}

.btn-filled:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(212, 168, 83, 0.4);
}

.btn-filled:active {
  transform: translateY(0) scale(0.98);
}
```

#### Outline Button (Secondary)

```css
.btn-outline {
  padding: 12px 28px;
  border-radius: 12px;
  background: transparent;
  color: var(--gold-500);
  font-weight: 600;
  border: 1px solid var(--gold-500);
}

.btn-outline:hover {
  background: rgba(212, 168, 83, 0.1);
  border-color: var(--gold-400);
}
```

#### Ghost Button (Tertiary)

```css
.btn-ghost {
  padding: 12px 28px;
  border-radius: 12px;
  background: transparent;
  color: var(--text-secondary);
  font-weight: 500;
  border: 1px solid var(--border-default);
}

.btn-ghost:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
  border-color: var(--border-accent);
}
```

### 5.3 Badges

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

/* 상태별 배지 */
.badge-success { background: var(--success-muted); color: var(--success); }
.badge-warning { background: var(--warning-muted); color: var(--warning); }
.badge-error   { background: var(--error-muted);   color: var(--error);   }
.badge-info    { background: var(--info-muted);    color: var(--info);    }
.badge-gold    { background: rgba(212, 168, 83, 0.15); color: var(--gold-500); }
```

### 5.4 Form Elements

```css
input[type="text"],
input[type="email"],
input[type="password"],
input[type="search"],
textarea,
select {
  background: var(--surface-card);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  padding: 12px 16px;
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 14px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: var(--gold-500);
  box-shadow: 0 0 0 3px rgba(212, 168, 83, 0.15);
}

input::placeholder {
  color: var(--text-muted);
}
```

### 5.5 Progress & Loading

#### Skeleton Loading

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--surface-card) 25%,
    var(--surface-elevated) 50%,
    var(--surface-card) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

#### Spinner

```css
.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-default);
  border-top-color: var(--gold-500);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## 6. 아이콘 시스템

### 6.1 아이콘 라이브러리

**Heroicons (Outline)**을 기본으로 사용하며, SVG 형태로 직접 삽입합니다.

### 6.2 아이콘 크기 규칙

| 크기 | px | 용도 |
|------|-----|------|
| xs | 14px | 인라인 아이콘 |
| sm | 16px | 뱃지, 작은 버튼 |
| md | 20px | 기본 버튼, 메뉴 |
| lg | 24px | 네비게이션 |
| xl | 32px | 히어로 섹션 |

### 6.3 아이콘 색상 규칙

```css
/* 기본 상태 */
.icon-default {
  color: var(--text-muted);        /* #64748B */
}

/* 호버 상태 */
.icon-hover:hover {
  color: var(--text-secondary);    /* #94A3B8 */
}

/* 활성 상태 */
.icon-active {
  color: var(--gold-500);          /* #D4A853 */
}

/* Stroke Width */
svg {
  stroke-width: 1.5;  /* 기본 */
  stroke-width: 2;    /* 강조 */
}
```

### 6.4 주요 아이콘 예시

```html
<!-- Dashboard -->
<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
    d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z..." />
</svg>

<!-- Shipment/Logistics -->
<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
</svg>

<!-- Search -->
<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
</svg>
```

---

## 7. 레이아웃 패턴

### 7.1 기본 레이아웃 구조

```
┌──────────────────────────────────────────────────────────────────┐
│                         Viewport                                  │
├────────────┬─────────────────────────────────────────────────────┤
│            │                  Header (h: 80px)                    │
│  Sidebar   ├─────────────────────────────────────────────────────┤
│ (w: 288px) │                                                     │
│            │                    Main Content                      │
│            │                 (padding: 32px)                      │
│            │                                                     │
│            │                                                     │
│  fixed     │                                                     │
│  left: 0   │                                                     │
│            │                                                     │
└────────────┴─────────────────────────────────────────────────────┘
```

### 7.2 Sidebar 스펙

```css
aside {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: 288px;  /* 18rem / w-72 */
  z-index: 40;
  background: linear-gradient(180deg, #0A1628 0%, #030712 100%);
}
```

### 7.3 Header 스펙

```css
header {
  height: 80px;  /* 5rem / h-20 */
  position: sticky;
  top: 0;
  z-index: 30;
  backdrop-filter: blur(16px);
  background: rgba(var(--color-surface-container-low-rgb), 0.85);
  border-bottom: 1px solid var(--color-outline-variant);
}
```

### 7.4 Main Content

```css
main {
  margin-left: 288px;  /* Sidebar width */
  min-height: 100vh;
  padding: 32px;
}
```

### 7.5 Grid System

#### KPI Cards (4-Column)

```css
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

/* Responsive */
@media (max-width: 1280px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }
}
```

#### Chart Section (2-Column)

```css
.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

@media (max-width: 1024px) {
  .chart-grid {
    grid-template-columns: 1fr;
  }
}
```

### 7.6 Responsive Breakpoints

| 브레이크포인트 | 너비 | 용도 |
|----------------|------|------|
| sm | 640px | 모바일 |
| md | 768px | 태블릿 |
| lg | 1024px | 작은 데스크탑 |
| xl | 1280px | 데스크탑 |
| 2xl | 1536px | 대형 모니터 |

---

## 8. 애니메이션 & 인터랙션

### 8.1 Easing Function

모든 트랜지션에 사용하는 기본 이징:

```css
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

### 8.2 기본 애니메이션

#### Fade In

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fade-in {
  animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
```

#### Slide Up

```css
@keyframes slideUp {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
```

#### Slide In Left

```css
@keyframes slideInLeft {
  0% { opacity: 0; transform: translateX(-30px); }
  100% { opacity: 1; transform: translateX(0); }
}

.animate-slide-in-left {
  animation: slideInLeft 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
```

#### Scale In

```css
@keyframes scaleIn {
  0% { opacity: 0; transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1); }
}

.animate-scale-in {
  animation: scaleIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
```

### 8.3 특수 효과 애니메이션

#### Shimmer (Loading)

```css
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.animate-shimmer {
  background: linear-gradient(90deg, transparent, rgba(212, 168, 83, 0.1), transparent);
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}
```

#### Pulse Glow

```css
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(212, 168, 83, 0.3); }
  50% { box-shadow: 0 0 40px rgba(212, 168, 83, 0.5); }
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}
```

#### Float

```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}
```

### 8.4 Staggered Animation

```css
.stagger-1 { animation-delay: 0.05s; }
.stagger-2 { animation-delay: 0.1s; }
.stagger-3 { animation-delay: 0.15s; }
.stagger-4 { animation-delay: 0.2s; }
.stagger-5 { animation-delay: 0.25s; }
.stagger-6 { animation-delay: 0.3s; }
```

### 8.5 State Layer (M3 Pattern)

Material Design 3 스타일의 상태 레이어:

```css
.state-layer {
  position: relative;
  isolation: isolate;
}

.state-layer::before {
  content: '';
  position: absolute;
  inset: 0;
  background-color: var(--gold-500);
  opacity: 0;
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
  border-radius: inherit;
}

.state-layer:hover::before { opacity: 0.08; }
.state-layer:focus-visible::before { opacity: 0.12; }
.state-layer:active::before { opacity: 0.16; }
```

### 8.6 Hover/Focus/Active States

| 상태 | 효과 |
|------|------|
| Hover | `transform: translateY(-2px)` + 밝은 border |
| Focus | `box-shadow: 0 0 0 3px rgba(212, 168, 83, 0.15)` |
| Active | `transform: scale(0.98)` |

### 8.7 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. 다크모드 지원

### 9.1 CSS Variables 활용

현재 FMS는 다크 모드 기본 테마입니다. 라이트 모드를 추가할 경우:

```css
/* 다크 모드 (기본) */
:root {
  --surface-base: #0A1628;
  --text-primary: #F8FAFC;
  --text-secondary: #94A3B8;
  /* ... */
}

/* 라이트 모드 */
:root.light,
[data-theme="light"] {
  --surface-base: #F8FAFC;
  --text-primary: #0F172A;
  --text-secondary: #475569;
  /* ... */
}
```

### 9.2 컬러 매핑 규칙

| 용도 | Dark Mode | Light Mode |
|------|-----------|------------|
| Background | `#0A1628` | `#F8FAFC` |
| Surface | `rgba(22, 37, 68, 0.6)` | `#FFFFFF` |
| Text Primary | `#F8FAFC` | `#0F172A` |
| Text Secondary | `#94A3B8` | `#475569` |
| Border | `rgba(148, 163, 184, 0.2)` | `#E2E8F0` |
| Accent | `#D4A853` | `#B8923F` |

---

## 10. Tone & Manner 가이드

### 10.1 글로벌 Tone & Manner

| 항목 | 설명 | 적용 예시 |
|------|------|----------|
| **전문적 (Professional)** | 물류 업계의 신뢰를 반영하는 격식 있는 톤 | "선적 완료" vs "선적됐어요!" |
| **명확함 (Clarity)** | 데이터와 상태를 명확하게 전달 | "B/L 3건 등록됨" vs "몇 건의 B/L이 등록됨" |
| **효율적 (Efficient)** | 불필요한 장식 배제, 핵심 정보 중심 | "검색" vs "검색하기" |
| **일관성 (Consistency)** | 용어와 패턴의 일관된 사용 | 모든 화면에서 동일한 상태 표현 |
| **신뢰성 (Trustworthy)** | 안정감 있는 색상과 레이아웃 | Deep Navy + Gold 조합 |

### 10.2 물류 도메인 용어

| 약어 | 전체명 | 한글 |
|------|--------|------|
| B/L | Bill of Lading | 선하증권 |
| AWB | Air Waybill | 항공화물운송장 |
| S/O | Shipping Order | 선적오더 |
| D/O | Delivery Order | 인도지시서 |
| A/N | Arrival Notice | 도착통지 |
| S/R | Shipping Request | 선적요청 |
| S/N | Shipping Notice | 선적통지 |
| TEU | Twenty-foot Equivalent Unit | 20피트 컨테이너 단위 |
| ETD | Estimated Time of Departure | 출발예정일시 |
| ETA | Estimated Time of Arrival | 도착예정일시 |
| ATD | Actual Time of Departure | 실제출발일시 |
| ATA | Actual Time of Arrival | 실제도착일시 |
| POL | Port of Loading | 선적항 |
| POD | Port of Discharge | 양하항 |
| MBL | Master Bill of Lading | 선사B/L |
| HBL | House Bill of Lading | 포워더B/L |
| MAWB | Master Air Waybill | 항공사AWB |
| HAWB | House Air Waybill | 포워더AWB |
| CLP | Container Load Plan | 컨테이너적입계획 |
| VGM | Verified Gross Mass | 컨테이너검증중량 |

### 10.3 데이터 시각화 원칙

1. **숫자는 모노스페이스 폰트로**: 정렬과 가독성 향상
2. **금액에는 천 단위 쉼표**: `1,234,567`
3. **날짜 형식 통일**: `YYYY-MM-DD` 또는 `MM/DD`
4. **상태는 색상 + 텍스트**: 색상만으로 의존하지 않음
5. **단위 표시**: TEU, CBM, KG 등 명확히 표기

### 10.4 UI 텍스트 작성 가이드

| DO | DON'T |
|----|-------|
| "선적 완료" | "선적이 완료되었습니다!" |
| "B/L 3건 등록됨" | "3건의 B/L이 등록됨" |
| "저장" | "저장하기" |
| "취소" | "취소하기" |
| "검색" | "검색하기" |
| "삭제" | "삭제하기" |
| "등록" | "등록하기" |
| "수정" | "수정하기" |
| "확인" | "확인하기" |

### 10.5 버튼 레이블 규칙

| 카테고리 | Primary 버튼 | Secondary 버튼 |
|----------|-------------|---------------|
| 저장 관련 | 저장, 등록, 확정 | 임시저장 |
| 삭제 관련 | 삭제 | 취소 |
| 검색 관련 | 검색 | 초기화 |
| 전송 관련 | 전송, 발송 | 미리보기 |
| 인쇄 관련 | 인쇄, 출력 | PDF저장 |

---

## 11. 메뉴별 디자인 가이드

### 11.1 메뉴 구조 개요

```
Dashboard (/)
│
├─ Logis (/logis)
│  ├─ 해상수출 (Sea Export) - Blue Theme
│  ├─ 해상수입 (Sea Import) - Green Theme
│  ├─ 항공수출 (Air Export) - Purple Theme
│  ├─ 항공수입 (Air Import) - Amber Theme
│  ├─ OMS (Order Management) - Pink Theme
│  └─ 공통 (Common) - Gray Theme
│
├─ Shipments - 통합 선적 관리
├─ B/L Management - 통합 B/L 관리
├─ Schedules - 통합 스케줄 관리
└─ Billing - 정산 관리
```

---

### 11.2 해상수출 (Sea Export) - Blue Theme

**색상 코드**: `#3B82F6` (Blue-500)
**보조 색상**: `#DBEAFE` (Blue-100), `#1E40AF` (Blue-800)

#### 핵심 컨셉
- **신뢰성과 안정성**: 바다의 깊이를 연상시키는 블루 계열
- **전문성 강조**: 수출 업무의 복잡성을 명확하게 정리
- **프로세스 가시성**: 견적 → 부킹 → 선적 → B/L 흐름 표현

#### 상태 뱃지 디자인

| 상태 | 배경색 | 텍스트색 | 레이블 |
|------|--------|----------|--------|
| REQUEST | `#DBEAFE` | `#2563EB` | 부킹요청 |
| CONFIRM | `#D1FAE5` | `#059669` | 부킹확정 |
| CANCEL | `#FEE2E2` | `#DC2626` | 부킹취소 |
| DRAFT | `#F3F4F6` | `#6B7280` | 작성중 |
| ISSUED | `#D1FAE5` | `#059669` | 발행완료 |
| SURRENDERED | `#DBEAFE` | `#2563EB` | Surrendered |

#### 해상수출 페이지별 가이드

##### 견적관리 (`/logis/quote/sea`)

**목적**: 해상 수출 운임 견적 생성 및 관리

**레이아웃 구조**:
```
┌─────────────────────────────────────────────────────────┐
│ Header: 해상수출 견적관리                                 │
├─────────────────────────────────────────────────────────┤
│ 검색 영역 (Collapsible)                                  │
│ ├─ 날짜범위 | 견적번호 | 화주 | POL/POD | 상태          │
│ └─ [검색] [초기화]                                       │
├─────────────────────────────────────────────────────────┤
│ 액션 바                                                  │
│ ├─ 선택: 0건                                            │
│ └─ [등록] [삭제] [엑셀] [이메일] [인쇄]                  │
├─────────────────────────────────────────────────────────┤
│ 데이터 테이블                                            │
│ ├─ 체크박스 | 상태 | 견적번호 | 견적일자 | 화주 | ...   │
│ └─ 페이지네이션                                          │
└─────────────────────────────────────────────────────────┘
```

**컬럼 우선순위**:
1. 상태 (badge)
2. 견적번호 (링크, 모노스페이스)
3. 견적일자
4. 화주명
5. POL/POD
6. 컨테이너
7. 선사
8. 유효기간
9. 견적금액 (우측정렬, 통화표시)

**인터랙션**:
- 행 클릭: 상세 패널 또는 상세 페이지로 이동
- 더블클릭: 편집 모드 진입
- 상태 뱃지: 클릭 시 필터링

##### 부킹관리 (`/logis/booking/sea`)

**목적**: 해상 수출 부킹 요청/확정 관리

**상태 흐름 표시**:
```
[작성중] → [부킹요청] → [부킹확정] → [선적진행]
   ↓
[부킹취소]
```

**특수 표시**:
- 위험물(DG): 빨간색 아이콘 표시
- 냉동화물(REEFER): 파란색 아이콘 표시
- 중량초과: 경고 아이콘 표시

**Split View 디자인**:
- 좌측 60%: 부킹 목록
- 우측 40%: 선택된 부킹 상세 정보

##### S/R 선적요청 (`/logis/sr/sea`)

**목적**: 선적 요청서(Shipping Request) 관리

**핵심 정보 표시**:
- S/R No. (고유 식별자)
- 부킹 연계 정보
- 선사/선명/항차
- 컨테이너 정보

##### S/N 선적통지 (`/logis/sn/sea`)

**목적**: 선적 통지서(Shipping Notice) 관리

**핵심 정보 표시**:
- S/N No.
- 실제 선적일 (ATD)
- B/L 연계 정보

##### B/L 관리 (`/logis/bl/sea`)

**목적**: MBL/HBL 통합 관리

**이중 레벨 뷰**:
```
┌─────────────────────────────────────────────────────────┐
│ MBL Level (Master B/L)                                   │
│ ├─ MBL No: MAEU123456789                                │
│ ├─ Vessel/Voyage: HANJIN BUSAN / 001E                   │
│ └─ HBL Count: 3                                          │
│     ├─ HBL2026010001 - 삼성전자                         │
│     ├─ HBL2026010002 - LG전자                           │
│     └─ HBL2026010003 - 현대자동차                       │
└─────────────────────────────────────────────────────────┘
```

**B/L 타입 표시**:
- ORI: Original (정본)
- SWB: Sea Waybill (해상화물운송장)
- TLX: Telex Release (전신양도)

##### STUFFING/CLP/VGM

**목적**: 컨테이너 적입 및 검증 중량 관리

**시각화 요소**:
- 컨테이너 적입률 게이지
- VGM 상태 표시
- CLP 확정 여부

---

### 11.3 해상수입 (Sea Import) - Green Theme

**색상 코드**: `#10B981` (Emerald-500)
**보조 색상**: `#D1FAE5` (Emerald-100), `#065F46` (Emerald-800)

#### 핵심 컨셉
- **도착과 안전**: 안전한 도착을 상징하는 그린 계열
- **통관 중심**: 수입 통관 프로세스 강조
- **타임라인 표시**: ETA/ATA 중심의 시간 관리

#### 상태 뱃지 디자인

| 상태 | 배경색 | 텍스트색 | 레이블 |
|------|--------|----------|--------|
| ARRIVAL | `#D1FAE5` | `#059669` | 도착 |
| CUSTOMS | `#FEF3C7` | `#D97706` | 통관중 |
| CLEARED | `#D1FAE5` | `#059669` | 통관완료 |
| DELIVERED | `#DBEAFE` | `#2563EB` | 인도완료 |
| PENDING | `#F3F4F6` | `#6B7280` | 대기 |

#### 해상수입 페이지별 가이드

##### B/L 관리 (`/logis/import-bl/sea`)

**목적**: 수입 B/L 관리 및 D/O 발행

**타임라인 표시**:
```
ETD → ETA → ATA → 통관 → D/O → 화물인도
 ↓     ↓     ↓
[날짜] [날짜] [날짜]
```

##### 도착관리 (A/N) (`/logis/import-bl/sea/arrival`)

**목적**: 도착통지서(Arrival Notice) 관리

**핵심 정보**:
- 예상도착일 (ETA)
- 실제도착일 (ATA)
- A/N 발송 상태
- 화물 상태

##### 통관관리 (`/logis/customs/sea`)

**목적**: 수입 통관 진행 관리

**통관 상태 표시**:
```
[접수] → [심사] → [검사] → [수리] → [완료]
```

**경고 표시**:
- 검사대상: 빨간색 강조
- 보류건: 주황색 강조
- 정상진행: 초록색 표시

##### 화물반출입 (`/logis/cargo/release`)

**목적**: 화물 반출/반입 관리

**상태 표시**:
- 보세구역 재고
- 반출 예정
- 반출 완료

---

### 11.4 항공수출 (Air Export) - Purple Theme

**색상 코드**: `#8B5CF6` (Violet-500)
**보조 색상**: `#EDE9FE` (Violet-100), `#5B21B6` (Violet-800)

#### 핵심 컨셉
- **속도와 프리미엄**: 항공 운송의 신속함과 고급스러움
- **AWB 중심**: MAWB/HAWB 관리 강조
- **시간 민감성**: 긴급 화물, 시간 제약 표시

#### 상태 뱃지 디자인

| 상태 | 배경색 | 텍스트색 | 레이블 |
|------|--------|----------|--------|
| BOOKED | `#EDE9FE` | `#7C3AED` | 부킹완료 |
| DEPARTED | `#D1FAE5` | `#059669` | 출발 |
| IN_TRANSIT | `#DBEAFE` | `#2563EB` | 운송중 |
| ARRIVED | `#D1FAE5` | `#059669` | 도착 |
| IRRE | `#FEE2E2` | `#DC2626` | 사고/예외 |

#### 항공수출 페이지별 가이드

##### 견적관리 (`/logis/quote/air`)

**목적**: 항공 수출 운임 견적 관리

**특수 필드**:
- Chargeable Weight (청구중량)
- Volume Weight (용적중량)
- 항공사 운임 조건

##### 부킹관리 (`/logis/booking/air`)

**목적**: 항공 부킹 및 Space 확보

**Booking Merge 표시**:
- 동일 편명 부킹 그룹화
- 총 중량/부피 합계 표시

##### AWB 관리 (`/logis/bl/air`)

**목적**: MAWB/HAWB 통합 관리

**AWB 번호 형식**:
```
MAWB: 180-12345678 (항공사코드-번호)
HAWB: HAWB2026010001
```

##### Pre-Alert (`/logis/pre-alert/air`)

**목적**: 사전 통지 발송 관리

**Pre-Alert 상태**:
- 발송대기
- 발송완료
- 확인완료

---

### 11.5 항공수입 (Air Import) - Amber Theme

**색상 코드**: `#F59E0B` (Amber-500)
**보조 색상**: `#FEF3C7` (Amber-100), `#B45309` (Amber-800)

#### 핵심 컨셉
- **신속한 처리**: 항공 수입의 빠른 처리 강조
- **도착 관리 중심**: ETA/ATA 및 통관 처리
- **긴급성 표시**: 시간 민감 화물 강조

#### 상태 뱃지 디자인

| 상태 | 배경색 | 텍스트색 | 레이블 |
|------|--------|----------|--------|
| SCHEDULED | `#FEF3C7` | `#D97706` | 예정 |
| ARRIVED | `#D1FAE5` | `#059669` | 도착 |
| CUSTOMS | `#FEF3C7` | `#D97706` | 통관중 |
| RELEASED | `#D1FAE5` | `#059669` | 반출완료 |

#### 항공수입 페이지별 가이드

##### AWB 관리 (`/logis/import-bl/air`)

**목적**: 수입 AWB 관리

**핵심 정보 표시**:
- MAWB/HAWB 연계
- 도착 스케줄
- 통관 진행 상태

##### 도착관리 (A/N) (`/logis/import-bl/air/arrival`)

**목적**: 항공 도착 관리

**실시간 추적**:
- 항공편 추적 연동
- 예상도착시간 실시간 업데이트

---

### 11.6 OMS (Order Management System) - Pink Theme

**색상 코드**: `#EC4899` (Pink-500)
**보조 색상**: `#FCE7F3` (Pink-100), `#9D174D` (Pink-800)

#### 핵심 컨셉
- **고객 중심**: 고객 오더 관리 강조
- **서비스 통합**: 다양한 서비스 유형 통합
- **워크플로우 관리**: 오더 → 서비스 → 실행 흐름

#### 상태 뱃지 디자인

| 상태 | 배경색 | 텍스트색 | 레이블 |
|------|--------|----------|--------|
| NEW | `#FCE7F3` | `#DB2777` | 신규 |
| PROCESSING | `#DBEAFE` | `#2563EB` | 처리중 |
| COMPLETED | `#D1FAE5` | `#059669` | 완료 |
| CANCELLED | `#FEE2E2` | `#DC2626` | 취소 |

#### OMS 페이지별 가이드

##### 고객오더 (C/O) (`/logis/oms/customer-order`)

**목적**: 고객 주문 접수 및 관리

**오더 타입 표시**:
- FCL (Full Container Load)
- LCL (Less than Container Load)
- AIR (항공화물)

##### 서비스오더 (S/O) (`/logis/oms/service-order`)

**목적**: 서비스 오더 생성 및 관리

**서비스 유형 표시**:
- 해상 수출
- 해상 수입
- 항공 수출
- 항공 수입
- 내륙 운송

##### S/O Control (`/logis/oms/so-control`)

**목적**: 서비스 오더 진행 현황 모니터링

**대시보드 뷰**:
- 전체 오더 현황
- 진행 상태별 분류
- 긴급 처리 대상

---

### 11.7 공통 (Common) - Gray Theme

**색상 코드**: `#64748B` (Slate-500)
**보조 색상**: `#F1F5F9` (Slate-100), `#334155` (Slate-800)

#### 핵심 컨셉
- **기반 데이터 관리**: 스케줄, 운임, 환율 등 기초 정보
- **범용성**: 모든 모듈에서 공통으로 사용
- **참조 데이터**: 조회 및 선택 중심

#### 공통 페이지별 가이드

##### 스케줄 관리 (`/logis/schedule/sea`, `/logis/schedule/air`)

**목적**: 선박/항공 스케줄 조회 및 관리

**캘린더 뷰 옵션**:
- 월간 캘린더
- 주간 타임라인
- 목록 뷰

**스케줄 정보 표시**:
```
┌─────────────────────────────────────────────────────────┐
│ HANJIN BUSAN / 001E                                      │
│ ├─ ETD: 2026-01-20 (KRPUS)                              │
│ ├─ ETA: 2026-02-05 (USLGB)                              │
│ └─ Transit Time: 16 days                                 │
└─────────────────────────────────────────────────────────┘
```

##### 운임기초정보 (`/logis/rate/base`)

**목적**: 기본 운임 정보 관리

**운임 구성 요소**:
- 기본운임 (Basic Freight)
- 할증료 (Surcharge)
- 부대비용 (Local Charges)

##### 기업운임관리 (`/logis/rate/corporate`)

**목적**: 거래처별 계약 운임 관리

**계약 정보 표시**:
- 계약 기간
- 적용 구간
- 할인율

##### 환율조회 (`/logis/exchange-rate`)

**목적**: 환율 정보 조회 및 관리

**환율 표시 형식**:
```
USD/KRW: 1,350.50 (▲2.50, +0.19%)
EUR/KRW: 1,485.20 (▼1.80, -0.12%)
```

##### 화물추적 (`/logis/tracking`)

**목적**: 화물 실시간 추적

**지도 통합**:
- 실시간 위치 표시
- 경로 시각화
- ETA 계산

---

## 12. 페이지 유형별 디자인 패턴

### 12.1 목록 페이지 (List Page)

**기본 구조**:

```
┌─────────────────────────────────────────────────────────┐
│ Page Header                                              │
│ ├─ Title + Subtitle                                     │
│ └─ Close Button                                          │
├─────────────────────────────────────────────────────────┤
│ Search Section (Collapsible Card)                        │
│ ├─ Row 1: 날짜범위 | 상태 | 키워드                      │
│ ├─ Row 2: 추가 필터 (필요시)                            │
│ └─ Actions: [검색] [초기화]                              │
├─────────────────────────────────────────────────────────┤
│ Action Bar                                               │
│ ├─ Left: 선택 n건 | 필터 태그                           │
│ └─ Right: [등록] [삭제] [Excel] [Email] [Print]         │
├─────────────────────────────────────────────────────────┤
│ Data Table                                               │
│ ├─ Header Row (정렬 가능)                                │
│ ├─ Data Rows (hover 효과, 체크박스)                      │
│ └─ Empty State / Loading State                           │
├─────────────────────────────────────────────────────────┤
│ Pagination                                               │
│ └─ << < 1 2 3 4 5 > >> | 페이지당 표시 개수              │
└─────────────────────────────────────────────────────────┘
```

**검색 영역 디자인**:
```tsx
<div className="bg-[#162544] rounded-xl p-6 mb-4">
  <div className="grid grid-cols-4 gap-4">
    {/* 날짜범위 */}
    <div className="col-span-1">
      <DateRangeButtons />
    </div>
    {/* 상태 필터 */}
    <div className="col-span-1">
      <select className="w-full bg-[#1E3A5F] border border-white/10 rounded-lg px-3 py-2">
        <option value="">전체 상태</option>
      </select>
    </div>
    {/* 검색 입력 */}
    <div className="col-span-2">
      <input
        type="text"
        placeholder="검색어 입력..."
        className="w-full bg-[#1E3A5F] border border-white/10 rounded-lg px-3 py-2"
      />
    </div>
  </div>
</div>
```

**테이블 헤더 디자인**:
```tsx
<thead className="bg-[#1E3A5F] text-white/80 text-xs uppercase">
  <tr>
    <th className="px-4 py-3 text-left">
      <input type="checkbox" />
    </th>
    <th className="px-4 py-3 text-left cursor-pointer hover:text-white">
      상태 <SortIcon />
    </th>
    {/* ... */}
  </tr>
</thead>
```

**테이블 행 디자인**:
```tsx
<tr className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
  <td className="px-4 py-3">
    <input type="checkbox" />
  </td>
  <td className="px-4 py-3">
    <span className="px-2 py-1 rounded-md text-xs font-medium"
          style={{ backgroundColor: '#D1FAE5', color: '#059669' }}>
      확정
    </span>
  </td>
  {/* ... */}
</tr>
```

### 12.2 상세 페이지 (Detail Page)

**기본 구조**:

```
┌─────────────────────────────────────────────────────────┐
│ Page Header                                              │
│ ├─ Title: B/L No. MAEU123456789                         │
│ ├─ Status Badge                                          │
│ └─ Actions: [수정] [삭제] [인쇄]                         │
├─────────────────────────────────────────────────────────┤
│ Tab Navigation                                           │
│ └─ [기본정보] [화물정보] [컨테이너] [비용] [서류]        │
├─────────────────────────────────────────────────────────┤
│ Content Area (Tab별 내용)                                │
│ ├─ Section 1: 기본 정보                                  │
│ │   ├─ 2-Column Grid                                     │
│ │   └─ Label: Value pairs                                │
│ ├─ Section 2: 연계 정보                                  │
│ │   └─ Related records list                              │
│ └─ Section 3: 이력                                       │
│     └─ Timeline view                                     │
└─────────────────────────────────────────────────────────┘
```

**탭 디자인**:
```tsx
<div className="flex border-b border-white/10 mb-6">
  <button className="px-6 py-3 text-sm font-medium text-gold-500 border-b-2 border-gold-500">
    기본정보
  </button>
  <button className="px-6 py-3 text-sm font-medium text-white/60 hover:text-white/80">
    화물정보
  </button>
  {/* ... */}
</div>
```

**정보 섹션 디자인**:
```tsx
<div className="bg-[#162544] rounded-xl p-6">
  <h3 className="text-lg font-semibold text-white mb-4">기본 정보</h3>
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="text-xs text-white/50 block mb-1">B/L No.</label>
      <span className="text-white font-mono">MAEU123456789</span>
    </div>
    <div>
      <label className="text-xs text-white/50 block mb-1">발행일자</label>
      <span className="text-white">2026-01-20</span>
    </div>
    {/* ... */}
  </div>
</div>
```

### 12.3 등록/수정 페이지 (Form Page)

**기본 구조**:

```
┌─────────────────────────────────────────────────────────┐
│ Page Header                                              │
│ ├─ Title: 해상 B/L 등록                                  │
│ └─ Actions: [임시저장] [저장] [취소]                     │
├─────────────────────────────────────────────────────────┤
│ Form Progress (선택적)                                   │
│ └─ Step 1 ─ Step 2 ─ Step 3 ─ Step 4                    │
├─────────────────────────────────────────────────────────┤
│ Form Sections                                            │
│ ├─ Section 1: 기본 정보                                  │
│ │   └─ Input fields in grid layout                       │
│ ├─ Section 2: 거래처 정보                                │
│ │   └─ Shipper, Consignee, Notify                        │
│ ├─ Section 3: 운송 정보                                  │
│ │   └─ Vessel, Voyage, POL, POD                          │
│ └─ Section 4: 화물 정보                                  │
│     └─ Cargo details, Container                          │
├─────────────────────────────────────────────────────────┤
│ Footer Actions (Sticky)                                  │
│ └─ [취소] [임시저장] [저장]                              │
└─────────────────────────────────────────────────────────┘
```

**폼 섹션 디자인**:
```tsx
<div className="bg-[#162544] rounded-xl p-6 mb-4">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold text-white">기본 정보</h3>
    <span className="text-xs text-red-400">* 필수 입력</span>
  </div>
  <div className="grid grid-cols-3 gap-4">
    <div>
      <label className="text-xs text-white/70 block mb-1">
        B/L No. <span className="text-red-400">*</span>
      </label>
      <input
        type="text"
        className="w-full bg-[#1E3A5F] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30"
        placeholder="B/L 번호 입력"
      />
    </div>
    {/* ... */}
  </div>
</div>
```

**필수 필드 표시**:
- 레이블에 빨간색 별표 (*)
- 미입력 시 빨간색 테두리
- 에러 메시지 표시

**검색 팝업 버튼**:
```tsx
<div className="relative">
  <input type="text" className="w-full pr-10 ..." />
  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded">
    <SearchIcon className="w-4 h-4 text-white/60" />
  </button>
</div>
```

### 12.4 대시보드 페이지 (Dashboard)

**기본 구조**:

```
┌─────────────────────────────────────────────────────────┐
│ KPI Cards (4 columns)                                    │
│ ├─ 진행중 선적 | 금일 부킹 | 금주 매출 | 미처리 건수    │
└─────────────────────────────────────────────────────────┘
┌───────────────────────────────┬─────────────────────────┐
│ Chart Area 1 (2 columns)      │ Chart Area 2           │
│ ├─ 월별 실적 차트             │ ├─ 상태별 분포         │
└───────────────────────────────┴─────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ Map / Timeline                                           │
│ └─ Global Shipment Tracking                              │
└─────────────────────────────────────────────────────────┘
┌───────────────────────────────┬─────────────────────────┐
│ Recent Activity               │ Pending Tasks           │
└───────────────────────────────┴─────────────────────────┘
```

**KPI 카드 디자인**:
```tsx
<div className="grid grid-cols-4 gap-6">
  <div className="bg-[#162544] rounded-xl p-6 border border-white/10 hover:border-gold-500/30 transition-all">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 rounded-xl bg-gradient-to-br from-gold-500/20 to-gold-600/10">
        <ShipIcon className="w-6 h-6 text-gold-500" />
      </div>
      <span className="text-sm font-mono text-green-400">+12.5%</span>
    </div>
    <p className="text-sm text-white/60 mb-1">진행중 선적</p>
    <p className="text-3xl font-bold text-white font-mono">1,234</p>
  </div>
  {/* ... */}
</div>
```

### 12.5 모달/팝업 (Modal)

**기본 구조**:

```
┌─────────────────────────────────────────────────────────┐
│ Modal Header                                             │
│ ├─ Title                                                 │
│ └─ Close Button (X)                                      │
├─────────────────────────────────────────────────────────┤
│ Modal Body                                               │
│ └─ Content (검색 폼, 목록, 상세 등)                      │
├─────────────────────────────────────────────────────────┤
│ Modal Footer                                             │
│ └─ Actions: [취소] [선택/확인]                           │
└─────────────────────────────────────────────────────────┘
```

**모달 디자인**:
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center">
  {/* Backdrop */}
  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

  {/* Modal */}
  <div className="relative bg-[#0F1D32] rounded-2xl border border-white/10 shadow-2xl w-[600px] max-h-[80vh] overflow-hidden">
    {/* Header */}
    <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
      <h3 className="text-lg font-semibold text-white">거래처 검색</h3>
      <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg">
        <XIcon className="w-5 h-5 text-white/60" />
      </button>
    </div>

    {/* Body */}
    <div className="p-6 max-h-[60vh] overflow-y-auto">
      {/* Content */}
    </div>

    {/* Footer */}
    <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
      <button className="px-4 py-2 text-white/60 hover:text-white">취소</button>
      <button className="px-4 py-2 bg-gold-500 text-navy-900 rounded-lg font-medium">
        선택
      </button>
    </div>
  </div>
</div>
```

---

## 13. 코드 스니펫 & 예제

### 13.1 Tailwind CSS 클래스 조합

#### Glass Card

```html
<div class="backdrop-blur-xl bg-[rgba(22,37,68,0.6)] border border-white/10 rounded-2xl shadow-lg">
  <div class="p-6">
    <!-- Content -->
  </div>
</div>
```

#### Primary Button

```html
<button class="inline-flex items-center gap-2 px-7 py-3 rounded-xl
  bg-gradient-to-br from-[#D4A853] to-[#B8923F]
  text-[#0A1628] font-semibold text-sm
  shadow-[0_4px_16px_rgba(212,168,83,0.3)]
  hover:translate-y-[-2px] hover:shadow-[0_8px_24px_rgba(212,168,83,0.4)]
  active:scale-[0.98] transition-all duration-300">
  Save Changes
</button>
```

#### Status Badge

```html
<!-- Success -->
<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg
  bg-[rgba(16,185,129,0.15)] text-[#10B981]
  text-[11px] font-semibold font-mono uppercase tracking-wide">
  COMPLETED
</span>

<!-- Warning -->
<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg
  bg-[rgba(245,158,11,0.15)] text-[#F59E0B]
  text-[11px] font-semibold font-mono uppercase tracking-wide">
  PENDING
</span>
```

### 13.2 React 컴포넌트 패턴

#### Stat Card Component

```tsx
interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
}

function StatCard({ title, value, change, icon }: StatCardProps) {
  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-gold-500/20 to-gold-600/10">
          {icon}
        </div>
        {change !== undefined && (
          <span className={`text-sm font-mono ${
            change >= 0 ? 'text-success' : 'text-error'
          }`}>
            {change >= 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <p className="text-sm text-secondary mb-1">{title}</p>
      <p className="text-3xl font-bold number-display text-primary">{value}</p>
    </div>
  );
}
```

#### Badge Component

```tsx
type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'gold';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
}

function Badge({ variant, children }: BadgeProps) {
  const variants = {
    success: 'bg-success-muted text-success',
    warning: 'bg-warning-muted text-warning',
    error: 'bg-error-muted text-error',
    info: 'bg-info-muted text-info',
    gold: 'bg-[rgba(212,168,83,0.15)] text-gold-500',
  };

  return (
    <span className={`badge ${variants[variant]}`}>
      {children}
    </span>
  );
}
```

#### StatusBadge Component (물류 상태 전용)

```tsx
interface StatusBadgeProps {
  status: string;
  config: Record<string, { label: string; color: string; bgColor: string }>;
}

function StatusBadge({ status, config }: StatusBadgeProps) {
  const statusInfo = config[status] || {
    label: status || '미정',
    color: '#6B7280',
    bgColor: '#F3F4F6'
  };

  return (
    <span
      className="px-2 py-1 rounded-md text-xs font-medium font-mono"
      style={{ backgroundColor: statusInfo.bgColor, color: statusInfo.color }}
    >
      {statusInfo.label}
    </span>
  );
}
```

### 13.3 CSS 유틸리티 클래스

```css
/* Text Gradient (Gold) */
.text-gradient {
  background: linear-gradient(135deg, var(--gold-400), var(--gold-500), var(--gold-400));
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradient-shift 3s ease infinite;
}

/* Glow Effects */
.glow-gold { box-shadow: 0 0 20px rgba(212, 168, 83, 0.3); }
.glow-blue { box-shadow: 0 0 20px rgba(37, 99, 235, 0.3); }

/* Decorative Patterns */
.pattern-dots {
  background-image: radial-gradient(circle, rgba(212, 168, 83, 0.08) 1px, transparent 1px);
  background-size: 24px 24px;
}

.pattern-grid {
  background-image:
    linear-gradient(rgba(212, 168, 83, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(212, 168, 83, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* Gradient Mesh Background */
.gradient-mesh {
  background:
    radial-gradient(at 20% 20%, rgba(37, 99, 235, 0.15) 0%, transparent 50%),
    radial-gradient(at 80% 80%, rgba(212, 168, 83, 0.1) 0%, transparent 50%),
    radial-gradient(at 40% 60%, rgba(16, 185, 129, 0.08) 0%, transparent 40%),
    var(--surface-base);
}
```

### 13.4 Custom Scrollbar

```css
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--border-default);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--gold-500);
}
```

### 13.5 노이즈 텍스처 오버레이

```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.03;
  pointer-events: none;
  z-index: 9999;
}
```

---

## 부록: Quick Reference

### 주요 CSS 변수 요약

```css
/* Colors */
--navy-500: #2563EB;
--gold-500: #D4A853;
--success: #10B981;
--warning: #F59E0B;
--error: #EF4444;
--info: #3B82F6;

/* Surfaces */
--surface-base: #0A1628;
--glass-bg: rgba(22, 37, 68, 0.6);
--glass-blur: 20px;

/* Text */
--text-primary: #F8FAFC;
--text-secondary: #94A3B8;
--text-muted: #64748B;

/* Borders */
--border-default: rgba(148, 163, 184, 0.2);
--border-accent: rgba(212, 168, 83, 0.3);
--glass-border: rgba(255, 255, 255, 0.08);

/* Shadows */
--shadow-card: 0 4px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05);
--shadow-glow: 0 0 40px rgba(212, 168, 83, 0.15);

/* Typography */
--font-display: 'Outfit', -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

### 자주 사용하는 Tailwind 클래스 조합

| 용도 | 클래스 |
|------|--------|
| Card Container | `backdrop-blur-xl bg-glass-bg border border-glass-border rounded-2xl` |
| Section Title | `text-lg font-semibold text-text-primary` |
| Muted Text | `text-sm text-text-secondary` |
| Gold Accent | `text-gold-500` |
| Input Focus Ring | `focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500` |
| Hover Effect | `hover:translate-y-[-2px] transition-transform duration-300` |

### 카테고리별 색상 Quick Reference

| 카테고리 | 메인 색상 | Muted 배경 | 테마 클래스 |
|----------|----------|------------|-------------|
| 해상수출 | `#3B82F6` | `#DBEAFE` | `text-blue-500 bg-blue-50` |
| 해상수입 | `#10B981` | `#D1FAE5` | `text-emerald-500 bg-emerald-50` |
| 항공수출 | `#8B5CF6` | `#EDE9FE` | `text-violet-500 bg-violet-50` |
| 항공수입 | `#F59E0B` | `#FEF3C7` | `text-amber-500 bg-amber-50` |
| OMS | `#EC4899` | `#FCE7F3` | `text-pink-500 bg-pink-50` |
| 공통 | `#64748B` | `#F1F5F9` | `text-slate-500 bg-slate-50` |

### 상태 색상 Quick Reference

| 상태 | 색상 | 배경 | 적용 예시 |
|------|------|------|----------|
| 성공/완료 | `#059669` | `#D1FAE5` | 확정, 발행, 완료, 도착 |
| 대기/진행 | `#2563EB` | `#DBEAFE` | 요청, 진행중, Surrendered |
| 경고/주의 | `#D97706` | `#FEF3C7` | 통관중, 검사대상, 만료임박 |
| 오류/취소 | `#DC2626` | `#FEE2E2` | 취소, 반려, 오류, 사고 |
| 비활성/초안 | `#6B7280` | `#F3F4F6` | 작성중, 미정, 대기 |

---

## 14. 화면별 디자인 일관성 분석 리포트

**분석 일자**: 2026-01-28
**분석 대상**: 총 47개 페이지

### 14.1 전체 일관성 점수

| 카테고리 | 점수 | 상태 |
|----------|------|------|
| 레이아웃 | 8.5/10 | ✅ 우수 |
| 카드 스타일 | 9.0/10 | ✅ 우수 |
| 버튼 스타일 | 7.5/10 | ⚠️ 개선 필요 |
| 테이블 스타일 | 7.0/10 | ⚠️ 개선 필요 |
| 상태 뱃지 | 6.0/10 | ❌ 개선 필수 |
| 색상 시스템 | 7.5/10 | ⚠️ 개선 필요 |
| **전체 평균** | **7.6/10** | ⚠️ 개선 진행 중 |

### 14.2 대시보드 및 메인 페이지 분석

#### 대시보드 (/)

```
레이아웃: p-6 (main), gap-4 to gap-5
그리드: grid-cols-5 (stats), grid-cols-12 (layout)
카드: .card, .stat-card 클래스 일관 사용
색상: Primary #2563EB, Accent #E8A838
```

**일관성 점수**: 8.5/10

**발견된 이슈**:
- 상태 배지 색상이 여러 곳에 중복 정의됨
- 일부 인라인 스타일과 Tailwind 클래스 혼용

#### Logis Dashboard (/logis)

```
레이아웃: p-6 (main), gap-6 (grid)
그리드: grid-cols-2
카드: .card with overflow-hidden
색상: 카테고리별 동적 색상 적용
```

**일관성 점수**: 8.0/10

### 14.3 해상수출 (Sea Export) 페이지 분석

**테마 색상**: Blue (#3B82F6)

| 페이지 | 테마 적용 | 레이아웃 | 상태 뱃지 | 점수 |
|--------|----------|----------|----------|------|
| 견적관리 (quote/sea) | ✅ | 표준 | ✅ 일관됨 | 9.2 |
| 부킹관리 (booking/sea) | ✅ | 표준 | ✅ 일관됨 | 8.8 |
| S/R 관리 (sr/sea) | ✅ | 표준 | ✅ 일관됨 | 8.6 |
| S/N 관리 (sn/sea) | ✅ | 표준 | ⚠️ 불일치 | 7.4 |
| B/L 관리 (bl/sea) | ✅ | SearchFilterPanel | ✅ 일관됨 | 8.4 |
| STUFFING (export/stuffing) | ✅ | 표준 | ⚠️ 불일치 | 7.2 |
| CLP (export/clp) | ✅ | 표준 | ⚠️ 불일치 | 7.0 |
| VGM (export/vgm) | ✅ | 표준 | ⚠️ 불일치 | 7.2 |
| 적하목록 (manifest/sea) | ✅ | SearchFilterPanel | ⚠️ 불일치 | 7.4 |

**공통 레이아웃 패턴**:
```
상단 버튼 → 검색조건 → 현황 카드(4-6개) → 테이블
```

**상태 뱃지 표준화 필요**:
```javascript
// 견적/부킹 (모범 사례)
statusConfig = {
  draft: { label: '작성중', color: '#6B7280', bgColor: '#F3F4F6' },
  submitted: { label: '제출', color: '#2563EB', bgColor: '#DBEAFE' },
  approved: { label: '승인', color: '#059669', bgColor: '#D1FAE5' },
  rejected: { label: '반려', color: '#DC2626', bgColor: '#FEE2E2' }
}

// S/N, STUFFING, CLP, VGM (개선 필요)
// 현재: bg-green-500, bg-blue-500 등 텍스트 색상 없음
// 권장: 위 statusConfig 패턴으로 통일
```

### 14.4 해상수입 (Sea Import) 페이지 분석

**테마 색상**: Green (#10B981)

| 페이지 | 테마 적용 | 타임라인 | 상태 뱃지 | 점수 |
|--------|----------|----------|----------|------|
| B/L 관리 (import-bl/sea) | ⚠️ 부분 | ⚠️ 테이블만 | ⚠️ 불일치 | 6.5 |
| 도착관리 (arrival) | ⚠️ 부분 | ⚠️ 테이블만 | ⚠️ 불일치 | 6.5 |
| 통관관리 (customs/sea) | ⚠️ 부분 | ❌ 없음 | ⚠️ 불일치 | 6.0 |
| 화물반출입 (cargo/release) | ⚠️ 부분 | ⚠️ 부분 | ⚠️ 불일치 | 6.0 |
| 화물재고현황 (cargo/status) | ❌ 미적용 | ❌ 없음 | ❌ 다른 체계 | 5.5 |
| 화물추적 (cargo/tracking) | ✅ 적용 | ✅ 우수 | ✅ 일관됨 | 8.5 |

**주요 이슈**:
1. Green Theme (#10B981) 일관성 부족 - 5개 페이지에서 미적용
2. 같은 "통관완료" 상태가 페이지마다 다른 색상 사용
   - arrival: `bg-green-500`
   - customs: `bg-emerald-500`
   - tracking: `#10B981`

**타임라인 표시 개선 필요**:
```
현재: 대부분 테이블 컬럼에 날짜만 표시
권장: cargo/tracking 페이지의 시각적 타임라인 적용
      ETD → ETA → ATA 진행률 바 + 체크마크 타임라인
```

### 14.5 항공수출 (Air Export) 페이지 분석

**테마 색상**: Purple (#8B5CF6)

| 페이지 | 테마 적용 | AWB 형식 | 상태 뱃지 | 점수 |
|--------|----------|----------|----------|------|
| 견적관리 (quote/air) | ❌ 미적용 | N/A | ✅ 일관됨 | 4.0 |
| 부킹관리 (booking/air) | ❌ 미적용 | N/A | ✅ 일관됨 | 4.5 |
| B/L 관리 (bl/air) | ✅ 부분 | ✅ 일관됨 | ✅ 일관됨 | 7.5 |
| AWB 관리 (export-awb/air) | ✅ 부분 | ✅ 일관됨 | ✅ 일관됨 | 8.0 |
| Pre-Alert (pre-alert/air) | ✅ 적용 | ✅ 일관됨 | ✅ 일관됨 | 7.0 |

**AWB 번호 형식** (일관됨 ✅):
```
MAWB: 180-12345678 (항공사코드 3자 - 일련번호 8자)
HAWB: HAWB2026010001
```

**Purple Theme 적용 현황**:
```
✅ 적용됨:
  - BL/Air: TYPE 필드 (bg-purple-500/20 text-purple-400)
  - Export-AWB: DEPARTED 상태 (bg-purple-500)
  - Pre-Alert: AWB 선택 버튼 (purple-600)

❌ 미적용:
  - Quote/Air: 전무
  - Booking/Air: 전무
```

### 14.6 항공수입 (Air Import) 페이지 분석

**테마 색상**: Amber (#F59E0B)

| 페이지 | 테마 적용 | 레이아웃 | 상태 뱃지 | 점수 |
|--------|----------|----------|----------|------|
| AWB 관리 (import-bl/air) | ✅ 적용 | 표준 | ✅ 일관됨 | 7.5 |
| 도착관리 (arrival) | ⚠️ 부분 | 표준 | ✅ 일관됨 | 7.0 |

**상태 뱃지 구성**:
```javascript
// 화물 상태
cargoStatus = {
  IN_TRANSIT: 'bg-blue-500',
  ARRIVED: 'bg-purple-500',
  UNLOADED: 'bg-cyan-500',
  IN_BONDED: 'bg-yellow-500',
  RELEASED: 'bg-green-500',
  DELIVERED: 'bg-gray-500'
}

// 통관 상태
customsStatus = {
  PENDING: 'bg-gray-500',
  DECLARED: 'bg-blue-500',
  INSPECTING: 'bg-yellow-500',
  CLEARED: 'bg-green-500'
}
```

### 14.7 OMS (Order Management) 페이지 분석

**테마 색상**: Pink (#EC4899) - 암묵적으로 #E8A838 사용

| 페이지 | 테마 적용 | 레이아웃 | 오더 타입 표시 | 점수 |
|--------|----------|----------|--------------|------|
| 고객오더 (customer-order) | ✅ | 표준 CRUD | ✅ 명확 | 8.0 |
| 서비스오더 (service-order) | ✅ | 표준 CRUD | ✅ 명확 | 8.0 |
| S/O Control (so-control) | ✅ | 표준 | ✅ 명확 | 7.5 |
| 오더타입 (order-type) | ✅ | 표준 | ✅ 명확 | 7.5 |

**공통 패턴**:
- 저장 버튼: `bg-[#E8A838]`
- 오더 번호: `text-[#E8A838]`
- 모달: 섹션별 그리드 레이아웃

### 14.8 공통 기능 페이지 분석

**테마 색상**: Gray (#64748B)

| 페이지 | 테마 적용 | 레이아웃 | 점수 |
|--------|----------|----------|------|
| 해상스케줄 (schedule/sea) | ⚠️ 부분 | 표준 | 7.5 |
| 항공스케줄 (schedule/air) | ⚠️ 부분 | 표준 + 정렬 | 8.0 |
| 운임기초정보 (rate/base) | ⚠️ 부분 | 표준 | 7.0 |
| 기업운임관리 (rate/corporate) | ⚠️ 부분 | 표준 | 7.0 |
| 환율조회 (exchange-rate) | ✅ 적용 | 복잡한 카드 구조 | 8.5 |
| 화물추적 (tracking) | ✅ 적용 | 글래스모피즘 | 9.0 |
| 창고관리 (warehouse/manage) | ⚠️ 부분 | 표준 | 7.0 |
| 대리점운영 (agent/operation) | ⚠️ 부분 | 표준 | 7.0 |
| 컨테이너공유 (container/share) | ⚠️ 부분 | 2+1 그리드 | 7.5 |

**Gray Theme (#64748B) 적용 현황**:
```
❌ 사실상 미적용
   - CSS 변수에만 정의, 실제 사용 거의 없음
   - 대부분 직접 색상 코드 사용 (#2563EB, #E8A838 등)
```

**환율 표시 형식** (환율조회 페이지):
```
주요 통화 카드: 국가배지 + 통화코드 + 매매기준율(#E8A838)
테이블: 매매기준율 | TTS(빨강) | TTB(파랑) | 서울외국환중개
포맷: font-mono 사용
```

---

## 15. 디자인 일관성 개선 권장사항

### 15.1 우선순위 1: 긴급 개선 (Critical)

#### 상태 뱃지 색상 표준화

모든 페이지에서 아래 표준 statusConfig를 사용:

```typescript
// /src/constants/statusConfig.ts (신규 생성 권장)
export const statusConfig = {
  // 기본 상태
  draft: { label: '작성중', color: '#6B7280', bgColor: '#F3F4F6' },
  pending: { label: '대기', color: '#D97706', bgColor: '#FEF3C7' },
  submitted: { label: '제출', color: '#2563EB', bgColor: '#DBEAFE' },
  approved: { label: '승인', color: '#059669', bgColor: '#D1FAE5' },
  rejected: { label: '반려', color: '#DC2626', bgColor: '#FEE2E2' },
  cancelled: { label: '취소', color: '#9CA3AF', bgColor: '#F3F4F6' },

  // 부킹/선적 상태
  requested: { label: '요청', color: '#2563EB', bgColor: '#DBEAFE' },
  confirmed: { label: '확정', color: '#059669', bgColor: '#D1FAE5' },
  departed: { label: '출발', color: '#7C3AED', bgColor: '#EDE9FE' },
  in_transit: { label: '운송중', color: '#F59E0B', bgColor: '#FEF3C7' },
  arrived: { label: '도착', color: '#059669', bgColor: '#D1FAE5' },
  delivered: { label: '인도완료', color: '#059669', bgColor: '#D1FAE5' },

  // B/L 상태
  issued: { label: '발행', color: '#059669', bgColor: '#D1FAE5' },
  surrendered: { label: 'Surrendered', color: '#2563EB', bgColor: '#DBEAFE' },
  released: { label: 'Released', color: '#7C3AED', bgColor: '#EDE9FE' },

  // 통관 상태
  customs: { label: '통관중', color: '#D97706', bgColor: '#FEF3C7' },
  cleared: { label: '통관완료', color: '#10B981', bgColor: '#D1FAE5' },

  // 예외 상태
  irre: { label: 'IRRE', color: '#DC2626', bgColor: '#FEE2E2' },
  expired: { label: '만료', color: '#9CA3AF', bgColor: '#F3F4F6' }
};
```

#### 테이블 헤더 색상 통일

```css
/* globals.css에 추가 */
.table thead tr th,
.data-table thead tr th {
  background: var(--table-header-bg, #162544);
  /* 또는 */
  background: var(--surface-200);
}
```

### 15.2 우선순위 2: 중요 개선 (High)

#### 카테고리별 테마 색상 강화

```typescript
// /src/constants/themeColors.ts
export const categoryThemes = {
  seaExport: {
    primary: '#3B82F6',
    light: '#DBEAFE',
    hover: '#2563EB'
  },
  seaImport: {
    primary: '#10B981',
    light: '#D1FAE5',
    hover: '#059669'
  },
  airExport: {
    primary: '#8B5CF6',
    light: '#EDE9FE',
    hover: '#7C3AED'
  },
  airImport: {
    primary: '#F59E0B',
    light: '#FEF3C7',
    hover: '#D97706'
  },
  oms: {
    primary: '#EC4899',
    light: '#FCE7F3',
    hover: '#DB2777'
  },
  common: {
    primary: '#64748B',
    light: '#F1F5F9',
    hover: '#475569'
  }
};
```

#### SearchFilterPanel 컴포넌트 전체 적용

현재 적용: B/L(sea), Manifest, Export-AWB
미적용: Quote, Booking, S/R, S/N, 대부분 페이지

```tsx
// 모든 목록 페이지에 SearchFilterPanel 적용 권장
<SearchFilterPanel
  filters={filterConfig}
  values={filterValues}
  onChange={handleFilterChange}
  onSearch={handleSearch}
  onReset={handleReset}
/>
```

### 15.3 우선순위 3: 개선 권장 (Medium)

#### 타임라인 컴포넌트 표준화

화물추적 페이지의 타임라인을 공통 컴포넌트로 추출:

```tsx
// /src/components/common/ShipmentTimeline.tsx
interface TimelineProps {
  events: TimelineEvent[];
  currentStatus: string;
  etd?: string;
  eta?: string;
  atd?: string;
  ata?: string;
}

export function ShipmentTimeline({ events, currentStatus, ...dates }: TimelineProps) {
  // 수직 타임라인 + 진행률 바 + ETD/ETA/ATD/ATA 표시
}
```

#### 현황 카드 개수 표준화

```
권장 구성: 5개 카드
  - 전체 건수
  - 상태별 3-4개 (업무 흐름에 따라)
  - 금액/수량 합계 (선택적)
```

### 15.4 우선순위 4: 문서화 (Low)

- 컴포넌트 Storybook 구축
- 각 모듈별 상태 정의 통합 문서
- AWB/B/L 번호 포맷 명세서

---

## 16. 페이지별 체크리스트

### 16.1 신규 페이지 개발 시 체크리스트

```
□ 레이아웃
  □ main 패딩: p-6
  □ 카드 클래스: .card 사용
  □ 요약 카드 그리드: grid-cols-5
  □ 검색 필터 그리드: grid-cols-6

□ 상태 뱃지
  □ statusConfig 상수 import
  □ 텍스트 + 배경 색상 쌍 사용
  □ 카테고리 테마 색상 적용

□ 테이블
  □ .table 클래스 사용
  □ 헤더 text-center
  □ 정렬 기능: SortableHeader 컴포넌트

□ 버튼
  □ 조회: bg-[#2563EB] text-white
  □ 초기화: bg-[var(--surface-100)]
  □ 신규: 카테고리 테마 색상

□ 컴포넌트
  □ SearchFilterPanel 사용
  □ DateRangeButtons 사용
  □ ExcelButtons 사용
```

### 16.2 기존 페이지 개선 체크리스트

```
□ 상태 뱃지 색상 → statusConfig로 교체
□ 직접 색상 코드 → CSS 변수로 교체
□ 인라인 스타일 → Tailwind 클래스로 교체
□ 중복 코드 → 공통 컴포넌트로 추출
```

---

## 17. 버전 히스토리

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 2.0.0 | 2026-01-28 | 초기 디자인 가이드 작성 |
| 2.1.0 | 2026-01-28 | 화면별 디자인 일관성 분석 리포트 추가 |
| - | - | 47개 페이지 분석 결과 반영 |
| - | - | 개선 권장사항 및 체크리스트 추가 |

---

**Document Version**: 2.1.0
**Last Updated**: 2026-01-28
**Author**: FMS Development Team
