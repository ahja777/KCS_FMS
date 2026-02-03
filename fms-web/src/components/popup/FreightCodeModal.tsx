'use client';

import { useState, useMemo } from 'react';
import { formatCurrency } from '@/utils/format';

export interface FreightCodeItem {
  id: string;
  freightCode: string;
  freightName: string;
  customer: string;
  customerCode: string;
  origin: string;
  originName: string;
  destination: string;
  destinationName: string;
  carrier?: string;
  carrierCode?: string;
  airline?: string;
  airlineCode?: string;
  validFrom: string;
  validTo: string;
  currency: string;
  rate: number;
  unit: string;
}

interface FreightCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: FreightCodeItem) => void;
  type: 'sea' | 'air';
}

// 샘플 해상 운임 데이터
const sampleSeaFreights: FreightCodeItem[] = [
  { id: '1', freightCode: 'SF001', freightName: 'Ocean Freight', customer: '삼성전자', customerCode: 'C001', origin: 'KRPUS', originName: '부산', destination: 'USLAX', destinationName: '로스앤젤레스', carrier: 'MAERSK', carrierCode: 'MAEU', validFrom: '2026-01-01', validTo: '2026-12-31', currency: 'USD', rate: 2500, unit: '20GP' },
  { id: '2', freightCode: 'SF002', freightName: 'Ocean Freight', customer: '삼성전자', customerCode: 'C001', origin: 'KRPUS', originName: '부산', destination: 'USLAX', destinationName: '로스앤젤레스', carrier: 'MAERSK', carrierCode: 'MAEU', validFrom: '2026-01-01', validTo: '2026-12-31', currency: 'USD', rate: 4500, unit: '40HC' },
  { id: '3', freightCode: 'SF003', freightName: 'Ocean Freight', customer: 'LG전자', customerCode: 'C002', origin: 'KRPUS', originName: '부산', destination: 'CNSHA', destinationName: '상해', carrier: 'COSCO', carrierCode: 'COSU', validFrom: '2026-01-01', validTo: '2026-06-30', currency: 'USD', rate: 800, unit: '20GP' },
  { id: '4', freightCode: 'SF004', freightName: 'Ocean Freight', customer: 'LG전자', customerCode: 'C002', origin: 'KRINC', originName: '인천', destination: 'DEHAM', destinationName: '함부르크', carrier: 'HMM', carrierCode: 'HDMU', validFrom: '2026-01-01', validTo: '2026-12-31', currency: 'USD', rate: 3200, unit: '40GP' },
  { id: '5', freightCode: 'SF005', freightName: 'THC', customer: '전체', customerCode: 'ALL', origin: 'KRPUS', originName: '부산', destination: '-', destinationName: '-', validFrom: '2026-01-01', validTo: '2026-12-31', currency: 'KRW', rate: 150000, unit: '20GP' },
];

// 샘플 항공 운임 데이터
const sampleAirFreights: FreightCodeItem[] = [
  { id: '1', freightCode: 'AF001', freightName: 'Air Freight', customer: '삼성전자', customerCode: 'C001', origin: 'ICN', originName: '인천', destination: 'JFK', destinationName: '뉴욕', airline: '대한항공', airlineCode: 'KE', validFrom: '2026-01-01', validTo: '2026-12-31', currency: 'USD', rate: 3.5, unit: 'kg' },
  { id: '2', freightCode: 'AF002', freightName: 'Air Freight', customer: '삼성전자', customerCode: 'C001', origin: 'ICN', originName: '인천', destination: 'FRA', destinationName: '프랑크푸르트', airline: '루프트한자', airlineCode: 'LH', validFrom: '2026-01-01', validTo: '2026-12-31', currency: 'USD', rate: 3.2, unit: 'kg' },
  { id: '3', freightCode: 'AF003', freightName: 'Air Freight', customer: 'LG전자', customerCode: 'C002', origin: 'ICN', originName: '인천', destination: 'SIN', destinationName: '싱가포르', airline: '싱가포르항공', airlineCode: 'SQ', validFrom: '2026-01-01', validTo: '2026-06-30', currency: 'USD', rate: 2.8, unit: 'kg' },
  { id: '4', freightCode: 'AF004', freightName: 'FSC', customer: '전체', customerCode: 'ALL', origin: 'ICN', originName: '인천', destination: '-', destinationName: '-', validFrom: '2026-01-01', validTo: '2026-03-31', currency: 'USD', rate: 0.5, unit: 'kg' },
];

