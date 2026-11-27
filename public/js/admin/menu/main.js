import {
  actualizarPlatillo,
  crearPlatillo,
  desactivarPlatillo,
  obtenerCategorias,
  obtenerProductos,
} from "./api.js";
import {
  actualizarResumen,
  cargarOpcionesCategoria,
  datosDelFormulario,
  mostrarAviso,
  mostrarErrorLista,
  prepararEdicion,
  prepararNuevoPlatillo,
  renderizarPlatillos,
} from "./ui.js";

const lista = document.getElementById("lista-platillos");
const conteoPlatillos = document.getElementById("conteo-platillos");
const busqueda = document.getElementById("buscar-platillos");
const filtroCategoria = document.getElementById("filtro-categoria");
const filtroDisponibilidad = document.getElementById("filtro-disponibilidad");
const dialogo = document.getElementById("dialogo-platillo");
const formulario = document.getElementById("form-platillo");
const tituloFormulario = document.getElementById("form-platillo-titulo");
const mensajeFormulario = document.getElementById("form-platillo-mensaje");
const aviso = document.getElementById("aviso-menu");

let platillos = [];
let categorias = [];
let idEnEdicion = null;

function actualizarVista() {
  actualizarResumen(platillos);
  renderizarPlatillos({
    lista,
    conteoPlatillos,
    platillos,
    busqueda: busqueda.value,
    categoria: filtroCategoria.value,
    disponibilidad: filtroDisponibilidad.value,
  });
}

async function cargarCatalogo() {
  lista.setAttribute("aria-busy", "true");
  try {
    const [categoriasNuevas, platillosNuevos] = await Promise.all([
      obtenerCategorias(),
      obtenerProductos(),
    ]);
    categorias = categoriasNuevas;
    platillos = platillosNuevos;
    cargarOpcionesCategoria(filtroCategoria, formulario, categorias);
    actualizarVista();
  } catch (error) {
    console.error("No se pudo cargar el catálogo del menú.", error);
    mostrarErrorLista(
      lista,
      conteoPlatillos,
      "No se pudo cargar el catálogo. Verifica la conexión con el servidor y la base de datos.",
    );
  } finally {
    lista.setAttribute("aria-busy", "false");
  }
}

function abrirNuevoPlatillo() {
  idEnEdicion = null;
  prepararNuevoPlatillo(
    formulario,
    mensajeFormulario,
    tituloFormulario,
    platillos,
  );
  dialogo.showModal();
  formulario.elements.namedItem("nombre").focus();
}

function abrirEdicion(platillo) {
  idEnEdicion = platillo.id_platillo;
  prepararEdicion(
    dialogo,
    formulario,
    mensajeFormulario,
    tituloFormulario,
    platillos,
    platillo,
  );
}

document
  .getElementById("nuevo-platillo")
  .addEventListener("click", abrirNuevoPlatillo);

document
  .getElementById("cerrar-dialogo-platillo")
  .addEventListener("click", () => dialogo.close());

document
  .getElementById("cancelar-platillo")
  .addEventListener("click", () => dialogo.close());

busqueda.addEventListener("input", actualizarVista);
filtroCategoria.addEventListener("change", actualizarVista);
filtroDisponibilidad.addEventListener("change", actualizarVista);

lista.addEventListener("click", async (evento) => {
  if (!(evento.target instanceof Element)) return;
  const boton = evento.target.closest("button[data-action]");
  if (!boton) return;

  const id = Number(boton.dataset.id);
  const platillo = platillos.find((item) => item.id_platillo === id);
  if (!platillo) return;

  if (boton.dataset.action === "edit") {
    abrirEdicion(platillo);
    return;
  }

  if (
    boton.dataset.action !== "deactivate" ||
    !window.confirm(`¿Desactivar "${platillo.nombre}" del menú?`)
  ) {
    return;
  }

  boton.disabled = true;
  try {
    await desactivarPlatillo(id);
    await cargarCatalogo();
    mostrarAviso(aviso, `"${platillo.nombre}" se desactivó del menú.`);
  } catch (error) {
    console.error("No se pudo desactivar el platillo.", error);
    mostrarAviso(aviso, error.message, true);
  } finally {
    boton.disabled = false;
  }
});

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const boton = formulario.querySelector('button[type="submit"]');
  boton.disabled = true;
  mensajeFormulario.hidden = true;

  try {
    const datos = datosDelFormulario(formulario);
    const editando = idEnEdicion !== null;
    const platillo = editando
      ? await actualizarPlatillo(idEnEdicion, datos)
      : await crearPlatillo(datos);

    dialogo.close();
    idEnEdicion = null;
    prepararNuevoPlatillo(
      formulario,
      mensajeFormulario,
      tituloFormulario,
      platillos,
    );
    await cargarCatalogo();
    mostrarAviso(
      aviso,
      `"${platillo.nombre}" se ${editando ? "actualizó" : "agregó"} al menú.`,
    );
  } catch (error) {
    console.error("No se pudo guardar el platillo.", error);
    mensajeFormulario.textContent =
      error instanceof TypeError
        ? "No se pudo conectar con el servidor. Intenta de nuevo más tarde."
        : error.message;
    mensajeFormulario.className = "admin-menu__form-message";
    mensajeFormulario.hidden = false;
  } finally {
    boton.disabled = false;
  }
});

void cargarCatalogo();
