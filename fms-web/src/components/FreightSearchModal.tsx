'use client';

import { useState, useMemo } from 'react';
import { formatCurrency } from '@/utils/format';

// 해상 운임 데이터 타입
interface SeaFreight {
  id: string;
  carrier: string;
  carrierCode: string;
  pol: string;
  polName: string;
  pod: string;
  podName: string;
  containerType: '20GP' | '40GP' | '40HC' | 'LCL';
  oceanFreight: number;
  baf: number;
  caf: number;
  thc: number;
  doc: number;
  total: number;
  currency: string;
  validFrom: string;
  validTo: string;
  remark: string;
}

// 항공 운임 데이터 타입
interface AirFreight {
  id: string;
  airline: string;
  airlineCode: string;
  origin: string;
  originName: string;
  destination: string;
  destinationName: string;
  weightBreak: string;
  ratePerKg: number;
  fsc: number;
  ssc: number;
  handling: number;
  total: number;
  currency: string;
  validFrom: string;
  validTo: string;
  minCharge: number;
  remark: string;
}

interface FreightSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (freight: SeaFreight | AirFreight) => void;
  type: 'sea' | 'air';
  defaultOrigin?: string;
  defaultDestination?: string;
}

// 샘플 해상 운임 데이터
const sampleSeaFreights: SeaFreight[] = [
  { id: '1', carrier: 'MAERSK', carrierCode: 'MAEU', pol: 'CNSHA', polName: '상해', pod: 'KRPUS', podName: '부산', containerType: '20GP', oceanFreight: 800, baf: 50, caf: 30, thc: 120, doc: 50, total: 1050, currency: 'USD', validFrom: '2026-01-01', validTo: '2026-03-31', remark: 'FAK Rate' },
  { id: '2', carrier: 'MAERSK', carrierCode: 'MAEU', pol: 'CNSHA', polName: '상해', pod: 'KRPUS', podName: '부산', containerType: '40GP', oceanFreight: 1400, baf: 80, caf: 50, thc: 150, doc: 50, total: 1730, currency: 'USD', validFrom: '2026-01-01', validTo: '2026-03-31', remark: 'FAK Rate' },
  { id: '3', carrier: 'MAERSK', carrierCode: 'MAEU', pol: 'CNSHA', polName: '상해', pod: 'KRPUS', podName: '부산', containerType: '40HC', oceanFreight: 1500, baf: 80, caf: 50, thc: 150, doc: 50, total: 1830, currency: 'USD', validFrom: '2026-01-01', validTo: '2026-03-31', remark: 'FAK Rate' },
  { id: '4', carrier: 'MSC', carrierCode: 'MSCU', pol: 'CNSHA', polName: '상해', pod: 'KRPUS', podName: '부산', containerType: '20GP', oceanFreight: 750, baf: 50, caf: 25, thc: 110, doc: 45, total: 980, currency: 'USD', validFrom: '2026-01-01', validTo: '2026-03-31', remark: 'Special Rate' },
  { id: '5', carrier: 'MSC', carrierCode: 'MSCU', pol: 'CNSHA', polName: '상해', pod: 'KRPUS', podName: '부산', containerType: '40HC', oceanFreight: 1450, baf: 80, caf: 45, thc: 140, doc: 45, total: 1760, currency: 'USD', validFrom: '2026-01-01', validTo: '2026-03-31', remark: 'Special Rate' },
  { id: '6', carrier: 'EVERGREEN', carrierCode: 'EGLV', pol: 'CNNBO', polName: '닝보', pod: 'KRPUS', podName: '부산', containerType: '20GP', oceanFreight: 700, baf: 45, caf: 25, thc: 100, doc: 40, total: 910, currency: 'USD', validFrom: '2026-01-01', validTo: '2026-02-28', remark: '' },
  { id: '7', carrier: 'HMM', carrierCode: 'HDMU', pol: 'JPYOK', polName: '요코하마', pod: 'KRPUS', podName: '부산', containerType: '20GP', oceanFreight: 500, baf: 30, caf: 20, thc: 100, doc: 40, total: 690, currency: 'USD', validFrom: '2026-01-01', validTo: '2026-06-30', remark: '국적선 할인' },
  { id: '8', carrier: 'COSCO', carrierCode: 'COSU', pol: 'CNSHA', polName: '상해', pod: 'KRPUS', podName: '부산', containerType: 'LCL', oceanFreight: 45, baf: 5, caf: 3, thc: 15, doc: 30, total: 98, currency: 'USD', validFrom: '2026-01-01', validTo: '2026-03-31', remark: 'Per CBM' },
];

