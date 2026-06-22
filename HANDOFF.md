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

## 2026-06-22 セッション記録（デプロイ完了）
- コミット: `feat: add device access log viewer to admin panel`
- GitHub Actions 自動ビルド＆デプロイ開始
- 本番 https://nyanko.fun/admin 右半分にリアルタイムアクセスログ表示（10秒自動更新）
- 残タスク: デバイスログ in-memory store の永続化、期限設定の運用確認

## 2026-06-22 セッション記録（メモリ保存・実装完了）
- 実装詳細を `work_log_20260622.md` に記録・MEMORY.md インデックスに追加
- コミット `8beeba7` 済み・本番デプロイ完了
- デバイスログ機能（モジュール分離・流用可能設計）完全実装
- 残タスク: in-memory ログの永続化・期限自動停止運用確認

## 2026-06-22 セッション記録（ログインバグ修正）
- **修正**: `/login` ページで呼び出しエンドポイントを `/registration/init` → `/registration/device-login` に変更
- **背景**: `/registration/init` は新規キャラ自動作成するため、ログイン画面に訪問するたびに幽霊ユーザーが生成されていた
- **結果**: 既知デバイスのみ認証、未登録時は401→選択画面へ遷移。新規ユーザー無制限作成を完全排除
- `ed2158a` コミット・本番デプロイ完了

## 2026-06-22 セッション記録（API インターセプター無限リダイレクト修正）
- **修正**: API インターセプター内の `/login` リダイレクト2箇所すべてにガードを追加
  - 401エラー時の自動リダイレクトがログイン画面で無限ループ化する問題を解決
  - `afe1f54`: infinite redirect loop 防止・`e6a4614`: guard all login redirects に統合
- 本番デプロイ完了・ログイン フロー安定化
- 残タスク: in-memory ログの永続化、期限自動停止運用確認

## 2026-06-22 セッション記録（認証フロー分析・根本原因調査）
- **根本原因特定**: 認証フロー `/registration/init`（登録）・`/registration/device-login`（ログイン）・`/auth/login`（メール）の3つに分散、責任範囲が曖昧
- **崩壊の連鎖**: `/login/page.tsx` が `/registration/init` 呼出 → 幽霊ユーザー量産 → デバイス変わる
- **修正後の課題**: `/registration/device-login` 切替 → 未登録デバイス401 → インターセプター無限リダイレクト → さらに `/admin` 認証も破壊
- **次フェーズの推奨設計**: 認証フロー（デバイスログイン・新規登録・admin認証）を明確に分離し、他機能の前に最初に固めるべき

## 2026-06-23 セッション記録（claude-mem 診断）
- `claude-mem` インストール状態調査・グローバル npm パッケージ確認
- **問題特定**: グローバルインストール未完了 + MCP サーバー非登録
- **修正案**: `npm install -g claude-mem` → `claude mcp add claude-mem -- claude-mem serve`
- 未実装（次回対応予定）

## 2026-06-23 セッション記録（claude-mem セットアップ完了）
- Claude Code プラグイン（claude-mem）のインストール・設定完了
- npm install グローバル → Bun v1.3.14 ランタイム有効化
- ワーカープロセス起動（localhost:37701）・ヘルスチェック ok
- メモリ注入は次セッション以降から反映（今回は1回目で未反映）
- 残タスク: in-memory ログの永続化・期限自動停止運用確認

## 2026-06-23 セッション記録（claude-mem 自動起動設定）
- launchd エージェント `com.claude-mem.worker.plist` を `~/Library/LaunchAgents/` に作成
- ワーカープロセス自動起動化（PID 40078 で launchd 管理下に）
- HealthCheck `localhost:37701` → `status: ok` 確認
- KeepAlive 設定で落ちたら10秒以内に自動再起動（運用完全自動化）
- 残タスク: in-memory ログの永続化・期限自動停止運用確認

## 2026-06-23 セッション記録（現行機能仕様分析）
- neko-service 全体の機能仕様を体系的に整理・確認
  - 技術スタック（Next.js/NestJS/PostgreSQL/Redis/MinIO）
  - 認証フロー（デバイス識別・JWT・3種類のエンドポイント）
  - ページ構成・投稿機能・管理機能・DBスキーマを図解
- **根本問題の認識**: 認証フロー `/registration/init`（登録）・`/registration/device-login`（ログイン）・`/auth/login`（メール）の責任範囲が曖昧
- **再構築推奨順序**: ① 認証フローを最初に固める ② デバイスログを独立したロギング層で設計 ③ 投稿機能 ④ 管理機能
- 残タスク: 認証フロー刷新・in-memory ログ永続化・運用自動化

## 2026-06-23 セッション記録（認証仕様刷新 — 実装計画会）
- **決定**: 認証方式を **デバイスUUID一本** に統一（メール+パスワード廃止）
- **削除対象**:
  - `POST /auth/login` エンドポイント（メール認証不要）
  - DB `email` / `password` / `auth_method` カラム（`device` 固定化）
  - `membership_tier` の `premium` 区分（メール前提機能削除）
