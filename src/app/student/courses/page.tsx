"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { GraduationCap, BookOpen, ChevronRight } from "lucide-react";

export default function StudentCoursesPage() {
  const { data: enrollments, isLoading } = useQuery({
    queryKey: ["student-enrollments"],
    queryFn: () => fetch("/api/enrollments").then(r => r.json()),
  });

  if (isLoading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh", flexDirection:"column", gap:"1rem" }}>
      <div style={{ width:"2.5rem", height:"2.5rem", border:"3px solid var(--border)", borderTopColor:"var(--accent)", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.75rem" }}>
      <div>
        <h1 style={{ fontSize:"1.3rem", fontWeight:800, color:"var(--text)", margin:0 }}>My Courses</h1>
        <p style={{ fontSize:"0.82rem", color:"var(--text3)", marginTop:"0.25rem" }}>Courses you are enrolled in</p>
      </div>

      {!enrollments?.length ? (
        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"3rem", textAlign:"center" }}>
          <GraduationCap size={36} style={{ color:"var(--text3)", margin:"0 auto 1rem", display:"block" }} />
          <p style={{ color:"var(--text3)" }}>You are not enrolled in any courses yet.</p>
          <p style={{ color:"var(--text3)", fontSize:"0.8rem" }}>Contact your admin to get enrolled.</p>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:"1.25rem" }}>
          {enrollments.map((e:any) => {
            const c = e.course;
            return (
              <div key={e.id} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"1.5rem", display:"flex", flexDirection:"column", gap:"1rem" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
                  <div style={{ width:"2.5rem", height:"2.5rem", borderRadius:"0.5rem", background:"var(--accent-bg)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <GraduationCap size={18} color="var(--accent)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize:"0.95rem", fontWeight:700, color:"var(--text)", margin:0 }}>{c.name}</h3>
                    {c.description && <p style={{ fontSize:"0.72rem", color:"var(--text3)", margin:0 }}>{c.description}</p>}
                  </div>
                </div>
                <div style={{ display:"flex", gap:"1rem", fontSize:"0.75rem", color:"var(--text3)", borderTop:"1px solid var(--border)", paddingTop:"0.75rem" }}>
                  <span style={{ display:"flex", alignItems:"center", gap:"0.3rem" }}><BookOpen size={12} /> {c._count?.exams ?? 0} exams</span>
                  <span style={{ fontSize:"0.7rem", color:"var(--text3)" }}>Enrolled {new Date(e.enrolledAt).toLocaleDateString()}</span>
                </div>
                <Link href={`/student/exams?courseId=${c.id}`} style={{ textDecoration:"none" }}>
                  <button style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.4rem", padding:"0.5rem", borderRadius:"0.5rem", background:"var(--accent-bg)", border:"1px solid var(--accent-dim)", color:"var(--accent)", cursor:"pointer", fontSize:"0.8rem", fontWeight:600 }}>
                    View Exams <ChevronRight size={14} />
                  </button>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}