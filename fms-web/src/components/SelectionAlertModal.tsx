'use client';

import { useEffect } from 'react';

interface SelectionAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export default function SelectionAlertModal({
  isOpen,
  onClose,
  title = '알림',
  message = '목록에서 데이터를 선택해주세요.',
}: SelectionAlertModalProps) {
  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div className="relative bg-gray-50 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* 헤더 */}
        <div className="flex items-center gap-3 p-5 border-b border-gray-200">
          <div className="flex items-center justify-center w-10 h-10 bg-yellow-500/20 rounded-full">
            <svg
              className="w-6 h-6 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>

        {/* 본문 */}
        <div className="p-5">
          <p className="text-gray-900 text-center">{message}</p>
        </div>

        {/* 푸터 */}
        <div className="flex justify-center p-5 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-[#E8A838] text-[#0C1222] font-semibold rounded-lg hover:bg-[#D4943A] transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
