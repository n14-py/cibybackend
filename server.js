require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const connectDB = require('./config/db');

// 1. Inicializar Express y conectar a la BD
const app = express();
connectDB();

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
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // CRÍTICO: PUT añadido para actualizar estados en el admin
    credentials: true
}));

// Escudo Anti-DDoS y Anti-Spam: Limita cuántos mensajes puede mandar una misma IP
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minuto
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 20, // Máximo 20 peticiones por minuto por IP
    message: { error: 'Sistema de seguridad activado: Demasiadas peticiones. Por favor, espera un minuto.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Aplicamos el límite a todo lo que vaya a /api/
app.use('/api/', limiter); 

// Evita que manden textos gigantes para saturar la memoria RAM
app.use(express.json({ limit: '50kb' })); 
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

// ==========================================
// ⚡ INICIO DEL SERVIDOR ⚡
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🤖 Cybi Backend Activo`);
    console.log(`🛡️  Modo de Seguridad: MÁXIMO`);
    console.log(`📡 Escuchando en el puerto: ${PORT}`);
    console.log(`=========================================`);
});