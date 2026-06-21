'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { saveAuth, isLoggedIn } from '@/lib/auth';
import { collectDeviceIdentity } from '@/lib/device-identity/collector';
import type { AuthResponse } from '@/types';

type Screen = 'checking' | 'welcome_back' | 'select';

export default function LoginPage() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>('checking');
  const [catCharacter, setCatCharacter] = useState('');

  async function tryDeviceLogin() {
    setScreen('checking');
    try {
      const identity = collectDeviceIdentity();
      // device-login は既知デバイスのみを確認し、未登録なら 401 を返す
      // /registration/init は新規ユーザーを作成するため登録ページ専用
      const res = await api.post('/registration/device-login', {
        deviceFingerprint: identity.deviceId,
      });
      const { data, accessToken, refreshToken } = res.data;
      if (accessToken) {
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
        setTimeout(() => { window.location.replace('/'); }, 2000);
      } else {
        setScreen('select');
      }
    } catch {
      // 未登録デバイス(401)を含む全エラーは選択画面へ
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
