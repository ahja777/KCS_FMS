'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export default function Header({ title, subtitle, onClose, showCloseButton = true }: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { toggleSidebar } = useSidebar();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);

  // 클라이언트 마운트 후 날짜/시간 업데이트 (Hydration mismatch 방지)
  useEffect(() => {
    setIsMounted(true);
    const updateDateTime = () => {
      const now = new Date();
      setCurrentDate(now.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' }));
      setCurrentTime(now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 테마 초기화 및 적용
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  // 테마 토글
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newMode);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  return (
    <header
      className="min-h-20 py-3 border-b flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 border-[var(--border)] transition-all duration-300 bg-[var(--surface-elevated)]"
    >
      {/* Left Section: Hamburger + Title */}
      <div className="flex items-center gap-2 min-w-0 max-w-[60%] lg:max-w-[50%]">
        {/* Hamburger Menu - Mobile/Tablet only */}
        <button
          onClick={toggleSidebar}
          className={`lg:hidden flex-shrink-0 p-2 rounded-xl transition-all duration-200 ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
          aria-label="메뉴 열기"
        >
          <svg className={`w-6 h-6 ${isDarkMode ? 'text-white/80' : 'text-gray-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

      {/* Title Section */}
      <div className="animate-fade-in flex-shrink min-w-0">
        <div className="flex items-center gap-3">
          <h1 className={`text-2xl font-bold tracking-tight whitespace-nowrap ${isDarkMode ? 'text-white' : 'text-[var(--text-primary)]'}`}
          >
            {title}
          </h1>
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{
              background: 'rgba(110, 95, 201, 0.08)',
              border: '1px solid rgba(110, 95, 201, 0.15)',
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ background: '#6e5fc9' }}
              />
              <span className="relative inline-flex rounded-full h-2 w-2"
                style={{ background: '#6e5fc9' }}
              />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: '#6e5fc9' }}
            >
              Live
            </span>
          </div>
        </div>
        {subtitle && (
          <p className={`text-xs mt-0.5 truncate ${isDarkMode ? 'text-white/60' : 'text-[var(--text-secondary)]'}`} title={subtitle}>
            {subtitle}
          </p>
        )}
      </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Quick Actions */}
        <div className="flex items-center gap-1">
          {/* Notifications */}
          <button className={`group relative p-2.5 rounded-xl transition-all duration-200 ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
            <svg className={`w-5 h-5 transition-colors ${isDarkMode ? 'text-white/70 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
              />
            </svg>
            {/* Notification badge */}
            <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full"
              style={{
                background: '#ef4444',
                color: '#ffffff',
              }}
            >
              3
            </span>
          </button>

          {/* Quick Add - hidden on mobile */}
          <button className={`hidden sm:block group p-2.5 rounded-xl transition-all duration-200 ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
            <svg className={`w-5 h-5 transition-colors ${isDarkMode ? 'text-white/70 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>

          {/* Help - hidden on mobile */}
          <button className={`hidden sm:block group p-2.5 rounded-xl transition-all duration-200 ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
            <svg className={`w-5 h-5 transition-colors ${isDarkMode ? 'text-white/70 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
          </button>

          {/* Theme Toggle - 현재 모드 표시 */}
          <button
            onClick={toggleTheme}
            className={`group p-2.5 rounded-xl transition-all duration-200 ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
            title={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
          >
            {isDarkMode ? (
              // Sun icon - 다크 모드일 때 (클릭하면 라이트로 전환)
              <svg className="w-5 h-5 transition-colors text-amber-400"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            ) : (
              // Moon icon - 라이트 모드일 때 (클릭하면 다크로 전환)
              <svg className="w-5 h-5 transition-colors text-indigo-600"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
          </button>
        </div>

        {/* Divider - hidden on mobile */}
        <div className={`hidden md:block w-px h-8 ${isDarkMode ? 'bg-white/20' : 'bg-gray-200'}`} />

        {/* Date & Time - hidden on mobile */}
        <div className="hidden md:flex flex-col items-end min-w-[80px]">
          {isMounted ? (
            <>
              <span className={`text-sm font-semibold font-mono tracking-tight ${isDarkMode ? 'text-white' : 'text-[var(--text-primary)]'}`}>
                {currentDate}
              </span>
              <span className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-[var(--text-secondary)]'}`}>
                {currentTime}
              </span>
            </>
          ) : (
            <span className={`text-sm ${isDarkMode ? 'text-white/40' : 'text-gray-300'}`}>--:--</span>
          )}
        </div>

        {/* Divider - hidden on mobile */}
        <div className={`hidden md:block w-px h-8 ${isDarkMode ? 'bg-white/20' : 'bg-gray-200'}`} />

        {/* User Profile Section */}
        <div className="relative group">
          <button className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
            {/* User info - hidden on mobile */}
            <div className="hidden sm:flex flex-col items-end">
              <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-[var(--text-primary)]'}`}>
                {user?.userNm || 'Guest'}
              </p>
              <p className={`text-[11px] ${isDarkMode ? 'text-white/60' : 'text-[var(--text-secondary)]'}`}>
                {user?.email || ''}
              </p>
            </div>

            {/* Avatar */}
            <div className="relative">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #6e5fc9 0%, #8b7fd9 100%)',
                  boxShadow: '0 4px 12px rgba(110, 95, 201, 0.25)',
                }}
              >
                <span className="text-sm font-bold text-white">
                  {user?.userNm ? user.userNm.slice(0, 2).toUpperCase() : 'G'}
                </span>
              </div>
              {/* Online status */}
              <div
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                style={{
                  borderColor: '#ffffff',
                  background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
                  boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)',
                }}
              />
            </div>

            {/* Dropdown arrow */}
            <svg
              className={`w-4 h-4 transition-transform duration-300 group-hover:rotate-180 ${isDarkMode ? 'text-white/60' : 'text-gray-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu (hover to show) */}
          <div
            className="absolute right-0 top-full mt-2 w-56 py-2 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 bg-[var(--background)] border border-[var(--border)] shadow-xl"
          >
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <p className="text-sm font-semibold text-[var(--foreground)]">{user?.userNm || 'Guest'}</p>
              <p className="text-xs text-[var(--muted)]">{user?.email || ''}</p>
              {user?.companyNm && (
                <p className="text-xs text-[var(--muted)] mt-0.5">{user.companyNm} {user.department ? `/ ${user.department}` : ''}</p>
              )}
            </div>
            <div className="py-1">
              <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--surface-50)] text-[var(--foreground)]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                내 프로필
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--surface-50)] text-[var(--foreground)]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                설정
              </button>
            </div>
            <div className="border-t border-[var(--border)] py-1">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
                로그아웃
              </button>
            </div>
          </div>
        </div>

        {/* Close Button */}
        {showCloseButton && (
          <>
            <div className={`w-px h-8 ${isDarkMode ? 'bg-white/20' : 'bg-gray-200'}`} />
            <button
              onClick={handleClose}
              className={`group flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 border ${
                isDarkMode
                  ? 'border-white/20 bg-transparent hover:bg-red-500/20 hover:border-red-400/50'
                  : 'border-gray-300 bg-transparent hover:bg-red-50 hover:border-red-300'
              }`}
              title="화면닫기"
            >
              <svg
                className={`w-5 h-5 transition-colors ${isDarkMode ? 'text-white/70' : 'text-gray-500'} group-hover:text-red-500`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className={`hidden sm:inline text-sm font-medium transition-colors ${isDarkMode ? 'text-white/70' : 'text-gray-500'} group-hover:text-red-500`}
              >
                화면닫기
              </span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
