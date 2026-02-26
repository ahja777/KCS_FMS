"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import PageLayout from "@/components/PageLayout";
import CloseConfirmModal from "@/components/CloseConfirmModal";
import { useCloseConfirm } from "@/hooks/useCloseConfirm";
import { LIST_PATHS } from "@/constants/paths";
import SelectionAlertModal from "@/components/SelectionAlertModal";
import EmailModal from "@/components/EmailModal";
import CodeSearchModal, {
  CodeType,
  CodeItem,
} from "@/components/popup/CodeSearchModal";
import BLPrintModal, { BLData as PrintBLData } from "@/components/BLPrintModal";
import { ActionButton } from "@/components/buttons";
import SearchFilterPanel, {
  SearchFilterGrid,
  SearchFilterField,
  DateRangeField,
  SearchInputField,
  SelectField,
  TextField,
} from "@/components/search/SearchFilterPanel";
import DateRangeButtons, { getToday } from "@/components/DateRangeButtons";

// 화면설계서 UI-G-01-07-02 기준 검색조건 인터페이스
interface SearchFilters {
  ioType: string; // 수출입구분 (IN/OUT)
  obDateFrom: string; // O/B.Date 시작
  obDateTo: string; // O/B.Date 종료
  arDateFrom: string; // A/R.Date 시작
  arDateTo: string; // A/R.Date 종료
  shipperCode: string; // Shipper
  consigneeCode: string; // Consignee
  notifyCode: string; // Notify
  lineCode: string; // Line
  partnerCode: string; // Partner
  loadingPort: string; // Loading
  licenseNo: string; // License No.
  businessType: string; // Business Type
  containerNo: string; // CTNR NO./Original
  vessel: string; // Vessel / Area
  inputEmployee: string; // 입력사원
  branchType: string; // 본지사
}

// 화면설계서 UI-G-01-07-02 기준 목록 데이터 인터페이스
interface SeaBL {
  id: string;
  obDate: string; // O/B.Date
  arDate: string; // A/R.Date
  jobNo: string; // JOB.NO.
  srNo: string; // S/R NO.
  mblNo: string; // M.B/L NO.
  hblNo: string; // H.B/L NO.
  lcNo: string; // L/C NO.
  poNo: string; // P/O NO.
  type: string; // TYPE
  dc: string; // D/C
  ln: string; // L/N
  pc: string; // PC (Prepaid/Collect)
  inco: string; // INCO (인코텀즈)
  // 추가 정보
  shipperName?: string;
  consigneeName?: string;
  pol?: string;
  pod?: string;
  vesselVoyage?: string;
  ioType?: string;
  status?: string;
}

const statusConfig: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  DRAFT: { label: "작성중", color: "#6B7280", bgColor: "#F3F4F6" },
  ISSUED: { label: "발행완료", color: "#059669", bgColor: "#D1FAE5" },
  SURRENDERED: { label: "Surrendered", color: "#2563EB", bgColor: "#DBEAFE" },
  RELEASED: { label: "Released", color: "#7C3AED", bgColor: "#EDE9FE" },
};

const getStatusConfig = (status: string) => {
  return (
    statusConfig[status] || {
      label: status || "미정",
      color: "#6B7280",
      bgColor: "#F3F4F6",
    }
  );
};

