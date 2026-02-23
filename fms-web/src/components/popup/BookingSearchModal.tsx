'use client';

import { useState, useMemo } from 'react';

// 해상 부킹 데이터 타입
export interface SeaBooking {
  id: string;
  bookingNo: string;
  shipper: string;
  pol: string;
  polName: string;
  pod: string;
  podName: string;
  carrier: string;
  vessel: string;
  voyageNo: string;
  etd: string;
  eta: string;
  status: 'Request' | 'Confirmed' | 'Cancelled' | 'Shipped';
  containerType: string;
  containerQty: number;
}

// 항공 부킹 데이터 타입
export interface AirBooking {
  id: string;
  bookingNo: string;
  shipper: string;
  origin: string;
  originName: string;
  destination: string;
  destinationName: string;
  airline: string;
  flightNo: string;
  etd: string;
  eta: string;
  status: 'Request' | 'Confirmed' | 'Cancelled' | 'Shipped';
  weight: number;
  pieces: number;
}

interface BookingSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (booking: SeaBooking | AirBooking) => void;
  type: 'sea' | 'air';
}

// 샘플 해상 부킹 데이터
const sampleSeaBookings: SeaBooking[] = [
  { id: '1', bookingNo: 'BK2026010001', shipper: '삼성전자', pol: 'KRPUS', polName: '부산', pod: 'USLAX', podName: '로스앤젤레스', carrier: 'MAERSK', vessel: 'MAERSK EINDHOVEN', voyageNo: 'V.001E', etd: '2026-01-25', eta: '2026-02-10', status: 'Confirmed', containerType: '40HC', containerQty: 2 },
  { id: '2', bookingNo: 'BK2026010002', shipper: 'LG전자', pol: 'KRPUS', polName: '부산', pod: 'CNSHA', podName: '상해', carrier: 'COSCO', vessel: 'COSCO FORTUNE', voyageNo: 'V.002N', etd: '2026-01-26', eta: '2026-01-28', status: 'Request', containerType: '20GP', containerQty: 4 },
  { id: '3', bookingNo: 'BK2026010003', shipper: '현대자동차', pol: 'KRINC', polName: '인천', pod: 'DEHAM', podName: '함부르크', carrier: 'HMM', vessel: 'HMM ALGECIRAS', voyageNo: 'V.003S', etd: '2026-01-27', eta: '2026-02-20', status: 'Confirmed', containerType: '40GP', containerQty: 5 },
  { id: '4', bookingNo: 'BK2026010004', shipper: 'SK하이닉스', pol: 'KRPUS', polName: '부산', pod: 'JPYOK', podName: '요코하마', carrier: 'ONE', vessel: 'ONE COMMITMENT', voyageNo: 'V.004E', etd: '2026-01-28', eta: '2026-01-30', status: 'Shipped', containerType: '20RF', containerQty: 1 },
  { id: '5', bookingNo: 'BK2026010005', shipper: '포스코', pol: 'KRPUS', polName: '부산', pod: 'SGSIN', podName: '싱가포르', carrier: 'EVERGREEN', vessel: 'EVER GOODS', voyageNo: 'V.005W', etd: '2026-01-29', eta: '2026-02-05', status: 'Cancelled', containerType: '40HC', containerQty: 3 },
];

// 샘플 항공 부킹 데이터
const sampleAirBookings: AirBooking[] = [
  { id: '1', bookingNo: 'ABK2026010001', shipper: '삼성전자', origin: 'ICN', originName: '인천', destination: 'JFK', destinationName: '뉴욕', airline: '대한항공', flightNo: 'KE081', etd: '2026-01-25 14:00', eta: '2026-01-25 14:30', status: 'Confirmed', weight: 500, pieces: 10 },
  { id: '2', bookingNo: 'ABK2026010002', shipper: 'LG전자', origin: 'ICN', originName: '인천', destination: 'FRA', destinationName: '프랑크푸르트', airline: '루프트한자', flightNo: 'LH713', etd: '2026-01-26 13:00', eta: '2026-01-26 18:30', status: 'Request', weight: 800, pieces: 15 },
  { id: '3', bookingNo: 'ABK2026010003', shipper: '현대자동차', origin: 'ICN', originName: '인천', destination: 'SIN', destinationName: '싱가포르', airline: '싱가포르항공', flightNo: 'SQ601', etd: '2026-01-27 00:30', eta: '2026-01-27 06:30', status: 'Confirmed', weight: 1200, pieces: 25 },
  { id: '4', bookingNo: 'ABK2026010004', shipper: 'SK하이닉스', origin: 'ICN', originName: '인천', destination: 'HKG', destinationName: '홍콩', airline: '캐세이퍼시픽', flightNo: 'CX417', etd: '2026-01-28 09:00', eta: '2026-01-28 11:45', status: 'Shipped', weight: 300, pieces: 5 },
];

