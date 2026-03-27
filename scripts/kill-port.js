/**
 * 지정 포트를 사용 중인 프로세스를 종료
 * Usage: node scripts/kill-port.js [port]
 */
const { execSync } = require('child_process');
const port = process.argv[2] || '3600';

try {
  const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf-8' });
  const pids = new Set();
  for (const line of output.split('\n')) {
    const match = line.trim().match(/LISTENING\s+(\d+)/);
    if (match) pids.add(match[1]);
  }
  for (const pid of pids) {
    try {
      execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
      console.log(`Killed process ${pid} on port ${port}`);
    } catch { /* already dead */ }
  }
} catch {
  // no process on port - that's fine
}
