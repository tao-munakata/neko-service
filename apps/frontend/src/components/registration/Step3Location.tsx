'use client';
import { useState } from 'react';
import api from '@/lib/api';
import { saveAuth } from '@/lib/auth';
import type { AuthResponse } from '@/types';

interface Props {
  userId: string;
  catCharacter: string;
  onNext: () => void;
}

export default function Step3Location({ userId, catCharacter, onNext }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'confirm' | 'done' | 'error'>('idle');
  const [mapsConsent, setMapsConsent] = useState<boolean | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState('');

  async function handleLocationYes() {
    setState('loading');
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      );
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setState('confirm');
    } catch {
      // 位置情報取得失敗 → 同意フラグだけ保存して続行
      setState('confirm');
    }
  }

  async function handleSubmit() {
    if (mapsConsent === null) return;
    setState('loading');
    try {
      const res = await api.post('/registration/location', {
        userId,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        locationConsent: true,
        mapsConsent,
      });
      const { accessToken, refreshToken, data } = res.data;
      saveAuth({
        accessToken,
        refreshToken,
        user: {
          id: data.userId,
          nickname: catCharacter,
          email: null,
          membershipTier: 'member',
          avatarUrl: null,
        },
      } as AuthResponse);
      setState('done');
      setTimeout(onNext, 2000);
    } catch {
      setState('error');
      setError('もう一回やってみるにゃん');
    }
  }

  async function handleSkip() {
    setState('loading');
    const res = await api.post('/registration/location', {
      userId, lat: null, lng: null, locationConsent: false, mapsConsent: false,
    });
    const { accessToken, refreshToken, data } = res.data;
    saveAuth({
      accessToken, refreshToken,
      user: { id: data.userId, nickname: catCharacter, email: null, membershipTier: 'member', avatarUrl: null },
    } as AuthResponse);
    onNext();
  }

  return (
    <div className="text-center px-4">
      <div className="text-5xl mb-4">📍</div>
      <p className="text-3xl font-bold text-gray-800 mb-2">{catCharacter}さん</p>

      {state === 'idle' && (
        <>
          <p className="text-2xl text-orange-600 leading-relaxed mb-8">
            美味しい店を教え合うために<br />場所を教えてもいいかにゃん？
          </p>
          <button
            onClick={handleLocationYes}
            className="w-full py-8 bg-orange-500 hover:bg-orange-600 text-white text-3xl font-bold rounded-3xl shadow-xl mb-4 transition-transform hover:scale-105 active:scale-95"
          >
            📍 いいよにゃん
          </button>
          <button
            onClick={handleSkip}
            className="w-full py-5 text-gray-400 text-xl border-2 border-gray-200 rounded-2xl"
          >
            今は難しいにゃん（スキップ）
          </button>
        </>
      )}

      {state === 'loading' && (
        <div className="py-8">
          <div className="text-6xl animate-bounce">🐱</div>
          <p className="mt-4 text-xl text-gray-500">確認しているにゃん…</p>
        </div>
      )}

      {state === 'confirm' && (
        <>
          <p className="text-2xl text-green-600 font-bold mb-6">
            場所を教えてくれてありがとうにゃん！
          </p>

          {/* Google Maps 同意 */}
          <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-5 mb-6 text-left">
            <p className="text-xl font-bold text-gray-800 mb-2">🗺️ Google マップ連動</p>
            <p className="text-lg text-gray-600 leading-relaxed">
              投稿した写真の場所を<br />
              <span className="font-bold text-orange-600">Google マップ</span>にも<br />
              登録してもいいかにゃん？
            </p>
          </div>

          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setMapsConsent(true)}
              className={`flex-1 py-6 rounded-2xl text-2xl font-bold transition-all ${
                mapsConsent === true
                  ? 'bg-green-500 text-white scale-105 shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-green-100'
              }`}
            >
              🗺️ いいよにゃん
            </button>
            <button
              onClick={() => setMapsConsent(false)}
              className={`flex-1 py-6 rounded-2xl text-2xl font-bold transition-all ${
                mapsConsent === false
                  ? 'bg-gray-400 text-white scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🙅 今はいいにゃん
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={mapsConsent === null}
            className="w-full py-7 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-2xl font-bold rounded-3xl shadow-xl transition-colors"
          >
            {mapsConsent === null ? '上のボタンを選んでにゃん' : '登録するにゃん！'}
          </button>
        </>
      )}

      {state === 'done' && (
        <div className="py-4">
          <div className="text-7xl mb-4">🎉</div>
          <p className="text-2xl text-green-600 font-bold">登録完了にゃん！</p>
        </div>
      )}

      {state === 'error' && (
        <div>
          <p className="text-xl text-red-500 mb-4">{error}</p>
          <button onClick={() => setState('confirm')} className="w-full py-6 bg-orange-500 text-white text-2xl font-bold rounded-2xl">
            もう一度にゃん
          </button>
        </div>
      )}
    </div>
  );
}
