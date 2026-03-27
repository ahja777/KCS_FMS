'use client';

import { useState, useMemo } from 'react';

export interface LocationItem {
  code: string;
  nameKr: string;
  nameEn: string;
  country: string;
  countryCode: string;
  type: 'airport' | 'seaport' | 'city';
}

export type LocationType = 'airport' | 'seaport' | 'city';

interface LocationCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: LocationItem) => void;
  locationType?: 'origin' | 'destination' | 'all';
  type?: 'airport' | 'seaport' | 'city';
}

// 샘플 출발지/도착지 데이터
const sampleLocations: LocationItem[] = [
  // 한국
  { code: 'ICN', nameKr: '인천', nameEn: 'Incheon', country: '대한민국', countryCode: 'KR', type: 'airport' },
  { code: 'GMP', nameKr: '김포', nameEn: 'Gimpo', country: '대한민국', countryCode: 'KR', type: 'airport' },
  { code: 'KRPUS', nameKr: '부산', nameEn: 'Busan', country: '대한민국', countryCode: 'KR', type: 'seaport' },
  { code: 'KRINC', nameKr: '인천', nameEn: 'Incheon', country: '대한민국', countryCode: 'KR', type: 'seaport' },
  { code: 'SEL', nameKr: '서울', nameEn: 'Seoul', country: '대한민국', countryCode: 'KR', type: 'city' },
  // 중국
  { code: 'PVG', nameKr: '상해 푸동', nameEn: 'Shanghai Pudong', country: '중국', countryCode: 'CN', type: 'airport' },
  { code: 'CNSHA', nameKr: '상해', nameEn: 'Shanghai', country: '중국', countryCode: 'CN', type: 'seaport' },
  { code: 'CNNBO', nameKr: '닝보', nameEn: 'Ningbo', country: '중국', countryCode: 'CN', type: 'seaport' },
  { code: 'PEK', nameKr: '베이징', nameEn: 'Beijing', country: '중국', countryCode: 'CN', type: 'airport' },
  // 일본
  { code: 'NRT', nameKr: '나리타', nameEn: 'Narita', country: '일본', countryCode: 'JP', type: 'airport' },
  { code: 'HND', nameKr: '하네다', nameEn: 'Haneda', country: '일본', countryCode: 'JP', type: 'airport' },
  { code: 'JPYOK', nameKr: '요코하마', nameEn: 'Yokohama', country: '일본', countryCode: 'JP', type: 'seaport' },
  { code: 'JPTYO', nameKr: '도쿄', nameEn: 'Tokyo', country: '일본', countryCode: 'JP', type: 'seaport' },
  // 미국
  { code: 'LAX', nameKr: '로스앤젤레스', nameEn: 'Los Angeles', country: '미국', countryCode: 'US', type: 'airport' },
  { code: 'JFK', nameKr: '뉴욕 JFK', nameEn: 'New York JFK', country: '미국', countryCode: 'US', type: 'airport' },
  { code: 'USLAX', nameKr: '로스앤젤레스', nameEn: 'Los Angeles', country: '미국', countryCode: 'US', type: 'seaport' },
  { code: 'USLGB', nameKr: '롱비치', nameEn: 'Long Beach', country: '미국', countryCode: 'US', type: 'seaport' },
  // 유럽
  { code: 'FRA', nameKr: '프랑크푸르트', nameEn: 'Frankfurt', country: '독일', countryCode: 'DE', type: 'airport' },
  { code: 'DEHAM', nameKr: '함부르크', nameEn: 'Hamburg', country: '독일', countryCode: 'DE', type: 'seaport' },
  { code: 'NLRTM', nameKr: '로테르담', nameEn: 'Rotterdam', country: '네덜란드', countryCode: 'NL', type: 'seaport' },
  { code: 'LHR', nameKr: '런던 히드로', nameEn: 'London Heathrow', country: '영국', countryCode: 'GB', type: 'airport' },
  // 동남아
  { code: 'SIN', nameKr: '싱가포르 창이', nameEn: 'Singapore Changi', country: '싱가포르', countryCode: 'SG', type: 'airport' },
  { code: 'SGSIN', nameKr: '싱가포르', nameEn: 'Singapore', country: '싱가포르', countryCode: 'SG', type: 'seaport' },
  { code: 'HKG', nameKr: '홍콩', nameEn: 'Hong Kong', country: '홍콩', countryCode: 'HK', type: 'airport' },
  { code: 'BKK', nameKr: '방콕 수완나품', nameEn: 'Bangkok Suvarnabhumi', country: '태국', countryCode: 'TH', type: 'airport' },
];

