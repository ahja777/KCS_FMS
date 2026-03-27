'use client';

import { formatCurrency } from '@/utils/format';

interface BLData {
  mblNo?: string;
  hblNo?: string;
  blType?: string;
  issueDate?: string;
  issuePlace?: string;
  shipper?: string;
  shipperAddress?: string;
  consignee?: string;
  consigneeAddress?: string;
  notifyParty?: string;
  notifyPartyAddress?: string;
  carrier?: string;
  carrierName?: string;
  vessel?: string;
  voyage?: string;
  pol?: string;
  polName?: string;
  pod?: string;
  podName?: string;
  placeOfReceipt?: string;
  placeOfDelivery?: string;
  finalDest?: string;
  etd?: string;
  eta?: string;
  containerType?: string;
  containerQty?: number;
  sealNo?: string;
  packages?: number;
  packageType?: string;
  grossWeight?: number;
  measurement?: number;
  commodity?: string;
  marksNos?: string;
  freightTerms?: string;
  freightPrepaid?: number;
  freightCollect?: number;
  remarks?: string;
  [key: string]: unknown;
}

interface BLReportProps {
  data: Record<string, unknown>[];
  isCheck?: boolean;
}

export default function BLReport({ data, isCheck = false }: BLReportProps) {
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
        const bl = item as BLData;
        return (
          <div key={index} className="report-container" style={{ pageBreakAfter: index < data.length - 1 ? 'always' : 'auto' }}>
            {/* 헤더 */}
            <div className="report-header">
              <div className="report-title">
                {isCheck ? 'B/L (CHECK)' : 'BILL OF LADING'}
              </div>
              <div className="report-subtitle">
                {bl.blType === 'ORIGINAL' ? 'ORIGINAL' : 'COPY NON-NEGOTIABLE'}
              </div>
            </div>

            {/* B/L 번호 */}
            <div className="report-section">
              <table>
                <tbody>
                  <tr>
                    <th style={{ width: '120px' }}>M B/L No.</th>
                    <td style={{ width: '200px', fontWeight: 'bold' }}>{bl.mblNo || '-'}</td>
                    <th style={{ width: '120px' }}>H B/L No.</th>
                    <td style={{ fontWeight: 'bold' }}>{bl.hblNo || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* SHIPPER */}
            <div className="report-section">
              <table>
                <tbody>
                  <tr>
                    <th style={{ width: '120px', verticalAlign: 'top' }}>SHIPPER</th>
                    <td>
                      <div style={{ fontWeight: 'bold' }}>{bl.shipper || '-'}</div>
                      <div style={{ whiteSpace: 'pre-line' }}>{bl.shipperAddress || ''}</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* CONSIGNEE */}
            <div className="report-section">
              <table>
                <tbody>
                  <tr>
                    <th style={{ width: '120px', verticalAlign: 'top' }}>CONSIGNEE</th>
                    <td>
                      <div style={{ fontWeight: 'bold' }}>{bl.consignee || 'TO ORDER'}</div>
                      <div style={{ whiteSpace: 'pre-line' }}>{bl.consigneeAddress || ''}</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* NOTIFY PARTY */}
            <div className="report-section">
              <table>
                <tbody>
                  <tr>
                    <th style={{ width: '120px', verticalAlign: 'top' }}>NOTIFY PARTY</th>
                    <td>
                      <div style={{ fontWeight: 'bold' }}>{bl.notifyParty || 'SAME AS CONSIGNEE'}</div>
                      <div style={{ whiteSpace: 'pre-line' }}>{bl.notifyPartyAddress || ''}</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 선박/항로정보 */}
            <div className="report-section">
              <table>
                <tbody>
                  <tr>
                    <th>CARRIER</th>
                    <td>{bl.carrierName || bl.carrier || '-'}</td>
                    <th>VESSEL / VOYAGE</th>
                    <td>{bl.vessel || '-'} / {bl.voyage || '-'}</td>
                  </tr>
                  <tr>
                    <th>PLACE OF RECEIPT</th>
                    <td>{bl.placeOfReceipt || bl.polName || bl.pol || '-'}</td>
                    <th>PORT OF LOADING</th>
                    <td>{bl.polName || bl.pol || '-'}</td>
                  </tr>
                  <tr>
                    <th>PORT OF DISCHARGE</th>
                    <td>{bl.podName || bl.pod || '-'}</td>
                    <th>PLACE OF DELIVERY</th>
                    <td>{bl.placeOfDelivery || bl.finalDest || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 화물정보 */}
            <div className="report-section">
              <div className="section-title">PARTICULARS FURNISHED BY SHIPPER</div>
              <table>
                <thead>
                  <tr style={{ background: '#f9f9f9' }}>
                    <th style={{ width: '20%' }}>MARKS & NOS.</th>
                    <th style={{ width: '25%' }}>DESCRIPTION OF GOODS</th>
                    <th style={{ width: '15%' }}>NO. OF PKGS</th>
                    <th style={{ width: '20%' }}>GROSS WEIGHT</th>
                    <th style={{ width: '20%' }}>MEASUREMENT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ minHeight: '100px' }}>
                    <td style={{ verticalAlign: 'top', whiteSpace: 'pre-line' }}>
                      {bl.marksNos || 'N/M'}
                    </td>
                    <td style={{ verticalAlign: 'top' }}>
                      <div>{bl.commodity || '-'}</div>
                      <div style={{ marginTop: '5px', fontSize: '8pt' }}>
                        CONTAINER: {bl.containerType || '-'} x {bl.containerQty || 0}
                      </div>
                      {bl.sealNo && (
                        <div style={{ marginTop: '3px', fontSize: '8pt' }}>
                          SEAL NO: {bl.sealNo}
                        </div>
                      )}
                    </td>
                    <td className="text-center" style={{ verticalAlign: 'top' }}>
                      {formatNumber(bl.packages)} {bl.packageType || 'PKGS'}
                    </td>
                    <td className="text-right" style={{ verticalAlign: 'top' }}>
                      {formatNumber(bl.grossWeight)} KGS
                    </td>
                    <td className="text-right" style={{ verticalAlign: 'top' }}>
                      {formatNumber(bl.measurement)} CBM
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 운임정보 */}
            <div className="report-section">
              <table>
                <tbody>
                  <tr>
                    <th>FREIGHT TERMS</th>
                    <td>{bl.freightTerms || 'PREPAID'}</td>
                    <th>FREIGHT PREPAID</th>
                    <td>{bl.freightPrepaid ? `USD ${formatCurrency(bl.freightPrepaid)}` : '-'}</td>
                  </tr>
                  <tr>
                    <th>DATE OF ISSUE</th>
                    <td>{formatDate(bl.issueDate)}</td>
                    <th>FREIGHT COLLECT</th>
                    <td>{bl.freightCollect ? `USD ${formatCurrency(bl.freightCollect)}` : '-'}</td>
                  </tr>
                  <tr>
                    <th>PLACE OF ISSUE</th>
                    <td colSpan={3}>{bl.issuePlace || 'BUSAN, KOREA'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* CHECK 도장 (B/L CHECK인 경우) */}
            {isCheck && (
              <div style={{
                position: 'absolute',
                top: '40%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-30deg)',
                fontSize: '60pt',
                fontWeight: 'bold',
                color: 'rgba(200, 0, 0, 0.3)',
                border: '5px solid rgba(200, 0, 0, 0.3)',
                padding: '10px 30px',
                pointerEvents: 'none',
              }}>
                CHECK
              </div>
            )}

            {/* 서명영역 */}
            <div className="signature-area" style={{ marginTop: '40px' }}>
              <div></div>
              <div className="signature-box">
                <div style={{
                  width: '150px',
                  height: '60px',
                  border: '1px solid #ddd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '5px'
                }}>
                  (인)
                </div>
                <div className="signature-line">
                  AS CARRIER
                </div>
              </div>
            </div>

            {/* 회사정보 */}
            <div className="company-info">
              <p>인터지스 주식회사 / INTERGIS CO., LTD.</p>
              <p>Trade Tower 3202, 159-1 Samsung-dong, Gangnam-gu, Seoul, Korea</p>
              <p>TEL: +82-2-1566-2119 / FAX: +82-2-6000-2138</p>
            </div>
          </div>
        );
      })}
    </>
  );
}
