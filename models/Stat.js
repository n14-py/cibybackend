const mongoose = require('mongoose');

const StatSchema = new mongoose.Schema({
    // Relación directa con el chat original para revisión en el panel Admin
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true,
        unique: true // Garantiza que solo exista una estadística por cada sesión de chat
    },
    
    // Datos de segmentación (Extraídos por la IA)
    colegio: {
        type: String,
        index: true,
        trim: true,
        default: null
    },
    ciudad: {
        type: String,
        index: true,
        trim: true,
        default: null
    },
    edad: {
        type: Number,
        default: null
    },
    curso: {
        type: String,
        trim: true,
        default: null
    },
    
    // Tipos de riesgos detectados en la conversación
    // Se quita el enum estricto para evitar bloqueos si la IA genera un nuevo término válido
    riesgosDetectados: [{
        type: String,
        trim: true
    }],
    
    // Nivel de severidad asignado por la IA (1 = Leve, 5 = Crítico)
    severidad: {
        type: Number,
        min: 1,
        max: 5,
        default: 1,
        index: true
    },
    
    // ==========================================
    //   SISTEMA DE MODERACIÓN Y ESTADOS (ADMIN)      
    // ==========================================
    estado: {
        type: String,
        enum: ['aprobado', 'pendiente', 'rechazado'],
        default: 'pendiente',
        index: true
    },
    
    // Por qué la IA lo mandó a pendiente (Ej: "El usuario dijo que su colegio es Hogwarts")
    motivoRevision: {
        type: String,
        default: ''
    },
    
    // Si el admin lo revisa y lo aprueba/rechaza, puede dejar una nota interna
    notasAdmin: {
        type: String,
        default: ''
    }
}, {
    timestamps: true, // Fecha de creación y última actualización
    versionKey: false
});

// ==========================================
//   OPTIMIZACIÓN DE RENDIMIENTO (ÍNDICES)      
// ==========================================

// Índice para listar rápido en el panel admin (ordenados por fecha y estado)
StatSchema.index({ estado: 1, createdAt: -1 });

// Índices para filtros rápidos de gráficos en el frontend admin
StatSchema.index({ ciudad: 1, estado: 1 });
StatSchema.index({ colegio: 1, estado: 1 });
StatSchema.index({ severidad: -1, estado: 1 });

module.exports = mongoose.model('Stat', StatSchema);