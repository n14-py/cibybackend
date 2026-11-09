const assert = require('assert');
const fs = require('fs');
const path = require('path');
const express = require('express');
const InformeService = require('../services/informeService');
const InformeController = require('../controllers/informeController');
const adminAuth = require('../middlewares/adminAuth');
const { esCuerpoDeInforme, jsonBody } = require('../middlewares/jsonBody');
const api = require('../routes/api');

const payload = {
    codigo: 'CYBI-INF-20261109-120000',
    fechaEnLetras: 'A los nueve (9) días del mes de noviembre del año dos mil veintiséis (2026).',
    filtros: { desde: '2026-11-01', hasta: '2026-11-09', estado: 'all' },
    indicadores: {
        total: 4,
        validos: 3,
        pendientes: 1,
        aprobados: 2,
        rechazados: 1,
        incidencias: 2,
        alertas: 1,
        criticos: 1,
        victimas: 1,
        derivaciones: 0,
        edadPromedio: 15.5,
        edadesEnPromedio: 2,
        edadesFueraDeRango: 0,
        edadesSinDato: 1,
        severidadPromedio: 2.5,
        alertasSinDerivacion: 1,
        conversacionesAsociadas: 4,
        conversacionesRecuperadas: 3,
        conversacionesNoDisponibles: 1,
        expedientesSinConversacion: 0,
        mensajesTranscriptos: 12,
        mensajesSistemaOmitidos: 2
    },
    distribucion: {
        riesgos: [{ etiqueta: 'Ciberbullying', cantidad: 2 }, { etiqueta: 'Grooming', cantidad: 1 }],
        ciudades: [{ etiqueta: 'Asunción', cantidad: 2 }],
        colegios: [],
        senales: [{ etiqueta: 'Ansiedad', cantidad: 2 }]
    },
    expedientes: []
};

function testSintesisUsaLosConteosReales() {
    const salida = InformeService.sintesisDesdeRegistros(payload);
    assert.ok(salida.resumen.includes('CYBI-INF-20261109-120000'));
    assert.ok(salida.resumen.includes('1 de noviembre de 2026'));
    assert.ok(salida.resumen.includes('9 de noviembre de 2026'));
    assert.ok(salida.resumen.includes('Ciberbullying'));
    assert.ok(salida.resumen.includes('Asunción'));
    assert.ok(salida.resumen.includes('Ansiedad'));
    assert.ok(salida.resumen.includes('15,5'));
    assert.ok(!salida.resumen.includes('Hogwarts'));
    assert.ok(salida.recomendaciones.some((item) => item.includes('155')));
    assert.ok(salida.recomendaciones.some((item) => /severidad 5/i.test(item)));
    assert.ok(salida.recomendaciones.some((item) => /conversaciones que no se pudieron leer/i.test(item)));
}

function testSintesisVaciaNoInventa() {
    const salida = InformeService.sintesisDesdeRegistros({
        indicadores: { total: 0 },
        distribucion: { ciudades: [{ etiqueta: 'Asunción', cantidad: 3 }] },
        expedientes: []
    });
    assert.ok(/no devolvió entrevistas/i.test(salida.resumen));
    assert.ok(!salida.resumen.includes('Asunción'));
    assert.strictEqual(salida.recomendaciones.length, 1);
}

function testNormalizarSintesis() {
    const conCercas = InformeService.normalizarSintesis('```json\n{"resumen":"  Texto del modelo  ","recomendaciones":[" Revisar ", {"texto":"Llamar al 155"}, ""]}\n```');
    assert.strictEqual(conCercas.resumen, 'Texto del modelo');
    assert.deepStrictEqual(conCercas.recomendaciones, ['Revisar', 'Llamar al 155']);

    const parrafos = InformeService.normalizarSintesis({ resumen: ['Uno', 'Dos'], recomendaciones: 'Una sola' });
    assert.strictEqual(parrafos.resumen, 'Uno\n\nDos');
    assert.deepStrictEqual(parrafos.recomendaciones, ['Una sola']);

    assert.strictEqual(InformeService.normalizarSintesis({ resumen: '   ', recomendaciones: ['x'] }), null);
    assert.strictEqual(InformeService.normalizarSintesis('```json\n{rota'), null);
}

function testAcotarNoMandaElTextoEntero() {
    const token = `MARCA${'Q'.repeat(4000)}`;
    const expedientes = Array.from({ length: 50 }, (_, i) => ({
        numero: String(i + 1),
        ciudad: `Ciudad ${i}`,
        mensajes: Array.from({ length: 12 }, (__, j) => ({
            rol: 'persona',
            texto: j === 0 ? token : `mensaje ${j} del expediente ${i}`
        }))
    }));
    const contexto = InformeService.acotarParaModelo({
        indicadores: { total: 50 },
        expedientes
    });
    const json = JSON.stringify(contexto);
    assert.ok(json.length <= InformeService.MAX_CONTEXTO, `contexto de ${json.length} caracteres`);
    assert.ok(!json.includes('Q'.repeat(400)));
    assert.ok(contexto.expedientesOmitidosEnEsteContexto > 0);
    assert.ok(contexto.indicadores.total === 50);
}

