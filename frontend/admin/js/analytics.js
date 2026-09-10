(function () {
    function norm(texto) {
        return (texto || '').toString().trim().toLowerCase();
    }

    function titulo(texto) {
        if (!texto) return 'Sin dato';
        return texto.toString().replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    }

    function esValido(stat) {
        return stat.estado !== 'rechazado';
    }

    function filtrar(datos, filtros) {
        const f = filtros || {};
        return (datos || []).filter(function (d) {
            if (f.estado && f.estado !== 'all' && d.estado !== f.estado) return false;
            if (f.ciudad && f.ciudad !== 'all' && norm(d.ciudad) !== f.ciudad) return false;
            if (f.colegio && f.colegio !== 'all' && norm(d.colegio) !== f.colegio) return false;
            if (f.severidad && f.severidad !== 'all' && String(d.severidad || 1) !== String(f.severidad)) return false;
            if (f.victima === 'si' && d.esVictimaAcoso !== true) return false;
            if (f.victima === 'no' && d.esVictimaAcoso !== false) return false;
            if (f.derivacion === 'si' && d.derivacionRealizada !== true) return false;
            if (f.alerta === 'si' && Number(d.severidad || 1) < 4) return false;
            if (f.desde) {
                const t = new Date(d.createdAt).getTime();
                if (t < new Date(f.desde).getTime()) return false;
            }
            if (f.hasta) {
                const t = new Date(d.createdAt).getTime();
                const hasta = new Date(f.hasta);
                hasta.setHours(23, 59, 59, 999);
                if (t > hasta.getTime()) return false;
            }
            if (f.q) {
                const blob = [d.ciudad, d.colegio, d.curso, d.edad, d.estado, (d.riesgosDetectados || []).join(' '), (d.senalesEmocionales || []).join(' '), d.motivoRevision, d.notasAdmin].join(' ').toLowerCase();
                if (blob.indexOf(f.q.toLowerCase()) === -1) return false;
            }
            return true;
        });
    }

    function contarLista(items) {
        const mapa = {};
        (items || []).forEach(function (item) {
            const key = norm(item) || 'sin_dato';
            mapa[key] = (mapa[key] || 0) + 1;
        });
        return mapa;
    }

    function resumen(datos) {
        const lista = datos || [];
        const validos = lista.filter(esValido);
        let sumaEdad = 0;
        let nEdad = 0;
        let sumaSev = 0;
        let incidencias = 0;

        validos.forEach(function (d) {
            if (d.edad && d.edad >= 10 && d.edad <= 19) {
                sumaEdad += d.edad;
                nEdad += 1;
            }
            sumaSev += Number(d.severidad || 1);
            if (d.riesgosDetectados && d.riesgosDetectados.length) incidencias += 1;
        });

        return {
            total: lista.length,
            validos: validos.length,
            pendientes: lista.filter(function (d) { return d.estado === 'pendiente'; }).length,
            aprobados: lista.filter(function (d) { return d.estado === 'aprobado'; }).length,
            rechazados: lista.filter(function (d) { return d.estado === 'rechazado'; }).length,
            incidencias: incidencias,
            edadPromedio: nEdad ? +(sumaEdad / nEdad).toFixed(1) : 0,
            victimas: validos.filter(function (d) { return d.esVictimaAcoso === true; }).length,
            derivaciones: validos.filter(function (d) { return d.derivacionRealizada === true; }).length,
            alertas: lista.filter(function (d) { return Number(d.severidad || 1) >= 4; }).length,
            criticos: lista.filter(function (d) { return Number(d.severidad || 1) >= 5; }).length,
            severidadPromedio: validos.length ? +(sumaSev / validos.length).toFixed(1) : 0
        };
    }

    function mapaRiesgos(datos) {
        const items = [];
        (datos || []).filter(esValido).forEach(function (d) {
            (d.riesgosDetectados || []).forEach(function (r) { items.push(r); });
        });
        return contarLista(items);
    }

    function mapaSenales(datos) {
        const items = [];
        (datos || []).filter(esValido).forEach(function (d) {
            (d.senalesEmocionales || []).forEach(function (r) { items.push(r); });
        });
        return contarLista(items);
    }

    function mapaCampo(datos, campo) {
        const mapa = {};
        (datos || []).filter(esValido).forEach(function (d) {
            const key = norm(d[campo]) || 'sin dato';
            mapa[key] = (mapa[key] || 0) + 1;
        });
        return mapa;
    }

    function mapaSeveridad(datos) {
        const mapa = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
        (datos || []).filter(esValido).forEach(function (d) {
            const s = String(Math.min(5, Math.max(1, Number(d.severidad || 1))));
            mapa[s] += 1;
        });
        return mapa;
    }

    function porDia(datos) {
        const mapa = {};
        (datos || []).forEach(function (d) {
            if (!d.createdAt) return;
            const dia = new Date(d.createdAt).toISOString().slice(0, 10);
            mapa[dia] = (mapa[dia] || 0) + 1;
        });
        const keys = Object.keys(mapa).sort();
        return { labels: keys, values: keys.map(function (k) { return mapa[k]; }) };
    }

    function unicos(datos, campo) {
        const set = {};
        (datos || []).forEach(function (d) {
            if (d[campo]) set[norm(d[campo])] = titulo(d[campo]);
        });
        return Object.keys(set).sort().map(function (k) { return { value: k, label: set[k] }; });
    }

    function topN(mapa, n) {
        return Object.keys(mapa).map(function (k) {
            return { label: titulo(k.replace(/_/g, ' ')), value: mapa[k], key: k };
        }).sort(function (a, b) { return b.value - a.value; }).slice(0, n || 8);
    }

    function csv(datos) {
        const cols = ['fecha', 'ciudad', 'colegio', 'edad', 'curso', 'riesgos', 'senales', 'severidad', 'victima', 'derivacion', 'estado', 'notas'];
        const lineas = [cols.join(';')];
        (datos || []).forEach(function (d) {
            const fila = [
                d.createdAt ? new Date(d.createdAt).toLocaleString('es-PY') : '',
                d.ciudad || '',
                d.colegio || '',
                d.edad || '',
                d.curso || '',
                (d.riesgosDetectados || []).join(', '),
                (d.senalesEmocionales || []).join(', '),
                d.severidad || 1,
                d.esVictimaAcoso === true ? 'sí' : (d.esVictimaAcoso === false ? 'no' : ''),
                d.derivacionRealizada ? 'sí' : 'no',
                d.estado || '',
                (d.notasAdmin || '').replace(/;/g, ',')
            ].map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; });
            lineas.push(fila.join(';'));
        });
        return lineas.join('\n');
    }

    function descargar(nombre, contenido, mime) {
        const blob = new Blob([contenido], { type: mime || 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombre;
        a.click();
        URL.revokeObjectURL(url);
    }

    window.CybiAnalytics = {
        norm: norm,
        titulo: titulo,
        filtrar: filtrar,
        resumen: resumen,
        mapaRiesgos: mapaRiesgos,
        mapaSenales: mapaSenales,
        mapaCampo: mapaCampo,
        mapaSeveridad: mapaSeveridad,
        porDia: porDia,
        unicos: unicos,
        topN: topN,
        csv: csv,
        descargar: descargar
    };
})();
