'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDiscard: () => void;
  onSave?: () => void;
  message?: string;
}

export function UnsavedChangesModal({
  isOpen,
  onClose,
  onDiscard,
  onSave,
  message = '저장하지 않은 변경사항이 있습니다.\n이 페이지를 떠나시겠습니까?'
}: UnsavedChangesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">저장 확인</h3>
              <p className="text-sm text-gray-500">변경사항이 감지되었습니다</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <p className="text-gray-900 whitespace-pre-line">{message}</p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onDiscard}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            저장 안함
          </button>
          {onSave && (
            <button
              onClick={onSave}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors"
              style={{ background: 'linear-gradient(135deg, #E8A838 0%, #D4943A 100%)' }}
            >
              저장
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Custom hook for managing unsaved changes
interface UseUnsavedChangesOptions {
  hasChanges: boolean;
  onSave?: () => void;
  message?: string;
}

export function useUnsavedChanges({ hasChanges, onSave, message }: UseUnsavedChangesOptions) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  // Handle browser back button and page refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  // Handle popstate (browser back/forward buttons)
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (hasChanges) {
        // Push a new state to prevent navigation
        window.history.pushState(null, '', window.location.href);
        setShowModal(true);
        setPendingNavigation(() => () => {
          window.history.back();
        });
      }
    };

    // Push initial state
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => window.removeEventListener('popstate', handlePopState);
  }, [hasChanges]);

  const handleClose = useCallback(() => {
    setShowModal(false);
    setPendingNavigation(null);
  }, []);

  const handleDiscard = useCallback(() => {
    setShowModal(false);
    if (pendingNavigation) {
      // Allow navigation by removing the history state first
      window.removeEventListener('popstate', () => {});
      pendingNavigation();
    } else {
      router.back();
    }
  }, [pendingNavigation, router]);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave();
    }
    setShowModal(false);
    if (pendingNavigation) {
      setTimeout(() => pendingNavigation(), 100);
    } else {
      setTimeout(() => router.back(), 100);
    }
  }, [onSave, pendingNavigation, router]);

  // Function to trigger the modal for close button or other navigation
  const confirmNavigation = useCallback((navigateCallback?: () => void) => {
    if (hasChanges) {
      setShowModal(true);
      if (navigateCallback) {
        setPendingNavigation(() => navigateCallback);
      }
      return false;
    }
    if (navigateCallback) {
      navigateCallback();
    } else {
      router.back();
    }
    return true;
  }, [hasChanges, router]);

  return {
    showModal,
    setShowModal,
    handleClose,
    handleDiscard,
    handleSave: onSave ? handleSave : undefined,
    confirmNavigation,
    message,
  };
}
