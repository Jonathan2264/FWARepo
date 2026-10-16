import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';
import { Chip, EstadoBadge, Cargando, Vacio, ErrorBox } from '../components/UI';
import { colors, moneda, ESTADOS, capitalizar } from '../theme';

export default function PedidosScreen({ navigation }) {
  const [pedidos, setPedidos] = useState([]);
  const [filtro, setFiltro] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(async (estado) => {
    try {
      setError(null);
      setPedidos(await api.listarPedidos(estado));
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargar(filtro); }, [cargar, filtro]));

  const cambiarFiltro = (estado) => { setFiltro(estado); setCargando(true); };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ height: 52, paddingTop: 8 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, alignItems: 'center' }}>
          <Chip label="Todos" activo={filtro === null} onPress={() => cambiarFiltro(null)} />
          {ESTADOS.map((e) => <Chip key={e} label={capitalizar(e)} activo={filtro === e} onPress={() => cambiarFiltro(e)} />)}
        </ScrollView>
      </View>

      {cargando ? <Cargando texto="Cargando pedidos..." /> : error ? (
        <ErrorBox mensaje={error} onReintentar={() => { setCargando(true); cargar(filtro); }} />
      ) : (
        <FlatList
          data={pedidos}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={{ padding: 12, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => { setRefrescando(true); cargar(filtro); }} />}
          ListEmptyComponent={<Vacio emoji="🧾" texto="No hay pedidos todavía." />}
          renderItem={({ item: p }) => (
            <TouchableOpacity style={s.card} onPress={() => navigation.navigate('PedidoDetalle', { id: p.id })} activeOpacity={0.8}>
              <View style={{ flex: 1 }}>
                <Text style={s.titulo}>Pedido #{p.id} · Mesa {p.mesa}</Text>
                <Text style={{ color: colors.text }}>{p.cliente}</Text>
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                  {new Date(p.created_at).toLocaleString('es-SV')} · {p.detalle_pedido?.length || 0} producto(s)
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.total}>{moneda(p.total)}</Text>
                <EstadoBadge estado={p.estado} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  titulo: { fontSize: 16, fontWeight: '700', color: colors.text },
  total: { fontSize: 17, fontWeight: '800', color: colors.primary, marginBottom: 6 },
});
