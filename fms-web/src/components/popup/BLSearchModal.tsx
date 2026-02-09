'use client';

import { useState, useMemo } from 'react';

// B/L 데이터 타입 (해상)
export interface SeaBL {
  id: string;
  blNo: string;
  hblNo?: string;
  mblNo?: string;
  shipper: string;
  consignee: string;
  notify?: string;
  pol: string;
  polName: string;
  pod: string;
  podName: string;
  vessel: string;
  voyageNo: string;
  etd: string;
  eta: string;
  blType: 'HBL' | 'MBL';
  status: 'Draft' | 'Issued' | 'Surrendered' | 'Released';
  line: string;
  containerNo?: string;
}

// B/L 데이터 타입 (항공)
export interface AirBL {
  id: string;
  awbNo: string;
  hawbNo?: string;
  mawbNo?: string;
  shipper: string;
  consignee: string;
  notify?: string;
  origin: string;
  originName: string;
  destination: string;
  destinationName: string;
  flightNo: string;
  etd: string;
  eta: string;
  awbType: 'HAWB' | 'MAWB';
  status: 'Draft' | 'Issued' | 'Released';
  airline: string;
}

interface BLSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (bl: SeaBL | AirBL) => void;
  type: 'sea' | 'air';
}

// 샘플 해상 B/L 데이터
const sampleSeaBLs: SeaBL[] = [
  { id: '1', blNo: 'KRPUS20260101001', hblNo: 'HBL20260101001', mblNo: 'MBL20260101001', shipper: '삼성전자', consignee: 'ABC Corp', notify: 'XYZ Inc', pol: 'KRPUS', polName: '부산', pod: 'USLAX', podName: '로스앤젤레스', vessel: 'MAERSK EINDHOVEN', voyageNo: 'V.001E', etd: '2026-01-25', eta: '2026-02-10', blType: 'HBL', status: 'Issued', line: 'MAERSK', containerNo: 'MSKU1234567' },
  { id: '2', blNo: 'KRPUS20260101002', hblNo: 'HBL20260101002', mblNo: 'MBL20260101002', shipper: 'LG전자', consignee: 'DEF Inc', pol: 'KRPUS', polName: '부산', pod: 'CNSHA', podName: '상해', vessel: 'COSCO FORTUNE', voyageNo: 'V.002N', etd: '2026-01-26', eta: '2026-01-28', blType: 'HBL', status: 'Draft', line: 'COSCO', containerNo: 'COSU8765432' },
  { id: '3', blNo: 'KRINC20260101001', hblNo: 'HBL20260101003', mblNo: 'MBL20260101003', shipper: '현대자동차', consignee: 'GHI GmbH', pol: 'KRINC', polName: '인천', pod: 'DEHAM', podName: '함부르크', vessel: 'HMM ALGECIRAS', voyageNo: 'V.003S', etd: '2026-01-27', eta: '2026-02-20', blType: 'MBL', status: 'Issued', line: 'HMM' },
  { id: '4', blNo: 'KRPUS20260101003', hblNo: 'HBL20260101004', shipper: 'SK하이닉스', consignee: 'JKL Ltd', pol: 'KRPUS', polName: '부산', pod: 'JPYOK', podName: '요코하마', vessel: 'ONE COMMITMENT', voyageNo: 'V.004E', etd: '2026-01-28', eta: '2026-01-30', blType: 'HBL', status: 'Released', line: 'ONE' },
  { id: '5', blNo: 'KRPUS20260101004', mblNo: 'MBL20260101005', shipper: '포스코', consignee: 'MNO Corp', pol: 'KRPUS', polName: '부산', pod: 'SGSIN', podName: '싱가포르', vessel: 'EVERGREEN EVER', voyageNo: 'V.005W', etd: '2026-01-29', eta: '2026-02-05', blType: 'MBL', status: 'Surrendered', line: 'EVERGREEN' },
];

