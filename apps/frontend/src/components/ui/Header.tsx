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
    router.push('/');
    router.refresh();
  }

  return (
    <header className="bg-orange-500 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-2xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="text-xl font-bold tracking-wide flex items-center gap-2 min-h-0 min-w-0">
          🐱 ねこ寄り道
        </Link>
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
                href="/register-new"
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
