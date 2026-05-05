'use client';
import Link from 'next/link';
import { useState, useRef } from 'react';
import api from '@/lib/api';
import type { Post } from '@/types';

interface Props {
  post: Post;
}

const CATEGORY_EMOJI: Record<string, string> = {
  'showa-cafe': '☕',
  'fish-restaurant': '🐟',
};

function VoicePlayButton({ userId, nickname }: { userId: string; nickname: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function handlePlay(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (state === 'playing') {
      audioRef.current?.pause();
      setState('idle');
      return;
    }

    setState('loading');
    try {
      const res = await api.get(`/voice/user/${userId}`);
      const { presignedUrl } = res.data;
      const audio = new Audio(presignedUrl);
      audioRef.current = audio;
      audio.onended = () => setState('idle');
      audio.onerror = () => setState('error');
      await audio.play();
      setState('playing');
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 3000);
    }
  }

  if (state === 'error') {
    return (
      <span className="text-xs text-red-400 px-2">声が聞けないにゃん</span>
    );
  }

  return (
    <button
      onClick={handlePlay}
      className={`flex items-center gap-1 text-sm px-3 py-1 rounded-full transition-colors ${
        state === 'playing'
          ? 'bg-orange-500 text-white'
          : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
      }`}
    >
      {state === 'loading' && <span className="animate-spin text-xs">⏳</span>}
      {state === 'playing' ? '⏸️' : '🔊'}
      <span className="hidden sm:inline">
        {state === 'playing' ? '再生中にゃん' : `${nickname}ちゃんの声を聞くにゃん`}
      </span>
    </button>
  );
}

export default function PostCard({ post }: Props) {
  const emoji = post.category ? (CATEGORY_EMOJI[post.category.slug] ?? '📝') : '📝';
  const isQuestion = post.postType === 'question';
  const hasVoice = post.user?.voiceRegistered === true;

  return (
    <Link href={`/posts/${post.id}`} className="block">
      <article className={`
        bg-white rounded-2xl shadow-sm border-2 p-5 hover:shadow-md transition-shadow cursor-pointer
        ${isQuestion ? 'border-orange-200' : 'border-green-200'}
      `}>
        {/* カテゴリ・種別バッジ */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {post.category && (
            <span className="text-sm bg-orange-50 text-orange-700 px-3 py-1 rounded-full font-medium">
              {emoji} {post.category.name}
            </span>
          )}
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${
            isQuestion
              ? 'bg-blue-50 text-blue-700'
              : 'bg-green-50 text-green-700'
          }`}>
            {isQuestion ? '🍽️ 教えてほしいにゃん' : '😸 自慢の一枚にゃん'}
          </span>
          {post.locationText && (
            <span className="text-sm text-gray-500">📍 {post.locationText}</span>
          )}
        </div>

        {/* 投稿テキスト */}
        <p className="text-lg text-gray-800 leading-relaxed mb-3 line-clamp-3">
          {post.nekoText}
        </p>

        {/* 画像 */}
        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt="投稿画像"
            className="w-full h-48 object-cover rounded-xl mb-3"
          />
        )}

        {/* お店情報（v1.7） */}
        {post.storeName && (
          <div className="flex items-center gap-2 bg-green-50 rounded-xl px-3 py-2 mb-3 flex-wrap">
            <span className="text-sm font-bold text-green-700">📍 {post.storeName}</span>
            {post.rating && (
              <span className="text-sm text-yellow-600">{'⭐'.repeat(post.rating)}</span>
            )}
            {post.googleMapsUrl && (
              <a
                href={post.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-blue-500 underline"
              >
                地図を見るにゃん
              </a>
            )}
          </div>
        )}

        {/* 投稿者・日時・声再生 */}
        <div className="flex items-center justify-between text-sm text-gray-400 flex-wrap gap-2">
          <span className="font-medium text-gray-600">
            🐱 {post.user?.nickname ?? '名無しにゃん'}
          </span>
          <div className="flex items-center gap-2">
            {hasVoice && post.user && (
              <VoicePlayButton
                userId={post.user.id}
                nickname={post.user.nickname}
              />
            )}
            <time>{new Date(post.createdAt).toLocaleDateString('ja-JP')}</time>
          </div>
        </div>
      </article>
    </Link>
  );
}
