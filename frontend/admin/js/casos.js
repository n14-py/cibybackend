(function () {
    let crudos = [];
    let filtrados = [];
    let pagina = 1;
    const POR_PAGINA = 12;
    let actual = null;

    function val(id) {
        const el = document.getElementById(id);
        return el ? el.value : '';
    }

    function filtros() {
        return {
            q: val('f-q'),
            ciudad: val('f-ciudad'),
            colegio: val('f-colegio'),
            estado: val('f-estado'),
            severidad: val('f-severidad'),
            victima: val('f-victima'),
            desde: val('f-desde'),
            hasta: val('f-hasta')
        };
    }

    function poblarSelect(id, opciones) {
        const el = document.getElementById(id);
        if (!el) return;
        const current = el.value;
        const extras = opciones.map(function (o) {
            return `<option value="${o.value}">${o.label}</option>`;
        }).join('');
        el.innerHTML = '<option value="all">Todos</option>' + extras;
        if ([].some.call(el.options, function (o) { return o.value === current; })) el.value = current;
    }

    function aplicar() {
        filtrados = window.CybiAnalytics.filtrar(crudos, filtros());
        pagina = 1;
        renderTabla();
    }

    function renderTabla() {
        const body = document.getElementById('casos-body');
        const meta = document.getElementById('casos-meta');
        const total = filtrados.length;
        const pages = Math.max(1, Math.ceil(total / POR_PAGINA));
        if (pagina > pages) pagina = pages;
        const slice = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

        if (!slice.length) {
            body.innerHTML = '<tr><td colspan="8" class="empty">No hay casos con esos filtros.</td></tr>';
        } else {
            body.innerHTML = slice.map(function (d) {
                const fecha = d.createdAt ? new Date(d.createdAt).toLocaleString('es-PY') : '-';
                const riesgos = (d.riesgosDetectados || []).map(function (r) { return `<span class="chip">${r}</span>`; }).join(' ') || '—';
                const senales = (d.senalesEmocionales || []).slice(0, 3).map(function (r) { return `<span class="chip">${r}</span>`; }).join(' ');
                return `<tr>
                    <td>${fecha}</td>
                    <td><strong>${d.ciudad || '—'}</strong><br><small>${d.colegio || 'Sin colegio'}</small></td>
                    <td>${d.edad || '—'}<br><small>${d.curso || ''}</small></td>
                    <td>${riesgos}<div>${senales}</div></td>
                    <td class="sev s${d.severidad || 1}">${d.severidad || 1}</td>
                    <td>${d.esVictimaAcoso === true ? 'Sí' : (d.esVictimaAcoso === false ? 'No' : '—')}</td>
                    <td><span class="badge ${d.estado}">${(d.estado || '').toUpperCase()}</span></td>
                    <td><button class="btn small ghost" data-open="${d._id}">Revisar</button></td>
                </tr>`;
            }).join('');
        }
        meta.textContent = total + ' caso(s) · página ' + pagina + ' de ' + pages;
        document.getElementById('prev-page').disabled = pagina <= 1;
        document.getElementById('next-page').disabled = pagina >= pages;
    }

    function abrir(id) {
        actual = crudos.find(function (d) { return d._id === id; });
        if (!actual) return;
        document.getElementById('drawer').style.display = 'block';
        document.getElementById('d-meta').innerHTML = `
            <p><strong>${actual.ciudad || 'Sin ciudad'}</strong> · ${actual.colegio || 'Sin colegio'} · ${actual.edad || '—'} años</p>
            <p>Estado: <span class="badge ${actual.estado}">${(actual.estado || '').toUpperCase()}</span> · Severidad ${actual.severidad || 1} · Derivación: ${actual.derivacionRealizada ? 'sí' : 'no'}</p>
            <p>${(actual.riesgosDetectados || []).join(', ') || 'Sin riesgos cargados'}</p>
            <p>${(actual.senalesEmocionales || []).join(', ') || 'Sin señales emocionales'}</p>
            <p>Motivo IA: ${actual.motivoRevision || '—'}</p>
        `;
        document.getElementById('d-notas').value = actual.notasAdmin || '';
        document.getElementById('d-chat').innerHTML = '<p class="empty">Cargando conversación...</p>';
        if (!actual.chatId) {
            document.getElementById('d-chat').innerHTML = '<p class="empty">Este registro no tiene chat asociado.</p>';
            return;
        }
        window.CybiApi.chat(actual.chatId).then(function (chat) {
            const msgs = (chat.messages || []).filter(function (m) { return m.role !== 'system'; });
            document.getElementById('d-chat').innerHTML = (chat.alertaRoja ? '<div class="alert-banner">Alerta roja detectada por Cybi</div>' : '') +
                msgs.map(function (m) {
                    return `<div class="bubble ${m.role === 'user' ? 'user' : 'bot'}">${escapeHtml(m.content).replace(/\n/g, '<br>')}</div>`;
                }).join('') || '<p class="empty">Sin mensajes.</p>';
        }).catch(function (err) {
            document.getElementById('d-chat').innerHTML = '<p class="empty">' + err.message + '</p>';
        });
    }

    function escapeHtml(str) {
        return String(str || '').replace(/[&<>"']/g, function (c) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
        });
    }

    async function cambiar(estado) {
        if (!actual) return;
        await window.CybiApi.actualizarEstado(actual._id, estado, document.getElementById('d-notas').value);
        await cargar();
        document.getElementById('drawer').style.display = 'none';
    }

    async function cargar() {
        const status = document.getElementById('casos-status');
        try {
            status.className = 'status';
            status.textContent = 'Cargando casos privados...';
            crudos = await window.CybiApi.stats();
            poblarSelect('f-ciudad', window.CybiAnalytics.unicos(crudos, 'ciudad'));
            poblarSelect('f-colegio', window.CybiAnalytics.unicos(crudos, 'colegio'));
            aplicar();
            status.textContent = crudos.length + ' registros en el panel privado.';
        } catch (err) {
            status.className = 'status bad';
            status.textContent = err.message;
        }
    }

    window.recargarAdmin = cargar;

    document.addEventListener('DOMContentLoaded', function () {
        if (!window.CybiAuth.exigirSesion()) return;
        window.CybiLayout.render();
        ['f-q', 'f-ciudad', 'f-colegio', 'f-estado', 'f-severidad', 'f-victima', 'f-desde', 'f-hasta'].forEach(function (id) {
            document.getElementById(id).addEventListener('change', aplicar);
            document.getElementById(id).addEventListener('keyup', aplicar);
        });
        document.getElementById('casos-body').addEventListener('click', function (e) {
            const btn = e.target.closest('[data-open]');
            if (btn) abrir(btn.getAttribute('data-open'));
        });
        document.getElementById('prev-page').addEventListener('click', function () { pagina -= 1; renderTabla(); });
        document.getElementById('next-page').addEventListener('click', function () { pagina += 1; renderTabla(); });
        document.getElementById('btn-csv').addEventListener('click', function () {
            window.CybiAnalytics.descargar('cybi-casos.csv', window.CybiAnalytics.csv(filtrados), 'text/csv;charset=utf-8');
        });
        document.getElementById('d-close').addEventListener('click', function () {
            document.getElementById('drawer').style.display = 'none';
        });
        document.getElementById('d-aprobar').addEventListener('click', function () { cambiar('aprobado'); });
        document.getElementById('d-rechazar').addEventListener('click', function () { cambiar('rechazado'); });
        document.getElementById('d-pendiente').addEventListener('click', function () { cambiar('pendiente'); });
        cargar();
    });
})();
