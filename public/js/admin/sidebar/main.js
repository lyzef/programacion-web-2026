import { obtenerBarraLateral } from "./api.js";
import { mostrarErrorBarraLateral, renderizarBarraLateral } from "./ui.js";

const contenedor = document.getElementById("admin-sidebar");

if (!contenedor) {
  throw new Error('No se encontró el contenedor "#admin-sidebar".');
}

async function inicializarBarraLateral() {
  try {
    const contenido = await obtenerBarraLateral();
    const paginaActual = window.location.pathname.split("/").pop();
    renderizarBarraLateral(contenedor, contenido, paginaActual);
  } catch (error) {
    console.error("No se pudo cargar la barra lateral administrativa:", error);
    mostrarErrorBarraLateral(contenedor);
  }
}

void inicializarBarraLateral();
