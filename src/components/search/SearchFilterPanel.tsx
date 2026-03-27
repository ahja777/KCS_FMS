'use client';

import React, { ReactNode } from 'react';

interface SearchFilterPanelProps {
  title?: string;
  children: ReactNode;
  onSearch: () => void;
  onReset: () => void;
  searchButtonText?: string;
  resetButtonText?: string;
  className?: string;
}

/**
 * 통일된 검색조건 패널 컴포넌트
 * 모든 목록 화면에서 동일한 디자인으로 검색 영역 제공
 */
export default function SearchFilterPanel({
  title = '검색조건',
  children,
  onSearch,
  onReset,
  searchButtonText = '조회',
  resetButtonText = '초기화',
  className = '',
}: SearchFilterPanelProps) {
  return (
    <div className={`search-filter-panel ${className}`}>
      {/* 헤더 */}
      <div className="search-filter-header">
        <svg
          className="search-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <h3 className="search-title">{title}</h3>
      </div>

      {/* 검색 필드 영역 */}
      <div className="search-filter-body">
        {children}
      </div>

      {/* 버튼 영역 */}
      <div className="search-filter-footer">
        <button
          onClick={onSearch}
          className="search-btn primary"
        >
          {searchButtonText}
        </button>
        <button
          onClick={onReset}
          className="search-btn secondary"
        >
          {resetButtonText}
        </button>
      </div>

      <style jsx>{`
        .search-filter-panel {
          background: var(--surface-100, #1e1e2e);
          border: 1px solid var(--border, #2a2a3e);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
                      0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .search-filter-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border, #2a2a3e);
        }

        .search-icon {
          width: 20px;
          height: 20px;
          color: var(--foreground, #ffffff);
          flex-shrink: 0;
        }

        .search-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--foreground, #ffffff);
          margin: 0;
          letter-spacing: -0.01em;
        }

        .search-filter-body {
          padding: 20px;
        }

        .search-filter-footer {
          display: flex;
          justify-content: center;
          gap: 10px;
          padding: 16px 20px;
          border-top: 1px solid var(--border, #2a2a3e);
          background: rgba(0, 0, 0, 0.1);
        }

        .search-btn {
          padding: 10px 28px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .search-btn.primary {
          background: linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%);
          color: white;
          box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);
        }

        .search-btn.primary:hover {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
          box-shadow: 0 4px 8px rgba(37, 99, 235, 0.4);
          transform: translateY(-1px);
        }

        .search-btn.secondary {
          background: var(--surface-200, #2a2a3e);
          color: var(--foreground, #ffffff);
          border: 1px solid var(--border, #3a3a4e);
        }

        .search-btn.secondary:hover {
          background: var(--surface-300, #3a3a4e);
          border-color: var(--border-hover, #4a4a5e);
        }
      `}</style>
    </div>
  );
}

/**
 * 검색 필드 그리드 컨테이너
 */
