"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Users } from "lucide-react";

export default function SuperAdminUsersPage() {
  const [search, setSearch] = useState("");
  const [role,   setRole]   = useState("all");

  const { data: users, isLoading } = useQuery({
    queryKey: ["sa-users", search, role],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search)        params.set("search", search);
      if (role!=="all")  params.set("role", role);
      const r = await fetch(`/api/admin/users?${params}`);
      return r.json();
    },
  });

  const roleColor: Record<string,string> = { super_admin:"var(--red)", admin:"var(--accent)", question_setter:"var(--amber)", student:"var(--green)" };
  const roleBg:    Record<string,string> = { super_admin:"var(--red-bg)", admin:"var(--accent-bg)", question_setter:"var(--amber-bg)", student:"var(--green-bg)" };
  const inp: React.CSSProperties = { height:"2.25rem",padding:"0 0.75rem",borderRadius:"0.5rem",border:"1.5px solid var(--border)",background:"var(--input-bg)",color:"var(--text)",fontSize:"0.82rem",outline:"none" };

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:"1.75rem" }}>
      <div>
        <h1 style={{ fontSize:"1.3rem",fontWeight:800,color:"var(--text)",margin:0 }}>All Users</h1>
        <p style={{ fontSize:"0.8rem",color:"var(--text3)",margin:0 }}>Platform-wide user overview</p>
      </div>
      <div style={{ display:"flex",gap:"0.75rem" }}>
        <div style={{ position:"relative",flex:1 }}>
          <Search size={13} style={{ position:"absolute",left:"0.75rem",top:"50%",transform:"translateY(-50%)",color:"var(--text3)" }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search username or email..."
            style={{ ...inp, paddingLeft:"2.1rem", width:"100%", boxSizing:"border-box" as any }}/>
        </div>
        <select value={role} onChange={e=>setRole(e.target.value)} style={{ ...inp, appearance:"none" as any }}>
          <option value="all">All Roles</option>
          {["super_admin","admin","question_setter","student"].map(r => <option key={r} value={r}>{r.replace("_"," ")}</option>)}
        </select>
      </div>
      <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius)",overflow:"hidden" }}>
        {isLoading ? <div style={{ padding:"3rem",textAlign:"center",color:"var(--text3)" }}>Loading...</div> :
         !users?.length ? <div style={{ padding:"3rem",textAlign:"center",color:"var(--text3)" }}>No users found</div> : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%",borderCollapse:"collapse",fontSize:"0.82rem" }}>
              <thead><tr style={{ background:"var(--surface2)",borderBottom:"1px solid var(--border)" }}>
                {["Username","Email","Role","Tenant","Joined"].map(h => (
                  <th key={h} style={{ padding:"0.625rem 1.1rem",textAlign:"left",fontSize:"0.65rem",fontWeight:700,color:"var(--text3)",textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {users.map((u:any) => (
                  <tr key={u.id} style={{ borderBottom:"1px solid var(--border)" }}>
                    <td style={{ padding:"0.875rem 1.1rem",fontWeight:600,color:"var(--text)" }}>{u.username}</td>
                    <td style={{ padding:"0.875rem 1.1rem",color:"var(--text2)" }}>{u.email}</td>
                    <td style={{ padding:"0.875rem 1.1rem" }}>
                      <span style={{ fontSize:"0.68rem",fontWeight:700,padding:"0.2rem 0.6rem",borderRadius:"999px",background:roleBg[u.role]??"var(--surface2)",color:roleColor[u.role]??"var(--text3)",textTransform:"capitalize" }}>
                        {u.role.replace("_"," ")}
                      </span>
                    </td>
                    <td style={{ padding:"0.875rem 1.1rem",color:"var(--text3)",fontSize:"0.78rem" }}>{u.tenant?.name ?? "—"}</td>
                    <td style={{ padding:"0.875rem 1.1rem",color:"var(--text3)" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
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