import React from "react";

export default function Landing() {
  const isMobile = window.innerWidth <= 768;

  return (
    <div
      style={{
        background: "#060606",
        color: "#F5F5F5",
        minHeight: "100vh",
        fontFamily: "'Georgia', serif",
      }}
    >
      {/* NAVBAR */}

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(18px)",
          background: "rgba(6,6,6,.88)",
          borderBottom: "1px solid #101010",
        }}
      >
        <div
          style={{
            maxWidth: 1250,
            margin: "0 auto",
            padding: isMobile ? "16px 22px" : "18px 40px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              color: "#67b26f",
              letterSpacing: ".35em",
              fontFamily: "system-ui",
              fontSize: ".72rem",
              fontWeight: 700,
            }}
          >
            NOWTHINK
          </span>

          {isMobile ? (
            <span
              style={{
                fontSize: "1.8rem",
                cursor: "pointer",
              }}
            >
              ☰
            </span>
          ) : (
            <div
              style={{
                display: "flex",
                gap: 40,
                alignItems: "center",
                fontFamily: "system-ui",
                fontSize: ".88rem",
                color: "#9b9b9b",
              }}
            >
              <span>How it Works</span>
              <span>Investigation</span>

              <button
                style={{
                  background: "#103010",
                  border: "1px solid #295229",
                  color: "#7ed987",
                  padding: "10px 18px",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Start →
              </button>
            </div>
          )}
        </div>
      </header>

      {/* HERO */}

      <section
        style={{
          maxWidth: 1250,
          margin: "0 auto",
          padding: isMobile ? "70px 24px" : "100px 40px",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1.05fr .95fr",
          alignItems: "center",
          gap: 60,
        }}
      >
        {/* Left */}

        <div>
          <p
            style={{
              color: "#67b26f",
              fontSize: ".72rem",
              letterSpacing: ".3em",
              fontFamily: "system-ui",
              marginBottom: 28,
            }}
          >
            AI INVESTIGATION SYSTEM
          </p>

          <h1
            style={{
              fontWeight: 400,
              fontSize: "clamp(3rem,6vw,5.8rem)",
              lineHeight: 1,
              marginBottom: 28,
            }}
          >
            You already know
            <br />
            what happened.
          </h1>

          <h2
            style={{
              fontWeight: 400,
              color: "#bdbdbd",
              fontSize: "clamp(1.4rem,3vw,2.1rem)",
              lineHeight: 1.5,
              marginBottom: 40,
            }}
          >
            Now discover
            <br />
            why it keeps happening.
          </h2>

          <button
            style={{
              background: "#103010",
              color: "#7ed987",
              border: "1px solid #295229",
              borderRadius: 10,
              padding: "16px 26px",
              cursor: "pointer",
              fontFamily: "system-ui",
              fontSize: ".95rem",
            }}
          >
            Start Investigation →
          </button>

          <p
            style={{
              marginTop: 30,
              color: "#707070",
              fontFamily: "system-ui",
              lineHeight: 1.8,
            }}
          >
            No prompts.
            <br />
            No templates.
            <br />
            Just your thoughts.
          </p>
        </div>

        {/* Right */}

        <div
          style={{
            background: "#0b0b0b",
            border: "1px solid #151515",
            borderRadius: 20,
            minHeight: isMobile ? 300 : 540,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "#444",
            fontFamily: "system-ui",
          }}
        >
          Dashboard Screenshot
        </div>
      </section>
    </div>
  );
}