const typeConfig = {
  airport: { label: '공항', color: '#7C3AED', bgColor: '#EDE9FE' },
  seaport: { label: '항구', color: '#0284C7', bgColor: '#E0F2FE' },
  city: { label: '도시', color: '#059669', bgColor: '#D1FAE5' },
};

export default function LocationCodeModal({
  isOpen,
  onClose,
  onSelect,
  type,
}: LocationCodeModalProps) {
  const [searchType, setSearchType] = useState<'code' | 'name'>('name');
  const [searchText, setSearchText] = useState('');
  const [locType, setLocType] = useState(type || '');
  const [selectedItem, setSelectedItem] = useState<LocationItem | null>(null);

  const filteredData = useMemo(() => {
    return sampleLocations.filter(item => {
      // 유형 필터
      if (locType && item.type !== locType) return false;

      // 검색어 필터
      if (searchText) {
        if (searchType === 'code') {
          return item.code.toLowerCase().includes(searchText.toLowerCase());
        } else {
          return item.nameKr.includes(searchText) ||
                 item.nameEn.toLowerCase().includes(searchText.toLowerCase()) ||
                 item.country.includes(searchText);
        }
      }
      return true;
    });
  }, [searchText, searchType, locType]);

  const handleSelect = () => {
    if (selectedItem) {
      onSelect(selectedItem);
      onClose();
    }
  };

  const handleReset = () => {
    setSearchText('');
    setLocType('');
    setSelectedItem(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-50 rounded-lg shadow-xl w-[750px] max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-[#1A2744] rounded-t-lg">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            출발지/도착지 코드 조회
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 검색 조건 */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex gap-3 items-end">
            <div className="w-28">
              <label className="block text-xs font-medium text-gray-500 mb-1">기준</label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as 'code' | 'name')}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg"
              >
                <option value="name">지역명</option>
                <option value="code">코드</option>
              </select>
            </div>
            <div className="w-28">
              <label className="block text-xs font-medium text-gray-500 mb-1">유형</label>
              <select
                value={locType}
                onChange={(e) => setLocType(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg"
              >
                <option value="">전체</option>
                <option value="airport">공항</option>
                <option value="seaport">항구</option>
                <option value="city">도시</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {searchType === 'code' ? '코드' : '출발지/도착지명'}
              </label>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder={searchType === 'code' ? '예: ICN' : '예: 인천, Shanghai'}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="px-4 py-2 text-sm bg-white text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-100"
            >
              초기화
            </button>
          </div>
        </div>

        {/* 목록 */}
        <div className="flex-1 overflow-auto p-4">
          <div className="text-sm text-gray-500 mb-2">
            검색 결과: {filteredData.length}건
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="p-2 text-center font-medium w-24">코드</th>
                  <th className="p-2 text-left font-medium">지역명(한글)</th>
                  <th className="p-2 text-left font-medium">지역명(영문)</th>
                  <th className="p-2 text-center font-medium w-24">국가</th>
                  <th className="p-2 text-center font-medium w-20">유형</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      조회된 지역코드가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr
                      key={item.code}
                      className={`border-t border-gray-200 cursor-pointer ${
                        selectedItem?.code === item.code ? 'bg-blue-100' : 'bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedItem(item)}
                      onDoubleClick={() => { onSelect(item); onClose(); }}
                    >
                      <td className="p-2 text-center font-mono font-medium text-blue-600">{item.code}</td>
                      <td className="p-2 font-medium">{item.nameKr}</td>
                      <td className="p-2 text-gray-500">{item.nameEn}</td>
                      <td className="p-2 text-center">{item.country}</td>
                      <td className="p-2 text-center">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ color: typeConfig[item.type].color, backgroundColor: typeConfig[item.type].bgColor }}
                        >
                          {typeConfig[item.type].label}
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
        <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-50 text-gray-900 rounded-lg hover:bg-gray-100"
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
