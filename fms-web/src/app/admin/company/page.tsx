'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';

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
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
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
    router.push('/admin/company/new');
  };

  const handleRowClick = (companyCd: string) => {
    router.push(`/admin/company/${companyCd}`);
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

  const handleSelect = (cd: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCodes(prev => {
      const next = new Set(prev);
      if (next.has(cd)) next.delete(cd); else next.add(cd);
      return next;
    });
  };

  return (
    <PageLayout title="자사 관리" subtitle="Company Management">
      <main className="p-6 space-y-4">
        {/* 도구 영역 */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">
            총 <span className="font-semibold text-gray-900">{companies.length}</span>건
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
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400">로딩 중...</td></tr>
                ) : companies.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400">등록된 회사가 없습니다.</td></tr>
                ) : (
                  companies.map((c, i) => (
                    <tr
                      key={c.COMPANY_CD}
                      onClick={() => handleRowClick(c.COMPANY_CD)}
                      className={`border-b border-gray-100 hover:bg-[#6e5fc9]/5 cursor-pointer transition-colors ${i % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'}`}
                    >
                      <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedCodes.has(c.COMPANY_CD)}
                          onChange={() => {}}
                          onClick={e => handleSelect(c.COMPANY_CD, e)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-3 py-2 font-mono text-xs font-medium text-[#6e5fc9]">{c.COMPANY_CD}</td>
                      <td className="px-3 py-2 font-medium text-gray-900">{c.COMPANY_NM}</td>
                      <td className="px-3 py-2 text-gray-500">{c.COMPANY_NM_EN || '-'}</td>
                      <td className="px-3 py-2 text-gray-500">{c.BIZ_NO || '-'}</td>
                      <td className="px-3 py-2 text-gray-900">{c.CEO_NM || '-'}</td>
                      <td className="px-3 py-2 text-gray-500">{c.TEL || '-'}</td>
                      <td className="px-3 py-2 text-gray-500">{c.EMAIL || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </PageLayout>
  );
}
