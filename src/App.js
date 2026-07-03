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

const confColor = s => {
  if (s >= 80) return "#4a9e6a";
  if (s >= 60) return "#7a8a3a";
  if (s >= 40) return "#9a7a3a";
  return "#8a4a4a";
};

const themeHue = t => ({
  confidence: "#4a9e6a", focus: "#3a7a9e", relationships: "#9e3a7a",
  identity: "#6a3a9e", productivity: "#9e8a3a", fear: "#9e4a4a",
  growth: "#3a9e7a", purpose: "#5a3a9e"
})[t] || "#555";

// ── Typography tokens ──────────────────────────────────────────────────────
const T = {
  label:  { fontSize: "0.6rem",  letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "system-ui, -apple-system, sans-serif", fontWeight: 600 },
  caption:{ fontSize: "0.72rem", fontFamily: "system-ui, -apple-system, sans-serif", lineHeight: 1.5 },
  body:   { fontSize: "0.9rem",  fontFamily: "'Georgia', serif", lineHeight: 1.75 },
  prose:  { fontSize: "1rem",    fontFamily: "'Georgia', serif", lineHeight: 1.8 },
  h1:     { fontSize: "clamp(1.75rem, 3.5vw, 2.25rem)", fontWeight: "normal", fontFamily: "'Georgia', serif", letterSpacing: "-0.025em", lineHeight: 1.2 },
};

// ── Color tokens ───────────────────────────────────────────────────────────
const C = {
  bg:       "#070707",
  surface:  "#0b0b0b",
  border:   "#141414",
  borderHov:"#1e1e1e",
  text:     "#e8e8e8",
  textMid:  "#888",
  textDim:  "#3a3a3a",
  textGhost:"#1e1e1e",
  accent:   "#4a9e6a",
  accentDim:"#2a5c3a",
};

// ── Spinner ────────────────────────────────────────────────────────────────
const Spinner = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" style={{ animation: "nt-spin 0.9s linear infinite", flexShrink: 0 }}>
    <circle cx="9" cy="9" r="7" fill="none" stroke="#1a1a1a" strokeWidth="1.5"/>
    <path d="M9 2 A7 7 0 0 1 16 9" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// ── Status badge ───────────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const cfg = {
    Supported:    { bg: "#0a1f0e", border: "#1a4a25", color: "#4a9e6a" },
    Investigating:{ bg: "#1a1a08", border: "#3a3a12", color: "#9e9e4a" },
    Refuted:      { bg: "#1f0a0a", border: "#4a1a1a", color: "#9e4a4a" },
    pending:      { bg: "#111",    border: "#1a1a1a", color: "#333"    },
    error:        { bg: "#111",    border: "#1a1a1a", color: "#333"    },
  };
  const s = cfg[status] || cfg.pending;
  return (
    <span style={{ ...T.label, background: s.bg, border: `1px solid ${s.border}`, color: s.color, padding: "3px 9px", borderRadius: "4px", fontSize: "0.58rem" }}>
      {status}
    </span>
  );
};

// ── Confidence bar ─────────────────────────────────────────────────────────
const ConfBar = ({ score, height = 3 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
    <div style={{ flex: 1, height, background: "#111", borderRadius: height }}>
      <div style={{ width: `${score}%`, height: "100%", background: confColor(score), borderRadius: height, transition: "width 1s cubic-bezier(0.4,0,0.2,1)" }}/>
    </div>
    <span style={{ ...T.caption, color: C.textMid, minWidth: "28px", textAlign: "right", fontSize: "0.68rem" }}>{score}%</span>
  </div>
);

// ── Login ──────────────────────────────────────────────────────────────────
function LoginScreen() {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ maxWidth: "380px", width: "100%" }}>

        {/* Brand mark */}
        <div style={{ marginBottom: "56px" }}>
          <p style={{ ...T.label, color: C.accentDim, marginBottom: "32px" }}>nowthink</p>
          <h1 style={{ ...T.h1, color: C.text, margin: "0 0 20px", fontSize: "clamp(2rem,5vw,2.8rem)" }}>
            See the patterns<br/>
            you never knew<br/>
            were there.
          </h1>
          <p style={{ ...T.caption, color: C.textDim, lineHeight: 1.8 }}>
            An AI that investigates you.<br/>
            Not a journal. Not a chatbot.<br/>
            A case built from your own words.
          </p>
        </div>

        {/* CTA */}
        <a href={`${API}/oauth2/authorization/google`}
          style={{ display: "flex", alignItems: "center", gap: "10px", background: "#f5f5f5", color: "#111", padding: "13px 20px", borderRadius: "6px", fontSize: "0.85rem", textDecoration: "none", fontFamily: "system-ui", fontWeight: 500, letterSpacing: "-0.01em", width: "100%", boxSizing: "border-box", transition: "background 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.background = "#fff"}
          onMouseLeave={e => e.currentTarget.style.background = "#f5f5f5"}>
          <svg width="16" height="16" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </a>

        <p style={{ ...T.caption, color: C.textGhost, marginTop: "20px" }}>
          Your observations are private. Always.
        </p>
      </div>
    </div>
  );
}

