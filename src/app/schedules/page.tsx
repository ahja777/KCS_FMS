'use client';

import { useState, useEffect } from 'react';
import PageLayout from '@/components/PageLayout';
import Modal from '@/components/Modal';
import ScheduleForm from '@/components/schedule/ScheduleForm';
import { VesselSchedule, ScheduleFormData } from '@/types/schedule';

interface Carrier {
  carrier_id: number;
  carrier_nm: string;
  carrier_cd: string;
}

interface Port {
  port_cd: string;
  port_nm: string;
}

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  SCHEDULED: { bg: 'rgba(59, 130, 246, 0.1)', text: '#1D4ED8', dot: '#3B82F6', label: 'Scheduled' },
  DEPARTED: { bg: 'rgba(139, 92, 246, 0.1)', text: '#6D28D9', dot: '#8B5CF6', label: 'Departed' },
  ARRIVED: { bg: 'rgba(34, 197, 94, 0.1)', text: '#15803D', dot: '#22C55E', label: 'Arrived' },
  DELAYED: { bg: 'rgba(245, 158, 11, 0.1)', text: '#B45309', dot: '#F59E0B', label: 'Delayed' },
  CANCELLED: { bg: 'rgba(239, 68, 68, 0.1)', text: '#DC2626', dot: '#EF4444', label: 'Cancelled' },
};

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<VesselSchedule[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<VesselSchedule | null>(null);
  const [editSchedule, setEditSchedule] = useState<VesselSchedule | null>(null);

  // 필터 상태
  const [filters, setFilters] = useState({
    carrier_id: '',
    pol_port_cd: '',
    pod_port_cd: '',
    etd_from: '',
    etd_to: '',
    status: ''
  });

  useEffect(() => {
    fetchSchedules();
    fetchCarriers();
    fetchPorts();
  }, []);

  const fetchSchedules = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filters.carrier_id) params.append('carrier_id', filters.carrier_id);
      if (filters.pol_port_cd) params.append('pol_port_cd', filters.pol_port_cd);
      if (filters.pod_port_cd) params.append('pod_port_cd', filters.pod_port_cd);
      if (filters.etd_from) params.append('etd_from', filters.etd_from);
      if (filters.etd_to) params.append('etd_to', filters.etd_to);
      if (filters.status) params.append('status', filters.status);

      const response = await fetch(`/api/schedules?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleSearch = () => {
    fetchSchedules();
  };

  const handleReset = () => {
    setFilters({
      carrier_id: '',
      pol_port_cd: '',
      pod_port_cd: '',
      etd_from: '',
      etd_to: '',
      status: ''
    });
  };

  const handleViewDetail = (schedule: VesselSchedule) => {
    setSelectedSchedule(schedule);
    setIsDetailModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditSchedule(null);
    setIsFormModalOpen(true);
  };

  const handleSubmitSchedule = async (data: ScheduleFormData & { schedule_id?: number }) => {
    try {
      const method = data.schedule_id ? 'PUT' : 'POST';
      const response = await fetch('/api/schedules', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setIsFormModalOpen(false);
        setEditSchedule(null);
        fetchSchedules();
        alert(data.schedule_id ? 'Schedule updated successfully!' : 'Schedule created successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save schedule');
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Failed to save schedule');
    }
  };

  const getTotalSpace = (schedule: VesselSchedule) => {
    return (schedule.space_20gp || 0) + (schedule.space_40gp || 0) +
           (schedule.space_40hc || 0) + (schedule.space_45hc || 0);
  };

  const getDaysUntilETD = (etdDt: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const etd = new Date(etdDt);
    const diff = Math.ceil((etd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <PageLayout title="Schedule Management" subtitle="Vessel schedules and space management" showCloseButton={false}>
        <main className="p-6">
          {/* Search Filters */}
          <div className="card mb-6">
            <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="font-bold">검색조건</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Carrier</label>
                  <select
                    value={filters.carrier_id}
                    onChange={(e) => setFilters({ ...filters, carrier_id: e.target.value })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  >
                    <option value="">All Carriers</option>
                    {carriers.map(c => (
                      <option key={c.carrier_id} value={c.carrier_id}>{c.carrier_nm}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">POL</label>
                  <select
                    value={filters.pol_port_cd}
                    onChange={(e) => setFilters({ ...filters, pol_port_cd: e.target.value })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  >
                    <option value="">All Ports</option>
                    {ports.map(p => (
                      <option key={p.port_cd} value={p.port_cd}>{p.port_nm} ({p.port_cd})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">POD</label>
                  <select
                    value={filters.pod_port_cd}
                    onChange={(e) => setFilters({ ...filters, pod_port_cd: e.target.value })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  >
                    <option value="">All Ports</option>
                    {ports.map(p => (
                      <option key={p.port_cd} value={p.port_cd}>{p.port_nm} ({p.port_cd})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ETD From</label>
                  <input
                    type="date"
                    value={filters.etd_from}
                    onChange={(e) => setFilters({ ...filters, etd_from: e.target.value })}
                    className="w-full h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ETD To</label>
                  <input
                    type="date"
                    value={filters.etd_to}
                    onChange={(e) => setFilters({ ...filters, etd_to: e.target.value })}
                    className="w-full h-[38px] px-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
                  >
                    <option value="">All Status</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="DEPARTED">Departed</option>
                    <option value="ARRIVED">Arrived</option>
                    <option value="DELAYED">Delayed</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-[var(--border)] flex justify-center gap-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] transition-colors"
              >
                초기화
              </button>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                조회
              </button>
            </div>
          </div>

          {/* Schedule List */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-display)' }}>
                  Vessel Schedules
                </h2>
                <p className="text-sm text-[var(--muted)] mt-0.5">{schedules.length} schedules found</p>
              </div>
              <button onClick={handleCreateNew} className="btn-primary">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Schedule
              </button>
            </div>

            {isLoading ? (
              <div className="card-body">
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-12 h-12 skeleton rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <div className="w-48 h-4 skeleton" />
                        <div className="w-32 h-3 skeleton" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Vessel / Voyage</th>
                      <th>Carrier</th>
                      <th>Route</th>
                      <th>ETD</th>
                      <th>ETA</th>
                      <th>T/T</th>
                      <th>Cut-off</th>
                      <th>Space</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                              style={{ background: 'var(--surface-100)' }}
                            >
                              <svg className="w-8 h-8 text-[var(--surface-400)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                              </svg>
                            </div>
                            <p className="text-[var(--muted)]">No schedules found</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      schedules.map((schedule) => {
                        const daysUntil = getDaysUntilETD(schedule.etd_dt);
                        return (
                          <tr key={schedule.schedule_id} className="group">
                            <td>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[rgba(26,39,68,0.1)] text-[#1A2744]">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="font-semibold text-[var(--foreground)] group-hover:text-[var(--amber-500)] transition-colors cursor-pointer"
                                    onClick={() => handleViewDetail(schedule)}
                                  >
                                    {schedule.vessel_nm}
                                  </p>
                                  <p className="text-xs text-[var(--muted)]">{schedule.voyage_no}</p>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="font-medium">{schedule.carrier_name || '-'}</span>
                              {schedule.service_lane && (
                                <p className="text-xs text-[var(--muted)]">{schedule.service_lane}</p>
                              )}
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <span className="text-[var(--foreground)] font-medium">{schedule.pol_port_cd}</span>
                                <svg className="w-4 h-4 text-[var(--amber-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                                <span className="text-[var(--foreground)] font-medium">{schedule.pod_port_cd}</span>
                              </div>
                            </td>
                            <td>
                              <div>
                                <span className="font-mono text-sm">{schedule.etd_dt}</span>
                                {schedule.status_cd === 'SCHEDULED' && daysUntil >= 0 && (
                                  <p className={`text-xs ${daysUntil <= 3 ? 'text-[#F06449]' : 'text-[var(--muted)]'}`}>
                                    {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `D-${daysUntil}`}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className="font-mono text-sm">{schedule.eta_dt}</span>
                            </td>
                            <td>
                              <span className="font-mono text-sm">{schedule.transit_time || '-'}d</span>
                            </td>
                            <td>
                              {schedule.cargo_cutoff_dt ? (
                                <div className="text-xs">
                                  <p className="text-[var(--muted)]">Doc: {schedule.doc_cutoff_dt?.split(' ')[0]}</p>
                                  <p className="text-[var(--foreground)] font-medium">Cargo: {schedule.cargo_cutoff_dt?.split(' ')[0]}</p>
                                </div>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td>
                              {getTotalSpace(schedule) > 0 ? (
                                <div className="text-xs">
                                  <p className="font-semibold text-[var(--foreground)]">{getTotalSpace(schedule)} TEU</p>
                                  <p className="text-[var(--muted)]">
                                    {schedule.space_20gp}x20 / {schedule.space_40hc}x40HC
                                  </p>
                                </div>
                              ) : (
                                <span className="text-[var(--muted)]">Full</span>
                              )}
                            </td>
                            <td>
                              <span
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                                style={{
                                  background: statusConfig[schedule.status_cd]?.bg || 'var(--surface-100)',
                                  color: statusConfig[schedule.status_cd]?.text || 'var(--muted)',
                                }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ background: statusConfig[schedule.status_cd]?.dot || 'var(--muted)' }}
                                />
                                {statusConfig[schedule.status_cd]?.label || schedule.status_cd}
                              </span>
                            </td>
                            <td>
                              <button
                                onClick={() => handleViewDetail(schedule)}
                                className="p-2 rounded-lg transition-colors duration-200 hover:bg-[var(--surface-100)]"
                              >
                                <svg className="w-4 h-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Schedule Details"
        size="lg"
      >
        {selectedSchedule && (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="flex items-center gap-4 pb-4 border-b border-[var(--surface-200)]">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #1A2744 0%, #243B67 100%)' }}
              >
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--foreground)]">{selectedSchedule.vessel_nm}</h3>
                <p className="text-[var(--muted)]">Voyage: {selectedSchedule.voyage_no} | {selectedSchedule.service_lane || 'N/A'}</p>
              </div>
              <span
                className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold"
                style={{
                  background: statusConfig[selectedSchedule.status_cd]?.bg || 'var(--surface-100)',
                  color: statusConfig[selectedSchedule.status_cd]?.text || 'var(--muted)',
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: statusConfig[selectedSchedule.status_cd]?.dot || 'var(--muted)' }}
                />
                {statusConfig[selectedSchedule.status_cd]?.label || selectedSchedule.status_cd}
              </span>
            </div>

            {/* Route & Schedule */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                  <svg className="w-4 h-4 text-[var(--amber-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  Route Information
                </h4>
                <div className="p-4 rounded-xl bg-[var(--surface-50)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--muted)]">Carrier</span>
                    <span className="font-medium">{selectedSchedule.carrier_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--muted)]">POL</span>
                    <span className="font-medium">{selectedSchedule.pol_port_cd} ({selectedSchedule.pol_port_name})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--muted)]">POL Terminal</span>
                    <span className="font-medium">{selectedSchedule.pol_terminal || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--muted)]">POD</span>
                    <span className="font-medium">{selectedSchedule.pod_port_cd} ({selectedSchedule.pod_port_name})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--muted)]">POD Terminal</span>
                    <span className="font-medium">{selectedSchedule.pod_terminal || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--muted)]">Transit Time</span>
                    <span className="font-medium">{selectedSchedule.transit_time || '-'} days</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                  <svg className="w-4 h-4 text-[var(--amber-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Schedule
                </h4>
                <div className="p-4 rounded-xl bg-[var(--surface-50)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--muted)]">ETD</span>
                    <span className="font-mono font-medium">{selectedSchedule.etd_dt}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--muted)]">ETA</span>
                    <span className="font-mono font-medium">{selectedSchedule.eta_dt}</span>
                  </div>
                  {selectedSchedule.atd_dt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[var(--muted)]">ATD</span>
                      <span className="font-mono font-medium text-[#8B5CF6]">{selectedSchedule.atd_dt}</span>
                    </div>
                  )}
                  {selectedSchedule.ata_dt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[var(--muted)]">ATA</span>
                      <span className="font-mono font-medium text-[#22C55E]">{selectedSchedule.ata_dt}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cut-off Times */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                <svg className="w-4 h-4 text-[var(--amber-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Cut-off Times
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[var(--surface-50)] text-center">
                  <p className="text-xs text-[var(--muted)] mb-1">Document Cut-off</p>
                  <p className="font-mono font-semibold text-[var(--foreground)]">{selectedSchedule.doc_cutoff_dt || '-'}</p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--surface-50)] text-center">
                  <p className="text-xs text-[var(--muted)] mb-1">Cargo Cut-off</p>
                  <p className="font-mono font-semibold text-[#F06449]">{selectedSchedule.cargo_cutoff_dt || '-'}</p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--surface-50)] text-center">
                  <p className="text-xs text-[var(--muted)] mb-1">VGM Cut-off</p>
                  <p className="font-mono font-semibold text-[var(--foreground)]">{selectedSchedule.vgm_cutoff_dt || '-'}</p>
                </div>
              </div>
            </div>

            {/* Space Availability */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                <svg className="w-4 h-4 text-[var(--amber-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Space Availability
              </h4>
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[var(--surface-50)] text-center">
                  <p className="text-xs text-[var(--muted)] mb-1">20GP</p>
                  <p className="text-2xl font-bold text-[var(--foreground)]">{selectedSchedule.space_20gp || 0}</p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--surface-50)] text-center">
                  <p className="text-xs text-[var(--muted)] mb-1">40GP</p>
                  <p className="text-2xl font-bold text-[var(--foreground)]">{selectedSchedule.space_40gp || 0}</p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--surface-50)] text-center">
                  <p className="text-xs text-[var(--muted)] mb-1">40HC</p>
                  <p className="text-2xl font-bold text-[var(--foreground)]">{selectedSchedule.space_40hc || 0}</p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--surface-50)] text-center">
                  <p className="text-xs text-[var(--muted)] mb-1">45HC</p>
                  <p className="text-2xl font-bold text-[var(--foreground)]">{selectedSchedule.space_45hc || 0}</p>
                </div>
              </div>
            </div>

            {/* Remark */}
            {selectedSchedule.remark && (
              <div className="p-4 rounded-xl bg-[var(--surface-50)]">
                <p className="text-sm text-[var(--muted)] mb-1">Remark</p>
                <p className="text-[var(--foreground)]">{selectedSchedule.remark}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </PageLayout>
  );
}
