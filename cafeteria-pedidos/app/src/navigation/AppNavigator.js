import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import MenuScreen from '../screens/MenuScreen';
import CarritoScreen from '../screens/CarritoScreen';
import PedidosScreen from '../screens/PedidosScreen';
import ProductoFormScreen from '../screens/ProductoFormScreen';
import PedidoDetalleScreen from '../screens/PedidoDetalleScreen';
import { useCarrito } from '../context/CarritoContext';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const headerStyle = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '700' },
};

function Tabs() {
  const { cantidadTotal } = useCarrito();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...headerStyle,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: ({ color, size }) => {
          const icono = { Menu: 'cafe', Carrito: 'cart', Pedidos: 'receipt' }[route.name];
          return <Ionicons name={icono} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Menu" component={MenuScreen} options={{ title: 'Menú' }} />
      <Tab.Screen
        name="Carrito"
        component={CarritoScreen}
        options={{ title: 'Carrito', tabBarBadge: cantidadTotal > 0 ? cantidadTotal : undefined }}
      />
      <Tab.Screen name="Pedidos" component={PedidosScreen} options={{ title: 'Pedidos' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={headerStyle}>
      <Stack.Screen name="Inicio" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="ProductoForm" component={ProductoFormScreen} options={{ title: 'Producto' }} />
      <Stack.Screen name="PedidoDetalle" component={PedidoDetalleScreen} options={{ title: 'Detalle del pedido' }} />
    </Stack.Navigator>
  );
}
