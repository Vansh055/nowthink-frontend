import { useState, useEffect, useRef } from "react";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return "Still awake. What's on your mind?";
  if (hour < 12) return "Good morning. How did yesterday end?";
  if (hour < 17) return "Afternoon. What's the day been like?";
  if (hour < 21) return "Evening. What happened today?";
  return "The day is winding down. What's worth remembering?";
}

function App() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [patternLoading, setPatternLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [pattern, setPattern] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, streamingText]);

  const handleCheckIn = async () => {
    if (!message.trim() || loading) return;
    const userMessage = message;
    setMessage("");
    setLoading(true);
    setIsStreaming(true);
    setStreamingText("");

    try {
      const response = await fetch("http://localhost:9090/api/checkin/stream", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: userMessage,
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data:")) {
            const text = line.slice(5);
            if (text && text !== "[DONE]") {
              fullText += text;
              setStreamingText(fullText);
            }
          }
        }
      }

      setHistory(prev => [...prev, { you: userMessage, nowthink: fullText }]);
      setStreamingText("");
    } catch (err) {
      setHistory(prev => [...prev, { you: userMessage, nowthink: "Something went wrong. Is the backend running?" }]);
    }

    setIsStreaming(false);
    setLoading(false);
  };

  const handlePatterns = async () => {
    setPatternLoading(true);
    setPattern("");
    try {
      const res = await fetch("http://localhost:9090/api/checkin/patterns");
      const data = await res.text();
      setPattern(data);
    } catch (err) {
      setPattern("Something went wrong.");
    }
    setPatternLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Nowthink</h1>
        <p style={styles.subtitle}>see the patterns in yourself you never knew were there</p>
        <p style={styles.greeting}>{getGreeting()}</p>
      </div>

      <div style={styles.historyBox}>
        {history.length === 0 && !isStreaming && (
          <p style={styles.placeholder}>This is your space. No judgment. Just reflection.</p>
        )}

        {history.map((entry, i) => (
          <div key={i} style={styles.entry}>
            <p style={styles.you}>{entry.you}</p>
            <p style={styles.nowthink}>{entry.nowthink}</p>
          </div>
        ))}

        {isStreaming && (
          <div style={styles.entry}>
            <p style={styles.nowthink}>
              {streamingText}
              <span style={styles.cursor}>|</span>
            </p>
          </div>
        )}

        {pattern && (
          <div style={styles.patternBox}>
            <p style={styles.patternLabel}>pattern detected</p>
            <p style={styles.patternText}>{pattern}</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div style={styles.inputRow}>
        <textarea
          style={styles.textarea}
          placeholder="Tell Nowthink about your day..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleCheckIn();
            }
          }}
        />
        <button style={styles.button} onClick={handleCheckIn} disabled={loading}>
          {loading ? "..." : "→"}
        </button>
      </div>

      <button style={styles.patternButton} onClick={handlePatterns} disabled={patternLoading}>
        {patternLoading ? "looking for patterns..." : "what patterns do you see in me?"}
      </button>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#0f0f0f",
    color: "#f0f0f0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px 20px",
    fontFamily: "'Georgia', serif",
  },
  header: { textAlign: "center", marginBottom: "40px" },
  title: { fontSize: "2.5rem", fontWeight: "normal", letterSpacing: "0.1em", margin: 0 },
  subtitle: { color: "#888", fontSize: "0.9rem", marginTop: "8px" },
  greeting: { color: "#555", fontSize: "0.85rem", marginTop: "16px", fontStyle: "italic" },
  historyBox: {
    width: "100%",
    maxWidth: "640px",
    flex: 1,
    marginBottom: "24px",
    minHeight: "300px",
  },
  placeholder: { color: "#333", textAlign: "center", marginTop: "80px", fontStyle: "italic" },
  entry: { marginBottom: "32px" },
  you: { color: "#ccc", marginBottom: "8px", lineHeight: "1.6" },
  nowthink: {
    color: "#a8c5a0",
    fontStyle: "italic",
    lineHeight: "1.7",
    paddingLeft: "16px",
    borderLeft: "2px solid #2a4a2a",
  },
  cursor: {
    display: "inline-block",
    animation: "blink 1s infinite",
    color: "#4a7a4a",
    marginLeft: "2px",
  },
  patternBox: {
    backgroundColor: "#111",
    border: "1px solid #2a4a2a",
    borderRadius: "12px",
    padding: "20px",
    marginTop: "32px",
  },
  patternLabel: {
    color: "#4a7a4a",
    fontSize: "0.75rem",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    marginBottom: "12px",
  },
  patternText: {
    color: "#c8e6c8",
    lineHeight: "1.8",
    fontStyle: "italic",
  },
  inputRow: {
    display: "flex",
    width: "100%",
    maxWidth: "640px",
    gap: "12px",
    alignItems: "flex-end",
  },
  textarea: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "8px",
    color: "#f0f0f0",
    padding: "12px",
    fontSize: "1rem",
    resize: "none",
    minHeight: "60px",
    fontFamily: "inherit",
    outline: "none",
  },
  button: {
    backgroundColor: "#2a4a2a",
    color: "#a8c5a0",
    border: "none",
    borderRadius: "8px",
    padding: "12px 20px",
    fontSize: "1.4rem",
    cursor: "pointer",
    height: "60px",
  },
  patternButton: {
    marginTop: "16px",
    backgroundColor: "transparent",
    border: "1px solid #2a4a2a",
    borderRadius: "8px",
    color: "#4a7a4a",
    padding: "10px 24px",
    fontSize: "0.85rem",
    cursor: "pointer",
    fontFamily: "'Georgia', serif",
    letterSpacing: "0.05em",
  },
};

export default App;