"use client";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, X, Users, GraduationCap, Search, UserPlus } from "lucide-react";

function Modal({ title, onClose, children, onSubmit, loading }: any) {
  return (
    <div style={{ position:"fixed",inset:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"1.5rem",width:"100%",maxWidth:"480px",boxShadow:"var(--shadow)" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.25rem" }}>
          <h2 style={{ fontSize:"1rem",fontWeight:700,color:"var(--text)",margin:0 }}>{title}</h2>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text3)" }}><X size={18}/></button>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:"0.875rem" }}>{children}</div>
        {onSubmit && (
          <div style={{ display:"flex",gap:"0.5rem",marginTop:"1.25rem",justifyContent:"flex-end" }}>
            <button onClick={onClose} style={{ padding:"0.5rem 1rem",borderRadius:"0.5rem",border:"1px solid var(--border)",background:"none",color:"var(--text2)",cursor:"pointer",fontSize:"0.82rem" }}>Cancel</button>
            <button onClick={onSubmit} disabled={loading} style={{ padding:"0.5rem 1.25rem",borderRadius:"0.5rem",border:"none",background:"var(--accent)",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:"0.82rem",opacity:loading?0.7:1 }}>{loading?"Saving...":"Save"}</button>
          </div>
        )}
      </div>
    </div>
  );
}

const inp: React.CSSProperties = { width:"100%",height:"2.25rem",padding:"0 0.75rem",borderRadius:"0.5rem",border:"1.5px solid var(--border)",background:"var(--input-bg)",color:"var(--text)",fontSize:"0.82rem",outline:"none",boxSizing:"border-box" };
const sel: React.CSSProperties = { ...inp, appearance:"none" as any };
const lbl: React.CSSProperties = { fontSize:"0.72rem",fontWeight:600,color:"var(--text2)" };
const ROLES = ["student","question_setter","admin"];

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [search,        setSearch]        = useState("");
  const [roleFilter,    setRoleFilter]    = useState("all");
  const [showCreate,    setShowCreate]    = useState(false);
  const [showEnroll,    setShowEnroll]    = useState<any>(null); // user object
  const [newUser,       setNewUser]       = useState({ username:"",email:"",password:"",role:"student" });
  const [enrollCourse,  setEnrollCourse]  = useState("");

  const { data: users, refetch: refetchUsers, isLoading } = useQuery({
    queryKey: ["admin-users", search, roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search)              params.set("search", search);
      if (roleFilter !== "all") params.set("role", roleFilter);
      const r = await fetch(`/api/admin/users?${params}`);
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const { data: courses } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: () => fetch("/api/courses").then(r => r.json()),
  });

  const { data: enrollments, refetch: refetchEnroll } = useQuery({
    queryKey: ["user-enrollments", showEnroll?.id],
    queryFn: () => fetch(`/api/enrollments?studentId=${showEnroll.id}`).then(r => r.json()),
    enabled: !!showEnroll,
  });

  const createUser = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/admin/users", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(newUser) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error||"Failed");
    },
    onSuccess: () => { toast({ title:"User created" }); setShowCreate(false); setNewUser({ username:"",email:"",password:"",role:"student" }); refetchUsers(); },
    onError: (e:any) => toast({ title:"Error", description:e.message, variant:"destructive" }),
  });

  const deleteUser = useMutation({
    mutationFn: async (id:number) => {
      const r = await fetch(`/api/admin/users/${id}`, { method:"DELETE" });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: () => { toast({ title:"User deleted" }); refetchUsers(); },
    onError: (e:any) => toast({ title:"Error", description:e.message, variant:"destructive" }),
  });

  const enroll = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/enrollments", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ courseId:parseInt(enrollCourse), studentId:showEnroll.id }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error||"Failed");
    },
    onSuccess: () => { toast({ title:"Enrolled" }); setEnrollCourse(""); refetchEnroll(); },
    onError: (e:any) => toast({ title:"Error", description:e.message, variant:"destructive" }),
  });

  const unenroll = useMutation({
    mutationFn: async ({ courseId, studentId }: { courseId:number; studentId:number }) => {
      await fetch("/api/enrollments", { method:"DELETE", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ courseId, studentId }) });
    },
    onSuccess: () => { toast({ title:"Unenrolled" }); refetchEnroll(); },
  });

  const roleColor: Record<string,string> = { admin:"var(--accent)", question_setter:"var(--amber)", student:"var(--green)", super_admin:"var(--red)" };
  const roleBg:    Record<string,string> = { admin:"var(--accent-bg)", question_setter:"var(--amber-bg)", student:"var(--green-bg)", super_admin:"var(--red-bg)" };

  const enrolledIds = new Set(enrollments?.map((e:any) => e.courseId) ?? []);
  const availableCourses = courses?.filter((c:any) => !enrolledIds.has(c.id)) ?? [];

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:"1.75rem" }}>

      {/* Create User Modal */}
      {showCreate && (
        <Modal title="Create User" onClose={() => setShowCreate(false)} onSubmit={() => newUser.username&&newUser.email&&newUser.password&&createUser.mutate()} loading={createUser.isPending}>
          {[
            { label:"Username *", key:"username", type:"text",     placeholder:"john_doe"        },
            { label:"Email *",    key:"email",    type:"email",    placeholder:"john@example.com" },
            { label:"Password *", key:"password", type:"password", placeholder:"Min 6 chars"     },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label style={lbl}>{label}</label>
              <input type={type} placeholder={placeholder} value={(newUser as any)[key]}
                onChange={e => setNewUser(u => ({ ...u, [key]:e.target.value }))}
                style={inp} onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")} />
            </div>
          ))}
          <div>
            <label style={lbl}>Role</label>
            <select value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role:e.target.value }))} style={sel}>
              {ROLES.map(r => <option key={r} value={r}>{r.replace("_"," ")}</option>)}
            </select>
          </div>
        </Modal>
      )}

      {/* Enrollment Modal */}
      {showEnroll && (
        <Modal title={`Manage Enrollments — ${showEnroll.username}`} onClose={() => setShowEnroll(null)}>
          <div>
            <p style={{ fontSize:"0.8rem", color:"var(--text2)", margin:"0 0 0.875rem" }}>Enrolled courses:</p>
            {!enrollments?.length ? (
              <p style={{ fontSize:"0.78rem", color:"var(--text3)" }}>No enrollments yet.</p>
            ) : enrollments.map((e:any) => (
              <div key={e.id} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.5rem 0.75rem",borderRadius:"0.375rem",background:"var(--surface2)",border:"1px solid var(--border)",marginBottom:"0.4rem" }}>
                <span style={{ fontSize:"0.82rem",color:"var(--text)" }}>{e.course?.name}</span>
                <button onClick={() => unenroll.mutate({ courseId:e.courseId, studentId:showEnroll.id })}
                  style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text3)",display:"flex" }}
                  onMouseEnter={e2=>(e2.currentTarget.style.color="var(--red)")} onMouseLeave={e2=>(e2.currentTarget.style.color="var(--text3)")}>
                  <Trash2 size={13}/>
                </button>
              </div>
            ))}
          </div>
          {availableCourses.length > 0 && (
            <div style={{ borderTop:"1px solid var(--border)",paddingTop:"0.875rem" }}>
              <label style={lbl}>Enroll in course</label>
              <div style={{ display:"flex",gap:"0.5rem",marginTop:"0.3rem" }}>
                <select value={enrollCourse} onChange={e => setEnrollCourse(e.target.value)} style={{ ...sel, flex:1 }}>
                  <option value="">Select course...</option>
                  {availableCourses.map((c:any) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                </select>
                <button onClick={() => enrollCourse && enroll.mutate()} disabled={!enrollCourse||enroll.isPending}
                  style={{ display:"flex",alignItems:"center",gap:"0.3rem",padding:"0 0.875rem",borderRadius:"0.5rem",background:"var(--accent)",border:"none",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:"0.8rem",height:"2.25rem",flexShrink:0 }}>
                  <UserPlus size={13}/> Enroll
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Header */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"1rem" }}>
        <div>
          <h1 style={{ fontSize:"1.3rem",fontWeight:800,color:"var(--text)",margin:0 }}>Users</h1>
          <p style={{ fontSize:"0.8rem",color:"var(--text3)",margin:0 }}>Manage users and course enrollments</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ display:"flex",alignItems:"center",gap:"0.4rem",padding:"0.55rem 1.1rem",borderRadius:"0.5rem",background:"var(--accent)",border:"none",color:"#fff",fontWeight:700,fontSize:"0.82rem",cursor:"pointer" }}>
          <Plus size={15}/> New User
        </button>
      </div>

      {/* Filters */}
      <div style={{ display:"flex",gap:"0.75rem",flexWrap:"wrap" }}>
        <div style={{ position:"relative",flex:1,minWidth:"200px" }}>
          <Search size={13} style={{ position:"absolute",left:"0.75rem",top:"50%",transform:"translateY(-50%)",color:"var(--text3)" }}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by username or email..."
            style={{ ...inp, paddingLeft:"2.1rem" }} onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")}/>
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ ...sel, width:"140px" }}>
          <option value="all">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r.replace("_"," ")}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius)",overflow:"hidden" }}>
        {isLoading ? <div style={{ padding:"3rem",textAlign:"center",color:"var(--text3)" }}>Loading...</div> :
         !users?.length ? <div style={{ padding:"3rem",textAlign:"center",color:"var(--text3)" }}>No users found</div> : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%",borderCollapse:"collapse",fontSize:"0.82rem" }}>
              <thead><tr style={{ background:"var(--surface2)",borderBottom:"1px solid var(--border)" }}>
                {["Username","Email","Role","Joined","Actions"].map(h => (
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
                    <td style={{ padding:"0.875rem 1.1rem",color:"var(--text3)" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding:"0.875rem 1.1rem" }}>
                      <div style={{ display:"flex",gap:"0.4rem" }}>
                        {u.role === "student" && (
                          <button onClick={() => setShowEnroll(u)} title="Manage enrollments"
                            style={{ display:"flex",alignItems:"center",gap:"0.3rem",padding:"0.3rem 0.65rem",borderRadius:"0.375rem",border:"1px solid var(--accent-dim)",background:"var(--accent-bg)",color:"var(--accent)",cursor:"pointer",fontSize:"0.72rem",fontWeight:600 }}>
                            <GraduationCap size={12}/> Enroll
                          </button>
                        )}
                        <button onClick={() => { if (confirm(`Delete "${u.username}"?`)) deleteUser.mutate(u.id); }}
                          style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text3)",padding:"0.2rem",borderRadius:"0.25rem",display:"flex" }}
                          onMouseEnter={e=>(e.currentTarget.style.color="var(--red)")} onMouseLeave={e=>(e.currentTarget.style.color="var(--text3)")}>
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