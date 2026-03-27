'use client';

import { useState, useCallback, useMemo } from 'react';

// 화면설계서 UI-G-00-00-03 기준 Dimensions 계산 팝업

interface DimensionRow {
  id: string;
  print: boolean;
  width: number;     // 가로 (cm)
  length: number;    // 세로 (cm)
  height: number;    // 높이 (cm)
  pcs: number;       // 포장개수
  volume: number;    // 용적 (자동계산)
}

interface DimensionsCalcModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (dimensions: DimensionRow[], totalPcs: number, totalVolume: number) => void;
  initialData?: DimensionRow[];
}

// Volume 계산: (Width × Length × Height × PCS) ÷ 6000
const calculateVolume = (width: number, length: number, height: number, pcs: number): number => {
  if (width <= 0 || length <= 0 || height <= 0 || pcs <= 0) return 0;
  return Number(((width * length * height * pcs) / 6000).toFixed(3));
};

export default function DimensionsCalcModal({
  isOpen,
  onClose,
  onApply,
  initialData = [],
}: DimensionsCalcModalProps) {
  const [rows, setRows] = useState<DimensionRow[]>(
    initialData.length > 0 ? initialData : []
  );

  // 합계 계산
  const totals = useMemo(() => {
    const totalPcs = rows.reduce((sum, row) => sum + (row.print ? row.pcs : 0), 0);
    const totalVolume = rows.reduce((sum, row) => sum + (row.print ? row.volume : 0), 0);
    return { totalPcs, totalVolume: Number(totalVolume.toFixed(3)) };
  }, [rows]);

  // 행 추가
  const handleAddRow = useCallback(() => {
    const newRow: DimensionRow = {
      id: `DIM-${Date.now()}`,
      print: true,
      width: 0,
      length: 0,
      height: 0,
      pcs: 0,
      volume: 0,
    };
    setRows(prev => [...prev, newRow]);
  }, []);

  // 행 삭제
  const handleDeleteRow = useCallback((id: string) => {
    setRows(prev => prev.filter(row => row.id !== id));
  }, []);

  // 행 수정
  const handleRowChange = useCallback((id: string, field: keyof DimensionRow, value: number | boolean) => {
    setRows(prev => prev.map(row => {
      if (row.id !== id) return row;

      const updatedRow = { ...row, [field]: value };

      // 수치 필드 변경시 Volume 자동 계산
      if (['width', 'length', 'height', 'pcs'].includes(field)) {
        updatedRow.volume = calculateVolume(
          field === 'width' ? (value as number) : row.width,
          field === 'length' ? (value as number) : row.length,
          field === 'height' ? (value as number) : row.height,
          field === 'pcs' ? (value as number) : row.pcs
        );
      }

      return updatedRow;
    }));
  }, []);

  // 초기화
  const handleReset = useCallback(() => {
    setRows([]);
  }, []);

  // 적용
  const handleApply = useCallback(() => {
    onApply(rows, totals.totalPcs, totals.totalVolume);
    onClose();
  }, [rows, totals, onApply, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div className="relative bg-gray-50 rounded-xl shadow-2xl w-[800px] max-h-[80vh] flex flex-col border border-gray-200">
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-[#1A2744] rounded-t-xl">
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

        {/* 설명 */}
        <div className="px-6 py-3 bg-white border-b border-gray-200">
          <p className="text-sm text-gray-500">
            <span className="font-medium text-[#E8A838]">계산 공식:</span> Volume = (Width x Length x Height x PCS) / 6,000
          </p>
        </div>

        {/* 버튼 영역 */}
        <div className="px-6 py-3 flex justify-between items-center border-b border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={handleAddRow}
              className="px-4 py-2 bg-[#E8A838] text-white rounded-lg hover:bg-[#d99a2f] font-medium text-sm"
            >
              추가
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 text-sm"
            >
              초기화
            </button>
          </div>
          <div className="text-sm text-gray-500">
            Total: <span className="font-medium text-white">{totals.totalPcs}</span> PCS,
            <span className="font-medium text-white ml-2">{totals.totalVolume.toFixed(3)}</span> CBM
          </div>
        </div>

        {/* 테이블 */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <table className="w-full">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="p-2 text-center text-xs font-semibold w-12">삭제</th>
                <th className="p-2 text-center text-xs font-semibold w-12">Print</th>
                <th className="p-2 text-center text-xs font-semibold">Width (cm)</th>
                <th className="p-2 text-center text-xs font-semibold">Length (cm)</th>
                <th className="p-2 text-center text-xs font-semibold">Height (cm)</th>
                <th className="p-2 text-center text-xs font-semibold">PCS</th>
                <th className="p-2 text-center text-xs font-semibold">Volume (CBM)</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <p className="text-sm">Dimensions 데이터가 없습니다.</p>
                      <p className="text-xs">추가 버튼을 클릭하여 데이터를 입력하세요.</p>
                    </div>
                  </td>
                </tr>
              ) : rows.map((row) => (
                <tr key={row.id} className="border-t border-gray-200 hover:bg-white">
                  <td className="p-2 text-center">
                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      className="p-1 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={row.print}
                      onChange={e => handleRowChange(row.id, 'print', e.target.checked)}
                      className="rounded text-[#E8A838]"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={row.width || ''}
                      onChange={e => handleRowChange(row.id, 'width', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-sm text-right focus:ring-2 focus:ring-[#E8A838]"
                      min={0}
                      step={0.1}
                      placeholder="0"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={row.length || ''}
                      onChange={e => handleRowChange(row.id, 'length', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-sm text-right focus:ring-2 focus:ring-[#E8A838]"
                      min={0}
                      step={0.1}
                      placeholder="0"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={row.height || ''}
                      onChange={e => handleRowChange(row.id, 'height', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-sm text-right focus:ring-2 focus:ring-[#E8A838]"
                      min={0}
                      step={0.1}
                      placeholder="0"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={row.pcs || ''}
                      onChange={e => handleRowChange(row.id, 'pcs', parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-sm text-right focus:ring-2 focus:ring-[#E8A838]"
                      min={0}
                      placeholder="0"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.volume.toFixed(3)}
                      readOnly
                      className="w-full px-2 py-1.5 bg-gray-100 border border-gray-200 rounded text-sm text-right font-medium text-[#E8A838]"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            {rows.length > 0 && (
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr className="font-medium">
                  <td colSpan={5} className="p-2 text-right text-sm">Total:</td>
                  <td className="p-2 text-right text-sm text-[#E8A838]">{totals.totalPcs}</td>
                  <td className="p-2 text-right text-sm text-[#E8A838]">{totals.totalVolume.toFixed(3)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* 하단 버튼 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200"
          >
            닫기
          </button>
          <button
            onClick={handleApply}
            disabled={rows.length === 0}
            className="px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            적용
          </button>
        </div>
      </div>
    </div>
  );
}
