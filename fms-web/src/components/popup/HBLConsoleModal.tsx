'use client';

import { useState, useMemo } from 'react';

export interface HBLConsoleItem {
  hblNo: string;
  mblNo: string;
  regDate: string;
  shipper: string;
  consignee: string;
  pieces: number;
  grossWeight: number;
  cbm: number;
  status: 'pending' | 'consolidated' | 'shipped' | 'delivered';
}

interface HBLConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (items: HBLConsoleItem[]) => void;
}

const sampleData: HBLConsoleItem[] = [
  { hblNo: 'HBLKR001', mblNo: 'MAEUKR12345678', regDate: '2024-01-10', shipper: '삼성전자', consignee: 'Samsung America', pieces: 50, grossWeight: 1200, cbm: 15.5, status: 'pending' },
  { hblNo: 'HBLKR002', mblNo: 'MAEUKR12345678', regDate: '2024-01-10', shipper: 'LG전자', consignee: 'LG USA Inc.', pieces: 30, grossWeight: 800, cbm: 10.2, status: 'pending' },
  { hblNo: 'HBLKR003', mblNo: 'MAEUKR12345678', regDate: '2024-01-10', shipper: '현대자동차', consignee: 'Hyundai Motor', pieces: 20, grossWeight: 600, cbm: 8.5, status: 'consolidated' },
  { hblNo: 'HBLKR004', mblNo: 'COSCO98765432', regDate: '2024-01-11', shipper: 'SK하이닉스', consignee: 'SK Hynix America', pieces: 100, grossWeight: 2500, cbm: 25.0, status: 'shipped' },
  { hblNo: 'HBLKR005', mblNo: 'COSCO98765432', regDate: '2024-01-11', shipper: '포스코', consignee: 'POSCO Japan', pieces: 40, grossWeight: 1800, cbm: 18.3, status: 'delivered' },
];

const statusConfig = {
  pending: { label: '대기', color: '#F59E0B', bgColor: '#FEF3C7' },
  consolidated: { label: '취합완료', color: '#8B5CF6', bgColor: '#EDE9FE' },
  shipped: { label: '선적완료', color: '#10B981', bgColor: '#D1FAE5' },
  delivered: { label: '인도완료', color: '#3B82F6', bgColor: '#DBEAFE' },
};

export default function HBLConsoleModal({
  isOpen,
  onClose,
  onSelect,
}: HBLConsoleModalProps) {
  const [searchText, setSearchText] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedItems, setSelectedItems] = useState<HBLConsoleItem[]>([]);

  const filteredData = useMemo(() => {
    return sampleData.filter(item => {
      if (searchText && !item.hblNo.includes(searchText) && !item.mblNo.includes(searchText) && !item.shipper.includes(searchText)) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      return true;
    });
  }, [searchText, statusFilter]);

  const handleToggleSelect = (item: HBLConsoleItem) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.hblNo === item.hblNo);
      if (exists) {
        return prev.filter(i => i.hblNo !== item.hblNo);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredData.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems([...filteredData]);
    }
  };

  const handleApply = () => {
    if (selectedItems.length > 0) {
      onSelect(selectedItems);
      onClose();
    }
  };

  const handleReset = () => {
    setSearchText('');
    setDateFrom('');
    setDateTo('');
    setStatusFilter('');
    setSelectedItems([]);
  };

  if (!isOpen) return null;

  const totalPieces = selectedItems.reduce((sum, item) => sum + item.pieces, 0);
  const totalWeight = selectedItems.reduce((sum, item) => sum + item.grossWeight, 0);
  const totalCbm = selectedItems.reduce((sum, item) => sum + item.cbm, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--surface-100)] rounded-lg shadow-xl w-[1000px] max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[#1A2744] rounded-t-lg">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            HOUSE B/L CONSOLE
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
                <option value="consolidated">취합완료</option>
                <option value="shipped">선적완료</option>
                <option value="delivered">인도완료</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">HBL No / MBL No / 송화인</label>
              <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="HBL번호, MBL번호 또는 송화인 검색" className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
            </div>
            <button onClick={handleReset} className="px-4 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">초기화</button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-[var(--muted)]">검색 결과: {filteredData.length}건 / 선택: {selectedItems.length}건</div>
            <button onClick={handleSelectAll} className="text-sm text-blue-600 hover:text-blue-800">
              {selectedItems.length === filteredData.length ? '전체해제' : '전체선택'}
            </button>
          </div>
          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface-100)] sticky top-0">
                <tr>
                  <th className="p-2 w-10"><input type="checkbox" checked={selectedItems.length === filteredData.length && filteredData.length > 0} onChange={handleSelectAll} className="w-4 h-4" /></th>
                  <th className="p-2 text-center w-28">HBL 번호</th>
                  <th className="p-2 text-center w-36">MBL 번호</th>
                  <th className="p-2 text-center w-24">등록일자</th>
                  <th className="p-2 text-left">송화인</th>
                  <th className="p-2 text-left">수화인</th>
                  <th className="p-2 text-right w-16">Pcs</th>
                  <th className="p-2 text-right w-20">G/W</th>
                  <th className="p-2 text-right w-16">CBM</th>
                  <th className="p-2 text-center w-20">상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr><td colSpan={10} className="p-8 text-center text-[var(--muted)]">조회된 HBL이 없습니다.</td></tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.hblNo} className={`border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer ${selectedItems.find(i => i.hblNo === item.hblNo) ? 'bg-blue-50' : ''}`} onClick={() => handleToggleSelect(item)}>
                      <td className="p-2 text-center"><input type="checkbox" checked={!!selectedItems.find(i => i.hblNo === item.hblNo)} onChange={() => handleToggleSelect(item)} className="w-4 h-4" /></td>
                      <td className="p-2 text-center font-mono text-blue-600">{item.hblNo}</td>
                      <td className="p-2 text-center font-mono">{item.mblNo}</td>
                      <td className="p-2 text-center">{item.regDate}</td>
                      <td className="p-2">{item.shipper}</td>
                      <td className="p-2">{item.consignee}</td>
                      <td className="p-2 text-right">{item.pieces.toLocaleString()}</td>
                      <td className="p-2 text-right">{item.grossWeight.toLocaleString()}</td>
                      <td className="p-2 text-right">{item.cbm.toFixed(1)}</td>
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

        {selectedItems.length > 0 && (
          <div className="p-4 bg-blue-50 border-t border-blue-200">
            <div className="flex justify-between text-sm">
              <span className="font-medium">선택 합계:</span>
              <div className="flex gap-6">
                <span>Pieces: <strong>{totalPieces.toLocaleString()}</strong></span>
                <span>Gross Weight: <strong>{totalWeight.toLocaleString()} kg</strong></span>
                <span>CBM: <strong>{totalCbm.toFixed(2)}</strong></span>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-[var(--border)] flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">닫기</button>
          <button onClick={handleApply} disabled={selectedItems.length === 0} className="px-4 py-2 bg-[#E8A838] text-[#0C1222] font-semibold rounded-lg hover:bg-[#D4943A] disabled:opacity-50">적용 ({selectedItems.length}건)</button>
        </div>
      </div>
    </div>
  );
}
