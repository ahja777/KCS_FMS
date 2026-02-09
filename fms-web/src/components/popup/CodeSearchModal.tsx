'use client';

import { useState, useMemo } from 'react';

// 코드 데이터 타입
export interface CodeItem {
  code: string;
  name: string;
  nameKr?: string;
  nameEn?: string;
  category?: string;
  useYn?: 'Y' | 'N';
  extra?: Record<string, string>;
}

// 코드 타입별 설정
export type CodeType =
  | 'customer'      // 거래처
  | 'manager'       // 담당자
  | 'airport'       // 공항
  | 'seaport'       // 항구
  | 'carrier'       // 선사
  | 'airline'       // 항공사
  | 'customs'       // 세관
  | 'freightBase'   // 운임기초정보
  | 'containerType' // 컨테이너종류
  | 'currency'      // 통화단위
  | 'specialCargo'  // 특수화물
  | 'commodity'     // 품목
  | 'bankAccount'   // 은행계정과목
  | 'country'       // 국가
  | 'region'        // 지역
  | 'forwarder'     // 포워더
  | 'document';     // 문서

interface CodeConfig {
  title: string;
  searchPlaceholder: string;
  columns: { key: string; label: string; width?: string }[];
  filterOptions?: { label: string; value: string }[];
}

const codeConfigs: Record<CodeType, CodeConfig> = {
  customer: {
    title: '거래처코드 조회',
    searchPlaceholder: '거래처코드 또는 거래처명 검색',
    columns: [
      { key: 'code', label: '거래처코드', width: '120px' },
      { key: 'name', label: '거래처명' },
      { key: 'category', label: '구분', width: '100px' },
    ],
    filterOptions: [
      { label: '전체', value: '' },
      { label: '화주', value: 'shipper' },
      { label: '운송사', value: 'carrier' },
      { label: '창고', value: 'warehouse' },
    ],
  },
  manager: {
    title: '담당자코드 조회',
    searchPlaceholder: '담당자코드 또는 담당자명 검색',
    columns: [
      { key: 'code', label: '담당자코드', width: '120px' },
      { key: 'name', label: '담당자명' },
      { key: 'extra.dept', label: '부서', width: '120px' },
    ],
  },
  airport: {
    title: '공항코드 조회',
    searchPlaceholder: '공항코드 또는 공항명 검색',
    columns: [
      { key: 'code', label: '공항코드', width: '100px' },
      { key: 'name', label: '공항명(한글)' },
      { key: 'nameEn', label: '공항명(영문)' },
      { key: 'extra.country', label: '국가', width: '100px' },
    ],
    filterOptions: [
      { label: '전체', value: '' },
      { label: '사용', value: 'Y' },
      { label: '미사용', value: 'N' },
    ],
  },
  seaport: {
    title: '항구코드 조회',
    searchPlaceholder: '항구코드 또는 항구명 검색',
    columns: [
      { key: 'code', label: '항구코드', width: '100px' },
      { key: 'name', label: '항구명(한글)' },
      { key: 'nameEn', label: '항구명(영문)' },
      { key: 'extra.country', label: '국가', width: '100px' },
    ],
    filterOptions: [
      { label: '전체', value: '' },
      { label: '사용', value: 'Y' },
      { label: '미사용', value: 'N' },
    ],
  },
  carrier: {
    title: '선사코드 조회',
    searchPlaceholder: '선사코드 또는 선사명 검색',
    columns: [
      { key: 'code', label: '선사코드', width: '100px' },
      { key: 'name', label: '선사명' },
      { key: 'nameEn', label: '영문명' },
    ],
    filterOptions: [
      { label: '전체', value: '' },
      { label: '대형선사', value: 'major' },
      { label: '중소선사', value: 'minor' },
    ],
  },
  airline: {
    title: '항공사코드 조회',
    searchPlaceholder: '항공사코드 또는 항공사명 검색',
    columns: [
      { key: 'code', label: '항공사코드', width: '100px' },
      { key: 'name', label: '항공사명' },
      { key: 'nameEn', label: '영문명' },
    ],
    filterOptions: [
      { label: '전체', value: '' },
      { label: '국내', value: 'domestic' },
      { label: '국제', value: 'international' },
    ],
  },
  customs: {
    title: '세관코드 조회',
    searchPlaceholder: '세관코드 또는 세관명 검색',
    columns: [
      { key: 'code', label: '세관코드', width: '100px' },
      { key: 'name', label: '세관명' },
      { key: 'extra.region', label: '관할지역' },
    ],
  },
  freightBase: {
    title: '운임기초정보코드 조회',
    searchPlaceholder: '운임코드 또는 운임명 검색',
    columns: [
      { key: 'code', label: '운임코드', width: '100px' },
      { key: 'name', label: '운임명' },
      { key: 'category', label: '구분', width: '100px' },
    ],
  },
  containerType: {
    title: '컨테이너종류코드 조회',
    searchPlaceholder: '컨테이너코드 또는 명칭 검색',
    columns: [
      { key: 'code', label: '컨테이너코드', width: '120px' },
      { key: 'name', label: '컨테이너명' },
      { key: 'extra.size', label: '사이즈', width: '80px' },
    ],
  },
  currency: {
    title: '통화단위코드 조회',
    searchPlaceholder: '통화코드 또는 통화명 검색',
    columns: [
      { key: 'code', label: '통화코드', width: '100px' },
      { key: 'name', label: '통화명' },
      { key: 'extra.symbol', label: '기호', width: '60px' },
    ],
  },
  specialCargo: {
    title: '특수화물코드 조회',
    searchPlaceholder: '특수화물코드 또는 명칭 검색',
    columns: [
      { key: 'code', label: '코드', width: '100px' },
      { key: 'name', label: '특수화물명' },
      { key: 'nameEn', label: '영문명' },
    ],
  },
  commodity: {
    title: '품목코드 조회',
    searchPlaceholder: '품목코드 또는 품목명 검색',
    columns: [
      { key: 'code', label: '품목코드', width: '100px' },
      { key: 'name', label: '품목명' },
      { key: 'category', label: '분류', width: '100px' },
    ],
  },
  bankAccount: {
    title: '은행계정과목코드 조회',
    searchPlaceholder: '계정코드 또는 계정명 검색',
    columns: [
      { key: 'code', label: '계정코드', width: '100px' },
      { key: 'name', label: '계정과목명' },
      { key: 'category', label: '구분', width: '100px' },
    ],
  },
  country: {
    title: '국가코드 조회',
    searchPlaceholder: '국가코드 또는 국가명 검색',
    columns: [
      { key: 'code', label: '국가코드', width: '100px' },
      { key: 'name', label: '국가명(한글)' },
      { key: 'nameEn', label: '국가명(영문)' },
    ],
  },
  region: {
    title: '지역코드 조회',
    searchPlaceholder: '지역코드 또는 지역명 검색',
    columns: [
      { key: 'code', label: '지역코드', width: '100px' },
      { key: 'name', label: '지역명' },
      { key: 'extra.country', label: '국가', width: '100px' },
    ],
  },
  forwarder: {
    title: '포워더코드 조회',
    searchPlaceholder: '포워더코드 또는 포워더명 검색',
    columns: [
      { key: 'code', label: '포워더코드', width: '120px' },
      { key: 'name', label: '포워더명' },
      { key: 'nameEn', label: '영문명' },
    ],
    filterOptions: [
      { label: '전체', value: '' },
      { label: '국내', value: 'domestic' },
      { label: '해외', value: 'overseas' },
    ],
  },
  document: {
    title: '문서번호 조회',
    searchPlaceholder: 'B/L번호 또는 문서번호 검색',
    columns: [
      { key: 'code', label: '문서번호', width: '150px' },
      { key: 'name', label: '문서유형' },
      { key: 'category', label: '구분', width: '100px' },
    ],
    filterOptions: [
      { label: '전체', value: '' },
      { label: 'M B/L', value: 'mbl' },
      { label: 'H B/L', value: 'hbl' },
      { label: 'MAWB', value: 'mawb' },
      { label: 'HAWB', value: 'hawb' },
    ],
  },
};

