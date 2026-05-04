'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  catCharacter: string;
}

export default function Step4Complete({ catCharacter }: Props) {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.push('/'), 4000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="text-center px-4 py-8">
      <div className="text-8xl mb-6 animate-bounce">🎉</div>
      <p className="text-4xl font-bold text-gray-800 mb-4">
        ようこそにゃん！
      </p>
      <p className="text-2xl text-orange-600 font-bold mb-2">
        「{catCharacter}」
      </p>
      <p className="text-xl text-gray-600 leading-relaxed mb-8">
        これからよろしくにゃん！<br />
        美味しいお店をたくさん教えてほしいにゃん！
      </p>
      <div className="bg-orange-50 rounded-2xl p-5 text-left">
        <p className="text-lg text-orange-700 font-bold mb-2">🐱 使い方のヒントにゃん</p>
        <ul className="text-base text-gray-600 space-y-2">
          <li>🎤 右下のマイクボタンで投稿できるにゃん</li>
          <li>🐟 美味しいお店を写真付きで教えてほしいにゃん</li>
          <li>📍 場所も教えてくれると地図に載るにゃん</li>
        </ul>
      </div>
      <p className="mt-6 text-gray-400 text-base">もうすぐトップページに移動するにゃん…</p>
    </div>
  );
}
