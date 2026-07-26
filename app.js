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
    { qa: false, qb: false, qc: false, read: [], wj: [], wjUnread: 0, audio: true, fx: true, bled: [], death: false, truth: false, bkShown: false, shenRead: false, forumUnlocked: false, shenUnlocked: false, wjProtectDismissed: [], wxTab: "chats", spooked: false, nineSolved: false },
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

  /* ---------- 恐怖特效 + 音频（真实音效优先，缺失回退合成） ---------- */
  let AC = null, drone = null, droneGain = null;
  // 真实音效清单：将对应 mp3 放入 assets/audio/ 即自动启用，缺失则回退 Web Audio 合成
  const SOUNDS = {
    ambient:   "assets/audio/ambient.mp3",   // 低频环境 drone（循环）
    stingHigh: "assets/audio/sting-high.mp3", // 终局 / 强冲击
    stingMid:  "assets/audio/sting-mid.mp3",  // 中冲击
    stingLow:  "assets/audio/sting-low.mp3",  // 轻触发
    glass:     "assets/audio/glass.mp3",      // 碎屏裂响
    whisper:   "assets/audio/whisper.mp3"    // 可选低语
  };
  const AUDIO_FILES = { _init: false };
  function initAudioFiles() {
    if (AUDIO_FILES._init) return; AUDIO_FILES._init = true;
    Object.keys(SOUNDS).forEach((k) => {
      const a = new Audio();
      a.preload = "auto"; a.loop = (k === "ambient");
      a.volume = (k === "ambient") ? 0.5 : 0.9;
      a.addEventListener("canplaythrough", () => { AUDIO_FILES[k] = a; }, { once: true });
      a.addEventListener("error", () => { AUDIO_FILES[k] = null; }, { once: true });
      a.src = SOUNDS[k]; AUDIO_FILES[k] = null;
    });
  }
  function playReal(k, opts) {
    opts = opts || {};
    const a = AUDIO_FILES[k];
    if (!a) return false;
    try {
      if (opts.volume != null) a.volume = opts.volume;
      a.loop = !!opts.loop; a.currentTime = 0;
      const p = a.play(); if (p && p.catch) p.catch(function () {});
      return true;
    } catch (e) { return false; }
  }
  function ensureAudio() {
    if (!AC) { const C = window.AudioContext || window.webkitAudioContext; if (C) AC = new C(); }
    if (AC && AC.state === "suspended") AC.resume();
    initAudioFiles();
  }
  function startDrone() {
    if (playReal("ambient", { loop: true, volume: 0.5 })) { drone = { real: true }; return; }
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
    if (drone && drone.real) {
      const a = AUDIO_FILES.ambient;
      if (a) { try { a.pause(); a.currentTime = 0; } catch (e) {} }
      drone = null; return;
    }
    if (!drone) return;
    droneGain.gain.linearRampToValueAtTime(0, AC.currentTime + 1.0);
    const d = drone; setTimeout(function () { Object.values(d).forEach(function (n) { try { n.stop(); } catch (e) {} }); }, 1100);
    drone = null; droneGain = null;
  }
  function sting(level) {
    const slot = level >= 3 ? "stingHigh" : level === 2 ? "stingMid" : "stingLow";
    if (playReal(slot)) return;
    if (!AC) return;
    const t = AC.currentTime;
    const base = 170 + level * 38;
    const freqs = [base, base * 1.059, base * 1.5, base * 1.5 * 1.041];
    const g = AC.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.17, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);
    g.connect(AC.destination);
    freqs.forEach(function (f) { const o = AC.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.connect(g); o.start(t); o.stop(t + 0.95); });
    const n = AC.createOscillator(); n.type = "sine";
    n.frequency.setValueAtTime(95, t); n.frequency.exponentialRampToValueAtTime(38, t + 0.8);
    n.connect(g); n.start(t); n.stop(t + 0.9);
  }
  function playUnlock() {
    if (!S.audio) return;
    ensureAudio(); if (!AC) return;
    const t = AC.currentTime;
    const notes = [880, 1318.5]; // A5 → E6，类 iOS 解锁上行双音
    notes.forEach((f, i) => {
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = "sine"; o.frequency.value = f;
      const tt = t + i * 0.09;
      g.gain.setValueAtTime(0.0001, tt);
      g.gain.exponentialRampToValueAtTime(0.22, tt + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.42);
      o.connect(g); g.connect(AC.destination);
      o.start(tt); o.stop(tt + 0.44);
    });
  }
  function playError() {
    if (!S.audio) return;
    ensureAudio(); if (!AC) return;
    const t = AC.currentTime;
    // 类 iOS 密码错误：两声下行低方波 buzz
    [0, 0.22].forEach((off, i) => {
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = "square"; o.frequency.value = i ? 160 : 200;
      const tt = t + off;
      g.gain.setValueAtTime(0.0001, tt);
      g.gain.exponentialRampToValueAtTime(0.16, tt + 0.01);
      g.gain.setValueAtTime(0.16, tt + 0.1);
      g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.16);
      o.connect(g); g.connect(AC.destination);
      o.start(tt); o.stop(tt + 0.18);
    });
  }
  function horror(level) {
    if (!S.fx) return;
    const cls = reduceMotion ? ["fx-vignette"] : ["fx-vignette", "fx-glitch", "fx-flicker"];
    if (level >= 2 && !reduceMotion) cls.push("fx-signal");
    document.body.classList.add(...cls);
    if (level >= 3) { screenShatter(); if (S.audio) playReal("glass"); }
    if (S.audio) sting(level);
    if (level >= 2 && !reduceMotion) {
      let sig = document.getElementById("fxSignal");
      if (!sig) { sig = document.createElement("div"); sig.id = "fxSignal"; document.body.appendChild(sig); }
      sig.classList.remove("go"); void sig.offsetWidth; sig.classList.add("go");
      setTimeout(() => sig.classList.remove("go"), 600);
    }
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
    const cx = 47, cy = 45;
    let svg = document.getElementById("shatter");
    if (!svg) {
      svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.id = "shatter";
      svg.setAttribute("viewBox", "0 0 100 100");
      svg.setAttribute("preserveAspectRatio", "none");
      const rings = [4.5, 11, 19].map((r, i) =>
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="rgba(232,238,244,.5)" stroke-width="' + (0.5 - i * 0.08) + '"/>').join("");
      let shards = "";
      const N = 22;
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2 + (i % 2 ? 0.12 : -0.08);
        const len = 30 + ((i * 13) % 60);
        const x2 = cx + Math.cos(a) * len, y2 = cy + Math.sin(a) * len;
        const sx = cx + Math.cos(a) * 4, sy = cy + Math.sin(a) * 4;
        shards += '<path d="M' + sx.toFixed(1) + ' ' + sy.toFixed(1) + ' L' + x2.toFixed(1) + ' ' + y2.toFixed(1) + '" stroke="rgba(230,236,242,.82)" stroke-width="' + (0.6 - (i % 3) * 0.12).toFixed(2) + '" fill="none" stroke-linecap="round"/>';
        const a2 = a + 0.18, l2 = len * 0.55;
        shards += '<path d="M' + x2.toFixed(1) + ' ' + y2.toFixed(1) + ' L' + (x2 + Math.cos(a2) * l2).toFixed(1) + ' ' + (y2 + Math.sin(a2) * l2).toFixed(1) + '" stroke="rgba(220,228,238,.5)" stroke-width=".3" fill="none"/>';
      }
      const frags = [[6, 8], [92, 12], [14, 86], [88, 82], [50, 4], [96, 50], [3, 52]]
        .map((p) => '<polygon points="' + p[0] + ',' + p[1] + ' ' + (p[0] + 5) + ',' + (p[1] + 3) + ' ' + (p[0] + 2) + ',' + (p[1] + 7) + ' ' + (p[0] - 3) + ',' + (p[1] + 4) + '" fill="rgba(235,240,246,.35)"/>').join("");
      svg.innerHTML = rings + shards + frags + '<circle cx="' + cx + '" cy="' + cy + '" r="2.2" fill="rgba(255,255,255,.92)"/>';
      document.body.appendChild(svg);
    }
    svg.classList.remove("go"); void svg.offsetWidth; svg.classList.add("go");
    let flash = document.getElementById("shatterFlash");
    if (!flash) { flash = document.createElement("div"); flash.id = "shatterFlash"; document.body.appendChild(flash); }
    flash.classList.remove("go"); void flash.offsetWidth; flash.classList.add("go");
    setTimeout(() => { svg.classList.remove("go"); flash.classList.remove("go"); }, 1500);
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
          '<button id="bkUnlock" type="button" class="unlock-btn">解锁 · 九宫归将</button>' +
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
      const unlock = document.getElementById("bkUnlock");
      if (share) share.onclick = () => doShare(
        (D.META && D.META.title) + "\n" + H.title + "\n——一部无人认领的手机里，藏着这件事的另一端。");
      if (close) close.onclick = () => overlay.remove();
      if (unlock) unlock.onclick = () => { overlay.remove(); openNinePalace(); };
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
    if (!S.truth) return;
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
   *  v9(i) · 九宫图解锁（八卦与八将对应）
   * ===================================================================== */
  let nineSelected = null; // 当前选中的将名 chip id
  let ninePlaced = {};     // { "0,0": "车", "0,1": "王", ... }
  function openNinePalace() {
    if (S.nineSolved) {
      // 已解开：直接跳新闻沈某投稿
      location.href = "news.html#shen";
      return;
    }
    if (document.getElementById("nine-modal")) return;
    const N = D.NINE_PALACE;
    const cells = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const cell = N.grid[r][c];
        const gua = cell.gua || "中";
        cells.push(
          '<div class="palace-cell' + (cell.general ? "" : " center-cell") + '" data-r="' + r + '" data-c="' + c + '" data-expected="' + (cell.general || "") + '">' +
            '<div class="gua">' + gua + '</div>' +
            '<div class="slot" data-r="' + r + '" data-c="' + c + '"></div>' +
          '</div>'
        );
      }
    }
    const pool = N.pool.map((g) =>
      '<div class="general-chip" draggable="false" data-id="' + g.id + '">' +
        '<div class="gname">' + g.name + '</div>' +
      '</div>'
    ).join("");
    const incant = D.SUMMON_INCANTATION.rows.map((row) =>
      '<div class="summon-row">' + row.general + '</div>'
    ).join("");
    const modal = document.createElement("div");
    modal.id = "nine-modal";
    modal.className = "nine-modal";
    modal.innerHTML =
      '<div class="nine-card">' +
        '<div class="nine-head">' +
          '<div class="nine-title">' + N.title + '</div>' +
          '<div class="nine-intro">' + N.intro + '</div>' +
          '<button class="nine-close" type="button">×</button>' +
        '</div>' +
        '<div class="nine-body">' +
          '<div class="nine-palace">' + cells.join("") + '</div>' +
          '<div class="nine-side">' +
            '<div class="pool">' + pool + '</div>' +
            '<div class="summon-panel"><div class="summon-title">' + D.SUMMON_INCANTATION.title + '</div>' + incant + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="nine-foot">' +
          '<div class="nine-msg" id="nineMsg">提示：拖动将名到对应宫位，或先点将名再点宫位。</div>' +
          '<button class="nine-reset" type="button">重置</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    if (S.audio) { ensureAudio(); sting(2); }
    wireNinePalace();
  }
  function wireNinePalace() {
    const modal = document.getElementById("nine-modal");
    if (!modal) return;
    modal.querySelector(".nine-close").onclick = () => modal.remove();
    modal.querySelector(".nine-reset").onclick = () => {
      nineSelected = null; ninePlaced = {};
      modal.querySelectorAll(".slot").forEach((s) => { s.innerHTML = ""; s.classList.remove("filled", "wrong"); });
      modal.querySelectorAll(".general-chip").forEach((c) => { c.classList.remove("selected", "placed"); });
      setNineMsg("已重置。");
    };
    // chip 点击 / 拖拽（pointer 统一：鼠标+触摸）
    modal.querySelectorAll(".general-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        if (chip._drag && chip._drag.dragged) { chip._drag.dragged = false; return; }
        const id = chip.dataset.id;
        // 已放置的 chip：点击收回
        if (chip.classList.contains("placed")) {
          const key = Object.keys(ninePlaced).find((k) => ninePlaced[k] === id);
          if (key) {
            delete ninePlaced[key];
            const [r, c] = key.split(",");
            const slot = modal.querySelector('.slot[data-r="' + r + '"][data-c="' + c + '"]');
            if (slot) { slot.innerHTML = ""; slot.classList.remove("filled", "wrong"); }
          }
          chip.classList.remove("placed");
          nineSelected = null;
          modal.querySelectorAll(".general-chip").forEach((c) => c.classList.remove("selected"));
          setNineMsg("已收回 " + id + " 帅。");
          return;
        }
        // 选中态切换
        if (nineSelected === id) { nineSelected = null; chip.classList.remove("selected"); return; }
        modal.querySelectorAll(".general-chip").forEach((c) => c.classList.remove("selected"));
        nineSelected = id;
        chip.classList.add("selected");
        setNineMsg("已选中 " + id + " 帅。点选目标宫位。");
      });

      chip.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        const pid = e.pointerId;
        try { chip.setPointerCapture(pid); } catch (_) {}
        chip._drag = { pid, startX: e.clientX, startY: e.clientY, dragging: false, dragged: false, ghost: null };
        const onMove = (ev) => {
          if (ev.pointerId !== pid || !chip._drag) return;
          const d = chip._drag;
          if (!d.dragging) {
            const dist = Math.hypot(ev.clientX - d.startX, ev.clientY - d.startY);
            if (dist < 10) return;
            d.dragging = true;
            const rect = chip.getBoundingClientRect();
            const ghost = document.createElement("div");
            ghost.className = "nine-ghost";
            ghost.textContent = chip.querySelector(".gname").textContent;
            ghost.style.left = rect.left + "px";
            ghost.style.top = rect.top + "px";
            ghost.style.width = rect.width + "px";
            ghost.style.height = rect.height + "px";
            document.body.appendChild(ghost);
            d.ghost = ghost;
            chip.classList.add("dragging");
          }
          if (d.ghost) {
            d.ghost.style.transform = "translate(" + (ev.clientX - d.startX) + "px, " + (ev.clientY - d.startY) + "px)";
          }
        };
        const onUp = (ev) => {
          if (ev.pointerId !== pid || !chip._drag) return;
          const d = chip._drag;
          try { chip.releasePointerCapture(pid); } catch (_) {}
          chip.removeEventListener("pointermove", onMove);
          chip.removeEventListener("pointerup", onUp);
          chip.removeEventListener("pointercancel", onUp);
          if (d.dragging) {
            chip.classList.remove("dragging");
            if (d.ghost) d.ghost.remove();
            d.dragged = true;
            // 找落点
            const target = document.elementFromPoint(ev.clientX, ev.clientY);
            const cell = target && target.closest(".palace-cell");
            if (cell) {
              const r = cell.dataset.r, c = cell.dataset.c;
              placeNine(modal, r, c, chip.dataset.id);
            }
          }
          // 保留 _drag 到 click 判定后由 click 清理
        };
        chip.addEventListener("pointermove", onMove);
        chip.addEventListener("pointerup", onUp);
        chip.addEventListener("pointercancel", onUp);
      });
    });
    // cell 点击（tap-to-place 兜底）
    modal.querySelectorAll(".palace-cell").forEach((cell) => {
      cell.addEventListener("click", () => {
        if (!nineSelected) return;
        const r = cell.dataset.r, c = cell.dataset.c;
        placeNine(modal, r, c, nineSelected);
      });
    });
  }
  function placeNine(modal, r, c, id) {
    const cell = modal.querySelector('.palace-cell[data-r="' + r + '"][data-c="' + c + '"]');
    if (!cell) return;
    const expected = cell.dataset.expected;
    // 中央宫不接受
    if (!expected) {
      setNineMsg("中央为空，不归将。");
      return;
    }
    // 该格已有将 → 先清掉旧 chip 的 placed 态
    const slot = cell.querySelector(".slot");
    if (ninePlaced[r + "," + c]) {
      const oldId = ninePlaced[r + "," + c];
      const oldChip = modal.querySelector('.general-chip[data-id="' + oldId + '"]');
      if (oldChip) oldChip.classList.remove("placed");
    }
    // 该将已在别处 → 清除旧格
    const oldKey = Object.keys(ninePlaced).find((k) => ninePlaced[k] === id);
    if (oldKey) {
      delete ninePlaced[oldKey];
      const [or, oc] = oldKey.split(",");
      const oldSlot = modal.querySelector('.slot[data-r="' + or + '"][data-c="' + oc + '"]');
      if (oldSlot) { oldSlot.innerHTML = ""; oldSlot.classList.remove("filled", "wrong"); }
    }
    // 放置
    ninePlaced[r + "," + c] = id;
    slot.innerHTML = '<div class="placed-name">' + id + '</div>';
    slot.classList.add("filled");
    const chip = modal.querySelector('.general-chip[data-id="' + id + '"]');
    if (chip) { chip.classList.add("placed"); chip.classList.remove("selected"); }
    nineSelected = null;
    // 判定：是否正确
    if (id !== expected) {
      slot.classList.add("wrong");
      setNineMsg(id + " 帅不在此宫。再试。", true);
      if (S.audio) { ensureAudio(); playReal("stingLow"); }
      return;
    }
    slot.classList.remove("wrong");
    setNineMsg(id + " 帅归位。");
    if (S.audio) { ensureAudio(); playReal("stingLow"); }
    // 检查是否全部归位
    if (Object.keys(ninePlaced).length === 8 && Object.keys(ninePlaced).every((k) => ninePlaced[k] === modal.querySelector('.palace-cell[data-r="' + k.split(",")[0] + '"][data-c="' + k.split(",")[1] + '"]').dataset.expected)) {
      nineSuccess(modal);
    }
  }
  function setNineMsg(t, err) {
    const m = document.getElementById("nineMsg");
    if (!m) return;
    m.textContent = t;
    m.className = "nine-msg" + (err ? " err" : "");
  }
  function nineSuccess(modal) {
    setNineMsg("八将归位。法脉完整。");
    if (S.audio) { ensureAudio(); sting(3); }
    S.nineSolved = true; S.shenUnlocked = true;
    store.save({ nineSolved: true, shenUnlocked: true });
      setTimeout(() => {
        modal.classList.add("success");
        setTimeout(() => {
          modal.remove();
          location.href = "news.html#shen";
        }, 900);
      }, 700);
  }

  /* =====================================================================
   *  v9(i) · 恐怖特效序列（沈某帖后首次检索触发）
   * ===================================================================== */
  function maybeTriggerHorror(personKey) {
    if (!S.shenRead) return;        // 沈某帖还没读
    if (S.spooked) return;          // 已受保护
    if (!D.HORROR_PEOPLE || D.HORROR_PEOPLE.indexOf(personKey) < 0) return;
    S.spooked = true;               // 锁住，避免重复触发
    store.save({ spooked: true });
    runHorrorSequence(personKey);
  }
  function runHorrorSequence(personKey) {
    const body = document.body;
    const person = D.PEOPLE && D.PEOPLE[personKey];
    const imgSrc = person && person.img ? person.img : "";

    // 构建全屏恐怖层：黑底 + 中央照片 + 随机文字
    const backdrop = document.createElement("div");
    backdrop.id = "horror-backdrop";
    backdrop.className = "horror-backdrop";

    const portrait = document.createElement("img");
    portrait.className = "horror-portrait";
    portrait.src = imgSrc;
    portrait.alt = personKey || "";
    backdrop.appendChild(portrait);

    // 随机铺满“你们都要死”
    const TEXT = "你们都要死";
    const count = window.innerWidth < 720 ? 60 : 110;
    for (let i = 0; i < count; i++) {
      const span = document.createElement("span");
      span.className = "horror-text";
      span.textContent = TEXT;
      const size = 0.85 + Math.random() * 2.6;
      const rot = -28 + Math.random() * 56;
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      const delay = 0.25 + Math.random() * 2.4;
      span.style.cssText =
        "top:" + top.toFixed(2) + "%;" +
        "left:" + left.toFixed(2) + "%;" +
        "font-size:" + size.toFixed(2) + "rem;" +
        "transform:translate(-50%,-50%) rotate(" + rot.toFixed(1) + "deg);" +
        "animation-delay:" + delay.toFixed(2) + "s;";
      backdrop.appendChild(span);
    }
    document.body.appendChild(backdrop);

    // 1. 剧烈摇晃 + 高音频
    body.classList.add("fx-shake-violent");
    if (S.audio) { ensureAudio(); playReal("stingHigh"); }

    // 2. 中央照片浮现 + 流血 + 诡异笑
    setTimeout(() => {
      portrait.classList.add("fx-bleed-eyes", "fx-uncanny-smile");
      if (S.audio) { ensureAudio(); playReal("stingMid"); }
    }, 220);

    // 3. 文字铺满后，系统崩坏 modal 闪现
    setTimeout(() => {
      showSystemCorruptModal();
      if (S.audio) { ensureAudio(); playReal("glass"); }
    }, 4200);

    // 4. 停止摇晃、移除崩坏 modal，文字与照片保持
    setTimeout(() => {
      body.classList.remove("fx-shake-violent");
      const sc = document.getElementById("sys-corrupt-modal");
      if (sc) sc.remove();
    }, 6000);

    // 5. 王鉴问答出场（等文字铺满并停留后再出）
    setTimeout(() => {
      showWangjianQuestionModal();
    }, 7400);
  }
  function showSystemCorruptModal() {
    if (document.getElementById("sys-corrupt-modal")) return;
    const m = document.createElement("div");
    m.id = "sys-corrupt-modal";
    m.className = "fx-system-corrupt";
    m.innerHTML =
      '<div class="sys-corrupt-card">' +
        '<div class="sys-corrupt-title">⚠ 系统崩坏</div>' +
        '<div class="sys-corrupt-text">身份校验失败。<br/>法脉已污染。<br/>所有同道——</div>' +
      '</div>';
    document.body.appendChild(m);
    if (S.audio) { ensureAudio(); playReal("glass"); }
  }
  function clearHorrorEffects() {
    document.body.classList.remove("fx-shake-violent", "fx-red-flood");
    const bd = document.getElementById("horror-backdrop");
    if (bd) bd.remove();
    document.querySelectorAll(".fx-bleed-eyes, .fx-uncanny-smile").forEach((el) => el.classList.remove("fx-bleed-eyes", "fx-uncanny-smile"));
    const sc = document.getElementById("sys-corrupt-modal"); if (sc) sc.remove();
  }
  function showWangjianQuestionModal() {
    if (document.getElementById("wj-question-modal")) return;
    const m = document.createElement("div");
    m.id = "wj-question-modal";
    m.className = "wangjian-question";
    m.innerHTML =
      '<div class="wj-question-card">' +
        '<div class="wj-question-from">修车师傅 · 王鉴</div>' +
        '<div class="wj-question-text">你可知我是谁？</div>' +
        '<input id="wjAns" placeholder="请回答" autocomplete="off" />' +
        '<div class="wj-question-msg err" id="wjAnsMsg"></div>' +
        '<button id="wjAnsGo" type="button">确认</button>' +
      '</div>';
    document.body.appendChild(m);
    if (S.audio) { ensureAudio(); sting(1); }
    const inp = document.getElementById("wjAns");
    const go = document.getElementById("wjAnsGo");
    const msg = document.getElementById("wjAnsMsg");
    const tryAns = () => {
      const v = (inp.value || "").replace(/\s+/g, "").toLowerCase();
      const ok = (D.HORROR_ANSWERS || []).some((a) => a.replace(/\s+/g, "").toLowerCase() === v);
      if (!v) { msg.textContent = "请回答。"; return; }
      if (ok) {
        msg.className = "wj-question-msg ok"; msg.textContent = "你答对了。";
        clearHorrorEffects();
        setTimeout(() => {
          m.remove();
          showWangjianProtectModal();
        }, 600);
      } else {
        msg.textContent = "不对。";
        m.classList.add("shake-err");
        setTimeout(() => m.classList.remove("shake-err"), 400);
        if (S.audio) { ensureAudio(); playReal("stingMid"); }
      }
    };
    go.onclick = tryAns;
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") tryAns(); });
  }
  function showFakeLock() {
    if (document.getElementById("fake-lock")) return;
    const m = document.createElement("div");
    m.id = "fake-lock";
    m.className = "fake-lock";
    m.innerHTML = '<div class="fake-lock-text">系统已锁定</div><div class="fake-lock-sub">2 秒后恢复</div>';
    document.body.appendChild(m);
    if (S.audio) { ensureAudio(); playReal("stingHigh"); playReal("glass"); }
    setTimeout(() => m.remove(), 2000);
  }
  function showBWConfirm(chosenId, correct, onYes, onCancel) {
    if (document.getElementById("bw-confirm-modal")) return;
    const m = document.createElement("div");
    m.id = "bw-confirm-modal";
    m.className = "bw-confirm";
    m.innerHTML =
      '<div class="bw-confirm-card">' +
        '<div class="bw-confirm-text">你确定选择这个吗？<br/>选择失败系统将自动锁机。</div>' +
        '<div class="bw-confirm-actions">' +
          '<button id="bwConfirmYes" type="button">确定</button>' +
          '<button id="bwConfirmNo" type="button" class="ghost">取消</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(m);
    if (S.audio) { ensureAudio(); sting(1); }
    const yes = document.getElementById("bwConfirmYes");
    const no = document.getElementById("bwConfirmNo");
    yes.onclick = () => { m.remove(); if (onYes) onYes(); };
    no.onclick = () => { m.remove(); if (onCancel) onCancel(); };
  }

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
    // 终章前（沈某投稿未读）：只标出路遥的年龄；终章后（shenRead=true）：全部年龄可见
    const isLuyao = (name === "麻三") || (p.alias && p.alias.indexOf("路遥") >= 0);
    const showAge = (p.age != null) && (S.shenRead || isLuyao);
    const age = showAge ? `<p class="muted" style="font-size:.74rem;margin-top:4px">约 ${p.age} 岁</p>` : "";
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
          if (S.bkShown && !S.shenUnlocked) {
            S.shenUnlocked = true; store.save({ shenUnlocked: true });
            flash(null, "沈某投稿已解锁 · 新闻可见");
          }
          log("检索人物：" + personKey);
          const isFoe = !!(personHit.foe || (personHit.tag && personHit.tag.indexOf("反派") >= 0));
          if (isFoe) horror(3);
          maybeShowWangjianProtect(personKey);
          maybeTriggerHorror(personKey);
          return;
        }
        // 万年历 · 年干支查询工具
        if (["万年历","干支","年干支","六十甲子","属相","生肖","天干","地支"].some((k) => kw.includes(k) || k.includes(kw))) {
          res.innerHTML = calendarHTML();
          bindCalendar();
          log("检索：万年历");
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
        if (D.DAOZANG) for (const k in D.DAOZANG) {
          if (k.includes(kw) || kw.includes(k))
            out.push(`<div class="result"><h4>${k}<span class="tag">道藏</span></h4><p>${D.DAOZANG[k]}</p></div>`);
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
    const palaceZhi = "坎宫子 · 艮宫丑寅 · 震宫卯 · 巽宫辰巳 · 离宫午 · 坤宫未申 · 兑宫酉 · 乾宫戌亥";
    return `<div class="result"><h4>洛书九宫 · 配数 + 人身造化</h4>
      <p>坎一 · 坤二 · 震三 · 巽四 · 中五 · 乾六 · 兑七 · 艮八 · 离九。</p>
      <table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:.82rem">
        <tr style="color:var(--txt-dim)"><td>人身造化</td><td>部位</td><td>卦象 → 数</td></tr>
        ${bodyRows}
      </table>
      <p style="margin-top:10px;color:var(--cinnabar-gold);font-size:.84rem">九宫地支：${palaceZhi}</p>
      <p style="margin-top:6px;color:var(--txt-dim)">取祖气路数：${D.LUOSHU.route}</p>
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
  /* 万年历 · 六十甲子年干支查询（终章辅助工具） */
  const GAN_LIST = "甲乙丙丁戊己庚辛壬癸";
  const ZHI_LIST = "子丑寅卯辰巳午未申酉戌亥";
  const ZOD_LIST = ["鼠","牛","虎","兔","龙","蛇","马","羊","猴","鸡","狗","猪"];
  function ganzhiOfYear(y) {
    const g = ((y - 4) % 10 + 10) % 10;
    const z = ((y - 4) % 12 + 12) % 12;
    return { stem: GAN_LIST[g], branch: ZHI_LIST[z], stemBranch: GAN_LIST[g] + ZHI_LIST[z], zodiac: ZOD_LIST[z] };
  }
  function calendarHTML() {
    return `<div class="result cal-card">
      <h4>万年历 · 六十甲子年干支<span class="tag">工具</span></h4>
      <p class="muted" style="font-size:.82rem">输入公元年份，查其年干支与属相。六十甲子周而复始。</p>
      <div class="cal-row">
        <input id="calYear" type="number" placeholder="如 2008" inputmode="numeric" />
        <button id="calGo" type="button">查询</button>
      </div>
      <div id="calOut" class="cal-out"></div>
      <p class="muted" style="font-size:.74rem;margin-top:8px">提示：生辰年干支即出生年份的干支。</p>
    </div>`;
  }
  function bindCalendar() {
    const inp = $("#calYear"), btn = $("#calGo"), out = $("#calOut");
    if (!inp || !btn || !out) return;
    function calc() {
      const y = parseInt(inp.value, 10);
      if (!y || y < 1) { out.innerHTML = '<p class="muted">请输入有效年份。</p>'; return; }
      const r = ganzhiOfYear(y);
      out.innerHTML = '<p class="cal-result"><b>' + y + '</b> 年 · <span class="cal-sb">' + r.stemBranch + '</span> 年 · 属 <span class="cal-zod">' + r.zodiac + '</span></p>';
      if (S.audio) { ensureAudio(); sting(1); }
    }
    btn.addEventListener("click", calc);
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") calc(); });
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
    renderBWInner();
  }
  function renderBWInner() {
    const p = D.QUESTS.qb;
    const html = `
      <p class="center" style="color:var(--txt-dim);margin-bottom:10px">${p.question}</p>
      <div class="bw">
        <div class="card" data-opt="A"><h5>${p.options[0].label}</h5><img class="bw-img" src="assets/img/gal-bw-zhushu.png" alt="黑纸朱书" loading="lazy"></div>
        <div class="card" data-opt="B"><h5>${p.options[1].label}</h5><img class="bw-img" src="assets/img/gal-bw-baishu.png" alt="黑纸白书" loading="lazy"></div>
      </div>
      <p class="msg center" id="bwmsg" style="margin-top:10px"></p>`;
    showPage("黑纸辨识 · 正法之辨", html, () => {
      $("#pageBody").querySelectorAll(".card").forEach((c) =>
        c.addEventListener("click", () => {
          const id = c.dataset.opt;
          const opt = p.options.find((o) => o.id === id);
          const msg = $("#bwmsg");
          // 进入黑纸辨识后可自由查看；只有点 朱书/骨书 做选择时才二次确认（防误选）
          showBWConfirm(id, opt.correct, () => {
            if (opt.correct) {
              c.classList.add("sel");
              msg.className = "msg ok center"; msg.textContent = "正法。黑纸朱书——赤镇黑，以酒调砂。";
              solveQuest("qb");
              setTimeout(() => { location.href = "index.html"; }, 1000);
            } else {
              // 骨书 = 反法，选择失败：锁屏 2 秒
              showFakeLock();
              setTimeout(() => {
                msg.className = "msg err center"; msg.textContent = "这是反法黑纸白书——骨粉养煞、从左往右画。";
              }, 2000);
            }
          }, () => { /* 取消：留在黑纸辨识，无任何惩罚 */ });
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
   *  图册（实拍图 + 道藏解释）
   * ===================================================================== */
  function renderGallery() {
    const items = (D.GALLERY || []).map((g) =>
      `<div class="gal-card">
        <img class="gal-img" src="${g.img}" alt="${g.key}" loading="lazy">
        <div class="gal-body">
          <h4 class="gal-title">${g.key}</h4>
          <p class="gal-text">${g.body}</p>
        </div>
      </div>`).join("");
    showPage("图册 · 道藏残页", `<div class="gal-feed">${items}</div>`);
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
    const shenIdx = (D.NEWS || []).length - 1;
    const items = (D.NEWS || []).map((n, idx) => {
      if (idx === shenIdx && !S.shenUnlocked) return "";
      const isShen = idx === shenIdx;
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
      if (location.hash === "#shen") {
        setTimeout(() => {
          const feed = document.querySelector(".news-feed");
          const target = feed && feed.lastElementChild;
          if (target && target.classList.contains("news-item")) target.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 80);
      }
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
          '<label>' + f.key + '</label>' +
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
    const locked = !S.forumUnlocked;
    const loginCard =
      (locked
        ? '<div class="forum-login">' +
            '<div class="forum-login-row"><input id="forumUser" placeholder="账号" autocomplete="off" /></div>' +
            '<div class="forum-login-row"><input id="forumPw" type="password" placeholder="密码" autocomplete="off" /></div>' +
            '<div class="forum-login-row"><button id="forumPwGo" type="button">登录</button>' +
              '<div class="forum-known-msg muted" id="forumPwMsg"></div></div>' +
          '</div>'
        : '<div class="forum-known-note muted">已解锁 · 帖子可阅</div>');
    const threads = (D.FORUM.threads || []).filter((t) => S.shenUnlocked || t.authorWechat !== "tfc_jiacheng");
    const list = threads.map((t) =>
      '<div class="forum-thread-item' + (locked ? ' locked' : '') + '" data-id="' + t.id + '">' +
        '<div class="forum-thread-title">' + t.title + '</div>' +
        '<div class="forum-thread-meta">' +
          '<span>' + t.author + '</span>' +
          '<span>' + t.time + '</span>' +
          '<span>· ' + t.replies + ' 帖</span>' +
        '</div>' +
      '</div>').join("");
    const html =
      '<div class="forum-wrap">' +
        loginCard +
        '<div class="forum-thread-list">' + list + '</div>' +
        '<div id="forumThreadHost"></div>' +
      '</div>';
    showPage("论坛 · 同道杂谈", html, () => {
      if (locked) {
        const go = document.getElementById("forumPwGo");
        const inp = document.getElementById("forumPw");
        const usr = document.getElementById("forumUser");
        const msg = document.getElementById("forumPwMsg");
        const tryUnlock = () => {
          const u = ((usr && usr.value) || "").trim();
          const v = (inp.value || "")
            .replace(/\s+/g, "")
            .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
            .toLowerCase();
          if (!u) {
            msg.className = "forum-known-msg err"; msg.textContent = "请输入账号。";
            return;
          }
          if (v === "060226") {
            S.forumUnlocked = true; store.save({ forumUnlocked: true });
            if (S.audio) playUnlock();
            renderForum();
          } else {
            msg.className = "forum-known-msg err"; msg.textContent = "不对。";
            playError();
            if (S.fx) { document.body.classList.add("fx-glitch", "fx-flicker"); setTimeout(() => document.body.classList.remove("fx-glitch", "fx-flicker"), 600); }
          }
        };
        go.onclick = tryUnlock;
        inp.addEventListener("keydown", (e) => { if (e.key === "Enter") tryUnlock(); });
        if (usr) usr.addEventListener("keydown", (e) => { if (e.key === "Enter") inp.focus(); });
      } else {
        document.querySelectorAll(".forum-thread-item").forEach((el) =>
          el.addEventListener("click", () => {
            const t = D.FORUM.threads.find((x) => x.id === el.dataset.id);
            if (!t) return;
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
      }
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
    { id: "gallery", ico: "📜", nm: "图册", gate: "", href: "gallery.html" },
  ];
  // v9(i.2): 浏览器自动播放策略下，首个用户手势即解锁 AudioContext 并拉起 ambient，无需手动点声音键
  function armAudioAutoStart() {
    if (!S.audio) return;
    const kick = () => {
      ensureAudio();
      if (AC && AC.state === "suspended") { try { AC.resume(); } catch (e) {} }
      if (!drone) startDrone();
      else if (drone.real) {
        const a = AUDIO_FILES.ambient;
        if (a) { try { a.currentTime = 0; const pp = a.play(); if (pp && pp.catch) pp.catch(function () {}); } catch (e) {} }
      }
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("touchstart", kick);
      window.removeEventListener("keydown", kick);
    };
    window.addEventListener("pointerdown", kick);
    window.addEventListener("touchstart", kick, { passive: true });
    window.addEventListener("keydown", kick);
  }
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
    // v9(i): 音效始终打开（默认 audio=true → 启动 drone）
    if (S.audio) { ensureAudio(); startDrone(); }
    armAudioAutoStart();
    if (S.death) { buildBreaking(false); log("终局已至。"); return; }
    log("数据恢复完成。");
    ensureBoot();
    checkDeath();
  }
  function initPage(page) {
    ensureBoot();
    if (S.audio) { ensureAudio(); startDrone(); }
    armAudioAutoStart();
    if (S.death) buildBreaking(false);
    const map = {
      search: renderSearch, vault: renderVault, bw: renderBW, qc: renderQC,
      notes: renderNotes, news: renderNews, forum: renderForum, truth: renderTruth,
      wx: renderWX, gallery: renderGallery,
    };
    if (map[page]) map[page]();
    sync();
  }

  if (PAGE === "hub") initHub(); else initPage(PAGE);
})();
