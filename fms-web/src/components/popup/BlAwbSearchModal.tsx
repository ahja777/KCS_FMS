'use client';

import { useState, useEffect, useCallback } from 'react';

export interface BlAwbItem {
  docType: 'SEA' | 'AIR';
  id: number;
  jobNo: string;
  mblNo: string;
  hblNo: string;
  ioType: string;
  shipperName: string;
  consigneeName: string;
  vesselName: string;
  voyageNo: string;
  flightNo: string;
  pol: string;
  pod: string;
  packages: number;
  packageUnit: string;
  weight: number;
  cbm: number;
  containerType: string;
  lcNo: string;
  poNo: string;
  etd: string;
  eta: string;
  status: string;
}

interface BlAwbSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: BlAwbItem) => void;
  defaultType?: 'all' | 'sea' | 'air';
}

interface SearchFilters {
  type: 'all' | 'sea' | 'air';
  ioType: string;
  keyword: string;
  shipperName: string;
  consigneeName: string;
  vesselName: string;
  flightNo: string;
  pol: string;
  pod: string;
  obDateFrom: string;
  obDateTo: string;
  arDateFrom: string;
  arDateTo: string;
}

const initialFilters: SearchFilters = {
  type: 'all',
  ioType: '',
  keyword: '',
  shipperName: '',
  consigneeName: '',
  vesselName: '',
  flightNo: '',
  pol: '',
  pod: '',
  obDateFrom: '',
  obDateTo: '',
  arDateFrom: '',
  arDateTo: '',
};

const inputCls = "h-[32px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded text-xs w-full";
const labelCls = "text-[10px] font-medium text-[var(--muted)] mb-0.5 block";
const selectCls = "h-[32px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded text-xs w-full";

