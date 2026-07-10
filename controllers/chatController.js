const Chat = require('../models/Chat');
const Stat = require('../models/Stat');
const AIService = require('../services/aiService');

class ChatController {
    
    // ==========================================
    //   CORE CHATBOT (INTERACCIÓN CON ALUMNOS)
    // ==========================================

    /**
     * Procesa un nuevo mensaje del usuario, consulta a la IA y actualiza estadísticas.
     */
    static async procesarMensaje(req, res) {
        try {
            // 1. Extraemos los datos enviados por el frontend
            const { sessionId, mensaje } = req.body;

            if (!sessionId || !mensaje || mensaje.trim() === '') {
                return res.status(400).json({ error: 'Faltan datos obligatorios (sessionId o mensaje).' });
            }

            // 2. Buscamos el historial de este alumno en la Base de Datos
            let chat = await Chat.findOne({ sessionId: sessionId });
            if (!chat) {
                chat = new Chat({
                    sessionId: sessionId,
                    messages: []
                });
            }

            // 3. Añadimos el mensaje actual del alumno al historial
            chat.messages.push({
                role: 'user',
                content: mensaje
            });

            // 4. Preparamos el historial para mandarlo a la IA
            const historialParaIA = chat.messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            // 5. Llamamos a DeepSeek-V3
            const aiResponse = await AIService.getCybiResponse(historialParaIA);

            // 6. Añadimos la respuesta de Cybi al historial de la BD
            chat.messages.push({
                role: 'assistant',
                content: aiResponse.respuesta_cybi
            });

            // Si la IA detecta que la severidad es crítica, marcamos la alerta roja en el chat
            if (aiResponse.analisis_interno && aiResponse.analisis_interno.severidad >= 4) {
                chat.alertaRoja = true;
            }

            await chat.save();

            // ==========================================
            //   ACTUALIZACIÓN DEL SISTEMA DE ESTADÍSTICAS 
            // ==========================================
            
            // Evaluamos el sistema Anti-Trolls (Filtro de Bromas)
            let estadoRegistro = 'aprobado';
            if (aiResponse.analisis_interno.es_broma === true) {
                estadoRegistro = 'pendiente';
            }

            const datosRecolectados = aiResponse.datos_recolectados;
            
            await Stat.findOneAndUpdate(
                { chatId: chat._id }, 
                { 
                    chatId: chat._id,
                    ...(datosRecolectados.colegio && { colegio: datosRecolectados.colegio }),
                    ...(datosRecolectados.ciudad && { ciudad: datosRecolectados.ciudad }),
                    ...(datosRecolectados.edad && { edad: datosRecolectados.edad }),
                    ...(datosRecolectados.curso && { curso: datosRecolectados.curso }),
                    ...(datosRecolectados.riesgosDetectados && { riesgosDetectados: datosRecolectados.riesgosDetectados }),
                    
                    severidad: aiResponse.analisis_interno.severidad || 1,
                    estado: estadoRegistro,
                    motivoRevision: aiResponse.analisis_interno.motivo_broma || ''
                },
                { upsert: true, new: true, setDefaultsOnInsert: true } 
            );

            // 7. Le respondemos al frontend
            return res.status(200).json({
                respuesta: aiResponse.respuesta_cybi,
                es_broma: aiResponse.analisis_interno.es_broma
            });

        } catch (error) {
            console.error('[ERROR EN CHAT CONTROLLER]:', error);
            return res.status(500).json({ 
                respuesta: "¡Huy! Mis cables se enredaron un poco. ¿Podrías intentar enviarme el mensaje de nuevo?" 
            });
        }
    }

    // ==========================================
    //   FUNCIONES DEL PANEL DE ADMINISTRACIÓN
    // ==========================================

    /**
     * Endpoint de autenticación simple para el panel admin
     */
    static async loginAdmin(req, res) {
        try {
            const { password } = req.body;
            // Definimos la contraseña directamente o a través del .env
            const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'cybi2026admin';
            
            if (password === ADMIN_PASSWORD) {
                // Token básico de autorización para que el frontend pueda navegar
                res.status(200).json({ success: true, token: 'cybi-admin-auth-token-xyz' });
            } else {
                res.status(401).json({ success: false, error: 'Contraseña incorrecta' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Error en el proceso de login' });
        }
    }

    /**
     * Obtiene todas las estadísticas de la BD (Aprobadas, Pendientes, Rechazadas)
     */
    static async obtenerTodasLasEstadisticasAdmin(req, res) {
        try {
            // Se ordenan por las más recientes primero
            const stats = await Stat.find().sort({ createdAt: -1 });
            res.status(200).json(stats);
        } catch (error) {
            console.error('[ERROR OBTENIENDO STATS]:', error);
            res.status(500).json({ error: 'Error al obtener estadísticas.' });
        }
    }

    /**
     * Permite al admin obtener el historial de chat crudo y completo de un alumno para revisión
     */
    static async obtenerHistorialChat(req, res) {
        try {
            const { chatId } = req.params;
            const chat = await Chat.findById(chatId);
            
            if (!chat) {
                return res.status(404).json({ error: 'Historial de chat no encontrado.' });
            }

            res.status(200).json({
                sessionId: chat.sessionId,
                alertaRoja: chat.alertaRoja,
                messages: chat.messages,
                createdAt: chat.createdAt
            });
        } catch (error) {
            console.error('[ERROR OBTENIENDO CHAT]:', error);
            res.status(500).json({ error: 'Error al obtener el historial de chat.' });
        }
    }

    /**
     * Permite al admin cambiar el estado (aprobar/rechazar) de una estadística en estado pendiente
     */
    static async actualizarEstadoStat(req, res) {
        try {
            const { statId } = req.params;
            const { estado, notasAdmin } = req.body;

            // Validar que el estado sea uno de los permitidos por el modelo
            if (!['aprobado', 'pendiente', 'rechazado'].includes(estado)) {
                return res.status(400).json({ error: 'Estado no válido.' });
            }

            const actualizacion = { estado: estado };
            if (notasAdmin !== undefined) {
                actualizacion.notasAdmin = notasAdmin;
            }

            const statActualizado = await Stat.findByIdAndUpdate(
                statId,
                actualizacion,
                { new: true } // Para que devuelva el documento actualizado
            );

            if (!statActualizado) {
                return res.status(404).json({ error: 'Estadística no encontrada.' });
            }

            res.status(200).json(statActualizado);
        } catch (error) {
            console.error('[ERROR ACTUALIZANDO ESTADO]:', error);
            res.status(500).json({ error: 'Error al actualizar el estado de la estadística.' });
        }
    }
}

module.exports = ChatController;