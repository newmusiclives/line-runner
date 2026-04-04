import type { VOGenre, CurriculumLevel, CurriculumModule } from "@/types";

// ─── Types for expanded curriculum ─────────────────────────

export type CurriculumDifficulty = "beginner" | "intermediate" | "advanced" | "professional" | "master";

export interface CurriculumScript {
  id: string;
  genre: string;
  level: CurriculumDifficulty;
  title: string;
  text: string;
  direction: string;
  targetDuration: number;
  tips: string[];
}

// ─── Constants ─────────────────────────

export const GENRES = [
  "commercial",
  "narration",
  "character",
  "promo",
  "medical",
  "e-learning",
  "trailer",
] as const;

export const LEVELS: CurriculumDifficulty[] = [
  "beginner",
  "intermediate",
  "advanced",
  "professional",
  "master",
];

// ─── Legacy labels (backward compat) ─────────────────────────

export const GENRE_LABELS: Record<VOGenre, string> = {
  commercial: "Commercial",
  audiobook: "Audiobook Narration",
  narration: "Narration",
  "e-learning": "E-Learning & Corporate",
  character: "Character & Animation",
  medical: "Medical & Technical",
  promo: "Promo & Imaging",
  podcast: "Podcast & Documentary",
  trailer: "Trailer",
};

export const GENRE_DESCRIPTIONS: Record<VOGenre, string> = {
  commercial:
    "The bread and butter of voice acting. Learn to sell products and services with warmth, energy, and authenticity across TV, radio, and digital formats.",
  audiobook:
    "Long-form narrative requires stamina, character differentiation, and the ability to maintain a listener's attention for hours. The fastest-growing VO segment.",
  narration:
    "Documentary, audiobook, and corporate narration. Authoritative yet engaging delivery that guides the listener through complex stories and information.",
  "e-learning":
    "Corporate training, educational content, and instructional material. Clear, authoritative, and engaging delivery that makes complex information accessible.",
  character:
    "Animation, video games, and character work. Transform your voice into distinct personalities with unique vocal signatures, accents, and emotional ranges.",
  medical:
    "Pharmaceutical advertising, medical training, and health content. Precise pronunciation and authoritative delivery in the highest-paying VO category.",
  promo:
    "TV and radio promos, station imaging, and trailer narration. High-energy, dramatic delivery that captures attention in seconds.",
  podcast:
    "Documentary narration, podcast hosting, and audio journalism. Conversational authority that keeps listeners engaged through story and information.",
  trailer:
    "Movie trailers, game trailers, and event promos. Epic, cinematic delivery with dramatic pacing and powerful emotional impact.",
};

export const LEVEL_LABELS: Record<CurriculumLevel, string> = {
  1: "Foundational",
  2: "Developing",
  3: "Intermediate",
  4: "Advanced",
  5: "Professional",
};

// ─── Level mapping helpers ─────────────────────────

const DIFFICULTY_TO_NUMERIC: Record<CurriculumDifficulty, CurriculumLevel> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  professional: 4,
  master: 5,
};

// ─── Legacy getCurriculumModule (backward compat) ─────────────────────────

export function getCurriculumModule(
  genre: VOGenre,
  level: CurriculumLevel
): CurriculumModule {
  const difficulty = LEVELS[level - 1];
  const scripts = CURRICULUM_SCRIPTS.filter(
    (s) => s.genre === genre && s.level === difficulty
  ).map((s) => ({
    id: s.id,
    title: s.title,
    text: s.text,
    passCriteria: {
      consistencyMin: 60 + level * 10,
      timingAccuracyMin: 50 + level * 10,
      deliveryConfidenceMin: 55 + level * 10,
    },
  }));
  return { genre, level, scripts };
}

// ─── Helpers ─────────────────────────

export function getCurriculumByGenre(genre: string): CurriculumScript[] {
  return CURRICULUM_SCRIPTS.filter((s) => s.genre === genre);
}

export function getCurriculumByLevel(level: string): CurriculumScript[] {
  return CURRICULUM_SCRIPTS.filter((s) => s.level === level);
}

export function getCurriculumScript(
  id: string
): CurriculumScript | undefined {
  return CURRICULUM_SCRIPTS.find((s) => s.id === id);
}

// ─── 105 Training Scripts: 7 genres x 5 levels x 3 scripts ─────────────────

