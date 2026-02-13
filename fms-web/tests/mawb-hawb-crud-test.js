const BASE = 'http://localhost:3000';

const mawbs = [
  // === 항공수출 5건 ===
  { IO_TYPE:'OUT', MAWB_NO:'180-12345675', AIRLINE_CODE:'KE', AIRLINE_NAME:'대한항공',
    DEPARTURE:'ICN', ARRIVAL:'LAX', OB_DATE:'2026-02-10', FLIGHT_NO:'KE017', FLIGHT_DATE:'2026-02-10',
    SHIPPER_CODE:'C001', SHIPPER_NAME:'삼성전자', SHIPPER_ADDRESS:'경기도 수원시 영통구 삼성로 129',
    CONSIGNEE_CODE:'C010', CONSIGNEE_NAME:'Samsung America Inc.', CONSIGNEE_ADDRESS:'1200 Gateway Blvd, San Jose, CA 95110',
    CURRENCY:'KRW', TOTAL_PIECES:50, TOTAL_WEIGHT:520, CHARGEABLE_WEIGHT:520, HAWB_COUNT:3,
    AGENT_CODE:'FW005', AGENT_NAME:'Kuehne+Nagel', PARTNER_CODE:'PTN-001', PARTNER_NAME:'K+N America',
    NATURE_OF_GOODS:'ELECTRONIC PARTS (SEMICONDUCTORS)', STATUS:'CONFIRMED' },
  { IO_TYPE:'OUT', MAWB_NO:'988-98765432', AIRLINE_CODE:'OZ', AIRLINE_NAME:'아시아나항공',
    DEPARTURE:'ICN', ARRIVAL:'NRT', OB_DATE:'2026-02-11', FLIGHT_NO:'OZ108', FLIGHT_DATE:'2026-02-11',
    SHIPPER_CODE:'C003', SHIPPER_NAME:'현대자동차', SHIPPER_ADDRESS:'서울시 서초구 헌릉로 12',
    CONSIGNEE_CODE:'C011', CONSIGNEE_NAME:'Hyundai Motor Japan', CONSIGNEE_ADDRESS:'Minato-ku, Tokyo 105-0001',
    CURRENCY:'KRW', TOTAL_PIECES:30, TOTAL_WEIGHT:380, CHARGEABLE_WEIGHT:380, HAWB_COUNT:2,
    AGENT_CODE:'FW003', AGENT_NAME:'범한물류', PARTNER_CODE:'PTN-002', PARTNER_NAME:'Gold Shipping Japan',
    NATURE_OF_GOODS:'AUTOMOBILE PARTS', STATUS:'DRAFT' },
  { IO_TYPE:'OUT', MAWB_NO:'618-55667788', AIRLINE_CODE:'SQ', AIRLINE_NAME:'싱가포르항공',
    DEPARTURE:'ICN', ARRIVAL:'SIN', OB_DATE:'2026-02-12', FLIGHT_NO:'SQ603', FLIGHT_DATE:'2026-02-12',
    SHIPPER_CODE:'C002', SHIPPER_NAME:'LG전자', SHIPPER_ADDRESS:'서울시 영등포구 여의대로 128',
    CONSIGNEE_CODE:'C012', CONSIGNEE_NAME:'LG Electronics Singapore', CONSIGNEE_ADDRESS:'1 Maritime Square, Singapore 099253',
    CURRENCY:'USD', TOTAL_PIECES:100, TOTAL_WEIGHT:1200, CHARGEABLE_WEIGHT:1200, HAWB_COUNT:2,
    AGENT_CODE:'FW004', AGENT_NAME:'DHL', PARTNER_CODE:'PTN-003', PARTNER_NAME:'DHL Singapore',
    NATURE_OF_GOODS:'HOME APPLIANCES (WASHING MACHINES)', STATUS:'SHIPPED' },
  { IO_TYPE:'OUT', MAWB_NO:'020-11223344', AIRLINE_CODE:'LH', AIRLINE_NAME:'루프트한자',
    DEPARTURE:'ICN', ARRIVAL:'FRA', OB_DATE:'2026-02-08', FLIGHT_NO:'LH713', FLIGHT_DATE:'2026-02-08',
    SHIPPER_CODE:'C004', SHIPPER_NAME:'SK하이닉스', SHIPPER_ADDRESS:'경기도 이천시 부발읍 아미리 산136',
    CONSIGNEE_CODE:'C013', CONSIGNEE_NAME:'SK Hynix Germany GmbH', CONSIGNEE_ADDRESS:'Frankfurt am Main, Germany',
    CURRENCY:'EUR', TOTAL_PIECES:20, TOTAL_WEIGHT:85, CHARGEABLE_WEIGHT:85, HAWB_COUNT:1,
    AGENT_CODE:'FW005', AGENT_NAME:'Kuehne+Nagel', PARTNER_CODE:'PTN-004', PARTNER_NAME:'K+N Germany',
    NATURE_OF_GOODS:'MEMORY CHIPS (DRAM)', STATUS:'CONFIRMED' },
  { IO_TYPE:'OUT', MAWB_NO:'160-44556677', AIRLINE_CODE:'CX', AIRLINE_NAME:'캐세이퍼시픽',
    DEPARTURE:'ICN', ARRIVAL:'HKG', OB_DATE:'2026-02-09', FLIGHT_NO:'CX415', FLIGHT_DATE:'2026-02-09',
    SHIPPER_CODE:'C005', SHIPPER_NAME:'포스코', SHIPPER_ADDRESS:'서울시 강남구 테헤란로 440',
    CONSIGNEE_CODE:'C014', CONSIGNEE_NAME:'POSCO Hong Kong Ltd.', CONSIGNEE_ADDRESS:'Central, Hong Kong',
    CURRENCY:'USD', TOTAL_PIECES:15, TOTAL_WEIGHT:250, CHARGEABLE_WEIGHT:250, HAWB_COUNT:2,
    AGENT_CODE:'FW002', AGENT_NAME:'현대글로비스', PARTNER_CODE:'PTN-005', PARTNER_NAME:'Gold Shipping HK',
    NATURE_OF_GOODS:'STEEL COILS', STATUS:'DRAFT' },
  // === 항공수입 5건 ===
  { IO_TYPE:'IN', MAWB_NO:'180-87654321', AIRLINE_CODE:'KE', AIRLINE_NAME:'대한항공',
    DEPARTURE:'LAX', ARRIVAL:'ICN', OB_DATE:'2026-02-07', FLIGHT_NO:'KE018', FLIGHT_DATE:'2026-02-07',
    SHIPPER_CODE:'C020', SHIPPER_NAME:'Apple Inc.', SHIPPER_ADDRESS:'One Apple Park Way, Cupertino, CA 95014',
    CONSIGNEE_CODE:'C002', CONSIGNEE_NAME:'LG전자', CONSIGNEE_ADDRESS:'서울시 영등포구 여의대로 128',
    CURRENCY:'USD', TOTAL_PIECES:200, TOTAL_WEIGHT:1500, CHARGEABLE_WEIGHT:1500, HAWB_COUNT:3,
    AGENT_CODE:'FW005', AGENT_NAME:'Kuehne+Nagel', PARTNER_CODE:'PTN-006', PARTNER_NAME:'K+N Los Angeles',
    NATURE_OF_GOODS:'DISPLAY PANELS (LCD)', STATUS:'ARRIVED' },
  { IO_TYPE:'IN', MAWB_NO:'988-11112222', AIRLINE_CODE:'OZ', AIRLINE_NAME:'아시아나항공',
    DEPARTURE:'PVG', ARRIVAL:'ICN', OB_DATE:'2026-02-06', FLIGHT_NO:'OZ362', FLIGHT_DATE:'2026-02-06',
    SHIPPER_CODE:'C021', SHIPPER_NAME:'Huawei Technologies', SHIPPER_ADDRESS:'Shenzhen, Guangdong, China',
    CONSIGNEE_CODE:'C001', CONSIGNEE_NAME:'삼성전자', CONSIGNEE_ADDRESS:'경기도 수원시 영통구 삼성로 129',
    CURRENCY:'USD', TOTAL_PIECES:80, TOTAL_WEIGHT:450, CHARGEABLE_WEIGHT:450, HAWB_COUNT:2,
    AGENT_CODE:'FW004', AGENT_NAME:'DHL', PARTNER_CODE:'PTN-007', PARTNER_NAME:'DHL Shanghai',
    NATURE_OF_GOODS:'TELECOM EQUIPMENT', STATUS:'CONFIRMED' },
  { IO_TYPE:'IN', MAWB_NO:'618-33344455', AIRLINE_CODE:'SQ', AIRLINE_NAME:'싱가포르항공',
    DEPARTURE:'SIN', ARRIVAL:'ICN', OB_DATE:'2026-02-05', FLIGHT_NO:'SQ602', FLIGHT_DATE:'2026-02-05',
    SHIPPER_CODE:'C022', SHIPPER_NAME:'Flex Ltd.', SHIPPER_ADDRESS:'2 Changi South Lane, Singapore 486123',
    CONSIGNEE_CODE:'C003', CONSIGNEE_NAME:'현대자동차', CONSIGNEE_ADDRESS:'서울시 서초구 헌릉로 12',
    CURRENCY:'USD', TOTAL_PIECES:45, TOTAL_WEIGHT:320, CHARGEABLE_WEIGHT:320, HAWB_COUNT:2,
    AGENT_CODE:'FW003', AGENT_NAME:'범한물류', PARTNER_CODE:'PTN-003', PARTNER_NAME:'DHL Singapore',
    NATURE_OF_GOODS:'AUTOMOTIVE ELECTRONICS', STATUS:'DRAFT' },
  { IO_TYPE:'IN', MAWB_NO:'020-66677788', AIRLINE_CODE:'LH', AIRLINE_NAME:'루프트한자',
    DEPARTURE:'FRA', ARRIVAL:'ICN', OB_DATE:'2026-02-04', FLIGHT_NO:'LH714', FLIGHT_DATE:'2026-02-04',
    SHIPPER_CODE:'C023', SHIPPER_NAME:'Bosch GmbH', SHIPPER_ADDRESS:'Stuttgart, Germany',
    CONSIGNEE_CODE:'C003', CONSIGNEE_NAME:'현대자동차', CONSIGNEE_ADDRESS:'서울시 서초구 헌릉로 12',
    CURRENCY:'EUR', TOTAL_PIECES:60, TOTAL_WEIGHT:780, CHARGEABLE_WEIGHT:780, HAWB_COUNT:2,
    AGENT_CODE:'FW005', AGENT_NAME:'Kuehne+Nagel', PARTNER_CODE:'PTN-004', PARTNER_NAME:'K+N Germany',
    NATURE_OF_GOODS:'INJECTION SYSTEM PARTS', STATUS:'SHIPPED' },
  { IO_TYPE:'IN', MAWB_NO:'160-99900011', AIRLINE_CODE:'CX', AIRLINE_NAME:'캐세이퍼시픽',
    DEPARTURE:'HKG', ARRIVAL:'ICN', OB_DATE:'2026-02-03', FLIGHT_NO:'CX414', FLIGHT_DATE:'2026-02-03',
    SHIPPER_CODE:'C024', SHIPPER_NAME:'Foxconn Technology', SHIPPER_ADDRESS:'Tseung Kwan O, Hong Kong',
    CONSIGNEE_CODE:'C001', CONSIGNEE_NAME:'삼성전자', CONSIGNEE_ADDRESS:'경기도 수원시 영통구 삼성로 129',
    CURRENCY:'USD', TOTAL_PIECES:150, TOTAL_WEIGHT:950, CHARGEABLE_WEIGHT:950, HAWB_COUNT:3,
    AGENT_CODE:'FW002', AGENT_NAME:'현대글로비스', PARTNER_CODE:'PTN-005', PARTNER_NAME:'Gold Shipping HK',
    NATURE_OF_GOODS:'PCB ASSEMBLY', STATUS:'CONFIRMED' },
];

