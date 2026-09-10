(function () {
    const cfg = window.CYBI_ADMIN;

    async function request(path, options) {
        const opts = options || {};
        const headers = Object.assign({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + window.CybiAuth.getToken()
        }, opts.headers || {});

        const respuesta = await fetch(cfg.API + path, Object.assign({}, opts, { headers }));

        if (respuesta.status === 401) {
            window.CybiAuth.clearSession();
            location.replace('index.html?expired=1');
            throw new Error('Sesión expirada');
        }

        if (!respuesta.ok) {
            const body = await respuesta.json().catch(() => ({}));
            throw new Error(body.error || 'Error de servidor (' + respuesta.status + ')');
        }

        return respuesta.json();
    }

    window.CybiApi = {
        stats: function () { return request('/stats'); },
        chat: function (chatId) { return request('/chat/' + encodeURIComponent(chatId)); },
        actualizarEstado: function (statId, estado, notasAdmin) {
            return request('/stats/' + encodeURIComponent(statId) + '/estado', {
                method: 'PUT',
                body: JSON.stringify({ estado: estado, notasAdmin: notasAdmin || '' })
            });
        }
    };
})();
