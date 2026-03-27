'use client';

import React, { useState, useEffect, useCallback } from 'react';
import PageLayout from '@/components/PageLayout';

interface UserType {
  USER_TYPE_CD: string;
  USER_TYPE_NM: string;
}

interface Menu {
  MENU_ID: string;
  MENU_NM: string;
  MENU_PATH: string;
  PARENT_MENU_ID: string | null;
  MENU_LEVEL: number;
  SORT_ORDER: number;
}

interface Permission {
  PERM_ID: number;
  USER_TYPE_CD: string;
  USER_TYPE_NM: string;
  USER_ID: string | null;
  MENU_ID: string;
  MENU_NM: string;
  MENU_PATH: string;
  MENU_LEVEL: number;
  CAN_READ: string;
  CAN_CREATE: string;
  CAN_UPDATE: string;
  CAN_DELETE: string;
  CAN_PRINT: string;
  CAN_EXPORT: string;
}

interface PermRow {
  MENU_ID: string;
  MENU_NM: string;
  MENU_LEVEL: number;
  PARENT_MENU_ID: string | null;
  CAN_READ: string;
  CAN_CREATE: string;
  CAN_UPDATE: string;
  CAN_DELETE: string;
  CAN_PRINT: string;
  CAN_EXPORT: string;
}

const PERM_COLS = ['CAN_READ', 'CAN_CREATE', 'CAN_UPDATE', 'CAN_DELETE', 'CAN_PRINT', 'CAN_EXPORT'] as const;
const PERM_LABELS: Record<string, string> = {
  CAN_READ: '조회',
  CAN_CREATE: '등록',
  CAN_UPDATE: '수정',
  CAN_DELETE: '삭제',
  CAN_PRINT: '인쇄',
  CAN_EXPORT: '다운로드',
};

