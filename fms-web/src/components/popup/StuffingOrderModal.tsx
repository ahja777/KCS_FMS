'use client';

import { useState, useMemo } from 'react';

export interface StuffingOrderItem {
  soNo: string;
  blNo: string;
  regDate: string;
  customer: string;
  portOfLoading: string;
  portOfDischarge: string;
  vesselName: string;
  voyage: string;
  status: 'pending' | 'confirmed' | 'completed' | 'canceled';
}

interface StuffingOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: StuffingOrderItem) => void;
}

const sampleData: StuffingOrderItem[] = [
  { soNo: 'SO-2024010001', blNo: 'MAEUKR12345678', regDate: '2024-01-10', customer: '삼성전자', portOfLoading: 'KRPUS', portOfDischarge: 'USLAX', vesselName: 'MAERSK EUBANK', voyage: '2401E', status: 'confirmed' },
  { soNo: 'SO-2024010002', blNo: 'COSCO98765432', regDate: '2024-01-11', customer: 'LG전자', portOfLoading: 'KRINC', portOfDischarge: 'CNSHA', vesselName: 'COSCO SHIPPING', voyage: '2402W', status: 'pending' },
  { soNo: 'SO-2024010003', blNo: 'ONEK123456789', regDate: '2024-01-12', customer: '현대자동차', portOfLoading: 'KRPUS', portOfDischarge: 'DEHAM', vesselName: 'ONE COMMITMENT', voyage: '2403E', status: 'completed' },
  { soNo: 'SO-2024010004', blNo: 'HMMU876543210', regDate: '2024-01-13', customer: 'SK하이닉스', portOfLoading: 'KRPUS', portOfDischarge: 'JPYOK', vesselName: 'HMM ALGECIRAS', voyage: '2404E', status: 'pending' },
  { soNo: 'SO-2024010005', blNo: 'EGLV567891234', regDate: '2024-01-14', customer: '포스코', portOfLoading: 'KRPUS', portOfDischarge: 'NLRTM', vesselName: 'EVER GIVEN', voyage: '2405W', status: 'confirmed' },
];

const statusConfig = {
  pending: { label: '대기', color: '#F59E0B', bgColor: '#FEF3C7' },
  confirmed: { label: '확정', color: '#10B981', bgColor: '#D1FAE5' },
  completed: { label: '완료', color: '#3B82F6', bgColor: '#DBEAFE' },
  canceled: { label: '취소', color: '#EF4444', bgColor: '#FEE2E2' },
};

export default function StuffingOrderModal({
  isOpen,
  onClose,
  onSelect,
}: StuffingOrderModalProps) {
  const [searchText, setSearchText] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState<StuffingOrderItem | null>(null);

  const filteredData = useMemo(() => {
    return sampleData.filter(item => {
      if (searchText && !item.soNo.includes(searchText) && !item.blNo.includes(searchText) && !item.customer.includes(searchText)) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      return true;
    });
  }, [searchText, statusFilter]);

  const handleSelect = () => {
    if (selectedItem) {
      onSelect(selectedItem);
      onClose();
    }
  };

  const handleReset = () => {
    setSearchText('');
    setDateFrom('');
    setDateTo('');
    setStatusFilter('');
    setSelectedItem(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--surface-100)] rounded-lg shadow-xl w-[950px] max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[#1A2744] rounded-t-lg">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            STUFFING ORDER 조회
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-100)]">
          <div className="flex gap-3 items-end">
            <div className="w-36">
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">등록일자</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
            </div>
            <div className="w-36">
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">&nbsp;</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
            </div>
            <div className="w-28">
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">상태</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg">
                <option value="">전체</option>
                <option value="pending">대기</option>
                <option value="confirmed">확정</option>
                <option value="completed">완료</option>
                <option value="canceled">취소</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">S/O No / B/L No / 거래처</label>
              <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="S/O번호, B/L번호 또는 거래처 검색" className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
            </div>
            <button onClick={handleReset} className="px-4 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">초기화</button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="text-sm text-[var(--muted)] mb-2">검색 결과: {filteredData.length}건</div>
          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface-100)] sticky top-0">
                <tr>
                  <th className="p-2 text-center w-32">S/O 번호</th>
                  <th className="p-2 text-center w-36">B/L 번호</th>
                  <th className="p-2 text-center w-24">등록일자</th>
                  <th className="p-2 text-left">거래처</th>
                  <th className="p-2 text-left">선명/항차</th>
                  <th className="p-2 text-center w-20">출발항</th>
                  <th className="p-2 text-center w-20">도착항</th>
                  <th className="p-2 text-center w-20">상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-[var(--muted)]">조회된 STUFFING ORDER가 없습니다.</td></tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.soNo} className={`border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer ${selectedItem?.soNo === item.soNo ? 'bg-blue-50' : ''}`} onClick={() => setSelectedItem(item)} onDoubleClick={() => { onSelect(item); onClose(); }}>
                      <td className="p-2 text-center font-mono text-blue-600">{item.soNo}</td>
                      <td className="p-2 text-center font-mono">{item.blNo}</td>
                      <td className="p-2 text-center">{item.regDate}</td>
                      <td className="p-2">{item.customer}</td>
                      <td className="p-2">{item.vesselName} / {item.voyage}</td>
                      <td className="p-2 text-center">{item.portOfLoading}</td>
                      <td className="p-2 text-center">{item.portOfDischarge}</td>
                      <td className="p-2 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ color: statusConfig[item.status]?.color, backgroundColor: statusConfig[item.status]?.bgColor }}>{statusConfig[item.status]?.label}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-4 border-t border-[var(--border)] flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">닫기</button>
          <button onClick={handleSelect} disabled={!selectedItem} className="px-4 py-2 bg-[#E8A838] text-[#0C1222] font-semibold rounded-lg hover:bg-[#D4943A] disabled:opacity-50">적용</button>
        </div>
      </div>
    </div>
  );
}
