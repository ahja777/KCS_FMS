'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import SearchIconButton from '@/components/SearchIconButton';
import CodeSearchModal, { type CodeItem, type CodeType } from './CodeSearchModal';
import LocationCodeModal, { type LocationItem } from './LocationCodeModal';

// 화면설계서 185p (UI-G-01-00-05) 기준 HOUSE B/L CONSOLE 팝업

export interface HBLConsoleItem {
  id: number;
  date: string;
  srNo: string;
  jobNo: string;
  blType: string;
  mblNo: string;
  hblNo: string;
  shipper: string;
  packages: number;
  grossWeight: number;
  cbm: number;
  origin: string;
  dest: string;
  vessel: string;
  voyage: string;
  inputUser: string;
  consignee: string;
  status: string;
}

interface HBLConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (items: HBLConsoleItem[]) => void;
}

export default function HBLConsoleModal({ isOpen, onClose, onSelect }: HBLConsoleModalProps) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [customer, setCustomer] = useState('');
  const [blType, setBlType] = useState('');
  const [origin, setOrigin] = useState('');
  const [dest, setDest] = useState('');
  const [consolType, setConsolType] = useState('');
  const [consoleYn, setConsoleYn] = useState('');
  const [inputUser, setInputUser] = useState('');

  const [listData, setListData] = useState<HBLConsoleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // 하위 모달
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeModalType, setCodeModalType] = useState<CodeType>('customer');
  const [codeModalField, setCodeModalField] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationField, setLocationField] = useState('');

  // 기간 버튼 (DateRangeButtons 패턴 통일: 당일/일주일/한달/1년 + 추가: 3개월/6개월)
  const setDateRange = (days: number) => {
    const today = new Date();
    const from = new Date();
    from.setDate(today.getDate() - days);
    setDateFrom(from.toISOString().split('T')[0]);
    setDateTo(today.toISOString().split('T')[0]);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bl/hbl?direction=EXPORT');
      if (!res.ok) return;
      const rows = await res.json();
      const mapped: HBLConsoleItem[] = rows.map((r: any) => ({
        id: r.hbl_id,
        date: r.created_dtm || '',
        srNo: '',
        jobNo: '',
        blType: r.bl_type_cd || '',
        mblNo: r.mbl_no || '',
        hblNo: r.hbl_no || '',
        shipper: r.shipper_nm || '',
        packages: Number(r.total_pkg_qty) || 0,
        grossWeight: Number(r.gross_weight_kg) || 0,
        cbm: Number(r.volume_cbm) || 0,
        origin: r.pol_port_cd || '',
        dest: r.pod_port_cd || '',
        vessel: r.vessel_nm || '',
        voyage: r.voyage_no || '',
        inputUser: '',
        consignee: r.consignee_nm || '',
        status: r.status_cd || '',
      }));
      setListData(mapped);
    } catch (error) {
      console.error('HBL Console 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setSelectedIds(new Set());
      // 기본 1개월
      const today = new Date();
      const from = new Date();
      from.setMonth(today.getMonth() - 1);
      setDateFrom(from.toISOString().split('T')[0]);
      setDateTo(today.toISOString().split('T')[0]);
    }
  }, [isOpen, fetchData]);

  const filteredData = useMemo(() => {
    return listData.filter(item => {
      if (dateFrom && item.date < dateFrom) return false;
      if (dateTo && item.date > dateTo + ' 23:59') return false;
      if (customer && !item.shipper.toLowerCase().includes(customer.toLowerCase()) && !item.consignee.toLowerCase().includes(customer.toLowerCase())) return false;
      if (blType && item.blType !== blType) return false;
      if (origin && !item.origin.toLowerCase().includes(origin.toLowerCase())) return false;
      if (dest && !item.dest.toLowerCase().includes(dest.toLowerCase())) return false;
      if (inputUser && !item.inputUser.toLowerCase().includes(inputUser.toLowerCase())) return false;
      return true;
    });
  }, [listData, dateFrom, dateTo, customer, blType, origin, dest, inputUser]);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredData.length && filteredData.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map(i => i.id)));
    }
  };

  const handleApply = () => {
    const items = filteredData.filter(i => selectedIds.has(i.id));
    if (items.length > 0) { onSelect(items); onClose(); }
  };

  const handleReset = () => {
    setCustomer(''); setBlType(''); setOrigin(''); setDest('');
    setConsolType(''); setConsoleYn(''); setInputUser('');
    setSelectedIds(new Set());
    const today = new Date(); const from = new Date();
    from.setMonth(today.getMonth() - 1);
    setDateFrom(from.toISOString().split('T')[0]);
    setDateTo(today.toISOString().split('T')[0]);
  };

  const openCodeModal = (field: string, codeType: CodeType) => {
    setCodeModalField(field); setCodeModalType(codeType); setShowCodeModal(true);
  };
  const handleCodeSelect = (item: CodeItem) => {
    if (codeModalField === 'customer') setCustomer(item.name);
    setShowCodeModal(false);
  };
  const openLocationModal = (field: string) => {
    setLocationField(field); setShowLocationModal(true);
  };
  const handleLocationSelect = (item: LocationItem) => {
    if (locationField === 'origin') setOrigin(item.code);
    else if (locationField === 'dest') setDest(item.code);
    setShowLocationModal(false);
  };

  if (!isOpen) return null;

  const selectedItems = filteredData.filter(i => selectedIds.has(i.id));
  const totalPkg = selectedItems.reduce((s, i) => s + i.packages, 0);
  const totalWeight = selectedItems.reduce((s, i) => s + i.grossWeight, 0);
  const totalCbm = selectedItems.reduce((s, i) => s + i.cbm, 0);

  const inputCls = 'flex-1 h-[38px] px-3 text-sm bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-400 focus:border-blue-400';
  const selectCls = 'flex-1 h-[38px] px-3 text-sm bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-400';
  const labelCls = 'block text-xs font-medium text-gray-500 mb-1';
  const quickBtnCls = 'px-2.5 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-gray-100 hover:border-[#E8A838] transition-colors whitespace-nowrap';

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="bg-gray-50 rounded-lg shadow-xl w-full max-h-[90vh] flex flex-col" style={{ maxWidth: '1440px' }}>
          {/* ── Header ── */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-[#1A2744] rounded-t-lg">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              B/L CONSOLE 팝업
            </h2>
            <button onClick={onClose} className="text-white/70 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* ── 검색조건 ── */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            {/* 1행: 등록일자 + 기간버튼 + 조회/초기화 */}
            <div className="flex items-end gap-3">
              <div className="flex-shrink-0">
                <label className={labelCls}>등록일자</label>
                <div className="flex gap-1 items-center">
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-[150px] h-[38px] px-3 text-sm bg-white border border-gray-200 rounded-lg" />
                  <span className="text-gray-400 text-sm flex-shrink-0">~</span>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-[150px] h-[38px] px-3 text-sm bg-white border border-gray-200 rounded-lg" />
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0 pb-[1px]">
                <button type="button" onClick={() => setDateRange(0)} className={quickBtnCls}>당일</button>
                <button type="button" onClick={() => setDateRange(7)} className={quickBtnCls}>1주일</button>
                <button type="button" onClick={() => setDateRange(30)} className={quickBtnCls}>1개월</button>
                <button type="button" onClick={() => setDateRange(90)} className={quickBtnCls}>3개월</button>
                <button type="button" onClick={() => setDateRange(180)} className={quickBtnCls}>6개월</button>
                <button type="button" onClick={() => setDateRange(365)} className={quickBtnCls}>1년</button>
              </div>
              <div className="flex gap-2 ml-auto flex-shrink-0 pb-[1px]">
                <button type="button" onClick={fetchData} className="px-4 py-1.5 text-sm bg-[#1A2744] text-white rounded-lg hover:bg-[#243354] font-medium">조회</button>
                <button type="button" onClick={handleReset} className="px-4 py-1.5 text-sm bg-white text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-100">초기화</button>
              </div>
            </div>

            {/* 2행: 거래처, B/L Type, Origin, Destn */}
            <div className="grid grid-cols-4 gap-4 mt-3">
              <div>
                <label className={labelCls}>거래처</label>
                <div className="flex gap-1">
                  <input type="text" value={customer} onChange={e => setCustomer(e.target.value)} placeholder="거래처" className={inputCls} />
                  <SearchIconButton onClick={() => openCodeModal('customer', 'customer')} />
                </div>
              </div>
              <div>
                <label className={labelCls}>B/L Type</label>
                <select value={blType} onChange={e => setBlType(e.target.value)} className={selectCls}>
                  <option value="">전체</option>
                  <option value="OBL">OBL</option>
                  <option value="SWB">SWB</option>
                  <option value="SEAWAY BILL">SEAWAY BILL</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Origin</label>
                <div className="flex gap-1">
                  <input type="text" value={origin} onChange={e => setOrigin(e.target.value)} placeholder="KRPUS" className={inputCls} />
                  <SearchIconButton onClick={() => openLocationModal('origin')} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Destn</label>
                <div className="flex gap-1">
                  <input type="text" value={dest} onChange={e => setDest(e.target.value)} placeholder="USLAX" className={inputCls} />
                  <SearchIconButton onClick={() => openLocationModal('dest')} />
                </div>
              </div>
            </div>

            {/* 3행: Type, Console, 입력사원 */}
            <div className="grid grid-cols-4 gap-4 mt-3">
              <div>
                <label className={labelCls}>Type</label>
                <select value={consolType} onChange={e => setConsolType(e.target.value)} className={selectCls}>
                  <option value="">전체</option>
                  <option value="FCL">FCL</option>
                  <option value="LCL">LCL</option>
                  <option value="BULK">BULK</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Console</label>
                <select value={consoleYn} onChange={e => setConsoleYn(e.target.value)} className={selectCls}>
                  <option value="">전체</option>
                  <option value="Y">Y</option>
                  <option value="N">N</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>입력사원</label>
                <input type="text" value={inputUser} onChange={e => setInputUser(e.target.value)} placeholder="사원명" className={inputCls} />
              </div>
            </div>
          </div>

          {/* ── 결과 정보 바 (전체선택 좌측 배치) ── */}
          <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center bg-white">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredData.length && filteredData.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">전체선택</span>
              </label>
              <span className="text-sm text-gray-500">
                검색 결과: <strong className="text-[#E8A838]">{filteredData.length}</strong>건
                {selectedIds.size > 0 && <span className="ml-2">| 선택: <strong className="text-[#2563EB]">{selectedIds.size}</strong>건</span>}
              </span>
            </div>
          </div>

          {/* ── 데이터 테이블 ── */}
          <div className="flex-1 overflow-auto min-h-0 p-4">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-auto" style={{ maxHeight: '420px' }}>
                <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: 40 }} />
                    <col style={{ width: 40 }} />
                    <col style={{ width: 90 }} />
                    <col style={{ width: 80 }} />
                    <col style={{ width: 70 }} />
                    <col style={{ width: 60 }} />
                    <col style={{ width: 145 }} />
                    <col style={{ width: 130 }} />
                    <col style={{ width: 140 }} />
                    <col style={{ width: 65 }} />
                    <col style={{ width: 70 }} />
                    <col style={{ width: 55 }} />
                    <col style={{ width: 65 }} />
                    <col style={{ width: 65 }} />
                    <col style={{ width: 110 }} />
                    <col style={{ width: 60 }} />
                    <col style={{ width: 70 }} />
                  </colgroup>
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="p-2 text-center font-medium border-b border-gray-200">
                        <input type="checkbox" checked={selectedIds.size === filteredData.length && filteredData.length > 0} onChange={toggleSelectAll} className="w-3.5 h-3.5 rounded" />
                      </th>
                      <th className="p-2 text-center font-medium border-b border-gray-200">No</th>
                      <th className="p-2 text-center font-medium border-b border-gray-200">Date</th>
                      <th className="p-2 text-center font-medium border-b border-gray-200">S/R.No</th>
                      <th className="p-2 text-center font-medium border-b border-gray-200">Job.No.</th>
                      <th className="p-2 text-center font-medium border-b border-gray-200">B/L Type</th>
                      <th className="p-2 text-center font-medium border-b border-gray-200">M.B/L No.</th>
                      <th className="p-2 text-center font-medium border-b border-gray-200">H.B/L No.</th>
                      <th className="p-2 text-center font-medium border-b border-gray-200">Shipper</th>
                      <th className="p-2 text-center font-medium border-b border-gray-200">Package</th>
                      <th className="p-2 text-center font-medium border-b border-gray-200">G.WT</th>
                      <th className="p-2 text-center font-medium border-b border-gray-200">CBM</th>
                      <th className="p-2 text-center font-medium border-b border-gray-200">Origin</th>
                      <th className="p-2 text-center font-medium border-b border-gray-200">Dest</th>
                      <th className="p-2 text-center font-medium border-b border-gray-200">Vessel</th>
                      <th className="p-2 text-center font-medium border-b border-gray-200">Voyage</th>
                      <th className="p-2 text-center font-medium border-b border-gray-200">입력사원</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={17} className="p-8 text-center text-gray-400">
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                            로딩 중...
                          </div>
                        </td>
                      </tr>
                    ) : filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={17} className="p-8 text-center text-gray-400">조회된 데이터가 없습니다.</td>
                      </tr>
                    ) : (
                      filteredData.map((item, idx) => {
                        const sel = selectedIds.has(item.id);
                        return (
                          <tr key={item.id} className={`border-t border-gray-200 cursor-pointer transition-colors ${sel ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}`} onClick={() => toggleSelect(item.id)}>
                            <td className="p-2 text-center">
                              <input type="checkbox" checked={sel} onChange={() => toggleSelect(item.id)} onClick={e => e.stopPropagation()} className="w-3.5 h-3.5 rounded" />
                            </td>
                            <td className="p-2 text-center text-gray-500">{idx + 1}</td>
                            <td className="p-2 text-center truncate">{item.date}</td>
                            <td className="p-2 text-center text-[#E8A838] font-medium truncate">{item.srNo || '-'}</td>
                            <td className="p-2 text-center truncate">{item.jobNo || '-'}</td>
                            <td className="p-2 text-center">{item.blType || '-'}</td>
                            <td className="p-2 text-left font-mono truncate" title={item.mblNo}>{item.mblNo || '-'}</td>
                            <td className="p-2 text-left font-mono text-blue-600 truncate" title={item.hblNo}>{item.hblNo || '-'}</td>
                            <td className="p-2 text-left truncate" title={item.shipper}>{item.shipper || '-'}</td>
                            <td className="p-2 text-right">{item.packages > 0 ? item.packages.toLocaleString() : '-'}</td>
                            <td className="p-2 text-right">{item.grossWeight > 0 ? item.grossWeight.toLocaleString() : '-'}</td>
                            <td className="p-2 text-right">{item.cbm > 0 ? item.cbm.toFixed(1) : '-'}</td>
                            <td className="p-2 text-center">{item.origin || '-'}</td>
                            <td className="p-2 text-center">{item.dest || '-'}</td>
                            <td className="p-2 text-left truncate" title={item.vessel}>{item.vessel || '-'}</td>
                            <td className="p-2 text-center">{item.voyage || '-'}</td>
                            <td className="p-2 text-center truncate">{item.inputUser || '-'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── 선택 합계 ── */}
          {selectedIds.size > 0 && (
            <div className="px-4 py-2 bg-blue-50 border-t border-blue-200">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-blue-800">선택 합계 ({selectedIds.size}건):</span>
                <div className="flex gap-6 text-blue-800">
                  <span>Package: <strong>{totalPkg.toLocaleString()}</strong></span>
                  <span>G.Weight: <strong>{totalWeight.toLocaleString()} KG</strong></span>
                  <span>CBM: <strong>{totalCbm.toFixed(2)}</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* ── Footer 버튼 ── */}
          <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-50 text-gray-900 rounded-lg hover:bg-gray-100 border border-gray-200">닫기</button>
            <button type="button" onClick={handleApply} disabled={selectedIds.size === 0} className="px-4 py-2 bg-[#E8A838] text-[#0C1222] font-semibold rounded-lg hover:bg-[#D4943A] disabled:opacity-50 disabled:cursor-not-allowed">
              적용 ({selectedIds.size})
            </button>
          </div>
        </div>
      </div>

      {/* 하위 모달 */}
      <CodeSearchModal isOpen={showCodeModal} onClose={() => setShowCodeModal(false)} onSelect={handleCodeSelect} codeType={codeModalType} title={codeModalField === 'customer' ? '거래처 조회' : '코드 조회'} />
      <LocationCodeModal isOpen={showLocationModal} onClose={() => setShowLocationModal(false)} onSelect={handleLocationSelect} type="seaport" />
    </>
  );
}
