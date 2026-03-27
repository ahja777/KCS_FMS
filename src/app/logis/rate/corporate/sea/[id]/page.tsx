'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { formatCurrency } from '@/utils/format';

// 운임 상세 행
interface FreightDetail {
  DETAIL_ID: number;
  DETAIL_SEQ: number;
  FREIGHT_TYPE: string;
  FREIGHT_CD: string;
  CURRENCY_CD: string;
  RATE_MIN: string | number;
  RATE_BL: string | number;
  RATE_RTON: string | number;
  CNTR_DRY_20: string | number;
  CNTR_DRY_40: string | number;
  CNTR_TYPE_A_CD: string;
  CNTR_TYPE_A_RATE: string | number;
  CNTR_TYPE_B_CD: string;
  CNTR_TYPE_B_RATE: string | number;
  CNTR_TYPE_C_CD: string;
  CNTR_TYPE_C_RATE: string | number;
  RATE_BULK: string | number;
}

// 운송 운임 행
interface TransportDetail {
  TRANSPORT_ID: number;
  TRANSPORT_SEQ: number;
  FREIGHT_CD: string;
  ORIGIN_CD: string;
  ORIGIN_NM: string;
  DEST_CD: string;
  DEST_NM: string;
  RATE_LCL: string | number;
  RATE_20FT: string | number;
  RATE_40FT: string | number;
  ETC_TRANSPORT: string | number;
  MANAGER_NM: string;
  MANAGER_TEL: string;
}

// 기업운임 마스터
interface CorporateRateData {
  RATE_ID: number;
  RATE_NO: string;
  TRANSPORT_MODE: string;
  IO_TYPE: string;
  BIZ_TYPE: string;
  CUSTOMER_CD: string;
  CUSTOMER_NM: string;
  CARRIER_CD: string;
  CARRIER_NM: string;
  POL_CD: string;
  POL_NM: string;
  POD_CD: string;
  POD_NM: string;
  POD2_CD: string;
  POD2_NM: string;
  INSURANCE_AMT: string | number;
  STORAGE_AMT: string | number;
  HANDLING_AMT: string | number;
  REMARK: string;
  CREATED_DTM: string;
  UPDATED_DTM: string;
  details: FreightDetail[];
  transports: TransportDetail[];
}

const ioTypeLabel: Record<string, string> = {
  EXPORT: '수출',
  IMPORT: '수입',
};

const bizTypeLabel: Record<string, string> = {
  LOCAL: '로컬',
  CROSS: '크로스트레이드',
  TRIANGLE: '삼국간',
};

