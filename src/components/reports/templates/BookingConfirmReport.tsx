'use client';

import { formatCurrency } from '@/utils/format';

interface BookingData {
  bookingNo?: string;
  bookingDate?: string;
  bookingType?: string;
  shipper?: string;
  shipperAddress?: string;
  shipperContact?: string;
  shipperTel?: string;
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
  closingTime?: string;
  containerType?: string;
  containerQty?: number;
  commodity?: string;
  grossWeight?: number;
  measurement?: number;
  freightTerms?: string;
  specialRequest?: string;
  remarks?: string;
  [key: string]: unknown;
}

interface BookingConfirmReportProps {
  data: Record<string, unknown>[];
}

export default function BookingConfirmReport({ data }: BookingConfirmReportProps) {
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
        const booking = item as BookingData;
        return (
          <div key={index} className="report-container" style={{ pageBreakAfter: index < data.length - 1 ? 'always' : 'auto' }}>
            {/* 헤더 */}
            <div className="report-header">
              <div className="report-title">부킹 확인서</div>
              <div className="report-subtitle">BOOKING CONFIRMATION</div>
            </div>

            {/* 기본정보 */}
            <div className="report-section">
              <table>
                <tbody>
                  <tr>
                    <th style={{ width: '120px' }}>부킹번호</th>
                    <td style={{ width: '200px' }}>{booking.bookingNo || '-'}</td>
                    <th style={{ width: '120px' }}>부킹일자</th>
                    <td>{formatDate(booking.bookingDate)}</td>
                  </tr>
                  <tr>
                    <th>부킹유형</th>
                    <td>{booking.bookingType || '-'}</td>
                    <th>운임조건</th>
                    <td>{booking.freightTerms || '-'}</td>
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
                    <td>{booking.shipper || '-'}</td>
                  </tr>
                  <tr>
                    <th>주소</th>
                    <td>{booking.shipperAddress || '-'}</td>
                  </tr>
                  <tr>
                    <th>담당자</th>
                    <td>{booking.shipperContact || '-'}</td>
                    <th>연락처</th>
                    <td>{booking.shipperTel || '-'}</td>
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
                    <td>{booking.consignee || '-'}</td>
                  </tr>
                  <tr>
                    <th>주소</th>
                    <td>{booking.consigneeAddress || '-'}</td>
                  </tr>
                  <tr>
                    <th>Notify Party</th>
                    <td colSpan={3}>{booking.notifyParty || 'SAME AS CONSIGNEE'}</td>
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
                    <td>{booking.carrierName || booking.carrier || '-'}</td>
                    <th>선명/항차</th>
                    <td>{booking.vessel || '-'} / {booking.voyage || '-'}</td>
                  </tr>
                  <tr>
                    <th>출발항(POL)</th>
                    <td>{booking.polName || booking.pol || '-'}</td>
                    <th>도착항(POD)</th>
                    <td>{booking.podName || booking.pod || '-'}</td>
                  </tr>
                  <tr>
                    <th>최종목적지</th>
                    <td colSpan={3}>{booking.finalDest || '-'}</td>
                  </tr>
                  <tr>
                    <th>ETD</th>
                    <td>{formatDate(booking.etd)}</td>
                    <th>ETA</th>
                    <td>{formatDate(booking.eta)}</td>
                  </tr>
                  <tr>
                    <th>마감일시</th>
                    <td colSpan={3}>
                      {formatDate(booking.closingDate)} {booking.closingTime || ''}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 화물정보 */}
            <div className="report-section">
              <div className="section-title">화물정보 / CARGO</div>
              <table>
                <tbody>
                  <tr>
                    <th>컨테이너</th>
                    <td>{booking.containerType || '-'} x {booking.containerQty || 0}</td>
                    <th>품명</th>
                    <td>{booking.commodity || '-'}</td>
                  </tr>
                  <tr>
                    <th>총중량(KG)</th>
                    <td>{formatNumber(booking.grossWeight)}</td>
                    <th>총용적(CBM)</th>
                    <td>{formatNumber(booking.measurement)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 특기사항 */}
            {(booking.specialRequest || booking.remarks) && (
              <div className="report-section">
                <div className="section-title">특기사항 / REMARKS</div>
                <div style={{ padding: '10px', border: '1px solid #ddd', minHeight: '50px' }}>
                  {booking.specialRequest || booking.remarks || '-'}
                </div>
              </div>
            )}

            {/* 확인사항 안내 */}
            <div className="report-section" style={{ marginTop: '20px' }}>
              <div style={{ padding: '15px', background: '#fffbeb', border: '1px solid #fcd34d', fontSize: '9pt' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>※ 확인사항</p>
                <ul style={{ paddingLeft: '20px' }}>
                  <li>상기 부킹 내용을 확인하시고 변경사항이 있으시면 즉시 연락 부탁드립니다.</li>
                  <li>마감일시까지 선적서류를 제출해 주시기 바랍니다.</li>
                  <li>본 확인서는 부킹 접수에 대한 확인이며, 선적을 보장하지 않습니다.</li>
                </ul>
              </div>
            </div>

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
