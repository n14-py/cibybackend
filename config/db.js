const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            // Connection pooling para no saturar el plan gratuito de MongoDB (M0)
            maxPoolSize: 10, // Mantiene hasta 10 conexiones abiertas y las recicla inteligentemente
            minPoolSize: 2,  // Siempre mantiene al menos 2 listas para responder rápido
            serverSelectionTimeoutMS: 5000, // Si Mongo tarda más de 5s, lanza error (no congela el server)
            socketTimeoutMS: 45000, // Cierra conexiones inactivas
        });

        console.log(`[BASE DE DATOS] MongoDB Conectado: ${conn.connection.host}`);
    } catch (error) {
        console.error(`[ERROR DB] Falló la conexión: ${error.message}`);
        process.exit(1); // Detiene el servidor si no hay base de datos, evitando comportamientos raros
    }
};

module.exports = connectDB;