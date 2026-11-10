'use strict';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if ('IntersectionObserver' in window && !reducedMotion) {
  document.documentElement.classList.add('motion-ready');
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => { if(entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); } });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));
}
document.querySelectorAll('.project-toggle').forEach(button => {
  button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!expanded));
    document.getElementById(button.getAttribute('aria-controls')).hidden = expanded;
    button.textContent = expanded ? '+' : '−';
  });
});
document.getElementById('year').textContent = new Date().getFullYear();
document.getElementById('copy-email').addEventListener('click', async () => {
  const status = document.getElementById('copy-status');
  try { await navigator.clipboard.writeText('chandrua3003@gmail.com'); status.textContent = 'Email address copied. Let’s talk!'; }
  catch { status.textContent = 'Email: chandrua3003@gmail.com'; }
});
if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      document.querySelectorAll('.navigation nav a').forEach(link => link.classList.toggle('active', link.hash === '#' + entry.target.id));
    });
  }, {rootMargin:'-20% 0px -55% 0px'});
  document.querySelectorAll('main section[id]').forEach(section => sectionObserver.observe(section));
}
