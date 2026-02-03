'use client';

import { formatCurrency } from '@/utils/format';

interface SRData {
  srNo?: string;
  srDate?: string;
  bookingNo?: string;
  shipper?: string;
  shipperAddress?: string;
  shipperContact?: string;
  consignee?: string;
  consigneeAddress?: string;
  notifyParty?: string;
  carrier?: string;
  carrierName?: string;
  vessel?: string;
  voyage?: string;
  pol?: string;
  polName?: string;
  pod?: string;
  podName?: string;
  finalDest?: string;
  etd?: string;
  eta?: string;
  closingDate?: string;
  containerType?: string;
  containerQty?: number;
  commodity?: string;
  grossWeight?: number;
  measurement?: number;
  freightTerms?: string;
  remarks?: string;
  [key: string]: unknown;
}

interface SRReportProps {
  data: Record<string, unknown>[];
}

export default function SRReport({ data }: SRReportProps) {
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
        const sr = item as SRData;
        return (
          <div key={index} className="report-container" style={{ pageBreakAfter: index < data.length - 1 ? 'always' : 'auto' }}>
            {/* 헤더 */}
            <div className="report-header">
              <div className="report-title">선적요청서</div>
              <div className="report-subtitle">SHIPPING REQUEST (S/R)</div>
            </div>

            {/* 기본정보 */}
            <div className="report-section">
              <table>
                <tbody>
                  <tr>
                    <th style={{ width: '120px' }}>S/R 번호</th>
                    <td style={{ width: '200px', fontWeight: 'bold' }}>{sr.srNo || '-'}</td>
                    <th style={{ width: '120px' }}>요청일자</th>
                    <td>{formatDate(sr.srDate)}</td>
                  </tr>
                  <tr>
                    <th>부킹번호</th>
                    <td colSpan={3}>{sr.bookingNo || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 화주정보 */}
            <div className="report-section">
              <div className="section-title">화주정보 / SHIPPER</div>
              <table>
                <tbody>
                  <tr>
                    <th>상호</th>
                    <td>{sr.shipper || '-'}</td>
                  </tr>
                  <tr>
                    <th>주소</th>
                    <td>{sr.shipperAddress || '-'}</td>
                  </tr>
                  <tr>
                    <th>담당자</th>
                    <td>{sr.shipperContact || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 수하인정보 */}
            <div className="report-section">
              <div className="section-title">수하인정보 / CONSIGNEE</div>
              <table>
                <tbody>
                  <tr>
                    <th>상호</th>
                    <td>{sr.consignee || '-'}</td>
                  </tr>
                  <tr>
                    <th>주소</th>
                    <td>{sr.consigneeAddress || '-'}</td>
                  </tr>
                  <tr>
                    <th>Notify Party</th>
                    <td>{sr.notifyParty || 'SAME AS CONSIGNEE'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 스케줄정보 */}
            <div className="report-section">
              <div className="section-title">스케줄정보 / SCHEDULE</div>
              <table>
                <tbody>
                  <tr>
                    <th>선사</th>
                    <td>{sr.carrierName || sr.carrier || '-'}</td>
                    <th>선명/항차</th>
                    <td>{sr.vessel || '-'} / {sr.voyage || '-'}</td>
                  </tr>
                  <tr>
                    <th>출발항(POL)</th>
                    <td>{sr.polName || sr.pol || '-'}</td>
                    <th>도착항(POD)</th>
                    <td>{sr.podName || sr.pod || '-'}</td>
                  </tr>
                  <tr>
                    <th>최종목적지</th>
                    <td colSpan={3}>{sr.finalDest || '-'}</td>
                  </tr>
                  <tr>
                    <th>ETD</th>
                    <td>{formatDate(sr.etd)}</td>
                    <th>ETA</th>
                    <td>{formatDate(sr.eta)}</td>
                  </tr>
                  <tr>
                    <th>마감일</th>
                    <td colSpan={3}>{formatDate(sr.closingDate)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 화물정보 */}
            <div className="report-section">
              <div className="section-title">화물정보 / CARGO DETAILS</div>
              <table>
                <tbody>
                  <tr>
                    <th>컨테이너</th>
                    <td>{sr.containerType || '-'} x {sr.containerQty || 0}</td>
                    <th>품명</th>
                    <td>{sr.commodity || '-'}</td>
                  </tr>
                  <tr>
                    <th>총중량(KG)</th>
                    <td>{formatNumber(sr.grossWeight)}</td>
                    <th>총용적(CBM)</th>
                    <td>{formatNumber(sr.measurement)}</td>
                  </tr>
                  <tr>
                    <th>운임조건</th>
                    <td colSpan={3}>{sr.freightTerms || 'CY-CY'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 비고 */}
            <div className="report-section">
              <div className="section-title">비고 / REMARKS</div>
              <div style={{ padding: '10px', border: '1px solid #ddd', minHeight: '80px' }}>
                {sr.remarks || '-'}
              </div>
            </div>

            {/* 요청사항 안내 */}
            <div className="report-section" style={{ marginTop: '20px' }}>
              <div style={{ padding: '15px', background: '#f0f9ff', border: '1px solid #bae6fd', fontSize: '9pt' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>※ 요청사항</p>
                <ul style={{ paddingLeft: '20px' }}>
                  <li>상기 내용대로 선적을 요청하오니 처리하여 주시기 바랍니다.</li>
                  <li>선적 진행 후 선적통지서(S/N) 발급을 부탁드립니다.</li>
                  <li>변경사항 발생 시 즉시 연락 부탁드립니다.</li>
                </ul>
              </div>
            </div>

            {/* 서명영역 */}
            <div className="signature-area" style={{ marginTop: '40px' }}>
              <div className="signature-box">
                <div className="signature-line">
                  요청자
                </div>
              </div>
              <div className="signature-box">
                <div className="signature-line">
                  승인자
                </div>
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
