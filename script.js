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

/* ── 8. Dark / Light Mode ── */
const themeToggle = document.getElementById('theme-toggle');
const htmlEl = document.documentElement;

// SVG icons inline — sem dependência externa
const ICON_MOON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
const ICON_SUN  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;

function applyTheme(theme) {
  htmlEl.setAttribute('data-theme', theme);
  if (themeToggle) {
    // No dark mode mostramos o sol (para ir ao claro), no light mostramos a lua
    themeToggle.innerHTML = theme === 'dark' ? ICON_SUN : ICON_MOON;
    themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro');
  }
}

function initTheme() {
  const saved   = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  // Prioridade: salvo > preferência do sistema > dark (padrão)
  applyTheme(saved || (prefersDark ? 'dark' : 'light'));
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = htmlEl.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('theme', next);
  });
}

initTheme();

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

/* ── 9. GitHub Integration ── */
const GITHUB_USER = 'bryanrory';
const GITHUB_MAX_REPOS = 6;

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function langColor(lang) {
  const colors = {
    'C#': '#178600', 'JavaScript': '#f1e05a', 'TypeScript': '#3178c6',
    'Python': '#3572A5', 'HTML': '#e34c26', 'CSS': '#563d7c',
    'Java': '#b07219', 'Go': '#00ADD8', 'Rust': '#dea584',
    'PHP': '#4F5D95', 'Ruby': '#701516', 'Shell': '#89e051',
  };
  return colors[lang] || '#94a3b8';
}

async function fetchLastCommit(repoName) {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_USER}/${repoName}/commits?per_page=1`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.length) return null;
    return {
      message: data[0].commit.message.split('\n')[0].slice(0, 72),
      date: formatDate(data[0].commit.author.date)
    };
  } catch {
    return null;
  }
}

function renderRepos(repos) {
  const container = document.getElementById('github-repos');
  if (!repos.length) {
    container.innerHTML = '<p class="github-error">Nenhum repositório público encontrado.</p>';
    return;
  }

  const CLOCK_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>`;
  const STAR_SVG  = `<svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
  const GH_SVG    = `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.09.682-.217.682-.483 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.071 1.531 1.03 1.531 1.03.891 1.529 2.341 1.087 2.91.832.091-.647.349-1.086.635-1.337-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.03-2.682-.103-.254-.447-1.27.098-2.646 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.376.202 2.394.1 2.646.64.698 1.026 1.59 1.026 2.682 0 3.841-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .269.18.579.688.481C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/></svg>`;

  container.innerHTML = '';

  repos.forEach((repo, i) => {
    const card = document.createElement('article');
    card.className = 'project-card reveal';
    card.style.transitionDelay = `${i * 80}ms`;

    const lang    = repo.language || '—';
    const desc    = repo.description || 'Sem descrição.';
    const updated = formatDate(repo.updated_at);
    const commitId = `commit-${repo.name.replace(/[^a-zA-Z0-9]/g, '-')}`;

    card.innerHTML = `
      <div class="project-body">
        <div class="github-repo-header">
          ${GH_SVG.replace('width="14"', 'width="16"').replace('height="14"', 'height="16"').replace('fill="currentColor"', 'fill="currentColor" class="github-repo-icon"')}
          <h3 class="project-name">${repo.name}</h3>
        </div>
        <p class="project-desc">${desc}</p>
        <div class="github-repo-meta">
          <span class="github-lang">
            <span class="github-lang-dot" style="background:${langColor(lang)}"></span>${lang}
          </span>
          <span class="github-stars">${STAR_SVG} ${repo.stargazers_count}</span>
          <span class="github-updated" id="${commitId}">${CLOCK_SVG} ${updated}</span>
        </div>
        <div class="project-links">
          <a href="${repo.html_url}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">
            ${GH_SVG} Ver no GitHub
          </a>
        </div>
      </div>`;

    container.appendChild(card);
    revealObserver.observe(card);

    fetchLastCommit(repo.name).then(commit => {
      const el = document.getElementById(commitId);
      if (el && commit) {
        el.innerHTML = `${CLOCK_SVG} ${commit.date} <span class="github-commit-msg">${commit.message}</span>`;
      }
    });
  });
}

async function fetchRepos() {
  const container = document.getElementById('github-repos');
  if (!container) return;

  container.innerHTML = '<div class="github-loading">Carregando repositórios...</div>';

  try {
    const res = await fetch(
      `https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=20&type=public`
    );
    if (!res.ok) throw new Error(`GitHub API: ${res.status}`);

    const repos = await res.json();
    const filtered = repos.filter(r => !r.fork).slice(0, GITHUB_MAX_REPOS);
    renderRepos(filtered);
  } catch {
    container.innerHTML = '<p class="github-error">Não foi possível carregar os repositórios. Tente novamente mais tarde.</p>';
  }
}

// Lazy load: busca os repos apenas quando a seção entrar na viewport
const githubSection = document.getElementById('github');
if (githubSection) {
  const githubObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        fetchRepos();
        githubObserver.disconnect();
      }
    },
    { rootMargin: '200px' }
  );
  githubObserver.observe(githubSection);
}
