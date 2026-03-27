import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: '211.236.174.220',
  port: 53306,
  user: 'user',
  password: 'P@ssw0rd',
  database: 'logstic',
};

// 항구 코드별 좌표 (POL, POD 코드 -> 위도/경도)
const PORT_COORDINATES: Record<string, { lat: number; lng: number; name: string; country: string }> = {
  // 한국
  'KRPUS': { lat: 35.1796, lng: 129.0756, name: 'Busan', country: 'KR' },
  'KRBNP': { lat: 35.0844, lng: 128.8442, name: 'Busan New Port', country: 'KR' },
  'KRINC': { lat: 37.4563, lng: 126.7052, name: 'Incheon', country: 'KR' },
  'KRKAN': { lat: 34.9033, lng: 127.6961, name: 'Gwangyang', country: 'KR' },
  'KRICN': { lat: 37.4602, lng: 126.4407, name: 'Incheon Airport', country: 'KR' },
  // 한국 항공 (IATA 코드)
  'ICN': { lat: 37.4602, lng: 126.4407, name: 'Incheon Intl Airport', country: 'KR' },
  'GMP': { lat: 37.5585, lng: 126.7903, name: 'Gimpo Intl Airport', country: 'KR' },
  // 중국
  'CNSHA': { lat: 31.2304, lng: 121.4737, name: 'Shanghai', country: 'CN' },
  'CNXMN': { lat: 24.4798, lng: 118.0894, name: 'Xiamen', country: 'CN' },
  'CNTAO': { lat: 36.0671, lng: 120.3826, name: 'Qingdao', country: 'CN' },
  'CNNGB': { lat: 29.8683, lng: 121.5440, name: 'Ningbo', country: 'CN' },
  'CNSZN': { lat: 22.5431, lng: 114.0579, name: 'Shenzhen', country: 'CN' },
  // 중국 항공 (IATA 코드)
  'PVG': { lat: 31.1443, lng: 121.8083, name: 'Shanghai Pudong Airport', country: 'CN' },
  'PEK': { lat: 40.0799, lng: 116.6031, name: 'Beijing Capital Airport', country: 'CN' },
  'CAN': { lat: 23.3924, lng: 113.2988, name: 'Guangzhou Baiyun Airport', country: 'CN' },
  'HKG': { lat: 22.3080, lng: 113.9185, name: 'Hong Kong Intl Airport', country: 'HK' },
  // 일본
  'JPTYO': { lat: 35.6762, lng: 139.6503, name: 'Tokyo', country: 'JP' },
  'JPNGO': { lat: 35.0116, lng: 136.8654, name: 'Nagoya', country: 'JP' },
  'JPOSA': { lat: 34.6937, lng: 135.5023, name: 'Osaka', country: 'JP' },
  'JPUKB': { lat: 34.6901, lng: 135.1956, name: 'Kobe', country: 'JP' },
  'JPSMZ': { lat: 35.0167, lng: 138.5000, name: 'Shimizu', country: 'JP' },
  'JPYOK': { lat: 35.4437, lng: 139.6380, name: 'Yokohama', country: 'JP' },
  // 일본 항공 (IATA 코드)
  'NRT': { lat: 35.7720, lng: 140.3929, name: 'Narita Intl Airport', country: 'JP' },
  'HND': { lat: 35.5494, lng: 139.7798, name: 'Haneda Airport', country: 'JP' },
  'KIX': { lat: 34.4273, lng: 135.2440, name: 'Kansai Intl Airport', country: 'JP' },
  'NGO': { lat: 34.8583, lng: 136.8050, name: 'Chubu Centrair Airport', country: 'JP' },
  // 동남아
  'SGSIN': { lat: 1.3521, lng: 103.8198, name: 'Singapore', country: 'SG' },
  'VNHPH': { lat: 20.8449, lng: 106.6881, name: 'Haiphong', country: 'VN' },
  'VNDAD': { lat: 16.0544, lng: 108.2022, name: 'Da Nang', country: 'VN' },
  'VNSGN': { lat: 10.8231, lng: 106.6297, name: 'Ho Chi Minh', country: 'VN' },
  'THBKK': { lat: 13.6900, lng: 100.7501, name: 'Bangkok', country: 'TH' },
  'THLCH': { lat: 13.0957, lng: 100.8833, name: 'Laem Chabang', country: 'TH' },
  'MYPKG': { lat: 2.9925, lng: 101.3929, name: 'Port Klang', country: 'MY' },
  'IDJKT': { lat: -6.1059, lng: 106.8837, name: 'Jakarta', country: 'ID' },
  'PHMNL': { lat: 14.5995, lng: 120.9842, name: 'Manila', country: 'PH' },
  // 동남아 항공 (IATA 코드)
  'SIN': { lat: 1.3644, lng: 103.9915, name: 'Singapore Changi Airport', country: 'SG' },
  'BKK': { lat: 13.6900, lng: 100.7501, name: 'Suvarnabhumi Airport', country: 'TH' },
  'KUL': { lat: 2.7456, lng: 101.7072, name: 'Kuala Lumpur Intl Airport', country: 'MY' },
  'SGN': { lat: 10.8188, lng: 106.6519, name: 'Tan Son Nhat Airport', country: 'VN' },
  'MNL': { lat: 14.5086, lng: 121.0194, name: 'Ninoy Aquino Airport', country: 'PH' },
  // 대만
  'TWKHH': { lat: 22.6273, lng: 120.3014, name: 'Kaohsiung', country: 'TW' },
  'TWKEL': { lat: 25.1276, lng: 121.7392, name: 'Keelung', country: 'TW' },
  // 인도/중동
  'INBOM': { lat: 19.0760, lng: 72.8777, name: 'Mumbai', country: 'IN' },
  'INNSA': { lat: 18.9400, lng: 72.8400, name: 'Nhava Sheva', country: 'IN' },
  'AEJEA': { lat: 25.0657, lng: 55.1713, name: 'Jebel Ali', country: 'AE' },
  'AEDXB': { lat: 25.2048, lng: 55.2708, name: 'Dubai', country: 'AE' },
  // 유럽
  'NLRTM': { lat: 51.9244, lng: 4.4777, name: 'Rotterdam', country: 'NL' },
  'DEHAM': { lat: 53.5511, lng: 9.9937, name: 'Hamburg', country: 'DE' },
  'BEANR': { lat: 51.2194, lng: 4.4025, name: 'Antwerp', country: 'BE' },
  'GBFXT': { lat: 51.9536, lng: 1.3531, name: 'Felixstowe', country: 'GB' },
  'ESBCN': { lat: 41.3851, lng: 2.1734, name: 'Barcelona', country: 'ES' },
  'ITGOA': { lat: 44.4056, lng: 8.9463, name: 'Genoa', country: 'IT' },
  'TRIST': { lat: 41.0082, lng: 28.9784, name: 'Istanbul', country: 'TR' },
  'GRPIR': { lat: 37.9412, lng: 23.6470, name: 'Piraeus', country: 'GR' },
  // 유럽 항공 (IATA 코드)
  'FRA': { lat: 50.0379, lng: 8.5622, name: 'Frankfurt Airport', country: 'DE' },
  'LHR': { lat: 51.4700, lng: -0.4543, name: 'London Heathrow Airport', country: 'GB' },
  'CDG': { lat: 49.0097, lng: 2.5479, name: 'Paris Charles de Gaulle Airport', country: 'FR' },
  'AMS': { lat: 52.3105, lng: 4.7683, name: 'Amsterdam Schiphol Airport', country: 'NL' },
  // 중동 항공 (IATA 코드)
  'DXB': { lat: 25.2532, lng: 55.3657, name: 'Dubai Intl Airport', country: 'AE' },
  'DOH': { lat: 25.2609, lng: 51.6138, name: 'Hamad Intl Airport', country: 'QA' },
  // 미주
  'USLAX': { lat: 33.7490, lng: -118.2858, name: 'Los Angeles', country: 'US' },
  'USLGB': { lat: 33.7700, lng: -118.1937, name: 'Long Beach', country: 'US' },
  'USNYC': { lat: 40.7128, lng: -74.0060, name: 'New York', country: 'US' },
  'USSEA': { lat: 47.6062, lng: -122.3321, name: 'Seattle', country: 'US' },
  'USTIW': { lat: 47.2529, lng: -122.4443, name: 'Tacoma', country: 'US' },
  'USOAK': { lat: 37.7953, lng: -122.2783, name: 'Oakland', country: 'US' },
  'USPDX': { lat: 45.6387, lng: -122.6615, name: 'Portland', country: 'US' },
  'USHOU': { lat: 29.7604, lng: -95.3698, name: 'Houston', country: 'US' },
  'USSAV': { lat: 32.0809, lng: -81.0912, name: 'Savannah', country: 'US' },
  // 미국 항공 (IATA 코드)
  'LAX': { lat: 33.9425, lng: -118.4081, name: 'Los Angeles Intl Airport', country: 'US' },
  'JFK': { lat: 40.6413, lng: -73.7781, name: 'JFK Intl Airport', country: 'US' },
  'SFO': { lat: 37.6213, lng: -122.3790, name: 'San Francisco Intl Airport', country: 'US' },
  'ORD': { lat: 41.9742, lng: -87.9073, name: 'Chicago O\'Hare Intl Airport', country: 'US' },
  'ATL': { lat: 33.6407, lng: -84.4277, name: 'Atlanta Intl Airport', country: 'US' },
  'DFW': { lat: 32.8998, lng: -97.0403, name: 'Dallas/Fort Worth Intl Airport', country: 'US' },
  'MIA': { lat: 25.7959, lng: -80.2870, name: 'Miami Intl Airport', country: 'US' },
  'SEA': { lat: 47.4502, lng: -122.3088, name: 'Seattle-Tacoma Intl Airport', country: 'US' },
  // 캐나다
  'CAVAN': { lat: 49.2827, lng: -123.1207, name: 'Vancouver', country: 'CA' },
  // 방글라데시
  'BDCGP': { lat: 22.3475, lng: 91.8123, name: 'Chittagong', country: 'BD' },
  // 호주
  'AUSYD': { lat: -33.8688, lng: 151.2093, name: 'Sydney', country: 'AU' },
  'AUMEL': { lat: -37.8136, lng: 144.9631, name: 'Melbourne', country: 'AU' },
};