export default function BlAwbSearchModal({ isOpen, onClose, onSelect, defaultType = 'all' }: BlAwbSearchModalProps) {
  const [filters, setFilters] = useState<SearchFilters>({ ...initialFilters, type: defaultType });
  const [results, setResults] = useState<BlAwbItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = useCallback(async (searchFilters?: SearchFilters) => {
    setLoading(true);
    setSelectedId(null);
    try {
      const f = searchFilters || filters;
      const params = new URLSearchParams();
      params.set('type', f.type);
      if (f.keyword) params.set('keyword', f.keyword);
      if (f.ioType) params.set('ioType', f.ioType);
      if (f.shipperName) params.set('shipperName', f.shipperName);
      if (f.consigneeName) params.set('consigneeName', f.consigneeName);
      if (f.vesselName) params.set('vesselName', f.vesselName);
      if (f.flightNo) params.set('flightNo', f.flightNo);
      if (f.pol) params.set('pol', f.pol);
      if (f.pod) params.set('pod', f.pod);
      if (f.obDateFrom) params.set('obDateFrom', f.obDateFrom);
      if (f.obDateTo) params.set('obDateTo', f.obDateTo);
      if (f.arDateFrom) params.set('arDateFrom', f.arDateFrom);
      if (f.arDateTo) params.set('arDateTo', f.arDateTo);

      const res = await fetch(`/api/bl/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleReset = () => {
    const reset = { ...initialFilters, type: filters.type };
    setFilters(reset);
    setSelectedId(null);
    setResults([]);
  };

  const handleApply = () => {
    if (!selectedId) {
      alert('적용할 항목을 선택해주세요.');
      return;
    }
    const item = results.find(r => `${r.docType}-${r.id}` === selectedId);
    if (item) {
      onSelect(item);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  useEffect(() => {
    if (isOpen) {
      const reset = { ...initialFilters, type: defaultType };
      setFilters(reset);
      setResults([]);
      setSelectedId(null);
      // 팝업 열릴 때 전체 목록 로드
      setTimeout(() => {
        const params = new URLSearchParams();
        params.set('type', defaultType);
        fetch(`/api/bl/search?${params.toString()}`)
          .then(r => r.json())
          .then(d => { if (Array.isArray(d)) setResults(d); })
          .catch(() => {});
      }, 100);
    }
  }, [isOpen, defaultType]);

  if (!isOpen) return null;

  const isSea = filters.type === 'sea' || filters.type === 'all';
  const isAir = filters.type === 'air' || filters.type === 'all';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-[var(--background)] rounded-xl shadow-2xl w-[1100px] max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between bg-[#1A2744]  rounded-t-xl">
          <h3 className="text-base font-bold text-white">
            {filters.type === 'sea' ? 'B/L 검색팝업(해상)' : filters.type === 'air' ? 'B/L 검색팝업(항공)' : 'B/L(AWB) 검색'}
          </h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/20 text-white/70 hover:text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* B/L 조회 - 검색 조건 영역 */}
        <div className="border-b border-[var(--border)]" onKeyDown={handleKeyDown}>
          <div className="px-5 py-2 flex items-center justify-between bg-[var(--surface-50)]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[var(--foreground)]">B/L 조회</span>
              <span className="text-[10px] text-[var(--muted)]">검색조건</span>
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className="text-[var(--muted)] hover:text-[var(--foreground)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d={showFilters ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
              </svg>
            </button>
          </div>

          {showFilters && (
            <div className="px-5 py-3">
              {/* Row 1: 구분/수출입/키워드 */}
              <div className="grid grid-cols-8 gap-2 mb-2">
                <div>
                  <label className={labelCls}>구분</label>
                  <select value={filters.type} onChange={e => handleFilterChange('type', e.target.value)} className={selectCls}>
                    <option value="all">전체</option>
                    <option value="sea">해상</option>
                    <option value="air">항공</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>수출입구분</label>
                  <select value={filters.ioType} onChange={e => handleFilterChange('ioType', e.target.value)} className={selectCls}>
                    <option value="">전체</option>
                    <option value="IN">수입</option>
                    <option value="OUT">수출</option>
                  </select>
                </div>
                <div className="col-span-3">
                  <label className={labelCls}>B/L NO / JOB NO / 화주명</label>
                  <input type="text" value={filters.keyword} onChange={e => handleFilterChange('keyword', e.target.value)}
                    placeholder="M.B/L, H.B/L, MAWB, HAWB, JOB NO, 화주명" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>O/B.Date(From)</label>
                  <input type="date" value={filters.obDateFrom} onChange={e => handleFilterChange('obDateFrom', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>O/B.Date(To)</label>
                  <input type="date" value={filters.obDateTo} onChange={e => handleFilterChange('obDateTo', e.target.value)} className={inputCls} />
                </div>
                <div className="flex items-end gap-1">
                  <button onClick={() => handleSearch()} disabled={loading}
                    className="h-[32px] px-3 bg-[#1A2744] text-white text-xs rounded hover:bg-[#243354] disabled:opacity-50 flex-1">
                    {loading ? '...' : '조회'}
                  </button>
                </div>
              </div>

              {/* Row 2: Shipper / Consignee / Vessel|Flight / POL / POD / AR Date */}
              <div className="grid grid-cols-8 gap-2 mb-2">
                <div>
                  <label className={labelCls}>Shipper</label>
                  <input type="text" value={filters.shipperName} onChange={e => handleFilterChange('shipperName', e.target.value)}
                    placeholder="Shipper" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Consignee</label>
                  <input type="text" value={filters.consigneeName} onChange={e => handleFilterChange('consigneeName', e.target.value)}
                    placeholder="Consignee" className={inputCls} />
                </div>
                {(isSea) && (
                  <div>
                    <label className={labelCls}>Vessel</label>
                    <input type="text" value={filters.vesselName} onChange={e => handleFilterChange('vesselName', e.target.value)}
                      placeholder="Vessel Name" className={inputCls} />
                  </div>
                )}
                {(isAir) && (
                  <div>
                    <label className={labelCls}>Flight No.</label>
                    <input type="text" value={filters.flightNo} onChange={e => handleFilterChange('flightNo', e.target.value)}
                      placeholder="Flight No." className={inputCls} />
                  </div>
                )}
                {(!isSea && !isAir) && <div />}
                <div>
                  <label className={labelCls}>P.O.L</label>
                  <input type="text" value={filters.pol} onChange={e => handleFilterChange('pol', e.target.value)}
                    placeholder="POL" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>P.O.D</label>
                  <input type="text" value={filters.pod} onChange={e => handleFilterChange('pod', e.target.value)}
                    placeholder="POD" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>A/R.Date(From)</label>
                  <input type="date" value={filters.arDateFrom} onChange={e => handleFilterChange('arDateFrom', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>A/R.Date(To)</label>
                  <input type="date" value={filters.arDateTo} onChange={e => handleFilterChange('arDateTo', e.target.value)} className={inputCls} />
                </div>
                <div className="flex items-end">
                  <button onClick={handleReset}
                    className="h-[32px] px-3 bg-[var(--surface-100)] text-[var(--foreground)] text-xs rounded hover:bg-[var(--surface-200)] w-full">
                    초기화
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Table - 화면설계서 테이블 컬럼 기준 */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#1A2744] text-white">
                <th className="px-2 py-2 text-center font-medium w-10">
                  <span className="text-[10px]">선택</span>
                </th>
                <th className="px-2 py-2 text-center font-medium w-8">No.</th>
                <th className="px-2 py-2 text-center font-medium">O/B.Date</th>
                <th className="px-2 py-2 text-center font-medium">A/R.Date</th>
                <th className="px-2 py-2 text-center font-medium">JOB.NO.</th>
                <th className="px-2 py-2 text-center font-medium">
                  {filters.type === 'air' ? 'MAWB NO.' : 'M.B/L NO.'}
                </th>
                <th className="px-2 py-2 text-center font-medium">
                  {filters.type === 'air' ? 'HAWB NO.' : 'H.B/L NO.'}
                </th>
                <th className="px-2 py-2 text-center font-medium">L/C NO.</th>
                <th className="px-2 py-2 text-center font-medium">P/O NO.</th>
                <th className="px-2 py-2 text-center font-medium">Shipper</th>
                <th className="px-2 py-2 text-center font-medium">Consignee</th>
                <th className="px-2 py-2 text-center font-medium">POL</th>
                <th className="px-2 py-2 text-center font-medium">POD</th>
                {filters.type !== 'air' && <th className="px-2 py-2 text-center font-medium">Vessel</th>}
                {filters.type !== 'sea' && <th className="px-2 py-2 text-center font-medium">Flight</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#E8A838] border-t-transparent rounded-full animate-spin" />
                      <span className="text-[var(--muted)] text-xs">조회 중...</span>
                    </div>
                  </td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-[var(--muted)]">
                    조회된 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                results.map((item, idx) => {
                  const key = `${item.docType}-${item.id}`;
                  const isSelected = selectedId === key;
                  return (
                    <tr key={`${key}-${idx}`}
                      className={`border-b border-[var(--border)] cursor-pointer transition-colors ${isSelected ? 'bg-blue-500/15' : 'hover:bg-[var(--surface-50)]'}`}
                      onClick={() => setSelectedId(key)}
                      onDoubleClick={() => onSelect(item)}
                    >
                      <td className="px-2 py-1.5 text-center">
                        <input type="radio" name="bl-select" checked={isSelected} onChange={() => setSelectedId(key)}
                          className="w-3.5 h-3.5" />
                      </td>
                      <td className="px-2 py-1.5 text-center text-[var(--muted)]">{idx + 1}</td>
                      <td className="px-2 py-1.5 text-center">{item.etd || '-'}</td>
                      <td className="px-2 py-1.5 text-center">{item.eta || '-'}</td>
                      <td className="px-2 py-1.5 text-center">
                        <span className="text-[#E8A838] font-medium">{item.jobNo}</span>
                      </td>
                      <td className="px-2 py-1.5 text-center font-mono">{item.mblNo || '-'}</td>
                      <td className="px-2 py-1.5 text-center font-mono">{item.hblNo || '-'}</td>
                      <td className="px-2 py-1.5 text-center">{item.lcNo || '-'}</td>
                      <td className="px-2 py-1.5 text-center">{item.poNo || '-'}</td>
                      <td className="px-2 py-1.5 truncate max-w-[100px]">{item.shipperName || '-'}</td>
                      <td className="px-2 py-1.5 truncate max-w-[100px]">{item.consigneeName || '-'}</td>
                      <td className="px-2 py-1.5 text-center">{item.pol || '-'}</td>
                      <td className="px-2 py-1.5 text-center">{item.pod || '-'}</td>
                      {filters.type !== 'air' && <td className="px-2 py-1.5 truncate max-w-[80px]">{item.vesselName || '-'}</td>}
                      {filters.type !== 'sea' && <td className="px-2 py-1.5 text-center">{item.flightNo || '-'}</td>}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer - 건수 + 적용/닫기 버튼 */}
        <div className="px-5 py-3 border-t border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--muted)]">전체 <strong className="text-[var(--foreground)]">{results.length}</strong>건</span>
            {selectedId && (
              <span className="text-xs text-blue-400">1건 선택됨</span>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={handleApply}
              className="h-[34px] px-5 bg-[#1A2744] text-white text-sm rounded-lg hover:bg-[#243354] font-medium">
              적용
            </button>
            <button onClick={onClose}
              className="h-[34px] px-5 bg-[var(--surface-100)] text-[var(--foreground)] text-sm rounded-lg hover:bg-[var(--surface-200)]">
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
