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
import DateRangeButtons from "@/components/DateRangeButtons";
import { formatCurrency } from "@/utils/format";

interface SearchFilters {
  boundType: string;
  businessType: string;
  tradeTerms: string;
  obArDateFrom: string;
  obArDateTo: string;
  customsDateFrom: string;
  customsDateTo: string;
  accountCode: string;
  noType: string;
  noValue: string;
  employee: string;
  branch: string;
  status: string;
}

interface CusAccountItem {
  id: string;
  jobNo: string;
  boundType: string;
  businessType: string;
  tradeTerms: string;
  branch: string;
  mblNo: string;
  hblNo: string;
  accountName: string;
  packages: number;
  packageUnit: string;
  salesEmployee: string;
  obArDate: string;
  customsDate: string;
  weight: number;
  cbm: number;
  performanceAmt: number;
  status: string;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: "작성중", color: "#6B7280", bgColor: "#F3F4F6" },
  ACTIVE: { label: "진행중", color: "#2563EB", bgColor: "#DBEAFE" },
  CONFIRMED: { label: "확정", color: "#059669", bgColor: "#D1FAE5" },
  CLOSED: { label: "마감", color: "#7C3AED", bgColor: "#EDE9FE" },
};

const getStatusConfig = (status: string) => {
  return statusConfig[status] || { label: status || "미정", color: "#6B7280", bgColor: "#F3F4F6" };
};

const boundLabels: Record<string, string> = {
  AI: "항공수입",
  AO: "항공수출",
  SI: "해상수입",
  SO: "해상수출",
};

interface SortConfig {
  key: keyof CusAccountItem | null;
  direction: "asc" | "desc";
}

const SortIcon = ({ columnKey, sortConfig }: { columnKey: keyof CusAccountItem; sortConfig: SortConfig }) => {
  const isActive = sortConfig.key === columnKey;
  return (
    <span className="inline-flex flex-col ml-1.5 gap-px">
      <span style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: `5px solid ${isActive && sortConfig.direction === 'asc' ? '#ffffff' : 'rgba(255,255,255,0.35)'}` }} />
      <span style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: `5px solid ${isActive && sortConfig.direction === 'desc' ? '#ffffff' : 'rgba(255,255,255,0.35)'}` }} />
    </span>
  );
};

const initialFilters: SearchFilters = {
  boundType: "",
  businessType: "",
  tradeTerms: "",
  obArDateFrom: "",
  obArDateTo: "",
  customsDateFrom: "",
  customsDateTo: "",
  accountCode: "",
  noType: "JOB_NO",
  noValue: "",
  employee: "",
  branch: "",
  status: "",
};

