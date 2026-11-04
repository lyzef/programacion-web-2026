const CLAVE_TEMA = "tema";
const CLASE_TEMA_OSCURO = "modo-oscuro";

function leerTemaGuardado() {
  try {
    return localStorage.getItem(CLAVE_TEMA);
  } catch {
    return null;
  }
}

function guardarTema(tema) {
  try {
    localStorage.setItem(CLAVE_TEMA, tema);
  } catch {}
}

function actualizarBotonTema(boton, oscuro) {
  if (!boton) return;

  boton.textContent = oscuro ? "☀️" : "🌙";
  boton.setAttribute("aria-pressed", String(oscuro));
  boton.setAttribute(
    "aria-label",
    oscuro ? "Activar modo claro" : "Activar modo oscuro",
  );
}

export function inicializarTema() {
  const boton = document.getElementById("boton-tema");
  const temaGuardado = leerTemaGuardado();
  const prefiereOscuro = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;
  const temaOscuro = temaGuardado
    ? temaGuardado === "oscuro"
    : prefiereOscuro;

  document.body.classList.toggle(CLASE_TEMA_OSCURO, temaOscuro);
  actualizarBotonTema(boton, temaOscuro);

  boton?.addEventListener("click", () => {
    const oscuro = !document.body.classList.contains(CLASE_TEMA_OSCURO);
    document.body.classList.toggle(CLASE_TEMA_OSCURO, oscuro);
    actualizarBotonTema(boton, oscuro);
    guardarTema(oscuro ? "oscuro" : "claro");
  });
}
