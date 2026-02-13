'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import CodeSearchModal, { CodeType, CodeItem } from '@/components/popup/CodeSearchModal';
import { formatCurrency } from '@/utils/format';

type TabType = 'MAIN' | 'CARGO' | 'OTHER';

const validateMAWBCheckDigit = (mawbNo: string): boolean => {
  const cleaned = mawbNo.replace(/-/g, '');
  if (cleaned.length !== 11) return false;
  const serial = cleaned.substring(3, 10);
  const checkDigit = parseInt(cleaned.substring(10));
  return (parseInt(serial) % 7) === checkDigit;
};

/* ── Interfaces ── */
interface MainData {
  ioType: string; jobNo: string; bookingNo: string; mawbNo: string;
  obDate: string; arDate: string;
  shipperCode: string; shipperName: string; shipperAddress: string;
  consigneeCode: string; consigneeName: string; consigneeAddress: string; consigneeCopy: boolean;
  notifyCode: string; notifyName: string; notifyAddress: string; notifySameAs: boolean;
  currencyCode: string; wtVal: string; otherChgs: string; chgsCode: string;
  departure: string; arrival: string; flightNo: string; flightDate: string; handlingInfo: string;
  totalPieces: number; totalWeight: number; chargeableWeight: number; hawbCount: number;
  // 신규
  hawbNo: string; bizType: string; consolType: string; exportType: string;
  salesType: string; paymentMethod: string;
  iataCode: string; accountNo: string; accountInfo: string; notNegotiable: string;
  dvCarriage: string; dvCustoms: string; amountInsurance: string;
  departureDate: string; departureTime: string;
  arrivalDate: string; arrivalTime: string;
  toByCarrier: string; flightNo2: string; flightNo3: string;
  toByCode1: string; toByFlight1: string; toByCode2: string; toByFlight2: string; toByCode3: string; toByFlight3: string;
  bookinNo: string;
  requestFlightNo: string; requestDate: string; requestTime: string;
  dvCustomsConsole: string;
}

interface OtherChargeItem {
  id: string; chargeCode: string; currency: string;
  rate: number; amount: number; pcType: string; acType: string;
}

interface CargoData {
  natureOfGoods: string; atPlace: string;
  rateCharge: number; rateApplied: number; rateType: string;
  kgLb: string; rateClass: string; totalAmount: number; asArranged: string;
  weightChargeP: number; weightChargeC: number;
  valuationChargeP: number; valuationChargeC: number;
  totalChargeAgentP: number; totalChargeAgentC: number;
  totalChargeCarrierP: number; totalChargeCarrierC: number;
  totalPrepaid1: number; totalPrepaid2: number;
  executedDate: string; signature: string;
  otherCharges: OtherChargeItem[];
}

interface OtherData {
  agentCode: string; agentName: string; subAgentCode: string; subAgentName: string;
  partnerCode: string; partnerName: string; airlineCode: string; airlineName: string;
  regionCode: string; countryCode: string; mrnNo: string; msn: string; status: string;
  salesMan: string; inputStaff: string; branchCode: string;
  areaName: string; countryName: string;
  lcNo: string; poNo: string; item: string; amountOther: number;
  invValue: string; invNo: string;
  createdAt: string; updatedAt: string;
}

interface RateChargeResult {
  found: boolean; message?: string;
  origin?: string; destination?: string; currency?: string;
  chargeableWeight?: number; pieces?: number;
  appliedRate?: number; rateType?: string;
  minCharge?: number; ratePerBl?: number; rateCharge?: number;
}

/* ── Initial Data ── */
const initialMainData: MainData = {
  ioType: 'OUT', jobNo: '', bookingNo: '', mawbNo: '',
  obDate: '', arDate: '',
  shipperCode: '', shipperName: '', shipperAddress: '',
  consigneeCode: '', consigneeName: '', consigneeAddress: '', consigneeCopy: false,
  notifyCode: '', notifyName: '', notifyAddress: '', notifySameAs: false,
  currencyCode: 'USD', wtVal: 'C', otherChgs: 'C', chgsCode: '',
  departure: 'ICN', arrival: '', flightNo: '', flightDate: '', handlingInfo: '',
  totalPieces: 0, totalWeight: 0, chargeableWeight: 0, hawbCount: 0,
  hawbNo: '', bizType: '', consolType: 'CONSOL', exportType: 'EXPORT',
  salesType: '', paymentMethod: '',
  iataCode: '', accountNo: '', accountInfo: '', notNegotiable: '',
  dvCarriage: 'N.V.D', dvCustoms: '', amountInsurance: '',
  departureDate: '', departureTime: '', arrivalDate: '', arrivalTime: '',
  toByCarrier: '', flightNo2: '', flightNo3: '',
  toByCode1: '', toByFlight1: '', toByCode2: '', toByFlight2: '', toByCode3: '', toByFlight3: '',
  bookinNo: '',
  requestFlightNo: '', requestDate: '', requestTime: '', dvCustomsConsole: '',
};

const initialCargoData: CargoData = {
  natureOfGoods: '', atPlace: '', rateCharge: 0, rateApplied: 0, rateType: '',
  kgLb: 'KG', rateClass: '', totalAmount: 0, asArranged: 'N',
  weightChargeP: 0, weightChargeC: 0,
  valuationChargeP: 0, valuationChargeC: 0,
  totalChargeAgentP: 0, totalChargeAgentC: 0,
  totalChargeCarrierP: 0, totalChargeCarrierC: 0,
  totalPrepaid1: 0, totalPrepaid2: 0,
  executedDate: '', signature: '', otherCharges: [],
};

const initialOtherData: OtherData = {
  agentCode: '', agentName: '', subAgentCode: '', subAgentName: '',
  partnerCode: '', partnerName: '', airlineCode: '', airlineName: '',
  regionCode: '', countryCode: '', mrnNo: '', msn: '', status: 'DRAFT',
  salesMan: '', inputStaff: '', branchCode: '',
  areaName: '', countryName: '',
  lcNo: '', poNo: '', item: '', amountOther: 0,
  invValue: '', invNo: '', createdAt: '', updatedAt: '',
};

/* ── Reusable Components ── */
const SearchBtn = ({ onClick }: { onClick: () => void }) => (
  <button type="button" onClick={onClick} className="px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
  </button>
);

