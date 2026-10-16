import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, Alert, StyleSheet } from 'react-native';
import { api } from '../api/client';
import { Boton, Campo, EstadoBadge, Cargando, ErrorBox } from '../components/UI';
import { colors, moneda, siguienteEstado, capitalizar } from '../theme';

export default function PedidoDetalleScreen({ route, navigation }) {
  const { id } = route.params;
  const [pedido, setPedido] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [trabajando, setTrabajando] = useState(false);

  const [editando, setEditando] = useState(false);
  const [cliente, setCliente] = useState('');
  const [mesa, setMesa] = useState('');
  const [notas, setNotas] = useState('');
  const [errores, setErrores] = useState({});

  const cargar = useCallback(async () => {
    try {
      setError(null);
      setPedido(await api.obtenerPedido(id));
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

  const ejecutar = async (accion) => {
    try {
      setTrabajando(true);
      await accion();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setTrabajando(false);
    }
  };

  const cambiarEstado = (estado) => ejecutar(async () => setPedido(await api.cambiarEstado(id, estado)));

  const cancelar = () =>
    Alert.alert('Cancelar pedido', '¿Seguro que quieres cancelar este pedido?', [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, cancelar', style: 'destructive', onPress: () => cambiarEstado('cancelado') },
    ]);

  const eliminar = () =>
    Alert.alert('Eliminar pedido', 'Se borrará el pedido y su detalle de forma permanente.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: () => ejecutar(async () => { await api.eliminarPedido(id); navigation.goBack(); }),
      },
    ]);

  const iniciarEdicion = () => {
    setCliente(pedido.cliente); setMesa(String(pedido.mesa)); setNotas(pedido.notas || ''); setErrores({}); setEditando(true);
  };

  const guardarEdicion = () => {
    const e = {};
    if (cliente.trim().length < 2) e.cliente = 'Mínimo 2 caracteres';
    const m = Number(mesa);
    if (!mesa.trim() || !Number.isInteger(m) || m < 1 || m > 99) e.mesa = 'Entero entre 1 y 99';
    setErrores(e);
    if (Object.keys(e).length) return;
    ejecutar(async () => {
      setPedido(await api.actualizarPedido(id, { cliente: cliente.trim(), mesa: m, notas: notas.trim() || null }));
      setEditando(false);
    });
  };

  if (cargando) return <Cargando />;
  if (error) return <ErrorBox mensaje={error} onReintentar={() => { setCargando(true); cargar(); }} />;

  const siguiente = siguienteEstado[pedido.estado];
  const abierto = pedido.estado !== 'entregado' && pedido.estado !== 'cancelado';

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <View style={s.encabezado}>
        <Text style={s.titulo}>Pedido #{pedido.id}</Text>
        <EstadoBadge estado={pedido.estado} />
      </View>
      <Text style={{ color: colors.muted, marginBottom: 14 }}>{new Date(pedido.created_at).toLocaleString('es-SV')}</Text>

      {editando ? (
        <View>
          <Campo label="Cliente" value={cliente} onChangeText={setCliente} error={errores.cliente} maxLength={60} />
          <Campo label="Mesa" value={mesa} onChangeText={setMesa} keyboardType="number-pad" error={errores.mesa} maxLength={2} />
          <Campo label="Notas" value={notas} onChangeText={setNotas} multiline maxLength={200} />
          <Boton titulo="Guardar cambios" onPress={guardarEdicion} loading={trabajando} />
          <Boton titulo="Cancelar edición" tipo="secundario" onPress={() => setEditando(false)} style={{ marginTop: 8 }} />
        </View>
      ) : (
        <View style={s.caja}>
          <Text style={s.dato}>Cliente: <Text style={s.valor}>{pedido.cliente}</Text></Text>
          <Text style={s.dato}>Mesa: <Text style={s.valor}>{pedido.mesa}</Text></Text>
          <Text style={s.dato}>Notas: <Text style={s.valor}>{pedido.notas || '—'}</Text></Text>
        </View>
      )}

      <Text style={s.seccion}>Productos</Text>
      <View style={s.caja}>
        {pedido.detalle_pedido.map((d) => (
          <View key={d.id} style={s.fila}>
            <Text style={{ flex: 1, color: colors.text }}>{d.cantidad} × {d.nombre_producto}</Text>
            <Text style={{ fontWeight: '700', color: colors.text }}>{moneda(d.subtotal)}</Text>
          </View>
        ))}
        <View style={[s.fila, { borderTopWidth: 1, borderColor: colors.border, marginTop: 6, paddingTop: 10 }]}>
          <Text style={{ flex: 1, fontWeight: '800', fontSize: 16, color: colors.text }}>Total</Text>
          <Text style={{ fontWeight: '800', fontSize: 18, color: colors.primary }}>{moneda(pedido.total)}</Text>
        </View>
      </View>

      {!editando && (
        <View style={{ marginTop: 18 }}>
          {siguiente && <Boton titulo={`Marcar como ${capitalizar(siguiente)}`} onPress={() => cambiarEstado(siguiente)} loading={trabajando} />}
          {abierto && <Boton titulo="Editar datos del pedido" tipo="secundario" onPress={iniciarEdicion} style={{ marginTop: 10 }} />}
          {abierto && <Boton titulo="Cancelar pedido" tipo="secundario" onPress={cancelar} disabled={trabajando} style={{ marginTop: 10 }} />}
          <Boton titulo="Eliminar pedido" tipo="peligro" onPress={eliminar} disabled={trabajando} style={{ marginTop: 10 }} />
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titulo: { fontSize: 22, fontWeight: '800', color: colors.text },
  caja: { backgroundColor: colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.border },
  dato: { color: colors.muted, marginBottom: 4 },
  valor: { color: colors.text, fontWeight: '600' },
  seccion: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 18, marginBottom: 8 },
  fila: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
});
