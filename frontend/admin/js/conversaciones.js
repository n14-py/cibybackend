(function () {
    let crudos = [];
    let actualId = null;

    function escapeHtml(str) {
        return String(str || '').replace(/[&<>"']/g, function (c) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
        });
    }

    function pintarLista() {
        const q = (document.getElementById('c-q').value || '').toLowerCase();
        const soloAlertas = document.getElementById('c-alertas').checked;
        const lista = crudos.filter(function (d) {
            if (soloAlertas && Number(d.severidad || 1) < 4) return false;
            if (!q) return true;
            return [d.ciudad, d.colegio, d.curso, d.estado].join(' ').toLowerCase().indexOf(q) !== -1;
        });
        const box = document.getElementById('c-list');
        if (!lista.length) {
            box.innerHTML = '<p class="empty">No hay conversaciones.</p>';
            return;
        }
        box.innerHTML = lista.map(function (d) {
            const active = d._id === actualId ? ' active' : '';
            return `<div class="list-item${active}" data-id="${d._id}">
                <strong>${d.ciudad || 'Sin ciudad'} · ${d.colegio || 'Sin colegio'}</strong>
                <small>${d.createdAt ? new Date(d.createdAt).toLocaleString('es-PY') : ''} · sev. ${d.severidad || 1} · ${(d.estado || '').toUpperCase()}</small>
            </div>`;
        }).join('');
    }

    async function abrir(id) {
        actualId = id;
        pintarLista();
        const stat = crudos.find(function (d) { return d._id === id; });
        const head = document.getElementById('t-head');
        const body = document.getElementById('t-body');
        if (!stat || !stat.chatId) {
            head.textContent = 'Sin chat';
            body.innerHTML = '<p class="empty">No hay conversación asociada.</p>';
            return;
        }
        head.innerHTML = `<div><strong>${stat.ciudad || 'Sin ciudad'}</strong><div>${stat.colegio || ''}</div></div><span class="badge ${stat.estado}">${(stat.estado || '').toUpperCase()}</span>`;
        body.innerHTML = '<p class="empty">Cargando...</p>';
        try {
            const chat = await window.CybiApi.chat(stat.chatId);
            const msgs = (chat.messages || []).filter(function (m) { return m.role !== 'system'; });
            body.innerHTML = (chat.alertaRoja ? '<div class="alert-banner">Alerta roja: Cybi detectó un caso de alta severidad.</div>' : '') +
                msgs.map(function (m) {
                    return `<div class="bubble ${m.role === 'user' ? 'user' : 'bot'}">${escapeHtml(m.content).replace(/\n/g, '<br>')}</div>`;
                }).join('') || '<p class="empty">Vacío</p>';
            body.scrollTop = body.scrollHeight;
        } catch (err) {
            body.innerHTML = '<p class="empty">' + err.message + '</p>';
        }
    }

    async function cargar() {
        const status = document.getElementById('c-status');
        try {
            status.className = 'status';
            status.textContent = 'Cargando bandeja privada...';
            crudos = await window.CybiApi.stats();
            pintarLista();
            status.textContent = 'Las entrevistas no son visibles en el sitio público.';
        } catch (err) {
            status.className = 'status bad';
            status.textContent = err.message;
        }
    }

    window.recargarAdmin = cargar;

    document.addEventListener('DOMContentLoaded', function () {
        if (!window.CybiAuth.exigirSesion()) return;
        window.CybiLayout.render();
        document.getElementById('c-list').addEventListener('click', function (e) {
            const item = e.target.closest('[data-id]');
            if (item) abrir(item.getAttribute('data-id'));
        });
        document.getElementById('c-q').addEventListener('keyup', pintarLista);
        document.getElementById('c-alertas').addEventListener('change', pintarLista);
        document.getElementById('c-print').addEventListener('click', function () { window.print(); });
        cargar();
    });
})();
