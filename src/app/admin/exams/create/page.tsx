"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Search, Save, Tag } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const inp: React.CSSProperties = { width:"100%", height:"2.25rem", padding:"0 0.75rem", borderRadius:"0.5rem", border:"1.5px solid var(--border)", background:"var(--input-bg)", color:"var(--text)", fontSize:"0.82rem", outline:"none", boxSizing:"border-box" };
const sel: React.CSSProperties = { ...inp, appearance:"none" as any };
const lbl: React.CSSProperties = { fontSize:"0.7rem", fontWeight:600, color:"var(--text2)" };

export default function AdminCreateExamPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({ examName:"", description:"", subjectId:"", courseId:"", duration:"60", passingMarks:"", scheduleTime:"", retakeAllowed:false, isActive:false });
  const [questions, setQuestions] = useState<any[]>([]);
  const [search, setSearch]     = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [results, setResults]   = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const { data: subjects } = useQuery({ queryKey:["subjects"], queryFn:() => fetch("/api/subjects").then(r=>r.json()) });
  const { data: courses }  = useQuery({ queryKey:["courses"],  queryFn:() => fetch("/api/courses").then(r=>r.json()) });

  // Debounced search
  useEffect(() => {
    const q = search.trim(); const t = tagFilter.trim();
    if (!q && !t) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams();
        if (q) params.set("search", q);
        if (t) params.append("tags", t);
        params.set("status", "published");
        params.set("limit", "15");
        const res = await fetch(`/api/questions?${params}`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(timer);
  }, [search, tagFilter]);

  const addQ = (q: any) => {
    if (questions.find(x => x.questionId === q.id)) return;
    setQuestions(prev => [...prev, { questionId:q.id, marks:q.marks??1, question:q.question, difficulty:q.difficulty, tags:q.tags?.map((t:any)=>t.tag.name)??[] }]);
    setSearch(""); setTagFilter(""); setResults([]);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const totalMarks = questions.reduce((s,q) => s+q.marks, 0);
      const r = await fetch("/api/exams", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ ...form, totalMarks, questions: questions.map(q=>({ questionId:q.questionId, marks:q.marks })) }),
      });
      const d = await r.json(); if (!r.ok) throw new Error(d.error||"Failed");
      return d;
    },
    onSuccess: () => { toast({ title:"Exam created!" }); router.push("/admin/exams"); },
    onError: (e:any) => toast({ title:"Error", description:e.message, variant:"destructive" }),
  });

  const diffColor: Record<string,string> = { easy:"var(--green)", medium:"var(--amber)", hard:"var(--red)" };
  const totalMarks = questions.reduce((s,q) => s+q.marks, 0);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.5rem" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.875rem" }}>
          <Link href="/admin/exams"><button style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text2)", display:"flex", padding:"0.25rem" }}><ArrowLeft size={18} /></button></Link>
          <h1 style={{ fontSize:"1.25rem", fontWeight:800, color:"var(--text)", margin:0 }}>Create Exam</h1>
        </div>
        <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending||!form.examName||!form.subjectId||!form.courseId||!form.duration}
          style={{ display:"flex", alignItems:"center", gap:"0.4rem", padding:"0.55rem 1.25rem", borderRadius:"0.5rem", background:"var(--accent)", border:"none", color:"#fff", fontWeight:700, fontSize:"0.85rem", cursor:"pointer", opacity:saveMutation.isPending?0.7:1 }}>
          <Save size={15} /> {saveMutation.isPending?"Saving...":"Create Exam"}
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:"1.25rem", alignItems:"start" }}>
        {/* Question picker */}
        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", overflow:"hidden" }}>
          <div style={{ padding:"0.875rem 1.25rem", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:"0.72rem", fontWeight:700, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.07em" }}>Questions ({questions.length}) · {totalMarks} marks total</span>
          </div>
          {/* Search bar */}
          <div style={{ padding:"0.875rem 1.25rem", borderBottom:"1px solid var(--border)", display:"flex", gap:"0.5rem", position:"relative" }}>
            <div style={{ position:"relative", flex:1 }}>
              <Search size={13} style={{ position:"absolute", left:"0.75rem", top:"50%", transform:"translateY(-50%)", color:"var(--text3)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search questions..." style={{ ...inp, paddingLeft:"2.1rem" }} onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")} />
            </div>
            <div style={{ position:"relative", width:"160px" }}>
              <Tag size={13} style={{ position:"absolute", left:"0.75rem", top:"50%", transform:"translateY(-50%)", color:"var(--text3)" }} />
              <input value={tagFilter} onChange={e => setTagFilter(e.target.value)} placeholder="#tag filter" style={{ ...inp, paddingLeft:"2.1rem" }} onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")} />
            </div>
          </div>
          {/* Search results */}
          {(results.length > 0 || searching) && (
            <div style={{ borderBottom:"1px solid var(--border)", maxHeight:"240px", overflowY:"auto" }}>
              {searching ? <div style={{ padding:"1rem", textAlign:"center", color:"var(--text3)", fontSize:"0.8rem" }}>Searching...</div> :
               results.map((q:any) => {
                const added = questions.find(x => x.questionId === q.id);
                return (
                  <div key={q.id} onClick={() => !added && addQ(q)} style={{ padding:"0.75rem 1.25rem", borderBottom:"1px solid var(--border)", cursor:added?"default":"pointer", opacity:added?0.5:1, transition:"background 0.12s" }}
                    onMouseEnter={e => { if (!added) e.currentTarget.style.background="var(--surface2)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background="transparent"; }}>
                    <p style={{ fontSize:"0.8rem", color:"var(--text)", margin:"0 0 0.3rem", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{q.question}</p>
                    <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
                      <span style={{ fontSize:"0.65rem", color:diffColor[q.difficulty]??"var(--text3)" }}>{q.difficulty}</span>
                      <span style={{ fontSize:"0.65rem", color:"var(--text3)" }}>{q.marks}m</span>
                      {q.tags?.map((t:any) => <span key={t.tag.name} style={{ fontSize:"0.65rem", color:"var(--accent)", background:"var(--accent-bg)", padding:"0.1rem 0.4rem", borderRadius:"999px" }}>#{t.tag.name}</span>)}
                      {added && <span style={{ fontSize:"0.65rem", color:"var(--green)" }}>✓ Added</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Selected questions */}
          {questions.length === 0 ? (
            <div style={{ padding:"2.5rem", textAlign:"center", color:"var(--text3)", fontSize:"0.82rem" }}>Search and click questions to add them to this exam.</div>
          ) : questions.map((q,idx) => (
            <div key={q.questionId} style={{ padding:"0.75rem 1.25rem", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:"0.875rem" }}>
              <span style={{ fontSize:"0.68rem", fontWeight:700, color:"var(--text3)", flexShrink:0 }}>Q{idx+1}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:"0.8rem", color:"var(--text)", margin:"0 0 0.2rem", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{q.question}</p>
                <div style={{ display:"flex", gap:"0.4rem" }}>
                  {q.tags?.map((t:string) => <span key={t} style={{ fontSize:"0.62rem", color:"var(--accent)", background:"var(--accent-bg)", padding:"0.1rem 0.35rem", borderRadius:"999px" }}>#{t}</span>)}
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", flexShrink:0 }}>
                <input type="number" min={1} max={100} value={q.marks}
                  onChange={e => setQuestions(prev => prev.map(x => x.questionId===q.questionId ? {...x,marks:parseInt(e.target.value)||1} : x))}
                  style={{ width:"3.5rem", height:"1.75rem", borderRadius:"0.375rem", border:"1px solid var(--border)", background:"var(--input-bg)", color:"var(--text)", fontSize:"0.78rem", textAlign:"center", outline:"none" }} />
                <span style={{ fontSize:"0.65rem", color:"var(--text3)" }}>pts</span>
                <button onClick={() => setQuestions(prev => prev.filter(x => x.questionId!==q.questionId))}
                  style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text3)", padding:"0.2rem" }}
                  onMouseEnter={e=>(e.currentTarget.style.color="var(--red)")} onMouseLeave={e=>(e.currentTarget.style.color="var(--text3)")}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Settings sidebar */}
        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"1.25rem", display:"flex", flexDirection:"column", gap:"0.875rem", position:"sticky", top:"1.5rem" }}>
          <span style={{ fontSize:"0.68rem", fontWeight:700, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.07em" }}>Exam Settings</span>
          {[
            { label:"Exam Name *",    key:"examName",    type:"text",          placeholder:"e.g. SAT Math Practice" },
            { label:"Description",    key:"description", type:"text",          placeholder:"Optional" },
            { label:"Duration (min)*",key:"duration",    type:"number",        placeholder:"60" },
            { label:"Passing Marks",  key:"passingMarks",type:"number",        placeholder:"Optional" },
            { label:"Schedule Time",  key:"scheduleTime",type:"datetime-local" },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key} style={{ display:"flex", flexDirection:"column", gap:"0.25rem" }}>
              <span style={lbl}>{label}</span>
              <input type={type} placeholder={placeholder} value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]:e.target.value }))}
                style={inp} onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")} />
            </div>
          ))}
          <div style={{ display:"flex", flexDirection:"column", gap:"0.25rem" }}>
            <span style={lbl}>Course *</span>
            <select value={form.courseId} onChange={e => setForm(f=>({...f,courseId:e.target.value}))} style={sel} onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")}>
              <option value="">Select course</option>
              {courses?.map((c:any) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.25rem" }}>
            <span style={lbl}>Subject *</span>
            <select value={form.subjectId} onChange={e => setForm(f=>({...f,subjectId:e.target.value}))} style={sel} onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")}>
              <option value="">Select subject</option>
              {subjects?.map((s:any) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
            </select>
          </div>
          {[
            { key:"isActive",      label:"Publish (make active)" },
            { key:"retakeAllowed", label:"Allow retakes" },
          ].map(({ key, label }) => (
            <label key={key} style={{ display:"flex", alignItems:"center", gap:"0.5rem", cursor:"pointer", fontSize:"0.8rem", color:"var(--text2)" }}>
              <div onClick={() => setForm(f => ({ ...f, [key]:!(f as any)[key] }))}
                style={{ width:"2.5rem", height:"1.35rem", borderRadius:"999px", background:(form as any)[key]?"var(--accent)":"var(--surface3)", border:`1.5px solid ${(form as any)[key]?"var(--accent)":"var(--border)"}`, position:"relative", transition:"all 0.2s", cursor:"pointer" }}>
                <div style={{ width:"1rem", height:"1rem", borderRadius:"50%", background:"#fff", position:"absolute", top:"50%", transform:`translateX(${(form as any)[key]?"1.2rem":"0.1rem"}) translateY(-50%)`, transition:"transform 0.2s" }} />
              </div>
              {label}
            </label>
          ))}
          <div style={{ paddingTop:"0.5rem", borderTop:"1px solid var(--border)", fontSize:"0.72rem", color:"var(--text3)" }}>
            Total: <strong style={{ color:"var(--text)" }}>{totalMarks} marks</strong> · {questions.length} questions
          </div>
        </div>
      </div>
    </div>
  );
}