// 샘플 데이터 - 화면설계서 기준
const initialSampleData: SeaBL[] = [
  {
    id: "1",
    obDate: "2026-01-20",
    arDate: "2026-02-05",
    jobNo: "SEX-2026-0001",
    srNo: "SR-2026-0001",
    mblNo: "MAEU123456789",
    hblNo: "HBL2026010001",
    lcNo: "LC2026-001",
    poNo: "PO-001",
    type: "ORI",
    dc: "D",
    ln: "L",
    pc: "P",
    inco: "FOB",
    shipperName: "삼성전자",
    consigneeName: "ABC Corp",
    pol: "KRPUS",
    pod: "USLGB",
    vesselVoyage: "HANJIN BUSAN / 001E",
    ioType: "OUT",
    status: "ISSUED",
  },
  {
    id: "2",
    obDate: "2026-01-18",
    arDate: "2026-02-03",
    jobNo: "SEX-2026-0002",
    srNo: "SR-2026-0002",
    mblNo: "OOCL987654321",
    hblNo: "HBL2026010002",
    lcNo: "",
    poNo: "PO-002",
    type: "SWB",
    dc: "D",
    ln: "L",
    pc: "C",
    inco: "CFR",
    shipperName: "LG전자",
    consigneeName: "XYZ Ltd",
    pol: "KRPUS",
    pod: "DEHAM",
    vesselVoyage: "MSC GULSUN / W002",
    ioType: "OUT",
    status: "DRAFT",
  },
  {
    id: "3",
    obDate: "2026-01-15",
    arDate: "2026-01-28",
    jobNo: "SIM-2026-0001",
    srNo: "",
    mblNo: "HDMU246813579",
    hblNo: "HBL2026010003",
    lcNo: "LC2026-003",
    poNo: "",
    type: "ORI",
    dc: "C",
    ln: "N",
    pc: "P",
    inco: "CIF",
    shipperName: "현대자동차",
    consigneeName: "DEF Inc",
    pol: "KRINC",
    pod: "USNYC",
    vesselVoyage: "HMM ALGECIRAS / 003S",
    ioType: "IN",
    status: "SURRENDERED",
  },
  {
    id: "4",
    obDate: "2026-01-12",
    arDate: "2026-01-25",
    jobNo: "SEX-2026-0003",
    srNo: "SR-2026-0003",
    mblNo: "YMLU135792468",
    hblNo: "HBL2026010004",
    lcNo: "",
    poNo: "PO-004",
    type: "TLX",
    dc: "D",
    ln: "L",
    pc: "P",
    inco: "EXW",
    shipperName: "SK하이닉스",
    consigneeName: "GHI Corp",
    pol: "KRPUS",
    pod: "JPTYO",
    vesselVoyage: "ONE APUS / 004N",
    ioType: "OUT",
    status: "RELEASED",
  },
  {
    id: "5",
    obDate: "2026-01-10",
    arDate: "2026-01-22",
    jobNo: "SIM-2026-0002",
    srNo: "",
    mblNo: "COSU864209753",
    hblNo: "HBL2026010005",
    lcNo: "LC2026-005",
    poNo: "PO-005",
    type: "ORI",
    dc: "C",
    ln: "L",
    pc: "C",
    inco: "DDP",
    shipperName: "포스코",
    consigneeName: "JKL Ltd",
    pol: "CNSHA",
    pod: "KRPUS",
    vesselVoyage: "EVER GIVEN / 005E",
    ioType: "IN",
    status: "ISSUED",
  },
];

const today = getToday();
const initialFilters: SearchFilters = {
  ioType: "",
  obDateFrom: today,
  obDateTo: today,
  arDateFrom: "",
  arDateTo: "",
  shipperCode: "",
  consigneeCode: "",
  notifyCode: "",
  lineCode: "",
  partnerCode: "",
  loadingPort: "",
  licenseNo: "",
  businessType: "",
  containerNo: "",
  vessel: "",
  inputEmployee: "",
  branchType: "",
};

// 정렬 설정 인터페이스
interface SortConfig {
  key: keyof SeaBL | null;
  direction: "asc" | "desc";
}

// 컬럼 라벨 정의
const columnLabels: Record<string, string> = {
  obDate: "O/B.Date",
  arDate: "A/R.Date",
  jobNo: "JOB.NO.",
  srNo: "S/R NO.",
  mblNo: "M.B/L NO.",
  hblNo: "H.B/L NO.",
  lcNo: "L/C NO.",
  poNo: "P/O NO.",
  type: "TYPE",
  dc: "D/C",
  ln: "L/N",
  pc: "PC",
  inco: "INCO",
};

