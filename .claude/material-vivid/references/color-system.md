# M3 Dynamic Color System

Material You 3 기반의 동적 색상 시스템.

## CSS 변수 정의

```css
:root {
  /* === Primary Palette (보라색 계열 기본) === */
  --color-primary: #6750A4;
  --color-primary-rgb: 103, 80, 164;
  --color-on-primary: #FFFFFF;
  --color-primary-container: #EADDFF;
  --color-on-primary-container: #21005D;

  /* === Secondary Palette === */
  --color-secondary: #625B71;
  --color-on-secondary: #FFFFFF;
  --color-secondary-container: #E8DEF8;
  --color-on-secondary-container: #1D192B;

  /* === Tertiary Palette === */
  --color-tertiary: #7D5260;
  --color-on-tertiary: #FFFFFF;
  --color-tertiary-container: #FFD8E4;
  --color-on-tertiary-container: #31111D;

  /* === Surface Colors (Light Mode) === */
  --color-surface: #FEF7FF;
  --color-surface-dim: #DED8E1;
  --color-surface-bright: #FEF7FF;
  --color-surface-container-lowest: #FFFFFF;
  --color-surface-container-low: #F7F2FA;
  --color-surface-container: #F3EDF7;
  --color-surface-container-high: #ECE6F0;
  --color-surface-container-highest: #E6E0E9;
  --color-on-surface: #1D1B20;
  --color-on-surface-variant: #49454F;

  /* === Outline === */
  --color-outline: #79747E;
  --color-outline-variant: #CAC4D0;

  /* === Error Colors === */
  --color-error: #B3261E;
  --color-on-error: #FFFFFF;
  --color-error-container: #F9DEDC;
  --color-on-error-container: #410E0B;

  /* === Status Colors === */
  --color-success: #386A20;
  --color-warning: #7C5800;
  --color-info: #0061A4;

  /* === Trend Indicators === */
  --color-trend-up: #DC2626;
  --color-trend-down: #2563EB;
  --color-trend-neutral: #6B7280;

  /* === State Layer Opacities === */
  --state-hover: 0.08;
  --state-focus: 0.12;
  --state-pressed: 0.12;
  --state-dragged: 0.16;

  /* === Elevation Surface Tints === */
  --elevation-1: rgba(var(--color-primary-rgb), 0.05);
  --elevation-2: rgba(var(--color-primary-rgb), 0.08);
  --elevation-3: rgba(var(--color-primary-rgb), 0.11);
  --elevation-4: rgba(var(--color-primary-rgb), 0.12);
  --elevation-5: rgba(var(--color-primary-rgb), 0.14);
}

/* === Dark Mode === */
.dark, [data-theme="dark"] {
  --color-primary: #D0BCFF;
  --color-primary-rgb: 208, 188, 255;
  --color-on-primary: #381E72;
  --color-primary-container: #4F378B;
  --color-on-primary-container: #EADDFF;

  --color-secondary: #CCC2DC;
  --color-on-secondary: #332D41;
  --color-secondary-container: #4A4458;
  --color-on-secondary-container: #E8DEF8;

  --color-tertiary: #EFB8C8;
  --color-on-tertiary: #492532;
  --color-tertiary-container: #633B48;
  --color-on-tertiary-container: #FFD8E4;

  --color-surface: #141218;
  --color-surface-dim: #141218;
  --color-surface-bright: #3B383E;
  --color-surface-container-lowest: #0F0D13;
  --color-surface-container-low: #1D1B20;
  --color-surface-container: #211F26;
  --color-surface-container-high: #2B2930;
  --color-surface-container-highest: #36343B;
  --color-on-surface: #E6E0E9;
  --color-on-surface-variant: #CAC4D0;

  --color-outline: #938F99;
  --color-outline-variant: #49454F;

  --color-error: #F2B8B5;
  --color-on-error: #601410;
  --color-error-container: #8C1D18;
  --color-on-error-container: #F9DEDC;
}

/* === System Dark Mode Detection === */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    /* Dark mode variables auto-applied */
  }
}
```

## Tailwind 색상 확장

```javascript
// tailwind.config.js colors 섹션
colors: {
  primary: {
    DEFAULT: 'var(--color-primary)',
    container: 'var(--color-primary-container)',
  },
  secondary: {
    DEFAULT: 'var(--color-secondary)',
    container: 'var(--color-secondary-container)',
  },
  surface: {
    DEFAULT: 'var(--color-surface)',
    dim: 'var(--color-surface-dim)',
    bright: 'var(--color-surface-bright)',
    container: {
      lowest: 'var(--color-surface-container-lowest)',
      low: 'var(--color-surface-container-low)',
      DEFAULT: 'var(--color-surface-container)',
      high: 'var(--color-surface-container-high)',
      highest: 'var(--color-surface-container-highest)',
    }
  },
  on: {
    surface: 'var(--color-on-surface)',
    'surface-variant': 'var(--color-on-surface-variant)',
    primary: 'var(--color-on-primary)',
  },
  outline: {
    DEFAULT: 'var(--color-outline)',
    variant: 'var(--color-outline-variant)',
  },
  trend: {
    up: 'var(--color-trend-up)',
    down: 'var(--color-trend-down)',
    neutral: 'var(--color-trend-neutral)',
  }
}
```

## Surface Tint (고도에 따른 틴트)

고도가 높을수록 primary 색상의 틴트가 강해짐:

```css
/* Elevation 레벨별 Surface */
.surface-level-0 { background-color: var(--color-surface); }

.surface-level-1 {
  background-color: var(--color-surface);
  background-image: linear-gradient(var(--elevation-1), var(--elevation-1));
}

.surface-level-2 {
  background-color: var(--color-surface);
  background-image: linear-gradient(var(--elevation-2), var(--elevation-2));
}

.surface-level-3 {
  background-color: var(--color-surface);
  background-image: linear-gradient(var(--elevation-3), var(--elevation-3));
}

/* 컨테이너 기반 대안 (더 간단) */
.surface-container { background-color: var(--color-surface-container); }
.surface-container-low { background-color: var(--color-surface-container-low); }
.surface-container-high { background-color: var(--color-surface-container-high); }
```

## State Layer (인터랙션 피드백)

```css
/* 버튼/카드의 State Layer */
.state-layer {
  position: relative;
  isolation: isolate;
}

.state-layer::before {
  content: '';
  position: absolute;
  inset: 0;
  background-color: var(--color-primary);
  opacity: 0;
  transition: opacity 150ms ease-out;
  pointer-events: none;
  border-radius: inherit;
}

.state-layer:hover::before { opacity: var(--state-hover); }
.state-layer:focus-visible::before { opacity: var(--state-focus); }
.state-layer:active::before { opacity: var(--state-pressed); }
```

## 사용 예시

```html
<!-- 카드 (Surface Level 1 + State Layer) -->
<div class="surface-level-1 state-layer rounded-2xl p-6 cursor-pointer
            transition-shadow hover:shadow-md">
  <h3 style="color: var(--color-on-surface)">카드 제목</h3>
  <p style="color: var(--color-on-surface-variant)">설명 텍스트</p>
</div>

<!-- 트렌드 표시 -->
<span class="text-trend-up">+5.2%</span>
<span class="text-trend-down">-3.1%</span>
```
