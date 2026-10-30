// KjG Rebland – Navigation (Mobilmenü + Angebote-Dropdown)
(function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("hauptnavigation");
  var ddButtons = document.querySelectorAll("[data-dropdown]");

  function closeDropdowns(except) {
    ddButtons.forEach(function (btn) {
      if (btn === except) return;
      btn.setAttribute("aria-expanded", "false");
      var menu = document.getElementById(btn.getAttribute("aria-controls"));
      if (menu) menu.classList.remove("is-open");
    });
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
      document.body.style.overflow = open ? "" : "hidden";
    });
  }

  ddButtons.forEach(function (btn) {
    var menu = document.getElementById(btn.getAttribute("aria-controls"));
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = btn.getAttribute("aria-expanded") === "true";
      closeDropdowns(btn);
      btn.setAttribute("aria-expanded", String(!open));
      if (menu) menu.classList.toggle("is-open", !open);
    });
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".has-dropdown")) closeDropdowns();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    closeDropdowns();
    if (toggle && toggle.getAttribute("aria-expanded") === "true") {
      toggle.click();
      toggle.focus();
    }
  });
})();

// Zeltlager: Landschaft schrumpft beim Scrollen zum Streifen, Hügel ziehen
// unterschiedlich schnell vorbei, zum Seitenende wird es Abend.
(function () {
  var scene = document.querySelector(".camp-scene");
  if (!scene || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var layer = function (name) { return scene.querySelector('[data-layer="' + name + '"]'); };
  var sky = layer("sky"), sun = layer("sun"), clouds = layer("clouds"), birds = layer("birds"),
      back = layer("back"), mid = layer("mid"), stars = layer("stars"), glow = layer("glow");
  // Hügel färben sich zum Abend von ihrer Tagesfarbe (fill) zur Nachtfarbe (data-hill)
  var rgb = function (hex) { return [1, 3, 5].map(function (i) { return parseInt(hex.slice(i, i + 2), 16); }); };
  var hills = Array.prototype.map.call(scene.querySelectorAll("[data-hill]"), function (el) {
    return { el: el, day: rgb(el.getAttribute("fill")), night: rgb(el.getAttribute("data-hill")) };
  });
  var clamp = function (v) { return Math.min(1, Math.max(0, v)); };
  var maxH = 0, minH = 0, ticking = false;

  // Größen aus den CSS-Variablen --scene-max / --scene-min messen
  function measure(variable) {
    scene.style.height = "var(" + variable + ")";
    return scene.getBoundingClientRect().height;
  }

  function resize() {
    maxH = measure("--scene-max");
    minH = measure("--scene-min");
    update();
  }

  function update() {
    ticking = false;
    var vh = window.innerHeight;
    var y = window.scrollY;
    var total = Math.max(1, document.documentElement.scrollHeight - vh);
    var shrink = clamp(y / (vh * 0.6));   // 0 = groß im Hero, 1 = schmaler Streifen
    var p = clamp(y / total);              // Fortschritt über die ganze Seite
    var dusk = clamp((p - 0.72) / 0.24);   // Abend kurz vor dem Seitenende

    scene.style.height = maxH + (minH - maxH) * shrink + "px";
    sky.style.opacity = 1 - shrink;
    sun.style.transform = "translate(" + shrink * 30 + "px," + shrink * 120 + "px)";
    clouds.style.transform = "translateX(" + (-shrink * 160 - p * 200) + "px)";
    birds.style.transform = "translate(" + shrink * 260 + "px," + -shrink * 30 + "px)";
    back.style.transform = "translate(" + -p * 90 + "px," + shrink * 70 + "px)";
    mid.style.transform = "translateX(" + -p * 180 + "px)";
    hills.forEach(function (h) {
      h.el.setAttribute("fill", "rgb(" + h.day.map(function (c, i) { return Math.round(c + (h.night[i] - c) * dusk); }) + ")");
    });
    stars.style.opacity = dusk;
    glow.style.opacity = dusk;
  }

  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener("resize", resize);
  resize();
})();
