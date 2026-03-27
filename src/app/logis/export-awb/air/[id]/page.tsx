'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import AWBPrintModal from '@/components/AWBPrintModal';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';

interface AWBData {
  id: number;
  mawb_no: string;
  airline_code: string;
  carrier_id: string;
  carrier_name?: string;
  flight_no: string;
  origin_airport_cd: string;
  dest_airport_cd: string;
  etd_dt: string;
  etd_time: string;
  eta_dt: string;
  eta_time: string;
  issue_dt: string;
  issue_place: string;
  shipper_nm: string;
  shipper_addr: string;
  consignee_nm: string;
  consignee_addr: string;
  notify_party: string;
  pieces: number;
  gross_weight_kg: number;
  charge_weight_kg: number;
  volume_cbm: number;
  commodity_desc: string;
  hs_code: string;
  dimensions: string;
  special_handling: string;
  declared_value: number;
  declared_currency: string;
  insurance_value: number;
  freight_charges: number;
  other_charges: number;
  weight_charge?: number;
  valuation_charge?: number;
  tax_amt?: number;
  total_other_agent?: number;
  total_other_carrier?: number;
  rate_class?: string;
  rate?: number;
  agent_code?: string;
  agent_name?: string;
  payment_terms: string;
  remarks: string;
  status: string;
}

