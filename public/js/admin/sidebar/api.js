const URL_BARRA_LATERAL = "../components/admin-sidebar.html";

export async function obtenerBarraLateral() {
  const respuesta = await fetch(URL_BARRA_LATERAL);
  if (!respuesta.ok) {
    throw new Error(
      `La solicitud de la barra lateral falló (${respuesta.status}).`,
    );
  }

  return respuesta.text();
}
