import { resolverRutaImagen } from "../../compartido/rutas.js";

function normalizar(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
}

function celda(texto, clase) {
  const elemento = document.createElement("td");
  elemento.textContent = texto;
  if (clase) elemento.className = clase;
  return elemento;
}

function agregarOpcion(select, value, label) {
  const opcion = document.createElement("option");
  opcion.value = String(value);
  opcion.textContent = label;
  select.append(opcion);
}

export function cargarOpcionesCategoria(
  filtroCategoria,
  formulario,
  categorias,
) {
  const categoriaSeleccionada = filtroCategoria.value;
  const categoriaFormulario = formulario.elements.namedItem("id_categoria");

  filtroCategoria.replaceChildren();
  agregarOpcion(filtroCategoria, "", "Todas las categorías");
  categoriaFormulario.replaceChildren();
  agregarOpcion(categoriaFormulario, "", "Selecciona una categoría");

  categorias.forEach((categoria) => {
    const etiquetaFiltro = categoria.activa
      ? categoria.nombre
      : `${categoria.nombre} (Inactiva)`;
    agregarOpcion(filtroCategoria, categoria.id_categoria, etiquetaFiltro);
    if (categoria.activa) {
      agregarOpcion(
        categoriaFormulario,
        categoria.id_categoria,
        categoria.nombre,
      );
    }
  });

  filtroCategoria.value = categoriaSeleccionada;
}

export function actualizarResumen(platillos) {
  const disponibles = platillos.filter((platillo) => platillo.disponible).length;
  document.getElementById("metric-activos").textContent =
    String(platillos.length);
  document.getElementById("metric-disponibles").textContent =
    String(disponibles);
  document.getElementById("metric-agotados").textContent =
    String(platillos.length - disponibles);
  document.getElementById("metric-destacados").textContent = String(
    platillos.filter((platillo) => platillo.es_favorito).length,
  );
}

function crearCeldaPlatillo(platillo) {
  const elemento = document.createElement("td");
  const presentacion = document.createElement("div");
  presentacion.className = "admin-menu__dish";

  const imagen = document.createElement("img");
  imagen.src = resolverRutaImagen(platillo.imagen_url);
  imagen.alt = "";
  imagen.loading = "lazy";

  const detalle = document.createElement("div");
  const nombre = document.createElement("strong");
  nombre.textContent = platillo.nombre;
  const etiquetas = document.createElement("small");

  if (platillo.es_promocion) {
    const promo = document.createElement("b");
    promo.className = "tag tag--yellow";
    promo.textContent = "Promo";
    etiquetas.append(promo);
  }
  if (platillo.es_favorito) {
    const destacado = document.createElement("b");
    destacado.className = "tag tag--green";
    destacado.textContent = "Destacado";
    etiquetas.append(destacado);
  }
  if (!platillo.es_promocion && !platillo.es_favorito) {
    etiquetas.textContent = `ID ${platillo.id_platillo}`;
  }

  detalle.append(nombre, etiquetas);
  presentacion.append(imagen, detalle);
  elemento.append(presentacion);
  return elemento;
}

function crearFila(platillo) {
  const fila = document.createElement("tr");
  const categoria = document.createElement("span");
  categoria.className = "category";
  categoria.textContent =
    platillo.categoria_activa === false
      ? `${platillo.categoria} (Inactiva)`
      : platillo.categoria;

  const celdaCategoria = document.createElement("td");
  celdaCategoria.append(categoria);

  const disponibilidad = document.createElement("span");
  disponibilidad.className = `availability ${
    platillo.disponible ? "availability--on" : "availability--off"
  }`;
  const punto = document.createElement("i");
  punto.setAttribute("aria-hidden", "true");
  disponibilidad.append(
    punto,
    document.createTextNode(platillo.disponible ? "Disponible" : "Agotado"),
  );
  const celdaDisponibilidad = document.createElement("td");
  celdaDisponibilidad.append(disponibilidad);

  const editar = document.createElement("button");
  editar.type = "button";
  editar.className = "action action--edit";
  editar.dataset.action = "edit";
  editar.dataset.id = String(platillo.id_platillo);
  editar.textContent = "✎ Editar";

  const desactivar = document.createElement("button");
  desactivar.type = "button";
  desactivar.className = "action action--delete";
  desactivar.dataset.action = "deactivate";
  desactivar.dataset.id = String(platillo.id_platillo);
  desactivar.textContent = "× Desactivar";

  const acciones = document.createElement("div");
  acciones.className = "actions";
  acciones.append(editar, desactivar);
  const celdaAcciones = document.createElement("td");
  celdaAcciones.append(acciones);

  fila.append(
    crearCeldaPlatillo(platillo),
    celdaCategoria,
    celda(platillo.descripcion),
    celda(
      new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
      }).format(platillo.precio),
    ),
    celdaDisponibilidad,
    celdaAcciones,
  );
  return fila;
}

