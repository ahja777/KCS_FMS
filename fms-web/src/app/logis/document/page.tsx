'use client';

import { useRouter } from 'next/navigation';

import { useState, useRef } from 'react';
import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import DateRangeButtons, { getToday } from '@/components/DateRangeButtons';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';

interface DocumentData {
  id: number;
  docNo: string;
  docType: string;
  docName: string;
  blNo: string;
  bookingNo: string;
  shipper: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  uploadBy: string;
  expiryDate: string;
  status: string;
}

const docTypeConfig: Record<string, { label: string; color: string }> = {
  BL: { label: 'B/L', color: 'bg-blue-500' },
  CI: { label: 'C/I', color: 'bg-green-500' },
  PL: { label: 'P/L', color: 'bg-cyan-500' },
  CO: { label: 'C/O', color: 'bg-purple-500' },
  CUSTOMS: { label: '통관서류', color: 'bg-yellow-500' },
  INSURANCE: { label: '보험증권', color: 'bg-orange-500' },
  OTHER: { label: '기타', color: 'bg-gray-500' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '작성중', color: 'bg-gray-500' },
  PENDING: { label: '대기', color: 'bg-yellow-500' },
  CONFIRMED: { label: '확정', color: 'bg-blue-500' },
  SENT: { label: '발송', color: 'bg-green-500' },
  EXPIRED: { label: '만료', color: 'bg-red-500' },
};

const mockData: DocumentData[] = [
  { id: 1, docNo: 'DOC-2026-0001', docType: 'BL', docName: 'House B/L', blNo: 'HDMU1234567', bookingNo: 'BK-2026-0001', shipper: '삼성전자', fileName: 'HBL_HDMU1234567.pdf', fileSize: '256 KB', uploadDate: '2026-01-20', uploadBy: '김담당', expiryDate: '', status: 'CONFIRMED' },
  { id: 2, docNo: 'DOC-2026-0002', docType: 'CI', docName: 'Commercial Invoice', blNo: 'HDMU1234567', bookingNo: 'BK-2026-0001', shipper: '삼성전자', fileName: 'CI_2026_0001.pdf', fileSize: '128 KB', uploadDate: '2026-01-19', uploadBy: '김담당', expiryDate: '', status: 'SENT' },
  { id: 3, docNo: 'DOC-2026-0003', docType: 'PL', docName: 'Packing List', blNo: 'HDMU1234567', bookingNo: 'BK-2026-0001', shipper: '삼성전자', fileName: 'PL_2026_0001.xlsx', fileSize: '85 KB', uploadDate: '2026-01-19', uploadBy: '김담당', expiryDate: '', status: 'SENT' },
  { id: 4, docNo: 'DOC-2026-0004', docType: 'CO', docName: 'Certificate of Origin', blNo: 'MAEU5678901', bookingNo: 'BK-2026-0002', shipper: 'LG전자', fileName: 'CO_LG_2026.pdf', fileSize: '180 KB', uploadDate: '2026-01-21', uploadBy: '이담당', expiryDate: '2027-01-21', status: 'CONFIRMED' },
  { id: 5, docNo: 'DOC-2026-0005', docType: 'CUSTOMS', docName: '수출신고필증', blNo: 'MSCU2345678', bookingNo: 'BK-2026-0003', shipper: '현대자동차', fileName: 'EXP_DEC_2026_0003.pdf', fileSize: '320 KB', uploadDate: '2026-01-22', uploadBy: '박담당', expiryDate: '', status: 'PENDING' },
  { id: 6, docNo: 'DOC-2026-0006', docType: 'INSURANCE', docName: '적하보험증권', blNo: 'HDMU1234567', bookingNo: 'BK-2026-0001', shipper: '삼성전자', fileName: 'INS_SAMSUNG_2026.pdf', fileSize: '450 KB', uploadDate: '2026-01-18', uploadBy: '김담당', expiryDate: '2026-03-18', status: 'CONFIRMED' },
];

