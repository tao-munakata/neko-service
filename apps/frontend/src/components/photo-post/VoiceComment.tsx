'use client';
import { useState, useRef } from 'react';
import api from '@/lib/api';

interface Props {
  storeName: string;
  onNext: (text: string) => void;
  onSkip: () => void;
}

type State = 'idle' | 'recording' | 'formatting' | 'done' | 'error';

export default function VoiceComment({ storeName, onNext, onSkip }: Props) {
  const [state, setState] = useState<State>('idle');
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null);

  function startRecording() {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SR) {
      onSkip();
      return;
    }

    const recognition = new SR();
    recognition.lang = 'ja-JP';
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => setState('recording');

    recognition.onresult = async (e: SpeechRecognitionEvent) => {
      const raw = e.results[0][0].transcript;
      setTranscript(raw);
      setState('formatting');

      try {
        const res = await api.post('/ai/format-review', { rawSpeech: raw, storeName });
        onNext(res.data.formatted ?? raw);
      } catch {
        onNext(raw); // 整形失敗はそのまま使う
      }
    };

    recognition.onerror = () => setState('error');
    recognition.start();
  }

  function stopRecording() {
    recognitionRef.current?.stop();
  }

  return (
    <div className="text-center px-2">
      <div className="text-5xl mb-4">🎤</div>
      <p className="text-2xl font-bold text-gray-800 mb-2">
        {storeName}はどうでしたかにゃん？
      </p>

      {state === 'idle' && (
        <>
          <p className="text-xl text-orange-600 mb-8">
            声でコメントを教えてほしいにゃん！
          </p>
          <button
            onClick={startRecording}
            className="w-full py-8 bg-orange-500 hover:bg-orange-600 text-white text-2xl font-bold rounded-3xl shadow-xl mb-4 transition-transform hover:scale-105 active:scale-95"
          >
            🎤 話すにゃん
          </button>
          <button
            onClick={onSkip}
            className="w-full py-5 border-2 border-gray-200 text-gray-400 text-xl rounded-2xl"
          >
            コメントはなしにゃん（スキップ）
          </button>
        </>
      )}

      {state === 'recording' && (
        <>
          <p className="text-xl text-red-500 font-bold mb-6 animate-pulse">
            聞こえているにゃん…話してほしいにゃん 🎵
          </p>
          <button
            onClick={stopRecording}
            className="w-full py-8 bg-red-500 text-white text-2xl font-bold rounded-3xl shadow-xl animate-pulse"
          >
            ⏹️ 止めるにゃん
          </button>
        </>
      )}

      {state === 'formatting' && (
        <div className="py-8">
          <div className="text-6xl animate-bounce mb-4">🐱</div>
          <p className="text-xl text-gray-500">コメントを整えているにゃん…</p>
          {transcript && (
            <p className="text-sm text-gray-400 mt-3 px-4">「{transcript}」</p>
          )}
        </div>
      )}

      {state === 'error' && (
        <>
          <p className="text-xl text-red-500 mb-4">もう一回やってみるにゃん</p>
          <button
            onClick={() => setState('idle')}
            className="w-full py-6 bg-orange-500 text-white text-2xl font-bold rounded-2xl mb-3"
          >
            もう一度にゃん
          </button>
          <button onClick={onSkip} className="w-full py-4 border-2 border-gray-200 text-gray-400 text-lg rounded-2xl">
            スキップするにゃん
          </button>
        </>
      )}
    </div>
  );
}
