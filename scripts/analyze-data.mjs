import mysql from 'mysql2/promise';

const pool = mysql.createPool({host:'211.236.174.220',port:53306,user:'user',password:'P@ssw0rd',database:'logstic'});

const [tables] = await pool.query("SHOW TABLES");
const tableNames = tables.map(t => Object.values(t)[0]);
const keyTables = tableNames.filter(t => t.startsWith('ORD_') || t.startsWith('MST_'));

for (const table of keyTables) {
  try {
    const [rows] = await pool.query(`SELECT * FROM ${table} LIMIT 50`);
    if (rows.length === 0) continue;
    console.log(`\n=== ${table} (${rows.length} rows) ===`);
    for (const row of rows) {
      const textFields = {};
      for (const [k,v] of Object.entries(row)) {
        if (typeof v === 'string' && v.length > 0 &&
            !k.includes('_DTM') && !k.includes('_YN') &&
            k !== 'CREATED_BY' && k !== 'UPDATED_BY') {
          textFields[k] = v;
        }
      }
      if (Object.keys(textFields).length > 0) console.log(JSON.stringify(textFields));
    }
  } catch(e) { console.log(`${table}: ${e.message}`); }
}
await pool.end();
