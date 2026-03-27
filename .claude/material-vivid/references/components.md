# M3 Components

Material Vivid 디자인 시스템의 재사용 가능한 컴포넌트.

## 레이아웃 구조

### 대시보드 기본 레이아웃

```html
<body class="bg-surface text-on-surface font-display h-screen overflow-hidden flex">
  <!-- Sidebar -->
  <aside class="w-64 bg-surface-container-low border-r border-outline-variant 
                flex flex-col shrink-0">
    <!-- Sidebar Header -->
    <div class="h-16 flex items-center px-6 bg-primary text-on-primary">
      <span class="font-bold text-lg tracking-wide">브랜드명</span>
    </div>
    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
      <!-- Nav Items -->
    </nav>
  </aside>

  <!-- Main Content -->
  <div class="flex-1 flex flex-col min-w-0">
    <!-- Top Header -->
    <header class="h-16 bg-primary flex items-center justify-end px-6 shrink-0">
      <!-- Header Content -->
    </header>
    <!-- Main Area -->
    <main class="flex-1 overflow-y-auto p-6 bg-surface-dim">
      <!-- Page Content -->
    </main>
  </div>
</body>
```

## 네비게이션

### Sidebar Navigation Item

```html
<!-- 기본 상태 -->
<a href="#" class="group flex items-center gap-3 px-3 py-2.5 rounded-xl
                  text-on-surface-variant
                  transition-all duration-150 ease-standard
                  hover:bg-surface-container-high">
  <span class="material-icons-round text-xl">dashboard</span>
  <span class="font-medium">대시보드</span>
</a>

<!-- 활성 상태 -->
<a href="#" class="group flex items-center gap-3 px-3 py-2.5 rounded-xl
                  bg-primary text-on-primary shadow-sm">
  <span class="material-icons-round text-xl">edit_note</span>
  <span class="font-medium">시나리오 작성</span>
</a>
```

## 카드 (Cards)

### 통계 카드 (Stat Card)

```html
<div class="bg-surface-container rounded-2xl p-5 
            transition-all duration-150 ease-standard
            hover:shadow-md hover:bg-surface-container-high">
  <!-- Header -->
  <div class="flex justify-between items-start mb-3">
    <h3 class="text-on-surface-variant text-xs font-medium">진행중 캠페인</h3>
    <div class="flex items-center gap-1 text-on-surface-variant text-[10px]">
      <span class="material-icons-round text-xs">cloud_sync</span>
      <span>12:21:16</span>
    </div>
  </div>
  <!-- Value -->
  <div class="flex items-baseline gap-2">
    <span class="text-4xl font-bold text-on-surface tracking-tight">7/12</span>
    <span class="text-sm font-medium text-trend-down">-1</span>
  </div>
  <!-- Subtitle -->
  <p class="mt-2 text-xs text-on-surface-variant">전일 대비 +1</p>
</div>
```

### 차트 카드

```html
<div class="bg-surface-container rounded-2xl overflow-hidden">
  <!-- Card Header -->
  <div class="p-4 border-b border-outline-variant">
    <div class="flex justify-between items-center">
      <h3 class="font-bold text-on-surface">일별 발신/연결추이</h3>
      <select class="text-xs bg-surface-container-high border border-outline-variant 
                     rounded-lg px-3 py-1.5 text-on-surface
                     focus:outline-none focus:ring-2 focus:ring-primary/30">
        <option>캠페인 전체</option>
      </select>
    </div>
    <p class="text-xs text-on-surface-variant mt-1">
      ● 막대: 발신/연결(스택), 선: 성공률(%) · 범위: 최근 30일
    </p>
  </div>
  <!-- Chart Area -->
  <div class="p-4 h-64 flex items-center justify-center 
              bg-surface-container-low border-2 border-dashed border-outline-variant 
              m-4 rounded-xl">
    <span class="text-on-surface-variant font-medium">차트 영역</span>
  </div>
</div>
```

## 버튼 (Buttons)

### Filled Button (Primary)

```html
<button class="inline-flex items-center justify-center gap-2
               px-6 py-2.5 rounded-full
               bg-primary text-on-primary font-medium
               transition-all duration-150 ease-standard
               hover:shadow-md hover:brightness-110
               active:scale-[0.98] active:shadow-sm
               focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2">
  <span class="material-icons-round text-lg">add</span>
  <span>새로 만들기</span>
</button>
```

### Outlined Button

```html
<button class="inline-flex items-center justify-center gap-2
               px-6 py-2.5 rounded-full
               border border-outline text-primary font-medium
               transition-all duration-150 ease-standard
               hover:bg-primary/[0.08]
               active:bg-primary/[0.12]
               focus:outline-none focus:ring-2 focus:ring-primary/30">
  <span>취소</span>
</button>
```

### Icon Button

```html
<button class="w-10 h-10 rounded-full 
               flex items-center justify-center
               text-on-surface-variant
               transition-all duration-150 ease-standard
               hover:bg-on-surface/[0.08]
               active:bg-on-surface/[0.12]">
  <span class="material-icons-round">settings</span>
</button>
```

### FAB (Floating Action Button)

```html
<button class="fixed bottom-6 right-6
               w-14 h-14 rounded-2xl
               bg-primary-container text-on-primary-container
               flex items-center justify-center
               shadow-lg
               transition-all duration-150 ease-standard
               hover:shadow-xl hover:scale-105
               active:scale-100">
  <span class="material-icons-round text-2xl">add</span>
</button>
```

