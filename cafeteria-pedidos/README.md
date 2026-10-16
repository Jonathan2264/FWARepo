# ☕ Sistema de Pedidos para una Cafetería

Proyecto de Reposición — **Desarrollo Web con Frameworks** · Tercer Año de Desarrollo de Software, Sección C
Colegio Español Padre Arrupe · Año lectivo 2026 · Docente: Katherine Abigail Canales de Rivera

**Autor:** _(tu nombre completo)_

---

## 1. Planteamiento de la problemática (Fase 1)

**Problema.** En una cafetería pequeña los pedidos suelen anotarse en papel o de memoria. Eso provoca errores en el total, pedidos olvidados, confusión entre mesas y ninguna forma de saber qué está pendiente en cocina.

**Contexto.** El personal necesita registrar rápidamente lo que pide cada mesa, ver el estado de cada pedido y mantener actualizado el menú (precios y disponibilidad), todo desde un celular.

**Solución propuesta.** Una aplicación móvil en React Native que permite administrar el menú, armar pedidos con un carrito y darles seguimiento (pendiente → preparando → listo → entregado). La app se comunica con una API REST que guarda todo en una base de datos Supabase (PostgreSQL), así la información queda centralizada.

**Objetivo general.** Desarrollar una aplicación móvil con React Native, conectada mediante una API REST a una base de datos, que permita gestionar el menú y los pedidos de una cafetería.

**Objetivos específicos**
1. Diseñar una base de datos relacional para productos, categorías y pedidos.
2. Implementar una API REST con operaciones CRUD, validaciones y manejo de errores.
3. Desarrollar una app móvil con navegación, formularios, listados y consumo de la API.
4. Probar el funcionamiento de cada operación y documentar el proyecto.

**Justificación.** Reduce errores humanos, agiliza la atención, centraliza la información y es una solución realista para emprendimientos locales.

---

## 2. Diseño de la aplicación (Fase 2)

| Pantalla | Descripción |
|---|---|
| **Menú** (tab) | Lista de productos con búsqueda y filtro por categoría. Agregar al carrito, editar y eliminar. Botón **+** para crear un producto. |
| **Formulario de producto** | Crear / editar producto: nombre, descripción, precio, categoría y disponibilidad. |
| **Carrito** (tab) | Productos elegidos, cantidades, total, y datos del pedido (cliente, mesa, notas). Confirma el pedido. |
| **Pedidos** (tab) | Historial de pedidos con filtro por estado y recarga con *pull to refresh*. |
| **Detalle del pedido** | Productos y total; avanzar estado, editar datos, cancelar o eliminar. |

**Navegación:** `Stack` (Inicio, ProductoForm, PedidoDetalle) que contiene un `Bottom Tabs` (Menú, Carrito, Pedidos).

**Flujo principal:** Menú → agregar productos → Carrito → completar datos → Confirmar → Pedidos → Detalle → cambiar estado hasta *Entregado*.

---

## 3. Base de datos (Fase 3)

Motor: **Supabase (PostgreSQL)**. Scripts en [`database/`](database/).

```
categorias 1 ──── N productos 1 ──── N detalle_pedido N ──── 1 pedidos
```

| Tabla | Campos principales |
|---|---|
| `categorias` | `id` PK, `nombre` (único), `created_at` |
| `productos` | `id` PK, `nombre`, `descripcion`, `precio numeric(8,2) > 0`, `categoria_id` FK → categorias (SET NULL), `disponible boolean`, `created_at` |
| `pedidos` | `id` PK, `cliente`, `mesa (1-99)`, `notas`, `estado` (pendiente/preparando/listo/entregado/cancelado), `total`, `created_at` |
| `detalle_pedido` | `id` PK, `pedido_id` FK → pedidos (CASCADE), `producto_id` FK → productos (SET NULL), `nombre_producto`, `precio_unitario`, `cantidad > 0`, `subtotal` |

**Decisiones de diseño**
- `detalle_pedido` guarda **nombre y precio al momento de la compra**: si luego cambia el precio o se elimina un producto, el historial no se altera.
- Restricciones `CHECK` a nivel de BD (precio > 0, cantidad > 0, estados válidos).
- Row Level Security activado: la app móvil **no** accede directo a la BD, solo la API con la clave `service_role`.

---

## 4. API REST (Fases 4 y 6)

