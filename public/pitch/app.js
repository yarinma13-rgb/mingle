const PLAY_SVG = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5L8 5.5z"/></svg>`;
const PAUSE_SVG = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7V5zm6 0h4v14h-4V5z"/></svg>`;

const grid = document.getElementById("folderGrid");
const modal = document.getElementById("modal");
const stage = document.getElementById("stage");
const idle = document.getElementById("idle");
const playBtn = document.getElementById("playBtn");
const idlePlay = document.getElementById("idlePlay");
const progress = document.getElementById("progress");
const timeEl = document.getElementById("time");
const nextBtn = document.getElementById("nextBtn");
const playerTitle = document.getElementById("playerTitle");
const playerTag = document.getElementById("playerTag");

let folders = [];
let openFolder = null;
let playing = false;
let started = false;
let elapsed = 0;
let totalMs = 0;
let raf = null;
let lastTs = null;

function formatTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function folderDuration(folder) {
  return folder.scenes.reduce((sum, s) => sum + s.durationMs, 0);
}

function sceneAt(folder, ms) {
  let acc = 0;
  for (let i = 0; i < folder.scenes.length; i += 1) {
    acc += folder.scenes[i].durationMs;
    if (ms < acc) return folder.scenes[i];
  }
  return folder.scenes[folder.scenes.length - 1];
}

function renderScene(scene) {
  const highlight = scene.highlight
    ? `<span class="scene-highlight">${scene.highlight}</span>`
    : "";
  let body = scene.body ? `<p class="scene-body">${scene.body}</p>` : "";
  let extra = "";

  if (scene.visual === "quote") {
    extra = `
      <div class="founder-orb">Y</div>
      <h2 class="scene-title">${scene.title}</h2>
      ${scene.highlight ? `<p class="quote-mark">“${scene.highlight}”</p>` : ""}
      ${body}
    `;
    body = "";
  } else {
    extra = `<h2 class="scene-title">${scene.title}${highlight}</h2>${body}`;
    body = "";
  }

  if (scene.visual === "funnel") {
    extra += `
      <div class="funnel">
        ${[
          ["100%", "CV · Thousands", "#ea1e63"],
          ["86%", "Screening", "#e2378d"],
          ["70%", "Interview", "#7b2ff7"],
          ["52%", "Intuition", "#5b5cf0"],
          ["34%", "Hire · One", "#3e6be0"],
        ]
          .map(
            ([w, label, c]) =>
              `<div class="funnel-step" style="width:${w};background:${c}">${label}</div>`,
          )
          .join("")}
      </div>
    `;
  }

  if (scene.left || scene.right) {
    extra += `<div class="split">
      ${
        scene.left
          ? `<div class="panel-card"><h4>${scene.left.title}</h4><ul class="bullets">${scene.left.items
              .map((i) => `<li>${i}</li>`)
              .join("")}</ul></div>`
          : ""
      }
      ${
        scene.right
          ? `<div class="panel-card"><h4>${scene.right.title}</h4><ul class="bullets">${scene.right.items
              .map((i) => `<li>${i}</li>`)
              .join("")}</ul></div>`
          : ""
      }
    </div>`;
  }

  if (scene.bullets) {
    extra += `<ul class="bullets">${scene.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>`;
  }

  if (scene.stats && scene.visual !== "match-gauge") {
    extra += `<div class="stats">${scene.stats
      .map((s) => `<div class="stat"><strong>${s.value}</strong><span>${s.label}</span></div>`)
      .join("")}</div>`;
  }

  if (scene.chips) {
    extra += `<div class="chips">${scene.chips.map((c) => `<span class="chip">${c}</span>`).join("")}</div>`;
  }

  if (scene.pillars) {
    extra += `<div class="pillars">${scene.pillars
      .map((p) => `<div class="pillar"><strong>${p.title}</strong><span>${p.body}</span></div>`)
      .join("")}</div>`;
  }

  if (scene.visual === "match-gauge") {
    extra += `<div class="gauge-wrap">
      <div class="gauge"><div><strong>92%</strong><span>Mutual Match</span></div></div>
      <div class="stats" style="grid-template-columns:1fr 1fr">
        ${(scene.stats || [])
          .map((s) => `<div class="stat"><strong>${s.value}</strong><span>${s.label}</span></div>`)
          .join("")}
      </div>
    </div>`;
  }

  if (scene.rows) {
    extra += `<div class="table">${scene.rows
      .map(
        (r) =>
          `<div class="row${r.highlight ? " hi" : ""}"><strong>${r.name}</strong><span>${r.category}</span><span>${r.gap}</span></div>`,
      )
      .join("")}</div>`;
  }

  if (scene.plans) {
    extra += `<div class="pricing">${scene.plans
      .map(
        (p) => `<article class="plan">
          <header><strong>${p.name}</strong><span class="price">${p.price}</span></header>
          <p>${p.jobs}</p>
          <p>Yearly ${p.yearly} · ${p.committed}</p>
          <p>${p.includes}</p>
          <p>${p.benchmark}</p>
        </article>`,
      )
      .join("")}</div>`;
  }

  if (scene.milestones) {
    extra += `<div class="timeline">${scene.milestones
      .map((m) => `<div class="mile"><b>${m.when}</b><span>${m.what}</span></div>`)
      .join("")}</div>`;
  }

  return `<div class="scene">
    ${scene.eyebrow ? `<div class="eyebrow">${scene.eyebrow}</div>` : ""}
    ${extra}
  </div>`;
}

