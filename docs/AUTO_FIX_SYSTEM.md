# 🤖 AI自動エラー修正システム

## 概要

LUX Platformは、Sentry、Gemini AI、GitHub Actionsを組み合わせた完全自動エラー修正システムを搭載しています。

## 仕組み

### 1. エラー検知（Sentry）
- アプリケーションでエラーが発生
- Sentryが自動的にエラーをキャッチ
- Webhookを通じてサーバーに通知

### 2. GitHub Actions起動
- サーバーがGitHub Actionsをトリガー
- エラーログとスタックトレースを渡す

### 3. AI分析（Gemini）
- Gemini 1.5 Flash APIがエラーを分析
- 原因を特定して修正コードを自動生成
- 重大度（low/medium/high）を判定

### 4. Pull Request作成
- 修正コードを自動適用
- Pull Requestを自動作成
- 管理者に通知

### 5. 承認とマージ
- 管理者がGitHub上でPRを確認
- 問題なければマージ
- Renderが自動デプロイ

## 設定方法

### 1. GitHub Secrets設定

以下のSecretsをGitHubリポジトリに追加：

```
GEMINI_API_KEY: Gemini APIキー
GITHUB_TOKEN: GitHub Personal Access Token（repo権限）
```

### 2. Sentry Webhook設定

Sentryプロジェクトで以下を設定：

1. Settings > Integrations > Webhooks
2. Add Webhook
3. URL: `https://lux-platform.onrender.com/api/trpc/sentryWebhook.handleWebhook`
4. Events: Error

### 3. Render環境変数追加

```
GITHUB_TOKEN: GitHub Personal Access Token
GITHUB_REPO: yokono-haruto/lux-platform
```

## 使用方法

### 自動モード（推奨）

エラーが発生すると自動的に：
1. Sentryが検知
2. GitHub Actionsが起動
3. AIが分析・修正
4. Pull Requestが作成
5. 管理者に通知

### 手動モード

管理者ダッシュボードから：
1. 🔧アイコンをクリック
2. エラーログとスタックトレースを入力
3. 「AIで分析して修正案を生成」をクリック
4. 修正内容を確認
5. 「修正を承認して適用」をクリック

## 安全対策

- ✅ 管理者承認が必須
- ✅ 全修正履歴がGitHubに残る
- ✅ ロールバック可能
- ✅ 重大なエラーのみ自動修正
- ✅ 無料枠内で動作（GitHub Actions 2,000分/月）

## トラブルシューティング

### GitHub Actionsが起動しない

1. GITHUB_TOKENが正しく設定されているか確認
2. トークンに`repo`権限があるか確認
3. Sentry WebhookのURLが正しいか確認

### AIが修正案を生成しない

1. GEMINI_API_KEYが正しく設定されているか確認
2. エラーログが十分な情報を含んでいるか確認
3. Gemini APIの無料枠を超えていないか確認

### Pull Requestが作成されない

1. GitHubトークンに`pull_request`権限があるか確認
2. ワークフローファイルが正しく配置されているか確認
3. GitHub Actionsのログを確認

## 制限事項

- GitHub Actions無料枠: 2,000分/月
- Gemini API無料枠: 1日1,500リクエスト
- Sentry無料枠: 月間5,000エラー

## ライセンス

MIT License
