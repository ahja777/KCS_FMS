'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';

interface PartnerData {
  id: string;
  partnerCode: string;
  partnerName: string;
  partnerNameEn: string;
  country: string;
  city: string;
  phone: string;
  email: string;
  contactPerson: string;
  partnerType: 'FORWARDER' | 'AGENT' | 'BROKER';
  useYn: 'Y' | 'N';
}

const partnerTypeConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  FORWARDER: { label: 'Forwarder', color: '#2563EB', bgColor: '#DBEAFE' },
  AGENT: { label: 'Agent', color: '#7C3AED', bgColor: '#EDE9FE' },
  BROKER: { label: 'Broker', color: '#EA580C', bgColor: '#FED7AA' },
};

const sampleData: PartnerData[] = [
  { id: '1', partnerCode: 'PTN-001', partnerName: '케이로직스 재팬', partnerNameEn: 'K-Logix Japan', country: 'JP', city: 'Tokyo', phone: '+81-3-1234-5678', email: 'info@klogix-jp.com', contactPerson: 'Tanaka', partnerType: 'FORWARDER', useYn: 'Y' },
  { id: '2', partnerCode: 'PTN-002', partnerName: '글로벌 쉬핑 상하이', partnerNameEn: 'Global Shipping Shanghai', country: 'CN', city: 'Shanghai', phone: '+86-21-8765-4321', email: 'ops@gshipping.cn', contactPerson: 'Wang Lei', partnerType: 'AGENT', useYn: 'Y' },
  { id: '3', partnerCode: 'PTN-003', partnerName: '유로프레이트 함부르크', partnerNameEn: 'Euro Freight Hamburg', country: 'DE', city: 'Hamburg', phone: '+49-40-1234-567', email: 'contact@eurofreight.de', contactPerson: 'Schmidt', partnerType: 'FORWARDER', useYn: 'Y' },
  { id: '4', partnerCode: 'PTN-004', partnerName: 'LA 커스텀스 브로커', partnerNameEn: 'LA Customs Broker', country: 'US', city: 'Los Angeles', phone: '+1-213-555-0100', email: 'broker@lacustoms.com', contactPerson: 'John Smith', partnerType: 'BROKER', useYn: 'Y' },
  { id: '5', partnerCode: 'PTN-005', partnerName: '싱가포르 로지스틱스', partnerNameEn: 'Singapore Logistics Pte', country: 'SG', city: 'Singapore', phone: '+65-6789-0123', email: 'ops@sglogistics.sg', contactPerson: 'Tan Wei', partnerType: 'AGENT', useYn: 'N' },
  { id: '6', partnerCode: 'PTN-006', partnerName: '방콕 트랜스포트', partnerNameEn: 'Bangkok Transport Co.', country: 'TH', city: 'Bangkok', phone: '+66-2-345-6789', email: 'info@bkktransport.th', contactPerson: 'Somchai', partnerType: 'FORWARDER', useYn: 'Y' },
];

