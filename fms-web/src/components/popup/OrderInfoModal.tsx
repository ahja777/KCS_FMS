'use client';

import { useState, useMemo } from 'react';

export interface OrderItem {
  orderNo: string;
  orderDate: string;
  customer: string;
  customerCode: string;
  origin: string;
  destination: string;
  cargoType: string;
  status: 'requested' | 'confirmed' | 'processing' | 'completed' | 'canceled';
}

interface OrderInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: OrderItem) => void;
}

const sampleData: OrderItem[] = [
  { orderNo: 'ORD-2024010001', orderDate: '2024-01-10', customer: '삼성전자', customerCode: 'C001', origin: '부산', destination: 'Los Angeles', cargoType: '전자제품', status: 'confirmed' },
  { orderNo: 'ORD-2024010002', orderDate: '2024-01-11', customer: 'LG전자', customerCode: 'C002', origin: '인천', destination: 'Shanghai', cargoType: '가전제품', status: 'processing' },
  { orderNo: 'ORD-2024010003', orderDate: '2024-01-12', customer: '현대자동차', customerCode: 'C003', origin: '부산', destination: 'Hamburg', cargoType: '자동차부품', status: 'requested' },
  { orderNo: 'ORD-2024010004', orderDate: '2024-01-13', customer: 'SK하이닉스', customerCode: 'C004', origin: '인천', destination: 'Tokyo', cargoType: '반도체', status: 'completed' },
  { orderNo: 'ORD-2024010005', orderDate: '2024-01-14', customer: '포스코', customerCode: 'C005', origin: '부산', destination: 'Rotterdam', cargoType: '철강', status: 'confirmed' },
];

const statusConfig = {
  requested: { label: '요청', color: '#F59E0B', bgColor: '#FEF3C7' },
  confirmed: { label: '확정', color: '#8B5CF6', bgColor: '#EDE9FE' },
  processing: { label: '진행중', color: '#0EA5E9', bgColor: '#E0F2FE' },
  completed: { label: '완료', color: '#10B981', bgColor: '#D1FAE5' },
  canceled: { label: '취소', color: '#EF4444', bgColor: '#FEE2E2' },
};

export default function OrderInfoModal({
  isOpen,
  onClose,
  onSelect,
}: OrderInfoModalProps) {
  const [searchText, setSearchText] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);

  const filteredData = useMemo(() => {
    return sampleData.filter(item => {
      if (searchText && !item.orderNo.includes(searchText) && !item.customer.includes(searchText)) return false;
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
      <div className="bg-[var(--surface-100)] rounded-lg shadow-xl w-[900px] max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[#1A2744] rounded-t-lg">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            주문관리정보 조회
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
                <option value="requested">요청</option>
                <option value="confirmed">확정</option>
                <option value="processing">진행중</option>
                <option value="completed">완료</option>
                <option value="canceled">취소</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">주문번호 / 거래처</label>
              <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="주문번호 또는 거래처 검색" className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
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
                  <th className="p-2 text-center w-36">주문번호</th>
                  <th className="p-2 text-center w-24">주문일자</th>
                  <th className="p-2 text-left">거래처</th>
                  <th className="p-2 text-left">화물유형</th>
                  <th className="p-2 text-center w-24">출발지</th>
                  <th className="p-2 text-center w-28">도착지</th>
                  <th className="p-2 text-center w-20">상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-[var(--muted)]">조회된 주문이 없습니다.</td></tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.orderNo} className={`border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer ${selectedItem?.orderNo === item.orderNo ? 'bg-blue-50' : ''}`} onClick={() => setSelectedItem(item)} onDoubleClick={() => { onSelect(item); onClose(); }}>
                      <td className="p-2 text-center font-mono text-blue-600">{item.orderNo}</td>
                      <td className="p-2 text-center">{item.orderDate}</td>
                      <td className="p-2">{item.customer}</td>
                      <td className="p-2">{item.cargoType}</td>
                      <td className="p-2 text-center">{item.origin}</td>
                      <td className="p-2 text-center">{item.destination}</td>
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
