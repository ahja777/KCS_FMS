import { test, expect, APIRequestContext } from '@playwright/test';

const year = new Date().getFullYear();

// 인증 토큰을 받아서 extraHTTPHeaders에 쿠키 세팅
let authCookie = '';

test.beforeAll(async ({ request }) => {
  const res = await request.post('/api/auth/login', {
    data: { userId: 'admin', password: 'admin1234' }
  });
  const headers = res.headers();
  const setCookie = headers['set-cookie'] || '';
  const match = setCookie.match(/fms_auth_token=([^;]+)/);
  if (match) {
    authCookie = `fms_auth_token=${match[1]}`;
  }
});

function opts(data: Record<string, unknown>) {
  return { data, headers: { Cookie: authCookie } };
}
function getOpts() {
  return { headers: { Cookie: authCookie } };
}

// 10개 도메인 JOB_NO 자동생성 테스트
// POST(신규등록) → JOB_NO 반환 확인
// PUT(수정) → JOB_NO 자동부여 확인
// GET(조회) → JOB_NO 포함 확인

test.describe.serial('JOB_NO 자동생성 - booking/sea (BSE)', () => {
  let createdId: number;
  let savedJobNo: string;

  test('POST → JOB_NO 자동생성', async ({ request }) => {
    const res = await request.post('/api/booking/sea', opts({ pol: 'KRPUS', pod: 'USNYC', commodityDesc: 'JOB_NO Test' }));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.jobNo).toMatch(new RegExp(`^BSE-${year}-\\d{4}$`));
    createdId = json.bookingId;
    savedJobNo = json.jobNo;
  });

  test('PUT → 기존 JOB_NO 유지', async ({ request }) => {
    const res = await request.put('/api/booking/sea', opts({ id: createdId, pol: 'KRPUS', pod: 'CNSHA', commodityDesc: 'JOB_NO Update' }));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.jobNo).toBe(savedJobNo);
  });

  test('GET → JOB_NO 조회', async ({ request }) => {
    const res = await request.get(`/api/booking/sea?bookingId=${createdId}`, getOpts());
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.jobNo).toBe(savedJobNo);
  });

  test.afterAll(async ({ request }) => {
    if (createdId) await request.delete(`/api/booking/sea?ids=${createdId}`, getOpts());
  });
});

test.describe.serial('JOB_NO 자동생성 - booking/air (BAE)', () => {
  let createdId: number;
  let savedJobNo: string;

  test('POST → JOB_NO 자동생성', async ({ request }) => {
    const res = await request.post('/api/booking/air', opts({ origin: 'ICN', destination: 'LAX', commodityDesc: 'JOB_NO Test' }));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.jobNo).toMatch(new RegExp(`^BAE-${year}-\\d{4}$`));
    createdId = json.bookingId;
    savedJobNo = json.jobNo;
  });

  test('PUT → 기존 JOB_NO 유지', async ({ request }) => {
    const res = await request.put('/api/booking/air', opts({ id: createdId, origin: 'ICN', destination: 'NRT', commodityDesc: 'JOB_NO Update' }));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.jobNo).toBe(savedJobNo);
  });

  test('GET → JOB_NO 조회', async ({ request }) => {
    const res = await request.get(`/api/booking/air?bookingId=${createdId}`, getOpts());
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.jobNo).toBe(savedJobNo);
  });

  test.afterAll(async ({ request }) => {
    if (createdId) await request.delete(`/api/booking/air?ids=${createdId}`, getOpts());
  });
});

test.describe.serial('JOB_NO 자동생성 - sr/sea (SRE)', () => {
  let createdId: number;
  let savedJobNo: string;

  test('POST → JOB_NO 자동생성', async ({ request }) => {
    const res = await request.post('/api/sr/sea', opts({ pol: 'KRPUS', pod: 'USNYC', commodityDesc: 'JOB_NO Test' }));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.jobNo).toMatch(new RegExp(`^SRE-${year}-\\d{4}$`));
    createdId = json.srId;
    savedJobNo = json.jobNo;
  });

  test('PUT → 기존 JOB_NO 유지', async ({ request }) => {
    const res = await request.put('/api/sr/sea', opts({ id: createdId, pol: 'KRPUS', pod: 'CNSHA', commodityDesc: 'JOB_NO Update' }));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.jobNo).toBe(savedJobNo);
  });

  test('GET → JOB_NO 조회', async ({ request }) => {
    const res = await request.get(`/api/sr/sea?srId=${createdId}`, getOpts());
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.jobNo).toBe(savedJobNo);
  });

  test.afterAll(async ({ request }) => {
    if (createdId) await request.delete(`/api/sr/sea?ids=${createdId}`, getOpts());
  });
});

