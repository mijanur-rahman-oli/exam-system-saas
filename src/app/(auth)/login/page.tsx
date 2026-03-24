"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LogIn } from "lucide-react";

export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const registered   = searchParams.get("registered");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async () => {
    if (!username || !password) { setError("Enter username and password"); return; }
    setLoading(true); setError("");
    const result = await signIn("credentials", { username, password, redirect: false });
    setLoading(false);
    if (result?.error) { setError("Invalid username or password"); return; }
    const res  = await fetch("/api/auth/session");
    const sess = await res.json();
    const role = sess?.user?.role;
    if      (role === "super_admin")     router.push("/super-admin");
    else if (role === "admin")           router.push("/admin");
    else if (role === "question_setter") router.push("/question-setter");
    else if (role === "student")         router.push("/student");
    else                                 router.push("/");
  };

  const inp: React.CSSProperties = { width:"100%", height:"2.75rem", padding:"0 0.875rem", borderRadius:"0.625rem", border:"1.5px solid #2c3650", background:"#090c13", color:"#e2e8f4", fontSize:"0.9rem", outline:"none", boxSizing:"border-box" };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#0b0e15", fontFamily:"'Sora',system-ui,sans-serif" }}>
      <div style={{ width:"100%", maxWidth:"380px", padding:"2.5rem 2rem", background:"#111520", border:"1px solid #232c40", borderRadius:"1rem", boxShadow:"0 8px 40px rgba(0,0,0,0.6)" }}>
        <div style={{ textAlign:"center", marginBottom:"2rem" }}>
          <div style={{ width:"3rem", height:"3rem", borderRadius:"0.75rem", background:"#0c1e3d", border:"1.5px solid #4f8ef7", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem", fontSize:"1.25rem", fontWeight:900, color:"#4f8ef7" }}>E</div>
          <h1 style={{ fontSize:"1.3rem", fontWeight:800, color:"#e2e8f4", margin:0 }}>Welcome back</h1>
          <p style={{ fontSize:"0.8rem", color:"#3e4f6a", marginTop:"0.4rem" }}>Sign in to your portal</p>
        </div>

        {registered && (
          <div style={{ padding:"0.625rem 0.875rem", background:"#042b1a", border:"1px solid #34d399", borderRadius:"0.5rem", marginBottom:"1.25rem", fontSize:"0.78rem", color:"#34d399", textAlign:"center" }}>
            Account created! Sign in below.
          </div>
        )}

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
            style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem", width:"100%", height:"2.75rem", borderRadius:"0.625rem", border:"none", background:loading?"#172d56":"#4f8ef7", color:"#fff", fontWeight:700, fontSize:"0.9rem", cursor:loading?"not-allowed":"pointer", marginTop:"0.25rem" }}>
            {loading ? "Signing in..." : <><LogIn size={16}/> Sign In</>}
          </button>
        </div>
      </div>
    </div>
  );
}