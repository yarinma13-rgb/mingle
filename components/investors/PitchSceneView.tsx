"use client";

import type { PitchScene } from "@/lib/investors/folders";

function Split({ scene }: { scene: PitchScene }) {
  return (
    <div className="inv-split">
      {scene.left ? (
        <div className="inv-panel">
          <h4>{scene.left.title}</h4>
          <ul className="inv-bullets">
            {scene.left.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {scene.right ? (
        <div className="inv-panel">
          <h4>{scene.right.title}</h4>
          <ul className="inv-bullets">
            {scene.right.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function PitchSceneView({ scene }: { scene: PitchScene }) {
  return (
    <div className="inv-scene inv-he" dir="rtl">
      {scene.eyebrow ? <div className="inv-eyebrow">{scene.eyebrow}</div> : null}

      {scene.visual === "quote" ? (
        <>
          <div className="inv-founder-orb">י</div>
          <h2 className="inv-scene-title">{scene.title}</h2>
          {scene.highlight ? (
            <p className="inv-quote-mark" dir="ltr">
              “{scene.highlight}”
            </p>
          ) : null}
          {scene.body ? <p className="inv-scene-body">{scene.body}</p> : null}
        </>
      ) : (
        <>
          <h2 className="inv-scene-title">
            {scene.title}
            {scene.highlight ? (
              <span className="inv-scene-highlight">{scene.highlight}</span>
            ) : null}
          </h2>
          {scene.body ? <p className="inv-scene-body">{scene.body}</p> : null}
        </>
      )}

      {scene.visual === "funnel" ? (
        <>
          <div className="inv-funnel">
            {[
              { w: "100%", label: "CV · Thousands", c: "#ea1e63" },
              { w: "86%", label: "Screening", c: "#e2378d" },
              { w: "70%", label: "Interview", c: "#7b2ff7" },
              { w: "52%", label: "Intuition", c: "#5b5cf0" },
              { w: "34%", label: "Hire · One", c: "#3e6be0" },
            ].map((step) => (
              <div
                key={step.label}
                className="inv-funnel-step"
                style={{ width: step.w, background: step.c }}
              >
                {step.label}
              </div>
            ))}
          </div>
          <Split scene={scene} />
        </>
      ) : null}

      {scene.visual === "two-sides" || scene.visual === "ask-split" ? (
        <Split scene={scene} />
      ) : null}

      {scene.visual === "bullets" && scene.bullets ? (
        <ul className="inv-bullets">
          {scene.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      ) : null}

      {scene.visual === "stats" && scene.stats ? (
        <div className="inv-stats">
          {scene.stats.map((s) => (
            <div className="inv-stat" key={s.label}>
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      ) : null}

      {scene.visual === "chips" && scene.chips ? (
        <div className="inv-chips">
          {scene.chips.map((c) => (
            <span className="inv-chip" key={c}>
              {c}
            </span>
          ))}
        </div>
      ) : null}

      {scene.visual === "pillars" && scene.pillars ? (
        <div className="inv-pillars">
          {scene.pillars.map((p) => (
            <div className="inv-pillar" key={p.title}>
              <strong>{p.title}</strong>
              <span>{p.body}</span>
            </div>
          ))}
        </div>
      ) : null}

      {scene.visual === "match-gauge" ? (
        <div className="inv-gauge-wrap">
          <div className="inv-gauge">
            <div>
              <strong>92%</strong>
              <span>Mutual Match</span>
            </div>
          </div>
          {scene.stats ? (
            <div className="inv-stats" style={{ gridTemplateColumns: "1fr 1fr" }}>
              {scene.stats.map((s) => (
                <div className="inv-stat" key={s.label}>
                  <strong>{s.value}</strong>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {scene.visual === "competitors" && scene.rows ? (
        <div className="inv-table">
          {scene.rows.map((row) => (
            <div
              className={`inv-row${row.highlight ? " inv-row-hi" : ""}`}
              key={row.name}
            >
              <strong>{row.name}</strong>
              <span>{row.category}</span>
              <span>{row.gap}</span>
            </div>
          ))}
        </div>
      ) : null}

      {scene.visual === "pricing" && scene.plans ? (
        <div className="inv-pricing">
          {scene.plans.map((plan) => (
            <article className="inv-plan" key={plan.name}>
              <header>
                <strong>{plan.name}</strong>
                <span className="price">{plan.price}</span>
              </header>
              <p>{plan.jobs}</p>
              <p>
                שנתי {plan.yearly} · {plan.committed}
              </p>
              <p>{plan.includes}</p>
              <p>{plan.benchmark}</p>
            </article>
          ))}
        </div>
      ) : null}

      {scene.visual === "timeline" && scene.milestones ? (
        <div className="inv-timeline">
          {scene.milestones.map((m) => (
            <div className="inv-mile" key={m.when}>
              <b>{m.when}</b>
              <span>{m.what}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
