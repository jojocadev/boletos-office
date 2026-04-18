const express = require('express');
const router = express.Router();
const pool = require('../database/index');
const queueService = require('../services/mailQueue');

router.post('/start', async (req, res) => {
    try {
        const result = await pool.query("UPDATE boletos SET status = 'QUEUED' WHERE status IN ('LINKED', 'ERROR')");
        queueService.triggerQueue();
        res.json({ message: `${result.rowCount} boletos foram colocados na fila para envio.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/reset', (req, res) => {
    queueService.forceReset();
    res.json({ message: "Memória da fila resetada." });
});

router.get('/status', async (req, res) => {
    try {
        const isRunning = queueService.isRunning();
        const result = await pool.query(`
            SELECT 
                COUNT(*)::int as total,
                SUM(CASE WHEN b.status = 'QUEUED' THEN 1 ELSE 0 END)::int as queued,
                SUM(CASE WHEN b.status = 'SENT' THEN 1 ELSE 0 END)::int as sent,
                SUM(CASE WHEN b.status = 'ERROR' THEN 1 ELSE 0 END)::int as error,
                SUM(CASE WHEN b.status = 'UNLINKED' THEN 1 ELSE 0 END)::int as unlinked,
                SUM(CASE WHEN b.status = 'LINKED' THEN 1 ELSE 0 END)::int as linked
            FROM boletos b
        `);
        
        res.json({ 
            isRunning,
            stats: result.rows[0],
            currentProcessing: queueService.getCurrentBoleto()
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
