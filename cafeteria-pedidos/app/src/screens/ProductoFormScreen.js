import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, Switch, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { api } from '../api/client';
import { Boton, Campo, Chip } from '../components/UI';
import { colors } from '../theme';

export default function ProductoFormScreen({ route, navigation }) {
  const editando = route.params?.producto;
  const [nombre, setNombre] = useState(editando?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(editando?.descripcion ?? '');
  const [precio, setPrecio] = useState(editando ? String(editando.precio) : '');
  const [categoriaId, setCategoriaId] = useState(editando?.categoria_id ?? null);
  const [disponible, setDisponible] = useState(editando?.disponible ?? true);
  const [categorias, setCategorias] = useState([]);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: editando ? 'Editar producto' : 'Nuevo producto' });
    api.listarCategorias().then(setCategorias).catch((e) => Alert.alert('Error', e.message));
  }, [editando, navigation]);

  const validar = () => {
    const e = {};
    if (nombre.trim().length < 2) e.nombre = 'El nombre debe tener al menos 2 caracteres';
    if (nombre.trim().length > 80) e.nombre = 'Máximo 80 caracteres';
    const p = Number(precio.replace(',', '.'));
    if (!precio.trim() || !Number.isFinite(p) || p <= 0) e.precio = 'Ingresa un precio mayor que 0 (ej. 2.50)';
    else if (p > 999) e.precio = 'El precio máximo es 999';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const guardar = async () => {
    if (!validar()) return;
    const datos = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      precio: Number(precio.replace(',', '.')),
      categoria_id: categoriaId,
      disponible,
    };
    try {
      setGuardando(true);
      if (editando) await api.actualizarProducto(editando.id, datos);
      else await api.crearProducto(datos);
      Alert.alert('Listo', editando ? 'Producto actualizado' : 'Producto creado', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('No se pudo guardar', e.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Campo label="Nombre *" value={nombre} onChangeText={setNombre} placeholder="Ej. Capuchino" error={errores.nombre} maxLength={80} />
        <Campo label="Descripción" value={descripcion} onChangeText={setDescripcion} placeholder="Opcional" multiline maxLength={200} />
        <Campo label="Precio (USD) *" value={precio} onChangeText={setPrecio} placeholder="0.00" keyboardType="decimal-pad" error={errores.precio} />

        <Text style={{ fontWeight: '600', color: colors.text, marginBottom: 8 }}>Categoría</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
          <Chip label="Sin categoría" activo={categoriaId === null} onPress={() => setCategoriaId(null)} />
          {categorias.map((c) => (
            <Chip key={c.id} label={c.nombre} activo={categoriaId === c.id} onPress={() => setCategoriaId(c.id)} />
          ))}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 14 }}>
          <Text style={{ fontWeight: '600', color: colors.text }}>Disponible para la venta</Text>
          <Switch value={disponible} onValueChange={setDisponible} trackColor={{ true: colors.accent, false: colors.border }} thumbColor={disponible ? colors.primary : '#f4f3f4'} />
        </View>

        <Boton titulo={editando ? 'Guardar cambios' : 'Crear producto'} onPress={guardar} loading={guardando} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
