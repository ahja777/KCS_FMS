'use client';

import { useState, useMemo } from 'react';
import LocationCodeModal, { type LocationItem } from '@/components/popup/LocationCodeModal';
import AirlineCodeModal, { type AirlineItem } from '@/components/popup/AirlineCodeModal';
import CarrierCodeModal, { type CarrierItem } from '@/components/popup/CarrierCodeModal';

// 해상 스케줄 데이터 타입
interface SeaSchedule {
  id: string;
  carrier: string;
  carrierCode: string;
  vesselName: string;
  voyageNo: string;
  pol: string;
  polName: string;
  pod: string;
  podName: string;
  etd: string;
  eta: string;
  transitTime: number;
  space: 'Available' | 'Limited' | 'Full';
  cutOffDate: string;
}

// 항공 스케줄 데이터 타입
interface AirSchedule {
  id: string;
  airline: string;
  airlineCode: string;
  flightNo: string;
  origin: string;
  originName: string;
  destination: string;
  destinationName: string;
  etd: string;
  eta: string;
  transitTime: number;
  frequency: string;
  space: 'Available' | 'Limited' | 'Full';
}

interface ScheduleSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (schedule: SeaSchedule | AirSchedule) => void;
  type: 'sea' | 'air';
  defaultOrigin?: string;
  defaultDestination?: string;
}

// 샘플 해상 스케줄 데이터
const sampleSeaSchedules: SeaSchedule[] = [
  { id: '1', carrier: 'MAERSK', carrierCode: 'MAEU', vesselName: 'MAERSK EINDHOVEN', voyageNo: 'V.001E', pol: 'CNSHA', polName: '상해', pod: 'KRPUS', podName: '부산', etd: '2026-01-25', eta: '2026-01-28', transitTime: 3, space: 'Available', cutOffDate: '2026-01-23' },
  { id: '2', carrier: 'MSC', carrierCode: 'MSCU', vesselName: 'MSC OSCAR', voyageNo: 'V.002W', pol: 'CNSHA', polName: '상해', pod: 'KRPUS', podName: '부산', etd: '2026-01-26', eta: '2026-01-29', transitTime: 3, space: 'Limited', cutOffDate: '2026-01-24' },
  { id: '3', carrier: 'EVERGREEN', carrierCode: 'EGLV', vesselName: 'EVER GOODS', voyageNo: 'V.003E', pol: 'CNSHA', polName: '상해', pod: 'KRPUS', podName: '부산', etd: '2026-01-27', eta: '2026-01-30', transitTime: 3, space: 'Available', cutOffDate: '2026-01-25' },
  { id: '4', carrier: 'COSCO', carrierCode: 'COSU', vesselName: 'COSCO FORTUNE', voyageNo: 'V.004N', pol: 'CNNBO', polName: '닝보', pod: 'KRPUS', podName: '부산', etd: '2026-01-25', eta: '2026-01-27', transitTime: 2, space: 'Available', cutOffDate: '2026-01-23' },
  { id: '5', carrier: 'HMM', carrierCode: 'HDMU', vesselName: 'HMM ALGECIRAS', voyageNo: 'V.005S', pol: 'JPYOK', polName: '요코하마', pod: 'KRPUS', podName: '부산', etd: '2026-01-26', eta: '2026-01-27', transitTime: 1, space: 'Full', cutOffDate: '2026-01-24' },
  { id: '6', carrier: 'ONE', carrierCode: 'ONEY', vesselName: 'ONE COMMITMENT', voyageNo: 'V.006E', pol: 'JPYOK', polName: '요코하마', pod: 'KRINC', podName: '인천', etd: '2026-01-28', eta: '2026-01-29', transitTime: 1, space: 'Available', cutOffDate: '2026-01-26' },
  { id: '7', carrier: 'YANGMING', carrierCode: 'YMLU', vesselName: 'YM WELLNESS', voyageNo: 'V.007W', pol: 'TWKHH', polName: '가오슝', pod: 'KRPUS', podName: '부산', etd: '2026-01-29', eta: '2026-02-01', transitTime: 3, space: 'Limited', cutOffDate: '2026-01-27' },
  { id: '8', carrier: 'HAPAG-LLOYD', carrierCode: 'HLCU', vesselName: 'BERLIN EXPRESS', voyageNo: 'V.008N', pol: 'DEHAM', polName: '함부르크', pod: 'KRPUS', podName: '부산', etd: '2026-02-01', eta: '2026-02-28', transitTime: 27, space: 'Available', cutOffDate: '2026-01-28' },
];

