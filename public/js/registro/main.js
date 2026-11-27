import {
  validarConfirmacion,
  validarCorreo,
  validarNombre,
  validarPassword,
  validarTelefono,
} from "./validators.js";
import Swal from "../../../node_modules/sweetalert2/dist/sweetalert2.esm.all.js";
import { limpiarErrores, mostrarErrores, mostrarEstado } from "./ui.js";

const formulario = document.querySelector("#form-registro");
if (!formulario) {
  throw new Error("No se encontró el formulario de registro.");
}

let mostrarMensajes = false;

function validarCampos() {
  const campos = formulario.elements;

  campos.nombre.setCustomValidity(validarNombre(campos.nombre.value));
  campos.correo.setCustomValidity(validarCorreo(campos.correo.value));
  campos.telefono.setCustomValidity(validarTelefono(campos.telefono.value));
  campos.password.setCustomValidity(validarPassword(campos.password.value));
  campos.confirmar_password.setCustomValidity(
    validarConfirmacion(campos.password.value, campos.confirmar_password.value),
  );

  return formulario.checkValidity();
}

function actualizarErrores() {
  if (!mostrarMensajes) return;
  validarCampos();
  mostrarErrores(formulario);
}

formulario.addEventListener("input", actualizarErrores);
formulario.addEventListener("change", actualizarErrores);

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();
  limpiarErrores(formulario);
  mostrarMensajes = true;

  if (!validarCampos()) {
    mostrarErrores(formulario);
    formulario.querySelector(":invalid").focus();
    return;
  }

  const datos = Object.fromEntries(new FormData(formulario));
  mostrarEstado(
    formulario,
    "¡Gracias, " + datos.nombre + "! Tu cuenta se ha creado correctamente.",
    "exito",
  );

  Swal.fire({
    icon: "success",
    title: "¡Cuenta creada!",
    text: "Gracias, " + datos.nombre + ". Tu cuenta se ha creado correctamente.",
    confirmButtonText: "Ir al menú",
    confirmButtonColor: "#fbbf24",
  }).then(() => {
    formulario.reset();
    mostrarMensajes = false;
    limpiarErrores(formulario);
    window.location.href = "menu.html";
  });
});