- **効果**: 認証フロー簡潔化・DB設計簡素化・セキュリティ向上（デバイス単位の厳密制御）
- **次ステップ**: 再構築プラン確定後、認証層から実装開始予定

## 2026-06-23 セッション記録（マルチサービス再構築アーキテクチャ設計）
- **アーキテクチャ決定**: nyanko.fun / abc.nyanko.fun / xyz.nyanko.fun → 共通バックエンド（NestJS）
- **認証フロー統一**: `POST /auth/register` / `POST /auth/device` の2種類に絞込（`service_id` で分岐）
- **DB変更**: `users`テーブルに `service_id` カラム追加、ユニーク制約を `(device_fingerprint, service_id)` に変更
- **JWT ペイロード**: `sub` / `serviceId` / `deviceId` で明確化
- **段階的実装順序**: Step1（認証層再構築）→ Step2（neko機能移植）→ Step3（フロントリファクタ）→ Step4（複数サービス検証）
- **共通モジュール設計**: `shared/auth-lib/` （デバイスID収集・APIクライアント・登録UI）で各フロント間の流用化
- 残タスク: 実装開始前に `shared/auth-lib` の具体的な API 設計確定、2サービス目のユースケース定義

## 2026-06-23 セッション記録（再構築方針 — 確定版）
- **決定事項**: マルチサービス設計を廃止、neko-service 1本をスクラッチで綺麗に構築
- **DB簡素化**: `email` / `password` / `auth_method` / `service_id` 全削除、ユニーク制約は `device_fingerprint` のみ
- **認証エンドポイント統一**: `POST /auth/register`（新規デバイス）/ `POST /auth/device-login`（既知デバイス）の2本に整理
- **構成変更なし**: `apps/backend/` (NestJS) / `apps/frontend/` (Next.js) は継続
- 残タスク: 確定仕様に基づく実装開始

## 2026-06-23 セッション記録（認証フロー v3.0.0 実装・デプロイ完了）
- **実装内容**: 
  - バックエンド: `POST /auth/register`（即JWT発行）/ `POST /auth/device-login` / `POST /auth/profile` / `POST /auth/refresh` エンドポイント実装
  - DB マイグレーション: `email`, `password`, `phone_number`, `auth_method` カラム削除、TypeORM synchronize で自動実行
  - 削除モジュール: `registration.controller.ts` / `registration-agent.service.ts` / `registration.dto.ts` 廃止
  - フロントエンド: Step1で JWT 即時取得・保存、Step2/3 は認証済み状態で動作
- **コミット**: `5dffdbc feat: rebuild auth as device-only flow v3.0.0`
- **デプロイ**: GitHub Actions 自動ビルド＆デプロイ完了
- 残タスク: DB カラム削除の本番確認（synchronize 実行待ち）

## 2026-06-23 セッション記録（認証バグ根本原因診断）
- **バグ症状**: 同じキャラが複数デバイス・別アカウントで重複ログイン
- **診断**: 根本原因の2つの候補を特定
  - 候補A: キャラ名の衝突（`catCharacter` にユニーク制約がない・10種×12名=120通りのみ）
  - 候補B: localStorage deviceId 共有（Chrome同期・iCloud復元等で deviceId が引き継がれる）
- **判定方法**: `/admin` デバイス一覧で `deviceFingerprint` を確認
  - 2行 → 候補A（同名・別アカウント）
  - 1行 → 候補B（同一アカウント）
- 残タスク: `/admin` で診断実施・候補に合わせた修正実装

## 2026-06-23 セッション記録（キャラ名重複バグ修正・本番デプロイ）
- **根本原因確定**: `catCharacter` は120通りのみで、DB ユニーク制約なし → 別デバイスに同名割り当て
- **修正1** — キャラ名重複防止（backend）
  - 生成後に DB 検索し既存ユーザーと被ったらリトライ（最大5回）
  - 5回衝突時は `キジトラのニャンタ713` のような3桁乱数サフィックス付与でユニーク化
- **修正2** — adminページ UI
  - 廃止した `authMethod` 列を削除
  - `deviceFingerprint` を monospace・全文表示に変更（以前は 100px 切り詰め）
- **コミット**: `dba1f94 fix: ensure catCharacter uniqueness and fix admin UI`
- **デプロイ完了**: GitHub Actions 自動ビルド＆デプロイ → 本番反映
- 残タスク: 既存キャラの重複排除・UI 検証

## 2026-06-23 セッション記録（デバイス重複バグ診断）
- **ユーザー検証**: 3台デバイスでテストアクセス実施
- **バグ症状の再確認**: `/admin` ページでデバイス一覧・アクセスログを確認中
  - デバイス一覧の件数、デバイスID の重複・相違を検査
  - アクセスログの Device ID 欄で3種類 UUID の出現パターンを監視
