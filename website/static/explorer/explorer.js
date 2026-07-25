/* Flow Explorer engine. Reads ?flow=<id> and renders models/<id>.json as an interactive
   step-through; with no flow it renders a picker from models/index.json. Self-contained. */
(function () {
  "use strict";
  var app = document.getElementById("app");
  var flow = new URLSearchParams(location.search).get("flow");

  function esc(s){return String(s==null?"":s).replace(/[&<>]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;"}[c];});}
  function j(u){return fetch(u).then(function(r){if(!r.ok)throw new Error(r.status);return r.json();});}
  function errHtml(msg){return '<div class="panel"><div class="body"><p class="lede">'+esc(msg)+'</p>'+
    '<p class="note"><a href="./">← Back to all flows</a></p></div></div>';}

  if (flow) loadFlow(flow); else loadPicker();

  function loadPicker(){
    document.title = "Flow Explorer";
    j("models/index.json").then(function(list){
      var groups = {};
      list.forEach(function(f){ (groups[f.category]=groups[f.category]||[]).push(f); });
      var html = '<header class="top"><div>'+
        '<div class="eyebrow">Interactive · Authentication</div>'+
        '<h1>Flow Explorer</h1>'+
        '<div class="sub">Step through an authentication flow and see what each request carries — and how to read it in your browser’s Network tab. All sample values are synthetic.</div>'+
        '</div></header>';
      Object.keys(groups).sort().forEach(function(cat){
        html += '<div class="group-title">'+esc(cat)+'</div><div class="pickgrid">';
        groups[cat].sort(function(a,b){return a.title.localeCompare(b.title);}).forEach(function(f){
          html += '<a class="card" href="?flow='+encodeURIComponent(f.id)+'">'+
            '<div class="cat">'+esc(f.category)+'</div>'+
            '<div class="t">'+esc(f.title)+'</div>'+
            '<div class="n">'+esc(f.steps||"")+(f.steps?" steps":"")+'</div></a>';
        });
        html += '</div>';
      });
      app.innerHTML = html;
    }).catch(function(){ app.innerHTML = errHtml("Could not load the flow list (models/index.json)."); });
  }

  function loadFlow(id){
    j("models/"+id+".json").then(renderFlow).catch(function(){
      app.innerHTML = errHtml("Flow not found: "+id);
    });
  }

  function renderFlow(model){
    document.title = model.title + " — Flow Explorer";
    var steps = model.steps || [];
    var i = 0;

    app.innerHTML =
      '<header class="top"><div>'+
        '<div class="eyebrow"><a href="./">Flow Explorer</a> · '+esc(model.category||"")+'</div>'+
        '<h1>'+esc(model.title)+'</h1>'+
        '<div class="sub">'+esc(model.subtitle||"")+'</div>'+
      '</div><div class="controls">'+
        '<button class="nav" id="prev" aria-label="Previous step">← Prev</button>'+
        '<span class="counter" id="counter"></span>'+
        '<button class="nav" id="next" aria-label="Next step">Next →</button>'+
      '</div></header>'+
      '<div class="progress" aria-hidden="true"><i id="bar"></i></div>'+
      '<div class="grid"><nav aria-label="Flow steps"><ol class="timeline" id="timeline"></ol></nav>'+
      '<section id="inspector" aria-live="polite"></section></div>'+
      '<footer class="foot"><span>All values are <b>synthetic</b> — safe to share.</span>'+
      '<span>Navigate with <kbd>←</kbd> <kbd>→</kbd> or click a step.</span></footer>';

    var tl = document.getElementById("timeline");
    var insp = document.getElementById("inspector");
    var bar = document.getElementById("bar");
    var counter = document.getElementById("counter");
    var prevBtn = document.getElementById("prev");
    var nextBtn = document.getElementById("next");

    function A(n){return '<span class="chip '+esc(n)+'">'+esc(n)+"</span>";}
    function isBack(s){return s.from!==s.to && s.vis!=="browser" && (s.req||s.resp);}

    function timeline(){
      tl.innerHTML = steps.map(function(s,ix){
        return '<li><button class="step '+(ix===i?"active":"")+' '+(ix<i?"done":"")+'" data-ix="'+ix+'" '+(ix===i?'aria-current="step"':"")+'>'+
          '<span class="dot"></span>'+
          '<span class="lbl">'+esc(s.label)+(isBack(s)?'<span class="tag back">SERVER</span>':"")+'</span>'+
          '<span class="hop">'+esc(s.hop||"")+'</span></button></li>';
      }).join("");
      Array.prototype.forEach.call(tl.querySelectorAll(".step"),function(b){
        b.onclick=function(){i=+b.dataset.ix;render();};
      });
    }
    function tbl(rows){return '<div class="scroll"><table class="kv">'+rows.map(function(r){
      return '<tr><td class="k">'+esc(r[0])+'</td><td class="v">'+esc(r[1])+(r[2]?'<div class="cm">'+esc(r[2])+"</div>":"")+"</td></tr>";
    }).join("")+"</table></div>";}

    function reqCard(s){
      if(!s.req) return "";
      var b="";
      if(s.req.q&&s.req.q.length) b+='<div class="note" style="margin:2px 0 4px">Query string</div>'+tbl(s.req.q);
      if(s.req.headers&&s.req.headers.length) b+='<div class="note" style="margin:10px 0 4px">Headers</div>'+tbl(s.req.headers);
      if(s.req.form&&s.req.form.length) b+='<div class="note" style="margin:10px 0 4px">Form body (application/x-www-form-urlencoded)</div>'+tbl(s.req.form);
      if(s.req.json) b+='<div class="note" style="margin:10px 0 4px">Body</div><pre class="code">'+esc(s.req.json)+"</pre>";
      var m = s.req.method||"GET";
      return '<div class="panel"><div class="head"><span class="method '+esc(m)+'">'+esc(m)+'</span>'+
        '<span class="url">'+esc(s.req.url)+'</span></div><div class="body">'+b+"</div></div>";
    }
    function respCard(s){
      if(!s.resp) return "";
      var cls = s.resp.status<300?"ok":(s.resp.status<400?"redir":"err");
      var b="";
      if(s.resp.headers&&s.resp.headers.length) b+=tbl(s.resp.headers);
      if(s.resp.json) b+='<div class="note" style="margin:10px 0 4px">Body</div><pre class="code">'+esc(s.resp.json)+"</pre>";
      return '<div class="panel"><div class="head"><h2>Response</h2><span class="status '+cls+'">'+
        esc(s.resp.status)+" "+esc(s.resp.statusText||"")+"</span></div><div class=\"body\">"+b+"</div></div>";
    }
    function jwtCard(s){
      if(!s.jwt) return "";
      return '<div class="panel"><div class="head"><h2>'+esc(s.jwt.title||"Decoded token")+'</h2></div><div class="body">'+
        (s.jwt.header?'<div class="note" style="margin-bottom:4px">Header</div><pre class="code">'+esc(s.jwt.header)+"</pre>":"")+
        (s.jwt.payload?'<div class="note" style="margin:12px 0 4px">Claims</div>'+tbl(s.jwt.payload):"")+"</div></div>";
    }
    function codeCard(s){
      if(!s.code) return "";
      return '<div class="panel"><div class="head"><h2>'+esc(s.codeTitle||"Computed locally")+'</h2></div><div class="body"><pre class="code">'+esc(s.code)+"</pre></div></div>";
    }

    function render(){
      var s = steps[i];
      timeline();
      counter.textContent = (i+1)+" / "+steps.length;
      bar.style.width = ((i+1)/steps.length*100)+"%";
      prevBtn.disabled = i===0; nextBtn.disabled = i===steps.length-1;
      var back = isBack(s) ? '<div class="banner back"><b>Back-channel step.</b> This exchange is server-to-server (or local) and generally does <b>not</b> appear in the browser Network tab — inspect it with server logs or a proxy like mitmproxy instead.</div>' : "";
      insp.innerHTML =
        '<div class="actors">'+A(s.from)+' <span class="arrow">→</span> '+A(s.to)+"</div>"+
        '<p class="lede">'+esc(s.lede||"")+"</p>"+ back +
        codeCard(s)+reqCard(s)+respCard(s)+jwtCard(s)+
        '<div class="panel"><div class="head"><h2>In DevTools</h2></div><div class="body"><div class="devtools"><span class="ic">🔎</span><p>'+(s.devtools||"")+"</p></div></div></div>";
    }
    prevBtn.onclick=function(){if(i>0){i--;render();}};
    nextBtn.onclick=function(){if(i<steps.length-1){i++;render();}};
    document.addEventListener("keydown",function(e){
      if(e.key==="ArrowLeft"&&i>0){i--;render();}
      if(e.key==="ArrowRight"&&i<steps.length-1){i++;render();}
    });
    render();
  }
})();
