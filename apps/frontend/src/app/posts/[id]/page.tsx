'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';
import PostCard from '@/components/post/PostCard';
import VoicePostForm from '@/components/voice/VoicePostForm';
import api from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';
import type { Post } from '@/types';

const REACTION_LABELS: Record<string, string> = {
  thanks: '🙏 ありがとうにゃん',
  helpful: '👍 参考になったにゃん',
  went_there: '🐾 行ってきたにゃん',
};

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [answers, setAnswers] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [reacting, setReacting] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);

  async function fetchData() {
    try {
      const [postRes, answersRes] = await Promise.all([
        api.get<Post>(`/posts/${id}`),
        api.get<Post[]>(`/posts/${id}/answers`),
      ]);
      setPost(postRes.data);
      setAnswers(answersRes.data);
    } catch {
      router.push('/');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, [id]);

  async function handleReaction(type: string) {
    if (!isLoggedIn()) { router.push('/login'); return; }
    if (reacting) return;
    setReacting(true);
    try {
      await api.post(`/posts/${id}/reactions`, { type });
    } catch { /* 重複は無視 */ } finally {
      setReacting(false);
    }
  }

  if (loading) return (
    <>
      <Header />
      <div className="text-center py-24">
        <div className="text-4xl animate-bounce">🐱</div>
        <p className="mt-3 text-gray-400 text-lg">読み込んでいるにゃん…</p>
      </div>
    </>
  );

  if (!post) return null;

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto w-full px-4 py-6 flex-1">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-1 text-base"
        >
          ← 戻る
        </button>

        {/* 元投稿 */}
        <PostCard post={post} />

        {/* リアクションボタン */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {Object.entries(REACTION_LABELS).map(([type, label]) => (
            <button
              key={type}
              onClick={() => handleReaction(type)}
              disabled={reacting}
              className="flex-1 py-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-medium text-sm transition-colors disabled:opacity-50"
            >
              {label}
            </button>
          ))}
        </div>

        {/* 回答一覧 */}
        {answers.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-gray-700 mb-4">
              😸 {answers.length}件の回答にゃん
            </h2>
            <div className="flex flex-col gap-4">
              {answers.map((answer) => (
                <PostCard key={answer.id} post={answer} />
              ))}
            </div>
          </div>
        )}

        {/* 回答フォーム */}
        {post.postType === 'question' && (
          <div className="mt-8">
            {!showReplyForm ? (
              <button
                onClick={() => {
                  if (!isLoggedIn()) { router.push('/login'); return; }
                  setShowReplyForm(true);
                }}
                className="w-full py-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-lg transition-colors"
              >
                😸 教えてあげるにゃん
              </button>
            ) : (
              <VoicePostForm
                parentPostId={id}
                defaultPostType="answer"
                onSuccess={() => { setShowReplyForm(false); fetchData(); }}
              />
            )}
          </div>
        )}
      </main>
    </>
  );
}
