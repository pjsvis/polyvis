import { toggleTheme } from '../utils/theme.js';

export default () => ({
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

                const target = link.target || '_self';
                const isExternal = target === '_blank';
                const externalIcon = isExternal ? `<i data-lucide="external-link" style="width: 12px; height: 12px; margin-left: 4px; opacity: 0.7;"></i>` : '';

                return `
            <a href="${link.href}" target="${target}" class="nav-item ${isActive ? "active" : ""}">
              <i data-lucide="${link.icon}" style="width: var(--font-size-sm); height: var(--font-size-sm);"></i>
              ${link.name}
              ${externalIcon}
            </a>`;
            })
            .join("");

        return `
        <nav class="nav-wrapper">
            <div style="display: flex; align-items: center; gap: 2rem; width: 100%; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 2rem;">
                    <a href="/" class="nav-brand">PolyVis</a>
                    <div class="nav-links">
                        ${linksHTML}
                    </div>
                </div>
                <a href="#" id="nav-theme-toggle" onclick="window.toggleTheme(); return false;" class="nav-item">
                    <i data-lucide="sun" style="width: var(--font-size-sm); height: var(--font-size-sm);"></i>
                    Theme
                </a>
            </div>
        </nav>
        `;
    }
})
