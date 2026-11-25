const sidebarMount = document.getElementById("admin-sidebar");

if (!sidebarMount) {
  throw new Error('No se encontró el contenedor "#admin-sidebar".');
}

try {
  const response = await fetch("../components/admin-sidebar.html");

  if (!response.ok) {
    throw new Error(
      `La solicitud de la barra lateral falló (${response.status}).`,
    );
  }

  sidebarMount.innerHTML = await response.text();

  const currentPage = window.location.pathname.split("/").pop();
  const activeLink = [
    ...sidebarMount.querySelectorAll(".admin-nav__link"),
  ].find((link) => link.dataset.page === currentPage);

  if (!activeLink) {
    throw new Error(`No hay una opción de navegación para "${currentPage}".`);
  }

  activeLink.classList.add("admin-nav__link--active");
  activeLink.setAttribute("aria-current", "page");
} catch (error) {
  console.error("No se pudo cargar la barra lateral administrativa:", error);
  const errorMessage = document.createElement("p");
  errorMessage.setAttribute("role", "alert");
  errorMessage.textContent = "No se pudo cargar la barra lateral.";
  sidebarMount.replaceChildren(errorMessage);
}
