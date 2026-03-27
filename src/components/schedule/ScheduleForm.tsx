'use client';

import { useState, useEffect } from 'react';
import { ScheduleFormData } from '@/types/schedule';

interface Carrier {
  carrier_id: number;
  carrier_nm: string;
  carrier_cd: string;
}

interface Port {
  port_cd: string;
  port_nm: string;
}

interface ScheduleFormProps {
  initialData?: ScheduleFormData & { schedule_id?: number };
  onSubmit: (data: ScheduleFormData & { schedule_id?: number }) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

export default function ScheduleForm({ initialData, onSubmit, onCancel, isEdit = false }: ScheduleFormProps) {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ScheduleFormData & { schedule_id?: number }>({
    carrier_id: 0,
    vessel_nm: '',
    voyage_no: '',
    service_lane: '',
    pol_port_cd: '',
    pod_port_cd: '',
    pol_terminal: '',
    pod_terminal: '',
    etd_dt: '',
    eta_dt: '',
    doc_cutoff_dt: '',
    cargo_cutoff_dt: '',
    vgm_cutoff_dt: '',
    transit_time: undefined,
    space_20gp: 0,
    space_40gp: 0,
    space_40hc: 0,
    space_45hc: 0,
    remark: '',
    ...initialData
  });

  useEffect(() => {
    fetchCarriers();
    fetchPorts();
  }, []);

  useEffect(() => {
    // ETD와 ETA가 모두 있으면 Transit Time 자동 계산
    if (formData.etd_dt && formData.eta_dt) {
      const etd = new Date(formData.etd_dt);
      const eta = new Date(formData.eta_dt);
      const diffDays = Math.ceil((eta.getTime() - etd.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        setFormData(prev => ({ ...prev, transit_time: diffDays }));
      }
    }
  }, [formData.etd_dt, formData.eta_dt]);

  const fetchCarriers = async () => {
    try {
      const response = await fetch('/api/carriers');
      if (response.ok) {
        const data = await response.json();
        setCarriers(data);
      }
    } catch (error) {
      console.error('Failed to fetch carriers:', error);
    }
  };

  const fetchPorts = async () => {
    try {
      const response = await fetch('/api/ports');
      if (response.ok) {
        const data = await response.json();
        setPorts(data);
      }
    } catch (error) {
      console.error('Failed to fetch ports:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseInt(value) : undefined) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (!formData.carrier_id || formData.carrier_id === 0) {
      alert('선사를 선택해주세요.');
      return;
    }
    if (!formData.vessel_nm) {
      alert('선박명을 입력해주세요.');
      return;
    }
    if (!formData.voyage_no) {
      alert('항차를 입력해주세요.');
      return;
    }
    if (!formData.pol_port_cd) {
      alert('출발항을 선택해주세요.');
      return;
    }
    if (!formData.pod_port_cd) {
      alert('도착항을 선택해주세요.');
      return;
    }
    if (!formData.etd_dt) {
      alert('ETD를 입력해주세요.');
      return;
    }
    if (!formData.eta_dt) {
      alert('ETA를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 기본 정보 */}
      <div>
        <h4 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-[var(--amber-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Basic Information
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-2">
              Carrier <span className="text-red-500">*</span>
            </label>
            <select
              name="carrier_id"
              value={formData.carrier_id}
              onChange={handleChange}
              className="input-field w-full"
              required
            >
              <option value={0}>Select Carrier</option>
              {carriers.map(c => (
                <option key={c.carrier_id} value={c.carrier_id}>
                  {c.carrier_cd} - {c.carrier_nm}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-2">
              Service Lane
            </label>
            <input
              type="text"
              name="service_lane"
              value={formData.service_lane || ''}
              onChange={handleChange}
              placeholder="e.g., AEU1, PS3, FAL1"
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-2">
              Vessel Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="vessel_nm"
              value={formData.vessel_nm}
              onChange={handleChange}
              placeholder="e.g., HMM ALGECIRAS"
              className="input-field w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-2">
              Voyage No. <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="voyage_no"
              value={formData.voyage_no}
              onChange={handleChange}
              placeholder="e.g., E0026, 015W"
              className="input-field w-full"
              required
            />
          </div>
        </div>
      </div>

      {/* 항로 정보 */}
      <div>
        <h4 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-[var(--amber-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          Route Information
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-2">
              POL (Port of Loading) <span className="text-red-500">*</span>
            </label>
            <select
              name="pol_port_cd"
              value={formData.pol_port_cd}
              onChange={handleChange}
              className="input-field w-full"
              required
            >
              <option value="">Select Port</option>
              {ports.map(p => (
                <option key={p.port_cd} value={p.port_cd}>
                  {p.port_cd} - {p.port_nm}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-2">
              POD (Port of Discharge) <span className="text-red-500">*</span>
            </label>
            <select
              name="pod_port_cd"
              value={formData.pod_port_cd}
              onChange={handleChange}
              className="input-field w-full"
              required
            >
              <option value="">Select Port</option>
              {ports.map(p => (
                <option key={p.port_cd} value={p.port_cd}>
                  {p.port_cd} - {p.port_nm}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-2">
              POL Terminal
            </label>
            <input
              type="text"
              name="pol_terminal"
              value={formData.pol_terminal || ''}
              onChange={handleChange}
              placeholder="e.g., HPNT, BNCT"
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-2">
              POD Terminal
            </label>
            <input
              type="text"
              name="pod_terminal"
              value={formData.pod_terminal || ''}
              onChange={handleChange}
              placeholder="e.g., APM, ECT Delta"
              className="input-field w-full"
            />
          </div>
        </div>
      </div>

      {/* 스케줄 정보 */}
      <div>
        <h4 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-[var(--amber-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Schedule
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-2">
              ETD <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="etd_dt"
              value={formData.etd_dt}
              onChange={handleChange}
              className="input-field w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-2">
              ETA <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="eta_dt"
              value={formData.eta_dt}
              onChange={handleChange}
              className="input-field w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-2">
              Transit Time (days)
            </label>
            <input
              type="number"
              name="transit_time"
              value={formData.transit_time || ''}
              onChange={handleChange}
              placeholder="Auto-calculated"
              className="input-field w-full bg-[var(--surface-50)]"
              readOnly
            />
          </div>
        </div>
      </div>

      {/* Cut-off 정보 */}
      <div>
        <h4 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-[var(--amber-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Cut-off Times
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-2">
              Document Cut-off
            </label>
            <input
              type="datetime-local"
              name="doc_cutoff_dt"
              value={formData.doc_cutoff_dt || ''}
              onChange={handleChange}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-2">
              Cargo Cut-off
            </label>
            <input
              type="datetime-local"
              name="cargo_cutoff_dt"
              value={formData.cargo_cutoff_dt || ''}
              onChange={handleChange}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-2">
              VGM Cut-off
            </label>
            <input
              type="datetime-local"
              name="vgm_cutoff_dt"
              value={formData.vgm_cutoff_dt || ''}
              onChange={handleChange}
              className="input-field w-full"
            />
          </div>
        </div>
      </div>

      {/* Space 정보 */}
      <div>
        <h4 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-[var(--amber-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          Space Availability (TEU)
        </h4>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-2">
              20GP
            </label>
            <input
              type="number"
              name="space_20gp"
              value={formData.space_20gp || 0}
              onChange={handleChange}
              min="0"
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-2">
              40GP
            </label>
            <input
              type="number"
              name="space_40gp"
              value={formData.space_40gp || 0}
              onChange={handleChange}
              min="0"
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-2">
              40HC
            </label>
            <input
              type="number"
              name="space_40hc"
              value={formData.space_40hc || 0}
              onChange={handleChange}
              min="0"
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-2">
              45HC
            </label>
            <input
              type="number"
              name="space_45hc"
              value={formData.space_45hc || 0}
              onChange={handleChange}
              min="0"
              className="input-field w-full"
            />
          </div>
        </div>
        <p className="text-xs text-[var(--muted)] mt-2">
          Total: {(formData.space_20gp || 0) + (formData.space_40gp || 0) + (formData.space_40hc || 0) + (formData.space_45hc || 0)} TEU
        </p>
      </div>

      {/* Remark */}
      <div>
        <label className="block text-sm font-medium text-[var(--muted)] mb-2">
          Remark
        </label>
        <textarea
          name="remark"
          value={formData.remark || ''}
          onChange={handleChange}
          rows={3}
          placeholder="Additional notes..."
          className="input-field w-full resize-none"
        />
      </div>

      {/* 버튼 */}
      <div className="flex justify-end gap-3 pt-4 border-t border-[var(--surface-200)]">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {isEdit ? 'Update Schedule' : 'Create Schedule'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
