'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PageLayout from '@/components/PageLayout';
import Modal from '@/components/Modal';

interface UserType {
  USER_TYPE_CD: string;
  USER_TYPE_NM: string;
}

interface User {
  USER_ID: string;
  USER_NM: string;
  EMAIL: string;
  PHONE: string;
  USER_TYPE_CD: string;
  USER_TYPE_NM: string;
  COMPANY_CD: string;
  COMPANY_NM: string;
  DEPARTMENT: string;
  POSITION_NM: string;
  STATUS_CD: string;
  LAST_LOGIN_DTM: string;
  USE_YN: string;
  CREATED_DTM: string;
  UPDATED_DTM: string;
}

type SortKey = keyof User;

interface SortConfig {
  key: SortKey | null;
  direction: 'asc' | 'desc';
}

const SortIcon = ({ columnKey, sortConfig }: { columnKey: SortKey; sortConfig: SortConfig }) => {
  const isActive = sortConfig.key === columnKey;
  return (
    <span className="inline-flex flex-col ml-1.5 gap-px">
      <span style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: `5px solid ${isActive && sortConfig.direction === 'asc' ? '#ffffff' : 'rgba(255,255,255,0.35)'}` }} />
      <span style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: `5px solid ${isActive && sortConfig.direction === 'desc' ? '#ffffff' : 'rgba(255,255,255,0.35)'}` }} />
    </span>
  );
};

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: '활성', color: '#10b981' },
  { value: 'INACTIVE', label: '비활성', color: '#ef4444' },
  { value: 'LOCKED', label: '잠김', color: '#f59e0b' },
];

