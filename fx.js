/* Stitchnotbitch home effects: photo scrub on the toy cards + the featured photo
   stack. Progressive: without this file the cards are plain links and the stack
   is a sideways swipe row. The hand-cut frames, drawn marks and sticker are
   static HTML/CSS (written by generate.py), so they don't need it. */
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var es = document.documentElement.lang === "es";
  var T = es ? { of: " de ", photo: "Foto ", photos: "Fotos de ", friend: "este amiguito" }
             : { of: " of ", photo: "Photo ", photos: "Photos of ", friend: "this friend" };

  // hover (mouse) or tap a dot (touch) to see the other photos of a friend
  document.querySelectorAll("a.wallframe[data-scrub]").forEach(function (a) {
    var srcs = a.getAttribute("data-scrub").split(",");
    var name = (a.querySelector(".wallframe__cap") || {}).textContent || T.friend;
    var n = srcs.length + 1;
    var card = document.createElement("div");
    card.className = a.className + " scrubcard";
    a.className = "wallframe__link";
    a.removeAttribute("data-scrub");
    a.parentNode.insertBefore(card, a);
    card.appendChild(a);
    var mat = a.querySelector(".wallframe__mat");
    var cover = mat.querySelector("img");
    var layers = srcs.map(function (s) {
      var im = document.createElement("img");
      im.className = "scrub__layer"; im.alt = ""; im.loading = "lazy"; im.decoding = "async"; im.src = s;
      mat.insertBefore(im, cover.nextSibling);
      return im;
    });
    var dots = document.createElement("div");
    dots.className = "scrub__dots"; dots.setAttribute("role", "group"); dots.setAttribute("aria-label", T.photos + name.trim());
    var btns = [];
    for (var i = 0; i < n; i++) {
      var b = document.createElement("button");
      b.type = "button"; b.setAttribute("aria-label", T.photo + (i + 1) + T.of + n);
      b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
      (function (k) { b.addEventListener("click", function () { picked = k; show(k); }); })(i);
      dots.appendChild(b); btns.push(b);
    }
    card.appendChild(dots);
    var picked = 0;
    function show(k) {
      layers.forEach(function (l, j) { l.classList.toggle("on", j === k - 1); });
      btns.forEach(function (b, j) { b.setAttribute("aria-pressed", j === k ? "true" : "false"); });
    }
    function place() { dots.style.top = (mat.offsetTop + mat.offsetHeight - 15) + "px"; }
    place();
    if ("ResizeObserver" in window) new ResizeObserver(place).observe(mat);
    mat.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var r = mat.getBoundingClientRect();
      show(Math.min(n - 1, Math.max(0, Math.floor((e.clientX - r.left) / r.width * n))));
    });
    mat.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") show(picked); });
  });

  // fanned photo stack for the featured friend
  var deck = document.getElementById("deck");
  if (deck) {
    var cards = [].slice.call(deck.children), n = cards.length, ROT = [-1.4, 4, -5, 7], count = document.getElementById("deck-n");
    cards.forEach(function (c, i) { c.dataset.i = i; });
    deck.classList.add("is-stack");
    deck.parentElement.classList.add("has-deck");
    var lay = function () {
      cards.forEach(function (c, k) {
        c.style.setProperty("--k", k); c.style.setProperty("--rot", ROT[k % ROT.length] + "deg"); c.style.setProperty("--z", n - k);
        c.style.transform = ""; c.setAttribute("aria-hidden", k ? "true" : "false");
      });
      count.textContent = (+cards[0].dataset.i + 1) + T.of + n;
    };
    var go = function (d) { if (d > 0) cards.push(cards.shift()); else cards.unshift(cards.pop()); lay(); };
    document.querySelectorAll("[data-deck]").forEach(function (b) { b.addEventListener("click", function () { go(+b.dataset.deck); }); });
    var pid = null, sx = 0, dx = 0;
    deck.addEventListener("pointerdown", function (e) {
      var c = cards[0];
      if (pid !== null || e.button > 0 || !c.contains(e.target)) return;
      pid = e.pointerId; sx = e.clientX; dx = 0; c.classList.add("is-drag"); c.setPointerCapture(pid);
    });
    deck.addEventListener("pointermove", function (e) {
      if (e.pointerId !== pid) return;
      dx = e.clientX - sx; cards[0].style.transform = "translateX(" + dx + "px) rotate(" + (dx * 0.06) + "deg)";
    });
    var end = function (e) {
      if (e.pointerId !== pid) return;
      pid = null;
      var c = cards[0];
      c.classList.remove("is-drag");
      if (Math.abs(dx) > Math.min(100, c.offsetWidth * 0.3)) {
        var s = dx > 0 ? 1 : -1;
        c.style.transform = "translateX(" + (s * 125) + "%) rotate(" + (s * 16) + "deg)";
        setTimeout(function () { go(1); }, reduce ? 0 : 230);
      } else c.style.transform = "";
    };
    deck.addEventListener("pointerup", end);
    deck.addEventListener("pointercancel", end);
    lay();
  }
})();
