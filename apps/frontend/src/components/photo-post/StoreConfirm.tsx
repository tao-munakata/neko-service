'use client';
import { useState } from 'react';
import type { PlaceCandidate, SelectedStore } from './PhotoPostFlow';

interface Props {
  imagePreviewUrl: string | null;
  candidates: PlaceCandidate[];
  isSearching: boolean;
  onSelect: (store: SelectedStore | null) => void;
}

export default function StoreConfirm({ imagePreviewUrl, candidates, isSearching, onSelect }: Props) {
  const [showList, setShowList] = useState(false);
  const top = candidates[0] ?? null;

  function pick(c: PlaceCandidate) {
    onSelect({ placeId: c.placeId, name: c.name, address: c.address, mapsUrl: c.mapsUrl });
  }

  return (
    <div>
      {/* 写真プレビュー */}
      {imagePreviewUrl && (
        <img src={imagePreviewUrl} alt="投稿写真" className="w-full h-48 object-cover rounded-2xl mb-4" />
      )}

      {isSearching ? (
        <div className="text-center py-8">
          <div className="text-5xl animate-bounce mb-4">🐱</div>
          <p className="text-xl text-gray-500">美味しそうにゃん！どこのお店か今調べるにゃ！</p>
        </div>
      ) : top && !showList ? (
        /* トップ候補を提示 */
        <>
          <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-5 mb-5">
            <div className="flex items-start gap-3">
              <span className="text-4xl">🐱</span>
              <div>
                <p className="text-xl font-bold text-gray-800 mb-1">
                  「{top.name}」ですかにゃん？
                </p>
                <p className="text-base text-gray-500">{top.address}</p>
                {top.rating && (
                  <p className="text-sm text-orange-600 mt-1">⭐ {top.rating}</p>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => pick(top)}
            className="w-full py-7 bg-orange-500 hover:bg-orange-600 text-white text-2xl font-bold rounded-3xl shadow-xl mb-3 transition-colors"
          >
            そうですにゃん ✓
          </button>
          <button
            onClick={() => setShowList(true)}
            className="w-full py-5 border-2 border-gray-200 text-gray-600 text-xl rounded-2xl mb-3"
          >
            ちがいますにゃん
          </button>
          <button
            onClick={() => onSelect(null)}
            className="w-full py-5 border-2 border-gray-100 text-gray-400 text-lg rounded-2xl"
          >
            お店なしにゃん（スキップ）
          </button>
        </>
      ) : showList && candidates.length > 0 ? (
        /* 候補リスト */
        <>
          <p className="text-lg font-bold text-gray-700 mb-3">近くのお店を選んでほしいにゃん</p>
          <div className="space-y-3 mb-4">
            {candidates.map((c) => (
              <button
                key={c.placeId}
                onClick={() => pick(c)}
                className="w-full text-left p-4 border-2 border-gray-200 hover:border-orange-300 rounded-2xl transition-colors"
              >
                <p className="text-lg font-bold text-gray-800">{c.name}</p>
                <p className="text-sm text-gray-500">{c.address}</p>
              </button>
            ))}
          </div>
          <button
            onClick={() => onSelect(null)}
            className="w-full py-5 border-2 border-gray-100 text-gray-400 text-lg rounded-2xl"
          >
            お店なしにゃん（スキップ）
          </button>
        </>
      ) : (
        /* お店が見つからなかった場合 */
        <>
          <div className="text-center py-4 mb-4">
            <p className="text-xl text-gray-600">近くのお店が見つからなかったにゃん…</p>
          </div>
          <button
            onClick={() => onSelect(null)}
            className="w-full py-7 bg-orange-500 text-white text-2xl font-bold rounded-3xl shadow-xl"
          >
            そのまま続けるにゃん
          </button>
        </>
      )}
    </div>
  );
}