export function renderizarPlatillos({
  lista,
  conteoPlatillos,
  platillos,
  busqueda,
  categoria,
  disponibilidad,
}) {
  const consulta = normalizar(busqueda.trim());
  const filtrados = platillos.filter((platillo) => {
    const coincideBusqueda = normalizar(
      `${platillo.nombre} ${platillo.descripcion} ${platillo.categoria}`,
    ).includes(consulta);
    const coincideCategoria =
      !categoria || String(platillo.id_categoria) === categoria;
    const coincideDisponibilidad =
      disponibilidad === "" ||
      String(Number(platillo.disponible)) === disponibilidad;
    return (
      coincideBusqueda && coincideCategoria && coincideDisponibilidad
    );
  });

  lista.replaceChildren();
  if (filtrados.length === 0) {
    const fila = document.createElement("tr");
    const mensaje = platillos.length
      ? "No hay platillos que coincidan con los filtros."
      : "No hay platillos activos en el catálogo.";
    const celdaVacia = celda(mensaje);
    celdaVacia.colSpan = 6;
    fila.append(celdaVacia);
    lista.append(fila);
  } else {
    lista.append(...filtrados.map(crearFila));
  }

  conteoPlatillos.textContent = `Mostrando ${filtrados.length} de ${platillos.length} platillos activos`;
}

export function mostrarAviso(aviso, texto, esError = false) {
  aviso.textContent = texto;
  aviso.className = `admin-menu__notice${esError ? " admin-menu__notice--error" : ""}`;
  aviso.hidden = false;
}

export function mostrarErrorLista(lista, conteoPlatillos, texto) {
  lista.replaceChildren();
  const fila = document.createElement("tr");
  const celdaError = celda(texto);
  celdaError.colSpan = 6;
  fila.append(celdaError);
  lista.append(fila);
  conteoPlatillos.textContent = "No se pudo cargar el catálogo";
}

export function prepararNuevoPlatillo(
  formulario,
  mensajeFormulario,
  tituloFormulario,
  platillos,
) {
  formulario.reset();
  formulario.elements.namedItem("disponible").checked = true;
  formulario.elements.namedItem("orden_visualizacion").value = String(
    platillos.reduce(
      (mayor, platillo) =>
        Math.max(mayor, platillo.orden_visualizacion || 0),
      0,
    ) + 1,
  );
  const selectorImagen = formulario.elements.namedItem("imagen_url");
  Array.from(selectorImagen.options).forEach((opcion) => {
    if (opcion.dataset.imagenActual) opcion.remove();
  });
  mensajeFormulario.hidden = true;
  tituloFormulario.textContent = "Nuevo platillo";
  formulario.querySelector('button[type="submit"]').textContent =
    "Guardar platillo";
}

export function prepararEdicion(
  dialogo,
  formulario,
  mensajeFormulario,
  tituloFormulario,
  platillos,
  platillo,
) {
  prepararNuevoPlatillo(
    formulario,
    mensajeFormulario,
    tituloFormulario,
    platillos,
  );
  tituloFormulario.textContent = "Editar platillo";
  formulario.querySelector('button[type="submit"]').textContent =
    "Guardar cambios";

  const campos = formulario.elements;
  campos.namedItem("nombre").value = platillo.nombre;
  campos.namedItem("descripcion").value = platillo.descripcion;
  campos.namedItem("precio").value = String(platillo.precio);
  campos.namedItem("id_categoria").value = String(platillo.id_categoria);
  campos.namedItem("disponible").checked = platillo.disponible;
  campos.namedItem("es_promocion").checked = platillo.es_promocion;
  campos.namedItem("es_favorito").checked = platillo.es_favorito;
  campos.namedItem("orden_visualizacion").value = String(
    platillo.orden_visualizacion,
  );

  const selectorImagen = campos.namedItem("imagen_url");
  const imagenNormalizada = resolverRutaImagen(platillo.imagen_url);
  if (
    !Array.from(selectorImagen.options).some(
      (opcion) => opcion.value === imagenNormalizada,
    )
  ) {
    const opcionActual = document.createElement("option");
    opcionActual.value = imagenNormalizada;
    opcionActual.textContent = "Imagen actual";
    opcionActual.dataset.imagenActual = "true";
    selectorImagen.append(opcionActual);
  }
  selectorImagen.value = imagenNormalizada;
  dialogo.showModal();
  campos.namedItem("nombre").focus();
}

