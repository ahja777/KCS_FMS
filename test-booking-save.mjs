// 해상부킹 등록 테스트
const BASE_URL = 'http://localhost:3000';

async function testSeaBookingSave() {
  console.log('='.repeat(60));
  console.log('해상부킹 등록 테스트');
  console.log('='.repeat(60));

  // 1. 등록 전 데이터 수 확인
  console.log('\n[1] 등록 전 데이터 조회...');
  const beforeResponse = await fetch(`${BASE_URL}/api/booking/sea`);
  const beforeData = await beforeResponse.json();
  console.log(`  현재 부킹 수: ${beforeData.length}개`);

  // 2. 새 부킹 등록
  console.log('\n[2] 새 부킹 등록...');
  const newBooking = {
    carrierId: 4, // KOREAN AIR
    carrierBookingNo: 'TEST-CARRIER-001',
    vesselName: 'TEST VESSEL',
    voyageNo: 'V001E',
    pol: 'KRPUS',
    pod: 'USLAX',
    etd: '2026-02-15',
    eta: '2026-03-01',
    cntr20gpQty: 2,
    cntr40gpQty: 1,
    cntr40hcQty: 1,
    totalCntrQty: 4,
    commodityDesc: '테스트 화물 - DB 저장 테스트',
    grossWeight: 35000,
    volume: 75.5,
    status: 'DRAFT',
    remark: 'API 등록 테스트'
  };

  const createResponse = await fetch(`${BASE_URL}/api/booking/sea`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newBooking)
  });
  const createResult = await createResponse.json();

  if (createResult.success) {
    console.log(`  ✓ 등록 성공!`);
    console.log(`    - BOOKING_ID: ${createResult.bookingId}`);
    console.log(`    - BOOKING_NO: ${createResult.bookingNo}`);
  } else {
    console.log(`  ✗ 등록 실패:`, createResult);
    return;
  }

  // 3. 등록 후 데이터 확인
  console.log('\n[3] 등록 후 데이터 조회...');
  const afterResponse = await fetch(`${BASE_URL}/api/booking/sea`);
  const afterData = await afterResponse.json();
  console.log(`  현재 부킹 수: ${afterData.length}개 (이전: ${beforeData.length}개)`);

  // 4. 등록된 데이터 상세 조회
  console.log('\n[4] 등록된 데이터 상세 조회...');
  const detailResponse = await fetch(`${BASE_URL}/api/booking/sea?bookingId=${createResult.bookingId}`);
  const detailData = await detailResponse.json();
  console.log('  등록된 데이터:');
  console.log(`    - 부킹번호: ${detailData.bookingNo}`);
  console.log(`    - 선사: ${detailData.carrierName}`);
  console.log(`    - 선명: ${detailData.vesselName}`);
  console.log(`    - 항차: ${detailData.voyageNo}`);
  console.log(`    - POL: ${detailData.pol}`);
  console.log(`    - POD: ${detailData.pod}`);
  console.log(`    - ETD: ${detailData.etd}`);
  console.log(`    - 컨테이너: ${detailData.totalCntrQty}개`);
  console.log(`    - 품목: ${detailData.commodityDesc}`);
  console.log(`    - 상태: ${detailData.status}`);

  console.log('\n' + '='.repeat(60));
  console.log('해상부킹 등록 테스트 완료!');
  console.log('='.repeat(60));
}

testSeaBookingSave().catch(console.error);