const statusConfig = {
  Request: { label: '요청', color: '#6B7280', bgColor: '#F3F4F6' },
  Confirmed: { label: '확정', color: '#059669', bgColor: '#D1FAE5' },
  Cancelled: { label: '취소', color: '#DC2626', bgColor: '#FEE2E2' },
  Shipped: { label: '선적완료', color: '#2563EB', bgColor: '#DBEAFE' },
};

export default function BookingSearchModal({
  isOpen,
  onClose,
  onSelect,
  type,
}: BookingSearchModalProps) {
  const [bookingNo, setBookingNo] = useState('');
  const [status, setStatus] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    if (type === 'sea') {
      return sampleSeaBookings.filter(bk => {
        if (bookingNo && !bk.bookingNo.toLowerCase().includes(bookingNo.toLowerCase())) return false;
        if (status && bk.status !== status) return false;
        if (origin && !bk.pol.toLowerCase().includes(origin.toLowerCase()) && !bk.polName.includes(origin)) return false;
        if (destination && !bk.pod.toLowerCase().includes(destination.toLowerCase()) && !bk.podName.includes(destination)) return false;
        if (dateFrom && bk.etd < dateFrom) return false;
        if (dateTo && bk.etd > dateTo) return false;
        return true;
      });
    } else {
      return sampleAirBookings.filter(bk => {
        if (bookingNo && !bk.bookingNo.toLowerCase().includes(bookingNo.toLowerCase())) return false;
        if (status && bk.status !== status) return false;
        if (origin && !bk.origin.toLowerCase().includes(origin.toLowerCase()) && !bk.originName.includes(origin)) return false;
        if (destination && !bk.destination.toLowerCase().includes(destination.toLowerCase()) && !bk.destinationName.includes(destination)) return false;
        if (dateFrom && bk.etd.split(' ')[0] < dateFrom) return false;
        if (dateTo && bk.etd.split(' ')[0] > dateTo) return false;
        return true;
      });
    }
  }, [type, bookingNo, status, origin, destination, dateFrom, dateTo]);

  const handleSelect = () => {
    if (!selectedId) {
      alert('부킹을 선택해주세요.');
      return;
    }
    const selected = type === 'sea'
      ? sampleSeaBookings.find(bk => bk.id === selectedId)
      : sampleAirBookings.find(bk => bk.id === selectedId);
    if (selected) {
      onSelect(selected);
      onClose();
    }
  };

  const handleReset = () => {
    setBookingNo('');
    setStatus('');
    setOrigin('');
    setDestination('');
    setDateFrom('');
    setDateTo('');
    setSelectedId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-50 rounded-lg shadow-xl w-[1000px] max-h-[85vh] flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-[#1A2744] rounded-t-lg">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {type === 'sea' ? '부킹정보 조회 (해상)' : '부킹정보 조회 (항공)'}
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 검색 조건 */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">부킹번호</label>
              <input
                type="text"
                value={bookingNo}
                onChange={(e) => setBookingNo(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Booking 상태</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg"
              >
                <option value="">전체</option>
                <option value="Request">요청</option>
                <option value="Confirmed">확정</option>
                <option value="Cancelled">취소</option>
                <option value="Shipped">선적완료</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{type === 'sea' ? '선적지' : 'Origin'}</label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{type === 'sea' ? '양하항' : 'Dest'}</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">일자 From *</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">일자 To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg"
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

        {/* 목록 */}
        <div className="flex-1 overflow-auto p-4">
          <div className="text-sm text-gray-500 mb-2">
            검색 결과: {filteredData.length}건
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-10 p-2 text-center"></th>
                  <th className="p-2 text-left font-medium">부킹번호</th>
                  <th className="p-2 text-left font-medium">Shipper</th>
                  <th className="p-2 text-left font-medium">{type === 'sea' ? '선적지' : 'Origin'}</th>
                  <th className="p-2 text-left font-medium">{type === 'sea' ? '양하항' : 'Dest'}</th>
                  <th className="p-2 text-center font-medium">{type === 'sea' ? '선사' : '항공사'}</th>
                  <th className="p-2 text-center font-medium">{type === 'sea' ? 'Vessel/Voy' : 'Flight'}</th>
                  <th className="p-2 text-center font-medium">ETD</th>
                  <th className="p-2 text-center font-medium">{type === 'sea' ? 'CNTR' : 'Pcs/Wgt'}</th>
                  <th className="p-2 text-center font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-gray-500">
                      조회된 부킹이 없습니다.
                    </td>
                  </tr>
                ) : type === 'sea' ? (
                  (filteredData as SeaBooking[]).map((bk) => (
                    <tr
                      key={bk.id}
                      className={`border-t border-gray-200 cursor-pointer ${
                        selectedId === bk.id ? 'bg-blue-100' : 'bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedId(bk.id)}
                      onDoubleClick={() => { onSelect(bk); onClose(); }}
                    >
                      <td className="p-2 text-center">
                        <input
                          type="radio"
                          name="booking"
                          checked={selectedId === bk.id}
                          onChange={() => setSelectedId(bk.id)}
                        />
                      </td>
                      <td className="p-2 font-medium">{bk.bookingNo}</td>
                      <td className="p-2">{bk.shipper}</td>
                      <td className="p-2">
                        <span className="font-medium">{bk.pol}</span>
                        <span className="text-gray-500 ml-1 text-xs">({bk.polName})</span>
                      </td>
                      <td className="p-2">
                        <span className="font-medium">{bk.pod}</span>
                        <span className="text-gray-500 ml-1 text-xs">({bk.podName})</span>
                      </td>
                      <td className="p-2 text-center">{bk.carrier}</td>
                      <td className="p-2 text-center text-xs">{bk.vessel}<br/>{bk.voyageNo}</td>
                      <td className="p-2 text-center">{bk.etd}</td>
                      <td className="p-2 text-center">{bk.containerType} x {bk.containerQty}</td>
                      <td className="p-2 text-center">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ color: statusConfig[bk.status]?.color, backgroundColor: statusConfig[bk.status]?.bgColor }}
                        >
                          {statusConfig[bk.status]?.label}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  (filteredData as AirBooking[]).map((bk) => (
                    <tr
                      key={bk.id}
                      className={`border-t border-gray-200 cursor-pointer ${
                        selectedId === bk.id ? 'bg-blue-100' : 'bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedId(bk.id)}
                      onDoubleClick={() => { onSelect(bk); onClose(); }}
                    >
                      <td className="p-2 text-center">
                        <input
                          type="radio"
                          name="booking"
                          checked={selectedId === bk.id}
                          onChange={() => setSelectedId(bk.id)}
                        />
                      </td>
                      <td className="p-2 font-medium">{bk.bookingNo}</td>
                      <td className="p-2">{bk.shipper}</td>
                      <td className="p-2">
                        <span className="font-medium">{bk.origin}</span>
                        <span className="text-gray-500 ml-1 text-xs">({bk.originName})</span>
                      </td>
                      <td className="p-2">
                        <span className="font-medium">{bk.destination}</span>
                        <span className="text-gray-500 ml-1 text-xs">({bk.destinationName})</span>
                      </td>
                      <td className="p-2 text-center">{bk.airline}</td>
                      <td className="p-2 text-center">{bk.flightNo}</td>
                      <td className="p-2 text-center">{bk.etd}</td>
                      <td className="p-2 text-center">{bk.pieces}pcs / {bk.weight}kg</td>
                      <td className="p-2 text-center">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ color: statusConfig[bk.status]?.color, backgroundColor: statusConfig[bk.status]?.bgColor }}
                        >
                          {statusConfig[bk.status]?.label}
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
            disabled={!selectedId}
            className="px-4 py-2 bg-[#E8A838] text-[#0C1222] font-semibold rounded-lg hover:bg-[#D4943A] disabled:opacity-50"
          >
            적용
          </button>
        </div>
      </div>
    </div>
  );
}
