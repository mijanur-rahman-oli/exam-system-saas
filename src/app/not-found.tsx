"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const { data: session } = useSession();
  const role  = (session?.user as any)?.role;
  const home  = role === "super_admin" ? "/super-admin"
              : role === "admin"       ? "/admin"
              : role === "question_setter" ? "/question-setter"
              : role === "student"    ? "/student"
              : "/login";

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#0b0e15", fontFamily:"'Sora',system-ui,sans-serif" }}>
      <div style={{ textAlign:"center", padding:"2rem" }}>
        <div style={{ fontSize:"6rem", fontWeight:900, color:"#172d56", lineHeight:1, marginBottom:"1rem" }}>404</div>
        <h1 style={{ fontSize:"1.5rem", fontWeight:800, color:"#e2e8f4", margin:"0 0 0.5rem" }}>Page not found</h1>
        <p style={{ fontSize:"0.9rem", color:"#3e4f6a", marginBottom:"2rem" }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <div style={{ display:"flex", gap:"0.75rem", justifyContent:"center" }}>
          <button onClick={()=>window.history.back()}
            style={{ display:"flex", alignItems:"center", gap:"0.4rem", padding:"0.6rem 1.25rem", borderRadius:"0.625rem", border:"1px solid #232c40", background:"transparent", color:"#7d8fac", cursor:"pointer", fontSize:"0.85rem", fontWeight:600 }}>
            <ArrowLeft size={15}/> Go back
          </button>
          <Link href={home}>
            <button style={{ display:"flex", alignItems:"center", gap:"0.4rem", padding:"0.6rem 1.25rem", borderRadius:"0.625rem", border:"none", background:"#4f8ef7", color:"#fff", cursor:"pointer", fontSize:"0.85rem", fontWeight:700 }}>
              <Home size={15}/> Go home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}