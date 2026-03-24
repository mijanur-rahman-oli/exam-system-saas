"use client";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BookOpen, Clock, Trophy, Search, GraduationCap } from "lucide-react";
import { useState } from "react";

export default function StudentExamsPage() {
  const searchParams = useSearchParams();
  const defaultCourse = searchParams.get("courseId") ?? "all";
  const [courseFilter, setCourseFilter] = useState(defaultCourse);
  const [search, setSearch] = useState("");

  const { data: enrollments } = useQuery({
    queryKey: ["student-enrollments"],
    queryFn: () => fetch("/api/enrollments").then(r => r.json()),
  });

  const { data: exams, isLoading } = useQuery({
    queryKey: ["student-exams"],
    queryFn: async () => {
      const r = await fetch("/api/student/exams");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const courses = enrollments?.map((e:any) => e.course) ?? [];

  const filtered = (exams ?? []).filter((e:any) => {
    const matchesCourse = courseFilter === "all" || String(e.courseId) === courseFilter;
    const matchesSearch = !search || e.examName.toLowerCase().includes(search.toLowerCase());
    return matchesCourse && matchesSearch;
  });

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:"1.75rem" }}>
      <div>
        <h1 style={{ fontSize:"1.3rem",fontWeight:800,color:"var(--text)",margin:0 }}>Available Exams</h1>
        <p style={{ fontSize:"0.82rem",color:"var(--text3)",marginTop:"0.25rem" }}>{filtered.length} exam{filtered.length!==1?"s":""} available</p>
      </div>

      {/* Filters */}
      <div style={{ display:"flex",gap:"0.75rem",flexWrap:"wrap" }}>
        <div style={{ position:"relative",flex:1,minWidth:"180px" }}>
          <Search size={13} style={{ position:"absolute",left:"0.75rem",top:"50%",transform:"translateY(-50%)",color:"var(--text3)" }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search exams..."
            style={{ width:"100%",height:"2.25rem",paddingLeft:"2.1rem",borderRadius:"0.5rem",border:"1.5px solid var(--border)",background:"var(--input-bg)",color:"var(--text)",fontSize:"0.82rem",outline:"none",boxSizing:"border-box" as any }}/>
        </div>
        <select value={courseFilter} onChange={e=>setCourseFilter(e.target.value)}
          style={{ height:"2.25rem",padding:"0 0.75rem",borderRadius:"0.5rem",border:"1.5px solid var(--border)",background:"var(--input-bg)",color:"var(--text)",fontSize:"0.82rem",outline:"none",appearance:"none" as any }}>
          <option value="all">All Courses</option>
          {courses.map((c:any) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div style={{ display:"flex",alignItems:"center",justifyContent:"center",minHeight:"40vh",flexDirection:"column",gap:"1rem" }}>
          <div style={{ width:"2.5rem",height:"2.5rem",border:"3px solid var(--border)",borderTopColor:"var(--accent)",borderRadius:"50%",animation:"spin 0.8s linear infinite" }}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : !filtered.length ? (
        <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"3rem",textAlign:"center" }}>
          <BookOpen size={36} style={{ color:"var(--text3)",margin:"0 auto 1rem",display:"block" }}/>
          <p style={{ color:"var(--text3)",margin:0 }}>{exams?.length===0?"No exams available for your courses yet.":"No exams match your filter."}</p>
        </div>
      ) : (
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:"1.25rem" }}>
          {filtered.map((exam:any) => (
            <div key={exam.id} style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"1.5rem",display:"flex",flexDirection:"column",gap:"1rem",transition:"border-color 0.15s" }}
              onMouseEnter={e=>(e.currentTarget.style.borderColor="var(--accent-dim)")} onMouseLeave={e=>(e.currentTarget.style.borderColor="var(--border)")}>
              <div>
                <div style={{ display:"flex",alignItems:"center",gap:"0.4rem",marginBottom:"0.4rem" }}>
                  <GraduationCap size={12} color="var(--accent)"/>
                  <span style={{ fontSize:"0.68rem",color:"var(--accent)",fontWeight:600 }}>{exam.course?.name}</span>
                </div>
                <h3 style={{ fontSize:"0.95rem",fontWeight:700,color:"var(--text)",margin:"0 0 0.25rem" }}>{exam.examName}</h3>
                {exam.description && <p style={{ fontSize:"0.75rem",color:"var(--text3)",margin:0,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as any }}>{exam.description}</p>}
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem" }}>
                {[
                  { Icon:Clock,  val:`${exam.duration} min`,     label:"Duration" },
                  { Icon:Trophy, val:`${exam.totalMarks??0} pts`, label:"Marks"    },
                ].map(({ Icon, val, label }) => (
                  <div key={label} style={{ background:"var(--surface2)",borderRadius:"0.5rem",padding:"0.5rem 0.625rem",display:"flex",alignItems:"center",gap:"0.4rem" }}>
                    <Icon size={12} color="var(--text3)"/>
                    <div>
                      <div style={{ fontSize:"0.78rem",fontWeight:700,color:"var(--text)" }}>{val}</div>
                      <div style={{ fontSize:"0.62rem",color:"var(--text3)" }}>{label}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Link href={`/student/take-exam/${exam.id}`} style={{ textDecoration:"none" }}>
                <button style={{ width:"100%",padding:"0.6rem",borderRadius:"0.5rem",background:"var(--accent)",border:"none",color:"#fff",fontWeight:700,fontSize:"0.85rem",cursor:"pointer",transition:"opacity 0.15s" }}
                  onMouseEnter={e=>(e.currentTarget.style.opacity="0.9")} onMouseLeave={e=>(e.currentTarget.style.opacity="1")}>
                  Start Exam →
                </button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}