document.addEventListener('alpine:init', () => {
  Alpine.data('navigation', () => ({
    links: [
      { name: "HQ", href: "/" },
      { name: "Visualizer", href: "/graph/" },
      { name: "Docs", href: "/docs/" },
      { name: "Explorer", href: "/explorer/" },
      { name: "Sigma Explorer", href: "/sigma-explorer/" },
    ],
    get view() {
      const currentPath = window.location.pathname;
      const linksHTML = this.links
        .map((link) => {
          const isActive =
            (link.href === "/" && currentPath === "/") ||
            (link.href !== "/" && currentPath.startsWith(link.href));

          return `<a href="${link.href}" class="nav-item ${isActive ? "active" : ""}">${link.name}</a>`;
        })
        .join("");

      return `
        <nav class="nav-wrapper">
            <div style="display: flex; align-items: center; gap: 2rem;">
                <a href="/" class="nav-brand">PolyVis</a>
                <div class="nav-links">
                    ${linksHTML}
                </div>
            </div>
            <div class="nav-version">VIRTUAL_INFO_SYS</div>
        </nav>
        `;
    }
  }));
});