export default function ExportAWBDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<AWBData | null>(null);

  const printMawbId = formData?.id ? Number(formData.id) : undefined;

  useEffect(() => {
    fetchAWBDetail();
  }, [id]);

  const fetchAWBDetail = async () => {
    try {
      const response = await fetch(`/api/awb/mawb?id=${id}`);
      const result = await response.json();
      if (result.success && result.data.length > 0) {
        const data = result.data[0];
        setFormData({
          ...data,
          etd_dt: data.etd_dt ? data.etd_dt.split('T')[0] : '',
          eta_dt: data.eta_dt ? data.eta_dt.split('T')[0] : '',
          issue_dt: data.issue_dt ? data.issue_dt.split('T')[0] : '',
        });
      }
    } catch (error) {
      console.error('Error fetching AWB:', error);
      alert('AWB 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmClose = () => {
    setShowCloseModal(false);
    router.push('/logis/export-awb/air');
  };

  useCloseConfirm({
    showModal: showCloseModal,
    setShowModal: setShowCloseModal,
    onConfirmClose: handleConfirmClose,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSave = async () => {
    if (!formData) return;

    setSaving(true);
    try {
      const response = await fetch('/api/awb/mawb', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          pieces: formData.pieces ? parseInt(String(formData.pieces)) : null,
          gross_weight_kg: formData.gross_weight_kg ? parseFloat(String(formData.gross_weight_kg)) : null,
          charge_weight_kg: formData.charge_weight_kg ? parseFloat(String(formData.charge_weight_kg)) : null,
          volume_cbm: formData.volume_cbm ? parseFloat(String(formData.volume_cbm)) : null,
          declared_value: formData.declared_value ? parseFloat(String(formData.declared_value)) : null,
          insurance_value: formData.insurance_value ? parseFloat(String(formData.insurance_value)) : null,
          freight_charges: formData.freight_charges ? parseFloat(String(formData.freight_charges)) : null,
          other_charges: formData.other_charges ? parseFloat(String(formData.other_charges)) : null,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert('AWB가 수정되었습니다.');
        setIsEditing(false);
      } else {
        alert('오류: ' + (result.error || '수정 실패'));
      }
    } catch (error) {
      console.error('Error saving AWB:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/awb/mawb?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        alert('AWB가 삭제되었습니다.');
        router.push('/logis/export-awb/air');
      } else {
        alert('오류: ' + (result.error || '삭제 실패'));
      }
    } catch (error) {
      console.error('Error deleting AWB:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleCancel = () => {
    if (isEditing) {
      setIsEditing(false);
      fetchAWBDetail();
    } else {
      setShowCloseModal(true);
    }
  };

  if (loading) {
    return (
          <PageLayout title="AWB 상세 (항공수출)" subtitle="Logis > 항공수출 > AWB 관리 > 상세" onClose={() => setShowCloseModal(true)}>
          <main className="p-6 flex items-center justify-center">
            <div className="text-[var(--muted)]">로딩 중...</div>
          </main>
      </PageLayout>
  );
}

  if (!formData) {
    return (
          <PageLayout title="AWB 상세 (항공수출)" subtitle="Logis > 항공수출 > AWB 관리 > 상세" onClose={() => setShowCloseModal(true)}>
          <main className="p-6 flex items-center justify-center">
            <div className="text-red-500">AWB 정보를 찾을 수 없습니다.</div>
          </main>
      </PageLayout>
    );
  }

  const inputClass = isEditing
    ? "w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
    : "w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg cursor-not-allowed";

  return (
        <PageLayout title="AWB 상세 (항공수출)" subtitle="Logis > 항공수출 > AWB 관리 > 상세" >
        <main ref={formRef} className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-500/20 text-blue-400">
                MAWB No: {formData.mawb_no}
              </span>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                formData.status === 'DEPARTED' ? 'bg-green-500/20 text-green-400' :
                formData.status === 'ARRIVED' ? 'bg-purple-500/20 text-purple-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {formData.status}
              </span>
            </div>
          </div>

          {/* 항공편 정보 */}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-[var(--foreground)]">항공편 정보</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">항공사 코드</label>
                <input
                  type="text"
                  name="airline_code"
                  value={formData.airline_code || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">편명</label>
                <input
                  type="text"
                  name="flight_no"
                  value={formData.flight_no || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">출발공항</label>
                <input
                  type="text"
                  name="origin_airport_cd"
                  value={formData.origin_airport_cd || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">도착공항</label>
                <input
                  type="text"
                  name="dest_airport_cd"
                  value={formData.dest_airport_cd || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ETD 일자</label>
                <input
                  type="date"
                  name="etd_dt"
                  value={formData.etd_dt || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ETD 시간</label>
                <input
                  type="time"
                  name="etd_time"
                  value={formData.etd_time || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ETA 일자</label>
                <input
                  type="date"
                  name="eta_dt"
                  value={formData.eta_dt || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ETA 시간</label>
                <input
                  type="time"
                  name="eta_time"
                  value={formData.eta_time || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* 거래처 정보 */}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-[var(--foreground)]">거래처 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">송하인 (Shipper)</label>
                <input
                  type="text"
                  name="shipper_nm"
                  value={formData.shipper_nm || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">수하인 (Consignee)</label>
                <input
                  type="text"
                  name="consignee_nm"
                  value={formData.consignee_nm || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">송하인 주소</label>
                <textarea
                  name="shipper_addr"
                  value={formData.shipper_addr || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">수하인 주소</label>
                <textarea
                  name="consignee_addr"
                  value={formData.consignee_addr || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                  rows={2}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">통지처 (Notify Party)</label>
                <input
                  type="text"
                  name="notify_party"
                  value={formData.notify_party || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* 화물 정보 */}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-[var(--foreground)]">화물 정보</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">개수 (PCS)</label>
                <input
                  type="number"
                  name="pieces"
                  value={formData.pieces || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">총중량 (KG)</label>
                <input
                  type="number"
                  step="0.001"
                  name="gross_weight_kg"
                  value={formData.gross_weight_kg || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">청구중량 (KG)</label>
                <input
                  type="number"
                  step="0.001"
                  name="charge_weight_kg"
                  value={formData.charge_weight_kg || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">용적 (CBM)</label>
                <input
                  type="number"
                  step="0.001"
                  name="volume_cbm"
                  value={formData.volume_cbm || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">품명</label>
                <input
                  type="text"
                  name="commodity_desc"
                  value={formData.commodity_desc || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">HS Code</label>
                <input
                  type="text"
                  name="hs_code"
                  value={formData.hs_code || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">치수</label>
                <input
                  type="text"
                  name="dimensions"
                  value={formData.dimensions || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">특수취급</label>
                <input
                  type="text"
                  name="special_handling"
                  value={formData.special_handling || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* 운임 정보 */}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-[var(--foreground)]">운임 정보</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">결제조건</label>
                <select
                  name="payment_terms"
                  value={formData.payment_terms || 'PREPAID'}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                >
                  <option value="PREPAID">PREPAID (선불)</option>
                  <option value="COLLECT">COLLECT (착불)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">신고가액</label>
                <input
                  type="number"
                  step="0.01"
                  name="declared_value"
                  value={formData.declared_value || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">통화</label>
                <select
                  name="declared_currency"
                  value={formData.declared_currency || 'USD'}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                >
                  <option value="USD">USD</option>
                  <option value="KRW">KRW</option>
                  <option value="EUR">EUR</option>
                  <option value="JPY">JPY</option>
                  <option value="CNY">CNY</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">보험가액</label>
                <input
                  type="number"
                  step="0.01"
                  name="insurance_value"
                  value={formData.insurance_value || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">운임</label>
                <input
                  type="number"
                  step="0.01"
                  name="freight_charges"
                  value={formData.freight_charges || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">기타비용</label>
                <input
                  type="number"
                  step="0.01"
                  name="other_charges"
                  value={formData.other_charges || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* 비고 */}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-[var(--foreground)]">비고</h3>
            <textarea
              name="remarks"
              value={formData.remarks || ''}
              onChange={handleChange}
              disabled={!isEditing}
              className={inputClass}
              rows={3}
            />
          </div>

          {/* 버튼 영역 */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleCancel}
              className="px-6 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]"
            >
              {isEditing ? '취소' : '닫기'}
            </button>
            {isEditing ? (
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 font-semibold rounded-lg disabled:opacity-50 bg-[var(--surface-100)] text-[var(--foreground)] hover:bg-[var(--surface-200)]"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowPrintModal(true)}
                  className="px-6 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)] flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  AWB 출력
                </button>
                <button
                  onClick={handleDelete}
                  className="px-6 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]"
                >
                  삭제
                </button>
                <button
                  onClick={() => router.push(`/logis/export-awb/air/register?id=${id}`)}
                  className="px-6 py-2 font-semibold rounded-lg bg-[var(--surface-100)] text-[var(--foreground)] hover:bg-[var(--surface-200)]"
                >
                  수정
                </button>
              </>
            )}
          </div>
        </main>
      <CloseConfirmModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onConfirm={handleConfirmClose}
      />

      <AWBPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        awbData={null}
        mawbId={printMawbId}
      />
    </PageLayout>
  );
}
