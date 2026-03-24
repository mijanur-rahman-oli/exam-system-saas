"use client";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { useRef, useEffect } from "react";
import { Plus, Trash2, Search, Tag, ChevronDown, ChevronUp, CheckCircle, Clock } from "lucide-react";

function KaTeXDisplay({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current||!text) return;
    import("katex").then(katex => {
      let html = text
        .replace(/\$\$(.+?)\$\$/gs, (_,e) => { try { return katex.default.renderToString(e,{displayMode:true,throwOnError:false}); } catch { return _; } })
        .replace(/\$(.+?)\$/g,  (_,e) => { try { return katex.default.renderToString(e,{displayMode:false,throwOnError:false}); } catch { return _; } });
      if (ref.current) ref.current.innerHTML = html;
    });
  }, [text]);
  return <span ref={ref} style={{ fontSize:"inherit",lineHeight:"inherit",color:"inherit" }}/>;
}

export default function QSQuestionsPage() {
  const { toast } = useToast();
  const [search,     setSearch]     = useState("");
  const [tagFilter,  setTagFilter]  = useState("");
  const [subject,    setSubject]    = useState("all");
  const [status,     setStatus]     = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [expanded,   setExpanded]   = useState<number|null>(null);

  const { data: questions, refetch, isLoading } = useQuery({
    queryKey: ["qs-questions", search, tagFilter, subject, status, difficulty],
    queryFn: async () => {
      const params = new URLSearchParams({ createdByMe:"true" });
      if (search)               params.set("search", search);
      if (tagFilter)            params.append("tags", tagFilter);
      if (subject !== "all")    params.set("subjectId", subject);
      if (status !== "all")     params.set("status", status);
      if (difficulty !== "all") params.set("difficulty", difficulty);
      const r = await fetch(`/api/questions?${params}`);
      return r.json();
    },
  });

  const { data: subjects } = useQuery({ queryKey:["subjects"], queryFn:() => fetch("/api/subjects").then(r=>r.json()) });

  const del = useMutation({
    mutationFn: async (id:number) => { const r = await fetch(`/api/questions/${id}`, { method:"DELETE" }); if (!r.ok) throw new Error("Failed"); },
    onSuccess: () => { toast({ title:"Question deleted" }); refetch(); },
    onError: (e:any) => toast({ title:"Error", description:e.message, variant:"destructive" }),
  });

  const publish = useMutation({
    mutationFn: async (id:number) => {
      const r = await fetch(`/api/questions/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ status:"published" }) });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: () => { toast({ title:"Published" }); refetch(); },
  });

  const diffColor: Record<string,string> = { easy:"var(--green)",medium:"var(--amber)",hard:"var(--red)" };
  const inp: React.CSSProperties = { height:"2.1rem",padding:"0 0.75rem",borderRadius:"0.5rem",border:"1.5px solid var(--border)",background:"var(--input-bg)",color:"var(--text)",fontSize:"0.78rem",outline:"none" };

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:"1.5rem" }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"/>

      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div>
          <h1 style={{ fontSize:"1.3rem",fontWeight:800,color:"var(--text)",margin:0 }}>My Questions</h1>
          <p style={{ fontSize:"0.8rem",color:"var(--text3)",margin:0 }}>{questions?.length??0} questions</p>
        </div>
        <Link href="/question-setter/questions/create">
          <button style={{ display:"flex",alignItems:"center",gap:"0.4rem",padding:"0.55rem 1.1rem",borderRadius:"0.5rem",background:"var(--accent)",border:"none",color:"#fff",fontWeight:700,fontSize:"0.82rem",cursor:"pointer" }}>
            <Plus size={15}/> New Question
          </button>
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display:"flex",gap:"0.625rem",flexWrap:"wrap" }}>
        <div style={{ position:"relative",flex:1,minWidth:"180px" }}>
          <Search size={12} style={{ position:"absolute",left:"0.6rem",top:"50%",transform:"translateY(-50%)",color:"var(--text3)" }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{ ...inp, paddingLeft:"1.9rem", width:"100%", boxSizing:"border-box" as any }}/>
        </div>
        <div style={{ position:"relative" }}>
          <Tag size={12} style={{ position:"absolute",left:"0.6rem",top:"50%",transform:"translateY(-50%)",color:"var(--text3)" }}/>
          <input value={tagFilter} onChange={e=>setTagFilter(e.target.value)} placeholder="#tag" style={{ ...inp, paddingLeft:"1.9rem", width:"120px" }}/>
        </div>
        {[
          { val:subject,    set:setSubject,    options:[["all","All Subjects"],...(subjects?.map((s:any)=>[String(s.id),s.name])??[])] },
          { val:status,     set:setStatus,     options:[["all","All Status"],["draft","Draft"],["published","Published"]] },
          { val:difficulty, set:setDifficulty, options:[["all","All"],["easy","Easy"],["medium","Medium"],["hard","Hard"]] },
        ].map(({ val, set, options },i) => (
          <select key={i} value={val} onChange={e=>set(e.target.value)} style={{ ...inp, appearance:"none" as any }}>
            {options.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
      </div>

      {/* Questions */}
      {isLoading ? <div style={{ padding:"3rem",textAlign:"center",color:"var(--text3)" }}>Loading...</div> :
       !questions?.length ? <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"3rem",textAlign:"center",color:"var(--text3)" }}>No questions found.</div> : (
        <div style={{ display:"flex",flexDirection:"column",gap:"0.75rem" }}>
          {questions.map((q:any) => {
            const open = expanded===q.id;
            const opts = [
              { key:"A",text:q.optionA,img:q.optionAImage },
              { key:"B",text:q.optionB,img:q.optionBImage },
              { key:"C",text:q.optionC,img:q.optionCImage },
              { key:"D",text:q.optionD,img:q.optionDImage },
            ].filter(o=>o.text||o.img);
            return (
              <div key={q.id} style={{ background:"var(--surface)",border:`1px solid ${open?"var(--accent-dim)":"var(--border)"}`,borderRadius:"var(--radius)",overflow:"hidden",transition:"border-color 0.15s" }}>
                <div style={{ padding:"0.875rem 1.25rem",display:"flex",alignItems:"flex-start",gap:"0.875rem",cursor:"pointer" }} onClick={()=>setExpanded(open?null:q.id)}>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:"0.85rem",color:"var(--text)",lineHeight:1.6,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:open?undefined:2,WebkitBoxOrient:"vertical" as any }}>
                      <KaTeXDisplay text={q.question}/>
                    </div>
                    <div style={{ display:"flex",gap:"0.4rem",flexWrap:"wrap",marginTop:"0.4rem" }}>
                      <span style={{ fontSize:"0.65rem",color:diffColor[q.difficulty]??"var(--text3)",fontWeight:600 }}>{q.difficulty}</span>
                      <span style={{ fontSize:"0.65rem",color:"var(--text3)" }}>·</span>
                      <span style={{ fontSize:"0.65rem",color:"var(--text3)" }}>{q.subject?.name}</span>
                      <span style={{ fontSize:"0.65rem",color:"var(--text3)" }}>· {q.marks}m</span>
                      {q.tags?.map((t:any) => <span key={t.tag?.name} style={{ fontSize:"0.65rem",color:"var(--accent)",background:"var(--accent-bg)",padding:"0.1rem 0.35rem",borderRadius:"999px" }}>#{t.tag?.name}</span>)}
                    </div>
                  </div>
                  <div style={{ display:"flex",alignItems:"center",gap:"0.5rem",flexShrink:0 }}>
                    <span style={{ fontSize:"0.65rem",fontWeight:700,padding:"0.2rem 0.5rem",borderRadius:"999px",background:q.status==="published"?"var(--green-bg)":"var(--amber-bg)",color:q.status==="published"?"var(--green)":"var(--amber)" }}>
                      {q.status==="published" ? <><CheckCircle size={10} style={{ verticalAlign:"middle" }}/> Published</> : <><Clock size={10} style={{ verticalAlign:"middle" }}/> Draft</>}
                    </span>
                    {q.status!=="published" && (
                      <button onClick={e=>{e.stopPropagation();publish.mutate(q.id);}} style={{ fontSize:"0.68rem",padding:"0.2rem 0.5rem",borderRadius:"0.375rem",border:"1px solid var(--green)",background:"var(--green-bg)",color:"var(--green)",cursor:"pointer",fontWeight:600 }}>
                        Publish
                      </button>
                    )}
                    <button onClick={e=>{e.stopPropagation();if(confirm("Delete?"))del.mutate(q.id);}} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text3)",display:"flex" }}
                      onMouseEnter={e=>(e.currentTarget.style.color="var(--red)")} onMouseLeave={e=>(e.currentTarget.style.color="var(--text3)")}>
                      <Trash2 size={14}/>
                    </button>
                    {open ? <ChevronUp size={15} color="var(--text3)"/> : <ChevronDown size={15} color="var(--text3)"/>}
                  </div>
                </div>
                {open && (
                  <div style={{ padding:"0 1.25rem 1.25rem",borderTop:"1px solid var(--border)" }}>
                    {q.questionImage && <img src={q.questionImage} alt="" style={{ maxHeight:"160px",maxWidth:"100%",objectFit:"contain",margin:"0.75rem 0",borderRadius:"0.5rem",border:"1px solid var(--border)",display:"block" }}/>}
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem 1.5rem",marginTop:"0.75rem" }}>
                      {opts.map(opt => {
                        const correct = q.correctAnswer?.split(",").includes(opt.key);
                        return (
                          <div key={opt.key} style={{ padding:"0.5rem 0.75rem",borderRadius:"0.4rem",background:correct?"var(--green-bg)":"var(--surface2)",border:`1px solid ${correct?"var(--green)":"var(--border)"}`,display:"flex",gap:"0.5rem",alignItems:"flex-start" }}>
                            <span style={{ fontWeight:700,fontSize:"0.72rem",color:correct?"var(--green)":"var(--text3)",flexShrink:0 }}>{opt.key}.</span>
                            <div>
                              {opt.text && <KaTeXDisplay text={opt.text}/>}
                              {opt.img && <img src={opt.img} alt="" style={{ maxHeight:"80px",maxWidth:"100%",objectFit:"contain",display:"block",marginTop:"4px" }}/>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {q.explanation && (
                      <div style={{ marginTop:"0.75rem",padding:"0.5rem 0.875rem",borderRadius:"0.4rem",background:"var(--amber-bg)",border:"1px solid var(--amber)",fontSize:"0.78rem",color:"var(--amber)" }}>
                        💡 <KaTeXDisplay text={q.explanation}/>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}