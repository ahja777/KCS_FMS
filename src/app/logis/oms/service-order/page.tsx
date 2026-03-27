'use client';

import { useState, useEffect, useCallback } from 'react';
import PageLayout from '@/components/PageLayout';

interface ServiceOrder {
  id: number;
  so_number: string;
  co_number: string;
  order_type_code: string;
  order_type_name?: string;
  biz_type: string;
  customer_code: string;
  customer_name: string;
  shipper_name: string;
  consignee_name: string;
  pol: string;
  pod: string;
  etd: string;
  eta: string;
  cargo_type: string;
  commodity: string;
  quantity: number;
  weight: number;
  volume: number;
  incoterms: string;
  execution_module: string;
  control_type: string;
  auto_release: boolean;
  status: string;
  remarks: string;
  created_at: string;
}

interface OrderType {
  id: number;
  order_type_code: string;
  order_type_name: string;
  biz_type: string;
}

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: '임시저장', color: 'bg-gray-500' },
  { value: 'PENDING', label: '대기', color: 'bg-yellow-500' },
  { value: 'RELEASED', label: '릴리즈', color: 'bg-blue-500' },
  { value: 'IN_PROGRESS', label: '진행중', color: 'bg-purple-500' },
  { value: 'COMPLETED', label: '완료', color: 'bg-emerald-500' },
  { value: 'CANCELLED', label: '취소', color: 'bg-red-500' },
];

const EXECUTION_MODULE_OPTIONS = [
  { value: 'FW', label: 'Forwarding (FW)' },
  { value: 'TM', label: 'Transport (TM)' },
  { value: 'WM', label: 'Warehouse (WM)' },
];

// 샘플 데이터
const sampleOrders: ServiceOrder[] = [
  { id: 1, so_number: 'SO20260125-0001', co_number: 'CO20260125-0001', order_type_code: 'EXP-FCL', order_type_name: 'Export FCL', biz_type: 'FORWARDING', customer_code: 'SAMSUNG', customer_name: '삼성전자', shipper_name: 'Samsung Electronics', consignee_name: 'Samsung America', pol: 'KRPUS', pod: 'USLAX', etd: '2026-01-28', eta: '2026-02-15', cargo_type: 'FCL', commodity: '전자제품', quantity: 100, weight: 25000, volume: 120, incoterms: 'FOB', execution_module: 'FW', control_type: 'STANDARD', auto_release: false, status: 'RELEASED', remarks: '', created_at: '2026-01-25' },
  { id: 2, so_number: 'SO20260125-0002', co_number: 'CO20260125-0002', order_type_code: 'IMP-LCL', order_type_name: 'Import LCL', biz_type: 'FORWARDING', customer_code: 'LG', customer_name: 'LG전자', shipper_name: 'LG Japan', consignee_name: 'LG Electronics Korea', pol: 'JPNGO', pod: 'KRPUS', etd: '2026-01-30', eta: '2026-02-05', cargo_type: 'LCL', commodity: '가전부품', quantity: 50, weight: 8000, volume: 45, incoterms: 'CIF', execution_module: 'FW', control_type: 'PRIORITY', auto_release: true, status: 'PENDING', remarks: '', created_at: '2026-01-25' },
  { id: 3, so_number: 'SO20260124-0001', co_number: 'CO20260124-0001', order_type_code: 'EXP-AIR', order_type_name: 'Export Air', biz_type: 'FORWARDING', customer_code: 'HYUNDAI', customer_name: '현대자동차', shipper_name: 'Hyundai Motor', consignee_name: 'Hyundai Europe', pol: 'ICN', pod: 'FRA', etd: '2026-01-26', eta: '2026-01-27', cargo_type: 'AIR', commodity: '자동차부품', quantity: 200, weight: 3500, volume: 25, incoterms: 'DAP', execution_module: 'FW', control_type: 'URGENT', auto_release: true, status: 'IN_PROGRESS', remarks: '긴급배송', created_at: '2026-01-24' },
  { id: 4, so_number: 'SO20260123-0001', co_number: 'CO20260123-0001', order_type_code: 'DOM-TRK', order_type_name: 'Domestic Truck', biz_type: 'DOMESTIC', customer_code: 'SK', customer_name: 'SK하이닉스', shipper_name: 'SK Hynix', consignee_name: 'SK Hynix 이천공장', pol: '서울', pod: '이천', etd: '2026-01-25', eta: '2026-01-25', cargo_type: 'BULK', commodity: '반도체장비', quantity: 10, weight: 15000, volume: 80, incoterms: 'EXW', execution_module: 'TM', control_type: 'STANDARD', auto_release: false, status: 'COMPLETED', remarks: '', created_at: '2026-01-23' },
  { id: 5, so_number: 'SO20260122-0001', co_number: 'CO20260122-0001', order_type_code: 'WH-IN', order_type_name: 'Warehouse Inbound', biz_type: 'WAREHOUSE', customer_code: 'POSCO', customer_name: '포스코', shipper_name: 'POSCO', consignee_name: '포스코 물류센터', pol: 'KRPUS', pod: '광양', etd: '2026-02-01', eta: '2026-02-03', cargo_type: 'FCL', commodity: '철강제품', quantity: 500, weight: 150000, volume: 600, incoterms: 'CFR', execution_module: 'WM', control_type: 'STANDARD', auto_release: false, status: 'DRAFT', remarks: '', created_at: '2026-01-22' },
];

