// Y2K Blog - Main JavaScript

function toggleMenu() {
  const nav = document.getElementById('main-nav');
  nav.classList.toggle('is-open');
}

document.addEventListener('click', function(e) {
  const nav = document.getElementById('main-nav');
  const toggle = document.querySelector('.menu-toggle');
  if (nav && toggle && !nav.contains(e.target) && !toggle.contains(e.target)) {
    nav.classList.remove('is-open');
  }
});

document.addEventListener('DOMContentLoaded', function() {
  const elements = document.querySelectorAll('.fade-in');
  elements.forEach(function(el, i) {
    el.style.animationDelay = (i * 0.1) + 's';
  });
});
