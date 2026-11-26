import type { ArtKind } from "@/lib/data";

type R = { x: number; y: number; w: number; h: number; o?: number; r?: number; s?: boolean };
const Box = ({ x, y, w, h, o = 0.14, r = 4, s }: R) =>
  s ? (
    <rect x={x} y={y} width={w} height={h} rx={r} fill="none" stroke="currentColor" strokeOpacity={0.35} />
  ) : (
    <rect x={x} y={y} width={w} height={h} rx={r} fill="currentColor" fillOpacity={o} />
  );

function Landing() {
  return (
    <g>
      <Box x={40} y={62} w={34} h={10} o={0.9} />
      {[420, 470, 520].map((x) => <Box key={x} x={x} y={64} w={32} h={6} o={0.35} />)}
      <Box x={566} y={56} w={46} h={20} o={0.9} r={10} />
      <Box x={48} y={130} w={300} h={24} o={0.9} />
      <Box x={48} y={164} w={240} h={24} o={0.9} />
      <Box x={48} y={206} w={270} h={8} o={0.3} />
      <Box x={48} y={222} w={210} h={8} o={0.3} />
      <Box x={48} y={252} w={96} h={30} o={0.95} r={15} />
      <Box x={156} y={252} w={96} h={30} s r={15} />
      <g className="art-spin" style={{ transformOrigin: "490px 205px" }}>
        <circle cx="490" cy="205" r="92" fill="none" stroke="currentColor" strokeOpacity=".4" strokeDasharray="3 7" />
        <circle cx="490" cy="113" r="6" fill="currentColor" />
      </g>
      <circle cx="490" cy="205" r="60" fill="none" stroke="currentColor" strokeOpacity=".5" />
      <circle cx="490" cy="205" r="34" fill="currentColor" fillOpacity=".16" />
      {[48, 244, 440].map((x) => <Box key={x} x={x} y={318} w={168} h={58} s />)}
    </g>
  );
}

function Dashboard() {
  return (
    <g>
      <Box x={0} y={36} w={104} h={364} o={0.07} r={0} />
      <Box x={18} y={58} w={36} h={10} o={0.9} />
      {[92, 120, 148, 176, 204].map((y, i) => <Box key={y} x={18} y={y} w={i === 0 ? 68 : 56} h={10} o={i === 0 ? 0.7 : 0.25} />)}
      <Box x={128} y={58} w={150} h={12} o={0.9} />
      <Box x={540} y={54} w={72} h={20} s r={10} />
      {[128, 264, 400, 536].map((x, i) => (
        <g key={x}>
          <Box x={x} y={96} w={116} h={64} s />
          <Box x={x + 12} y={110} w={42} h={6} o={0.3} />
          <Box x={x + 12} y={126} w={[70, 58, 82, 50][i]} h={16} o={0.85} />
        </g>
      ))}
      <Box x={128} y={178} w={348} h={198} s />
      <path className="art-draw" d="M144 340 L196 300 L240 318 L292 250 L340 272 L390 214 L440 232 L462 200" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {[160, 204, 248, 292, 336, 380, 424].map((x, i) => <Box key={x} x={x} y={364 - [14, 20, 12, 26, 18, 30, 22][i]} w={14} h={[14, 20, 12, 26, 18, 30, 22][i]} o={0.18} r={2} />)}
      <Box x={490} y={178} w={122} h={198} s />
      <circle cx="551" cy="250" r="38" fill="none" stroke="currentColor" strokeOpacity=".2" strokeWidth="14" />
      <circle className="art-ring" cx="551" cy="250" r="38" fill="none" stroke="currentColor" strokeWidth="14" strokeDasharray="130 240" transform="rotate(-90 551 250)" />
      {[316, 336, 356].map((y) => <Box key={y} x={506} y={y} w={90} h={6} o={0.3} />)}
    </g>
  );
}

function Kanban() {
  const cols = [
    { x: 40, n: 3 },
    { x: 232, n: 2 },
    { x: 424, n: 4 },
  ];
  return (
    <g>
      <Box x={40} y={58} w={120} h={14} o={0.9} />
      <Box x={540} y={54} w={72} h={22} o={0.9} r={11} />
      {cols.map((c, ci) => (
        <g key={c.x}>
          <Box x={c.x} y={96} w={176} h={282} o={0.06} r={10} />
          <Box x={c.x + 14} y={110} w={64} h={8} o={0.6} />
          {Array.from({ length: c.n }, (_, i) => (
            <g key={i} className={ci === 1 && i === 0 ? "art-float" : undefined}>
              <Box x={c.x + 12} y={134 + i * 60} w={152} h={50} s r={8} />
              <Box x={c.x + 22} y={146 + i * 60} w={[96, 72, 110, 84][(i + ci) % 4]} h={7} o={0.7} />
              <Box x={c.x + 22} y={162 + i * 60} w={[60, 80, 50, 70][(i + ci) % 4]} h={6} o={0.25} />
            </g>
          ))}
        </g>
      ))}
    </g>
  );
}

