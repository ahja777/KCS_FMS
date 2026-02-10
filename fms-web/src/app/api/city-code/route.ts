import { NextRequest, NextResponse } from 'next/server';
import { queryWithLog } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// 도시코드 시드 데이터 (엑셀 101건 중 A-00 제외한 100건)
const CITY_SEED_DATA = [
  { code: 'QET', name: '대덕', country: 'KR', useYn: 'Y', sortOrder: 1131 },
  { code: 'DSN', name: '대산', country: 'KR', useYn: 'Y', sortOrder: 1553 },
  { code: 'TSN', name: '대산', country: 'KR', useYn: 'Y', sortOrder: 928 },
  { code: 'TJN', name: '대전', country: 'KR', useYn: 'Y', sortOrder: 927 },
  { code: 'DDO', name: '독도', country: 'KR', useYn: 'Y', sortOrder: 792 },
  { code: 'TGH', name: '동해', country: 'KR', useYn: 'Y', sortOrder: 798 },
  { code: 'MAS', name: '마산', country: 'KR', useYn: 'Y', sortOrder: 840 },
  { code: 'MOK', name: '목포', country: 'KR', useYn: 'Y', sortOrder: 794 },
  { code: 'MPK', name: '목포공항', country: 'KR', useYn: 'Y', sortOrder: 795 },
  { code: 'MUK', name: '목호', country: 'KR', useYn: 'Y', sortOrder: 796 },
  { code: 'MSN', name: '문산', country: 'KR', useYn: 'Y', sortOrder: 841 },
  { code: 'MIP', name: '미포', country: 'KR', useYn: 'Y', sortOrder: 1233 },
  { code: 'BOR', name: '보령', country: 'KR', useYn: 'Y', sortOrder: 1000 },
  { code: 'PUS', name: '부산', country: 'KR', useYn: 'Y', sortOrder: 888 },
  { code: 'BUK', name: '북평', country: 'KR', useYn: 'Y', sortOrder: 838 },
  { code: 'SAH', name: '사천', country: 'KR', useYn: 'Y', sortOrder: 647 },
  { code: 'SUK', name: '삼척', country: 'KR', useYn: 'Y', sortOrder: 1132 },
  { code: 'SCP', name: '삼천포', country: 'KR', useYn: 'Y', sortOrder: 1341 },
  { code: 'SPO', name: '서귀포', country: 'KR', useYn: 'Y', sortOrder: 1091 },
  { code: 'SEL', name: '서울', country: 'KR', useYn: 'Y', sortOrder: 750 },
  { code: 'SSN', name: '성남(Seoul Ab)', country: 'KR', useYn: 'Y', sortOrder: 1092 },
  { code: 'SSP', name: '성산포', country: 'KR', useYn: 'Y', sortOrder: 1234 },
  { code: 'SHO', name: '속초', country: 'KR', useYn: 'Y', sortOrder: 1712 },
  { code: 'SUO', name: '수원', country: 'KR', useYn: 'Y', sortOrder: 596 },
  { code: 'SWU', name: '수원(ex Su Won City)', country: 'KR', useYn: 'Y', sortOrder: 1133 },
  { code: 'SYS', name: '순천', country: 'KR', useYn: 'Y', sortOrder: 693 },
  { code: 'SIG', name: '시흥(서울)', country: 'KR', useYn: 'Y', sortOrder: 1296 },
  { code: 'STJ', name: '신탄진', country: 'KR', useYn: 'Y', sortOrder: 648 },
  { code: 'SHG', name: '신항', country: 'KR', useYn: 'Y', sortOrder: 1711 },
  { code: 'ASA', name: '아산', country: 'KR', useYn: 'Y', sortOrder: 1033 },
  { code: 'ASN', name: '안산', country: 'KR', useYn: 'Y', sortOrder: 999 },
  { code: 'ASG', name: '안성', country: 'KR', useYn: 'Y', sortOrder: 1552 },
  { code: 'ANY', name: '안양', country: 'KR', useYn: 'Y', sortOrder: 2098 },
  { code: 'TAE', name: '대구', country: 'KR', useYn: 'Y', sortOrder: 926 },
  { code: 'TJI', name: '당진', country: 'KR', useYn: 'Y', sortOrder: 751 },
  { code: 'DBL', name: '대불', country: 'KR', useYn: 'Y', sortOrder: 886 },
  { code: 'NYJ', name: '남양', country: 'KR', useYn: 'Y', sortOrder: 645 },
  { code: 'NJU', name: '나주', country: 'KR', useYn: 'Y', sortOrder: 1130 },
  { code: 'KMH', name: '김해', country: 'KR', useYn: 'Y', sortOrder: 692 },
  { code: 'KIM', name: '김포(INT)', country: 'KR', useYn: 'Y', sortOrder: 924 },
  { code: 'GMP', name: '김포', country: 'KR', useYn: 'Y', sortOrder: 1089 },
  { code: 'KMC', name: '김천', country: 'KR', useYn: 'Y', sortOrder: 691 },
  { code: 'KHG', name: '기흥', country: 'KR', useYn: 'Y', sortOrder: 1231 },
  { code: 'KUP', name: '군포(INT)', country: 'KR', useYn: 'Y', sortOrder: 644 },
  { code: 'GUN', name: '군포', country: 'KR', useYn: 'Y', sortOrder: 1128 },
  { code: 'KUV', name: '군산', country: 'KR', useYn: 'Y', sortOrder: 1232 },
  { code: 'KUZ', name: '구산', country: 'KR', useYn: 'Y', sortOrder: 839 },
  { code: 'KUM', name: '구미', country: 'KR', useYn: 'Y', sortOrder: 1178 },
  { code: 'KWU', name: '광주', country: 'KR', useYn: 'Y', sortOrder: 748 },
  { code: 'KWJ', name: '광주', country: 'KR', useYn: 'Y', sortOrder: 793 },
  { code: 'KAN', name: '광양', country: 'KR', useYn: 'Y', sortOrder: 690 },
  { code: 'KHN', name: '고현', country: 'KR', useYn: 'Y', sortOrder: 1129 },
  { code: 'KOJ', name: '고정', country: 'KR', useYn: 'Y', sortOrder: 747 },
  { code: 'JGE', name: '거제', country: 'KR', useYn: 'Y', sortOrder: 1554 },
  { code: 'KJE', name: '거재', country: 'KR', useYn: 'Y', sortOrder: 746 },
  { code: 'KAG', name: '강릉', country: 'KR', useYn: 'Y', sortOrder: 1338 },
  { code: 'KCN', name: '감천', country: 'KR', useYn: 'Y', sortOrder: 1339 },
  { code: 'YSN', name: '양산', country: 'KR', useYn: 'Y', sortOrder: 650 },
  { code: 'YNY', name: '양양', country: 'KR', useYn: 'Y', sortOrder: 843 },
  { code: 'YOS', name: '여수', country: 'KR', useYn: 'Y', sortOrder: 1037 },
  { code: 'RSU', name: '여수공항', country: 'KR', useYn: 'Y', sortOrder: 842 },
  { code: 'YEC', name: '예천', country: 'KR', useYn: 'Y', sortOrder: 1713 },
  { code: 'OBG', name: '오봉', country: 'KR', useYn: 'Y', sortOrder: 1295 },
  { code: 'OSN', name: '오산', country: 'KR', useYn: 'Y', sortOrder: 1090 },
  { code: 'OKK', name: '옥계', country: 'KR', useYn: 'Y', sortOrder: 1709 },
  { code: 'OKP', name: '옥포', country: 'KR', useYn: 'Y', sortOrder: 925 },
  { code: 'ONS', name: '온산', country: 'KR', useYn: 'Y', sortOrder: 646 },
  { code: 'WND', name: '완도', country: 'KR', useYn: 'Y', sortOrder: 1036 },
  { code: 'YOC', name: '요촌', country: 'KR', useYn: 'Y', sortOrder: 1236 },
  { code: 'YNG', name: '용진', country: 'KR', useYn: 'Y', sortOrder: 598 },
  { code: 'WSN', name: '원산', country: 'KR', useYn: 'Y', sortOrder: 1094 },
  { code: 'WJU', name: '원주', country: 'KR', useYn: 'Y', sortOrder: 1093 },
  { code: 'USN', name: '의산', country: 'KR', useYn: 'Y', sortOrder: 649 },
  { code: 'UWN', name: '의왕', country: 'KR', useYn: 'Y', sortOrder: 597 },
  { code: 'UIJ', name: '의정부', country: 'KR', useYn: 'Y', sortOrder: 929 },
  { code: 'IKS', name: '익산', country: 'KR', useYn: 'Y', sortOrder: 1035 },
  { code: 'ICH', name: '인천', country: 'KR', useYn: 'Y', sortOrder: 744 },
  { code: 'ICN', name: '인천국제공항', country: 'KR', useYn: 'Y', sortOrder: 745 },
  { code: 'JSN', name: '장성', country: 'KR', useYn: 'Y', sortOrder: 1177 },
  { code: 'CHG', name: '장항', country: 'KR', useYn: 'Y', sortOrder: 643 },
  { code: 'CHI', name: '전의', country: 'KR', useYn: 'Y', sortOrder: 1294 },
  { code: 'CHN', name: '전주', country: 'KR', useYn: 'Y', sortOrder: 1229 },
  { code: 'CHA', name: '제주', country: 'KR', useYn: 'Y', sortOrder: 791 },
  { code: 'JIY', name: '진양군(경남)', country: 'KR', useYn: 'Y', sortOrder: 1176 },
  { code: 'HIN', name: '진주', country: 'KR', useYn: 'Y', sortOrder: 1708 },
  { code: 'CHF', name: '진해', country: 'KR', useYn: 'Y', sortOrder: 1293 },
  { code: 'CHW', name: '창원', country: 'KR', useYn: 'Y', sortOrder: 595 },
  { code: 'CHO', name: '천안', country: 'KR', useYn: 'Y', sortOrder: 1088 },
  { code: 'CJJ', name: '청주', country: 'KR', useYn: 'Y', sortOrder: 1230 },
  { code: 'CHC', name: '춘천', country: 'KR', useYn: 'Y', sortOrder: 885 },
  { code: 'CHU', name: '충주', country: 'KR', useYn: 'Y', sortOrder: 1175 },
  { code: 'TAN', name: '태안', country: 'KR', useYn: 'Y', sortOrder: 1235 },
  { code: 'TYG', name: '통영', country: 'KR', useYn: 'Y', sortOrder: 694 },
  { code: 'PMJ', name: '판문점', country: 'KR', useYn: 'Y', sortOrder: 749 },
  { code: 'PTK', name: '평택', country: 'KR', useYn: 'Y', sortOrder: 797 },
  { code: 'POC', name: '포천', country: 'KR', useYn: 'Y', sortOrder: 1710 },
  { code: 'KPO', name: '포항', country: 'KR', useYn: 'Y', sortOrder: 1340 },
  { code: 'HYP', name: '현풍', country: 'KR', useYn: 'Y', sortOrder: 887 },
  { code: 'HSN', name: '화선', country: 'KR', useYn: 'Y', sortOrder: 1337 },
  { code: 'COJ', name: 'Chongju', country: 'KR', useYn: 'Y', sortOrder: 1034 },
];

