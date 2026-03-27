'use client';

import { useState, useEffect, useCallback } from 'react';
import LocationCodeModal, { LocationItem } from './LocationCodeModal';
import CarrierCodeModal, { CarrierItem } from './CarrierCodeModal';
import AirlineCodeModal, { AirlineItem } from './AirlineCodeModal';
import CodeSearchModal, { CodeItem } from './CodeSearchModal';
import SearchIconButton from '@/components/SearchIconButton';

interface CorporateRateSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (data: any) => void;
  type: 'sea' | 'air';
  defaultOrigin?: string;
  defaultDestination?: string;
}

interface RateRow {
  RATE_ID: number;
  RATE_NO: string;
  TRANSPORT_MODE: string;
  CUSTOMER_NM: string;
  CARRIER_CD: string;
  CARRIER_NM: string;
  POL_CD: string;
  POL_NM: string;
  POD_CD: string;
  POD_NM: string;
  INPUT_EMPLOYEE: string;
  CREATED_DATE: string;
  details: RateDetail[];
}

interface RateDetail {
  DETAIL_ID: number;
  FREIGHT_CD: string;
  CURRENCY_CD: string;
  // Sea fields
  RATE_MIN: number;
  RATE_BL: number;
  RATE_RTON: number;
  CNTR_DRY_20: number;
  CNTR_DRY_40: number;
  RATE_BULK: number;
  // Air fields
  RATE_AWB: number;
  RATE_MIN_AIR: number;
  RATE_45L: number;
  RATE_45: number;
  RATE_100: number;
  RATE_300: number;
  RATE_500: number;
  RATE_1000: number;
}

// Flattened row for display (master + detail combined)
interface DisplayRow {
  key: string;
  rateId: number;
  rateNo: string;
  date: string;
  customerNm: string;
  carrierCd: string;
  carrierNm: string;
  polCd: string;
  polNm: string;
  podCd: string;
  podNm: string;
  freightCd: string;
  currencyCd: string;
  // Sea
  rateMin: number;
  rateBl: number;
  rateRton: number;
  cntr20: number;
  cntr40: number;
  rateBulk: number;
  // Air
  rateAwb: number;
  rateMinAir: number;
  rate45l: number;
  rate45: number;
  rate100: number;
  rate300: number;
  rate500: number;
  rate1000: number;
  // original data for passing back
  _master: RateRow;
  _detail: RateDetail;
}

