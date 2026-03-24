"use client";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, X, Users, GraduationCap, ToggleLeft, ToggleRight, UserPlus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

function Modal({ title, onClose, onSubmit, loading, children }: any) {
  return (
    <div style={{ position:"fixed",inset:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"1.5rem",width:"100%",maxWidth:"440px",boxShadow:"var(--shadow)" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:"1.25rem" }}>
          <h2 style={{ fontSize:"1rem",fontWeight:700,color:"var(--text)",margin:0 }}>{title}</h2>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text3)" }}><X size={18}/></button>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:"0.875rem" }}>{children}</div>
        <div style={{ display:"flex",gap:"0.5rem",marginTop:"1.25rem",justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ padding:"0.5rem 1rem",borderRadius:"0.5rem",border:"1px solid var(--border)",background:"none",color:"var(--text2)",cursor:"pointer",fontSize:"0.82rem" }}>Cancel</button>
          <button onClick={onSubmit} disabled={loading} style={{ padding:"0.5rem 1.25rem",borderRadius:"0.5rem",border:"none",background:"var(--accent)",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:"0.82rem",opacity:loading?0.7:1 }}>
            {loading?"Saving...":"Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inp: React.CSSProperties = { width:"100%",height:"2.25rem",padding:"0 0.75rem",borderRadius:"0.5rem",border:"1.5px solid var(--border)",background:"var(--input-bg)",color:"var(--text)",fontSize:"0.82rem",outline:"none",boxSizing:"border-box" };
const sel: React.CSSProperties = { ...inp, appearance:"none" as any };
const lbl: React.CSSProperties = { fontSize:"0.72rem",fontWeight:600,color:"var(--text2)" };
const ROLES = ["admin","question_setter","student"];
const roleColor: Record<string,string> = { admin:"var(--accent)", question_setter:"var(--amber)", student:"var(--green)", super_admin:"var(--red)" };
const roleBg:    Record<string,string> = { admin:"var(--accent-bg)", question_setter:"var(--amber-bg)", student:"var(--green-bg)", super_admin:"var(--red-bg)" };

export default function TenantDetailPage() {
  const { id }    = useParams<{ id:string }>();
  const router    = useRouter();
  const { toast } = useToast();

  const [showCourse,  setShowCourse]  = useState(false);
  const [showUser,    setShowUser]    = useState(false);
  const [courseName,  setCourseName]  = useState("");
  const [newUser,     setNewUser]     = useState({ username:"", email:"", password:"", role:"student" });
  const [activeTab,   setActiveTab]   = useState<"courses"|"users">("users");

  const { data:tenant, isLoading, refetch } = useQuery({
    queryKey: ["sa-tenant", id],
    queryFn: async () => {
      const r = await fetch(`/api/tenants/${id}`);
      if (!r.ok) throw new Error("Not found");
      return r.json();
    },
  });

  const { data:courses, refetch:refetchCourses } = useQuery({
    queryKey: ["sa-tenant-courses", id],
    queryFn: () => fetch(`/api/courses?tenantId=${id}`).then(r=>r.json()),
    enabled: !!id,
  });

  const { data:users, refetch:refetchUsers } = useQuery({
    queryKey: ["sa-tenant-users", id],
    queryFn: async () => {
      const r = await fetch(`/api/super-admin/tenants/${id}/users`);
      if (!r.ok) return [];
      return r.json();
    },
    enabled: !!id,
  });

  const createCourse = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/courses", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ name:courseName, tenantId:parseInt(id) }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error||"Failed");
    },
    onSuccess: () => { toast({ title:"Course created" }); setShowCourse(false); setCourseName(""); refetchCourses(); },
    onError: (e:any) => toast({ title:"Error", description:e.message, variant:"destructive" }),
  });

  const delCourse = useMutation({
    mutationFn: async (cid:number) => { await fetch(`/api/courses/${cid}`, { method:"DELETE" }); },
    onSuccess: () => { toast({ title:"Course deleted" }); refetchCourses(); },
  });

  const createUser = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/super-admin/tenants/${id}/users`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify(newUser),
      });
      const d = await r.json(); if (!r.ok) throw new Error(d.error||"Failed");
    },
    onSuccess: () => {
      toast({ title:"User created" });
      setShowUser(false);
      setNewUser({ username:"", email:"", password:"", role:"student" });
      refetchUsers();
    },
    onError: (e:any) => toast({ title:"Error", description:e.message, variant:"destructive" }),
  });

  const removeUser = useMutation({
    mutationFn: async (uid:number) => {
      const r = await fetch(`/api/super-admin/tenants/${id}/users/${uid}`, { method:"DELETE" });
      if (!r.ok) { const d=await r.json(); throw new Error(d.error||"Failed"); }
    },
    onSuccess: () => { toast({ title:"User removed from tenant" }); refetchUsers(); },
    onError: (e:any) => toast({ title:"Error", description:e.message, variant:"destructive" }),
  });

  const toggleTenant = useMutation({
    mutationFn: async (isActive:boolean) => { await fetch(`/api/tenants/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ isActive }) }); },
    onSuccess: () => refetch(),
  });

  const delTenant = useMutation({
    mutationFn: async () => { await fetch(`/api/tenants/${id}`, { method:"DELETE" }); },
    onSuccess: () => { toast({ title:"Tenant deleted" }); router.push("/super-admin/tenants"); },
  });

  if (isLoading) return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",flexDirection:"column",gap:"1rem" }}>
      <div style={{ width:"2.5rem",height:"2.5rem",border:"3px solid var(--border)",borderTopColor:"var(--accent)",borderRadius:"50%",animation:"spin 0.8s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!tenant) return <div style={{ padding:"2rem",color:"var(--red)" }}>Tenant not found.</div>;

  const tenantUsers   = users   ?? [];
  const tenantCourses = courses ?? [];

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:"1.75rem" }}>

      {/* Create Course Modal */}
      {showCourse && (
        <Modal title="New Course" onClose={()=>setShowCourse(false)} onSubmit={()=>courseName.trim()&&createCourse.mutate()} loading={createCourse.isPending}>
          <div><label style={lbl}>Course Name *</label>
            <input value={courseName} onChange={e=>setCourseName(e.target.value)} placeholder="e.g. SAT Prep 2025" style={inp}
              onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")}/>
          </div>
        </Modal>
      )}

      {/* Create User Modal */}
      {showUser && (
        <Modal title={`Add User to ${tenant.name}`} onClose={()=>setShowUser(false)}
          onSubmit={()=>newUser.username&&newUser.email&&newUser.password&&createUser.mutate()} loading={createUser.isPending}>
          {[
            { label:"Username *", key:"username", type:"text",     placeholder:"john_doe"        },
            { label:"Email *",    key:"email",    type:"email",    placeholder:"john@example.com" },
            { label:"Password *", key:"password", type:"password", placeholder:"Min 6 chars"     },
          ].map(({ label,key,type,placeholder }) => (
            <div key={key}>
              <label style={lbl}>{label}</label>
              <input type={type} placeholder={placeholder} value={(newUser as any)[key]}
                onChange={e=>setNewUser(u=>({...u,[key]:e.target.value}))} style={inp}
                onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")}/>
            </div>
          ))}
          <div>
            <label style={lbl}>Role</label>
            <select value={newUser.role} onChange={e=>setNewUser(u=>({...u,role:e.target.value}))} style={sel}>
              {ROLES.map(r=><option key={r} value={r}>{r.replace("_"," ")}</option>)}
            </select>
          </div>
        </Modal>
      )}

      {/* Header */}
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:"1rem" }}>
        <div style={{ display:"flex",alignItems:"center",gap:"0.875rem" }}>
          <Link href="/super-admin/tenants">
            <button style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text2)",display:"flex",padding:"0.25rem" }}><ArrowLeft size={18}/></button>
          </Link>
          <div>
            <h1 style={{ fontSize:"1.3rem",fontWeight:800,color:"var(--text)",margin:0 }}>{tenant.name}</h1>
            <p style={{ fontSize:"0.72rem",color:"var(--text3)",margin:0 }}>slug: {tenant.slug}</p>
          </div>
        </div>
        <div style={{ display:"flex",gap:"0.5rem",flexWrap:"wrap" }}>
          <button onClick={()=>toggleTenant.mutate(!tenant.isActive)}
            style={{ display:"flex",alignItems:"center",gap:"0.4rem",padding:"0.45rem 0.875rem",borderRadius:"0.5rem",background:tenant.isActive?"var(--green-bg)":"var(--surface2)",border:`1px solid ${tenant.isActive?"var(--green)":"var(--border)"}`,color:tenant.isActive?"var(--green)":"var(--text2)",cursor:"pointer",fontSize:"0.78rem",fontWeight:600 }}>
            {tenant.isActive?<><ToggleRight size={13}/> Active</>:<><ToggleLeft size={13}/> Inactive</>}
          </button>
          <button onClick={()=>{if(confirm(`Delete "${tenant.name}"? All data will be lost.`))delTenant.mutate();}}
            style={{ display:"flex",alignItems:"center",gap:"0.4rem",padding:"0.45rem 0.875rem",borderRadius:"0.5rem",background:"var(--red-bg)",border:"1px solid var(--red)",color:"var(--red)",cursor:"pointer",fontSize:"0.78rem",fontWeight:600 }}>
            <Trash2 size={13}/> Delete Tenant
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"1rem" }}>
        {[
          { label:"Courses", value:tenantCourses.length, Icon:GraduationCap, color:"var(--accent)", bg:"var(--accent-bg)" },
          { label:"Users",   value:tenantUsers.length,   Icon:Users,         color:"var(--green)",  bg:"var(--green-bg)"  },
          { label:"Status",  value:tenant.isActive?"Active":"Inactive", Icon:ToggleRight, color:tenant.isActive?"var(--green)":"var(--text3)", bg:tenant.isActive?"var(--green-bg)":"var(--surface2)" },
        ].map(({ label,value,Icon,color,bg }) => (
          <div key={label} style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"1.25rem",display:"flex",gap:"1rem",alignItems:"center" }}>
            <div style={{ width:"2.25rem",height:"2.25rem",borderRadius:"0.5rem",background:bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
              <Icon size={16} color={color}/>
            </div>
            <div>
              <div style={{ fontSize:"1.4rem",fontWeight:900,color:"var(--text)",lineHeight:1 }}>{value}</div>
              <div style={{ fontSize:"0.7rem",color:"var(--text3)",marginTop:"0.15rem" }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex",gap:"0",borderBottom:"1px solid var(--border)" }}>
        {[
          { key:"users",   label:`Users (${tenantUsers.length})`          },
          { key:"courses", label:`Courses (${tenantCourses.length})`      },
        ].map(({ key, label }) => (
          <button key={key} onClick={()=>setActiveTab(key as any)}
            style={{ padding:"0.625rem 1.25rem",background:"none",border:"none",borderBottom:`2px solid ${activeTab===key?"var(--accent)":"transparent"}`,color:activeTab===key?"var(--accent)":"var(--text2)",cursor:"pointer",fontSize:"0.82rem",fontWeight:activeTab===key?700:400,transition:"all 0.15s" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Users tab */}
      {activeTab==="users" && (
        <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius)",overflow:"hidden" }}>
          <div style={{ padding:"0.875rem 1.25rem",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ fontSize:"0.72rem",fontWeight:700,color:"var(--text2)",textTransform:"uppercase",letterSpacing:"0.07em" }}>Tenant Users</span>
            <button onClick={()=>setShowUser(true)}
              style={{ display:"flex",alignItems:"center",gap:"0.4rem",padding:"0.4rem 0.875rem",borderRadius:"0.5rem",background:"var(--accent)",border:"none",color:"#fff",fontWeight:700,fontSize:"0.78rem",cursor:"pointer" }}>
              <UserPlus size={13}/> Add User
            </button>
          </div>
          {!tenantUsers.length ? (
            <div style={{ padding:"2.5rem",textAlign:"center",color:"var(--text3)",fontSize:"0.82rem" }}>
              No users yet. Add the first user to this tenant.
            </div>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%",borderCollapse:"collapse",fontSize:"0.82rem" }}>
                <thead><tr style={{ background:"var(--surface2)",borderBottom:"1px solid var(--border)" }}>
                  {["Username","Email","Role","Joined","Actions"].map(h=>(
                    <th key={h} style={{ padding:"0.625rem 1.1rem",textAlign:"left",fontSize:"0.65rem",fontWeight:700,color:"var(--text3)",textTransform:"uppercase" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {tenantUsers.map((u:any)=>(
                    <tr key={u.id} style={{ borderBottom:"1px solid var(--border)" }}>
                      <td style={{ padding:"0.75rem 1.1rem",fontWeight:600,color:"var(--text)" }}>{u.username}</td>
                      <td style={{ padding:"0.75rem 1.1rem",color:"var(--text2)" }}>{u.email}</td>
                      <td style={{ padding:"0.75rem 1.1rem" }}>
                        <span style={{ fontSize:"0.68rem",fontWeight:700,padding:"0.2rem 0.5rem",borderRadius:"999px",background:roleBg[u.role]??"var(--surface2)",color:roleColor[u.role]??"var(--text3)",textTransform:"capitalize" }}>
                          {u.role.replace("_"," ")}
                        </span>
                      </td>
                      <td style={{ padding:"0.75rem 1.1rem",color:"var(--text3)" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding:"0.75rem 1.1rem" }}>
                        <button onClick={()=>{if(confirm(`Remove "${u.username}" from this tenant?`))removeUser.mutate(u.id);}}
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
      )}

      {/* Courses tab */}
      {activeTab==="courses" && (
        <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius)",overflow:"hidden" }}>
          <div style={{ padding:"0.875rem 1.25rem",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ fontSize:"0.72rem",fontWeight:700,color:"var(--text2)",textTransform:"uppercase",letterSpacing:"0.07em" }}>Courses</span>
            <button onClick={()=>setShowCourse(true)}
              style={{ display:"flex",alignItems:"center",gap:"0.4rem",padding:"0.4rem 0.875rem",borderRadius:"0.5rem",background:"var(--accent)",border:"none",color:"#fff",fontWeight:700,fontSize:"0.78rem",cursor:"pointer" }}>
              <Plus size={13}/> New Course
            </button>
          </div>
          {!tenantCourses.length ? (
            <div style={{ padding:"2.5rem",textAlign:"center",color:"var(--text3)",fontSize:"0.82rem" }}>No courses yet.</div>
          ) : tenantCourses.map((c:any)=>(
            <div key={c.id} style={{ padding:"0.875rem 1.25rem",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:"0.875rem" }}>
              <GraduationCap size={14} color="var(--accent)"/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:"0.85rem",fontWeight:600,color:"var(--text)" }}>{c.name}</div>
                <div style={{ fontSize:"0.68rem",color:"var(--text3)" }}>{c._count?.exams??0} exams · {c._count?.enrollments??0} students</div>
              </div>
              <span style={{ fontSize:"0.65rem",fontWeight:700,padding:"0.15rem 0.4rem",borderRadius:"999px",background:c.isActive?"var(--green-bg)":"var(--surface3)",color:c.isActive?"var(--green)":"var(--text3)" }}>
                {c.isActive?"Active":"Inactive"}
              </span>
              <button onClick={()=>{if(confirm(`Delete "${c.name}"?`))delCourse.mutate(c.id);}}
                style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text3)",display:"flex",padding:"0.2rem" }}
                onMouseEnter={e=>(e.currentTarget.style.color="var(--red)")} onMouseLeave={e=>(e.currentTarget.style.color="var(--text3)")}>
                <Trash2 size={13}/>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}