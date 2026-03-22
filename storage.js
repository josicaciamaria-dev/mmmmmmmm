const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(cors());

const uploadDir = './meus_jogos';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
});
const upload = multer({ storage: storage });

// Rota para o admin.html enviar o arquivo
app.post('/receber-arquivo', upload.single('arquivo_jogo'), (req, res) => {
    if (!req.file) return res.status(400).send("Erro no arquivo");
    console.log(`📥 Arquivo guardado localmente: ${req.file.filename}`);
    res.json({ nomeArquivo: req.file.filename });
});

// Rota para baixar (acessível apenas via seu IP ou localhost)
app.get('/download/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'meus_jogos', req.params.filename);
    res.download(filePath);
});

app.listen(4000, () => console.log("🚀 Storage Local rodando em http://localhost:4000"));