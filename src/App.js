import { useState, useEffect, useRef, useCallback } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:9090";
const getToken = () => localStorage.getItem("nowthink_token");
const saveToken = t => localStorage.setItem("nowthink_token", t);
const clearToken = () => localStorage.removeItem("nowthink_token");
const authFetch = (url, opts = {}) => fetch(url, {
  ...opts,
  headers: { ...opts.headers, Authorization: `Bearer ${getToken() || ""}` }
});

const greet = () => {
  const h = new Date().getHours();
  if (h < 5)  return ["It is very late.", "What's keeping you awake?"];
  if (h < 12) return ["Good morning.", "What have you noticed since you woke up?"];
  if (h < 17) return ["Good afternoon.", "Something worth recording?"];
  if (h < 21) return ["Good evening.", "What patterns emerged today?"];
  return ["Late evening.", "What did today reveal that you almost missed?"];
};

const confColor = s => s >= 80 ? "#4a9e6a" : s >= 60 ? "#7a8a3a" : s >= 40 ? "#9a7a3a" : "#8a4a4a";
const themeHue = t => ({ confidence:"#4a9e6a",focus:"#3a7a9e",relationships:"#9e3a7a",identity:"#6a3a9e",productivity:"#9e8a3a",fear:"#9e4a4a",growth:"#3a9e7a",purpose:"#5a3a9e" })[t] || "#555";

const C = {
  bg:"#070707", surface:"#0b0b0b", border:"#141414", borderHov:"#222",
  text:"#e8e8e8", textMid:"#777", textDim:"#333", textGhost:"#1e1e1e",
  accent:"#4a9e6a", accentDim:"#2a5c3a",
};

const T = {
  label:  { fontSize:"0.6rem",  letterSpacing:"0.18em", textTransform:"uppercase", fontFamily:"system-ui,-apple-system,sans-serif", fontWeight:600 },
  caption:{ fontSize:"0.75rem", fontFamily:"system-ui,-apple-system,sans-serif", lineHeight:1.5 },
  body:   { fontSize:"0.9rem",  fontFamily:"'Georgia',serif", lineHeight:1.75 },
  prose:  { fontSize:"1rem",    fontFamily:"'Georgia',serif", lineHeight:1.8 },
  h1:     { fontWeight:"normal", fontFamily:"'Georgia',serif", letterSpacing:"-0.025em", lineHeight:1.2 },
};