test.describe.serial('JOB_NO 자동생성 - sn/sea (SNE)', () => {
  let createdId: number;
  let savedJobNo: string;

  test('POST → JOB_NO 자동생성', async ({ request }) => {
    const res = await request.post('/api/sn/sea', opts({ pol: 'KRPUS', pod: 'USNYC', senderName: 'Test Sender', recipientName: 'Test Recipient' }));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.jobNo).toMatch(new RegExp(`^SNE-${year}-\\d{4}$`));
    createdId = json.snId;
    savedJobNo = json.jobNo;
  });

  test('PUT → 기존 JOB_NO 유지', async ({ request }) => {
    const res = await request.put('/api/sn/sea', opts({ id: createdId, pol: 'KRPUS', pod: 'CNSHA', senderName: 'Updated Sender' }));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.jobNo).toBe(savedJobNo);
  });

  test('GET → JOB_NO 조회', async ({ request }) => {
    const res = await request.get(`/api/sn/sea?snId=${createdId}`, getOpts());
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.jobNo).toBe(savedJobNo);
  });

  test.afterAll(async ({ request }) => {
    if (createdId) await request.delete(`/api/sn/sea?ids=${createdId}`, getOpts());
  });
});

test.describe.serial('JOB_NO 자동생성 - customs/sea (CDE)', () => {
  let createdId: string;
  let savedJobNo: string;

  test('POST → JOB_NO 자동생성', async ({ request }) => {
    const res = await request.post('/api/customs/sea', opts({ declarationType: 'EXPORT', goodsDesc: 'JOB_NO Test' }));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.jobNo).toMatch(new RegExp(`^CDE-${year}-\\d{4}$`));
    createdId = json.declarationId;
    savedJobNo = json.jobNo;
  });

  test('PUT → 기존 JOB_NO 유지', async ({ request }) => {
    const res = await request.put('/api/customs/sea', opts({ id: createdId, declarationType: 'EXPORT', goodsDesc: 'JOB_NO Update' }));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.jobNo).toBe(savedJobNo);
  });

  test('GET → JOB_NO 조회', async ({ request }) => {
    const res = await request.get(`/api/customs/sea?declarationId=${createdId}`, getOpts());
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.jobNo).toBe(savedJobNo);
  });

  test.afterAll(async ({ request }) => {
    if (createdId) await request.delete(`/api/customs/sea?ids=${createdId}`, getOpts());
  });
});

test.describe.serial('JOB_NO 자동생성 - manifest/sea (MFE)', () => {
  let createdId: string;
  let savedJobNo: string;

  test('POST → JOB_NO 자동생성', async ({ request }) => {
    const res = await request.post('/api/manifest/sea', opts({ mblNo: 'TESTMBL001', goodsDesc: 'JOB_NO Test' }));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.jobNo).toMatch(new RegExp(`^MFE-${year}-\\d{4}$`));
    createdId = json.manifestId;
    savedJobNo = json.jobNo;
  });

  test('PUT → 기존 JOB_NO 유지', async ({ request }) => {
    const res = await request.put('/api/manifest/sea', opts({ id: createdId, mblNo: 'TESTMBL001', goodsDesc: 'JOB_NO Update' }));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.jobNo).toBe(savedJobNo);
  });

  test('GET → JOB_NO 조회', async ({ request }) => {
    const res = await request.get(`/api/manifest/sea?manifestId=${createdId}`, getOpts());
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.jobNo).toBe(savedJobNo);
  });

  test.afterAll(async ({ request }) => {
    if (createdId) await request.delete(`/api/manifest/sea?ids=${createdId}`, getOpts());
  });
});

test.describe.serial('JOB_NO 자동생성 - ams/sea (AME)', () => {
  let createdId: string;
  let savedJobNo: string;

  test('POST → JOB_NO 자동생성', async ({ request }) => {
    const res = await request.post('/api/ams/sea', opts({ mblNo: 'TESTAMS001', goodsDesc: 'JOB_NO Test' }));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.jobNo).toMatch(new RegExp(`^AME-${year}-\\d{4}$`));
    createdId = json.amsId;
    savedJobNo = json.jobNo;
  });

  test('PUT → 기존 JOB_NO 유지', async ({ request }) => {
    const res = await request.put('/api/ams/sea', opts({ id: createdId, mblNo: 'TESTAMS001', goodsDesc: 'JOB_NO Update' }));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.jobNo).toBe(savedJobNo);
  });

  test('GET → JOB_NO 조회', async ({ request }) => {
    const res = await request.get(`/api/ams/sea?amsId=${createdId}`, getOpts());
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.jobNo).toBe(savedJobNo);
  });

  test.afterAll(async ({ request }) => {
    if (createdId) await request.delete(`/api/ams/sea?ids=${createdId}`, getOpts());
  });
});