export default function UsersPage() {
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // 검색 조건
  const [keyword, setKeyword] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // 선택
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 정렬
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'CREATED_DTM', direction: 'desc' });

  // 모달
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<Partial<User & { PASSWORD: string }> | null>(null);
  const [isEdit, setIsEdit] = useState(false);

  // 사용자 유형 로드
  useEffect(() => {
    fetch('/api/admin/user-types')
      .then(r => r.json())
      .then(d => setUserTypes(Array.isArray(d) ? d : []))
      .catch(() => setUserTypes([]));
  }, []);

  // 조회
  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.set('keyword', keyword);
      if (filterType) params.set('userTypeCd', filterType);
      if (filterStatus) params.set('statusCd', filterStatus);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
      setSelectedIds(new Set());
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [keyword, filterType, filterStatus]);

  useEffect(() => { handleSearch(); }, []);

  // 정렬
  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedUsers = useMemo(() => {
    if (!sortConfig.key) return users;
    return [...users].sort((a, b) => {
      const aVal = a[sortConfig.key!] ?? '';
      const bVal = b[sortConfig.key!] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal), 'ko');
      return sortConfig.direction === 'asc' ? cmp : -cmp;
    });
  }, [users, sortConfig]);

  // 선택
  const handleSelectAll = () => {
    if (selectedIds.size === sortedUsers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedUsers.map(u => u.USER_ID)));
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // 신규 등록
  const handleNew = () => {
    setEditUser({ STATUS_CD: 'ACTIVE', USE_YN: 'Y', PASSWORD: '' });
    setIsEdit(false);
    setShowModal(true);
  };

  // 수정
  const handleEdit = (user: User) => {
    setEditUser({ ...user, PASSWORD: '' });
    setIsEdit(true);
    setShowModal(true);
  };

  // 저장
  const handleSave = async () => {
    if (!editUser) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editUser, isEdit }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || '저장 실패');
        return;
      }
      alert('저장되었습니다.');
      setShowModal(false);
      handleSearch();
    } catch {
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 삭제
  const handleDelete = async () => {
    if (selectedIds.size === 0) { alert('삭제할 사용자를 선택해주세요.'); return; }
    if (!confirm(`${selectedIds.size}건을 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: Array.from(selectedIds) }),
      });
      if (res.ok) {
        alert('삭제되었습니다.');
        handleSearch();
      }
    } catch {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('ko-KR') : '-';

  return (
    <PageLayout title="사용자 관리" subtitle="User Management">
      <main className="p-6 space-y-4">
        {/* 검색 영역 */}
        <div className="bg-[var(--surface-card)] rounded-xl border border-[var(--border)] p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[var(--text-secondary)]">검색어</label>
              <input
                type="text"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="ID, 이름, 이메일, 회사명"
                className="h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#6e5fc9]/30 w-56"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[var(--text-secondary)]">사용자 유형</label>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#6e5fc9]/30"
              >
                <option value="">전체</option>
                {userTypes.map(t => (
                  <option key={t.USER_TYPE_CD} value={t.USER_TYPE_CD}>{t.USER_TYPE_NM}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[var(--text-secondary)]">상태</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#6e5fc9]/30"
              >
                <option value="">전체</option>
                {STATUS_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleSearch}
              className="h-9 px-4 rounded-lg bg-[#6e5fc9] text-white text-sm font-medium hover:bg-[#5d4fb8] transition-colors"
            >
              조회
            </button>
          </div>
        </div>

        {/* 도구 영역 */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-[var(--text-secondary)]">
            총 <span className="font-semibold text-[var(--text-primary)]">{users.length}</span>건
            {selectedIds.size > 0 && <span className="ml-2 text-[#6e5fc9]">(선택: {selectedIds.size}건)</span>}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleNew}
              className="h-8 px-3 rounded-lg bg-[#6e5fc9] text-white text-xs font-medium hover:bg-[#5d4fb8] transition-colors flex items-center gap-1"
            >
              <span className="material-icons-round text-sm">add</span> 신규등록
            </button>
            <button
              onClick={handleDelete}
              className="h-8 px-3 rounded-lg border border-red-300 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors flex items-center gap-1"
            >
              <span className="material-icons-round text-sm">delete</span> 삭제
            </button>
          </div>
        </div>

        {/* 테이블 */}
        <div className="bg-[var(--surface-card)] rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#6e5fc9] text-white">
                  <th className="w-10 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={sortedUsers.length > 0 && selectedIds.size === sortedUsers.length}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  {[
                    { key: 'USER_ID' as SortKey, label: '사용자 ID' },
                    { key: 'USER_NM' as SortKey, label: '이름' },
                    { key: 'USER_TYPE_NM' as SortKey, label: '유형' },
                    { key: 'COMPANY_NM' as SortKey, label: '회사명' },
                    { key: 'EMAIL' as SortKey, label: '이메일' },
                    { key: 'PHONE' as SortKey, label: '전화번호' },
                    { key: 'STATUS_CD' as SortKey, label: '상태' },
                    { key: 'CREATED_DTM' as SortKey, label: '등록일' },
                  ].map(col => (
                    <th
                      key={col.key}
                      className="text-left px-3 py-2.5 font-medium cursor-pointer hover:bg-[#5d4fb8] transition-colors select-none whitespace-nowrap"
                      onClick={() => handleSort(col.key)}
                    >
                      <span className="inline-flex items-center">
                        {col.label}
                        <SortIcon columnKey={col.key} sortConfig={sortConfig} />
                      </span>
                    </th>
                  ))}
                  <th className="px-3 py-2.5 font-medium text-center">관리</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} className="text-center py-12 text-[var(--text-muted)]">로딩 중...</td></tr>
                ) : sortedUsers.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-12 text-[var(--text-muted)]">데이터가 없습니다.</td></tr>
                ) : (
                  sortedUsers.map((user, i) => {
                    const status = STATUS_OPTIONS.find(s => s.value === user.STATUS_CD);
                    return (
                      <tr
                        key={user.USER_ID}
                        className={`border-b border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors ${i % 2 === 1 ? 'bg-[var(--surface-base)]/30' : ''}`}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(user.USER_ID)}
                            onChange={() => handleSelect(user.USER_ID)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-3 py-2 font-mono text-xs font-medium text-[#6e5fc9]">{user.USER_ID}</td>
                        <td className="px-3 py-2 font-medium">{user.USER_NM}</td>
                        <td className="px-3 py-2">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-[#6e5fc9]/10 text-[#6e5fc9] font-medium">
                            {user.USER_TYPE_NM || user.USER_TYPE_CD || '-'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[var(--text-secondary)]">{user.COMPANY_NM || '-'}</td>
                        <td className="px-3 py-2 text-[var(--text-secondary)]">{user.EMAIL || '-'}</td>
                        <td className="px-3 py-2 text-[var(--text-secondary)]">{user.PHONE || '-'}</td>
                        <td className="px-3 py-2">
                          <span
                            className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ backgroundColor: `${status?.color || '#9ca3af'}15`, color: status?.color || '#9ca3af' }}
                          >
                            {status?.label || user.STATUS_CD}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[var(--text-secondary)] text-xs">{formatDate(user.CREATED_DTM)}</td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-[#6e5fc9] hover:text-[#5d4fb8] text-xs font-medium"
                          >
                            수정
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 사용자 등록/수정 모달 */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={isEdit ? '사용자 수정' : '사용자 등록'}
          size="lg"
        >
          {editUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">사용자 ID <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={editUser.USER_ID || ''}
                    onChange={e => setEditUser({ ...editUser, USER_ID: e.target.value })}
                    disabled={isEdit}
                    className="h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#6e5fc9]/30 disabled:opacity-50"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">이름 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={editUser.USER_NM || ''}
                    onChange={e => setEditUser({ ...editUser, USER_NM: e.target.value })}
                    className="h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#6e5fc9]/30"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">
                    비밀번호 {!isEdit && <span className="text-red-500">*</span>}
                    {isEdit && <span className="text-[var(--text-muted)]">(변경 시에만 입력)</span>}
                  </label>
                  <input
                    type="password"
                    value={editUser.PASSWORD || ''}
                    onChange={e => setEditUser({ ...editUser, PASSWORD: e.target.value })}
                    placeholder={isEdit ? '변경하지 않으려면 비워두세요' : ''}
                    className="h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#6e5fc9]/30"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">사용자 유형</label>
                  <select
                    value={editUser.USER_TYPE_CD || ''}
                    onChange={e => setEditUser({ ...editUser, USER_TYPE_CD: e.target.value })}
                    className="h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#6e5fc9]/30"
                  >
                    <option value="">선택</option>
                    {userTypes.map(t => (
                      <option key={t.USER_TYPE_CD} value={t.USER_TYPE_CD}>{t.USER_TYPE_NM}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">이메일</label>
                  <input
                    type="email"
                    value={editUser.EMAIL || ''}
                    onChange={e => setEditUser({ ...editUser, EMAIL: e.target.value })}
                    className="h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#6e5fc9]/30"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">전화번호</label>
                  <input
                    type="text"
                    value={editUser.PHONE || ''}
                    onChange={e => setEditUser({ ...editUser, PHONE: e.target.value })}
                    className="h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#6e5fc9]/30"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">회사코드</label>
                  <input
                    type="text"
                    value={editUser.COMPANY_CD || ''}
                    onChange={e => setEditUser({ ...editUser, COMPANY_CD: e.target.value })}
                    className="h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#6e5fc9]/30"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">회사명</label>
                  <input
                    type="text"
                    value={editUser.COMPANY_NM || ''}
                    onChange={e => setEditUser({ ...editUser, COMPANY_NM: e.target.value })}
                    className="h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#6e5fc9]/30"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">부서</label>
                  <input
                    type="text"
                    value={editUser.DEPARTMENT || ''}
                    onChange={e => setEditUser({ ...editUser, DEPARTMENT: e.target.value })}
                    className="h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#6e5fc9]/30"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">직급</label>
                  <input
                    type="text"
                    value={editUser.POSITION_NM || ''}
                    onChange={e => setEditUser({ ...editUser, POSITION_NM: e.target.value })}
                    className="h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#6e5fc9]/30"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">상태</label>
                  <select
                    value={editUser.STATUS_CD || 'ACTIVE'}
                    onChange={e => setEditUser({ ...editUser, STATUS_CD: e.target.value })}
                    className="h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#6e5fc9]/30"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">사용여부</label>
                  <select
                    value={editUser.USE_YN || 'Y'}
                    onChange={e => setEditUser({ ...editUser, USE_YN: e.target.value })}
                    className="h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#6e5fc9]/30"
                  >
                    <option value="Y">사용</option>
                    <option value="N">미사용</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border)]">
                <button
                  onClick={() => setShowModal(false)}
                  className="h-9 px-4 rounded-lg border border-[var(--border)] text-sm text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  className="h-9 px-4 rounded-lg bg-[#6e5fc9] text-white text-sm font-medium hover:bg-[#5d4fb8] transition-colors"
                >
                  저장
                </button>
              </div>
            </div>
          )}
        </Modal>
      </main>
    </PageLayout>
  );
}
