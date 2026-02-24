'use client';

import { useState, useEffect, use, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { ActionButton } from '@/components/buttons';

interface FreightDetail {
  DETAIL_ID: number;
  DETAIL_SEQ: number;
  FREIGHT_TYPE: string;
  FREIGHT_CD: string;
  CURRENCY_CD: string;
  KG_LB: string;
  RATE_MIN_AIR: number;
  RATE_AWB: number;
  RATE_45L: number;
  RATE_45: number;
  RATE_100: number;
  RATE_300: number;
  RATE_500: number;
  RATE_1000: number;
}

interface TransportDetail {
  TRANSPORT_ID: number;
  TRANSPORT_SEQ: number;
  FREIGHT_CD: string;
  ORIGIN_CD: string;
  ORIGIN_NM: string;
  DEST_CD: string;
  DEST_NM: string;
  RATE_LCL: number;
  RATE_20FT: number;
  RATE_40FT: number;
  ETC_TRANSPORT: number;
  MANAGER_NM: string;
  MANAGER_TEL: string;
  MANAGER_FAX: string;
  MANAGER_EMAIL: string;
}

interface CorporateRateData {
  RATE_ID: number;
  RATE_NO: string;
  TRANSPORT_MODE: string;
  IO_TYPE: string;
  BIZ_TYPE: string;
  SALES_REP: string;
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
  INSURANCE_AMT: number;
  STORAGE_AMT: number;
  HANDLING_AMT: number;
  INPUT_EMPLOYEE: string;
  REGION_CD: string;
  REMARK: string;
  CREATED_DTM: string;
  details: FreightDetail[];
  transports: TransportDetail[];
}

const ioTypeLabels: Record<string, string> = {
  EXPORT: '수출',
  IMPORT: '수입',
};

const bizTypeLabels: Record<string, string> = {
  LOCAL: '로컬',
  CROSS: '크로스',
  TRIANGLE: '삼국간',
};

export default function CorporateRateAirDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const [data, setData] = useState<CorporateRateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCloseModal, setShowCloseModal] = useState(false);

  const handleConfirmClose = () => {
    setShowCloseModal(false);
    router.push('/logis/rate/corporate/air');
  };

  useCloseConfirm({
    showModal: showCloseModal,
    setShowModal: setShowCloseModal,
    onConfirmClose: handleConfirmClose,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/logis/rate/corporate?rateId=${resolvedParams.id}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else {
        setData(null);
      }
    } catch (error) {
      console.error('데이터 조회 실패:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = () => {
    router.push(`/logis/rate/corporate/air/register?id=${resolvedParams.id}`);
  };

  const handleList = () => {
    router.push('/logis/rate/corporate/air');
  };

  const formatNumber = (val: number | string | null | undefined) => {
    if (val === null || val === undefined || val === '') return '-';
    const num = Number(val);
    if (isNaN(num) || num === 0) return '-';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

  if (!data) {
    return (
      <PageLayout title="기업운임관리 상세 (항공)" subtitle="HOME > 운임관리 > 기업운임관리 (항공) > 상세" onClose={() => setShowCloseModal(true)}>
        <main className="p-6">
          <div className="card p-12 text-center">
            <svg className="w-16 h-16 text-[var(--muted)] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">기업운임 정보를 찾을 수 없습니다</h3>
            <p className="text-[var(--muted)] mb-6">요청하신 정보가 존재하지 않습니다.</p>
            <button onClick={handleList} className="px-6 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">
              목록으로 돌아가기
            </button>
          </div>
        </main>
        <CloseConfirmModal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} onConfirm={handleConfirmClose} />
      </PageLayout>
    );
  }

  const labelCls = 'block text-xs text-[var(--muted)] mb-1';
  const valueCls = 'text-[var(--foreground)] font-medium';

  return (
    <PageLayout title="기업운임관리 상세 (항공)" subtitle="HOME > 운임관리 > 기업운임관리 (항공) > 상세조회" onClose={() => setShowCloseModal(true)}>
      <main ref={formRef} className="p-6">
        {/* 상단 버튼 */}
        <div className="flex justify-end items-center mb-6">
          <div className="flex gap-2">
            <ActionButton variant="default" icon="list" onClick={handleList}>목록</ActionButton>
            <ActionButton variant="default" icon="edit" onClick={handleEdit}>수정</ActionButton>
          </div>
        </div>

        {/* 기본정보 */}
        <div className="card mb-6">
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="font-bold">기본정보</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-6 gap-4 mb-4">
              <div>
                <label className={labelCls}>운임번호</label>
                <p className="text-[#E8A838] font-bold text-lg">{data.RATE_NO}</p>
              </div>
              <div>
                <label className={labelCls}>수출/수입</label>
                <p className={valueCls}>{ioTypeLabels[data.IO_TYPE] || data.IO_TYPE || '-'}</p>
              </div>
              <div>
                <label className={labelCls}>업무유형</label>
                <p className={valueCls}>{bizTypeLabels[data.BIZ_TYPE] || data.BIZ_TYPE || '-'}</p>
              </div>
              <div>
                <label className={labelCls}>영업사원</label>
                <p className={valueCls}>{data.SALES_REP || '-'}</p>
              </div>
              <div>
                <label className={labelCls}>입력자</label>
                <p className={valueCls}>{data.INPUT_EMPLOYEE || '-'}</p>
              </div>
              <div>
                <label className={labelCls}>지역코드</label>
                <p className={valueCls}>{data.REGION_CD || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <label className={labelCls}>고객코드</label>
                <p className={valueCls}>{data.CUSTOMER_CD || '-'}</p>
              </div>
              <div>
                <label className={labelCls}>고객사명</label>
                <p className={valueCls}>{data.CUSTOMER_NM || '-'}</p>
              </div>
              <div>
                <label className={labelCls}>항공사 코드</label>
                <p className={valueCls}>{data.CARRIER_CD || '-'}</p>
              </div>
              <div>
                <label className={labelCls}>항공사</label>
                <p className={valueCls}>{data.CARRIER_NM || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-4">
              <div>
                <label className={labelCls}>출발공항 (POL)</label>
                <p className={valueCls}>{data.POL_CD ? `${data.POL_CD} ${data.POL_NM || ''}` : '-'}</p>
              </div>
              <div>
                <label className={labelCls}>도착공항 (POD)</label>
                <p className={valueCls}>{data.POD_CD ? `${data.POD_CD} ${data.POD_NM || ''}` : '-'}</p>
              </div>
              <div>
                <label className={labelCls}>최종목적지</label>
                <p className={valueCls}>{data.POD2_CD ? `${data.POD2_CD} ${data.POD2_NM || ''}` : '-'}</p>
              </div>
              <div>
                <label className={labelCls}>보험료</label>
                <p className={valueCls}>{formatNumber(data.INSURANCE_AMT)}</p>
              </div>
              <div>
                <label className={labelCls}>보관료</label>
                <p className={valueCls}>{formatNumber(data.STORAGE_AMT)}</p>
              </div>
              <div>
                <label className={labelCls}>Handling 비용</label>
                <p className={valueCls}>{formatNumber(data.HANDLING_AMT)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 운임 상세 (Freight) */}
        <div className="card mb-6">
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="font-bold">운임 상세 (Freight)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th className="text-center">No</th>
                  <th className="text-center">운임유형</th>
                  <th className="text-center">운임코드</th>
                  <th className="text-center">통화</th>
                  <th className="text-center">Kg/Lb</th>
                  <th className="text-center">Min</th>
                  <th className="text-center">Awb</th>
                  <th className="text-center">Rate_45L</th>
                  <th className="text-center">Rate_45</th>
                  <th className="text-center">Rate_100</th>
                  <th className="text-center">Rate_300</th>
                  <th className="text-center">Rate_500</th>
                  <th className="text-center">Rate_1000</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {data.details && data.details.length > 0 ? (
                  data.details.map((d, idx) => (
                    <tr key={d.DETAIL_ID || idx} className="bg-white">
                      <td className="px-4 py-3 text-center text-sm">{idx + 1}</td>
                      <td className="px-4 py-3 text-center text-sm">{d.FREIGHT_TYPE || '-'}</td>
                      <td className="px-4 py-3 text-center text-sm">{d.FREIGHT_CD || '-'}</td>
                      <td className="px-4 py-3 text-center text-sm">{d.CURRENCY_CD || '-'}</td>
                      <td className="px-4 py-3 text-center text-sm">{d.KG_LB || '-'}</td>
                      <td className="px-4 py-3 text-center text-sm">{formatNumber(d.RATE_MIN_AIR)}</td>
                      <td className="px-4 py-3 text-center text-sm">{formatNumber(d.RATE_AWB)}</td>
                      <td className="px-4 py-3 text-center text-sm">{formatNumber(d.RATE_45L)}</td>
                      <td className="px-4 py-3 text-center text-sm">{formatNumber(d.RATE_45)}</td>
                      <td className="px-4 py-3 text-center text-sm">{formatNumber(d.RATE_100)}</td>
                      <td className="px-4 py-3 text-center text-sm">{formatNumber(d.RATE_300)}</td>
                      <td className="px-4 py-3 text-center text-sm">{formatNumber(d.RATE_500)}</td>
                      <td className="px-4 py-3 text-center text-sm">{formatNumber(d.RATE_1000)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={13} className="px-4 py-6 text-center text-[var(--muted)]">등록된 운임 정보가 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 내륙운송 정보 */}
        {data.transports && data.transports.length > 0 && (
          <div className="card mb-6">
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="font-bold">내륙운송 정보</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th className="text-center">No</th>
                    <th className="text-center">운임코드</th>
                    <th className="text-center">출발지</th>
                    <th className="text-center">도착지</th>
                    <th className="text-center">LCL</th>
                    <th className="text-center">20FT</th>
                    <th className="text-center">40FT</th>
                    <th className="text-center">기타운송</th>
                    <th className="text-center">담당자</th>
                    <th className="text-center">연락처</th>
                    <th className="text-center">이메일</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {data.transports.map((t, idx) => (
                    <tr key={t.TRANSPORT_ID || idx} className="bg-white">
                      <td className="px-4 py-3 text-center text-sm">{idx + 1}</td>
                      <td className="px-4 py-3 text-center text-sm">{t.FREIGHT_CD || '-'}</td>
                      <td className="px-4 py-3 text-center text-sm">{t.ORIGIN_CD ? `${t.ORIGIN_CD} ${t.ORIGIN_NM || ''}` : '-'}</td>
                      <td className="px-4 py-3 text-center text-sm">{t.DEST_CD ? `${t.DEST_CD} ${t.DEST_NM || ''}` : '-'}</td>
                      <td className="px-4 py-3 text-center text-sm">{formatNumber(t.RATE_LCL)}</td>
                      <td className="px-4 py-3 text-center text-sm">{formatNumber(t.RATE_20FT)}</td>
                      <td className="px-4 py-3 text-center text-sm">{formatNumber(t.RATE_40FT)}</td>
                      <td className="px-4 py-3 text-center text-sm">{formatNumber(t.ETC_TRANSPORT)}</td>
                      <td className="px-4 py-3 text-center text-sm">{t.MANAGER_NM || '-'}</td>
                      <td className="px-4 py-3 text-center text-sm">{t.MANAGER_TEL || '-'}</td>
                      <td className="px-4 py-3 text-center text-sm">{t.MANAGER_EMAIL || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 비고 */}
        {data.REMARK && (
          <div className="card mb-6">
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="font-bold">비고</h3>
            </div>
            <div className="p-4">
              <p className="text-[var(--foreground)] text-sm whitespace-pre-wrap">{data.REMARK}</p>
            </div>
          </div>
        )}

        <div className="text-sm text-[var(--muted)]">등록일: {data.CREATED_DTM}</div>
      </main>

      <CloseConfirmModal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} onConfirm={handleConfirmClose} />
    </PageLayout>
  );
}
