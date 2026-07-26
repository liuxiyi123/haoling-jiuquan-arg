/* =========================================================================
 *  《号令九泉》ARG 原型 · 逻辑层（纯静态 / 无后端 / 离线）
 *  解密链：检索真实笔记 → 九宫门(9381) → 黑纸辨识 → 人身造化门
 *          → 渐进解锁 刘希夷的每日笔记 → 群聊记录自行拼合
 *  王鉴：每阶段发神秘来信；身份不暴露，唯一主动提醒来源。反应式检索：叛师/判师 → 被察觉。
 *  恐怖：CSS 故障/暗角/墨渗特效 + Web Audio 合成低频氛围与惊悚 sting（可开关）。
 *  图片槽位：符箓/号令/将帅先以 SVG 占位，待用户实拍补入。
 *  注：原章节式展示与收尾解锁已弃用，现改为每日笔记 + 群聊，玩家自行拼合。
 * ========================================================================= */
(function () {
  "use strict";
  const D = window.HLJQ_DATA;
  const KEY = "hljq:arg-full";
  const $ = (s) => document.querySelector(s);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 进度持久化（localStorage，离线） ---------- */
  const store = {
    load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } },
    save(o) { const cur = this.load(); localStorage.setItem(KEY, JSON.stringify(Object.assign(cur, o))); },
  };
  let S = Object.assign(
    { qa: false, qb: false, qc: false, read: [], wj: [], wjUnread: 0, audio: false, fx: true, bled: [], death: false },
    store.load()
  );

  /* ---------- 侧栏日志 ---------- */
  const logEl = $("#logList");
  function log(msg) {
    const li = document.createElement("li");
    li.textContent = msg;
    logEl.insertBefore(li, logEl.firstChild);
    if (logEl.children.length > 14) logEl.removeChild(logEl.lastChild);
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
    if (S.audio) sting(level);
    setTimeout(() => document.body.classList.remove(...cls), 900 + level * 350);
  }
  function setAudio(on) {
    S.audio = on; store.save({ audio: on });
    $("#btnAudio").textContent = on ? "声音 ●" : "声音 ○";
    $("#btnAudio").classList.toggle("on", on);
    if (on) { ensureAudio(); startDrone(); } else { stopDrone(); }
  }
  function setFx(on) {
    S.fx = on; store.save({ fx: on });
    $("#btnFx").textContent = on ? "特效 ●" : "特效 ○";
    $("#btnFx").classList.toggle("on", on);
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
    $("#sbProg").textContent = progText();
    document.querySelectorAll(".app").forEach((a) => {
      const gate = a.dataset.gate;
      let ok = true;
      if (gate === "qa") ok = S.qa;
      else if (gate === "qb") ok = S.qb;
      else if (gate === "qc") ok = S.qc;
      a.classList.toggle("locked", !ok);
      const bd = a.querySelector(".badge");
      if (bd) bd.remove();
      if (a.dataset.id === "msg" && S.wjUnread > 0) {
        const b = document.createElement("span"); b.className = "badge"; b.textContent = S.wjUnread; a.appendChild(b);
      }
    });
    $("#btnAudio").textContent = S.audio ? "声音 ●" : "声音 ○";
    $("#btnAudio").classList.toggle("on", S.audio);
    $("#btnFx").textContent = S.fx ? "特效 ●" : "特效 ○";
    $("#btnFx").classList.toggle("on", S.fx);
  }

  /* ---------- 视图路由 ---------- */
  const hub = $("#hub"), view = $("#view"), viewBody = $("#viewBody"), viewTitle = $("#viewTitle");
  function openView(title, html, after) {
    hub.hidden = true; view.hidden = false;
    viewTitle.textContent = title; viewBody.innerHTML = html;
    if (after) after();
    window.scrollTo(0, 0);
  }
  function back() { view.hidden = true; hub.hidden = false; sync(); }
  $("#btnBack").addEventListener("click", back);

  /* ---------- 王鉴来信（唯一主动提醒来源） ---------- */
  function fireWJ(trigger) {
    const m = D.WANGJIAN.find((x) => x.trigger === trigger);
    if (!m || S.wj.indexOf(m.id) >= 0) return;
    S.wj.push(m.id); S.wjUnread++; store.save({ wj: S.wj, wjUnread: S.wjUnread });
    log("收到「" + m.from + "」的讯息");
    sync();
  }
  function solveQuest(id) {
    if (id === "qa" && !S.qa) { S.qa = true; store.save({ qa: true }); log("九宫门开：9381"); fireWJ("qa"); }
    if (id === "qb" && !S.qb) { S.qb = true; store.save({ qb: true }); log("辨得正法：黑纸朱书"); fireWJ("qb"); }
    if (id === "qc" && !S.qc) { S.qc = true; store.save({ qc: true }); log("人身造化已通"); fireWJ("qc"); }
    sync();
    checkDeath();
  }

  /* =====================================================================
   *  终局（全员殒落）
   * ===================================================================== */
  function deathReady() {
    const min = (D.DEATH && D.DEATH.minRead) || 19;
    return S.qa && S.qb && S.qc && S.read.length >= min;
  }
  function checkDeath() {
    if (S.death) return;
    if (!deathReady()) return;
    S.death = true; store.save({ death: true });
    buildDoom(true);
  }
  function buildDoom(perform) {
    const overlay = document.createElement("div");
    overlay.id = "doom";
    const tiles = document.createElement("div"); tiles.className = "tiles";
    // 中央不规则「你们都要死」铺屏：以屏幕中心为核，半径向内偏置、角度随机、尺寸不一
    const N = reduceMotion ? 24 : 46;
    const cx = 50, cy = 47;
    for (let i = 0; i < N; i++) {
      const t = document.createElement("span");
      t.className = "tile"; t.textContent = "你们都要死";
      const ang = Math.random() * Math.PI * 2;
      const rr = Math.pow(Math.random(), 0.55) * 41;   // 半径向内偏置 → 越靠中心越密
      const x = cx + Math.cos(ang) * rr * 1.16;
      const y = cy + Math.sin(ang) * rr * 0.82;
      const rot = (Math.random() * 30 - 15), sc = 0.5 + Math.random() * 1.4;
      t.style.left = x.toFixed(2) + "%"; t.style.top = y.toFixed(2) + "%";
      t.style.transform = "translate(-50%,-50%) rotate(" + rot.toFixed(1) + "deg) scale(" + sc.toFixed(2) + ")";
      t.style.opacity = (0.34 + Math.random() * 0.52).toFixed(2);
      t.style.fontSize = (0.8 + Math.random() * 1.6).toFixed(2) + "rem";
      tiles.appendChild(t);
    }
    overlay.appendChild(tiles);
    const btn = document.createElement("button");
    btn.className = "juebi-btn"; btn.type = "button"; btn.textContent = "绝笔";
    btn.style.display = "none";
    overlay.appendChild(btn);
    document.body.appendChild(overlay);

    const motion = S.fx && !reduceMotion;
    if (motion) overlay.classList.add("shake");
    requestAnimationFrame(() => overlay.classList.add("red"));
    if (S.audio) { ensureAudio(); sting(3); if (!reduceMotion) setTimeout(() => sting(2), 1300); }

    function finish() {
      // 终局最后一讯：必须在恐怖演出结束后才发，不可提前
      fireWJ("finale");
      btn.style.display = "";
      btn.onclick = showJuebi;
    }
    if (perform) setTimeout(finish, reduceMotion ? 2600 : 6600);
    else finish(); // 刷新恢复：直接呈现终局终态，不重播演出（fireWJ 已存在则幂等）
    return overlay;
  }
  function showJuebi() {
    const m = D.WANGJIAN.find((x) => x.trigger === "finale");
    const text =
      "刘希夷绝笔\n" +
      "守玄雷坛已被邪魔侵蚀。这里不是我一个人能守住的，需要更多人的帮助。\n" +
      "如果你看见了，请把这部手机分享出去。";
    const modal = document.createElement("div");
    modal.className = "juebi-modal";
    modal.innerHTML =
      '<div class="jb-card">' +
        '<pre class="jb-text">' + text + "</pre>" +
        '<div class="jb-actions">' +
          '<button id="jbShare" type="button">分享这部手机</button>' +
          '<button id="jbCopy" type="button">复制绝笔</button>' +
        "</div>" +
        (m ? '<div class="jb-wj"><div class="wj-from">' + m.from + " · 最后一讯息</div><div class=\"wj-text\">" + m.text.replace(/\n/g, "<br/>") + "</div></div>" : "") +
      "</div>";
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });
    $("#jbShare").addEventListener("click", () => doShare(text));
    $("#jbCopy").addEventListener("click", () => { copyText(text); flash($("#jbCopy"), "已复制"); });
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
   *  应用：检索（真实笔记 + 群聊 + 反应式）
   * ===================================================================== */
  function renderSearch() {
    const html = `
      <div class="searchbar">
        <input id="q" placeholder="检索…" autocomplete="off" />
        <button id="go">检索</button>
        <button class="ex" id="clear">清空</button>
      </div>
      <div id="res"></div>`;
    openView("检索 · 残档库", html, () => {
      const q = $("#q"), res = $("#res");
      function run() {
        const kw = q.value.trim();
        if (!kw) return;
        // 1) 人物：照片 / 遗照视图 + 渗血（不显示档案卡式长文案）
        let personKey = null, personHit = null;
        for (const k in D.PEOPLE) {
          const p = D.PEOPLE[k];
          if (k.includes(kw) || (p.alias && p.alias.some((a) => a.includes(kw))) || kw.includes(k)) { personKey = k; personHit = p; break; }
        }
        if (personHit) {
          res.innerHTML = personHTML(personKey, personHit);
          log("检索人物：" + personKey);
          const isFoe = !!(personHit.foe || (personHit.tag && personHit.tag.indexOf("反派") >= 0));
          if (isFoe) horror(3); // 反派检索仍有恐怖回应，不加额外提示
          return;
        }
        // 2) 反派恐怖回应（术语型：叛师 / 判师）
        if (D.REACTIVE_KEYS.some((k) => kw.includes(k) || k.includes(kw))) {
          horror(3);
          res.innerHTML = `<div class="react"><h4>· 检索回应 ·</h4>${D.REACTIVE.lines.map((l) => `<p class="react-line">${l}</p>`).join("")}</div>`;
          log("检索：" + kw + " —— 被察觉");
          return;
        }
        // 3) 术语 / 世界设定 / 群聊
        const out = [];
        for (const k in D.LORE) {
          if (k.includes(kw) || kw.includes(k))
            out.push(`<div class="result"><h4>${k}<span class="tag">世界设定</span></h4><p>${D.LORE[k]}</p></div>`);
        }
        if ("九宫洛书八卦卦象".includes(kw) || kw === "九宫" || kw === "洛书") out.push(luoshuHTML());
        if ("人身造化铁围山六洞后门".includes(kw) || kw === "人身造化") out.push(bodyMapHTML());
        for (const g of D.GROUP_CHATS) {
          if (!S[g.unlock]) continue;
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
    const rows = [["", "坎一", "坤二", "震三", "巽四", "中五", "乾六", "兑七", "艮八", "离九"]];
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
  function portraitSVG(p) {
    const frame = p.deceased ? "#000" : "var(--iron)";
    const sil = p.deceased ? "var(--can-bai)" : "var(--cinnabar-gold)";
    return `<svg viewBox="0 0 120 150">
      <rect x="6" y="6" width="108" height="138" fill="var(--ink-xuan-3)" stroke="${frame}" stroke-width="${p.deceased ? 4 : 2}"/>
      <circle cx="60" cy="58" r="26" fill="${sil}" opacity="0.5"/>
      <path d="M22 142 Q22 96 60 96 Q98 96 98 142 Z" fill="${sil}" opacity="0.5"/>
      ${p.deceased ? '<text x="60" y="22" font-size="11" fill="var(--can-bai)" text-anchor="middle" letter-spacing="4">遗照</text>' : ""}
    </svg>`;
  }
  function personHTML(name, p) {
    if (S.bled.indexOf(name) < 0) { S.bled.push(name); store.save({ bled: S.bled }); } // 渗血状态持久化
    const tag = p.deceased ? `<span class="tag death">遗照 · 已故</span>` : `<span class="tag">${p.tag}</span>`;
    const alias = (p.alias && p.alias.length) ? `<p class="muted" style="font-size:.78rem;margin-top:6px">别名：${p.alias.join("、")}</p>` : "";
    return `<div class="person">
      <div class="portrait ${p.deceased ? "death" : ""} bleeding">
        ${portraitSVG(p)}
        <div class="blood"></div>
      </div>
      <h4 class="pname">${name}${tag}</h4>
      ${alias}
    </div>`;
  }

  /* =====================================================================
   *  应用：保险箱（九宫门 9381）
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
    openView("保险箱 · 四位密码", html, () => {
      const disp = $("#disp"), msg = $("#vmsg");
      function draw() { disp.textContent = buf.padEnd(4, "·"); }
      $("#pad").addEventListener("click", (e) => {
        const b = e.target.closest("button[data-k]"); if (!b) return;
        if (buf.length < 4) buf += b.dataset.k; draw();
        if (buf.length === 4) {
          if (buf === code) {
            msg.className = "msg ok"; msg.textContent = "咔——锁开了。";
            solveQuest("qa");
            setTimeout(back, 800);
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
   *  应用：黑纸辨识（朱书 vs 白书）
   * ===================================================================== */
  function renderBW() {
    if (!S.qa) { openView("黑纸辨识", `<p class="muted center" style="padding:40px">此处暂无可见之物。</p>`); return; }
    const p = D.QUESTS.qb;
    const html = `
      <p class="center" style="color:var(--txt-dim);margin-bottom:10px">${p.question}</p>
      <div class="bw">
        <div class="card" data-opt="A"><h5>${p.options[0].label}</h5>${svgZhuShu()}</div>
        <div class="card" data-opt="B"><h5>${p.options[1].label}</h5>${svgBaiShu()}</div>
      </div>
      <p class="msg center" id="bwmsg" style="margin-top:10px"></p>`;
    openView("黑纸辨识 · 正法之辨", html, () => {
      $("#viewBody").querySelectorAll(".card").forEach((c) =>
        c.addEventListener("click", () => {
          const id = c.dataset.opt;
          const correct = p.options.find((o) => o.id === id).correct;
          const msg = $("#bwmsg");
          if (correct) {
            c.classList.add("sel");
            msg.className = "msg ok center"; msg.textContent = "正法。黑纸朱书——赤镇黑，以酒调砂。";
            solveQuest("qb");
            setTimeout(back, 900);
          } else {
            msg.className = "msg err center"; msg.textContent = "这是反法黑纸白书——骨粉养煞、从左往右画。";
            horror(2);
          }
        }));
    });
  }

  /* =====================================================================
   *  应用：人身造化（映射门）
   * ===================================================================== */
  function renderQC() {
    if (!S.qb) { openView("人身造化", `<p class="muted center" style="padding:40px">此处暂无可见之物。</p>`); return; }
    const p = D.QUESTS.qc;
    const html = `
      <p class="center" style="color:var(--txt-dim);margin-bottom:12px">${p.question}</p>
      <div class="bw one">
        ${p.options.map((o) => `<div class="card" data-opt="${o.id}"><h5>${o.label}</h5></div>`).join("")}
      </div>
      <p class="msg center" id="qcmsg" style="margin-top:10px"></p>`;
    openView("人身造化 · 卦象之问", html, () => {
      $("#viewBody").querySelectorAll(".card").forEach((c) =>
        c.addEventListener("click", () => {
          const id = c.dataset.opt;
          const correct = p.options.find((o) => o.id === id).correct;
          const msg = $("#qcmsg");
          if (correct) {
            c.classList.add("sel");
            msg.className = "msg ok center"; msg.textContent = "坎一。谷道后门，水润北坎。人身即是酆都之城。";
            solveQuest("qc");
            setTimeout(back, 900);
          } else {
            msg.className = "msg err center"; msg.textContent = "不对。";
            horror(1);
          }
        }));
    });
  }

  /* 图册入口已移除：终局 ARG 仅保留 笔记 / 群聊 / 检索 / 解密门 / 讯息 */

  /* =====================================================================
   *  应用：刘希夷的笔记（每日笔记 / 发现记录，渐进解锁）
   * ===================================================================== */
  function renderNotes() {
    const list = D.DAILY_NOTES.map((c) => {
      const ok = S[c.unlock];
      if (ok) return `<div class="chap" data-n="${c.n}"><div class="n">${c.date}</div><div class="t">${c.head}</div></div>`;
      return `<div class="chap locked"><div class="n">待解</div><div class="t muted">〔未启〕</div></div>`;
    }).join("");
    const html = `
      <div class="chaplist">${list}</div>
      <div id="chapHost"></div>`;
    openView("刘希夷的笔记", html, () => {
      const host = $("#chapHost");
      document.querySelectorAll(".chap:not(.locked)").forEach((el) =>
        el.addEventListener("click", () => {
          const c = D.DAILY_NOTES.find((x) => x.n == el.dataset.n);
          host.innerHTML =
            `<div class="chap-body"><h3>${c.head}</h3>
              <div class="meta">${c.date} ｜ ${c.scene}</div>
              <p>${c.body}</p></div>`;
          if (S.read.indexOf(c.n) < 0) { S.read.push(c.n); store.save({ read: S.read }); }
          log("阅：" + c.head);
          checkDeath(); sync();
        }));
    });
  }

  /* =====================================================================
   *  应用：群聊（残存记录，玩家自行拼合）
   * ===================================================================== */
  function renderChats() {
    const list = D.GROUP_CHATS.map((g) => {
      const ok = S[g.unlock];
      if (ok) return `<div class="chap" data-id="${g.id}"><div class="n">${g.name}</div><div class="t">${g.tag}</div></div>`;
      return `<div class="chap locked"><div class="n">待解</div><div class="t muted">〔未启〕</div></div>`;
    }).join("");
    const html = `
      <div class="chaplist">${list}</div>
      <div id="chatHost"></div>`;
    openView("群聊 · 残存记录", html, () => {
      const host = $("#chatHost");
      document.querySelectorAll(".chap:not(.locked)").forEach((el) =>
        el.addEventListener("click", () => {
          const g = D.GROUP_CHATS.find((x) => x.id === el.dataset.id);
          const lines = g.msgs.map((m) =>
            `<div class="chat-line"><span class="who">${m.from}</span><div class="txt">${m.text}</div></div>`).join("");
          host.innerHTML =
            `<div class="chap-body"><h3>${g.name}</h3>
              <div class="meta">${g.tag}</div>
              <p class="muted" style="font-size:.8rem;margin:6px 0 12px">${g.intro}</p>
              <div class="bubbles">${lines}</div></div>`;
          if (S.read.indexOf(g.id) < 0) { S.read.push(g.id); store.save({ read: S.read }); }
          log("阅群：" + g.name);
          checkDeath(); sync();
        }));
    });
  }

  /* =====================================================================
   *  应用：讯息（王鉴来信，唯一主动提醒来源）
   * ===================================================================== */
  function renderMsg() {
    const msgs = D.WANGJIAN.filter((m) => S.wj.indexOf(m.id) >= 0)
      .sort((a, b) => a.id - b.id);
    const html = msgs.length
      ? `<div class="msgs">${msgs.map((m) =>
          `<div class="msg-item"><div class="msg-from">${m.from}</div><div class="msg-text">${m.text.replace(/\n/g, "<br/>")}</div></div>`).join("")}</div>`
      : `<p class="muted center" style="padding:40px">暂无新讯息。</p>`;
    openView("讯息 · 未知发信人", html, () => {
      if (S.wjUnread > 0) { S.wjUnread = 0; store.save({ wjUnread: 0 }); sync(); }
    });
  }

  /* =====================================================================
   *  SVG 占位（仅保留 黑纸辨识 所需的 朱书 / 白书；图册入口已移除）
   * ===================================================================== */
  function svgZhuShu() { return `<svg viewBox="0 0 100 120"><rect width="100" height="120" fill="var(--fan-paper)"/><path d="M50 14 V108 M28 26 H72 M36 44 H64 M32 62 H68 M44 84 H56" stroke="var(--cinnabar)" stroke-width="3" fill="none"/><text x="50" y="34" font-size="11" fill="var(--cinnabar)" text-anchor="middle">应水火雷铁</text></svg>`; }
  function svgBaiShu() { return `<svg viewBox="0 0 100 120"><rect width="100" height="120" fill="var(--anti-paper)"/><path d="M30 108 V14 M72 96 H28 M64 78 H36 M68 60 H32 M56 38 H44" stroke="var(--can-bai)" stroke-width="2.4" fill="none" stroke-dasharray="2 2"/></svg>`; }

  /* =====================================================================
   *  启动：应用网格
   * ===================================================================== */
  const APPS = [
    { id: "search", ico: "🔍", nm: "检索", gate: "", fn: renderSearch },
    { id: "vault", ico: "🔒", nm: "保险箱", gate: "", fn: renderVault },
    { id: "bw", ico: "📜", nm: "黑纸辨识", gate: "qa", fn: renderBW },
    { id: "qc", ico: "☯", nm: "人身造化", gate: "qb", fn: renderQC },
    { id: "notes", ico: "📓", nm: "笔记", gate: "", fn: renderNotes },
    { id: "chats", ico: "💬", nm: "群聊", gate: "", fn: renderChats },
    { id: "msg", ico: "✉", nm: "讯息", gate: "", fn: renderMsg },
  ];
  function boot() {
    const grid = $("#appgrid");
    grid.innerHTML = APPS.map((a) =>
      `<div class="app" data-id="${a.id}" data-gate="${a.gate}"><div class="ico">${a.ico}</div><div class="nm">${a.nm}</div></div>`).join("");
    grid.querySelectorAll(".app").forEach((el) =>
      el.addEventListener("click", () => {
        const a = APPS.find((x) => x.id === el.dataset.id);
        const g = a.gate;
        const ok = g === "" || (g === "qa" && S.qa) || (g === "qb" && S.qb) || (g === "qc" && S.qc);
        if (!ok) { log("「" + a.nm + "」尚不可入。"); return; }
        a.fn();
      }));
    $("#btnAudio").addEventListener("click", () => setAudio(!S.audio));
    $("#btnFx").addEventListener("click", () => setFx(!S.fx));
    setInterval(() => { const d = new Date(); $("#sbClock").textContent = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }, 1000);
    $("#sbClock").textContent = "--:--";
    sync();
    if (S.death) { buildDoom(false); log("终局已至。"); return; }
    log("数据恢复完成。");
    fireWJ("boot");
    checkDeath();
  }
  boot();
})();
