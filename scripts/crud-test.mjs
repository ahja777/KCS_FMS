import http from 'http';

function request(method, path, data) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : '';
    const headers = {'Content-Type':'application/json'};
    if (body) headers['Content-Length'] = Buffer.byteLength(body);
    const req = http.request({hostname:'localhost',port:3000,path,method,headers}, res => {
      let d=''; res.on('data',c=>d+=c);
      res.on('end',()=>{
        try{resolve({status:res.statusCode,data:JSON.parse(d)})}
        catch(e){resolve({status:res.statusCode,data:d})}
      });
    });
    req.on('error',reject);
    if (body) req.write(body);
    req.end();
  });
}

let pass = 0, fail = 0;
function check(name, condition, detail) {
  if (condition) { pass++; console.log(`  [PASS] ${name}`); }
  else { fail++; console.log(`  [FAIL] ${name} => ${detail || ''}`); }
}

async function main() {
  console.log('========================================');
  console.log(' FMS-WEB CRUD TEST');
  console.log('========================================\n');

  // ============ 1. 해상 부킹 CRUD ============
  console.log('--- 1. 해상 부킹 (Sea Booking) ---');

  // CREATE
  const createBk = await request('POST', '/api/booking/sea', {
    bookingType:'EXPORT', serviceType:'CY-CY', incoterms:'FOB',
    shipperName:'CRUD 테스트 업체', consigneeName:'Test Consignee Inc.',
    carrierId:'MAEU', vesselName:'TEST VESSEL', voyageNo:'T001',
    pol:'KRPUS', pod:'USLAX', etd:'2026-03-01', eta:'2026-03-25',
    commodityDesc:'TEST CARGO', grossWeight:10000, volume:50.0,
    status:'DRAFT', remark:'CRUD test booking'
  });
  check('CREATE', createBk.data.success, JSON.stringify(createBk.data));
  const bkNo = createBk.data.bookingNo;
  const bkId = createBk.data.bookingId;

  // READ (list)
  const readBkList = await request('GET', '/api/booking/sea');
  check('READ (list)', Array.isArray(readBkList.data) && readBkList.data.length > 0,
    `Got ${readBkList.data?.length || 0} items`);

  // READ (single)
  const readBk = await request('GET', `/api/booking/sea?bookingId=${bkId}`);
  check('READ (single)', readBk.data?.bookingNo === bkNo, JSON.stringify(readBk.data?.bookingNo));

  // UPDATE
  const updateBk = await request('PUT', '/api/booking/sea', {
    id: bkId, vesselName:'UPDATED VESSEL', voyageNo:'T002',
    status:'CONFIRM', remark:'Updated by CRUD test'
  });
  check('UPDATE', updateBk.data.success, JSON.stringify(updateBk.data));

  // Verify UPDATE
  const readBk2 = await request('GET', `/api/booking/sea?bookingId=${bkId}`);
  check('UPDATE verify', readBk2.data?.vesselName === 'UPDATED VESSEL', readBk2.data?.vesselName);

  // DELETE
  const delBk = await request('DELETE', `/api/booking/sea?ids=${bkId}`);
  check('DELETE', delBk.data.success, JSON.stringify(delBk.data));

  // ============ 2. 항공 부킹 CRUD ============
  console.log('\n--- 2. 항공 부킹 (Air Booking) ---');
  const createAb = await request('POST', '/api/booking/air', {
    carrierId:'KE', flightNo:'KE999', origin:'KRINC', destination:'JPTYO',
    etd:'2026-03-01T10:00:00', eta:'2026-03-01T12:30:00',
    commodityDesc:'CRUD AIR TEST', pkgQty:10, pkgType:'BOX',
    grossWeight:500, chargeableWeight:800, volume:3.5,
    status:'DRAFT', remark:'CRUD test air booking'
  });
  check('CREATE', createAb.data.success, JSON.stringify(createAb.data));

  const readAbList = await request('GET', '/api/booking/air');
  check('READ (list)', Array.isArray(readAbList.data) && readAbList.data.length > 0);

  const updateAb = await request('PUT', '/api/booking/air', {
    id: createAb.data.bookingId, flightNo:'KE888', status:'CONFIRM'
  });
  check('UPDATE', updateAb.data.success);

  const delAb = await request('DELETE', `/api/booking/air?ids=${createAb.data.bookingId}`);
  check('DELETE', delAb.data.success);

  // ============ 3. 해상 견적 CRUD ============
  console.log('\n--- 3. 해상 견적 (Sea Quote) ---');
  const createSq = await request('POST', '/api/quote/sea', {
    quoteDate:'2026-01-29', customerId:1, consignee:'CRUD Test',
    pol:'KRPUS', pod:'CNSHA', carrierCd:'COSU', containerType:'20DC', containerQty:2,
    incoterms:'CIF', validFrom:'2026-02-01', validTo:'2026-02-28',
    totalAmount:3500, currency:'USD', status:'draft', remark:'CRUD test'
  });
  check('CREATE', createSq.data.success, JSON.stringify(createSq.data));

  const readSqList = await request('GET', '/api/quote/sea');
  check('READ (list)', Array.isArray(readSqList.data) && readSqList.data.length > 0);

  const updateSq = await request('PUT', '/api/quote/sea', {
    id: createSq.data.quoteId, quoteDate:'2026-01-29', customerId:1, consignee:'UPDATED',
    pol:'KRPUS', pod:'CNSHA', totalAmount:4000, status:'active'
  });
  check('UPDATE', updateSq.data.success);

  const delSq = await request('DELETE', `/api/quote/sea?ids=${createSq.data.quoteId}`);
  check('DELETE', delSq.data.success);

  // ============ 4. 항공 견적 CRUD ============
  console.log('\n--- 4. 항공 견적 (Air Quote) ---');
  const createAq = await request('POST', '/api/quote/air', {
    quoteDate:'2026-01-29', customerId:2, consignee:'CRUD Air Test',
    origin:'KRINC', destination:'DEFRA', airlineCd:'KE', flightNo:'KE905',
    weight:1000, volume:5.0, commodity:'CRUD TEST CARGO',
    validFrom:'2026-02-01', validTo:'2026-03-31',
    totalAmount:8000, currency:'USD', status:'draft', remark:'CRUD test'
  });
  check('CREATE', createAq.data.success, JSON.stringify(createAq.data));

  const readAqList = await request('GET', '/api/quote/air');
  check('READ (list)', Array.isArray(readAqList.data) && readAqList.data.length > 0);

  const updateAq = await request('PUT', '/api/quote/air', {
    id: createAq.data.quoteId, quoteDate:'2026-01-29', customerId:2,
    consignee:'UPDATED AIR', totalAmount:9000, status:'active'
  });
  check('UPDATE', updateAq.data.success);

  const delAq = await request('DELETE', `/api/quote/air?ids=${createAq.data.quoteId}`);
  check('DELETE', delAq.data.success);

  // ============ 5. 해상 스케줄 CRUD ============
  console.log('\n--- 5. 해상 스케줄 (Sea Schedule) ---');
  const createSs = await request('POST', '/api/schedule/sea', {
    carrierId:1, vesselName:'CRUD TEST VESSEL', voyageNo:'CRUD001',
    pol:'KRPUS', pod:'CNSHA', etd:'2026-03-01 10:00:00', eta:'2026-03-10 08:00:00',
    transitDays:9, status:'OPEN', remark:'CRUD test'
  });
  check('CREATE', createSs.data.success, JSON.stringify(createSs.data));

  const readSsList = await request('GET', '/api/schedule/sea');
  check('READ (list)', Array.isArray(readSsList.data) && readSsList.data.length > 0);

  const updateSs = await request('PUT', '/api/schedule/sea', {
    id: createSs.data.scheduleId, carrierId:1, vesselName:'UPDATED VESSEL',
    voyageNo:'CRUD002', pol:'KRPUS', pod:'CNSHA', status:'CLOSED'
  });
  check('UPDATE', updateSs.data.success);

  const delSs = await request('DELETE', `/api/schedule/sea?ids=${createSs.data.scheduleId}`);
  check('DELETE', delSs.data.success);

  // ============ 6. S/R CRUD ============
  console.log('\n--- 6. 선적요청 (S/R) ---');
  const createSr = await request('POST', '/api/sr/sea', {
    transportMode:'SEA', tradeType:'EXPORT',
    shipperName:'CRUD Shipper', consigneeName:'CRUD Consignee',
    pol:'KRPUS', pod:'JPTYO', commodityDesc:'CRUD TEST', packageQty:100,
    grossWeight:5000, volume:20.0, status:'PENDING', remark:'CRUD test'
  });
  check('CREATE', createSr.data.success, JSON.stringify(createSr.data));

  const readSrList = await request('GET', '/api/sr/sea');
  check('READ (list)', Array.isArray(readSrList.data) && readSrList.data.length > 0);

  const updateSr = await request('PUT', '/api/sr/sea', {
    id: createSr.data.srId, shipperName:'UPDATED Shipper', status:'CONFIRMED'
  });
  check('UPDATE', updateSr.data.success);

  const delSr = await request('DELETE', `/api/sr/sea?ids=${createSr.data.srId}`);
  check('DELETE', delSr.data.success);

  // ============ 7. S/N CRUD ============
  console.log('\n--- 7. 선적통지 (S/N) ---');
  const createSn = await request('POST', '/api/sn/sea', {
    transportMode:'SEA', carrierName:'CRUD Carrier', vesselFlight:'CRUD SHIP', voyageNo:'C01',
    pol:'KRPUS', pod:'SGSIN', etd:'2026-03-01', eta:'2026-03-10',
    senderName:'CRUD Sender', recipientName:'CRUD Recipient',
    commodityDesc:'CRUD TEST', packageQty:50, grossWeight:3000, volume:15.0,
    status:'DRAFT', remark:'CRUD test'
  });
  check('CREATE', createSn.data.success, JSON.stringify(createSn.data));

  const readSnList = await request('GET', '/api/sn/sea');
  check('READ (list)', Array.isArray(readSnList.data) && readSnList.data.length > 0);

  const updateSn = await request('PUT', '/api/sn/sea', {
    id: createSn.data.snId, carrierName:'UPDATED Carrier', status:'SENT'
  });
  check('UPDATE', updateSn.data.success);

  const delSn = await request('DELETE', `/api/sn/sea?ids=${createSn.data.snId}`);
  check('DELETE', delSn.data.success);

  // ============ 8. 해상 B/L CRUD ============
  console.log('\n--- 8. 해상 B/L ---');
  const createBl = await request('POST', '/api/bl/sea', {
    mblNo:'CRUDMBL001', hblNo:'CRUDHBL001', ioType:'OUT', businessType:'SIMPLE', blType:'ORIGINAL',
    shipperName:'CRUD Shipper', consigneeName:'CRUD Consignee',
    portOfLoading:'KRPUS', portOfDischarge:'CNSHA',
    vesselName:'CRUD VESSEL', voyageNo:'C001',
    etd:'2026-03-01', eta:'2026-03-10', freightTerm:'PREPAID', serviceTerm:'CY-CY',
    packageQty:100, packageUnit:'CTN', grossWeight:5000, measurement:20.0
  });
  check('CREATE', createBl.data.success, JSON.stringify(createBl.data));

  const readBlList = await request('GET', '/api/bl/sea');
  check('READ (list)', Array.isArray(readBlList.data) && readBlList.data.length > 0);

  const updateBl = await request('PUT', '/api/bl/sea', {
    id: createBl.data.blId,
    main: { mblNo:'CRUDMBL001', hblNo:'CRUDHBL001', ioType:'OUT', businessType:'SIMPLE', blType:'ORIGINAL',
      shipperName:'CRUD Shipper', consigneeName:'CRUD Consignee', portOfLoading:'KRPUS', portOfDischarge:'CNSHA',
      vesselName:'UPDATED BL VESSEL', voyageNo:'C001', freightTerm:'PREPAID', serviceTerm:'CY-CY',
      containerType:'FCL', packageUnit:'CTN', blIssueType:'ORIGINAL' },
    cargo: { packageQty:100, grossWeight:5000, measurement:20.0 }, other: {}
  });
  check('UPDATE', updateBl.data.success);

  const delBl = await request('DELETE', `/api/bl/sea?ids=${createBl.data.blId}`);
  check('DELETE', delBl.data.success);

  // ============ SUMMARY ============
  console.log('\n========================================');
  console.log(` CRUD TEST RESULTS: ${pass} PASS / ${fail} FAIL / ${pass+fail} TOTAL`);
  console.log('========================================');
}

main().catch(e => console.error('ERROR:', e));
