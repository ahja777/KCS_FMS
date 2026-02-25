'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import DimensionsCalcModal from '@/components/popup/DimensionsCalcModal';
import CodeSearchModal, { CodeType, CodeItem } from '@/components/popup/CodeSearchModal';
import { formatCurrency } from '@/utils/format';
import SearchIconButton from '@/components/SearchIconButton';

type TabType = 'MAIN' | 'CARGO' | 'OTHER';

interface DimensionItem { id: string; print: boolean; width: number; length: number; height: number; pcs: number; volume: number; }
interface CargoItem { id: string; piecesRcp: number; grossWeight: number; weightUnit: string; rateClass: string; chargeableWeight: number; rateCharge: number; total: number; asArranged: boolean; }
interface OtherCharge { id: string; codes: string; currency: string; rate: number; amount: number; pc: string; ac: string; }

/* ── Interfaces ── */
interface MainData {
  ioType: string; jobNo: string; bookingNo: string; mawbNo: string; hawbNo: string;
  obDate: string; arDate: string;
  shipperCode: string; shipperName: string; shipperAddress: string;
  consigneeCode: string; consigneeName: string; consigneeAddress: string; consigneeCopy: boolean;
  notifyCode: string; notifyName: string; notifyAddress: string; notifySameAs: boolean;
  currencyCode: string; wtVal: string; otherChgs: string; chgsCode: string;
  departure: string; arrival: string; flightNo: string; flightDate: string; handlingInfo: string;
  bizType: string; consolType: string; exportType: string;
  salesType: string; paymentMethod: string;
  iataCode: string; accountNo: string; accountInfo: string; notNegotiable: string;
  dvCarriage: string; dvCustoms: string; amountInsurance: string;
  departureDate: string; departureTime: string;
  arrivalDate: string; arrivalTime: string;
  flightNo2: string; flightNo3: string;
  toByCode1: string; toByFlight1: string; toByCode2: string; toByFlight2: string; toByCode3: string; toByFlight3: string;
}

interface CargoData {
  cargoItems: CargoItem[]; otherCharges: OtherCharge[];
  natureOfGoods: string; weightCharge: number; dimensions: DimensionItem[];
  totalPcs: number; totalVolume: number; atPlace: string; signatureCarrier: string;
  executedDate: string;
  totalPrepaid1: number; totalPrepaid2: number;
}

interface OtherData {
  agentCode: string; agentName: string; subAgentCode: string; subAgentName: string;
  partnerCode: string; partnerName: string; airlineCode: string; airlineName: string;
  regionCode: string; countryCode: string; mrnNo: string; msn: string;
  lcNo: string; poNo: string; invValue: string; invNo: string;
  type: string; dc: string; ln: string; pc: string; inco: string;
  status: string;
  salesMan: string; inputStaff: string; branchCode: string;
  areaName: string; countryName: string;
  createdAt: string; updatedAt: string;
}

const initialMainData: MainData = {
  ioType: 'OUT', jobNo: '', bookingNo: '', mawbNo: '', hawbNo: '',
  obDate: '', arDate: '',
  shipperCode: '', shipperName: '', shipperAddress: '',
  consigneeCode: '', consigneeName: '', consigneeAddress: '', consigneeCopy: false,
  notifyCode: '', notifyName: '', notifyAddress: '', notifySameAs: false,
  currencyCode: 'USD', wtVal: 'C', otherChgs: 'C', chgsCode: '',
  departure: 'ICN', arrival: '', flightNo: '', flightDate: '', handlingInfo: '',
  bizType: '', consolType: 'CONSOL', exportType: 'EXPORT',
  salesType: '', paymentMethod: '',
  iataCode: '', accountNo: '', accountInfo: '', notNegotiable: '',
  dvCarriage: 'N.V.D', dvCustoms: '', amountInsurance: '',
  departureDate: '', departureTime: '', arrivalDate: '', arrivalTime: '',
  flightNo2: '', flightNo3: '',
  toByCode1: '', toByFlight1: '', toByCode2: '', toByFlight2: '', toByCode3: '', toByFlight3: '',
};

const initialCargoData: CargoData = {
  cargoItems: [], otherCharges: [], natureOfGoods: '', weightCharge: 0,
  dimensions: [], totalPcs: 0, totalVolume: 0, atPlace: '', signatureCarrier: '',
  executedDate: '', totalPrepaid1: 0, totalPrepaid2: 0,
};

const initialOtherData: OtherData = {
  agentCode: '', agentName: '', subAgentCode: '', subAgentName: '',
  partnerCode: '', partnerName: '', airlineCode: '', airlineName: '',
  regionCode: '', countryCode: '', mrnNo: '', msn: '',
  lcNo: '', poNo: '', invValue: '', invNo: '',
  type: '', dc: '', ln: '', pc: '', inco: '', status: 'DRAFT',
  salesMan: '', inputStaff: '', branchCode: '',
  areaName: '', countryName: '', createdAt: '', updatedAt: '',
};

/* ── Reusable Components ── */

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

function HouseAWBRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [activeTab, setActiveTab] = useState<TabType>('MAIN');
  const [mainData, setMainData] = useState<MainData>(initialMainData);
  const [cargoData, setCargoData] = useState<CargoData>(initialCargoData);
  const [otherData, setOtherData] = useState<OtherData>(initialOtherData);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showDimensionsModal, setShowDimensionsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isNewMode, setIsNewMode] = useState(!editId);
  const [showCodeSearchModal, setShowCodeSearchModal] = useState(false);
  const [searchModalType, setSearchModalType] = useState<CodeType>('customer');
  const [searchTargetCallback, setSearchTargetCallback] = useState<((item: CodeItem) => void) | null>(null);
  const [showStaffModal, setShowStaffModal] = useState(false);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (key: string) => setCollapsed(p => ({ ...p, [key]: !p[key] }));

  const openCodeSearchModal = (codeType: CodeType, callback: (item: CodeItem) => void) => {
    setSearchModalType(codeType); setSearchTargetCallback(() => callback); setShowCodeSearchModal(true);
  };
  const handleCodeSelect = (item: CodeItem) => { if (searchTargetCallback) searchTargetCallback(item); setShowCodeSearchModal(false); };
  const handleStaffSelect = (item: CodeItem) => { setOtherData(p => ({ ...p, inputStaff: item.name })); setShowStaffModal(false); };
  const handleConfirmClose = () => { setShowCloseModal(false); router.push('/logis/bl/air/house'); };
  useCloseConfirm({ showModal: showCloseModal, setShowModal: setShowCloseModal, onConfirmClose: handleConfirmClose });

  /* ── Data Load ── */
  useEffect(() => {
    if (!editId) return;
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/bl/air/house?id=${editId}`);
        if (!res.ok) return;
        const d = await res.json();
        const ds = (v: string | null) => v ? v.substring(0, 10) : '';
        setMainData({
          ioType: d.IO_TYPE || 'OUT', jobNo: d.JOB_NO || '', bookingNo: d.BOOKING_NO || '', mawbNo: d.MAWB_NO || '', hawbNo: d.HAWB_NO || '',
          obDate: ds(d.OB_DATE), arDate: ds(d.AR_DATE),
          shipperCode: d.SHIPPER_CODE || '', shipperName: d.SHIPPER_NAME || '', shipperAddress: d.SHIPPER_ADDRESS || '', consigneeCopy: false,
          consigneeCode: d.CONSIGNEE_CODE || '', consigneeName: d.CONSIGNEE_NAME || '', consigneeAddress: d.CONSIGNEE_ADDRESS || '',
          notifyCode: d.NOTIFY_CODE || '', notifyName: d.NOTIFY_NAME || '', notifyAddress: d.NOTIFY_ADDRESS || '', notifySameAs: false,
          currencyCode: d.CURRENCY || 'USD', wtVal: d.WT_VAL || 'C', otherChgs: d.OTHER_CHGS || 'C', chgsCode: d.CHGS_CODE || '',
          departure: d.DEPARTURE || '', arrival: d.ARRIVAL || '', flightNo: d.FLIGHT_NO || '', flightDate: ds(d.FLIGHT_DATE), handlingInfo: d.HANDLING_INFO || '',
          bizType: d.BIZ_TYPE || '', consolType: d.CONSOL_TYPE || 'CONSOL', exportType: d.EXPORT_TYPE || 'EXPORT',
          salesType: d.SALES_TYPE || '', paymentMethod: d.PAYMENT_METHOD || '',
          iataCode: d.IATA_CODE || '', accountNo: d.ACCOUNT_NO || '', accountInfo: d.ACCOUNT_INFO || '', notNegotiable: d.NOT_NEGOTIABLE || '',
          dvCarriage: d.DV_CARRIAGE || 'N.V.D', dvCustoms: d.DV_CUSTOMS || '', amountInsurance: d.AMOUNT_INSURANCE || '',
          departureDate: ds(d.DEPARTURE_DATE), departureTime: d.DEPARTURE_TIME || '',
          arrivalDate: ds(d.ARRIVAL_DATE), arrivalTime: d.ARRIVAL_TIME || '',
          flightNo2: d.FLIGHT_NO_2 || '', flightNo3: d.FLIGHT_NO_3 || '',
          toByCode1: ((d.TO_BY_CARRIER || '').split('/')[0]) || '', toByFlight1: ((d.TO_BY_CARRIER || '').split('/')[1]) || '',
          toByCode2: ((d.TO_BY_CARRIER || '').split('/')[2]) || '', toByFlight2: ((d.TO_BY_CARRIER || '').split('/')[3]) || '',
          toByCode3: ((d.TO_BY_CARRIER || '').split('/')[4]) || '', toByFlight3: ((d.TO_BY_CARRIER || '').split('/')[5]) || '',
        });
        setCargoData(prev => ({
          ...prev,
          natureOfGoods: d.NATURE_OF_GOODS || '', atPlace: d.AT_PLACE || '',
          totalVolume: parseFloat(d.DIMENSIONS_VOLUME) || 0,
        }));
        setOtherData({
          agentCode: d.AGENT_CODE || '', agentName: d.AGENT_NAME || '', subAgentCode: d.SUB_AGENT_CODE || '', subAgentName: d.SUB_AGENT_NAME || '',
          partnerCode: d.PARTNER_CODE || '', partnerName: d.PARTNER_NAME || '', airlineCode: d.AIRLINE_CODE || '', airlineName: d.AIRLINE_NAME || '',
          regionCode: d.REGION_CODE || '', countryCode: d.COUNTRY_CODE || '', mrnNo: d.MRN_NO || '', msn: d.MSN || '',
          lcNo: d.LC_NO || '', poNo: d.PO_NO || '', invValue: d.INV_VALUE || '', invNo: d.INV_NO || '',
          type: d.TYPE || '', dc: d.DC || '', ln: d.LN || '', pc: d.PC || '', inco: d.INCO || '', status: d.STATUS || 'DRAFT',
          salesMan: d.SALES_MAN || '', inputStaff: d.INPUT_STAFF || '', branchCode: d.BRANCH_CODE || '',
          areaName: d.AREA_NAME || '', countryName: d.COUNTRY_NAME || '',
          createdAt: d.CREATED_DTM || '', updatedAt: d.UPDATED_DTM || '',
        });
        setIsSaved(true);
        setIsNewMode(false);
      } catch (e) { console.error('Failed to fetch HAWB:', e); }
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

  const handleMainChange = (field: keyof MainData, value: string | boolean) => { setMainData(prev => ({ ...prev, [field]: value })); };
  const handleCargoChange = (field: keyof CargoData, value: unknown) => { setCargoData(prev => ({ ...prev, [field]: value })); };
  const handleOtherChange = (field: keyof OtherData, value: string | number) => { setOtherData(prev => ({ ...prev, [field]: value })); };

  /* ── Cargo Items CRUD ── */
  const addCargoItem = () => { setCargoData(prev => ({ ...prev, cargoItems: [...prev.cargoItems, { id: `C-${Date.now()}`, piecesRcp: 0, grossWeight: 0, weightUnit: 'K', rateClass: '', chargeableWeight: 0, rateCharge: 0, total: 0, asArranged: false }] })); };
  const removeCargoItem = (id: string) => { setCargoData(prev => ({ ...prev, cargoItems: prev.cargoItems.filter(c => c.id !== id) })); };
  const addOtherCharge = () => { setCargoData(prev => ({ ...prev, otherCharges: [...prev.otherCharges, { id: `OC-${Date.now()}`, codes: '', currency: 'USD', rate: 0, amount: 0, pc: 'P', ac: '' }] })); };
  const removeOtherCharge = (id: string) => { setCargoData(prev => ({ ...prev, otherCharges: prev.otherCharges.filter(c => c.id !== id) })); };
  const handleDimensionsApply = (dimensions: DimensionItem[], totalPcs: number, totalVolume: number) => { setCargoData(prev => ({ ...prev, dimensions, totalPcs, totalVolume })); };

  const totalGrossWeight = cargoData.cargoItems.reduce((s, i) => s + i.grossWeight, 0);
  const totalChargeableWeight = cargoData.cargoItems.reduce((s, i) => s + i.chargeableWeight, 0);
  const totalPieces = cargoData.cargoItems.reduce((s, i) => s + i.piecesRcp, 0);
  const totalCharge = cargoData.cargoItems.reduce((s, i) => s + i.total, 0);

  /* ── Save ── */
  const handleSave = async () => {
    if (!mainData.hawbNo) { alert('HAWB NO는 필수 입력값입니다.'); return; }
    setIsLoading(true);
    try {
      const payload = {
        ...(editId ? { ID: Number(editId) } : {}),
        IO_TYPE: mainData.ioType, MAWB_NO: mainData.mawbNo, HAWB_NO: mainData.hawbNo, BOOKING_NO: mainData.bookingNo,
        OB_DATE: mainData.obDate || null, AR_DATE: mainData.arDate || null,
        DEPARTURE: mainData.departure, ARRIVAL: mainData.arrival, FLIGHT_NO: mainData.flightNo, FLIGHT_DATE: mainData.flightDate || null,
        SHIPPER_CODE: mainData.shipperCode, SHIPPER_NAME: mainData.shipperName, SHIPPER_ADDRESS: mainData.shipperAddress,
        CONSIGNEE_CODE: mainData.consigneeCode, CONSIGNEE_NAME: mainData.consigneeName, CONSIGNEE_ADDRESS: mainData.consigneeAddress,
        NOTIFY_CODE: mainData.notifyCode, NOTIFY_NAME: mainData.notifyName, NOTIFY_ADDRESS: mainData.notifyAddress,
        CURRENCY: mainData.currencyCode, WT_VAL: mainData.wtVal, OTHER_CHGS: mainData.otherChgs, CHGS_CODE: mainData.chgsCode, HANDLING_INFO: mainData.handlingInfo,
        PIECES: totalPieces, GROSS_WEIGHT: totalGrossWeight, CHARGEABLE_WEIGHT: totalChargeableWeight,
        RATE_CLASS: cargoData.cargoItems[0]?.rateClass || null, COMMODITY: null,
        RATE_CHARGE: cargoData.cargoItems[0]?.rateCharge || 0, TOTAL_CHARGE: totalCharge,
        NATURE_OF_GOODS: cargoData.natureOfGoods, AT_PLACE: cargoData.atPlace, DIMENSIONS_VOLUME: cargoData.totalVolume,
        LC_NO: otherData.lcNo, PO_NO: otherData.poNo, INV_VALUE: otherData.invValue, INV_NO: otherData.invNo,
        TYPE: otherData.type, DC: otherData.dc, LN: otherData.ln, PC: otherData.pc, INCO: otherData.inco,
        AGENT_CODE: otherData.agentCode, AGENT_NAME: otherData.agentName, SUB_AGENT_CODE: otherData.subAgentCode, SUB_AGENT_NAME: otherData.subAgentName,
        PARTNER_CODE: otherData.partnerCode, PARTNER_NAME: otherData.partnerName, AIRLINE_CODE: otherData.airlineCode, AIRLINE_NAME: otherData.airlineName,
        REGION_CODE: otherData.regionCode, COUNTRY_CODE: otherData.countryCode, MRN_NO: otherData.mrnNo, MSN: otherData.msn, STATUS: otherData.status,
        BIZ_TYPE: mainData.bizType, CONSOL_TYPE: mainData.consolType, EXPORT_TYPE: mainData.exportType,
        SALES_TYPE: mainData.salesType, PAYMENT_METHOD: mainData.paymentMethod,
        IATA_CODE: mainData.iataCode, ACCOUNT_NO: mainData.accountNo, ACCOUNT_INFO: mainData.accountInfo, NOT_NEGOTIABLE: mainData.notNegotiable,
        DV_CARRIAGE: mainData.dvCarriage, DV_CUSTOMS: mainData.dvCustoms, AMOUNT_INSURANCE: mainData.amountInsurance,
        DEPARTURE_DATE: mainData.departureDate || null, DEPARTURE_TIME: mainData.departureTime,
        ARRIVAL_DATE: mainData.arrivalDate || null, ARRIVAL_TIME: mainData.arrivalTime,
        TO_BY_CARRIER: [mainData.toByCode1, mainData.toByFlight1, mainData.toByCode2, mainData.toByFlight2, mainData.toByCode3, mainData.toByFlight3].filter(Boolean).join('/'),
        FLIGHT_NO_2: mainData.flightNo2, FLIGHT_NO_3: mainData.flightNo3,
        SALES_MAN: otherData.salesMan, INPUT_STAFF: otherData.inputStaff, BRANCH_CODE: otherData.branchCode,
        AREA_NAME: otherData.areaName, COUNTRY_NAME: otherData.countryName,
      };
      const res = await fetch('/api/bl/air/house', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        const result = await res.json();
        if (!editId && result.JOB_NO) setMainData(prev => ({ ...prev, jobNo: result.JOB_NO }));
        setIsSaved(true);
        setIsNewMode(false);
        alert('저장되었습니다.');
        if (!editId && result.ID) router.replace(`/logis/bl/air/house/register?id=${result.ID}`);
      } else { const err = await res.json(); alert(err.error || '저장 실패'); }
    } catch (e) { console.error('Save error:', e); alert('저장 중 오류가 발생했습니다.'); }
    finally { setIsLoading(false); }
  };

  const handleCopyAWB = () => { if (!isSaved) { alert('저장 완료 후 복사 가능합니다.'); return; } setMainData(prev => ({ ...prev, jobNo: '', mawbNo: '', hawbNo: '' })); setIsSaved(false); alert('AWB가 복사되었습니다.'); };
  const handleNew = () => {
    if (editId) { router.push('/logis/bl/air/house/register'); return; }
    setMainData(initialMainData); setCargoData(initialCargoData); setOtherData(initialOtherData);
    setIsSaved(false); setIsNewMode(true);
  };
  const handleList = () => router.push('/logis/bl/air/house');

  /* ── MAIN TAB ── */
  const renderMainTab = () => (
    <div className="space-y-4">
      <div className="card">
        <SectionHeader title="Main Information" collapsed={!!collapsed['main']} onToggle={() => toggle('main')}
          icon={<svg className="w-5 h-5 text-[#E8A838]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
        {!collapsed['main'] && (
          <div className="p-4 space-y-4">
            {/* Row 1 */}
            <div className="grid grid-cols-6 gap-3">
              <div><label className="block text-xs font-medium mb-1">JOB NO</label><input type="text" value={mainData.jobNo} readOnly className={readonlyCls} placeholder="자동생성" /></div>
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

            {/* Row 2 */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">MAWB NO</label>
                <div className="flex gap-1">
                  <input type="text" value={mainData.mawbNo} onChange={e => handleMainChange('mawbNo', e.target.value)} className={`flex-1 ${inputCls}`} placeholder="000-00000000" />
                  <SearchIconButton onClick={() => {}} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">HAWB NO <span className="text-red-500">*</span></label>
                <input type="text" value={mainData.hawbNo} onChange={e => handleMainChange('hawbNo', e.target.value)} className={inputCls} placeholder="HAWB NO" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">BOOKING NO</label>
                <input type="text" value={mainData.bookingNo} onChange={e => handleMainChange('bookingNo', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">O/B Date</label>
                <input type="date" value={mainData.obDate} onChange={e => handleMainChange('obDate', e.target.value)} className={inputCls} />
              </div>
            </div>

            {/* Row 3: SHIPPER / CONSIGNEE / NOTIFY */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">SHIPPER</label>
                <div className="flex gap-1 mb-2">
                  <input type="text" value={mainData.shipperCode} onChange={e => handleMainChange('shipperCode', e.target.value)} className="w-24 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="코드" />
                  <input type="text" value={mainData.shipperName} onChange={e => handleMainChange('shipperName', e.target.value)} className={`flex-1 ${inputCls}`} placeholder="Shipper Name" />
                  <SearchIconButton onClick={() => openCodeSearchModal('customer', i => setMainData(p => ({ ...p, shipperCode: i.code, shipperName: i.name })))} />
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
                  <SearchIconButton onClick={() => openCodeSearchModal('customer', i => setMainData(p => ({ ...p, consigneeCode: i.code, consigneeName: i.name })))} />
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
                  <SearchIconButton onClick={() => openCodeSearchModal('customer', i => setMainData(p => ({ ...p, notifyCode: i.code, notifyName: i.name })))} />
                </div>
                <textarea value={mainData.notifyAddress} onChange={e => handleMainChange('notifyAddress', e.target.value)} rows={3} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm resize-none" placeholder="Address" disabled={mainData.notifySameAs} />
              </div>
            </div>

            {/* Row 4: IATA / ACCOUNT NO */}
            <div className="grid grid-cols-3 gap-3">
              <div><label className="block text-xs font-medium mb-1">IATA CODE</label><input type="text" value={mainData.iataCode} onChange={e => handleMainChange('iataCode', e.target.value)} className={inputCls} /></div>
              <div><label className="block text-xs font-medium mb-1">ACCOUNT NO</label><input type="text" value={mainData.accountNo} onChange={e => handleMainChange('accountNo', e.target.value)} className={inputCls} /></div>
              <div />
            </div>

            {/* Row 5 */}
            <div className="grid grid-cols-6 gap-3">
              <div><label className="block text-xs font-medium mb-1">ACCOUNT INFO</label><div className={`${readonlyCls} pt-2`}>{mainData.accountInfo || '-'}</div></div>
              <div>
                <label className="block text-xs font-medium mb-1">CUR</label>
                <select value={mainData.currencyCode} onChange={e => handleMainChange('currencyCode', e.target.value)} className={selectCls}>
                  <option value="USD">USD</option><option value="KRW">KRW</option><option value="EUR">EUR</option><option value="JPY">JPY</option>
                </select>
              </div>
              <div><label className="block text-xs font-medium mb-1">CHGS CODE</label><input type="text" value={mainData.chgsCode} onChange={e => handleMainChange('chgsCode', e.target.value)} className={inputCls} /></div>
              <div>
                <label className="block text-xs font-medium mb-1">WT/VAL</label>
                <div className="flex gap-3 pt-2">{['P', 'C'].map(v => <label key={v} className="flex items-center gap-1"><input type="radio" name="wtVal" value={v} checked={mainData.wtVal === v} onChange={e => handleMainChange('wtVal', e.target.value)} /><span className="text-sm">{v}</span></label>)}</div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">OTHER</label>
                <div className="flex gap-3 pt-2">{['P', 'C'].map(v => <label key={v} className="flex items-center gap-1"><input type="radio" name="otherChgs" value={v} checked={mainData.otherChgs === v} onChange={e => handleMainChange('otherChgs', e.target.value)} /><span className="text-sm">{v}</span></label>)}</div>
              </div>
              <div><label className="block text-xs font-medium mb-1">Not negotiable</label><div className="flex gap-1"><input type="text" value={mainData.notNegotiable} onChange={e => handleMainChange('notNegotiable', e.target.value)} className={`flex-1 ${inputCls}`} /><SearchIconButton onClick={() => {}} /></div></div>
            </div>

            {/* Row 6 */}
            <div className="grid grid-cols-4 gap-3">
              <div><label className="block text-xs font-medium mb-1">D.V CARRIAGE</label><input type="text" value={mainData.dvCarriage} onChange={e => handleMainChange('dvCarriage', e.target.value)} className={inputCls} /></div>
              <div><label className="block text-xs font-medium mb-1">DV.CUSTOMS</label><input type="text" value={mainData.dvCustoms} onChange={e => handleMainChange('dvCustoms', e.target.value)} className={inputCls} /></div>
              <div><label className="block text-xs font-medium mb-1">Amount of Insurance</label><input type="text" value={mainData.amountInsurance} onChange={e => handleMainChange('amountInsurance', e.target.value)} className={inputCls} /></div>
              <div className="flex items-end"><span className="text-xs text-[var(--muted)] pb-2">INSURANCE - If carrier offers no coverage, &quot;NIL&quot;</span></div>
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
            <div className="flex gap-3 items-end">
              <div className="w-48">
                <label className="block text-xs font-medium mb-1">AIRPORT OF DEPARTURE</label>
                <div className="flex gap-1">
                  <input type="text" value={mainData.departure} onChange={e => handleMainChange('departure', e.target.value.toUpperCase())} className={`flex-1 ${inputCls} font-mono`} placeholder="ICN" maxLength={5} />
                  <SearchIconButton onClick={() => openCodeSearchModal('airport', i => setMainData(p => ({ ...p, departure: i.code })))} />
                </div>
              </div>
              <div className="w-36"><label className="block text-xs font-medium mb-1">DEPARTURE DATE</label><input type="date" value={mainData.departureDate} onChange={e => handleMainChange('departureDate', e.target.value)} className={inputCls} /></div>
              <div className="w-28"><label className="block text-xs font-medium mb-1">TIME</label><input type="time" value={mainData.departureTime} onChange={e => handleMainChange('departureTime', e.target.value)} className={inputCls} /></div>
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
            <div className="flex gap-3 items-end">
              <div className="w-48">
                <label className="block text-xs font-medium mb-1">AIRPORT OF ARRIVAL</label>
                <div className="flex gap-1">
                  <input type="text" value={mainData.arrival} onChange={e => handleMainChange('arrival', e.target.value.toUpperCase())} className={`flex-1 ${inputCls} font-mono`} placeholder="LAX" maxLength={5} />
                  <SearchIconButton onClick={() => openCodeSearchModal('airport', i => setMainData(p => ({ ...p, arrival: i.code })))} />
                </div>
              </div>
              <div className="w-36"><label className="block text-xs font-medium mb-1">ARRIVAL DATE</label><input type="date" value={mainData.arrivalDate} onChange={e => handleMainChange('arrivalDate', e.target.value)} className={inputCls} /></div>
              <div className="w-28"><label className="block text-xs font-medium mb-1">TIME</label><input type="time" value={mainData.arrivalTime} onChange={e => handleMainChange('arrivalTime', e.target.value)} className={inputCls} /></div>
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
            <div className="grid grid-cols-6 gap-3">
              <div><label className="block text-xs font-medium mb-1">Flight Date</label><input type="date" value={mainData.flightDate} onChange={e => handleMainChange('flightDate', e.target.value)} className={inputCls} /></div>
              <div><label className="block text-xs font-medium mb-1">A/R Date</label><input type="date" value={mainData.arDate} onChange={e => handleMainChange('arDate', e.target.value)} className={inputCls} /></div>
              <div className="col-span-3">
                <label className="block text-xs font-medium mb-1">HANDLING INFORMATION</label>
                <div className="flex gap-1"><input type="text" value={mainData.handlingInfo} onChange={e => handleMainChange('handlingInfo', e.target.value)} className={`flex-1 ${inputCls}`} /><SearchIconButton onClick={() => {}} /></div>
              </div>
              <div><label className="block text-xs font-medium mb-1">DV.CUSTOMS</label><input type="text" value={mainData.dvCustoms} onChange={e => handleMainChange('dvCustoms', e.target.value)} className={inputCls} /></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  /* ── CARGO TAB ── */
  const renderCargoTab = () => (
    <div className="space-y-4">
      {/* Cargo Items + Nature 가로 배치 */}
      <div className="card">
        <SectionHeader title="Cargo Information" collapsed={!!collapsed['cargo']} onToggle={() => toggle('cargo')}
          icon={<svg className="w-5 h-5 text-[#E8A838]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>} />
        {!collapsed['cargo'] && (
          <div className="p-4 space-y-4">
            <div className="flex gap-4">
              {/* 좌: Cargo Items Table (~60%) */}
              <div className="w-[60%]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium">Cargo Items</span>
                  <button type="button" onClick={addCargoItem} className="px-3 py-1 text-sm bg-[#E8A838] text-white rounded hover:bg-[#d99a2f]">추가</button>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="p-1 text-center w-8"></th><th className="p-1 text-center">Pieces</th><th className="p-1 text-center">GrossWt</th><th className="p-1 text-center">Kg/lb</th><th className="p-1 text-center">Rate Class</th><th className="p-1 text-center">Chg Wt</th><th className="p-1 text-center">Rate/Chg</th><th className="p-1 text-center">Total</th><th className="p-1 text-center w-8">AA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cargoData.cargoItems.length === 0 ? (
                      <tr><td colSpan={9} className="p-3 text-center text-[var(--muted)] text-xs">Cargo 정보가 없습니다.</td></tr>
                    ) : cargoData.cargoItems.map((item, idx) => (
                      <tr key={item.id} className="border-b border-[var(--border)]">
                        <td className="p-1 text-center"><button type="button" onClick={() => removeCargoItem(item.id)} className="text-red-400 hover:text-red-500"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></td>
                        <td className="p-1"><input type="number" value={item.piecesRcp} onChange={e => { const u = [...cargoData.cargoItems]; u[idx].piecesRcp = parseInt(e.target.value) || 0; handleCargoChange('cargoItems', u); }} className="w-full px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-xs text-right" /></td>
                        <td className="p-1"><input type="number" step="0.01" value={item.grossWeight} onChange={e => { const u = [...cargoData.cargoItems]; u[idx].grossWeight = parseFloat(e.target.value) || 0; handleCargoChange('cargoItems', u); }} className="w-full px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-xs text-right" /></td>
                        <td className="p-1"><select value={item.weightUnit} onChange={e => { const u = [...cargoData.cargoItems]; u[idx].weightUnit = e.target.value; handleCargoChange('cargoItems', u); }} className="w-full px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-xs"><option value="K">K</option><option value="L">L</option></select></td>
                        <td className="p-1"><input type="text" value={item.rateClass} onChange={e => { const u = [...cargoData.cargoItems]; u[idx].rateClass = e.target.value; handleCargoChange('cargoItems', u); }} className="w-full px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-xs" /></td>
                        <td className="p-1"><input type="number" step="0.01" value={item.chargeableWeight} onChange={e => { const u = [...cargoData.cargoItems]; u[idx].chargeableWeight = parseFloat(e.target.value) || 0; handleCargoChange('cargoItems', u); }} className="w-full px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-xs text-right" /></td>
                        <td className="p-1"><input type="number" step="0.01" value={item.rateCharge} onChange={e => { const u = [...cargoData.cargoItems]; u[idx].rateCharge = parseFloat(e.target.value) || 0; u[idx].total = u[idx].chargeableWeight * u[idx].rateCharge; handleCargoChange('cargoItems', u); }} className="w-full px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-xs text-right" /></td>
                        <td className="p-1"><input type="text" value={formatCurrency(item.total)} readOnly className="w-full px-1 py-1 bg-[var(--surface-200)] border border-[var(--border)] rounded text-xs text-right" /></td>
                        <td className="p-1 text-center"><input type="checkbox" checked={item.asArranged} onChange={e => { const u = [...cargoData.cargoItems]; u[idx].asArranged = e.target.checked; handleCargoChange('cargoItems', u); }} className="rounded" /></td>
                      </tr>
                    ))}
                    {cargoData.cargoItems.length > 0 && (
                      <tr className="border-t-2 border-[var(--border)] bg-[var(--surface-50)] font-medium text-xs">
                        <td className="p-1 text-center">합계</td>
                        <td className="p-1 text-right">{totalPieces}</td>
                        <td className="p-1 text-right">{totalGrossWeight.toFixed(2)}</td>
                        <td className="p-1"></td><td className="p-1"></td>
                        <td className="p-1 text-right">{totalChargeableWeight.toFixed(2)}</td>
                        <td className="p-1"></td>
                        <td className="p-1 text-right font-bold text-[#E8A838]">{formatCurrency(totalCharge)}</td>
                        <td className="p-1"></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* 우: Nature of Goods + Dimensions (~40%) */}
              <div className="w-[40%] space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Nature and Quantity of Goods (incl. Dimensions)</label>
                  <textarea value={cargoData.natureOfGoods} onChange={e => handleCargoChange('natureOfGoods', e.target.value)} rows={5} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm resize-none" placeholder="Description of Goods" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium">Dimensions</label>
                    <button type="button" onClick={() => setShowDimensionsModal(true)} className="px-3 py-1 text-xs bg-[#E8A838] text-white rounded hover:bg-[#d99a2f]">Dimensions 계산</button>
                  </div>
                  <div className="p-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-[var(--muted)] text-xs">Total PCS:</span><span className="ml-2 font-medium text-xs">{cargoData.totalPcs}</span></div>
                      <div><span className="text-[var(--muted)] text-xs">Total Volume:</span><span className="ml-2 font-medium text-xs">{cargoData.totalVolume.toFixed(3)} CBM</span></div>
                    </div>
                    {cargoData.dimensions.length > 0 && <div className="mt-2 pt-2 border-t border-[var(--border)]"><p className="text-xs text-[var(--muted)]">{cargoData.dimensions.length}개 항목</p></div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Weight Charge + Other Charges 가로 배치 */}
      <div className="card">
        <div className="p-4">
          <div className="flex gap-4">
            <div className="w-[30%] space-y-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-[#E8A838]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                Weight Charge
              </h3>
              <div>
                <label className="block text-xs font-medium mb-1">Weight Charge</label>
                <input type="number" step="0.01" value={cargoData.weightCharge} onChange={e => handleCargoChange('weightCharge', parseFloat(e.target.value) || 0)} className={numCls} />
              </div>
            </div>

            <div className="w-[70%]">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#E8A838]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Other Charges
                </h3>
                <div className="flex gap-2">
                  <button type="button" onClick={addOtherCharge} className="px-3 py-1 text-sm bg-[#E8A838] text-white rounded hover:bg-[#d99a2f]">추가</button>
                  <button type="button" onClick={() => { const last = cargoData.otherCharges[cargoData.otherCharges.length - 1]; if (last) removeOtherCharge(last.id); }} disabled={cargoData.otherCharges.length === 0} className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed">삭제</button>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="p-2 text-left">Codes</th><th className="p-2 text-left">CUR</th><th className="p-2 text-right">Rate</th><th className="p-2 text-right">Amount</th><th className="p-2 text-center">P/C</th><th className="p-2 text-center">A/C</th><th className="p-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {cargoData.otherCharges.length === 0 ? (
                    <tr><td colSpan={7} className="p-4 text-center text-[var(--muted)] text-sm">운임 정보가 없습니다.</td></tr>
                  ) : cargoData.otherCharges.map((ch, idx) => (
                    <tr key={ch.id} className="border-b border-[var(--border)]">
                      <td className="p-1"><div className="flex gap-1"><input type="text" value={ch.codes} onChange={e => { const u = [...cargoData.otherCharges]; u[idx].codes = e.target.value; handleCargoChange('otherCharges', u); }} className={inputCls} /><SearchIconButton onClick={() => openCodeSearchModal('freightBase', i => { const u = [...cargoData.otherCharges]; u[idx].codes = i.code; handleCargoChange('otherCharges', u); })} /></div></td>
                      <td className="p-1"><select value={ch.currency} onChange={e => { const u = [...cargoData.otherCharges]; u[idx].currency = e.target.value; handleCargoChange('otherCharges', u); }} className={selectCls}><option value="USD">USD</option><option value="KRW">KRW</option><option value="EUR">EUR</option><option value="JPY">JPY</option></select></td>
                      <td className="p-1"><input type="number" step="0.01" value={ch.rate} onChange={e => { const u = [...cargoData.otherCharges]; u[idx].rate = parseFloat(e.target.value) || 0; handleCargoChange('otherCharges', u); }} className={numCls} /></td>
                      <td className="p-1"><input type="number" step="0.01" value={ch.amount} onChange={e => { const u = [...cargoData.otherCharges]; u[idx].amount = parseFloat(e.target.value) || 0; handleCargoChange('otherCharges', u); }} className={numCls} /></td>
                      <td className="p-1"><select value={ch.pc} onChange={e => { const u = [...cargoData.otherCharges]; u[idx].pc = e.target.value; handleCargoChange('otherCharges', u); }} className={selectCls}><option value="P">P</option><option value="C">C</option></select></td>
                      <td className="p-1"><input type="text" value={ch.ac} onChange={e => { const u = [...cargoData.otherCharges]; u[idx].ac = e.target.value; handleCargoChange('otherCharges', u); }} className={`${inputCls} text-center`} /></td>
                      <td className="p-1 text-center"><button type="button" onClick={() => removeOtherCharge(ch.id)} className="text-red-400 hover:text-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button></td>
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

      {/* Console Info (Cargo) */}
      <div className="card">
        <SectionHeader title="Console Information" collapsed={!!collapsed['cargoConsole']} onToggle={() => toggle('cargoConsole')}
          icon={<svg className="w-5 h-5 text-[#E8A838]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} />
        {!collapsed['cargoConsole'] && (
          <div className="p-4">
            <div className="grid grid-cols-6 gap-3">
              <div><label className="block text-xs font-medium mb-1">Total Prepaid (1)</label><input type="number" step="0.01" value={cargoData.totalPrepaid1} onChange={e => handleCargoChange('totalPrepaid1', parseFloat(e.target.value) || 0)} className={numCls} /></div>
              <div><label className="block text-xs font-medium mb-1">Total Prepaid (2)</label><input type="number" step="0.01" value={cargoData.totalPrepaid2} onChange={e => handleCargoChange('totalPrepaid2', parseFloat(e.target.value) || 0)} className={numCls} /></div>
              <div><label className="block text-xs font-medium mb-1">Executed on (Date)</label><input type="date" value={cargoData.executedDate} onChange={e => handleCargoChange('executedDate', e.target.value)} className={inputCls} /></div>
              <div><label className="block text-xs font-medium mb-1">At (Place)</label><div className="flex gap-1"><input type="text" value={cargoData.atPlace} onChange={e => handleCargoChange('atPlace', e.target.value)} className={`flex-1 ${inputCls}`} /><SearchIconButton onClick={() => openCodeSearchModal('airport', i => handleCargoChange('atPlace', i.code))} /></div></div>
              <div className="col-span-2"><label className="block text-xs font-medium mb-1">Signature of Issuing Carrier</label><input type="text" value={cargoData.signatureCarrier} onChange={e => handleCargoChange('signatureCarrier', e.target.value)} className={inputCls} /></div>
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
            <div className="grid grid-cols-3 gap-3">
              <div><label className="block text-xs font-medium mb-1">AGENT CODE</label><div className="flex gap-1"><input type="text" value={otherData.agentCode} onChange={e => handleOtherChange('agentCode', e.target.value)} className="w-24 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="코드" /><input type="text" value={otherData.agentName} onChange={e => handleOtherChange('agentName', e.target.value)} className={`flex-1 ${inputCls}`} placeholder="상호" /><SearchIconButton onClick={() => openCodeSearchModal('customer', i => setOtherData(p => ({ ...p, agentCode: i.code, agentName: i.name })))} /></div></div>
              <div><label className="block text-xs font-medium mb-1">SUB AGENT</label><div className="flex gap-1"><input type="text" value={otherData.subAgentCode} onChange={e => handleOtherChange('subAgentCode', e.target.value)} className="w-24 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="코드" /><input type="text" value={otherData.subAgentName} onChange={e => handleOtherChange('subAgentName', e.target.value)} className={`flex-1 ${inputCls}`} placeholder="상호" /><SearchIconButton onClick={() => openCodeSearchModal('customer', i => setOtherData(p => ({ ...p, subAgentCode: i.code, subAgentName: i.name })))} /></div></div>
              <div><label className="block text-xs font-medium mb-1">PARTNER</label><div className="flex gap-1"><input type="text" value={otherData.partnerCode} onChange={e => handleOtherChange('partnerCode', e.target.value)} className="w-24 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="코드" /><input type="text" value={otherData.partnerName} onChange={e => handleOtherChange('partnerName', e.target.value)} className={`flex-1 ${inputCls}`} placeholder="이름" /><SearchIconButton onClick={() => openCodeSearchModal('customer', i => setOtherData(p => ({ ...p, partnerCode: i.code, partnerName: i.name })))} /></div></div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">AIRLINES</label>
                <div className="flex gap-1">
                  <input type="text" value={otherData.airlineCode} onChange={e => handleOtherChange('airlineCode', e.target.value)} className="w-20 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="코드" />
                  <input type="text" value={otherData.airlineName} onChange={e => handleOtherChange('airlineName', e.target.value)} className={`flex-1 ${inputCls}`} placeholder="이름" />
                  <SearchIconButton onClick={() => openCodeSearchModal('airline', i => setOtherData(p => ({ ...p, airlineCode: i.code, airlineName: i.name })))} />
                </div>
              </div>
              <div><label className="block text-xs font-medium mb-1">영업사원</label><input type="text" value={otherData.salesMan} onChange={e => handleOtherChange('salesMan', e.target.value)} className={inputCls} /></div>
              <div><label className="block text-xs font-medium mb-1">입력사원</label><div className="flex gap-1"><input type="text" value={otherData.inputStaff} onChange={e => handleOtherChange('inputStaff', e.target.value)} className={`flex-1 ${inputCls}`} /><SearchIconButton onClick={() => setShowStaffModal(true)} /></div></div>
              <div><label className="block text-xs font-medium mb-1">분/지사</label><input type="text" value={otherData.branchCode} onChange={e => handleOtherChange('branchCode', e.target.value)} className={inputCls} /></div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div><label className="block text-xs font-medium mb-1">AREA</label><div className="flex gap-1"><input type="text" value={otherData.areaName} onChange={e => handleOtherChange('areaName', e.target.value)} className={`flex-1 ${inputCls}`} /><SearchIconButton onClick={() => openCodeSearchModal('region', i => setOtherData(p => ({ ...p, regionCode: i.code, areaName: i.name })))} /></div></div>
              <div><label className="block text-xs font-medium mb-1">COUNTRY</label><div className="flex gap-1"><input type="text" value={otherData.countryName} onChange={e => handleOtherChange('countryName', e.target.value)} className={`flex-1 ${inputCls}`} /><SearchIconButton onClick={() => openCodeSearchModal('country', i => setOtherData(p => ({ ...p, countryCode: i.code, countryName: i.name })))} /></div></div>
              <div><label className="block text-xs font-medium mb-1">MRN NO</label><input type="text" value={otherData.mrnNo} onChange={e => handleOtherChange('mrnNo', e.target.value)} className={inputCls} /></div>
              <div><label className="block text-xs font-medium mb-1">MSN</label><input type="text" value={otherData.msn} onChange={e => handleOtherChange('msn', e.target.value)} className={inputCls} /></div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div><label className="block text-xs font-medium mb-1">L/C NO</label><input type="text" value={otherData.lcNo} onChange={e => handleOtherChange('lcNo', e.target.value)} className={inputCls} /></div>
              <div><label className="block text-xs font-medium mb-1">P/O NO</label><input type="text" value={otherData.poNo} onChange={e => handleOtherChange('poNo', e.target.value)} className={inputCls} /></div>
              <div><label className="block text-xs font-medium mb-1">INV VALUE</label><input type="text" value={otherData.invValue} onChange={e => handleOtherChange('invValue', e.target.value)} className={inputCls} /></div>
              <div><label className="block text-xs font-medium mb-1">INV NO</label><input type="text" value={otherData.invNo} onChange={e => handleOtherChange('invNo', e.target.value)} className={inputCls} /></div>
            </div>

            <div className="grid grid-cols-6 gap-3">
              <div><label className="block text-xs font-medium mb-1">TYPE</label><input type="text" value={otherData.type} onChange={e => handleOtherChange('type', e.target.value)} className={inputCls} /></div>
              <div><label className="block text-xs font-medium mb-1">D/C</label><input type="text" value={otherData.dc} onChange={e => handleOtherChange('dc', e.target.value)} className={inputCls} /></div>
              <div><label className="block text-xs font-medium mb-1">L/N</label><input type="text" value={otherData.ln} onChange={e => handleOtherChange('ln', e.target.value)} className={inputCls} /></div>
              <div><label className="block text-xs font-medium mb-1">P/C</label><input type="text" value={otherData.pc} onChange={e => handleOtherChange('pc', e.target.value)} className={inputCls} /></div>
              <div><label className="block text-xs font-medium mb-1">INCO</label><input type="text" value={otherData.inco} onChange={e => handleOtherChange('inco', e.target.value)} className={inputCls} /></div>
              <div><label className="block text-xs font-medium mb-1">상태</label><select value={otherData.status} onChange={e => handleOtherChange('status', e.target.value)} className={selectCls}><option value="DRAFT">작성중</option><option value="CONFIRMED">확정</option><option value="SENT">전송완료</option></select></div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-[var(--muted)]">최초등록일</label>
                <div className="flex gap-1">
                  <select className="w-16 h-[38px] px-2 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm" disabled><option value="Y">Y</option><option value="V">V</option></select>
                  <input type="date" value={otherData.createdAt ? otherData.createdAt.substring(0, 10) : ''} readOnly className={`flex-1 ${readonlyCls}`} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-[var(--muted)]">최종수정일</label>
                <div className="flex gap-1">
                  <select className="w-16 h-[38px] px-2 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm" disabled><option value="Y">Y</option><option value="V">V</option></select>
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
      <Header title={editId ? "House AWB 수정" : "House AWB 등록"} subtitle="HOME > 항공수출 > House AWB 관리 > 등록" onClose={() => setShowCloseModal(true)} />
      <main className="p-6">
        <div className="sticky top-0 z-20 bg-white py-2 -mx-6 px-6 border-b border-gray-200 flex justify-end items-center mb-4 gap-2">
          <button onClick={handleNew} disabled={isNewMode} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed">신규</button>
          <button onClick={handleCopyAWB} disabled={!isSaved} className={`px-4 py-2 rounded-lg font-medium ${isSaved ? 'bg-[var(--surface-100)] border border-[var(--border)] hover:bg-[var(--surface-200)]' : 'bg-[var(--surface-200)] text-[var(--muted)] cursor-not-allowed'}`}>AWB 복사</button>
          <div className="w-px h-8 bg-[var(--border)]" />
          <button onClick={handleList} className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">목록</button>
          <button onClick={handleSave} disabled={isLoading} className="px-6 py-2 bg-[#E8A838] text-[#0C1222] font-semibold rounded-lg hover:bg-[#D4943A] disabled:opacity-50">{isLoading ? '저장중...' : '저장'}</button>
        </div>

        <div className="flex gap-1 border-b border-[var(--border)] mb-4">
          {(['MAIN', 'CARGO', 'OTHER'] as TabType[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-2 px-6 py-3 font-medium rounded-t-lg transition-colors ${activeTab === tab ? 'bg-[#E8A838] text-white' : 'bg-[var(--surface-100)] text-[var(--muted)] hover:bg-[var(--surface-200)] hover:text-[var(--foreground)]'}`}>{tab}</button>
          ))}
        </div>

        {renderTabContent()}
      </main>
      <CloseConfirmModal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} onConfirm={handleConfirmClose} />
      <DimensionsCalcModal isOpen={showDimensionsModal} onClose={() => setShowDimensionsModal(false)} onApply={handleDimensionsApply} initialData={cargoData.dimensions} />
      <CodeSearchModal isOpen={showCodeSearchModal} onClose={() => setShowCodeSearchModal(false)} onSelect={handleCodeSelect} codeType={searchModalType} />
      <CodeSearchModal isOpen={showStaffModal} onClose={() => setShowStaffModal(false)} onSelect={handleStaffSelect} codeType="manager" title="입력사원 조회" />
    </div>
  );
}

export default function HouseAWBRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)] flex items-center justify-center">Loading...</div>}>
      <HouseAWBRegisterContent />
    </Suspense>
  );
}
