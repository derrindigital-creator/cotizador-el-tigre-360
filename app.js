const montoCop = document.getElementById('montoCop');
const montoVes = document.getElementById('montoVes');
const montoBcv = document.getElementById('montoBcv');

const tasaVenta = document.getElementById('tasaVenta');

const resultado = document.getElementById('resultado');
const resultadoBcv = document.getElementById('resultadoBcv');

const btnWhatsApp = document.getElementById('btnWhatsApp');

const tiempoCotizacion = document.getElementById(
    'tiempoCotizacion'
);


// BCV oficial utilizado para las cotizaciones
let tasaBCV = 873.867;


// Control de vigencia
let intervaloCotizacion = null;
let vencimientoCotizacion = null;
let origenCotizacion = 'COP';

// ==========================================
// CONSULTAR TASAS DESDE SUPABASE
// ==========================================

// ==========================================
// TASAS SEGURAS DESDE SUPABASE
// ==========================================

let tasasDisponibles = false;

function bloquearCotizador() {
    tasasDisponibles = false;

    montoCop.disabled = true;
    montoVes.disabled = true;
    montoBcv.disabled = true;
    btnWhatsApp.disabled = true;

    // Eliminar cualquier cotización anterior
    montoCop.value = '';
    montoVes.value = '';
    montoBcv.value = '';

    resultado.textContent = '0,00 Bs';
    resultadoBcv.textContent = 'US$ 0,00';

    // Cancelar la vigencia anterior
    if (intervaloCotizacion !== null) {
        clearInterval(intervaloCotizacion);
        intervaloCotizacion = null;
    }

    vencimientoCotizacion = null;
    tiempoCotizacion.textContent = 'Sin cotización vigente';
}

function habilitarCotizador() {
    tasasDisponibles = true;

    montoCop.disabled = false;
    montoVes.disabled = false;
    montoBcv.disabled = false;
}

async function cargarTasasSupabase() {
    bloquearCotizador();

    try {
        const cliente = supabase.createClient(
            window.SUPABASE_CONFIG.url,
            window.SUPABASE_CONFIG.publishableKey
        );

        const { data, error } = await cliente
            .from('tasas_actuales')
            .select('tasa_venta, tasa_bcv')
            .eq('id', 1)
            .single();

        if (error) throw error;

        const venta = Number(data.tasa_venta);
        const bcv = Number(data.tasa_bcv);

        if (
            !Number.isFinite(venta) ||
            !Number.isFinite(bcv) ||
            venta <= 0 ||
            bcv <= 0
        ) {
            throw new Error('Tasas inválidas');
        }

        tasaVenta.value = String(venta);
        tasaBCV = bcv;

        habilitarCotizador();

        console.log(
            'NIF 19.2.21: tasas cargadas y cotizador habilitado'
        );

    } catch (error) {
        bloquearCotizador();

        console.error('Error consultando tasas:', error);

        alert(
            'No fue posible actualizar las tasas. ' +
            'Por seguridad, el cotizador permanecerá bloqueado. ' +
            'Intenta actualizar la página.'
        );
    }
}

bloquearCotizador();
cargarTasasSupabase();

cargarTasasSupabase();

function redondearA500(valor) {
    return Math.ceil(valor / 500) * 500;
}

// Formato de Bolívares mientras se escribe.
// Punto para miles y coma para decimales.

function formatearBolivares(valor) {

    const limpio = valor
        .replace(/\./g, '')
        .replace(/[^\d,]/g, '');

    const partes = limpio.split(',');

    const enteros = partes[0];

    const decimales = partes
        .slice(1)
        .join('')
        .slice(0, 2);

    const enterosFormateados = enteros
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    if (limpio.includes(',')) {
        return enterosFormateados + ',' + decimales;
    }

    return enterosFormateados;
}

// ==========================================
// VIGENCIA DE LA COTIZACIÓN
// ==========================================

function iniciarVigenciaCotizacion() {

    if (intervaloCotizacion) {
        clearInterval(intervaloCotizacion);
    }

    // Una hora desde el momento
    // en que se genera la cotización
    vencimientoCotizacion =
        Date.now() + (60 * 60 * 1000);


    function actualizarVigencia() {

        const tiempoRestante =
            vencimientoCotizacion - Date.now();


        if (tiempoRestante <= 0) {

            clearInterval(intervaloCotizacion);

            intervaloCotizacion = null;

            tiempoCotizacion.textContent =
                'Cotización vencida';

            btnWhatsApp.disabled = true;

            return;
        }


        // El contador funciona internamente.
        // Al cliente solo mostramos "1 hora".
        tiempoCotizacion.textContent = '1 hora';
    }


    actualizarVigencia();


    intervaloCotizacion =
        setInterval(actualizarVigencia, 1000);
}


