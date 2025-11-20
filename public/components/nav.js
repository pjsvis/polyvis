document.addEventListener("DOMContentLoaded", () => {
  const navContainer = document.getElementById("polyvis-nav");
  if (!navContainer) return;

  const currentPath = window.location.pathname;

  // Define links
  const links = [
    { name: "HQ", href: "/" },
    { name: "Visualizer", href: "/graph/" },
    { name: "Docs", href: "/docs/" },
  ];

  // Generate Links HTML
  const linksHTML = links
    .map((link) => {
      // Simple logic to check if active
      // We check if currentPath starts with link.href (for subpages)
      // but exclude root '/' matching everything.
      const isActive =
        (link.href === "/" && currentPath === "/") ||
        (link.href !== "/" && currentPath.startsWith(link.href));

      return `<a href="${link.href}" class="nav-item ${isActive ? "active" : ""}">${link.name}</a>`;
    })
    .join("");

  // Build the Structure using our new CSS classes
  const navHTML = `
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

  // Inject
  navContainer.innerHTML = navHTML;
});
