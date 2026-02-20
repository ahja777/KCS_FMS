/**
 * Hyper-V 예약 포트 범위를 회피하여 사용 가능한 포트를 자동 탐지
 * stdout으로 사용 가능한 포트 번호 출력
 */
const { execSync } = require('child_process');
const net = require('net');

// 선호 포트 목록 (순서대로 시도)
const PREFERRED_PORTS = [3600, 4000, 5000, 5173, 8080, 8000, 9000, 3001, 3002, 3003];

function getExcludedRanges() {
  try {
    const output = execSync('netsh interface ipv4 show excludedportrange protocol=tcp', {
      encoding: 'utf-8',
      timeout: 5000,
    });
    const ranges = [];
    for (const line of output.split('\n')) {
      const match = line.match(/^\s*(\d+)\s+(\d+)\s*/);
      if (match) {
        ranges.push({ start: Number(match[1]), end: Number(match[2]) });
      }
    }
    return ranges;
  } catch {
    return [];
  }
}

function isInExcludedRange(port, ranges) {
  return ranges.some(r => port >= r.start && port <= r.end);
}

function tryBind(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '127.0.0.1');
  });
}

async function findPort() {
  const excluded = getExcludedRanges();

  // 선호 포트를 우선 시도
  for (const port of PREFERRED_PORTS) {
    if (isInExcludedRange(port, excluded)) continue;
    if (await tryBind(port)) {
      console.log(port);
      return;
    }
  }

  // 선호 포트가 모두 실패하면 3600~9999 범위에서 탐색
  for (let port = 3600; port <= 9999; port++) {
    if (PREFERRED_PORTS.includes(port)) continue;
    if (isInExcludedRange(port, excluded)) continue;
    if (await tryBind(port)) {
      console.log(port);
      return;
    }
  }

  // 최후 수단: OS에게 랜덤 포트 할당
  const server = net.createServer();
  server.listen(0, '127.0.0.1', () => {
    const port = server.address().port;
    server.close(() => console.log(port));
  });
}

findPort();
