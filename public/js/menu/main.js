import { inicializarNavegacion } from "../compartido/navegacion.js";
import { guardarStorage, leerStorage } from "../compartido/storage.js";
import { obtenerProductos } from "./productos.js";
import {
  actualizarFiltrosUI,
  actualizarProductosUI,
  mostrarEstadoMenu,
  ocultarEstadoMenu,
  renderizarHistorialUI,
  renderizarProductos,
} from "./ui.js";

inicializarNavegacion();

export async function inicializarMenu() {
  const filtros = Array.from(
    document.querySelectorAll(".catalogo__filtro[data-filtro]"),
  );
  const busqueda = document.getElementById("busqueda-menu");
  const mensajeVacio = document.getElementById("menu-sin-resultados");
  const contenedor = document.getElementById("productos-menu");
  const historial = document.getElementById("historial-busqueda");
  if (!busqueda || !mensajeVacio || !contenedor || !historial) return;

  let categoriaActiva = "todas";

  const actualizarProductos = () => {
    actualizarProductosUI(
      contenedor,
      mensajeVacio,
      busqueda.value.trim(),
      categoriaActiva,
    );
  };

  const normalizar = (texto) =>
    texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es");

  const CLAVE_HISTORIAL = "historialBusquedasMenu";
  const MAX_HISTORIAL = 5;

  const leerHistorial = () => {
    const datos = leerStorage(CLAVE_HISTORIAL, []);
    return Array.isArray(datos) ? datos : [];
  };

  const guardarHistorial = (lista) =>
    guardarStorage(CLAVE_HISTORIAL, lista);

  const mostrarHistorial = () =>
    renderizarHistorialUI(
      historial,
      leerHistorial(),
      (termino) => {
        busqueda.value = termino;
        actualizarProductos();
        registrarBusqueda(termino);
      },
      () => {
        guardarHistorial([]);
        mostrarHistorial();
      },
    );

  const registrarBusqueda = (texto) => {
    const termino = texto.trim();
    if (!termino) return;
    const lista = leerHistorial().filter(
      (item) => normalizar(item) !== normalizar(termino),
    );
    lista.unshift(termino);
    guardarHistorial(lista.slice(0, MAX_HISTORIAL));
    mostrarHistorial();
  };

  filtros.forEach((filtro) => {
    filtro.addEventListener("click", () => {
      categoriaActiva = filtro.dataset.filtro;
      actualizarFiltrosUI(filtros, filtro);
      actualizarProductos();
    });
  });

  busqueda.addEventListener("input", actualizarProductos);
  busqueda.addEventListener("change", () => registrarBusqueda(busqueda.value));
  mostrarHistorial();
  if (await cargarMenu()) actualizarProductos();
}

async function cargarMenu() {
  const contenedor = document.getElementById("productos-menu");
  const estado = document.getElementById("menu-estado");
  if (!contenedor || !estado) return false;

  contenedor.setAttribute("aria-busy", "true");
  const inicioCarga = Date.now();
  const esperarCargaMinima = async () => {
    const tiempoRestante = 500 - (Date.now() - inicioCarga);
    if (tiempoRestante > 0) {
      await new Promise((resolve) => setTimeout(resolve, tiempoRestante));
    }
  };

  mostrarEstadoMenu(estado, "Cargando el menú...", "cargando");

  try {
    const productos = await obtenerProductos();
    await esperarCargaMinima();
    renderizarProductos(contenedor, productos);
    mostrarEstadoMenu(estado, "El menú se cargó correctamente.", "exito");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    ocultarEstadoMenu(estado);
    return true;
  } catch (error) {
    console.error("No se pudo cargar el menú.", error);
    await esperarCargaMinima();
    mostrarEstadoMenu(
      estado,
      "No se pudo cargar el menú. Intenta de nuevo más tarde.",
      "error",
    );
    return false;
  } finally {
    contenedor.setAttribute("aria-busy", "false");
  }
}
inicializarMenu();