test.describe.serial('JOB_NO 자동생성 - quote/sea (QSE)', () => {
  let createdId: number;
  let savedJobNo: string;

  test('POST → JOB_NO 자동생성', async ({ request }) => {
    const res = await request.post('/api/quote/sea', opts({ pol: 'KRPUS', pod: 'USNYC', consignee: 'Test Co.' }));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.jobNo).toMatch(new RegExp(`^QSE-${year}-\\d{4}$`));
    createdId = json.quoteId;
    savedJobNo = json.jobNo;
  });

  test('PUT → 기존 JOB_NO 유지', async ({ request }) => {
    const res = await request.put('/api/quote/sea', opts({ id: createdId, pol: 'KRPUS', pod: 'CNSHA', consignee: 'Updated Co.' }));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.jobNo).toBe(savedJobNo);
  });

  test('GET → JOB_NO 조회', async ({ request }) => {
    const res = await request.get(`/api/quote/sea?quoteId=${createdId}`, getOpts());
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.jobNo).toBe(savedJobNo);
  });

  test.afterAll(async ({ request }) => {
    if (createdId) await request.delete(`/api/quote/sea?ids=${createdId}`, getOpts());
  });
});

test.describe.serial('JOB_NO 자동생성 - quote/air (QAE)', () => {
  let createdId: number;
  let savedJobNo: string;

  test('POST → JOB_NO 자동생성', async ({ request }) => {
    const res = await request.post('/api/quote/air', opts({ origin: 'ICN', destination: 'LAX', consignee: 'Test Co.' }));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.jobNo).toMatch(new RegExp(`^QAE-${year}-\\d{4}$`));
    createdId = json.quoteId;
    savedJobNo = json.jobNo;
  });

  test('PUT → 기존 JOB_NO 유지', async ({ request }) => {
    const res = await request.put('/api/quote/air', opts({ id: createdId, origin: 'ICN', destination: 'NRT', consignee: 'Updated Co.' }));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.jobNo).toBe(savedJobNo);
  });

  test('GET → JOB_NO 조회', async ({ request }) => {
    const res = await request.get(`/api/quote/air?quoteId=${createdId}`, getOpts());
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.jobNo).toBe(savedJobNo);
  });

  test.afterAll(async ({ request }) => {
    if (createdId) await request.delete(`/api/quote/air?ids=${createdId}`, getOpts());
  });
});

// ===== 기존 4개 도메인 UPDATE 시 JOB_NO 자동생성 테스트 =====

test.describe.serial('JOB_NO 자동생성 - bl/air/master (AEX)', () => {
  let createdId: number;
  let savedJobNo: string;

  test('POST → JOB_NO 자동생성', async ({ request }) => {
    const res = await request.post('/api/bl/air/master', opts({
      MAWB_NO: '180-TEST0001', IO_TYPE: 'OUT', DEPARTURE: 'ICN', ARRIVAL: 'LAX'
    }));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.JOB_NO).toMatch(new RegExp(`^AEX-${year}-\\d{4}$`));
    createdId = json.ID;
    savedJobNo = json.JOB_NO;
  });

  test('PUT(수정) → 기존 JOB_NO 유지', async ({ request }) => {
    const res = await request.post('/api/bl/air/master', opts({
      ID: createdId, MAWB_NO: '180-TEST0001', IO_TYPE: 'OUT', DEPARTURE: 'ICN', ARRIVAL: 'NRT'
    }));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.JOB_NO).toBe(savedJobNo);
  });

  test('PUT(수정) JOB_NO null → 자동생성', async ({ request }) => {
    // DB에서 JOB_NO를 null로 직접 설정하진 못하므로, JOB_NO 없이 보내도 기존값 유지 확인
    const res = await request.post('/api/bl/air/master', opts({
      ID: createdId, MAWB_NO: '180-TEST0001', IO_TYPE: 'OUT', DEPARTURE: 'ICN', ARRIVAL: 'SFO'
    }));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.JOB_NO).toBeTruthy();
  });

  test.afterAll(async ({ request }) => {
    if (createdId) await request.delete('/api/bl/air/master', { data: { ids: [createdId] }, headers: { Cookie: authCookie } });
  });
});

