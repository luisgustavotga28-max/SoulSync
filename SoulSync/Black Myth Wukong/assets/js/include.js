const scriptTag = document.currentScript;
const includeBase = scriptTag && scriptTag.dataset && scriptTag.dataset.includeBase
  ? scriptTag.dataset.includeBase
  : "";

function buildPath(file) {
  if (!includeBase) {
    return file;
  }
  return includeBase.endsWith("/") ? includeBase + file : includeBase + "/" + file;
}

function shouldPrefix(path) {
  if (!includeBase || !path) {
    return false;
  }

  const lower = path.toLowerCase();
  
return !(
  lower.startsWith("/") ||          //  << ADICIONE ISSO
  lower.startsWith("http://") ||
  lower.startsWith("https://") ||
  lower.startsWith("//") ||
  lower.startsWith("#") ||
  lower.startsWith("mailto:") ||
  lower.startsWith("tel:") ||
  lower.startsWith("data:")
);

}

function applyBaseToAttributes(element) {
  if (!includeBase || !element) {
    return;
  }

  element.querySelectorAll("[href]").forEach(node => {
    const href = node.getAttribute("href");
    if (shouldPrefix(href)) {
      node.setAttribute("href", buildPath(href));
    }
  });

  element.querySelectorAll("[src]").forEach(node => {
    const src = node.getAttribute("src");
    if (shouldPrefix(src)) {
      node.setAttribute("src", buildPath(src));
    }
  });
}

function loadHTML(targetId, file) {
  fetch(buildPath(file))
    .then(response => {
      if (!response.ok) {
        throw new Error("Erro ao carregar " + file + ": " + response.status);
      }
      return response.text();
    })
    .then(html => {
      const element = document.getElementById(targetId);
      if (element) {
        element.innerHTML = html;
        applyBaseToAttributes(element);
      }
    })
    .catch(error => {
      console.error(error);
    });
}

document.addEventListener("DOMContentLoaded", function () {
  loadHTML("header", "includes/header.html");
  loadHTML("sidebar", "includes/sidebar.html");
  loadHTML("footer", "includes/footer.html");
});
