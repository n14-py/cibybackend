(function () {
    const cfg = window.CYBI_ADMIN;

    function getToken() {
        return sessionStorage.getItem(cfg.TOKEN_KEY) || '';
    }

    function setToken(token) {
        sessionStorage.setItem(cfg.TOKEN_KEY, token);
    }

    function clearSession() {
        sessionStorage.removeItem(cfg.TOKEN_KEY);
    }

    function estaLogueado() {
        return Boolean(getToken());
    }

    function exigirSesion() {
        if (estaLogueado()) return true;
        const next = encodeURIComponent(location.pathname.split('/').pop() || 'dashboard.html');
        location.replace('index.html?next=' + next);
        return false;
    }

    async function login(password) {
        const respuesta = await fetch(cfg.API + '/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        const data = await respuesta.json().catch(() => ({}));
        if (!respuesta.ok || !data.success || !data.token) {
            throw new Error(data.error || 'Contraseña incorrecta');
        }
        setToken(data.token);
        return data;
    }

    function logout() {
        clearSession();
        location.replace('index.html');
    }

    window.CybiAuth = { getToken, setToken, clearSession, estaLogueado, exigirSesion, login, logout };
})();
