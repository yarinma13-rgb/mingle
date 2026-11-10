"use client";

import { useId } from "react";
import { useLandingLocale } from "@/components/landing/LandingLocale";

/**
 * Hero illustration: three glass layers in isometric view — real people on top,
 * the mingle match core in the middle, the three fits (Role / Human / Motivation)
 * underneath — wired together by animated beams. Pure SVG + CSS, no JS animation;
 * respects prefers-reduced-motion. All words come from the existing landing copy.
 */

const W = 250; // half width of a layer (rhombus)
const H = 145; // half height
const T = 14; // layer thickness
const TOP = { x: 320, y: 175 };
const MID = { x: 320, y: 375 };
const BOT = { x: 320, y: 575 };

type Layer = { x: number; y: number };

/** Plane coordinates (p, q in 0..1 from the top corner) -> screen. */
function iso(layer: Layer, p: number, q: number): [number, number] {
  return [layer.x + (p - q) * W, layer.y - H + (p + q) * H];
}

function rhombus(layer: Layer, inset = 0): string {
  const { x, y } = layer;
  const w = W - inset * 1.7;
  const h = H - inset;
  return `M ${x} ${y - h} L ${x + w} ${y} L ${x} ${y + h} L ${x - w} ${y} Z`;
}

const PEOPLE = [
  { id: "sofia", p: 0.2, q: 0.42, ring: "#EA1E63" },
  { id: "arjun", p: 0.5, q: 0.14, ring: "#7B2FF7" },
  { id: "dana", p: 0.82, q: 0.3, ring: "#3E6BE0" },
  { id: "kofi", p: 0.34, q: 0.78, ring: "#7B2FF7" },
  { id: "lin", p: 0.72, q: 0.72, ring: "#EA1E63" },
  { id: "maya", p: 0.5, q: 0.46, ring: "#3E6BE0", hub: true },
] as const;

const LINKS: [string, string][] = [
  ["sofia", "maya"],
  ["arjun", "maya"],
  ["dana", "maya"],
  ["kofi", "maya"],
  ["lin", "maya"],
  ["sofia", "kofi"],
  ["arjun", "dana"],
];

const SLABS = [
  { key: "role", color: "#EA1E63", p0: 0.05, p1: 0.33 },
  { key: "human", color: "#7B2FF7", p0: 0.36, p1: 0.64 },
  { key: "motivation", color: "#3E6BE0", p0: 0.67, p1: 0.95 },
] as const;

