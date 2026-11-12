# Carlos JR

Sitio web hecho para un supuesto restaurante de comida rapida.

## Estructura

- `index.html`: página principal.
- `pages/`: páginas adicionales del sitio.
- `assets/images/`: imágenes del sitio.
- `css/`: hojas de estilo.
- `fonts/`: fuentes locales.
- `js/`: scripts del sitio.
- `js/compartido/`: módulos reutilizados, como navegación y tema.
- `js/inicio/main.js`: punto de entrada de la página principal.
- `js/menu/`: punto de entrada y lógica de filtros/búsqueda del catálogo.
- `js/registro/`: módulos ES del registro: `main.js` conecta eventos, `validators.js` contiene reglas sin acceso al DOM y `ui.js` muestra errores y estado.

La página de registro usa `type="module"` e importa módulos locales; ábrela con Live Server o con otro servidor HTTP, no directamente con `file://`.
