(function () {
  const p = location.pathname.replace(/\/index\.html$/, '/');

  function a(href, label) {
    const active = p === href || (href !== '/art/' && p.startsWith(href.replace(/\.html$/, '')))
      ? ' class="active"' : '';
    return `<li><a href="${href}"${active}>${label}</a></li>`;
  }

  document.getElementById('art-nav').innerHTML = `
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
})();
