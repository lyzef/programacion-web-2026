export function leerStorage(clave, valorPredeterminado) {
  const valor = localStorage.getItem(clave);
  if (valor === null) return valorPredeterminado;

  try {
    return JSON.parse(valor);
  } catch {
    return valorPredeterminado;
  }
}

export function guardarStorage(clave, valor) {
  localStorage.setItem(clave, JSON.stringify(valor));
}
