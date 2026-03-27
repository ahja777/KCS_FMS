'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { formatCurrency } from '@/utils/format';
import { LIST_PATHS } from '@/constants/paths';
import EmailModal from '@/components/EmailModal';

interface QuoteData {
  id: string;
  quoteNo: string;
  quoteDate: string;
  requestNo: string;
  shipper: string;
  consignee: string;
  pol: string;
  pod: string;
  carrier: string;
  containerType: string;
  containerQty: number;
  incoterms: string;
  validFrom: string;
  validTo: string;
  totalAmount: number;
  currency: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'expired';
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: '작성중', color: '#6B7280', bgColor: '#F3F4F6' },
  submitted: { label: '제출', color: '#2563EB', bgColor: '#DBEAFE' },
  approved: { label: '승인', color: '#059669', bgColor: '#D1FAE5' },
  rejected: { label: '반려', color: '#DC2626', bgColor: '#FEE2E2' },
  expired: { label: '만료', color: '#9CA3AF', bgColor: '#F3F4F6' },
  pending: { label: '대기', color: '#F59E0B', bgColor: '#FEF3C7' },
  DRAFT: { label: '작성중', color: '#6B7280', bgColor: '#F3F4F6' },
  SUBMITTED: { label: '제출', color: '#2563EB', bgColor: '#DBEAFE' },
  APPROVED: { label: '승인', color: '#059669', bgColor: '#D1FAE5' },
  REJECTED: { label: '반려', color: '#DC2626', bgColor: '#FEE2E2' },
  EXPIRED: { label: '만료', color: '#9CA3AF', bgColor: '#F3F4F6' },
  PENDING: { label: '대기', color: '#F59E0B', bgColor: '#FEF3C7' },
  active: { label: '활성', color: '#059669', bgColor: '#D1FAE5' },
  ACTIVE: { label: '활성', color: '#059669', bgColor: '#D1FAE5' },
};

const getStatusConfig = (status: string) => {
  return statusConfig[status] || { label: status || '미정', color: '#6B7280', bgColor: '#F3F4F6' };
};

