/* ---------------------------------------------------------
   Graph data — classic 8-vertex DAG (CLRS Fig. 22.7 style)
--------------------------------------------------------- */
const NODES = ["5", "7", "3", "11", "8", "10", "2", "9"];
const ADJ = {
  "5": ["11"],
  "7": ["11", "8"],
  "3": ["8", "10"],
  "11": ["2", "9", "10"],
  "8": ["9"],
  "10": [],
  "2": [],
  "9": [],
};
const POS = {
  "5": { x: 120, y: 70 },
  "7": { x: 120, y: 220 },
  "3": { x: 120, y: 370 },
  "11": { x: 430, y: 70 },
  "8": { x: 430, y: 220 },
  "10": { x: 430, y: 370 },
  "2": { x: 700, y: 70 },
  "9": { x: 700, y: 220 },
};
const EDGES = [];
NODES.forEach((u) => ADJ[u].forEach((v) => EDGES.push([u, v])));

/* ---------------------------------------------------------
   DFS-based trace
--------------------------------------------------------- */
function buildDfsTrace() {
  const color = {};
  NODES.forEach((n) => (color[n] = "white"));
  const callStack = [];
  const finishOrder = [];
  const snaps = [];

  function snap(activeNode, activeEdge, line, message) {
    snaps.push({
      colors: { ...color },
      callStack: [...callStack],
      finishOrder: [...finishOrder],
      activeNode,
      activeEdge,
      line,
      message,
    });
  }

  function visit(u) {
    color[u] = "gray";
    callStack.push(u);
    snap(u, null, "gray", `Visit ${u}: mark GRAY (discovered), push on recursion stack.`);
    for (const v of ADJ[u]) {
      snap(u, [u, v], "check", `Examine edge ${u} \u2192 ${v}.`);
      if (color[v] === "white") {
        snap(u, [u, v], "recurse", `${v} is WHITE \u2192 recurse into DFS-Visit(${v}).`);
        visit(v);
      } else {
        snap(u, [u, v], "skip", `${v} is ${color[v].toUpperCase()} \u2192 skip, no recursion.`);
      }
    }
    color[u] = "black";
    callStack.pop();
    finishOrder.push(u);
    snap(u, null, "black", `Finish ${u}: mark BLACK, push ${u} onto output list L.`);
  }

  snap(null, null, "start", "Initialize all vertices WHITE. L = empty list.");
  for (const u of NODES) {
    if (color[u] === "white") {
      snap(null, null, "outer", `Outer loop: ${u} is WHITE \u2192 call DFS-Visit(${u}).`);
      visit(u);
    }
  }
  const topo = [...finishOrder].reverse();
  snaps.push({
    colors: { ...color },
    callStack: [],
    finishOrder: [...finishOrder],
    activeNode: null,
    activeEdge: null,
    line: "done",
    message: `Done. Reverse L \u2192 topological order: ${topo.join(" \u2192 ")}.`,
    topo,
  });
  return snaps;
}

/* ---------------------------------------------------------
   Source-removal (Kahn) trace
--------------------------------------------------------- */
function buildKahnTrace() {
  const indeg = {};
  NODES.forEach((n) => (indeg[n] = 0));
  EDGES.forEach(([, v]) => indeg[v]++);
  const queue = [];
  const order = [];
  const snaps = [];

  function snap(activeNode, activeEdge, message) {
    snaps.push({
      indeg: { ...indeg },
      queue: [...queue],
      order: [...order],
      activeNode,
      activeEdge,
      message,
    });
  }

  snap(null, null, "Compute in-degree(v) for every vertex by scanning all edges.");
  for (const n of NODES) {
    if (indeg[n] === 0) {
      queue.push(n);
      snap(n, null, `in-degree(${n}) = 0 \u2192 enqueue ${n}.`);
    }
  }
  while (queue.length) {
    const u = queue.shift();
    order.push(u);
    snap(u, null, `Dequeue ${u} \u2192 append to topological order L.`);
    for (const v of ADJ[u]) {
      indeg[v]--;
      snap(u, [u, v], `Remove edge ${u} \u2192 ${v}; in-degree(${v}) = ${indeg[v]}.`);
      if (indeg[v] === 0) {
        queue.push(v);
        snap(v, null, `in-degree(${v}) = 0 \u2192 enqueue ${v}.`);
      }
    }
  }
  const ok = order.length === NODES.length;
  snaps.push({
    indeg: { ...indeg },
    queue: [],
    order: [...order],
    activeNode: null,
    activeEdge: null,
    message: ok
      ? `Queue empty. |L| = ${order.length} = |V| \u2192 topological order: ${order.join(" \u2192 ")}.`
      : `Queue empty but |L| < |V| \u2192 graph has a cycle (not a DAG).`,
    topo: order,
  });
  return snaps;
}

