const nodemailer = require('nodemailer');
const pool = require('../database/index');
const path = require('path');

const VERSION = "1.0.3-FIX-AUTH";
let isProcessing = false;
let currentBoletoProcessing = null;
let transporter = null;
let currentSmtpUser = null;

async function getTransporter(settings) {
    const user = (settings?.smtp_email || process.env.SMTP_USER || '').trim();
    const pass = (settings?.smtp_password || process.env.SMTP_PASS || '').trim();

    if (transporter && currentSmtpUser === user) return transporter;

    currentSmtpUser = user;
    transporter = null;

    console.log(`[Fila][v${VERSION}] Iniciando transportador de e-mail...`);

    if (user && pass) {
        console.log(`[Fila] Usando credenciais SMTP reais (${user})...`);
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_PORT === '465',
            auth: {
                user: user,
                pass: pass
            }
        });
    } else {
        console.log("[Fila] SMTP_USER/PASS não configurados. Gerando conta de teste Ethereal...");
        try {
            let testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: testAccount.smtp.host,
                port: testAccount.smtp.port,
                secure: testAccount.smtp.secure,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
            console.log("--------------------------------------------------");
            console.log("[Fila] CONTA DE TESTE CRIADA COM SUCESSO!");
            console.log(`[Fila] Ethereal User: ${testAccount.user}`);
            console.log(`[Fila] Ethereal Pass: ${testAccount.pass}`);
            console.log("--------------------------------------------------");
        } catch (err) {
            console.error("[Fila] Falha ao criar conta Ethereal:", err);
            throw new Error("Não foi possível inicializar o serviço de e-mail (Sem credenciais e falha no fallback Ethereal)");
        }
    }

    // Verify connection
    try {
        await transporter.verify();
        console.log("[Fila] Conexão SMTP verificada com sucesso!");
    } catch (err) {
        console.error("[Fila] Erro na verificação SMTP:", err.message);
        transporter = null;
        throw err;
    }

    return transporter;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getSettings() {
    const res = await pool.query("SELECT * FROM settings WHERE id = 1");
    return res.rows[0];
}

async function getNextQueued() {
    const res = await pool.query(`
        SELECT b.*, u.name as "userName", u.email as "userEmail"
        FROM boletos b
        JOIN users u ON b."userId" = u.id
        WHERE b.status = 'QUEUED'
        ORDER BY b.id ASC
        LIMIT 1
    `);
    return res.rows[0];
}

async function updateBoletoStatus(id, status, errorMsg = null) {
    const res = await pool.query(
        "UPDATE boletos SET status = $1, error_message = $2, sent_at = (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') WHERE id = $3", 
        [status, errorMsg, id]
    );
    return res.rowCount;
}

async function processQueue() {
    if (isProcessing) return;
    isProcessing = true;

    console.log("[Fila] Verificando novos envios no Neon DB...");

    try {
        while (true) {
            let settings = await getSettings();
            let boleto = await getNextQueued();

            if (!boleto) {
                console.log("[Fila] Nenhum boleto na fila. Entrando em espera.");
                break;
            }

            currentBoletoProcessing = boleto;
            console.log(`[Fila] Processando Boleto ID ${boleto.id} para ${boleto.userName} (${boleto.userEmail})`);

            // Compile templates
            let subject = settings.subject.replace('{nome}', boleto.userName).replace('{bloco}', boleto.block).replace('{sala}', boleto.room);
            let body = settings.body.replace('{nome}', boleto.userName).replace('{bloco}', boleto.block).replace('{sala}', boleto.room);

            try {
                // Determine file path
                const attachmentPath = path.join(__dirname, '../uploads', boleto.filepath);

                console.log(`[Fila] Tentando enviar Boleto ID ${boleto.id} com transportador OK`);
                let mailer = await getTransporter(settings);

                // Fallback from address from transporter if env is missing
                const fromAddress = settings?.smtp_email || process.env.SMTP_FROM || (process.env.SMTP_USER && process.env.SMTP_USER !== 'apikey' ? process.env.SMTP_USER : null) || mailer.options.auth.user || 'no-reply@sistema.com';

                // Send email
                let info = await mailer.sendMail({
                    from: `"Office Center" <${fromAddress}>`,
                    to: boleto.userEmail,
                    subject: subject,
                    text: body,
                    attachments: [
                        {
                            filename: boleto.filename,
                            path: attachmentPath
                        }
                    ]
                });

                await updateBoletoStatus(boleto.id, 'SENT');
                console.log(`[Fila] Sucesso. Enviado para ${boleto.userEmail}.`);
                
                if (nodemailer.getTestMessageUrl(info)) {
                    console.log(`[Ethereal Fake Email URL]: ${nodemailer.getTestMessageUrl(info)}`);
                }

            } catch (err) {
                console.error(`[Fila] Erro ao enviar Boleto ID ${boleto.id}:`, err.message);
                await updateBoletoStatus(boleto.id, 'ERROR', err.message);
            }

            let nextCheck = await getNextQueued();
            if (nextCheck) {
                const waitTime = Math.floor(Math.random() * (60000 - 40000 + 1) + 40000);
                console.log(`[Fila] Aguardando ${waitTime / 1000} segundos até o próximo envio...`);
                await delay(waitTime);
            }
        }
    } catch (e) {
        console.error("[Fila] Falha crítica no processador:", e);
    } finally {
        isProcessing = false;
        currentBoletoProcessing = null;
    }
}

module.exports = {
    triggerQueue: () => {
        if (!isProcessing) processQueue();
    },
    forceReset: () => {
        isProcessing = false;
        transporter = null;
        console.log("[Fila] Reset forçado de memória efetuado.");
    },
    isRunning: () => isProcessing,
    getCurrentBoleto: () => currentBoletoProcessing
};
