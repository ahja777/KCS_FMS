'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import LocationCodeModal, { LocationType, LocationItem } from '@/components/popup/LocationCodeModal';
import CodeSearchModal, { CodeType, CodeItem } from '@/components/popup/CodeSearchModal';
import { getToday } from '@/components/DateRangeButtons';

interface QuoteRequest {
  id: string;
  requestDate: string;
  requestNo: string;
  bizType: string;
  ioType: string;
  originCd: string;
  originNm: string;
  destCd: string;
  destNm: string;
  customerNm: string;
  incoterms: string;
  status: string;
  inputEmployee: string;
  totalAmount: number;
  currencyCd: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  '01': { label: '미요청', color: '#6B7280', bgColor: '#F3F4F6' },
  '02': { label: '요청', color: '#2563EB', bgColor: '#DBEAFE' },
  '03': { label: '확인', color: '#7C3AED', bgColor: '#EDE9FE' },
  '04': { label: '승인', color: '#059669', bgColor: '#D1FAE5' },
  '05': { label: '거절', color: '#DC2626', bgColor: '#FEE2E2' },
};

interface SearchFilters {
  bizType: string;
  ioType: string;
  dateFrom: string;
  dateTo: string;
  originAir: string;
  originAirCd: string;
  destAir: string;
  destAirCd: string;
  originSea: string;
  originSeaCd: string;
  destSea: string;
  destSeaCd: string;
  customer: string;
  customerCd: string;
  origin: string;
  destination: string;
}

const today = getToday();
const initialFilters: SearchFilters = {
  bizType: 'SEA',
  ioType: '',
  dateFrom: today,
  dateTo: today,
  originAir: '',
  originAirCd: '',
  destAir: '',
  destAirCd: '',
  originSea: '',
  originSeaCd: '',
  destSea: '',
  destSeaCd: '',
  customer: '',
  customerCd: '',
  origin: '',
  destination: '',
};

