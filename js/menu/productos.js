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
  etiqueta.textContent = platillo.etiqueta;

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

export async function cargarMenu() {
  const contenedor = document.getElementById("productos-menu");
  const estado = document.getElementById("menu-estado");
  if (!contenedor || !estado) return false;

  estado.hidden = false;
  estado.className = "catalogo__estado alert alert-info text-center";
  estado.setAttribute("role", "status");
  estado.textContent = "Cargando el menú...";
  contenedor.setAttribute("aria-busy", "true");
  const inicioCarga = Date.now();
  const esperarCargaMinima = async () => {
    const tiempoRestante = 500 - (Date.now() - inicioCarga);
    if (tiempoRestante > 0) {
      await new Promise((resolve) => setTimeout(resolve, tiempoRestante));
    }
  };

  try {
    const respuesta = await fetch("../js/menu/menu.json");
    if (!respuesta.ok) {
      throw new Error(`La solicitud falló: ${respuesta.status}`);
    }

    const platillos = await respuesta.json();
    if (!Array.isArray(platillos)) {
      throw new Error("Los datos del menú no tienen el formato esperado.");
    }

    await esperarCargaMinima();
    contenedor.append(...platillos.map(crearTarjeta));
    contenedor.setAttribute("aria-busy", "false");
    estado.className = "catalogo__estado alert alert-success text-center";
    estado.textContent = "El menú se cargó correctamente.";
    await new Promise((resolve) => setTimeout(resolve, 1000));
    estado.hidden = true;
    return true;
  } catch (error) {
    console.error("No se pudo cargar el menú.", error);
    await esperarCargaMinima();
    estado.className = "catalogo__estado alert alert-danger text-center";
    estado.setAttribute("role", "alert");
    estado.textContent =
      "No se pudo cargar el menú. Intenta de nuevo más tarde.";
    return false;
  } finally {
    contenedor.setAttribute("aria-busy", "false");
  }
}
