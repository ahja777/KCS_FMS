'use client';

import { useRouter } from 'next/navigation';
import { LIST_PATHS } from '@/constants/paths';

import { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import DateRangeButtons, { getToday } from '@/components/DateRangeButtons';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';

// 이미지 분석 기반 인터페이스
interface CargoReleaseData {
  id: number;
  checked: boolean;
  receiptNo: string;      // 반입번호
  receiptDate: string;    // 반입일자
  arrivalDate: string;    // 입항일자
  mrn: string;            // MRN
  msn: string;            // MSN
  hsn: string;            // HSN
  receiptType: string;    // 반입구분
  mblNo: string;          // M B/L (Master B/L)
  hblNo: string;          // H B/L (House B/L)
  inQty: number;          // 입고수량
  inWeight: number;       // 입고중량
  inVolume: number;       // 입고용적
  outQty: number;         // 출고수량
  outWeight: number;      // 출고중량
  outVolume: number;      // 출고용적
  stockQty: number;       // 재고수량
  stockWeight: number;    // 재고중량
  stockVolume: number;    // 재고용적
}

type SortField = 'receiptNo' | 'receiptDate' | 'arrivalDate' | 'mrn' | 'msn' | 'hsn' | 'receiptType' | 'mblNo' | 'hblNo' | 'inQty' | 'inWeight' | 'inVolume' | 'outQty' | 'outWeight' | 'outVolume' | 'stockQty' | 'stockWeight' | 'stockVolume';
type SortDirection = 'asc' | 'desc' | null;

// 유니패스 수입화물 조회 결과 인터페이스
interface UnipassImportResult {
  cargoMgtNo: string;
  mblNo: string;
  hblNo: string;
  mrn: string;
  msn: string;
  hsn: string;
  receiptDt: string;
  arrivalDt: string;
  cargoStatus: string;
  processStatus: string;
  containerNo: string;
  cargoType: string;
  packageQty: number;
  grossWeight: number;
  cbm: number;
  shipperNm: string;
  consigneeNm: string;
  customsOffice: string;
  bondedArea: string;
  checked?: boolean;
}

const mockData: CargoReleaseData[] = [
  { id: 1, checked: false, receiptNo: '26PUS001234', receiptDate: '2026-01-22', arrivalDate: '2026-01-20', mrn: 'M26010001234', msn: 'S001', hsn: 'H001', receiptType: '일반반입', mblNo: 'HDMU1234567', hblNo: 'HBLK202610001', inQty: 500, inWeight: 12000, inVolume: 65.5, outQty: 200, outWeight: 4800, outVolume: 26.2, stockQty: 300, stockWeight: 7200, stockVolume: 39.3 },
  { id: 2, checked: false, receiptNo: '26ICN005678', receiptDate: '2026-01-23', arrivalDate: '2026-01-21', mrn: 'M26010005678', msn: 'S002', hsn: 'H002', receiptType: '보세운송', mblNo: 'MAEU5678901', hblNo: 'HBLK202610002', inQty: 200, inWeight: 8000, inVolume: 45.2, outQty: 50, outWeight: 2000, outVolume: 11.3, stockQty: 150, stockWeight: 6000, stockVolume: 33.9 },
  { id: 3, checked: false, receiptNo: '26PUS002345', receiptDate: '2026-01-24', arrivalDate: '2026-01-22', mrn: 'M26010002345', msn: 'S003', hsn: 'H003', receiptType: '일반반입', mblNo: 'MSCU2345678', hblNo: 'HBLK202610003', inQty: 800, inWeight: 18000, inVolume: 72.0, outQty: 0, outWeight: 0, outVolume: 0, stockQty: 800, stockWeight: 18000, stockVolume: 72.0 },
  { id: 4, checked: false, receiptNo: '26KWG009876', receiptDate: '2026-01-25', arrivalDate: '2026-01-23', mrn: 'M26010009876', msn: 'S004', hsn: 'H004', receiptType: '환적반입', mblNo: 'COSU9876543', hblNo: 'HBLK202610004', inQty: 350, inWeight: 15000, inVolume: 58.0, outQty: 100, outWeight: 4285, outVolume: 16.6, stockQty: 250, stockWeight: 10715, stockVolume: 41.4 },
  { id: 5, checked: false, receiptNo: '26PUS001122', receiptDate: '2026-01-26', arrivalDate: '2026-01-24', mrn: 'M26010001122', msn: 'S005', hsn: 'H005', receiptType: '일반반입', mblNo: 'YMLU1122334', hblNo: 'HBLK202610005', inQty: 150, inWeight: 5500, inVolume: 32.0, outQty: 0, outWeight: 0, outVolume: 0, stockQty: 150, stockWeight: 5500, stockVolume: 32.0 },
];

export default function CargoReleasePage() {
  const formRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const today = getToday();
  const [filters, setFilters] = useState({
    startDate: today,
    endDate: today,
    receiptNo: '',
    mblNo: '',
    hblNo: '',
    mrn: '',
    receiptType: '',
  });
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [data, setData] = useState<CargoReleaseData[]>(mockData);

  // 정렬 상태
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // 유니패스 팝업 상태
  const [showImportPopup, setShowImportPopup] = useState(false);
  const [showExportPopup, setShowExportPopup] = useState(false);

  // 수입화물추적 검색 상태
  const [importSearch, setImportSearch] = useState({
    searchType: 'mbl',
    mblNo: '',
    hblNo: '',
    year: '2026',
    cargoMgtNo: '',
  });
  const [importResults, setImportResults] = useState<CargoReleaseData[]>([]);
  const [importActiveTab, setImportActiveTab] = useState('건별');

  // 유니패스 연동 상태
  const [unipassResults, setUnipassResults] = useState<UnipassImportResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');

  // 해외직구 통관정보조회 상태
  const [overseasSearch, setOverseasSearch] = useState({
    trackingNo: '',
    year: '2026',
  });
  const [overseasResults, setOverseasResults] = useState<{id: number; trackingNo: string; status: string; itemName: string; declDate: string; weight: string; value: string;}[]>([]);

  // Import cargo tracking 상태
  const [trackingSearch, setTrackingSearch] = useState({
    mblNo: '',
    hblNo: '',
    year: '2026',
  });
  const [trackingResults, setTrackingResults] = useState<{id: number; cargoMgtNo: string; blNo: string; arrivalDate: string; port: string; carrier: string; pkgCount: number; weight: number;}[]>([]);

  // B/L정보조회 상태
  const [blInfoSearch, setBlInfoSearch] = useState({
    blNo: '',
    year: '2026',
  });
  const [blInfoResults, setBlInfoResults] = useState<{id: number; blNo: string; shipper: string; consignee: string; pol: string; pod: string; etd: string; eta: string; vessel: string;}[]>([]);

  // SMS통보설정 상태
  const [smsSettings, setSmsSettings] = useState({
    phoneNo: '',
    blNo: '',
    notifications: {
      arrival: true,
      customs: true,
      release: false,
    },
  });
  const [smsRegistered, setSmsRegistered] = useState<{id: number; phoneNo: string; blNo: string; regDate: string; status: string;}[]>([]);

  // 수출통관 검색 상태
  const [exportActiveTab, setExportActiveTab] = useState('신고조회');
  const [exportSearch, setExportSearch] = useState({
    startYear: '2026',
    startMonth: '01',
    endYear: '2026',
    endMonth: '02',
    searchType: 'individual',
    exportDeclNo: '',
    periodType: 'custom',
  });
  const [exportResults, setExportResults] = useState<{id: number; exportDeclNo: string; acceptDate: string; exporterName: string; goodsName: string; quantity: string; amount: string; status: string;}[]>([]);

  // 수출이행내역 상태
  const [exportPerformSearch, setExportPerformSearch] = useState({
    exportDeclNo: '',
    year: '2026',
  });
  const [exportPerformResults, setExportPerformResults] = useState<{id: number; exportDeclNo: string; loadDate: string; vessel: string; blNo: string; quantity: string; weight: string; status: string;}[]>([]);

  // 적하목록정보 상태
  const [manifestSearch, setManifestSearch] = useState({
    blNo: '',
    year: '2026',
  });
  const [manifestResults, setManifestResults] = useState<{id: number; manifestNo: string; blNo: string; vessel: string; voyage: string; pol: string; pod: string; etd: string; pkgCount: number;}[]>([]);

  // Export cargo tracking 상태
  const [exportTrackingSearch, setExportTrackingSearch] = useState({
    mblNo: '',
    hblNo: '',
    year: '2026',
  });
  const [exportTrackingResults, setExportTrackingResults] = useState<{id: number; cargoMgtNo: string; blNo: string; loadDate: string; port: string; vessel: string; pkgCount: number; weight: number;}[]>([]);

  const handleDateRangeSelect = (startDate: string, endDate: string) => {
    setFilters(prev => ({ ...prev, startDate, endDate }));
  };

  const handleSearch = () => setAppliedFilters(filters);
  const handleReset = () => {
    const resetFilters = { startDate: today, endDate: today, receiptNo: '', mblNo: '', hblNo: '', mrn: '', receiptType: '' };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
  };

  // 전체 선택/해제
  const handleSelectAll = (checked: boolean) => {
    setData(prev => prev.map(item => ({ ...item, checked })));
  };

  // 개별 선택
  const handleSelectItem = (id: number, checked: boolean) => {
    setData(prev => prev.map(item => item.id === id ? { ...item, checked } : item));
  };

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (appliedFilters.receiptNo && !item.receiptNo.includes(appliedFilters.receiptNo)) return false;
      if (appliedFilters.mblNo && !item.mblNo.includes(appliedFilters.mblNo)) return false;
      if (appliedFilters.hblNo && !item.hblNo.includes(appliedFilters.hblNo)) return false;
      if (appliedFilters.mrn && !item.mrn.includes(appliedFilters.mrn)) return false;
      if (appliedFilters.receiptType && item.receiptType !== appliedFilters.receiptType) return false;
      return true;
    });
  }, [data, appliedFilters]);

  // 정렬된 데이터
  const sortedData = useMemo(() => {
    if (!sortField || !sortDirection) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortField) {
        case 'receiptNo': aValue = a.receiptNo; bValue = b.receiptNo; break;
        case 'receiptDate': aValue = a.receiptDate; bValue = b.receiptDate; break;
        case 'arrivalDate': aValue = a.arrivalDate; bValue = b.arrivalDate; break;
        case 'mrn': aValue = a.mrn; bValue = b.mrn; break;
        case 'msn': aValue = a.msn; bValue = b.msn; break;
        case 'hsn': aValue = a.hsn; bValue = b.hsn; break;
        case 'receiptType': aValue = a.receiptType; bValue = b.receiptType; break;
        case 'mblNo': aValue = a.mblNo; bValue = b.mblNo; break;
        case 'hblNo': aValue = a.hblNo; bValue = b.hblNo; break;
        case 'inQty': aValue = a.inQty; bValue = b.inQty; break;
        case 'inWeight': aValue = a.inWeight; bValue = b.inWeight; break;
        case 'inVolume': aValue = a.inVolume; bValue = b.inVolume; break;
        case 'outQty': aValue = a.outQty; bValue = b.outQty; break;
        case 'outWeight': aValue = a.outWeight; bValue = b.outWeight; break;
        case 'outVolume': aValue = a.outVolume; bValue = b.outVolume; break;
        case 'stockQty': aValue = a.stockQty; bValue = b.stockQty; break;
        case 'stockWeight': aValue = a.stockWeight; bValue = b.stockWeight; break;
        case 'stockVolume': aValue = a.stockVolume; bValue = b.stockVolume; break;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const comparison = String(aValue).localeCompare(String(bValue), 'ko');
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortField, sortDirection]);

  // 정렬 핸들러
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else if (sortDirection === 'desc') { setSortField(null); setSortDirection(null); }
      else setSortDirection('asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 정렬 아이콘 렌더링
  const renderSortIcon = (field: SortField) => {
    const isActive = sortField === field;
    return (
      <span className="inline-flex flex-col ml-1">
        <svg className={`w-3 h-3 -mb-1 ${isActive && sortDirection === 'asc' ? 'text-blue-400' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M7 14l5-5 5 5H7z" /></svg>
        <svg className={`w-3 h-3 ${isActive && sortDirection === 'desc' ? 'text-blue-400' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5H7z" /></svg>
      </span>
    );
  };

  // 요약 통계
  const summaryStats = {
    total: sortedData.length,
    totalInQty: sortedData.reduce((sum, d) => sum + d.inQty, 0),
    totalOutQty: sortedData.reduce((sum, d) => sum + d.outQty, 0),
    totalStockQty: sortedData.reduce((sum, d) => sum + d.stockQty, 0),
  };

  // 수입화물추적 조회 (유니패스 API 연동)
  const handleImportSearch = async (searchAllYears = false) => {
    // 검색 조건 검증
    if (importSearch.searchType === 'mbl') {
      if (!importSearch.mblNo && !importSearch.hblNo) {
        setSearchMessage('M B/L 또는 H B/L을 입력해주세요.');
        return;
      }
    } else {
      if (!importSearch.cargoMgtNo) {
        setSearchMessage('화물관리번호를 입력해주세요.');
        return;
      }
    }

    setIsSearching(true);
    setSearchMessage('');
    setUnipassResults([]);

    try {
      const params = new URLSearchParams();
      if (importSearch.searchType === 'mbl') {
        if (importSearch.mblNo) params.append('mblNo', importSearch.mblNo);
        if (importSearch.hblNo) params.append('hblNo', importSearch.hblNo);
      } else {
        params.append('cargoMgtNo', importSearch.cargoMgtNo);
      }
      params.append('year', importSearch.year);
      if (searchAllYears) params.append('searchAllYears', 'true');

      const response = await fetch(`/api/unipass/import-cargo?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        if (data.results.length > 0) {
          // 팝업에서는 검색 결과를 그대로 표시 (중복 M B/L도 모두 표시)
          // 중복 처리는 등록 시점(handleRegisterCargo)에서만 수행
          setUnipassResults(data.results.map((r: UnipassImportResult) => ({ ...r, checked: false })));
          setSearchMessage(`${data.results.length}건의 화물 정보를 조회했습니다. (${data.searchedYear}년)`);
        } else if (data.needsAllYearSearch && !searchAllYears) {
          setSearchMessage(`${importSearch.year}년 검색 결과가 없습니다. 전체 연도 검색을 시도합니다...`);
          // 자동으로 전체 연도 검색 실행
          setTimeout(() => handleImportSearch(true), 500);
          return;
        } else {
          setSearchMessage(data.message || '검색 결과가 없습니다.');
        }
      } else {
        setSearchMessage(data.error || '조회 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('유니패스 조회 오류:', error);
      setSearchMessage('유니패스 조회 중 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  // 선택된 화물 등록
  const handleRegisterCargo = async () => {
    const selectedItems = unipassResults.filter(item => item.checked);
    if (selectedItems.length === 0) {
      alert('등록할 항목을 선택해주세요.');
      return;
    }

    try {
      const results = [];
      let updatedCount = 0;
      let newCount = 0;

      for (const item of selectedItems) {
        // 기존 데이터에서 동일한 M B/L이 있는지 확인
        const existingItem = data.find(d => d.mblNo === item.mblNo && item.mblNo);
        const itemDate = new Date(item.receiptDt || item.arrivalDt);

        if (existingItem) {
          // 기존 데이터가 있는 경우 날짜 비교
          const existingDate = new Date(existingItem.receiptDate || existingItem.arrivalDate);
          if (itemDate <= existingDate) {
            // 기존 데이터가 더 최신이거나 같으면 건너뜀
            continue;
          }
          // 기존 데이터보다 더 최신이면 업데이트
          const response = await fetch('/api/cargo/release', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: existingItem.id,
              receiptDt: item.receiptDt,
              arrivalDt: item.arrivalDt,
              mrn: item.mrn,
              msn: item.msn,
              hsn: item.hsn,
              receiptTypeCd: 'IMPORT',
              mblNo: item.mblNo,
              hblNo: item.hblNo,
              cargoMgtNo: item.cargoMgtNo,
              containerNo: item.containerNo,
              cargoType: item.cargoType,
              packageQty: item.packageQty,
              grossWeight: item.grossWeight,
              cbm: item.cbm,
              cargoStatus: item.cargoStatus,
              processStatus: item.processStatus,
              shipperNm: item.shipperNm,
              consigneeNm: item.consigneeNm,
              customsOffice: item.customsOffice,
              bondedArea: item.bondedArea,
            }),
          });
          const result = await response.json();
          if (result.success) {
            updatedCount++;
            // 화물반출입 목록 업데이트
            setData(prev => prev.map(d => d.id === existingItem.id ? {
              ...d,
              receiptDate: item.receiptDt,
              arrivalDate: item.arrivalDt,
              mrn: item.mrn,
              msn: item.msn,
              hsn: item.hsn,
              mblNo: item.mblNo,
              hblNo: item.hblNo,
              inQty: item.packageQty,
              inWeight: item.grossWeight,
              inVolume: item.cbm,
              stockQty: item.packageQty,
              stockWeight: item.grossWeight,
              stockVolume: item.cbm,
            } : d));
          }
        } else {
          // 신규 등록
          const response = await fetch('/api/cargo/release', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              receiptDt: item.receiptDt,
              arrivalDt: item.arrivalDt,
              mrn: item.mrn,
              msn: item.msn,
              hsn: item.hsn,
              receiptTypeCd: 'IMPORT',
              mblNo: item.mblNo,
              hblNo: item.hblNo,
              cargoMgtNo: item.cargoMgtNo,
              containerNo: item.containerNo,
              cargoType: item.cargoType,
              packageQty: item.packageQty,
              grossWeight: item.grossWeight,
              cbm: item.cbm,
              cargoStatus: item.cargoStatus,
              processStatus: item.processStatus,
              shipperNm: item.shipperNm,
              consigneeNm: item.consigneeNm,
              customsOffice: item.customsOffice,
              bondedArea: item.bondedArea,
            }),
          });
          const result = await response.json();
          if (result.success) {
            results.push(result);
            newCount++;
            // 화물반출입 목록에 추가
            const newItem: CargoReleaseData = {
              id: result.id,
              checked: false,
              receiptNo: result.receiptNo,
              receiptDate: item.receiptDt,
              arrivalDate: item.arrivalDt,
              mrn: item.mrn,
              msn: item.msn,
              hsn: item.hsn,
              receiptType: 'IMPORT',
              mblNo: item.mblNo,
              hblNo: item.hblNo,
              inQty: item.packageQty,
              inWeight: item.grossWeight,
              inVolume: item.cbm,
              outQty: 0,
              outWeight: 0,
              outVolume: 0,
              stockQty: item.packageQty,
              stockWeight: item.grossWeight,
              stockVolume: item.cbm,
            };
            setData(prev => [newItem, ...prev]);
          }
        }
      }
      const messages = [];
      if (newCount > 0) messages.push(`신규 ${newCount}건`);
      if (updatedCount > 0) messages.push(`업데이트 ${updatedCount}건`);
      const skippedCount = selectedItems.length - newCount - updatedCount;
      if (skippedCount > 0) messages.push(`건너뜀 ${skippedCount}건 (기존 데이터가 더 최신)`);
      alert(`화물 등록 완료: ${messages.join(', ')}`);
      setUnipassResults([]);
      setShowImportPopup(false);
    } catch (error) {
      console.error('화물 등록 오류:', error);
      alert('화물 등록 중 오류가 발생했습니다.');
    }
  };

  // 유니패스 결과 선택 토글
  const handleUnipassResultCheck = (index: number) => {
    setUnipassResults(prev => prev.map((item, i) =>
      i === index ? { ...item, checked: !item.checked } : item
    ));
  };

  // 유니패스 결과 전체 선택
  const handleUnipassResultCheckAll = (checked: boolean) => {
    setUnipassResults(prev => prev.map(item => ({ ...item, checked })));
  };

  const handleImportReset = () => {
    setImportSearch({ searchType: 'mbl', mblNo: '', hblNo: '', year: '2026', cargoMgtNo: '' });
    setImportResults([]);
    setUnipassResults([]);
    setSearchMessage('');
  };

  // 해외직구 통관정보조회
  const handleOverseasSearch = () => {
    if (!overseasSearch.trackingNo) {
      setOverseasResults([]);
      return;
    }
    // 샘플 결과 데이터
    setOverseasResults([
      { id: 1, trackingNo: overseasSearch.trackingNo, status: '통관완료', itemName: '의류/패션잡화', declDate: '2026-01-15', weight: '2.5kg', value: '$150' },
      { id: 2, trackingNo: overseasSearch.trackingNo + '-2', status: '심사중', itemName: '전자제품', declDate: '2026-01-18', weight: '1.2kg', value: '$89' },
    ]);
  };

  const handleOverseasReset = () => {
    setOverseasSearch({ trackingNo: '', year: '2026' });
    setOverseasResults([]);
  };

  // Import cargo tracking 조회
  const handleTrackingSearch = () => {
    if (!trackingSearch.mblNo && !trackingSearch.hblNo) {
      setTrackingResults([]);
      return;
    }
    // 샘플 결과 데이터
    setTrackingResults([
      { id: 1, cargoMgtNo: 'M26010001234', blNo: trackingSearch.mblNo || trackingSearch.hblNo, arrivalDate: '2026-01-20', port: 'KRPUS', carrier: 'Hanjin Shipping', pkgCount: 50, weight: 1250 },
      { id: 2, cargoMgtNo: 'M26010005678', blNo: trackingSearch.mblNo || trackingSearch.hblNo, arrivalDate: '2026-01-22', port: 'KRINC', carrier: 'COSCO', pkgCount: 30, weight: 850 },
    ]);
  };

  const handleTrackingReset = () => {
    setTrackingSearch({ mblNo: '', hblNo: '', year: '2026' });
    setTrackingResults([]);
  };

  // B/L정보조회
  const handleBlInfoSearch = () => {
    if (!blInfoSearch.blNo) {
      setBlInfoResults([]);
      return;
    }
    // 샘플 결과 데이터
    setBlInfoResults([
      { id: 1, blNo: blInfoSearch.blNo, shipper: 'Samsung Electronics', consignee: 'ABC Trading Co.', pol: 'KRPUS', pod: 'USLAX', etd: '2026-01-10', eta: '2026-01-25', vessel: 'HANJIN BUSAN V.001E' },
    ]);
  };

  const handleBlInfoReset = () => {
    setBlInfoSearch({ blNo: '', year: '2026' });
    setBlInfoResults([]);
  };

  // SMS통보설정 등록
  const handleSmsRegister = () => {
    if (!smsSettings.phoneNo || !smsSettings.blNo) {
      alert('휴대폰번호와 B/L번호를 입력해주세요.');
      return;
    }
    const newEntry = {
      id: smsRegistered.length + 1,
      phoneNo: smsSettings.phoneNo,
      blNo: smsSettings.blNo,
      regDate: new Date().toISOString().split('T')[0],
      status: '등록완료',
    };
    setSmsRegistered([...smsRegistered, newEntry]);
    setSmsSettings({ phoneNo: '', blNo: '', notifications: { arrival: true, customs: true, release: false } });
    alert('SMS 알림이 등록되었습니다.');
  };

  // 수출신고조회
  const handleExportSearch = () => {
    if (!exportSearch.exportDeclNo && exportSearch.searchType === 'individual') {
      setExportResults([]);
      return;
    }
    // 샘플 데이터
    setExportResults([
      { id: 1, exportDeclNo: exportSearch.exportDeclNo || '123-45-6789012-0', acceptDate: '2026-01-15', exporterName: '삼성전자(주)', goodsName: '반도체 부품', quantity: '1,000 EA', amount: '$150,000', status: '수리' },
      { id: 2, exportDeclNo: '123-45-6789013-0', acceptDate: '2026-01-18', exporterName: 'LG전자(주)', goodsName: '디스플레이 패널', quantity: '500 EA', amount: '$80,000', status: '수리' },
    ]);
  };

  const handleExportReset = () => {
    setExportSearch({ startYear: '2026', startMonth: '01', endYear: '2026', endMonth: '02', searchType: 'individual', exportDeclNo: '', periodType: 'custom' });
    setExportResults([]);
  };

  // 기간 버튼 핸들러
  const handleExportPeriod = (type: string) => {
    const now = new Date();
    let startMonth = now.getMonth() + 1;
    let startYear = now.getFullYear();

    if (type === 'month') {
      startMonth = now.getMonth(); // 전월
      if (startMonth === 0) { startMonth = 12; startYear--; }
    } else if (type === 'quarter') {
      startMonth = Math.floor((now.getMonth()) / 3) * 3 + 1; // 분기 시작
    } else if (type === 'half') {
      startMonth = now.getMonth() < 6 ? 1 : 7;
    } else if (type === 'year') {
      startMonth = 1;
    }

    setExportSearch(prev => ({
      ...prev,
      periodType: type,
      startYear: String(startYear),
      startMonth: String(startMonth).padStart(2, '0'),
      endYear: String(now.getFullYear()),
      endMonth: String(now.getMonth() + 1).padStart(2, '0'),
    }));
  };

  // 수출이행내역 조회
  const handleExportPerformSearch = () => {
    if (!exportPerformSearch.exportDeclNo) {
      setExportPerformResults([]);
      return;
    }
    setExportPerformResults([
      { id: 1, exportDeclNo: exportPerformSearch.exportDeclNo, loadDate: '2026-01-20', vessel: 'HANJIN BUSAN V.001E', blNo: 'HDMU1234567', quantity: '1,000 EA', weight: '5,000 kg', status: '선적완료' },
      { id: 2, exportDeclNo: exportPerformSearch.exportDeclNo, loadDate: '2026-01-22', vessel: 'COSCO SHIPPING V.023W', blNo: 'COSU9876543', quantity: '500 EA', weight: '2,500 kg', status: '선적완료' },
    ]);
  };

  const handleExportPerformReset = () => {
    setExportPerformSearch({ exportDeclNo: '', year: '2026' });
    setExportPerformResults([]);
  };

  // 적하목록정보 조회
  const handleManifestSearch = () => {
    if (!manifestSearch.blNo) {
      setManifestResults([]);
      return;
    }
    setManifestResults([
      { id: 1, manifestNo: 'MF2026012001', blNo: manifestSearch.blNo, vessel: 'HANJIN BUSAN', voyage: 'V.001E', pol: 'KRPUS', pod: 'USLAX', etd: '2026-01-25', pkgCount: 100 },
    ]);
  };

  const handleManifestReset = () => {
    setManifestSearch({ blNo: '', year: '2026' });
    setManifestResults([]);
  };

  // Export cargo tracking 조회
  const handleExportTrackingSearch = () => {
    if (!exportTrackingSearch.mblNo && !exportTrackingSearch.hblNo) {
      setExportTrackingResults([]);
      return;
    }
    setExportTrackingResults([
      { id: 1, cargoMgtNo: 'E26010001234', blNo: exportTrackingSearch.mblNo || exportTrackingSearch.hblNo, loadDate: '2026-01-20', port: 'KRPUS', vessel: 'Hanjin Shipping', pkgCount: 50, weight: 1250 },
      { id: 2, cargoMgtNo: 'E26010005678', blNo: exportTrackingSearch.mblNo || exportTrackingSearch.hblNo, loadDate: '2026-01-22', port: 'KRINC', vessel: 'COSCO', pkgCount: 30, weight: 850 },
    ]);
  };

  const handleExportTrackingReset = () => {
    setExportTrackingSearch({ mblNo: '', hblNo: '', year: '2026' });
    setExportTrackingResults([]);
  };

  // 엑셀 다운로드
  const handleExcelDownload = () => {
    const headers = ['No', '반입번호', '반입일자', '입항일자', 'MRN', 'MSN', 'HSN', '반입구분', 'M B/L', 'H B/L', '입고수량', '입고중량', '입고용적', '출고수량', '출고중량', '출고용적', '재고수량', '재고중량', '재고용적'];
    const rows = sortedData.map((item, idx) => [
      idx + 1, item.receiptNo, item.receiptDate, item.arrivalDate, item.mrn, item.msn, item.hsn, item.receiptType, item.mblNo, item.hblNo,
      item.inQty, item.inWeight, item.inVolume, item.outQty, item.outWeight, item.outVolume, item.stockQty, item.stockWeight, item.stockVolume,
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `화물반출입관리_${today.replace(/-/g, '')}.csv`;
    link.click();
  };

  // 엑셀 업로드
  const handleExcelUpload = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      alert(`파일 "${file.name}"이 선택되었습니다.\n실제 업로드 기능은 API 연동 후 구현됩니다.`);
      e.target.value = '';
    }
  };

  const handleConfirmClose = () => {
    setShowCloseModal(false);
    router.push(LIST_PATHS.DASHBOARD);
  };

  useCloseConfirm({ showModal: showCloseModal, setShowModal: setShowCloseModal, onConfirmClose: handleConfirmClose });

  const isAllChecked = sortedData.length > 0 && sortedData.every(d => d.checked);

  return (
    <PageLayout title="화물반출입관리" subtitle="Logis > Seller > 화물반출입관리" showCloseButton={false}>
      <main ref={formRef} className="p-6">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx,.xls,.csv" className="hidden" />

        {/* 검색조건 */}
        <div className="card mb-6">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="font-bold">검색조건</h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowImportPopup(true)} className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg bg-[#0066CC] text-white hover:bg-[#0052A3]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                유니패스(수입)
              </button>
              <button onClick={() => setShowExportPopup(true)} className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg bg-[#28A745] text-white hover:bg-[#218838]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                유니패스(수출)
              </button>
              <button onClick={handleExcelDownload} className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg bg-[#107C41] text-white hover:bg-[#0B5A2E]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                엑셀 다운로드
              </button>
              <button onClick={handleExcelUpload} className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg bg-[#ED7D31] text-white hover:bg-[#D46A1E]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                엑셀 업로드
              </button>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-end gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">반입일자</label>
                <div className="flex gap-2 items-center">
                  <input type="date" value={filters.startDate} onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))} className="w-[140px] h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" />
                  <span className="text-[var(--muted)]">~</span>
                  <input type="date" value={filters.endDate} onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))} className="w-[140px] h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" />
                  <DateRangeButtons onRangeSelect={handleDateRangeSelect} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">반입번호</label>
                <input type="text" value={filters.receiptNo} onChange={e => setFilters(prev => ({ ...prev, receiptNo: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="26PUS001234" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">M B/L</label>
                <input type="text" value={filters.mblNo} onChange={e => setFilters(prev => ({ ...prev, mblNo: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="HDMU1234567" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">H B/L</label>
                <input type="text" value={filters.hblNo} onChange={e => setFilters(prev => ({ ...prev, hblNo: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="HBLK202610001" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">MRN</label>
                <input type="text" value={filters.mrn} onChange={e => setFilters(prev => ({ ...prev, mrn: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="M26010001234" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">반입구분</label>
                <select value={filters.receiptType} onChange={e => setFilters(prev => ({ ...prev, receiptType: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm">
                  <option value="">전체</option>
                  <option value="일반반입">일반반입</option>
                  <option value="보세운송">보세운송</option>
                  <option value="환적반입">환적반입</option>
                </select>
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-[var(--border)] flex justify-center gap-2">
            <button onClick={handleSearch} className="px-6 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] font-medium">조회</button>
            <button onClick={handleReset} className="px-6 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">초기화</button>
          </div>
        </div>

        {/* 요약 통계 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card p-4 text-center"><div className="text-2xl font-bold">{summaryStats.total}</div><div className="text-sm text-[var(--muted)]">전체 건수</div></div>
          <div className="card p-4 text-center"><div className="text-2xl font-bold text-blue-500">{summaryStats.totalInQty.toLocaleString()}</div><div className="text-sm text-[var(--muted)]">총 입고수량</div></div>
          <div className="card p-4 text-center"><div className="text-2xl font-bold text-orange-500">{summaryStats.totalOutQty.toLocaleString()}</div><div className="text-sm text-[var(--muted)]">총 출고수량</div></div>
          <div className="card p-4 text-center"><div className="text-2xl font-bold text-green-500">{summaryStats.totalStockQty.toLocaleString()}</div><div className="text-sm text-[var(--muted)]">총 재고수량</div></div>
        </div>

        {/* 데이터 테이블 */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              <h3 className="font-bold">화물반출입 목록</h3>
              <span className="text-sm text-[var(--muted)]">({sortedData.length}건)</span>
            </div>
            <div className="text-xs text-[var(--muted)]">컬럼 헤더를 클릭하면 정렬됩니다</div>
          </div>
          <div className="overflow-x-auto">
            <table className="table w-full text-sm">
              <thead>
                <tr>
                  <th className="text-center w-10 px-2 py-2">No</th>
                  <th className="text-center w-10 px-2 py-2">
                    <input type="checkbox" checked={isAllChecked} onChange={e => handleSelectAll(e.target.checked)} className="w-4 h-4" />
                  </th>
                  <th className="text-center cursor-pointer select-none px-2 py-2" onClick={() => handleSort('receiptNo')}><div className="flex items-center justify-center whitespace-nowrap">반입번호{renderSortIcon('receiptNo')}</div></th>
                  <th className="text-center cursor-pointer select-none px-2 py-2" onClick={() => handleSort('receiptDate')}><div className="flex items-center justify-center whitespace-nowrap">반입일자{renderSortIcon('receiptDate')}</div></th>
                  <th className="text-center cursor-pointer select-none px-2 py-2" onClick={() => handleSort('arrivalDate')}><div className="flex items-center justify-center whitespace-nowrap">입항일자{renderSortIcon('arrivalDate')}</div></th>
                  <th className="text-center cursor-pointer select-none px-2 py-2" onClick={() => handleSort('mrn')}><div className="flex items-center justify-center whitespace-nowrap">MRN{renderSortIcon('mrn')}</div></th>
                  <th className="text-center cursor-pointer select-none px-2 py-2" onClick={() => handleSort('msn')}><div className="flex items-center justify-center whitespace-nowrap">MSN{renderSortIcon('msn')}</div></th>
                  <th className="text-center cursor-pointer select-none px-2 py-2" onClick={() => handleSort('hsn')}><div className="flex items-center justify-center whitespace-nowrap">HSN{renderSortIcon('hsn')}</div></th>
                  <th className="text-center cursor-pointer select-none px-2 py-2" onClick={() => handleSort('receiptType')}><div className="flex items-center justify-center whitespace-nowrap">반입구분{renderSortIcon('receiptType')}</div></th>
                  <th className="text-center cursor-pointer select-none px-2 py-2" onClick={() => handleSort('mblNo')}><div className="flex items-center justify-center whitespace-nowrap">M B/L{renderSortIcon('mblNo')}</div></th>
                  <th className="text-center cursor-pointer select-none px-2 py-2" onClick={() => handleSort('hblNo')}><div className="flex items-center justify-center whitespace-nowrap">H B/L{renderSortIcon('hblNo')}</div></th>
                  <th className="text-center cursor-pointer select-none px-2 py-2 bg-blue-500/20" onClick={() => handleSort('inQty')}><div className="flex items-center justify-center whitespace-nowrap text-blue-400">입고수량{renderSortIcon('inQty')}</div></th>
                  <th className="text-center cursor-pointer select-none px-2 py-2 bg-blue-500/20" onClick={() => handleSort('inWeight')}><div className="flex items-center justify-center whitespace-nowrap text-blue-400">입고중량{renderSortIcon('inWeight')}</div></th>
                  <th className="text-center cursor-pointer select-none px-2 py-2 bg-blue-500/20" onClick={() => handleSort('inVolume')}><div className="flex items-center justify-center whitespace-nowrap text-blue-400">입고용적{renderSortIcon('inVolume')}</div></th>
                  <th className="text-center cursor-pointer select-none px-2 py-2 bg-orange-500/20" onClick={() => handleSort('outQty')}><div className="flex items-center justify-center whitespace-nowrap text-orange-400">출고수량{renderSortIcon('outQty')}</div></th>
                  <th className="text-center cursor-pointer select-none px-2 py-2 bg-orange-500/20" onClick={() => handleSort('outWeight')}><div className="flex items-center justify-center whitespace-nowrap text-orange-400">출고중량{renderSortIcon('outWeight')}</div></th>
                  <th className="text-center cursor-pointer select-none px-2 py-2 bg-orange-500/20" onClick={() => handleSort('outVolume')}><div className="flex items-center justify-center whitespace-nowrap text-orange-400">출고용적{renderSortIcon('outVolume')}</div></th>
                  <th className="text-center cursor-pointer select-none px-2 py-2 bg-green-500/20" onClick={() => handleSort('stockQty')}><div className="flex items-center justify-center whitespace-nowrap text-green-400">재고수량{renderSortIcon('stockQty')}</div></th>
                  <th className="text-center cursor-pointer select-none px-2 py-2 bg-green-500/20" onClick={() => handleSort('stockWeight')}><div className="flex items-center justify-center whitespace-nowrap text-green-400">재고중량{renderSortIcon('stockWeight')}</div></th>
                  <th className="text-center cursor-pointer select-none px-2 py-2 bg-green-500/20" onClick={() => handleSort('stockVolume')}><div className="flex items-center justify-center whitespace-nowrap text-green-400">재고용적{renderSortIcon('stockVolume')}</div></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {sortedData.length === 0 ? (
                  <tr><td colSpan={20} className="px-4 py-8 text-center text-[var(--muted)]">조회된 데이터가 없습니다.</td></tr>
                ) : (
                  sortedData.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-[var(--surface-50)] border-t border-[var(--border)]">
                      <td className="px-2 py-2 text-center text-[var(--foreground)]">{idx + 1}</td>
                      <td className="px-2 py-2 text-center">
                        <input type="checkbox" checked={item.checked} onChange={e => handleSelectItem(item.id, e.target.checked)} className="w-4 h-4" />
                      </td>
                      <td className="px-2 py-2 text-center"><Link href={`/logis/cargo/release/${item.id}`} className="text-[#E8A838] hover:underline font-mono font-medium">{item.receiptNo}</Link></td>
                      <td className="px-2 py-2 text-center text-[var(--muted)]">{item.receiptDate}</td>
                      <td className="px-2 py-2 text-center text-[var(--muted)]">{item.arrivalDate}</td>
                      <td className="px-2 py-2 text-center text-[var(--foreground)] font-mono">{item.mrn}</td>
                      <td className="px-2 py-2 text-center text-[var(--foreground)]">{item.msn}</td>
                      <td className="px-2 py-2 text-center text-[var(--foreground)]">{item.hsn}</td>
                      <td className="px-2 py-2 text-center"><span className={`px-2 py-0.5 text-xs rounded ${item.receiptType === '일반반입' ? 'bg-blue-500/20 text-blue-400' : item.receiptType === '보세운송' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-purple-500/20 text-purple-400'}`}>{item.receiptType}</span></td>
                      <td className="px-2 py-2 text-center text-[var(--foreground)] font-mono">{item.mblNo}</td>
                      <td className="px-2 py-2 text-center text-[var(--foreground)] font-mono">{item.hblNo}</td>
                      <td className="px-2 py-2 text-center bg-blue-500/10 text-blue-400">{item.inQty.toLocaleString()}</td>
                      <td className="px-2 py-2 text-center bg-blue-500/10 text-blue-400">{item.inWeight.toLocaleString()}</td>
                      <td className="px-2 py-2 text-center bg-blue-500/10 text-blue-400">{item.inVolume.toFixed(1)}</td>
                      <td className="px-2 py-2 text-center bg-orange-500/10 text-orange-400">{item.outQty.toLocaleString()}</td>
                      <td className="px-2 py-2 text-center bg-orange-500/10 text-orange-400">{item.outWeight.toLocaleString()}</td>
                      <td className="px-2 py-2 text-center bg-orange-500/10 text-orange-400">{item.outVolume.toFixed(1)}</td>
                      <td className="px-2 py-2 text-center bg-green-500/10 text-green-400 font-medium">{item.stockQty.toLocaleString()}</td>
                      <td className="px-2 py-2 text-center bg-green-500/10 text-green-400 font-medium">{item.stockWeight.toLocaleString()}</td>
                      <td className="px-2 py-2 text-center bg-green-500/10 text-green-400 font-medium">{item.stockVolume.toFixed(1)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* 수입화물 추적정보 조회 팝업 - 유니패스 스타일 */}
      {showImportPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[1100px] max-h-[90vh] overflow-hidden">
            {/* 헤더 */}
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[#0066CC]">
              <h2 className="text-lg font-bold text-white">수입화물 진행정보</h2>
              <button onClick={() => setShowImportPopup(false)} className="text-white hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* 탭 - 유니패스 스타일 */}
            <div className="flex border-b-2 border-[#0066CC] bg-[#f0f4f8]">
              <button
                onClick={() => setImportActiveTab('건별')}
                className={`px-5 py-3 text-sm font-medium transition-colors rounded-t-lg ${importActiveTab === '건별' ? 'bg-[#0066CC] text-white' : 'bg-[#e8ecf0] text-[#333] hover:bg-[#d8dce0] border border-b-0 border-[#ccc]'}`}
              >
                수입화물진행정보(건별)
              </button>
              <button
                onClick={() => setImportActiveTab('해외직구')}
                className={`px-5 py-3 text-sm font-medium transition-colors rounded-t-lg ${importActiveTab === '해외직구' ? 'bg-[#0066CC] text-white' : 'bg-[#e8ecf0] text-[#333] hover:bg-[#d8dce0] border border-b-0 border-[#ccc]'}`}
              >
                해외직구 통관정보조회
              </button>
              <button
                onClick={() => setImportActiveTab('tracking')}
                className={`px-5 py-3 text-sm font-medium transition-colors rounded-t-lg ${importActiveTab === 'tracking' ? 'bg-[#0066CC] text-white' : 'bg-[#e8ecf0] text-[#333] hover:bg-[#d8dce0] border border-b-0 border-[#ccc]'}`}
              >
                Import cargo tracking
              </button>
              <button
                onClick={() => setImportActiveTab('BL정보')}
                className={`px-5 py-3 text-sm font-medium transition-colors rounded-t-lg ${importActiveTab === 'BL정보' ? 'bg-[#0066CC] text-white' : 'bg-[#e8ecf0] text-[#333] hover:bg-[#d8dce0] border border-b-0 border-[#ccc]'}`}
              >
                B/L정보조회
              </button>
              <button
                onClick={() => setImportActiveTab('SMS설정')}
                className={`px-5 py-3 text-sm font-medium transition-colors rounded-t-lg ${importActiveTab === 'SMS설정' ? 'bg-[#0066CC] text-white' : 'bg-[#e8ecf0] text-[#666] hover:bg-[#d8dce0] border border-b-0 border-[#ccc]'}`}
              >
                진행정보 SMS통보 설정
              </button>
            </div>

            {/* 탭 내용 */}
            <div className="p-6 bg-white">
              {/* 건별 조회 탭 */}
              {importActiveTab === '건별' && (
                <>
                  <div className="border border-[#ddd] rounded-lg p-4 mb-4 bg-[#f9f9f9]">
                    <div className="flex items-center gap-8 mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="importSearchType" checked={importSearch.searchType === 'mbl'} onChange={() => setImportSearch(prev => ({ ...prev, searchType: 'mbl' }))} className="w-4 h-4 accent-[#0066CC]" />
                        <span className="text-sm text-[#333]">M B/L - H B/L</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="importSearchType" checked={importSearch.searchType === 'cargoMgtNo'} onChange={() => setImportSearch(prev => ({ ...prev, searchType: 'cargoMgtNo' }))} className="w-4 h-4 accent-[#0066CC]" />
                        <span className="text-sm text-[#333]">화물관리번호</span>
                      </label>
                    </div>

                    {importSearch.searchType === 'mbl' ? (
                      <div className="flex items-center gap-4">
                        <input type="text" value={importSearch.mblNo} onChange={e => setImportSearch(prev => ({ ...prev, mblNo: e.target.value }))} placeholder="M B/L No." className="w-[200px] h-[38px] px-3 bg-white border border-[#ccc] rounded text-sm text-[#333]" />
                        <input type="text" value={importSearch.hblNo} onChange={e => setImportSearch(prev => ({ ...prev, hblNo: e.target.value }))} placeholder="H B/L No." className="w-[200px] h-[38px] px-3 bg-white border border-[#ccc] rounded text-sm text-[#333]" />
                        <select value={importSearch.year} onChange={e => setImportSearch(prev => ({ ...prev, year: e.target.value }))} className="w-[100px] h-[38px] px-3 bg-white border border-[#ccc] rounded text-sm text-[#333]">
                          <option value="2027">2027년</option>
                          <option value="2026">2026년</option>
                          <option value="2025">2025년</option>
                          <option value="2024">2024년</option>
                          <option value="2023">2023년</option>
                          <option value="2022">2022년</option>
                          <option value="2021">2021년</option>
                          <option value="2020">2020년</option>
                          <option value="2019">2019년</option>
                          <option value="2018">2018년</option>
                        </select>
                        <span className="text-xs text-red-600">※ 개인물품인 경우 운송장번호를 HB/L에 입력</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <input type="text" value={importSearch.cargoMgtNo} onChange={e => setImportSearch(prev => ({ ...prev, cargoMgtNo: e.target.value }))} placeholder="화물관리번호 입력" className="w-[300px] h-[38px] px-3 bg-white border border-[#ccc] rounded text-sm text-[#333]" />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <button onClick={handleImportReset} className="flex items-center gap-1.5 px-4 py-2 bg-[#666] text-white rounded hover:bg-[#555] text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      초기화
                    </button>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleImportSearch()} disabled={isSearching} className="flex items-center gap-1.5 px-6 py-2 bg-[#0066CC] text-white rounded hover:bg-[#0052A3] text-sm disabled:opacity-50">
                        {isSearching ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        )}
                        {isSearching ? '조회중...' : '조회'}
                      </button>
                      <button onClick={handleRegisterCargo} disabled={unipassResults.filter(r => r.checked).length === 0} className="flex items-center gap-1.5 px-6 py-2 bg-[#28A745] text-white rounded hover:bg-[#218838] text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        등록 ({unipassResults.filter(r => r.checked).length})
                      </button>
                    </div>
                  </div>

                  {/* 검색 메시지 */}
                  {searchMessage && (
                    <div className={`mb-3 p-3 rounded text-sm ${searchMessage.includes('오류') || searchMessage.includes('입력해') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                      {searchMessage}
                    </div>
                  )}

                  {/* 결과 건수 및 페이징 */}
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-sm text-[#333]">전체 <strong className="text-[#0066CC]">{unipassResults.length}</strong> 건</span>
                    {unipassResults.length > 0 && (
                      <label className="flex items-center gap-2 text-sm text-[#666]">
                        <input
                          type="checkbox"
                          checked={unipassResults.length > 0 && unipassResults.every(r => r.checked)}
                          onChange={(e) => handleUnipassResultCheckAll(e.target.checked)}
                          className="w-4 h-4"
                        />
                        전체 선택
                      </label>
                    )}
                  </div>

                  {/* 테이블 - 유니패스 스타일 */}
                  <div className="border border-[#ddd] rounded overflow-hidden max-h-[300px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0">
                        <tr className="bg-[#f5f5f5]">
                          <th className="px-2 py-2 text-center border-r border-[#ddd] text-[#333] font-medium w-10">선택</th>
                          <th className="px-2 py-2 text-center border-r border-[#ddd] text-[#333] font-medium w-8">No</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">화물관리번호</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">M B/L</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">H B/L</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">입항일자</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">화물상태</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">포장개수</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">중량(KG)</th>
                          <th className="px-3 py-2 text-center text-[#333] font-medium">수하인</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unipassResults.length === 0 ? (
                          <tr><td colSpan={10} className="px-4 py-8 text-center text-[#666]">
                            {isSearching ? '조회 중입니다...' : '조회조건을 입력 후 조회 버튼을 클릭하세요.'}
                          </td></tr>
                        ) : (
                          unipassResults.map((item, idx) => (
                            <tr key={idx} className={`border-t border-[#ddd] hover:bg-[#f9f9f9] ${item.checked ? 'bg-blue-50' : ''}`}>
                              <td className="px-2 py-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={item.checked || false}
                                  onChange={() => handleUnipassResultCheck(idx)}
                                  className="w-4 h-4"
                                />
                              </td>
                              <td className="px-2 py-2 text-center text-[#333]">{idx + 1}</td>
                              <td className="px-3 py-2 text-center text-[#0066CC] font-mono text-xs">{item.cargoMgtNo}</td>
                              <td className="px-3 py-2 text-center text-[#333] font-mono text-xs">{item.mblNo}</td>
                              <td className="px-3 py-2 text-center text-[#333] font-mono text-xs">{item.hblNo}</td>
                              <td className="px-3 py-2 text-center text-[#666] text-xs">{item.arrivalDt}</td>
                              <td className="px-3 py-2 text-center">
                                <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">{item.cargoStatus}</span>
                              </td>
                              <td className="px-3 py-2 text-center text-[#333]">{item.packageQty}</td>
                              <td className="px-3 py-2 text-center text-[#333]">{item.grossWeight.toLocaleString()}</td>
                              <td className="px-3 py-2 text-center text-[#333] text-xs truncate max-w-[150px]" title={item.consigneeNm}>{item.consigneeNm}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* 안내 메시지 */}
                  <div className="mt-4 space-y-1">
                    <p className="text-xs text-[#666] flex items-start gap-1">
                      <span className="text-[#0066CC]">ⓘ</span>
                      B/L NO로 화물진행정보 조회시 M B/L(Master BL), H B/L(House BL)을 구분하여 조회하여야하며, M B/L에 입력 후 조회되지 않는 경우, H B/L에 입력 후 조회해주시기 바랍니다.
                    </p>
                    <p className="text-xs text-[#666] flex items-start gap-1">
                      <span className="text-[#0066CC]">ⓘ</span>
                      화물통관진행정보 데이터 보관주기 정책에 따라 &apos;23.06.17(토) 부터 3년 이내 데이터만 조회 가능합니다.
                    </p>
                  </div>
                </>
              )}

              {/* 해외직구 통관정보조회 탭 */}
              {importActiveTab === '해외직구' && (
                <>
                  <div className="border border-[#ddd] rounded-lg p-4 mb-4 bg-[#f9f9f9]">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-sm font-medium text-[#333]">운송장번호</span>
                      <input
                        type="text"
                        value={overseasSearch.trackingNo}
                        onChange={e => setOverseasSearch(prev => ({ ...prev, trackingNo: e.target.value }))}
                        placeholder="운송장번호 입력"
                        className="w-[300px] h-[38px] px-3 bg-white border border-[#ccc] rounded text-sm text-[#333]"
                      />
                      <select
                        value={overseasSearch.year}
                        onChange={e => setOverseasSearch(prev => ({ ...prev, year: e.target.value }))}
                        className="w-[100px] h-[38px] px-3 bg-white border border-[#ccc] rounded text-sm text-[#333]"
                      >
                        <option value="2027">2027년</option>
                        <option value="2026">2026년</option>
                        <option value="2025">2025년</option>
                        <option value="2024">2024년</option>
                        <option value="2023">2023년</option>
                        <option value="2022">2022년</option>
                        <option value="2021">2021년</option>
                        <option value="2020">2020년</option>
                        <option value="2019">2019년</option>
                        <option value="2018">2018년</option>
                      </select>
                    </div>
                    <p className="text-xs text-[#666]">※ 해외직구 물품의 운송장번호(택배사 송장번호)를 입력하세요.</p>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <button onClick={handleOverseasReset} className="flex items-center gap-1.5 px-4 py-2 bg-[#666] text-white rounded hover:bg-[#555] text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      초기화
                    </button>
                    <button onClick={handleOverseasSearch} className="flex items-center gap-1.5 px-6 py-2 bg-[#0066CC] text-white rounded hover:bg-[#0052A3] text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      조회
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-sm text-[#333]">전체 <strong className="text-[#0066CC]">{overseasResults.length}</strong> 건</span>
                  </div>

                  <div className="border border-[#ddd] rounded overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#f5f5f5]">
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">No</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">운송장번호</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">통관상태</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">품명</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">신고일자</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">중량</th>
                          <th className="px-3 py-2 text-center text-[#333] font-medium">물품가격</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overseasResults.length === 0 ? (
                          <tr><td colSpan={7} className="px-4 py-8 text-center text-[#666]">운송장번호를 입력 후 조회하세요.</td></tr>
                        ) : (
                          overseasResults.map((item, idx) => (
                            <tr key={item.id} className="border-t border-[#ddd] hover:bg-[#f9f9f9]">
                              <td className="px-3 py-2 text-center text-[#333]">{idx + 1}</td>
                              <td className="px-3 py-2 text-center text-[#0066CC] font-mono cursor-pointer hover:underline">{item.trackingNo}</td>
                              <td className="px-3 py-2 text-center">
                                <span className={`px-2 py-0.5 text-xs rounded ${item.status === '통관완료' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center text-[#333]">{item.itemName}</td>
                              <td className="px-3 py-2 text-center text-[#666]">{item.declDate}</td>
                              <td className="px-3 py-2 text-center text-[#333]">{item.weight}</td>
                              <td className="px-3 py-2 text-center text-[#333]">{item.value}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Import cargo tracking 탭 */}
              {importActiveTab === 'tracking' && (
                <>
                  <div className="border border-[#ddd] rounded-lg p-4 mb-4 bg-[#f9f9f9]">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-sm font-medium text-[#333]">M B/L No.</span>
                      <input
                        type="text"
                        value={trackingSearch.mblNo}
                        onChange={e => setTrackingSearch(prev => ({ ...prev, mblNo: e.target.value }))}
                        placeholder="Master B/L Number"
                        className="w-[200px] h-[38px] px-3 bg-white border border-[#ccc] rounded text-sm text-[#333]"
                      />
                      <span className="text-sm font-medium text-[#333]">H B/L No.</span>
                      <input
                        type="text"
                        value={trackingSearch.hblNo}
                        onChange={e => setTrackingSearch(prev => ({ ...prev, hblNo: e.target.value }))}
                        placeholder="House B/L Number"
                        className="w-[200px] h-[38px] px-3 bg-white border border-[#ccc] rounded text-sm text-[#333]"
                      />
                      <select
                        value={trackingSearch.year}
                        onChange={e => setTrackingSearch(prev => ({ ...prev, year: e.target.value }))}
                        className="w-[100px] h-[38px] px-3 bg-white border border-[#ccc] rounded text-sm text-[#333]"
                      >
                        <option value="2027">2027</option>
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                        <option value="2022">2022</option>
                        <option value="2021">2021</option>
                        <option value="2020">2020</option>
                        <option value="2019">2019</option>
                        <option value="2018">2018</option>
                      </select>
                    </div>
                    <p className="text-xs text-[#666]">※ Enter Master B/L or House B/L number to track your import cargo.</p>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <button onClick={handleTrackingReset} className="flex items-center gap-1.5 px-4 py-2 bg-[#666] text-white rounded hover:bg-[#555] text-sm">
                      Reset
                    </button>
                    <button onClick={handleTrackingSearch} className="flex items-center gap-1.5 px-6 py-2 bg-[#0066CC] text-white rounded hover:bg-[#0052A3] text-sm">
                      Search
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-sm text-[#333]">Total <strong className="text-[#0066CC]">{trackingResults.length}</strong> records</span>
                  </div>

                  <div className="border border-[#ddd] rounded overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#f5f5f5]">
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">No</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">Cargo Mgt No.</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">B/L No.</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">Arrival Date</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">Port</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">Carrier</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">Pkg Count</th>
                          <th className="px-3 py-2 text-center text-[#333] font-medium">Weight(kg)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trackingResults.length === 0 ? (
                          <tr><td colSpan={8} className="px-4 py-8 text-center text-[#666]">Please enter B/L number and search.</td></tr>
                        ) : (
                          trackingResults.map((item, idx) => (
                            <tr key={item.id} className="border-t border-[#ddd] hover:bg-[#f9f9f9]">
                              <td className="px-3 py-2 text-center text-[#333]">{idx + 1}</td>
                              <td className="px-3 py-2 text-center text-[#0066CC] font-mono cursor-pointer hover:underline">{item.cargoMgtNo}</td>
                              <td className="px-3 py-2 text-center text-[#333] font-mono">{item.blNo}</td>
                              <td className="px-3 py-2 text-center text-[#666]">{item.arrivalDate}</td>
                              <td className="px-3 py-2 text-center text-[#333]">{item.port}</td>
                              <td className="px-3 py-2 text-center text-[#333]">{item.carrier}</td>
                              <td className="px-3 py-2 text-center text-[#333]">{item.pkgCount}</td>
                              <td className="px-3 py-2 text-center text-[#333]">{item.weight.toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* B/L정보조회 탭 */}
              {importActiveTab === 'BL정보' && (
                <>
                  <div className="border border-[#ddd] rounded-lg p-4 mb-4 bg-[#f9f9f9]">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-sm font-medium text-[#333]">B/L 번호</span>
                      <input
                        type="text"
                        value={blInfoSearch.blNo}
                        onChange={e => setBlInfoSearch(prev => ({ ...prev, blNo: e.target.value }))}
                        placeholder="M B/L 또는 H B/L 번호 입력"
                        className="w-[300px] h-[38px] px-3 bg-white border border-[#ccc] rounded text-sm text-[#333]"
                      />
                      <select
                        value={blInfoSearch.year}
                        onChange={e => setBlInfoSearch(prev => ({ ...prev, year: e.target.value }))}
                        className="w-[100px] h-[38px] px-3 bg-white border border-[#ccc] rounded text-sm text-[#333]"
                      >
                        <option value="2027">2027년</option>
                        <option value="2026">2026년</option>
                        <option value="2025">2025년</option>
                        <option value="2024">2024년</option>
                        <option value="2023">2023년</option>
                        <option value="2022">2022년</option>
                        <option value="2021">2021년</option>
                        <option value="2020">2020년</option>
                        <option value="2019">2019년</option>
                        <option value="2018">2018년</option>
                      </select>
                    </div>
                    <p className="text-xs text-[#666]">※ B/L 번호를 입력하여 선하증권 상세 정보를 조회합니다.</p>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <button onClick={handleBlInfoReset} className="flex items-center gap-1.5 px-4 py-2 bg-[#666] text-white rounded hover:bg-[#555] text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      초기화
                    </button>
                    <button onClick={handleBlInfoSearch} className="flex items-center gap-1.5 px-6 py-2 bg-[#0066CC] text-white rounded hover:bg-[#0052A3] text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      조회
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-sm text-[#333]">전체 <strong className="text-[#0066CC]">{blInfoResults.length}</strong> 건</span>
                  </div>

                  <div className="border border-[#ddd] rounded overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#f5f5f5]">
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">No</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">B/L 번호</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">Shipper</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">Consignee</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">POL</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">POD</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">ETD</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">ETA</th>
                          <th className="px-3 py-2 text-center text-[#333] font-medium">Vessel</th>
                        </tr>
                      </thead>
                      <tbody>
                        {blInfoResults.length === 0 ? (
                          <tr><td colSpan={9} className="px-4 py-8 text-center text-[#666]">B/L 번호를 입력 후 조회하세요.</td></tr>
                        ) : (
                          blInfoResults.map((item, idx) => (
                            <tr key={item.id} className="border-t border-[#ddd] hover:bg-[#f9f9f9]">
                              <td className="px-3 py-2 text-center text-[#333]">{idx + 1}</td>
                              <td className="px-3 py-2 text-center text-[#0066CC] font-mono cursor-pointer hover:underline">{item.blNo}</td>
                              <td className="px-3 py-2 text-center text-[#333]">{item.shipper}</td>
                              <td className="px-3 py-2 text-center text-[#333]">{item.consignee}</td>
                              <td className="px-3 py-2 text-center text-[#333]">{item.pol}</td>
                              <td className="px-3 py-2 text-center text-[#333]">{item.pod}</td>
                              <td className="px-3 py-2 text-center text-[#666]">{item.etd}</td>
                              <td className="px-3 py-2 text-center text-[#666]">{item.eta}</td>
                              <td className="px-3 py-2 text-center text-[#333]">{item.vessel}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* SMS 설정 탭 */}
              {importActiveTab === 'SMS설정' && (
                <>
                  <div className="border border-[#ddd] rounded-lg p-4 mb-4 bg-[#f9f9f9]">
                    <h4 className="text-sm font-medium text-[#333] mb-3">SMS 알림 등록</h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs text-[#666] mb-1">휴대폰번호</label>
                        <input
                          type="text"
                          value={smsSettings.phoneNo}
                          onChange={e => setSmsSettings(prev => ({ ...prev, phoneNo: e.target.value }))}
                          placeholder="010-0000-0000"
                          className="w-full h-[38px] px-3 bg-white border border-[#ccc] rounded text-sm text-[#333]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#666] mb-1">B/L 번호</label>
                        <input
                          type="text"
                          value={smsSettings.blNo}
                          onChange={e => setSmsSettings(prev => ({ ...prev, blNo: e.target.value }))}
                          placeholder="B/L 번호 입력"
                          className="w-full h-[38px] px-3 bg-white border border-[#ccc] rounded text-sm text-[#333]"
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-xs text-[#666] mb-2">알림 항목 선택</label>
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={smsSettings.notifications.arrival}
                            onChange={e => setSmsSettings(prev => ({ ...prev, notifications: { ...prev.notifications, arrival: e.target.checked } }))}
                            className="w-4 h-4 accent-[#0066CC]"
                          />
                          <span className="text-sm text-[#333]">입항 알림</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={smsSettings.notifications.customs}
                            onChange={e => setSmsSettings(prev => ({ ...prev, notifications: { ...prev.notifications, customs: e.target.checked } }))}
                            className="w-4 h-4 accent-[#0066CC]"
                          />
                          <span className="text-sm text-[#333]">통관 알림</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={smsSettings.notifications.release}
                            onChange={e => setSmsSettings(prev => ({ ...prev, notifications: { ...prev.notifications, release: e.target.checked } }))}
                            className="w-4 h-4 accent-[#0066CC]"
                          />
                          <span className="text-sm text-[#333]">반출 알림</span>
                        </label>
                      </div>
                    </div>
                    <button onClick={handleSmsRegister} className="px-6 py-2 bg-[#0066CC] text-white rounded hover:bg-[#0052A3] text-sm">
                      등록
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-sm text-[#333]">등록된 알림 <strong className="text-[#0066CC]">{smsRegistered.length}</strong> 건</span>
                  </div>

                  <div className="border border-[#ddd] rounded overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#f5f5f5]">
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">No</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">휴대폰번호</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">B/L 번호</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">등록일자</th>
                          <th className="px-3 py-2 text-center text-[#333] font-medium">상태</th>
                        </tr>
                      </thead>
                      <tbody>
                        {smsRegistered.length === 0 ? (
                          <tr><td colSpan={5} className="px-4 py-8 text-center text-[#666]">등록된 SMS 알림이 없습니다.</td></tr>
                        ) : (
                          smsRegistered.map((item, idx) => (
                            <tr key={item.id} className="border-t border-[#ddd] hover:bg-[#f9f9f9]">
                              <td className="px-3 py-2 text-center text-[#333]">{idx + 1}</td>
                              <td className="px-3 py-2 text-center text-[#333]">{item.phoneNo}</td>
                              <td className="px-3 py-2 text-center text-[#0066CC] font-mono">{item.blNo}</td>
                              <td className="px-3 py-2 text-center text-[#666]">{item.regDate}</td>
                              <td className="px-3 py-2 text-center">
                                <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">{item.status}</span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 p-3 bg-[#fff8e6] border border-[#f0d78c] rounded">
                    <p className="text-xs text-[#8a6d3b] flex items-start gap-1">
                      <span className="text-[#f0ad4e]">⚠</span>
                      SMS 알림 서비스는 화물 진행상태 변경 시 자동으로 발송됩니다. 통신사 사정에 따라 지연될 수 있습니다.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 수출통관정보 조회 팝업 - 유니패스 스타일 (탭 구조) */}
      {showExportPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[1100px] max-h-[90vh] overflow-hidden">
            {/* 헤더 - 수입과 동일한 파란색 테마 */}
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[#28A745]">
              <h2 className="text-lg font-bold text-white">수출화물 진행정보</h2>
              <button onClick={() => setShowExportPopup(false)} className="text-white hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* 탭 - 수입과 동일한 스타일 */}
            <div className="flex border-b-2 border-[#28A745] bg-[#f0f4f8]">
              <button
                onClick={() => setExportActiveTab('신고조회')}
                className={`px-5 py-3 text-sm font-medium transition-colors rounded-t-lg ${exportActiveTab === '신고조회' ? 'bg-[#28A745] text-white' : 'bg-[#e8ecf0] text-[#333] hover:bg-[#d8dce0] border border-b-0 border-[#ccc]'}`}
              >
                수출신고조회
              </button>
              <button
                onClick={() => setExportActiveTab('이행내역')}
                className={`px-5 py-3 text-sm font-medium transition-colors rounded-t-lg ${exportActiveTab === '이행내역' ? 'bg-[#28A745] text-white' : 'bg-[#e8ecf0] text-[#333] hover:bg-[#d8dce0] border border-b-0 border-[#ccc]'}`}
              >
                수출이행내역조회
              </button>
              <button
                onClick={() => setExportActiveTab('적하목록')}
                className={`px-5 py-3 text-sm font-medium transition-colors rounded-t-lg ${exportActiveTab === '적하목록' ? 'bg-[#28A745] text-white' : 'bg-[#e8ecf0] text-[#333] hover:bg-[#d8dce0] border border-b-0 border-[#ccc]'}`}
              >
                적하목록정보조회
              </button>
              <button
                onClick={() => setExportActiveTab('tracking')}
                className={`px-5 py-3 text-sm font-medium transition-colors rounded-t-lg ${exportActiveTab === 'tracking' ? 'bg-[#28A745] text-white' : 'bg-[#e8ecf0] text-[#333] hover:bg-[#d8dce0] border border-b-0 border-[#ccc]'}`}
              >
                Export cargo tracking
              </button>
            </div>

            {/* 탭 내용 */}
            <div className="p-6 bg-white">
              {/* 수출신고조회 탭 */}
              {exportActiveTab === '신고조회' && (
                <>
                  <div className="border border-[#ddd] rounded-lg p-4 mb-4 bg-[#f9f9f9]">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-sm text-red-600 font-medium">*수출신고 수리기간</span>
                      <input type="text" value={exportSearch.startYear} onChange={e => setExportSearch(prev => ({ ...prev, startYear: e.target.value }))} className="w-[70px] h-[38px] px-2 bg-white border border-[#ccc] rounded text-sm text-center text-[#333]" />
                      <span className="text-[#333]">년</span>
                      <input type="text" value={exportSearch.startMonth} onChange={e => setExportSearch(prev => ({ ...prev, startMonth: e.target.value }))} className="w-[50px] h-[38px] px-2 bg-white border border-[#ccc] rounded text-sm text-center text-[#333]" />
                      <span className="text-[#333]">월 ~</span>
                      <input type="text" value={exportSearch.endYear} onChange={e => setExportSearch(prev => ({ ...prev, endYear: e.target.value }))} className="w-[70px] h-[38px] px-2 bg-white border border-[#ccc] rounded text-sm text-center text-[#333]" />
                      <span className="text-[#333]">년</span>
                      <input type="text" value={exportSearch.endMonth} onChange={e => setExportSearch(prev => ({ ...prev, endMonth: e.target.value }))} className="w-[50px] h-[38px] px-2 bg-white border border-[#ccc] rounded text-sm text-center text-[#333]" />
                      <span className="text-[#333]">월</span>
                      <div className="flex gap-1 ml-2">
                        <button onClick={() => handleExportPeriod('month')} className={`px-3 py-1.5 text-xs rounded ${exportSearch.periodType === 'month' ? 'bg-[#28A745] text-white' : 'bg-[#e8ecf0] text-[#333] border border-[#ccc]'}`}>전월</button>
                        <button onClick={() => handleExportPeriod('quarter')} className={`px-3 py-1.5 text-xs rounded ${exportSearch.periodType === 'quarter' ? 'bg-[#28A745] text-white' : 'bg-[#e8ecf0] text-[#333] border border-[#ccc]'}`}>분기</button>
                        <button onClick={() => handleExportPeriod('half')} className={`px-3 py-1.5 text-xs rounded ${exportSearch.periodType === 'half' ? 'bg-[#28A745] text-white' : 'bg-[#e8ecf0] text-[#333] border border-[#ccc]'}`}>반기</button>
                        <button onClick={() => handleExportPeriod('year')} className={`px-3 py-1.5 text-xs rounded ${exportSearch.periodType === 'year' ? 'bg-[#28A745] text-white' : 'bg-[#e8ecf0] text-[#333] border border-[#ccc]'}`}>1년</button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-sm text-red-600 font-medium">*수출신고번호</span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="exportSearchType" checked={exportSearch.searchType === 'individual'} onChange={() => setExportSearch(prev => ({ ...prev, searchType: 'individual' }))} className="w-4 h-4 accent-[#28A745]" />
                        <span className="text-sm text-[#333]">개별조회</span>
                      </label>
                      <input
                        type="text"
                        value={exportSearch.exportDeclNo}
                        onChange={e => setExportSearch(prev => ({ ...prev, exportDeclNo: e.target.value }))}
                        placeholder="수출신고번호"
                        disabled={exportSearch.searchType !== 'individual'}
                        className="w-[220px] h-[38px] px-3 bg-white border border-[#ccc] rounded text-sm text-[#333] disabled:bg-[#f0f0f0]"
                      />
                      <span className="text-xs text-red-600">* &apos;-&apos; 는 제외</span>
                      <label className="flex items-center gap-2 ml-4 cursor-pointer">
                        <input type="radio" name="exportSearchType" checked={exportSearch.searchType === 'batch'} onChange={() => setExportSearch(prev => ({ ...prev, searchType: 'batch' }))} className="w-4 h-4 accent-[#28A745]" />
                        <span className="text-sm text-[#333]">일괄조회</span>
                      </label>
                      <button className="px-3 py-1.5 text-xs bg-[#e8ecf0] text-[#333] border border-[#ccc] rounded">파일 선택</button>
                      <span className="text-xs text-[#666]">선택된 파일 없음</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <button onClick={handleExportReset} className="flex items-center gap-1.5 px-4 py-2 bg-[#666] text-white rounded hover:bg-[#555] text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      초기화
                    </button>
                    <button onClick={handleExportSearch} className="flex items-center gap-1.5 px-6 py-2 bg-[#28A745] text-white rounded hover:bg-[#218838] text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      조회
                    </button>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-[#333]">전체 <strong className="text-[#28A745]">{exportResults.length}</strong> 건</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#666]">페이지당</span>
                        <select className="h-[30px] px-2 bg-white border border-[#ccc] rounded text-sm text-[#333]">
                          <option value="10">10</option>
                          <option value="20">20</option>
                          <option value="50">50</option>
                        </select>
                        <button className="px-2 py-1 text-xs bg-[#f0f0f0] border border-[#ccc] rounded text-[#333] hover:bg-[#e0e0e0]">선택</button>
                      </div>
                    </div>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#107C41] text-white rounded hover:bg-[#0B5A2E]">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      다운로드
                    </button>
                  </div>

                  <div className="border border-[#ddd] rounded overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#f5f5f5]">
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">No</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">수출신고번호</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">수리일자</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">수출자</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">품명</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">수량</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">금액</th>
                          <th className="px-3 py-2 text-center text-[#333] font-medium">상태</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exportResults.length === 0 ? (
                          <tr><td colSpan={8} className="px-4 py-8 text-center text-[#666]">조회조건을 선택하십시오.</td></tr>
                        ) : (
                          exportResults.map((item, idx) => (
                            <tr key={item.id} className="border-t border-[#ddd] hover:bg-[#f9f9f9]">
                              <td className="px-3 py-2 text-center text-[#333]">{idx + 1}</td>
                              <td className="px-3 py-2 text-center text-[#28A745] font-mono cursor-pointer hover:underline">{item.exportDeclNo}</td>
                              <td className="px-3 py-2 text-center text-[#666]">{item.acceptDate}</td>
                              <td className="px-3 py-2 text-center text-[#333]">{item.exporterName}</td>
                              <td className="px-3 py-2 text-center text-[#333]">{item.goodsName}</td>
                              <td className="px-3 py-2 text-center text-[#333]">{item.quantity}</td>
                              <td className="px-3 py-2 text-center text-[#333]">{item.amount}</td>
                              <td className="px-3 py-2 text-center">
                                <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">{item.status}</span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* 수출이행내역조회 탭 */}
              {exportActiveTab === '이행내역' && (
                <>
                  <div className="border border-[#ddd] rounded-lg p-4 mb-4 bg-[#f9f9f9]">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-sm font-medium text-[#333]">수출신고번호</span>
                      <input
                        type="text"
                        value={exportPerformSearch.exportDeclNo}
                        onChange={e => setExportPerformSearch(prev => ({ ...prev, exportDeclNo: e.target.value }))}
                        placeholder="수출신고번호 입력"
                        className="w-[300px] h-[38px] px-3 bg-white border border-[#ccc] rounded text-sm text-[#333]"
                      />
                      <select
                        value={exportPerformSearch.year}
                        onChange={e => setExportPerformSearch(prev => ({ ...prev, year: e.target.value }))}
                        className="w-[100px] h-[38px] px-3 bg-white border border-[#ccc] rounded text-sm text-[#333]"
                      >
                        <option value="2027">2027년</option>
                        <option value="2026">2026년</option>
                        <option value="2025">2025년</option>
                        <option value="2024">2024년</option>
                        <option value="2023">2023년</option>
                        <option value="2022">2022년</option>
                        <option value="2021">2021년</option>
                        <option value="2020">2020년</option>
                        <option value="2019">2019년</option>
                        <option value="2018">2018년</option>
                      </select>
                    </div>
                    <p className="text-xs text-[#666]">※ 수출신고번호를 입력하여 수출이행내역을 조회합니다.</p>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <button onClick={handleExportPerformReset} className="flex items-center gap-1.5 px-4 py-2 bg-[#666] text-white rounded hover:bg-[#555] text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      초기화
                    </button>
                    <button onClick={handleExportPerformSearch} className="flex items-center gap-1.5 px-6 py-2 bg-[#28A745] text-white rounded hover:bg-[#218838] text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      조회
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-sm text-[#333]">전체 <strong className="text-[#28A745]">{exportPerformResults.length}</strong> 건</span>
                  </div>

                  <div className="border border-[#ddd] rounded overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#f5f5f5]">
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">No</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">수출신고번호</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">적재일자</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">선박/항공기명</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">B/L번호</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">수량</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">중량</th>
                          <th className="px-3 py-2 text-center text-[#333] font-medium">상태</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exportPerformResults.length === 0 ? (
                          <tr><td colSpan={8} className="px-4 py-8 text-center text-[#666]">수출신고번호를 입력 후 조회하세요.</td></tr>
                        ) : (
                          exportPerformResults.map((item, idx) => (
                            <tr key={item.id} className="border-t border-[#ddd] hover:bg-[#f9f9f9]">
                              <td className="px-3 py-2 text-center text-[#333]">{idx + 1}</td>
                              <td className="px-3 py-2 text-center text-[#28A745] font-mono cursor-pointer hover:underline">{item.exportDeclNo}</td>
                              <td className="px-3 py-2 text-center text-[#666]">{item.loadDate}</td>
                              <td className="px-3 py-2 text-center text-[#333]">{item.vessel}</td>
                              <td className="px-3 py-2 text-center text-[#333] font-mono">{item.blNo}</td>
                              <td className="px-3 py-2 text-center text-[#333]">{item.quantity}</td>
                              <td className="px-3 py-2 text-center text-[#333]">{item.weight}</td>
                              <td className="px-3 py-2 text-center">
                                <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700">{item.status}</span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* 적하목록정보조회 탭 */}
              {exportActiveTab === '적하목록' && (
                <>
                  <div className="border border-[#ddd] rounded-lg p-4 mb-4 bg-[#f9f9f9]">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-sm font-medium text-[#333]">B/L 번호</span>
                      <input
                        type="text"
                        value={manifestSearch.blNo}
                        onChange={e => setManifestSearch(prev => ({ ...prev, blNo: e.target.value }))}
                        placeholder="B/L 번호 입력"
                        className="w-[300px] h-[38px] px-3 bg-white border border-[#ccc] rounded text-sm text-[#333]"
                      />
                      <select
                        value={manifestSearch.year}
                        onChange={e => setManifestSearch(prev => ({ ...prev, year: e.target.value }))}
                        className="w-[100px] h-[38px] px-3 bg-white border border-[#ccc] rounded text-sm text-[#333]"
                      >
                        <option value="2027">2027년</option>
                        <option value="2026">2026년</option>
                        <option value="2025">2025년</option>
                        <option value="2024">2024년</option>
                        <option value="2023">2023년</option>
                        <option value="2022">2022년</option>
                        <option value="2021">2021년</option>
                        <option value="2020">2020년</option>
                        <option value="2019">2019년</option>
                        <option value="2018">2018년</option>
                      </select>
                    </div>
                    <p className="text-xs text-[#666]">※ B/L 번호를 입력하여 적하목록 정보를 조회합니다.</p>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <button onClick={handleManifestReset} className="flex items-center gap-1.5 px-4 py-2 bg-[#666] text-white rounded hover:bg-[#555] text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      초기화
                    </button>
                    <button onClick={handleManifestSearch} className="flex items-center gap-1.5 px-6 py-2 bg-[#28A745] text-white rounded hover:bg-[#218838] text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      조회
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-sm text-[#333]">전체 <strong className="text-[#28A745]">{manifestResults.length}</strong> 건</span>
                  </div>

                  <div className="border border-[#ddd] rounded overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#f5f5f5]">
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">No</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">적하목록번호</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">B/L번호</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">선박명</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">항차</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">적재항</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">양하항</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">출항예정일</th>
                          <th className="px-3 py-2 text-center text-[#333] font-medium">포장개수</th>
                        </tr>
                      </thead>
                      <tbody>
                        {manifestResults.length === 0 ? (
                          <tr><td colSpan={9} className="px-4 py-8 text-center text-[#666]">B/L 번호를 입력 후 조회하세요.</td></tr>
                        ) : (
                          manifestResults.map((item, idx) => (
                            <tr key={item.id} className="border-t border-[#ddd] hover:bg-[#f9f9f9]">
                              <td className="px-3 py-2 text-center text-[#333]">{idx + 1}</td>
                              <td className="px-3 py-2 text-center text-[#28A745] font-mono cursor-pointer hover:underline">{item.manifestNo}</td>
                              <td className="px-3 py-2 text-center text-[#333] font-mono">{item.blNo}</td>
                              <td className="px-3 py-2 text-center text-[#333]">{item.vessel}</td>
                              <td className="px-3 py-2 text-center text-[#333]">{item.voyage}</td>
                              <td className="px-3 py-2 text-center text-[#333]">{item.pol}</td>
                              <td className="px-3 py-2 text-center text-[#333]">{item.pod}</td>
                              <td className="px-3 py-2 text-center text-[#666]">{item.etd}</td>
                              <td className="px-3 py-2 text-center text-[#333]">{item.pkgCount}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Export cargo tracking 탭 */}
              {exportActiveTab === 'tracking' && (
                <>
                  <div className="border border-[#ddd] rounded-lg p-4 mb-4 bg-[#f9f9f9]">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-sm font-medium text-[#333]">M B/L No.</span>
                      <input
                        type="text"
                        value={exportTrackingSearch.mblNo}
                        onChange={e => setExportTrackingSearch(prev => ({ ...prev, mblNo: e.target.value }))}
                        placeholder="Master B/L Number"
                        className="w-[200px] h-[38px] px-3 bg-white border border-[#ccc] rounded text-sm text-[#333]"
                      />
                      <span className="text-sm font-medium text-[#333]">H B/L No.</span>
                      <input
                        type="text"
                        value={exportTrackingSearch.hblNo}
                        onChange={e => setExportTrackingSearch(prev => ({ ...prev, hblNo: e.target.value }))}
                        placeholder="House B/L Number"
                        className="w-[200px] h-[38px] px-3 bg-white border border-[#ccc] rounded text-sm text-[#333]"
                      />
                      <select
                        value={exportTrackingSearch.year}
                        onChange={e => setExportTrackingSearch(prev => ({ ...prev, year: e.target.value }))}
                        className="w-[100px] h-[38px] px-3 bg-white border border-[#ccc] rounded text-sm text-[#333]"
                      >
                        <option value="2027">2027</option>
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                        <option value="2022">2022</option>
                        <option value="2021">2021</option>
                        <option value="2020">2020</option>
                        <option value="2019">2019</option>
                        <option value="2018">2018</option>
                      </select>
                    </div>
                    <p className="text-xs text-[#666]">※ Enter Master B/L or House B/L number to track your export cargo.</p>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <button onClick={handleExportTrackingReset} className="flex items-center gap-1.5 px-4 py-2 bg-[#666] text-white rounded hover:bg-[#555] text-sm">
                      Reset
                    </button>
                    <button onClick={handleExportTrackingSearch} className="flex items-center gap-1.5 px-6 py-2 bg-[#28A745] text-white rounded hover:bg-[#218838] text-sm">
                      Search
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-sm text-[#333]">Total <strong className="text-[#28A745]">{exportTrackingResults.length}</strong> records</span>
                  </div>

                  <div className="border border-[#ddd] rounded overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#f5f5f5]">
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">No</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">Cargo Mgt No.</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">B/L No.</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">Load Date</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">Port</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">Vessel</th>
                          <th className="px-3 py-2 text-center border-r border-[#ddd] text-[#333] font-medium">Pkg Count</th>
                          <th className="px-3 py-2 text-center text-[#333] font-medium">Weight(kg)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exportTrackingResults.length === 0 ? (
                          <tr><td colSpan={8} className="px-4 py-8 text-center text-[#666]">Please enter B/L number and search.</td></tr>
                        ) : (
                          exportTrackingResults.map((item, idx) => (
                            <tr key={item.id} className="border-t border-[#ddd] hover:bg-[#f9f9f9]">
                              <td className="px-3 py-2 text-center text-[#333]">{idx + 1}</td>
                              <td className="px-3 py-2 text-center text-[#28A745] font-mono cursor-pointer hover:underline">{item.cargoMgtNo}</td>
                              <td className="px-3 py-2 text-center text-[#333] font-mono">{item.blNo}</td>
                              <td className="px-3 py-2 text-center text-[#666]">{item.loadDate}</td>
                              <td className="px-3 py-2 text-center text-[#333]">{item.port}</td>
                              <td className="px-3 py-2 text-center text-[#333]">{item.vessel}</td>
                              <td className="px-3 py-2 text-center text-[#333]">{item.pkgCount}</td>
                              <td className="px-3 py-2 text-center text-[#333]">{item.weight.toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <CloseConfirmModal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} onConfirm={handleConfirmClose} />
    </PageLayout>
  );
}
