'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LIST_PATHS } from '@/constants/paths';
import * as XLSX from 'xlsx';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import EmailModal from '@/components/EmailModal';
import DateRangeButtons, { getToday } from '@/components/DateRangeButtons';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { ListTopButtons, ActionButton } from '@/components/buttons';
import BLPrintModal, { BLData as PrintBLData } from '@/components/BLPrintModal';

// B/L 데이터 타입
interface BLData {
  id: string;
  mblNo: string;
  hblNo: string;
  blType: 'MBL' | 'HBL';
  vesselName: string;
  voyageNo: string;
  polCode: string;
  polName: string;
  podCode: string;
  podName: string;
  etd: string;
  eta: string;
  atd: string;
  ata: string;
  shipper: string;
  consignee: string;
  notifyParty: string;
  containerQty: number;
  containerType: string;
  weight: number;
  volume: number;
  status: 'pending' | 'departed' | 'in_transit' | 'arrived' | 'customs' | 'delivered' | 'DRAFT';
  carrier: string;
}

// 상태별 스타일 정의
const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: '대기', color: '#6B7280', bgColor: '#F3F4F6' },
  departed: { label: '출항', color: '#2563EB', bgColor: '#DBEAFE' },
  in_transit: { label: '운송중', color: '#7C3AED', bgColor: '#EDE9FE' },
  arrived: { label: '도착', color: '#059669', bgColor: '#D1FAE5' },
  customs: { label: '통관중', color: '#EA580C', bgColor: '#FED7AA' },
  delivered: { label: '인도완료', color: '#0D9488', bgColor: '#CCFBF1' },
  DRAFT: { label: '작성중', color: '#9333EA', bgColor: '#F3E8FF' },
};

// API 응답 타입
interface APIBLData {
  hbl_id: number;
  hbl_no: string;
  mbl_id: number;
  mbl_no: string;
  customer_id: number;
  customer_name: string;
  carrier_id: number;
  carrier_name: string;
  carrier_code: string;
  vessel_nm: string;
  voyage_no: string;
  pol_port_cd: string;
  pod_port_cd: string;
  pol_port_name: string;
  pod_port_name: string;
  place_of_receipt: string;
  place_of_delivery: string;
  final_dest: string;
  etd_dt: string;
  atd_dt: string;
  eta_dt: string;
  ata_dt: string;
  issue_dt: string;
  issue_place: string;
  shipper_nm: string;
  shipper_addr: string;
  consignee_nm: string;
  consignee_addr: string;
  notify_party: string;
  total_pkg_qty: number;
  pkg_type_cd: string;
  gross_weight_kg: string;
  volume_cbm: string;
  commodity_desc: string;
  marks_nos: string;
  freight_term_cd: string;
  bl_type_cd: string;
  status_cd: string;
  created_dtm: string;
}

// API 응답을 BLData로 변환
function convertToBLData(apiData: APIBLData): BLData {
  return {
    id: String(apiData.hbl_id),
    mblNo: apiData.mbl_no || '',
    hblNo: apiData.hbl_no || '',
    blType: 'HBL',
    vesselName: apiData.vessel_nm || '',
    voyageNo: apiData.voyage_no || '',
    polCode: apiData.pol_port_cd || '',
    polName: apiData.pol_port_name || '',
    podCode: apiData.pod_port_cd || '',
    podName: apiData.pod_port_name || '',
    etd: apiData.etd_dt || '',
    eta: apiData.eta_dt || '',
    atd: apiData.atd_dt || '',
    ata: apiData.ata_dt || '',
    shipper: apiData.shipper_nm || '',
    consignee: apiData.consignee_nm || '',
    notifyParty: apiData.notify_party || '',
    containerQty: apiData.total_pkg_qty || 0,
    containerType: apiData.pkg_type_cd || '',
    weight: parseFloat(apiData.gross_weight_kg) || 0,
    volume: parseFloat(apiData.volume_cbm) || 0,
    status: (apiData.status_cd as BLData['status']) || 'DRAFT',
    carrier: apiData.carrier_name || apiData.carrier_code || '',
  };
}

interface SearchFilters {
  dateType: string;
  dateFrom: string;
  dateTo: string;
  mblNo: string;
  hblNo: string;
  blType: string;
  status: string;
  carrier: string;
  pol: string;
  pod: string;
  consignee: string;
  vesselName: string;
}

interface SortConfig {
  key: keyof BLData | null;
  direction: 'asc' | 'desc';
}

const columnLabels: Record<string, string> = {
  hblNo: 'HBL No',
  mblNo: 'MBL No',
  blType: 'Type',
  vesselName: '선명/항차',
  polCode: 'POL',
  podCode: 'POD',
  etd: 'ETD',
  eta: 'ETA',
  consignee: '수화인',
  containerQty: 'CNT',
  status: '상태',
  carrier: '선사',
};

const SortIcon = ({ columnKey, sortConfig }: { columnKey: keyof BLData; sortConfig: SortConfig }) => {
  const isActive = sortConfig.key === columnKey;
  return (
    <span className="inline-flex flex-col ml-1.5 gap-px">
      <span
        style={{
          width: 0,
          height: 0,
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderBottom: `5px solid ${isActive && sortConfig.direction === 'asc' ? '#ffffff' : 'rgba(255,255,255,0.35)'}`,
        }}
      />
      <span
        style={{
          width: 0,
          height: 0,
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderTop: `5px solid ${isActive && sortConfig.direction === 'desc' ? '#ffffff' : 'rgba(255,255,255,0.35)'}`,
        }}
      />
    </span>
  );
};

// 오늘 날짜 기본값 설정
const getInitialFilters = (): SearchFilters => {
  const today = getToday();
  return {
    dateType: 'eta',
    dateFrom: today,
    dateTo: today,
    mblNo: '',
    hblNo: '',
    blType: '',
    status: '',
    carrier: '',
    pol: '',
    pod: '',
    consignee: '',
    vesselName: '',
  };
};
const initialFilters: SearchFilters = getInitialFilters();

// Excel 업로드 데이터 타입
interface ExcelUploadData {
  rowNum: number;
  mblNo: string;
  hblNo: string;
  vesselName: string;
  voyageNo: string;
  polCode: string;
  podCode: string;
  etd: string;
  eta: string;
  shipperName: string;
  consigneeName: string;
  notifyParty: string;
  packageQty: number;
  packageType: string;
  grossWeight: number;
  volume: number;
  cargoDescription: string;
  freightTerm: string;
  isValid: boolean;
  errorMessage: string;
}

