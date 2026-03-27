'use client';

import { formatCurrency } from '@/utils/format';

interface QuoteData {
  quoteNo?: string;
  quoteDate?: string;
  validFrom?: string;
  validTo?: string;
  shipper?: string;
  shipperAddress?: string;
  consignee?: string;
  consigneeAddress?: string;
  pol?: string;
  polName?: string;
  pod?: string;
  podName?: string;
  carrier?: string;
  carrierName?: string;
  vessel?: string;
  voyage?: string;
  etd?: string;
  eta?: string;
  containerType?: string;
  containerQty?: number;
  commodity?: string;
  weight?: number;
  volume?: number;
  freightItems?: FreightItem[];
  totalAmount?: number;
  currency?: string;
  remarks?: string;
  [key: string]: unknown;
}

interface FreightItem {
  description: string;
  currency: string;
  unitPrice: number;
  quantity: number;
  amount: number;
}

interface QuoteReportProps {
  data: Record<string, unknown>[];
}

export default function QuoteReport({ data }: QuoteReportProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return dateStr.split('T')[0];
  };

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return '-';
    return formatCurrency(num);
  };

  return (
    <>
      {data.map((item, index) => {
        const quote = item as QuoteData;
        return (
          <div key={index} className="report-container" style={{ pageBreakAfter: index < data.length - 1 ? 'always' : 'auto' }}>
            {/* 헤더 */}
            <div className="report-header">
              <div className="report-title">견 적 서</div>
              <div className="report-subtitle">QUOTATION</div>
            </div>

            {/* 기본정보 */}
            <div className="report-section">
              <table>
                <tbody>
                  <tr>
                    <th style={{ width: '120px' }}>견적번호</th>
                    <td style={{ width: '200px' }}>{quote.quoteNo || '-'}</td>
                    <th style={{ width: '120px' }}>견적일자</th>
                    <td>{formatDate(quote.quoteDate)}</td>
                  </tr>
                  <tr>
                    <th>유효기간</th>
                    <td colSpan={3}>
                      {formatDate(quote.validFrom)} ~ {formatDate(quote.validTo)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 화주정보 */}
            <div className="report-section">
              <div className="section-title">화주정보</div>
              <table>
                <tbody>
                  <tr>
                    <th>SHIPPER</th>
                    <td>{quote.shipper || '-'}</td>
                  </tr>
                  <tr>
                    <th>주소</th>
                    <td>{quote.shipperAddress || '-'}</td>
                  </tr>
                  <tr>
                    <th>CONSIGNEE</th>
                    <td>{quote.consignee || '-'}</td>
                  </tr>
                  <tr>
                    <th>주소</th>
                    <td>{quote.consigneeAddress || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 운송정보 */}
            <div className="report-section">
              <div className="section-title">운송정보</div>
              <table>
                <tbody>
                  <tr>
                    <th>출발지(POL)</th>
                    <td>{quote.polName || quote.pol || '-'}</td>
                    <th>도착지(POD)</th>
                    <td>{quote.podName || quote.pod || '-'}</td>
                  </tr>
                  <tr>
                    <th>선사/항공사</th>
                    <td>{quote.carrierName || quote.carrier || '-'}</td>
                    <th>선명/항공편</th>
                    <td>{quote.vessel || '-'} / {quote.voyage || '-'}</td>
                  </tr>
                  <tr>
                    <th>ETD</th>
                    <td>{formatDate(quote.etd)}</td>
                    <th>ETA</th>
                    <td>{formatDate(quote.eta)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 화물정보 */}
            <div className="report-section">
              <div className="section-title">화물정보</div>
              <table>
                <tbody>
                  <tr>
                    <th>컨테이너</th>
                    <td>{quote.containerType || '-'} x {quote.containerQty || 0}</td>
                    <th>품명</th>
                    <td>{quote.commodity || '-'}</td>
                  </tr>
                  <tr>
                    <th>중량(KG)</th>
                    <td>{formatNumber(quote.weight)}</td>
                    <th>용적(CBM)</th>
                    <td>{formatNumber(quote.volume)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 운임정보 */}
            <div className="report-section">
              <div className="section-title">운임정보</div>
              <table>
                <thead>
                  <tr style={{ background: '#f9f9f9' }}>
                    <th style={{ width: '40%' }}>항목</th>
                    <th style={{ width: '15%' }}>통화</th>
                    <th style={{ width: '15%' }} className="text-right">단가</th>
                    <th style={{ width: '10%' }} className="text-right">수량</th>
                    <th style={{ width: '20%' }} className="text-right">금액</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.freightItems && quote.freightItems.length > 0 ? (
                    quote.freightItems.map((item, i) => (
                      <tr key={i}>
                        <td>{item.description}</td>
                        <td>{item.currency}</td>
                        <td className="text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="text-right">{item.quantity}</td>
                        <td className="text-right">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td>해상운임 (Ocean Freight)</td>
                      <td>{quote.currency || 'USD'}</td>
                      <td className="text-right">-</td>
                      <td className="text-right">-</td>
                      <td className="text-right">{formatCurrency(quote.totalAmount)}</td>
                    </tr>
                  )}
                  <tr className="total-row">
                    <td colSpan={4} className="text-right font-bold">합계</td>
                    <td className="text-right font-bold">
                      {quote.currency || 'USD'} {formatCurrency(quote.totalAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 비고 */}
            {quote.remarks && (
              <div className="report-section">
                <div className="section-title">비고</div>
                <div style={{ padding: '10px', border: '1px solid #ddd', minHeight: '50px' }}>
                  {quote.remarks}
                </div>
              </div>
            )}

            {/* 날인 영역 */}
            <div className="stamp-area">
              <div className="stamp-box">
                (인)
              </div>
            </div>

            {/* 회사정보 */}
            <div className="company-info">
              <p>인터지스 주식회사</p>
              <p>서울특별시 강남구 삼성동 159-1 무역센터 트레이드타워</p>
              <p>TEL: 02-1566-2119 / FAX: 02-6000-2138</p>
            </div>
          </div>
        );
      })}
    </>
  );
}
