import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { queryWithLog } from '@/lib/db';
import { createToken, TOKEN_NAME, AuthUser } from '@/lib/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

interface UserRow extends RowDataPacket {
  USER_ID: string;
  USER_NM: string;
  PASSWORD_HASH: string;
  EMAIL: string;
  USER_TYPE_CD: string;
  COMPANY_CD: string;
  COMPANY_NM: string;
  DEPARTMENT: string;
  POSITION_NM: string;
  STATUS_CD: string;
  LOGIN_FAIL_CNT: number;
  USE_YN: string;
}

const MAX_LOGIN_FAIL = 5;

export async function POST(request: NextRequest) {
  try {
    const { userId, password } = await request.json();

    if (!userId || !password) {
      return NextResponse.json(
        { success: false, message: '아이디와 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 사용자 조회
    const [rows] = await queryWithLog<UserRow[]>(
      `SELECT USER_ID, USER_NM, PASSWORD_HASH, EMAIL, USER_TYPE_CD,
              COMPANY_CD, COMPANY_NM, DEPARTMENT, POSITION_NM,
              STATUS_CD, LOGIN_FAIL_CNT, USE_YN
       FROM SYS_USER WHERE USER_ID = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: '아이디 또는 비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }

    const user = rows[0];

    // 계정 상태 확인
    if (user.USE_YN !== 'Y') {
      return NextResponse.json(
        { success: false, message: '비활성화된 계정입니다. 관리자에게 문의하세요.' },
        { status: 403 }
      );
    }

    if (user.STATUS_CD === 'LOCKED') {
      return NextResponse.json(
        { success: false, message: '계정이 잠겼습니다. 관리자에게 문의하세요.' },
        { status: 403 }
      );
    }

    // 로그인 실패 횟수 초과 확인
    if (user.LOGIN_FAIL_CNT >= MAX_LOGIN_FAIL) {
      await queryWithLog<ResultSetHeader>(
        `UPDATE SYS_USER SET STATUS_CD = 'LOCKED' WHERE USER_ID = ?`,
        [userId]
      );
      return NextResponse.json(
        { success: false, message: '로그인 실패 횟수를 초과하여 계정이 잠겼습니다. 관리자에게 문의하세요.' },
        { status: 403 }
      );
    }

    // 비밀번호 검증
    const isValid = await bcrypt.compare(password, user.PASSWORD_HASH);
    if (!isValid) {
      // 실패 횟수 증가
      const newFailCnt = user.LOGIN_FAIL_CNT + 1;
      if (newFailCnt >= MAX_LOGIN_FAIL) {
        await queryWithLog<ResultSetHeader>(
          `UPDATE SYS_USER SET LOGIN_FAIL_CNT = ?, STATUS_CD = 'LOCKED' WHERE USER_ID = ?`,
          [newFailCnt, userId]
        );
        return NextResponse.json(
          { success: false, message: `로그인 ${MAX_LOGIN_FAIL}회 실패로 계정이 잠겼습니다. 관리자에게 문의하세요.` },
          { status: 403 }
        );
      }
      await queryWithLog<ResultSetHeader>(
        `UPDATE SYS_USER SET LOGIN_FAIL_CNT = ? WHERE USER_ID = ?`,
        [newFailCnt, userId]
      );
      return NextResponse.json(
        { success: false, message: `아이디 또는 비밀번호가 일치하지 않습니다. (${newFailCnt}/${MAX_LOGIN_FAIL})` },
        { status: 401 }
      );
    }

    // 로그인 성공 - 실패 횟수 초기화 및 마지막 로그인 시간 업데이트
    await queryWithLog<ResultSetHeader>(
      `UPDATE SYS_USER SET LOGIN_FAIL_CNT = 0, LAST_LOGIN_DTM = NOW(), STATUS_CD = 'ACTIVE' WHERE USER_ID = ?`,
      [userId]
    );

    // JWT 토큰 생성
    const authUser: AuthUser = {
      userId: user.USER_ID,
      userNm: user.USER_NM,
      email: user.EMAIL || '',
      userTypeCd: user.USER_TYPE_CD || '',
      companyCd: user.COMPANY_CD || '',
      companyNm: user.COMPANY_NM || '',
      department: user.DEPARTMENT || '',
      positionNm: user.POSITION_NM || '',
    };

    const token = await createToken(authUser);

    const response = NextResponse.json({
      success: true,
      message: '로그인 성공',
      user: authUser,
    });

    // httpOnly 쿠키에 토큰 저장
    response.cookies.set(TOKEN_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60, // 8시간
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
