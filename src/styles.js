export const theme = {
  bg: "#0A0E17",
  surface: "#111827",
  surface2: "#1A2332",
  surface3: "#222D3D",
  border: "#2A3544",
  accent: "#06D6A0",
  accent2: "#118AB2",
  accent3: "#EF476F",
  text: "#F0F4F8",
  textMuted: "#8899AA",
  textDim: "#556677",
  gold: "#FFD166",
  danger: "#EF476F",
  success: "#06D6A0",
  warning: "#FFD166",
};

export const mono = "'JetBrains Mono', monospace";
export const font = "'Outfit', sans-serif";

export const inputStyle = {
  background: theme.surface2,
  border: `1px solid ${theme.border}`,
  borderRadius: 10,
  padding: "10px 12px",
  color: theme.text,
  fontFamily: font,
  fontSize: 13,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

export const btnPrimary = {
  background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
  border: "none",
  borderRadius: 12,
  color: "#fff",
  fontFamily: font,
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  textAlign: "center",
};

export const btnSecondary = {
  background: theme.surface2,
  border: `1px solid ${theme.border}`,
  borderRadius: 12,
  color: theme.text,
  fontFamily: font,
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  textAlign: "center",
};

export const btnSmall = {
  background: theme.surface2,
  border: `1px solid ${theme.border}`,
  borderRadius: 8,
  padding: "5px 10px",
  color: theme.text,
  fontFamily: font,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

export const thStyle = { textAlign: "center", padding: "6px 3px", fontWeight: 500 };
export const tdStyle = { textAlign: "center", padding: "6px 3px" };
