import { SHORTCUTS, formatShortcut } from "../lib/shortcuts";

export function KeyboardPanel() {
  return (
    <div>
      <h2 style={{ color: "#ccc", fontFamily: "monospace", marginTop: 0 }}>Keyboard</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "monospace", fontSize: 13 }}>
        <tbody>
          {SHORTCUTS.map((def) => (
            <tr key={def.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <td style={{ color: "rgba(255,255,255,0.8)", padding: "6px 0" }}>{def.label}</td>
              <td style={{ color: "#ccc", textAlign: "right", padding: "6px 0", letterSpacing: "0.05em" }}>{formatShortcut(def)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
