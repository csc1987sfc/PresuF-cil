// ESTADO INICIAL DE LA APLICACIÓN
const ESTADO_POR_DEFECTO = {
    nomina: 1800.00,
    gastosFijos: [
        { id: '1', nombre: 'Alquiler/Hipoteca', monto: 550.00, maxRango: 1200 },
        { id: '2', nombre: 'Recibo de la Luz', monto: 85.00, maxRango: 300 },
        { id: '3', nombre: 'Agua y Basura', monto: 35.00, maxRango: 100 },
        { id: '4', nombre: 'Internet y Móvil', monto: 45.00, maxRango: 100 }
    ],
    miTarjeta: 120.50,
    tarjetaMujer: 85.20,
    historicoMiTarjeta: [45.50, 75.00],
    historicoTarjetaMujer: [35.20, 50.00]
};

let appState = {};

// CARGAR Y GUARDAR DATOS EN LOCALSTORAGE
function cargarEstado() {
    const datosGuardados = localStorage.getItem('presufacil_state');
    if (datosGuardados) {
        try {
            appState = JSON.parse(datosGuardados);
        } catch (e) {
            console.error("Error al cargar datos, usando valores por defecto", e);
            appState = JSON.parse(JSON.stringify(ESTADO_POR_DEFECTO));
        }
    } else {
        appState = JSON.parse(JSON.stringify(ESTADO_POR_DEFECTO));
        guardarEstado();
    }
}

function guardarEstado() {
    localStorage.setItem('presufacil_state', JSON.stringify(appState));
}

// ELEMENTOS DEL DOM
const txtBalance = document.getElementById('txt-balance');
const cardBalance = document.getElementById('card-balance');
const txtResumenNomina = document.getElementById('txt-resumen-nomina');
const txtResumenFijos = document.getElementById('txt-resumen-fijos');
const txtResumenTarjetas = document.getElementById('txt-resumen-tarjetas');

const inputNomina = document.getElementById('input-nomina');

const contenedorGastosFijos = document.getElementById('contenedor-gastos-fijos');
const txtTotalFijos = document.getElementById('txt-total-fijos');

const txtTotalMiTarjeta = document.getElementById('txt-total-mi-tarjeta');
const inputAddMiTarjeta = document.getElementById('input-add-mi-tarjeta');
const btnAddMiTarjeta = document.getElementById('btn-add-mi-tarjeta');
const txtHistoricoMiTarjeta = document.getElementById('historico-mi-tarjeta');
const btnClearMiTarjeta = document.getElementById('btn-clear-mi-tarjeta');

const txtTotalTarjetaMujer = document.getElementById('txt-total-tarjeta-mujer');
const inputAddTarjetaMujer = document.getElementById('input-add-tarjeta-mujer');
const btnAddTarjetaMujer = document.getElementById('btn-add-tarjeta-mujer');
const txtHistoricoTarjetaMujer = document.getElementById('historico-tarjeta-mujer');
const btnClearTarjetaMujer = document.getElementById('btn-clear-tarjeta-mujer');

const btnResetApp = document.getElementById('btn-reset-app');

// MODAL GASTO FIJO
const modalGasto = document.getElementById('modal-gasto');
const btnAddGasto = document.getElementById('btn-add-gasto');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelarModal = document.getElementById('btn-cancelar-modal');
const formGasto = document.getElementById('form-gasto');
const modalNombre = document.getElementById('modal-nombre');
const modalMonto = document.getElementById('modal-monto');
const modalMaxRango = document.getElementById('modal-max-rango');
const sugerenciasGasto = document.querySelectorAll('.sugerencia-gasto');

