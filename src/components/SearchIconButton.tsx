'use client';

import React from 'react';

interface SearchIconButtonProps {
  onClick: () => void;
  className?: string;
}

/**
 * 38x38px 돋보기 아이콘 버튼 (찾기 팝업 트리거용)
 * - 인라인 스타일 사용 (모달 내부 렌더링 호환)
 * - aria-label="찾기" (Playwright has-text("찾기") 호환)
 */
export default function SearchIconButton({ onClick, className }: SearchIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="찾기"
      className={className}
      style={{
        width: '38px',
        height: '38px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f3f4f6',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = '#e5e7eb';
        e.currentTarget.style.borderColor = '#9ca3af';
        const svg = e.currentTarget.querySelector('svg');
        if (svg) svg.style.color = '#374151';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = '#f3f4f6';
        e.currentTarget.style.borderColor = '#d1d5db';
        const svg = e.currentTarget.querySelector('svg');
        if (svg) svg.style.color = '#6b7280';
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        style={{ width: '16px', height: '16px', color: '#6b7280' }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </button>
  );
}
