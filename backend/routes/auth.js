const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
    const { password } = req.body;
    const adminPass = process.env.ADMIN_PASSWORD || 'office2020';

    if (password === adminPass) {
        res.json({ success: true, message: 'Autenticado' });
    } else {
        res.status(401).json({ success: false, error: 'Senha incorreta.' });
    }
});

module.exports = router;