// FORMATO DE MONEDA
function formatearMoneda(valor) {
    return Number(valor).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// RENDERIZADO PRINCIPAL DE LA APLICACIÓN
function render() {
    // 1. Nómina
    if (document.activeElement !== inputNomina) {
        inputNomina.value = appState.nomina || '';
    }

    // 2. Gastos Fijos
    renderGastosFijos();

    // 3. Tarjetas
    txtTotalMiTarjeta.innerText = `${formatearMoneda(appState.miTarjeta)} €`;
    txtTotalTarjetaMujer.innerText = `${formatearMoneda(appState.tarjetaMujer)} €`;
    renderHistoricoTarjetas();

    // 4. Cálculos de la fórmula en tiempo real
    const totalFijos = appState.gastosFijos.reduce((sum, g) => sum + Number(g.monto), 0);
    const totalTarjetas = Number(appState.miTarjeta) + Number(appState.tarjetaMujer);
    const balanceReal = Number(appState.nomina) - totalFijos - totalTarjetas;

    // Actualizar textos resumen
    txtTotalFijos.innerText = `${formatearMoneda(totalFijos)} €`;
    txtResumenNomina.innerText = `${formatearMoneda(appState.nomina)} €`;
    txtResumenFijos.innerText = `-${formatearMoneda(totalFijos)} €`;
    txtResumenTarjetas.innerText = `-${formatearMoneda(totalTarjetas)} €`;

    // Dinero Disponible
    txtBalance.innerText = formatearMoneda(balanceReal);

    // Ajustes visuales de la tarjeta de balance según el saldo
    cardBalance.classList.remove('balance-warning', 'balance-negative');
    if (balanceReal < 0) {
        cardBalance.classList.add('balance-negative');
    } else if (balanceReal < 150) {
        cardBalance.classList.add('balance-warning');
    }

    // Guardar los cambios
    guardarEstado();
}

// DIBUJAR GASTOS FIJOS EN LA LISTA
function renderGastosFijos() {
    contenedorGastosFijos.innerHTML = '';

    if (appState.gastosFijos.length === 0) {
        const placeholder = document.createElement('div');
        placeholder.className = "py-8 text-center border-2 border-dashed border-slate-100 rounded-xl";
        placeholder.innerHTML = `
            <p class="text-xs text-slate-400">No hay gastos fijos todavía.</p>
            <button id="btn-add-gasto-placeholder" class="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700">
                <i class="fa-solid fa-plus"></i> Añade el primero
            </button>
        `;
        contenedorGastosFijos.appendChild(placeholder);
        document.getElementById('btn-add-gasto-placeholder').addEventListener('click', abrirModal);
        return;
    }

    appState.gastosFijos.forEach(gasto => {
        const item = document.createElement('div');
        item.className = "item-gasto bg-slate-50 border border-slate-100/80 rounded-xl p-3.5 space-y-2.5 transition-all hover:bg-slate-50/50";
        item.dataset.id = gasto.id;

        item.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="font-bold text-slate-700 text-xs tracking-wide">${gasto.nombre}</span>
                <button class="btn-eliminar-gasto text-slate-300 hover:text-red-500 transition-colors p-1" title="Eliminar ${gasto.nombre}">
                    <i class="fa-regular fa-trash-can text-xs"></i>
                </button>
            </div>
            <div class="flex items-center gap-3">
                <input type="range" min="0" max="${gasto.maxRango}" step="1" value="${gasto.monto}" class="slider-gasto flex-1 h-1.5">
                <div class="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 max-w-[85px] shadow-sm">
                    <input type="number" step="0.01" min="0" value="${gasto.monto}" class="input-monto-gasto w-full text-xs font-bold text-slate-800 focus:outline-none text-right">
                    <span class="text-[10px] font-bold text-slate-400">€</span>
                </div>
            </div>
        `;

        const slider = item.querySelector('.slider-gasto');
        const numberInput = item.querySelector('.input-monto-gasto');
        const btnEliminar = item.querySelector('.btn-eliminar-gasto');

        slider.addEventListener('input', (e) => {
            const nuevoMonto = parseFloat(e.target.value);
            numberInput.value = nuevoMonto;
            actualizarMontoGasto(gasto.id, nuevoMonto);
        });

        numberInput.addEventListener('input', (e) => {
            let nuevoMonto = parseFloat(e.target.value);
            if (isNaN(nuevoMonto) || nuevoMonto < 0) nuevoMonto = 0;
            slider.value = nuevoMonto;
            actualizarMontoGasto(gasto.id, nuevoMonto);
        });

        numberInput.addEventListener('blur', (e) => {
            if (e.target.value === '') {
                numberInput.value = 0;
                slider.value = 0;
                actualizarMontoGasto(gasto.id, 0);
            }
        });

        btnEliminar.addEventListener('click', () => {
            eliminarGasto(gasto.id, gasto.nombre);
        });

        contenedorGastosFijos.appendChild(item);
    });
}

// MOSTRAR HISTORIAL SIMPLIFICADO DE TARJETAS
function renderHistoricoTarjetas() {
    if (appState.historicoMiTarjeta && appState.historicoMiTarjeta.length > 0) {
        const ultimos = appState.historicoMiTarjeta.slice(-3).map(v => `${formatearMoneda(v)}€`).join(' + ');
        txtHistoricoMiTarjeta.innerText = `Historial: ${ultimos}`;
    } else {
        txtHistoricoMiTarjeta.innerText = "Sin gastos este mes";
    }

    if (appState.historicoTarjetaMujer && appState.historicoTarjetaMujer.length > 0) {
        const ultimos = appState.historicoTarjetaMujer.slice(-3).map(v => `${formatearMoneda(v)}€`).join(' + ');
        txtHistoricoTarjetaMujer.innerText = `Historial: ${ultimos}`;
    } else {
        txtHistoricoTarjetaMujer.innerText = "Sin gastos este mes";
    }
}

// ACTUALIZACIONES DE ESTADO
function actualizarMontoGasto(id, monto) {
    const gasto = appState.gastosFijos.find(g => g.id === id);
    if (gasto) {
        gasto.monto = Number(monto);
        render();
    }
}

function eliminarGasto(id, nombre) {
    if (confirm(`¿Estás seguro de que quieres quitar el recibo de "${nombre}" de tus gastos fijos?`)) {
        appState.gastosFijos = appState.gastosFijos.filter(g => g.id !== id);
        render();
    }
}

// FUNCIONES DEL MODAL
function abrirModal() {
    modalGasto.classList.remove('hidden');
    void modalGasto.offsetWidth; // Refuerza reflow
    modalGasto.classList.add('modal-active', 'modal-show');
    modalNombre.focus();
}

function cerrarModal() {
    modalGasto.classList.remove('modal-show');
    setTimeout(() => {
        modalGasto.classList.add('hidden');
        modalGasto.classList.remove('modal-active');
        formGasto.reset();
    }, 200);
}

// LISTENERS Y CONFIGURACIÓN INICIAL
document.addEventListener('DOMContentLoaded', () => {
    cargarEstado();
    render();

    // 1. Escuchador de la nómina
    inputNomina.addEventListener('input', (e) => {
        let val = parseFloat(e.target.value);
        if (isNaN(val) || val < 0) val = 0;
        appState.nomina = val;
        render();
    });

    // 2. Control de Modales para Gastos Fijos
    btnAddGasto.addEventListener('click', abrirModal);
    btnCloseModal.addEventListener('click', cerrarModal);
    btnCancelarModal.addEventListener('click', cerrarModal);

    // Selección de sugerencias rápidas
    sugerenciasGasto.forEach(btn => {
        btn.addEventListener('click', () => {
            modalNombre.value = btn.innerText;
            if (btn.innerText === 'Luz' || btn.innerText === 'Agua' || btn.innerText === 'Internet') {
                modalMaxRango.value = "300";
            } else if (btn.innerText === 'Coche' || btn.innerText === 'Hipoteca') {
                modalMaxRango.value = "1200";
            } else {
                modalMaxRango.value = "100";
            }
        });
    });

    // Envío del formulario de nuevo gasto fijo
    formGasto.addEventListener('submit', (e) => {
        e.preventDefault();
        const nombre = modalNombre.value.trim();
        const monto = parseFloat(modalMonto.value);
        const maxRango = parseInt(modalMaxRango.value);

        if (nombre && !isNaN(monto) && monto >= 0) {
            appState.gastosFijos.push({
                id: Date.now().toString(),
                nombre: nombre,
                monto: monto,
                maxRango: Math.max(maxRango, Math.ceil(monto))
            });
            cerrarModal();
            render();
        }
    });

    // 3. Tarjeta: Mi Tarjeta (Sumar)
    btnAddMiTarjeta.addEventListener('click', () => {
        const valor = parseFloat(inputAddMiTarjeta.value);
        if (!isNaN(valor) && valor > 0) {
            appState.miTarjeta = Number((Number(appState.miTarjeta) + valor).toFixed(2));
            if (!appState.historicoMiTarjeta) appState.historicoMiTarjeta = [];
            appState.historicoMiTarjeta.push(valor);
            inputAddMiTarjeta.value = '';
            render();
        }
    });

    inputAddMiTarjeta.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') btnAddMiTarjeta.click();
    });

    btnClearMiTarjeta.addEventListener('click', () => {
        if (confirm("¿Quieres poner a cero el acumulador de tu tarjeta?")) {
            appState.miTarjeta = 0;
            appState.historicoMiTarjeta = [];
            render();
        }
    });

    // Tarjeta: Tarjeta de mi Mujer (Sumar)
    btnAddTarjetaMujer.addEventListener('click', () => {
        const valor = parseFloat(inputAddTarjetaMujer.value);
        if (!isNaN(valor) && valor > 0) {
            appState.tarjetaMujer = Number((Number(appState.tarjetaMujer) + valor).toFixed(2));
            if (!appState.historicoTarjetaMujer) appState.historicoTarjetaMujer = [];
            appState.historicoTarjetaMujer.push(valor);
            inputAddTarjetaMujer.value = '';
            render();
        }
    });

    inputAddTarjetaMujer.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') btnAddTarjetaMujer.click();
    });

    btnClearTarjetaMujer.addEventListener('click', () => {
        if (confirm("¿Quieres poner a cero el acumulador de la tarjeta de tu mujer?")) {
            appState.tarjetaMujer = 0;
            appState.historicoTarjetaMujer = [];
            render();
        }
    });

    // 4. Reinicio Completo
    btnResetApp.addEventListener('click', () => {
        if (confirm("¿Estás seguro de que deseas borrar todos tus datos y reiniciar el mes?")) {
            localStorage.removeItem('presufacil_state');
            cargarEstado();
            render();
        }
    });
});


