import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";

function humanizeMs(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function AboutPanel() {
  const [version, setVersion] = useState<string>("…");
  const [uptime, setUptime] = useState<string>("…");

  useEffect(() => {
    fetch("/health")
      .then((res) => res.json())
      .then((data: { version: string; uptimeMs: number }) => {
        setVersion(data.version);
        setUptime(humanizeMs(data.uptimeMs));
      })
      .catch(() => {
        setVersion("unknown");
        setUptime("unknown");
      });
  }, []);

  return (
    <div>
      <h2 className="text-text-muted-light font-mono mt-0">ghovas</h2>
      <p className="text-white/50 font-mono text-[13px]">Version: {version}</p>
      <p className="text-white/50 font-mono text-[13px]">Uptime: {uptime}</p>
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