// 샘플 항공 스케줄 데이터
const sampleAirSchedules: AirSchedule[] = [
  { id: '1', airline: '대한항공', airlineCode: 'KE', flightNo: 'KE081', origin: 'ICN', originName: '인천', destination: 'JFK', destinationName: '뉴욕', etd: '2026-01-25 14:00', eta: '2026-01-25 14:30', transitTime: 14, frequency: '매일', space: 'Available' },
  { id: '2', airline: '아시아나', airlineCode: 'OZ', flightNo: 'OZ212', origin: 'ICN', originName: '인천', destination: 'SFO', destinationName: '샌프란시스코', etd: '2026-01-25 10:30', eta: '2026-01-25 05:20', transitTime: 11, frequency: '매일', space: 'Limited' },
  { id: '3', airline: '루프트한자', airlineCode: 'LH', flightNo: 'LH713', origin: 'ICN', originName: '인천', destination: 'FRA', destinationName: '프랑크푸르트', etd: '2026-01-26 13:00', eta: '2026-01-26 18:30', transitTime: 12, frequency: '매일', space: 'Available' },
  { id: '4', airline: '에미레이트', airlineCode: 'EK', flightNo: 'EK323', origin: 'ICN', originName: '인천', destination: 'DXB', destinationName: '두바이', etd: '2026-01-26 23:30', eta: '2026-01-27 05:00', transitTime: 10, frequency: '매일', space: 'Available' },
  { id: '5', airline: '캐세이퍼시픽', airlineCode: 'CX', flightNo: 'CX417', origin: 'ICN', originName: '인천', destination: 'HKG', destinationName: '홍콩', etd: '2026-01-25 09:00', eta: '2026-01-25 11:45', transitTime: 4, frequency: '매일', space: 'Full' },
  { id: '6', airline: '싱가포르항공', airlineCode: 'SQ', flightNo: 'SQ601', origin: 'ICN', originName: '인천', destination: 'SIN', destinationName: '싱가포르', etd: '2026-01-27 00:30', eta: '2026-01-27 06:30', transitTime: 6, frequency: '주5회', space: 'Available' },
  { id: '7', airline: '대한항공', airlineCode: 'KE', flightNo: 'KE925', origin: 'ICN', originName: '인천', destination: 'AMS', destinationName: '암스테르담', etd: '2026-01-28 11:00', eta: '2026-01-28 15:00', transitTime: 11, frequency: '매일', space: 'Limited' },
  { id: '8', airline: '일본항공', airlineCode: 'JL', flightNo: 'JL092', origin: 'ICN', originName: '인천', destination: 'NRT', destinationName: '도쿄', etd: '2026-01-25 15:30', eta: '2026-01-25 18:00', transitTime: 2, frequency: '매일', space: 'Available' },
];

const spaceConfig = {
  Available: { label: '예약가능', color: '#059669', bgColor: '#D1FAE5' },
  Limited: { label: '여유적음', color: '#D97706', bgColor: '#FEF3C7' },
  Full: { label: '마감', color: '#DC2626', bgColor: '#FEE2E2' },
};

