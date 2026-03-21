const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();

// Configurações Iniciais
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Onde ficam seus HTMLs e o database.json

// Caminhos dos "Bancos de Dados" (Arquivos JSON)
const DB_PATH = './public/database.json';
const STATS_PATH = './public/stats.json';
const UPLOADS_DIR = './public/jogos';

// Garante que as pastas e arquivos existam
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify([]));
if (!fs.existsSync(STATS_PATH)) fs.writeFileSync(STATS_PATH, JSON.stringify({ total: 0 }));

// Configuração do Multer (Upload de Arquivos)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// --- ROTAS DE ESTATÍSTICAS ---

// Registrar nova visita
app.post('/api/visita', (req, res) => {
    const stats = JSON.parse(fs.readFileSync(STATS_PATH));
    stats.total += 1;
    fs.writeFileSync(STATS_PATH, JSON.stringify(stats, null, 2));
    res.json({ success: true, total: stats.total });
});

// Pegar total de visitas (para o Admin)
app.get('/api/stats', (req, res) => {
    const stats = JSON.parse(fs.readFileSync(STATS_PATH));
    res.json(stats);
});

// --- ROTAS DOS JOGOS ---

// Listar todos os jogos
app.get('/api/jogos', (req, res) => {
    const jogos = JSON.parse(fs.readFileSync(DB_PATH));
    res.json(jogos);
});

// Upload de novo jogo
app.post('/api/upload', upload.single('jogo'), (req, res) => {
    const jogos = JSON.parse(fs.readFileSync(DB_PATH));
    
    const novoJogo = {
        id: Date.now().toString(),
        nome: req.body.nome,
        desc: req.body.desc,
        plataforma: req.body.plataforma || 'pc', // 'pc' ou 'mobile'
        versao: "1.0.0",
        url: `/jogos/${req.file.filename}`,
        comentarios: [],
        logs: [`[${new Date().toLocaleDateString()}] Lançamento inicial`]
    };

    jogos.push(novoJogo);
    fs.writeFileSync(DB_PATH, JSON.stringify(jogos, null, 2));
    res.json({ success: true });
});

// Adicionar comentário
app.post('/api/jogos/:id/comentar', (req, res) => {
    const jogos = JSON.parse(fs.readFileSync(DB_PATH));
    const jogo = jogos.find(j => j.id === req.params.id);
    
    if (jogo) {
        jogo.comentarios.push({
            usuario: req.body.usuario || "Explorador",
            texto: req.body.texto,
            data: new Date()
        });
        fs.writeFileSync(DB_PATH, JSON.stringify(jogos, null, 2));
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Jogo não encontrado" });
    }
});

// Deletar jogo e arquivo físico
app.delete('/api/jogos/:id', (req, res) => {
    let jogos = JSON.parse(fs.readFileSync(DB_PATH));
    const jogo = jogos.find(j => j.id === req.params.id);

    if (jogo) {
        // Deleta o arquivo físico da pasta /jogos
        const nomeArquivo = jogo.url.replace('/jogos/', '');
        const caminhoCompleto = path.join(UPLOADS_DIR, nomeArquivo);
        
        if (fs.existsSync(caminhoCompleto)) {
            fs.unlinkSync(caminhoCompleto);
        }

        // Remove do JSON
        jogos = jogos.filter(j => j.id !== req.params.id);
        fs.writeFileSync(DB_PATH, JSON.stringify(jogos, null, 2));
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Jogo não encontrado" });
    }
});

// Inicialização
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`
    ============================================
    🚀 SERVIDOR GAME_MANAGER PRO RODANDO!
    🔗 URL: http://localhost:${PORT}
    📂 Arquivos salvos em: ${UPLOADS_DIR}
    ============================================
    `);
});