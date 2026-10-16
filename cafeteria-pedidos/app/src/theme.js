export const colors = {
  primary: '#6F4E37',
  primaryDark: '#4B3425',
  accent: '#C8A27A',
  bg: '#FAF6F1',
  card: '#FFFFFF',
  text: '#2B1D14',
  muted: '#8A7868',
  border: '#E8DDD0',
  danger: '#C0392B',
  success: '#2E7D32',
  warning: '#E08A00',
  info: '#1E6FB8',
};

export const ESTADOS = ['pendiente', 'preparando', 'listo', 'entregado', 'cancelado'];

export const estadoColor = {
  pendiente: colors.warning,
  preparando: colors.info,
  listo: colors.success,
  entregado: colors.muted,
  cancelado: colors.danger,
};

// Flujo normal de un pedido
export const siguienteEstado = {
  pendiente: 'preparando',
  preparando: 'listo',
  listo: 'entregado',
};

export const moneda = (n) => `$${Number(n || 0).toFixed(2)}`;
export const capitalizar = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : '');
