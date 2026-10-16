import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, TextInput, StyleSheet } from 'react-native';
import { colors, estadoColor, capitalizar } from '../theme';

export function Boton({ titulo, onPress, tipo = 'primario', disabled, loading, style }) {
  const bg = tipo === 'peligro' ? colors.danger : tipo === 'secundario' ? 'transparent' : colors.primary;
  const txt = tipo === 'secundario' ? colors.primary : '#fff';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        s.boton,
        { backgroundColor: bg, opacity: disabled || loading ? 0.6 : 1 },
        tipo === 'secundario' && { borderWidth: 1.5, borderColor: colors.primary },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={txt} /> : <Text style={[s.botonTxt, { color: txt }]}>{titulo}</Text>}
    </TouchableOpacity>
  );
}

export function Chip({ label, activo, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.chip, activo && s.chipActivo]} activeOpacity={0.8}>
      <Text style={[s.chipTxt, activo && { color: '#fff' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function EstadoBadge({ estado }) {
  return (
    <View style={[s.badge, { backgroundColor: estadoColor[estado] || colors.muted }]}>
      <Text style={s.badgeTxt}>{capitalizar(estado)}</Text>
    </View>
  );
}

export function Cargando({ texto = 'Cargando...' }) {
  return (
    <View style={s.centro}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ color: colors.muted, marginTop: 10 }}>{texto}</Text>
    </View>
  );
}

export function Vacio({ emoji = '☕', texto }) {
  return (
    <View style={s.centro}>
      <Text style={{ fontSize: 44 }}>{emoji}</Text>
      <Text style={{ color: colors.muted, marginTop: 8, textAlign: 'center' }}>{texto}</Text>
    </View>
  );
}

export function ErrorBox({ mensaje, onReintentar }) {
  return (
    <View style={s.centro}>
      <Text style={{ fontSize: 40 }}>⚠️</Text>
      <Text style={{ color: colors.danger, textAlign: 'center', marginVertical: 10 }}>{mensaje}</Text>
      {onReintentar && <Boton titulo="Reintentar" onPress={onReintentar} style={{ minWidth: 140 }} />}
    </View>
  );
}

export function Campo({ label, error, style, ...props }) {
  return (
    <View style={[{ marginBottom: 14 }, style]}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        style={[s.input, error && { borderColor: colors.danger }]}
        {...props}
      />
      {!!error && <Text style={s.error}>{error}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  boton: { paddingVertical: 13, paddingHorizontal: 18, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  botonTxt: { fontWeight: '700', fontSize: 15 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border, marginRight: 8,
  },
  chipActivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTxt: { color: colors.text, fontWeight: '600', fontSize: 13 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  badgeTxt: { color: '#fff', fontWeight: '700', fontSize: 12 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  label: { fontWeight: '600', color: colors.text, marginBottom: 6 },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.text,
  },
  error: { color: colors.danger, fontSize: 12, marginTop: 4 },
});
