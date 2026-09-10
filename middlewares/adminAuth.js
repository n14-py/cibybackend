const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'cybi-admin-auth-token-xyz';

/**
 * Protege las rutas del panel. Sin este token el público no puede
 * leer entrevistas, chats ni estadísticas.
 */
function adminAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

    if (!token || token !== ADMIN_TOKEN) {
        return res.status(401).json({ error: 'No autorizado. Iniciá sesión en el panel de administración.' });
    }

    next();
}

module.exports = adminAuth;
module.exports.ADMIN_TOKEN = ADMIN_TOKEN;
