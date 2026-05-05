#!/bin/bash
# EC2 Ubuntu 24.04 初期セットアップスクリプト
# 使い方: curl -sSL https://raw.githubusercontent.com/tao-munakata/neko-service/main/infra/setup-ec2.sh | bash
set -euo pipefail

echo "=== ねこサービス EC2 セットアップ ==="

# Docker インストール
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker ubuntu
fi

# Docker Compose plugin
if ! docker compose version &>/dev/null; then
  sudo apt-get install -y docker-compose-plugin
fi

# Certbot インストール
sudo apt-get update -y
sudo apt-get install -y certbot

# GitHub Container Registry ログイン (環境変数が必要)
# echo "$GHCR_TOKEN" | docker login ghcr.io -u tao-munakata --password-stdin

# プロジェクトディレクトリ作成
sudo mkdir -p /opt/neko-service
sudo chown ubuntu:ubuntu /opt/neko-service

echo "=== セットアップ完了 ==="
echo ""
echo "次のステップ:"
echo "1. /opt/neko-service に .env.prod を配置"
echo "2. SSL証明書取得: sudo certbot certonly --standalone -d YOUR_DOMAIN"
echo "3. docker compose -f docker-compose.prod.yml up -d"
