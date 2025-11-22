const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const express = require('express');

const app = express();
app.use(express.json());

// Load environment variables
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:5678/webhook/ai-whatsapp';
const PORT = process.env.PORT || 3000;

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
        auth: state,
        version
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            qrcode.generate(qr, { small: true });
            console.log('Scan the QR code above with WhatsApp.');
        }
        if (connection === 'close') {
            if ((lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut) {
                startBot();
            } else {
                console.log('Logged out.');
            }
        } else if (connection === 'open') {
            console.log('WhatsApp connection established.');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Listen for incoming messages
    sock.ev.on('messages.upsert', async (msg) => {
        if (!msg.messages) return;
        const message = msg.messages[0];
        if (!message.message || !message.key.remoteJid) return;

        const from = message.key.remoteJid;
        const text = message.message.conversation || message.message.extendedTextMessage?.text;

        // Send incoming message to n8n webhook
        const axios = require('axios');
        if (text && text.startsWith('#AI')) {
            const cleanMessage = text.replace(/^#AI\s*/, '');
            await axios.post(WEBHOOK_URL, {
                from,
                message: cleanMessage
            });
        }
    });

    // Endpoint to send messages from n8n to WhatsApp
    app.post('/send-message', async (req, res) => {
        const { to, message } = req.body;
        try {
            await sock.sendMessage(to, { text: message });
            res.json({ status: 'ok' });
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: e.message });
        }
    });

    app.listen(PORT, () => {
        console.log(`Bot API running on http://localhost:${PORT}`);
    });
}

startBot();
