import Header from '@/components/ui/Header';
import PostFeed from './PostFeed';

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto w-full px-4 py-6 flex-1">
        {/* ヒーロー */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🐱</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            ねこ寄り道
          </h1>
          <p className="text-gray-500 text-base">
            地元のご馳走・お福分け
          </p>
        </div>

        <PostFeed />
      </main>

      {/* 下部固定：投稿ボタン */}
      <div className="fixed bottom-6 right-6 z-40">
        <a
          href="/posts/new"
          className="flex items-center justify-center w-16 h-16 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-3xl shadow-xl transition-transform hover:scale-110 active:scale-95"
          aria-label="新しく投稿する"
        >
          🎤
        </a>
      </div>
    </>
  );
}
