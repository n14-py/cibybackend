const mongoose = require('mongoose');

// Esquema para los mensajes individuales dentro de la conversación
const MessageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        required: true
    },
    content: {
        type: String,
        required: true,
        // Límite de seguridad para evitar saturación de la base de datos
        maxlength: [2000, 'El mensaje es demasiado largo.']
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { _id: false }); // Optimizamos evitando crear un ObjectId para cada mensaje individual

// Esquema principal del historial de Chat
const ChatSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true, // Garantiza integridad: una sesión = un solo documento de chat
        index: true
    },
    
    // Array que contiene toda la conversación secuencial
    messages: [MessageSchema],
    
    // Bandera de seguridad de alta prioridad (Visible en el Panel Admin)
    alertaRoja: {
        type: Boolean,
        default: false,
        index: true // Indexado para filtrar rápidamente casos críticos en el dashboard
    },
    
    // Metadatos técnicos de origen (Oculto por defecto por privacidad)
    ipHash: {
        type: String,
        select: false 
    }
}, {
    timestamps: true, // Crea automáticamente createdAt y updatedAt
    versionKey: false
});

// ==========================================
//   OPTIMIZACIÓN DE RENDIMIENTO (ÍNDICES)      
// ==========================================

// Índice para listar el historial cronológico rápidamente en el panel de administración
ChatSchema.index({ createdAt: -1 });

// Índice compuesto para buscar alertas rojas recientes
ChatSchema.index({ alertaRoja: 1, createdAt: -1 });

module.exports = mongoose.model('Chat', ChatSchema);