export default function CorporateRateSearchModal({
  isOpen,
  onClose,
  onSelect,
  type,
  defaultOrigin = '',
  defaultDestination = '',
}: CorporateRateSearchModalProps) {
  // Search conditions
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [carrierCd, setCarrierCd] = useState('');
  const [polCd, setPolCd] = useState(defaultOrigin);
  const [polNm, setPolNm] = useState('');
  const [podCd, setPodCd] = useState(defaultDestination);
  const [podNm, setPodNm] = useState('');
  const [inputEmployee, setInputEmployee] = useState('');

  // Location modals
  const [showPolModal, setShowPolModal] = useState(false);
  const [showPodModal, setShowPodModal] = useState(false);
  // Carrier/Airline modal
  const [showCarrierModal, setShowCarrierModal] = useState(false);
  const [showAirlineModal, setShowAirlineModal] = useState(false);
  // Employee search modal
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);

  // Data
  const [rows, setRows] = useState<DisplayRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPolCd(defaultOrigin);
      setPodCd(defaultDestination);
      setPolNm('');
      setPodNm('');
      setCarrierCd('');
      setInputEmployee('');
      setSelectedKeys(new Set());
      // Set default date range: 3 months back
      const today = new Date();
      const from = new Date();
      from.setMonth(today.getMonth() - 3);
      setDateTo(today.toISOString().split('T')[0]);
      setDateFrom(from.toISOString().split('T')[0]);
    }
  }, [isOpen, defaultOrigin, defaultDestination]);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const transportMode = type === 'sea' ? 'SEA' : 'AIR';
      const params = new URLSearchParams({ transportMode });
      if (polCd) params.set('polCd', polCd);
      if (podCd) params.set('podCd', podCd);
      if (carrierCd) params.set('carrierCd', carrierCd);

      const res = await fetch(`/api/logis/rate/corporate?${params.toString()}`);
      if (!res.ok) throw new Error('API error');
      const data: RateRow[] = await res.json();

      // Flatten: one row per rate + detail combination
      const flat: DisplayRow[] = [];
      for (const master of data) {
        // Filter by date range (client-side)
        if (dateFrom && master.CREATED_DATE < dateFrom) continue;
        if (dateTo && master.CREATED_DATE > dateTo) continue;
        // Filter by input employee
        if (inputEmployee && !(master.INPUT_EMPLOYEE || '').includes(inputEmployee)) continue;

        if (master.details && master.details.length > 0) {
          for (const detail of master.details) {
            flat.push({
              key: `${master.RATE_ID}-${detail.DETAIL_ID}`,
              rateId: master.RATE_ID,
              rateNo: master.RATE_NO,
              date: master.CREATED_DATE,
              customerNm: master.CUSTOMER_NM || '',
              carrierCd: master.CARRIER_CD || '',
              carrierNm: master.CARRIER_NM || '',
              polCd: master.POL_CD || '',
              polNm: master.POL_NM || '',
              podCd: master.POD_CD || '',
              podNm: master.POD_NM || '',
              freightCd: detail.FREIGHT_CD || '',
              currencyCd: detail.CURRENCY_CD || 'USD',
              rateMin: Number(detail.RATE_MIN) || 0,
              rateBl: Number(detail.RATE_BL) || 0,
              rateRton: Number(detail.RATE_RTON) || 0,
              cntr20: Number(detail.CNTR_DRY_20) || 0,
              cntr40: Number(detail.CNTR_DRY_40) || 0,
              rateBulk: Number(detail.RATE_BULK) || 0,
              rateAwb: Number(detail.RATE_AWB) || 0,
              rateMinAir: Number(detail.RATE_MIN_AIR) || 0,
              rate45l: Number(detail.RATE_45L) || 0,
              rate45: Number(detail.RATE_45) || 0,
              rate100: Number(detail.RATE_100) || 0,
              rate300: Number(detail.RATE_300) || 0,
              rate500: Number(detail.RATE_500) || 0,
              rate1000: Number(detail.RATE_1000) || 0,
              _master: master,
              _detail: detail,
            });
          }
        } else {
          // Master with no detail rows
          flat.push({
            key: `${master.RATE_ID}-0`,
            rateId: master.RATE_ID,
            rateNo: master.RATE_NO,
            date: master.CREATED_DATE,
            customerNm: master.CUSTOMER_NM || '',
            carrierCd: master.CARRIER_CD || '',
            carrierNm: master.CARRIER_NM || '',
            polCd: master.POL_CD || '',
            polNm: master.POL_NM || '',
            podCd: master.POD_CD || '',
            podNm: master.POD_NM || '',
            freightCd: '',
            currencyCd: 'USD',
            rateMin: 0, rateBl: 0, rateRton: 0, cntr20: 0, cntr40: 0, rateBulk: 0,
            rateAwb: 0, rateMinAir: 0, rate45l: 0, rate45: 0, rate100: 0, rate300: 0, rate500: 0, rate1000: 0,
            _master: master,
            _detail: {} as RateDetail,
          });
        }
      }
      setRows(flat);
    } catch (err) {
      console.error('Corporate rate search error:', err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [type, polCd, podCd, carrierCd, dateFrom, dateTo, inputEmployee]);

  // Auto-fetch on open
  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Quick date buttons
  const setDateRange = (days: number) => {
    const today = new Date();
    const from = new Date();
    from.setDate(today.getDate() - days);
    setDateFrom(from.toISOString().split('T')[0]);
    setDateTo(today.toISOString().split('T')[0]);
  };

  // Checkbox handling
  const toggleSelectAll = () => {
    if (selectedKeys.size === rows.length) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(rows.map(r => r.key)));
    }
  };

  const toggleSelect = (key: string) => {
    const next = new Set(selectedKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setSelectedKeys(next);
  };

  // Apply selection
  const handleApply = () => {
    const selected = rows.filter(r => selectedKeys.has(r.key));
    if (selected.length > 0) {
      onSelect(selected);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedKeys(new Set());
    onClose();
  };

  const handleReset = () => {
    setDateFrom('');
    setDateTo('');
    setCarrierCd('');
    setPolCd('');
    setPolNm('');
    setPodCd('');
    setPodNm('');
    setInputEmployee('');
    setSelectedKeys(new Set());
  };

  // Location modal handlers
  const handlePolSelect = (item: LocationItem) => {
    setPolCd(item.code);
    setPolNm(item.nameKr);
    setShowPolModal(false);
  };

  const handlePodSelect = (item: LocationItem) => {
    setPodCd(item.code);
    setPodNm(item.nameKr);
    setShowPodModal(false);
  };

  // Carrier/Airline 선택
  const handleCarrierSelect = (item: CarrierItem) => {
    setCarrierCd(item.code);
    setShowCarrierModal(false);
  };

  const handleAirlineSelect = (item: AirlineItem) => {
    setCarrierCd(item.code);
    setShowAirlineModal(false);
  };

  // 입력사원 선택
  const handleEmployeeSelect = (item: CodeItem) => {
    setInputEmployee(item.name);
    setShowEmployeeModal(false);
  };

  // Format number for display
  const fmt = (v: number) => {
    if (!v || v === 0) return '-';
    return v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  if (!isOpen) return null;

  const isSea = type === 'sea';
  const locationType = isSea ? 'seaport' : 'airport';

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-50 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-[#1A2744] rounded-t-lg">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              기업운임 조회 ({isSea ? '해상' : '항공'})
            </h2>
            <button onClick={handleClose} className="text-white/70 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search conditions */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-6 gap-3">
              {/* Date range */}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">기간</label>
                <div className="flex gap-1 items-center">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="flex-1 h-[38px] px-2 text-sm bg-white border border-gray-200 rounded-lg"
                  />
                  <span className="text-gray-400 text-sm">~</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="flex-1 h-[38px] px-2 text-sm bg-white border border-gray-200 rounded-lg"
                  />
                </div>
              </div>

              {/* LINE (Carrier) */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {isSea ? 'LINE(선사)' : 'LINE(항공사)'}
                </label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={carrierCd}
                    onChange={(e) => setCarrierCd(e.target.value)}
                    placeholder={isSea ? 'HMM, MSC...' : 'KE, OZ...'}
                    className="flex-1 h-[38px] px-3 text-sm bg-white border border-gray-200 rounded-lg"
                  />
                  <SearchIconButton onClick={() => isSea ? setShowCarrierModal(true) : setShowAirlineModal(true)} />
                </div>
              </div>

              {/* Origin */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {isSea ? '출발항(Loading)' : 'Origin'}
                </label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={polCd}
                    onChange={(e) => setPolCd(e.target.value)}
                    placeholder={isSea ? 'KRPUS' : 'ICN'}
                    className="flex-1 h-[38px] px-3 text-sm bg-white border border-gray-200 rounded-lg"
                  />
                  <SearchIconButton onClick={() => setShowPolModal(true)} />
                </div>
              </div>

              {/* Destination */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {isSea ? '도착지(Destn)' : 'Destination'}
                </label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={podCd}
                    onChange={(e) => setPodCd(e.target.value)}
                    placeholder={isSea ? 'USLAX' : 'LAX'}
                    className="flex-1 h-[38px] px-3 text-sm bg-white border border-gray-200 rounded-lg"
                  />
                  <SearchIconButton onClick={() => setShowPodModal(true)} />
                </div>
              </div>

              {/* Input employee */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">입력사원</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={inputEmployee}
                    onChange={(e) => setInputEmployee(e.target.value)}
                    placeholder="사원명"
                    className="flex-1 h-[38px] px-3 text-sm bg-white border border-gray-200 rounded-lg"
                  />
                  <SearchIconButton onClick={() => setShowEmployeeModal(true)} />
                </div>
              </div>
            </div>

            {/* Quick date buttons + action buttons */}
            <div className="flex justify-between items-center mt-3">
              <div className="flex gap-1">
                <button onClick={() => setDateRange(7)} className="px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-gray-100">1주</button>
                <button onClick={() => setDateRange(30)} className="px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-gray-100">1개월</button>
                <button onClick={() => setDateRange(90)} className="px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-gray-100">3개월</button>
                <button onClick={() => setDateRange(180)} className="px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-gray-100">6개월</button>
                <button onClick={() => setDateRange(365)} className="px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-gray-100">1년</button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={fetchData}
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
          </div>

          {/* Results table */}
          <div className="flex-1 overflow-auto p-4">
            <div className="text-sm text-gray-500 mb-2">
              검색 결과: {rows.length}건 | 선택: {selectedKeys.size}건
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-auto max-h-[400px]">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    {isSea ? (
                      <tr>
                        <th className="p-2 text-center font-medium w-10">
                          <input
                            type="checkbox"
                            checked={rows.length > 0 && selectedKeys.size === rows.length}
                            onChange={toggleSelectAll}
                            className="rounded"
                          />
                        </th>
                        <th className="p-2 text-center font-medium w-10">No</th>
                        <th className="p-2 text-center font-medium">Date</th>
                        <th className="p-2 text-left font-medium">거래처</th>
                        <th className="p-2 text-center font-medium">Line</th>
                        <th className="p-2 text-center font-medium">Loading</th>
                        <th className="p-2 text-center font-medium">Destn</th>
                        <th className="p-2 text-center font-medium">운임코드</th>
                        <th className="p-2 text-right font-medium">MIN</th>
                        <th className="p-2 text-right font-medium">BL</th>
                        <th className="p-2 text-right font-medium">R.TON</th>
                        <th className="p-2 text-right font-medium">20&apos;</th>
                        <th className="p-2 text-right font-medium">40&apos;</th>
                        <th className="p-2 text-right font-medium">Bulk</th>
                      </tr>
                    ) : (
                      <tr>
                        <th className="p-2 text-center font-medium w-10">
                          <input
                            type="checkbox"
                            checked={rows.length > 0 && selectedKeys.size === rows.length}
                            onChange={toggleSelectAll}
                            className="rounded"
                          />
                        </th>
                        <th className="p-2 text-center font-medium w-10">No</th>
                        <th className="p-2 text-center font-medium">Date</th>
                        <th className="p-2 text-left font-medium">거래처</th>
                        <th className="p-2 text-center font-medium">Airline</th>
                        <th className="p-2 text-center font-medium">Origin</th>
                        <th className="p-2 text-center font-medium">Destn</th>
                        <th className="p-2 text-center font-medium">운임코드</th>
                        <th className="p-2 text-right font-medium">AWB</th>
                        <th className="p-2 text-right font-medium">Min</th>
                        <th className="p-2 text-right font-medium">-45</th>
                        <th className="p-2 text-right font-medium">+45</th>
                        <th className="p-2 text-right font-medium">100</th>
                        <th className="p-2 text-right font-medium">300</th>
                        <th className="p-2 text-right font-medium">500</th>
                        <th className="p-2 text-right font-medium">1000</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={isSea ? 14 : 16} className="p-8 text-center text-gray-400">
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                            로딩 중...
                          </div>
                        </td>
                      </tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td colSpan={isSea ? 14 : 16} className="p-8 text-center text-gray-400">
                          조회된 기업운임이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      rows.map((row, idx) => (
                        <tr
                          key={row.key}
                          className={`border-t border-gray-200 cursor-pointer ${
                            selectedKeys.has(row.key) ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'
                          }`}
                          onClick={() => toggleSelect(row.key)}
                        >
                          <td className="p-2 text-center">
                            <input
                              type="checkbox"
                              checked={selectedKeys.has(row.key)}
                              onChange={() => toggleSelect(row.key)}
                              className="rounded"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="p-2 text-center text-gray-500">{idx + 1}</td>
                          <td className="p-2 text-center text-sm">{row.date || '-'}</td>
                          <td className="p-2 text-left text-sm truncate max-w-[120px]" title={row.customerNm}>{row.customerNm || '-'}</td>
                          <td className="p-2 text-center text-sm font-medium text-blue-600">{row.carrierCd || row.carrierNm || '-'}</td>
                          <td className="p-2 text-center text-sm">{row.polCd || '-'}</td>
                          <td className="p-2 text-center text-sm">{row.podCd || '-'}</td>
                          <td className="p-2 text-center text-sm">{row.freightCd || '-'}</td>
                          {isSea ? (
                            <>
                              <td className="p-2 text-right text-sm font-mono">{fmt(row.rateMin)}</td>
                              <td className="p-2 text-right text-sm font-mono">{fmt(row.rateBl)}</td>
                              <td className="p-2 text-right text-sm font-mono">{fmt(row.rateRton)}</td>
                              <td className="p-2 text-right text-sm font-mono">{fmt(row.cntr20)}</td>
                              <td className="p-2 text-right text-sm font-mono">{fmt(row.cntr40)}</td>
                              <td className="p-2 text-right text-sm font-mono">{fmt(row.rateBulk)}</td>
                            </>
                          ) : (
                            <>
                              <td className="p-2 text-right text-sm font-mono">{fmt(row.rateAwb)}</td>
                              <td className="p-2 text-right text-sm font-mono">{fmt(row.rateMinAir)}</td>
                              <td className="p-2 text-right text-sm font-mono">{fmt(row.rate45l)}</td>
                              <td className="p-2 text-right text-sm font-mono">{fmt(row.rate45)}</td>
                              <td className="p-2 text-right text-sm font-mono">{fmt(row.rate100)}</td>
                              <td className="p-2 text-right text-sm font-mono">{fmt(row.rate300)}</td>
                              <td className="p-2 text-right text-sm font-mono">{fmt(row.rate500)}</td>
                              <td className="p-2 text-right text-sm font-mono">{fmt(row.rate1000)}</td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-50 text-gray-900 rounded-lg hover:bg-gray-100"
            >
              닫기
            </button>
            <button
              onClick={handleApply}
              disabled={selectedKeys.size === 0}
              className="px-4 py-2 bg-[#E8A838] text-[#0C1222] font-semibold rounded-lg hover:bg-[#D4943A] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              적용 ({selectedKeys.size})
            </button>
          </div>
        </div>
      </div>

      {/* Location code modals */}
      <LocationCodeModal
        isOpen={showPolModal}
        onClose={() => setShowPolModal(false)}
        onSelect={handlePolSelect}
        type={locationType as 'seaport' | 'airport'}
      />
      <LocationCodeModal
        isOpen={showPodModal}
        onClose={() => setShowPodModal(false)}
        onSelect={handlePodSelect}
        type={locationType as 'seaport' | 'airport'}
      />

      {/* Carrier modal (해상) */}
      <CarrierCodeModal
        isOpen={showCarrierModal}
        onClose={() => setShowCarrierModal(false)}
        onSelect={handleCarrierSelect}
      />

      {/* Airline modal (항공) */}
      <AirlineCodeModal
        isOpen={showAirlineModal}
        onClose={() => setShowAirlineModal(false)}
        onSelect={handleAirlineSelect}
      />

      {/* Employee search modal */}
      <CodeSearchModal
        isOpen={showEmployeeModal}
        onClose={() => setShowEmployeeModal(false)}
        onSelect={handleEmployeeSelect}
        codeType="manager"
      />
    </>
  );
}