export default function DocumentPage() {
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const today = getToday();
  const [filters, setFilters] = useState({
    startDate: today,
    endDate: today,
    docNo: '',
    blNo: '',
    docType: '',
    shipper: '',
    status: '',
  });
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [data] = useState<DocumentData[]>(mockData);

  const handleDateRangeSelect = (startDate: string, endDate: string) => {
    setFilters(prev => ({ ...prev, startDate, endDate }));
  };

  const handleSearch = () => setAppliedFilters(filters);
  const handleReset = () => {
    const resetFilters = { startDate: today, endDate: today, docNo: '', blNo: '', docType: '', shipper: '', status: '' };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
  };

  const filteredData = data.filter(item => {
    if (appliedFilters.docNo && !item.docNo.includes(appliedFilters.docNo)) return false;
    if (appliedFilters.blNo && !item.blNo.includes(appliedFilters.blNo)) return false;
    if (appliedFilters.docType && item.docType !== appliedFilters.docType) return false;
    if (appliedFilters.shipper && !item.shipper.includes(appliedFilters.shipper)) return false;
    if (appliedFilters.status && item.status !== appliedFilters.status) return false;
    return true;
  });

  const summaryStats = {
    total: filteredData.length,
    bl: filteredData.filter(d => d.docType === 'BL').length,
    ci: filteredData.filter(d => d.docType === 'CI').length,
    pl: filteredData.filter(d => d.docType === 'PL').length,
    other: filteredData.filter(d => !['BL', 'CI', 'PL'].includes(d.docType)).length,
  };

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

  return (
        <PageLayout title="수출입서류관리" subtitle="Logis > 견적/부킹관리 > 수출입서류관리" showCloseButton={false} >
        <main ref={formRef} className="p-6">
          <div className="flex justify-end items-center mb-6">
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)] transition-colors">서류 발송</button>
              <Link href="/logis/document/upload" className="px-6 py-2 font-semibold rounded-lg bg-[var(--surface-100)] text-[var(--foreground)] hover:bg-[var(--surface-200)] transition-colors">
                서류 업로드
              </Link>
            </div>
          </div>

          {/* 검색조건 - 화면설계서 기준 */}
          <div className="card mb-6">
            <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="font-bold">검색조건</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">업로드 일자</label>
                  <div className="flex gap-2 items-center flex-nowrap">
                    <input type="date" value={filters.startDate} onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))} className="w-[130px] h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg flex-shrink-0 text-sm" />
                    <span className="text-[var(--muted)] flex-shrink-0">~</span>
                    <input type="date" value={filters.endDate} onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))} className="w-[130px] h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg flex-shrink-0 text-sm" />
                    <DateRangeButtons onRangeSelect={handleDateRangeSelect} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">B/L 번호</label>
                  <input type="text" value={filters.blNo} onChange={e => setFilters(prev => ({ ...prev, blNo: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="HDMU1234567" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">서류 유형</label>
                  <select value={filters.docType} onChange={e => setFilters(prev => ({ ...prev, docType: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm">
                    <option value="">전체</option>
                    <option value="BL">B/L</option>
                    <option value="CI">C/I (Commercial Invoice)</option>
                    <option value="PL">P/L (Packing List)</option>
                    <option value="CO">C/O (Certificate of Origin)</option>
                    <option value="CUSTOMS">통관서류</option>
                    <option value="INSURANCE">보험증권</option>
                    <option value="OTHER">기타</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">상태</label>
                  <select value={filters.status} onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm">
                    <option value="">전체</option>
                    <option value="DRAFT">작성중</option>
                    <option value="PENDING">대기</option>
                    <option value="CONFIRMED">확정</option>
                    <option value="SENT">발송</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-[var(--border)] flex justify-center gap-2">
              <button onClick={handleSearch} className="px-6 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] font-medium">조회</button>
              <button onClick={handleReset} className="px-6 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">초기화</button>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="card p-4 text-center"><div className="text-2xl font-bold">{summaryStats.total}</div><div className="text-sm text-[var(--muted)]">전체</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-blue-500">{summaryStats.bl}</div><div className="text-sm text-[var(--muted)]">B/L</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-green-500">{summaryStats.ci}</div><div className="text-sm text-[var(--muted)]">C/I</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-cyan-500">{summaryStats.pl}</div><div className="text-sm text-[var(--muted)]">P/L</div></div>
            <div className="card p-4 text-center"><div className="text-2xl font-bold text-gray-500">{summaryStats.other}</div><div className="text-sm text-[var(--muted)]">기타</div></div>
          </div>

          <div className="card overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-10 text-center"><input type="checkbox" /></th>
                  <th className="text-center">서류번호</th>
                  <th className="text-center">유형</th>
                  <th className="text-center">서류명</th>
                  <th className="text-center">B/L 번호</th>
                  <th className="text-center">화주</th>
                  <th className="text-center">파일명</th>
                  <th className="text-center">크기</th>
                  <th className="text-center">업로드일</th>
                  <th className="text-center">상태</th>
                  <th className="text-center">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredData.map(item => (
                  <tr key={item.id} className="hover:bg-[var(--surface-50)]">
                    <td className="px-2 py-3 text-center"><input type="checkbox" /></td>
                    <td className="px-4 py-3 text-center"><Link href={`/logis/document/${item.id}`} className="text-blue-400 hover:underline">{item.docNo}</Link></td>
                    <td className="px-4 py-3 text-center"><span className={`px-2 py-1 text-xs rounded-full text-white ${docTypeConfig[item.docType].color}`}>{docTypeConfig[item.docType].label}</span></td>
                    <td className="px-4 py-3 text-sm text-center">{item.docName}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.blNo}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.shipper}</td>
                    <td className="px-4 py-3 text-sm text-center text-blue-400 hover:underline cursor-pointer">{item.fileName}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.fileSize}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.uploadDate}</td>
                    <td className="px-4 py-3 text-center"><span className={`px-2 py-1 text-xs rounded-full text-white ${statusConfig[item.status]?.color}`}>{statusConfig[item.status]?.label}</span></td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <button className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">다운로드</button>
                        <button className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">발송</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
