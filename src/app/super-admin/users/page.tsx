"use client";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Search, Trash2, X, UserMinus } from "lucide-react";

// Two-option modal: detach from tenant vs hard delete
function UserActionModal({ user, onClose, onDetach, onDelete, loading }: any) {
  return (
    <div style={{ position:"fixed",inset:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"1.5rem",width:"100%",maxWidth:"400px",boxShadow:"var(--shadow)" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:"1rem" }}>
          <h2 style={{ fontSize:"1rem",fontWeight:700,color:"var(--text)",margin:0 }}>Remove user</h2>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text3)" }}><X size={18}/></button>
        </div>
        <p style={{ fontSize:"0.82rem",color:"var(--text2)",marginBottom:"1.25rem" }}>
          What would you like to do with <strong style={{ color:"var(--text)" }}>{user?.username}</strong>
          {user?.tenant?.name && <> ({user.tenant.name})</>}?
        </p>
        <div style={{ display:"flex",flexDirection:"column",gap:"0.5rem" }}>
          {user?.tenant && (
            <button onClick={onDetach} disabled={loading}
              style={{ padding:"0.625rem 1rem",borderRadius:"0.5rem",border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--text2)",cursor:"pointer",fontSize:"0.82rem",textAlign:"left",display:"flex",flexDirection:"column",gap:"0.2rem",opacity:loading?0.6:1 }}>
              <span style={{ fontWeight:600,color:"var(--text)" }}>Remove from tenant</span>
              <span style={{ fontSize:"0.72rem" }}>Keeps the account — user can be re-added later</span>
            </button>
          )}
          <button onClick={onDelete} disabled={loading}
            style={{ padding:"0.625rem 1rem",borderRadius:"0.5rem",border:"1px solid var(--red)",background:"var(--red-bg)",color:"var(--red)",cursor:"pointer",fontSize:"0.82rem",textAlign:"left",display:"flex",flexDirection:"column",gap:"0.2rem",opacity:loading?0.6:1 }}>
            <span style={{ fontWeight:600 }}>Permanently delete user</span>
            <span style={{ fontSize:"0.72rem" }}>Deletes account, all attempts, and enrollments forever</span>
          </button>
        </div>
        <button onClick={onClose} disabled={loading}
          style={{ marginTop:"1rem",width:"100%",padding:"0.5rem",borderRadius:"0.5rem",border:"1px solid var(--border)",background:"none",color:"var(--text3)",cursor:"pointer",fontSize:"0.82rem" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function SuperAdminUsersPage() {
  const { toast } = useToast();
  const [search,     setSearch]     = useState("");
  const [role,       setRole]       = useState("all");
  const [tenantFilter, setTenantFilter] = useState("all");
  const [userAction, setUserAction] = useState<any>(null);

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ["sa-users", search, role, tenantFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search)              params.set("search", search);
      if (role !== "all")      params.set("role", role);
      if (tenantFilter !== "all") params.set("tenantId", tenantFilter);
      const r = await fetch(`/api/admin/users?${params}`);
      return r.json();
    },
  });

  const { data: tenants } = useQuery({
    queryKey: ["sa-tenants-filter"],
    queryFn: () => fetch("/api/tenants").then(r => r.json()),
  });

  // Detach from tenant only
  const detachUser = useMutation({
    mutationFn: async (u: any) => {
      const r = await fetch(
        `/api/super-admin/tenants/${u.tenant.id}/users/${u.id}?mode=detach`,
        { method: "DELETE" }
      );
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || "Failed"); }
    },
    onSuccess: () => { toast({ title: "User removed from tenant" }); setUserAction(null); refetch(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // Hard delete the user entirely
  const deleteUser = useMutation({
    mutationFn: async (u: any) => {
      // If user belongs to a tenant, use the tenant-scoped endpoint
      // Otherwise use the generic admin users endpoint
      const url = u.tenant
        ? `/api/super-admin/tenants/${u.tenant.id}/users/${u.id}?mode=delete`
        : `/api/admin/users/${u.id}`;
      const r = await fetch(url, { method: "DELETE" });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || "Failed"); }
    },
    onSuccess: () => { toast({ title: "User permanently deleted" }); setUserAction(null); refetch(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const roleColor: Record<string, string> = {
    super_admin: "var(--red)", admin: "var(--accent)",
    question_setter: "var(--amber)", student: "var(--green)",
  };
  const roleBg: Record<string, string> = {
    super_admin: "var(--red-bg)", admin: "var(--accent-bg)",
    question_setter: "var(--amber-bg)", student: "var(--green-bg)",
  };

  const inp: React.CSSProperties = {
    height: "2.25rem", padding: "0 0.75rem", borderRadius: "0.5rem",
    border: "1.5px solid var(--border)", background: "var(--input-bg)",
    color: "var(--text)", fontSize: "0.82rem", outline: "none",
  };

  const actionLoading = detachUser.isPending || deleteUser.isPending;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>

      {userAction && (
        <UserActionModal
          user={userAction}
          loading={actionLoading}
          onClose={() => !actionLoading && setUserAction(null)}
          onDetach={() => detachUser.mutate(userAction)}
          onDelete={() => {
            if (confirm(`Permanently delete "${userAction.username}"? This cannot be undone.`))
              deleteUser.mutate(userAction);
          }}
        />
      )}

      <div>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text)", margin: 0 }}>All Users</h1>
        <p style={{ fontSize: "0.8rem", color: "var(--text3)", margin: 0 }}>
          {users?.length ?? 0} users platform-wide
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <Search size={13} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text3)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search username or email..."
            style={{ ...inp, paddingLeft: "2.1rem", width: "100%", boxSizing: "border-box" as any }}
            onFocus={e => (e.target.style.borderColor = "var(--accent)")}
            onBlur={e => (e.target.style.borderColor = "var(--border)")} />
        </div>
        <select value={role} onChange={e => setRole(e.target.value)}
          style={{ ...inp, appearance: "none" as any }}>
          <option value="all">All Roles</option>
          {["super_admin", "admin", "question_setter", "student"].map(r => (
            <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
          ))}
        </select>
        <select value={tenantFilter} onChange={e => setTenantFilter(e.target.value)}
          style={{ ...inp, appearance: "none" as any }}>
          <option value="all">All Tenants</option>
          {tenants?.map((t: any) => (
            <option key={t.id} value={String(t.id)}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text3)" }}>Loading...</div>
        ) : !users?.length ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text3)" }}>No users found</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ background: "var(--surface2)", borderBottom: "1px solid var(--border)" }}>
                  {["Username", "Email", "Role", "Tenant", "Joined", "Actions"].map(h => (
                    <th key={h} style={{ padding: "0.625rem 1.1rem", textAlign: "left", fontSize: "0.65rem", fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.12s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--surface2)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "0.875rem 1.1rem", fontWeight: 600, color: "var(--text)" }}>{u.username}</td>
                    <td style={{ padding: "0.875rem 1.1rem", color: "var(--text2)" }}>{u.email}</td>
                    <td style={{ padding: "0.875rem 1.1rem" }}>
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "999px", background: roleBg[u.role] ?? "var(--surface2)", color: roleColor[u.role] ?? "var(--text3)", textTransform: "capitalize" }}>
                        {u.role.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td style={{ padding: "0.875rem 1.1rem", color: "var(--text3)", fontSize: "0.78rem" }}>
                      {u.tenant?.name
                        ? <span style={{ color: "var(--accent)", background: "var(--accent-bg)", padding: "0.15rem 0.5rem", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 600 }}>{u.tenant.name}</span>
                        : <span style={{ color: "var(--text3)" }}>—</span>}
                    </td>
                    <td style={{ padding: "0.875rem 1.1rem", color: "var(--text3)", whiteSpace: "nowrap" }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "0.875rem 1.1rem" }}>
                      {/* Prevent super_admin from deleting themselves or other super_admins */}
                      {u.role !== "super_admin" ? (
                        <button
                          onClick={() => setUserAction(u)}
                          style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.3rem 0.625rem", borderRadius: "0.375rem", border: "1px solid var(--border)", background: "none", color: "var(--text3)", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600, transition: "all 0.12s" }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--red)"; e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.background = "var(--red-bg)"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text3)"; e.currentTarget.style.background = "none"; }}>
                          <UserMinus size={13} /> Remove
                        </button>
                      ) : (
                        <span style={{ fontSize: "0.7rem", color: "var(--text3)" }}>—</span>
                      )}
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