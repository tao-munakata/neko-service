'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { saveAuth, isLoggedIn } from '@/lib/auth';
import { getDeviceFingerprint, getUserAgent } from '@/lib/device';
import type { AuthResponse } from '@/types';

type Screen = 'checking' | 'welcome_back' | 'not_registered' | 'email_form';

export default function LoginPage() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>('checking');
  const [catCharacter, setCatCharacter] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ページ読み込み時：すでにログイン済みならトップへ、そうでなければデバイス指紋チェック
  useEffect(() => {
    if (isLoggedIn()) { router.replace('/'); return; }

    (async () => {
      try {
        const fingerprint = await getDeviceFingerprint();
        const ua = getUserAgent();
        const res = await api.post('/registration/init', {
          deviceFingerprint: fingerprint,
          userAgent: ua,
        });
        const { status, data, accessToken, refreshToken } = res.data;

        if (status === 'already_registered' && accessToken) {
          // サイレントログイン成功
          saveAuth({
            accessToken,
            refreshToken,
            user: {
              id: data.userId,
              nickname: data.nickname ?? data.catCharacter,
              email: null,
              membershipTier: 'member',
              avatarUrl: null,
            },
          } as AuthResponse);
          setCatCharacter(data.catCharacter ?? data.nickname ?? '');
          setScreen('welcome_back');
          setTimeout(() => router.replace('/'), 2000);
        } else {
          // 未登録デバイス
          setScreen('not_registered');
        }
      } catch {
        // チェック失敗 → メールフォームにフォールバック
        setScreen('email_form');
      }
    })();
  }, [router]);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post<AuthResponse>('/auth/login', { email, password });
      saveAuth(res.data);
      router.replace('/');
    } catch {
      setError('メールアドレスまたはパスワードが違うにゃん');
    } finally {
      setLoading(false);
    }
  }

  // ── チェック中 ──────────────────────────────────────────────
  if (screen === 'checking') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#fffdf7]">
        <div className="text-center">
          <div className="text-7xl mb-6 animate-bounce">🐱</div>
          <p className="text-2xl text-gray-600">確認しているにゃん…</p>
          <div className="mt-4 flex justify-center gap-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-3 h-3 rounded-full bg-orange-400 animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </main>
    );
  }

  // ── おかえり ─────────────────────────────────────────────────
  if (screen === 'welcome_back') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#fffdf7]">
        <div className="text-center px-6">
          <div className="text-7xl mb-6">😸</div>
          <p className="text-3xl font-bold text-gray-800 mb-2">おかえりにゃん！</p>
          {catCharacter && (
            <p className="text-2xl text-orange-600 font-bold mb-4">「{catCharacter}」さん</p>
          )}
          <p className="text-xl text-gray-500">トップページに移動するにゃん…</p>
        </div>
      </main>
    );
  }

  // ── 未登録 ───────────────────────────────────────────────────
  if (screen === 'not_registered') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#fffdf7] px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-7xl mb-6">😿</div>
          <p className="text-2xl font-bold text-gray-800 mb-3">
            まだ登録していないにゃん
          </p>
          <p className="text-lg text-gray-500 mb-8 leading-relaxed">
            このスマホではまだ登録されていないにゃん。<br />
            登録はかんたんにゃん！
          </p>
          <Link
            href="/register"
            className="block w-full py-6 bg-orange-500 hover:bg-orange-600 text-white text-2xl font-bold rounded-3xl shadow-xl transition-colors mb-4"
          >
            🐱 登録するにゃん
          </Link>
          <button
            onClick={() => setScreen('email_form')}
            className="text-sm text-gray-400 underline"
          >
            メールアドレスでログインする
          </button>
        </div>
      </main>
    );
  }

  // ── メール/パスワードフォーム（フォールバック） ─────────────
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#fffdf7] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🐱</div>
          <h1 className="text-2xl font-bold text-gray-800">ねこ寄り道</h1>
          <p className="text-gray-500 mt-1">メールアドレスでログインにゃん</p>
        </div>

        <form onSubmit={handleEmailLogin} className="bg-white rounded-2xl shadow-sm border-2 border-orange-100 p-6 flex flex-col gap-4">
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-orange-400"
              placeholder="example@email.com"
            />
          </div>
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-orange-400"
              placeholder="パスワード"
            />
          </div>

          {error && <p className="text-red-500 text-base text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'ログイン中にゃん…' : 'ログインするにゃん'}
          </button>
        </form>

        <p className="text-center mt-6 text-base text-gray-500">
          はじめての方は{' '}
          <Link href="/register" className="text-orange-500 font-bold hover:underline">
            登録するにゃん
          </Link>
        </p>
      </div>
    </main>
  );
}
