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
        const { subject, body, smtp_email, smtp_password } = req.body;
        await pool.query(
            "UPDATE settings SET subject = $1, body = $2, smtp_email = $3, smtp_password = $4 WHERE id = 1",
            [subject, body, smtp_email, smtp_password]
        );
        res.json({ message: "Configurações salvas!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
