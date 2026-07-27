(function () {
  "use strict";

  var baseUrl = (document.querySelector('meta[name="baseurl"]') || {}).content || "/Blog";
  baseUrl = baseUrl.replace(/\/$/, ""); // remove trailing slash

  // --- Mobile menu toggle ---
  window.toggleMenu = function () {
    var nav = document.getElementById("main-nav");
    if (nav) nav.classList.toggle("is-open");
  };

  document.addEventListener("click", function (e) {
    var nav = document.getElementById("main-nav");
    var toggle = document.querySelector(".menu-toggle");
    if (nav && toggle && !nav.contains(e.target) && !toggle.contains(e.target)) {
      nav.classList.remove("is-open");
    }
  });

  // --- Fade-in on load ---
  function applyFadeIn() {
    document.querySelectorAll(".fade-in").forEach(function (el, i) {
      el.style.animationDelay = i * 0.1 + "s";
    });
  }
  document.addEventListener("DOMContentLoaded", applyFadeIn);

  // --- PJAX: keeps audio player alive across page nav ---

  function isInternal(href) {
    if (!href) return false;
    if (href.startsWith("#") || href.startsWith("javascript:")) return false;
    var a = document.createElement("a");
    a.href = href;
    return a.hostname === location.hostname;
  }

  function reexecScripts(container) {
    container.querySelectorAll("script").forEach(function (old) {
      var s = document.createElement("script");
      Array.from(old.attributes).forEach(function (a) {
        s.setAttribute(a.name, a.value);
      });
      s.textContent = old.textContent;
      old.parentNode.replaceChild(s, old);
    });
  }

  function updateActiveLink(pathname) {
    document.querySelectorAll(".sidebar-nav a").forEach(function (a) {
      a.classList.toggle("active", a.pathname === pathname);
    });
  }

  function loadPage(url) {
    return fetch(url, { headers: { "X-PJAX": "true" } })
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, "text/html");

        var newMain = doc.querySelector(".main");
        var curMain = document.querySelector(".main");
        if (newMain && curMain) {
          curMain.innerHTML = newMain.innerHTML;
          reexecScripts(curMain);
        }

        var t = doc.querySelector("title");
        if (t) document.title = t.textContent;

        updateActiveLink(url.pathname);
        applyFadeIn();
        if (window._emoticonsPJAX) window._emoticonsPJAX();
      });
  }

  document.addEventListener("click", function (e) {
    var link = e.target.closest("a");
    if (!link) return;

    var href = link.getAttribute("href");
    if (!isInternal(href)) return;
    if (link.hasAttribute("download") || link.target === "_blank") return;

    var url = new URL(href, location.origin);
    if (url.pathname === location.pathname) return;

    e.preventDefault();
    loadPage(url).then(function () {
      history.pushState({ url: url.href }, "", url.href);
      window.scrollTo(0, 0);
    });
  });

  window.addEventListener("popstate", function (e) {
    if (e.state && e.state.url) {
      loadPage(new URL(e.state.url));
    }
  });
})();