export default function CustomsAccountSeaListPage() {
  const router = useRouter();
  const [data, setData] = useState<CusAccountItem[]>([]);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedRow, setSelectedRow] = useState<CusAccountItem | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showCodeSearchModal, setShowCodeSearchModal] = useState(false);
  const [searchModalType, setSearchModalType] = useState<CodeType>("customer");
  const [searchTargetField, setSearchTargetField] = useState<keyof SearchFilters>("accountCode");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: "asc" });
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const searchPanelRef = useRef<HTMLDivElement>(null);

  const handleConfirmClose = () => { setShowCloseModal(false); router.push(LIST_PATHS.DASHBOARD); };
  useCloseConfirm({ showModal: showCloseModal, setShowModal: setShowCloseModal, onConfirmClose: handleConfirmClose });

  const fetchData = useCallback(async (searchFilters?: SearchFilters) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      const f = searchFilters || initialFilters;
      if (f.boundType) params.set('boundType', f.boundType);
      if (f.businessType) params.set('businessType', f.businessType);
      if (f.tradeTerms) params.set('tradeTerms', f.tradeTerms);
      if (f.branch) params.set('branch', f.branch);
      if (f.obArDateFrom) params.set('obArDateFrom', f.obArDateFrom);
      if (f.obArDateTo) params.set('obArDateTo', f.obArDateTo);
      if (f.customsDateFrom) params.set('customsDateFrom', f.customsDateFrom);
      if (f.customsDateTo) params.set('customsDateTo', f.customsDateTo);
      if (f.accountCode) params.set('accountName', f.accountCode);
      if (f.noType && f.noValue) { params.set('noType', f.noType); params.set('noValue', f.noValue); }
      if (f.employee) params.set('employee', f.employee);
      if (f.status) params.set('status', f.status);

      const qs = params.toString();
      const response = await fetch(`/api/customs-account/sea${qs ? `?${qs}` : ''}`);
      if (response.ok) {
        const result = await response.json();
        setData(Array.isArray(result) ? result : []);
      }
    } catch (error) {
      console.error("Failed to fetch:", error);
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sortedList = useMemo(() => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key!];
      const bVal = b[sortConfig.key!];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === "number" && typeof bVal === "number"
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal), "ko");
      return sortConfig.direction === "asc" ? cmp : -cmp;
    });
  }, [data, sortConfig]);

  const handleSort = (key: keyof CusAccountItem) => {
    setSortConfig((prev) => ({ key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc" }));
  };

  const SortableHeader = ({ columnKey, label, className = "" }: { columnKey: keyof CusAccountItem; label: string; className?: string }) => (
    <th className={`cursor-pointer select-none ${className}`} onClick={() => handleSort(columnKey)}>
      <span className="inline-flex items-center">{label}<SortIcon columnKey={columnKey} sortConfig={sortConfig} /></span>
    </th>
  );

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
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  }, [handleSearch]);

  const openCodeSearchModal = (codeType: CodeType, targetField: keyof SearchFilters) => {
    setSearchModalType(codeType); setSearchTargetField(targetField); setShowCodeSearchModal(true);
  };
  const handleCodeSelect = (item: CodeItem) => {
    setFilters((prev) => ({ ...prev, [searchTargetField]: item.name || item.code })); setShowCodeSearchModal(false);
  };

  const handleRowSelect = (id: string) => { setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); };
  const handleSelectAll = () => { selectedIds.size === sortedList.length ? setSelectedIds(new Set()) : setSelectedIds(new Set(sortedList.map((i) => i.id))); };
  const handleRowClick = (item: CusAccountItem) => { setSelectedRow(item); };
  const handleRowDoubleClick = (item: CusAccountItem) => { router.push(`/logis/customs-account/sea/${item.id}`); };
  const handleNew = () => { router.push("/logis/customs-account/sea/register"); };
  const handleEdit = () => {
    if (selectedIds.size !== 1) { alert("수정할 항목을 1개 선택해주세요."); return; }
    router.push(`/logis/customs-account/sea/register?id=${Array.from(selectedIds)[0]}`);
  };
  const handleDelete = async () => {
    if (selectedIds.size === 0) { alert("삭제할 항목을 선택해주세요."); return; }
    if (confirm(`${selectedIds.size}건을 삭제하시겠습니까?`)) {
      try {
        const ids = Array.from(selectedIds).join(",");
        const res = await fetch(`/api/customs-account/sea?ids=${ids}`, { method: "DELETE" });
        if (res.ok) {
          setData((prev) => prev.filter((d) => !selectedIds.has(d.id)));
          setSelectedIds(new Set()); setSelectedRow(null);
          alert("삭제되었습니다.");
        }
      } catch (error) {
        console.error("Delete error:", error);
      }
    }
  };

  const handleExcel = () => {
    const excelSource = selectedIds.size > 0 ? sortedList.filter((i) => selectedIds.has(i.id)) : sortedList;
    if (excelSource.length === 0) { alert("다운로드할 데이터가 없습니다."); return; }
    const excelData = excelSource.map((item, i) => ({
      No: i + 1,
      "BOUND": boundLabels[item.boundType] || item.boundType,
      "업무유형": item.businessType || "-",
      "입출항일자": item.obArDate || "-",
      "통관수리일자": item.customsDate || "-",
      "거래처": item.accountName || "-",
      "JOB.NO.": item.jobNo || "-",
      "M.B/L(MAWB) NO.": item.mblNo || "-",
      "H.B/L(HAWB) NO.": item.hblNo || "-",
      "갯수": item.packages ? `${item.packages} ${item.packageUnit || ''}`.trim() : "-",
      "WT": item.weight || 0,
      "CBM": item.cbm || 0,
      "실적금액": item.performanceAmt || 0,
      "상태": getStatusConfig(item.status).label,
    }));
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "통관정산 목록");
    const today = new Date();
    XLSX.writeFile(wb, `통관정산목록_${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}.xlsx`);
  };

  return (
    <PageLayout title="통관정산 관리" subtitle="HOME > 통관관리 > 통관정산 관리" showCloseButton={false}>
      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            {selectedIds.size > 0 && (
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">{selectedIds.size}건 선택</span>
            )}
          </div>
          <div className="flex gap-2">
            <ActionButton variant="default" icon="plus" onClick={handleNew}>신규</ActionButton>
            <ActionButton variant="default" icon="edit" onClick={handleEdit}>수정</ActionButton>
            <ActionButton variant="default" icon="delete" onClick={handleDelete}>삭제</ActionButton>
            <ActionButton variant="default" icon="download" onClick={handleExcel}>Excel</ActionButton>
            <ActionButton variant="default" icon="refresh" onClick={handleReset}>초기화</ActionButton>
          </div>
        </div>

        <div ref={searchPanelRef} onKeyDown={handleKeyDown}>
          <SearchFilterPanel title="검색조건" onSearch={handleSearch} onReset={handleReset} className="mb-6">
            <SearchFilterGrid columns={6} className="mb-4">
              <SearchFilterField label="BOUND">
                <SelectField value={filters.boundType} onChange={(v) => handleFilterChange("boundType", v)}
                  options={[{ value: "AI", label: "항공수입" }, { value: "AO", label: "항공수출" }, { value: "SI", label: "해상수입" }, { value: "SO", label: "해상수출" }]} />
              </SearchFilterField>
              <SearchFilterField label="업무유형">
                <SelectField value={filters.businessType} onChange={(v) => handleFilterChange("businessType", v)}
                  options={[{ value: "통관B/L", label: "통관B/L" }, { value: "운송", label: "운송" }, { value: "창고", label: "창고" }, { value: "기타", label: "기타" }]} />
              </SearchFilterField>
              <SearchFilterField label="무역조건">
                <SelectField value={filters.tradeTerms} onChange={(v) => handleFilterChange("tradeTerms", v)}
                  options={[{ value: "CFR", label: "CFR" }, { value: "CIF", label: "CIF" }, { value: "FOB", label: "FOB" }, { value: "EXW", label: "EXW" }, { value: "DDP", label: "DDP" }]} />
              </SearchFilterField>
              <SearchFilterField label="입출항일자" colSpan={2}>
                <div className="flex items-center gap-1">
                  <DateRangeField startValue={filters.obArDateFrom} endValue={filters.obArDateTo}
                    onStartChange={(v) => handleFilterChange("obArDateFrom", v)} onEndChange={(v) => handleFilterChange("obArDateTo", v)} />
                  <DateRangeButtons onRangeSelect={(s, e) => { handleFilterChange("obArDateFrom", s); handleFilterChange("obArDateTo", e); }} />
                </div>
              </SearchFilterField>
              <SearchFilterField label="본지사">
                <SelectField value={filters.branch} onChange={(v) => handleFilterChange("branch", v)}
                  options={[{ value: "본사", label: "본사" }, { value: "지사", label: "지사" }]} />
              </SearchFilterField>
            </SearchFilterGrid>
            <SearchFilterGrid columns={6} className="mb-4">
              <SearchFilterField label="거래처">
                <SearchInputField value={filters.accountCode} onChange={(v) => handleFilterChange("accountCode", v)}
                  onSearchClick={() => openCodeSearchModal("customer", "accountCode")} placeholder="거래처명" />
              </SearchFilterField>
              <SearchFilterField label="검색유형">
                <SelectField value={filters.noType} onChange={(v) => handleFilterChange("noType", v)}
                  options={[{ value: "JOB_NO", label: "JOB NO" }, { value: "MBL_NO", label: "M.B/L(MAWB) NO" }, { value: "HBL_NO", label: "H.B/L(HAWB) NO" }]} placeholder="" />
              </SearchFilterField>
              <SearchFilterField label="검색번호" colSpan={2}>
                <TextField value={filters.noValue} onChange={(v) => handleFilterChange("noValue", v)} placeholder="번호 입력" />
              </SearchFilterField>
              <SearchFilterField label="입력사원">
                <TextField value={filters.employee} onChange={(v) => handleFilterChange("employee", v)} placeholder="입력사원" />
              </SearchFilterField>
              <SearchFilterField label="상태">
                <SelectField value={filters.status} onChange={(v) => handleFilterChange("status", v)}
                  options={[{ value: "DRAFT", label: "작성중" }, { value: "ACTIVE", label: "진행중" }, { value: "CONFIRMED", label: "확정" }, { value: "CLOSED", label: "마감" }]} />
              </SearchFilterField>
            </SearchFilterGrid>
            <SearchFilterGrid columns={6}>
              <SearchFilterField label="통관수리일자" colSpan={2}>
                <div className="flex items-center gap-1">
                  <DateRangeField startValue={filters.customsDateFrom} endValue={filters.customsDateTo}
                    onStartChange={(v) => handleFilterChange("customsDateFrom", v)} onEndChange={(v) => handleFilterChange("customsDateTo", v)} />
                  <DateRangeButtons onRangeSelect={(s, e) => { handleFilterChange("customsDateFrom", s); handleFilterChange("customsDateTo", e); }} />
                </div>
              </SearchFilterField>
            </SearchFilterGrid>
          </SearchFilterPanel>
        </div>

        <div className="card mb-6">
          <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h3 className="font-bold">통관정산 목록</h3>
              <span className="px-2 py-1 bg-[#E8A838]/20 text-[#E8A838] rounded text-sm font-medium">{sortedList.length}건</span>
            </div>
            {selectedIds.size > 0 && (
              <button onClick={() => setSelectedIds(new Set())} className="text-sm text-[var(--muted)] hover:text-white">선택 해제 ({selectedIds.size}건)</button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-12">
                    <input type="checkbox" checked={sortedList.length > 0 && selectedIds.size === sortedList.length} onChange={handleSelectAll} className="rounded" />
                  </th>
                  <th className="text-center">No</th>
                  <SortableHeader columnKey="obArDate" label="입출항일자" className="text-center" />
                  <SortableHeader columnKey="customsDate" label="통관수리일자" className="text-center" />
                  <SortableHeader columnKey="accountName" label="거래처" className="text-center" />
                  <SortableHeader columnKey="jobNo" label="JOB.NO." className="text-center" />
                  <SortableHeader columnKey="mblNo" label="M.B/L(MAWB) NO." className="text-center" />
                  <SortableHeader columnKey="hblNo" label="H.B/L(HAWB) NO." className="text-center" />
                  <SortableHeader columnKey="packages" label="갯수" className="text-center" />
                  <SortableHeader columnKey="weight" label="WT" className="text-center" />
                  <SortableHeader columnKey="cbm" label="CBM" className="text-center" />
                  <SortableHeader columnKey="performanceAmt" label="실적금액" className="text-center" />
                  <SortableHeader columnKey="status" label="상태" className="text-center" />
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={13} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-[#E8A838] border-t-transparent rounded-full animate-spin" />
                        <p className="text-[var(--muted)]">조회 중...</p>
                      </div>
                    </td>
                  </tr>
                ) : sortedList.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <svg className="w-12 h-12 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-[var(--muted)]">{isInitialLoad ? "데이터를 불러오는 중..." : "조회된 데이터가 없습니다."}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedList.map((row, index) => {
                    const st = getStatusConfig(row.status);
                    return (
                      <tr key={row.id}
                        className={`border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer transition-colors ${selectedIds.has(row.id) ? "bg-blue-500/10" : ""} ${selectedRow?.id === row.id ? "bg-[#E8A838]/10" : ""}`}
                        onClick={() => handleRowClick(row)} onDoubleClick={() => handleRowDoubleClick(row)}>
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => handleRowSelect(row.id)} className="rounded" />
                        </td>
                        <td className="p-3 text-center text-sm">{index + 1}</td>
                        <td className="p-3 text-center text-sm text-[var(--muted)]">{row.obArDate || "-"}</td>
                        <td className="p-3 text-center text-sm text-[var(--muted)]">{row.customsDate || "-"}</td>
                        <td className="p-3 text-sm">{row.accountName || "-"}</td>
                        <td className="p-3 text-center">
                          <span className="text-[#E8A838] font-medium hover:underline">{row.jobNo}</span>
                        </td>
                        <td className="p-3 text-sm text-center font-medium">{row.mblNo || "-"}</td>
                        <td className="p-3 text-sm text-center font-medium">{row.hblNo || "-"}</td>
                        <td className="p-3 text-sm text-right">{row.packages ? `${row.packages.toLocaleString()} ${row.packageUnit || ''}`.trim() : "-"}</td>
                        <td className="p-3 text-sm text-right">{row.weight?.toLocaleString() || "0"}</td>
                        <td className="p-3 text-sm text-right">{row.cbm?.toLocaleString() || "0"}</td>
                        <td className="p-3 text-sm text-right font-medium">{formatCurrency(row.performanceAmt || 0)}</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ color: st.color, backgroundColor: st.bgColor }}>{st.label}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedRow && (
          <div className="card">
            <div className="p-4 border-b border-[var(--border)]"><h3 className="font-bold">선택된 통관정산 정보</h3></div>
            <div className="p-4">
              <div className="grid grid-cols-4 gap-4">
                <div><span className="text-sm text-[var(--muted)]">JOB NO.</span><p className="font-medium">{selectedRow.jobNo}</p></div>
                <div><span className="text-sm text-[var(--muted)]">M.B/L(MAWB) NO.</span><p className="font-medium">{selectedRow.mblNo || "-"}</p></div>
                <div><span className="text-sm text-[var(--muted)]">H.B/L(HAWB) NO.</span><p className="font-medium">{selectedRow.hblNo || "-"}</p></div>
                <div>
                  <span className="text-sm text-[var(--muted)]">상태</span>
                  <p><span className="px-3 py-1 rounded-full text-xs font-medium" style={{ color: getStatusConfig(selectedRow.status).color, backgroundColor: getStatusConfig(selectedRow.status).bgColor }}>{getStatusConfig(selectedRow.status).label}</span></p>
                </div>
                <div><span className="text-sm text-[var(--muted)]">거래처</span><p className="font-medium">{selectedRow.accountName || "-"}</p></div>
                <div><span className="text-sm text-[var(--muted)]">BOUND</span><p className="font-medium">{boundLabels[selectedRow.boundType] || selectedRow.boundType}</p></div>
                <div><span className="text-sm text-[var(--muted)]">입출항일자</span><p className="font-medium">{selectedRow.obArDate || "-"}</p></div>
                <div><span className="text-sm text-[var(--muted)]">실적금액</span><p className="font-medium text-[#E8A838]">{formatCurrency(selectedRow.performanceAmt || 0)}</p></div>
              </div>
            </div>
          </div>
        )}
      </main>

      <CloseConfirmModal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} onConfirm={handleConfirmClose} />
      <CodeSearchModal isOpen={showCodeSearchModal} onClose={() => setShowCodeSearchModal(false)} onSelect={handleCodeSelect} codeType={searchModalType} />
    </PageLayout>
  );
}
