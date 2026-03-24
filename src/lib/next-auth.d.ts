import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id:       string;
    username: string;
    role:     string;
    tenantId: string | null;
    tenant:   { id: number; name: string; slug: string } | null;
  }
  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id:       string;
    role:     string;
    username: string;
    tenantId: string | null;
    tenant:   { id: number; name: string; slug: string } | null;
  }
}