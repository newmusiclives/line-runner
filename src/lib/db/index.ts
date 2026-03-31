import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

const DB_PATH = path.join(process.cwd(), "data", "line-runner.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Run schema — inline to avoid file path issues in Next.js bundled context
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, password_hash TEXT, avatar_url TEXT, bio TEXT, is_voice_actor INTEGER DEFAULT 0, role TEXT DEFAULT 'user' CHECK(role IN ('user','admin')), created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')), suspended_at TEXT);
    CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, provider TEXT NOT NULL, provider_account_id TEXT NOT NULL, access_token TEXT, refresh_token TEXT, expires_at INTEGER, UNIQUE(provider, provider_account_id));
    CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, session_token TEXT UNIQUE NOT NULL, expires_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS scripts (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL, file_name TEXT NOT NULL, file_path TEXT, raw_text TEXT, parsed_data TEXT NOT NULL, genre TEXT, tone TEXT, status TEXT DEFAULT 'active' CHECK(status IN ('active','flagged','removed')), created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS script_analysis (id TEXT PRIMARY KEY, script_id TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE, genre TEXT, tone TEXT, character_arcs TEXT, key_beats TEXT, turning_points TEXT, suggested_voices TEXT, memorisation_difficulty TEXT CHECK(memorisation_difficulty IN ('easy','moderate','hard','very-hard')), estimated_sessions INTEGER DEFAULT 5, created_at TEXT DEFAULT (datetime('now')), UNIQUE(script_id));
    CREATE TABLE IF NOT EXISTS voice_assignments (id TEXT PRIMARY KEY, script_id TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE, character_name TEXT NOT NULL, voice_config TEXT NOT NULL, UNIQUE(script_id, character_name));
    CREATE TABLE IF NOT EXISTS rehearsal_sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, script_id TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE, my_character TEXT NOT NULL, mode TEXT DEFAULT 'standard', started_at TEXT DEFAULT (datetime('now')), ended_at TEXT, duration_secs INTEGER DEFAULT 0, lines_total INTEGER DEFAULT 0, lines_completed INTEGER DEFAULT 0, furthest_line INTEGER DEFAULT 0, loop_count INTEGER DEFAULT 0, wildcard_modifier TEXT, subtext_config TEXT, objective_config TEXT, relationship_config TEXT);
    CREATE TABLE IF NOT EXISTS line_metrics (id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES rehearsal_sessions(id) ON DELETE CASCADE, line_id TEXT NOT NULL, line_index INTEGER NOT NULL, character_name TEXT NOT NULL, timing_ms INTEGER, skipped INTEGER DEFAULT 0, replayed INTEGER DEFAULT 0, recorded_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS stumble_events (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, script_id TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE, session_id TEXT NOT NULL REFERENCES rehearsal_sessions(id) ON DELETE CASCADE, line_id TEXT NOT NULL, line_index INTEGER NOT NULL, stumble_type TEXT CHECK(stumble_type IN ('hesitation','misread','long-pause')), recorded_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS annotations (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, script_id TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE, line_id TEXT NOT NULL, note_type TEXT CHECK(note_type IN ('personal','blocking','emotion','director','action','exposition','beat','button')), content TEXT NOT NULL, highlight_color TEXT, voice_memo_url TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS bookmarks (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, script_id TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE, label TEXT NOT NULL, start_line_idx INTEGER NOT NULL, end_line_idx INTEGER NOT NULL, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS subscriptions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, plan_id TEXT NOT NULL, status TEXT DEFAULT 'active' CHECK(status IN ('active','cancelled','past_due','expired')), manifest_payment_id TEXT, manifest_sub_id TEXT, amount_cents INTEGER NOT NULL, period TEXT NOT NULL, minutes_included INTEGER NOT NULL, minutes_used INTEGER DEFAULT 0, voices_included INTEGER NOT NULL, current_period_start TEXT, current_period_end TEXT, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS favorites (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, script_id TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE, PRIMARY KEY (user_id, script_id));
    CREATE TABLE IF NOT EXISTS feature_flags (key TEXT PRIMARY KEY, enabled INTEGER DEFAULT 1, config TEXT, updated_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS audit_log (id TEXT PRIMARY KEY, admin_id TEXT NOT NULL, action TEXT NOT NULL, target_type TEXT, target_id TEXT, details TEXT, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS performance_notes (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, session_id TEXT NOT NULL REFERENCES rehearsal_sessions(id) ON DELETE CASCADE, line_id TEXT NOT NULL, line_index INTEGER NOT NULL, timestamp_ms INTEGER, note TEXT NOT NULL, category TEXT CHECK(category IN ('pacing','energy','timing','pause','delivery')), severity TEXT CHECK(severity IN ('positive','suggestion','critical')), created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS interpretation_configs (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, script_id TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE, name TEXT NOT NULL, objectives_json TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS director_cut_notes (id TEXT PRIMARY KEY, script_id TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE, line_id TEXT NOT NULL, line_index INTEGER NOT NULL, audio_url TEXT NOT NULL, director_name TEXT NOT NULL, director_id TEXT NOT NULL, note_set_name TEXT DEFAULT 'default', created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS ritual_presets (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, breath_inhale REAL DEFAULT 4.0, breath_hold REAL DEFAULT 4.0, breath_exhale REAL DEFAULT 6.0, breath_cycles INTEGER DEFAULT 3, motivational_audio_url TEXT, countdown_secs INTEGER DEFAULT 5, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS self_tape_takes (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, script_id TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE, character_name TEXT NOT NULL, take_number INTEGER DEFAULT 1, video_url TEXT, audio_url TEXT, duration_secs INTEGER, is_keeper INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS vault_entries (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, script_id TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE, character_name TEXT NOT NULL, genre TEXT, voice_config TEXT, tags TEXT, last_accessed TEXT DEFAULT (datetime('now')), created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS voice_print_sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, status TEXT DEFAULT 'in-progress' CHECK(status IN ('in-progress','completed','submitted')), segments_json TEXT NOT NULL DEFAULT '[]', created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS scene_exchange_sessions (id TEXT PRIMARY KEY, script_id TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE, host_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, guest_user_id TEXT REFERENCES users(id) ON DELETE SET NULL, status TEXT DEFAULT 'waiting' CHECK(status IN ('waiting','active','completed')), host_character TEXT NOT NULL, guest_character TEXT, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS masterclass_listings (id TEXT PRIMARY KEY, seller_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, script_title TEXT NOT NULL, take_id TEXT, price_cents INTEGER NOT NULL, description TEXT NOT NULL, audio_commentary_url TEXT, annotation_notes TEXT, rating REAL DEFAULT 0, review_count INTEGER DEFAULT 0, purchase_count INTEGER DEFAULT 0, status TEXT DEFAULT 'active' CHECK(status IN ('active','draft','removed')), created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS masterclass_purchases (id TEXT PRIMARY KEY, listing_id TEXT NOT NULL REFERENCES masterclass_listings(id) ON DELETE CASCADE, buyer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, amount_cents INTEGER NOT NULL, purchased_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS actor_profiles (id TEXT PRIMARY KEY, user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE, display_name TEXT NOT NULL, bio TEXT, voice_samples TEXT DEFAULT '[]', tier1_price INTEGER DEFAULT 300, tier2_price INTEGER DEFAULT 900, tier3_price INTEGER DEFAULT 1900, subscriber_count INTEGER DEFAULT 0, total_earnings INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS pass_subscriptions (id TEXT PRIMARY KEY, fan_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, actor_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, tier INTEGER DEFAULT 1 CHECK(tier IN (1, 2, 3)), monthly_price INTEGER NOT NULL, status TEXT DEFAULT 'active' CHECK(status IN ('active','cancelled','expired')), started_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS pronunciation_dictionary (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, word TEXT NOT NULL, ipa TEXT NOT NULL, reference_audio_url TEXT, client_or_industry TEXT, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS demo_reel_projects (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, status TEXT DEFAULT 'in-progress' CHECK(status IN ('in-progress','assembled','published')), segments_json TEXT NOT NULL DEFAULT '[]', final_audio_url TEXT, profile_url TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS client_deliveries (id TEXT PRIMARY KEY, voice_actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, client_email TEXT NOT NULL, client_name TEXT NOT NULL, project_title TEXT NOT NULL, audio_url TEXT, invoice_cents INTEGER NOT NULL, hours_worked REAL NOT NULL, hourly_rate REAL NOT NULL, usage_rights TEXT NOT NULL, usage_duration TEXT, status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','paid','disputed')), delivery_link TEXT UNIQUE, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS rate_history (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, job_type TEXT NOT NULL, usage_scope TEXT NOT NULL, quoted_amount INTEGER NOT NULL, outcome TEXT CHECK(outcome IN ('accepted','rejected','negotiated','pending')), client_name TEXT, notes TEXT, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS curriculum_progress (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, genre TEXT NOT NULL, current_level INTEGER DEFAULT 1, completed_scripts TEXT DEFAULT '[]', certification_badge TEXT, updated_at TEXT DEFAULT (datetime('now')), UNIQUE(user_id, genre));
    CREATE TABLE IF NOT EXISTS adr_sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, script_id TEXT REFERENCES scripts(id) ON DELETE SET NULL, reference_audio_url TEXT, reference_video_url TEXT, takes_json TEXT DEFAULT '[]', best_sync_score REAL DEFAULT 0, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS voice_profiles (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, project_name TEXT NOT NULL, character_name TEXT NOT NULL, pitch_center REAL, tempo_syllables REAL, dominant_resonance REAL, emotional_register TEXT, reference_audio TEXT DEFAULT '[]', created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS earnings_ledger (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, source TEXT NOT NULL CHECK(source IN ('masterclass','pass','delivery','voice_licensing','coaching')), amount_cents INTEGER NOT NULL, description TEXT, reference_id TEXT, created_at TEXT DEFAULT (datetime('now')));
    INSERT OR IGNORE INTO feature_flags (key, enabled) VALUES ('emotion_detection', 1), ('director_notes', 1), ('sound_effects', 1), ('teleprompter', 1), ('export_audio', 1), ('multi_character', 1), ('annotations', 1), ('bookmarks', 1), ('performance_analytics', 1), ('ai_coach', 1), ('subtext_mode', 1), ('emotional_arc', 1), ('script_analysis', 1), ('line_memory', 1), ('objective_obstacle', 1), ('relationship_dynamics', 1), ('wildcard_mode', 1), ('directors_cut', 1), ('cold_read', 1), ('self_tape', 1), ('vault', 1), ('ritual_mode', 1), ('sleep_learning', 1), ('voice_print', 1), ('scene_exchange', 1), ('masterclass', 1), ('pass_memberships', 1), ('studio_dashboard', 1), ('audio_quality', 1), ('pronunciation', 1), ('breath_detector', 1), ('adr_mode', 1), ('copy_timing', 1), ('voice_consistency', 1), ('demo_reel', 1), ('client_delivery', 1), ('rate_calculator', 1), ('vo_curriculum', 1);
  `);

  // Seed demo accounts
  seedDemoAccounts(db);

  return db;
}

function seedDemoAccounts(db: Database.Database) {
  const demoPassword = bcrypt.hashSync("demo1234", 10);
  const adminPassword = bcrypt.hashSync("admin1234", 10);

  // ── Demo User ──────────────────────────────────────────────────
  const demoExists = db.prepare("SELECT 1 FROM users WHERE email = ?").get("demo@linerunner.app");
  if (!demoExists) {
    db.prepare(
      "INSERT INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)"
    ).run("demo-user-001", "demo@linerunner.app", "Demo Actor", demoPassword, "user");

    // Active Studio subscription
    db.prepare(
      `INSERT INTO subscriptions (id, user_id, plan_id, status, amount_cents, period, minutes_included, minutes_used, voices_included, current_period_start, current_period_end)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now', '+30 days'))`
    ).run("demo-sub-001", "demo-user-001", "studio", "active", 9000, "monthly", 500, 42, 25);

    // Sample script: Romeo and Juliet
    const rjParsed = JSON.stringify({
      title: "Romeo and Juliet — Act 2, Scene 2",
      characters: [
        { name: "ROMEO", lineCount: 6, suggestedGender: "male", suggestedAge: "young-adult", suggestedAccent: "British RP" },
        { name: "JULIET", lineCount: 5, suggestedGender: "female", suggestedAge: "young-adult", suggestedAccent: "British RP" },
        { name: "NURSE", lineCount: 1, suggestedGender: "female", suggestedAge: "elderly", suggestedAccent: "British RP" },
      ],
      lines: [
        { id: "l1", type: "stage-direction", text: "A garden. JULIET appears above at a window." },
        { id: "l2", type: "dialogue", character: "ROMEO", text: "But, soft! What light through yonder window breaks? It is the east, and Juliet is the sun.", act: 2, scene: 2 },
        { id: "l3", type: "dialogue", character: "JULIET", text: "O Romeo, Romeo! Wherefore art thou Romeo? Deny thy father and refuse thy name; or, if thou wilt not, be but sworn my love, and I'll no longer be a Capulet.", act: 2, scene: 2 },
        { id: "l4", type: "dialogue", character: "ROMEO", text: "Shall I hear more, or shall I speak at this?", act: 2, scene: 2 },
        { id: "l5", type: "dialogue", character: "JULIET", text: "'Tis but thy name that is my enemy; thou art thyself, though not a Montague. What's Montague? O, be some other name!", act: 2, scene: 2 },
        { id: "l6", type: "dialogue", character: "ROMEO", text: "I take thee at thy word. Call me but love, and I'll be new baptized; henceforth I never will be Romeo.", act: 2, scene: 2 },
        { id: "l7", type: "dialogue", character: "JULIET", text: "What man art thou that thus bescreen'd in night so stumblest on my counsel?", act: 2, scene: 2 },
        { id: "l8", type: "dialogue", character: "ROMEO", text: "By a name I know not how to tell thee who I am. My name, dear saint, is hateful to myself, because it is an enemy to thee.", act: 2, scene: 2 },
        { id: "l9", type: "dialogue", character: "JULIET", text: "My ears have not yet drunk a hundred words of that tongue's utterance, yet I know the sound. Art thou not Romeo, and a Montague?", act: 2, scene: 2 },
        { id: "l10", type: "dialogue", character: "ROMEO", text: "Neither, fair maid, if either thee dislike.", act: 2, scene: 2 },
        { id: "l11", type: "stage-direction", text: "NURSE calls from within." },
        { id: "l12", type: "dialogue", character: "NURSE", text: "Madam!", act: 2, scene: 2 },
        { id: "l13", type: "dialogue", character: "JULIET", text: "A thousand times good night!", act: 2, scene: 2 },
        { id: "l14", type: "dialogue", character: "ROMEO", text: "A thousand times the worse, to want thy light. Love goes toward love, as schoolboys from their books; but love from love, toward school with heavy looks.", act: 2, scene: 2 },
      ],
      actCount: 1, sceneCount: 1, estimatedLength: "short-episode", pageCount: 2,
    });
    db.prepare(
      "INSERT INTO scripts (id, user_id, title, file_name, raw_text, parsed_data) VALUES (?, ?, ?, ?, ?, ?)"
    ).run("demo-script-001", "demo-user-001", "Romeo and Juliet — Act 2, Scene 2", "romeo-juliet.txt", "Romeo and Juliet sample text", rjParsed);

    // Sample script: A Streetcar Named Desire
    const scParsed = JSON.stringify({
      title: "A Streetcar Named Desire — Scene 3",
      characters: [
        { name: "BLANCHE", lineCount: 4, suggestedGender: "female", suggestedAge: "adult", suggestedAccent: "Southern US" },
        { name: "STANLEY", lineCount: 3, suggestedGender: "male", suggestedAge: "adult", suggestedAccent: "New York" },
        { name: "STELLA", lineCount: 3, suggestedGender: "female", suggestedAge: "young-adult", suggestedAccent: "Southern US" },
      ],
      lines: [
        { id: "s1", type: "stage-direction", text: "The poker night. Stanley's apartment. Blanche enters." },
        { id: "s2", type: "dialogue", character: "BLANCHE", text: "I have always depended on the kindness of strangers.", act: 1, scene: 3 },
        { id: "s3", type: "dialogue", character: "STANLEY", text: "Hey, Stella!", act: 1, scene: 3 },
        { id: "s4", type: "dialogue", character: "STELLA", text: "Stanley, you come back here and apologize!", act: 1, scene: 3 },
        { id: "s5", type: "dialogue", character: "BLANCHE", text: "I don't want realism. I want magic!", act: 1, scene: 3 },
        { id: "s6", type: "dialogue", character: "STANLEY", text: "I've been on to you from the start!", act: 1, scene: 3 },
        { id: "s7", type: "dialogue", character: "STELLA", text: "You didn't need to do that.", act: 1, scene: 3 },
        { id: "s8", type: "dialogue", character: "BLANCHE", text: "Whoever you are, I have always depended on the kindness of strangers.", act: 1, scene: 3 },
        { id: "s9", type: "dialogue", character: "STANLEY", text: "We've had this date with each other from the beginning.", act: 1, scene: 3 },
        { id: "s10", type: "dialogue", character: "STELLA", text: "Don't you touch her!", act: 1, scene: 3 },
        { id: "s11", type: "dialogue", character: "BLANCHE", text: "I shall die of a broken heart.", act: 1, scene: 3 },
      ],
      actCount: 1, sceneCount: 1, estimatedLength: "short-episode", pageCount: 2,
    });
    db.prepare(
      "INSERT INTO scripts (id, user_id, title, file_name, raw_text, parsed_data) VALUES (?, ?, ?, ?, ?, ?)"
    ).run("demo-script-002", "demo-user-001", "A Streetcar Named Desire — Scene 3", "streetcar.txt", "Streetcar sample text", scParsed);

    // Favorite the first script
    db.prepare("INSERT INTO favorites (user_id, script_id) VALUES (?, ?)").run("demo-user-001", "demo-script-001");

    // Sample rehearsal sessions
    db.prepare(
      `INSERT INTO rehearsal_sessions (id, user_id, script_id, my_character, started_at, ended_at, duration_secs, lines_total, lines_completed, furthest_line, loop_count)
       VALUES (?, ?, ?, ?, datetime('now', '-3 days'), datetime('now', '-3 days', '+25 minutes'), 1500, 12, 10, 11, 0)`
    ).run("demo-session-001", "demo-user-001", "demo-script-001", "ROMEO");

    db.prepare(
      `INSERT INTO rehearsal_sessions (id, user_id, script_id, my_character, started_at, ended_at, duration_secs, lines_total, lines_completed, furthest_line, loop_count)
       VALUES (?, ?, ?, ?, datetime('now', '-1 days'), datetime('now', '-1 days', '+30 minutes'), 1800, 12, 12, 12, 1)`
    ).run("demo-session-002", "demo-user-001", "demo-script-001", "ROMEO");

    db.prepare(
      `INSERT INTO rehearsal_sessions (id, user_id, script_id, my_character, started_at, ended_at, duration_secs, lines_total, lines_completed, furthest_line, loop_count)
       VALUES (?, ?, ?, ?, datetime('now', '-2 hours'), datetime('now', '-1 hours'), 3600, 10, 7, 8, 0)`
    ).run("demo-session-003", "demo-user-001", "demo-script-002", "BLANCHE");

    // Sample annotations
    db.prepare("INSERT INTO annotations (id, user_id, script_id, line_id, note_type, content) VALUES (?, ?, ?, ?, ?, ?)")
      .run("demo-ann-001", "demo-user-001", "demo-script-001", "l2", "personal", "Start stage left, move center during speech");
    db.prepare("INSERT INTO annotations (id, user_id, script_id, line_id, note_type, content) VALUES (?, ?, ?, ?, ?, ?)")
      .run("demo-ann-002", "demo-user-001", "demo-script-001", "l6", "emotion", "Build from wonder to commitment");
    db.prepare("INSERT INTO annotations (id, user_id, script_id, line_id, note_type, content) VALUES (?, ?, ?, ?, ?, ?)")
      .run("demo-ann-003", "demo-user-001", "demo-script-001", "l10", "blocking", "Step forward on this line, reach toward balcony");

    // Sample bookmark
    db.prepare("INSERT INTO bookmarks (id, user_id, script_id, label, start_line_idx, end_line_idx) VALUES (?, ?, ?, ?, ?, ?)")
      .run("demo-bm-001", "demo-user-001", "demo-script-001", "Balcony Exchange", 1, 9);

    // ── Feature demo data ───────────────────────────────────────

    // Script analysis (Feature 04)
    db.prepare(`INSERT INTO script_analysis (id, script_id, genre, tone, character_arcs, key_beats, turning_points, suggested_voices, memorisation_difficulty, estimated_sessions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run("demo-analysis-001", "demo-script-001", "romance", "intimate",
        JSON.stringify({ ROMEO: "Romeo begins in wonder and awe, building toward bold declaration of love.", JULIET: "Juliet starts with longing and frustration at the family divide, moving toward courageous acceptance." }),
        JSON.stringify([{ lineId: "l6", description: "Beat shift: Romeo declares his commitment — the scene pivots from observation to action." }]),
        JSON.stringify([{ lineId: "l3", description: "Juliet's 'wherefore art thou' — the central question of the entire play." }]),
        JSON.stringify({ ROMEO: { age: "young-adult", gender: "male", accent: "British RP" }, JULIET: { age: "young-adult", gender: "female", accent: "British RP" } }),
        "moderate", 5);
    db.prepare("UPDATE scripts SET genre = 'romance', tone = 'intimate' WHERE id = 'demo-script-001'").run();

    // Stumble events (Feature 05)
    db.prepare("INSERT INTO stumble_events (id, user_id, script_id, session_id, line_id, line_index, stumble_type) VALUES (?, ?, ?, ?, ?, ?, ?)").run("demo-stumble-001", "demo-user-001", "demo-script-001", "demo-session-001", "l6", 4, "hesitation");
    db.prepare("INSERT INTO stumble_events (id, user_id, script_id, session_id, line_id, line_index, stumble_type) VALUES (?, ?, ?, ?, ?, ?, ?)").run("demo-stumble-002", "demo-user-001", "demo-script-001", "demo-session-001", "l8", 6, "long-pause");
    db.prepare("INSERT INTO stumble_events (id, user_id, script_id, session_id, line_id, line_index, stumble_type) VALUES (?, ?, ?, ?, ?, ?, ?)").run("demo-stumble-003", "demo-user-001", "demo-script-001", "demo-session-002", "l6", 4, "hesitation");

    // Performance notes (Feature 01)
    db.prepare("INSERT INTO performance_notes (id, user_id, session_id, line_id, line_index, timestamp_ms, note, category, severity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run("demo-pn-001", "demo-user-001", "demo-session-002", "l6", 4, 3200, "You rushed through this line. Let each phrase land — the audience needs time.", "pacing", "suggestion");
    db.prepare("INSERT INTO performance_notes (id, user_id, session_id, line_id, line_index, timestamp_ms, note, category, severity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run("demo-pn-002", "demo-user-001", "demo-session-002", "l10", 8, 5400, "Strong consistency in your pacing. Your timing feels natural and grounded.", "pacing", "positive");

    // Ritual preset (Feature 13)
    db.prepare("INSERT INTO ritual_presets (id, user_id, name, breath_inhale, breath_hold, breath_exhale, breath_cycles, countdown_secs) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run("demo-ritual-001", "demo-user-001", "Audition Prep", 4, 4, 6, 3, 5);
    db.prepare("INSERT INTO ritual_presets (id, user_id, name, breath_inhale, breath_hold, breath_exhale, breath_cycles, countdown_secs) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run("demo-ritual-002", "demo-user-001", "Quick Calm", 3, 2, 4, 2, 3);

    // Vault entry (Feature 12)
    db.prepare("INSERT INTO vault_entries (id, user_id, script_id, character_name, genre) VALUES (?, ?, ?, ?, ?)").run("demo-vault-001", "demo-user-001", "demo-script-001", "ROMEO", "romance");
    db.prepare("INSERT INTO vault_entries (id, user_id, script_id, character_name, genre) VALUES (?, ?, ?, ?, ?)").run("demo-vault-002", "demo-user-001", "demo-script-002", "BLANCHE", "drama");

    // Actor profile (Feature 19)
    db.prepare("INSERT INTO actor_profiles (id, user_id, display_name, bio, tier1_price, tier2_price, tier3_price, subscriber_count, total_earnings) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run("demo-profile-001", "demo-user-001", "Demo Actor", "Professional stage and screen actor. Shakespeare specialist with 10 years experience.", 300, 900, 1900, 42, 128500);

    // Earnings ledger (Feature 20)
    db.prepare("INSERT INTO earnings_ledger (id, user_id, source, amount_cents, description) VALUES (?, ?, ?, ?, ?)").run("demo-earn-001", "demo-user-001", "masterclass", 1275, "Masterclass: Lady Macbeth Sleepwalking");
    db.prepare("INSERT INTO earnings_ledger (id, user_id, source, amount_cents, description) VALUES (?, ?, ?, ?, ?)").run("demo-earn-002", "demo-user-001", "pass", 765, "PASS Tier 2 subscription");
    db.prepare("INSERT INTO earnings_ledger (id, user_id, source, amount_cents, description) VALUES (?, ?, ?, ?, ?)").run("demo-earn-003", "demo-user-001", "delivery", 48500, "Client delivery: Pharma narration");

    // Pronunciation dictionary (Feature 22)
    db.prepare("INSERT INTO pronunciation_dictionary (id, user_id, word, ipa, client_or_industry) VALUES (?, ?, ?, ?, ?)").run("demo-pron-001", "demo-user-001", "acetaminophen", "əˌsiːtəˈmɪnəfən", "Pharmaceutical");
    db.prepare("INSERT INTO pronunciation_dictionary (id, user_id, word, ipa, client_or_industry) VALUES (?, ?, ?, ?, ?)").run("demo-pron-002", "demo-user-001", "pembrolizumab", "pɛmbrəˈlɪzjuːmæb", "Pharmaceutical");

    // Curriculum progress (Feature 30)
    db.prepare("INSERT INTO curriculum_progress (id, user_id, genre, current_level, completed_scripts) VALUES (?, ?, ?, ?, ?)").run("demo-curr-001", "demo-user-001", "commercial", 2, JSON.stringify(["com-1-1", "com-1-2", "com-1-3"]));

    // Masterclass listing (Feature 18)
    db.prepare("INSERT INTO masterclass_listings (id, seller_id, script_title, price_cents, description, annotation_notes, rating, review_count, purchase_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run("demo-mc-001", "demo-user-001", "Romeo — Balcony Scene Approach", 1500, "My approach to Romeo's arc in the balcony scene. From observation to bold declaration.", "Beat 1: Wonder. Beat 2: Resolve. Beat 3: Declaration.", 4.8, 12, 34);
  }

  // ── Admin User ─────────────────────────────────────────────────
  const adminExists = db.prepare("SELECT 1 FROM users WHERE email = ?").get("admin@linerunner.app");
  if (!adminExists) {
    db.prepare(
      "INSERT INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)"
    ).run("admin-user-001", "admin@linerunner.app", "Site Admin", adminPassword, "admin");

    // Seed some extra users so the admin panel has data to show
    const fakePass = bcrypt.hashSync("user1234", 10);
    const sampleUsers = [
      ["user-002", "sarah.jones@example.com", "Sarah Jones"],
      ["user-003", "marcus.chen@example.com", "Marcus Chen"],
      ["user-004", "olivia.williams@example.com", "Olivia Williams"],
      ["user-005", "james.taylor@example.com", "James Taylor"],
      ["user-006", "emma.garcia@example.com", "Emma Garcia"],
    ];
    for (const [id, email, name] of sampleUsers) {
      db.prepare("INSERT INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)").run(id, email, name, fakePass, "user");
    }

    // Sample subscriptions for revenue data
    const plans = [
      ["sub-002", "user-002", "monthly", 3000, "monthly", 500, 25, -15],
      ["sub-003", "user-003", "studio", 9000, "monthly", 500, 25, -10],
      ["sub-004", "user-004", "studio", 9000, "monthly", 500, 25, -5],
      ["sub-005", "user-005", "free", 0, "monthly", 15, 3, -20],
      ["sub-006", "user-006", "monthly", 3000, "monthly", 500, 25, -2],
    ];
    for (const [id, userId, planId, cents, period, mins, voices, daysAgo] of plans) {
      db.prepare(
        `INSERT INTO subscriptions (id, user_id, plan_id, status, amount_cents, period, minutes_included, minutes_used, voices_included, current_period_start, current_period_end)
         VALUES (?, ?, ?, 'active', ?, ?, ?, 0, ?, datetime('now', '${daysAgo} days'), datetime('now', '+30 days'))`
      ).run(id, userId, planId, cents, period, mins, voices);
    }

    // Sample scripts for other users (so admin has scripts to moderate)
    const otherScripts = [
      ["script-002", "user-002", "Hamlet — Act 3", "hamlet.txt"],
      ["script-003", "user-003", "Death of a Salesman", "salesman.txt"],
      ["script-004", "user-004", "The Glass Menagerie", "glass.txt"],
      ["script-005", "user-005", "Waiting for Godot", "godot.txt"],
    ];
    for (const [id, userId, title, fileName] of otherScripts) {
      db.prepare(
        "INSERT INTO scripts (id, user_id, title, file_name, parsed_data) VALUES (?, ?, ?, ?, ?)"
      ).run(id, userId, title, fileName, JSON.stringify({ title, characters: [], lines: [], actCount: 1, sceneCount: 1, estimatedLength: "one-act", pageCount: 30 }));
    }

    // Seed some rehearsal sessions for admin stats
    for (const [userId, scriptId] of [["user-002", "script-002"], ["user-003", "script-003"], ["user-004", "script-004"]]) {
      db.prepare(
        `INSERT INTO rehearsal_sessions (id, user_id, script_id, my_character, started_at, ended_at, duration_secs, lines_total, lines_completed, furthest_line)
         VALUES (?, ?, ?, 'Lead', datetime('now', '-${Math.floor(Math.random() * 10)} days'), datetime('now', '-${Math.floor(Math.random() * 10)} days', '+20 minutes'), 1200, 30, 25, 28)`
      ).run(`session-${userId}`, userId, scriptId);
    }
  }
}