// 샘플 항공 운임 데이터
const sampleAirFreights: AirFreight[] = [
  { id: '1', airline: '대한항공', airlineCode: 'KE', origin: 'ICN', originName: '인천', destination: 'JFK', destinationName: '뉴욕', weightBreak: '-45kg', ratePerKg: 8.50, fsc: 1.20, ssc: 0.50, handling: 0.30, total: 10.50, currency: 'USD', validFrom: '2026-01-01', validTo: '2026-03-31', minCharge: 150, remark: '' },
  { id: '2', airline: '대한항공', airlineCode: 'KE', origin: 'ICN', originName: '인천', destination: 'JFK', destinationName: '뉴욕', weightBreak: '45-100kg', ratePerKg: 7.00, fsc: 1.20, ssc: 0.50, handling: 0.30, total: 9.00, currency: 'USD', validFrom: '2026-01-01', validTo: '2026-03-31', minCharge: 150, remark: '' },
  { id: '3', airline: '대한항공', airlineCode: 'KE', origin: 'ICN', originName: '인천', destination: 'JFK', destinationName: '뉴욕', weightBreak: '100-300kg', ratePerKg: 5.50, fsc: 1.20, ssc: 0.50, handling: 0.30, total: 7.50, currency: 'USD', validFrom: '2026-01-01', validTo: '2026-03-31', minCharge: 150, remark: '' },
  { id: '4', airline: '대한항공', airlineCode: 'KE', origin: 'ICN', originName: '인천', destination: 'JFK', destinationName: '뉴욕', weightBreak: '300-500kg', ratePerKg: 4.50, fsc: 1.20, ssc: 0.50, handling: 0.30, total: 6.50, currency: 'USD', validFrom: '2026-01-01', validTo: '2026-03-31', minCharge: 150, remark: '' },
  { id: '5', airline: '대한항공', airlineCode: 'KE', origin: 'ICN', originName: '인천', destination: 'JFK', destinationName: '뉴욕', weightBreak: '500kg+', ratePerKg: 3.80, fsc: 1.20, ssc: 0.50, handling: 0.30, total: 5.80, currency: 'USD', validFrom: '2026-01-01', validTo: '2026-03-31', minCharge: 150, remark: 'Volume Rate' },
  { id: '6', airline: '아시아나', airlineCode: 'OZ', origin: 'ICN', originName: '인천', destination: 'SFO', destinationName: '샌프란시스코', weightBreak: '-45kg', ratePerKg: 7.80, fsc: 1.10, ssc: 0.45, handling: 0.25, total: 9.60, currency: 'USD', validFrom: '2026-01-01', validTo: '2026-03-31', minCharge: 140, remark: '' },
  { id: '7', airline: '아시아나', airlineCode: 'OZ', origin: 'ICN', originName: '인천', destination: 'SFO', destinationName: '샌프란시스코', weightBreak: '100-300kg', ratePerKg: 5.20, fsc: 1.10, ssc: 0.45, handling: 0.25, total: 7.00, currency: 'USD', validFrom: '2026-01-01', validTo: '2026-03-31', minCharge: 140, remark: '' },
  { id: '8', airline: '루프트한자', airlineCode: 'LH', origin: 'ICN', originName: '인천', destination: 'FRA', destinationName: '프랑크푸르트', weightBreak: '-45kg', ratePerKg: 9.00, fsc: 1.50, ssc: 0.60, handling: 0.40, total: 11.50, currency: 'USD', validFrom: '2026-01-01', validTo: '2026-02-28', minCharge: 180, remark: '' },
  { id: '9', airline: '에미레이트', airlineCode: 'EK', origin: 'ICN', originName: '인천', destination: 'DXB', destinationName: '두바이', weightBreak: '100-300kg', ratePerKg: 4.00, fsc: 0.80, ssc: 0.30, handling: 0.20, total: 5.30, currency: 'USD', validFrom: '2026-01-01', validTo: '2026-06-30', minCharge: 120, remark: 'Special Promo' },
];

