/* Training Path engine. Renders curriculum.json as a staged course with lessons, quizzes,
   and localStorage progress. Hash routing: #/ , #/stage/<id> , #/lesson/<sid>/<lid> , #/quiz/<sid> */
(function () {
  "use strict";
  var app = document.getElementById("app");
  var KEY = "identity-training-progress-v1";
  var CUR = null;

  function esc(s){return String(s==null?"":s).replace(/[&<>]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;"}[c];});}
  function load(){ try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(p){ try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {} }
  // progress shape: { lessons: {"sid/lid":true}, quizzes: {"sid":{score,total,passed}} }
  function prog(){ var p = load(); p.lessons = p.lessons || {}; p.quizzes = p.quizzes || {}; return p; }

  function stageStats(st){
    var p = prog(), done = 0;
    st.lessons.forEach(function(l){ if (p.lessons[st.id+"/"+l.id]) done++; });
    var quiz = p.quizzes[st.id];
    var total = st.lessons.length + (st.quiz && st.quiz.length ? 1 : 0);
    var units = done + (quiz && quiz.passed ? 1 : 0);
    return { lessonsDone: done, lessonsTotal: st.lessons.length, quizPassed: !!(quiz && quiz.passed),
             quizScore: quiz || null, pct: total ? Math.round(units/total*100) : 0 };
  }
  function overallPct(){
    var t = 0, d = 0;
    CUR.stages.forEach(function(st){ var s = stageStats(st);
      t += s.lessonsTotal + (st.quiz && st.quiz.length ? 1 : 0);
      d += s.lessonsDone + (s.quizPassed ? 1 : 0); });
    return t ? Math.round(d/t*100) : 0;
  }
  function firstIncomplete(){
    var p = prog();
    for (var i = 0; i < CUR.stages.length; i++) {
      var st = CUR.stages[i];
      for (var j = 0; j < st.lessons.length; j++)
        if (!p.lessons[st.id+"/"+st.lessons[j].id]) return "#/lesson/"+st.id+"/"+st.lessons[j].id;
      if (st.quiz && st.quiz.length && !(p.quizzes[st.id] && p.quizzes[st.id].passed)) return "#/quiz/"+st.id;
    }
    return null;
  }
  function stageById(sid){ return CUR.stages.find(function(s){ return s.id === sid; }); }

  function header(crumbHtml){
    return '<header class="top"><div>'+
      '<div class="eyebrow">Training Path · Identity Security</div>'+
      '<h1>'+esc(CUR.title)+'</h1>'+
      (crumbHtml ? '<div class="crumbs">'+crumbHtml+'</div>' : '<div class="sub">'+esc(CUR.subtitle)+'</div>')+
      '</div></header>';
  }

  /* ---------- Overview ---------- */
  function viewOverview(){
    document.title = CUR.title;
    var resume = firstIncomplete();
    var html = header("");
    html += '<div class="overall"><div class="minibar"><i style="width:'+overallPct()+'%"></i></div>'+
      '<span>'+overallPct()+'% complete</span>'+
      (resume ? '<button class="primary" id="resume">Continue where you left off →</button>' : '<span class="badge done">Course complete 🎉</span>')+
      '<button class="reset" id="reset">Reset progress</button></div>';
    html += '<div class="stagegrid">';
    CUR.stages.forEach(function(st, ix){
      var s = stageStats(st);
      var cls = s.pct === 100 ? "done" : (s.pct > 0 ? "started" : "");
      html += '<button class="stagecard '+cls+'" data-stage="'+esc(st.id)+'">'+
        '<div class="row"><span class="num">'+(s.pct===100?"✓":ix)+'</span><span class="t">'+esc(st.title)+'</span></div>'+
        '<div class="s">'+esc(st.summary)+'</div>'+
        '<div class="meta"><span class="minibar"><i style="width:'+s.pct+'%"></i></span>'+
        '<span>'+s.lessonsDone+'/'+s.lessonsTotal+' lessons'+(st.quiz && st.quiz.length ? (s.quizPassed?" · quiz ✓":" · quiz") : "")+'</span></div>'+
        '</button>';
    });
    html += '</div><footer class="foot"><span>Progress is saved in this browser (localStorage) — nothing leaves your machine.</span></footer>';
    app.innerHTML = html;
    app.querySelectorAll(".stagecard").forEach(function(b){ b.onclick = function(){ location.hash = "#/stage/"+b.dataset.stage; }; });
    var r = document.getElementById("resume"); if (r) r.onclick = function(){ location.hash = resume; };
    document.getElementById("reset").onclick = function(){
      if (confirm("Reset all training progress in this browser?")) { localStorage.removeItem(KEY); route(); }
    };
  }

  /* ---------- Stage ---------- */
  function viewStage(sid){
    var st = stageById(sid); if (!st) { location.hash = "#/"; return; }
    document.title = st.title + " — " + CUR.title;
    var p = prog(), s = stageStats(st);
    var ix = CUR.stages.indexOf(st);
    var html = header('<a href="#/">← All stages</a>');
    html += '<h2 style="margin:4px 0 2px">Stage '+ix+' — '+esc(st.title)+'</h2>'+
      '<p class="note" style="max-width:72ch">'+esc(st.summary)+'</p>'+
      (ix > 0 ? '<p class="recommend">Recommended after Stage '+(ix-1)+' — but nothing is locked; learn in the order that suits you.</p>' : '');
    html += '<ol class="lessonlist" style="margin-top:14px">';
    st.lessons.forEach(function(l){
      var done = !!p.lessons[st.id+"/"+l.id];
      html += '<li><button class="lessonrow '+(done?"done":"")+'" data-l="'+esc(l.id)+'">'+
        '<span class="check">'+(done?"✓":"")+'</span>'+
        '<span><span class="lt">'+esc(l.title)+'</span><br><span class="lo">'+esc(l.objective)+'</span></span></button></li>';
    });
    if (st.quiz && st.quiz.length) {
      var q = p.quizzes[st.id];
      html += '<li><button class="lessonrow quizrow '+(q && q.passed ? "done" : "")+'" data-quiz="1">'+
        '<span class="check">'+(q && q.passed ? "✓" : "?")+'</span>'+
        '<span><span class="lt">Stage quiz — '+st.quiz.length+' questions</span><br><span class="lo">'+
        (q ? "Best: "+q.score+"/"+q.total+(q.passed?" (passed)":" — 70% to pass, retake any time") : "Score 70% or better to complete the stage")+
        '</span></span></button></li>';
    }
    html += '</ol>';
    app.innerHTML = html;
    app.querySelectorAll(".lessonrow[data-l]").forEach(function(b){ b.onclick = function(){ location.hash = "#/lesson/"+st.id+"/"+b.dataset.l; }; });
    var qb = app.querySelector(".lessonrow[data-quiz]"); if (qb) qb.onclick = function(){ location.hash = "#/quiz/"+st.id; };
  }

  /* ---------- Lesson ---------- */
  function nextAfterLesson(st, lid){
    var i = st.lessons.findIndex(function(l){ return l.id === lid; });
    if (i >= 0 && i < st.lessons.length - 1) return "#/lesson/"+st.id+"/"+st.lessons[i+1].id;
    if (st.quiz && st.quiz.length) return "#/quiz/"+st.id;
    var six = CUR.stages.indexOf(st);
    return six < CUR.stages.length - 1 ? "#/stage/"+CUR.stages[six+1].id : "#/";
  }
  function viewLesson(sid, lid){
    var st = stageById(sid); if (!st) { location.hash = "#/"; return; }
    var l = st.lessons.find(function(x){ return x.id === lid; }); if (!l) { location.hash = "#/stage/"+sid; return; }
    document.title = l.title + " — " + CUR.title;
    var p = prog(), done = !!p.lessons[st.id+"/"+l.id];
    var ix = st.lessons.indexOf(l);
    var html = header('<a href="#/">All stages</a> · <a href="#/stage/'+esc(st.id)+'">'+esc(st.title)+'</a> · Lesson '+(ix+1)+' of '+st.lessons.length);
    html += '<h2 style="margin:4px 0 2px">'+esc(l.title)+'</h2>'+
      '<p class="note">'+esc(l.objective)+'</p>'+
      '<div class="lesson-body">'+l.content+'</div>';
    if (l.links && l.links.length) {
      html += '<div class="linkchips">'+l.links.map(function(k){
        return '<a href="'+esc(k.href)+'" target="_blank" rel="noopener">'+esc(k.label)+' ↗</a>';
      }).join("")+'</div>';
    }
    html += '<div class="btnrow">'+
      '<button class="primary" id="donebtn">'+(done ? "Next →" : "Mark complete & continue →")+'</button>'+
      (done ? '<button class="ghost" id="undo">Mark incomplete</button>' : "")+
      '</div>';
    app.innerHTML = html;
    document.getElementById("donebtn").onclick = function(){
      var pp = prog(); pp.lessons[st.id+"/"+l.id] = true; save(pp);
      location.hash = nextAfterLesson(st, lid);
    };
    var u = document.getElementById("undo");
    if (u) u.onclick = function(){ var pp = prog(); delete pp.lessons[st.id+"/"+l.id]; save(pp); viewLesson(sid, lid); };
  }

  /* ---------- Quiz ---------- */
  function viewQuiz(sid){
    var st = stageById(sid); if (!st || !st.quiz || !st.quiz.length) { location.hash = "#/stage/"+sid; return; }
    document.title = "Quiz: " + st.title + " — " + CUR.title;
    var qi = 0, score = 0, answered = false;

    function renderQ(){
      var q = st.quiz[qi];
      var html = header('<a href="#/">All stages</a> · <a href="#/stage/'+esc(st.id)+'">'+esc(st.title)+'</a> · Quiz '+(qi+1)+' of '+st.quiz.length);
      html += '<div class="progress" aria-hidden="true"><i style="width:'+((qi)/st.quiz.length*100)+'%"></i></div>';
      html += '<h2 style="margin:4px 0 12px;max-width:72ch">'+esc(q.q)+'</h2>';
      q.choices.forEach(function(c, i){
        html += '<button class="choice" data-i="'+i+'"><span class="key">'+String.fromCharCode(65+i)+'</span><span>'+esc(c)+'</span></button>';
      });
      html += '<div id="fb"></div><div class="btnrow" id="nextrow" hidden><button class="primary" id="nq">'+(qi < st.quiz.length-1 ? "Next question →" : "See results →")+'</button></div>';
      app.innerHTML = html;
      answered = false;
      app.querySelectorAll(".choice").forEach(function(b){
        b.onclick = function(){
          if (answered) return; answered = true;
          var pick = +b.dataset.i, ok = pick === q.answer;
          if (ok) score++;
          app.querySelectorAll(".choice").forEach(function(x){
            x.setAttribute("disabled", "");
            var i = +x.dataset.i;
            if (i === q.answer) x.classList.add("correct");
            else if (i === pick) x.classList.add("wrong");
          });
          document.getElementById("fb").innerHTML = '<div class="explain"><b>'+(ok ? "Correct." : "Not quite.")+'</b> '+esc(q.explain)+'</div>';
          document.getElementById("nextrow").hidden = false;
          document.getElementById("nq").focus();
        };
      });
      document.getElementById("nq").onclick = function(){
        if (qi < st.quiz.length - 1) { qi++; renderQ(); } else { renderScore(); }
      };
    }
    function renderScore(){
      var total = st.quiz.length, pct = Math.round(score/total*100), passed = pct >= 70;
      var pp = prog();
      var prev = pp.quizzes[st.id];
      if (!prev || score > prev.score || (passed && !prev.passed))
        pp.quizzes[st.id] = { score: score, total: total, passed: passed || !!(prev && prev.passed) };
      save(pp);
      var six = CUR.stages.indexOf(st);
      var nxt = six < CUR.stages.length - 1 ? CUR.stages[six+1] : null;
      app.innerHTML = header('<a href="#/">All stages</a> · <a href="#/stage/'+esc(st.id)+'">'+esc(st.title)+'</a>')+
        '<div class="panel"><div class="body scorebox">'+
        '<div class="big">'+score+' / '+total+'</div>'+
        '<div class="msg">'+(passed ? "Passed — stage complete. Nice work." : "You need 70% to pass. Review the lessons and retake it — the questions don't change, but your understanding will.")+'</div>'+
        '<div class="btnrow" style="justify-content:center;margin-top:20px">'+
        (passed && nxt ? '<button class="primary" id="go">Start Stage '+(six+1)+': '+esc(nxt.title)+' →</button>' : "")+
        (!passed ? '<button class="primary" id="retake">Retake quiz</button>' : "")+
        '<button class="ghost" id="back">Back to stage</button>'+
        (passed && !nxt ? '<button class="primary" id="home">Finish course →</button>' : "")+
        '</div></div></div>';
      var g = document.getElementById("go"); if (g) g.onclick = function(){ location.hash = "#/stage/"+nxt.id; };
      var r = document.getElementById("retake"); if (r) r.onclick = function(){ qi = 0; score = 0; renderQ(); };
      document.getElementById("back").onclick = function(){ location.hash = "#/stage/"+st.id; };
      var h = document.getElementById("home"); if (h) h.onclick = function(){ location.hash = "#/"; };
    }
    renderQ();
  }

  /* ---------- Router ---------- */
  function route(){
    var h = location.hash.replace(/^#\/?/, "");
    var parts = h.split("/").filter(Boolean);
    if (!CUR) return;
    if (parts[0] === "stage" && parts[1]) viewStage(parts[1]);
    else if (parts[0] === "lesson" && parts[1] && parts[2]) viewLesson(parts[1], parts[2]);
    else if (parts[0] === "quiz" && parts[1]) viewQuiz(parts[1]);
    else viewOverview();
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);

  var data = window.__CURRICULUM__;
  (data ? Promise.resolve(data) : fetch("curriculum.json").then(function(r){ if (!r.ok) throw new Error(r.status); return r.json(); }))
    .then(function(c){ CUR = c; route(); })
    .catch(function(){ app.innerHTML = '<div class="panel"><div class="body"><p class="lede">Could not load curriculum.json.</p></div></div>'; });
})();
