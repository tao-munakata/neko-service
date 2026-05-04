'use client';
import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

type Step = 'idle' | 'recording' | 'preview' | 'posting' | 'done';
type PostType = 'question' | 'answer';

interface Props {
  parentPostId?: string;
  defaultPostType?: PostType;
  onSuccess?: () => void;
}

const CATEGORIES = [
  { id: 1, name: '昭和の喫茶店', emoji: '☕' },
  { id: 2, name: '魚の旨い店', emoji: '🐟' },
];

export default function VoicePostForm({ parentPostId, defaultPostType = 'question', onSuccess }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('idle');
  const [postType, setPostType] = useState<PostType>(defaultPostType);
  const [rawText, setRawText] = useState('');
  const [nekoText, setNekoText] = useState('');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [locationText, setLocationText] = useState('');
  const [error, setError] = useState('');

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startRecording = useCallback(() => {
    setError('');
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: typeof globalThis.SpeechRecognition; webkitSpeechRecognition?: typeof globalThis.SpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: typeof globalThis.SpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('このブラウザは音声入力に対応していないにゃん。テキストで入力してほしいにゃん。');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setStep('recording');

    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      setRawText(text);
      setStep('preview');
      try {
        const res = await api.post('/voice/neko-convert', { text });
        setNekoText(res.data.nekoText);
      } catch {
        setNekoText(text);
      }
    };

    recognition.onerror = () => {
      setStep('idle');
      setError('もう一度話しかけてみてほしいにゃん');
    };

    recognition.onend = () => {
      if (step === 'recording') setStep('idle');
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [step]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  async function handlePost() {
    if (!nekoText.trim()) return;
    setStep('posting');
    setError('');
    try {
      await api.post('/posts', {
        postType,
        parentPostId: parentPostId ?? undefined,
        rawText,
        categoryId,
        locationText: locationText || undefined,
        layer: 'yorimichi',
      });
      setStep('done');
      onSuccess?.();
      router.refresh();
    } catch {
      setStep('preview');
      setError('投稿できなかったにゃん。もう一度試してほしいにゃん。');
    }
  }

  function handleReset() {
    setStep('idle');
    setRawText('');
    setNekoText('');
    setError('');
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-orange-200 p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-5">
        {postType === 'question' ? '🍽️ 聞いてみるにゃん' : '😸 教えてあげるにゃん'}
      </h2>

      {/* 投稿タイプ切替 */}
      {!parentPostId && (
        <div className="flex gap-3 mb-5">
          {(['question', 'answer'] as PostType[]).map((type) => (
            <button
              key={type}
              onClick={() => setPostType(type)}
              className={`flex-1 py-3 rounded-xl font-bold text-base transition-colors ${
                postType === type
                  ? 'bg-orange-500 text-white'
                  : 'bg-orange-50 text-orange-500 hover:bg-orange-100'
              }`}
            >
              {type === 'question' ? '🍽️ 教えてほしい' : '😸 教えてあげる'}
            </button>
          ))}
        </div>
      )}

      {/* カテゴリ選択 */}
      <div className="flex gap-3 mb-5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryId(cat.id)}
            className={`flex-1 py-3 rounded-xl font-medium text-base transition-colors ${
              categoryId === cat.id
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.emoji} {cat.name}
          </button>
        ))}
      </div>

      {/* 地域入力 */}
      <input
        type="text"
        value={locationText}
        onChange={(e) => setLocationText(e.target.value)}
        placeholder="地域名（例：渋谷、築地）"
        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base mb-5 focus:outline-none focus:border-orange-400"
      />

      {/* STEP1：マイクボタン */}
      {step === 'idle' && (
        <div className="text-center">
          <button
            onClick={startRecording}
            className="w-32 h-32 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-5xl shadow-lg transition-transform hover:scale-105 active:scale-95 mx-auto block"
            aria-label="音声入力を開始する"
          >
            🎤
          </button>
          <p className="mt-4 text-gray-500 text-lg">ボタンを押して話しかけるにゃん</p>

          {/* テキスト入力フォールバック */}
          <details className="mt-4 text-left">
            <summary className="text-sm text-gray-400 cursor-pointer">テキストで入力する</summary>
            <div className="mt-3">
              <textarea
                rows={3}
                placeholder="ここに入力してほしいにゃん"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-orange-400"
                onChange={(e) => {
                  setRawText(e.target.value);
                  setNekoText(e.target.value);
                }}
              />
              {rawText && (
                <button
                  onClick={() => setStep('preview')}
                  className="mt-2 w-full bg-orange-500 text-white py-3 rounded-xl font-bold text-lg"
                >
                  確認するにゃん
                </button>
              )}
            </div>
          </details>
        </div>
      )}

      {/* STEP2：録音中 */}
      {step === 'recording' && (
        <div className="text-center">
          <button
            onClick={stopRecording}
            className="w-32 h-32 rounded-full bg-red-500 hover:bg-red-600 text-white text-5xl shadow-lg animate-pulse mx-auto block"
            aria-label="録音を停止する"
          >
            ⏹️
          </button>
          <p className="mt-4 text-red-500 text-lg font-bold">話してほしいにゃん…</p>
          <p className="text-sm text-gray-400 mt-1">止めるときはボタンをタップ</p>
        </div>
      )}

      {/* STEP3：確認 */}
      {step === 'preview' && (
        <div>
          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-orange-600 font-medium mb-2">🐱 ネコ語に変換されたにゃん</p>
            <p className="text-lg text-gray-800 leading-relaxed">{nekoText}</p>
          </div>
          <textarea
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base mb-4 focus:outline-none focus:border-orange-400"
            rows={3}
            value={nekoText}
            onChange={(e) => setNekoText(e.target.value)}
          />
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 py-4 rounded-xl border-2 border-gray-300 text-gray-600 font-bold text-lg hover:bg-gray-50"
            >
              やり直すにゃん
            </button>
            <button
              onClick={handlePost}
              className="flex-1 py-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg transition-colors"
            >
              投稿するにゃん
            </button>
          </div>
        </div>
      )}

      {/* STEP4：投稿中 */}
      {step === 'posting' && (
        <div className="text-center py-8">
          <div className="text-5xl animate-bounce">🐱</div>
          <p className="mt-4 text-gray-500 text-lg">投稿しているにゃん…</p>
        </div>
      )}

      {/* STEP5：完了 */}
      {step === 'done' && (
        <div className="text-center py-8">
          <div className="text-5xl">😸</div>
          <p className="mt-4 text-gray-800 text-xl font-bold">投稿できたにゃん！</p>
          <button
            onClick={handleReset}
            className="mt-4 px-8 py-3 bg-orange-500 text-white rounded-full font-bold text-lg"
          >
            続けて投稿するにゃん
          </button>
        </div>
      )}

      {error && (
        <p className="mt-4 text-red-500 text-center text-base">{error}</p>
      )}
    </div>
  );
}
