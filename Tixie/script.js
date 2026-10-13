const $ = (id) => document.getElementById(id);
const store = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};
const STYLES = ["Any style", "Watercolor", "Neon", "Anime", "Vintage", "Clay 3D"];
const RATIOS = { portrait: ["Portrait", "3/4"], square: ["Square", "1/1"], wide: ["Wide", "16/10"] };
const CATS = ["All", "Nature", "Space", "Food", "Animals", "Fantasy", "City"];
const TITLES = { chat: "Chat", create: "Create images", explore: "Explore ideas", favs: "Your favorites", mine: "My creations" };
const SURPRISE = ["A fox riding a rocket", "Pizza planet at sunrise", "Robot gardening on Mars", "Dragon sipping coffee", "Neon city in the rain", "Sleepy cloud castle", "Unicorn at a cricket match", "Ocean full of glowing jellyfish", "Tiny mountain village in winter", "Cat astronaut on the moon"];

const RAW = [
  ["Misty mountain sunrise", "🏔️", "Nature"], ["Rainforest after rain", "🌲", "Nature"], ["Wildflower meadow", "🌸", "Nature"], ["Glowing ocean waves", "🌊", "Nature"],
  ["Astronaut cat on the moon", "🐱", "Space"], ["Ringed planet at dawn", "🪐", "Space"], ["Rocket launch party", "🚀", "Space"], ["Starry desert night", "⭐", "Space"],
  ["Pizza planet", "🍕", "Food"], ["Rainbow ice cream", "🍦", "Food"], ["Morning coffee art", "☕", "Food"], ["Sushi garden", "🍣", "Food"],
  ["Fox in the snow", "🦊", "Animals"], ["Happy puppy picnic", "🐶", "Animals"], ["Butterfly wings", "🦋", "Animals"], ["Sleepy panda", "🐼", "Animals"],
  ["Friendly dragon", "🐉", "Fantasy"], ["Floating cloud castle", "🏰", "Fantasy"], ["Unicorn forest", "🦄", "Fantasy"], ["Wizard's potion shop", "🧪", "Fantasy"],
  ["Neon city nights", "🌆", "City"], ["Cricket victory scene", "🏏", "City"], ["Rainy tram stop", "🚋", "City"], ["Fireworks over the bridge", "🎆", "City"],
];

const EMOJI = { cat:"🐱", dog:"🐶", fox:"🦊", space:"🚀", rocket:"🚀", moon:"🌙", star:"⭐", sun:"🌅", sunset:"🌅", sunrise:"🌅", flower:"🌸", city:"🌆", cricket:"🏏", pizza:"🍕", food:"🍔", ocean:"🌊", sea:"🌊", beach:"🏖️", mountain:"🏔️", dragon:"🐉", robot:"🤖", car:"🏎️", forest:"🌲", rain:"🌧️", love:"💖", fire:"🔥", coffee:"☕", castle:"🏰", unicorn:"🦄", jellyfish:"🪼", panda:"🐼", planet:"🪐", winter:"❄️", snow:"❄️", cloud:"☁️", village:"🏘️" };
const SPARK = ["✨", "🎨", "🌈", "🦋", "🎆", "🍭", "🎡", "🪁"];

const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const emojiFor = (t) => { for (const w of t.toLowerCase().split(/\W+/)) if (EMOJI[w]) return EMOJI[w]; return SPARK[hash(t) % SPARK.length]; };
function palette(text, st) {
  const a = hash(text) % 360;
  const hs = (h, s, l) => `hsl(${h % 360},${s}%,${l}%)`;
  switch (st) {
    case "Watercolor": return [hs(a, 70, 78), hs(a + 40, 65, 66), hs(a + 90, 55, 56)];
    case "Neon": return [hs(265 + a % 30, 90, 12), hs(300 + a % 40, 100, 55), hs(170 + a % 40, 100, 52)];
    case "Anime": return [hs(a, 95, 68), hs(a + 60, 95, 58), hs(a + 140, 90, 52)];
    case "Vintage": return [hs(36, 45, 62), hs(18, 45, 45), hs(350, 35, 30)];
    case "Clay 3D": return [hs(a, 60, 74), hs(a, 55, 60), hs(a, 50, 46)];
    default: return [hs(a, 85, 60), hs(a + 50, 80, 50), hs(a + 110, 70, 30)];
  }
}
const mk = (id, title, emoji, style, ratio, cat) => ({ id, title, emoji, style, ratio, cat, c: palette(title + id, style) });
const IDEAS = RAW.map((r, i) => mk("e" + i, r[0], r[1], STYLES[i % STYLES.length], i % 2 ? "square" : "portrait", r[2]));

