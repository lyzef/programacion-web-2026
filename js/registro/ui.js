export function limpiarErrores(formulario) {
  formulario.querySelectorAll("[data-error-para]").forEach((mensaje) => {
    mensaje.textContent = "";
    mensaje.hidden = true;
  });

  Array.from(formulario.elements).forEach((campo) => {
    if (!campo.name) return;
    campo.setAttribute("aria-invalid", "false");
    campo.classList.remove("is-invalid");
  });

  const estado = formulario.querySelector("#registro-estado");
  estado.textContent = "";
  estado.hidden = true;
  estado.classList.remove("registro-estado--error", "registro-estado--exito");
}

export function mostrarErrores(formulario) {
  Array.from(formulario.elements).forEach((campo) => {
    if (!campo.name) return;

    const mensaje = formulario.querySelector(
      `[data-error-para="${campo.name}"]`,
    );
    const invalido = !campo.validity.valid;
    campo.setAttribute("aria-invalid", String(invalido));
    campo.classList.toggle("is-invalid", invalido);
    if (!mensaje) return;

    mensaje.textContent = invalido ? campo.validationMessage : "";
    mensaje.hidden = !invalido;
  });
}

export function mostrarEstado(formulario, mensaje, tipo) {
  const estado = formulario.querySelector("#registro-estado");
  estado.textContent = mensaje;
  estado.hidden = false;
  estado.classList.toggle("registro-estado--error", tipo === "error");
  estado.classList.toggle("registro-estado--exito", tipo === "exito");
}