- **判定待ち**: 候補A（キャラ名衝突）or 候補B（deviceId 共有）を特定するため、ユーザー側の検証結果を待機
- 残タスク: 診断結果に基づく修正実装（deviceId 永続化改善 or キャラ生成ロジック強化）

## 2026-06-23 セッション記録（UserAgent 追加・デバイス診断)
- コミット: `1938d36 feat: add userAgent to device list in admin panel`
- **追加機能**: `/admin` デバイス一覧に「端末」列（UserAgent: Mac/iOS/Android など）を追加表示
- **デプロイ完了**: GitHub Actions 自動ビルド＆デプロイ → 本番反映
- **検証方法**: v3.0.0以降の新規ユーザーは「端末」欄に表示、v3.0.0以前は「—」で表示（UA未保存）
- 残タスク: デバイスID の重複原因（同一 UUID 使用 vs キャラ名衝突）を最終判定

## 2026-06-23 セッション記録（UserAgent DB マイグレーション対応）
- コミット: `88663c2 fix: skip userAgent insert until DB migration runs`
- **問題**: `synchronize: false` 環境で backend エンティティに `user_agent` カラム追加 → DB に実在しないカラムへの INSERT で失敗
- **修正**: backend で INSERT をスキップ、フロント側は UA を収集し続ける（DB 移行まで保持）
- **DB 実行手順**: サーバーSSH → PostgreSQL接続 → `ALTER TABLE users ADD COLUMN IF NOT EXISTS user_agent TEXT;`
- **デプロイ**: 2〜3分後のデプロイ以降、新規登録時に UA が自動保存開始
- **教訓**: `synchronize: false` 環境ではエンティティカラム追加と DB マイグレーションを同時実施が必須

## 2026-06-23 セッション記録（DB マイグレーション実施ガイド）
- DB `user_agent` カラム追加の実行手順を提供
- `docker exec nyanko-postgres-1 psql -U postgres -d nyanko -c "ALTER TABLE users ADD COLUMN IF NOT EXISTS user_agent TEXT;"` コマンド提示
- 残タスク: ターミナルでの実行確認・本番反映

## 2025-01-14 セッション記録（DB マイグレーション対応継続）
- PostgreSQL ユーザー名確認作業（`postgres` vs `nyanko` など実際の環境値）
- DB 実行コマンド修正予定: `ALTER TABLE users ADD COLUMN IF NOT EXISTS user_agent TEXT;` を正しい認証情報で実行
- 残タスク: 本番環境 `.env.prod` の DATABASE_URL 確認 → PostgreSQL マイグレーション実行

## 2026-06-23 セッション記録（UserAgent DB マイグレーション最終対応）
- コミット: `88663c2 fix: skip userAgent insert until DB migration runs`
- **問題**: `synchronize: false` 環境で backend エンティティに `user_agent` カラム追加 → INSERT 失敗
- **修正**: backend INSERT スキップ、フロント側は UA 継続収集
- **次ステップ**: サーバーにて `ALTER TABLE users ADD COLUMN IF NOT EXISTS user_agent TEXT;` を実行
- 残タスク: PostgreSQL マイグレーション実行（ユーザー認証情報確認）、本番反映検証

## 2026-01-14 セッション記録（セッション終了・HANDOFF 自動更新）
- コミット確認: `88663c2 fix: skip userAgent insert until DB migration runs`・`1938d36 feat: add userAgent to device list in admin panel`・`dba1f94 fix: ensure catCharacter uniqueness and fix admin UI`・`5dffdbc feat: rebuild auth as device-only flow v3.0.0`
- **最終状態**: v3.0.0 認証フロー確定・UserAgent 機能実装・DB マイグレーション前段完了
- 残タスク: PostgreSQL `user_agent` カラム追加実行（ユーザー認証情報: `neko` / DB名: `neko_db`）

## 2026-06-23 セッション記録（UserAgent DB マイグレーション・デプロイ完了）
- コミット: `ba66d3e feat: re-enable userAgent save after DB migration`
- **実装**: UserAgent DB マイグレーション完了後、backend で再度 `user_agent` カラム保存を有効化
- **デプロイ**: GitHub Actions 自動ビルド＆デプロイ完了
- **検証**: `/register` → `/admin` デバイス一覧の「端末」列に `Mac / Chrome`・`Android / Chrome`・`Mac / Firefox` などが表示開始
- 残タスク: 既存デバイス（v3.0.0 以前）の UA 未保存問題の事後対応検討

## 2026-06-23 セッション記録（デバイス識別仕様確認・根本原因分析）
- **確認**: localStorage UUID による個体識別の仕様（ブラウザ単位、物理デバイス単位ではない）
- **検証**: シークレットモード・別ブラウザで新規 UUID 生成・新規登録が発生する仕様を確認
- **根本原因**: 最初のバグ（キジトラのコテツが複数台に出現）は、別ブラウザ/シークレットモードからの `/register` 呼び出しによる新規登録が原因の可能性高
- **現状**: 実装は仕様通り・同一人物が複数ブラウザ使用時の同一人物化は今後の検討課題