let mine = store.get("pm-mine", []);
let favs = store.get("pm-favs", []);
let style = "Watercolor", ratio = "portrait", count = 1, cat = "All", view = "chat", openItem = null;
const all = () => [...mine, ...IDEAS];
const bg = (it) => `linear-gradient(160deg,${it.c[0]},${it.c[1]},${it.c[2]})`;
const isFav = (it) => favs.includes(it.id);

/* ---------- Tiles ---------- */
function tile(it) {
  const t = document.createElement("article");
  t.className = "tile"; t.tabIndex = 0;
  t.style.background = bg(it); t.style.aspectRatio = RATIOS[it.ratio][1];
  t.innerHTML = `<span class="tag"></span><div class="em">${it.emoji}</div><div class="cap"></div>
    <div class="acts"><button data-a="f" class="${isFav(it) ? "f" : ""}" aria-label="Favorite">${isFav(it) ? "♥" : "♡"}</button><button data-a="d" aria-label="Download">⬇</button>${it.mine ? '<button data-a="r" aria-label="Delete">✕</button>' : ""}</div>`;
  t.querySelector(".tag").textContent = it.style;
  t.querySelector(".cap").textContent = it.title;
  t.onclick = (e) => {
    const a = e.target.closest("button");
    if (!a) return openLB(it);
    e.stopPropagation();
    if (a.dataset.a === "f") toggleFav(it);
    if (a.dataset.a === "d") download(it);
    if (a.dataset.a === "r") removeItem(it);
  };
  t.onkeydown = (e) => { if (e.key === "Enter" && e.target === t) openLB(it); };
  return t;
}
function fill(el, items, emptyMsg) {
  el.innerHTML = "";
  if (!items.length) { el.innerHTML = `<div class="empty">${emptyMsg}</div>`; return; }
  items.forEach((it) => el.appendChild(tile(it)));
}

/* ---------- Rendering ---------- */
function render() {
  $("bMine").textContent = $("sMine").textContent = mine.length;
  $("bFav").textContent = $("sFav").textContent = favs.length;
  renderHist();
  if (view === "chat" && !busy) renderChat();
  if (view === "create") {
    fill($("recent"), mine.slice(0, 4), "Nothing yet. Describe an image above and press Create.");
    fill($("tryGrid"), IDEAS.filter((_, i) => i % 6 === 0), "");
  }
  if (view === "explore") {
    const q = $("search").value.trim().toLowerCase();
    fill($("exGrid"), IDEAS.filter((i) => (cat === "All" || i.cat === cat) && i.title.toLowerCase().includes(q)), "No ideas match your search.");
  }
  if (view === "favs") fill($("favGrid"), all().filter(isFav), "No favorites yet. Tap the ♡ on any image to save it here.");
  if (view === "mine") {
    $("mineCount").textContent = mine.length + (mine.length === 1 ? " creation" : " creations");
    fill($("mineGrid"), mine, "You haven't created anything yet. Go to Create and make your first image!");
  }
}
function segment(el, list, get, set) {
  el.innerHTML = "";
  list.forEach(([label, val]) => {
    const b = document.createElement("button");
    b.textContent = label;
    b.className = get() === val ? "on" : "";
    b.onclick = () => { set(val); segment(el, list, get, set); if (el.id === "cats") render(); };
    el.appendChild(b);
  });
}
function setupControls() {
  segment($("styles"), STYLES.map((s) => [s, s]), () => style, (v) => (style = v));
  segment($("ratios"), Object.entries(RATIOS).map(([k, v]) => [v[0], k]), () => ratio, (v) => (ratio = v));
  segment($("counts"), [1, 2, 4].map((n) => [String(n), n]), () => count, (v) => (count = v));
  segment($("cats"), CATS.map((c) => [c, c]), () => cat, (v) => (cat = v));
}

