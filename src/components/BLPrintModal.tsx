'use client';

import { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { formatCurrency } from '@/utils/format';

// B/L 데이터 인터페이스
export interface BLData {
  // 기본 정보
  hblNo: string;
  mblNo: string;
  bookingNo?: string;
  blDate: string;

  // 당사자 정보
  shipper: string;
  shipperAddress?: string;
  shipperTel?: string;
  shipperFax?: string;
  consignee: string;
  consigneeAddress?: string;
  consigneeTel?: string;
  consigneeFax?: string;
  notifyParty?: string;
  notifyAddress?: string;
  notifyTel?: string;
  notifyFax?: string;

  // 운송 정보
  carrier: string;
  vessel: string;
  voyage: string;
  flag?: string;
  placeOfReceipt?: string;
  pol: string;          // Port of Loading
  pod: string;          // Port of Discharge
  placeOfDelivery?: string;
  finalDestination?: string;
  etd: string;
  eta?: string;

  // 화물 정보
  marksAndNumbers?: string;
  containerNo?: string;
  sealNo?: string;
  containerType: string;
  containerQty: number;
  packageType?: string;
  packageQty?: number;
  description?: string;
  weight: number;        // Gross Weight (kg)
  measurement?: number;  // CBM

  // 운임 정보
  freightTerms?: 'PREPAID' | 'COLLECT';
  freightPrepaidAt?: string;
  freightPayableAt?: string;
  freightAmount?: number;

  // 발행 정보
  placeOfIssue?: string;
  dateOfIssue?: string;
  numberOfOriginals?: number;

  // 발행사 정보
  issuerName?: string;
  issuerAddress?: string;
  issuerTel?: string;
  issuerFax?: string;
  issuerManager?: string;
}

interface BLPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  blData: BLData | null;
}

type PrintType = 'BL_FORM' | 'CHECK_BL';

