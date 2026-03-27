'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAll,
  getById,
  create,
  update,
  remove,
  removeMany,
  generateDocNo,
  StorageKey,
  BaseItem,
} from '@/lib/dataManager';

interface UseCRUDOptions<T> {
  storageKey: StorageKey;
  listPath: string;
  docNoPrefix: string;
  onSaveSuccess?: (item: T) => void;
  onDeleteSuccess?: () => void;
}

interface UseCRUDReturn<T> {
  // State
  data: T | null;
  allData: T[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // CRUD Operations
  loadItem: (id: string) => void;
  loadAll: () => void;
  saveItem: (item: Partial<T>) => Promise<T | null>;
  deleteItem: (id: string) => boolean;
  deleteMany: (ids: string[]) => number;

  // Navigation
  goToList: (confirmMessage?: string) => void;
  goToRegister: () => void;
  goToEdit: (id: string) => void;

  // Document number
  generateNewDocNo: () => string;
}

export function useCRUD<T extends BaseItem>(options: UseCRUDOptions<T>): UseCRUDReturn<T> {
  const router = useRouter();
  const { storageKey, listPath, docNoPrefix, onSaveSuccess, onDeleteSuccess } = options;

  const [data, setData] = useState<T | null>(null);
  const [allData, setAllData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 전체 데이터 로드
  const loadAll = useCallback(() => {
    setIsLoading(true);
    try {
      const items = getAll<T>(storageKey);
      setAllData(items);
      setError(null);
    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [storageKey]);

  // 단일 아이템 로드
  const loadItem = useCallback((id: string) => {
    setIsLoading(true);
    try {
      const item = getById<T>(storageKey, id);
      setData(item);
      setError(null);
    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [storageKey]);

  // 저장 (신규/수정)
  const saveItem = useCallback(async (item: Partial<T>): Promise<T | null> => {
    setIsSaving(true);
    setError(null);

    try {
      let savedItem: T;

      if (item.id) {
        // 수정
        const updated = update<T>(storageKey, item.id, item);
        if (!updated) {
          throw new Error('데이터를 찾을 수 없습니다.');
        }
        savedItem = updated;
      } else {
        // 신규
        savedItem = create<T>(storageKey, item as Omit<T, 'id' | 'createdAt'>);
      }

      setData(savedItem);
      onSaveSuccess?.(savedItem);
      return savedItem;
    } catch (err) {
      setError('저장 중 오류가 발생했습니다.');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [storageKey, onSaveSuccess]);

  // 삭제
  const deleteItem = useCallback((id: string): boolean => {
    try {
      const success = remove(storageKey, id);
      if (success) {
        setAllData(prev => prev.filter(item => item.id !== id));
        onDeleteSuccess?.();
      }
      return success;
    } catch (err) {
      setError('삭제 중 오류가 발생했습니다.');
      return false;
    }
  }, [storageKey, onDeleteSuccess]);

  // 다중 삭제
  const deleteMany = useCallback((ids: string[]): number => {
    try {
      const count = removeMany(storageKey, ids);
      if (count > 0) {
        setAllData(prev => prev.filter(item => !ids.includes(item.id)));
        onDeleteSuccess?.();
      }
      return count;
    } catch (err) {
      setError('삭제 중 오류가 발생했습니다.');
      return 0;
    }
  }, [storageKey, onDeleteSuccess]);

  // 목록으로 이동
  const goToList = useCallback((confirmMessage?: string) => {
    if (confirmMessage) {
      if (confirm(confirmMessage)) {
        router.push(listPath);
      }
    } else {
      router.push(listPath);
    }
  }, [router, listPath]);

  // 등록 화면으로 이동
  const goToRegister = useCallback(() => {
    router.push(`${listPath}/register`);
  }, [router, listPath]);

  // 수정 화면으로 이동
  const goToEdit = useCallback((id: string) => {
    router.push(`${listPath}/register?id=${id}`);
  }, [router, listPath]);

  // 문서번호 생성
  const generateNewDocNo = useCallback(() => {
    return generateDocNo(docNoPrefix);
  }, [docNoPrefix]);

  return {
    data,
    allData,
    isLoading,
    isSaving,
    error,
    loadItem,
    loadAll,
    saveItem,
    deleteItem,
    deleteMany,
    goToList,
    goToRegister,
    goToEdit,
    generateNewDocNo,
  };
}

// 브라우저 뒤로가기 처리 훅
export function useBackNavigation(listPath: string, hasUnsavedChanges: boolean = false) {
  const router = useRouter();

  useEffect(() => {
    // popstate 이벤트 (브라우저 뒤로가기 버튼)
    const handlePopState = (event: PopStateEvent) => {
      if (hasUnsavedChanges) {
        const confirmLeave = confirm('작성 중인 내용이 저장되지 않습니다. 목록으로 이동하시겠습니까?');
        if (confirmLeave) {
          router.push(listPath);
        } else {
          // 뒤로가기 취소 - 현재 URL 유지
          window.history.pushState(null, '', window.location.href);
        }
      }
    };

    // 히스토리 상태 추가 (뒤로가기 감지용)
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [router, listPath, hasUnsavedChanges]);

  // 마우스 뒤로가기 버튼 처리 (마우스 4번 버튼)
  useEffect(() => {
    const handleMouseBack = (event: MouseEvent) => {
      // 마우스 뒤로가기 버튼 (button === 3 또는 4)
      if (event.button === 3 || event.button === 4) {
        event.preventDefault();
        if (hasUnsavedChanges) {
          const confirmLeave = confirm('작성 중인 내용이 저장되지 않습니다. 목록으로 이동하시겠습니까?');
          if (confirmLeave) {
            router.push(listPath);
          }
        } else {
          router.push(listPath);
        }
      }
    };

    // auxclick 이벤트로 마우스 추가 버튼 감지
    window.addEventListener('mouseup', handleMouseBack);

    return () => {
      window.removeEventListener('mouseup', handleMouseBack);
    };
  }, [router, listPath, hasUnsavedChanges]);

  const goToList = useCallback((confirm?: boolean) => {
    if (confirm && hasUnsavedChanges) {
      const confirmLeave = window.confirm('작성 중인 내용이 저장되지 않습니다. 목록으로 이동하시겠습니까?');
      if (!confirmLeave) return;
    }
    router.push(listPath);
  }, [router, listPath, hasUnsavedChanges]);

  return { goToList };
}
