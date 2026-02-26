'use client';

import { useState, useEffect, useCallback } from 'react';
import PageLayout from '@/components/PageLayout';

interface OrderType {
  id: number;
  order_type_code: string;
  order_type_name: string;
  biz_type: string;
  description: string;
  related_system: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const BIZ_TYPE_OPTIONS = [
  { value: 'DOMESTIC', label: 'Domestic (내수)', color: 'bg-blue-500' },
  { value: 'WAREHOUSE', label: 'Warehouse (창고)', color: 'bg-purple-500' },
  { value: 'IMPORT', label: 'Import (수입)', color: 'bg-green-500' },
  { value: 'EXPORT', label: 'Export (수출)', color: 'bg-orange-500' },
];

const SYSTEM_OPTIONS = ['FIS', 'TMS', 'WMS'];

// 샘플 데이터
const sampleOrderTypes: OrderType[] = [
  { id: 1, order_type_code: 'EXP-FCL', order_type_name: 'Export FCL', biz_type: 'EXPORT', description: '수출 컨테이너 화물 (FCL)', related_system: 'FIS', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 2, order_type_code: 'EXP-LCL', order_type_name: 'Export LCL', biz_type: 'EXPORT', description: '수출 소량 화물 (LCL)', related_system: 'FIS', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 3, order_type_code: 'EXP-AIR', order_type_name: 'Export Air', biz_type: 'EXPORT', description: '수출 항공 화물', related_system: 'FIS', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 4, order_type_code: 'IMP-FCL', order_type_name: 'Import FCL', biz_type: 'IMPORT', description: '수입 컨테이너 화물 (FCL)', related_system: 'FIS', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 5, order_type_code: 'IMP-LCL', order_type_name: 'Import LCL', biz_type: 'IMPORT', description: '수입 소량 화물 (LCL)', related_system: 'FIS', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 6, order_type_code: 'DOM-TRK', order_type_name: 'Domestic Truck', biz_type: 'DOMESTIC', description: '내수 트럭 운송', related_system: 'TMS', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 7, order_type_code: 'WH-IN', order_type_name: 'Warehouse Inbound', biz_type: 'WAREHOUSE', description: '창고 입고', related_system: 'WMS', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 8, order_type_code: 'WH-OUT', order_type_name: 'Warehouse Outbound', biz_type: 'WAREHOUSE', description: '창고 출고', related_system: 'WMS', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
];

export default function OrderTypePage() {
  const [orderTypes, setOrderTypes] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<OrderType | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // 검색 필터
  const [searchFilters, setSearchFilters] = useState({
    bizType: '',
    isActive: '',
  });

  // 폼 데이터
  const [formData, setFormData] = useState({
    order_type_code: '',
    order_type_name: '',
    biz_type: 'EXPORT',
    description: '',
    related_system: '',
    is_active: true,
  });

  // 데이터 조회
  const fetchOrderTypes = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchFilters.bizType) params.append('bizType', searchFilters.bizType);
      if (searchFilters.isActive) params.append('isActive', searchFilters.isActive);

      const response = await fetch(`/api/oms/order-type?${params}`);
      const result = await response.json();
      if (result.success && result.data && result.data.length > 0) {
        setOrderTypes(result.data);
      } else {
        // API 결과가 없으면 샘플 데이터 사용
        setOrderTypes(sampleOrderTypes);
      }
    } catch (error) {
      console.error('Error fetching order types:', error);
      // 에러 시 샘플 데이터 사용
      setOrderTypes(sampleOrderTypes);
    } finally {
      setLoading(false);
    }
  }, [searchFilters]);

  // DB 테이블 셋업
  const setupDatabase = async () => {
    try {
      await fetch('/api/oms/setup', { method: 'POST' });
    } catch (error) {
      console.error('Error setting up database:', error);
    }
  };

  useEffect(() => {
    setupDatabase().then(() => fetchOrderTypes());
  }, [fetchOrderTypes]);

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      order_type_code: '',
      order_type_name: '',
      biz_type: 'EXPORT',
      description: '',
      related_system: '',
      is_active: true,
    });
    setEditingType(null);
  };

  // 저장
  const handleSave = async () => {
    if (!formData.order_type_code || !formData.order_type_name) {
      alert('오더타입 코드와 이름은 필수입니다.');
      return;
    }

    try {
      const url = '/api/oms/order-type';
      const method = editingType ? 'PUT' : 'POST';
      const body = editingType ? { ...formData, id: editingType.id } : formData;

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
        fetchOrderTypes();
      } else {
        alert('오류: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving order type:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 삭제
  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/oms/order-type?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        alert(result.message);
        fetchOrderTypes();
      } else {
        alert('오류: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting order type:', error);
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
        await fetch(`/api/oms/order-type?id=${id}`, { method: 'DELETE' });
      }
      alert('삭제가 완료되었습니다.');
      setSelectedIds(new Set());
      fetchOrderTypes();
    } catch (error) {
      console.error('Error bulk deleting:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 수정 모달 열기
  const handleEdit = (type: OrderType) => {
    setEditingType(type);
    setFormData({
      order_type_code: type.order_type_code || '',
      order_type_name: type.order_type_name || '',
      biz_type: type.biz_type || 'EXPORT',
      description: type.description || '',
      related_system: type.related_system || '',
      is_active: type.is_active !== false,
    });
    setIsModalOpen(true);
  };

  // 전체 선택
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(orderTypes.map(t => t.id)));
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

  const getBizTypeBadge = (bizType: string) => {
    const option = BIZ_TYPE_OPTIONS.find(b => b.value === bizType);
    return (
      <span className={`px-2 py-1 rounded-full text-xs text-white ${option?.color || 'bg-gray-500'}`}>
        {option?.label || bizType}
      </span>
    );
  };

  // 연계 시스템 체크박스 핸들러
  const handleSystemChange = (system: string, checked: boolean) => {
    const systems = formData.related_system ? formData.related_system.split(',') : [];
    if (checked) {
      if (!systems.includes(system)) {
        systems.push(system);
      }
    } else {
      const index = systems.indexOf(system);
      if (index > -1) {
        systems.splice(index, 1);
      }
    }
    setFormData({ ...formData, related_system: systems.join(',') });
  };

  return (
      <PageLayout title="오더 타입 관리" subtitle="Logis > OMS > Order Type" showCloseButton={false}>
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

      {/* 검색조건 */}
      <div className="card mb-6">
        <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="font-bold">검색조건</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">비즈니스 타입</label>
              <select
                value={searchFilters.bizType}
                onChange={(e) => setSearchFilters({ ...searchFilters, bizType: e.target.value })}
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
              >
                <option value="">전체</option>
                {BIZ_TYPE_OPTIONS.map(b => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">활성 상태</label>
              <select
                value={searchFilters.isActive}
                onChange={(e) => setSearchFilters({ ...searchFilters, isActive: e.target.value })}
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
              >
                <option value="">전체</option>
                <option value="true">활성</option>
                <option value="false">비활성</option>
              </select>
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-[var(--border)] flex justify-center gap-2">
          <button onClick={fetchOrderTypes} className="px-6 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] font-medium">조회</button>
          <button onClick={() => setSearchFilters({ bizType: '', isActive: '' })} className="px-6 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">초기화</button>
        </div>
      </div>

      {/* 버튼 영역 */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-[var(--foreground)]/60">
          총 {orderTypes.length}건 / 선택 {selectedIds.size}건
        </span>
        <button
          onClick={handleBulkDelete}
          disabled={selectedIds.size === 0}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          선택 삭제
        </button>
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
                    checked={orderTypes.length > 0 && selectedIds.size === orderTypes.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded"
                  />
                </th>
                <th className="w-14">No</th>
                <th className="text-center">타입 코드</th>
                <th className="text-center">타입 명</th>
                <th className="text-center">비즈니스 타입</th>
                <th className="text-center">설명</th>
                <th className="text-center">연계 시스템</th>
                <th className="text-center">활성</th>
                <th className="text-center">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-[var(--foreground)]/60">
                    로딩 중...
                  </td>
                </tr>
              ) : orderTypes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-[var(--foreground)]/60">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                orderTypes.map((type, index) => (
                  <tr key={type.id} className="hover:bg-[var(--surface-200)]/50 transition-colors">
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(type.id)}
                        onChange={(e) => handleSelect(type.id, e.target.checked)}
                        className="rounded"
                      />
                    </td>
                    <td className="text-center text-[var(--muted)]">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#E8A838] text-center">{type.order_type_code}</td>
                    <td className="px-4 py-3 text-sm text-center">{type.order_type_name}</td>
                    <td className="px-4 py-3 text-center">{getBizTypeBadge(type.biz_type)}</td>
                    <td className="px-4 py-3 text-sm text-[var(--foreground)]/70 text-center">{type.description}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      {type.related_system?.split(',').map(sys => (
                        <span key={sys} className="inline-block px-2 py-0.5 bg-gray-600 text-white text-xs rounded mr-1">
                          {sys}
                        </span>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {type.is_active ? (
                        <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">활성</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded-full">비활성</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(type)}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(type.id)}
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
                {editingType ? '오더 타입 수정' : '오더 타입 등록'}
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
                  <label className="block text-xs text-[var(--foreground)] mb-1">타입 코드 *</label>
                  <input
                    type="text"
                    value={formData.order_type_code}
                    onChange={(e) => setFormData({ ...formData, order_type_code: e.target.value.toUpperCase() })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm"
                    placeholder="예: EXP-FCL"
                    disabled={!!editingType}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--foreground)] mb-1">타입 명 *</label>
                  <input
                    type="text"
                    value={formData.order_type_name}
                    onChange={(e) => setFormData({ ...formData, order_type_name: e.target.value })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm"
                    placeholder="예: Export FCL"
                  />
                </div>
              </div>

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
                <label className="block text-xs text-[var(--foreground)] mb-1">설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-xs text-[var(--foreground)] mb-2">연계 시스템</label>
                <div className="flex gap-4">
                  {SYSTEM_OPTIONS.map(sys => (
                    <label key={sys} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.related_system?.includes(sys) || false}
                        onChange={(e) => handleSystemChange(sys, e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">{sys}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="is_active" className="text-sm text-[var(--foreground)]">활성화</label>
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
