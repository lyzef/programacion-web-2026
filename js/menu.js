document.addEventListener("DOMContentLoaded", () => {
  const productos = Array.from(
    document.querySelectorAll(".producto[data-categoria]"),
  );
  const filtros = Array.from(
    document.querySelectorAll(".catalogo__filtro[data-filtro]"),
  );
  const busqueda = document.getElementById("busqueda-menu");
  const mensajeVacio = document.getElementById("menu-sin-resultados");
  let categoriaActiva = "todas";

  const normalizar = (texto) =>
    texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es");

  const actualizarProductos = () => {
    const consulta = normalizar(busqueda.value.trim());
    let visibles = 0;

    productos.forEach((producto) => {
      const coincideCategoria =
        categoriaActiva === "todas" ||
        producto.dataset.categoria === categoriaActiva;
      const coincideBusqueda = normalizar(producto.textContent).includes(
        consulta,
      );
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
});
