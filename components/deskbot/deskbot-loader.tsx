import React from "react";

/**
 * Animated pixel-art DeskBot avatar (headset bot + ticket speech bubble), for use as a loading spinner.
 * Pure SVG + CSS: no images, crisp at any size, honours prefers-reduced-motion.
 *
 *   <DeskBotLoader className="h-16 w-16" />
 *   <DeskBotLoader className="h-10 w-10" ring={false} label="Fetching tickets" />
 */

const CREAM = "#f5f1e4";
const LIME = "#a6e391";
const DARK = "#24332a";
const BACKDROP = "#2b3a2f";

type Palette = Record<string, string>;
const PALETTE: Palette = { W: CREAM, G: LIME, D: DARK };

/** Turns a bitmap (one string per row, "." = empty) into <rect>s, merging horizontal runs of one colour. */
function Pixels({ rows, x = 0, y = 0, palette = PALETTE }: { rows: string[]; x?: number; y?: number; palette?: Palette }) {
  const rects: React.ReactElement[] = [];
  rows.forEach((row, r) => {
    let c = 0;
    while (c < row.length) {
      const ch = row[c];
      let end = c;
      while (end + 1 < row.length && row[end + 1] === ch) end++;
      if (palette[ch]) {
        rects.push(<rect key={`${r}-${c}`} x={x + c} y={y + r} width={end - c + 1} height={1} fill={palette[ch]} />);
      }
      c = end + 1;
    }
  });
  return <>{rects}</>;
}

// Bot is drawn on a 40 x 31 grid, then centred in a 56 x 56 viewBox.
const HEAD = [
  "......WWWWWWWWWW......",
  "....WWDDDDDDDDDDWW....",
  "...WDDDDDDDDDDDDDDW...",
  "..WDDDDDDDDDDDDDDDDW..",
  "..WDDWWWWWWWWWWWWDDW..",
  ".WDDWDDDDDDDDDDDDWDDW.",
  ".WDWDDDDDDDDDDDDDDWDW.",
  ".WDWDDDDDDDDDDDDDDWDW.",
  ".WDWDDDDDDDDDDDDDDWDW.",
  ".WDWDDDDDDDDDDDDDDWDW.",
  ".WDWDDDDDDDDDDDDDDWDW.",
  ".WDDWDDDDDDDDDDDDWDDW.",
  "..WDDWWWWWWWWWWWWDDW..",
  "..WDDDDDDDDDDDDDDDDW..",
  "...WWDDDDDDDDDDDDWW...",
  ".....WWWWWWWWWWWW.....",
];
const EYES_OPEN = [
  ".GGG....GGG.",
  "G...G..G...G",
  "G...G..G...G",
];
const EYES_SHUT = ["GGGGG..GGGGG"];
const EAR_CUP = ["WWWWW", "WGGGW", "WGGGW", "WGGGW", "WGGGW", "WGGGW", "WGGGW", "WGGGW", "WWWWW"];
const EAR_RIGHT = [".G", "GG", "GG", "GG", ".G"].map((r) => r.split("").reverse().join(""));
const MIC = [
  "W................",
  "W................",
  "W................",
  ".W.........GGGGG.",
  "..WWWWWWWWWGGGGG.",
  "...........GGGGG.",
];
const BUBBLE = [
  ".WWWWWWWWWWWW.",
  "WDDDDDDDDDDDDW",
  "WDDGGGGGDGGDDW",
  "WDDGGGGGGGGDDW",
  "WDDDGGGGDGGDDW",
  "WDDGGGGGGGGDDW",
  "WDDGGGGGDGGDDW",
  "WDDDDDDDDDDDDW",
  ".WWDDWWWWWWWW.",
  "..WDW.........",
  ".WW...........",
];
const SPARKLE_BIG = ["..W..", "..W..", "WWWWW", "..W..", "..W.."];
const SPARKLE_SMALL = [".....", "..W..", ".WWW.", "..W..", "....."];

// Ring: 12 pixel blocks around the centre, lit in a chasing sequence.
const RING_COUNT = 12;
const RING = Array.from({ length: RING_COUNT }, (_, i) => {
  const a = (i / RING_COUNT) * Math.PI * 2 - Math.PI / 2;
  return { x: Math.round(28 + Math.cos(a) * 25.5 - 1.5), y: Math.round(28 + Math.sin(a) * 25.5 - 1.5) };
});
const RING_SECONDS = 1.2;

