'use client';

import { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { formatCurrency } from '@/utils/format';

// AWB 데이터 인터페이스
export interface AWBData {
  // 기본 정보
  hawbNo: string;
  mawbNo: string;
  awbDate: string;

  // 당사자 정보
  shipper: string;
  shipperAddress?: string;
  shipperTel?: string;
  shipperAccount?: string;
  consignee: string;
  consigneeAddress?: string;
  consigneeTel?: string;
  consigneeAccount?: string;

  // Agent 정보
  agentName?: string;
  agentCity?: string;
  agentIataCode?: string;
  agentAccount?: string;

  // 운송 정보
  carrier: string;
  carrierCode?: string;
  origin: string;           // Airport of Departure
  destination: string;      // Airport of Destination
  routingTo1?: string;
  routingBy1?: string;
  routingTo2?: string;
  routingBy2?: string;
  routingTo3?: string;
  routingBy3?: string;
  flightNo?: string;
  flightDate?: string;

  // 화물 정보
  pieces: number;
  weightUnit: 'K' | 'L';    // K=Kg, L=Lb
  grossWeight: number;
  chargeableWeight?: number;
  rateClass?: string;       // M=Minimum, N=Normal, Q=Quantity, etc.
  rate?: number;
  totalCharge?: number;
  natureOfGoods: string;
  dimensions?: string;
  volumeWeight?: number;

  // 요금 정보
  currency?: string;
  declaredValueCarriage?: string;
  declaredValueCustoms?: string;
  insuranceAmount?: string;

  // Prepaid/Collect
  weightChargePrepaid?: number;
  weightChargeCollect?: number;
  valuationChargePrepaid?: number;
  valuationChargeCollect?: number;
  taxPrepaid?: number;
  taxCollect?: number;
  otherChargesDueAgentPrepaid?: number;
  otherChargesDueAgentCollect?: number;
  otherChargesDueCarrierPrepaid?: number;
  otherChargesDueCarrierCollect?: number;
  totalPrepaid?: number;
  totalCollect?: number;

  // 기타
  handlingInfo?: string;
  sci?: string;             // Shipper's Certification for Dangerous Goods

  // 발행 정보
  executedOn?: string;
  executedAt?: string;
  signatureShipper?: string;
  signatureCarrier?: string;

  // 발행사 정보
  issuerName?: string;
  issuerAddress?: string;
  issuerTel?: string;
}

interface AWBPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  awbData: AWBData | null;
}

type PrintType = 'MAWB_FORM' | 'HAWB_FORM' | 'CHECK_AWB';

