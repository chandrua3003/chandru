// ---- Auto experience calculation ----
function monthsSince(startISO) {
  const s = new Date(startISO);
  const n = new Date();
  let m = (n.getFullYear() - s.getFullYear()) * 12 + (n.getMonth() - s.getMonth());
  if (n.getDate() < s.getDate()) m -= 1;
  return Math.max(0, m);
}
function expDecimal(startISO) {
  return (Math.round(monthsSince(startISO) / 12 * 10) / 10).toFixed(1);
}
function expLabel(startISO) {
  const m = monthsSince(startISO);
  const y = Math.floor(m / 12), mo = m % 12;
  const yp = y > 0 ? y + ' yr' + (y > 1 ? 's' : '') : '';
  const mp = mo > 0 ? mo + ' mo' + (mo > 1 ? 's' : '') : '';
  return [yp, mp].filter(Boolean).join(' ') || '0 mos';
}
// Fill any element that declares a start date
document.querySelectorAll('[data-exp-start]').forEach(el => {
  const start = el.getAttribute('data-exp-start');
  el.textContent = el.getAttribute('data-exp-format') === 'label'
    ? expLabel(start)
    : expDecimal(start) + '+';
});

// Navbar scroll state
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 30);
});

// Scroll reveal
const observer = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 70);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal, .exp-item').forEach(el => observer.observe(el));

// Hamburger menu
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
  document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
});

function closeMobileMenu() {
  hamburger.classList.remove('open');
  mobileMenu.classList.remove('open');
  document.body.style.overflow = '';
}

// Mobile menu smooth scroll
document.querySelectorAll('.mobile-menu a').forEach(link => {
  link.addEventListener('click', function (e) {
    if (this.getAttribute('href').startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      closeMobileMenu();
      setTimeout(() => {
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } else {
      closeMobileMenu();
    }
  });
});

// Animated counters in the hero
function animateCounter(el, target, suffix) {
  const decimals = target % 1 !== 0 ? 1 : 0;
  let start = 0;
  const step = target / 50;
  const timer = setInterval(() => {
    start += step;
    if (start >= target) { start = target; clearInterval(timer); }
    el.textContent = start.toFixed(decimals) + suffix;
  }, 18);
}

const statsObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      document.querySelectorAll('.stat-num').forEach(el => {
        const text = el.textContent.trim();
        const num = parseFloat(text);
        const suffix = text.replace(/[\d.]/g, '');
        if (!isNaN(num)) animateCounter(el, num, suffix);
      });
      statsObserver.disconnect();
    }
  });
}, { threshold: 0.5 });

const statsEl = document.querySelector('.hero-stats');
if (statsEl) statsObserver.observe(statsEl);

// ---- Material ripple effect ----
document.querySelectorAll('.btn-primary, .btn-secondary, .btn-ghost, .contact-link, .nav-resume')
  .forEach(el => {
    el.style.position = el.style.position || 'relative';
    el.addEventListener('click', function (e) {
      const circle = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      circle.className = 'ripple';
      circle.style.width = circle.style.height = size + 'px';
      circle.style.left = (e.clientX - rect.left - size / 2) + 'px';
      circle.style.top = (e.clientY - rect.top - size / 2) + 'px';
      this.appendChild(circle);
      setTimeout(() => circle.remove(), 600);
    });
  });
