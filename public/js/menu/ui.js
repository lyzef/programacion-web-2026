const NOMBRES_CATEGORIA = {
  hamburguesas: "Hamburguesas",
  combos: "Combos",
  snacks: "Snacks",
  bebidas: "Bebidas",
};

function normalizar(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
}

function crearTarjeta(platillo) {
  const articulo = document.createElement("article");
  articulo.className = "col producto";
  articulo.dataset.categoria = platillo.categoria;

  const tarjeta = document.createElement("div");
  tarjeta.className = "card h-100 producto__tarjeta";

  const imagen = document.createElement("img");
  imagen.className = "producto__imagen card-img-top";
  imagen.src = platillo.imagen;
  imagen.alt = platillo.nombre;
  imagen.width = 320;
  imagen.height = 200;
  imagen.loading = "lazy";

  const contenido = document.createElement("div");
  contenido.className = "card-body d-flex flex-column";

  const etiqueta = document.createElement("span");
  etiqueta.className = "producto__etiqueta badge align-self-start";
  etiqueta.textContent =
    NOMBRES_CATEGORIA[platillo.categoria] ?? platillo.categoria;

  const nombre = document.createElement("h2");
  nombre.className = "producto__titulo card-title";
  nombre.textContent = platillo.nombre;

  const descripcion = document.createElement("p");
  descripcion.className = "producto__descripcion card-text";
  descripcion.textContent = platillo.descripcion;

  const pie = document.createElement("div");
  pie.className = "producto__pie";

  const precio = document.createElement("p");
  precio.className = "producto__precio card-text";
  precio.textContent = `$${platillo.precio}`;

  const pedir = document.createElement("a");
  pedir.className = "producto__pedir";
  pedir.href = "../index.html#delivery";
  pedir.textContent = "Pedir";

  pie.append(precio, pedir);
  contenido.append(etiqueta, nombre, descripcion, pie);
  tarjeta.append(imagen, contenido);
  articulo.append(tarjeta);

  return articulo;
}

export function renderizarProductos(contenedor, productos) {
  contenedor.replaceChildren(...productos.map(crearTarjeta));
}

export function mostrarEstadoMenu(estado, mensaje, tipo) {
  const estados = {
    cargando: { clase: "alert-info", rol: "status" },
    exito: { clase: "alert-success", rol: "status" },
    error: { clase: "alert-danger", rol: "alert" },
  };
  const configuracion = estados[tipo];

  estado.hidden = false;
  estado.className = `catalogo__estado alert ${configuracion.clase} text-center`;
  estado.setAttribute("role", configuracion.rol);
  estado.textContent = mensaje;
}

export function ocultarEstadoMenu(estado) {
  estado.hidden = true;
}

export function actualizarProductosUI(
  contenedor,
  mensajeVacio,
  consulta,
  categoriaActiva,
) {
  const busquedaNormalizada = normalizar(consulta);
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
    const coincideBusqueda =
      normalizar(textoProducto).includes(busquedaNormalizada);
    const mostrar = coincideCategoria && coincideBusqueda;

    producto.hidden = !mostrar;
    if (mostrar) visibles += 1;
  });

  mensajeVacio.hidden = visibles > 0;
}

export function actualizarFiltrosUI(filtros, filtroActivo) {
  filtros.forEach((filtro) => {
    const activo = filtro === filtroActivo;
    filtro.classList.toggle("btn-warning", activo);
    filtro.classList.toggle("btn-outline-warning", !activo);
    filtro.setAttribute("aria-pressed", String(activo));
  });
}

export function renderizarHistorialUI(
  contenedor,
  terminos,
  alSeleccionar,
  alBorrar,
) {
  contenedor.replaceChildren();
  if (terminos.length === 0) return;

  terminos.forEach((termino) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "btn btn-sm btn-outline-secondary";
    boton.textContent = termino;
    boton.addEventListener("click", () => alSeleccionar(termino));
    contenedor.append(boton);
  });

  const borrar = document.createElement("button");
  borrar.type = "button";
  borrar.className = "btn btn-sm btn-link text-danger";
  borrar.textContent = "Borrar historial";
  borrar.addEventListener("click", alBorrar);
  contenedor.append(borrar);
}
