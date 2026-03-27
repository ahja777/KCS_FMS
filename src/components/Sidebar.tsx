'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect, memo } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';

// 메뉴 아이템 타입 정의
interface SubMenuItem {
  title: string;
  href: string;
}

interface CategoryItem {
  title: string;
  children: SubMenuItem[];
}

interface MenuItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  subItems?: SubMenuItem[];
  categories?: CategoryItem[];
}

// 미니멀한 선형 아이콘 컴포넌트
const icons = {
  dashboard: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  ),
  scenario: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
    </svg>
  ),
  learning: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
  ),
  deploy: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  ),
  dictionary: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  message: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  ),
  integration: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  customer: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  inbound: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  ),
  outbound: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
    </svg>
  ),
  history: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  statistics: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  batch: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  logistics: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  shipment: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  ),
  document: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  calendar: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  ),
  customs: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
  billing: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  ),
  code: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
    </svg>
  ),
  customsAccount: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  ),
  admin: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
    </svg>
  ),
};

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: icons.dashboard,
  },
  {
    title: 'Logis',
    href: '/logis',
    icon: icons.logistics,
    categories: [
      {
        title: 'Seller',
        children: [
          { title: '스케줄조회(화주)', href: '/logis/schedule/shipper' },
          { title: '견적요청', href: '/logis/quote/request' },
          { title: '화물반출입', href: '/logis/cargo/release' },
        ],
      },
      {
        title: 'OMS',
        children: [
          { title: '고객오더 (C/O)', href: '/logis/oms/customer-order' },
          { title: '서비스오더 (S/O)', href: '/logis/oms/service-order' },
          { title: '오더타입 관리', href: '/logis/oms/order-type' },
          { title: 'S/O Control', href: '/logis/oms/so-control' },
        ],
      },
      {
        title: '해상수출',
        children: [
          { title: '스케줄관리', href: '/logis/schedule/sea' },
          { title: '견적관리', href: '/logis/quote/sea' },
          { title: '부킹관리', href: '/logis/booking/sea' },
          { title: 'S/R 선적요청', href: '/logis/sr/sea' },
          { title: 'S/N 선적통지', href: '/logis/sn/sea' },
          { title: 'Master B/L 관리', href: '/logis/bl/sea/master' },
          { title: 'House B/L 관리', href: '/logis/bl/sea/house' },
          { title: 'STUFFING', href: '/logis/export/stuffing' },
          { title: 'CLP', href: '/logis/export/clp' },
          { title: 'VGM', href: '/logis/export/vgm' },
        ],
      },
      {
        title: '해상수입',
        children: [
          { title: '스케줄관리', href: '/logis/schedule/sea' },
          { title: 'Master B/L 관리', href: '/logis/import-bl/sea/master' },
          { title: 'House B/L 관리', href: '/logis/import-bl/sea/house' },
          { title: '도착통지 (A/N)', href: '/logis/an/sea' },
          { title: '수입통관 관리', href: '/logis/import/customs/sea' },
        ],
      },
      {
        title: '항공수출',
        children: [
          { title: '스케줄관리', href: '/logis/schedule/air' },
          { title: '견적관리', href: '/logis/quote/air' },
          { title: '부킹관리', href: '/logis/booking/air' },
          { title: 'Master AWB 관리', href: '/logis/bl/air/master' },
          { title: 'House AWB 관리', href: '/logis/bl/air/house' },
          { title: 'Pre-Alert', href: '/logis/pre-alert/air' },
          { title: 'AMS', href: '/logis/ams/sea' },
        ],
      },
      {
        title: '항공수입',
        children: [
          { title: '스케줄관리', href: '/logis/schedule/air' },
          { title: 'Master AWB 관리', href: '/logis/import-bl/air/master' },
          { title: 'House AWB 관리', href: '/logis/import-bl/air/house' },
          { title: '도착통지 (A/N)', href: '/logis/an/air' },
        ],
      },
      {
        title: '공통',
        children: [
          { title: '컨테이너공유', href: '/logis/container/share' },
          { title: '수출입서류', href: '/logis/document' },
          { title: '화물추적', href: '/logis/tracking' },
          { title: 'B/L 통합관리', href: '/logis/bl/manage' },
          { title: '화물추적관리', href: '/logis/cargo/trace' },
          { title: '내륙운송관리', href: '/logis/transport/inland' },
          { title: '파트너관리', href: '/logis/common/partner' },
        ],
      },
    ],
  },
  {
    title: 'B/L Management',
    href: '/bl',
    icon: icons.document,
  },
  {
    title: 'Schedules',
    href: '/schedules',
    icon: icons.calendar,
  },
  {
    title: 'Customs Account',
    href: '/logis/customs-account/sea',
    icon: icons.customsAccount,
  },
  {
    title: 'Billing',
    href: '/billing',
    icon: icons.billing,
  },
  {
    title: '적하목록',
    href: '/logis/manifest/sea',
    icon: icons.document,
  },
  {
    title: 'Code Management',
    href: '/logis/common/code',
    icon: icons.code,
    subItems: [
      { title: '코드관리', href: '/logis/common/code' },
      { title: '운임기초정보', href: '/logis/rate/base' },
      { title: '기업운임관리(해상)', href: '/logis/rate/corporate/sea' },
      { title: '기업운임관리(항공)', href: '/logis/rate/corporate/air' },
      { title: '환율조회', href: '/logis/exchange-rate' },
      { title: '항공운임 Tariff', href: '/logis/common/air-tariff' },
    ],
  },
  {
    title: '관리자',
    href: '/admin',
    icon: icons.admin,
    subItems: [
      { title: '사용자관리', href: '/admin/users' },
      { title: '권한관리', href: '/admin/permissions' },
      { title: '자사관리', href: '/admin/company' },
    ],
  },
];