export default function PartnerManagePage() {
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);

  const handleConfirmClose = () => {
    setShowCloseModal(false);
    router.back();
  };

  useCloseConfirm({
    showModal: showCloseModal,
    setShowModal: setShowCloseModal,
    onConfirmClose: handleConfirmClose,
  });

  const [filters, setFilters] = useState({
    keyword: '',
    country: '',
    partnerType: '',
    useYn: '',
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partial<PartnerData> | null>(null);
  const [isNew, setIsNew] = useState(false);

  const handleSearch = () => setAppliedFilters({ ...filters });
  const handleReset = () => {
    const resetFilters = { keyword: '', country: '', partnerType: '', useYn: '' };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
  };

  const filteredData = useMemo(() => {
    return sampleData.filter(item => {
      if (appliedFilters.keyword) {
        const kw = appliedFilters.keyword.toLowerCase();
        if (!item.partnerCode.toLowerCase().includes(kw) && !item.partnerName.toLowerCase().includes(kw) && !item.partnerNameEn.toLowerCase().includes(kw)) return false;
      }
      if (appliedFilters.country && item.country !== appliedFilters.country) return false;
      if (appliedFilters.partnerType && item.partnerType !== appliedFilters.partnerType) return false;
      if (appliedFilters.useYn && item.useYn !== appliedFilters.useYn) return false;
      return true;
    });
  }, [appliedFilters]);

  const handleNew = () => {
    setEditingPartner({ partnerCode: '', partnerName: '', partnerNameEn: '', country: '', city: '', phone: '', email: '', contactPerson: '', partnerType: 'FORWARDER', useYn: 'Y' });
    setIsNew(true);
    setShowModal(true);
  };

  const handleEdit = (partner: PartnerData) => {
    setEditingPartner({ ...partner });
    setIsNew(false);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!editingPartner?.partnerCode || !editingPartner?.partnerName) {
      alert('파트너코드와 파트너명은 필수입니다.');
      return;
    }
    alert(`${isNew ? '등록' : '수정'}이 완료되었습니다. (샘플)`);
    setShowModal(false);
  };

  const countries = [...new Set(sampleData.map(d => d.country))];

  return (
    <PageLayout title="파트너 관리" subtitle="Logis > 공통 > 파트너 관리" onClose={() => setShowCloseModal(true)}>
      <main className="p-6">
        <div className="flex justify-end items-center mb-4">
          <button onClick={handleNew} className="px-4 py-2 bg-[#E8A838] text-[#0C1222] rounded-lg hover:bg-[#d4962f] font-medium">
            신규
          </button>
        </div>

        <div className="card mb-6">
          <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="font-bold">검색조건</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-6 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">파트너코드/명</label>
                <input type="text" value={filters.keyword} onChange={e => setFilters(prev => ({ ...prev, keyword: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleSearch()} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm" placeholder="코드, 파트너명, 영문명" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">국가</label>
                <select value={filters.country} onChange={e => setFilters(prev => ({ ...prev, country: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm">
                  <option value="">전체</option>
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">구분</label>
                <select value={filters.partnerType} onChange={e => setFilters(prev => ({ ...prev, partnerType: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm">
                  <option value="">전체</option>
                  <option value="FORWARDER">Forwarder</option>
                  <option value="AGENT">Agent</option>
                  <option value="BROKER">Broker</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">사용여부</label>
                <select value={filters.useYn} onChange={e => setFilters(prev => ({ ...prev, useYn: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--border-hover)] text-sm">
                  <option value="">전체</option>
                  <option value="Y">사용</option>
                  <option value="N">미사용</option>
                </select>
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-[var(--border)] flex justify-center gap-2">
            <button onClick={handleSearch} className="px-6 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] font-medium">조회</button>
            <button onClick={handleReset} className="px-6 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">초기화</button>
          </div>
        </div>

        <div className="card">
          <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h3 className="font-bold">파트너 목록</h3>
              <span className="px-2 py-1 bg-[#E8A838]/20 text-[#E8A838] rounded text-sm font-medium">{filteredData.length}건</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="text-center">파트너코드</th>
                  <th>파트너명</th>
                  <th>영문명</th>
                  <th className="text-center">국가</th>
                  <th className="text-center">도시</th>
                  <th>연락처</th>
                  <th>이메일</th>
                  <th>담당자</th>
                  <th className="text-center">구분</th>
                  <th className="text-center">사용여부</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr><td colSpan={10} className="p-8 text-center text-[var(--muted)]">조회된 데이터가 없습니다.</td></tr>
                ) : (
                  filteredData.map(row => (
                    <tr key={row.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-50)] cursor-pointer" onDoubleClick={() => handleEdit(row)}>
                      <td className="p-3 text-center text-[#2563EB] font-medium font-mono">{row.partnerCode}</td>
                      <td className="p-3 text-sm">{row.partnerName}</td>
                      <td className="p-3 text-sm">{row.partnerNameEn}</td>
                      <td className="p-3 text-sm text-center">{row.country}</td>
                      <td className="p-3 text-sm text-center">{row.city}</td>
                      <td className="p-3 text-sm">{row.phone}</td>
                      <td className="p-3 text-sm">{row.email}</td>
                      <td className="p-3 text-sm">{row.contactPerson}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-1 rounded text-xs font-medium" style={{ color: partnerTypeConfig[row.partnerType]?.color, backgroundColor: partnerTypeConfig[row.partnerType]?.bgColor }}>{partnerTypeConfig[row.partnerType]?.label}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ color: row.useYn === 'Y' ? '#059669' : '#6B7280', backgroundColor: row.useYn === 'Y' ? '#D1FAE5' : '#F3F4F6' }}>{row.useYn === 'Y' ? '사용' : '미사용'}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <CloseConfirmModal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} onConfirm={handleConfirmClose} />

      {showModal && editingPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-[640px] max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <h3 className="font-bold">{isNew ? '파트너 등록' : '파트너 수정'}</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">파트너코드 <span className="text-red-500">*</span></label>
                  <input type="text" value={editingPartner.partnerCode || ''} disabled={!isNew} onChange={e => setEditingPartner(prev => ({ ...prev, partnerCode: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm disabled:opacity-60" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">구분</label>
                  <select value={editingPartner.partnerType || 'FORWARDER'} onChange={e => setEditingPartner(prev => ({ ...prev, partnerType: e.target.value as PartnerData['partnerType'] }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm">
                    <option value="FORWARDER">Forwarder</option>
                    <option value="AGENT">Agent</option>
                    <option value="BROKER">Broker</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">파트너명 <span className="text-red-500">*</span></label>
                  <input type="text" value={editingPartner.partnerName || ''} onChange={e => setEditingPartner(prev => ({ ...prev, partnerName: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">영문명</label>
                  <input type="text" value={editingPartner.partnerNameEn || ''} onChange={e => setEditingPartner(prev => ({ ...prev, partnerNameEn: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">국가</label>
                  <input type="text" value={editingPartner.country || ''} onChange={e => setEditingPartner(prev => ({ ...prev, country: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" placeholder="KR, US, JP..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">도시</label>
                  <input type="text" value={editingPartner.city || ''} onChange={e => setEditingPartner(prev => ({ ...prev, city: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">사용여부</label>
                  <select value={editingPartner.useYn || 'Y'} onChange={e => setEditingPartner(prev => ({ ...prev, useYn: e.target.value as 'Y' | 'N' }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm">
                    <option value="Y">사용</option>
                    <option value="N">미사용</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">연락처</label>
                  <input type="text" value={editingPartner.phone || ''} onChange={e => setEditingPartner(prev => ({ ...prev, phone: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">이메일</label>
                  <input type="text" value={editingPartner.email || ''} onChange={e => setEditingPartner(prev => ({ ...prev, email: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">담당자</label>
                <input type="text" value={editingPartner.contactPerson || ''} onChange={e => setEditingPartner(prev => ({ ...prev, contactPerson: e.target.value }))} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-sm" />
              </div>
            </div>
            <div className="p-4 border-t border-[var(--border)] flex justify-center gap-2">
              <button onClick={handleSave} className="px-6 py-2 bg-[#E8A838] text-[#0C1222] rounded-lg hover:bg-[#d4962f] font-medium">저장</button>
              <button onClick={() => setShowModal(false)} className="px-6 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]">취소</button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
