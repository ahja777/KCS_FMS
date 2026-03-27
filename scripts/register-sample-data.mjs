import http from 'http';

function post(path, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const req = http.request({hostname:'localhost',port:3000,path,method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}}, res => {
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>{try{resolve(JSON.parse(d))}catch(e){resolve({raw:d})}});
    });
    req.on('error',reject);
    req.write(body);req.end();
  });
}

async function main() {
  const results = [];

  // 1. 해상 부킹 - 삼성전자 → 미국 LA (전자제품 FCL 40HC)
  results.push({name:'1. Sea Booking (삼성전자→LA)', data: await post('/api/booking/sea', {
    bookingType:'EXPORT', serviceType:'CY-CY', incoterms:'FOB', freightTerms:'PREPAID', paymentTerms:'PREPAID',
    shipperCode:'C002', shipperName:'삼성전자', shipperAddress:'경기도 수원시 영통구 삼성로 129', shipperContact:'김수출', shipperTel:'031-200-1234', shipperEmail:'export@samsung.com',
    consigneeCode:'', consigneeName:'Best Buy Co., Inc.', consigneeAddress:'7601 Penn Ave S, Richfield, MN 55423, USA', consigneeContact:'John Smith', consigneeTel:'+1-612-291-1000', consigneeEmail:'import@bestbuy.com',
    notifyPartyCode:'', notifyPartyName:'Best Buy Co., Inc.', notifyPartyAddress:'7601 Penn Ave S, Richfield, MN 55423, USA',
    carrierId:'MAEU', vesselName:'MAERSK EINDHOVEN', voyageNo:'252E',
    pol:'KRPUS', polTerminal:'PNIT', pod:'USLAX', podTerminal:'APM Terminals', finalDest:'Los Angeles',
    etd:'2026-02-10', eta:'2026-03-05', closingDate:'2026-02-08', closingTime:'17:00',
    cntr40hcQty:2, totalCntrQty:2,
    commodityDesc:'ELECTRONIC APPLIANCES (TV, REFRIGERATOR)', grossWeight:28500, volume:120.5,
    blType:'ORIGINAL', status:'CONFIRM', remark:'Samsung to Best Buy FCL shipment'
  })});

  // 2. 해상 부킹 - LG화학 → 독일 (화학제품 DG Class 9)
  results.push({name:'2. Sea Booking DG (LG화학→Hamburg)', data: await post('/api/booking/sea', {
    bookingType:'EXPORT', serviceType:'CY-CY', incoterms:'CIF', freightTerms:'PREPAID', paymentTerms:'PREPAID',
    shipperCode:'', shipperName:'LG화학', shipperAddress:'서울특별시 영등포구 여의대로 128', shipperContact:'박화학', shipperTel:'02-3773-1114', shipperEmail:'export@lgchem.com',
    consigneeCode:'', consigneeName:'BASF SE', consigneeAddress:'Carl-Bosch-Str. 38, 67056 Ludwigshafen, Germany', consigneeContact:'Klaus Mueller', consigneeTel:'+49-621-60-0', consigneeEmail:'import@basf.com',
    notifyPartyCode:'', notifyPartyName:'BASF SE', notifyPartyAddress:'Carl-Bosch-Str. 38, 67056 Ludwigshafen, Germany',
    carrierId:'MSCU', vesselName:'MSC GULSUN', voyageNo:'FA608R',
    pol:'KRPUS', polTerminal:'HPNT', pod:'DEHAM', podTerminal:'HHLA CTA', finalDest:'Hamburg',
    etd:'2026-02-15', eta:'2026-03-18', closingDate:'2026-02-13', closingTime:'15:00',
    cntr20gpQty:4, totalCntrQty:4,
    commodityDesc:'LITHIUM-ION BATTERY MATERIALS (CLASS 9)', grossWeight:52000, volume:85.6,
    dangerousGoods:'Y', dgClass:'9', unNumber:'UN3481', imoClass:'9',
    blType:'SEAWAY', status:'REQUEST', remark:'DG cargo - IMO Class 9'
  })});

  // 3. 항공 부킹 - SK하이닉스 → 싱가포르 (반도체)
  results.push({name:'3. Air Booking (SK하이닉스→SIN)', data: await post('/api/booking/air', {
    carrierId:'KE', flightNo:'KE643', flightDate:'2026-02-12',
    origin:'KRINC', destination:'SGSIN', etd:'2026-02-12T10:30:00', eta:'2026-02-12T16:45:00',
    commodityDesc:'SEMICONDUCTOR WAFERS - DRAM 16GB', pkgQty:120, pkgType:'BOX',
    grossWeight:2850, chargeableWeight:4200, volume:18.5,
    status:'CONFIRM', remark:'Temperature sensitive 15-25C'
  })});

  // 4. 해상 견적 - 현대자동차 → 뉴욕 (자동차부품)
  results.push({name:'4. Sea Quote (현대차→NYC)', data: await post('/api/quote/sea', {
    quoteDate:'2026-01-28', customerId:'C001', consignee:'Hyundai Motor America',
    pol:'KRPUS', pod:'USNYC', carrierCd:'HDMU', containerType:'40HC', containerQty:6,
    incoterms:'FOB', validFrom:'2026-02-01', validTo:'2026-03-31',
    totalAmount:18500, currency:'USD', status:'active',
    remark:'Q1 2026 Auto Parts Contract Rate'
  })});

  // 5. 항공 견적 - 셀트리온 → 네덜란드 (바이오의약품)
  results.push({name:'5. Air Quote (셀트리온→AMS)', data: await post('/api/quote/air', {
    quoteDate:'2026-01-29', customerId:'C001', consignee:'European Medicines Distribution BV',
    origin:'KRINC', destination:'NLAMS', airlineCd:'KE', flightNo:'KE925',
    weight:580, volume:3.8, commodity:'BIOPHARMACEUTICAL PRODUCTS (COLD CHAIN 2-8C)',
    validFrom:'2026-02-01', validTo:'2026-04-30',
    totalAmount:12800, currency:'USD', status:'active',
    remark:'Cold chain pharmaceutical - GDP compliant'
  })});

  // 6. 해상 스케줄 - Evergreen 부산→LA
  results.push({name:'6. Sea Schedule (EVER ACE KRPUS→USLAX)', data: await post('/api/schedule/sea', {
    carrierId:'EGLV', vesselName:'EVER ACE', voyageNo:'0125-068W',
    pol:'KRPUS', polTerminal:'HPNT', etd:'2026-02-20T14:00:00', cutOff:'2026-02-18T17:00:00', cargoCutOff:'2026-02-19T12:00:00',
    pod:'USLAX', podTerminal:'Everport Terminal', eta:'2026-03-12T08:00:00',
    transitDays:20, frequency:'WEEKLY', status:'OPEN',
    remark:'Trans-Pacific Express Service (TP6)'
  })});

  // 7. 항공 스케줄 - 대한항공 인천→프랑크푸르트
  results.push({name:'7. Air Schedule (KE905 ICN→FRA)', data: await post('/api/schedule/air', {
    carrierId:'KE', flightNo:'KE905',
    origin:'KRINC', originTerminal:'Cargo Terminal 2', etd:'2026-02-15T01:20:00',
    destination:'DEFRA', destTerminal:'Cargo City South', eta:'2026-02-15T06:35:00',
    aircraftType:'B747-8F', transitHours:11,
    frequency:'DAILY', status:'OPEN',
    remark:'Daily freighter ICN-FRA, capacity 130 tons'
  })});

  // 8. 선적요청(S/R) - 포스코 → 일본 (철강코일)
  results.push({name:'8. S/R (포스코→Osaka)', data: await post('/api/sr/sea', {
    transportMode:'SEA', tradeType:'EXPORT',
    shipperName:'포스코', shipperAddress:'경상북도 포항시 남구 동해안로 6261',
    consigneeName:'Nippon Steel Corporation', consigneeAddress:'2-6-1 Marunouchi, Chiyoda-ku, Tokyo, Japan',
    notifyParty:'SAME AS CONSIGNEE',
    pol:'KRPUS', pod:'JPOSA', cargoReadyDate:'2026-02-18',
    commodityDesc:'HOT ROLLED STEEL COILS (HRC) - Grade SS400', packageQty:24, packageType:'COIL',
    grossWeight:480000, volume:156.0,
    status:'PENDING', remark:'Heavy lift cargo - spreader bar required'
  })});

  // 9. 선적통지(S/N) - CJ대한통운 → 태국 (식품/FMCG)
  results.push({name:'9. S/N (CJ대한통운→Bangkok)', data: await post('/api/sn/sea', {
    transportMode:'SEA', carrierName:'COSCO Shipping Lines',
    vesselFlight:'COSCO PRIDE', voyageNo:'038E',
    pol:'KRPUS', pod:'THBKK', etd:'2026-02-10', eta:'2026-02-22',
    senderName:'CJ대한통운 국제물류팀', recipientName:'CP Group Thailand',
    recipientEmail:'logistics@cpgroup.co.th',
    commodityDesc:'INSTANT NOODLES, SNACKS, BEVERAGES (FMCG)', packageQty:2400, grossWeight:36000, volume:145.8,
    status:'SENT', remark:'2x40HC FCL, FMCG products for Thai market'
  })});

  // 10. 해상 B/L - 한화솔루션 → 호주 (석유화학 DRM)
  results.push({name:'10. Sea B/L (한화솔루션→Melbourne)', data: await post('/api/bl/sea', {
    bookingNo:'', mblNo:'COSU6285714000', hblNo:'SEL2026020001', ioType:'OUT', businessType:'CONSOL', blType:'ORIGINAL',
    shipperCode:'', shipperName:'한화솔루션', shipperAddress:'서울특별시 중구 청계천로 86',
    consigneeCode:'', consigneeName:'Orica Limited', consigneeAddress:'1 Nicholson St, Melbourne VIC 3000, Australia',
    notifyCode:'', notifyName:'Orica Limited', notifyAddress:'1 Nicholson St, Melbourne VIC 3000, Australia',
    portOfLoading:'KRPUS', portOfDischarge:'AUMEL', placeOfDelivery:'Melbourne', finalDestination:'Melbourne',
    vesselName:'CMA CGM JACQUES SAADE', voyageNo:'0FA26E1MA',
    etd:'2026-02-22', eta:'2026-03-15', onboardDate:'2026-02-22',
    freightTerm:'PREPAID', serviceTerm:'CY-CY',
    containerType:'FCL', packageQty:960, packageUnit:'DRM',
    grossWeight:192000, measurement:288.0,
    issuePlace:'BUSAN, KOREA', issueDate:'2026-02-22', blIssueType:'ORIGINAL', noOfOriginalBL:3,
    containers:[
      {containerNo:'CMAU8234567',containerType:'40HC',seal1No:'KCS001234',packageQty:240,packageUnit:'DRM',grossWeight:48000,measurement:72.0},
      {containerNo:'CMAU8234568',containerType:'40HC',seal1No:'KCS001235',packageQty:240,packageUnit:'DRM',grossWeight:48000,measurement:72.0},
      {containerNo:'CMAU8234569',containerType:'40HC',seal1No:'KCS001236',packageQty:240,packageUnit:'DRM',grossWeight:48000,measurement:72.0},
      {containerNo:'CMAU8234570',containerType:'40HC',seal1No:'KCS001237',packageQty:240,packageUnit:'DRM',grossWeight:48000,measurement:72.0}
    ]
  })});

  console.log('\n========== REGISTRATION RESULTS ==========\n');
  for (const r of results) {
    const ok = r.data.success ? 'OK' : 'FAIL';
    const id = r.data.bookingNo || r.data.quoteNo || r.data.srNo || r.data.snNo || r.data.jobNo || r.data.scheduleId || '';
    console.log(`[${ok}] ${r.name} => ${id || JSON.stringify(r.data)}`);
  }
  console.log('\n========== ALL 10 COMPLETE ==========');
}

main().catch(e => console.error('ERROR:', e));
