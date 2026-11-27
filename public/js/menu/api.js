import { urlApi } from "../compartido/rutas.js";

const URL_API = urlApi("platillos.php");
const URL_CATEGORIAS = urlApi("categorias.php");

export async function obtenerCategorias() {
  const respuesta = await fetch(URL_CATEGORIAS);
  if (!respuesta.ok) {
    throw new Error(`La solicitud falló: ${respuesta.status}`);
  }

  const categorias = await respuesta.json();
  if (!Array.isArray(categorias)) {
    throw new Error("Las categorías no tienen el formato esperado.");
  }

  return categorias;
}

export async function obtenerProductos() {
  const respuesta = await fetch(URL_API);
  if (!respuesta.ok) {
    throw new Error(`La solicitud falló: ${respuesta.status}`);
  }

  const productos = await respuesta.json();
  if (!Array.isArray(productos)) {
    throw new Error("Los datos del menú no tienen el formato esperado.");
  }

  return productos;
}
