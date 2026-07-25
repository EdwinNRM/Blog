---
layout: page
title: Blog
permalink: /blog/
---

<h3>Blog Posts</h3>

<div class="post-list">
  {% for post in paginator.posts %}
    {% include post-list.html %}
  {% endfor %}
</div>

{% if paginator.total_pages > 1 %}
  <div class="pagination">
    {% if paginator.previous_page %}
      <a href="{{ paginator.previous_page_path | relative_url }}">&laquo; Anterior</a>
    {% endif %}

    {% for page in (1..paginator.total_pages) %}
      {% if page == paginator.page %}
        <span class="current">{{ page }}</span>
      {% elsif page == 1 %}
        <a href="{{ '/' | relative_url }}">{{ page }}</a>
      {% else %}
        <a href="{{ site.paginate_path | replace: ':num', page | relative_url }}">{{ page }}</a>
      {% endif %}
    {% endfor %}

    {% if paginator.next_page %}
      <a href="{{ paginator.next_page_path | relative_url }}">Proximo &raquo;</a>
    {% endif %}
  </div>
{% endif %}

{% if site.posts.size == 0 %}
  <div class="neon-card" style="text-align: center; padding: 24px;">
    <p style="color: #808080;">
      No posts yet. Come back soon!
    </p>
  </div>
{% endif %}
