"use client";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, X, GraduationCap, ToggleLeft, ToggleRight } from "lucide-react";

function Modal({ title, onClose, onSubmit, loading, children }: any) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"1.5rem", width:"100%", maxWidth:"420px" }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"1.25rem" }}>
          <h2 style={{ fontSize:"1rem", fontWeight:700, color:"var(--text)", margin:0 }}>{title}</h2>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text3)" }}><X size={18} /></button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>{children}</div>
        <div style={{ display:"flex", gap:"0.5rem", marginTop:"1.25rem", justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ padding:"0.5rem 1rem", borderRadius:"0.5rem", border:"1px solid var(--border)", background:"none", color:"var(--text2)", cursor:"pointer", fontSize:"0.82rem" }}>Cancel</button>
          <button onClick={onSubmit} disabled={loading} style={{ padding:"0.5rem 1.25rem", borderRadius:"0.5rem", border:"none", background:"var(--accent)", color:"#fff", cursor:"pointer", fontWeight:700, fontSize:"0.82rem", opacity:loading?0.7:1 }}>{loading?"Saving...":"Create"}</button>
        </div>
      </div>
    </div>
  );
}
const inp: React.CSSProperties = { width:"100%", height:"2.25rem", padding:"0 0.75rem", borderRadius:"0.5rem", border:"1.5px solid var(--border)", background:"var(--input-bg)", color:"var(--text)", fontSize:"0.82rem", outline:"none", boxSizing:"border-box" };
const lbl: React.CSSProperties = { fontSize:"0.72rem", fontWeight:600, color:"var(--text2)" };

export default function AdminCoursesPage() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState(""); const [desc, setDesc] = useState("");

  const { data: courses, refetch, isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: () => fetch("/api/courses").then(r => r.json()),
  });

  const create = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/courses", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ name, description:desc||null }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error);
    },
    onSuccess: () => { toast({ title:"Course created" }); setShowModal(false); setName(""); setDesc(""); refetch(); },
    onError: (e:any) => toast({ title:"Error", description:e.message, variant:"destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id:number) => { const r = await fetch(`/api/courses/${id}`, { method:"DELETE" }); if (!r.ok) throw new Error("Failed"); },
    onSuccess: () => { toast({ title:"Course deleted" }); refetch(); },
    onError: (e:any) => toast({ title:"Error", description:e.message, variant:"destructive" }),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, isActive }: { id:number; isActive:boolean }) => {
      await fetch(`/api/courses/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ isActive }) });
    },
    onSuccess: () => refetch(),
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.75rem" }}>
      {showModal && (
        <Modal title="New Course" onClose={() => setShowModal(false)} onSubmit={() => name.trim() && create.mutate()} loading={create.isPending}>
          <div><label style={lbl}>Name *</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. SAT Prep 2025" style={inp} onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")} /></div>
          <div><label style={lbl}>Description</label><input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional" style={inp} onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")} /></div>
        </Modal>
      )}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <h1 style={{ fontSize:"1.3rem", fontWeight:800, color:"var(--text)", margin:0 }}>Courses</h1>
          <p style={{ fontSize:"0.8rem", color:"var(--text3)", margin:0 }}>Manage courses for your coaching center</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ display:"flex", alignItems:"center", gap:"0.4rem", padding:"0.55rem 1.1rem", borderRadius:"0.5rem", background:"var(--accent)", border:"none", color:"#fff", fontWeight:700, fontSize:"0.82rem", cursor:"pointer" }}>
          <Plus size={15} /> New Course
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem" }}>
        {isLoading ? <p style={{ color:"var(--text3)" }}>Loading...</p> :
         !courses?.length ? (
          <div style={{ gridColumn:"1/-1", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"3rem", textAlign:"center" }}>
            <GraduationCap size={32} style={{ color:"var(--text3)", margin:"0 auto 1rem", display:"block" }} />
            <p style={{ color:"var(--text3)", margin:0 }}>No courses yet. Create your first course.</p>
          </div>
        ) : courses.map((c:any) => (
          <div key={c.id} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"1.25rem" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.75rem" }}>
              <div style={{ width:"2.25rem", height:"2.25rem", borderRadius:"0.5rem", background:"var(--accent-bg)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <GraduationCap size={16} color="var(--accent)" />
              </div>
              <div style={{ display:"flex", gap:"0.4rem" }}>
                <button onClick={() => toggle.mutate({ id:c.id, isActive:!c.isActive })} style={{ background:"none", border:"none", cursor:"pointer", color:c.isActive?"var(--green)":"var(--text3)" }}>
                  {c.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                </button>
                <button onClick={() => { if (confirm(`Delete "${c.name}"?`)) del.mutate(c.id); }} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text3)" }} onMouseEnter={e=>(e.currentTarget.style.color="var(--red)")} onMouseLeave={e=>(e.currentTarget.style.color="var(--text3)")}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            <h3 style={{ fontSize:"0.92rem", fontWeight:700, color:"var(--text)", margin:"0 0 0.25rem" }}>{c.name}</h3>
            {c.description && <p style={{ fontSize:"0.75rem", color:"var(--text3)", margin:"0 0 0.75rem" }}>{c.description}</p>}
            <div style={{ display:"flex", gap:"1rem", fontSize:"0.72rem", color:"var(--text3)" }}>
              <span>{c._count?.exams ?? 0} exams</span>
              <span>{c._count?.enrollments ?? 0} students</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}