require('dotenv').config();

const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');

const app = express();
app.use(cors());

/*
app.use(cors({
  origin: 'https://link-here.github.io'
}));
*/

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.TOKEN || `7020765117:AAFIn4F1NCnpcV6zGw26ODYHsAfxMLlRkSI`;
const CHAT_ID = process.env.CHAT_ID || `58937654`;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 30 * 1024 * 1024 } // 30 MB only
});

app.get('/', (req, res) => {
    res.send('Eat fruits and drink mineral water :)');
});

app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const fileBuffer = req.file.buffer;
        const fileName = req.file.originalname;
        const formData = new FormData();
        formData.append('chat_id', CHAT_ID);
        formData.append('document', fileBuffer, fileName);
        const telegramResp = await axios.post(
            `${TELEGRAM_API}/sendDocument`,
            formData,
            { headers: formData.getHeaders() }
        );
        const file_id = telegramResp.data.result.document?.file_id;
        res.json({ message: 'File sent to Telegram!', file_id });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Upload failed.' });
    }
});

app.get('/file/:file_id', async (req, res) => {
    const { file_id } = req.params;
    try {
        const resp = await axios.get(`${TELEGRAM_API}/getFile`, {
            params: { file_id }
        });
        const filePath = resp.data.result?.file_path;
        if (!filePath) {
            return res.status(404).json({ error: 'File not found on Telegram.' });
        }
        const telegramFileURL = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
        res.redirect(telegramFileURL);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
