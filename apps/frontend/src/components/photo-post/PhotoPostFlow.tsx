'use client';
import { useState, useRef } from 'react';
import api from '@/lib/api';
import StoreConfirm from './StoreConfirm';
import VoiceComment from './VoiceComment';
import ReviewConfirm from './ReviewConfirm';
import PostComplete from './PostComplete';

export interface PlaceCandidate {
  placeId: string;
  name: string;
  address: string;
  mapsUrl: string;
  rating: number | null;
}

export interface SelectedStore {
  placeId: string;
  name: string;
  address: string;
  mapsUrl: string;
}

type Step = 'photo' | 'store' | 'voice' | 'review' | 'done';

interface Props {
  categoryId?: number;
  onClose: () => void;
}

async function extractGps(file: File): Promise<{ lat: number; lng: number } | null> {
  try {
    // Dynamic import to avoid SSR issues
    const exifr = (await import('exifr')).default;
    const gps = await exifr.gps(file);
    if (gps?.latitude && gps?.longitude) {
      return { lat: gps.latitude, lng: gps.longitude };
    }
  } catch { /* ignore */ }
  return null;
}

async function getCurrentGps(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 8000 },
    );
  });
}

export default function PhotoPostFlow({ categoryId, onClose }: Props) {
  const [step, setStep] = useState<Step>('photo');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<PlaceCandidate[]>([]);
  const [selectedStore, setSelectedStore] = useState<SelectedStore | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(categoryId ?? 1);
  const [isSearching, setIsSearching] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(file: File) {
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setIsSearching(true);
    setStep('store');

    // ExifからGPS取得、なければ現在地
    let gps = await extractGps(file);
    if (!gps) gps = await getCurrentGps();

    if (gps) {
      try {
        const res = await api.post('/places/nearby', { lat: gps.lat, lng: gps.lng });
        setCandidates(res.data.candidates ?? []);
      } catch { /* ignore */ }
    }
    setIsSearching(false);
  }

  function handleStoreSelected(store: SelectedStore | null) {
    setSelectedStore(store);
    setStep('voice');
  }

  function handleVoiceComment(text: string) {
    setReviewText(text);
    setStep('review');
  }

  async function handlePost() {
    if (!imageFile) return;

    // 画像をMinIOにアップロード
    let imageUrl: string | null = null;
    try {
      const form = new FormData();
      form.append('image', imageFile);
      const uploadRes = await api.post('/posts/upload-image', form);
      imageUrl = uploadRes.data.imageUrl;
    } catch {
      setUploadError(true);
      /* 画像なしで続行 */
    }

    const rawText = reviewText.trim() ||
      (selectedStore ? `${selectedStore.name}に行ってきたにゃん` : '美味しいお店に行ってきたにゃん');

    await api.post('/posts', {
      postType: 'answer',
      rawText,
      categoryId: selectedCategoryId,
      imageUrl,
      storeId: selectedStore?.placeId ?? null,
      storeName: selectedStore?.name ?? null,
      storeAddress: selectedStore?.address ?? null,
      googleMapsUrl: selectedStore?.mapsUrl ?? null,
      rating,
      affiliateFlag: false,
    });

    setStep('done');
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center sm:items-center">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="text-lg font-bold text-gray-800">
            {step === 'photo' && '📷 写真を選ぶにゃん'}
            {step === 'store' && '📍 お店の確認にゃん'}
            {step === 'voice' && '🎤 コメントにゃん'}
            {step === 'review' && '✅ 確認にゃん'}
            {step === 'done' && '🎉 完了にゃん'}
          </p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="p-5">
          {/* STEP: 写真選択 */}
          {step === 'photo' && (
            <div className="text-center">
              <div className="text-6xl mb-4">📷</div>
              <p className="text-2xl text-orange-600 font-bold mb-6">
                美味しそうな写真を見せてほしいにゃん！
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 bg-orange-500 hover:bg-orange-600 text-white text-2xl font-bold rounded-3xl shadow-xl mb-4 transition-transform hover:scale-105 active:scale-95"
              >
                📸 写真を撮るにゃん
              </button>
              <label className="w-full py-5 border-2 border-orange-300 text-orange-600 text-xl font-bold rounded-2xl cursor-pointer flex items-center justify-center">
                🖼️ ライブラリから選ぶにゃん
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />
              </label>
            </div>
          )}

          {/* STEP: お店確認 */}
          {step === 'store' && (
            <StoreConfirm
              imagePreviewUrl={imagePreviewUrl}
              candidates={candidates}
              isSearching={isSearching}
              onSelect={handleStoreSelected}
            />
          )}

          {/* STEP: 音声コメント */}
          {step === 'voice' && (
            <VoiceComment
              storeName={selectedStore?.name ?? 'このお店'}
              onNext={handleVoiceComment}
              onSkip={() => { setReviewText(''); setStep('review'); }}
            />
          )}

          {/* STEP: 確認・編集 */}
          {step === 'review' && (
            <ReviewConfirm
              imagePreviewUrl={imagePreviewUrl}
              store={selectedStore}
              reviewText={reviewText}
              rating={rating}
              categoryId={selectedCategoryId}
              onChangeText={setReviewText}
              onChangeRating={setRating}
              onChangeCategoryId={setSelectedCategoryId}
              onPost={handlePost}
              onBack={() => setStep('voice')}
            />
          )}

          {/* STEP: 完了 */}
          {step === 'done' && (
            <PostComplete onClose={onClose} uploadError={uploadError} />
          )}
        </div>
      </div>
    </div>
  );
}