Node.js + Express + `@supabase/supabase-js`. Base: `http://<IP>:3000/api`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/categorias` | Lista categorías |
| POST | `/categorias` | Crea categoría |
| GET | `/productos` | Lista productos (`?categoria_id=`, `?q=`) |
| GET | `/productos/:id` | Un producto |
| POST | `/productos` | Crea producto |
| PUT | `/productos/:id` | Actualiza producto |
| DELETE | `/productos/:id` | Elimina producto |
| GET | `/pedidos` | Lista pedidos con su detalle (`?estado=`) |
| GET | `/pedidos/:id` | Un pedido con detalle |
| POST | `/pedidos` | Crea pedido `{cliente, mesa, notas?, items:[{producto_id, cantidad}]}` |
| PUT | `/pedidos/:id` | Edita cliente, mesa, notas o estado |
| PATCH | `/pedidos/:id/estado` | Cambia el estado |
| DELETE | `/pedidos/:id` | Elimina pedido (y su detalle) |

**Validación y errores.** Códigos HTTP `400` (datos inválidos), `404` (no existe), `409` (duplicado), `500` (error interno). Todas las respuestas de error tienen la forma `{ "error": "mensaje" }`. Los precios y el total de un pedido **se calculan en el servidor** a partir de la BD, no se aceptan desde el cliente. Si falla el guardado del detalle, el pedido se revierte.

---

## 5. Aplicación React Native (Fases 5 y 6)

- **React Native + Expo**, **React Navigation** (stack + tabs), **Context API** para el carrito.
- `src/api/client.js` centraliza las peticiones HTTP (`fetch`) con *timeout* y mensajes de error legibles.
- Validación en el formulario antes de enviar, y de nuevo en la API.
- Manejo de estados de carga, vacío y error con botón *Reintentar*.

### Estructura del repositorio

```
cafeteria-pedidos/
├── README.md
├── database/
│   ├── schema.sql          # Tablas, restricciones, índices y RLS
│   └── seed.sql            # Datos de ejemplo
├── api/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js        # Servidor Express
│       ├── supabase.js     # Cliente de Supabase
│       ├── utils.js        # Validaciones y errores
│       └── routes/         # categorias.js, productos.js, pedidos.js
├── app/
│   ├── App.js
│   ├── .env.example
│   └── src/
│       ├── config.js       # URL de la API
│       ├── theme.js
│       ├── api/client.js   # Consumo de la API
│       ├── context/CarritoContext.js
│       ├── navigation/AppNavigator.js
│       ├── components/UI.js
│       └── screens/        # Menu, ProductoForm, Carrito, Pedidos, PedidoDetalle
└── docs/GUION_VIDEO.md
```

---

## 6. Configuración y ejecución

**Requisitos:** Node.js 18+, npm, Git, Visual Studio Code, app **Expo Go** en el celular (o un emulador) y una cuenta gratuita de Supabase.

### Paso 1 — Base de datos (Supabase)
1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor** ejecuta `database/schema.sql` y luego `database/seed.sql`.
3. En **Project Settings → API** copia la **Project URL** y la clave **service_role**.

### Paso 2 — API
```bash
cd api
npm install
cp .env.example .env      # en Windows: copy .env.example .env
# edita .env con tu SUPABASE_URL y SUPABASE_SERVICE_KEY
npm start
```
Prueba en el navegador: `http://localhost:3000/api/productos` debe devolver el menú.

### Paso 3 — App móvil
La carpeta `app/` contiene el código fuente (`App.js` y `src/`). Falta el proyecto Expo base (package.json, app.json, assets), que se genera así:
```bash
npx create-expo-app@latest app-base --template blank
# copia package.json, app.json, index.js y assets/ de app-base hacia app/
cd app
npm install
npx expo install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack react-native-screens react-native-safe-area-context
cp .env.example .env      # y pon la IP de tu PC:  EXPO_PUBLIC_API_URL=http://TU-IP:3000/api
npx expo start
```
Escanea el QR con **Expo Go**. El celular y la computadora deben estar en la **misma red Wi-Fi**.

> Para saber tu IP local: `ipconfig` (Windows) o `ifconfig` / `ip a` (Linux/Mac). En emulador Android usa `http://10.0.2.2:3000/api`.

---

## 7. Pruebas y resultados (Fase 7)

| # | Prueba | Resultado esperado | Resultado |
|---|---|---|---|
| 1 | Navegar entre Menú, Carrito y Pedidos | Cambian las pestañas sin errores | ☐ |
| 2 | Abrir formulario de producto y volver | Navega y regresa al menú | ☐ |
| 3 | Crear producto con nombre vacío / precio 0 | Muestra errores de validación, no envía | ☐ |
| 4 | Crear producto válido | Aparece en el menú | ☐ |
| 5 | Listar / buscar / filtrar productos | Se muestran los datos de la BD | ☐ |
| 6 | Editar un producto | Cambios reflejados en el menú | ☐ |
| 7 | Eliminar un producto | Desaparece del menú | ☐ |
| 8 | Confirmar pedido sin cliente o mesa | Muestra validación | ☐ |
| 9 | Confirmar pedido válido | Se crea; total correcto; carrito se vacía | ☐ |
| 10 | Marcar producto "no disponible" y pedirlo | La API lo rechaza | ☐ |
| 11 | Cambiar estado de un pedido | El estado y la lista se actualizan | ☐ |
| 12 | Editar cliente/mesa/notas del pedido | Datos actualizados | ☐ |
| 13 | Eliminar pedido | Desaparece de la lista | ☐ |
| 14 | Apagar la API y abrir la app | Muestra error con "Reintentar" | ☐ |
| 15 | Verificar datos en Supabase (Table Editor) | Coinciden con lo visto en la app | ☐ |

_(Marca ☐ → ✅ conforme pruebes cada caso. Agrega capturas en `docs/capturas/`.)_

---

## 8. Decisiones técnicas

- **API intermedia en lugar de conectar la app directo a Supabase:** cumple la arquitectura pedida (app → API → BD), mantiene la clave secreta fuera del celular y centraliza validaciones.
- **Express + supabase-js:** simple, conocido y suficiente para el alcance.
- **Context API** para el carrito: estado compartido entre pestañas sin librerías extra.
- **Precio y total calculados en el servidor:** evita manipulación desde el cliente.
- **Snapshot de nombre/precio en `detalle_pedido`:** conserva el histórico.

## 9. Posibles mejoras
Autenticación por roles (mesero/cocina), actualización en tiempo real con Supabase Realtime, imágenes de productos, reportes de ventas y despliegue de la API en la nube.
