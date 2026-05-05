import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/" className="text-orange-500 hover:underline text-base mb-6 inline-block">← 戻るにゃん</Link>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">🐱 プライバシーポリシー</h1>

      <div className="space-y-6 text-gray-700 text-base leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">1. 取得する情報</h2>
          <p>ねこ寄り道では、サービス提供のために以下の情報を取得しますにゃん：</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>デバイス識別情報（ブラウザ・画面サイズ・タイムゾーンのハッシュ値）</li>
            <li>位置情報（任意。店舗検索や地図表示に使用）</li>
            <li>声のデータ（任意。声紋登録機能に使用）</li>
            <li>投稿内容（テキスト・画像）</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">2. 情報の利用目的</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>アカウント識別とサービス提供</li>
            <li>近隣の飲食店情報の取得（Google Places API）</li>
            <li>AIによる投稿文のネコ語変換</li>
            <li>声の再生機能（MinIOストレージに保存）</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">3. 第三者への提供</h2>
          <p>個人を特定できる情報を第三者に販売・提供することはありませんにゃん。ただし、以下のサービスを利用しますにゃん：</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Google Places API（店舗情報の取得）</li>
            <li>Anthropic Claude API（テキスト変換・整形）</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">4. 位置情報について</h2>
          <p>位置情報の取得には事前に同意を求めますにゃん。同意しなくてもサービスを利用できますにゃん。</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">5. 声のデータについて</h2>
          <p>録音した声は暗号化して保存し、本人確認と声再生機能のみに使用しますにゃん。いつでも削除を申請できますにゃん。</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">6. お問い合わせ</h2>
          <p>プライバシーに関するご質問は、サービス内の投稿機能からお問い合わせくださいにゃん。</p>
        </section>
      </div>

      <div className="mt-8 text-center text-sm text-gray-400">
        最終更新: 2026年5月
      </div>
    </main>
  );
}
