'use client';

import { useState, useMemo } from 'react';
import { formatCurrency } from '@/utils/format';

export interface QuoteItem {
  id: string;
  quoteNo: string;
  quoteDate: string;
  customer: string;
  customerCode: string;
  origin: string;
  originName: string;
  destination: string;
  destinationName: string;
  cargoType: string;
  weight: number;
  volume: number;
  status: 'Request' | 'Quoted' | 'Confirmed' | 'Expired' | 'Cancelled';
  validUntil: string;
  totalAmount: number;
  currency: string;
  transportType: 'sea' | 'air' | 'inland';
}

interface QuoteSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: QuoteItem) => void;
}

// 샘플 견적 데이터
const sampleQuotes: QuoteItem[] = [
  { id: '1', quoteNo: 'QT2026010001', quoteDate: '2026-01-20', customer: '삼성전자', customerCode: 'C001', origin: 'KRPUS', originName: '부산', destination: 'USLAX', destinationName: '로스앤젤레스', cargoType: '전자제품', weight: 5000, volume: 25, status: 'Quoted', validUntil: '2026-02-20', totalAmount: 12500, currency: 'USD', transportType: 'sea' },
  { id: '2', quoteNo: 'QT2026010002', quoteDate: '2026-01-21', customer: 'LG전자', customerCode: 'C002', origin: 'ICN', originName: '인천', destination: 'JFK', destinationName: '뉴욕', cargoType: '가전제품', weight: 500, volume: 3, status: 'Request', validUntil: '2026-02-21', totalAmount: 0, currency: 'USD', transportType: 'air' },
  { id: '3', quoteNo: 'QT2026010003', quoteDate: '2026-01-19', customer: '현대자동차', customerCode: 'C003', origin: 'KRINC', originName: '인천', destination: 'DEHAM', destinationName: '함부르크', cargoType: '자동차부품', weight: 8000, volume: 40, status: 'Confirmed', validUntil: '2026-02-19', totalAmount: 25600, currency: 'USD', transportType: 'sea' },
  { id: '4', quoteNo: 'QT2026010004', quoteDate: '2026-01-18', customer: 'SK하이닉스', customerCode: 'C004', origin: 'ICN', originName: '인천', destination: 'SIN', destinationName: '싱가포르', cargoType: '반도체', weight: 200, volume: 1, status: 'Expired', validUntil: '2026-01-18', totalAmount: 2800, currency: 'USD', transportType: 'air' },
  { id: '5', quoteNo: 'QT2026010005', quoteDate: '2026-01-22', customer: '포스코', customerCode: 'C005', origin: '서울', originName: '서울', destination: '부산', destinationName: '부산', cargoType: '철강재', weight: 20000, volume: 50, status: 'Quoted', validUntil: '2026-02-22', totalAmount: 3500000, currency: 'KRW', transportType: 'inland' },
];

const statusConfig = {
  Request: { label: '요청', color: '#6B7280', bgColor: '#F3F4F6' },
  Quoted: { label: '견적완료', color: '#D97706', bgColor: '#FEF3C7' },
  Confirmed: { label: '확정', color: '#059669', bgColor: '#D1FAE5' },
  Expired: { label: '만료', color: '#DC2626', bgColor: '#FEE2E2' },
  Cancelled: { label: '취소', color: '#6B7280', bgColor: '#F3F4F6' },
};

const transportTypeConfig = {
  sea: { label: '해상', color: '#0284C7', bgColor: '#E0F2FE' },
  air: { label: '항공', color: '#7C3AED', bgColor: '#EDE9FE' },
  inland: { label: '내륙', color: '#059669', bgColor: '#D1FAE5' },
};

