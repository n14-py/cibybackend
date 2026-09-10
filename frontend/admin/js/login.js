(function () {
    document.addEventListener('DOMContentLoaded', function () {
        if (window.CybiAuth.estaLogueado()) {
            const params = new URLSearchParams(location.search);
            location.replace(params.get('next') || 'dashboard.html');
            return;
        }
        const form = document.getElementById('login-form');
        const help = document.getElementById('login-help');
        const params = new URLSearchParams(location.search);
        if (params.get('expired')) help.textContent = 'La sesión expiró. Volvé a ingresar.';

        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            help.textContent = '';
            const btn = form.querySelector('button');
            btn.disabled = true;
            try {
                await window.CybiAuth.login(document.getElementById('admin-pass').value);
                location.replace(params.get('next') || 'dashboard.html');
            } catch (err) {
                help.textContent = err.message || 'No se pudo entrar.';
                btn.disabled = false;
            }
        });
    });
})();