export default function ServiceOrderPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [orderTypes, setOrderTypes] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // 검색 필터
  const [searchFilters, setSearchFilters] = useState({
    status: '',
    executionModule: '',
    fromDate: '',
    toDate: '',
  });

  // 폼 데이터
  const [formData, setFormData] = useState({
    co_number: '',
    order_type_code: '',
    biz_type: 'FORWARDING',
    customer_code: '',
    customer_name: '',
    shipper_name: '',
    consignee_name: '',
    pol: '',
    pod: '',
    etd: '',
    eta: '',
    cargo_type: '',
    commodity: '',
    quantity: 0,
    weight: 0,
    volume: 0,
    incoterms: '',
    execution_module: '',
    control_type: '',
    auto_release: false,
    status: 'DRAFT',
    remarks: '',
  });

  // 데이터 조회
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchFilters.status) params.append('status', searchFilters.status);
      if (searchFilters.executionModule) params.append('executionModule', searchFilters.executionModule);
      if (searchFilters.fromDate) params.append('fromDate', searchFilters.fromDate);
      if (searchFilters.toDate) params.append('toDate', searchFilters.toDate);

      const response = await fetch(`/api/oms/service-order?${params}`);
      const result = await response.json();
      if (result.success && result.data && result.data.length > 0) {
        setOrders(result.data);
      } else {
        // API 결과가 없으면 샘플 데이터 사용
        setOrders(sampleOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      // 에러 시 샘플 데이터 사용
      setOrders(sampleOrders);
    } finally {
      setLoading(false);
    }
  }, [searchFilters]);

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
    fetchOrders();
    fetchOrderTypes();
  }, [fetchOrders]);

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      co_number: '',
      order_type_code: '',
      biz_type: 'FORWARDING',
      customer_code: '',
      customer_name: '',
      shipper_name: '',
      consignee_name: '',
      pol: '',
      pod: '',
      etd: '',
      eta: '',
      cargo_type: '',
      commodity: '',
      quantity: 0,
      weight: 0,
      volume: 0,
      incoterms: '',
      execution_module: '',
      control_type: '',
      auto_release: false,
      status: 'DRAFT',
      remarks: '',
    });
    setEditingOrder(null);
  };

  // 저장
  const handleSave = async () => {
    try {
      const url = '/api/oms/service-order';
      const method = editingOrder ? 'PUT' : 'POST';
      const body = editingOrder ? { ...formData, id: editingOrder.id } : formData;

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
        fetchOrders();
      } else {
        alert('오류: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving order:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 삭제
  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/oms/service-order?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        alert(result.message);
        fetchOrders();
      } else {
        alert('오류: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting order:', error);
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
        await fetch(`/api/oms/service-order?id=${id}`, { method: 'DELETE' });
      }
      alert('삭제가 완료되었습니다.');
      setSelectedIds(new Set());
      fetchOrders();
    } catch (error) {
      console.error('Error bulk deleting:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 수정 모달 열기
  const handleEdit = (order: ServiceOrder) => {
    setEditingOrder(order);
    setFormData({
      co_number: order.co_number || '',
      order_type_code: order.order_type_code || '',
      biz_type: order.biz_type || 'FORWARDING',
      customer_code: order.customer_code || '',
      customer_name: order.customer_name || '',
      shipper_name: order.shipper_name || '',
      consignee_name: order.consignee_name || '',
      pol: order.pol || '',
      pod: order.pod || '',
      etd: order.etd ? order.etd.substring(0, 10) : '',
      eta: order.eta ? order.eta.substring(0, 10) : '',
      cargo_type: order.cargo_type || '',
      commodity: order.commodity || '',
      quantity: order.quantity || 0,
      weight: order.weight || 0,
      volume: order.volume || 0,
      incoterms: order.incoterms || '',
      execution_module: order.execution_module || '',
      control_type: order.control_type || '',
      auto_release: order.auto_release || false,
      status: order.status || 'DRAFT',
      remarks: order.remarks || '',
    });
    setIsModalOpen(true);
  };

  // 전체 선택
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(orders.map(o => o.id)));
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

  const getStatusBadge = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status);
    return (
      <span className={`px-2 py-1 rounded-full text-xs text-white ${statusOption?.color || 'bg-gray-500'}`}>
        {statusOption?.label || status}
      </span>
    );
  };

  const getModuleBadge = (module: string) => {
    const colors: Record<string, string> = {
      FW: 'bg-blue-600',
      TM: 'bg-green-600',
      WM: 'bg-purple-600',
    };
    return module ? (
      <span className={`px-2 py-1 rounded-full text-xs text-white ${colors[module] || 'bg-gray-500'}`}>
        {module}
      </span>
    ) : null;
  };

  return (
      <PageLayout title="서비스 오더 관리 (S/O)" subtitle="Logis > OMS > Service Order" showCloseButton={false}>
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
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">상태</label>
              <select
                value={searchFilters.status}
                onChange={(e) => setSearchFilters({ ...searchFilters, status: e.target.value })}
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
              >
                <option value="">전체</option>
                {STATUS_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">실행모듈</label>
              <select
                value={searchFilters.executionModule}
                onChange={(e) => setSearchFilters({ ...searchFilters, executionModule: e.target.value })}
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
              >
                <option value="">전체</option>
                {EXECUTION_MODULE_OPTIONS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">시작일</label>
              <input
                type="date"
                value={searchFilters.fromDate}
                onChange={(e) => setSearchFilters({ ...searchFilters, fromDate: e.target.value })}
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">종료일</label>
              <input
                type="date"
                value={searchFilters.toDate}
                onChange={(e) => setSearchFilters({ ...searchFilters, toDate: e.target.value })}
                className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm"
              />
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-[var(--border)] flex justify-center gap-2">
          <button onClick={fetchOrders} className="px-6 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] font-medium">조회</button>
          <button onClick={() => setSearchFilters({ status: '', executionModule: '', fromDate: '', toDate: '' })} className="px-6 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">초기화</button>
        </div>
      </div>

      {/* 버튼 영역 */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-[var(--foreground)]/60">
          총 {orders.length}건 / 선택 {selectedIds.size}건
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
                    checked={orders.length > 0 && selectedIds.size === orders.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded"
                  />
                </th>
                <th className="w-14">No</th>
                <th className="text-center">S/O No.</th>
                <th className="text-center">C/O No.</th>
                <th className="text-center">상태</th>
                <th className="text-center">실행모듈</th>
                <th className="text-center">오더타입</th>
                <th className="text-center">고객명</th>
                <th className="text-center">POL</th>
                <th className="text-center">POD</th>
                <th className="text-center">ETD</th>
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
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-[var(--foreground)]/60">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                orders.map((order, index) => (
                  <tr key={order.id} className="hover:bg-[var(--surface-200)]/50 transition-colors">
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(order.id)}
                        onChange={(e) => handleSelect(order.id, e.target.checked)}
                        className="rounded"
                      />
                    </td>
                    <td className="text-center text-[var(--muted)]">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#E8A838] text-center">{order.so_number}</td>
                    <td className="px-4 py-3 text-sm text-[var(--foreground)]/70 text-center">{order.co_number}</td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(order.status)}</td>
                    <td className="px-4 py-3 text-center">{getModuleBadge(order.execution_module)}</td>
                    <td className="px-4 py-3 text-sm text-center">{order.order_type_name || order.order_type_code}</td>
                    <td className="px-4 py-3 text-sm text-center">{order.customer_name}</td>
                    <td className="px-4 py-3 text-sm text-center">{order.pol}</td>
                    <td className="px-4 py-3 text-sm text-center">{order.pod}</td>
                    <td className="px-4 py-3 text-sm text-center">{order.etd?.substring(0, 10)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(order)}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(order.id)}
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
          <div className="relative bg-[var(--surface-100)] rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[var(--surface-100)] px-6 py-4 border-b border-[var(--border)] flex justify-between items-center">
              <h2 className="text-xl font-bold text-[var(--foreground)]">
                {editingOrder ? '서비스 오더 수정' : '서비스 오더 등록'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--foreground)]/60 hover:text-[var(--foreground)]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 기본 정보 */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">기본 정보</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-[var(--foreground)] mb-1">연결 C/O 번호</label>
                    <input
                      type="text"
                      value={formData.co_number}
                      onChange={(e) => setFormData({ ...formData, co_number: e.target.value })}
                      className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm"
                      placeholder="예: CO20250126-0001"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--foreground)] mb-1">오더 타입 *</label>
                    <select
                      value={formData.order_type_code}
                      onChange={(e) => setFormData({ ...formData, order_type_code: e.target.value })}
                      className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm"
                      required
                    >
                      <option value="">선택</option>
                      {orderTypes.map(ot => (
                        <option key={ot.order_type_code} value={ot.order_type_code}>
                          {ot.order_type_name} ({ot.biz_type})
                        </option>
                      ))}
                    </select>
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
                  <div>
                    <label className="block text-xs text-[var(--foreground)] mb-1">상태</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm"
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 고객 정보 */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">고객 정보</h3>
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
                    <label className="block text-xs text-[var(--foreground)] mb-1">고객명</label>
                    <input
                      type="text"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--foreground)] mb-1">송하인 (Shipper)</label>
                    <input
                      type="text"
                      value={formData.shipper_name}
                      onChange={(e) => setFormData({ ...formData, shipper_name: e.target.value })}
                      className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--foreground)] mb-1">수하인 (Consignee)</label>
                    <input
                      type="text"
                      value={formData.consignee_name}
                      onChange={(e) => setFormData({ ...formData, consignee_name: e.target.value })}
                      className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 운송 정보 */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">운송 정보</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-[var(--foreground)] mb-1">출발항 (POL)</label>
                    <input
                      type="text"
                      value={formData.pol}
                      onChange={(e) => setFormData({ ...formData, pol: e.target.value })}
                      className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--foreground)] mb-1">도착항 (POD)</label>
                    <input
                      type="text"
                      value={formData.pod}
                      onChange={(e) => setFormData({ ...formData, pod: e.target.value })}
                      className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--foreground)] mb-1">출항예정일 (ETD)</label>
                    <input
                      type="date"
                      value={formData.etd}
                      onChange={(e) => setFormData({ ...formData, etd: e.target.value })}
                      className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--foreground)] mb-1">도착예정일 (ETA)</label>
                    <input
                      type="date"
                      value={formData.eta}
                      onChange={(e) => setFormData({ ...formData, eta: e.target.value })}
                      className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 화물 정보 */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">화물 정보</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-[var(--foreground)] mb-1">화물 종류</label>
                    <select
                      value={formData.cargo_type}
                      onChange={(e) => setFormData({ ...formData, cargo_type: e.target.value })}
                      className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm"
                    >
                      <option value="">선택</option>
                      <option value="FCL">FCL</option>
                      <option value="LCL">LCL</option>
                      <option value="AIR">AIR</option>
                      <option value="BULK">BULK</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--foreground)] mb-1">인코텀즈</label>
                    <select
                      value={formData.incoterms}
                      onChange={(e) => setFormData({ ...formData, incoterms: e.target.value })}
                      className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm"
                    >
                      <option value="">선택</option>
                      <option value="FOB">FOB</option>
                      <option value="CIF">CIF</option>
                      <option value="CFR">CFR</option>
                      <option value="EXW">EXW</option>
                      <option value="DDP">DDP</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-[var(--foreground)] mb-1">품목</label>
                    <input
                      type="text"
                      value={formData.commodity}
                      onChange={(e) => setFormData({ ...formData, commodity: e.target.value })}
                      className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--foreground)] mb-1">수량</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                      className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--foreground)] mb-1">중량 (KG)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                      className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--foreground)] mb-1">용적 (CBM)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={formData.volume}
                      onChange={(e) => setFormData({ ...formData, volume: Number(e.target.value) })}
                      className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 컨트롤 설정 */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">컨트롤 설정</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-[var(--foreground)] mb-1">컨트롤 타입</label>
                    <input
                      type="text"
                      value={formData.control_type}
                      onChange={(e) => setFormData({ ...formData, control_type: e.target.value })}
                      className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm"
                    />
                  </div>
                  <div className="flex items-center pt-6">
                    <input
                      type="checkbox"
                      id="auto_release"
                      checked={formData.auto_release}
                      onChange={(e) => setFormData({ ...formData, auto_release: e.target.checked })}
                      className="rounded mr-2"
                    />
                    <label htmlFor="auto_release" className="text-sm text-[var(--foreground)]">
                      자동 릴리즈 (Auto Release)
                    </label>
                  </div>
                </div>
              </div>

              {/* 비고 */}
              <div>
                <label className="block text-xs text-[var(--foreground)] mb-1">비고</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm"
                  rows={3}
                />
              </div>
            </div>

            {/* 버튼 영역 */}
            <div className="sticky bottom-0 bg-[var(--surface-100)] px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
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
