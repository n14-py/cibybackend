const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Configuración estricta para evitar consultas con campos no definidos en los schemas
        mongoose.set('strictQuery', true);

        // Conexión principal con optimización de recursos
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            maxPoolSize: 10, 
            minPoolSize: 2,  
            serverSelectionTimeoutMS: 5000, 
            socketTimeoutMS: 45000, 
        });

        console.log(`[BASE DE DATOS] MongoDB Conectado: ${conn.connection.host}`);

        // ==========================================
        //   MONITOREO DE CONEXIÓN EN TIEMPO REAL      
        // ==========================================
        
        mongoose.connection.on('error', (err) => {
            console.error(`[ERROR MONGODB RUTINA]: ${err.message}`);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('[ALERTA MONGODB]: La conexión con la base de datos se ha perdido. Intentando reconectar...');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('[ÉXITO MONGODB]: Conexión con la base de datos restaurada.');
        });

    } catch (error) {
        console.error(`[FALLO CRÍTICO DB] No se pudo inicializar la conexión: ${error.message}`);
        process.exit(1); 
    }
};

module.exports = connectDB;