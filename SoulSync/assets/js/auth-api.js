// URL do seu servidor Node.js
const API_URL = "http://localhost:3000/api";

document.addEventListener("DOMContentLoaded", () => {
    const headerRight = document.querySelector('.header-right');
    const token = localStorage.getItem('sekiro_token');
    const username = localStorage.getItem('sekiro_user');

    // Se tiver token salvo, o usuário está logado
    if (token && username) {
        if(headerRight) {
            headerRight.innerHTML = `
                <span style="color: #d4af37; margin-right: 15px; font-weight: bold;">Olá, ${username}</span>
                <button id="btn-logout" class="btn" style="background: #c62828;">Sair</button>
            `;
            
            document.getElementById('btn-logout').addEventListener('click', () => {
                localStorage.removeItem('sekiro_token');
                localStorage.removeItem('sekiro_user');
                localStorage.removeItem('sekiro_uid');
                alert("Você saiu da conta.");
                window.location.reload();
            });
        }
    }
});

// Função de Login (para usar na página login.html)
async function loginUser(email, password) {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('sekiro_token', data.token);
            localStorage.setItem('sekiro_user', data.username);
            localStorage.setItem('sekiro_uid', data.userId);
            return true;
        } else {
            alert(data.error);
            return false;
        }
    } catch (error) {
        console.error("Erro:", error);
        alert("Erro ao conectar com o servidor.");
        return false;
    }
}

// Exporta para ser usado no HTML de login
window.loginUser = loginUser;