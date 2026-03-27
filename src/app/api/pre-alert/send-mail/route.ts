import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { sendMail, generatePreAlertHtml } from '@/lib/mailer';

// Pre-Alert 메일 발송
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      setting_id,
      doc_no,
      mawb_id,
      hawb_id,
      // 직접 입력 또는 설정에서 가져옴
      mail_from,
      mail_to,
      mail_cc,
      mail_bcc,
      mail_subject,
      mail_body,
      // AWB 정보 (선택)
      mawb_no,
      flight_no,
      origin,
      destination,
      etd,
      eta,
      shipper,
      consignee,
      pieces,
      weight,
      commodity,
    } = body;

    // 필수 값 확인
    if (!mail_to || !mail_subject) {
      return NextResponse.json(
        { success: false, error: '수신자(mail_to)와 제목(mail_subject)은 필수입니다.' },
        { status: 400 }
      );
    }

    // 설정에서 수신자 정보 가져오기 (setting_id가 있는 경우)
    let toAddresses = mail_to;
    let ccAddresses = mail_cc;
    let bccAddresses = mail_bcc;

    if (setting_id && (!mail_to || mail_to === 'FROM_SETTINGS')) {
      const [addresses] = await pool.query<RowDataPacket[]>(
        `SELECT addr_type, email FROM pre_alert_settings_address WHERE setting_id = ?`,
        [setting_id]
      );

      const toEmails = addresses.filter(a => a.addr_type === 'TO').map(a => a.email);
      const ccEmails = addresses.filter(a => a.addr_type === 'CC').map(a => a.email);
      const bccEmails = addresses.filter(a => a.addr_type === 'BCC').map(a => a.email);

      if (toEmails.length > 0) toAddresses = toEmails.join(', ');
      if (ccEmails.length > 0) ccAddresses = ccEmails.join(', ');
      if (bccEmails.length > 0) bccAddresses = bccEmails.join(', ');
    }

    // HTML 메일 본문 생성
    const htmlContent = generatePreAlertHtml({
      docNo: doc_no || 'N/A',
      mawbNo: mawb_no,
      flightNo: flight_no,
      origin,
      destination,
      etd,
      eta,
      shipper,
      consignee,
      pieces,
      weight,
      commodity,
      customBody: mail_body,
    });

    // 메일 발송
    const result = await sendMail({
      from: mail_from,
      to: toAddresses,
      cc: ccAddresses,
      bcc: bccAddresses,
      subject: mail_subject,
      html: htmlContent,
      text: mail_body,
    });

    // 메일 로그 저장
    const [logResult] = await pool.query<ResultSetHeader>(`
      INSERT INTO pre_alert_mail_log (
        setting_id, doc_type, doc_no, mawb_id, hawb_id,
        mail_from, mail_to, mail_cc, mail_bcc,
        mail_subject, mail_body, attachments,
        status, response_msg, send_dt, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      setting_id || null,
      'PRE_ALERT_AIR',
      doc_no || null,
      mawb_id || null,
      hawb_id || null,
      mail_from || 'noreply@fms-logistics.com',
      toAddresses,
      ccAddresses || null,
      bccAddresses || null,
      mail_subject,
      mail_body || null,
      null,
      result.success ? 'SUCCESS' : 'FAILED',
      result.success ? result.messageId : result.error,
      result.success ? new Date() : null,
      'admin'
    ]);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '메일이 성공적으로 발송되었습니다.',
        data: {
          log_id: logResult.insertId,
          messageId: result.messageId,
          previewUrl: result.previewUrl, // Ethereal 테스트 메일인 경우 미리보기 URL
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        data: { log_id: logResult.insertId }
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Pre-Alert Send Mail Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// 메일 재발송
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { log_id } = body;

    if (!log_id) {
      return NextResponse.json(
        { success: false, error: 'log_id가 필요합니다.' },
        { status: 400 }
      );
    }

    // 기존 로그 조회
    const [logs] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM pre_alert_mail_log WHERE log_id = ?`,
      [log_id]
    );

    if (logs.length === 0) {
      return NextResponse.json(
        { success: false, error: '해당 메일 로그를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const log = logs[0];

    // HTML 메일 본문 생성
    const htmlContent = generatePreAlertHtml({
      docNo: log.doc_no || 'N/A',
      customBody: log.mail_body,
    });

    // 메일 재발송
    const result = await sendMail({
      from: log.mail_from,
      to: log.mail_to,
      cc: log.mail_cc,
      bcc: log.mail_bcc,
      subject: log.mail_subject,
      html: htmlContent,
      text: log.mail_body,
    });

    // 로그 업데이트
    await pool.query(`
      UPDATE pre_alert_mail_log SET
        status = ?,
        response_msg = ?,
        send_dt = ?
      WHERE log_id = ?
    `, [
      result.success ? 'SUCCESS' : 'FAILED',
      result.success ? result.messageId : result.error,
      result.success ? new Date() : null,
      log_id
    ]);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '메일이 성공적으로 재발송되었습니다.',
        data: {
          messageId: result.messageId,
          previewUrl: result.previewUrl,
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Pre-Alert Resend Mail Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
