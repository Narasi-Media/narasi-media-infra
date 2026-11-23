#!/bin/bash
set -e

echo "🚀 Deploying Narasi Media to Standalone VPS via Docker Compose..."

cd "$(dirname "$0")/../vps"

if ! command -v docker &> /dev/null; then
    echo "⚠️ Docker is not installed. Please install Docker and Docker Compose."
    exit 1
fi

echo "📦 Building containers..."
docker compose build

echo "⚡ Starting services..."
docker compose up -d

echo "✅ VPS deployment completed! Services running behind Caddy HTTPS."
