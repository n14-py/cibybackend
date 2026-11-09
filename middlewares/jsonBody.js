const express = require('express');

// El PDF manda indicadores, distribución y las transcripciones.
// El resto de la API sigue con un tope chico para que un POST de chat no pueda inflar la memoria.
const RUTA_INFORME = '/api/admin/informe/resumen';
const jsonChico = express.json({ limit: '50kb' });
const jsonInforme = express.json({ limit: '2mb' });

function rutaPedido(req) {
    return String(req.originalUrl || req.url || '').split('?')[0];
}

function esCuerpoDeInforme(req) {
    return req.method === 'POST' && rutaPedido(req) === RUTA_INFORME;
}

function jsonBody(req, res, next) {
    if (esCuerpoDeInforme(req)) return next();
    return jsonChico(req, res, next);
}

module.exports = {
    jsonBody,
    jsonInforme,
    esCuerpoDeInforme,
    RUTA_INFORME
};
