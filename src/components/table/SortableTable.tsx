'use client';

import { useState, useMemo, useCallback, ReactNode } from 'react';

// 정렬 설정 타입
export interface SortConfig<T> {
  key: keyof T | null;
  direction: 'asc' | 'desc';
}

// 정렬 훅 반환 타입
export interface UseSortingResult<T> {
  sortConfig: SortConfig<T>;
  setSortConfig: React.Dispatch<React.SetStateAction<SortConfig<T>>>;
  handleSort: (key: keyof T) => void;
  sortData: (data: T[]) => T[];
  getSortStatusText: (columnLabels?: Record<string, string>) => string;
  resetSort: () => void;
}

/**
 * 테이블 정렬을 위한 커스텀 훅
 * @template T - 데이터 타입
 * @returns 정렬 관련 상태 및 함수
 */
export function useSorting<T extends object>(): UseSortingResult<T> {
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
    key: null,
    direction: 'asc',
  });

  // 정렬 토글 핸들러
  const handleSort = useCallback((key: keyof T) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  // 데이터 정렬 함수
  const sortData = useCallback((data: T[]): T[] => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof T];
      const bValue = b[sortConfig.key as keyof T];

      // null/undefined 처리
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;

      // 숫자 비교
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      }
      // 날짜 문자열 비교 (YYYY-MM-DD 형식)
      else if (
        typeof aValue === 'string' &&
        typeof bValue === 'string' &&
        /^\d{4}-\d{2}-\d{2}/.test(aValue) &&
        /^\d{4}-\d{2}-\d{2}/.test(bValue)
      ) {
        comparison = aValue.localeCompare(bValue);
      }
      // 일반 문자열 비교 (한글 지원)
      else {
        comparison = String(aValue).localeCompare(String(bValue), 'ko');
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [sortConfig]);

  // 정렬 상태 텍스트 생성
  const getSortStatusText = useCallback((columnLabels?: Record<string, string>): string => {
    if (!sortConfig.key) return '';
    const label = columnLabels?.[String(sortConfig.key)] || String(sortConfig.key);
    const direction = sortConfig.direction === 'asc' ? '오름차순' : '내림차순';
    return ` | 정렬: ${label} ${direction}`;
  }, [sortConfig]);

  // 정렬 초기화
  const resetSort = useCallback(() => {
    setSortConfig({ key: null, direction: 'asc' });
  }, []);

  return {
    sortConfig,
    setSortConfig,
    handleSort,
    sortData,
    getSortStatusText,
    resetSort,
  };
}

// 정렬 아이콘 Props
interface SortIconProps<T> {
  columnKey: keyof T;
  sortConfig: SortConfig<T>;
  activeColor?: string;
  inactiveColor?: string;
}

/**
 * 정렬 방향 표시 아이콘 (CSS 삼각형 스타일)
 */
export function SortIcon<T>({
  columnKey,
  sortConfig,
}: SortIconProps<T>) {
  const isActive = sortConfig.key === columnKey;

  return (
    <span className="inline-flex flex-col ml-1.5 gap-px">
      <span
        style={{
          width: 0,
          height: 0,
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderBottom: `5px solid ${isActive && sortConfig.direction === 'asc' ? '#ffffff' : 'rgba(255,255,255,0.35)'}`,
        }}
      />
      <span
        style={{
          width: 0,
          height: 0,
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderTop: `5px solid ${isActive && sortConfig.direction === 'desc' ? '#ffffff' : 'rgba(255,255,255,0.35)'}`,
        }}
      />
    </span>
  );
}

// 정렬 가능한 헤더 Props
interface SortableHeaderProps<T> {
  columnKey: keyof T;
  label: string;
  sortConfig: SortConfig<T>;
  onSort: (key: keyof T) => void;
  className?: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

/**
 * 정렬 가능한 테이블 헤더 컴포넌트
 */
export function SortableHeader<T>({
  columnKey,
  label,
  sortConfig,
  onSort,
  className = '',
  align = 'center',
  width,
}: SortableHeaderProps<T>) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align];

  return (
    <th
      className={`p-3 text-sm font-semibold cursor-pointer hover:bg-[var(--surface-200)] select-none transition-colors ${alignClass} ${className}`}
      onClick={() => onSort(columnKey)}
      style={{ width }}
    >
      <span className="inline-flex items-center justify-center">
        {label}
        <SortIcon columnKey={columnKey} sortConfig={sortConfig} />
      </span>
    </th>
  );
}

// 정렬 상태 배지 Props
interface SortStatusBadgeProps {
  statusText: string;
  onReset?: () => void;
}

/**
 * 현재 정렬 상태를 표시하는 배지
 */
export function SortStatusBadge({ statusText, onReset }: SortStatusBadgeProps) {
  if (!statusText) return null;

  return (
    <span className="inline-flex items-center gap-2 px-2 py-1 bg-[#E8A838]/20 text-[#E8A838] rounded text-xs font-medium">
      {statusText}
      {onReset && (
        <button
          onClick={onReset}
          className="hover:text-white transition-colors"
          title="정렬 초기화"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}

// 테이블 래퍼 컴포넌트 (정렬 기능 포함)
interface SortableTableWrapperProps<T> {
  data: T[];
  children: (sortedData: T[], sortingProps: UseSortingResult<T>) => ReactNode;
}

/**
 * 정렬 기능이 포함된 테이블 래퍼
 * @example
 * <SortableTableWrapper data={items}>
 *   {(sortedData, { sortConfig, handleSort }) => (
 *     <table>
 *       <thead>
 *         <tr>
 *           <SortableHeader columnKey="name" label="이름" sortConfig={sortConfig} onSort={handleSort} />
 *         </tr>
 *       </thead>
 *       <tbody>
 *         {sortedData.map(item => <tr key={item.id}>...</tr>)}
 *       </tbody>
 *     </table>
 *   )}
 * </SortableTableWrapper>
 */
export function SortableTableWrapper<T extends object>({
  data,
  children,
}: SortableTableWrapperProps<T>) {
  const sortingResult = useSorting<T>();
  const sortedData = useMemo(
    () => sortingResult.sortData(data),
    [data, sortingResult.sortData]
  );

  return <>{children(sortedData, sortingResult)}</>;
}
