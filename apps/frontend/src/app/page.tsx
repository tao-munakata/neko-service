'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';
import PostFeed from './PostFeed';
import PhotoPostFlow from '@/components/photo-post/PhotoPostFlow';
import { isLoggedIn, saveAuth } from '@/lib/auth';
import { getDeviceFingerprint, getUserAgent } from '@/lib/device';
import api from '@/lib/api';
import type { AuthResponse } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const [showPhotoPost, setShowPhotoPost] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) {
      setLoggedIn(true);
      setAuthChecked(true);
      return;
    }

    // 明示的にログアウトした場合は自動ログインしない
    if (sessionStorage.getItem('logged_out')) {
      setAuthChecked(true);
      return;
    }

    // 未ログインならデバイス指紋でサイレントログイン試行
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
          // 完全リロードでHeaderの状態を更新
          window.location.reload();
          return;
        }
      } catch { /* サイレント失敗はOK */ } finally {
        setAuthChecked(true);
      }
    })();
  }, [router]);

  function handlePostClick(type: 'photo' | 'voice') {
    if (!loggedIn) {
      router.push('/register');
      return;
    }
    if (type === 'photo') {
      setShowPhotoPost(true);
    } else {
      router.push('/posts/new');
    }
  }

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto w-full px-4 py-6 flex-1">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🐱</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            ねこ寄り道
          </h1>
          <p className="text-gray-500 text-base">
            地元のご馳走・お福分け
          </p>
          <p className="text-gray-300 text-xs mt-1">
            {process.env.NEXT_PUBLIC_APP_VERSION}
          </p>
        </div>

        <PostFeed />
      </main>

      {/* 下部固定：投稿ボタン（写真📷 / 音声🎤） */}
      {authChecked && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 items-end">
          <button
            onClick={() => handlePostClick('photo')}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-green-500 hover:bg-green-600 text-white text-lg font-bold shadow-xl transition-transform hover:scale-110 active:scale-95"
            aria-label="写真を投稿する"
          >
            📷 写真で投稿
          </button>
          <button
            onClick={() => handlePostClick('voice')}
            className="flex items-center justify-center w-16 h-16 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-3xl shadow-xl transition-transform hover:scale-110 active:scale-95"
            aria-label="音声で投稿する"
          >
            🎤
          </button>
        </div>
      )}

      {showPhotoPost && (
        <PhotoPostFlow
          onClose={() => setShowPhotoPost(false)}
        />
      )}
    </>
  );
}
