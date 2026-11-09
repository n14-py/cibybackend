require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { jsonBody } = require('./middlewares/jsonBody');

// 1. Inicializar Express y conectar a la BD
const app = express();
connectDB();

// Render (y cualquier reverse proxy) manda X-Forwarded-For.
// Sin esto, express-rate-limit v7 tira ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
app.set('trust proxy', 1);

if (!process.env.DEEPINFRA_API_KEY) {
    console.error('[CONFIG] Falta DEEPINFRA_API_KEY. Cybi va a caer al Plan B en cada chat.');
}

// ==========================================
// 🛡️ MIDDLEWARES DE SEGURIDAD EXTREMA 🛡️
// ==========================================

// Oculta cabeceras de Express y añade protecciones HTTP contra vulnerabilidades conocidas
app.use(helmet()); 

// Previene inyecciones NoSQL (ej. un atacante intentando mandar {"$gt": ""} en el chat)
app.use(mongoSanitize()); 

// Configuración estricta de CORS: Ajustado para permitir las peticiones del Panel Admin (PUT)
app.use(cors({
    origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// El chat público sigue corto: es la puerta que usa cada alumno.
const limiterPublico = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 20,
    message: { error: 'Sistema de seguridad activado: Demasiadas peticiones. Por favor, espera un minuto.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS',
});

// Exportar el PDF pide una conversación por expediente, además del POST del resumen.
// El tope de 20 por minuto cortaba esas lecturas y el documento salía sin transcripciones.
const limiterAdmin = rateLimit({
    windowMs: 60000,
    max: parseInt(process.env.ADMIN_RATE_LIMIT_MAX, 10) || 2000,
    message: { error: 'Demasiadas consultas del panel. Esperá un momento y volvé a exportar.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS',
});

const limiterLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Demasiados intentos de acceso. Esperá unos minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS',
});

// Una exportación pide la síntesis una sola vez. Este tope evita disparar el modelo en ráfaga.
const limiterInforme = rateLimit({
    windowMs: 60000,
    max: 10,
    message: { error: 'Demasiadas síntesis seguidas. Esperá un minuto y volvé a exportar.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS',
});

app.use('/api/admin/login', limiterLogin);
app.use('/api/admin/informe/resumen', limiterInforme);
app.use('/api/admin', limiterAdmin);
app.use('/api/chat', limiterPublico);

// El POST del informe no se lee acá: la ruta lo acepta hasta 2mb, después de chequear el token.
// El resto de la API sigue en 50kb.
app.use(jsonBody);
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// Logger para ver qué está pasando en la consola de Render
app.use(morgan('dev')); 

// ==========================================
// 🚀 RUTAS DEL SISTEMA 🚀
// ==========================================

// Ruta de Salud
app.get('/', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        sistema: 'Cybi Core', 
        mensaje: 'Servidor blindado y funcionando correctamente.' 
    });
});

// Importar y usar las rutas de la API
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Manejo de rutas que no existen (para evitar errores de enrutamiento)
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada o acceso denegado.' });
});

app.use((err, req, res, next) => {
    console.error('[ERROR EXPRESS]:', err.message);
    if (res.headersSent) return next(err);
    if (err.type === 'entity.too.large' || err.status === 413) {
        return res.status(413).json({ error: 'El informe es demasiado grande para sintetizarlo de una vez.' });
    }
    res.status(err.status || 500).json({ error: 'Error interno del servidor.' });
});

// ==========================================
// ⚡ INICIO DEL SERVIDOR ⚡
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`=========================================`);
    console.log(`🤖 Cybi Backend Activo`);
    console.log(`🛡️  Modo de Seguridad: MÁXIMO`);
    console.log(`📡 Escuchando en 0.0.0.0:${PORT}`);
    console.log(`=========================================`);
});