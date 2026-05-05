'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { saveAuth, isLoggedIn } from '@/lib/auth';
import { getDeviceFingerprint, getUserAgent } from '@/lib/device';
import type { AuthResponse } from '@/types';

type Screen = 'checking' | 'welcome_back' | 'select';

export default function LoginPage() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>('checking');
  const [catCharacter, setCatCharacter] = useState('');

  async function tryDeviceLogin() {
    setScreen('checking');
    try {
      const fingerprint = await getDeviceFingerprint();
      const ua = getUserAgent();
      const res = await api.post('/registration/init', {
        deviceFingerprint: fingerprint,
        userAgent: ua,
      });
      const { status, data, accessToken, refreshToken } = res.data;
      if (status === 'already_registered' && accessToken) {
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
        setScreen('select');
      }
    } catch {
      setScreen('select');
    }
  }

  useEffect(() => {
    if (isLoggedIn()) { router.replace('/'); return; }
    tryDeviceLogin();
  }, []);

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

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#fffdf7] px-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-7xl mb-6">🐱</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">ねこ寄り道</h1>
        <p className="text-gray-500 mb-10">どうするにゃん？</p>

        <button
          onClick={tryDeviceLogin}
          className="block w-full py-6 bg-orange-500 hover:bg-orange-600 text-white text-2xl font-bold rounded-3xl shadow-xl transition-colors mb-4"
        >
          🐱 ログインするにゃん
        </button>
        <Link
          href="/register"
          className="block w-full py-6 border-2 border-orange-400 text-orange-600 hover:bg-orange-50 text-2xl font-bold rounded-3xl transition-colors"
        >
          🆕 はじめての方は登録するにゃん
        </Link>
      </div>
    </main>
  );
}