export function datosDelFormulario(formulario) {
  const campos = formulario.elements;
  return {
    id_categoria: Number(campos.namedItem("id_categoria").value),
    nombre: campos.namedItem("nombre").value.trim(),
    descripcion: campos.namedItem("descripcion").value.trim(),
    precio: Number(campos.namedItem("precio").value),
    imagen_url: campos.namedItem("imagen_url").value,
    disponible: campos.namedItem("disponible").checked,
    es_promocion: campos.namedItem("es_promocion").checked,
    es_favorito: campos.namedItem("es_favorito").checked,
    orden_visualizacion: Number(
      campos.namedItem("orden_visualizacion").value,
    ),
  };
}

function crearFilaCategoria(categoria) {
  const fila = document.createElement("tr");

  const orden = document.createElement("strong");
  orden.textContent = String(categoria.orden_visualizacion);
  const celdaOrden = document.createElement("td");
  celdaOrden.append(orden);

  const nombre = document.createElement("strong");
  nombre.textContent = categoria.nombre;
  const celdaNombre = document.createElement("td");
  celdaNombre.append(nombre);

  const estado = document.createElement("span");
  estado.className = `availability ${
    categoria.activa ? "availability--on" : "availability--off"
  }`;
  const punto = document.createElement("i");
  punto.setAttribute("aria-hidden", "true");
  estado.append(
    punto,
    document.createTextNode(categoria.activa ? "Activa" : "Inactiva"),
  );
  const celdaEstado = document.createElement("td");
  celdaEstado.append(estado);

  const editar = document.createElement("button");
  editar.type = "button";
  editar.className = "action action--edit";
  editar.dataset.action = "edit-category";
  editar.dataset.id = String(categoria.id_categoria);
  editar.textContent = "✎ Editar";

  const alternarEstado = document.createElement("button");
  alternarEstado.type = "button";
  alternarEstado.className = categoria.activa
    ? "action action--delete"
    : "action action--activate";
  alternarEstado.dataset.action = categoria.activa
    ? "deactivate-category"
    : "activate-category";
  alternarEstado.dataset.id = String(categoria.id_categoria);
  alternarEstado.textContent = categoria.activa ? "× Desactivar" : "✓ Activar";

  const acciones = document.createElement("div");
  acciones.className = "actions";
  acciones.append(editar, alternarEstado);
  const celdaAcciones = document.createElement("td");
  celdaAcciones.append(acciones);

  fila.append(celdaOrden, celdaNombre, celdaEstado, celdaAcciones);
  return fila;
}

export function renderizarCategorias(lista, conteo, categorias) {
  lista.replaceChildren();
  if (categorias.length === 0) {
    const fila = document.createElement("tr");
    const vacia = celda("No hay categorías registradas.");
    vacia.colSpan = 4;
    fila.append(vacia);
    lista.append(fila);
  } else {
    lista.append(...categorias.map(crearFilaCategoria));
  }

  const activas = categorias.filter((categoria) => categoria.activa).length;
  conteo.textContent = `${activas} activas de ${categorias.length} categorías`;
}

export function prepararNuevaCategoria(
  formulario,
  mensajeFormulario,
  tituloFormulario,
  categorias,
) {
  formulario.reset();
  formulario.elements.namedItem("activa").checked = true;
  formulario.elements.namedItem("orden_visualizacion").value = String(
    categorias.reduce(
      (mayor, categoria) =>
        Math.max(mayor, categoria.orden_visualizacion || 0),
      0,
    ) + 1,
  );
  mensajeFormulario.hidden = true;
  tituloFormulario.textContent = "Nueva categoría";
  formulario.querySelector('button[type="submit"]').textContent =
    "Guardar categoría";
}

export function prepararEdicionCategoria(
  dialogo,
  formulario,
  mensajeFormulario,
  tituloFormulario,
  categorias,
  categoria,
) {
  prepararNuevaCategoria(
    formulario,
    mensajeFormulario,
    tituloFormulario,
    categorias,
  );
  tituloFormulario.textContent = "Editar categoría";
  formulario.querySelector('button[type="submit"]').textContent =
    "Guardar cambios";

  const campos = formulario.elements;
  campos.namedItem("nombre").value = categoria.nombre;
  campos.namedItem("orden_visualizacion").value = String(
    categoria.orden_visualizacion,
  );
  campos.namedItem("activa").checked = Boolean(categoria.activa);

  dialogo.showModal();
  campos.namedItem("nombre").focus();
}

export function datosDeCategoria(formulario) {
  const campos = formulario.elements;
  return {
    nombre: campos.namedItem("nombre").value.trim(),
    orden_visualizacion: Number(
      campos.namedItem("orden_visualizacion").value,
    ),
    activa: campos.namedItem("activa").checked,
  };
}
