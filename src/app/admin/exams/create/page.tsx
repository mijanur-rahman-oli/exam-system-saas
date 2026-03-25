"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Search, Save, Tag, Loader2 } from "lucide-react";
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
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [results, setResults]   = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const { data: subjects } = useQuery({ queryKey:["subjects"], queryFn:() => fetch("/api/subjects").then(r=>r.json()) });
  const { data: courses }  = useQuery({ queryKey:["courses"],  queryFn:() => fetch("/api/courses").then(r=>r.json()) });

  // Fetch all published questions with filters
  useEffect(() => {
    const fetchQuestions = async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set("search", search.trim());
        if (tagFilter.trim()) params.append("tags", tagFilter.trim());
        if (subjectFilter !== "all") params.set("subjectId", subjectFilter);
        if (difficultyFilter !== "all") params.set("difficulty", difficultyFilter);
        params.set("status", "published");
        params.set("limit", "100");
        
        const res = await fetch(`/api/questions?${params}`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching questions:", error);
        setResults([]);
      } finally {
        setSearching(false);
      }
    };

    const timer = setTimeout(() => {
      fetchQuestions();
    }, 350);
    
    return () => clearTimeout(timer);
  }, [search, tagFilter, subjectFilter, difficultyFilter]);

  const addQ = (q: any) => {
    if (questions.find(x => x.questionId === q.id)) return;
    setQuestions(prev => [...prev, { 
      questionId: q.id, 
      marks: q.marks ?? 1, 
      question: q.question, 
      difficulty: q.difficulty, 
      tags: q.tags?.map((t:any)=>t.tag?.name)??[] 
    }]);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.subjectId || !form.courseId) {
        throw new Error("Please select both subject and course");
      }
      const totalMarks = questions.reduce((s,q) => s + q.marks, 0);
      const r = await fetch("/api/exams", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ ...form, totalMarks, questions: questions.map(q=>({ questionId: q.questionId, marks: q.marks })) }),
      });
      const d = await r.json(); 
      if (!r.ok) throw new Error(d.error||"Failed");
      return d;
    },
    onSuccess: () => { toast({ title:"Exam created!" }); router.push("/admin/exams"); },
    onError: (e:any) => toast({ title:"Error", description:e.message, variant:"destructive" }),
  });

  const diffColor: Record<string,string> = { easy:"var(--green)", medium:"var(--amber)", hard:"var(--red)" };
  const totalMarks = questions.reduce((s,q) => s + q.marks, 0);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.5rem" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.875rem" }}>
          <Link href="/admin/exams">
            <button style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text2)", display:"flex", padding:"0.25rem" }}>
              <ArrowLeft size={18} />
            </button>
          </Link>
          <h1 style={{ fontSize:"1.25rem", fontWeight:800, color:"var(--text)", margin:0 }}>Create Exam</h1>
        </div>
        <button 
          onClick={() => saveMutation.mutate()} 
          disabled={saveMutation.isPending || !form.examName || !form.subjectId || !form.courseId || !form.duration || questions.length === 0}
          style={{ 
            display:"flex", alignItems:"center", gap:"0.4rem", padding:"0.55rem 1.25rem", 
            borderRadius:"0.5rem", background:"var(--accent)", border:"none", color:"#fff", 
            fontWeight:700, fontSize:"0.85rem", cursor:"pointer", 
            opacity: saveMutation.isPending || !form.examName || !form.subjectId || !form.courseId || !form.duration || questions.length === 0 ? 0.7 : 1 
          }}>
          <Save size={15} /> {saveMutation.isPending ? "Saving..." : "Create Exam"}
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:"1.25rem", alignItems:"start" }}>
        {/* Question picker */}
        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", overflow:"hidden" }}>
          <div style={{ padding:"0.875rem 1.25rem", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:"0.72rem", fontWeight:700, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.07em" }}>
              Available Questions ({results.length}) · Selected ({questions.length}) · {totalMarks} marks total
            </span>
          </div>
          
          {/* Filters */}
          <div style={{ padding:"0.875rem 1.25rem", borderBottom:"1px solid var(--border)", display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
            <div style={{ position:"relative", flex:1, minWidth:"150px" }}>
              <Search size={13} style={{ position:"absolute", left:"0.75rem", top:"50%", transform:"translateY(-50%)", color:"var(--text3)" }} />
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Search questions..." 
                style={{ ...inp, paddingLeft:"2.1rem" }} 
              />
            </div>
            <div style={{ position:"relative", width:"140px" }}>
              <Tag size={13} style={{ position:"absolute", left:"0.75rem", top:"50%", transform:"translateY(-50%)", color:"var(--text3)" }} />
              <input 
                value={tagFilter} 
                onChange={e => setTagFilter(e.target.value)} 
                placeholder="#tag filter" 
                style={{ ...inp, paddingLeft:"2.1rem" }} 
              />
            </div>
            <select 
              value={subjectFilter} 
              onChange={e => setSubjectFilter(e.target.value)}
              style={{ ...sel, width:"140px" }}
            >
              <option value="all">All Subjects</option>
              {subjects?.map((s: any) => (
                <option key={s.id} value={String(s.id)}>{s.name}</option>
              ))}
            </select>
            <select 
              value={difficultyFilter} 
              onChange={e => setDifficultyFilter(e.target.value)}
              style={{ ...sel, width:"120px" }}
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          
          {/* Questions list */}
          <div style={{ maxHeight:"500px", overflowY:"auto" }}>
            {searching ? (
              <div style={{ padding:"2rem", textAlign:"center", color:"var(--text3)" }}>
                <Loader2 size={24} style={{ animation:"spin 1s linear infinite", margin:"0 auto" }} />
                <p style={{ marginTop:"0.5rem", fontSize:"0.8rem" }}>Loading questions...</p>
              </div>
            ) : results.length === 0 ? (
              <div style={{ padding:"2.5rem", textAlign:"center", color:"var(--text3)", fontSize:"0.82rem" }}>
                No questions found. 
                {!search && !tagFilter && subjectFilter === "all" && difficultyFilter === "all" ? (
                  <div style={{ marginTop:"0.5rem" }}>
                    <Link href="/admin/questions/create" style={{ color:"var(--accent)" }}>
                      Create your first question
                    </Link>
                  </div>
                ) : " Try adjusting your filters."}
              </div>
            ) : (
              results.map((q:any) => {
                const added = questions.find(x => x.questionId === q.id);
                return (
                  <div 
                    key={q.id} 
                    onClick={() => !added && addQ(q)} 
                    style={{ 
                      padding:"0.75rem 1.25rem", 
                      borderBottom:"1px solid var(--border)", 
                      cursor: added ? "default" : "pointer", 
                      opacity: added ? 0.5 : 1, 
                      transition:"background 0.12s" 
                    }}
                    onMouseEnter={e => { if (!added) e.currentTarget.style.background="var(--surface2)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background="transparent"; }}>
                    <p style={{ fontSize:"0.8rem", color:"var(--text)", margin:"0 0 0.3rem", lineHeight:1.5 }}>
                      {q.question}
                    </p>
                    <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap", alignItems:"center" }}>
                      <span style={{ fontSize:"0.65rem", color:diffColor[q.difficulty] ?? "var(--text3)" }}>
                        {q.difficulty}
                      </span>
                      <span style={{ fontSize:"0.65rem", color:"var(--text3)" }}>
                        {q.marks} marks
                      </span>
                      {q.subject?.name && (
                        <span style={{ fontSize:"0.65rem", color:"var(--text2)" }}>
                          {q.subject.name}
                        </span>
                      )}
                      {q.tags?.map((t:any) => (
                        <span key={t.tag?.name} style={{ fontSize:"0.65rem", color:"var(--accent)", background:"var(--accent-bg)", padding:"0.1rem 0.4rem", borderRadius:"999px" }}>
                          #{t.tag?.name}
                        </span>
                      ))}
                      {added && (
                        <span style={{ fontSize:"0.65rem", color:"var(--green)" }}>
                          ✓ Added
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Settings sidebar */}
        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"1.25rem", display:"flex", flexDirection:"column", gap:"0.875rem", position:"sticky", top:"1.5rem" }}>
          <span style={{ fontSize:"0.68rem", fontWeight:700, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.07em" }}>
            Exam Settings
          </span>
          
          <div style={{ display:"flex", flexDirection:"column", gap:"0.25rem" }}>
            <span style={lbl}>Exam Name *</span>
            <input 
              type="text" 
              placeholder="e.g. SAT Math Practice" 
              value={form.examName}
              onChange={e => setForm(f => ({ ...f, examName: e.target.value }))}
              style={inp} 
            />
          </div>
          
          <div style={{ display:"flex", flexDirection:"column", gap:"0.25rem" }}>
            <span style={lbl}>Description</span>
            <textarea 
              placeholder="Optional" 
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={{ ...inp, height:"auto", minHeight:"2.25rem", resize:"vertical" }} 
              rows={2}
            />
          </div>
          
          <div style={{ display:"flex", flexDirection:"column", gap:"0.25rem" }}>
            <span style={lbl}>Course *</span>
            <select 
              value={form.courseId} 
              onChange={e => setForm(f=>({...f, courseId:e.target.value}))} 
              style={sel}
            >
              <option value="">Select course</option>
              {courses?.map((c:any) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </select>
          </div>
          
          <div style={{ display:"flex", flexDirection:"column", gap:"0.25rem" }}>
            <span style={lbl}>Subject *</span>
            <select 
              value={form.subjectId} 
              onChange={e => setForm(f=>({...f, subjectId:e.target.value}))} 
              style={sel}
            >
              <option value="">Select subject</option>
              {subjects?.map((s:any) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
            </select>
          </div>
          
          <div style={{ display:"flex", flexDirection:"column", gap:"0.25rem" }}>
            <span style={lbl}>Duration (min) *</span>
            <input 
              type="number" 
              placeholder="60" 
              value={form.duration}
              onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
              style={inp} 
            />
          </div>
          
          <div style={{ display:"flex", flexDirection:"column", gap:"0.25rem" }}>
            <span style={lbl}>Passing Marks</span>
            <input 
              type="number" 
              placeholder="Optional" 
              value={form.passingMarks}
              onChange={e => setForm(f => ({ ...f, passingMarks: e.target.value }))}
              style={inp} 
            />
          </div>
          
          <div style={{ display:"flex", flexDirection:"column", gap:"0.25rem" }}>
            <span style={lbl}>Schedule Time</span>
            <input 
              type="datetime-local" 
              value={form.scheduleTime}
              onChange={e => setForm(f => ({ ...f, scheduleTime: e.target.value }))}
              style={inp} 
            />
          </div>
          
          <label style={{ display:"flex", alignItems:"center", gap:"0.5rem", cursor:"pointer", fontSize:"0.8rem", color:"var(--text2)" }}>
            <div onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
              style={{ 
                width:"2.5rem", height:"1.35rem", borderRadius:"999px", 
                background: form.isActive ? "var(--accent)" : "var(--surface3)", 
                border:`1.5px solid ${form.isActive ? "var(--accent)" : "var(--border)"}`, 
                position:"relative", transition:"all 0.2s", cursor:"pointer" 
              }}>
              <div style={{ 
                width:"1rem", height:"1rem", borderRadius:"50%", background:"#fff", 
                position:"absolute", top:"50%", transform:`translateX(${form.isActive ? "1.2rem" : "0.1rem"}) translateY(-50%)`, 
                transition:"transform 0.2s" 
              }} />
            </div>
            Publish (make active)
          </label>
          
          <label style={{ display:"flex", alignItems:"center", gap:"0.5rem", cursor:"pointer", fontSize:"0.8rem", color:"var(--text2)" }}>
            <div onClick={() => setForm(f => ({ ...f, retakeAllowed: !f.retakeAllowed }))}
              style={{ 
                width:"2.5rem", height:"1.35rem", borderRadius:"999px", 
                background: form.retakeAllowed ? "var(--accent)" : "var(--surface3)", 
                border:`1.5px solid ${form.retakeAllowed ? "var(--accent)" : "var(--border)"}`, 
                position:"relative", transition:"all 0.2s", cursor:"pointer" 
              }}>
              <div style={{ 
                width:"1rem", height:"1rem", borderRadius:"50%", background:"#fff", 
                position:"absolute", top:"50%", transform:`translateX(${form.retakeAllowed ? "1.2rem" : "0.1rem"}) translateY(-50%)`, 
                transition:"transform 0.2s" 
              }} />
            </div>
            Allow retakes
          </label>
          
          <div style={{ paddingTop:"0.5rem", borderTop:"1px solid var(--border)", fontSize:"0.72rem", color:"var(--text3)" }}>
            Total: <strong style={{ color:"var(--text)" }}>{totalMarks} marks</strong> · {questions.length} questions
          </div>
          
          {/* Selected questions list */}
          {questions.length > 0 && (
            <div style={{ marginTop:"0.5rem", borderTop:"1px solid var(--border)", paddingTop:"0.75rem" }}>
              <span style={{ fontSize:"0.68rem", fontWeight:700, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.07em" }}>
                Selected Questions
              </span>
              <div style={{ maxHeight:"300px", overflowY:"auto", marginTop:"0.5rem" }}>
                {questions.map((q, idx) => (
                  <div key={q.questionId} style={{ padding:"0.5rem 0", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:"0.5rem" }}>
                    <span style={{ fontSize:"0.68rem", fontWeight:700, color:"var(--text3)", flexShrink:0 }}>Q{idx+1}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:"0.75rem", color:"var(--text)", margin:"0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {q.question}
                      </p>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.25rem", flexShrink:0 }}>
                      <input 
                        type="number" 
                        min={1} 
                        max={100} 
                        value={q.marks}
                        onChange={e => setQuestions(prev => prev.map(x => x.questionId === q.questionId ? {...x, marks: parseInt(e.target.value) || 1} : x))}
                        style={{ width:"3rem", height:"1.5rem", borderRadius:"0.375rem", border:"1px solid var(--border)", background:"var(--input-bg)", color:"var(--text)", fontSize:"0.7rem", textAlign:"center", outline:"none" }} 
                      />
                      <button 
                        onClick={() => setQuestions(prev => prev.filter(x => x.questionId !== q.questionId))}
                        style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text3)", padding:"0.2rem", display:"flex" }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {questions.length === 0 && (
            <div style={{ marginTop:"0.5rem", padding:"0.75rem", background:"var(--amber-bg)", borderRadius:"0.5rem", fontSize:"0.7rem", color:"var(--amber)" }}>
              ⚠️ Please select at least one question to create an exam.
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}