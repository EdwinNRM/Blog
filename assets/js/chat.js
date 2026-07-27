(function () {
  "use strict";

  var SUPABASE_URL = "https://rbsbaqqbuocccoyzqgfm.supabase.co";
  var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJic2JhcXFidW9jY2NveXpxZ2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDcxMzEsImV4cCI6MjEwMDY4MzEzMX0.zmTRwf5eqrODnYAleRX6ZDw850HjTEnwEG4w1rhWXwk";
  var ROOMS = ["Lobby", "Retro", "Games", "Linux", "M\u00fasica"];

  var state = {
    nick: "",
    color: "",
    room: "Lobby",
    lastPoll: null,
    pollTimer: null,
    usersPollTimer: null,
    heartbeatTimer: null,
  };

  var dom = {};

  function byId(id) { return document.getElementById(id); }

  function cacheDom() {
    dom.loginOverlay = byId("chat-login");
    dom.nickInput = byId("chat-nick");
    dom.colorPicker = byId("chat-color-picker");
    dom.loginError = byId("chat-login-error");
    dom.loginBtn = byId("chat-login-btn");
    dom.mainArea = byId("chat-main");
    dom.roomTitle = byId("chat-current-room");
    dom.onlineCount = byId("chat-online-count");
    dom.nickDisplay = byId("chat-current-nick");
    dom.roomList = byId("chat-room-list");
    dom.userList = byId("chat-user-list");
    dom.messages = byId("chat-messages");
    dom.input = byId("chat-input");
    dom.sendBtn = byId("chat-send-btn");
    dom.windowTitle = byId("chat-window-title");
  }

  // ========== SUPABASE REST ==========

  function rest(method, path, body) {
    var url = SUPABASE_URL + "/rest/v1/" + path;
    var headers = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: "Bearer " + SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    var opts = { method: method, headers: headers };
    if (body) {
      if (method === "POST") headers["Prefer"] = "return=minimal";
      opts.body = JSON.stringify(body);
    }

    return fetch(url, opts).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      var ct = r.headers.get("Content-Type") || "";
      if (ct.indexOf("json") !== -1) return r.json();
      return r.text();
    });
  }

  function getMessages(room, since) {
    var params = "room=eq." + encodeURIComponent(room) +
      "&order=created_at.asc&limit=500";
    if (since) {
      params += "&created_at=gt." + encodeURIComponent(since);
    }
    return rest("GET", "chat_messages?" + params);
  }

  function sendMessage(room, nick, text, color, type) {
    return rest("POST", "chat_messages", {
      room: room, nick: nick, text: text, color: color, type: type || "message",
    });
  }

  function getUsers(room) {
    var params = "room=eq." + encodeURIComponent(room);
    return rest("GET", "chat_users?" + params);
  }

  function upsertUser(nick, color, room) {
    return fetch(SUPABASE_URL + "/rest/v1/chat_users", {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: "Bearer " + SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        nick: nick, color: color, room: room,
        last_seen: new Date().toISOString(),
      }),
    });
  }

  function deleteUser(nick, room) {
    var params = "nick=eq." + encodeURIComponent(nick) +
      "&room=eq." + encodeURIComponent(room);
    return fetch(SUPABASE_URL + "/rest/v1/chat_users?" + params, {
      method: "DELETE",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: "Bearer " + SUPABASE_ANON_KEY,
      },
    });
  }

  // ========== RENDER ==========

  function scrollToBottom() {
    dom.messages.scrollTop = dom.messages.scrollHeight;
  }

  var knownIds = {};

  function appendMessage(row) {
    if (knownIds[row.id]) return;
    knownIds[row.id] = true;

    var div = document.createElement("div");
    var isSystem = row.type && row.type !== "message";

    if (isSystem) {
      div.className = "chat-msg chat-msg--system";
      div.textContent = "*** " + row.text;
      dom.messages.appendChild(div);
      scrollToBottom();
      return;
    }

    div.className = "chat-msg";

    var time = document.createElement("span");
    time.className = "chat-msg__time";
    var d = new Date(row.created_at);
    time.textContent =
      String(d.getHours()).padStart(2, "0") + ":" +
      String(d.getMinutes()).padStart(2, "0");

    var nick = document.createElement("span");
    nick.className = "chat-msg__nick";
    nick.textContent = row.nick;
    nick.style.color = row.color || "#000";

    var txt = document.createElement("span");
    txt.className = "chat-msg__text";
    txt.textContent = row.text;

    div.appendChild(time);
    div.appendChild(nick);
    div.appendChild(txt);

    dom.messages.appendChild(div);

    var sep = document.createElement("hr");
    sep.className = "chat-msg-sep";
    dom.messages.appendChild(sep);

    scrollToBottom();
  }

  function renderMessages(rows) {
    dom.messages.innerHTML = "";
    knownIds = {};
    rows.forEach(function (row) {
      appendMessage(row);
    });
  }

  function renderRoomList() {
    dom.roomList.innerHTML = "";
    ROOMS.forEach(function (r) {
      var item = document.createElement("div");
      item.className = "chat-room-item" + (r === state.room ? " active" : "");
      item.textContent = r;
      item.addEventListener("click", function () { switchRoom(r); });
      dom.roomList.appendChild(item);
    });
  }

  function renderUserList(users) {
    dom.userList.innerHTML = "";
    dom.onlineCount.textContent = users.length;

    users.sort(function (a, b) {
      return a.nick.toLowerCase().localeCompare(b.nick.toLowerCase());
    });

    users.forEach(function (u) {
      var item = document.createElement("div");
      item.className = "chat-user-item";

      var dot = document.createElement("span");
      dot.textContent = "\uD83D\uDE0A";
      dot.style.fontSize = "14px";

      var name = document.createElement("span");
      name.textContent = u.nick;
      name.style.color = u.color || "#000";

      item.appendChild(dot);
      item.appendChild(name);
      dom.userList.appendChild(item);
    });
  }

  // ========== POLLING ==========

  function pollMessages() {
    getMessages(state.room, state.lastPoll).then(function (data) {
      if (!data || data.length === 0) return;
      state.lastPoll = data[data.length - 1].created_at;
      data.forEach(function (row) {
        appendMessage(row);
      });
      setTimeout(function () {
        if (window._emoticonsPJAX) window._emoticonsPJAX();
      }, 50);
    }).catch(function () {});
  }

  function pollUsers() {
    getUsers(state.room).then(function (data) {
      renderUserList(data || []);
    }).catch(function () {});
  }

  function startPolling() {
    if (state.pollTimer) clearInterval(state.pollTimer);
    if (state.usersPollTimer) clearInterval(state.usersPollTimer);

    pollUsers();
    state.usersPollTimer = setInterval(pollUsers, 10000);

    state.lastPoll = null;
    state.pollTimer = setInterval(pollMessages, 3000);
  }

  function stopPolling() {
    if (state.pollTimer) {
      clearInterval(state.pollTimer);
      state.pollTimer = null;
    }
    if (state.usersPollTimer) {
      clearInterval(state.usersPollTimer);
      state.usersPollTimer = null;
    }
  }

  // ========== ROOM SWITCHING ==========

  function switchRoom(room) {
    if (room === state.room) return;
    knownIds = {};
    state.room = room;
    state.lastPoll = null;

    dom.roomTitle.textContent = room;
    dom.windowTitle.textContent = room.toLowerCase() + ".txt";
    renderRoomList();

    dom.messages.innerHTML = "";

    getMessages(room).then(function (data) {
      renderMessages(data || []);
      if (data && data.length > 0) {
        state.lastPoll = data[data.length - 1].created_at;
      }
      setTimeout(function () {
        if (window._emoticonsPJAX) window._emoticonsPJAX();
      }, 200);
    }).catch(function () {});

    upsertUser(state.nick, state.color, room).catch(function () {});
  }

  // ========== SENDING ==========

  function handleSend() {
    var text = dom.input.value.trim();
    if (!text) return;
    if (text.length > 500) text = text.slice(0, 500);

    dom.input.value = "";
    dom.input.focus();

    sendMessage(state.room, state.nick, text, state.color, "message")
      .catch(function (err) {
        console.error("Send error:", err);
      });
  }

  // ========== HEARTBEAT ==========

  function startHeartbeat() {
    if (state.heartbeatTimer) clearInterval(state.heartbeatTimer);

    function beat() {
      upsertUser(state.nick, state.color, state.room).catch(function () {});
    }

    beat();
    state.heartbeatTimer = setInterval(beat, 30000);
  }

  function stopHeartbeat() {
    if (state.heartbeatTimer) {
      clearInterval(state.heartbeatTimer);
      state.heartbeatTimer = null;
    }
  }

  // ========== LOGIN ==========

  function doLogin() {
    var nick = dom.nickInput.value.trim();
    if (!nick) {
      dom.loginError.textContent = "Digite um nick.";
      return;
    }
    if (nick.length > 20) nick = nick.slice(0, 20);

    var selected = dom.colorPicker.querySelector(".selected");
    if (!selected) {
      dom.loginError.textContent = "Escolha uma cor.";
      return;
    }

    state.nick = nick;
    state.color = selected.getAttribute("data-color");

    localStorage.setItem("chat_nick", nick);
    localStorage.setItem("chat_color", state.color);

    dom.loginOverlay.style.display = "none";
    dom.mainArea.style.display = "block";
    dom.nickDisplay.textContent = nick;
    dom.nickDisplay.style.color = state.color;

    startApp();
  }

  function checkSavedLogin() {
    var nick = localStorage.getItem("chat_nick");
    var color = localStorage.getItem("chat_color");
    if (nick && color) {
      state.nick = nick;
      state.color = color;
      dom.nickInput.value = nick;
      var dots = dom.colorPicker.querySelectorAll(".chat-color-dot");
      dots.forEach(function (d) {
        if (d.getAttribute("data-color") === color) d.classList.add("selected");
      });
      dom.loginOverlay.style.display = "none";
      dom.mainArea.style.display = "block";
      dom.nickDisplay.textContent = nick;
      dom.nickDisplay.style.color = color;
      startApp();
    }
  }

  // ========== APP INIT ==========

  function startApp() {
    renderRoomList();
    dom.windowTitle.textContent = state.room.toLowerCase() + ".txt";

    getMessages(state.room).then(function (data) {
      renderMessages(data || []);
      if (data && data.length > 0) {
        state.lastPoll = data[data.length - 1].created_at;
      }
      setTimeout(function () {
        if (window._emoticonsPJAX) window._emoticonsPJAX();
      }, 200);
    }).catch(function () {});

    upsertUser(state.nick, state.color, state.room).catch(function () {});
    startPolling();
    startHeartbeat();
  }

  function cleanup() {
    stopPolling();
    stopHeartbeat();
    deleteUser(state.nick, state.room).catch(function () {});
  }

  // ========== BIND EVENTS ==========

  function bindEvents() {
    dom.loginBtn.addEventListener("click", doLogin);

    dom.nickInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") doLogin();
    });

    dom.colorPicker.addEventListener("click", function (e) {
      var dot = e.target.closest(".chat-color-dot");
      if (!dot) return;
      dom.colorPicker.querySelectorAll(".chat-color-dot").forEach(function (d) {
        d.classList.remove("selected");
      });
      dot.classList.add("selected");
    });

    dom.sendBtn.addEventListener("click", handleSend);

    dom.input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    window.addEventListener("beforeunload", function () {
      cleanup();
    });
  }

  // ========== BOOT ==========

  function init() {
    cacheDom();
    if (!dom.loginOverlay) return;
    bindEvents();
    checkSavedLogin();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
