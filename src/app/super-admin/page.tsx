"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Building2, Users, BookOpen, Tag, ChevronRight, ToggleRight, ToggleLeft } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

export default function SuperAdminDashboard() {
  const { toast } = useToast();
  const { data: tenants, refetch } = useQuery({
    queryKey: ["sa-tenants"],
    queryFn: () => fetch("/api/tenants").then(r => r.json()),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const r = await fetch(`/api/tenants/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive }) });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: () => { toast({ title: "Updated" }); refetch(); },
  });

  const stats = [
    { label: "Total Tenants",  value: tenants?.length ?? 0,                                     Icon: Building2, color: "var(--accent)", bg: "var(--accent-bg)" },
    { label: "Active Tenants", value: tenants?.filter((t:any) => t.isActive).length ?? 0,        Icon: ToggleRight, color: "var(--green)", bg: "var(--green-bg)" },
    { label: "Total Users",    value: tenants?.reduce((s:number,t:any) => s+(t._count?.users||0),0)??0, Icon: Users, color: "var(--amber)", bg: "var(--amber-bg)" },
    { label: "Total Courses",  value: tenants?.reduce((s:number,t:any) => s+(t._count?.courses||0),0)??0, Icon: BookOpen, color: "var(--accent)", bg: "var(--accent-bg)" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"2rem" }}>
      <div>
        <h1 style={{ fontSize:"1.5rem", fontWeight:800, color:"var(--text)", margin:0 }}>Control Tower</h1>
        <p style={{ fontSize:"0.85rem", color:"var(--text2)", marginTop:"0.25rem" }}>Platform-wide overview</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"1rem" }}>
        {stats.map(({ label, value, Icon, color, bg }) => (
          <div key={label} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"1.25rem", display:"flex", gap:"1rem", alignItems:"center" }}>
            <div style={{ width:"2.25rem", height:"2.25rem", borderRadius:"0.5rem", background:bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Icon size={16} color={color} />
            </div>
            <div>
              <div style={{ fontSize:"1.6rem", fontWeight:900, color:"var(--text)", lineHeight:1 }}>{value}</div>
              <div style={{ fontSize:"0.72rem", color:"var(--text2)", marginTop:"0.2rem" }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", overflow:"hidden" }}>
        <div style={{ padding:"0.875rem 1.25rem", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:"0.78rem", fontWeight:700, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.07em" }}>All Tenants</span>
          <Link href="/super-admin/tenants" style={{ fontSize:"0.72rem", color:"var(--accent)", textDecoration:"none" }}>Manage →</Link>
        </div>
        {!tenants?.length ? (
          <div style={{ padding:"3rem", textAlign:"center", color:"var(--text3)" }}>No tenants yet</div>
        ) : tenants.map((t: any) => (
          <div key={t.id} style={{ padding:"0.875rem 1.25rem", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:"1rem" }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:"0.85rem", fontWeight:600, color:"var(--text)" }}>{t.name}</div>
              <div style={{ fontSize:"0.7rem", color:"var(--text3)" }}>{t.slug} · {t._count?.users ?? 0} users · {t._count?.courses ?? 0} courses</div>
            </div>
            <button onClick={() => toggle.mutate({ id: t.id, isActive: !t.isActive })}
              style={{ background:"none", border:"none", cursor:"pointer", color: t.isActive ? "var(--green)" : "var(--text3)" }}>
              {t.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            </button>
            <Link href={`/super-admin/tenants/${t.id}`}>
              <button style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text3)" }}><ChevronRight size={16} /></button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}