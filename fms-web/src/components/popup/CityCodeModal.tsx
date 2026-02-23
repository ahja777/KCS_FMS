'use client';

import { useState, useEffect, useCallback } from 'react';

export interface CityItem {
  code: string;
  nameKr: string;
  nameEn: string;
  country: string;
}

interface CityCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: CityItem) => void;
}

export default function CityCodeModal({ isOpen, onClose, onSelect }: CityCodeModalProps) {
  const [searchType, setSearchType] = useState<'code' | 'name'>('name');
  const [searchText, setSearchText] = useState('');
  const [selectedItem, setSelectedItem] = useState<CityItem | null>(null);
  const [data, setData] = useState<CityItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (keyword?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.set('keyword', keyword);
      const res = await fetch(`/api/city-code?${params.toString()}`);
      if (res.ok) {
        const rows = await res.json();
        setData(rows);
      }
    } catch (err) {
      console.error('도시코드 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setSearchText('');
      setSelectedItem(null);
    }
  }, [isOpen, fetchData]);

  const handleSearch = () => {
    fetchData(searchText);
  };

  const handleReset = () => {
    setSearchText('');
    setSelectedItem(null);
    fetchData();
  };

  const handleSelect = () => {
    if (selectedItem) {
      onSelect(selectedItem);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const filteredData = searchType === 'code'
    ? data.filter(item => !searchText || item.code.toLowerCase().includes(searchText.toLowerCase()))
    : data;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--surface-100)] rounded-lg shadow-xl w-[700px] max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[#1A2744] rounded-t-lg">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            도시코드 검색
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 검색 조건 */}
        <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-100)]">
          <div className="flex gap-3 items-end">
            <div className="w-28">
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">검색기준</label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as 'code' | 'name')}
                className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
              >
                <option value="name">도시명</option>
                <option value="code">코드</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                {searchType === 'code' ? '도시코드' : '도시명'}
              </label>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchType === 'code' ? '예: SEL, ICN' : '예: 서울, 부산'}
                className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 text-sm bg-[#1A2744] text-white rounded-lg hover:bg-[#243354]"
            >
              조회
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm bg-[var(--surface-50)] text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
            >
              초기화
            </button>
          </div>
        </div>

        {/* 목록 */}
        <div className="flex-1 overflow-auto p-4">
          <div className="text-sm text-[var(--muted)] mb-2">
            검색 결과: {filteredData.length}건
            {loading && <span className="ml-2 text-blue-500">조회중...</span>}
          </div>
          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface-100)] sticky top-0">
                <tr>
                  <th className="p-2 text-center font-medium w-20">코드</th>
                  <th className="p-2 text-left font-medium">도시명(한글)</th>
                  <th className="p-2 text-left font-medium">도시명(영문)</th>
                  <th className="p-2 text-center font-medium w-20">국가</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-[var(--muted)]">
                      {loading ? '조회 중입니다...' : '조회된 도시코드가 없습니다.'}
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr
                      key={item.code}
                      className={`border-t border-[var(--border)] cursor-pointer ${
                        selectedItem?.code === item.code ? 'bg-blue-100' : 'bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedItem(item)}
                      onDoubleClick={() => { onSelect(item); onClose(); }}
                    >
                      <td className="p-2 text-center font-mono font-medium text-blue-600">{item.code}</td>
                      <td className="p-2 font-medium">{item.nameKr}</td>
                      <td className="p-2 text-[var(--muted)]">{item.nameEn}</td>
                      <td className="p-2 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                          {item.country}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="p-4 border-t border-[var(--border)] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]"
          >
            닫기
          </button>
          <button
            onClick={handleSelect}
            disabled={!selectedItem}
            className="px-4 py-2 bg-[#E8A838] text-[#0C1222] font-semibold rounded-lg hover:bg-[#D4943A] disabled:opacity-50"
          >
            적용
          </button>
        </div>
      </div>
    </div>
  );
}
