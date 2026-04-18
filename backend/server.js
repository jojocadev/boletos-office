const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
const usersRouter = require('./routes/users');
const boletosRouter = require('./routes/boletos');
const settingsRouter = require('./routes/settings');
const senderRouter = require('./routes/sender');
const authRouter = require('./routes/auth');

// Static folder for uploaded boletos
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

app.use('/api/users', usersRouter);
app.use('/api/boletos', boletosRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/sender', senderRouter);
app.use('/api/auth', authRouter);

// Start Queue Service
require('./services/mailQueue');

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Backend server rodando na porta ${PORT}`);
});
