'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { getDeviceId, getUserAgent } from '@/lib/device';
import { saveAuth } from '@/lib/auth';
import type { AuthResponse } from '@/types';

interface Props {
  onNext: (userId: string, catCharacter: string) => void;
  onAlreadyRegistered: () => void;
}

export default function Step1DeviceInit({ onNext, onAlreadyRegistered }: Props) {
  const [catCharacter, setCatCharacter] = useState('');
  const [nekoMessage, setNekoMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const fingerprint = getDeviceId();
        const ua = getUserAgent();
        const res = await api.post('/registration/init', {
          deviceFingerprint: fingerprint,
          userAgent: ua,
        });
        const { status, data, nekoMessage: msg, accessToken, refreshToken } = res.data;

        setNekoMessage(msg);

        if (status === 'already_registered' && accessToken) {
          // サイレントログイン完了
          saveAuth({ accessToken, refreshToken, user: { id: data.userId, nickname: data.nickname ?? data.catCharacter, email: null, membershipTier: 'member', avatarUrl: null } } as AuthResponse);
          onAlreadyRegistered();
          return;
        }

        setCatCharacter(data.catCharacter);
        setTimeout(() => onNext(data.userId, data.catCharacter), 3500);
      } catch {
        setError('もう一回やってみるにゃん');
        setLoading(false);
      }
    })();
  }, [onNext, onAlreadyRegistered]);

  return (
    <div className="text-center px-4">
      {loading && !error ? (
        <>
          <div className="text-8xl mb-6 animate-bounce">🐱</div>
          {catCharacter ? (
            <>
              <p className="text-3xl font-bold text-gray-800 mb-4">
                「{catCharacter}」
              </p>
              <p className="text-xl text-orange-600 leading-relaxed">{nekoMessage}</p>
              <p className="mt-6 text-gray-400 text-base">次のステップに進むにゃん…</p>
            </>
          ) : (
            <>
              <p className="text-2xl text-gray-600">君の名前を考えているにゃん…</p>
              <div className="mt-6 flex justify-center gap-2">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-3 h-3 rounded-full bg-orange-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <div>
          <div className="text-6xl mb-4">😿</div>
          <p className="text-xl text-red-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 w-full py-6 bg-orange-500 text-white text-2xl font-bold rounded-2xl"
          >
            もう一度やってみるにゃん
          </button>
        </div>
      )}
    </div>
  );
}
