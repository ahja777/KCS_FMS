import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { queryWithLog } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

interface PasswordRow extends RowDataPacket {
  PASSWORD_HASH: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, message: '인증되지 않았습니다.' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: '현재 비밀번호와 새 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: '새 비밀번호는 최소 6자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // 현재 비밀번호 확인
    const [rows] = await queryWithLog<PasswordRow[]>(
      'SELECT PASSWORD_HASH FROM SYS_USER WHERE USER_ID = ?',
      [user.userId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, rows[0].PASSWORD_HASH);
    if (!isValid) {
      return NextResponse.json({ success: false, message: '현재 비밀번호가 일치하지 않습니다.' }, { status: 401 });
    }

    // 새 비밀번호 해싱 및 업데이트
    const newHash = await bcrypt.hash(newPassword, 10);
    await queryWithLog<ResultSetHeader>(
      'UPDATE SYS_USER SET PASSWORD_HASH = ?, PASSWORD_CHANGED_DTM = NOW(), UPDATED_BY = ? WHERE USER_ID = ?',
      [newHash, user.userId, user.userId]
    );

    return NextResponse.json({ success: true, message: '비밀번호가 변경되었습니다.' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