function paint() {
  if (!openFolder) return;
  const scene = sceneAt(openFolder, elapsed);
  const html = renderScene(scene);
  if (stage.dataset.sceneId !== scene.id) {
    stage.dataset.sceneId = scene.id;
    stage.innerHTML = html;
  }
  progress.max = String(totalMs);
  progress.value = String(elapsed);
  timeEl.textContent = `${formatTime(elapsed)} / ${formatTime(totalMs)}`;
  playBtn.innerHTML = playing ? PAUSE_SVG : PLAY_SVG;
  playBtn.setAttribute("aria-label", playing ? "Pause" : "Play");
}

function stopRaf() {
  if (raf != null) cancelAnimationFrame(raf);
  raf = null;
  lastTs = null;
}

function tick(ts) {
  if (lastTs == null) lastTs = ts;
  const delta = ts - lastTs;
  lastTs = ts;
  elapsed = Math.min(totalMs, elapsed + delta);
  if (elapsed >= totalMs) {
    playing = false;
    stopRaf();
  } else {
    raf = requestAnimationFrame(tick);
  }
  paint();
}

function setPlaying(next) {
  playing = next;
  if (playing) {
    stopRaf();
    raf = requestAnimationFrame(tick);
  } else {
    stopRaf();
  }
  paint();
}

function openDemo(id) {
  openFolder = folders.find((f) => f.id === id) || null;
  if (!openFolder) return;
  totalMs = folderDuration(openFolder);
  elapsed = 0;
  started = false;
  playing = false;
  stopRaf();
  stage.dataset.sceneId = "";
  idle.classList.remove("hidden");
  playerTitle.textContent = `${openFolder.order}. ${openFolder.label}`;
  playerTag.textContent = openFolder.tagline;
  const next = folders.find((f) => f.order === openFolder.order + 1);
  nextBtn.disabled = !next;
  nextBtn.textContent = next ? `Next: ${next.label} →` : "End of deck";
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  paint();
}

function closeDemo() {
  setPlaying(false);
  openFolder = null;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function renderFolders() {
  grid.innerHTML = folders
    .map(
      (f) => `<button class="folder accent-${f.accent}" type="button" data-id="${f.id}">
        <span class="folder-tab" aria-hidden="true"></span>
        <span class="folder-body">
          ${f.preview ? `<span class="folder-preview" style="background-image:url('${f.preview}')" aria-hidden="true"></span>` : ""}
          <span class="folder-num">${String(f.order).padStart(2, "0")}</span>
          <span class="folder-label">${f.label}</span>
          <span class="folder-tag">${f.tagline}</span>
          <span class="folder-meta">
            <span>${f.durationLabel}</span>
            <span class="play-badge" aria-hidden="true">${PLAY_SVG}</span>
          </span>
        </span>
      </button>`,
    )
    .join("");
}

grid.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-id]");
  if (btn) openDemo(btn.dataset.id);
});

document.getElementById("startBtn").addEventListener("click", () => openDemo("founder"));
document.querySelector(".backdrop").addEventListener("click", closeDemo);
document.querySelector(".close").addEventListener("click", closeDemo);

function startPlay() {
  started = true;
  idle.classList.add("hidden");
  if (elapsed >= totalMs) elapsed = 0;
  setPlaying(true);
}

idlePlay.addEventListener("click", startPlay);
playBtn.addEventListener("click", () => {
  if (!started) {
    startPlay();
    return;
  }
  if (elapsed >= totalMs) {
    elapsed = 0;
    setPlaying(true);
    return;
  }
  setPlaying(!playing);
});

progress.addEventListener("input", (e) => {
  elapsed = Number(e.target.value);
  if (!started) {
    started = true;
    idle.classList.add("hidden");
  }
  paint();
});

nextBtn.addEventListener("click", () => {
  if (!openFolder) return;
  const next = folders.find((f) => f.order === openFolder.order + 1);
  if (next) openDemo(next.id);
});

window.addEventListener("keydown", (e) => {
  if (!modal.classList.contains("open")) return;
  if (e.key === "Escape") closeDemo();
  if (e.key === " ") {
    e.preventDefault();
    playBtn.click();
  }
});

const res = await fetch("/pitch/folders.json");
folders = await res.json();
renderFolders();
