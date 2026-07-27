---
layout: page
title: Guestbook
permalink: /guestbook/
---

<p>Escreve alguma coisa bacana e deixa sua marca por aqui!</p>

<div class="y2k-window" style="margin: 12px 0;">
  <div class="y2k-window__titlebar">
    <span>guestbook.txt</span>
    <div class="y2k-window__buttons">
      <span>_</span><span>□</span><span>×</span>
    </div>
  </div>
  <div class="y2k-window__body">
    {% for entry in site.data.guestbook reversed %}
      <div class="guestbook-msg">
        <span class="guestbook-msg__name">{{ entry.name }}</span>
        <span class="guestbook-msg__date"> ({{ entry.date }})</span>
        <p class="guestbook-msg__text">{{ entry.message | newline_to_br }}</p>
      </div>
    {% endfor %}

    {% if site.data.guestbook == empty %}
      <p style="font-size: 11px; color: #808080;">No messages yet. Be the first to sign!</p>
    {% endif %}
  </div>
</div>

<h3>Deixa sua mensagem</h3>

<div class="guestbook-form">
  <div class="guestbook-form__field">
    <label for="gb-name">Name:</label>
    <input type="text" id="gb-name" placeholder="Your name" required>
  </div>
  <div class="guestbook-form__field">
    <label for="gb-message">Message:</label>
    <div style="display:flex; gap:4px; align-items:flex-start;">
      <textarea id="gb-message" placeholder="Leave your message..." required style="flex:1;"></textarea>
      <button class="emoticon-picker-btn" data-target="gb-message" type="button" title="Inserir emoticon">😊</button>
    </div>
  </div>
  <button id="gb-submit" class="guestbook-form__submit">Send</button>
  <p id="gb-status" style="font-size: 10px; color: #808080; margin-top: 4px;"></p>
</div>

<script>
(function() {
  var btn = document.getElementById('gb-submit');
  var status = document.getElementById('gb-status');
  var WORKER_URL = 'https://guestbook-worker.edwinnrm.workers.dev/';


  btn.addEventListener('click', async function() {
    var name = document.getElementById('gb-name').value.trim();
    var message = document.getElementById('gb-message').value.trim();

    if (!name || !message) {
      status.textContent = 'Preencha todos os campos.';
      status.style.color = '#ff0000';
      return;
    }

    btn.disabled = true;
    status.textContent = 'Enviando...';
    status.style.color = '#808080';

    try {
      var res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, message: message, type: 'guestbook' })
      });
      var data = await res.json();

      if (data.success) {
        status.textContent = 'Mensagem enviada para aprovação!';
        status.style.color = '#008000';
        document.getElementById('gb-name').value = '';
        document.getElementById('gb-message').value = '';
      } else {
        status.textContent = 'Erro: ' + (data.error || 'tente novamente.');
        status.style.color = '#ff0000';
      }
    } catch (e) {
      status.textContent = 'Erro de conexão. Tente novamente.';
      status.style.color = '#ff0000';
    }

    btn.disabled = false;
  });
})();
</script>
