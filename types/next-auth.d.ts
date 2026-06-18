import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

// Extend the Auth.js session and token with the workspace fields the platform needs.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      tenantId: string | null;
      role: Role | null;
      isPlatformAdmin: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    tenantId: string | null;
    role: Role | null;
    isPlatformAdmin: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid: string;
    tenantId: string | null;
    role: Role | null;
    isPlatformAdmin: boolean;
  }
}
