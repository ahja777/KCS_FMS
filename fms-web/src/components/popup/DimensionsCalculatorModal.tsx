'use client';

import { useState, useMemo } from 'react';

export interface DimensionItem {
  id: string;
  length: number;
  width: number;
  height: number;
  qty: number;
  cbm: number;
}

interface DimensionsCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (totalCbm: number, items: DimensionItem[]) => void;
  initialItems?: DimensionItem[];
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function DimensionsCalculatorModal({
  isOpen,
  onClose,
  onApply,
  initialItems = [],
}: DimensionsCalculatorModalProps) {
  const [items, setItems] = useState<DimensionItem[]>(
    initialItems.length > 0 ? initialItems : [{ id: generateId(), length: 0, width: 0, height: 0, qty: 1, cbm: 0 }]
  );

  const calculateCbm = (length: number, width: number, height: number, qty: number): number => {
    return (length * width * height * qty) / 1000000;
  };

  const updateItem = (id: string, field: keyof DimensionItem, value: number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      updated.cbm = calculateCbm(updated.length, updated.width, updated.height, updated.qty);
      return updated;
    }));
  };

  const addItem = () => {
    setItems(prev => [...prev, { id: generateId(), length: 0, width: 0, height: 0, qty: 1, cbm: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleReset = () => {
    setItems([{ id: generateId(), length: 0, width: 0, height: 0, qty: 1, cbm: 0 }]);
  };

  const totalCbm = useMemo(() => {
    return items.reduce((sum, item) => sum + item.cbm, 0);
  }, [items]);

  const totalQty = useMemo(() => {
    return items.reduce((sum, item) => sum + item.qty, 0);
  }, [items]);

  const handleApply = () => {
    onApply(totalCbm, items);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--surface-100)] rounded-lg shadow-xl w-[700px] max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[#1A2744] rounded-t-lg">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Dimensions 계산
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 border-b border-[var(--border)] bg-blue-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-800">
              <strong>CBM 계산식:</strong> (가로 × 세로 × 높이 × 수량) ÷ 1,000,000 (cm → CBM)
            </div>
            <div className="flex gap-2">
              <button onClick={addItem} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                추가
              </button>
              <button onClick={handleReset} className="px-3 py-1.5 text-sm bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">
                초기화
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface-100)]">
                <tr>
                  <th className="p-2 text-center w-10">No</th>
                  <th className="p-2 text-center">가로 (cm)</th>
                  <th className="p-2 text-center">세로 (cm)</th>
                  <th className="p-2 text-center">높이 (cm)</th>
                  <th className="p-2 text-center w-20">수량</th>
                  <th className="p-2 text-center w-28">CBM</th>
                  <th className="p-2 text-center w-16">삭제</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} className="border-t border-[var(--border)]">
                    <td className="p-2 text-center text-[var(--muted)]">{index + 1}</td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={item.length || ''}
                        onChange={(e) => updateItem(item.id, 'length', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 text-sm text-center bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={item.width || ''}
                        onChange={(e) => updateItem(item.id, 'width', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 text-sm text-center bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={item.height || ''}
                        onChange={(e) => updateItem(item.id, 'height', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 text-sm text-center bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1.5 text-sm text-center bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="p-2 text-center font-mono font-medium text-blue-600">
                      {item.cbm.toFixed(4)}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                        className="p-1 text-red-500 hover:text-red-700 disabled:text-gray-300"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-4 bg-[var(--surface-100)] border-t border-[var(--border)]">
          <div className="flex justify-between items-center">
            <div className="text-sm text-[var(--muted)]">
              총 {items.length}건
            </div>
            <div className="flex gap-6 text-sm">
              <span>총 수량: <strong className="text-lg">{totalQty.toLocaleString()}</strong></span>
              <span>Total CBM: <strong className="text-lg text-blue-600">{totalCbm.toFixed(4)}</strong></span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[var(--border)] flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">닫기</button>
          <button onClick={handleApply} className="px-4 py-2 bg-[#E8A838] text-[#0C1222] font-semibold rounded-lg hover:bg-[#D4943A]">적용</button>
        </div>
      </div>
    </div>
  );
}
