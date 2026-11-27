export function renderizarBarraLateral(contenedor, contenido, paginaActual) {
  contenedor.innerHTML = contenido;

  const enlaceActivo = [
    ...contenedor.querySelectorAll(".admin-nav__link"),
  ].find((enlace) => enlace.dataset.page === paginaActual);

  if (!enlaceActivo) {
    throw new Error(`No hay una opción de navegación para "${paginaActual}".`);
  }

  enlaceActivo.classList.add("admin-nav__link--active");
  enlaceActivo.setAttribute("aria-current", "page");
}

export function mostrarErrorBarraLateral(contenedor) {
  const mensaje = document.createElement("p");
  mensaje.setAttribute("role", "alert");
  mensaje.textContent = "No se pudo cargar la barra lateral.";
  contenedor.replaceChildren(mensaje);
}