export function LandingMingleScene() {
  const { t } = useLandingLocale();
  const uid = useId().replace(/:/g, "");

  const pos = Object.fromEntries(PEOPLE.map((person) => [person.id, iso(TOP, person.p, person.q)]));
  const slabCenters = SLABS.map((slab) => iso(BOT, (slab.p0 + slab.p1) / 2, 0.5));
  const coreXY = iso(MID, 0.5, 0.5);
  const labels = { role: t.scores.role, human: t.scores.human, motivation: t.scores.motivation };

  const layerFace = (layer: Layer, gradId: string) => (
    <g>
      {/* thickness */}
      <path d={rhombus({ x: layer.x, y: layer.y + T })} fill="#d6c8f6" stroke="#d6c8f6" strokeWidth="14" strokeLinejoin="round" />
      <path
        d={`M ${layer.x - W} ${layer.y} L ${layer.x} ${layer.y + H} L ${layer.x} ${layer.y + H + T} L ${layer.x - W} ${layer.y + T} Z`}
        fill="#cdbdf2"
      />
      <path
        d={`M ${layer.x + W} ${layer.y} L ${layer.x} ${layer.y + H} L ${layer.x} ${layer.y + H + T} L ${layer.x + W} ${layer.y + T} Z`}
        fill="#bcaaee"
      />
      {/* top face */}
      <path d={rhombus(layer)} fill={`url(#${gradId})`} stroke={`url(#${gradId})`} strokeWidth="14" strokeLinejoin="round" />
      <path d={rhombus(layer, 10)} fill="none" stroke="rgba(123,47,247,0.22)" strokeWidth="1.2" strokeDasharray="3 5" />
    </g>
  );

  return (
    <div className="mingle-scene" aria-hidden="true">
      <div className="mingle-scene-glow" />
      <svg viewBox="0 0 640 770" role="presentation" focusable="false" className="mingle-scene-svg">
        <defs>
          <linearGradient id={`${uid}-face`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#efe6ff" />
          </linearGradient>
          <linearGradient id={`${uid}-beam`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#EA1E63" />
            <stop offset="0.5" stopColor="#7B2FF7" />
            <stop offset="1" stopColor="#3E6BE0" />
          </linearGradient>
          <linearGradient id={`${uid}-link`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#EA1E63" />
            <stop offset="1" stopColor="#3E6BE0" />
          </linearGradient>
          <radialGradient id={`${uid}-core`}>
            <stop offset="0" stopColor="#7B2FF7" stopOpacity="0.55" />
            <stop offset="1" stopColor="#7B2FF7" stopOpacity="0" />
          </radialGradient>
          <filter id={`${uid}-shadow`} x="-30%" y="-30%" width="160%" height="170%">
            <feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#4d2bd1" floodOpacity="0.2" />
          </filter>
          {PEOPLE.map((person) => (
            <clipPath key={person.id} id={`${uid}-clip-${person.id}`}>
              <circle cx="0" cy="0" r="25" />
            </clipPath>
          ))}
        </defs>

        {/* ground shadow */}
        <ellipse cx="320" cy="735" rx="230" ry="26" fill="rgba(77,43,209,0.12)" />

        {/* bottom layer: the three fits */}
        <g filter={`url(#${uid}-shadow)`}>{layerFace(BOT, `${uid}-face`)}</g>
        {SLABS.map((slab, index) => {
          const h = 12;
          const a = iso(BOT, slab.p0, 0.24);
          const b = iso(BOT, slab.p1, 0.24);
          const c = iso(BOT, slab.p1, 0.76);
          const d = iso(BOT, slab.p0, 0.76);
          const up = (pt: [number, number]) => `${pt[0]},${pt[1] - h}`;
          const [cx, cy] = slabCenters[index];
          return (
            <g key={slab.key}>
              <polygon points={`${d[0]},${d[1]} ${c[0]},${c[1]} ${c[0]},${c[1] - h} ${d[0]},${d[1] - h}`} fill={slab.color} opacity="0.78" />
              <polygon points={`${c[0]},${c[1]} ${b[0]},${b[1]} ${b[0]},${b[1] - h} ${c[0]},${c[1] - h}`} fill={slab.color} opacity="0.55" />
              <polygon points={`${up(a)} ${up(b)} ${up(c)} ${up(d)}`} fill={slab.color} stroke={slab.color} strokeWidth="6" strokeLinejoin="round" />
              <polygon points={`${up(a)} ${up(b)} ${up(c)} ${up(d)}`} fill="rgba(255,255,255,0.14)" />
              <text
                transform={`translate(${cx} ${cy - h}) matrix(0.865 0.502 -0.865 0.502 0 0)`}
                textAnchor="middle"
                dominantBaseline="middle"
                className="mingle-scene-flat"
              >
                {labels[slab.key]}
              </text>
            </g>
          );
        })}

        {/* beams: middle -> bottom (one per fit) */}
        {SLABS.map((slab, index) => {
          const [mx, my] = iso(MID, (slab.p0 + slab.p1) / 2, 0.5);
          const [bx, by] = iso(BOT, (slab.p0 + slab.p1) / 2, 0.24);
          return (
            <g key={`beam-b-${slab.key}`}>
              <line x1={mx} y1={my} x2={bx} y2={by - 12} stroke="rgba(123,47,247,0.2)" strokeWidth="2" />
              <line
                x1={mx}
                y1={my}
                x2={bx}
                y2={by - 12}
                stroke={slab.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="4 16"
                className="mingle-flow"
                style={{ animationDelay: `${index * -0.5}s` }}
              />
              <circle cx={bx} cy={by - 12} r="5" fill="#fff" stroke={slab.color} strokeWidth="2.5" />
            </g>
          );
        })}

        {/* middle layer: the match core */}
        <g filter={`url(#${uid}-shadow)`}>{layerFace(MID, `${uid}-face`)}</g>
        <ellipse cx={coreXY[0]} cy={coreXY[1]} rx="150" ry="86" fill={`url(#${uid}-core)`} className="mingle-core-glow" />
        <ellipse cx={coreXY[0]} cy={coreXY[1]} rx="64" ry="37" fill="none" stroke="#7B2FF7" strokeWidth="1.5" className="mingle-ring" />
        <ellipse cx={coreXY[0]} cy={coreXY[1]} rx="64" ry="37" fill="none" stroke="#EA1E63" strokeWidth="1.5" className="mingle-ring mingle-ring-b" />
        <g className="mingle-bob" style={{ transformOrigin: `${coreXY[0]}px ${coreXY[1]}px` }}>
          <rect x={coreXY[0] - 38} y={coreXY[1] - 74} width="76" height="76" rx="22" fill="#fff" stroke="rgba(123,47,247,0.25)" strokeWidth="1.5" />
          <image href="/brand/mingle-mark.png" x={coreXY[0] - 26} y={coreXY[1] - 62} width="52" height="52" preserveAspectRatio="xMidYMid meet" />
        </g>

        {/* beams: top -> middle (each person) */}
        {PEOPLE.map((person, index) => {
          const [x, y] = pos[person.id];
          const [mx, my] = iso(MID, person.p, person.q);
          return (
            <g key={`beam-t-${person.id}`}>
              <line x1={x} y1={y} x2={mx} y2={my} stroke="rgba(123,47,247,0.18)" strokeWidth="2" />
              <line
                x1={x}
                y1={y}
                x2={mx}
                y2={my}
                stroke={`url(#${uid}-beam)`}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="4 16"
                className="mingle-flow"
                style={{ animationDelay: `${index * -0.35}s` }}
              />
              <circle cx={mx} cy={my} r="4.5" fill="#fff" stroke="#7B2FF7" strokeWidth="2" />
            </g>
          );
        })}

        {/* top layer: people */}
        <g filter={`url(#${uid}-shadow)`}>{layerFace(TOP, `${uid}-face`)}</g>

        {LINKS.map(([from, to], index) => {
          const [x1, y1] = pos[from];
          const [x2, y2] = pos[to];
          return (
            <line
              key={`${from}-${to}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={`url(#${uid}-link)`}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="2 9"
              className="mingle-link"
              style={{ animationDelay: `${index * -0.6}s` }}
            />
          );
        })}

        {PEOPLE.map((person, index) => {
          const [x, y] = pos[person.id];
          return (
            <g key={person.id} transform={`translate(${x} ${y})`}>
              <ellipse cx="0" cy="2" rx="17" ry="9" fill="rgba(77,43,209,0.22)" />
              <g className="mingle-bob" style={{ animationDelay: `${index * -0.7}s` }}>
                <g transform="translate(0 -38)">
                  {"hub" in person ? <circle r="35" fill="none" stroke={person.ring} strokeWidth="2" className="mingle-pair-ring" /> : null}
                  <circle r="29" fill="#fff" stroke={person.ring} strokeWidth="3" />
                  <image
                    href={`/landing/avatars/avatar-${person.id}.webp`}
                    x="-25"
                    y="-25"
                    width="50"
                    height="50"
                    preserveAspectRatio="xMidYMid slice"
                    clipPath={`url(#${uid}-clip-${person.id})`}
                  />
                </g>
              </g>
            </g>
          );
        })}

        {/* floating chips */}
        <g className="mingle-bob" style={{ animationDelay: "-1.2s" }}>
          <rect x="452" y="64" width="152" height="82" rx="16" fill="#fff" stroke="rgba(123,47,247,0.2)" filter={`url(#${uid}-shadow)`} />
          <text x="468" y="90" className="mingle-chip-title">
            {t.whyMatch.title}
          </text>
          {(
            [
              ["#EA1E63", 0.92, labels.role],
              ["#7B2FF7", 0.8, labels.human],
              ["#3E6BE0", 0.86, labels.motivation],
            ] as const
          ).map(([color, value, label], i) => (
            <g key={label}>
              <rect x="468" y={102 + i * 14} width="120" height="5" rx="2.5" fill="rgba(123,47,247,0.12)" />
              <rect x="468" y={102 + i * 14} width={120 * value} height="5" rx="2.5" fill={color} />
              <title>{label}</title>
            </g>
          ))}
        </g>
        <g className="mingle-bob" style={{ animationDelay: "-2.4s" }}>
          <rect x="10" y="250" width="196" height="40" rx="20" fill="#fff" stroke="rgba(234,30,99,0.25)" filter={`url(#${uid}-shadow)`} />
          <circle cx="38" cy="270" r="7" fill="#EA1E63" className="mingle-pair-ring" />
          <text x="54" y="274" className="mingle-chip-text">
            {t.moment.unlocked}
          </text>
        </g>
        <g className="mingle-bob" style={{ animationDelay: "-3.1s" }}>
          <rect x="452" y="338" width="152" height="40" rx="20" fill="#7B2FF7" filter={`url(#${uid}-shadow)`} />
          <text x="528" y="363" textAnchor="middle" className="mingle-chip-score">
            {t.scores.cardBadge}
          </text>
        </g>
      </svg>
    </div>
  );
}
