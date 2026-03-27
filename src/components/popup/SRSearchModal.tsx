'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';

// S/R 데이터 타입
export interface SRData {
  id: string;
  srNo: string;
  bookingNo?: string;
  shipper: string;
  shipperAddress?: string;
  consignee: string;
  consigneeAddress?: string;
  notifyParty?: string;
  carrier?: string;
  pol: string;
  polName?: string;
  pod: string;
  podName?: string;
  etd?: string;
  eta?: string;
  cargoReadyDate?: string;
  status: string;
  containerType?: string;
  containerQty?: number;
  packageQty?: number;
  packageType?: string;
  grossWeight: number;
  measurement?: number;
  volume?: number;
  commodityDesc?: string;
  customerName?: string;
}

interface SRSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (sr: SRData) => void;
}

// 샘플 S/R 데이터 (API 실패시 폴백)
const sampleSRs: SRData[] = [
  { id: '1', srNo: 'SR-2026-0001', bookingNo: 'BK-2026-0001', shipper: '삼성전자', consignee: 'Samsung America Inc.', carrier: 'HMM', pol: 'KRPUS', polName: '부산', pod: 'USLAX', podName: '로스앤젤레스', etd: '2026-01-25', eta: '2026-02-10', status: 'CONFIRMED', containerType: '40HC', containerQty: 2, grossWeight: 18500, measurement: 68 },
  { id: '2', srNo: 'SR-2026-0002', bookingNo: 'BK-2026-0002', shipper: 'LG전자', consignee: 'LG Electronics USA', carrier: 'MAERSK', pol: 'KRPUS', polName: '부산', pod: 'USNYC', podName: '뉴욕', etd: '2026-01-26', eta: '2026-02-12', status: 'PENDING', containerType: '40GP', containerQty: 1, grossWeight: 12000, measurement: 45 },
  { id: '3', srNo: 'SR-2026-0003', bookingNo: 'BK-2026-0003', shipper: '현대자동차', consignee: 'Hyundai Motor Europe', carrier: 'MSC', pol: 'KRINC', polName: '인천', pod: 'DEHAM', podName: '함부르크', etd: '2026-01-27', eta: '2026-02-20', status: 'DRAFT', containerType: '45HC', containerQty: 3, grossWeight: 25000, measurement: 95 },
  { id: '4', srNo: 'SR-2026-0004', bookingNo: 'BK-2026-0004', shipper: 'SK하이닉스', consignee: 'SK Hynix Japan', carrier: 'ONE', pol: 'KRPUS', polName: '부산', pod: 'JPYOK', podName: '요코하마', etd: '2026-01-28', eta: '2026-01-30', status: 'CONFIRMED', containerType: '20GP', containerQty: 5, grossWeight: 35000, measurement: 120 },
  { id: '5', srNo: 'SR-2026-0005', bookingNo: 'BK-2026-0005', shipper: '포스코', consignee: 'POSCO Singapore', carrier: 'EVERGREEN', pol: 'KRPUS', polName: '부산', pod: 'SGSIN', podName: '싱가포르', etd: '2026-01-29', eta: '2026-02-05', status: 'CONFIRMED', containerType: '40HC', containerQty: 4, grossWeight: 80000, measurement: 200 },
];

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: '작성중', color: '#6B7280', bgColor: '#F3F4F6' },
  PENDING: { label: '대기', color: '#9333EA', bgColor: '#F3E8FF' },
  CONFIRMED: { label: '확정', color: '#059669', bgColor: '#D1FAE5' },
  SHIPPED: { label: '선적', color: '#D97706', bgColor: '#FEF3C7' },
  COMPLETED: { label: '완료', color: '#2563EB', bgColor: '#DBEAFE' },
};

