---
layout: page
title: Blog
permalink: /blog/
---

<h3>Postagens</h3>

<div class="post-list">
  {% for post in site.posts %}
    {% include post-list.html %}
  {% endfor %}
</div>

{% if site.posts.size == 0 %}
  <div class="neon-card" style="text-align: center; padding: 24px;">
    <p style="color: #808080;">
      Sem postagens! Volta logo :p
    </p>
  </div>
{% endif %}