export default function QuoteSearchModal({
  isOpen,
  onClose,
  onSelect,
}: QuoteSearchModalProps) {
  const [customer, setCustomer] = useState('');
  const [transporter, setTransporter] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [status, setStatus] = useState('');
  const [selectedItem, setSelectedItem] = useState<QuoteItem | null>(null);

  const filteredData = useMemo(() => {
    return sampleQuotes.filter(item => {
      if (customer && !item.customer.includes(customer) && !item.customerCode.toLowerCase().includes(customer.toLowerCase())) return false;
      if (status && item.status !== status) return false;
      if (dateFrom && item.quoteDate < dateFrom) return false;
      if (dateTo && item.quoteDate > dateTo) return false;
      return true;
    });
  }, [customer, status, dateFrom, dateTo]);

  const handleSelect = () => {
    if (selectedItem) {
      onSelect(selectedItem);
      onClose();
    }
  };

  const handleReset = () => {
    setCustomer('');
    setTransporter('');
    setWarehouse('');
    setDateFrom('');
    setDateTo('');
    setStatus('');
    setSelectedItem(null);
  };

  // 날짜 버튼 핸들러
  const setDateRange = (days: number) => {
    const today = new Date();
    const from = new Date();
    from.setDate(today.getDate() - days);
    setDateFrom(from.toISOString().split('T')[0]);
    setDateTo(today.toISOString().split('T')[0]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--surface-100)] rounded-lg shadow-xl w-[1000px] max-h-[85vh] flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[#1A2744] rounded-t-lg">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            견적의뢰 조회
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 검색 조건 */}
        <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-100)]">
          <div className="grid grid-cols-6 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">견적일자 *</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
                <span className="flex items-center text-[var(--muted)]">~</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">거래처</label>
              <input
                type="text"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">운송사</label>
              <input
                type="text"
                value={transporter}
                onChange={(e) => setTransporter(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">창고</label>
              <input
                type="text"
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">상태</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
              >
                <option value="">전체</option>
                <option value="Request">요청</option>
                <option value="Quoted">견적완료</option>
                <option value="Confirmed">확정</option>
                <option value="Expired">만료</option>
              </select>
            </div>
          </div>
          <div className="flex justify-between items-center mt-3">
            <div className="flex gap-1">
              <button onClick={() => setDateRange(7)} className="px-2 py-1 text-xs bg-[var(--surface-50)] border border-[var(--border)] rounded hover:bg-[var(--surface-200)]">1주일</button>
              <button onClick={() => setDateRange(30)} className="px-2 py-1 text-xs bg-[var(--surface-50)] border border-[var(--border)] rounded hover:bg-[var(--surface-200)]">1개월</button>
              <button onClick={() => setDateRange(90)} className="px-2 py-1 text-xs bg-[var(--surface-50)] border border-[var(--border)] rounded hover:bg-[var(--surface-200)]">3개월</button>
              <button onClick={() => setDateRange(180)} className="px-2 py-1 text-xs bg-[var(--surface-50)] border border-[var(--border)] rounded hover:bg-[var(--surface-200)]">6개월</button>
              <button onClick={() => setDateRange(365)} className="px-2 py-1 text-xs bg-[var(--surface-50)] border border-[var(--border)] rounded hover:bg-[var(--surface-200)]">1년</button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {}}
                className="px-4 py-1.5 text-sm bg-[#1A2744] text-white rounded-lg hover:bg-[#243354]"
              >
                조회
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-1.5 text-sm bg-[var(--surface-50)] text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
              >
                초기화
              </button>
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
              <thead className="bg-[var(--surface-100)]">
                <tr>
                  <th className="p-2 text-left font-medium">견적번호</th>
                  <th className="p-2 text-center font-medium">견적일</th>
                  <th className="p-2 text-left font-medium">거래처</th>
                  <th className="p-2 text-center font-medium">구분</th>
                  <th className="p-2 text-center font-medium">출발</th>
                  <th className="p-2 text-center font-medium">도착</th>
                  <th className="p-2 text-center font-medium">화물</th>
                  <th className="p-2 text-right font-medium">견적금액</th>
                  <th className="p-2 text-center font-medium">유효기간</th>
                  <th className="p-2 text-center font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-[var(--muted)]">
                      조회된 견적의뢰가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr
                      key={item.id}
                      className={`border-t border-[var(--border)] cursor-pointer ${
                        selectedItem?.id === item.id ? 'bg-blue-100' : 'bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedItem(item)}
                      onDoubleClick={() => { onSelect(item); onClose(); }}
                    >
                      <td className="p-2 font-medium text-blue-600">{item.quoteNo}</td>
                      <td className="p-2 text-center">{item.quoteDate}</td>
                      <td className="p-2">{item.customer}</td>
                      <td className="p-2 text-center">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ color: transportTypeConfig[item.transportType].color, backgroundColor: transportTypeConfig[item.transportType].bgColor }}
                        >
                          {transportTypeConfig[item.transportType].label}
                        </span>
                      </td>
                      <td className="p-2 text-center">{item.originName}</td>
                      <td className="p-2 text-center">{item.destinationName}</td>
                      <td className="p-2 text-center text-xs">{item.cargoType}</td>
                      <td className="p-2 text-right font-medium">
                        {item.totalAmount > 0 ? formatCurrency(item.totalAmount, item.currency) : '-'}
                      </td>
                      <td className="p-2 text-center text-xs">{item.validUntil}</td>
                      <td className="p-2 text-center">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ color: statusConfig[item.status]?.color, backgroundColor: statusConfig[item.status]?.bgColor }}
                        >
                          {statusConfig[item.status]?.label}
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
