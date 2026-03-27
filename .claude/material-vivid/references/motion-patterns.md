# Motion Patterns

M3 Fluid Motion 원칙에 따른 애니메이션 패턴.

## 핵심 원칙

1. **유용함**: 모션은 사용자의 이해를 돕는다
2. **반응성**: 즉각적이고 부드러운 피드백
3. **표현성**: 브랜드 개성을 전달

## Easing 함수

```css
:root {
  /* M3 Standard Easing */
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-standard-decelerate: cubic-bezier(0, 0, 0, 1);
  --ease-standard-accelerate: cubic-bezier(0.3, 0, 1, 1);
  
  /* M3 Emphasized Easing */
  --ease-emphasized: cubic-bezier(0.2, 0, 0, 1);
  --ease-emphasized-decelerate: cubic-bezier(0.05, 0.7, 0.1, 1);
  --ease-emphasized-accelerate: cubic-bezier(0.3, 0, 0.8, 0.15);
  
  /* Duration */
  --duration-short: 150ms;
  --duration-medium: 300ms;
  --duration-long: 500ms;
}
```

## 기본 Transition

```css
/* 범용 Transition 클래스 */
.transition-smooth {
  transition: all var(--duration-short) var(--ease-standard);
}

.transition-medium {
  transition: all var(--duration-medium) var(--ease-emphasized);
}

/* 특정 속성만 */
.transition-colors {
  transition: color, background-color, border-color var(--duration-short) var(--ease-standard);
}

.transition-transform {
  transition: transform var(--duration-medium) var(--ease-emphasized);
}

.transition-opacity {
  transition: opacity var(--duration-short) var(--ease-standard);
}
```

## 호버/프레스 패턴

```css
/* 스케일 피드백 */
.hover-lift {
  transition: transform var(--duration-short) var(--ease-standard),
              box-shadow var(--duration-short) var(--ease-standard);
}
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.hover-lift:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 스케일 피드백 (버튼) */
.press-scale {
  transition: transform var(--duration-short) var(--ease-standard);
}
.press-scale:hover {
  transform: scale(1.02);
}
.press-scale:active {
  transform: scale(0.98);
}
```

## 진입/퇴장 애니메이션

```css
/* Fade In Up */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp var(--duration-medium) var(--ease-emphasized-decelerate) forwards;
}

/* Fade In Scale */
@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in-scale {
  animation: fadeInScale var(--duration-medium) var(--ease-emphasized-decelerate) forwards;
}

/* Slide In From Left */
@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-24px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-slide-in-left {
  animation: slideInLeft var(--duration-medium) var(--ease-emphasized-decelerate) forwards;
}

/* Stagger Animation (리스트 아이템) */
.stagger-item {
  opacity: 0;
  animation: fadeInUp var(--duration-medium) var(--ease-emphasized-decelerate) forwards;
}
.stagger-item:nth-child(1) { animation-delay: 0ms; }
.stagger-item:nth-child(2) { animation-delay: 50ms; }
.stagger-item:nth-child(3) { animation-delay: 100ms; }
.stagger-item:nth-child(4) { animation-delay: 150ms; }
.stagger-item:nth-child(5) { animation-delay: 200ms; }
```

## 로딩 상태

```css
/* Skeleton Pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface-container) 25%,
    var(--color-surface-container-high) 50%,
    var(--color-surface-container) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Spinner */
@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--color-outline-variant);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
```

## 스크롤 기반 애니메이션 (JS)

```javascript
// Intersection Observer로 스크롤 진입 감지
const observeElements = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );

  document.querySelectorAll('[data-animate]').forEach((el) => {
    el.style.opacity = '0';
    observer.observe(el);
  });
};

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', observeElements);
```

## 다크모드 전환

```css
/* 부드러운 테마 전환 */
html {
  transition: background-color var(--duration-medium) var(--ease-standard),
              color var(--duration-medium) var(--ease-standard);
}

/* 모든 요소에 색상 전환 */
*, *::before, *::after {
  transition: background-color var(--duration-short) var(--ease-standard),
              border-color var(--duration-short) var(--ease-standard),
              color var(--duration-short) var(--ease-standard);
}
```

## Tailwind 애니메이션 확장

```javascript
// tailwind.config.js animation 섹션
animation: {
  'fade-in-up': 'fadeInUp 0.3s cubic-bezier(0.05, 0.7, 0.1, 1) forwards',
  'fade-in-scale': 'fadeInScale 0.3s cubic-bezier(0.05, 0.7, 0.1, 1) forwards',
  'slide-in-left': 'slideInLeft 0.3s cubic-bezier(0.05, 0.7, 0.1, 1) forwards',
  'shimmer': 'shimmer 1.5s infinite',
  'spin': 'spin 0.8s linear infinite',
}
```