const Spinner = ({ size=18 }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" style={{ animation:"nt-spin 0.9s linear infinite", flexShrink:0 }}>
    <circle cx="9" cy="9" r="7" fill="none" stroke="#1a1a1a" strokeWidth="1.5"/>
    <path d="M9 2 A7 7 0 0 1 16 9" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const Badge = ({ status }) => {
  const cfg = {
    Supported:    { bg:"#0a1f0e", border:"#1a4a25", color:"#4a9e6a" },
    Investigating:{ bg:"#1a1a08", border:"#3a3a12", color:"#9e9e4a" },
    Refuted:      { bg:"#1f0a0a", border:"#4a1a1a", color:"#9e4a4a" },
    pending:      { bg:"#111",    border:"#1a1a1a", color:"#333"    },
    error:        { bg:"#111",    border:"#1a1a1a", color:"#333"    },
  };
  const s = cfg[status] || cfg.pending;
  return <span style={{ ...T.label, background:s.bg, border:`1px solid ${s.border}`, color:s.color, padding:"3px 9px", borderRadius:"4px", fontSize:"0.58rem" }}>{status}</span>;
};

const ConfBar = ({ score, height=3 }) => (
  <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
    <div style={{ flex:1, height, background:"#111", borderRadius:height, overflow:"hidden" }}>
      <div style={{ width:`${score}%`, height:"100%", background:confColor(score), borderRadius:height, transition:"width 1s cubic-bezier(0.4,0,0.2,1)" }}/>
    </div>
    <span style={{ ...T.caption, color:C.textMid, minWidth:"32px", textAlign:"right", fontVariantNumeric:"tabular-nums" }}>{score}%</span>
  </div>
);

// ── LOGIN ─────────────────────────────────────────────────────────────────
function LoginScreen() {
  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 24px" }}>
      <div style={{ maxWidth:"360px", width:"100%" }}>
        <p style={{ ...T.label, color:C.accentDim, marginBottom:"28px", fontSize:"0.62rem" }}>nowthink</p>
        <h1 style={{ ...T.h1, color:C.text, fontSize:"clamp(2.1rem,5vw,2.8rem)", margin:"0 0 20px" }}>
          See the patterns<br/>you never knew<br/>were there.
        </h1>
        <p style={{ ...T.caption, color:"#2e2e2e", lineHeight:1.85, margin:"0 0 44px" }}>
          An AI that investigates you.<br/>
          Not a journal. Not a chatbot.<br/>
          A case built from your own words.
        </p>
        <a href={`${API}/oauth2/authorization/google`}
          style={{ display:"inline-flex", alignItems:"center", gap:"10px", background:"#f5f5f5", color:"#111", padding:"12px 22px", borderRadius:"6px", fontSize:"0.85rem", textDecoration:"none", fontFamily:"system-ui", fontWeight:500, letterSpacing:"-0.01em", transition:"background 0.15s", whiteSpace:"nowrap" }}
          onMouseEnter={e => e.currentTarget.style.background="#fff"}
          onMouseLeave={e => e.currentTarget.style.background="#f5f5f5"}>
          <svg width="16" height="16" viewBox="0 0 18 18" style={{ flexShrink:0 }}>
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </a>
        <p style={{ ...T.caption, color:"#181818", marginTop:"20px", fontSize:"0.68rem" }}>Your observations are private. Always.</p>
      </div>
    </div>
  );
}

