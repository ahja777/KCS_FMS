'use client';

import { useState, useMemo } from 'react';

export interface ForwarderItem {
  code: string;
  nameKr: string;
  nameEn: string;
  country: string;
  city: string;
  address?: string;
  contact?: string;
  email?: string;
  type: 'domestic' | 'overseas' | 'agent';
  services: string[];
}

interface ForwarderSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: ForwarderItem) => void;
  forwarderType?: 'domestic' | 'overseas' | 'agent' | 'all';
}

// 샘플 포워더 데이터
const sampleForwarders: ForwarderItem[] = [
  { code: 'FWD001', nameKr: '삼성SDS 로지스틱스', nameEn: 'Samsung SDS Logistics', country: 'South Korea', city: 'Seoul', address: '서울시 송파구 올림픽로35길', contact: '02-1234-5678', email: 'logistics@samsungsds.com', type: 'domestic', services: ['Sea', 'Air', 'Customs'] },
  { code: 'FWD002', nameKr: '한진', nameEn: 'Hanjin Transportation', country: 'South Korea', city: 'Seoul', address: '서울시 중구 남대문로', contact: '02-2222-3333', email: 'hanjin@hanjin.co.kr', type: 'domestic', services: ['Sea', 'Air', 'Land'] },
  { code: 'FWD003', nameKr: '범한판토스', nameEn: 'Pantos Logistics', country: 'South Korea', city: 'Seoul', address: '서울시 강남구 테헤란로', contact: '02-3333-4444', email: 'pantos@pantos.com', type: 'domestic', services: ['Sea', 'Air', 'Warehouse'] },
  { code: 'FWD004', nameKr: '세방', nameEn: 'Sebang', country: 'South Korea', city: 'Seoul', address: '서울시 종로구 종로', contact: '02-4444-5555', email: 'info@sebang.com', type: 'domestic', services: ['Sea', 'Land'] },
  { code: 'FWD005', nameKr: '현대글로비스', nameEn: 'Hyundai Glovis', country: 'South Korea', city: 'Seoul', address: '서울시 강남구 영동대로', contact: '02-5555-6666', email: 'glovis@hyundai-glovis.com', type: 'domestic', services: ['Sea', 'Air', 'Land', 'Warehouse'] },
  { code: 'FWD006', nameKr: 'DHL Korea', nameEn: 'DHL Global Forwarding Korea', country: 'South Korea', city: 'Seoul', address: '서울시 강서구 공항대로', contact: '02-6666-7777', email: 'korea@dhl.com', type: 'agent', services: ['Sea', 'Air', 'Express'] },
  { code: 'AGT001', nameKr: 'Kuehne+Nagel Shanghai', nameEn: 'Kuehne+Nagel Shanghai', country: 'China', city: 'Shanghai', address: '200 Pudong Avenue, Shanghai', contact: '+86-21-1234-5678', email: 'shanghai@kuehne-nagel.com', type: 'overseas', services: ['Sea', 'Air'] },
  { code: 'AGT002', nameKr: 'Schenker Japan', nameEn: 'DB Schenker Japan', country: 'Japan', city: 'Tokyo', address: 'Shibuya, Tokyo', contact: '+81-3-1234-5678', email: 'tokyo@dbschenker.com', type: 'overseas', services: ['Sea', 'Air', 'Land'] },
  { code: 'AGT003', nameKr: 'Expeditors USA', nameEn: 'Expeditors International', country: 'USA', city: 'Los Angeles', address: '1800 Century Park East, LA', contact: '+1-310-123-4567', email: 'la@expeditors.com', type: 'overseas', services: ['Sea', 'Air', 'Customs'] },
  { code: 'AGT004', nameKr: 'DSV Singapore', nameEn: 'DSV Singapore', country: 'Singapore', city: 'Singapore', address: '1 Changi South Lane', contact: '+65-6543-2100', email: 'singapore@dsv.com', type: 'overseas', services: ['Sea', 'Air'] },
  { code: 'AGT005', nameKr: 'Bolloré Germany', nameEn: 'Bolloré Logistics Germany', country: 'Germany', city: 'Hamburg', address: 'Speicherstadt 5, Hamburg', contact: '+49-40-123-4567', email: 'hamburg@bollore.com', type: 'overseas', services: ['Sea', 'Air', 'Land'] },
  { code: 'AGT006', nameKr: 'CEVA Vietnam', nameEn: 'CEVA Logistics Vietnam', country: 'Vietnam', city: 'Ho Chi Minh', address: 'District 7, HCMC', contact: '+84-28-1234-5678', email: 'vietnam@cevalogistics.com', type: 'overseas', services: ['Sea', 'Air', 'Warehouse'] },
];

const typeConfig = {
  domestic: { label: '국내', color: '#0284C7', bgColor: '#E0F2FE' },
  overseas: { label: '해외', color: '#7C3AED', bgColor: '#EDE9FE' },
  agent: { label: '에이전트', color: '#059669', bgColor: '#D1FAE5' },
};

