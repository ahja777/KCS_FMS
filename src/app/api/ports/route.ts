import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// 기본 항구 데이터 (테이블이 없을 경우 사용)
const defaultPorts = [
  { port_cd: 'KRPUS', port_name: '부산항', country_cd: 'KR', port_type: 'SEA' },
  { port_cd: 'KRINC', port_name: '인천항', country_cd: 'KR', port_type: 'SEA' },
  { port_cd: 'KRKAN', port_name: '광양항', country_cd: 'KR', port_type: 'SEA' },
  { port_cd: 'KRULN', port_name: '울산항', country_cd: 'KR', port_type: 'SEA' },
  { port_cd: 'CNSHA', port_name: '상하이항', country_cd: 'CN', port_type: 'SEA' },
  { port_cd: 'CNNGB', port_name: '닝보항', country_cd: 'CN', port_type: 'SEA' },
  { port_cd: 'CNTAO', port_name: '칭다오항', country_cd: 'CN', port_type: 'SEA' },
  { port_cd: 'CNSZX', port_name: '심천항', country_cd: 'CN', port_type: 'SEA' },
  { port_cd: 'HKHKG', port_name: '홍콩항', country_cd: 'HK', port_type: 'SEA' },
  { port_cd: 'SGSIN', port_name: '싱가포르항', country_cd: 'SG', port_type: 'SEA' },
  { port_cd: 'JPTYO', port_name: '도쿄항', country_cd: 'JP', port_type: 'SEA' },
  { port_cd: 'JPYOK', port_name: '요코하마항', country_cd: 'JP', port_type: 'SEA' },
  { port_cd: 'JPOSA', port_name: '오사카항', country_cd: 'JP', port_type: 'SEA' },
  { port_cd: 'JPKOB', port_name: '고베항', country_cd: 'JP', port_type: 'SEA' },
  { port_cd: 'USLAX', port_name: 'LA항', country_cd: 'US', port_type: 'SEA' },
  { port_cd: 'USLGB', port_name: '롱비치항', country_cd: 'US', port_type: 'SEA' },
  { port_cd: 'USNYC', port_name: '뉴욕항', country_cd: 'US', port_type: 'SEA' },
  { port_cd: 'USHOU', port_name: '휴스턴항', country_cd: 'US', port_type: 'SEA' },
  { port_cd: 'USSEA', port_name: '시애틀항', country_cd: 'US', port_type: 'SEA' },
  { port_cd: 'DEHAM', port_name: '함부르크항', country_cd: 'DE', port_type: 'SEA' },
  { port_cd: 'NLRTM', port_name: '로테르담항', country_cd: 'NL', port_type: 'SEA' },
  { port_cd: 'BEANR', port_name: '앤트워프항', country_cd: 'BE', port_type: 'SEA' },
  { port_cd: 'GBFXT', port_name: '펠릭스토우항', country_cd: 'GB', port_type: 'SEA' },
  { port_cd: 'FRLEH', port_name: '르아브르항', country_cd: 'FR', port_type: 'SEA' },
  { port_cd: 'VNSGN', port_name: '호치민항', country_cd: 'VN', port_type: 'SEA' },
  { port_cd: 'VNHPH', port_name: '하이퐁항', country_cd: 'VN', port_type: 'SEA' },
  { port_cd: 'THLCH', port_name: '램차방항', country_cd: 'TH', port_type: 'SEA' },
  { port_cd: 'MYTPP', port_name: '탄중펠레파스항', country_cd: 'MY', port_type: 'SEA' },
  { port_cd: 'IDTPP', port_name: '탄중프리옥항', country_cd: 'ID', port_type: 'SEA' },
  { port_cd: 'PHMNL', port_name: '마닐라항', country_cd: 'PH', port_type: 'SEA' },
];

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT
        PORT_CD as port_cd,
        PORT_NM as port_name,
        COUNTRY_CD as country_cd
      FROM MST_PORT
      WHERE USE_YN = 'Y'
      ORDER BY PORT_CD
    `);

    // DB 조회 성공 시 port_type 기본값 추가
    const portsWithType = (rows as Array<{port_cd: string; port_name: string; country_cd: string}>).map(row => ({
      ...row,
      port_type: 'SEA'
    }));

    return NextResponse.json(portsWithType);
  } catch (error) {
    console.error('Database error (MST_PORT):', error);
    // 테이블이 없거나 에러 발생 시 기본 데이터 반환
    console.log('Returning default port data');
    return NextResponse.json(defaultPorts);
  }
}
