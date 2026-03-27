'use client';

import { useState, useEffect } from 'react';
import { HouseBL, MasterBL } from '@/types/bl';
import Modal from '@/components/Modal';
import HBLForm from '@/components/bl/HBLForm';
import MBLForm from '@/components/bl/MBLForm';
import PageLayout from '@/components/PageLayout';

type TabType = 'hbl' | 'mbl';

const statusConfig: Record<string, { label: string; class: string }> = {
  DRAFT: { label: 'Draft', class: 'badge-pending' },
  CONFIRMED: { label: 'Confirmed', class: 'badge-booked' },
  PRINTED: { label: 'Printed', class: 'badge-shipped' },
  SURRENDERED: { label: 'Surrendered', class: 'badge-departed' },
  RELEASED: { label: 'Released', class: 'badge-delivered' },
  CANCELLED: { label: 'Cancelled', class: 'badge-cancelled' },
};

export default function BLPage() {
  const [activeTab, setActiveTab] = useState<TabType>('hbl');
  const [hblList, setHblList] = useState<HouseBL[]>([]);
  const [mblList, setMblList] = useState<MasterBL[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingHBL, setEditingHBL] = useState<HouseBL | null>(null);
  const [editingMBL, setEditingMBL] = useState<MasterBL | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    if (activeTab === 'hbl') {
      fetchHBLs();
    } else {
      fetchMBLs();
    }
  }, [activeTab, statusFilter]);

  const fetchHBLs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      const res = await fetch(`/api/bl/hbl?${params}`);
      const data = await res.json();
      setHblList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch HBLs:', error);
      setHblList([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMBLs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      const res = await fetch(`/api/bl/mbl?${params}`);
      const data = await res.json();
      setMblList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch MBLs:', error);
      setMblList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewBL = () => {
    setEditingHBL(null);
    setEditingMBL(null);
    setShowModal(true);
  };

  const handleEditHBL = (hbl: HouseBL) => {
    setEditingHBL(hbl);
    setEditingMBL(null);
    setShowModal(true);
  };

  const handleEditMBL = (mbl: MasterBL) => {
    setEditingMBL(mbl);
    setEditingHBL(null);
    setShowModal(true);
  };

  const handleDeleteHBL = async (hblId: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await fetch(`/api/bl/hbl?id=${hblId}`, { method: 'DELETE' });
      fetchHBLs();
    } catch (error) {
      console.error('Failed to delete HBL:', error);
    }
  };

  const handleDeleteMBL = async (mblId: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await fetch(`/api/bl/mbl?id=${mblId}`, { method: 'DELETE' });
      fetchMBLs();
    } catch (error) {
      console.error('Failed to delete MBL:', error);
    }
  };

  const handleFormSuccess = () => {
    setShowModal(false);
    setEditingHBL(null);
    setEditingMBL(null);
    if (activeTab === 'hbl') {
      fetchHBLs();
    } else {
      fetchMBLs();
    }
  };

  const renderStatus = (status: string) => {
    const config = statusConfig[status] || { label: status, class: 'badge-pending' };
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  return (
    <PageLayout title="B/L Management" subtitle="선하증권 (Bill of Lading) 관리" showCloseButton={false}>
        <main className="p-6">
          <div>
            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
                  style={{ background: 'rgba(26, 39, 68, 0.05)' }}
                >
                  <span className="w-2 h-2 rounded-full bg-[#1A2744]" />
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    Total: <span className="font-bold">{activeTab === 'hbl' ? hblList.length : mblList.length}</span>
                  </span>
                </div>
              </div>
              <button onClick={handleNewBL} className="btn-accent flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New {activeTab.toUpperCase()}
              </button>
            </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border)] mb-6">
        <button
          onClick={() => setActiveTab('hbl')}
          className={`flex items-center gap-2 px-6 py-3 font-medium rounded-t-lg transition-colors ${
            activeTab === 'hbl'
              ? 'bg-[#2563EB] text-white'
              : 'bg-[var(--surface-100)] text-[var(--muted)] hover:bg-[var(--surface-200)] hover:text-[var(--foreground)]'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          House B/L
        </button>
        <button
          onClick={() => setActiveTab('mbl')}
          className={`flex items-center gap-2 px-6 py-3 font-medium rounded-t-lg transition-colors ${
            activeTab === 'mbl'
              ? 'bg-[#2563EB] text-white'
              : 'bg-[var(--surface-100)] text-[var(--muted)] hover:bg-[var(--surface-200)] hover:text-[var(--foreground)]'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Master B/L
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="select-field w-48"
        >
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PRINTED">Printed</option>
          <option value="SURRENDERED">Surrendered</option>
          <option value="RELEASED">Released</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="loading-spinner"></div>
          </div>
        ) : activeTab === 'hbl' ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>HBL No.</th>
                  <th>MBL No.</th>
                  <th>Customer</th>
                  <th>Vessel/Voyage</th>
                  <th>Route</th>
                  <th>ETD</th>
                  <th>ETA</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {hblList.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-slate-500">No House B/L records found</p>
                        <button onClick={handleNewBL} className="btn-primary text-sm">
                          Create First HBL
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  hblList.map((hbl, index) => (
                    <tr key={hbl.hbl_id}>
                      <td className="font-mono font-semibold text-amber-400">{hbl.hbl_no}</td>
                      <td className="font-mono text-slate-400">{hbl.mbl_no || '-'}</td>
                      <td>{hbl.customer_name || '-'}</td>
                      <td>
                        {hbl.vessel_nm && hbl.voyage_no ? (
                          <span className="text-sm">
                            {hbl.vessel_nm} / <span className="text-teal-400">{hbl.voyage_no}</span>
                          </span>
                        ) : '-'}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="text-teal-400">{hbl.pol_port_cd}</span>
                          <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                          <span className="text-amber-400">{hbl.pod_port_cd}</span>
                        </div>
                      </td>
                      <td className="font-mono text-sm">{hbl.etd_dt || '-'}</td>
                      <td className="font-mono text-sm">{hbl.eta_dt || '-'}</td>
                      <td>{renderStatus(hbl.status_cd)}</td>
                      <td className="text-sm text-slate-400">{hbl.created_dtm}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditHBL(hbl)}
                            className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-navy-700/50 transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteHBL(hbl.hbl_id)}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-navy-700/50 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>MBL No.</th>
                  <th>Carrier</th>
                  <th>Vessel/Voyage</th>
                  <th>Route</th>
                  <th>ETD</th>
                  <th>ETA</th>
                  <th>HBL Count</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mblList.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <p className="text-slate-500">No Master B/L records found</p>
                        <button onClick={handleNewBL} className="btn-primary text-sm">
                          Create First MBL
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  mblList.map((mbl, index) => (
                    <tr key={mbl.mbl_id}>
                      <td className="font-mono font-semibold text-amber-400">{mbl.mbl_no}</td>
                      <td>{mbl.carrier_name || '-'}</td>
                      <td>
                        {mbl.vessel_nm && mbl.voyage_no ? (
                          <span className="text-sm">
                            {mbl.vessel_nm} / <span className="text-teal-400">{mbl.voyage_no}</span>
                          </span>
                        ) : '-'}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="text-teal-400">{mbl.pol_port_cd}</span>
                          <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                          <span className="text-amber-400">{mbl.pod_port_cd}</span>
                        </div>
                      </td>
                      <td className="font-mono text-sm">{mbl.etd_dt || '-'}</td>
                      <td className="font-mono text-sm">{mbl.eta_dt || '-'}</td>
                      <td>
                        <span className="px-2 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-medium">
                          {mbl.hbl_count || 0} HBL
                        </span>
                      </td>
                      <td>{renderStatus(mbl.status_cd)}</td>
                      <td className="text-sm text-slate-400">{mbl.created_dtm}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditMBL(mbl)}
                            className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-navy-700/50 transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteMBL(mbl.mbl_id)}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-navy-700/50 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
            </div>
          </div>
        </main>

        {/* Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingHBL(null);
            setEditingMBL(null);
          }}
          title={
            activeTab === 'hbl'
              ? editingHBL ? 'Edit House B/L' : 'New House B/L'
              : editingMBL ? 'Edit Master B/L' : 'New Master B/L'
          }
          size="xl"
        >
          {activeTab === 'hbl' ? (
            <HBLForm
              initialData={editingHBL}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setShowModal(false);
                setEditingHBL(null);
              }}
            />
          ) : (
            <MBLForm
              initialData={editingMBL}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setShowModal(false);
                setEditingMBL(null);
              }}
            />
          )}
        </Modal>
    </PageLayout>
  );
}
