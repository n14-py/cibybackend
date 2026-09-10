(function () {
    const PAGINAS = [
        { id: 'dashboard', href: 'dashboard.html', icon: 'fa-chart-pie', label: 'Dashboard' },
        { id: 'casos', href: 'casos.html', icon: 'fa-table-list', label: 'Casos' },
        { id: 'conversaciones', href: 'conversaciones.html', icon: 'fa-comments', label: 'Conversaciones' },
        { id: 'alertas', href: 'alertas.html', icon: 'fa-bell', label: 'Alertas' },
        { id: 'reportes', href: 'reportes.html', icon: 'fa-file-pdf', label: 'Reportes' }
    ];

    function render() {
        const page = document.body.getAttribute('data-page') || '';
        const sidebar = document.getElementById('sidebar');
        const topbar = document.getElementById('topbar');
        if (!sidebar || !topbar) return;

        sidebar.innerHTML = `
            <a class="brand" href="dashboard.html">
                <img src="../img/cybi-logo.jpeg" alt="Cybi">
                <div>
                    <strong>Cybi Admin</strong>
                    <span>Inteligencia privada</span>
                </div>
            </a>
            <nav>
                ${PAGINAS.map(function (p) {
                    return `<a class="${p.id === page ? 'active' : ''}" href="${p.href}"><i class="fa-solid ${p.icon}"></i> ${p.label}</a>`;
                }).join('')}
            </nav>
            <div class="sidebar-foot">
                <a href="../index.html" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square"></i> Sitio público</a>
                <button type="button" id="btn-logout"><i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión</button>
            </div>
        `;

        topbar.innerHTML = `
            <div class="top-left">
                <button type="button" class="icon-btn" id="btn-menu" aria-label="Menú"><i class="fa-solid fa-bars"></i></button>
                <div>
                    <p class="eyebrow">Panel confidencial</p>
                    <h1>${document.title.replace('Cybi Admin | ', '')}</h1>
                </div>
            </div>
            <div class="top-actions">
                <span class="clock" id="admin-clock"></span>
                <button type="button" class="btn ghost" id="btn-refresh"><i class="fa-solid fa-rotate"></i> Actualizar</button>
            </div>
        `;

        document.getElementById('btn-logout').addEventListener('click', window.CybiAuth.logout);
        document.getElementById('btn-menu').addEventListener('click', function () {
            document.body.classList.toggle('sidebar-open');
        });
        document.getElementById('btn-refresh').addEventListener('click', function () {
            if (typeof window.recargarAdmin === 'function') window.recargarAdmin();
        });

        tickClock();
        setInterval(tickClock, 30000);
    }

    function tickClock() {
        const el = document.getElementById('admin-clock');
        if (!el) return;
        el.textContent = new Date().toLocaleString('es-PY', { dateStyle: 'medium', timeStyle: 'short' });
    }

    window.CybiLayout = { render: render };
})();
