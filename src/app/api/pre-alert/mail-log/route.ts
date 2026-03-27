import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Pre-Alert Mail Log 목록 조회
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const docType = searchParams.get('docType');
  const docNo = searchParams.get('docNo');
  const status = searchParams.get('status');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  try {
    let query = `
      SELECT
        l.*,
        DATE_FORMAT(l.send_dt, '%Y-%m-%d %H:%i') as send_dt_fmt,
        DATE_FORMAT(l.created_dt, '%Y-%m-%d %H:%i') as created_dt_fmt,
        s.setting_name
      FROM pre_alert_mail_log l
      LEFT JOIN pre_alert_settings s ON l.setting_id = s.setting_id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (docType) {
      query += ' AND l.doc_type = ?';
      params.push(docType);
    }
    if (docNo) {
      query += ' AND l.doc_no LIKE ?';
      params.push(`%${docNo}%`);
    }
    if (status) {
      query += ' AND l.status = ?';
      params.push(status);
    }
    if (startDate) {
      query += ' AND DATE(l.created_dt) >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND DATE(l.created_dt) <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY l.created_dt DESC LIMIT 500';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    return NextResponse.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Pre-Alert Mail Log GET Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// Pre-Alert Mail Log 생성 (메일 발송 시)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const [result] = await pool.query<ResultSetHeader>(`
      INSERT INTO pre_alert_mail_log (
        setting_id, doc_type, doc_no, mawb_id, hawb_id,
        mail_from, mail_to, mail_cc, mail_bcc,
        mail_subject, mail_body, attachments,
        status, response_msg, send_dt, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      body.setting_id || null,
      body.doc_type || 'PRE_ALERT_AIR',
      body.doc_no || null,
      body.mawb_id || null,
      body.hawb_id || null,
      body.mail_from,
      body.mail_to,
      body.mail_cc || null,
      body.mail_bcc || null,
      body.mail_subject,
      body.mail_body || null,
      body.attachments ? JSON.stringify(body.attachments) : null,
      body.status || 'STANDBY',
      body.response_msg || null,
      body.send_dt ? new Date(body.send_dt) : null,
      'admin'
    ]);

    return NextResponse.json({
      success: true,
      data: { log_id: result.insertId },
      message: 'Mail Log가 생성되었습니다.'
    });
  } catch (error) {
    console.error('Pre-Alert Mail Log POST Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// Pre-Alert Mail Log 상태 업데이트 (재발송 등)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.log_id) {
      return NextResponse.json(
        { success: false, error: 'Log ID가 필요합니다.' },
        { status: 400 }
      );
    }

    await pool.query(`
      UPDATE pre_alert_mail_log SET
        status = ?,
        response_msg = ?,
        send_dt = ?
      WHERE log_id = ?
    `, [
      body.status,
      body.response_msg || null,
      body.send_dt ? new Date(body.send_dt) : new Date(),
      body.log_id
    ]);

    return NextResponse.json({
      success: true,
      message: 'Mail Log가 업데이트되었습니다.'
    });
  } catch (error) {
    console.error('Pre-Alert Mail Log PUT Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// Pre-Alert Mail Log 삭제
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { success: false, error: 'ID가 필요합니다.' },
      { status: 400 }
    );
  }

  try {
    await pool.query('DELETE FROM pre_alert_mail_log WHERE log_id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Mail Log가 삭제되었습니다.'
    });
  } catch (error) {
    console.error('Pre-Alert Mail Log DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
