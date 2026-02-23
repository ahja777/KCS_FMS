'use client';

import { useState, useMemo } from 'react';

export interface CarrierItem {
  code: string;
  nameKr: string;
  nameEn: string;
  country: string;
  type: 'container' | 'bulk' | 'tanker' | 'roro';
  website?: string;
  scac?: string;
}

interface CarrierCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: CarrierItem) => void;
}

// 샘플 선사 데이터
const sampleCarriers: CarrierItem[] = [
  { code: 'MAEU', nameKr: '머스크', nameEn: 'MAERSK', country: 'Denmark', type: 'container', scac: 'MAEU', website: 'www.maersk.com' },
  { code: 'MSCU', nameKr: 'MSC', nameEn: 'Mediterranean Shipping Company', country: 'Switzerland', type: 'container', scac: 'MSCU', website: 'www.msc.com' },
  { code: 'CMDU', nameKr: 'CMA CGM', nameEn: 'CMA CGM', country: 'France', type: 'container', scac: 'CMDU', website: 'www.cma-cgm.com' },
  { code: 'COSU', nameKr: '코스코', nameEn: 'COSCO Shipping', country: 'China', type: 'container', scac: 'COSU', website: 'www.coscoshipping.com' },
  { code: 'EGLV', nameKr: '에버그린', nameEn: 'Evergreen Marine', country: 'Taiwan', type: 'container', scac: 'EGLV', website: 'www.evergreen-marine.com' },
  { code: 'HDMU', nameKr: 'HMM', nameEn: 'HMM (Hyundai Merchant Marine)', country: 'South Korea', type: 'container', scac: 'HDMU', website: 'www.hmm21.com' },
  { code: 'ONEY', nameKr: 'ONE', nameEn: 'Ocean Network Express', country: 'Japan', type: 'container', scac: 'ONEY', website: 'www.one-line.com' },
  { code: 'HLCU', nameKr: '하팍로이드', nameEn: 'Hapag-Lloyd', country: 'Germany', type: 'container', scac: 'HLCU', website: 'www.hapag-lloyd.com' },
  { code: 'YMLU', nameKr: '양밍', nameEn: 'Yang Ming Marine', country: 'Taiwan', type: 'container', scac: 'YMLU', website: 'www.yangming.com' },
  { code: 'ZIMU', nameKr: 'ZIM', nameEn: 'ZIM Integrated Shipping', country: 'Israel', type: 'container', scac: 'ZIMU', website: 'www.zim.com' },
  { code: 'WHLC', nameKr: '완하이', nameEn: 'Wan Hai Lines', country: 'Taiwan', type: 'container', scac: 'WHLC', website: 'www.wanhai.com' },
  { code: 'APLU', nameKr: 'APL', nameEn: 'APL (American President Lines)', country: 'Singapore', type: 'container', scac: 'APLU', website: 'www.apl.com' },
  { code: 'OOLU', nameKr: 'OOCL', nameEn: 'Orient Overseas Container Line', country: 'Hong Kong', type: 'container', scac: 'OOLU', website: 'www.oocl.com' },
  { code: 'SMLM', nameKr: 'SM상선', nameEn: 'SM Line Corporation', country: 'South Korea', type: 'container', scac: 'SMLM', website: 'www.smlines.com' },
  { code: 'KMTC', nameKr: '고려해운', nameEn: 'KMTC', country: 'South Korea', type: 'container', scac: 'KMTC', website: 'www.kmtc.co.kr' },
  { code: 'SNKO', nameKr: '시노코', nameEn: 'Sinokor Merchant Marine', country: 'South Korea', type: 'container', scac: 'SNKO', website: 'www.sinokor.co.kr' },
];

const typeConfig = {
  container: { label: '컨테이너선', color: '#0284C7', bgColor: '#E0F2FE' },
  bulk: { label: '벌크선', color: '#7C3AED', bgColor: '#EDE9FE' },
  tanker: { label: '탱커선', color: '#D97706', bgColor: '#FEF3C7' },
  roro: { label: 'RO-RO선', color: '#059669', bgColor: '#D1FAE5' },
};

