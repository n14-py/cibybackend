const assert = require('assert');
const AIService = require('../services/aiService');
const SYSTEM_PROMPT = AIService.SYSTEM_PROMPT;

function testPromptDejaDeSerSoloEstadistica() {
    assert.ok(!/NUNCA ofrezcas soluciones directas/i.test(SYSTEM_PROMPT),
        'El prompt ya no debe prohibir ofrecer ayuda concreta.');
    assert.ok(!/no digas "llama a este número"/i.test(SYSTEM_PROMPT),
        'El prompt ya no debe prohibir derivar a un número.');
    assert.ok(!/Tu ÚNICO objetivo es recolectar información/i.test(SYSTEM_PROMPT),
        'Cybi ya no debe tener como único objetivo recolectar datos.');
}

function testPromptAcompaniaYDeriva() {
    assert.ok(SYSTEM_PROMPT.includes('155'), 'Debe derivar a la línea 155.');
    assert.ok(/centro de salud/i.test(SYSTEM_PROMPT), 'Debe mencionar centros de salud.');
    assert.ok(/se entiende que te sientas/i.test(SYSTEM_PROMPT), 'Debe validar emociones.');
    assert.ok(/NUNCA cortes la conversación/i.test(SYSTEM_PROMPT), 'No debe cortar la charla en seco.');
    assert.ok(/NO ES UN INTERROGATORIO/i.test(SYSTEM_PROMPT), 'No debe interrogar.');
    assert.ok(/no quieras hablar/i.test(SYSTEM_PROMPT), 'Debe respetar si no quieren contar el caso, sin desconectarse.');
}

function testNormalizarRespuestaCompletaCamposNuevos() {
    const normalizada = AIService.normalizarRespuesta({
        respuesta_cybi: 'Hola',
        datos_recolectados: { colegio: 'Nacional' },
        analisis_interno: { es_broma: false, severidad: 2 }
    });

    assert.strictEqual(normalizada.datos_recolectados.colegio, 'Nacional');
    assert.deepStrictEqual(normalizada.datos_recolectados.senalesEmocionales, []);
    assert.strictEqual(normalizada.datos_recolectados.esVictimaAcoso, null);
    assert.strictEqual(normalizada.datos_recolectados.derivacionRealizada, false);
}

function testFallbackNoCierraEnSecoYDeriva() {
    const fallback = AIService.generateFallbackResponse();
    assert.ok(fallback.respuesta_cybi.includes('155'));
    assert.ok(/centro de salud/i.test(fallback.respuesta_cybi));
    assert.ok(!/Gracias por comentarme/i.test(fallback.respuesta_cybi));
    assert.strictEqual(fallback.datos_recolectados.derivacionRealizada, true);
}

testPromptDejaDeSerSoloEstadistica();
testPromptAcompaniaYDeriva();
testNormalizarRespuestaCompletaCamposNuevos();
testFallbackNoCierraEnSecoYDeriva();

console.log('OK: Cybi ahora acompaña, valida y deriva sin interrogar.');