export default function FreightCodeModal({
  isOpen,
  onClose,
  onSelect,
  type,
}: FreightCodeModalProps) {
  const [customer, setCustomer] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [carrier, setCarrier] = useState('');
  const [selectedItem, setSelectedItem] = useState<FreightCodeItem | null>(null);

  const data = type === 'sea' ? sampleSeaFreights : sampleAirFreights;

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (customer && !item.customer.includes(customer) && !item.customerCode.toLowerCase().includes(customer.toLowerCase())) return false;
      if (origin && !item.origin.toLowerCase().includes(origin.toLowerCase()) && !item.originName.includes(origin)) return false;
      if (destination && !item.destination.toLowerCase().includes(destination.toLowerCase()) && !item.destinationName.includes(destination)) return false;
      if (carrier) {
        if (type === 'sea' && !item.carrier?.includes(carrier) && !item.carrierCode?.toLowerCase().includes(carrier.toLowerCase())) return false;
        if (type === 'air' && !item.airline?.includes(carrier) && !item.airlineCode?.toLowerCase().includes(carrier.toLowerCase())) return false;
      }
      return true;
    });
  }, [data, customer, origin, destination, carrier, type]);

  const handleSelect = () => {
    if (selectedItem) {
      onSelect(selectedItem);
      onClose();
    }
  };

  const handleReset = () => {
    setCustomer('');
    setOrigin('');
    setDestination('');
    setCarrier('');
    setSelectedItem(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--surface-50)] rounded-lg shadow-xl w-[950px] max-h-[85vh] flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[#1A2744]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {type === 'sea' ? '운임코드 조회 (해상)' : '운임코드 조회 (항공)'}
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 검색 조건 */}
        <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-100)]">
          <div className="grid grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">거래처</label>
              <input
                type="text"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="거래처명/코드"
                className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">Origin</label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder={type === 'sea' ? '예: KRPUS' : '예: ICN'}
                className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">Destn</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder={type === 'sea' ? '예: USLAX' : '예: JFK'}
                className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">{type === 'sea' ? '선사' : '항공사'}</label>
              <input
                type="text"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder={type === 'sea' ? '예: MAERSK' : '예: KE'}
                className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
              />
            </div>
            <div className="flex items-end gap-2">
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
                  <th className="p-2 text-left font-medium w-20">코드</th>
                  <th className="p-2 text-left font-medium">운임명</th>
                  <th className="p-2 text-left font-medium">거래처</th>
                  <th className="p-2 text-center font-medium">Origin</th>
                  <th className="p-2 text-center font-medium">Destn</th>
                  <th className="p-2 text-center font-medium">{type === 'sea' ? '선사' : '항공사'}</th>
                  <th className="p-2 text-center font-medium">유효기간</th>
                  <th className="p-2 text-right font-medium">운임</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-[var(--muted)]">
                      조회된 운임코드가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr
                      key={item.id}
                      className={`border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer ${
                        selectedItem?.id === item.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedItem(item)}
                      onDoubleClick={() => { onSelect(item); onClose(); }}
                    >
                      <td className="p-2 font-mono text-blue-600">{item.freightCode}</td>
                      <td className="p-2 font-medium">{item.freightName}</td>
                      <td className="p-2">{item.customer}</td>
                      <td className="p-2 text-center">
                        <span className="font-medium">{item.origin}</span>
                        <span className="text-[var(--muted)] ml-1 text-xs">({item.originName})</span>
                      </td>
                      <td className="p-2 text-center">
                        <span className="font-medium">{item.destination}</span>
                        {item.destinationName !== '-' && (
                          <span className="text-[var(--muted)] ml-1 text-xs">({item.destinationName})</span>
                        )}
                      </td>
                      <td className="p-2 text-center">{type === 'sea' ? item.carrier || '-' : item.airline || '-'}</td>
                      <td className="p-2 text-center text-xs">
                        {item.validFrom} ~ {item.validTo}
                      </td>
                      <td className="p-2 text-right font-medium">
                        {formatCurrency(item.rate, item.currency)}/{item.unit}
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