const CSS = `
.dbl-bob    { animation: dbl-bob 1.2s steps(1, end) infinite; }
.dbl-bob2   { animation: dbl-bob 1.2s steps(1, end) -0.6s infinite; }
.dbl-open   { animation: dbl-open 3.6s steps(1, end) infinite; }
.dbl-shut   { animation: dbl-shut 3.6s steps(1, end) infinite; }
.dbl-hole   { animation: dbl-hole 0.9s steps(1, end) infinite; }
.dbl-big    { animation: dbl-open 1.6s steps(1, end) infinite; }
.dbl-small  { animation: dbl-shut 1.6s steps(1, end) infinite; }
.dbl-dot    { animation: dbl-hole 1.6s steps(1, end) infinite; }
.dbl-ring   { animation: dbl-ring ${RING_SECONDS}s steps(4, end) infinite; }
@keyframes dbl-bob  { 0% { transform: translateY(0); } 50% { transform: translateY(-1px); } }
@keyframes dbl-open { 0%, 100% { opacity: 1; } 90% { opacity: 0; } 95% { opacity: 1; } }
@keyframes dbl-shut { 0%, 100% { opacity: 0; } 90% { opacity: 1; } 95% { opacity: 0; } }
@keyframes dbl-hole { 0% { opacity: 1; } 33.33% { opacity: 0; } }
@keyframes dbl-ring { 0% { opacity: 1; } 100% { opacity: 0.12; } }
@media (prefers-reduced-motion: reduce) {
  .dbl-bob, .dbl-bob2, .dbl-open, .dbl-shut, .dbl-hole, .dbl-big, .dbl-small, .dbl-dot, .dbl-ring { animation: none; }
  .dbl-shut, .dbl-small { opacity: 0; }
}
`;

export function DeskBotLoader({
  className = "h-16 w-16",
  label = "Loading",
  ring = true,
  backdrop = true,
}: {
  className?: string;
  /** Screen-reader text. */
  label?: string;
  /** Show the chasing pixel ring around the bot. */
  ring?: boolean;
  /** Dark disc behind the bot, so the cream outline reads on light backgrounds too. */
  backdrop?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 56 56"
      className={className}
      role="status"
      aria-label={label}
      shapeRendering="crispEdges"
      xmlns="http://www.w3.org/2000/svg"
    >
      <style>{CSS}</style>
      {backdrop && <circle cx="28" cy="28" r="28" fill={BACKDROP} shapeRendering="geometricPrecision" />}

      {ring &&
        RING.map((p, i) => (
          <rect
            key={i}
            className="dbl-ring"
            style={{ animationDelay: `${-((RING_COUNT - i) / RING_COUNT) * RING_SECONDS}s` }}
            x={p.x}
            y={p.y}
            width={3}
            height={3}
            fill={LIME}
          />
        ))}

      {/* bot artwork, 40 x 31, centred */}
      <g transform="translate(8 12)">
        {/* sparkle: big plus and small plus alternate, two lime dots blink */}
        <g className="dbl-big"><Pixels rows={SPARKLE_BIG} x={4} y={2} /></g>
        <g className="dbl-small"><Pixels rows={SPARKLE_SMALL} x={4} y={2} /></g>
        <rect className="dbl-dot" x={1} y={8} width={2} height={2} fill={LIME} />
        <rect className="dbl-dot" style={{ animationDelay: "-0.8s" }} x={3} y={11} width={1} height={1} fill={LIME} />

        {/* speech bubble with ticket; the 3 perforation holes light up in turn */}
        <g className="dbl-bob2">
          <Pixels rows={BUBBLE} x={26} y={0} />
          {[2, 4, 6].map((row, i) => (
            <rect
              key={row}
              className="dbl-hole"
              style={{ animationDelay: `${-((3 - i) / 3) * 0.9}s` }}
              x={26 + 8}
              y={row}
              width={1}
              height={1}
              fill={CREAM}
            />
          ))}
        </g>

        {/* head, headset and mic bob together */}
        <g className="dbl-bob">
          <Pixels rows={HEAD} x={9} y={12} />
          <Pixels rows={EAR_CUP} x={5} y={16} />
          <Pixels rows={EAR_RIGHT} x={31} y={18} />
          <Pixels rows={MIC} x={7} y={25} />
          <g className="dbl-open"><Pixels rows={EYES_OPEN} x={14} y={19} /></g>
          <g className="dbl-shut"><Pixels rows={EYES_SHUT} x={14} y={21} /></g>
        </g>
      </g>
    </svg>
  );
}
