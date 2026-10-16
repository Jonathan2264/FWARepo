import React, { useState, useCallback, useMemo, useLayoutEffect } from 'react';
import { View, Text, FlatList, TextInput, Alert, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/client';
import { useCarrito } from '../context/CarritoContext';
import { Chip, Cargando, Vacio, ErrorBox } from '../components/UI';
import { colors, moneda } from '../theme';

export default function MenuScreen({ navigation }) {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [catSel, setCatSel] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(null);
  const { agregar } = useCarrito();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('ProductoForm')} style={{ marginRight: 14 }}>
          <Ionicons name="add-circle" size={30} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const cargar = useCallback(async () => {
    try {
      setError(null);
      const [p, c] = await Promise.all([api.listarProductos(), api.listarCategorias()]);
      setProductos(p);
      setCategorias(c);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  // Recarga cada vez que la pantalla gana foco (p. ej. al volver del formulario)
  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return productos.filter(
      (p) => (!catSel || p.categoria_id === catSel) && (!q || p.nombre.toLowerCase().includes(q))
    );
  }, [productos, catSel, busqueda]);

  const confirmarEliminar = (p) => {
    Alert.alert('Eliminar producto', `¿Eliminar "${p.nombre}" del menú?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try {
            await api.eliminarProducto(p.id);
            setProductos((prev) => prev.filter((x) => x.id !== p.id));
          } catch (e) {
            Alert.alert('No se pudo eliminar', e.message);
          }
        },
      },
    ]);
  };

  if (cargando) return <Cargando texto="Cargando menú..." />;
  if (error && productos.length === 0) return <ErrorBox mensaje={error} onReintentar={() => { setCargando(true); cargar(); }} />;

  return (
    <View style={s.contenedor}>
      <TextInput
        style={s.buscador}
        placeholder="Buscar producto..."
        placeholderTextColor={colors.muted}
        value={busqueda}
        onChangeText={setBusqueda}
      />
      <View style={{ height: 44 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, alignItems: 'center' }}>
          <Chip label="Todos" activo={catSel === null} onPress={() => setCatSel(null)} />
          {categorias.map((c) => (
            <Chip key={c.id} label={c.nombre} activo={catSel === c.id} onPress={() => setCatSel(c.id)} />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={visibles}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ padding: 12, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => { setRefrescando(true); cargar(); }} />}
        ListEmptyComponent={<Vacio texto="No hay productos para mostrar." />}
        renderItem={({ item: p }) => (
          <View style={[s.card, !p.disponible && { opacity: 0.55 }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.nombre}>{p.nombre}</Text>
              {!!p.descripcion && <Text style={s.desc}>{p.descripcion}</Text>}
              <Text style={s.meta}>
                {p.categorias?.nombre || 'Sin categoría'}{!p.disponible ? ' · No disponible' : ''}
              </Text>
              <Text style={s.precio}>{moneda(p.precio)}</Text>
            </View>
            <View style={s.acciones}>
              <TouchableOpacity
                disabled={!p.disponible}
                onPress={() => agregar(p)}
                style={[s.btnAgregar, !p.disponible && { backgroundColor: colors.muted }]}
              >
                <Ionicons name="add" size={22} color="#fff" />
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', marginTop: 10 }}>
                <TouchableOpacity onPress={() => navigation.navigate('ProductoForm', { producto: p })} style={{ marginRight: 14 }}>
                  <Ionicons name="create-outline" size={22} color={colors.info} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmarEliminar(p)}>
                  <Ionicons name="trash-outline" size={22} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colors.bg },
  buscador: {
    margin: 12, marginBottom: 8, backgroundColor: colors.card, borderRadius: 10, borderWidth: 1,
    borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, color: colors.text,
  },
  card: {
    flexDirection: 'row', backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  nombre: { fontSize: 16, fontWeight: '700', color: colors.text },
  desc: { color: colors.muted, marginTop: 2 },
  meta: { color: colors.accent, fontSize: 12, marginTop: 4, fontWeight: '600' },
  precio: { fontSize: 17, fontWeight: '800', color: colors.primary, marginTop: 6 },
  acciones: { alignItems: 'flex-end', justifyContent: 'space-between' },
  btnAgregar: { backgroundColor: colors.primary, width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});