// ── Discovery card ─────────────────────────────────────────────────────────
function CaseCard({ d, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <article
      onClick={() => onClick(d)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? "#0d0d0d" : C.surface,
        border: `1px solid ${hov ? "#222" : C.border}`,
        borderRadius: "8px",
        padding: "20px 22px",
        marginBottom: "8px",
        cursor: "pointer",
        transition: "background 0.15s, border-color 0.15s",
        animation: "nt-up 0.3s ease both",
      }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ ...T.label, color: "#253525", fontSize: "0.58rem" }}>CASE #{d.id}</span>
          {d.discoveryType && d.discoveryType !== "none" &&
            <span style={{ ...T.label, color: "#222", fontSize: "0.56rem" }}>{d.discoveryType}</span>}
        </div>
        <Badge status={d.status}/>
      </div>

      {/* Claim */}
      <p style={{ ...T.body, color: "#c0c0c0", marginBottom: "18px", fontSize: "0.9rem" }}>{d.claim}</p>

      {/* Confidence */}
      <ConfBar score={d.confidenceScore}/>
    </article>
  );
}

// ── Case modal ─────────────────────────────────────────────────────────────
function CaseModal({ d, onClose }) {
  useEffect(() => {
    const h = e => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  if (!d) return null;

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: "24px", backdropFilter: "blur(10px)" }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "#0c0c0c", border: `1px solid #1e1e1e`, borderRadius: "10px", maxWidth: "600px", width: "100%", maxHeight: "88vh", overflowY: "auto", animation: "nt-up 0.2s ease" }}>

        {/* Modal header */}
        <div style={{ padding: "22px 28px", borderBottom: "1px solid #111", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ ...T.label, color: "#253525", fontSize: "0.58rem" }}>CASE #{d.id}</span>
            <span style={{ color: "#1a1a1a", fontSize: "0.7rem" }}>·</span>
            <Badge status={d.status}/>
          </div>
          <button
            onClick={onClose}
            style={{ ...T.label, background: "#111", border: "1px solid #1a1a1a", color: "#3a3a3a", padding: "4px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "0.56rem" }}>
            ESC
          </button>
        </div>

        {/* Modal body */}
        <div style={{ padding: "28px" }}>

          {/* Claim */}
          <p style={{ ...T.prose, color: "#e0e0e0", marginBottom: "32px", fontStyle: "italic" }}>{d.claim}</p>

          {/* Confidence */}
          <div style={{ marginBottom: "32px" }}>
            <p style={{ ...T.label, color: C.textDim, marginBottom: "12px" }}>Confidence level</p>
            <ConfBar score={d.confidenceScore} height={5}/>
          </div>

          {/* Evidence for */}
          {d.evidenceFor && (
            <div style={{ marginBottom: "20px" }}>
              <p style={{ ...T.label, color: C.accentDim, marginBottom: "10px" }}>Evidence for</p>
              <div style={{ background: "#0a1209", border: "1px solid #0f1e0f", borderRadius: "6px", padding: "16px 18px" }}>
                <p style={{ ...T.body, color: "#6a9a6a", margin: 0, fontStyle: "italic", fontSize: "0.875rem" }}>{d.evidenceFor}</p>
              </div>
            </div>
          )}

          {/* Evidence against */}
          {d.evidenceAgainst && (
            <div style={{ marginBottom: "20px" }}>
              <p style={{ ...T.label, color: "#5c2525", marginBottom: "10px" }}>Evidence against</p>
              <div style={{ background: "#120a0a", border: "1px solid #1e0f0f", borderRadius: "6px", padding: "16px 18px" }}>
                <p style={{ ...T.body, color: "#9a6a6a", margin: 0, fontStyle: "italic", fontSize: "0.875rem" }}>{d.evidenceAgainst}</p>
              </div>
            </div>
          )}

          {/* Discovery type footer */}
          <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #0f0f0f" }}>
            <span style={{ ...T.caption, color: C.textGhost }}>Discovery type: {d.discoveryType}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Evolution view ─────────────────────────────────────────────────────────
function EvolutionView({ evolutions }) {
  const themes = [...new Set(evolutions.map(e => e.theme))];

  if (!evolutions.length) return (
    <div style={{ padding: "80px 0", textAlign: "center" }}>
      <p style={{ ...T.body, color: C.textDim, fontStyle: "italic", marginBottom: "8px" }}>No beliefs tracked yet.</p>
      <p style={{ ...T.caption, color: C.textGhost }}>File observations to begin tracking how your thinking evolves.</p>
    </div>
  );

  return (
    <div>
      {themes.map(theme => {
        const color = themeHue(theme);
        const entries = evolutions
          .filter(e => e.theme === theme)
          .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));

        return (
          <section key={theme} style={{ marginBottom: "52px", animation: "nt-up 0.3s ease both" }}>
            {/* Theme header */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
              <span style={{ ...T.label, background: color + "14", border: `1px solid ${color}28`, color, padding: "4px 12px", borderRadius: "4px", fontSize: "0.58rem" }}>
                {theme}
              </span>
              <span style={{ ...T.caption, color: C.textGhost }}>
                {entries.length} belief{entries.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Timeline */}
            {entries.map((entry, i) => (
              <div key={entry.id} style={{ display: "flex", gap: "18px", marginBottom: "28px" }}>
                {/* Spine */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "4px", width: "10px", flexShrink: 0 }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0 }}/>
                  {i < entries.length - 1 && (
                    <div style={{ width: "1px", flex: 1, background: color + "1a", minHeight: "28px", marginTop: "6px" }}/>
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, paddingBottom: i < entries.length - 1 ? "0" : "0" }}>
                  <p style={{ ...T.body, color: "#b8b8b8", fontStyle: "italic", margin: "0 0 5px", fontSize: "0.9rem" }}>{entry.belief}</p>
                  <p style={{ ...T.caption, color: C.textDim, margin: "0 0 7px" }}>
                    {new Date(entry.recordedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </p>
                  <p style={{ ...T.caption, color: C.textGhost, fontStyle: "italic", margin: 0 }}>
                    "{entry.sourceObservation?.slice(0, 88)}{entry.sourceObservation?.length > 88 ? "..." : ""}"
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

// ── Main App ───────────────────────────────────────────────────────────────
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

  // ── Auth ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get("token");
    if (token) { saveToken(token); window.history.replaceState({}, "", "/"); }
    if (!getToken()) { setAuthChecked(true); return; }
    authFetch(`${API}/api/auth/me`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setUser(data); setAuthChecked(true); })
      .catch(() => setAuthChecked(true));
  }, []);

  // ── Data ───────────────────────────────────────────────────────────────
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

  // ── Observe ────────────────────────────────────────────────────────────
  const handleObserve = async () => {
    if (!obsText.trim() || submitting) return;
    setSubmitting(true); setError(null); setLastResult(null);
    try {
      const res = await authFetch(`${API}/api/observe`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: obsText,
      });
      if (res.ok) {
        const data = await res.json();
        setLastResult(data);
        setTotalObs(data.totalObservations);
        setObsText("");
        setTimeout(loadData, 2000);
      } else {
        setError("Failed to file observation.");
      }
    } catch { setError("Connection error."); }
    setSubmitting(false);
  };

  // ── Generate ───────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true); setError(null);
    try {
      const res = await authFetch(`${API}/api/discoveries/generate`, { method: "POST" });
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

  // ── Loading / Unauthed ─────────────────────────────────────────────────
  if (!authChecked) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spinner size={20}/>
    </div>
  );
  if (!user) return <LoginScreen/>;

  // ── Nav items ──────────────────────────────────────────────────────────
  const [greetWord, greetSub] = greet();
  const navItems = [
    { key: "discovery", label: "Discoveries", count: discoveries.length },
    { key: "observe",   label: "Observe" },
    { key: "evidence",  label: "Evidence",    count: totalObs },
    { key: "evolution", label: "Evolution",   count: evolutions.length },
  ];

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Georgia', serif" }}>

      {/* Global styles */}
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes nt-spin { to { transform: rotate(360deg); } }
        @keyframes nt-up   { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar       { width: 3px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 2px; }
        textarea { caret-color: ${C.accent}; }
        textarea:focus { outline: none !important; border-color: #1e3e1e !important; }
        button   { cursor: pointer; }
        button:focus { outline: none; }
        a { cursor: pointer; }
      `}</style>

      {/* ── Navigation ──────────────────────────────────────────────── */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(7,7,7,0.96)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", height: "50px", gap: "32px" }}>

          {/* Brand */}
          <span style={{ ...T.label, color: C.accent, fontSize: "0.65rem", flexShrink: 0 }}>nowthink</span>

          {/* Nav tabs */}
          <nav style={{ display: "flex", gap: "0", flex: 1 }}>
            {navItems.map(item => {
              const active = view === item.key;
              return (
                <button key={item.key} onClick={() => setView(item.key)}
                  style={{ background: "none", border: "none", padding: "0 14px", height: "50px", display: "flex", alignItems: "center", gap: "7px", color: active ? C.text : C.textDim, fontSize: "0.8rem", fontFamily: "system-ui", letterSpacing: "-0.01em", borderBottom: `2px solid ${active ? C.accent : "transparent"}`, transition: "color 0.15s, border-color 0.15s", position: "relative", top: "1px" }}>
                  {item.label}
                  {item.count > 0 && (
                    <span style={{ ...T.label, background: active ? C.accentDim + "33" : "#111", color: active ? C.accent : C.textDim, padding: "2px 6px", borderRadius: "3px", fontSize: "0.55rem" }}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            {user?.picture
              ? <img src={user.picture} alt="" style={{ width: "24px", height: "24px", borderRadius: "50%", opacity: 0.8 }}/>
              : <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", ...T.label, color: C.accent, fontSize: "0.6rem" }}>{user?.name?.[0]}</div>
            }
            <button onClick={handleLogout}
              style={{ ...T.caption, background: "none", border: "none", color: C.textGhost, fontSize: "0.72rem", transition: "color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.color = C.textDim}
              onMouseLeave={e => e.currentTarget.style.color = C.textGhost}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────────────── */}
      <main style={{ maxWidth: "960px", margin: "0 auto", padding: "56px 32px 80px" }}>

        {/* Error banner */}
        {error && (
          <div style={{ background: "#140808", border: "1px solid #2e1010", borderRadius: "6px", padding: "12px 16px", marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "center", animation: "nt-up 0.2s ease" }}>
            <span style={{ ...T.caption, color: "#9e4a4a" }}>{error}</span>
            <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "#3a3a3a", fontSize: "1rem", lineHeight: 1, padding: "0 0 0 16px" }}>×</button>
          </div>
        )}

        {/* ══ DISCOVERIES ══════════════════════════════════════════════ */}
        {view === "discovery" && (
          <div style={{ animation: "nt-up 0.3s ease" }}>

            {/* Page header */}
            <div style={{ marginBottom: "44px" }}>
              <h1 style={{ ...T.h1, color: C.text, marginBottom: "8px" }}>Discoveries</h1>
              <p style={{ ...T.caption, color: C.textDim }}>
                Evidence-based patterns the system has found in your observations
              </p>
            </div>

            {/* Investigation panel */}
            <div style={{ background: "#0b140b", border: "1px solid #132013", borderRadius: "8px", padding: "24px 28px", marginBottom: "32px" }}>
              <p style={{ ...T.label, color: C.accentDim, marginBottom: "10px", fontSize: "0.58rem" }}>
                {totalObs < 3
                  ? `${3 - totalObs} more observation${3 - totalObs !== 1 ? "s" : ""} needed`
                  : "✓ investigation ready"}
              </p>
              <p style={{ ...T.body, color: C.textDim, marginBottom: totalObs >= 3 ? "22px" : "0", fontSize: "0.875rem" }}>
                {totalObs < 3
                  ? "The system requires at least 3 observations before it can open a case."
                  : "Enough evidence has been gathered. The system is ready to present its findings."}
              </p>
              {totalObs >= 3 && (
                <button onClick={handleGenerate} disabled={generating}
                  style={{ background: generating ? "transparent" : "#0e260e", border: `1px solid ${generating ? "#1a2a1a" : "#1e3e1e"}`, color: generating ? C.accentDim : C.accent, padding: "10px 20px", borderRadius: "6px", fontSize: "0.82rem", fontFamily: "system-ui", display: "inline-flex", alignItems: "center", gap: "10px", transition: "all 0.2s", letterSpacing: "-0.01em" }}
                  onMouseEnter={e => { if (!generating) e.currentTarget.style.borderColor = "#2a4a2a"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = generating ? "#1a2a1a" : "#1e3e1e"; }}>
                  {generating
                    ? <><Spinner size={14}/><span style={{ animation: "none" }}>Investigating patterns...</span></>
                    : "Open investigation →"
                  }
                </button>
              )}
            </div>

            {/* Case list */}
            {loading && !discoveries.length
              ? <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}><Spinner/></div>
              : !discoveries.length
                ? (
                  <div style={{ padding: "80px 0", textAlign: "center" }}>
                    <p style={{ ...T.body, color: C.textDim, fontStyle: "italic", marginBottom: "8px" }}>No cases opened yet.</p>
                    <p style={{ ...T.caption, color: C.textGhost }}>File at least 3 observations and open your first investigation.</p>
                  </div>
                )
                : discoveries.map(d => <CaseCard key={d.id} d={d} onClick={setSelectedCase}/>)
            }
          </div>
        )}

        {/* ══ OBSERVE ══════════════════════════════════════════════════ */}
        {view === "observe" && (
          <div style={{ animation: "nt-up 0.3s ease", maxWidth: "660px" }}>

            {/* Page header */}
            <div style={{ marginBottom: "44px" }}>
              <h1 style={{ ...T.h1, color: C.text, marginBottom: "8px" }}>{greetWord}</h1>
              <p style={{ ...T.caption, color: C.textDim }}>{greetSub}</p>
            </div>

            {/* Instruction */}
            <p style={{ ...T.caption, color: C.textGhost, fontStyle: "italic", marginBottom: "22px", lineHeight: 1.8 }}>
              Not "how was your day." What did you actually notice? Something recurring, surprising, or that you have been quietly avoiding.
            </p>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={obsText}
              onChange={e => setObsText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleObserve(); } }}
              placeholder="Write freely. The system will extract what matters."
              style={{ width: "100%", minHeight: "160px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", color: C.text, padding: "18px 20px", fontSize: "0.95rem", resize: "none", fontFamily: "'Georgia', serif", lineHeight: 1.75, transition: "border-color 0.2s", display: "block" }}
            />

            {/* Controls */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px", flexWrap: "wrap", gap: "12px" }}>
              <span style={{ ...T.caption, color: C.textGhost, fontSize: "0.68rem" }}>Enter to file · Shift+Enter for new line</span>
              <button onClick={handleObserve} disabled={submitting || !obsText.trim()}
                style={{ background: !obsText.trim() ? "transparent" : submitting ? "transparent" : "#0e260e", border: `1px solid ${!obsText.trim() ? "#111" : submitting ? "#1a2a1a" : "#1e3e1e"}`, color: !obsText.trim() ? C.textGhost : submitting ? C.accentDim : C.accent, padding: "10px 18px", borderRadius: "6px", fontSize: "0.8rem", fontFamily: "system-ui", display: "inline-flex", alignItems: "center", gap: "8px", transition: "all 0.2s", letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
                {submitting ? <><Spinner size={13}/>Filing observation...</> : "File observation →"}
              </button>
            </div>

            {/* Success state */}
            {lastResult && (
              <div style={{ marginTop: "28px", background: "#09120a", border: "1px solid #0f1e0f", borderRadius: "8px", padding: "18px 20px", animation: "nt-up 0.3s ease" }}>
                <p style={{ ...T.label, color: C.accentDim, marginBottom: "10px", fontSize: "0.58rem" }}>Observation filed</p>
                <p style={{ ...T.body, color: "#7aba7a", fontStyle: "italic", marginBottom: "10px", fontSize: "0.9rem" }}>{lastResult.theme}</p>
                <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                  <span style={{ ...T.caption, color: C.accentDim }}>Energy {lastResult.energyScore}/10</span>
                  <span style={{ color: "#1a2a1a" }}>·</span>
                  <span style={{ ...T.caption, color: C.accentDim }}>{lastResult.totalObservations} total</span>
                  {lastResult.readyForDiscovery && (
                    <>
                      <span style={{ color: "#1a2a1a" }}>·</span>
                      <span style={{ ...T.caption, color: C.accent }}>Ready for investigation</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ EVIDENCE ══════════════════════════════════════════════════ */}
        {view === "evidence" && (
          <div style={{ animation: "nt-up 0.3s ease" }}>

            {/* Page header */}
            <div style={{ marginBottom: "44px" }}>
              <h1 style={{ ...T.h1, color: C.text, marginBottom: "8px" }}>Evidence</h1>
              <p style={{ ...T.caption, color: C.textDim }}>
                {totalObs} observation{totalObs !== 1 ? "s" : ""} on record
              </p>
            </div>

            {loading && !observations.length
              ? <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}><Spinner/></div>
              : !observations.length
                ? (
                  <div style={{ padding: "80px 0", textAlign: "center" }}>
                    <p style={{ ...T.body, color: C.textDim, fontStyle: "italic", marginBottom: "8px" }}>No observations yet.</p>
                    <p style={{ ...T.caption, color: C.textGhost }}>Go to Observe to file your first one.</p>
                  </div>
                )
                : observations.map(obs => (
                  <article key={obs.id}
                    style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "18px 22px", marginBottom: "8px", transition: "border-color 0.15s", animation: "nt-up 0.25s ease" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = C.borderHov}
                    onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>

                    {/* Observation header */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
                      <span style={{ ...T.label, color: "#1e2e1e", fontSize: "0.56rem" }}>OBS #{obs.id}</span>
                      {obs.extractedTheme && obs.extractedTheme !== "Unnamed observation" && (
                        <span style={{ ...T.caption, color: "#3a5a3a", fontStyle: "italic", fontSize: "0.7rem" }}>{obs.extractedTheme}</span>
                      )}
                      {/* Energy micro-bar */}
                      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "3px" }}>
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div key={i} style={{ width: "3px", height: "12px", borderRadius: "1.5px", background: i < obs.energyScore ? confColor(obs.energyScore * 10) : "#141414" }}/>
                        ))}
                        <span style={{ ...T.caption, color: C.textGhost, marginLeft: "7px", fontSize: "0.65rem" }}>{obs.energyScore}/10</span>
                      </div>
                    </div>

                    <p style={{ ...T.body, color: C.textMid, marginBottom: "10px", fontSize: "0.875rem" }}>{obs.rawText}</p>
                    <p style={{ ...T.caption, color: C.textGhost, fontSize: "0.65rem" }}>
                      {new Date(obs.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </article>
                ))
            }
          </div>
        )}

        {/* ══ EVOLUTION ═════════════════════════════════════════════════ */}
        {view === "evolution" && (
          <div style={{ animation: "nt-up 0.3s ease" }}>

            {/* Page header */}
            <div style={{ marginBottom: "44px" }}>
              <h1 style={{ ...T.h1, color: C.text, marginBottom: "8px" }}>Thought Evolution</h1>
              <p style={{ ...T.caption, color: C.textDim }}>How your beliefs shift over time</p>
            </div>

            {loading && !evolutions.length
              ? <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}><Spinner/></div>
              : <EvolutionView evolutions={evolutions}/>
            }
          </div>
        )}

      </main>

      {/* ── Case modal ────────────────────────────────────────────────── */}
      <CaseModal d={selectedCase} onClose={() => setSelectedCase(null)}/>
    </div>
  );
}