function show(v) {
  view = v;
  document.querySelectorAll(".view").forEach((s) => (s.hidden = s.id !== "v-" + v));
  document.querySelectorAll("#nav button").forEach((b) => b.classList.toggle("on", b.dataset.v === v));
  $("vt").textContent = TITLES[v];
  if (innerWidth <= 780) $("side").classList.add("closed");
  $("main").scrollTop = 0;
  render();
}
document.querySelectorAll("#nav button").forEach((b) => (b.onclick = () => show(b.dataset.v)));
$("burger").onclick = () => $("side").classList.toggle("closed");
if (innerWidth <= 780) $("side").classList.add("closed");

/* ---------- Actions ---------- */
function toggleFav(it) {
  favs = isFav(it) ? favs.filter((x) => x !== it.id) : [...favs, it.id];
  store.set("pm-favs", favs);
  toast(isFav(it) ? "Saved to favorites ♥" : "Removed from favorites");
  render(); if (openItem && openItem.id === it.id) syncLB();
}
function removeItem(it) {
  mine = mine.filter((m) => m.id !== it.id); favs = favs.filter((f) => f !== it.id);
  store.set("pm-mine", mine); store.set("pm-favs", favs); render(); toast("Deleted");
}
function download(it) {
  const [rw, rh] = RATIOS[it.ratio][1].split("/").map(Number);
  const w = 800, h = Math.round((w * rh) / rw);
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const x = c.getContext("2d"), g = x.createLinearGradient(0, 0, w * 0.5, h);
  it.c.forEach((col, i) => g.addColorStop(i / 2, col));
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  x.textAlign = "center"; x.textBaseline = "middle"; x.font = `${Math.min(w, h) * 0.4}px serif`;
  x.fillText(it.emoji, w / 2, h / 2 - 20);
  x.font = "bold 34px sans-serif"; x.fillStyle = "#fff"; x.shadowColor = "rgba(0,0,0,.6)"; x.shadowBlur = 8;
  x.fillText(it.title.slice(0, 34), w / 2, h - 50);
  const a = document.createElement("a");
  a.download = "tixie-" + it.title.toLowerCase().replace(/\W+/g, "-").slice(0, 30) + ".png";
  try { a.href = c.toDataURL("image/png"); a.click(); toast("Image downloaded ⬇"); } catch (e) { toast("Download isn't available here"); }
}

/* ---------- Create ---------- */
const prompt_ = $("prompt");
const sync = () => ($("go").disabled = !prompt_.value.trim());
prompt_.addEventListener("input", sync);
prompt_.addEventListener("keydown", (e) => { if (e.key === "Enter") generate(); });
$("go").onclick = generate;
$("surprise").onclick = () => { prompt_.value = SURPRISE[Math.floor(Math.random() * SURPRISE.length)]; sync(); prompt_.focus(); };
let ph = 0;
setInterval(() => { ph = (ph + 1) % SURPRISE.length; prompt_.placeholder = SURPRISE[ph] + "..."; }, 2800);

function generate() {
  const text = prompt_.value.trim();
  if (!text) return;
  prompt_.value = ""; sync();
  const box = $("recent");
  if (box.querySelector(".empty")) box.innerHTML = "";
  const holders = [];
  for (let i = 0; i < count; i++) {
    const h = document.createElement("article");
    h.className = "tile loading"; h.style.aspectRatio = RATIOS[ratio][1];
    box.prepend(h); holders.push(h);
  }
  const made = [];
  for (let i = 0; i < count; i++) {
    const it = mk("m" + Date.now() + i, text, emojiFor(text), style, ratio, "");
    it.mine = true; made.push(it);
  }
  setTimeout(() => {
    mine = [...made, ...mine]; store.set("pm-mine", mine); render();
    toast(count > 1 ? count + " images created ✦" : "Image created ✦");
  }, 1300);
}

