'use client';
import { useEffect } from 'react';

interface Props {
  onClose: () => void;
  uploadError?: boolean;
  mapsUrl?: string;
  storeName?: string;
}

export default function PostComplete({ onClose, uploadError, mapsUrl, storeName }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, 8000);
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

      {mapsUrl && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 w-full py-5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-xl font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-colors"
        >
          🗺️ Google Mapsにも写真を投稿する
        </a>
      )}
      {mapsUrl && storeName && (
        <p className="text-sm text-gray-400 mt-2">{storeName}のページが開くにゃん</p>
      )}

      <p className="text-sm text-gray-400 mt-6">もうすぐ閉じるにゃん…</p>
    </div>
  );
}
