(function () {
    const PALETA = ['#2f7cf6', '#22d3ee', '#0b2046', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#64748b'];
    let charts = [];
    let crudos = [];

    const opts = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Outfit' } } } }
    };

    function destruir() {
        charts.forEach(function (c) { c.destroy(); });
        charts = [];
    }

    function chart(id, config) {
        const el = document.getElementById(id);
        if (!el) return;
        charts.push(new Chart(el.getContext('2d'), config));
    }

    function pintarKpis(r) {
        const map = {
            'kpi-total': r.total,
            'kpi-validos': r.validos,
            'kpi-incidencias': r.incidencias,
            'kpi-alertas': r.alertas,
            'kpi-pendientes': r.pendientes,
            'kpi-victimas': r.victimas,
            'kpi-derivaciones': r.derivaciones,
            'kpi-edad': r.edadPromedio
        };
        Object.keys(map).forEach(function (id) {
            const el = document.getElementById(id);
            if (el) el.textContent = map[id];
        });
    }

    function mapaAChart(mapa, limite) {
        const top = window.CybiAnalytics.topN(mapa, limite || 8);
        return {
            labels: top.map(function (x) { return x.label; }),
            values: top.map(function (x) { return x.value; })
        };
    }

    function renderCharts(datos) {
        destruir();
        const riesgos = mapaAChart(window.CybiAnalytics.mapaRiesgos(datos), 8);
        const ciudades = mapaAChart(window.CybiAnalytics.mapaCampo(datos, 'ciudad'), 8);
        const senales = mapaAChart(window.CybiAnalytics.mapaSenales(datos), 8);
        const colegios = mapaAChart(window.CybiAnalytics.mapaCampo(datos, 'colegio'), 6);
        const sev = window.CybiAnalytics.mapaSeveridad(datos);
        const linea = window.CybiAnalytics.porDia(datos);

        chart('chart-riesgos', {
            type: 'bar',
            data: { labels: riesgos.labels, datasets: [{ data: riesgos.values, backgroundColor: PALETA, borderRadius: 8 }] },
            options: Object.assign({}, opts, { plugins: { legend: { display: false } } })
        });
        chart('chart-ciudades', {
            type: 'doughnut',
            data: { labels: ciudades.labels, datasets: [{ data: ciudades.values, backgroundColor: PALETA }] },
            options: opts
        });
        chart('chart-senales', {
            type: 'bar',
            data: { labels: senales.labels, datasets: [{ label: 'Señales', data: senales.values, backgroundColor: '#22d3ee', borderRadius: 8 }] },
            options: Object.assign({}, opts, { indexAxis: 'y', plugins: { legend: { display: false } } })
        });
        chart('chart-severidad', {
            type: 'bar',
            data: { labels: ['1 leve', '2', '3', '4 alerta', '5 crítico'], datasets: [{ data: [sev['1'], sev['2'], sev['3'], sev['4'], sev['5']], backgroundColor: ['#10b981', '#22d3ee', '#f59e0b', '#fb7185', '#ef4444'], borderRadius: 8 }] },
            options: Object.assign({}, opts, { plugins: { legend: { display: false } } })
        });
        chart('chart-tiempo', {
            type: 'line',
            data: { labels: linea.labels, datasets: [{ label: 'Entrevistas', data: linea.values, borderColor: '#2f7cf6', backgroundColor: 'rgba(47,124,246,.15)', fill: true, tension: 0.35 }] },
            options: opts
        });
        chart('chart-colegios', {
            type: 'bar',
            data: { labels: colegios.labels, datasets: [{ data: colegios.values, backgroundColor: '#0b2046', borderRadius: 8 }] },
            options: Object.assign({}, opts, { plugins: { legend: { display: false } } })
        });
    }

    function pintarTop(id, mapa) {
        const el = document.getElementById(id);
        if (!el) return;
        const top = window.CybiAnalytics.topN(mapa, 5);
        if (!top.length) {
            el.innerHTML = '<p class="empty">Todavía no hay datos suficientes.</p>';
            return;
        }
        el.innerHTML = top.map(function (x) {
            return `<div class="list-item" style="cursor:default"><strong>${x.label}</strong><small>${x.value} registro(s)</small></div>`;
        }).join('');
    }

    async function cargar() {
        const status = document.getElementById('dash-status');
        try {
            status.className = 'status';
            status.textContent = 'Sincronizando datos confidenciales...';
            crudos = await window.CybiApi.stats();
            const r = window.CybiAnalytics.resumen(crudos);
            pintarKpis(r);
            renderCharts(crudos);
            pintarTop('top-ciudades', window.CybiAnalytics.mapaCampo(crudos, 'ciudad'));
            pintarTop('top-colegios', window.CybiAnalytics.mapaCampo(crudos, 'colegio'));
            status.textContent = r.total + ' entrevistas privadas cargadas. El público no ve esta información.';
        } catch (err) {
            status.className = 'status bad';
            status.textContent = err.message || 'No se pudieron cargar las estadísticas.';
        }
    }

    window.recargarAdmin = cargar;

    document.addEventListener('DOMContentLoaded', function () {
        if (!window.CybiAuth.exigirSesion()) return;
        window.CybiLayout.render();
        cargar();
    });
})();
