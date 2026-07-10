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
 * @route POST /api/admin/login
 * @desc Autenticación básica para el panel de administración.
 * @body { "password": "..." }
 */
router.post('/admin/login', ChatController.loginAdmin);

/**
 * @route GET /api/admin/stats
 * @desc Obtiene todas las estadísticas de la base de datos (aprobadas, pendientes, rechazadas) para el panel.
 */
router.get('/admin/stats', ChatController.obtenerTodasLasEstadisticasAdmin);

/**
 * @route GET /api/admin/chat/:chatId
 * @desc Obtiene el historial de chat crudo y completo de un alumno para revisión humana.
 */
router.get('/admin/chat/:chatId', ChatController.obtenerHistorialChat);

/**
 * @route PUT /api/admin/stats/:statId/estado
 * @desc Actualiza el estado de una estadística (aprobar/rechazar) y permite añadir notas del admin.
 * @body { "estado": "aprobado", "notasAdmin": "Revisado, todo correcto" }
 */
router.put('/admin/stats/:statId/estado', ChatController.actualizarEstadoStat);

module.exports = router;