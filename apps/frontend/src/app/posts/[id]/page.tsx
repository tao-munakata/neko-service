'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';
import PostCard from '@/components/post/PostCard';
import VoicePostForm from '@/components/voice/VoicePostForm';
import api from '@/lib/api';
import { isLoggedIn, saveAuth } from '@/lib/auth';
import { getDeviceId, getUserAgent } from '@/lib/device';
import type { Post, AuthResponse } from '@/types';

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
  const [reactedTypes, setReactedTypes] = useState<Set<string>>(new Set());
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({ thanks: 0, helpful: 0, went_there: 0 });
  const [showReplyForm, setShowReplyForm] = useState(false);

  async function fetchData() {
    try {
      const [postRes, answersRes, countsRes] = await Promise.all([
        api.get<Post>(`/posts/${id}`),
        api.get<Post[]>(`/posts/${id}/answers`),
        api.get<Record<string, number>>(`/posts/${id}/reactions`),
      ]);
      setPost(postRes.data);
      setAnswers(answersRes.data);
      setReactionCounts(countsRes.data);
    } catch {
      router.push('/');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, [id]);

  async function ensureLoggedIn(): Promise<boolean> {
    if (isLoggedIn()) return true;
    try {
      const fingerprint = getDeviceId();
      const ua = getUserAgent();
      const res = await api.post('/registration/init', { deviceFingerprint: fingerprint, userAgent: ua });
      const { status, data, accessToken, refreshToken } = res.data;
      if (status === 'already_registered' && accessToken) {
        saveAuth({ accessToken, refreshToken, user: { id: data.userId, nickname: data.nickname ?? data.catCharacter, email: null, membershipTier: 'member', avatarUrl: null } } as AuthResponse);
        return true;
      }
      router.push('/register');
      return false;
    } catch {
      router.push('/login');
      return false;
    }
  }

  async function handleReaction(type: string) {
    if (reacting || reactedTypes.has(type)) return;
    if (!await ensureLoggedIn()) return;
    setReacting(true);
    try {
      await api.post(`/posts/${id}/reactions`, { type });
      setReactedTypes(prev => new Set([...prev, type]));
      setReactionCounts(prev => ({ ...prev, [type]: (prev[type] ?? 0) + 1 }));
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
          {Object.entries(REACTION_LABELS).map(([type, label]) => {
            const reacted = reactedTypes.has(type);
            const count = reactionCounts[type] ?? 0;
            return (
              <button
                key={type}
                onClick={() => handleReaction(type)}
                disabled={reacting || reacted}
                className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all ${
                  reacted
                    ? 'bg-orange-500 text-white scale-95'
                    : 'bg-orange-50 hover:bg-orange-100 text-orange-700'
                } disabled:cursor-default`}
              >
                <div>{reacted ? '✓ 送ったにゃん' : label}</div>
                {count > 0 && (
                  <div className={`text-xs mt-0.5 ${reacted ? 'text-orange-100' : 'text-orange-400'}`}>
                    {count}にゃん
                  </div>
                )}
              </button>
            );
          })}
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
                onClick={async () => {
                  if (!await ensureLoggedIn()) return;
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
