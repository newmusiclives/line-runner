import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { getUserByEmail, verifyPassword, createUser, getUserById } from "@/lib/db/users";

export const { handlers, auth, signIn, signOut } = NextAuth({
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
          return { id: user.id, email: user.email, name: user.name, role: user.role };
        }

        const user = await getUserByEmail(email);
        if (!user) return null;
        if (user.suspended_at) return null;
        if (!verifyPassword(user, password)) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
        }
      }
      return true;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production",
});
