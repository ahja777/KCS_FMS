import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// Mail Group 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const groupCode = searchParams.get('groupCode');
    const bizType = searchParams.get('bizType');

    // 개별 그룹 조회
    if (groupId) {
      const [groups] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM pre_alert_mail_group WHERE group_id = ?`,
        [groupId]
      );

      if (groups.length === 0) {
        return NextResponse.json({ success: false, error: '그룹을 찾을 수 없습니다.' }, { status: 404 });
      }

      const [addresses] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM pre_alert_mail_group_address WHERE group_id = ? ORDER BY addr_type, address_id`,
        [groupId]
      );

      return NextResponse.json({
        success: true,
        data: { ...groups[0], addresses }
      });
    }

    // 목록 조회
    let query = `
      SELECT g.*,
        (SELECT COUNT(*) FROM pre_alert_mail_group_address a WHERE a.group_id = g.group_id) as address_count
      FROM pre_alert_mail_group g
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (groupCode) {
      query += ` AND g.group_code LIKE ?`;
      params.push(`%${groupCode}%`);
    }
    if (bizType) {
      query += ` AND g.biz_type = ?`;
      params.push(bizType);
    }

    query += ` ORDER BY g.group_code`;

    const [groups] = await pool.query<RowDataPacket[]>(query, params);

    return NextResponse.json({ success: true, data: groups });
  } catch (error) {
    console.error('Mail Group GET Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// Mail Group 생성
export async function POST(request: NextRequest) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const body = await request.json();
    const { group_code, group_name, group_type, biz_type, remark, use_yn, addresses } = body;

    if (!group_code || !group_name) {
      return NextResponse.json(
        { success: false, error: '그룹 코드와 이름은 필수입니다.' },
        { status: 400 }
      );
    }

    // 그룹 생성
    const [result] = await connection.query<ResultSetHeader>(`
      INSERT INTO pre_alert_mail_group (group_code, group_name, group_type, biz_type, remark, use_yn, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [group_code, group_name, group_type || 'GENERAL', biz_type || 'AIR', remark || null, use_yn || 'Y', 'admin']);

    const groupId = result.insertId;

    // 주소 추가
    if (addresses && addresses.length > 0) {
      for (const addr of addresses) {
        await connection.query(`
          INSERT INTO pre_alert_mail_group_address (group_id, addr_type, addr_name, email, created_by)
          VALUES (?, ?, ?, ?, ?)
        `, [groupId, addr.addr_type || 'TO', addr.addr_name || '', addr.email, 'admin']);
      }
    }

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: '메일 그룹이 생성되었습니다.',
      data: { group_id: groupId }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Mail Group POST Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  } finally {
    connection.release();
  }
}

// Mail Group 수정
export async function PUT(request: NextRequest) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const body = await request.json();
    const { group_id, group_code, group_name, group_type, biz_type, remark, use_yn, addresses } = body;

    if (!group_id) {
      return NextResponse.json({ success: false, error: 'group_id가 필요합니다.' }, { status: 400 });
    }

    // 그룹 수정
    await connection.query(`
      UPDATE pre_alert_mail_group SET
        group_code = ?,
        group_name = ?,
        group_type = ?,
        biz_type = ?,
        remark = ?,
        use_yn = ?,
        updated_by = ?,
        updated_dt = NOW()
      WHERE group_id = ?
    `, [group_code, group_name, group_type, biz_type, remark, use_yn, 'admin', group_id]);

    // 기존 주소 삭제 후 재등록
    await connection.query(`DELETE FROM pre_alert_mail_group_address WHERE group_id = ?`, [group_id]);

    if (addresses && addresses.length > 0) {
      for (const addr of addresses) {
        await connection.query(`
          INSERT INTO pre_alert_mail_group_address (group_id, addr_type, addr_name, email, created_by)
          VALUES (?, ?, ?, ?, ?)
        `, [group_id, addr.addr_type || 'TO', addr.addr_name || '', addr.email, 'admin']);
      }
    }

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: '메일 그룹이 수정되었습니다.'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Mail Group PUT Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  } finally {
    connection.release();
  }
}

// Mail Group 삭제
export async function DELETE(request: NextRequest) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('id');

    if (!groupId) {
      return NextResponse.json({ success: false, error: 'id가 필요합니다.' }, { status: 400 });
    }

    // 주소 먼저 삭제
    await connection.query(`DELETE FROM pre_alert_mail_group_address WHERE group_id = ?`, [groupId]);

    // 그룹 삭제
    await connection.query(`DELETE FROM pre_alert_mail_group WHERE group_id = ?`, [groupId]);

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: '메일 그룹이 삭제되었습니다.'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Mail Group DELETE Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  } finally {
    connection.release();
  }
}
