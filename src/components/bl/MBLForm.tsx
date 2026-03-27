'use client';

import { useState, useEffect } from 'react';
import { MasterBL, MBLFormData } from '@/types/bl';
import { Carrier, Port } from '@/types/shipment';

interface MBLFormProps {
  initialData?: MasterBL | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function MBLForm({ initialData, onSuccess, onCancel }: MBLFormProps) {
  const [loading, setLoading] = useState(false);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);

  const [formData, setFormData] = useState<MBLFormData>({
    shipment_id: initialData?.shipment_id || undefined,
    booking_id: initialData?.booking_id || undefined,
    carrier_id: initialData?.carrier_id || 0,
    vessel_nm: initialData?.vessel_nm || '',
    voyage_no: initialData?.voyage_no || '',
    pol_port_cd: initialData?.pol_port_cd || '',
    pod_port_cd: initialData?.pod_port_cd || '',
    place_of_receipt: initialData?.place_of_receipt || '',
    place_of_delivery: initialData?.place_of_delivery || '',
    final_dest: initialData?.final_dest || '',
    etd_dt: initialData?.etd_dt || '',
    eta_dt: initialData?.eta_dt || '',
    on_board_dt: initialData?.on_board_dt || '',
    issue_dt: initialData?.issue_dt || '',
    issue_place: initialData?.issue_place || '',
    shipper_nm: initialData?.shipper_nm || '',
    consignee_nm: initialData?.consignee_nm || '',
    notify_party: initialData?.notify_party || '',
    total_pkg_qty: initialData?.total_pkg_qty || undefined,
    pkg_type_cd: initialData?.pkg_type_cd || 'CARTON',
    gross_weight_kg: initialData?.gross_weight_kg || undefined,
    volume_cbm: initialData?.volume_cbm || undefined,
    commodity_desc: initialData?.commodity_desc || '',
    freight_term_cd: initialData?.freight_term_cd || 'PREPAID',
    bl_type_cd: initialData?.bl_type_cd || 'ORIGINAL',
    original_bl_count: initialData?.original_bl_count || 3,
  });

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      const [carriersRes, portsRes] = await Promise.all([
        fetch('/api/carriers'),
        fetch('/api/ports'),
      ]);

      const [carriersData, portsData] = await Promise.all([
        carriersRes.json(),
        portsRes.json(),
      ]);

