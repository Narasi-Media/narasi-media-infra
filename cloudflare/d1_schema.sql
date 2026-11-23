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