/* ---------------------------------------------------------
   Pseudocode blocks
--------------------------------------------------------- */
const DFS_CODE = [
  ["start", 0, "for each u in V: u.color = WHITE"],
  ["start", 0, "L = empty list"],
  ["outer", 0, "for each u in V:"],
  ["outer", 1, "if u.color == WHITE: DFS-Visit(u)"],
  ["done", 0, "return reverse(L)"],
  ["__blank", 0, ""],
  ["gray", 0, "DFS-Visit(u):"],
  ["gray", 1, "u.color = GRAY"],
  ["check", 1, "for each v in Adj[u]:"],
  ["recurse", 2, "if v.color == WHITE: DFS-Visit(v)"],
  ["black", 1, "u.color = BLACK"],
  ["black", 1, "L.push(u)   // finish time"],
];

const KAHN_CODE = [
  ["init", 0, "compute in-degree(v) for all v in V"],
  ["enqueue", 0, "Q = { v : in-degree(v) == 0 }"],
  ["init2", 0, "L = empty list"],
  ["dequeue", 0, "while Q not empty:"],
  ["dequeue", 1, "u = Q.dequeue()"],
  ["dequeue", 1, "L.append(u)"],
  ["decrement", 1, "for each v in Adj[u]:"],
  ["decrement", 2, "in-degree(v) -= 1"],
  ["enqueue2", 2, "if in-degree(v) == 0: Q.enqueue(v)"],
  ["done", 0, "return L   // valid iff |L| == |V|"],
];

/* ---------------------------------------------------------
   State
--------------------------------------------------------- */
let currentAlgo = "dfs";
let dfsSnaps = buildDfsTrace();
let kahnSnaps = buildKahnTrace();
let idx = 0;
let playing = false;
let playTimer = null;

const el = (sel) => document.querySelector(sel);
const svgNS = "http://www.w3.org/2000/svg";

/* ---------------------------------------------------------
   Build static SVG graph shell (nodes + edges), then recolor per step
--------------------------------------------------------- */
function buildGraphShell() {
  const edgeLayer = el("#edgeLayer");
  const nodeLayer = el("#nodeLayer");
  edgeLayer.innerHTML = "";
  nodeLayer.innerHTML = "";

  EDGES.forEach(([u, v]) => {
    const p1 = POS[u], p2 = POS[v];
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const r = 26;
    const x1 = p1.x + (dx / len) * r, y1 = p1.y + (dy / len) * r;
    const x2 = p2.x - (dx / len) * r, y2 = p2.y - (dy / len) * r;
    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", x1); line.setAttribute("y1", y1);
    line.setAttribute("x2", x2); line.setAttribute("y2", y2);
    line.setAttribute("class", "edge-line");
    line.dataset.edge = `${u}-${v}`;
    edgeLayer.appendChild(line);
  });

  NODES.forEach((n) => {
    const p = POS[n];
    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("class", "node-group");
    g.dataset.node = n;
    const circle = document.createElementNS(svgNS, "circle");
    circle.setAttribute("cx", p.x); circle.setAttribute("cy", p.y);
    circle.setAttribute("r", 26);
    circle.setAttribute("class", "node-circle");
    const label = document.createElementNS(svgNS, "text");
    label.setAttribute("x", p.x); label.setAttribute("y", p.y);
    label.setAttribute("class", "node-label");
    label.textContent = n;
    g.appendChild(circle);
    g.appendChild(label);
    nodeLayer.appendChild(g);
  });
}

/* ---------------------------------------------------------
   Render pseudocode block
--------------------------------------------------------- */
function renderCode() {
  const code = currentAlgo === "dfs" ? DFS_CODE : KAHN_CODE;
  const cls = currentAlgo === "dfs" ? "" : "kahn";
  const html = code
    .map((row, i) => {
      const [line, indent, text] = row;
      if (line === "__blank") return "";
      const indentClass = indent === 1 ? "ind1" : indent === 2 ? "ind2" : "";
      return `<span class="ln ${indentClass}" data-line="${line}" data-cls="${cls}">${escapeHtml(text)}</span>`;
    })
    .join("\n");
  el("#codeBlock").innerHTML = html;
}
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ---------------------------------------------------------
   Render one step
