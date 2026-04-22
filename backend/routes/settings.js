const express = require('express');
const router = express.Router();
const pool = require('../database/index');

router.get('/', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM settings WHERE id = 1");
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/', async (req, res) => {
    try {
        const { subject, body, smtp_email, smtp_password, smtp_host, smtp_port } = req.body;
        await pool.query(
            "UPDATE settings SET subject = $1, body = $2, smtp_email = $3, smtp_password = $4, smtp_host = $5, smtp_port = $6 WHERE id = 1",
            [subject, body, smtp_email, smtp_password, smtp_host, smtp_port]
        );
        res.json({ message: "Configurações salvas!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
