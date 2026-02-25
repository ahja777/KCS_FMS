'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import CodeSearchModal, { CodeType, CodeItem } from '@/components/popup/CodeSearchModal';
import LocationCodeModal, { LocationType, LocationItem } from '@/components/popup/LocationCodeModal';
import CityCodeModal, { CityItem } from '@/components/popup/CityCodeModal';
import CorporateRateSearchModal from '@/components/popup/CorporateRateSearchModal';
import SearchIconButton from '@/components/SearchIconButton';

// Air 운임정보 (PPT 슬라이드10)
interface AirRateInfo {
  id: number;
  rateType: string;
  rateCd: string;
  currencyCd: string;
  rateMin: number;
  rate45l: number;
  rate45: number;
  rate100: number;
  rate300: number;
  rate500: number;
  rate1000: number;
  ratePerKg: number;
  rateBl: number;
  remark: string;
}

// Sea 운임정보 (PPT 슬라이드12)
interface SeaRateInfo {
  id: number;
  rateType: string;
  rateCd: string;
  currencyCd: string;
  ratePerMin: number;
  ratePerBl: number;
  ratePerRton: number;
  rateDry20: number;
  rateDry40: number;
  cntrTypeACd: string;
  cntrTypeARate: number;
  cntrTypeBCd: string;
  cntrTypeBRate: number;
  cntrTypeCCd: string;
  cntrTypeCRate: number;
  rateBulk: number;
  remark: string;
}

// Air 운송요율 (PPT 슬라이드10-11)
interface AirTransportRate {
  id: number;
  rateCd: string;
  originCd: string;
  originNm: string;
  destCd: string;
  destNm: string;
  transportType: string;
  vehicleType: string;
  etcDesc: string;
  amount: number;
  contactNm: string;
  contactTel: string;
  contactFax: string;
  contactEmail: string;
}

// Sea 운송요율 (PPT 슬라이드12-13)
interface SeaTransportRate {
  id: number;
  rateCd: string;
  originCd: string;
  originNm: string;
  destCd: string;
  destNm: string;
  rateLcl: number;
  rate20ft: number;
  rate40ft: number;
  etcDesc: string;
  contactNm: string;
  contactTel: string;
  contactFax: string;
  contactEmail: string;
}

type RateInfo = AirRateInfo | SeaRateInfo;
type TransportRate = AirTransportRate | SeaTransportRate;

// 운임유형 → 운임코드 연동 맵
const RATE_TYPE_OPTIONS = [
  { value: '항공', label: '항공' },
  { value: '해상', label: '해상' },
  { value: '운송', label: '운송' },
  { value: '통관', label: '통관' },
];

const RATE_CODE_MAP: Record<string, { value: string; label: string }[]> = {
  '항공': [
    { value: 'AF', label: 'AF (항공운임)' },
    { value: 'FSC', label: 'FSC (유류할증료)' },
    { value: 'SSC', label: 'SSC (보안할증료)' },
    { value: 'AWC', label: 'AWC (항공화물취급료)' },
    { value: 'MYC', label: 'MYC (MY Charge)' },
    { value: 'SCC', label: 'SCC (Screening Charge)' },
    { value: 'CGC', label: 'CGC (Cargo Charge)' },
    { value: 'AMS', label: 'AMS (AMS Fee)' },
    { value: 'DOC', label: 'DOC (서류발급비)' },
    { value: 'ETC_AIR', label: '기타' },
  ],
  '해상': [
    { value: 'OF', label: 'OF (해상운임)' },
    { value: 'THC', label: 'THC (터미널하역비)' },
    { value: 'BAF', label: 'BAF (유류할증료)' },
    { value: 'CAF', label: 'CAF (통화할증료)' },
    { value: 'CFS', label: 'CFS (CFS비용)' },
    { value: 'LSS', label: 'LSS (저유황할증료)' },
    { value: 'WRS', label: 'WRS (전쟁할증료)' },
    { value: 'PSS', label: 'PSS (성수기할증료)' },
    { value: 'EBS', label: 'EBS (비상유류할증)' },
    { value: 'DOC', label: 'DOC (서류발급비)' },
    { value: 'SEAL', label: 'SEAL (봉인료)' },
    { value: 'D/O', label: 'D/O (화물인도지시비)' },
    { value: 'ETC_SEA', label: '기타' },
  ],
  '운송': [
    { value: 'TRK', label: 'TRK (내륙운송)' },
    { value: 'PKU', label: 'PKU (픽업비)' },
    { value: 'DLV', label: 'DLV (배송비)' },
    { value: 'SHT', label: 'SHT (셔틀비)' },
    { value: 'WGH', label: 'WGH (계근비)' },
    { value: 'WTG', label: 'WTG (대기료)' },
    { value: 'ETC_TRK', label: '기타' },
  ],
  '통관': [
    { value: 'DTY', label: 'DTY (관세)' },
    { value: 'VAT', label: 'VAT (부가세)' },
    { value: 'CLR', label: 'CLR (통관수수료)' },
    { value: 'INS', label: 'INS (검역/검사비)' },
    { value: 'BND', label: 'BND (보세비용)' },
    { value: 'ETC_CLR', label: '기타' },
  ],
};

const inputCls = "w-full min-w-[60px] px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-xs text-center";
const selectCls = "w-full min-w-[75px] px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-xs";

function QuoteRequestRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type');
  const editId = searchParams.get('id');
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isNewMode, setIsNewMode] = useState(!editId);

  const handleConfirmClose = () => {
    setShowCloseModal(false);
    router.push('/logis/quote/request');
  };

  useCloseConfirm({
    showModal: showCloseModal,
    setShowModal: setShowCloseModal,
    onConfirmClose: handleConfirmClose,
  });

  // 기본정보 상태
  const [formData, setFormData] = useState({
    registrationDate: new Date().toISOString().split('T')[0],
    inputEmployee: '',
    category: typeParam === 'air' ? 'air' : 'sea',
    ioType: 'EXPORT',
    origin: '',
    originCode: '',
    destination: '',
    destinationCode: '',
    tradeTerms: 'CIF',
    quoteStatus: '01',
    shippingDate: '',
    attachment1: null as File | null,
    attachment2: null as File | null,
    attachment3: null as File | null,
    tradingPartner: '',
    tradingPartnerCode: '',
    cargoDescription: '',
    cargoType: 'GENERAL',
    weight: '',
    volume: '',
    quantity: '',
    locationType: 'airport' as 'airport' | 'door',
  });

  // URL의 type 파라미터로 초기 카테고리 설정
  useEffect(() => {
    if (typeParam === 'air' || typeParam === 'sea') {
      setFormData(prev => ({ ...prev, category: typeParam }));
    }
  }, [typeParam]);

  // 수정 모드: 기존 데이터 로드
  useEffect(() => {
    if (!editId) return;
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/quote/request?requestId=${editId}`);
        if (!res.ok) return;
        const detail = await res.json();
        setFormData(prev => ({
          ...prev,
          registrationDate: detail.requestDate || prev.registrationDate,
          inputEmployee: detail.inputEmployee || '',
          category: (detail.bizType || 'SEA').toLowerCase(),
          ioType: detail.ioType || 'EXPORT',
          origin: detail.originNm || '',
          originCode: detail.originCd || '',
          destination: detail.destNm || '',
          destinationCode: detail.destCd || '',
          tradeTerms: detail.incoterms || 'CIF',
          quoteStatus: detail.status || '01',
          shippingDate: detail.shippingDate || '',
          tradingPartner: detail.customerNm || '',
          tradingPartnerCode: '',
          cargoDescription: detail.commodity || '',
          cargoType: detail.cargoType || 'GENERAL',
          weight: detail.weightKg ? String(detail.weightKg) : '',
          volume: detail.volumeCbm ? String(detail.volumeCbm) : '',
          quantity: detail.quantity ? String(detail.quantity) : '',
          locationType: 'airport',
        }));
        if (detail.rateInfoList) {
          setRateInfoList(detail.rateInfoList.map((r: any, i: number) => ({ ...r, id: i + 1 })));
        }
        if (detail.transportRateList) {
          setTransportRateList(detail.transportRateList.map((t: any, i: number) => ({ ...t, id: i + 1 })));
        }
        setIsNewMode(false);
      } catch (err) {
        console.error('Failed to load edit data:', err);
      }
    };
    fetchData();
  }, [editId]);

  // 운임정보 그리드 데이터
  const [rateInfoList, setRateInfoList] = useState<RateInfo[]>([]);
  const [transportRateList, setTransportRateList] = useState<TransportRate[]>([]);

  // 선택된 행 관리
  const [selectedRateRows, setSelectedRateRows] = useState<number[]>([]);
  const [selectedTransportRows, setSelectedTransportRows] = useState<number[]>([]);

  // 코드 검색 모달 상태
  const [showCodeSearchModal, setShowCodeSearchModal] = useState(false);
  const [codeSearchType, setCodeSearchType] = useState<CodeType>('customer');
  const [codeSearchField, setCodeSearchField] = useState<string>('');

  // 위치 검색 모달 상태
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSearchType, setLocationSearchType] = useState<LocationType>('seaport');
  const [locationSearchField, setLocationSearchField] = useState<string>('');

  // 운송요율 행 검색 대상 추적
  const [transportSearchRowId, setTransportSearchRowId] = useState<number | null>(null);

  // 기업운임조회 모달 상태
  const [showCorporateRateModal, setShowCorporateRateModal] = useState(false);

  // 도시코드 검색 모달 상태
  const [showCityModal, setShowCityModal] = useState(false);
  const [citySearchField, setCitySearchField] = useState<string>('');

  // 탭 상태
  const [activeTab, setActiveTab] = useState<'basic' | 'tip'>('basic');

  const handleCodeSearch = (field: string, type: CodeType, rowId?: number) => {
    setCodeSearchField(field);
    setCodeSearchType(type);
    setTransportSearchRowId(rowId ?? null);
    setShowCodeSearchModal(true);
  };

  const handleCodeSelect = (item: CodeItem) => {
    if (codeSearchField === 'transportRateCd' && transportSearchRowId !== null) {
      updateTransport(transportSearchRowId, 'rateCd', item.code);
    } else if (codeSearchField === 'inputEmployee') {
      setFormData(prev => ({ ...prev, inputEmployee: item.name }));
    } else if (codeSearchField === 'tradingPartner') {
      setFormData(prev => ({ ...prev, tradingPartnerCode: item.code, tradingPartner: item.name }));
    }
    setTransportSearchRowId(null);
    setShowCodeSearchModal(false);
  };

  const handleLocationSearch = (field: string, rowId?: number) => {
    setLocationSearchField(field);
    setTransportSearchRowId(rowId ?? null);
    if (formData.category === 'air') {
      setLocationSearchType(formData.locationType === 'door' ? 'seaport' : 'airport');
    } else {
      setLocationSearchType('seaport');
    }
    setShowLocationModal(true);
  };

  const handleLocationSelect = (item: LocationItem) => {
    if (locationSearchField === 'origin') {
      setFormData(prev => ({ ...prev, originCode: item.code, origin: item.nameEn || item.nameKr || '' }));
    } else if (locationSearchField === 'destination') {
      setFormData(prev => ({ ...prev, destinationCode: item.code, destination: item.nameEn || item.nameKr || '' }));
    }
    setShowLocationModal(false);
  };

  // 운송요율 출발지/도착지 → 도시코드 검색
  const handleCitySearch = (field: string, rowId: number) => {
    setCitySearchField(field);
    setTransportSearchRowId(rowId);
    setShowCityModal(true);
  };

  const handleCitySelect = (item: CityItem) => {
    if (citySearchField === 'transportOrigin' && transportSearchRowId !== null) {
      updateTransport(transportSearchRowId, 'originCd', item.code);
      updateTransport(transportSearchRowId, 'originNm', item.nameKr);
    } else if (citySearchField === 'transportDest' && transportSearchRowId !== null) {
      updateTransport(transportSearchRowId, 'destCd', item.code);
      updateTransport(transportSearchRowId, 'destNm', item.nameKr);
    }
    setTransportSearchRowId(null);
    setShowCityModal(false);
  };

  // 기업운임 선택 핸들러
  const handleCorporateRateSelect = (selectedRates: any[]) => {
    selectedRates.forEach((rate) => {
      if (formData.category === 'air') {
        const newId = Math.max(...rateInfoList.map(r => r.id), 0) + 1;
        setRateInfoList(prev => [...prev, {
          id: newId,
          rateType: rate.FREIGHT_TYPE || '',
          rateCd: rate.FREIGHT_CD || '',
          currencyCd: rate.CURRENCY_CD || 'USD',
          rateMin: Number(rate.RATE_MIN_AIR) || 0,
          rate45l: Number(rate.RATE_45L) || 0,
          rate45: Number(rate.RATE_45) || 0,
          rate100: Number(rate.RATE_100) || 0,
          rate300: Number(rate.RATE_300) || 0,
          rate500: Number(rate.RATE_500) || 0,
          rate1000: Number(rate.RATE_1000) || 0,
          ratePerKg: 0,
          rateBl: 0,
          remark: '',
        } as AirRateInfo]);
      } else {
        const newId = Math.max(...rateInfoList.map(r => r.id), 0) + 1;
        setRateInfoList(prev => [...prev, {
          id: newId,
          rateType: rate.FREIGHT_TYPE || '',
          rateCd: rate.FREIGHT_CD || '',
          currencyCd: rate.CURRENCY_CD || 'USD',
          ratePerMin: Number(rate.RATE_MIN) || 0,
          ratePerBl: Number(rate.RATE_BL) || 0,
          ratePerRton: Number(rate.RATE_RTON) || 0,
          rateDry20: Number(rate.CNTR_DRY_20) || 0,
          rateDry40: Number(rate.CNTR_DRY_40) || 0,
          cntrTypeACd: rate.CNTR_TYPE_A_CD || '',
          cntrTypeARate: Number(rate.CNTR_TYPE_A_RATE) || 0,
          cntrTypeBCd: rate.CNTR_TYPE_B_CD || '',
          cntrTypeBRate: Number(rate.CNTR_TYPE_B_RATE) || 0,
          cntrTypeCCd: rate.CNTR_TYPE_C_CD || '',
          cntrTypeCRate: Number(rate.CNTR_TYPE_C_RATE) || 0,
          rateBulk: Number(rate.RATE_BULK) || 0,
          remark: '',
        } as SeaRateInfo]);
      }
    });
    alert(`기업운임 ${selectedRates.length}건이 운임정보에 추가되었습니다.`);
  };

  // 카테고리 변경 시 운임/운송 데이터 초기화
  const handleCategoryChange = (newCategory: string) => {
    setFormData(prev => ({ ...prev, category: newCategory }));
    setRateInfoList([]);
    setTransportRateList([]);
    setSelectedRateRows([]);
    setSelectedTransportRows([]);
  };

  // Air 운임정보 행 추가
  const addAirRateRow = () => {
    const newId = Math.max(...rateInfoList.map(r => r.id), 0) + 1;
    setRateInfoList([...rateInfoList, {
      id: newId, rateType: '', rateCd: '', currencyCd: 'USD',
      rateMin: 0, rate45l: 0, rate45: 0, rate100: 0, rate300: 0,
      rate500: 0, rate1000: 0, ratePerKg: 0, rateBl: 0, remark: '',
    } as AirRateInfo]);
  };

  // Sea 운임정보 행 추가
  const addSeaRateRow = () => {
    const newId = Math.max(...rateInfoList.map(r => r.id), 0) + 1;
    setRateInfoList([...rateInfoList, {
      id: newId, rateType: '', rateCd: '', currencyCd: 'USD',
      ratePerMin: 0, ratePerBl: 0, ratePerRton: 0, rateDry20: 0, rateDry40: 0,
      cntrTypeACd: '', cntrTypeARate: 0, cntrTypeBCd: '', cntrTypeBRate: 0,
      cntrTypeCCd: '', cntrTypeCRate: 0, rateBulk: 0, remark: '',
    } as SeaRateInfo]);
  };

  const addRateRow = () => {
    formData.category === 'air' ? addAirRateRow() : addSeaRateRow();
  };

  const deleteSelectedRateRows = () => {
    setRateInfoList(rateInfoList.filter(r => !selectedRateRows.includes(r.id)));
    setSelectedRateRows([]);
  };

  // Air 운송요율 행 추가
  const addAirTransportRow = () => {
    const newId = Math.max(...transportRateList.map(r => r.id), 0) + 1;
    setTransportRateList([...transportRateList, {
      id: newId, rateCd: '', originCd: '', originNm: '', destCd: '', destNm: '',
      transportType: '', vehicleType: '', etcDesc: '', amount: 0,
      contactNm: '', contactTel: '', contactFax: '', contactEmail: '',
    } as AirTransportRate]);
  };

  // Sea 운송요율 행 추가
  const addSeaTransportRow = () => {
    const newId = Math.max(...transportRateList.map(r => r.id), 0) + 1;
    setTransportRateList([...transportRateList, {
      id: newId, rateCd: '', originCd: '', originNm: '', destCd: '', destNm: '',
      rateLcl: 0, rate20ft: 0, rate40ft: 0, etcDesc: '',
      contactNm: '', contactTel: '', contactFax: '', contactEmail: '',
    } as SeaTransportRate]);
  };

  const addTransportRow = () => {
    formData.category === 'air' ? addAirTransportRow() : addSeaTransportRow();
  };

  const deleteSelectedTransportRows = () => {
    setTransportRateList(transportRateList.filter(r => !selectedTransportRows.includes(r.id)));
    setSelectedTransportRows([]);
  };

  // rate 행 업데이트 헬퍼 (운임유형 변경 시 운임코드 초기화)
  const updateRate = (id: number, field: string, value: unknown) => {
    if (field === 'rateType') {
      setRateInfoList(prev => prev.map(r => r.id === id ? { ...r, rateType: value as string, rateCd: '' } : r));
    } else {
      setRateInfoList(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    }
  };

  // transport 행 업데이트 헬퍼
  const updateTransport = (id: number, field: string, value: unknown) => {
    setTransportRateList(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  // API 저장
  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        requestDate: formData.registrationDate,
        bizType: formData.category.toUpperCase(),
        ioType: formData.ioType,
        customerNm: formData.tradingPartner,
        inputEmployee: formData.inputEmployee,
        originCd: formData.originCode,
        originNm: formData.origin,
        destCd: formData.destinationCode,
        destNm: formData.destination,
        incoterms: formData.tradeTerms,
        shippingDate: formData.shippingDate || null,
        commodity: formData.cargoDescription,
        cargoType: formData.cargoType,
        weightKg: formData.weight ? parseFloat(formData.weight) : null,
        volumeCbm: formData.volume ? parseFloat(formData.volume) : null,
        quantity: formData.quantity ? parseInt(formData.quantity) : null,
        currencyCd: 'USD',
        status: formData.quoteStatus,
        rateInfoList: rateInfoList.map(r => {
          const { id, ...rest } = r;
          return rest;
        }),
        transportRateList: transportRateList.map(t => {
          const { id, ...rest } = t;
          return rest;
        }),
      };

      const res = await fetch('/api/quote/request', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editId ? { ...payload, id: Number(editId) } : payload),
      });

      if (!res.ok) throw new Error('저장 실패');
      const data = await res.json();
      setIsNewMode(false);
      alert(editId ? '수정되었습니다.' : `저장되었습니다. (${data.requestNo})`);
      if (!editId && data.requestId) router.replace(`/logis/quote/request/register?id=${data.requestId}`);
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleNew = () => {
    if (editId) { router.push(`/logis/quote/request/register${typeParam ? `?type=${typeParam}` : ''}`); return; }
    setFormData({
      registrationDate: new Date().toISOString().split('T')[0],
      inputEmployee: '', category: typeParam === 'air' ? 'air' : 'sea', ioType: 'EXPORT',
      origin: '', originCode: '', destination: '', destinationCode: '',
      tradeTerms: 'CIF', quoteStatus: '01', shippingDate: '',
      attachment1: null, attachment2: null, attachment3: null,
      tradingPartner: '', tradingPartnerCode: '', cargoDescription: '',
      cargoType: 'GENERAL', weight: '', volume: '', quantity: '', locationType: 'airport',
    });
    setRateInfoList([]); setTransportRateList([]);
    setIsNewMode(true);
  };

  const fieldH = "h-[32px]";
  const labelCls = "block text-xs font-medium text-[var(--foreground)] mb-1";
  const fieldCls = `w-full ${fieldH} px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[#2563EB]`;

  return (
    <PageLayout title={`견적요청 ${editId ? '수정' : '등록'} (${formData.category === 'air' ? '항공' : '해상'})`} subtitle={`물류견적관리 > 견적요청 등록/조회 > 견적요청 ${editId ? '수정' : '등록'}(화주)`} onClose={() => setShowCloseModal(true)}>
      <main className="p-4">
        {/* 상단 버튼 영역 */}
        <div className="sticky top-0 z-20 bg-white flex justify-between items-center mb-4 py-2 border-b border-gray-200">
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-sm bg-[var(--surface-100)] text-[var(--foreground)] rounded hover:bg-[var(--surface-200)]">
              견적신청
            </button>
            <button className="px-3 py-1.5 text-sm bg-[var(--surface-100)] text-[var(--foreground)] rounded hover:bg-[var(--surface-200)]">
              E-mail
            </button>
            <button className="px-3 py-1.5 text-sm bg-[var(--surface-100)] text-[var(--foreground)] rounded hover:bg-[var(--surface-200)]">
              알람
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleNew}
              disabled={isNewMode}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              신규
            </button>
            <Link href="/logis/quote/request" className="px-3 py-1.5 text-sm bg-[var(--surface-100)] text-[var(--foreground)] rounded hover:bg-[var(--surface-200)]">
              목록
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 text-sm bg-[#2563EB] text-white rounded hover:bg-[#1d4ed8] disabled:opacity-50"
            >
              {saving ? '저장중...' : '저장'}
            </button>
          </div>
        </div>

        {/* 기본정보 탭 */}
        <div className="card mb-4">
          <div className="flex items-center border-b border-[var(--border)]">
            <button
              onClick={() => setActiveTab('basic')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 ${activeTab === 'basic' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'}`}
            >
              기본정보
            </button>
            <div className="ml-auto mr-4 flex items-center gap-2">
              <span className="text-xs text-[var(--muted)]">TIP ON</span>
              <button
                onClick={() => setActiveTab(activeTab === 'tip' ? 'basic' : 'tip')}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${activeTab === 'tip' ? 'bg-[#2563EB]' : 'bg-[var(--surface-200)]'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${activeTab === 'tip' ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>

          <div className="p-4">
            {/* 구분 (수출/수입) + 등록일자 + 견적상태 */}
            <div className="grid grid-cols-12 gap-3 mb-3">
              <div className="col-span-2">
                <label className={labelCls}>구분 <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <label className="flex items-center gap-1 text-sm">
                    <input type="radio" name="ioType" value="EXPORT" checked={formData.ioType === 'EXPORT'}
                      onChange={(e) => setFormData({ ...formData, ioType: e.target.value })} className="accent-[#2563EB]" />
                    수출
                  </label>
                  <label className="flex items-center gap-1 text-sm">
                    <input type="radio" name="ioType" value="IMPORT" checked={formData.ioType === 'IMPORT'}
                      onChange={(e) => setFormData({ ...formData, ioType: e.target.value })} className="accent-[#2563EB]" />
                    수입
                  </label>
                </div>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>등록일자 <span className="text-red-500">*</span></label>
                <input type="date" value={formData.registrationDate} onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
                  className={fieldCls} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>견적상태</label>
                <select value={formData.quoteStatus} onChange={(e) => setFormData({ ...formData, quoteStatus: e.target.value })}
                  className={fieldCls}>
                  <option value="01">미요청</option>
                  <option value="02">요청</option>
                  <option value="03">확인</option>
                  <option value="04">승인</option>
                  <option value="05">거절</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>업무구분</label>
                <select value={formData.category} onChange={(e) => handleCategoryChange(e.target.value)}
                  className={fieldCls}>
                  <option value="sea">해상</option>
                  <option value="air">항공</option>
                </select>
              </div>
            </div>

            {/* 출발지/도착지 (Airport/Door 토글 - 항공만) */}
            <div className="grid grid-cols-12 gap-3 mb-3">
              {formData.category === 'air' && (
                <div className="col-span-2">
                  <label className={labelCls}>Location Type</label>
                  <div className="flex border border-[var(--border)] rounded overflow-hidden">
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, locationType: 'airport' }))}
                      className={`flex-1 ${fieldH} text-xs font-medium ${formData.locationType === 'airport' ? 'bg-[#2563EB] text-white' : 'bg-[var(--surface-100)] text-[var(--foreground)] hover:bg-[var(--surface-200)]'}`}
                    >
                      공항(Airport)
                    </button>
                    <div className="w-px bg-[var(--border)]" />
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, locationType: 'door' }))}
                      className={`flex-1 ${fieldH} text-xs font-medium ${formData.locationType === 'door' ? 'bg-[#2563EB] text-white' : 'bg-[var(--surface-100)] text-[var(--foreground)] hover:bg-[var(--surface-200)]'}`}
                    >
                      내륙(Door)
                    </button>
                  </div>
                </div>
              )}
              <div className={formData.category === 'air' ? 'col-span-3' : 'col-span-4'}>
                <label className={labelCls}>{formData.category === 'air' ? '출발공항' : '출발항'} <span className="text-red-500">*</span></label>
                <div className="flex gap-1">
                  <input type="text" value={formData.originCode} onChange={(e) => setFormData({ ...formData, originCode: e.target.value })}
                    className={`w-[80px] ${fieldH} px-2 bg-white border border-gray-300 rounded text-sm`} placeholder="코드" />
                  <SearchIconButton onClick={() => handleLocationSearch('origin')} />
                  <input type="text" value={formData.origin} readOnly
                    className={`flex-1 ${fieldH} px-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-500`} placeholder="이름" />
                </div>
              </div>
              <div className={formData.category === 'air' ? 'col-span-3' : 'col-span-4'}>
                <label className={labelCls}>{formData.category === 'air' ? '도착공항' : '도착항'} <span className="text-red-500">*</span></label>
                <div className="flex gap-1">
                  <input type="text" value={formData.destinationCode} onChange={(e) => setFormData({ ...formData, destinationCode: e.target.value })}
                    className={`w-[80px] ${fieldH} px-2 bg-white border border-gray-300 rounded text-sm`} placeholder="코드" />
                  <SearchIconButton onClick={() => handleLocationSearch('destination')} />
                  <input type="text" value={formData.destination} readOnly
                    className={`flex-1 ${fieldH} px-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-500`} placeholder="이름" />
                </div>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>무역조건</label>
                <select value={formData.tradeTerms} onChange={(e) => setFormData({ ...formData, tradeTerms: e.target.value })}
                  className={fieldCls}>
                  <option value="">선택</option>
                  <option value="CIF">CIF</option>
                  <option value="CFR">CFR(운임포함)</option>
                  <option value="DAP">DAP(도착지수)</option>
                  <option value="DDP">DDP(관세지급)</option>
                  <option value="FOB">FOB</option>
                  <option value="EXW">EXW</option>
                </select>
              </div>
            </div>

            {/* 화물정보 영역 */}
            <div className="grid grid-cols-12 gap-3 mb-3">
              <div className="col-span-3">
                <label className={labelCls}>품고객명칭</label>
                <input type="text" value={formData.cargoDescription} onChange={(e) => setFormData({ ...formData, cargoDescription: e.target.value })}
                  className={fieldCls} placeholder="화물 설명" />
              </div>
              <div className="col-span-3">
                <label className={labelCls}>거래처 <span className="text-red-500">*</span></label>
                <div className="flex gap-1">
                  <input type="text" value={formData.tradingPartnerCode} onChange={(e) => setFormData({ ...formData, tradingPartnerCode: e.target.value })}
                    className={`w-[120px] ${fieldH} px-2 bg-white border border-gray-300 rounded text-sm`} placeholder="코드" />
                  <SearchIconButton onClick={() => handleCodeSearch('tradingPartner', 'customer')} />
                  <input type="text" value={formData.tradingPartner} onChange={(e) => setFormData({ ...formData, tradingPartner: e.target.value })}
                    className={`flex-1 ${fieldH} px-2 bg-white border border-gray-300 rounded text-sm`} placeholder="이름/상호" />
                </div>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>담당사원</label>
                <div className="flex gap-1">
                  <input type="text" value={formData.inputEmployee} onChange={(e) => setFormData({ ...formData, inputEmployee: e.target.value })}
                    className={`flex-1 ${fieldH} px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#2563EB]`} placeholder="사원명" />
                  <button onClick={() => handleCodeSearch('inputEmployee', 'customer')} className={`${fieldH} px-2 bg-[var(--surface-100)] border border-[var(--border)] rounded hover:bg-[var(--surface-200)]`}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </button>
                </div>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>출고예정일</label>
                <input type="date" value={formData.shippingDate} onChange={(e) => setFormData({ ...formData, shippingDate: e.target.value })}
                  className={fieldCls} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>화물구분</label>
                <select value={formData.cargoType} onChange={(e) => setFormData({ ...formData, cargoType: e.target.value })}
                  className={fieldCls}>
                  <option value="GENERAL">일반화물</option>
                  <option value="SPECIAL">특수화물</option>
                  <option value="DG">위험물(DG)</option>
                  <option value="REEFER">냉동(Reefer)</option>
                </select>
              </div>
            </div>

            {/* 포장갯수, 중량, 용적, 차량종류 */}
            <div className="grid grid-cols-12 gap-3 mb-3">
              <div className="col-span-2">
                <label className={labelCls}>포장갯수</label>
                <input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className={fieldCls} placeholder="0" />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>중량 (kg)</label>
                <input type="number" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className={fieldCls} placeholder="0.00" />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>용적 (CBM)</label>
                <input type="number" value={formData.volume} onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                  className={fieldCls} placeholder="0.00" />
              </div>
              {formData.category === 'air' && (
                <div className="col-span-2">
                  <label className={labelCls}>차량종류</label>
                  <select className={fieldCls}>
                    <option value="">선택</option>
                    <option value="1톤">1톤</option>
                    <option value="2.5톤">2.5톤</option>
                    <option value="5톤">5톤</option>
                    <option value="11톤">11톤</option>
                    <option value="25톤">25톤</option>
                  </select>
                </div>
              )}
              <div className="col-span-6">
                <label className={labelCls}>첨부파일</label>
                <div className="grid grid-cols-3 gap-2">
                  {([1, 2, 3] as const).map((num) => (
                    <div key={num} className="flex items-center gap-1">
                      <span className="text-[10px] text-[var(--muted)] w-3 flex-shrink-0">{num}</span>
                      <div className="flex-1 relative">
                        <input
                          type="file"
                          onChange={(e) => setFormData({ ...formData, [`attachment${num}`]: e.target.files?.[0] || null })}
                          className={`w-full ${fieldH} text-xs bg-[var(--surface-50)] border border-[var(--border)] rounded file:mr-2 file:py-0 file:px-2 file:rounded file:border-0 file:text-xs file:bg-[var(--surface-200)]`}
                        />
                        {formData[`attachment${num}` as keyof typeof formData] && (
                          <button
                            onClick={() => setFormData({ ...formData, [`attachment${num}`]: null })}
                            className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-red-400 hover:text-red-600"
                            title="삭제"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 운임정보 섹션 */}
        <div className="card mb-4">
          <div className="flex justify-between items-center p-3 border-b border-[var(--border)]">
            <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
              <span className="w-1 h-4 bg-[#7C3AED] rounded-full"></span>
              운임정보
            </h3>
            <div className="flex gap-2">
              <button onClick={() => setShowCorporateRateModal(true)} className="px-2 py-1 text-xs bg-[var(--surface-100)] text-[var(--foreground)] rounded hover:bg-[var(--surface-200)]">기업운임조회</button>
              <button onClick={addRateRow} className="px-2 py-1 text-xs bg-[#1A2744] text-white rounded hover:bg-[#243354]">추가</button>
              <button onClick={deleteSelectedRateRows} className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50" disabled={selectedRateRows.length === 0}>삭제</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="table text-xs">
              <thead>
                <tr>
                  <th className="w-8 text-center p-1">
                    <input type="checkbox" checked={selectedRateRows.length === rateInfoList.length && rateInfoList.length > 0}
                      onChange={(e) => setSelectedRateRows(e.target.checked ? rateInfoList.map(r => r.id) : [])} className="rounded" />
                  </th>
                  <th className="text-center p-1 min-w-[80px]">운임유형</th>
                  <th className="text-center p-1 min-w-[100px]">운임코드</th>
                  <th className="text-center p-1 min-w-[80px]">통화단위</th>
                  {formData.category === 'air' ? (
                    <>
                      <th className="text-center p-1 min-w-[70px]">Rate_min</th>
                      <th className="text-center p-1 min-w-[65px]">Rate_45L</th>
                      <th className="text-center p-1 min-w-[60px]">Rate_45</th>
                      <th className="text-center p-1 min-w-[65px]">Rate_100</th>
                      <th className="text-center p-1 min-w-[65px]">Rate_300</th>
                      <th className="text-center p-1 min-w-[65px]">Rate_500</th>
                      <th className="text-center p-1 min-w-[70px]">Rate_1000</th>
                      <th className="text-center p-1 min-w-[75px]">Rate/Kg</th>
                      <th className="text-center p-1 min-w-[65px]">Rate_BL</th>
                    </>
                  ) : (
                    <>
                      <th className="text-center p-1 min-w-[70px]">Per Min</th>
                      <th className="text-center p-1 min-w-[65px]">Per BL</th>
                      <th className="text-center p-1 min-w-[70px]">Per R.Ton</th>
                      <th className="text-center p-1 min-w-[60px]">DRY 20</th>
                      <th className="text-center p-1 min-w-[60px]">DRY 40</th>
                      <th className="text-center p-1 min-w-[70px]">Type A Cd</th>
                      <th className="text-center p-1 min-w-[70px]">Type A Rt</th>
                      <th className="text-center p-1 min-w-[70px]">Type B Cd</th>
                      <th className="text-center p-1 min-w-[70px]">Type B Rt</th>
                      <th className="text-center p-1 min-w-[70px]">Type C Cd</th>
                      <th className="text-center p-1 min-w-[70px]">Type C Rt</th>
                      <th className="text-center p-1 min-w-[60px]">Bulk</th>
                    </>
                  )}
                  <th className="text-center p-1 min-w-[70px]">Remark</th>
                </tr>
              </thead>
              <tbody>
                {rateInfoList.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-50)]">
                    <td className="p-1 text-center">
                      <input type="checkbox" checked={selectedRateRows.includes(row.id)}
                        onChange={(e) => setSelectedRateRows(e.target.checked ? [...selectedRateRows, row.id] : selectedRateRows.filter(id => id !== row.id))} className="rounded" />
                    </td>
                    <td className="p-1 text-center">
                      <select value={row.rateType} onChange={(e) => updateRate(row.id, 'rateType', e.target.value)}
                        className="w-full min-w-[80px] px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-xs">
                        <option value="">선택</option>
                        {RATE_TYPE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-1 text-center">
                      <select value={row.rateCd} onChange={(e) => updateRate(row.id, 'rateCd', e.target.value)}
                        className="w-full min-w-[100px] px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-xs"
                        disabled={!row.rateType}>
                        <option value="">선택</option>
                        {(RATE_CODE_MAP[row.rateType] || []).map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-1 text-center">
                      <select value={row.currencyCd} onChange={(e) => updateRate(row.id, 'currencyCd', e.target.value)}
                        className="w-full min-w-[80px] px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-xs">
                        <option value="USD">USD</option><option value="KRW">KRW</option><option value="EUR">EUR</option><option value="JPY">JPY</option><option value="CNY">CNY</option>
                      </select>
                    </td>
                    {formData.category === 'air' ? (
                      <>
                        {(['rateMin','rate45l','rate45','rate100','rate300','rate500','rate1000','ratePerKg','rateBl'] as const).map(field => (
                          <td key={field} className="p-1 text-center">
                            <input type="number" value={(row as AirRateInfo)[field]} onChange={(e) => updateRate(row.id, field, parseFloat(e.target.value) || 0)} className={inputCls} />
                          </td>
                        ))}
                      </>
                    ) : (
                      <>
                        {(['ratePerMin','ratePerBl','ratePerRton','rateDry20','rateDry40'] as const).map(field => (
                          <td key={field} className="p-1 text-center">
                            <input type="number" value={(row as SeaRateInfo)[field]} onChange={(e) => updateRate(row.id, field, parseFloat(e.target.value) || 0)} className={inputCls} />
                          </td>
                        ))}
                        <td className="p-1 text-center"><input type="text" value={(row as SeaRateInfo).cntrTypeACd} onChange={(e) => updateRate(row.id, 'cntrTypeACd', e.target.value)} className={inputCls} placeholder="Code" /></td>
                        <td className="p-1 text-center"><input type="number" value={(row as SeaRateInfo).cntrTypeARate} onChange={(e) => updateRate(row.id, 'cntrTypeARate', parseFloat(e.target.value) || 0)} className={inputCls} /></td>
                        <td className="p-1 text-center"><input type="text" value={(row as SeaRateInfo).cntrTypeBCd} onChange={(e) => updateRate(row.id, 'cntrTypeBCd', e.target.value)} className={inputCls} placeholder="Code" /></td>
                        <td className="p-1 text-center"><input type="number" value={(row as SeaRateInfo).cntrTypeBRate} onChange={(e) => updateRate(row.id, 'cntrTypeBRate', parseFloat(e.target.value) || 0)} className={inputCls} /></td>
                        <td className="p-1 text-center"><input type="text" value={(row as SeaRateInfo).cntrTypeCCd} onChange={(e) => updateRate(row.id, 'cntrTypeCCd', e.target.value)} className={inputCls} placeholder="Code" /></td>
                        <td className="p-1 text-center"><input type="number" value={(row as SeaRateInfo).cntrTypeCRate} onChange={(e) => updateRate(row.id, 'cntrTypeCRate', parseFloat(e.target.value) || 0)} className={inputCls} /></td>
                        <td className="p-1 text-center"><input type="number" value={(row as SeaRateInfo).rateBulk} onChange={(e) => updateRate(row.id, 'rateBulk', parseFloat(e.target.value) || 0)} className={inputCls} /></td>
                      </>
                    )}
                    <td className="p-1 text-center"><input type="text" value={row.remark} onChange={(e) => updateRate(row.id, 'remark', e.target.value)} className={inputCls} placeholder="비고" /></td>
                  </tr>
                ))}
                {rateInfoList.length === 0 && (
                  <tr><td colSpan={formData.category === 'air' ? 14 : 17} className="p-3 text-center text-[var(--muted)] text-xs">운임정보를 추가해주세요.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 운송요율 섹션 */}
        <div className="card mb-4">
          <div className="flex justify-between items-center p-3 border-b border-[var(--border)]">
            <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
              <span className="w-1 h-4 bg-[#059669] rounded-full"></span>
              운송요율
            </h3>
            <div className="flex gap-2">
              <button onClick={addTransportRow} className="px-2 py-1 text-xs bg-[#1A2744] text-white rounded hover:bg-[#243354]">추가</button>
              <button onClick={deleteSelectedTransportRows} className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50" disabled={selectedTransportRows.length === 0}>삭제</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="table text-xs">
              <thead>
                <tr>
                  <th className="w-8 text-center p-1">
                    <input type="checkbox" checked={selectedTransportRows.length === transportRateList.length && transportRateList.length > 0}
                      onChange={(e) => setSelectedTransportRows(e.target.checked ? transportRateList.map(r => r.id) : [])} className="rounded" />
                  </th>
                  <th className="text-center p-1 min-w-[75px]">운임코드</th>
                  <th className="text-center p-1 min-w-[65px]">출발지</th>
                  <th className="text-center p-1 min-w-[80px]">출발지명</th>
                  <th className="text-center p-1 min-w-[65px]">도착지</th>
                  <th className="text-center p-1 min-w-[80px]">도착지명</th>
                  {formData.category === 'air' ? (
                    <>
                      <th className="text-center p-1 min-w-[70px]">E.T.C</th>
                      <th className="text-center p-1 min-w-[80px]">차량/물류</th>
                    </>
                  ) : (
                    <>
                      <th className="text-center p-1 min-w-[60px]">LCL</th>
                      <th className="text-center p-1 min-w-[55px]">20&apos;</th>
                      <th className="text-center p-1 min-w-[55px]">40&apos;</th>
                      <th className="text-center p-1 min-w-[70px]">E.T.C</th>
                    </>
                  )}
                  <th className="text-center p-1 min-w-[70px]">담당자</th>
                  <th className="text-center p-1 min-w-[90px]">전화</th>
                  <th className="text-center p-1 min-w-[90px]">팩스</th>
                  <th className="text-center p-1 min-w-[120px]">E-mail</th>
                </tr>
              </thead>
              <tbody>
                {transportRateList.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-50)]">
                    <td className="p-1 text-center">
                      <input type="checkbox" checked={selectedTransportRows.includes(row.id)}
                        onChange={(e) => setSelectedTransportRows(e.target.checked ? [...selectedTransportRows, row.id] : selectedTransportRows.filter(id => id !== row.id))} className="rounded" />
                    </td>
                    <td className="p-1 text-center">
                      <div className="flex gap-0.5 items-center">
                        <input type="text" value={row.rateCd} onChange={(e) => updateTransport(row.id, 'rateCd', e.target.value)} className={inputCls} placeholder="코드" />
                        <button onClick={() => handleCodeSearch('transportRateCd', 'carrier', row.id)} className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-[var(--surface-100)] border border-[var(--border)] rounded hover:bg-[var(--surface-200)]" title="운임코드 검색">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </button>
                      </div>
                    </td>
                    <td className="p-1 text-center">
                      <div className="flex gap-0.5 items-center">
                        <input type="text" value={row.originCd} onChange={(e) => updateTransport(row.id, 'originCd', e.target.value)} className={inputCls} placeholder="코드" />
                        <button onClick={() => handleCitySearch('transportOrigin', row.id)} className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-[var(--surface-100)] border border-[var(--border)] rounded hover:bg-[var(--surface-200)]" title="출발지 검색">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </button>
                      </div>
                    </td>
                    <td className="p-1 text-center"><input type="text" value={row.originNm} onChange={(e) => updateTransport(row.id, 'originNm', e.target.value)} className={inputCls} placeholder="출발지명" /></td>
                    <td className="p-1 text-center">
                      <div className="flex gap-0.5 items-center">
                        <input type="text" value={row.destCd} onChange={(e) => updateTransport(row.id, 'destCd', e.target.value)} className={inputCls} placeholder="코드" />
                        <button onClick={() => handleCitySearch('transportDest', row.id)} className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-[var(--surface-100)] border border-[var(--border)] rounded hover:bg-[var(--surface-200)]" title="도착지 검색">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </button>
                      </div>
                    </td>
                    <td className="p-1 text-center"><input type="text" value={row.destNm} onChange={(e) => updateTransport(row.id, 'destNm', e.target.value)} className={inputCls} placeholder="도착지명" /></td>
                    {formData.category === 'air' ? (
                      <>
                        <td className="p-1 text-center"><input type="text" value={row.etcDesc} onChange={(e) => updateTransport(row.id, 'etcDesc', e.target.value)} className={inputCls} placeholder="E.T.C" /></td>
                        <td className="p-1 text-center">
                          <select value={(row as AirTransportRate).vehicleType} onChange={(e) => updateTransport(row.id, 'vehicleType', e.target.value)}
                            className="w-full min-w-[80px] px-1 py-1 bg-[var(--surface-50)] border border-[var(--border)] rounded text-xs">
                            <option value="">선택</option><option value="1톤">1톤</option><option value="2.5톤">2.5톤</option><option value="5톤">5톤</option><option value="11톤">11톤</option><option value="25톤">25톤</option>
                          </select>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-1 text-center"><input type="number" value={(row as SeaTransportRate).rateLcl} onChange={(e) => updateTransport(row.id, 'rateLcl', parseFloat(e.target.value) || 0)} className={inputCls} /></td>
                        <td className="p-1 text-center"><input type="number" value={(row as SeaTransportRate).rate20ft} onChange={(e) => updateTransport(row.id, 'rate20ft', parseFloat(e.target.value) || 0)} className={inputCls} /></td>
                        <td className="p-1 text-center"><input type="number" value={(row as SeaTransportRate).rate40ft} onChange={(e) => updateTransport(row.id, 'rate40ft', parseFloat(e.target.value) || 0)} className={inputCls} /></td>
                        <td className="p-1 text-center"><input type="text" value={row.etcDesc} onChange={(e) => updateTransport(row.id, 'etcDesc', e.target.value)} className={inputCls} placeholder="E.T.C" /></td>
                      </>
                    )}
                    <td className="p-1 text-center"><input type="text" value={row.contactNm} onChange={(e) => updateTransport(row.id, 'contactNm', e.target.value)} className={inputCls} placeholder="담당자" /></td>
                    <td className="p-1 text-center"><input type="text" value={row.contactTel} onChange={(e) => updateTransport(row.id, 'contactTel', e.target.value)} className={inputCls} placeholder="전화" /></td>
                    <td className="p-1 text-center"><input type="text" value={row.contactFax} onChange={(e) => updateTransport(row.id, 'contactFax', e.target.value)} className={inputCls} placeholder="팩스" /></td>
                    <td className="p-1 text-center"><input type="text" value={row.contactEmail} onChange={(e) => updateTransport(row.id, 'contactEmail', e.target.value)} className={inputCls} placeholder="이메일" /></td>
                  </tr>
                ))}
                {transportRateList.length === 0 && (
                  <tr><td colSpan={formData.category === 'air' ? 14 : 15} className="p-3 text-center text-[var(--muted)] text-xs">운송요율을 추가해주세요.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <CloseConfirmModal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} onConfirm={handleConfirmClose} />
      <CodeSearchModal isOpen={showCodeSearchModal} onClose={() => setShowCodeSearchModal(false)} onSelect={handleCodeSelect} codeType={codeSearchType} />
      <LocationCodeModal isOpen={showLocationModal} onClose={() => setShowLocationModal(false)} onSelect={handleLocationSelect} type={locationSearchType} />
      <CityCodeModal isOpen={showCityModal} onClose={() => setShowCityModal(false)} onSelect={handleCitySelect} />
      <CorporateRateSearchModal
        isOpen={showCorporateRateModal}
        onClose={() => setShowCorporateRateModal(false)}
        onSelect={handleCorporateRateSelect}
        type={formData.category as 'sea' | 'air'}
        defaultOrigin={formData.originCode}
        defaultDestination={formData.destinationCode}
      />
    </PageLayout>
  );
}

export default function QuoteRequestRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)] flex items-center justify-center">Loading...</div>}>
      <QuoteRequestRegisterContent />
    </Suspense>
  );
}
