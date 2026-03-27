import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Pre-Alert Settings 목록 조회
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const serviceGroup = searchParams.get('serviceGroup');
  const settingName = searchParams.get('settingName');
  const id = searchParams.get('id');

  try {
    let query = `
      SELECT
        s.*,
        DATE_FORMAT(s.created_dt, '%Y-%m-%d %H:%i') as created_dt_fmt,
        DATE_FORMAT(s.updated_dt, '%Y-%m-%d %H:%i') as updated_dt_fmt
      FROM pre_alert_settings s
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (id) {
      query += ' AND s.setting_id = ?';
      params.push(parseInt(id));
    }
    if (serviceGroup) {
      query += ' AND s.service_group = ?';
      params.push(serviceGroup);
    }
    if (settingName) {
      query += ' AND s.setting_name LIKE ?';
      params.push(`%${settingName}%`);
    }

    query += ' ORDER BY s.created_dt DESC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    // 각 설정의 수신자 정보 조회
    for (const row of rows) {
      const [addresses] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM pre_alert_settings_address WHERE setting_id = ? ORDER BY addr_type, sort_order`,
        [row.setting_id]
      );
      row.addresses = addresses;
    }

    return NextResponse.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Pre-Alert Settings GET Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// Pre-Alert Settings 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const [result] = await pool.query<ResultSetHeader>(`
      INSERT INTO pre_alert_settings (
        setting_name, service_group, shipper_code, consignee_code, partner_code,
        pol_code, pod_code, attachment_types, base_date_type,
        auto_send_yn, auto_send_days, auto_send_time,
        mail_template_id, mail_subject, mail_body, use_yn, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      body.setting_name,
      body.service_group || 'AIR',
      body.shipper_code || null,
      body.consignee_code || null,
      body.partner_code || null,
      body.pol_code || null,
      body.pod_code || null,
      body.attachment_types || null,
      body.base_date_type || 'ETD',
      body.auto_send_yn || 'N',
      body.auto_send_days || 0,
      body.auto_send_time || null,
      body.mail_template_id || null,
      body.mail_subject || null,
      body.mail_body || null,
      body.use_yn !== false ? 'Y' : 'N',
      'admin'
    ]);

    const settingId = result.insertId;

    // 수신자 정보 저장
    if (body.addresses && Array.isArray(body.addresses)) {
      for (const addr of body.addresses) {
        await pool.query(`
          INSERT INTO pre_alert_settings_address
          (setting_id, addr_type, addr_name, email, mail_group_id, sort_order)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          settingId,
          addr.addr_type,
          addr.addr_name || null,
          addr.email,
          addr.mail_group_id || null,
          addr.sort_order || 0
        ]);
      }
    }

    return NextResponse.json({
      success: true,
      data: { setting_id: settingId },
      message: 'Pre-Alert 설정이 생성되었습니다.'
    });
  } catch (error) {
    console.error('Pre-Alert Settings POST Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// Pre-Alert Settings 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.setting_id) {
      return NextResponse.json(
        { success: false, error: 'Setting ID가 필요합니다.' },
        { status: 400 }
      );
    }

    await pool.query(`
      UPDATE pre_alert_settings SET
        setting_name = ?,
        service_group = ?,
        shipper_code = ?,
        consignee_code = ?,
        partner_code = ?,
        pol_code = ?,
        pod_code = ?,
        attachment_types = ?,
        base_date_type = ?,
        auto_send_yn = ?,
        auto_send_days = ?,
        auto_send_time = ?,
        mail_template_id = ?,
        mail_subject = ?,
        mail_body = ?,
        use_yn = ?,
        updated_by = ?,
        updated_dt = NOW()
      WHERE setting_id = ?
    `, [
      body.setting_name,
      body.service_group,
      body.shipper_code || null,
      body.consignee_code || null,
      body.partner_code || null,
      body.pol_code || null,
      body.pod_code || null,
      body.attachment_types || null,
      body.base_date_type,
      body.auto_send_yn,
      body.auto_send_days || 0,
      body.auto_send_time || null,
      body.mail_template_id || null,
      body.mail_subject || null,
      body.mail_body || null,
      body.use_yn,
      'admin',
      body.setting_id
    ]);

    // 수신자 정보 업데이트 (기존 삭제 후 새로 삽입)
    if (body.addresses && Array.isArray(body.addresses)) {
      await pool.query('DELETE FROM pre_alert_settings_address WHERE setting_id = ?', [body.setting_id]);

      for (const addr of body.addresses) {
        await pool.query(`
          INSERT INTO pre_alert_settings_address
          (setting_id, addr_type, addr_name, email, mail_group_id, sort_order)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          body.setting_id,
          addr.addr_type,
          addr.addr_name || null,
          addr.email,
          addr.mail_group_id || null,
          addr.sort_order || 0
        ]);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Pre-Alert 설정이 수정되었습니다.'
    });
  } catch (error) {
    console.error('Pre-Alert Settings PUT Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// Pre-Alert Settings 삭제
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
    await pool.query('DELETE FROM pre_alert_settings WHERE setting_id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Pre-Alert 설정이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('Pre-Alert Settings DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
