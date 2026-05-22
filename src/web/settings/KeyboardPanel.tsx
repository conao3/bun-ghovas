import { SHORTCUTS, formatShortcut } from "../lib/shortcuts";

export function KeyboardPanel() {
  return (
    <div>
      <h2 className="text-text-muted-light font-mono mt-0">Keyboard</h2>
      <table className="w-full border-collapse font-mono text-[13px]">
        <tbody>
          {SHORTCUTS.map((def) => (
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