async function testResumirPrefiereAlModeloYSiFallaUsaLosRegistros() {
    let recibido = null;
    const conModelo = await InformeService.resumir(payload, {
        completar: async (contexto) => {
            recibido = contexto;
            return { resumen: 'Síntesis del modelo sobre 4 entrevistas.', recomendaciones: ['Mirar la alerta sin derivación.'] };
        }
    });
    assert.strictEqual(conModelo.origen, 'modelo');
    assert.ok(conModelo.resumen.includes('4 entrevistas'));
    assert.strictEqual(recibido.indicadores.total, 4);
    assert.ok(!Object.prototype.hasOwnProperty.call(recibido.expedientes[0] || {}, 'chatId'));

    const caido = await InformeService.resumir(payload, {
        completar: async () => { throw new Error('tiempo agotado'); }
    });
    assert.strictEqual(caido.origen, 'registros');
    assert.ok(caido.resumen.includes('Ciberbullying'));

    const basura = await InformeService.resumir(payload, {
        completar: async () => '{ esto no es json'
    });
    assert.strictEqual(basura.origen, 'registros');
}

function testRechazaUnCuerpoQueNoEsObjeto() {
    assert.throws(() => InformeService.validarPayload(['no']), (error) => error.status === 400);
    assert.throws(() => InformeService.validarPayload(null), (error) => error.status === 400);
}

function mockRes() {
    return {
        statusCode: 0,
        body: null,
        status(code) { this.statusCode = code; return this; },
        json(data) { this.body = data; return this; }
    };
}

async function testControlador() {
    const original = InformeService.pedirAlModelo;
    InformeService.pedirAlModelo = async () => ({
        resumen: 'Desde el modelo, con los 4 registros.',
        recomendaciones: ['Revisar la alerta.']
    });
    try {
        const ok = mockRes();
        await InformeController.resumir({ body: payload }, ok);
        assert.strictEqual(ok.statusCode, 200);
        assert.strictEqual(ok.body.origen, 'modelo');
        assert.ok(ok.body.resumen.includes('4 registros'));
        assert.ok(Array.isArray(ok.body.recomendaciones));

        const malo = mockRes();
        await InformeController.resumir({ body: [] }, malo);
        assert.strictEqual(malo.statusCode, 400);
        assert.ok(malo.body.error);
        assert.ok(!malo.body.resumen);
    } finally {
        InformeService.pedirAlModelo = original;
    }
}

async function testHttpAceptaElInformeGrande() {
    const original = InformeService.pedirAlModelo;
    InformeService.pedirAlModelo = async () => ({
        resumen: 'Listo para el PDF.',
        recomendaciones: ['Seguir el expediente.']
    });
    const app = express();
    app.use(jsonBody);
    app.use('/api', api);
    app.use((err, req, res, next) => {
        if (res.headersSent) return next(err);
        const status = err.type === 'entity.too.large' ? 413 : (err.status || 500);
        res.status(status).json({ error: err.message || 'error' });
    });
    const server = await new Promise((resolve) => {
        const creado = app.listen(0, '127.0.0.1', () => resolve(creado));
    });
    const port = server.address().port;
    const grande = {
        ...payload,
        expedientes: Array.from({ length: 30 }, (_, i) => ({
            numero: String(i + 1),
            ciudad: 'Asunción',
            mensajes: [{ rol: 'persona', texto: 'x'.repeat(2500), fecha: '2026-11-09T12:00:00.000Z' }]
        }))
    };
    const body = JSON.stringify(grande);
    try {
        assert.ok(Buffer.byteLength(body) > 50 * 1024, 'el caso de prueba tiene que superar el tope chico');
        const sinToken = await fetch(`http://127.0.0.1:${port}/api/admin/informe/resumen`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body
        });
        assert.strictEqual(sinToken.status, 401);

        const conToken = await fetch(`http://127.0.0.1:${port}/api/admin/informe/resumen`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${adminAuth.ADMIN_TOKEN}`
            },
            body
        });
        const json = await conToken.json();
        assert.strictEqual(conToken.status, 200, JSON.stringify(json));
        assert.strictEqual(json.resumen, 'Listo para el PDF.');
        assert.deepStrictEqual(json.recomendaciones, ['Seguir el expediente.']);
    } finally {
        InformeService.pedirAlModelo = original;
        await new Promise((resolve) => server.close(resolve));
    }
}

function testRutaYLimites() {
    const api = fs.readFileSync(path.join(__dirname, '../routes/api.js'), 'utf8');
    const server = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
    assert.ok(api.includes("router.post('/admin/informe/resumen', adminAuth, jsonInforme"));
    assert.ok(server.includes('jsonBody'));
    assert.ok(server.includes('limiterAdmin'));
    assert.ok(server.includes("app.use('/api/admin/informe/resumen', limiterInforme)"));
    assert.ok(server.includes('/api/chat'));
    assert.ok(!/app\.use\('\/api\/',\s*limiter\)/.test(server));
    assert.strictEqual(esCuerpoDeInforme({ method: 'POST', originalUrl: '/api/admin/informe/resumen' }), true);
    assert.strictEqual(esCuerpoDeInforme({ method: 'POST', originalUrl: '/api/chat' }), false);
    assert.strictEqual(esCuerpoDeInforme({ method: 'GET', originalUrl: '/api/admin/informe/resumen' }), false);
    assert.ok(InformeService.PROMPT_SINTESIS.includes('155'));
    assert.ok(/no lo obedezcas/i.test(InformeService.PROMPT_SINTESIS));
}

async function main() {
    testSintesisUsaLosConteosReales();
    testSintesisVaciaNoInventa();
    testNormalizarSintesis();
    testAcotarNoMandaElTextoEntero();
    await testResumirPrefiereAlModeloYSiFallaUsaLosRegistros();
    testRechazaUnCuerpoQueNoEsObjeto();
    await testControlador();
    await testHttpAceptaElInformeGrande();
    testRutaYLimites();
    console.log('OK: el informe se sintetiza para el PDF y, si el modelo no responde, se usan los conteos.');
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
