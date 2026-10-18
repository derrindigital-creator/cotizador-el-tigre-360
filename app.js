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

// Tasa comercial de compra cargada desde Supabase
let tasaCompra = null;




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



// Indicadores informativos independientes de los cálculos.
// Se colocan debajo del logo, sin modificar index.html ni styles.css.
function crearIndicadoresTasas() {
    const marca = document.querySelector('.marca-tigre');
    if (!marca || document.getElementById('indicadores-tasas')) return;

    const estilos = document.createElement('style');
    estilos.textContent = `
        #indicadores-tasas {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            width: 100%;
            margin: 12px auto 16px;
        }
        #indicadores-tasas .indicador-tasa {
            min-width: 0;
            padding: 9px 7px;
            border-radius: 12px;
            background: #ffffff;
            border: 1px solid #d9e2ed;
            text-align: center;
            box-shadow: 0 2px 7px rgba(7, 21, 46, .04);
        }
        #indicadores-tasas .indicador-tasa span {
            display: block;
            color: #65758b;
            font: 600 11px/1.4 Arial, sans-serif;
            letter-spacing: .3px;
        }
        #indicadores-tasas .indicador-tasa strong {
            display: block;
            color: #163b68;
            font: 700 clamp(14px, 3.7vw, 19px)/1.5 Arial, sans-serif;
            white-space: nowrap;
        }
    `;
    document.head.appendChild(estilos);

    const contenedor = document.createElement('div');
    contenedor.id = 'indicadores-tasas';
    contenedor.setAttribute('aria-label', 'Tasas de referencia');
    contenedor.innerHTML = `
        <div class="indicador-tasa">
            <span>DÓLAR BCV</span>
            <strong id="indicador-bcv">Consultando...</strong>
        </div>
        <div class="indicador-tasa">
            <span>USDT</span>
            <strong id="indicador-usdt">Consultando...</strong>
        </div>
    `;
    marca.insertAdjacentElement('afterend', contenedor);
}

