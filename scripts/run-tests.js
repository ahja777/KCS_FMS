/**
 * 자동 포트 탐지 후 Playwright 테스트 실행
 * Usage: node scripts/run-tests.js [playwright args...]
 */
const { execSync, spawn } = require('child_process');
const path = require('path');

const port = process.env.PORT || execSync('node scripts/find-port.js', { encoding: 'utf-8' }).trim();
const args = process.argv.slice(2);

console.log(`\n  Running Playwright tests with port ${port}...\n`);

const playwrightCli = path.join(__dirname, '..', 'node_modules', '@playwright', 'test', 'cli.js');
const child = spawn(process.execPath, [playwrightCli, 'test', ...args], {
  stdio: 'inherit',
  env: { ...process.env, PORT: port },
});

child.on('exit', (code) => process.exit(code ?? 0));
