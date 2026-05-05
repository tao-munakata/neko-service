'use client';
import { useState } from 'react';
import type { SelectedStore } from './PhotoPostFlow';

interface Props {
  imagePreviewUrl: string | null;
  store: SelectedStore | null;
  reviewText: string;
  rating: number;
  onChangeText: (t: string) => void;
  onChangeRating: (r: number) => void;
  onPost: () => Promise<void>;
  onBack: () => void;
}

export default function ReviewConfirm({
  imagePreviewUrl, store, reviewText, rating,
  onChangeText, onChangeRating, onPost, onBack,
}: Props) {
  const [isPosting, setIsPosting] = useState(false);

  async function handlePost() {
    setIsPosting(true);
    try {
      await onPost();
    } finally {
      setIsPosting(false);
    }
  }

  return (
    <div>
      {/* 写真プレビュー */}
      {imagePreviewUrl && (
        <img src={imagePreviewUrl} alt="投稿写真" className="w-full h-40 object-cover rounded-2xl mb-4" />
      )}

      {/* お店情報 */}
      {store && (
        <div className="bg-orange-50 rounded-xl p-3 mb-4">
          <p className="text-base font-bold text-gray-800">📍 {store.name}</p>
          <p className="text-sm text-gray-500">{store.address}</p>
        </div>
      )}

      {/* 星評価 */}
      <div className="flex justify-center gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onChangeRating(star)}
            className={`text-4xl transition-transform hover:scale-110 ${star <= rating ? 'opacity-100' : 'opacity-30'}`}
          >
            ⭐
          </button>
        ))}
      </div>

      {/* コメント編集 */}
      <div className="mb-5">
        <p className="text-base font-bold text-gray-700 mb-2">コメント</p>
        <textarea
          value={reviewText}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder="コメントを入力にゃん（任意）"
          className="w-full border-2 border-gray-200 rounded-2xl p-4 text-lg resize-none focus:border-orange-300 focus:outline-none"
          rows={4}
          style={{ fontSize: '18px' }}
        />
      </div>

      <button
        onClick={handlePost}
        disabled={isPosting}
        className="w-full py-7 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 text-white text-2xl font-bold rounded-3xl shadow-xl mb-3 transition-colors"
      >
        {isPosting ? '投稿しているにゃん…' : 'これでいいにゃん！'}
      </button>
      <button
        onClick={onBack}
        className="w-full py-4 border-2 border-gray-200 text-gray-500 text-lg rounded-2xl"
      >
        なおしたいにゃん
      </button>
    </div>
  );
}