export default function AWBPrintModal({ isOpen, onClose, awbData }: AWBPrintModalProps) {
  const [printType, setPrintType] = useState<PrintType>('HAWB_FORM');
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: printType === 'MAWB_FORM'
      ? `MAWB_${awbData?.mawbNo}`
      : printType === 'HAWB_FORM'
        ? `HAWB_${awbData?.hawbNo}`
        : `CHECK_AWB_${awbData?.hawbNo}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 8mm;
      }
      @media print {
        * {
          box-sizing: border-box !important;
        }
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        table {
          border-collapse: collapse !important;
        }
        td, th {
          border: 1px solid black !important;
        }
      }
    `,
  });

  if (!isOpen || !awbData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[var(--surface-100)] rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-[var(--border)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-200)]">
          <h2 className="text-lg font-bold">AWB 출력</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--surface-50)] rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 출력 유형 선택 */}
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-50)]">
          <div className="flex items-center gap-6">
            <span className="font-medium">출력 양식:</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="printType"
                value="HAWB_FORM"
                checked={printType === 'HAWB_FORM'}
                onChange={() => setPrintType('HAWB_FORM')}
                className="w-4 h-4 text-blue-600"
              />
              <span className={printType === 'HAWB_FORM' ? 'font-semibold text-blue-600' : ''}>
                HAWB FORM
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="printType"
                value="MAWB_FORM"
                checked={printType === 'MAWB_FORM'}
                onChange={() => setPrintType('MAWB_FORM')}
                className="w-4 h-4 text-blue-600"
              />
              <span className={printType === 'MAWB_FORM' ? 'font-semibold text-blue-600' : ''}>
                MAWB FORM
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="printType"
                value="CHECK_AWB"
                checked={printType === 'CHECK_AWB'}
                onChange={() => setPrintType('CHECK_AWB')}
                className="w-4 h-4 text-blue-600"
              />
              <span className={printType === 'CHECK_AWB' ? 'font-semibold text-blue-600' : ''}>
                CHECK AWB
              </span>
            </label>
          </div>
        </div>

        {/* 미리보기 영역 */}
        <div className="overflow-auto max-h-[60vh] p-6 bg-gray-100">
          <div className="bg-white shadow-lg mx-auto" style={{ width: '210mm', minHeight: '297mm' }}>
            <div ref={printRef}>
              {printType === 'MAWB_FORM' ? (
                <MAWBFormTemplate data={awbData} />
              ) : printType === 'HAWB_FORM' ? (
                <HAWBFormTemplate data={awbData} />
              ) : (
                <CheckAWBTemplate data={awbData} />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--surface-200)] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-50)] transition-colors"
          >
            닫기
          </button>
          <button
            onClick={() => handlePrint()}
            className="px-6 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            출력
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== HAWB FORM (House Air Waybill) ====================
function HAWBFormTemplate({ data }: { data: AWBData }) {
  return (
    <div className="text-[9px] leading-tight" style={{
      fontFamily: 'Arial, sans-serif',
      width: '194mm',
      height: '281mm',
      padding: '0',
      margin: '0 auto',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 최상단 헤더 */}
      <table className="w-full border-collapse" style={{ borderWidth: '2px', borderStyle: 'solid', borderColor: '#000' }}>
        <tbody>
          <tr>
            {/* 좌측 - Shipper */}
            <td className="align-top" style={{ width: '50%', borderRight: '1px solid #000', padding: '6px', height: '80px' }} rowSpan={2}>
              <div className="text-[8px] mb-1 font-bold" style={{ color: '#1a365d' }}>Shipper&apos;s Name and Address</div>
              <div className="whitespace-pre-line text-[10px]" style={{ lineHeight: '1.4' }}>
                {data.shipper}
                {data.shipperAddress && `\n${data.shipperAddress}`}
                {data.shipperTel && `\nTEL: ${data.shipperTel}`}
              </div>
            </td>
            {/* 우측 상단 - 타이틀 */}
            <td className="text-center align-middle" style={{ padding: '8px', borderBottom: '1px solid #000', height: '40px' }}>
              <div className="font-bold text-[14px]" style={{ color: '#1a365d', letterSpacing: '3px' }}>HOUSE AIR WAYBILL</div>
              <div className="text-[8px] mt-1" style={{ color: '#666' }}>NOT NEGOTIABLE</div>
            </td>
          </tr>
          <tr>
            {/* 우측 하단 - AWB No */}
            <td style={{ padding: '6px' }}>
              <div className="text-[8px]" style={{ color: '#1a365d' }}>House Air Waybill No.</div>
              <div className="font-bold text-[14px] mt-1" style={{ color: '#c53030' }}>{data.hawbNo}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Consignee */}
      <table className="w-full border-collapse" style={{ borderWidth: '0 2px 1px 2px', borderStyle: 'solid', borderColor: '#000' }}>
        <tbody>
          <tr>
            <td className="align-top" style={{ width: '50%', borderRight: '1px solid #000', padding: '6px', height: '70px' }}>
              <div className="text-[8px] mb-1 font-bold" style={{ color: '#1a365d' }}>Consignee&apos;s Name and Address</div>
              <div className="whitespace-pre-line text-[10px]" style={{ lineHeight: '1.4' }}>
                {data.consignee}
                {data.consigneeAddress && `\n${data.consigneeAddress}`}
                {data.consigneeTel && `\nTEL: ${data.consigneeTel}`}
              </div>
            </td>
            <td className="align-top" style={{ padding: '6px' }}>
              <div className="text-[8px] mb-1 font-bold" style={{ color: '#1a365d' }}>MAWB No.</div>
              <div className="text-[12px] font-bold">{data.mawbNo}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Issuing Carrier's Agent */}
      <table className="w-full border-collapse" style={{ borderWidth: '0 2px 1px 2px', borderStyle: 'solid', borderColor: '#000' }}>
        <tbody>
          <tr>
            <td className="align-top" style={{ width: '50%', borderRight: '1px solid #000', padding: '6px', height: '55px' }}>
              <div className="text-[8px] mb-1 font-bold" style={{ color: '#1a365d' }}>Issuing Carrier&apos;s Agent Name and City</div>
              <div className="whitespace-pre-line text-[10px]" style={{ lineHeight: '1.4' }}>
                {data.agentName || data.issuerName || 'INTERGIS LOGISTICS CO., LTD.'}
                {data.agentCity && `, ${data.agentCity}`}
              </div>
            </td>
            <td style={{ padding: '6px' }}>
              <div className="flex justify-between">
                <div>
                  <div className="text-[8px]" style={{ color: '#1a365d' }}>Agent&apos;s IATA Code</div>
                  <div className="text-[10px]">{data.agentIataCode || ''}</div>
                </div>
                <div>
                  <div className="text-[8px]" style={{ color: '#1a365d' }}>Account No.</div>
                  <div className="text-[10px]">{data.agentAccount || ''}</div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Airport of Departure + Routing */}
      <table className="w-full border-collapse" style={{ borderWidth: '0 2px 1px 2px', borderStyle: 'solid', borderColor: '#000' }}>
        <tbody>
          <tr>
            <td style={{ width: '50%', borderRight: '1px solid #000', padding: '6px' }}>
              <div className="text-[8px] font-bold" style={{ color: '#1a365d' }}>Airport of Departure (Addr. of First Carrier) and Requested Routing</div>
              <div className="text-[11px] font-semibold mt-1">{data.origin}</div>
            </td>
            <td style={{ padding: '4px' }}>
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="text-[7px] text-center border-r border-black" style={{ width: '33%', color: '#1a365d' }}>To</td>
                    <td className="text-[7px] text-center border-r border-black" style={{ width: '34%', color: '#1a365d' }}>By First Carrier</td>
                    <td className="text-[7px] text-center" style={{ width: '33%', color: '#1a365d' }}>Routing and Destination</td>
                  </tr>
                  <tr>
                    <td className="text-[10px] text-center border-r border-black">{data.routingTo1 || data.destination}</td>
                    <td className="text-[10px] text-center border-r border-black">{data.routingBy1 || data.carrier}</td>
                    <td className="text-[10px] text-center">{data.routingTo2 || ''} {data.routingBy2 || ''}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Currency, Charges Declaration, etc. */}
      <table className="w-full border-collapse" style={{ borderWidth: '0 2px 1px 2px', borderStyle: 'solid', borderColor: '#000' }}>
        <tbody>
          <tr>
            <td className="text-center border-r border-black" style={{ width: '10%', padding: '3px' }}>
              <div className="text-[7px]" style={{ color: '#1a365d' }}>Currency</div>
              <div className="text-[9px]">{data.currency || 'USD'}</div>
            </td>
            <td className="text-center border-r border-black" style={{ width: '8%', padding: '3px' }}>
              <div className="text-[6px]" style={{ color: '#1a365d' }}>CHGS<br/>Code</div>
              <div className="text-[9px]">PP</div>
            </td>
            <td className="text-center border-r border-black" style={{ width: '7%', padding: '3px' }}>
              <div className="text-[6px]" style={{ color: '#1a365d' }}>WT/<br/>VAL</div>
              <div className="text-[9px]">P</div>
            </td>
            <td className="text-center border-r border-black" style={{ width: '7%', padding: '3px' }}>
              <div className="text-[6px]" style={{ color: '#1a365d' }}>Other</div>
              <div className="text-[9px]">P</div>
            </td>
            <td className="text-center border-r border-black" style={{ width: '17%', padding: '3px' }}>
              <div className="text-[6px]" style={{ color: '#1a365d' }}>Declared Value for Carriage</div>
              <div className="text-[9px]">{data.declaredValueCarriage || 'NVD'}</div>
            </td>
            <td className="text-center" style={{ width: '17%', padding: '3px' }}>
              <div className="text-[6px]" style={{ color: '#1a365d' }}>Declared Value for Customs</div>
              <div className="text-[9px]">{data.declaredValueCustoms || 'NCV'}</div>
            </td>
            <td className="border-l border-black" style={{ padding: '3px' }}>
              <div className="text-[7px]" style={{ color: '#1a365d' }}>Airport of Destination</div>
              <div className="text-[11px] font-semibold">{data.destination}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Flight/Date, Insurance */}
      <table className="w-full border-collapse" style={{ borderWidth: '0 2px 1px 2px', borderStyle: 'solid', borderColor: '#000' }}>
        <tbody>
          <tr>
            <td className="border-r border-black" style={{ width: '25%', padding: '4px' }}>
              <div className="text-[7px]" style={{ color: '#1a365d' }}>Flight/Date</div>
              <div className="text-[10px]">{data.flightNo || ''} / {data.flightDate || ''}</div>
            </td>
            <td className="border-r border-black" style={{ width: '25%', padding: '4px' }}>
              <div className="text-[7px]" style={{ color: '#1a365d' }}>For Carrier Use Only</div>
            </td>
            <td style={{ padding: '4px' }}>
              <div className="text-[7px]" style={{ color: '#1a365d' }}>Amount of Insurance</div>
              <div className="text-[10px]">{data.insuranceAmount || 'NIL'}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Handling Information */}
      <table className="w-full border-collapse" style={{ borderWidth: '0 2px 1px 2px', borderStyle: 'solid', borderColor: '#000' }}>
        <tbody>
          <tr>
            <td style={{ padding: '4px', height: '35px' }}>
              <div className="text-[7px]" style={{ color: '#1a365d' }}>Handling Information</div>
              <div className="text-[9px]">{data.handlingInfo || ''}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 화물 상세 헤더 */}
      <table className="w-full border-collapse" style={{ borderWidth: '0 2px 1px 2px', borderStyle: 'solid', borderColor: '#000', backgroundColor: '#f0f4f8' }}>
        <tbody>
          <tr>
            <td className="text-center border-r border-black" style={{ width: '8%', padding: '3px' }}>
              <div className="text-[7px] font-bold" style={{ color: '#1a365d' }}>No. of<br/>Pieces<br/>RCP</div>
            </td>
            <td className="text-center border-r border-black" style={{ width: '12%', padding: '3px' }}>
              <div className="text-[7px] font-bold" style={{ color: '#1a365d' }}>Gross<br/>Weight</div>
            </td>
            <td className="text-center border-r border-black" style={{ width: '5%', padding: '3px' }}>
              <div className="text-[7px] font-bold" style={{ color: '#1a365d' }}>kg<br/>lb</div>
            </td>
            <td className="text-center border-r border-black" style={{ width: '7%', padding: '3px' }}>
              <div className="text-[7px] font-bold" style={{ color: '#1a365d' }}>Rate<br/>Class</div>
            </td>
            <td className="text-center border-r border-black" style={{ width: '12%', padding: '3px' }}>
              <div className="text-[7px] font-bold" style={{ color: '#1a365d' }}>Chargeable<br/>Weight</div>
            </td>
            <td className="text-center border-r border-black" style={{ width: '10%', padding: '3px' }}>
              <div className="text-[7px] font-bold" style={{ color: '#1a365d' }}>Rate/<br/>Charge</div>
            </td>
            <td className="text-center border-r border-black" style={{ width: '12%', padding: '3px' }}>
              <div className="text-[7px] font-bold" style={{ color: '#1a365d' }}>Total</div>
            </td>
            <td className="text-center" style={{ width: '34%', padding: '3px' }}>
              <div className="text-[7px] font-bold" style={{ color: '#1a365d' }}>Nature and Quantity of Goods<br/>(incl. Dimensions or Volume)</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 화물 상세 내용 - flex-grow로 남은 공간 사용 */}
      <table className="w-full border-collapse relative" style={{ borderWidth: '0 2px 1px 2px', borderStyle: 'solid', borderColor: '#000', flex: '1' }}>
        <tbody>
          <tr style={{ height: '100%' }}>
            <td className="text-center border-r border-black align-top" style={{ width: '8%', padding: '6px' }}>
              <div className="text-[11px]">{data.pieces}</div>
            </td>
            <td className="text-right border-r border-black align-top" style={{ width: '12%', padding: '6px' }}>
              <div className="text-[11px]">{data.grossWeight.toLocaleString()}</div>
            </td>
            <td className="text-center border-r border-black align-top" style={{ width: '5%', padding: '6px' }}>
              <div className="text-[11px]">{data.weightUnit}</div>
            </td>
            <td className="text-center border-r border-black align-top" style={{ width: '7%', padding: '6px' }}>
              <div className="text-[11px]">{data.rateClass || 'Q'}</div>
            </td>
            <td className="text-right border-r border-black align-top" style={{ width: '12%', padding: '6px' }}>
              <div className="text-[11px]">{data.chargeableWeight?.toLocaleString() || data.grossWeight.toLocaleString()}</div>
            </td>
            <td className="text-right border-r border-black align-top" style={{ width: '10%', padding: '6px' }}>
              <div className="text-[10px]">{data.rate ? formatCurrency(data.rate) : ''}</div>
            </td>
            <td className="text-right border-r border-black align-top" style={{ width: '12%', padding: '6px' }}>
              <div className="text-[11px]">{formatCurrency(data.totalCharge) || ''}</div>
            </td>
            <td className="align-top" style={{ width: '34%', padding: '6px', position: 'relative' }}>
              {/* ORIGINAL 워터마크 */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-30deg)',
                fontSize: '40px',
                fontWeight: 'bold',
                color: 'rgba(180, 180, 180, 0.15)',
                letterSpacing: '8px',
                fontFamily: 'serif',
                fontStyle: 'italic',
                pointerEvents: 'none',
                whiteSpace: 'nowrap'
              }}>
                ORIGINAL
              </div>
              <div className="text-[10px] whitespace-pre-line" style={{ lineHeight: '1.5' }}>
                {data.natureOfGoods || 'CONSOLIDATION CARGO'}
                {data.dimensions && `\n\nDIM: ${data.dimensions}`}
                {data.volumeWeight && `\nVOL WT: ${data.volumeWeight} KG`}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 하단 섹션 - 고정 높이 */}
      <div style={{ flexShrink: 0 }}>
        {/* Prepaid / Collect 요금 */}
        <table className="w-full border-collapse" style={{ borderWidth: '0 2px 1px 2px', borderStyle: 'solid', borderColor: '#000' }}>
          <tbody>
            <tr style={{ backgroundColor: '#f0f4f8' }}>
              <td className="text-center border-r border-black" style={{ width: '33%', padding: '2px' }}>
                <div className="text-[7px] font-bold" style={{ color: '#1a365d' }}>Prepaid</div>
              </td>
              <td className="text-center border-r border-black" style={{ width: '33%', padding: '2px' }}>
                <div className="text-[7px] font-bold" style={{ color: '#1a365d' }}>Collect</div>
              </td>
              <td className="text-center" style={{ width: '34%', padding: '2px' }}>
                <div className="text-[7px]" style={{ color: '#1a365d' }}>&nbsp;</div>
              </td>
            </tr>
            <tr>
              <td className="border-r border-black" style={{ padding: '3px' }}>
                <div className="flex justify-between text-[8px]">
                  <span>Weight Charge</span>
                  <span>{formatCurrency(data.weightChargePrepaid) || ''}</span>
                </div>
              </td>
              <td className="border-r border-black" style={{ padding: '3px' }}>
                <div className="flex justify-between text-[8px]">
                  <span>Weight Charge</span>
                  <span>{formatCurrency(data.weightChargeCollect) || ''}</span>
                </div>
              </td>
              <td rowSpan={5} style={{ padding: '4px', verticalAlign: 'top' }}>
                <div className="text-[7px]" style={{ color: '#1a365d' }}>Other Charges</div>
                <div className="text-[8px] mt-1">{data.handlingInfo || ''}</div>
              </td>
            </tr>
            <tr>
              <td className="border-r border-black" style={{ padding: '3px' }}>
                <div className="flex justify-between text-[8px]">
                  <span>Valuation Charge</span>
                  <span>{formatCurrency(data.valuationChargePrepaid) || ''}</span>
                </div>
              </td>
              <td className="border-r border-black" style={{ padding: '3px' }}>
                <div className="flex justify-between text-[8px]">
                  <span>Valuation Charge</span>
                  <span>{formatCurrency(data.valuationChargeCollect) || ''}</span>
                </div>
              </td>
            </tr>
            <tr>
              <td className="border-r border-black" style={{ padding: '3px' }}>
                <div className="flex justify-between text-[8px]">
                  <span>Tax</span>
                  <span>{formatCurrency(data.taxPrepaid) || ''}</span>
                </div>
              </td>
              <td className="border-r border-black" style={{ padding: '3px' }}>
                <div className="flex justify-between text-[8px]">
                  <span>Tax</span>
                  <span>{formatCurrency(data.taxCollect) || ''}</span>
                </div>
              </td>
            </tr>
            <tr>
              <td className="border-r border-black" style={{ padding: '3px' }}>
                <div className="flex justify-between text-[8px]">
                  <span>Total Other Charges Due Agent</span>
                  <span>{formatCurrency(data.otherChargesDueAgentPrepaid) || ''}</span>
                </div>
              </td>
              <td className="border-r border-black" style={{ padding: '3px' }}>
                <div className="flex justify-between text-[8px]">
                  <span>Total Other Charges Due Agent</span>
                  <span>{formatCurrency(data.otherChargesDueAgentCollect) || ''}</span>
                </div>
              </td>
            </tr>
            <tr>
              <td className="border-r border-black" style={{ padding: '3px' }}>
                <div className="flex justify-between text-[8px]">
                  <span>Total Other Charges Due Carrier</span>
                  <span>{formatCurrency(data.otherChargesDueCarrierPrepaid) || ''}</span>
                </div>
              </td>
              <td className="border-r border-black" style={{ padding: '3px' }}>
                <div className="flex justify-between text-[8px]">
                  <span>Total Other Charges Due Carrier</span>
                  <span>{formatCurrency(data.otherChargesDueCarrierCollect) || ''}</span>
                </div>
              </td>
            </tr>
            <tr style={{ backgroundColor: '#f0f4f8' }}>
              <td className="border-r border-black" style={{ padding: '4px' }}>
                <div className="flex justify-between text-[9px] font-bold">
                  <span>Total Prepaid</span>
                  <span>{formatCurrency(data.totalPrepaid) || ''}</span>
                </div>
              </td>
              <td className="border-r border-black" style={{ padding: '4px' }}>
                <div className="flex justify-between text-[9px] font-bold">
                  <span>Total Collect</span>
                  <span>{formatCurrency(data.totalCollect) || ''}</span>
                </div>
              </td>
              <td style={{ padding: '4px' }}>
                <div className="text-[8px]">&nbsp;</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Shipper's Certification + Carrier's Execution */}
        <table className="w-full border-collapse" style={{ borderWidth: '0 2px 2px 2px', borderStyle: 'solid', borderColor: '#000' }}>
          <tbody>
            <tr>
              <td className="border-r border-black align-top" style={{ width: '50%', padding: '6px', height: '60px' }}>
                <div className="text-[7px] mb-2" style={{ color: '#1a365d' }}>Shipper certifies that the particulars on the face hereof are correct and that insofar as any part of the consignment contains dangerous goods, such part is properly described by name and is in proper condition for carriage by air according to the applicable Dangerous Goods Regulations.</div>
                <div className="text-[8px] mt-3 font-bold">Signature of Shipper or his Agent</div>
              </td>
              <td className="align-top" style={{ padding: '6px' }}>
                <div className="text-[7px]" style={{ color: '#1a365d' }}>Executed on (date)</div>
                <div className="text-[10px] mt-1">{data.executedOn || data.awbDate}</div>
                <div className="text-[7px] mt-2" style={{ color: '#1a365d' }}>at (place)</div>
                <div className="text-[10px]">{data.executedAt || 'SEOUL, KOREA'}</div>
                <div className="text-[7px] mt-2" style={{ color: '#1a365d' }}>Signature of Issuing Carrier or its Agent</div>
                <div className="text-[9px] font-bold mt-1">{data.issuerName || 'INTERGIS LOGISTICS CO., LTD.'}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==================== MAWB FORM (Master Air Waybill) ====================
