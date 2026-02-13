'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import DimensionsCalcModal from '@/components/popup/DimensionsCalcModal';
import CodeSearchModal, { CodeType, CodeItem } from '@/components/popup/CodeSearchModal';
import { formatCurrency } from '@/utils/format';

type TabType = 'MAIN' | 'CARGO' | 'OTHER';

interface DimensionItem { id: string; print: boolean; width: number; length: number; height: number; pcs: number; volume: number; }
interface CargoItem { id: string; piecesRcp: number; grossWeight: number; weightUnit: string; rateClass: string; chargeableWeight: number; rateCharge: number; total: number; asArranged: boolean; }
interface OtherCharge { id: string; codes: string; currency: string; rate: number; amount: number; pc: string; ac: string; }

interface MainData {
  ioType: string; jobNo: string; bookingNo: string; mawbNo: string; hawbNo: string;
  obDate: string; arDate: string;
  shipperCode: string; shipperName: string; shipperAddress: string;
  consigneeCode: string; consigneeName: string; consigneeAddress: string; consigneeCopy: boolean;
  notifyCode: string; notifyName: string; notifyAddress: string; notifySameAs: boolean;
  currencyCode: string; wtVal: string; otherChgs: string; chgsCode: string;
  departure: string; arrival: string; flightNo: string; flightDate: string; handlingInfo: string;
}

interface CargoData {
  cargoItems: CargoItem[]; otherCharges: OtherCharge[];
  natureOfGoods: string; weightCharge: number; dimensions: DimensionItem[];
  totalPcs: number; totalVolume: number; atPlace: string; signatureCarrier: string;
}

interface OtherData {
  agentCode: string; agentName: string; subAgentCode: string; subAgentName: string;
  partnerCode: string; partnerName: string; airlineCode: string; airlineName: string;
  regionCode: string; countryCode: string; mrnNo: string; msn: string;
  lcNo: string; poNo: string; invValue: string; invNo: string;
  type: string; dc: string; ln: string; pc: string; inco: string;
  status: string;
}

const initialMainData: MainData = {
  ioType: 'IN', jobNo: '', bookingNo: '', mawbNo: '', hawbNo: '',
  obDate: '', arDate: '',
  shipperCode: '', shipperName: '', shipperAddress: '',
  consigneeCode: '', consigneeName: '', consigneeAddress: '', consigneeCopy: false,
  notifyCode: '', notifyName: '', notifyAddress: '', notifySameAs: false,
  currencyCode: 'USD', wtVal: 'C', otherChgs: 'C', chgsCode: '',
  departure: '', arrival: 'ICN', flightNo: '', flightDate: '', handlingInfo: '',
};

const initialCargoData: CargoData = { cargoItems: [], otherCharges: [], natureOfGoods: '', weightCharge: 0, dimensions: [], totalPcs: 0, totalVolume: 0, atPlace: '', signatureCarrier: '' };
const initialOtherData: OtherData = {
  agentCode: '', agentName: '', subAgentCode: '', subAgentName: '',
  partnerCode: '', partnerName: '', airlineCode: '', airlineName: '',
  regionCode: '', countryCode: '', mrnNo: '', msn: '',
  lcNo: '', poNo: '', invValue: '', invNo: '',
  type: '', dc: '', ln: '', pc: '', inco: '', status: 'DRAFT',
};

