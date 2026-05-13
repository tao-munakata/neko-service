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
  const [lineShareUrl, setLineShareUrl] = useState('https://social-plugins.line.me/lineit/share?url=https%3A%2F%2Fnyanko.fun');

  useEffect(() => {
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      setLineShareUrl('https://line.me/R/msg/text/?' + encodeURIComponent('https://nyanko.fun'));
    }
  }, []);

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
          <div className="flex items-center justify-center gap-2">
            <p className="text-gray-500 text-base">
              地元のご馳走・お福分け
            </p>
            <a
              href={lineShareUrl}
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