// 샘플 데이터
const sampleData: Record<CodeType, CodeItem[]> = {
  customer: [
    { code: 'C001', name: '삼성전자', category: 'shipper', useYn: 'Y' },
    { code: 'C002', name: 'LG전자', category: 'shipper', useYn: 'Y' },
    { code: 'C003', name: '현대자동차', category: 'shipper', useYn: 'Y' },
    { code: 'C004', name: '한진해운', category: 'carrier', useYn: 'Y' },
    { code: 'C005', name: '범한물류', category: 'warehouse', useYn: 'Y' },
  ],
  manager: [
    { code: 'M001', name: '김철수', extra: { dept: '영업1팀' } },
    { code: 'M002', name: '이영희', extra: { dept: '영업2팀' } },
    { code: 'M003', name: '박지성', extra: { dept: '운영팀' } },
  ],
  airport: [
    { code: 'ICN', name: '인천국제공항', nameEn: 'Incheon Intl', extra: { country: '대한민국' }, useYn: 'Y' },
    { code: 'GMP', name: '김포국제공항', nameEn: 'Gimpo Intl', extra: { country: '대한민국' }, useYn: 'Y' },
    { code: 'NRT', name: '나리타공항', nameEn: 'Narita Intl', extra: { country: '일본' }, useYn: 'Y' },
    { code: 'HND', name: '하네다공항', nameEn: 'Haneda', extra: { country: '일본' }, useYn: 'Y' },
    { code: 'PVG', name: '푸동국제공항', nameEn: 'Shanghai Pudong', extra: { country: '중국' }, useYn: 'Y' },
    { code: 'HKG', name: '홍콩국제공항', nameEn: 'Hong Kong Intl', extra: { country: '홍콩' }, useYn: 'Y' },
    { code: 'SIN', name: '창이공항', nameEn: 'Singapore Changi', extra: { country: '싱가포르' }, useYn: 'Y' },
    { code: 'LAX', name: '로스앤젤레스공항', nameEn: 'Los Angeles Intl', extra: { country: '미국' }, useYn: 'Y' },
    { code: 'JFK', name: '존에프케네디공항', nameEn: 'John F Kennedy', extra: { country: '미국' }, useYn: 'Y' },
    { code: 'FRA', name: '프랑크푸르트공항', nameEn: 'Frankfurt', extra: { country: '독일' }, useYn: 'Y' },
  ],
  seaport: [
    { code: 'KRPUS', name: '부산항', nameEn: 'Busan', extra: { country: '대한민국' }, useYn: 'Y' },
    { code: 'KRINC', name: '인천항', nameEn: 'Incheon', extra: { country: '대한민국' }, useYn: 'Y' },
    { code: 'CNSHA', name: '상해항', nameEn: 'Shanghai', extra: { country: '중국' }, useYn: 'Y' },
    { code: 'CNNBO', name: '닝보항', nameEn: 'Ningbo', extra: { country: '중국' }, useYn: 'Y' },
    { code: 'JPYOK', name: '요코하마항', nameEn: 'Yokohama', extra: { country: '일본' }, useYn: 'Y' },
    { code: 'JPTYO', name: '도쿄항', nameEn: 'Tokyo', extra: { country: '일본' }, useYn: 'Y' },
    { code: 'SGSIN', name: '싱가포르항', nameEn: 'Singapore', extra: { country: '싱가포르' }, useYn: 'Y' },
    { code: 'USLA', name: '로스앤젤레스항', nameEn: 'Los Angeles', extra: { country: '미국' }, useYn: 'Y' },
    { code: 'USLGB', name: '롱비치항', nameEn: 'Long Beach', extra: { country: '미국' }, useYn: 'Y' },
    { code: 'DEHAM', name: '함부르크항', nameEn: 'Hamburg', extra: { country: '독일' }, useYn: 'Y' },
    { code: 'NLRTM', name: '로테르담항', nameEn: 'Rotterdam', extra: { country: '네덜란드' }, useYn: 'Y' },
  ],
  carrier: [
    { code: 'MAEU', name: 'MAERSK', nameEn: 'Maersk Line', category: 'major' },
    { code: 'MSCU', name: 'MSC', nameEn: 'Mediterranean Shipping', category: 'major' },
    { code: 'COSU', name: 'COSCO', nameEn: 'COSCO Shipping', category: 'major' },
    { code: 'EGLV', name: 'EVERGREEN', nameEn: 'Evergreen Line', category: 'major' },
    { code: 'ONEY', name: 'ONE', nameEn: 'Ocean Network Express', category: 'major' },
    { code: 'HDMU', name: 'HMM', nameEn: 'Hyundai Merchant Marine', category: 'major' },
    { code: 'HLCU', name: 'HAPAG-LLOYD', nameEn: 'Hapag-Lloyd', category: 'major' },
    { code: 'YMLU', name: 'YANG MING', nameEn: 'Yang Ming Marine', category: 'major' },
  ],
  airline: [
    { code: 'KE', name: '대한항공', nameEn: 'Korean Air', category: 'domestic' },
    { code: 'OZ', name: '아시아나항공', nameEn: 'Asiana Airlines', category: 'domestic' },
    { code: 'JL', name: '일본항공', nameEn: 'Japan Airlines', category: 'international' },
    { code: 'NH', name: '전일본공수', nameEn: 'All Nippon Airways', category: 'international' },
    { code: 'CX', name: '캐세이퍼시픽', nameEn: 'Cathay Pacific', category: 'international' },
    { code: 'SQ', name: '싱가포르항공', nameEn: 'Singapore Airlines', category: 'international' },
    { code: 'EK', name: '에미레이트', nameEn: 'Emirates', category: 'international' },
    { code: 'LH', name: '루프트한자', nameEn: 'Lufthansa', category: 'international' },
  ],
  customs: [
    { code: '020', name: '인천세관', extra: { region: '인천/경기' } },
    { code: '030', name: '서울세관', extra: { region: '서울' } },
    { code: '050', name: '부산세관', extra: { region: '부산/경남' } },
    { code: '060', name: '대구세관', extra: { region: '대구/경북' } },
  ],
  freightBase: [
    { code: 'OFT', name: 'Ocean Freight', category: '해상' },
    { code: 'AFT', name: 'Air Freight', category: '항공' },
    { code: 'THC', name: 'Terminal Handling Charge', category: '해상' },
    { code: 'FSC', name: 'Fuel Surcharge', category: '공통' },
    { code: 'SSC', name: 'Security Surcharge', category: '공통' },
  ],
  containerType: [
    { code: '20GP', name: '20피트 일반', extra: { size: '20ft' } },
    { code: '40GP', name: '40피트 일반', extra: { size: '40ft' } },
    { code: '40HC', name: '40피트 하이큐브', extra: { size: '40ft' } },
    { code: '20RF', name: '20피트 냉동', extra: { size: '20ft' } },
    { code: '40RF', name: '40피트 냉동', extra: { size: '40ft' } },
    { code: '20OT', name: '20피트 오픈탑', extra: { size: '20ft' } },
    { code: '40OT', name: '40피트 오픈탑', extra: { size: '40ft' } },
  ],
  currency: [
    { code: 'KRW', name: '대한민국 원', extra: { symbol: '₩' } },
    { code: 'USD', name: '미국 달러', extra: { symbol: '$' } },
    { code: 'EUR', name: '유로', extra: { symbol: '€' } },
    { code: 'JPY', name: '일본 엔', extra: { symbol: '¥' } },
    { code: 'CNY', name: '중국 위안', extra: { symbol: '¥' } },
    { code: 'GBP', name: '영국 파운드', extra: { symbol: '£' } },
  ],
  specialCargo: [
    { code: 'DG', name: '위험물', nameEn: 'Dangerous Goods' },
    { code: 'RF', name: '냉동화물', nameEn: 'Refrigerated' },
    { code: 'OOG', name: '규격외화물', nameEn: 'Out of Gauge' },
    { code: 'HVY', name: '중량화물', nameEn: 'Heavy Cargo' },
    { code: 'VAL', name: '고가화물', nameEn: 'Valuable Cargo' },
    { code: 'AWK', name: '취급주의', nameEn: 'Awkward Cargo' },
  ],
  commodity: [
    { code: 'ELEC', name: '전자제품', category: '제조업' },
    { code: 'AUTO', name: '자동차부품', category: '제조업' },
    { code: 'FOOD', name: '식품', category: '농업' },
    { code: 'CHEM', name: '화학제품', category: '제조업' },
    { code: 'TEXT', name: '섬유제품', category: '제조업' },
  ],
  bankAccount: [
    { code: '1110', name: '보통예금', category: '자산' },
    { code: '1120', name: '당좌예금', category: '자산' },
    { code: '4100', name: '매출', category: '수익' },
    { code: '5100', name: '매입', category: '비용' },
  ],
  country: [
    { code: 'KR', name: '대한민국', nameEn: 'Korea, Republic of' },
    { code: 'US', name: '미국', nameEn: 'United States' },
    { code: 'CN', name: '중국', nameEn: 'China' },
    { code: 'JP', name: '일본', nameEn: 'Japan' },
    { code: 'DE', name: '독일', nameEn: 'Germany' },
    { code: 'SG', name: '싱가포르', nameEn: 'Singapore' },
    { code: 'HK', name: '홍콩', nameEn: 'Hong Kong' },
    { code: 'TW', name: '대만', nameEn: 'Taiwan' },
    { code: 'VN', name: '베트남', nameEn: 'Vietnam' },
    { code: 'TH', name: '태국', nameEn: 'Thailand' },
  ],
  region: [
    { code: 'ASIA', name: '아시아', extra: { country: '전체' } },
    { code: 'EUR', name: '유럽', extra: { country: '전체' } },
    { code: 'NAM', name: '북미', extra: { country: '전체' } },
    { code: 'SAM', name: '남미', extra: { country: '전체' } },
  ],
  forwarder: [
    { code: 'FW001', name: '한진해운', nameEn: 'Hanjin Shipping', category: 'domestic' },
    { code: 'FW002', name: '현대글로비스', nameEn: 'Hyundai Glovis', category: 'domestic' },
    { code: 'FW003', name: '범한물류', nameEn: 'Pan Korea', category: 'domestic' },
    { code: 'FW004', name: 'DHL', nameEn: 'DHL Express', category: 'overseas' },
    { code: 'FW005', name: 'Kuehne+Nagel', nameEn: 'Kuehne+Nagel', category: 'overseas' },
  ],
  document: [
    { code: 'MBL2026010001', name: 'Master B/L', category: 'mbl' },
    { code: 'MBL2026010002', name: 'Master B/L', category: 'mbl' },
    { code: 'HBL2026010001', name: 'House B/L', category: 'hbl' },
    { code: 'HBL2026010002', name: 'House B/L', category: 'hbl' },
    { code: 'MAWB2026010001', name: 'Master AWB', category: 'mawb' },
    { code: 'HAWB2026010001', name: 'House AWB', category: 'hawb' },
  ],
};

