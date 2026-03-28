const fs = require('fs');
const path = require('path');

const basePath = '/Users/hur_chulwon/Project/AI_Claude/Clip/KCS_FMS/src/app/logis';

const pages = [
  { file: 'booking/air/page.tsx', regPath: '/logis/booking/air/register', idField: 'id' },
  { file: 'schedule/sea/page.tsx', regPath: '/logis/schedule/sea/register', idField: 'id' },
  { file: 'schedule/air/page.tsx', regPath: '/logis/schedule/air/register', idField: 'id' },
  { file: 'bl/sea/house/page.tsx', regPath: '/logis/bl/sea/house/register', idField: 'hbl_id' },
  { file: 'bl/sea/master/page.tsx', regPath: '/logis/bl/sea/master/register', idField: 'mbl_id' },
  { file: 'bl/air/house/page.tsx', regPath: '/logis/bl/air/house/register', idField: 'ID' },
  { file: 'bl/air/master/page.tsx', regPath: '/logis/bl/air/master/register', idField: 'ID' },
  { file: 'sn/sea/page.tsx', regPath: '/logis/sn/sea/register', idField: 'id' },
  { file: 'an/sea/page.tsx', regPath: '/logis/an/sea/register', idField: 'id' },
  { file: 'an/air/page.tsx', regPath: '/logis/an/air/register', idField: 'id' },
  { file: 'customs/sea/page.tsx', regPath: '/logis/customs/sea/register', idField: 'id' },
  { file: 'ams/sea/page.tsx', regPath: '/logis/ams/sea/register', idField: 'id' },
  { file: 'manifest/sea/page.tsx', regPath: '/logis/manifest/sea/register', idField: 'id' },
  { file: 'cargo/release/page.tsx', regPath: '/logis/cargo/release/register', idField: 'id' },
  { file: 'export-awb/air/page.tsx', regPath: '/logis/export-awb/air/register', idField: 'mawb_id' },
  { file: 'export-bl/manage/page.tsx', regPath: '/logis/export-bl/manage/register', idField: 'id' },
  { file: 'import-bl/sea/house/page.tsx', regPath: '/logis/import-bl/sea/house/register', idField: 'hbl_id' },
  { file: 'import-bl/sea/master/page.tsx', regPath: '/logis/import-bl/sea/master/register', idField: 'mbl_id' },
  { file: 'import-bl/air/page.tsx', regPath: '/logis/import-bl/air/register', idField: 'mawb_id' },
  { file: 'import-bl/air/house/page.tsx', regPath: '/logis/import-bl/air/house/register', idField: 'ID' },
  { file: 'import-bl/air/master/page.tsx', regPath: '/logis/import-bl/air/master/register', idField: 'ID' },
  { file: 'rate/corporate/sea/page.tsx', regPath: '/logis/rate/corporate/sea/register', idField: 'RATE_ID' },
];

let modified = 0, skipped = 0;

for (const pg of pages) {
  const filePath = path.join(basePath, pg.file);
  if (!fs.existsSync(filePath)) { console.log('SKIP (not found): ' + pg.file); skipped++; continue; }

  let content = fs.readFileSync(filePath, 'utf-8');

  if (content.includes('handleEdit')) { console.log('SKIP (has edit): ' + pg.file); skipped++; continue; }

  // 선택 변수 감지
  let selSize, selFirst, selType;
  if (content.includes('selectedIds') && content.includes('.size')) {
    selSize = 'selectedIds.size'; selFirst = 'Array.from(selectedIds)[0]'; selType = 'set';
  } else if (content.includes('selectedRows') && content.includes('selectedRows.length')) {
    selSize = 'selectedRows.length'; selFirst = 'selectedRows[0]'; selType = 'array';
  } else if (content.includes('selectedIds') && content.includes('.length')) {
    selSize = 'selectedIds.length'; selFirst = 'selectedIds[0]'; selType = 'array-ids';
  } else if (content.includes('selectedRows')) {
    selSize = 'selectedRows.length'; selFirst = 'selectedRows[0]'; selType = 'array-default';
  } else if (content.includes('selectedIds')) {
    selSize = 'selectedIds.size'; selFirst = 'Array.from(selectedIds)[0]'; selType = 'set-default';
  } else {
    console.log('SKIP (no selection): ' + pg.file); skipped++; continue;
  }

  // handleEdit 함수
  const editFn = `\n  // 수정 버튼 핸들러\n  const handleEdit = () => {\n    if (${selSize} === 0) { alert('수정할 항목을 선택해주세요.'); return; }\n    if (${selSize} > 1) { alert('수정할 항목을 1개만 선택해주세요.'); return; }\n    const id = ${selFirst};\n    router.push(\`${pg.regPath}?id=\${id}\`);\n  };\n`;

  // 삽입 위치 찾기: 삭제 핸들러 앞
  let inserted = false;

  // 패턴 1: // 삭제 주석
  const delComment = content.match(/(\n\s*\/\/\s*삭제)/);
  if (delComment) {
    content = content.replace(delComment[0], editFn + delComment[0]);
    inserted = true;
  }

  // 패턴 2: handleDelete 함수
  if (!inserted) {
    const delFn = content.match(/(\n\s*const handleDelete)/);
    if (delFn) {
      content = content.replace(delFn[0], editFn + delFn[0]);
      inserted = true;
    }
  }

  // 패턴 3: return 문 앞
  if (!inserted) {
    const returnMatch = content.match(/(\n\s*return\s*\(\s*\n)/);
    if (returnMatch) {
      content = content.replace(returnMatch[0], editFn + returnMatch[0]);
      inserted = true;
    }
  }

  if (!inserted) { console.log('SKIP (no insert point): ' + pg.file); skipped++; continue; }

  // 수정 버튼 HTML - 신규 버튼 뒤에 추가
  const editBtnHtml = `\n              <button onClick={handleEdit} className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] text-sm">\n                수정\n              </button>`;

  // 신규 버튼 찾기
  const newBtn = content.match(/(>\s*신규\s*<\/button>)/);
  if (newBtn) {
    content = content.replace(newBtn[0], newBtn[0] + editBtnHtml);
  } else {
    // 등록 버튼 찾기
    const regBtn = content.match(/(>\s*등록\s*<\/button>)/);
    if (regBtn) {
      content = content.replace(regBtn[0], regBtn[0] + editBtnHtml);
    } else {
      // 삭제 버튼 앞에 수정 버튼 + 신규 버튼 추가
      const delBtn = content.match(/(<button[^>]*onClick=\{[^}]*[Dd]elete[^}]*\}[^>]*>)/);
      if (delBtn) {
        const newAndEdit = `<button onClick={() => router.push('${pg.regPath}')} className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] text-sm">신규</button>${editBtnHtml}\n              `;
        content = content.replace(delBtn[0], newAndEdit + delBtn[0]);
      }
    }
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  modified++;
  console.log('MODIFIED: ' + pg.file + ' (sel=' + selType + ')');
}

console.log('\n=== 결과: ' + modified + '개 수정, ' + skipped + '개 스킵 ===');
