(() => {
  'use strict';

  const root = document.documentElement;
  root.classList.add('js');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.getElementById('year').textContent = new Date().getFullYear();

  // Start reveal/count animations once the loader has gone
  const startAnimations = () => {
    // Scroll reveal
    const revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && !reduced) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach((el) => io.observe(el));
    } else {
      revealEls.forEach((el) => el.classList.add('in'));
    }

    // Count-up for numeric stats
    const counters = document.querySelectorAll('[data-count]');
    const runCount = (el) => {
      const target = +el.dataset.count;
      const suffix = el.dataset.suffix || '';
      if (reduced) return;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / 1200, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if ('IntersectionObserver' in window) {
      const co = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { runCount(e.target); co.unobserve(e.target); }
        });
      }, { threshold: 0.6 });
      counters.forEach((c) => co.observe(c));
    }
  };

  // Android loader: simulated boot progress, finishes when the page has loaded
  const loader = document.getElementById('loader');
  const pct = document.getElementById('loaderPct');
  const fill = document.getElementById('loaderFill');
  const logEl = document.getElementById('loaderLog');
  const logs = [
    'I/ActivityThread: Launching portfolio…',
    'D/Gradle: Resolving dependencies',
    'I/Compose: Composing UI tree',
    'D/Room: Loading projects',
    'I/Retrofit: Fetching assets',
    'I/Portfolio: Ready — BUILD SUCCESSFUL'
  ];
  let progress = 0;
  let done = false;
  const shownAt = performance.now();
  const MIN_MS = reduced ? 0 : 1800;
  const setProgress = (v) => {
    progress = Math.min(100, v);
    pct.textContent = Math.floor(progress);
    fill.style.transform = `scaleX(${progress / 100})`;
    logEl.textContent = logs[Math.min(logs.length - 1, Math.floor(progress / (100 / logs.length)))];
  };
  const finish = () => {
    if (done) return;
    done = true;
    setProgress(100);
    setTimeout(() => {
      loader.classList.add('is-done');
      root.classList.remove('is-loading');
      setTimeout(() => loader.remove(), 700);
      startAnimations();
    }, 450);
  };
  const step = () => {
    if (done) return;
    // ease toward 90% while loading; jump on load
    setProgress(progress + (90 - progress) * 0.045);
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  const onLoaded = () => setTimeout(finish, Math.max(0, MIN_MS - (performance.now() - shownAt)));
  if (document.readyState === 'complete') onLoaded(); else window.addEventListener('load', onLoaded);
  setTimeout(finish, 8000); // safety net


  // Scroll progress + active nav link (one rAF-throttled handler)
  const bar = document.querySelector('.scroll-progress');
  const links = [...document.querySelectorAll('.nav-link')];
  const sections = links
    .map((l) => document.querySelector(l.getAttribute('href')))
    .filter(Boolean);
  let ticking = false;

  const onScroll = () => {
    const max = root.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    const y = window.scrollY + window.innerHeight * 0.35;
    let current = null;
    sections.forEach((s) => { if (s.offsetTop <= y) current = s.id; });
    links.forEach((l) => {
      const on = l.getAttribute('href') === `#${current}`;
      l.classList.toggle('active', on);
      if (on) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
    });
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  // Close mobile menu after choosing a link
  const menu = document.getElementById('navMenu');
  links.forEach((l) => l.addEventListener('click', () => {
    if (menu.classList.contains('show') && window.bootstrap) {
      window.bootstrap.Collapse.getOrCreateInstance(menu).hide();
    }
  }));

  // Contact form -> opens the visitor's mail client (no backend)
  const form = document.getElementById('contactForm');
  const note = document.getElementById('formNote');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const { name: nameEl, email: emailEl, message: messageEl } = form.elements;
    const name = nameEl.value.trim();
    const email = emailEl.value.trim();
    const message = messageEl.value.trim();
    const valid = name && /^\S+@\S+\.\S+$/.test(email) && message;
    [nameEl, emailEl, messageEl].forEach((f) => f.classList.toggle('is-invalid', !f.value.trim()));
    if (!valid) {
      note.textContent = 'Please fill in all fields with a valid email.';
      return;
    }
    const subject = encodeURIComponent(`Portfolio enquiry from ${name}`);
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
    window.location.href = `mailto:chandrua3003@gmail.com?subject=${subject}&body=${body}`;
    note.textContent = 'Opening your email app…';
  });
})();