--------------------------------------------------------- */
function render() {
  const snaps = currentAlgo === "dfs" ? dfsSnaps : kahnSnaps;
  idx = Math.max(0, Math.min(idx, snaps.length - 1));
  const s = snaps[idx];

  el("#statusPill").textContent = `step ${idx} / ${snaps.length - 1}`;
  el("#scrub").max = snaps.length - 1;
  el("#scrub").value = idx;
  el("#messageLine").innerHTML = s.message;

  // reset node/edge classes
  document.querySelectorAll(".node-group").forEach((g) => {
    g.className.baseVal = "node-group";
  });
  document.querySelectorAll(".edge-line").forEach((l) => {
    l.setAttribute("class", "edge-line" + (currentAlgo === "kahn" ? " kahn" : ""));
  });

  if (currentAlgo === "dfs") {
    NODES.forEach((n) => {
      const g = document.querySelector(`.node-group[data-node="${n}"]`);
      const c = s.colors[n];
      if (c === "gray") g.classList.add("gray");
      if (c === "black") g.classList.add("black");
      if (s.activeNode === n) g.classList.add("active");
    });
  } else {
    NODES.forEach((n) => {
      const g = document.querySelector(`.node-group[data-node="${n}"]`);
      if (s.order.includes(n)) g.classList.add("q-done");
      else if (s.queue.includes(n)) g.classList.add("q-waiting");
      if (s.activeNode === n) g.classList.add("active");
    });
  }

  if (s.activeEdge) {
    const [u, v] = s.activeEdge;
    const line = document.querySelector(`.edge-line[data-edge="${u}-${v}"]`);
    if (line) line.classList.add("active");
  }

  // pseudocode highlight
  document.querySelectorAll(".code .ln").forEach((ln) => ln.classList.remove("active"));
  const lineKey = currentAlgo === "dfs" ? s.line : lineKeyForKahn(idx, snaps);
  document.querySelectorAll(`.code .ln[data-line="${lineKey}"]`).forEach((ln) => ln.classList.add("active"));

  renderStructure(s);
  renderLog(snaps, idx);
}

function lineKeyForKahn(i, snaps) {
  // derive a pseudo "line" tag for kahn snaps based on message content
  const s = snaps[i];
  if (i === 0) return "init";
  if (s.message.startsWith("in-degree") && s.queue.length && !s.order.length && s.activeEdge === null && i <= NODES.length)
    return "enqueue";
  if (s.message.startsWith("Dequeue")) return "dequeue";
  if (s.message.startsWith("Remove edge")) return "decrement";
  if (s.message.includes("enqueue") && s.order.length) return "enqueue2";
  if (s.message.startsWith("Queue empty")) return "done";
  return "enqueue";
}

function renderStructure(s) {
  const view = el("#structureView");
  el("#structureTitle").textContent =
    currentAlgo === "dfs" ? "Recursion stack & output L" : "Queue Q, in-degree table & output L";

  if (currentAlgo === "dfs") {
    view.innerHTML = `
      <div class="rec-row">
        <div class="rec-block">
          <h4>Recursion stack (top &rarr; bottom)</h4>
          <div class="stack-col">
            ${s.callStack.map((n) => `<div class="plate">${n}</div>`).join("") || '<span class="cm" style="color:var(--muted);font-family:var(--font-mono);font-size:12px;">empty</span>'}
          </div>
        </div>
        <div class="out-block">
          <h4>Output list L (finish order)</h4>
          <div class="out-row">
            ${s.finishOrder.map((n) => `<div class="out-chip">${n}</div>`).join("") || '<span style="color:var(--muted);font-family:var(--font-mono);font-size:12px;">empty</span>'}
          </div>
        </div>
      </div>
    `;
  } else {
    view.innerHTML = `
      <h4 style="font-family:var(--font-mono);font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin:0 0 8px;">Queue (front &rarr; back)</h4>
      <div class="queue-row">
        ${s.queue.map((n) => `<div class="qnode">${n}</div>`).join("") || '<span style="color:var(--muted);font-family:var(--font-mono);font-size:12px;">empty</span>'}
      </div>
      <h4 style="font-family:var(--font-mono);font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin:14px 0 4px;">Output list L</h4>
      <div class="out-row">
        ${s.order.map((n) => `<div class="out-chip">${n}</div>`).join("") || '<span style="color:var(--muted);font-family:var(--font-mono);font-size:12px;">empty</span>'}
      </div>
      <div class="indeg-grid">
        ${NODES.map((n) => `<span class="indeg-chip ${s.indeg[n] === 0 ? "zero" : ""}">${n}: ${s.indeg[n]}</span>`).join("")}
      </div>
    `;
  }
}

