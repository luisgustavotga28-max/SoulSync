function loadHTML(targetId, file) {
  fetch(file)
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
