-- Users
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  password_hash TEXT,
  avatar_url    TEXT,
  bio           TEXT,
  is_voice_actor INTEGER DEFAULT 0,
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
  genre           TEXT,
  tone            TEXT,
  status          TEXT DEFAULT 'active' CHECK(status IN ('active','flagged','removed')),
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);

-- Script Analysis (Feature 04)
CREATE TABLE IF NOT EXISTS script_analysis (
  id              TEXT PRIMARY KEY,
  script_id       TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  genre           TEXT,
  tone            TEXT,
  character_arcs  TEXT,
  key_beats       TEXT,
  turning_points  TEXT,
  suggested_voices TEXT,
  memorisation_difficulty TEXT CHECK(memorisation_difficulty IN ('easy','moderate','hard','very-hard')),
  estimated_sessions INTEGER DEFAULT 5,
  created_at      TEXT DEFAULT (datetime('now')),
  UNIQUE(script_id)
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
  mode            TEXT DEFAULT 'standard',
  started_at      TEXT DEFAULT (datetime('now')),
  ended_at        TEXT,
  duration_secs   INTEGER DEFAULT 0,
  lines_total     INTEGER DEFAULT 0,
  lines_completed INTEGER DEFAULT 0,
  furthest_line   INTEGER DEFAULT 0,
  loop_count      INTEGER DEFAULT 0,
  wildcard_modifier TEXT,
  subtext_config  TEXT,
  objective_config TEXT,
  relationship_config TEXT
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

-- Stumble Events (Feature 05)
CREATE TABLE IF NOT EXISTS stumble_events (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  script_id       TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  session_id      TEXT NOT NULL REFERENCES rehearsal_sessions(id) ON DELETE CASCADE,
  line_id         TEXT NOT NULL,
  line_index      INTEGER NOT NULL,
  stumble_type    TEXT CHECK(stumble_type IN ('hesitation','misread','long-pause')),
  recorded_at     TEXT DEFAULT (datetime('now'))
);

-- Annotations (Feature 11 - Enhanced)
CREATE TABLE IF NOT EXISTS annotations (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  script_id       TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  line_id         TEXT NOT NULL,
  note_type       TEXT CHECK(note_type IN ('personal','blocking','emotion','director','action','exposition','beat','button')),
  content         TEXT NOT NULL,
  highlight_color TEXT,
  voice_memo_url  TEXT,
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

-- Performance Notes (Feature 01 - AI Performance Coach)
CREATE TABLE IF NOT EXISTS performance_notes (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id      TEXT NOT NULL REFERENCES rehearsal_sessions(id) ON DELETE CASCADE,
  line_id         TEXT NOT NULL,
  line_index      INTEGER NOT NULL,
  timestamp_ms    INTEGER,
  note            TEXT NOT NULL,
  category        TEXT CHECK(category IN ('pacing','energy','timing','pause','delivery')),
  severity        TEXT CHECK(severity IN ('positive','suggestion','critical')),
  created_at      TEXT DEFAULT (datetime('now'))
);

-- Interpretation Configs (Feature 06 - Objective & Obstacle)
CREATE TABLE IF NOT EXISTS interpretation_configs (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  script_id       TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  objectives_json TEXT NOT NULL,
  created_at      TEXT DEFAULT (datetime('now'))
);

-- Director Cut Notes (Feature 09)
CREATE TABLE IF NOT EXISTS director_cut_notes (
  id              TEXT PRIMARY KEY,
  script_id       TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  line_id         TEXT NOT NULL,
  line_index      INTEGER NOT NULL,
  audio_url       TEXT NOT NULL,
  director_name   TEXT NOT NULL,
  director_id     TEXT NOT NULL,
  note_set_name   TEXT DEFAULT 'default',
  created_at      TEXT DEFAULT (datetime('now'))
);

-- Ritual Presets (Feature 13)
CREATE TABLE IF NOT EXISTS ritual_presets (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  breath_inhale   REAL DEFAULT 4.0,
  breath_hold     REAL DEFAULT 4.0,
  breath_exhale   REAL DEFAULT 6.0,
  breath_cycles   INTEGER DEFAULT 3,
  motivational_audio_url TEXT,
  countdown_secs  INTEGER DEFAULT 5,
  created_at      TEXT DEFAULT (datetime('now'))
);

-- Self-Tape Takes (Feature 14)
CREATE TABLE IF NOT EXISTS self_tape_takes (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  script_id       TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  character_name  TEXT NOT NULL,
  take_number     INTEGER DEFAULT 1,
  video_url       TEXT,
  audio_url       TEXT,
  duration_secs   INTEGER,
  is_keeper       INTEGER DEFAULT 0,
  created_at      TEXT DEFAULT (datetime('now'))
);

-- Vault Entries (Feature 12)
CREATE TABLE IF NOT EXISTS vault_entries (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  script_id       TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  character_name  TEXT NOT NULL,
  genre           TEXT,
  voice_config    TEXT,
  tags            TEXT,
  last_accessed   TEXT DEFAULT (datetime('now')),
  created_at      TEXT DEFAULT (datetime('now'))
);

-- Voice Print Sessions (Feature 16)
CREATE TABLE IF NOT EXISTS voice_print_sessions (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status          TEXT DEFAULT 'in-progress' CHECK(status IN ('in-progress','completed','submitted')),
  segments_json   TEXT NOT NULL DEFAULT '[]',
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);

-- Scene Exchange Sessions (Feature 17)
CREATE TABLE IF NOT EXISTS scene_exchange_sessions (
  id              TEXT PRIMARY KEY,
  script_id       TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  host_user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  guest_user_id   TEXT REFERENCES users(id) ON DELETE SET NULL,
  status          TEXT DEFAULT 'waiting' CHECK(status IN ('waiting','active','completed')),
  host_character  TEXT NOT NULL,
  guest_character TEXT,
  created_at      TEXT DEFAULT (datetime('now'))
);

-- Masterclass Listings (Feature 18)
CREATE TABLE IF NOT EXISTS masterclass_listings (
  id              TEXT PRIMARY KEY,
  seller_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  script_title    TEXT NOT NULL,
  take_id         TEXT,
  price_cents     INTEGER NOT NULL,
  description     TEXT NOT NULL,
  audio_commentary_url TEXT,
  annotation_notes TEXT,
  rating          REAL DEFAULT 0,
  review_count    INTEGER DEFAULT 0,
  purchase_count  INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'active' CHECK(status IN ('active','draft','removed')),
  created_at      TEXT DEFAULT (datetime('now'))
);

-- Masterclass Purchases
CREATE TABLE IF NOT EXISTS masterclass_purchases (
  id              TEXT PRIMARY KEY,
  listing_id      TEXT NOT NULL REFERENCES masterclass_listings(id) ON DELETE CASCADE,
  buyer_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_cents    INTEGER NOT NULL,
  purchased_at    TEXT DEFAULT (datetime('now'))
);

-- Actor Profiles (Feature 19)
CREATE TABLE IF NOT EXISTS actor_profiles (
  id              TEXT PRIMARY KEY,
  user_id         TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name    TEXT NOT NULL,
  bio             TEXT,
  voice_samples   TEXT DEFAULT '[]',
  tier1_price     INTEGER DEFAULT 300,
  tier2_price     INTEGER DEFAULT 900,
  tier3_price     INTEGER DEFAULT 1900,
  subscriber_count INTEGER DEFAULT 0,
  total_earnings  INTEGER DEFAULT 0,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);

-- PASS Subscriptions (Feature 19)
CREATE TABLE IF NOT EXISTS pass_subscriptions (
  id              TEXT PRIMARY KEY,
  fan_user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier            INTEGER DEFAULT 1 CHECK(tier IN (1, 2, 3)),
  monthly_price   INTEGER NOT NULL,
  status          TEXT DEFAULT 'active' CHECK(status IN ('active','cancelled','expired')),
  started_at      TEXT DEFAULT (datetime('now'))
);

-- Pronunciation Dictionary (Feature 22)
CREATE TABLE IF NOT EXISTS pronunciation_dictionary (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word            TEXT NOT NULL,
  ipa             TEXT NOT NULL,
  reference_audio_url TEXT,
  client_or_industry TEXT,
  created_at      TEXT DEFAULT (datetime('now'))
);

-- Demo Reel Projects (Feature 27)
CREATE TABLE IF NOT EXISTS demo_reel_projects (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status          TEXT DEFAULT 'in-progress' CHECK(status IN ('in-progress','assembled','published')),
  segments_json   TEXT NOT NULL DEFAULT '[]',
  final_audio_url TEXT,
  profile_url     TEXT,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);

-- Client Deliveries (Feature 28)
CREATE TABLE IF NOT EXISTS client_deliveries (
  id              TEXT PRIMARY KEY,
  voice_actor_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_email    TEXT NOT NULL,
  client_name     TEXT NOT NULL,
  project_title   TEXT NOT NULL,
  audio_url       TEXT,
  invoice_cents   INTEGER NOT NULL,
  hours_worked    REAL NOT NULL,
  hourly_rate     REAL NOT NULL,
  usage_rights    TEXT NOT NULL,
  usage_duration  TEXT,
  status          TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','paid','disputed')),
  delivery_link   TEXT UNIQUE,
  created_at      TEXT DEFAULT (datetime('now'))
);

-- Rate History (Feature 29)
CREATE TABLE IF NOT EXISTS rate_history (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_type        TEXT NOT NULL,
  usage_scope     TEXT NOT NULL,
  quoted_amount   INTEGER NOT NULL,
  outcome         TEXT CHECK(outcome IN ('accepted','rejected','negotiated','pending')),
  client_name     TEXT,
  notes           TEXT,
  created_at      TEXT DEFAULT (datetime('now'))
);

-- VO Curriculum Progress (Feature 30)
CREATE TABLE IF NOT EXISTS curriculum_progress (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  genre           TEXT NOT NULL,
  current_level   INTEGER DEFAULT 1,
  completed_scripts TEXT DEFAULT '[]',
  certification_badge TEXT,
  updated_at      TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, genre)
);

-- ADR Sessions (Feature 24)
CREATE TABLE IF NOT EXISTS adr_sessions (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  script_id       TEXT REFERENCES scripts(id) ON DELETE SET NULL,
  reference_audio_url TEXT,
  reference_video_url TEXT,
  takes_json      TEXT DEFAULT '[]',
  best_sync_score REAL DEFAULT 0,
  created_at      TEXT DEFAULT (datetime('now'))
);

-- Voice Profiles (Feature 26)
CREATE TABLE IF NOT EXISTS voice_profiles (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_name    TEXT NOT NULL,
  character_name  TEXT NOT NULL,
  pitch_center    REAL,
  tempo_syllables REAL,
  dominant_resonance REAL,
  emotional_register TEXT,
  reference_audio TEXT DEFAULT '[]',
  created_at      TEXT DEFAULT (datetime('now'))
);

-- Earnings Ledger (Feature 20 - STUDIO)
CREATE TABLE IF NOT EXISTS earnings_ledger (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source          TEXT NOT NULL CHECK(source IN ('masterclass','pass','delivery','voice_licensing','coaching')),
  amount_cents    INTEGER NOT NULL,
  description     TEXT,
  reference_id    TEXT,
  created_at      TEXT DEFAULT (datetime('now'))
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
  ('performance_analytics', 1),
  ('ai_coach', 1),
  ('subtext_mode', 1),
  ('emotional_arc', 1),
  ('script_analysis', 1),
  ('line_memory', 1),
  ('objective_obstacle', 1),
  ('relationship_dynamics', 1),
  ('wildcard_mode', 1),
  ('directors_cut', 1),
  ('cold_read', 1),
  ('self_tape', 1),
  ('vault', 1),
  ('ritual_mode', 1),
  ('sleep_learning', 1),
  ('voice_print', 1),
  ('scene_exchange', 1),
  ('masterclass', 1),
  ('pass_memberships', 1),
  ('studio_dashboard', 1),
  ('audio_quality', 1),
  ('pronunciation', 1),
  ('breath_detector', 1),
  ('adr_mode', 1),
  ('copy_timing', 1),
  ('voice_consistency', 1),
  ('demo_reel', 1),
  ('client_delivery', 1),
  ('rate_calculator', 1),
  ('vo_curriculum', 1);
