import type { NextAuthConfig } from "next-auth";

const authConfig = {
  pages: {
    signIn: "/login",
  },

  // Providers are defined in lib/auth.ts
  // Keep this empty so middleware does not load Prisma.
  providers: [],

  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;

      const isProtectedRoute =
        request.nextUrl.pathname.startsWith("/dashboard") ||
        request.nextUrl.pathname.startsWith("/settings");

      if (isProtectedRoute) {
        return isLoggedIn;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;