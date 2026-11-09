/* Tap-to-zoom for a toy page: vanilla port of the factory kit's PhotoZoom.
   Fail-safe: #pZoom is a plain link to the photo file; this only intercepts it.
   Words come from the dialog's data-l-* attributes (generate.py, EN/ES). */
(function () {
  var dlg = document.getElementById("sz"), link = document.getElementById("pZoom"), main = document.getElementById("pImg");
  if (!dlg || !link || !main) return;
  var thumbs = [].slice.call(document.querySelectorAll(".product__thumbs button"));
  var set = thumbs.length ? thumbs.map(function (b) { return b.getAttribute("data-src"); }) : [link.getAttribute("href")];
  var title = (document.querySelector(".product__name") || {}).textContent || "";
  var img = dlg.querySelector(".sz__img"), cap = dlg.querySelector(".sz__cap"), count = dlg.querySelector(".sz__count"), say = dlg.querySelector(".sz__say");
  var steps = [].slice.call(dlg.querySelectorAll("[data-step]"));
  var L = function (k, n) { return (dlg.getAttribute("data-l-" + k) || "").replace("%n", n).replace("%t", set.length); };
  var at = 0, busy = false, x0 = 0, y0 = 0, touch = false, swiped = 0;

  var moving = function () { return "startViewTransition" in document && !matchMedia("(prefers-reduced-motion: reduce)").matches; };
  var vt = function (fn, morph) {
    if (morph !== false && moving()) return document.startViewTransition(fn).finished.catch(function () {});
    fn(); return Promise.resolve();
  };
  var name = function (el, n) { if (el) el.style.viewTransitionName = n || ""; };
  var decoded = function (el) {
    return moving() ? Promise.race([el.decode().catch(function () {}), new Promise(function (r) { setTimeout(r, 500); })]) : Promise.resolve();
  };
  var wrap = function (i) { return (i + set.length) % set.length; };

  // keep the link and the morph source in step with the thumbnail picker
  thumbs.forEach(function (b, i) {
    b.addEventListener("click", function () { at = i; link.href = set[i]; link.setAttribute("aria-label", L("enlarge", i + 1)); });
  });

  function show(i) {
    at = wrap(i);
    img.onload = function () { img.style.setProperty("--w", img.naturalWidth + "px"); img.style.setProperty("--r", img.naturalWidth / img.naturalHeight); };
    img.src = set[at];
    img.alt = title + " — " + L("alt", at + 1);
    cap.textContent = title;
    count.textContent = (at + 1) + " / " + set.length;
    say.textContent = L("say", at + 1);
    if (set.length > 1) { new Image().src = set[wrap(at + 1)]; new Image().src = set[wrap(at - 1)]; }
  }
  function syncMain() {
    main.src = set[at]; link.href = set[at];
    thumbs.forEach(function (b, j) { b.setAttribute("aria-current", j === at ? "true" : "false"); });
  }

  function open() {
    if (busy || dlg.open) return;
    busy = true;
    steps.concat([count]).forEach(function (el) { el.hidden = set.length < 2; });
    show(at);
    decoded(img).then(function () {
      name(main, "sz");
      return vt(function () { name(main); name(img, "sz"); dlg.showModal(); });
    }).then(function () { name(img); busy = false; });
  }
  function step(d) {
    if (busy || !dlg.open || set.length < 2) return;
    busy = true;
    var pre = new Image(); pre.src = set[wrap(at + d)];
    decoded(pre).then(function () {
      name(img, "sz");
      return vt(function () { show(at + d); });
    }).then(function () { name(img); busy = false; });
  }
  function close(byScroll) {
    if (!dlg.open || busy) return;
    busy = true;
    var r = main.getBoundingClientRect(), inView = r.bottom > 0 && r.top < innerHeight;
    name(img, "sz");
    vt(function () {
      name(img); dlg.close(); syncMain();
      if (inView) name(main, "sz");
      link.focus({ preventScroll: byScroll || inView });
    }, inView).then(function () { name(main); busy = false; });
  }

  link.addEventListener("click", function (e) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault(); open();
  });
  dlg.addEventListener("click", function (e) {
    if (Date.now() - swiped < 400) return;
    var b = e.target.closest("button");
    if (b && b.dataset.step) step(+b.dataset.step); else close();
  });
  dlg.addEventListener("cancel", function (e) { e.preventDefault(); close(); });
  dlg.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") step(-1); else if (e.key === "ArrowRight") step(1); });
  var zoomed = function () { return ((window.visualViewport && visualViewport.scale) || 1) > 1.01; };
  dlg.addEventListener("wheel", function (e) { if (!zoomed() && Math.abs(e.deltaY) > Math.abs(e.deltaX)) close(true); }, { passive: true });
  addEventListener("scroll", function () { if (dlg.open && !zoomed()) close(true); }, { passive: true });
  dlg.addEventListener("touchstart", function (e) { touch = e.touches.length === 1 && !zoomed(); x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  dlg.addEventListener("touchmove", function (e) {
    if (!touch) return;
    var dx = e.touches[0].clientX - x0, dy = e.touches[0].clientY - y0;
    if (Math.abs(dy) > 24 && Math.abs(dy) > Math.abs(dx)) { touch = false; close(true); }
  }, { passive: true });
  dlg.addEventListener("touchend", function (e) {
    if (!touch) return;
    touch = false;
    var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) { swiped = Date.now(); step(dx < 0 ? 1 : -1); }
  }, { passive: true });
})();
