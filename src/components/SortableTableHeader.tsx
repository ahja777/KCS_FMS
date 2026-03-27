'use client';

import { useState, ReactNode } from 'react';

// 정렬 설정 인터페이스
export interface SortConfig<T> {
  key: keyof T | null;
  direction: 'asc' | 'desc';
}

// 정렬 아이콘 컴포넌트 - 상/하 화살표 (CSS 클래스 기반)
interface SortIconProps<T> {
  columnKey: keyof T;
  sortConfig: SortConfig<T>;
}

export function SortIcon<T>({ columnKey, sortConfig }: SortIconProps<T>) {
  const isActive = sortConfig.key === columnKey;
  const isAsc = isActive && sortConfig.direction === 'asc';
  const isDesc = isActive && sortConfig.direction === 'desc';

  return (
    <span className={`sort-icon ${isAsc ? 'asc' : ''} ${isDesc ? 'desc' : ''}`}>
      <span className="sort-arrow sort-arrow-up" />
      <span className="sort-arrow sort-arrow-down" />
    </span>
  );
}

// 인라인 스타일 버전의 정렬 아이콘 (CSS가 로드되지 않은 경우 대비)
export function SortIconInline<T>({ columnKey, sortConfig }: SortIconProps<T>) {
  const isActive = sortConfig.key === columnKey;

  return (
    <span className="inline-flex flex-col ml-1.5 gap-px">
      {/* 위 화살표 (오름차순) */}
      <span
        style={{
          width: 0,
          height: 0,
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderBottom: `5px solid ${isActive && sortConfig.direction === 'asc' ? '#ffffff' : 'rgba(255,255,255,0.35)'}`,
        }}
      />
      {/* 아래 화살표 (내림차순) */}
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

// 정렬 가능한 테이블 헤더 컴포넌트
interface SortableHeaderProps<T> {
  columnKey: keyof T;
  label: string;
  sortConfig: SortConfig<T>;
  onSort: (key: keyof T) => void;
  className?: string;
  children?: ReactNode;
}

export function SortableHeader<T>({
  columnKey,
  label,
  sortConfig,
  onSort,
  className = '',
  children,
}: SortableHeaderProps<T>) {
  return (
    <th
      className={`sortable cursor-pointer select-none ${className}`}
      onClick={() => onSort(columnKey)}
    >
      <span className="inline-flex items-center justify-center">
        {children || label}
        <SortIconInline columnKey={columnKey} sortConfig={sortConfig} />
      </span>
    </th>
  );
}

// 정렬 훅
export function useSort<T>(initialKey: keyof T | null = null, initialDirection: 'asc' | 'desc' = 'asc') {
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
    key: initialKey,
    direction: initialDirection,
  });

  const handleSort = (key: keyof T) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortData = (data: T[]): T[] => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue, 'ko');
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  };

  return { sortConfig, handleSort, sortData, setSortConfig };
}
