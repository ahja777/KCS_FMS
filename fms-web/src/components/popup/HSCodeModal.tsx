'use client';

import { useState, useMemo } from 'react';

export interface HSCodeItem {
  hsCode: string;
  nameKr: string;
  nameEn: string;
  chapter: string;
  section: string;
  tariffRate?: string;
}

interface HSCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: HSCodeItem) => void;
}

// 샘플 HS코드 데이터
const sampleHSCodes: HSCodeItem[] = [
  { hsCode: '8471.30', nameKr: '휴대용 자동자료처리기계', nameEn: 'Portable automatic data processing machines', chapter: '84', section: 'XVI', tariffRate: '0%' },
  { hsCode: '8471.41', nameKr: '자동자료처리기계(입출력장치 포함)', nameEn: 'Automatic data processing machines with I/O', chapter: '84', section: 'XVI', tariffRate: '0%' },
  { hsCode: '8517.12', nameKr: '셀룰러통신기기(휴대폰)', nameEn: 'Telephones for cellular networks', chapter: '85', section: 'XVI', tariffRate: '0%' },
  { hsCode: '8517.62', nameKr: '무선통신기기', nameEn: 'Machines for the reception/conversion', chapter: '85', section: 'XVI', tariffRate: '0%' },
  { hsCode: '8528.72', nameKr: '컬러텔레비전 수상기', nameEn: 'Colour television receivers', chapter: '85', section: 'XVI', tariffRate: '8%' },
  { hsCode: '8703.23', nameKr: '승용자동차(1500-3000cc)', nameEn: 'Motor cars (1500-3000cc)', chapter: '87', section: 'XVII', tariffRate: '8%' },
  { hsCode: '8703.24', nameKr: '승용자동차(3000cc 초과)', nameEn: 'Motor cars (over 3000cc)', chapter: '87', section: 'XVII', tariffRate: '8%' },
  { hsCode: '3004.90', nameKr: '기타 의약품', nameEn: 'Other medicaments', chapter: '30', section: 'VI', tariffRate: '8%' },
  { hsCode: '6110.20', nameKr: '면제 스웨터/풀오버', nameEn: 'Jerseys, pullovers of cotton', chapter: '61', section: 'XI', tariffRate: '13%' },
  { hsCode: '6203.42', nameKr: '면제 남성용 바지', nameEn: "Men's trousers of cotton", chapter: '62', section: 'XI', tariffRate: '13%' },
  { hsCode: '0901.21', nameKr: '볶은 커피(카페인 미제거)', nameEn: 'Roasted coffee, not decaffeinated', chapter: '09', section: 'II', tariffRate: '2%' },
  { hsCode: '2204.21', nameKr: '포도주(2리터 이하 용기)', nameEn: 'Wine in containers of 2L or less', chapter: '22', section: 'IV', tariffRate: '15%' },
];

export default function HSCodeModal({
  isOpen,
  onClose,
  onSelect,
}: HSCodeModalProps) {
  const [searchType, setSearchType] = useState<'code' | 'name'>('code');
  const [searchText, setSearchText] = useState('');
  const [selectedItem, setSelectedItem] = useState<HSCodeItem | null>(null);

  const filteredData = useMemo(() => {
    if (!searchText) return sampleHSCodes;

    return sampleHSCodes.filter(item => {
      if (searchType === 'code') {
        return item.hsCode.includes(searchText);
      } else {
        return item.nameKr.includes(searchText) ||
               item.nameEn.toLowerCase().includes(searchText.toLowerCase());
      }
    });
  }, [searchText, searchType]);

  const handleSelect = () => {
    if (selectedItem) {
      onSelect(selectedItem);
      onClose();
    }
  };

  const handleReset = () => {
    setSearchText('');
    setSelectedItem(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--surface-100)] rounded-lg shadow-xl w-[800px] max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[#1A2744] rounded-t-lg">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            HS품목코드 조회
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
            <div className="w-32">
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">기준</label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as 'code' | 'name')}
                className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
              >
                <option value="code">HS부호</option>
                <option value="name">품목명</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                {searchType === 'code' ? 'HS부호' : '영문명/한글명'}
              </label>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder={searchType === 'code' ? '예: 8471' : '예: computer'}
                className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => {}}
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
          </div>
          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface-100)] sticky top-0">
                <tr>
                  <th className="p-2 text-center font-medium w-28">HS코드</th>
                  <th className="p-2 text-left font-medium">품목명(한글)</th>
                  <th className="p-2 text-left font-medium">품목명(영문)</th>
                  <th className="p-2 text-center font-medium w-20">관세율</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-[var(--muted)]">
                      조회된 HS코드가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr
                      key={item.hsCode}
                      className={`border-t border-[var(--border)] cursor-pointer ${
                        selectedItem?.hsCode === item.hsCode ? 'bg-blue-100' : 'bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedItem(item)}
                      onDoubleClick={() => { onSelect(item); onClose(); }}
                    >
                      <td className="p-2 text-center font-mono font-medium text-blue-600">{item.hsCode}</td>
                      <td className="p-2">{item.nameKr}</td>
                      <td className="p-2 text-[var(--muted)] text-xs">{item.nameEn}</td>
                      <td className="p-2 text-center">{item.tariffRate}</td>
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