interface CodeSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: CodeItem) => void;
  codeType: CodeType;
  title?: string;
}

export default function CodeSearchModal({
  isOpen,
  onClose,
  onSelect,
  codeType,
  title,
}: CodeSearchModalProps) {
  const [searchText, setSearchText] = useState('');
  const [filter, setFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState<CodeItem | null>(null);

  const config = codeConfigs[codeType];
  const data = sampleData[codeType] || [];

  const filteredData = useMemo(() => {
    return data.filter(item => {
      // 텍스트 검색
      const searchMatch = !searchText ||
        item.code.toLowerCase().includes(searchText.toLowerCase()) ||
        item.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (item.nameEn && item.nameEn.toLowerCase().includes(searchText.toLowerCase()));

      // 필터 적용
      const filterMatch = !filter ||
        item.category === filter ||
        item.useYn === filter;

      return searchMatch && filterMatch;
    });
  }, [data, searchText, filter]);

  const handleSelect = () => {
    if (selectedItem) {
      onSelect(selectedItem);
      onClose();
    }
  };

  const handleReset = () => {
    setSearchText('');
    setFilter('');
    setSelectedItem(null);
  };

  const handleRowClick = (item: CodeItem) => {
    setSelectedItem(item);
  };

  const handleRowDoubleClick = (item: CodeItem) => {
    onSelect(item);
    onClose();
  };

  const getNestedValue = (obj: CodeItem, path: string): string => {
    const parts = path.split('.');
    let value: unknown = obj;
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = (value as Record<string, unknown>)[part];
      } else {
        return '';
      }
    }
    return String(value || '');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--surface-100)] rounded-lg shadow-xl w-[700px] max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[#1A2744] rounded-t-lg">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {title || config.title}
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 검색 조건 */}
        <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-100)]">
          <div className="flex gap-3">
            {config.filterOptions && (
              <div className="w-32">
                <label className="block text-xs font-medium text-[var(--muted)] mb-1">구분</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                >
                  {config.filterOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex-1">
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">검색어</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder={config.searchPlaceholder}
                  className="flex-1 px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleSelect()}
                />
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm bg-[var(--surface-50)] text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
                >
                  초기화
                </button>
              </div>
            </div>
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
                  {config.columns.map(col => (
                    <th
                      key={col.key}
                      className="p-2 text-left font-medium text-[var(--foreground)]"
                      style={{ width: col.width }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={config.columns.length} className="p-8 text-center text-[var(--muted)]">
                      조회된 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr
                      key={item.code}
                      className={`border-t border-[var(--border)] hover:bg-[var(--surface-100)] cursor-pointer ${
                        selectedItem?.code === item.code ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleRowClick(item)}
                      onDoubleClick={() => handleRowDoubleClick(item)}
                    >
                      {config.columns.map(col => (
                        <td key={col.key} className="p-2">
                          {getNestedValue(item, col.key)}
                        </td>
                      ))}
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
