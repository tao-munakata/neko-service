interface Props {
  currentStep: 1 | 2 | 3 | 4;
}

const STEPS = [
  { step: 1, label: 'はじめまして', paw: '🐾' },
  { step: 2, label: '声を聴かせて', paw: '🐾' },
  { step: 3, label: '場所を教えて', paw: '🐾' },
  { step: 4, label: '完了にゃん',  paw: '🐾' },
];

export default function CatStepIndicator({ currentStep }: Props) {
  return (
    <div className="flex items-center justify-center gap-1 mb-8">
      {STEPS.map(({ step, label, paw }, i) => {
        const done = step < currentStep;
        const active = step === currentStep;
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <span className={`text-2xl transition-all duration-300 ${
                done ? 'opacity-100' : active ? 'opacity-100 animate-bounce' : 'opacity-25'
              }`}>
                {done ? '✅' : paw}
              </span>
              <span className={`text-xs mt-1 text-center leading-tight transition-colors ${
                active ? 'text-orange-600 font-bold' : done ? 'text-green-600' : 'text-gray-300'
              }`} style={{ fontSize: '10px', width: '48px' }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-6 h-0.5 mb-4 mx-1 transition-colors ${
                done ? 'bg-green-400' : 'bg-gray-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
