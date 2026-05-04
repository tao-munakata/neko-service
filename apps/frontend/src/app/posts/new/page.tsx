'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';
import VoicePostForm from '@/components/voice/VoicePostForm';
import { isLoggedIn } from '@/lib/auth';

export default function NewPostPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) router.push('/login');
  }, [router]);

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
        <VoicePostForm onSuccess={() => router.push('/')} />
      </main>
    </>
  );
}