export default function ScheduleSearchModal({
  isOpen,
  onClose,
  onSelect,
  type,
  defaultOrigin = '',
  defaultDestination = '',
}: ScheduleSearchModalProps) {
  const [origin, setOrigin] = useState(defaultOrigin);
  const [destination, setDestination] = useState(defaultDestination);
  const [carrier, setCarrier] = useState('');
  const getToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const [dateFrom, setDateFrom] = useState(getToday());
  const [dateTo, setDateTo] = useState(getToday());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 팝업 모달 상태
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showAirlineModal, setShowAirlineModal] = useState(false);
  const [showCarrierModal, setShowCarrierModal] = useState(false);
  const [currentLocationField, setCurrentLocationField] = useState<'origin' | 'destination'>('origin');

  const handleLocationSearch = (field: 'origin' | 'destination') => {
    setCurrentLocationField(field);
    setShowLocationModal(true);
  };

  const handleLocationSelect = (item: LocationItem) => {
    if (currentLocationField === 'origin') {
      setOrigin(item.code);
    } else {
      setDestination(item.code);
    }
    setShowLocationModal(false);
  };

  const handleAirlineSelect = (item: AirlineItem) => {
    setCarrier(item.code);
    setShowAirlineModal(false);
  };

  const handleCarrierSelect = (item: CarrierItem) => {
    setCarrier(item.code);
    setShowCarrierModal(false);
  };

  // 필터링된 스케줄 데이터
  const filteredSchedules = useMemo(() => {
    if (type === 'sea') {
      return sampleSeaSchedules.filter(s => {
        if (origin && !s.pol.toLowerCase().includes(origin.toLowerCase()) && !s.polName.includes(origin)) return false;
        if (destination && !s.pod.toLowerCase().includes(destination.toLowerCase()) && !s.podName.includes(destination)) return false;
        if (carrier && !s.carrier.toLowerCase().includes(carrier.toLowerCase()) && !s.carrierCode.toLowerCase().includes(carrier.toLowerCase())) return false;
        if (dateFrom && s.etd < dateFrom) return false;
        if (dateTo && s.etd > dateTo) return false;
        return true;
      });
    } else {
      return sampleAirSchedules.filter(s => {
        if (origin && !s.origin.toLowerCase().includes(origin.toLowerCase()) && !s.originName.includes(origin)) return false;
        if (destination && !s.destination.toLowerCase().includes(destination.toLowerCase()) && !s.destinationName.includes(destination)) return false;
        if (carrier && !s.airline.includes(carrier) && !s.airlineCode.toLowerCase().includes(carrier.toLowerCase())) return false;
        if (dateFrom && s.etd.split(' ')[0] < dateFrom) return false;
        if (dateTo && s.etd.split(' ')[0] > dateTo) return false;
        return true;
      });
    }
  }, [type, origin, destination, carrier, dateFrom, dateTo]);

  const handleSelect = () => {
    if (!selectedId) {
      alert('스케줄을 선택해주세요.');
      return;
    }
    const schedule = type === 'sea'
      ? sampleSeaSchedules.find(s => s.id === selectedId)
      : sampleAirSchedules.find(s => s.id === selectedId);
    if (schedule) {
      onSelect(schedule);
      onClose();
    }
  };

  const handleReset = () => {
    setOrigin('');
    setDestination('');
    setCarrier('');
    setDateFrom(getToday());
    setDateTo(getToday());
    setSelectedId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[900px] max-h-[85vh] flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-[#1A2744] rounded-t-lg">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            {type === 'sea' ? (
              <>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17h2l1-2h4l-1 2h2l1-2h4l-1 2h2l3-6-3-6H6l-3 6 3 6zM6 11h12" />
                </svg>
                해상 스케줄 조회
              </>
            ) : (
              <>
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0011.5 2 1.5 1.5 0 0010 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                </svg>
                항공 스케줄 조회
              </>
            )}
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
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
              <div className="flex gap-1">
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder={type === 'sea' ? 'CNSHA' : 'ICN'}
                  className="flex-1 min-w-0 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleLocationSearch('origin')}
                  className="px-2 py-2 text-xs bg-[#1A2744] text-white rounded-lg hover:bg-[#243354] whitespace-nowrap"
                >
                  찾기
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {type === 'sea' ? '양하항 (POD)' : '도착공항'}
              </label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder={type === 'sea' ? 'KRPUS' : 'JFK'}
                  className="flex-1 min-w-0 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleLocationSearch('destination')}
                  className="px-2 py-2 text-xs bg-[#1A2744] text-white rounded-lg hover:bg-[#243354] whitespace-nowrap"
                >
                  찾기
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {type === 'sea' ? '선사' : '항공사'}
              </label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder={type === 'sea' ? 'MAERSK' : '대한항공'}
                  className="flex-1 min-w-0 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => type === 'air' ? setShowAirlineModal(true) : setShowCarrierModal(true)}
                  className="px-2 py-2 text-xs bg-[#1A2744] text-white rounded-lg hover:bg-[#243354] whitespace-nowrap"
                >
                  찾기
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">ETD From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">ETD To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-center gap-2 mt-3">
            <button
              onClick={() => {}}
              className="px-4 py-1.5 text-sm bg-[#1A2744] text-white rounded-lg hover:bg-[#243354]"
            >
              조회
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-1.5 text-sm bg-white text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-100"
            >
              초기화
            </button>
          </div>
        </div>

        {/* 스케줄 목록 */}
        <div className="flex-1 overflow-auto p-4">
          <div className="text-sm text-gray-500 mb-2">
            검색 결과: {filteredSchedules.length}건
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm text-gray-900">
              <thead className="bg-[#1A2744] text-white">
                <tr>
                  <th className="w-10 p-2 text-center"></th>
                  <th className="p-2 text-left font-medium">{type === 'sea' ? '선사' : '항공사'}</th>
                  <th className="p-2 text-left font-medium">{type === 'sea' ? '선명/항차' : '편명'}</th>
                  <th className="p-2 text-left font-medium">{type === 'sea' ? 'POL' : '출발'}</th>
                  <th className="p-2 text-left font-medium">{type === 'sea' ? 'POD' : '도착'}</th>
                  <th className="p-2 text-center font-medium">ETD</th>
                  <th className="p-2 text-center font-medium">ETA</th>
                  <th className="p-2 text-center font-medium">T/T</th>
                  {type === 'sea' && <th className="p-2 text-center font-medium">Cut-Off</th>}
                  <th className="p-2 text-center font-medium">Space</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={type === 'sea' ? 10 : 9} className="p-8 text-center text-gray-500">
                      조회된 스케줄이 없습니다.
                    </td>
                  </tr>
                ) : type === 'sea' ? (
                  (filteredSchedules as SeaSchedule[]).map((s) => (
                    <tr
                      key={s.id}
                      className={`border-t border-gray-200 cursor-pointer ${
                        selectedId === s.id ? 'bg-blue-100' : 'bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedId(s.id)}
                    >
                      <td className="p-2 text-center">
                        <input
                          type="radio"
                          name="schedule"
                          checked={selectedId === s.id}
                          onChange={() => setSelectedId(s.id)}
                        />
                      </td>
                      <td className="p-2">
                        <span className="font-medium">{s.carrier}</span>
                        <span className="text-gray-500 ml-1 text-xs">({s.carrierCode})</span>
                      </td>
                      <td className="p-2">{s.vesselName} / {s.voyageNo}</td>
                      <td className="p-2">
                        <span className="font-medium">{s.pol}</span>
                        <span className="text-gray-500 ml-1 text-xs">({s.polName})</span>
                      </td>
                      <td className="p-2">
                        <span className="font-medium">{s.pod}</span>
                        <span className="text-gray-500 ml-1 text-xs">({s.podName})</span>
                      </td>
                      <td className="p-2 text-center">{s.etd}</td>
                      <td className="p-2 text-center">{s.eta}</td>
                      <td className="p-2 text-center">{s.transitTime}일</td>
                      <td className="p-2 text-center text-red-600 font-medium">{s.cutOffDate}</td>
                      <td className="p-2 text-center">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ color: spaceConfig[s.space].color, backgroundColor: spaceConfig[s.space].bgColor }}
                        >
                          {spaceConfig[s.space].label}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  (filteredSchedules as AirSchedule[]).map((s) => (
                    <tr
                      key={s.id}
                      className={`border-t border-gray-200 cursor-pointer ${
                        selectedId === s.id ? 'bg-blue-100' : 'bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedId(s.id)}
                    >
                      <td className="p-2 text-center">
                        <input
                          type="radio"
                          name="schedule"
                          checked={selectedId === s.id}
                          onChange={() => setSelectedId(s.id)}
                        />
                      </td>
                      <td className="p-2">
                        <span className="font-medium">{s.airline}</span>
                        <span className="text-gray-500 ml-1 text-xs">({s.airlineCode})</span>
                      </td>
                      <td className="p-2 font-medium">{s.flightNo}</td>
                      <td className="p-2">
                        <span className="font-medium">{s.origin}</span>
                        <span className="text-gray-500 ml-1 text-xs">({s.originName})</span>
                      </td>
                      <td className="p-2">
                        <span className="font-medium">{s.destination}</span>
                        <span className="text-gray-500 ml-1 text-xs">({s.destinationName})</span>
                      </td>
                      <td className="p-2 text-center">{s.etd}</td>
                      <td className="p-2 text-center">{s.eta}</td>
                      <td className="p-2 text-center">{s.transitTime}h</td>
                      <td className="p-2 text-center">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ color: spaceConfig[s.space].color, backgroundColor: spaceConfig[s.space].bgColor }}
                        >
                          {spaceConfig[s.space].label}
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

      {/* 위치 코드 검색 모달 */}
      <LocationCodeModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelect={handleLocationSelect}
        type={type === 'sea' ? 'seaport' : 'airport'}
      />

      {/* 항공사 코드 검색 모달 */}
      <AirlineCodeModal
        isOpen={showAirlineModal}
        onClose={() => setShowAirlineModal(false)}
        onSelect={handleAirlineSelect}
      />

      {/* 선사 코드 검색 모달 */}
      <CarrierCodeModal
        isOpen={showCarrierModal}
        onClose={() => setShowCarrierModal(false)}
        onSelect={handleCarrierSelect}
      />
    </div>
  );
}