function MAWBFormTemplate({ data }: { data: AWBData }) {
  return (
    <div className="text-[9px] leading-tight" style={{
      fontFamily: 'Arial, sans-serif',
      width: '194mm',
      height: '281mm',
      padding: '0',
      margin: '0 auto',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 최상단 헤더 - MAWB 스타일 */}
      <table className="w-full border-collapse" style={{ borderWidth: '2px', borderStyle: 'solid', borderColor: '#000' }}>
        <tbody>
          <tr>
            <td className="align-top" style={{ width: '50%', borderRight: '1px solid #000', padding: '6px', height: '80px' }} rowSpan={2}>
              <div className="text-[8px] mb-1 font-bold" style={{ color: '#1a365d' }}>Shipper&apos;s Name and Address</div>
              <div className="whitespace-pre-line text-[10px]" style={{ lineHeight: '1.4' }}>
                {data.issuerName || 'INTERGIS LOGISTICS CO., LTD.'}
                {data.issuerAddress && `\n${data.issuerAddress}`}
                {data.issuerTel && `\nTEL: ${data.issuerTel}`}
              </div>
            </td>
            <td className="text-center align-middle" style={{ padding: '8px', borderBottom: '1px solid #000', height: '40px' }}>
              <div className="font-bold text-[14px]" style={{ color: '#2c5282', letterSpacing: '3px' }}>MASTER AIR WAYBILL</div>
              <div className="text-[8px] mt-1" style={{ color: '#666' }}>NOT NEGOTIABLE - AIR CONSIGNMENT NOTE</div>
            </td>
          </tr>
          <tr>
            <td style={{ padding: '6px' }}>
              <div className="flex justify-between">
                <div>
                  <div className="text-[8px]" style={{ color: '#1a365d' }}>Issued by</div>
                  <div className="text-[10px] font-bold">{data.carrier}</div>
                </div>
                <div>
                  <div className="text-[8px]" style={{ color: '#1a365d' }}>Air Waybill No.</div>
                  <div className="font-bold text-[14px]" style={{ color: '#c53030' }}>{data.mawbNo}</div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Consignee - MAWB용 */}
      <table className="w-full border-collapse" style={{ borderWidth: '0 2px 1px 2px', borderStyle: 'solid', borderColor: '#000' }}>
        <tbody>
          <tr>
            <td className="align-top" style={{ width: '50%', borderRight: '1px solid #000', padding: '6px', height: '70px' }}>
              <div className="text-[8px] mb-1 font-bold" style={{ color: '#1a365d' }}>Consignee&apos;s Name and Address</div>
              <div className="whitespace-pre-line text-[10px]" style={{ lineHeight: '1.4' }}>
                {data.consignee}
                {data.consigneeAddress && `\n${data.consigneeAddress}`}
              </div>
            </td>
            <td className="align-top" style={{ padding: '6px' }}>
              <div className="text-[8px] mb-1 font-bold" style={{ color: '#1a365d' }}>Accounting Information</div>
              <div className="text-[9px]">FREIGHT PREPAID</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Agent Info for MAWB */}
      <table className="w-full border-collapse" style={{ borderWidth: '0 2px 1px 2px', borderStyle: 'solid', borderColor: '#000' }}>
        <tbody>
          <tr>
            <td className="align-top" style={{ width: '50%', borderRight: '1px solid #000', padding: '6px', height: '50px' }}>
              <div className="text-[8px] mb-1 font-bold" style={{ color: '#1a365d' }}>Issuing Carrier&apos;s Agent Name and City</div>
              <div className="text-[10px]">
                {data.agentName || data.issuerName || 'INTERGIS LOGISTICS CO., LTD.'}
              </div>
            </td>
            <td style={{ padding: '6px' }}>
              <div className="flex justify-between">
                <div>
                  <div className="text-[8px]" style={{ color: '#1a365d' }}>Agent&apos;s IATA Code</div>
                  <div className="text-[10px]">{data.agentIataCode || ''}</div>
                </div>
                <div>
                  <div className="text-[8px]" style={{ color: '#1a365d' }}>Account No.</div>
                  <div className="text-[10px]">{data.agentAccount || ''}</div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Airport of Departure */}
      <table className="w-full border-collapse" style={{ borderWidth: '0 2px 1px 2px', borderStyle: 'solid', borderColor: '#000' }}>
        <tbody>
          <tr>
            <td style={{ width: '50%', borderRight: '1px solid #000', padding: '6px' }}>
              <div className="text-[8px] font-bold" style={{ color: '#1a365d' }}>Airport of Departure (Addr. of First Carrier) and Requested Routing</div>
              <div className="text-[12px] font-bold mt-1">{data.origin}</div>
            </td>
            <td style={{ padding: '4px' }}>
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="text-[7px] text-center border-r border-black" style={{ width: '33%', color: '#1a365d' }}>To</td>
                    <td className="text-[7px] text-center border-r border-black" style={{ width: '34%', color: '#1a365d' }}>By First Carrier</td>
                    <td className="text-[7px] text-center" style={{ width: '33%', color: '#1a365d' }}>To / By</td>
                  </tr>
                  <tr>
                    <td className="text-[10px] text-center border-r border-black">{data.destination}</td>
                    <td className="text-[10px] text-center border-r border-black">{data.carrier}</td>
                    <td className="text-[10px] text-center">{data.routingTo2 || ''}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Currency, Values, Airport of Destination */}
      <table className="w-full border-collapse" style={{ borderWidth: '0 2px 1px 2px', borderStyle: 'solid', borderColor: '#000' }}>
        <tbody>
          <tr>
            <td className="text-center border-r border-black" style={{ width: '10%', padding: '3px' }}>
              <div className="text-[7px]" style={{ color: '#1a365d' }}>Currency</div>
              <div className="text-[9px]">{data.currency || 'USD'}</div>
            </td>
            <td className="text-center border-r border-black" style={{ width: '7%', padding: '3px' }}>
              <div className="text-[6px]" style={{ color: '#1a365d' }}>CHGS</div>
              <div className="text-[9px]">PP</div>
            </td>
            <td className="text-center border-r border-black" style={{ width: '7%', padding: '3px' }}>
              <div className="text-[6px]" style={{ color: '#1a365d' }}>WT/VAL</div>
              <div className="text-[9px]">P</div>
            </td>
            <td className="text-center border-r border-black" style={{ width: '7%', padding: '3px' }}>
              <div className="text-[6px]" style={{ color: '#1a365d' }}>Other</div>
              <div className="text-[9px]">P</div>
            </td>
            <td className="text-center border-r border-black" style={{ width: '15%', padding: '3px' }}>
              <div className="text-[6px]" style={{ color: '#1a365d' }}>Declared Value for Carriage</div>
              <div className="text-[9px]">{data.declaredValueCarriage || 'NVD'}</div>
            </td>
            <td className="text-center border-r border-black" style={{ width: '15%', padding: '3px' }}>
              <div className="text-[6px]" style={{ color: '#1a365d' }}>Declared Value for Customs</div>
              <div className="text-[9px]">{data.declaredValueCustoms || 'NCV'}</div>
            </td>
            <td style={{ padding: '3px' }}>
              <div className="text-[7px]" style={{ color: '#1a365d' }}>Airport of Destination</div>
              <div className="text-[12px] font-bold">{data.destination}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Flight/Date Row */}
      <table className="w-full border-collapse" style={{ borderWidth: '0 2px 1px 2px', borderStyle: 'solid', borderColor: '#000' }}>
        <tbody>
          <tr>
            <td className="border-r border-black" style={{ width: '25%', padding: '4px' }}>
              <div className="text-[7px]" style={{ color: '#1a365d' }}>Flight/Date</div>
              <div className="text-[11px] font-bold">{data.flightNo} / {data.flightDate}</div>
            </td>
            <td className="border-r border-black" style={{ width: '25%', padding: '4px' }}>
              <div className="text-[7px]" style={{ color: '#1a365d' }}>For Carrier Use Only</div>
            </td>
            <td style={{ padding: '4px' }}>
              <div className="text-[7px]" style={{ color: '#1a365d' }}>Amount of Insurance</div>
              <div className="text-[10px]">{data.insuranceAmount || 'NIL'}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Handling Information */}
      <table className="w-full border-collapse" style={{ borderWidth: '0 2px 1px 2px', borderStyle: 'solid', borderColor: '#000' }}>
        <tbody>
          <tr>
            <td style={{ padding: '4px', height: '30px' }}>
              <div className="text-[7px]" style={{ color: '#1a365d' }}>Handling Information</div>
              <div className="text-[9px]">{data.handlingInfo || 'CONSOLIDATION AS PER ATTACHED MANIFEST'}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 화물 상세 헤더 */}
      <table className="w-full border-collapse" style={{ borderWidth: '0 2px 1px 2px', borderStyle: 'solid', borderColor: '#000', backgroundColor: '#e2e8f0' }}>
        <tbody>
          <tr>
            <td className="text-center border-r border-black" style={{ width: '8%', padding: '3px' }}>
              <div className="text-[7px] font-bold" style={{ color: '#1a365d' }}>No. of<br/>Pieces<br/>RCP</div>
            </td>
            <td className="text-center border-r border-black" style={{ width: '12%', padding: '3px' }}>
              <div className="text-[7px] font-bold" style={{ color: '#1a365d' }}>Gross<br/>Weight</div>
            </td>
            <td className="text-center border-r border-black" style={{ width: '5%', padding: '3px' }}>
              <div className="text-[7px] font-bold" style={{ color: '#1a365d' }}>kg<br/>lb</div>
            </td>
            <td className="text-center border-r border-black" style={{ width: '7%', padding: '3px' }}>
              <div className="text-[7px] font-bold" style={{ color: '#1a365d' }}>Rate<br/>Class</div>
            </td>
            <td className="text-center border-r border-black" style={{ width: '12%', padding: '3px' }}>
              <div className="text-[7px] font-bold" style={{ color: '#1a365d' }}>Chargeable<br/>Weight</div>
            </td>
            <td className="text-center border-r border-black" style={{ width: '10%', padding: '3px' }}>
              <div className="text-[7px] font-bold" style={{ color: '#1a365d' }}>Rate/<br/>Charge</div>
            </td>
            <td className="text-center border-r border-black" style={{ width: '12%', padding: '3px' }}>
              <div className="text-[7px] font-bold" style={{ color: '#1a365d' }}>Total</div>
            </td>
            <td className="text-center" style={{ width: '34%', padding: '3px' }}>
              <div className="text-[7px] font-bold" style={{ color: '#1a365d' }}>Nature and Quantity of Goods<br/>(incl. Dimensions or Volume)</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 화물 상세 내용 */}
      <table className="w-full border-collapse relative" style={{ borderWidth: '0 2px 1px 2px', borderStyle: 'solid', borderColor: '#000', flex: '1' }}>
        <tbody>
          <tr style={{ height: '100%' }}>
            <td className="text-center border-r border-black align-top" style={{ width: '8%', padding: '6px' }}>
              <div className="text-[11px]">{data.pieces}</div>
            </td>
            <td className="text-right border-r border-black align-top" style={{ width: '12%', padding: '6px' }}>
              <div className="text-[11px]">{data.grossWeight.toLocaleString()}</div>
            </td>
            <td className="text-center border-r border-black align-top" style={{ width: '5%', padding: '6px' }}>
              <div className="text-[11px]">{data.weightUnit}</div>
            </td>
            <td className="text-center border-r border-black align-top" style={{ width: '7%', padding: '6px' }}>
              <div className="text-[11px]">{data.rateClass || 'Q'}</div>
            </td>
            <td className="text-right border-r border-black align-top" style={{ width: '12%', padding: '6px' }}>
              <div className="text-[11px]">{data.chargeableWeight?.toLocaleString() || ''}</div>
            </td>
            <td className="text-right border-r border-black align-top" style={{ width: '10%', padding: '6px' }}>
              <div className="text-[10px]">{data.rate ? formatCurrency(data.rate) : ''}</div>
            </td>
            <td className="text-right border-r border-black align-top" style={{ width: '12%', padding: '6px' }}>
              <div className="text-[11px]">{formatCurrency(data.totalCharge) || ''}</div>
            </td>
            <td className="align-top" style={{ width: '34%', padding: '6px', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-30deg)',
                fontSize: '36px',
                fontWeight: 'bold',
                color: 'rgba(180, 180, 180, 0.15)',
                letterSpacing: '6px',
                fontFamily: 'serif',
                fontStyle: 'italic',
                pointerEvents: 'none'
              }}>
                ORIGINAL
              </div>
              <div className="text-[10px] whitespace-pre-line font-bold" style={{ lineHeight: '1.5' }}>
                CONSOLIDATION
              </div>
              <div className="text-[9px] mt-2">
                {data.natureOfGoods || 'AS PER ATTACHED MANIFEST'}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 하단 요금 섹션 */}
      <div style={{ flexShrink: 0 }}>
        <table className="w-full border-collapse" style={{ borderWidth: '0 2px 1px 2px', borderStyle: 'solid', borderColor: '#000' }}>
          <tbody>
            <tr style={{ backgroundColor: '#e2e8f0' }}>
              <td className="text-center border-r border-black" style={{ width: '33%', padding: '2px' }}>
                <div className="text-[7px] font-bold" style={{ color: '#1a365d' }}>Prepaid</div>
              </td>
              <td className="text-center border-r border-black" style={{ width: '33%', padding: '2px' }}>
                <div className="text-[7px] font-bold" style={{ color: '#1a365d' }}>Collect</div>
              </td>
              <td className="text-center" style={{ width: '34%', padding: '2px' }}>
                <div className="text-[7px]" style={{ color: '#1a365d' }}>&nbsp;</div>
              </td>
            </tr>
            <tr>
              <td className="border-r border-black" style={{ padding: '3px' }}>
                <div className="flex justify-between text-[8px]">
                  <span>Weight Charge</span>
                  <span>{formatCurrency(data.weightChargePrepaid) || (formatCurrency(data.totalCharge) || '')}</span>
                </div>
              </td>
              <td className="border-r border-black" style={{ padding: '3px' }}>
                <div className="flex justify-between text-[8px]">
                  <span>Weight Charge</span>
                  <span></span>
                </div>
              </td>
              <td rowSpan={5} style={{ padding: '4px', verticalAlign: 'top' }}>
                <div className="text-[7px]" style={{ color: '#1a365d' }}>Other Charges</div>
              </td>
            </tr>
            <tr>
              <td className="border-r border-black" style={{ padding: '3px' }}>
                <div className="flex justify-between text-[8px]"><span>Valuation Charge</span><span></span></div>
              </td>
              <td className="border-r border-black" style={{ padding: '3px' }}>
                <div className="flex justify-between text-[8px]"><span>Valuation Charge</span><span></span></div>
              </td>
            </tr>
            <tr>
              <td className="border-r border-black" style={{ padding: '3px' }}>
                <div className="flex justify-between text-[8px]"><span>Tax</span><span></span></div>
              </td>
              <td className="border-r border-black" style={{ padding: '3px' }}>
                <div className="flex justify-between text-[8px]"><span>Tax</span><span></span></div>
              </td>
            </tr>
            <tr>
              <td className="border-r border-black" style={{ padding: '3px' }}>
                <div className="flex justify-between text-[8px]"><span>Total Other Charges Due Agent</span><span></span></div>
              </td>
              <td className="border-r border-black" style={{ padding: '3px' }}>
                <div className="flex justify-between text-[8px]"><span>Total Other Charges Due Agent</span><span></span></div>
              </td>
            </tr>
            <tr>
              <td className="border-r border-black" style={{ padding: '3px' }}>
                <div className="flex justify-between text-[8px]"><span>Total Other Charges Due Carrier</span><span></span></div>
              </td>
              <td className="border-r border-black" style={{ padding: '3px' }}>
                <div className="flex justify-between text-[8px]"><span>Total Other Charges Due Carrier</span><span></span></div>
              </td>
            </tr>
            <tr style={{ backgroundColor: '#e2e8f0' }}>
              <td className="border-r border-black" style={{ padding: '4px' }}>
                <div className="flex justify-between text-[9px] font-bold">
                  <span>Total Prepaid</span>
                  <span>{formatCurrency(data.totalPrepaid) || formatCurrency(data.totalCharge) || ''}</span>
                </div>
              </td>
              <td className="border-r border-black" style={{ padding: '4px' }}>
                <div className="flex justify-between text-[9px] font-bold">
                  <span>Total Collect</span>
                  <span>{formatCurrency(data.totalCollect) || ''}</span>
                </div>
              </td>
              <td style={{ padding: '4px' }}>&nbsp;</td>
            </tr>
          </tbody>
        </table>

        {/* Shipper Certification + Carrier Execution */}
        <table className="w-full border-collapse" style={{ borderWidth: '0 2px 2px 2px', borderStyle: 'solid', borderColor: '#000' }}>
          <tbody>
            <tr>
              <td className="border-r border-black align-top" style={{ width: '50%', padding: '6px', height: '55px' }}>
                <div className="text-[6px] mb-2" style={{ color: '#1a365d' }}>Shipper certifies that the particulars on the face hereof are correct and that insofar as any part of the consignment contains dangerous goods, such part is properly described by name and is in proper condition for carriage by air according to the applicable Dangerous Goods Regulations.</div>
                <div className="text-[8px] mt-3 font-bold">Signature of Shipper or his Agent</div>
              </td>
              <td className="align-top" style={{ padding: '6px' }}>
                <div className="text-[7px]" style={{ color: '#1a365d' }}>Executed on (date)</div>
                <div className="text-[10px] mt-1">{data.executedOn || data.awbDate}</div>
                <div className="text-[7px] mt-2" style={{ color: '#1a365d' }}>at (place)</div>
                <div className="text-[10px]">{data.executedAt || 'SEOUL, KOREA'}</div>
                <div className="text-[7px] mt-1" style={{ color: '#1a365d' }}>Signature of Issuing Carrier or its Agent</div>
                <div className="text-[9px] font-bold">{data.carrier}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==================== CHECK AWB 양식 ====================
