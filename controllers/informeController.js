const InformeService = require('../services/informeService');

class InformeController {
    /**
     * POST /api/admin/informe/resumen
     * El panel manda el corte ya contado y espera { resumen, recomendaciones }.
     * Tiene que responder antes de los 15 segundos: si el modelo no llega, se devuelve
     * la síntesis armada con esos mismos indicadores para que el PDF igual la incorpore.
     */
    static async resumir(req, res) {
        try {
            const resultado = await InformeService.resumir(req.body);
            if (!resultado || !String(resultado.resumen || '').trim()) {
                return res.status(500).json({ error: 'No se pudo preparar la síntesis del informe.' });
            }
            return res.status(200).json({
                resumen: resultado.resumen,
                recomendaciones: Array.isArray(resultado.recomendaciones) ? resultado.recomendaciones : [],
                origen: resultado.origen || 'registros'
            });
        } catch (error) {
            const status = Number(error.status) || 500;
            if (status >= 500) console.error('[ERROR INFORME]:', error.message);
            const mensaje = status === 400
                ? (error.message || 'El informe enviado no es válido.')
                : 'No se pudo preparar la síntesis del informe.';
            return res.status(status).json({ error: mensaje });
        }
    }
}

module.exports = InformeController;
