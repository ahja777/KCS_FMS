'use client';

import { useEffect, useCallback, useRef } from 'react';

interface UseCloseConfirmProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  onConfirmClose: () => void;
}

/**
 * 브라우저 뒤로가기 버튼 클릭 시 종료 확인 팝업을 표시하는 훅
 *
 * 사용법:
 * const [showCloseModal, setShowCloseModal] = useState(false);
 *
 * const handleConfirmClose = () => {
 *   setShowCloseModal(false);
 *   router.back();
 * };
 *
 * useCloseConfirm({
 *   showModal: showCloseModal,
 *   setShowModal: setShowCloseModal,
 *   onConfirmClose: handleConfirmClose,
 * });
 */
export function useCloseConfirm({ showModal, setShowModal, onConfirmClose }: UseCloseConfirmProps) {
  const isBackNavigation = useRef(false);
  const hasAddedHistory = useRef(false);

  // 뒤로가기 확인 후 실제 이동 처리
  const handleConfirm = useCallback(() => {
    isBackNavigation.current = true;
    onConfirmClose();
  }, [onConfirmClose]);

  useEffect(() => {
    // 히스토리 상태 추가 (한 번만)
    if (!hasAddedHistory.current) {
      window.history.pushState({ preventBack: true }, '', window.location.href);
      hasAddedHistory.current = true;
    }

    const handlePopState = (event: PopStateEvent) => {
      // 이미 확인된 뒤로가기인 경우 무시
      if (isBackNavigation.current) {
        isBackNavigation.current = false;
        return;
      }

      // 뒤로가기 방지하고 팝업 표시
      event.preventDefault();
      window.history.pushState({ preventBack: true }, '', window.location.href);
      setShowModal(true);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [setShowModal]);

  // 마우스 뒤로가기 버튼 차단 (button 3: 뒤로, button 4: 앞으로)
  useEffect(() => {
    const handleMouseBack = (e: MouseEvent) => {
      if (e.button === 3 || e.button === 4) {
        e.preventDefault();
        setShowModal(true);
      }
    };

    window.addEventListener('mouseup', handleMouseBack);
    return () => window.removeEventListener('mouseup', handleMouseBack);
  }, [setShowModal]);

  // 모달이 닫힐 때 (취소 버튼) 히스토리 상태 유지
  useEffect(() => {
    if (!showModal && !isBackNavigation.current) {
      // 모달이 닫히면 히스토리 상태 다시 추가
      if (hasAddedHistory.current) {
        // 이미 추가된 상태면 그대로 유지
      }
    }
  }, [showModal]);

  return { handleConfirm };
}

export default useCloseConfirm;
