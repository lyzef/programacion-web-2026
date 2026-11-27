import { urlApi } from "../../compartido/rutas.js";

const URL_API = urlApi("platillos.php");
const URL_CATEGORIAS = urlApi("categorias.php");

async function solicitar(url, metodo = "GET", datos) {
  const opciones = { method: metodo };
  if (datos) {
    opciones.headers = { "Content-Type": "application/json" };
    opciones.body = JSON.stringify(datos);
  }

  let respuesta;
  try {
    respuesta = await fetch(url, opciones);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new TypeError(
        "No se pudo conectar con el servidor. Intenta de nuevo más tarde.",
      );
    }
    throw error;
  }

  let cuerpo;
  try {
    cuerpo = await respuesta.json();
  } catch {
    throw new Error(
      respuesta.ok
        ? "La API devolvió una respuesta JSON inválida."
        : `La solicitud falló: ${respuesta.status}`,
    );
  }

  if (!respuesta.ok) {
    const mensaje =
      cuerpo && typeof cuerpo === "object" && typeof cuerpo.error === "string"
        ? cuerpo.error
        : `La solicitud falló: ${respuesta.status}`;
    throw new Error(mensaje);
  }

  return cuerpo;
}

function validarLista(datos, nombre) {
  if (!Array.isArray(datos)) {
    throw new Error(`La respuesta de ${nombre} no tiene el formato esperado.`);
  }
  return datos;
}

function validarPlatillo(datos) {
  if (
    !datos ||
    typeof datos !== "object" ||
    Array.isArray(datos) ||
    typeof datos.nombre !== "string"
  ) {
    throw new Error("La API no devolvió un platillo válido.");
  }
  return datos;
}

function validarCategoria(datos) {
  if (
    !datos ||
    typeof datos !== "object" ||
    Array.isArray(datos) ||
    typeof datos.nombre !== "string"
  ) {
    throw new Error("La API no devolvió una categoría válida.");
  }
  return datos;
}

export async function obtenerCategorias() {
  const url = `${URL_CATEGORIAS}?todas=1`;
  return validarLista(await solicitar(url), "categorías");
}

export async function crearCategoria(datos) {
  return validarCategoria(await solicitar(URL_CATEGORIAS, "POST", datos));
}

export async function actualizarCategoria(id, datos) {
  const url = `${URL_CATEGORIAS}?id=${encodeURIComponent(id)}`;
  return validarCategoria(await solicitar(url, "PUT", datos));
}

export async function desactivarCategoria(id) {
  const url = `${URL_CATEGORIAS}?id=${encodeURIComponent(id)}`;
  return solicitar(url, "DELETE");
}

export async function obtenerProductos() {
  const url = `${URL_API}?incluir_categorias_inactivas=1`;
  return validarLista(await solicitar(url), "el menú");
}

export async function crearPlatillo(datos) {
  return validarPlatillo(await solicitar(URL_API, "POST", datos));
}

export async function actualizarPlatillo(id, datos) {
  const url = `${URL_API}?id=${encodeURIComponent(id)}`;
  return validarPlatillo(await solicitar(url, "PUT", datos));
}

export async function desactivarPlatillo(id) {
  const url = `${URL_API}?id=${encodeURIComponent(id)}`;
  return solicitar(url, "DELETE");
}
