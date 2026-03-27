'use client';

import { useRouter } from 'next/navigation';

interface RegisterActionButtonsProps {
  mode: 'new' | 'edit';
  isSubmitting?: boolean;
  onNew?: () => void;
  onSave: () => void;
  onDelete?: () => void;
  onCancel?: () => void;
  listPath: string;
  showDelete?: boolean;
}

export default function RegisterActionButtons({
  mode,
  isSubmitting = false,
  onNew,
  onSave,
  onDelete,
  onCancel,
  listPath,
  showDelete = true,
}: RegisterActionButtonsProps) {
  const router = useRouter();

  const handleNew = () => {
    if (onNew) {
      onNew();
    } else {
      // 기본: 현재 페이지 새로고침 (쿼리 파라미터 없이)
      router.push(window.location.pathname);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      // 기본: 목록 페이지로 이동
      router.push(listPath);
    }
  };

  return (
    <div className="flex gap-2">
      {/* 신규 버튼 */}
      <button
        onClick={handleNew}
        disabled={isSubmitting}
        className="px-4 py-2 bg-[#059669] text-white font-semibold rounded-lg hover:bg-[#047857] transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        신규
      </button>

      {/* 저장/수정 버튼 */}
      <button
        onClick={onSave}
        disabled={isSubmitting}
        className="px-4 py-2 bg-[#1A2744] text-white font-semibold rounded-lg hover:bg-[#243354] transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        {isSubmitting ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {mode === 'edit' ? '수정중...' : '저장중...'}
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {mode === 'edit' ? '수정' : '저장'}
          </>
        )}
      </button>

      {/* 삭제 버튼 (수정 모드에서만 표시) */}
      {showDelete && mode === 'edit' && onDelete && (
        <button
          onClick={onDelete}
          disabled={isSubmitting}
          className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          삭제
        </button>
      )}

      {/* 취소 버튼 */}
      <button
        onClick={handleCancel}
        disabled={isSubmitting}
        className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)] transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        취소
      </button>
    </div>
  );
}