export default function FreightSearchModal({
  isOpen,
  onClose,
  onSelect,
  type,
  defaultOrigin = '',
  defaultDestination = '',
}: FreightSearchModalProps) {
  const [origin, setOrigin] = useState(defaultOrigin);
  const [destination, setDestination] = useState(defaultDestination);
  const [carrier, setCarrier] = useState('');
  const [containerType, setContainerType] = useState('');
  const [weightBreak, setWeightBreak] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 필터링된 운임 데이터
  const filteredFreights = useMemo(() => {
    if (type === 'sea') {
      return sampleSeaFreights.filter(f => {
        if (origin && !f.pol.toLowerCase().includes(origin.toLowerCase()) && !f.polName.includes(origin)) return false;
        if (destination && !f.pod.toLowerCase().includes(destination.toLowerCase()) && !f.podName.includes(destination)) return false;
        if (carrier && !f.carrier.toLowerCase().includes(carrier.toLowerCase()) && !f.carrierCode.toLowerCase().includes(carrier.toLowerCase())) return false;
        if (containerType && f.containerType !== containerType) return false;
        return true;
      });
    } else {
      return sampleAirFreights.filter(f => {
        if (origin && !f.origin.toLowerCase().includes(origin.toLowerCase()) && !f.originName.includes(origin)) return false;
        if (destination && !f.destination.toLowerCase().includes(destination.toLowerCase()) && !f.destinationName.includes(destination)) return false;
        if (carrier && !f.airline.includes(carrier) && !f.airlineCode.toLowerCase().includes(carrier.toLowerCase())) return false;
        if (weightBreak && f.weightBreak !== weightBreak) return false;
        return true;
      });
    }
  }, [type, origin, destination, carrier, containerType, weightBreak]);

  const handleSelect = () => {
    if (!selectedId) {
      alert('운임을 선택해주세요.');
      return;
    }
    const freight = type === 'sea'
      ? sampleSeaFreights.find(f => f.id === selectedId)
      : sampleAirFreights.find(f => f.id === selectedId);
    if (freight) {
      onSelect(freight);
      onClose();
    }
  };

  const handleReset = () => {
    setOrigin('');
    setDestination('');
    setCarrier('');
    setContainerType('');
    setWeightBreak('');
    setSelectedId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[950px] max-h-[85vh] flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {type === 'sea' ? '해상 운임 조회' : '항공 운임 조회'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 검색 조건 */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {type === 'sea' ? '선적항 (POL)' : '출발공항'}
              </label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder={type === 'sea' ? '예: CNSHA' : '예: ICN'}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {type === 'sea' ? '양하항 (POD)' : '도착공항'}
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder={type === 'sea' ? '예: KRPUS' : '예: JFK'}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {type === 'sea' ? '선사' : '항공사'}
              </label>
              <input
                type="text"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder={type === 'sea' ? '예: MAERSK' : '예: 대한항공'}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {type === 'sea' ? (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">컨테이너 타입</label>
                <select
                  value={containerType}
                  onChange={(e) => setContainerType(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">전체</option>
                  <option value="20GP">20GP</option>
                  <option value="40GP">40GP</option>
                  <option value="40HC">40HC</option>
                  <option value="LCL">LCL</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">중량구간</label>
                <select
                  value={weightBreak}
                  onChange={(e) => setWeightBreak(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">전체</option>
                  <option value="-45kg">-45kg</option>
                  <option value="45-100kg">45-100kg</option>
                  <option value="100-300kg">100-300kg</option>
                  <option value="300-500kg">300-500kg</option>
                  <option value="500kg+">500kg+</option>
                </select>
              </div>
            )}
            <div className="flex items-end">
              <div className="flex gap-2">
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
          </div>
        </div>

        {/* 운임 목록 */}
        <div className="flex-1 overflow-auto p-4">
          <div className="text-sm text-gray-500 mb-2">
            검색 결과: {filteredFreights.length}건
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                {type === 'sea' ? (
                  <tr>
                    <th className="w-10 p-2 text-center"></th>
                    <th className="p-2 text-left font-medium">선사</th>
                    <th className="p-2 text-left font-medium">POL</th>
                    <th className="p-2 text-left font-medium">POD</th>
                    <th className="p-2 text-center font-medium">Type</th>
                    <th className="p-2 text-right font-medium">O/F</th>
                    <th className="p-2 text-right font-medium">BAF</th>
                    <th className="p-2 text-right font-medium">CAF</th>
                    <th className="p-2 text-right font-medium">THC</th>
                    <th className="p-2 text-right font-medium">DOC</th>
                    <th className="p-2 text-right font-medium text-blue-600">Total</th>
                    <th className="p-2 text-center font-medium">유효기간</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="w-10 p-2 text-center"></th>
                    <th className="p-2 text-left font-medium">항공사</th>
                    <th className="p-2 text-left font-medium">출발</th>
                    <th className="p-2 text-left font-medium">도착</th>
                    <th className="p-2 text-center font-medium">중량구간</th>
                    <th className="p-2 text-right font-medium">Rate/kg</th>
                    <th className="p-2 text-right font-medium">FSC</th>
                    <th className="p-2 text-right font-medium">SSC</th>
                    <th className="p-2 text-right font-medium">Handling</th>
                    <th className="p-2 text-right font-medium text-blue-600">Total/kg</th>
                    <th className="p-2 text-right font-medium">Min Charge</th>
                    <th className="p-2 text-center font-medium">유효기간</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {filteredFreights.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-gray-500">
                      조회된 운임이 없습니다.
                    </td>
                  </tr>
                ) : type === 'sea' ? (
                  (filteredFreights as SeaFreight[]).map((f) => (
                    <tr
                      key={f.id}
                      className={`border-t border-gray-200 cursor-pointer ${
                        selectedId === f.id ? 'bg-blue-100' : 'bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedId(f.id)}
                    >
                      <td className="p-2 text-center">
                        <input
                          type="radio"
                          name="freight"
                          checked={selectedId === f.id}
                          onChange={() => setSelectedId(f.id)}
                        />
                      </td>
                      <td className="p-2">
                        <span className="font-medium">{f.carrier}</span>
                      </td>
                      <td className="p-2">
                        <span className="font-medium">{f.pol}</span>
                        <span className="text-gray-500 ml-1 text-xs">({f.polName})</span>
                      </td>
                      <td className="p-2">
                        <span className="font-medium">{f.pod}</span>
                        <span className="text-gray-500 ml-1 text-xs">({f.podName})</span>
                      </td>
                      <td className="p-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          f.containerType === 'LCL' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {f.containerType}
                        </span>
                      </td>
                      <td className="p-2 text-right">{formatCurrency(f.oceanFreight)}</td>
                      <td className="p-2 text-right text-gray-500">{formatCurrency(f.baf)}</td>
                      <td className="p-2 text-right text-gray-500">{formatCurrency(f.caf)}</td>
                      <td className="p-2 text-right text-gray-500">{formatCurrency(f.thc)}</td>
                      <td className="p-2 text-right text-gray-500">{formatCurrency(f.doc)}</td>
                      <td className="p-2 text-right font-bold text-blue-600">{formatCurrency(f.total, f.currency)}</td>
                      <td className="p-2 text-center text-xs">{f.validFrom} ~ {f.validTo}</td>
                    </tr>
                  ))
                ) : (
                  (filteredFreights as AirFreight[]).map((f) => (
                    <tr
                      key={f.id}
                      className={`border-t border-gray-200 cursor-pointer ${
                        selectedId === f.id ? 'bg-blue-100' : 'bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedId(f.id)}
                    >
                      <td className="p-2 text-center">
                        <input
                          type="radio"
                          name="freight"
                          checked={selectedId === f.id}
                          onChange={() => setSelectedId(f.id)}
                        />
                      </td>
                      <td className="p-2">
                        <span className="font-medium">{f.airline}</span>
                        <span className="text-gray-500 ml-1 text-xs">({f.airlineCode})</span>
                      </td>
                      <td className="p-2">
                        <span className="font-medium">{f.origin}</span>
                        <span className="text-gray-500 ml-1 text-xs">({f.originName})</span>
                      </td>
                      <td className="p-2">
                        <span className="font-medium">{f.destination}</span>
                        <span className="text-gray-500 ml-1 text-xs">({f.destinationName})</span>
                      </td>
                      <td className="p-2 text-center">
                        <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-medium">
                          {f.weightBreak}
                        </span>
                      </td>
                      <td className="p-2 text-right">{formatCurrency(f.ratePerKg)}</td>
                      <td className="p-2 text-right text-gray-500">{formatCurrency(f.fsc)}</td>
                      <td className="p-2 text-right text-gray-500">{formatCurrency(f.ssc)}</td>
                      <td className="p-2 text-right text-gray-500">{formatCurrency(f.handling)}</td>
                      <td className="p-2 text-right font-bold text-blue-600">{formatCurrency(f.total)} {f.currency}</td>
                      <td className="p-2 text-right">{formatCurrency(f.minCharge)}</td>
                      <td className="p-2 text-center text-xs">{f.validFrom} ~ {f.validTo}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 운임 범례 */}
          <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
            <div className="font-medium mb-1">용어 설명:</div>
            {type === 'sea' ? (
              <div className="grid grid-cols-5 gap-2">
                <span><strong>O/F</strong>: Ocean Freight (해상운임)</span>
                <span><strong>BAF</strong>: Bunker Adjustment Factor (유류할증료)</span>
                <span><strong>CAF</strong>: Currency Adjustment Factor (환율할증료)</span>
                <span><strong>THC</strong>: Terminal Handling Charge (터미널 처리비)</span>
                <span><strong>DOC</strong>: Documentation Fee (서류비)</span>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                <span><strong>Rate/kg</strong>: 기본 운임 (kg당)</span>
                <span><strong>FSC</strong>: Fuel Surcharge (유류할증료)</span>
                <span><strong>SSC</strong>: Security Surcharge (보안할증료)</span>
                <span><strong>Min Charge</strong>: 최소 운임</span>
              </div>
            )}
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-50 text-gray-900 rounded-lg hover:bg-gray-100"
          >
            취소
          </button>
          <button
            onClick={handleSelect}
            disabled={!selectedId}
            className="px-4 py-2 bg-[#E8A838] text-[#0C1222] font-semibold rounded-lg hover:bg-[#D4943A] disabled:opacity-50"
          >
            선택
          </button>
        </div>
      </div>
    </div>
  );
}
