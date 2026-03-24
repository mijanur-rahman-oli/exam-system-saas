"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { BookOpen, CheckCircle, Clock, GraduationCap, TrendingUp, ChevronRight, Trophy } from "lucide-react";

export default function StudentDashboard() {
  const { data: session } = useSession();

  const { data: stats } = useQuery({
    queryKey: ["student-stats"],
    queryFn: async () => {
      const r = await fetch("/api/student/stats");
      if (!r.ok) return { totalExams:0, completedExams:0, pendingExams:0, averageScore:0, enrolledCourses:0 };
      return r.json();
    },
  });

  const { data: enrollments } = useQuery({
    queryKey: ["student-enrollments"],
    queryFn: async () => {
      const r = await fetch("/api/enrollments");
      if (!r.ok) return [];
      return r.json();
    },
  });

  const { data: upcomingExams } = useQuery({
    queryKey: ["student-upcoming"],
    queryFn: async () => {
      const r = await fetch("/api/student/upcoming-exams");
      if (!r.ok) return [];
      return r.json();
    },
  });

  const { data: recentResults } = useQuery({
    queryKey: ["student-recent-results"],
    queryFn: async () => {
      const r = await fetch("/api/student/recent-results");
      if (!r.ok) return [];
      return r.json();
    },
  });

  const statCards = [
    { label:"Enrolled Courses", value:stats?.enrolledCourses??0,  Icon:GraduationCap, color:"var(--accent)", bg:"var(--accent-bg)" },
    { label:"Available Exams",  value:stats?.totalExams??0,       Icon:BookOpen,      color:"var(--amber)",  bg:"var(--amber-bg)"  },
    { label:"Completed",        value:stats?.completedExams??0,   Icon:CheckCircle,   color:"var(--green)",  bg:"var(--green-bg)"  },
    { label:"Avg Score",        value:`${stats?.averageScore??0}%`,Icon:TrendingUp,    color:"var(--accent)", bg:"var(--accent-bg)" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.75rem" }}>

      <div>
        <h1 style={{ fontSize:"1.3rem", fontWeight:800, color:"var(--text)", margin:0 }}>
          Welcome back, {session?.user?.username} 👋
        </h1>
        <p style={{ fontSize:"0.82rem", color:"var(--text3)", marginTop:"0.25rem" }}>Here's your learning overview</p>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"1rem" }}>
        {statCards.map(({ label,value,Icon,color,bg }) => (
          <div key={label} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"1.25rem", display:"flex", gap:"1rem", alignItems:"center" }}>
            <div style={{ width:"2.25rem", height:"2.25rem", borderRadius:"0.5rem", background:bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Icon size={16} color={color}/>
            </div>
            <div>
              <div style={{ fontSize:"1.5rem", fontWeight:900, color:"var(--text)", lineHeight:1 }}>{value}</div>
              <div style={{ fontSize:"0.7rem", color:"var(--text3)", marginTop:"0.15rem" }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.25rem" }}>

        {/* Upcoming exams */}
        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", overflow:"hidden" }}>
          <div style={{ padding:"0.875rem 1.25rem", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:"0.72rem", fontWeight:700, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.07em" }}>Available Exams</span>
            <Link href="/student/exams" style={{ fontSize:"0.72rem", color:"var(--accent)", textDecoration:"none" }}>View all →</Link>
          </div>
          {!upcomingExams?.length ? (
            <div style={{ padding:"2rem", textAlign:"center", color:"var(--text3)", fontSize:"0.82rem" }}>
              No exams available right now
            </div>
          ) : upcomingExams.map((exam:any) => (
            <Link key={exam.id} href={`/student/take-exam/${exam.id}`} style={{ textDecoration:"none" }}>
              <div style={{ padding:"0.875rem 1.25rem", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:"0.75rem", transition:"background 0.12s", cursor:"pointer" }}
                onMouseEnter={e=>(e.currentTarget.style.background="var(--surface2)")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:"0.82rem", fontWeight:600, color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{exam.examName}</div>
                  <div style={{ display:"flex", gap:"0.5rem", marginTop:"0.2rem", fontSize:"0.7rem", color:"var(--text3)" }}>
                    <span style={{ color:"var(--accent)" }}>{exam.course?.name}</span>
                    <span>· {exam.duration} min</span>
                    <span>· {exam.totalMarks??0} marks</span>
                  </div>
                </div>
                <ChevronRight size={14} color="var(--text3)"/>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent results */}
        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", overflow:"hidden" }}>
          <div style={{ padding:"0.875rem 1.25rem", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:"0.72rem", fontWeight:700, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.07em" }}>Recent Results</span>
            <Link href="/student/results" style={{ fontSize:"0.72rem", color:"var(--accent)", textDecoration:"none" }}>View all →</Link>
          </div>
          {!recentResults?.length ? (
            <div style={{ padding:"2rem", textAlign:"center", color:"var(--text3)", fontSize:"0.82rem" }}>
              No results yet. Take an exam!
            </div>
          ) : recentResults.slice(0,5).map((r:any) => {
            const pct = r.percentage ?? 0;
            const col = pct>=75?"var(--green)":pct>=50?"var(--amber)":"var(--red)";
            return (
              <Link key={r.id} href={`/student/results/${r.id}`} style={{ textDecoration:"none" }}>
                <div style={{ padding:"0.875rem 1.25rem", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:"0.75rem", transition:"background 0.12s", cursor:"pointer" }}
                  onMouseEnter={e=>(e.currentTarget.style.background="var(--surface2)")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                  <div style={{ width:"2.5rem", height:"2.5rem", borderRadius:"0.5rem", background:`${col}22`, border:`1px solid ${col}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <span style={{ fontSize:"0.75rem", fontWeight:900, color:col }}>{pct}%</span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:"0.82rem", fontWeight:600, color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.exam?.examName}</div>
                    <div style={{ fontSize:"0.7rem", color:"var(--text3)", marginTop:"0.15rem" }}>{r.exam?.course?.name}</div>
                  </div>
                  <span style={{ fontSize:"0.68rem", fontWeight:700, color:col, flexShrink:0 }}>{pct>=50?"PASS":"FAIL"}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}