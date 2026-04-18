const express = require('express');
const router = express.Router();
const pool = require('../database/index');

// List all users
router.get('/', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM users ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add single user
router.post('/', async (req, res) => {
    const { name, block, room, email } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO users (name, block, room, email) VALUES ($1, $2, $3, $4) RETURNING *",
            [name, block, room, email]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mass import users
router.post('/import', async (req, res) => {
    const users = req.body.users;
    if (!Array.isArray(users)) return res.status(400).json({ error: 'Array of users expected.' });

    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        for (let u of users) {
             await client.query(
                "INSERT INTO users (name, block, room, email) VALUES ($1, $2, $3, $4)",
                [u.name, u.block, u.room, u.email]
             );
        }
        await client.query("COMMIT");
        res.json({ message: `${users.length} users imported successfully.` });
    } catch (err) {
        await client.query("ROLLBACK");
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// Delete user
router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
        res.json({ deleted: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Clear all users
router.delete('/', async (req, res) => {
    try {
        const result = await pool.query("DELETE FROM users");
        res.json({ deleted: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
