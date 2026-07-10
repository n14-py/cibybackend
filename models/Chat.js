const mongoose = require('mongoose');

// Esquema para los mensajes individuales dentro de un chat
const MessageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        required: true
    },
    content: {
        type: String,
        required: true,
        // Evitamos que un mensaje super largo sature la base de datos
        maxlength: [2000, 'El mensaje es demasiado largo.']
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { _id: false }); // No necesitamos un ID único para cada mensajito, solo para el chat completo

// Esquema principal del Chat
const ChatSchema = new mongoose.Schema({
    // Usaremos un identificador de sesión único (puede ser un token del frontend)
    // para agrupar los mensajes de un mismo alumno sin pedirle nombre real (Ley de Protección de Datos)
    sessionId: {
        type: String,
        required: true,
        index: true // Indexado para búsquedas súper rápidas
    },
    // Array que contiene toda la conversación
    messages: [MessageSchema],
    
    // Bandera de seguridad: si la IA detecta algo CRÍTICO (amenazas de muerte, ideación suicida)
    alertaRoja: {
        type: Boolean,
        default: false
    },
    
    // Metadatos técnicos
    ipHash: {
        type: String,
        select: false // No se devuelve en las consultas normales por privacidad
    }
}, {
    timestamps: true, // Crea automáticamente createdAt y updatedAt
    versionKey: false
});

module.exports = mongoose.model('Chat', ChatSchema);