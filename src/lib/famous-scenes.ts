import type { ParsedScript } from "@/types";

export interface FamousScene {
  id: string;
  title: string;
  playwright: string;
  era: string;
  genre: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number;
  script: ParsedScript;
}

export const FAMOUS_SCENES: FamousScene[] = [
  {
    id: "romeo-juliet-balcony",
    title: "Romeo and Juliet — Balcony Scene",
    playwright: "William Shakespeare",
    era: "Classical",
    genre: "Tragedy / Romance",
    description: "The iconic balcony scene where Romeo and Juliet declare their love. Perfect for beginners.",
    difficulty: "beginner",
    estimatedMinutes: 5,
    script: {
      title: "Romeo and Juliet — Act 2, Scene 2",
      characters: [
        { name: "ROMEO", lineCount: 6, suggestedGender: "male", suggestedAge: "young-adult", suggestedAccent: "British RP" },
        { name: "JULIET", lineCount: 6, suggestedGender: "female", suggestedAge: "young-adult", suggestedAccent: "British RP" },
        { name: "NURSE", lineCount: 1, suggestedGender: "female", suggestedAge: "elderly", suggestedAccent: "British RP" },
      ],
      lines: [
        { id: "rj-1", type: "stage-direction", text: "A garden. JULIET appears above at a window." },
        { id: "rj-2", type: "dialogue", character: "ROMEO", text: "But, soft! What light through yonder window breaks? It is the east, and Juliet is the sun. Arise, fair sun, and kill the envious moon, who is already sick and pale with grief.", act: 2, scene: 2 },
        { id: "rj-3", type: "dialogue", character: "JULIET", text: "O Romeo, Romeo! Wherefore art thou Romeo? Deny thy father and refuse thy name; or, if thou wilt not, be but sworn my love, and I'll no longer be a Capulet.", act: 2, scene: 2 },
        { id: "rj-4", type: "dialogue", character: "ROMEO", text: "Shall I hear more, or shall I speak at this?", act: 2, scene: 2 },
        { id: "rj-5", type: "dialogue", character: "JULIET", text: "'Tis but thy name that is my enemy; thou art thyself, though not a Montague. What's Montague? It is nor hand, nor foot, nor arm, nor face. O, be some other name! What's in a name? That which we call a rose by any other name would smell as sweet.", act: 2, scene: 2 },
        { id: "rj-6", type: "dialogue", character: "ROMEO", text: "I take thee at thy word. Call me but love, and I'll be new baptized; henceforth I never will be Romeo.", act: 2, scene: 2 },
        { id: "rj-7", type: "dialogue", character: "JULIET", text: "What man art thou that, thus bescreen'd in night, so stumblest on my counsel?", act: 2, scene: 2 },
        { id: "rj-8", type: "dialogue", character: "ROMEO", text: "By a name I know not how to tell thee who I am. My name, dear saint, is hateful to myself, because it is an enemy to thee. Had I it written, I would tear the word.", act: 2, scene: 2 },
        { id: "rj-9", type: "dialogue", character: "JULIET", text: "My ears have not yet drunk a hundred words of that tongue's utterance, yet I know the sound. Art thou not Romeo, and a Montague?", act: 2, scene: 2 },
        { id: "rj-10", type: "dialogue", character: "ROMEO", text: "Neither, fair maid, if either thee dislike.", act: 2, scene: 2 },
        { id: "rj-11", type: "stage-direction", text: "NURSE calls from within." },
        { id: "rj-12", type: "dialogue", character: "NURSE", text: "Madam!", act: 2, scene: 2 },
        { id: "rj-13", type: "dialogue", character: "JULIET", text: "A thousand times good night!", act: 2, scene: 2 },
        { id: "rj-14", type: "dialogue", character: "ROMEO", text: "A thousand times the worse, to want thy light. Love goes toward love, as schoolboys from their books; but love from love, toward school with heavy looks.", act: 2, scene: 2 },
      ],
      actCount: 1, sceneCount: 1, estimatedLength: "short-episode", pageCount: 2,
    },
  },
  {
    id: "hamlet-to-be",
    title: "Hamlet — To Be or Not To Be",
    playwright: "William Shakespeare",
    era: "Classical",
    genre: "Tragedy",
    description: "Hamlet's most famous soliloquy, plus the encounter with Ophelia. A masterclass in subtext.",
    difficulty: "advanced",
    estimatedMinutes: 6,
    script: {
      title: "Hamlet — Act 3, Scene 1",
      characters: [
        { name: "HAMLET", lineCount: 5, suggestedGender: "male", suggestedAge: "young-adult", suggestedAccent: "British RP" },
        { name: "OPHELIA", lineCount: 4, suggestedGender: "female", suggestedAge: "young-adult", suggestedAccent: "British RP" },
      ],
      lines: [
        { id: "ham-1", type: "stage-direction", text: "HAMLET enters alone." },
        { id: "ham-2", type: "dialogue", character: "HAMLET", text: "To be, or not to be, that is the question: Whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune, or to take arms against a sea of troubles, and by opposing end them. To die — to sleep, no more.", act: 3, scene: 1 },
        { id: "ham-3", type: "dialogue", character: "HAMLET", text: "To sleep, perchance to dream — ay, there's the rub: For in that sleep of death what dreams may come, when we have shuffled off this mortal coil, must give us pause.", act: 3, scene: 1 },
        { id: "ham-4", type: "stage-direction", text: "OPHELIA enters, reading a book." },
        { id: "ham-5", type: "dialogue", character: "OPHELIA", text: "Good my lord, how does your honour for this many a day?", act: 3, scene: 1 },
        { id: "ham-6", type: "dialogue", character: "HAMLET", text: "I humbly thank you; well, well, well.", act: 3, scene: 1 },
        { id: "ham-7", type: "dialogue", character: "OPHELIA", text: "My lord, I have remembrances of yours, that I have longed long to re-deliver. I pray you, now receive them.", act: 3, scene: 1 },
        { id: "ham-8", type: "dialogue", character: "HAMLET", text: "No, not I. I never gave you aught.", act: 3, scene: 1 },
        { id: "ham-9", type: "dialogue", character: "OPHELIA", text: "My honoured lord, you know right well you did; and with them, words of so sweet breath composed as made the things more rich.", act: 3, scene: 1 },
        { id: "ham-10", type: "dialogue", character: "HAMLET", text: "Get thee to a nunnery! Why wouldst thou be a breeder of sinners? I am myself indifferent honest, but yet I could accuse me of such things that it were better my mother had not borne me.", act: 3, scene: 1 },
        { id: "ham-11", type: "dialogue", character: "OPHELIA", text: "O, what a noble mind is here o'erthrown! The glass of fashion and the mould of form. And I, of ladies most deject and wretched, that suck'd the honey of his music vows, now see that noble and most sovereign reason, like sweet bells jangled, out of tune and harsh.", act: 3, scene: 1 },
      ],
      actCount: 1, sceneCount: 1, estimatedLength: "short-episode", pageCount: 2,
    },
  },
  {
    id: "streetcar-blanche-stanley",
    title: "A Streetcar Named Desire — Blanche & Stanley",
    playwright: "Tennessee Williams",
    era: "Modern",
    genre: "Drama",
    description: "The explosive confrontation between Blanche and Stanley. Raw emotional intensity.",
    difficulty: "intermediate",
    estimatedMinutes: 4,
    script: {
      title: "A Streetcar Named Desire — Scene 10",
      characters: [
        { name: "BLANCHE", lineCount: 5, suggestedGender: "female", suggestedAge: "adult", suggestedAccent: "Southern US" },
        { name: "STANLEY", lineCount: 4, suggestedGender: "male", suggestedAge: "adult", suggestedAccent: "New York" },
      ],
      lines: [
        { id: "sc-1", type: "stage-direction", text: "Stanley enters the apartment. Blanche is alone, dressed in a crumpled white satin evening gown." },
        { id: "sc-2", type: "dialogue", character: "STANLEY", text: "Hey! Hey, Blanche! You left the phone off the hook.", act: 1, scene: 10 },
        { id: "sc-3", type: "dialogue", character: "BLANCHE", text: "I — I don't want realism. I want magic! Yes, yes, magic! I try to give that to people. I misrepresent things to them. I don't tell the truth, I tell what ought to be truth.", act: 1, scene: 10 },
        { id: "sc-4", type: "dialogue", character: "STANLEY", text: "I've been on to you from the start! Not once did you pull any wool over this boy's eyes!", act: 1, scene: 10 },
        { id: "sc-5", type: "dialogue", character: "BLANCHE", text: "Oh, I suppose I'm to be forgiven! I never was hard or self-sufficient enough. When people are soft — soft people have got to shimmer and glow — they've got to put on soft colors, the colors of butterfly wings, and put a paper lantern over the light.", act: 1, scene: 10 },
        { id: "sc-6", type: "dialogue", character: "STANLEY", text: "Come to think of it — maybe you wouldn't be bad to interfere with.", act: 1, scene: 10 },
        { id: "sc-7", type: "dialogue", character: "BLANCHE", text: "Stay back! Don't you come toward me another step, or I'll —", act: 1, scene: 10 },
        { id: "sc-8", type: "dialogue", character: "STANLEY", text: "What'll you do?", act: 1, scene: 10 },
        { id: "sc-9", type: "dialogue", character: "BLANCHE", text: "Some awful thing will happen! It will!", act: 1, scene: 10 },
        { id: "sc-10", type: "stage-direction", text: "He picks up her inert figure and carries her to the bed." },
      ],
      actCount: 1, sceneCount: 1, estimatedLength: "short-episode", pageCount: 1,
    },
  },
  {
    id: "death-salesman-attention",
    title: "Death of a Salesman — Attention Must Be Paid",
    playwright: "Arthur Miller",
    era: "Modern",
    genre: "Drama",
    description: "Linda's passionate defense of Willy to their sons. One of the most powerful speeches in American theatre.",
    difficulty: "intermediate",
    estimatedMinutes: 5,
    script: {
      title: "Death of a Salesman — Act 1",
      characters: [
        { name: "LINDA", lineCount: 4, suggestedGender: "female", suggestedAge: "adult", suggestedAccent: "New York" },
        { name: "BIFF", lineCount: 3, suggestedGender: "male", suggestedAge: "young-adult", suggestedAccent: "New York" },
        { name: "HAPPY", lineCount: 2, suggestedGender: "male", suggestedAge: "young-adult", suggestedAccent: "New York" },
      ],
      lines: [
        { id: "ds-1", type: "stage-direction", text: "The boys' bedroom. LINDA enters." },
        { id: "ds-2", type: "dialogue", character: "BIFF", text: "Why didn't you ever write me about this, Mom?", act: 1, scene: 1 },
        { id: "ds-3", type: "dialogue", character: "LINDA", text: "How would I write to you? For over three months you had no address.", act: 1, scene: 1 },
        { id: "ds-4", type: "dialogue", character: "BIFF", text: "He's not like this all the time, is he?", act: 1, scene: 1 },
        { id: "ds-5", type: "dialogue", character: "LINDA", text: "I don't say he's a great man. Willy Loman never made a lot of money. His name was never in the paper. He's not the finest character that ever lived. But he's a human being, and a terrible thing is happening to him. So attention must be paid! He's not to be allowed to fall into his grave like an old dog.", act: 1, scene: 1 },
        { id: "ds-6", type: "dialogue", character: "HAPPY", text: "Sure, Mom, but —", act: 1, scene: 1 },
        { id: "ds-7", type: "dialogue", character: "LINDA", text: "No! Attention, attention must be finally paid to such a person! You called him crazy —", act: 1, scene: 1 },
        { id: "ds-8", type: "dialogue", character: "BIFF", text: "I didn't mean —", act: 1, scene: 1 },
        { id: "ds-9", type: "dialogue", character: "LINDA", text: "No, a lot of people think he's lost his balance. But you don't have to be very smart to know what his trouble is. The man is exhausted. A small man can be just as exhausted as a great man.", act: 1, scene: 1 },
        { id: "ds-10", type: "dialogue", character: "HAPPY", text: "Sure, Mom, I'm gonna try. I know how to try.", act: 1, scene: 1 },
      ],
      actCount: 1, sceneCount: 1, estimatedLength: "short-episode", pageCount: 2,
    },
  },
  {
    id: "macbeth-dagger",
    title: "Macbeth — Is This A Dagger",
    playwright: "William Shakespeare",
    era: "Classical",
    genre: "Tragedy",
    description: "Macbeth's haunted soliloquy before the murder, and Lady Macbeth's steely resolve. Dark, intense, gripping.",
    difficulty: "advanced",
    estimatedMinutes: 5,
    script: {
      title: "Macbeth — Act 2, Scene 1-2",
      characters: [
        { name: "MACBETH", lineCount: 4, suggestedGender: "male", suggestedAge: "adult", suggestedAccent: "Scottish" },
        { name: "LADY MACBETH", lineCount: 4, suggestedGender: "female", suggestedAge: "adult", suggestedAccent: "Scottish" },
      ],
      lines: [
        { id: "mb-1", type: "stage-direction", text: "A dark corridor in MACBETH's castle. Night." },
        { id: "mb-2", type: "dialogue", character: "MACBETH", text: "Is this a dagger which I see before me, the handle toward my hand? Come, let me clutch thee. I have thee not, and yet I see thee still. Art thou not, fatal vision, sensible to feeling as to sight? Or art thou but a dagger of the mind, a false creation, proceeding from the heat-oppressed brain?", act: 2, scene: 1 },
        { id: "mb-3", type: "dialogue", character: "MACBETH", text: "I go, and it is done; the bell invites me. Hear it not, Duncan; for it is a knell that summons thee to heaven or to hell.", act: 2, scene: 1 },
        { id: "mb-4", type: "stage-direction", text: "He exits. Sound of a bell tolling. LADY MACBETH enters." },
        { id: "mb-5", type: "dialogue", character: "LADY MACBETH", text: "That which hath made them drunk hath made me bold; what hath quench'd them hath given me fire. Hark! Peace! It was the owl that shriek'd.", act: 2, scene: 2 },
        { id: "mb-6", type: "stage-direction", text: "MACBETH returns, carrying two bloody daggers." },
        { id: "mb-7", type: "dialogue", character: "MACBETH", text: "I have done the deed. Didst thou not hear a noise?", act: 2, scene: 2 },
        { id: "mb-8", type: "dialogue", character: "LADY MACBETH", text: "I heard the owl scream and the crickets cry. Did not you speak?", act: 2, scene: 2 },
        { id: "mb-9", type: "dialogue", character: "MACBETH", text: "Methought I heard a voice cry 'Sleep no more! Macbeth does murder sleep' — the innocent sleep, sleep that knits up the ravell'd sleeve of care.", act: 2, scene: 2 },
        { id: "mb-10", type: "dialogue", character: "LADY MACBETH", text: "Why did you bring these daggers from the place? They must lie there. Go carry them, and smear the sleepy grooms with blood.", act: 2, scene: 2 },
        { id: "mb-11", type: "dialogue", character: "LADY MACBETH", text: "Infirm of purpose! Give me the daggers. The sleeping and the dead are but as pictures. 'Tis the eye of childhood that fears a painted devil.", act: 2, scene: 2 },
      ],
      actCount: 1, sceneCount: 2, estimatedLength: "short-episode", pageCount: 2,
    },
  },
  {
    id: "glass-menagerie-gentleman",
    title: "The Glass Menagerie — The Gentleman Caller",
    playwright: "Tennessee Williams",
    era: "Modern",
    genre: "Drama",
    description: "The tender, awkward scene between Laura and Jim. Fragile hope meeting reality.",
    difficulty: "beginner",
    estimatedMinutes: 4,
    script: {
      title: "The Glass Menagerie — Scene 7",
      characters: [
        { name: "LAURA", lineCount: 5, suggestedGender: "female", suggestedAge: "young-adult", suggestedAccent: "Southern US" },
        { name: "JIM", lineCount: 5, suggestedGender: "male", suggestedAge: "young-adult", suggestedAccent: "Midwestern US" },
      ],
      lines: [
        { id: "gm-1", type: "stage-direction", text: "The living room, lit by candlelight. JIM and LAURA sit on the floor near the glass menagerie." },
        { id: "gm-2", type: "dialogue", character: "JIM", text: "What are you doing now?", act: 1, scene: 7 },
        { id: "gm-3", type: "dialogue", character: "LAURA", text: "I — I don't do anything — much. Oh, please don't think I sit around doing nothing! My glass collection takes up a good deal of my time.", act: 1, scene: 7 },
        { id: "gm-4", type: "dialogue", character: "JIM", text: "What kind of glass is it?", act: 1, scene: 7 },
        { id: "gm-5", type: "dialogue", character: "LAURA", text: "Little articles of it, they're ornaments mostly! Most of them are little animals made out of glass, the tiniest little animals in the world. Mother calls them a glass menagerie!", act: 1, scene: 7 },
        { id: "gm-6", type: "dialogue", character: "JIM", text: "Aw, is this one the little unicorn?", act: 1, scene: 7 },
        { id: "gm-7", type: "dialogue", character: "LAURA", text: "He's my favorite one. Oh, be careful — if you breathe, it breaks!", act: 1, scene: 7 },
        { id: "gm-8", type: "dialogue", character: "JIM", text: "I'd better not take it. I'm pretty clumsy with things.", act: 1, scene: 7 },
        { id: "gm-9", type: "dialogue", character: "LAURA", text: "Go on, I trust you with him! There now — you're holding him gently! Hold him over the light, he loves the light! You see how the light shines through him?", act: 1, scene: 7 },
        { id: "gm-10", type: "dialogue", character: "JIM", text: "It sure does shine! I shouldn't be partial, but he is my favorite one.", act: 1, scene: 7 },
      ],
      actCount: 1, sceneCount: 1, estimatedLength: "short-episode", pageCount: 1,
    },
  },
];

export function getSceneById(id: string): FamousScene | undefined {
  return FAMOUS_SCENES.find((s) => s.id === id);
}
