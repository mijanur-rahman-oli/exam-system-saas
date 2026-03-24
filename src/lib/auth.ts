import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
          include: {
            tenant: { select: { id:true, name:true, slug:true } },
          },
        });

        if (!user) return null;
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id:       String(user.id),
          username: user.username,
          email:    user.email ?? "",
          role:     user.role,
          tenantId: user.tenantId ? String(user.tenantId) : null,
          tenant:   user.tenant ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id       = user.id;
        token.role     = (user as any).role;
        token.username = (user as any).username;
        token.tenantId = (user as any).tenantId ?? null;
        token.tenant   = (user as any).tenant   ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id       = token.id       as string;
        (session.user as any).role     = token.role     as string;
        (session.user as any).username = token.username as string;
        (session.user as any).tenantId = token.tenantId as string | null;
        (session.user as any).tenant   = token.tenant   as any | null;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};