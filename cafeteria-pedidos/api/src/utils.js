const ESTADOS = ['pendiente', 'preparando', 'listo', 'entregado', 'cancelado'];

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Express 4 no captura errores en funciones async: este wrapper los envía al manejador de errores
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

function parseId(valor) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'El id debe ser un número entero positivo');
  }
  return id;
}

// Traduce errores de Supabase/Postgres a errores HTTP
function checkDb(error) {
  if (!error) return;
  if (error.code === '23503') throw new HttpError(400, 'Referencia inválida (categoría o producto inexistente)');
  if (error.code === '23505') throw new HttpError(409, 'Ya existe un registro con ese valor');
  if (error.code === '23514') throw new HttpError(400, 'Un valor no cumple las restricciones de la base de datos');
  throw new HttpError(500, `Error de base de datos: ${error.message}`);
}

const redondear = (n) => Math.round(n * 100) / 100;
const textoONull = (v, max) => {
  if (v === undefined || v === null) return null;
  const t = String(v).trim().slice(0, max);
  return t === '' ? null : t;
};

function validarProducto(body = {}) {
  const errores = [];

  const nombre = String(body.nombre ?? '').trim();
  if (nombre.length < 2 || nombre.length > 80) errores.push('El nombre debe tener entre 2 y 80 caracteres');

  const precio = Number(body.precio);
  if (body.precio === undefined || body.precio === null || body.precio === '' ||
      !Number.isFinite(precio) || precio <= 0 || precio > 999) {
    errores.push('El precio debe ser un número mayor que 0 y menor o igual a 999');
  }

  let categoria_id = body.categoria_id ?? null;
  if (categoria_id !== null) {
    categoria_id = Number(categoria_id);
    if (!Number.isInteger(categoria_id) || categoria_id <= 0) errores.push('categoria_id inválido');
  }

  if (errores.length) throw new HttpError(400, errores.join('. '));

  return {
    nombre,
    descripcion: textoONull(body.descripcion, 200),
    precio: redondear(precio),
    categoria_id,
    disponible: body.disponible === undefined ? true : Boolean(body.disponible),
  };
}

function validarPedidoNuevo(body = {}) {
  const errores = [];

  const cliente = String(body.cliente ?? '').trim();
  if (cliente.length < 2 || cliente.length > 60) errores.push('El nombre del cliente debe tener entre 2 y 60 caracteres');

  const mesa = Number(body.mesa);
  if (!Number.isInteger(mesa) || mesa < 1 || mesa > 99) errores.push('La mesa debe ser un número entero entre 1 y 99');

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) errores.push('El pedido debe incluir al menos un producto');
  if (items.length > 50) errores.push('El pedido no puede tener más de 50 líneas');

  const itemsOk = items.map((it) => ({
    producto_id: Number(it?.producto_id),
    cantidad: Number(it?.cantidad),
  }));
  if (itemsOk.some((it) => !Number.isInteger(it.producto_id) || it.producto_id <= 0 ||
                           !Number.isInteger(it.cantidad) || it.cantidad < 1 || it.cantidad > 20)) {
    errores.push('Cada producto debe tener producto_id válido y cantidad entera entre 1 y 20');
  }

  if (errores.length) throw new HttpError(400, errores.join('. '));
  return { cliente, mesa, notas: textoONull(body.notas, 200), items: itemsOk };
}

// Edición parcial: solo valida los campos que vienen en el body
function validarPedidoEdicion(body = {}) {
  const errores = [];
  const cambios = {};

  if (body.cliente !== undefined) {
    const c = String(body.cliente).trim();
    if (c.length < 2 || c.length > 60) errores.push('El nombre del cliente debe tener entre 2 y 60 caracteres');
    cambios.cliente = c;
  }
  if (body.mesa !== undefined) {
    const m = Number(body.mesa);
    if (!Number.isInteger(m) || m < 1 || m > 99) errores.push('La mesa debe ser un número entero entre 1 y 99');
    cambios.mesa = m;
  }
  if (body.notas !== undefined) cambios.notas = textoONull(body.notas, 200);
  if (body.estado !== undefined) {
    if (!ESTADOS.includes(body.estado)) errores.push(`Estado inválido. Valores permitidos: ${ESTADOS.join(', ')}`);
    cambios.estado = body.estado;
  }
  if (Object.keys(cambios).length === 0 && errores.length === 0) errores.push('No se envió ningún campo para actualizar');

  if (errores.length) throw new HttpError(400, errores.join('. '));
  return cambios;
}

module.exports = {
  ESTADOS, HttpError, asyncHandler, parseId, checkDb, redondear,
  validarProducto, validarPedidoNuevo, validarPedidoEdicion,
};
