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
const tasaBCV = 873.867;


// Control de vigencia
let intervaloCotizacion = null;
let vencimientoCotizacion = null;
let origenCotizacion = 'COP';

function redondearA500(valor) {
    return Math.ceil(valor / 500) * 500;
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