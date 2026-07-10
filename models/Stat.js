const mongoose = require('mongoose');

const StatSchema = new mongoose.Schema({
    // Relación directa con el chat crudo (para que el admin pueda hacer clic en "Ver Chat Original")
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true
    },
    
    // Datos de segmentación (Extraídos por la IA)
    nombre: {
        type: String,
        index: true,
        trim: true,
        default: 'Anónimo'
    },
    colegio: {
        type: String,
        index: true,
        trim: true,
        default: 'No especificado'
    },
    ciudad: {
        type: String,
        index: true,
        trim: true,
        default: 'No especificado'
    },
    edad: {
        type: Number,
        min: [5, 'Edad mínima no válida'], // Rango ampliado, la IA se encarga de clasificar si es broma
        max: [99, 'Edad máxima fuera de rango'], 
        default: null
    },
    curso: {
        type: String,
        trim: true,
        default: 'No especificado'
    },
    // Tipos de riesgos detectados en la conversación
    riesgosDetectados: [{
        type: String,
        enum: ['ciberbullying', 'sexting', 'phishing', 'grooming', 'sextorsion', 'ninguno'],
    }],
    // Nivel de severidad asignado por la IA (1 = Leve, 5 = Crítico)
    severidad: {
        type: Number,
        min: 1,
        max: 5,
        default: 1
    },
    // ==========================================
    //   SISTEMA DE MODERACIÓN ANTI-TROLLS      
    // ==========================================
    estado: {
        type: String,
        enum: ['aprobado', 'pendiente', 'rechazado'],
        // Si la IA confía en los datos, los aprueba. Si detecta sarcasmo o broma, los manda a 'pendiente'
        default: 'pendiente',
        index: true
    },
    
    // Por qué la IA lo mandó a pendiente (Ej: "El usuario dijo que su colegio es Hogwarts")
    motivoRevision: {
        type: String,
        default: ''
    },
    // Si el admin lo revisa y lo aprueba/rechaza, puede dejar una nota
    notasAdmin: {
        type: String,
        default: ''
    }
}, {
    timestamps: true, // Fecha en que se recolectó el dato
    versionKey: false
});

// Índice compuesto para que los gráficos del Admin actualicen rapidísimo 
// al filtrar por Ciudad + Estado Aprobado
StatSchema.index({ ciudad: 1, estado: 1 });
StatSchema.index({ colegio: 1, estado: 1 });

module.exports = mongoose.model('Stat', StatSchema);