/* =========================================================================
 *  《号令九泉》ARG 原型 · 逻辑层（第七版 · 微信合一 · 清除数据 · 论坛开放）
 *  导航：index.html(hub 手机壳) + 各功能区独立 .html，点击真实跳转。
 *  微信（wx.html）= 私聊（修车师傅 + A–E）+ 群聊 + 朋友圈，三 tab 切换。
 *  解密链：检索 → 九宫门(9381) → 黑纸辨识 → 人身造化门
 *          → 渐进解锁笔记 → 群聊/私聊/朋友圈 拼合 → 论坛 → 真相锁。
 *  清除数据：状态栏「重置」按钮 → 确认 → localStorage 清空 + 重载。
 *  王鉴：boot(0)+qa(1) 开局连发；qb/qc 随解密触发；finale 终局后发。
 * ========================================================================= */
(function () {
  "use strict";
  const D = window.HLJQ_DATA;
  const KEY = "hljq:arg-full";
  const $ = (s) => document.querySelector(s);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PAGE = (document.body && document.body.dataset.page) || "hub";

  /* ---------- 进度持久化（localStorage，离线） ---------- */
  const store = {
    load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } },
    save(o) { const cur = this.load(); localStorage.setItem(KEY, JSON.stringify(Object.assign(cur, o))); },
    clear() { try { localStorage.removeItem(KEY); } catch (e) {} },
  };
  let S = Object.assign(
    { qa: false, qb: false, qc: false, read: [], wj: [], wjUnread: 0, audio: false, fx: true, bled: [], death: false, truth: false, bkShown: false, shenRead: false, wjProtectDismissed: [], wxTab: "chats" },
    store.load()
  );

  const logEl = $("#logList");
  function log(msg) { if (!logEl) return; const li = document.createElement("li"); li.textContent = msg; logEl.insertBefore(li, logEl.firstChild); if (logEl.children.length > 14) logEl.removeChild(logEl.lastChild); }

  /* ---------- 清除数据 / 重置 ---------- */
  function clearData() {
    if (!confirm("确定要清除所有数据并从头开始吗？此操作不可撤销。")) return;
    store.clear();
    location.reload();
  }

  /* ---------- 恐怖特效 + 合成音频 ---------- */
  let AC = null, drone = null, droneGain = null;
  function ensureAudio() { if (!AC) { const C = window.AudioContext || window.webkitAudioContext; if (C) AC = new C(); } if (AC && AC.state === "suspended") AC.resume(); }
  function startDrone() {
    if (!AC || drone) return;
    const g = AC.createGain(); g.gain.value = 0; g.connect(AC.destination);
    const o1 = AC.createOscillator(); o1.type = "sine"; o1.frequency.value = 55;
    const o2 = AC.createOscillator(); o2.type = "sine"; o2.frequency.value = 82.5;
    const o3 = AC.createOscillator(); o3.type = "triangle"; o3.frequency.value = 27.5;
    const filt = AC.createBiquadFilter(); filt.type = "lowpass"; filt.frequency.value = 300;
    o1.connect(filt); o2.connect(filt); o3.connect(filt); filt.connect(g);
    const lfo = AC.createOscillator(); lfo.frequency.value = 0.07;
    const lfoG = AC.createGain(); lfoG.gain.value = 55; lfo.connect(lfoG); lfoG.connect(filt.frequency);
    o1.start(); o2.start(); o3.start(); lfo.start();
    g.gain.linearRampToValueAtTime(0.055, AC.currentTime + 2.5);
    drone = { o1, o2, o3, lfo }; droneGain = g;
  }
  function stopDrone() {
    if (!drone) return;
    droneGain.gain.linearRampToValueAtTime(0, AC.currentTime + 1.0);
    const d = drone; setTimeout(() => { Object.values(d).forEach((n) => { try { n.stop(); } catch (e) {} }); }, 1100);
    drone = null; droneGain = null;
  }
  function sting(level) {
    if (!AC) return;
    const t = AC.currentTime;
    const base = 170 + level * 38;
    const freqs = [base, base * 1.059, base * 1.5, base * 1.5 * 1.041];
    const g = AC.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.17, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);
    g.connect(AC.destination);
    freqs.forEach((f) => { const o = AC.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.connect(g); o.start(t); o.stop(t + 0.95); });
    const n = AC.createOscillator(); n.type = "sine";
    n.frequency.setValueAtTime(95, t); n.frequency.exponentialRampToValueAtTime(38, t + 0.8);
    n.connect(g); n.start(t); n.stop(t + 0.9);
  }
  function horror(level) {
    if (!S.fx) return;
    const cls = reduceMotion ? ["fx-vignette"] : ["fx-vignette", "fx-glitch", "fx-flicker"];
    document.body.classList.add(...cls);
    if (level >= 3) screenShatter();
    if (S.audio) sting(level);
    setTimeout(() => document.body.classList.remove(...cls), 900 + level * 350);
  }
  function setAudio(on) {
    S.audio = on; store.save({ audio: on });
    const b = $("#btnAudio"); if (b) { b.textContent = on ? "声音 ●" : "声音 ○"; b.classList.toggle("on", on); }
    if (on) { ensureAudio(); startDrone(); } else { stopDrone(); }
  }
  function setFx(on) {
    S.fx = on; store.save({ fx: on });
    const b = $("#btnFx"); if (b) { b.textContent = on ? "特效 ●" : "特效 ○"; b.classList.toggle("on", on); }
  }

  /* ---------- 状态栏进度 ---------- */
  function progText() {
    if (S.death) return "终局";
    if (S.qc && S.read.length >= ((D.DEATH && D.DEATH.minRead) || 19)) return "残卷将尽";
    if (S.qc) return "人身造化已通";
    if (S.qb) return "黑纸已辨";
    if (S.qa) return "九宫已解";
    return "未解锁";
  }
  function sync() {
    const p = $("#sbProg"); if (p) p.textContent = progText();
    document.querySelectorAll(".app").forEach((a) => {
      const gate = a.dataset.gate;
      let ok = true;
      if (gate === "qa") ok = S.qa; else if (gate === "qb") ok = S.qb; else if (gate === "qc") ok = S.qc;
      a.classList.toggle("locked", !ok);
      const bd = a.querySelector(".badge"); if (bd) bd.remove();
      // 微信应用上挂载王鉴未读红点
      if (a.dataset.id === "wx" && S.wjUnread > 0) {
        const b = document.createElement("span"); b.className = "badge"; b.textContent = S.wjUnread; a.appendChild(b);
      }
    });
    const ba = $("#btnAudio"); if (ba) { ba.textContent = S.audio ? "声音 ●" : "声音 ○"; ba.classList.toggle("on", S.audio); }
    const bf = $("#btnFx"); if (bf) { bf.textContent = S.fx ? "特效 ●" : "特效 ○"; bf.classList.toggle("on", S.fx); }
  }

  /* ---------- 子页渲染容器 ---------- */
  function showPage(title, html, after) {
    const host = $("#pageBody"); if (host) host.innerHTML = html;
    const t = $("#sbTitle"); if (t) t.textContent = title;
    if (after) after();
    window.scrollTo(0, 0);
  }

  /* ---------- 王鉴来信（唯一主动提醒来源） ---------- */
  function fireWJ(trigger) {
    const m = D.WANGJIAN.find((x) => x.trigger === trigger);
    if (!m || S.wj.indexOf(m.id) >= 0) return;
    S.wj.push(m.id); S.wjUnread++; store.save({ wj: S.wj, wjUnread: S.wjUnread });
    log("收到「" + m.from + "」的讯息");
    sync();
  }
  function fireWJDelayed(trigger, delay) {
    const m = D.WANGJIAN.find((x) => x.trigger === trigger);
    if (!m || S.wj.indexOf(m.id) >= 0) return;
    log(m.from + " 正在输入…");
    setTimeout(() => fireWJ(trigger), delay || 1400);
  }
  function ensureBoot() {
    if (S.wj.indexOf(0) < 0) fireWJ("boot");
    if (S.wj.indexOf(1) < 0) setTimeout(() => fireWJ("qa"), 4200);
  }
  function solveQuest(id) {
    if (id === "qa" && !S.qa) { S.qa = true; store.save({ qa: true }); log("九宫门开：9381"); fireWJ("qa"); }
    if (id === "qb" && !S.qb) { S.qb = true; store.save({ qb: true }); log("辨得正法：黑纸朱书"); fireWJDelayed("qb", 1500); }
    if (id === "qc" && !S.qc) { S.qc = true; store.save({ qc: true }); log("人身造化已通"); fireWJDelayed("qc", 1500); }
    sync();
    checkDeath();
  }

  /* =====================================================================
   *  终局（全员殒落）
   * ===================================================================== */
  function deathReady() {
    const ft = (D.DEATH && D.DEATH.foretellNote);
    if (ft == null) return false;
    return S.read.indexOf(ft) >= 0;
  }
  function checkDeath() {
    if (S.death) return;
    if (!deathReady()) return;
    S.death = true; store.save({ death: true });
    buildBreaking(true);
  }
  function screenShatter() {
    if (reduceMotion || !S.fx) return;
    let svg = document.getElementById("shatter");
    if (!svg) {
      svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.id = "shatter";
      svg.setAttribute("viewBox", "0 0 100 100");
      svg.setAttribute("preserveAspectRatio", "none");
      const lines = [
        "M50 50 L8 4 M50 50 L92 10 M50 50 L96 52 M50 50 L70 96 M50 50 L18 94",
        "M50 50 L30 18 M50 50 L74 30 M50 50 L38 78 M50 50 L62 70 M50 50 L14 46 M50 50 L88 70",
      ];
      svg.innerHTML = lines.map((d) => '<path d="' + d + '" stroke="rgba(230,235,240,.85)" stroke-width=".5" fill="none" stroke-linecap="round"/>').join("") +
        '<circle cx="50" cy="50" r="2.4" fill="rgba(255,255,255,.9)"/>';
      document.body.appendChild(svg);
    }
    svg.classList.remove("go"); void svg.offsetWidth; svg.classList.add("go");
    setTimeout(() => svg.classList.remove("go"), 1500);
  }
  function buildBreaking(perform) {
    if (S.bkShown || S.truth) return;
    const H = D.HEADLINE;
    const overlay = document.createElement("div");
    overlay.id = "breaking";
    overlay.innerHTML =
      '<div class="bk-bg"></div>' +
      '<div class="bk-card">' +
        '<div class="bk-kicker">' + (H.kicker || "突发") + "</div>" +
        '<h1 class="bk-title">' + H.title + "</h1>" +
        '<p class="bk-body">' + H.body.replace(/\n/g, "<br/>") + "</p>" +
        '<div class="bk-names"><span>死者（匿名）：</span>' + H.names.map((n) => "<b>" + n + "</b>").join("") + "</div>" +
        '<p class="bk-tip">' + (H.tip || "") + "</p>" +
        '<div class="bk-actions">' +
          '<button id="bkShare" type="button">分享这部手机</button>' +
          '<button id="bkClose" type="button" class="ghost">再看一眼</button>' +
        "</div>" +
      "</div>";
    document.body.appendChild(overlay);

    S.bkShown = true; store.save({ bkShown: true });

    const motion = S.fx && !reduceMotion;
    if (motion) { overlay.classList.add("shake"); screenShatter(); }
    requestAnimationFrame(() => overlay.classList.add("red"));
    if (S.audio) { ensureAudio(); sting(3); if (!reduceMotion) setTimeout(() => sting(2), 1200); }

    function finish() {
      fireWJ("finale");
      const share = document.getElementById("bkShare");
      const close = document.getElementById("bkClose");
      if (share) share.onclick = () => doShare(
        (D.META && D.META.title) + "\n" + H.title + "\n——一部无人认领的手机里，藏着这件事的另一端。");
      if (close) close.onclick = () => overlay.remove();
    }
    if (perform) setTimeout(finish, reduceMotion ? 2200 : 5200);
    else finish();
    return overlay;
  }
  /* =====================================================================
   *  王鉴保护弹窗（iOS 通知式 · 点击 → wx.html）
   * ===================================================================== */
  const WJ_PROTECT_TEXT = "别再查了。他们已经死了。继续只会让你陷得更深。\n去微信里看完我说的话，再回来。";
  const WJ_FIVE = ["刘希夷", "麻三", "孙师", "贾生", "迟浩亮"];
  function maybeShowWangjianProtect(personKey) {
    if (S.truth) return;
    if (!WJ_FIVE.includes(personKey)) return;
    if (S.wjProtectDismissed.indexOf(personKey) >= 0) return;
    S.wjProtectDismissed.push(personKey);
    store.save({ wjProtectDismissed: S.wjProtectDismissed });
    showWangjianProtectModal();
  }
  function showWangjianProtectModal() {
    if (document.getElementById("wj-protect-modal")) return;
    const modal = document.createElement("div");
    modal.id = "wj-protect-modal";
    modal.className = "wj-protect-modal";
    modal.setAttribute("role", "button");
    modal.innerHTML =
      '<div class="wj-protect-card">' +
        '<div class="wj-protect-head"><span class="wj-protect-from">修车师傅</span><span class="wj-protect-meta">微信</span></div>' +
        '<div class="wj-protect-text">' + WJ_PROTECT_TEXT + "</div>" +
        '<div class="wj-protect-action">[ 点击查看完整对话 → ]</div>' +
      "</div>";
    modal.onclick = () => { location.href = "wx.html"; };
    document.body.appendChild(modal);
    if (S.audio) { ensureAudio(); sting(1); }
  }
  function doShare(text) {
    const url = location.href;
    const title = (D.META && D.META.title) || "设备回收 · 物证 A7-巳";
    if (navigator.share) {
      navigator.share({ title: title, text: text, url: url }).catch((e) => {
        if (e && e.name === "AbortError") return;
        copyText(url); flash(null, "链接已复制");
      });
      return;
    }
    copyText(url); flash(null, "链接已复制");
  }
  function copyText(t) {
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(t); return true; } } catch (e) {}
    const ta = document.createElement("textarea");
    ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0"; ta.style.top = "0";
    document.body.appendChild(ta); ta.focus(); ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    ta.remove(); return true;
  }
  function flash(btn, msg) { if (btn) { const old = btn.textContent; btn.textContent = msg; setTimeout(() => (btn.textContent = old), 1400); } else { log(msg); } }

  /* =====================================================================
   *  检索（人物/术语/群聊/反应式）
   * ===================================================================== */
  function portraitSVG(p) {
    const frame = p.deceased ? "var(--anti-paper)" : "var(--iron)";
    const sil = p.deceased ? "var(--can-bai)" : "var(--cinnabar-gold)";
    return `<svg viewBox="0 0 120 150">
      <rect x="6" y="6" width="108" height="138" fill="var(--ink-xuan-3)" stroke="${frame}" stroke-width="${p.deceased ? 4 : 2}"/>
      <circle cx="60" cy="58" r="26" fill="${sil}" opacity="0.5"/>
      <path d="M22 142 Q22 96 60 96 Q98 96 98 142 Z" fill="${sil}" opacity="0.5"/>
      ${p.deceased ? '<text x="60" y="22" font-size="11" fill="var(--can-bai)" text-anchor="middle" letter-spacing="4">遗照</text>' : ""}
    </svg>`;
  }
  function personHTML(name, p) {
    if (S.bled.indexOf(name) < 0) { S.bled.push(name); store.save({ bled: S.bled }); }
    const hasImg = !!(p.img);
    const img = hasImg
      ? `<img class="portrait-img" src="${p.img}" alt="${name}" loading="lazy">`
      : portraitSVG(p);
    const tag = p.deceased ? `<span class="tag death">遗照 · 已故</span>` : `<span class="tag">${p.tag}</span>`;
    const alias = (p.alias && p.alias.length) ? `<p class="muted" style="font-size:.78rem;margin-top:6px">别名：${p.alias.join("、")}</p>` : "";
    const bio = (p.line) ? `<p class="p-bio">${p.line}</p>` : "";
    const age = (p.age != null) ? `<p class="muted" style="font-size:.74rem;margin-top:4px">约 ${p.age} 岁</p>` : "";
    const bleed = '<div class="blood"></div>';
    return `<div class="person">
      <div class="portrait ${p.deceased ? "death" : ""} bleading">
        ${img}${bleed}
      </div>
      <h4 class="pname">${name}${tag}</h4>
      ${alias}${age}${bio}
    </div>`;
  }
  function renderSearch() {
    const html = `
      <div class="searchbar">
        <input id="q" placeholder="检索…" autocomplete="off" />
        <button id="go">检索</button>
        <button class="ex" id="clear">清空</button>
      </div>
      <div id="res"></div>`;
    showPage("检索 · 残档库", html, () => {
      const q = $("#q"), res = $("#res");
      function run() {
        const kw = q.value.trim();
        if (!kw) return;
        let personKey = null, personHit = null;
        for (const k in D.PEOPLE) {
          const p = D.PEOPLE[k];
          if (k.includes(kw) || (p.alias && p.alias.some((a) => a.includes(kw))) || kw.includes(k)) { personKey = k; personHit = p; break; }
        }
        if (personHit) {
          res.innerHTML = personHTML(personKey, personHit);
          log("检索人物：" + personKey);
          const isFoe = !!(personHit.foe || (personHit.tag && personHit.tag.indexOf("反派") >= 0));
          if (isFoe) horror(3);
          maybeShowWangjianProtect(personKey);
          return;
        }
        if (D.REACTIVE_KEYS.some((k) => kw.includes(k) || k.includes(kw))) {
          horror(3);
          res.innerHTML = `<div class="react"><h4>· 检索回应 ·</h4>${D.REACTIVE.lines.map((l) => `<p class="react-line">${l}</p>`).join("")}</div>`;
          log("检索：" + kw + " —— 被察觉");
          return;
        }
        const out = [];
        for (const k in D.LORE) {
          if (k.includes(kw) || kw.includes(k))
            out.push(`<div class="result"><h4>${k}<span class="tag">世界设定</span></h4><p>${D.LORE[k]}</p></div>`);
        }
        if ("九宫洛书八卦卦象".includes(kw) || kw === "九宫" || kw === "洛书") out.push(luoshuHTML());
        if ("人身造化铁围山六洞后门".includes(kw) || kw === "人身造化") out.push(bodyMapHTML());
        for (const g of D.GROUP_CHATS) {
          if (g.name.includes(kw) || g.tag.includes(kw) || kw.includes(g.name) ||
              g.msgs.some((m) => m.from.includes(kw) || m.text.includes(kw))) {
            out.push(`<div class="result"><h4>${g.name}<span class="tag">${g.tag}</span></h4><p>${g.intro}</p></div>`);
          }
        }
        res.innerHTML = out.length ? out.join("") : `<p class="muted">无匹配。</p>`;
        if (out.length) log("检索：" + kw);
      }
      $("#go").addEventListener("click", run);
      $("#q").addEventListener("keydown", (e) => { if (e.key === "Enter") run(); });
      $("#clear").addEventListener("click", () => { q.value = ""; res.innerHTML = ""; });
    });
  }
  function luoshuHTML() {
    const bodyRows = D.LUOSHU.body.map((r) =>
      `<tr><td style="color:var(--cinnabar-gold)">${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join("");
    return `<div class="result"><h4>洛书九宫 · 配数 + 人身造化</h4>
      <p>坎一 · 坤二 · 震三 · 巽四 · 中五 · 乾六 · 兑七 · 艮八 · 离九。</p>
      <table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:.82rem">
        <tr style="color:var(--txt-dim)"><td>人身造化</td><td>部位</td><td>卦象 → 数</td></tr>
        ${bodyRows}
      </table>
      <p style="margin-top:8px;color:var(--txt-dim)">取祖气路数：${D.LUOSHU.route}</p>
    </div>`;
  }
  function bodyMapHTML() {
    const bodyRows = D.LUOSHU.body.map((r) =>
      `<tr><td style="color:var(--cinnabar-gold)">${r[1]}</td><td>${r[0]}</td><td>${r[2]}</td></tr>`).join("");
    return `<div class="result"><h4>人身造化 · 卦象对照</h4>
      <p>人身即是酆都之城。</p>
      <table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:.82rem">
        <tr style="color:var(--txt-dim)"><td>部位</td><td>人身造化</td><td>卦象 → 数</td></tr>
        ${bodyRows}
      </table></div>`;
  }

  /* =====================================================================
   *  保险箱（九宫门 9381）
   * ===================================================================== */
  function renderVault() {
    const code = D.QUESTS.qa.code;
    let buf = "";
    const html = `
      <div class="vault">
        <div class="glyph">☰</div>
        <div class="code-disp" id="disp"></div>
        <div class="keypad" id="pad">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n) => `<button data-k="${n}">${n}</button>`).join("")}
        </div>
        <div class="msg" id="vmsg"></div>
        <button class="ex" id="vclr">清除</button>
      </div>`;
    showPage("保险箱 · 四位密码", html, () => {
      const disp = $("#disp"), msg = $("#vmsg");
      function draw() { disp.textContent = buf.padEnd(4, "·"); }
      $("#pad").addEventListener("click", (e) => {
        const b = e.target.closest("button[data-k]"); if (!b) return;
        if (buf.length < 4) buf += b.dataset.k; draw();
        if (buf.length === 4) {
          if (buf === code) {
            msg.className = "msg ok"; msg.textContent = "咔——锁开了。";
            solveQuest("qa");
            setTimeout(() => { location.href = "index.html"; }, 900);
          } else {
            msg.className = "msg err"; msg.textContent = "不对。";
            horror(1);
            buf = ""; setTimeout(draw, 600);
          }
        }
      });
      $("#vclr").addEventListener("click", () => { buf = ""; draw(); msg.textContent = ""; });
      draw();
    });
  }

  /* =====================================================================
   *  黑纸辨识（朱书 vs 白书）
   * ===================================================================== */
  function renderBW() {
    if (!S.qa) { showPage("黑纸辨识", `<p class="muted center" style="padding:40px">此处暂无可见之物。</p>`); return; }
    const p = D.QUESTS.qb;
    const html = `
      <p class="center" style="color:var(--txt-dim);margin-bottom:10px">${p.question}</p>
      <div class="bw">
        <div class="card" data-opt="A"><h5>${p.options[0].label}</h5>${svgZhuShu()}</div>
        <div class="card" data-opt="B"><h5>${p.options[1].label}</h5>${svgBaiShu()}</div>
      </div>
      <p class="msg center" id="bwmsg" style="margin-top:10px"></p>`;
    showPage("黑纸辨识 · 正法之辨", html, () => {
      $("#pageBody").querySelectorAll(".card").forEach((c) =>
        c.addEventListener("click", () => {
          const id = c.dataset.opt;
          const correct = p.options.find((o) => o.id === id).correct;
          const msg = $("#bwmsg");
          if (correct) {
            c.classList.add("sel");
            msg.className = "msg ok center"; msg.textContent = "正法。黑纸朱书——赤镇黑，以酒调砂。";
            solveQuest("qb");
            setTimeout(() => { location.href = "index.html"; }, 1000);
          } else {
            msg.className = "msg err center"; msg.textContent = "这是反法黑纸白书——骨粉养煞、从左往右画。";
            horror(2);
          }
        }));
    });
  }

  /* =====================================================================
   *  人身造化（映射门）
   * ===================================================================== */
  function renderQC() {
    if (!S.qb) { showPage("人身造化", `<p class="muted center" style="padding:40px">此处暂无可见之物。</p>`); return; }
    const p = D.QUESTS.qc;
    const html = `
      <p class="center" style="color:var(--txt-dim);margin-bottom:12px">${p.question}</p>
      <div class="bw one">
        ${p.options.map((o) => `<div class="card" data-opt="${o.id}"><h5>${o.label}</h5></div>`).join("")}
      </div>
      <p class="msg center" id="qcmsg" style="margin-top:10px"></p>`;
    showPage("人身造化 · 卦象之问", html, () => {
      $("#pageBody").querySelectorAll(".card").forEach((c) =>
        c.addEventListener("click", () => {
          const id = c.dataset.opt;
          const correct = p.options.find((o) => o.id === id).correct;
          const msg = $("#qcmsg");
          if (correct) {
            c.classList.add("sel");
            msg.className = "msg ok center"; msg.textContent = "坎一。谷道后门，水润北坎。人身即是酆都之城。";
            solveQuest("qc");
            setTimeout(() => { location.href = "index.html"; }, 1000);
          } else {
            msg.className = "msg err center"; msg.textContent = "不对。";
            horror(1);
          }
        }));
    });
  }

  /* =====================================================================
   *  笔记（公历 · 渐进解锁）
   * ===================================================================== */
  function renderNotes() {
    const list = D.DAILY_NOTES.map((c) => {
      const ok = S[c.unlock];
      if (ok) return `<div class="chap" data-n="${c.n}"><div class="n">${c.date}</div></div>`;
      return `<div class="chap locked"><div class="n">待解</div><div class="t muted">〔未启〕</div></div>`;
    }).join("");
    const html = `
      <div class="chaplist">${list}</div>
      <div id="chapHost"></div>`;
    showPage("刘希夷的笔记", html, () => {
      const host = $("#chapHost");
      document.querySelectorAll(".chap:not(.locked)").forEach((el) =>
        el.addEventListener("click", () => {
          const c = D.DAILY_NOTES.find((x) => x.n == el.dataset.n);
          host.innerHTML =
            `<div class="chap-body">
              <div class="meta">${c.date}</div>
              <p>${c.body}</p></div>`;
          if (S.read.indexOf(c.n) < 0) { S.read.push(c.n); store.save({ read: S.read }); }
          log("阅：" + c.date);
          checkDeath(); sync();
        }));
    });
  }

  /* =====================================================================
   *  朋友圈（公历 · 无年龄）
   * ===================================================================== */
  function renderMomentsHTML() {
    const cards = D.MOMENTS.map((m) => {
      const photo = m.photo ? `<img class="mo-photo" src="${m.photo}" alt="动态图" loading="lazy">` : "";
      return `<div class="mo-card">
        <div class="mo-head"><img class="mo-ava" src="${m.img}" alt="${m.who}" loading="lazy"><span class="mo-who">${m.who}</span><span class="mo-time">${m.time || ""}</span></div>
        <p class="mo-text">${m.text}</p>${photo}
      </div>`;
    }).join("");
    return `<div class="mo-feed">${cards}</div>`;
  }

  /* =====================================================================
   *  微信（wx.html）—— 私聊 / 群聊 / 朋友圈 三 tab
   * ===================================================================== */
  function renderWX() {
    const tab = S.wxTab || "chats";
    const tabs = [
      { id: "chats", nm: "私聊" },
      { id: "groups", nm: "群聊" },
      { id: "moments", nm: "朋友圈" },
    ];
    const tabBar = '<nav class="wx-tabbar">' +
      tabs.map((t) => `<a class="wx-tab ${t.id === tab ? "on" : ""}" data-tab="${t.id}" href="#${t.id}">${t.nm}</a>`).join("") +
      '</nav>';

    let body = "";
    if (tab === "chats") body = renderWXChatsHTML();
    else if (tab === "groups") body = renderWXGroupsHTML();
    else body = renderMomentsHTML();

    showPage("微信", tabBar + body, () => {
      document.querySelectorAll(".wx-tab").forEach((el) =>
        el.addEventListener("click", (e) => {
          e.preventDefault();
          S.wxTab = el.dataset.tab; store.save({ wxTab: S.wxTab });
          renderWX();
        }));
      document.querySelectorAll(".wx-chat-item").forEach((el) =>
        el.addEventListener("click", () => openWXChat(el.dataset.key)));
      document.querySelectorAll(".wx-group-item:not(.locked)").forEach((el) =>
        el.addEventListener("click", () => openWXGroup(el.dataset.id)));
    });
  }

  function renderWXChatsHTML() {
    // 修车师傅（王鉴）—— 永远置顶
    const wjMsgs = D.WANGJIAN.filter((m) => S.wj.indexOf(m.id) >= 0).sort((a, b) => a.id - b.id);
    const lastWJ = wjMsgs.length ? wjMsgs[wjMsgs.length - 1] : null;
    const wjPreview = lastWJ ? (lastWJ.text.length > 32 ? lastWJ.text.slice(0, 32) + "…" : lastWJ.text) : "（暂无消息）";
    const wjAva = D.PEOPLE["王鉴"].img
      ? `<img class="wx-ava" src="${D.PEOPLE["王鉴"].img}" alt="修车师傅" loading="lazy">`
      : `<div class="wx-ava wx-ava-fallback">🔧</div>`;
    const wjItem = `<div class="wx-chat-item" data-key="wj">
      ${wjAva}
      <div class="wx-chat-info">
        <div class="wx-chat-name">修车师傅</div>
        <div class="wx-chat-preview">${wjPreview.replace(/\n/g, " ")}</div>
      </div>
      <div class="wx-chat-meta">${lastWJ ? "在线" : ""}</div>
    </div>`;

    const dmItems = D.PRIVATE_MSGS.map((c) => {
      const last = c.msgs[c.msgs.length - 1];
      const preview = last.text.length > 32 ? last.text.slice(0, 32) + "…" : last.text;
      return `<div class="wx-chat-item" data-key="${c.with}">
        <img class="wx-ava" src="${c.img}" alt="${c.name}" loading="lazy">
        <div class="wx-chat-info">
          <div class="wx-chat-name">${c.name}</div>
          <div class="wx-chat-preview">${preview}</div>
        </div>
        <div class="wx-chat-meta">在线</div>
      </div>`;
    }).join("");

    return `<div class="wx-chat-list">${wjItem}${dmItems}</div>`;
  }

  function openWXChat(key) {
    if (key === "wj") {
      const msgs = D.WANGJIAN.filter((m) => S.wj.indexOf(m.id) >= 0).sort((a, b) => a.id - b.id);
      const wjAva = D.PEOPLE["王鉴"].img
        ? `<img class="wx-ava-sm" src="${D.PEOPLE["王鉴"].img}" alt="修车师傅" loading="lazy">`
        : `<div class="wx-ava-sm wx-ava-fallback">🔧</div>`;
      const bubbles = msgs.map((m) =>
        `<div class="wx-bubble">
          ${wjAva}
          <div class="wx-bubble-text">${m.text.replace(/\n/g, "<br/>")}</div>
        </div>`).join("");
      const html = `<div class="wx-chat-detail">
        <div class="wx-chat-header"><button class="wx-back" type="button">‹</button><span class="wx-chat-name">修车师傅</span></div>
        <div class="wx-bubbles">${bubbles || '<p class="muted center" style="padding:20px">暂无消息</p>'}</div>
      </div>`;
      showPage("修车师傅", html, () => {
        if (S.wjUnread > 0) { S.wjUnread = 0; store.save({ wjUnread: 0 }); sync(); }
        $(".wx-back").onclick = () => { S.wxTab = "chats"; renderWX(); };
      });
      return;
    }
    const c = D.PRIVATE_MSGS.find((x) => x.with === key);
    if (!c) return;
    const bubbles = c.msgs.map((m) => {
      const me = m.from === "我";
      const ava = me ? D.PEOPLE["刘希夷"].img : c.img;
      return `<div class="wx-bubble ${me ? "me" : ""}">
        <img class="wx-ava-sm" src="${ava}" alt="${m.from}" loading="lazy">
        <div class="wx-bubble-text">${m.text.replace(/\n/g, "<br/>")}</div>
      </div>`;
    }).join("");
    const photo = c.photo ? `<img class="wx-photo" src="${c.photo}" alt="共享图" loading="lazy">` : "";
    const html = `<div class="wx-chat-detail">
      <div class="wx-chat-header"><button class="wx-back" type="button">‹</button><span class="wx-chat-name">${c.name}</span></div>
      <div class="wx-bubbles">${bubbles}${photo}</div>
    </div>`;
    showPage(c.name, html, () => {
      $(".wx-back").onclick = () => { S.wxTab = "chats"; renderWX(); };
    });
  }

  function renderWXGroupsHTML() {
    const items = D.GROUP_CHATS.map((g) => {
      const ok = S[g.unlock];
      if (!ok) return `<div class="wx-group-item locked"><div class="wx-ava wx-ava-ghost">${g.name[0]}</div><div class="wx-chat-info"><div class="wx-chat-name">未启</div><div class="wx-chat-preview muted">〔未启〕</div></div><div class="wx-chat-meta"></div></div>`;
      const last = g.msgs[g.msgs.length - 1];
      const preview = last.text.length > 32 ? last.text.slice(0, 32) + "…" : last.text;
      return `<div class="wx-group-item" data-id="${g.id}">
        <div class="wx-ava wx-ava-ghost">${g.name[0]}</div>
        <div class="wx-chat-info">
          <div class="wx-chat-name">${g.name}</div>
          <div class="wx-chat-preview">${preview}</div>
        </div>
        <div class="wx-chat-meta">${g.msgs.length}</div>
      </div>`;
    }).join("");
    return `<div class="wx-chat-list">${items}</div>`;
  }

  function openWXGroup(id) {
    const g = D.GROUP_CHATS.find((x) => x.id === id);
    if (!g) return;
    // 群聊网名 → 真实人物映射（v8：去掉 A-E 代名）
    const FROM_PEOPLE = { "巴代路遥": "麻三", "灵宝千寻": "孙师", "西河老贾": "贾生", "奇门迟": "迟浩亮", "桐凤斋": "沈佳诚", "我": "刘希夷", "群主": "黑律叛师" };
    const lines = g.msgs.map((m) => {
      const personKey = FROM_PEOPLE[m.from] || null;
      const ava = personKey ? ((D.PEOPLE[personKey] || {}).img || "") : "";
      return `<div class="wx-bubble ${m.from === "我" ? "me" : ""}">
        <img class="wx-ava-sm" src="${ava}" alt="${m.from}" loading="lazy" onerror="this.style.visibility='hidden'">
        <div class="wx-bubble-text"><span class="wx-bubble-who">${m.from}</span>${m.text}</div>
      </div>`;
    }).join("");
    const html = `<div class="wx-chat-detail">
      <div class="wx-chat-header"><button class="wx-back" type="button">‹</button><span class="wx-chat-name">${g.name}</span></div>
      <div class="wx-group-intro muted">${g.intro}</div>
      <div class="wx-bubbles">${lines}</div>
    </div>`;
    showPage(g.name, html, () => {
      $(".wx-back").onclick = () => { S.wxTab = "groups"; renderWX(); };
    });
  }
  // 群聊网名 → 真实人物映射（v8：去掉 A-E 代名，参见 FROM_PEOPLE）
  // const A_TO_NAME = { A: "麻三", B: "孙师", C: "贾生", D: "迟浩亮", E: "沈佳诚", 群主: "黑律叛师", "道友·甲": "", "道友·乙": "", "道友·丙": "" };

  /* =====================================================================
   *  新闻流（含沈某投稿 → 已阅·继续 触发真相浮窗）
   * ===================================================================== */
  function renderNews() {
    const items = (D.NEWS || []).map((n, idx) => {
      const isShen = idx === (D.NEWS.length - 1);
      const continueBtn = isShen
        ? '<div class="news-sentinel"><button class="news-continue" id="shenContinue" type="button">已阅 · 继续 →</button></div>'
        : "";
      return `<div class="news-item">
        <div class="news-src">${n.src}<span class="news-tag">${n.tag || ""}</span></div>
        ${n.date ? '<div class="news-date muted">' + n.date + '</div>' : ''}
        <h4 class="news-title">${n.title}</h4>
        <p class="news-text">${n.text.replace(/\n/g, "<br/>")}</p>
        ${continueBtn}
      </div>`;
    }).join("");
    showPage("新闻 · 残存剪报", `<div class="news-feed">${items}</div>`, () => {
      const btn = document.getElementById("shenContinue");
      if (!btn) return;
      btn.onclick = () => {
        S.shenRead = true; store.save({ shenRead: true });
        showTruthModal();
      };
    });
  }

  /* =====================================================================
   *  真相浮窗（modal · 沈某投稿末尾触发 · 直接访问 truth.html 弹窗）
   * ===================================================================== */
  function norm(s) { return (s || "").replace(/\s+/g, "").trim(); }
  function showTruthModal() {
    if (document.getElementById("truth-modal")) return;
    const modal = document.createElement("div");
    modal.id = "truth-modal";
    modal.className = "truth-modal-overlay";
    const card = document.createElement("div");
    card.className = "truth-modal-card";
    if (S.truth) {
      card.innerHTML =
        '<button class="truth-modal-close" type="button" aria-label="关闭">×</button>' +
        '<div class="truth-modal-content">' +
          '<div class="truth-seal">印 · 已解</div>' +
          '<pre class="truth-text">' + D.TRUTH.reveal + '</pre>' +
        '</div>';
    } else {
      const flds = D.TRUTH.fields.map((f, i) =>
        '<div class="truth-row">' +
          '<label>' + f.key + (f.age != null ? " · 约" + f.age + "岁" : "") + '</label>' +
          '<input class="truth-in" id="tk' + i + '" autocomplete="off" />' +
        '</div>').join("");
      card.innerHTML =
        '<button class="truth-modal-close" type="button" aria-label="关闭">×</button>' +
        '<div class="truth-modal-content">' +
          '<p class="truth-prompt">' + D.TRUTH.prompt + '</p>' +
          '<p class="truth-hint muted">' + D.TRUTH.hint + '</p>' +
          '<div class="truth-fields">' + flds + '</div>' +
          '<button id="tkGo" type="button">解 锁</button>' +
          '<p class="truth-msg" id="tkMsg"></p>' +
        '</div>';
    }
    modal.appendChild(card);
    document.body.appendChild(modal);
    card.querySelector(".truth-modal-close").onclick = (e) => { e.stopPropagation(); modal.remove(); };
    if (!S.truth) {
      modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });
    }
    if (!S.truth) {
      card.querySelector("#tkGo").onclick = () => {
        const got = D.TRUTH.fields.map((_, i) => norm(card.querySelector("#tk" + i).value));
        const ok = got.length === D.TRUTH.answers.length &&
          got.every((g, i) => g === norm(D.TRUTH.answers[i]));
        if (ok) {
          S.truth = true; store.save({ truth: true });
          horror(3);
          modal.remove();
          showTruthModal();
        } else {
          const m = card.querySelector("#tkMsg");
          m.className = "truth-msg err"; m.textContent = "不对。生辰对不上。";
          horror(2);
        }
      };
    } else {
      horror(3);
    }
  }
  function renderTruth() {
    const host = $("#pageBody"); if (host) host.innerHTML = "";
    showTruthModal();
  }

  /* =====================================================================
   *  论坛（开放浏览 · 已知账号仅路遥）
   * ===================================================================== */
  function renderForum() {
    const k = D.FORUM.known;
    const knownCard =
      '<div class="forum-known">' +
        '<div class="forum-known-title">已知账号</div>' +
        '<div class="forum-known-row"><span class="lbl">WeChat</span><code>' + k.wechat + '</code></div>' +
        '<div class="forum-known-row"><span class="lbl">昵称</span>' + k.name + '</div>' +
        '<div class="forum-known-row"><span class="lbl">真名</span>' + k.realName + '</div>' +
        '<div class="forum-known-row"><span class="lbl">生日</span>' + k.birthday + '</div>' +
        '<div class="forum-known-row"><span class="lbl">密码</span><code>' + k.password + '</code></div>' +
        '<div class="forum-known-note muted">' + k.note + '</div>' +
      '</div>';
    const list = (D.FORUM.threads || []).map((t) =>
      '<div class="forum-thread-item" data-id="' + t.id + '">' +
        '<div class="forum-thread-title">' + t.title + '</div>' +
        '<div class="forum-thread-meta">' +
          '<span>' + t.author + '</span>' +
          '<span>' + t.time + '</span>' +
          '<span>· ' + t.replies + ' 帖</span>' +
        '</div>' +
      '</div>').join("");
    const html =
      '<div class="forum-wrap">' +
        knownCard +
        '<div class="forum-thread-list">' + list + '</div>' +
        '<div id="forumThreadHost"></div>' +
      '</div>';
    showPage("论坛 · 同道杂谈", html, () => {
      document.querySelectorAll(".forum-thread-item").forEach((el) =>
        el.addEventListener("click", () => {
          const t = D.FORUM.threads.find((x) => x.id === el.dataset.id);
          const posts = (t.posts || []).map((p) =>
            '<div class="forum-post">' +
              '<div class="forum-post-head"><span class="forum-post-who">' + p.who + '</span><span class="forum-post-time">' + p.time + '</span></div>' +
              '<div class="forum-post-text">' + p.text + '</div>' +
            '</div>').join("");
          $("#forumThreadHost").innerHTML =
            '<div class="forum-thread-detail">' +
              '<h4>' + t.title + '</h4>' +
              '<div class="forum-thread-meta" style="margin-bottom:12px">' +
                '<span>' + t.author + '</span>' +
                '<span>' + t.time + '</span>' +
                '<span>· ' + t.replies + ' 帖</span>' +
              '</div>' +
              posts +
            '</div>';
          window.scrollTo(0, document.body.scrollHeight);
        }));
    });
  }

  /* =====================================================================
   *  SVG 占位（黑纸辨识 · 朱书 / 白书）
   * ===================================================================== */
  function svgZhuShu() { return `<svg viewBox="0 0 100 120"><rect width="100" height="120" fill="var(--fan-paper)"/><path d="M50 14 V108 M28 26 H72 M36 44 H64 M32 62 H68 M44 84 H56" stroke="var(--cinnabar)" stroke-width="3" fill="none"/><text x="50" y="34" font-size="11" fill="var(--cinnabar)" text-anchor="middle">应水火雷铁</text></svg>`; }
  function svgBaiShu() { return `<svg viewBox="0 0 100 120"><rect width="100" height="120" fill="var(--anti-paper)"/><path d="M30 108 V14 M72 96 H28 M64 78 H36 M68 60 H32 M56 38 H44" stroke="var(--can-bai)" stroke-width="2.4" fill="none" stroke-dasharray="2 2"/></svg>`; }

  /* =====================================================================
   *  启动
   * ===================================================================== */
  const APPS = [
    { id: "search", ico: "🔍", nm: "检索", gate: "", href: "search.html" },
    { id: "vault", ico: "🔒", nm: "保险箱", gate: "", href: "vault.html" },
    { id: "bw", ico: "📜", nm: "黑纸辨识", gate: "qa", href: "bw.html" },
    { id: "qc", ico: "☯", nm: "人身造化", gate: "qb", href: "qc.html" },
    { id: "notes", ico: "📓", nm: "笔记", gate: "", href: "notes.html" },
    { id: "wx", ico: "💬", nm: "微信", gate: "", href: "wx.html" },
    { id: "forum", ico: "💭", nm: "论坛", gate: "", href: "forum.html" },
    { id: "news", ico: "📰", nm: "新闻", gate: "", href: "news.html" },
  ];
  function initHub() {
    const grid = $("#appgrid");
    grid.innerHTML = APPS.map((a) =>
      `<a class="app" data-id="${a.id}" data-gate="${a.gate}" href="${a.href}"><div class="ico">${a.ico}</div><div class="nm">${a.nm}</div></a>`).join("");
    grid.querySelectorAll(".app").forEach((el) => {
      el.addEventListener("click", (e) => {
        const a = APPS.find((x) => x.id === el.dataset.id);
        const g = a.gate;
        const ok = g === "" || (g === "qa" && S.qa) || (g === "qb" && S.qb) || (g === "qc" && S.qc);
        if (!ok) { e.preventDefault(); log("「" + a.nm + "」尚不可入。"); return; }
      });
    });
    $("#btnAudio") && $("#btnAudio").addEventListener("click", () => setAudio(!S.audio));
    $("#btnFx") && $("#btnFx").addEventListener("click", () => setFx(!S.fx));
    $("#btnReset") && $("#btnReset").addEventListener("click", clearData);
    setInterval(() => { const d = new Date(); $("#sbClock").textContent = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }, 1000);
    $("#sbClock").textContent = "--:--";
    sync();
    if (S.death) { buildBreaking(false); log("终局已至。"); return; }
    log("数据恢复完成。");
    ensureBoot();
    checkDeath();
  }
  function initPage(page) {
    ensureBoot();
    if (S.death) buildBreaking(false);
    const map = {
      search: renderSearch, vault: renderVault, bw: renderBW, qc: renderQC,
      notes: renderNotes, news: renderNews, forum: renderForum, truth: renderTruth,
      wx: renderWX,
    };
    if (map[page]) map[page]();
    sync();
  }

  if (PAGE === "hub") initHub(); else initPage(PAGE);
})();