/* ---------- Lightbox ---------- */
function syncLB() {
  const it = openItem;
  $("lbFav").textContent = isFav(it) ? "♥ Saved (click to remove)" : "♡ Save to favorites";
}
function openLB(it) {
  openItem = it;
  $("big").style.background = bg(it);
  $("big").innerHTML = `<div class="em">${it.emoji}</div>`;
  $("lbT").textContent = it.title;
  $("lbM").innerHTML = "";
  [it.style, RATIOS[it.ratio][0], it.cat || "My creation"].forEach((m) => { const s = document.createElement("span"); s.textContent = m; $("lbM").appendChild(s); });
  syncLB(); $("lb").classList.add("show");
}
const closeLB = () => { $("lb").classList.remove("show"); openItem = null; };
$("lbClose").onclick = closeLB;
$("lb").onclick = (e) => { if (e.target === $("lb")) closeLB(); };
$("lbFav").onclick = () => toggleFav(openItem);
$("lbDl").onclick = () => download(openItem);
$("lbUse").onclick = () => { const t = openItem.title; closeLB(); show("create"); prompt_.value = t; sync(); prompt_.focus(); };
$("lbCopy").onclick = () => {
  const t = openItem.title;
  (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast("Prompt copied 📋")).catch(() => toast("Copy isn't available here"));
};

/* ---------- Chat ---------- */
const msgs = $("msgs"), cin = $("cin"), csend = $("csend"), FENCE = "```";
let chats = store.get("pm-chats", []), curId = null, busy = false, timer = null, pend = null, userName = store.get("pm-name", "");
const cur = () => chats.find((c) => c.id === curId);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const saveChats = () => store.set("pm-chats", chats);
const scrollEnd = () => { $("main").scrollTop = $("main").scrollHeight; };
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const SUGG = [["😂 Tell me a joke", "Tell me a joke"], ["🎨 Draw an image of a fox on a rocket", "/image a fox riding a rocket"], ["🧮 Calculate 24 * 7 + 15", "Calculate 24 * 7 + 15"], ["💻 Show me some HTML code", "Show me HTML code"]];

function fmt(text) {
  const blocks = [];
  let t = esc(text).replace(/^- /gm, "• ").replace(/```(\w*)\n?([\s\S]*?)(```|$)/g, (_, l, code) => {
    blocks.push("<pre><code>" + code.replace(/\n$/, "") + "</code></pre>");
    return "\u0000" + (blocks.length - 1) + "\u0000";
  });
  t = t.replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
  t = t.split(/\n{2,}/).map((p) => "<p>" + p.replace(/\n/g, "<br>") + "</p>").join("");
  return t.replace(/<p>\u0000(\d+)\u0000<\/p>|\u0000(\d+)\u0000/g, (_, a, b) => blocks[a ?? b]);
}