export default function BLPrintModal({ isOpen, onClose, blData }: BLPrintModalProps) {
  const [printType, setPrintType] = useState<PrintType>('BL_FORM');
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: printType === 'BL_FORM' ? `BL_FORM_${blData?.hblNo}` : `CHECK_BL_${blData?.hblNo}`,
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
        .border-black {
          border-color: black !important;
        }
        .border-2 {
          border-width: 2px !important;
        }
        .border-b {
          border-bottom-width: 1px !important;
        }
        .border-b-2 {
          border-bottom-width: 2px !important;
        }
        .border-r {
          border-right-width: 1px !important;
        }
        .border-r-2 {
          border-right-width: 2px !important;
        }
        .border-l-2 {
          border-left-width: 2px !important;
        }
        .border-x-2 {
          border-left-width: 2px !important;
          border-right-width: 2px !important;
        }
        .border-t-0 {
          border-top-width: 0 !important;
        }
      }
    `,
  });

  if (!isOpen || !blData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-gray-50 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-100">
          <h2 className="text-lg font-bold">B/L 출력</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 출력 유형 선택 */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-6">
            <span className="font-medium">출력 양식:</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="printType"
                value="BL_FORM"
                checked={printType === 'BL_FORM'}
                onChange={() => setPrintType('BL_FORM')}
                className="w-4 h-4 text-blue-600"
              />
              <span className={printType === 'BL_FORM' ? 'font-semibold text-blue-600' : ''}>
                B/L FORM (FIATA)
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="printType"
                value="CHECK_BL"
                checked={printType === 'CHECK_BL'}
                onChange={() => setPrintType('CHECK_BL')}
                className="w-4 h-4 text-blue-600"
              />
              <span className={printType === 'CHECK_BL' ? 'font-semibold text-blue-600' : ''}>
                CHECK B/L
              </span>
            </label>
          </div>
        </div>

        {/* 미리보기 영역 */}
        <div className="overflow-auto max-h-[60vh] p-6 bg-gray-100">
          <div className="bg-white shadow-lg mx-auto" style={{ width: '210mm', minHeight: '297mm' }}>
            <div ref={printRef}>
              {printType === 'BL_FORM' ? (
                <BLFormTemplate data={blData} />
              ) : (
                <CheckBLTemplate data={blData} />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-white transition-colors"
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

// ==================== B/L FORM (FIATA 양식) - A4 Full Size ====================
function BLFormTemplate({ data }: { data: BLData }) {
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
      {/* 최상단 헤더 - Consignor/Shipper + 타이틀 + B/L No */}
      <table className="w-full border-collapse" style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: '#000' }}>
        <tbody>
          <tr>
            {/* 좌측 - Consignor/Shipper - 높이 확대 */}
            <td className="align-top" style={{ width: '55%', borderRight: '1px solid #000', padding: '6px', height: '85px' }} rowSpan={2}>
              <div className="text-[8px] mb-1" style={{ color: '#1e3a5f', fontWeight: 'bold' }}>Consignor/Shipper</div>
              <div className="whitespace-pre-line text-[10px]" style={{ lineHeight: '1.4' }}>
                {data.shipper}
                {data.shipperAddress && `\n${data.shipperAddress}`}
                {data.shipperTel && `\nTEL: ${data.shipperTel}`}
              </div>
            </td>
            {/* 우측 상단 - 타이틀 */}
            <td className="text-center align-middle" style={{ padding: '8px', borderBottom: '1px solid #000', height: '50px' }}>
              <div className="font-bold text-[15px]" style={{ color: '#1e3a5f', letterSpacing: '2px' }}>BILL OF LADING</div>
              <div className="text-[9px] mt-1" style={{ color: '#1e3a5f' }}>FOR COMBINED TRANSPORT SHIPMENT OR PORT TO PORT SHIPMENT</div>
            </td>
          </tr>
          <tr>
            {/* 우측 하단 - B/L No */}
            <td style={{ padding: '6px' }}>
              <div className="text-[8px]" style={{ color: '#1e3a5f' }}>Bill of Lading No.</div>
              <div className="font-bold text-[12px] mt-1">{data.hblNo}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Consignee - 높이 확대 */}
      <table className="w-full border-collapse" style={{ borderWidth: '0 1px 1px 1px', borderStyle: 'solid', borderColor: '#000' }}>
        <tbody>
          <tr>
            <td className="align-top" style={{ padding: '6px', height: '75px' }}>
              <div className="text-[8px] mb-1" style={{ color: '#1e3a5f', fontWeight: 'bold' }}>Consignee (Complete Name and Address / Non-Negotiable Unless Consigned to Order)</div>
              <div className="whitespace-pre-line text-[10px]" style={{ lineHeight: '1.4' }}>
                {data.consignee}
                {data.consigneeAddress && `\n${data.consigneeAddress}`}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Notify Party + For Delivery - 높이 확대 */}
      <table className="w-full border-collapse" style={{ borderWidth: '0 1px 1px 1px', borderStyle: 'solid', borderColor: '#000' }}>
        <tbody>
          <tr>
            <td className="align-top" style={{ width: '55%', borderRight: '1px solid #000', padding: '6px', height: '75px' }}>
              <div className="text-[8px] mb-1" style={{ color: '#1e3a5f', fontWeight: 'bold' }}>Notify Party (Carrier not responsible for failure to notify)</div>
              <div className="whitespace-pre-line text-[10px]" style={{ lineHeight: '1.4' }}>
                {data.notifyParty || data.consignee}
                {data.notifyAddress && `\n${data.notifyAddress}`}
                {data.notifyTel && `\nTEL: ${data.notifyTel}`}
              </div>
            </td>
            <td className="align-top" style={{ padding: '6px' }}>
              <div className="text-[8px] mb-1" style={{ color: '#1e3a5f', fontWeight: 'bold' }}>For Delivery of Goods Please Apply to:</div>
              <div className="text-[10px]" style={{ lineHeight: '1.4' }}>
                {data.issuerName || 'INTERGIS LOGISTICS CO., LTD.'}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Pre-Carriage + Place of Receipt */}
      <table className="w-full border-collapse" style={{ borderWidth: '0 1px 1px 1px', borderStyle: 'solid', borderColor: '#000' }}>
        <tbody>
          <tr>
            <td style={{ width: '27.5%', borderRight: '1px solid #000', padding: '4px' }}>
              <div className="text-[7px]" style={{ color: '#1e3a5f' }}>Pre-Carriage by</div>
              <div className="text-[10px]">{data.placeOfReceipt ? 'TRUCK' : ''}</div>
            </td>
            <td style={{ padding: '4px' }}>
              <div className="text-[7px]" style={{ color: '#1e3a5f' }}>Place of Receipt</div>
              <div className="text-[10px]">{data.placeOfReceipt || ''}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Vessel / Voyage + Port of Loading */}
      <table className="w-full border-collapse" style={{ borderWidth: '0 1px 1px 1px', borderStyle: 'solid', borderColor: '#000' }}>
        <tbody>
          <tr>
            <td style={{ width: '55%', borderRight: '1px solid #000', padding: '4px' }}>
              <div className="text-[7px]" style={{ color: '#1e3a5f' }}>Ocean Vessel / Voyage No.</div>
              <div className="text-[10px] font-semibold">{data.vessel} / {data.voyage}</div>
            </td>
            <td style={{ padding: '4px' }}>
              <div className="text-[7px]" style={{ color: '#1e3a5f' }}>Port of Loading</div>
              <div className="text-[10px]">{data.pol}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Port of Discharge + Place of Delivery + Final Destination */}
      <table className="w-full border-collapse" style={{ borderWidth: '0 1px 1px 1px', borderStyle: 'solid', borderColor: '#000' }}>
        <tbody>
          <tr>
            <td style={{ width: '27.5%', borderRight: '1px solid #000', padding: '4px' }}>
              <div className="text-[7px]" style={{ color: '#1e3a5f' }}>Port of Discharge</div>
              <div className="text-[10px]">{data.pod}</div>
            </td>
            <td style={{ width: '27.5%', borderRight: '1px solid #000', padding: '4px' }}>
              <div className="text-[7px]" style={{ color: '#1e3a5f' }}>Place of Delivery</div>
              <div className="text-[10px]">{data.placeOfDelivery || ''}</div>
            </td>
            <td style={{ padding: '4px' }}>
              <div className="text-[7px]" style={{ color: '#1e3a5f' }}>Final Destination (For the Merchant&apos;s Reference Only)</div>
              <div className="text-[10px]">{data.finalDestination || ''}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Particulars Furnished by Consignor/Shipper 타이틀 */}
      <div style={{ borderWidth: '0 1px', borderStyle: 'solid', borderColor: '#000', backgroundColor: '#e8f4f8', padding: '3px 4px' }}>
        <div className="font-bold text-[8px] text-center" style={{ color: '#1e3a5f' }}>Particulars Furnished by Consignor/Shipper - Carrier not responsible</div>
      </div>

      {/* 화물 상세 테이블 헤더 */}
      <table className="w-full border-collapse" style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: '#000' }}>
        <tbody>
          <tr style={{ backgroundColor: '#f8f9fa' }}>
            <td style={{ width: '18%', borderRight: '1px solid #000', padding: '3px', textAlign: 'center' }}>
              <div className="text-[7px] font-semibold" style={{ color: '#1e3a5f' }}>Marks & Numbers</div>
              <div className="text-[7px]" style={{ color: '#1e3a5f' }}>Container No. / Seal No.</div>
            </td>
            <td style={{ width: '12%', borderRight: '1px solid #000', padding: '3px', textAlign: 'center' }}>
              <div className="text-[7px] font-semibold" style={{ color: '#1e3a5f' }}>No. of Packages</div>
              <div className="text-[7px]" style={{ color: '#1e3a5f' }}>Kind of Packages</div>
            </td>
            <td style={{ width: '45%', borderRight: '1px solid #000', padding: '3px', textAlign: 'center' }}>
              <div className="text-[8px] font-semibold" style={{ color: '#1e3a5f' }}>Description of Goods</div>
            </td>
            <td style={{ width: '12%', borderRight: '1px solid #000', padding: '3px', textAlign: 'center' }}>
              <div className="text-[7px] font-semibold" style={{ color: '#1e3a5f' }}>Gross Weight</div>
              <div className="text-[7px]" style={{ color: '#1e3a5f' }}>(KGS)</div>
            </td>
            <td style={{ width: '13%', padding: '3px', textAlign: 'center' }}>
              <div className="text-[7px] font-semibold" style={{ color: '#1e3a5f' }}>Measurement</div>
              <div className="text-[7px]" style={{ color: '#1e3a5f' }}>(CBM)</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 화물 상세 내용 - ORIGINAL 워터마크 포함 - A4 풀사이즈 활용 (flex-grow로 남은 공간 모두 사용) */}
      <table className="w-full border-collapse relative" style={{ borderWidth: '0 1px 1px 1px', borderStyle: 'solid', borderColor: '#000', flex: '1' }}>
        <tbody>
          <tr style={{ height: '100%' }}>
            <td style={{ width: '18%', borderRight: '1px solid #000', padding: '6px', verticalAlign: 'top' }}>
              <div className="text-[9px]" style={{ lineHeight: '1.5' }}>
                {data.containerNo && <div className="font-semibold">{data.containerNo}</div>}
                {data.sealNo && <div>SEAL: {data.sealNo}</div>}
                <div className="mt-2">{data.marksAndNumbers || 'N/M'}</div>
              </div>
            </td>
            <td style={{ width: '12%', borderRight: '1px solid #000', padding: '6px', verticalAlign: 'top' }}>
              <div className="text-[9px]" style={{ lineHeight: '1.5' }}>
                <div>{data.containerQty} x {data.containerType}</div>
                {data.packageQty && data.packageType && (
                  <div className="mt-2">{data.packageQty} {data.packageType}</div>
                )}
              </div>
            </td>
            <td style={{ width: '45%', borderRight: '1px solid #000', padding: '6px', verticalAlign: 'top', position: 'relative' }}>
              {/* ORIGINAL 워터마크 */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-30deg)',
                fontSize: '56px',
                fontWeight: 'bold',
                color: 'rgba(180, 180, 180, 0.15)',
                letterSpacing: '12px',
                fontFamily: 'serif',
                fontStyle: 'italic',
                pointerEvents: 'none',
                whiteSpace: 'nowrap'
              }}>
                ORIGINAL
              </div>
              <div className="text-[10px] whitespace-pre-line" style={{ lineHeight: '1.5' }}>
                {data.description || 'SAID TO CONTAIN:\n\nGENERAL CARGO\n\nFREIGHT PREPAID\n\n"SHIPPER\'S LOAD AND COUNT"\n"SAID TO CONTAIN"'}
              </div>
            </td>
            <td style={{ width: '12%', borderRight: '1px solid #000', padding: '6px', verticalAlign: 'top', textAlign: 'right' }}>
              <div className="text-[10px]">{data.weight.toLocaleString()}</div>
            </td>
            <td style={{ width: '13%', padding: '6px', verticalAlign: 'top', textAlign: 'right' }}>
              <div className="text-[10px]">{data.measurement ? Number(data.measurement).toFixed(3) : ''}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 하단 섹션 - 고정 높이 */}
      <div style={{ flexShrink: 0 }}>
        {/* Total Number of Containers + Freight Info */}
        <table className="w-full border-collapse" style={{ borderWidth: '0 1px 1px 1px', borderStyle: 'solid', borderColor: '#000' }}>
          <tbody>
            <tr>
              <td style={{ width: '50%', borderRight: '1px solid #000', padding: '4px' }}>
                <div className="text-[7px]" style={{ color: '#1e3a5f' }}>Total Number of Containers or Packages (In Words)</div>
                <div className="text-[9px] font-semibold">{data.containerQty} CONTAINER(S) ONLY</div>
              </td>
              <td style={{ width: '25%', borderRight: '1px solid #000', padding: '4px' }}>
                <div className="text-[7px]" style={{ color: '#1e3a5f' }}>Freight Payable at</div>
                <div className="text-[9px]">{data.freightPayableAt || ''}</div>
              </td>
              <td style={{ padding: '4px' }}>
                <div className="text-[7px]" style={{ color: '#1e3a5f' }}>Number of Original B/L</div>
                <div className="text-[9px]">{data.numberOfOriginals || 'THREE (3)'}</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Freight & Charges + Terms */}
        <table className="w-full border-collapse" style={{ borderWidth: '0 1px 1px 1px', borderStyle: 'solid', borderColor: '#000' }}>
          <tbody>
            <tr>
              <td style={{ width: '15%', borderRight: '1px solid #000', padding: '3px', verticalAlign: 'top' }}>
                <div className="text-[7px] font-bold" style={{ color: '#1e3a5f' }}>Freight & Charges</div>
              </td>
              <td style={{ width: '17.5%', borderRight: '1px solid #000', padding: '3px', textAlign: 'center', verticalAlign: 'top' }}>
                <div className="text-[7px]" style={{ color: '#1e3a5f' }}>Prepaid</div>
                <div className="text-[9px]">{data.freightTerms === 'PREPAID' ? (data.freightAmount ? `${formatCurrency(data.freightAmount)}` : 'AS ARRANGED') : ''}</div>
              </td>
              <td style={{ width: '17.5%', borderRight: '1px solid #000', padding: '3px', textAlign: 'center', verticalAlign: 'top' }}>
                <div className="text-[7px]" style={{ color: '#1e3a5f' }}>Collect</div>
                <div className="text-[9px]">{data.freightTerms === 'COLLECT' ? (data.freightAmount ? `${formatCurrency(data.freightAmount)}` : 'AS ARRANGED') : ''}</div>
              </td>
              <td style={{ padding: '3px', verticalAlign: 'top' }} rowSpan={2}>
                <div className="text-[5.5px] leading-tight" style={{ color: '#333' }}>
                  RECEIVED by the Carrier from the Shipper in apparent good order and condition (unless otherwise noted herein) the total number or quantity of Containers or other packages or units indicated in the box entitled &quot;Total No. of Containers/Packages received by Carrier&quot; for carriage subject to all the terms and conditions hereof (INCLUDING THE TERMS AND CONDITIONS ON THE REVERSE HEREOF AND THE TERMS AND CONDITIONS OF THE CARRIER&apos;S APPLICABLE TARIFF) from the Place of Receipt or the Port of Loading, whichever is applicable, to the Port of Discharge or the Place of Delivery, whichever is applicable. One original Bill of Lading must be surrendered duly endorsed in exchange for the Goods or Delivery Order.
                  IN WITNESS WHEREOF the number of original Bills of Lading stated on this side have been signed, one of which being accomplished, the others to stand void.
                </div>
              </td>
            </tr>
            <tr>
              <td style={{ borderRight: '1px solid #000', padding: '3px' }} colSpan={3}>
                <div className="text-[7px]" style={{ color: '#1e3a5f' }}>Exchange Rate</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Place of Issue + Signature */}
        <table className="w-full border-collapse" style={{ borderWidth: '0 1px 1px 1px', borderStyle: 'solid', borderColor: '#000' }}>
          <tbody>
            <tr>
              <td style={{ width: '35%', borderRight: '1px solid #000', padding: '4px' }}>
                <div className="text-[7px]" style={{ color: '#1e3a5f' }}>Place and Date of Issue</div>
                <div className="text-[9px]">{data.placeOfIssue || 'SEOUL, KOREA'}, {data.dateOfIssue || data.blDate}</div>
              </td>
              <td style={{ width: '30%', borderRight: '1px solid #000', padding: '4px' }}>
                <div className="text-[7px]" style={{ color: '#1e3a5f' }}>Laden on Board Date</div>
                <div className="text-[9px]">{data.etd}</div>
              </td>
              <td style={{ padding: '4px', textAlign: 'center' }} rowSpan={2}>
                <div className="text-[8px] mb-1" style={{ color: '#1e3a5f' }}>Signed for the Carrier</div>
                <div style={{ height: '25px', borderBottom: '1px solid #000', width: '80%', margin: '0 auto' }}></div>
                <div className="text-[7px] mt-1" style={{ color: '#1e3a5f' }}>As Agent(s) for the Carrier</div>
                <div className="text-[9px] font-bold mt-1">{data.issuerName || 'INTERGIS LOGISTICS CO., LTD.'}</div>
              </td>
            </tr>
            <tr>
              <td style={{ borderRight: '1px solid #000', padding: '4px' }}>
                <div className="text-[7px]" style={{ color: '#1e3a5f' }}>B/L No.</div>
                <div className="text-[9px] font-semibold">{data.hblNo}</div>
              </td>
              <td style={{ borderRight: '1px solid #000', padding: '4px' }}>
                <div className="text-[7px]" style={{ color: '#1e3a5f' }}>As Carrier</div>
                <div className="text-[9px] font-semibold">{data.carrier || data.issuerName || 'INTERGIS LOGISTICS CO., LTD.'}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==================== CHECK B/L 양식 - A4 Full Size ====================
function CheckBLTemplate({ data }: { data: BLData }) {
  return (
    <div className="text-[11px]" style={{ fontFamily: 'Arial, sans-serif', width: '194mm', minHeight: '277mm', padding: '3mm', margin: '0 auto', boxSizing: 'border-box' }}>
      {/* 타이틀 */}
      <div className="text-center mb-3">
        <h1 className="text-2xl font-bold">CHECK B/L</h1>
        <div className="text-right text-[11px]">
          발행일자 : {data.dateOfIssue || data.blDate}
        </div>
      </div>

      {/* 메인 테이블 */}
      <table className="w-full border-collapse border border-black">
        <tbody>
          {/* Shipper & B/L No */}
          <tr>
            <td className="border border-black p-1.5 w-1/2 align-top" rowSpan={2}>
              <div className="font-bold text-[9px] mb-1">Shipper</div>
              <div className="whitespace-pre-line min-h-[35px] text-[9px]">
                {data.shipper}
                {data.shipperTel && `\nTEL : ${data.shipperTel}`}
                {data.shipperFax && `\nFAX : ${data.shipperFax}`}
              </div>
            </td>
            <td className="border border-black p-1.5 align-top">
              <div className="font-bold text-[9px]">B/L No.</div>
              <div className="font-bold text-blue-800 text-[10px]">{data.hblNo}</div>
            </td>
          </tr>
          <tr>
            <td className="border border-black p-1.5 align-top">
              <div className="font-bold text-[9px]">Booking No.</div>
              <div className="font-bold text-[10px]">{data.bookingNo || data.mblNo}</div>
            </td>
          </tr>

          {/* Consignee & TO */}
          <tr>
            <td className="border border-black p-1.5 align-top">
              <div className="font-bold text-[9px] mb-1">Consignee</div>
              <div className="whitespace-pre-line min-h-[35px] text-[9px]">
                {data.consignee}
              </div>
            </td>
            <td className="border border-black p-1.5 align-top">
              <div className="font-bold text-[9px] mb-1">TO</div>
              <div className="whitespace-pre-line text-[9px]">
                {data.consigneeTel && `담당자 : ${data.consigneeAddress || ''}`}
                {data.consigneeTel && `\nTEL : ${data.consigneeTel}`}
                {data.consigneeFax && `\nFAX : ${data.consigneeFax}`}
              </div>
            </td>
          </tr>

          {/* Notify Party & FROM */}
          <tr>
            <td className="border border-black p-1.5 align-top">
              <div className="font-bold text-[9px] mb-1">Notify Party</div>
              <div className="whitespace-pre-line min-h-[35px] text-[9px]">
                {data.notifyParty || data.consignee}
              </div>
            </td>
            <td className="border border-black p-1.5 align-top">
              <div className="font-bold text-[9px] mb-1">FROM</div>
              <div className="whitespace-pre-line text-[9px]">
                {data.issuerName || 'INTERGIS LOGISTICS'}
                {data.issuerManager && `\n담당자 : ${data.issuerManager}`}
                {data.issuerTel && `\nTEL : ${data.issuerTel}`}
                {data.issuerFax && `\nFAX : ${data.issuerFax}`}
              </div>
            </td>
          </tr>

          {/* 선명/항차 & Place of Receipt */}
          <tr>
            <td className="border border-black p-1.5">
              <div className="font-bold text-[9px]">선명/항차/Flag</div>
              <div className="text-[9px]">{data.vessel} / {data.voyage} / {data.flag || ''}</div>
            </td>
            <td className="border border-black p-1.5">
              <div className="font-bold text-[9px]">Place Of Receipt(수탁지)항차</div>
              <div className="text-[9px]">{data.placeOfReceipt || ''}</div>
            </td>
          </tr>

          {/* Port of Loading & Discharge */}
          <tr>
            <td className="border border-black p-1.5">
              <div className="font-bold text-[9px]">Port Of Loading(선적항) / ETD</div>
              <div className="text-[9px]">{data.pol} / {data.etd}</div>
            </td>
            <td className="border border-black p-1.5">
              <div className="font-bold text-[9px]">Port Of Discharge(양하항) / ETA</div>
              <div className="text-[9px]">{data.pod} / {data.eta || ''}</div>
            </td>
          </tr>

          {/* Place of Delivery & Final Destination */}
          <tr>
            <td className="border border-black p-1.5">
              <div className="font-bold text-[9px]">Place Of Delivery(인도지)</div>
              <div className="text-[9px]">{data.placeOfDelivery || ''}</div>
            </td>
            <td className="border border-black p-1.5">
              <div className="font-bold text-[9px]">Final Destination(최종목적지)</div>
              <div className="text-[9px]">{data.finalDestination || ''}</div>
            </td>
          </tr>

          {/* 화물 상세 헤더 - Description of goods A4 전체 활용 */}
          <tr className="bg-gray-50">
            <td className="border border-black p-1.5" colSpan={2}>
              <div className="grid grid-cols-10 gap-1 font-bold text-[8px]">
                <div className="col-span-1">Container &<br/>Seal / Marks</div>
                <div className="col-span-1">Packages</div>
                <div className="col-span-7 text-[9px]">Description of goods</div>
                <div className="col-span-1 text-right">Weight<br/>CBM</div>
              </div>
            </td>
          </tr>

          {/* 화물 상세 내용 - Description of goods 영역 A4 전체 활용 */}
          <tr>
            <td className="border border-black p-1.5" colSpan={2} style={{ minHeight: '480px' }}>
              <div className="grid grid-cols-10 gap-1" style={{ minHeight: '450px' }}>
                <div className="col-span-1 text-[9px] border-r border-gray-300 pr-1">
                  {data.containerNo && (
                    <div>{data.containerType}/{data.containerNo}/{data.sealNo || ''}</div>
                  )}
                  {!data.containerNo && (
                    <div>{data.containerQty} x {data.containerType}</div>
                  )}
                  <div className="mt-2">{data.marksAndNumbers || ''}</div>
                </div>
                <div className="col-span-1 text-[9px] border-r border-gray-300 pr-1">
                  {data.packageQty && data.packageType ? `${data.packageQty} ${data.packageType}` : ''}
                </div>
                <div className="col-span-7 text-[10px] border-r border-gray-300 pr-2 pl-1">
                  <div className="font-bold text-[11px]">SAID TO CONTAIN</div>
                  <div className="mt-3 whitespace-pre-line" style={{ minHeight: '380px' }}>
                    {data.description || 'GENERAL CARGO'}
                  </div>
                  <div className="mt-4 font-bold text-[11px]">FREIGHT {data.freightTerms || 'PREPAID'}</div>
                </div>
                <div className="col-span-1 text-right text-[9px]">
                  <div>{data.weight.toLocaleString()} Kg</div>
                  <div>{data.measurement ? `${data.measurement.toFixed(3)} CBM` : '0 CBM'}</div>
                </div>
              </div>

              {/* 컨테이너 목록 */}
              <div className="mt-2 pt-2 border-t border-gray-300 text-[9px]">
                <div className="font-bold">Total No. of containers</div>
                {data.containerNo ? (
                  <div>{data.containerType}/{data.containerNo}/{data.sealNo || ''},//{data.weight}Kg/{data.measurement || 0}CBM</div>
                ) : (
                  <div>{data.containerQty} x {data.containerType}</div>
                )}
              </div>
            </td>
          </tr>

          {/* Freight 정보 */}
          <tr>
            <td className="border border-black p-1.5">
              <div className="font-bold text-[9px]">Fright Prepaid at</div>
              <div className="text-[9px]">{data.freightPrepaidAt || ''}</div>
            </td>
            <td className="border border-black p-1.5">
              <div className="font-bold text-[9px]">Fright Payable at</div>
              <div className="text-[9px]">{data.freightPayableAt || ''}</div>
            </td>
          </tr>

          {/* Total Prepaid & No. of Original B/L */}
          <tr>
            <td className="border border-black p-1.5">
              <div className="font-bold text-[9px]">Total Prepaid in</div>
              <div className="text-[9px]">{data.freightAmount ? `${formatCurrency(data.freightAmount)} KRW` : ''}</div>
            </td>
            <td className="border border-black p-1.5">
              <div className="font-bold text-[9px]">No. of Original B/L</div>
              <div className="text-[9px]">THREE / {data.numberOfOriginals || 3}</div>
            </td>
          </tr>

          {/* Place of Issue & Date of Issue */}
          <tr>
            <td className="border border-black p-1.5">
              <div className="font-bold text-[9px]">Place of Issue</div>
              <div className="text-[9px]">{data.placeOfIssue || 'SEOUL'}</div>
            </td>
            <td className="border border-black p-1.5">
              <div className="font-bold text-[9px]">Date of Issue</div>
              <div className="text-[9px]">{data.dateOfIssue || data.blDate}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
