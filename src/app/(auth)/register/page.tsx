"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, UserPlus } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username:"", email:"", password:"", confirmPassword:"" });
  const [showPw, setShowPw]   = useState(false);
  const [error,  setError]    = useState("");
  const [loading,setLoading]  = useState(false);

  const handleRegister = async () => {
    if (!form.username||!form.email||!form.password) { setError("All fields are required"); return; }
    if (form.password !== form.confirmPassword)       { setError("Passwords do not match"); return; }
    if (form.password.length < 6)                    { setError("Password must be at least 6 characters"); return; }
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/auth/register", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ username:form.username, email:form.email, password:form.password }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error||"Registration failed"); return; }
      router.push("/login?registered=1");
    } catch { setError("Something went wrong. Try again."); }
    finally { setLoading(false); }
  };

  const f = (key:string) => ({
    value: (form as any)[key],
    onChange: (e:any) => setForm(p=>({...p,[key]:e.target.value})),
    onKeyDown: (e:any) => e.key==="Enter" && handleRegister(),
  });

  const inp: React.CSSProperties = { width:"100%", height:"2.75rem", padding:"0 0.875rem", borderRadius:"0.625rem", border:"1.5px solid #2c3650", background:"#090c13", color:"#e2e8f4", fontSize:"0.9rem", outline:"none", boxSizing:"border-box" };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#0b0e15", fontFamily:"'Sora',system-ui,sans-serif" }}>
      <div style={{ width:"100%", maxWidth:"400px", padding:"2.5rem 2rem", background:"#111520", border:"1px solid #232c40", borderRadius:"1rem", boxShadow:"0 8px 40px rgba(0,0,0,0.6)" }}>
        <div style={{ textAlign:"center", marginBottom:"2rem" }}>
          <div style={{ width:"3rem", height:"3rem", borderRadius:"0.75rem", background:"#0c1e3d", border:"1.5px solid #4f8ef7", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem", fontSize:"1.25rem", fontWeight:900, color:"#4f8ef7" }}>E</div>
          <h1 style={{ fontSize:"1.3rem", fontWeight:800, color:"#e2e8f4", margin:0 }}>Create Account</h1>
          <p style={{ fontSize:"0.8rem", color:"#3e4f6a", marginTop:"0.4rem" }}>Register as a student</p>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          {[
            { label:"Username", key:"username", type:"text",  placeholder:"your_username" },
            { label:"Email",    key:"email",    type:"email", placeholder:"you@example.com" },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label style={{ fontSize:"0.72rem", fontWeight:600, color:"#7d8fac", display:"block", marginBottom:"0.35rem" }}>{label}</label>
              <input type={type} placeholder={placeholder} {...f(key)} style={inp}
                onFocus={e=>(e.target.style.borderColor="#4f8ef7")} onBlur={e=>(e.target.style.borderColor="#2c3650")}/>
            </div>
          ))}

          {[
            { label:"Password",        key:"password",        placeholder:"Min 6 characters" },
            { label:"Confirm Password", key:"confirmPassword", placeholder:"Re-enter password" },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label style={{ fontSize:"0.72rem", fontWeight:600, color:"#7d8fac", display:"block", marginBottom:"0.35rem" }}>{label}</label>
              <div style={{ position:"relative" }}>
                <input type={showPw?"text":"password"} placeholder={placeholder} {...f(key)}
                  style={{ ...inp, paddingRight:"2.75rem" }}
                  onFocus={e=>(e.target.style.borderColor="#4f8ef7")} onBlur={e=>(e.target.style.borderColor="#2c3650")}/>
                <button onClick={()=>setShowPw(v=>!v)} style={{ position:"absolute", right:"0.75rem", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#3e4f6a" }}>
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
          ))}

          {error && <p style={{ fontSize:"0.78rem", color:"#f87171", margin:0, textAlign:"center" }}>{error}</p>}

          <button onClick={handleRegister} disabled={loading}
            style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem", width:"100%", height:"2.75rem", borderRadius:"0.625rem", border:"none", background:loading?"#172d56":"#4f8ef7", color:"#fff", fontWeight:700, fontSize:"0.9rem", cursor:loading?"not-allowed":"pointer", marginTop:"0.25rem" }}>
            {loading ? "Creating account..." : <><UserPlus size={16}/> Register</>}
          </button>

          <p style={{ textAlign:"center", fontSize:"0.8rem", color:"#3e4f6a", margin:0 }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color:"#4f8ef7", textDecoration:"none", fontWeight:600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}