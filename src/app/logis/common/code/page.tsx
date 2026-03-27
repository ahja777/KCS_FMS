'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import * as XLSX from 'xlsx';

interface CodeGroup {
  GROUP_CD: string;
  GROUP_NM: string;
  GROUP_NM_E: string;
  DESCRIPTION: string;
}

interface CommonCode {
  CODE_GROUP_ID: string;
  CODE_CD: string;
  CODE_NM: string;
  CODE_NM_EN: string;
  SORT_ORDER: number;
  ATTR1: string;
  ATTR2: string;
  ATTR3: string;
  DESCRIPTION: string;
  USE_YN: string;
  GROUP_NM: string;
  CREATED_BY: string;
  CREATED_DTM: string;
  UPDATED_DTM: string;
}

type SortKey = keyof CommonCode;

interface SortConfig {
  key: SortKey | null;
  direction: 'asc' | 'desc';
}

// 정렬 아이콘 컴포넌트 (기존 페이지와 동일)
const SortIcon = ({ columnKey, sortConfig }: { columnKey: SortKey; sortConfig: SortConfig }) => {
  const isActive = sortConfig.key === columnKey;
  return (
    <span className="inline-flex flex-col ml-1.5 gap-px">
      <span
        style={{
          width: 0, height: 0,
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderBottom: `5px solid ${isActive && sortConfig.direction === 'asc' ? '#ffffff' : 'rgba(255,255,255,0.35)'}`,
        }}
      />
      <span
        style={{
          width: 0, height: 0,
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderTop: `5px solid ${isActive && sortConfig.direction === 'desc' ? '#ffffff' : 'rgba(255,255,255,0.35)'}`,
        }}
      />
    </span>
  );
};

