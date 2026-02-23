'use client';

import { useState, useMemo } from 'react';

export interface AirlineItem {
  code: string;
  iataCode: string;
  icaoCode: string;
  nameKr: string;
  nameEn: string;
  country: string;
  alliance?: string;
  hub?: string;
}

interface AirlineCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: AirlineItem) => void;
}

// 샘플 항공사 데이터
const sampleAirlines: AirlineItem[] = [
  { code: 'KE', iataCode: 'KE', icaoCode: 'KAL', nameKr: '대한항공', nameEn: 'Korean Air', country: 'South Korea', alliance: 'SkyTeam', hub: 'ICN' },
  { code: 'OZ', iataCode: 'OZ', icaoCode: 'AAR', nameKr: '아시아나항공', nameEn: 'Asiana Airlines', country: 'South Korea', alliance: 'Star Alliance', hub: 'ICN' },
  { code: 'JL', iataCode: 'JL', icaoCode: 'JAL', nameKr: '일본항공', nameEn: 'Japan Airlines', country: 'Japan', alliance: 'oneworld', hub: 'NRT' },
  { code: 'NH', iataCode: 'NH', icaoCode: 'ANA', nameKr: '전일본공수', nameEn: 'All Nippon Airways', country: 'Japan', alliance: 'Star Alliance', hub: 'HND' },
  { code: 'CX', iataCode: 'CX', icaoCode: 'CPA', nameKr: '캐세이퍼시픽', nameEn: 'Cathay Pacific', country: 'Hong Kong', alliance: 'oneworld', hub: 'HKG' },
  { code: 'SQ', iataCode: 'SQ', icaoCode: 'SIA', nameKr: '싱가포르항공', nameEn: 'Singapore Airlines', country: 'Singapore', alliance: 'Star Alliance', hub: 'SIN' },
  { code: 'EK', iataCode: 'EK', icaoCode: 'UAE', nameKr: '에미레이트', nameEn: 'Emirates', country: 'UAE', hub: 'DXB' },
  { code: 'QR', iataCode: 'QR', icaoCode: 'QTR', nameKr: '카타르항공', nameEn: 'Qatar Airways', country: 'Qatar', alliance: 'oneworld', hub: 'DOH' },
  { code: 'TK', iataCode: 'TK', icaoCode: 'THY', nameKr: '터키항공', nameEn: 'Turkish Airlines', country: 'Turkey', alliance: 'Star Alliance', hub: 'IST' },
  { code: 'LH', iataCode: 'LH', icaoCode: 'DLH', nameKr: '루프트한자', nameEn: 'Lufthansa', country: 'Germany', alliance: 'Star Alliance', hub: 'FRA' },
  { code: 'AF', iataCode: 'AF', icaoCode: 'AFR', nameKr: '에어프랑스', nameEn: 'Air France', country: 'France', alliance: 'SkyTeam', hub: 'CDG' },
  { code: 'BA', iataCode: 'BA', icaoCode: 'BAW', nameKr: '영국항공', nameEn: 'British Airways', country: 'United Kingdom', alliance: 'oneworld', hub: 'LHR' },
  { code: 'AA', iataCode: 'AA', icaoCode: 'AAL', nameKr: '아메리칸항공', nameEn: 'American Airlines', country: 'USA', alliance: 'oneworld', hub: 'DFW' },
  { code: 'UA', iataCode: 'UA', icaoCode: 'UAL', nameKr: '유나이티드항공', nameEn: 'United Airlines', country: 'USA', alliance: 'Star Alliance', hub: 'ORD' },
  { code: 'DL', iataCode: 'DL', icaoCode: 'DAL', nameKr: '델타항공', nameEn: 'Delta Air Lines', country: 'USA', alliance: 'SkyTeam', hub: 'ATL' },
  { code: 'CA', iataCode: 'CA', icaoCode: 'CCA', nameKr: '중국국제항공', nameEn: 'Air China', country: 'China', alliance: 'Star Alliance', hub: 'PEK' },
  { code: 'MU', iataCode: 'MU', icaoCode: 'CES', nameKr: '중국동방항공', nameEn: 'China Eastern Airlines', country: 'China', alliance: 'SkyTeam', hub: 'PVG' },
  { code: 'CZ', iataCode: 'CZ', icaoCode: 'CSN', nameKr: '중국남방항공', nameEn: 'China Southern Airlines', country: 'China', alliance: 'SkyTeam', hub: 'CAN' },
  { code: 'FX', iataCode: 'FX', icaoCode: 'FDX', nameKr: '페덱스', nameEn: 'FedEx Express', country: 'USA', hub: 'MEM' },
  { code: '5X', iataCode: '5X', icaoCode: 'UPS', nameKr: 'UPS 항공', nameEn: 'UPS Airlines', country: 'USA', hub: 'SDF' },
];

const allianceConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  'Star Alliance': { label: 'Star Alliance', color: '#D97706', bgColor: '#FEF3C7' },
  'SkyTeam': { label: 'SkyTeam', color: '#0284C7', bgColor: '#E0F2FE' },
  'oneworld': { label: 'oneworld', color: '#DC2626', bgColor: '#FEE2E2' },
};

export default function AirlineCodeModal({
  isOpen,
  onClose,
  onSelect,
}: AirlineCodeModalProps) {
  const [searchType, setSearchType] = useState<'code' | 'name'>('name');
  const [searchText, setSearchText] = useState('');
  const [alliance, setAlliance] = useState('');
  const [selectedItem, setSelectedItem] = useState<AirlineItem | null>(null);

  const filteredData = useMemo(() => {
    return sampleAirlines.filter(item => {
      if (alliance && item.alliance !== alliance) return false;
      if (searchText) {
        if (searchType === 'code') {
          return item.code.toLowerCase().includes(searchText.toLowerCase()) ||
                 item.iataCode.toLowerCase().includes(searchText.toLowerCase()) ||
                 item.icaoCode.toLowerCase().includes(searchText.toLowerCase());
        } else {
          return item.nameKr.includes(searchText) ||
                 item.nameEn.toLowerCase().includes(searchText.toLowerCase());
        }
      }
      return true;
    });
  }, [searchText, searchType, alliance]);

  const handleSelect = () => {
    if (selectedItem) {
      onSelect(selectedItem);
      onClose();
    }
  };

  const handleReset = () => {
    setSearchText('');
    setAlliance('');
    setSelectedItem(null);
  };

  const handleRowDoubleClick = (item: AirlineItem) => {
    onSelect(item);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--surface-100)] rounded-lg shadow-xl w-[950px] max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[#1A2744] rounded-t-lg">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            항공사 코드 조회
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
                <option value="name">항공사명</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">검색어</label>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder={searchType === 'code' ? 'KE, OZ, LH...' : '대한항공, Korean Air...'}
                className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
              />
            </div>
            <div className="w-40">
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">항공동맹</label>
              <select
                value={alliance}
                onChange={(e) => setAlliance(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
              >
                <option value="">전체</option>
                <option value="Star Alliance">Star Alliance</option>
                <option value="SkyTeam">SkyTeam</option>
                <option value="oneworld">oneworld</option>
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
                <th className="px-3 py-2 text-left font-medium border-b border-[var(--border)]">IATA</th>
                <th className="px-3 py-2 text-left font-medium border-b border-[var(--border)]">ICAO</th>
                <th className="px-3 py-2 text-left font-medium border-b border-[var(--border)]">항공사명(한글)</th>
                <th className="px-3 py-2 text-left font-medium border-b border-[var(--border)]">항공사명(영문)</th>
                <th className="px-3 py-2 text-left font-medium border-b border-[var(--border)]">국가</th>
                <th className="px-3 py-2 text-center font-medium border-b border-[var(--border)]">동맹</th>
                <th className="px-3 py-2 text-center font-medium border-b border-[var(--border)]">허브</th>
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
                    {item.iataCode}
                  </td>
                  <td className="px-3 py-2 border-b border-[var(--border)] font-mono">
                    {item.icaoCode}
                  </td>
                  <td className="px-3 py-2 border-b border-[var(--border)]">{item.nameKr}</td>
                  <td className="px-3 py-2 border-b border-[var(--border)]">{item.nameEn}</td>
                  <td className="px-3 py-2 border-b border-[var(--border)]">{item.country}</td>
                  <td className="px-3 py-2 border-b border-[var(--border)] text-center">
                    {item.alliance ? (
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: allianceConfig[item.alliance]?.bgColor || '#F3F4F6',
                          color: allianceConfig[item.alliance]?.color || '#6B7280',
                        }}
                      >
                        {allianceConfig[item.alliance]?.label || item.alliance}
                      </span>
                    ) : (
                      <span className="text-[var(--muted)]">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2 border-b border-[var(--border)] text-center font-mono">
                    {item.hub || '-'}
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
