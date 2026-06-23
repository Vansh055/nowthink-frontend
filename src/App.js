import { useState, useEffect } from "react";

const API = "http://localhost:9090";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return "Still awake. What did you notice today?";
  if (hour < 12) return "Morning. What have you observed so far?";
  if (hour < 17) return "Afternoon. Something worth noting?";
  if (hour < 21) return "Evening. What patterns showed up today?";
  return "Late night. What did today reveal?";
}

function confidenceColor(score) {
  if (score >= 75) return "#5a8a5a";
  if (score >= 50) return "#8a7a3a";
  return "#6a4a4a";
}

function statusBadge(status) {
  const colors = {
    Supported: { bg: "#0a1f0a", border: "#2a5a2a", text: "#6abf6a" },
    Investigating: { bg: "#1a1a0a", border: "#5a5a2a", text: "#bfbf6a" },
    Refuted: { bg: "#1f0a0a", border: "#5a2a2a", text: "#bf6a6a" },
    pending: { bg: "#111", border: "#333", text: "#555" },
  };
  const c = colors[status] || colors.pending;
  return (
    <span style={{
      backgroundColor: c.bg,
      border: `1px solid ${c.border}`,
      color: c.text,
      padding: "2px 10px",
      borderRadius: "20px",
      fontSize: "0.7rem",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
    }}>
      {status}
    </span>
  );
}

function DiscoveryCard({ discovery, onClick }) {
  return (
    <div style={styles.discoveryCard} onClick={() => onClick(discovery)}>
      <div style={styles.cardHeader}>
        <span style={styles.caseLabel}>CASE #{discovery.id}</span>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ color: "#555", fontSize: "0.75rem" }}>{discovery.discoveryType}</span>
          {statusBadge(discovery.status)}
        </div>
      </div>
      <p style={styles.cardClaim}>{discovery.claim}</p>
      <div style={styles.confidenceRow}>
        <div style={styles.confidenceBarBg}>
          <div style={{
            ...styles.confidenceBarFill,
            width: `${discovery.confidenceScore}%`,
            backgroundColor: confidenceColor(discovery.confidenceScore),
          }} />
        </div>
        <span style={{ color: "#555", fontSize: "0.75rem", marginLeft: "10px" }}>
          {discovery.confidenceScore}%
        </span>
      </div>
    </div>
  );
}

