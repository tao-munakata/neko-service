-- ねこサービス 初期DDL
-- Docker起動時に自動実行される

-- 拡張
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- 日本語部分一致検索用

-- ユーザー
CREATE TABLE IF NOT EXISTS users (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nickname            VARCHAR(50)  NOT NULL,
    cat_character       VARCHAR(100),                        -- 例: サバトラのニャンタ
    phone_number        VARCHAR(20),
    email               VARCHAR(255),
    avatar_url          TEXT,
    membership_tier     VARCHAR(20)  NOT NULL DEFAULT 'member'
                        CHECK (membership_tier IN ('guest','member','premium')),
    password            TEXT,
    auth_method         VARCHAR(20)  NOT NULL DEFAULT 'device',  -- 'device' | 'email'
    device_fingerprint  VARCHAR(255) UNIQUE,                 -- UA+画面+TZ のハッシュ
    voice_registered    BOOLEAN      NOT NULL DEFAULT FALSE,
    location_lat        DECIMAL(10,8),
    location_lng        DECIMAL(11,8),
    maps_consent        BOOLEAN      NOT NULL DEFAULT FALSE,  -- Google Maps 連動同意
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_active_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_device ON users(device_fingerprint);

-- カテゴリ
CREATE TABLE IF NOT EXISTS categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE
);

INSERT INTO categories (name, slug, description) VALUES
    ('昭和の喫茶店', 'showa-cafe',       'ノスタルジックな喫茶店・純喫茶の情報'),
    ('魚の旨い店',   'fish-restaurant',  '鮮度・産地・調理法にこだわる魚料理店')
ON CONFLICT (slug) DO NOTHING;

-- 投稿
CREATE TABLE IF NOT EXISTS posts (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_type      VARCHAR(20)  NOT NULL CHECK (post_type IN ('question','answer')),
    parent_post_id UUID         REFERENCES posts(id) ON DELETE SET NULL,
    raw_text       TEXT,
    neko_text      TEXT         NOT NULL,
    image_url      TEXT,
    category_id    INT          REFERENCES categories(id),
    layer          VARCHAR(20)  NOT NULL DEFAULT 'yorimichi'
                   CHECK (layer IN ('yorimichi','tamariba')),
    location_text  VARCHAR(100),
    status         VARCHAR(20)  NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','hidden','deleted')),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_category_created  ON posts(category_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_created      ON posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_parent            ON posts(parent_post_id);
CREATE INDEX IF NOT EXISTS idx_posts_neko_text_trgm   ON posts USING GIN (neko_text gin_trgm_ops);

-- リアクション
CREATE TABLE IF NOT EXISTS reactions (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id    UUID        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       VARCHAR(20) NOT NULL CHECK (type IN ('thanks','helpful','went_there')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (post_id, user_id, type)
);

CREATE INDEX IF NOT EXISTS idx_reactions_post ON reactions(post_id, type);

-- AI仲介ログ
CREATE TABLE IF NOT EXISTS ai_interventions (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    intervention_type VARCHAR(30) NOT NULL
                      CHECK (intervention_type IN ('isolation_alert','recommendation','offline_proposal')),
    target_user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    related_post_id   UUID        REFERENCES posts(id) ON DELETE SET NULL,
    message_text      TEXT        NOT NULL,
    triggered_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ai_interventions_user ON ai_interventions(target_user_id, triggered_at DESC);

-- オフ会
CREATE TABLE IF NOT EXISTS offline_events (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title        VARCHAR(200) NOT NULL,
    proposed_by  VARCHAR(10)  NOT NULL CHECK (proposed_by IN ('ai','user')),
    venue_text   TEXT,
    scheduled_at TIMESTAMPTZ,
    capacity     INT          NOT NULL DEFAULT 4,
    status       VARCHAR(20)  NOT NULL DEFAULT 'proposed'
                 CHECK (status IN ('proposed','confirmed','completed','cancelled')),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- オフ会参加者
CREATE TABLE IF NOT EXISTS offline_event_participants (
    event_id  UUID        NOT NULL REFERENCES offline_events(id) ON DELETE CASCADE,
    user_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (event_id, user_id)
);
