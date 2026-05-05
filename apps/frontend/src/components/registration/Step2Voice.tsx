'use client';
import { useState, useRef, useCallback } from 'react';
import api from '@/lib/api';

interface Props {
  userId: string;
  catCharacter: string;
  onNext: () => void;
}

type State = 'idle' | 'recording' | 'preview' | 'uploading' | 'done' | 'error';

// Autocorrelation pitch detector — returns F0 in Hz or null
function detectF0(channelData: Float32Array, sampleRate: number): number | null {
  const SIZE = Math.min(channelData.length, sampleRate * 2);
  let sumSq = 0;
  for (let i = 0; i < SIZE; i++) sumSq += channelData[i] ** 2;
  const rms = Math.sqrt(sumSq / SIZE);
  if (rms < 0.005) return null; // Too quiet

  const r0 = sumSq / SIZE;
  const minPeriod = Math.floor(sampleRate / 500);
  const maxPeriod = Math.floor(sampleRate / 60);
  let bestPeriod = -1;
  let bestR = 0;

  for (let T = minPeriod; T <= maxPeriod; T++) {
    let r = 0;
    const n = SIZE - T;
    for (let i = 0; i < n; i++) r += channelData[i] * channelData[i + T];
    const rNorm = (r / n) / r0;
    if (rNorm > bestR) { bestR = rNorm; bestPeriod = T; }
  }

  if (bestR < 0.25 || bestPeriod === -1) return null;
  return sampleRate / bestPeriod;
}

async function estimateGender(blob: Blob): Promise<'male' | 'female' | 'unknown'> {
  try {
    const arrayBuf = await blob.arrayBuffer();
    const ctx = new AudioContext();
    const audioBuf = await ctx.decodeAudioData(arrayBuf);
    await ctx.close();
    const f0 = detectF0(audioBuf.getChannelData(0), audioBuf.sampleRate);
    if (f0 === null) return 'unknown';
    return f0 < 155 ? 'male' : 'female';
  } catch {
    return 'unknown';
  }
}

function getSupportedMimeType(): string {
  const types = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/webm'];
  return types.find(t => MediaRecorder.isTypeSupported(t)) ?? '';
}

const MAX_RECORD_MS = 8000;

export default function Step2Voice({ userId, catCharacter, onNext }: Props) {
  const [state, setState] = useState<State>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    recorderRef.current?.stop();
  }, []);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setState('preview');
      };

      recorder.start(200);
      setState('recording');

      // Auto-stop after MAX_RECORD_MS
      timerRef.current = setTimeout(stopRecording, MAX_RECORD_MS);
    } catch {
      setErrorMsg('マイクにアクセスできないにゃん。設定を確認してほしいにゃん');
      setState('error');
    }
  }

  async function handleConfirm() {
    if (!audioBlob) return;
    setState('uploading');
    try {
      const gender = await estimateGender(audioBlob);
      const form = new FormData();
      form.append('userId', userId);
      form.append('voiceGender', gender);
      form.append('audio', audioBlob, 'voice.webm');
      await api.post('/voice/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setState('done');
      setTimeout(onNext, 2000);
    } catch {
      setErrorMsg('保存に失敗したにゃん。もう一度やってほしいにゃん');
      setState('error');
    }
  }

  function handleRetry() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setState('idle');
  }

  async function handleSkip() {
    await api.post('/registration/voice', { userId, voiceRegistered: false });
    onNext();
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
            onClick={startRecording}
            className="w-full py-8 bg-orange-500 hover:bg-orange-600 text-white text-3xl font-bold rounded-3xl shadow-xl mb-4 transition-transform hover:scale-105 active:scale-95"
          >
            🎤 話すにゃん
          </button>
          <button
            onClick={handleSkip}
            className="w-full py-5 text-gray-400 text-xl border-2 border-gray-200 rounded-2xl"
          >
            今は難しいにゃん（スキップ）
          </button>
        </>
      )}

      {state === 'recording' && (
        <>
          <p className="text-2xl text-red-500 font-bold mb-6 animate-pulse">
            聞こえているにゃん…話してほしいにゃん🎵
          </p>
          <p className="text-base text-gray-400 mb-4">8秒録音するにゃん</p>
          <button
            onClick={stopRecording}
            className="w-full py-8 bg-red-500 text-white text-3xl font-bold rounded-3xl shadow-xl animate-pulse"
          >
            ⏹️ 止めるにゃん
          </button>
        </>
      )}

      {state === 'preview' && audioUrl && (
        <>
          <p className="text-2xl text-orange-600 font-bold mb-4">
            録れたにゃん！聞いてみるにゃん
          </p>
          <audio
            controls
            src={audioUrl}
            className="w-full mb-6 rounded-xl"
          />
          <button
            onClick={handleConfirm}
            className="w-full py-7 bg-orange-500 hover:bg-orange-600 text-white text-2xl font-bold rounded-3xl shadow-xl mb-3 transition-colors"
          >
            🐱 この声で登録するにゃん！
          </button>
          <button
            onClick={handleRetry}
            className="w-full py-5 text-gray-500 text-xl border-2 border-gray-200 rounded-2xl"
          >
            🔄 もう一度録るにゃん
          </button>
        </>
      )}

      {state === 'uploading' && (
        <div className="py-8">
          <div className="text-6xl animate-bounce">🐱</div>
          <p className="mt-4 text-xl text-gray-500">声を覚えているにゃん…</p>
        </div>
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
          <p className="text-xl text-red-500 mb-4">{errorMsg}</p>
          <button
            onClick={handleRetry}
            className="w-full py-6 bg-orange-500 text-white text-2xl font-bold rounded-2xl mb-3"
          >
            もう一度にゃん
          </button>
          <button
            onClick={handleSkip}
            className="w-full py-4 text-gray-400 text-lg border-2 border-gray-200 rounded-2xl"
          >
            スキップするにゃん
          </button>
        </>
      )}
    </div>
  );
}