// ==========================================
// CALCULAR COTIZACIÓN COP → VES → BCV
// ==========================================

function calcularCotizacion() {

    const pesos = Number(
        montoCop.value.replace(/\D/g, '')
    );

    const tasa = Number(tasaVenta.value);


    // Si no existe un monto válido,
    // limpiamos los resultados.
    if (pesos <= 0 || tasa <= 0) {

        resultado.textContent =
            '0,00 Bs';

        resultadoBcv.textContent =
            'US$ 0,00';


        montoVes.value = '';
        montoBcv.value = '';


        btnWhatsApp.disabled = true;

        return;
    }


    // COP → VES
    const bolivares =
        pesos / tasa;


    // VES → USD BCV
    const dolaresBCV =
        bolivares / tasaBCV;


    // Resultados internos conservados
    resultado.textContent =
        bolivares.toLocaleString('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + ' Bs';


    resultadoBcv.textContent =
        'US$ ' +
        dolaresBCV.toLocaleString('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });


    // Nuevos módulos visibles
    montoVes.value =
        bolivares.toLocaleString('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });


    montoBcv.value =
        dolaresBCV.toLocaleString('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });


    btnWhatsApp.disabled = false;


    // La primera cotización válida
    // inicia su vigencia de una hora.
    if (vencimientoCotizacion === null) {
        iniciarVigenciaCotizacion();
    }
}


// ==========================================
// ENTRADA DE PESOS COLOMBIANOS
// ==========================================

montoCop.addEventListener('input', () => {

    origenCotizacion = 'COP';

    const numeros =
        montoCop.value.replace(/\D/g, '');


    if (numeros === '') {

        montoCop.value = '';

        calcularCotizacion();

        return;
    }


    const monto =
        Number(numeros);


    // Formato colombiano:
    // 100000 → 100.000
    montoCop.value =
        monto.toLocaleString('es-CO');


    calcularCotizacion();


    // Mantiene el cursor al final
    // después de aplicar el formato.
    requestAnimationFrame(() => {

        const posicionFinal =
            montoCop.value.length;


        montoCop.setSelectionRange(
            posicionFinal,
            posicionFinal
        );
    });
});

// ==========================================
// ENTRADA DE BOLÍVARES
// ==========================================

montoVes.addEventListener('input', () => {

    origenCotizacion = 'VES';

    // Aplicar separador de miles automáticamente
    const posicionAnterior = montoVes.selectionStart;

    const textoAnterior = montoVes.value;

    const caracteresAntes = textoAnterior
        .slice(0, posicionAnterior)
        .replace(/[^\d,]/g, '').length;

    montoVes.value = formatearBolivares(textoAnterior);

    let posicionNueva = 0;
    let caracteresContados = 0;

    while (
        posicionNueva < montoVes.value.length &&
        caracteresContados < caracteresAntes
    ) {
        if (/[\d,]/.test(montoVes.value[posicionNueva])) {
            caracteresContados++;
        }

        posicionNueva++;
    }

    montoVes.setSelectionRange(
        posicionNueva,
        posicionNueva
    );

    // En este campo permitimos escribir
    // números y decimales con coma.
    const valorIngresado =
        montoVes.value
            .replace(/\./g, '')
            .replace(',', '.')
            .replace(/[^\d.]/g, '');

    const bolivares =
        Number(valorIngresado);

    const tasa =
        Number(tasaVenta.value);


    if (bolivares <= 0 || tasa <= 0) {

        montoCop.value = '';
        montoBcv.value = '';

        resultado.textContent =
            '0,00 Bs';

        resultadoBcv.textContent =
            'US$ 0,00';

        btnWhatsApp.disabled = true;

        return;
    }


    // VES → COP
    const pesos =
        bolivares * tasa;


    // VES → USD BCV
    const dolaresBCV =
        bolivares / tasaBCV;


    montoCop.value =
        pesos.toLocaleString('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });


    montoBcv.value =
        dolaresBCV.toLocaleString('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });


    resultado.textContent =
        bolivares.toLocaleString('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + ' Bs';


    resultadoBcv.textContent =
        'US$ ' +
        dolaresBCV.toLocaleString('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });


    btnWhatsApp.disabled = false;


    if (vencimientoCotizacion === null) {
        iniciarVigenciaCotizacion();
    }
});

// ==========================================
// ENTRADA DE DÓLARES AL BCV
// ==========================================

montoBcv.addEventListener('input', () => {

    origenCotizacion = 'BCV';

    const valorIngresado =
        montoBcv.value
            .replace(',', '.')
            .replace(/[^\d.]/g, '');

    const dolares =
        Number(valorIngresado);

    const tasa =
        Number(tasaVenta.value);


    if (dolares <= 0 || tasa <= 0) {

        montoCop.value = '';
        montoVes.value = '';

        resultado.textContent =
            '0,00 Bs';

        resultadoBcv.textContent =
            'US$ 0,00';

        btnWhatsApp.disabled = true;

        return;
    }


    // USD BCV → VES
    const bolivares =
        dolares * tasaBCV;


    // VES → COP
    const pesosExactos =
        bolivares * tasa;


    // Regla comercial:
    // siempre hacia arriba al múltiplo
    // siguiente de $500.
    const pesosFinales =
        redondearA500(pesosExactos);


    montoVes.value =
        bolivares.toLocaleString('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });


    montoCop.value =
        pesosFinales.toLocaleString('es-CO');


    resultado.textContent =
        bolivares.toLocaleString('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + ' Bs';


    resultadoBcv.textContent =
        'US$ ' +
        dolares.toLocaleString('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });


    btnWhatsApp.disabled = false;


    if (vencimientoCotizacion === null) {
        iniciarVigenciaCotizacion();
    }
});


// ==========================================
// MENSAJE DE WHATSAPP
// ==========================================

btnWhatsApp.addEventListener('click', () => {

    const tasa =
        Number(tasaVenta.value);


    if (tasa <= 0) {
        return;
    }


    let mensaje =
        `Hola, El Tigre 360 🐯\n\n` +
        `Quiero realizar un giro.\n\n`;


    // ======================================
    // COTIZACIÓN ORIGINADA DESDE COP
    // ======================================

    if (origenCotizacion === 'COP') {

        const pesos = Number(
            montoCop.value.replace(/\D/g, '')
        );


        if (pesos <= 0) {
            return;
        }


        const bolivares =
            pesos / tasa;


        const dolaresBCV =
            bolivares / tasaBCV;


        const pesosFormateados =
            '$' +
            pesos.toLocaleString('es-CO') +
            ' COP';


        const bolivaresFormateados =
            bolivares.toLocaleString('es-VE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }) +
            ' Bs';


        const dolaresFormateados =
            'US$' +
            dolaresBCV.toLocaleString('es-VE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });


        mensaje +=
            `Envío: ${pesosFormateados}\n` +
            `Recibo aprox.: ${bolivaresFormateados}\n` +
            `Equivalente: ${dolaresFormateados} BCV\n\n`;
    }

    // ======================================
    // COTIZACIÓN ORIGINADA DESDE VES
    // ======================================

    else if (origenCotizacion === 'VES') {

        const valorIngresado =
            montoVes.value
                .replace(/\./g, '')
                .replace(',', '.')
                .replace(/[^\d.]/g, '');

        const bolivares =
            Number(valorIngresado);


        if (bolivares <= 0) {
            return;
        }


        // VES → COP
        const pesos =
            bolivares * tasa;


        // VES → USD BCV
        const dolaresBCV =
            bolivares / tasaBCV;


        const bolivaresFormateados =
            bolivares.toLocaleString('es-VE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }) +
            ' Bs';


        const pesosFormateados =
            '$' +
            pesos.toLocaleString('es-CO', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }) +
            ' COP';


        const dolaresFormateados =
            'US$' +
            dolaresBCV.toLocaleString('es-VE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });


        mensaje +=
            `Solicito recibir: ${bolivaresFormateados}\n` +
            `Debo enviar: ${pesosFormateados}\n` +
            `Equivalente: ${dolaresFormateados} BCV\n\n`;
    }


    // ======================================
    // COTIZACIÓN ORIGINADA DESDE BCV
    // ======================================

    else if (origenCotizacion === 'BCV') {

        const valorIngresado =
            montoBcv.value
                .replace(',', '.')
                .replace(/[^\d.]/g, '');


        const dolares =
            Number(valorIngresado);


        if (dolares <= 0) {
            return;
        }


        const bolivares =
            dolares * tasaBCV;


        const pesosExactos =
            bolivares * tasa;


        const pesosFinales =
            redondearA500(pesosExactos);


        const dolaresFormateados =
            'US$' +
            dolares.toLocaleString('es-VE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });


        const bolivaresFormateados =
            bolivares.toLocaleString('es-VE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }) +
            ' Bs';


        const pesosFormateados =
            '$' +
            pesosFinales.toLocaleString('es-CO') +
            ' COP';


        mensaje +=
            `Solicito: ${dolaresFormateados} al BCV\n` +
            `Debo enviar: ${pesosFormateados}\n` +
            `Reciben aprox.: ${bolivaresFormateados}\n\n`;
    }


    mensaje +=
        `Deseo continuar con el giro.`;


    const numeroWhatsApp =
        '573147354282';


    const urlWhatsApp =
        `https://wa.me/${numeroWhatsApp}` +
        `?text=${encodeURIComponent(mensaje)}`;


    window.open(
        urlWhatsApp,
        '_blank'
    );
});