export function SearchFilterGrid({
  children,
  columns = 6,
  className = ''
}: {
  children: ReactNode;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={`search-grid ${className}`}>
      {children}
      <style jsx>{`
        .search-grid {
          display: grid;
          grid-template-columns: repeat(${columns}, 1fr);
          gap: 16px;
        }

        @media (max-width: 1400px) {
          .search-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        @media (max-width: 1024px) {
          .search-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 768px) {
          .search-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .search-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * 검색 필드 아이템
 */
export function SearchFilterField({
  label,
  required = false,
  colSpan = 1,
  children,
  className = '',
}: {
  label: string;
  required?: boolean;
  colSpan?: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`search-field ${className}`} style={{ gridColumn: `span ${colSpan}` }}>
      <label className="field-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
      <div className="field-content">
        {children}
      </div>

      <style jsx>{`
        .search-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--foreground, #ffffff);
          letter-spacing: -0.01em;
        }

        .required {
          color: #ef4444;
          margin-left: 4px;
        }

        .field-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}

/**
 * 날짜 범위 입력 필드
 */
export function DateRangeField({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  className = '',
}: {
  startValue: string;
  endValue: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={`date-range ${className}`}>
      <input
        type="date"
        value={startValue}
        onChange={(e) => onStartChange(e.target.value)}
        className="date-input"
      />
      <span className="separator">~</span>
      <input
        type="date"
        value={endValue}
        onChange={(e) => onEndChange(e.target.value)}
        className="date-input"
      />

      <style jsx>{`
        .date-range {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .date-input {
          flex: 1;
          height: 38px;
          padding: 0 12px;
          background: var(--surface-50, #0f0f1a);
          border: 1px solid var(--border, #2a2a3e);
          border-radius: 8px;
          color: var(--foreground, #ffffff);
          font-size: 13px;
          transition: all 0.2s ease;
        }

        .date-input:focus {
          outline: none;
          border-color: var(--border-hover, #4a4a5e);
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.05);
        }

        .separator {
          color: var(--muted, #6b7280);
          font-size: 14px;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}

/**
 * 검색 팝업 버튼이 있는 입력 필드
 */
export function SearchInputField({
  value,
  onChange,
  onSearchClick,
  placeholder = '',
  readOnly = false,
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  onSearchClick?: () => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}) {
  return (
    <div className={`search-input-wrapper ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className="search-input"
      />
      {onSearchClick && (
        <button
          type="button"
          onClick={onSearchClick}
          className="search-popup-btn"
        >
          <svg
            className="popup-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      )}

      <style jsx>{`
        .search-input-wrapper {
          display: flex;
          gap: 6px;
          flex: 1;
        }

        .search-input {
          flex: 1;
          height: 38px;
          padding: 0 12px;
          background: var(--surface-50, #0f0f1a);
          border: 1px solid var(--border, #2a2a3e);
          border-radius: 8px;
          color: var(--foreground, #ffffff);
          font-size: 13px;
          transition: all 0.2s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--border-hover, #4a4a5e);
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.05);
        }

        .search-input::placeholder {
          color: var(--muted, #6b7280);
        }

        .search-input:read-only {
          background: var(--surface-200, #1e1e2e);
          cursor: not-allowed;
        }

        .search-popup-btn {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--surface-200, #1e1e2e);
          border: 1px solid var(--border, #2a2a3e);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .search-popup-btn:hover {
          background: var(--surface-300, #2a2a3e);
          border-color: var(--border-hover, #4a4a5e);
        }

        .popup-icon {
          width: 16px;
          height: 16px;
          color: var(--muted, #9ca3af);
        }

        .search-popup-btn:hover .popup-icon {
          color: var(--foreground, #ffffff);
        }
      `}</style>
    </div>
  );
}

/**
 * Select 필드
 */
export function SelectField({
  value,
  onChange,
  options,
  placeholder = '전체',
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`select-field ${className}`}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}

      <style jsx>{`
        .select-field {
          width: 100%;
          height: 38px;
          padding: 0 12px;
          background: var(--surface-50, #0f0f1a);
          border: 1px solid var(--border, #2a2a3e);
          border-radius: 8px;
          color: var(--foreground, #ffffff);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          background-size: 16px;
          padding-right: 36px;
        }

        .select-field:focus {
          outline: none;
          border-color: var(--border-hover, #4a4a5e);
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </select>
  );
}

/**
 * 텍스트 입력 필드
 */
export function TextField({
  value,
  onChange,
  placeholder = '',
  readOnly = false,
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}) {
  return (
    <>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`text-field ${className}`}
      />

      <style jsx>{`
        .text-field {
          width: 100%;
          height: 38px;
          padding: 0 12px;
          background: var(--surface-50, #0f0f1a);
          border: 1px solid var(--border, #2a2a3e);
          border-radius: 8px;
          color: var(--foreground, #ffffff);
          font-size: 13px;
          transition: all 0.2s ease;
        }

        .text-field:focus {
          outline: none;
          border-color: var(--border-hover, #4a4a5e);
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.05);
        }

        .text-field::placeholder {
          color: var(--muted, #6b7280);
        }

        .text-field:read-only {
          background: var(--surface-200, #1e1e2e);
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
}
