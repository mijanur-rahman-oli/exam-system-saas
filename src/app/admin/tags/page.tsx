"use client";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Search, Tag } from "lucide-react";

export default function AdminTagsPage() {
  const { toast } = useToast();
  const [newTag, setNewTag] = useState(""); const [search, setSearch] = useState("");

  const { data: tags, refetch, isLoading } = useQuery({
    queryKey: ["admin-tags", search],
    queryFn: () => fetch(`/api/tags?search=${encodeURIComponent(search)}`).then(r => r.json()),
  });

  const create = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/tags", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ name:newTag.trim() }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error);
    },
    onSuccess: () => { toast({ title:"Tag created" }); setNewTag(""); refetch(); },
    onError: (e:any) => toast({ title:"Error", description:e.message, variant:"destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id:number) => { await fetch(`/api/tags/${id}`, { method:"DELETE" }); },
    onSuccess: () => { toast({ title:"Tag deleted" }); refetch(); },
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.75rem" }}>
      <div>
        <h1 style={{ fontSize:"1.3rem", fontWeight:800, color:"var(--text)", margin:0 }}>Tags</h1>
        <p style={{ fontSize:"0.8rem", color:"var(--text3)", margin:0 }}>Manage question tags for your tenant</p>
      </div>
      <div style={{ display:"flex", gap:"0.75rem" }}>
        <div style={{ position:"relative", flex:1 }}>
          <Search size={13} style={{ position:"absolute", left:"0.75rem", top:"50%", transform:"translateY(-50%)", color:"var(--text3)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tags..." style={{ width:"100%", height:"2.25rem", paddingLeft:"2.1rem", borderRadius:"0.5rem", border:"1.5px solid var(--border)", background:"var(--input-bg)", color:"var(--text)", fontSize:"0.82rem", outline:"none", boxSizing:"border-box" as any }} />
        </div>
        <input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key==="Enter" && newTag.trim() && create.mutate()} placeholder="new-tag" style={{ height:"2.25rem", padding:"0 0.75rem", borderRadius:"0.5rem", border:"1.5px solid var(--border)", background:"var(--input-bg)", color:"var(--text)", fontSize:"0.82rem", outline:"none", minWidth:"150px" }} />
        <button onClick={() => newTag.trim() && create.mutate()} disabled={create.isPending||!newTag.trim()} style={{ display:"flex", alignItems:"center", gap:"0.4rem", padding:"0 1rem", borderRadius:"0.5rem", background:"var(--accent)", border:"none", color:"#fff", fontWeight:700, fontSize:"0.82rem", cursor:"pointer", height:"2.25rem" }}>
          <Plus size={14} /> Add
        </button>
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:"0.625rem" }}>
        {isLoading ? <p style={{ color:"var(--text3)", fontSize:"0.82rem" }}>Loading...</p> :
         !tags?.length ? <p style={{ color:"var(--text3)", fontSize:"0.82rem" }}>No tags yet. Add your first tag above.</p> :
         tags.map((t:any) => (
          <div key={t.id} style={{ display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.35rem 0.75rem", borderRadius:"999px", background:"var(--surface2)", border:"1px solid var(--border)", fontSize:"0.8rem" }}>
            <Tag size={11} color="var(--accent)" />
            <span style={{ color:"var(--accent)", fontWeight:600 }}>#{t.name}</span>
            <span style={{ fontSize:"0.65rem", color:"var(--text3)" }}>{t._count?.questions ?? 0}q</span>
            <button onClick={() => del.mutate(t.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text3)", display:"flex", padding:"0.1rem" }} onMouseEnter={e=>(e.currentTarget.style.color="var(--red)")} onMouseLeave={e=>(e.currentTarget.style.color="var(--text3)")}>
              <Trash2 size={11} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}