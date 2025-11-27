document.addEventListener('alpine:init', () => {
  Alpine.data('navigation', () => ({
    links: [
      { name: "HQ", href: "/", icon: "home" },
      { name: "Visualizer", href: "/graph/", icon: "activity" },
      { name: "Docs", href: "/docs/", icon: "book-open" },
      { name: "Explorer", href: "/explorer/", icon: "compass" },
      { name: "Sigma Explorer", href: "/sigma-explorer/", icon: "layout-dashboard" },
      { name: "Source", href: "https://github.com/pjsvis/polyvis", icon: "github", target: "_blank" },
    ],
    init() {
      this.$nextTick(() => {
        if (window.lucide) window.lucide.createIcons();
      });
    },
    get view() {
      const currentPath = window.location.pathname;
      const linksHTML = this.links
        .map((link) => {
          const isActive =
            (link.href === "/" && currentPath === "/") ||
            (link.href !== "/" && currentPath.startsWith(link.href));

          return `
            <a href="${link.href}" target="${link.target || '_self'}" class="nav-item ${isActive ? "active" : ""}">
              <i data-lucide="${link.icon}" style="width: var(--font-size-sm); height: var(--font-size-sm);"></i>
              ${link.name}
            </a>`;
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
        </nav>
        `;
    }
  }));
});
