'use client';
import { useState } from 'react';
import Header from '@/components/ui/Header';
import PostFeed from './PostFeed';
import PhotoPostFlow from '@/components/photo-post/PhotoPostFlow';

export default function HomePage() {
  const [showPhotoPost, setShowPhotoPost] = useState(false);

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto w-full px-4 py-6 flex-1">
        {/* ヒーロー */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🐱</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            ねこ寄り道
          </h1>
          <p className="text-gray-500 text-base">
            地元のご馳走・お福分け
          </p>
        </div>

        <PostFeed />
      </main>

      {/* 下部固定：投稿ボタン（写真📷 / 音声🎤） */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 items-end">
        <button
          onClick={() => setShowPhotoPost(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-green-500 hover:bg-green-600 text-white text-lg font-bold shadow-xl transition-transform hover:scale-110 active:scale-95"
          aria-label="写真を投稿する"
        >
          📷 写真で投稿
        </button>
        <a
          href="/posts/new"
          className="flex items-center justify-center w-16 h-16 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-3xl shadow-xl transition-transform hover:scale-110 active:scale-95"
          aria-label="音声で投稿する"
        >
          🎤
        </a>
      </div>

      {/* 写真投稿フロー（モーダル） */}
      {showPhotoPost && (
        <PhotoPostFlow
          onClose={() => setShowPhotoPost(false)}
        />
      )}
    </>
  );
}
