document.addEventListener("DOMContentLoaded", () => {
  const toggles = Array.from(document.querySelectorAll(".toggle"));

  if (!toggles.length) {
    return;
  }

  const closeCard = (toggle) => {
    const panel = toggle.nextElementSibling;
    if (!panel) {
      return;
    }

    toggle.classList.remove("highlight");
    toggle.setAttribute("aria-expanded", "false");
    panel.style.height = null;
  };

  const openCard = (toggle) => {
    const panel = toggle.nextElementSibling;
    if (!panel) {
      return;
    }

    toggle.classList.add("highlight");
    toggle.setAttribute("aria-expanded", "true");
    panel.style.height = `${panel.scrollHeight}px`;
  };

  toggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const isOpen = toggle.classList.contains("highlight");

      toggles.forEach(closeCard);

      if (!isOpen) {
        openCard(toggle);
      }
    });
  });

  const syncOpenCards = () => {
    toggles
      .filter((toggle) => toggle.classList.contains("highlight"))
      .forEach((toggle) => {
        const panel = toggle.nextElementSibling;
        if (panel) {
          panel.style.height = `${panel.scrollHeight}px`;
        }
      });
  };

  window.addEventListener("resize", syncOpenCards);
  window.addEventListener("load", syncOpenCards);

  openCard(toggles[0]);
  requestAnimationFrame(syncOpenCards);
});