// localStorage 키
const STORAGE_KEY = 'fms_sidebar_expanded';

function SidebarComponent() {
  const pathname = usePathname();
  const { isSidebarOpen, closeSidebar } = useSidebar();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Logis']);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // localStorage에서 상태 복원
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.menus) setExpandedMenus(parsed.menus);
        if (parsed.categories) setExpandedCategories(parsed.categories);
      } catch {
        // 파싱 실패시 기본값 유지
      }
    }

    // 현재 경로에 맞는 카테고리 자동 펼침
    const currentCategory = menuItems
      .find(item => item.categories)
      ?.categories?.find(cat =>
        cat.children.some(child => pathname.startsWith(child.href))
      );
    if (currentCategory && !expandedCategories.includes(currentCategory.title)) {
      setExpandedCategories(prev => [...prev, currentCategory.title]);
    }
  }, []);

  // 모바일에서 페이지 이동 시 사이드바 닫기
  useEffect(() => {
    closeSidebar();
  }, [pathname, closeSidebar]);

  // 상태 변경시 localStorage 저장
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      menus: expandedMenus,
      categories: expandedCategories,
    }));
  }, [expandedMenus, expandedCategories]);

  const toggleMenu = (title: string) => {
    setExpandedMenus(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  // 아코디언 방식: 다른 카테고리 클릭 시 기존 카테고리 닫기
  const toggleCategory = (title: string) => {
    setExpandedCategories(prev =>
      prev.includes(title) ? [] : [title]
    );
  };

  return (
    <>
    {/* Mobile backdrop */}
    <div
      className={`sidebar-backdrop ${isSidebarOpen ? 'active' : ''}`}
      onClick={closeSidebar}
    />
    <aside
      className={`sidebar fixed left-0 top-0 h-screen w-56 flex flex-col z-40 border-r bg-[var(--surface-elevated)] border-[var(--border)] ${isSidebarOpen ? 'sidebar-open' : ''}`}
    >
      {/* Logo Section - 헤더와 동일한 높이 (h-20 = 80px) */}
      <Link
        href="/"
        className="h-20 flex items-center justify-center px-5 border-b border-[var(--border)] hover:bg-[var(--surface-50)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Image
            src="/images/kcs-logo.jpg"
            alt="KCS Logo"
            width={48}
            height={48}
            className="object-contain"
            priority
          />
          <div className="flex flex-col">
            <span
              className="text-base font-semibold leading-tight text-[var(--foreground)]"
            >
              케이씨에스
            </span>
            <span
              className="text-xs text-[var(--muted)]"
            >
              Logistics Platform
            </span>
          </div>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        <ul className="space-y-0.5 px-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const hasCategories = item.categories && item.categories.length > 0;
            const isExpanded = expandedMenus.includes(item.title);

            return (
              <li key={item.href}>
                {hasCategories ? (
                  <>
                    <button
                      onClick={() => toggleMenu(item.title)}
                      className={`group flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-[#6e5fc9] text-white shadow-sm'
                          : 'text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                      }`}
                    >
                      <span className={isActive ? 'text-white' : 'text-[var(--text-primary)]'}>
                        {item.icon}
                      </span>
                      <span className="text-sm font-semibold flex-1 text-left">
                        {item.title}
                      </span>
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isExpanded && (
                      <ul className="mt-1 ml-[23px] space-y-0.5 pl-[15px] border-l-2 border-[var(--border)]">
                        {item.categories?.map((category) => {
                          const isCategoryExpanded = expandedCategories.includes(category.title);
                          const hasCategoryActive = category.children.some(
                            child => pathname === child.href || pathname.startsWith(child.href + '/')
                          );

                          return (
                            <li key={category.title}>
                              <button
                                onClick={() => toggleCategory(category.title)}
                                className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm transition-colors hover:bg-[var(--surface-hover)] ${
                                  hasCategoryActive
                                    ? 'text-[#6e5fc9] font-semibold'
                                    : 'text-[var(--text-primary)] font-medium'
                                }`}
                              >
                                <span className="flex-1 text-left">{category.title}</span>
                                <svg
                                  className={`w-3 h-3 transition-transform duration-200 ${isCategoryExpanded ? 'rotate-180' : ''}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              {isCategoryExpanded && (
                                <ul className="mt-0.5 ml-[10px] space-y-0.5">
                                  {category.children.map((child) => {
                                    const isChildActive = pathname === child.href || pathname.startsWith(child.href + '/');
                                    return (
                                      <li key={child.href}>
                                        <Link
                                          href={child.href}
                                          className={`block px-2 py-1 rounded text-xs transition-colors ${
                                            isChildActive
                                              ? 'bg-[rgba(110,95,201,0.1)] text-[#6e5fc9] font-semibold'
                                              : 'text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                                          }`}
                                        >
                                          {child.title}
                                        </Link>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                ) : item.subItems && item.subItems.length > 0 ? (
                  <>
                    <button
                      onClick={() => toggleMenu(item.title)}
                      className={`group flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-[#6e5fc9] text-white shadow-sm'
                          : 'text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                      }`}
                    >
                      <span className={isActive ? 'text-white' : 'text-[var(--text-primary)]'}>
                        {item.icon}
                      </span>
                      <span className="text-sm font-semibold flex-1 text-left">
                        {item.title}
                      </span>
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isExpanded && (
                      <ul className="mt-1 ml-[23px] space-y-0.5 pl-[15px] border-l-2 border-[var(--border)]">
                        {item.subItems.map((subItem) => {
                          const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href + '/');
                          return (
                            <li key={subItem.href}>
                              <Link
                                href={subItem.href}
                                className={`block px-2 py-1.5 rounded text-xs transition-colors ${
                                  isSubActive
                                    ? 'bg-[rgba(110,95,201,0.1)] text-[#6e5fc9] font-semibold'
                                    : 'text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                                }`}
                              >
                                {subItem.title}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-[#6e5fc9] text-white shadow-sm'
                        : 'text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    <span className={isActive ? 'text-white' : 'text-[var(--text-primary)]'}>
                      {item.icon}
                    </span>
                    <span className="text-sm font-semibold">
                      {item.title}
                    </span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
    </>
  );
}

// memo로 감싸서 불필요한 리렌더링 방지
const Sidebar = memo(SidebarComponent);
export default Sidebar;
