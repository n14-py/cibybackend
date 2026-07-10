const Chat = require('../models/Chat');
const Stat = require('../models/Stat');
const AIService = require('../services/aiService');

class ChatController {
    
    /**
     * Procesa un nuevo mensaje del usuario, consulta a la IA y actualiza estadísticas.
     */
    static async procesarMensaje(req, res) {
        try {
            // 1. Extraemos los datos enviados por el frontend (Cloudflare)
            const { sessionId, mensaje } = req.body;

            // Validación básica de seguridad
            if (!sessionId || !mensaje || mensaje.trim() === '') {
                return res.status(400).json({ error: 'Faltan datos obligatorios (sessionId o mensaje).' });
            }

            // 2. Buscamos el historial de este alumno en la Base de Datos
            let chat = await Chat.findOne({ sessionId: sessionId });

            // Si es la primera vez que escribe, creamos el documento de Chat
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
            // DeepSeek necesita un formato específico: [{role: 'user', content: 'hola'}, ...]
            const historialParaIA = chat.messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            // 5. ¡Llamamos a DeepSeek-V3 (El Cerebro)!
            // Esto devuelve el JSON con la respuesta para el alumno y los datos extraídos
            const aiResponse = await AIService.getCybiResponse(historialParaIA);

            // 6. Añadimos la respuesta de Cybi al historial de la BD
            chat.messages.push({
                role: 'assistant',
                content: aiResponse.respuesta_cybi
            });

            // Si la IA detecta que la severidad es crítica (ej: nivel 5), marcamos la alerta roja en el chat
            if (aiResponse.analisis_interno && aiResponse.analisis_interno.severidad >= 4) {
                chat.alertaRoja = true;
            }

            // Guardamos el historial crudo en MongoDB
            await chat.save();

            // ==========================================
            // 🛡️ ACTUALIZACIÓN DEL SISTEMA DE ESTADÍSTICAS 🛡️
            // ==========================================
            
            // Evaluamos el sistema Anti-Trolls (Filtro de Bromas)
            // Si la IA dice que es broma, va a 'pendiente' para que el admin lo revise.
            // Si no es broma, se aprueba automáticamente para los gráficos.
            let estadoRegistro = 'aprobado';
            if (aiResponse.analisis_interno.es_broma === true) {
                estadoRegistro = 'pendiente';
            }

            // Buscamos si ya existe una estadística para este chat (para actualizarla)
            // o si es nueva (la creamos usando upsert: true)
            const datosRecolectados = aiResponse.datos_recolectados;
            
            await Stat.findOneAndUpdate(
                { chatId: chat._id }, // Buscar por el ID único del chat
                { 
                    chatId: chat._id,
                    // Solo actualizamos los datos si la IA logró extraerlos, si devuelve null, 
                    // dejamos que Mongo mantenga el valor por defecto ("No especificado")
                    ...(datosRecolectados.colegio && { colegio: datosRecolectados.colegio }),
                    ...(datosRecolectados.ciudad && { ciudad: datosRecolectados.ciudad }),
                    ...(datosRecolectados.edad && { edad: datosRecolectados.edad }),
                    ...(datosRecolectados.curso && { curso: datosRecolectados.curso }),
                    ...(datosRecolectados.riesgosDetectados && { riesgosDetectados: datosRecolectados.riesgosDetectados }),
                    
                    severidad: aiResponse.analisis_interno.severidad || 1,
                    estado: estadoRegistro,
                    motivoRevision: aiResponse.analisis_interno.motivo_broma || ''
                },
                { upsert: true, new: true, setDefaultsOnInsert: true } // Upsert hace la magia de Crear o Actualizar
            );

            // 7. Le respondemos al frontend (Cloudflare) súper rápido
            return res.status(200).json({
                respuesta: aiResponse.respuesta_cybi,
                // Opcional: Mandamos un flag al frontend si detectamos que es una broma 
                // por si quieres mostrar un emoji o algo en la UI, aunque suele ser mejor ocultarlo
                es_broma: aiResponse.analisis_interno.es_broma
            });

        } catch (error) {
            console.error('[ERROR EN CHAT CONTROLLER]:', error);
            // Nunca dejamos colgado al usuario. Si algo falla brutalmente, respondemos con el plan B.
            return res.status(500).json({ 
                respuesta: "¡Huy! Mis cables se enredaron un poco. ¿Podés intentar enviarme el mensaje de nuevo? 🤖" 
            });
        }
    }
    
    /**
     * (Opcional por ahora) - Endpoint para que el ADMIN obtenga los datos agrupados para los gráficos
     */
    static async obtenerEstadisticasAdmin(req, res) {
        try {
            // Solo trae los aprobados, ignorando las bromas
            const stats = await Stat.find({ estado: 'aprobado' });
            res.status(200).json(stats);
        } catch (error) {
            res.status(500).json({ error: 'Error al obtener estadísticas.' });
        }
    }
}

module.exports = ChatController;