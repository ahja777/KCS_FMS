// 공통 데이터 관리 유틸리티
// localStorage 기반 CRUD 작업 처리

export interface BaseItem {
  id: string;
  createdAt: string;
  updatedAt?: string;
  status: string;
}

// 데이터 저장소 키
export const STORAGE_KEYS = {
  SEA_QUOTES: 'fms_sea_quotes',
  AIR_QUOTES: 'fms_air_quotes',
  SEA_BOOKINGS: 'fms_sea_bookings',
  AIR_BOOKINGS: 'fms_air_bookings',
  SEA_BL: 'fms_sea_bl',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

// 모든 데이터 가져오기
export function getAll<T extends BaseItem>(key: StorageKey): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error getting data from ${key}:`, error);
    return [];
  }
}

// ID로 단일 데이터 가져오기
export function getById<T extends BaseItem>(key: StorageKey, id: string): T | null {
  const items = getAll<T>(key);
  return items.find(item => item.id === id) || null;
}

// 새 데이터 생성
export function create<T extends BaseItem>(key: StorageKey, item: Omit<T, 'id' | 'createdAt'>): T {
  const items = getAll<T>(key);
  const newItem = {
    ...item,
    id: generateId(),
    createdAt: new Date().toISOString(),
  } as T;
  items.unshift(newItem);
  localStorage.setItem(key, JSON.stringify(items));
  return newItem;
}

// 데이터 업데이트
export function update<T extends BaseItem>(key: StorageKey, id: string, updates: Partial<T>): T | null {
  const items = getAll<T>(key);
  const index = items.findIndex(item => item.id === id);
  if (index === -1) return null;

  items[index] = {
    ...items[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(key, JSON.stringify(items));
  return items[index];
}

// 데이터 삭제
export function remove(key: StorageKey, id: string): boolean {
  const items = getAll(key);
  const filteredItems = items.filter(item => item.id !== id);
  if (filteredItems.length === items.length) return false;
  localStorage.setItem(key, JSON.stringify(filteredItems));
  return true;
}

// 다중 삭제
export function removeMany(key: StorageKey, ids: string[]): number {
  const items = getAll(key);
  const filteredItems = items.filter(item => !ids.includes(item.id));
  const deletedCount = items.length - filteredItems.length;
  localStorage.setItem(key, JSON.stringify(filteredItems));
  return deletedCount;
}

// ID 생성
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// 문서번호 생성
export function generateDocNo(prefix: string): string {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `${prefix}-${year}-${seq}`;
}

// 테스트 데이터 초기화
export function initializeTestData(): void {
  // 해상 견적 테스트 데이터
  if (getAll(STORAGE_KEYS.SEA_QUOTES).length === 0) {
    const seaQuotes = [
      { id: 'sq1', quoteNo: 'SQ-2026-0001', quoteDate: '2026-01-15', shipper: '삼성전자', shipperCode: 'C001', consignee: 'Samsung America', pol: 'KRPUS', pod: 'USLGB', carrier: 'MAERSK', containerType: '40HC', containerQty: 2, freightAmount: 3500, currency: 'USD', validUntil: '2026-02-15', status: 'approved', createdAt: '2026-01-15T09:00:00Z' },
      { id: 'sq2', quoteNo: 'SQ-2026-0002', quoteDate: '2026-01-14', shipper: 'LG전자', shipperCode: 'C002', consignee: 'LG Europe', pol: 'KRPUS', pod: 'DEHAM', carrier: 'MSC', containerType: '40GP', containerQty: 3, freightAmount: 4200, currency: 'USD', validUntil: '2026-02-14', status: 'submitted', createdAt: '2026-01-14T10:00:00Z' },
      { id: 'sq3', quoteNo: 'SQ-2026-0003', quoteDate: '2026-01-13', shipper: '현대자동차', shipperCode: 'C003', consignee: 'Hyundai America', pol: 'KRINC', pod: 'USNYC', carrier: 'HMM', containerType: '45HC', containerQty: 5, freightAmount: 5800, currency: 'USD', validUntil: '2026-02-13', status: 'draft', createdAt: '2026-01-13T11:00:00Z' },
      { id: 'sq4', quoteNo: 'SQ-2026-0004', quoteDate: '2026-01-12', shipper: 'SK하이닉스', shipperCode: 'C004', consignee: 'SK America', pol: 'KRPUS', pod: 'USLGB', carrier: 'EVERGREEN', containerType: '40HC', containerQty: 4, freightAmount: 4500, currency: 'USD', validUntil: '2026-02-12', status: 'rejected', createdAt: '2026-01-12T14:00:00Z' },
      { id: 'sq5', quoteNo: 'SQ-2026-0005', quoteDate: '2026-01-11', shipper: '포스코', shipperCode: 'C005', consignee: 'POSCO Japan', pol: 'KRPUS', pod: 'JPTYO', carrier: 'ONE', containerType: '20GP', containerQty: 10, freightAmount: 8500, currency: 'USD', validUntil: '2026-02-11', status: 'approved', createdAt: '2026-01-11T08:00:00Z' },
    ];
    localStorage.setItem(STORAGE_KEYS.SEA_QUOTES, JSON.stringify(seaQuotes));
  }

  // 항공 견적 테스트 데이터
  if (getAll(STORAGE_KEYS.AIR_QUOTES).length === 0) {
    const airQuotes = [
      { id: 'aq1', quoteNo: 'AQ-2026-0001', quoteDate: '2026-01-15', shipper: '삼성전자', shipperCode: 'C001', consignee: 'Samsung America', origin: 'ICN', destination: 'JFK', airline: 'KOREAN AIR', pieces: 50, grossWeight: 500, chargeableWeight: 520, ratePerKg: 3.5, freightAmount: 1820, currency: 'USD', validUntil: '2026-02-15', status: 'approved', createdAt: '2026-01-15T09:00:00Z' },
      { id: 'aq2', quoteNo: 'AQ-2026-0002', quoteDate: '2026-01-14', shipper: 'SK하이닉스', shipperCode: 'C004', consignee: 'SK Hynix America', origin: 'ICN', destination: 'SFO', airline: 'ASIANA', pieces: 80, grossWeight: 800, chargeableWeight: 850, ratePerKg: 3.2, freightAmount: 2720, currency: 'USD', validUntil: '2026-02-14', status: 'submitted', createdAt: '2026-01-14T10:00:00Z' },
      { id: 'aq3', quoteNo: 'AQ-2026-0003', quoteDate: '2026-01-13', shipper: 'LG디스플레이', shipperCode: 'C006', consignee: 'LG Display EU', origin: 'ICN', destination: 'FRA', airline: 'LUFTHANSA', pieces: 35, grossWeight: 350, chargeableWeight: 380, ratePerKg: 4.0, freightAmount: 1520, currency: 'USD', validUntil: '2026-02-13', status: 'draft', createdAt: '2026-01-13T11:00:00Z' },
      { id: 'aq4', quoteNo: 'AQ-2026-0004', quoteDate: '2026-01-12', shipper: '현대자동차', shipperCode: 'C003', consignee: 'Hyundai EU', origin: 'ICN', destination: 'DXB', airline: 'EMIRATES', pieces: 60, grossWeight: 620, chargeableWeight: 650, ratePerKg: 3.8, freightAmount: 2470, currency: 'USD', validUntil: '2026-02-12', status: 'rejected', createdAt: '2026-01-12T14:00:00Z' },
    ];
    localStorage.setItem(STORAGE_KEYS.AIR_QUOTES, JSON.stringify(airQuotes));
  }

  // 해상 부킹 테스트 데이터
  if (getAll(STORAGE_KEYS.SEA_BOOKINGS).length === 0) {
    const seaBookings = [
      { id: 'sb1', bookingNo: 'SB-2026-0001', bookingDate: '2026-01-15', shipper: '삼성전자', consignee: 'Samsung America', carrier: 'MAERSK', vessel: 'MAERSK EINDHOVEN', voyage: '001E', pol: 'KRPUS', pod: 'USLGB', etd: '2026-01-20', eta: '2026-02-05', containerType: '40HC', containerQty: 2, grossWeight: 15000, status: 'confirmed', createdAt: '2026-01-15T09:00:00Z' },
      { id: 'sb2', bookingNo: 'SB-2026-0002', bookingDate: '2026-01-14', shipper: 'LG전자', consignee: 'LG Europe', carrier: 'MSC', vessel: 'MSC GULSUN', voyage: 'W002', pol: 'KRPUS', pod: 'DEHAM', etd: '2026-01-22', eta: '2026-02-15', containerType: '40GP', containerQty: 3, grossWeight: 24000, status: 'requested', createdAt: '2026-01-14T10:00:00Z' },
      { id: 'sb3', bookingNo: 'SB-2026-0003', bookingDate: '2026-01-13', shipper: '현대자동차', consignee: 'Hyundai America', carrier: 'HMM', vessel: 'HMM ALGECIRAS', voyage: '003S', pol: 'KRINC', pod: 'USNYC', etd: '2026-01-25', eta: '2026-02-20', containerType: '45HC', containerQty: 5, grossWeight: 45000, status: 'draft', createdAt: '2026-01-13T11:00:00Z' },
    ];
    localStorage.setItem(STORAGE_KEYS.SEA_BOOKINGS, JSON.stringify(seaBookings));
  }

  // 항공 부킹 테스트 데이터
  if (getAll(STORAGE_KEYS.AIR_BOOKINGS).length === 0) {
    const airBookings = [
      { id: 'ab1', bookingNo: 'AB-2026-0001', bookingDate: '2026-01-15', shipper: '삼성전자', consignee: 'Samsung America', airline: 'KOREAN AIR', flightNo: 'KE081', origin: 'ICN', destination: 'JFK', etd: '2026-01-18', eta: '2026-01-18', pieces: 50, grossWeight: 500, chargeableWeight: 520, status: 'confirmed', createdAt: '2026-01-15T09:00:00Z' },
      { id: 'ab2', bookingNo: 'AB-2026-0002', bookingDate: '2026-01-14', shipper: 'SK하이닉스', consignee: 'SK Hynix America', airline: 'ASIANA', flightNo: 'OZ212', origin: 'ICN', destination: 'SFO', etd: '2026-01-17', eta: '2026-01-17', pieces: 80, grossWeight: 800, chargeableWeight: 850, status: 'requested', createdAt: '2026-01-14T10:00:00Z' },
      { id: 'ab3', bookingNo: 'AB-2026-0003', bookingDate: '2026-01-13', shipper: 'LG디스플레이', consignee: 'LG Display EU', airline: 'LUFTHANSA', flightNo: 'LH713', origin: 'ICN', destination: 'FRA', etd: '2026-01-19', eta: '2026-01-19', pieces: 35, grossWeight: 350, chargeableWeight: 380, status: 'draft', createdAt: '2026-01-13T11:00:00Z' },
    ];
    localStorage.setItem(STORAGE_KEYS.AIR_BOOKINGS, JSON.stringify(airBookings));
  }

  // 수입 B/L 테스트 데이터
  if (getAll(STORAGE_KEYS.SEA_BL).length === 0) {
    const seaBL = [
      { id: 'bl1', blNo: 'MSKU1234567890', hblNo: 'HBL-2026-0001', mblNo: 'MBL-2026-0001', blDate: '2026-01-15', shipper: 'Samsung America', consignee: '삼성전자', notifyParty: '삼성전자', carrier: 'MAERSK', vessel: 'MAERSK EINDHOVEN', voyage: '001E', pol: 'USLAX', pod: 'KRPUS', etd: '2026-01-10', eta: '2026-01-25', containerType: '40HC', containerQty: 2, grossWeight: 15000, status: 'arrived', createdAt: '2026-01-15T09:00:00Z' },
      { id: 'bl2', blNo: 'MSCU9876543210', hblNo: 'HBL-2026-0002', mblNo: 'MBL-2026-0002', blDate: '2026-01-14', shipper: 'LG Europe', consignee: 'LG전자', notifyParty: 'LG전자', carrier: 'MSC', vessel: 'MSC GULSUN', voyage: 'W002', pol: 'DEHAM', pod: 'KRPUS', etd: '2026-01-08', eta: '2026-02-01', containerType: '40GP', containerQty: 3, grossWeight: 24000, status: 'in_transit', createdAt: '2026-01-14T10:00:00Z' },
      { id: 'bl3', blNo: 'HDMU5555666677', hblNo: 'HBL-2026-0003', mblNo: 'MBL-2026-0003', blDate: '2026-01-13', shipper: 'Hyundai America', consignee: '현대자동차', notifyParty: '현대자동차', carrier: 'HMM', vessel: 'HMM ALGECIRAS', voyage: '003S', pol: 'USNYC', pod: 'KRINC', etd: '2026-01-05', eta: '2026-01-28', containerType: '45HC', containerQty: 5, grossWeight: 45000, status: 'customs', createdAt: '2026-01-13T11:00:00Z' },
    ];
    localStorage.setItem(STORAGE_KEYS.SEA_BL, JSON.stringify(seaBL));
  }

  console.log('Test data initialized successfully');
}

// 브라우저 뒤로가기 핸들링을 위한 히스토리 관리
export function pushHistoryState(path: string): void {
  if (typeof window !== 'undefined') {
    window.history.pushState({ path }, '', path);
  }
}

// 상태 코드 매핑
export const STATUS_CONFIG = {
  draft: { label: '작성중', color: '#6B7280', bgColor: '#F3F4F6' },
  submitted: { label: '제출', color: '#2563EB', bgColor: '#DBEAFE' },
  requested: { label: '요청', color: '#2563EB', bgColor: '#DBEAFE' },
  approved: { label: '승인', color: '#059669', bgColor: '#D1FAE5' },
  confirmed: { label: '확정', color: '#059669', bgColor: '#D1FAE5' },
  rejected: { label: '반려', color: '#DC2626', bgColor: '#FEE2E2' },
  cancelled: { label: '취소', color: '#9CA3AF', bgColor: '#F3F4F6' },
  in_transit: { label: '운송중', color: '#F59E0B', bgColor: '#FEF3C7' },
  arrived: { label: '도착', color: '#059669', bgColor: '#D1FAE5' },
  customs: { label: '통관중', color: '#8B5CF6', bgColor: '#EDE9FE' },
};
