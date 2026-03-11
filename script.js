/* ============================================================
   script.js — Bryan Ferreira Portfolio
   ============================================================ */

/* ── 1. Ano atual no footer ── */
document.getElementById('year').textContent = new Date().getFullYear();

/* ── 2. Navbar: adiciona classe "scrolled" ao rolar ── */
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  if (window.scrollY > 40) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}, { passive: true });

/* ── 3. Navbar: highlight da seção ativa ── */
const navLinks = document.querySelectorAll('.nav-links a');
const sections = document.querySelectorAll('section[id]');

function updateActiveLink() {
  const scrollY = window.scrollY + 100;

  sections.forEach(section => {
    const top    = section.offsetTop;
    const height = section.offsetHeight;
    const id     = section.getAttribute('id');
    const link   = document.querySelector(`.nav-links a[href="#${id}"]`);

    if (link) {
      if (scrollY >= top && scrollY < top + height) {
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    }
  });
}

window.addEventListener('scroll', updateActiveLink, { passive: true });

/* ── 4. Menu hambúrguer (mobile) ── */
const hamburger = document.getElementById('hamburger');
const navMenu   = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navMenu.classList.toggle('open');
  // Impede scroll do body quando o menu está aberto
  document.body.style.overflow = navMenu.classList.contains('open') ? 'hidden' : '';
});

// Fecha o menu ao clicar num link
navLinks.forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navMenu.classList.remove('open');
    document.body.style.overflow = '';
  });
});

/* ── 5. Scroll reveal (IntersectionObserver) ── */
// Anima elementos com a classe .reveal quando entram na viewport
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Para de observar após revelar (só anima uma vez)
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.12,   // 12% do elemento visível já dispara
    rootMargin: '0px 0px -40px 0px'
  }
);

document.querySelectorAll('.reveal').forEach(el => {
  revealObserver.observe(el);
});

/* ── 6. Stagger delay nos cards (efeito cascata) ── */
// Aplica um delay crescente em grupos de cards para efeito cascata
const staggerGroups = [
  '.skill-category',
  '.project-card',
  '.timeline-item'
];

staggerGroups.forEach(selector => {
  document.querySelectorAll(selector).forEach((el, i) => {
    el.style.transitionDelay = `${i * 80}ms`;
  });
});

/* ── 7. Foto: mostra placeholder se imagem não carregar ── */
// O onerror no HTML já esconde a tag <img>.
// Este script garante que o placeholder fique visível nesses casos.
const heroPhoto = document.querySelector('.hero-photo');
const heroPlaceholder = document.getElementById('photo-placeholder');

if (heroPhoto && heroPlaceholder) {
  if (!heroPhoto.complete || heroPhoto.naturalWidth === 0) {
    heroPhoto.style.display = 'none';
    heroPlaceholder.style.display = 'flex';
  }

  heroPhoto.addEventListener('load', () => {
    if (heroPhoto.naturalWidth > 0) {
      heroPlaceholder.style.display = 'none';
      heroPhoto.style.display = 'block';
    }
  });

  heroPhoto.addEventListener('error', () => {
    heroPhoto.style.display = 'none';
    heroPlaceholder.style.display = 'flex';
  });
}
