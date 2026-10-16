import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

const CarritoContext = createContext(null);

export function CarritoProvider({ children }) {
  const [items, setItems] = useState([]); // [{ producto, cantidad }]

  const agregar = useCallback((producto) => {
    setItems((prev) => {
      const existe = prev.find((i) => i.producto.id === producto.id);
      if (existe) {
        return prev.map((i) => (i.producto.id === producto.id ? { ...i, cantidad: Math.min(i.cantidad + 1, 20) } : i));
      }
      return [...prev, { producto, cantidad: 1 }];
    });
  }, []);

  const cambiarCantidad = useCallback((id, delta) => {
    setItems((prev) =>
      prev
        .map((i) => (i.producto.id === id ? { ...i, cantidad: Math.min(i.cantidad + delta, 20) } : i))
        .filter((i) => i.cantidad > 0)
    );
  }, []);

  const quitar = useCallback((id) => setItems((prev) => prev.filter((i) => i.producto.id !== id)), []);
  const vaciar = useCallback(() => setItems([]), []);

  const total = useMemo(() => items.reduce((s, i) => s + Number(i.producto.precio) * i.cantidad, 0), [items]);
  const cantidadTotal = useMemo(() => items.reduce((s, i) => s + i.cantidad, 0), [items]);

  const value = useMemo(
    () => ({ items, agregar, cambiarCantidad, quitar, vaciar, total, cantidadTotal }),
    [items, agregar, cambiarCantidad, quitar, vaciar, total, cantidadTotal]
  );

  return <CarritoContext.Provider value={value}>{children}</CarritoContext.Provider>;
}

export const useCarrito = () => {
  const ctx = useContext(CarritoContext);
  if (!ctx) throw new Error('useCarrito debe usarse dentro de CarritoProvider');
  return ctx;
};
