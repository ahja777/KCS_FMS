import { NextRequest, NextResponse } from 'next/server';

// 유니패스 수입화물 진행정보 조회 API (시뮬레이션)
// 실제 연동 시 관세청 API 키 필요: https://unipass.customs.go.kr/csp/index.do?tgMenuId=MYC_MNU_00000450

interface UnipassImportCargoResult {
  cargoMgtNo: string;        // 화물관리번호
  mblNo: string;             // Master B/L
  hblNo: string;             // House B/L
  mrn: string;               // MRN
  msn: string;               // MSN
  hsn: string;               // HSN
  receiptDt: string;         // 반입일자
  arrivalDt: string;         // 입항일자
  cargoStatus: string;       // 화물상태
  processStatus: string;     // 진행상태
  containerNo: string;       // 컨테이너번호
  cargoType: string;         // 화물구분
  packageQty: number;        // 포장개수
  grossWeight: number;       // 총중량(KG)
  cbm: number;               // 용적(CBM)
  shipperNm: string;         // 송하인
  consigneeNm: string;       // 수하인
  customsOffice: string;     // 세관
  bondedArea: string;        // 보세구역
}

// 고정된 시뮬레이션 데이터 (일관된 결과 반환)
const SIMULATION_DATA: UnipassImportCargoResult[] = [
  {
    cargoMgtNo: '2026KRPUS123456',
    mblNo: 'HDMU2026001234',
    hblNo: 'HBLK202600001',
    mrn: '20260123456789',
    msn: '001',
    hsn: '01',
    receiptDt: '2026-01-25',
    arrivalDt: '2026-01-23',
    cargoStatus: '반입',
    processStatus: '수입신고수리',
    containerNo: 'CNTU12345671',
    cargoType: 'FCL',
    packageQty: 500,
    grossWeight: 12500,
    cbm: 45.5,
    shipperNm: 'SHANGHAI TRADING CO., LTD',
    consigneeNm: '(주)한국무역',
    customsOffice: '부산세관',
    bondedArea: '부산신항 CY'
  },
  {
    cargoMgtNo: '2026KRPUS123457',
    mblNo: 'HDMU2026001234',
    hblNo: 'HBLK202600002',
    mrn: '20260123456789',
    msn: '001',
    hsn: '02',
    receiptDt: '2026-01-25',
    arrivalDt: '2026-01-23',
    cargoStatus: '반입',
    processStatus: '수입신고수리',
    containerNo: 'CNTU12345671',
    cargoType: 'FCL',
    packageQty: 200,
    grossWeight: 5000,
    cbm: 18.2,
    shipperNm: 'SHANGHAI TRADING CO., LTD',
    consigneeNm: '(주)대한물류',
    customsOffice: '부산세관',
    bondedArea: '부산신항 CY'
  },
  {
    cargoMgtNo: '2026KRPUS123458',
    mblNo: 'HDMU2026001234',
    hblNo: 'HBLK202600003',
    mrn: '20260123456789',
    msn: '001',
    hsn: '03',
    receiptDt: '2026-01-25',
    arrivalDt: '2026-01-23',
    cargoStatus: '반입',
    processStatus: '수입신고수리',
    containerNo: 'CNTU12345671',
    cargoType: 'FCL',
    packageQty: 150,
    grossWeight: 3200,
    cbm: 12.8,
    shipperNm: 'SHANGHAI TRADING CO., LTD',
    consigneeNm: '삼성전자(주)',
    customsOffice: '부산세관',
    bondedArea: '부산신항 CY'
  },
  {
    cargoMgtNo: '2026KRINC234567',
    mblNo: 'MAEU2026005678',
    hblNo: 'HBLK202600010',
    mrn: '20260234567890',
    msn: '002',
    hsn: '01',
    receiptDt: '2026-01-26',
    arrivalDt: '2026-01-24',
    cargoStatus: '반입',
    processStatus: '수입신고수리',
    containerNo: 'MSKU98765432',
    cargoType: 'LCL',
    packageQty: 80,
    grossWeight: 2400,
    cbm: 8.5,
    shipperNm: 'NINGBO EXPORT CO., LTD',
    consigneeNm: '(주)코리아트레이딩',
    customsOffice: '인천세관',
    bondedArea: '인천항 CFS'
  },
  {
    cargoMgtNo: '2026KRINC234568',
    mblNo: 'COSU2026009999',
    hblNo: 'HBLK202600020',
    mrn: '20260345678901',
    msn: '003',
    hsn: '01',
    receiptDt: '2026-01-27',
    arrivalDt: '2026-01-25',
    cargoStatus: '반입',
    processStatus: '통관진행중',
    containerNo: 'TCNU55667788',
    cargoType: 'FCL',
    packageQty: 350,
    grossWeight: 8500,
    cbm: 32.0,
    shipperNm: 'QINGDAO LOGISTICS LTD',
    consigneeNm: 'LG전자(주)',
    customsOffice: '부산세관',
    bondedArea: '감천항 CY'
  }
];

