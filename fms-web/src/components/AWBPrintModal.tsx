'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';
import { formatCurrency } from '@/utils/format';

// AWB 데이터 인터페이스
export interface AWBData {
  hawbNo: string;
  mawbNo: string;
  awbDate: string;
  shipper: string;
  shipperAddress?: string;
  shipperTel?: string;
  shipperAccount?: string;
  consignee: string;
  consigneeAddress?: string;
  consigneeTel?: string;
  consigneeAccount?: string;
  agentName?: string;
  agentCity?: string;
  agentIataCode?: string;
  agentAccount?: string;
  carrier: string;
  carrierCode?: string;
  origin: string;
  destination: string;
  routingTo1?: string;
  routingBy1?: string;
  routingTo2?: string;
  routingBy2?: string;
  routingTo3?: string;
  routingBy3?: string;
  flightNo?: string;
  flightDate?: string;
  pieces: number;
  weightUnit: 'K' | 'L';
  grossWeight: number;
  chargeableWeight?: number;
  rateClass?: string;
  commodityItemNo?: string;
  rate?: number;
  totalCharge?: number;
  natureOfGoods: string;
  dimensions?: string;
  volumeWeight?: number;
  currency?: string;
  declaredValueCarriage?: string;
  declaredValueCustoms?: string;
  insuranceAmount?: string;
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
  handlingInfo?: string;
  sci?: string;
  notifyParty?: string;
  referenceNo?: string;
  remarks?: string;
  executedOn?: string;
  executedAt?: string;
  signatureShipper?: string;
  signatureCarrier?: string;
  issuerName?: string;
  issuerAddress?: string;
  issuerTel?: string;
}

interface AWBPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  awbData: AWBData | null;
  mawbId?: number;
  hawbId?: number;
}

type PrintType = 'MAWB_FORM' | 'HAWB_FORM' | 'CHECK_AWB';

export default function AWBPrintModal({ isOpen, onClose, awbData, mawbId, hawbId }: AWBPrintModalProps) {
  const [printType, setPrintType] = useState<PrintType>('HAWB_FORM');
  const [fetchedData, setFetchedData] = useState<AWBData | null>(null);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchPrintData = useCallback(async () => {
    if (!mawbId && !hawbId) return;
    setLoading(true);
    try {
      const type = mawbId ? 'mawb' : 'hawb';
      const id = mawbId || hawbId;
      const res = await fetch(`/api/awb/print?type=${type}&id=${id}`);
      const result = await res.json();
      if (result.success && result.data) setFetchedData(result.data);
    } catch (error) {
      console.error('Error fetching print data:', error);
    } finally {
      setLoading(false);
    }
  }, [mawbId, hawbId]);

  useEffect(() => {
    if (isOpen && (mawbId || hawbId)) fetchPrintData();
  }, [isOpen, mawbId, hawbId, fetchPrintData]);

  const data = awbData || fetchedData;

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: printType === 'MAWB_FORM' ? `MAWB_${data?.mawbNo}` : printType === 'HAWB_FORM' ? `HAWB_${data?.hawbNo}` : `CHECK_AWB_${data?.hawbNo}`,
    pageStyle: `@page{size:A4;margin:5mm}@media print{*{box-sizing:border-box!important}body{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;margin:0!important;padding:0!important}table{border-collapse:collapse!important}}`,
  });

  if (!isOpen) return null;
  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--surface-100)] rounded-xl shadow-2xl p-12 border border-[var(--border)]">
        <div className="text-center text-[var(--muted)]">출력 데이터 로딩 중...</div>
      </div>
    </div>
  );
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--surface-100)] rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-[var(--border)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-200)]">
          <h2 className="text-lg font-bold">AWB 출력</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--surface-50)] rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-50)]">
          <div className="flex items-center gap-6">
            <span className="font-medium">출력 양식:</span>
            {(['HAWB_FORM', 'MAWB_FORM', 'CHECK_AWB'] as PrintType[]).map(pt => (
              <label key={pt} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="printType" value={pt} checked={printType === pt} onChange={() => setPrintType(pt)} className="w-4 h-4 text-blue-600" />
                <span className={printType === pt ? 'font-semibold text-blue-600' : ''}>{pt.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="overflow-auto max-h-[60vh] p-6 bg-gray-100">
          <div className="bg-white shadow-lg mx-auto" style={{ width: '210mm', minHeight: '297mm' }}>
            <div ref={printRef}>
              {printType === 'MAWB_FORM' ? <MAWBFormTemplate data={data} /> : printType === 'HAWB_FORM' ? <HAWBFormTemplate data={data} /> : <CheckAWBTemplate data={data} />}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--surface-200)] flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-50)] transition-colors">닫기</button>
          <button onClick={() => handlePrint()} className="px-6 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>출력
          </button>
        </div>
      </div>
    </div>
  );
}

// ====== Helper Functions ======
function pf(v: number | string | null | undefined): string {
  if (v == null || v === '' || v === 0) return '';
  return formatCurrency(v);
}

