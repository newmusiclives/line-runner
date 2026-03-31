import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import "dotenv/config";

async function seed() {
  const sql = neon(process.env.DATABASE_URL!);

  console.log("Seeding demo data...");

  const demoPassword = bcrypt.hashSync("demo1234", 10);
  const adminPassword = bcrypt.hashSync("admin1234", 10);

  // ── Demo User ──────────────────────────────────────────────────
  const demoExists = await sql`SELECT 1 FROM users WHERE email = 'demo@linerunner.app'`;
  if (demoExists.length === 0) {
    await sql`INSERT INTO users (id, email, name, password_hash, role) VALUES ('demo-user-001', 'demo@linerunner.app', 'Demo Actor', ${demoPassword}, 'user')`;

    // Active Studio subscription
    await sql`INSERT INTO subscriptions (id, user_id, plan_id, status, amount_cents, period, minutes_included, minutes_used, voices_included, current_period_start, current_period_end)
       VALUES ('demo-sub-001', 'demo-user-001', 'studio', 'active', 9000, 'monthly', 500, 42, 25, NOW(), NOW() + INTERVAL '30 days')`;

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
    await sql`INSERT INTO scripts (id, user_id, title, file_name, raw_text, parsed_data) VALUES ('demo-script-001', 'demo-user-001', 'Romeo and Juliet — Act 2, Scene 2', 'romeo-juliet.txt', 'Romeo and Juliet sample text', ${rjParsed})`;

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
    await sql`INSERT INTO scripts (id, user_id, title, file_name, raw_text, parsed_data) VALUES ('demo-script-002', 'demo-user-001', 'A Streetcar Named Desire — Scene 3', 'streetcar.txt', 'Streetcar sample text', ${scParsed})`;

    // Favorite
    await sql`INSERT INTO favorites (user_id, script_id) VALUES ('demo-user-001', 'demo-script-001')`;

    // Rehearsal sessions
    await sql`INSERT INTO rehearsal_sessions (id, user_id, script_id, my_character, started_at, ended_at, duration_secs, lines_total, lines_completed, furthest_line, loop_count)
       VALUES ('demo-session-001', 'demo-user-001', 'demo-script-001', 'ROMEO', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '25 minutes', 1500, 12, 10, 11, 0)`;
    await sql`INSERT INTO rehearsal_sessions (id, user_id, script_id, my_character, started_at, ended_at, duration_secs, lines_total, lines_completed, furthest_line, loop_count)
       VALUES ('demo-session-002', 'demo-user-001', 'demo-script-001', 'ROMEO', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '30 minutes', 1800, 12, 12, 12, 1)`;
    await sql`INSERT INTO rehearsal_sessions (id, user_id, script_id, my_character, started_at, ended_at, duration_secs, lines_total, lines_completed, furthest_line, loop_count)
       VALUES ('demo-session-003', 'demo-user-001', 'demo-script-002', 'BLANCHE', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', 3600, 10, 7, 8, 0)`;

    // Annotations
    await sql`INSERT INTO annotations (id, user_id, script_id, line_id, note_type, content) VALUES ('demo-ann-001', 'demo-user-001', 'demo-script-001', 'l2', 'personal', 'Start stage left, move center during speech')`;
    await sql`INSERT INTO annotations (id, user_id, script_id, line_id, note_type, content) VALUES ('demo-ann-002', 'demo-user-001', 'demo-script-001', 'l6', 'emotion', 'Build from wonder to commitment')`;
    await sql`INSERT INTO annotations (id, user_id, script_id, line_id, note_type, content) VALUES ('demo-ann-003', 'demo-user-001', 'demo-script-001', 'l10', 'blocking', 'Step forward on this line, reach toward balcony')`;

    // Bookmark
    await sql`INSERT INTO bookmarks (id, user_id, script_id, label, start_line_idx, end_line_idx) VALUES ('demo-bm-001', 'demo-user-001', 'demo-script-001', 'Balcony Exchange', 1, 9)`;

    // Script analysis
    const charArcs = JSON.stringify({ ROMEO: "Romeo begins in wonder and awe, building toward bold declaration of love.", JULIET: "Juliet starts with longing and frustration at the family divide, moving toward courageous acceptance." });
    const keyBeats = JSON.stringify([{ lineId: "l6", description: "Beat shift: Romeo declares his commitment — the scene pivots from observation to action." }]);
    const turningPoints = JSON.stringify([{ lineId: "l3", description: "Juliet's 'wherefore art thou' — the central question of the entire play." }]);
    const sugVoices = JSON.stringify({ ROMEO: { age: "young-adult", gender: "male", accent: "British RP" }, JULIET: { age: "young-adult", gender: "female", accent: "British RP" } });
    await sql`INSERT INTO script_analysis (id, script_id, genre, tone, character_arcs, key_beats, turning_points, suggested_voices, memorisation_difficulty, estimated_sessions) VALUES ('demo-analysis-001', 'demo-script-001', 'romance', 'intimate', ${charArcs}, ${keyBeats}, ${turningPoints}, ${sugVoices}, 'moderate', 5)`;
    await sql`UPDATE scripts SET genre = 'romance', tone = 'intimate' WHERE id = 'demo-script-001'`;

    // Stumble events
    await sql`INSERT INTO stumble_events (id, user_id, script_id, session_id, line_id, line_index, stumble_type) VALUES ('demo-stumble-001', 'demo-user-001', 'demo-script-001', 'demo-session-001', 'l6', 4, 'hesitation')`;
    await sql`INSERT INTO stumble_events (id, user_id, script_id, session_id, line_id, line_index, stumble_type) VALUES ('demo-stumble-002', 'demo-user-001', 'demo-script-001', 'demo-session-001', 'l8', 6, 'long-pause')`;
    await sql`INSERT INTO stumble_events (id, user_id, script_id, session_id, line_id, line_index, stumble_type) VALUES ('demo-stumble-003', 'demo-user-001', 'demo-script-001', 'demo-session-002', 'l6', 4, 'hesitation')`;

    // Performance notes
    await sql`INSERT INTO performance_notes (id, user_id, session_id, line_id, line_index, timestamp_ms, note, category, severity) VALUES ('demo-pn-001', 'demo-user-001', 'demo-session-002', 'l6', 4, 3200, 'You rushed through this line. Let each phrase land — the audience needs time.', 'pacing', 'suggestion')`;
    await sql`INSERT INTO performance_notes (id, user_id, session_id, line_id, line_index, timestamp_ms, note, category, severity) VALUES ('demo-pn-002', 'demo-user-001', 'demo-session-002', 'l10', 8, 5400, 'Strong consistency in your pacing. Your timing feels natural and grounded.', 'pacing', 'positive')`;

    // Ritual presets
    await sql`INSERT INTO ritual_presets (id, user_id, name, breath_inhale, breath_hold, breath_exhale, breath_cycles, countdown_secs) VALUES ('demo-ritual-001', 'demo-user-001', 'Audition Prep', 4, 4, 6, 3, 5)`;
    await sql`INSERT INTO ritual_presets (id, user_id, name, breath_inhale, breath_hold, breath_exhale, breath_cycles, countdown_secs) VALUES ('demo-ritual-002', 'demo-user-001', 'Quick Calm', 3, 2, 4, 2, 3)`;

    // Vault entries
    await sql`INSERT INTO vault_entries (id, user_id, script_id, character_name, genre) VALUES ('demo-vault-001', 'demo-user-001', 'demo-script-001', 'ROMEO', 'romance')`;
    await sql`INSERT INTO vault_entries (id, user_id, script_id, character_name, genre) VALUES ('demo-vault-002', 'demo-user-001', 'demo-script-002', 'BLANCHE', 'drama')`;

    // Actor profile
    await sql`INSERT INTO actor_profiles (id, user_id, display_name, bio, tier1_price, tier2_price, tier3_price, subscriber_count, total_earnings) VALUES ('demo-profile-001', 'demo-user-001', 'Demo Actor', 'Professional stage and screen actor. Shakespeare specialist with 10 years experience.', 300, 900, 1900, 42, 128500)`;

    // Earnings ledger
    await sql`INSERT INTO earnings_ledger (id, user_id, source, amount_cents, description) VALUES ('demo-earn-001', 'demo-user-001', 'masterclass', 1275, 'Masterclass: Lady Macbeth Sleepwalking')`;
    await sql`INSERT INTO earnings_ledger (id, user_id, source, amount_cents, description) VALUES ('demo-earn-002', 'demo-user-001', 'pass', 765, 'PASS Tier 2 subscription')`;
    await sql`INSERT INTO earnings_ledger (id, user_id, source, amount_cents, description) VALUES ('demo-earn-003', 'demo-user-001', 'delivery', 48500, 'Client delivery: Pharma narration')`;

    // Pronunciation dictionary
    await sql`INSERT INTO pronunciation_dictionary (id, user_id, word, ipa, client_or_industry) VALUES ('demo-pron-001', 'demo-user-001', 'acetaminophen', 'əˌsiːtəˈmɪnəfən', 'Pharmaceutical')`;
    await sql`INSERT INTO pronunciation_dictionary (id, user_id, word, ipa, client_or_industry) VALUES ('demo-pron-002', 'demo-user-001', 'pembrolizumab', 'pɛmbrəˈlɪzjuːmæb', 'Pharmaceutical')`;

    // Curriculum progress
    await sql`INSERT INTO curriculum_progress (id, user_id, genre, current_level, completed_scripts) VALUES ('demo-curr-001', 'demo-user-001', 'commercial', 2, ${JSON.stringify(["com-1-1", "com-1-2", "com-1-3"])})`;

    // Masterclass listing
    await sql`INSERT INTO masterclass_listings (id, seller_id, script_title, price_cents, description, annotation_notes, rating, review_count, purchase_count) VALUES ('demo-mc-001', 'demo-user-001', 'Romeo — Balcony Scene Approach', 1500, 'My approach to Romeo''s arc in the balcony scene. From observation to bold declaration.', 'Beat 1: Wonder. Beat 2: Resolve. Beat 3: Declaration.', 4.8, 12, 34)`;

    console.log("Demo user seeded.");
  }

  // ── Admin User ─────────────────────────────────────────────────
  const adminExists = await sql`SELECT 1 FROM users WHERE email = 'admin@linerunner.app'`;
  if (adminExists.length === 0) {
    await sql`INSERT INTO users (id, email, name, password_hash, role) VALUES ('admin-user-001', 'admin@linerunner.app', 'Site Admin', ${adminPassword}, 'admin')`;

    // Extra users
    const fakePass = bcrypt.hashSync("user1234", 10);
    const sampleUsers = [
      ["user-002", "sarah.jones@example.com", "Sarah Jones"],
      ["user-003", "marcus.chen@example.com", "Marcus Chen"],
      ["user-004", "olivia.williams@example.com", "Olivia Williams"],
      ["user-005", "james.taylor@example.com", "James Taylor"],
      ["user-006", "emma.garcia@example.com", "Emma Garcia"],
    ];
    for (const [id, email, name] of sampleUsers) {
      await sql`INSERT INTO users (id, email, name, password_hash, role) VALUES (${id}, ${email}, ${name}, ${fakePass}, 'user')`;
    }

    // Sample subscriptions
    const plans: [string, string, string, number, string, number, number, number][] = [
      ["sub-002", "user-002", "monthly", 2000, "monthly", 500, 25, -15],
      ["sub-003", "user-003", "studio", 9000, "monthly", 500, 25, -10],
      ["sub-004", "user-004", "studio", 9000, "monthly", 500, 25, -5],
      ["sub-005", "user-005", "free", 0, "monthly", 15, 3, -20],
      ["sub-006", "user-006", "monthly", 2000, "monthly", 500, 25, -2],
    ];
    for (const [id, userId, planId, cents, period, mins, voices, daysAgo] of plans) {
      const startDate = new Date(); startDate.setDate(startDate.getDate() + daysAgo);
      const endDate = new Date(); endDate.setDate(endDate.getDate() + 30);
      await sql`INSERT INTO subscriptions (id, user_id, plan_id, status, amount_cents, period, minutes_included, minutes_used, voices_included, current_period_start, current_period_end)
         VALUES (${id}, ${userId}, ${planId}, 'active', ${cents}, ${period}, ${mins}, 0, ${voices}, ${startDate.toISOString()}, ${endDate.toISOString()})`;
    }

    // Other scripts
    const otherScripts = [
      ["script-002", "user-002", "Hamlet — Act 3", "hamlet.txt"],
      ["script-003", "user-003", "Death of a Salesman", "salesman.txt"],
      ["script-004", "user-004", "The Glass Menagerie", "glass.txt"],
      ["script-005", "user-005", "Waiting for Godot", "godot.txt"],
    ];
    for (const [id, userId, title, fileName] of otherScripts) {
      await sql`INSERT INTO scripts (id, user_id, title, file_name, parsed_data) VALUES (${id}, ${userId}, ${title}, ${fileName}, ${JSON.stringify({ title, characters: [], lines: [], actCount: 1, sceneCount: 1, estimatedLength: "one-act", pageCount: 30 })})`;
    }

    // Rehearsal sessions for admin stats
    const sessionUsers = [["user-002", "script-002"], ["user-003", "script-003"], ["user-004", "script-004"]];
    for (const [userId, scriptId] of sessionUsers) {
      const daysAgo = Math.floor(Math.random() * 10);
      const start = new Date(); start.setDate(start.getDate() - daysAgo);
      const end = new Date(start.getTime() + 20 * 60000);
      await sql`INSERT INTO rehearsal_sessions (id, user_id, script_id, my_character, started_at, ended_at, duration_secs, lines_total, lines_completed, furthest_line)
         VALUES (${'session-' + userId}, ${userId}, ${scriptId}, 'Lead', ${start.toISOString()}, ${end.toISOString()}, 1200, 30, 25, 28)`;
    }

    console.log("Admin and sample users seeded.");
  }

  console.log("Seed complete!");
}

seed().catch(console.error);
