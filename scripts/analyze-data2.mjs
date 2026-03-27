import mysql from 'mysql2/promise';

const pool = mysql.createPool({host:'211.236.174.220',port:53306,user:'user',password:'P@ssw0rd',database:'logstic',charset:'utf8mb4'});

// Check all ORD_ tables for problematic data
const ordTables = [
  'ORD_OCEAN_BOOKING', 'ORD_AIR_BOOKING', 'ORD_OCEAN_BL', 'ORD_AIR_AWB',
  'ORD_SEA_SR', 'ORD_SEA_SN', 'ORD_OCEAN_SCHEDULE', 'ORD_QUOTE_SEA', 'ORD_QUOTE_AIR'
];

for (const table of ordTables) {
  try {
    const [rows] = await pool.query(`SELECT * FROM ${table} WHERE DEL_YN = 'N' OR DEL_YN IS NULL`);
    if (rows.length === 0) continue;

    console.log(`\n=== ${table} (${rows.length} rows) ===`);
    for (const row of rows) {
      const id = row.BOOKING_ID || row.SR_ID || row.SN_ID || row.BL_ID || row.AWB_ID || row.SCHEDULE_ID || row.QUOTE_ID || 'unknown';
      const key = row.BOOKING_NO || row.SR_NO || row.SN_NO || row.JOB_NO || row.SCHEDULE_NO || row.QUOTE_NO || '';

      // Find fields with garbled text (contains replacement char or mojibake patterns)
      const issues = [];
      for (const [k,v] of Object.entries(row)) {
        if (typeof v !== 'string' || v.length === 0) continue;
        // Check for garbled chars
        const hasGarbled = /[\ufffd]|[\u00c0-\u00ff]{2,}|[�]/.test(v);
        // Check for mixed Korean+English in same field (excluding standard patterns)
        const hasKorean = /[\uac00-\ud7af]/.test(v);
        const hasEnglish = /[a-zA-Z]{2,}/.test(v);

        if (hasGarbled) {
          issues.push({ field: k, value: v, type: 'GARBLED' });
        }
      }

      if (issues.length > 0) {
        console.log(`ID=${id} KEY=${key}`);
        for (const i of issues) {
          console.log(`  [${i.type}] ${i.field}: "${i.value}"`);
        }
      }
    }
  } catch(e) { /* skip */ }
}

// Also check for inconsistent commodity descriptions
console.log('\n=== COMMODITY_DESC 분석 ===');
for (const table of ['ORD_OCEAN_BOOKING', 'ORD_AIR_BOOKING']) {
  try {
    const [rows] = await pool.query(`SELECT BOOKING_ID, BOOKING_NO, COMMODITY_DESC, REMARKS, SHIPPER_NM, CONSIGNEE_NM, STATUS_CD FROM ${table} WHERE DEL_YN = 'N'`);
    console.log(`\n${table}:`);
    for (const r of rows) {
      console.log(`  ${r.BOOKING_NO}: commodity="${r.COMMODITY_DESC||''}" shipper="${r.SHIPPER_NM||''}" consignee="${r.CONSIGNEE_NM||''}" remarks="${r.REMARKS||''}" status=${r.STATUS_CD}`);
    }
  } catch(e) {}
}

await pool.end();