function Shop() {
  return (
    <g>
      <Box x={40} y={60} w={50} h={10} o={0.9} />
      {[300, 350, 400].map((x) => <Box key={x} x={x} y={62} w={34} h={6} o={0.3} />)}
      <circle cx="590" cy="65" r="9" fill="none" stroke="currentColor" strokeOpacity=".6" />
      {[40, 190, 340, 490].map((x, i) => (
        <g key={x} className={i === 1 ? "art-float" : undefined}>
          <Box x={x} y={106} w={140} h={190} s r={8} />
          <path d={`M${x + 8} ${288} L${x + 132} ${114}`} stroke="currentColor" strokeOpacity=".18" />
          <circle cx={x + 70} cy={186} r={[26, 34, 22, 30][i]} fill="currentColor" fillOpacity=".14" />
          <Box x={x} y={312} w={[90, 110, 80, 100][i]} h={8} o={0.8} />
          <Box x={x} y={330} w={44} h={7} o={0.3} />
          <Box x={x + 92} y={326} w={48} h={20} o={0.9} r={10} />
        </g>
      ))}
    </g>
  );
}

function Mobile() {
  const phone = (x: number, y: number, k: number) => (
    <g key={x} className={k === 1 ? "art-float" : undefined}>
      <rect x={x} y={y} width={150} height={316} rx={22} fill="none" stroke="currentColor" strokeOpacity=".5" strokeWidth="1.5" />
      <Box x={x + 55} y={y + 10} w={40} h={6} o={0.4} r={3} />
      <Box x={x + 16} y={y + 36} w={80} h={10} o={0.9} />
      <circle cx={x + 75} cy={y + 110} r={k === 1 ? 42 : 34} fill="none" stroke="currentColor" strokeOpacity=".2" strokeWidth="10" />
      <circle cx={x + 75} cy={y + 110} r={k === 1 ? 42 : 34} fill="none" stroke="currentColor" strokeWidth="10" strokeDasharray={k === 1 ? "170 270" : "110 220"} transform={`rotate(-90 ${x + 75} ${y + 110})`} />
      {[176, 212, 248].map((dy) => (
        <g key={dy}>
          <Box x={x + 16} y={y + dy} w={118} h={26} s r={8} />
          <Box x={x + 26} y={y + dy + 10} w={54} h={6} o={0.5} />
        </g>
      ))}
      <Box x={x + 16} y={y + 284} w={118} h={20} o={0.9} r={10} />
    </g>
  );
  return (
    <g>
      {phone(96, 56, 0)}
      {phone(260, 40, 1)}
      {phone(424, 66, 2)}
    </g>
  );
}

function Blog() {
  return (
    <g>
      <Box x={40} y={60} w={60} h={10} o={0.9} />
      <Box x={520} y={62} w={72} h={6} o={0.3} />
      <Box x={40} y={104} w={44} h={14} s r={7} />
      <Box x={40} y={134} w={360} h={26} o={0.9} />
      <Box x={40} y={170} w={290} h={26} o={0.9} />
      <Box x={40} y={214} w={360} h={140} s r={8} />
      <path d="M48 346 L150 270 L220 316 L290 250 L392 346" fill="none" stroke="currentColor" strokeOpacity=".3" />
      <circle cx="330" cy="248" r="14" fill="currentColor" fillOpacity=".18" />
      {[104, 124, 144, 164, 184].map((y, i) => <Box key={y} x={436} y={y} w={[160, 140, 156, 120, 150][i]} h={7} o={0.28} />)}
      <Box x={436} y={214} w={176} h={140} o={0.07} r={8} />
      <Box x={450} y={230} w={90} h={9} o={0.8} />
      {[254, 272, 290, 308].map((y, i) => <Box key={y} x={450} y={y} w={[140, 120, 132, 100][i]} h={6} o={0.28} />)}
    </g>
  );
}

const MAP: Record<ArtKind, () => React.ReactElement> = { landing: Landing, dashboard: Dashboard, kanban: Kanban, shop: Shop, mobile: Mobile, blog: Blog };

/** Monochrome wireframe "screenshot" generated in SVG, used until real project images are added. */
export default function Art({ kind, className = "", chrome = true }: { kind: ArtKind; className?: string; chrome?: boolean }) {
  const Body = MAP[kind];
  return (
    <div className={`art ${className}`}>
      <svg viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <rect width="640" height="400" fill="var(--bg)" />
        {chrome && (
          <g>
            <rect width="640" height="36" fill="currentColor" fillOpacity=".06" />
            {[18, 34, 50].map((x) => <circle key={x} cx={x} cy="18" r="4" fill="currentColor" fillOpacity=".35" />)}
            <rect x="200" y="9" width="240" height="18" rx="9" fill="currentColor" fillOpacity=".08" />
          </g>
        )}
        <Body />
        <rect className="art-scan" x="-120" y="0" width="90" height="400" fill="currentColor" fillOpacity=".07" transform="skewX(-18)" />
      </svg>
    </div>
  );
}
