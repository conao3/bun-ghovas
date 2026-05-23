import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";

export function AboutPanel() {
  const [version, setVersion] = useState<string>("…");

  useEffect(() => {
    fetch("/health")
      .then((res) => res.json())
      .then((data: { version: string }) => setVersion(data.version))
      .catch(() => setVersion("unknown"));
  }, []);

  return (
    <div>
      <h2 className="text-text-muted-light font-mono mt-0">ghovas</h2>
      <p className="text-white/50 font-mono text-[13px]">Version: {version}</p>
      <ul className="text-white/50 font-mono text-[13px] pl-4 m-0">
        <li>
          <a
            href="https://github.com/conao3/bun-ghovas"
            target="_blank"
            rel="noreferrer"
            className="text-white/50 inline-flex items-center gap-1"
          >
            GitHub <ExternalLink size={11} aria-hidden />
          </a>
        </li>
        <li>
          <a
            href="https://github.com/conao3/idea/blob/master/projects/bun-ghovas.md"
            target="_blank"
            rel="noreferrer"
            className="text-white/50 inline-flex items-center gap-1"
          >
            Concept <ExternalLink size={11} aria-hidden />
          </a>
        </li>
        <li>
          <a
            href="https://github.com/conao3/idea/blob/master/projects/bun-ghovas-design.md"
            target="_blank"
            rel="noreferrer"
            className="text-white/50 inline-flex items-center gap-1"
          >
            Design <ExternalLink size={11} aria-hidden />
          </a>
        </li>
      </ul>
    </div>
  );
}
