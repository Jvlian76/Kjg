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
