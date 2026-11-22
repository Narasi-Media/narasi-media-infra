#!/bin/bash
set -e

echo "🚀 Deploying Buzzer Media to Cloudflare Workers (Free Tier)..."

cd "$(dirname "$0")/../cloudflare"

# Check wrangler
if ! command -v wrangler &> /dev/null; then
    echo "⚠️ wrangler CLI is not installed. Run: npm install -g wrangler"
    exit 1
fi

echo "📦 Applying D1 migrations..."
wrangler d1 execute buzzer-media-prod --file=./d1_schema.sql

echo "⚡ Deploying Worker..."
wrangler deploy

echo "✅ Cloudflare deployment completed successfully!"
