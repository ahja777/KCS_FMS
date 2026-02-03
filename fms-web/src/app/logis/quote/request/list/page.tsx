'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { formatCurrency } from '@/utils/format';

// 견적요청 데이터 타입
interface QuoteRequest {
  id: string;
  registrationDate: string;
  quoteNo: string;
  category: 'sea' | 'air';
  origin: string;
  destination: string;
  tradingPartner: string;
  tradeTerms: string;
  status: 'draft' | 'requested' | 'quoted' | 'confirmed' | 'cancelled';
  inputEmployee: string;
  totalAmount: number;
  currency: string;
}

// 상태별 스타일 정의
const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: '임시저장', color: '#6B7280', bgColor: '#F3F4F6' },
  requested: { label: '요청', color: '#2563EB', bgColor: '#DBEAFE' },
  quoted: { label: '견적완료', color: '#7C3AED', bgColor: '#EDE9FE' },
  confirmed: { label: '확정', color: '#059669', bgColor: '#D1FAE5' },
  cancelled: { label: '취소', color: '#DC2626', bgColor: '#FEE2E2' },
};

// 샘플 데이터
const sampleData: QuoteRequest[] = [
  {
    id: '1',
    registrationDate: '2026-01-15',
    quoteNo: 'QR-2026-0001',
    category: 'sea',
    origin: '부산 (KRPUS)',
    destination: '상해 (CNSHA)',
    tradingPartner: '삼성전자',
    tradeTerms: 'CIF',
    status: 'confirmed',
    inputEmployee: '김영수',
    totalAmount: 2500,
    currency: 'USD',
  },
  {
    id: '2',
    registrationDate: '2026-01-14',
    quoteNo: 'QR-2026-0002',
    category: 'air',
    origin: '인천 (ICN)',
    destination: '홍콩 (HKG)',
    tradingPartner: 'LG전자',
    tradeTerms: 'DAP',
    status: 'quoted',
    inputEmployee: '박지현',
    totalAmount: 3200,
    currency: 'USD',
  },
  {
    id: '3',
    registrationDate: '2026-01-13',
    quoteNo: 'QR-2026-0003',
    category: 'sea',
    origin: '부산 (KRPUS)',
    destination: '로스앤젤레스 (USLAX)',
    tradingPartner: '현대자동차',
    tradeTerms: 'FOB',
    status: 'requested',
    inputEmployee: '이민호',
    totalAmount: 4800,
    currency: 'USD',
  },
  {
    id: '4',
    registrationDate: '2026-01-12',
    quoteNo: 'QR-2026-0004',
    category: 'air',
    origin: '인천 (ICN)',
    destination: '도쿄 (NRT)',
    tradingPartner: 'SK하이닉스',
    tradeTerms: 'DDP',
    status: 'draft',
    inputEmployee: '최수진',
    totalAmount: 1800,
    currency: 'USD',
  },
  {
    id: '5',
    registrationDate: '2026-01-11',
    quoteNo: 'QR-2026-0005',
    category: 'sea',
    origin: '인천 (KRINC)',
    destination: '싱가포르 (SGSIN)',
    tradingPartner: '포스코',
    tradeTerms: 'CFR',
    status: 'cancelled',
    inputEmployee: '정현우',
    totalAmount: 3500,
    currency: 'USD',
  },
];

interface SearchFilters {
  dateFrom: string;
  dateTo: string;
  quoteNo: string;
  category: string;
  status: string;
  tradingPartner: string;
  origin: string;
  destination: string;
}

const initialFilters: SearchFilters = {
  dateFrom: '',
  dateTo: '',
  quoteNo: '',
  category: '',
  status: '',
  tradingPartner: '',
  origin: '',
  destination: '',
};