function CheckAWBTemplate({ data }: { data: AWBData }) {
  return (
    <div className="text-[11px]" style={{ fontFamily: 'Arial, sans-serif', width: '194mm', minHeight: '277mm', padding: '3mm', margin: '0 auto', boxSizing: 'border-box' }}>
      {/* 타이틀 */}
      <div className="text-center mb-3">
        <h1 className="text-2xl font-bold">CHECK AWB</h1>
        <div className="text-right text-[11px]">
          발행일자 : {data.awbDate}
        </div>
      </div>

      {/* 메인 테이블 */}
      <table className="w-full border-collapse border border-black">
        <tbody>
          {/* Shipper & AWB No */}
          <tr>
            <td className="border border-black p-1.5 w-1/2 align-top" rowSpan={2}>
              <div className="font-bold text-[9px] mb-1">Shipper</div>
              <div className="whitespace-pre-line min-h-[35px] text-[9px]">
                {data.shipper}
                {data.shipperTel && `\nTEL : ${data.shipperTel}`}
              </div>
            </td>
            <td className="border border-black p-1.5 align-top">
              <div className="font-bold text-[9px]">HAWB No.</div>
              <div className="font-bold text-red-700 text-[10px]">{data.hawbNo}</div>
            </td>
          </tr>
          <tr>
            <td className="border border-black p-1.5 align-top">
              <div className="font-bold text-[9px]">MAWB No.</div>
              <div className="font-bold text-[10px]">{data.mawbNo}</div>
            </td>
          </tr>

          {/* Consignee & Carrier */}
          <tr>
            <td className="border border-black p-1.5 align-top">
              <div className="font-bold text-[9px] mb-1">Consignee</div>
              <div className="whitespace-pre-line min-h-[35px] text-[9px]">
                {data.consignee}
                {data.consigneeAddress && `\n${data.consigneeAddress}`}
              </div>
            </td>
            <td className="border border-black p-1.5 align-top">
              <div className="font-bold text-[9px] mb-1">Carrier / Flight</div>
              <div className="text-[9px]">
                {data.carrier}
                {data.flightNo && ` / ${data.flightNo}`}
                {data.flightDate && ` (${data.flightDate})`}
              </div>
            </td>
          </tr>

          {/* Agent Info & FROM */}
          <tr>
            <td className="border border-black p-1.5 align-top">
              <div className="font-bold text-[9px] mb-1">Agent</div>
              <div className="whitespace-pre-line text-[9px]">
                {data.agentName || 'INTERGIS LOGISTICS CO., LTD.'}
                {data.agentIataCode && `\nIATA Code: ${data.agentIataCode}`}
              </div>
            </td>
            <td className="border border-black p-1.5 align-top">
              <div className="font-bold text-[9px] mb-1">FROM</div>
              <div className="whitespace-pre-line text-[9px]">
                {data.issuerName || 'INTERGIS LOGISTICS'}
                {data.issuerTel && `\nTEL : ${data.issuerTel}`}
              </div>
            </td>
          </tr>

          {/* Airport of Departure & Destination */}
          <tr>
            <td className="border border-black p-1.5">
              <div className="font-bold text-[9px]">Airport of Departure (Origin)</div>
              <div className="text-[10px] font-bold">{data.origin}</div>
            </td>
            <td className="border border-black p-1.5">
              <div className="font-bold text-[9px]">Airport of Destination</div>
              <div className="text-[10px] font-bold">{data.destination}</div>
            </td>
          </tr>

          {/* Routing */}
          <tr>
            <td className="border border-black p-1.5" colSpan={2}>
              <div className="font-bold text-[9px]">Routing</div>
              <div className="text-[9px]">
                {data.origin} → {data.routingTo1 || data.destination}
                {data.routingBy1 && ` (by ${data.routingBy1})`}
                {data.routingTo2 && ` → ${data.routingTo2}`}
                {data.routingBy2 && ` (by ${data.routingBy2})`}
              </div>
            </td>
          </tr>

          {/* 화물 상세 헤더 */}
          <tr className="bg-gray-50">
            <td className="border border-black p-1.5" colSpan={2}>
              <div className="grid grid-cols-8 gap-1 font-bold text-[8px]">
                <div className="col-span-1">Pieces</div>
                <div className="col-span-1">Gross Wt</div>
                <div className="col-span-1">Ch. Wt</div>
                <div className="col-span-1">Rate</div>
                <div className="col-span-1">Total</div>
                <div className="col-span-3">Nature of Goods</div>
              </div>
            </td>
          </tr>

          {/* 화물 상세 내용 */}
          <tr>
            <td className="border border-black p-1.5" colSpan={2} style={{ minHeight: '350px' }}>
              <div className="grid grid-cols-8 gap-1" style={{ minHeight: '320px' }}>
                <div className="col-span-1 text-[10px] border-r border-gray-300 pr-1">
                  {data.pieces}
                </div>
                <div className="col-span-1 text-[10px] border-r border-gray-300 pr-1 text-right">
                  {data.grossWeight.toLocaleString()} {data.weightUnit}
                </div>
                <div className="col-span-1 text-[10px] border-r border-gray-300 pr-1 text-right">
                  {data.chargeableWeight?.toLocaleString() || '-'}
                </div>
                <div className="col-span-1 text-[10px] border-r border-gray-300 pr-1 text-right">
                  {data.rate ? formatCurrency(data.rate) : '-'}
                </div>
                <div className="col-span-1 text-[10px] border-r border-gray-300 pr-1 text-right">
                  {formatCurrency(data.totalCharge) || '-'}
                </div>
                <div className="col-span-3 text-[10px] pl-1">
                  <div className="font-bold">SAID TO CONTAIN</div>
                  <div className="mt-3 whitespace-pre-line" style={{ minHeight: '280px' }}>
                    {data.natureOfGoods || 'CONSOLIDATION CARGO'}
                    {data.dimensions && `\n\nDimensions: ${data.dimensions}`}
                  </div>
                </div>
              </div>
            </td>
          </tr>

          {/* Currency & Values */}
          <tr>
            <td className="border border-black p-1.5">
              <div className="font-bold text-[9px]">Currency / Declared Value</div>
              <div className="text-[9px]">
                {data.currency || 'USD'} / Carriage: {data.declaredValueCarriage || 'NVD'} / Customs: {data.declaredValueCustoms || 'NCV'}
              </div>
            </td>
            <td className="border border-black p-1.5">
              <div className="font-bold text-[9px]">Insurance Amount</div>
              <div className="text-[9px]">{data.insuranceAmount || 'NIL'}</div>
            </td>
          </tr>

          {/* Prepaid / Collect */}
          <tr>
            <td className="border border-black p-1.5">
              <div className="font-bold text-[9px]">Total Prepaid</div>
              <div className="text-[10px] font-bold">{formatCurrency(data.totalPrepaid) || formatCurrency(data.totalCharge) || ''}</div>
            </td>
            <td className="border border-black p-1.5">
              <div className="font-bold text-[9px]">Total Collect</div>
              <div className="text-[10px]">{formatCurrency(data.totalCollect) || ''}</div>
            </td>
          </tr>

          {/* Handling Information */}
          <tr>
            <td className="border border-black p-1.5" colSpan={2}>
              <div className="font-bold text-[9px]">Handling Information</div>
              <div className="text-[9px]">{data.handlingInfo || ''}</div>
            </td>
          </tr>

          {/* Executed */}
          <tr>
            <td className="border border-black p-1.5">
              <div className="font-bold text-[9px]">Executed On / At</div>
              <div className="text-[9px]">{data.executedOn || data.awbDate} / {data.executedAt || 'SEOUL, KOREA'}</div>
            </td>
            <td className="border border-black p-1.5">
              <div className="font-bold text-[9px]">Issuing Carrier</div>
              <div className="text-[9px]">{data.issuerName || 'INTERGIS LOGISTICS CO., LTD.'}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
