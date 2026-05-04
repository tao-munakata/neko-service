'use client';
import { useState, useRef } from 'react';
import api from '@/lib/api';

interface Props {
  userId: string;
  catCharacter: string;
  onNext: () => void;
}

export default function Step2Voice({ userId, catCharacter, onNext }: Props) {
  const [state, setState] = useState<'idle' | 'recording' | 'done' | 'error'>('idle');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  async function handleRecord() {
    const SR = (window as unknown as Record<string, unknown>).SpeechRecognition as (typeof SpeechRecognition) | undefined
      ?? (window as unknown as Record<string, unknown>).webkitSpeechRecognition as (typeof SpeechRecognition) | undefined;

    if (!SR) {
      // 音声APIなし → スキップ扱いで進む
      await api.post('/registration/voice', { userId, voiceRegistered: false });
      onNext();
      return;
    }

    const recognition = new SR();
    recognition.lang = 'ja-JP';
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => setState('recording');
    recognition.onresult = async () => {
      setState('done');
      await api.post('/registration/voice', { userId, voiceRegistered: true });
      setTimeout(onNext, 2000);
    };
    recognition.onerror = () => setState('error');
    recognition.start();
  }

  function stopRecording() {
    recognitionRef.current?.stop();
  }

  return (
    <div className="text-center px-4">
      <div className="text-5xl mb-4">🎤</div>
      <p className="text-3xl font-bold text-gray-800 mb-2">{catCharacter}さん</p>

      {state === 'idle' && (
        <>
          <p className="text-2xl text-orange-600 leading-relaxed mb-8">
            元気な声を聴かせてほしいにゃん
          </p>
          <button
            onClick={handleRecord}
            className="w-full py-8 bg-orange-500 hover:bg-orange-600 text-white text-3xl font-bold rounded-3xl shadow-xl transition-transform hover:scale-105 active:scale-95"
          >
            🎤 話すにゃん
          </button>
          <button
            onClick={async () => {
              await api.post('/registration/voice', { userId, voiceRegistered: false });
              onNext();
            }}
            className="mt-4 w-full py-5 text-gray-400 text-xl border-2 border-gray-200 rounded-2xl"
          >
            今は難しいにゃん（スキップ）
          </button>
        </>
      )}

      {state === 'recording' && (
        <>
          <p className="text-2xl text-red-500 font-bold mb-6 animate-pulse">
            聞こえているにゃん…話してほしいにゃん
          </p>
          <button
            onClick={stopRecording}
            className="w-full py-8 bg-red-500 text-white text-3xl font-bold rounded-3xl shadow-xl animate-pulse"
          >
            ⏹️ 止めるにゃん
          </button>
        </>
      )}

      {state === 'done' && (
        <>
          <div className="text-7xl mb-4 animate-bounce">😸</div>
          <p className="text-2xl text-green-600 font-bold">
            ありがとうにゃん！その声、ちゃんと覚えたにゃん！
          </p>
        </>
      )}

      {state === 'error' && (
        <>
          <p className="text-xl text-red-500 mb-4">もう一回やってみるにゃん</p>
          <button
            onClick={() => setState('idle')}
            className="w-full py-6 bg-orange-500 text-white text-2xl font-bold rounded-2xl"
          >
            もう一度にゃん
          </button>
        </>
      )}
    </div>
  );
}
