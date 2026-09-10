(function () {
    let crudos = [];

    function fila(d) {
        const fecha = d.createdAt ? new Date(d.createdAt).toLocaleString('es-PY') : '-';
        const nivel = Number(d.severidad || 1) >= 5 ? 'Crítico' : 'Alta';
        return `<tr>
            <td>${fecha}</td>
            <td><strong>${d.ciudad || '—'}</strong><br><small>${d.colegio || 'Sin colegio'}</small></td>
            <td class="sev s${d.severidad || 1}">${d.severidad || 1} · ${nivel}</td>
            <td>${d.esVictimaAcoso === true ? 'Posible víctima' : '—'}</td>
            <td>${d.derivacionRealizada ? '155 / centro sugerido' : 'Sin derivación cargada'}</td>
            <td>${(d.senalesEmocionales || []).map(function (s) { return `<span class="chip">${s}</span>`; }).join(' ') || '—'}</td>
            <td><a class="btn small" href="conversaciones.html">Abrir</a></td>
        </tr>`;
    }

    async function cargar() {
        const status = document.getElementById('a-status');
        try {
            status.className = 'status';
            status.textContent = 'Revisando alertas...';
            crudos = await window.CybiApi.stats();
            const alertas = crudos.filter(function (d) { return Number(d.severidad || 1) >= 4; });
            const victimas = crudos.filter(function (d) { return d.esVictimaAcoso === true; });
            const sinDerivar = alertas.filter(function (d) { return !d.derivacionRealizada; });

            document.getElementById('a-criticas').textContent = alertas.filter(function (d) { return Number(d.severidad || 1) >= 5; }).length;
            document.getElementById('a-altas').textContent = alertas.length;
            document.getElementById('a-victimas').textContent = victimas.length;
            document.getElementById('a-pendientes').textContent = sinDerivar.length;

            const body = document.getElementById('a-body');
            if (!alertas.length) {
                body.innerHTML = '<tr><td colspan="7" class="empty">No hay alertas de severidad 4 o 5.</td></tr>';
            } else {
                body.innerHTML = alertas.sort(function (a, b) { return Number(b.severidad || 1) - Number(a.severidad || 1); }).map(fila).join('');
            }
            status.textContent = alertas.length + ' caso(s) para seguimiento profesional.';
        } catch (err) {
            status.className = 'status bad';
            status.textContent = err.message;
        }
    }

    window.recargarAdmin = cargar;

    document.addEventListener('DOMContentLoaded', function () {
        if (!window.CybiAuth.exigirSesion()) return;
        window.CybiLayout.render();
        cargar();
    });
})();
