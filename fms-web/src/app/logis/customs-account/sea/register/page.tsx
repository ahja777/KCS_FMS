'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { LIST_PATHS } from '@/constants/paths';
import { ActionButton } from '@/components/buttons';
import { formatCurrency } from '@/utils/format';
import SearchIconButton from '@/components/SearchIconButton';
import CodeSearchModal, { CodeType, CodeItem } from '@/components/popup/CodeSearchModal';
import DateRangeButtons from '@/components/DateRangeButtons';
import BlAwbSearchModal, { BlAwbItem } from '@/components/popup/BlAwbSearchModal';

interface FormData {
  boundType: string;
  businessType: string;
  tradeTerms: string;
  branch: string;
  mblNo: string;
  hblNo: string;
  caseqNo: string;
  accountCode: string;
  accountName: string;
  shipperCode: string;
  shipperName: string;
  shipperAddr: string;
  consigneeCode: string;
  consigneeName: string;
  consigneeAddr: string;
  performanceDate: string;
  performanceAmt: number;
  packages: number;
  packageUnit: string;
  weight: number;
  weightUnit: string;
  cbm: number;
  inputDate: string;
  obArDate: string;
  flightNo: string;
  vesselName: string;
  voyageNo: string;
  containerType: string;
  callSign: string;
  pol: string;
  pod: string;
  salesEmployee: string;
  lcNo: string;
  invNo: string;
  poNo: string;
  item: string;
  container20dr: number;
  container20hc: number;
  container20rf: number;
  container40dr: number;
  container40hc: number;
  container40rf: number;
  customsDate: string;
  licenseNo: string;
  brokerCode: string;
  brokerName: string;
  customsOffice: string;
  transportDate: string;
  bondedWarehouse: string;
  customsType: string;
  customsDept: string;
  declaredValue: number;
  currency: string;
  exRate: number;
  dutyRate: number;
  assessedValue: number;
  freightAmt: number;
  dutyAmt: number;
  vatRate: number;
  vatAmt: number;
  remarks: string;
}

const today = new Date().toISOString().split('T')[0];

const initialFormData: FormData = {
  boundType: 'AI', businessType: '통관B/L', tradeTerms: 'CFR', branch: '',
  mblNo: '', hblNo: '', caseqNo: '',
  accountCode: '', accountName: '',
  shipperCode: '', shipperName: '', shipperAddr: '',
  consigneeCode: '', consigneeName: '', consigneeAddr: '',
  performanceDate: today, performanceAmt: 0,
  packages: 0, packageUnit: 'CT', weight: 0, weightUnit: 'KG', cbm: 0,
  inputDate: today, obArDate: '',
  flightNo: '', vesselName: '', voyageNo: '',
  containerType: '', callSign: '', pol: '', pod: '',
  salesEmployee: '', lcNo: '', invNo: '', poNo: '', item: '',
  container20dr: 0, container20hc: 0, container20rf: 0,
  container40dr: 0, container40hc: 0, container40rf: 0,
  customsDate: '', licenseNo: '', brokerCode: '', brokerName: '',
  customsOffice: '', transportDate: '', bondedWarehouse: '',
  customsType: '', customsDept: '',
  declaredValue: 0, currency: 'USD', exRate: 1350, dutyRate: 0,
  assessedValue: 0, freightAmt: 0, dutyAmt: 0, vatRate: 10, vatAmt: 0,
  remarks: '',
};

function CustomsAccountRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeModalType, setCodeModalType] = useState<CodeType>('customer');
  const [codeTargetField, setCodeTargetField] = useState('');
  const [saving, setSaving] = useState(false);
  const [isNewMode, setIsNewMode] = useState(!editId);
  const [showBlModal, setShowBlModal] = useState(false);

  const handleConfirmClose = () => { setShowCloseModal(false); router.push(LIST_PATHS.CUSTOMS_ACCOUNT_SEA); };
  useCloseConfirm({ showModal: showCloseModal, setShowModal: setShowCloseModal, onConfirmClose: handleConfirmClose });

  // 수정 모드: 데이터 로드
  useEffect(() => {
    if (editId) {
      fetch(`/api/customs-account/sea?accountId=${editId}`)
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setIsNewMode(false);
            setFormData({
              boundType: data.boundType || 'AI',
              businessType: data.businessType || '통관B/L',
              tradeTerms: data.tradeTerms || 'CFR',
              branch: data.branch || '',
              mblNo: data.mblNo || '',
              hblNo: data.hblNo || '',
              caseqNo: data.caseqNo || '',
              accountCode: data.accountCode || '',
              accountName: data.accountName || '',
              shipperCode: data.shipperCode || '',
              shipperName: data.shipperName || '',
              shipperAddr: data.shipperAddr || '',
              consigneeCode: data.consigneeCode || '',
              consigneeName: data.consigneeName || '',
              consigneeAddr: data.consigneeAddr || '',
              performanceDate: data.performanceDate || today,
              performanceAmt: data.performanceAmt || 0,
              packages: data.packages || 0,
              packageUnit: data.packageUnit || 'CT',
              weight: data.weight || 0,
              weightUnit: data.weightUnit || 'KG',
              cbm: data.cbm || 0,
              inputDate: data.inputDate || today,
              obArDate: data.obArDate || '',
              flightNo: data.flightNo || '',
              vesselName: data.vesselName || '',
              voyageNo: data.voyageNo || '',
              containerType: data.containerType || '',
              callSign: data.callSign || '',
              pol: data.pol || '',
              pod: data.pod || '',
              salesEmployee: data.salesEmployee || '',
              lcNo: data.lcNo || '',
              invNo: data.invNo || '',
              poNo: data.poNo || '',
              item: data.item || '',
              container20dr: data.container20dr || 0,
              container20hc: data.container20hc || 0,
              container20rf: data.container20rf || 0,
              container40dr: data.container40dr || 0,
              container40hc: data.container40hc || 0,
              container40rf: data.container40rf || 0,
              customsDate: data.customsDate || '',
              licenseNo: data.licenseNo || '',
              brokerCode: data.brokerCode || '',
              brokerName: data.brokerName || '',
              customsOffice: data.customsOffice || '',
              transportDate: data.transportDate || '',
              bondedWarehouse: data.bondedWarehouse || '',
              customsType: data.customsType || '',
              customsDept: data.customsDept || '',
              declaredValue: data.declaredValue || 0,
              currency: data.currency || 'USD',
              exRate: data.exRate || 1350,
              dutyRate: data.dutyRate || 0,
              assessedValue: data.assessedValue || 0,
              freightAmt: data.freightAmt || 0,
              dutyAmt: data.dutyAmt || 0,
              vatRate: data.vatRate || 10,
              vatAmt: data.vatAmt || 0,
              remarks: data.remarks || '',
            });
          }
        })
        .catch(err => console.error('Load error:', err));
    }
  }, [editId]);

  const handleChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      // 자동 계산: 과세가격 = 신고가격 * 환율
      if (['declaredValue', 'exRate', 'dutyRate', 'freightAmt', 'vatRate'].includes(field)) {
        next.assessedValue = Math.round(next.declaredValue * next.exRate);
        next.dutyAmt = Math.round((next.assessedValue + next.freightAmt) * next.dutyRate / 100);
        next.vatAmt = Math.round((next.assessedValue + next.freightAmt + next.dutyAmt) * next.vatRate / 100);
      }
      return next;
    });
  };

  const openCodeModal = (field: string, type: CodeType) => {
    setCodeTargetField(field);
    setCodeModalType(type);
    setShowCodeModal(true);
  };

  const handleCodeSelect = (item: CodeItem) => {
    if (codeTargetField === 'account') {
      setFormData(prev => ({ ...prev, accountCode: item.code, accountName: item.name }));
    } else if (codeTargetField === 'shipper') {
      setFormData(prev => ({ ...prev, shipperCode: item.code, shipperName: item.name }));
    } else if (codeTargetField === 'consignee') {
      setFormData(prev => ({ ...prev, consigneeCode: item.code, consigneeName: item.name }));
    } else if (codeTargetField === 'broker') {
      setFormData(prev => ({ ...prev, brokerCode: item.code, brokerName: item.name }));
    }
    setShowCodeModal(false);
  };

  const handleSave = async () => {
    if (!formData.accountName && !formData.shipperName) {
      alert('정산화주 또는 Shipper를 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      const method = editId ? 'PUT' : 'POST';
      const payload = editId ? { ...formData, id: editId } : formData;
      const res = await fetch('/api/customs-account/sea', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const result = await res.json();
        if (editId) {
          alert('수정되었습니다.');
        } else {
          alert(`저장되었습니다. (JOB NO: ${result.jobNo})`);
          if (result.accountId) router.replace(`/logis/customs-account/sea/register?id=${result.accountId}`);
        }
        setIsNewMode(false);
      } else {
        alert('저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleNew = () => {
    if (editId) { router.push('/logis/customs-account/sea/register'); return; }
    setFormData(initialFormData);
    setIsNewMode(true);
  };

  const handleSaveAndNew = async () => {
    await handleSave();
    setFormData(initialFormData);
  };

  const handleReset = () => {
    if (!confirm('입력한 내용을 모두 초기화하시겠습니까?')) return;
    setFormData(initialFormData);
  };

  const handleBlSelect = (item: BlAwbItem) => {
    const boundType = item.docType === 'SEA'
      ? (item.ioType === 'IN' ? 'SI' : 'SO')
      : (item.ioType === 'IN' ? 'AI' : 'AO');
    setFormData(prev => ({
      ...prev,
      boundType,
      businessType: '통관B/L',
      mblNo: item.mblNo || '',
      hblNo: item.hblNo || '',
      shipperName: item.shipperName || '',
      consigneeName: item.consigneeName || '',
      packages: item.packages || 0,
      packageUnit: item.packageUnit || 'CT',
      weight: item.weight || 0,
      cbm: item.cbm || 0,
      vesselName: item.vesselName || '',
      voyageNo: item.voyageNo || '',
      flightNo: item.flightNo || '',
      containerType: item.containerType || '',
      pol: item.pol || '',
      pod: item.pod || '',
      lcNo: item.lcNo || '',
      poNo: item.poNo || '',
      obArDate: item.docType === 'SEA' ? (item.ioType === 'IN' ? item.eta || '' : item.etd || '') : (item.ioType === 'IN' ? item.eta || '' : item.etd || ''),
    }));
    setShowBlModal(false);
  };

  const inputCls = "w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm";
  const readonlyCls = "w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-sm text-[var(--muted)]";
  const labelCls = "block text-xs font-medium text-[var(--muted)] mb-1";

  return (
    <PageLayout title={editId ? "통관정산 수정" : "통관정산 등록"} subtitle="HOME > 통관관리 > 통관정산 관리 > 등록" onClose={() => setShowCloseModal(true)}>
      <main ref={formRef} className="p-6">
        <div className="sticky top-20 z-20 bg-white flex justify-end items-center mb-6 py-2 border-b border-gray-200">
          <div className="flex gap-2">
            <button onClick={handleNew} disabled={isNewMode} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm">신규</button>
            <ActionButton variant="default" icon="search" onClick={() => setShowBlModal(true)}>B/L(AWB) 검색</ActionButton>
            <ActionButton variant="default" icon="refresh" onClick={handleReset}>초기화</ActionButton>
            <ActionButton variant="default" icon="edit" onClick={handleSave} disabled={saving}>{saving ? '저장중...' : '저장'}</ActionButton>
            {!editId && <ActionButton variant="default" icon="plus" onClick={handleSaveAndNew}>저장 후 신규</ActionButton>}
          </div>
        </div>

        {/* 기본정보 - 화면설계서 메인화면 상단 */}
        <div className="card mb-6">
          <div className="p-4 border-b border-[var(--border)]"><h3 className="font-bold">기본정보</h3></div>
          <div className="p-4">
            <div className="grid grid-cols-6 gap-4 mb-4">
              <div><label className={labelCls}>JOB NO</label><input type="text" value="자동생성" disabled className={readonlyCls} /></div>
              <div>
                <label className={labelCls}>BOUND</label>
                <select value={formData.boundType} onChange={e => handleChange('boundType', e.target.value)} className={inputCls}>
                  <option value="AI">항공수입</option><option value="AO">항공수출</option><option value="SI">해상수입</option><option value="SO">해상수출</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>업무유형</label>
                <select value={formData.businessType} onChange={e => handleChange('businessType', e.target.value)} className={inputCls}>
                  <option value="통관B/L">통관B/L</option><option value="운송">운송</option><option value="창고">창고</option><option value="기타">기타</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>무역조건</label>
                <select value={formData.tradeTerms} onChange={e => handleChange('tradeTerms', e.target.value)} className={inputCls}>
                  <option value="CFR">CFR</option><option value="CIF">CIF</option><option value="CIP">CIP</option><option value="CPT">CPT</option>
                  <option value="DDP">DDP</option><option value="EXW">EXW</option><option value="FOB">FOB</option><option value="FCA">FCA</option>
                </select>
              </div>
              <div><label className={labelCls}>본지사</label><input type="text" value={formData.branch} onChange={e => handleChange('branch', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>실적일자 / 실적금액</label>
                <div className="flex gap-1">
                  <input type="date" value={formData.performanceDate} onChange={e => handleChange('performanceDate', e.target.value)} className="w-1/2 h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" />
                  <input type="text" value={formatCurrency(formData.performanceAmt)} disabled className="w-1/2 h-[38px] px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-sm text-[var(--muted)]" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-4 mb-4">
              <div><label className={labelCls}>M.B/L(MAWB) NO</label><input type="text" value={formData.mblNo} onChange={e => handleChange('mblNo', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>H.B/L(HAWB) NO</label><input type="text" value={formData.hblNo} onChange={e => handleChange('hblNo', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>CASEQ NO</label><input type="text" value={formData.caseqNo} disabled className={readonlyCls} /></div>
              <div className="col-span-3">
                <label className={labelCls}>정산화주 (Account)</label>
                <div className="flex gap-1">
                  <input type="text" value={formData.accountCode} onChange={e => handleChange('accountCode', e.target.value)} className="w-[120px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" />
                  <SearchIconButton onClick={() => openCodeModal('account', 'customer')} />
                  <input type="text" value={formData.accountName} onChange={e => handleChange('accountName', e.target.value)} className="flex-1 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="이름/상호" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-4">
              <div className="col-span-3">
                <label className={labelCls}>SHIPPER</label>
                <div className="flex gap-1">
                  <input type="text" value={formData.shipperCode} onChange={e => handleChange('shipperCode', e.target.value)} className="w-[120px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" />
                  <SearchIconButton onClick={() => openCodeModal('shipper', 'customer')} />
                  <input type="text" value={formData.shipperName} onChange={e => handleChange('shipperName', e.target.value)} className="flex-1 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="이름/상호" />
                </div>
              </div>
              <div className="col-span-3">
                <label className={labelCls}>CONSIGNEE</label>
                <div className="flex gap-1">
                  <input type="text" value={formData.consigneeCode} onChange={e => handleChange('consigneeCode', e.target.value)} className="w-[120px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" />
                  <SearchIconButton onClick={() => openCodeModal('consignee', 'customer')} />
                  <input type="text" value={formData.consigneeName} onChange={e => handleChange('consigneeName', e.target.value)} className="flex-1 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="이름/상호" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 화물/운송 정보 */}
        <div className="card mb-6">
          <div className="p-4 border-b border-[var(--border)]"><h3 className="font-bold">화물/운송 정보</h3></div>
          <div className="p-4">
            <div className="grid grid-cols-6 gap-4 mb-4">
              <div><label className={labelCls}>Packages</label>
                <div className="flex gap-1">
                  <input type="number" value={formData.packages} onChange={e => handleChange('packages', parseInt(e.target.value) || 0)} className="w-2/3 h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" />
                  <select value={formData.packageUnit} onChange={e => handleChange('packageUnit', e.target.value)} className="w-1/3 h-[38px] px-1 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-xs">
                    <option value="CT">CT</option><option value="PL">PL</option><option value="BG">BG</option><option value="DR">DR</option>
                  </select>
                </div>
              </div>
              <div><label className={labelCls}>Weight</label>
                <div className="flex gap-1">
                  <input type="number" value={formData.weight} onChange={e => handleChange('weight', parseFloat(e.target.value) || 0)} className="w-2/3 h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" />
                  <select value={formData.weightUnit} onChange={e => handleChange('weightUnit', e.target.value)} className="w-1/3 h-[38px] px-1 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-xs">
                    <option value="KG">KG</option><option value="LB">LB</option><option value="MT">MT</option>
                  </select>
                </div>
              </div>
              <div><label className={labelCls}>CBM</label><input type="number" step="0.001" value={formData.cbm} onChange={e => handleChange('cbm', parseFloat(e.target.value) || 0)} className={inputCls} /></div>
              <div><label className={labelCls}>입력일자</label><input type="date" value={formData.inputDate} onChange={e => handleChange('inputDate', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>입출항일자</label><div className="flex items-center gap-1"><input type="date" value={formData.obArDate} onChange={e => handleChange('obArDate', e.target.value)} className={inputCls} /><DateRangeButtons onRangeSelect={(s) => handleChange('obArDate', s)} /></div></div>
              <div><label className={labelCls}>영업사원</label><input type="text" value={formData.salesEmployee} onChange={e => handleChange('salesEmployee', e.target.value)} className={inputCls} /></div>
            </div>
            <div className="grid grid-cols-6 gap-4 mb-4">
              <div><label className={labelCls}>Flight No</label><input type="text" value={formData.flightNo} onChange={e => handleChange('flightNo', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Vessel Name</label><input type="text" value={formData.vesselName} onChange={e => handleChange('vesselName', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Voyage No</label><input type="text" value={formData.voyageNo} onChange={e => handleChange('voyageNo', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>컨테이너유형/Call Sign</label>
                <div className="flex gap-1">
                  <input type="text" value={formData.containerType} onChange={e => handleChange('containerType', e.target.value)} className="w-1/2 h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="유형" />
                  <input type="text" value={formData.callSign} onChange={e => handleChange('callSign', e.target.value)} className="w-1/2 h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="Call Sign" />
                </div>
              </div>
              <div><label className={labelCls}>P.O.L</label><input type="text" value={formData.pol} onChange={e => handleChange('pol', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>P.O.D</label><input type="text" value={formData.pod} onChange={e => handleChange('pod', e.target.value)} className={inputCls} /></div>
            </div>
            <div className="grid grid-cols-6 gap-4 mb-4">
              <div><label className={labelCls}>L/C NO</label><input type="text" value={formData.lcNo} onChange={e => handleChange('lcNo', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>INV NO.</label><input type="text" value={formData.invNo} onChange={e => handleChange('invNo', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>P/O NO</label><input type="text" value={formData.poNo} onChange={e => handleChange('poNo', e.target.value)} className={inputCls} /></div>
              <div className="col-span-3"><label className={labelCls}>ITEM</label><input type="text" value={formData.item} onChange={e => handleChange('item', e.target.value)} className={inputCls} /></div>
            </div>
            {/* 컨테이너 */}
            <div className="border border-[var(--border)] rounded-lg p-3">
              <div className="text-xs font-medium text-[var(--muted)] mb-2">컨테이너</div>
              <div className="grid grid-cols-6 gap-3">
                <div><label className="text-xs text-[var(--muted)]">20 DR</label><input type="number" value={formData.container20dr} onChange={e => handleChange('container20dr', parseInt(e.target.value) || 0)} className="w-full h-[32px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-center" /></div>
                <div><label className="text-xs text-[var(--muted)]">20 HC</label><input type="number" value={formData.container20hc} onChange={e => handleChange('container20hc', parseInt(e.target.value) || 0)} className="w-full h-[32px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-center" /></div>
                <div><label className="text-xs text-[var(--muted)]">20 RF</label><input type="number" value={formData.container20rf} onChange={e => handleChange('container20rf', parseInt(e.target.value) || 0)} className="w-full h-[32px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-center" /></div>
                <div><label className="text-xs text-[var(--muted)]">40 DR</label><input type="number" value={formData.container40dr} onChange={e => handleChange('container40dr', parseInt(e.target.value) || 0)} className="w-full h-[32px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-center" /></div>
                <div><label className="text-xs text-[var(--muted)]">40 HC</label><input type="number" value={formData.container40hc} onChange={e => handleChange('container40hc', parseInt(e.target.value) || 0)} className="w-full h-[32px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-center" /></div>
                <div><label className="text-xs text-[var(--muted)]">40 RF</label><input type="number" value={formData.container40rf} onChange={e => handleChange('container40rf', parseInt(e.target.value) || 0)} className="w-full h-[32px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-center" /></div>
              </div>
            </div>
          </div>
        </div>

        {/* 통관정보 - 화면설계서 슬라이드 4 */}
        <div className="card mb-6">
          <div className="p-4 border-b border-[var(--border)]"><h3 className="font-bold">통관정보</h3></div>
          <div className="p-4">
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div><label className={labelCls}>통관수리일자</label><div className="flex items-center gap-1"><input type="date" value={formData.customsDate} onChange={e => handleChange('customsDate', e.target.value)} className={inputCls} /><DateRangeButtons onRangeSelect={(s) => handleChange('customsDate', s)} /></div></div>
              <div><label className={labelCls}>신고필증번호</label><input type="text" value={formData.licenseNo} onChange={e => handleChange('licenseNo', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>관세사</label>
                <div className="flex gap-1">
                  <input type="text" value={formData.brokerCode} onChange={e => handleChange('brokerCode', e.target.value)} className="w-[120px] h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" />
                  <SearchIconButton onClick={() => openCodeModal('broker', 'customer')} />
                  <input type="text" value={formData.brokerName} onChange={e => handleChange('brokerName', e.target.value)} className="flex-1 h-[32px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="이름/상호" />
                </div>
              </div>
              <div><label className={labelCls}>관할지 세관</label><input type="text" value={formData.customsOffice} onChange={e => handleChange('customsOffice', e.target.value)} className={inputCls} /></div>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div><label className={labelCls}>운송일자</label><div className="flex items-center gap-1"><input type="date" value={formData.transportDate} onChange={e => handleChange('transportDate', e.target.value)} className={inputCls} /><DateRangeButtons onRangeSelect={(s) => handleChange('transportDate', s)} /></div></div>
              <div><label className={labelCls}>보세창고</label><input type="text" value={formData.bondedWarehouse} onChange={e => handleChange('bondedWarehouse', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>통관유형</label><input type="text" value={formData.customsType} onChange={e => handleChange('customsType', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>세관 과</label><input type="text" value={formData.customsDept} onChange={e => handleChange('customsDept', e.target.value)} className={inputCls} /></div>
            </div>
          </div>
        </div>

        {/* 과세/세액 정보 */}
        <div className="card mb-6">
          <div className="p-4 border-b border-[var(--border)]"><h3 className="font-bold">과세/세액 정보</h3></div>
          <div className="p-4">
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div><label className={labelCls}>신고가격</label><input type="number" value={formData.declaredValue} onChange={e => handleChange('declaredValue', parseFloat(e.target.value) || 0)} className={inputCls} /></div>
              <div><label className={labelCls}>통화</label>
                <select value={formData.currency} onChange={e => handleChange('currency', e.target.value)} className={inputCls}>
                  <option value="USD">USD</option><option value="EUR">EUR</option><option value="JPY">JPY</option><option value="CNY">CNY</option><option value="KRW">KRW</option>
                </select>
              </div>
              <div><label className={labelCls}>환율 (Ex-Rate)</label><input type="number" step="0.01" value={formData.exRate} onChange={e => handleChange('exRate', parseFloat(e.target.value) || 0)} className={inputCls} /></div>
              <div><label className={labelCls}>관세율 (%)</label><input type="number" step="0.01" value={formData.dutyRate} onChange={e => handleChange('dutyRate', parseFloat(e.target.value) || 0)} className={inputCls} /></div>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div><label className={labelCls}>과세가격 (KRW)</label><input type="text" value={formatCurrency(formData.assessedValue)} disabled className={readonlyCls} /></div>
              <div><label className={labelCls}>운임</label><input type="number" value={formData.freightAmt} onChange={e => handleChange('freightAmt', parseFloat(e.target.value) || 0)} className={inputCls} /></div>
              <div><label className={labelCls}>관세</label><input type="text" value={formatCurrency(formData.dutyAmt)} disabled className={readonlyCls} /></div>
              <div><label className={labelCls}>부가세</label><input type="text" value={formatCurrency(formData.vatAmt)} disabled className={readonlyCls} /></div>
            </div>
            <div>
              <label className={labelCls}>비고</label>
              <input type="text" value={formData.remarks} onChange={e => handleChange('remarks', e.target.value)} className={inputCls} placeholder="특이사항" />
            </div>
          </div>
        </div>
      </main>

      <CloseConfirmModal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} onConfirm={handleConfirmClose} />
      <CodeSearchModal isOpen={showCodeModal} onClose={() => setShowCodeModal(false)} onSelect={handleCodeSelect} codeType={codeModalType} />
      <BlAwbSearchModal isOpen={showBlModal} onClose={() => setShowBlModal(false)} onSelect={handleBlSelect} />
    </PageLayout>
  );
}

export default function CustomsAccountRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)] flex items-center justify-center">Loading...</div>}>
      <CustomsAccountRegisterContent />
    </Suspense>
  );
}
