"use client";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, X, BookOpen, FileText } from "lucide-react";

function Modal({ title, onClose, onSubmit, loading, children }: any) {
  return (
    <div style={{ position:"fixed",inset:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"1.5rem",width:"100%",maxWidth:"420px" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:"1.25rem" }}>
          <h2 style={{ fontSize:"1rem",fontWeight:700,color:"var(--text)",margin:0 }}>{title}</h2>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text3)" }}><X size={18}/></button>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:"0.75rem" }}>{children}</div>
        <div style={{ display:"flex",gap:"0.5rem",marginTop:"1.25rem",justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ padding:"0.5rem 1rem",borderRadius:"0.5rem",border:"1px solid var(--border)",background:"none",color:"var(--text2)",cursor:"pointer",fontSize:"0.82rem" }}>Cancel</button>
          <button onClick={onSubmit} disabled={loading} style={{ padding:"0.5rem 1.25rem",borderRadius:"0.5rem",border:"none",background:"var(--accent)",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:"0.82rem",opacity:loading?0.7:1 }}>{loading?"Saving...":"Save"}</button>
        </div>
      </div>
    </div>
  );
}

const inp: React.CSSProperties = { width:"100%",height:"2.25rem",padding:"0 0.75rem",borderRadius:"0.5rem",border:"1.5px solid var(--border)",background:"var(--input-bg)",color:"var(--text)",fontSize:"0.82rem",outline:"none",boxSizing:"border-box" };
const lbl: React.CSSProperties = { fontSize:"0.72rem",fontWeight:600,color:"var(--text2)" };

export default function AdminSubjectsPage() {
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const { data: subjects, refetch, isLoading } = useQuery({
    queryKey: ["admin-subjects"],
    queryFn: async () => {
      const r = await fetch("/api/subjects");
      const d = await r.json();
      return Array.isArray(d) ? d : [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/subjects", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ name:name.trim(), description:desc.trim()||null }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error||"Failed");
    },
    onSuccess: () => { toast({ title:"Subject created" }); setShowModal(false); setName(""); setDesc(""); refetch(); },
    onError: (e:any) => toast({ title:"Error", description:e.message, variant:"destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id:number) => {
      const r = await fetch(`/api/subjects/${id}`, { method:"DELETE" });
      if (!r.ok) { const d=await r.json(); throw new Error(d.error||"Failed"); }
    },
    onSuccess: () => { toast({ title:"Subject deleted" }); refetch(); },
    onError: (e:any) => toast({ title:"Error", description:e.message, variant:"destructive" }),
  });

  const stats = [
    { label:"Total Subjects",  value:subjects?.length??0,                                                          Icon:BookOpen, color:"var(--accent)", bg:"var(--accent-bg)" },
    { label:"Total Questions", value:subjects?.reduce((s:number,x:any)=>s+(x._count?.questions||0),0)??0,          Icon:FileText, color:"var(--amber)",  bg:"var(--amber-bg)"  },
  ];

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:"1.75rem" }}>
      {showModal && (
        <Modal title="New Subject" onClose={()=>setShowModal(false)} onSubmit={()=>name.trim()&&create.mutate()} loading={create.isPending}>
          <div><label style={lbl}>Name *</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Mathematics" style={inp}
              onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")}/>
          </div>
          <div><label style={lbl}>Description</label>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={2} placeholder="Optional"
              style={{ ...inp, height:"auto", padding:"0.5rem 0.75rem", resize:"vertical" as any }}
              onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")}/>
          </div>
        </Modal>
      )}

      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div>
          <h1 style={{ fontSize:"1.3rem",fontWeight:800,color:"var(--text)",margin:0 }}>Subjects</h1>
          <p style={{ fontSize:"0.8rem",color:"var(--text3)",margin:0 }}>Manage the master subject library</p>
        </div>
        <button onClick={()=>setShowModal(true)} style={{ display:"flex",alignItems:"center",gap:"0.4rem",padding:"0.55rem 1.1rem",borderRadius:"0.5rem",background:"var(--accent)",border:"none",color:"#fff",fontWeight:700,fontSize:"0.82rem",cursor:"pointer" }}>
          <Plus size={15}/> New Subject
        </button>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"1rem" }}>
        {stats.map(({ label,value,Icon,color,bg }) => (
          <div key={label} style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"1.25rem",display:"flex",gap:"1rem",alignItems:"center" }}>
            <div style={{ width:"2.25rem",height:"2.25rem",borderRadius:"0.5rem",background:bg,display:"flex",alignItems:"center",justifyContent:"center" }}>
              <Icon size={16} color={color}/>
            </div>
            <div>
              <div style={{ fontSize:"1.5rem",fontWeight:900,color:"var(--text)",lineHeight:1 }}>{value}</div>
              <div style={{ fontSize:"0.7rem",color:"var(--text3)",marginTop:"0.15rem" }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius)",overflow:"hidden" }}>
        <div style={{ padding:"0.875rem 1.25rem",borderBottom:"1px solid var(--border)" }}>
          <span style={{ fontSize:"0.72rem",fontWeight:700,color:"var(--text2)",textTransform:"uppercase",letterSpacing:"0.07em" }}>All Subjects</span>
        </div>
        {isLoading ? <div style={{ padding:"3rem",textAlign:"center",color:"var(--text3)" }}>Loading...</div> :
         !subjects?.length ? <div style={{ padding:"3rem",textAlign:"center",color:"var(--text3)" }}>No subjects yet. Create one above.</div> : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%",borderCollapse:"collapse",fontSize:"0.82rem" }}>
              <thead><tr style={{ background:"var(--surface2)",borderBottom:"1px solid var(--border)" }}>
                {["Name","Description","Questions","Actions"].map(h=>(
                  <th key={h} style={{ padding:"0.625rem 1.1rem",textAlign:"left",fontSize:"0.65rem",fontWeight:700,color:"var(--text3)",textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {subjects.map((s:any)=>(
                  <tr key={s.id} style={{ borderBottom:"1px solid var(--border)" }}>
                    <td style={{ padding:"0.875rem 1.1rem",fontWeight:600,color:"var(--text)" }}>
                      <div style={{ display:"flex",alignItems:"center",gap:"0.5rem" }}>
                        <BookOpen size={14} color="var(--accent)"/>{s.name}
                      </div>
                    </td>
                    <td style={{ padding:"0.875rem 1.1rem",color:"var(--text3)" }}>{s.description||"—"}</td>
                    <td style={{ padding:"0.875rem 1.1rem",color:"var(--text2)" }}>{s._count?.questions??0}</td>
                    <td style={{ padding:"0.875rem 1.1rem" }}>
                      <button onClick={()=>{if(confirm(`Delete "${s.name}"?`))del.mutate(s.id);}}
                        style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text3)",display:"flex",padding:"0.2rem",borderRadius:"0.25rem" }}
                        onMouseEnter={e=>(e.currentTarget.style.color="var(--red)")} onMouseLeave={e=>(e.currentTarget.style.color="var(--text3)")}>
                        <Trash2 size={14}/>
                      </button>
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