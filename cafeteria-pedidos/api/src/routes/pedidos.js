const router = require('express').Router();
const supabase = require('../supabase');
const {
  ESTADOS, asyncHandler, checkDb, parseId, HttpError, redondear,
  validarPedidoNuevo, validarPedidoEdicion,
} = require('../utils');

const SELECT = '*, detalle_pedido(*)';

async function obtenerPedido(id) {
  const { data, error } = await supabase.from('pedidos').select(SELECT).eq('id', id).maybeSingle();
  checkDb(error);
  if (!data) throw new HttpError(404, 'Pedido no encontrado');
  return data;
}

// GET /api/pedidos?estado=pendiente
router.get('/', asyncHandler(async (req, res) => {
  let query = supabase.from('pedidos').select(SELECT).order('created_at', { ascending: false });
  if (req.query.estado) {
    if (!ESTADOS.includes(req.query.estado)) throw new HttpError(400, 'Estado inválido');
    query = query.eq('estado', req.query.estado);
  }
  const { data, error } = await query;
  checkDb(error);
  res.json(data);
}));

// GET /api/pedidos/:id
router.get('/:id', asyncHandler(async (req, res) => {
  res.json(await obtenerPedido(parseId(req.params.id)));
}));

// POST /api/pedidos  { cliente, mesa, notas?, items: [{ producto_id, cantidad }] }
// El precio y el total se calculan en el servidor con los datos de la BD (no se confía en el cliente)
router.post('/', asyncHandler(async (req, res) => {
  const { cliente, mesa, notas, items } = validarPedidoNuevo(req.body);

  // Une líneas repetidas del mismo producto
  const cantidades = new Map();
  for (const it of items) cantidades.set(it.producto_id, (cantidades.get(it.producto_id) || 0) + it.cantidad);

  const { data: productos, error: errProd } = await supabase
    .from('productos').select('id, nombre, precio, disponible').in('id', [...cantidades.keys()]);
  checkDb(errProd);
  const porId = new Map(productos.map((p) => [p.id, p]));

  const lineas = [];
  for (const [id, cantidad] of cantidades) {
    const p = porId.get(id);
    if (!p) throw new HttpError(400, `El producto ${id} no existe`);
    if (!p.disponible) throw new HttpError(400, `"${p.nombre}" no está disponible`);
    const precio = Number(p.precio);
    lineas.push({
      producto_id: id,
      nombre_producto: p.nombre,
      precio_unitario: precio,
      cantidad,
      subtotal: redondear(precio * cantidad),
    });
  }
  const total = redondear(lineas.reduce((s, l) => s + l.subtotal, 0));

  const { data: pedido, error: errPedido } = await supabase
    .from('pedidos').insert({ cliente, mesa, notas, total }).select().single();
  checkDb(errPedido);

  const { error: errDetalle } = await supabase
    .from('detalle_pedido').insert(lineas.map((l) => ({ ...l, pedido_id: pedido.id })));
  if (errDetalle) {
    await supabase.from('pedidos').delete().eq('id', pedido.id); // deshace el pedido si falla el detalle
    checkDb(errDetalle);
  }

  res.status(201).json(await obtenerPedido(pedido.id));
}));

// PUT /api/pedidos/:id  { cliente?, mesa?, notas?, estado? }
router.put('/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const cambios = validarPedidoEdicion(req.body);
  const { data, error } = await supabase.from('pedidos').update(cambios).eq('id', id).select('id');
  checkDb(error);
  if (!data || data.length === 0) throw new HttpError(404, 'Pedido no encontrado');
  res.json(await obtenerPedido(id));
}));

// PATCH /api/pedidos/:id/estado  { estado }
router.patch('/:id/estado', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const { estado } = validarPedidoEdicion({ estado: req.body?.estado });
  const { data, error } = await supabase.from('pedidos').update({ estado }).eq('id', id).select('id');
  checkDb(error);
  if (!data || data.length === 0) throw new HttpError(404, 'Pedido no encontrado');
  res.json(await obtenerPedido(id));
}));

// DELETE /api/pedidos/:id  (el detalle se elimina en cascada)
router.delete('/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const { data, error } = await supabase.from('pedidos').delete().eq('id', id).select('id');
  checkDb(error);
  if (!data || data.length === 0) throw new HttpError(404, 'Pedido no encontrado');
  res.status(204).end();
}));

module.exports = router;
