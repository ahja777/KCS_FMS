---
name: material-vivid
description: Google Stitch (Material You 3) 기반의 차세대 프론트엔드 디자인 시스템. 동적 색상, 유동적 모션, 개인화된 UI/UX를 생성합니다. 대시보드, 관리자 페이지, SaaS UI, 기업용 웹앱, 랜딩페이지를 만들 때 사용하세요. HTML/React/Tailwind CSS로 동적 다크모드, Surface Tint, State Layer, Fluid Motion이 적용된 인터페이스를 제작합니다.
---

# Material Vivid Design System

Google Stitch와 Material You 3(M3)의 핵심 철학인 **개인화, 유동성, 적응성**을 구현하는 프론트엔드 디자인 시스템.

## 핵심 원칙

**"정적임은 적이다. 인터페이스를 살아있게 만들어라."**

1. **개인화**: 사용자 테마에 반응하는 동적 색상
2. **유동성**: 의도를 전달하는 Fluid Motion
3. **적응성**: 컨텍스트에 따른 Surface 변화

## 필수 기술 스택

```html
<!-- Google Fonts (Inter + Roboto Flex) -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300..700&family=Roboto+Flex:wght@300..700&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet">

<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com?plugins=forms,typography"></script>
```

## 금지 사항 (절대 사용 금지)

| 카테고리 | 금지 항목 |
|---------|----------|
| 폰트 | Roboto 400 기본, Noto Sans 기본, 굴림, 돋움 |
| 색상 | 순수 흰색 `#FFFFFF`, 순수 검정 `#000000`, 하드코딩 색상 |
| 스타일 | 평면 단색 배경, 고정 그림자, 정적 인터페이스 |

## 리소스 파일

- **references/color-system.md**: M3 동적 색상 팔레트 및 CSS 변수
- **references/motion-patterns.md**: CSS/JS 애니메이션 패턴
- **references/components.md**: 재사용 컴포넌트 (카드, 버튼, 테이블, 사이드바)
- **assets/tailwind-config.js**: Tailwind 설정 템플릿

## 워크플로우

### 1단계: 기본 설정

`assets/tailwind-config.js`의 설정을 `<script>` 태그 내에 적용.

### 2단계: 색상 시스템 적용

`references/color-system.md`에서 CSS 변수를 복사하여 `:root`에 정의.

### 3단계: 컴포넌트 조립

`references/components.md`에서 필요한 UI 요소를 선택하여 조합.

### 4단계: 모션 추가

`references/motion-patterns.md`의 패턴을 인터랙티브 요소에 적용.

## 필수 체크리스트

모든 결과물에 반드시 포함:

- [ ] Inter 또는 Roboto Flex 폰트
- [ ] CSS Custom Properties 기반 M3 색상
- [ ] Surface Tint (고도에 따른 primary 틴트)
- [ ] State Layer (호버/액티브 피드백)
- [ ] 동적 다크모드 (`prefers-color-scheme` + `.dark` 클래스)
- [ ] 모바일 우선 반응형 (`sm:`, `md:`, `lg:`)
- [ ] CSS Transition (최소 150ms ease-out)
