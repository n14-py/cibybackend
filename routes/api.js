const express = require('express');
const router = express.Router();

const ChatController = require('../controllers/chatController');
const adminAuth = require('../middlewares/adminAuth');

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
 * @route POST /api/admin/login
 * @desc Autenticación básica para el panel de administración.
 * @body { "password": "..." }
 */
router.post('/admin/login', ChatController.loginAdmin);

/**
 * @route GET /api/admin/stats
 * @desc Obtiene todas las estadísticas (solo panel autenticado).
 */
router.get('/admin/stats', adminAuth, ChatController.obtenerTodasLasEstadisticasAdmin);

/**
 * @route GET /api/admin/chat/:chatId
 * @desc Historial de chat crudo (solo panel autenticado).
 */
router.get('/admin/chat/:chatId', adminAuth, ChatController.obtenerHistorialChat);

/**
 * @route PUT /api/admin/stats/:statId/estado
 * @desc Aprueba/rechaza un registro y permite notas del admin.
 */
router.put('/admin/stats/:statId/estado', adminAuth, ChatController.actualizarEstadoStat);

module.exports = router;