export async function GET() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    // ============================================================
    // BL 등록 데이터 기반으로 지도 경로 표시
    // ============================================================

    // 1. 해상 Master BL 조회
    const [masterBLs] = await connection.query(`
      SELECT
        m.MBL_ID,
        m.MBL_NO,
        m.SHIPMENT_ID,
        m.CARRIER_ID,
        m.VESSEL_NM,
        m.VOYAGE_NO,
        m.POL_PORT_CD,
        m.POD_PORT_CD,
        m.PLACE_OF_RECEIPT,
        m.PLACE_OF_DELIVERY,
        m.FINAL_DEST,
        m.ETD_DT,
        m.ATD_DT,
        m.ETA_DT,
        m.ATA_DT,
        m.SHIPPER_NM,
        m.CONSIGNEE_NM,
        m.TOTAL_PKG_QTY,
        m.PKG_TYPE_CD,
        m.GROSS_WEIGHT_KG,
        m.VOLUME_CBM,
        m.COMMODITY_DESC,
        m.BL_TYPE_CD,
        m.STATUS_CD,
        cr.CARRIER_NM
      FROM BL_MASTER_BL m
      LEFT JOIN MST_CARRIER cr ON m.CARRIER_ID = cr.CARRIER_ID
      WHERE m.DEL_YN = 'N'
      ORDER BY m.ETD_DT DESC, m.MBL_ID DESC
    `);

    // 2. 해상 House BL 조회 (MBL에 연결된)
    const [houseBLs] = await connection.query(`
      SELECT
        h.HBL_ID,
        h.HBL_NO,
        h.MBL_ID,
        h.SHIPMENT_ID,
        h.SHIPPER_NM,
        h.CONSIGNEE_NM,
        h.TOTAL_PKG_QTY,
        h.GROSS_WEIGHT_KG,
        h.VOLUME_CBM,
        h.STATUS_CD
      FROM BL_HOUSE_BL h
      WHERE h.DEL_YN = 'N'
    `);

    // HBL을 MBL_ID로 그룹화
    const hblMap = new Map<number, any[]>();
    (houseBLs as any[]).forEach(hbl => {
      const mblId = hbl.MBL_ID;
      if (!hblMap.has(mblId)) {
        hblMap.set(mblId, []);
      }
      hblMap.get(mblId)!.push(hbl);
    });

    // 3. 항공 Master AWB 조회
    const [masterAWBs] = await connection.query(`
      SELECT
        a.MAWB_ID,
        a.MAWB_NO,
        a.SHIPMENT_ID,
        a.CARRIER_ID,
        a.AIRLINE_CODE,
        a.FLIGHT_NO,
        a.ORIGIN_AIRPORT_CD,
        a.DEST_AIRPORT_CD,
        a.ETD_DT,
        a.ETD_TIME,
        a.ETA_DT,
        a.ETA_TIME,
        a.SHIPPER_NM,
        a.CONSIGNEE_NM,
        a.PIECES,
        a.GROSS_WEIGHT_KG,
        a.CHARGE_WEIGHT_KG,
        a.VOLUME_CBM,
        a.COMMODITY_DESC,
        a.STATUS_CD
      FROM AWB_MASTER_AWB a
      WHERE a.DEL_YN = 'N'
      ORDER BY a.ETD_DT DESC, a.MAWB_ID DESC
    `);

    // 4. 항공 House AWB 조회
    const [houseAWBs] = await connection.query(`
      SELECT
        h.HAWB_ID,
        h.HAWB_NO,
        h.MAWB_ID,
        h.SHIPPER_NM,
        h.PIECES,
        h.GROSS_WEIGHT_KG,
        h.STATUS_CD
      FROM AWB_HOUSE_AWB h
      WHERE h.DEL_YN = 'N'
    `);

    // HAWB을 MAWB_ID로 그룹화
    const hawbMap = new Map<number, any[]>();
    (houseAWBs as any[]).forEach(hawb => {
      const mawbId = hawb.MAWB_ID;
      if (!hawbMap.has(mawbId)) {
        hawbMap.set(mawbId, []);
      }
      hawbMap.get(mawbId)!.push(hawb);
    });

    // 진행률 계산 함수
    const calculateProgress = (etd: Date | null, eta: Date | null, atd: Date | null, ata: Date | null, status: string) => {
      if (ata) return 100;
      if (status === 'ARRIVED' || status === 'DELIVERED') return 100;
      if (!etd || !eta) return Math.floor(Math.random() * 40) + 30; // 30~70%

      const now = new Date();
      const etdDate = new Date(etd);
      const etaDate = new Date(eta);

      if (now < etdDate) return 5;
      if (now > etaDate) return 95;

      const totalDuration = etaDate.getTime() - etdDate.getTime();
      const elapsed = now.getTime() - etdDate.getTime();

      return Math.min(95, Math.max(5, Math.round((elapsed / totalDuration) * 100)));
    };

    // 색상 할당
    const seaColors = ['#E8A838', '#14D4CE', '#22C55E', '#3B82F6', '#8B5CF6', '#10B981', '#6366F1'];
    const airColors = ['#F97316', '#EC4899', '#F43F5E', '#A855F7', '#6366F1', '#EF4444'];

    // 해상 BL → 지도 경로 변환
    const seaRoutes = (masterBLs as any[])
      .filter(mbl => mbl.POL_PORT_CD && mbl.POD_PORT_CD)
      .map((mbl, index) => {
        const polCoord = PORT_COORDINATES[mbl.POL_PORT_CD];
        const podCoord = PORT_COORDINATES[mbl.POD_PORT_CD];

        if (!polCoord || !podCoord) return null;

        const hbls = hblMap.get(mbl.MBL_ID) || [];
        const firstHbl = hbls[0];

        return {
          id: `mbl-${mbl.MBL_ID}`,
          shipmentNo: mbl.MBL_NO,
          type: 'sea' as const,
          status: mbl.STATUS_CD || 'IN_TRANSIT',
          from: {
            code: mbl.POL_PORT_CD,
            name: polCoord.name,
            country: polCoord.country,
            lat: polCoord.lat,
            lng: polCoord.lng,
          },
          to: {
            code: mbl.POD_PORT_CD,
            name: podCoord.name,
            country: podCoord.country,
            lat: podCoord.lat,
            lng: podCoord.lng,
          },
          progress: calculateProgress(mbl.ETD_DT, mbl.ETA_DT, mbl.ATD_DT, mbl.ATA_DT, mbl.STATUS_CD),
          color: seaColors[index % seaColors.length],
          cargo: {
            customer: mbl.SHIPPER_NM,
            carrier: mbl.CARRIER_NM || 'HMM',
            vessel: mbl.VESSEL_NM,
            voyageNo: mbl.VOYAGE_NO,
            tradeType: mbl.BL_TYPE_CD,
            etd: mbl.ETD_DT,
            eta: mbl.ETA_DT,
            atd: mbl.ATD_DT,
            ata: mbl.ATA_DT,
            packages: mbl.TOTAL_PKG_QTY || 100,
            packageType: mbl.PKG_TYPE_CD || 'PKG',
            grossWeight: mbl.GROSS_WEIGHT_KG,
            volume: mbl.VOLUME_CBM,
            mblNo: mbl.MBL_NO,
            mblId: mbl.MBL_ID,
            hblNo: firstHbl?.HBL_NO,
            hblId: firstHbl?.HBL_ID,
            hblCount: hbls.length,
          },
        };
      })
      .filter(Boolean) as any[];

    // 항공 AWB → 지도 경로 변환
    const airRoutes = (masterAWBs as any[])
      .filter(mawb => mawb.ORIGIN_AIRPORT_CD && mawb.DEST_AIRPORT_CD)
      .map((mawb, index) => {
        const originCoord = PORT_COORDINATES[mawb.ORIGIN_AIRPORT_CD];
        const destCoord = PORT_COORDINATES[mawb.DEST_AIRPORT_CD];

        if (!originCoord || !destCoord) return null;

        const hawbs = hawbMap.get(mawb.MAWB_ID) || [];
        const firstHawb = hawbs[0];

        return {
          id: `mawb-${mawb.MAWB_ID}`,
          shipmentNo: mawb.MAWB_NO,
          type: 'air' as const,
          status: mawb.STATUS_CD || 'IN_TRANSIT',
          from: {
            code: mawb.ORIGIN_AIRPORT_CD,
            name: originCoord.name,
            country: originCoord.country,
            lat: originCoord.lat,
            lng: originCoord.lng,
          },
          to: {
            code: mawb.DEST_AIRPORT_CD,
            name: destCoord.name,
            country: destCoord.country,
            lat: destCoord.lat,
            lng: destCoord.lng,
          },
          progress: calculateProgress(mawb.ETD_DT, mawb.ETA_DT, null, null, mawb.STATUS_CD),
          color: airColors[index % airColors.length],
          cargo: {
            customer: mawb.SHIPPER_NM,
            carrier: mawb.AIRLINE_CODE,
            vessel: `${mawb.AIRLINE_CODE}${mawb.FLIGHT_NO}`,
            tradeType: 'AIR',
            etd: mawb.ETD_DT,
            eta: mawb.ETA_DT,
            packages: mawb.PIECES || 50,
            packageType: 'PKG',
            grossWeight: mawb.GROSS_WEIGHT_KG,
            volume: mawb.VOLUME_CBM,
            mblNo: mawb.MAWB_NO,
            mblId: mawb.MAWB_ID,
            hblNo: firstHawb?.HAWB_NO,
            hblId: firstHawb?.HAWB_ID,
            hblCount: hawbs.length,
          },
        };
      })
      .filter(Boolean) as any[];

    // 전체 경로
    const allRoutes = [...seaRoutes, ...airRoutes];

    // 활성 항구 추출
    const activePorts = new Set<string>();
    allRoutes.forEach(route => {
      activePorts.add(route.from.code);
      activePorts.add(route.to.code);
    });

    // 항구 데이터 생성
    const portData = Object.entries(PORT_COORDINATES)
      .filter(([code]) => activePorts.has(code))
      .map(([code, data]) => ({
        code,
        name: data.name,
        country: data.country,
        lat: data.lat,
        lng: data.lng,
        type: 'SEA',
      }));

    // 통계
    const stats = {
      totalShipments: allRoutes.length,
      inTransit: allRoutes.filter(r => ['DEPARTED', 'SHIPPED', 'IN_TRANSIT'].includes(r.status)).length,
      seaRoutes: seaRoutes.length,
      airRoutes: airRoutes.length,
      activePorts: portData.length,
      totalMBL: (masterBLs as any[]).length,
      totalHBL: (houseBLs as any[]).length,
      totalMAWB: (masterAWBs as any[]).length,
      totalHAWB: (houseAWBs as any[]).length,
    };

    return NextResponse.json({
      routes: allRoutes,
      ports: portData,
      stats,
    });

  } catch (error) {
    console.error('Tracking API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracking data', details: String(error) },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
