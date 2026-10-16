// URL base de la API. Se define en app/.env (EXPO_PUBLIC_API_URL) o se cambia aquí.
// En un celular físico NO sirve "localhost": usa la IP local de la computadora.
// Emulador Android: http://10.0.2.2:3000/api
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:3000/api';
