'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

// 버튼 스타일 타입
export type ButtonVariant =
  | 'primary'      // 금색 - 저장, 등록 등 주요 액션
  | 'secondary'    // 네이비 - 조회, 수정 등 일반 액션
  | 'danger'       // 빨간색 - 삭제
  | 'success'      // 녹색 - 신규, 확인
  | 'info'         // 파란색 - 스케줄조회, 정보
  | 'default'      // 회색 - 목록, 초기화, E-mail
  | 'purple';      // 보라색 - 테스트, 일괄처리

// 아이콘 타입
export type ButtonIcon =
  | 'plus'         // 신규, 추가
  | 'save'         // 저장
  | 'check'        // 확인, 저장완료
  | 'edit'         // 수정
  | 'delete'       // 삭제
  | 'search'       // 조회, 검색
  | 'refresh'      // 초기화, 새로고침
  | 'list'         // 목록
  | 'email'        // 이메일
  | 'print'        // 출력
  | 'excel'        // 엑셀
  | 'upload'       // 업로드
  | 'download'     // 다운로드
  | 'schedule'     // 스케줄
  | 'send'         // 전송
  | 'test';        // 테스트

// 아이콘 SVG 정의
const iconSVGs: Record<ButtonIcon, ReactNode> = {
  plus: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  save: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  ),
  check: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  edit: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  delete: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  search: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  refresh: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  list: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  ),
  email: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  print: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
  ),
  excel: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  upload: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  ),
  download: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  schedule: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  send: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  test: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
};

// 버튼 스타일 정의
const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[#E8A838] text-[#0C1222] hover:bg-[#D4943A]',
  secondary: 'bg-[#1A2744] text-white hover:bg-[#243354]',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  success: 'bg-[#059669] text-white hover:bg-[#047857]',
  info: 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]',
  default: 'bg-[var(--surface-100)] text-[var(--foreground)] hover:bg-[var(--surface-200)]',
  purple: 'bg-purple-600 text-white hover:bg-purple-700',
};

// 비활성화 스타일
const disabledStyle = 'bg-gray-400 text-gray-200 cursor-not-allowed hover:bg-gray-400';

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ButtonIcon;
  children: ReactNode;
  loading?: boolean;
  loadingText?: string;
}

/**
 * 공통 액션 버튼 컴포넌트
 */
export function ActionButton({
  variant = 'default',
  icon,
  children,
  loading = false,
  loadingText,
  disabled,
  className = '',
  ...props
}: ActionButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`px-4 py-2 font-semibold rounded-lg transition-colors flex items-center gap-2 ${
        isDisabled ? disabledStyle : variantStyles[variant]
      } ${className}`}
    >
      {loading ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {loadingText || children}
        </>
      ) : (
        <>
          {icon && iconSVGs[icon]}
          {children}
        </>
      )}
    </button>
  );
}

/**
 * 등록 페이지 상단 버튼 그룹
 * 표준 순서: 테스트데이터(옵션) → 스케줄조회(옵션) → E-mail → 신규 → 초기화 → 목록 → 삭제(조건부) → 저장
 */
interface RegisterTopButtonsProps {
  screenId: string;
  onTestData?: () => void;
  onScheduleSearch?: () => void;
  onEmail?: () => void;
  onNew: () => void;
  onReset: () => void;
  onList: () => void;
  onDelete?: () => void;
  onSave: () => void;
  isNewMode?: boolean;
  isSaving?: boolean;
  showDelete?: boolean;
  showTestData?: boolean;
  showScheduleSearch?: boolean;
}

export function RegisterTopButtons({
  screenId,
  onTestData,
  onScheduleSearch,
  onEmail,
  onNew,
  onReset,
  onList,
  onDelete,
  onSave,
  isNewMode = true,
  isSaving = false,
  showDelete = false,
  showTestData = false,
  showScheduleSearch = false,
}: RegisterTopButtonsProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <span className="text-sm text-[var(--muted)]">화면 ID: {screenId}</span>
      <div className="flex gap-2">
        {showTestData && onTestData && (
          <ActionButton variant="purple" icon="test" onClick={onTestData}>
            테스트데이터
          </ActionButton>
        )}
        {showScheduleSearch && onScheduleSearch && (
          <ActionButton variant="info" icon="schedule" onClick={onScheduleSearch}>
            스케줄조회
          </ActionButton>
        )}
        {onEmail && (
          <ActionButton variant="default" icon="email" onClick={onEmail}>
            E-mail
          </ActionButton>
        )}
        <ActionButton
          variant="info"
          icon="plus"
          onClick={onNew}
          disabled={isNewMode}
        >
          신규
        </ActionButton>
        <ActionButton variant="default" icon="refresh" onClick={onReset}>
          초기화
        </ActionButton>
        <ActionButton variant="default" icon="list" onClick={onList}>
          목록
        </ActionButton>
        {showDelete && onDelete && (
          <ActionButton variant="danger" icon="delete" onClick={onDelete}>
            삭제
          </ActionButton>
        )}
        <ActionButton
          variant="primary"
          icon="check"
          onClick={onSave}
          loading={isSaving}
          loadingText="저장중..."
        >
          저장
        </ActionButton>
      </div>
    </div>
  );
}

