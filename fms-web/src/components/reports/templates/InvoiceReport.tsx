'use client';

import { formatCurrency } from '@/utils/format';

interface InvoiceItem {
  description?: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  amount?: number;
}

interface InvoiceData {
  invoiceNo?: string;
  invoiceDate?: string;
  dueDate?: string;
  customerName?: string;
  customerAddress?: string;
  customerTel?: string;
  blNo?: string;
  shipmentNo?: string;
  vessel?: string;
  voyage?: string;
  pol?: string;
  pod?: string;
  etd?: string;
  eta?: string;
  items?: InvoiceItem[];
  subtotal?: number;
  vat?: number;
  total?: number;
  currency?: string;
  bankInfo?: string;
  remarks?: string;
  [key: string]: unknown;
}

interface InvoiceReportProps {
  data: Record<string, unknown>[];
}

export default function InvoiceReport({ data }: InvoiceReportProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return dateStr.split('T')[0];
  };

  return (
    <>
      {data.map((item, index) => {
        const invoice = item as InvoiceData;
        const items = invoice.items || [];

        return (
          <div key={index} className="report-container" style={{ pageBreakAfter: index < data.length - 1 ? 'always' : 'auto' }}>
            {/* 헤더 */}
            <div className="report-header">
              <div className="report-title">청구서</div>
              <div className="report-subtitle">INVOICE</div>
            </div>

            {/* 기본정보 */}
            <div className="report-section">
              <table>
                <tbody>
                  <tr>
                    <th style={{ width: '120px' }}>청구번호</th>
                    <td style={{ width: '200px', fontWeight: 'bold' }}>{invoice.invoiceNo || '-'}</td>
                    <th style={{ width: '120px' }}>청구일자</th>
                    <td>{formatDate(invoice.invoiceDate)}</td>
                  </tr>
                  <tr>
                    <th>납부기한</th>
                    <td style={{ color: '#DC2626', fontWeight: 'bold' }}>{formatDate(invoice.dueDate)}</td>
                    <th>B/L No.</th>
                    <td>{invoice.blNo || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 고객정보 */}
            <div className="report-section">
              <div className="section-title">청구처 / BILL TO</div>
              <table>
                <tbody>
                  <tr>
                    <th>상호</th>
                    <td>{invoice.customerName || '-'}</td>
                  </tr>
                  <tr>
                    <th>주소</th>
                    <td>{invoice.customerAddress || '-'}</td>
                  </tr>
                  <tr>
                    <th>연락처</th>
                    <td>{invoice.customerTel || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 선적정보 */}
            <div className="report-section">
              <div className="section-title">선적정보 / SHIPMENT INFO</div>
              <table>
                <tbody>
                  <tr>
                    <th>선명/항차</th>
                    <td>{invoice.vessel || '-'} / {invoice.voyage || '-'}</td>
                  </tr>
                  <tr>
                    <th>출발항</th>
                    <td>{invoice.pol || '-'}</td>
                    <th>도착항</th>
                    <td>{invoice.pod || '-'}</td>
                  </tr>
                  <tr>
                    <th>ETD</th>
                    <td>{formatDate(invoice.etd)}</td>
                    <th>ETA</th>
                    <td>{formatDate(invoice.eta)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 비용내역 */}
            <div className="report-section">
              <div className="section-title">비용내역 / CHARGES</div>
              <table>
                <thead>
                  <tr style={{ background: '#f9f9f9' }}>
                    <th style={{ width: '40%' }}>항목</th>
                    <th style={{ width: '15%' }}>수량</th>
                    <th style={{ width: '15%' }}>단위</th>
                    <th style={{ width: '15%' }} className="text-right">단가</th>
                    <th style={{ width: '15%' }} className="text-right">금액</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length > 0 ? items.map((chargeItem, idx) => (
                    <tr key={idx}>
                      <td>{chargeItem.description || '-'}</td>
                      <td className="text-center">{chargeItem.quantity || 1}</td>
                      <td className="text-center">{chargeItem.unit || '-'}</td>
                      <td className="text-right">{formatCurrency(chargeItem.unitPrice)}</td>
                      <td className="text-right">{formatCurrency(chargeItem.amount)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="text-center" style={{ padding: '20px', color: '#999' }}>
                        청구 항목이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="text-right">소계</td>
                    <td className="text-right">{formatCurrency(invoice.subtotal)}</td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="text-right">VAT (10%)</td>
                    <td className="text-right">{formatCurrency(invoice.vat)}</td>
                  </tr>
                  <tr className="total-row">
                    <td colSpan={4} className="text-right font-bold">합계</td>
                    <td className="text-right font-bold" style={{ fontSize: '12pt' }}>
                      {invoice.currency || 'KRW'} {formatCurrency(invoice.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 입금정보 */}
            <div className="report-section">
              <div className="section-title">입금정보 / PAYMENT INFO</div>
              <table>
                <tbody>
                  <tr>
                    <th style={{ width: '120px' }}>입금계좌</th>
                    <td>{invoice.bankInfo || '신한은행 110-XXX-XXXXXX (인터지스 주식회사)'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 비고 */}
            {invoice.remarks && (
              <div className="report-section">
                <div className="section-title">비고 / REMARKS</div>
                <div style={{ padding: '10px', border: '1px solid #ddd', minHeight: '50px' }}>
                  {invoice.remarks}
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
