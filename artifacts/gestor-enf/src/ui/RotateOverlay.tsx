import { useEffect, useState } from "react";

export function RotateOverlay() {
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth;
      const mobile = window.innerWidth < 1024 || window.innerHeight < 600;
      setIsPortrait(portrait);
      setIsMobile(mobile);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    if (orientation?.lock) {
      orientation.lock("landscape").catch(() => {});
    }

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  if (!isMobile || !isPortrait) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "linear-gradient(135deg, #0a0a0f 0%, #0d1b2a 50%, #0a1628 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "2rem",
        padding: "2rem",
      }}
    >
      <div style={{ animation: "rotate-pulse 2s ease-in-out infinite" }}>
        <svg
          width="96"
          height="96"
          viewBox="0 0 96 96"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="24"
            y="8"
            width="48"
            height="80"
            rx="8"
            fill="#0e2233"
            stroke="#1abc9c"
            strokeWidth="3"
          />
          <rect x="33" y="16" width="30" height="52" rx="3" fill="#1abc9c" fillOpacity="0.15" />
          <circle cx="48" cy="76" r="4" fill="#1abc9c" />
          <path
            d="M70 44 L82 44 M82 44 L76 38 M82 44 L76 50"
            stroke="#f39c12"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M48 28 L52 24 L56 28"
            stroke="#1abc9c"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M52 24 L52 38"
            stroke="#1abc9c"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div style={{ textAlign: "center", maxWidth: "280px" }}>
        <p
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "10px",
            color: "#1abc9c",
            lineHeight: "1.8",
            marginBottom: "1rem",
            letterSpacing: "0.05em",
          }}
        >
          GIRE O DISPOSITIVO
        </p>
        <p
          style={{
            fontFamily: "VT323, monospace",
            fontSize: "22px",
            color: "#a0c4b8",
            lineHeight: "1.5",
          }}
        >
          Para jogar Gestor ENF, coloque seu celular na{" "}
          <span style={{ color: "#f39c12" }}>horizontal</span>.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "8px",
          alignItems: "center",
          marginTop: "0.5rem",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#1abc9c",
              opacity: 0.3,
              animation: `dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes rotate-pulse {
          0%, 100% { transform: rotate(0deg) scale(1); }
          30% { transform: rotate(-15deg) scale(1.05); }
          60% { transform: rotate(15deg) scale(1.05); }
          80% { transform: rotate(-5deg) scale(1); }
        }
        @keyframes dot-bounce {
          0%, 80%, 100% { opacity: 0.3; transform: scale(1); }
          40% { opacity: 1; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}
