'use client';

import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const redirect = searchParams.get('redirect') || '/';

  // 페이지 로드 시 ID 필드에 포커스
  useEffect(() => {
    document.getElementById('userId')?.focus();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!userId.trim()) {
      setError('아이디를 입력해주세요.');
      return;
    }
    if (!password) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId.trim(), password }),
      });
      const data = await res.json();

      if (data.success) {
        router.push(redirect);
        router.refresh();
      } else {
        setError(data.message);
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0A1628 0%, #162544 40%, #1E3A5F 70%, #0F1D32 100%)' }}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #6e5fc9, transparent)' }}
        />
        <div className="absolute -bottom-60 -left-60 w-[500px] h-[500px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #3B82F6, transparent)' }}
        />
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white/20 rounded-full" />
        <div className="absolute top-1/3 right-1/3 w-0.5 h-0.5 bg-white/30 rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-1.5 h-1.5 bg-white/10 rounded-full" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="rounded-2xl p-8 sm:p-10"
          style={{
            background: 'rgba(15, 29, 50, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(110, 95, 201, 0.2)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 100px rgba(110, 95, 201, 0.1)',
          }}
        >
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{
                background: 'linear-gradient(135deg, #6e5fc9 0%, #8b7fd9 100%)',
                boxShadow: '0 8px 24px rgba(110, 95, 201, 0.4)',
              }}
            >
              <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
                {/* Globe */}
                <circle cx="12" cy="12" r="9" />
                <ellipse cx="12" cy="12" rx="3.5" ry="9" />
                <path d="M3.5 8.5h17M3.5 15.5h17" strokeLinecap="round" />
                {/* Flight path arc */}
                <path d="M5 6c3-2 8-1.5 13 2" strokeLinecap="round" strokeDasharray="1.5 2" strokeWidth={1} />
                {/* Airplane */}
                <path d="M19.5 7.2l-1.8.6-1-.8-3.2 1.2 2.2 1.4-1.5.5.8 1" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} fill="currentColor" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              케이씨에스
            </h1>
            <p className="text-sm text-white/50 mt-1">
              Logistics Platform
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                }}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* User ID */}
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-white/70 mb-1.5">
                아이디
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <input
                  id="userId"
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="아이디를 입력하세요"
                  autoComplete="username"
                  className="w-full py-3 rounded-xl text-sm placeholder-white/30 focus:outline-none focus:ring-2 transition-all duration-200"
                  style={{
                    paddingLeft: '44px',
                    paddingRight: '16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    caretColor: '#ffffff',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(110, 95, 201, 0.5)';
                    e.target.style.boxShadow = '0 0 0 2px rgba(110, 95, 201, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/70 mb-1.5">
                비밀번호
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  autoComplete="current-password"
                  className="w-full py-3 rounded-xl text-sm placeholder-white/30 focus:outline-none transition-all duration-200"
                  style={{
                    paddingLeft: '44px',
                    paddingRight: '16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    caretColor: '#ffffff',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(110, 95, 201, 0.5)';
                    e.target.style.boxShadow = '0 0 0 2px rgba(110, 95, 201, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="w-3.5 h-3.5 rounded cursor-pointer"
                  style={{
                    accentColor: '#6e5fc9',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}
                />
                <span className="text-xs text-white/50">비밀번호 표시</span>
              </label>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: loading
                  ? 'rgba(110, 95, 201, 0.5)'
                  : 'linear-gradient(135deg, #6e5fc9 0%, #584bb0 100%)',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(110, 95, 201, 0.4)',
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  (e.target as HTMLButtonElement).style.boxShadow = '0 6px 24px rgba(110, 95, 201, 0.5)';
                  (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
                }
              }}
              onMouseOut={(e) => {
                (e.target as HTMLButtonElement).style.boxShadow = loading ? 'none' : '0 4px 16px rgba(110, 95, 201, 0.4)';
                (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  로그인 중...
                </span>
              ) : (
                '로그인'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-white/30">
              Since 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
