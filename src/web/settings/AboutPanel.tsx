import { useState, useEffect } from "react";

export function AboutPanel() {
  const [version, setVersion] = useState<string>("…");

  useEffect(() => {
    fetch("/health")
      .then((res) => res.json())
      .then((data: { version: string }) => setVersion(data.version))
      .catch(() => setVersion("unknown"));
  }, []);

  const mutedStyle: React.CSSProperties = {
    color: "rgba(255,255,255,0.5)",
    fontFamily: "monospace",
    fontSize: 13,
  };

  return (
    <div>
      <h2 style={{ color: "#ccc", fontFamily: "monospace", marginTop: 0 }}>ghovas</h2>
      <p style={mutedStyle}>Version: {version}</p>
      <ul style={{ ...mutedStyle, paddingLeft: 16, margin: 0 }}>
        <li>
          <a
            href="https://github.com/conao3/bun-ghovas"
            target="_blank"
            rel="noreferrer"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            GitHub
          </a>
        </li>
        <li>
          <a
            href="https://github.com/conao3/idea/blob/master/projects/bun-ghovas.md"
            target="_blank"
            rel="noreferrer"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Concept
          </a>
        </li>
        <li>
          <a
            href="https://github.com/conao3/idea/blob/master/projects/bun-ghovas-design.md"
            target="_blank"
            rel="noreferrer"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Design
          </a>
        </li>
      </ul>
    </div>
  );
}
