import { theme } from '../styles';

export default function Header({ title, onBack }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 0 12px" }}>
      <button onClick={onBack} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", color: theme.text, fontSize: 16, cursor: "pointer" }}>←</button>
      <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{title}</h2>
    </div>
  );
}
