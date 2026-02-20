'use client';

import { useState, useEffect } from 'react';
import PageLayout from '@/components/PageLayout';
import Link from 'next/link';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalMenus: number;
  totalCompanies: number;
  userTypes: Array<{ USER_TYPE_CD: string; USER_TYPE_NM: string; count: number }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalMenus: 0,
    totalCompanies: 0,
    userTypes: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, menusRes, companiesRes, typesRes] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/menus'),
          fetch('/api/admin/company'),
          fetch('/api/admin/user-types'),
        ]);
        const [users, menus, companies, types] = await Promise.all([
          usersRes.json(),
          menusRes.json(),
          companiesRes.json(),
          typesRes.json(),
        ]);

        const usersArr = Array.isArray(users) ? users : [];
        const typeCounts = (Array.isArray(types) ? types : []).map((t: { USER_TYPE_CD: string; USER_TYPE_NM: string }) => ({
          ...t,
          count: usersArr.filter((u: { USER_TYPE_CD: string }) => u.USER_TYPE_CD === t.USER_TYPE_CD).length,
        }));

        setStats({
          totalUsers: usersArr.length,
          activeUsers: usersArr.filter((u: { STATUS_CD: string }) => u.STATUS_CD === 'ACTIVE').length,
          totalMenus: Array.isArray(menus) ? menus.length : 0,
          totalCompanies: Array.isArray(companies) ? companies.length : 0,
          userTypes: typeCounts,
        });
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { title: '전체 사용자', value: stats.totalUsers, icon: 'person', color: '#6e5fc9', href: '/admin/users' },
    { title: '활성 사용자', value: stats.activeUsers, icon: 'verified_user', color: '#10b981', href: '/admin/users' },
    { title: '등록 메뉴', value: stats.totalMenus, icon: 'menu', color: '#f59e0b', href: '/admin/permissions' },
    { title: '등록 회사', value: stats.totalCompanies, icon: 'business', color: '#3b82f6', href: '/admin/company' },
  ];

  return (
    <PageLayout title="관리자 대시보드" subtitle="Admin Dashboard">
      <main className="p-6 space-y-6">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="bg-[var(--surface-card)] rounded-xl p-5 border border-[var(--border)] hover:shadow-lg transition-all duration-200 group"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: `${card.color}15` }}
                >
                  <span className="material-icons-round text-xl" style={{ color: card.color }}>
                    {card.icon}
                  </span>
                </div>
                <span className="material-icons-round text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">
                  arrow_forward
                </span>
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {loading ? '-' : card.value.toLocaleString()}
              </p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{card.title}</p>
            </Link>
          ))}
        </div>

        {/* 빠른 메뉴 */}
        <div className="bg-[var(--surface-card)] rounded-xl border border-[var(--border)] p-6">
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">빠른 메뉴</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/users"
              className="flex items-center gap-3 p-4 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <span className="material-icons-round text-[#6e5fc9]">group</span>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">사용자 관리</p>
                <p className="text-xs text-[var(--text-secondary)]">사용자 등록, 수정, 삭제</p>
              </div>
            </Link>
            <Link
              href="/admin/permissions"
              className="flex items-center gap-3 p-4 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <span className="material-icons-round text-[#f59e0b]">security</span>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">권한 관리</p>
                <p className="text-xs text-[var(--text-secondary)]">메뉴별 CRUD 권한 설정</p>
              </div>
            </Link>
            <Link
              href="/admin/company"
              className="flex items-center gap-3 p-4 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <span className="material-icons-round text-[#3b82f6]">business</span>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">자사 관리</p>
                <p className="text-xs text-[var(--text-secondary)]">회사 정보 등록 및 수정</p>
              </div>
            </Link>
          </div>
        </div>

        {/* 사용자 유형별 현황 */}
        <div className="bg-[var(--surface-card)] rounded-xl border border-[var(--border)] p-6">
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">사용자 유형별 현황</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#6e5fc9] text-white">
                  <th className="text-left px-4 py-2.5 font-medium rounded-tl-lg">유형코드</th>
                  <th className="text-left px-4 py-2.5 font-medium">유형명</th>
                  <th className="text-right px-4 py-2.5 font-medium rounded-tr-lg">사용자 수</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={3} className="text-center py-8 text-[var(--text-muted)]">로딩 중...</td></tr>
                ) : stats.userTypes.length === 0 ? (
                  <tr><td colSpan={3} className="text-center py-8 text-[var(--text-muted)]">데이터가 없습니다.</td></tr>
                ) : (
                  stats.userTypes.map((t, i) => (
                    <tr key={t.USER_TYPE_CD} className={`border-b border-[var(--border)] ${i % 2 === 1 ? 'bg-[var(--surface-hover)]' : ''}`}>
                      <td className="px-4 py-2.5 font-mono text-xs">{t.USER_TYPE_CD}</td>
                      <td className="px-4 py-2.5">{t.USER_TYPE_NM}</td>
                      <td className="px-4 py-2.5 text-right font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {t.count}
                      </td>
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
