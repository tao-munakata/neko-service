'use client';
import { useEffect } from 'react';

interface Props {
  onClose: () => void;
  uploadError?: boolean;
}

export default function PostComplete({ onClose, uploadError }: Props) {
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
      {uploadError && (
        <p className="text-sm text-orange-400 mt-4">写真の保存に失敗したにゃん。文章だけ投稿されたにゃん。</p>
      )}
      <p className="text-sm text-gray-400 mt-6">もうすぐ閉じるにゃん…</p>
    </div>
  );
}
