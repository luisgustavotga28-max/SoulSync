document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.createElement("div");
  overlay.className = "lightbox-overlay";

  const figure = document.createElement("figure");
  figure.className = "lightbox-content";

  const img = document.createElement("img");
  const caption = document.createElement("figcaption");

  const closeBtn = document.createElement("button");
  closeBtn.className = "lightbox-close";
  closeBtn.setAttribute("aria-label", "Fechar imagem");
  closeBtn.textContent = "×";

  figure.appendChild(closeBtn);
  figure.appendChild(img);
  figure.appendChild(caption);
  overlay.appendChild(figure);
  document.body.appendChild(overlay);

  const openLightbox = (src, alt, text) => {
    img.src = src;
    img.alt = alt || "";
    caption.textContent = text || "";
    overlay.classList.add("is-visible");
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    overlay.classList.remove("is-visible");
    document.body.style.overflow = "";
  };

  closeBtn.addEventListener("click", closeLightbox);
  overlay.addEventListener("click", (ev) => {
    if (ev.target === overlay) closeLightbox();
  });

  document.addEventListener("keyup", (ev) => {
    if (ev.key === "Escape" && overlay.classList.contains("is-visible")) {
      closeLightbox();
    }
  });

  document.querySelectorAll(".lore-image img, .feature-image img").forEach((imageEl) => {
    imageEl.addEventListener("click", () => {
      const captionText = imageEl.closest(".lore-section")?.querySelector("h2")?.textContent || imageEl.alt || "";
      openLightbox(imageEl.src, imageEl.alt, captionText);
    });

    imageEl.setAttribute("tabindex", "0");
    imageEl.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        imageEl.click();
      }
    });
  });
});
