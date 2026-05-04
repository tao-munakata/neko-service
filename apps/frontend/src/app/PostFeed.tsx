'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import PostCard from '@/components/post/PostCard';
import type { Post, PostsResponse } from '@/types';

const CATEGORIES = [
  { id: 0, name: 'すべて', emoji: '🐱' },
  { id: 1, name: '昭和の喫茶店', emoji: '☕' },
  { id: 2, name: '魚の旨い店', emoji: '🐟' },
];

export default function PostFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [categoryId, setCategoryId] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (categoryId > 0) params.categoryId = String(categoryId);

    api.get<PostsResponse>('/posts', { params })
      .then((res) => {
        setPosts(res.data.posts);
        setTotal(res.data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [categoryId]);

  return (
    <div>
      {/* カテゴリフィルタ */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryId(cat.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full font-medium text-base transition-colors ${
              categoryId === cat.id
                ? 'bg-orange-500 text-white'
                : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-orange-300'
            }`}
          >
            {cat.emoji} {cat.name}
          </button>
        ))}
      </div>

      {/* 投稿一覧 */}
      {loading ? (
        <div className="text-center py-16">
          <div className="text-4xl animate-bounce">🐱</div>
          <p className="mt-3 text-gray-400 text-lg">読み込んでいるにゃん…</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl">😿</div>
          <p className="mt-3 text-gray-400 text-lg">まだ投稿がないにゃん</p>
          <a
            href="/posts/new"
            className="mt-4 inline-block px-8 py-3 bg-orange-500 text-white rounded-full font-bold text-lg"
          >
            最初に投稿するにゃん
          </a>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-4">{total}件の投稿にゃん</p>
          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
