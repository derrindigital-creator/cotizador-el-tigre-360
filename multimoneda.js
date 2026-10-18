// El Tigre 360 — Calculadoras adicionales sin alterar la calculadora COP original.
// El modo VES intercepta las entradas ANTES de los listeners históricos de app.js.
(() => {
    'use strict';
    const selector = document.querySelector('.selector-calculadora');
    if (!selector) return;
    const descripcion = document.getElementById('descripcion-calculadora');
    const aviso = document.getElementById('aviso-calculadora');
    const campos = { cop: montoCop, ves: montoVes, bcv: montoBcv };
    const etiquetas = {
        cop: document.querySelector('.modulo-cop .encabezado-moneda small'),
        ves: document.querySelector('.modulo-ves .encabezado-moneda small'),
        bcv: document.querySelector('.modulo-bcv .encabezado-moneda small')
    };
    const textosOriginales = Object.fromEntries(Object.entries(etiquetas).map(([k, el]) => [k, el.textContent]));
    let modo = 'cop';
    let ultimoOrigen = 'ves';
    const numeroLocal = texto => {
        const s = String(texto).replace(/\s/g, '').replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
        return s ? Number(s) : 0;
    };
    const fmtCop = n => n.toLocaleString('es-CO', {maximumFractionDigits:0});
    const fmtDecimal = n => n.toLocaleString('es-VE', {minimumFractionDigits:2, maximumFractionDigits:2});
    const redondear100 = n => Math.round((n + Number.EPSILON) / 100) * 100;
    const tasaEfectiva = () => Math.round((tasaCompra * .9 + Number.EPSILON) * 100) / 100;
    const cotizacionValida = () => tasasDisponibles && vencimientoCotizacion !== null && Date.now() < vencimientoCotizacion && !btnWhatsApp.disabled;
    function limpiar() {
        Object.values(campos).forEach(el => el.value = '');
        resultado.textContent = '0,00 Bs';
        resultadoBcv.textContent = 'US$ 0,00';
        btnWhatsApp.disabled = true;
        actualizarBotonesCopia();
        const mensaje = document.getElementById('mensaje-copia-tigre');
        if (mensaje) mensaje.textContent = '';
    }
    function calcular(origen) {
        if (modo !== 'ves') return;
        ultimoOrigen = origen;
        const tasa = tasaEfectiva();
        if (!tasasDisponibles || !Number.isFinite(tasa) || tasa <= 0 || !Number.isFinite(tasaBCV) || tasaBCV <= 0) {
            limpiar(); return;
        }
        const valor = numeroLocal(campos[origen].value);
        if (!Number.isFinite(valor) || valor <= 0) { limpiar(); return; }
        let bolivares, dolares, pesos;
        if (origen === 'ves') {
            bolivares = valor;
            dolares = bolivares / tasaBCV;
            pesos = redondear100(bolivares * tasa);
        } else if (origen === 'bcv') {
            dolares = valor;
            bolivares = dolares * tasaBCV;
            pesos = redondear100(bolivares * tasa);
        } else {
            // El cliente indica los pesos deseados. Se conserva ese importe
            // y se calcula el equivalente en VES; no se promete otro importe.
            pesos = redondear100(valor);
            bolivares = pesos / tasa;
            dolares = bolivares / tasaBCV;
        }
        if (![pesos, bolivares, dolares].every(Number.isFinite)) { limpiar(); return; }
        montoCop.value = fmtCop(pesos);
        montoVes.value = fmtDecimal(bolivares);
        montoBcv.value = fmtDecimal(dolares);
        resultado.textContent = fmtDecimal(bolivares) + ' Bs';
        resultadoBcv.textContent = 'US$ ' + fmtDecimal(dolares);
        btnWhatsApp.disabled = false;
        if (vencimientoCotizacion === null) iniciarVigenciaCotizacion();
        if (Date.now() >= vencimientoCotizacion) btnWhatsApp.disabled = true;
        actualizarBotonesCopia();
    }
    // Captura de eventos para no activar las fórmulas de venta originales.
    Object.entries(campos).forEach(([moneda, campo]) => {
        campo.addEventListener('input', e => {
            if (modo !== 'ves') return;
            e.stopImmediatePropagation();
            // Conservar el texto que escribe el cliente; solo actualizar los otros campos.
            const textoOriginal = campo.value;
            calcular(moneda);
            if (textoOriginal.trim()) campo.value = textoOriginal;
            actualizarBotonesCopia();
        }, true);
    });
    function cambiar(nuevo) {
        if (nuevo === 'pen') {
            aviso.hidden = false;
            aviso.textContent = '🇵🇪 La calculadora de soles peruanos estará disponible próximamente.';
            return;
        }
        aviso.hidden = true;
        modo = nuevo;
        document.body.classList.toggle('modo-ves', modo === 'ves');
        selector.querySelectorAll('[data-calculadora]').forEach(b => {
            const activo = b.dataset.calculadora === modo;
            b.classList.toggle('activa', activo);
            b.setAttribute('aria-pressed', String(activo));
        });
        descripcion.textContent = modo === 'ves'
            ? 'Entrega bolívares o su equivalente USD BCV y calcula los pesos colombianos a recibir.'
            : 'Envía pesos colombianos y calcula los bolívares y su equivalente en USD BCV.';
        etiquetas.cop.textContent = modo === 'ves' ? 'Pesos colombianos a recibir' : textosOriginales.cop;
        etiquetas.ves.textContent = modo === 'ves' ? 'Bolívares a cambiar' : textosOriginales.ves;
        etiquetas.bcv.textContent = modo === 'ves' ? 'Equivalente según dólar oficial BCV' : textosOriginales.bcv;
        limpiar();
    }
    selector.addEventListener('click', e => {
        const boton = e.target.closest('[data-calculadora]');
        if (boton) cambiar(boton.dataset.calculadora);
    });
    // WhatsApp y copia completa adaptados a la operación de compra.
    btnWhatsApp.addEventListener('click', e => {
        if (modo !== 'ves') return;
        e.stopImmediatePropagation();
        if (!cotizacionValida()) return;
        const mensaje = [
            'Hola, El Tigre 360 🐯', '',
            'Quiero cambiar bolívares por pesos colombianos.', '',
            'Bolívares a cambiar: ' + montoVes.value + ' Bs',
            'Equivalente: US$ ' + montoBcv.value + ' BCV',
            'Pesos a recibir: $' + montoCop.value + ' COP', '',
            'Deseo continuar con la operación.'
        ].join('\n');
        window.open('https://wa.me/573147354282?text=' + encodeURIComponent(mensaje), '_blank', 'noopener,noreferrer');
    }, true);
    document.addEventListener('click', async e => {
        if (modo !== 'ves') return;
        const boton = e.target.closest('[data-copia="todo"]');
        if (!boton) return;
        e.stopPropagation();
        e.preventDefault();
        if (!cotizacionValida()) return;
        const texto = ['🐯 EL TIGRE 360 | TE CONECTA', '',
            'Cambias: ' + montoVes.value + ' Bs',
            'Recibes: $' + montoCop.value + ' COP',
            'Equivalente: US$ ' + montoBcv.value + ' BCV'].join('\n');
        const avisoCopia = document.getElementById('mensaje-copia-tigre');
        try { await navigator.clipboard.writeText(texto); avisoCopia.textContent = '✓ Cotización copiada.'; }
        catch (_) { avisoCopia.textContent = 'No se pudo copiar la cotización.'; }
    }, true);
})();