const hawbDefs = [
  // 수출 MAWB#1 → HAWB 3건
  { mi:0, HAWB_NO:'KNK-2026-0001', SHIPPER_NAME:'삼성전자 반도체', CONSIGNEE_NAME:'Samsung Austin Semiconductor', PIECES:20, GROSS_WEIGHT:200 },
  { mi:0, HAWB_NO:'KNK-2026-0002', SHIPPER_NAME:'삼성SDI', CONSIGNEE_NAME:'Samsung SDI America', PIECES:15, GROSS_WEIGHT:180 },
  { mi:0, HAWB_NO:'KNK-2026-0003', SHIPPER_NAME:'삼성전기', CONSIGNEE_NAME:'Samsung Electro-Mechanics', PIECES:15, GROSS_WEIGHT:140 },
  // 수출 MAWB#2 → HAWB 2건
  { mi:1, HAWB_NO:'BHK-2026-0001', SHIPPER_NAME:'현대모비스', CONSIGNEE_NAME:'Hyundai Mobis Japan', PIECES:18, GROSS_WEIGHT:200 },
  { mi:1, HAWB_NO:'BHK-2026-0002', SHIPPER_NAME:'현대위아', CONSIGNEE_NAME:'Hyundai WIA Japan', PIECES:12, GROSS_WEIGHT:180 },
  // 수출 MAWB#3 → HAWB 2건
  { mi:2, HAWB_NO:'DHL-2026-0001', SHIPPER_NAME:'LG전자 가전', CONSIGNEE_NAME:'LG Electronics SG Pte', PIECES:60, GROSS_WEIGHT:750 },
  { mi:2, HAWB_NO:'DHL-2026-0002', SHIPPER_NAME:'LG디스플레이', CONSIGNEE_NAME:'LG Display Singapore', PIECES:40, GROSS_WEIGHT:450 },
  // 수출 MAWB#4 → HAWB 1건
  { mi:3, HAWB_NO:'KNK-2026-0004', SHIPPER_NAME:'SK하이닉스', CONSIGNEE_NAME:'SK Hynix Germany GmbH', PIECES:20, GROSS_WEIGHT:85 },
  // 수출 MAWB#5 → HAWB 2건
  { mi:4, HAWB_NO:'GLO-2026-0001', SHIPPER_NAME:'포스코 광양', CONSIGNEE_NAME:'POSCO HK Trading', PIECES:8, GROSS_WEIGHT:150 },
  { mi:4, HAWB_NO:'GLO-2026-0002', SHIPPER_NAME:'포스코케미칼', CONSIGNEE_NAME:'POSCO Chemical HK', PIECES:7, GROSS_WEIGHT:100 },
  // 수입 MAWB#6 → HAWB 3건
  { mi:5, HAWB_NO:'KNK-2026-I001', SHIPPER_NAME:'Apple Display Div.', CONSIGNEE_NAME:'LG전자 디스플레이사업부', PIECES:80, GROSS_WEIGHT:600 },
  { mi:5, HAWB_NO:'KNK-2026-I002', SHIPPER_NAME:'Apple Component', CONSIGNEE_NAME:'LG전자 부품센터', PIECES:70, GROSS_WEIGHT:500 },
  { mi:5, HAWB_NO:'KNK-2026-I003', SHIPPER_NAME:'Apple Logistics', CONSIGNEE_NAME:'LG전자 물류센터', PIECES:50, GROSS_WEIGHT:400 },
  // 수입 MAWB#7 → HAWB 2건
  { mi:6, HAWB_NO:'DHL-2026-I001', SHIPPER_NAME:'Huawei Telecom', CONSIGNEE_NAME:'삼성전자 네트워크사업부', PIECES:50, GROSS_WEIGHT:280 },
  { mi:6, HAWB_NO:'DHL-2026-I002', SHIPPER_NAME:'Huawei Device', CONSIGNEE_NAME:'삼성전자 무선사업부', PIECES:30, GROSS_WEIGHT:170 },
  // 수입 MAWB#8 → HAWB 2건
  { mi:7, HAWB_NO:'BHK-2026-I001', SHIPPER_NAME:'Flex Electronics SG', CONSIGNEE_NAME:'현대모비스 수입팀', PIECES:25, GROSS_WEIGHT:180 },
  { mi:7, HAWB_NO:'BHK-2026-I002', SHIPPER_NAME:'Flex Power SG', CONSIGNEE_NAME:'현대자동차 부품센터', PIECES:20, GROSS_WEIGHT:140 },
  // 수입 MAWB#9 → HAWB 2건
  { mi:8, HAWB_NO:'KNK-2026-I004', SHIPPER_NAME:'Robert Bosch GmbH', CONSIGNEE_NAME:'현대자동차 울산공장', PIECES:35, GROSS_WEIGHT:450 },
  { mi:8, HAWB_NO:'KNK-2026-I005', SHIPPER_NAME:'Bosch Rexroth AG', CONSIGNEE_NAME:'현대위아 창원공장', PIECES:25, GROSS_WEIGHT:330 },
  // 수입 MAWB#10 → HAWB 3건
  { mi:9, HAWB_NO:'GLO-2026-I001', SHIPPER_NAME:'Foxconn PCB Div.', CONSIGNEE_NAME:'삼성전자 기흥캠퍼스', PIECES:60, GROSS_WEIGHT:400 },
  { mi:9, HAWB_NO:'GLO-2026-I002', SHIPPER_NAME:'Foxconn Assembly', CONSIGNEE_NAME:'삼성전자 평택캠퍼스', PIECES:50, GROSS_WEIGHT:350 },
  { mi:9, HAWB_NO:'GLO-2026-I003', SHIPPER_NAME:'Foxconn Module', CONSIGNEE_NAME:'삼성전자 화성캠퍼스', PIECES:40, GROSS_WEIGHT:200 },
];

