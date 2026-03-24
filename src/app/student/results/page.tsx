"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ClipboardList, Trophy, GraduationCap, Calendar } from "lucide-react";

export default function StudentResultsPage() {
  const { data: results, isLoading } = useQuery({
    queryKey: ["student-results"],
    queryFn: async () => {
      const r = await fetch("/api/student/recent-results");
      if (!r.ok) return [];
      return r.json();
    },
  });

  if (isLoading) return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",flexDirection:"column",gap:"1rem" }}>
      <div style={{ width:"2.5rem",height:"2.5rem",border:"3px solid var(--border)",borderTopColor:"var(--accent)",borderRadius:"50%",animation:"spin 0.8s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:"1.75rem" }}>
      <div>
        <h1 style={{ fontSize:"1.3rem",fontWeight:800,color:"var(--text)",margin:0 }}>My Results</h1>
        <p style={{ fontSize:"0.82rem",color:"var(--text3)",marginTop:"0.25rem" }}>{results?.length??0} completed exam{results?.length!==1?"s":""}</p>
      </div>

      {!results?.length ? (
        <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"3rem",textAlign:"center" }}>
          <ClipboardList size={36} style={{ color:"var(--text3)",margin:"0 auto 1rem",display:"block" }}/>
          <p style={{ color:"var(--text3)",margin:0 }}>No results yet. Take an exam to see your results here.</p>
          <Link href="/student/exams" style={{ textDecoration:"none" }}>
            <button style={{ marginTop:"1rem",padding:"0.5rem 1.25rem",borderRadius:"0.5rem",background:"var(--accent)",border:"none",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:"0.82rem" }}>
              Browse Exams
            </button>
          </Link>
        </div>
      ) : (
        <div style={{ display:"flex",flexDirection:"column",gap:"0.75rem" }}>
          {results.map((r:any) => {
            const pct = r.percentage ?? 0;
            const col = pct>=75?"var(--green)":pct>=50?"var(--amber)":"var(--red)";
            const bg  = pct>=75?"var(--green-bg)":pct>=50?"var(--amber-bg)":"var(--red-bg)";
            return (
              <Link key={r.id} href={`/student/results/${r.id}`} style={{ textDecoration:"none" }}>
                <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"1.25rem",display:"flex",alignItems:"center",gap:"1.25rem",transition:"border-color 0.15s",cursor:"pointer" }}
                  onMouseEnter={e=>(e.currentTarget.style.borderColor="var(--accent-dim)")} onMouseLeave={e=>(e.currentTarget.style.borderColor="var(--border)")}>
                  {/* Score badge */}
                  <div style={{ width:"3.5rem",height:"3.5rem",borderRadius:"0.75rem",background:bg,border:`1px solid ${col}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                    <span style={{ fontSize:"1.1rem",fontWeight:900,color:col,lineHeight:1 }}>{pct}%</span>
                  </div>
                  {/* Info */}
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:"0.9rem",fontWeight:700,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{r.exam?.examName}</div>
                    <div style={{ display:"flex",gap:"0.5rem",marginTop:"0.25rem",flexWrap:"wrap" }}>
                      {r.exam?.course?.name && (
                        <span style={{ display:"flex",alignItems:"center",gap:"0.25rem",fontSize:"0.7rem",color:"var(--accent)" }}>
                          <GraduationCap size={11}/>{r.exam.course.name}
                        </span>
                      )}
                      <span style={{ fontSize:"0.7rem",color:"var(--text3)",display:"flex",alignItems:"center",gap:"0.25rem" }}>
                        <Trophy size={11}/>{r.score??0}/{r.exam?.totalMarks??0} marks
                      </span>
                      {r.submittedAt && (
                        <span style={{ fontSize:"0.7rem",color:"var(--text3)",display:"flex",alignItems:"center",gap:"0.25rem" }}>
                          <Calendar size={11}/>{new Date(r.submittedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize:"0.72rem",fontWeight:700,color:col,flexShrink:0 }}>
                    {pct>=50?"PASSED":"FAILED"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}