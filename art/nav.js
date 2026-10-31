(function () {
  const p = location.pathname.replace(/\/index\.html$/, '/');
  let activeLabel = 'Art';

  function tDict() {
    const lang = document.documentElement.getAttribute('lang') || 'en';
    return (window.PRESKER_I18N && window.PRESKER_I18N[lang]) || {};
  }

  function a(href, label) {
    const isActive = p === href || (href !== '/art/' && p.startsWith(href.replace(/\.html$/, '')));
    if (isActive) activeLabel = label;
    return `<li><a href="${href}"${isActive ? ' class="active"' : ''}>${label}</a></li>`;
  }

  const navEl = document.getElementById('art-nav');

  function treeHtml() {
    activeLabel = 'Art';
    const T = tDict();
    const tt = (key, fallback) => T[key] || fallback;
    return `
      ${a('/art/', tt('artOverview', 'Overview'))}
      ${a('/art/biography.html', tt('artBio', 'Biography'))}
      ${a('/art/statement.html', tt('artStatement', 'Artist Statement'))}
      ${a('/art/cv.html', 'CV')}
      <li class="nav-group">
        <span class="nav-group-label" data-i18n="artWorks">Works</span>
        <ul>
          ${a('/art/works/interactive-installations.html', tt('artInteractive', 'Interactive Installations'))}
          ${a('/art/works/light-sculptures.html', tt('artLight', 'Light Sculptures'))}
          ${a('/art/works/photography.html', tt('artPhoto', 'Photography'))}
          ${a('/art/works/video-animation.html', tt('artVideo', 'Video / Animation'))}
          ${a('/art/works/collaborative-projects.html', tt('artCollab', 'Collaborative Projects'))}
        </ul>
      </li>
      <li class="nav-group">
        <span class="nav-group-label" data-i18n="artSelected">Selected Projects</span>
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
      ${a('/art/exhibitions.html', tt('artExhibitions', 'Exhibitions'))}
      ${a('/art/awards.html', tt('artAwards', 'Awards & Residencies'))}
      ${a('/art/publications.html', tt('artPublications', 'Publications'))}
      ${a('/art/press.html', tt('artPress', 'Press'))}
      ${a('/art/archive.html', tt('artArchive', 'Archive'))}
      ${a('/art/contact.html', tt('artContact', 'Contact'))}
    `;
  }

  function renderTree() {
    const treeEl = document.getElementById('art-nav-tree');
    treeEl.innerHTML = treeHtml();
    const label = document.querySelector('.nav-toggle-label .active-label');
    if (label) label.textContent = activeLabel;
  }

  navEl.innerHTML = `
    <div class="nav-top">
      <a href="/" class="back-link" data-i18n="backHome">← presker.at</a>
      <span class="nav-section-label" data-i18n="navArt">ART</span>
    </div>
    <ul class="nav-tree" id="art-nav-tree"></ul>`;
  renderTree();

  // Toggle UI — a sibling of the (re-rendered) tree, built once.
  const toggles = document.createElement('div');
  toggles.className = 'toggles';
  toggles.style.cssText = 'padding: 14px 18px 4px;';
  toggles.innerHTML = `
    <div class="pill-group" role="group" aria-label="Language" data-lang-toggle>
      <button class="pill-btn" data-lang-set="auto">Auto</button>
      <button class="pill-btn" data-lang-set="en">EN</button>
      <button class="pill-btn" data-lang-set="de">DE</button>
      <button class="pill-btn" data-lang-set="sl">SL</button>
    </div>
    <div class="pill-group" role="group" aria-label="Theme" data-theme-toggle>
      <button class="pill-btn" data-theme-set="light">☀</button>
      <button class="pill-btn" data-theme-set="auto">Auto</button>
      <button class="pill-btn" data-theme-set="dark">☾</button>
    </div>`;
  navEl.appendChild(toggles);
  if (window.PreskerI18n) window.PreskerI18n.mountToggle();
  if (window.PreskerTheme) window.PreskerTheme.mountToggle();
  document.addEventListener('presker-lang-change', renderTree);

  // ── Mobile toggle bar + backdrop (collapsed by default, self-hiding) ──
  const shell = document.querySelector('.art-shell');

  const toggleBar = document.createElement('div');
  toggleBar.className = 'nav-toggle-bar';
  toggleBar.innerHTML = `
    <span class="nav-toggle-label">ART <span class="accent">/</span> <span class="active-label">${activeLabel}</span></span>
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