function mostrarIndicadoresTasas(bcv, usdt) {
    const formato = valor => 'Bs. ' + valor.toLocaleString('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    document.getElementById('indicador-bcv').textContent = formato(bcv);
    document.getElementById('indicador-usdt').textContent =
        Number.isFinite(usdt) && usdt > 0 ? formato(usdt) : 'No disponible';
}

function ocultarIndicadoresTasas() {
    const bcv = document.getElementById('indicador-bcv');
    const usdt = document.getElementById('indicador-usdt');
    if (bcv) bcv.textContent = 'No disponible';
    if (usdt) usdt.textContent = 'No disponible';
}

crearIndicadoresTasas();

let tasasDisponibles = false;



function bloquearCotizador() {

    tasasDisponibles = false;
    ocultarIndicadoresTasas();



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
    actualizarBotonesCopia();

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

        const respuesta = await fetch(


            `${window.SUPABASE_CONFIG.url}/rest/v1/tasas_actuales?id=eq.1&select=tasa_venta,tasa_compra,tasa_bcv,tasa_usdt`,


            {

                headers: {

                    apikey: window.SUPABASE_CONFIG.publishableKey,

                    Accept: 'application/vnd.pgrst.object+json'

                },

                cache: 'no-store'

            }

        );



        if (!respuesta.ok) {

            throw new Error(`Error HTTP ${respuesta.status}`);

        }



        const data = await respuesta.json();



        const venta = Number(data.tasa_venta);


        const compra = data.tasa_compra == null
            ? NaN
            : Number(data.tasa_compra);

        const bcv = Number(data.tasa_bcv);
        const usdt = data.tasa_usdt == null ? NaN : Number(data.tasa_usdt);



        if (
            !Number.isFinite(venta) ||
            !Number.isFinite(compra) ||
            !Number.isFinite(bcv) ||
            venta <= 0 ||
            compra <= 0 ||
            bcv <= 0
        ) {
            throw new Error('Tasas inválidas');
        }




        tasaVenta.value = String(venta);

        tasaCompra = compra;
        tasaBCV = bcv;
        mostrarIndicadoresTasas(bcv, usdt);



        habilitarCotizador();
        actualizarBotonesCopia();



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
            actualizarBotonesCopia();

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



// ==========================================
// FECHA / HORA Y COPIA DE COTIZACIONES
// ==========================================

function crearRelojCotizador() {
    const marca = document.querySelector('.marca-tigre');
    if (!marca || document.getElementById('reloj-tigre')) return;
    const reloj = document.createElement('div');
    reloj.id = 'reloj-tigre';
    reloj.className = 'reloj-tigre-visible';
    marca.insertAdjacentElement('afterend', reloj);
    const actualizar = () => {
        const fecha = new Intl.DateTimeFormat('es-CO', {
            timeZone: 'America/Bogota', weekday: 'short', day: 'numeric',
            month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
            hour12: true
        }).format(new Date());
        reloj.textContent = '🕒 ' + fecha + ' · Colombia';
    };
    actualizar();
    setInterval(actualizar, 30000);
}

function cotizacionListaParaCopiar() {
    return tasasDisponibles &&
        vencimientoCotizacion !== null &&
        Date.now() < vencimientoCotizacion &&
        !btnWhatsApp.disabled &&
        Number(montoCop.value.replace(/\D/g, '')) > 0 &&
        resultado.textContent !== '0,00 Bs' &&
        resultadoBcv.textContent !== 'US$ 0,00';
}

function crearBotonesCopia() {
    if (document.getElementById('copiar-cotizacion-tigre')) return;
    const estilos = document.createElement('style');
    estilos.textContent = `
        #copiar-cotizacion-tigre { display:flex;flex-wrap:wrap;gap:4px;margin:6px 0 0; }
        #copiar-cotizacion-tigre button { cursor:pointer;border:1px solid #d9e2ed;
            background:#fff;color:#163b68;border-radius:10px;padding:10px 12px;
            font:600 12px/1.3 Arial,sans-serif;flex:1 1 28%; }
        #copiar-cotizacion-tigre button.copia-completa { flex-basis:100%; display:flex;
            align-items:center;justify-content:center;gap:9px;min-height:43px;
            background:#163b68;color:white;border-color:#163b68; }
        #copiar-cotizacion-tigre button:disabled { opacity:.5;cursor:not-allowed; }
        #copiar-cotizacion-tigre button:focus-visible { outline:2px solid #d8a84b;outline-offset:2px; }
        #mensaje-copia-tigre { width:100%;color:#35634b;font:500 12px Arial,sans-serif; }
        #mensaje-copia-tigre:empty { display:none; }
    `;
    document.head.appendChild(estilos);
    const grupo = document.createElement('div');
    grupo.id = 'copiar-cotizacion-tigre';
    grupo.innerHTML = `
        <button type="button" class="copia-completa" data-copia="todo"><svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="3" width="13" height="16" rx="3"/><path d="M5 7H4a2 2 0 0 0-2 2v10a3 3 0 0 0 3 3h10a2 2 0 0 0 2-2v-1"/></svg><span>Copiar cotización completa</span></button>
        <div id="mensaje-copia-tigre" role="status" aria-live="polite"></div>
    `;
    btnWhatsApp.insertAdjacentElement('beforebegin', grupo);


    // Copiar individualmente el monto COP
    const botonCop = document.querySelector(
        '[data-copia-moneda="cop"]'
    );

    if (botonCop) {
        botonCop.addEventListener('click', async () => {
            if (!cotizacionListaParaCopiar()) return;

            const valorCop = montoCop.value.trim();
            const aviso = document.getElementById('mensaje-copia-tigre');

            try {
                await navigator.clipboard.writeText(valorCop);
                aviso.textContent = '✓ Pesos colombianos copiados.';
            } catch (error) {
                aviso.textContent = 'No se pudo copiar el monto.';
            }
        });
    }


    // Copiar individualmente el monto VES
    const botonVes = document.querySelector(
        '[data-copia-moneda="ves"]'
    );

    if (botonVes) {
        botonVes.addEventListener('click', async () => {
            if (!cotizacionListaParaCopiar()) return;

            const valorVes = montoVes.value.trim();
            const aviso = document.getElementById('mensaje-copia-tigre');

            try {
                await navigator.clipboard.writeText(valorVes);
                aviso.textContent = '✓ Bolívares copiados.';
            } catch (error) {
                aviso.textContent = 'No se pudo copiar el monto en bolívares.';
            }
        });
    }


    // Copiar individualmente el monto USD BCV
    const botonBcv = document.querySelector(
        '[data-copia-moneda="bcv"]'
    );

    if (botonBcv) {
        botonBcv.addEventListener('click', async () => {
            if (!cotizacionListaParaCopiar()) return;

            const valorBcv = montoBcv.value.trim();
            const aviso = document.getElementById('mensaje-copia-tigre');

            try {
                await navigator.clipboard.writeText(valorBcv);
                aviso.textContent = '✓ Dólares BCV copiados.';
            } catch (error) {
                aviso.textContent = 'No se pudo copiar el monto en dólares BCV.';
            }
        });
    }



    grupo.addEventListener('click', async event => {
        const boton = event.target.closest('button[data-copia]');
        if (!boton || !cotizacionListaParaCopiar()) return;
        const cop = '$' + montoCop.value + ' pesos colombianos';
        const ves = resultado.textContent.trim();
        const usd = resultadoBcv.textContent.trim();
        const datos = {
            cop: montoCop.value,
            ves: ves.replace(/\s*Bs\s*$/, ''),
            usd: usd.replace(/^US\$\s*/, ''),


            todo: [
                '🐯 EL TIGRE 360 | TE CONECTA',
                '',
                `Envías: ${cop}`,
                `Recibes: ${ves}`,
                `Equivalente: ${usd} BCV`
            ].join('\n')



        };
        const aviso = document.getElementById('mensaje-copia-tigre');
        try {
            await navigator.clipboard.writeText(datos[boton.dataset.copia]);
            aviso.textContent = '✓ Copiado. Puedes pegarlo donde necesites.';
        } catch (error) {
            aviso.textContent = 'No se pudo copiar automáticamente. Comprueba los permisos del navegador.';
        }
    });
    actualizarBotonesCopia();
}

function actualizarBotonesCopia() {
    const grupo = document.getElementById('copiar-cotizacion-tigre');
    if (!grupo) return;
    const disponible = cotizacionListaParaCopiar();
    grupo.querySelectorAll('button').forEach(boton => boton.disabled = !disponible);
}

function configurarTemaCotizador() {
    const boton = document.getElementById('alternar-tema-tigre');
    if (!boton) return;
    let tema = 'claro';
    try { tema = localStorage.getItem('tigre360-tema') === 'oscuro' ? 'oscuro' : 'claro'; } catch (_) { }
    const aplicar = () => {
        document.body.classList.toggle('tema-oscuro', tema === 'oscuro');
        boton.textContent = tema === 'oscuro' ? '☀️' : '🌙';
        boton.setAttribute('aria-label', tema === 'oscuro' ? 'Activar modo claro' : 'Activar modo oscuro');
        boton.title = tema === 'oscuro' ? 'Modo claro' : 'Modo oscuro';
        boton.setAttribute('aria-pressed', String(tema === 'oscuro'));
    };
    boton.addEventListener('click', () => {
        tema = tema === 'oscuro' ? 'claro' : 'oscuro';
        try { localStorage.setItem('tigre360-tema', tema); } catch (_) { }
        aplicar();
    });
    aplicar();
}

crearRelojCotizador();
crearBotonesCopia();
configurarTemaCotizador();
[montoCop, montoVes, montoBcv].forEach(campo =>
    campo.addEventListener('input', () => setTimeout(actualizarBotonesCopia, 0))
);

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