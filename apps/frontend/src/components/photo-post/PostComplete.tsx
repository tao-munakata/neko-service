'use client';
import { useEffect } from 'react';

interface Props {
  onClose: () => void;
}

export default function PostComplete({ onClose }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="text-center py-8 px-4">
      <div className="text-8xl mb-6 animate-bounce">🎉</div>
      <p className="text-3xl font-bold text-gray-800 mb-3">投稿できたにゃん！</p>
      <p className="text-xl text-orange-600 leading-relaxed">
        みんなの役に立つにゃん！<br />
        ありがとうにゃん！
      </p>
      <p className="text-sm text-gray-400 mt-6">もうすぐ閉じるにゃん…</p>
    </div>
  );
}
