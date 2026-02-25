'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import ExchangeRateModal from '@/components/ExchangeRateModal';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { DimensionsCalculatorModal } from '@/components/popup';
import { formatCurrency } from '@/utils/format';
import AirlineCodeModal, { type AirlineItem } from '@/components/popup/AirlineCodeModal';
import LocationCodeModal, { type LocationItem } from '@/components/popup/LocationCodeModal';
import CodeSearchModal, { type CodeType, type CodeItem } from '@/components/popup/CodeSearchModal';
import SearchIconButton from '@/components/SearchIconButton';

function ExportAWBRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showExchangeRateModal, setShowExchangeRateModal] = useState(false);
  const [showDimensionsModal, setShowDimensionsModal] = useState(false);
  const [showAirlineModal, setShowAirlineModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationField, setLocationField] = useState<string>('');
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [isNewMode, setIsNewMode] = useState(!editId);
  const [formData, setFormData] = useState({
    awb_type: 'MAWB',
    mawb_no: '',
    airline_code: '',
    carrier_id: '',
    flight_no: '',
    origin_airport_cd: 'ICN',
    origin_airport_nm: '',
    dest_airport_cd: '',
    dest_airport_nm: '',
    etd_dt: '',
    etd_time: '',
    eta_dt: '',
    eta_time: '',
    atd_dt: '',
    atd_time: '',
    ata_dt: '',
    ata_time: '',
    issue_dt: new Date().toISOString().split('T')[0],
    issue_place: 'SEOUL',
    shipper_nm: '',
    shipper_addr: '',
    consignee_nm: '',
    consignee_addr: '',
    notify_party: '',
    pieces: '',
    gross_weight_kg: '',
    charge_weight_kg: '',
    volume_cbm: '',
    commodity_desc: '',
    hs_code: '',
    dimensions: '',
    special_handling: '',
    declared_value: '',
    declared_currency: 'USD',
    insurance_value: '',
    freight_charges: '',
    other_charges: '',
    payment_terms: 'PREPAID',
    remarks: '',
  });

  // 수정 모드: 기존 데이터 로드
  useEffect(() => {
    if (!editId) return;
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/awb/mawb?id=${editId}`);
        const result = await response.json();
        if (result.success && result.data.length > 0) {
          const data = result.data[0];
          setFormData(prev => ({
            ...prev,
            awb_type: 'MAWB',
            airline_code: data.airline_code || '',
            carrier_id: data.carrier_id || '',
            flight_no: data.flight_no || '',
            origin_airport_cd: data.origin_airport_cd || 'ICN',
            dest_airport_cd: data.dest_airport_cd || '',
            etd_dt: data.etd_dt ? data.etd_dt.split('T')[0] : '',
            etd_time: data.etd_time || '',
            eta_dt: data.eta_dt ? data.eta_dt.split('T')[0] : '',
            eta_time: data.eta_time || '',
            atd_dt: data.atd_dt ? data.atd_dt.split('T')[0] : '',
            atd_time: data.atd_time || '',
            ata_dt: data.ata_dt ? data.ata_dt.split('T')[0] : '',
            ata_time: data.ata_time || '',
            issue_dt: data.issue_dt ? data.issue_dt.split('T')[0] : '',
            issue_place: data.issue_place || '',
            shipper_nm: data.shipper_nm || '',
            shipper_addr: data.shipper_addr || '',
            consignee_nm: data.consignee_nm || '',
            consignee_addr: data.consignee_addr || '',
            notify_party: data.notify_party || '',
            pieces: data.pieces ? String(data.pieces) : '',
            gross_weight_kg: data.gross_weight_kg ? String(data.gross_weight_kg) : '',
            charge_weight_kg: data.charge_weight_kg ? String(data.charge_weight_kg) : '',
            volume_cbm: data.volume_cbm ? String(data.volume_cbm) : '',
            commodity_desc: data.commodity_desc || '',
            hs_code: data.hs_code || '',
            dimensions: data.dimensions || '',
            special_handling: data.special_handling || '',
            declared_value: data.declared_value ? String(data.declared_value) : '',
            declared_currency: data.declared_currency || 'USD',
            insurance_value: data.insurance_value ? String(data.insurance_value) : '',
            freight_charges: data.freight_charges ? String(data.freight_charges) : '',
            other_charges: data.other_charges ? String(data.other_charges) : '',
            payment_terms: data.payment_terms || 'PREPAID',
            remarks: data.remarks || '',
          }));
          setIsNewMode(false);
        }
      } catch (error) {
        console.error('Failed to load edit data:', error);
      }
    };
    fetchData();
  }, [editId]);

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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.origin_airport_cd || !formData.dest_airport_cd) {
      alert('출발공항과 도착공항은 필수입니다.');
      return;
    }

    setSaving(true);
    try {
      const apiUrl = formData.awb_type === 'MAWB' ? '/api/awb/mawb' : '/api/awb/hawb';
      const payload = {
        import_type: 'EXPORT',
        airline_code: formData.airline_code,
        flight_no: formData.flight_no,
        origin_airport_cd: formData.origin_airport_cd,
        dest_airport_cd: formData.dest_airport_cd,
        etd_dt: formData.etd_dt || null,
        etd_time: formData.etd_time || null,
        eta_dt: formData.eta_dt || null,
        eta_time: formData.eta_time || null,
        atd_dt: formData.atd_dt || null,
        atd_time: formData.atd_time || null,
        ata_dt: formData.ata_dt || null,
        ata_time: formData.ata_time || null,
        issue_dt: formData.issue_dt || null,
        issue_place: formData.issue_place || null,
        shipper_nm: formData.shipper_nm,
        shipper_addr: formData.shipper_addr,
        consignee_nm: formData.consignee_nm,
        consignee_addr: formData.consignee_addr,
        notify_party: formData.notify_party,
        pieces: formData.pieces ? parseInt(formData.pieces) : null,
        gross_weight_kg: formData.gross_weight_kg ? parseFloat(formData.gross_weight_kg) : null,
        charge_weight_kg: formData.charge_weight_kg ? parseFloat(formData.charge_weight_kg) : null,
        volume_cbm: formData.volume_cbm ? parseFloat(formData.volume_cbm) : null,
        commodity_desc: formData.commodity_desc,
        hs_code: formData.hs_code,
        dimensions: formData.dimensions,
        special_handling: formData.special_handling,
        declared_value: formData.declared_value ? parseFloat(formData.declared_value) : null,
        declared_currency: formData.declared_currency,
        insurance_value: formData.insurance_value ? parseFloat(formData.insurance_value) : null,
        freight_charges: formData.freight_charges ? parseFloat(formData.freight_charges) : null,
        other_charges: formData.other_charges ? parseFloat(formData.other_charges) : null,
        payment_terms: formData.payment_terms,
        remarks: formData.remarks,
        ...(formData.awb_type === 'HAWB' && { mawb_no: formData.mawb_no }),
      };

      const response = await fetch(apiUrl, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editId ? { ...payload, id: Number(editId) } : payload),
      });

      const result = await response.json();
      if (result.success) {
        if (editId) {
          alert('AWB가 수정되었습니다.');
        } else {
          const awbNo = formData.awb_type === 'MAWB' ? result.mawb_no : result.hawb_no;
          alert(`AWB가 등록되었습니다.\nAWB No: ${awbNo}`);
          const newId = formData.awb_type === 'MAWB' ? result.mawb_id : result.hawb_id;
          if (newId) router.replace(`/logis/export-awb/air/register?id=${newId}`);
        }
        setIsNewMode(false);
      } else {
        alert('오류: ' + (result.error || '저장 실패'));
      }
    } catch (error) {
      console.error('Error saving AWB:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleNew = () => {
    if (editId) { router.push('/logis/export-awb/air/register'); return; }
    setFormData({
      awb_type: 'MAWB', mawb_no: '', airline_code: '', carrier_id: '', flight_no: '',
      origin_airport_cd: 'ICN', origin_airport_nm: '', dest_airport_cd: '', dest_airport_nm: '', etd_dt: '', etd_time: '', eta_dt: '', eta_time: '',
      atd_dt: '', atd_time: '', ata_dt: '', ata_time: '',
      issue_dt: new Date().toISOString().split('T')[0], issue_place: 'SEOUL',
      shipper_nm: '', shipper_addr: '', consignee_nm: '', consignee_addr: '', notify_party: '',
      pieces: '', gross_weight_kg: '', charge_weight_kg: '', volume_cbm: '',
      commodity_desc: '', hs_code: '', dimensions: '', special_handling: '',
      declared_value: '', declared_currency: 'USD', insurance_value: '',
      freight_charges: '', other_charges: '', payment_terms: 'PREPAID', remarks: '',
    });
    setIsNewMode(true);
  };

  const handleCancel = () => {
    setShowCloseModal(true);
  };

  const handleAirlineSelect = (item: AirlineItem) => {
    setFormData(prev => ({ ...prev, airline_code: item.code }));
    setShowAirlineModal(false);
  };

  const handleLocationSelect = (item: LocationItem) => {
    if (locationField === 'origin') {
      setFormData(prev => ({ ...prev, origin_airport_cd: item.code, origin_airport_nm: item.nameEn || item.nameKr || '' }));
    } else if (locationField === 'destination') {
      setFormData(prev => ({ ...prev, dest_airport_cd: item.code, dest_airport_nm: item.nameEn || item.nameKr || '' }));
    }
    setShowLocationModal(false);
  };

  const handleExchangeRateSelect = (rate: { currencyCode: string; dealBasR: number }) => {
    const currencyCode = rate.currencyCode.replace('(100)', '');
    setFormData(prev => ({ ...prev, declared_currency: currencyCode }));
    setExchangeRate(rate.dealBasR);
  };

  const handleFillTestData = () => {
    setFormData({
      awb_type: 'MAWB',
      mawb_no: '',
      airline_code: 'KE',
      carrier_id: '',
      flight_no: 'KE001',
      origin_airport_cd: 'ICN',
      dest_airport_cd: 'LAX',
      etd_dt: '2026-01-25',
      etd_time: '10:00',
      eta_dt: '2026-01-25',
      eta_time: '08:30',
      atd_dt: '',
      atd_time: '',
      ata_dt: '',
      ata_time: '',
      issue_dt: new Date().toISOString().split('T')[0],
      issue_place: 'SEOUL',
      shipper_nm: '삼성전자 주식회사',
      shipper_addr: '경기도 수원시 영통구 삼성로 129',
      consignee_nm: '삼성아메리카',
      consignee_addr: '85 Challenger Road, Ridgefield Park, NJ 07660',
      notify_party: 'SAME AS CONSIGNEE',
      pieces: '100',
      gross_weight_kg: '5000',
      charge_weight_kg: '5500',
      volume_cbm: '35.5',
      commodity_desc: 'ELECTRONIC COMPONENTS',
      hs_code: '8528.72',
      dimensions: '120x80x100 CM',
      special_handling: '',
      declared_value: '150000',
      declared_currency: 'USD',
      insurance_value: '155000',
      freight_charges: '5500',
      other_charges: '850',
      payment_terms: 'PREPAID',
      remarks: '파손주의 (FRAGILE)',
    });
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header title={editId ? "AWB 수정 (항공수출)" : "AWB 등록 (항공수출)"} subtitle={`Logis > 항공수출 > AWB 관리 > ${editId ? '수정' : '신규 등록'}`} onClose={() => setShowCloseModal(true)} />
      <main ref={formRef} className="p-6">
          {/* 상단 버튼 영역 */}
          <div className="sticky top-0 z-20 bg-white py-2 -mx-6 px-6 border-b border-gray-200 flex justify-between items-center mb-6">
            <div className="text-sm text-[var(--muted)]">
              <span className="text-red-500">*</span> 필수 입력 항목
            </div>
            <div className="flex gap-2">
              <button onClick={handleNew} disabled={isNewMode} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed">신규</button>
              <button onClick={handleCancel} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">취소</button>
              <button onClick={handleSave} disabled={saving} className="px-6 py-2 font-semibold rounded-lg disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #E8A838 0%, #D4943A 100%)', color: '#0C1222' }}>{saving ? '저장 중...' : '저장'}</button>
            </div>
          </div>

          {/* AWB 타입 선택 */}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-[var(--foreground)]">AWB 타입</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">AWB 타입 *</label>
                <select
                  name="awb_type"
                  value={formData.awb_type}
                  onChange={handleChange}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                >
                  <option value="MAWB">MAWB (Master)</option>
                  <option value="HAWB">HAWB (House)</option>
                </select>
              </div>
              {formData.awb_type === 'HAWB' && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">MAWB 번호</label>
                  <input
                    type="text"
                    name="mawb_no"
                    value={formData.mawb_no}
                    onChange={handleChange}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    placeholder="180-12345678"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">발행일자</label>
                <input
                  type="date"
                  name="issue_dt"
                  value={formData.issue_dt}
                  onChange={handleChange}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">발행지</label>
                <input
                  type="text"
                  name="issue_place"
                  value={formData.issue_place}
                  onChange={handleChange}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="SEOUL"
                />
              </div>
            </div>
          </div>

          {/* 항공편 정보 */}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-[var(--foreground)]">항공편 정보</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">항공사 코드</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input
                    type="text"
                    name="airline_code"
                    value={formData.airline_code}
                    onChange={handleChange}
                    className="h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                    style={{ flex: 1, minWidth: 0 }}
                    placeholder="180"
                  />
                  <SearchIconButton onClick={() => setShowAirlineModal(true)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">편명</label>
                <input
                  type="text"
                  name="flight_no"
                  value={formData.flight_no}
                  onChange={handleChange}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="KE001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">출발공항 *</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    name="origin_airport_cd"
                    value={formData.origin_airport_cd}
                    onChange={handleChange}
                    className="w-[80px] h-[38px] px-2 bg-white border border-gray-300 rounded text-sm"
                    placeholder="코드"
                  />
                  <SearchIconButton onClick={() => { setLocationField('origin'); setShowLocationModal(true); }} />
                  <input
                    type="text"
                    value={formData.origin_airport_nm}
                    readOnly
                    className="flex-1 h-[38px] px-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-500"
                    placeholder="이름"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">도착공항 *</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    name="dest_airport_cd"
                    value={formData.dest_airport_cd}
                    onChange={handleChange}
                    className="w-[80px] h-[38px] px-2 bg-white border border-gray-300 rounded text-sm"
                    placeholder="코드"
                  />
                  <SearchIconButton onClick={() => { setLocationField('destination'); setShowLocationModal(true); }} />
                  <input
                    type="text"
                    value={formData.dest_airport_nm}
                    readOnly
                    className="flex-1 h-[38px] px-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-500"
                    placeholder="이름"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ETD 일자</label>
                <input
                  type="date"
                  name="etd_dt"
                  value={formData.etd_dt}
                  onChange={handleChange}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ETD 시간</label>
                <input
                  type="time"
                  name="etd_time"
                  value={formData.etd_time}
                  onChange={handleChange}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ETA 일자</label>
                <input
                  type="date"
                  name="eta_dt"
                  value={formData.eta_dt}
                  onChange={handleChange}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ETA 시간</label>
                <input
                  type="time"
                  name="eta_time"
                  value={formData.eta_time}
                  onChange={handleChange}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ATD 일자 (실제출발)</label>
                <input
                  type="date"
                  name="atd_dt"
                  value={formData.atd_dt}
                  onChange={handleChange}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ATD 시간</label>
                <input
                  type="time"
                  name="atd_time"
                  value={formData.atd_time}
                  onChange={handleChange}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ATA 일자 (실제도착)</label>
                <input
                  type="date"
                  name="ata_dt"
                  value={formData.ata_dt}
                  onChange={handleChange}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ATA 시간</label>
                <input
                  type="time"
                  name="ata_time"
                  value={formData.ata_time}
                  onChange={handleChange}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
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
                  value={formData.shipper_nm}
                  onChange={handleChange}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">수하인 (Consignee)</label>
                <input
                  type="text"
                  name="consignee_nm"
                  value={formData.consignee_nm}
                  onChange={handleChange}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">송하인 주소</label>
                <textarea
                  name="shipper_addr"
                  value={formData.shipper_addr}
                  onChange={handleChange}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">수하인 주소</label>
                <textarea
                  name="consignee_addr"
                  value={formData.consignee_addr}
                  onChange={handleChange}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  rows={2}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">통지처 (Notify Party)</label>
                <input
                  type="text"
                  name="notify_party"
                  value={formData.notify_party}
                  onChange={handleChange}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
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
                  value={formData.pieces}
                  onChange={handleChange}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">총중량 (KG)</label>
                <input
                  type="number"
                  step="0.001"
                  name="gross_weight_kg"
                  value={formData.gross_weight_kg}
                  onChange={handleChange}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">청구중량 (KG)</label>
                <input
                  type="number"
                  step="0.001"
                  name="charge_weight_kg"
                  value={formData.charge_weight_kg}
                  onChange={handleChange}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">용적 (CBM)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.001"
                    name="volume_cbm"
                    value={formData.volume_cbm}
                    onChange={handleChange}
                    className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDimensionsModal(true)}
                    className="h-[38px] px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm whitespace-nowrap"
                  >
                    계산
                  </button>
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">품명</label>
                <input
                  type="text"
                  name="commodity_desc"
                  value={formData.commodity_desc}
                  onChange={handleChange}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">HS Code</label>
                <input
                  type="text"
                  name="hs_code"
                  value={formData.hs_code}
                  onChange={handleChange}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">치수 (Dimensions)</label>
                <input
                  type="text"
                  name="dimensions"
                  value={formData.dimensions}
                  onChange={handleChange}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="100x50x30cm"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">특수취급 (Special Handling)</label>
                <input
                  type="text"
                  name="special_handling"
                  value={formData.special_handling}
                  onChange={handleChange}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  placeholder="예: FRAGILE, PERISHABLE"
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
                  value={formData.payment_terms}
                  onChange={handleChange}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
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
                  value={formData.declared_value}
                  onChange={handleChange}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">통화</label>
                <div className="flex gap-2">
                  <select
                    name="declared_currency"
                    value={formData.declared_currency}
                    onChange={handleChange}
                    className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  >
                    <option value="USD">USD</option>
                    <option value="KRW">KRW</option>
                    <option value="EUR">EUR</option>
                    <option value="JPY">JPY</option>
                    <option value="CNY">CNY</option>
                    <option value="GBP">GBP</option>
                    <option value="HKD">HKD</option>
                    <option value="SGD">SGD</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowExchangeRateModal(true)}
                    className="h-[38px] px-3 bg-[#E8A838] text-[#0C1222] rounded-lg hover:bg-[#D4943A] text-sm font-medium whitespace-nowrap"
                  >
                    환율조회
                  </button>
                </div>
                {exchangeRate && (
                  <p className="mt-1 text-xs text-[#E8A838]">
                    적용환율: {formatCurrency(exchangeRate)} KRW
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">보험가액</label>
                <input
                  type="number"
                  step="0.01"
                  name="insurance_value"
                  value={formData.insurance_value}
                  onChange={handleChange}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">운임</label>
                <input
                  type="number"
                  step="0.01"
                  name="freight_charges"
                  value={formData.freight_charges}
                  onChange={handleChange}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">기타비용</label>
                <input
                  type="number"
                  step="0.01"
                  name="other_charges"
                  value={formData.other_charges}
                  onChange={handleChange}
                  className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* 비고 */}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-[var(--foreground)]">비고</h3>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
              rows={3}
            />
          </div>

          {/* 버튼 영역 */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleNew}
              disabled={isNewMode}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              신규
            </button>
            <button
              onClick={handleCancel}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 font-semibold rounded-lg disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #E8A838 0%, #D4943A 100%)', color: '#0C1222' }}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </main>
      <CloseConfirmModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onConfirm={handleConfirmClose}
      />

      <ExchangeRateModal
        isOpen={showExchangeRateModal}
        onClose={() => setShowExchangeRateModal(false)}
        onSelect={handleExchangeRateSelect}
        selectedCurrency={formData.declared_currency}
      />

      <DimensionsCalculatorModal
        isOpen={showDimensionsModal}
        onClose={() => setShowDimensionsModal(false)}
        onApply={(totalCbm) => setFormData(prev => ({ ...prev, volume_cbm: totalCbm.toString() }))}
      />

      <AirlineCodeModal
        isOpen={showAirlineModal}
        onClose={() => setShowAirlineModal(false)}
        onSelect={handleAirlineSelect}
      />
      <LocationCodeModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelect={handleLocationSelect}
        type="airport"
      />
    </div>
  );
}

export default function ExportAWBRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)] flex items-center justify-center">Loading...</div>}>
      <ExportAWBRegisterContent />
    </Suspense>
  );
}
