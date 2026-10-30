/* Modo claro / oscuro */
(function () {
  const CLAVE = "tema";
  const CLASE = "modo-oscuro";

  function leerGuardado() {
    try {
      return localStorage.getItem(CLAVE);
    } catch {
      return null;
    }
  }

  function guardar(valor) {
    try {
      localStorage.setItem(CLAVE, valor);
    } catch {}
  }

  function actualizarBoton(oscuro) {
    const boton = document.getElementById("boton-tema");
    if (!boton) return;
    boton.textContent = oscuro ? "☀️" : "🌙";
    boton.setAttribute("aria-pressed", String(oscuro));
    boton.setAttribute(
      "aria-label",
      oscuro ? "Activar modo claro" : "Activar modo oscuro",
    );
  }

  function aplicar(oscuro) {
    document.body.classList.toggle(CLASE, oscuro);
    actualizarBoton(oscuro);
  }

  // Tema inicial
  const guardado = leerGuardado();
  const prefiereOscuro = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;
  aplicar(guardado ? guardado === "oscuro" : prefiereOscuro);

  // Botón
  document.addEventListener("DOMContentLoaded", () => {
    const boton = document.getElementById("boton-tema");
    actualizarBoton(document.body.classList.contains(CLASE));
    if (!boton) return;

    boton.addEventListener("click", () => {
      const oscuro = !document.body.classList.contains(CLASE);
      aplicar(oscuro);
      guardar(oscuro ? "oscuro" : "claro");
    });
  });
})();

document.addEventListener('DOMContentLoaded', () => {
  const btnMenu = document.getElementById('btn-menu');
  const menuNav = document.getElementById('menu-nav');

  if (btnMenu && menuNav) {
    btnMenu.addEventListener('click', () => {
      menuNav.classList.toggle('activo');
    });

    const enlacesMenu = menuNav.querySelectorAll('.navegacion__link');
    enlacesMenu.forEach(enlace => {
      enlace.addEventListener('click', () => {
        menuNav.classList.remove('activo');
      });
    });
  }
});
