'use client';

import { useState, useEffect, useCallback } from 'react';
import PageLayout from '@/components/PageLayout';
import AWBSelectModal from '@/components/AWBSelectModal';
import { getToday } from '@/components/DateRangeButtons';

interface AWBData {
  mawb_id: number;
  mawb_no: string;
  airline_code: string;
  flight_no: string;
  origin_airport_cd: string;
  dest_airport_cd: string;
  etd_dt: string;
  eta_dt: string;
  shipper_nm: string;
  consignee_nm: string;
  pieces: number;
  gross_weight_kg: number;
  commodity_desc: string;
  status_cd: string;
}

interface MailGroup {
  group_id: number;
  group_code: string;
  group_name: string;
  group_type: string;
  biz_type: string;
  remark: string;
  use_yn: string;
  address_count?: number;
  addresses?: GroupAddress[];
}

interface GroupAddress {
  address_id?: number;
  addr_type: string;
  addr_name: string;
  email: string;
}

interface PreAlertSetting {
  setting_id: number;
  setting_name: string;
  service_group: string;
  shipper_code: string;
  consignee_code: string;
  partner_code: string;
  pol_code: string;
  pod_code: string;
  attachment_types: string;
  base_date_type: string;
  auto_send_yn: string;
  auto_send_days: number;
  auto_send_time: string;
  mail_subject: string;
  mail_body: string;
  use_yn: string;
  addresses: Address[];
}

interface Address {
  id?: number;
  addr_type: string;
  addr_name: string;
  email: string;
}

interface MailLog {
  log_id: number;
  doc_type: string;
  doc_no: string;
  mail_from: string;
  mail_to: string;
  mail_cc: string;
  mail_subject: string;
  mail_body: string;
  status: string;
  response_msg: string;
  send_dt_fmt: string;
  created_dt_fmt: string;
  setting_name: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  SUCCESS: { label: '성공', color: 'bg-green-500' },
  STANDBY: { label: '대기', color: 'bg-yellow-500' },
  FAILED: { label: '실패', color: 'bg-red-500' },
};

