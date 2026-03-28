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
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, password_hash TEXT, avatar_url TEXT, role TEXT DEFAULT 'user' CHECK(role IN ('user','admin')), created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')), suspended_at TEXT);
    CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, provider TEXT NOT NULL, provider_account_id TEXT NOT NULL, access_token TEXT, refresh_token TEXT, expires_at INTEGER, UNIQUE(provider, provider_account_id));
    CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, session_token TEXT UNIQUE NOT NULL, expires_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS scripts (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL, file_name TEXT NOT NULL, file_path TEXT, raw_text TEXT, parsed_data TEXT NOT NULL, status TEXT DEFAULT 'active' CHECK(status IN ('active','flagged','removed')), created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS voice_assignments (id TEXT PRIMARY KEY, script_id TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE, character_name TEXT NOT NULL, voice_config TEXT NOT NULL, UNIQUE(script_id, character_name));
    CREATE TABLE IF NOT EXISTS rehearsal_sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, script_id TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE, my_character TEXT NOT NULL, started_at TEXT DEFAULT (datetime('now')), ended_at TEXT, duration_secs INTEGER DEFAULT 0, lines_total INTEGER DEFAULT 0, lines_completed INTEGER DEFAULT 0, furthest_line INTEGER DEFAULT 0, loop_count INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS line_metrics (id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES rehearsal_sessions(id) ON DELETE CASCADE, line_id TEXT NOT NULL, line_index INTEGER NOT NULL, character_name TEXT NOT NULL, timing_ms INTEGER, skipped INTEGER DEFAULT 0, replayed INTEGER DEFAULT 0, recorded_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS annotations (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, script_id TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE, line_id TEXT NOT NULL, note_type TEXT CHECK(note_type IN ('personal','blocking','emotion','director')), content TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS bookmarks (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, script_id TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE, label TEXT NOT NULL, start_line_idx INTEGER NOT NULL, end_line_idx INTEGER NOT NULL, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS subscriptions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, plan_id TEXT NOT NULL, status TEXT DEFAULT 'active' CHECK(status IN ('active','cancelled','past_due','expired')), manifest_payment_id TEXT, manifest_sub_id TEXT, amount_cents INTEGER NOT NULL, period TEXT NOT NULL, minutes_included INTEGER NOT NULL, minutes_used INTEGER DEFAULT 0, voices_included INTEGER NOT NULL, current_period_start TEXT, current_period_end TEXT, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS favorites (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, script_id TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE, PRIMARY KEY (user_id, script_id));
    CREATE TABLE IF NOT EXISTS feature_flags (key TEXT PRIMARY KEY, enabled INTEGER DEFAULT 1, config TEXT, updated_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS audit_log (id TEXT PRIMARY KEY, admin_id TEXT NOT NULL, action TEXT NOT NULL, target_type TEXT, target_id TEXT, details TEXT, created_at TEXT DEFAULT (datetime('now')));
    INSERT OR IGNORE INTO feature_flags (key, enabled) VALUES ('emotion_detection', 1), ('director_notes', 1), ('sound_effects', 1), ('teleprompter', 1), ('export_audio', 1), ('multi_character', 1), ('annotations', 1), ('bookmarks', 1), ('performance_analytics', 1);
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

    // Active monthly subscription
    db.prepare(
      `INSERT INTO subscriptions (id, user_id, plan_id, status, amount_cents, period, minutes_included, minutes_used, voices_included, current_period_start, current_period_end)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now', '+30 days'))`
    ).run("demo-sub-001", "demo-user-001", "monthly", "active", 10000, "monthly", 500, 42, 25);

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
      ["sub-002", "user-002", "monthly", 10000, "monthly", 500, 25, -15],
      ["sub-003", "user-003", "three-act-pass", 6000, "one-time", 120, 20, -10],
      ["sub-004", "user-004", "annual", 96000, "annual", 500, 25, -5],
      ["sub-005", "user-005", "single-script", 1000, "one-time", 15, 5, -20],
      ["sub-006", "user-006", "monthly", 10000, "monthly", 500, 25, -2],
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
