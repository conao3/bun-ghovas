import { useState } from "react";
import { Keyboard, Search } from "lucide-react";
import { SHORTCUTS, formatShortcut } from "../lib/shortcuts";
import type { ShortcutDef } from "../lib/shortcuts";
import { TextField } from "../components/TextField";
import { PanelHeader } from "./PanelHeader";

function matchesQuery(def: ShortcutDef, query: string): boolean {
  const q = query.toLowerCase();
  return def.label.toLowerCase().includes(q) || formatShortcut(def).toLowerCase().includes(q);
}

export function KeyboardPanel() {
  const [query, setQuery] = useState<string>("");
  const filtered = SHORTCUTS.filter((def) => matchesQuery(def, query));

  return (
    <div>
      <PanelHeader icon={Keyboard} title="Keyboard" />
      <div className="flex items-center gap-2 mb-3">
        <Search size={14} className="text-white/40 shrink-0" />
        <TextField label="Search" value={query} onChange={setQuery} />
      </div>
      <table className="w-full border-collapse font-mono text-[13px]">
        <tbody>
          {filtered.map((def) => (
            <tr key={def.id} className="border-b border-white/10">
              <td className="text-white/80 py-[6px] px-0">{def.label}</td>
              <td className="text-text-muted-light text-right py-[6px] px-0 tracking-[0.05em]">
                {formatShortcut(def)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