export default function CarrierCodeModal({
  isOpen,
  onClose,
  onSelect,
}: CarrierCodeModalProps) {
  const [searchType, setSearchType] = useState<'code' | 'name'>('name');
  const [searchText, setSearchText] = useState('');
  const [carrierType, setCarrierType] = useState('');
  const [selectedItem, setSelectedItem] = useState<CarrierItem | null>(null);

  const filteredData = useMemo(() => {
    return sampleCarriers.filter(item => {
      if (carrierType && item.type !== carrierType) return false;
      if (searchText) {
        if (searchType === 'code') {
          return item.code.toLowerCase().includes(searchText.toLowerCase()) ||
                 (item.scac && item.scac.toLowerCase().includes(searchText.toLowerCase()));
        } else {
          return item.nameKr.includes(searchText) ||
                 item.nameEn.toLowerCase().includes(searchText.toLowerCase());
        }
      }
      return true;
    });
  }, [searchText, searchType, carrierType]);

  const handleSelect = () => {
    if (selectedItem) {
      onSelect(selectedItem);
      onClose();
    }
  };

  const handleReset = () => {
    setSearchText('');
    setCarrierType('');
    setSelectedItem(null);
  };

  const handleRowDoubleClick = (item: CarrierItem) => {
    onSelect(item);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--surface-100)] rounded-lg shadow-xl w-[900px] max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[#1A2744] rounded-t-lg">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            선사 코드 조회
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
                <option value="code">코드</option>
                <option value="name">선사명</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">검색어</label>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder={searchType === 'code' ? 'MAEU, MSCU...' : '머스크, MSC...'}
                className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
              />
            </div>
            <div className="w-36">
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">선박유형</label>
              <select
                value={carrierType}
                onChange={(e) => setCarrierType(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
              >
                <option value="">전체</option>
                <option value="container">컨테이너선</option>
                <option value="bulk">벌크선</option>
                <option value="tanker">탱커선</option>
                <option value="roro">RO-RO선</option>
              </select>
            </div>
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm bg-[var(--surface-200)] hover:bg-[var(--surface-300)] rounded-lg"
            >
              초기화
            </button>
          </div>
        </div>

        {/* 결과 테이블 */}
        <div className="flex-1 overflow-auto p-4">
          <div className="text-sm text-[var(--muted)] mb-2">
            검색결과: {filteredData.length}건
          </div>
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface-100)] sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-medium border-b border-[var(--border)]">코드</th>
                <th className="px-3 py-2 text-left font-medium border-b border-[var(--border)]">SCAC</th>
                <th className="px-3 py-2 text-left font-medium border-b border-[var(--border)]">선사명(한글)</th>
                <th className="px-3 py-2 text-left font-medium border-b border-[var(--border)]">선사명(영문)</th>
                <th className="px-3 py-2 text-left font-medium border-b border-[var(--border)]">국가</th>
                <th className="px-3 py-2 text-center font-medium border-b border-[var(--border)]">유형</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr
                  key={item.code}
                  onClick={() => setSelectedItem(item)}
                  onDoubleClick={() => handleRowDoubleClick(item)}
                  className={`cursor-pointer ${
                    selectedItem?.code === item.code ? 'bg-blue-100' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <td className="px-3 py-2 border-b border-[var(--border)] font-mono font-medium text-[#E8A838]">
                    {item.code}
                  </td>
                  <td className="px-3 py-2 border-b border-[var(--border)] font-mono">
                    {item.scac || '-'}
                  </td>
                  <td className="px-3 py-2 border-b border-[var(--border)]">{item.nameKr}</td>
                  <td className="px-3 py-2 border-b border-[var(--border)]">{item.nameEn}</td>
                  <td className="px-3 py-2 border-b border-[var(--border)]">{item.country}</td>
                  <td className="px-3 py-2 border-b border-[var(--border)] text-center">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: typeConfig[item.type].bgColor,
                        color: typeConfig[item.type].color,
                      }}
                    >
                      {typeConfig[item.type].label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 하단 버튼 */}
        <div className="p-4 border-t border-[var(--border)] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-[var(--surface-200)] hover:bg-[var(--surface-300)] rounded-lg"
          >
            취소
          </button>
          <button
            onClick={handleSelect}
            disabled={!selectedItem}
            className="px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: selectedItem ? 'linear-gradient(135deg, #E8A838 0%, #D4943A 100%)' : undefined,
              color: selectedItem ? '#0C1222' : undefined,
            }}
          >
            선택
          </button>
        </div>
      </div>
    </div>
  );
}
