import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { CarritoProvider } from './src/context/CarritoContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <CarritoProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <AppNavigator />
      </NavigationContainer>
    </CarritoProvider>
  );
}
