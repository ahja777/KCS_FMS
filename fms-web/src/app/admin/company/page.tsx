'use client';

import React, { useState, useEffect, useCallback } from 'react';
import PageLayout from '@/components/PageLayout';
import Modal from '@/components/Modal';

interface Company {
  COMPANY_CD: string;
  COMPANY_NM: string;
  COMPANY_NM_EN: string;
  BIZ_NO: string;
  CORP_NO: string;
  CEO_NM: string;
  BIZ_TYPE: string;
  BIZ_ITEM: string;
  ADDRESS: string;
  ADDRESS_EN: string;
  TEL: string;
  FAX: string;
  EMAIL: string;
  HOMEPAGE: string;
  LOGO_PATH: string;
  USE_YN: string;
  CREATED_DTM: string;
}

export default function CompanyPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editCompany, setEditCompany] = useState<Partial<Company> | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/company');
      const data = await res.json();
      setCompanies(Array.isArray(data) ? data : []);
    } catch {
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const handleNew = () => {
    setEditCompany({ USE_YN: 'Y' });
    setIsEdit(false);
    setShowModal(true);
  };

  const handleEdit = (c: Company) => {
    setEditCompany({ ...c });
    setIsEdit(true);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editCompany) return;
    if (!editCompany.COMPANY_CD || !editCompany.COMPANY_NM) {
      alert('회사코드와 회사명은 필수입니다.');
      return;
    }
    try {
      const res = await fetch('/api/admin/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editCompany),
      });
      if (res.ok) {
        alert('저장되었습니다.');
        setShowModal(false);
        fetchCompanies();
      } else {
        const data = await res.json();
        alert(data.error || '저장 실패');
      }
    } catch {
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async () => {
    if (selectedCodes.size === 0) { alert('삭제할 회사를 선택해주세요.'); return; }
    if (!confirm(`${selectedCodes.size}건을 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch('/api/admin/company', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyCodes: Array.from(selectedCodes) }),
      });
      if (res.ok) {
        alert('삭제되었습니다.');
        setSelectedCodes(new Set());
        fetchCompanies();
      }
    } catch {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleSelectAll = () => {
    if (selectedCodes.size === companies.length) {
      setSelectedCodes(new Set());
    } else {
      setSelectedCodes(new Set(companies.map(c => c.COMPANY_CD)));
    }
  };

  const handleSelect = (cd: string) => {
    setSelectedCodes(prev => {
      const next = new Set(prev);
      if (next.has(cd)) next.delete(cd); else next.add(cd);
      return next;
    });
  };

  const InputField = ({ label, field, required, span2 }: { label: string; field: keyof Company; required?: boolean; span2?: boolean }) => (
    <div className={`flex flex-col gap-1 ${span2 ? 'col-span-2' : ''}`}>
      <label className="text-xs font-medium text-[var(--text-secondary)]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        value={(editCompany?.[field] as string) || ''}
        onChange={e => setEditCompany(prev => ({ ...prev, [field]: e.target.value }))}
        disabled={isEdit && field === 'COMPANY_CD'}
        className="h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#6e5fc9]/30 disabled:opacity-50"
      />
    </div>
  );

  return (
    <PageLayout title="자사 관리" subtitle="Company Management">
      <main className="p-6 space-y-4">
        {/* 도구 영역 */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-[var(--text-secondary)]">
            총 <span className="font-semibold text-[var(--text-primary)]">{companies.length}</span>건
            {selectedCodes.size > 0 && <span className="ml-2 text-[#6e5fc9]">(선택: {selectedCodes.size}건)</span>}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleNew}
              className="h-8 px-3 rounded-lg bg-[#6e5fc9] text-white text-xs font-medium hover:bg-[#5d4fb8] transition-colors flex items-center gap-1"
            >
              <span className="material-icons-round text-sm">add</span> 신규등록
            </button>
            <button
              onClick={handleDelete}
              className="h-8 px-3 rounded-lg border border-red-300 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors flex items-center gap-1"
            >
              <span className="material-icons-round text-sm">delete</span> 삭제
            </button>
          </div>
        </div>

        {/* 테이블 */}
        <div className="bg-[var(--surface-card)] rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#6e5fc9] text-white">
                  <th className="w-10 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={companies.length > 0 && selectedCodes.size === companies.length}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="text-left px-3 py-2.5 font-medium">회사코드</th>
                  <th className="text-left px-3 py-2.5 font-medium">회사명</th>
                  <th className="text-left px-3 py-2.5 font-medium">영문명</th>
                  <th className="text-left px-3 py-2.5 font-medium">사업자번호</th>
                  <th className="text-left px-3 py-2.5 font-medium">대표자</th>
                  <th className="text-left px-3 py-2.5 font-medium">전화번호</th>
                  <th className="text-left px-3 py-2.5 font-medium">이메일</th>
                  <th className="px-3 py-2.5 font-medium text-center">관리</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-12 text-[var(--text-muted)]">로딩 중...</td></tr>
                ) : companies.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-[var(--text-muted)]">등록된 회사가 없습니다.</td></tr>
                ) : (
                  companies.map((c, i) => (
                    <tr
                      key={c.COMPANY_CD}
                      className={`border-b border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors ${i % 2 === 1 ? 'bg-[var(--surface-base)]/30' : ''}`}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedCodes.has(c.COMPANY_CD)}
                          onChange={() => handleSelect(c.COMPANY_CD)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-3 py-2 font-mono text-xs font-medium text-[#6e5fc9]">{c.COMPANY_CD}</td>
                      <td className="px-3 py-2 font-medium">{c.COMPANY_NM}</td>
                      <td className="px-3 py-2 text-[var(--text-secondary)]">{c.COMPANY_NM_EN || '-'}</td>
                      <td className="px-3 py-2 text-[var(--text-secondary)]">{c.BIZ_NO || '-'}</td>
                      <td className="px-3 py-2">{c.CEO_NM || '-'}</td>
                      <td className="px-3 py-2 text-[var(--text-secondary)]">{c.TEL || '-'}</td>
                      <td className="px-3 py-2 text-[var(--text-secondary)]">{c.EMAIL || '-'}</td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => handleEdit(c)}
                          className="text-[#6e5fc9] hover:text-[#5d4fb8] text-xs font-medium"
                        >
                          수정
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 회사 등록/수정 모달 */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={isEdit ? '회사 정보 수정' : '회사 등록'}
          size="xl"
        >
          {editCompany && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InputField label="회사코드" field="COMPANY_CD" required />
                <InputField label="회사명" field="COMPANY_NM" required />
                <InputField label="영문 회사명" field="COMPANY_NM_EN" />
                <InputField label="사업자번호" field="BIZ_NO" />
                <InputField label="법인번호" field="CORP_NO" />
                <InputField label="대표자명" field="CEO_NM" />
                <InputField label="업태" field="BIZ_TYPE" />
                <InputField label="업종" field="BIZ_ITEM" />
                <InputField label="주소" field="ADDRESS" span2 />
                <InputField label="영문 주소" field="ADDRESS_EN" span2 />
                <InputField label="전화번호" field="TEL" />
                <InputField label="팩스번호" field="FAX" />
                <InputField label="이메일" field="EMAIL" />
                <InputField label="홈페이지" field="HOMEPAGE" />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border)]">
                <button
                  onClick={() => setShowModal(false)}
                  className="h-9 px-4 rounded-lg border border-[var(--border)] text-sm text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  className="h-9 px-4 rounded-lg bg-[#6e5fc9] text-white text-sm font-medium hover:bg-[#5d4fb8] transition-colors"
                >
                  저장
                </button>
              </div>
            </div>
          )}
        </Modal>
      </main>
    </PageLayout>
  );
}