// 정렬 아이콘 컴포넌트 (CSS 삼각형 스타일)
const SortIcon = ({
  columnKey,
  sortConfig,
}: {
  columnKey: keyof SeaBL;
  sortConfig: SortConfig;
}) => {
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

export default function BLSeaPage() {
  const router = useRouter();
  const [allData, setAllData] = useState<SeaBL[]>(initialSampleData);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<SearchFilters>(initialFilters);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedRow, setSelectedRow] = useState<SeaBL | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSelectionAlert, setShowSelectionAlert] = useState(false);

  // 검색 팝업 상태
  const [showCodeSearchModal, setShowCodeSearchModal] = useState(false);
  const [searchModalType, setSearchModalType] = useState<CodeType>("customer");
  const [searchTargetField, setSearchTargetField] =
    useState<keyof SearchFilters>("shipperCode");

  // 정렬 상태
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: "asc",
  });

  // B/L 출력 관련 state
  const [printData, setPrintData] = useState<PrintBLData | null>(null);

  // 화면닫기 핸들러
  const handleConfirmClose = () => {
    setShowCloseModal(false);
    router.push(LIST_PATHS.DASHBOARD);
  };

  useCloseConfirm({
    showModal: showCloseModal,
    setShowModal: setShowCloseModal,
    onConfirmClose: handleConfirmClose,
  });

  // API에서 데이터 조회
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/bl/sea");
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setAllData(data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch B/L data:", error);
      }
    };
    fetchData();
  }, []);

  const filteredList = useMemo(() => {
    return allData.filter((item) => {
      if (appliedFilters.ioType && item.ioType !== appliedFilters.ioType)
        return false;
      if (appliedFilters.obDateFrom && item.obDate < appliedFilters.obDateFrom)
        return false;
      if (appliedFilters.obDateTo && item.obDate > appliedFilters.obDateTo)
        return false;
      if (appliedFilters.arDateFrom && item.arDate < appliedFilters.arDateFrom)
        return false;
      if (appliedFilters.arDateTo && item.arDate > appliedFilters.arDateTo)
        return false;
      if (
        appliedFilters.shipperCode &&
        !item.shipperName
          ?.toLowerCase()
          .includes(appliedFilters.shipperCode.toLowerCase())
      )
        return false;
      if (
        appliedFilters.consigneeCode &&
        !item.consigneeName
          ?.toLowerCase()
          .includes(appliedFilters.consigneeCode.toLowerCase())
      )
        return false;
      if (
        appliedFilters.loadingPort &&
        !item.pol
          ?.toLowerCase()
          .includes(appliedFilters.loadingPort.toLowerCase())
      )
        return false;
      if (
        appliedFilters.vessel &&
        !item.vesselVoyage
          ?.toLowerCase()
          .includes(appliedFilters.vessel.toLowerCase())
      )
        return false;
      if (
        appliedFilters.containerNo &&
        !item.mblNo
          ?.toLowerCase()
          .includes(appliedFilters.containerNo.toLowerCase())
      )
        return false;
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
      if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue), "ko");
      }
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [filteredList, sortConfig]);

  // 정렬 핸들러
  const handleSort = (key: keyof SeaBL) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // 정렬 가능한 헤더 컴포넌트
  const SortableHeader = ({
    columnKey,
    label,
    className = "",
  }: {
    columnKey: keyof SeaBL;
    label: string;
    className?: string;
  }) => (
    <th
      className={`cursor-pointer select-none ${className}`}
      onClick={() => handleSort(columnKey)}
    >
      <span className="inline-flex items-center">
        {label}
        <SortIcon columnKey={columnKey} sortConfig={sortConfig} />
      </span>
    </th>
  );

  // 정렬 상태 텍스트
  const getSortStatusText = () => {
    if (!sortConfig.key) return "";
    const label = columnLabels[sortConfig.key] || sortConfig.key;
    const direction = sortConfig.direction === "asc" ? "오름차순" : "내림차순";
    return ` | 정렬: ${label} ${direction}`;
  };

  // 핸들러
  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...filters });
    setSelectedIds(new Set());
    setSelectedRow(null);
  }, [filters]);

  const handleReset = useCallback(() => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setSelectedIds(new Set());
    setSelectedRow(null);
    setSortConfig({ key: null, direction: "asc" });
  }, []);

  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  // 검색 팝업 열기
  const openCodeSearchModal = (
    codeType: CodeType,
    targetField: keyof SearchFilters,
  ) => {
    setSearchModalType(codeType);
    setSearchTargetField(targetField);
    setShowCodeSearchModal(true);
  };

  // 검색 팝업에서 선택 처리
  const handleCodeSelect = (item: CodeItem) => {
    setFilters((prev) => ({
      ...prev,
      [searchTargetField]: item.name || item.code,
    }));
    setShowCodeSearchModal(false);
  };

  const handleRowSelect = (id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const handleSelectAll = () => {
    selectedIds.size === filteredList.length
      ? setSelectedIds(new Set())
      : setSelectedIds(new Set(filteredList.map((i) => i.id)));
  };

  const handleRowClick = (item: SeaBL) => {
    setSelectedRow(item);
  };

  const handleRowDoubleClick = (item: SeaBL) => {
    router.push(`/logis/bl/sea/${item.id}`);
  };

  // 신규 등록
  const handleNew = () => {
    router.push("/logis/bl/sea/register");
  };

  // 수정
  const handleEdit = () => {
    if (selectedIds.size !== 1) {
      alert("수정할 항목을 1개 선택해주세요.");
      return;
    }
    const id = Array.from(selectedIds)[0];
    router.push(`/logis/bl/sea/register?id=${id}`);
  };

  // 삭제
  const handleDelete = async () => {
    if (selectedIds.size === 0) {
      alert("삭제할 항목을 선택해주세요.");
      return;
    }
    // 발행완료 상태 체크
    const issued = allData.filter(
      (d) => selectedIds.has(d.id) && d.status === "ISSUED",
    );
    if (issued.length > 0) {
      alert("발행완료 상태의 B/L은 삭제할 수 없습니다.");
      return;
    }
    if (confirm(`${selectedIds.size}건을 삭제하시겠습니까?`)) {
      try {
        const ids = Array.from(selectedIds).join(",");
        const response = await fetch(`/api/bl/sea?ids=${ids}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setAllData((prev) => prev.filter((d) => !selectedIds.has(d.id)));
          setSelectedIds(new Set());
          setSelectedRow(null);
          alert("삭제되었습니다.");
        }
      } catch (error) {
        console.error("Delete error:", error);
        // 로컬 삭제 처리
        setAllData((prev) => prev.filter((d) => !selectedIds.has(d.id)));
        setSelectedIds(new Set());
        setSelectedRow(null);
      }
    }
  };

  // 출력 (BLPrintModal 사용)
  const handlePrint = () => {
    if (selectedIds.size === 0) {
      setShowSelectionAlert(true);
      return;
    }
    if (selectedIds.size > 1) {
      alert("B/L 출력은 한 건씩만 가능합니다.");
      return;
    }
    const selected = allData.find((item) => selectedIds.has(item.id));
    if (selected) {
      const blPrintData: PrintBLData = {
        hblNo: selected.hblNo,
        mblNo: selected.mblNo,
        bookingNo: "",
        blDate: selected.obDate,
        shipper: selected.shipperName || "",
        consignee: selected.consigneeName || "",
        notifyParty: "",
        carrier: "",
        vessel: selected.vesselVoyage?.split("/")[0]?.trim() || "",
        voyage: selected.vesselVoyage?.split("/")[1]?.trim() || "",
        pol: selected.pol || "",
        pod: selected.pod || "",
        etd: selected.obDate,
        eta: selected.arDate,
        containerType: "DRY",
        containerQty: 1,
        weight: 0,
        measurement: 0,
      };
      setPrintData(blPrintData);
      setShowPrintModal(true);
    }
  };

  // Excel 다운로드
  const handleExcel = () => {
    const dataToExport =
      selectedIds.size > 0
        ? sortedList.filter((item) => selectedIds.has(item.id))
        : sortedList;

    if (dataToExport.length === 0) {
      alert("다운로드할 데이터가 없습니다.");
      return;
    }

    // Excel용 데이터 변환
    const excelData = dataToExport.map((item, index) => ({
      No: index + 1,
      "O/B.Date": item.obDate || "-",
      "A/R.Date": item.arDate || "-",
      "JOB.NO.": item.jobNo || "-",
      "S/R NO.": item.srNo || "-",
      "M.B/L NO.": item.mblNo || "-",
      "H.B/L NO.": item.hblNo || "-",
      "L/C NO.": item.lcNo || "-",
      "P/O NO.": item.poNo || "-",
      TYPE: item.type || "-",
      "D/C": item.dc || "-",
      "L/N": item.ln || "-",
      PC: item.pc || "-",
      INCO: item.inco || "-",
      Shipper: item.shipperName || "-",
      Consignee: item.consigneeName || "-",
      POL: item.pol || "-",
      POD: item.pod || "-",
      "Vessel/Voyage": item.vesselVoyage || "-",
      상태: getStatusConfig(item.status || "").label,
    }));

    // 워크시트 생성
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // 컬럼 너비 설정
    worksheet["!cols"] = [
      { wch: 5 }, // No
      { wch: 12 }, // O/B.Date
      { wch: 12 }, // A/R.Date
      { wch: 18 }, // JOB.NO.
      { wch: 15 }, // S/R NO.
      { wch: 18 }, // M.B/L NO.
      { wch: 18 }, // H.B/L NO.
      { wch: 15 }, // L/C NO.
      { wch: 12 }, // P/O NO.
      { wch: 8 }, // TYPE
      { wch: 5 }, // D/C
      { wch: 5 }, // L/N
      { wch: 5 }, // PC
      { wch: 8 }, // INCO
      { wch: 20 }, // Shipper
      { wch: 20 }, // Consignee
      { wch: 10 }, // POL
      { wch: 10 }, // POD
      { wch: 25 }, // Vessel/Voyage
      { wch: 12 }, // 상태
    ];

    // 워크북 생성
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "수출 B/L 목록");

    // 파일명 생성 (현재 날짜 포함)
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
    const fileName = `수출BL목록_${dateStr}.xlsx`;

    // 다운로드
    XLSX.writeFile(workbook, fileName);

    alert(`${dataToExport.length}건의 데이터가 Excel로 다운로드되었습니다.`);
  };

  // E-mail
  const handleEmail = () => {
    if (selectedIds.size === 0) {
      alert("이메일 발송할 항목을 선택해주세요.");
      return;
    }
    setShowEmailModal(true);
  };

  return (
    <PageLayout
      title="B/L 조회 (해상)"
      subtitle="HOME > 선적관리 > B/L 관리(해상) > B/L 조회"
      showCloseButton={false}
    >
      <main className="p-6">
        {/* 상단 버튼 영역 - 통일된 스타일 */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50" disabled={selectedIds.size === 0}>삭제</button>
          </div>
          <div className="flex gap-2">
            <ActionButton variant="default" icon="plus" onClick={handleNew}>
              신규
            </ActionButton>
            <ActionButton variant="default" icon="edit" onClick={handleEdit}>
              수정
            </ActionButton>
            <ActionButton variant="default" icon="email" onClick={handleEmail}>
              E-mail
            </ActionButton>
            <ActionButton variant="default" icon="print" onClick={handlePrint}>
              B/L 출력
            </ActionButton>
            <ActionButton
              variant="default"
              icon="download"
              onClick={handleExcel}
            >
              Excel
            </ActionButton>
            <ActionButton
              variant="default"
              icon="refresh"
              onClick={handleReset}
            >
              초기화
            </ActionButton>
          </div>
        </div>

        {/* 검색조건 - 통일된 SearchFilterPanel 컴포넌트 사용 */}
        <SearchFilterPanel
          title="검색조건"
          onSearch={handleSearch}
          onReset={handleReset}
          className="mb-6"
        >
          {/* 첫 번째 행: O/B.Date, A/R.Date, 업무구분, 수출입구분 */}
          <SearchFilterGrid columns={6} className="mb-4">
            <SearchFilterField label="O/B.Date" colSpan={2}>
              <DateRangeField
                startValue={filters.obDateFrom}
                endValue={filters.obDateTo}
                onStartChange={(v) => handleFilterChange("obDateFrom", v)}
                onEndChange={(v) => handleFilterChange("obDateTo", v)}
              />
              <DateRangeButtons onRangeSelect={(start, end) => {
                handleFilterChange("obDateFrom", start);
                handleFilterChange("obDateTo", end);
              }} />
            </SearchFilterField>

            <SearchFilterField label="A/R.Date" colSpan={2}>
              <DateRangeField
                startValue={filters.arDateFrom}
                endValue={filters.arDateTo}
                onStartChange={(v) => handleFilterChange("arDateFrom", v)}
                onEndChange={(v) => handleFilterChange("arDateTo", v)}
              />
              <DateRangeButtons onRangeSelect={(start, end) => {
                handleFilterChange("arDateFrom", start);
                handleFilterChange("arDateTo", end);
              }} />
            </SearchFilterField>

            <SearchFilterField label="업무구분">
              <TextField value="해상" onChange={() => {}} readOnly />
            </SearchFilterField>

            <SearchFilterField label="수출입구분">
              <SelectField
                value={filters.ioType}
                onChange={(v) => handleFilterChange("ioType", v)}
                options={[
                  { value: "OUT", label: "수출(OUT)" },
                  { value: "IN", label: "수입(IN)" },
                ]}
              />
            </SearchFilterField>
          </SearchFilterGrid>

          {/* 두 번째 행: Shipper, Consignee, Loading, Vessel, CTNR NO., License No. */}
          <SearchFilterGrid columns={6} className="mb-4">
            <SearchFilterField label="Shipper">
              <SearchInputField
                value={filters.shipperCode}
                onChange={(v) => handleFilterChange("shipperCode", v)}
                onSearchClick={() => openCodeSearchModal("customer", "shipperCode")}
                placeholder="Shipper"
              />
            </SearchFilterField>

            <SearchFilterField label="Consignee">
              <SearchInputField
                value={filters.consigneeCode}
                onChange={(v) => handleFilterChange("consigneeCode", v)}
                onSearchClick={() => openCodeSearchModal("customer", "consigneeCode")}
                placeholder="Consignee"
              />
            </SearchFilterField>

            <SearchFilterField label="Loading">
              <SearchInputField
                value={filters.loadingPort}
                onChange={(v) => handleFilterChange("loadingPort", v)}
                onSearchClick={() => openCodeSearchModal("seaport", "loadingPort")}
                placeholder="Loading Port"
              />
            </SearchFilterField>

            <SearchFilterField label="Vessel / Area">
              <SearchInputField
                value={filters.vessel}
                onChange={(v) => handleFilterChange("vessel", v)}
                onSearchClick={() => openCodeSearchModal("carrier", "vessel")}
                placeholder="Vessel"
              />
            </SearchFilterField>

            <SearchFilterField label="CTNR NO./Original">
              <TextField
                value={filters.containerNo}
                onChange={(v) => handleFilterChange("containerNo", v)}
                placeholder="Container No."
              />
            </SearchFilterField>

            <SearchFilterField label="License No.">
              <TextField
                value={filters.licenseNo}
                onChange={(v) => handleFilterChange("licenseNo", v)}
                placeholder="License No."
              />
            </SearchFilterField>
          </SearchFilterGrid>

          {/* 세 번째 행: 입력사원, 본지사 */}
          <SearchFilterGrid columns={6}>
            <SearchFilterField label="입력사원">
              <TextField
                value={filters.inputEmployee}
                onChange={(v) => handleFilterChange("inputEmployee", v)}
                placeholder="입력사원"
              />
            </SearchFilterField>

            <SearchFilterField label="본지사">
              <SelectField
                value={filters.branchType}
                onChange={(v) => handleFilterChange("branchType", v)}
                options={[
                  { value: "HEAD", label: "본사" },
                  { value: "BRANCH", label: "지사" },
                ]}
              />
            </SearchFilterField>
          </SearchFilterGrid>
        </SearchFilterPanel>

        {/* 목록 테이블 - 화면설계서 UI-G-01-07-02 기준 */}
        <div className="card mb-6">
          <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h3 className="font-bold">B/L 목록</h3>
              <span className="px-2 py-1 bg-[#E8A838]/20 text-[#E8A838] rounded text-sm font-medium">
                {sortedList.length}건{getSortStatusText()}
              </span>
            </div>
            {selectedIds.size > 0 && (
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-sm text-[var(--muted)] hover:text-white"
              >
                선택 해제 ({selectedIds.size}건)
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-12">
                    <input
                      type="checkbox"
                      checked={
                        sortedList.length > 0 &&
                        selectedIds.size === sortedList.length
                      }
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="text-center">No</th>
                  <SortableHeader
                    columnKey="obDate"
                    label="O/B.Date"
                    className="text-center"
                  />
                  <SortableHeader
                    columnKey="arDate"
                    label="A/R.Date"
                    className="text-center"
                  />
                  <SortableHeader
                    columnKey="jobNo"
                    label="JOB.NO."
                    className="text-center"
                  />
                  <SortableHeader
                    columnKey="srNo"
                    label="S/R NO."
                    className="text-center"
                  />
                  <SortableHeader
                    columnKey="mblNo"
                    label="M.B/L NO."
                    className="text-center"
                  />
                  <SortableHeader
                    columnKey="hblNo"
                    label="H.B/L NO."
                    className="text-center"
                  />
                  <SortableHeader
                    columnKey="lcNo"
                    label="L/C NO."
                    className="text-center"
                  />
                  <SortableHeader
                    columnKey="poNo"
                    label="P/O NO."
                    className="text-center"
                  />
                  <SortableHeader
                    columnKey="type"
                    label="TYPE"
                    className="text-center"
                  />
                  <SortableHeader
                    columnKey="dc"
                    label="D/C"
                    className="text-center"
                  />
                  <SortableHeader
                    columnKey="ln"
                    label="L/N"
                    className="text-center"
                  />
                  <SortableHeader
                    columnKey="pc"
                    label="PC"
                    className="text-center"
                  />
                  <SortableHeader
                    columnKey="inco"
                    label="INCO"
                    className="text-center"
                  />
                </tr>
              </thead>
              <tbody>
                {sortedList.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <svg
                          className="w-12 h-12 text-[var(--muted)]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <p className="text-[var(--muted)]">
                          조회된 데이터가 없습니다.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedList.map((row, index) => (
                    <tr
                      key={row.id}
                      className={`border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer transition-colors ${selectedIds.has(row.id) ? "bg-blue-500/10" : ""} ${selectedRow?.id === row.id ? "bg-[#E8A838]/10" : ""}`}
                      onClick={() => handleRowClick(row)}
                      onDoubleClick={() => handleRowDoubleClick(row)}
                    >
                      <td
                        className="p-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.id)}
                          onChange={() => handleRowSelect(row.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="p-3 text-center text-sm">{index + 1}</td>
                      <td className="p-3 text-center text-sm text-[var(--muted)]">
                        {row.obDate}
                      </td>
                      <td className="p-3 text-center text-sm text-[var(--muted)]">
                        {row.arDate}
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-[#E8A838] font-medium hover:underline">
                          {row.jobNo}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-center">
                        {row.srNo || "-"}
                      </td>
                      <td className="p-3 text-sm text-center font-medium">
                        {row.mblNo}
                      </td>
                      <td className="p-3 text-sm text-center font-medium">
                        {row.hblNo}
                      </td>
                      <td className="p-3 text-sm text-center">
                        {row.lcNo || "-"}
                      </td>
                      <td className="p-3 text-sm text-center">
                        {row.poNo || "-"}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                          {row.type}
                        </span>
                      </td>
                      <td className="p-3 text-center text-sm">{row.dc}</td>
                      <td className="p-3 text-center text-sm">{row.ln}</td>
                      <td className="p-3 text-center text-sm">{row.pc}</td>
                      <td className="p-3 text-center text-sm">{row.inco}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 선택된 B/L 상세 정보 */}
        {selectedRow && (
          <div className="card">
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="font-bold">선택된 B/L 정보</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <span className="text-sm text-[var(--muted)]">JOB NO.</span>
                  <p className="font-medium">{selectedRow.jobNo}</p>
                </div>
                <div>
                  <span className="text-sm text-[var(--muted)]">M.B/L NO.</span>
                  <p className="font-medium">{selectedRow.mblNo}</p>
                </div>
                <div>
                  <span className="text-sm text-[var(--muted)]">H.B/L NO.</span>
                  <p className="font-medium">{selectedRow.hblNo}</p>
                </div>
                <div>
                  <span className="text-sm text-[var(--muted)]">상태</span>
                  <p>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        color: getStatusConfig(selectedRow.status || "").color,
                        backgroundColor: getStatusConfig(
                          selectedRow.status || "",
                        ).bgColor,
                      }}
                    >
                      {getStatusConfig(selectedRow.status || "").label}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-sm text-[var(--muted)]">Shipper</span>
                  <p className="font-medium">
                    {selectedRow.shipperName || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-[var(--muted)]">Consignee</span>
                  <p className="font-medium">
                    {selectedRow.consigneeName || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-[var(--muted)]">POL</span>
                  <p className="font-medium">{selectedRow.pol || "-"}</p>
                </div>
                <div>
                  <span className="text-sm text-[var(--muted)]">POD</span>
                  <p className="font-medium">{selectedRow.pod || "-"}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <CloseConfirmModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onConfirm={handleConfirmClose}
      />

      {printData && (
        <BLPrintModal
          isOpen={showPrintModal}
          onClose={() => {
            setShowPrintModal(false);
            setPrintData(null);
          }}
          blData={printData}
        />
      )}

      <SelectionAlertModal
        isOpen={showSelectionAlert}
        onClose={() => setShowSelectionAlert(false)}
        title="출력 안내"
        message="목록에서 출력할 데이터를 선택해주세요."
      />

      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSend={(data) => {
          console.log("Email sent:", data);
          alert("이메일이 발송되었습니다.");
          setShowEmailModal(false);
        }}
        documentType="bl"
        documentNo={selectedRow?.hblNo || ""}
      />

      <CodeSearchModal
        isOpen={showCodeSearchModal}
        onClose={() => setShowCodeSearchModal(false)}
        onSelect={handleCodeSelect}
        codeType={searchModalType}
      />
    </PageLayout>
  );
}
