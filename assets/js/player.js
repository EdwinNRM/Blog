/* ============================================
   Y2K Music Player
   ============================================ */

(function () {
  "use strict";

  let currentTrack = 0;
  let audio = null;
  let isPlaying = false;
  let tracks = [];

  function init() {
    const el = document.getElementById("player-tracks");
    if (!el) return;

    tracks = JSON.parse(el.dataset.tracks || "[]");
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
    const container = document.getElementById("music-player");
    if (!container) return;

    container.innerHTML = '\
      <div class="player-controls">\
        <button id="player-prev" class="player-btn" title="Previous">&laquo;</button>\
        <button id="player-toggle" class="player-btn player-btn--play" title="Play/Pause">&#9654;</button>\
        <button id="player-next" class="player-btn" title="Next">&raquo;</button>\
      </div>\
      <div class="player-info">\
        <div id="player-title" class="player-title"></div>\
        <div id="player-artist" class="player-artist"></div>\
        <div class="player-progress">\
          <div class="player-progress__bar">\
            <div id="player-progress-fill" class="player-progress__fill"></div>\
          </div>\
          <div class="player-time">\
            <span id="player-current">0:00</span>\
            <span id="player-total">0:00</span>\
          </div>\
        </div>\
        <div class="player-volume">\
          <span class="player-vol-icon">&#9835;</span>\
          <input type="range" id="player-volume" min="0" max="100" value="70" class="player-vol-slider">\
        </div>\
      </div>';

    document.getElementById("player-prev").addEventListener("click", prevTrack);
    document.getElementById("player-toggle").addEventListener("click", togglePlay);
    document.getElementById("player-next").addEventListener("click", nextTrack);
    document.getElementById("player-volume").addEventListener("input", function () {
      audio.volume = this.value / 100;
    });

    var progressBar = document.querySelector(".player-progress__bar");
    if (progressBar) {
      progressBar.addEventListener("click", function (e) {
        var rect = this.getBoundingClientRect();
        var pct = (e.clientX - rect.left) / rect.width;
        if (audio.duration) audio.currentTime = pct * audio.duration;
      });
    }
  }

  function loadTrack(index) {
    if (index < 0 || index >= tracks.length) return;
    currentTrack = index;
    var t = tracks[currentTrack];
    audio.src = "/assets/audio/" + t.file;
    document.getElementById("player-title").textContent = t.title;
    document.getElementById("player-artist").textContent = t.artist + " - " + t.album + " (" + t.year + ")";
    document.getElementById("player-progress-fill").style.width = "0%";
    document.getElementById("player-current").textContent = "0:00";
    document.getElementById("player-total").textContent = "0:00";
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
    var btn = document.getElementById("player-toggle");
    if (btn) btn.innerHTML = isPlaying ? "&#9646;&#9646;" : "&#9654;";
  }

  function updateProgress() {
    if (!audio.duration) return;
    var pct = (audio.currentTime / audio.duration) * 100;
    document.getElementById("player-progress-fill").style.width = pct + "%";
    document.getElementById("player-current").textContent = formatTime(audio.currentTime);
  }

  function updateDuration() {
    if (!audio.duration) return;
    document.getElementById("player-total").textContent = formatTime(audio.duration);
  }

  function formatTime(s) {
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return m + ":" + (sec < 10 ? "0" : "") + sec;
  }

  document.addEventListener("DOMContentLoaded", init);
})();
