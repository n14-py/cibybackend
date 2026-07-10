const express = require('express');
const router = express.Router();

// Importamos nuestro poderoso controlador
const ChatController = require('../controllers/chatController');

// ==========================================
// 🚦 RUTAS PÚBLICAS (Frontend Cloudflare) 🚦
// ==========================================

/**
 * @route POST /api/chat
 * @desc Recibe un mensaje del usuario, consulta a DeepSeek-V3 y actualiza métricas.
 * @body { "sessionId": "12345", "mensaje": "Hola Cybi" }
 */
router.post('/chat', ChatController.procesarMensaje);


// ==========================================
// 🔐 RUTAS PRIVADAS (Panel de Administración) 🔐
// ==========================================

/**
 * @route GET /api/admin/stats
 * @desc Obtiene todas las estadísticas aprobadas para los gráficos.
 * TODO en el futuro: Añadir middleware de autenticación (JWT) para que solo tú puedas ver esto.
 */
router.get('/admin/stats', ChatController.obtenerEstadisticasAdmin);

module.exports = router;