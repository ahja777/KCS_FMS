/**
 * 자동 포트 탐지 후 Next.js dev 서버 시작 + 크롬 자동 열기
 *
 * 실행 방법:
 *   fms-web.vbs (더블클릭) → 창 없이 서버 시작 + 크롬 자동 열기
 *   npm run dev:auto          → 터미널에서 서버 시작 + 크롬 자동 열기
 */
const { execSync, spawn } = require('child_process');
const path = require('path');
const http = require('http');

const port = process.env.PORT || execSync('node scripts/find-port.js', { encoding: 'utf-8' }).trim();
const url = `http://localhost:${port}`;
const nextBin = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'bin', 'next');

console.log(`\n  Next.js dev server starting on port ${port}...\n`);

const child = spawn(process.execPath, [nextBin, 'dev', '--turbopack', '-p', port], {
  stdio: 'inherit',
  env: { ...process.env, PORT: port },
});

// 서버 Ready 감지 후 크롬 열기 (1회만)
let opened = false;
function waitAndOpen() {
  if (opened) return;
  const req = http.get(url, (res) => {
    res.resume();
    if (opened) return;
    if (res.statusCode < 500) {
      opened = true;
      console.log(`\n  Browser opening: ${url}\n`);
      const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
      spawn(chrome, [url], { stdio: 'ignore', detached: true }).unref();
    } else {
      setTimeout(waitAndOpen, 1000);
    }
  });
  req.on('error', () => setTimeout(waitAndOpen, 1000));
  req.setTimeout(3000, () => { req.destroy(); setTimeout(waitAndOpen, 1000); });
}
setTimeout(waitAndOpen, 2000);

child.on('exit', (code) => process.exit(code ?? 0));