export default function CommonCodePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 종료 확인
  const [showCloseModal, setShowCloseModal] = useState(false);
  const handleConfirmClose = () => { setShowCloseModal(false); router.back(); };
  useCloseConfirm({ showModal: showCloseModal, setShowModal: setShowCloseModal, onConfirmClose: handleConfirmClose });

  // 검색 조건
  const [groups, setGroups] = useState<CodeGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [keyword, setKeyword] = useState('');
  const [useYnFilter, setUseYnFilter] = useState('');

  // 데이터
  const [codes, setCodes] = useState<CommonCode[]>([]);
  const [loading, setLoading] = useState(false);

  // 선택
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 정렬
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'CODE_GROUP_ID', direction: 'asc' });

  // 모달
  const [showModal, setShowModal] = useState(false);
  const [editingCode, setEditingCode] = useState<Partial<CommonCode> | null>(null);
  const [isNew, setIsNew] = useState(false);

  // 그룹 목록 로드
  useEffect(() => {
    fetch('/api/common-code/groups')
      .then(res => res.json())
      .then(data => setGroups(Array.isArray(data) ? data : []))
      .catch(() => setGroups([]));
  }, []);

  // 조회
  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedGroup) params.set('groupCd', selectedGroup);
      if (keyword) params.set('keyword', keyword);
      if (useYnFilter) params.set('useYn', useYnFilter);

      const res = await fetch(`/api/common-code?${params.toString()}`);
      const data = await res.json();
      setCodes(Array.isArray(data) ? data : []);
      setSelectedIds(new Set());
    } catch {
      setCodes([]);
    } finally {
      setLoading(false);
    }
  }, [selectedGroup, keyword, useYnFilter]);

  // 정렬
  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedCodes = useMemo(() => {
    if (!sortConfig.key) return codes;
    return [...codes].sort((a, b) => {
      const aVal = a[sortConfig.key!] ?? '';
      const bVal = b[sortConfig.key!] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal), 'ko');
      return sortConfig.direction === 'asc' ? cmp : -cmp;
    });
  }, [codes, sortConfig]);

  // 행 선택
  const rowKey = (c: CommonCode) => `${c.CODE_GROUP_ID}::${c.CODE_CD}`;
  const handleSelectAll = () => {
    if (selectedIds.size === sortedCodes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedCodes.map(rowKey)));
    }
  };
  const handleRowSelect = (key: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // 신규
  const handleNew = () => {
    setEditingCode({ CODE_GROUP_ID: selectedGroup, CODE_CD: '', CODE_NM: '', CODE_NM_EN: '', SORT_ORDER: 0, ATTR1: '', ATTR2: '', ATTR3: '', DESCRIPTION: '', USE_YN: 'Y' });
    setIsNew(true);
    setShowModal(true);
  };

  // 수정 (더블클릭)
  const handleEdit = (code: CommonCode) => {
    setEditingCode({ ...code });
    setIsNew(false);
    setShowModal(true);
  };

  // 저장
  const handleSave = async () => {
    if (!editingCode?.CODE_GROUP_ID || !editingCode?.CODE_CD) {
      alert('그룹코드와 코드는 필수입니다.');
      return;
    }
    try {
      const res = await fetch('/api/common-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCode),
      });
      if (res.ok) {
        setShowModal(false);
        handleSearch();
      } else {
        const err = await res.json();
        alert(err.error || '저장 실패');
      }
    } catch {
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 삭제
  const handleDelete = async () => {
    if (selectedIds.size === 0) { alert('삭제할 항목을 선택해주세요.'); return; }
    if (!confirm(`${selectedIds.size}건을 삭제하시겠습니까?`)) return;

    const items = Array.from(selectedIds).map(key => {
      const [CODE_GROUP_ID, CODE_CD] = key.split('::');
      return { CODE_GROUP_ID, CODE_CD };
    });

    try {
      const res = await fetch('/api/common-code', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (res.ok) { handleSearch(); }
    } catch {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 엑셀 다운로드
  const handleExcelDownload = () => {
    if (sortedCodes.length === 0) { alert('다운로드할 데이터가 없습니다.'); return; }
    const wsData = sortedCodes.map(c => ({
      '그룹코드': c.CODE_GROUP_ID, '그룹명': c.GROUP_NM, '코드': c.CODE_CD,
      '코드명': c.CODE_NM, '영문명': c.CODE_NM_EN, '정렬순서': c.SORT_ORDER,
      '속성1': c.ATTR1, '속성2': c.ATTR2, '속성3': c.ATTR3,
      '비고': c.DESCRIPTION, '사용여부': c.USE_YN,
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '공통코드');
    XLSX.writeFile(wb, `공통코드_${selectedGroup || 'ALL'}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // 엑셀 업로드
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!selectedGroup) { alert('업로드할 그룹코드를 먼저 선택해주세요.'); return; }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('groupCd', selectedGroup);

    try {
      const res = await fetch('/api/common-code/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        alert(`${data.count}건이 업로드되었습니다.`);
        handleSearch();
      } else {
        alert(data.error || '업로드 실패');
      }
    } catch {
      alert('업로드 중 오류가 발생했습니다.');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 초기화
  const handleReset = () => {
    setSelectedGroup('');
    setKeyword('');
    setUseYnFilter('');
    setCodes([]);
    setSelectedIds(new Set());
  };

  // 정렬 가능 헤더
  const SortableHeader = ({ columnKey, label }: { columnKey: SortKey; label: string }) => (
    <th
      className="p-3 text-center text-sm font-semibold cursor-pointer select-none"
      onClick={() => handleSort(columnKey)}
    >
      <span className="inline-flex items-center">
        {label}
        <SortIcon columnKey={columnKey} sortConfig={sortConfig} />
      </span>
    </th>
  );

  return (
    <PageLayout
      title="공통코드 관리"
      subtitle="HOME > Logis > 공통 > 코드관리"
      onClose={() => setShowCloseModal(true)}
    >
      <main className="p-6">
        {/* 상단 버튼 영역 */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50" disabled={selectedIds.size === 0}>삭제</button>
          </div>
          <div className="flex gap-2">
            <button onClick={handleNew} className="px-4 py-2 bg-[#E8A838] text-[#0C1222] rounded-lg hover:bg-[#d4962f] font-medium">
              신규
            </button>
            <button onClick={handleExcelDownload} className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
              Excel 다운로드
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
              Excel 업로드
            </button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} className="hidden" />
          </div>
        </div>

        {/* 검색조건 카드 */}
        <div className="card mb-6">
          <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="font-bold">검색조건</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-6 gap-4">
              {/* 코드그룹 */}
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">코드그룹</label>
                <select
                  value={selectedGroup}
                  onChange={e => setSelectedGroup(e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                >
                  <option value="">전체</option>
                  {groups.map(g => (
                    <option key={g.GROUP_CD} value={g.GROUP_CD}>{g.GROUP_NM} ({g.GROUP_CD})</option>
                  ))}
                </select>
              </div>
              {/* 검색어 */}
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">검색어</label>
                <input
                  type="text"
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="코드, 코드명, 영문명"
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                />
              </div>
              {/* 사용여부 */}
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">사용여부</label>
                <select
                  value={useYnFilter}
                  onChange={e => setUseYnFilter(e.target.value)}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                >
                  <option value="">전체</option>
                  <option value="Y">사용</option>
                  <option value="N">미사용</option>
                </select>
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-[var(--border)] flex justify-center gap-2">
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] font-medium"
            >
              조회
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
            >
              초기화
            </button>
          </div>
        </div>

        {/* 코드 목록 카드 */}
        <div className="card mb-6">
          <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h3 className="font-bold">코드목록</h3>
              <span className="px-2 py-1 bg-[#E8A838]/20 text-[#E8A838] rounded text-sm font-medium">
                {sortedCodes.length}건
              </span>
            </div>
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <button onClick={() => setSelectedIds(new Set())} className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
                  선택 해제 ({selectedIds.size}건)
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-12 text-center">
                    <input
                      type="checkbox"
                      checked={sortedCodes.length > 0 && selectedIds.size === sortedCodes.length}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="p-3 text-center text-sm font-semibold">No</th>
                  <SortableHeader columnKey="CODE_GROUP_ID" label="그룹코드" />
                  <SortableHeader columnKey="GROUP_NM" label="그룹명" />
                  <SortableHeader columnKey="CODE_CD" label="코드" />
                  <SortableHeader columnKey="CODE_NM" label="코드명" />
                  <SortableHeader columnKey="CODE_NM_EN" label="영문명" />
                  <SortableHeader columnKey="SORT_ORDER" label="순서" />
                  <SortableHeader columnKey="USE_YN" label="사용" />
                  <SortableHeader columnKey="DESCRIPTION" label="비고" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <svg className="w-8 h-8 text-[var(--muted)] animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <p className="text-[var(--muted)]">데이터를 조회하고 있습니다...</p>
                      </div>
                    </td>
                  </tr>
                ) : sortedCodes.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <svg className="w-12 h-12 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-[var(--muted)]">조회된 데이터가 없습니다.</p>
                      </div>
                    </td>
                  </tr>
                ) : sortedCodes.map((code, index) => {
                  const key = rowKey(code);
                  return (
                    <tr
                      key={key}
                      className={`border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer transition-colors ${selectedIds.has(key) ? 'bg-blue-500/10' : ''}`}
                      onDoubleClick={() => handleEdit(code)}
                    >
                      <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(key)}
                          onChange={() => handleRowSelect(key)}
                          className="rounded"
                        />
                      </td>
                      <td className="p-3 text-center text-sm">{index + 1}</td>
                      <td className="p-3 text-center text-sm font-mono">{code.CODE_GROUP_ID}</td>
                      <td className="p-3 text-center text-sm">{code.GROUP_NM}</td>
                      <td className="p-3 text-center text-sm font-mono font-medium">{code.CODE_CD}</td>
                      <td className="p-3 text-center text-sm">{code.CODE_NM}</td>
                      <td className="p-3 text-center text-sm">{code.CODE_NM_EN}</td>
                      <td className="p-3 text-center text-sm">{code.SORT_ORDER}</td>
                      <td className="p-3 text-center">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{
                            color: code.USE_YN === 'Y' ? '#059669' : '#6B7280',
                            backgroundColor: code.USE_YN === 'Y' ? '#D1FAE5' : '#F3F4F6',
                          }}
                        >
                          {code.USE_YN === 'Y' ? '사용' : '미사용'}
                        </span>
                      </td>
                      <td className="p-3 text-center text-sm text-[var(--muted)] truncate max-w-[200px]">{code.DESCRIPTION}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* 종료 확인 모달 */}
      <CloseConfirmModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onConfirm={handleConfirmClose}
      />

      {/* 등록/수정 모달 */}
      {showModal && editingCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-[640px] max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <h3 className="font-bold">{isNew ? '공통코드 등록' : '공통코드 수정'}</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">
                    그룹코드 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editingCode.CODE_GROUP_ID || ''}
                    disabled={!isNew}
                    onChange={e => setEditingCode(prev => ({ ...prev, CODE_GROUP_ID: e.target.value }))}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm disabled:opacity-60"
                  >
                    <option value="">선택</option>
                    {groups.map(g => <option key={g.GROUP_CD} value={g.GROUP_CD}>{g.GROUP_NM} ({g.GROUP_CD})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">
                    코드 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingCode.CODE_CD || ''}
                    disabled={!isNew}
                    onChange={e => setEditingCode(prev => ({ ...prev, CODE_CD: e.target.value }))}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm disabled:opacity-60"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">코드명</label>
                  <input
                    type="text"
                    value={editingCode.CODE_NM || ''}
                    onChange={e => setEditingCode(prev => ({ ...prev, CODE_NM: e.target.value }))}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">영문명</label>
                  <input
                    type="text"
                    value={editingCode.CODE_NM_EN || ''}
                    onChange={e => setEditingCode(prev => ({ ...prev, CODE_NM_EN: e.target.value }))}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">정렬순서</label>
                  <input
                    type="number"
                    value={editingCode.SORT_ORDER || 0}
                    onChange={e => setEditingCode(prev => ({ ...prev, SORT_ORDER: Number(e.target.value) }))}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">사용여부</label>
                  <select
                    value={editingCode.USE_YN || 'Y'}
                    onChange={e => setEditingCode(prev => ({ ...prev, USE_YN: e.target.value }))}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                  >
                    <option value="Y">사용</option>
                    <option value="N">미사용</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">속성1</label>
                  <input
                    type="text"
                    value={editingCode.ATTR1 || ''}
                    onChange={e => setEditingCode(prev => ({ ...prev, ATTR1: e.target.value }))}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">속성2</label>
                  <input
                    type="text"
                    value={editingCode.ATTR2 || ''}
                    onChange={e => setEditingCode(prev => ({ ...prev, ATTR2: e.target.value }))}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">속성3</label>
                  <input
                    type="text"
                    value={editingCode.ATTR3 || ''}
                    onChange={e => setEditingCode(prev => ({ ...prev, ATTR3: e.target.value }))}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">비고</label>
                <textarea
                  value={editingCode.DESCRIPTION || ''}
                  rows={2}
                  onChange={e => setEditingCode(prev => ({ ...prev, DESCRIPTION: e.target.value }))}
                  className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="p-4 border-t border-[var(--border)] flex justify-center gap-2">
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-[#E8A838] text-[#0C1222] rounded-lg hover:bg-[#d4962f] font-medium"
              >
                저장
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
