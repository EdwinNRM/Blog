(function () {
  "use strict";

  var currentTrack = 0;
  var audio = null;
  var isPlaying = false;
  var tracks = [];

  function init() {
    var el = document.getElementById("player-tracks");
    if (!el) return;

    var container = document.getElementById("music-player");
    if (!container) return;
    window._PLAYER_BASEURL = container.dataset.baseurl || "/";

    try {
      tracks = JSON.parse(el.textContent || "[]");
    } catch (e) {
      return;
    }
    if (tracks.length === 0) return;

    audio = new Audio();
    audio.volume = 0.7;
    audio.addEventListener("ended", nextTrack);
    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", updateDuration);

    renderPlayer();
    loadTrack(0);
  }

  function renderPlayer() {
    var container = document.getElementById("music-player");
    if (!container) return;

    container.innerHTML =
      '<div class="cd-player">' +
        '<div class="cd-player__titlebar">' +
          '<span class="cd-player__titlebar-icon">\u266B</span>' +
          '<span class="cd-player__titlebar-text">CD Player</span>' +
        '</div>' +
        '<div class="cd-player__body">' +
          '<div class="cd-player__top-row">' +
            '<div class="cd-player__cover-wrap">' +
              '<img id="player-cover" class="cd-player__cover" alt="cover">' +
            '</div>' +
            '<div class="cd-player__info">' +
              '<div id="player-title" class="cd-player__track-title"></div>' +
              '<div id="player-artist" class="cd-player__track-artist"></div>' +
              '<div id="player-album" class="cd-player__track-extra"></div>' +
              '<div id="player-genre" class="cd-player__track-extra"></div>' +
            '</div>' +
          '</div>' +
          '<div class="cd-player__progress">' +
            '<div class="cd-player__bar" id="player-progress-bar">' +
              '<div id="player-progress-fill" class="cd-player__fill"></div>' +
              '<div id="player-handle" class="cd-player__handle"></div>' +
            '</div>' +
          '</div>' +
          '<div class="cd-player__time-row">' +
            '<span id="player-current" class="cd-player__time">0:00</span>' +
            '<span id="player-total" class="cd-player__time">0:00</span>' +
          '</div>' +
          '<div class="cd-player__controls">' +
            '<div class="cd-player__buttons">' +
              '<button id="player-prev" class="cd-player__btn" title="Previous">\u23EE</button>' +
              '<button id="player-toggle" class="cd-player__btn cd-player__btn--play" title="Play/Pause">' +
                '<span class="cd-player__play-icon">\u25B6</span>' +
                '<span class="cd-player__pause-icon" style="display:none">\u275A\u275A</span>' +
              '</button>' +
              '<button id="player-next" class="cd-player__btn" title="Next">\u23ED</button>' +
            '</div>' +
            '<div class="cd-player__volume">' +
              '<span class="cd-player__vol-icon">\u266B</span>' +
              '<input type="range" id="player-volume" class="cd-player__vol-slider" min="0" max="100" value="70">' +
            '</div>' +
            '<div class="cd-player__menu">' +
              '<button id="player-menu-btn" class="cd-player__menu-btn" title="More">\u22EE</button>' +
              '<div id="player-menu-dropdown" class="cd-player__menu-dropdown" style="display:none">' +
                '<a id="player-download" class="cd-player__menu-item" download>Download MP3</a>' +
                '<a id="player-copy-link" class="cd-player__menu-item" href="#">Copy Link</a>' +
                '<a id="player-youtube" class="cd-player__menu-item" href="#" target="_blank">Open in YouTube</a>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div id="player-status" class="cd-player__status">\u25B6 Stopped</div>' +
        '</div>' +
      '</div>';

    document.getElementById("player-prev").addEventListener("click", prevTrack);
    document.getElementById("player-toggle").addEventListener("click", togglePlay);
    document.getElementById("player-next").addEventListener("click", nextTrack);

    document.getElementById("player-volume").addEventListener("input", function () {
      audio.volume = this.value / 100;
    });

    var bar = document.getElementById("player-progress-bar");
    if (bar) {
      bar.addEventListener("click", function (e) {
        var rect = this.getBoundingClientRect();
        var pct = (e.clientX - rect.left) / rect.width;
        if (audio.duration) audio.currentTime = pct * audio.duration;
      });
    }

    var menuBtn = document.getElementById("player-menu-btn");
    var menuDropdown = document.getElementById("player-menu-dropdown");
    if (menuBtn && menuDropdown) {
      menuBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        var isOpen = menuDropdown.style.display !== "none";
        menuDropdown.style.display = isOpen ? "none" : "block";
      });
      document.addEventListener("click", function () {
        menuDropdown.style.display = "none";
      });
      menuDropdown.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    }

    var copyLink = document.getElementById("player-copy-link");
    if (copyLink) {
      copyLink.addEventListener("click", function (e) {
        e.preventDefault();
        var downloadLink = document.getElementById("player-download");
        if (downloadLink && downloadLink.href) {
          navigator.clipboard.writeText(downloadLink.href).then(function () {
            var status = document.getElementById("player-status");
            if (status) status.textContent = "\u2713 Link copied!";
          });
        }
        menuDropdown.style.display = "none";
      });
    }
  }

  function getCoverUrl(track) {
    if (track.cover) {
      return window._PLAYER_BASEURL + "assets/images/" + encodeURIComponent(track.cover);
    }
    return window._PLAYER_BASEURL + "assets/images/cover-default.svg";
  }

  function loadTrack(index) {
    if (index < 0 || index >= tracks.length) return;
    currentTrack = index;
    var t = tracks[currentTrack];
    var base = window._PLAYER_BASEURL;
    var src = base + "assets/audio/" + encodeURIComponent(t.file);

    audio.src = src;

    var titleEl = document.getElementById("player-title");
    titleEl.textContent = t.title;
    titleEl.title = t.title;

    var artistEl = document.getElementById("player-artist");
    artistEl.textContent = t.artist;
    artistEl.title = t.artist;

    var albumEl = document.getElementById("player-album");
    var genreEl = document.getElementById("player-genre");
    if (t.album) {
      albumEl.textContent = t.album;
      albumEl.title = t.album;
    } else {
      albumEl.textContent = "";
      albumEl.title = "";
    }
    if (t.genre) {
      genreEl.textContent = t.genre;
      genreEl.title = t.genre;
    } else {
      genreEl.textContent = "";
      genreEl.title = "";
    }

    document.getElementById("player-cover").src = getCoverUrl(t);
    document.getElementById("player-progress-fill").style.width = "0%";
    document.getElementById("player-handle").style.left = "0%";
    document.getElementById("player-current").textContent = "0:00";
    document.getElementById("player-total").textContent = "0:00";

    var downloadLink = document.getElementById("player-download");
    if (downloadLink) {
      downloadLink.href = src;
      downloadLink.download = t.file;
    }

    var youtubeLink = document.getElementById("player-youtube");
    if (youtubeLink) {
      if (t.youtube) {
        youtubeLink.href = t.youtube;
        youtubeLink.style.display = "block";
      } else {
        youtubeLink.style.display = "none";
      }
    }

    isPlaying = false;
    updatePlayBtn();
  }

  function togglePlay() {
    if (!audio.src) return;
    if (isPlaying) {
      audio.pause();
      isPlaying = false;
    } else {
      audio.play();
      isPlaying = true;
    }
    updatePlayBtn();
  }

  function nextTrack() {
    var next = (currentTrack + 1) % tracks.length;
    loadTrack(next);
    audio.play();
    isPlaying = true;
    updatePlayBtn();
  }

  function prevTrack() {
    var prev = (currentTrack - 1 + tracks.length) % tracks.length;
    loadTrack(prev);
    audio.play();
    isPlaying = true;
    updatePlayBtn();
  }

  function updatePlayBtn() {
    var playIcon = document.querySelector(".cd-player__play-icon");
    var pauseIcon = document.querySelector(".cd-player__pause-icon");
    var cover = document.getElementById("player-cover");
    var statusEl = document.getElementById("player-status");
    if (!playIcon || !pauseIcon) return;
    if (isPlaying) {
      playIcon.style.display = "none";
      pauseIcon.style.display = "inline";
      if (cover) cover.classList.add("cd-player__cover--spinning");
      if (statusEl) statusEl.innerHTML = "\u25B6 Playing";
    } else {
      playIcon.style.display = "inline";
      pauseIcon.style.display = "none";
      if (cover) cover.classList.remove("cd-player__cover--spinning");
      if (statusEl) statusEl.innerHTML = "\u25B6 Paused";
    }
  }

  function updateProgress() {
    if (!audio.duration || audio.paused) return;
    var fill = document.getElementById("player-progress-fill");
    var handle = document.getElementById("player-handle");
    var current = document.getElementById("player-current");
    var pct = (audio.currentTime / audio.duration) * 100;
    if (fill) fill.style.width = pct + "%";
    if (handle) handle.style.left = "calc(" + pct + "% - 3px)";
    if (current) current.textContent = formatTime(audio.currentTime);
  }

  function updateDuration() {
    var total = document.getElementById("player-total");
    if (total) total.textContent = formatTime(audio.duration);
  }

  function formatTime(s) {
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return m + ":" + (sec < 10 ? "0" : "") + sec;
  }

  document.addEventListener("DOMContentLoaded", init);
})();