function getCC(d: AWBData): string {
  const pp = !!(d.weightChargePrepaid || d.valuationChargePrepaid || d.taxPrepaid || d.totalPrepaid);
  const cc = !!(d.weightChargeCollect || d.valuationChargeCollect || d.taxCollect || d.totalCollect);
  if (pp && cc) return 'PC';
  if (cc) return 'CC';
  return 'PP';
}

function parseMawbNo(n: string): { prefix: string; serial: string } {
  if (!n) return { prefix: '', serial: '' };
  const c = n.replace(/[-\s]/g, '');
  if (c.length >= 11) return { prefix: c.substring(0, 3), serial: `${c.substring(3, 7)} ${c.substring(7)}` };
  if (c.length >= 3) return { prefix: c.substring(0, 3), serial: c.substring(3) };
  return { prefix: '', serial: n };
}

// ====== Common Styles ======
const B = '1px solid #000';
const B2 = '2px solid #000';
const LS: React.CSSProperties = { fontSize: '6px', color: '#444', lineHeight: 1.1, display: 'block', whiteSpace: 'nowrap' };
const VS: React.CSSProperties = { fontSize: '8.5px', lineHeight: 1.3 };
const CS: React.CSSProperties = { padding: '1px 3px', verticalAlign: 'top', borderRight: B, borderBottom: B };
const BG = '#f0f0f0'; // label/row background
// Label Band style: 라벨 텍스트 영역만 회색 밴드 (셀 패딩을 상쇄하여 좌우 끝까지 채움)
const LB: React.CSSProperties = { ...LS, background: BG, margin: '-1px -3px 0 -3px', padding: '1px 3px 1px 3px' };
// Double Vertical Line: 세로 두줄 사이 회색 채움 (cargo/charges 칼럼 구분)
const DV: React.CSSProperties = { width: '3px', minWidth: '3px', background: BG, borderLeft: '0.5px solid #000', borderRight: '0.5px solid #000', flexShrink: 0 };
const FORM: React.CSSProperties = {
  fontFamily: 'Arial, Helvetica, sans-serif', width: '200mm', height: '287mm',
  padding: 0, margin: '0 auto', boxSizing: 'border-box', display: 'flex',
  flexDirection: 'column', fontSize: '8px', lineHeight: 1.2, border: B2,
};

