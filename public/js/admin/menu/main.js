import {
  actualizarCategoria,
  actualizarPlatillo,
  crearCategoria,
  crearPlatillo,
  desactivarCategoria,
  desactivarPlatillo,
  obtenerCategorias,
  obtenerProductos,
} from "./api.js";
import {
  actualizarResumen,
  cargarOpcionesCategoria,
  datosDeCategoria,
  datosDelFormulario,
  mostrarAviso,
  mostrarErrorLista,
  prepararEdicion,
  prepararEdicionCategoria,
  prepararNuevaCategoria,
  prepararNuevoPlatillo,
  renderizarCategorias,
  renderizarPlatillos,
} from "./ui.js";

const lista = document.getElementById("lista-platillos");
const conteoPlatillos = document.getElementById("conteo-platillos");
const listaCategorias = document.getElementById("lista-categorias");
const conteoCategorias = document.getElementById("conteo-categorias");
const busqueda = document.getElementById("buscar-platillos");
const filtroCategoria = document.getElementById("filtro-categoria");
const filtroDisponibilidad = document.getElementById("filtro-disponibilidad");
const dialogo = document.getElementById("dialogo-platillo");
const formulario = document.getElementById("form-platillo");
const tituloFormulario = document.getElementById("form-platillo-titulo");
const mensajeFormulario = document.getElementById("form-platillo-mensaje");
const dialogoCategoria = document.getElementById("dialogo-categoria");
const formularioCategoria = document.getElementById("form-categoria");
const tituloCategoria = document.getElementById("form-categoria-titulo");
const mensajeCategoria = document.getElementById("form-categoria-mensaje");
const aviso = document.getElementById("aviso-menu");

let platillos = [];
let categorias = [];
let idEnEdicion = null;
let idCategoriaEnEdicion = null;

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
  renderizarCategorias(listaCategorias, conteoCategorias, categorias);
}

async function cargarCatalogo() {
  lista.setAttribute("aria-busy", "true");
  listaCategorias.setAttribute("aria-busy", "true");
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
    listaCategorias.replaceChildren();
    conteoCategorias.textContent = "No se pudieron cargar las categorías";
  } finally {
    lista.setAttribute("aria-busy", "false");
    listaCategorias.setAttribute("aria-busy", "false");
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

function abrirNuevaCategoria() {
  idCategoriaEnEdicion = null;
  prepararNuevaCategoria(
    formularioCategoria,
    mensajeCategoria,
    tituloCategoria,
    categorias,
  );
  dialogoCategoria.showModal();
  formularioCategoria.elements.namedItem("nombre").focus();
}

function abrirEdicionCategoria(categoria) {
  idCategoriaEnEdicion = categoria.id_categoria;
  prepararEdicionCategoria(
    dialogoCategoria,
    formularioCategoria,
    mensajeCategoria,
    tituloCategoria,
    categorias,
    categoria,
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

document
  .getElementById("nueva-categoria")
  .addEventListener("click", abrirNuevaCategoria);

document
  .getElementById("cerrar-dialogo-categoria")
  .addEventListener("click", () => dialogoCategoria.close());

document
  .getElementById("cancelar-categoria")
  .addEventListener("click", () => dialogoCategoria.close());

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

listaCategorias.addEventListener("click", async (evento) => {
  if (!(evento.target instanceof Element)) return;
  const boton = evento.target.closest("button[data-action]");
  if (!boton) return;

  const id = Number(boton.dataset.id);
  const categoria = categorias.find((item) => item.id_categoria === id);
  if (!categoria) return;

  if (boton.dataset.action === "edit-category") {
    abrirEdicionCategoria(categoria);
    return;
  }

  if (boton.dataset.action === "deactivate-category") {
    if (
      !window.confirm(
        `¿Desactivar la categoría "${categoria.nombre}"? Sus platillos dejarán de mostrarse en el menú público.`,
      )
    ) {
      return;
    }

    boton.disabled = true;
    try {
      await desactivarCategoria(id);
      await cargarCatalogo();
      mostrarAviso(aviso, `La categoría "${categoria.nombre}" se desactivó.`);
    } catch (error) {
      console.error("No se pudo desactivar la categoría.", error);
      mostrarAviso(aviso, error.message, true);
    } finally {
      boton.disabled = false;
    }
    return;
  }

  if (boton.dataset.action === "activate-category") {
    boton.disabled = true;
    try {
      await actualizarCategoria(id, {
        nombre: categoria.nombre,
        orden_visualizacion: categoria.orden_visualizacion,
        activa: true,
      });
      await cargarCatalogo();
      mostrarAviso(aviso, `La categoría "${categoria.nombre}" se activó.`);
    } catch (error) {
      console.error("No se pudo activar la categoría.", error);
      mostrarAviso(aviso, error.message, true);
    } finally {
      boton.disabled = false;
    }
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

formularioCategoria.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const boton = formularioCategoria.querySelector('button[type="submit"]');
  boton.disabled = true;
  mensajeCategoria.hidden = true;

  try {
    const datos = datosDeCategoria(formularioCategoria);
    const editando = idCategoriaEnEdicion !== null;
    const categoria = editando
      ? await actualizarCategoria(idCategoriaEnEdicion, datos)
      : await crearCategoria(datos);

    dialogoCategoria.close();
    idCategoriaEnEdicion = null;
    prepararNuevaCategoria(
      formularioCategoria,
      mensajeCategoria,
      tituloCategoria,
      categorias,
    );
    await cargarCatalogo();
    mostrarAviso(
      aviso,
      `La categoría "${categoria.nombre}" se ${editando ? "actualizó" : "creó"} correctamente.`,
    );
  } catch (error) {
    console.error("No se pudo guardar la categoría.", error);
    mensajeCategoria.textContent =
      error instanceof TypeError
        ? "No se pudo conectar con el servidor. Intenta de nuevo más tarde."
        : error.message;
    mensajeCategoria.className = "admin-menu__form-message";
    mensajeCategoria.hidden = false;
  } finally {
    boton.disabled = false;
  }
});

void cargarCatalogo();
