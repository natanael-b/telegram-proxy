require('dotenv').config();

const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*'
}));

const PORT = process.env.PORT || 3000;
const TELEGRAM_KEY= process.env.TELEGRAM_KEY || `7020765117:AAFIn4F1NCnpcV6zGw26ODYHsAfxMLlRkSI`;
const IMGBB_KEY = process.env.IMGBB_KEY || `b07646f369218eb36d836b2ae9da1463`;
const CHAT_ID = process.env.CHAT_ID || `589376542`;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_KEY}`;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 30 * 1024 * 1024 } // 30 MB only
});

app.get('/', (req, res) => {
    res.send('Eat fruits and drink mineral water :)');
});

app.get('/ping', (req, res) => {
    res.status(200).json({ success: true });
});

app.post('/uploadFile', upload.single('file'), async (req, res) => {
    try {
        const fileBuffer = req.file.buffer;
        const fileName = req.file.originalname;
        const formData = new FormData();
        formData.append('chat_id', CHAT_ID);
        formData.append('document', fileBuffer, { filename: fileName });
        const telegramResp = await axios.post(
            `${TELEGRAM_API}/sendDocument`,
            formData,
            { headers: formData.getHeaders() }
        );
        const file_id = telegramResp.data.result.document?.file_id;
        res.json({ message: 'File sent to Telegram!', file_id });
    } catch (err) {
        console.error('Telegram API Error:', err.response?.data);
            res.status(500).json({ 
            error: `${err.message}`, 
            telegram: err.response?.data 
        });
    }
});

app.post('/uploadImage', upload.single('image'), async (req, res) => {
    try {
        const fileBuffer = req.file.buffer;
        const fileBase64 = fileBuffer.toString('base64');

        const formData = new FormData();
        formData.append('key', IMGBB_KEY);
        formData.append('image', fileBase64);

        const imgbbResp = await axios.post(
            'https://api.imgbb.com/1/upload',
            formData,
            { headers: formData.getHeaders() }
        );

        res.json(imgbbResp.data);

    } catch (err) {
        console.error('IMGBB API Error:', err.response?.data);
        res.status(500).json({
            error: `${err.message}`,
            imgbb: err.response?.data
        });
    }
});

app.get('/download/:file_id', async (req, res) => {
    const { file_id } = req.params;
    try {
        const resp = await axios.get(`${TELEGRAM_API}/getFile`, {
            params: { file_id }
        });
        const filePath = resp.data.result?.file_path;
        if (!filePath) {
            return res.status(404).json({ error: 'File not found on Telegram.' });
        }
        const telegramFileURL = `https://api.telegram.org/file/bot${TELEGRAM_KEY}/${filePath}`;
        res.redirect(telegramFileURL);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

app.get('/fetch/:file_id', async (req, res) => {
    const { file_id } = req.params;

    try {
        const resp = await axios.get(`${TELEGRAM_API}/getFile`, {
            params: { file_id }
        });

        const filePath = resp.data.result?.file_path;
        if (!filePath) {
            return res.status(404).json({ error: 'File not found on Telegram.' });
        }

        const telegramFileURL = `https://api.telegram.org/file/bot${TELEGRAM_KEY}/${filePath}`;
        const fileStream = await axios.get(telegramFileURL, {
            responseType: 'stream'
        });

        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', attachment; filename=`${filePath.split('/').pop()}`);

        fileStream.data.pipe(res);
    } catch (err) {
        console.error('Download error:', err.message);
        res.status(500).json({ error: err.message });
    }
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