// GET: 도시코드 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword') || '';
    const useYn = searchParams.get('useYn') || '';

    let sql = `
      SELECT CODE_CD AS code, CODE_NM AS nameKr, CODE_NM_EN AS nameEn,
             ATTR1 AS country, USE_YN AS useYn, SORT_ORDER AS sortOrder
      FROM MST_COMMON_CODE
      WHERE CODE_GROUP_ID = 'KR_CITY' AND DEL_YN = 'N'
    `;
    const params: string[] = [];

    if (keyword) {
      sql += ` AND (CODE_CD LIKE ? OR CODE_NM LIKE ? OR CODE_NM_EN LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (useYn) {
      sql += ` AND USE_YN = ?`;
      params.push(useYn);
    }

    sql += ` ORDER BY SORT_ORDER, CODE_CD`;

    const [rows] = await queryWithLog<RowDataPacket[]>(sql, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('City code GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch city codes' }, { status: 500 });
  }
}

// POST: 시드 데이터 일괄 등록
export async function POST() {
  try {
    // 1. MST_CODE_GROUP에 KR_CITY 그룹 추가
    await queryWithLog<ResultSetHeader>(
      `INSERT IGNORE INTO MST_CODE_GROUP (GROUP_CD, GROUP_NM, GROUP_NM_E, DESCRIPTION, USE_YN, SORT_ORDER)
       VALUES ('KR_CITY', '국내도시코드', 'Korea City Code', '국내 도시코드 관리', 'Y', 100)`
    );

    // 2. 시드 데이터 일괄 등록 (ON DUPLICATE KEY UPDATE)
    let insertCount = 0;
    for (const city of CITY_SEED_DATA) {
      await queryWithLog<ResultSetHeader>(
        `INSERT INTO MST_COMMON_CODE (CODE_GROUP_ID, CODE_CD, CODE_NM, CODE_NM_EN, SORT_ORDER, ATTR1, USE_YN, CREATED_BY, CREATED_DTM, DEL_YN)
         VALUES ('KR_CITY', ?, ?, ?, ?, ?, ?, 'SYSTEM', NOW(), 'N')
         ON DUPLICATE KEY UPDATE CODE_NM=VALUES(CODE_NM), CODE_NM_EN=VALUES(CODE_NM_EN),
         SORT_ORDER=VALUES(SORT_ORDER), ATTR1=VALUES(ATTR1), USE_YN=VALUES(USE_YN),
         UPDATED_BY='SYSTEM', UPDATED_DTM=NOW(), DEL_YN='N'`,
        [city.code, city.name, city.name, city.sortOrder, city.country, city.useYn]
      );
      insertCount++;
    }

    return NextResponse.json({ success: true, count: insertCount });
  } catch (error) {
    console.error('City code seed error:', error);
    return NextResponse.json({ error: 'Failed to seed city codes' }, { status: 500 });
  }
}
