const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const pool = require('../database/index');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

function extractBlockAndRoom(text) {
    let block = null;
    let room = null;
    let rawUnit = null;

    // Search for "Referente a/à Unidade: C-6" or "Unidade: C-6"
    const unitMatch = text.match(/Unidade[:\s]*([A-Z0-9-]+)/i);
    // Search for "C-6 - OFFYCE" (like in pagador box)
    const pagadorMatch = text.match(/([A-Z0-9]+-[A-Z0-9]+)\s*-\s*OFFYCE/i);

    if (unitMatch) {
        rawUnit = unitMatch[1];
    } else if (pagadorMatch) {
        rawUnit = pagadorMatch[1];
    }

    if (rawUnit) {
        const parts = rawUnit.split('-');
        if (parts.length === 2 && isNaN(parseInt(parts[0]))) {
            // e.g. "C-6"
            block = parts[0].toUpperCase();
            room = parts[1];
        } else {
            room = rawUnit;
        }
    } else {
        // Fallback for older formats
        const blockMatch = text.match(/bloco[\s_.-]*([a-zA-Z0-9]+)/i);
        const roomMatch = text.match(/sala[\s_.-]*(\d+)/i) || text.match(/apto[\s_.-]*(\d+)/i) || text.match(/apartamento[\s_.-]*(\d+)/i);
        if (blockMatch) block = blockMatch[1].toUpperCase();
        if (roomMatch) room = roomMatch[1];
    }

    return { block, room, rawUnit };
}

router.post('/upload', upload.array('boletos', 100), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    try {
        const results = [];
        for (const file of req.files) {
            let extracted = extractBlockAndRoom(file.originalname);
            
            if (!extracted.block || !extracted.room) {
                try {
                    const dataBuffer = fs.readFileSync(file.path);
                    const parsed = await pdfParse(dataBuffer);
                    const textEx = extractBlockAndRoom(parsed.text);
                    if (!extracted.block) extracted.block = textEx.block;
                    if (!extracted.room) extracted.room = textEx.room;
                    if (!extracted.rawUnit) extracted.rawUnit = textEx.rawUnit;
                } catch (err) {
                    console.error("Erro ao ler PDF:", err);
                }
            }
            results.push({
                filename: file.originalname,
                filepath: file.filename,
                block: extracted.block,
                room: extracted.room,
                rawUnit: extracted.rawUnit
            });
        }

        const client = await pool.connect();
        try {
            const usersRes = await client.query("SELECT id, block, room FROM users");
            const users = usersRes.rows;
            
            await client.query("BEGIN");
            
            for (let item of results) {
                let matchedUser = users.find(u => {
                    function norm(val) {
                        if (!val) return '';
                        let s = val.toString().trim().toUpperCase();
                        if (/^0+\d+$/.test(s)) {
                            // strip leading zeros if it's numeric like 06 -> 6
                            return parseInt(s, 10).toString();
                        }
                        return s;
                    }

                    const uBlock = norm(u.block);
                    const iBlock = norm(item.block);
                    const uRoom = norm(u.room);
                    const iRoom = norm(item.room);
                    const rawUnit = norm(item.rawUnit);

                    // Match Bloco e Sala (e.g. C and 6 ou C and 06)
                    if (uBlock && iBlock && uBlock === iBlock && uRoom && iRoom && uRoom === iRoom) {
                        return true;
                    }
                    
                    // Match apenas sala se o locatário se cadastrou apenas como sala "C-6" e sem bloco
                    // Aqui transformamos a sala do usuario tbm em uppercase e removemos 0s
                    // Mas para string com letras como "C-06" precisaria tirar zero, faremos o replace básico
                    const rawUnitClean = rawUnit.replace(/-0+/, '-'); // C-06 -> C-6
                    const uRoomClean = uRoom.replace(/-0+/, '-');
                    
                    if (rawUnitClean && uRoomClean && uRoomClean === rawUnitClean) {
                        return true;
                    }
                    
                    return false;
                });
                
                let userId = matchedUser ? matchedUser.id : null;
                let status = matchedUser ? 'LINKED' : 'UNLINKED';
                
                await client.query(
                    'INSERT INTO boletos (filename, filepath, block, room, "userId", status) VALUES ($1, $2, $3, $4, $5, $6)',
                    [item.filename, item.filepath, item.block, item.room, userId, status]
                );
                
                item.userId = userId;
                item.status = status;
            }
            
            await client.query("COMMIT");
            res.json({ message: `${results.length} boletos processados.`, results });
        } catch (err) {
            await client.query("ROLLBACK");
            res.status(500).json({ error: err.message });
        } finally {
            client.release();
        }

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT b.*, u.name as "userName", u.email as "userEmail" 
            FROM boletos b
            LEFT JOIN users u ON b."userId" = u.id
            ORDER BY b.id DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id/link', async (req, res) => {
    try {
        const { userId } = req.body;
        await pool.query('UPDATE boletos SET "userId" = $1, status = \'LINKED\' WHERE id = $2', [userId, req.params.id]);
        res.json({ message: 'Vinculado com sucesso' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/', async (req, res) => {
    try {
        const result = await pool.query("DELETE FROM boletos");
        res.json({ deleted: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