async function run() {
  console.log('=== STEP 1: MAWB 10건 등록 (수출5 + 수입5) ===');
  const mawbResults = [];
  for (let i = 0; i < mawbs.length; i++) {
    const res = await fetch(BASE+'/api/bl/air/master', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(mawbs[i]) });
    const data = await res.json();
    mawbResults.push({ ...data, idx: i });
    const tag = mawbs[i].IO_TYPE === 'OUT' ? '수출' : '수입';
    console.log(`  [${tag} MAWB ${i+1}] ${data.JOB_NO} / ${mawbs[i].MAWB_NO} (${mawbs[i].AIRLINE_CODE} ${mawbs[i].DEPARTURE}→${mawbs[i].ARRIVAL}) ID:${data.ID}`);
  }
  console.log('\n');

  console.log(`=== STEP 2: HAWB ${hawbDefs.length}건 등록 (MAWB 연결) ===`);
  const hawbResults = [];
  for (let i = 0; i < hawbDefs.length; i++) {
    const h = hawbDefs[i];
    const m = mawbResults[h.mi];
    const md = mawbs[h.mi];
    const payload = {
      MAWB_ID: m.ID, IO_TYPE: md.IO_TYPE, MAWB_NO: md.MAWB_NO, HAWB_NO: h.HAWB_NO,
      DEPARTURE: md.DEPARTURE, ARRIVAL: md.ARRIVAL, OB_DATE: md.OB_DATE,
      FLIGHT_NO: md.FLIGHT_NO, FLIGHT_DATE: md.FLIGHT_DATE,
      SHIPPER_NAME: h.SHIPPER_NAME, CONSIGNEE_NAME: h.CONSIGNEE_NAME,
      CURRENCY: md.CURRENCY, PIECES: h.PIECES, GROSS_WEIGHT: h.GROSS_WEIGHT, CHARGEABLE_WEIGHT: h.GROSS_WEIGHT,
      AGENT_CODE: md.AGENT_CODE, AGENT_NAME: md.AGENT_NAME,
      NATURE_OF_GOODS: md.NATURE_OF_GOODS, STATUS: 'DRAFT',
    };
    const res = await fetch(BASE+'/api/bl/air/house', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
    const data = await res.json();
    hawbResults.push({ ...data, hawbNo: h.HAWB_NO, mawbNo: md.MAWB_NO, mi: h.mi });
    console.log(`  [HAWB ${i+1}] ${data.JOB_NO} / ${h.HAWB_NO} → MAWB:${md.MAWB_NO} (MAWB_ID:${m.ID})`);
  }
  console.log('\n');

  // STEP 3: READ
  console.log('=== STEP 3: 조회(READ) 테스트 ===');
  let res, data;

  res = await fetch(BASE+'/api/bl/air/master?ioType=OUT');
  data = await res.json();
  console.log(`  [수출 MAWB 목록] ${data.length}건`);

  res = await fetch(BASE+'/api/bl/air/master?ioType=IN');
  data = await res.json();
  console.log(`  [수입 MAWB 목록] ${data.length}건`);

  res = await fetch(BASE+'/api/bl/air/house?ioType=OUT');
  data = await res.json();
  console.log(`  [수출 HAWB 목록] ${data.length}건`);

  res = await fetch(BASE+'/api/bl/air/house?ioType=IN');
  data = await res.json();
  console.log(`  [수입 HAWB 목록] ${data.length}건`);

  // MAWB→HAWB 연결 조회
  console.log('\n  --- MAWB→HAWB 연결 조회 ---');
  for (let i = 0; i < mawbs.length; i++) {
    res = await fetch(BASE+'/api/bl/air/house?mawbNo='+encodeURIComponent(mawbs[i].MAWB_NO));
    data = await res.json();
    const tag = mawbs[i].IO_TYPE === 'OUT' ? '수출' : '수입';
    console.log(`  [${tag}] MAWB ${mawbs[i].MAWB_NO} → HAWB ${data.length}건: ${data.map(d=>d.HAWB_NO).join(', ')}`);
  }
  console.log('\n');

  // STEP 4: UPDATE
  console.log('=== STEP 4: 수정(UPDATE) 테스트 ===');
  const upMawb = mawbResults[0];
  res = await fetch(BASE+'/api/bl/air/master', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ ID: upMawb.ID, ...mawbs[0], STATUS:'SHIPPED', TOTAL_WEIGHT:550, CHARGEABLE_WEIGHT:550 })
  });
  data = await res.json();
  console.log(`  [MAWB UPDATE] ID:${upMawb.ID} STATUS→SHIPPED, WEIGHT→550: ${data.success?'OK':'FAIL'}`);

  res = await fetch(BASE+'/api/bl/air/master?id='+upMawb.ID);
  data = await res.json();
  console.log(`  [MAWB UPDATE 확인] STATUS=${data.STATUS}, TOTAL_WEIGHT=${data.TOTAL_WEIGHT}`);

  const upHawb = hawbResults[0];
  res = await fetch(BASE+'/api/bl/air/house', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ ID: upHawb.ID, MAWB_ID: upMawb.ID, IO_TYPE:'OUT', MAWB_NO:mawbs[0].MAWB_NO, HAWB_NO:upHawb.hawbNo,
      DEPARTURE:'ICN', ARRIVAL:'LAX', PIECES:25, GROSS_WEIGHT:220, STATUS:'CONFIRMED' })
  });
  data = await res.json();
  console.log(`  [HAWB UPDATE] ID:${upHawb.ID} PIECES→25, STATUS→CONFIRMED: ${data.success?'OK':'FAIL'}`);

  res = await fetch(BASE+'/api/bl/air/house?id='+upHawb.ID);
  data = await res.json();
  console.log(`  [HAWB UPDATE 확인] STATUS=${data.STATUS}, PIECES=${data.PIECES}\n`);

  // STEP 5: DELETE
  console.log('=== STEP 5: 삭제(DELETE) 테스트 ===');
  const delHawb = hawbResults[hawbResults.length - 1];
  res = await fetch(BASE+'/api/bl/air/house', {
    method:'DELETE', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ ids: [delHawb.ID] })
  });
  data = await res.json();
  console.log(`  [HAWB DELETE] ID:${delHawb.ID} (${delHawb.hawbNo}): ${data.success?'OK':'FAIL'}`);

  res = await fetch(BASE+'/api/bl/air/house?mawbNo='+encodeURIComponent(mawbs[9].MAWB_NO));
  data = await res.json();
  console.log(`  [삭제 후] MAWB ${mawbs[9].MAWB_NO} → HAWB ${data.length}건 (3→2)\n`);

  // STEP 6: 최종 요약
  console.log('=== STEP 6: 최종 데이터 요약 ===');
  res = await fetch(BASE+'/api/bl/air/master?ioType=OUT');
  const expM = await res.json();
  res = await fetch(BASE+'/api/bl/air/master?ioType=IN');
  const impM = await res.json();
  res = await fetch(BASE+'/api/bl/air/house?ioType=OUT');
  const expH = await res.json();
  res = await fetch(BASE+'/api/bl/air/house?ioType=IN');
  const impH = await res.json();
  console.log(`  수출: MAWB ${expM.length}건, HAWB ${expH.length}건`);
  console.log(`  수입: MAWB ${impM.length}건, HAWB ${impH.length}건`);
  console.log(`  합계: MAWB ${expM.length+impM.length}건, HAWB ${expH.length+impH.length}건`);
  console.log('\n✅ 전체 MAWB-HAWB CRUD 테스트 완료');
}

run().catch(e => console.error('ERROR:', e));
