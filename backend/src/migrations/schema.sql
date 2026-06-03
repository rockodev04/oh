-- ============================================
-- OnlyHackers — PostgreSQL Schema
-- Cifrado con pgcrypto para datos sensibles
-- ============================================

-- Habilitar extensión de cifrado
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Usuarios ──
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  username    TEXT NOT NULL UNIQUE,
  email       BYTEA NOT NULL UNIQUE, -- cifrado con AES-256
  password_hash TEXT NOT NULL,
  membership  TEXT NOT NULL DEFAULT 'none'
                CHECK (membership IN ('none','gameboy','playboy')),
  role        TEXT NOT NULL DEFAULT 'none'
                CHECK (role IN ('none','staff','admin')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Artículos ──
CREATE TABLE IF NOT EXISTS articles (
  id           SERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  content_type TEXT NOT NULL
                 CHECK (content_type IN ('public','creator','tips')),
  body         TEXT NOT NULL,
  created_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Comentarios ──
CREATE TABLE IF NOT EXISTS comments (
  id         SERIAL PRIMARY KEY,
  article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Likes ──
CREATE TABLE IF NOT EXISTS likes (
  id         SERIAL PRIMARY KEY,
  article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, user_id)
);

-- ── Mensajes ──
CREATE TABLE IF NOT EXISTS messages (
  id          SERIAL PRIMARY KEY,
  sender_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     BYTEA NOT NULL, -- cifrado con AES-256
  priority    INTEGER NOT NULL DEFAULT 3,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Membresías / Pagos ──
CREATE TABLE IF NOT EXISTS payments (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  membership TEXT NOT NULL CHECK (membership IN ('gameboy','playboy')),
  amount     DECIMAL(10,2) NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','completed','failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Productos ──
CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  price       DECIMAL(10,2) NOT NULL,
  stock       INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Carrito ──
CREATE TABLE IF NOT EXISTS carts (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ── Órdenes ──
CREATE TABLE IF NOT EXISTS orders (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total      DECIMAL(10,2) NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','completed','failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Streams ──
CREATE TABLE IF NOT EXISTS streams (
  id                  SERIAL PRIMARY KEY,
  host_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','ended')),
  membership_required TEXT NOT NULL DEFAULT 'none'
                        CHECK (membership_required IN ('none','gameboy','playboy')),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── Lista negra de IPs ──
CREATE TABLE IF NOT EXISTS blacklist (
  id         SERIAL PRIMARY KEY,
  ip         TEXT NOT NULL UNIQUE, -- hasheada con SHA-256
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Índices para mejor rendimiento ──
CREATE INDEX IF NOT EXISTS idx_articles_created_by ON articles(created_by);
CREATE INDEX IF NOT EXISTS idx_comments_article_id ON comments(article_id);
CREATE INDEX IF NOT EXISTS idx_likes_article_id ON likes(article_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_streams_status ON streams(status);