export const CURRICULUM_SCRIPTS: CurriculumScript[] = [
  // ═══════════════════════════════════════════════════════════════
  // COMMERCIAL — TV/radio ads, product spots
  // ═══════════════════════════════════════════════════════════════

  // Commercial – Beginner
  {
    id: "com-b-1",
    genre: "commercial",
    level: "beginner",
    title: "Friendly Coffee Brand",
    text: "Start your morning the way it was meant to be. Rich, smooth, and perfectly roasted — every cup of Sunrise Blend is crafted from hand-selected beans grown in the highlands of Colombia. Because you deserve a moment that's just for you.",
    direction: "Warm, inviting, like talking to a friend over coffee. Smile through the read.",
    targetDuration: 15,
    tips: [
      "Let the warmth come from your tone, not from pushing energy",
      "Slow down on 'just for you' — let it land personally",
      "Imagine you are sharing your favorite morning ritual",
    ],
  },
  {
    id: "com-b-2",
    genre: "commercial",
    level: "beginner",
    title: "Local Car Dealership",
    text: "This weekend only at Riverside Motors — every vehicle in our lot is priced to move. Zero down, zero interest for 60 months on select models. Trucks, SUVs, sedans — if it has four wheels, we've got a deal for you. Riverside Motors, where the road meets the river.",
    direction: "Upbeat, clear, and enthusiastic. Classic retail energy without being obnoxious.",
    targetDuration: 15,
    tips: [
      "Keep the energy consistent — do not peak too early",
      "Punch the numbers: 'zero down, zero interest, 60 months'",
      "Land the tagline with confidence, slightly slower pace",
    ],
  },
  {
    id: "com-b-3",
    genre: "commercial",
    level: "beginner",
    title: "Gentle Skincare",
    text: "Your skin tells a story. Let it be a beautiful one. Petal & Stone — dermatologist-developed skincare that works with your skin's natural balance. No harsh chemicals. No complicated routines. Just you, naturally radiant.",
    direction: "Soft, genuine, aspirational. Think spa-day calm with quiet confidence.",
    targetDuration: 14,
    tips: [
      "Keep your voice in a lower, more intimate register",
      "Let pauses do the work between short sentences",
      "The brand name should feel elegant, not punchy",
    ],
  },

  // Commercial – Intermediate
  {
    id: "com-i-1",
    genre: "commercial",
    level: "intermediate",
    title: "Tech Product Launch",
    text: "Introducing the all-new Nexus Pro. Thinner. Faster. Smarter. With an AI-powered processor that learns how you work and adapts in real time. Battery life that lasts from sunrise to well past sunset. This isn't just the next generation — it's the next era.",
    direction: "Confident and forward-leaning. Build momentum with each feature, climax on the tagline.",
    targetDuration: 16,
    tips: [
      "Use staccato pacing on 'Thinner. Faster. Smarter.' — each word is its own beat",
      "Build vocal energy progressively through the feature list",
      "The final line needs gravitas — slow down and drop pitch slightly",
    ],
  },
  {
    id: "com-i-2",
    genre: "commercial",
    level: "intermediate",
    title: "Insurance (Warm Authority)",
    text: "Life changes fast. A new home. A growing family. A business that's finally taking off. At Lighthouse Insurance, we don't just cover what you have — we protect what matters most. Call us. Let's build a plan that grows with you.",
    direction: "Empathetic but authoritative. You are a trusted advisor, not a salesperson.",
    targetDuration: 15,
    tips: [
      "Match the emotional weight of each life change as you list them",
      "Shift from listing to personal connection at 'we protect what matters most'",
      "The CTA should feel like an invitation, not a demand",
    ],
  },
  {
    id: "com-i-3",
    genre: "commercial",
    level: "intermediate",
    title: "Fast Food (High Energy)",
    text: "Hungry? We thought so. The Triple Stack is BACK — three patties, three cheeses, and our secret smoky sauce that keeps you coming back. For a limited time, grab one for just five ninety-nine. The Triple Stack. Only at Burger Republic.",
    direction: "Big, fun, mouth-watering energy. Make the listener crave it.",
    targetDuration: 13,
    tips: [
      "Hit 'BACK' with real excitement — it is the hook of the spot",
      "Describe the food with relish — let your voice convey taste",
      "Urgency on 'limited time' without sounding desperate",
    ],
  },

  // Commercial – Advanced
  {
    id: "com-a-1",
    genre: "commercial",
    level: "advanced",
    title: "Luxury Automotive",
    text: "There's a road that only exists when you're behind this wheel. Where the engine whispers instead of roars. Where every curve feels like it was carved just for you. The all-new Meridian GTS. Engineered for those who drive, not just arrive.",
    direction: "Cinematic, understated luxury. Every word should feel hand-placed.",
    targetDuration: 18,
    tips: [
      "Resist the urge to sell — let the imagery do the work",
      "Use breath and pace to create a sense of open road and freedom",
      "The tagline is a philosophical statement; deliver it with quiet certainty",
    ],
  },
  {
    id: "com-a-2",
    genre: "commercial",
    level: "advanced",
    title: "Pharmaceutical DTC",
    text: "Living with moderate to severe plaque psoriasis means living with more than just symptoms. It means missed moments. Cancelled plans. ClearPath may help. In clinical trials, 8 out of 10 patients saw clearer skin in just 12 weeks. Ask your doctor if ClearPath is right for you.",
    direction: "Empathetic and hopeful. Balance medical authority with human warmth.",
    targetDuration: 18,
    tips: [
      "The opening needs genuine empathy — you understand their struggle",
      "Transition to hope at 'ClearPath may help' with a subtle lift",
      "Clinical data should sound reassuring, not clinical or cold",
    ],
  },
  {
    id: "com-a-3",
    genre: "commercial",
    level: "advanced",
    title: "Non-Profit Emotional Appeal",
    text: "Every night, 1.5 million children in this country go to bed hungry. Not in some distant country. Here. In our cities, our neighbourhoods, our schools. One meal can change a child's entire day. Will you be the one who provides it?",
    direction: "Heartfelt, urgent without being manipulative. Let the facts carry emotional weight.",
    targetDuration: 16,
    tips: [
      "Let 'Here.' land with full weight — it is the turning point of the spot",
      "Build from informational to personal as you move through the copy",
      "The final question should feel like a direct, genuine ask — not guilt",
    ],
  },

  // Commercial – Professional
  {
    id: "com-p-1",
    genre: "commercial",
    level: "professional",
    title: "30-Second Hard Sell with Tone Shifts",
    text: "Saturday! Saturday! SATURDAY! Monster Truck Madness returns to the Coliseum! Watch ten-ton machines CRUSH, SMASH, and FLY through the air! Tickets start at just fifteen dollars! Kids under five are FREE! This Saturday at seven PM — BE THERE!",
    direction: "Classic hard sell with escalating energy. Each line should top the last. Find the fun in the excess.",
    targetDuration: 12,
    tips: [
      "This is a performance piece — commit fully to the energy or it falls flat",
      "Find distinct emphasis patterns for each exclamation to avoid monotony",
      "The price points need to cut through the energy clearly — do not mumble numbers",
    ],
  },
  {
    id: "com-p-2",
    genre: "commercial",
    level: "professional",
    title: "Brand Manifesto with Emotional Arc",
    text: "We didn't set out to change the world. We just wanted to make a better cup of coffee. Twenty years later, every bag we roast still starts with a handshake and a promise — from the farmer who grew it, to the hands that will brew it. Some things shouldn't be automated.",
    direction: "Reflective, authentic, with a quiet pride that builds. This is a founder's story told simply.",
    targetDuration: 18,
    tips: [
      "Start conversational and humble — 'we didn't set out' should feel like genuine reflection",
      "Build subtle pride through the middle without becoming self-congratulatory",
      "The final line is the thesis — deliver it as a core belief, not a tagline",
    ],
  },
  {
    id: "com-p-3",
    genre: "commercial",
    level: "professional",
    title: "Dual-Tone Spot (Serious to Playful)",
    text: "Every year, Americans throw away 80 billion dollars' worth of food. Eighty. Billion. But what if your leftovers could become tomorrow's best meal? FreshSave containers keep food fresh up to five times longer. Stop trashing your groceries. Start trashing your excuses.",
    direction: "Open with sobering authority, then shift to clever and upbeat for the product. Two distinct tones in one spot.",
    targetDuration: 16,
    tips: [
      "The tonal shift at 'But what if' is the hinge — practice the pivot precisely",
      "Let the repeated 'Eighty. Billion.' land with disbelief and weight",
      "Close with wit — the last line should make the listener smirk",
    ],
  },

  // Commercial – Master
  {
    id: "com-m-1",
    genre: "commercial",
    level: "master",
    title: "Live Session Simulation",
    text: "Okay, let's try this with a bit more warmth on 'family' and can you pick up the pace in the middle section? Also the client wants to hear an alt take that's more conversational, less announcer. Ready? And... Crest isn't just toothpaste. It's your family's first smile of the day. And the last one before bed. For over sixty years, that's been enough for us.",
    direction: "Simulate a live directed session. Deliver the direction as context, then perform the script with adjustments incorporated. Show range between takes.",
    targetDuration: 20,
    tips: [
      "Treat the direction as if a real producer is in your ear — internalize, do not perform the direction",
      "Your first take should sound natural, then show you can adjust on the fly",
      "This tests adaptability — the ability to take direction and execute instantly is what books work",
    ],
  },
  {
    id: "com-m-2",
    genre: "commercial",
    level: "master",
    title: "Multi-Spot Campaign (Three Lengths)",
    text: "Spot A — fifteen seconds: When the sun comes up, so does your energy. Zest Morning Blend — wake up to what's possible. Spot B — thirty seconds: Some mornings, you need more than coffee. You need a reason to move. Zest Morning Blend is triple-roasted for maximum flavour and minimum bitterness. Available wherever great coffee is sold. Spot C — ten seconds: Zest. Wake up to what's possible.",
    direction: "Same brand voice across three time formats. Adjust pacing and emphasis for each length while maintaining consistent brand character.",
    targetDuration: 55,
    tips: [
      "Each spot length demands different pacing math — practice hitting exact times",
      "The 10-second spot must be complete and satisfying, not just a truncation",
      "Brand consistency across lengths is what separates working pros from amateurs",
    ],
  },
  {
    id: "com-m-3",
    genre: "commercial",
    level: "master",
    title: "Whisper-to-Shout Dynamic Range",
    text: "They said you couldn't do it. That you were too young. Too inexperienced. Too different. And maybe they were right — about all of it. But here you are. Standing where they said you'd never stand. NIKE. Just do it.",
    direction: "Begin barely above a whisper. Build incrementally. The final line should fill the room. Extreme dynamic range in 15 seconds.",
    targetDuration: 15,
    tips: [
      "Your whisper must still be fully supported and intelligible on mic",
      "Each sentence should be a measurable step up in volume and intensity",
      "The brand name and tagline must hit with full power — this is the payoff of the build",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // NARRATION — documentary, audiobook, corporate
  // ═══════════════════════════════════════════════════════════════

  // Narration – Beginner
  {
    id: "nar-b-1",
    genre: "narration",
    level: "beginner",
    title: "Simple Narrative Passage",
    text: "The old house stood at the end of Maple Street, half-hidden behind a wall of overgrown ivy. No one had lived there for years, though the lights sometimes flickered on Thursday evenings. Sarah noticed this the first week she moved to the neighbourhood.",
    direction: "Straightforward storytelling. Clear, even pacing. Let the mystery emerge from the words, not vocal tricks.",
    targetDuration: 15,
    tips: [
      "Read as if telling a story to one person sitting across from you",
      "Do not telegraph the mystery — let the listener discover it",
      "Keep a steady, comfortable pace throughout",
    ],
  },
  {
    id: "nar-b-2",
    genre: "narration",
    level: "beginner",
    title: "Corporate Overview",
    text: "Founded in 2004, Meridian Solutions has grown from a three-person startup to a global leader in supply chain technology. Today, we serve over 200 companies across 14 countries, helping businesses move smarter, faster, and more sustainably.",
    direction: "Professional, warm, and clear. This is a company that is proud but not boastful.",
    targetDuration: 14,
    tips: [
      "Corporate narration does not mean robotic — find genuine warmth",
      "Numbers need to be crisp and unhurried so the listener retains them",
      "End on a forward-looking note with quiet confidence",
    ],
  },
  {
    id: "nar-b-3",
    genre: "narration",
    level: "beginner",
    title: "Nature Documentary Opening",
    text: "The sun rises over the Serengeti, painting the grasslands in shades of gold and amber. A herd of wildebeest begins its daily march toward water. In the distance, a lioness watches. She has not eaten in three days.",
    direction: "Calm, observational, cinematic. You are the viewer's guide to a vast landscape.",
    targetDuration: 14,
    tips: [
      "Match your pace to the visual — slow, sweeping, unhurried",
      "The final sentence introduces tension; let your voice acknowledge it subtly",
      "Breathe with the landscape — let pauses create space",
    ],
  },

  // Narration – Intermediate
  {
    id: "nar-i-1",
    genre: "narration",
    level: "intermediate",
    title: "Historical Documentary",
    text: "On the morning of June 6th, 1944, over 156,000 Allied troops crossed the English Channel in the largest amphibious invasion in history. Many of the soldiers were teenagers who had never left their home state. By nightfall, the beaches of Normandy would be forever changed — and so would the world.",
    direction: "Reverent, measured, with building gravitas. Honour the weight of the history.",
    targetDuration: 18,
    tips: [
      "Numbers and dates must be delivered with precision — they anchor the listener",
      "The shift from facts to human detail ('teenagers') needs emotional awareness",
      "Let 'forever changed' carry the weight it deserves without overdramatizing",
    ],
  },
  {
    id: "nar-i-2",
    genre: "narration",
    level: "intermediate",
    title: "Audiobook Character Introduction",
    text: "Detective Maria Santos had a rule: never drink coffee after three in the afternoon. She broke this rule on October 14th, which is why she was still wide awake at midnight when the phone rang. 'Santos,' she answered, already reaching for her coat.",
    direction: "Establish a distinct narrator voice, then shift into character for dialogue. The transition should be seamless.",
    targetDuration: 15,
    tips: [
      "The narrator voice should be distinct from the character voice",
      "Use a subtle shift in placement and rhythm for the dialogue",
      "The parenthetical action ('already reaching for her coat') reveals character — let it breathe",
    ],
  },
  {
    id: "nar-i-3",
    genre: "narration",
    level: "intermediate",
    title: "Corporate Training Narrative",
    text: "In 2019, a mid-level manager at a Fortune 500 company noticed a pattern in customer complaints. Rather than escalating through traditional channels, she built a simple dashboard that tracked sentiment in real time. Within six months, customer retention improved by 23 percent. This is the power of initiative.",
    direction: "Engaging corporate storytelling. Make a business case study feel like a compelling story.",
    targetDuration: 17,
    tips: [
      "This is a story, not a report — find the narrative thread and follow it",
      "Build toward the result with genuine interest, as if revealing a surprise",
      "The closing statement is the lesson — deliver it with quiet authority",
    ],
  },

  // Narration – Advanced
  {
    id: "nar-a-1",
    genre: "narration",
    level: "advanced",
    title: "Multi-Character Audiobook Scene",
    text: "'Order!' Judge Whitfield struck the gavel twice. The courtroom settled into uneasy silence. 'Counsel for the defence?' A young woman rose from her chair. 'Your Honour, my client—' 'Your client,' the judge interrupted, removing her glasses, 'has had quite enough of my patience for one morning.'",
    direction: "Three distinct voices plus narrator. Each character needs unique vocal placement, pacing, and attitude.",
    targetDuration: 18,
    tips: [
      "Establish each character's voice before the scene begins in your mind",
      "The narrator is a fourth voice — neutral, observational, always consistent",
      "Transitions between characters must be instantaneous and unmistakable",
    ],
  },
  {
    id: "nar-a-2",
    genre: "narration",
    level: "advanced",
    title: "Atmospheric Horror Narration",
    text: "The temperature dropped first. Not slowly, the way evening cools a room, but all at once — like opening a freezer door. Then the smell: damp earth and something older, something that had no business being inside a building. The lights didn't flicker. They simply... dimmed.",
    direction: "Controlled dread. The horror is in what is not said. Restraint is your greatest tool.",
    targetDuration: 16,
    tips: [
      "Resist the urge to use a spooky voice — understated reads are far more unsettling",
      "Use pace and breath to create unease, not vocal affectation",
      "The ellipsis before 'dimmed' is a moment of suspended reality — hold it",
    ],
  },
  {
    id: "nar-a-3",
    genre: "narration",
    level: "advanced",
    title: "Science Documentary with Data",
    text: "The James Webb Space Telescope doesn't see light the way we do. It sees infrared — heat radiation — which means it can peer through dust clouds that have blocked our view of the early universe for decades. What it found behind those clouds were galaxies so massive and so ancient that our current models of cosmic evolution cannot explain them.",
    direction: "Authoritative wonder. You are a guide revealing something astonishing with scientific precision.",
    targetDuration: 20,
    tips: [
      "Technical terms must sound natural, not rehearsed — own the vocabulary",
      "Build to the reveal ('galaxies so massive') with genuine scientific excitement",
      "The final statement should land with the weight of a paradigm shift",
    ],
  },

  // Narration – Professional
  {
    id: "nar-p-1",
    genre: "narration",
    level: "professional",
    title: "Long-Form Emotional Climax",
    text: "She found the letter in his coat pocket three days after the funeral. His handwriting — that precise, architectural script she'd teased him about for forty years — covered both sides of a single page. 'My darling,' it began, and she had to sit down, because her legs simply refused to hold her any longer.",
    direction: "Devastating tenderness. This is the emotional peak of a 10-hour audiobook. Every word must land.",
    targetDuration: 18,
    tips: [
      "This passage demands emotional truth without sentimentality",
      "The parenthetical memory is the heartbreak — let your voice carry love and loss simultaneously",
      "Physical detail ('legs refused to hold her') grounds the emotion — do not rush past it",
    ],
  },
  {
    id: "nar-p-2",
    genre: "narration",
    level: "professional",
    title: "Unreliable Narrator",
    text: "Now, I should tell you — and I realise I'm interrupting myself here, which is a habit I've been meaning to break for approximately thirty-seven years — that what happened next was entirely my fault. Not in the grand, theatrical sense. In the quiet, stupid, irreversible sense. The kind of fault that looks like nothing at first and costs you everything by morning.",
    direction: "Self-aware, digressive, deceptively casual. The narrator knows more than they are letting on.",
    targetDuration: 20,
    tips: [
      "The parenthetical aside should feel genuinely spontaneous, not scripted",
      "Maintain a conversational veneer while letting darker truths leak through",
      "This character uses humour as armor — let the listener sense what is underneath",
    ],
  },
  {
    id: "nar-p-3",
    genre: "narration",
    level: "professional",
    title: "Documentary Investigative Reveal",
    text: "For six years, the factory had been dumping waste into the river under cover of darkness. The EPA had been notified twelve times. Twelve. And each time, the complaint was filed, stamped, and placed in a drawer that no one ever opened. Until one journalist did.",
    direction: "Controlled outrage building to a quiet, powerful reveal. Let the facts speak but guide the listener's emotion.",
    targetDuration: 17,
    tips: [
      "The repetition of 'twelve' is the emotional fulcrum — the second one must carry all the weight",
      "Build institutional frustration through pacing, not volume",
      "The final sentence is a pivot to hope — deliver it simply, with steel underneath",
    ],
  },

  // Narration – Master
  {
    id: "nar-m-1",
    genre: "narration",
    level: "master",
    title: "Full Chapter Opening Marathon",
    text: "Chapter One: The man who would change everything arrived on a Tuesday. Chapter Two: She had been waiting for someone like him, though she would never admit it. Chapter Three: The house on Belmoral Drive had its own ideas about who should live there. Chapter Four: Some stories begin with a knock on the door. This one began with silence.",
    direction: "Four distinct chapter openings, each with unique energy and tone, yet maintaining narrative cohesion across the full work.",
    targetDuration: 25,
    tips: [
      "Each chapter opening sets a different emotional temperature — differentiate clearly",
      "The challenge is variety within consistency — same narrator, different moods",
      "Chapter Four's meta-narrative quality requires a shift in register — acknowledge the reader directly",
    ],
  },
  {
    id: "nar-m-2",
    genre: "narration",
    level: "master",
    title: "Multi-Voice Documentary Sequence",
    text: "NARRATOR: The factory closed on a Friday. WORKER 1: They told us at lunch. Just... at lunch. Like it was nothing. NARRATOR: Six hundred jobs. Gone. MAYOR: We had no warning. None. NARRATOR: But the documents tell a different story. A story that begins not in this town, but in a boardroom 3,000 miles away.",
    direction: "Three distinct voices plus narrator. Each real person must sound authentic and emotionally distinct. The narrator connects and contextualizes.",
    targetDuration: 22,
    tips: [
      "The worker's voice needs raw, unpolished emotion — this is someone still processing",
      "The mayor's voice is defensive, political, measured — a contrast to the worker",
      "The narrator's authority comes from restraint; let the subjects carry the feeling",
    ],
  },
  {
    id: "nar-m-3",
    genre: "narration",
    level: "master",
    title: "Non-Fiction Authority with Emotional Pivot",
    text: "The human brain processes approximately 70,000 thoughts per day. Of those, neuroscientists estimate that roughly 80 percent are negative and 95 percent are repetitive. This means that the vast majority of your mental activity is not only unhelpful — it is literally yesterday's unhelpful thinking, running on an endless loop. But here's what they don't tell you: you can interrupt the loop.",
    direction: "Begin as authoritative science, pivot to personal revelation. The final line should feel like a lifeline offered directly to the listener.",
    targetDuration: 22,
    tips: [
      "Data delivery must be clean, confident, and slightly unsettling in its implications",
      "The pivot from third-person science to second-person ('your mental activity') should feel deliberate",
      "The final line changes everything — deliver it as both truth and invitation",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // CHARACTER — animation, video games, fantasy
  // ═══════════════════════════════════════════════════════════════

  // Character – Beginner
  {
    id: "chr-b-1",
    genre: "character",
    level: "beginner",
    title: "Friendly Cartoon Sidekick",
    text: "Hey! Hey! Over here! Did you see that? A butterfly! No wait — TWO butterflies! This is the best day EVER! Come on, let's follow them! They're going toward the waterfall! ADVENTURE TIME!",
    direction: "Boundless energy and wonder. Think Saturday morning cartoon companion — all joy, no cynicism.",
    targetDuration: 10,
    tips: [
      "Commit fully to the excitement — half-hearted reads of this character type fall flat",
      "Each exclamation should feel like a genuine new discovery, not performed surprise",
      "Find a distinct vocal placement that is sustainable over a full session",
    ],
  },
  {
    id: "chr-b-2",
    genre: "character",
    level: "beginner",
    title: "Wise Elder",
    text: "Listen carefully, young one. The path ahead is not the one you see with your eyes. It is the one you feel with your heart. Many have walked this forest before you. Not all of them walked out.",
    direction: "Ancient, warm, but with an undercurrent of warning. Slow and deliberate.",
    targetDuration: 14,
    tips: [
      "Lower your pitch and slow your pace — age lives in rhythm more than in vocal fry",
      "The warning at the end should feel matter-of-fact, not ominous",
      "Every sentence is a gift of wisdom — give each one weight",
    ],
  },
  {
    id: "chr-b-3",
    genre: "character",
    level: "beginner",
    title: "Robot Assistant",
    text: "Good morning. I have completed my analysis of the data. There are three anomalies that require your attention. Shall I display them on the main screen? Also, your coffee is ready. I took the liberty of adjusting the temperature to your preferred 63 degrees.",
    direction: "Precise, pleasant, slightly uncanny. A machine that is learning to be helpful — almost too well.",
    targetDuration: 14,
    tips: [
      "Find a rhythm that is even and measured without being monotone",
      "The coffee detail reveals developing personality — let a hint of warmth creep in",
      "Technical precision in delivery mirrors the character's programming",
    ],
  },

  // Character – Intermediate
  {
    id: "chr-i-1",
    genre: "character",
    level: "intermediate",
    title: "Villain Monologue",
    text: "You think you've won? How delightfully naive. Everything — every battle, every sacrifice, every precious little victory — has been exactly what I planned. You've been dancing to my music this entire time. And now... the finale.",
    direction: "Controlled menace with theatrical flair. This villain enjoys the reveal more than the victory.",
    targetDuration: 14,
    tips: [
      "The power comes from control, not volume — restraint is more threatening than shouting",
      "Savor the word 'delightfully' — it reveals the character's personality",
      "The pause before 'the finale' should feel like a trap closing",
    ],
  },
  {
    id: "chr-i-2",
    genre: "character",
    level: "intermediate",
    title: "Scared Child",
    text: "I don't... I don't want to go in there. It's dark. And it smells funny. Can't we just go home? Please? I promise I'll be good. I won't break anything. I just... I just want to go home.",
    direction: "Vulnerable, trembling, authentic. Not a caricature of a scared child but a real one.",
    targetDuration: 12,
    tips: [
      "The repetitions ('I don't... I don't', 'I just... I just') are where the fear lives — lean into them",
      "Avoid making the voice too high or cartoonish; emotional truth sells child characters",
      "The plea to go home should feel desperate without becoming a tantrum",
    ],
  },
  {
    id: "chr-i-3",
    genre: "character",
    level: "intermediate",
    title: "Gruff Mercenary",
    text: "Payment first. Always. Don't care about your sob story, your revolution, or your dead king. Gold on the table, then we talk. And don't even think about stiffing me. Last person who tried that... well. Let's just say he doesn't try things anymore.",
    direction: "World-weary, dangerous, laconic. Every word costs energy this character would rather save.",
    targetDuration: 14,
    tips: [
      "Economy of expression is key — this character does not waste words or breath",
      "The threat at the end is casual, which makes it more menacing",
      "Find a vocal texture that suggests years of hard living",
    ],
  },

  // Character – Advanced
  {
    id: "chr-a-1",
    genre: "character",
    level: "advanced",
    title: "Dual Character Scene",
    text: "KNIGHT: Stand aside, creature. I have business with the tower. DRAGON: Business? How delightful. I haven't had visitors in... oh, three hundred years? Do come in. Mind the fire. KNIGHT: I'm here for the princess. DRAGON: Aren't they all.",
    direction: "Two fully distinct characters in rapid exchange. The knight is rigid and formal; the dragon is bored, witty, and ancient.",
    targetDuration: 16,
    tips: [
      "Switch instantly between characters with distinct vocal placement and attitude",
      "The dragon's sarcasm should be dripping but never rushed — immortals are never in a hurry",
      "The knight's rigidity makes him slightly comic — let the audience sense it",
    ],
  },
  {
    id: "chr-a-2",
    genre: "character",
    level: "advanced",
    title: "Emotional Creature",
    text: "You... you're leaving? But I thought we were friends. I gave you my favourite rock! It was shiny and everything. I don't... I don't understand. Did I do something wrong? Was it the time I ate your shoe? Because I said I was sorry about that.",
    direction: "Heartbreaking innocence. A non-human creature experiencing abandonment for the first time.",
    targetDuration: 14,
    tips: [
      "This is a creature, not a human child — find a unique vocal quality that suggests non-human origins",
      "The humor ('ate your shoe') lives alongside genuine pain — both must be present simultaneously",
      "Build vulnerability through the speech — each line makes the creature more exposed",
    ],
  },
  {
    id: "chr-a-3",
    genre: "character",
    level: "advanced",
    title: "Video Game Combat Barks",
    text: "Attack: 'Feel the storm!' Defend: 'Not today!' Critical hit: 'Lightning STRIKES!' Low health: 'I can't... keep this up...' Victory: 'The tempest subsides.' Defeat: 'The sky... grows dark...' Revive: 'Thunder returns!'",
    direction: "Seven distinct combat states for the same character. Each must be instantly recognizable as the same person in different moments.",
    targetDuration: 15,
    tips: [
      "Combat barks must be clean, short, and immediately readable — no mumbling",
      "Maintain character consistency across wildly different emotional states",
      "Low health and defeat lines need vulnerable energy without losing the character's core identity",
    ],
  },

  // Character – Professional
  {
    id: "chr-p-1",
    genre: "character",
    level: "professional",
    title: "Video Game Boss (Four Phases)",
    text: "PHASE ONE: So... the chosen one arrives. How predictable. PHASE TWO: Impressive. But I'm not even trying yet. PHASE THREE: ENOUGH! You want to see true power? THEN WITNESS IT! FINAL: How... how is this possible? No one has ever... You. You are different.",
    direction: "Four escalating emotional states for a boss encounter. Arrogance to fury to vulnerability, all as one coherent character.",
    targetDuration: 18,
    tips: [
      "Each phase must sound like a natural escalation, not four separate performances",
      "The shift from fury (Phase 3) to shock (Final) is the hardest transition — practice it",
      "The final admission of respect must feel earned and involuntary",
    ],
  },
  {
    id: "chr-p-2",
    genre: "character",
    level: "professional",
    title: "Creature Transformation",
    text: "Start as a small, timid creature: 'Hello? Is someone there?' Mid-transformation: 'Something's happening... I can feel it... changing... GROWING...' Full transformation: 'I AM REBORN! The earth trembles beneath me! The sky bows before my wings!'",
    direction: "Physical and vocal transformation in real time. Small to enormous, timid to godlike. The voice must evolve continuously.",
    targetDuration: 16,
    tips: [
      "The vocal transformation should be gradual, not a sudden switch",
      "Physical changes should be audible — shift posture, breath, and resonance as the creature grows",
      "The final form must feel massive and inevitable, not just loud",
    ],
  },
  {
    id: "chr-p-3",
    genre: "character",
    level: "professional",
    title: "Dying Hero",
    text: "No... don't cry. Listen to me. You have to keep going. The others... they need you. You were always the strongest. Not me. I was just... stubborn. Promise me. Promise me you'll finish this. That's... that's my girl. Now go. Go!",
    direction: "Fading strength with desperate urgency. A hero using their last breaths to give courage to someone else.",
    targetDuration: 16,
    tips: [
      "Each breath should feel more labored — the body is failing but the spirit pushes forward",
      "The tenderness of 'that's my girl' must contrast with the urgency of 'Go!'",
      "Find the line between emotional and intelligible — every word must still be clear",
    ],
  },

  // Character – Master
  {
    id: "chr-m-1",
    genre: "character",
    level: "master",
    title: "Full Character Reel (Four Voices)",
    text: "Take 1 — Whimsical fairy: 'Follow the moonlight, darling. It knows the way.' Take 2 — Grizzled space captain: 'Set coordinates for the Outer Rim. And someone get me a drink.' Take 3 — Nervous AI: 'I-I don't think I should be feeling this. Is this what humans call... anxiety?' Take 4 — Ancient goddess: 'Mortal. You dare summon me? Speak your wish. Choose your words carefully.'",
    direction: "Four completely distinct characters back to back. Each must be instantly recognizable and fully realized in a single line.",
    targetDuration: 22,
    tips: [
      "Each character needs distinct placement, pace, register, and attitude",
      "Transitions must be clean and instant — no blending between characters",
      "This is a demo reel exercise: each character is auditioning for a different show",
    ],
  },
  {
    id: "chr-m-2",
    genre: "character",
    level: "master",
    title: "Three-Character Improv Scene",
    text: "CAPTAIN: 'Steady as she goes. Status report.' ENGINEER: 'Captain, the core is destabilizing! We have maybe four minutes!' AI: 'Shall I play some calming music? I find Debussy helps with imminent catastrophe.' CAPTAIN: 'Not now, ARIA.' ENGINEER: 'We need to vent the reactor!' AI: 'Fun fact: the last crew who vented a reactor at this distance did not survive. But they did set a record!'",
    direction: "Three characters in crisis. Calm authority, raw panic, and cheerful obliviousness — all at once. Maintain all three voices throughout.",
    targetDuration: 22,
    tips: [
      "The comedy comes from tonal contrast — the AI's cheerfulness must be genuine, not sarcastic",
      "The engineer's panic needs real breathlessness and urgency",
      "The captain's calm must feel earned and slightly strained — not robotic",
    ],
  },
  {
    id: "chr-m-3",
    genre: "character",
    level: "master",
    title: "Same Line, Seven Emotions",
    text: "The line: 'I know what you did.' Deliver as: 1) Suspicious. 2) Heartbroken. 3) Furious. 4) Amused. 5) Terrified. 6) Disgusted. 7) Quietly forgiving. Same character, same words, seven completely different reads.",
    direction: "Extreme emotional range with zero words changed. Each read must be unmistakably different while maintaining character consistency.",
    targetDuration: 25,
    tips: [
      "The words do not change — only intention, subtext, and delivery shift everything",
      "Each emotion should be immediately identifiable without context",
      "This is the ultimate test of vocal acting — technique must be invisible",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // PROMO — TV promos, trailers, network bumps
  // ═══════════════════════════════════════════════════════════════

  // Promo – Beginner
  {
    id: "pro-b-1",
    genre: "promo",
    level: "beginner",
    title: "TV Show Promo",
    text: "Tonight on Channel 5 — the drama that everyone is talking about. New episode. New secrets. New betrayals. Riverside, tonight at nine.",
    direction: "Clean, energetic, enticing. Make the viewer want to clear their evening schedule.",
    targetDuration: 8,
    tips: [
      "Short-form promos need immediate energy — there is no warm-up",
      "Each 'new' should feel like a distinct promise",
      "Land the show name and time with precision — that is the information that sticks",
    ],
  },
  {
    id: "pro-b-2",
    genre: "promo",
    level: "beginner",
    title: "Radio Station ID",
    text: "Non-stop hits, all day long. This is Power 98.7 — your city's number one for music.",
    direction: "Bright, confident, brand-forward. You ARE the station's voice.",
    targetDuration: 6,
    tips: [
      "Station IDs are musical — find the rhythm and ride it",
      "The station name must be the most memorable element of the read",
      "Smile as you read — it is audible and changes everything",
    ],
  },
  {
    id: "pro-b-3",
    genre: "promo",
    level: "beginner",
    title: "Weekend Event Announcement",
    text: "This Saturday at Riverside Arena — live music, food trucks, and family fun from noon to midnight. Free entry for kids under 12. The Summer Bash — this Saturday only.",
    direction: "Inviting and community-focused. Fun without being frantic.",
    targetDuration: 10,
    tips: [
      "List items with distinct energy for each — music, food, and family are different vibes",
      "The free entry detail is a selling point — make sure it lands",
      "Create urgency with 'this Saturday only' without panic",
    ],
  },

  // Promo – Intermediate
  {
    id: "pro-i-1",
    genre: "promo",
    level: "intermediate",
    title: "Movie Teaser",
    text: "From the director of Nightfall comes a story of courage, sacrifice, and one impossible choice. This Christmas, prepare for the journey of a lifetime. The Northern Pass. In theatres December 20th.",
    direction: "Cinematic, building, epic. Every word should feel like a frame from the trailer.",
    targetDuration: 12,
    tips: [
      "Build a narrative arc in 12 seconds — establish, escalate, resolve",
      "The director credit sets authority; the title is the payoff",
      "Let the release date feel like a promise, not just information",
    ],
  },
  {
    id: "pro-i-2",
    genre: "promo",
    level: "intermediate",
    title: "Sports Promo",
    text: "Two teams. One trophy. Zero second chances. The Championship Final — live this Sunday at 4. Only on ESPN. Who wants it more?",
    direction: "Intense, visceral, competitive. The energy of the game should live in your voice.",
    targetDuration: 8,
    tips: [
      "Short, punchy sentences demand precise emphasis on every single word",
      "The countdown structure (two, one, zero) creates natural momentum — ride it",
      "The final question should challenge the viewer directly",
    ],
  },
  {
    id: "pro-i-3",
    genre: "promo",
    level: "intermediate",
    title: "News Open",
    text: "Breaking developments tonight. Live coverage as it happens. This is Action News at Ten — with Sarah Mitchell, David Chen, and meteorologist Lisa Park. Your city. Your news. Right now.",
    direction: "Authoritative, urgent, trustworthy. You are the voice people rely on.",
    targetDuration: 10,
    tips: [
      "News opens require authority without aggression — credibility is the currency",
      "Anchor names must be delivered cleanly — each name gets equal weight",
      "The closing tagline should feel both familiar and urgent",
    ],
  },

  // Promo – Advanced
  {
    id: "pro-a-1",
    genre: "promo",
    level: "advanced",
    title: "Network Brand Promo",
    text: "Stories that move you. Characters you won't forget. Drama that stays with you long after the credits roll. This is NBC — and this fall, we're bringing you the best television on the planet.",
    direction: "Aspirational, sweeping, brand-defining. You are the voice of an entire network's identity.",
    targetDuration: 12,
    tips: [
      "Each phrase builds a larger promise — structure the build carefully",
      "The network name is the emotional apex — it must feel earned",
      "The closing claim needs full conviction without arrogance",
    ],
  },
  {
    id: "pro-a-2",
    genre: "promo",
    level: "advanced",
    title: "Streaming Service Launch",
    text: "Everything you love. Nothing you don't. Unlimited movies, series, and originals you can't find anywhere else. StreamVault launches March 1st. The future of entertainment starts now.",
    direction: "Modern, confident, slightly provocative. This is a disruptor entering the market.",
    targetDuration: 10,
    tips: [
      "The opening antithesis ('everything/nothing') sets the tone — make both halves land",
      "The launch date is the call to action — give it weight and specificity",
      "The final line needs genuine conviction — you believe this changes things",
    ],
  },
  {
    id: "pro-a-3",
    genre: "promo",
    level: "advanced",
    title: "Award Show Tease",
    text: "The red carpet. The speeches. The moments that define a generation. The 96th Academy Awards — live, this Sunday. Only on ABC.",
    direction: "Glamorous, reverent, momentous. Make the viewer feel the significance of the event.",
    targetDuration: 8,
    tips: [
      "Each image should shimmer — paint pictures with pacing and tone",
      "The awards name must sound historic, not routine",
      "The exclusivity of 'Only on ABC' is both a fact and a flex — deliver accordingly",
    ],
  },

  // Promo – Professional
  {
    id: "pro-p-1",
    genre: "promo",
    level: "professional",
    title: "Dramatic Anthology Series",
    text: "Every week, a new story. Every story, a new world. Tales from the Unknown — where nothing is what it seems, and everything has a price. New episodes, Fridays at 10.",
    direction: "Mysterious, layered, seductive. Each phrase should pull the viewer deeper into curiosity.",
    targetDuration: 10,
    tips: [
      "The parallel structure demands consistent rhythm with escalating intrigue",
      "The show title is the doorway — deliver it as both invitation and warning",
      "The air date should feel like a rendezvous, not an announcement",
    ],
  },
  {
    id: "pro-p-2",
    genre: "promo",
    level: "professional",
    title: "Podcast Trailer",
    text: "In 1987, a small town in Oregon went silent. Not metaphorically. Literally silent. No phones. No radio. No voices. For 72 hours, the town of Millhaven simply... stopped. This is the story of what happened in those 72 hours. And why no one has talked about it since. Silence Falls — a new podcast, available everywhere.",
    direction: "Haunting, deliberate, magnetic. Build a mystery that demands investigation.",
    targetDuration: 18,
    tips: [
      "The escalating 'no' list creates a shrinking world — let each one close a door",
      "The word 'stopped' is the most important in the entire promo — give it everything",
      "The title reveal should feel like the first answer in a sea of questions",
    ],
  },
  {
    id: "pro-p-3",
    genre: "promo",
    level: "professional",
    title: "Season Finale Promo",
    text: "All season long, you've watched. You've guessed. You've argued about it at work. Tonight... the truth. The season finale of The Architect — and nothing will ever be the same. Tonight at 9. Only on HBO.",
    direction: "Intimate, building, explosive. Start in the viewer's living room and end in a moment that changes everything.",
    targetDuration: 12,
    tips: [
      "The direct address ('you've watched, guessed, argued') creates intimacy — lean into it",
      "The pause before 'the truth' is where anticipation peaks — own that silence",
      "The closing must feel like both a promise and a threat",
    ],
  },

  // Promo – Master
  {
    id: "pro-m-1",
    genre: "promo",
    level: "master",
    title: "Full Station Imaging Package",
    text: "Station ID: 'Power 98.7 — your city's heartbeat.' Sweeper: 'More music. Less talk. Power 98.7.' Jingle out: 'You're listening to Power.' Promo: 'This weekend — the Power 98.7 Summer Concert Series returns. Three stages. Twelve artists. One unforgettable weekend. Tickets at power987.com.'",
    direction: "Four distinct imaging elements for the same station. Each format has different energy, pacing, and purpose, but all must feel like one unified brand.",
    targetDuration: 20,
    tips: [
      "Station IDs are short and branded; sweepers are rhythmic; promos are informational with energy",
      "Consistency across formats is the skill being tested — same voice, different modes",
      "The concert promo must shift into event-sell energy without losing station identity",
    ],
  },
  {
    id: "pro-m-2",
    genre: "promo",
    level: "master",
    title: "Cinematic Universe Franchise Trailer",
    text: "They called them myths. Legends. Fairy tales told to frighten children. But the old stories were warnings. And the warnings... were true. This summer, five heroes. One world. No second chances. In theatres and IMAX, July 4th.",
    direction: "Massive, mythic, goosebump-inducing. This is the culmination of an entire franchise. Every word carries the weight of everything that came before.",
    targetDuration: 16,
    tips: [
      "The shift from myth to reality is the core dramatic turn — nail the pivot",
      "Build from whispered folklore to thundering declaration",
      "The release date should land like a battle cry",
    ],
  },
  {
    id: "pro-m-3",
    genre: "promo",
    level: "master",
    title: "Live Event Cold Open",
    text: "Ladies and gentlemen... from the Dolby Theatre in Hollywood, California... live around the world... this... is the 96th Annual Academy Awards. Please welcome your host for this evening — two-time Oscar nominee, star of The Morning Show and Friends — Jennifer Aniston!",
    direction: "Building crescendo to an explosive introduction. You are the voice that 40 million people hear before the show begins.",
    targetDuration: 16,
    tips: [
      "The ellipses are dramatic pauses — each one builds anticipation by one degree",
      "The show title is the apex of the build — it must feel monumental",
      "The host introduction should explode with celebration after the controlled build",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // MEDICAL/PHARMA — pharmaceutical, medical device, health
  // ═══════════════════════════════════════════════════════════════

  // Medical – Beginner
  {
    id: "med-b-1",
    genre: "medical",
    level: "beginner",
    title: "Patient Information Leaflet",
    text: "This medication should be taken once daily with food. Do not crush, chew, or break the tablet. If you miss a dose, take it as soon as you remember unless it is within 4 hours of your next scheduled dose. Common side effects include headache, nausea, and dizziness.",
    direction: "Clear, measured, and reassuring. A patient is reading this while anxious about a new medication.",
    targetDuration: 14,
    tips: [
      "Clarity is paramount — every instruction must be unambiguous",
      "List side effects evenly without dramatizing any single one",
      "Your tone should calm, not alarm — you are a trusted guide",
    ],
  },
  {
    id: "med-b-2",
    genre: "medical",
    level: "beginner",
    title: "FDA Safety Disclaimer",
    text: "Tell your doctor about all medications you are currently taking, including prescription and over-the-counter medicines, vitamins, and herbal supplements. This product has not been evaluated by the Food and Drug Administration and is not intended to diagnose, treat, cure, or prevent any disease.",
    direction: "Authoritative and precise. Every word is legally mandated — nothing can be swallowed or rushed.",
    targetDuration: 15,
    tips: [
      "Legal copy requires consistent pacing — no words can be lost",
      "List items clearly with micro-pauses between each category",
      "Sound confident and professional, not like you are reading fine print",
    ],
  },
  {
    id: "med-b-3",
    genre: "medical",
    level: "beginner",
    title: "Public Health Tip",
    text: "The American Heart Association recommends at least 150 minutes of moderate-intensity aerobic activity per week. That's about 30 minutes a day, five days a week. Walking, swimming, and cycling are all excellent options for maintaining cardiovascular health.",
    direction: "Encouraging, informative, accessible. Make health information feel achievable, not overwhelming.",
    targetDuration: 14,
    tips: [
      "Translate the clinical recommendation into something approachable",
      "The breakdown into daily minutes should feel like good news, not a prescription",
      "Activity options should sound inviting and varied",
    ],
  },

  // Medical – Intermediate
  {
    id: "med-i-1",
    genre: "medical",
    level: "intermediate",
    title: "Drug Mechanism of Action",
    text: "Amlodipine besylate is a dihydropyridine calcium channel antagonist that inhibits the transmembrane influx of calcium ions into vascular smooth muscle and cardiac muscle. This results in peripheral arterial vasodilation and reduced systemic vascular resistance.",
    direction: "Highly technical, authoritative. Deliver as if presenting to a room of physicians who will notice any mispronunciation.",
    targetDuration: 16,
    tips: [
      "Pre-read and practice every medical term until pronunciation is automatic",
      "Technical vocabulary must flow naturally — stumbles destroy credibility",
      "Maintain steady authority throughout; this is not conversational",
    ],
  },
  {
    id: "med-i-2",
    genre: "medical",
    level: "intermediate",
    title: "Clinical Trial Results",
    text: "In a randomised, double-blind, placebo-controlled trial of 847 patients with moderate to severe plaque psoriasis, 67 percent of patients receiving the study drug achieved a PASI 75 response at week 16, compared to 12 percent in the placebo group. P-value less than 0.001.",
    direction: "Data-driven authority. Every number must be crisp, confident, and meaningful.",
    targetDuration: 16,
    tips: [
      "Statistical language has its own rhythm — learn it and deliver it naturally",
      "Numbers are the story here — each one needs its own moment",
      "The p-value is the clincher — deliver it as the definitive proof it represents",
    ],
  },
  {
    id: "med-i-3",
    genre: "medical",
    level: "intermediate",
    title: "Surgical Procedure Description",
    text: "The procedure begins with a small incision in the femoral artery. A catheter is advanced through the vasculature under fluoroscopic guidance until it reaches the target lesion in the coronary artery. A balloon is then inflated to compress the plaque against the vessel wall.",
    direction: "Precise, methodical, visual. Walk the listener through the procedure step by step as if narrating for a training video.",
    targetDuration: 16,
    tips: [
      "Sequential medical narration requires clear step delineation",
      "Anatomical terms must be pronounced with absolute precision",
      "Maintain clinical detachment while keeping the listener engaged",
    ],
  },

  // Medical – Advanced
  {
    id: "med-a-1",
    genre: "medical",
    level: "advanced",
    title: "Complex Drug Name Read",
    text: "Pembrolizumab, sold under the brand name Keytruda, is a humanised monoclonal antibody used in cancer immunotherapy. It targets the programmed cell death protein 1 receptor. Dosing for non-small cell lung carcinoma is 200 milligrams administered intravenously over 30 minutes every 3 weeks.",
    direction: "Flawless pronunciation with natural delivery. This must sound like knowledge, not reading.",
    targetDuration: 18,
    tips: [
      "Drug names are brand assets — mispronunciation is a deal-breaker in this genre",
      "The brand name and generic name need different emphasis — brand is warmer, generic is clinical",
      "Dosing information must be metronomically precise",
    ],
  },
  {
    id: "med-a-2",
    genre: "medical",
    level: "advanced",
    title: "Patient Education Video",
    text: "Living with type 2 diabetes doesn't mean giving up the things you love. It means understanding how food, exercise, and medication work together to keep your blood glucose in a healthy range. Today, we'll learn about glycaemic index and how to make meal choices that help stabilise your levels throughout the day.",
    direction: "Empathetic educator. Balance medical accuracy with warmth and accessibility.",
    targetDuration: 18,
    tips: [
      "Open with reassurance — the patient needs hope before information",
      "Technical terms should be introduced gently, as if teaching a friend",
      "The transition to 'today we'll learn' should feel like an invitation, not a lecture",
    ],
  },
  {
    id: "med-a-3",
    genre: "medical",
    level: "advanced",
    title: "Adverse Events Warning",
    text: "Serious adverse reactions include hepatotoxicity, interstitial lung disease, severe dermatological reactions including Stevens-Johnson syndrome, and immune-mediated colitis. Patients should be monitored for signs of hepatic impairment including jaundice, dark urine, and elevated transaminases.",
    direction: "Grave, precise, and unhurried. Every adverse event must be clearly heard and understood. Lives may depend on this information.",
    targetDuration: 18,
    tips: [
      "Each adverse event is a distinct medical entity — separate them clearly",
      "Multi-syllable medical terms need careful articulation without sounding labored",
      "The monitoring instructions are actionable — deliver them as clear directives",
    ],
  },

  // Medical – Professional
  {
    id: "med-p-1",
    genre: "medical",
    level: "professional",
    title: "Full Important Safety Information",
    text: "IMPORTANT SAFETY INFORMATION: Do not take Zynthera if you are allergic to baricitinib or any of the ingredients in Zynthera. Zynthera may cause serious side effects including serious infections, cancer, blood clots, tears in the stomach or intestines, and changes in certain laboratory test results. Your healthcare provider should check you for tuberculosis before starting Zynthera.",
    direction: "Complete ISI read. Legally mandated pace, crystal-clear articulation, authoritative but not alarming.",
    targetDuration: 22,
    tips: [
      "ISI reads are the highest-paying, most demanding reads in pharma — precision is everything",
      "Each serious side effect must be distinct and audible — no running them together",
      "The drug name must be consistent every single time it appears",
    ],
  },
  {
    id: "med-p-2",
    genre: "medical",
    level: "professional",
    title: "CME Lecture Narration",
    text: "The pathophysiology of atrial fibrillation involves multiple re-entrant circuits within the atrial myocardium, often initiated by ectopic foci originating from the pulmonary veins. Recent evidence suggests that atrial fibrosis, inflammation, and autonomic nervous system dysfunction all contribute to the substrate maintenance of the arrhythmia.",
    direction: "Expert-level medical education. Deliver as a respected specialist addressing peers at a cardiology conference.",
    targetDuration: 20,
    tips: [
      "This is physician-to-physician communication — the register is collegiate, not pedagogical",
      "Complex pathophysiology needs clean phrasing — find the natural break points",
      "Recent evidence should sound current and significant, not just another fact",
    ],
  },
  {
    id: "med-p-3",
    genre: "medical",
    level: "professional",
    title: "Emergency Protocol",
    text: "In the event of anaphylaxis: administer epinephrine 0.3 milligrams intramuscularly into the anterolateral thigh. May repeat every 5 to 15 minutes as needed. Simultaneously establish IV access with normal saline. Prepare for possible endotracheal intubation if airway compromise is suspected.",
    direction: "Urgent, precise, commanding. This is life-or-death instruction — every word must be actionable and immediate.",
    targetDuration: 18,
    tips: [
      "Emergency protocols demand absolute clarity under simulated pressure",
      "Drug doses, routes, and timing must be metronomically precise",
      "Urgency comes from precision, not speed — rushing costs clarity",
    ],
  },

  // Medical – Master
  {
    id: "med-m-1",
    genre: "medical",
    level: "master",
    title: "Full DTC Commercial Script",
    text: "Are you living with the unpredictable flares of ulcerative colitis? Entyvio may help. In clinical studies, more patients taking Entyvio achieved and maintained remission versus placebo. Entyvio is not for everyone. Tell your doctor if you have an infection, are planning to have or have recently received a vaccine, or are planning to become pregnant. Serious allergic reactions can happen. The most common side effects include cold symptoms, headache, and joint pain. You are not your UC. Ask your gastroenterologist about Entyvio.",
    direction: "Complete DTC spot: empathy opening, clinical data, full safety, and emotional close. Multiple tonal shifts in 30 seconds.",
    targetDuration: 30,
    tips: [
      "The tonal arc is: empathy, hope, caution, reassurance, empowerment — in that order",
      "Safety information must be delivered with equal clarity and care as the efficacy data",
      "The closing emotional line ('You are not your UC') is the human moment — let it breathe",
    ],
  },
  {
    id: "med-m-2",
    genre: "medical",
    level: "master",
    title: "Rapid-Fire Safety Disclaimer",
    text: "Side effects may include nausea, vomiting, diarrhoea, abdominal pain, decreased appetite, upper respiratory tract infection, headache, dizziness, rash, pruritus, fatigue, and insomnia. Serious side effects include hepatotoxicity, pancreatitis, and severe hypersensitivity reactions. See full prescribing information at the website shown on screen.",
    direction: "High-speed legal read that must remain 100 percent intelligible. Every word must be audible at pace.",
    targetDuration: 16,
    tips: [
      "Speed reads are a learned skill — practice with a metronome to build consistent pace",
      "Articulation cannot suffer at speed; every medical term must be pristine",
      "Group side effects in natural clusters to maintain intelligibility at pace",
    ],
  },
  {
    id: "med-m-3",
    genre: "medical",
    level: "master",
    title: "Research Paper Abstract",
    text: "BACKGROUND: Immune checkpoint inhibitors have transformed the treatment landscape for advanced melanoma. However, acquired resistance remains a significant clinical challenge. METHODS: We conducted a phase II, open-label, single-arm trial evaluating the combination of nivolumab and relatlimab in 120 patients with unresectable stage III or IV melanoma who had progressed on prior anti-PD-1 therapy.",
    direction: "Academic authority at the highest level. This is published research read for an audio journal — precision, gravitas, and intellectual clarity.",
    targetDuration: 24,
    tips: [
      "Academic section headers (BACKGROUND, METHODS) require distinct vocal signposting",
      "Drug names and trial design descriptors must be delivered with zero hesitation",
      "The content is dense — pacing and phrasing determine whether the listener can follow",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // E-LEARNING — corporate training, educational content
  // ═══════════════════════════════════════════════════════════════

  // E-Learning – Beginner
  {
    id: "elr-b-1",
    genre: "e-learning",
    level: "beginner",
    title: "Safety Training Introduction",
    text: "Welcome to your annual workplace safety refresher. In this module, we'll cover fire evacuation procedures, proper lifting technique, and how to report a hazard. This training takes approximately 15 minutes to complete.",
    direction: "Friendly, professional, and clear. You are guiding someone through mandatory training — make it painless.",
    targetDuration: 12,
    tips: [
      "E-learning intros set the tone for engagement — make people want to keep listening",
      "Module topics should be listed clearly with equal weight on each",
      "Time expectations are reassuring — deliver them as good news",
    ],
  },
  {
    id: "elr-b-2",
    genre: "e-learning",
    level: "beginner",
    title: "Software Tutorial",
    text: "To create a new project, click the plus icon in the top left corner of your dashboard. You'll see three template options: blank, standard, and advanced. For most users, we recommend starting with the standard template.",
    direction: "Patient, instructional, conversational. You are a helpful colleague, not a manual.",
    targetDuration: 12,
    tips: [
      "Instructional steps need micro-pauses between them so the user can follow along",
      "Directional language ('top left corner') must be precise and confident",
      "The recommendation should feel like helpful advice, not a directive",
    ],
  },
  {
    id: "elr-b-3",
    genre: "e-learning",
    level: "beginner",
    title: "New Employee Onboarding",
    text: "Welcome to the team. Over the next five days, you'll complete a series of modules designed to help you hit the ground running. Each module takes about ten minutes. Let's start with an overview of our company values.",
    direction: "Warm, welcoming, efficient. This person is nervous on their first day — put them at ease.",
    targetDuration: 12,
    tips: [
      "Warmth and structure together create safety for new employees",
      "Time references should feel manageable and encouraging",
      "The transition to content should feel like a natural next step, not a demand",
    ],
  },

  // E-Learning – Intermediate
  {
    id: "elr-i-1",
    genre: "e-learning",
    level: "intermediate",
    title: "Compliance Module",
    text: "Under Section 7 of the Data Protection Act, all employees who handle personally identifiable information must complete this certification annually. Failure to comply may result in disciplinary action. Let's begin with a scenario.",
    direction: "Authoritative but not threatening. Compliance training needs to feel important without being punitive.",
    targetDuration: 13,
    tips: [
      "Legal references need weight without being ponderous",
      "The consequence statement should be matter-of-fact, not menacing",
      "Transitioning to the scenario should feel engaging — this is where learning begins",
    ],
  },
  {
    id: "elr-i-2",
    genre: "e-learning",
    level: "intermediate",
    title: "Medical Device Training",
    text: "Before operating the CardioSync 3000, ensure the device has been calibrated within the last 24 hours. Check the indicator light on the rear panel — green means calibrated, amber means recalibration is recommended within the next 4 hours, and red means do not proceed.",
    direction: "Precise, calm, safety-critical. Equipment training where attention to detail prevents errors.",
    targetDuration: 16,
    tips: [
      "Color-coded indicators need distinct emphasis — the listener must remember each meaning",
      "Device names should be delivered as proper nouns with respect",
      "Safety-critical information must never be rushed, even if it seems simple",
    ],
  },
  {
    id: "elr-i-3",
    genre: "e-learning",
    level: "intermediate",
    title: "Leadership Course",
    text: "Effective feedback has three components: observation, impact, and invitation. First, describe what you observed — specific behaviour, not interpretation. Then, explain the impact it had. Finally, invite the other person into the conversation.",
    direction: "Coaching tone — wise, experienced, and genuinely helpful. You have done this a thousand times.",
    targetDuration: 15,
    tips: [
      "Framework introductions need structure that the listener can mentally file",
      "Each component deserves its own beat — do not run them together",
      "The shift from framework to application should feel like moving from theory to practice",
    ],
  },

  // E-Learning – Advanced
  {
    id: "elr-a-1",
    genre: "e-learning",
    level: "advanced",
    title: "Technical API Documentation",
    text: "The API authenticates using OAuth 2.0 with bearer tokens. Each request must include an Authorization header in the format: Bearer, followed by your access token. Tokens expire after 3600 seconds and must be refreshed using your refresh token endpoint.",
    direction: "Technical precision with developer-friendly tone. You are a senior engineer explaining to a competent peer.",
    targetDuration: 15,
    tips: [
      "Technical terms and standards names must be delivered with native fluency",
      "Code-like elements (header format, endpoints) need precise, unhurried delivery",
      "Developers appreciate conciseness — do not pad, do not over-explain",
    ],
  },
  {
    id: "elr-a-2",
    genre: "e-learning",
    level: "advanced",
    title: "Scenario-Based Customer Service",
    text: "Imagine this: a customer calls and says their order arrived damaged. They're upset. They want a refund AND a replacement. Company policy allows one or the other. What do you do? Pause the video now and consider your approach before we continue.",
    direction: "Engaging facilitator. Create genuine tension in the scenario, then invite reflection.",
    targetDuration: 14,
    tips: [
      "The scenario must feel real — paint it with enough detail to trigger problem-solving",
      "The policy constraint creates the dilemma — emphasize it clearly",
      "The pause invitation should feel like a genuine request, not a formality",
    ],
  },
  {
    id: "elr-a-3",
    genre: "e-learning",
    level: "advanced",
    title: "Assessment Question",
    text: "Question 4 of 10. A colleague shares confidential client information in a team Slack channel. The information is not sensitive in nature, but the channel includes external contractors. According to our data handling policy, which of the following is the correct next step?",
    direction: "Neutral, clear, exam-focused. Present the scenario without revealing the answer through your delivery.",
    targetDuration: 14,
    tips: [
      "Assessment questions must be completely neutral — no vocal cues to the answer",
      "The nuance in the scenario ('not sensitive but includes contractors') must be clear",
      "Question framing should sound methodical and fair",
    ],
  },

  // E-Learning – Professional
  {
    id: "elr-p-1",
    genre: "e-learning",
    level: "professional",
    title: "Executive Briefing",
    text: "Q3 results reflect a 12 percent increase in customer acquisition cost, offset by a 23 percent improvement in lifetime value. The net effect is positive, but the CAC trend requires attention. Let's examine the three primary drivers.",
    direction: "C-suite communication. Concise, analytical, strategic. Every word must demonstrate business acumen.",
    targetDuration: 13,
    tips: [
      "Financial data demands crisp delivery — numbers are the substance, not decoration",
      "The positive-but-watchful assessment requires tonal balance",
      "Transition to analysis should feel decisive and forward-looking",
    ],
  },
  {
    id: "elr-p-2",
    genre: "e-learning",
    level: "professional",
    title: "Crisis Simulation",
    text: "ALERT: A critical system failure has been detected in the production environment. All hands on deck. In this simulation, you will assume the role of incident commander. Your first task: assess scope, assign roles, and establish communication channels within 90 seconds. Begin.",
    direction: "Urgent, commanding, immersive. This is a pressure test — the voice must create real stakes.",
    targetDuration: 14,
    tips: [
      "The alert should feel genuinely urgent without crossing into panic",
      "Role assignment and task framing must be crystal clear under simulated pressure",
      "The word 'Begin' should trigger immediate action — deliver it with authority",
    ],
  },
  {
    id: "elr-p-3",
    genre: "e-learning",
    level: "professional",
    title: "Change Management Module",
    text: "Resistance to change is not a character flaw. It is a neurological response. When we encounter unfamiliar processes, the brain's threat detection system activates, flooding the prefrontal cortex with cortisol. Understanding this science helps leaders respond with empathy rather than frustration.",
    direction: "Insightful, science-backed, and compassionate. Reframe a common leadership challenge through neuroscience.",
    targetDuration: 17,
    tips: [
      "The opening reframe ('not a character flaw') is counterintuitive — let it land before moving on",
      "Scientific explanation should feel revelatory, not academic",
      "The leadership application should feel both practical and humane",
    ],
  },

  // E-Learning – Master
  {
    id: "elr-m-1",
    genre: "e-learning",
    level: "master",
    title: "Full Course Introduction",
    text: "Welcome to Mastering Project Management — a twelve-part series designed for mid-level managers transitioning into programme leadership. Over the coming weeks, we'll cover scope definition, stakeholder mapping, risk frameworks, and the art of saying 'no' diplomatically. I'm your instructor, and I've managed projects that went brilliantly — and a few that taught me everything I know.",
    direction: "Expert educator with personality. Establish credibility, set expectations, and build rapport — all in 30 seconds.",
    targetDuration: 24,
    tips: [
      "Course intros must accomplish three things: credibility, roadmap, and connection",
      "The humor at the end humanizes the instructor — it must feel natural, not scripted",
      "Topic previews should create genuine curiosity about what is coming",
    ],
  },
  {
    id: "elr-m-2",
    genre: "e-learning",
    level: "master",
    title: "Interactive Branching Scenario",
    text: "You chose Option B: Escalate to your manager. Here's what happens. Your manager schedules a meeting with the client for Friday. However, by Wednesday, the client has already posted a negative review online. Was escalation the right call? Let's rewind and explore what might have happened with a different approach.",
    direction: "Dynamic facilitator managing a branching narrative. Acknowledge the choice, reveal consequences, and redirect without judgment.",
    targetDuration: 16,
    tips: [
      "The learner just made a choice — acknowledge it without revealing if it was right or wrong",
      "Consequences should unfold like a story, not a punishment",
      "The redirect must feel encouraging and curious, not corrective",
    ],
  },
  {
    id: "elr-m-3",
    genre: "e-learning",
    level: "master",
    title: "Certification Exam Introduction",
    text: "You are about to begin the final certification exam. You have 60 minutes to complete 40 questions. A passing score is 80 percent or higher. You may not return to previous questions once submitted. Your screen will display a timer in the upper right corner. Take a deep breath. You've prepared for this. Good luck.",
    direction: "Calm authority with underlying support. Create appropriate exam gravity while providing emotional reassurance.",
    targetDuration: 18,
    tips: [
      "Rules must be delivered with absolute clarity — no ambiguity allowed",
      "The shift from procedural to supportive at 'Take a deep breath' must feel genuinely human",
      "The closing 'Good luck' should carry real warmth — this person has been on a journey",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // TRAILER — movie trailers, game trailers, event promos
  // ═══════════════════════════════════════════════════════════════

  // Trailer – Beginner
  {
    id: "trl-b-1",
    genre: "trailer",
    level: "beginner",
    title: "Romantic Drama Teaser",
    text: "She had everything she'd ever wanted. Except the one thing that mattered. This Valentine's Day, love takes a second chance. The Last Letter — in theatres February 14th.",
    direction: "Warm, wistful, hopeful. This is a love story, not an action film — let emotion lead.",
    targetDuration: 10,
    tips: [
      "Romantic trailers need intimacy — your voice should feel close",
      "The contrast between 'everything' and 'one thing' is the hook — make both land",
      "The title should sound like a promise, not a product",
    ],
  },
  {
    id: "trl-b-2",
    genre: "trailer",
    level: "beginner",
    title: "Family Adventure",
    text: "This summer, one family discovers that the map in their attic doesn't lead to treasure. It leads to another world. Mapmakers — an adventure for the whole family. Rated PG.",
    direction: "Wonder and excitement. A family-friendly tone that appeals to both kids and parents.",
    targetDuration: 10,
    tips: [
      "Family trailers need warmth alongside excitement — not just adrenaline",
      "The reveal ('another world') should sparkle with wonder",
      "Ratings information should be natural, not an afterthought",
    ],
  },
  {
    id: "trl-b-3",
    genre: "trailer",
    level: "beginner",
    title: "Comedy Film Trailer",
    text: "He's a dog groomer. She's a CIA agent. When a case of mistaken identity throws them together, things get hairy. Really hairy. Clipped — this Christmas, the laughs are on the house.",
    direction: "Fun, playful, slightly tongue-in-cheek. The puns are intentional — lean into them.",
    targetDuration: 10,
    tips: [
      "Comedy trailers need timing above all — let the setup breathe before the punchline",
      "The premise should sound ridiculous in the best way",
      "Puns should be delivered with a wink, not a groan",
    ],
  },

  // Trailer – Intermediate
  {
    id: "trl-i-1",
    genre: "trailer",
    level: "intermediate",
    title: "Action Thriller",
    text: "He was the best operative they ever had. So they erased him. Now he's back. And he remembers everything. This October, the hunter becomes the hunted. Blackout Protocol — in theatres everywhere.",
    direction: "Hard-hitting, driving, intense. Each line should feel like a body blow.",
    targetDuration: 12,
    tips: [
      "Action trailers live in the spaces between words — use pauses like percussion",
      "Build intensity through the copy without peaking too early",
      "The tagline should feel like the trailer's final explosion",
    ],
  },
  {
    id: "trl-i-2",
    genre: "trailer",
    level: "intermediate",
    title: "Video Game Cinematic",
    text: "The kingdoms have fallen. The old gods are silent. In the ashes of a broken world, one warrior rises to forge a new path. Ashborne — forged in fire, tempered by fate. Coming this fall to all platforms.",
    direction: "Epic fantasy with gravitas. Think dark, mythic, and world-weary but not hopeless.",
    targetDuration: 14,
    tips: [
      "Fantasy trailers require a specific register — elevated language, measured pace",
      "The world-building phrases set a visual tone — let them paint pictures",
      "The game title should feel like the name of an era, not just a product",
    ],
  },
  {
    id: "trl-i-3",
    genre: "trailer",
    level: "intermediate",
    title: "Horror Film Teaser",
    text: "They moved to the country for a fresh start. The house was perfect. The neighbors were friendly. The children were happy. Everything was exactly as it should be. Until it wasn't.",
    direction: "Idyllic surface with creeping dread underneath. The horror is in the normality.",
    targetDuration: 12,
    tips: [
      "Each 'perfect' detail should sound slightly too good to be true",
      "Build a false sense of security that the final line shatters",
      "The last line needs a complete tonal shift — let the mask drop",
    ],
  },

  // Trailer – Advanced
  {
    id: "trl-a-1",
    genre: "trailer",
    level: "advanced",
    title: "Prestige Drama Trailer",
    text: "Based on the true story that the government tried to bury. One journalist. One source. And a truth so dangerous that revealing it could cost them everything. From Academy Award-winning director Claire Rousseau. The Weight of Ink — this awards season.",
    direction: "Prestige gravitas. Measured, important, deliberate. Every word carries the weight of true events.",
    targetDuration: 16,
    tips: [
      "True story trailers need extra reverence — real people lived this",
      "The stakes escalation must feel genuine, not manufactured",
      "Director credits and awards language have specific cadences — learn them",
    ],
  },
  {
    id: "trl-a-2",
    genre: "trailer",
    level: "advanced",
    title: "Sci-Fi Epic",
    text: "In 2157, humanity reached the stars. By 2200, the stars pushed back. Now, the last fleet stands between civilization and extinction. This is not a war we chose. But it is the one that will define us. Helios — witness the final stand.",
    direction: "Massive scope, existential stakes, quiet determination in the face of annihilation.",
    targetDuration: 16,
    tips: [
      "Sci-fi trailers blend timeline precision with mythic storytelling",
      "The shift from historical overview to present crisis should feel like a zoom from macro to personal",
      "The final call to action should feel like an invitation to witness history",
    ],
  },
  {
    id: "trl-a-3",
    genre: "trailer",
    level: "advanced",
    title: "Documentary Film Trailer",
    text: "For thirty years, the town kept a secret. The factory knew. The government knew. The people? They just got sick. This spring, the truth surfaces. Downstream — a documentary that changes everything you thought you knew about clean water in America.",
    direction: "Investigative urgency meets human tragedy. Controlled outrage building to a call for awareness.",
    targetDuration: 16,
    tips: [
      "Documentary trailers must earn their outrage through facts, not vocal manipulation",
      "The list of who knew creates complicity — each party should feel heavier than the last",
      "The title reveal should feel like an indictment",
    ],
  },

  // Trailer – Professional
  {
    id: "trl-p-1",
    genre: "trailer",
    level: "professional",
    title: "Franchise Blockbuster Final Trailer",
    text: "Ten years. Twelve films. One destiny. Everything has led to this moment. The alliances will shatter. The sacrifices will be real. And when the dust settles, nothing — nothing — will ever be the same. Convergence: Endgame — in theatres and IMAX, May 3rd.",
    direction: "The culmination of a decade of storytelling. Maximum emotional and dramatic weight. This trailer must feel like the end of an era.",
    targetDuration: 20,
    tips: [
      "The opening numerical progression builds scope — treat each number as a chapter in itself",
      "The repeated 'nothing' is a rhetorical device — the second must dwarf the first",
      "IMAX and release date information should feel monumental, not informational",
    ],
  },
  {
    id: "trl-p-2",
    genre: "trailer",
    level: "professional",
    title: "AAA Video Game Launch Trailer",
    text: "You were told this world was dead. That nothing survived the Collapse. They lied. Beneath the ash, life persists. Feral. Fierce. Unforgiving. Welcome to the Darklands. Your choices shape this world. Your sins define it. Rated M for Mature.",
    direction: "Immersive, threatening, seductive. Pull the player into a world they cannot resist exploring despite the danger.",
    targetDuration: 18,
    tips: [
      "Game trailers must make the player feel like the protagonist — use 'you' deliberately",
      "The three descriptors ('Feral. Fierce. Unforgiving.') are world-building in three words — give each one space",
      "The moral dimension ('sins define it') adds weight — deliver it as a promise and a warning",
    ],
  },
  {
    id: "trl-p-3",
    genre: "trailer",
    level: "professional",
    title: "Live Event Hype Trailer",
    text: "Sixty thousand fans. One stage. The biggest names in music, together for one night only. This isn't a concert. This is a movement. Global Harmony Festival — live from Tokyo, streaming worldwide on December 31st. The countdown starts now.",
    direction: "Electric, massive, unifying. The energy of 60,000 people should live in your voice.",
    targetDuration: 14,
    tips: [
      "Event trailers must create FOMO — the listener should feel they cannot miss this",
      "The reframe ('not a concert, a movement') elevates the event — commit to the claim",
      "The global scope and streaming details should feel inclusive, not exclusive",
    ],
  },

  // Trailer – Master
  {
    id: "trl-m-1",
    genre: "trailer",
    level: "master",
    title: "Whisper-to-Thunder Cinematic Trailer",
    text: "Once upon a time, there was a world that believed in heroes. That world is gone. The heroes are dead. The stories are forgotten. But somewhere, in the ruins of everything we lost, a child picks up a sword. And remembers. This summer: Requiem.",
    direction: "Begin barely audible. End with the force of thunder. The entire arc of a civilization's fall and possible rebirth in 20 seconds.",
    targetDuration: 20,
    tips: [
      "The dynamic range must be extreme — from ASMR to arena, smoothly and inevitably",
      "The fairy tale opening deliberately invokes childhood, then destroys it",
      "The child picking up the sword is the turning point — it must feel like dawn breaking",
    ],
  },
  {
    id: "trl-m-2",
    genre: "trailer",
    level: "master",
    title: "Multi-Genre Trailer Reel",
    text: "Horror: 'Don't open your eyes. Whatever you do... don't open your eyes.' Action: 'You've got thirty seconds to decide if you want to live or die. Clock's ticking.' Drama: 'I waited twenty years to say this. And now that you're here... I can't remember the words.' Comedy: 'I accidentally married my landlord. On purpose. It's complicated.'",
    direction: "Four completely different trailer genres back to back. Each must instantly establish its world and tone in a single line.",
    targetDuration: 25,
    tips: [
      "Each genre has distinct vocal DNA — horror breathes differently from comedy",
      "The transitions between genres must be clean breaks, not gradual shifts",
      "This tests range: the same voice must be credible across four wildly different worlds",
    ],
  },
  {
    id: "trl-m-3",
    genre: "trailer",
    level: "master",
    title: "Real-Time Emotional Escalation",
    text: "They promised it would be safe. They promised no one would get hurt. They promised it was temporary. They promised. And now, standing in the wreckage of every broken promise, we have one choice left. Not to survive. To remember. So that no one ever promises again.",
    direction: "Controlled escalation from betrayal to devastation to cold, steely resolve. Every repetition of 'promised' must be different and more devastating than the last.",
    targetDuration: 22,
    tips: [
      "The word 'promised' is used four times — each must carry a different emotional charge",
      "The shift from anger to resolve at 'one choice left' is the dramatic fulcrum",
      "The final line should feel like an oath, not a tagline — absolute conviction",
    ],
  },
];