const serviceConfig: Record<string, { color: string; bgColor: string }> = {
  Sea: { color: '#0284C7', bgColor: '#E0F2FE' },
  Air: { color: '#7C3AED', bgColor: '#EDE9FE' },
  Land: { color: '#D97706', bgColor: '#FEF3C7' },
  Warehouse: { color: '#059669', bgColor: '#D1FAE5' },
  Customs: { color: '#DC2626', bgColor: '#FEE2E2' },
  Express: { color: '#EC4899', bgColor: '#FCE7F3' },
};

export default function ForwarderSearchModal({
  isOpen,
  onClose,
  onSelect,
  forwarderType = 'all',
}: ForwarderSearchModalProps) {
  const [searchType, setSearchType] = useState<'code' | 'name'>('name');
  const [searchText, setSearchText] = useState('');
  const [fwdType, setFwdType] = useState(forwarderType === 'all' ? '' : forwarderType);
  const [country, setCountry] = useState('');
  const [selectedItem, setSelectedItem] = useState<ForwarderItem | null>(null);

  const countries = useMemo(() => {
    const set = new Set(sampleForwarders.map(f => f.country));
    return Array.from(set).sort();
  }, []);

  const filteredData = useMemo(() => {
    return sampleForwarders.filter(item => {
      if (fwdType && item.type !== fwdType) return false;
      if (country && item.country !== country) return false;
      if (searchText) {
        if (searchType === 'code') {
          return item.code.toLowerCase().includes(searchText.toLowerCase());
        } else {
          return item.nameKr.includes(searchText) ||
                 item.nameEn.toLowerCase().includes(searchText.toLowerCase());
        }
      }
      return true;
    });
  }, [searchText, searchType, fwdType, country]);

  const handleSelect = () => {
    if (selectedItem) {
      onSelect(selectedItem);
      onClose();
    }
  };

  const handleReset = () => {
    setSearchText('');
    setFwdType('');
    setCountry('');
    setSelectedItem(null);
  };

  const handleRowDoubleClick = (item: ForwarderItem) => {
    onSelect(item);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--surface-100)] rounded-lg shadow-xl w-[1000px] max-h-[85vh] flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[#1A2744] rounded-t-lg">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            포워더 조회
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
                <option value="name">포워더명</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">검색어</label>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder={searchType === 'code' ? 'FWD001, AGT001...' : '삼성SDS, DHL...'}
                className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
              />
            </div>
            <div className="w-32">
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">구분</label>
              <select
                value={fwdType}
                onChange={(e) => setFwdType(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
              >
                <option value="">전체</option>
                <option value="domestic">국내</option>
                <option value="overseas">해외</option>
                <option value="agent">에이전트</option>
              </select>
            </div>
            <div className="w-36">
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">국가</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
              >
                <option value="">전체</option>
                {countries.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
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
                <th className="px-3 py-2 text-left font-medium border-b border-[var(--border)]">포워더명(한글)</th>
                <th className="px-3 py-2 text-left font-medium border-b border-[var(--border)]">포워더명(영문)</th>
                <th className="px-3 py-2 text-left font-medium border-b border-[var(--border)]">국가/도시</th>
                <th className="px-3 py-2 text-center font-medium border-b border-[var(--border)]">구분</th>
                <th className="px-3 py-2 text-center font-medium border-b border-[var(--border)]">서비스</th>
                <th className="px-3 py-2 text-left font-medium border-b border-[var(--border)]">연락처</th>
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
                  <td className="px-3 py-2 border-b border-[var(--border)]">{item.nameKr}</td>
                  <td className="px-3 py-2 border-b border-[var(--border)]">{item.nameEn}</td>
                  <td className="px-3 py-2 border-b border-[var(--border)]">
                    {item.country} / {item.city}
                  </td>
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
                  <td className="px-3 py-2 border-b border-[var(--border)] text-center">
                    <div className="flex gap-1 justify-center flex-wrap">
                      {item.services.map(service => (
                        <span
                          key={service}
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                          style={{
                            backgroundColor: serviceConfig[service]?.bgColor || '#F3F4F6',
                            color: serviceConfig[service]?.color || '#6B7280',
                          }}
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 border-b border-[var(--border)] text-xs">
                    {item.contact}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 선택된 포워더 상세 정보 */}
        {selectedItem && (
          <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-100)]">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-[var(--muted)]">주소:</span>
                <span className="ml-2">{selectedItem.address || '-'}</span>
              </div>
              <div>
                <span className="text-[var(--muted)]">이메일:</span>
                <span className="ml-2">{selectedItem.email || '-'}</span>
              </div>
              <div>
                <span className="text-[var(--muted)]">연락처:</span>
                <span className="ml-2">{selectedItem.contact || '-'}</span>
              </div>
            </div>
          </div>
        )}

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
