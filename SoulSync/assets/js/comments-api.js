// ================================================
// CONFIG
// ================================================
const API_URL = "http://localhost:3000/api";

// ================================================
// SLUGIFY — remove acentos e caracteres inválidos
// ================================================
function slugify(str) {
    return str
        .normalize("NFD")  // separa acentos
        .replace(/[\u0300-\u036f]/g, "") // remove acentos
        .toLowerCase()
        .replace(/[^a-z0-9\-]/g, ""); // remove qualquer coisa que não seja letra/número
}

// ================================================
// IDENTIFICA O PAGE ID DA PÁGINA
// ================================================
const rawId = window.location.pathname.split("/").pop().replace(".html", "");
const pageId = slugify(rawId);

console.log("🔎 Page ID detectado:", pageId);

// ================================================
// ELEMENTOS
// ================================================
const commentsList = document.getElementById("comments-list");
const commentForm = document.getElementById("comment-form");
const commentInput = document.getElementById("comment-input");
const submitButton = document.querySelector(".btn-submit-comment");

// ================================================
// 1. VERIFICA LOGIN
// ================================================
function checkLoginStatus() {
    const token = localStorage.getItem("sekiro_token");
    const username = localStorage.getItem("sekiro_user");

    if (!token || !username) {
        commentInput.disabled = true;
        commentInput.placeholder = "Faça login para comentar";
        submitButton.disabled = true;
        submitButton.innerText = "Login Necessário";
        submitButton.style.opacity = "0.5";
        return;
    }

    commentInput.disabled = false;
    commentInput.placeholder = `Comentar como ${username}...`;
    submitButton.disabled = false;
    submitButton.innerText = "Enviar Comentário";
    submitButton.style.opacity = "1";
}

// ================================================
// 2. CARREGAR COMENTÁRIOS
// ================================================
async function loadComments() {
    try {
        const response = await fetch(`${API_URL}/comments/${pageId}`);
        const data = await response.json();

        commentsList.innerHTML = "";

        if (!Array.isArray(data)) {
            console.error("⚠ Resposta inesperada:", data);
            commentsList.innerHTML = `
                <p style="color:red; text-align:center;">Erro ao carregar comentários.</p>
            `;
            return;
        }

        if (data.length === 0) {
            commentsList.innerHTML = `
                <p style="color:#aaa; text-align:center; font-style:italic;">
                    Nenhum comentário ainda. Seja o primeiro!
                </p>`;
            return;
        }

        data.forEach(c => {
            const avatar = c.user_name.charAt(0).toUpperCase();
            const date = new Date(c.created_at).toLocaleDateString("pt-BR");

            const el = document.createElement("div");
            el.className = "comment-item";
            el.innerHTML = `
                <div class="comment-avatar">${avatar}</div>
                <div class="comment-content">
                    <div class="comment-header">
                        <span class="comment-author">${c.user_name}</span>
                        <span class="comment-date">${date}</span>
                    </div>
                    <p class="comment-text">${c.comment_text}</p>
                </div>
            `;
            commentsList.appendChild(el);
        });

    } catch (error) {
        console.error("Erro ao carregar comentários:", error);
        commentsList.innerHTML = "<p style='color:red'>Erro ao carregar comentários.</p>";
    }
}

// ================================================
// 3. ENVIAR COMENTÁRIO
// ================================================
commentForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const text = commentInput.value.trim();
    if (!text) return;

    const token = localStorage.getItem("sekiro_token");

    try {
        const response = await fetch(`${API_URL}/comments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ text, pageId })
        });

        const serverReply = await response.clone().text();
        console.log("📨 Resposta do backend:", serverReply);

        if (!response.ok) {
            alert("Erro ao enviar comentário!");
            return;
        }

        commentInput.value = "";
        loadComments();

    } catch (err) {
        console.error("Erro ao enviar comentário:", err);
        alert("Erro de conexão com o servidor.");
    }
});

// ================================================
// 4. INICIALIZAÇÃO
// ================================================
document.addEventListener("DOMContentLoaded", () => {
    checkLoginStatus();
    loadComments();
});