      setCarriers(Array.isArray(carriersData) ? carriersData.filter((c: Carrier) => c.carrier_type === 'SEA') : []);
      setPorts(Array.isArray(portsData) ? portsData.filter((p: Port) => p.port_type === 'SEA') : []);
    } catch (error) {
      console.error('Failed to fetch dropdown data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = '/api/bl/mbl';
      const method = initialData ? 'PUT' : 'POST';
      const body = initialData
        ? { mbl_id: initialData.mbl_id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save MBL');
      }
    } catch (error) {
      console.error('Failed to save MBL:', error);
      alert('Failed to save MBL');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof MBLFormData, value: string | number | null | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const freightTerms = ['PREPAID', 'COLLECT', 'FREIGHT_PAYABLE'];
  const blTypes = ['ORIGINAL', 'SEAWAY', 'EXPRESS', 'SURRENDER'];
  const pkgTypes = ['CARTON', 'PALLET', 'CASE', 'BAG', 'DRUM', 'ROLL', 'BUNDLE', 'PIECE'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Carrier & Vessel Section */}
      <div className="form-section">
        <h3 className="form-section-title">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Carrier & Vessel
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Carrier <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.carrier_id || ''}
              onChange={(e) => handleChange('carrier_id', parseInt(e.target.value) || 0)}
              className="select-field"
              required
            >
              <option value="">Select Carrier</option>
              {carriers.map((c) => (
                <option key={c.carrier_id} value={c.carrier_id}>{c.carrier_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Vessel Name</label>
            <input
              type="text"
              value={formData.vessel_nm || ''}
              onChange={(e) => handleChange('vessel_nm', e.target.value)}
              className="input-field"
              placeholder="e.g., EVER GIVEN"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Voyage No.</label>
            <input
              type="text"
              value={formData.voyage_no || ''}
              onChange={(e) => handleChange('voyage_no', e.target.value)}
              className="input-field"
              placeholder="e.g., 001E"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Final Destination</label>
            <input
              type="text"
              value={formData.final_dest || ''}
              onChange={(e) => handleChange('final_dest', e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Route Section */}
      <div className="form-section">
        <h3 className="form-section-title">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Route
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Port of Loading <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.pol_port_cd || ''}
              onChange={(e) => handleChange('pol_port_cd', e.target.value)}
              className="select-field"
              required
            >
              <option value="">Select POL</option>
              {ports.map((p) => (
                <option key={p.port_cd} value={p.port_cd}>{p.port_cd} - {p.port_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Port of Discharge <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.pod_port_cd || ''}
              onChange={(e) => handleChange('pod_port_cd', e.target.value)}
              className="select-field"
              required
            >
              <option value="">Select POD</option>
              {ports.map((p) => (
                <option key={p.port_cd} value={p.port_cd}>{p.port_cd} - {p.port_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Place of Receipt</label>
            <input
              type="text"
              value={formData.place_of_receipt || ''}
              onChange={(e) => handleChange('place_of_receipt', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Place of Delivery</label>
            <input
              type="text"
              value={formData.place_of_delivery || ''}
              onChange={(e) => handleChange('place_of_delivery', e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Schedule Section */}
      <div className="form-section">
        <h3 className="form-section-title">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Schedule
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">ETD</label>
            <input
              type="date"
              value={formData.etd_dt || ''}
              onChange={(e) => handleChange('etd_dt', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">ETA</label>
            <input
              type="date"
              value={formData.eta_dt || ''}
              onChange={(e) => handleChange('eta_dt', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">On Board Date</label>
            <input
              type="date"
              value={formData.on_board_dt || ''}
              onChange={(e) => handleChange('on_board_dt', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Issue Date</label>
            <input
              type="date"
              value={formData.issue_dt || ''}
              onChange={(e) => handleChange('issue_dt', e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Parties Section */}
      <div className="form-section">
        <h3 className="form-section-title">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Parties
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Shipper</label>
            <input
              type="text"
              value={formData.shipper_nm || ''}
              onChange={(e) => handleChange('shipper_nm', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Consignee</label>
            <input
              type="text"
              value={formData.consignee_nm || ''}
              onChange={(e) => handleChange('consignee_nm', e.target.value)}
              className="input-field"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">Notify Party</label>
          <textarea
            value={formData.notify_party || ''}
            onChange={(e) => handleChange('notify_party', e.target.value)}
            className="input-field min-h-[60px]"
            rows={2}
          />
        </div>
      </div>

      {/* Cargo Section */}
      <div className="form-section">
        <h3 className="form-section-title">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          Cargo Details
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Package Qty</label>
            <input
              type="number"
              value={formData.total_pkg_qty || ''}
              onChange={(e) => handleChange('total_pkg_qty', parseInt(e.target.value) || undefined)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Package Type</label>
            <select
              value={formData.pkg_type_cd || ''}
              onChange={(e) => handleChange('pkg_type_cd', e.target.value)}
              className="select-field"
            >
              {pkgTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Gross Weight (KG)</label>
            <input
              type="number"
              step="0.001"
              value={formData.gross_weight_kg || ''}
              onChange={(e) => handleChange('gross_weight_kg', parseFloat(e.target.value) || undefined)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Volume (CBM)</label>
            <input
              type="number"
              step="0.0001"
              value={formData.volume_cbm || ''}
              onChange={(e) => handleChange('volume_cbm', parseFloat(e.target.value) || undefined)}
              className="input-field"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">Commodity Description</label>
          <textarea
            value={formData.commodity_desc || ''}
            onChange={(e) => handleChange('commodity_desc', e.target.value)}
            className="input-field min-h-[80px]"
            rows={3}
          />
        </div>
      </div>

      {/* B/L Options Section */}
      <div className="form-section">
        <h3 className="form-section-title">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          B/L Options
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Freight Term</label>
            <div className="flex flex-wrap gap-2">
              {freightTerms.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => handleChange('freight_term_cd', term)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    formData.freight_term_cd === term
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-navy-950'
                      : 'bg-navy-700/50 text-slate-400 hover:text-white hover:bg-navy-600/50'
                  }`}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">B/L Type</label>
            <div className="flex flex-wrap gap-2">
              {blTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleChange('bl_type_cd', type)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    formData.bl_type_cd === type
                      ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white'
                      : 'bg-navy-700/50 text-slate-400 hover:text-white hover:bg-navy-600/50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Original B/L Count</label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.original_bl_count || 3}
              onChange={(e) => handleChange('original_bl_count', parseInt(e.target.value) || 3)}
              className="input-field w-24"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Issue Place</label>
            <input
              type="text"
              value={formData.issue_place || ''}
              onChange={(e) => handleChange('issue_place', e.target.value)}
              className="input-field"
              placeholder="e.g., SEOUL, KOREA"
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-navy-700/50">
        <button
          type="button"
          onClick={onCancel}
          className="btn-ghost"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-accent flex items-center gap-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-navy-950/30 border-t-navy-950 rounded-full animate-spin"></div>
              Saving...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {initialData ? 'Update MBL' : 'Create MBL'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
