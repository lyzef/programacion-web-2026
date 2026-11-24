const URL_API = "/api/platillos.php";

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

export async function crearPlatillo(datos) {
  const respuesta = await fetch(URL_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });

  const cuerpo = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw new Error(cuerpo?.error ?? `La solicitud falló: ${respuesta.status}`);
  }

  return cuerpo;
}