export default function QuoteRequestListPage() {
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);

  const handleConfirmClose = () => {
    setShowCloseModal(false);
    router.back();
  };

  useCloseConfirm({
    showModal: showCloseModal,
    setShowModal: setShowCloseModal,
    onConfirmClose: handleConfirmClose,
  });

  const [allData, setAllData] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // 위치 검색 모달
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSearchType, setLocationSearchType] = useState<LocationType>('seaport');
  const [locationSearchField, setLocationSearchField] = useState<string>('');

  // 거래처 검색 모달
  const [showCodeSearchModal, setShowCodeSearchModal] = useState(false);
  const [codeSearchType] = useState<CodeType>('customer');

  const fetchData = useCallback(async (searchFilters?: SearchFilters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const f = searchFilters || filters;
      if (f.bizType) params.set('bizType', f.bizType);
      if (f.ioType) params.set('ioType', f.ioType);
      if (f.dateFrom) params.set('dateFrom', f.dateFrom);
      if (f.dateTo) params.set('dateTo', f.dateTo);
      if (f.customer) params.set('customer', f.customer);
      // origin/destination - 공항+항구+텍스트 조합
      const originSearch = f.originAir || f.originSea || f.origin;
      const destSearch = f.destAir || f.destSea || f.destination;
      if (originSearch) params.set('origin', originSearch);
      if (destSearch) params.set('destination', destSearch);

      const res = await fetch(`/api/quote/request?${params.toString()}`);
      if (!res.ok) throw new Error('조회 실패');
      const rows = await res.json();
      setAllData(rows.map((r: Record<string, unknown>) => ({
        id: String(r.id),
        requestDate: r.requestDate as string,
        requestNo: r.requestNo as string,
        bizType: r.bizType as string,
        ioType: r.ioType as string,
        originCd: r.originCd as string,
        originNm: r.originNm as string,
        destCd: r.destCd as string,
        destNm: r.destNm as string,
        customerNm: r.customerNm as string,
        incoterms: r.incoterms as string,
        status: r.status as string,
        inputEmployee: r.inputEmployee as string,
        totalAmount: Number(r.totalAmount) || 0,
        currencyCd: (r.currencyCd as string) || 'USD',
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 기간 빠른선택 버튼
  const setDateRange = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    setFilters(prev => ({
      ...prev,
      dateFrom: from.toISOString().split('T')[0],
      dateTo: to.toISOString().split('T')[0],
    }));
  };

  const handleSearch = () => {
    setSelectedRows([]);
    setCurrentPage(1);
    fetchData(filters);
  };

  const handleReset = () => {
    setFilters(initialFilters);
    setSelectedRows([]);
    setCurrentPage(1);
    fetchData(initialFilters);
  };

  const handleDelete = async () => {
    if (selectedRows.length === 0) {
      alert('삭제할 항목을 선택해주세요.');
      return;
    }
    if (!confirm(`${selectedRows.length}건을 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/quote/request?ids=${selectedRows.join(',')}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('삭제 실패');
      setSelectedRows([]);
      fetchData();
      alert('삭제되었습니다.');
    } catch (err) {
      console.error(err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleLocationSearch = (field: string) => {
    setLocationSearchField(field);
    if (field === 'originAir' || field === 'destAir') {
      setLocationSearchType('airport');
    } else if (field === 'origin' || field === 'destination') {
      setLocationSearchType('city');
    } else {
      setLocationSearchType('seaport');
    }
    setShowLocationModal(true);
  };

  const handleLocationSelect = (item: LocationItem) => {
    if (locationSearchField === 'originAir') {
      setFilters(prev => ({ ...prev, originAirCd: item.code, originAir: item.nameKr }));
    } else if (locationSearchField === 'destAir') {
      setFilters(prev => ({ ...prev, destAirCd: item.code, destAir: item.nameKr }));
    } else if (locationSearchField === 'originSea') {
      setFilters(prev => ({ ...prev, originSeaCd: item.code, originSea: item.nameKr }));
    } else if (locationSearchField === 'destSea') {
      setFilters(prev => ({ ...prev, destSeaCd: item.code, destSea: item.nameKr }));
    } else if (locationSearchField === 'origin') {
      setFilters(prev => ({ ...prev, origin: item.nameKr || item.code }));
    } else if (locationSearchField === 'destination') {
      setFilters(prev => ({ ...prev, destination: item.nameKr || item.code }));
    }
    setShowLocationModal(false);
  };

  const handleCodeSelect = (item: CodeItem) => {
    setFilters(prev => ({ ...prev, customerCd: item.code, customer: item.name }));
    setShowCodeSearchModal(false);
  };

  const totalPages = Math.ceil(allData.length / pageSize);
  const paginatedData = allData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const fieldH = "h-[38px]";
  const filterInputCls = `${fieldH} px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#2563EB]`;
  const filterSelectCls = filterInputCls;

  return (
    <PageLayout title="견적요청 조회" subtitle="물류견적관리 > 견적요청 등록/조회 > 견적요청 조회" onClose={() => setShowCloseModal(true)}>
      <main className="p-4">
        {/* 검색조건 영역 */}
        <div className="card mb-6">
          <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <h3 className="font-bold text-[var(--foreground)]">검색조건</h3>
          </div>
          <div className="p-4">
            {/* 1행: 업무구분, 수출입구분, 등록일자 + 기간버튼 */}
            <div className="grid grid-cols-6 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">업무구분 <span className="text-red-500">*</span></label>
                <select value={filters.bizType} onChange={(e) => setFilters(prev => ({ ...prev, bizType: e.target.value }))}
                  className={`w-full ${filterSelectCls}`}>
                  <option value="">전체</option>
                  <option value="SEA">해상</option>
                  <option value="AIR">항공</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">수출입구분</label>
                <select value={filters.ioType} onChange={(e) => setFilters(prev => ({ ...prev, ioType: e.target.value }))}
                  className={`w-full ${filterSelectCls}`}>
                  <option value="">전체</option>
                  <option value="EXPORT">수출</option>
                  <option value="IMPORT">수입</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">등록일자 <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-1">
                  <input type="date" value={filters.dateFrom} onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    className={`flex-1 ${filterInputCls}`} />
                  <span className="text-sm text-[var(--muted)]">~</span>
                  <input type="date" value={filters.dateTo} onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    className={`flex-1 ${filterInputCls}`} />
                </div>
              </div>
              <div className="col-span-2 flex items-end">
                <div className="flex gap-1">
                  {[
                    { label: '1주일', days: 7 },
                    { label: '1개월', days: 30 },
                    { label: '3개월', days: 90 },
                    { label: '6개월', days: 180 },
                    { label: '1년', days: 365 },
                  ].map(({ label, days }) => (
                    <button key={days} onClick={() => setDateRange(days)}
                      className={`${fieldH} px-3 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface-50)] hover:bg-[var(--surface-200)] text-[var(--foreground)]`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2행: 출발공항, 도착공항, 출발항, 도착항, 거래처, (빈칸) */}
            <div className="grid grid-cols-6 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">출발공항</label>
                <div className="flex gap-1">
                  <input type="text" value={filters.originAir} onChange={(e) => setFilters(prev => ({ ...prev, originAir: e.target.value }))}
                    className={`flex-1 min-w-0 ${filterInputCls}`} placeholder="출발공항" />
                  <button onClick={() => handleLocationSearch('originAir')} className={`${fieldH} px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">도착공항</label>
                <div className="flex gap-1">
                  <input type="text" value={filters.destAir} onChange={(e) => setFilters(prev => ({ ...prev, destAir: e.target.value }))}
                    className={`flex-1 min-w-0 ${filterInputCls}`} placeholder="도착공항" />
                  <button onClick={() => handleLocationSearch('destAir')} className={`${fieldH} px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">출발항</label>
                <div className="flex gap-1">
                  <input type="text" value={filters.originSea} onChange={(e) => setFilters(prev => ({ ...prev, originSea: e.target.value }))}
                    className={`flex-1 min-w-0 ${filterInputCls}`} placeholder="출발항" />
                  <button onClick={() => handleLocationSearch('originSea')} className={`${fieldH} px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">도착항</label>
                <div className="flex gap-1">
                  <input type="text" value={filters.destSea} onChange={(e) => setFilters(prev => ({ ...prev, destSea: e.target.value }))}
                    className={`flex-1 min-w-0 ${filterInputCls}`} placeholder="도착항" />
                  <button onClick={() => handleLocationSearch('destSea')} className={`${fieldH} px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </button>
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">거래처</label>
                <div className="flex gap-1">
                  <input type="text" value={filters.customer} onChange={(e) => setFilters(prev => ({ ...prev, customer: e.target.value }))}
                    className={`flex-1 min-w-0 ${filterInputCls}`} placeholder="거래처명" />
                  <button onClick={() => setShowCodeSearchModal(true)} className={`${fieldH} px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* 3행: 출발지, 도착지 */}
            <div className="grid grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">출발지</label>
                <div className="flex gap-1">
                  <input type="text" value={filters.origin} onChange={(e) => setFilters(prev => ({ ...prev, origin: e.target.value }))}
                    className={`flex-1 min-w-0 ${filterInputCls}`} placeholder="출발지" />
                  <button onClick={() => handleLocationSearch('origin')} className={`${fieldH} px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">도착지</label>
                <div className="flex gap-1">
                  <input type="text" value={filters.destination} onChange={(e) => setFilters(prev => ({ ...prev, destination: e.target.value }))}
                    className={`flex-1 min-w-0 ${filterInputCls}`} placeholder="도착지" />
                  <button onClick={() => handleLocationSearch('destination')} className={`${fieldH} px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 조회/초기화 버튼 */}
          <div className="p-4 border-t border-[var(--border)] flex justify-center gap-2">
            <button onClick={handleSearch} className="px-6 py-2 text-sm bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] font-medium">
              조회
            </button>
            <button onClick={handleReset} className="px-6 py-2 text-sm bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
              초기화
            </button>
          </div>
        </div>

        {/* 기능 버튼 영역 - PPT 맞춤 */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex gap-1.5">
            <button className="px-3 py-1.5 text-xs bg-[var(--surface-100)] text-[var(--foreground)] rounded hover:bg-[var(--surface-200)] border border-[var(--border)]">
              견적신청
            </button>
            <button className="px-3 py-1.5 text-xs bg-[var(--surface-100)] text-[var(--foreground)] rounded hover:bg-[var(--surface-200)] border border-[var(--border)]">
              E-mail
            </button>
            <button className="px-3 py-1.5 text-xs bg-[var(--surface-100)] text-[var(--foreground)] rounded hover:bg-[var(--surface-200)] border border-[var(--border)]">
              알람
            </button>
          </div>
          <div className="flex gap-1.5">
            <Link href="/logis/quote/request/register?type=air" className="px-3 py-1.5 text-xs bg-[#1A2744] text-white rounded hover:bg-[#243354]">
              항공신규
            </Link>
            <Link href="/logis/quote/request/register?type=sea" className="px-3 py-1.5 text-xs bg-[#1A2744] text-white rounded hover:bg-[#243354]">
              해상신규
            </Link>
            <button
              onClick={() => {
                if (selectedRows.length === 1) router.push(`/logis/quote/request/${selectedRows[0]}`);
                else alert('수정할 항목을 1건 선택해주세요.');
              }}
              className="px-3 py-1.5 text-xs bg-[var(--surface-100)] text-[var(--foreground)] rounded hover:bg-[var(--surface-200)] border border-[var(--border)] disabled:opacity-50"
              disabled={selectedRows.length !== 1}
            >
              수정
            </button>
            <button onClick={handleDelete}
              className="px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              disabled={selectedRows.length === 0}>
              삭제
            </button>
          </div>
        </div>

        {/* 조회 결과 테이블 */}
        <div className="card">
          {/* 건수 + 페이지 사이즈 */}
          <div className="px-3 py-2 border-b border-[var(--border)] flex justify-between items-center">
            <span className="text-xs text-[var(--foreground)]">
              Total: <strong>{allData.length}</strong>건
            </span>
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="h-[26px] px-2 text-xs bg-[var(--surface-50)] border border-[var(--border)] rounded">
              <option value={10}>10건</option>
              <option value={20}>20건</option>
              <option value={50}>50건</option>
              <option value={100}>100건</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="table text-xs">
              <thead>
                <tr>
                  <th className="w-8 text-center p-2">
                    <input type="checkbox" checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                      onChange={(e) => setSelectedRows(e.target.checked ? paginatedData.map(q => q.id) : [])} className="rounded" />
                  </th>
                  <th className="text-center p-2 w-12">No</th>
                  <th className="text-center p-2">등록일자</th>
                  <th className="text-center p-2">업무구분</th>
                  <th className="text-center p-2">수출입구분</th>
                  <th className="text-center p-2">거래처</th>
                  <th className="text-center p-2">출발지</th>
                  <th className="text-center p-2">도착지</th>
                  <th className="text-center p-2">무역조건</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="p-6 text-center text-[var(--muted)]">로딩 중...</td></tr>
                ) : paginatedData.length === 0 ? (
                  <tr><td colSpan={9} className="p-6 text-center text-[var(--muted)]">조회된 데이터가 없습니다.</td></tr>
                ) : paginatedData.map((row, index) => (
                  <tr key={row.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer"
                    onClick={() => router.push(`/logis/quote/request/${row.id}`)}>
                    <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedRows.includes(row.id)}
                        onChange={(e) => setSelectedRows(e.target.checked ? [...selectedRows, row.id] : selectedRows.filter(id => id !== row.id))} className="rounded" />
                    </td>
                    <td className="p-2 text-center text-[var(--muted)]">{(currentPage - 1) * pageSize + index + 1}</td>
                    <td className="p-2 text-center">{row.requestDate}</td>
                    <td className="p-2 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        row.bizType === 'SEA' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {row.bizType === 'SEA' ? '해상' : '항공'}
                      </span>
                    </td>
                    <td className="p-2 text-center">{row.ioType === 'EXPORT' ? '수출' : '수입'}</td>
                    <td className="p-2 text-center">{row.customerNm || '-'}</td>
                    <td className="p-2 text-center">{row.originNm || row.originCd || '-'}</td>
                    <td className="p-2 text-center">{row.destNm || row.destCd || '-'}</td>
                    <td className="p-2 text-center">{row.incoterms || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 0 && (
            <div className="px-3 py-2 border-t border-[var(--border)] flex justify-center items-center gap-1">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}
                className="px-2 py-1 text-xs bg-[var(--surface-100)] rounded hover:bg-[var(--surface-200)] disabled:opacity-50">{'<<'}</button>
              <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}
                className="px-2 py-1 text-xs bg-[var(--surface-100)] rounded hover:bg-[var(--surface-200)] disabled:opacity-50">{'<'}</button>
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                const startPage = Math.max(1, currentPage - 4);
                const page = startPage + i;
                if (page > totalPages) return null;
                return (
                  <button key={page} onClick={() => setCurrentPage(page)}
                    className={`px-2 py-1 text-xs rounded ${currentPage === page ? 'bg-[#1A2744] text-white' : 'bg-[var(--surface-100)] hover:bg-[var(--surface-200)]'}`}>
                    {page}
                  </button>
                );
              })}
              <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}
                className="px-2 py-1 text-xs bg-[var(--surface-100)] rounded hover:bg-[var(--surface-200)] disabled:opacity-50">{'>'}</button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}
                className="px-2 py-1 text-xs bg-[var(--surface-100)] rounded hover:bg-[var(--surface-200)] disabled:opacity-50">{'>>'}</button>
            </div>
          )}
        </div>
      </main>

      <CloseConfirmModal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} onConfirm={handleConfirmClose} />
      <LocationCodeModal isOpen={showLocationModal} onClose={() => setShowLocationModal(false)} onSelect={handleLocationSelect} type={locationSearchType} />
      <CodeSearchModal isOpen={showCodeSearchModal} onClose={() => setShowCodeSearchModal(false)} onSelect={handleCodeSelect} codeType={codeSearchType} />
    </PageLayout>
  );
}
