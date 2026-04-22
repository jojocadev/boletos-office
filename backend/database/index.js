const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_ebCXvMdz7Ep6@ep-round-star-ac1ty6zv-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({
  connectionString,
});

const initDb = async () => {
    try {
        // Users Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                block TEXT NOT NULL,
                room TEXT NOT NULL,
                email TEXT NOT NULL
            )
        `);

        // Boletos Table - Using quotes for "userId" to keep camelCase or just lowercase it
        // Note: It's better to use lowercase in postgres but for compatibility we will quote it
        await pool.query(`
            CREATE TABLE IF NOT EXISTS boletos (
                id SERIAL PRIMARY KEY,
                filename TEXT NOT NULL,
                filepath TEXT NOT NULL,
                block TEXT,
                room TEXT,
                "userId" INTEGER,
                status TEXT DEFAULT 'IMPORTED',
                error_message TEXT,
                sent_at TIMESTAMP,
                FOREIGN KEY ("userId") REFERENCES users (id) ON DELETE SET NULL
            )
        `);

        // Settings Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                subject TEXT,
                body TEXT,
                smtp_email TEXT,
                smtp_password TEXT
            )
        `);

        try {
            await pool.query("ALTER TABLE settings ADD COLUMN IF NOT EXISTS smtp_email TEXT");
            await pool.query("ALTER TABLE settings ADD COLUMN IF NOT EXISTS smtp_password TEXT");
            await pool.query("ALTER TABLE settings ADD COLUMN IF NOT EXISTS smtp_host TEXT");
            await pool.query("ALTER TABLE settings ADD COLUMN IF NOT EXISTS smtp_port TEXT");
        } catch (e) {
            console.error("Migração opcional falhou:", e);
        }
        
        // Ensure settings
        const res = await pool.query("SELECT id FROM settings WHERE id = 1");
        if (res.rows.length === 0) {
            await pool.query("INSERT INTO settings (id, subject, body) VALUES (1, 'Seu Boleto Chegou', 'Olá {nome},\n\nSegue em anexo o seu boleto referente ao bloco {bloco} e sala {sala}.')");
        }
        
        console.log("Database tables initialized successfully via Postgres/Neon.");
    } catch (err) {
        console.error("Database Connection/Init Error:", err);
    }
};

initDb();

module.exports = pool;
