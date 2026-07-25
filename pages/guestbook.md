---
layout: page
title: Guestbook
permalink: /guestbook/
---

<h3>Guestbook</h3>
<p>Sign my guestbook! Leave a message and let me know you were here.</p>

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
        <p class="guestbook-msg__text">{{ entry.message }}</p>
      </div>
    {% endfor %}

    {% if site.data.guestbook == empty %}
      <p style="font-size: 11px; color: #808080;">No messages yet. Be the first to sign!</p>
    {% endif %}
  </div>
</div>

<h3>Leave a message</h3>

<div class="guestbook-form">
  <div class="guestbook-form__field">
    <label for="gb-name">Name:</label>
    <input type="text" id="gb-name" placeholder="Your name" required>
  </div>
  <div class="guestbook-form__field">
    <label for="gb-message">Message:</label>
    <textarea id="gb-message" placeholder="Leave your message..." required></textarea>
  </div>
  <button id="gb-submit" class="guestbook-form__submit">Send</button>
  <p id="gb-status" style="font-size: 10px; color: #808080; margin-top: 4px;"></p>
</div>

<script>
(function() {
  var btn = document.getElementById('gb-submit');
  var status = document.getElementById('gb-status');

  btn.addEventListener('click', function() {
    var name = document.getElementById('gb-name').value.trim();
    var message = document.getElementById('gb-message').value.trim();

    if (!name || !message) {
      status.textContent = 'Please fill in all fields.';
      status.style.color = '#ff0000';
      return;
    }

    var title = '[Guestbook] ' + name;
    var body = '## Guestbook Entry\n\n**Name:** ' + name + '\n\n**Message:**\n\n' + message;
    var labels = 'guestbook';
    var repo = 'edwinnrm/edwinnrm.github.io';

    var url = 'https://github.com/' + repo + '/issues/new?title='
      + encodeURIComponent(title)
      + '&body=' + encodeURIComponent(body)
      + '&labels=' + encodeURIComponent(labels);

    window.open(url, '_blank');
    status.textContent = 'Opening GitHub... Submit the issue to sign the guestbook.';
    status.style.color = '#008000';
  });
})();
</script>
