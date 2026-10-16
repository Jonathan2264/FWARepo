import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/client';
import { useCarrito } from '../context/CarritoContext';
import { Boton, Campo, Vacio } from '../components/UI';
import { colors, moneda } from '../theme';

export default function CarritoScreen({ navigation }) {
  const { items, cambiarCantidad, quitar, vaciar, total } = useCarrito();
  const [cliente, setCliente] = useState('');
  const [mesa, setMesa] = useState('');
  const [notas, setNotas] = useState('');
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  if (items.length === 0) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }}><Vacio emoji="🛒" texto="Tu carrito está vacío. Agrega productos desde el Menú." /></View>;
  }

  const validar = () => {
    const e = {};
    if (cliente.trim().length < 2) e.cliente = 'Ingresa el nombre del cliente (mín. 2 caracteres)';
    const m = Number(mesa);
    if (!mesa.trim() || !Number.isInteger(m) || m < 1 || m > 99) e.mesa = 'La mesa debe ser un número entero entre 1 y 99';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const confirmar = async () => {
    if (!validar()) return;
    try {
      setEnviando(true);
      const pedido = await api.crearPedido({
        cliente: cliente.trim(),
        mesa: Number(mesa),
        notas: notas.trim() || null,
        items: items.map((i) => ({ producto_id: i.producto.id, cantidad: i.cantidad })),
      });
      vaciar();
      setCliente(''); setMesa(''); setNotas(''); setErrores({});
      Alert.alert('Pedido registrado', `Pedido #${pedido.id} por ${moneda(pedido.total)}`);
      navigation.navigate('Pedidos');
    } catch (e) {
      Alert.alert('No se pudo registrar el pedido', e.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        {items.map(({ producto, cantidad }) => (
          <View key={producto.id} style={s.linea}>
            <View style={{ flex: 1 }}>
              <Text style={s.nombre}>{producto.nombre}</Text>
              <Text style={{ color: colors.muted }}>{moneda(producto.precio)} c/u · {moneda(Number(producto.precio) * cantidad)}</Text>
            </View>
            <View style={s.contador}>
              <TouchableOpacity onPress={() => cambiarCantidad(producto.id, -1)}><Ionicons name="remove-circle" size={28} color={colors.primary} /></TouchableOpacity>
              <Text style={s.cant}>{cantidad}</Text>
              <TouchableOpacity onPress={() => cambiarCantidad(producto.id, 1)}><Ionicons name="add-circle" size={28} color={colors.primary} /></TouchableOpacity>
              <TouchableOpacity onPress={() => quitar(producto.id)} style={{ marginLeft: 10 }}><Ionicons name="trash-outline" size={22} color={colors.danger} /></TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={s.totalBox}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>Total</Text>
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.primary }}>{moneda(total)}</Text>
        </View>

        <Campo label="Nombre del cliente *" value={cliente} onChangeText={setCliente} placeholder="Ej. María López" error={errores.cliente} maxLength={60} />
        <Campo label="Número de mesa *" value={mesa} onChangeText={setMesa} placeholder="Ej. 4" keyboardType="number-pad" error={errores.mesa} maxLength={2} />
        <Campo label="Notas" value={notas} onChangeText={setNotas} placeholder="Ej. Sin azúcar" multiline maxLength={200} />

        <Boton titulo="Confirmar pedido" onPress={confirmar} loading={enviando} />
        <Boton titulo="Vaciar carrito" tipo="secundario" onPress={() => Alert.alert('Vaciar carrito', '¿Quitar todos los productos?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Vaciar', style: 'destructive', onPress: vaciar }])} style={{ marginTop: 10 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  linea: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  nombre: { fontSize: 15, fontWeight: '700', color: colors.text },
  contador: { flexDirection: 'row', alignItems: 'center' },
  cant: { minWidth: 26, textAlign: 'center', fontWeight: '700', fontSize: 16, color: colors.text },
  totalBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, marginBottom: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border },
});
