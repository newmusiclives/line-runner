import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { getUserByEmail, verifyPassword, createUser } from "@/lib/db/users";
import { ensureTable, getSetting } from "@/lib/db/integrations";
import { syncContactToGhl } from "@/lib/gohighlevel";

const AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
if (!AUTH_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("AUTH_SECRET (or NEXTAUTH_SECRET) must be set in production");
}

// Cache Google creds so we don't hit DB on every request
let cachedGoogleCreds: { clientId: string; clientSecret: string } | null | undefined = undefined;

async function getGoogleCredentials(): Promise<{ clientId: string; clientSecret: string } | null> {
  // Prefer env vars
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    return {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    };
  }
  // Fall back to DB integration settings
  if (cachedGoogleCreds !== undefined) return cachedGoogleCreds;
  try {
    await ensureTable();
    const clientId = await getSetting("google_client_id");
    const clientSecret = await getSetting("google_client_secret");
    if (clientId && clientSecret) {
      cachedGoogleCreds = { clientId, clientSecret };
      return cachedGoogleCreds;
    }
  } catch {
    // DB not available yet
  }
  cachedGoogleCreds = null;
  // Reset cache after 60s so new settings are picked up
  setTimeout(() => { cachedGoogleCreds = undefined; }, 60_000);
  return null;
}

// Build providers list — Google is added dynamically
const googleCreds = process.env.GOOGLE_CLIENT_ID
  ? { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET! }
  : null;

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
        isRegister: { label: "Register", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        const name = credentials?.name as string;
        const isRegister = credentials?.isRegister === "true";

        if (!email || !password) return null;

        if (isRegister) {
          const existing = await getUserByEmail(email);
          if (existing) return null;
          const user = await createUser(email, name || email.split("@")[0], password);
          // Sync new user to GoHighLevel CRM
          syncContactToGhl({
            email: user.email,
            name: user.name,
            tags: ["new-user", "credentials"],
          }).catch(() => {});
          return { id: user.id, email: user.email, name: user.name, role: user.role };
        }

        const user = await getUserByEmail(email);
        if (!user) return null;
        if (user.suspended_at) return null;
        if (!verifyPassword(user, password)) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
    ...(googleCreds
      ? [
          Google({
            clientId: googleCreds.clientId,
            clientSecret: googleCreds.clientSecret,
          }),
        ]
      : []),
  ],
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "user";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const existing = await getUserByEmail(user.email);
        if (!existing) {
          await createUser(user.email, user.name || user.email.split("@")[0]);
          // Sync new Google user to GoHighLevel CRM
          syncContactToGhl({
            email: user.email,
            name: user.name || user.email.split("@")[0],
            tags: ["new-user", "google-oauth"],
          }).catch(() => {});
        }
      }
      return true;
    },
  },
  secret: AUTH_SECRET,
});
