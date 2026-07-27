(function () {
  "use strict";

  var baseUrl = (document.querySelector('meta[name="baseurl"]') || {}).content || "/";
  baseUrl = baseUrl.replace(/\/$/, "");

  var emoticons = window._EMOTICONS || [];

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function imgTag(em) {
    return '<img src="' + baseUrl + '/assets/images/emoticons/' + encodeURIComponent(em.file) + '" class="emoticon" alt="' + em.desc + '" title="' + em.desc + '">';
  }

  // Build flat pattern list sorted by length desc (longest first)
  var patternList = [];

  emoticons.forEach(function (em) {
    // Descriptive shortcode: :smile:
    var pid = em.id.toLowerCase().replace(/\s+/g, "-");
    patternList.push({ re: ":" + pid + ":", em: em });

    // Original MSN shortcuts from the YAML
    (em.shortcuts || []).forEach(function (s) {
      patternList.push({ re: s, em: em });
    });
  });

  patternList.sort(function (a, b) { return b.re.length - a.re.length; });

  // Build a single combined regex
  var escaped = patternList.map(function (p) { return escapeRegex(p.re); });
  var combinedRe = new RegExp(escaped.join("|"), "g");

  // Lookup: lowercase pattern -> emoticon
  var lookup = {};
  patternList.forEach(function (p) {
    lookup[p.re.toLowerCase()] = p.em;
  });

  function replaceInElement(el) {
    if (el.getAttribute("data-emoticons") === "done") return;
    el.setAttribute("data-emoticons", "done");

    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(function (node) {
      var text = node.textContent;
      if (!combinedRe.test(text)) return;
      combinedRe.lastIndex = 0;

      var html = text.replace(combinedRe, function (match) {
        var em = lookup[match.toLowerCase()];
        return em ? imgTag(em) : match;
      });

      var span = document.createElement("span");
      span.innerHTML = html;
      node.parentNode.replaceChild(span, node);
    });
  }

  function replaceAll() {
    document.querySelectorAll(".post-content, .guestbook-msg__text, .comment-msg__text, .chat-msg__text").forEach(replaceInElement);
  }

  // --- Picker ---

  function createPicker(btn) {
    var textareaId = btn.getAttribute("data-target");
    var textarea = document.getElementById(textareaId);
    if (!textarea) return;

    var picker = document.createElement("div");
    picker.className = "emoticon-picker";
    picker.style.display = "none";
    picker.innerHTML =
      '<div class="y2k-window" style="width:320px">' +
        '<div class="y2k-window__titlebar">' +
          '<span>Emoticons</span>' +
          '<div class="y2k-window__buttons"><span>_</span><span>□</span><span>×</span></div>' +
        "</div>" +
        '<div class="y2k-window__body emoticon-picker__grid">' +
          emoticons.map(function (em) {
            return '<img src="' + baseUrl + '/assets/images/emoticons/' + encodeURIComponent(em.file) + '" class="emoticon-picker__item" data-id="' + em.id + '" alt="' + em.desc + '" title="' + em.desc + '">';
          }).join("") +
        "</div>" +
      "</div>";

    document.body.appendChild(picker);

    function position() {
      var r = btn.getBoundingClientRect();
      picker.style.left = Math.min(r.left, window.innerWidth - 340) + "px";
      picker.style.top = (r.bottom + window.scrollY + 4) + "px";
    }

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (picker.style.display === "none") {
        position();
        picker.style.display = "block";
      } else {
        picker.style.display = "none";
      }
    });

    picker.addEventListener("click", function (e) {
      var img = e.target.closest(".emoticon-picker__item");
      if (!img) return;
      var id = img.getAttribute("data-id");
      var shortcut = ":" + id.toLowerCase().replace(/\s+/g, "-") + ":";

      var start = textarea.selectionStart;
      var end = textarea.selectionEnd;
      textarea.value = textarea.value.substring(0, start) + shortcut + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + shortcut.length;
      textarea.focus();
      picker.style.display = "none";
    });

    document.addEventListener("click", function (e) {
      if (!picker.contains(e.target) && e.target !== btn) {
        picker.style.display = "none";
      }
    });

    window.addEventListener("scroll", function () {
      if (picker.style.display !== "none") position();
    });
  }

  function initPickers() {
    document.querySelectorAll(".emoticon-picker-btn").forEach(function (btn) {
      if (btn.getAttribute("data-picker-inited")) return;
      createPicker(btn);
      btn.setAttribute("data-picker-inited", "true");
    });
  }

  // --- Init ---

  document.addEventListener("DOMContentLoaded", function () {
    replaceAll();
    initPickers();
  });

  window._emoticonsPJAX = function () {
    replaceAll();
    initPickers();
  };
})();