export default function SRSearchModal({
  isOpen,
  onClose,
  onSelect,
}: SRSearchModalProps) {
  const [allData, setAllData] = useState<SRData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [shipper, setShipper] = useState('');
  const [carrier, setCarrier] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // API에서 S/R 목록 조회
  const fetchSRList = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sr/sea');
      if (response.ok) {
        const data = await response.json();
        // API 데이터를 SRData 형식으로 변환
        const mapped: SRData[] = data.map((item: any) => ({
          id: String(item.id),
          srNo: item.srNo || '',
          bookingNo: item.bookingNo || '',
          shipper: item.shipperName || '',
          shipperAddress: item.shipperAddress || '',
          consignee: item.consigneeName || '',
          consigneeAddress: item.consigneeAddress || '',
          notifyParty: item.notifyParty || '',
          pol: item.pol || '',
          pod: item.pod || '',
          cargoReadyDate: item.cargoReadyDate || '',
          status: item.status || 'DRAFT',
          packageQty: item.packageQty || 0,
          packageType: item.packageType || '',
          grossWeight: item.grossWeight || 0,
          volume: item.volume || 0,
          commodityDesc: item.commodityDesc || '',
          customerName: item.customerName || '',
        }));
        setAllData(mapped.length > 0 ? mapped : sampleSRs);
      } else {
        setAllData(sampleSRs);
      }
    } catch (error) {
      console.error('Failed to fetch S/R list:', error);
      setAllData(sampleSRs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchSRList();
      setSelectedId(null);
    }
  }, [isOpen, fetchSRList]);

  const filteredData = useMemo(() => {
    return allData.filter(sr => {
      if (searchText && !sr.srNo.toLowerCase().includes(searchText.toLowerCase()) &&
          !(sr.bookingNo || '').toLowerCase().includes(searchText.toLowerCase())) return false;
      if (shipper && !sr.shipper.includes(shipper)) return false;
      if (carrier && sr.carrier !== carrier) return false;
      if (status && sr.status !== status) return false;
      if (dateFrom && (sr.cargoReadyDate || '') < dateFrom) return false;
      if (dateTo && (sr.cargoReadyDate || '') > dateTo) return false;
      return true;
    });
  }, [allData, searchText, shipper, carrier, status, dateFrom, dateTo]);

  const handleSelect = () => {
    const selected = allData.find(sr => sr.id === selectedId);
    if (selected) {
      onSelect(selected);
      resetForm();
    }
  };

  const handleRowDoubleClick = (sr: SRData) => {
    onSelect(sr);
    resetForm();
  };

  const resetForm = () => {
    setSearchText('');
    setShipper('');
    setCarrier('');
    setStatus('');
    setDateFrom('');
    setDateTo('');
    setSelectedId(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-[900px] max-h-[80vh] overflow-hidden">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b bg-[#1A2744] text-white flex items-center justify-between rounded-t-xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            S/R 검색
          </h2>
          <button onClick={handleClose} className="text-white/80 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 검색 조건 */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">S/R번호/부킹번호</label>
              <input
                type="text"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder="검색어 입력"
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">화주</label>
              <input
                type="text"
                value={shipper}
                onChange={e => setShipper(e.target.value)}
                placeholder="화주명"
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">선사</label>
              <select
                value={carrier}
                onChange={e => setCarrier(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체</option>
                <option value="HMM">HMM</option>
                <option value="MAERSK">MAERSK</option>
                <option value="MSC">MSC</option>
                <option value="EVERGREEN">EVERGREEN</option>
                <option value="ONE">ONE</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">상태</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체</option>
                <option value="Draft">작성중</option>
                <option value="Confirmed">확정</option>
                <option value="Shipped">선적</option>
                <option value="Completed">완료</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">ETD (시작)</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">ETD (종료)</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2 flex items-end gap-2">
              <button
                onClick={() => { setSearchText(''); setShipper(''); setCarrier(''); setStatus(''); setDateFrom(''); setDateTo(''); }}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                초기화
              </button>
            </div>
          </div>
        </div>

        {/* 결과 테이블 */}
        <div className="overflow-auto max-h-[400px]">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600">S/R 번호</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">고객사</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Shipper</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Consignee</th>
                <th className="px-3 py-2 text-center font-medium text-gray-600">POL</th>
                <th className="px-3 py-2 text-center font-medium text-gray-600">POD</th>
                <th className="px-3 py-2 text-center font-medium text-gray-600">Cargo Ready</th>
                <th className="px-3 py-2 text-center font-medium text-gray-600">상태</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                      로딩 중...
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-gray-400">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredData.map(sr => {
                  const statusStyle = statusConfig[sr.status] || statusConfig.DRAFT;
                  return (
                    <tr
                      key={sr.id}
                      className={`border-b cursor-pointer ${selectedId === sr.id ? 'bg-blue-100' : 'bg-white hover:bg-gray-50'}`}
                      onClick={() => setSelectedId(sr.id)}
                      onDoubleClick={() => handleRowDoubleClick(sr)}
                    >
                      <td className="px-3 py-2 font-medium text-blue-600">{sr.srNo}</td>
                      <td className="px-3 py-2 text-sm">{sr.customerName || '-'}</td>
                      <td className="px-3 py-2 text-sm">{sr.shipper || '-'}</td>
                      <td className="px-3 py-2 text-sm">{sr.consignee || '-'}</td>
                      <td className="px-3 py-2 text-center text-sm">{sr.pol || '-'}</td>
                      <td className="px-3 py-2 text-center text-sm">{sr.pod || '-'}</td>
                      <td className="px-3 py-2 text-center text-sm">{sr.cargoReadyDate || sr.etd || '-'}</td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ color: statusStyle.color, backgroundColor: statusStyle.bgColor }}
                        >
                          {statusStyle.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {filteredData.length}건 조회 | 더블클릭 또는 선택 후 확인
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              취소
            </button>
            <button
              onClick={handleSelect}
              disabled={!selectedId}
              className={`px-4 py-2 text-sm rounded-lg ${
                selectedId
                  ? 'bg-[#1A2744] text-white hover:bg-[#243354]'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
