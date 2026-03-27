'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface UseScreenCloseOptions {
  hasChanges: boolean;
  listPath: string;
  onSave?: () => Promise<boolean> | boolean;
}

interface UseScreenCloseReturn {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  handleCloseClick: () => void;
  handleModalClose: () => void;
  handleDiscard: () => void;
  handleSave?: () => Promise<void>;
}

/**
 * 화면닫기 통합 훅
 *
 * 기능:
 * - 브라우저 뒤로가기 버튼 감지 및 차단
 * - 마우스 뒤로가기 버튼 감지 (button 3, 4)
 * - beforeunload 이벤트 처리 (페이지 새로고침/탭 닫기)
 * - 명시적 목록 페이지 이동 (router.push)
 *
 * 사용법:
 * ```typescript
 * const {
 *   showModal,
 *   handleCloseClick,
 *   handleModalClose,
 *   handleDiscard,
 *   handleSave
 * } = useScreenClose({
 *   hasChanges: hasUnsavedChanges,
 *   listPath: LIST_PATHS.BOOKING_SEA,
 *   onSave: handleSubmit,
 * });
 * ```
 */
export function useScreenClose({
  hasChanges,
  listPath,
  onSave
}: UseScreenCloseOptions): UseScreenCloseReturn {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const hasAddedHistory = useRef(false);

  // 브라우저 뒤로가기 차단
  useEffect(() => {
    const handlePopState = () => {
      if (hasChanges) {
        window.history.pushState(null, '', window.location.href);
        setShowModal(true);
      } else {
        router.push(listPath);
      }
    };

    // 히스토리 상태 추가 (한 번만)
    if (!hasAddedHistory.current) {
      window.history.pushState(null, '', window.location.href);
      hasAddedHistory.current = true;
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [hasChanges, listPath, router]);

  // 마우스 뒤로가기 버튼 차단
  useEffect(() => {
    const handleMouseBack = (e: MouseEvent) => {
      if (e.button === 3 || e.button === 4) {
        e.preventDefault();
        if (hasChanges) {
          setShowModal(true);
        } else {
          router.push(listPath);
        }
      }
    };

    window.addEventListener('mouseup', handleMouseBack);
    return () => window.removeEventListener('mouseup', handleMouseBack);
  }, [hasChanges, listPath, router]);

  // beforeunload 처리 (페이지 새로고침/탭 닫기)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  // 화면닫기 버튼 클릭
  const handleCloseClick = useCallback(() => {
    if (hasChanges) {
      setShowModal(true);
    } else {
      router.push(listPath);
    }
  }, [hasChanges, listPath, router]);

  // 모달 취소 (팝업 닫기)
  const handleModalClose = useCallback(() => {
    setShowModal(false);
  }, []);

  // 저장하지 않음 (목록으로 이동)
  const handleDiscard = useCallback(() => {
    setShowModal(false);
    router.push(listPath);
  }, [listPath, router]);

  // 저장 후 처리
  const handleSave = useCallback(async () => {
    if (onSave) {
      const result = await onSave();
      if (result) {
        setShowModal(false);
      }
    }
  }, [onSave]);

  return {
    showModal,
    setShowModal,
    handleCloseClick,
    handleModalClose,
    handleDiscard,
    handleSave: onSave ? handleSave : undefined,
  };
}

export default useScreenClose;
