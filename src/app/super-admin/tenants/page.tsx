"use client";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, X, Building2, ToggleLeft, ToggleRight } from "lucide-react";

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

export default function TenantsPage() {
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState(""); const [slug, setSlug] = useState("");

  const { data: tenants, refetch, isLoading } = useQuery({
    queryKey: ["sa-tenants"],
    queryFn: () => fetch("/api/tenants").then(r => r.json()),
  });

  const create = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/tenants", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ name, slug }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error);
    },
    onSuccess: () => { toast({ title:"Tenant created" }); setShowModal(false); setName(""); setSlug(""); refetch(); },
    onError: (e:any) => toast({ title:"Error", description:e.message, variant:"destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id:number) => {
      const r = await fetch(`/api/tenants/${id}`, { method:"DELETE" });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: () => { toast({ title:"Tenant deleted" }); refetch(); },
    onError: (e:any) => toast({ title:"Error", description:e.message, variant:"destructive" }),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, isActive }: { id:number; isActive:boolean }) => {
      await fetch(`/api/tenants/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ isActive }) });
    },
    onSuccess: () => { refetch(); },
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.75rem" }}>
      {showModal && (
        <Modal title="New Tenant" onClose={() => setShowModal(false)} onSubmit={() => name && slug && create.mutate()} loading={create.isPending}>
          <div><label style={lbl}>Name *</label><input value={name} onChange={e => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"")); }} placeholder="Acme Academy" style={inp} onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")} /></div>
          <div><label style={lbl}>Slug *</label><input value={slug} onChange={e => setSlug(e.target.value)} placeholder="acme-academy" style={inp} onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")} /></div>
        </Modal>
      )}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <h1 style={{ fontSize:"1.3rem", fontWeight:800, color:"var(--text)", margin:0 }}>Tenants</h1>
          <p style={{ fontSize:"0.8rem", color:"var(--text3)", margin:0 }}>Manage coaching center accounts</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ display:"flex", alignItems:"center", gap:"0.4rem", padding:"0.55rem 1.1rem", borderRadius:"0.5rem", background:"var(--accent)", border:"none", color:"#fff", fontWeight:700, fontSize:"0.82rem", cursor:"pointer" }}>
          <Plus size={15} /> New Tenant
        </button>
      </div>

      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", overflow:"hidden" }}>
        {isLoading ? <div style={{ padding:"3rem", textAlign:"center", color:"var(--text3)" }}>Loading...</div> :
         !tenants?.length ? <div style={{ padding:"3rem", textAlign:"center", color:"var(--text3)" }}>No tenants yet</div> : (
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.82rem" }}>
            <thead><tr style={{ background:"var(--surface2)", borderBottom:"1px solid var(--border)" }}>
              {["Name","Slug","Users","Courses","Status","Actions"].map(h => (
                <th key={h} style={{ padding:"0.625rem 1.1rem", textAlign:"left", fontSize:"0.65rem", fontWeight:700, color:"var(--text3)", textTransform:"uppercase" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {tenants.map((t:any) => (
                <tr key={t.id} style={{ borderBottom:"1px solid var(--border)" }}>
                  <td style={{ padding:"0.875rem 1.1rem", fontWeight:600, color:"var(--text)" }}>{t.name}</td>
                  <td style={{ padding:"0.875rem 1.1rem", color:"var(--text3)", fontFamily:"monospace", fontSize:"0.78rem" }}>{t.slug}</td>
                  <td style={{ padding:"0.875rem 1.1rem", color:"var(--text2)" }}>{t._count?.users ?? 0}</td>
                  <td style={{ padding:"0.875rem 1.1rem", color:"var(--text2)" }}>{t._count?.courses ?? 0}</td>
                  <td style={{ padding:"0.875rem 1.1rem" }}>
                    <span style={{ fontSize:"0.65rem", fontWeight:700, padding:"0.2rem 0.5rem", borderRadius:"999px", background:t.isActive?"var(--green-bg)":"var(--surface3)", color:t.isActive?"var(--green)":"var(--text3)" }}>
                      {t.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ padding:"0.875rem 1.1rem" }}>
                    <div style={{ display:"flex", gap:"0.5rem" }}>
                      <button onClick={() => toggle.mutate({ id:t.id, isActive:!t.isActive })} style={{ background:"none", border:"none", cursor:"pointer", color:t.isActive?"var(--green)":"var(--text3)" }}>
                        {t.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      </button>
                      <button onClick={() => { if (confirm(`Delete "${t.name}"?`)) del.mutate(t.id); }} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text3)", padding:"0.2rem", borderRadius:"0.25rem" }} onMouseEnter={e=>(e.currentTarget.style.color="var(--red)")} onMouseLeave={e=>(e.currentTarget.style.color="var(--text3)")}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}