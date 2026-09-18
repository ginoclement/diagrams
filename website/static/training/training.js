/* Training Path engine + gamification. Renders curriculum.json as staged lessons/quizzes with
   localStorage progress, XP, levels, badges, streaks, confetti, a profile, and an OPTIONAL
   leaderboard (enabled only when a backend API is configured — the site works fully offline).
   Hash routes: #/ , #/stage/<id> , #/lesson/<sid>/<lid> , #/quiz/<sid> , #/profile , #/leaderboard */
(function () {
  "use strict";
  var app = document.getElementById("app");
  var KEY = "identity-training-progress-v1";
  var CUR = null;

  /* ---------- optional backend (feature-detected) ---------- */
  function apiBase() {
    try {
      var q = new URLSearchParams(location.search).get("api");
      if (q) { localStorage.setItem("training-api", q); }
      return (localStorage.getItem("training-api") || window.__LEADERBOARD_API__ || "").replace(/\/$/, "");
    } catch (e) { return (window.__LEADERBOARD_API__ || "").replace(/\/$/, ""); }
  }
  var LB = !!apiBase();

  function esc(s){return String(s==null?"":s).replace(/[&<>]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;"}[c];});}
  function load(){ try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(p){ try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {} }
  function prog(){
    var p = load();
    p.lessons = p.lessons || {}; p.quizzes = p.quizzes || {};
    p.streak = p.streak || { count: 0, last: null };
    if (!p.playerId) { p.playerId = "p_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); save(p); }
    return p;
  }
  function today(){ return new Date().toISOString().slice(0, 10); }
  function touchStreak(p){
    var t = today();
    if (p.streak.last === t) return;
    var y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    p.streak.count = (p.streak.last === y) ? (p.streak.count + 1) : 1;
    p.streak.last = t;
  }

  /* ---------- gamification model ---------- */
  var LEVELS = [
    { at: 0, name: "Novice" }, { at: 150, name: "Apprentice" }, { at: 350, name: "Practitioner" },
    { at: 600, name: "Engineer" }, { at: 900, name: "Senior Engineer" }, { at: 1200, name: "Architect" },
    { at: 1550, name: "Security Architect" }, { at: 1850, name: "Identity Guardian" }
  ];
  function stageComplete(p, st){
    var all = st.lessons.every(function(l){ return p.lessons[st.id + "/" + l.id]; });
    var q = (st.quiz && st.quiz.length) ? (p.quizzes[st.id] && p.quizzes[st.id].passed) : true;
    return all && q;
  }
  var BADGES = [
    { id: "first-steps", name: "First Steps", icon: "👣", desc: "Complete your first lesson",
      test: function(s){ return s.lessonsDone >= 1; } },
    { id: "quick-study", name: "Quick Study", icon: "⚡", desc: "Finish a whole stage",
      test: function(s){ return s.stagesDone >= 1; } },
    { id: "perfect-recall", name: "Perfect Recall", icon: "🎯", desc: "Ace a quiz (100%)",
      test: function(s){ return s.perfectQuizzes >= 1; } },
    { id: "sharpshooter", name: "Sharpshooter", icon: "🏹", desc: "Ace 5 quizzes",
      test: function(s){ return s.perfectQuizzes >= 5; } },
    { id: "on-fire", name: "On a Roll", icon: "🔥", desc: "3-day streak",
      test: function(s){ return s.streak >= 3; } },
    { id: "dedicated", name: "Dedicated", icon: "📅", desc: "7-day streak",
      test: function(s){ return s.streak >= 7; } },
    { id: "half-way", name: "Halfway There", icon: "⛰️", desc: "Complete 5 stages",
      test: function(s){ return s.stagesDone >= 5; } },
    { id: "passwordless", name: "Passwordless", icon: "🔑", desc: "Master strong authentication",
      test: function(s){ return s.done["strong-auth"]; } },
    { id: "least-privilege", name: "Least Privilege", icon: "🛡️", desc: "Master privileged access",
      test: function(s){ return s.done["privileged-adaptive"]; } },
    { id: "threat-hunter", name: "Threat Hunter", icon: "🕵️", desc: "Master threats & defense",
      test: function(s){ return s.done["threats-defense"]; } },
    { id: "zero-trust", name: "Zero Trust", icon: "🏛️", desc: "Finish the architecture capstone",
      test: function(s){ return s.done["architecture-delivery"]; } },
    { id: "completionist", name: "Completionist", icon: "🏆", desc: "Complete every stage",
      test: function(s){ return s.stagesDone === CUR.stages.length; } },
    { id: "flawless", name: "Flawless", icon: "💎", desc: "Ace every stage quiz",
      test: function(s){ return s.quizStages > 0 && s.perfectQuizzes === s.quizStages; } }
  ];
  function stats(p){
    p = p || prog();
    var lessonsDone = 0, quizCorrect = 0, stagesDone = 0, perfectQuizzes = 0, quizStages = 0;
    var done = {};
    CUR.stages.forEach(function(st){
      st.lessons.forEach(function(l){ if (p.lessons[st.id + "/" + l.id]) lessonsDone++; });
      if (st.quiz && st.quiz.length) {
        quizStages++;
        var q = p.quizzes[st.id];
        if (q) { quizCorrect += (q.best != null ? q.best : q.score) || 0; if ((q.best != null ? q.best : q.score) === q.total) perfectQuizzes++; }
      }
      var c = stageComplete(p, st); done[st.id] = c; if (c) stagesDone++;
    });
    var xp = lessonsDone * 15 + quizCorrect * 10 + stagesDone * 50 + perfectQuizzes * 25;
    var li = 0; for (var i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].at) li = i;
    var next = LEVELS[li + 1] || null;
    var s = { xp: xp, level: li, levelName: LEVELS[li].name, nextAt: next ? next.at : null,
      curAt: LEVELS[li].at, lessonsDone: lessonsDone, stagesDone: stagesDone,
      perfectQuizzes: perfectQuizzes, quizStages: quizStages, streak: p.streak.count || 0, done: done };
    s.badges = BADGES.filter(function(b){ return b.test(s); }).map(function(b){ return b.id; });
    return s;
  }
  function badgeById(id){ return BADGES.find(function(b){ return b.id === id; }); }

  /* ---------- celebration: toasts + confetti ---------- */
  function toast(html){
    var host = document.getElementById("toasts");
    if (!host) { host = document.createElement("div"); host.id = "toasts"; document.body.appendChild(host); }
    var el = document.createElement("div"); el.className = "toast"; el.innerHTML = html;
    host.appendChild(el);
    setTimeout(function(){ el.classList.add("in"); }, 10);
    setTimeout(function(){ el.classList.remove("in"); setTimeout(function(){ el.remove(); }, 300); }, 3400);
  }
  function confetti(){
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var c = document.createElement("canvas"); c.className = "confetti-canvas";
    c.width = innerWidth; c.height = innerHeight; document.body.appendChild(c);
    var ctx = c.getContext("2d");
    var cols = ["#3a63d8", "#39c08a", "#e0a63f", "#a394ff", "#f0748a", "#6f97ff"];
    var P = [];
    for (var i = 0; i < 140; i++) P.push({ x: innerWidth / 2 + (Math.random() - 0.5) * 120,
      y: innerHeight / 3, vx: (Math.random() - 0.5) * 12, vy: Math.random() * -12 - 4,
      s: 4 + Math.random() * 6, c: cols[i % cols.length], r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4 });
    var t0 = Date.now();
    (function frame(){
      var dt = Date.now() - t0; ctx.clearRect(0, 0, c.width, c.height);
      P.forEach(function(p){ p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
        ctx.globalAlpha = Math.max(0, 1 - dt / 1600); ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); ctx.restore(); });
      if (dt < 1600) requestAnimationFrame(frame); else c.remove();
    })();
  }
  function celebrate(before, after){
    if (after.xp > before.xp) toast('<span class="tb">+' + (after.xp - before.xp) + ' XP</span>');
    after.badges.filter(function(b){ return before.badges.indexOf(b) < 0; }).forEach(function(id){
      var b = badgeById(id); toast('<span class="tbadge">' + b.icon + '</span> Badge unlocked — <b>' + esc(b.name) + '</b>'); confetti();
    });
    if (after.level > before.level) { toast('⬆ <b>Level ' + (after.level + 1) + ' — ' + esc(after.levelName) + '</b>'); confetti(); }
    if (LB) submitScore(after);
  }
  function withProgress(mut){
    var before = stats();
    var p = prog(); touchStreak(p); mut(p); save(p);
    var after = stats();
    celebrate(before, after);
    return after;
  }

  /* ---------- leaderboard API ---------- */
  function submitScore(s){
    var base = apiBase(); if (!base) return;
    var p = prog();
    try {
      fetch(base + "/api/scores", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ playerId: p.playerId, name: p.name || "Anonymous", xp: s.xp,
          level: s.level + 1, levelName: s.levelName, badges: s.badges.length, stages: s.stagesDone }) })
        .catch(function(){});
    } catch (e) {}
  }
  function fetchLeaderboard(){
    var base = apiBase(); if (!base) return Promise.reject();
    return fetch(base + "/api/leaderboard?limit=25").then(function(r){ if (!r.ok) throw 0; return r.json(); });
  }

  /* ---------- shared chrome ---------- */
  function statsBar(){
    var s = stats();
    var pct = s.nextAt ? Math.round((s.xp - s.curAt) / (s.nextAt - s.curAt) * 100) : 100;
    return '<div class="xpbar">' +
      '<a href="#/profile" class="lvl" title="View profile">Lv ' + (s.level + 1) + ' · ' + esc(s.levelName) + '</a>' +
      '<span class="minibar"><i style="width:' + pct + '%"></i></span>' +
      '<span class="xp">' + s.xp + ' XP' + (s.nextAt ? ' <span class="muted">/ ' + s.nextAt + '</span>' : ' <span class="muted">· max</span>') + '</span>' +
      (s.streak > 0 ? '<span class="streak" title="Daily streak">🔥 ' + s.streak + '</span>' : '') +
      '<a href="#/profile" class="badgecount" title="Badges">🏅 ' + s.badges.length + '/' + BADGES.length + '</a>' +
      (LB ? '<a href="#/leaderboard" class="lblink">Leaderboard</a>' : '') +
      '</div>';
  }
  function header(crumbHtml){
    var s = stats();
    return '<header class="top"><div>' +
      '<div class="eyebrow">Training Path · Identity Security</div>' +
      '<h1>' + esc(CUR.title) + '</h1>' +
      (crumbHtml ? '<div class="crumbs">' + crumbHtml + '</div>' : '<div class="sub">' + esc(CUR.subtitle) + '</div>') +
      '</div></header>' + statsBar();
  }
  function stageById(sid){ return CUR.stages.find(function(s){ return s.id === sid; }); }
  function stageStats(st){
    var p = prog(), done = 0;
    st.lessons.forEach(function(l){ if (p.lessons[st.id + "/" + l.id]) done++; });
    var q = p.quizzes[st.id];
    var total = st.lessons.length + (st.quiz && st.quiz.length ? 1 : 0);
    var units = done + (q && q.passed ? 1 : 0);
    return { lessonsDone: done, lessonsTotal: st.lessons.length, quizPassed: !!(q && q.passed), quiz: q, pct: total ? Math.round(units / total * 100) : 0 };
  }
  function firstIncomplete(){
    var p = prog();
    for (var i = 0; i < CUR.stages.length; i++) { var st = CUR.stages[i];
      for (var j = 0; j < st.lessons.length; j++) if (!p.lessons[st.id + "/" + st.lessons[j].id]) return "#/lesson/" + st.id + "/" + st.lessons[j].id;
      if (st.quiz && st.quiz.length && !(p.quizzes[st.id] && p.quizzes[st.id].passed)) return "#/quiz/" + st.id; }
    return null;
  }

  /* ---------- overview ---------- */
  function viewOverview(){
    document.title = CUR.title;
    var s = stats(), resume = firstIncomplete();
    var html = header("");
    html += '<div class="overall"><div class="minibar big"><i style="width:' + Math.round(s.stagesDone / CUR.stages.length * 100) + '%"></i></div>' +
      '<span>' + s.stagesDone + '/' + CUR.stages.length + ' stages</span>' +
      (resume ? '<button class="primary" id="resume">Continue →</button>' : '<span class="badge done">Course complete 🎉</span>') +
      '<a class="ghostlink" href="#/profile">Profile</a></div>';
    html += '<div class="stagegrid">';
    CUR.stages.forEach(function(st, ix){
      var ss = stageStats(st); var cls = ss.pct === 100 ? "done" : (ss.pct > 0 ? "started" : "");
      html += '<button class="stagecard ' + cls + '" data-stage="' + esc(st.id) + '">' +
        '<div class="row"><span class="num">' + (ss.pct === 100 ? "✓" : ix) + '</span><span class="t">' + esc(st.title) + '</span></div>' +
        '<div class="s">' + esc(st.summary) + '</div>' +
        '<div class="meta"><span class="minibar"><i style="width:' + ss.pct + '%"></i></span>' +
        '<span>' + ss.lessonsDone + '/' + ss.lessonsTotal + ' lessons' + (st.quiz && st.quiz.length ? (ss.quizPassed ? " · quiz ✓" : " · quiz") : "") + '</span></div></button>';
    });
    html += '</div><footer class="foot"><span>Progress, XP, and badges are saved in this browser.</span>' +
      (LB ? '<span><a href="#/leaderboard">See the leaderboard →</a></span>' : '') + '</footer>';
    app.innerHTML = html;
    app.querySelectorAll(".stagecard").forEach(function(b){ b.onclick = function(){ location.hash = "#/stage/" + b.dataset.stage; }; });
    var r = document.getElementById("resume"); if (r) r.onclick = function(){ location.hash = resume; };
  }

  /* ---------- stage ---------- */
  function viewStage(sid){
    var st = stageById(sid); if (!st) { location.hash = "#/"; return; }
    document.title = st.title + " — " + CUR.title;
    var p = prog(), ix = CUR.stages.indexOf(st);
    var html = header('<a href="#/">← All stages</a>');
    html += '<h2 style="margin:4px 0 2px">Stage ' + ix + ' — ' + esc(st.title) + '</h2>' +
      '<p class="note" style="max-width:72ch">' + esc(st.summary) + '</p>';
    html += '<ol class="lessonlist" style="margin-top:14px">';
    st.lessons.forEach(function(l){
      var done = !!p.lessons[st.id + "/" + l.id];
      html += '<li><button class="lessonrow ' + (done ? "done" : "") + '" data-l="' + esc(l.id) + '">' +
        '<span class="check">' + (done ? "✓" : "") + '</span>' +
        '<span><span class="lt">' + esc(l.title) + '</span><br><span class="lo">' + esc(l.objective) + '</span></span>' +
        '<span class="xpchip">+15 XP</span></button></li>';
    });
    if (st.quiz && st.quiz.length) {
      var q = p.quizzes[st.id];
      html += '<li><button class="lessonrow quizrow ' + (q && q.passed ? "done" : "") + '" data-quiz="1">' +
        '<span class="check">' + (q && q.passed ? "✓" : "?") + '</span>' +
        '<span><span class="lt">Stage quiz — ' + st.quiz.length + ' questions</span><br><span class="lo">' +
        (q ? "Best: " + (q.best != null ? q.best : q.score) + "/" + q.total + (q.passed ? " (passed)" : " — 70% to pass") : "Score 70%+ to complete the stage · +10 XP per correct") +
        '</span></span><span class="xpchip">' + (st.quiz.length * 10) + ' XP</span></button></li>';
    }
    html += '</ol>';
    app.innerHTML = html;
    app.querySelectorAll(".lessonrow[data-l]").forEach(function(b){ b.onclick = function(){ location.hash = "#/lesson/" + st.id + "/" + b.dataset.l; }; });
    var qb = app.querySelector(".lessonrow[data-quiz]"); if (qb) qb.onclick = function(){ location.hash = "#/quiz/" + st.id; };
  }

  /* ---------- lesson ---------- */
  function nextAfterLesson(st, lid){
    var i = st.lessons.findIndex(function(l){ return l.id === lid; });
    if (i >= 0 && i < st.lessons.length - 1) return "#/lesson/" + st.id + "/" + st.lessons[i + 1].id;
    if (st.quiz && st.quiz.length) return "#/quiz/" + st.id;
    var six = CUR.stages.indexOf(st);
    return six < CUR.stages.length - 1 ? "#/stage/" + CUR.stages[six + 1].id : "#/";
  }
  function viewLesson(sid, lid){
    var st = stageById(sid); if (!st) { location.hash = "#/"; return; }
    var l = st.lessons.find(function(x){ return x.id === lid; }); if (!l) { location.hash = "#/stage/" + sid; return; }
    document.title = l.title + " — " + CUR.title;
    var p = prog(), done = !!p.lessons[st.id + "/" + l.id], ix = st.lessons.indexOf(l);
    var html = header('<a href="#/">All stages</a> · <a href="#/stage/' + esc(st.id) + '">' + esc(st.title) + '</a> · Lesson ' + (ix + 1) + ' of ' + st.lessons.length);
    html += '<h2 style="margin:4px 0 2px">' + esc(l.title) + '</h2><p class="note">' + esc(l.objective) + '</p>' +
      '<div class="lesson-body">' + l.content + '</div>';
    if (l.links && l.links.length) html += '<div class="linkchips">' + l.links.map(function(k){ return '<a href="' + esc(k.href) + '" target="_blank" rel="noopener">' + esc(k.label) + ' ↗</a>'; }).join("") + '</div>';
    html += '<div class="btnrow"><button class="primary" id="donebtn">' + (done ? "Next →" : "Mark complete & continue →") + '</button>' +
      (done ? '<button class="ghost" id="undo">Mark incomplete</button>' : "") + '</div>';
    app.innerHTML = html;
    document.getElementById("donebtn").onclick = function(){
      if (!done) withProgress(function(pp){ pp.lessons[st.id + "/" + l.id] = true; });
      location.hash = nextAfterLesson(st, lid);
    };
    var u = document.getElementById("undo");
    if (u) u.onclick = function(){ var pp = prog(); delete pp.lessons[st.id + "/" + l.id]; save(pp); viewLesson(sid, lid); };
  }

  /* ---------- quiz ---------- */
  function viewQuiz(sid){
    var st = stageById(sid); if (!st || !st.quiz || !st.quiz.length) { location.hash = "#/stage/" + sid; return; }
    document.title = "Quiz: " + st.title + " — " + CUR.title;
    var qi = 0, score = 0, answered = false;
    function renderQ(){
      var q = st.quiz[qi];
      var html = header('<a href="#/">All stages</a> · <a href="#/stage/' + esc(st.id) + '">' + esc(st.title) + '</a> · Quiz ' + (qi + 1) + ' of ' + st.quiz.length);
      html += '<div class="progress" aria-hidden="true"><i style="width:' + (qi / st.quiz.length * 100) + '%"></i></div>';
      html += '<h2 style="margin:4px 0 12px;max-width:72ch">' + esc(q.q) + '</h2>';
      q.choices.forEach(function(c, i){ html += '<button class="choice" data-i="' + i + '"><span class="key">' + String.fromCharCode(65 + i) + '</span><span>' + esc(c) + '</span></button>'; });
      html += '<div id="fb"></div><div class="btnrow" id="nextrow" hidden><button class="primary" id="nq">' + (qi < st.quiz.length - 1 ? "Next question →" : "See results →") + '</button></div>';
      app.innerHTML = html; answered = false;
      app.querySelectorAll(".choice").forEach(function(b){
        b.onclick = function(){
          if (answered) return; answered = true;
          var pick = +b.dataset.i, ok = pick === q.answer; if (ok) score++;
          app.querySelectorAll(".choice").forEach(function(x){ x.setAttribute("disabled", ""); var i = +x.dataset.i;
            if (i === q.answer) x.classList.add("correct"); else if (i === pick) x.classList.add("wrong"); });
          document.getElementById("fb").innerHTML = '<div class="explain"><b>' + (ok ? "Correct. +10 XP" : "Not quite.") + '</b> ' + esc(q.explain) + '</div>';
          document.getElementById("nextrow").hidden = false; document.getElementById("nq").focus();
        };
      });
      document.getElementById("nq").onclick = function(){ if (qi < st.quiz.length - 1) { qi++; renderQ(); } else renderScore(); };
    }
    function renderScore(){
      var total = st.quiz.length, pct = Math.round(score / total * 100), passed = pct >= 70;
      var after = withProgress(function(pp){
        var prev = pp.quizzes[st.id] || {};
        var best = Math.max(prev.best != null ? prev.best : (prev.score || 0), score);
        pp.quizzes[st.id] = { score: score, best: best, total: total, passed: passed || !!prev.passed };
      });
      var six = CUR.stages.indexOf(st), nxt = six < CUR.stages.length - 1 ? CUR.stages[six + 1] : null;
      app.innerHTML = header('<a href="#/">All stages</a> · <a href="#/stage/' + esc(st.id) + '">' + esc(st.title) + '</a>') +
        '<div class="panel"><div class="body scorebox">' +
        '<div class="big">' + score + ' / ' + total + '</div>' +
        '<div class="msg">' + (passed ? (pct === 100 ? "Flawless — stage complete!" : "Passed — stage complete.") : "You need 70% to pass. Review the lessons and retake it.") + '</div>' +
        '<div class="btnrow" style="justify-content:center;margin-top:20px">' +
        (passed && nxt ? '<button class="primary" id="go">Start Stage ' + (six + 1) + ' →</button>' : "") +
        (!passed ? '<button class="primary" id="retake">Retake quiz</button>' : "") +
        '<button class="ghost" id="back">Back to stage</button>' +
        (passed && !nxt ? '<button class="primary" id="home">Finish course →</button>' : "") +
        '</div></div></div>';
      var g = document.getElementById("go"); if (g) g.onclick = function(){ location.hash = "#/stage/" + nxt.id; };
      var r = document.getElementById("retake"); if (r) r.onclick = function(){ qi = 0; score = 0; renderQ(); };
      document.getElementById("back").onclick = function(){ location.hash = "#/stage/" + st.id; };
      var h = document.getElementById("home"); if (h) h.onclick = function(){ location.hash = "#/"; };
    }
    renderQ();
  }

  /* ---------- profile ---------- */
  function viewProfile(){
    document.title = "Profile — " + CUR.title;
    var p = prog(), s = stats();
    var pct = s.nextAt ? Math.round((s.xp - s.curAt) / (s.nextAt - s.curAt) * 100) : 100;
    var html = header('<a href="#/">← All stages</a>');
    html += '<div class="panel"><div class="body">' +
      '<div class="prow"><div class="ring">Lv<br><b>' + (s.level + 1) + '</b></div>' +
      '<div style="flex:1"><div class="lname">' + esc(s.levelName) + '</div>' +
      '<div class="overall" style="margin:8px 0 4px"><span class="minibar big"><i style="width:' + pct + '%"></i></span>' +
      '<span>' + s.xp + ' XP' + (s.nextAt ? ' / ' + s.nextAt : ' · max level') + '</span></div>' +
      '<div class="pstats">🔥 ' + s.streak + '-day streak · ' + s.stagesDone + '/' + CUR.stages.length + ' stages · ' +
      s.perfectQuizzes + ' perfect ' + (s.perfectQuizzes === 1 ? "quiz" : "quizzes") + '</div></div></div>' +
      '<div class="nameedit"><label>Display name <input id="pname" maxlength="24" placeholder="Anonymous" value="' + esc(p.name || "") + '"></label>' +
      '<button class="ghost" id="savename">Save</button>' + (LB ? '<button class="primary" id="submit">Submit to leaderboard</button>' : '') + '</div>' +
      '</div></div>';
    html += '<h2 style="margin:20px 0 4px">Badges <span class="muted">(' + s.badges.length + '/' + BADGES.length + ')</span></h2>';
    html += '<div class="badgegrid">' + BADGES.map(function(b){
      var earned = s.badges.indexOf(b.id) >= 0;
      return '<div class="badge-card ' + (earned ? "earned" : "locked") + '" title="' + esc(b.desc) + '">' +
        '<div class="bi">' + b.icon + '</div><div class="bn">' + esc(b.name) + '</div><div class="bd">' + esc(b.desc) + '</div></div>';
    }).join("") + '</div>';
    html += '<div class="btnrow" style="margin-top:22px"><button class="reset" id="reset">Reset all progress</button></div>';
    app.innerHTML = html;
    document.getElementById("savename").onclick = function(){ var pp = prog(); pp.name = document.getElementById("pname").value.trim().slice(0, 24); save(pp); toast("Name saved"); if (LB) submitScore(stats()); };
    var sub = document.getElementById("submit"); if (sub) sub.onclick = function(){ var pp = prog(); pp.name = document.getElementById("pname").value.trim().slice(0, 24); save(pp); submitScore(stats()); toast("Submitted to leaderboard 🏅"); };
    document.getElementById("reset").onclick = function(){ if (confirm("Reset all training progress, XP, and badges in this browser?")) { var id = prog().playerId; localStorage.removeItem(KEY); route(); } };
  }

  /* ---------- leaderboard ---------- */
  function viewLeaderboard(){
    document.title = "Leaderboard — " + CUR.title;
    app.innerHTML = header('<a href="#/">← All stages</a>') + '<h2 style="margin:4px 0 10px">Leaderboard</h2><p class="note" id="lbnote">Loading…</p>';
    var me = prog().playerId;
    fetchLeaderboard().then(function(rows){
      var html = '<div class="scroll"><table class="lbtable"><thead><tr><th>#</th><th>Player</th><th>Level</th><th>Badges</th><th>XP</th></tr></thead><tbody>' +
        rows.map(function(r, i){ return '<tr class="' + (r.playerId === me ? "me" : "") + '"><td>' + (i + 1) + '</td><td>' + esc(r.name || "Anonymous") +
          (r.playerId === me ? ' <span class="youtag">you</span>' : '') + '</td><td>' + (r.levelName ? esc(r.levelName) : ("Lv " + (r.level || 1))) + '</td><td>🏅 ' + (r.badges || 0) + '</td><td>' + (r.xp || 0) + '</td></tr>'; }).join("") +
        '</tbody></table></div>' + (rows.length ? "" : '<p class="note">No scores yet — be the first! Submit from your <a href="#/profile">profile</a>.</p>');
      document.getElementById("lbnote").outerHTML = html;
    }).catch(function(){ document.getElementById("lbnote").innerHTML = "Couldn't reach the leaderboard service. Your progress is still saved locally."; });
  }

  /* ---------- router ---------- */
  function route(){
    if (!CUR) return;
    var parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    if (parts[0] === "stage" && parts[1]) viewStage(parts[1]);
    else if (parts[0] === "lesson" && parts[1] && parts[2]) viewLesson(parts[1], parts[2]);
    else if (parts[0] === "quiz" && parts[1]) viewQuiz(parts[1]);
    else if (parts[0] === "profile") viewProfile();
    else if (parts[0] === "leaderboard" && LB) viewLeaderboard();
    else viewOverview();
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);

  var data = window.__CURRICULUM__;
  (data ? Promise.resolve(data) : fetch("curriculum.json").then(function(r){ if (!r.ok) throw new Error(r.status); return r.json(); }))
    .then(function(c){ CUR = c; route(); })
    .catch(function(){ app.innerHTML = '<div class="panel"><div class="body"><p class="lede">Could not load curriculum.json.</p></div></div>'; });
})();
