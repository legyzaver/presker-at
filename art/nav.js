(function () {
  const p = location.pathname.replace(/\/index\.html$/, '/');
  let activeLabel = 'Art';

  function a(href, label) {
    const isActive = p === href || (href !== '/art/' && p.startsWith(href.replace(/\.html$/, '')));
    if (isActive) activeLabel = label;
    return `<li><a href="${href}"${isActive ? ' class="active"' : ''}>${label}</a></li>`;
  }

  const navEl = document.getElementById('art-nav');

  navEl.innerHTML = `
    <div class="nav-top">
      <a href="/" class="back-link">← presker.at</a>
      <span class="nav-section-label">ART</span>
    </div>
    <ul class="nav-tree">
      ${a('/art/', 'Overview')}
      ${a('/art/biography.html', 'Biography')}
      ${a('/art/statement.html', 'Artist Statement')}
      ${a('/art/cv.html', 'CV')}
      <li class="nav-group">
        <span class="nav-group-label">Works</span>
        <ul>
          ${a('/art/works/interactive-installations.html', 'Interactive Installations')}
          ${a('/art/works/light-sculptures.html', 'Light Sculptures')}
          ${a('/art/works/photography.html', 'Photography')}
          ${a('/art/works/video-animation.html', 'Video / Animation')}
          ${a('/art/works/collaborative-projects.html', 'Collaborative Projects')}
        </ul>
      </li>
      <li class="nav-group">
        <span class="nav-group-label">Selected Projects</span>
        <ul>
          ${a('/art/projects/formication.html', 'Formication')}
          ${a('/art/projects/breather.html', 'Breather')}
          ${a('/art/projects/g-schichten.html', 'G-Schichten')}
          ${a('/art/projects/displacement.html', 'Displacement')}
          ${a('/art/projects/kamin.html', 'Kamin')}
          ${a('/art/projects/knot.html', 'Knot')}
          ${a('/art/projects/solidno.html', 'Solidno')}
          ${a('/art/projects/tube.html', 'Tube')}
          ${a('/art/projects/parallel.html', 'Parallel')}
          ${a('/art/projects/interactive-window.html', 'Interactive Window')}
          ${a('/art/projects/flash.html', 'Flash')}
          ${a('/art/projects/intrude.html', 'Intrude')}
          ${a('/art/projects/invisible.html', 'Invisible')}
          ${a('/art/projects/homo-diaphoricus.html', 'Homo Diaphoricus')}
          ${a('/art/projects/425.html', '4 25')}
          ${a('/art/projects/to-school.html', 'To School')}
          ${a('/art/projects/dancing-with-the-corner.html', 'Dancing with the Corner')}
        </ul>
      </li>
      ${a('/art/exhibitions.html', 'Exhibitions')}
      ${a('/art/awards.html', 'Awards & Residencies')}
      ${a('/art/publications.html', 'Publications')}
      ${a('/art/press.html', 'Press')}
      ${a('/art/archive.html', 'Archive')}
      ${a('/art/contact.html', 'Contact')}
    </ul>`;

  // ── Mobile toggle bar + backdrop (collapsed by default, self-hiding) ──
  const shell = document.querySelector('.art-shell');

  const toggleBar = document.createElement('div');
  toggleBar.className = 'nav-toggle-bar';
  toggleBar.innerHTML = `
    <span class="nav-toggle-label">ART <span class="accent">/</span> ${activeLabel}</span>
    <button class="nav-toggle-btn" type="button" aria-label="Toggle navigation" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>`;

  const backdrop = document.createElement('div');
  backdrop.className = 'nav-backdrop';

  shell.parentNode.insertBefore(toggleBar, shell);
  shell.parentNode.insertBefore(backdrop, shell);

  const toggleBtn = toggleBar.querySelector('.nav-toggle-btn');

  function setOpen(open) {
    navEl.classList.toggle('is-open', open);
    backdrop.classList.toggle('is-open', open);
    toggleBtn.classList.toggle('is-open', open);
    toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  }

  toggleBtn.addEventListener('click', () => setOpen(!navEl.classList.contains('is-open')));
  backdrop.addEventListener('click', () => setOpen(false));
  navEl.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') setOpen(false);
  });
})();
