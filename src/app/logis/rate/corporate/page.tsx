'use client';

import Link from 'next/link';
import PageLayout from '@/components/PageLayout';

export default function CorporateRatePage() {
  return (
    <PageLayout title="기업운임관리" subtitle="Logis > 운임관리 > 기업운임관리" showCloseButton={false}>
      <main className="p-6">
        <div className="max-w-2xl mx-auto mt-12">
          <h2 className="text-xl font-bold mb-6 text-center">기업운임관리</h2>
          <p className="text-center text-[var(--muted)] mb-8">
            운송모드를 선택하여 기업운임을 관리하세요.
          </p>
          <div className="grid grid-cols-2 gap-6">
            <Link
              href="/logis/rate/corporate/sea"
              className="card p-8 text-center hover:bg-[var(--surface-50)] transition-colors group"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-blue-600 transition-colors">해상 (SEA)</h3>
              <p className="text-sm text-[var(--muted)]">해상운임 기업별 계약운임 관리</p>
            </Link>

            <Link
              href="/logis/rate/corporate/air"
              className="card p-8 text-center hover:bg-[var(--surface-50)] transition-colors group"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-purple-600 transition-colors">항공 (AIR)</h3>
              <p className="text-sm text-[var(--muted)]">항공운임 기업별 계약운임 관리</p>
            </Link>
          </div>
        </div>
      </main>
    </PageLayout>
  );
}
