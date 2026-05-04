'use client';
import { useState } from 'react';
import CatStepIndicator from '@/components/registration/CatStepIndicator';
import Step1DeviceInit from '@/components/registration/Step1DeviceInit';
import Step2Voice from '@/components/registration/Step2Voice';
import Step3Location from '@/components/registration/Step3Location';
import Step4Complete from '@/components/registration/Step4Complete';

type Step = 1 | 2 | 3 | 4;

export default function RegisterNewPage() {
  const [step, setStep] = useState<Step>(1);
  const [userId, setUserId] = useState('');
  const [catCharacter, setCatCharacter] = useState('');

  return (
    <main className="min-h-screen bg-[#fffdf7] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* ヘッダー */}
        <div className="text-center mb-6">
          <p className="text-2xl font-bold text-gray-700">ねこ寄り道</p>
          <p className="text-base text-gray-400 mt-1">はじめましてにゃん！</p>
        </div>

        {/* 足跡ステップインジケーター */}
        <CatStepIndicator currentStep={step} />

        {/* ステップコンテンツ */}
        <div className="bg-white rounded-3xl shadow-md border-2 border-orange-100 p-6 min-h-[400px] flex flex-col justify-center">
          {step === 1 && (
            <Step1DeviceInit
              onNext={(id, cat) => {
                setUserId(id);
                setCatCharacter(cat);
                setStep(2);
              }}
              onAlreadyRegistered={() => setStep(4)}
            />
          )}
          {step === 2 && (
            <Step2Voice
              userId={userId}
              catCharacter={catCharacter}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <Step3Location
              userId={userId}
              catCharacter={catCharacter}
              onNext={() => setStep(4)}
            />
          )}
          {step === 4 && (
            <Step4Complete catCharacter={catCharacter} />
          )}
        </div>

        {/* プライバシーポリシー */}
        <p className="text-center text-xs text-gray-400 mt-6 leading-relaxed">
          登録することで、位置情報・音声の取り扱いについての
          <a href="/privacy" className="text-orange-400 underline">プライバシーポリシー</a>
          に同意したことになるにゃん
        </p>
      </div>
    </main>
  );
}