// ==================== IATA AWB Form Template ====================
function IATAFormTemplate({ data, formTitle, formSubtitle, showMawbBar }: {
  data: AWBData; formTitle: string; formSubtitle: string; showMawbBar: boolean;
}) {
  const { prefix, serial } = parseMawbNo(data.mawbNo);
  const cc = getCC(data);
  const isPP = cc !== 'CC';

  // 참조이미지 기준 고정 비율 (% of 200mm)
  // 좌측 Shipper/Consignee: 45%, Account: 15%, 우측 Air Waybill: 40%
  // Agent/IATA: 55% | 45%
  // Departure: 50% | 15% | 35%
  // Routing(7cols): 36% | Currency(5cols): 64%
  // Cargo: 7|10|4|10|10|9|10|flex(~40%)  ← Nature 칼럼 축소
  // Charges: 48% | 52%
  // 배경색: 라벨밴드(LB) 또는 행전체(BG) - 참조이미지 기준 13군데

  return (
    <div style={FORM}>
      {/* === 1. MAWB Number Bar === */}
      {showMawbBar && (
        <div style={{ display: 'flex', borderBottom: B }}>
          <div style={{ ...CS, width: '8%', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', borderBottom: 'none' }}>{prefix}</div>
          <div style={{ ...CS, flex: 1, fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', borderBottom: 'none' }}>{data.origin} {serial}</div>
          <div style={{ ...CS, width: '25%', textAlign: 'right', fontSize: '9px', borderRight: 'none', borderBottom: 'none' }}>{data.referenceNo || ''}</div>
        </div>
      )}
      {!showMawbBar && (
        <div style={{ display: 'flex', borderBottom: B }}>
          <div style={{ ...CS, flex: 1, fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', borderBottom: 'none' }}>{data.hawbNo}</div>
          <div style={{ ...CS, width: '35%', textAlign: 'right', fontSize: '9px', borderRight: 'none', borderBottom: 'none' }}>
            <b>MAWB:</b> {data.mawbNo}
          </div>
        </div>
      )}

      {/* === 2. Shipper + Account + Not Negotiable === */}
      <div style={{ display: 'flex', borderBottom: B }}>
        <div style={{ ...CS, width: '45%', minHeight: '58px', borderBottom: 'none' }}>
          <span style={LB}>Shipper&apos;s Name and Address</span>
          <div style={{ ...VS, whiteSpace: 'pre-line', marginTop: 1 }}>
            {data.shipper}{data.shipperAddress ? `\n${data.shipperAddress}` : ''}{data.shipperTel ? `\nTEL: ${data.shipperTel}` : ''}
          </div>
        </div>
        <div style={{ ...CS, width: '15%', borderBottom: 'none' }}>
          <span style={LB}>Shipper&apos;s Account Number</span>
          <div style={VS}>{data.shipperAccount || ''}</div>
        </div>
        <div style={{ ...CS, width: '40%', borderRight: 'none', borderBottom: 'none', display: 'flex', flexDirection: 'column' }}>
          <div style={{ textAlign: 'right', fontSize: '6px' }}>Not Negotiable</div>
          <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 'bold', letterSpacing: '2px', margin: '4px 0' }}>{formTitle}</div>
          <div style={{ textAlign: 'right', fontSize: '7px' }}>
            <b>Issued by</b> {data.carrier || data.issuerName || ''}
          </div>
          <div style={{ borderTop: B, marginTop: 'auto', padding: '3px 4px', fontSize: '5.5px', lineHeight: 1.2 }}>
            Copies 1,2 and 3 of this Air Waybill are originals and have the same validity.
          </div>
        </div>
      </div>

      {/* === 3. Consignee + Account + Legal === */}
      <div style={{ display: 'flex', borderBottom: B }}>
        <div style={{ ...CS, width: '45%', minHeight: '60px', borderBottom: 'none' }}>
          <span style={LB}>Consignee&apos;s Name and Address</span>
          <div style={{ ...VS, whiteSpace: 'pre-line', marginTop: 1 }}>
            {data.consignee}{data.consigneeAddress ? `\n${data.consigneeAddress}` : ''}{data.consigneeTel ? `\nTEL: ${data.consigneeTel}` : ''}
          </div>
        </div>
        <div style={{ ...CS, width: '15%', borderBottom: 'none' }}>
          <span style={LB}>Consignee&apos;s Account Number</span>
          <div style={VS}>{data.consigneeAccount || ''}</div>
        </div>
        <div style={{ ...CS, width: '40%', borderRight: 'none', borderBottom: 'none', padding: '2px 4px', fontSize: '4.5px', lineHeight: 1.15, color: '#333' }}>
          It is agreed that the goods described herein are accepted in apparent good order and condition
          (except as noted) for carriage SUBJECT TO THE CONDITIONS OF CONTRACT ON THE
          REVERSE HEREOF. ALL GOODS MAY BE CARRIED BY ANY OTHER MEANS INCLUDING
          ROAD OR ANY OTHER CARRIER UNLESS SPECIFIC CONTRARY INSTRUCTIONS ARE
          GIVEN HEREON BY THE SHIPPER, AND SHIPPER AGREES THAT THE SHIPMENT MAY BE
          CARRIED VIA INTERMEDIATE STOPPING PLACES WHICH THE CARRIER DEEMS
          APPROPRIATE. THE SHIPPER&apos;S ATTENTION IS DRAWN TO THE NOTICE CONCERNING
          CARRIER&apos;S LIMITATION OF LIABILITY. Shipper may increase such limitation of liability by
          declaring a higher value for carriage and paying a supplemental charge if required.
        </div>
      </div>

      {/* === 4. Agent Name + Accounting Info === */}
      <div style={{ display: 'flex', borderBottom: B }}>
        <div style={{ ...CS, width: '55%', minHeight: '32px', borderBottom: 'none' }}>
          <span style={LB}>Issuing Carrier&apos;s Agent Name and City</span>
          <div style={{ ...VS, marginTop: 1 }}>{data.agentName || data.issuerName || ''}</div>
        </div>
        <div style={{ ...CS, width: '45%', borderRight: 'none', borderBottom: 'none' }}>
          <span style={LB}>Accounting Information</span>
          <div style={VS}>{isPP ? 'FREIGHT PREPAID' : 'FREIGHT COLLECT'}</div>
        </div>
      </div>

      {/* === 5. IATA Code + Account No === */}
      <div style={{ display: 'flex', borderBottom: B }}>
        <div style={{ ...CS, width: '55%', borderBottom: 'none', background: BG }}>
          <span style={LS}>Agent&apos;s IATA Code</span>
          <span style={{ ...VS, marginLeft: 6 }}>{data.agentIataCode || ''}</span>
        </div>
        <div style={{ ...CS, width: '45%', borderRight: 'none', borderBottom: 'none', background: BG }}>
          <span style={LS}>Account No.</span>
          <span style={{ ...VS, marginLeft: 6 }}>{data.agentAccount || ''}</span>
        </div>
      </div>

      {/* === 6. Airport of Departure + Reference + Optional === */}
      <div style={{ display: 'flex', borderBottom: B }}>
        <div style={{ ...CS, width: '50%', borderBottom: 'none' }}>
          <span style={LB}>Airport of Departure(Addr. of First Carrier)and Requested Routing</span>
          <div style={{ fontSize: '10px', fontWeight: 'bold', marginTop: 1 }}>{data.origin}</div>
        </div>
        <div style={{ ...CS, width: '15%', borderBottom: 'none' }}>
          <span style={LB}>Reference Number</span>
          <div style={VS}>{data.referenceNo || ''}</div>
        </div>
        <div style={{ ...CS, width: '35%', borderRight: 'none', borderBottom: 'none' }}>
          <span style={LB}>Optional Shipping Information</span>
          <div style={VS}>{data.remarks || ''}</div>
        </div>
      </div>

      {/* === 7. Routing + Currency/Values (SAME ROW) === */}
      <div style={{ display: 'flex', borderBottom: B }}>
        {/* Routing columns: 36% total */}
        <div style={{ ...CS, width: '4%', textAlign: 'center', borderBottom: 'none', background: BG }}>
          <span style={LS}>to</span>
          <div style={VS}>{data.routingTo1 || data.destination}</div>
        </div>
        <div style={{ ...CS, width: '8%', textAlign: 'center', borderBottom: 'none', background: BG }}>
          <span style={LS}>By First Carrier</span>
          <div style={VS}>{data.routingBy1 || data.carrier}</div>
        </div>
        <div style={{ ...CS, width: '10%', textAlign: 'center', borderBottom: 'none', background: BG }}>
          <span style={LS}>Routing and Destination</span>
          <div style={VS}>{data.routingTo2 || ''}</div>
        </div>
        <div style={{ ...CS, width: '4%', textAlign: 'center', borderBottom: 'none', background: BG }}>
          <span style={LS}>to</span><div style={VS}>{data.routingTo3 || ''}</div>
        </div>
        <div style={{ ...CS, width: '4%', textAlign: 'center', borderBottom: 'none', background: BG }}>
          <span style={LS}>by</span><div style={VS}>{data.routingBy2 || ''}</div>
        </div>
        <div style={{ ...CS, width: '3%', textAlign: 'center', borderBottom: 'none', background: BG }}>
          <span style={LS}>to</span><div style={VS}></div>
        </div>
        <div style={{ ...CS, width: '3%', textAlign: 'center', borderBottom: 'none', borderRight: B2, background: BG }}>
          <span style={LS}>by</span><div style={VS}></div>
        </div>
        {/* Currency columns: 64% total */}
        <div style={{ ...CS, width: '7%', textAlign: 'center', borderBottom: 'none', background: BG }}>
          <span style={LS}>Currency</span>
          <div style={VS}>{data.currency || 'USD'}</div>
        </div>
        <div style={{ ...CS, width: '6%', textAlign: 'center', borderBottom: 'none', background: BG }}>
          <span style={{ ...LS, fontSize: '5px' }}>CHGS<br/>WT/VAL</span>
          <div style={VS}>{isPP ? 'PPD' : 'COL'}</div>
        </div>
        <div style={{ ...CS, width: '5%', textAlign: 'center', borderBottom: 'none', background: BG }}>
          <span style={{ ...LS, fontSize: '5px' }}>Other<br/>&nbsp;</span>
          <div style={VS}>{isPP ? 'PPD' : 'COL'}</div>
        </div>
        <div style={{ ...CS, width: '23%', textAlign: 'center', borderBottom: 'none', background: BG }}>
          <span style={LS}>Declared Value for Carriage</span>
          <div style={VS}>{data.declaredValueCarriage || 'N.V.D'}</div>
        </div>
        <div style={{ ...CS, width: '23%', textAlign: 'center', borderRight: 'none', borderBottom: 'none', background: BG }}>
          <span style={LS}>Declared Value for Customs</span>
          <div style={VS}>{data.declaredValueCustoms || 'N.V.D'}</div>
        </div>
      </div>

      {/* === 8. Airport of Dest + Flight + Insurance === */}
      <div style={{ display: 'flex', borderBottom: B }}>
        <div style={{ ...CS, width: '24%', borderBottom: 'none' }}>
          <span style={LB}>Airport of Destination</span>
          <div style={{ fontSize: '10px', fontWeight: 'bold' }}>{data.destination}</div>
        </div>
        <div style={{ ...CS, width: '16%', borderBottom: 'none' }}>
          <span style={LB}>Requested Flight/Date</span>
          <div style={VS}>{data.flightNo}{data.flightDate ? `  ${data.flightDate}` : ''}</div>
        </div>
        <div style={{ ...CS, width: '18%', borderBottom: 'none' }}>
          <span style={LB}>Amount of Insurance</span>
          <div style={VS}>{data.insuranceAmount || 'NIL'}</div>
        </div>
        <div style={{ ...CS, width: '42%', borderRight: 'none', borderBottom: 'none', fontSize: '4.5px', lineHeight: 1.15, color: '#333' }}>
          INSURANCE-if Carrier offers insurance, and such insurance is
          requested in accordance with the conditions thereof indicate amount
          to be insured in figures in box marked &quot;Amount of Insurance&quot;.
        </div>
      </div>

      {/* === 9. Handling Information === */}
      <div style={{ ...CS, borderRight: 'none', minHeight: '22px' }}>
        <span style={LB}>Handling Information</span>
        <div style={{ ...VS, marginTop: 1 }}>{data.handlingInfo || ''}</div>
      </div>

      {/* === 10. SCI box + Cargo Header === */}
      <div style={{ position: 'relative', borderBottom: B, background: BG }}>
        <div style={{ position: 'absolute', top: 0, right: 0, border: B, width: '34px', height: '16px', textAlign: 'center', fontSize: '7px', fontWeight: 'bold', lineHeight: '16px', background: BG, zIndex: 1 }}>SCI</div>
        <div style={{ display: 'flex' }}>
          <div style={{ ...CS, width: '7%', textAlign: 'center', borderRight: 'none' }}><span style={{ ...LS, fontWeight: 'bold' }}>No. of<br/>Pieces<br/>RCP</span></div>
          <div style={{ ...DV, borderBottom: B }} />
          <div style={{ ...CS, width: '10%', textAlign: 'center', borderRight: 'none' }}><span style={{ ...LS, fontWeight: 'bold' }}>Gross<br/>Weight</span></div>
          <div style={{ ...DV, borderBottom: B }} />
          <div style={{ ...CS, width: '4%', textAlign: 'center', borderRight: 'none' }}><span style={{ ...LS, fontWeight: 'bold' }}>kg<br/>lb</span></div>
          <div style={{ ...DV, borderBottom: B }} />
          <div style={{ ...CS, width: '10%', textAlign: 'center', borderRight: 'none' }}><span style={{ ...LS, fontWeight: 'bold' }}>Rate Class<br/>Commodity<br/>Item No.</span></div>
          <div style={{ ...DV, borderBottom: B }} />
          <div style={{ ...CS, width: '10%', textAlign: 'center', borderRight: 'none' }}><span style={{ ...LS, fontWeight: 'bold' }}>Chargeable<br/>Weight</span></div>
          <div style={{ ...DV, borderBottom: B }} />
          <div style={{ ...CS, width: '9%', textAlign: 'center', borderRight: 'none' }}><span style={{ ...LS, fontWeight: 'bold' }}>Rate<br/><br/>Charge</span></div>
          <div style={{ ...DV, borderBottom: B }} />
          <div style={{ ...CS, width: '10%', textAlign: 'center', borderRight: 'none' }}><span style={{ ...LS, fontWeight: 'bold' }}>Total</span></div>
          <div style={{ ...DV, borderBottom: B }} />
          <div style={{ ...CS, flex: 1, textAlign: 'center', borderRight: 'none' }}><span style={{ ...LS, fontWeight: 'bold' }}>Nature and Quantity of Goods<br/>(incl. Dimensions or Volume)</span></div>
        </div>
      </div>

      {/* === 11. Cargo Data (flex-grow) === */}
      <div style={{ display: 'flex', borderBottom: B, flex: 1, minHeight: 0 }}>
        <div style={{ ...CS, width: '7%', textAlign: 'center', borderRight: 'none' }}><div style={VS}>{data.pieces}</div></div>
        <div style={DV} />
        <div style={{ ...CS, width: '10%', textAlign: 'right', borderRight: 'none' }}><div style={VS}>{data.grossWeight?.toLocaleString(undefined, { minimumFractionDigits: 1 })}</div></div>
        <div style={DV} />
        <div style={{ ...CS, width: '4%', textAlign: 'center', borderRight: 'none' }}><div style={VS}>{data.weightUnit}</div></div>
        <div style={DV} />
        <div style={{ ...CS, width: '10%', textAlign: 'center', borderRight: 'none' }}><div style={VS}>{data.rateClass || 'Q'}</div></div>
        <div style={DV} />
        <div style={{ ...CS, width: '10%', textAlign: 'right', borderRight: 'none' }}><div style={VS}>{data.chargeableWeight?.toLocaleString(undefined, { minimumFractionDigits: 1 }) || ''}</div></div>
        <div style={DV} />
        <div style={{ ...CS, width: '9%', textAlign: 'right', borderRight: 'none' }}><div style={VS}>{data.rate ? data.rate.toFixed(2) : ''}</div></div>
        <div style={DV} />
        <div style={{ ...CS, width: '10%', textAlign: 'right', borderRight: 'none' }}><div style={VS}>{data.totalCharge ? data.totalCharge.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}</div></div>
        <div style={DV} />
        <div style={{ ...CS, flex: 1, borderRight: 'none' }}>
          <div style={{ ...VS, whiteSpace: 'pre-line', lineHeight: 1.4 }}>
            {data.natureOfGoods || 'CONSOLIDATION CARGO'}
            {data.dimensions ? `\n\nDIM: ${data.dimensions}` : ''}
            {data.volumeWeight ? `\nVOL WT: ${data.volumeWeight} KG` : ''}
            {`\n\n${cc === 'CC' ? '"FREIGHT COLLECT"' : '"FREIGHT PREPAID"'}`}
          </div>
        </div>
      </div>

      {/* === 12. Charges Section: Left 48% (Prepaid/Collect) | Right 52% (Other+Cert) === */}
      <div style={{ flexShrink: 0, minHeight: '52mm' }}>
        <div style={{ display: 'flex', borderBottom: B }}>
          {/* LEFT: Prepaid/Collect Charges */}
          <div style={{ width: '48%', borderRight: B }}>
            <div style={{ display: 'flex', borderBottom: B, minHeight: '16px', background: BG }}>
              <div style={{ ...CS, width: '27%', textAlign: 'center', fontWeight: 'bold', fontSize: '7px', borderRight: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Prepaid</div>
              <div style={{ ...DV, borderBottom: B }} />
              <div style={{ ...CS, width: '40%', borderRight: 'none', display: 'flex', alignItems: 'center' }}><span style={LS}>Weight Charge</span></div>
              <div style={{ ...DV, borderBottom: B }} />
              <div style={{ ...CS, width: '33%', textAlign: 'center', fontWeight: 'bold', fontSize: '7px', borderRight: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Collect</div>
            </div>
            <div style={{ display: 'flex', borderBottom: B, minHeight: '16px' }}>
              <div style={{ ...CS, width: '27%', textAlign: 'right', borderRight: 'none', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}><div style={VS}>{pf(data.weightChargePrepaid)}</div></div>
              <div style={DV} />
              <div style={{ ...CS, width: '40%', borderRight: 'none', display: 'flex', alignItems: 'center', background: BG }}><span style={LS}>Valuation Charge</span></div>
              <div style={DV} />
              <div style={{ ...CS, width: '33%', textAlign: 'right', borderRight: 'none', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}><div style={VS}>{pf(data.weightChargeCollect)}</div></div>
            </div>
            <div style={{ display: 'flex', borderBottom: B, minHeight: '16px' }}>
              <div style={{ ...CS, width: '27%', textAlign: 'right', borderRight: 'none', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}><div style={VS}>{pf(data.valuationChargePrepaid)}</div></div>
              <div style={DV} />
              <div style={{ ...CS, width: '40%', borderRight: 'none', display: 'flex', alignItems: 'center', background: BG }}><span style={LS}>Tax</span></div>
              <div style={DV} />
              <div style={{ ...CS, width: '33%', textAlign: 'right', borderRight: 'none', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}><div style={VS}>{pf(data.valuationChargeCollect)}</div></div>
            </div>
            <div style={{ display: 'flex', borderBottom: B, minHeight: '16px' }}>
              <div style={{ ...CS, width: '27%', textAlign: 'right', borderRight: 'none', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}><div style={VS}>{pf(data.taxPrepaid)}</div></div>
              <div style={DV} />
              <div style={{ ...CS, width: '40%', borderRight: 'none' }}></div>
              <div style={DV} />
              <div style={{ ...CS, width: '33%', textAlign: 'right', borderRight: 'none', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}><div style={VS}>{pf(data.taxCollect)}</div></div>
            </div>
            <div style={{ display: 'flex', borderBottom: B, minHeight: '16px', background: BG }}>
              <div style={{ ...CS, flex: 1, borderRight: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={LS}>Total Other Charges Due Agent</span>
                <div style={VS}>{pf(data.otherChargesDueAgentPrepaid || data.otherChargesDueAgentCollect)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', borderBottom: B, minHeight: '16px', background: BG }}>
              <div style={{ ...CS, flex: 1, borderRight: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={LS}>Total Other Charges Due Carrier</span>
                <div style={VS}>{pf(data.otherChargesDueCarrierPrepaid || data.otherChargesDueCarrierCollect)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', borderBottom: B, minHeight: '18px' }}>
              <div style={{ ...CS, width: '50%', padding: '3px 4px' }}>
                <span style={LB}>Total Prepaid</span>
                <div style={{ ...VS, fontWeight: 'bold' }}>{pf(data.totalPrepaid)}</div>
              </div>
              <div style={{ ...CS, width: '50%', borderRight: 'none', padding: '3px 4px' }}>
                <span style={LB}>Total Collect</span>
                <div style={{ ...VS, fontWeight: 'bold' }}>{pf(data.totalCollect)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', borderBottom: 'none', minHeight: '16px', background: BG }}>
              <div style={{ ...CS, width: '50%', borderBottom: 'none', display: 'flex', alignItems: 'center' }}>
                <span style={LS}>Currency Conversion Rates</span>
              </div>
              <div style={{ ...CS, width: '50%', borderRight: 'none', borderBottom: 'none', display: 'flex', alignItems: 'center' }}>
                <span style={LS}>CC Charges in Dest. Currency</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Other Charges + Shipper Certification */}
          <div style={{ width: '52%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '4px 6px', borderBottom: B, flex: 1 }}>
              <span style={{ ...LS, fontWeight: 'bold' }}>Other Charges</span>
              <div style={{ ...VS, whiteSpace: 'pre-line', lineHeight: 1.6, minHeight: '60px', marginTop: 3 }}>
                {(data.otherChargesDueAgentPrepaid || data.otherChargesDueAgentCollect) ? `Agent: ${pf(data.otherChargesDueAgentPrepaid || data.otherChargesDueAgentCollect)}` : ''}
                {(data.otherChargesDueCarrierPrepaid || data.otherChargesDueCarrierCollect) ? `\nCarrier: ${pf(data.otherChargesDueCarrierPrepaid || data.otherChargesDueCarrierCollect)}` : ''}
              </div>
            </div>
            <div style={{ padding: '4px 6px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '50px' }}>
              <div style={{ fontSize: '5px', lineHeight: 1.3, color: '#333' }}>
                Shipper certifies that the particulars on the face hereof are correct and that insofar as any part of the
                consignment contains dangerous goods, such part is properly described by name and is in
                proper condition for carriage by air according to the applicable Dangerous Goods Regulations.
              </div>
              <div style={{ textAlign: 'center', borderTop: '1px dashed #999', paddingTop: 3, marginTop: 6 }}>
                <span style={{ fontSize: '6.5px' }}>Signature of Shipper or his Agent</span>
              </div>
            </div>
          </div>
        </div>

        {/* === 13. Executed + Signature === */}
        <div style={{ display: 'flex', borderBottom: B, minHeight: '22px' }}>
          <div style={{ ...CS, width: '22%', padding: '3px 4px' }}>
            <span style={LB}>Executed on(Date)</span>
            <div style={VS}>{data.executedOn || data.awbDate}</div>
          </div>
          <div style={{ ...CS, width: '12%', padding: '3px 4px' }}>
            <span style={LB}>at (Place)</span>
            <div style={VS}>{data.executedAt || 'ICN'}</div>
          </div>
          <div style={{ ...CS, flex: 1, borderRight: 'none', padding: '3px 4px' }}>
            <span style={LB}>Signature of Issuing Carrier or its Agent</span>
            <div style={VS}>{data.signatureCarrier || data.issuerName || ''}</div>
          </div>
        </div>

        {/* === 14. For Carrier's Use === */}
        <div style={{ display: 'flex', minHeight: '22px', background: BG }}>
          <div style={{ ...CS, width: '25%', borderBottom: 'none', padding: '3px 4px' }}>
            <span style={LS}>For Carrier&apos;s Use only<br/>at Destination</span>
          </div>
          <div style={{ ...CS, width: '22%', borderBottom: 'none', padding: '3px 4px' }}>
            <span style={LS}>Charges at Destination</span>
          </div>
          <div style={{ ...CS, flex: 1, borderRight: 'none', borderBottom: 'none', padding: '3px 4px' }}>
            <span style={LS}>Total Collect Charges</span>
            <div style={VS}>{pf(data.totalCollect)}</div>
          </div>
        </div>
      </div>

      {/* === 15. Footer === */}
      <div style={{ textAlign: 'center', padding: '3px 0', fontSize: '9px', fontWeight: 'bold', borderTop: B }}>
        ORIGINAL 3 (FOR SHIPPER)
      </div>
    </div>
  );
}

// ==================== MAWB FORM ====================
function MAWBFormTemplate({ data }: { data: AWBData }) {
  return <IATAFormTemplate data={data} formTitle="Air Waybill" formSubtitle="NOT NEGOTIABLE - AIR CONSIGNMENT NOTE" showMawbBar={true} />;
}

// ==================== HAWB FORM ====================
function HAWBFormTemplate({ data }: { data: AWBData }) {
  return <IATAFormTemplate data={data} formTitle="House Air Waybill" formSubtitle="NOT NEGOTIABLE" showMawbBar={false} />;
}

// ==================== CHECK AWB ====================
function CheckAWBTemplate({ data }: { data: AWBData }) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', width: '194mm', minHeight: '277mm', padding: '3mm', margin: '0 auto', boxSizing: 'border-box', fontSize: '11px' }}>
      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>CHECK AWB</h1>
        <div style={{ textAlign: 'right', fontSize: '11px' }}>발행일자 : {data.awbDate}</div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: B }}>
        <tbody>
          <tr>
            <td rowSpan={2} style={{ ...CS, width: '50%', height: '40px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '9px', marginBottom: 4 }}>Shipper</div>
              <div style={{ whiteSpace: 'pre-line', fontSize: '9px' }}>{data.shipper}{data.shipperTel ? `\nTEL : ${data.shipperTel}` : ''}</div>
            </td>
            <td style={CS}><div style={{ fontWeight: 'bold', fontSize: '9px' }}>HAWB No.</div><div style={{ fontWeight: 'bold', color: '#c53030', fontSize: '10px' }}>{data.hawbNo}</div></td>
          </tr>
          <tr><td style={CS}><div style={{ fontWeight: 'bold', fontSize: '9px' }}>MAWB No.</div><div style={{ fontWeight: 'bold', fontSize: '10px' }}>{data.mawbNo}</div></td></tr>
          <tr>
            <td style={CS}><div style={{ fontWeight: 'bold', fontSize: '9px', marginBottom: 4 }}>Consignee</div><div style={{ whiteSpace: 'pre-line', fontSize: '9px' }}>{data.consignee}{data.consigneeAddress ? `\n${data.consigneeAddress}` : ''}</div></td>
            <td style={CS}><div style={{ fontWeight: 'bold', fontSize: '9px', marginBottom: 4 }}>Carrier / Flight</div><div style={{ fontSize: '9px' }}>{data.carrier}{data.flightNo ? ` / ${data.flightNo}` : ''}{data.flightDate ? ` (${data.flightDate})` : ''}</div></td>
          </tr>
          <tr>
            <td style={CS}><div style={{ fontWeight: 'bold', fontSize: '9px', marginBottom: 4 }}>Agent</div><div style={{ whiteSpace: 'pre-line', fontSize: '9px' }}>{data.agentName || data.issuerName || ''}{data.agentIataCode ? `\nIATA Code: ${data.agentIataCode}` : ''}</div></td>
            <td style={CS}><div style={{ fontWeight: 'bold', fontSize: '9px', marginBottom: 4 }}>FROM</div><div style={{ whiteSpace: 'pre-line', fontSize: '9px' }}>{data.issuerName || ''}{data.issuerTel ? `\nTEL : ${data.issuerTel}` : ''}</div></td>
          </tr>
          <tr>
            <td style={CS}><div style={{ fontWeight: 'bold', fontSize: '9px' }}>Airport of Departure</div><div style={{ fontSize: '10px', fontWeight: 'bold' }}>{data.origin}</div></td>
            <td style={CS}><div style={{ fontWeight: 'bold', fontSize: '9px' }}>Airport of Destination</div><div style={{ fontSize: '10px', fontWeight: 'bold' }}>{data.destination}</div></td>
          </tr>
          <tr><td colSpan={2} style={CS}><div style={{ fontWeight: 'bold', fontSize: '9px' }}>Routing</div><div style={{ fontSize: '9px' }}>{data.origin} → {data.routingTo1 || data.destination}{data.routingBy1 ? ` (by ${data.routingBy1})` : ''}</div></td></tr>
          <tr style={{ backgroundColor: '#f9f9f9' }}>
            <td colSpan={2} style={CS}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 3fr', gap: 4, fontWeight: 'bold', fontSize: '8px' }}>
                <div>Pieces</div><div>Gross Wt</div><div>Ch. Wt</div><div>Rate</div><div>Total</div><div>Nature of Goods</div>
              </div>
            </td>
          </tr>
          <tr>
            <td colSpan={2} style={{ ...CS, minHeight: '350px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 3fr', gap: 4, minHeight: '320px' }}>
                <div style={{ fontSize: '10px' }}>{data.pieces}</div>
                <div style={{ fontSize: '10px', textAlign: 'right' }}>{data.grossWeight.toLocaleString()} {data.weightUnit}</div>
                <div style={{ fontSize: '10px', textAlign: 'right' }}>{data.chargeableWeight?.toLocaleString() || '-'}</div>
                <div style={{ fontSize: '10px', textAlign: 'right' }}>{data.rate ? pf(data.rate) : '-'}</div>
                <div style={{ fontSize: '10px', textAlign: 'right' }}>{pf(data.totalCharge) || '-'}</div>
                <div style={{ fontSize: '10px' }}>
                  <div style={{ fontWeight: 'bold' }}>SAID TO CONTAIN</div>
                  <div style={{ marginTop: 12, whiteSpace: 'pre-line' }}>{data.natureOfGoods || 'CONSOLIDATION CARGO'}{data.dimensions ? `\n\nDimensions: ${data.dimensions}` : ''}</div>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td style={CS}><div style={{ fontWeight: 'bold', fontSize: '9px' }}>Currency / Declared Value</div><div style={{ fontSize: '9px' }}>{data.currency || 'USD'} / Carriage: {data.declaredValueCarriage || 'NVD'} / Customs: {data.declaredValueCustoms || 'NCV'}</div></td>
            <td style={CS}><div style={{ fontWeight: 'bold', fontSize: '9px' }}>Insurance Amount</div><div style={{ fontSize: '9px' }}>{data.insuranceAmount || 'NIL'}</div></td>
          </tr>
          <tr>
            <td style={CS}><div style={{ fontWeight: 'bold', fontSize: '9px' }}>Total Prepaid</div><div style={{ fontSize: '10px', fontWeight: 'bold' }}>{pf(data.totalPrepaid) || pf(data.totalCharge)}</div></td>
            <td style={CS}><div style={{ fontWeight: 'bold', fontSize: '9px' }}>Total Collect</div><div style={{ fontSize: '10px' }}>{pf(data.totalCollect)}</div></td>
          </tr>
          <tr><td colSpan={2} style={CS}><div style={{ fontWeight: 'bold', fontSize: '9px' }}>Handling Information</div><div style={{ fontSize: '9px' }}>{data.handlingInfo || ''}</div></td></tr>
          <tr>
            <td style={CS}><div style={{ fontWeight: 'bold', fontSize: '9px' }}>Executed On / At</div><div style={{ fontSize: '9px' }}>{data.executedOn || data.awbDate} / {data.executedAt || 'SEOUL, KOREA'}</div></td>
            <td style={CS}><div style={{ fontWeight: 'bold', fontSize: '9px' }}>Issuing Carrier</div><div style={{ fontSize: '9px' }}>{data.issuerName || ''}</div></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