export default function QuoteSeaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // DB API에서 데이터 조회
  const fetchQuote = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/quote/sea?quoteId=${resolvedParams.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          setQuote(null);
          return;
        }
        throw new Error('Failed to fetch');
      }
      const data = await response.json();
      setQuote(data);
    } catch (error) {
      console.error('데이터 조회 실패:', error);
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  const handleCloseClick = () => {
    setShowCloseModal(true);
  };

  const handleConfirmClose = () => {
    setShowCloseModal(false);
    router.push(LIST_PATHS.QUOTE_SEA);
  };

  // 브라우저 뒤로가기 버튼 처리
  useCloseConfirm({
    showModal: showCloseModal,
    setShowModal: setShowCloseModal,
    onConfirmClose: handleConfirmClose,
  });

  const handleEdit = () => {
    router.push(`/logis/quote/sea/register?quoteId=${resolvedParams.id}`);
  };

  const handleList = () => {
    router.push('/logis/quote/sea');
  };

  const handleEmailSend = (emailData: any) => {
    console.log('이메일 발송:', emailData);
    alert(`견적서가 이메일로 발송되었습니다.\n받는 사람: ${emailData.to.join(', ')}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E8A838] mx-auto"></div>
          <p className="mt-4 text-[var(--muted)]">데이터를 불러오는 중...</p>
        </div>
      </div>
  );
}

  if (!quote) {
    return (
          <PageLayout title="견적관리 상세 (해상)" subtitle="물류견적관리  견적관리 (해상) > 상세조회" onClose={handleCloseClick} >
          <main className="p-6">
            <div className="card p-12 text-center">
              <svg className="w-16 h-16 text-[var(--muted)] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">견적을 찾을 수 없습니다</h3>
              <p className="text-[var(--muted)] mb-6">요청하신 견적 정보가 존재하지 않습니다.</p>
              <button onClick={handleList} className="px-6 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">
                목록으로 돌아가기
              </button>
            </div>
          </main>
      </PageLayout>
    );
  }

  const status = getStatusConfig(quote.status);

  return (
        <PageLayout title="견적관리 상세 (해상)" subtitle="물류견적관리  견적관리 (해상) > 상세조회" onClose={handleCloseClick} >

        <main className="p-6">
          {/* 상단 버튼 */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <span
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{ color: status.color, backgroundColor: status.bgColor }}
              >
                {status.label}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowEmailModal(true)} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)] transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                E-mail
              </button>
              <button onClick={handleList} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)] transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                목록
              </button>
              <button onClick={handleEdit} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)] transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                수정
              </button>
            </div>
          </div>

          {/* 기본정보 */}
          <div className="card mb-6">
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="text-lg font-bold text-[var(--foreground)]">기본정보</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm text-[var(--foreground)] mb-1">견적번호</label>
                  <p className="text-[var(--foreground)] font-semibold text-lg">{quote.quoteNo}</p>
                </div>
                <div>
                  <label className="block text-sm text-[var(--foreground)] mb-1">견적일자</label>
                  <p className="text-[var(--foreground)]">{quote.quoteDate}</p>
                </div>
                <div>
                  <label className="block text-sm text-[var(--foreground)] mb-1">요청번호</label>
                  <p className="text-[var(--foreground)]">{quote.requestNo || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm text-[var(--foreground)] mb-1">유효기간</label>
                  <p className="text-[var(--foreground)]">{quote.validFrom} ~ {quote.validTo}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 거래처 정보 */}
          <div className="card mb-6">
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="text-lg font-bold text-[var(--foreground)]">거래처 정보</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-[var(--foreground)] mb-1">화주 (Shipper)</label>
                  <p className="text-[var(--foreground)] font-medium">{quote.shipper}</p>
                </div>
                <div>
                  <label className="block text-sm text-[var(--foreground)] mb-1">수하인 (Consignee)</label>
                  <p className="text-[var(--foreground)] font-medium">{quote.consignee}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 운송 정보 */}
          <div className="card mb-6">
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="text-lg font-bold text-[var(--foreground)]">운송 정보</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm text-[var(--foreground)] mb-1">출발항 (POL)</label>
                  <p className="text-[var(--foreground)] font-medium">{quote.pol}</p>
                </div>
                <div>
                  <label className="block text-sm text-[var(--foreground)] mb-1">도착항 (POD)</label>
                  <p className="text-[var(--foreground)] font-medium">{quote.pod}</p>
                </div>
                <div>
                  <label className="block text-sm text-[var(--foreground)] mb-1">선사</label>
                  <p className="text-[var(--foreground)] font-medium">{quote.carrier}</p>
                </div>
                <div>
                  <label className="block text-sm text-[var(--foreground)] mb-1">무역조건</label>
                  <p className="text-[var(--foreground)] font-medium">{quote.incoterms}</p>
                </div>
                <div>
                  <label className="block text-sm text-[var(--foreground)] mb-1">컨테이너 유형</label>
                  <p className="text-[var(--foreground)]">{quote.containerType}</p>
                </div>
                <div>
                  <label className="block text-sm text-[var(--foreground)] mb-1">컨테이너 수량</label>
                  <p className="text-[var(--foreground)]">{quote.containerQty} EA</p>
                </div>
              </div>
            </div>
          </div>

          {/* 견적금액 */}
          <div className="card">
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="text-lg font-bold text-[var(--foreground)]">견적금액</h3>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--muted)]">총 견적금액</p>
                  <p className="text-3xl font-bold text-[#E8A838]">
                    {formatCurrency(quote.totalAmount, quote.currency)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[var(--muted)] mb-2">귀사의 일익 번창하심을 진심으로 기원합니다.</p>
                  <p className="text-sm text-[var(--muted)]">해상 운임 견적을 다음과 같이 알려드리오니 참고하시어 많은 협조바랍니다.</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      {/* 이메일 모달 */}
      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSend={handleEmailSend}
        documentType="quote"
        documentNo={quote.quoteNo}
        defaultSubject={`[견적서] ${quote.quoteNo} - 인터지스 물류`}
      />

      {/* 화면 닫기 확인 모달 */}
      <CloseConfirmModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onConfirm={handleConfirmClose}
      />
    </PageLayout>
  );
}
