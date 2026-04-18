const nodemailer = require('nodemailer');
require('dotenv').config();

async function runTest() {
    console.log("=== DIAGNÓSTICO DE E-MAIL ===");
    const user = (process.env.SMTP_USER || '').trim();
    const pass = (process.env.SMTP_PASS || '').trim();

    let transporter;

    if (user && pass) {
        console.log(`Tentando SMTP Real: ${user}`);
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            auth: { user, pass }
        });
    } else {
        console.log("Tentando Fallback Ethereal...");
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
        console.log("Conta Ethereal Criada:", testAccount.user);
    }

    try {
        await transporter.verify();
        console.log("✅ Conexão SMTP OK!");

        let info = await transporter.sendMail({
            from: '"Teste" <test@example.com>',
            to: "test@example.com",
            subject: "Teste de Diagnóstico",
            text: "Se você está vendo isso, o motor de envio funciona."
        });

        console.log("✅ E-mail enviado!");
        if (nodemailer.getTestMessageUrl(info)) {
            console.log("🔗 Ver e-mail em:", nodemailer.getTestMessageUrl(info));
        }
    } catch (err) {
        console.error("❌ ERRO NO TESTE:", err.message);
    }
}

runTest();
