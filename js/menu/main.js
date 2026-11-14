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
  const historial = document.getElementById("historial-busqueda");
  if (!busqueda || !mensajeVacio || !contenedor || !historial) return;

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

  const CLAVE_HISTORIAL = "historialBusquedasMenu";
  const MAX_HISTORIAL = 5;

  const leerHistorial = () => {
    try {
      const datos = JSON.parse(localStorage.getItem(CLAVE_HISTORIAL));
      return Array.isArray(datos) ? datos : [];
    } catch {
      return [];
    }
  };

  const guardarHistorial = (lista) =>
    localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(lista));

  const mostrarHistorial = () => {
    const lista = leerHistorial();
    historial.replaceChildren();
    if (lista.length === 0) return;

    lista.forEach((termino) => {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "btn btn-sm btn-outline-secondary";
      boton.textContent = termino;
      boton.addEventListener("click", () => {
        busqueda.value = termino;
        actualizarProductos();
        registrarBusqueda(termino);
      });
      historial.append(boton);
    });

    const borrar = document.createElement("button");
    borrar.type = "button";
    borrar.className = "btn btn-sm btn-link text-danger";
    borrar.textContent = "Borrar historial";
    borrar.addEventListener("click", () => {
      guardarHistorial([]);
      mostrarHistorial();
    });
    historial.append(borrar);
  };

  const registrarBusqueda = (texto) => {
    const termino = texto.trim();
    if (!termino) return;
    const lista = leerHistorial().filter(
      (item) => normalizar(item) !== normalizar(termino),
    );
    lista.unshift(termino);
    guardarHistorial(lista.slice(0, MAX_HISTORIAL));
    mostrarHistorial();
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
  busqueda.addEventListener("change", () => registrarBusqueda(busqueda.value));
  mostrarHistorial();
  if (await cargarMenu()) actualizarProductos();
}
inicializarMenu();
