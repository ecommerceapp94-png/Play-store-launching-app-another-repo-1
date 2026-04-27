import React from 'react';
import { StatusBar, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/context/ThemeContext';
import { AppNavigator } from './src/navigation/AppNavigator';

// Ignore specific warnings that might clutter the console
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'findNodeHandle is deprecated',
  'Sending `onAnimatedValueUpdate` with no listeners registered',
]);

// ============================================================================
// PRO BROWSER ELITE - Main Application Entry Point
// ============================================================================

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
          <AppNavigator />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
