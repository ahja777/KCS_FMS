import pool from './db';
import { RowDataPacket } from 'mysql2';

export async function generateJobNo(
  tableName: string,
  prefix: string
): Promise<string> {
  const year = new Date().getFullYear();
  const fullPrefix = `${prefix}-${year}-`;
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT IFNULL(MAX(CAST(SUBSTRING(JOB_NO, ?) AS UNSIGNED)), 0) as max_seq
     FROM ${tableName}
     WHERE JOB_NO LIKE ?
       AND JOB_NO REGEXP CONCAT(?, '[0-9]{4}$')`,
    [fullPrefix.length + 1, `${fullPrefix}%`, fullPrefix]
  );
  const seq = Number(rows[0].max_seq) + 1;
  return `${fullPrefix}${String(seq).padStart(4, '0')}`;
}

export async function ensureJobNoColumn(tableName: string): Promise<void> {
  await pool.query(
    `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS JOB_NO VARCHAR(30) DEFAULT NULL`
  );
}
