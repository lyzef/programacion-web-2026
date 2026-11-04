export function validarNombre(valor) {
  const nombre = valor.trim();
  if (!nombre) return "Ingresa tu nombre completo.";
  if (nombre.length < 3) return "El nombre debe tener al menos 3 caracteres.";
  return "";
}

export function validarCorreo(valor) {
  const correo = valor.trim();
  if (!correo) return "Ingresa tu correo electrónico.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return "Ingresa un correo electrónico válido.";
  }
  return "";
}

export function validarTelefono(valor) {
  if (!valor) return "Ingresa tu teléfono móvil.";
  if (!/^\d{10}$/.test(valor)) {
    return "El teléfono debe tener exactamente 10 dígitos numéricos.";
  }
  return "";
}

export function validarPassword(valor) {
  if (!valor) return "Ingresa una contraseña.";
  if (valor.length < 6) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }
  if (!/[A-Z]/.test(valor)) {
    return "La contraseña debe incluir al menos una mayúscula.";
  }
  if (!/\d/.test(valor)) {
    return "La contraseña debe incluir al menos un número.";
  }
  return "";
}

export function validarConfirmacion(password, confirmacion) {
  if (!confirmacion) return "Confirma tu contraseña.";
  if (password !== confirmacion) {
    return "Las contraseñas no coinciden.";
  }
  return "";
}
