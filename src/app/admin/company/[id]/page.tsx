'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
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

const emptyCompany: Partial<Company> = {
  COMPANY_CD: '',
  COMPANY_NM: '',
  COMPANY_NM_EN: '',
  BIZ_NO: '',
  CORP_NO: '',
  CEO_NM: '',
  BIZ_TYPE: '',
  BIZ_ITEM: '',
  ADDRESS: '',
  ADDRESS_EN: '',
  TEL: '',
  FAX: '',
  EMAIL: '',
  HOMEPAGE: '',
  LOGO_PATH: '',
  USE_YN: 'Y',
};

export default function CompanyEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const isNew = id === 'new';
  const [formData, setFormData] = useState<Partial<Company>>(emptyCompany);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const fetchCompany = useCallback(async () => {
    if (isNew) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/company?companyCd=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setFormData(data[0]);
      } else {
        alert('회사 정보를 찾을 수 없습니다.');
        router.push('/admin/company');
      }
    } catch {
      alert('데이터 로드 중 오류가 발생했습니다.');
      router.push('/admin/company');
    } finally {
      setLoading(false);
    }
  }, [id, isNew, router]);

  useEffect(() => { fetchCompany(); }, [fetchCompany]);

  const handleChange = (field: keyof Company, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.COMPANY_CD || !formData.COMPANY_NM) {
      alert('회사코드와 회사명은 필수입니다.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        alert('저장되었습니다.');
        router.push('/admin/company');
      } else {
        const data = await res.json();
        alert(data.error || '저장 실패');
      }
    } catch {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/company');
  };

  const InputField = ({ label, field, required, disabled, span2 }: {
    label: string; field: keyof Company; required?: boolean; disabled?: boolean; span2?: boolean;
  }) => (
    <div className={`flex flex-col gap-1 ${span2 ? 'col-span-2' : ''}`}>
      <label className="text-xs font-medium text-gray-500">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        value={(formData[field] as string) || ''}
        onChange={e => handleChange(field, e.target.value)}
        disabled={disabled}
        className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6e5fc9]/30 disabled:bg-gray-100 disabled:text-gray-400"
      />
    </div>
  );

  if (loading) {
    return (
      <PageLayout title="자사 관리" subtitle="Company Management">
        <main className="p-6">
          <div className="flex items-center justify-center py-20 text-gray-400">데이터 로딩 중...</div>
        </main>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="자사 관리" subtitle={isNew ? '신규 등록' : '정보 수정'}>
      <main className="p-6 space-y-6">
        {/* 헤더 영역 */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#6e5fc9]/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#6e5fc9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {isNew ? '회사 신규 등록' : `회사 정보 수정`}
              </h2>
              {!isNew && (
                <p className="text-xs text-gray-400 mt-0.5">회사코드: {id}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="h-9 px-4 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-9 px-4 rounded-lg bg-[#6e5fc9] text-white text-sm font-medium hover:bg-[#5d4fb8] transition-colors disabled:opacity-50"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>

        {/* 기본 정보 */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">기본 정보</h3>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4">
            <InputField label="회사코드" field="COMPANY_CD" required disabled={!isNew} />
            <InputField label="회사명" field="COMPANY_NM" required />
            <InputField label="영문 회사명" field="COMPANY_NM_EN" />
            <InputField label="대표자명" field="CEO_NM" />
          </div>
        </div>

        {/* 사업자 정보 */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">사업자 정보</h3>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4">
            <InputField label="사업자번호" field="BIZ_NO" />
            <InputField label="법인번호" field="CORP_NO" />
            <InputField label="업태" field="BIZ_TYPE" />
            <InputField label="업종" field="BIZ_ITEM" />
          </div>
        </div>

        {/* 주소 정보 */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">주소 정보</h3>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4">
            <InputField label="주소" field="ADDRESS" span2 />
            <InputField label="영문 주소" field="ADDRESS_EN" span2 />
          </div>
        </div>

        {/* 연락처 정보 */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">연락처 정보</h3>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4">
            <InputField label="전화번호" field="TEL" />
            <InputField label="팩스번호" field="FAX" />
            <InputField label="이메일" field="EMAIL" />
            <InputField label="홈페이지" field="HOMEPAGE" />
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={handleCancel}
            className="h-9 px-5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            목록으로
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-5 rounded-lg bg-[#6e5fc9] text-white text-sm font-medium hover:bg-[#5d4fb8] transition-colors disabled:opacity-50"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </main>
    </PageLayout>
  );
}
