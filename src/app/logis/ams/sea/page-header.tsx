'use client';

import { useRouter } from 'next/navigation';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import DateRangeButtons, { getToday } from '@/components/DateRangeButtons';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';

interface AMSData {
  id: string;
  amsNo: string;
  amsDate: string;
  amsType: string;
  targetCountry: string;
  blNo: string;
  shipper: string;
  consignee: string;
  vessel: string;
  voyage: string;
  pol: string;
  pod: string;
  etd: string;
  filingDeadline: string;
  containerQty: number;
  responseCode: string;
  status: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '작성중', color: 'bg-gray-500' },
  SENT: { label: '전송완료', color: 'bg-blue-500' },
  ACCEPTED: { label: '접수완료', color: 'bg-green-500' },
  HOLD: { label: 'HOLD', color: 'bg-yellow-500' },
  REJECTED: { label: '반려', color: 'bg-red-500' },
  NO_LOAD: { label: 'DO NOT LOAD', color: 'bg-red-600' },
};

const responseConfig: Record<string, { label: string; color: string }> = {
  NONE: { label: '-', color: 'text-gray-500' },
  '': { label: '-', color: 'text-gray-500' },
  '1A': { label: '1A (접수)', color: 'text-green-500' },
  '1B': { label: '1B (Hold)', color: 'text-yellow-500' },
  '1C': { label: '1C (반려)', color: 'text-red-500' },
  '3H': { label: '3H (Do Not Load)', color: 'text-red-600' },
};

const defaultData: AMSData[] = [
  { id: '1', amsNo: 'AMS-2026-0001', amsDate: '2026-01-20', amsType: 'ISF', targetCountry: 'USA', blNo: 'HDMU1234567', shipper: '삼성전자', consignee: 'Samsung America', vessel: 'HMM GDANSK', voyage: '001E', pol: 'KRPUS', pod: 'USLAX', etd: '2026-01-22', filingDeadline: '2026-01-20 12:00', containerQty: 2, responseCode: '1A', status: 'ACCEPTED' },
  { id: '2', amsNo: 'AMS-2026-0002', amsDate: '2026-01-19', amsType: 'AMS', targetCountry: 'USA', blNo: 'MAEU5678901', shipper: 'LG전자', consignee: 'LG Electronics USA', vessel: 'MAERSK EINDHOVEN', voyage: '002W', pol: 'KRPUS', pod: 'USNYC', etd: '2026-01-25', filingDeadline: '2026-01-23 12:00', containerQty: 3, responseCode: '1B', status: 'HOLD' },
  { id: '3', amsNo: 'AMS-2026-0003', amsDate: '2026-01-18', amsType: 'ACI', targetCountry: 'Canada', blNo: 'MSCU2345678', shipper: '현대자동차', consignee: 'Hyundai Motor Canada', vessel: 'MSC OSCAR', voyage: '003E', pol: 'KRPUS', pod: 'CAHAL', etd: '2026-01-28', filingDeadline: '2026-01-25 00:00', containerQty: 5, responseCode: 'NONE', status: 'SENT' },
  { id: '4', amsNo: 'AMS-2026-0004', amsDate: '2026-01-17', amsType: 'ENS', targetCountry: 'EU', blNo: 'EGLV9012345', shipper: 'SK하이닉스', consignee: 'SK Hynix Europe', vessel: 'EVER GIVEN', voyage: '004W', pol: 'KRPUS', pod: 'DEHAM', etd: '2026-02-01', filingDeadline: '2026-01-30 00:00', containerQty: 1, responseCode: 'NONE', status: 'DRAFT' },
  { id: '5', amsNo: 'AMS-2026-0005', amsDate: '2026-01-16', amsType: 'AFR', targetCountry: 'Japan', blNo: 'NYKU7890123', shipper: '포스코', consignee: 'Nippon Steel', vessel: 'ONE STORK', voyage: '005E', pol: 'KRPUS', pod: 'JPYOK', etd: '2026-01-22', filingDeadline: '2026-01-20 00:00', containerQty: 10, responseCode: '1A', status: 'ACCEPTED' },
];