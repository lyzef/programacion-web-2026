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
    agregarOpcion(filtroCategoria, categoria.id_categoria, categoria.nombre);
    agregarOpcion(
      categoriaFormulario,
      categoria.id_categoria,
      categoria.nombre,
    );
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
  imagen.src = platillo.imagen_url;
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
  categoria.textContent = platillo.categoria;

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
  if (
    !Array.from(selectorImagen.options).some(
      (opcion) => opcion.value === platillo.imagen_url,
    )
  ) {
    const opcionActual = document.createElement("option");
    opcionActual.value = platillo.imagen_url;
    opcionActual.textContent = "Imagen actual";
    opcionActual.dataset.imagenActual = "true";
    selectorImagen.append(opcionActual);
  }
  selectorImagen.value = platillo.imagen_url;
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
