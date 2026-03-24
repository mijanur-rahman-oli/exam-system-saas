"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutDashboard, BookOpen, ClipboardList, GraduationCap, Trophy, Sun, Moon, Menu, X, LogOut } from "lucide-react";

function useTheme() {
  const [dark, setDark] = useState(true);
  useEffect(() => { const s = localStorage.getItem("portal-theme"); if (s !== null) setDark(s === "dark"); }, []);
  const toggle = () => setDark(v => { localStorage.setItem("portal-theme", !v ? "dark" : "light"); return !v; });
  return { dark, toggle };
}
function themeVars(dark: boolean): React.CSSProperties {
  return (dark ? {
    "--bg":"#0b0e15","--surface":"#111520","--surface2":"#181d2a","--surface3":"#1e2536",
    "--border":"#232c40","--border2":"#2c3650","--text":"#e2e8f4","--text2":"#7d8fac","--text3":"#3e4f6a",
    "--accent":"#4f8ef7","--accent-bg":"#0c1e3d","--accent-dim":"#172d56",
    "--green":"#34d399","--green-bg":"#042b1a","--amber":"#fbbf24","--amber-bg":"#1f1200",
    "--red":"#f87171","--red-bg":"#1f0808","--input-bg":"#090c13",
    "--shadow":"0 4px 24px rgba(0,0,0,0.5)","--radius":"0.75rem",
  } : {
    "--bg":"#eef1f8","--surface":"#ffffff","--surface2":"#f4f6fc","--surface3":"#eaecf5",
    "--border":"#dce1ef","--border2":"#c8d0e4","--text":"#1a2035","--text2":"#52637d","--text3":"#a0aec0",
    "--accent":"#2563eb","--accent-bg":"#eff4ff","--accent-dim":"#dbeafe",
    "--green":"#059669","--green-bg":"#ecfdf5","--amber":"#d97706","--amber-bg":"#fffbeb",
    "--red":"#dc2626","--red-bg":"#fef2f2","--input-bg":"#f8f9fd",
    "--shadow":"0 4px 24px rgba(0,0,0,0.07)","--radius":"0.75rem",
  }) as React.CSSProperties;
}

const NAV = [
  { href:"/student",            label:"Dashboard",   Icon:LayoutDashboard, exact:true },
  { href:"/student/courses",    label:"My Courses",  Icon:GraduationCap               },
  { href:"/student/exams",      label:"Exams",       Icon:BookOpen                    },
  { href:"/student/results",    label:"Results",     Icon:ClipboardList               },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { dark, toggle } = useTheme();
  const vars = themeVars(dark);
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [pathname]);

  const isActive = (href:string, exact?:boolean) => exact ? pathname===href : pathname.startsWith(href);
  const username = session?.user?.username ?? "Student";

  return (
    <div style={{ ...vars, display:"flex", minHeight:"100vh", background:"var(--bg)", color:"var(--text)", fontFamily:"'Sora','DM Sans',system-ui,sans-serif" }}>
      <aside className={`std-sidebar${open?" open":""}`} style={{ width:"220px", flexShrink:0, background:"var(--surface)", borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", position:"fixed", top:0, left:0, height:"100vh", zIndex:40, transition:"transform 0.22s ease" }}>
        <div style={{ padding:"1.25rem 1.25rem 1rem", borderBottom:"1px solid var(--border)" }}>
          <div style={{ fontSize:"0.78rem", fontWeight:800, color:"var(--text)" }}>Student Panel</div>
          <div style={{ fontSize:"0.6rem", color:"var(--text3)", textTransform:"uppercase" }}>Examinee Portal</div>
        </div>
        <nav style={{ flex:1, padding:"0.75rem", display:"flex", flexDirection:"column", gap:"0.2rem" }}>
          {NAV.map(({ href, label, Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link key={href} href={href} style={{ textDecoration:"none" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"0.65rem", padding:"0.55rem 0.75rem", borderRadius:"0.5rem", fontSize:"0.8rem", fontWeight:active?700:500, background:active?"var(--accent-bg)":"transparent", color:active?"var(--accent)":"var(--text2)", border:active?"1px solid var(--accent-dim)":"1px solid transparent", cursor:"pointer", transition:"all 0.15s" }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background="var(--surface2)"; e.currentTarget.style.color="var(--text)"; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="var(--text2)"; } }}>
                  <Icon size={15} />{label}
                </div>
              </Link>
            );
          })}
        </nav>
        <div style={{ padding:"0.75rem", borderTop:"1px solid var(--border)", display:"flex", flexDirection:"column", gap:"0.4rem" }}>
          <button onClick={toggle} style={{ display:"flex", alignItems:"center", gap:"0.6rem", padding:"0.5rem 0.75rem", borderRadius:"0.5rem", background:"var(--surface2)", border:"1px solid var(--border)", color:"var(--text2)", cursor:"pointer", fontSize:"0.78rem", width:"100%" }}>
            {dark ? <Sun size={13} /> : <Moon size={13} />} {dark ? "Light mode" : "Dark mode"}
          </button>
          <Link href="/api/auth/signout" style={{ textDecoration:"none" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", padding:"0.5rem 0.75rem", borderRadius:"0.5rem", color:"var(--red)", cursor:"pointer", fontSize:"0.78rem", transition:"all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background="var(--red-bg)"; }}
              onMouseLeave={e => { e.currentTarget.style.background="transparent"; }}>
              <LogOut size={13} /> Logout
            </div>
          </Link>
        </div>
      </aside>
      {open && <div onClick={() => setOpen(false)} style={{ position:"fixed", inset:0, zIndex:35, background:"rgba(0,0,0,0.45)" }} />}
      <div className="std-main" style={{ flex:1, marginLeft:"220px", display:"flex", flexDirection:"column" }}>
        <div className="std-topbar" style={{ display:"none", alignItems:"center", justifyContent:"space-between", padding:"0.75rem 1.25rem", background:"var(--surface)", borderBottom:"1px solid var(--border)", position:"sticky", top:0, zIndex:30 }}>
          <button onClick={() => setOpen(v => !v)} style={{ background:"none", border:"none", color:"var(--text)", cursor:"pointer" }}>{open ? <X size={20} /> : <Menu size={20} />}</button>
          <span style={{ fontSize:"0.85rem", fontWeight:700, color:"var(--accent)" }}>Student</span>
          <button onClick={toggle} style={{ background:"none", border:"none", color:"var(--text2)", cursor:"pointer" }}>{dark ? <Sun size={16} /> : <Moon size={16} />}</button>
        </div>
        <main style={{ flex:1, padding:"2rem" }}>{children}</main>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .std-sidebar { transform: translateX(-100%); }
          .std-sidebar.open { transform: translateX(0); }
          .std-main { margin-left: 0 !important; }
          .std-topbar { display: flex !important; }
        }
      `}</style>
    </div>
  );
}