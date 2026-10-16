const router = require('express').Router();
const supabase = require('../supabase');
const { asyncHandler, checkDb, HttpError } = require('../utils');

// GET /api/categorias
router.get('/', asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('categorias').select('*').order('nombre');
  checkDb(error);
  res.json(data);
}));

// POST /api/categorias  { nombre }
router.post('/', asyncHandler(async (req, res) => {
  const nombre = String(req.body?.nombre ?? '').trim();
  if (nombre.length < 2 || nombre.length > 40) {
    throw new HttpError(400, 'El nombre de la categoría debe tener entre 2 y 40 caracteres');
  }
  const { data, error } = await supabase.from('categorias').insert({ nombre }).select().single();
  checkDb(error);
  res.status(201).json(data);
}));

module.exports = router;