// 샘플 항공 AWB 데이터
const sampleAirBLs: AirBL[] = [
  { id: '1', awbNo: '180-12345678', hawbNo: 'HAWB001', mawbNo: '180-12345678', shipper: '삼성전자', consignee: 'ABC Corp', origin: 'ICN', originName: '인천', destination: 'JFK', destinationName: '뉴욕', flightNo: 'KE081', etd: '2026-01-25 14:00', eta: '2026-01-25 14:30', awbType: 'HAWB', status: 'Issued', airline: '대한항공' },
  { id: '2', awbNo: '988-87654321', hawbNo: 'HAWB002', mawbNo: '988-87654321', shipper: 'LG전자', consignee: 'DEF Inc', origin: 'ICN', originName: '인천', destination: 'FRA', destinationName: '프랑크푸르트', flightNo: 'LH713', etd: '2026-01-26 13:00', eta: '2026-01-26 18:30', awbType: 'HAWB', status: 'Draft', airline: '루프트한자' },
  { id: '3', awbNo: '618-11112222', mawbNo: '618-11112222', shipper: '현대자동차', consignee: 'GHI GmbH', origin: 'ICN', originName: '인천', destination: 'SIN', destinationName: '싱가포르', flightNo: 'SQ601', etd: '2026-01-27 00:30', eta: '2026-01-27 06:30', awbType: 'MAWB', status: 'Issued', airline: '싱가포르항공' },
  { id: '4', awbNo: '160-33334444', hawbNo: 'HAWB004', shipper: 'SK하이닉스', consignee: 'JKL Ltd', origin: 'ICN', originName: '인천', destination: 'HKG', destinationName: '홍콩', flightNo: 'CX417', etd: '2026-01-28 09:00', eta: '2026-01-28 11:45', awbType: 'HAWB', status: 'Released', airline: '캐세이퍼시픽' },
];

const statusConfig = {
  Draft: { label: '작성중', color: '#6B7280', bgColor: '#F3F4F6' },
  Issued: { label: '발행', color: '#059669', bgColor: '#D1FAE5' },
  Surrendered: { label: 'Surrender', color: '#D97706', bgColor: '#FEF3C7' },
  Released: { label: '인도완료', color: '#2563EB', bgColor: '#DBEAFE' },
};

