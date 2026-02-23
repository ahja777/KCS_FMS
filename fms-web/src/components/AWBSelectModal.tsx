'use client';

import { useState, useEffect, useCallback } from 'react';

interface AWBData {
  mawb_id: number;
  mawb_no: string;
  airline_code: string;
  flight_no: string;
  origin_airport_cd: string;
  dest_airport_cd: string;
  etd_dt: string;
  eta_dt: string;
  shipper_nm: string;
  consignee_nm: string;
  pieces: number;
  gross_weight_kg: number;
  commodity_desc: string;
  status_cd: string;
}

interface AWBSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (awb: AWBData) => void;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '초안', color: 'bg-gray-500' },
  BOOKED: { label: '부킹', color: 'bg-blue-500' },
  ACCEPTED: { label: '수탁', color: 'bg-cyan-500' },
  DEPARTED: { label: '출발', color: 'bg-purple-500' },
  ARRIVED: { label: '도착', color: 'bg-green-500' },
};

export default function AWBSelectModal({ isOpen, onClose, onSelect }: AWBSelectModalProps) {
  const [awbList, setAwbList] = useState<AWBData[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    awbNo: '',
    flightNo: '',
    status: '',
  });
  const [selectedAwb, setSelectedAwb] = useState<AWBData | null>(null);

  const fetchAWBList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.awbNo) params.append('awb_no', filters.awbNo);
      if (filters.status) params.append('status', filters.status);

      const response = await fetch(`/api/awb/mawb?${params}`);
      const result = await response.json();
      if (Array.isArray(result)) {
        setAwbList(result);
      }
    } catch (error) {
      console.error('Error fetching AWB list:', error);
    } finally {
      setLoading(false);
    }
  }, [filters.awbNo, filters.status]);

  useEffect(() => {
    if (isOpen) {
      fetchAWBList();
      setSelectedAwb(null);
    }
  }, [isOpen, fetchAWBList]);

  const handleSearch = () => {
    fetchAWBList();
  };

  const handleSelect = () => {
    if (selectedAwb) {
      onSelect(selectedAwb);
      onClose();
    } else {
      alert('AWB를 선택해주세요.');
    }
  };

  const filteredList = awbList.filter(awb => {
    if (filters.flightNo && !awb.flight_no?.toLowerCase().includes(filters.flightNo.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-50 rounded-lg shadow-xl w-[1000px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">AWB 선택</h2>
          <p className="text-sm text-gray-500">Pre-Alert에 연동할 AWB를 선택하세요.</p>
        </div>

        {/* Search Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-500">MAWB No.</label>
              <input
                type="text"
                value={filters.awbNo}
                onChange={e => setFilters(p => ({ ...p, awbNo: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                placeholder="180-12345678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-500">편명</label>
              <input
                type="text"
                value={filters.flightNo}
                onChange={e => setFilters(p => ({ ...p, flightNo: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                placeholder="KE001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-500">상태</label>
              <select
                value={filters.status}
                onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
              >
                <option value="">전체</option>
                <option value="DRAFT">초안</option>
                <option value="BOOKED">부킹</option>
                <option value="DEPARTED">출발</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                검색
              </button>
            </div>
          </div>
        </div>

        {/* AWB List */}
        <div className="flex-1 overflow-y-auto p-4">
          <table className="w-full">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-sm font-medium w-10"></th>
                <th className="px-3 py-2 text-left text-sm font-medium">MAWB No.</th>
                <th className="px-3 py-2 text-left text-sm font-medium">편명</th>
                <th className="px-3 py-2 text-left text-sm font-medium">ETD</th>
                <th className="px-3 py-2 text-left text-sm font-medium">구간</th>
                <th className="px-3 py-2 text-left text-sm font-medium">화주</th>
                <th className="px-3 py-2 text-left text-sm font-medium">수하인</th>
                <th className="px-3 py-2 text-left text-sm font-medium">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                    로딩 중...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                    AWB 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredList.map(awb => (
                  <tr
                    key={awb.mawb_id}
                    onClick={() => setSelectedAwb(awb)}
                    className={`cursor-pointer transition-colors ${
                      selectedAwb?.mawb_id === awb.mawb_id
                        ? 'bg-purple-500/20'
                        : 'hover:bg-white'
                    }`}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="radio"
                        checked={selectedAwb?.mawb_id === awb.mawb_id}
                        onChange={() => setSelectedAwb(awb)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="px-3 py-2 text-sm font-medium text-blue-400">{awb.mawb_no}</td>
                    <td className="px-3 py-2 text-sm">{awb.flight_no}</td>
                    <td className="px-3 py-2 text-sm">{awb.etd_dt}</td>
                    <td className="px-3 py-2 text-sm">{awb.origin_airport_cd} → {awb.dest_airport_cd}</td>
                    <td className="px-3 py-2 text-sm">{awb.shipper_nm}</td>
                    <td className="px-3 py-2 text-sm">{awb.consignee_nm}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 text-xs rounded-full text-white ${statusConfig[awb.status_cd]?.color || 'bg-gray-500'}`}>
                        {statusConfig[awb.status_cd]?.label || awb.status_cd}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Selected AWB Info */}
        {selectedAwb && (
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="text-sm">
              <span className="text-gray-500">선택된 AWB: </span>
              <span className="font-medium text-purple-400">{selectedAwb.mawb_no}</span>
              <span className="text-gray-500 ml-4">구간: </span>
              <span className="font-medium">{selectedAwb.origin_airport_cd} → {selectedAwb.dest_airport_cd}</span>
              <span className="text-gray-500 ml-4">ETD: </span>
              <span className="font-medium">{selectedAwb.etd_dt}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            취소
          </button>
          <button
            onClick={handleSelect}
            disabled={!selectedAwb}
            className="px-6 py-2 font-semibold rounded-lg disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #E8A838 0%, #D4943A 100%)', color: '#0C1222' }}
          >
            선택
          </button>
        </div>
      </div>
    </div>
  );
}