export default function PermissionsPage() {
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedType, setSelectedType] = useState('');
  const [permRows, setPermRows] = useState<PermRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/user-types').then(r => r.json()),
      fetch('/api/admin/menus').then(r => r.json()),
    ]).then(([types, menuData]) => {
      setUserTypes(Array.isArray(types) ? types : []);
      setMenus(Array.isArray(menuData) ? menuData : []);
    }).catch(() => {});
  }, []);

  // 권한 조회
  const loadPermissions = useCallback(async (typeCd: string) => {
    if (!typeCd || menus.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/permissions?userTypeCd=${typeCd}`);
      const data: Permission[] = await res.json();
      const permMap = new Map<string, Permission>();
      if (Array.isArray(data)) {
        data.forEach(p => permMap.set(p.MENU_ID, p));
      }

      // 전체 메뉴에 대해 권한 행 생성
      const rows: PermRow[] = menus.map(m => {
        const existing = permMap.get(m.MENU_ID);
        return {
          MENU_ID: m.MENU_ID,
          MENU_NM: m.MENU_NM,
          MENU_LEVEL: m.MENU_LEVEL,
          PARENT_MENU_ID: m.PARENT_MENU_ID,
          CAN_READ: existing?.CAN_READ || 'N',
          CAN_CREATE: existing?.CAN_CREATE || 'N',
          CAN_UPDATE: existing?.CAN_UPDATE || 'N',
          CAN_DELETE: existing?.CAN_DELETE || 'N',
          CAN_PRINT: existing?.CAN_PRINT || 'N',
          CAN_EXPORT: existing?.CAN_EXPORT || 'N',
        };
      });
      setPermRows(rows);
    } catch {
      setPermRows([]);
    } finally {
      setLoading(false);
    }
  }, [menus]);

  useEffect(() => {
    if (selectedType) loadPermissions(selectedType);
  }, [selectedType, loadPermissions]);

  // 개별 권한 토글
  const togglePerm = (menuId: string, col: string) => {
    setPermRows(prev => prev.map(r =>
      r.MENU_ID === menuId ? { ...r, [col]: r[col as keyof PermRow] === 'Y' ? 'N' : 'Y' } : r
    ));
  };

  // 행 전체 토글
  const toggleRow = (menuId: string) => {
    setPermRows(prev => {
      const row = prev.find(r => r.MENU_ID === menuId);
      if (!row) return prev;
      const allChecked = PERM_COLS.every(c => row[c] === 'Y');
      const val = allChecked ? 'N' : 'Y';
      return prev.map(r =>
        r.MENU_ID === menuId
          ? { ...r, CAN_READ: val, CAN_CREATE: val, CAN_UPDATE: val, CAN_DELETE: val, CAN_PRINT: val, CAN_EXPORT: val }
          : r
      );
    });
  };

  // 열 전체 토글
  const toggleCol = (col: string) => {
    setPermRows(prev => {
      const allChecked = prev.every(r => r[col as keyof PermRow] === 'Y');
      const val = allChecked ? 'N' : 'Y';
      return prev.map(r => ({ ...r, [col]: val }));
    });
  };

  // 전체 선택/해제
  const toggleAll = () => {
    setPermRows(prev => {
      const allChecked = prev.every(r => PERM_COLS.every(c => r[c] === 'Y'));
      const val = allChecked ? 'N' : 'Y';
      return prev.map(r => ({
        ...r, CAN_READ: val, CAN_CREATE: val, CAN_UPDATE: val, CAN_DELETE: val, CAN_PRINT: val, CAN_EXPORT: val,
      }));
    });
  };

  // 저장
  const handleSave = async () => {
    if (!selectedType) { alert('사용자 유형을 선택해주세요.'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userTypeCd: selectedType,
          permissions: permRows.map(r => ({
            MENU_ID: r.MENU_ID,
            CAN_READ: r.CAN_READ,
            CAN_CREATE: r.CAN_CREATE,
            CAN_UPDATE: r.CAN_UPDATE,
            CAN_DELETE: r.CAN_DELETE,
            CAN_PRINT: r.CAN_PRINT,
            CAN_EXPORT: r.CAN_EXPORT,
          })),
        }),
      });
      if (res.ok) {
        alert('권한이 저장되었습니다.');
      } else {
        alert('저장에 실패했습니다.');
      }
    } catch {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageLayout title="권한 관리" subtitle="Permission Management">
      <main className="p-6 space-y-4">
        {/* 유형 선택 */}
        <div className="bg-[var(--surface-card)] rounded-xl border border-[var(--border)] p-4">
          <div className="flex items-end gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[var(--text-secondary)]">사용자 유형 선택</label>
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#6e5fc9]/30 min-w-[200px]"
              >
                <option value="">-- 유형 선택 --</option>
                {userTypes.map(t => (
                  <option key={t.USER_TYPE_CD} value={t.USER_TYPE_CD}>{t.USER_TYPE_NM} ({t.USER_TYPE_CD})</option>
                ))}
              </select>
            </div>
            {selectedType && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="h-9 px-4 rounded-lg bg-[#6e5fc9] text-white text-sm font-medium hover:bg-[#5d4fb8] transition-colors disabled:opacity-50"
              >
                {saving ? '저장 중...' : '권한 저장'}
              </button>
            )}
          </div>
        </div>

        {/* 권한 매트릭스 */}
        {selectedType && (
          <div className="bg-[var(--surface-card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#6e5fc9] text-white">
                    <th className="text-left px-4 py-2.5 font-medium min-w-[250px]">메뉴</th>
                    <th className="px-2 py-2.5 font-medium text-center w-12">
                      <button onClick={toggleAll} className="hover:text-yellow-300 transition-colors" title="전체 선택/해제">
                        전체
                      </button>
                    </th>
                    {PERM_COLS.map(col => (
                      <th key={col} className="px-2 py-2.5 font-medium text-center w-16">
                        <button onClick={() => toggleCol(col)} className="hover:text-yellow-300 transition-colors" title={`${PERM_LABELS[col]} 전체 토글`}>
                          {PERM_LABELS[col]}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} className="text-center py-12 text-[var(--text-muted)]">로딩 중...</td></tr>
                  ) : permRows.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-12 text-[var(--text-muted)]">메뉴 데이터가 없습니다.</td></tr>
                  ) : (
                    permRows.map((row, i) => {
                      const allChecked = PERM_COLS.every(c => row[c] === 'Y');
                      const indent = (row.MENU_LEVEL - 1) * 20;
                      const isCategory = row.MENU_LEVEL <= 2;

                      return (
                        <tr
                          key={row.MENU_ID}
                          className={`border-b border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors ${i % 2 === 1 ? 'bg-[var(--surface-base)]/30' : ''} ${isCategory ? 'font-medium' : ''}`}
                        >
                          <td className="px-4 py-2" style={{ paddingLeft: `${16 + indent}px` }}>
                            <span className={isCategory ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}>
                              {row.MENU_LEVEL > 1 && <span className="text-[var(--text-muted)] mr-1">{'└'}</span>}
                              {row.MENU_NM}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={allChecked}
                              onChange={() => toggleRow(row.MENU_ID)}
                              className="rounded accent-[#6e5fc9]"
                            />
                          </td>
                          {PERM_COLS.map(col => (
                            <td key={col} className="px-2 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={row[col] === 'Y'}
                                onChange={() => togglePerm(row.MENU_ID, col)}
                                className="rounded accent-[#6e5fc9]"
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!selectedType && (
          <div className="bg-[var(--surface-card)] rounded-xl border border-[var(--border)] p-12 text-center">
            <span className="material-icons-round text-4xl text-[var(--text-muted)] mb-2">security</span>
            <p className="text-[var(--text-secondary)]">사용자 유형을 선택하면 메뉴별 권한을 설정할 수 있습니다.</p>
          </div>
        )}
      </main>
    </PageLayout>
  );
}
