"use client";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LogIn, GraduationCap } from "lucide-react";

export default function TenantLoginPage() {
  const router     = useRouter();
  const { slug }   = useParams<{ slug: string }>();
  const [tenant,   setTenant]   = useState<any>(null);
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");

  // Fetch tenant info by slug
  useEffect(() => {
    fetch(`/api/tenants/slug/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setTenant(d); setFetching(false); })
      .catch(() => setFetching(false));
  }, [slug]);

  const handleLogin = async () => {
    if (!username || !password) { setError("Enter username and password"); return; }
    setLoading(true); setError("");
    const result = await signIn("credentials", { username, password, redirect: false });
    setLoading(false);
    if (result?.error) { setError("Invalid username or password"); return; }

    const res  = await fetch("/api/auth/session");
    const sess = await res.json();
    const role = sess?.user?.role;
    const userTenantId = sess?.user?.tenantId;

    // Verify user belongs to this tenant
    if (tenant && userTenantId && String(userTenantId) !== String(tenant.id)) {
      setError("This account does not belong to this portal");
      return;
    }

    if      (role === "super_admin")     router.push("/super-admin");
    else if (role === "admin")           router.push("/admin");
    else if (role === "question_setter") router.push("/question-setter");
    else if (role === "student")         router.push("/student");
    else                                 router.push("/");
  };

  const inp: React.CSSProperties = {
    width:"100%", height:"2.75rem", padding:"0 0.875rem",
    borderRadius:"0.625rem", border:"1.5px solid #2c3650",
    background:"#090c13", color:"#e2e8f4", fontSize:"0.9rem",
    outline:"none", boxSizing:"border-box",
  };

  if (fetching) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#0b0e15" }}>
      <div style={{ width:"2rem", height:"2rem", border:"3px solid #172d56", borderTopColor:"#4f8ef7", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!tenant) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#0b0e15", fontFamily:"'Sora',system-ui,sans-serif" }}>
      <div style={{ textAlign:"center", padding:"2rem" }}>
        <div style={{ fontSize:"3rem", fontWeight:900, color:"#172d56", marginBottom:"1rem" }}>404</div>
        <h1 style={{ fontSize:"1.2rem", fontWeight:800, color:"#e2e8f4", margin:"0 0 0.5rem" }}>Portal not found</h1>
        <p style={{ fontSize:"0.85rem", color:"#3e4f6a", marginBottom:"1.5rem" }}>No portal exists for <strong style={{ color:"#4f8ef7" }}>{slug}</strong></p>
        <Link href="/login" style={{ color:"#4f8ef7", fontSize:"0.85rem" }}>Go to main login →</Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#0b0e15", fontFamily:"'Sora',system-ui,sans-serif" }}>
      <div style={{ width:"100%", maxWidth:"400px", padding:"2.5rem 2rem", background:"#111520", border:"1px solid #232c40", borderRadius:"1rem", boxShadow:"0 8px 40px rgba(0,0,0,0.6)" }}>

        {/* Tenant branding */}
        <div style={{ textAlign:"center", marginBottom:"2rem" }}>
          <div style={{ width:"3.5rem", height:"3.5rem", borderRadius:"1rem", background:"#0c1e3d", border:"1.5px solid #4f8ef7", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem" }}>
            <GraduationCap size={24} color="#4f8ef7"/>
          </div>
          <h1 style={{ fontSize:"1.3rem", fontWeight:800, color:"#e2e8f4", margin:"0 0 0.25rem" }}>{tenant.name}</h1>
          <p style={{ fontSize:"0.78rem", color:"#3e4f6a", margin:0 }}>Student Portal · Sign in to continue</p>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          <div>
            <label style={{ fontSize:"0.72rem", fontWeight:600, color:"#7d8fac", display:"block", marginBottom:"0.35rem" }}>Username</label>
            <input value={username} onChange={e=>setUsername(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}
              placeholder="your_username" style={inp}
              onFocus={e=>(e.target.style.borderColor="#4f8ef7")} onBlur={e=>(e.target.style.borderColor="#2c3650")}/>
          </div>
          <div>
            <label style={{ fontSize:"0.72rem", fontWeight:600, color:"#7d8fac", display:"block", marginBottom:"0.35rem" }}>Password</label>
            <div style={{ position:"relative" }}>
              <input type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                placeholder="••••••••" style={{ ...inp, paddingRight:"2.75rem" }}
                onFocus={e=>(e.target.style.borderColor="#4f8ef7")} onBlur={e=>(e.target.style.borderColor="#2c3650")}/>
              <button onClick={()=>setShowPw(v=>!v)} style={{ position:"absolute", right:"0.75rem", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#3e4f6a" }}>
                {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>

          {error && <p style={{ fontSize:"0.78rem", color:"#f87171", margin:0, textAlign:"center" }}>{error}</p>}

          <button onClick={handleLogin} disabled={loading}
            style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem", width:"100%", height:"2.75rem", borderRadius:"0.625rem", border:"none", background:loading?"#172d56":"#4f8ef7", color:"#fff", fontWeight:700, fontSize:"0.9rem", cursor:loading?"not-allowed":"pointer" }}>
            {loading ? "Signing in..." : <><LogIn size={16}/> Sign In</>}
          </button>

          <p style={{ textAlign:"center", fontSize:"0.8rem", color:"#3e4f6a", margin:0 }}>
            New student?{" "}
            <Link href={`/register/${slug}`} style={{ color:"#4f8ef7", textDecoration:"none", fontWeight:600 }}>Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}