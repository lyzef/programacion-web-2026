export function inicializarNavegacion() {
  const botonMenu = document.getElementById("btn-menu");
  const menuNav = document.getElementById("menu-nav");
  if (!botonMenu || !menuNav) return;

  botonMenu.addEventListener("click", () => {
    const abierto = menuNav.classList.toggle("activo");
    botonMenu.setAttribute("aria-expanded", String(abierto));
    botonMenu.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
  });

  menuNav.querySelectorAll(".navegacion__link").forEach((enlace) => {
    enlace.addEventListener("click", () => {
      menuNav.classList.remove("activo");
      botonMenu.setAttribute("aria-expanded", "false");
      botonMenu.setAttribute("aria-label", "Abrir menú");
    });
  });
}