export default function BLSearchModal({
  isOpen,
  onClose,
  onSelect,
  type,
}: BLSearchModalProps) {
  const [searchText, setSearchText] = useState('');
  const [shipper, setShipper] = useState('');
  const [consignee, setConsignee] = useState('');
  const [blType, setBlType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    if (type === 'sea') {
      return sampleSeaBLs.filter(bl => {
        if (searchText && !bl.blNo.toLowerCase().includes(searchText.toLowerCase()) &&
            !bl.hblNo?.toLowerCase().includes(searchText.toLowerCase()) &&
            !bl.mblNo?.toLowerCase().includes(searchText.toLowerCase())) return false;
        if (shipper && !bl.shipper.includes(shipper)) return false;
        if (consignee && !bl.consignee.toLowerCase().includes(consignee.toLowerCase())) return false;
        if (blType && bl.blType !== blType) return false;
        if (dateFrom && bl.etd < dateFrom) return false;
        if (dateTo && bl.etd > dateTo) return false;
        return true;
      });
    } else {
      return sampleAirBLs.filter(awb => {
        if (searchText && !awb.awbNo.includes(searchText) &&
            !awb.hawbNo?.includes(searchText) &&
            !awb.mawbNo?.includes(searchText)) return false;
        if (shipper && !awb.shipper.includes(shipper)) return false;
        if (consignee && !awb.consignee.toLowerCase().includes(consignee.toLowerCase())) return false;
        if (blType && awb.awbType !== blType) return false;
        if (dateFrom && awb.etd.split(' ')[0] < dateFrom) return false;
        if (dateTo && awb.etd.split(' ')[0] > dateTo) return false;
        return true;
      });
    }
  }, [type, searchText, shipper, consignee, blType, dateFrom, dateTo]);

  const handleSelect = () => {
    if (!selectedId) {
      alert('B/L을 선택해주세요.');
      return;
    }
    const selected = type === 'sea'
      ? sampleSeaBLs.find(bl => bl.id === selectedId)
      : sampleAirBLs.find(awb => awb.id === selectedId);
    if (selected) {
      onSelect(selected);
      onClose();
    }
  };

  const handleReset = () => {
    setSearchText('');
    setShipper('');
    setConsignee('');
    setBlType('');
    setDateFrom('');
    setDateTo('');
    setSelectedId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--surface-100)] rounded-lg shadow-xl w-[1000px] max-h-[85vh] flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[#1A2744] rounded-t-lg">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {type === 'sea' ? 'B/L 검색 (해상)' : 'AWB 검색 (항공)'}
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
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                {type === 'sea' ? 'B/L No.' : 'AWB No.'}
              </label>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder={type === 'sea' ? 'HBL/MBL No.' : 'HAWB/MAWB No.'}
                className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">Shipper</label>
              <input
                type="text"
                value={shipper}
                onChange={(e) => setShipper(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">Consignee</label>
              <input
                type="text"
                value={consignee}
                onChange={(e) => setConsignee(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">구분</label>
              <select
                value={blType}
                onChange={(e) => setBlType(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
              >
                <option value="">전체</option>
                <option value={type === 'sea' ? 'HBL' : 'HAWB'}>{type === 'sea' ? 'HBL' : 'HAWB'}</option>
                <option value={type === 'sea' ? 'MBL' : 'MAWB'}>{type === 'sea' ? 'MBL' : 'MAWB'}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">ETD From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">ETD To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
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
              className="px-4 py-1.5 text-sm bg-[var(--surface-50)] text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
            >
              초기화
            </button>
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
                  <th className="w-10 p-2 text-center"></th>
                  <th className="p-2 text-left font-medium">{type === 'sea' ? 'B/L No.' : 'AWB No.'}</th>
                  <th className="p-2 text-left font-medium">Shipper</th>
                  <th className="p-2 text-left font-medium">Consignee</th>
                  <th className="p-2 text-left font-medium">{type === 'sea' ? 'POL' : 'Origin'}</th>
                  <th className="p-2 text-left font-medium">{type === 'sea' ? 'POD' : 'Dest'}</th>
                  <th className="p-2 text-center font-medium">{type === 'sea' ? 'Vessel/Voy' : 'Flight'}</th>
                  <th className="p-2 text-center font-medium">ETD</th>
                  <th className="p-2 text-center font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-[var(--muted)]">
                      조회된 B/L이 없습니다.
                    </td>
                  </tr>
                ) : type === 'sea' ? (
                  (filteredData as SeaBL[]).map((bl) => (
                    <tr
                      key={bl.id}
                      className={`border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer ${
                        selectedId === bl.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedId(bl.id)}
                      onDoubleClick={() => { onSelect(bl); onClose(); }}
                    >
                      <td className="p-2 text-center">
                        <input
                          type="radio"
                          name="bl"
                          checked={selectedId === bl.id}
                          onChange={() => setSelectedId(bl.id)}
                        />
                      </td>
                      <td className="p-2">
                        <div className="font-medium">{bl.blNo}</div>
                        <div className="text-xs text-[var(--muted)]">
                          {bl.blType}: {bl.blType === 'HBL' ? bl.hblNo : bl.mblNo}
                        </div>
                      </td>
                      <td className="p-2">{bl.shipper}</td>
                      <td className="p-2">{bl.consignee}</td>
                      <td className="p-2">
                        <span className="font-medium">{bl.pol}</span>
                        <span className="text-[var(--muted)] ml-1 text-xs">({bl.polName})</span>
                      </td>
                      <td className="p-2">
                        <span className="font-medium">{bl.pod}</span>
                        <span className="text-[var(--muted)] ml-1 text-xs">({bl.podName})</span>
                      </td>
                      <td className="p-2 text-center text-xs">{bl.vessel}<br/>{bl.voyageNo}</td>
                      <td className="p-2 text-center">{bl.etd}</td>
                      <td className="p-2 text-center">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ color: statusConfig[bl.status]?.color, backgroundColor: statusConfig[bl.status]?.bgColor }}
                        >
                          {statusConfig[bl.status]?.label}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  (filteredData as AirBL[]).map((awb) => (
                    <tr
                      key={awb.id}
                      className={`border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer ${
                        selectedId === awb.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedId(awb.id)}
                      onDoubleClick={() => { onSelect(awb); onClose(); }}
                    >
                      <td className="p-2 text-center">
                        <input
                          type="radio"
                          name="awb"
                          checked={selectedId === awb.id}
                          onChange={() => setSelectedId(awb.id)}
                        />
                      </td>
                      <td className="p-2">
                        <div className="font-medium">{awb.awbNo}</div>
                        <div className="text-xs text-[var(--muted)]">
                          {awb.awbType}: {awb.awbType === 'HAWB' ? awb.hawbNo : awb.mawbNo}
                        </div>
                      </td>
                      <td className="p-2">{awb.shipper}</td>
                      <td className="p-2">{awb.consignee}</td>
                      <td className="p-2">
                        <span className="font-medium">{awb.origin}</span>
                        <span className="text-[var(--muted)] ml-1 text-xs">({awb.originName})</span>
                      </td>
                      <td className="p-2">
                        <span className="font-medium">{awb.destination}</span>
                        <span className="text-[var(--muted)] ml-1 text-xs">({awb.destinationName})</span>
                      </td>
                      <td className="p-2 text-center">{awb.flightNo}</td>
                      <td className="p-2 text-center">{awb.etd}</td>
                      <td className="p-2 text-center">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ color: statusConfig[awb.status]?.color, backgroundColor: statusConfig[awb.status]?.bgColor }}
                        >
                          {statusConfig[awb.status]?.label}
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
