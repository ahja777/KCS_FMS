"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import PageLayout from "@/components/PageLayout";
import CloseConfirmModal from "@/components/CloseConfirmModal";
import { useCloseConfirm } from "@/hooks/useCloseConfirm";
import { LIST_PATHS } from "@/constants/paths";
import { ActionButton } from "@/components/buttons";
import CodeSearchModal, {
  CodeType,
  CodeItem,
} from "@/components/popup/CodeSearchModal";
import SearchFilterPanel, {
  SearchFilterGrid,
  SearchFilterField,
  DateRangeField,
  SearchInputField,
  SelectField,
  TextField,
} from "@/components/search/SearchFilterPanel";
import DateRangeButtons, { getToday } from "@/components/DateRangeButtons";

// 검색조건 인터페이스
interface SearchFilters {
  ioType: string;
  dateFrom: string;
  dateTo: string;
  customerCd: string;
  carrierCd: string;
  polCd: string;
  podCd: string;
}

// 운임 상세 행 인터페이스
interface RateDetail {
  DETAIL_ID: number;
  RATE_ID: number;
  DETAIL_SEQ: number;
  FREIGHT_TYPE: string;
  FREIGHT_CD: string;
  CURRENCY_CD: string;
  RATE_AWB: number | string;
  RATE_MIN_AIR: number | string;
  RATE_45L: number | string;
  RATE_45: number | string;
  RATE_100: number | string;
  RATE_300: number | string;
  RATE_500: number | string;
  RATE_1000: number | string;
}

// 목록 데이터 인터페이스
interface AirCorporateRate {
  RATE_ID: number;
  RATE_NO: string;
  TRANSPORT_MODE: string;
  IO_TYPE: string;
  BIZ_TYPE: string;
  CUSTOMER_CD: string;
  CUSTOMER_NM: string;
  CARRIER_CD: string;
  CARRIER_NM: string;
  POL_CD: string;
  POL_NM: string;
  POD_CD: string;
  POD_NM: string;
  CREATED_DATE: string;
  details: RateDetail[];
}

// IO_TYPE 라벨
const ioTypeLabels: Record<string, string> = {
  EXPORT: "수출",
  IMPORT: "수입",
};

// 정렬 설정
interface SortConfig {
  key: string | null;
  direction: "asc" | "desc";
}

const SortIcon = ({
  columnKey,
  sortConfig,
}: {
  columnKey: string;
  sortConfig: SortConfig;
}) => {
  const isActive = sortConfig.key === columnKey;
  return (
    <span className="inline-flex flex-col ml-1.5 gap-px">
      <span
        style={{
          width: 0,
          height: 0,
          borderLeft: "4px solid transparent",
          borderRight: "4px solid transparent",
          borderBottom: `5px solid ${isActive && sortConfig.direction === "asc" ? "#ffffff" : "rgba(255,255,255,0.35)"}`,
        }}
      />
      <span
        style={{
          width: 0,
          height: 0,
          borderLeft: "4px solid transparent",
          borderRight: "4px solid transparent",
          borderTop: `5px solid ${isActive && sortConfig.direction === "desc" ? "#ffffff" : "rgba(255,255,255,0.35)"}`,
        }}
      />
    </span>
  );
};

const today = getToday();
const initialFilters: SearchFilters = {
  ioType: "",
  dateFrom: today,
  dateTo: today,
  customerCd: "",
  carrierCd: "",
  polCd: "",
  podCd: "",
};

// DECIMAL 값을 숫자로 변환 (MariaDB는 DECIMAL을 string으로 반환)
function toNum(v: number | string | null | undefined): number {
  if (v == null) return 0;
  return Number(v) || 0;
}

// 숫자 포매팅 (소수점 있으면 표시, 없으면 정수)
function fmtRate(v: number | string | null | undefined): string {
  const n = toNum(v);
  if (n === 0) return "-";
  return n % 1 !== 0 ? n.toFixed(2) : n.toLocaleString();
}

