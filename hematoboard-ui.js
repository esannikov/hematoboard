(function bootstrapHematoBoardUi() {
  "use strict";

  const style = "carbon";

  function syncContextLinks(style) {
    document.querySelectorAll("a[href]").forEach((link) => {
      let target;
      try {
        target = new URL(link.href, window.location.href);
      } catch {
        return;
      }
      if (target.origin !== window.location.origin) return;
      if (!target.pathname.startsWith("/methodology/") && !target.pathname.startsWith("/clinician/")) return;
      target.searchParams.set("ui", style);
      link.href = target.href;
    });
  }

  function apply() {
    document.documentElement.dataset.ui = style;
    document.querySelector("#theme-color, #themeColor")?.setAttribute("content", "#f4f4f4");
    syncContextLinks(style);
    return style;
  }

  apply();
  window.HematoBoardUI = Object.freeze({ apply, current: () => style });

  document.addEventListener("DOMContentLoaded", () => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("ui") !== style) {
      url.searchParams.set("ui", style);
      window.history.replaceState(window.history.state, "", url);
    }
    apply();
  });
})();
