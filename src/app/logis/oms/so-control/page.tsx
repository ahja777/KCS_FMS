'use client';

import { useState, useEffect, useCallback } from 'react';
import PageLayout from '@/components/PageLayout';

interface SOControl {
  id: number;
  control_code: string;
  control_name: string;
  customer_code: string;
  order_type_code: string;
  biz_type: string;
  check_validation: boolean;
  auto_release: boolean;
  auto_value_assignment: boolean;
  method_type: string;
  execution_module: string;
  is_active: boolean;
  created_at: string;
}

interface OrderType {
  id: number;
  order_type_code: string;
  order_type_name: string;
  biz_type: string;
}

const BIZ_TYPE_OPTIONS = [
  { value: 'DOMESTIC', label: 'Domestic' },
  { value: 'WAREHOUSE', label: 'Warehouse' },
  { value: 'IMPORT', label: 'Import' },
  { value: 'EXPORT', label: 'Export' },
];

const METHOD_TYPE_OPTIONS = [
  { value: 'SIMULTANEOUS', label: '동시 진행' },
  { value: 'SEQUENTIAL', label: '완료후 진행' },
  { value: 'INTERNAL', label: '내부 진행' },
];

const EXECUTION_MODULE_OPTIONS = [
  { value: 'FW', label: 'Forwarding (FW)' },
  { value: 'TM', label: 'Transport (TM)' },
  { value: 'WM', label: 'Warehouse (WM)' },
];

// 샘플 데이터
const sampleControls: SOControl[] = [
  { id: 1, control_code: 'CTRL-EXP-STD', control_name: '수출 표준 컨트롤', customer_code: '', order_type_code: 'EXP-FCL', biz_type: 'EXPORT', check_validation: true, auto_release: false, auto_value_assignment: true, method_type: 'SEQUENTIAL', execution_module: 'FW', is_active: true, created_at: '2026-01-01' },
  { id: 2, control_code: 'CTRL-EXP-PRIO', control_name: '수출 우선 컨트롤', customer_code: 'SAMSUNG', order_type_code: 'EXP-FCL', biz_type: 'EXPORT', check_validation: true, auto_release: true, auto_value_assignment: true, method_type: 'SIMULTANEOUS', execution_module: 'FW', is_active: true, created_at: '2026-01-01' },
  { id: 3, control_code: 'CTRL-IMP-STD', control_name: '수입 표준 컨트롤', customer_code: '', order_type_code: 'IMP-FCL', biz_type: 'IMPORT', check_validation: true, auto_release: false, auto_value_assignment: false, method_type: 'SEQUENTIAL', execution_module: 'FW', is_active: true, created_at: '2026-01-01' },
  { id: 4, control_code: 'CTRL-DOM-TRK', control_name: '내수 트럭 컨트롤', customer_code: '', order_type_code: 'DOM-TRK', biz_type: 'DOMESTIC', check_validation: false, auto_release: true, auto_value_assignment: true, method_type: 'INTERNAL', execution_module: 'TM', is_active: true, created_at: '2026-01-01' },
  { id: 5, control_code: 'CTRL-WH-IN', control_name: '창고 입고 컨트롤', customer_code: '', order_type_code: 'WH-IN', biz_type: 'WAREHOUSE', check_validation: true, auto_release: false, auto_value_assignment: true, method_type: 'SEQUENTIAL', execution_module: 'WM', is_active: true, created_at: '2026-01-01' },
];