// ── CASE CARD ─────────────────────────────────────────────────────────────
function CaseCard({ d, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <article onClick={() => onClick(d)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background:hov ? "#0d0d0d" : C.surface, border:`1px solid ${hov ? C.borderHov : C.border}`, borderRadius:"8px", padding:"20px 24px", marginBottom:"8px", cursor:"pointer", transition:"background 0.15s, border-color 0.15s", animation:"nt-up 0.3s ease both" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px", gap:"16px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <span style={{ ...T.label, color:"#1e2e1e", fontSize:"0.56rem" }}>CASE #{d.id}</span>
          {d.discoveryType && d.discoveryType !== "none" &&
            <span style={{ ...T.label, color:"#1e1e1e", fontSize:"0.54rem" }}>{d.discoveryType}</span>}
        </div>
        <Badge status={d.status}/>
      </div>
      <p style={{ ...T.body, color:"#b8b8b8", marginBottom:"18px", fontSize:"0.875rem" }}>{d.claim}</p>
      <ConfBar score={d.confidenceScore}/>
    </article>
  );
}

// ── CASE MODAL ────────────────────────────────────────────────────────────
function CaseModal({ d, onClose }) {
  useEffect(() => {
    const h = e => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  if (!d) return null;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.94)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:300, padding:"24px", backdropFilter:"blur(12px)" }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background:"#0c0c0c", border:"1px solid #1e1e1e", borderRadius:"10px", maxWidth:"580px", width:"100%", maxHeight:"88vh", overflowY:"auto", animation:"nt-up 0.2s ease" }}>
        <div style={{ padding:"22px 28px", borderBottom:"1px solid #0f0f0f", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
            <span style={{ ...T.label, color:"#1e2e1e", fontSize:"0.56rem" }}>CASE #{d.id}</span>
            <span style={{ color:"#161616" }}>·</span>
            <Badge status={d.status}/>
          </div>
          <button onClick={onClose}
            style={{ ...T.label, background:"#111", border:"1px solid #1a1a1a", color:"#333", padding:"4px 10px", borderRadius:"4px", cursor:"pointer", fontSize:"0.54rem", transition:"color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color="#666"}
            onMouseLeave={e => e.currentTarget.style.color="#333"}>
            ESC
          </button>
        </div>
        <div style={{ padding:"28px 28px 24px" }}>
          <p style={{ ...T.prose, color:"#e0e0e0", marginBottom:"32px", fontStyle:"italic" }}>{d.claim}</p>
          <div style={{ marginBottom:"32px" }}>
            <p style={{ ...T.label, color:C.textDim, marginBottom:"12px", fontSize:"0.56rem" }}>Confidence level</p>
            <ConfBar score={d.confidenceScore} height={5}/>
          </div>
          {d.evidenceFor && (
            <div style={{ marginBottom:"16px" }}>
              <p style={{ ...T.label, color:C.accentDim, marginBottom:"10px", fontSize:"0.56rem" }}>Evidence for</p>
              <div style={{ background:"#0a1209", border:"1px solid #0e1a0e", borderRadius:"6px", padding:"16px 18px" }}>
                <p style={{ ...T.body, color:"#6a9a6a", margin:0, fontStyle:"italic", fontSize:"0.875rem" }}>{d.evidenceFor}</p>
              </div>
            </div>
          )}
          {d.evidenceAgainst && (
            <div style={{ marginBottom:"16px" }}>
              <p style={{ ...T.label, color:"#5c2525", marginBottom:"10px", fontSize:"0.56rem" }}>Evidence against</p>
              <div style={{ background:"#120a0a", border:"1px solid #1c0e0e", borderRadius:"6px", padding:"16px 18px" }}>
                <p style={{ ...T.body, color:"#9a6a6a", margin:0, fontStyle:"italic", fontSize:"0.875rem" }}>{d.evidenceAgainst}</p>
              </div>
            </div>
          )}
          <div style={{ marginTop:"24px", paddingTop:"20px", borderTop:"1px solid #0f0f0f" }}>
            <span style={{ ...T.caption, color:C.textGhost, fontSize:"0.68rem" }}>Discovery type: {d.discoveryType}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── EVOLUTION VIEW ────────────────────────────────────────────────────────
function EvolutionView({ evolutions }) {
  const themes = [...new Set(evolutions.map(e => e.theme))];
  if (!evolutions.length) return (
    <div style={{ padding:"80px 0", textAlign:"center" }}>
      <p style={{ ...T.body, color:C.textDim, fontStyle:"italic", marginBottom:"8px" }}>No beliefs tracked yet.</p>
      <p style={{ ...T.caption, color:"#252525" }}>File observations to begin tracking how your thinking evolves.</p>
    </div>
  );
  return (
    <div>
      {themes.map(theme => {
        const color = themeHue(theme);
        const entries = evolutions.filter(e => e.theme === theme).sort((a,b) => new Date(a.recordedAt)-new Date(b.recordedAt));
        return (
          <section key={theme} style={{ marginBottom:"52px", animation:"nt-up 0.3s ease both" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"28px" }}>
              <span style={{ ...T.label, background:color+"14", border:`1px solid ${color}28`, color, padding:"4px 12px", borderRadius:"4px", fontSize:"0.56rem" }}>{theme}</span>
              <span style={{ ...T.caption, color:"#252525" }}>{entries.length} belief{entries.length!==1?"s":""}</span>
            </div>
            {entries.map((entry, i) => (
              <div key={entry.id} style={{ display:"flex", gap:"20px", marginBottom:"28px" }}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", paddingTop:"4px", width:"10px", flexShrink:0 }}>
                  <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:color, flexShrink:0 }}/>
                  {i < entries.length-1 && <div style={{ width:"1px", flex:1, background:color+"1a", minHeight:"28px", marginTop:"6px" }}/>}
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ ...T.body, color:"#b0b0b0", fontStyle:"italic", margin:"0 0 5px", fontSize:"0.9rem" }}>{entry.belief}</p>
                  <p style={{ ...T.caption, color:"#2a2a2a", margin:"0 0 7px" }}>
                    {new Date(entry.recordedAt).toLocaleDateString("en-IN", { day:"numeric", month:"short" })}
                  </p>
                  <p style={{ ...T.caption, color:"#282828", fontStyle:"italic", margin:0, lineHeight:1.6 }}>
                    "{entry.sourceObservation?.slice(0,90)}{entry.sourceObservation?.length>90?"...":""}"
                  </p>
                </div>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────
export default function App() {
  const [user,         setUser]         = useState(null);
  const [authChecked,  setAuthChecked]  = useState(false);
  const [view,         setView]         = useState("discovery");
  const [observations, setObservations] = useState([]);
  const [discoveries,  setDiscoveries]  = useState([]);
  const [evolutions,   setEvolutions]   = useState([]);
  const [obsText,      setObsText]      = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [generating,   setGenerating]   = useState(false);
  const [lastResult,   setLastResult]   = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [totalObs,     setTotalObs]     = useState(0);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) { saveToken(token); window.history.replaceState({}, "", "/"); }
    if (!getToken()) { setAuthChecked(true); return; }
    authFetch(`${API}/api/auth/me`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setUser(data); setAuthChecked(true); })
      .catch(() => setAuthChecked(true));
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [obs, disc, evo] = await Promise.all([
        authFetch(`${API}/api/observe`).then(r => r.json()),
        authFetch(`${API}/api/discoveries`).then(r => r.json()),
        authFetch(`${API}/api/evolution`).then(r => r.json()),
      ]);
      setObservations(Array.isArray(obs)  ? obs  : []);
      setTotalObs(Array.isArray(obs) ? obs.length : 0);
      setDiscoveries(Array.isArray(disc) ? disc : []);
      setEvolutions(Array.isArray(evo)  ? evo  : []);
    } catch { setError("Could not reach the server."); }
    setLoading(false);
  }, []);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  const handleObserve = async () => {
    if (!obsText.trim() || submitting) return;
    setSubmitting(true); setError(null); setLastResult(null);
    try {
      const res = await authFetch(`${API}/api/observe`, {
        method:"POST", headers:{ "Content-Type":"text/plain" }, body:obsText,
      });
      if (res.ok) {
        const data = await res.json();
        setLastResult(data); setTotalObs(data.totalObservations); setObsText("");
        setTimeout(loadData, 2000);
      } else { setError("Failed to file observation."); }
    } catch { setError("Connection error."); }
    setSubmitting(false);
  };

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true); setError(null);
    try {
      const res = await authFetch(`${API}/api/discoveries/generate`, { method:"POST" });
      if (res.ok) {
        const data = await res.json();
        setDiscoveries(prev => [data, ...prev.filter(d => d.id !== data.id)]);
        setSelectedCase(data);
      }
    } catch { setError("Investigation failed."); }
    setGenerating(false);
  };

  const handleLogout = () => {
    clearToken();
    setUser(null); setObservations([]); setDiscoveries([]); setEvolutions([]);
  };

  if (!authChecked) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <Spinner size={20}/>
    </div>
  );
  if (!user) return <LoginScreen/>;

  const [greetWord, greetSub] = greet();
  const navItems = [
    { key:"discovery", label:"Discoveries", count:discoveries.length },
    { key:"observe",   label:"Observe" },
    { key:"evidence",  label:"Evidence",    count:totalObs },
    { key:"evolution", label:"Evolution",   count:evolutions.length },
  ];

  const hasText = obsText.trim().length > 0;

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'Georgia',serif" }}>
      <style>{`
        *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes nt-spin { to { transform:rotate(360deg); } }
        @keyframes nt-up   { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        ::-webkit-scrollbar       { width:3px; }
        ::-webkit-scrollbar-track { background:${C.bg}; }
        ::-webkit-scrollbar-thumb { background:#1a1a1a; border-radius:2px; }
        textarea         { caret-color:${C.accent}; }
        textarea:focus   { outline:none !important; border-color:#1e3e1e !important; }
        button:focus     { outline:none; }
      `}</style>

      {/* NAV */}
      <header style={{ position:"sticky", top:0, zIndex:100, background:"rgba(7,7,7,0.97)", backdropFilter:"blur(16px)", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:"960px", margin:"0 auto", padding:"0 32px", display:"flex", alignItems:"center", height:"50px", gap:"32px" }}>
          <span style={{ ...T.label, color:C.accent, fontSize:"0.62rem", flexShrink:0 }}>nowthink</span>
          <nav style={{ display:"flex", flex:1 }}>
            {navItems.map(item => {
              const active = view === item.key;
              return (
                <button key={item.key} onClick={() => setView(item.key)}
                  style={{ background:"none", border:"none", padding:"0 14px", height:"50px", display:"flex", alignItems:"center", gap:"7px", color:active ? C.text : C.textDim, fontSize:"0.78rem", fontFamily:"system-ui", letterSpacing:"-0.01em", borderBottom:`2px solid ${active ? C.accent : "transparent"}`, transition:"color 0.15s, border-color 0.15s", position:"relative", top:"1px" }}>
                  {item.label}
                  {item.count > 0 && (
                    <span style={{ ...T.label, background:active ? "#0e200e" : "#111", color:active ? C.accent : "#2a2a2a", padding:"2px 6px", borderRadius:"3px", fontSize:"0.54rem", transition:"all 0.15s" }}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", flexShrink:0 }}>
            {user?.picture
              ? <img src={user.picture} alt="" style={{ width:"24px", height:"24px", borderRadius:"50%", opacity:0.8 }}/>
              : <div style={{ width:"24px", height:"24px", borderRadius:"50%", background:C.accentDim, display:"flex", alignItems:"center", justifyContent:"center", ...T.label, color:C.accent, fontSize:"0.6rem" }}>{user?.name?.[0]}</div>
            }
            <button onClick={handleLogout}
              style={{ ...T.caption, background:"none", border:"none", color:"#252525", fontSize:"0.7rem", transition:"color 0.15s", padding:0 }}
              onMouseEnter={e => e.currentTarget.style.color="#555"}
              onMouseLeave={e => e.currentTarget.style.color="#252525"}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main style={{ maxWidth:"960px", margin:"0 auto", padding:"56px 32px 80px" }}>

        {error && (
          <div style={{ background:"#140808", border:"1px solid #2a1010", borderRadius:"6px", padding:"12px 16px", marginBottom:"28px", display:"flex", justifyContent:"space-between", alignItems:"center", animation:"nt-up 0.2s ease" }}>
            <span style={{ ...T.caption, color:"#9e4a4a" }}>{error}</span>
            <button onClick={() => setError(null)} style={{ background:"none", border:"none", color:"#3a3a3a", fontSize:"1.1rem", padding:"0 0 0 16px", cursor:"pointer" }}>×</button>
          </div>
        )}

        {/* DISCOVERIES */}
        {view === "discovery" && (
          <div style={{ animation:"nt-up 0.3s ease" }}>
            <div style={{ marginBottom:"44px" }}>
              <h1 style={{ ...T.h1, color:C.text, fontSize:"clamp(1.7rem,3vw,2.1rem)", marginBottom:"8px" }}>Discoveries</h1>
              <p style={{ ...T.caption, color:C.textDim }}>Evidence-based patterns the system has found in your observations</p>
            </div>

            <div style={{ background:"#0b140b", border:"1px solid #132013", borderRadius:"8px", padding:"22px 26px", marginBottom:"28px" }}>
              <p style={{ ...T.label, color:totalObs >= 3 ? C.accentDim : "#2a3a2a", marginBottom:"10px", fontSize:"0.56rem" }}>
                {totalObs < 3 ? `${3-totalObs} more observation${3-totalObs!==1?"s":""} needed` : "✓ investigation ready"}
              </p>
              <p style={{ ...T.body, color:"#3a3a3a", marginBottom:totalObs >= 3 ? "20px" : "0", fontSize:"0.875rem" }}>
                {totalObs < 3
                  ? "The system requires at least 3 observations before it can open a case."
                  : "Enough evidence has been gathered. The system is ready to present its findings."}
              </p>
              {totalObs >= 3 && (
                <button onClick={handleGenerate} disabled={generating}
                  style={{ background:generating ? "transparent" : "#0e260e", border:`1px solid ${generating ? "#1a2a1a" : "#1e3e1e"}`, color:generating ? C.accentDim : C.accent, padding:"10px 20px", borderRadius:"6px", fontSize:"0.8rem", fontFamily:"system-ui", display:"inline-flex", alignItems:"center", gap:"10px", transition:"all 0.2s", letterSpacing:"-0.01em", cursor:generating ? "default" : "pointer" }}
                  onMouseEnter={e => { if(!generating) e.currentTarget.style.borderColor="#2a4a2a"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor=generating?"#1a2a1a":"#1e3e1e"; }}>
                  {generating ? <><Spinner size={14}/><span>Investigating...</span></> : "Open investigation →"}
                </button>
              )}
            </div>

            {loading && !discoveries.length
              ? <div style={{ display:"flex", justifyContent:"center", padding:"60px 0" }}><Spinner/></div>
              : !discoveries.length
                ? <div style={{ padding:"80px 0", textAlign:"center" }}>
                    <p style={{ ...T.body, color:C.textDim, fontStyle:"italic", marginBottom:"8px" }}>No cases opened yet.</p>
                    <p style={{ ...T.caption, color:"#252525" }}>File at least 3 observations and open your first investigation.</p>
                  </div>
                : discoveries.map(d => <CaseCard key={d.id} d={d} onClick={setSelectedCase}/>)
            }
          </div>
        )}

        {/* OBSERVE */}
        {view === "observe" && (
          <div style={{ animation:"nt-up 0.3s ease", maxWidth:"640px" }}>
            <div style={{ marginBottom:"40px" }}>
              <h1 style={{ ...T.h1, color:C.text, fontSize:"clamp(1.7rem,3vw,2.1rem)", marginBottom:"8px" }}>{greetWord}</h1>
              <p style={{ ...T.caption, color:C.textDim }}>{greetSub}</p>
            </div>

            <p style={{ ...T.caption, color:"#2c2c2c", fontStyle:"italic", marginBottom:"20px", lineHeight:1.8 }}>
              Not "how was your day." What did you actually notice? Something recurring, surprising, or quietly avoided.
            </p>

            <textarea ref={textareaRef} value={obsText}
              onChange={e => setObsText(e.target.value)}
              onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); handleObserve(); } }}
              placeholder="Write freely. The system will extract what matters."
              style={{ width:"100%", minHeight:"160px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:"8px", color:C.text, padding:"18px 20px", fontSize:"0.95rem", resize:"none", fontFamily:"'Georgia',serif", lineHeight:1.75, transition:"border-color 0.2s", display:"block" }}/>

            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:"12px", flexWrap:"wrap", gap:"12px" }}>
              <span style={{ ...T.caption, color:"#202020", fontSize:"0.68rem" }}>Enter to file · Shift+Enter for new line</span>
              <button onClick={handleObserve} disabled={submitting || !hasText}
                style={{
                  background: !hasText ? "transparent" : submitting ? "transparent" : "#0e260e",
                  border: `1px solid ${!hasText ? "#111" : submitting ? "#1a2a1a" : "#1e3e1e"}`,
                  color: !hasText ? "#202020" : submitting ? C.accentDim : C.accent,
                  padding:"10px 18px", borderRadius:"6px", fontSize:"0.78rem", fontFamily:"system-ui",
                  display:"inline-flex", alignItems:"center", gap:"8px", transition:"all 0.2s",
                  letterSpacing:"-0.01em", whiteSpace:"nowrap",
                  cursor: submitting || !hasText ? "default" : "pointer",
                }}>
                {submitting ? <><Spinner size={13}/>Filing...</> : "File observation →"}
              </button>
            </div>

            {lastResult && (
              <div style={{ marginTop:"28px", background:"#09120a", border:"1px solid #0e1c0e", borderRadius:"8px", padding:"18px 20px", animation:"nt-up 0.3s ease" }}>
                <p style={{ ...T.label, color:C.accentDim, marginBottom:"10px", fontSize:"0.56rem" }}>Observation filed</p>
                <p style={{ ...T.body, color:"#7aba7a", fontStyle:"italic", marginBottom:"10px", fontSize:"0.9rem" }}>{lastResult.theme}</p>
                <div style={{ display:"flex", gap:"14px", flexWrap:"wrap" }}>
                  <span style={{ ...T.caption, color:"#2a4a2a" }}>Energy {lastResult.energyScore}/10</span>
                  <span style={{ color:"#162016" }}>·</span>
                  <span style={{ ...T.caption, color:"#2a4a2a" }}>{lastResult.totalObservations} total</span>
                  {lastResult.readyForDiscovery && <>
                    <span style={{ color:"#162016" }}>·</span>
                    <span style={{ ...T.caption, color:C.accent }}>Ready for investigation</span>
                  </>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* EVIDENCE */}
        {view === "evidence" && (
          <div style={{ animation:"nt-up 0.3s ease" }}>
            <div style={{ marginBottom:"44px" }}>
              <h1 style={{ ...T.h1, color:C.text, fontSize:"clamp(1.7rem,3vw,2.1rem)", marginBottom:"8px" }}>Evidence</h1>
              <p style={{ ...T.caption, color:C.textDim }}>{totalObs} observation{totalObs!==1?"s":""} on record</p>
            </div>

            {loading && !observations.length
              ? <div style={{ display:"flex", justifyContent:"center", padding:"60px 0" }}><Spinner/></div>
              : !observations.length
                ? <div style={{ padding:"80px 0", textAlign:"center" }}>
                    <p style={{ ...T.body, color:C.textDim, fontStyle:"italic", marginBottom:"8px" }}>No observations yet.</p>
                    <p style={{ ...T.caption, color:"#252525" }}>Go to Observe to file your first one.</p>
                  </div>
                : observations.map(obs => (
                  <article key={obs.id}
                    style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:"8px", padding:"18px 22px", marginBottom:"8px", transition:"border-color 0.15s", animation:"nt-up 0.25s ease" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor=C.borderHov}
                    onMouseLeave={e => e.currentTarget.style.borderColor=C.border}>
                    <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"12px", flexWrap:"wrap" }}>
                      <span style={{ ...T.label, color:"#1a2a1a", fontSize:"0.54rem" }}>OBS #{obs.id}</span>
                      {obs.extractedTheme && obs.extractedTheme !== "Unnamed observation" &&
                        <span style={{ ...T.caption, color:"#3a5a3a", fontStyle:"italic", fontSize:"0.72rem" }}>{obs.extractedTheme}</span>}
                      <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:"4px" }}>
                        {Array.from({ length:10 }).map((_,i) => (
                          <div key={i} style={{ width:"3px", height:"14px", borderRadius:"1.5px", background:i < obs.energyScore ? confColor(obs.energyScore*10) : "#161616" }}/>
                        ))}
                        <span style={{ ...T.caption, color:"#2a2a2a", marginLeft:"8px", fontSize:"0.68rem" }}>{obs.energyScore}/10</span>
                      </div>
                    </div>
                    <p style={{ ...T.body, color:C.textMid, marginBottom:"10px", fontSize:"0.875rem" }}>{obs.rawText}</p>
                    <p style={{ ...T.caption, color:"#252525", fontSize:"0.66rem" }}>
                      {new Date(obs.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                    </p>
                  </article>
                ))
            }
          </div>
        )}

        {/* EVOLUTION */}
        {view === "evolution" && (
          <div style={{ animation:"nt-up 0.3s ease" }}>
            <div style={{ marginBottom:"44px" }}>
              <h1 style={{ ...T.h1, color:C.text, fontSize:"clamp(1.7rem,3vw,2.1rem)", marginBottom:"8px" }}>Thought Evolution</h1>
              <p style={{ ...T.caption, color:C.textDim }}>How your beliefs shift over time</p>
            </div>
            {loading && !evolutions.length
              ? <div style={{ display:"flex", justifyContent:"center", padding:"60px 0" }}><Spinner/></div>
              : <EvolutionView evolutions={evolutions}/>
            }
          </div>
        )}

      </main>

      <CaseModal d={selectedCase} onClose={() => setSelectedCase(null)}/>
    </div>
  );
}