/**
 * 등록 페이지 하단 버튼 그룹
 * 표준 순서: 목록 → 임시저장 → 제출/요청
 */
interface RegisterBottomButtonsProps {
  onList: () => void;
  onSave: () => void;
  onSubmit: () => void;
  isSaving?: boolean;
  submitLabel?: string;
}

export function RegisterBottomButtons({
  onList,
  onSave,
  onSubmit,
  isSaving = false,
  submitLabel = '제출',
}: RegisterBottomButtonsProps) {
  return (
    <div className="flex justify-center gap-3 mt-6">
      <ActionButton variant="default" icon="list" onClick={onList}>
        목록
      </ActionButton>
      <ActionButton
        variant="primary"
        icon="save"
        onClick={onSave}
        loading={isSaving}
        loadingText="저장중..."
      >
        임시저장
      </ActionButton>
      <ActionButton variant="info" icon="send" onClick={onSubmit}>
        {submitLabel}
      </ActionButton>
    </div>
  );
}

/**
 * 조회 페이지 상단 버튼 그룹
 * 표준 순서: 신규/등록 → 수정 → 삭제 → 일괄처리(옵션) → E-mail → 출력 → Excel
 */
interface ListTopButtonsProps {
  screenId: string;
  selectedCount?: number;
  onNew: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onBulkAction?: () => void;
  bulkActionLabel?: string;
  onEmail?: () => void;
  onPrint?: () => void;
  onExcel?: () => void;
  newLabel?: string;
  showEdit?: boolean;
  showDelete?: boolean;
  showBulkAction?: boolean;
  showEmail?: boolean;
  showPrint?: boolean;
  showExcel?: boolean;
}

export function ListTopButtons({
  screenId,
  selectedCount = 0,
  onNew,
  onEdit,
  onDelete,
  onBulkAction,
  bulkActionLabel = '일괄처리',
  onEmail,
  onPrint,
  onExcel,
  newLabel = '신규',
  showEdit = true,
  showDelete = true,
  showBulkAction = false,
  showEmail = true,
  showPrint = true,
  showExcel = true,
}: ListTopButtonsProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-3">
        <span className="text-sm text-[var(--muted)]">화면 ID: {screenId}</span>
        {selectedCount > 0 && (
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
            {selectedCount}건 선택
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <ActionButton variant="primary" icon="plus" onClick={onNew}>
          {newLabel}
        </ActionButton>
        {showEdit && onEdit && (
          <ActionButton variant="secondary" icon="edit" onClick={onEdit}>
            수정
          </ActionButton>
        )}
        {showDelete && onDelete && (
          <ActionButton variant="danger" icon="delete" onClick={onDelete}>
            삭제
          </ActionButton>
        )}
        {showBulkAction && onBulkAction && (
          <ActionButton
            variant="purple"
            icon="send"
            onClick={onBulkAction}
            disabled={selectedCount === 0}
          >
            {bulkActionLabel}
          </ActionButton>
        )}
        {showEmail && onEmail && (
          <ActionButton variant="default" icon="email" onClick={onEmail}>
            E-mail
          </ActionButton>
        )}
        {showPrint && onPrint && (
          <ActionButton
            variant={selectedCount > 0 ? 'primary' : 'default'}
            icon="print"
            onClick={onPrint}
            disabled={selectedCount === 0}
          >
            출력 ({selectedCount})
          </ActionButton>
        )}
        {showExcel && onExcel && (
          <ActionButton variant="default" icon="excel" onClick={onExcel}>
            Excel
          </ActionButton>
        )}
      </div>
    </div>
  );
}

/**
 * 검색 영역 하단 버튼 그룹
 * 표준 순서: 조회 → 초기화
 */
interface SearchButtonsProps {
  onSearch: () => void;
  onReset: () => void;
}

export function SearchButtons({ onSearch, onReset }: SearchButtonsProps) {
  return (
    <div className="flex justify-center gap-3 mt-4">
      <ActionButton variant="secondary" icon="search" onClick={onSearch}>
        조회
      </ActionButton>
      <ActionButton variant="default" icon="refresh" onClick={onReset}>
        초기화
      </ActionButton>
    </div>
  );
}

/**
 * 목록 헤더 버튼 그룹 (Excel 다운로드 등)
 */
interface ListHeaderButtonsProps {
  onExcelDownload?: () => void;
  onExcelUpload?: () => void;
}

export function ListHeaderButtons({
  onExcelDownload,
  onExcelUpload,
}: ListHeaderButtonsProps) {
  return (
    <div className="flex gap-2">
      {onExcelDownload && (
        <ActionButton
          variant="success"
          icon="download"
          onClick={onExcelDownload}
          className="px-3 py-1.5 text-sm"
        >
          엑셀다운로드
        </ActionButton>
      )}
      {onExcelUpload && (
        <ActionButton
          variant="info"
          icon="upload"
          onClick={onExcelUpload}
          className="px-3 py-1.5 text-sm"
        >
          엑셀업로드
        </ActionButton>
      )}
    </div>
  );
}