function renderHist() {
  const h = $("hist");
  h.innerHTML = chats.length ? '<div class="hl">Recent chats</div>' : '<div class="hl">No chats yet</div>';
  chats.forEach((c) => {
    const d = document.createElement("div");
    d.className = "hi" + (c.id === curId && view === "chat" ? " on" : "");
    d.innerHTML = '<span></span><button aria-label="Delete chat">✕</button>';
    d.querySelector("span").textContent = c.title;
    d.onclick = () => { stopChat(); curId = c.id; show("chat"); };
    d.querySelector("button").onclick = (e) => { e.stopPropagation(); delChat(c.id); };
    h.appendChild(d);
  });
}
function delChat(id) {
  if (id === curId) { stopChat(); curId = null; }
  chats = chats.filter((c) => c.id !== id); saveChats(); render();
}
function renderChat() {
  msgs.innerHTML = "";
  const c = cur();
  if (!c || !c.messages.length) {
    msgs.innerHTML = `<div class="welcome"><h1>Hi${userName ? ", " + esc(userName) : ""}! I'm <em>Tixie</em></h1><p class="sub">Chat with me, ask questions, or turn words into art.</p><div class="sug"></div></div>`;
    SUGG.forEach(([label, q]) => {
      const b = document.createElement("button"); b.textContent = label; b.onclick = () => sendChat(q);
      msgs.querySelector(".sug").appendChild(b);
    });
    return;
  }
  c.messages.forEach((m, i) => addMsg(m, i === c.messages.length - 1));
  scrollEnd();
}
function addMsg(m, last) {
  const d = document.createElement("div");
  d.className = "m " + (m.role === "user" ? "u" : "a");
  if (m.role === "user") {
    const b = document.createElement("div"); b.className = "bub"; b.textContent = m.content; d.appendChild(b);
  } else {
    d.innerHTML = '<div class="av">✦</div><div class="bot"><div class="txt"></div></div>';
    d.querySelector(".txt").innerHTML = fmt(m.content);
    if (m.img) d.querySelector(".bot").appendChild(tile({ ...m.img, mine: false }));
    const bar = document.createElement("div"); bar.className = "macts";
    bar.innerHTML = "<button>📋 Copy</button>" + (last ? "<button>🔄 Regenerate</button>" : "");
    const [cp, rg] = bar.querySelectorAll("button");
    cp.onclick = () => (navigator.clipboard ? navigator.clipboard.writeText(m.content) : Promise.reject()).then(() => toast("Copied 📋")).catch(() => toast("Copy isn't available here"));
    if (rg) rg.onclick = regen;
    d.querySelector(".bot").appendChild(bar);
  }
  msgs.appendChild(d);
}

function setBusy(b) {
  busy = b; csend.textContent = b ? "■" : "↑";
  csend.setAttribute("aria-label", b ? "Stop generating" : "Send message");
  csend.disabled = b ? false : !cin.value.trim();
}
function sendChat(text) {
  text = (text ?? cin.value).trim();
  if (!text || busy) return;
  if (!cur()) { const c = { id: Date.now(), title: text.slice(0, 36), messages: [] }; chats.unshift(c); curId = c.id; }
  cur().messages.push({ role: "user", content: text });
  cin.value = ""; autoH(); saveChats(); renderHist(); renderChat(); answer(text);
}
function imageIntent(q) {
  const m = q.match(/^\/(?:image|imagine|draw)\s+(.+)/i) ||
    q.match(/^(?:please\s+)?(?:draw|create|generate|make|paint|design)(?:\s+me)?(?:\s+(?:an?|the))?\s+(?:image|picture|photo|drawing|painting|art|artwork|illustration)\s*(?:of|for|showing|with)?\s+(.+)/i);
  return m ? m[1].replace(/[.!?]+$/, "").trim() : null;
}
function answer(q) {
  setBusy(true);
  const d = document.createElement("div");
  d.className = "m a";
  d.innerHTML = '<div class="av">✦</div><div class="bot"><div class="txt"><div class="dots"><span></span><span></span><span></span></div></div></div>';
  msgs.appendChild(d); scrollEnd();
  const txt = d.querySelector(".txt"), imgText = imageIntent(q);
  const content = imgText ? `Here is your image of **${imgText}** (${style} style). Click it to preview, save or download it as a PNG.` : botReply(q);
  pend = { shown: 0, content };
  timer = setTimeout(() => {
    txt.classList.add("cur");
    timer = setInterval(() => {
      pend.shown += 3;
      txt.innerHTML = fmt(content.slice(0, pend.shown)); scrollEnd();
      if (pend.shown >= content.length) finish(content, imgText);
    }, 18);
  }, imgText ? 1300 : 700);
}
function finish(content, imgText) {
  clearInterval(timer); timer = null; pend = null;
  const msg = { role: "assistant", content };
  if (imgText) {
    const it = mk("m" + Date.now(), imgText, emojiFor(imgText), style, ratio, ""); it.mine = true;
    mine = [it, ...mine]; store.set("pm-mine", mine); msg.img = it;
  }
  const c = cur(); if (c) { c.messages.push(msg); saveChats(); }
  setBusy(false); render();
}
function stopChat() {
  if (!busy) return;
  clearTimeout(timer); clearInterval(timer); timer = null;
  const c = cur();
  if (pend && pend.shown > 0 && c) { c.messages.push({ role: "assistant", content: pend.content.slice(0, pend.shown) }); saveChats(); }
  pend = null; setBusy(false); render();
}
function regen() {
  const c = cur(); if (!c || busy) return;
  while (c.messages.length && c.messages[c.messages.length - 1].role === "assistant") c.messages.pop();
  const last = c.messages[c.messages.length - 1]; if (!last) return;
  saveChats(); renderChat(); answer(last.content);
}
const autoH = () => { cin.style.height = "auto"; cin.style.height = Math.min(cin.scrollHeight, 180) + "px"; };
cin.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } });
cin.addEventListener("input", () => { autoH(); if (!busy) csend.disabled = !cin.value.trim(); });
csend.onclick = () => (busy ? stopChat() : sendChat());
$("imgBtn").onclick = () => { cin.value = "/image " + cin.value.replace(/^\/image\s*/, ""); autoH(); csend.disabled = false; cin.focus(); };
$("newChat").onclick = () => { stopChat(); curId = null; show("chat"); cin.focus(); };

