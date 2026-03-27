import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: false, defaultViewport: { width: 1400, height: 900 } });
const page = await browser.newPage();

async function findByText(text) {
  await new Promise(r => setTimeout(r, 500));
  const els = await page.$$('button, span, h3, p');
  const results = [];
  for (const el of els) {
    const t = await page.evaluate(e => e.textContent, el);
    if (t && t.includes(text)) results.push(el);
  }
  return results;
}

console.log('1. 적하목록 등록 페이지 이동...');
await page.goto('http://localhost:3000/logis/manifest/sea/register', { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise(r => setTimeout(r, 3000));

// 닫기 버튼 확인
let closeBtns = await findByText('화면닫기');
console.log('2. 화면닫기 버튼:', closeBtns.length > 0 ? 'YES' : 'NO');

// 변경사항 없이 닫기 → 바로 이동
console.log('3. 변경사항 없이 닫기 클릭...');
const btn = await page.$('button[title="화면닫기"]');
if (btn) await btn.click();
await new Promise(r => setTimeout(r, 3000));
console.log('   URL:', page.url());
console.log('   목록 이동:', !page.url().includes('/register') ? 'PASS' : 'FAIL');

// 다시 등록 페이지
console.log('\n4. 다시 등록 페이지로...');
await page.goto('http://localhost:3000/logis/manifest/sea/register', { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise(r => setTimeout(r, 3000));

// 입력
console.log('5. 데이터 입력...');
const inputs = await page.$$('input[type="text"]');
console.log('   input 개수:', inputs.length);
if (inputs.length > 0) {
  await inputs[0].click({ clickCount: 3 });
  await inputs[0].type('TEST-MANIFEST');
  console.log('   입력 완료');
}
await new Promise(r => setTimeout(r, 1000));

// 닫기 클릭
console.log('6. 변경사항 있는 상태에서 닫기 클릭...');
const btn2 = await page.$('button[title="화면닫기"]');
if (btn2) await btn2.click();
await new Promise(r => setTimeout(r, 2000));

// 팝업 확인
const modalTitle = await findByText('저장 확인');
const discardBtn = await findByText('저장 안함');
const cancelBtn = await findByText('취소');

console.log('7. 팝업 결과:');
console.log('   저장 확인 타이틀:', modalTitle.length > 0 ? 'YES' : 'NO');
console.log('   저장 안함 버튼:', discardBtn.length > 0 ? 'YES' : 'NO');
console.log('   취소 버튼:', cancelBtn.length > 0 ? 'YES' : 'NO');
console.log('   현재 URL:', page.url());
const onRegister = page.url().includes('/register');
console.log('   등록 페이지 유지:', onRegister ? 'YES' : 'NO');

if (modalTitle.length > 0) {
  console.log('\n   >>> 확인 팝업 정상 표시! <<<');

  // 취소 클릭
  console.log('8. 취소 클릭...');
  if (cancelBtn.length > 0) await cancelBtn[0].click();
  await new Promise(r => setTimeout(r, 1000));
  console.log('   등록 유지:', page.url().includes('/register') ? 'PASS' : 'FAIL');

  // 다시 닫기 → 저장 안함
  console.log('9. 다시 닫기 → 저장 안함...');
  const btn3 = await page.$('button[title="화면닫기"]');
  if (btn3) await btn3.click();
  await new Promise(r => setTimeout(r, 2000));
  const discard2 = await findByText('저장 안함');
  if (discard2.length > 0) await discard2[0].click();
  await new Promise(r => setTimeout(r, 3000));
  console.log('   최종 URL:', page.url());
  console.log('   목록 이동:', !page.url().includes('/register') ? 'PASS' : 'FAIL');
} else {
  console.log('\n   >>> 팝업 미표시 - hasUnsavedChanges 미동작 <<<');
}

console.log('\n=== 테스트 완료 ===');
await new Promise(r => setTimeout(r, 2000));
await browser.close();
