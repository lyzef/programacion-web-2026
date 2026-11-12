import { inicializarNavegacion } from "../compartido/navegacion.js";
import { cargarMenu } from "./productos.js";

inicializarNavegacion();

export async function inicializarMenu() {
  const filtros = Array.from(
    document.querySelectorAll(".catalogo__filtro[data-filtro]"),
  );
  const busqueda = document.getElementById("busqueda-menu");
  const mensajeVacio = document.getElementById("menu-sin-resultados");
  const contenedor = document.getElementById("productos-menu");
  if (!busqueda || !mensajeVacio || !contenedor) return;

  let categoriaActiva = "todas";

  const normalizar = (texto) =>
    texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es");

  const actualizarProductos = () => {
    const consulta = normalizar(busqueda.value.trim());
    const productos = Array.from(
      contenedor.querySelectorAll(".producto[data-categoria]"),
    );
    let visibles = 0;

    productos.forEach((producto) => {
      const textoProducto = [
        ".producto__etiqueta",
        ".producto__titulo",
        ".producto__descripcion",
        ".producto__precio",
      ]
        .map((selector) => producto.querySelector(selector)?.textContent ?? "")
        .join(" ");
      const coincideCategoria =
        categoriaActiva === "todas" ||
        producto.dataset.categoria === categoriaActiva;
      const coincideBusqueda = normalizar(textoProducto).includes(consulta);
      const mostrar = coincideCategoria && coincideBusqueda;

      producto.hidden = !mostrar;
      if (mostrar) visibles += 1;
    });

    mensajeVacio.hidden = visibles > 0;
  };

  filtros.forEach((filtro) => {
    filtro.addEventListener("click", () => {
      categoriaActiva = filtro.dataset.filtro;

      filtros.forEach((opcion) => {
        const activo = opcion === filtro;
        opcion.classList.toggle("btn-warning", activo);
        opcion.classList.toggle("btn-outline-warning", !activo);
        opcion.setAttribute("aria-pressed", String(activo));
      });

      actualizarProductos();
    });
  });

  busqueda.addEventListener("input", actualizarProductos);
  if (await cargarMenu()) actualizarProductos();
}

inicializarMenu();
