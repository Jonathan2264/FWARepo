const router = require('express').Router();
const supabase = require('../supabase');
const { asyncHandler, checkDb, parseId, HttpError, validarProducto } = require('../utils');

const SELECT = '*, categorias(id, nombre)';

// GET /api/productos?categoria_id=1&q=cafe
router.get('/', asyncHandler(async (req, res) => {
  let query = supabase.from('productos').select(SELECT).order('nombre');
  if (req.query.categoria_id) query = query.eq('categoria_id', parseId(req.query.categoria_id));
  if (req.query.q) query = query.ilike('nombre', `%${String(req.query.q).trim()}%`);
  const { data, error } = await query;
  checkDb(error);
  res.json(data);
}));

// GET /api/productos/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const { data, error } = await supabase.from('productos').select(SELECT).eq('id', id).maybeSingle();
  checkDb(error);
  if (!data) throw new HttpError(404, 'Producto no encontrado');
  res.json(data);
}));

// POST /api/productos
router.post('/', asyncHandler(async (req, res) => {
  const datos = validarProducto(req.body);
  const { data, error } = await supabase.from('productos').insert(datos).select(SELECT).single();
  checkDb(error);
  res.status(201).json(data);
}));

// PUT /api/productos/:id
router.put('/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const datos = validarProducto(req.body);
  const { data, error } = await supabase.from('productos').update(datos).eq('id', id).select(SELECT).maybeSingle();
  checkDb(error);
  if (!data) throw new HttpError(404, 'Producto no encontrado');
  res.json(data);
}));

// DELETE /api/productos/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const { data, error } = await supabase.from('productos').delete().eq('id', id).select('id');
  checkDb(error);
  if (!data || data.length === 0) throw new HttpError(404, 'Producto no encontrado');
  res.status(204).end();
}));

module.exports = router;
