# HANDOFF.md — neko-service（ねこ寄り道/ねこの溜まり場）

## プロジェクト概要

猫好きのためのスポット共有・音声投稿SNS。Google Places 連動の写真投稿と音声コメント機能を持つ。
本番: https://nyanko.fun/

## 技術スタック

| 層 | 技術 |
|----|------|
| Frontend | Next.js (TypeScript + Tailwind) → `apps/frontend/` |
| Backend | NestJS → `apps/backend/` |
| DB | PostgreSQL 16 |
| Cache | Redis 7 |
| Media | MinIO（バケット: neko-media） |
| Proxy | nginx |
| AI | Claude API（ネコ語変換・語尾: 「にゃん」） |

## 環境構築

```bash
cd ~/ai/neko-service
docker compose up -d
# http://localhost → nginx → frontend(3000) / backend(3001/api)
# MinIO Console: http://localhost:9001 (minioadmin/minioadmin)
```

## 本番環境

- サーバー: ubuntu@nyanko.fun
- デプロイ先: /home/ubuntu/nyanko/
- CI/CD: GitHub Actions → SSH → docker compose build → up
- 本番 .env: /home/ubuntu/nyanko/.env.prod に設定済み

```bash
# ヘルスチェック
curl -s https://nyanko.fun/api/health
# CI確認
gh run list --limit 5
```

## 現状（v2.2.0 / 2026-06-19 → デバイスログ機能追加中）

実装済み機能:
- v1.5: デバイス指紋認証 + JWT + ステップ式登録
- v1.6: 音声保存・性別判定・再生
- v1.7: 写真投稿（Google Places × 音声コメント）
- v1.8: PWA・LINEシェア・Google Mapsシェア
- v2.1.0: 管理者デバイス管理（`/admin`・`GET /admin/devices`・`DELETE /admin/devices/:id`）
- v2.1.1: ログイン後ヘッダーユーザ名バグ修正（フルリロード対応）・`/reset`ページ追加
- v2.2.0: デバイス識別をfingerprint→localStorage UUID（`getDeviceId()`）に変更
- **2026-06-22（未デプロイ）**: デバイスアクセスログ機能・adminページ2カラム化

### デバイスログ機能（未デプロイ）

**バックエンド切り出し可能モジュール**
- `apps/backend/src/common/device-log/` — `@Global()` サービス（他サービスにそのままコピー可）
  - `device-log.types.ts` — `DeviceLogEntry` 型定義
  - `device-log.service.ts` — in-memoryストア最大200件、**期限 2026-07-22 で自動停止**
  - `device-log.module.ts` — グローバルDIモジュール

**ログ収集ポイント**
- `POST /registration/init` → `registration_init` タイプで記録
- `POST /registration/device-login` → `device_login` タイプで記録
- `POST /auth/login` → `email_login` タイプで記録
- `GET /admin/device-logs` → `x-admin-secret` 認証付きで閲覧

**フロントエンド切り出し可能モジュール**
- `apps/frontend/src/lib/device-identity/` — 他サービスへの流用対応
  - `types.ts` — `DeviceIdentity` 型
  - `collector.ts` — UUID・UA・解像度・タイムゾーン・言語を収集

**adminページ（`/admin`）2カラム化**
- 左: デバイス一覧（既存機能）
- 右: アクセスログ（黒背景・10秒自動更新）
  - Device ID → 大・太字・オレンジ（最重要）
  - IP → 中・青
  - TZ / LANG / SCREEN → 小・水色
  - UA → 最小・グレー

### 重要な運用メモ
- EC2環境変数ファイルは `.env.prod`（`.env` ではない）
- コンテナ再作成は必ず両compose指定: `docker compose -f docker-compose.prod.yml -f docker-compose.server-build.yml up -d`
- ログイン後のナビゲーションは `window.location` でフルリロードすること（Header再マウントのため）
- デバイス識別は `apps/frontend/src/lib/device-identity/collector.ts` の `collectDeviceIdentity()`（解像度・TZ・言語も収集）

## 残タスク

- Google MAP への実際の口コミ投稿（OAuth 2.0 ユーザー認可）→ フェーズ2
- 音声認識: Web Speech API → Google Cloud Speech-to-Text
- 投稿一覧の無限スクロール（現在上限20件）
- 本番パスワードのローテーション（docker-compose.prod.yml にハードコード中）

## セッション記録

### 2026-06-17〜19
- 管理者デバイス削除機能実装・デプロイ（v2.1.0）
- ログイン後ヘッダーバグ修正・`/reset`ページ追加・本番DB初期化（v2.1.1）
- デバイス識別をfingerprintからlocalStorage UUIDに変更（v2.2.0）

## 2026-06-22 セッション記録

### セッション1（設定）
- Stop hook のHANDOFF.md自動更新機能設定
  - `~/.claude/settings.json`: `Edit(**HANDOFF.md)` / `Write(**HANDOFF.md)` をグローバル allow に追加
  - `~/.claude/settings.json`: Stop hookエージェントに `permission_mode: acceptEdits` を追加
  - `neko-service/.claude/settings.local.json`: プロジェクトレベルで HANDOFF.md操作権限を追加
- 設定変更で次セッション終了時から自動更新が動作開始

### セッション2（デバイスログ設計）
- デバイス識別情報の階層化設計を提示
  - `deviceId`（localStorage UUID）を最重要・高信頼として確立
  - 補助情報：解像度・タイムゾーン・言語の追加収集を提案
- ログUI設計（adminページ右半分）を図解提示
  - 信頼度レベルで視覚階層を定義（大・中・小、色分け）
- エンドポイント設計：`/registration/init` → `device-login` → `/auth/login` → `/admin/device-logs`

### セッション3（デバイスログ実装）
- `apps/backend/src/common/device-log/` モジュール新規作成（他サービス流用可）
- `registration.controller.ts`・`auth.controller.ts` にログ記録追加
- `admin.controller.ts` に `GET /admin/device-logs` エンドポイント追加
- `apps/frontend/src/lib/device-identity/` モジュール新規作成（他サービス流用可）
- `admin/page.tsx` を左右2カラムに改修（デバイス一覧 + アクセスログ）
- 未デプロイ（次回 `git push` → GitHub Actions で自動デプロイ）
