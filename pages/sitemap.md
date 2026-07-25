---
layout: page
title: Sitemap
permalink: /sitemap/
---

<div class="y2k-window">
  <div class="y2k-window__titlebar">
    <span>sitemap.exe</span>
    <div class="y2k-window__buttons">
      <span>_</span><span>□</span><span>×</span>
    </div>
  </div>
  <div class="y2k-window__body" style="font-family: 'VT323', monospace; font-size: 14px;">
<pre style="background: none; border: none; padding: 0; margin: 0;">Website
│
├── <a href="{{ '/' | relative_url }}">Home</a>
├── <a href="{{ '/blog/' | relative_url }}">Blog</a>{% for post in site.posts %}
│   └── <a href="{{ post.url | relative_url }}">{{ post.title }}</a>{% endfor %}
├── <a href="{{ '/gallery/' | relative_url }}">Galeria</a>
├── <a href="{{ '/guestbook/' | relative_url }}">Guestbook</a>
├── <a href="{{ '/links/' | relative_url }}">Links</a>
├── <a href="{{ '/sitemap/' | relative_url }}">Sitemap</a>
└── <a href="{{ '/404.html' | relative_url }}">404 Not Found</a></pre>
  </div>
</div>