export default function PreAlertPage() {
  const [activeTab, setActiveTab] = useState<'mailGroup' | 'settings' | 'logs'>('mailGroup');
  const [loading, setLoading] = useState(false);

  // Mail Group State
  const [mailGroups, setMailGroups] = useState<MailGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<MailGroup | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupFormData, setGroupFormData] = useState<Partial<MailGroup>>({
    group_code: '',
    group_name: '',
    group_type: 'GENERAL',
    biz_type: 'AIR',
    remark: '',
    use_yn: 'Y',
    addresses: [],
  });

  // Settings State
  const [settings, setSettings] = useState<PreAlertSetting[]>([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PreAlertSetting | null>(null);
  const [formData, setFormData] = useState<Partial<PreAlertSetting>>({
    setting_name: '',
    service_group: 'AIR',
    shipper_code: '',
    consignee_code: '',
    partner_code: '',
    pol_code: '',
    pod_code: '',
    attachment_types: '',
    base_date_type: 'ETD',
    auto_send_yn: 'N',
    auto_send_days: 0,
    auto_send_time: '',
    mail_subject: '',
    mail_body: '',
    use_yn: 'Y',
    addresses: [],
  });

  // Mail Log State
  const [logs, setLogs] = useState<MailLog[]>([]);
  const today = getToday();
  const [logFilters, setLogFilters] = useState({
    docNo: '',
    status: '',
    startDate: today,
    endDate: today,
  });
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);
  const [showMailEditor, setShowMailEditor] = useState(false);
  const [editingLog, setEditingLog] = useState<MailLog | null>(null);

  // AWB Modal
  const [showAWBModal, setShowAWBModal] = useState(false);
  const [selectedAwb, setSelectedAwb] = useState<AWBData | null>(null);

  // Mail Group Popup for Settings
  const [showMailGroupPopup, setShowMailGroupPopup] = useState(false);

  // Send Mail State
  const [sendingMail, setSendingMail] = useState<number | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendTargetSetting, setSendTargetSetting] = useState<PreAlertSetting | null>(null);
  const [sendFormData, setSendFormData] = useState({
    doc_no: '',
    mawb_no: '',
    flight_no: '',
    origin: '',
    destination: '',
    etd: '',
    shipper: '',
    consignee: '',
    pieces: '',
    weight: '',
    commodity: '',
  });

  // ===== Mail Group Functions =====
  const fetchMailGroups = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pre-alert/mail-group');
      const result = await response.json();
      if (result.success) {
        setMailGroups(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching mail groups:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGroupDetail = async (groupId: number) => {
    try {
      const response = await fetch(`/api/pre-alert/mail-group?groupId=${groupId}`);
      const result = await response.json();
      if (result.success) {
        setSelectedGroup(result.data);
      }
    } catch (error) {
      console.error('Error fetching group detail:', error);
    }
  };

  const handleGroupSave = async () => {
    if (!groupFormData.group_code || !groupFormData.group_name) {
      alert('그룹 코드와 이름은 필수입니다.');
      return;
    }

    try {
      const method = selectedGroup ? 'PUT' : 'POST';
      const body = selectedGroup
        ? { ...groupFormData, group_id: selectedGroup.group_id }
        : groupFormData;

      const response = await fetch('/api/pre-alert/mail-group', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (result.success) {
        alert(result.message);
        setShowGroupModal(false);
        setSelectedGroup(null);
        resetGroupForm();
        fetchMailGroups();
      } else {
        alert('오류: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving group:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleGroupDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/pre-alert/mail-group?id=${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        alert(result.message);
        setSelectedGroup(null);
        fetchMailGroups();
      } else {
        alert('오류: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  const resetGroupForm = () => {
    setGroupFormData({
      group_code: '',
      group_name: '',
      group_type: 'GENERAL',
      biz_type: 'AIR',
      remark: '',
      use_yn: 'Y',
      addresses: [],
    });
  };

  const addGroupAddress = () => {
    setGroupFormData(prev => ({
      ...prev,
      addresses: [...(prev.addresses || []), { addr_type: 'TO', addr_name: '', email: '' }],
    }));
  };

  const removeGroupAddress = (index: number) => {
    setGroupFormData(prev => ({
      ...prev,
      addresses: prev.addresses?.filter((_, i) => i !== index),
    }));
  };

  const updateGroupAddress = (index: number, field: string, value: string) => {
    setGroupFormData(prev => ({
      ...prev,
      addresses: prev.addresses?.map((addr, i) =>
        i === index ? { ...addr, [field]: value } : addr
      ),
    }));
  };

  // ===== Settings Functions =====
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pre-alert/settings?serviceGroup=AIR');
      const result = await response.json();
      if (result.success) {
        setSettings(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSettingsSave = async () => {
    if (!formData.setting_name) {
      alert('설정명은 필수입니다.');
      return;
    }

    try {
      const method = editingItem ? 'PUT' : 'POST';
      const body = editingItem ? { ...formData, setting_id: editingItem.setting_id } : formData;

      const response = await fetch('/api/pre-alert/settings', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (result.success) {
        alert(result.message);
        setShowSettingsModal(false);
        setEditingItem(null);
        resetForm();
        fetchSettings();
      } else {
        alert('오류: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleSettingsDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/pre-alert/settings?id=${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        alert(result.message);
        fetchSettings();
      } else {
        alert('오류: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      setting_name: '',
      service_group: 'AIR',
      shipper_code: '',
      consignee_code: '',
      partner_code: '',
      pol_code: '',
      pod_code: '',
      attachment_types: '',
      base_date_type: 'ETD',
      auto_send_yn: 'N',
      auto_send_days: 0,
      auto_send_time: '',
      mail_subject: '',
      mail_body: '',
      use_yn: 'Y',
      addresses: [],
    });
  };

  const handleEdit = (item: PreAlertSetting) => {
    setEditingItem(item);
    setFormData(item);
    setShowSettingsModal(true);
  };

  const handleNew = () => {
    setEditingItem(null);
    resetForm();
    setShowSettingsModal(true);
  };

  const addAddress = () => {
    setFormData(prev => ({
      ...prev,
      addresses: [...(prev.addresses || []), { addr_type: 'TO', addr_name: '', email: '' }],
    }));
  };

  const removeAddress = (index: number) => {
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses?.filter((_, i) => i !== index),
    }));
  };

  const updateAddress = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses?.map((addr, i) =>
        i === index ? { ...addr, [field]: value } : addr
      ),
    }));
  };

  // AWB 선택 시 Pre-Alert 설정 자동 채우기
  const handleAWBSelect = (awb: AWBData) => {
    setSelectedAwb(awb);
    setFormData(prev => ({
      ...prev,
      setting_name: `Pre-Alert: ${awb.mawb_no}`,
      pol_code: awb.origin_airport_cd,
      pod_code: awb.dest_airport_cd,
      shipper_code: awb.shipper_nm || '',
      consignee_code: awb.consignee_nm || '',
      mail_subject: `[Pre-Alert] ${awb.mawb_no} - ${awb.origin_airport_cd} to ${awb.dest_airport_cd}`,
      mail_body: `Dear Partner,\n\nPlease find attached Pre-Alert information.\n\nMAWB No.: ${awb.mawb_no}\nFlight: ${awb.flight_no || 'TBA'}\nRoute: ${awb.origin_airport_cd} → ${awb.dest_airport_cd}\nETD: ${awb.etd_dt || 'TBA'}\nShipper: ${awb.shipper_nm || ''}\nConsignee: ${awb.consignee_nm || ''}\nPCS: ${awb.pieces || 0}\nGross Weight: ${awb.gross_weight_kg || 0} KG\nCommodity: ${awb.commodity_desc || ''}\n\nBest regards,\nKCS Forwarding`,
    }));
  };

  // Mail Group에서 주소 가져오기
  const handleSelectMailGroup = (group: MailGroup) => {
    if (group.addresses && group.addresses.length > 0) {
      setFormData(prev => ({
        ...prev,
        addresses: [
          ...(prev.addresses || []),
          ...group.addresses!.map(addr => ({
            addr_type: addr.addr_type,
            addr_name: addr.addr_name,
            email: addr.email,
          })),
        ],
      }));
    }
    setShowMailGroupPopup(false);
  };

  // ===== Mail Log Functions =====
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ docType: 'PRE_ALERT_AIR' });
      if (logFilters.docNo) params.append('docNo', logFilters.docNo);
      if (logFilters.status) params.append('status', logFilters.status);
      if (logFilters.startDate) params.append('startDate', logFilters.startDate);
      if (logFilters.endDate) params.append('endDate', logFilters.endDate);

      const response = await fetch(`/api/pre-alert/mail-log?${params}`);
      const result = await response.json();
      if (result.success) {
        setLogs(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  }, [logFilters]);

  const toggleExpand = (logId: number) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };

  const openMailEditor = (log: MailLog) => {
    setEditingLog(log);
    setShowMailEditor(true);
  };

  // 메일 발송 모달 열기
  const openSendModal = (setting: PreAlertSetting) => {
    setSendTargetSetting(setting);
    setSendFormData({
      doc_no: '',
      mawb_no: '',
      flight_no: '',
      origin: setting.pol_code || '',
      destination: setting.pod_code || '',
      etd: '',
      shipper: setting.shipper_code || '',
      consignee: setting.consignee_code || '',
      pieces: '',
      weight: '',
      commodity: '',
    });
    setShowSendModal(true);
  };

  // 메일 발송
  const handleSendMail = async () => {
    if (!sendTargetSetting) return;

    setSendingMail(sendTargetSetting.setting_id);
    try {
      const response = await fetch('/api/pre-alert/send-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setting_id: sendTargetSetting.setting_id,
          doc_no: sendFormData.doc_no || `PA-${Date.now()}`,
          mail_to: sendTargetSetting.addresses?.filter(a => a.addr_type === 'TO').map(a => a.email).join(', '),
          mail_cc: sendTargetSetting.addresses?.filter(a => a.addr_type === 'CC').map(a => a.email).join(', '),
          mail_subject: sendTargetSetting.mail_subject || `[Pre-Alert] ${sendFormData.doc_no}`,
          mail_body: sendTargetSetting.mail_body,
          mawb_no: sendFormData.mawb_no,
          flight_no: sendFormData.flight_no,
          origin: sendFormData.origin,
          destination: sendFormData.destination,
          etd: sendFormData.etd,
          shipper: sendFormData.shipper,
          consignee: sendFormData.consignee,
          pieces: sendFormData.pieces ? parseInt(sendFormData.pieces) : undefined,
          weight: sendFormData.weight ? parseFloat(sendFormData.weight) : undefined,
          commodity: sendFormData.commodity,
        }),
      });

      const result = await response.json();
      if (result.success) {
        let message = '메일이 성공적으로 발송되었습니다.';
        if (result.data?.previewUrl) {
          message += `\n\n테스트 메일 미리보기:\n${result.data.previewUrl}`;
        }
        alert(message);
        setShowSendModal(false);
        setSendTargetSetting(null);
        setActiveTab('logs');
        fetchLogs();
      } else {
        alert('메일 발송 실패: ' + result.error);
      }
    } catch (error) {
      console.error('Send mail error:', error);
      alert('메일 발송 중 오류가 발생했습니다.');
    } finally {
      setSendingMail(null);
    }
  };

  // 메일 재발송
  const handleResendMail = async (logId: number) => {
    if (!confirm('이 메일을 재발송하시겠습니까?')) return;

    try {
      const response = await fetch('/api/pre-alert/send-mail', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log_id: logId }),
      });

      const result = await response.json();
      if (result.success) {
        let message = '메일이 성공적으로 재발송되었습니다.';
        if (result.data?.previewUrl) {
          message += `\n\n테스트 메일 미리보기:\n${result.data.previewUrl}`;
        }
        alert(message);
        fetchLogs();
      } else {
        alert('메일 재발송 실패: ' + result.error);
      }
    } catch (error) {
      console.error('Resend mail error:', error);
      alert('메일 재발송 중 오류가 발생했습니다.');
    }
  };

  // ===== useEffect =====
  useEffect(() => {
    if (activeTab === 'mailGroup') {
      fetchMailGroups();
    } else if (activeTab === 'settings') {
      fetchSettings();
    } else {
      fetchLogs();
    }
  }, [activeTab, fetchMailGroups, fetchSettings, fetchLogs]);

  return (
    <PageLayout title="Pre-Alert 관리 (항공수출)" subtitle="Logis > 항공수출 > Pre-Alert" showCloseButton={false}>
      <main className="p-6">
        {/* 탭 메뉴 */}
        <div className="flex gap-1 border-b border-[var(--border)] mb-6">
          <button
            onClick={() => setActiveTab('mailGroup')}
            className={`flex items-center gap-2 px-6 py-3 font-medium rounded-t-lg transition-colors ${
              activeTab === 'mailGroup'
                ? 'bg-[#2563EB] text-white'
                : 'bg-[var(--surface-100)] text-[var(--muted)] hover:bg-[var(--surface-200)] hover:text-[var(--foreground)]'
            }`}
          >
            Mail Group
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-6 py-3 font-medium rounded-t-lg transition-colors ${
              activeTab === 'settings'
                ? 'bg-[#2563EB] text-white'
                : 'bg-[var(--surface-100)] text-[var(--muted)] hover:bg-[var(--surface-200)] hover:text-[var(--foreground)]'
            }`}
          >
            설정 관리
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-6 py-3 font-medium rounded-t-lg transition-colors ${
              activeTab === 'logs'
                ? 'bg-[#2563EB] text-white'
                : 'bg-[var(--surface-100)] text-[var(--muted)] hover:bg-[var(--surface-200)] hover:text-[var(--foreground)]'
            }`}
          >
            발송 이력
          </button>
        </div>

        {/* ===== Mail Group 탭 ===== */}
        {activeTab === 'mailGroup' && (
          <div className="grid grid-cols-2 gap-6">
            {/* Group List */}
            <div className="card">
              <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                <h3 className="font-bold">Group List</h3>
                <button
                  onClick={() => { setSelectedGroup(null); resetGroupForm(); setShowGroupModal(true); }}
                  className="px-4 py-1.5 text-sm font-medium rounded-lg bg-[#6366f1] text-white hover:bg-[#4f46e5]"
                >
                  신규 등록
                </button>
              </div>
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="table">
                  <thead className="sticky top-0 bg-[var(--surface-100)]">
                    <tr>
                      <th className="text-center w-16">Use</th>
                      <th className="text-center">Code</th>
                      <th className="text-center">Name</th>
                      <th className="text-center">Type</th>
                      <th className="text-center">Biz</th>
                      <th className="text-center w-16">Addr</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {loading ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--muted)]">로딩 중...</td></tr>
                    ) : mailGroups.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--muted)]">등록된 그룹이 없습니다.</td></tr>
                    ) : (
                      mailGroups.map(group => (
                        <tr
                          key={group.group_id}
                          onClick={() => fetchGroupDetail(group.group_id)}
                          className={`hover:bg-[var(--surface-50)] cursor-pointer ${selectedGroup?.group_id === group.group_id ? 'bg-blue-500/10' : ''}`}
                        >
                          <td className="px-2 py-2 text-center">
                            <span className={`px-2 py-0.5 rounded text-xs ${group.use_yn === 'Y' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                              {group.use_yn === 'Y' ? 'Y' : 'N'}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-sm text-center font-medium">{group.group_code}</td>
                          <td className="px-2 py-2 text-sm text-center">{group.group_name}</td>
                          <td className="px-2 py-2 text-sm text-center">{group.group_type}</td>
                          <td className="px-2 py-2 text-sm text-center">{group.biz_type}</td>
                          <td className="px-2 py-2 text-sm text-center">{group.address_count || 0}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Address List */}
            <div className="card">
              <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                <h3 className="font-bold">
                  Address List {selectedGroup && <span className="text-blue-400">- {selectedGroup.group_name}</span>}
                </h3>
                {selectedGroup && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setGroupFormData({ ...selectedGroup }); setShowGroupModal(true); }}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleGroupDelete(selectedGroup.group_id)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="table">
                  <thead className="sticky top-0 bg-[var(--surface-100)]">
                    <tr>
                      <th className="text-center w-20">Type</th>
                      <th className="text-center">Name</th>
                      <th className="text-center">EMAIL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {!selectedGroup ? (
                      <tr><td colSpan={3} className="px-4 py-8 text-center text-[var(--muted)]">그룹을 선택하세요.</td></tr>
                    ) : !selectedGroup.addresses || selectedGroup.addresses.length === 0 ? (
                      <tr><td colSpan={3} className="px-4 py-8 text-center text-[var(--muted)]">등록된 주소가 없습니다.</td></tr>
                    ) : (
                      selectedGroup.addresses.map((addr, idx) => (
                        <tr key={idx} className="hover:bg-[var(--surface-50)]">
                          <td className="px-2 py-2 text-center">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              addr.addr_type === 'TO' ? 'bg-blue-500/20 text-blue-400' :
                              addr.addr_type === 'CC' ? 'bg-purple-500/20 text-purple-400' :
                              addr.addr_type === 'BCC' ? 'bg-gray-500/20 text-gray-400' : 'bg-green-500/20 text-green-400'
                            }`}>
                              {addr.addr_type}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-sm text-center">{addr.addr_name}</td>
                          <td className="px-2 py-2 text-sm text-center">{addr.email}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===== Settings 탭 ===== */}
        {activeTab === 'settings' && (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={handleNew}
                className="px-6 py-2 font-semibold rounded-lg"
                style={{ background: 'linear-gradient(135deg, #E8A838 0%, #D4943A 100%)', color: '#0C1222' }}
              >
                신규 등록
              </button>
            </div>

            <div className="card overflow-hidden">
              <table className="table">
                <thead>
                  <tr>
                    <th className="text-center">설정명</th>
                    <th className="text-center">Service</th>
                    <th className="text-center">Shipper</th>
                    <th className="text-center">Consignee</th>
                    <th className="text-center">POL/POD</th>
                    <th className="text-center">Base Date</th>
                    <th className="text-center">Auto</th>
                    <th className="text-center">사용</th>
                    <th className="text-center">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {loading ? (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-[var(--muted)]">로딩 중...</td></tr>
                  ) : settings.length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-[var(--muted)]">등록된 설정이 없습니다.</td></tr>
                  ) : (
                    settings.map(item => (
                      <tr key={item.setting_id} className="hover:bg-[var(--surface-50)]">
                        <td className="px-4 py-3 text-sm font-medium text-center">{item.setting_name}</td>
                        <td className="px-4 py-3 text-sm text-center">{item.service_group}</td>
                        <td className="px-4 py-3 text-sm text-center">{item.shipper_code || '*'}</td>
                        <td className="px-4 py-3 text-sm text-center">{item.consignee_code || '*'}</td>
                        <td className="px-4 py-3 text-sm text-center">{item.pol_code || '*'} → {item.pod_code || '*'}</td>
                        <td className="px-4 py-3 text-sm text-center">{item.base_date_type}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className={`px-2 py-1 rounded text-xs ${item.auto_send_yn === 'Y' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                            {item.auto_send_yn === 'Y' ? 'ON' : 'OFF'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className={`px-2 py-1 rounded text-xs ${item.use_yn === 'Y' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                            {item.use_yn === 'Y' ? '사용' : '미사용'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => openSendModal(item)} disabled={sendingMail === item.setting_id} className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 mr-2 disabled:opacity-50">
                            {sendingMail === item.setting_id ? '발송중...' : '발송'}
                          </button>
                          <button onClick={() => handleEdit(item)} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 mr-2">수정</button>
                          <button onClick={() => handleSettingsDelete(item.setting_id)} className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">삭제</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ===== Mail Log 탭 ===== */}
        {activeTab === 'logs' && (
          <>
            <div className="card p-4 mb-4">
              <div className="grid grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Doc No.</label>
                  <input type="text" value={logFilters.docNo} onChange={e => setLogFilters(p => ({ ...p, docNo: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="MAWB No." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">상태</label>
                  <select value={logFilters.status} onChange={e => setLogFilters(p => ({ ...p, status: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm">
                    <option value="">전체</option>
                    <option value="SUCCESS">성공</option>
                    <option value="STANDBY">대기</option>
                    <option value="FAILED">실패</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">시작일</label>
                  <input type="date" value={logFilters.startDate} onChange={e => setLogFilters(p => ({ ...p, startDate: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">종료일</label>
                  <input type="date" value={logFilters.endDate} onChange={e => setLogFilters(p => ({ ...p, endDate: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" />
                </div>
                <div className="flex items-end">
                  <button onClick={fetchLogs} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">검색</button>
                </div>
              </div>
            </div>

            <div className="card overflow-hidden">
              <table className="table">
                <thead>
                  <tr>
                    <th className="text-center w-12"></th>
                    <th className="text-center">상태</th>
                    <th className="text-center">Doc No.</th>
                    <th className="text-center">제목</th>
                    <th className="text-center">From</th>
                    <th className="text-center">To</th>
                    <th className="text-center">발송일시</th>
                    <th className="text-center">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {loading ? (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-[var(--muted)]">로딩 중...</td></tr>
                  ) : logs.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-[var(--muted)]">발송 이력이 없습니다.</td></tr>
                  ) : (
                    logs.map(log => (
                      <>
                        <tr key={log.log_id} className="hover:bg-[var(--surface-50)]">
                          <td className="px-2 py-3 text-center">
                            <button onClick={() => toggleExpand(log.log_id)} className="text-[var(--muted)] hover:text-[var(--foreground)]">
                              <svg className={`w-4 h-4 transition-transform ${expandedLogId === log.log_id ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 text-xs rounded-full text-white ${statusConfig[log.status]?.color || 'bg-gray-500'}`}>
                              {statusConfig[log.status]?.label || log.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-center">{log.doc_no}</td>
                          <td className="px-4 py-3 text-sm text-center">{log.mail_subject?.substring(0, 40)}...</td>
                          <td className="px-4 py-3 text-sm text-center">{log.mail_from}</td>
                          <td className="px-4 py-3 text-sm text-center">{log.mail_to?.substring(0, 30)}...</td>
                          <td className="px-4 py-3 text-sm text-center">{log.send_dt_fmt || log.created_dt_fmt}</td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => openMailEditor(log)} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 mr-2">편집</button>
                            <button onClick={() => handleResendMail(log.log_id)} className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700">재발송</button>
                          </td>
                        </tr>
                        {expandedLogId === log.log_id && (
                          <tr key={`${log.log_id}-expanded`}>
                            <td colSpan={8} className="px-6 py-4 bg-[var(--surface-50)]">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-[var(--muted)]">CC: </span>
                                  <span>{log.mail_cc || '-'}</span>
                                </div>
                                <div>
                                  <span className="text-[var(--muted)]">Response: </span>
                                  <span className={log.status === 'FAILED' ? 'text-red-400' : ''}>{log.response_msg || '-'}</span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-[var(--muted)]">Body: </span>
                                  <pre className="mt-1 p-2 bg-[var(--surface-100)] rounded text-xs whitespace-pre-wrap">{log.mail_body || '-'}</pre>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      {/* ===== Mail Group 모달 ===== */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--surface-100)] rounded-lg shadow-xl p-6 w-[600px] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Mail Group {selectedGroup ? '수정' : '등록'}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Group Code *</label>
                <input type="text" value={groupFormData.group_code || ''} onChange={e => setGroupFormData(p => ({ ...p, group_code: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="GRP-001" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Group Name *</label>
                <input type="text" value={groupFormData.group_name || ''} onChange={e => setGroupFormData(p => ({ ...p, group_name: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="삼성전자 물류팀" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Type</label>
                <select value={groupFormData.group_type || 'GENERAL'} onChange={e => setGroupFormData(p => ({ ...p, group_type: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg">
                  <option value="GENERAL">General</option>
                  <option value="FORWARDER">Forwarder</option>
                  <option value="SHIPPER">Shipper</option>
                  <option value="PARTNER">Partner</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Biz Type</label>
                <select value={groupFormData.biz_type || 'AIR'} onChange={e => setGroupFormData(p => ({ ...p, biz_type: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg">
                  <option value="AIR">AIR</option>
                  <option value="SEA">SEA</option>
                  <option value="FORWARDING">Forwarding</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Remark</label>
                <input type="text" value={groupFormData.remark || ''} onChange={e => setGroupFormData(p => ({ ...p, remark: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">사용여부</label>
                <select value={groupFormData.use_yn || 'Y'} onChange={e => setGroupFormData(p => ({ ...p, use_yn: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg">
                  <option value="Y">사용</option>
                  <option value="N">미사용</option>
                </select>
              </div>
            </div>

            {/* 주소 목록 */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-[var(--foreground)]">Address List</label>
                <button onClick={addGroupAddress} className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">+ 추가</button>
              </div>
              {groupFormData.addresses?.map((addr, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <select value={addr.addr_type} onChange={e => updateGroupAddress(idx, 'addr_type', e.target.value)} className="h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg">
                    <option value="TO">TO</option>
                    <option value="CC">CC</option>
                    <option value="BCC">BCC</option>
                  </select>
                  <input type="text" value={addr.addr_name} onChange={e => updateGroupAddress(idx, 'addr_name', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="이름" />
                  <input type="email" value={addr.email} onChange={e => updateGroupAddress(idx, 'email', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="이메일" />
                  <button onClick={() => removeGroupAddress(idx)} className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700">X</button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowGroupModal(false); setSelectedGroup(null); }} className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">취소</button>
              <button onClick={handleGroupSave} className="px-6 py-2 font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700">저장</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Settings 모달 ===== */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--surface-100)] rounded-lg shadow-xl p-6 w-[800px] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Pre-Alert 설정 {editingItem ? '수정' : '등록'}</h2>
              <div className="flex gap-2">
                {!editingItem && (
                  <button onClick={() => setShowAWBModal(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    AWB 선택
                  </button>
                )}
                <button onClick={() => setShowMailGroupPopup(true)} className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">Mail Group</button>
              </div>
            </div>

            {selectedAwb && (
              <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-purple-400 font-medium">선택된 AWB</span>
                  <button onClick={() => setSelectedAwb(null)} className="text-xs text-red-400 hover:text-red-300">(해제)</button>
                </div>
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div><span className="text-[var(--muted)]">MAWB: </span><span className="font-medium">{selectedAwb.mawb_no}</span></div>
                  <div><span className="text-[var(--muted)]">편명: </span><span>{selectedAwb.flight_no}</span></div>
                  <div><span className="text-[var(--muted)]">구간: </span><span>{selectedAwb.origin_airport_cd} → {selectedAwb.dest_airport_cd}</span></div>
                  <div><span className="text-[var(--muted)]">ETD: </span><span>{selectedAwb.etd_dt}</span></div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">설정명 *</label>
                <input type="text" value={formData.setting_name || ''} onChange={e => setFormData(p => ({ ...p, setting_name: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="예: SKC ICN-LAX Pre-alert" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Service Group</label>
                <select value={formData.service_group || 'AIR'} onChange={e => setFormData(p => ({ ...p, service_group: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg">
                  <option value="AIR">AIR</option>
                  <option value="SEA">SEA</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Base Date</label>
                <select value={formData.base_date_type || 'ETD'} onChange={e => setFormData(p => ({ ...p, base_date_type: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg">
                  <option value="ETD">ETD</option>
                  <option value="ON_BOARD">On-board Date</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">POL</label>
                <input type="text" value={formData.pol_code || ''} onChange={e => setFormData(p => ({ ...p, pol_code: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="ICN" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">POD</label>
                <input type="text" value={formData.pod_code || ''} onChange={e => setFormData(p => ({ ...p, pod_code: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="LAX" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">첨부파일 유형</label>
                <input type="text" value={formData.attachment_types || ''} onChange={e => setFormData(p => ({ ...p, attachment_types: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="HBL,MBL,CI,PL" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">자동발송</label>
                <div className="flex items-center gap-4">
                  <select value={formData.auto_send_yn || 'N'} onChange={e => setFormData(p => ({ ...p, auto_send_yn: e.target.value }))} className="h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg">
                    <option value="Y">ON</option>
                    <option value="N">OFF</option>
                  </select>
                  <input type="time" value={formData.auto_send_time || ''} onChange={e => setFormData(p => ({ ...p, auto_send_time: e.target.value }))} className="h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">메일 제목</label>
                <input type="text" value={formData.mail_subject || ''} onChange={e => setFormData(p => ({ ...p, mail_subject: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="Pre-Alert: {MAWB_NO} - {ETD}" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">메일 본문</label>
                <textarea value={formData.mail_body || ''} onChange={e => setFormData(p => ({ ...p, mail_body: e.target.value }))} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" rows={4} placeholder="메일 본문 템플릿..." />
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-[var(--foreground)]">수신자 목록</label>
                <button onClick={addAddress} className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">+ 추가</button>
              </div>
              {formData.addresses?.map((addr, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <select value={addr.addr_type} onChange={e => updateAddress(idx, 'addr_type', e.target.value)} className="h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg">
                    <option value="FROM">FROM</option>
                    <option value="TO">TO</option>
                    <option value="CC">CC</option>
                    <option value="BCC">BCC</option>
                  </select>
                  <input type="text" value={addr.addr_name} onChange={e => updateAddress(idx, 'addr_name', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="이름" />
                  <input type="email" value={addr.email} onChange={e => updateAddress(idx, 'email', e.target.value)} className="flex-1 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="이메일" />
                  <button onClick={() => removeAddress(idx)} className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700">X</button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowSettingsModal(false); setEditingItem(null); setSelectedAwb(null); }} className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">취소</button>
              <button onClick={handleSettingsSave} className="px-6 py-2 font-semibold rounded-lg" style={{ background: 'linear-gradient(135deg, #E8A838 0%, #D4943A 100%)', color: '#0C1222' }}>저장</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Mail Group 선택 팝업 ===== */}
      {showMailGroupPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--surface-100)] rounded-lg shadow-xl p-6 w-[500px] max-h-[70vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Mail Group 선택</h2>
              <button onClick={() => setShowMailGroupPopup(false)} className="text-[var(--muted)] hover:text-[var(--foreground)]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-2">
              {mailGroups.length === 0 ? (
                <p className="text-center text-[var(--muted)] py-4">등록된 그룹이 없습니다.</p>
              ) : (
                mailGroups.map(group => (
                  <button key={group.group_id} onClick={() => { fetchGroupDetail(group.group_id); handleSelectMailGroup(group); }} className="w-full p-3 text-left bg-[var(--surface-50)] hover:bg-[var(--surface-200)] rounded-lg transition-colors">
                    <div className="font-medium">{group.group_name}</div>
                    <div className="text-sm text-[var(--muted)]">{group.group_code} · {group.address_count || 0} addresses</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== Mail Send 모달 ===== */}
      {showSendModal && sendTargetSetting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--surface-100)] rounded-lg shadow-xl p-6 w-[700px] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Pre-Alert 메일 발송</h2>
              <button onClick={() => { setShowSendModal(false); setSendTargetSetting(null); }} className="text-[var(--muted)] hover:text-[var(--foreground)]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="text-green-400 font-medium mb-2">발송 설정: {sendTargetSetting.setting_name}</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-[var(--muted)]">수신자: </span><span>{sendTargetSetting.addresses?.filter(a => a.addr_type === 'TO').map(a => a.email).join(', ') || '없음'}</span></div>
                <div><span className="text-[var(--muted)]">CC: </span><span>{sendTargetSetting.addresses?.filter(a => a.addr_type === 'CC').map(a => a.email).join(', ') || '없음'}</span></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">MAWB No.</label>
                <input type="text" value={sendFormData.mawb_no} onChange={e => setSendFormData(p => ({ ...p, mawb_no: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="180-12345678" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Flight No.</label>
                <input type="text" value={sendFormData.flight_no} onChange={e => setSendFormData(p => ({ ...p, flight_no: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="KE001" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Origin</label>
                <input type="text" value={sendFormData.origin} onChange={e => setSendFormData(p => ({ ...p, origin: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="ICN" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Destination</label>
                <input type="text" value={sendFormData.destination} onChange={e => setSendFormData(p => ({ ...p, destination: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="LAX" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ETD</label>
                <input type="date" value={sendFormData.etd} onChange={e => setSendFormData(p => ({ ...p, etd: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Pieces / Weight</label>
                <div className="flex gap-2">
                  <input type="number" value={sendFormData.pieces} onChange={e => setSendFormData(p => ({ ...p, pieces: e.target.value }))} className="w-1/2 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="PCS" />
                  <input type="number" step="0.01" value={sendFormData.weight} onChange={e => setSendFormData(p => ({ ...p, weight: e.target.value }))} className="w-1/2 h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="KG" />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Commodity</label>
                <input type="text" value={sendFormData.commodity} onChange={e => setSendFormData(p => ({ ...p, commodity: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="General Cargo" />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowSendModal(false); setSendTargetSetting(null); }} className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">취소</button>
              <button onClick={handleSendMail} disabled={sendingMail !== null} className="px-6 py-2 font-semibold rounded-lg disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: 'white' }}>
                {sendingMail !== null ? '발송 중...' : '메일 발송'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Mail Editor 모달 ===== */}
      {showMailEditor && editingLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--surface-100)] rounded-lg shadow-xl p-6 w-[700px] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Mail Editor</h2>
              <button onClick={() => { setShowMailEditor(false); setEditingLog(null); }} className="text-[var(--muted)] hover:text-[var(--foreground)]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">From</label>
                <input type="text" value={editingLog.mail_from} readOnly className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">To</label>
                <input type="text" value={editingLog.mail_to} readOnly className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">CC</label>
                <input type="text" value={editingLog.mail_cc || ''} readOnly className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Subject</label>
                <input type="text" value={editingLog.mail_subject} readOnly className="w-full h-[38px] px-3 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Body</label>
                <textarea value={editingLog.mail_body || ''} readOnly className="w-full px-3 py-2 bg-[var(--surface-200)] border border-[var(--border)] rounded-lg text-sm" rows={8} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Status</label>
                  <span className={`px-3 py-1.5 text-sm rounded-full text-white ${statusConfig[editingLog.status]?.color || 'bg-gray-500'}`}>
                    {statusConfig[editingLog.status]?.label || editingLog.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Response</label>
                  <p className={`text-sm ${editingLog.status === 'FAILED' ? 'text-red-400' : ''}`}>{editingLog.response_msg || '-'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowMailEditor(false); setEditingLog(null); }} className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">닫기</button>
              <button onClick={() => { handleResendMail(editingLog.log_id); setShowMailEditor(false); setEditingLog(null); }} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">재발송</button>
            </div>
          </div>
        </div>
      )}

      {/* AWB 선택 팝업 */}
      <AWBSelectModal isOpen={showAWBModal} onClose={() => setShowAWBModal(false)} onSelect={handleAWBSelect} />
    </PageLayout>
  );
}
