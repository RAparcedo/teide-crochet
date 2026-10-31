/* Stitchnotbitch — AEPD cookie banner + the Google Analytics loader it gates.
 *
 * One file, loaded with `defer` on every page. Ported from Rafix's
 * ConsentBanner.astro (same rules, same storage record as kit/src/lib/consent.ts):
 *  - Reject and Accept are the SAME button style, side by side, Reject first in
 *    tab order (AEPD 2023 ruling). Restyle one, restyle both.
 *  - No close-X; scrolling or clicking outside is not consent.
 *  - gtag.js is injected ONLY from a granted state (EDPB 03/2022 §43) — nothing
 *    reaches Google before a choice.
 *  - Withdrawal is always one tap away: every footer has a `data-consent-reopen`
 *    button (it and any `data-consent-ui` wrapper stay hidden until this script
 *    runs, so they never show dead).
 *  - Copy follows <html lang> and re-renders if legal.html's EN/ES toggle flips it.
 *  - Re-asks after 24 months (AEPD Guía §4.4) or when POLICY_VERSION changes.
 *
 * GA_ID must match content.json site.ga4_measurement_id and the `_ga_…` cookie
 * named in legal.html — generate.py warns if they drift.
 */
(function () {
  var GA_ID = "G-9BM3GKD7X7";
  var KEY = "wf:consent:v1";
  var POLICY_VERSION = "1.0.0";
  var REPROMPT_MS = 1000 * 60 * 60 * 24 * 30 * 24;

  var COPY = {
    en: {
      note: "a little note",
      title: "Cookies, only if you say so",
      body: "We'd like to use Google Analytics to see which friends people like and how they find us. It only switches on if you accept. If you reject, the site works exactly the same and no cookies are saved.",
      reject: "Reject", accept: "Accept", prefs: "Settings",
      policy: "Cookie policy",
      prefsTitle: "Cookie settings",
      prefsBody: "Choose what you allow. Technical storage can't be switched off — the site needs it to remember your choices.",
      techLabel: "Technical (always on)",
      techDesc: "Remembers this choice and your language, so we don't ask on every visit. Never leaves your browser.",
      gaLabel: "Analytics — Google Analytics",
      gaDesc: "Tells us how many people visit, from which country, which pages they read and which friends they open on Etsy. We don't know who you are and we never sell this data.",
      save: "Save my choice"
    },
    es: {
      note: "una notita",
      title: "Cookies, solo si tú quieres",
      body: "Nos gustaría usar Google Analytics para saber qué amiguitos gustan más y cómo nos encuentra la gente. Solo se activa si lo aceptas. Si lo rechazas, la web funciona exactamente igual y no se guarda ninguna cookie.",
      reject: "Rechazar", accept: "Aceptar", prefs: "Configurar",
      policy: "Política de cookies",
      prefsTitle: "Ajustes de cookies",
      prefsBody: "Elige qué permites. El almacenamiento técnico no se puede desactivar: la web lo necesita para recordar tus elecciones.",
      techLabel: "Técnicas (siempre activas)",
      techDesc: "Recuerdan esta elección y tu idioma para no preguntarte en cada visita. No salen de tu navegador.",
      gaLabel: "Análisis — Google Analytics",
      gaDesc: "Nos dice cuántas personas visitan la web, desde qué país, qué páginas leen y qué amiguitos abren en Etsy. No sabemos quién eres y nunca vendemos estos datos.",
      save: "Guardar mi elección"
    }
  };

  var CSS =
    ".cb{position:fixed;z-index:1000;left:.75rem;right:.75rem;bottom:max(.75rem,env(safe-area-inset-bottom));display:flex;justify-content:center;pointer-events:none;}" +
    ".cb[hidden]{display:none;}" +
    "@media (min-width:48rem){.cb{justify-content:flex-end;right:1.25rem;bottom:1.25rem;}}" +
    ".cb__panel{pointer-events:auto;position:relative;width:100%;max-width:30rem;background:#FCF7F2;color:#5E4A52;border-radius:1.25rem;padding:1.15rem 1.3rem 1.05rem;box-shadow:0 18px 44px rgba(94,74,82,.24);font-family:\"Nunito\",system-ui,sans-serif;}" +
    ".cb__panel::before{content:\"\";position:absolute;inset:.42rem;border:1.5px dashed rgba(190,74,104,.42);border-radius:.95rem;pointer-events:none;}" +
    ".cb__note{margin:0;font-family:\"Caveat\",cursive;font-weight:700;font-size:1.3rem;line-height:1;color:#BE4A68;}" +
    ".cb__title{margin:.2rem 0 .4rem;font-family:\"Quicksand\",system-ui,sans-serif;font-weight:700;font-size:1.06rem;line-height:1.25;color:#5E4A52;}" +
    ".cb__body{margin:0 0 .9rem;font-size:.88rem;line-height:1.5;}" +
    ".cb__actions{display:flex;flex-wrap:wrap;gap:.5rem;}" +
    ".cb__btn{flex:1 1 6.5rem;min-height:2.75rem;padding:.55rem 1.1rem;border-radius:999px;border:2px solid #BE4A68;font-family:\"Quicksand\",system-ui,sans-serif;font-weight:700;font-size:.88rem;cursor:pointer;}" +
    ".cb__btn--main{background:#BE4A68;color:#FFF;}" +
    ".cb__btn--main:hover{background:#A23A55;border-color:#A23A55;}" +
    ".cb__btn--ghost{background:transparent;color:#5E4A52;border-color:#E58AA0;}" +
    ".cb__btn--ghost:hover{background:#FBEEF0;}" +
    ".cb__btn:focus-visible,.cb a:focus-visible,.cb input:focus-visible{outline:3px solid #5E4A52;outline-offset:2px;}" +
    ".cb__more{margin:.75rem 0 0;font-size:.8rem;}" +
    ".cb__more a{color:#A23A55;font-weight:700;text-decoration:underline;text-underline-offset:2px;}" +
    ".cb__cats{list-style:none;margin:0 0 .9rem;padding:0;display:grid;gap:.55rem;}" +
    ".cb__cat{background:#FFF;border-radius:.8rem;padding:.65rem .8rem;}" +
    ".cb__row{display:flex;align-items:center;gap:.6rem;font-family:\"Quicksand\",system-ui,sans-serif;font-weight:700;font-size:.9rem;}" +
    ".cb__row input{width:1.15rem;height:1.15rem;margin:0;accent-color:#BE4A68;}" +
    ".cb__desc{margin:.3rem 0 0 1.75rem;font-size:.8rem;line-height:1.45;}" +
    "button[data-consent-reopen]{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;text-decoration:inherit;}" +
    "button[data-consent-reopen]:hover{color:#BE4A68;}";

  function read() {
    try {
      var p = JSON.parse(localStorage.getItem(KEY) || "null");
      return p && p.timestamp && p.policyVersion && p.consents ? p : null;
    } catch (e) { return null; }
  }

  function write(consents) {
    var rec = {
      timestamp: Date.now(),
      policyVersion: POLICY_VERSION,
      consents: { necessary: true, preferencias: false, analisis: !!consents.analisis, publicidad: false }
    };
    try { localStorage.setItem(KEY, JSON.stringify(rec)); } catch (e) { /* private mode: we simply ask again next visit */ }
    return rec;
  }

  function shouldShow(rec) {
    if (!rec || rec.policyVersion !== POLICY_VERSION) return true;
    return Date.now() - rec.timestamp > REPROMPT_MS && rec.consents.analisis;
  }

  // gtag.js only ever loads from here, and only from a granted state.
  var loaded = false;
  function loadGA() {
    window["ga-disable-" + GA_ID] = false;
    if (loaded) { window.gtag("consent", "update", { analytics_storage: "granted" }); return; }
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "granted" });
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(s);
    window.gtag("js", new Date());
    // No anonymize_ip: a Universal Analytics flag GA4 ignores. Etsy taps are
    // recorded by the property's enhanced measurement (outbound clicks).
    window.gtag("config", GA_ID);
  }

  // Withdrawal: stop GA for the rest of this page and delete what it set.
  function stopGA() {
    window["ga-disable-" + GA_ID] = true;
    if (loaded) window.gtag("consent", "update", { analytics_storage: "denied" });
    var host = location.hostname, parts = host.split(".");
    var domains = ["", host, "." + host];
    if (parts.length > 2) domains.push("." + parts.slice(-2).join("."));
    document.cookie.split(";").forEach(function (c) {
      var name = c.split("=")[0].trim();
      if (name.indexOf("_ga") !== 0) return;
      domains.forEach(function (d) {
        document.cookie = name + "=; Max-Age=0; path=/" + (d ? "; domain=" + d : "");
      });
    });
  }

  function apply(rec) {
    if (rec && rec.consents.analisis) loadGA(); else stopGA();
  }

  var root, view = "banner";
  function lang() { return /^es/i.test(document.documentElement.lang) ? "es" : "en"; }

  function render() {
    var t = COPY[lang()], rec = read();
    var on = !!(rec && rec.consents.analisis);
    var head = '<p class="cb__note" aria-hidden="true">' + t.note + "</p>";
    var more = '<p class="cb__more"><a href="/legal.html#cookies">' + t.policy + "</a></p>";
    root.innerHTML = '<div class="cb__panel">' + (view === "banner"
      ? head + '<h2 class="cb__title" id="cb-title">' + t.title + "</h2>" +
        '<p class="cb__body">' + t.body + "</p>" +
        '<div class="cb__actions">' +
          '<button type="button" class="cb__btn cb__btn--main" data-cb="reject">' + t.reject + "</button>" +
          '<button type="button" class="cb__btn cb__btn--main" data-cb="accept">' + t.accept + "</button>" +
          '<button type="button" class="cb__btn cb__btn--ghost" data-cb="prefs">' + t.prefs + "</button>" +
        "</div>" + more
      : head + '<h2 class="cb__title" id="cb-title">' + t.prefsTitle + "</h2>" +
        '<p class="cb__body">' + t.prefsBody + "</p>" +
        '<ul class="cb__cats" role="list">' +
          '<li class="cb__cat"><label class="cb__row"><input type="checkbox" checked disabled /> ' + t.techLabel + "</label>" +
            '<p class="cb__desc">' + t.techDesc + "</p></li>" +
          '<li class="cb__cat"><label class="cb__row"><input type="checkbox" data-cb-ga' + (on ? " checked" : "") + " /> " + t.gaLabel + "</label>" +
            '<p class="cb__desc">' + t.gaDesc + "</p></li>" +
        "</ul>" +
        '<div class="cb__actions"><button type="button" class="cb__btn cb__btn--main" data-cb="save">' + t.save + "</button></div>" + more) +
      "</div>";
  }

  function show(which) { view = which; render(); root.hidden = false; }
  function close() { root.hidden = true; }

  function init() {
    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    root = document.createElement("div");
    root.className = "cb";
    root.hidden = true;
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "false");
    root.setAttribute("aria-labelledby", "cb-title");
    document.body.insertBefore(root, document.body.firstChild);

    root.addEventListener("click", function (e) {
      var btn = e.target.closest && e.target.closest("[data-cb]");
      if (!btn) return;
      var action = btn.getAttribute("data-cb");
      if (action === "prefs") { show("prefs"); root.querySelector("[data-cb-ga]").focus(); return; }
      if (action === "accept") apply(write({ analisis: true }));
      if (action === "reject") apply(write({ analisis: false }));
      if (action === "save") apply(write({ analisis: root.querySelector("[data-cb-ga]").checked }));
      close();
    });

    document.addEventListener("click", function (e) {
      var trigger = e.target.closest && e.target.closest("[data-consent-reopen]");
      if (!trigger) return;
      e.preventDefault();
      show("prefs");
      root.querySelector("[data-cb-ga]").focus();
    });
    var triggers = document.querySelectorAll("[data-consent-reopen],[data-consent-ui]");
    for (var i = 0; i < triggers.length; i++) triggers[i].hidden = false;

    // legal.html switches EN/ES in place — keep the banner in the reader's language.
    new MutationObserver(function () { if (!root.hidden) render(); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

    // An expired or outdated consent counts as none: ask again, load nothing.
    var rec = read();
    if (shouldShow(rec)) show("banner");
    else if (rec.consents.analisis) loadGA();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
