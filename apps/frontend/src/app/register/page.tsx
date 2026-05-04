'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { saveAuth } from '@/lib/auth';
import type { AuthResponse } from '@/types';

export default function RegisterPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post<AuthResponse>('/auth/register', { nickname, email, password });
      saveAuth(res.data);
      router.push('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || '登録できなかったにゃん。もう一度試してほしいにゃん。');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#fffdf7] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🐱</div>
          <h1 className="text-2xl font-bold text-gray-800">ねこ寄り道</h1>
          <p className="text-gray-500 mt-1">新しく登録するにゃん</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border-2 border-orange-100 p-6 flex flex-col gap-4">
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              ニックネーム
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
              maxLength={50}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-orange-400"
              placeholder="例：さばぞう"
            />
            <p className="text-xs text-gray-400 mt-1">本名でなくてもよいにゃん</p>
          </div>
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-orange-400"
              placeholder="example@email.com"
            />
          </div>
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-orange-400"
              placeholder="8文字以上"
            />
          </div>

          {error && <p className="text-red-500 text-base text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? '登録中にゃん…' : '登録するにゃん'}
          </button>
        </form>

        <p className="text-center mt-6 text-base text-gray-500">
          すでに登録済みの方は{' '}
          <Link href="/login" className="text-orange-500 font-bold hover:underline">
            ログインするにゃん
          </Link>
        </p>
      </div>
    </main>
  );
}