export default function SOControlPage() {
  const [controls, setControls] = useState<SOControl[]>([]);
  const [orderTypes, setOrderTypes] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingControl, setEditingControl] = useState<SOControl | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // 폼 데이터
  const [formData, setFormData] = useState({
    control_code: '',
    control_name: '',
    customer_code: '',
    order_type_code: '',
    biz_type: 'EXPORT',
    check_validation: true,
    auto_release: false,
    auto_value_assignment: false,
    method_type: 'SEQUENTIAL',
    execution_module: '',
    is_active: true,
  });

  // 데이터 조회
  const fetchControls = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/oms/so-control');
      const result = await response.json();
      if (result.success && result.data && result.data.length > 0) {
        setControls(result.data);
      } else {
        // API 결과가 없으면 샘플 데이터 사용
        setControls(sampleControls);
      }
    } catch (error) {
      console.error('Error fetching controls:', error);
      // 에러 시 샘플 데이터 사용
      setControls(sampleControls);
    } finally {
      setLoading(false);
    }
  }, []);

  // 오더 타입 조회
  const fetchOrderTypes = async () => {
    try {
      const response = await fetch('/api/oms/order-type?isActive=true');
      const result = await response.json();
      if (result.success) {
        setOrderTypes(result.data);
      }
    } catch (error) {
      console.error('Error fetching order types:', error);
    }
  };

  useEffect(() => {
    fetchControls();
    fetchOrderTypes();
  }, [fetchControls]);

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      control_code: '',
      control_name: '',
      customer_code: '',
      order_type_code: '',
      biz_type: 'EXPORT',
      check_validation: true,
      auto_release: false,
      auto_value_assignment: false,
      method_type: 'SEQUENTIAL',
      execution_module: '',
      is_active: true,
    });
    setEditingControl(null);
  };

  // 저장
  const handleSave = async () => {
    if (!formData.control_code || !formData.control_name) {
      alert('컨트롤 코드와 이름은 필수입니다.');
      return;
    }

    try {
      const url = '/api/oms/so-control';
      const method = editingControl ? 'PUT' : 'POST';
      const body = editingControl ? { ...formData, id: editingControl.id } : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (result.success) {
        alert(result.message);
        setIsModalOpen(false);
        resetForm();
        fetchControls();
      } else {
        alert('오류: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving control:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 삭제
  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/oms/so-control?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        alert(result.message);
        fetchControls();
      } else {
        alert('오류: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting control:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 선택 삭제
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      alert('삭제할 항목을 선택해주세요.');
      return;
    }
    if (!confirm(`선택한 ${selectedIds.size}건을 삭제하시겠습니까?`)) return;

    try {
      for (const id of selectedIds) {
        await fetch(`/api/oms/so-control?id=${id}`, { method: 'DELETE' });
      }
      alert('삭제가 완료되었습니다.');
      setSelectedIds(new Set());
      fetchControls();
    } catch (error) {
      console.error('Error bulk deleting:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 수정 모달 열기
  const handleEdit = (control: SOControl) => {
    setEditingControl(control);
    setFormData({
      control_code: control.control_code || '',
      control_name: control.control_name || '',
      customer_code: control.customer_code || '',
      order_type_code: control.order_type_code || '',
      biz_type: control.biz_type || 'EXPORT',
      check_validation: control.check_validation !== false,
      auto_release: control.auto_release || false,
      auto_value_assignment: control.auto_value_assignment || false,
      method_type: control.method_type || 'SEQUENTIAL',
      execution_module: control.execution_module || '',
      is_active: control.is_active !== false,
    });
    setIsModalOpen(true);
  };

  // 전체 선택
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(controls.map(c => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  // 개별 선택
  const handleSelect = (id: number, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  return (
      <PageLayout title="S/O Control 관리" subtitle="Logis > OMS > S/O Control" showCloseButton={false}>
      <main className="p-6">
        <div className="flex items-center justify-end mb-6">
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)] transition-colors"
          >
            + 신규 등록
          </button>
        </div>

      {/* 버튼 영역 */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-[var(--foreground)]/60">
          총 {controls.length}건 / 선택 {selectedIds.size}건
        </span>
        <div className="flex gap-2">
          <button
            onClick={fetchControls}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            새로고침
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={selectedIds.size === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            선택 삭제
          </button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-[var(--surface-100)] rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="text-center">
                  <input
                    type="checkbox"
                    checked={controls.length > 0 && selectedIds.size === controls.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded"
                  />
                </th>
                <th className="w-14">No</th>
                <th className="text-center">컨트롤 코드</th>
                <th className="text-center">컨트롤 명</th>
                <th className="text-center">고객코드</th>
                <th className="text-center">오더타입</th>
                <th className="text-center">유효성검사</th>
                <th className="text-center">자동릴리즈</th>
                <th className="text-center">자동값할당</th>
                <th className="text-center">처리방법</th>
                <th className="text-center">활성</th>
                <th className="text-center">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-[var(--foreground)]/60">
                    로딩 중...
                  </td>
                </tr>
              ) : controls.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-[var(--foreground)]/60">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                controls.map((control, index) => (
                  <tr key={control.id} className="hover:bg-[var(--surface-200)]/50 transition-colors">
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(control.id)}
                        onChange={(e) => handleSelect(control.id, e.target.checked)}
                        className="rounded"
                      />
                    </td>
                    <td className="text-center text-[var(--muted)]">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#E8A838] text-center">{control.control_code}</td>
                    <td className="px-4 py-3 text-sm text-center">{control.control_name}</td>
                    <td className="px-4 py-3 text-sm text-center">{control.customer_code}</td>
                    <td className="px-4 py-3 text-sm text-center">{control.order_type_code}</td>
                    <td className="px-4 py-3 text-center">
                      {control.check_validation ? (
                        <span className="text-green-500">&#10003;</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {control.auto_release ? (
                        <span className="text-green-500">&#10003;</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {control.auto_value_assignment ? (
                        <span className="text-green-500">&#10003;</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {METHOD_TYPE_OPTIONS.find(m => m.value === control.method_type)?.label || control.method_type}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {control.is_active ? (
                        <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">활성</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded-full">비활성</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(control)}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(control.id)}
                          className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 등록/수정 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-[var(--surface-100)] rounded-xl shadow-2xl w-full max-w-2xl mx-4">
            <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center">
              <h2 className="text-xl font-bold text-[var(--foreground)]">
                {editingControl ? 'S/O Control 수정' : 'S/O Control 등록'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--foreground)]/60 hover:text-[var(--foreground)]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[var(--foreground)] mb-1">컨트롤 코드 *</label>
                  <input
                    type="text"
                    value={formData.control_code}
                    onChange={(e) => setFormData({ ...formData, control_code: e.target.value.toUpperCase() })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm"
                    disabled={!!editingControl}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--foreground)] mb-1">컨트롤 명 *</label>
                  <input
                    type="text"
                    value={formData.control_name}
                    onChange={(e) => setFormData({ ...formData, control_name: e.target.value })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[var(--foreground)] mb-1">고객 코드</label>
                  <input
                    type="text"
                    value={formData.customer_code}
                    onChange={(e) => setFormData({ ...formData, customer_code: e.target.value })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--foreground)] mb-1">오더 타입</label>
                  <select
                    value={formData.order_type_code}
                    onChange={(e) => setFormData({ ...formData, order_type_code: e.target.value })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm"
                  >
                    <option value="">선택</option>
                    {orderTypes.map(ot => (
                      <option key={ot.order_type_code} value={ot.order_type_code}>
                        {ot.order_type_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[var(--foreground)] mb-1">비즈니스 타입</label>
                  <select
                    value={formData.biz_type}
                    onChange={(e) => setFormData({ ...formData, biz_type: e.target.value })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm"
                  >
                    {BIZ_TYPE_OPTIONS.map(b => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[var(--foreground)] mb-1">처리 방법</label>
                  <select
                    value={formData.method_type}
                    onChange={(e) => setFormData({ ...formData, method_type: e.target.value })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm"
                  >
                    {METHOD_TYPE_OPTIONS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-[var(--foreground)] mb-1">실행 모듈</label>
                <select
                  value={formData.execution_module}
                  onChange={(e) => setFormData({ ...formData, execution_module: e.target.value })}
                  className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm"
                >
                  <option value="">선택</option>
                  {EXECUTION_MODULE_OPTIONS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.check_validation}
                      onChange={(e) => setFormData({ ...formData, check_validation: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Check Validation (유효성 검사)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.auto_release}
                      onChange={(e) => setFormData({ ...formData, auto_release: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Auto Release (자동 릴리즈)</span>
                  </label>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.auto_value_assignment}
                      onChange={(e) => setFormData({ ...formData, auto_value_assignment: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Auto Value Assignment (자동 값 할당)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">활성화</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 버튼 영역 */}
            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
              <button
                onClick={() => {
                  resetForm();
                  setIsModalOpen(false);
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-[#E8A838] text-[#0C1222] font-semibold rounded-lg hover:bg-[#D4943A] transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
    </PageLayout>
  );
}
