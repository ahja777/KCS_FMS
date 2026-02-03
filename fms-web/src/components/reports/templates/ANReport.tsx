'use client';

import { formatCurrency } from '@/utils/format';

interface ANData {
  anNo?: string;
  anDate?: string;
  mblNo?: string;
  hblNo?: string;
  shipper?: string;
  consignee?: string;
  consigneeAddress?: string;
  consigneeTel?: string;
  notifyParty?: string;
  carrier?: string;
  carrierName?: string;
  vessel?: string;
  voyage?: string;
  pol?: string;
  polName?: string;
  pod?: string;
  podName?: string;
  eta?: string;
  ata?: string;
  containerType?: string;
  containerQty?: number;
  packages?: number;
  packageType?: string;
  grossWeight?: number;
  measurement?: number;
  commodity?: string;
  freightAmount?: number;
  freightCurrency?: string;
  thcAmount?: number;
  docFee?: number;
  otherCharges?: number;
  totalAmount?: number;
  dueDate?: string;
  bankInfo?: string;
  remarks?: string;
  [key: string]: unknown;
}

interface ANReportProps {
  data: Record<string, unknown>[];
}

export default function ANReport({ data }: ANReportProps) {
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
        const an = item as ANData;
        return (
          <div key={index} className="report-container" style={{ pageBreakAfter: index < data.length - 1 ? 'always' : 'auto' }}>
            {/* 헤더 */}
            <div className="report-header">
              <div className="report-title">화물도착통지서</div>
              <div className="report-subtitle">ARRIVAL NOTICE (A/N)</div>
            </div>

            {/* 기본정보 */}
            <div className="report-section">
              <table>
                <tbody>
                  <tr>
                    <th style={{ width: '120px' }}>A/N 번호</th>
                    <td style={{ width: '200px' }}>{an.anNo || '-'}</td>
                    <th style={{ width: '120px' }}>통지일자</th>
                    <td>{formatDate(an.anDate)}</td>
                  </tr>
                  <tr>
                    <th>M B/L No.</th>
                    <td>{an.mblNo || '-'}</td>
                    <th>H B/L No.</th>
                    <td>{an.hblNo || '-'}</td>
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
                    <td>{an.consignee || '-'}</td>
                  </tr>
                  <tr>
                    <th>주소</th>
                    <td>{an.consigneeAddress || '-'}</td>
                  </tr>
                  <tr>
                    <th>연락처</th>
                    <td>{an.consigneeTel || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 선박/항로정보 */}
            <div className="report-section">
              <div className="section-title">선박정보 / VESSEL INFO</div>
              <table>
                <tbody>
                  <tr>
                    <th>선사</th>
                    <td>{an.carrierName || an.carrier || '-'}</td>
                    <th>선명/항차</th>
                    <td>{an.vessel || '-'} / {an.voyage || '-'}</td>
                  </tr>
                  <tr>
                    <th>출발항(POL)</th>
                    <td>{an.polName || an.pol || '-'}</td>
                    <th>도착항(POD)</th>
                    <td>{an.podName || an.pod || '-'}</td>
                  </tr>
                  <tr>
                    <th>ETA (예정)</th>
                    <td>{formatDate(an.eta)}</td>
                    <th>ATA (실제)</th>
                    <td style={{ fontWeight: 'bold', color: '#059669' }}>{formatDate(an.ata)}</td>
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
                    <td>{an.containerType || '-'} x {an.containerQty || 0}</td>
                    <th>품명</th>
                    <td>{an.commodity || '-'}</td>
                  </tr>
                  <tr>
                    <th>수량</th>
                    <td>{formatNumber(an.packages)} {an.packageType || 'PKGS'}</td>
                    <th>총중량</th>
                    <td>{formatNumber(an.grossWeight)} KGS</td>
                  </tr>
                  <tr>
                    <th>총용적</th>
                    <td colSpan={3}>{formatNumber(an.measurement)} CBM</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 비용정보 */}
            <div className="report-section">
              <div className="section-title">비용정보 / CHARGES</div>
              <table>
                <thead>
                  <tr style={{ background: '#f9f9f9' }}>
                    <th style={{ width: '50%' }}>항목</th>
                    <th style={{ width: '25%' }}>통화</th>
                    <th style={{ width: '25%' }} className="text-right">금액</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>해상운임 (Ocean Freight)</td>
                    <td>{an.freightCurrency || 'USD'}</td>
                    <td className="text-right">{formatCurrency(an.freightAmount)}</td>
                  </tr>
                  <tr>
                    <td>THC (Terminal Handling Charge)</td>
                    <td>KRW</td>
                    <td className="text-right">{formatCurrency(an.thcAmount)}</td>
                  </tr>
                  <tr>
                    <td>서류비 (Documentation Fee)</td>
                    <td>KRW</td>
                    <td className="text-right">{formatCurrency(an.docFee)}</td>
                  </tr>
                  <tr>
                    <td>기타비용 (Other Charges)</td>
                    <td>KRW</td>
                    <td className="text-right">{formatCurrency(an.otherCharges)}</td>
                  </tr>
                  <tr className="total-row">
                    <td colSpan={2} className="text-right font-bold">합계</td>
                    <td className="text-right font-bold">
                      KRW {formatCurrency(an.totalAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 납부안내 */}
            <div className="report-section">
              <table>
                <tbody>
                  <tr>
                    <th style={{ width: '120px' }}>납부기한</th>
                    <td style={{ fontWeight: 'bold', color: '#DC2626' }}>{formatDate(an.dueDate)}</td>
                  </tr>
                  <tr>
                    <th>입금계좌</th>
                    <td>{an.bankInfo || '신한은행 110-XXX-XXXXXX (인터지스 주식회사)'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 안내문구 */}
            <div className="report-section" style={{ marginTop: '20px' }}>
              <div style={{ padding: '15px', background: '#fef2f2', border: '1px solid #fecaca', fontSize: '9pt' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>※ 안내사항</p>
                <p style={{ lineHeight: '1.6' }}>
                  귀하(사) 명의의 화물이 도착(예정)하였기에 통지 하오니 ORIGINAL B/L를 지참하시고,
                  관련비용을 납부하여 D/O를 발급받아 화물을 인수하여 주시기 바랍니다.
                </p>
                <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
                  <li>Free Time 경과 시 보관료가 발생합니다.</li>
                  <li>D/O 발급 후 화물 인수가 가능합니다.</li>
                </ul>
              </div>
            </div>

            {/* 비고 */}
            {an.remarks && (
              <div className="report-section">
                <div className="section-title">비고 / REMARKS</div>
                <div style={{ padding: '10px', border: '1px solid #ddd', minHeight: '50px' }}>
                  {an.remarks}
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
