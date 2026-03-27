import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fms-logistics-platform-jwt-secret-key-2026-intergis'
);

const TOKEN_NAME = 'fms_auth_token';

// 인증이 필요없는 경로
const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
];

// 정적 리소스 패턴
const STATIC_PATTERNS = [
  '/_next',
  '/favicon.ico',
  '/images',
  '/fonts',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 정적 리소스는 패스
  if (STATIC_PATTERNS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 공개 경로는 패스
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    // 이미 로그인된 상태에서 /login 접근 시 메인으로 리다이렉트
    if (pathname === '/login') {
      const token = request.cookies.get(TOKEN_NAME)?.value;
      if (token) {
        try {
          await jwtVerify(token, JWT_SECRET);
          return NextResponse.redirect(new URL('/', request.url));
        } catch {
          // 토큰이 유효하지 않으면 로그인 페이지 표시
        }
      }
    }
    return NextResponse.next();
  }

  // 토큰 확인
  const token = request.cookies.get(TOKEN_NAME)?.value;
  if (!token) {
    // API 요청은 401 응답
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
    }
    // 페이지 요청은 로그인으로 리다이렉트
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 토큰 검증
  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    // 만료된 토큰 - 쿠키 삭제 후 리다이렉트
    if (pathname.startsWith('/api/')) {
      const response = NextResponse.json({ success: false, message: '인증이 만료되었습니다.' }, { status: 401 });
      response.cookies.set(TOKEN_NAME, '', { maxAge: 0, path: '/' });
      return response;
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set(TOKEN_NAME, '', { maxAge: 0, path: '/' });
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|fonts).*)',
  ],
};
