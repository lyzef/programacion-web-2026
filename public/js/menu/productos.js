export async function obtenerProductos() {
  const respuesta = await fetch("/api/data/menu.json");
  if (!respuesta.ok) {
    throw new Error(`La solicitud falló: ${respuesta.status}`);
  }

  const productos = await respuesta.json();
  if (!Array.isArray(productos)) {
    throw new Error("Los datos del menú no tienen el formato esperado.");
  }

  return productos;
}
