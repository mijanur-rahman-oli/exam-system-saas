"use client";
import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Eye, Edit, ToggleLeft, ToggleRight, Trophy, BookOpen, Clock, FileQuestion } from "lucide-react";

export default function AdminExamsPage() {
  const { toast } = useToast();

  const { data: exams, refetch, isLoading } = useQuery({
    queryKey: ["admin-exams"],
    queryFn: async () => {
      const r = await fetch("/api/exams");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, isActive }: { id:number; isActive:boolean }) => {
      const r = await fetch(`/api/exams/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ isActive }) });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: () => { toast({ title:"Status updated" }); refetch(); },
    onError: (e:any) => toast({ title:"Error", description:e.message, variant:"destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id:number) => {
      const r = await fetch(`/api/exams/${id}`, { method:"DELETE" });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error||"Failed"); }
    },
    onSuccess: () => { toast({ title:"Exam deleted" }); refetch(); },
    onError: (e:any) => toast({ title:"Error", description:e.message, variant:"destructive" }),
  });

  const stats = [
    { label:"Total Exams",    value: exams?.length??0,                                                                            Icon:BookOpen,     color:"var(--accent)", bg:"var(--accent-bg)" },
    { label:"Active",         value: exams?.filter((e:any)=>e.isActive).length??0,                                                Icon:ToggleRight,  color:"var(--green)",  bg:"var(--green-bg)"  },
    { label:"Total Questions",value: exams?.reduce((s:number,e:any)=>s+(e.examQuestions?.length||0),0)??0,                        Icon:FileQuestion, color:"var(--amber)",  bg:"var(--amber-bg)"  },
    { label:"Avg Duration",   value: exams?.length ? `${Math.round(exams.reduce((s:number,e:any)=>s+e.duration,0)/exams.length)}m` : "0m", Icon:Clock, color:"var(--accent)", bg:"var(--accent-bg)" },
  ];

  if (isLoading) return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"center",minHeight:"400px" }}>
      <div style={{ width:"2rem",height:"2rem",border:"3px solid var(--border)",borderTopColor:"var(--accent)",borderRadius:"50%",animation:"spin 0.8s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:"2rem" }}>

      {/* Header */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div>
          <h1 style={{ fontSize:"1.5rem",fontWeight:800,color:"var(--text)",margin:0 }}>Exams</h1>
          <p style={{ fontSize:"0.82rem",color:"var(--text2)",marginTop:"0.25rem" }}>Manage all exams across your courses</p>
        </div>
        <Link href="/admin/exams/create">
          <button style={{ display:"flex",alignItems:"center",gap:"0.4rem",padding:"0.55rem 1.1rem",borderRadius:"0.5rem",background:"var(--accent)",border:"none",color:"#fff",fontWeight:700,fontSize:"0.82rem",cursor:"pointer" }}>
            <Plus size={16}/> Create Exam
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"1rem" }}>
        {stats.map(({ label,value,Icon,color,bg }) => (
          <div key={label} style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"1.25rem",display:"flex",gap:"1rem",alignItems:"center" }}>
            <div style={{ width:"2.25rem",height:"2.25rem",borderRadius:"0.5rem",background:bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
              <Icon size={15} color={color}/>
            </div>
            <div>
              <div style={{ fontSize:"1.5rem",fontWeight:900,color:"var(--text)",lineHeight:1 }}>{value}</div>
              <div style={{ fontSize:"0.7rem",color:"var(--text3)",marginTop:"0.15rem" }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius)",overflow:"hidden" }}>
        <div style={{ padding:"0.875rem 1.25rem",borderBottom:"1px solid var(--border)" }}>
          <span style={{ fontSize:"0.78rem",fontWeight:700,color:"var(--text2)",textTransform:"uppercase",letterSpacing:"0.07em" }}>All Exams</span>
        </div>
        {!exams?.length ? (
          <div style={{ padding:"4rem",textAlign:"center" }}>
            <BookOpen size={36} style={{ color:"var(--text3)",margin:"0 auto 1rem",display:"block" }}/>
            <p style={{ color:"var(--text3)",marginBottom:"1rem" }}>No exams yet</p>
            <Link href="/admin/exams/create">
              <button style={{ padding:"0.5rem 1.25rem",borderRadius:"0.5rem",background:"var(--accent)",border:"none",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:"0.82rem" }}>
                Create your first exam
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%",borderCollapse:"collapse",fontSize:"0.82rem" }}>
              <thead>
                <tr style={{ background:"var(--surface2)",borderBottom:"1px solid var(--border)" }}>
                  {["Exam Name","Course","Subject","Duration","Questions","Marks","Status","Actions"].map(h => (
                    <th key={h} style={{ padding:"0.625rem 1.1rem",textAlign:"left",fontSize:"0.65rem",fontWeight:700,color:"var(--text3)",textTransform:"uppercase",whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {exams.map((exam:any) => (
                  <tr key={exam.id} style={{ borderBottom:"1px solid var(--border)",transition:"background 0.12s" }}
                    onMouseEnter={e=>(e.currentTarget.style.background="var(--surface2)")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                    <td style={{ padding:"0.875rem 1.1rem" }}>
                      <div style={{ fontWeight:600,color:"var(--text)" }}>{exam.examName}</div>
                      {exam.description && <div style={{ fontSize:"0.7rem",color:"var(--text3)",marginTop:"0.15rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"200px" }}>{exam.description}</div>}
                    </td>
                    <td style={{ padding:"0.875rem 1.1rem" }}>
                      <span style={{ fontSize:"0.72rem",color:"var(--accent)",background:"var(--accent-bg)",padding:"0.2rem 0.5rem",borderRadius:"999px",fontWeight:600 }}>{exam.course?.name??"-"}</span>
                    </td>
                    <td style={{ padding:"0.875rem 1.1rem",color:"var(--text2)" }}>{exam.subject?.name??"-"}</td>
                    <td style={{ padding:"0.875rem 1.1rem",color:"var(--text2)",whiteSpace:"nowrap" }}>{exam.duration} min</td>
                    <td style={{ padding:"0.875rem 1.1rem",color:"var(--text2)" }}>{exam.examQuestions?.length??0}</td>
                    <td style={{ padding:"0.875rem 1.1rem",fontWeight:600,color:"var(--text)" }}>{exam.totalMarks??"-"}</td>
                    <td style={{ padding:"0.875rem 1.1rem" }}>
                      <span style={{ fontSize:"0.68rem",fontWeight:700,padding:"0.2rem 0.6rem",borderRadius:"999px",background:exam.isActive?"var(--green-bg)":"var(--surface3)",color:exam.isActive?"var(--green)":"var(--text3)" }}>
                        {exam.isActive?"Active":"Inactive"}
                      </span>
                    </td>
                    <td style={{ padding:"0.875rem 1.1rem" }}>
                      <div style={{ display:"flex",gap:"0.25rem",alignItems:"center" }}>
                        <Link href={`/admin/exams/${exam.id}/leaderboard`}>
                          <button style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text3)",padding:"0.3rem",borderRadius:"0.375rem" }} title="Leaderboard"
                            onMouseEnter={e=>{e.currentTarget.style.color="var(--amber)";e.currentTarget.style.background="var(--amber-bg)";}}
                            onMouseLeave={e=>{e.currentTarget.style.color="var(--text3)";e.currentTarget.style.background="transparent";}}>
                            <Trophy size={14}/>
                          </button>
                        </Link>
                        <Link href={`/admin/exams/${exam.id}`}>
                          <button style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text3)",padding:"0.3rem",borderRadius:"0.375rem" }} title="View"
                            onMouseEnter={e=>{e.currentTarget.style.color="var(--accent)";e.currentTarget.style.background="var(--accent-bg)";}}
                            onMouseLeave={e=>{e.currentTarget.style.color="var(--text3)";e.currentTarget.style.background="transparent";}}>
                            <Eye size={14}/>
                          </button>
                        </Link>
                        <Link href={`/admin/exams/${exam.id}/edit`}>
                          <button style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text3)",padding:"0.3rem",borderRadius:"0.375rem" }} title="Edit"
                            onMouseEnter={e=>{e.currentTarget.style.color="var(--accent)";e.currentTarget.style.background="var(--accent-bg)";}}
                            onMouseLeave={e=>{e.currentTarget.style.color="var(--text3)";e.currentTarget.style.background="transparent";}}>
                            <Edit size={14}/>
                          </button>
                        </Link>
                        <button onClick={()=>toggle.mutate({id:exam.id,isActive:!exam.isActive})}
                          style={{ background:"none",border:"none",cursor:"pointer",color:exam.isActive?"var(--green)":"var(--text3)",padding:"0.3rem",borderRadius:"0.375rem" }} title={exam.isActive?"Deactivate":"Activate"}>
                          {exam.isActive ? <ToggleRight size={14}/> : <ToggleLeft size={14}/>}
                        </button>
                        <button onClick={()=>{if(confirm(`Delete "${exam.examName}"?`))del.mutate(exam.id);}}
                          style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text3)",padding:"0.3rem",borderRadius:"0.375rem" }} title="Delete"
                          onMouseEnter={e=>{e.currentTarget.style.color="var(--red)";e.currentTarget.style.background="var(--red-bg)";}}
                          onMouseLeave={e=>{e.currentTarget.style.color="var(--text3)";e.currentTarget.style.background="transparent";}}>
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}