function CaseModal({ discovery, onClose }) {
  if (!discovery) return null;
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div>
            <span style={styles.caseLabel}>CASE #{discovery.id}</span>
            <div style={{ marginTop: "6px" }}>{statusBadge(discovery.status)}</div>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <p style={styles.modalClaim}>{discovery.claim}</p>

        <div style={styles.confidenceSection}>
          <span style={{ color: "#555", fontSize: "0.75rem", letterSpacing: "0.1em" }}>CONFIDENCE</span>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
            <div style={{ ...styles.confidenceBarBg, flex: 1 }}>
              <div style={{
                ...styles.confidenceBarFill,
                width: `${discovery.confidenceScore}%`,
                backgroundColor: confidenceColor(discovery.confidenceScore),
              }} />
            </div>
            <span style={{ color: "#ccc", fontSize: "1.1rem", fontWeight: "bold" }}>
              {discovery.confidenceScore}%
            </span>
          </div>
        </div>

        {discovery.evidenceFor && (
          <div style={styles.evidenceSection}>
            <p style={{ ...styles.evidenceLabel, color: "#4a8a4a" }}>● EVIDENCE FOR</p>
            <p style={styles.evidenceText}>{discovery.evidenceFor}</p>
          </div>
        )}

        {discovery.evidenceAgainst && (
          <div style={styles.evidenceSection}>
            <p style={{ ...styles.evidenceLabel, color: "#8a4a4a" }}>● EVIDENCE AGAINST</p>
            <p style={styles.evidenceText}>{discovery.evidenceAgainst}</p>
          </div>
        )}

        <div style={styles.discoveryType}>
          <span style={{ color: "#444", fontSize: "0.75rem" }}>Discovery Type: </span>
          <span style={{ color: "#888", fontSize: "0.75rem" }}>{discovery.discoveryType}</span>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [view, setView] = useState("discovery");
  const [observations, setObservations] = useState([]);
  const [discoveries, setDiscoveries] = useState([]);
  const [obsText, setObsText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [totalObs, setTotalObs] = useState(0);

  useEffect(() => {
    fetch(`${API}/api/observe`)
      .then(r => r.json())
      .then(data => {
        setObservations(data);
        setTotalObs(data.length);
      })
      .catch(() => {});

    fetch(`${API}/api/discoveries`)
      .then(r => r.json())
      .then(setDiscoveries)
      .catch(() => {});
  }, []);

  const handleObserve = async () => {
    if (!obsText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/observe`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: obsText,
      });
      const data = await res.json();
      setLastResult(data);
      setTotalObs(data.totalObservations);
      setObsText("");
      const obsRes = await fetch(`${API}/api/observe`);
      setObservations(await obsRes.json());
    } catch (err) {}
    setSubmitting(false);
  };

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const res = await fetch(`${API}/api/discoveries/generate`, { method: "POST" });
      const data = await res.json();
      setDiscoveries(prev => [data, ...prev.filter(d => d.id !== data.id)]);
      setSelectedCase(data);
    } catch (err) {}
    setGenerating(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Nowthink</h1>
        <p style={styles.subtitle}>evidence-based pattern discovery</p>
        <div style={styles.nav}>
          <button
            style={{ ...styles.navBtn, ...(view === "discovery" ? styles.navActive : {}) }}
            onClick={() => setView("discovery")}
          >
            discoveries
          </button>
          <button
            style={{ ...styles.navBtn, ...(view === "observe" ? styles.navActive : {}) }}
            onClick={() => setView("observe")}
          >
            observe
          </button>
          <button
            style={{ ...styles.navBtn, ...(view === "evidence" ? styles.navActive : {}) }}
            onClick={() => setView("evidence")}
          >
            evidence ({totalObs})
          </button>
        </div>
      </div>

      {view === "discovery" && (
        <div style={styles.section}>
          <div style={styles.heroAction}>
            <p style={styles.heroText}>
              {totalObs < 3
                ? `Add ${3 - totalObs} more observation${3 - totalObs !== 1 ? "s" : ""} to unlock your first discovery`
                : "The system has enough evidence to investigate."}
            </p>
            <button
              style={{
                ...styles.generateBtn,
                opacity: totalObs < 3 ? 0.4 : 1,
                cursor: totalObs < 3 ? "not-allowed" : "pointer",
              }}
              onClick={handleGenerate}
              disabled={totalObs < 3 || generating}
            >
              {generating ? "investigating..." : "show me something I don't know"}
            </button>
          </div>

          {discoveries.length === 0 ? (
            <p style={styles.empty}>No discoveries yet. Add observations and generate your first case.</p>
          ) : (
            discoveries.map(d => (
              <DiscoveryCard key={d.id} discovery={d} onClick={setSelectedCase} />
            ))
          )}
        </div>
      )}

      {view === "observe" && (
        <div style={styles.section}>
          <p style={styles.observePrompt}>{getGreeting()}</p>
          <p style={styles.observeHint}>
            Not "how was your day" — what did you actually <em>notice</em>?
          </p>
          <textarea
            style={styles.textarea}
            placeholder="Something surprising. Something recurring. Something you're avoiding..."
            value={obsText}
            onChange={e => setObsText(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleObserve();
              }
            }}
          />
          <button style={styles.submitBtn} onClick={handleObserve} disabled={submitting}>
            {submitting ? "filing observation..." : "file observation →"}
          </button>

          {lastResult && (
            <div style={styles.resultCard}>
              <p style={styles.resultLabel}>observation filed</p>
              <p style={styles.resultTheme}>{lastResult.theme}</p>
              <p style={styles.resultMeta}>
                Energy: {lastResult.energyScore}/10 · Total: {lastResult.totalObservations} observations
                {lastResult.readyForDiscovery && " · Ready for discovery ✓"}
              </p>
            </div>
          )}
        </div>
      )}

      {view === "evidence" && (
        <div style={styles.section}>
          <p style={styles.sectionTitle}>ALL OBSERVATIONS — {observations.length} FILED</p>
          {observations.length === 0 ? (
            <p style={styles.empty}>No observations yet. Start observing.</p>
          ) : (
            observations.map((obs, i) => (
              <div key={obs.id} style={styles.obsCard}>
                <div style={styles.obsHeader}>
                  <span style={styles.obsId}>OBS #{obs.id}</span>
                  <span style={styles.obsTheme}>{obs.extractedTheme}</span>
                  <span style={styles.obsEnergy}>energy: {obs.energyScore}/10</span>
                </div>
                <p style={styles.obsText}>{obs.rawText}</p>
                <p style={styles.obsDate}>
                  {new Date(obs.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit"
                  })}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      <CaseModal discovery={selectedCase} onClose={() => setSelectedCase(null)} />
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#0a0a0a",
    color: "#e0e0e0",
    fontFamily: "'Georgia', serif",
    maxWidth: "700px",
    margin: "0 auto",
    padding: "40px 20px",
  },
  header: { marginBottom: "40px" },
  title: {
    fontSize: "2rem",
    fontWeight: "normal",
    letterSpacing: "0.15em",
    margin: 0,
    color: "#fff",
  },
  subtitle: {
    color: "#444",
    fontSize: "0.8rem",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    marginTop: "6px",
  },
  nav: {
    display: "flex",
    gap: "4px",
    marginTop: "24px",
    borderBottom: "1px solid #1a1a1a",
    paddingBottom: "0",
  },
  navBtn: {
    backgroundColor: "transparent",
    border: "none",
    color: "#444",
    padding: "8px 16px",
    cursor: "pointer",
    fontFamily: "'Georgia', serif",
    fontSize: "0.85rem",
    borderBottom: "2px solid transparent",
    marginBottom: "-1px",
  },
  navActive: {
    color: "#a8c5a0",
    borderBottom: "2px solid #4a7a4a",
  },
  section: { marginTop: "32px" },
  heroAction: {
    backgroundColor: "#0f1a0f",
    border: "1px solid #1a2a1a",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "32px",
    textAlign: "center",
  },
  heroText: {
    color: "#555",
    fontSize: "0.9rem",
    marginBottom: "16px",
    fontStyle: "italic",
  },
  generateBtn: {
    backgroundColor: "#1a3a1a",
    border: "1px solid #2a5a2a",
    color: "#6abf6a",
    padding: "12px 28px",
    borderRadius: "8px",
    fontSize: "0.9rem",
    cursor: "pointer",
    fontFamily: "'Georgia', serif",
    letterSpacing: "0.05em",
    transition: "all 0.2s",
  },
  discoveryCard: {
    backgroundColor: "#0f0f0f",
    border: "1px solid #1a1a1a",
    borderRadius: "10px",
    padding: "20px",
    marginBottom: "16px",
    cursor: "pointer",
    transition: "border-color 0.2s",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  caseLabel: {
    color: "#444",
    fontSize: "0.7rem",
    letterSpacing: "0.2em",
  },
  cardClaim: {
    color: "#ccc",
    lineHeight: "1.6",
    marginBottom: "16px",
    fontSize: "0.95rem",
  },
  confidenceRow: {
    display: "flex",
    alignItems: "center",
  },
  confidenceBarBg: {
    flex: 1,
    height: "3px",
    backgroundColor: "#1a1a1a",
    borderRadius: "2px",
    overflow: "hidden",
  },
  confidenceBarFill: {
    height: "100%",
    borderRadius: "2px",
    transition: "width 0.5s ease",
  },
  modalOverlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: "20px",
  },
  modal: {
    backgroundColor: "#0f0f0f",
    border: "1px solid #222",
    borderRadius: "16px",
    padding: "32px",
    maxWidth: "560px",
    width: "100%",
    maxHeight: "85vh",
    overflowY: "auto",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
  },
  closeBtn: {
    backgroundColor: "transparent",
    border: "none",
    color: "#444",
    fontSize: "1.2rem",
    cursor: "pointer",
  },
  modalClaim: {
    color: "#e0e0e0",
    fontSize: "1.1rem",
    lineHeight: "1.7",
    marginBottom: "24px",
    fontStyle: "italic",
  },
  confidenceSection: { marginBottom: "24px" },
  evidenceSection: { marginBottom: "20px" },
  evidenceLabel: {
    fontSize: "0.7rem",
    letterSpacing: "0.15em",
    marginBottom: "8px",
  },
  evidenceText: {
    color: "#888",
    fontSize: "0.85rem",
    lineHeight: "1.6",
    paddingLeft: "12px",
    borderLeft: "2px solid #222",
    fontStyle: "italic",
  },
  discoveryType: { marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #1a1a1a" },
  observePrompt: {
    color: "#888",
    fontSize: "1rem",
    marginBottom: "8px",
  },
  observeHint: {
    color: "#333",
    fontSize: "0.8rem",
    marginBottom: "20px",
    fontStyle: "italic",
  },
  textarea: {
    width: "100%",
    backgroundColor: "#0f0f0f",
    border: "1px solid #222",
    borderRadius: "8px",
    color: "#e0e0e0",
    padding: "16px",
    fontSize: "0.95rem",
    resize: "none",
    minHeight: "120px",
    fontFamily: "'Georgia', serif",
    outline: "none",
    lineHeight: "1.6",
    boxSizing: "border-box",
  },
  submitBtn: {
    marginTop: "12px",
    backgroundColor: "transparent",
    border: "1px solid #2a4a2a",
    borderRadius: "8px",
    color: "#4a7a4a",
    padding: "10px 20px",
    fontSize: "0.85rem",
    cursor: "pointer",
    fontFamily: "'Georgia', serif",
  },
  resultCard: {
    marginTop: "20px",
    backgroundColor: "#0a1a0a",
    border: "1px solid #1a2a1a",
    borderRadius: "8px",
    padding: "16px",
  },
  resultLabel: {
    color: "#4a7a4a",
    fontSize: "0.7rem",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    marginBottom: "8px",
  },
  resultTheme: {
    color: "#a8c5a0",
    fontSize: "1rem",
    marginBottom: "6px",
    fontStyle: "italic",
  },
  resultMeta: {
    color: "#444",
    fontSize: "0.75rem",
  },
  sectionTitle: {
    color: "#333",
    fontSize: "0.7rem",
    letterSpacing: "0.2em",
    marginBottom: "20px",
  },
  obsCard: {
    backgroundColor: "#0f0f0f",
    border: "1px solid #1a1a1a",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "12px",
  },
  obsHeader: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    marginBottom: "8px",
    flexWrap: "wrap",
  },
  obsId: { color: "#333", fontSize: "0.7rem", letterSpacing: "0.15em" },
  obsTheme: {
    color: "#6a8a6a",
    fontSize: "0.75rem",
    fontStyle: "italic",
  },
  obsEnergy: { color: "#444", fontSize: "0.7rem", marginLeft: "auto" },
  obsText: { color: "#888", fontSize: "0.85rem", lineHeight: "1.6", marginBottom: "8px" },
  obsDate: { color: "#2a2a2a", fontSize: "0.7rem" },
  empty: { color: "#333", fontStyle: "italic", textAlign: "center", marginTop: "60px" },
};

export default App;