const SectionHeader = ({ title, icon, collapsed, onToggle }: { title: string; icon: React.ReactNode; collapsed: boolean; onToggle: () => void }) => (
  <button type="button" onClick={onToggle} className="w-full p-4 border-b border-[var(--border)] flex items-center gap-2 hover:bg-[var(--surface-50)] transition-colors">
    {icon}
    <h3 className="font-bold flex-1 text-left">{title}</h3>
    <svg className={`w-5 h-5 transition-transform ${collapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </button>
);

const inputCls = "w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm";
const readonlyCls = "w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm";
const selectCls = "w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm";
const numCls = "w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm text-right";

function MasterAWBRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [activeTab, setActiveTab] = useState<TabType>('MAIN');
  const [mainData, setMainData] = useState<MainData>(initialMainData);
  const [cargoData, setCargoData] = useState<CargoData>(initialCargoData);
  const [otherData, setOtherData] = useState<OtherData>(initialOtherData);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [mawbError, setMawbError] = useState('');
  const [rateResult, setRateResult] = useState<RateChargeResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [showCodeSearchModal, setShowCodeSearchModal] = useState(false);
  const [searchModalType, setSearchModalType] = useState<CodeType>('customer');
  const [searchTargetCallback, setSearchTargetCallback] = useState<((item: CodeItem) => void) | null>(null);

  // 접이식 섹션 상태
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (key: string) => setCollapsed(p => ({ ...p, [key]: !p[key] }));

  const openCodeSearchModal = (codeType: CodeType, callback: (item: CodeItem) => void) => {
    setSearchModalType(codeType);
    setSearchTargetCallback(() => callback);
    setShowCodeSearchModal(true);
  };
  const handleCodeSelect = (item: CodeItem) => { if (searchTargetCallback) searchTargetCallback(item); setShowCodeSearchModal(false); };
  const handleConfirmClose = () => { setShowCloseModal(false); router.push('/logis/bl/air/master'); };
  useCloseConfirm({ showModal: showCloseModal, setShowModal: setShowCloseModal, onConfirmClose: handleConfirmClose });

  /* ── Data Load ── */
  useEffect(() => {
    if (!editId) return;
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/bl/air/master?id=${editId}`);
        if (!res.ok) return;
        const d = await res.json();
        const ds = (v: string | null) => v ? v.substring(0, 10) : '';
        setMainData({
          ioType: d.IO_TYPE || 'OUT', jobNo: d.JOB_NO || '', bookingNo: d.BOOKING_NO || '', mawbNo: d.MAWB_NO || '',
          obDate: ds(d.OB_DATE), arDate: ds(d.AR_DATE),
          shipperCode: d.SHIPPER_CODE || '', shipperName: d.SHIPPER_NAME || '', shipperAddress: d.SHIPPER_ADDRESS || '',
          consigneeCode: d.CONSIGNEE_CODE || '', consigneeName: d.CONSIGNEE_NAME || '', consigneeAddress: d.CONSIGNEE_ADDRESS || '', consigneeCopy: false,
          notifyCode: d.NOTIFY_CODE || '', notifyName: d.NOTIFY_NAME || '', notifyAddress: d.NOTIFY_ADDRESS || '', notifySameAs: false,
          currencyCode: d.CURRENCY || 'USD', wtVal: d.WT_VAL || 'C', otherChgs: d.OTHER_CHGS || 'C', chgsCode: d.CHGS_CODE || '',
          departure: d.DEPARTURE || '', arrival: d.ARRIVAL || '', flightNo: d.FLIGHT_NO || '', flightDate: ds(d.FLIGHT_DATE), handlingInfo: d.HANDLING_INFO || '',
          totalPieces: d.TOTAL_PIECES || 0, totalWeight: d.TOTAL_WEIGHT || 0, chargeableWeight: d.CHARGEABLE_WEIGHT || 0, hawbCount: d.HAWB_COUNT || 0,
          hawbNo: d.HAWB_NO || '', bizType: d.BIZ_TYPE || '', consolType: d.CONSOL_TYPE || 'CONSOL', exportType: d.EXPORT_TYPE || 'EXPORT',
          salesType: d.SALES_TYPE || '', paymentMethod: d.PAYMENT_METHOD || '',
          iataCode: d.IATA_CODE || '', accountNo: d.ACCOUNT_NO || '', accountInfo: d.ACCOUNT_INFO || '', notNegotiable: d.NOT_NEGOTIABLE || '',
          dvCarriage: d.DV_CARRIAGE || 'N.V.D', dvCustoms: d.DV_CUSTOMS || '', amountInsurance: d.AMOUNT_INSURANCE || '',
          departureDate: ds(d.DEPARTURE_DATE), departureTime: d.DEPARTURE_TIME || '',
          arrivalDate: ds(d.ARRIVAL_DATE), arrivalTime: d.ARRIVAL_TIME || '',
          toByCarrier: d.TO_BY_CARRIER || '', flightNo2: d.FLIGHT_NO_2 || '', flightNo3: d.FLIGHT_NO_3 || '',
          toByCode1: ((d.TO_BY_CARRIER || '').split('/')[0]) || '', toByFlight1: ((d.TO_BY_CARRIER || '').split('/')[1]) || '',
          toByCode2: ((d.TO_BY_CARRIER || '').split('/')[2]) || '', toByFlight2: ((d.TO_BY_CARRIER || '').split('/')[3]) || '',
          toByCode3: ((d.TO_BY_CARRIER || '').split('/')[4]) || '', toByFlight3: ((d.TO_BY_CARRIER || '').split('/')[5]) || '',
          bookinNo: d.BOOKIN_NO || '',
          requestFlightNo: d.REQUEST_FLIGHT_NO || '', requestDate: ds(d.REQUEST_DATE), requestTime: d.REQUEST_TIME || '',
          dvCustomsConsole: d.DV_CUSTOMS_CONSOLE || '',
        });
        setCargoData({
          natureOfGoods: d.NATURE_OF_GOODS || '', atPlace: d.AT_PLACE || '',
          rateCharge: d.RATE_CHARGE || 0, rateApplied: d.RATE_APPLIED || 0, rateType: d.RATE_TYPE || '',
          kgLb: d.KG_LB || 'KG', rateClass: d.RATE_CLASS || '', totalAmount: d.TOTAL_AMOUNT || 0, asArranged: d.AS_ARRANGED || 'N',
          weightChargeP: d.WEIGHT_CHARGE_P || 0, weightChargeC: d.WEIGHT_CHARGE_C || 0,
          valuationChargeP: d.VALUATION_CHARGE_P || 0, valuationChargeC: d.VALUATION_CHARGE_C || 0,
          totalChargeAgentP: d.TOTAL_CHARGE_AGENT_P || 0, totalChargeAgentC: d.TOTAL_CHARGE_AGENT_C || 0,
          totalChargeCarrierP: d.TOTAL_CHARGE_CARRIER_P || 0, totalChargeCarrierC: d.TOTAL_CHARGE_CARRIER_C || 0,
          totalPrepaid1: d.TOTAL_PREPAID_1 || 0, totalPrepaid2: d.TOTAL_PREPAID_2 || 0,
          executedDate: ds(d.EXECUTED_DATE), signature: d.SIGNATURE || '',
          otherCharges: [],
        });
        setOtherData({
          agentCode: d.AGENT_CODE || '', agentName: d.AGENT_NAME || '',
          subAgentCode: d.SUB_AGENT_CODE || '', subAgentName: d.SUB_AGENT_NAME || '',
          partnerCode: d.PARTNER_CODE || '', partnerName: d.PARTNER_NAME || '',
          airlineCode: d.AIRLINE_CODE || '', airlineName: d.AIRLINE_NAME || '',
          regionCode: d.REGION_CODE || '', countryCode: d.COUNTRY_CODE || '',
          mrnNo: d.MRN_NO || '', msn: d.MSN || '', status: d.STATUS || 'DRAFT',
          salesMan: d.SALES_MAN || '', inputStaff: d.INPUT_STAFF || '', branchCode: d.BRANCH_CODE || '',
          areaName: d.AREA_NAME || '', countryName: d.COUNTRY_NAME || '',
          lcNo: d.LC_NO || '', poNo: d.PO_NO || '', item: d.ITEM || '', amountOther: d.AMOUNT_OTHER || 0,
          invValue: d.INV_VALUE || '', invNo: d.INV_NO || '',
          createdAt: d.CREATED_DTM || '', updatedAt: d.UPDATED_DTM || '',
        });
        setIsSaved(true);

        // Charge 로드
        const cRes = await fetch(`/api/bl/air/master/charge?mawbId=${editId}`);
        if (cRes.ok) {
          const charges = await cRes.json();
          setCargoData(prev => ({
            ...prev,
            otherCharges: charges.map((c: Record<string, unknown>) => ({
              id: String(c.ID), chargeCode: c.CHARGE_CODE || '', currency: c.CURRENCY || 'USD',
              rate: c.RATE || 0, amount: c.AMOUNT || 0, pcType: c.PC_TYPE || '', acType: c.AC_TYPE || '',
            })),
          }));
        }
      } catch (e) { console.error('Failed to fetch MAWB:', e); }
      finally { setIsLoading(false); }
    })();
  }, [editId]);

  /* ── Side Effects ── */
  useEffect(() => {
    const info = mainData.wtVal === 'P' ? 'Freight Prepaid' : 'Freight Collect';
    setMainData(prev => ({ ...prev, accountInfo: info }));
  }, [mainData.wtVal]);

  useEffect(() => {
    if (mainData.consigneeCopy) setMainData(prev => ({ ...prev, consigneeName: prev.shipperName, consigneeAddress: prev.shipperAddress }));
  }, [mainData.consigneeCopy, mainData.shipperName, mainData.shipperAddress]);

  useEffect(() => {
    if (mainData.notifySameAs) setMainData(prev => ({ ...prev, notifyCode: '', notifyName: 'SAME AS CONSIGNEE', notifyAddress: '' }));
  }, [mainData.notifySameAs]);

  /* ── Handlers ── */
  const handleMawbChange = (value: string) => {
    setMainData(prev => ({ ...prev, mawbNo: value }));
    const cleaned = value.replace(/-/g, '');
    if (cleaned.length === 11) setMawbError(validateMAWBCheckDigit(value) ? '' : 'MAWB Check Digit가 유효하지 않습니다.');
    else if (cleaned.length > 0 && cleaned.length < 11) setMawbError('MAWB는 11자리 숫자여야 합니다.');
    else setMawbError('');
  };

  const handleMainChange = (field: keyof MainData, value: string | boolean | number) => setMainData(prev => ({ ...prev, [field]: value }));
  const handleCargoChange = (field: keyof CargoData, value: unknown) => setCargoData(prev => ({ ...prev, [field]: value }));
  const handleOtherChange = (field: keyof OtherData, value: string | number) => setOtherData(prev => ({ ...prev, [field]: value }));

  const calculateRateCharge = useCallback(async (dep: string, arr: string, wt: number, pcs: number) => {
    if (!dep || !arr || !wt || dep.length < 2 || arr.length < 2) return;
    setCalculating(true);
    try {
      const res = await fetch('/api/air-tariff/calculate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ origin: dep.toUpperCase(), destination: arr.toUpperCase(), weight: wt, pieces: pcs }) });
      const data = await res.json();
      setRateResult(data);
      if (data.found) setCargoData(prev => ({ ...prev, rateCharge: data.rateCharge || 0, rateApplied: data.appliedRate || 0, rateType: data.rateType || '' }));
    } catch { setRateResult(null); }
    finally { setCalculating(false); }
  }, []);

  /* ── Other Charge CRUD ── */
  const addOtherCharge = () => {
    setCargoData(prev => ({
      ...prev,
      otherCharges: [...prev.otherCharges, { id: `CHG-${Date.now()}`, chargeCode: '', currency: 'USD', rate: 0, amount: 0, pcType: 'P', acType: 'A' }],
    }));
  };
  const removeOtherCharge = (id: string) => {
    setCargoData(prev => ({ ...prev, otherCharges: prev.otherCharges.filter(c => c.id !== id) }));
  };
  const updateOtherCharge = (id: string, field: keyof OtherChargeItem, value: string | number) => {
    setCargoData(prev => ({
      ...prev,
      otherCharges: prev.otherCharges.map(c => c.id === id ? { ...c, [field]: value } : c),
    }));
  };

  /* ── Save ── */
  const handleSave = async () => {
    if (!mainData.mawbNo) { alert('MAWB NO는 필수 입력값입니다.'); return; }
    if (mawbError) { alert('MAWB NO를 확인해주세요.'); return; }
    setIsLoading(true);
    try {
      const payload: Record<string, unknown> = {
        ...(editId ? { ID: Number(editId) } : {}),
        IO_TYPE: mainData.ioType, MAWB_NO: mainData.mawbNo, BOOKING_NO: mainData.bookingNo,
        OB_DATE: mainData.obDate || null, AR_DATE: mainData.arDate || null,
        DEPARTURE: mainData.departure, ARRIVAL: mainData.arrival, FLIGHT_NO: mainData.flightNo, FLIGHT_DATE: mainData.flightDate || null,
        SHIPPER_CODE: mainData.shipperCode, SHIPPER_NAME: mainData.shipperName, SHIPPER_ADDRESS: mainData.shipperAddress,
        CONSIGNEE_CODE: mainData.consigneeCode, CONSIGNEE_NAME: mainData.consigneeName, CONSIGNEE_ADDRESS: mainData.consigneeAddress,
        NOTIFY_CODE: mainData.notifyCode, NOTIFY_NAME: mainData.notifyName, NOTIFY_ADDRESS: mainData.notifyAddress,
        CURRENCY: mainData.currencyCode, WT_VAL: mainData.wtVal, OTHER_CHGS: mainData.otherChgs, CHGS_CODE: mainData.chgsCode, HANDLING_INFO: mainData.handlingInfo,
        TOTAL_PIECES: mainData.totalPieces, TOTAL_WEIGHT: mainData.totalWeight, CHARGEABLE_WEIGHT: mainData.chargeableWeight, HAWB_COUNT: mainData.hawbCount,
        RATE_CHARGE: cargoData.rateCharge, RATE_APPLIED: cargoData.rateApplied, RATE_TYPE: cargoData.rateType,
        NATURE_OF_GOODS: cargoData.natureOfGoods, AT_PLACE: cargoData.atPlace,
        AGENT_CODE: otherData.agentCode, AGENT_NAME: otherData.agentName, SUB_AGENT_CODE: otherData.subAgentCode, SUB_AGENT_NAME: otherData.subAgentName,
        PARTNER_CODE: otherData.partnerCode, PARTNER_NAME: otherData.partnerName,
        AIRLINE_CODE: otherData.airlineCode, AIRLINE_NAME: otherData.airlineName,
        REGION_CODE: otherData.regionCode, COUNTRY_CODE: otherData.countryCode,
        MRN_NO: otherData.mrnNo, MSN: otherData.msn, STATUS: otherData.status,
        // 신규 MAIN
        HAWB_NO: mainData.hawbNo, BIZ_TYPE: mainData.bizType, CONSOL_TYPE: mainData.consolType, EXPORT_TYPE: mainData.exportType,
        SALES_TYPE: mainData.salesType, PAYMENT_METHOD: mainData.paymentMethod,
        IATA_CODE: mainData.iataCode, ACCOUNT_NO: mainData.accountNo, ACCOUNT_INFO: mainData.accountInfo, NOT_NEGOTIABLE: mainData.notNegotiable,
        DV_CARRIAGE: mainData.dvCarriage, DV_CUSTOMS: mainData.dvCustoms, AMOUNT_INSURANCE: mainData.amountInsurance,
        DEPARTURE_DATE: mainData.departureDate || null, DEPARTURE_TIME: mainData.departureTime,
        ARRIVAL_DATE: mainData.arrivalDate || null, ARRIVAL_TIME: mainData.arrivalTime,
        TO_BY_CARRIER: [mainData.toByCode1, mainData.toByFlight1, mainData.toByCode2, mainData.toByFlight2, mainData.toByCode3, mainData.toByFlight3].filter(Boolean).join('/'),
        FLIGHT_NO_2: mainData.flightNo2, FLIGHT_NO_3: mainData.flightNo3, BOOKIN_NO: mainData.bookinNo,
        REQUEST_FLIGHT_NO: mainData.requestFlightNo, REQUEST_DATE: mainData.requestDate || null, REQUEST_TIME: mainData.requestTime,
        DV_CUSTOMS_CONSOLE: mainData.dvCustomsConsole,
        // 신규 CARGO
        KG_LB: cargoData.kgLb, RATE_CLASS: cargoData.rateClass, TOTAL_AMOUNT: cargoData.totalAmount, AS_ARRANGED: cargoData.asArranged,
        WEIGHT_CHARGE_P: cargoData.weightChargeP, WEIGHT_CHARGE_C: cargoData.weightChargeC,
        VALUATION_CHARGE_P: cargoData.valuationChargeP, VALUATION_CHARGE_C: cargoData.valuationChargeC,
        TOTAL_CHARGE_AGENT_P: cargoData.totalChargeAgentP, TOTAL_CHARGE_AGENT_C: cargoData.totalChargeAgentC,
        TOTAL_CHARGE_CARRIER_P: cargoData.totalChargeCarrierP, TOTAL_CHARGE_CARRIER_C: cargoData.totalChargeCarrierC,
        TOTAL_PREPAID_1: cargoData.totalPrepaid1, TOTAL_PREPAID_2: cargoData.totalPrepaid2,
        EXECUTED_DATE: cargoData.executedDate || null, SIGNATURE: cargoData.signature,
        // 신규 OTHER
        SALES_MAN: otherData.salesMan, INPUT_STAFF: otherData.inputStaff, BRANCH_CODE: otherData.branchCode,
        AREA_NAME: otherData.areaName, COUNTRY_NAME: otherData.countryName,
        LC_NO: otherData.lcNo, PO_NO: otherData.poNo, ITEM: otherData.item, AMOUNT_OTHER: otherData.amountOther,
        INV_VALUE: otherData.invValue, INV_NO: otherData.invNo,
      };
      const res = await fetch('/api/bl/air/master', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        const result = await res.json();
        const mawbId = editId ? Number(editId) : result.ID;
        if (!editId && result.JOB_NO) setMainData(prev => ({ ...prev, jobNo: result.JOB_NO }));

        // Other Charge 저장
        await fetch('/api/bl/air/master/charge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mawbId, charges: cargoData.otherCharges }),
        });

        setIsSaved(true);
        alert('저장되었습니다.');
        if (!editId) router.replace(`/logis/bl/air/master/register?id=${mawbId}`);
      } else { const err = await res.json(); alert(err.error || '저장 실패'); }
    } catch (e) { console.error('Save error:', e); alert('저장 중 오류가 발생했습니다.'); }
    finally { setIsLoading(false); }
  };

  const handleCopyAWB = () => { if (!isSaved) { alert('저장 완료 후 복사 가능합니다.'); return; } setMainData(prev => ({ ...prev, jobNo: '', mawbNo: '' })); setIsSaved(false); alert('AWB가 복사되었습니다. 새 MAWB NO를 입력하세요.'); };
  const handleList = () => router.push('/logis/bl/air/master');
  const handleNewHouse = () => {
    if (editId) router.push(`/logis/bl/air/house/register?masterId=${editId}`);
    else alert('먼저 Master AWB를 저장해 주세요.');
  };

  /* ── MAIN TAB ── */
  const renderMainTab = () => (
    <div className="space-y-4">
      {/* Main Information */}
      <div className="card">
        <SectionHeader title="Main Information" collapsed={!!collapsed['main']} onToggle={() => toggle('main')}
          icon={<svg className="w-5 h-5 text-[#E8A838]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
        {!collapsed['main'] && (
          <div className="p-4 space-y-4">
            {/* Row 1: 기본 정보 (6칸, 마지막 칸에 영업유형+지불방법 2줄) */}
            <div className="grid grid-cols-6 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">JOB NO</label>
                <input type="text" value={mainData.jobNo} readOnly className={readonlyCls} placeholder="자동생성" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">수출입구분 <span className="text-red-500">*</span></label>
                <select value={mainData.ioType} onChange={e => handleMainChange('ioType', e.target.value)} className={selectCls}>
                  <option value="OUT">수출(OUT)</option><option value="IN">수입(IN)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">업무유형</label>
                <select value={mainData.bizType} onChange={e => handleMainChange('bizType', e.target.value)} className={selectCls}>
                  <option value="">선택</option><option value="수출">수출</option><option value="수출현적">수출현적</option><option value="삼국간">삼국간</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">CONSOL</label>
                <select value={mainData.consolType} onChange={e => handleMainChange('consolType', e.target.value)} className={selectCls}>
                  <option value="CONSOL">CONSOL</option><option value="DIRECT">DIRECT</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">EXPORT/IMPORT</label>
                <select value={mainData.exportType} onChange={e => handleMainChange('exportType', e.target.value)} className={selectCls}>
                  <option value="EXPORT">EXPORT</option><option value="IMPORT">IMPORT</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">영업유형 / 지불방법</label>
                <div className="flex gap-1">
                  <select value={mainData.salesType} onChange={e => handleMainChange('salesType', e.target.value)} className={`flex-1 ${selectCls}`}>
                    <option value="">영업유형</option><option value="LOCAL">LOCAL</option><option value="NOMINATION">NOMINATION</option><option value="CO-LOAD">CO-LOAD</option>
                  </select>
                  <select value={mainData.paymentMethod} onChange={e => handleMainChange('paymentMethod', e.target.value)} className={`flex-1 ${selectCls}`}>
                    <option value="">지불방법</option><option value="L/C">L/C</option><option value="T/T">T/T</option><option value="D/A">D/A</option><option value="D/P">D/P</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Row 2: MAWB / HAWB / BOOKIN NO / BOOKING NO (4칸) */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">MAWB NO <span className="text-red-500">*</span></label>
                <div className="flex gap-1">
                  <input type="text" value={mainData.mawbNo} onChange={e => handleMawbChange(e.target.value)} className={`flex-1 h-[38px] px-3 bg-[var(--surface-50)] border rounded-lg text-sm ${mawbError ? 'border-red-500' : 'border-[var(--border)]'}`} placeholder="000-00000000" maxLength={12} />
                  <SearchBtn onClick={() => {}} />
                </div>
                {mawbError && <p className="text-xs text-red-500 mt-1">{mawbError}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">HAWB NO <span className="text-red-500">*</span></label>
                <div className="flex gap-1 items-center">
                  <input type="text" value={mainData.hawbNo} onChange={e => handleMainChange('hawbNo', e.target.value)} className={`flex-1 ${inputCls}`} />
                  <SearchBtn onClick={() => {}} />
                  <span className="text-xs text-[var(--muted)] whitespace-nowrap">H({mainData.hawbCount})</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">BOOKIN NO</label>
                <input type="text" value={mainData.bookinNo} onChange={e => handleMainChange('bookinNo', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">BOOKING NO</label>
                <input type="text" value={mainData.bookingNo} onChange={e => handleMainChange('bookingNo', e.target.value)} className={inputCls} />
              </div>
            </div>

            {/* Row 3: SHIPPER / CONSIGNEE / NOTIFY */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">SHIPPER</label>
                <div className="flex gap-1 mb-2">
                  <input type="text" value={mainData.shipperCode} onChange={e => handleMainChange('shipperCode', e.target.value)} className="w-24 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="코드" />
                  <input type="text" value={mainData.shipperName} onChange={e => handleMainChange('shipperName', e.target.value)} className={`flex-1 ${inputCls}`} placeholder="Shipper Name" />
                  <SearchBtn onClick={() => openCodeSearchModal('customer', i => setMainData(p => ({ ...p, shipperCode: i.code, shipperName: i.name })))} />
                </div>
                <textarea value={mainData.shipperAddress} onChange={e => handleMainChange('shipperAddress', e.target.value)} rows={3} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm resize-none" placeholder="Address" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium">CONSIGNEE</label>
                  <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={mainData.consigneeCopy} onChange={e => handleMainChange('consigneeCopy', e.target.checked)} className="rounded" />Copy</label>
                </div>
                <div className="flex gap-1 mb-2">
                  <input type="text" value={mainData.consigneeCode} onChange={e => handleMainChange('consigneeCode', e.target.value)} className="w-24 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="코드" />
                  <input type="text" value={mainData.consigneeName} onChange={e => handleMainChange('consigneeName', e.target.value)} className={`flex-1 ${inputCls}`} placeholder="Consignee Name" />
                  <SearchBtn onClick={() => openCodeSearchModal('customer', i => setMainData(p => ({ ...p, consigneeCode: i.code, consigneeName: i.name })))} />
                </div>
                <textarea value={mainData.consigneeAddress} onChange={e => handleMainChange('consigneeAddress', e.target.value)} rows={3} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm resize-none" placeholder="Address" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium">NOTIFY PARTY</label>
                  <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={mainData.notifySameAs} onChange={e => handleMainChange('notifySameAs', e.target.checked)} className="rounded" />Same As</label>
                </div>
                <div className="flex gap-1 mb-2">
                  <input type="text" value={mainData.notifyCode} onChange={e => handleMainChange('notifyCode', e.target.value)} className="w-24 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="코드" disabled={mainData.notifySameAs} />
                  <input type="text" value={mainData.notifyName} onChange={e => handleMainChange('notifyName', e.target.value)} className={`flex-1 ${inputCls}`} placeholder="Notify Name" disabled={mainData.notifySameAs} />
                  <SearchBtn onClick={() => openCodeSearchModal('customer', i => setMainData(p => ({ ...p, notifyCode: i.code, notifyName: i.name })))} />
                </div>
                <textarea value={mainData.notifyAddress} onChange={e => handleMainChange('notifyAddress', e.target.value)} rows={3} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm resize-none" placeholder="Address" disabled={mainData.notifySameAs} />
              </div>
            </div>

            {/* Row 4: IATA / ACCOUNT NO (3칸, 앞 2칸만 사용) */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">IATA CODE</label>
                <input type="text" value={mainData.iataCode} onChange={e => handleMainChange('iataCode', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">ACCOUNT NO</label>
                <input type="text" value={mainData.accountNo} onChange={e => handleMainChange('accountNo', e.target.value)} className={inputCls} />
              </div>
              <div />
            </div>

            {/* Row 5: ACCOUNT INFO / CUR / CHGS CODE / WT/VAL / OTHER / Not negotiable (6칸) */}
            <div className="grid grid-cols-6 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">ACCOUNT INFO</label>
                <div className={`${readonlyCls} pt-2`}>{mainData.accountInfo || '-'}</div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">CUR</label>
                <select value={mainData.currencyCode} onChange={e => handleMainChange('currencyCode', e.target.value)} className={selectCls}>
                  <option value="USD">USD</option><option value="KRW">KRW</option><option value="EUR">EUR</option><option value="JPY">JPY</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">CHGS CODE</label>
                <input type="text" value={mainData.chgsCode} onChange={e => handleMainChange('chgsCode', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">WT/VAL</label>
                <div className="flex gap-3 pt-2">
                  {['P', 'C'].map(v => <label key={v} className="flex items-center gap-1"><input type="radio" name="wtVal" value={v} checked={mainData.wtVal === v} onChange={e => handleMainChange('wtVal', e.target.value)} /><span className="text-sm">{v}</span></label>)}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">OTHER</label>
                <div className="flex gap-3 pt-2">
                  {['P', 'C'].map(v => <label key={v} className="flex items-center gap-1"><input type="radio" name="otherChgs" value={v} checked={mainData.otherChgs === v} onChange={e => handleMainChange('otherChgs', e.target.value)} /><span className="text-sm">{v}</span></label>)}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Not negotiable</label>
                <div className="flex gap-1">
                  <input type="text" value={mainData.notNegotiable} onChange={e => handleMainChange('notNegotiable', e.target.value)} className={`flex-1 ${inputCls}`} />
                  <SearchBtn onClick={() => {}} />
                </div>
              </div>
            </div>

            {/* Row 6: DV CARRIAGE / DV.CUSTOMS / Amount of Insurance / NIL (4칸) */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">D.V CARRIAGE</label>
                <input type="text" value={mainData.dvCarriage} onChange={e => handleMainChange('dvCarriage', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">DV.CUSTOMS</label>
                <input type="text" value={mainData.dvCustoms} onChange={e => handleMainChange('dvCustoms', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Amount of Insurance</label>
                <input type="text" value={mainData.amountInsurance} onChange={e => handleMainChange('amountInsurance', e.target.value)} className={inputCls} />
              </div>
              <div className="flex items-end">
                <span className="text-xs text-[var(--muted)] pb-2">INSURANCE - If carrier offers no coverage, &quot;NIL&quot;</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Console Information */}
      <div className="card">
        <SectionHeader title="Console Information" collapsed={!!collapsed['console']} onToggle={() => toggle('console')}
          icon={<svg className="w-5 h-5 text-[#E8A838]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>} />
        {!collapsed['console'] && (
          <div className="p-4 space-y-4">
            {/* Row C1: DEP + DATE/TIME + TO/BY routing */}
            <div className="flex gap-3 items-end">
              <div className="w-48">
                <label className="block text-xs font-medium mb-1">AIRPORT OF DEPARTURE</label>
                <div className="flex gap-1">
                  <input type="text" value={mainData.departure} onChange={e => { const v = e.target.value.toUpperCase(); handleMainChange('departure', v); calculateRateCharge(v, mainData.arrival, mainData.totalWeight, mainData.totalPieces); }} className={`flex-1 ${inputCls} font-mono`} placeholder="ICN" maxLength={5} />
                  <SearchBtn onClick={() => openCodeSearchModal('airport', i => { setMainData(p => ({ ...p, departure: i.code })); calculateRateCharge(i.code, mainData.arrival, mainData.totalWeight, mainData.totalPieces); })} />
                </div>
              </div>
              <div className="w-36">
                <label className="block text-xs font-medium mb-1">DEPARTURE DATE</label>
                <input type="date" value={mainData.departureDate} onChange={e => handleMainChange('departureDate', e.target.value)} className={inputCls} />
              </div>
              <div className="w-28">
                <label className="block text-xs font-medium mb-1">TIME</label>
                <input type="time" value={mainData.departureTime} onChange={e => handleMainChange('departureTime', e.target.value)} className={inputCls} />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1">TO/BY First Carrier (Routing)</label>
                <div className="flex items-center gap-1">
                  <input type="text" value={mainData.toByCode1} onChange={e => handleMainChange('toByCode1', e.target.value.toUpperCase())} className="w-16 h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm font-mono text-center" placeholder="TO" maxLength={5} />
                  <input type="text" value={mainData.toByFlight1} onChange={e => handleMainChange('toByFlight1', e.target.value.toUpperCase())} className="w-20 h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm font-mono" placeholder="BY" maxLength={8} />
                  <span className="text-sm font-bold text-[var(--muted)]">/</span>
                  <input type="text" value={mainData.toByCode2} onChange={e => handleMainChange('toByCode2', e.target.value.toUpperCase())} className="w-16 h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm font-mono text-center" placeholder="TO" maxLength={5} />
                  <input type="text" value={mainData.toByFlight2} onChange={e => handleMainChange('toByFlight2', e.target.value.toUpperCase())} className="w-20 h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm font-mono" placeholder="BY" maxLength={8} />
                  <span className="text-sm font-bold text-[var(--muted)]">/</span>
                  <input type="text" value={mainData.toByCode3} onChange={e => handleMainChange('toByCode3', e.target.value.toUpperCase())} className="w-16 h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm font-mono text-center" placeholder="TO" maxLength={5} />
                  <input type="text" value={mainData.toByFlight3} onChange={e => handleMainChange('toByFlight3', e.target.value.toUpperCase())} className="w-20 h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm font-mono" placeholder="BY" maxLength={8} />
                </div>
              </div>
            </div>

            {/* Row C2: ARR + DATE/TIME + FLIGHT NO 3개 input */}
            <div className="flex gap-3 items-end">
              <div className="w-48">
                <label className="block text-xs font-medium mb-1">AIRPORT OF ARRIVAL</label>
                <div className="flex gap-1">
                  <input type="text" value={mainData.arrival} onChange={e => { const v = e.target.value.toUpperCase(); handleMainChange('arrival', v); calculateRateCharge(mainData.departure, v, mainData.totalWeight, mainData.totalPieces); }} className={`flex-1 ${inputCls} font-mono`} placeholder="LAX" maxLength={5} />
                  <SearchBtn onClick={() => openCodeSearchModal('airport', i => { setMainData(p => ({ ...p, arrival: i.code })); calculateRateCharge(mainData.departure, i.code, mainData.totalWeight, mainData.totalPieces); })} />
                </div>
              </div>
              <div className="w-36">
                <label className="block text-xs font-medium mb-1">ARRIVAL DATE</label>
                <input type="date" value={mainData.arrivalDate} onChange={e => handleMainChange('arrivalDate', e.target.value)} className={inputCls} />
              </div>
              <div className="w-28">
                <label className="block text-xs font-medium mb-1">TIME</label>
                <input type="time" value={mainData.arrivalTime} onChange={e => handleMainChange('arrivalTime', e.target.value)} className={inputCls} />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1">FLIGHT NO</label>
                <div className="flex items-center gap-1">
                  <input type="text" value={mainData.flightNo} onChange={e => handleMainChange('flightNo', e.target.value)} className="flex-1 h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm font-mono" placeholder="KE001" />
                  <span className="text-sm font-bold text-[var(--muted)]">/</span>
                  <input type="text" value={mainData.flightNo2} onChange={e => handleMainChange('flightNo2', e.target.value)} className="flex-1 h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm font-mono" placeholder="편명2" />
                  <span className="text-sm font-bold text-[var(--muted)]">/</span>
                  <input type="text" value={mainData.flightNo3} onChange={e => handleMainChange('flightNo3', e.target.value)} className="flex-1 h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm font-mono" placeholder="편명3" />
                </div>
              </div>
            </div>

            {/* Row C3: REQUEST FLIGHT / DATE / TIME / O/B Date / Flight Date / A/R Date */}
            <div className="grid grid-cols-6 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">REQUEST FLIGHT NO</label>
                <input type="text" value={mainData.requestFlightNo} onChange={e => handleMainChange('requestFlightNo', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">REQUEST DATE</label>
                <input type="date" value={mainData.requestDate} onChange={e => handleMainChange('requestDate', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">TIME</label>
                <input type="time" value={mainData.requestTime} onChange={e => handleMainChange('requestTime', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">O/B Date</label>
                <input type="date" value={mainData.obDate} onChange={e => handleMainChange('obDate', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Flight Date</label>
                <input type="date" value={mainData.flightDate} onChange={e => handleMainChange('flightDate', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">A/R Date</label>
                <input type="date" value={mainData.arDate} onChange={e => handleMainChange('arDate', e.target.value)} className={inputCls} />
              </div>
            </div>

            {/* Row C4: HANDLING INFO / DV.CUSTOMS */}
            <div className="grid grid-cols-6 gap-3">
              <div className="col-span-4">
                <label className="block text-xs font-medium mb-1">HANDLING INFORMATION</label>
                <div className="flex gap-1">
                  <input type="text" value={mainData.handlingInfo} onChange={e => handleMainChange('handlingInfo', e.target.value)} className={`flex-1 ${inputCls}`} />
                  <SearchBtn onClick={() => {}} />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1">DV.CUSTOMS</label>
                <input type="text" value={mainData.dvCustomsConsole} onChange={e => handleMainChange('dvCustomsConsole', e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  /* ── CARGO TAB ── */
  const renderCargoTab = () => (
    <div className="space-y-4">
      {/* Cargo Information - 좌 60% grid + 우 40% textarea */}
      <div className="card">
        <SectionHeader title="Cargo Information" collapsed={!!collapsed['cargo']} onToggle={() => toggle('cargo')}
          icon={<svg className="w-5 h-5 text-[#E8A838]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>} />
        {!collapsed['cargo'] && (
          <div className="p-4 space-y-4">
            <div className="flex gap-4">
              {/* 좌: Cargo grid (~60%) */}
              <div className="w-[60%] space-y-3">
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">No.of Pieces</label>
                    <input type="number" value={mainData.totalPieces} onChange={e => { const v = parseInt(e.target.value) || 0; handleMainChange('totalPieces', v); calculateRateCharge(mainData.departure, mainData.arrival, mainData.totalWeight, v); }} className={numCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Gross Weight</label>
                    <input type="number" step="0.01" value={mainData.totalWeight} onChange={e => { const v = parseFloat(e.target.value) || 0; handleMainChange('totalWeight', v); calculateRateCharge(mainData.departure, mainData.arrival, v, mainData.totalPieces); }} className={numCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Kg/lb</label>
                    <select value={cargoData.kgLb} onChange={e => handleCargoChange('kgLb', e.target.value)} className={selectCls}>
                      <option value="KG">KG</option><option value="LB">LB</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Rate Class</label>
                    <input type="text" value={cargoData.rateClass} onChange={e => handleCargoChange('rateClass', e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Chargeable Wt</label>
                    <input type="number" step="0.01" value={mainData.chargeableWeight} onChange={e => handleMainChange('chargeableWeight', parseFloat(e.target.value) || 0)} className={numCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Rate/Charge</label>
                    <input type="text" value={formatCurrency(cargoData.rateCharge)} readOnly className={`${readonlyCls} text-right font-medium`} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Total</label>
                    <input type="number" step="0.01" value={cargoData.totalAmount} onChange={e => handleCargoChange('totalAmount', parseFloat(e.target.value) || 0)} className={numCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">As Arranged</label>
                    <select value={cargoData.asArranged} onChange={e => handleCargoChange('asArranged', e.target.value)} className={selectCls}>
                      <option value="N">N</option><option value="Y">Y</option>
                    </select>
                  </div>
                </div>
              </div>
              {/* 우: Nature of Goods textarea (~40%) */}
              <div className="w-[40%]">
                <label className="block text-xs font-medium mb-1">Nature and Quantity of Goods (incl. Dimensions or Volume)</label>
                <textarea value={cargoData.natureOfGoods} onChange={e => handleCargoChange('natureOfGoods', e.target.value)} rows={5} className="w-full h-[calc(100%-24px)] px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm resize-none" placeholder="Description of Goods" />
              </div>
            </div>
            {calculating && <span className="text-sm text-[var(--muted)] flex items-center gap-2"><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>운임 계산 중...</span>}
            {rateResult && rateResult.found && (
              <div className="p-3 bg-[#E8A838]/10 border border-[#E8A838]/30 rounded-lg text-sm">
                <span className="font-medium">자동 계산:</span> {rateResult.origin} → {rateResult.destination} | 적용단가: {rateResult.appliedRate?.toLocaleString()} {rateResult.currency}/kg ({rateResult.rateType}) | <span className="font-bold text-[#E8A838]">운임: {rateResult.currency} {rateResult.rateCharge?.toLocaleString()}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Weight Charge (좌 30%) + Other Charge (우 70%) 가로 배치 */}
      <div className="card">
        <div className="p-4">
          <div className="flex gap-4">
            {/* 좌: Weight Charge 세로 스택 (30%) */}
            <div className="w-[30%] space-y-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-[#E8A838]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                Weight Charge
              </h3>
              <div>
                <label className="block text-xs font-medium mb-1">Weight Charge</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <span className="block text-[10px] text-[var(--muted)] mb-0.5">P (Prepaid)</span>
                    <input type="number" step="0.01" value={cargoData.weightChargeP} onChange={e => handleCargoChange('weightChargeP', parseFloat(e.target.value) || 0)} className={numCls} />
                  </div>
                  <div className="flex-1">
                    <span className="block text-[10px] text-[var(--muted)] mb-0.5">C (Collect)</span>
                    <input type="number" step="0.01" value={cargoData.weightChargeC} onChange={e => handleCargoChange('weightChargeC', parseFloat(e.target.value) || 0)} className={numCls} />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Valuation Charge</label>
                <div className="flex gap-2">
                  <div className="flex-1"><input type="number" step="0.01" value={cargoData.valuationChargeP} onChange={e => handleCargoChange('valuationChargeP', parseFloat(e.target.value) || 0)} className={numCls} /></div>
                  <div className="flex-1"><input type="number" step="0.01" value={cargoData.valuationChargeC} onChange={e => handleCargoChange('valuationChargeC', parseFloat(e.target.value) || 0)} className={numCls} /></div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Total Other Due Agent</label>
                <div className="flex gap-2">
                  <div className="flex-1"><input type="number" step="0.01" value={cargoData.totalChargeAgentP} onChange={e => handleCargoChange('totalChargeAgentP', parseFloat(e.target.value) || 0)} className={numCls} /></div>
                  <div className="flex-1"><input type="number" step="0.01" value={cargoData.totalChargeAgentC} onChange={e => handleCargoChange('totalChargeAgentC', parseFloat(e.target.value) || 0)} className={numCls} /></div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Total Other Due Carrier</label>
                <div className="flex gap-2">
                  <div className="flex-1"><input type="number" step="0.01" value={cargoData.totalChargeCarrierP} onChange={e => handleCargoChange('totalChargeCarrierP', parseFloat(e.target.value) || 0)} className={numCls} /></div>
                  <div className="flex-1"><input type="number" step="0.01" value={cargoData.totalChargeCarrierC} onChange={e => handleCargoChange('totalChargeCarrierC', parseFloat(e.target.value) || 0)} className={numCls} /></div>
                </div>
              </div>
            </div>

            {/* 우: Other Charge 테이블 (70%) */}
            <div className="w-[70%]">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#E8A838]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Other Charges
                </h3>
                <div className="flex gap-2">
                  <button type="button" onClick={addOtherCharge} className="px-3 py-1 text-sm bg-[#E8A838] text-white rounded hover:bg-[#d99a2f]">추가</button>
                  <button type="button" onClick={() => { const selected = cargoData.otherCharges[cargoData.otherCharges.length - 1]; if (selected) removeOtherCharge(selected.id); }} disabled={cargoData.otherCharges.length === 0} className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed">삭제</button>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="p-2 text-left">Codes</th>
                    <th className="p-2 text-left">CUR</th>
                    <th className="p-2 text-right">Rate</th>
                    <th className="p-2 text-right">Amount</th>
                    <th className="p-2 text-center">P/C</th>
                    <th className="p-2 text-center">A/C</th>
                    <th className="p-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {cargoData.otherCharges.length === 0 ? (
                    <tr><td colSpan={7} className="p-4 text-center text-[var(--muted)] text-sm">운임 정보가 없습니다. 추가 버튼을 클릭하세요.</td></tr>
                  ) : cargoData.otherCharges.map((c) => (
                    <tr key={c.id} className="border-b border-[var(--border)]">
                      <td className="p-1">
                        <div className="flex gap-1">
                          <input type="text" value={c.chargeCode} onChange={e => updateOtherCharge(c.id, 'chargeCode', e.target.value)} className={inputCls} />
                          <SearchBtn onClick={() => openCodeSearchModal('freightBase', i => updateOtherCharge(c.id, 'chargeCode', i.code))} />
                        </div>
                      </td>
                      <td className="p-1">
                        <select value={c.currency} onChange={e => updateOtherCharge(c.id, 'currency', e.target.value)} className={selectCls}>
                          <option value="USD">USD</option><option value="KRW">KRW</option><option value="EUR">EUR</option><option value="JPY">JPY</option>
                        </select>
                      </td>
                      <td className="p-1"><input type="number" step="0.01" value={c.rate} onChange={e => updateOtherCharge(c.id, 'rate', parseFloat(e.target.value) || 0)} className={numCls} /></td>
                      <td className="p-1"><input type="number" step="0.01" value={c.amount} onChange={e => updateOtherCharge(c.id, 'amount', parseFloat(e.target.value) || 0)} className={numCls} /></td>
                      <td className="p-1">
                        <select value={c.pcType} onChange={e => updateOtherCharge(c.id, 'pcType', e.target.value)} className={selectCls}>
                          <option value="P">P</option><option value="C">C</option>
                        </select>
                      </td>
                      <td className="p-1">
                        <select value={c.acType} onChange={e => updateOtherCharge(c.id, 'acType', e.target.value)} className={selectCls}>
                          <option value="A">Agent</option><option value="C">Carrier</option>
                        </select>
                      </td>
                      <td className="p-1 text-center">
                        <button type="button" onClick={() => removeOtherCharge(c.id)} className="text-red-400 hover:text-red-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {cargoData.otherCharges.length > 0 && (
                  <tfoot className="bg-[var(--surface-50)]">
                    <tr className="border-t border-[var(--border)] font-medium">
                      <td colSpan={3} className="p-2 text-right text-sm">Total:</td>
                      <td className="p-2 text-right text-sm">{formatCurrency(cargoData.otherCharges.reduce((s, c) => s + c.amount, 0))}</td>
                      <td colSpan={3}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Console Info (Cargo 하단) */}
      <div className="card">
        <SectionHeader title="Console Information" collapsed={!!collapsed['cargoConsole']} onToggle={() => toggle('cargoConsole')}
          icon={<svg className="w-5 h-5 text-[#E8A838]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} />
        {!collapsed['cargoConsole'] && (
          <div className="p-4">
            <div className="grid grid-cols-6 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Total Prepaid (1)</label>
                <input type="number" step="0.01" value={cargoData.totalPrepaid1} onChange={e => handleCargoChange('totalPrepaid1', parseFloat(e.target.value) || 0)} className={numCls} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Total Prepaid (2)</label>
                <input type="number" step="0.01" value={cargoData.totalPrepaid2} onChange={e => handleCargoChange('totalPrepaid2', parseFloat(e.target.value) || 0)} className={numCls} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Executed on (Date)</label>
                <input type="date" value={cargoData.executedDate} onChange={e => handleCargoChange('executedDate', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">At (Place)</label>
                <div className="flex gap-1">
                  <input type="text" value={cargoData.atPlace} onChange={e => handleCargoChange('atPlace', e.target.value)} className={`flex-1 ${inputCls}`} />
                  <SearchBtn onClick={() => openCodeSearchModal('airport', i => handleCargoChange('atPlace', i.code))} />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1">Signature of Issuing Carrier</label>
                <input type="text" value={cargoData.signature} onChange={e => handleCargoChange('signature', e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  /* ── OTHER TAB ── */
  const renderOtherTab = () => (
    <div className="space-y-4">
      <div className="card">
        <SectionHeader title="Other Information" collapsed={!!collapsed['other']} onToggle={() => toggle('other')}
          icon={<svg className="w-5 h-5 text-[#E8A838]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        {!collapsed['other'] && (
          <div className="p-4 space-y-4">
            {/* Row 1: Agent / Sub Agent / Partner */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">AGENT CODE</label>
                <div className="flex gap-1">
                  <input type="text" value={otherData.agentCode} onChange={e => handleOtherChange('agentCode', e.target.value)} className="w-24 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="코드" />
                  <input type="text" value={otherData.agentName} onChange={e => handleOtherChange('agentName', e.target.value)} className={`flex-1 ${inputCls}`} placeholder="상호" />
                  <SearchBtn onClick={() => openCodeSearchModal('customer', i => setOtherData(p => ({ ...p, agentCode: i.code, agentName: i.name })))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">SUB AGENT</label>
                <div className="flex gap-1">
                  <input type="text" value={otherData.subAgentCode} onChange={e => handleOtherChange('subAgentCode', e.target.value)} className="w-24 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="코드" />
                  <input type="text" value={otherData.subAgentName} onChange={e => handleOtherChange('subAgentName', e.target.value)} className={`flex-1 ${inputCls}`} placeholder="상호" />
                  <SearchBtn onClick={() => openCodeSearchModal('customer', i => setOtherData(p => ({ ...p, subAgentCode: i.code, subAgentName: i.name })))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">PARTNER</label>
                <div className="flex gap-1">
                  <input type="text" value={otherData.partnerCode} onChange={e => handleOtherChange('partnerCode', e.target.value)} className="w-24 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="코드" />
                  <input type="text" value={otherData.partnerName} onChange={e => handleOtherChange('partnerName', e.target.value)} className={`flex-1 ${inputCls}`} placeholder="이름" />
                  <SearchBtn onClick={() => openCodeSearchModal('customer', i => setOtherData(p => ({ ...p, partnerCode: i.code, partnerName: i.name })))} />
                </div>
              </div>
            </div>

            {/* Row 2: Airlines / 영업사원 / 입력사원 / 분지사 */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">AIRLINES</label>
                <div className="flex gap-1">
                  <input type="text" value={otherData.airlineCode} onChange={e => handleOtherChange('airlineCode', e.target.value)} className="w-20 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="코드" />
                  <input type="text" value={otherData.airlineName} onChange={e => handleOtherChange('airlineName', e.target.value)} className={`flex-1 ${inputCls}`} placeholder="이름" />
                  <SearchBtn onClick={() => openCodeSearchModal('airline', i => setOtherData(p => ({ ...p, airlineCode: i.code, airlineName: i.name })))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">영업사원</label>
                <input type="text" value={otherData.salesMan} onChange={e => handleOtherChange('salesMan', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">입력사원</label>
                <input type="text" value={otherData.inputStaff} onChange={e => handleOtherChange('inputStaff', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">분/지사</label>
                <input type="text" value={otherData.branchCode} onChange={e => handleOtherChange('branchCode', e.target.value)} className={inputCls} />
              </div>
            </div>

            {/* Row 3: Area / Country / Item / Amount */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">AREA</label>
                <div className="flex gap-1">
                  <input type="text" value={otherData.areaName} onChange={e => handleOtherChange('areaName', e.target.value)} className={`flex-1 ${inputCls}`} />
                  <SearchBtn onClick={() => openCodeSearchModal('region', i => setOtherData(p => ({ ...p, regionCode: i.code, areaName: i.name })))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">COUNTRY</label>
                <div className="flex gap-1">
                  <input type="text" value={otherData.countryName} onChange={e => handleOtherChange('countryName', e.target.value)} className={`flex-1 ${inputCls}`} />
                  <SearchBtn onClick={() => openCodeSearchModal('country', i => setOtherData(p => ({ ...p, countryCode: i.code, countryName: i.name })))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">ITEM</label>
                <input type="text" value={otherData.item} onChange={e => handleOtherChange('item', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">AMOUNT</label>
                <input type="number" step="0.01" value={otherData.amountOther} onChange={e => handleOtherChange('amountOther', parseFloat(e.target.value) || 0)} className={numCls} />
              </div>
            </div>

            {/* Row 4: L/C NO, P/O NO, INV VALUE, INV NO */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">L/C NO</label>
                <input type="text" value={otherData.lcNo} onChange={e => handleOtherChange('lcNo', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">P/O NO</label>
                <input type="text" value={otherData.poNo} onChange={e => handleOtherChange('poNo', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">INV VALUE</label>
                <input type="text" value={otherData.invValue} onChange={e => handleOtherChange('invValue', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">INV NO</label>
                <input type="text" value={otherData.invNo} onChange={e => handleOtherChange('invNo', e.target.value)} className={inputCls} />
              </div>
            </div>

            {/* Row 5: MRN / MSN */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">MRN NO</label>
                <input type="text" value={otherData.mrnNo} onChange={e => handleOtherChange('mrnNo', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">MSN</label>
                <input type="text" value={otherData.msn} onChange={e => handleOtherChange('msn', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">상태</label>
                <select value={otherData.status} onChange={e => handleOtherChange('status', e.target.value)} className={selectCls}>
                  <option value="DRAFT">작성중</option><option value="CONFIRMED">확정</option><option value="SENT">전송완료</option>
                </select>
              </div>
            </div>

            {/* Row 6: 등록일 / 수정일 (Y/V select + date) */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-[var(--muted)]">최초등록일</label>
                <div className="flex gap-1">
                  <select className="w-16 h-[38px] px-2 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm" disabled>
                    <option value="Y">Y</option><option value="V">V</option>
                  </select>
                  <input type="date" value={otherData.createdAt ? otherData.createdAt.substring(0, 10) : ''} readOnly className={`flex-1 ${readonlyCls}`} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-[var(--muted)]">최종수정일</label>
                <div className="flex gap-1">
                  <select className="w-16 h-[38px] px-2 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm" disabled>
                    <option value="Y">Y</option><option value="V">V</option>
                  </select>
                  <input type="date" value={otherData.updatedAt ? otherData.updatedAt.substring(0, 10) : ''} readOnly className={`flex-1 ${readonlyCls}`} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'MAIN': return renderMainTab();
      case 'CARGO': return renderCargoTab();
      case 'OTHER': return renderOtherTab();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header title={editId ? "Master AWB 수정" : "Master AWB 등록"} subtitle="HOME > 항공수출 > Master AWB 관리 > 등록" onClose={() => setShowCloseModal(true)} />
      <main className="p-6">
        {/* 상단 버튼 */}
        <div className="flex justify-end items-center mb-4 gap-2">
          <button onClick={handleNewHouse} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">House 신규</button>
          <button onClick={() => alert('부킹조회 기능은 준비 중입니다.')} className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] font-medium">부킹조회</button>
          <button onClick={handleCopyAWB} disabled={!isSaved} className={`px-4 py-2 rounded-lg font-medium ${isSaved ? 'bg-[var(--surface-100)] border border-[var(--border)] hover:bg-[var(--surface-200)]' : 'bg-[var(--surface-200)] text-[var(--muted)] cursor-not-allowed'}`}>AWB 복사</button>
          <div className="w-px h-8 bg-[var(--border)]" />
          <button onClick={handleList} className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">목록</button>
          <button onClick={handleSave} disabled={isLoading} className="px-6 py-2 bg-[#E8A838] text-[#0C1222] font-semibold rounded-lg hover:bg-[#D4943A] disabled:opacity-50">{isLoading ? '저장중...' : '저장'}</button>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 border-b border-[var(--border)] mb-4">
          {(['MAIN', 'CARGO', 'OTHER'] as TabType[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-2 px-6 py-3 font-medium rounded-t-lg transition-colors ${activeTab === tab ? 'bg-[#E8A838] text-white' : 'bg-[var(--surface-100)] text-[var(--muted)] hover:bg-[var(--surface-200)] hover:text-[var(--foreground)]'}`}>{tab}</button>
          ))}
        </div>

        {renderTabContent()}
      </main>
      <CloseConfirmModal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} onConfirm={handleConfirmClose} />
      <CodeSearchModal isOpen={showCodeSearchModal} onClose={() => setShowCodeSearchModal(false)} onSelect={handleCodeSelect} codeType={searchModalType} />
    </div>
  );
}

export default function MasterAWBRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)] flex items-center justify-center">Loading...</div>}>
      <MasterAWBRegisterContent />
    </Suspense>
  );
}