## 테이블 (Data Table)

```html
<div class="bg-surface-container rounded-2xl overflow-hidden">
  <!-- Table Header -->
  <div class="p-4 border-b border-outline-variant">
    <h3 class="font-bold text-on-surface">캠페인 리더보드</h3>
  </div>
  
  <!-- Table -->
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="bg-primary text-on-primary">
          <th class="p-3 text-left font-medium">
            <input type="checkbox" class="rounded border-on-primary/30 
                   bg-transparent text-primary focus:ring-primary/50">
          </th>
          <th class="p-3 text-left font-medium cursor-pointer hover:bg-white/10">
            상태 <span class="text-[10px] opacity-70">↕</span>
          </th>
          <th class="p-3 text-left font-medium cursor-pointer hover:bg-white/10">
            기간 <span class="text-[10px] opacity-70">↕</span>
          </th>
          <!-- More columns -->
        </tr>
      </thead>
      <tbody class="divide-y divide-outline-variant">
        <tr class="transition-colors hover:bg-surface-container-high">
          <td class="p-3">
            <input type="checkbox" class="rounded border-outline 
                   text-primary focus:ring-primary/50">
          </td>
          <td class="p-3">
            <span class="inline-flex px-3 py-1 rounded-full text-xs font-medium
                         bg-blue-500/10 text-blue-600 
                         dark:bg-blue-500/20 dark:text-blue-400
                         border border-blue-500/20">
              진행
            </span>
          </td>
          <td class="p-3 text-on-surface">2025.08.01~2025.08.31</td>
          <!-- More cells -->
        </tr>
      </tbody>
    </table>
  </div>
  
  <!-- Pagination -->
  <div class="flex justify-between items-center p-3 border-t border-outline-variant 
              text-xs text-on-surface-variant">
    <div class="flex items-center gap-1">
      <button class="px-2 py-1 rounded border border-outline-variant 
                     hover:bg-surface-container-high transition-colors">
        &lt;&lt;
      </button>
      <button class="px-2 py-1 rounded border border-outline-variant 
                     hover:bg-surface-container-high transition-colors">
        &lt;
      </button>
      <span class="px-3 py-1 rounded bg-surface-container-high font-medium text-on-surface">
        1 / 50
      </span>
      <button class="px-2 py-1 rounded border border-outline-variant 
                     hover:bg-surface-container-high transition-colors">
        &gt;
      </button>
      <button class="px-2 py-1 rounded border border-outline-variant 
                     hover:bg-surface-container-high transition-colors">
        &gt;&gt;
      </button>
    </div>
  </div>
</div>
```

## 상태 뱃지 (Status Badges)

```html
<!-- 진행 (Blue) -->
<span class="inline-flex px-3 py-1 rounded-full text-xs font-medium
             bg-blue-500/10 text-blue-600 border border-blue-500/20
             dark:bg-blue-500/20 dark:text-blue-400">
  진행
</span>

<!-- 완료 (Green) -->
<span class="inline-flex px-3 py-1 rounded-full text-xs font-medium
             bg-green-500/10 text-green-600 border border-green-500/20
             dark:bg-green-500/20 dark:text-green-400">
  완료
</span>

<!-- 중지 (Orange) -->
<span class="inline-flex px-3 py-1 rounded-full text-xs font-medium
             bg-orange-500/10 text-orange-600 border border-orange-500/20
             dark:bg-orange-500/20 dark:text-orange-400">
  중지
</span>

<!-- 에러 (Red) -->
<span class="inline-flex px-3 py-1 rounded-full text-xs font-medium
             bg-red-500/10 text-red-600 border border-red-500/20
             dark:bg-red-500/20 dark:text-red-400">
  에러
</span>

<!-- 대기 (Gray) -->
<span class="inline-flex px-3 py-1 rounded-full text-xs font-medium
             bg-gray-500/10 text-gray-600 border border-gray-500/20
             dark:bg-gray-500/20 dark:text-gray-400">
  대기
</span>
```

## Progress Bar

```html
<div class="flex items-center gap-3">
  <div class="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
    <div class="h-full bg-primary rounded-full transition-all duration-300"
         style="width: 65%"></div>
  </div>
  <span class="text-xs text-on-surface-variant w-10 text-right">65%</span>
</div>
```

## Input Fields

### Text Input

```html
<div class="space-y-1.5">
  <label class="text-sm font-medium text-on-surface">레이블</label>
  <input type="text" 
         class="w-full px-4 py-2.5 rounded-xl
                bg-surface-container border border-outline-variant
                text-on-surface placeholder:text-on-surface-variant/50
                transition-all duration-150
                focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
         placeholder="입력해주세요">
</div>
```

### Select

```html
<select class="px-4 py-2.5 rounded-xl
               bg-surface-container border border-outline-variant
               text-on-surface
               transition-all duration-150
               focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
  <option>옵션 1</option>
  <option>옵션 2</option>
</select>
```

## Glass Card (Glassmorphism)

```html
<div class="bg-surface-container/80 backdrop-blur-xl
            border border-white/20 dark:border-white/10
            rounded-3xl p-6 shadow-lg">
  <h3 class="text-xl font-bold text-on-surface">Glass Card</h3>
  <p class="mt-2 text-on-surface-variant">
    M3 스타일 Glassmorphism 카드
  </p>
</div>
```
