'use client';
import Link from 'next/link';
import type { Post } from '@/types';

interface Props {
  post: Post;
}

const CATEGORY_EMOJI: Record<string, string> = {
  'showa-cafe': '☕',
  'fish-restaurant': '🐟',
};

export default function PostCard({ post }: Props) {
  const emoji = post.category ? (CATEGORY_EMOJI[post.category.slug] ?? '📝') : '📝';
  const isQuestion = post.postType === 'question';

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

        {/* 投稿者・日時 */}
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span className="font-medium text-gray-600">
            🐱 {post.user?.nickname ?? '名無しにゃん'}
          </span>
          <time>{new Date(post.createdAt).toLocaleDateString('ja-JP')}</time>
        </div>
      </article>
    </Link>
  );
}