export default function AirCorporateRateListPage() {
  const router = useRouter();
  const [data, setData] = useState<AirCorporateRate[]>([]);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedRow, setSelectedRow] = useState<AirCorporateRate | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showCodeSearchModal, setShowCodeSearchModal] = useState(false);
  const [searchModalType, setSearchModalType] = useState<CodeType>("customer");
  const [searchTargetField, setSearchTargetField] =
    useState<keyof SearchFilters>("customerCd");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: "asc",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const searchPanelRef = useRef<HTMLDivElement>(null);

  // 화면닫기
  const handleConfirmClose = () => {
    setShowCloseModal(false);
    router.push(LIST_PATHS.DASHBOARD);
  };
  useCloseConfirm({
    showModal: showCloseModal,
    setShowModal: setShowCloseModal,
    onConfirmClose: handleConfirmClose,
  });

  // API 데이터 조회
  const fetchData = useCallback(async (searchFilters?: SearchFilters) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("transportMode", "AIR");
      const f = searchFilters || initialFilters;
      if (f.ioType) params.set("ioType", f.ioType);
      if (f.customerCd) params.set("customerCd", f.customerCd);
      if (f.carrierCd) params.set("carrierCd", f.carrierCd);
      if (f.polCd) params.set("polCd", f.polCd);
      if (f.podCd) params.set("podCd", f.podCd);

      const qs = params.toString();
      const response = await fetch(
        `/api/logis/rate/corporate${qs ? `?${qs}` : ""}`,
      );
      if (response.ok) {
        const result = await response.json();
        setData(Array.isArray(result) ? result : []);
      }
    } catch (error) {
      console.error("Failed to fetch corporate air rates:", error);
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 날짜 필터링은 클라이언트에서 처리 (API에 날짜 파라미터 없으므로)
  const filteredByDate = useMemo(() => {
    return data.filter((item) => {
      if (filters.dateFrom && item.CREATED_DATE < filters.dateFrom)
        return false;
      if (filters.dateTo && item.CREATED_DATE > filters.dateTo) return false;
      return true;
    });
  }, [data, filters.dateFrom, filters.dateTo]);

  // 정렬
  const sortedList = useMemo(() => {
    if (!sortConfig.key) return filteredByDate;
    return [...filteredByDate].sort((a, b) => {
      const key = sortConfig.key!;
      let aVal: string | number | null = null;
      let bVal: string | number | null = null;

      // 메인 필드
      if (key in a) {
        aVal = (a as unknown as Record<string, unknown>)[key] as string | number | null;
        bVal = (b as unknown as Record<string, unknown>)[key] as string | number | null;
      }
      // detail 필드
      if (key.startsWith("detail_")) {
        const detailKey = key.replace("detail_", "");
        const aDetail = a.details?.[0];
        const bDetail = b.details?.[0];
        aVal = aDetail
          ? toNum(
              (aDetail as unknown as Record<string, unknown>)[detailKey] as
                | number
                | string,
            )
          : 0;
        bVal = bDetail
          ? toNum(
              (bDetail as unknown as Record<string, unknown>)[detailKey] as
                | number
                | string,
            )
          : 0;
      }

      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp =
        typeof aVal === "number" && typeof bVal === "number"
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal), "ko");
      return sortConfig.direction === "asc" ? cmp : -cmp;
    });
  }, [filteredByDate, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const SortableHeader = ({
    columnKey,
    label,
    className = "",
  }: {
    columnKey: string;
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

  // 검색
  const handleSearch = useCallback(() => {
    setSelectedIds(new Set());
    setSelectedRow(null);
    fetchData(filters);
  }, [filters, fetchData]);

  const handleReset = useCallback(() => {
    setFilters(initialFilters);
    setSelectedIds(new Set());
    setSelectedRow(null);
    setSortConfig({ key: null, direction: "asc" });
    fetchData(initialFilters);
  }, [fetchData]);

  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  // Enter 키로 검색
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearch();
      }
    },
    [handleSearch],
  );

  // 코드 검색 팝업
  const openCodeSearchModal = (
    codeType: CodeType,
    targetField: keyof SearchFilters,
  ) => {
    setSearchModalType(codeType);
    setSearchTargetField(targetField);
    setShowCodeSearchModal(true);
  };
  const handleCodeSelect = (item: CodeItem) => {
    setFilters((prev) => ({
      ...prev,
      [searchTargetField]: item.name || item.code,
    }));
    setShowCodeSearchModal(false);
  };

  // 행 선택
  const handleRowSelect = (id: number) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const handleSelectAll = () => {
    selectedIds.size === sortedList.length
      ? setSelectedIds(new Set())
      : setSelectedIds(new Set(sortedList.map((i) => i.RATE_ID)));
  };
  const handleRowClick = (item: AirCorporateRate) => {
    setSelectedRow(item);
  };
  const handleRowDoubleClick = (item: AirCorporateRate) => {
    router.push(`/logis/rate/corporate/air/${item.RATE_ID}`);
  };

  // 신규
  const handleNew = () => {
    router.push("/logis/rate/corporate/air/register");
  };

  // 수정
  const handleEdit = () => {
    if (selectedIds.size !== 1) {
      alert("수정할 항목을 1개 선택해주세요.");
      return;
    }
    router.push(
      `/logis/rate/corporate/air/register?id=${Array.from(selectedIds)[0]}`,
    );
  };

  // 삭제
  const handleDelete = async () => {
    if (selectedIds.size === 0) {
      alert("삭제할 항목을 선택해주세요.");
      return;
    }
    if (confirm(`${selectedIds.size}건을 삭제하시겠습니까?`)) {
      try {
        const ids = Array.from(selectedIds).join(",");
        const res = await fetch(`/api/logis/rate/corporate?ids=${ids}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setData((prev) => prev.filter((d) => !selectedIds.has(d.RATE_ID)));
          setSelectedIds(new Set());
          setSelectedRow(null);
          alert("삭제되었습니다.");
        }
      } catch (error) {
        console.error("Delete error:", error);
      }
    }
  };

  // Excel 다운로드
  const handleExcel = () => {
    const excelSource =
      selectedIds.size > 0
        ? sortedList.filter((i) => selectedIds.has(i.RATE_ID))
        : sortedList;
    if (excelSource.length === 0) {
      alert("다운로드할 데이터가 없습니다.");
      return;
    }
    const excelData = excelSource.map((item, i) => {
      const d = item.details?.[0];
      return {
        No: i + 1,
        Date: item.CREATED_DATE || "-",
        수출입구분: ioTypeLabels[item.IO_TYPE] || item.IO_TYPE || "-",
        거래처: item.CUSTOMER_NM || "-",
        Airline: item.CARRIER_NM || "-",
        Origin: item.POL_NM || "-",
        Destn: item.POD_NM || "-",
        운임코드: d?.FREIGHT_CD || "-",
        운임유형: d?.FREIGHT_TYPE || "-",
        AWB: d ? toNum(d.RATE_AWB) : 0,
        Min: d ? toNum(d.RATE_MIN_AIR) : 0,
        "-45": d ? toNum(d.RATE_45L) : 0,
        "+45": d ? toNum(d.RATE_45) : 0,
        "100": d ? toNum(d.RATE_100) : 0,
        "300": d ? toNum(d.RATE_300) : 0,
        "500": d ? toNum(d.RATE_500) : 0,
        "1000": d ? toNum(d.RATE_1000) : 0,
      };
    });
    const ws = XLSX.utils.json_to_sheet(excelData);
    ws["!cols"] = [
      { wch: 5 },
      { wch: 12 },
      { wch: 10 },
      { wch: 20 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "기업운임(항공)");
    const d = new Date();
    XLSX.writeFile(
      wb,
      `기업운임_항공_${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}.xlsx`,
    );
  };

  return (
    <PageLayout
      title="기업운임관리(항공)"
      subtitle="HOME > 운임관리 > 기업운임관리 > 항공"
      showCloseButton={false}
    >
      <main className="p-6">
        {/* 상단 버튼 영역 */}
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

        {/* 검색조건 */}
        <div ref={searchPanelRef} onKeyDown={handleKeyDown}>
          <SearchFilterPanel
            title="검색조건"
            onSearch={handleSearch}
            onReset={handleReset}
            className="mb-6"
          >
            <SearchFilterGrid columns={6} className="mb-4">
              <SearchFilterField label="수출입구분">
                <SelectField
                  value={filters.ioType}
                  onChange={(v) => handleFilterChange("ioType", v)}
                  options={[
                    { value: "EXPORT", label: "수출" },
                    { value: "IMPORT", label: "수입" },
                  ]}
                />
              </SearchFilterField>

              <SearchFilterField label="거래처">
                <SearchInputField
                  value={filters.customerCd}
                  onChange={(v) => handleFilterChange("customerCd", v)}
                  onSearchClick={() =>
                    openCodeSearchModal("customer", "customerCd")
                  }
                  placeholder="거래처"
                />
              </SearchFilterField>

              <SearchFilterField label="Airline">
                <SearchInputField
                  value={filters.carrierCd}
                  onChange={(v) => handleFilterChange("carrierCd", v)}
                  onSearchClick={() =>
                    openCodeSearchModal("carrier", "carrierCd")
                  }
                  placeholder="항공사"
                />
              </SearchFilterField>

              <SearchFilterField label="Origin">
                <SearchInputField
                  value={filters.polCd}
                  onChange={(v) => handleFilterChange("polCd", v)}
                  onSearchClick={() =>
                    openCodeSearchModal("airport", "polCd")
                  }
                  placeholder="출발지"
                />
              </SearchFilterField>

              <SearchFilterField label="Destn">
                <SearchInputField
                  value={filters.podCd}
                  onChange={(v) => handleFilterChange("podCd", v)}
                  onSearchClick={() =>
                    openCodeSearchModal("airport", "podCd")
                  }
                  placeholder="도착지"
                />
              </SearchFilterField>

              <SearchFilterField label="Date">
                <DateRangeField
                  startValue={filters.dateFrom}
                  endValue={filters.dateTo}
                  onStartChange={(v) => handleFilterChange("dateFrom", v)}
                  onEndChange={(v) => handleFilterChange("dateTo", v)}
                />
              </SearchFilterField>
            </SearchFilterGrid>

            <SearchFilterGrid columns={6}>
              <SearchFilterField label="" colSpan={5}>
                <span />
              </SearchFilterField>
              <SearchFilterField label="">
                <DateRangeButtons
                  onRangeSelect={(start, end) => {
                    handleFilterChange("dateFrom", start);
                    handleFilterChange("dateTo", end);
                  }}
                />
              </SearchFilterField>
            </SearchFilterGrid>
          </SearchFilterPanel>
        </div>

        {/* 목록 테이블 */}
        <div className="card mb-6">
          <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h3 className="font-bold">기업운임 목록 (항공)</h3>
              <span className="px-2 py-1 bg-[#E8A838]/20 text-[#E8A838] rounded text-sm font-medium">
                {sortedList.length}건
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
                    columnKey="CREATED_DATE"
                    label="Date"
                    className="text-center"
                  />
                  <SortableHeader
                    columnKey="IO_TYPE"
                    label="수출입구분"
                    className="text-center"
                  />
                  <SortableHeader
                    columnKey="CUSTOMER_NM"
                    label="거래처"
                    className="text-center"
                  />
                  <SortableHeader
                    columnKey="CARRIER_NM"
                    label="Airline"
                    className="text-center"
                  />
                  <SortableHeader
                    columnKey="POL_NM"
                    label="Origin"
                    className="text-center"
                  />
                  <SortableHeader
                    columnKey="POD_NM"
                    label="Destn"
                    className="text-center"
                  />
                  <SortableHeader
                    columnKey="detail_FREIGHT_CD"
                    label="운임코드"
                    className="text-center"
                  />
                  <SortableHeader
                    columnKey="detail_FREIGHT_TYPE"
                    label="운임유형"
                    className="text-center"
                  />
                  <SortableHeader
                    columnKey="detail_RATE_AWB"
                    label="AWB"
                    className="text-center"
                  />
                  <SortableHeader
                    columnKey="detail_RATE_MIN_AIR"
                    label="Min"
                    className="text-center"
                  />
                  <SortableHeader
                    columnKey="detail_RATE_45L"
                    label="-45"
                    className="text-center"
                  />
                  <SortableHeader
                    columnKey="detail_RATE_45"
                    label="+45"
                    className="text-center"
                  />
                  <SortableHeader
                    columnKey="detail_RATE_100"
                    label="100"
                    className="text-center"
                  />
                  <SortableHeader
                    columnKey="detail_RATE_300"
                    label="300"
                    className="text-center"
                  />
                  <SortableHeader
                    columnKey="detail_RATE_500"
                    label="500"
                    className="text-center"
                  />
                  <SortableHeader
                    columnKey="detail_RATE_1000"
                    label="1000"
                    className="text-center"
                  />
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={18} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-[#E8A838] border-t-transparent rounded-full animate-spin" />
                        <p className="text-[var(--muted)]">조회 중...</p>
                      </div>
                    </td>
                  </tr>
                ) : sortedList.length === 0 ? (
                  <tr>
                    <td colSpan={18} className="p-12 text-center">
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
                          {isInitialLoad
                            ? "데이터를 불러오는 중..."
                            : "조회된 데이터가 없습니다."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedList.map((row, index) => {
                    const d = row.details?.[0];
                    return (
                      <tr
                        key={row.RATE_ID}
                        className={`border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer transition-colors ${selectedIds.has(row.RATE_ID) ? "bg-blue-500/10" : ""} ${selectedRow?.RATE_ID === row.RATE_ID ? "bg-[#E8A838]/10" : ""}`}
                        onClick={() => handleRowClick(row)}
                        onDoubleClick={() => handleRowDoubleClick(row)}
                      >
                        <td
                          className="p-3 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.has(row.RATE_ID)}
                            onChange={() => handleRowSelect(row.RATE_ID)}
                            className="rounded"
                          />
                        </td>
                        <td className="p-3 text-center text-sm">
                          {index + 1}
                        </td>
                        <td className="p-3 text-center text-sm text-[var(--muted)]">
                          {row.CREATED_DATE || "-"}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-1 text-xs rounded-full font-medium ${
                              row.IO_TYPE === "EXPORT"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-green-500/20 text-green-400"
                            }`}
                          >
                            {ioTypeLabels[row.IO_TYPE] || row.IO_TYPE || "-"}
                          </span>
                        </td>
                        <td className="p-3 text-sm">
                          {row.CUSTOMER_NM || "-"}
                        </td>
                        <td className="p-3 text-center text-sm font-medium">
                          {row.CARRIER_NM || "-"}
                        </td>
                        <td className="p-3 text-center text-sm">
                          {row.POL_NM || "-"}
                        </td>
                        <td className="p-3 text-center text-sm">
                          {row.POD_NM || "-"}
                        </td>
                        <td className="p-3 text-center text-sm">
                          {d?.FREIGHT_CD || "-"}
                        </td>
                        <td className="p-3 text-center text-sm">
                          {d?.FREIGHT_TYPE || "-"}
                        </td>
                        <td className="p-3 text-right text-sm">
                          {fmtRate(d?.RATE_AWB)}
                        </td>
                        <td className="p-3 text-right text-sm">
                          {fmtRate(d?.RATE_MIN_AIR)}
                        </td>
                        <td className="p-3 text-right text-sm">
                          {fmtRate(d?.RATE_45L)}
                        </td>
                        <td className="p-3 text-right text-sm">
                          {fmtRate(d?.RATE_45)}
                        </td>
                        <td className="p-3 text-right text-sm">
                          {fmtRate(d?.RATE_100)}
                        </td>
                        <td className="p-3 text-right text-sm">
                          {fmtRate(d?.RATE_300)}
                        </td>
                        <td className="p-3 text-right text-sm">
                          {fmtRate(d?.RATE_500)}
                        </td>
                        <td className="p-3 text-right text-sm">
                          {fmtRate(d?.RATE_1000)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 선택된 행 상세 정보 */}
        {selectedRow && (
          <div className="card">
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="font-bold">선택된 기업운임 정보</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <span className="text-sm text-[var(--muted)]">운임번호</span>
                  <p className="font-medium">{selectedRow.RATE_NO}</p>
                </div>
                <div>
                  <span className="text-sm text-[var(--muted)]">거래처</span>
                  <p className="font-medium">
                    {selectedRow.CUSTOMER_NM || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-[var(--muted)]">Airline</span>
                  <p className="font-medium">
                    {selectedRow.CARRIER_NM || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-[var(--muted)]">
                    수출입구분
                  </span>
                  <p className="font-medium">
                    {ioTypeLabels[selectedRow.IO_TYPE] ||
                      selectedRow.IO_TYPE ||
                      "-"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-[var(--muted)]">Origin</span>
                  <p className="font-medium">{selectedRow.POL_NM || "-"}</p>
                </div>
                <div>
                  <span className="text-sm text-[var(--muted)]">Destn</span>
                  <p className="font-medium">{selectedRow.POD_NM || "-"}</p>
                </div>
                <div>
                  <span className="text-sm text-[var(--muted)]">등록일</span>
                  <p className="font-medium">
                    {selectedRow.CREATED_DATE || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-[var(--muted)]">
                    Detail 건수
                  </span>
                  <p className="font-medium text-[#E8A838]">
                    {selectedRow.details?.length || 0}건
                  </p>
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
      <CodeSearchModal
        isOpen={showCodeSearchModal}
        onClose={() => setShowCodeSearchModal(false)}
        onSelect={handleCodeSelect}
        codeType={searchModalType}
      />
    </PageLayout>
  );
}
