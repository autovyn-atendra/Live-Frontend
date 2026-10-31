import { MOS } from "./utils";

const MN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const lab = (idx: number) => `${MN[idx % 12]} ${Math.floor(idx / 12)}`;

// "Sep 2026" (1 cycle) ya "Sep 2026 – Nov 2026" (kai cycles)
export const periodLabel = (startYmd?: string | null, cycles?: number | string | null, freq?: string | null) => {
  if (!startYmd) return "—";
  const [y, m] = String(startYmd).slice(0, 10).split("-").map(Number);
  if (!y || !m) return "—";
  const cyc = Math.max(1, parseInt(String(cycles ?? 1), 10) || 1);
  const months = cyc * (MOS[freq || "monthly"] || 1);
  const a = y * 12 + (m - 1);
  return months <= 1 ? lab(a) : `${lab(a)} – ${lab(a + months - 1)}`;
};