'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isLoggedIn, clearAuth, getUser } from '@/lib/auth';
import { useEffect, useState } from 'react';

export default function Header() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [nickname, setNickname] = useState('');

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    const user = getUser();
    if (user) setNickname(user.nickname);
  }, []);

  function handleLogout() {
    clearAuth();
    sessionStorage.setItem('logged_out', '1');
    window.location.href = '/';
  }

  return (
    <header className="bg-orange-500 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-2xl mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/" className="text-xl font-bold tracking-wide flex items-center gap-2 min-h-0 min-w-0">
            🐱 ねこ寄り道
          </Link>
          {/* スマホのみ表示 */}
          <a
            href="https://social-plugins.line.me/lineit/share?url=https%3A%2F%2Fnyanko.fun"
            target="_blank"
            rel="noopener noreferrer"
            className="md:hidden flex items-center gap-1 bg-[#06C755] text-white text-xs font-bold px-3 py-1.5 rounded-full"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
            </svg>
            送る
          </a>
        </div>
        <nav className="flex items-center gap-3">
          {loggedIn ? (
            <>
              <span className="text-sm text-orange-100">{nickname}さん</span>
              <button
                onClick={handleLogout}
                className="text-sm bg-orange-600 hover:bg-orange-700 px-4 rounded-full font-medium transition-colors"
              >
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm hover:text-orange-200 transition-colors"
              >
                ログイン
              </Link>
              <Link
                href="/register"
                className="text-sm bg-white text-orange-500 hover:bg-orange-50 px-4 py-1 rounded-full font-bold transition-colors"
              >
                はじめる
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
