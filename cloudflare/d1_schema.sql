-- Cloudflare D1 (SQLite) Schema for Narasi Media Platform

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    whatsapp_number TEXT,
    password_hash TEXT NOT NULL,
    balance INTEGER DEFAULT 0,
    role TEXT DEFAULT 'member',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'mdi-tag',
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    provider_id TEXT,
    provider_service_id TEXT,
    name TEXT NOT NULL,
    service_type TEXT DEFAULT 'default',
    price_original INTEGER NOT NULL,
    price_user INTEGER NOT NULL,
    min_order INTEGER NOT NULL,
    max_order INTEGER NOT NULL,
    refill_supported INTEGER DEFAULT 0,
    refill_days INTEGER DEFAULT 0,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    service_id TEXT NOT NULL,
    provider_order_id TEXT,
    target TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    start_count INTEGER DEFAULT 0,
    remains INTEGER DEFAULT 0,
    price_per_k INTEGER NOT NULL,
    total_price INTEGER NOT NULL,
    custom_comments TEXT,
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (service_id) REFERENCES services(id)
);

CREATE TABLE IF NOT EXISTS deposits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    method TEXT NOT NULL,
    requested_amount INTEGER NOT NULL,
    unique_code INTEGER DEFAULT 0,
    total_to_pay INTEGER NOT NULL,
    balance_credited INTEGER NOT NULL,
    proof_image_url TEXT,
    sender_name TEXT,
    status TEXT DEFAULT 'pending',
    rejection_reason TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    expired_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS balance_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    log_type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    initial_balance INTEGER NOT NULL,
    final_balance INTEGER NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Seed Initial Categories
INSERT OR IGNORE INTO categories (id, name, icon, sort_order) VALUES
('cat-ig', 'Instagram Followers & Likes', 'instagram', 1),
('cat-tiktok', 'TikTok Followers, Likes & Views', 'tiktok', 2),
('cat-yt', 'YouTube Subscribers & Views', 'youtube', 3),
('cat-tw', 'Twitter / X Followers & Retweet', 'twitter', 4);

-- Seed Initial Services
INSERT OR IGNORE INTO services (id, category_id, provider_id, provider_service_id, name, service_type, price_original, price_user, min_order, max_order, refill_supported, refill_days, description, is_active) VALUES
('SRV-101', 'cat-ig', 'prov-1', '101', 'Instagram Followers REAL Indonesia [Maks 50K] [Garansi 30 Hari]', 'default', 12000, 15500, 100, 50000, 1, 30, 'Akun real aktif Indonesia. Kecepatan 1.000 - 5.000 / hari. Garansi tombol Refill 30 hari jika drop > 10%.', 1),
('SRV-102', 'cat-ig', 'prov-1', '102', 'Instagram Likes Super Instant [Maks 100K] [No Drop]', 'default', 3000, 4500, 50, 100000, 0, 0, 'Proses instan 5 - 10 menit setelah submit. Masukkan link postingan valid.', 1),
('SRV-201', 'cat-tiktok', 'prov-1', '201', 'TikTok Followers Organik HQ [Garansi 30 Hari]', 'default', 18000, 22000, 100, 25000, 1, 30, 'Followers TikTok kualitas tinggi dengan foto profil dan video.', 1),
('SRV-301', 'cat-yt', 'prov-1', '301', 'YouTube Subscribers Non-Drop [Garansi Seumur Hidup]', 'default', 75000, 95000, 50, 10000, 1, 365, 'Subscribers aman untuk monetisasi YouTube. Kecepatan 100 - 300 / hari.', 1);

-- Seed Demo User
INSERT OR IGNORE INTO users (id, username, full_name, email, whatsapp_number, password_hash, balance, role, created_at, updated_at) VALUES
('usr-regiami-001', 'regiami', 'Regi Ami', 'regi@narasi.media', '081234567890', 'argon2_hashed_pass', 500000, 'member', datetime('now'), datetime('now'));

