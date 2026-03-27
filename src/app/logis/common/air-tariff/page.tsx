'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import CodeSearchModal, { type CodeType, type CodeItem } from '@/components/popup/CodeSearchModal';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import SearchIconButton from '@/components/SearchIconButton';
import * as XLSX from 'xlsx';

interface AirTariff {
  ID: number;
  TARIFF_DATE: string;
  AIRLINE: string;
  ORIGIN: string;
  DESTINATION: string;
  CHARGE_CODE: string;
  CARGO_TYPE: string;
  CURRENCY: string;
  WEIGHT_UNIT: string;
  RATE_MIN: number;
  RATE_UNDER45: number;
  RATE_45: number;
  RATE_100: number;
  RATE_300: number;
  RATE_500: number;
  RATE_1000: number;
  RATE_PER_KG: number;
  RATE_PER_BL: number;
  USE_YN: string;
}

type SortKey = keyof AirTariff;

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

export default function AirTariffPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showCloseModal, setShowCloseModal] = useState(false);
  const handleConfirmClose = () => { setShowCloseModal(false); router.back(); };
  useCloseConfirm({ showModal: showCloseModal, setShowModal: setShowCloseModal, onConfirmClose: handleConfirmClose });

  // 검색 조건
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [airline, setAirline] = useState('');
  const [cargoType, setCargoType] = useState('');
  const [keyword, setKeyword] = useState('');

  // 데이터
  const [tariffs, setTariffs] = useState<AirTariff[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'ORIGIN', direction: 'asc' });

  // 모달
  const [showModal, setShowModal] = useState(false);
  const [editingTariff, setEditingTariff] = useState<Partial<AirTariff> | null>(null);
  const [isNew, setIsNew] = useState(false);

  // 코드검색 모달
  const [codeSearchOpen, setCodeSearchOpen] = useState(false);
  const [codeSearchType, setCodeSearchType] = useState<CodeType>('airport');
  const [codeSearchCallback, setCodeSearchCallback] = useState<((item: CodeItem) => void) | null>(null);

  const openCodeSearch = (type: CodeType, callback: (item: CodeItem) => void) => {
    setCodeSearchType(type);
    setCodeSearchCallback(() => callback);
    setCodeSearchOpen(true);
  };

  // 조회
  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (origin) params.set('origin', origin);
      if (destination) params.set('destination', destination);
      if (airline) params.set('airline', airline);
      if (cargoType) params.set('cargoType', cargoType);
      if (keyword) params.set('keyword', keyword);

      const res = await fetch(`/api/air-tariff?${params.toString()}`);
      const data = await res.json();
      setTariffs(Array.isArray(data) ? data : []);
      setSelectedIds(new Set());
    } catch {
      setTariffs([]);
    } finally {
      setLoading(false);
    }
  }, [origin, destination, airline, cargoType, keyword]);

  // 정렬
  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const sortedTariffs = useMemo(() => {
    if (!sortConfig.key) return tariffs;
    return [...tariffs].sort((a, b) => {
      const aVal = a[sortConfig.key!] ?? '';
      const bVal = b[sortConfig.key!] ?? '';
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal), 'ko');
      return sortConfig.direction === 'asc' ? cmp : -cmp;
    });
  }, [tariffs, sortConfig]);

  // 행 선택
  const handleSelectAll = () => {
    if (selectedIds.size === sortedTariffs.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(sortedTariffs.map(t => t.ID)));
  };
  const handleRowSelect = (id: number) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  // 신규
  const handleNew = () => {
    setEditingTariff({ ORIGIN: '', DESTINATION: '', AIRLINE: '', CHARGE_CODE: 'AFC', CARGO_TYPE: 'NORMAL', CURRENCY: 'KRW', WEIGHT_UNIT: 'KG', RATE_MIN: 0, RATE_UNDER45: 0, RATE_45: 0, RATE_100: 0, RATE_300: 0, RATE_500: 0, RATE_1000: 0, RATE_PER_KG: 0, RATE_PER_BL: 0, USE_YN: 'Y' });
    setIsNew(true);
    setShowModal(true);
  };

  // 수정
  const handleEdit = (tariff: AirTariff) => {
    setEditingTariff({ ...tariff });
    setIsNew(false);
    setShowModal(true);
  };

  // 저장
  const handleSave = async () => {
    if (!editingTariff?.ORIGIN || !editingTariff?.DESTINATION) {
      alert('출발공항과 도착공항은 필수입니다.');
      return;
    }
    try {
      const res = await fetch('/api/air-tariff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTariff),
      });
      if (res.ok) {
        alert('저장되었습니다.');
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
    try {
      const res = await fetch('/api/air-tariff', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (res.ok) handleSearch();
    } catch {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 초기화
  const handleReset = () => {
    setOrigin(''); setDestination(''); setAirline(''); setCargoType(''); setKeyword('');
    setTariffs([]); setSelectedIds(new Set());
  };

  // Excel 다운로드
  const handleExcelDownload = () => {
    if (sortedTariffs.length === 0) { alert('다운로드할 데이터가 없습니다.'); return; }
    const wsData = sortedTariffs.map(t => ({
      'Origin': t.ORIGIN, 'Destn': t.DESTINATION, 'Airline': t.AIRLINE,
      'Charge Code': t.CHARGE_CODE, 'Cargo Type': t.CARGO_TYPE,
      'Cur': t.CURRENCY, 'Kg/Lb': t.WEIGHT_UNIT,
      'Min': t.RATE_MIN, '-45': t.RATE_UNDER45, '+45': t.RATE_45,
      '100': t.RATE_100, '300': t.RATE_300, '500': t.RATE_500, '1000': t.RATE_1000,
      'Rate/Kg.Lb': t.RATE_PER_KG, 'Rate_PerBL': t.RATE_PER_BL,
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Air Tariff');
    XLSX.writeFile(wb, `항공운임_Tariff_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Excel 업로드
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/air-tariff/upload', { method: 'POST', body: formData });
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

  // 정렬 가능 헤더
  const SortableHeader = ({ columnKey, label, className = '' }: { columnKey: SortKey; label: string; className?: string }) => (
    <th className={`p-3 text-center text-sm font-semibold cursor-pointer select-none ${className}`} onClick={() => handleSort(columnKey)}>
      <span className="inline-flex items-center">
        {label}
        <SortIcon columnKey={columnKey} sortConfig={sortConfig} />
      </span>
    </th>
  );

  const formatNumber = (n: number) => n ? n.toLocaleString() : '-';

  return (
    <PageLayout title="항공운임 Tariff 관리" subtitle="HOME > Logis > 공통 > 항공운임 Tariff" onClose={() => setShowCloseModal(true)}>
      <main className="p-6">
        {/* 상단 버튼 */}
        <div className="flex justify-end items-center mb-4">
          <div className="flex gap-2">
            <button onClick={handleNew} className="px-4 py-2 bg-[#E8A838] text-[#0C1222] rounded-lg hover:bg-[#d4962f] font-medium">신규</button>
            <button onClick={handleDelete} className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] text-red-400">삭제</button>
            <button onClick={handleExcelDownload} className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">Excel 다운로드</button>
            <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">Excel 업로드</button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} className="hidden" />
          </div>
        </div>

        {/* 검색조건 */}
        <div className="card mb-6">
          <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="font-bold">검색조건</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">출발공항</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input type="text" value={origin} onChange={e => setOrigin(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="ICN" style={{ flex: 1, minWidth: 0 }} className="h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm font-mono" />
                  <SearchIconButton onClick={() => openCodeSearch('airport', item => setOrigin(item.code))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">도착공항</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input type="text" value={destination} onChange={e => setDestination(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="LAX" style={{ flex: 1, minWidth: 0 }} className="h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm font-mono" />
                  <SearchIconButton onClick={() => openCodeSearch('airport', item => setDestination(item.code))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">항공사</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input type="text" value={airline} onChange={e => setAirline(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="항공사코드" style={{ flex: 1, minWidth: 0 }} className="h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
                  <SearchIconButton onClick={() => openCodeSearch('airline', item => setAirline(item.code))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">화물유형</label>
                <select value={cargoType} onChange={e => setCargoType(e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm">
                  <option value="">전체</option>
                  <option value="NORMAL">NORMAL</option>
                  <option value="SPECIAL">SPECIAL</option>
                  <option value="DGR">DGR</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">검색어</label>
                <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="출발공항, 도착공항, 항공사" className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" />
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-[var(--border)] flex justify-center gap-2">
            <button onClick={handleSearch} className="px-6 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] font-medium">조회</button>
            <button onClick={handleReset} className="px-6 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">초기화</button>
          </div>
        </div>

        {/* Tariff 목록 */}
        <div className="card mb-6">
          <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h3 className="font-bold">항공운임 Tariff 목록</h3>
              <span className="px-2 py-1 bg-[#E8A838]/20 text-[#E8A838] rounded text-sm font-medium">{sortedTariffs.length}건</span>
            </div>
            {selectedIds.size > 0 && (
              <button onClick={() => setSelectedIds(new Set())} className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
                선택 해제 ({selectedIds.size}건)
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-12 text-center">
                    <input type="checkbox" checked={sortedTariffs.length > 0 && selectedIds.size === sortedTariffs.length} onChange={handleSelectAll} className="rounded" />
                  </th>
                  <th className="p-3 text-center text-sm font-semibold">No</th>
                  <SortableHeader columnKey="ORIGIN" label="Origin" />
                  <SortableHeader columnKey="DESTINATION" label="Destn" />
                  <SortableHeader columnKey="AIRLINE" label="Airline" />
                  <SortableHeader columnKey="CHARGE_CODE" label="Code" />
                  <SortableHeader columnKey="CARGO_TYPE" label="Type" />
                  <SortableHeader columnKey="CURRENCY" label="Cur" />
                  <SortableHeader columnKey="RATE_MIN" label="Min" />
                  <SortableHeader columnKey="RATE_UNDER45" label="-45" />
                  <SortableHeader columnKey="RATE_45" label="+45" />
                  <SortableHeader columnKey="RATE_100" label="100" />
                  <SortableHeader columnKey="RATE_300" label="300" />
                  <SortableHeader columnKey="RATE_500" label="500" />
                  <SortableHeader columnKey="RATE_1000" label="1000" />
                  <SortableHeader columnKey="USE_YN" label="사용" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={16} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <svg className="w-8 h-8 text-[var(--muted)] animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <p className="text-[var(--muted)]">데이터를 조회하고 있습니다...</p>
                      </div>
                    </td>
                  </tr>
                ) : sortedTariffs.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="p-12 text-center">
                      <p className="text-[var(--muted)]">조회된 데이터가 없습니다. 검색 조건을 입력하고 조회 버튼을 클릭하세요.</p>
                    </td>
                  </tr>
                ) : sortedTariffs.map((t, index) => (
                  <tr key={t.ID} className={`border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer transition-colors ${selectedIds.has(t.ID) ? 'bg-blue-500/10' : ''}`} onClick={() => handleEdit(t)}>
                    <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.has(t.ID)} onChange={() => handleRowSelect(t.ID)} className="rounded" />
                    </td>
                    <td className="p-3 text-center text-sm">{index + 1}</td>
                    <td className="p-3 text-center text-sm font-mono font-medium">{t.ORIGIN}</td>
                    <td className="p-3 text-center text-sm font-mono font-medium">{t.DESTINATION}</td>
                    <td className="p-3 text-center text-sm">{t.AIRLINE || '-'}</td>
                    <td className="p-3 text-center text-sm">{t.CHARGE_CODE}</td>
                    <td className="p-3 text-center text-sm">{t.CARGO_TYPE}</td>
                    <td className="p-3 text-center text-sm">{t.CURRENCY}</td>
                    <td className="p-3 text-right text-sm">{formatNumber(t.RATE_MIN)}</td>
                    <td className="p-3 text-right text-sm">{formatNumber(t.RATE_UNDER45)}</td>
                    <td className="p-3 text-right text-sm">{formatNumber(t.RATE_45)}</td>
                    <td className="p-3 text-right text-sm">{formatNumber(t.RATE_100)}</td>
                    <td className="p-3 text-right text-sm">{formatNumber(t.RATE_300)}</td>
                    <td className="p-3 text-right text-sm">{formatNumber(t.RATE_500)}</td>
                    <td className="p-3 text-right text-sm">{formatNumber(t.RATE_1000)}</td>
                    <td className="p-3 text-center">
                      <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ color: t.USE_YN === 'Y' ? '#059669' : '#6B7280', backgroundColor: t.USE_YN === 'Y' ? '#D1FAE5' : '#F3F4F6' }}>
                        {t.USE_YN === 'Y' ? '사용' : '미사용'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <CloseConfirmModal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} onConfirm={handleConfirmClose} />

      {/* 등록/수정 모달 */}
      {showModal && editingTariff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-[850px] max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <h3 className="font-bold flex-1">{isNew ? '항공운임 Tariff 등록' : '항공운임 Tariff 수정'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-[var(--surface-100)] rounded-lg" title="닫기">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">출발공항 <span className="text-red-500">*</span></label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input type="text" value={editingTariff.ORIGIN || ''} onChange={e => setEditingTariff(prev => ({ ...prev, ORIGIN: e.target.value.toUpperCase() }))} style={{ flex: 1, minWidth: 0 }} className="h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm font-mono" placeholder="ICN" maxLength={5} />
                    <SearchIconButton onClick={() => openCodeSearch('airport', item => setEditingTariff(prev => ({ ...prev, ORIGIN: item.code })))} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">도착공항 <span className="text-red-500">*</span></label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input type="text" value={editingTariff.DESTINATION || ''} onChange={e => setEditingTariff(prev => ({ ...prev, DESTINATION: e.target.value.toUpperCase() }))} style={{ flex: 1, minWidth: 0 }} className="h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm font-mono" placeholder="LAX" maxLength={5} />
                    <SearchIconButton onClick={() => openCodeSearch('airport', item => setEditingTariff(prev => ({ ...prev, DESTINATION: item.code })))} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">항공사</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input type="text" value={editingTariff.AIRLINE || ''} onChange={e => setEditingTariff(prev => ({ ...prev, AIRLINE: e.target.value }))} style={{ flex: 1, minWidth: 0 }} className="h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" />
                    <SearchIconButton onClick={() => openCodeSearch('airline', item => setEditingTariff(prev => ({ ...prev, AIRLINE: item.code })))} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">요금코드</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input type="text" value={editingTariff.CHARGE_CODE || 'AFC'} onChange={e => setEditingTariff(prev => ({ ...prev, CHARGE_CODE: e.target.value }))} style={{ flex: 1, minWidth: 0 }} className="h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" />
                    <SearchIconButton onClick={() => openCodeSearch('freightBase', item => setEditingTariff(prev => ({ ...prev, CHARGE_CODE: item.code })))} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">화물유형</label>
                  <select value={editingTariff.CARGO_TYPE || 'NORMAL'} onChange={e => setEditingTariff(prev => ({ ...prev, CARGO_TYPE: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm">
                    <option value="NORMAL">NORMAL</option>
                    <option value="SPECIAL">SPECIAL</option>
                    <option value="DGR">DGR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">통화</label>
                  <select value={editingTariff.CURRENCY || 'KRW'} onChange={e => setEditingTariff(prev => ({ ...prev, CURRENCY: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm">
                    <option value="KRW">KRW</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="JPY">JPY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">중량단위</label>
                  <select value={editingTariff.WEIGHT_UNIT || 'KG'} onChange={e => setEditingTariff(prev => ({ ...prev, WEIGHT_UNIT: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm">
                    <option value="KG">KG</option>
                    <option value="LB">LB</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">사용여부</label>
                  <select value={editingTariff.USE_YN || 'Y'} onChange={e => setEditingTariff(prev => ({ ...prev, USE_YN: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm">
                    <option value="Y">사용</option>
                    <option value="N">미사용</option>
                  </select>
                </div>
              </div>
              <div className="border-t border-[var(--border)] pt-4">
                <h4 className="text-sm font-bold mb-3 text-[var(--foreground)]">중량 구간별 단가</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-[var(--muted)]">Min (최소운임)</label>
                    <input type="number" value={editingTariff.RATE_MIN || 0} onChange={e => setEditingTariff(prev => ({ ...prev, RATE_MIN: Number(e.target.value) }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm text-right" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-[var(--muted)]">-45kg</label>
                    <input type="number" value={editingTariff.RATE_UNDER45 || 0} onChange={e => setEditingTariff(prev => ({ ...prev, RATE_UNDER45: Number(e.target.value) }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm text-right" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-[var(--muted)]">+45kg</label>
                    <input type="number" value={editingTariff.RATE_45 || 0} onChange={e => setEditingTariff(prev => ({ ...prev, RATE_45: Number(e.target.value) }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm text-right" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-[var(--muted)]">100kg</label>
                    <input type="number" value={editingTariff.RATE_100 || 0} onChange={e => setEditingTariff(prev => ({ ...prev, RATE_100: Number(e.target.value) }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm text-right" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-[var(--muted)]">300kg</label>
                    <input type="number" value={editingTariff.RATE_300 || 0} onChange={e => setEditingTariff(prev => ({ ...prev, RATE_300: Number(e.target.value) }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm text-right" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-[var(--muted)]">500kg</label>
                    <input type="number" value={editingTariff.RATE_500 || 0} onChange={e => setEditingTariff(prev => ({ ...prev, RATE_500: Number(e.target.value) }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm text-right" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-[var(--muted)]">1000kg</label>
                    <input type="number" value={editingTariff.RATE_1000 || 0} onChange={e => setEditingTariff(prev => ({ ...prev, RATE_1000: Number(e.target.value) }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm text-right" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-[var(--muted)]">Rate/Kg</label>
                    <input type="number" value={editingTariff.RATE_PER_KG || 0} onChange={e => setEditingTariff(prev => ({ ...prev, RATE_PER_KG: Number(e.target.value) }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm text-right" />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-[var(--border)] flex justify-center gap-2">
              <button onClick={handleSave} className="px-6 py-2 bg-[#E8A838] text-[#0C1222] rounded-lg hover:bg-[#d4962f] font-medium">저장</button>
              <button onClick={() => setShowModal(false)} className="px-6 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">취소</button>
            </div>
          </div>
        </div>
      )}
      <CodeSearchModal
        isOpen={codeSearchOpen}
        onClose={() => setCodeSearchOpen(false)}
        onSelect={(item) => { if (codeSearchCallback) codeSearchCallback(item); }}
        codeType={codeSearchType}
      />
    </PageLayout>
  );
}