export default function QuoteRequestListPage() {
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);

  // 화면닫기 핸들러
  const handleCloseClick = () => {
    setShowCloseModal(true);
  };

  const handleConfirmClose = () => {
    setShowCloseModal(false);
    router.back();
  };

  // 브라우저 뒤로가기 버튼 처리
  useCloseConfirm({
    showModal: showCloseModal,
    setShowModal: setShowCloseModal,
    onConfirmClose: handleConfirmClose,
  });

  const [allData] = useState<QuoteRequest[]>(sampleData);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(initialFilters);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchMessage, setSearchMessage] = useState<string>('');
  const pageSize = 10;

  // 필터링된 데이터
  const filteredList = useMemo(() => {
    return allData.filter(item => {
      if (appliedFilters.quoteNo && !item.quoteNo.toLowerCase().includes(appliedFilters.quoteNo.toLowerCase())) return false;
      if (appliedFilters.category && item.category !== appliedFilters.category) return false;
      if (appliedFilters.status && item.status !== appliedFilters.status) return false;
      if (appliedFilters.tradingPartner && !item.tradingPartner.toLowerCase().includes(appliedFilters.tradingPartner.toLowerCase())) return false;
      if (appliedFilters.origin && !item.origin.toLowerCase().includes(appliedFilters.origin.toLowerCase())) return false;
      if (appliedFilters.destination && !item.destination.toLowerCase().includes(appliedFilters.destination.toLowerCase())) return false;
      if (appliedFilters.dateFrom && item.registrationDate < appliedFilters.dateFrom) return false;
      if (appliedFilters.dateTo && item.registrationDate > appliedFilters.dateTo) return false;
      return true;
    });
  }, [allData, appliedFilters]);

  // 상태별 요약
  const summary = useMemo(() => ({
    total: filteredList.length,
    draft: filteredList.filter(q => q.status === 'draft').length,
    requested: filteredList.filter(q => q.status === 'requested').length,
    quoted: filteredList.filter(q => q.status === 'quoted').length,
    confirmed: filteredList.filter(q => q.status === 'confirmed').length,
    cancelled: filteredList.filter(q => q.status === 'cancelled').length,
    totalAmount: filteredList.reduce((sum, q) => sum + q.totalAmount, 0),
  }), [filteredList]);

  // 검색 실행
  const handleSearch = () => {
    setAppliedFilters({ ...filters });
    setSelectedRows([]);
    setCurrentPage(1);
    setSearchMessage(`검색 완료: ${filteredList.length}건이 조회되었습니다.`);
    setTimeout(() => setSearchMessage(''), 3000);
  };

  // 검색 조건 초기화
  const handleReset = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setSelectedRows([]);
    setSearchMessage('검색 조건이 초기화되었습니다.');
    setTimeout(() => setSearchMessage(''), 3000);
  };

  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // 선택 삭제
  const handleDelete = () => {
    if (selectedRows.length === 0) {
      alert('삭제할 항목을 선택해주세요.');
      return;
    }
    if (confirm(`${selectedRows.length}건을 삭제하시겠습니까?`)) {
      // 실제 구현시 API 호출
      setSelectedRows([]);
    }
  };

  // 페이지네이션
  const totalPages = Math.ceil(filteredList.length / pageSize);
  const paginatedData = filteredList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
        <PageLayout title="견적요청 조회" subtitle="물류견적관리  견적요청 등록/조회 > 견적요청 조회" showCloseButton={false} >

        <main className="p-6">
          {/* 상단 버튼 영역 */}
          <div className="flex justify-end items-center mb-6">
            <div className="flex gap-2">
              <Link
                href="/logis/quote/request"
                className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)] transition-colors"
              >
                신규등록
              </Link>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)] transition-colors disabled:opacity-50"
                disabled={selectedRows.length === 0}
              >
                선택삭제
              </button>
            </div>
          </div>

          {searchMessage && (
            <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded-lg">{searchMessage}</div>
          )}

          {/* 검색조건 - Booking Sea 스타일 */}
          <div className="card mb-6">
            <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="font-bold">검색조건</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-6 gap-4">
                {/* 등록일자 */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">등록일자</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                      className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                    />
                    <span className="text-[var(--muted)]">~</span>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                      className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                    />
                  </div>
                </div>
                {/* 견적번호 */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">견적번호</label>
                  <input
                    type="text"
                    value={filters.quoteNo}
                    onChange={(e) => handleFilterChange('quoteNo', e.target.value)}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                    placeholder="QR-YYYY-XXXX"
                  />
                </div>
                {/* 구분 */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">구분</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                  >
                    <option value="">전체</option>
                    <option value="sea">해상</option>
                    <option value="air">항공</option>
                  </select>
                </div>
                {/* 거래처 */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">거래처</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={filters.tradingPartner}
                      onChange={(e) => handleFilterChange('tradingPartner', e.target.value)}
                      className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                      placeholder="거래처명"
                    />
                    <button className="h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
                {/* 견적상태 */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">견적상태</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                  >
                    <option value="">전체</option>
                    <option value="draft">임시저장</option>
                    <option value="requested">요청</option>
                    <option value="quoted">견적완료</option>
                    <option value="confirmed">확정</option>
                    <option value="cancelled">취소</option>
                  </select>
                </div>
                {/* 출발지 */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">출발지</label>
                  <input
                    type="text"
                    value={filters.origin}
                    onChange={(e) => handleFilterChange('origin', e.target.value)}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                    placeholder="출발지"
                  />
                </div>
                {/* 도착지 */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">도착지</label>
                  <input
                    type="text"
                    value={filters.destination}
                    onChange={(e) => handleFilterChange('destination', e.target.value)}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm"
                    placeholder="도착지"
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-[var(--border)] flex justify-center gap-2">
              <button onClick={handleSearch} className="px-6 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] font-medium">조회</button>
              <button onClick={handleReset} className="px-6 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">초기화</button>
            </div>
          </div>

          {/* 상태별 현황 카드 */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: '' })); setAppliedFilters(prev => ({ ...prev, status: '' })); }}>
              <p className="text-2xl font-bold">{summary.total}</p>
              <p className="text-sm text-[var(--muted)]">전체</p>
            </div>
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'draft' })); setAppliedFilters(prev => ({ ...prev, status: 'draft' })); }}>
              <p className="text-2xl font-bold text-[#6B7280]">{summary.draft}</p>
              <p className="text-sm text-[var(--muted)]">임시저장</p>
            </div>
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'requested' })); setAppliedFilters(prev => ({ ...prev, status: 'requested' })); }}>
              <p className="text-2xl font-bold text-[#2563EB]">{summary.requested}</p>
              <p className="text-sm text-[var(--muted)]">요청</p>
            </div>
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'quoted' })); setAppliedFilters(prev => ({ ...prev, status: 'quoted' })); }}>
              <p className="text-2xl font-bold text-[#7C3AED]">{summary.quoted}</p>
              <p className="text-sm text-[var(--muted)]">견적완료</p>
            </div>
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'confirmed' })); setAppliedFilters(prev => ({ ...prev, status: 'confirmed' })); }}>
              <p className="text-2xl font-bold text-[#059669]">{summary.confirmed}</p>
              <p className="text-sm text-[var(--muted)]">확정</p>
            </div>
            <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'cancelled' })); setAppliedFilters(prev => ({ ...prev, status: 'cancelled' })); }}>
              <p className="text-2xl font-bold text-[#DC2626]">{summary.cancelled}</p>
              <p className="text-sm text-[var(--muted)]">취소</p>
            </div>
          </div>

          {/* 조회 결과 섹션 */}
          <div className="card">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                조회결과
                <span className="text-sm font-normal text-[var(--muted)]">({filteredList.length}건)</span>
              </h3>
              <button className="px-3 py-1.5 text-sm bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)] transition-colors flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                엑셀다운로드
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRows(paginatedData.map(q => q.id));
                          } else {
                            setSelectedRows([]);
                          }
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="text-center">No</th>
                    <th className="text-center">견적번호</th>
                    <th className="text-center">등록일자</th>
                    <th className="text-center">구분</th>
                    <th className="text-center">출발지</th>
                    <th className="text-center">도착지</th>
                    <th className="text-center">거래처</th>
                    <th className="text-center">무역조건</th>
                    <th className="text-center">상태</th>
                    <th className="text-center">견적금액</th>
                    <th className="text-center">담당자</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, index) => (
                    <tr
                      key={row.id}
                      className="border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer"
                    >
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(row.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRows([...selectedRows, row.id]);
                            } else {
                              setSelectedRows(selectedRows.filter(id => id !== row.id));
                            }
                          }}
                          className="rounded"
                        />
                      </td>
                      <td className="p-3 text-sm text-center text-[var(--muted)]">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="p-3 text-center">
                        <Link
                          href={`/logis/quote/request/${row.id}`}
                          className="text-sm font-medium text-[#2563EB] hover:underline"
                        >
                          {row.quoteNo}
                        </Link>
                      </td>
                      <td className="p-3 text-sm text-center text-[var(--foreground)]">{row.registrationDate}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          row.category === 'sea'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {row.category === 'sea' ? '해상' : '항공'}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-center text-[var(--foreground)]">{row.origin}</td>
                      <td className="p-3 text-sm text-center text-[var(--foreground)]">{row.destination}</td>
                      <td className="p-3 text-sm text-center text-[var(--foreground)]">{row.tradingPartner}</td>
                      <td className="p-3 text-center text-sm font-medium text-[var(--foreground)]">{row.tradeTerms}</td>
                      <td className="p-3 text-center">
                        <span
                          className="inline-block px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            color: statusConfig[row.status]?.color,
                            backgroundColor: statusConfig[row.status]?.bgColor,
                          }}
                        >
                          {statusConfig[row.status]?.label}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-center font-medium text-[var(--foreground)]">
                        {formatCurrency(row.totalAmount, row.currency)}
                      </td>
                      <td className="p-3 text-sm text-center text-[var(--foreground)]">{row.inputEmployee}</td>
                    </tr>
                  ))}
                  {paginatedData.length === 0 && (
                    <tr>
                      <td colSpan={12} className="p-8 text-center text-[var(--muted)]">
                        조회된 데이터가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-[var(--border)] flex justify-center items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm bg-[var(--surface-100)] rounded-lg hover:bg-[var(--surface-200)] disabled:opacity-50"
                >
                  {'<<'}
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm bg-[var(--surface-100)] rounded-lg hover:bg-[var(--surface-200)] disabled:opacity-50"
                >
                  {'<'}
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 text-sm rounded-lg ${
                      currentPage === page
                        ? 'bg-[#1A2744] text-white'
                        : 'bg-[var(--surface-100)] hover:bg-[var(--surface-200)]'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm bg-[var(--surface-100)] rounded-lg hover:bg-[var(--surface-200)] disabled:opacity-50"
                >
                  {'>'}
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm bg-[var(--surface-100)] rounded-lg hover:bg-[var(--surface-200)] disabled:opacity-50"
                >
                  {'>>'}
                </button>
              </div>
            )}
          </div>
        </main>
      {/* 화면 닫기 확인 모달 */}
      <CloseConfirmModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onConfirm={handleConfirmClose}
      />
    </PageLayout>
  );
}