// 검색 조건에 맞는 시뮬레이션 데이터 필터링
function getSimulationData(mblNo: string, hblNo: string, cargoMgtNo: string): UnipassImportCargoResult[] {
  let results = [...SIMULATION_DATA];

  // M B/L 검색
  if (mblNo) {
    results = results.filter(item =>
      item.mblNo.toLowerCase().includes(mblNo.toLowerCase())
    );
  }

  // H B/L 검색
  if (hblNo) {
    results = results.filter(item =>
      item.hblNo.toLowerCase().includes(hblNo.toLowerCase())
    );
  }

  // 화물관리번호 검색
  if (cargoMgtNo) {
    results = results.filter(item =>
      item.cargoMgtNo.toLowerCase().includes(cargoMgtNo.toLowerCase())
    );
  }

  // 검색 조건이 있지만 결과가 없는 경우, 검색어를 기반으로 샘플 데이터 생성
  if (results.length === 0 && (mblNo || hblNo || cargoMgtNo)) {
    const year = new Date().getFullYear();
    const baseResult: UnipassImportCargoResult = {
      cargoMgtNo: cargoMgtNo || `${year}KRPUS${mblNo?.slice(-6) || hblNo?.slice(-6) || '999999'}`,
      mblNo: mblNo || `MBLK${year}${hblNo?.slice(-5) || '12345'}`,
      hblNo: hblNo || `HBLK${year}00001`,
      mrn: `${year}0${mblNo?.slice(-7) || '1234567'}`,
      msn: '001',
      hsn: '01',
      receiptDt: new Date().toISOString().split('T')[0],
      arrivalDt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      cargoStatus: '반입',
      processStatus: '수입신고수리',
      containerNo: `CNTU${mblNo?.slice(-6) || '123456'}1`,
      cargoType: 'FCL',
      packageQty: 250,
      grossWeight: 6500,
      cbm: 25.0,
      shipperNm: 'OVERSEAS SHIPPING CO., LTD',
      consigneeNm: '(주)한국물류',
      customsOffice: '부산세관',
      bondedArea: '부산신항 CY'
    };

    results.push(baseResult);

    // M B/L로 검색한 경우 추가 H B/L 데이터 생성
    if (mblNo && !hblNo) {
      results.push({
        ...baseResult,
        cargoMgtNo: cargoMgtNo || `${year}KRPUS${mblNo?.slice(-6) || '999998'}`,
        hblNo: `HBLK${year}00002`,
        hsn: '02',
        packageQty: 180,
        grossWeight: 4200,
        cbm: 16.5,
        consigneeNm: '(주)대한무역'
      });
    }
  }

  return results;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mblNo = searchParams.get('mblNo') || '';
    const hblNo = searchParams.get('hblNo') || '';
    const cargoMgtNo = searchParams.get('cargoMgtNo') || '';
    const year = searchParams.get('year') || String(new Date().getFullYear());
    const searchAllYears = searchParams.get('searchAllYears') === 'true';

    // 검색 조건 검증
    if (!mblNo && !hblNo && !cargoMgtNo) {
      return NextResponse.json({
        success: false,
        error: 'M B/L, H B/L 또는 화물관리번호 중 하나는 필수입니다.',
        results: []
      });
    }

    // 시뮬레이션 데이터 조회 (항상 일관된 결과 반환)
    const results = getSimulationData(mblNo, hblNo, cargoMgtNo);

    if (results.length === 0) {
      return NextResponse.json({
        success: true,
        message: '검색 결과가 없습니다.',
        results: [],
        searchedYear: searchAllYears ? '전체' : year
      });
    }

    console.log(`[UNIPASS] 수입화물 조회: MBL=${mblNo}, HBL=${hblNo}, 화물관리번호=${cargoMgtNo}, 연도=${year}, 결과=${results.length}건`);

    return NextResponse.json({
      success: true,
      message: `${results.length}건의 화물 정보를 조회했습니다.`,
      results: results,
      searchedYear: searchAllYears ? '전체' : year
    });

  } catch (error) {
    console.error('Unipass import cargo search error:', error);
    return NextResponse.json({
      success: false,
      error: '유니패스 조회 중 오류가 발생했습니다.',
      results: []
    }, { status: 500 });
  }
}

// POST - 실제 유니패스 API 연동 시 사용 (현재는 시뮬레이션)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mblNo, hblNo, cargoMgtNo, year, searchAllYears } = body;

    // 검색 조건 검증
    if (!mblNo && !hblNo && !cargoMgtNo) {
      return NextResponse.json({
        success: false,
        error: 'M B/L, H B/L 또는 화물관리번호 중 하나는 필수입니다.',
        results: []
      });
    }

    // 시뮬레이션 데이터 조회 (항상 일관된 결과 반환)
    const results = getSimulationData(mblNo || '', hblNo || '', cargoMgtNo || '');

    const searchedYear = searchAllYears
      ? `전체 (2018~${new Date().getFullYear() + 1})`
      : (year || String(new Date().getFullYear()));

    return NextResponse.json({
      success: true,
      message: results.length > 0 ? `${results.length}건의 화물 정보를 조회했습니다.` : '검색 결과가 없습니다.',
      results: results,
      searchedYear: searchedYear
    });

  } catch (error) {
    console.error('Unipass import cargo POST error:', error);
    return NextResponse.json({
      success: false,
      error: '유니패스 조회 중 오류가 발생했습니다.',
      results: []
    }, { status: 500 });
  }
}