// localStorage 키
const STORAGE_KEY = 'fms_import_bl_sea_data';

// 샘플 데이터
const sampleBLData: BLData[] = [
  { id: '1', mblNo: 'MBLKR2026010001', hblNo: 'HBLKR2026010001', blType: 'HBL', vesselName: 'EVER GIVEN', voyageNo: '2601E', polCode: 'USLAX', polName: 'Los Angeles', podCode: 'KRPUS', podName: '부산', etd: '2026-01-15', eta: '2026-02-01', atd: '2026-01-15', ata: '', shipper: 'ABC Corp USA', consignee: '삼성전자', notifyParty: '삼성전자 물류팀', containerQty: 2, containerType: '40HC', weight: 18500, volume: 55.2, status: 'in_transit', carrier: 'Evergreen' },
  { id: '2', mblNo: 'MBLKR2026010002', hblNo: 'HBLKR2026010002', blType: 'HBL', vesselName: 'MSC OSCAR', voyageNo: '2602W', polCode: 'DEHAM', polName: 'Hamburg', podCode: 'KRPUS', podName: '부산', etd: '2026-01-10', eta: '2026-01-28', atd: '2026-01-10', ata: '2026-01-28', shipper: 'XYZ GmbH', consignee: 'LG전자', notifyParty: 'LG전자 수입팀', containerQty: 3, containerType: '40HC', weight: 25000, volume: 78.5, status: 'arrived', carrier: 'MSC' },
  { id: '3', mblNo: 'MBLKR2026010003', hblNo: 'HBLKR2026010003', blType: 'HBL', vesselName: 'HMM ALGECIRAS', voyageNo: '2603E', polCode: 'CNSHA', polName: 'Shanghai', podCode: 'KRPUS', podName: '부산', etd: '2026-01-20', eta: '2026-01-25', atd: '2026-01-20', ata: '2026-01-25', shipper: 'DEF Trading Co', consignee: '현대자동차', notifyParty: '현대자동차 구매팀', containerQty: 5, containerType: '20GP', weight: 45000, volume: 120, status: 'customs', carrier: 'HMM' },
  { id: '4', mblNo: 'MBLKR2026010004', hblNo: 'HBLKR2026010004', blType: 'HBL', vesselName: 'MAERSK EINDHOVEN', voyageNo: '2604W', polCode: 'JPNGO', polName: 'Nagoya', podCode: 'KRPUS', podName: '부산', etd: '2026-01-22', eta: '2026-01-24', atd: '', ata: '', shipper: 'GHI Japan Inc', consignee: 'SK하이닉스', notifyParty: 'SK하이닉스 물류', containerQty: 1, containerType: '40RF', weight: 8000, volume: 28, status: 'pending', carrier: 'Maersk' },
  { id: '5', mblNo: 'MBLKR2026010005', hblNo: 'HBLKR2026010005', blType: 'HBL', vesselName: 'ONE APUS', voyageNo: '2605E', polCode: 'SGSIN', polName: 'Singapore', podCode: 'KRPUS', podName: '부산', etd: '2026-01-05', eta: '2026-01-12', atd: '2026-01-05', ata: '2026-01-12', shipper: 'JKL Pte Ltd', consignee: '포스코', notifyParty: '포스코 수입팀', containerQty: 10, containerType: '40HC', weight: 150000, volume: 300, status: 'delivered', carrier: 'ONE' },
];