/* The "brain": simple rules. Replace botReply() with an API call to make it a real AI. */
const JOKES = ["Why do programmers prefer dark mode? Because light attracts bugs.", "Why did the developer go broke? He used up all his cache.", "There are 10 kinds of people: those who understand binary and those who don't.", "A SQL query walks into a bar, walks up to two tables and asks: 'Can I join you?'"];
const FACTS = ["Honey never spoils. Edible honey has been found in ancient Egyptian tombs.", "Octopuses have three hearts and blue blood.", "The first computer bug was a real moth found inside a computer in 1947.", "A day on Venus is longer than a year on Venus."];
const QUOTES = ["Small steps every day add up to big results.", "Mistakes are proof that you are trying.", "Do not wait for inspiration. Start, and it will find you.", "You don't have to be perfect to be amazing."];
function botReply(q) {
  const s = q.trim().toLowerCase();
  if (/^\/(image|imagine|draw)\s*$/.test(s)) return "Add a description after the command, for example `/image a fox riding a rocket`.";
  const nm = q.match(/(?:my name is|call me)\s+([a-z]+)/i);
  if (nm) { userName = nm[1][0].toUpperCase() + nm[1].slice(1).toLowerCase(); store.set("pm-name", userName); return `Nice to meet you, **${userName}**! 😊 I'll remember your name.`; }
  if (/(what('s| is) my name|who am i)/.test(s)) return userName ? `Your name is **${userName}**.` : "You haven't told me yet. Say `my name is ...` and I'll remember it.";
  const mp = s.replace(/^(calculate|what is|what's|solve|compute)\s+/, "").replace(/[?=]+$/, "").replace(/\bquickly\b/, "").replace(/x/g, "*").trim();
  if (/^[\d\s+\-*/().%]+$/.test(mp) && /\d/.test(mp) && /[+\-*/%]/.test(mp)) {
    try { const r = Function('"use strict";return (' + mp + ")")(); if (isFinite(r)) return `The answer is **${+r.toFixed(6)}**.`; } catch (e) {}
    return "That expression doesn't look valid. Try something like `12 * (3 + 4)`.";
  }
  if (/^(hi|hello|hey|hii|good (morning|afternoon|evening))\b/.test(s)) return `Hello${userName ? ", " + userName : ""}! 👋 How can I help you today?`;
  if (/how are you/.test(s)) return "I'm doing great, thanks for asking! What would you like to talk about?";
  if (/who made you|who created you|who built you/.test(s)) return "I was built as a school project using HTML, CSS and JavaScript.";
  if (/your name|who are you|what are you|tixie/.test(s)) return "I'm **Tixie**, a chat assistant and AI art studio. I can chat, answer simple questions and turn your words into colorful images.";
  if (/joke|funny/.test(s)) return pick(JOKES);
  if (/\bfact\b/.test(s)) return "Fun fact: " + pick(FACTS);
  if (/quote|motivat|inspire/.test(s)) return "💡 " + pick(QUOTES);
  if (/flip.*coin|coin flip/.test(s)) return "The coin landed on **" + pick(["heads", "tails"]) + "**. 🪙";
  if (/roll.*dice|dice roll|\bdice\b/.test(s)) return "You rolled a **" + (1 + Math.floor(Math.random() * 6)) + "**. 🎲";
  if (/\btime\b/.test(s)) return "The current time is **" + new Date().toLocaleTimeString() + "**.";
  if (/\bdate\b|today|\bday\b/.test(s)) return "Today is **" + new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" }) + "**.";
  if (/weather/.test(s)) return "I can't check live weather in this demo, but I can tell you the time, the date, jokes and more.";
  if (/study|exam|test/.test(s)) return "Study tips:\n\n- Study in short sessions of 25 minutes with 5 minute breaks\n- Practice by writing code, not just reading it\n- Explain a topic out loud as if you were teaching it\n- Sleep well before the exam";
  if (/how.*(image|picture|art)|make.*image/.test(s)) return "To make an image, type `/image` followed by a description, like `/image a dragon drinking coffee`, or say \"draw an image of a sunset\". You can change the style and shape on the **Create images** page.";
  if (/thank/.test(s)) return "You're welcome! Let me know if you need anything else.";
  if (/\bbye\b|goodbye/.test(s)) return "Goodbye! Have a great day. 👋";
  if (/html/.test(s)) return "Here is a basic HTML page:\n\n" + FENCE + "html\n<!DOCTYPE html>\n<html>\n  <head>\n    <title>My Page</title>\n  </head>\n  <body>\n    <h1>Hello, world!</h1>\n  </body>\n</html>\n" + FENCE + "\n\nHTML gives a page its **structure**.";
  if (/css/.test(s)) return "CSS controls how a page **looks**:\n\n" + FENCE + "css\nbutton {\n  background: #ff6b6b;\n  color: white;\n  padding: 10px 18px;\n  border-radius: 8px;\n}\n" + FENCE;
  if (/javascript|\bjs\b/.test(s)) return "JavaScript makes a page **interactive**:\n\n" + FENCE + "js\ndocument.querySelector('button')\n  .addEventListener('click', () => {\n    alert('Button clicked!');\n  });\n" + FENCE;
  if (/python/.test(s)) return "Python is a beginner-friendly language:\n\n" + FENCE + "python\nfor i in range(3):\n    print('Hello', i)\n" + FENCE;
  if (/help|what can you do/.test(s)) return "I can:\n\n- Chat and remember your name (say `my name is ...`)\n- Make images: `/image a red fox`\n- Do maths like `45 * 3 + 2`\n- Tell jokes, facts and quotes\n- Show the time and date, flip a coin, roll a dice\n- Share HTML, CSS, JavaScript and Python examples";
  return pick(["That's an interesting question! I'm a small demo, so my knowledge is limited. Type **help** to see what I can do.", "I don't have a good answer for that yet. Try asking for a joke, a fact, some maths or an image with `/image`.", `Good question about "${q.trim().slice(0, 50)}". A real AI model would answer in detail. This demo knows only a few topics.`]);
}

/* ---------- Misc ---------- */
$("search").addEventListener("input", render);
$("clearAll").onclick = () => {
  if (!mine.length || !confirm("Delete all your creations?")) return;
  favs = favs.filter((f) => !f.startsWith("m")); mine = [];
  store.set("pm-mine", mine); store.set("pm-favs", favs); render();
};
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLB();
  if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) { e.preventDefault(); show("explore"); $("search").focus(); }
});
function setTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  $("theme").textContent = t === "dark" ? "☀️ Light mode" : "🌙 Dark mode";
  store.set("pm-theme", t);
}
$("theme").onclick = () => setTheme(document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light");
let tt;
function toast(m) { const t = $("toast"); t.textContent = m; t.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 2000); }

setTheme(store.get("pm-theme", "dark"));
setupControls();
render();