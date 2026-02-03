'use client';

import { useState, useMemo } from 'react';

export interface ANItem {
  anNo: string;
  blNo: string;
  arrivalDate: string;
  shipper: string;
  consignee: string;
  portOfLoading: string;
  portOfDischarge: string;
  status: 'pending' | 'arrived' | 'delivered' | 'canceled';
}

interface ANSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: ANItem) => void;
  type?: 'sea' | 'air';
}

const sampleData: ANItem[] = [
  { anNo: 'AN-2024010001', blNo: 'MAEUKR12345678', arrivalDate: '2024-01-15', shipper: '삼성전자', consignee: 'Samsung America', portOfLoading: 'KRPUS', portOfDischarge: 'USLAX', status: 'arrived' },
  { anNo: 'AN-2024010002', blNo: 'COSCO98765432', arrivalDate: '2024-01-16', shipper: 'LG전자', consignee: 'LG USA Inc.', portOfLoading: 'KRINC', portOfDischarge: 'USLGB', status: 'pending' },
  { anNo: 'AN-2024010003', blNo: 'ONEK123456789', arrivalDate: '2024-01-17', shipper: '현대자동차', consignee: 'Hyundai Motor', portOfLoading: 'KRPUS', portOfDischarge: 'DEHAM', status: 'delivered' },
  { anNo: 'AN-2024010004', blNo: 'HMMU876543210', arrivalDate: '2024-01-18', shipper: 'SK하이닉스', consignee: 'SK Hynix America', portOfLoading: 'KRPUS', portOfDischarge: 'CNSHA', status: 'pending' },
  { anNo: 'AN-2024010005', blNo: 'EGLV567891234', arrivalDate: '2024-01-19', shipper: '포스코', consignee: 'POSCO Japan', portOfLoading: 'KRPUS', portOfDischarge: 'JPYOK', status: 'arrived' },
];

const statusConfig = {
  pending: { label: '대기', color: '#F59E0B', bgColor: '#FEF3C7' },
  arrived: { label: '도착', color: '#10B981', bgColor: '#D1FAE5' },
  delivered: { label: '인도완료', color: '#3B82F6', bgColor: '#DBEAFE' },
  canceled: { label: '취소', color: '#EF4444', bgColor: '#FEE2E2' },
};

export default function ANSearchModal({
  isOpen,
  onClose,
  onSelect,
  type = 'sea',
}: ANSearchModalProps) {
  const [searchText, setSearchText] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState<ANItem | null>(null);

  const filteredData = useMemo(() => {
    return sampleData.filter(item => {
      if (searchText && !item.anNo.includes(searchText) && !item.blNo.includes(searchText)) return false;
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
      <div className="bg-[var(--surface-50)] rounded-lg shadow-xl w-[900px] max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[#1A2744]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            A/N 검색 ({type === 'sea' ? '해상' : '항공'})
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
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">일자</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
              />
            </div>
            <div className="w-36">
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">&nbsp;</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
              />
            </div>
            <div className="w-28">
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">상태</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
              >
                <option value="">전체</option>
                <option value="pending">대기</option>
                <option value="arrived">도착</option>
                <option value="delivered">인도완료</option>
                <option value="canceled">취소</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">A/N No / B/L No</label>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="A/N번호 또는 B/L번호 검색"
                className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
              />
            </div>
            <button onClick={handleReset} className="px-4 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
              초기화
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="text-sm text-[var(--muted)] mb-2">검색 결과: {filteredData.length}건</div>
          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface-100)] sticky top-0">
                <tr>
                  <th className="p-2 text-center w-32">A/N 번호</th>
                  <th className="p-2 text-center w-36">B/L 번호</th>
                  <th className="p-2 text-center w-24">도착일자</th>
                  <th className="p-2 text-left">송화인</th>
                  <th className="p-2 text-left">수화인</th>
                  <th className="p-2 text-center w-20">출발항</th>
                  <th className="p-2 text-center w-20">도착항</th>
                  <th className="p-2 text-center w-20">상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-[var(--muted)]">조회된 A/N이 없습니다.</td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr
                      key={item.anNo}
                      className={`border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer ${selectedItem?.anNo === item.anNo ? 'bg-blue-50' : ''}`}
                      onClick={() => setSelectedItem(item)}
                      onDoubleClick={() => { onSelect(item); onClose(); }}
                    >
                      <td className="p-2 text-center font-mono text-blue-600">{item.anNo}</td>
                      <td className="p-2 text-center font-mono">{item.blNo}</td>
                      <td className="p-2 text-center">{item.arrivalDate}</td>
                      <td className="p-2">{item.shipper}</td>
                      <td className="p-2">{item.consignee}</td>
                      <td className="p-2 text-center">{item.portOfLoading}</td>
                      <td className="p-2 text-center">{item.portOfDischarge}</td>
                      <td className="p-2 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ color: statusConfig[item.status]?.color, backgroundColor: statusConfig[item.status]?.bgColor }}>
                          {statusConfig[item.status]?.label}
                        </span>
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