export default function ImportBLSeaPage() {
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });
  const [allData, setAllData] = useState<BLData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);

  // 화면닫기 핸들러
  const handleCloseClick = () => {
    setShowCloseModal(true);
  };

  const handleConfirmClose = () => {
    setShowCloseModal(false);
    router.push(LIST_PATHS.DASHBOARD);
  };

  // 브라우저 뒤로가기 버튼 처리
  useCloseConfirm({
    showModal: showCloseModal,
    setShowModal: setShowCloseModal,
    onConfirmClose: handleConfirmClose,
  });

  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(initialFilters);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedBL, setSelectedBL] = useState<BLData | null>(null);
  const [searchMessage, setSearchMessage] = useState<string>('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTarget, setEmailTarget] = useState<BLData[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ ids: string[]; hblNos: string[] } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState<ExcelUploadData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  // B/L 출력 관련 state
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printData, setPrintData] = useState<PrintBLData | null>(null);
  const pageSize = 10;

  // B/L 출력 핸들러
  const handlePrintBL = () => {
    if (selectedRows.length === 0) {
      alert('출력할 B/L을 선택해주세요.');
      return;
    }
    if (selectedRows.length > 1) {
      alert('B/L 출력은 한 건씩만 가능합니다.');
      return;
    }
    const selected = allData.find(item => item.id === selectedRows[0]);
    if (selected) {
      const blPrintData: PrintBLData = {
        hblNo: selected.hblNo,
        mblNo: selected.mblNo,
        bookingNo: '',
        blDate: selected.etd,
        shipper: selected.shipper,
        consignee: selected.consignee,
        notifyParty: selected.notifyParty,
        carrier: selected.carrier,
        vessel: selected.vesselName,
        voyage: selected.voyageNo,
        pol: selected.polName,
        pod: selected.podName,
        etd: selected.etd,
        eta: selected.eta,
        containerType: selected.containerType,
        containerQty: selected.containerQty,
        weight: selected.weight,
        measurement: selected.volume,
      };
      setPrintData(blPrintData);
      setShowPrintModal(true);
    }
  };

  // API에서 데이터 로드 및 localStorage 병합
  const fetchData = async () => {
    try {
      setLoading(true);
      let apiData: BLData[] = [];

      try {
        const response = await fetch('/api/bl/import');
        if (response.ok) {
          const data: APIBLData[] = await response.json();
          apiData = data.map(convertToBLData);
        }
      } catch (e) {
        console.log('API not available, using localStorage only');
      }

      // localStorage에서 데이터 로드
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const localData: BLData[] = JSON.parse(stored);
          // localStorage 데이터와 API 데이터 병합 (중복 제거)
          const mergedData = [...apiData, ...localData.filter((d: BLData) => !apiData.find(a => a.id === d.id))];
          setAllData(mergedData.length > 0 ? mergedData : sampleBLData);
        } catch (e) {
          console.error('Failed to parse localStorage data:', e);
          setAllData(apiData.length > 0 ? apiData : sampleBLData);
        }
      } else {
        // API 데이터가 없으면 샘플 데이터 사용
        setAllData(apiData.length > 0 ? apiData : sampleBLData);
      }
    } catch (error) {
      console.error('Failed to fetch B/L data:', error);
      // 에러 시 샘플 데이터 사용
      setAllData(sampleBLData);
    } finally {
      setLoading(false);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchData();
  }, []);

  // 삭제 확인 모달 열기 (선택된 항목들)
  const handleDeleteSelected = () => {
    if (selectedRows.length === 0) {
      setSearchMessage('삭제할 B/L을 선택하세요.');
      setTimeout(() => setSearchMessage(''), 3000);
      return;
    }
    const hblNos = allData.filter(item => selectedRows.includes(item.id)).map(item => item.hblNo);
    setDeleteTarget({ ids: selectedRows, hblNos });
    setShowDeleteModal(true);
  };

  // 삭제 확인 모달 열기 (단건)
  const handleDeleteSingle = (bl: BLData) => {
    setDeleteTarget({ ids: [bl.id], hblNos: [bl.hblNo] });
    setShowDeleteModal(true);
  };

  // 삭제 실행
  const executeDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/bl/import?hbl_ids=${deleteTarget.ids.join(',')}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        setSearchMessage(`${result.deletedCount}건의 B/L이 삭제되었습니다.`);
        setSelectedRows([]);
        setShowDeleteModal(false);
        setDeleteTarget(null);
        // 상세 보기 중이었다면 목록으로 돌아가기
        if (viewMode === 'detail') {
          setViewMode('list');
          setSelectedBL(null);
        }
        // 데이터 새로고침
        await fetchData();
      } else {
        setSearchMessage(`삭제 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('Delete failed:', error);
      setSearchMessage('삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
      setTimeout(() => setSearchMessage(''), 3000);
    }
  };

  // 필터링된 데이터
  const filteredList = useMemo(() => {
    return allData.filter(item => {
      if (appliedFilters.mblNo && !item.mblNo.toLowerCase().includes(appliedFilters.mblNo.toLowerCase())) return false;
      if (appliedFilters.hblNo && !item.hblNo.toLowerCase().includes(appliedFilters.hblNo.toLowerCase())) return false;
      if (appliedFilters.blType && item.blType !== appliedFilters.blType) return false;
      if (appliedFilters.status && item.status !== appliedFilters.status) return false;
      if (appliedFilters.carrier && item.carrier !== appliedFilters.carrier) return false;
      if (appliedFilters.pol && !item.polCode.toLowerCase().includes(appliedFilters.pol.toLowerCase()) && !item.polName.toLowerCase().includes(appliedFilters.pol.toLowerCase())) return false;
      if (appliedFilters.pod && !item.podCode.toLowerCase().includes(appliedFilters.pod.toLowerCase()) && !item.podName.toLowerCase().includes(appliedFilters.pod.toLowerCase())) return false;
      if (appliedFilters.consignee && !item.consignee.toLowerCase().includes(appliedFilters.consignee.toLowerCase())) return false;
      if (appliedFilters.vesselName && !item.vesselName.toLowerCase().includes(appliedFilters.vesselName.toLowerCase())) return false;

      // 날짜 필터링
      const dateField = appliedFilters.dateType as keyof BLData;
      const itemDate = item[dateField] as string;
      if (appliedFilters.dateFrom && itemDate && itemDate < appliedFilters.dateFrom) return false;
      if (appliedFilters.dateTo && itemDate && itemDate > appliedFilters.dateTo) return false;

      return true;
    });
  }, [allData, appliedFilters]);

  // 정렬된 데이터
  const sortedList = useMemo(() => {
    if (!sortConfig.key) return filteredList;
    return [...filteredList].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      let comparison = 0;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue), 'ko');
      }
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredList, sortConfig]);

  // 상태별 요약
  const summary = useMemo(() => ({
    total: filteredList.length,
    pending: filteredList.filter(b => b.status === 'pending').length,
    departed: filteredList.filter(b => b.status === 'departed').length,
    in_transit: filteredList.filter(b => b.status === 'in_transit').length,
    arrived: filteredList.filter(b => b.status === 'arrived').length,
    customs: filteredList.filter(b => b.status === 'customs').length,
    delivered: filteredList.filter(b => b.status === 'delivered').length,
    DRAFT: filteredList.filter(b => b.status === 'DRAFT').length,
  }), [filteredList]);

  // 검색 실행
  const handleSearch = () => {
    setAppliedFilters({ ...filters });
    setSelectedRows([]);
    setCurrentPage(1);
    setSearchMessage(`검색 완료: ${filteredList.length}건이 조회되었습니다.`);
    setTimeout(() => setSearchMessage(''), 3000);
  };

  // 검색 조건 초기화
  const handleReset = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setSelectedRows([]);
    setSortConfig({ key: null, direction: 'asc' });
    setSearchMessage('검색 조건이 초기화되었습니다.');
    setTimeout(() => setSearchMessage(''), 3000);
  };

  const handleSort = (key: keyof BLData) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const SortableHeader = ({ columnKey, label, className = '' }: { columnKey: keyof BLData; label: string; className?: string }) => (
    <th
      className={`p-3 text-sm cursor-pointer hover:bg-[var(--surface-200)] select-none ${className}`}
      onClick={() => handleSort(columnKey)}
    >
      <span className="inline-flex items-center">
        {label}
        <SortIcon columnKey={columnKey} sortConfig={sortConfig} />
      </span>
    </th>
  );

  const getSortStatusText = () => {
    if (!sortConfig.key) return '';
    const label = columnLabels[sortConfig.key] || sortConfig.key;
    const direction = sortConfig.direction === 'asc' ? '오름차순' : '내림차순';
    return ` | 정렬: ${label} ${direction}`;
  };

  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // 상세 보기
  const handleViewDetail = (bl: BLData) => {
    setSelectedBL(bl);
    setViewMode('detail');
  };

  // Excel 다운로드
  const handleExcelDownload = () => {
    if (filteredList.length === 0) {
      setSearchMessage('다운로드할 데이터가 없습니다.');
      setTimeout(() => setSearchMessage(''), 3000);
      return;
    }

    // Excel용 데이터 변환
    const excelData = filteredList.map((item, index) => ({
      'No': index + 1,
      'HBL No': item.hblNo,
      'MBL No': item.mblNo,
      'B/L Type': item.blType,
      '선명': item.vesselName,
      '항차': item.voyageNo,
      '선적항(POL)': `${item.polCode} (${item.polName})`,
      '양하항(POD)': `${item.podCode} (${item.podName})`,
      'ETD': item.etd || '-',
      'ETA': item.eta || '-',
      'ATD': item.atd || '-',
      'ATA': item.ata || '-',
      '송화인(Shipper)': item.shipper || '-',
      '수화인(Consignee)': item.consignee || '-',
      '통지처(Notify)': item.notifyParty || '-',
      '수량': item.containerQty,
      '포장유형': item.containerType || '-',
      '중량(kg)': item.weight,
      '용적(CBM)': item.volume,
      '상태': statusConfig[item.status]?.label || item.status,
      '선사': item.carrier || '-',
    }));

    // 워크시트 생성
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // 컬럼 너비 설정
    worksheet['!cols'] = [
      { wch: 5 },   // No
      { wch: 20 },  // HBL No
      { wch: 20 },  // MBL No
      { wch: 8 },   // B/L Type
      { wch: 18 },  // 선명
      { wch: 10 },  // 항차
      { wch: 20 },  // 선적항
      { wch: 20 },  // 양하항
      { wch: 12 },  // ETD
      { wch: 12 },  // ETA
      { wch: 12 },  // ATD
      { wch: 12 },  // ATA
      { wch: 25 },  // 송화인
      { wch: 25 },  // 수화인
      { wch: 25 },  // 통지처
      { wch: 8 },   // 수량
      { wch: 10 },  // 포장유형
      { wch: 12 },  // 중량
      { wch: 10 },  // 용적
      { wch: 10 },  // 상태
      { wch: 15 },  // 선사
    ];

    // 워크북 생성
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '수입 B/L 목록');

    // 파일명 생성 (현재 날짜 포함)
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const fileName = `수입BL목록_${dateStr}.xlsx`;

    // 다운로드
    XLSX.writeFile(workbook, fileName);

    setSearchMessage(`${filteredList.length}건의 데이터가 Excel로 다운로드되었습니다.`);
    setTimeout(() => setSearchMessage(''), 3000);
  };

  // Excel 업로드 - 파일 선택 처리
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number)[][];

        // 첫 번째 행은 헤더로 간주
        if (jsonData.length < 2) {
          setUploadErrors(['데이터가 없습니다. 헤더 행 다음에 데이터가 필요합니다.']);
          return;
        }

        const parsedData: ExcelUploadData[] = [];
        const errors: string[] = [];

        // 데이터 행 파싱 (2번째 행부터)
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0 || !row[0]) continue; // 빈 행 스킵

          const rowErrors: string[] = [];

          // 필수 필드 검증
          const mblNo = String(row[0] || '').trim();
          const hblNo = String(row[1] || '').trim();
          const polCode = String(row[4] || '').trim();
          const podCode = String(row[5] || '').trim();

          if (!mblNo) rowErrors.push('MBL No 필수');
          if (!hblNo) rowErrors.push('HBL No 필수');
          if (!polCode) rowErrors.push('선적항 필수');
          if (!podCode) rowErrors.push('양하항 필수');

          const uploadRow: ExcelUploadData = {
            rowNum: i + 1,
            mblNo,
            hblNo,
            vesselName: String(row[2] || '').trim(),
            voyageNo: String(row[3] || '').trim(),
            polCode,
            podCode,
            etd: formatExcelDate(row[6]),
            eta: formatExcelDate(row[7]),
            shipperName: String(row[8] || '').trim(),
            consigneeName: String(row[9] || '').trim(),
            notifyParty: String(row[10] || '').trim(),
            packageQty: Number(row[11]) || 0,
            packageType: String(row[12] || '').trim(),
            grossWeight: Number(row[13]) || 0,
            volume: Number(row[14]) || 0,
            cargoDescription: String(row[15] || '').trim(),
            freightTerm: String(row[16] || 'PREPAID').trim(),
            isValid: rowErrors.length === 0,
            errorMessage: rowErrors.join(', '),
          };

          parsedData.push(uploadRow);
          if (rowErrors.length > 0) {
            errors.push(`행 ${i + 1}: ${rowErrors.join(', ')}`);
          }
        }

        setUploadData(parsedData);
        setUploadErrors(errors);
        setShowUploadModal(true);
      } catch (error) {
        console.error('Excel 파싱 오류:', error);
        setUploadErrors(['Excel 파일을 읽는 중 오류가 발생했습니다.']);
        setShowUploadModal(true);
      }
    };
    reader.readAsArrayBuffer(file);

    // 파일 입력 초기화 (같은 파일 다시 선택 가능하도록)
    e.target.value = '';
  };

  // Excel 날짜 변환 함수
  const formatExcelDate = (value: string | number | undefined): string => {
    if (!value) return '';

    // 숫자인 경우 (Excel 날짜 시리얼 넘버)
    if (typeof value === 'number') {
      const date = XLSX.SSF.parse_date_code(value);
      if (date) {
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
      }
    }

    // 문자열인 경우
    const strValue = String(value).trim();
    // YYYY-MM-DD 형식 확인
    if (/^\d{4}-\d{2}-\d{2}$/.test(strValue)) {
      return strValue;
    }
    // YYYY/MM/DD 형식
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(strValue)) {
      return strValue.replace(/\//g, '-');
    }

    return strValue;
  };

  // Excel 업로드 - 일괄 등록 실행
  const executeUpload = async () => {
    const validData = uploadData.filter(row => row.isValid);
    if (validData.length === 0) {
      setSearchMessage('등록할 유효한 데이터가 없습니다.');
      setTimeout(() => setSearchMessage(''), 3000);
      return;
    }

    setIsUploading(true);
    let successCount = 0;
    let failCount = 0;
    const newErrors: string[] = [];

    for (const row of validData) {
      try {
        const response = await fetch('/api/bl/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mblNo: row.mblNo,
            hblNo: row.hblNo,
            vesselName: row.vesselName || undefined,
            voyageNo: row.voyageNo || undefined,
            portOfLoading: row.polCode,
            portOfDischarge: row.podCode,
            etd: row.etd || undefined,
            eta: row.eta || undefined,
            shipperName: row.shipperName || undefined,
            consigneeName: row.consigneeName || undefined,
            notifyParty: row.notifyParty || undefined,
            packageQty: row.packageQty || undefined,
            packageType: row.packageType || undefined,
            grossWeight: row.grossWeight || undefined,
            measurement: row.volume || undefined,
            cargoDescription: row.cargoDescription || undefined,
            freightTerm: row.freightTerm || 'PREPAID',
          }),
        });

        if (response.ok) {
          successCount++;
        } else {
          const result = await response.json();
          failCount++;
          newErrors.push(`행 ${row.rowNum}: ${result.error || '등록 실패'}`);
        }
      } catch (error) {
        failCount++;
        newErrors.push(`행 ${row.rowNum}: 네트워크 오류`);
      }
    }

    setIsUploading(false);
    setShowUploadModal(false);
    setUploadData([]);
    setUploadErrors([]);

    // 결과 메시지
    if (failCount === 0) {
      setSearchMessage(`${successCount}건의 B/L이 성공적으로 등록되었습니다.`);
    } else {
      setSearchMessage(`등록 완료: 성공 ${successCount}건, 실패 ${failCount}건`);
      console.error('업로드 오류:', newErrors);
    }
    setTimeout(() => setSearchMessage(''), 5000);

    // 데이터 새로고침
    await fetchData();
  };

  // 샘플 Excel 다운로드
  const downloadSampleExcel = () => {
    const sampleData = [
      ['MBL No', 'HBL No', '선명', '항차', '선적항(POL)', '양하항(POD)', 'ETD', 'ETA', '송화인', '수화인', '통지처', '수량', '포장유형', '중량(kg)', '용적(CBM)', '화물설명', '운임조건'],
      ['MBL2026001', 'HBL2026001', 'EVER GOODS', 'V.001E', 'CNSHA', 'KRPUS', '2026-01-25', '2026-01-28', 'CHINA SHIPPER CO.', 'KOREA CONSIGNEE', 'SAME AS CONSIGNEE', 100, 'CTN', 5000, 25.5, 'ELECTRONIC PARTS', 'PREPAID'],
      ['MBL2026002', 'HBL2026002', 'MSC OSCAR', 'V.002W', 'JPYOK', 'KRPUS', '2026-02-01', '2026-02-03', 'JAPAN SHIPPER', 'KOREA BUYER', '', 50, 'PLT', 3000, 15.0, 'AUTO PARTS', 'COLLECT'],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
    worksheet['!cols'] = [
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
      { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 25 }, { wch: 10 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'B/L 업로드 샘플');
    XLSX.writeFile(workbook, 'BL_Upload_Sample.xlsx');
  };

  // 신규
  const handleNew = () => {
    router.push('/logis/import-bl/sea/register');
  };

  // 수정
  const handleEdit = () => {
    if (selectedRows.length === 0) {
      setSearchMessage('수정할 B/L을 선택해주세요.');
      setTimeout(() => setSearchMessage(''), 3000);
      return;
    }
    if (selectedRows.length > 1) {
      setSearchMessage('수정은 1건만 선택해주세요.');
      setTimeout(() => setSearchMessage(''), 3000);
      return;
    }
    const selectedId = selectedRows[0];
    router.push(`/logis/import-bl/sea/register?hblId=${selectedId}`);
  };

  // E-mail 발송
  const handleEmail = () => {
    if (selectedRows.length === 0) {
      setSearchMessage('E-mail을 발송할 B/L을 선택해주세요.');
      setTimeout(() => setSearchMessage(''), 3000);
      return;
    }
    const targets = allData.filter(item => selectedRows.includes(item.id));
    setEmailTarget(targets);
    setShowEmailModal(true);
  };

  // 이메일 발송 처리
  const handleEmailSend = (emailData: any) => {
    console.log('이메일 발송:', emailData);
    console.log('대상 B/L:', emailTarget.map(t => t.hblNo));
    setSearchMessage(`${emailTarget.length}건의 B/L이 이메일로 발송되었습니다.`);
    setTimeout(() => setSearchMessage(''), 5000);
    setSelectedRows([]);
  };

  // 페이지네이션
  const totalPages = Math.ceil(sortedList.length / pageSize);
  const paginatedData = sortedList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
        <PageLayout title="수입 B/L 관리 (해상)" subtitle="수입 B/L관리  B/L관리 (해상)" showCloseButton={false} >

        <main ref={formRef} className="p-6">
          {viewMode === 'list' ? (
            <>
              {/* 상단 버튼 영역 - 통일된 스타일 */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  {selectedRows.length > 0 && (
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                      {selectedRows.length}건 선택
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <ActionButton variant="default" icon="plus" onClick={handleNew}>신규</ActionButton>
                  <ActionButton variant="default" icon="edit" onClick={handleEdit}>수정</ActionButton>
                  <ActionButton variant="default" icon="delete" onClick={handleDeleteSelected}>삭제</ActionButton>
                  <ActionButton variant="default" icon="email" onClick={handleEmail}>E-mail</ActionButton>
                  <ActionButton variant="default" icon="print" onClick={handlePrintBL}>B/L 출력</ActionButton>
                  <ActionButton variant="default" icon="refresh" onClick={handleReset}>초기화</ActionButton>
                  <label className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)] transition-colors cursor-pointer flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    엑셀업로드
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {searchMessage && (
                <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded-lg">{searchMessage}</div>
              )}

              {/* 검색조건 - 화면설계서 기준 */}
              <div className="card mb-6">
                <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
                  <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="font-bold">검색조건</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    {/* 일자유형 및 기간 */}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-1">조회기간</label>
                      <div className="flex items-center gap-2 flex-nowrap">
                        <select
                          value={filters.dateType}
                          onChange={(e) => handleFilterChange('dateType', e.target.value)}
                          className="w-24 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--border-hover)] flex-shrink-0"
                        >
                          <option value="eta">ETA</option>
                          <option value="etd">ETD</option>
                          <option value="ata">ATA</option>
                          <option value="atd">ATD</option>
                        </select>
                        <input
                          type="date"
                          value={filters.dateFrom}
                          onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                          className="w-[140px] h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--border-hover)] flex-shrink-0"
                        />
                        <span className="text-[var(--muted)] flex-shrink-0">~</span>
                        <input
                          type="date"
                          value={filters.dateTo}
                          onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                          className="w-[140px] h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--border-hover)] flex-shrink-0"
                        />
                        <DateRangeButtons onRangeSelect={(start, end) => { handleFilterChange('dateFrom', start); handleFilterChange('dateTo', end); }} />
                      </div>
                    </div>
                    {/* MBL No */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-1">MBL No</label>
                      <input
                        type="text"
                        value={filters.mblNo}
                        onChange={(e) => handleFilterChange('mblNo', e.target.value)}
                        className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--border-hover)]"
                        placeholder="MBL 번호"
                      />
                    </div>
                    {/* HBL No */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-1">HBL No</label>
                      <input
                        type="text"
                        value={filters.hblNo}
                        onChange={(e) => handleFilterChange('hblNo', e.target.value)}
                        className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--border-hover)]"
                        placeholder="HBL 번호"
                      />
                    </div>
                    {/* B/L Type */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-1">B/L Type</label>
                      <select
                        value={filters.blType}
                        onChange={(e) => handleFilterChange('blType', e.target.value)}
                        className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--border-hover)]"
                      >
                        <option value="">전체</option>
                        <option value="MBL">MBL</option>
                        <option value="HBL">HBL</option>
                      </select>
                    </div>
                    {/* 상태 */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-1">상태</label>
                      <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--border-hover)]"
                      >
                        <option value="">전체</option>
                        <option value="pending">대기</option>
                        <option value="departed">출항</option>
                        <option value="in_transit">운송중</option>
                        <option value="arrived">도착</option>
                        <option value="customs">통관중</option>
                        <option value="delivered">인도완료</option>
                      </select>
                    </div>
                    {/* 선사 */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-1">선사</label>
                      <select
                        value={filters.carrier}
                        onChange={(e) => handleFilterChange('carrier', e.target.value)}
                        className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--border-hover)]"
                      >
                        <option value="">전체</option>
                        <option value="MAERSK">MAERSK</option>
                        <option value="MSC">MSC</option>
                        <option value="COSCO">COSCO</option>
                        <option value="EVERGREEN">EVERGREEN</option>
                        <option value="HAPAG-LLOYD">HAPAG-LLOYD</option>
                        <option value="ONE">ONE</option>
                        <option value="YANGMING">YANGMING</option>
                        <option value="HMM">HMM</option>
                      </select>
                    </div>
                    {/* 선적항 */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-1">선적항 (POL)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={filters.pol}
                          onChange={(e) => handleFilterChange('pol', e.target.value)}
                          className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--border-hover)]"
                          placeholder="항구 코드/명"
                        />
                        <button className="h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {/* 양하항 */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-1">양하항 (POD)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={filters.pod}
                          onChange={(e) => handleFilterChange('pod', e.target.value)}
                          className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--border-hover)]"
                          placeholder="항구 코드/명"
                        />
                        <button className="h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {/* 수화인 */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-1">수화인 (Consignee)</label>
                      <input
                        type="text"
                        value={filters.consignee}
                        onChange={(e) => handleFilterChange('consignee', e.target.value)}
                        className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--border-hover)]"
                        placeholder="수화인명"
                      />
                    </div>
                    {/* 선명 */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-1">선명</label>
                      <input
                        type="text"
                        value={filters.vesselName}
                        onChange={(e) => handleFilterChange('vesselName', e.target.value)}
                        className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--border-hover)]"
                        placeholder="선박명"
                      />
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-[var(--border)] flex justify-center gap-2">
                  <button onClick={handleSearch} className="px-6 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] font-medium">조회</button>
                  <button onClick={handleReset} className="px-6 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">초기화</button>
                </div>
              </div>

              {/* 상태별 현황 카드 */}
              <div className="grid grid-cols-5 gap-4 mb-6">
                <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: '' })); setAppliedFilters(prev => ({ ...prev, status: '' })); }}>
                  <p className="text-2xl font-bold">{loading ? '-' : summary.total}</p>
                  <p className="text-sm text-[var(--muted)]">전체</p>
                </div>
                <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'DRAFT' })); setAppliedFilters(prev => ({ ...prev, status: 'DRAFT' })); }}>
                  <p className="text-2xl font-bold text-[#9333EA]">{loading ? '-' : summary.DRAFT}</p>
                  <p className="text-sm text-[var(--muted)]">작성중</p>
                </div>
                <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'pending' })); setAppliedFilters(prev => ({ ...prev, status: 'pending' })); }}>
                  <p className="text-2xl font-bold text-[#6B7280]">{loading ? '-' : summary.pending}</p>
                  <p className="text-sm text-[var(--muted)]">대기</p>
                </div>
                <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'departed' })); setAppliedFilters(prev => ({ ...prev, status: 'departed' })); }}>
                  <p className="text-2xl font-bold text-[#2563EB]">{loading ? '-' : summary.departed}</p>
                  <p className="text-sm text-[var(--muted)]">출항</p>
                </div>
                <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'in_transit' })); setAppliedFilters(prev => ({ ...prev, status: 'in_transit' })); }}>
                  <p className="text-2xl font-bold text-[#7C3AED]">{loading ? '-' : summary.in_transit}</p>
                  <p className="text-sm text-[var(--muted)]">운송중</p>
                </div>
                <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'arrived' })); setAppliedFilters(prev => ({ ...prev, status: 'arrived' })); }}>
                  <p className="text-2xl font-bold text-[#059669]">{loading ? '-' : summary.arrived}</p>
                  <p className="text-sm text-[var(--muted)]">도착</p>
                </div>
                <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'customs' })); setAppliedFilters(prev => ({ ...prev, status: 'customs' })); }}>
                  <p className="text-2xl font-bold text-[#EA580C]">{loading ? '-' : summary.customs}</p>
                  <p className="text-sm text-[var(--muted)]">통관중</p>
                </div>
                <div className="card p-4 text-center cursor-pointer hover:shadow-lg" onClick={() => { setFilters(prev => ({ ...prev, status: 'delivered' })); setAppliedFilters(prev => ({ ...prev, status: 'delivered' })); }}>
                  <p className="text-2xl font-bold text-[#0D9488]">{loading ? '-' : summary.delivered}</p>
                  <p className="text-sm text-[var(--muted)]">인도완료</p>
                </div>
              </div>

              {/* 조회 결과 섹션 */}
              <div className="card">
                <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
                  <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#059669]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    B/L 목록
                    <span className="text-sm font-normal text-[var(--muted)]">({sortedList.length}건){getSortStatusText()}</span>
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleExcelDownload}
                      className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      엑셀다운로드
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th className="w-10">
                          <input
                            type="checkbox"
                            checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRows(paginatedData.map(q => q.id));
                              } else {
                                setSelectedRows([]);
                              }
                            }}
                            className="rounded"
                          />
                        </th>
                        <th className="p-3 text-center text-sm font-medium text-[var(--foreground)]">No</th>
                        <SortableHeader columnKey="hblNo" label="HBL No" className="text-center font-medium text-[var(--foreground)]" />
                        <SortableHeader columnKey="mblNo" label="MBL No" className="text-center font-medium text-[var(--foreground)]" />
                        <SortableHeader columnKey="blType" label="Type" className="text-center font-medium text-[var(--foreground)]" />
                        <SortableHeader columnKey="vesselName" label="선명/항차" className="text-center font-medium text-[var(--foreground)]" />
                        <SortableHeader columnKey="polCode" label="POL" className="text-center font-medium text-[var(--foreground)]" />
                        <SortableHeader columnKey="podCode" label="POD" className="text-center font-medium text-[var(--foreground)]" />
                        <SortableHeader columnKey="etd" label="ETD" className="text-center font-medium text-[var(--foreground)]" />
                        <SortableHeader columnKey="eta" label="ETA" className="text-center font-medium text-[var(--foreground)]" />
                        <SortableHeader columnKey="consignee" label="수화인" className="text-center font-medium text-[var(--foreground)]" />
                        <SortableHeader columnKey="containerQty" label="CNT" className="text-center font-medium text-[var(--foreground)]" />
                        <SortableHeader columnKey="status" label="상태" className="text-center font-medium text-[var(--foreground)]" />
                        <SortableHeader columnKey="carrier" label="선사" className="text-center font-medium text-[var(--foreground)]" />
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((row, index) => (
                        <tr
                          key={row.id}
                          className="border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer"
                          onClick={() => handleViewDetail(row)}
                        >
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedRows.includes(row.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRows([...selectedRows, row.id]);
                                } else {
                                  setSelectedRows(selectedRows.filter(id => id !== row.id));
                                }
                              }}
                              className="rounded"
                            />
                          </td>
                          <td className="p-3 text-sm text-[var(--muted)]">{(currentPage - 1) * pageSize + index + 1}</td>
                          <td className="p-3">
                            <span className="text-sm font-medium text-[#2563EB] hover:underline">
                              {row.hblNo}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-[var(--foreground)]">{row.mblNo}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              row.blType === 'MBL'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {row.blType}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-[var(--foreground)]">
                            {row.vesselName} / {row.voyageNo}
                          </td>
                          <td className="p-3 text-sm text-[var(--foreground)]">
                            <span className="font-medium">{row.polCode}</span>
                            <span className="text-[var(--muted)] ml-1">({row.polName})</span>
                          </td>
                          <td className="p-3 text-sm text-[var(--foreground)]">
                            <span className="font-medium">{row.podCode}</span>
                            <span className="text-[var(--muted)] ml-1">({row.podName})</span>
                          </td>
                          <td className="p-3 text-sm text-center text-[var(--foreground)]">{row.etd}</td>
                          <td className="p-3 text-sm text-center text-[var(--foreground)]">{row.eta}</td>
                          <td className="p-3 text-sm text-[var(--foreground)]">{row.consignee}</td>
                          <td className="p-3 text-sm text-center text-[var(--foreground)]">
                            {row.containerQty} x {row.containerType}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className="inline-block px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                color: statusConfig[row.status]?.color || '#6B7280',
                                backgroundColor: statusConfig[row.status]?.bgColor || '#F3F4F6',
                              }}
                            >
                              {statusConfig[row.status]?.label || row.status}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-center font-medium text-[var(--foreground)]">{row.carrier}</td>
                        </tr>
                      ))}
                      {loading && (
                        <tr>
                          <td colSpan={14} className="p-8 text-center text-[var(--muted)]">
                            데이터를 불러오는 중...
                          </td>
                        </tr>
                      )}
                      {!loading && paginatedData.length === 0 && (
                        <tr>
                          <td colSpan={14} className="p-8 text-center text-[var(--muted)]">
                            조회된 데이터가 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="p-4 border-t border-[var(--border)] flex justify-center items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-sm bg-[var(--surface-100)] rounded-lg hover:bg-[var(--surface-200)] disabled:opacity-50"
                    >
                      {'<<'}
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-sm bg-[var(--surface-100)] rounded-lg hover:bg-[var(--surface-200)] disabled:opacity-50"
                    >
                      {'<'}
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1.5 text-sm rounded-lg ${
                          currentPage === page
                            ? 'bg-[#1A2744] text-white'
                            : 'bg-[var(--surface-100)] hover:bg-[var(--surface-200)]'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-sm bg-[var(--surface-100)] rounded-lg hover:bg-[var(--surface-200)] disabled:opacity-50"
                    >
                      {'>'}
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-sm bg-[var(--surface-100)] rounded-lg hover:bg-[var(--surface-200)] disabled:opacity-50"
                    >
                      {'>>'}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* 상세 보기 모드 */
            selectedBL && (
              <>
                {/* 상단 버튼 영역 */}
                <div className="flex justify-between items-center mb-6">
                  <button
                    onClick={() => setViewMode('list')}
                    className="flex items-center gap-2 text-[var(--foreground)] hover:text-[#E8A838] transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    목록으로 돌아가기
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/logis/import-bl/sea/register?hblId=${selectedBL.id}`)}
                      className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)] transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteSingle(selectedBL)}
                      className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)] transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      삭제
                    </button>
                    <button className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)] transition-colors">
                      A/N 발행
                    </button>
                    <button className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)] transition-colors">
                      D/O 발행
                    </button>
                  </div>
                </div>

                {/* B/L 상세 정보 */}
                <div className="grid grid-cols-2 gap-6">
                  {/* 기본 정보 */}
                  <div className="card">
                    <div className="p-4 border-b border-[var(--border)]">
                      <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-[#059669] rounded-full"></span>
                        B/L 기본정보
                      </h3>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">HBL No</label>
                        <p className="text-[var(--foreground)] font-semibold">{selectedBL.hblNo || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">MBL No</label>
                        <p className="text-[var(--foreground)]">{selectedBL.mblNo || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">B/L Type</label>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          selectedBL.blType === 'MBL'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {selectedBL.blType}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">상태</label>
                        <span
                          className="inline-block px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            color: statusConfig[selectedBL.status]?.color || '#6B7280',
                            backgroundColor: statusConfig[selectedBL.status]?.bgColor || '#F3F4F6',
                          }}
                        >
                          {statusConfig[selectedBL.status]?.label || selectedBL.status}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">선사</label>
                        <p className="text-[var(--foreground)]">{selectedBL.carrier || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">선명 / 항차</label>
                        <p className="text-[var(--foreground)]">{selectedBL.vesselName || '-'} / {selectedBL.voyageNo || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* 운송 정보 */}
                  <div className="card">
                    <div className="p-4 border-b border-[var(--border)]">
                      <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-[#7C3AED] rounded-full"></span>
                        운송정보
                      </h3>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">선적항 (POL)</label>
                        <p className="text-[var(--foreground)]">
                          <span className="font-semibold">{selectedBL.polCode || '-'}</span>
                          {selectedBL.polName && <span> - {selectedBL.polName}</span>}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">양하항 (POD)</label>
                        <p className="text-[var(--foreground)]">
                          <span className="font-semibold">{selectedBL.podCode || '-'}</span>
                          {selectedBL.podName && <span> - {selectedBL.podName}</span>}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">ETD / ATD</label>
                        <p className="text-[var(--foreground)]">
                          <span className={selectedBL.etd ? '' : 'text-[var(--muted)]'}>{selectedBL.etd || '-'}</span>
                          {' / '}
                          <span className={selectedBL.atd ? '' : 'text-[var(--muted)]'}>{selectedBL.atd || '-'}</span>
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">ETA / ATA</label>
                        <p className="text-[var(--foreground)]">
                          <span className={selectedBL.eta ? '' : 'text-[var(--muted)]'}>{selectedBL.eta || '-'}</span>
                          {' / '}
                          <span className={selectedBL.ata ? '' : 'text-[var(--muted)]'}>{selectedBL.ata || '-'}</span>
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">수량 / 포장</label>
                        <p className="text-[var(--foreground)]">
                          {selectedBL.containerQty || 0} {selectedBL.containerType || '-'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">중량 / 용적</label>
                        <p className="text-[var(--foreground)]">
                          {(selectedBL.weight || 0).toLocaleString()} kg / {selectedBL.volume || 0} CBM
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 당사자 정보 */}
                  <div className="card col-span-2">
                    <div className="p-4 border-b border-[var(--border)]">
                      <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-[#E8A838] rounded-full"></span>
                        당사자 정보
                      </h3>
                    </div>
                    <div className="p-4 grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">송화인 (Shipper)</label>
                        <p className="text-[var(--foreground)]">{selectedBL.shipper || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">수화인 (Consignee)</label>
                        <p className="text-[var(--foreground)] font-semibold">{selectedBL.consignee || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">통지처 (Notify Party)</label>
                        <p className="text-[var(--foreground)]">{selectedBL.notifyParty || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )
          )}
        </main>
      {/* 삭제 확인 모달 */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--surface-50)] rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-[var(--border)]">
              <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                삭제 확인
              </h3>
            </div>
            <div className="p-6">
              <p className="text-[var(--foreground)] mb-4">
                다음 B/L을 삭제하시겠습니까?
              </p>
              <div className="bg-[var(--surface-100)] rounded-lg p-3 max-h-40 overflow-y-auto">
                <ul className="space-y-1">
                  {deleteTarget.hblNos.map((hblNo, index) => (
                    <li key={index} className="text-sm text-[var(--foreground)] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                      {hblNo}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-sm text-[var(--muted)] mt-4">
                총 {deleteTarget.ids.length}건의 B/L이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
            <div className="p-4 border-t border-[var(--border)] flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTarget(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)] transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={executeDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    삭제중...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    삭제
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel 업로드 모달 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--surface-50)] rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                엑셀업로드 미리보기
              </h3>
              <button
                onClick={downloadSampleExcel}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                샘플 엑셀다운로드
              </button>
            </div>

            <div className="p-6 flex-1 overflow-auto">
              {/* 요약 정보 */}
              <div className="mb-4 flex gap-4">
                <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
                  전체: {uploadData.length}건
                </div>
                <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                  유효: {uploadData.filter(r => r.isValid).length}건
                </div>
                <div className="px-4 py-2 bg-red-100 text-red-800 rounded-lg">
                  오류: {uploadData.filter(r => !r.isValid).length}건
                </div>
              </div>

              {/* 오류 목록 */}
              {uploadErrors.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800 mb-2">오류 목록:</p>
                  <ul className="text-sm text-red-700 space-y-1 max-h-24 overflow-y-auto">
                    {uploadErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 데이터 테이블 */}
              <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--surface-100)]">
                    <tr>
                      <th className="p-2 text-center font-medium">행</th>
                      <th className="p-2 text-center font-medium">상태</th>
                      <th className="p-2 text-center font-medium">MBL No</th>
                      <th className="p-2 text-center font-medium">HBL No</th>
                      <th className="p-2 text-center font-medium">선명</th>
                      <th className="p-2 text-center font-medium">POL</th>
                      <th className="p-2 text-center font-medium">POD</th>
                      <th className="p-2 text-center font-medium">ETD</th>
                      <th className="p-2 text-center font-medium">ETA</th>
                      <th className="p-2 text-center font-medium">송화인</th>
                      <th className="p-2 text-center font-medium">수화인</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadData.map((row, index) => (
                      <tr
                        key={index}
                        className={`border-t border-[var(--border)] ${!row.isValid ? 'bg-red-50' : ''}`}
                      >
                        <td className="p-2">{row.rowNum}</td>
                        <td className="p-2">
                          {row.isValid ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                              유효
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800" title={row.errorMessage}>
                              오류
                            </span>
                          )}
                        </td>
                        <td className="p-2 font-medium">{row.mblNo || '-'}</td>
                        <td className="p-2 font-medium">{row.hblNo || '-'}</td>
                        <td className="p-2">{row.vesselName || '-'}</td>
                        <td className="p-2">{row.polCode || '-'}</td>
                        <td className="p-2">{row.podCode || '-'}</td>
                        <td className="p-2">{row.etd || '-'}</td>
                        <td className="p-2">{row.eta || '-'}</td>
                        <td className="p-2">{row.shipperName || '-'}</td>
                        <td className="p-2">{row.consigneeName || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-[var(--border)] flex justify-between items-center">
              <p className="text-sm text-[var(--muted)]">
                유효한 {uploadData.filter(r => r.isValid).length}건의 데이터가 등록됩니다.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadData([]);
                    setUploadErrors([]);
                  }}
                  disabled={isUploading}
                  className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)] transition-colors disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  onClick={executeUpload}
                  disabled={isUploading || uploadData.filter(r => r.isValid).length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      등록중...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      일괄 등록 ({uploadData.filter(r => r.isValid).length}건)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 이메일 모달 */}
      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSend={handleEmailSend}
        documentType="bl"
        documentNo={emailTarget.length > 0 ? emailTarget.map(t => t.hblNo).join(', ') : ''}
        defaultSubject={emailTarget.length > 0 ? `[B/L] ${emailTarget.map(t => t.hblNo).join(', ')} - 선적 서류 송부` : ''}
      />

      {/* 화면 닫기 확인 모달 */}
      <CloseConfirmModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onConfirm={handleConfirmClose}
      />

      {/* B/L 출력 모달 */}
      <BLPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        blData={printData}
      />
    </PageLayout>
  );
}