export default function CorporateRateSeaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<CorporateRateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCloseModal, setShowCloseModal] = useState(false);

  const handleConfirmClose = () => {
    setShowCloseModal(false);
    router.push('/logis/rate/corporate/sea');
  };

  useCloseConfirm({
    showModal: showCloseModal,
    setShowModal: setShowCloseModal,
    onConfirmClose: handleConfirmClose,
  });

  // 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/logis/rate/corporate?rateId=${id}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch corporate rate data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleList = () => {
    router.push('/logis/rate/corporate/sea');
  };

  const handleEdit = () => {
    router.push(`/logis/rate/corporate/sea/register?id=${id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-[var(--muted)]">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--muted)] mb-4">데이터를 찾을 수 없습니다.</p>
          <button
            onClick={handleList}
            className="px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8]"
          >
            목록으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageLayout
      title="기업운임관리 상세 (해상)"
      subtitle="HOME > 운임관리 > 기업운임관리 > 해상 상세"
      onClose={() => setShowCloseModal(true)}
    >
      <main className="p-6">
        {/* 상단 버튼 영역 */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <button
              onClick={handleList}
              className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
            >
              목록
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)] font-medium"
            >
              수정
            </button>
          </div>
        </div>

        {/* 기본 정보 */}
        <div className="card mb-6">
          <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="font-bold">기본 정보</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-6 gap-4 mb-4">
              <div>
                <label className="block text-xs text-[var(--foreground)] mb-1">운임번호</label>
                <p className="font-medium text-[#E8A838]">{data.RATE_NO || '-'}</p>
              </div>
              <div>
                <label className="block text-xs text-[var(--foreground)] mb-1">수출입구분</label>
                <p className="font-medium">{ioTypeLabel[data.IO_TYPE] || data.IO_TYPE || '-'}</p>
              </div>
              <div>
                <label className="block text-xs text-[var(--foreground)] mb-1">영업유형</label>
                <p className="font-medium">{bizTypeLabel[data.BIZ_TYPE] || data.BIZ_TYPE || '-'}</p>
              </div>
              <div>
                <label className="block text-xs text-[var(--foreground)] mb-1">거래처</label>
                <p className="font-medium">{data.CUSTOMER_NM ? `${data.CUSTOMER_NM} (${data.CUSTOMER_CD})` : '-'}</p>
              </div>
              <div>
                <label className="block text-xs text-[var(--foreground)] mb-1">선사</label>
                <p className="font-medium">{data.CARRIER_NM ? `${data.CARRIER_NM} (${data.CARRIER_CD})` : '-'}</p>
              </div>
              <div>
                <label className="block text-xs text-[var(--foreground)] mb-1">POL</label>
                <p className="font-medium">{data.POL_NM ? `${data.POL_NM} (${data.POL_CD})` : data.POL_CD || '-'}</p>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-4">
              <div>
                <label className="block text-xs text-[var(--foreground)] mb-1">POD</label>
                <p className="font-medium">{data.POD_NM ? `${data.POD_NM} (${data.POD_CD})` : data.POD_CD || '-'}</p>
              </div>
              <div>
                <label className="block text-xs text-[var(--foreground)] mb-1">POD2</label>
                <p className="font-medium">{data.POD2_NM ? `${data.POD2_NM} (${data.POD2_CD})` : data.POD2_CD || '-'}</p>
              </div>
              <div>
                <label className="block text-xs text-[var(--foreground)] mb-1">보험료</label>
                <p className="font-medium">{formatCurrency(data.INSURANCE_AMT)}</p>
              </div>
              <div>
                <label className="block text-xs text-[var(--foreground)] mb-1">창고료</label>
                <p className="font-medium">{formatCurrency(data.STORAGE_AMT)}</p>
              </div>
              <div>
                <label className="block text-xs text-[var(--foreground)] mb-1">작업료</label>
                <p className="font-medium">{formatCurrency(data.HANDLING_AMT)}</p>
              </div>
              <div>
                <label className="block text-xs text-[var(--foreground)] mb-1">비고</label>
                <p className="font-medium text-sm">{data.REMARK || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 운임 정보 테이블 */}
        <div className="card mb-6">
          <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
            <h3 className="font-bold">운임 정보</h3>
            <span className="text-sm text-[var(--muted)] ml-2">({data.details?.length || 0}건)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="text-center">No</th>
                  <th className="text-center">운임유형</th>
                  <th className="text-center">운임코드</th>
                  <th className="text-center">통화</th>
                  <th className="text-center">Min</th>
                  <th className="text-center">B/L</th>
                  <th className="text-center">R.Ton</th>
                  <th className="text-center">20&apos;</th>
                  <th className="text-center">40&apos;</th>
                  <th className="text-center">Type A</th>
                  <th className="text-center">Type B</th>
                  <th className="text-center">Type C</th>
                  <th className="text-center">Bulk</th>
                </tr>
              </thead>
              <tbody>
                {data.details && data.details.length > 0 ? (
                  data.details.map((detail, index) => (
                    <tr key={detail.DETAIL_ID || index} className="border-t border-[var(--border)] bg-white">
                      <td className="p-2 text-center text-sm">{index + 1}</td>
                      <td className="p-2 text-center text-sm">{detail.FREIGHT_TYPE || '-'}</td>
                      <td className="p-2 text-center text-sm">{detail.FREIGHT_CD || '-'}</td>
                      <td className="p-2 text-center text-sm">{detail.CURRENCY_CD || '-'}</td>
                      <td className="p-2 text-center text-sm">{formatCurrency(detail.RATE_MIN)}</td>
                      <td className="p-2 text-center text-sm">{formatCurrency(detail.RATE_BL)}</td>
                      <td className="p-2 text-center text-sm">{formatCurrency(detail.RATE_RTON)}</td>
                      <td className="p-2 text-center text-sm">{formatCurrency(detail.CNTR_DRY_20)}</td>
                      <td className="p-2 text-center text-sm">{formatCurrency(detail.CNTR_DRY_40)}</td>
                      <td className="p-2 text-center text-sm">
                        {detail.CNTR_TYPE_A_CD ? `${detail.CNTR_TYPE_A_CD}: ${formatCurrency(detail.CNTR_TYPE_A_RATE)}` : '-'}
                      </td>
                      <td className="p-2 text-center text-sm">
                        {detail.CNTR_TYPE_B_CD ? `${detail.CNTR_TYPE_B_CD}: ${formatCurrency(detail.CNTR_TYPE_B_RATE)}` : '-'}
                      </td>
                      <td className="p-2 text-center text-sm">
                        {detail.CNTR_TYPE_C_CD ? `${detail.CNTR_TYPE_C_CD}: ${formatCurrency(detail.CNTR_TYPE_C_RATE)}` : '-'}
                      </td>
                      <td className="p-2 text-center text-sm">{formatCurrency(detail.RATE_BULK)}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-[var(--border)]">
                    <td colSpan={13} className="p-4 text-center text-[var(--muted)]">
                      운임 정보가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 운송 운임 테이블 */}
        <div className="card mb-6">
          <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <h3 className="font-bold">운송 운임</h3>
            <span className="text-sm text-[var(--muted)] ml-2">({data.transports?.length || 0}건)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="text-center">No</th>
                  <th className="text-center">운임코드</th>
                  <th className="text-center">출발지</th>
                  <th className="text-center">도착지</th>
                  <th className="text-center">LCL</th>
                  <th className="text-center">20&apos;</th>
                  <th className="text-center">40&apos;</th>
                  <th className="text-center">기타</th>
                  <th className="text-center">담당자</th>
                  <th className="text-center">연락처</th>
                </tr>
              </thead>
              <tbody>
                {data.transports && data.transports.length > 0 ? (
                  data.transports.map((transport, index) => (
                    <tr key={transport.TRANSPORT_ID || index} className="border-t border-[var(--border)] bg-white">
                      <td className="p-2 text-center text-sm">{index + 1}</td>
                      <td className="p-2 text-center text-sm">{transport.FREIGHT_CD || '-'}</td>
                      <td className="p-2 text-center text-sm">
                        {transport.ORIGIN_NM ? `${transport.ORIGIN_NM} (${transport.ORIGIN_CD})` : transport.ORIGIN_CD || '-'}
                      </td>
                      <td className="p-2 text-center text-sm">
                        {transport.DEST_NM ? `${transport.DEST_NM} (${transport.DEST_CD})` : transport.DEST_CD || '-'}
                      </td>
                      <td className="p-2 text-center text-sm">{formatCurrency(transport.RATE_LCL)}</td>
                      <td className="p-2 text-center text-sm">{formatCurrency(transport.RATE_20FT)}</td>
                      <td className="p-2 text-center text-sm">{formatCurrency(transport.RATE_40FT)}</td>
                      <td className="p-2 text-center text-sm">{formatCurrency(transport.ETC_TRANSPORT)}</td>
                      <td className="p-2 text-center text-sm">{transport.MANAGER_NM || '-'}</td>
                      <td className="p-2 text-center text-sm">{transport.MANAGER_TEL || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-[var(--border)]">
                    <td colSpan={10} className="p-4 text-center text-[var(--muted)]">
                      운송 운임 정보가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="flex justify-center gap-2">
          <button
            onClick={handleList}
            className="px-6 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] font-medium"
          >
            목록
          </button>
          <button
            onClick={handleEdit}
            className="px-6 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] font-medium"
          >
            수정
          </button>
        </div>
      </main>

      <CloseConfirmModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onConfirm={handleConfirmClose}
      />
    </PageLayout>
  );
}
