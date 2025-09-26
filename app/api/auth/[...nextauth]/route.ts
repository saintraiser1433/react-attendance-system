import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" as const },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("Auth attempt:", credentials?.email);
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }
        
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        console.log("User found:", !!user, user?.email);
        
        if (!user?.passwordHash) {
          console.log("No password hash found");
          return null;
        }
        
        // Block student role login
        if (user.role === "student") {
          console.log("Student login blocked:", user.email);
          return null;
        }
        
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        console.log("Password valid:", ok);
        
        if (!ok) return null;
        
        console.log("Auth successful for:", user.email);
        return { id: user.id, name: user.name, email: user.email, role: user.role } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = (user as any).role;
        token.id = (user as any).id;
      } else if (!token.role && token.email) {
        const db = await prisma.user.findUnique({ where: { email: token.email as string } });
        // Block student role - default to teacher if student role is found
        const role = db?.role === "student" ? "teacher" : (db?.role ?? "teacher");
        token.role = role;
        token.id = db?.id;
      }
      return token;
    },
    async session({ session, token }: any) {
      (session as any).user.role = token.role;
      (session as any).user.id = token.id;
      return session;
    },
  },
};

const handler = NextAuth(authOptions as any);
export { handler as GET, handler as POST };


