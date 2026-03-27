'use client';

import { useCallback, useEffect, useRef } from 'react';

interface UseEnterNavigationOptions {
  containerRef?: React.RefObject<HTMLElement>;
  onLastFieldEnter?: () => void;
  excludeSelector?: string;
}

/**
 * Enter 키 입력 시 다음 입력 필드로 이동하는 훅
 * Tab 키는 브라우저 기본 동작으로 이미 지원됨
 */
export function useEnterNavigation(options: UseEnterNavigationOptions = {}) {
  const { containerRef, onLastFieldEnter, excludeSelector } = options;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Enter 키만 처리
      if (event.key !== 'Enter') return;

      const target = event.target as HTMLElement;

      // textarea에서는 Enter 동작 유지 (줄바꿈)
      if (target.tagName === 'TEXTAREA') return;

      // button에서는 Enter 동작 유지 (클릭)
      if (target.tagName === 'BUTTON') return;

      // 제외 셀렉터에 해당하면 무시
      if (excludeSelector && target.matches(excludeSelector)) return;

      // input, select에서만 동작
      if (!['INPUT', 'SELECT'].includes(target.tagName)) return;

      // submit 타입 input은 제외
      if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'submit') return;

      // 컨테이너 결정
      const container = containerRef?.current || document.body;

      // 컨테이너 내부의 요소인지 확인
      if (containerRef?.current && !containerRef.current.contains(target)) return;

      event.preventDefault();

      // 포커스 가능한 요소들 찾기
      const focusableSelector = 'input:not([disabled]):not([type="hidden"]):not([type="submit"]), select:not([disabled])';
      const focusableElements = Array.from(container.querySelectorAll(focusableSelector)) as HTMLElement[];

      // 현재 요소 인덱스 찾기
      const currentIndex = focusableElements.indexOf(target);

      if (currentIndex === -1) return;

      // 다음 요소로 이동
      if (currentIndex < focusableElements.length - 1) {
        focusableElements[currentIndex + 1].focus();
      } else {
        // 마지막 필드에서 Enter 시 콜백 호출
        onLastFieldEnter?.();
      }
    };

    // document 레벨에서 이벤트 리스너 등록 (capture phase 사용)
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [containerRef, onLastFieldEnter, excludeSelector]);
}

/**
 * 폼 컨테이너에 Enter 키 네비게이션을 적용하는 래퍼 컴포넌트용 훅
 */
export function useFormNavigation(onSubmit?: () => void) {
  const formRef = useRef<HTMLDivElement>(null);

  useEnterNavigation({
    containerRef: formRef as React.RefObject<HTMLElement>,
    onLastFieldEnter: onSubmit,
  });

  return formRef;
}

export default useEnterNavigation;
