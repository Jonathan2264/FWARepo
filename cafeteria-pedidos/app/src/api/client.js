import { API_URL } from '../config';

const TIMEOUT_MS = 20000;

// Función base: agrega timeout, parsea JSON y convierte los fallos en mensajes legibles
async function request(path, { method = 'GET', body } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    let data = null;
    try { data = await res.json(); } catch { /* respuestas 204 no traen cuerpo */ }
    if (!res.ok) throw new Error(data?.error || `Error del servidor (${res.status})`);
    return data;
  } catch (e) {
        if (e.name === 'AbortError' || /cancel|abort/i.test(String(e.message))) {
      throw new Error('El servidor tardó demasiado en responder. Revisa tu conexión.');
    }
    if (e.message === 'Network request failed') {
      throw new Error('No se pudo conectar con la API. Verifica que esté encendida y que API_URL sea correcta.');
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  // Categorías
  listarCategorias: () => request('/categorias'),

  // Productos (CRUD)
  listarProductos: () => request('/productos'),
  obtenerProducto: (id) => request(`/productos/${id}`),
  crearProducto: (producto) => request('/productos', { method: 'POST', body: producto }),
  actualizarProducto: (id, producto) => request(`/productos/${id}`, { method: 'PUT', body: producto }),
  eliminarProducto: (id) => request(`/productos/${id}`, { method: 'DELETE' }),

  // Pedidos (CRUD)
  listarPedidos: (estado) => request(`/pedidos${estado ? `?estado=${estado}` : ''}`),
  obtenerPedido: (id) => request(`/pedidos/${id}`),
  crearPedido: (pedido) => request('/pedidos', { method: 'POST', body: pedido }),
  actualizarPedido: (id, cambios) => request(`/pedidos/${id}`, { method: 'PUT', body: cambios }),
  cambiarEstado: (id, estado) => request(`/pedidos/${id}/estado`, { method: 'PATCH', body: { estado } }),
  eliminarPedido: (id) => request(`/pedidos/${id}`, { method: 'DELETE' }),
};
