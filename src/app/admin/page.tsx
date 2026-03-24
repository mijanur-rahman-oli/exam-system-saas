"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { BookOpen, Users, GraduationCap, ClipboardList, ToggleRight, TrendingUp, Plus } from "lucide-react";

export default function AdminDashboard() {
  const { data: session } = useSession();
  const tenantName = (session?.user as any)?.tenant?.name ?? "Your Tenant";

  const { data: exams }  = useQuery({ queryKey:["admin-exams"],   queryFn:()=>fetch("/api/exams").then(r=>r.json()) });
  const { data: courses } = useQuery({ queryKey:["admin-courses"], queryFn:()=>fetch("/api/courses").then(r=>r.json()) });
  const { data: users }   = useQuery({ queryKey:["admin-users"],   queryFn:()=>fetch("/api/admin/users").then(r=>r.json()) });

  const activeExams    = exams?.filter((e:any)=>e.isActive).length   ?? 0;
  const totalStudents  = users?.filter((u:any)=>u.role==="student").length ?? 0;
  const totalQuestions = exams?.reduce((s:number,e:any)=>s+(e.examQuestions?.length||0),0) ?? 0;

  const stats = [
    { label:"Total Exams",    value:exams?.length??0,   Icon:ClipboardList, color:"var(--accent)", bg:"var(--accent-bg)", href:"/admin/exams"    },
    { label:"Active Exams",   value:activeExams,         Icon:ToggleRight,   color:"var(--green)",  bg:"var(--green-bg)",  href:"/admin/exams"    },
    { label:"Courses",        value:courses?.length??0,  Icon:GraduationCap, color:"var(--amber)",  bg:"var(--amber-bg)",  href:"/admin/courses"  },
    { label:"Students",       value:totalStudents,       Icon:Users,         color:"var(--accent)", bg:"var(--accent-bg)", href:"/admin/users"    },
  ];

  const quickActions = [
    { label:"Create Exam",    href:"/admin/exams/create",   Icon:Plus,           color:"var(--accent)" },
    { label:"Create Course",  href:"/admin/courses",        Icon:GraduationCap,  color:"var(--amber)"  },
    { label:"Manage Users",   href:"/admin/users",          Icon:Users,          color:"var(--green)"  },
    { label:"Manage Tags",    href:"/admin/tags",           Icon:TrendingUp,     color:"var(--accent)" },
  ];

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:"1.75rem" }}>

      <div>
        <h1 style={{ fontSize:"1.5rem",fontWeight:800,color:"var(--text)",margin:0 }}>
          {tenantName} Dashboard
        </h1>
        <p style={{ fontSize:"0.82rem",color:"var(--text2)",marginTop:"0.25rem" }}>
          Welcome back, {session?.user?.username}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"1rem" }}>
        {stats.map(({ label,value,Icon,color,bg,href }) => (
          <Link key={label} href={href} style={{ textDecoration:"none" }}>
            <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"1.25rem",display:"flex",gap:"1rem",alignItems:"center",cursor:"pointer",transition:"border-color 0.15s" }}
              onMouseEnter={e=>(e.currentTarget.style.borderColor="var(--accent-dim)")} onMouseLeave={e=>(e.currentTarget.style.borderColor="var(--border)")}>
              <div style={{ width:"2.25rem",height:"2.25rem",borderRadius:"0.5rem",background:bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                <Icon size={16} color={color}/>
              </div>
              <div>
                <div style={{ fontSize:"1.5rem",fontWeight:900,color:"var(--text)",lineHeight:1 }}>{value}</div>
                <div style={{ fontSize:"0.7rem",color:"var(--text3)",marginTop:"0.15rem" }}>{label}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"1.25rem" }}>
        <p style={{ fontSize:"0.72rem",fontWeight:700,color:"var(--text2)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:"1rem" }}>Quick Actions</p>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"0.75rem" }}>
          {quickActions.map(({ label,href,Icon,color }) => (
            <Link key={label} href={href} style={{ textDecoration:"none" }}>
              <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:"0.5rem",padding:"1rem",borderRadius:"0.625rem",border:"1px solid var(--border)",cursor:"pointer",transition:"all 0.15s",textAlign:"center" }}
                onMouseEnter={e=>{e.currentTarget.style.background="var(--surface2)";e.currentTarget.style.borderColor="var(--border2)";}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="var(--border)";}}>
                <Icon size={20} color={color}/>
                <span style={{ fontSize:"0.75rem",fontWeight:600,color:"var(--text2)" }}>{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent exams */}
      <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius)",overflow:"hidden" }}>
        <div style={{ padding:"0.875rem 1.25rem",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between" }}>
          <span style={{ fontSize:"0.72rem",fontWeight:700,color:"var(--text2)",textTransform:"uppercase",letterSpacing:"0.07em" }}>Recent Exams</span>
          <Link href="/admin/exams" style={{ fontSize:"0.72rem",color:"var(--accent)",textDecoration:"none" }}>View all →</Link>
        </div>
        {!exams?.length ? <div style={{ padding:"2rem",textAlign:"center",color:"var(--text3)",fontSize:"0.82rem" }}>No exams yet</div> :
         exams.slice(0,5).map((exam:any) => (
          <Link key={exam.id} href={`/admin/exams/${exam.id}`} style={{ textDecoration:"none" }}>
            <div style={{ padding:"0.875rem 1.25rem",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:"1rem",transition:"background 0.12s",cursor:"pointer" }}
              onMouseEnter={e=>(e.currentTarget.style.background="var(--surface2)")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:"0.85rem",fontWeight:600,color:"var(--text)" }}>{exam.examName}</div>
                <div style={{ fontSize:"0.7rem",color:"var(--text3)",marginTop:"0.15rem" }}>{exam.course?.name} · {exam.subject?.name} · {exam.examQuestions?.length??0} questions</div>
              </div>
              <span style={{ fontSize:"0.68rem",fontWeight:700,padding:"0.2rem 0.5rem",borderRadius:"999px",background:exam.isActive?"var(--green-bg)":"var(--surface3)",color:exam.isActive?"var(--green)":"var(--text3)" }}>
                {exam.isActive?"Active":"Inactive"}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}