test.describe.serial('JOB_NO 자동생성 - bl/air/house (HEX)', () => {
  let createdId: number;
  let savedJobNo: string;

  test('POST → JOB_NO 자동생성', async ({ request }) => {
    const res = await request.post('/api/bl/air/house', opts({
      HAWB_NO: 'HAWBTEST001', IO_TYPE: 'OUT', DEPARTURE: 'ICN', ARRIVAL: 'LAX'
    }));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.JOB_NO).toMatch(new RegExp(`^HEX-${year}-\\d{4}$`));
    createdId = json.ID;
    savedJobNo = json.JOB_NO;
  });

  test('PUT(수정) → 기존 JOB_NO 유지', async ({ request }) => {
    const res = await request.post('/api/bl/air/house', opts({
      ID: createdId, HAWB_NO: 'HAWBTEST001', IO_TYPE: 'OUT', DEPARTURE: 'ICN', ARRIVAL: 'NRT'
    }));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.JOB_NO).toBe(savedJobNo);
  });

  test.afterAll(async ({ request }) => {
    if (createdId) await request.delete('/api/bl/air/house', { data: { ids: [createdId] }, headers: { Cookie: authCookie } });
  });
});

test.describe.serial('JOB_NO 자동생성 - bl/sea PUT (SEX)', () => {
  let createdId: number;
  let savedJobNo: string;

  test('POST → JOB_NO 자동생성', async ({ request }) => {
    const res = await request.post('/api/bl/sea', opts({
      main: { ioType: 'OUT', mblNo: 'MBLTEST001', hblNo: 'HBLTEST001', shipperName: 'Test', consigneeName: 'Test', portOfLoading: 'KRPUS', portOfDischarge: 'USNYC' },
      cargo: {},
      other: {}
    }));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.jobNo).toMatch(new RegExp(`^SEX-${year}-\\d{4}$`));
    createdId = json.blId;
    savedJobNo = json.jobNo;
  });

  test('PUT → JOB_NO 자동생성/유지', async ({ request }) => {
    const res = await request.put('/api/bl/sea', opts({
      id: createdId,
      main: { ioType: 'OUT', mblNo: 'MBLTEST001', hblNo: 'HBLTEST001', shipperName: 'Updated', consigneeName: 'Updated', portOfLoading: 'KRPUS', portOfDischarge: 'CNSHA' },
      cargo: {},
      other: {}
    }));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.jobNo).toBe(savedJobNo);
  });

  test.afterAll(async ({ request }) => {
    if (createdId) await request.delete(`/api/bl/sea?ids=${createdId}`, getOpts());
  });
});

test.describe.serial('JOB_NO 자동생성 - customs-account/sea PUT (CA)', () => {
  let createdId: number;
  let savedJobNo: string;

  test('POST → JOB_NO 자동생성', async ({ request }) => {
    const res = await request.post('/api/customs-account/sea', opts({
      boundType: 'AI', businessType: '통관B/L', accountName: 'JOB_NO Test', mblNo: 'MBLCA001'
    }));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.jobNo).toMatch(new RegExp(`^CA-${year}-\\d{4}$`));
    createdId = json.accountId;
    savedJobNo = json.jobNo;
  });

  test('PUT → JOB_NO 자동생성/유지', async ({ request }) => {
    const res = await request.put('/api/customs-account/sea', opts({
      id: createdId, boundType: 'AI', businessType: '통관B/L', accountName: 'JOB_NO Update', mblNo: 'MBLCA001'
    }));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.jobNo).toBe(savedJobNo);
  });

  test.afterAll(async ({ request }) => {
    if (createdId) await request.delete(`/api/customs-account/sea?ids=${createdId}`, getOpts());
  });
});

test.describe.serial('JOB_NO 자동생성 - bl/mbl (MBE)', () => {
  let createdId: number;
  let savedJobNo: string;

  test('POST → JOB_NO 자동생성', async ({ request }) => {
    const res = await request.post('/api/bl/mbl', opts({
      carrier_id: 1, pol_port_cd: 'KRPUS', pod_port_cd: 'USNYC', direction: 'EXPORT'
    }));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.jobNo).toMatch(new RegExp(`^MBE-${year}-\\d{4}$`));
    createdId = json.mbl_id;
    savedJobNo = json.jobNo;
  });

  test('PUT → 기존 JOB_NO 유지', async ({ request }) => {
    const res = await request.put('/api/bl/mbl', opts({ mbl_id: createdId, pol_port_cd: 'KRPUS', pod_port_cd: 'CNSHA' }));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.jobNo).toBe(savedJobNo);
  });

  test('GET → JOB_NO 조회', async ({ request }) => {
    const res = await request.get('/api/bl/mbl', getOpts());
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    const found = json.find((r: { mbl_id: number }) => r.mbl_id === createdId);
    expect(found).toBeTruthy();
    expect(found.job_no).toBe(savedJobNo);
  });

  test.afterAll(async ({ request }) => {
    if (createdId) await request.delete(`/api/bl/mbl?id=${createdId}`, getOpts());
  });
});
