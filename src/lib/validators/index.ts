import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createScriptSchema = z.object({
  title: z.string().min(1),
  fileName: z.string().min(1),
  rawText: z.string().min(1),
  parsedData: z.string().min(1),
});

export const annotationSchema = z.object({
  lineId: z.string().min(1),
  noteType: z.enum(["personal", "blocking", "emotion", "director"]),
  content: z.string().min(1),
});

export const bookmarkSchema = z.object({
  label: z.string().min(1),
  startLineIdx: z.number().int().min(0),
  endLineIdx: z.number().int().min(0),
});

export const lineMetricsSchema = z.array(
  z.object({
    lineId: z.string(),
    lineIndex: z.number().int(),
    characterName: z.string(),
    timingMs: z.number().int(),
    skipped: z.boolean(),
    replayed: z.boolean(),
  })
);

export const paymentSchema = z.object({
  planId: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
});

// Scene Exchange
export const createSceneExchangeSchema = z.object({
  scriptId: z.string().min(1, "Script is required"),
  hostCharacter: z.string().min(1, "Your character name is required"),
  guestCharacter: z.string().min(1, "Partner character name is required"),
});

export const joinSceneExchangeSchema = z.object({
  action: z.enum(["join", "leave"]),
});

// Masterclass Marketplace
export const createMasterclassSchema = z.object({
  scriptTitle: z.string().min(1, "Script title is required"),
  price: z.number().min(1, "Price must be at least $1").max(500, "Price cannot exceed $500"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  annotationNotes: z.string().optional(),
});

export const purchaseMasterclassSchema = z.object({
  action: z.literal("purchase"),
});

// PASS Subscriptions
export const createPassSubscriptionSchema = z.object({
  actorUserId: z.string().min(1, "Actor is required"),
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});
