import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation';
import { DataProvider } from './src/context/DataContext';

export default function App() {
  return (
    <>
      <StatusBar style="dark" />
      <DataProvider><AppNavigator /></DataProvider>
    </>
  );
}
