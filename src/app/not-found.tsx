import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        {/* 개발 중 아이콘 */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30 mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />
          </svg>
        </div>

        {/* 상태 뱃지 */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 mb-4">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-semibold text-amber-700 tracking-wide">DEVELOPING</span>
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-2">
          페이지 개발 중입니다
        </h2>
        <p className="text-sm text-gray-500 mb-1">
          요청하신 페이지는 현재 개발이 진행 중입니다.
        </p>
        <p className="text-xs text-gray-400 mb-8">
          빠른 시일 내에 서비스를 제공할 예정입니다.
        </p>

        {/* 진행 바 */}
        <div className="w-full max-w-xs mx-auto mb-8">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>Progress</span>
            <span>개발 진행 중...</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full animate-pulse"
              style={{
                width: '65%',
                background: 'linear-gradient(90deg, #f59e0b, #f97316)',
              }}
            />
          </div>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A2744] text-white rounded-lg text-sm font-semibold hover:bg-[#243354] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          홈으로 이동
        </Link>
      </div>
    </div>
  );
}
