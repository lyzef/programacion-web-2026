const BASE_API = new URL("../../../api/", import.meta.url);

export function urlApi(recurso) {
  return new URL(recurso, BASE_API).href;
}

export function resolverRutaImagen(ruta) {
  if (!ruta) return "";
  const limpia = String(ruta).trim();
  if (/^(https?:)?\/\//i.test(limpia) || limpia.startsWith("data:")) {
    return limpia;
  }
  if (limpia.startsWith("/assets/")) {
    return `..${limpia}`;
  }
  if (limpia.startsWith("assets/")) {
    return `../${limpia}`;
  }
  return limpia;
}
