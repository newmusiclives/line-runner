-- Users
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  password_hash TEXT,
  avatar_url    TEXT,
  role          TEXT DEFAULT 'user' CHECK(role IN ('user','admin')),
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now')),
  suspended_at  TEXT
);

-- OAuth Accounts
CREATE TABLE IF NOT EXISTS accounts (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider            TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  access_token        TEXT,
  refresh_token       TEXT,
  expires_at          INTEGER,
  UNIQUE(provider, provider_account_id)
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at    TEXT NOT NULL
);

-- Scripts
CREATE TABLE IF NOT EXISTS scripts (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  file_name       TEXT NOT NULL,
  file_path       TEXT,
  raw_text        TEXT,
  parsed_data     TEXT NOT NULL,
  status          TEXT DEFAULT 'active' CHECK(status IN ('active','flagged','removed')),
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);

-- Voice Assignments
CREATE TABLE IF NOT EXISTS voice_assignments (
  id              TEXT PRIMARY KEY,
  script_id       TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  character_name  TEXT NOT NULL,
  voice_config    TEXT NOT NULL,
  UNIQUE(script_id, character_name)
);

-- Rehearsal Sessions
CREATE TABLE IF NOT EXISTS rehearsal_sessions (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  script_id       TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  my_character    TEXT NOT NULL,
  started_at      TEXT DEFAULT (datetime('now')),
  ended_at        TEXT,
  duration_secs   INTEGER DEFAULT 0,
  lines_total     INTEGER DEFAULT 0,
  lines_completed INTEGER DEFAULT 0,
  furthest_line   INTEGER DEFAULT 0,
  loop_count      INTEGER DEFAULT 0
);

-- Line Metrics
CREATE TABLE IF NOT EXISTS line_metrics (
  id              TEXT PRIMARY KEY,
  session_id      TEXT NOT NULL REFERENCES rehearsal_sessions(id) ON DELETE CASCADE,
  line_id         TEXT NOT NULL,
  line_index      INTEGER NOT NULL,
  character_name  TEXT NOT NULL,
  timing_ms       INTEGER,
  skipped         INTEGER DEFAULT 0,
  replayed        INTEGER DEFAULT 0,
  recorded_at     TEXT DEFAULT (datetime('now'))
);

-- Annotations
CREATE TABLE IF NOT EXISTS annotations (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  script_id       TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  line_id         TEXT NOT NULL,
  note_type       TEXT CHECK(note_type IN ('personal','blocking','emotion','director')),
  content         TEXT NOT NULL,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);

-- Bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  script_id       TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  label           TEXT NOT NULL,
  start_line_idx  INTEGER NOT NULL,
  end_line_idx    INTEGER NOT NULL,
  created_at      TEXT DEFAULT (datetime('now'))
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id                    TEXT PRIMARY KEY,
  user_id               TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id               TEXT NOT NULL,
  status                TEXT DEFAULT 'active' CHECK(status IN ('active','cancelled','past_due','expired')),
  manifest_payment_id   TEXT,
  manifest_sub_id       TEXT,
  amount_cents          INTEGER NOT NULL,
  period                TEXT NOT NULL,
  minutes_included      INTEGER NOT NULL,
  minutes_used          INTEGER DEFAULT 0,
  voices_included       INTEGER NOT NULL,
  current_period_start  TEXT,
  current_period_end    TEXT,
  created_at            TEXT DEFAULT (datetime('now'))
);

-- Favorites
CREATE TABLE IF NOT EXISTS favorites (
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  script_id TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, script_id)
);

-- Feature Flags
CREATE TABLE IF NOT EXISTS feature_flags (
  key         TEXT PRIMARY KEY,
  enabled     INTEGER DEFAULT 1,
  config      TEXT,
  updated_at  TEXT DEFAULT (datetime('now'))
);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
  id          TEXT PRIMARY KEY,
  admin_id    TEXT NOT NULL,
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   TEXT,
  details     TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
);

-- Seed default feature flags
INSERT OR IGNORE INTO feature_flags (key, enabled) VALUES
  ('emotion_detection', 1),
  ('director_notes', 1),
  ('sound_effects', 1),
  ('teleprompter', 1),
  ('export_audio', 1),
  ('multi_character', 1),
  ('annotations', 1),
  ('bookmarks', 1),
  ('performance_analytics', 1);
