require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// --- CONFIG DO BANCO ---
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '2811',
    database: process.env.DB_NAME || 'SoulSync',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const SECRET_KEY = process.env.SECRET_KEY || 'sekiro_shadows_die_twice_secret';

// Teste de conexão
(async () => {
    try {
        const conn = await pool.getConnection();
        console.log("✅ Conectado ao MySQL!");
        conn.release();
    } catch (err) {
        console.error("❌ Erro ao conectar ao MySQL:", err);
    }
})();

// ----------------------
// ROTAS DE AUTENTICAÇÃO (registro/login)
// ----------------------

// Registro (mantive, simples)
app.post('/api/register', async (req, res) => {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) return res.status(400).json({ message: 'Preencha todos os campos.' });

    try {
        const [existing] = await pool.execute("SELECT usuario_id FROM usuarios WHERE email = ?", [email]);
        if (existing.length > 0) return res.status(409).json({ message: "Email já cadastrado." });

        const hashed = await bcrypt.hash(senha, 10);
        await pool.execute(
            "INSERT INTO usuarios (nome_usuario, email, senha_hash, cargo_id_fk) VALUES (?, ?, ?, 2)",
            [nome, email, hashed]
        );

        res.status(201).json({ message: "Usuário criado com sucesso!" });
    } catch (err) {
        console.error("Erro no registro:", err);
        res.status(500).json({ message: "Erro ao registrar usuário." });
    }
});

// Login (mantive, retorno token)
app.post('/api/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const [rows] = await pool.execute("SELECT * FROM usuarios WHERE email = ?", [email]);
        if (rows.length === 0) return res.status(404).json({ message: "Usuário não encontrado." });

        const user = rows[0];
        const valid = await bcrypt.compare(senha, user.senha_hash);
        if (!valid) return res.status(401).json({ message: "Senha incorreta." });

        const token = jwt.sign({ id: user.usuario_id, nome: user.nome_usuario }, SECRET_KEY, { expiresIn: '24h' });

        res.json({ message: "Login realizado!", token, usuario: { id: user.usuario_id, nome: user.nome_usuario } });
    } catch (err) {
        console.error("Erro no login:", err);
        res.status(500).json({ message: "Erro interno no servidor." });
    }
});

// ----------------------
// MIDDLEWARE AUTH
// ----------------------
const auth = (req, res, next) => {
    const header = req.headers['authorization'];
    const token = header && header.split(' ')[1];
    if (!token) return res.status(401).json({ message: "Token não fornecido." });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: "Token inválido." });
        req.user = user;
        next();
    });
};

// --------------------------------------
// ROTA: LISTAR TODOS OS COMENTÁRIOS
// GET /api/comments
// --------------------------------------
app.get('/api/comments/:pageIdentifier', async (req, res) => {
    const raw = req.params.pageIdentifier;

    try {
        // 1. Localiza o ID numérico da página pelo slug
        const [page] = await pool.execute(
            "SELECT pagina_id FROM Paginas WHERE slug = ? LIMIT 1",
            [raw]
        );

        if (page.length === 0) {
            return res.json([]); // sem erros, apenas vazio
        }

        const pageIdNum = page[0].pagina_id;

        // 2. Busca os comentários desse ID
        const [rows] = await pool.execute(
            `SELECT c.comentario_id, c.texto_comentario, c.data_comentario, u.nome_usuario
             FROM Comentarios c
             JOIN usuarios u ON u.usuario_id = c.usuario_id_fk
             WHERE c.pagina_id = ?
             ORDER BY c.data_comentario DESC`,
            [pageIdNum]
        );

        // 3. Formata a resposta
        const comments = rows.map(r => ({
            user_name: r.nome_usuario,
            comment_text: r.texto_comentario,
            created_at: r.data_comentario
        }));

        res.json(comments);

    } catch (err) {
        console.error("Erro ao buscar comentários:", err);
        res.status(500).json({ message: "Erro ao buscar comentários." });
    }
});




// ----------------------
// ROTA: ENVIAR COMENTÁRIO
// POST /api/comments
// body: { text, pageId }  // pageId pode ser slug ou número
// ----------------------
app.post('/api/comments', auth, async (req, res) => {

    // 🔥 LOGS IMPORTANTES
    console.log("---- NOVO POST /api/comments ----");
    console.log("REQ BODY:", req.body);
    console.log("REQ USER:", req.user);

    const { text, pageId } = req.body;


    if (!text || !pageId) return res.status(400).json({ message: "text e pageId são obrigatórios." });

    try {
        // resolve pageId para numérico
        let pageIdNum;
        if (/^\d+$/.test(String(pageId))) {
            pageIdNum = Number(pageId);
        } else {
            // procura por slug, depois por titulo
            let [pRows] = await pool.execute("SELECT pagina_id FROM Paginas WHERE slug = ? LIMIT 1", [pageId]);
            if (pRows.length === 0) {
                [pRows] = await pool.execute("SELECT pagina_id FROM Paginas WHERE titulo = ? LIMIT 1", [pageId]);
            }
            if (pRows.length === 0) {
                return res.status(400).json({ message: "Página inválida. Cadastre a página primeiro." });
            }
            pageIdNum = pRows[0].pagina_id;
        }

        // Inserção usando nomes exatos do seu banco
        await pool.execute(
    "INSERT INTO Comentarios (texto_comentario, usuario_id_fk, pagina_id) VALUES (?, ?, ?)",
    [text, req.user.id, pageIdNum]
);

        res.status(201).json({ message: "Comentário enviado!" });
    } catch (err) {
        console.error("Erro ao enviar comentário:", err);
        if (err && err.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ message: "Página ou usuário não encontrado (FK)." });
        }
        res.status(500).json({ message: "Erro ao salvar comentário.", detail: err.message });
    }
});

// ----------------------
// INICIAR SERVIDOR
// ----------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 Server ON na porta ${PORT}`));