function renderLog(snaps, current) {
  const list = el("#logList");
  list.innerHTML = snaps
    .slice(0, current + 1)
    .map((s, i) => `<li class="${i === current ? "current" : ""}"><span class="n">${String(i).padStart(2, "0")}</span>${s.message}</li>`)
    .join("");
  list.scrollTop = list.scrollHeight;
}

/* ---------------------------------------------------------
   Controls
--------------------------------------------------------- */
function goTo(i) {
  idx = i;
  render();
}
function next() {
  const snaps = currentAlgo === "dfs" ? dfsSnaps : kahnSnaps;
  if (idx < snaps.length - 1) goTo(idx + 1);
  else stopPlaying();
}
function prev() {
  if (idx > 0) goTo(idx - 1);
}
function reset() {
  stopPlaying();
  goTo(0);
}
function stopPlaying() {
  playing = false;
  clearInterval(playTimer);
  el("#btnPlay").innerHTML = "&#9654; Play";
}
function togglePlay() {
  const snaps = currentAlgo === "dfs" ? dfsSnaps : kahnSnaps;
  if (playing) {
    stopPlaying();
    return;
  }
  if (idx >= snaps.length - 1) idx = 0;
  playing = true;
  el("#btnPlay").innerHTML = "&#10074;&#10074; Pause";
  const speedVal = Number(el("#speedRange").value);
  const delay = { 1: 1400, 2: 950, 3: 600, 4: 320 }[speedVal];
  playTimer = setInterval(() => {
    const s = currentAlgo === "dfs" ? dfsSnaps : kahnSnaps;
    if (idx < s.length - 1) goTo(idx + 1);
    else stopPlaying();
  }, delay);
}

function switchAlgo(algo) {
  if (algo === currentAlgo) return;
  stopPlaying();
  currentAlgo = algo;
  idx = 0;
  document.querySelectorAll(".switch-btn").forEach((b) => {
    const active = b.dataset.algo === algo;
    b.classList.toggle("active", active);
    b.setAttribute("aria-selected", active ? "true" : "false");
  });
  el("#graphTitle").textContent = algo === "dfs" ? "DFS traversal on G" : "Source-removal (Kahn) on G";
  document.body.classList.toggle("theme-kahn", algo === "kahn");
  renderCode();
  render();
}

/* ---------------------------------------------------------
   Wire up
--------------------------------------------------------- */
function init() {
  buildGraphShell();
  renderCode();
  render();

  document.querySelectorAll(".switch-btn").forEach((b) =>
    b.addEventListener("click", () => switchAlgo(b.dataset.algo))
  );
  el("#btnNext").addEventListener("click", () => { stopPlaying(); next(); });
  el("#btnPrev").addEventListener("click", () => { stopPlaying(); prev(); });
  el("#btnReset").addEventListener("click", reset);
  el("#btnPlay").addEventListener("click", togglePlay);
  el("#scrub").addEventListener("input", (e) => { stopPlaying(); goTo(Number(e.target.value)); });
  el("#speedRange").addEventListener("change", () => {
    if (playing) { stopPlaying(); togglePlay(); }
  });

  el("#theoryToggle").addEventListener("click", () => {
    const body = el("#theoryBody");
    const expanded = el("#theoryToggle").getAttribute("aria-expanded") === "true";
    el("#theoryToggle").setAttribute("aria-expanded", (!expanded).toString());
    body.style.display = expanded ? "none" : "block";
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { stopPlaying(); next(); }
    if (e.key === "ArrowLeft") { stopPlaying(); prev(); }
    if (e.key === " ") { e.preventDefault(); togglePlay(); }
  });
}

document.addEventListener("DOMContentLoaded", init);