function ImportHouseAWBRegisterContent() {
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
  const [showCodeSearchModal, setShowCodeSearchModal] = useState(false);
  const [searchModalType, setSearchModalType] = useState<CodeType>('customer');
  const [searchTargetCallback, setSearchTargetCallback] = useState<((item: CodeItem) => void) | null>(null);

  const openCodeSearchModal = (codeType: CodeType, callback: (item: CodeItem) => void) => {
    setSearchModalType(codeType); setSearchTargetCallback(() => callback); setShowCodeSearchModal(true);
  };
  const handleCodeSelect = (item: CodeItem) => { if (searchTargetCallback) searchTargetCallback(item); setShowCodeSearchModal(false); };
  const handleConfirmClose = () => { setShowCloseModal(false); router.push('/logis/import-bl/air/house'); };
  useCloseConfirm({ showModal: showCloseModal, setShowModal: setShowCloseModal, onConfirmClose: handleConfirmClose });

  useEffect(() => {
    if (editId) {
      (async () => {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/bl/air/house?id=${editId}`);
          if (res.ok) {
            const d = await res.json();
            setMainData({
              ioType: d.IO_TYPE || 'IN', jobNo: d.JOB_NO || '', bookingNo: d.BOOKING_NO || '', mawbNo: d.MAWB_NO || '', hawbNo: d.HAWB_NO || '',
              obDate: d.OB_DATE ? d.OB_DATE.substring(0, 10) : '', arDate: d.AR_DATE ? d.AR_DATE.substring(0, 10) : '',
              shipperCode: d.SHIPPER_CODE || '', shipperName: d.SHIPPER_NAME || '', shipperAddress: d.SHIPPER_ADDRESS || '',
              consigneeCode: d.CONSIGNEE_CODE || '', consigneeName: d.CONSIGNEE_NAME || '', consigneeAddress: d.CONSIGNEE_ADDRESS || '', consigneeCopy: false,
              notifyCode: d.NOTIFY_CODE || '', notifyName: d.NOTIFY_NAME || '', notifyAddress: d.NOTIFY_ADDRESS || '', notifySameAs: false,
              currencyCode: d.CURRENCY || 'USD', wtVal: d.WT_VAL || 'C', otherChgs: d.OTHER_CHGS || 'C', chgsCode: d.CHGS_CODE || '',
              departure: d.DEPARTURE || '', arrival: d.ARRIVAL || '', flightNo: d.FLIGHT_NO || '', flightDate: d.FLIGHT_DATE ? d.FLIGHT_DATE.substring(0, 10) : '', handlingInfo: d.HANDLING_INFO || '',
            });
            setCargoData(prev => ({
              ...prev,
              natureOfGoods: d.NATURE_OF_GOODS || '', atPlace: d.AT_PLACE || '',
              totalVolume: d.DIMENSIONS_VOLUME || 0,
            }));
            setOtherData({
              agentCode: d.AGENT_CODE || '', agentName: d.AGENT_NAME || '', subAgentCode: d.SUB_AGENT_CODE || '', subAgentName: d.SUB_AGENT_NAME || '',
              partnerCode: d.PARTNER_CODE || '', partnerName: d.PARTNER_NAME || '', airlineCode: d.AIRLINE_CODE || '', airlineName: d.AIRLINE_NAME || '',
              regionCode: d.REGION_CODE || '', countryCode: d.COUNTRY_CODE || '', mrnNo: d.MRN_NO || '', msn: d.MSN || '',
              lcNo: d.LC_NO || '', poNo: d.PO_NO || '', invValue: d.INV_VALUE || '', invNo: d.INV_NO || '',
              type: d.TYPE || '', dc: d.DC || '', ln: d.LN || '', pc: d.PC || '', inco: d.INCO || '', status: d.STATUS || 'DRAFT',
            });
            setIsSaved(true);
          }
        } catch (e) { console.error('Failed to fetch HAWB:', e); }
        finally { setIsLoading(false); }
      })();
    }
  }, [editId]);

  useEffect(() => {
    if (mainData.currencyCode === 'KRW') setMainData(prev => ({ ...prev, wtVal: 'P', otherChgs: 'P' }));
    else setMainData(prev => ({ ...prev, wtVal: 'C', otherChgs: 'C' }));
  }, [mainData.currencyCode]);

  useEffect(() => {
    if (mainData.consigneeCopy) setMainData(prev => ({ ...prev, consigneeName: prev.shipperName, consigneeAddress: prev.shipperAddress }));
  }, [mainData.consigneeCopy, mainData.shipperName, mainData.shipperAddress]);

  useEffect(() => {
    if (mainData.notifySameAs) setMainData(prev => ({ ...prev, notifyCode: '', notifyName: 'SAME AS CONSIGNEE', notifyAddress: '' }));
  }, [mainData.notifySameAs]);

  const handleMainChange = (field: keyof MainData, value: string | boolean) => { setMainData(prev => ({ ...prev, [field]: value })); };
  const handleCargoChange = (field: keyof CargoData, value: unknown) => { setCargoData(prev => ({ ...prev, [field]: value })); };
  const handleOtherChange = (field: keyof OtherData, value: string) => { setOtherData(prev => ({ ...prev, [field]: value })); };

  const addCargoItem = () => { setCargoData(prev => ({ ...prev, cargoItems: [...prev.cargoItems, { id: `C-${Date.now()}`, piecesRcp: 0, grossWeight: 0, weightUnit: 'K', rateClass: '', chargeableWeight: 0, rateCharge: 0, total: 0, asArranged: false }] })); };
  const removeCargoItem = (id: string) => { setCargoData(prev => ({ ...prev, cargoItems: prev.cargoItems.filter(c => c.id !== id) })); };
  const addOtherCharge = () => { setCargoData(prev => ({ ...prev, otherCharges: [...prev.otherCharges, { id: `OC-${Date.now()}`, codes: '', currency: 'USD', rate: 0, amount: 0, pc: 'P', ac: '' }] })); };
  const removeOtherCharge = (id: string) => { setCargoData(prev => ({ ...prev, otherCharges: prev.otherCharges.filter(c => c.id !== id) })); };
  const handleDimensionsApply = (dimensions: DimensionItem[], totalPcs: number, totalVolume: number) => { setCargoData(prev => ({ ...prev, dimensions, totalPcs, totalVolume })); };

  const totalGrossWeight = cargoData.cargoItems.reduce((s, i) => s + i.grossWeight, 0);
  const totalChargeableWeight = cargoData.cargoItems.reduce((s, i) => s + i.chargeableWeight, 0);
  const totalPieces = cargoData.cargoItems.reduce((s, i) => s + i.piecesRcp, 0);
  const totalCharge = cargoData.cargoItems.reduce((s, i) => s + i.total, 0);

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
      };
      const res = await fetch('/api/bl/air/house', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        const result = await res.json();
        if (!editId && result.JOB_NO) setMainData(prev => ({ ...prev, jobNo: result.JOB_NO }));
        setIsSaved(true);
        alert('저장되었습니다.');
      } else { const err = await res.json(); alert(err.error || '저장 실패'); }
    } catch (e) { console.error('Save error:', e); alert('저장 중 오류가 발생했습니다.'); }
    finally { setIsLoading(false); }
  };

  const handleCopyAWB = () => { if (!isSaved) { alert('저장 완료 후 복사 가능합니다.'); return; } setMainData(prev => ({ ...prev, jobNo: '', mawbNo: '', hawbNo: '' })); setIsSaved(false); alert('AWB가 복사되었습니다.'); };
  const handleList = () => router.push('/logis/import-bl/air/house');
  const renderTabContent = () => { switch (activeTab) { case 'MAIN': return renderMainTab(); case 'CARGO': return renderCargoTab(); case 'OTHER': return renderOtherTab(); default: return null; } };

  const SearchBtn = ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick} className="px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
    </button>
  );

  const renderMainTab = () => (
    <div className="space-y-6">
      <div className="card">
        <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <h3 className="font-bold">Main Information</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-6 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">수출입구분 <span className="text-red-500">*</span></label>
              <select value={mainData.ioType} onChange={e => handleMainChange('ioType', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm">
                <option value="IN">수입(IN)</option><option value="OUT">수출(OUT)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">JOB NO</label>
              <input type="text" value={mainData.jobNo} readOnly className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm" placeholder="자동생성" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">BOOKING NO</label>
              <input type="text" value={mainData.bookingNo} onChange={e => handleMainChange('bookingNo', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">통화종류</label>
              <select value={mainData.currencyCode} onChange={e => handleMainChange('currencyCode', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm">
                <option value="USD">USD</option><option value="KRW">KRW</option><option value="EUR">EUR</option><option value="JPY">JPY</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">WT/VAL</label>
              <div className="flex gap-4 pt-2">{['P', 'C'].map(v => <label key={v} className="flex items-center gap-2"><input type="radio" name="wtVal" value={v} checked={mainData.wtVal === v} onChange={e => handleMainChange('wtVal', e.target.value)} /><span className="text-sm">{v}</span></label>)}</div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">OTHER</label>
              <div className="flex gap-4 pt-2">{['P', 'C'].map(v => <label key={v} className="flex items-center gap-2"><input type="radio" name="otherChgs" value={v} checked={mainData.otherChgs === v} onChange={e => handleMainChange('otherChgs', e.target.value)} /><span className="text-sm">{v}</span></label>)}</div>
            </div>
          </div>
          <div className="grid grid-cols-6 gap-4 mb-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">MAWB NO</label>
              <div className="flex gap-1">
                <input type="text" value={mainData.mawbNo} onChange={e => handleMainChange('mawbNo', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="000-00000000" />
                <SearchBtn onClick={() => {}} />
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">HAWB NO <span className="text-red-500">*</span></label>
              <input type="text" value={mainData.hawbNo} onChange={e => handleMainChange('hawbNo', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="HAWB NO" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">O/B Date</label>
              <input type="date" value={mainData.obDate} onChange={e => handleMainChange('obDate', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">A/R Date</label>
              <input type="date" value={mainData.arDate} onChange={e => handleMainChange('arDate', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">SHIPPER</label>
              <div className="flex gap-1 mb-2">
                <input type="text" value={mainData.shipperCode} onChange={e => handleMainChange('shipperCode', e.target.value)} className="w-24 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="코드" />
                <input type="text" value={mainData.shipperName} onChange={e => handleMainChange('shipperName', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="Shipper Name" />
                <SearchBtn onClick={() => openCodeSearchModal('customer', i => setMainData(p => ({ ...p, shipperCode: i.code, shipperName: i.name })))} />
              </div>
              <textarea value={mainData.shipperAddress} onChange={e => handleMainChange('shipperAddress', e.target.value)} rows={3} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm resize-none" placeholder="Address" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-[var(--foreground)]">CONSIGNEE</label>
                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={mainData.consigneeCopy} onChange={e => handleMainChange('consigneeCopy', e.target.checked)} className="rounded" />Copy</label>
              </div>
              <div className="flex gap-1 mb-2">
                <input type="text" value={mainData.consigneeCode} onChange={e => handleMainChange('consigneeCode', e.target.value)} className="w-24 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="코드" />
                <input type="text" value={mainData.consigneeName} onChange={e => handleMainChange('consigneeName', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="Consignee Name" />
                <SearchBtn onClick={() => openCodeSearchModal('customer', i => setMainData(p => ({ ...p, consigneeCode: i.code, consigneeName: i.name })))} />
              </div>
              <textarea value={mainData.consigneeAddress} onChange={e => handleMainChange('consigneeAddress', e.target.value)} rows={3} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm resize-none" placeholder="Address" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-[var(--foreground)]">NOTIFY PARTY</label>
                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={mainData.notifySameAs} onChange={e => handleMainChange('notifySameAs', e.target.checked)} className="rounded" />Same As</label>
              </div>
              <div className="flex gap-1 mb-2">
                <input type="text" value={mainData.notifyCode} onChange={e => handleMainChange('notifyCode', e.target.value)} className="w-24 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="코드" disabled={mainData.notifySameAs} />
                <input type="text" value={mainData.notifyName} onChange={e => handleMainChange('notifyName', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="Notify Name" disabled={mainData.notifySameAs} />
                <SearchBtn onClick={() => openCodeSearchModal('customer', i => setMainData(p => ({ ...p, notifyCode: i.code, notifyName: i.name })))} />
              </div>
              <textarea value={mainData.notifyAddress} onChange={e => handleMainChange('notifyAddress', e.target.value)} rows={3} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm resize-none" placeholder="Address" disabled={mainData.notifySameAs} />
            </div>
          </div>
        </div>
      </div>
      {/* Flight Information */}
      <div className="card">
        <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          <h3 className="font-bold">Flight Information</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">출발지</label>
              <div className="flex gap-1">
                <input type="text" value={mainData.departure} onChange={e => handleMainChange('departure', e.target.value.toUpperCase())} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm font-mono" placeholder="LAX" maxLength={5} />
                <SearchBtn onClick={() => openCodeSearchModal('airport', i => setMainData(p => ({ ...p, departure: i.code })))} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">도착지</label>
              <div className="flex gap-1">
                <input type="text" value={mainData.arrival} onChange={e => handleMainChange('arrival', e.target.value.toUpperCase())} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm font-mono" placeholder="ICN" maxLength={5} />
                <SearchBtn onClick={() => openCodeSearchModal('airport', i => setMainData(p => ({ ...p, arrival: i.code })))} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Flight No.</label>
              <input type="text" value={mainData.flightNo} onChange={e => handleMainChange('flightNo', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="KE001" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Flight Date</label>
              <input type="date" value={mainData.flightDate} onChange={e => handleMainChange('flightDate', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">HANDLING INFORMATION</label>
              <input type="text" value={mainData.handlingInfo} onChange={e => handleMainChange('handlingInfo', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCargoTab = () => (
    <div className="space-y-6">
      {/* Cargo Items */}
      <div className="card">
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            <h3 className="font-bold">Cargo Information</h3>
          </div>
          <button onClick={addCargoItem} className="px-3 py-1 text-sm bg-[#E8A838] text-white rounded hover:bg-[#d99a2f]">추가</button>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr>
              <th className="text-center w-12"></th><th className="text-center">No. of pieces RCP</th><th className="text-center">GrossWeight</th><th className="text-center">Kg/lb</th><th className="text-center">Rate Class</th><th className="text-center">Chargeable Weight</th><th className="text-center">Rate/Charge</th><th className="text-center">Total</th><th className="text-center">As Arranged</th>
            </tr></thead>
            <tbody>
              {cargoData.cargoItems.length === 0 ? (
                <tr><td colSpan={9} className="p-4 text-center text-[var(--muted)] text-sm">Cargo 정보가 없습니다. 추가 버튼을 클릭하세요.</td></tr>
              ) : cargoData.cargoItems.map((item, idx) => (
                <tr key={item.id} className="border-t border-[var(--border)]">
                  <td className="p-2 text-center"><button onClick={() => removeCargoItem(item.id)} className="text-red-400 hover:text-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button></td>
                  <td className="p-2"><input type="number" value={item.piecesRcp} onChange={e => { const u = [...cargoData.cargoItems]; u[idx].piecesRcp = parseInt(e.target.value) || 0; handleCargoChange('cargoItems', u); }} className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right" /></td>
                  <td className="p-2"><input type="number" value={item.grossWeight} onChange={e => { const u = [...cargoData.cargoItems]; u[idx].grossWeight = parseFloat(e.target.value) || 0; handleCargoChange('cargoItems', u); }} className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right" /></td>
                  <td className="p-2"><select value={item.weightUnit} onChange={e => { const u = [...cargoData.cargoItems]; u[idx].weightUnit = e.target.value; handleCargoChange('cargoItems', u); }} className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"><option value="K">K</option><option value="L">L</option></select></td>
                  <td className="p-2"><input type="text" value={item.rateClass} onChange={e => { const u = [...cargoData.cargoItems]; u[idx].rateClass = e.target.value; handleCargoChange('cargoItems', u); }} className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm" /></td>
                  <td className="p-2"><input type="number" value={item.chargeableWeight} onChange={e => { const u = [...cargoData.cargoItems]; u[idx].chargeableWeight = parseFloat(e.target.value) || 0; handleCargoChange('cargoItems', u); }} className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right" /></td>
                  <td className="p-2"><input type="number" value={item.rateCharge} onChange={e => { const u = [...cargoData.cargoItems]; u[idx].rateCharge = parseFloat(e.target.value) || 0; u[idx].total = u[idx].chargeableWeight * u[idx].rateCharge; handleCargoChange('cargoItems', u); }} className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right" /></td>
                  <td className="p-2"><input type="text" value={formatCurrency(item.total)} readOnly className="w-full px-2 py-1 bg-[var(--surface-200)] border border-[var(--border)] rounded text-sm text-right" /></td>
                  <td className="p-2 text-center"><input type="checkbox" checked={item.asArranged} onChange={e => { const u = [...cargoData.cargoItems]; u[idx].asArranged = e.target.checked; handleCargoChange('cargoItems', u); }} className="rounded" /></td>
                </tr>
              ))}
              {cargoData.cargoItems.length > 0 && (
                <tr className="border-t-2 border-[var(--border)] bg-[var(--surface-50)] font-medium">
                  <td className="p-2 text-center text-sm">합계</td>
                  <td className="p-2 text-right text-sm">{totalPieces}</td>
                  <td className="p-2 text-right text-sm">{totalGrossWeight.toFixed(2)}</td>
                  <td className="p-2"></td><td className="p-2"></td>
                  <td className="p-2 text-right text-sm">{totalChargeableWeight.toFixed(2)}</td>
                  <td className="p-2"></td>
                  <td className="p-2 text-right text-sm font-bold text-[#E8A838]">{formatCurrency(totalCharge)}</td>
                  <td className="p-2"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Other Charges */}
      <div className="card">
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
          <h3 className="font-bold">Other Charges</h3>
          <button onClick={addOtherCharge} className="px-3 py-1 text-sm bg-[#E8A838] text-white rounded hover:bg-[#d99a2f]">추가</button>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr><th className="text-center w-12"></th><th>Codes</th><th className="text-center">CUR</th><th className="text-center">Rate</th><th className="text-center">Amount</th><th className="text-center">P/C</th><th className="text-center">A/C</th></tr></thead>
            <tbody>
              {cargoData.otherCharges.length === 0 ? (
                <tr><td colSpan={7} className="p-4 text-center text-[var(--muted)] text-sm">운임 정보가 없습니다.</td></tr>
              ) : cargoData.otherCharges.map((ch, idx) => (
                <tr key={ch.id} className="border-t border-[var(--border)]">
                  <td className="p-2 text-center"><button onClick={() => removeOtherCharge(ch.id)} className="text-red-400 hover:text-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button></td>
                  <td className="p-2"><input type="text" value={ch.codes} onChange={e => { const u = [...cargoData.otherCharges]; u[idx].codes = e.target.value; handleCargoChange('otherCharges', u); }} className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm" /></td>
                  <td className="p-2"><select value={ch.currency} onChange={e => { const u = [...cargoData.otherCharges]; u[idx].currency = e.target.value; handleCargoChange('otherCharges', u); }} className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"><option value="USD">USD</option><option value="KRW">KRW</option><option value="EUR">EUR</option></select></td>
                  <td className="p-2"><input type="number" value={ch.rate} onChange={e => { const u = [...cargoData.otherCharges]; u[idx].rate = parseFloat(e.target.value) || 0; handleCargoChange('otherCharges', u); }} className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right" /></td>
                  <td className="p-2"><input type="number" value={ch.amount} onChange={e => { const u = [...cargoData.otherCharges]; u[idx].amount = parseFloat(e.target.value) || 0; handleCargoChange('otherCharges', u); }} className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-right" /></td>
                  <td className="p-2"><select value={ch.pc} onChange={e => { const u = [...cargoData.otherCharges]; u[idx].pc = e.target.value; handleCargoChange('otherCharges', u); }} className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm"><option value="P">P</option><option value="C">C</option></select></td>
                  <td className="p-2"><input type="text" value={ch.ac} onChange={e => { const u = [...cargoData.otherCharges]; u[idx].ac = e.target.value; handleCargoChange('otherCharges', u); }} className="w-full px-2 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Nature of Goods & Dimensions */}
      <div className="card">
        <div className="p-4 border-b border-[var(--border)]"><h3 className="font-bold">Additional Information</h3></div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Nature and Quantity of Goods</label>
              <textarea value={cargoData.natureOfGoods} onChange={e => handleCargoChange('natureOfGoods', e.target.value)} rows={4} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm resize-none" placeholder="Description of Goods" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-[var(--foreground)]">Dimensions</label>
                <button onClick={() => setShowDimensionsModal(true)} className="px-3 py-1 text-sm bg-[#2563EB] text-white rounded hover:bg-[#1d4ed8]">Dimensions 계산</button>
              </div>
              <div className="p-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-[var(--muted)]">Total PCS:</span><span className="ml-2 font-medium">{cargoData.totalPcs}</span></div>
                  <div><span className="text-[var(--muted)]">Total Volume:</span><span className="ml-2 font-medium">{cargoData.totalVolume.toFixed(3)} CBM</span></div>
                </div>
                {cargoData.dimensions.length > 0 && <div className="mt-2 pt-2 border-t border-[var(--border)]"><p className="text-xs text-[var(--muted)]">{cargoData.dimensions.length}개 항목</p></div>}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Weight Charge</label>
              <input type="number" value={cargoData.weightCharge} onChange={e => handleCargoChange('weightCharge', parseFloat(e.target.value) || 0)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm text-right" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">At(Place)</label>
              <div className="flex gap-1">
                <input type="text" value={cargoData.atPlace} onChange={e => handleCargoChange('atPlace', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" />
                <SearchBtn onClick={() => {}} />
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Signature of Issuing Carrier</label>
              <input type="text" value={cargoData.signatureCarrier} onChange={e => handleCargoChange('signatureCarrier', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOtherTab = () => (
    <div className="space-y-6">
      <div className="card">
        <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <h3 className="font-bold">Other Information</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Agent</label><div className="flex gap-1"><input type="text" value={otherData.agentCode} onChange={e => handleOtherChange('agentCode', e.target.value)} className="w-20 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="코드" /><input type="text" value={otherData.agentName} onChange={e => handleOtherChange('agentName', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" /><SearchBtn onClick={() => openCodeSearchModal('customer', i => setOtherData(p => ({ ...p, agentCode: i.code, agentName: i.name })))} /></div></div>
            <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Sub Agent</label><div className="flex gap-1"><input type="text" value={otherData.subAgentCode} onChange={e => handleOtherChange('subAgentCode', e.target.value)} className="w-20 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="코드" /><input type="text" value={otherData.subAgentName} onChange={e => handleOtherChange('subAgentName', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" /><SearchBtn onClick={() => openCodeSearchModal('customer', i => setOtherData(p => ({ ...p, subAgentCode: i.code, subAgentName: i.name })))} /></div></div>
            <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Partner</label><div className="flex gap-1"><input type="text" value={otherData.partnerCode} onChange={e => handleOtherChange('partnerCode', e.target.value)} className="w-20 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="코드" /><input type="text" value={otherData.partnerName} onChange={e => handleOtherChange('partnerName', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" /><SearchBtn onClick={() => openCodeSearchModal('customer', i => setOtherData(p => ({ ...p, partnerCode: i.code, partnerName: i.name })))} /></div></div>
            <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">항공사</label><div className="flex gap-1"><input type="text" value={otherData.airlineCode} onChange={e => handleOtherChange('airlineCode', e.target.value)} className="w-20 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="코드" /><input type="text" value={otherData.airlineName} onChange={e => handleOtherChange('airlineName', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" /><SearchBtn onClick={() => openCodeSearchModal('airline', i => setOtherData(p => ({ ...p, airlineCode: i.code, airlineName: i.name })))} /></div></div>
          </div>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">지역</label><div className="flex gap-1"><input type="text" value={otherData.regionCode} onChange={e => handleOtherChange('regionCode', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" /><SearchBtn onClick={() => openCodeSearchModal('region', i => setOtherData(p => ({ ...p, regionCode: i.code })))} /></div></div>
            <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">국가</label><div className="flex gap-1"><input type="text" value={otherData.countryCode} onChange={e => handleOtherChange('countryCode', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" /><SearchBtn onClick={() => openCodeSearchModal('country', i => setOtherData(p => ({ ...p, countryCode: i.code })))} /></div></div>
            <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">MRN NO</label><input type="text" value={otherData.mrnNo} onChange={e => handleOtherChange('mrnNo', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">MSN</label><input type="text" value={otherData.msn} onChange={e => handleOtherChange('msn', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" /></div>
          </div>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">L/C NO</label><input type="text" value={otherData.lcNo} onChange={e => handleOtherChange('lcNo', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">P/O NO</label><input type="text" value={otherData.poNo} onChange={e => handleOtherChange('poNo', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">INV VALUE</label><input type="text" value={otherData.invValue} onChange={e => handleOtherChange('invValue', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">INV NO</label><input type="text" value={otherData.invNo} onChange={e => handleOtherChange('invNo', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" /></div>
          </div>
          <div className="grid grid-cols-6 gap-4 mb-4">
            <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">TYPE</label><input type="text" value={otherData.type} onChange={e => handleOtherChange('type', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">D/C</label><input type="text" value={otherData.dc} onChange={e => handleOtherChange('dc', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">L/N</label><input type="text" value={otherData.ln} onChange={e => handleOtherChange('ln', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">P/C</label><input type="text" value={otherData.pc} onChange={e => handleOtherChange('pc', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">INCO</label><input type="text" value={otherData.inco} onChange={e => handleOtherChange('inco', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">상태</label><select value={otherData.status} onChange={e => handleOtherChange('status', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"><option value="DRAFT">작성중</option><option value="CONFIRMED">확정</option><option value="SENT">전송완료</option></select></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header title={editId ? "House AWB 수정" : "House AWB 등록"} subtitle="HOME > 항공수입 > House AWB 관리 > 등록" onClose={() => setShowCloseModal(true)} />
      <main className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2"><button onClick={handleList} className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">목록</button></div>
          <div className="flex gap-2">
            <button onClick={() => router.push('/logis/import-bl/air/house/register')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">신규</button>
            <button onClick={handleCopyAWB} disabled={!isSaved} className={`px-4 py-2 rounded-lg font-medium ${isSaved ? 'bg-[var(--surface-100)] border border-[var(--border)] hover:bg-[var(--surface-200)]' : 'bg-[var(--surface-200)] text-[var(--muted)] cursor-not-allowed'}`}>AWB 복사</button>
            <button onClick={handleSave} disabled={isLoading} className="px-6 py-2 bg-[#E8A838] text-[#0C1222] font-semibold rounded-lg hover:bg-[#D4943A] disabled:opacity-50">{isLoading ? '저장중...' : '저장'}</button>
          </div>
        </div>
        <div className="flex gap-1 border-b border-[var(--border)] mb-6">
          {(['MAIN', 'CARGO', 'OTHER'] as TabType[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-2 px-6 py-3 font-medium rounded-t-lg transition-colors ${activeTab === tab ? 'bg-[#2563EB] text-white' : 'bg-[var(--surface-100)] text-[var(--muted)] hover:bg-[var(--surface-200)] hover:text-[var(--foreground)]'}`}>{tab}</button>
          ))}
        </div>
        {renderTabContent()}
      </main>
      <CloseConfirmModal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} onConfirm={handleConfirmClose} />
      <DimensionsCalcModal isOpen={showDimensionsModal} onClose={() => setShowDimensionsModal(false)} onApply={handleDimensionsApply} initialData={cargoData.dimensions} />
      <CodeSearchModal isOpen={showCodeSearchModal} onClose={() => setShowCodeSearchModal(false)} onSelect={handleCodeSelect} codeType={searchModalType} />
    </div>
  );
}

export default function ImportHouseAWBRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)] flex items-center justify-center">Loading...</div>}>
      <ImportHouseAWBRegisterContent />
    </Suspense>
  );
}
